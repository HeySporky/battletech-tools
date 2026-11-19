#!/usr/bin/env node
// Groups the 'Mechs whose Battle Value differs from the Master Unit List's (#599), to find shared root causes.
//
// Reads src/data/bundled/mechs-accuracy.json and the design files the bundle is built from, and prints:
//   1. the size and sign of the difference, as a share of the list's BV;
//   2. chassis type and tech base;
//   3. the equipment and construction tags that are common among the differing files and rare among all files
//      of the same format, each with its members.
//
// Usage:  node scripts/bv-miss-groups.mjs [--all-tags]
// The source folders default to the bundle build's; BUNDLED_SSW_DIR, BUNDLED_MEGAMEK_DIR and BUNDLED_MORDEL_DIR override.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SSW_DIR = process.env.BUNDLED_SSW_DIR ?? "C:/repo/battletech-tools/WorkingData_DEV/SSWdata";
const MEGAMEK_DIR = join(process.env.BUNDLED_MEGAMEK_DIR ?? "C:/repo/megamek/megamek/data/mekfiles/unit_files", "meks");
const MORDEL_DIR = process.env.BUNDLED_MORDEL_DIR ?? "C:/repo/mordel-units";
const ALL_TAGS = process.argv.includes("--all-tags");

const accuracy = JSON.parse(readFileSync(new URL("../src/data/bundled/mechs-accuracy.json", import.meta.url), "utf8"));

const listFiles = (dir, extension) => {
    if (!existsSync(dir)) return [];
    const found = [];
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) found.push(...listFiles(full, extension));
        else if (name.toLowerCase().endsWith(extension)) found.push(full);
    }
    return found;
};

const sourcePath = (file) => file.startsWith("megamek/") ? join(MEGAMEK_DIR, file.slice(8))
    : file.startsWith("mordel/") ? join(MORDEL_DIR, file.slice(7))
    : join(SSW_DIR, file);

const HEADER_FIELDS = ["config", "techbase", "engine", "structure", "myomer", "cockpit", "gyro", "armor", "heat sinks", "ejection", "lam", "motive"];
const STRUCTURAL = /^(shoulder|hip|upper (arm|leg) actuator|lower (arm|leg) actuator|hand actuator|foot actuator|life support|sensors|cockpit|gyro|fusion engine|engine|-empty-|heat sink|landing gear|avionics)$/i;

const FLUFF = /^(overview|capabilities|deployment|history|manufacturer|primaryfactory|systemmanufacturer|systemmode|notes|imagefile|quirk|weaponquirk|nocrit|bv|use|length|width|height|padding_adjustment)\s*:/i;

/** The tags of a MegaMek-format file: its construction header lines and each distinct item in its critical slots. */
const mtfTags = (text) => {
    const tags = new Set();
    let inSlots = false;
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line || line.startsWith("#")) continue;
        const header = /^([A-Za-z ]+):(.*)$/.exec(line);
        if (header && !inSlots) {
            const key = header[1].trim().toLowerCase();
            let value = header[2].trim();
            if (/^(left|right|center|head|front|rear).*(arm|leg|torso|head)$/i.test(header[1].trim()) || key === "head") { inSlots = true; continue; }
            if (!HEADER_FIELDS.includes(key) || !value) continue;
            if (key === "engine") value = value.replace(/^\d+\s*/, "");
            if (key === "heat sinks") value = value.replace(/^\d+\s*/, "");
            tags.add(`${key}: ${value}`);
            continue;
        }
        if (/^[A-Za-z ]+:$/.test(line)) { inSlots = true; continue; }
        if (!inSlots || FLUFF.test(line)) continue;
        for (const part of line.split("|")) {
            const item = part.replace(/\((R|omnipod|T|FL|RL)\)/gi, "").replace(/:(size|SIZE):[\d.]+/, "").replace(/\s+/g, " ").trim();
            if (item && !STRUCTURAL.test(item)) tags.add(item);
        }
    }
    return tags;
};

/** The tags of a Skunk Werks file: the text of its name and type elements, and its tech base and motive type. */
const sswTags = (text) => {
    const tags = new Set();
    for (const match of text.matchAll(/<(name|type|motive_type|techbase)[^>]*>([^<]+)</g)) {
        if (match[1] === "name" && tags.size === 0) continue;
        tags.add(`${match[1]}: ${match[2].trim()}`);
    }
    for (const match of text.matchAll(/<(cockpit|gyro|engine|armor|structure|enhancement|heatsinks)\b[^>]*>\s*<type>([^<]+)</g)) tags.add(`${match[1]}: ${match[2].trim()}`);
    return tags;
};

const tagsOf = (path) => {
    const text = readFileSync(path, "utf8");
    return path.toLowerCase().endsWith(".ssw") ? sswTags(text) : mtfTags(text);
};

