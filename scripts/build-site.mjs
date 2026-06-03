import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const binExt = process.platform === "win32" ? ".cmd" : "";
const localBin = (name) => path.join(projectRoot, "node_modules", ".bin", `${name}${binExt}`);
const outDir = process.env.ASTRO_OUT_DIR || "dist";

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

if (process.env.LIYIHAN_SKIP_CHECK !== "1") {
  await run(localBin("astro"), ["check"]);
}

await fs.rm(path.resolve(projectRoot, outDir), { recursive: true, force: true });
await run(localBin("astro"), ["build"], { ASTRO_OUT_DIR: outDir });
await run(localBin("pagefind"), ["--site", outDir]);
