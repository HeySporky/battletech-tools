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

    it("the new filter only adds level hiding", () => {
        const disagreements: string[] = [];
        for (const definition of getEquipmentCatalogDefinitions()) {
            for (const record of definition.equipment) {
                if (getEquipmentRulesLevel(record) >= CUSTOM_HOMEBREW_RULES_LEVEL) {
                    continue;
                }
                for (const edition of btRulesEditions) {
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
