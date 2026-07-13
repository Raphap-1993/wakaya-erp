import { describe, expect, it } from "vitest";

import { hasPermission, permissionsForRoles } from "./rbac";

describe("inventory capacity RBAC", () => {
  it("grants inventory:manage only to the administrator role", () => {
    expect(hasPermission(["admin"], "inventory:manage")).toBe(true);
    expect(hasPermission(["approver"], "inventory:manage")).toBe(false);
    expect(hasPermission(["editor"], "inventory:manage")).toBe(false);
    expect(hasPermission(["viewer"], "inventory:manage")).toBe(false);
    expect(permissionsForRoles(["admin"])).toContain("inventory:manage");
  });
});
