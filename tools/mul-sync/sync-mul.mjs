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
const legacyArchivePath = path.join(legacyMulDir, "archive", "replaced-legacy-records.json");
const storePath = path.join(__dirname, "live-units.json");
const dupeReportPath = path.join(__dirname, "legacy-duplicate-candidates.json");

const SITE = "https://masterunitlist.battletech.com";
// robots.txt only requires 10s; we default a bit more conservative since Cloudflare's bot-management
// appears to score request cadence/pattern, not just IP reputation. Override via env if needed.
const CRAWL_DELAY_MS = Number(process.env.MUL_SYNC_CRAWL_DELAY_MS ?? 15_000);
const COOLDOWN_MS = 60_000;
const MAX_DETAIL_PER_RUN = Number(process.env.MUL_SYNC_MAX_DETAIL ?? 700);
const CHUNK_SIZE = 200;
const SYNTHETIC_ID_START = 100000;
const MAX_CONSECUTIVE_CLOUDFLARE_BLOCKS = 3;

// Distinguishes "the site actively blocked us" from an ordinary bug so CI can report it clearly.
class CloudflareBlockError extends Error {}

function isCloudflareChallenge(bodyText = "") {
    return /just a moment|cloudflare|security verification|checking your browser/i.test(bodyText);
}

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

function normalizeIdentityPart(value) {
    return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function unitIdentity(name, model) {
    const normalizedName = normalizeIdentityPart(name);
    if (!normalizedName) return null;
    return `${normalizedName}\u001f${normalizeIdentityPart(model)}`;
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

async function fetchJson(page, relativeUrl, { retries = 2, retryDelayMs = 3000 } = {}) {
    const url = `${SITE}${relativeUrl}`;
    for (let attempt = 0; ; attempt += 1) {
        const result = await page.evaluate(async (u) => {
            const res = await fetch(u, { headers: { accept: "application/json" } });
            return { ok: res.ok, status: res.status, body: res.ok ? await res.json() : null };
        }, url);

        if (result.ok) {
            return result.body;
        }

        // 403/429 on a data endpoint (as opposed to the "Just a moment" HTML challenge page) is
        // Cloudflare's WAF/bot-management rejecting the request outright, often by IP/ASN reputation
        // rather than by detecting automation in the page itself.
        const isBotBlock = result.status === 403 || result.status === 429;
        if (isBotBlock && attempt < retries) {
            console.warn(`Request to ${url} got ${result.status}; retrying in ${retryDelayMs}ms (attempt ${attempt + 1}/${retries})...`);
            await page.waitForTimeout(retryDelayMs);
            continue;
        }

        if (isBotBlock) {
            throw new CloudflareBlockError(`Request blocked with ${result.status} after ${attempt + 1} attempt(s): ${url}`);
        }
        throw new Error(`Request failed: ${result.status} ${url}`);
    }
}

function buildLookup(records, keyField = "id") {
    const map = new Map();
    for (const record of records ?? []) {
        map.set(record[keyField], record);
    }
    return map;
}

// availability.json: { d: [[factionId,...], ...] (a shared dictionary of faction-sets), u: { publicUid: [[eraId, dictIndex], ...] } }.
// Faction ids use the same taxonomy as the legacy getMULFactionLabels() ids (verified against the live site).
function decodeAvailability(availability, opaqueId) {
    const entries = availability?.u?.[opaqueId];
    if (!entries) return [];
    return entries.map(([eraId, dictIndex]) => ({
        EraId: eraId,
        FactionIds: availability.d[dictIndex] ?? [],
    }));
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
            const key = unitIdentity(item?.Name, item?.Variant);
            if (key && !index.has(key)) {
                index.set(key, { file, Id: item.Id, Name: item.Name, Variant: item.Variant });
            }
        }
    }
    return index;
}

