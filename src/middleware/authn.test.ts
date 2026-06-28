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
});
