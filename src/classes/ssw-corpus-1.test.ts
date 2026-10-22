import { describe, expect, it } from "vitest";
import { checkSSWCorpus, getSSWCorpusShard, SSW_CORPUS_SHARDS, SSW_KNOWN_MISSING_ITEMS } from "./ssw-corpus-checks";

// The bundled SSW corpus, shard 1 of SSW_CORPUS_SHARDS (see ssw-corpus-checks.ts).
describe(`bundled SSW 'Mechs, shard 1 of ${SSW_CORPUS_SHARDS}`, () => {
    // Regressions covered: tonnage and JSON round trips; critical allocation by UUID only (~8,300 failed allocations);
    // SSW component names imported as Standard engines, gyros and structure; items no catalog record resolves.
    it("imports each design with its tonnage, components and items, and round-trips it through JSON", () => {
        const result = checkSSWCorpus(getSSWCorpusShard(0));
        expect(result.designs).toBeGreaterThan(50);
        expect(result.mismatches).toEqual([]);
        expect(result.failedAllocations).toEqual([]);
        expect(result.wrongComponents).toEqual([]);
        expect([...result.unresolved].filter((error) => !SSW_KNOWN_MISSING_ITEMS.includes(error))).toEqual([]);
    }, 300_000); // generous for slower phones running Termux
});
