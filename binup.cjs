#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const { join } = require("node:path");

const script = join(__dirname, "binup.ts");
const proc = spawnSync("bun", [script, ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: false,
});

if (proc.error) {
  throw proc.error;
}

process.exit(proc.status ?? 0);
