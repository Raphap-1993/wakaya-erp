import { describe, expect, it } from "vitest";
import { createLogger } from "@/lib/logger";

function captureOut() {
  const lines: string[] = [];
  return {
    out: { write: (s: string) => lines.push(s) },
    parsed: () => lines.map((l) => JSON.parse(l.trim())),
  };
}

describe("logger", () => {
  it("emite JSON line con timestamp, level, event y payload redactado", () => {
    const cap = captureOut();
    const log = createLogger({ out: cap.out, level: "debug" });
    log.info("user_login", { userId: 42, password: "supersecret", email: "alice@example.com" });
    const [entry] = cap.parsed();
    expect(entry.event).toBe("user_login");
    expect(entry.level).toBe("info");
    expect(entry.userId).toBe(42);
    expect(entry.password).toBe("[REDACTED]");
    expect(entry.email).toBe("[REDACTED]");
    expect(entry.ts).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it("respeta el nivel minimo", () => {
    const cap = captureOut();
    const log = createLogger({ out: cap.out, level: "warn" });
    log.debug("ignored", { a: 1 });
    log.info("ignored2", { a: 1 });
    log.warn("kept", { a: 1 });
    log.error("kept2", { a: 1 });
    const events = cap.parsed().map((e) => e.event);
    expect(events).toEqual(["kept", "kept2"]);
  });

  it("logger.unsafe omite redaccion pero marca con flag", () => {
    const cap = captureOut();
    const log = createLogger({ out: cap.out, level: "debug" });
    log.unsafe.warn("debug_payload", { password: "show-me" });
    const [entry] = cap.parsed();
    expect(entry.password).toBe("show-me");
    expect(entry.unsafe).toBe(true);
  });

  it("acepta llamadas sin payload", () => {
    const cap = captureOut();
    const log = createLogger({ out: cap.out, level: "info" });
    log.info("ping");
    const [entry] = cap.parsed();
    expect(entry.event).toBe("ping");
  });
});
