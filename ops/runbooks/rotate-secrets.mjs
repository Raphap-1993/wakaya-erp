#!/usr/bin/env node
// Runbook ejecutable: rotacion de secretos cross-platform (Windows, Linux, macOS).
//
// Implementa providers reales via CLI oficial del proveedor:
//   - Vault KV v2
//   - AWS Secrets Manager
//   - GCP Secret Manager
//
// El script es seguro por defecto:
//   - Soporta `--mode` y los flags cortos historicos (`--dry-run`, `--apply`, etc.).
//   - Si el secret actual es un JSON estructurado, exige `--secret-property`
//     salvo que use el envelope estandar `{ current, previous }`.
//   - La verificacion sobre Kubernetes es best-effort: si `kubectl` no esta
//     disponible, la verificacion queda limitada al provider.

import crypto from "node:crypto";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const SUPPORTED_MODES = new Set([
  "dry-run",
  "apply",
  "verify",
  "retire-previous",
  "restore",
]);
const STRING_SECRET_KEYS = new Set(["value", "current", "secret", "password", "token"]);
const DEFAULT_SYNC_TIMEOUT_SECONDS = 300;
const DEFAULT_SYNC_POLL_INTERVAL_SECONDS = 5;

function parseArgs(argv) {
  const args = { provider: "vault" };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];

    if (flag === "-h" || flag === "--help") {
      args.help = true;
      continue;
    }
    if (flag === "--dry-run") {
      args.mode = "dry-run";
      continue;
    }
    if (flag === "--apply") {
      args.mode = "apply";
      continue;
    }
    if (flag === "--verify") {
      args.mode = "verify";
      continue;
    }
    if (flag === "--retire-previous") {
      args.mode = "retire-previous";
      continue;
    }
    if (flag === "--mode") {
      args.mode = value;
      i += 1;
      continue;
    }
    if (flag === "--target") {
      args.target = value;
      i += 1;
      continue;
    }
    if (flag === "--env") {
      args.env = value;
      i += 1;
      continue;
    }
    if (flag === "--provider") {
      args.provider = value;
      i += 1;
      continue;
    }
    if (flag === "--namespace") {
      args.namespace = value;
      i += 1;
      continue;
    }
    if (flag === "--restore") {
      args.mode = "restore";
      args.backupId = value;
      i += 1;
      continue;
    }
    if (flag === "--backup-id") {
      args.backupId = value;
      i += 1;
      continue;
    }
    if (flag === "--audit-log") {
      args.auditLog = value;
      i += 1;
      continue;
    }
    if (flag === "--kubeconfig") {
      args.kubeconfig = value;
      i += 1;
      continue;
    }
    if (flag === "--kubectl-context") {
      args.kubectlContext = value;
      i += 1;
      continue;
    }
    if (flag === "--external-secret-name") {
      args.externalSecretName = value;
      i += 1;
      continue;
    }
    if (flag === "--k8s-secret-name") {
      args.k8sSecretName = value;
      i += 1;
      continue;
    }
    if (flag === "--restart-selector") {
      args.restartSelector = value;
      i += 1;
      continue;
    }
    if (flag === "--secret-property") {
      args.secretProperty = value;
      i += 1;
      continue;
    }
    if (flag === "--kv-path") {
      args.kvPath = value;
      i += 1;
      continue;
    }
    if (flag === "--length") {
      args.length = Number(value);
      i += 1;
      continue;
    }
    if (flag === "--sync-timeout-seconds") {
      args.syncTimeoutSeconds = Number(value);
      i += 1;
      continue;
    }
    if (flag === "--sync-poll-interval-seconds") {
      args.syncPollIntervalSeconds = Number(value);
      i += 1;
      continue;
    }
    if (flag === "--no-k8s") {
      args.noK8s = true;
      continue;
    }
    throw new Error(`Argumento desconocido: ${flag}`);
  }
  return args;
}

