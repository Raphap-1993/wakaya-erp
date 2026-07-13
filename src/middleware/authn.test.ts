import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn(),
  jwtVerify: vi.fn(),
}));

describe("middleware authn", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("allows a development bypass when OIDC is not configured", async () => {
    vi.stubEnv("AUTH_DEV_BYPASS", "true");
    const { authenticate } = await import("./authn");
    const ctx = await authenticate(new Request("http://localhost/api/reservations"));

    expect(ctx.authenticated).toBe(true);
    expect(ctx.roles).toContain("admin");
    expect(ctx.subject).toBe("dev-admin");
  });

  it("reads roles from the configured claim and accepts the token from a cookie", async () => {
    vi.stubEnv("AUTH_DEV_BYPASS", "false");
    vi.stubEnv("OIDC_ISSUER", "https://iam.example.com/realms/wakaya");
    vi.stubEnv("OIDC_JWKS_URL", "https://iam.example.com/realms/wakaya/protocol/openid-connect/certs");
    vi.stubEnv("OIDC_AUDIENCE", "wakaya-erp-web");
    vi.stubEnv("OIDC_ROLES_CLAIM", "realm_access.roles");

    const jose = await import("jose");
    vi.mocked(jose.createRemoteJWKSet).mockReturnValue({} as never);
    const jwtVerifyMock = vi.mocked(jose.jwtVerify);
    jwtVerifyMock.mockResolvedValue({
      payload: {
        sub: "user-reception-1",
        realm_access: { roles: ["admin", "approver"] },
      },
      protectedHeader: {},
    } as never);

    const { authenticate } = await import("./authn");
    const request = new Request("http://localhost/api/reservations", {
      headers: {
        cookie: "wakaya_access_token=token-from-cookie",
      },
    });

    const ctx = await authenticate(request);

    expect(ctx.authenticated).toBe(true);
    expect(ctx.subject).toBe("user-reception-1");
    expect(ctx.roles).toEqual(["admin", "approver"]);
    expect(jwtVerifyMock).toHaveBeenCalledWith(
      "token-from-cookie",
      expect.anything(),
      expect.objectContaining({
        issuer: "https://iam.example.com/realms/wakaya",
        audience: "wakaya-erp-web",
      }),
    );
  });

  it("authenticates a backoffice session from the persistent session cookie before checking OIDC", async () => {
    vi.stubEnv("AUTH_DEV_BYPASS", "false");
    vi.doMock("@/lib/backoffice-auth/store", () => ({
      backofficeAuthStore: {
        getSession: vi.fn().mockResolvedValue({
          user: {
            id: "backoffice-user-1",
            email: "reservas@wakayaecolodge.com",
            name: "Reservas Wakaya",
            roles: ["admin"],
            active: true,
          },
          session: {
            id: "session-1",
            userId: "backoffice-user-1",
            expiresAt: "2099-07-01T00:00:00.000Z",
          },
        }),
      },
    }));

    const { authenticate } = await import("./authn");
    const request = new Request("http://localhost/admin/reservations", {
      headers: {
        cookie: "wakaya_backoffice_session=session-token-123",
      },
    });

    const ctx = await authenticate(request);

    expect(ctx.authenticated).toBe(true);
    expect(ctx.subject).toBe("backoffice-user-1");
    expect(ctx.roles).toEqual(["admin"]);
    expect(ctx.claims).toEqual(
      expect.objectContaining({
        authMethod: "backoffice_session",
        email: "reservas@wakayaecolodge.com",
      }),
    );
  });
});
