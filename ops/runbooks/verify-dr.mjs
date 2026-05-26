#!/usr/bin/env node
// Verificaciones post-failover cross-platform.
//
// Ejecuta checks idempotentes que no alteran estado:
//   - Nodes ready en el cluster indicado (kubectl get nodes).
//   - Pods core Ready (kubectl get pods -l <selector>).
//   - Error rate reciente via query Prometheus HTTP API.
//
// Uso:
//   node ops/runbooks/verify-dr.mjs --region <primary|secondary> --env <env>
//       [--post-failover]
//       [--kubectl-context <ctx>] [--kubeconfig <path>]
//       [--namespace <ns>]
//       [--core-selector <label=value>]
//       [--prometheus-url <url>] [--prometheus-token <token>]
//       [--threshold-error-rate <ratio>]
//       [--query <promql>]
//       [--dry-run]
//       [--json]
//
// Cross-platform (Windows/Linux/macOS): solo Node 20+ y kubectl en PATH.
// El --dry-run lista los checks que se ejecutarian sin tocar el cluster ni hacer fetch.

import { spawnSync } from "node:child_process";

function parseArgs(argv) {
  const args = {
    threshold: 0.005, // 0.5 por ciento
    namespace: null,
    coreSelector: "tier=core",
    query:
      'sum(rate(http_server_requests_seconds_count{code=~"5.."}[5m])) / sum(rate(http_server_requests_seconds_count[5m]))',
    json: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === "-h" || flag === "--help") { args.help = true; continue; }
    if (flag === "--region") { args.region = value; i += 1; continue; }
    if (flag === "--env") { args.env = value; i += 1; continue; }
    if (flag === "--post-failover") { args.postFailover = true; continue; }
    if (flag === "--kubectl-context") { args.kubectlContext = value; i += 1; continue; }
    if (flag === "--kubeconfig") { args.kubeconfig = value; i += 1; continue; }
    if (flag === "--namespace") { args.namespace = value; i += 1; continue; }
    if (flag === "--core-selector") { args.coreSelector = value; i += 1; continue; }
    if (flag === "--prometheus-url" || flag === "--prom-url") {
      args.promUrl = value; i += 1; continue;
    }
    if (flag === "--prometheus-token") { args.promToken = value; i += 1; continue; }
    if (flag === "--threshold-error-rate") {
      args.threshold = Number(value); i += 1; continue;
    }
    if (flag === "--query") { args.query = value; i += 1; continue; }
    if (flag === "--dry-run") { args.dryRun = true; continue; }
    if (flag === "--json") { args.json = true; continue; }
    throw new Error(`Argumento desconocido: ${flag}`);
  }
  return args;
}

function usage() {
  console.log(`Uso:
  node ops/runbooks/verify-dr.mjs --region <primary|secondary> --env <env>
      [--post-failover]
      [--kubectl-context <ctx>] [--kubeconfig <path>]
      [--namespace <ns>] [--core-selector <label=value>]
      [--prometheus-url <url>] [--prometheus-token <token>]
      [--threshold-error-rate <ratio>] [--query <promql>]
      [--dry-run] [--json]
`);
}

function buildKubectlBaseArgs(args) {
  const base = [];
  if (args.kubectlContext) base.push("--context", args.kubectlContext);
  if (args.kubeconfig) base.push("--kubeconfig", args.kubeconfig);
  return base;
}

function runCapture(command, args, env) {
  const result = spawnSync(command, args, {
    stdio: "pipe",
    encoding: "utf8",
    shell: false,
    env: env ?? process.env,
  });
  if (result.status !== 0) {
    return { ok: false, stderr: result.stderr ?? "", stdout: result.stdout ?? "" };
  }
  return { ok: true, stdout: result.stdout, stderr: result.stderr };
}

