#!/usr/bin/env node
/**
 * Builds the shipped mordel.net list from the local mirror (sync-mordel.mjs):
 *   src/data/mordel/mordel_{type}_{n}.json        list rows, 2,000 a chunk, in the MUL lists' table format
 *   tools/mordel-sync/canon-mismatch-report.json  canon units whose stats differ from their MUL record
 *
 * A canon unit the MUL list already has with the same BV, PV and Alpha Strike stats is left out: the MUL list covers
 * it. mordel.net agreed to the list shipping with the app (2026-11-07); the details stay in the git-ignored mirror.
 *
 * Environment:
 *   MORDEL_MIRROR_DIR   default tools/mordel-sync/.mirror
 */
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stringifyTable, untabulate } from "../mul-sync/pack-json.mjs";
import { buildMulIndex, chunkRows, planList } from "./mordel-list-rows.mjs";
import { detailFile } from "./mordel-store.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));

async function readMulLive() {
    const folder = path.join(repoRoot, "src/data/mul/live");
    const files = (await readdir(folder)).filter((f) => f.endsWith(".json"));
    const lists = await Promise.all(files.map(async (f) => untabulate(await readJson(path.join(folder, f)))));
    return lists.flat();
}

async function main() {
    const mirror = path.resolve(repoRoot, process.env.MORDEL_MIRROR_DIR ?? "tools/mordel-sync/.mirror");
    const store = await readJson(path.join(mirror, "store.json"));
    const keys = Object.entries(store.units).filter(([, e]) => e.removed == null && e.detailStamp != null).map(([key]) => key);
    const details = [];
    for (const key of keys) details.push(await readJson(path.join(mirror, ...detailFile(key))));

    const archive = await readJson(path.join(repoRoot, "tools/mul-sync/archive/replaced-legacy-records.json"));
    const index = buildMulIndex(await readMulLive(), archive);
    const { rows, mismatches, counts } = planList(details, index);

    const out = path.join(repoRoot, "src/data/mordel");
    await mkdir(out, { recursive: true });
    for (const f of await readdir(out)) if (/^mordel_[a-z]+_\d+\.json$/.test(f)) await rm(path.join(out, f));
    const chunks = chunkRows(rows);
    for (const chunk of chunks) await writeFile(path.join(out, `mordel_${chunk.type}_${chunk.n}.json`), stringifyTable(chunk.rows));

    const waiting = Object.values(store.units).filter((e) => e.removed == null && e.detailStamp !== e.stamp).length;
    const report = { built: new Date().toISOString(), detailsMissingOrStale: waiting, counts, mismatches };
    await writeFile(path.join(repoRoot, "tools/mordel-sync/canon-mismatch-report.json"), JSON.stringify(report, null, 1) + "\n");
    console.log(`${counts.total} units read, ${rows.length} rows in ${chunks.length} chunks; canon ${counts.canon}: ` +
        `${counts.droppedMatching} left out (match MUL), ${counts.canonMismatched} differ, ${counts.canonNotInMul} not in MUL; ` +
        `${waiting} details missing or stale`);
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
