import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticateWithPasswordMock, createSessionMock } = vi.hoisted(() => ({
  authenticateWithPasswordMock: vi.fn(),
  createSessionMock: vi.fn(),
}));

vi.mock("@/lib/backoffice-auth/store", () => ({
  backofficeAuthStore: {
    authenticateWithPassword: authenticateWithPasswordMock,
    createSession: createSessionMock,
  },
}));

import { POST } from "./route";

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    authenticateWithPasswordMock.mockReset();
    createSessionMock.mockReset();
  });

  it("creates a persistent backoffice session cookie and redirects to the requested screen", async () => {
    authenticateWithPasswordMock.mockResolvedValue({
      id: "backoffice-user-1",
      email: "reservas@wakayaecolodge.com",
      name: "Reservas Wakaya",
      roles: ["admin"],
      active: true,
    });
    createSessionMock.mockResolvedValue({
      token: "session-token-123",
      session: {
        id: "session-1",
        userId: "backoffice-user-1",
        expiresAt: "2099-07-01T00:00:00.000Z",
      },
    });

    const form = new FormData();
    form.set("email", "reservas@wakayaecolodge.com");
    form.set("password", "wakaya-admin-123");
    form.set("next", "/admin/reservations/requests");

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: form,
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/admin/reservations/requests");
    expect(response.headers.get("set-cookie")).toContain("wakaya_backoffice_session=session-token-123");
  });

  it("redirects back to login with error metadata when credentials are invalid", async () => {
    authenticateWithPasswordMock.mockResolvedValue(null);

    const form = new FormData();
    form.set("email", "reservas@wakayaecolodge.com");
    form.set("password", "wrong-password");
    form.set("next", "/admin");

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: form,
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/login?error=invalid_credentials&next=%2Fadmin");
  });
});
