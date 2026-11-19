import { describe, expect, it } from "vitest";
import AerospaceFighter, { normalizeAerospaceFighterExport } from "./aerospace-fighter";

// TechManual's worked example, the 75-ton Clan Sabutai OmniFighter (TM pp.184-197): Safe Thrust 6, a 300 XL
// engine at 9.5 tons, 3 tons of controls, 3 tons of fuel, 10 tons of Clan ferro-aluminum (192 points as
// 62/45/45/40), 15 double heat sinks, then the Prime's 44.5 tons of pods.
const sabutai = (): AerospaceFighter => {
    const fighter = new AerospaceFighter();
    fighter.setTech("clan");
    fighter.setEra("clan-inv");
    fighter.setTonnage(75);
    fighter.setSafeThrust(6);
    fighter.setEngineType("clan_xl");
    fighter.setFuelTons(3);
    fighter.setArmorType("clan-ferro-aluminum");
    fighter.setArmorAllocation("nose", 62);
    fighter.setArmorAllocation("leftWing", 45);
    fighter.setArmorAllocation("rightWing", 45);
    fighter.setArmorAllocation("aft", 40);
    fighter.setHeatSinkType("double");
    fighter.setAdditionalHeatSinks(5);
    return fighter;
};

describe("Aerospace fighter construction (TechManual)", () => {
    it("builds the Sabutai chassis with 44.5 tons left for pods (TM pp.186-195)", () => {
        const fighter = sabutai();
        expect(fighter.getEngineRating()).toBe(300);
        expect(fighter.getEngineWeight()).toBe(9.5);
        expect(fighter.getMaxThrust()).toBe(9);
        expect(fighter.getStructuralIntegrity()).toBe(7);
        expect(fighter.getMaxArmorPoints()).toBe(600);
        expect(fighter.getArmorPointsPerTon()).toBe(19.2);
        expect(fighter.getTotalArmorPoints()).toBe(192);
        expect(fighter.getArmorWeight()).toBe(10);
        expect(fighter.getFuelPoints()).toBe(240);
        expect(fighter.getTotalHeatSinks()).toBe(15);
        expect(fighter.getHeatDissipation()).toBe(30);
        expect(fighter.getExternalStoresHardpoints()).toBe(15);
        expect(fighter.getRemainingTonnage()).toBe(44.5);
        expect(fighter.getIssues()).toEqual([]);
    });

    it("fits the Sabutai Prime exactly: 1 slot per weapon, none for ammunition (TM p.196)", () => {
        const fighter = sabutai();
        fighter.setAdditionalHeatSinks(11);
        fighter.addEquipmentFromTag("clan-gauss-rifle", "nose");
        fighter.addEquipmentFromTag("er-small-laser-clan", "nose");
        fighter.addEquipmentFromTag("er-small-laser-clan", "aft");
        fighter.addEquipmentFromTag("er-small-laser-clan", "aft");
        for (const wing of ["leftWing", "rightWing"]) {
            fighter.addEquipmentFromTag("er-ppc-clan", wing);
            fighter.addEquipmentFromTag("clan_large-pulse-laser", wing);
        }
        const ammo = fighter.addEquipmentFromTag("ammo-clan-gauss-rifle-standard", "nose")!;
        expect(ammo.location).toBe("fuselage");
        expect(fighter.getRemainingTonnage()).toBe(0);
        expect([fighter.getArcSlotsUsed("nose"), fighter.getArcSlotsUsed("leftWing"), fighter.getArcSlotsUsed("rightWing"), fighter.getArcSlotsUsed("aft")])
            .toEqual([2, 2, 2, 2]);
        expect(fighter.getIssues()).toEqual([]);
    });

    it("takes a weapon slot from each wing for Clan ferro-aluminum (TM p.191)", () => {
        const fighter = sabutai();
        expect([fighter.getArcSlots("nose"), fighter.getArcSlots("leftWing"), fighter.getArcSlots("rightWing"), fighter.getArcSlots("aft")]).toEqual([5, 4, 4, 5]);
        fighter.setArmorType("aerospace-standard");
        expect(fighter.getArcSlots("leftWing")).toBe(5);
    });

    it("sets structural integrity to the higher of Safe Thrust and a tenth of the tonnage (TM p.187)", () => {
        const fighter = new AerospaceFighter();
        fighter.setTonnage(20);
        fighter.setSafeThrust(10);
        expect(fighter.getStructuralIntegrity()).toBe(10);
        fighter.setTonnage(100);
        expect(fighter.getStructuralIntegrity()).toBe(10);
    });

    it("keeps tonnage to 5-100 in steps of 5 and the engine on the 10-400 table (TM pp.49, 184)", () => {
        const fighter = new AerospaceFighter();
        expect(fighter.setTonnage(3)).toBe(5);
        expect(fighter.setTonnage(250)).toBe(100);
        expect(fighter.setTonnage(47)).toBe(45);
        fighter.setTonnage(100);
        expect(fighter.setSafeThrust(12)).toBe(6);
        expect(fighter.getEngineRating()).toBe(400);
        fighter.setTonnage(5);
        expect(fighter.setSafeThrust(1)).toBe(4);
    });

    it("offers each tech base only its own fighter engines (TM p.186)", () => {
        const fighter = new AerospaceFighter();
        fighter.setTech("is");
        expect(fighter.getPermittedEngineTags()).toEqual(["standard", "light", "xl", "compact"]);
        fighter.setEngineType("ice");
        expect(fighter.getEngineType().tag).toBe("standard");
        fighter.setEngineType("xl");
        fighter.setTech("clan");
        expect(fighter.getEngineType().tag).toBe("standard");
        expect(fighter.getPermittedEngineTags()).toEqual(["standard", "clan_xl"]);
    });

    it("reports what makes a design illegal", () => {
        const fighter = sabutai();
        fighter.setArmorType("aerospace-standard");
        for (let count = 0; count < 6; count++) fighter.addEquipmentFromTag("er-small-laser-clan", "nose");
        fighter.addEquipmentFromTag("er-ppc-clan");
        fighter.setFuelTons(0);
        const issues = fighter.getIssues().join(" | ");
        expect(issues).toContain("Nose: 6 weapon slots used of 5");
        expect(issues).toContain("1 item has no firing arc yet");
        expect(issues).toContain("carries no fuel");
        fighter.setAdditionalHeatSinks(60);
        expect(fighter.getIssues().join(" | ")).toContain("Overweight");
    });

    it("round-trips through a save and survives a hostile one", () => {
        const fighter = sabutai();
        fighter.addEquipmentFromTag("er-ppc-clan", "leftWing");
        const copy = new AerospaceFighter(fighter.exportJSON());
        expect(copy.export()).toEqual({ ...fighter.export(), lastUpdated: copy.lastUpdated });
        expect(copy.getImportIssues()).toEqual([]);

        const hostile = new AerospaceFighter(JSON.stringify({
            name: 7, tonnage: 1e9, safeThrust: -4, engineType: "ice", armorType: "ferro-carbide",
            armorAllocation: { nose: 1e12, aft: "x", __proto__: { polluted: true } },
            additionalHeatSinks: 1e9, fuelTons: -3, equipment: [{ tag: "no-such-thing" }, 5, { tag: "er-ppc-clan", location: "cockpit" }],
        }));
        expect(hostile.getTonnage()).toBe(100);
        expect(hostile.getEngineType().tag).toBe("standard");
        expect(hostile.getArmorType().tag).toBe("aerospace-standard");
        expect(hostile.getArmorAllocation().nose).toBe(800);
        expect(hostile.getAdditionalHeatSinks()).toBe(200);
        expect(hostile.getFuelTons()).toBe(0);
        expect(hostile.getImportIssues().length).toBeGreaterThan(0);
        expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
        expect(normalizeAerospaceFighterExport("nope").fighter).toBeNull();
        expect(normalizeAerospaceFighterExport(fighter.export()).fighter!.tonnage).toBe(75);
    });
});

