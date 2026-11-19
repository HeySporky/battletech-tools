#!/usr/bin/env node
// Bundles src/data/bundled-build-runner.ts with the app's Vite config (its defines and import.meta.glob) into one
// Node script, then runs it: the bundled designs rebuilt on every core, with a per-file cache (#241).
//
// Usage:  npm run build:bundled
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { build } from "vite";

const outDir = "node_modules/.cache/bundled-build";
await build({
    configFile: "vite.config.mts",
    mode: "production",
    logLevel: "warn",
    publicDir: false,
    build: { ssr: "src/data/bundled-build-runner.ts", outDir, emptyOutDir: true, minify: false, sourcemap: false, copyPublicDir: false },
});
const entry = readdirSync(outDir).find((file) => /^bundled-build-runner\.m?js$/.test(file));
const run = spawnSync(process.execPath, ["--max-old-space-size=8192", join(outDir, entry), ...process.argv.slice(2)], { stdio: "inherit" });
process.exitCode = run.status ?? 1;