const corpora = {
    mtf: [...listFiles(MEGAMEK_DIR, ".mtf"), ...listFiles(MORDEL_DIR, ".mtf")],
    ssw: listFiles(SSW_DIR, ".ssw"),
};
const tagCounts = { mtf: new Map(), ssw: new Map() };
for (const [format, files] of Object.entries(corpora)) {
    for (const file of files) {
        let tags;
        try { tags = tagsOf(file); } catch { continue; }
        for (const tag of tags) tagCounts[format].set(tag, (tagCounts[format].get(tag) ?? 0) + 1);
    }
}

const misses = accuracy.differs.map((miss) => {
    const path = sourcePath(miss.file);
    const format = path.toLowerCase().endsWith(".ssw") ? "ssw" : "mtf";
    const tags = existsSync(path) ? tagsOf(path) : new Set();
    const difference = miss.ours - miss.mul;
    const tagList = [...tags];
    const find = (pattern) => tagList.find((tag) => pattern.test(tag)) ?? "";
    const text = tagList.join("\n");
    const chassis = [
        /quadvee/i.test(text) ? "QuadVee" : /config: quad|motive_type: quad/i.test(text) ? "quad" : "",
        /tripod/i.test(text) ? "tripod" : "",
        /config: lam|land.air/i.test(find(/^config|^motive/i)) ? "LAM" : "",
        /industrial|primitive/i.test(find(/^(structure|cockpit)/i) + find(/^structure/i)) ? "industrial or primitive" : "",
        /omni/i.test(find(/^config/i)) || miss.config ? "OmniMech" : "",
        /superheavy/i.test(text) ? "superheavy" : "",
    ].filter(Boolean).join(", ") || "biped";
    return { ...miss, path, format, tags, difference, share: difference / miss.mul, chassis, techBase: find(/^techbase/i).replace(/^techbase: /i, "") || "(not read)", found: existsSync(path) };
});

const label = (miss) => `${miss.name}${miss.config ? ` ${miss.config}` : ""} (${miss.difference > 0 ? "+" : ""}${miss.difference}, ${(miss.share * 100).toFixed(1)}%)`;
const group = (title, keyOf) => {
    const groups = new Map();
    for (const miss of misses) { const key = keyOf(miss); groups.set(key, [...(groups.get(key) ?? []), miss]); }
    console.log(`\n## ${title}\n`);
    for (const [key, members] of [...groups].sort((a, b) => b[1].length - a[1].length)) console.log(`- ${key}: ${members.length}\n    ${members.map(label).join("; ")}`);
};

console.log(`# 'Mech Battle Value misses: ${misses.length} (matched ${accuracy.matched})`);
const missing = misses.filter((miss) => !miss.found);
if (missing.length) console.log(`\nSource file not found for ${missing.length}: ${missing.map((miss) => miss.file).join("; ")}`);

group("By size and sign of the difference", (miss) => {
    const size = Math.abs(miss.share);
    return `${miss.difference > 0 ? "ours higher" : "ours lower"}, ${size < 0.005 ? "under 0.5%" : size < 0.02 ? "0.5% to 2%" : size < 0.05 ? "2% to 5%" : "5% or more"}`;
});
group("By chassis type", (miss) => miss.chassis);
group("By tech base", (miss) => miss.techBase);

console.log("\n## By tag: common among the misses, rare among all files of the format\n");
console.log("(members / files of that format with the tag; a tag held by one miss only is left out unless --all-tags)\n");
const rows = [];
for (const format of ["mtf", "ssw"]) {
    const ofFormat = misses.filter((miss) => miss.format === format);
    const base = ofFormat.length / Math.max(1, corpora[format].length);
    const seen = new Map();
    for (const miss of ofFormat) for (const tag of miss.tags) seen.set(tag, [...(seen.get(tag) ?? []), miss]);
    for (const [tag, members] of seen) {
        const total = tagCounts[format].get(tag) ?? members.length;
        const rate = members.length / total;
        if ((members.length >= 2 || ALL_TAGS) && rate >= base * 4) rows.push({ format, tag, members, total, rate });
    }
}
rows.sort((a, b) => b.rate * Math.log2(1 + b.members.length) - a.rate * Math.log2(1 + a.members.length));
for (const row of rows) console.log(`- [${row.format}] ${row.tag}: ${row.members.length} of ${row.total} (${(row.rate * 100).toFixed(0)}%)\n    ${row.members.map(label).join("; ")}`);

const tagged = new Set(rows.flatMap((row) => row.members));
const untagged = misses.filter((miss) => !tagged.has(miss));
console.log(`\n## In no tag group: ${untagged.length}\n`);
for (const miss of untagged) console.log(`- ${label(miss)}  [${miss.chassis}; ${miss.techBase}]  ${miss.file}`);
