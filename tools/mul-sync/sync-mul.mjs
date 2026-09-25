#!/usr/bin/env node
/**
 * Weekly sync from https://masterunitlist.battletech.com/ (the official live Master Unit List).
 *
 * The live site keys every unit on an opaque `public_uid` string (e.g. "000RM4HYJ9") — the classic
 * numeric MUL id is gone from the public site entirely (no numeric id appears anywhere: not in the
 * unit index JSON, not in detail page HTML, links, images, or record-sheet PDFs). See
 * /memories/repo/mul-data-source.md for how this was confirmed.
 *
 * This script:
 *   1. Loads the site once with a real (headless) browser to clear Cloudflare's JS challenge, then
 *      fetches the static index JSON files it publishes (manifest + units + lookup tables) — no
 *      per-unit scraping needed for this part.
 *   2. Diffs the fresh index against our persisted store (tools/mul-sync/live-units.json) to find
 *      new/changed units.
 *   3. For a capped batch of new/changed units per run (MUL_SYNC_MAX_DETAIL, respecting the site's
 *      robots.txt `Crawl-delay: 10`), visits the unit detail page to scrape full Alpha Strike card
 *      stats (size/move/TMM/armor/struct/damage/overheat/abilities) not present in the index JSON.
 *   4. Regenerates src/data/mul/live/*.json chunk files from the accumulated store.
 *
 * Deliberately does NOT touch the legacy numeric-id chunk files (src/data/mul/mul_ids_*.json).
 * Potential name/model matches against legacy entries are only logged to
 * tools/mul-sync/legacy-duplicate-candidates.json for a human to review and reconcile manually —
 * automatically mutating/deleting curated legacy data from a fuzzy string match is too risky to do
 * unattended in CI.
 */

import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const legacyMulDir = path.join(repoRoot, "src", "data", "mul");
const liveMulDir = path.join(legacyMulDir, "live");
const storePath = path.join(__dirname, "live-units.json");
const dupeReportPath = path.join(__dirname, "legacy-duplicate-candidates.json");

const SITE = "https://masterunitlist.battletech.com";
const CRAWL_DELAY_MS = 10_000; // robots.txt: Crawl-delay: 10
const MAX_DETAIL_PER_RUN = Number(process.env.MUL_SYNC_MAX_DETAIL ?? 300);
const CHUNK_SIZE = 200;
const SYNTHETIC_ID_START = 100000;

// Standard Alpha Strike movement-type abbreviations (not present in the live site's data — this is
// fixed rules knowledge, keyed off the site's unit_types.json `name`).
const BF_TYPE_BY_UNIT_TYPE_NAME = {
    BattleMech: "BM",
    OmniMech: "BM",
    "Combat Vehicle": "CV",
    OmniVehicle: "CV",
    "Support Vehicle": "SV",
    "Fighter Craft": "AF",
    "Aerospace Craft": "AF",
    "Battle Armor": "BA",
    Infantry: "CI",
    ProtoMech: "PM",
    IndustrialMech: "IM",
    "Advanced Support": "SV",
    Buildings: "CF",
};

function canonicalTitle(name, model) {
    const title = `${name ?? ""} ${model ?? ""}`.trim().toLowerCase();
    return title
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u2013\u2014]/g, "-")
        .replace(/[^a-z0-9]+/g, "");
}

async function loadJson(filePath, fallback) {
    try {
        return JSON.parse(await fs.readFile(filePath, "utf8"));
    } catch (error) {
        if (error.code === "ENOENT") {
            return fallback;
        }
        throw error;
    }
}

async function saveJson(filePath, data) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function fetchJson(page, relativeUrl) {
    return page.evaluate(async (url) => {
        const res = await fetch(url, { headers: { accept: "application/json" } });
        if (!res.ok) {
            throw new Error(`Request failed: ${res.status} ${url}`);
        }
        return res.json();
    }, `${SITE}${relativeUrl}`);
}

function buildLookup(records, keyField = "id") {
    const map = new Map();
    for (const record of records ?? []) {
        map.set(record[keyField], record);
    }
    return map;
}

function summaryHashOf(unit) {
    // Cheap change-detector for the fields the index actually carries.
    return JSON.stringify([unit.n, unit.m, unit.t, unit.st, unit.r, unit.te, unit.ton, unit.pv, unit.bv, unit.iy, unit.ie, unit.ab, unit.hp]);
}

