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

async function moveDirectory(source, destination) {
  try {
    await fs.rename(source, destination);
  } catch (error) {
    if (error.code !== "EXDEV") {
      throw error;
    }
    await fs.cp(source, destination, {
      recursive: true,
      force: true,
      errorOnExist: false,
    });
    await fs.rm(source, { recursive: true, force: true });
  }
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
  await moveDirectory(webRoot, backup);
} catch (error) {
  if (error.code !== "ENOENT") {
    throw error;
  }
}

try {
  await moveDirectory(staging, webRoot);
  await fs.rm(backup, { recursive: true, force: true });
} catch (error) {
  try {
    await moveDirectory(backup, webRoot);
  } catch {
    // The original failure is the useful one.
  }
  throw error;
}