describe("Aerospace fighter ammunition", () => {
    it("caps an Artemis launcher's rounds at the launcher's unmodified value (TM p.312)", () => {
        const fighter = sabutai();
        fighter.addEquipmentFromTag("clan-lrm-20-artemis-iv", "nose");
        for (let ton = 0; ton < 9; ton++) fighter.addEquipmentFromTag("ammo-clan-lrm-artemis-iv", "nose");
        // 9 tons of Clan LRM rounds: over the LRM-20's 220, under the 264 it counts with Artemis IV.
        expect(fighter.getBattleValueLog()).toContain("Ammunition for clan-lrm-20-artemis-iv = 220.00 (capped at weapon BV)");
    });
});

describe("Aerospace fighter tech dates (design 2026-10-24-catalog-consolidation §2)", () => {
    it("mixed tech takes the production window over a prototype", () => {
        const fighter = new AerospaceFighter();
        fighter.setTech("mis");
        fighter.setEra("clan-inv");
        // Inner Sphere prototype only in 3050-3061; Clan production from 3055.
        const item = { prototype: 3040, introduced: 3070, extinct: null, reintroduced: null, clanDates: { introduced: 3055, extinct: null, reintroduced: null } };
        const availability = (fighter as unknown as { _techDatesAvailability: (item: object, level: number) => { available: boolean; asPrototype: boolean } })
            ._techDatesAvailability(item, 4);
        expect(availability).toEqual({ available: true, asPrototype: false });
    });
});

// The Clans fielded Star League Ferro-Aluminum until Clan Ferro-Aluminum was in production (2825). Clan Founding
// Years (2800-2840) holds both windows, so a Clan fighter there may mount either, each at its own figures (#168).
describe("Star League Ferro-Aluminum on a Clan fighter", () => {
    const clanFighter = (era: string): AerospaceFighter => {
        const fighter = new AerospaceFighter();
        fighter.setTech("clan");
        fighter.setEra(era);
        fighter.setTonnage(50);
        return fighter;
    };
    const offered = (fighter: AerospaceFighter, tag: string) => fighter.getAvailableArmorTypes().find((armor) => armor.tag === tag);

    it("offers both versions while the era holds both, the Star League one at Inner Sphere figures", () => {
        const fighter = clanFighter("clan-founding-years");
        expect(offered(fighter, "ferro-aluminum")?.available).toBe(true);
        expect(offered(fighter, "clan-ferro-aluminum")?.available).toBe(true);
        expect(fighter.setArmorType("ferro-aluminum").tag).toBe("ferro-aluminum");
        expect(fighter.getArmorPointsPerTon()).toBe(17.92);
        expect([fighter.getArcSlots("leftWing"), fighter.getArcSlots("nose")]).toEqual([4, 5]);
        fighter.setArmorType("clan-ferro-aluminum");
        expect(fighter.getArmorPointsPerTon()).toBe(19.2);
    });

    it("drops the Star League version once the Clan one is the only one in the era", () => {
        expect(offered(clanFighter("clan-golden-years"), "ferro-aluminum")).toBeUndefined();
        // An Inner Sphere fighter still sees its own Ferro-Aluminum again from its 3040 reintroduction.
        const inner = new AerospaceFighter();
        inner.setTech("is");
        inner.setEra("clan-inv");
        expect(offered(inner, "ferro-aluminum")?.available).toBe(true);
        expect(offered(inner, "clan-ferro-aluminum")).toBeUndefined();
    });
});
