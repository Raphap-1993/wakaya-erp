import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("roadmap scripts", () => {
  it("exposes roadmap-status.mjs and returns JSON status", () => {
    const scriptPath = join(root, "scripts", "roadmap-status.mjs");

    expect(existsSync(scriptPath)).toBe(true);

    const result = spawnSync(process.execPath, [scriptPath, "--json", "--root", root], {
      cwd: root,
      encoding: "utf8"
    });

    expect(result.status).toBe(0);

    const payload = JSON.parse(result.stdout) as Record<string, unknown>;
    expect(payload).toHaveProperty("project");
    expect(payload).toHaveProperty("phases");
    expect(payload).toHaveProperty("nextAction");
  });

  it("exposes roadmap-next.mjs and returns JSON next action", () => {
    const scriptPath = join(root, "scripts", "roadmap-next.mjs");

    expect(existsSync(scriptPath)).toBe(true);

    const result = spawnSync(process.execPath, [scriptPath, "--root", root], {
      cwd: root,
      encoding: "utf8"
    });

    expect(result.status).toBe(0);

    const payload = JSON.parse(result.stdout) as Record<string, unknown>;
    expect(payload).toHaveProperty("next_action");
    expect(payload).toHaveProperty("agent_readiness");
    expect(payload).toHaveProperty("commands_to_run");
  });
});