async function loadLegacyNameIndex() {
    const index = new Map();
    let files = [];
    try {
        files = (await fs.readdir(legacyMulDir)).filter((f) => f.endsWith(".json"));
    } catch {
        return index;
    }
    for (const file of files) {
        const items = await loadJson(path.join(legacyMulDir, file), []);
        for (const item of items) {
            const key = canonicalTitle(item?.Name, item?.Variant);
            if (key && !index.has(key)) {
                index.set(key, { file, Id: item.Id, Name: item.Name, Variant: item.Variant });
            }
        }
    }
    return index;
}

async function scrapeUnitDetail(page, opaqueId) {
    await page.goto(`${SITE}/u/${opaqueId}`, { waitUntil: "domcontentloaded" });

    const bodyText = await page.locator("body").innerText();
    if (/just a moment|cloudflare|security verification/i.test(bodyText)) {
        throw new Error(`Cloudflare challenge blocked detail scrape for ${opaqueId}`);
    }

    return page.evaluate(() => {
        const stats = {};
        document.querySelectorAll(".u-statgrid > div").forEach((row) => {
            const k = row.querySelector(".k")?.textContent?.trim();
            const v = row.querySelector(".v")?.textContent?.trim();
            if (k) stats[k] = v;
        });

        const chips = [...document.querySelectorAll(".u-abilrow .aschip")].map((chip) => {
            const clone = chip.cloneNode(true);
            clone.querySelectorAll(".an").forEach((n) => n.remove());
            return clone.textContent.trim();
        });

        return { stats, chips };
    });
}

function parseDetailIntoRecord(detail, roleName) {
    const { stats, chips } = detail;
    const record = {
        BFOverheat: 0,
        BFDamageShort: 0,
        BFDamageMedium: 0,
        BFDamageLong: 0,
        BFDamageExtreme: 0,
    };

    if (stats.Size) record.BFSize = Number(stats.Size) || 0;
    if (stats.Move) record.BFMove = stats.Move;
    if (stats.TMM) record.BFTMM = Number(stats.TMM) || 0;
    if (stats.Armor) record.BFArmor = Number(stats.Armor) || 0; // "—" (no armor value) parses to 0
    if (stats.Struct) record.BFStructure = Number(stats.Struct) || 0;
    if (stats.PV) record.BFPointValue = Number(stats.PV) || 0;

    const abilities = [];
    for (const chip of chips) {
        const dmgMatch = chip.match(/^DMG\s+(.+)$/i);
        const ovMatch = chip.match(/^OV\s+(\d+)$/i);
        if (dmgMatch) {
            const [s, m, l, e] = dmgMatch[1].split("/");
            const parse = (value) => ({ value: Number(String(value).replace("*", "")) || 0, minimal: value.includes("*") });
            const short = parse(s);
            const medium = parse(m);
            const long = parse(l);
            const extreme = parse(e);
            record.BFDamageShort = short.value;
            record.BFDamageMedium = medium.value;
            record.BFDamageLong = long.value;
            record.BFDamageExtreme = extreme.value;
            record.BFDamageShortMin = short.minimal;
            record.BFDamageMediumMin = medium.minimal;
            record.BFDamageLongMin = long.minimal;
            record.BFDamageExtremeMin = extreme.minimal;
            continue;
        }
        if (ovMatch) {
            record.BFOverheat = Number(ovMatch[1]) || 0;
            continue;
        }
        if (chip.trim() === roleName) {
            continue; // the role is repeated as a chip; we already have it from the index
        }
        abilities.push(chip.trim());
    }
    record.BFAbilities = abilities.join(",");

    return record;
}

