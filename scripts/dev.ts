/**
 * Development orchestrator — starts all platform services in parallel.
 *
 * Usage: bun run dev
 *
 * Services started:
 *   Gateway API    → http://localhost:3000
 *   Landing Page   → http://localhost:5176
 *   Dashboard      → http://localhost:5174
 *   Documentation  → http://localhost:5175
 */

import { Subprocess } from "bun";

interface Service {
  name: string;
  port: number;
  cmd: string[];
  cwd?: string;
}

const services: Service[] = [
  { name: "Gateway",      port: 3000, cmd: ["bun", "run", "packages/server/src/server.ts"] },
  { name: "Landing",      port: 5176, cmd: ["bun", "--filter", "landing", "dev"] },
  { name: "Dashboard",    port: 5174, cmd: ["bun", "--filter", "dashboard", "dev"] },
  { name: "Docs",         port: 5175, cmd: ["bun", "--filter", "docs", "dev"] },
];

const pad = (s: string, n: number) => s.padEnd(n);
const maxName = Math.max(...services.map((s) => s.name.length));

console.log("");
console.log("  AI Payment Platform — Development Server");
console.log("  -----------------------------------------");
for (const svc of services) {
  console.log(`  ${pad(svc.name, maxName + 2)} http://localhost:${svc.port}`);
}
console.log("");

const procs: Subprocess[] = [];

for (const svc of services) {
  const proc = Bun.spawn(svc.cmd, {
    cwd: svc.cwd || process.cwd(),
    stdout: "inherit",
    stderr: "inherit",
    env: { ...process.env, FORCE_COLOR: "1" },
  });
  procs.push(proc);
}

// Graceful shutdown on Ctrl+C
process.on("SIGINT", () => {
  console.log("\n  Shutting down all services...");
  for (const p of procs) {
    try { p.kill(); } catch {}
  }
  process.exit(0);
});

process.on("SIGTERM", () => {
  for (const p of procs) {
    try { p.kill(); } catch {}
  }
  process.exit(0);
});

// Keep alive
await Promise.all(procs.map((p) => p.exited));
