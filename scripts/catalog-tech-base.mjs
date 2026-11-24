// Catalog rework step 1: write `techBase` into every bundled equipment and ammunition record, right after its tag.
//
//   node scripts/catalog-tech-base.mjs [--reference <commit>] [--check]
//
// Inner Sphere, Clan and universal catalogs give their records the catalog's own tech base. Custom records keep the
// value the reference commit gave them (default c959dbc8, the first pass, reviewed by tag and name); a custom record
// the reference doesn't know is set from its tag and name and listed for review. Records that already state a tech
// base are left alone, so the script can be run again after a rebase or merge. --check writes nothing and exits 1
// when a record would change.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const CATALOGS = {
    is: ["mech-is-ammo", "mech-is-equipment-weapons-artillery", "mech-is-equipment-weapons-ballistic",
        "mech-is-equipment-weapons-energy", "mech-is-equipment-weapons-misc", "mech-is-equipment-weapons-missiles"],
    clan: ["mech-clan-ammo", "mech-clan-equipment-weapons-artillery", "mech-clan-equipment-weapons-ballistic",
        "mech-clan-equipment-weapons-energy", "mech-clan-equipment-weapons-misc", "mech-clan-equipment-weapons-missile"],
    universal: ["mech-universal-ammo", "mech-universal-equipment"],
    custom: ["mech-custom-ammo", "mech-custom-equipment-weapons-ballistic", "mech-custom-equipment-weapons-energy",
        "mech-custom-equipment-weapons-misc", "mech-custom-equipment-weapons-missile"],
};

const args = process.argv.slice(2);
const check = args.includes("--check");
const reference = args.includes("--reference") ? args[args.indexOf("--reference") + 1] : "c959dbc8";

// A record's own tag: `tag: "..."` not preceded by a word character (so not altTags or feedsWeaponTag).
const TAG = /(?<![\w])tag: "([^"]+)"(,?)/g;

/** Tag -> tech base for the records of a file's text, reading the first techBase after each tag. */
function techBasesIn(text) {
    const found = new Map();
    const tags = [...text.matchAll(TAG)];
    tags.forEach((match, index) => {
        const end = index + 1 < tags.length ? tags[index + 1].index : text.length;
        const value = /techBase: "(is|clan|universal)"/.exec(text.slice(match.index, end));
        if (value) found.set(match[1], value[1]);
    });
    return found;
}

function referenceText(file) {
    try {
        return execFileSync("git", ["show", `${reference}:src/data/${file}.ts`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    } catch {
        return "";
    }
}

const referenceBases = new Map();
for (const files of Object.values(CATALOGS)) {
    for (const file of files) for (const [tag, base] of techBasesIn(referenceText(file))) referenceBases.set(tag, base);
}

/** First pass for a custom record with no reference value: Clan or Inner Sphere when the tag or name says so. */
function guessCustom(tag, recordText) {
    const name = /name: "([^"]+)"/.exec(recordText)?.[1] ?? "";
    if (/(^|-)clan(-|$)/.test(tag) || /\(C\)|\bClan\b/.test(name)) return "clan";
    if (/(^|-)is(-|$)/.test(tag) || /\(IS\)|Inner Sphere/.test(name)) return "is";
    return "universal";
}

const added = [];
const forReview = [];
const disagreements = [];
for (const [catalog, files] of Object.entries(CATALOGS)) {
    for (const file of files) {
        const path = `src/data/${file}.ts`;
        const text = readFileSync(path, "utf8");
        const tags = [...text.matchAll(TAG)];
        let out = "";
        let last = 0;
        tags.forEach((match, index) => {
            const tag = match[1];
            const end = index + 1 < tags.length ? tags[index + 1].index : text.length;
            const record = text.slice(match.index, end);
            const stated = /techBase: "(is|clan|universal)"/.exec(record)?.[1];
            let base = catalog === "custom" ? referenceBases.get(tag) : catalog;
            if (!base) {
                base = guessCustom(tag, text.slice(Math.max(0, text.lastIndexOf("{", match.index)), end));
                forReview.push(`${file}: ${tag} -> ${base}`);
            }
            if (catalog !== "custom" && referenceBases.has(tag) && referenceBases.get(tag) !== base) {
                disagreements.push(`${file}: ${tag} is now in the ${catalog} catalog; ${reference} said ${referenceBases.get(tag)}`);
            }
            if (stated) return;
            const afterTag = match.index + match[0].length;
            const lineEnd = text.indexOf("\n", afterTag);
            const restOfLine = text.slice(afterTag, lineEnd === -1 ? text.length : lineEnd).trim();
            const comma = match[2] ? "" : ",";
            let insertion;
            if (restOfLine === "") {
                const lineStart = text.lastIndexOf("\n", match.index) + 1;
                const indent = /^\s*/.exec(text.slice(lineStart, match.index))[0];
                insertion = `${comma}\n${indent}techBase: "${base}",`;
                if (!match[2]) insertion = `${comma}\n${indent}techBase: "${base}"`;
            } else {
                insertion = `${comma} techBase: "${base}",`;
            }
            out += text.slice(last, afterTag) + insertion;
            last = afterTag;
            added.push(`${file}: ${tag}`);
        });
        out += text.slice(last);
        if (!check && out !== text) writeFileSync(path, out);
    }
}

console.log(`${added.length} records ${check ? "would get" : "got"} techBase (reference ${reference}: ${referenceBases.size} records).`);
if (forReview.length) console.log(`\nCustom records the reference doesn't know, set from tag and name (review):\n  ${forReview.join("\n  ")}`);
if (disagreements.length) console.log(`\nRecords whose catalog changed since the reference:\n  ${disagreements.join("\n  ")}`);
if (check && added.length) process.exit(1);
