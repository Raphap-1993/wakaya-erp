const DEFAULT_BASE_URL = `http://127.0.0.1:${process.env.PORT || "3000"}`;
const DEFAULT_POLL_INTERVAL_SECONDS = 20;
const DEFAULT_RECOVERY_INTERVAL_MINUTES = 30;
const MIN_ACK_PAUSE_MS = 5_000;

function nowIso() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readPositiveNumber(rawValue, fallback) {
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getConfig() {
  const baseUrl = (process.env.OTA_JOB_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const token = process.env.OTA_JOB_TOKEN?.trim();
  if (!token) {
    throw new Error("OTA_JOB_TOKEN is required");
  }

  return {
    baseUrl,
    token,
    pollIntervalMs: readPositiveNumber(process.env.BOOKING_POLL_INTERVAL_SECONDS, DEFAULT_POLL_INTERVAL_SECONDS) * 1000,
    recoveryIntervalMs:
      readPositiveNumber(process.env.BOOKING_RECOVERY_INTERVAL_MINUTES, DEFAULT_RECOVERY_INTERVAL_MINUTES) * 60 * 1000,
  };
}

async function postJson(config, path) {
  const response = await fetch(`${config.baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-wakaya-job-token": config.token,
    },
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const error = new Error(body?.message || body?.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

async function runIncrementalSync(config) {
  const body = await postJson(config, "/api/integrations/otas/booking/sync");
  return body?.result ?? null;
}

async function runRecoverySync(config) {
  const body = await postJson(config, "/api/integrations/otas/booking/recover");
  return body?.result ?? null;
}

async function runCycle(config, state, options = { withDelay: true }) {
  const incremental = await runIncrementalSync(config);
  const acknowledged = Number(incremental?.acknowledged ?? 0);
  const imported = Number(incremental?.imported ?? 0);
  const conflicts = Number(incremental?.conflicts ?? 0);

  console.log(
    `[${nowIso()}] booking incremental imported=${imported} acknowledged=${acknowledged} conflicts=${conflicts} pendingMapping=${Number(incremental?.pendingMapping ?? 0)} failures=${Number(incremental?.failures ?? 0)}`,
  );

  const shouldRecover = Date.now() - state.lastRecoveryAt >= config.recoveryIntervalMs;
  if (shouldRecover) {
    const recovery = await runRecoverySync(config);
    console.log(
      `[${nowIso()}] booking recovery imported=${Number(recovery?.imported ?? 0)} conflicts=${Number(recovery?.conflicts ?? 0)} pendingMapping=${Number(recovery?.pendingMapping ?? 0)} failures=${Number(recovery?.failures ?? 0)}`,
    );
    state.lastRecoveryAt = Date.now();
  }

  if (options.withDelay) {
    const delayMs = Math.max(config.pollIntervalMs, acknowledged > 0 ? MIN_ACK_PAUSE_MS : 0);
    await sleep(delayMs);
  }
}

async function main() {
  const config = getConfig();
  const mode = process.argv[2] || "daemon";
  const state = {
    lastRecoveryAt: mode === "once" ? Date.now() : 0,
  };

  if (mode === "once") {
    await runCycle(config, state, { withDelay: false });
    return;
  }

  if (mode !== "daemon") {
    throw new Error(`Unsupported mode: ${mode}`);
  }

  console.log(
    `[${nowIso()}] booking worker started baseUrl=${config.baseUrl} pollIntervalMs=${config.pollIntervalMs} recoveryIntervalMs=${config.recoveryIntervalMs}`,
  );

  for (;;) {
    try {
      await runCycle(config, state);
    } catch (error) {
      const status = typeof error === "object" && error && "status" in error ? error.status : null;
      if (status === 409) {
        console.warn(`[${nowIso()}] booking worker skipped: sync already locked`);
      } else {
        console.error(`[${nowIso()}] booking worker error`, error);
      }
      await sleep(config.pollIntervalMs);
    }
  }
}

main().catch((error) => {
  console.error(`[${nowIso()}] booking worker fatal`, error);
  process.exitCode = 1;
});