// --- Provider: kubernetes (kubectl shell-out) ---
const k8s = {
  getNodes(args) {
    const kArgs = [...buildKubectlBaseArgs(args), "get", "nodes", "-o", "json"];
    const res = runCapture("kubectl", kArgs);
    if (!res.ok) {
      return { ok: false, message: `kubectl get nodes fallo: ${res.stderr.trim()}` };
    }
    try {
      const parsed = JSON.parse(res.stdout);
      const notReady = parsed.items.filter((node) => {
        const ready = (node.status?.conditions ?? []).find((c) => c.type === "Ready");
        return ready?.status !== "True";
      });
      if (notReady.length > 0) {
        return {
          ok: false,
          message: `Nodes no ready: ${notReady.map((n) => n.metadata.name).join(", ")}`,
        };
      }
      return { ok: true, message: `Nodes ready: ${parsed.items.length}` };
    } catch (error) {
      return { ok: false, message: `No se pudo parsear salida kubectl: ${error.message}` };
    }
  },

  getCorePods(args) {
    const kArgs = [...buildKubectlBaseArgs(args)];
    if (args.namespace) {
      kArgs.push("-n", args.namespace);
    } else {
      kArgs.push("--all-namespaces");
    }
    kArgs.push("get", "pods", "-l", args.coreSelector, "-o", "json");
    const res = runCapture("kubectl", kArgs);
    if (!res.ok) {
      return { ok: false, message: `kubectl get pods fallo: ${res.stderr.trim()}` };
    }
    try {
      const parsed = JSON.parse(res.stdout);
      const notReady = parsed.items.filter((pod) => {
        const ready = (pod.status?.conditions ?? []).find((c) => c.type === "Ready");
        return ready?.status !== "True";
      });
      if (notReady.length > 0) {
        return {
          ok: false,
          message: `Pods core no ready: ${notReady.map((p) => `${p.metadata.namespace}/${p.metadata.name}`).join(", ")}`,
        };
      }
      return {
        ok: true,
        message: `Pods core ready: ${parsed.items.length} (selector="${args.coreSelector}")`,
      };
    } catch (error) {
      return { ok: false, message: `No se pudo parsear pods: ${error.message}` };
    }
  },
};

// --- Provider: prometheus (HTTP) ---
const prometheus = {
  async errorRate(args) {
    if (!args.promUrl) {
      return { ok: true, message: "Sin URL Prometheus; check omitido." };
    }
    const url = `${args.promUrl.replace(/\/$/, "")}/api/v1/query?query=${encodeURIComponent(args.query)}`;
    const headers = {};
    if (args.promToken) {
      headers.Authorization = `Bearer ${args.promToken}`;
    }
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        return { ok: false, message: `Prometheus respondio ${response.status}` };
      }
      const data = await response.json();
      const raw = data?.data?.result?.[0]?.value?.[1];
      const value = Number(raw ?? 0);
      if (Number.isNaN(value)) {
        return { ok: false, message: "No se pudo leer resultado de la query." };
      }
      if (value > args.threshold) {
        return {
          ok: false,
          message: `Error rate ${(value * 100).toFixed(2)}% supera umbral ${(args.threshold * 100).toFixed(2)}%`,
        };
      }
      return {
        ok: true,
        message: `Error rate ${(value * 100).toFixed(3)}% dentro de umbral ${(args.threshold * 100).toFixed(2)}%`,
      };
    } catch (error) {
      return { ok: false, message: `Fetch Prometheus fallo: ${error.message}` };
    }
  },
};

function listChecks(args) {
  return [
    {
      name: "Nodes ready",
      describe: `kubectl get nodes (context=${args.kubectlContext ?? "default"}, kubeconfig=${args.kubeconfig ?? "default"})`,
      run: () => k8s.getNodes(args),
    },
    {
      name: "Core pods ready",
      describe: `kubectl get pods -l ${args.coreSelector} ${args.namespace ? `-n ${args.namespace}` : "--all-namespaces"}`,
      run: () => k8s.getCorePods(args),
    },
    {
      name: "Prometheus error rate",
      describe: args.promUrl
        ? `${args.promUrl} threshold=${args.threshold}`
        : "(sin URL configurada)",
      run: () => prometheus.errorRate(args),
    },
  ];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { usage(); return 0; }
  if (!args.region || !args.env) { usage(); return 1; }

  const banner = `== verify-dr: region=${args.region} env=${args.env} postFailover=${Boolean(args.postFailover)} ==`;
  if (!args.json) console.log(banner);

  const checks = listChecks(args);

  if (args.dryRun) {
    if (args.json) {
      console.log(JSON.stringify({
        mode: "dry-run",
        region: args.region,
        env: args.env,
        checks: checks.map((c) => ({ name: c.name, describe: c.describe })),
      }, null, 2));
    } else {
      console.log("Modo --dry-run: se listan checks sin ejecutarlos.");
      for (const c of checks) {
        console.log(`  - ${c.name}: ${c.describe}`);
      }
    }
    return 0;
  }

  const results = [];
  let failed = 0;
  for (const c of checks) {
    const result = await c.run();
    results.push({ name: c.name, ...result });
    if (!result.ok) failed += 1;
    if (!args.json) {
      const status = result.ok ? "OK" : "FAIL";
      console.log(`[${status}] ${c.name}: ${result.message}`);
    }
  }

  if (args.json) {
    console.log(JSON.stringify({
      region: args.region,
      env: args.env,
      postFailover: Boolean(args.postFailover),
      passed: failed === 0,
      results,
    }, null, 2));
  } else {
    console.log(failed === 0 ? "Todos los checks OK." : `Checks fallidos: ${failed}.`);
  }
  return failed === 0 ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