function usage() {
  console.log(`Uso:
  node ops/runbooks/rotate-secrets.mjs --target <id> --env <dev|staging|prod>
      [--provider vault|aws|gcp]
      [--namespace <ns>] [--secret-property <key>]
      [--external-secret-name <name>] [--k8s-secret-name <name>]
      [--restart-selector <label-selector>] [--kubeconfig <path>] [--kubectl-context <ctx>]
      [--audit-log <file.jsonl>] [--kv-path <vault-prefix>] [--length <bytes>]
      [--sync-timeout-seconds <n>] [--sync-poll-interval-seconds <n>]
      (--dry-run|--apply|--verify|--retire-previous|--restore <backup-id>|--mode <mode> [--backup-id <id>])
`);
}

function commandExists(command) {
  const locator = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(locator, [command], { stdio: "ignore", shell: false });
  return result.status === 0;
}

function ensureTool(command) {
  if (!commandExists(command)) {
    throw new Error(`Herramienta requerida no disponible en PATH: ${command}`);
  }
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: options.capture ? "pipe" : "inherit",
    input: options.input,
    encoding: "utf8",
    shell: false,
    env: options.env ?? process.env,
  });

  if (options.allowFailure) {
    return result;
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} fallo con codigo ${result.status}: ${(result.stderr || "").trim()}`,
    );
  }

  return result;
}

function runJsonCommand(command, args, options = {}) {
  const result = runCommand(command, args, { ...options, capture: true });
  const payload = (result.stdout || "").trim();
  if (!payload) {
    return null;
  }
  try {
    return JSON.parse(payload);
  } catch (error) {
    throw new Error(`Salida JSON invalida de ${command}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function trimTrailingNewline(value) {
  return value == null ? value : value.replace(/\r?\n$/, "");
}

function tryParseJson(value) {
  if (typeof value !== "string") {
    return { ok: false, value: null };
  }
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch {
    return { ok: false, value: null };
  }
}

