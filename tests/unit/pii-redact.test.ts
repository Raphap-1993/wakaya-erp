import { describe, expect, it } from "vitest";
import { redact, safeStringify } from "@/lib/pii-redact";

describe("redact", () => {
  it("redacta campos sensibles por nombre", () => {
    const out = redact({
      user: "alice",
      password: "secret123",
      access_token: "abc",
      profile: { email: "alice@example.com", phone: "+5551234" },
    });
    expect((out as any).password).toBe("[REDACTED]");
    expect((out as any).access_token).toBe("[REDACTED]");
    expect((out as any).profile.phone).toBe("[REDACTED]");
  });

  it("preserva claves no sensibles", () => {
    const out = redact({ id: 42, status: "ok", count: 7 });
    expect(out).toEqual({ id: 42, status: "ok", count: 7 });
  });

  it("redacta emails dentro de strings", () => {
    const result = redact({ message: "Mail enviado a alice@example.com hoy" });
    expect((result as any).message).toBe("Mail enviado a a***@example.com hoy");
  });

  it("redacta JWT en strings", () => {
    const jwt = "eyJabc1234567890.eyJxyz1234567890.signature1234567890";
    const out = redact({ note: `bearer ${jwt}` });
    expect((out as any).note).toBe("bearer [REDACTED:JWT]");
  });

  it("redacta tarjetas de credito dejando los 4 ultimos", () => {
    const out = redact({ payment: "4111 1111 1111 1234" });
    expect((out as any).payment).toBe("[REDACTED:CARD:1234]");
  });

  it("respeta maxDepth", () => {
    const deep = { a: { b: { c: { d: { e: { f: "deep" } } } } } };
    const out = redact(deep, { maxDepth: 2 });
    expect((out as any).a.b).toBe("[REDACTED:DEPTH]");
  });

  it("acepta extraKeys del usuario", () => {
    const out = redact({ ssn: "abc", customField: "sensitive" }, { extraKeys: ["customfield"] });
    expect((out as any).ssn).toBe("[REDACTED]");
    expect((out as any).customField).toBe("[REDACTED]");
  });

  it("safeStringify produce JSON valido", () => {
    const json = safeStringify({ password: "x", id: 1 });
    expect(JSON.parse(json)).toEqual({ password: "[REDACTED]", id: 1 });
  });

  it("maneja null y undefined sin romper", () => {
    expect(redact(null)).toBeNull();
    expect(redact(undefined)).toBeUndefined();
  });

  it("redacta dentro de arrays", () => {
    const out = redact([{ password: "a" }, { ok: true }]);
    expect((out as any)[0].password).toBe("[REDACTED]");
    expect((out as any)[1].ok).toBe(true);
  });
});