async function main() {
    const store = await loadJson(storePath, { units: {} });
    const dupeCandidates = [];
    const legacyNameIndex = await loadLegacyNameIndex();

    const existingIds = Object.values(store.units).map((u) => u.record?.Id ?? 0);
    let nextSyntheticId = Math.max(SYNTHETIC_ID_START, ...existingIds, 0) + 1;

    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
        await page.goto(SITE, { waitUntil: "networkidle" });
        const bodyText = await page.locator("body").innerText();
        if (/just a moment|cloudflare|security verification/i.test(bodyText)) {
            throw new Error("Cloudflare challenge blocked the initial site load.");
        }

        const manifest = await fetchJson(page, "/data/manifest.json");
        const files = manifest.files;

        const [units, unitTypes, roles, eras, technologies] = await Promise.all([
            fetchJson(page, `/data/${files.units}`),
            fetchJson(page, `/data/${files.unit_types}`),
            fetchJson(page, `/data/${files.roles}`),
            fetchJson(page, `/data/${files.eras}`),
            fetchJson(page, `/data/${files.technologies}`),
        ]);

        const unitTypeById = buildLookup(unitTypes);
        const roleById = buildLookup(roles);
        const eraById = buildLookup(eras);
        const techById = buildLookup(technologies);

        console.log(`Fetched live index: ${units.length} units.`);

        const needsDetail = [];

        for (const unit of units) {
            const opaqueId = unit.id;
            const existing = store.units[opaqueId];
            const hash = summaryHashOf(unit);
            const changed = !existing || existing.summaryHash !== hash;

            let numericId = existing?.record?.Id;
            if (numericId === undefined) {
                const nameKey = canonicalTitle(unit.n, unit.m);
                const legacyMatch = legacyNameIndex.get(nameKey);
                if (legacyMatch) {
                    dupeCandidates.push({ opaqueId, name: unit.n, model: unit.m, legacy: legacyMatch });
                }
                numericId = nextSyntheticId++;
            }

            const unitTypeName = unitTypeById.get(unit.t)?.name ?? "n/a";
            const roleName = roleById.get(unit.r)?.name ?? "None";
            const eraName = eraById.get(unit.ie)?.name ?? "";
            const techName = techById.get(unit.te)?.name ?? "n/a";

            const record = {
                ...(existing?.record ?? {}),
                Id: numericId,
                MulUnitKey: opaqueId,
                Name: unit.n,
                Variant: unit.m ?? null,
                Class: unitTypeName,
                Tonnage: unit.ton ?? 0,
                BattleValue: unit.bv ?? 0,
                BFPointValue: unit.pv ?? 0,
                DateIntroduced: String(unit.iy ?? ""),
                Role: roleName,
                Technology: { Id: unit.te, Name: techName, Image: null, SortOrder: 0 },
                BFType: BF_TYPE_BY_UNIT_TYPE_NAME[unitTypeName] ?? null,
                EraId: unit.ie ?? 0,
                EraStart: eraById.get(unit.ie)?.ys ?? 0,
            };

            store.units[opaqueId] = {
                summaryHash: hash,
                detailScrapedAt: existing?.detailScrapedAt ?? null,
                record,
            };

            if (changed || !existing?.detailScrapedAt) {
                needsDetail.push(opaqueId);
            }
        }

        const batch = needsDetail.slice(0, MAX_DETAIL_PER_RUN);
        console.log(`${needsDetail.length} units need a detail scrape; processing ${batch.length} this run.`);

        for (const [index, opaqueId] of batch.entries()) {
            const entry = store.units[opaqueId];
            try {
                const detail = await scrapeUnitDetail(page, opaqueId);
                const detailFields = parseDetailIntoRecord(detail, entry.record.Role);
                Object.assign(entry.record, detailFields);
                entry.detailScrapedAt = new Date().toISOString();
                console.log(`[${index + 1}/${batch.length}] scraped ${entry.record.Name} ${entry.record.Variant ?? ""}`.trim());
            } catch (error) {
                console.warn(`Failed to scrape detail for ${opaqueId}: ${error.message}`);
            }

            if (index < batch.length - 1) {
                await page.waitForTimeout(CRAWL_DELAY_MS);
            }
        }
    } finally {
        await browser.close();
    }

    await saveJson(storePath, store);
    await saveJson(dupeReportPath, dupeCandidates);

    // Regenerate the exported chunk files from scratch — cheap, deterministic, and avoids
    // incremental-patch bugs.
    await fs.rm(liveMulDir, { recursive: true, force: true });
    await fs.mkdir(liveMulDir, { recursive: true });

    const records = Object.values(store.units)
        .map((u) => u.record)
        .sort((a, b) => a.Id - b.Id);

    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        const chunk = records.slice(i, i + CHUNK_SIZE);
        const first = chunk[0].Id;
        const last = chunk[chunk.length - 1].Id;
        await saveJson(path.join(liveMulDir, `mul_live_${first}_to_${last}.json`), chunk);
    }

    console.log(`Wrote ${records.length} live units across ${Math.ceil(records.length / CHUNK_SIZE)} chunk file(s).`);
    console.log(`${dupeCandidates.length} potential legacy duplicates logged to ${path.relative(repoRoot, dupeReportPath)} for manual review.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