function generateSecretValue(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function providerResourceId(args) {
  if (args.provider === "vault") {
    const prefix = args.kvPath || process.env.SECRETS_KV_PATH || "secret";
    return `${prefix}/${args.env}/${args.target}`;
  }
  if (args.provider === "aws") {
    return process.env.SECRETS_PREFIX
      ? `${process.env.SECRETS_PREFIX}/${args.env}/${args.target}`
      : `${args.env}/${args.target}`;
  }
  if (args.provider === "gcp") {
    return process.env.SECRETS_PREFIX
      ? `${process.env.SECRETS_PREFIX}-${args.env}-${args.target}`
      : `${args.env}-${args.target}`;
  }
  return `${args.env}/${args.target}`;
}

function normalizeProviderRaw(raw) {
  if (raw == null) {
    return null;
  }
  const parsed = tryParseJson(raw);
  if (!parsed.ok || parsed.value == null || typeof parsed.value !== "object" || Array.isArray(parsed.value)) {
    return raw;
  }
  return JSON.stringify(parsed.value);
}

function readState(raw, secretProperty) {
  if (raw == null || raw === "") {
    return { format: "missing", raw: null, current: null, previous: null, payload: null };
  }

  const parsed = tryParseJson(raw);
  if (!parsed.ok) {
    return { format: "string", raw, current: raw, previous: null, payload: raw };
  }

  const payload = parsed.value;
  if (payload == null || typeof payload !== "object" || Array.isArray(payload)) {
    const current = String(payload);
    return { format: "scalar-json", raw, current, previous: null, payload };
  }

  if (typeof payload.current === "string") {
    return {
      format: "rotation-envelope",
      raw,
      current: payload.current,
      previous:
        typeof payload.previous === "string"
          ? payload.previous
          : typeof payload.secondary === "string"
            ? payload.secondary
            : null,
      payload,
    };
  }

  if (secretProperty) {
    if (typeof payload[secretProperty] !== "string") {
      throw new Error(
        `El secret actual es JSON, pero la propiedad ${secretProperty} no existe o no es string.`,
      );
    }
    return {
      format: "json-property",
      raw,
      current: payload[secretProperty],
      previous: null,
      payload,
      property: secretProperty,
    };
  }

  for (const key of STRING_SECRET_KEYS) {
    if (typeof payload[key] === "string") {
      return {
        format: "json-property",
        raw,
        current: payload[key],
        previous: null,
        payload,
        property: key,
      };
    }
  }

  throw new Error(
    "El secret actual es JSON estructurado. Usa --secret-property <clave> para indicar que campo rotar.",
  );
}

function buildRotatedRaw(state, newValue) {
  const now = new Date().toISOString();
  switch (state.format) {
    case "string":
    case "scalar-json":
      return newValue;
    case "rotation-envelope":
      return JSON.stringify(
        {
          ...state.payload,
          current: newValue,
          previous: state.current,
          rotatedAt: now,
        },
        null,
        2,
      );
    case "json-property":
      return JSON.stringify(
        {
          ...state.payload,
          [state.property]: newValue,
          rotatedAt: now,
        },
        null,
        2,
      );
    default:
      throw new Error(`Formato de secret no soportado para rotacion: ${state.format}`);
  }
}

function buildRetiredRaw(state) {
  if (state.format !== "rotation-envelope") {
    return null;
  }
  const payload = { ...state.payload };
  delete payload.previous;
  delete payload.secondary;
  payload.retiredPreviousAt = new Date().toISOString();
  return JSON.stringify(payload, null, 2);
}

function kubectlEnv(args) {
  if (!args.kubeconfig) {
    return process.env;
  }
  return {
    ...process.env,
    KUBECONFIG: args.kubeconfig,
  };
}

function kubectlCommand(args, extraArgs, options = {}) {
  ensureTool("kubectl");
  const baseArgs = [];
  if (args.kubectlContext) {
    baseArgs.push("--context", args.kubectlContext);
  }
  return runCommand("kubectl", [...baseArgs, ...extraArgs], {
    ...options,
    env: kubectlEnv(args),
  });
}

function kubectlJson(args, extraArgs) {
  const result = kubectlCommand(args, [...extraArgs, "-o", "json"], { capture: true });
  return JSON.parse(result.stdout);
}

function tryKubectlJson(args, extraArgs) {
  const result = kubectlCommand(args, [...extraArgs, "-o", "json"], {
    capture: true,
    allowFailure: true,
  });
  if (result.status !== 0) {
    return null;
  }
  return JSON.parse(result.stdout);
}

function resolveNamespace(args) {
  return args.namespace || args.env;
}

function maybeFindExternalSecret(args) {
  if (args.noK8s || !commandExists("kubectl")) {
    return null;
  }

  const namespace = resolveNamespace(args);
  const data = kubectlJson(args, ["get", "externalsecret", "-n", namespace]);
  const items = Array.isArray(data.items) ? data.items : [];
  return (
    items.find((item) => item.metadata?.name === args.externalSecretName) ||
    items.find((item) => item.spec?.target?.name === args.k8sSecretName) ||
    items.find((item) => item.spec?.target?.name === args.target) ||
    items.find((item) =>
      Array.isArray(item.spec?.data) &&
      item.spec.data.some((entry) => String(entry.remoteRef?.key || "").includes(args.target)),
    ) ||
    items.find((item) => String(item.metadata?.name || "").includes(args.target)) ||
    null
  );
}

function externalSecretReady(externalSecret) {
  const conditions = externalSecret?.status?.conditions;
  if (!Array.isArray(conditions)) {
    return false;
  }
  return conditions.some((condition) => condition.type === "Ready" && condition.status === "True");
}

function forceExternalSecretSync(args, externalSecret) {
  if (!externalSecret) {
    return false;
  }
  const namespace = resolveNamespace(args);
  kubectlCommand(args, [
    "annotate",
    "externalsecret",
    externalSecret.metadata.name,
    "-n",
    namespace,
    `force-sync=${Date.now()}`,
    "--overwrite",
  ]);
  return true;
}

function resolveK8sSecretName(args, externalSecret) {
  return args.k8sSecretName || externalSecret?.spec?.target?.name || args.target;
}

function readK8sSecret(args, externalSecret) {
  const namespace = resolveNamespace(args);
  const name = resolveK8sSecretName(args, externalSecret);
  const secret = kubectlJson(args, ["get", "secret", name, "-n", namespace]);
  return { name, secret };
}

function tryReadK8sSecret(args, externalSecret) {
  const namespace = resolveNamespace(args);
  const name = resolveK8sSecretName(args, externalSecret);
  const secret = tryKubectlJson(args, ["get", "secret", name, "-n", namespace]);
  return { name, secret };
}

function decodeBase64(value) {
  return Buffer.from(value, "base64").toString("utf8");
}

function findMatchingSecretValue(secret, expectedValue, secretProperty) {
  const expectedHash = sha256(expectedValue);
  const data = secret?.data ?? {};
  for (const [key, value] of Object.entries(data)) {
    const decoded = decodeBase64(String(value));
    if (sha256(decoded) === expectedHash) {
      return { key, value: decoded };
    }

    if (secretProperty) {
      const parsed = tryParseJson(decoded);
      if (parsed.ok && parsed.value && typeof parsed.value === "object" && !Array.isArray(parsed.value)) {
        if (typeof parsed.value[secretProperty] === "string" && sha256(parsed.value[secretProperty]) === expectedHash) {
          return { key, value: parsed.value[secretProperty] };
        }
      }
    }
  }
  return null;
}

function listWorkloads(args) {
  if (args.noK8s || !commandExists("kubectl")) {
    return [];
  }
  const namespace = resolveNamespace(args);
  const selector = args.restartSelector || `secret=${args.target}`;
  const resources = kubectlJson(args, ["get", "deployment,statefulset", "-n", namespace, "-l", selector]);
  return Array.isArray(resources.items) ? resources.items : [];
}

function rolloutWorkloads(args, workloads) {
  const namespace = resolveNamespace(args);
  for (const workload of workloads) {
    const kind = String(workload.kind || "").toLowerCase();
    const name = workload.metadata?.name;
    if (!kind || !name) {
      continue;
    }
    kubectlCommand(args, ["rollout", "restart", `${kind}/${name}`, "-n", namespace]);
  }
}

function waitForWorkloads(args, workloads) {
  const namespace = resolveNamespace(args);
  for (const workload of workloads) {
    const kind = String(workload.kind || "").toLowerCase();
    const name = workload.metadata?.name;
    if (!kind || !name) {
      continue;
    }
    kubectlCommand(args, ["rollout", "status", `${kind}/${name}`, "-n", namespace, "--timeout=5m"]);
  }
}

function sleepSync(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function waitForSecretConvergence(args, expectedValue, externalSecret) {
  const timeoutMs = (args.syncTimeoutSeconds ?? DEFAULT_SYNC_TIMEOUT_SECONDS) * 1000;
  const pollMs = (args.syncPollIntervalSeconds ?? DEFAULT_SYNC_POLL_INTERVAL_SECONDS) * 1000;
  const deadline = Date.now() + timeoutMs;
  const namespace = resolveNamespace(args);
  const externalSecretName = externalSecret?.metadata?.name || args.externalSecretName || null;
  const secretName = resolveK8sSecretName(args, externalSecret);
  let lastReason = `Kubernetes Secret ${secretName} aun no refleja el valor esperado.`;

  while (Date.now() <= deadline) {
    const latestExternalSecret = externalSecretName
      ? tryKubectlJson(args, ["get", "externalsecret", externalSecretName, "-n", namespace])
      : null;
    const { secret } = tryReadK8sSecret(args, externalSecret);
    const match = secret ? findMatchingSecretValue(secret, expectedValue, args.secretProperty) : null;
    const externalSecretIsReady = latestExternalSecret ? externalSecretReady(latestExternalSecret) : true;

    if (match && externalSecretIsReady) {
      return {
        externalSecret: latestExternalSecret,
        secretName,
        key: match.key,
      };
    }

    if (!secret) {
      lastReason = `Kubernetes Secret ${secretName} aun no existe o no es legible.`;
    } else if (!match) {
      lastReason = `Kubernetes Secret ${secretName} aun no converge al hash esperado.`;
    } else if (!externalSecretIsReady && externalSecretName) {
      lastReason = `ExternalSecret ${externalSecretName} aun no reporta Ready=True.`;
    }

    if (Date.now() + pollMs > deadline) {
      break;
    }
    sleepSync(pollMs);
  }

  throw new Error(
    `No hubo convergencia del secret en Kubernetes dentro de ${(timeoutMs / 1000)}s. ${lastReason}`,
  );
}

function buildAuditEntry(args, eventType, action, outcome, reason, changes = []) {
  return {
    entryId: crypto.randomUUID(),
    eventType,
    occurredOn: new Date().toISOString(),
    service: process.env.SERVICE_NAME || "ops.runbooks.rotate-secrets",
    env: args.env,
    actor: {
      type: process.env.GITHUB_ACTIONS ? "automation" : "user",
      id: process.env.GITHUB_ACTOR || process.env.USER || process.env.USERNAME || "unknown",
    },
    target: {
      type: "secret",
      id: args.target,
      attributes: {
        provider: args.provider,
        namespace: resolveNamespace(args),
      },
    },
    action,
    outcome,
    reason,
    changes,
  };
}

function writeAuditLog(args, entry) {
  if (args.auditLog) {
    fs.appendFileSync(args.auditLog, `${JSON.stringify(entry)}\n`, "utf8");
  }
  console.log(`[audit] ${JSON.stringify(entry)}`);
}

const providers = {
  vault: {
    validate() {
      ensureTool("vault");
    },
    readRaw(args, version) {
      const secretPath = providerResourceId(args);
      const versionArgs = version ? ["-version", String(version)] : [];
      const payload = runJsonCommand("vault", ["kv", "get", ...versionArgs, "-format=json", secretPath]);
      const data = payload?.data?.data ?? {};
      if (typeof data.value === "string" && Object.keys(data).length === 1) {
        return trimTrailingNewline(data.value);
      }
      return JSON.stringify(data);
    },
    writeRaw(args, raw) {
      const secretPath = providerResourceId(args);
      const parsed = tryParseJson(raw);
      const keyValues = [];
      if (parsed.ok && parsed.value && typeof parsed.value === "object" && !Array.isArray(parsed.value)) {
        for (const [key, value] of Object.entries(parsed.value)) {
          if (value === undefined || value === null) {
            continue;
          }
          keyValues.push(`${key}=${typeof value === "string" ? value : JSON.stringify(value)}`);
        }
      } else {
        keyValues.push(`value=${raw}`);
      }
      runCommand("vault", ["kv", "put", secretPath, ...keyValues]);
    },
  },
  aws: {
    validate() {
      ensureTool("aws");
    },
    readRaw(args, version) {
      const secretId = providerResourceId(args);
      const extra = version ? ["--version-id", String(version)] : [];
      const result = runCommand(
        "aws",
        [
          "secretsmanager",
          "get-secret-value",
          "--secret-id",
          secretId,
          ...extra,
          "--query",
          "SecretString",
          "--output",
          "text",
        ],
        { capture: true },
      );
      return trimTrailingNewline((result.stdout || "").trim());
    },
    writeRaw(args, raw) {
      const secretId = providerResourceId(args);
      runCommand("aws", [
        "secretsmanager",
        "put-secret-value",
        "--secret-id",
        secretId,
        "--secret-string",
        raw,
      ]);
    },
  },
  gcp: {
    validate() {
      ensureTool("gcloud");
    },
    readRaw(args, version) {
      const secretName = providerResourceId(args);
      const versionId = version ? String(version) : "latest";
      const result = runCommand(
        "gcloud",
        ["secrets", "versions", "access", versionId, "--secret", secretName],
        { capture: true },
      );
      return trimTrailingNewline(result.stdout || "");
    },
    writeRaw(args, raw) {
      const secretName = providerResourceId(args);
      runCommand(
        "gcloud",
        ["secrets", "versions", "add", secretName, "--data-file=-"],
        { input: raw },
      );
    },
  },
};

function doDryRun(args) {
  const provider = providers[args.provider];
  provider.validate();
  const raw = normalizeProviderRaw(provider.readRaw(args));
  const state = readState(raw, args.secretProperty);
  const externalSecret = maybeFindExternalSecret(args);
  const workloads = listWorkloads(args);

  console.log(`Dry-run: rotacion de secret ${args.target} en ${args.env} via ${args.provider}`);
  console.log(`Provider path/id: ${providerResourceId(args)}`);
  console.log(`Namespace: ${resolveNamespace(args)}`);
  console.log(`Formato detectado: ${state.format}`);
  console.log(`Hash actual: ${state.current ? sha256(state.current) : "<vacio>"}`);
  console.log(`Nueva longitud objetivo: ${(args.length || 32) * 4 / 3 | 0} chars aprox.`);
  console.log(`ExternalSecret: ${externalSecret?.metadata?.name || "<no detectado>"}`);
  console.log(`Kubernetes Secret: ${resolveK8sSecretName(args, externalSecret)}`);
  console.log(
    workloads.length > 0
      ? `Workloads a reiniciar: ${workloads.map((item) => `${item.kind}/${item.metadata?.name}`).join(", ")}`
      : "Workloads a reiniciar: <ninguno detectado con el selector actual>",
  );
  writeAuditLog(args, buildAuditEntry(args, "audit.secret.rotation_dry_run.v1", "read", "success"));
}

function doApply(args) {
  const provider = providers[args.provider];
  provider.validate();
  const raw = normalizeProviderRaw(provider.readRaw(args));
  const state = readState(raw, args.secretProperty);
  const value = generateSecretValue(args.length || 32);
  const nextRaw = buildRotatedRaw(state, value);

  provider.writeRaw(args, nextRaw);

  const changes = [
    { field: "secret.currentHash", before: state.current ? sha256(state.current) : null, after: sha256(value) },
  ];
  writeAuditLog(args, buildAuditEntry(args, "audit.secret.rotated.v1", "update", "success", null, changes));

  if (args.noK8s || !commandExists("kubectl")) {
    console.log("Rotacion aplicada en el provider. kubectl no disponible; se omiten sync y rollout.");
    return;
  }

  const externalSecret = maybeFindExternalSecret(args);
  const workloads = listWorkloads(args);
  if (forceExternalSecretSync(args, externalSecret)) {
    console.log(`ExternalSecret forzado a sync: ${externalSecret.metadata.name}`);
  } else {
    console.log("No se encontro ExternalSecret asociado; se omite force-sync.");
  }

  const convergence = waitForSecretConvergence(args, value, externalSecret);
  console.log(
    `Kubernetes Secret convergido: ${convergence.secretName}` +
      (convergence.key ? ` (key ${convergence.key})` : ""),
  );

  if (workloads.length > 0) {
    rolloutWorkloads(args, workloads);
    waitForWorkloads(args, workloads);
    console.log(`Workloads reiniciados: ${workloads.map((item) => item.metadata?.name).join(", ")}`);
  } else {
    console.log("No se detectaron workloads con el selector configurado; se omite rollout restart.");
  }
}

function doVerify(args) {
  const provider = providers[args.provider];
  provider.validate();
  const raw = normalizeProviderRaw(provider.readRaw(args));
  const state = readState(raw, args.secretProperty);

  if (!state.current) {
    throw new Error("El secret actual no contiene un valor util para verificar.");
  }

  const providerHash = sha256(state.current);
  console.log(`Hash esperado del provider: ${providerHash}`);

  if (args.noK8s || !commandExists("kubectl")) {
    console.log("kubectl no disponible; verificacion limitada al provider.");
    writeAuditLog(args, buildAuditEntry(args, "audit.secret.verified.v1", "read", "success"));
    return;
  }

  const externalSecret = maybeFindExternalSecret(args);
  if (externalSecret) {
    console.log(`ExternalSecret detectado: ${externalSecret.metadata.name}`);
    console.log(`Estado Ready: ${externalSecretReady(externalSecret) ? "True" : "False"}`);
  } else {
    console.log("No se detecto ExternalSecret asociado.");
  }

  const { name, secret } = readK8sSecret(args, externalSecret);
  const match = findMatchingSecretValue(secret, state.current, args.secretProperty);
  if (!match) {
    throw new Error(
      `No se encontro en Kubernetes Secret ${name} un valor cuyo hash coincida con el provider.`,
    );
  }

  const workloads = listWorkloads(args);
  if (workloads.length > 0) {
    waitForWorkloads(args, workloads);
  }

  console.log(`Kubernetes Secret verificado: ${name} (key ${match.key})`);
  writeAuditLog(args, buildAuditEntry(args, "audit.secret.verified.v1", "read", "success"));
}

function doRetirePrevious(args) {
  const provider = providers[args.provider];
  provider.validate();
  const raw = normalizeProviderRaw(provider.readRaw(args));
  const state = readState(raw, args.secretProperty);
  const retiredRaw = buildRetiredRaw(state);

  if (!retiredRaw) {
    console.log("El secret activo no usa envelope { current, previous }; no hay previous in-payload para retirar.");
    writeAuditLog(args, buildAuditEntry(args, "audit.secret.previous_retired.v1", "update", "success"));
    return;
  }

  provider.writeRaw(args, retiredRaw);
  writeAuditLog(args, buildAuditEntry(args, "audit.secret.previous_retired.v1", "update", "success"));
  console.log("Secret anterior retirado del payload activo.");
}

function doRestore(args) {
  const provider = providers[args.provider];
  provider.validate();
  const backupRaw = normalizeProviderRaw(provider.readRaw(args, args.backupId));
  provider.writeRaw(args, backupRaw);
  writeAuditLog(
    args,
    buildAuditEntry(args, "audit.secret.restored.v1", "update", "success", null, [
      { field: "secret.backupId", before: null, after: String(args.backupId) },
    ]),
  );
  console.log(`Secret restaurado desde backup/version ${args.backupId}.`);
}

function validateArgs(args) {
  if (!args.target || !args.env || !args.mode) {
    usage();
    return false;
  }
  if (!providers[args.provider]) {
    throw new Error(`Provider no soportado: ${args.provider}`);
  }
  if (!SUPPORTED_MODES.has(args.mode)) {
    throw new Error(`Modo no soportado: ${args.mode}`);
  }
  if (args.mode === "restore" && !args.backupId) {
    throw new Error("Debes indicar --restore <backup-id> o --mode restore con --backup-id equivalente.");
  }
  if (args.length != null && (!Number.isInteger(args.length) || args.length <= 0)) {
    throw new Error("El valor de --length debe ser un entero positivo.");
  }
  if (
    args.syncTimeoutSeconds != null &&
    (!Number.isInteger(args.syncTimeoutSeconds) || args.syncTimeoutSeconds <= 0)
  ) {
    throw new Error("El valor de --sync-timeout-seconds debe ser un entero positivo.");
  }
  if (
    args.syncPollIntervalSeconds != null &&
    (!Number.isInteger(args.syncPollIntervalSeconds) || args.syncPollIntervalSeconds <= 0)
  ) {
    throw new Error("El valor de --sync-poll-interval-seconds debe ser un entero positivo.");
  }
  return true;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  if (!validateArgs(args)) {
    return 1;
  }

  try {
    switch (args.mode) {
      case "dry-run":
        doDryRun(args);
        break;
      case "apply":
        doApply(args);
        break;
      case "verify":
        doVerify(args);
        break;
      case "retire-previous":
        doRetirePrevious(args);
        break;
      case "restore":
        doRestore(args);
        break;
      default:
        usage();
        return 1;
    }
    return 0;
  } catch (error) {
    writeAuditLog(
      args,
      buildAuditEntry(
        args,
        "audit.secret.rotation_failed.v1",
        args.mode === "verify" || args.mode === "dry-run" ? "read" : "update",
        "failure",
        error instanceof Error ? error.message : String(error),
      ),
    );
    throw error;
  }
}

try {
  process.exit(main());
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
