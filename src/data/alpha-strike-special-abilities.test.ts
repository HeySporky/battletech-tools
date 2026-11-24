import { describe, expect, it } from "vitest";
import { CONST_AS_SPECIAL_ABILITIES, ESpecialAbilityType, isAlphaStrikeAbilityCode, isCustomAlphaStrikeAbilityCode } from "./alpha-strike-special-abilities";
import { IEquipmentItem } from "./data-interfaces";
import { getAlphaStrikeEquipmentAbilityCodes, getAlphaStrikeEquipmentSpecials, getEquipmentCatalogById } from "./equipment-registry";
import { asRulesEditions } from "./rules-editions";

describe("Alpha Strike E-War specials (#642 Task 12)", () => {
    // ASCE pp.76-90 print each; the Light Active Probe (p. 86) was missing from the catalog.
    it("lists every E-War special the Commander's Edition table names, on the page its entry cites", () => {
        const commanders = asRulesEditions.find(edition => edition.tag === "alpha-strike-commanders-edition");
        const specials = Object.entries(commanders?.ewarRules?.specials ?? {});
        expect(specials.length).toBeGreaterThan(25);
        for (const [code, rule] of specials) {
            const ability = CONST_AS_SPECIAL_ABILITIES.find(entry => entry.tag.replace(/#.*$/, "") === code);
            expect(ability, code).toBeTruthy();
            expect(ability?.source.page, code).toBe(rule?.page);
        }
        expect(isAlphaStrikeAbilityCode("LPRB")).toBe(true);
    });
});

describe("isAlphaStrikeAbilityCode", () => {
    it("accepts the special ability codes the catalog lists, with their numbers", () => {
        for (const code of ["AMS", "ECM", "CASE", "CASEII", "OVL", "ENE", "STL", "RCA", "MEL", "BHJ2", "C3BSM1",
            "IF1", "IF 1", "LRM 1/1/1", "LRM1/1/1/0", "AC 0/1/1", "SRM 2/2", "TOR2", "REAR 1/1/1", "ARTLTC-1", "HT1/1/0", "FLK1/1/1/0"]) {
            expect(isAlphaStrikeAbilityCode(code), code).toBe(true);
        }
    });

    it("refuses TechManual weapon type codes and descriptive notes", () => {
        for (const code of ["DE", "DB", "M", "MS", "S", "P", "I", "C", "H", "ST", "", "One-Shot", "Provisional workbook conversion",
            "Requires Artemis IV capable launcher", "IF", "LRM"]) {
            expect(isAlphaStrikeAbilityCode(code), code).toBe(false);
        }
    });
});

// The Chaff Pod (TO:AUE p.111) has no published Alpha Strike conversion: the Companion, its errata to v1.6 and the
// Commander's Edition are silent (the Companion's SCR# is capital-scale screen chaff). Ours, NGCFells 2026-11-21.
describe("Chaff Pod Alpha Strike conversion (ours, #642)", () => {
    it("defines CHF# as our special and accepts it with its pod count", () => {
        const chaff = CONST_AS_SPECIAL_ABILITIES.find(entry => entry.tag === "CHF#");
        expect(chaff?.type).toBe(ESpecialAbilityType.Custom);
        expect(chaff?.summary.join(" ")).toMatch(/TO:AUE p\.111/);
        expect(isAlphaStrikeAbilityCode("CHF1")).toBe(true);
        expect(isAlphaStrikeAbilityCode("CHF4")).toBe(true);
    });

    it("gives each canon pod CHF1 and the Chaff Pod 2.0 launcher CHF4", () => {
        const find = (catalogId: string, tag: string) => (getEquipmentCatalogById(catalogId) ?? []).find(item => item.tag === tag)!;
        expect(getAlphaStrikeEquipmentAbilityCodes(find("equipment-misc", "chaff-pod"))).toEqual(["CHF1"]);
        expect(getAlphaStrikeEquipmentAbilityCodes(find("misc-custom", "custom-chaff-pod-2"))).toEqual(["CHF4"]);
    });

    it("sums the pods of every item and keeps the other codes once each", () => {
        const item = (codes: string[], isAmmo = false) => ({ isAmmo, alphaStrike: { specialAbility: codes } }) as unknown as IEquipmentItem;
        expect(getAlphaStrikeEquipmentSpecials([item(["CHF1"]), item(["CHF1"]), item(["AMS"]), item(["AMS"]), item(["CHF4"])], 6))
            .toEqual(["CHF6", "AMS"]);
        expect(getAlphaStrikeEquipmentSpecials([item(["RSD#"]), item(["AMS"], true)], 6)).toEqual([]);
    });

    // NGCFells, 2026-11-21: our rules only at Custom Homebrew (6) and Munchkin (7); canon 0-4, Apocryphal 5.
    it("keeps our specials for Custom Homebrew and Munchkin only", () => {
        const item = (codes: string[]) => ({ isAmmo: false, alphaStrike: { specialAbility: codes } }) as unknown as IEquipmentItem;
        const items = [item(["CHF1"]), item(["AMS"])];
        for (const level of [0, 1, 2, 3, 4, 5]) expect(getAlphaStrikeEquipmentSpecials(items, level), `level ${level}`).toEqual(["AMS"]);
        for (const level of [6, 7]) expect(getAlphaStrikeEquipmentSpecials(items, level), `level ${level}`).toEqual(["CHF1", "AMS"]);
        expect(isCustomAlphaStrikeAbilityCode("CHF3")).toBe(true);
        expect(isCustomAlphaStrikeAbilityCode("WLK")).toBe(true);
        expect(isCustomAlphaStrikeAbilityCode("AMS")).toBe(false);
        expect(isCustomAlphaStrikeAbilityCode("C3M 2")).toBe(false);
    });
});

// ASC v1.6 errata and the MUL's E-War codes (#642 Phase 5 Task 1).
describe("Alpha Strike conversion of E-War gear (ASC v1.6, #642 Phase 5)", () => {
    const find = (catalogId: string, tag: string) => (getEquipmentCatalogById(catalogId) ?? []).find(item => item.tag === tag)!;
    const codes = (catalogId: string, tag: string) => new Set(getAlphaStrikeEquipmentAbilityCodes(find(catalogId, tag)));
    const expected: [string, string, string[]][] = [
        ["equipment-misc", "ecm-suite", ["ECM"]],
        ["equipment-misc", "guardian-ecm-prototype", ["ECM"]],
        ["equipment-misc", "clan-ecm-system", ["ECM"]],
        ["equipment-misc", "angel-ecm", ["AECM"]],
        ["equipment-misc", "clan-watchdog-cews", ["WAT", "ECM", "LPRB", "RCN"]],
        ["equipment-misc", "clan-nova-cews", ["NOVA", "ECM", "PRB", "RCN"]],
        ["equipment-misc", "beagle-active-probe", ["PRB", "RCN"]],
        ["equipment-misc", "beagle-active-probe-prototype", ["PRB", "RCN"]],
        ["equipment-misc", "clan-active-probe", ["PRB", "RCN"]],
        ["equipment-misc", "bloodhound-active-probe", ["BH", "RCN"]],
        ["equipment-misc", "clan-light-active-probe", ["LPRB", "RCN"]],
        ["equipment-misc", "ew-equipment", ["ECM", "LPRB", "RCN"]],
        ["equipment-misc", "c3-computer-master", ["C3M", "TAG"]],
        ["equipment-misc", "c3-boosted-master", ["C3BSM", "TAG"]],
        ["equipment-misc", "c3-computer-slave", ["C3S"]],
        ["equipment-misc", "c3-boosted-slave", ["C3BSS"]],
        ["equipment-misc", "c3-emergency-master", ["C3EM"]],
        ["equipment-misc", "c3i-computer", ["C3I"]],
        ["equipment-misc", "naval-c3", ["NC3"]],
        ["equipment-misc", "risc-viral-jammer-decoy", ["DJ"]],
        ["equipment-misc", "risc-viral-jammer-homing", ["HJ"]],
        ["equipment-misc", "void-signature-system", ["MAS"]],
        ["equipment-misc", "chameleon-lps", ["STL"]],
        ["equipment-misc", "null-signature-system", ["STL"]],
        ["misc-custom", "custom-null-signature-system", ["STL"]],
        ["misc-custom", "custom-modular-c3", ["C3I"]],
        ["misc-custom", "custom-personal-ecm", ["LECM"]],
        ["equipment-energy", "tsemp-cannon", ["TSEMP1"]],
        ["equipment-energy", "tsemp-one-shot", ["TSEMP-O1"]],
        ["equipment-energy", "risc-repeating-tsemp", ["TSEMP1"]],
    ];
    for (const [catalogId, tag, want] of expected) {
        it(`${tag} converts to ${want.join(", ")}`, () => {
            expect(find(catalogId, tag), `${tag} exists`).toBeDefined();
            expect(codes(catalogId, tag)).toEqual(new Set(want));
        });
    }

    it("gives LECM to no catalog record except the custom Personal ECM and a battle armor suite", () => {
        const withLecm: string[] = [];
        for (const catalogId of ["equipment-misc", "misc-custom", "equipment-energy"]) {
            for (const item of getEquipmentCatalogById(catalogId) ?? []) {
                if (getAlphaStrikeEquipmentAbilityCodes(item).includes("LECM")) withLecm.push(`${catalogId}:${item.tag}`);
            }
        }
        for (const entry of withLecm) {
            expect(entry === "misc-custom:custom-personal-ecm" || /ba|battle-armor|armor/i.test(entry), entry).toBe(true);
        }
    });

    it("sums TSEMP weapons across both kinds and keeps the one-shot form only when no cannon is carried", () => {
        const item = (codes: string[]) => ({ isAmmo: false, alphaStrike: { specialAbility: codes } }) as unknown as IEquipmentItem;
        expect(getAlphaStrikeEquipmentSpecials([item(["TSEMP1"]), item(["TSEMP1"])], 4)).toEqual(["TSEMP2"]);
        expect(getAlphaStrikeEquipmentSpecials([item(["TSEMP-O1"]), item(["TSEMP-O1"])], 4)).toEqual(["TSEMP-O2"]);
        expect(getAlphaStrikeEquipmentSpecials([item(["TSEMP-O1"]), item(["TSEMP1"])], 4)).toEqual(["TSEMP2"]);
        expect(isAlphaStrikeAbilityCode("TSEMP-O1")).toBe(true);
    });
});

// Alpha Strike edition numbers and flags for E-War play (#642 Phase 5 Task 2).
describe("Alpha Strike E-War edition rules (#642 Phase 5)", () => {
    const asce = asRulesEditions.find(edition => edition.tag === "alpha-strike-commanders-edition")!.ewarRules!;
    const book2013 = asRulesEditions.find(edition => edition.tag === "alpha-strike")!.ewarRules!;

    it("flags the two rules only the Commander's Edition prints", () => {
        expect(asce.stealthJamsOwnEcm).toBe(true);
        expect(asce.c3EmergencyBurnsSlave).toBe(true);
        expect(book2013.stealthJamsOwnEcm).toBeFalsy();
        expect(book2013.c3EmergencyBurnsSlave).toBeFalsy();
    });

    it("gives the radii and ranges in inches", () => {
        for (const rules of [asce, book2013]) {
            expect(rules.specials.ECM?.inches).toBe(12);
            expect(rules.specials.LECM?.inches).toBe(2);
            expect(rules.specials.PRB?.inches).toBe(18);
            expect(rules.specials.LPRB?.inches).toBe(12);
            expect(rules.specials.BH?.inches).toBe(26);
        }
        expect(asce.specials.RAMS?.inches).toBe(2);
        expect(asce.specials.DJ?.inches).toBe(34);
        expect(asce.specials.HJ?.inches).toBe(34);
        // The 2013 book has none of these; the Alpha Strike Companion (2015) does, and offers them to the 2013 edition.
        expect(book2013.specials.RAMS).toMatchObject({ book: "ASC", page: 39, inches: 2 });
        expect(book2013.specials.DJ?.inches).toBe(34);
    });

    it("gives the network sizes", () => {
        expect(asce.specials.C3M?.networkSize).toBe(4);
        expect(asce.specials.C3I?.networkSize).toBe(6);
        expect(asce.specials.NOVA?.networkSize).toBe(3);
        expect(asce.specials.NC3?.networkSize).toBe(6);
        expect(book2013.specials.C3M?.networkSize).toBe(4);
        expect(book2013.specials.C3I?.networkSize).toBe(6);
        expect(book2013.specials.NOVA).toMatchObject({ book: "ASC", networkSize: 3 });
        expect(book2013.specials.NC3).toMatchObject({ book: "ASC", networkSize: 6 });
    });
});

// Sonic projectors (#645): ours, at levels 6-7 only.
describe("Alpha Strike conversion of sonic projectors (#645)", () => {
    const item = (tag: string) => (getEquipmentCatalogById("energy-custom") ?? []).find((entry) => entry.tag === tag)!;

    it("both sonic projectors convert to SNC", () => {
        expect(getAlphaStrikeEquipmentAbilityCodes(item("custom-sonic-projector-military"))).toEqual(["SNC"]);
        expect(getAlphaStrikeEquipmentAbilityCodes(item("custom-sonic-projector-law-enforcement"))).toEqual(["SNC"]);
    });

    it("the code is ours: present at level 6, absent at level 4", () => {
        expect(isCustomAlphaStrikeAbilityCode("SNC")).toBe(true);
        const items = ["custom-sonic-projector-military", "custom-sonic-projector-law-enforcement"].map(item);
        expect(getAlphaStrikeEquipmentSpecials(items, 6)).toEqual(["SNC"]);
        expect(getAlphaStrikeEquipmentSpecials(items, 4)).toEqual([]);
    });
});
