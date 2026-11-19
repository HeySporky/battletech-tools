#!/usr/bin/env node
/**
 * Sync from the mordel.net API (/api/v1) into a local, git-ignored mirror.
 *
 *   npm run mordel:sync                     list changes since the last run, fetch up to 100 unit details
 *   npm run mordel:sync -- --max-detail 20  a smaller batch
 *   npm run mordel:sync -- --full           list every unit (also done on its own once a week) to notice removals
 *   npm run mordel:sync -- --dry-run        list and plan only; fetch no details
 *
 * Settings (environment):
 *   MORDEL_API_KEY      the key; else read from MORDEL_ENV_FILE (default ../JBTToolsSupportFiles/.env.mordel)
 *   MORDEL_BASE         default https://sandbox.mordel.net/api/v1
 *   MORDEL_MIRROR_DIR   default tools/mordel-sync/.mirror
 *   MORDEL_PAUSE_MS     pause between requests, default 1000
 *
 * The mirror holds member designs from mordel.net and stays out of git: this repository is public. The key goes only in
 * the X-API-Key header and is never printed or saved here. A 401 stops the run; what was fetched before it is kept.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, readApiKey } from "./mordel-client.mjs";
import { runSync } from "./mordel-run.mjs";
import { detailFile } from "./mordel-store.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const USER_AGENT = "JBT-Tools-mordel-sync/0.1 (BattleTech Tools tester)";

function option(name, fallback) {
    const at = process.argv.indexOf(name);
    if (at < 0) return fallback;
    const value = Number(process.argv[at + 1]);
    if (!Number.isInteger(value) || value < 0) throw new Error(`${name} needs a whole number`);
    return value;
}

async function readText(file) {
    try {
        return await fs.readFile(file, "utf8");
    } catch {
        return "";
    }
}

async function writeJson(file, value) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const temp = `${file}.tmp`;
    await fs.writeFile(temp, JSON.stringify(value, null, 1));
    await fs.rename(temp, file);
}

async function main() {
    const maxDetail = option("--max-detail", 100);
    const dryRun = process.argv.includes("--dry-run");
    const forceFull = process.argv.includes("--full");
    const base = process.env.MORDEL_BASE ?? "https://sandbox.mordel.net/api/v1";
    const mirror = path.resolve(repoRoot, process.env.MORDEL_MIRROR_DIR ?? "tools/mordel-sync/.mirror");
    const envFile = path.resolve(repoRoot, process.env.MORDEL_ENV_FILE ?? "../JBTToolsSupportFiles/.env.mordel");

    const key = readApiKey({ env: process.env, envFileText: await readText(envFile) });
    if (!key) {
        console.error(`No mordel.net key: set MORDEL_API_KEY or put MORDEL_API_KEY=... in ${envFile} (git-ignored).`);
        process.exitCode = 2;
        return;
    }

    const storeFile = path.join(mirror, "store.json");
    const storeText = await readText(storeFile);
    const store = storeText ? JSON.parse(storeText) : { units: {} };
    const client = createClient({ base, key, userAgent: USER_AGENT, pauseMs: Number(process.env.MORDEL_PAUSE_MS ?? 1000) });

    let lastLog = 0;
    const result = await runSync({
        client,
        store,
        now: Math.floor(Date.now() / 1000),
        maxDetail,
        dryRun,
        forceFull,
        writeDetail: (unitKey, unit) => writeJson(path.join(mirror, ...detailFile(unitKey)), unit),
        log: (line) => {
            if (Date.now() - lastLog > 5000) {
                lastLog = Date.now();
                console.log(line);
            }
        },
    });

    if (!dryRun) await writeJson(storeFile, result.store);
    const total = Object.keys(result.store.units).length;
    console.log(
        `${result.full ? "full" : "changes-only"} list: ${result.listed} rows; ${total} units known; ` +
            `${result.removed.length} newly removed; details ${dryRun ? `planned ${result.planned}` : `fetched ${result.fetched}`}, ` +
            `${result.waiting} waiting${dryRun ? " (dry run: nothing saved)" : ""}`,
    );
    if (result.stopped === "auth") {
        console.error("Stopped: mordel.net refused the key (401). Get a new key; progress so far is saved.");
        process.exitCode = 3;
    } else if (result.stopped) {
        console.error(`Stopped early: ${result.error?.message ?? "unknown error"}. Progress so far is saved.`);
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
