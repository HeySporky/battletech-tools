import { describe, expect, it } from "vitest";
import { IEditionStats, IEquipmentItem } from "./data-interfaces";
import {
    btRulesEditions,
    DEFAULT_RULES_EDITION,
    getEWarPlayRules,
    getRecordEditions,
    getRecordLevelInEdition,
    getRecordOfferIssue,
    isInRulesEdition,
    isOfferedInEdition
} from "./rules-editions";
import { getEquipmentCatalogDefinitions, getEquipmentOfferIssue, getEquipmentRulesLevel, isEquipmentOffered } from "./equipment-registry";
import { APOCRYPHAL_RULES_LEVEL, CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";
import { infantryArmor } from "./infantry-armor";
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

    // Task 8 (#642): the BattleMech Manual prints the Streak LRM and Enhanced LRM launchers (pp.102-104), the Artemis IV and V
    // FCS and missiles (pp.110, 107), Apollo, Narc and iNarc pods (pp.104, 107-108), TAG and Light TAG (p.113) and the AMS and
    // Laser AMS (p.118). It prints none of the IO:AE prototypes and improved Clan launchers, the RISC APDS, the TO:AUE Bola
    // pods, the shoot-and-sit pods, Retro-Streak ammo, or Artemis IV for the Extended LRM (Advanced Fire Control: No, p.103).
    it("takes the missile and defense items the BattleMech Manual does not print out of its list, keeps the rest", () => {
        const all = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment);
        const launchers = ["lrm-5", "lrm-10", "lrm-15", "lrm-20", "srm-2", "srm-4", "srm-6"];
        const notPrinted = ["is-risc-apds", "ammo-is-risc-apds-standard", "prototype-narc", "prototype-tag",
            ...launchers.map((launcher) => `${launcher}-artemis-p`),
            ...launchers.flatMap((launcher) => [`clan-improved-${launcher}-artemis-iv`, `clan-improved-${launcher}-artemis-v`]),
            "clan-prototype-streak-srm-4", "clan-prototype-streak-srm-6",
            "ammo-is-narc-bola", "ammo-is-narc-shoot-and-sit", "ammo-is-streak-srm-retro-streak", "ammo-is-extended-lrm-artemis-iv"];
        expect(notPrinted).toHaveLength(31);
        for (const tag of notPrinted) {
            const item = all.find((entry) => entry.tag === tag);
            expect(item, tag).toBeDefined();
            expect(item!.editions, tag).not.toContain("battlemech-manual");
            expect(item!.editions, tag).toContain("total-warfare");
        }
        // Fix round 2 (#642): the Core Rulebook presents the items available as of 3150 (CRB p.180) and prints, in its tables
        // pp.248-253, the Artemis IV and V, Narc and TAG, the Extended LRM (Artemis IV allowed, p.185) and the APDS (p.206), but
        // none of the IO:AE prototypes, improved Clan launchers, Bola or shoot-and-sit pods, or Retro-Streak ammo.
        const inCoreRulebook = ["is-risc-apds", "ammo-is-risc-apds-standard", "ammo-is-extended-lrm-artemis-iv"];
        for (const tag of notPrinted) {
            const item = all.find((entry) => entry.tag === tag)!;
            if (inCoreRulebook.includes(tag)) {
                expect(item.editions, tag).toContain("core-rulebook");
            } else {
                expect(item.editions, tag).not.toContain("core-rulebook");
            }
        }
        // Fix round 3 (#642): the improved one-shot launchers (TO:AUE p.139, BMM p.103) are not in the Core Rulebook, which
        // prints only the plain one-shot Weapon Type (CRB p.182).
        const improvedOneShot = all.filter((entry) => entry.tag.endsWith("-ios"));
        expect(improvedOneShot).toHaveLength(48);
        for (const item of improvedOneShot) {
            expect(item.editions, item.tag).not.toContain("core-rulebook");
            expect(item.editions, item.tag).toContain("battlemech-manual");
        }
        // The improved Clan launchers (TO:AUE, IO:AE) and their ammunition, and Maximum Tech's smoke and heat-seeking missiles,
        // are in neither the Core Rulebook (pp.185-187, 192-193) nor the BattleMech Manual (pp.102-108).
        const launcherSizes = ["lrm-5", "lrm-10", "lrm-15", "lrm-20", "srm-2", "srm-4", "srm-6"];
        for (const tag of [...launcherSizes.map((size) => `clan-improved-${size}`), "ammo-clan-improved-lrm-standard", "ammo-clan-improved-srm-standard",
            "ammo-lrm-smoke", "ammo-srm-smoke", "ammo-lrm-heat-seeking", "ammo-srm-heatseeking"]) {
            const item = all.find((entry) => entry.tag === tag)!;
            expect(item, tag).toBeDefined();
            expect(item.editions, tag).not.toContain("core-rulebook");
            if (tag.includes("smoke") || tag.includes("heat")) {
                expect(item.editions, tag).not.toContain("battlemech-manual");
                expect(item.editions, tag).toContain("master-rules");
                expect(item.editions, tag).toContain("total-warfare");
            }
        }
        // The APDS is in the Core Rulebook (CRB p.206).
        expect(all.find((entry) => entry.tag === "is-risc-apds")!.editions).toContain("core-rulebook");
        for (const tag of ["is-ams", "clan-ams", "is-laser-ams", "clan-laser-ams", "lrm-5-artemis-iv", "clan-lrm-5-artemis-v", "mrm-10-apollo", "narc", "inarc", "is-tag",
            "clan-light-tag", "streak-lrm-5", "clan-streak-srm-2", "enhanced-lrm-5-artemis-iv", "mml-3-artemis-iv", "ammo-is-lrm-semi-guided",
            "ammo-is-narc-explosive", "ammo-clan-streak-lrm-standard", "ammo-clan-lrm-artemis-v", "ammo-lrm-narc", "ammo-is-inarc-nemesis"]) {
            expect(all.find((entry) => entry.tag === tag)?.editions, tag).toContain("battlemech-manual");
        }
    });

    // E-War audit, stealth (Task 10, #642). Maximum Tech p.83 prints the Null-Signature System (tables pp.85, 87) as Level 3 of
    // the Master Rules; the BattleMech Manual lists the stealth systems in its quirk lists only (p.87 text), never as equipment.
    it("offers the Null-Signature System under BMR and BMR(R) at Level 3 and keeps the BMM to what it prints", () => {
        const all = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment);
        const find = (tag: string) => all.find((entry) => entry.tag === tag)!;
        const item = find("null-signature-system");
        for (const edition of ["master-rules", "master-rules-revised"]) {
            expect(item.editions, edition).toContain(edition);
            expect(item.editionLevels?.[edition], edition).toBe(3);
            const printed = item.editionStats?.[edition];
            expect([printed?.book, printed?.page, printed?.weight, printed?.criticals, printed?.heat, printed?.cbills], edition)
                .toEqual(["MaxTech", 83, 0, 7, 10, 2000000]);
            expect(getEquipmentOfferIssue(item, edition, 2), edition).toBe("level");
            expect(getEquipmentOfferIssue(item, edition, 3), edition).toBeNull();
        }
        expect(item.introducedInEdition).toBe("master-rules");
        expect(item.editions).toContain("total-warfare");
        expect(item.editions).toContain("core-rulebook");
        for (const tag of ["null-signature-system", "void-signature-system", "chameleon-lps"]) {
            expect(find(tag).editions, tag).not.toContain("battlemech-manual");
        }
        // Maximum Tech prints no Void-Signature System or Chameleon LPS.
        for (const tag of ["void-signature-system", "chameleon-lps"]) {
            expect(find(tag).editions, tag).not.toContain("master-rules");
        }
    });

    // Maximum Tech (FASA 1999 and Revised) prints the Laser AMS (p.72; tables pp.85-86), Artemis V (p.75; table p.86), Streak LRM
    // (p.81; table p.86) and Bola pods (p.83), all Level 3 of the Master Rules it rides on (NGCFells, 2026-11-20: a book that
    // offers an item for an edition makes it available there). Both printings print the same figures (page images).
    it("offers Maximum Tech's Laser AMS, Artemis V, Streak LRM and Bola pods under BMR and BMR(R) at Level 3", () => {
        const all = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment);
        const find = (tag: string) => all.find((entry) => entry.tag === tag)!;
        // tag, page, weight, criticals, cbills (launcher with its system, or the ton of ammunition)
        const rows: [string, number, number, number | undefined, number][] = [
            ["is-laser-ams", 72, 1.5, 2, 225000], ["clan-laser-ams", 72, 1.5, 2, 225000],
            ["clan-lrm-5-artemis-v", 75, 2.5, 3, 280000], ["clan-lrm-10-artemis-v", 75, 4, 3, 350000],
            ["clan-lrm-15-artemis-v", 75, 5, 4, 425000], ["clan-lrm-20-artemis-v", 75, 6.5, 6, 500000],
            ["clan-srm-2-artemis-v", 75, 2, 3, 260000], ["clan-srm-4-artemis-v", 75, 2.5, 3, 310000], ["clan-srm-6-artemis-v", 75, 3, 3, 330000],
            ["ammo-clan-lrm-artemis-v", 75, 1, undefined, 150000], ["ammo-clan-srm-artemis-v", 75, 1, undefined, 135000],
            ["streak-lrm-5", 81, 2, 1, 75000], ["streak-lrm-10", 81, 5, 2, 225000], ["streak-lrm-15", 81, 7, 3, 400000], ["streak-lrm-20", 81, 10, 5, 600000],
            ["ammo-clan-streak-lrm-standard", 81, 1, undefined, 60000], ["ammo-is-narc-bola", 83, 1, undefined, 2000],
            // Smoke and heat-seeking missiles (MT p.82): 1.5 x and 2 x the normal price of a ton, normal LRM 30,000 and SRM 27,000 (price list p.87).
            ["ammo-lrm-smoke", 82, 1, undefined, 45000], ["ammo-srm-smoke", 82, 1, undefined, 40500],
            ["ammo-lrm-heat-seeking", 82, 1, undefined, 60000], ["ammo-srm-heatseeking", 82, 1, undefined, 54000],
        ];
        for (const [tag, page, weight, criticals, cbills] of rows) {
            const item = find(tag);
            expect(item, tag).toBeDefined();
            for (const edition of ["master-rules", "master-rules-revised"]) {
                expect(item.editions, `${tag} ${edition}`).toContain(edition);
                expect(item.editionLevels?.[edition], `${tag} ${edition}`).toBe(3);
                const printed = item.editionStats?.[edition];
                expect([printed?.book, printed?.page, printed?.weight, printed?.criticals, printed?.cbills], `${tag} ${edition}`).toEqual(["MaxTech", page, weight, criticals, cbills]);
                expect(getEquipmentOfferIssue(item, edition, 2), `${tag} ${edition}`).toBe("level");
                expect(getEquipmentOfferIssue(item, edition, 3), `${tag} ${edition}`).toBeNull();
            }
            expect(item.introducedInEdition, tag).toBe("master-rules");
            expect(item.editions, tag).toContain("total-warfare");
        }
        // Streak LRM: heat, ranges and shots a ton (MT p.86); the Laser AMS has a 2D6 heat, so no figure (MT p.72).
        const range = { min: 0, short: 7, medium: 14, long: 21 };
        expect(["streak-lrm-5", "streak-lrm-10", "streak-lrm-15", "streak-lrm-20"].map((tag) => {
            const printed = find(tag).editionStats!["master-rules"]!;
            return [printed.heat, printed.range, printed.shotsPerTon];
        })).toEqual([[2, range, 24], [4, range, 12], [5, range, 8], [6, range, 6]]);
        expect(find("is-laser-ams").editionStats!["master-rules"]!.heat).toBeUndefined();
        // Maximum Tech prints no torpedoes, one-shot Streak LRMs or APDS: they stay out of BMR.
        for (const tag of ["clan-lrt-5-artemis-v", "clan-srt-2-artemis-v", "streak-lrm-5-os", "is-risc-apds"]) {
            expect(find(tag).editions, tag).not.toContain("master-rules");
        }
    });

    // E-War audit, ECM and probes (Task 9, #642): Maximum Tech (both printings) prints the Angel ECM suite (p.77; tables
    // pp.85-86, price p.87) and the Bloodhound active probe (p.72; table p.85) at Level 3 of the Master Rules it rides on
    // (a book that offers an item for an edition makes it available there). Its Clan Angel is 1.5 tons; the record is the
    // Inner Sphere's 2 tons.
    it("offers Maximum Tech's Angel ECM and Bloodhound probe under BMR and BMR(R) at Level 3", () => {
        const all = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment);
        const find = (tag: string) => all.find((entry) => entry.tag === tag)!;
        // tag, page, weight, criticals, cbills
        const rows: [string, number, number, number, number][] = [
            ["angel-ecm", 77, 2, 2, 750000],
            ["bloodhound-active-probe", 72, 2, 3, 500000],
        ];
        for (const [tag, page, weight, criticals, cbills] of rows) {
            const item = find(tag);
            expect(item, tag).toBeDefined();
            for (const edition of ["master-rules", "master-rules-revised"]) {
                expect(item.editions, `${tag} ${edition}`).toContain(edition);
                expect(item.editionLevels?.[edition], `${tag} ${edition}`).toBe(3);
                const printed = item.editionStats?.[edition];
                expect([printed?.book, printed?.page, printed?.weight, printed?.criticals, printed?.cbills], `${tag} ${edition}`).toEqual(["MaxTech", page, weight, criticals, cbills]);
                expect(getEquipmentOfferIssue(item, edition, 2), `${tag} ${edition}`).toBe("level");
                expect(getEquipmentOfferIssue(item, edition, 3), `${tag} ${edition}`).toBeNull();
            }
            expect(item.introducedInEdition, tag).toBe("master-rules");
            expect(item.editions, tag).toContain("total-warfare");
        }
        // Maximum Tech prints the Clan Angel apart at 1.5 tons (table p.86, 2 slots); the price is one figure (p.87).
        for (const edition of ["master-rules", "master-rules-revised"]) {
            expect(find("angel-ecm").editionStats![edition]!.clan, edition).toEqual({ weight: 1.5, criticals: 2 });
        }
        expect(find("bloodhound-active-probe").editionStats!["master-rules"]!.clan).toBeUndefined();
        // The earlier Compendium editions do not have them.
        for (const tag of ["angel-ecm", "bloodhound-active-probe"]) {
            expect(find(tag).editions, tag).not.toContain("battletech-compendium");
        }
    });

    // Fix round 2 (#642): a Clan unit mounts Maximum Tech's Angel ECM at the Clan table's 1.5 tons (p.86), an Inner Sphere unit
    // at 2 tons (p.85); Total Warfare (TO:AUE p.91) prints one figure for both.
    it("builds the Angel ECM at the Clan weight for a Clan 'Mech under the Master Rules", () => {
        const mount = (tech: string, edition: string) => {
            const mech = new BattleMech();
            mech.setRulesEdition(edition);
            mech.setTech(tech);
            return mech.addEquipmentFromTag("angel-ecm", tech, "ct", false, undefined, "", false, [], undefined, undefined)!;
        };
        for (const edition of ["master-rules", "master-rules-revised"]) {
            const clan = mount("clan", edition);
            expect([clan.weight, clan.space.battlemech], `clan ${edition}`).toEqual([1.5, 2]);
            const inner = mount("is", edition);
            expect([inner.weight, inner.space.battlemech], `is ${edition}`).toEqual([2, 2]);
        }
        expect(mount("clan", "total-warfare").weight).toBe(2);
    });

    // Fix round 3 (#642): under Maximum Tech an item keeps its own technology base's figures, so a Mixed Tech 'Mech picks the
    // Clan Angel (tag `clan-angel-ecm`, 1.5 t) or the Inner Sphere one (`angel-ecm`, 2 t) from the equipment list.
    it("offers a Mixed Tech 'Mech both the Clan Angel (1.5 t) and the Inner Sphere Angel (2 t) under the Master Rules", () => {
        for (const tech of ["mis", "mclan"]) {
            for (const edition of ["master-rules", "master-rules-revised"]) {
                const mech = new BattleMech();
                mech.setRulesEdition(edition);
                mech.setTech(tech);
                const clan = mech.addEquipmentFromTag("clan-angel-ecm", tech, "ct", false, undefined, "", false, [], undefined, undefined)!;
                expect([clan.tag, clan.techBase, clan.weight, clan.space.battlemech], `${tech} ${edition} clan`).toEqual(["clan-angel-ecm", "clan", 1.5, 2]);
                const inner = mech.addEquipmentFromTag("angel-ecm", tech, "lt", false, undefined, "", false, [], undefined, undefined)!;
                expect([inner.tag, inner.weight, inner.space.battlemech], `${tech} ${edition} is`).toEqual(["angel-ecm", 2, 2]);
            }
        }
        // Total Warfare prints one figure and offers no separate Clan entry; the pure units are as before.
        const total = new BattleMech();
        total.setRulesEdition("total-warfare");
        total.setTech("mis");
        expect(total.addEquipmentFromTag("angel-ecm", "mis", "ct", false, undefined, "", false, [], undefined, undefined)!.weight).toBe(2);
        const pure = new BattleMech();
        pure.setRulesEdition("master-rules");
        pure.setTech("is");
        expect(pure.addEquipmentFromTag("angel-ecm", "is", "ct", false, undefined, "", false, [], undefined, undefined)!.weight).toBe(2);
    });

    // Task 13 review (#642): catalog edition trims of the E-War audit, each against the book that does or does not print it.
    it("keeps the E-War audit's catalog edition trims", () => {
        const all = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment);
        const editionsOf = (tag: string) => all.find((entry) => entry.tag === tag)!.editions;
        // Ruling 8: the Core Rulebook prints items as of 3150 (CRB p.180) and no primitive or prototype rocket launcher items.
        const primitive = all.filter((entry) => entry.tag.startsWith("primitive-prototype-") || entry.tag.startsWith("prototype-rocket-launcher-"));
        expect(primitive.length).toBeGreaterThanOrEqual(26);
        for (const entry of primitive) expect(entry.editions, entry.tag).not.toContain("core-rulebook");
        // Bomb-carried TAG ammo: neither BMM nor CRB prints bombs.
        for (const tag of ["ammo-is-bomb-tag", "ammo-clan-bomb-tag"]) {
            expect(editionsOf(tag), tag).not.toContain("core-rulebook");
            expect(editionsOf(tag), tag).not.toContain("battlemech-manual");
        }
        // Chaff Pod (TO:AUE p.111), Naval C3 (TO:AUE p.144) and EW Equipment (TO:AUE p.123): Total Warfare only; BMM names EW
        // Equipment only in its quirk list (p.87) and the CRB not at all.
        for (const tag of ["chaff-pod", "naval-c3", "ew-equipment"]) expect(editionsOf(tag), tag).toEqual(["total-warfare"]);
    });

    // Task 13 review (#642): switching edition restats a mounted Angel with the 'Mech's technology base, so a Clan 'Mech's
    // Angel weighs 1.5 t under Maximum Tech (p.86) and 2 t under Total Warfare (TO:AUE p.91), whichever way it switches.
    it("restats a Clan 'Mech's Angel ECM by its technology base when the rules edition changes", () => {
        const angelWeight = (mech: BattleMech) => mech.getInstalledEquipment().find((item) => item.tag === "angel-ecm")!.weight;
        const up = new BattleMech();
        up.setTech("clan");
        up.addEquipmentFromTag("angel-ecm", "clan", "ct", false, undefined, "", false, [], undefined, undefined);
        expect(angelWeight(up)).toBe(2);
        up.setRulesEdition("master-rules");
        expect(angelWeight(up)).toBe(1.5);
        const down = new BattleMech();
        down.setRulesEdition("master-rules");
        down.setTech("clan");
        down.addEquipmentFromTag("angel-ecm", "clan", "ct", false, undefined, "", false, [], undefined, undefined);
        expect(angelWeight(down)).toBe(1.5);
        down.setRulesEdition("total-warfare");
        expect(angelWeight(down)).toBe(2);
    });

    // Maximum Tech p.38 prints infantry ECM and camo suits (the platoon's cost doubles for each type, quadruples for both).
    it("offers Maximum Tech's infantry camo and ECM suits under BMR and BMR(R) at Level 3", () => {
        const find = (tag: string) => infantryArmor.find((entry) => entry.tag === tag)!;
        for (const tag of ["inf-armor-sneak-suit-camo", "inf-armor-sneak-suit-ecm", "inf-armor-sneak-suit-camo-ecm"]) {
            const item = find(tag);
            for (const edition of ["master-rules", "master-rules-revised"]) {
                expect(item.editions, `${tag} ${edition}`).toContain(edition);
                expect(item.editionLevels?.[edition], `${tag} ${edition}`).toBe(3);
                expect([item.editionStats?.[edition]?.book, item.editionStats?.[edition]?.page], `${tag} ${edition}`).toEqual(["MaxTech", 38]);
            }
            expect(item.editions, tag).toContain("total-warfare");
            // Its first edition is the Master Rules (Maximum Tech rides on it), as for the Angel ECM and the Bloodhound.
            expect(item.introducedInEdition, tag).toBe("master-rules");
        }
        // The IR suit is not in Maximum Tech.
        expect(find("inf-armor-sneak-suit-ir").editions).not.toContain("master-rules");
    });

    // The BattleMech Manual prints the Active Probe, Light Active Probe, Beagle, Bloodhound, ECM suite, Angel ECM and Watchdog
    // (pp.110, 112-114) but not the Nova CEWS (IO:AE p.60) or the IO:AE prototype Beagle and Guardian (pp.65-66).
    it("takes the E-War items the BattleMech Manual does not print out of its list, keeps the rest", () => {
        const all = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment);
        for (const tag of ["clan-nova-cews", "beagle-active-probe-prototype", "guardian-ecm-prototype"]) {
            const item = all.find((entry) => entry.tag === tag);
            expect(item, tag).toBeDefined();
            expect(item!.editions, tag).not.toContain("battlemech-manual");
            // The Core Rulebook equipment chapter presents the items available to BattleMechs as of 3150 (CRB p.180) and its
            // tables (pp.248-253) list the Beagle, Bloodhound, Active and Light probes, ECM, Angel and Watchdog, but no Nova CEWS
            // and no IO:AE prototype.
            expect(item!.editions, tag).not.toContain("core-rulebook");
            expect(item!.editions, tag).toContain("total-warfare");
        }
        for (const tag of ["ecm-suite", "clan-ecm-system", "angel-ecm", "clan-watchdog-cews", "beagle-active-probe", "clan-active-probe",
            "clan-light-active-probe", "bloodhound-active-probe"]) {
            expect(all.find((entry) => entry.tag === tag)?.editions, tag).toContain("battlemech-manual");
            expect(all.find((entry) => entry.tag === tag)?.editions, tag).toContain("core-rulebook");
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
                    // there with no editionStats): skip editions after its last canon one, editions its list leaves out
                    // between its first and last (the Battlemech Manual does not print the IO:AE prototypes, #642), and
                    // those sourcebook ones.
                    if (record.editions?.length && (record.editions.every((tag) => editionOrder(tag) < editionOrder(edition.tag))
                        || (edition.tag === "battlemech-manual" && !record.editions.includes(edition.tag)
                            && editionOrder(edition.tag) > Math.min(...record.editions.map(editionOrder))))) {
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

describe("Items a later edition drops stay available there as apocryphal (NGCFells 2026-11-21)", () => {
    const all = () => getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment);
    it("offers the Nova CEWS and the IO:AE prototypes in the BattleMech Manual and Core Rulebook at the Apocryphal level, not below it", () => {
        for (const tag of ["clan-nova-cews", "beagle-active-probe-prototype", "guardian-ecm-prototype"]) {
            const item = all().find((entry) => entry.tag === tag)!;
            for (const edition of ["battlemech-manual", "core-rulebook"]) {
                expect(getEquipmentOfferIssue(item, edition, APOCRYPHAL_RULES_LEVEL), `${tag} ${edition} apocryphal`).toBeNull();
                expect(getEquipmentOfferIssue(item, edition, 3), `${tag} ${edition} canon level`).not.toBeNull();
            }
        }
    });
    it("plays them under the last rule printed: the E-War table keeps an apocryphal entry for each", () => {
        const items = (edition: string) => getEWarPlayRules(edition)!.items;
        for (const edition of ["battlemech-manual", "core-rulebook"]) {
            for (const kind of ["ecm-nova", "ecm-guardian-prototype", "probe-beagle-prototype"] as const) {
                expect(items(edition)[kind], `${edition} ${kind}`).toMatchObject({ apocryphal: true });
            }
        }
        // The Core Rulebook prints the APDS; the BattleMech Manual does not.
        expect(items("battlemech-manual").apds).toMatchObject({ apocryphal: true });
        expect(items("battlemech-manual").apds?.defense).toBeDefined();
        expect(items("core-rulebook").apds?.apocryphal).toBeUndefined();
        // Items an edition prints are untouched.
        expect(items("battlemech-manual")["ecm-guardian"]?.apocryphal).toBeUndefined();
    });
});

// Maximum Tech (FASA 1999 and Revised) Level 3 weapons and equipment under the Master Rules it rides on (#612; NGCFells,
// 2026-11-20: a book that offers an item for an edition makes it available there). Master table p.118, Level 3 tables pp.85-86,
// prices p.87; both printings print the same figures. tag, rules page, weight, criticals, price.
describe("Maximum Tech's Level 3 weapons and equipment under BMR and BMR(R) (#612)", () => {
    const maxTech: [string, number, number | undefined, number, number | undefined][] = [
        ["large-x-pulse-laser", 84, 7, 2, 275000], ["medium-x-pulse-laser", 84, 2, 1, 110000], ["small-x-pulse-laser", 84, 1, 1, 31000],
        ["er_large_pulse_laser", 78, 6, 3, 400000], ["er_medium_pulse_laser", 78, 2, 2, 150000], ["er_small_pulse_laser", 78, 1.5, 1, 30000],
        ["heavy-flamer", 78, 1, 1, 20000], ["ppc-capacitor", 83, 8, 4, 350000], ["er-ppc-capacitor", 83, 8, 4, 450000],
        ["autocannon-light-2", 77, 4, 1, 100000], ["autocannon-light-5", 77, 5, 2, 150000],
        ["long-tom-cannon", 75, 20, 15, 650000], ["sniper-cannon", 75, 15, 10, 475000], ["thumper-cannon", 75, 10, 7, 200000],
        ["thunderbolt-5", 84, 3, 1, 50000], ["thunderbolt-10", 84, 7, 2, 175000], ["thunderbolt-15", 84, 11, 3, 325000], ["thunderbolt-20", 84, 15, 5, 450000],
        ["vehicular-grenade-launcher", 78, 0.5, 1, 10000], ["case-ii", 77, 1, 1, 175000], ["clan-case-ii", 77, 0.5, 1, 175000],
        ["coolant-pod", 77, 1, 1, 50000], ["supercharger", 84, undefined, 1, undefined],
    ];
    const all = () => getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment);

    it("offers each at Level 3 of BMR and BMR(R) with the weight, slots and price Maximum Tech prints", () => {
        const find = (tag: string) => all().find((entry) => entry.tag === tag)!;
        for (const [tag, page, weight, criticals, cbills] of maxTech) {
            const item = find(tag);
            expect(item, tag).toBeDefined();
            for (const edition of ["master-rules", "master-rules-revised"]) {
                expect(item.editions, `${tag} ${edition}`).toContain(edition);
                expect(item.editionLevels?.[edition], `${tag} ${edition}`).toBe(3);
                const printed = item.editionStats?.[edition];
                expect([printed?.book, printed?.page, printed?.weight, printed?.criticals, printed?.cbills], `${tag} ${edition}`).toEqual(["MaxTech", page, weight, criticals, cbills]);
                expect(getEquipmentOfferIssue(item, edition, 2), `${tag} ${edition}`).toBe("level");
                expect(getEquipmentOfferIssue(item, edition, 3), `${tag} ${edition}`).toBeNull();
            }
            expect(item.introducedInEdition, tag).toBe("master-rules");
            expect(item.editions, tag).toContain("total-warfare");
        }
    });

    it("prints the heat, damage, ranges and shots a ton on the Level 3 tables", () => {
        const find = (tag: string) => all().find((entry) => entry.tag === tag)!.editionStats!["master-rules"]!;
        expect(find("thunderbolt-10")).toMatchObject({ heat: 5, damage: 10, shotsPerTon: 6, range: { min: 5, short: 6, medium: 12, long: 18 } });
        expect(find("long-tom-cannon")).toMatchObject({ heat: 20, damage: 20, shotsPerTon: 5, range: { min: 4, short: 6, medium: 13, long: 20 } });
        expect(find("autocannon-light-5")).toMatchObject({ heat: 1, damage: 5, shotsPerTon: 20, range: { min: 0, short: 5, medium: 10, long: 15 } });
        expect(find("large-x-pulse-laser")).toMatchObject({ heat: 14, damage: 9, range: { min: 0, short: 5, medium: 10, long: 15 } });
        expect(find("er_large_pulse_laser")).toMatchObject({ heat: 13, damage: 10, range: { min: 0, short: 7, medium: 15, long: 23 } });
        expect(find("heavy-flamer")).toMatchObject({ heat: 5, damage: 4, shotsPerTon: 10 });
    });

    it("prices the ammunition per ton as p.87 does", () => {
        const find = (tag: string) => all().find((entry) => entry.tag === tag)!;
        const rows: [string, number][] = [
            ["ammo-is-thunderbolt-5-standard", 50000], ["ammo-is-thunderbolt-10-standard", 50000], ["ammo-is-thunderbolt-15-standard", 50000], ["ammo-is-thunderbolt-20-standard", 50000],
            ["ammo-is-light-ac-2-standard", 2000], ["ammo-is-light-ac-5-standard", 5000], ["ammo-heavy-flamer-standard", 2000],
            ["ammo-long-tom-cannon-standard", 20000], ["ammo-sniper-cannon-standard", 15000], ["ammo-thumper-cannon-standard", 10000],
        ];
        for (const [tag, cbills] of rows) {
            for (const edition of ["master-rules", "master-rules-revised"]) {
                const item = find(tag);
                expect(item.editions, `${tag} ${edition}`).toContain(edition);
                expect(item.editionLevels?.[edition], `${tag} ${edition}`).toBe(3);
                expect(item.editionStats?.[edition]?.cbills, `${tag} ${edition}`).toBe(cbills);
                expect(getEquipmentOfferIssue(item, edition, 3), `${tag} ${edition}`).toBeNull();
            }
        }
    });
});

describe("Maximum Tech's heat sinks and Inner Sphere targeting computer under BMR and BMR(R) (#612)", () => {
    it("offers the compact and laser heat sinks at Level 3 with Maximum Tech's figures (p.80, tables pp.85-86, prices p.87)", () => {
        for (const [tag, weight, cbills] of [["compact", 1.5, 3000], ["laser", 1, 6000]] as const) {
            const sink = mechHeatSinkTypes.find((entry) => entry.tag === tag)!;
            for (const edition of ["master-rules", "master-rules-revised"]) {
                expect(sink.editions, `${tag} ${edition}`).toContain(edition);
                expect(sink.editionLevels?.[edition], `${tag} ${edition}`).toBe(3);
                expect([sink.editionStats?.[edition]?.book, sink.editionStats?.[edition]?.page, sink.editionStats?.[edition]?.weight, sink.editionStats?.[edition]?.cbills])
                    .toEqual(["MaxTech", 80, weight, cbills]);
            }
        }
    });

    it("offers the Inner Sphere targeting computer in BMR at Level 3 (Maximum Tech p.84), and BMR(R) keeps its own rows", () => {
        const computer = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment).find((entry) => entry.tag === "targeting-computer")!;
        expect(computer.editions).toContain("master-rules");
        expect(computer.editionStats!["master-rules"]).toMatchObject({ book: "MaxTech", page: 84 });
        expect(getEquipmentOfferIssue(computer, "master-rules", 2)).toBe("level");
        expect(getEquipmentOfferIssue(computer, "master-rules", 3)).toBeNull();
        expect(computer.editionStats!["master-rules-revised"]!.book).toBe("BMR(R)");
    });
});

