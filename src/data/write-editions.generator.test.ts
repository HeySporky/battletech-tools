import { writeFileSync, mkdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { IEditionHistory } from "./data-interfaces";
import { CUSTOM_HOMEBREW_RULES_LEVEL, getEquipmentCatalogDefinitions, getEquipmentRulesLevel } from "./equipment-registry";
import { mechArmorTypes } from "./mech-armor-types";
import { mechCockpitTypes } from "./mech-cockpit-types";
import { mechEngineTypes, mechLargeEngineTypes } from "./mech-engine-types";
import { mechGyroTypes } from "./mech-gyro-types";
import { mechHeatSinkTypes } from "./mech-heat-sink-types";
import { mechInternalStructureTypes } from "./mech-internal-structure-types";
import { mechJumpJetTypes } from "./mech-jump-jet-types";
import { mechMyomerTypes } from "./mech-myomer-types";
import { btMechTonnages } from "./mech-tonnages";
import { mechTypeOptions } from "./mech-type-options";
import { getRecordEditions } from "./rules-editions";

// Writes .superpowers/ic/editions.json for tools/write_editions.py: { "<file>.ts": { "<tag>" | "tons:<n>": { editions } } }.
// Run with WRITE_EDITIONS=1; skipped otherwise.
type Entry = { editions: string[]; techBase?: string };
type Record = IEditionHistory & { tag?: string; tons?: number; rulesLevel?: number };

describe("editions generator", () => {
    it.skipIf(!process.env.WRITE_EDITIONS)("writes editions.json", () => {
        const out: { [file: string]: { [key: string]: Entry } } = {};
        const add = (file: string, record: Record, techBase?: string): void => {
            const key = record.tag ?? `tons:${record.tons}`;
            out[file] = out[file] ?? {};
            expect(out[file][key], `${file} ${key} repeats`).toBeUndefined();
            out[file][key] = { editions: getRecordEditions({ ...record, editions: undefined }), ...(techBase ? { techBase } : {}) };
        };
        for (const definition of getEquipmentCatalogDefinitions()) {
            if (definition.custom) continue;
            for (const item of definition.equipment) {
                if (getEquipmentRulesLevel(item) >= CUSTOM_HOMEBREW_RULES_LEVEL) continue;
                add(`${definition.id}.ts`, item);
            }
        }
        const components: [string, Record[]][] = [
            ["mech-engine-types.ts", [...mechEngineTypes, ...mechLargeEngineTypes]],
            ["mech-gyro-types.ts", mechGyroTypes],
            ["mech-cockpit-types.ts", mechCockpitTypes],
            ["mech-heat-sink-types.ts", mechHeatSinkTypes],
            ["mech-jump-jet-types.ts", mechJumpJetTypes],
            ["mech-armor-types.ts", mechArmorTypes],
            ["mech-internal-structure-types.ts", mechInternalStructureTypes],
            ["mech-myomer-types.ts", mechMyomerTypes],
            ["mech-tonnages.ts", btMechTonnages],
            ["mech-type-options.ts", mechTypeOptions],
        ];
        for (const [file, records] of components) {
            for (const record of records) add(file, record);
        }
        mkdirSync(".superpowers/ic", { recursive: true });
        writeFileSync(".superpowers/ic/editions.json", JSON.stringify(out, null, 1));
    });
});
