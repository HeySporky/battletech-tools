import { describe, expect, it } from "vitest";
import { IEditionStats, IEquipmentItem } from "./data-interfaces";
import {
    btRulesEditions,
    DEFAULT_RULES_EDITION,
    getRecordEditions,
    getRecordLevelInEdition,
    getRecordOfferIssue,
    isInRulesEdition,
    isOfferedInEdition
} from "./rules-editions";
import { getEquipmentCatalogDefinitions, getEquipmentOfferIssue, getEquipmentRulesLevel, isEquipmentOffered } from "./equipment-registry";
import { APOCRYPHAL_RULES_LEVEL, CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";
import { mechEngineTypes, mechLargeEngineTypes } from "./mech-engine-types";
import { mechArmorTypes } from "./mech-armor-types";
import { mechGyroTypes } from "./mech-gyro-types";
import { mechHeatSinkTypes } from "./mech-heat-sink-types";
import { mechInternalStructureTypes } from "./mech-internal-structure-types";
import { mechJumpJetTypes } from "./mech-jump-jet-types";
import { mechMyomerTypes } from "./mech-myomer-types";
import { BattleMech } from "../classes/battlemech";

const isEquipmentWithinRulesLevel = (item: IEquipmentItem, rulesLevel: number): boolean => {
    const level = getEquipmentRulesLevel(item);
    return level < APOCRYPHAL_RULES_LEVEL || level <= rulesLevel;
};

const stats = { book: "BD", page: 1 } as unknown as IEditionStats;
const asItem = (fields: object) => fields as unknown as IEquipmentItem;
const editionOrder = (tag: string) => btRulesEditions.findIndex(edition => edition.tag === tag);

/** Fixture: isInRulesEdition as it was before the edition standing functions. */
function isInRulesEditionOld(record: { introducedInEdition?: string; editionStats?: object; apocryphalIn?: object }, editionTag: string, rulesLevel?: number): boolean {
    if (rulesLevel !== undefined && rulesLevel >= APOCRYPHAL_RULES_LEVEL && record.apocryphalIn && editionTag in record.apocryphalIn) {
        return true;
    }
    const selected = editionOrder(editionTag);
    if (selected < 0) {
        return false;
    }
    if (selected < editionOrder(DEFAULT_RULES_EDITION)) {
        return record.editionStats !== undefined && editionTag in record.editionStats;
    }
    const introduced = editionOrder(record.introducedInEdition ?? DEFAULT_RULES_EDITION);
    return introduced >= 0 && introduced <= selected;
}

describe("record edition standing", () => {
    it("derives editions from today's rules", () => {
        expect(getRecordEditions({ introducedInEdition: "total-warfare" })).toEqual(["total-warfare", "battlemech-manual", "core-rulebook"]);
        expect(getRecordEditions({ editionStats: { battledroids: stats, "battletech-manual": null } })).toEqual(["battledroids", "battletech-manual", "total-warfare", "battlemech-manual", "core-rulebook"]);
        expect(getRecordEditions({ rulesLevel: 5 })).toEqual([]);
    });

    it("canon level hides above the selected level", () => {
        const record = { rulesLevel: 3 };
        expect(getRecordOfferIssue(record, "total-warfare", 2)).toBe("level");
        expect(getRecordOfferIssue(record, "total-warfare", 3)).toBeNull();
    });

    it("earlier editions ignore the Total Warfare level until graded", () => {
        const record = { rulesLevel: 3, editionStats: { battledroids: stats } };
        expect(getRecordLevelInEdition(record, "battledroids")).toBe(0);
        expect(getRecordOfferIssue(record, "battledroids", 0)).toBeNull();
        expect(getRecordOfferIssue({ ...record, editionLevels: { battledroids: 2 } }, "battledroids", 1)).toBe("level");
    });

    it("dropped records are apocryphal later", () => {
        const record = { editions: ["battledroids"] };
        expect(getRecordOfferIssue(record, "total-warfare", 4)).toBe("edition");
        expect(getRecordOfferIssue(record, "total-warfare", 5)).toBeNull();
    });

    it("not yet canon stays hidden", () => {
        expect(getRecordOfferIssue({ editions: ["core-rulebook"] }, "total-warfare", 5)).toBe("edition");
    });

    it("apocryphalIn only where listed", () => {
        const record = { editions: [], apocryphalIn: { battledroids: { source: "BT", notes: "n" } } };
        expect(getRecordOfferIssue(record, "battledroids", 5)).toBeNull();
        expect(getRecordOfferIssue(record, "battledroids", 4)).toBe("edition");
        expect(getRecordOfferIssue(record, "total-warfare", 5)).toBe("edition");
    });

    it("never-canon with no source is apocryphal from Total Warfare on", () => {
        const record = { editions: [] };
        expect(getRecordOfferIssue(record, "total-warfare", 5)).toBeNull();
        expect(getRecordOfferIssue(record, "battledroids", 5)).toBe("edition");
    });

    it("an unknown edition is never offered", () => {
        expect(getRecordOfferIssue({ editions: [] }, "no-such-edition", 7)).toBe("edition");
        expect(isOfferedInEdition({ rulesLevel: 0 }, "total-warfare", 0)).toBe(true);
    });

    it("isInRulesEdition counts level-hidden records as included", () => {
        expect(isInRulesEdition({ rulesLevel: 3 }, "total-warfare")).toBe(true);
        expect(isInRulesEdition({ rulesLevel: 3 }, "total-warfare", 0)).toBe(true);
        expect(isInRulesEdition({ editions: ["core-rulebook"] }, "total-warfare", 0)).toBe(false);
    });
});

describe("equipment edition standing", () => {
    it("custom content is offered in every edition at its level", () => {
        const item = asItem({ catalog: "custom" });
        expect(getEquipmentOfferIssue(item, "battledroids", 6)).toBeNull();
        expect(getEquipmentOfferIssue(item, "battledroids", 5)).toBe("level");
    });

    it("prototype-only items need Experimental", () => {
        const item = asItem({ introduced: null, prototype: 3050, rulesLevel: 2 });
        expect(getEquipmentOfferIssue(item, "total-warfare", 3)).toBe("level");
        expect(getEquipmentOfferIssue(item, "total-warfare", 4)).toBeNull();
    });

    it("a FASA-era sourcebook item is Experimental in its editions and apocryphal after them", () => {
        const buzzsaw = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment).find((item) => item.tag === "buzzsaw")!;
        expect(getEquipmentOfferIssue(buzzsaw, "master-rules", 3)).toBe("level");
        expect(getEquipmentOfferIssue(buzzsaw, "master-rules", 4)).toBeNull();
        expect(getEquipmentOfferIssue(buzzsaw, "total-warfare", 4)).toBe("edition");
        expect(getEquipmentOfferIssue(buzzsaw, "total-warfare", 5)).toBeNull();
    });

    // BMR p.130 / BMR(R) p.141: flare LRMs are Level 2; TM errata v4.1 p.18 removes them, so TW keeps them Apocryphal.
    it("offers flare LRM ammo under BMR and BMR(R), apocryphal under TW", () => {
        const flare = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment).find((item) => item.tag === "ammo-lrm-flare")!;
        for (const edition of ["master-rules", "master-rules-revised"]) {
            expect(getEquipmentOfferIssue(flare, edition, 1), edition).toBe("level");
            expect(getEquipmentOfferIssue(flare, edition, 2), edition).toBeNull();
        }
        for (const edition of ["total-warfare", "battlemech-manual", "core-rulebook"]) {
            expect(getEquipmentOfferIssue(flare, edition, 4), edition).toBe("edition");
            expect(getEquipmentOfferIssue(flare, edition, 5), edition).toBeNull();
        }
        expect(flare.apocryphalIn!["total-warfare"].source).toBe("TM errata v4.1 p.18");
    });

    // Maximum Tech p.59: six targeting and tracking systems, Level 3 of BMR(R); VRTS and Multi-Trac II weigh half a
    // ton in 1 head slot, the rest nothing. Total Warfare-era rules print none of them.
    it("offers VRTS and Multi-Trac II under BMR(R) Advanced only, head only", () => {
        const all = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment);
        for (const kind of ["long-range", "short-range", "variable-range", "anti-aircraft", "multi-trac", "multi-trac-ii"]) {
            const item = all.find((entry) => entry.tag === `targeting-${kind}`)!;
            const headed = kind === "variable-range" || kind === "multi-trac-ii";
            expect([item?.weight, item?.space.battlemech, item?.allowedLocations, item?.editionStats?.["master-rules-revised"]?.page], kind)
                .toEqual(headed ? [0.5, 1, ["hd"], 59] : [0, 0, undefined, 59]);
            expect(getEquipmentOfferIssue(item, "master-rules-revised", 2), kind).toBe("level");
            expect(getEquipmentOfferIssue(item, "master-rules-revised", 3), kind).toBeNull();
            expect(getEquipmentOfferIssue(item, "master-rules", 5), kind).toBe("edition");
            expect(getEquipmentOfferIssue(item, "total-warfare", 4), kind).toBe("edition");
            expect(getEquipmentOfferIssue(item, "total-warfare", 5), kind).toBeNull();
        }
    });

    // Level 1 / Introductory is the technology of 3025 (BMR p.6, BMR(R) p.6; How the Core Rulebooks Work p.2).
    it("Level 1 and Introductory offer only 3025 technology", () => {
        const find = (tag: string) => getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment).find((item) => item.tag === tag)!;
        const engine = (tag: string) => mechEngineTypes.find((record) => record.tag === tag)!;
        const mech = new BattleMech();
        for (const edition of ["master-rules", "master-rules-revised", "total-warfare"]) {
            mech.setRulesEdition(edition);
            for (const tag of ["er-large-laser", "ammo-is-lrm-swarm-i"]) {
                expect(getEquipmentOfferIssue(find(tag), edition, 1), `${tag} ${edition}`).toBe("level");
                expect(getEquipmentOfferIssue(find(tag), edition, 2), `${tag} ${edition}`).toBeNull();
            }
            expect(getEquipmentOfferIssue(find("medium-laser"), edition, 1), edition).toBeNull();
            expect(getEquipmentOfferIssue(find("ammo-lrm-standard"), edition, 1), edition).toBeNull();
            expect(mech.isOfferedInEdition(engine("xl"), 1), edition).toBe(false);
            expect(mech.isOfferedInEdition(engine("xl"), 2), edition).toBe(true);
            expect(mech.isOfferedInEdition(engine("standard"), 1), edition).toBe(true);
        }
    });

    it("'Mech parts carry their TO:AUE / IO:AE rules level (#613)", () => {
        const mech = new BattleMech();
        mech.setRulesEdition("total-warfare");
        const parts: [string, { tag: string, rulesLevel?: number }[], number][] = [
            ["hardened", mechArmorTypes, 4], ["reactive", mechArmorTypes, 4], ["laser-reflective", mechArmorTypes, 4],
            ["impact-resistant", mechArmorTypes, 3], ["xxl", mechEngineTypes, 4], ["large-standard", mechLargeEngineTypes, 4],
            ["reinforced", mechInternalStructureTypes, 4], ["laser", mechHeatSinkTypes, 3], ["compact", mechHeatSinkTypes, 4],
            ["umu", mechJumpJetTypes, 4], ["risc-super-cooled-myomer", mechMyomerTypes, 4],
        ];
        for (const [tag, records, level] of parts) {
            const part = records.find((record) => record.tag === tag)!;
            expect(part, tag).toBeDefined();
            expect(mech.isOfferedInEdition(part, level - 1), tag).toBe(false);
            expect(mech.isOfferedInEdition(part, level), tag).toBe(true);
        }
        // TechManual parts stay Standard.
        expect(mech.isOfferedInEdition(mechGyroTypes.find((gyro) => gyro.tag === "xl")!, 2)).toBe(true);
        expect(mech.isOfferedInEdition(mechArmorTypes.find((armor) => armor.tag === "ferro-fibrous")!, 2)).toBe(true);

        // The design's required level counts its parts.
        mech.setTech("mis");
        expect(mech.getRequiredRulesLevel()).toBeLessThanOrEqual(2);
        mech.setArmorType("hardened");
        expect(mech.getArmorType()).toBe("hardened");
        expect(mech.getRequiredRulesLevel()).toBe(4);
        mech.setArmorType("standard");
        mech.setHeatSinksType("laser");
        expect(mech.getRequiredRulesLevel()).toBe(3);
    });

    it("the new filter only adds level hiding", () => {
        const disagreements: string[] = [];
        for (const definition of getEquipmentCatalogDefinitions()) {
            for (const record of definition.equipment) {
                if (getEquipmentRulesLevel(record) >= CUSTOM_HOMEBREW_RULES_LEVEL) {
                    continue;
                }
                for (const edition of btRulesEditions) {
                    // The old filter could not drop a record, nor see a sourcebook item of an earlier edition (canon
                    // there with no editionStats): skip editions after its last canon one and those sourcebook ones.
                    if (record.editions?.length && record.editions.every((tag) => editionOrder(tag) < editionOrder(edition.tag))) {
                        continue;
                    }
                    if (record.editionLevels && edition.tag in record.editionLevels && !(record.editionStats && edition.tag in record.editionStats)) {
                        continue;
                    }
                    for (let level = 0; level <= 7; level++) {
                        const old = isInRulesEditionOld(record, edition.tag, level) && isEquipmentWithinRulesLevel(record, level);
                        const offered = isEquipmentOffered(record, edition.tag, level);
                        if (offered && !old) {
                            disagreements.push(`${record.tag} ${edition.tag} L${level}: offered, old hid it`);
                        } else if (old && !offered && getEquipmentOfferIssue(record, edition.tag, level) !== "level") {
                            disagreements.push(`${record.tag} ${edition.tag} L${level}: hidden by edition, old showed it`);
                        }
                    }
                }
            }
        }
        expect(disagreements.slice(0, 20)).toEqual([]);
    });
});
