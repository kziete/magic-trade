#!/usr/bin/env node
import { createServer } from "node:net";
import { spawn } from "node:child_process";

const DEFAULT_PORT = 3001;
const basePort = Number(process.env.PORT) || DEFAULT_PORT;

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "0.0.0.0");
  });
}

async function findFreePort(startPort, maxAttempts = 20) {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No se encontró un puerto libre entre ${startPort} y ${startPort + maxAttempts - 1}`);
}

const port = await findFreePort(basePort);

if (port !== basePort) {
  console.log(`Puerto ${basePort} ocupado, usando el puerto ${port} en su lugar.`);
}

const child = spawn("next", ["dev", "-p", String(port)], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 0));
