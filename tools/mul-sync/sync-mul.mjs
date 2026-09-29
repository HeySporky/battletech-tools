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
 * 1. Loads the site once with a real (headless) browser to clear Cloudflare's JS challenge, then
 *    fetches the static index JSON files it publishes (manifest + units + lookup tables) — no
 *    per-unit scraping needed for this part.
 * 2. Diffs the fresh index against our persisted store (tools/mul-sync/live-units.json) to find
 *    new/changed units.
 * 3. For a capped batch of new/changed units per run (MUL_SYNC_MAX_DETAIL, respecting the site's
 *    robots.txt `Crawl-delay: 10`), visits the unit detail page to scrape full Alpha Strike card
 *    stats (size/move/TMM/armor/struct/damage/overheat/abilities) not present in the index JSON.
 * 4. Regenerates src/data/mul/live/*.json chunk files from the accumulated store.
 *
 * MUL 1.0 leftovers (src/data/mul/mul1/mul1-leftovers.json) are legacy numeric-id records the live
 * site does not list. A leftover is only moved to src/data/mul/archive/ when exactly one fully
 * detailed live unit has the same full name, the same unit-type family, and the same tonnage.
 * Anything looser (name-only matches) is just logged to
 * tools/mul-sync/legacy-duplicate-candidates.json for a human to review — name-only matching once
 * archived the 45t Tomahawk C fighter as the 100t Tomahawk C BattleMech.
 *
 * RELIABILITY FIXES applied in this revision (see chat discussion for the full rationale on each):
 *   1. fetchJson no longer blindly calls res.json() on any 2xx status — it reads text first and
 *      checks Content-Type + an HTML sniff, so a 200-status Cloudflare challenge page (which was
 *      the original bug: "Unexpected token '<' ... is not valid JSON") is now caught and retried
 *      the same way a 403/429 already was, instead of crashing with an opaque SyntaxError.
 *   2. Browser storage state (cookies, including cf_clearance) is now persisted to
 *      browser-state.json and reloaded on the next run, so a run doesn't necessarily start from
 *      zero trust with Cloudflare every single time.
 *   3. All fixed delays (CRAWL_DELAY_MS, INDEX_FETCH_PAUSE_MS, the pre-fetch pause, COOLDOWN_MS)
 *      are now jittered +/-30% — a perfectly uniform cadence is itself a signal some bot-management
 *      heuristics can score on, separate from the delay's length.
 *   4. The initial page load now gets one short retry if a Cloudflare challenge is detected, since
 *      many JS challenges auto-resolve client-side within a few seconds.
 *   5. The user agent's Chrome version is now derived from the actual launched browser version
 *      instead of a hardcoded constant, so it can't silently drift out of sync with the real
 *      engine fingerprint after a Playwright/Chromium update.
 *   6. A screenshot is captured on Cloudflare-block / run-failure paths (last-failure.png) so a
 *      future block can be diagnosed by looking at the page instead of just an error string.
 */

import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const mulDataDir = path.join(repoRoot, "src", "data", "mul");
const liveMulDir = path.join(mulDataDir, "live");
const mul1LeftoversPath = path.join(mulDataDir, "mul1", "mul1-leftovers.json");
const legacyArchivePath = path.join(mulDataDir, "archive", "replaced-legacy-records.json");
const storePath = path.join(__dirname, "live-units.json");
const dupeReportPath = path.join(__dirname, "legacy-duplicate-candidates.json");
const storageStatePath = path.join(__dirname, "browser-state.json");

// FIX 6: written on a Cloudflare-block or unexpected run failure, before the browser closes.
const failureScreenshotPath = path.join(__dirname, "last-failure.png");

const SITE = "https://masterunitlist.battletech.com";

// robots.txt only requires 10s; we default a bit more conservative since Cloudflare's bot-management
// appears to score request cadence/pattern, not just IP reputation. Override via env if needed.
const CRAWL_DELAY_MS = Number(process.env.MUL_SYNC_CRAWL_DELAY_MS ?? 12_000);
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

function jitter(baseMs, spread = 0.3) {
    const delta = baseMs * spread;
    return Math.round(baseMs + (Math.random() * 2 - 1) * delta);
}

async function loadStorageStateIfPresent(statePath) {
    try {
        await fs.access(statePath);
        return statePath;
    } catch {
        return undefined;
    }
}

