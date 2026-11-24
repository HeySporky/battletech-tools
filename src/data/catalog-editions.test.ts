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
import { DEFAULT_RULES_EDITION, getEditionTimeline } from "./rules-editions";

// Every official record says which editions it is canon in (design 2026-10-21-catalogs-editions §2).
type Record = IEditionHistory & { tag?: string; tons?: number };

const equipment = getEquipmentCatalogDefinitions()
    .filter((definition) => !definition.custom)
    .flatMap((definition) => definition.equipment)
    .filter((item) => getEquipmentRulesLevel(item) < CUSTOM_HOMEBREW_RULES_LEVEL);
const records: Record[] = [
    ...equipment,
    ...mechEngineTypes, ...mechLargeEngineTypes, ...mechGyroTypes, ...mechCockpitTypes, ...mechHeatSinkTypes,
    ...mechJumpJetTypes, ...mechArmorTypes, ...mechInternalStructureTypes, ...mechMyomerTypes, ...btMechTonnages,
    ...mechTypeOptions,
];
// Editions and the pre-Total Warfare expansions, in publication order (design 2026-10-24 ruling 9).
const timeline = getEditionTimeline();
const order = (tag: string) => timeline.findIndex((entry) => entry.tag === tag);
const label = (record: Record) => `${record.tag ?? `${record.tons} tons`}`;

describe("catalog editions", () => {
    it("every official record lists its editions", () => {
        const failures = records
            .filter((record) => !Array.isArray(record.editions) || record.editions.some((tag) => order(tag) < 0))
            .map(label);
        expect(failures).toEqual([]);
    });

    // An earlier edition with no stats is a sourcebook item of that edition's time, which says its level there.
    it("editions agree with editionStats", () => {
        const failures = records.filter((record) => {
            const stats = Object.keys(record.editionStats ?? {});
            const editions = record.editions ?? [];
            return stats.some((tag) => !editions.includes(tag))
                || editions.some((tag) => order(tag) < order(DEFAULT_RULES_EDITION) && !stats.includes(tag)
                    && !(record.editionLevels && tag in record.editionLevels));
        }).map(label);
        expect(failures).toEqual([]);
    });

    it("introducedInEdition is the first edition", () => {
        const failures = records.filter((record) => {
            const editions = record.editions ?? [];
            if (editions.length === 0) return false;
            const first = [...editions].sort((a, b) => order(a) - order(b))[0];
            return first !== (record.introducedInEdition ?? DEFAULT_RULES_EDITION);
        }).map(label);
        expect(failures).toEqual([]);
    });

    it("every equipment record says its tech base", () => {
        const failures = equipment.filter((item) => !["is", "clan", "universal"].includes(item.techBase ?? "")).map(label);
        expect(failures).toEqual([]);
    });
});
