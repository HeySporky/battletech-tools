import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { BattleMech } from "./battlemech";
import { SSW_CANON_PENDING_NAMES } from "../data/ssw/ssw-canon-pending-names";
import { findImportedEquipment } from "../utils/importedEquipment";

// #44: canon SSW items the import could not name: Protomech ACs, HarJel II/III, cannon and C3 remote sensor ammo,
// the Clan Coolant Pod, TSEMP, ER PPC + PPC Capacitor, insulated lasers, Freezers, cargo bays, EW Equipment,
// Ablation armor, Prototype Improved Jump Jets, and Clan items SSW puts on Inner Sphere designs.
const load = (fixture: string): BattleMech => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const unit = new BattleMech();
    unit.importSSWXML(readFileSync(`src/utils/__fixtures__/${fixture}.ssw`, "utf8"));
    return unit;
};
const slotKeys: Record<string, string> = { ra: "rightArm", la: "leftArm", rt: "rightTorso", lt: "leftTorso" };
const add = (unit: BattleMech, tag: string, location: string) => {
    const item = unit.addEquipmentFromTag(tag, "", "", false, null, undefined, undefined, undefined, undefined, undefined);
    const free = (unit.getCriticals() as any)[slotKeys[location]].findIndex((slot: unknown) => !slot);
    expect(unit.moveCritical("un", unit.unallocatedCriticals.findIndex((slot) => slot?.uuid === item?.uuid), location, free)).toBe(true);
    return item;
};
const mech = (heatSinks = "single"): BattleMech => {
    const unit = new BattleMech();
    unit.setTech("is");
    unit.setEra("late-sw-rn");
    unit.setTonnage(60);
    unit.setWalkSpeed(4);
    unit.setHeatSinksType(heatSinks);
    return unit;
};

describe("canon SSW items (#44)", () => {
    it.each([
        "bane-kraken-6", "kodiak-ii-2", "pillager-plg-4x-anvil", "supernova-5", "catapult-ii-cplt-l7", "kuma-4",
        "rifleman-iic-10", "exterminator-caine-ext-4dx", "super-griffin-grf-2n-x", "dark-crow-3", "koschei-ksc-6l",
        "tessen-tsn-x-4", "raven-rvn-1x", "gyrfalcon-4", "grand-dragon-drg-10k", "pulverizer-pul-2v", "shadow-hawk-shd-5s",
        "amarok", "merlin-mln-sx", "ursus-pr", "highlander-hgn-732-colleen", "shadow-cat-ii-2", "shockwave-skw-8x",
        "celerity-clr-04-r", "wing-wraith-tr7", "slagmaiden-slg-x",
    ])("%s imports every item and places it where the file does", (fixture) => {
        const unit = load(fixture);
        expect(unit.getSSWUnresolved()).toEqual([]);
        expect(unit.getUnallocatedCriticals().map((item) => item.tag)).toEqual([]);
    });

    it("lists no pending name that now resolves", () => {
        const resolves = SSW_CANON_PENDING_NAMES
            .filter((entry) => entry.kind === "equipment" || entry.kind === "ammunition")
            .filter((entry) => findImportedEquipment(entry.name, "is", true) || findImportedEquipment(entry.name, "clan", true))
            .map((entry) => entry.name);
        expect(resolves).toEqual([]);
    });

    it("installs a Clan item on an Inner Sphere design as SSW does, and says it needs Mixed Tech", () => {
        const unit = load("pulverizer-pul-2v");
        expect(unit.getInstalledEquipment().map((item) => item.tag)).toContain("enhanced_er_ppc");
        expect(unit.sswImportErrors).toContain("'(IS) Enhanced ER PPC' is Clan equipment (Enhanced PPC) on an Inner Sphere design; the design needs Mixed Tech");
    });
});

