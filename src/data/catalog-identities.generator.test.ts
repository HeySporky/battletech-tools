import { writeFileSync } from "node:fs";
import { it } from "vitest";
import { getAllCatalogs } from "./catalog-registry";

// Every catalog record's identity (catalog, tag, name, other spellings, tech base, book) for
// tools/coverage_checklist.py (design 2026-10-24-catalog-consolidation §4). Run with
// CATALOG_IDENTITIES_OUT=<file.json>; skipped otherwise.
const OUT = process.env.CATALOG_IDENTITIES_OUT;

interface IIdentity { tag?: string; name?: string; altNames?: string[]; altTags?: string[]; alternateName?: string; techBase?: string; book?: string }

it.skipIf(!OUT)("writes every catalog record's identity", () => {
    const records = getAllCatalogs().flatMap(catalog => (catalog.records as IIdentity[]).map(record => ({
        catalog: catalog.id, custom: catalog.custom, tag: record.tag, name: record.name, altNames: record.altNames ?? [],
        altTags: record.altTags ?? [], alternateName: record.alternateName, techBase: record.techBase, book: record.book,
    })));
    writeFileSync(OUT!, JSON.stringify(records, null, 1));
});