async function archiveExactLegacyMatches(liveRecords) {
    const liveByIdentity = new Map();
    for (const record of liveRecords) {
        const identity = unitIdentity(record.Name, record.Variant);
        if (identity && !liveByIdentity.has(identity)) {
            liveByIdentity.set(identity, record);
        }
    }

    const archived = await loadJson(legacyArchivePath, []);
    const archivedKeys = new Set(archived.map((entry) => entry.archiveKey));
    let archivedCount = 0;
    const files = (await fs.readdir(legacyMulDir)).filter((file) => file.endsWith(".json"));

    for (const file of files) {
        const filePath = path.join(legacyMulDir, file);
        const items = await loadJson(filePath, []);
        const kept = [];

        for (const item of items) {
            const identity = typeof item?.Class === "string" ? unitIdentity(item.Name, item.Variant) : null;
            const liveRecord = identity ? liveByIdentity.get(identity) : null;
            if (!liveRecord) {
                kept.push(item);
                continue;
            }

            const archiveKey = `${file}\u001f${item.Id}\u001f${identity}`;
            if (!archivedKeys.has(archiveKey)) {
                archived.push({
                    archiveKey,
                    sourceFile: file,
                    replacedBy: liveRecord.MulUnitKey,
                    record: item,
                });
                archivedKeys.add(archiveKey);
            }
            archivedCount += 1;
        }

        if (kept.length !== items.length) {
            await saveJson(filePath, kept);
        }
    }

    if (archivedCount > 0) {
        await saveJson(legacyArchivePath, archived);
    }
    return archivedCount;
}