describe("a Laser Insulator (TO:AUE p.134)", () => {
    it("takes 1 heat off the laser it is mated to in its location, to a minimum of 1", () => {
        const unit = mech();
        add(unit, "medium-pulse-laser", "ra");
        expect(unit.getWeaponHeat()).toBe(4);
        add(unit, "laser-insulator", "ra");
        expect(unit.getWeaponHeat()).toBe(3);
        expect(unit.getChassisEquipmentViolations().filter((text) => text.includes("Laser Insulator"))).toEqual([]);
        // A second insulator has no second laser to mate with.
        add(unit, "laser-insulator", "ra");
        expect(unit.getWeaponHeat()).toBe(3);
        expect(unit.getChassisEquipmentViolations()).toContain("Laser Insulator in the right arm has no laser of its own to insulate (TO:AUE p.134).");
    });

    it("SSW's insulated lasers become the laser and its insulator, side by side: Exterminator Caine EXT-4DX", () => {
        const unit = load("exterminator-caine-ext-4dx");
        const installed = unit.getInstalledEquipment();
        expect(installed.filter((item) => item.tag === "medium-pulse-laser")).toHaveLength(6);
        expect(installed.filter((item) => item.tag === "laser-insulator")).toHaveLength(6);
        const criticals = unit.getCriticals();
        expect(criticals.leftArm.slice(4, 10).map((slot) => slot?.tag ?? "")).toEqual([
            "medium-pulse-laser", "laser-insulator", "medium-pulse-laser", "laser-insulator", "medium-pulse-laser", "laser-insulator",
        ]);
        // Each Medium Pulse Laser makes 3 heat, not 4, and BV counts it so (TO:AUE p.194): 18, and 1 for the AMS.
        expect(unit.getWeaponHeat()).toBe(19);
    });
});

describe("Double Heat Sinks (Freezers) beside single heat sinks (IO:AE pp.65, 96)", () => {
    it("each adds 2 heat dissipation: Super Griffin GRF-2N-X dissipates 10 + 5 x 2", () => {
        const unit = load("super-griffin-grf-2n-x");
        expect(unit.getInstalledEquipment().filter((item) => item.tag === "freezer-double-heat-sink")).toHaveLength(5);
        expect(unit.getHeatDissipation()).toBe(20);
        expect(unit.getJumpJetType().tag).toBe("prototype-improved");
    });

    it.each([["freezer-double-heat-sink", "Double Heat Sink (Freezers)"], ["prototype-double-heat-sink", "Double Heat Sink (Prototype)"]])(
        "%s go only with single heat sinks", (tag, name) => {
            const unit = mech("double");
            add(unit, tag, "lt");
            expect(unit.getChassisEquipmentViolations()).toContain(`${name} combines only with single heat sinks (IO:AE p.65).`);
        });
});

// "Count as N heat for heat efficiency calculations" (IO:AE p.189, Alternate Era Battle Value Table).
describe("prototype lasers count their Battle Value heat from IO:AE p.189", () => {
    it.each([["prototype-er-large-laser", 13, 136], ["prototype-small-pulse-laser", 4, 11], ["prototype-medium-pulse-laser", 7, 43],
        ["prototype-large-pulse-laser", 13, 108], ["recovered-prototype-medium-pulse-laser", 7, 43]])("%s: %i heat, %i BV", (tag, heat, bv) => {
        const unit = mech();
        const laser = add(unit, tag, "ra");
        unit.getBattleValue();
        const heatStep = unit.getBattleValueBreakdown().steps.find((step) => step.id === "bv2.off.heat.weapons");
        expect(heatStep?.detail).toBe(`${heat}`);
        expect(heatStep?.value).toBe(heat);
        expect(laser?.battleValue).toBe(bv);
    });
});

describe("'Mech cargo bays (TM p.239)", () => {
    it("weigh what they carry, take a slot per ton rounded up, and import at their SSW size", () => {
        const liquid = load("dark-crow-3").getInstalledEquipment().find((item) => item.tag === "cargo-liquid");
        expect(liquid?.weight).toBe(1);
        const standard = load("shadow-hawk-shd-5s").getInstalledEquipment().find((item) => item.tag === "cargo-standard");
        expect(standard?.weight).toBe(0.5);
        expect(standard?.space.battlemech).toBe(1);

        const unit = mech();
        const bay = add(unit, "cargo-insulated", "lt");
        unit.setEquipmentSize(bay?.uuid, 2.5);
        const sized = unit.getInstalledEquipment().find((item) => item.tag === "cargo-insulated");
        expect(sized?.weight).toBe(2.5);
        expect(sized?.space.battlemech).toBe(3);
        // 250 C-bills a ton (TM p.293).
        expect(sized?.cbills).toBe(625);
    });
});

describe("Electronic Warfare Equipment (TO:AUE pp.123, 195, 219)", () => {
    it("is 7.5 tons in 4 slots, BV 39 defensive: Raven RVN-1X", () => {
        const ew = load("raven-rvn-1x").getInstalledEquipment().find((item) => item.tag === "ew-equipment");
        expect(ew?.weight).toBe(7.5);
        expect(ew?.space.battlemech).toBe(4);
        expect(ew?.battleValue).toBe(39);
        expect(ew?.battleValueDefensive).toBe(true);
    });
});