async function captureFailureScreenshot(page, label) {
    try {
        await page.screenshot({ path: failureScreenshotPath, fullPage: true });
        console.warn(`Saved failure screenshot (${label}) to ${path.relative(repoRoot, failureScreenshotPath)}`);
    } catch (screenshotError) {
        console.warn(`Could not capture failure screenshot: ${screenshotError.message}`);
    }
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

const LEGACY_TYPE_ID_BY_NAME = {
    BattleMech: 18,
    "Combat Vehicle": 19,
    OmniVehicle: 19,
    "Fighter Craft": 17,
    "Aerospace Craft": 17,
    "Battle Armor": 22,
    Infantry: 21,
    ProtoMech: 23,
    IndustrialMech: 20,
    "Support Vehicle": 24,
    "Advanced Support": 24,
};

const LEGACY_ERA_ID_BY_LIVE_ID = {
    2: 10,
    3: 11,
    4: 13,
    5: 14,
    6: 15,
    7: 16,
    8: 247,
    10: 254,
    11: 255,
    12: 256,
    13: 257,
};

function normalizeIdentityPart(value) {
    return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

// Full "chassis model" designation. MUL 1.0 splits it as Class + Variant, the live index as n + m,
// and the split point differs between them ("Von Rohrs (Hebi)" + "VON 4RH-5"), so compare the whole.
function unitIdentity(name, model) {
    const normalizedName = normalizeIdentityPart(name);
    if (!normalizedName) return null;
    return normalizeIdentityPart(`${normalizedName} ${model ?? ""}`);
}

// Coarse unit-type family, so reclassified units still match but a fighter never matches a 'Mech.
function liveFamily(unitTypeName) {
    return {
        BattleMech: "MECH",
        OmniMech: "MECH",
        IndustrialMech: "IM",
        ProtoMech: "PM",
        "Battle Armor": "BA",
        Infantry: "CI",
        "Combat Vehicle": "VEH",
        OmniVehicle: "VEH",
        "Support Vehicle": "SV",
        "Advanced Support": "SV",
        "Fighter Craft": "AERO",
        "Aerospace Craft": "AERO",
    }[unitTypeName] ?? "?";
}

function mul1Family(typeName) {
    const t = String(typeName ?? "");
    if (/^BattleMech/.test(t)) return "MECH";
    if (/^IndustrialMech/.test(t)) return "IM";
    if (/^Protomech/i.test(t)) return "PM";
    if (/^Battle Armor/.test(t)) return "BA";
    if (/^Infantry/.test(t)) return "CI";
    if (/^Combat Vehicle/.test(t)) return "VEH";
    if (/^(Support Vehicle|Advanced Support)/.test(t)) return "SV";
    if (/^(Aerospace|Advanced Aerospace)/.test(t)) return "AERO";
    return "?";
}

function sameTonnage(a, b) {
    return Number.isFinite(+a) && Number.isFinite(+b) && Math.abs(+a - +b) < 0.051;
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
            const contentType = res.headers.get("content-type") ?? "";
            const text = await res.text();
            return { ok: res.ok, status: res.status, contentType, text };
        }, url);

        if (result.ok) {
            const looksLikeJson = result.contentType.includes("application/json");
            const looksLikeHtml = result.text.trimStart().startsWith("<");

            if (!looksLikeJson || looksLikeHtml) {
                // A 2xx status with a non-JSON body means Cloudflare (or some other intermediary)
                // served an interstitial/error page instead of the payload we asked for. This is
                // exactly the case the original isBotBlock check (403/429 only) never caught.
                if (isCloudflareChallenge(result.text)) {
                    if (attempt < retries) {
                        console.warn(
                            `Cloudflare challenge (200 OK, non-JSON body) fetching ${url}; retrying in ${retryDelayMs}ms (attempt ${attempt + 1}/${retries})...`
                        );
                        await page.waitForTimeout(jitter(retryDelayMs));
                        continue;
                    }
                    throw new CloudflareBlockError(
                        `Cloudflare challenge (200 OK, non-JSON body) blocked JSON fetch after ${attempt + 1} attempt(s): ${url}`
                    );
                }
                throw new Error(
                    `Expected JSON from ${url} but got Content-Type "${result.contentType}" with a 200 status. First 200 chars: ${result.text.slice(0, 200)}`
                );
            }

            try {
                return JSON.parse(result.text);
            } catch (err) {
                throw new Error(
                    `Failed to parse JSON from ${url}: ${err.message}. Body started with: ${result.text.slice(0, 200)}`
                );
            }
        }

        // 403/429 on a data endpoint (as opposed to the "Just a moment" HTML challenge page) is
        // Cloudflare's WAF/bot-management rejecting the request outright, often by IP/ASN reputation
        // rather than by detecting automation in the page itself.
        const isBotBlock = result.status === 403 || result.status === 429;
        if (isBotBlock && attempt < retries) {
            console.warn(`Request to ${url} got ${result.status}; retrying in ${retryDelayMs}ms (attempt ${attempt + 1}/${retries})...`);
            await page.waitForTimeout(jitter(retryDelayMs));
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
        EraId: LEGACY_ERA_ID_BY_LIVE_ID[eraId] ?? eraId,
        FactionIds: availability.d[dictIndex] ?? [],
    }));
}

