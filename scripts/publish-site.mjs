import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const projectRoot = process.cwd();
const webRoot = path.resolve(process.env.LIYIHAN_WEB_ROOT || "dist");
const contentRoot = process.env.LIYIHAN_CONTENT_DIR
  ? path.resolve(process.env.LIYIHAN_CONTENT_DIR)
  : "";
const parent = path.dirname(webRoot);
const staging = path.join(parent, `${path.basename(webRoot)}.next`);
const backup = path.join(parent, `${path.basename(webRoot)}.previous`);

function run(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env: { ...process.env, ...env },
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${path.basename(command)} exited with code ${code}`));
    });
  });
}

await fs.mkdir(parent, { recursive: true });
await fs.rm(staging, { recursive: true, force: true });
await fs.rm(backup, { recursive: true, force: true });

await run(process.execPath, ["scripts/build-site.mjs"], { ASTRO_OUT_DIR: staging });

if (contentRoot) {
  const assets = path.join(contentRoot, "assets");
  try {
    await fs.cp(assets, path.join(staging, "assets"), {
      recursive: true,
      force: true,
      errorOnExist: false,
    });
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

try {
  await fs.rename(webRoot, backup);
} catch (error) {
  if (error.code !== "ENOENT") {
    throw error;
  }
}

try {
  await fs.rename(staging, webRoot);
  await fs.rm(backup, { recursive: true, force: true });
} catch (error) {
  try {
    await fs.rename(backup, webRoot);
  } catch {
    // The original failure is the useful one.
  }
  throw error;
}