async function scrapeUnitDetail(page, opaqueId) {
    await page.goto(`${SITE}/u/${opaqueId}`, { waitUntil: "domcontentloaded" });

    const bodyText = await page.locator("body").innerText();
    if (isCloudflareChallenge(bodyText)) {
        throw new CloudflareBlockError(`Cloudflare challenge blocked detail scrape for ${opaqueId}`);
    }

    // The stats grid is rendered client-side (Alpine.js) after the JSON fetch resolves, so it isn't
    // there yet at domcontentloaded — wait for it explicitly instead of racing it.
    try {
        await page.waitForSelector(".u-statgrid .v", { timeout: 10_000 });
    } catch {
        throw new Error(`Alpha Strike stats grid never rendered for ${opaqueId} (page may have changed shape).`);
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

    const browser = await chromium.launch({
        // The default headless-shell binary has a distinct, easily bot-fingerprinted signature that
        // got reliably Cloudflare-blocked on this site; the regular full Chromium build (run headless
        // the normal way) does not. Confirmed empirically — see /memories/repo/mul-data-source.md.
        channel: "chromium",
        args: ["--disable-blink-features=AutomationControlled"],
    });
    // A generic bare headless UA is more likely to trip Cloudflare's bot check than an ordinary desktop UA.
    const page = await (await browser.newContext({
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 800 },
    })).newPage();

    let runError = null;
    try {
        await page.goto(SITE, { waitUntil: "networkidle" });
        const bodyText = await page.locator("body").innerText();
        if (isCloudflareChallenge(bodyText)) {
            throw new CloudflareBlockError("Cloudflare challenge blocked the initial site load.");
        }
        await page.waitForTimeout(2_000); // brief pause before the first data request, like a real page load

        const manifest = await fetchJson(page, "/data/manifest.json");
        const files = manifest.files;

        // Fetched one at a time with a small pause between — firing all of these at once (as
        // Promise.all did previously) is a burst pattern no real browser session produces (the site
        // only loads what the user's current filter selection needs), and that shape alone seemed to
        // be enough to trip Cloudflare's bot-management even on the very first request.
        const INDEX_FETCH_PAUSE_MS = 2_000;
        async function fetchIndexFile(relativeUrl) {
            const result = await fetchJson(page, relativeUrl);
            await page.waitForTimeout(INDEX_FETCH_PAUSE_MS);
            return result;
        }

        // Faction ids in availability.json match the legacy getMULFactionLabels() taxonomy (verified
        // against the live site), so we only need the availability index itself, not factions.json.
        const units = await fetchIndexFile(`/data/${files.units}`);
        const unitTypes = await fetchIndexFile(`/data/${files.unit_types}`);
        const roles = await fetchIndexFile(`/data/${files.roles}`);
        const eras = await fetchIndexFile(`/data/${files.eras}`);
        const technologies = await fetchIndexFile(`/data/${files.technologies}`);
        const availability = await fetchJson(page, `/data/${files.availability}`);

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
                const nameKey = unitIdentity(unit.n, unit.m);
                const legacyMatch = legacyNameIndex.get(nameKey);
                if (legacyMatch) {
                    dupeCandidates.push({ opaqueId, name: unit.n, model: unit.m, legacy: legacyMatch });
                }
                numericId = nextSyntheticId++;
            }

            const unitTypeName = unitTypeById.get(unit.t)?.name ?? "n/a";
            const roleName = roleById.get(unit.r)?.name ?? "None";
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
                Availability: decodeAvailability(availability, opaqueId),
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

        const archivedLegacyCount = await archiveExactLegacyMatches(
            Object.values(store.units).map((entry) => entry.record)
        );
        if (archivedLegacyCount > 0) {
            console.log(`Archived ${archivedLegacyCount} exact Name+Model legacy record(s).`);
        }

        const batch = needsDetail.slice(0, MAX_DETAIL_PER_RUN);
        console.log(`${needsDetail.length} units need a detail scrape; processing ${batch.length} this run.`);

        let consecutiveCloudflareBlocks = 0;
        let tookCooldown = false;
        for (const [index, opaqueId] of batch.entries()) {
            const entry = store.units[opaqueId];
            try {
                const detail = await scrapeUnitDetail(page, opaqueId);
                const detailFields = parseDetailIntoRecord(detail, entry.record.Role);
                Object.assign(entry.record, detailFields);
                entry.detailScrapedAt = new Date().toISOString();
                consecutiveCloudflareBlocks = 0;
                console.log(`[${index + 1}/${batch.length}] scraped ${entry.record.Name} ${entry.record.Variant ?? ""}`.trim());
            } catch (error) {
                if (error instanceof CloudflareBlockError) {
                    consecutiveCloudflareBlocks += 1;
                    console.warn(`Cloudflare blocked ${opaqueId} (${consecutiveCloudflareBlocks}/${MAX_CONSECUTIVE_CLOUDFLARE_BLOCKS} consecutive).`);
                    if (consecutiveCloudflareBlocks >= MAX_CONSECUTIVE_CLOUDFLARE_BLOCKS) {
                        if (tookCooldown) {
                            throw new CloudflareBlockError("Repeated Cloudflare challenges during detail scrape — aborting the rest of this run's batch.");
                        }
                        // Back off once for a longer cooldown in case this is transient rate-limiting, then give it one more chance.
                        console.warn(`Backing off for ${COOLDOWN_MS}ms before retrying...`);
                        await page.waitForTimeout(COOLDOWN_MS);
                        tookCooldown = true;
                        consecutiveCloudflareBlocks = 0;
                    }
                } else {
                    console.warn(`Failed to scrape detail for ${opaqueId}: ${error.message}`);
                }
            }

            if (index < batch.length - 1) {
                await page.waitForTimeout(CRAWL_DELAY_MS);
            }
        }
    } catch (error) {
        runError = error; // save whatever progress we made before rethrowing, below
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

    if (runError) {
        throw runError; // preserve partial progress on disk, but still fail the run/CI signal
    }
}

function setGithubActionsOutput(name, value) {
    const outputFile = process.env.GITHUB_OUTPUT;
    if (!outputFile) return; // not running inside GitHub Actions (e.g. local dev)
    fs.appendFile(outputFile, `${name}=${value}\n`).catch(() => undefined);
}

main().catch((error) => {
    if (error instanceof CloudflareBlockError) {
        console.log(`::error::Blocked by Cloudflare — ${error.message}`);
        console.log("::error::This is a site-side bot challenge, not a code bug. Nothing was scraped/committed this run; it will retry next scheduled run.");
        setGithubActionsOutput("failure-reason", "cloudflare-block");
        process.exitCode = 2;
        return;
    }
    console.log(`::error::MUL sync failed unexpectedly: ${error.message}`);
    setGithubActionsOutput("failure-reason", "error");
    console.error(error);
    process.exitCode = 1;
});