function summaryHashOf(unit) {
    // Cheap change-detector for the fields the index actually carries.
    return JSON.stringify([unit.n, unit.m, unit.t, unit.st, unit.r, unit.te, unit.ton, unit.pv, unit.bv, unit.iy, unit.ie, unit.ab, unit.hp]);
}

async function loadLegacyNameIndex() {
    const index = new Map();
    for (const item of await loadJson(mul1LeftoversPath, [])) {
        const key = unitIdentity(item?.Class || item?.Name, item?.Variant);
        if (key && !index.has(key)) {
            index.set(key, { file: path.basename(mul1LeftoversPath), Id: item.Id, Name: item.Name, Variant: item.Variant });
        }
    }
    return index;
}

// Every stat the unit detail page supplies. A record missing any of these is still index-only
// (name/model/era/faction availability), which is less data than the legacy entry already holds.
const REQUIRED_DETAIL_FIELDS = [
    "BFSize",
    "BFMove",
    "BFTMM",
    "BFArmor",
    "BFStructure",
    "BFPointValue",
    "BFOverheat",
    "BFAbilities",
    "BFDamageShort",
    "BFDamageMedium",
    "BFDamageLong",
    "BFDamageExtreme",
];

// Zero and "" are legitimate values, so test for presence rather than truthiness.
function isFullyDetailed(record) {
    return REQUIRED_DETAIL_FIELDS.every((field) => record?.[field] !== undefined && record[field] !== null);
}

