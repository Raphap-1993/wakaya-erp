import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

import { requireOtaJobPermission } from "./job-auth";

describe("requireOtaJobPermission", () => {
  const originalToken = process.env.OTA_JOB_TOKEN;

  beforeEach(() => {
    requirePermissionMock.mockReset();
    process.env.OTA_JOB_TOKEN = "wakaya-job-secret";
  });

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env.OTA_JOB_TOKEN;
    } else {
      process.env.OTA_JOB_TOKEN = originalToken;
    }
  });

  it("accepts the internal OTA token without delegating to normal auth", async () => {
    const result = await requireOtaJobPermission(
      new Request("http://localhost/api/test", {
        headers: {
          "x-wakaya-job-token": "wakaya-job-secret",
        },
      }),
      "reservation:approve",
    );

    expect(result).toMatchObject({
      authenticated: true,
      subject: "ota-job",
    });
    expect(requirePermissionMock).not.toHaveBeenCalled();
  });

  it("falls back to normal permission checks when the token is absent or invalid", async () => {
    requirePermissionMock.mockResolvedValue({ subject: "admin-1", roles: ["admin"] });

    const result = await requireOtaJobPermission(
      new Request("http://localhost/api/test"),
      "reservation:approve",
    );

    expect(requirePermissionMock).toHaveBeenCalled();
    expect(result).toMatchObject({ subject: "admin-1" });
  });
});
