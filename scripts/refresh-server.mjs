import http from "node:http";
import { spawn } from "node:child_process";

const host = process.env.LIYIHAN_REFRESH_HOST || "127.0.0.1";
const port = Number.parseInt(process.env.LIYIHAN_REFRESH_PORT || "4321", 10);
const token = process.env.LIYIHAN_REFRESH_TOKEN || "";

let running = false;
let lastResult = null;

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(data));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 4096) {
        request.destroy(new Error("Request body is too large"));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function requestToken(request, body) {
  const auth = request.headers.authorization || "";
  if (auth.startsWith("Bearer ")) {
    return auth.slice("Bearer ".length);
  }
  if (request.headers["x-refresh-token"]) {
    return String(request.headers["x-refresh-token"]);
  }
  if (!body) {
    return "";
  }
  try {
    const parsed = JSON.parse(body);
    return typeof parsed.token === "string" ? parsed.token : "";
  } catch {
    return "";
  }
}

function publish() {
  return new Promise((resolve, reject) => {
    const startedAt = new Date().toISOString();
    const child = spawn(process.execPath, ["scripts/publish-site.mjs"], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
      process.stderr.write(chunk);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      const finishedAt = new Date().toISOString();
      const result = { code, startedAt, finishedAt, output: output.slice(-4000) };
      lastResult = result;
      if (code === 0) {
        resolve(result);
        return;
      }
      reject(Object.assign(new Error(`publish failed with code ${code}`), { result }));
    });
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, { ok: true, running, lastResult });
    return;
  }

  if (request.method !== "POST" || url.pathname !== "/refresh") {
    sendJson(response, 404, { ok: false, error: "not_found" });
    return;
  }

  if (!token) {
    sendJson(response, 403, {
      ok: false,
      error: "refresh_token_not_configured",
    });
    return;
  }

  const body = await readBody(request);
  if (requestToken(request, body) !== token) {
    sendJson(response, 401, { ok: false, error: "unauthorized" });
    return;
  }

  if (running) {
    sendJson(response, 409, { ok: false, error: "refresh_already_running" });
    return;
  }

  running = true;
  try {
    const result = await publish();
    sendJson(response, 200, { ok: true, result });
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: "refresh_failed",
      result: error.result || null,
      message: error.message,
    });
  } finally {
    running = false;
  }
});

server.listen(port, host, () => {
  console.log(`Refresh server listening on http://${host}:${port}`);
});