async function archiveExactLegacyMatches(liveRecords) {
    const liveByIdentity = new Map();
    for (const record of liveRecords) {
        if (!isFullyDetailed(record)) {
            continue;
        }
        const identity = unitIdentity(record.Name, record.Variant);
        if (identity) {
            liveByIdentity.set(identity, [...(liveByIdentity.get(identity) ?? []), record]);
        }
    }

    const leftovers = await loadJson(mul1LeftoversPath, []);
    const archived = await loadJson(legacyArchivePath, []);
    const archivedKeys = new Set(archived.map((entry) => entry.archiveKey));
    const sourceFile = path.basename(mul1LeftoversPath);
    const kept = [];
    let archivedCount = 0;

    for (const item of leftovers) {
        const identity = typeof item?.Class === "string" ? unitIdentity(item.Class, item.Variant) : null;
        const matches = (identity ? liveByIdentity.get(identity) ?? [] : []).filter(
            (record) => liveFamily(record.Class) === mul1Family(item.Type?.Name) && sameTonnage(record.Tonnage, item.Tonnage)
        );

        if (matches.length !== 1) {
            kept.push(item);
            continue;
        }

        const archiveKey = `${sourceFile}\u001f${item.Id}\u001f${identity}`;
        if (!archivedKeys.has(archiveKey)) {
            archived.push({
                archiveKey,
                sourceFile,
                replacedBy: matches[0].MulUnitKey,
                verifiedBy: "sync-exact",
                record: item,
            });
            archivedKeys.add(archiveKey);
        }
        archivedCount += 1;
    }

    if (archivedCount > 0) {
        await saveJson(mul1LeftoversPath, kept);
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
        channel: "chromium",
        args: ["--disable-blink-features=AutomationControlled"],
    });

    const browserVersion = await browser.version();
    console.log(`Launched browser: ${browserVersion}`);
    const chromeMajor = browserVersion.match(/(\d+)\./)?.[1] ?? "130";
    const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeMajor}.0.0.0 Safari/537.36`;

    const context = await browser.newContext({
        userAgent,
        viewport: { width: 1280, height: 800 },
        storageState: await loadStorageStateIfPresent(storageStatePath),
    });
    const page = await context.newPage();

    let runError = null;
    let needsDetailCount = 0;
    let detailScrapedThisRun = 0;
    let archivedCount = 0;
    try {
        await page.goto(SITE, { waitUntil: "networkidle" });
        let bodyText = await page.locator("body").innerText();

        if (isCloudflareChallenge(bodyText)) {
            console.warn("Cloudflare challenge detected on initial load; waiting to see if it clears client-side...");
            await page.waitForTimeout(jitter(6_000));
            bodyText = await page.locator("body").innerText();
            if (isCloudflareChallenge(bodyText)) {
                await captureFailureScreenshot(page, "initial-load-challenge");
                throw new CloudflareBlockError("Cloudflare challenge blocked the initial site load.");
            }
            console.log("Cloudflare challenge cleared after waiting.");
        }

        await page.waitForTimeout(jitter(2_000)); // brief pause before the first data request, like a real page load

        const manifest = await fetchJson(page, "/data/manifest.json");
        const files = manifest.files;

        const INDEX_FETCH_PAUSE_MS = 2_000;
        async function fetchIndexFile(relativeUrl) {
            const result = await fetchJson(page, relativeUrl);
            await page.waitForTimeout(jitter(INDEX_FETCH_PAUSE_MS));
            return result;
        }

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
                Role: { Id: unit.r, Name: roleName, Image: null, SortOrder: 0 },
                Technology: { Id: unit.te, Name: techName, Image: null, SortOrder: 0 },
                Type: {
                    Id: LEGACY_TYPE_ID_BY_NAME[unitTypeName] ?? 0,
                    Name: unitTypeName,
                    Image: null,
                    SortOrder: unitTypeById.get(unit.t)?.sort ?? 0,
                },
                BFType: BF_TYPE_BY_UNIT_TYPE_NAME[unitTypeName] ?? null,
                EraId: LEGACY_ERA_ID_BY_LIVE_ID[unit.ie] ?? unit.ie ?? 0,
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

        needsDetailCount = needsDetail.length;
        archivedCount = await archiveExactLegacyMatches(
            Object.values(store.units)
                .filter((entry) => entry.detailScrapedAt)
                .map((entry) => entry.record)
        );
        if (archivedCount > 0) {
            console.log(`Archived ${archivedCount} exact Name+Model legacy record(s).`);
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
                detailScrapedThisRun += 1;
                console.log(`[${index + 1}/${batch.length}] scraped ${entry.record.Name} ${entry.record.Variant ?? ""}`.trim());
            } catch (error) {
                if (error instanceof CloudflareBlockError) {
                    consecutiveCloudflareBlocks += 1;
                    console.warn(`Cloudflare blocked ${opaqueId} (${consecutiveCloudflareBlocks}/${MAX_CONSECUTIVE_CLOUDFLARE_BLOCKS} consecutive).`);
                    if (consecutiveCloudflareBlocks >= MAX_CONSECUTIVE_CLOUDFLARE_BLOCKS) {
                        if (tookCooldown) {
                            await captureFailureScreenshot(page, "repeated-cloudflare-blocks");
                            throw new CloudflareBlockError("Repeated Cloudflare challenges during detail scrape — aborting the rest of this run's batch.");
                        }
                        // Back off once for a longer cooldown in case this is transient rate-limiting, then give it one more chance.
                        console.warn(`Backing off for ~${COOLDOWN_MS}ms before retrying...`);
                        await page.waitForTimeout(jitter(COOLDOWN_MS));
                        tookCooldown = true;
                        consecutiveCloudflareBlocks = 0;
                    }
                } else {
                    console.warn(`Failed to scrape detail for ${opaqueId}: ${error.message}`);
                }
            }

            if (index < batch.length - 1) {
                await page.waitForTimeout(jitter(CRAWL_DELAY_MS));
            }
        }
    } catch (error) {
        await captureFailureScreenshot(page, "run-error");
        runError = error; // save whatever progress we made before rethrowing, below
    } finally {
        // FIX 2: persist cookies for next run regardless of whether this run fully succeeded —
        // even a partial run may have earned fresh Cloudflare trust worth keeping.
        try {
            await context.storageState({ path: storageStatePath });
        } catch (stateError) {
            console.warn(`Failed to persist browser storage state: ${stateError.message}`);
        }
        await browser.close();
    }

    await saveJson(storePath, store);
    await saveJson(dupeReportPath, dupeCandidates);
    await appendGithubStepSummary(
        [
            "## Weekly MUL Sync",
            "",
            needsDetailCount === 0
                ? "No new or changed units found this run."
                : `**${needsDetailCount}** new/changed unit(s) found in the index; detail-scraped **${detailScrapedThisRun}** this run.`,
            "",
            `- Legacy records archived (exact match, fully detailed): ${archivedCount}`,
            `- Potential legacy duplicates logged for review: ${dupeCandidates.length}`,
        ].join("\n")
    );

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

async function appendGithubStepSummary(markdown) {
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (!summaryFile) return; // not running inside GitHub Actions (e.g. local dev)
    await fs.appendFile(summaryFile, `${markdown}\n`).catch(() => undefined);
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