// Maximum Tech pp.76-77 (both printings): armor-piercing (4 x normal), caseless, flechette and tracer (1.5 x normal) ammunition
// for standard and light autocannons, Level 3; prices p.87. The BMR(R) rulebook (p.133) already prints armor-piercing and
// flechette for the standard autocannons.
describe("Maximum Tech's special autocannon ammunition under BMR and BMR(R) (#612)", () => {
    const normal: Record<string, number> = { "ac-2": 1000, "ac-5": 4500, "ac-10": 6000, "ac-20": 10000, "light-ac-2": 2000, "light-ac-5": 5000 };
    const multiplier: Record<string, number> = { "armor-piercing": 4, caseless: 1.5, flechette: 1.5, tracer: 1.5 };
    const pages: Record<string, number> = { "armor-piercing": 76, caseless: 76, flechette: 77, tracer: 77 };
    const tagOf = (size: string, kind: string) => (kind === "tracer" && !size.startsWith("light") ? `ammo-${size}-tracer` : `ammo-is-${size}-${kind}`);

    it("offers all twenty-four at Level 3 of both Master Rules editions at the printed price", () => {
        const all = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment);
        for (const size of Object.keys(normal)) {
            for (const kind of Object.keys(multiplier)) {
                const tag = tagOf(size, kind);
                const item = all.find((entry) => entry.tag === tag)!;
                expect(item, tag).toBeDefined();
                for (const edition of ["master-rules", "master-rules-revised"]) {
                    expect(item.editions, `${tag} ${edition}`).toContain(edition);
                    if (edition === "master-rules" || !["armor-piercing", "flechette"].includes(kind) || size.startsWith("light")) {
                        expect(item.editionLevels?.[edition], `${tag} ${edition}`).toBe(3);
                        expect([item.editionStats?.[edition]?.book, item.editionStats?.[edition]?.page, item.editionStats?.[edition]?.cbills], `${tag} ${edition}`)
                            .toEqual(["MaxTech", pages[kind], normal[size] * multiplier[kind]]);
                    }
                    expect(getEquipmentOfferIssue(item, edition, 3), `${tag} ${edition}`).toBeNull();
                }
                expect(getEquipmentOfferIssue(item, "master-rules", 2), tag).toBe("level");
            }
        }
    });

    it("gives a ton of caseless rounds twice the standard shots and a ton of armor-piercing rounds half, rounded down", () => {
        const all = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment);
        const stats = (tag: string) => all.find((entry) => entry.tag === tag)!.editionStats!["master-rules"]!;
        expect(stats("ammo-is-ac-10-caseless").shotsPerTon).toBe(20);
        expect(stats("ammo-is-ac-2-caseless").shotsPerTon).toBe(90);
        expect(stats("ammo-is-light-ac-5-caseless").shotsPerTon).toBe(40);
        expect(stats("ammo-is-ac-2-armor-piercing").shotsPerTon).toBe(22);
        expect(stats("ammo-is-ac-5-armor-piercing").shotsPerTon).toBe(10);
        expect(stats("ammo-is-light-ac-2-armor-piercing").shotsPerTon).toBe(22);
        expect(stats("ammo-ac-10-tracer").shotsPerTon).toBe(10);
        expect(stats("ammo-is-ac-20-flechette").shotsPerTon).toBe(5);
    });
});
