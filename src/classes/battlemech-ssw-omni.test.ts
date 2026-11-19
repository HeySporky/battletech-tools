import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { compactMech, loadBundledMech } from "../utils/bundled-designs";
import { untabulate } from "../utils/packed-json";
import { BattleMech } from "./battlemech";

// SSW keeps every OmniMech loadout in one file: each becomes one of our configurations (#112).
function importFixture(name: string): BattleMech {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const mech = new BattleMech();
    mech.importSSWXML(readFileSync(`src/utils/__fixtures__/${name}.ssw`, "utf8"));
    return mech;
}
// Imports and configurations are slow to build, so each is built once.
const imports = new Map<string, BattleMech>();
const imported = (name: string) => imports.get(name) ?? imports.set(name, importFixture(name)).get(name)!;
const clones = new Map<BattleMech, Map<string, BattleMech>>();
const configuration = (mech: BattleMech, name: string) => {
    const built = clones.get(mech) ?? clones.set(mech, new Map()).get(mech)!;
    return built.get(name) ?? built.set(name, mech.cloneOmniConfiguration(name) as BattleMech).get(name)!;
};
const podTags = (mech: BattleMech) => mech.getInstalledEquipment().filter((item) => !item.omniFixed).map((item) => item.tag).sort();

// Each configuration is a full export and reload, slow when the whole suite runs at once.
describe("SSW import of OmniMech configurations (#112)", { timeout: 30000 }, () => {
    it("imports every loadout as a configuration, the first one active: Dire Wolf", () => {
        const mech = imported("dire-wolf-omni");
        // The U reads SSW's "(CL) SRT-6" as the Clan torpedo.
        expect(mech.sswImportErrors).toEqual([]);
        expect(mech.getOmniConfigurationNames()).toEqual(["Prime", "A", "B", "C", "D", "E", "H", "S", "T", "U", "W", "X", "'Prometheus'", "'Widowmaker'", "(Hohiro)"]);
        expect(mech.getActiveOmniConfiguration()).toBe("Prime");
        expect(mech.getBattleValue()).toBe(2712);
    });

    it("gives each configuration its own heat sinks, jump jets and Battle Value: Dire Wolf", () => {
        const mech = imported("dire-wolf-omni");
        expect(configuration(mech, "Prime").getHeatSinks()).toBe(22);
        expect(configuration(mech, "Prime").getJumpSpeed()).toBe(0);
        expect(configuration(mech, "A").getHeatSinks()).toBe(21);
        expect(configuration(mech, "B").getHeatSinks()).toBe(15);
        expect(configuration(mech, "C").getHeatSinks()).toBe(23);
        expect(configuration(mech, "C").getJumpSpeed()).toBe(3);
        expect(configuration(mech, "A").getBattleValue()).toBe(2855);
        expect(configuration(mech, "B").getBattleValue()).toBe(2609);
        expect(configuration(mech, "C").getBattleValue()).toBe(3610);
        expect(configuration(mech, "U").getBattleValue()).toBe(3360);
        expect(configuration(mech, "C").getUnallocatedCriticals()).toEqual([]);
    });

    it("counts heat sinks and jump jets above the base loadout's in pod tonnage: Dire Wolf base has 15 heat sinks", () => {
        const mech = imported("dire-wolf-omni");
        const stats = Object.fromEntries(mech.getOmniConfigurationStats().map((entry) => [entry.name, entry.podTonnage]));
        const podWeight = (name: string) => configuration(mech, name).getInstalledEquipment()
            .filter((item) => !item.omniFixed).reduce((sum, item) => sum + (item.weight || 0), 0);
        // Clan double heat sinks weigh a ton; a 100-ton 'Mech's jump jets two tons each (TM p.53).
        expect(stats.Prime).toBe(podWeight("Prime") + 7);
        expect(stats.C).toBe(podWeight("C") + 8 + 3 * 2);
        expect(stats.B).toBe(podWeight("B"));
        const podSpace = configuration(mech, "Prime").getOmniPodSpace().podTonnage;
        expect(configuration(mech, "B").getOmniPodSpace().podTonnage).toBe(podSpace);
        expect(configuration(mech, "C").getOmniPodSpace().podTonnage).toBe(podSpace);
    });

    it("gives each configuration its own arm actuators: Dire Wolf A has a right lower arm actuator", () => {
        const mech = imported("dire-wolf-omni");
        expect(configuration(mech, "Prime").hasLowerArmActuator("ra")).toBe(false);
        expect(configuration(mech, "A").hasLowerArmActuator("ra")).toBe(true);
        expect(configuration(mech, "A").hasHandActuator("ra")).toBe(false);
    });

    it("keeps the base loadout's equipment fixed and the loadout's in pods, once each: Avatar AV1-O", () => {
        const mech = imported("avatar-av1-o");
        expect(mech.sswImportErrors).toEqual([]);
        const fixed = mech.getInstalledEquipment().filter((item) => item.omniFixed).map((item) => item.tag).sort();
        // The two center torso medium lasers; SSW repeats the base loadout's CASE in every loadout.
        expect(fixed.filter((tag) => tag.includes("medium-laser"))).toHaveLength(2);
        expect(fixed.filter((tag) => tag.includes("case"))).toHaveLength(2);
        expect(podTags(mech).filter((tag) => tag.includes("case"))).toEqual([]);
        expect(mech.getBattleValue()).toBe(1395);
        expect(configuration(mech, "A").getBattleValue()).toBe(1481);
        expect(configuration(mech, "Prime").hasLowerArmActuator("la")).toBe(true);
    });

    it("keeps the configurations through an export and reload, and through the bundled designs' compact format", () => {
        const mech = imported("dire-wolf-omni");
        const compact = compactMech(mech);
        // The active configuration is the design's own equipment, so the compact format does not store it twice.
        expect((untabulate(compact.omniConfigurations) as { name: string }[]).map((entry) => entry.name)).not.toContain("Prime");
        expect(loadBundledMech(compact).getOmniConfigurationNames()).toEqual(mech.getOmniConfigurationNames());
        for (const reload of [new BattleMech(mech.exportJSON(true)), loadBundledMech(compact)]) {
            for (const name of ["Prime", "A", "C"]) {
                expect(configuration(reload, name).getBattleValue()).toBe(configuration(mech, name).getBattleValue());
                expect(configuration(reload, name).getHeatSinks()).toBe(configuration(mech, name).getHeatSinks());
                expect(configuration(reload, name).hasLowerArmActuator("ra")).toBe(configuration(mech, name).hasLowerArmActuator("ra"));
            }
        }
    });
});
