import { access, cp, mkdir, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";

const sourceDir = join(process.cwd(), ".next", "static");
const standaloneDir = join(process.cwd(), ".next", "standalone");
const targetDir = join(standaloneDir, ".next", "static");
const publicDir = join(process.cwd(), "public");
const standalonePublicDir = join(standaloneDir, "public");

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(sourceDir)) || !(await exists(standaloneDir))) {
  process.exit(0);
}

await rm(targetDir, { recursive: true, force: true });
await mkdir(dirname(targetDir), { recursive: true });
await cp(sourceDir, targetDir, { recursive: true, force: true });

if (await exists(publicDir)) {
  await rm(standalonePublicDir, { recursive: true, force: true });
  await cp(publicDir, standalonePublicDir, { recursive: true, force: true });
}

console.log(`Copied standalone static assets to ${targetDir}`);
if (await exists(publicDir)) {
  console.log(`Copied public assets to ${standalonePublicDir}`);
}
