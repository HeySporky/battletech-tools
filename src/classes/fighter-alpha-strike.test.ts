import { describe, expect, it } from "vitest";
import AerospaceFighter, { formatFighterASDamage } from "./aerospace-fighter";

const build = (setup: (fighter: AerospaceFighter) => void, armor: [number, number, number, number], weapons: [string, string][], ammo: string[] = []): AerospaceFighter => {
    const fighter = new AerospaceFighter();
    setup(fighter);
    (["nose", "leftWing", "rightWing", "aft"] as const).forEach((arc, index) => fighter.setArmorAllocation(arc, armor[index]));
    for (const [tag, arc] of weapons) expect(fighter.addEquipmentFromTag(tag, arc), tag).not.toBeNull();
    for (const tag of ammo) expect(fighter.addEquipmentFromTag(tag), tag).not.toBeNull();
    return fighter;
};

const card = (fighter: AerospaceFighter) => {
    const stats = fighter.getAlphaStrikeStats();
    const damage = stats.damageValues;
    return {
        size: stats.size, move: stats.movement, armor: stats.armor, structure: stats.structure, threshold: stats.threshold,
        damage: [damage.short, damage.medium, damage.long].map(formatFighterASDamage).join("/"), overheat: stats.overheat,
        pointValue: stats.pointValue, specials: stats.specialAbilities,
    };
};

describe("Fighter Alpha Strike conversion, against Master Unit List cards", () => {
    it("converts the TRB-D36 Thunderbird: 4/4/3, Overheat 3, Armor 7, Threshold 3, PV 45", () => {
        const fighter = build((f) => { f.setTonnage(100); f.setSafeThrust(5); f.setFuelTons(5); f.setAdditionalHeatSinks(15); },
            [70, 52, 52, 50],
            [["large-laser", "nose"], ["large-laser", "leftWing"], ["large-laser", "rightWing"], ["lrm-20", "leftWing"], ["lrm-20", "rightWing"],
                ["medium-laser", "nose"], ["medium-laser", "nose"], ["medium-laser", "nose"], ["medium-laser", "aft"], ["medium-laser", "aft"]],
            ["ammo-lrm-standard", "ammo-lrm-standard", "ammo-lrm-standard", "ammo-lrm-standard"]);
        const result = card(fighter);
        expect(result).toMatchObject({ size: 3, move: 5, armor: 7, structure: 5, threshold: 3, damage: "4/4/3", overheat: 3, pointValue: 45 });
        expect(result.specials).toEqual(expect.arrayContaining(["BOMB3", "FUEL20", "REAR1/1/-", "SPC", "VSTOL"]));
        expect(result.specials).not.toContain("ENE");

        const unit = fighter.getAlphaStrikeUnit();
        expect(unit.threshold).toBe(3);
        expect(unit.type).toBe("AF");
    });

    it("sizes fighters by weight and gives a conventional fighter ATMO and EE, with no heat adjustment (ASC pp.92, 115)", () => {
        const light = new AerospaceFighter();
        light.setTonnage(45);
        expect(light.getAlphaStrikeSize()).toBe(1);
        light.setTonnage(50);
        expect(light.getAlphaStrikeSize()).toBe(2);
        light.setTonnage(75);
        expect(light.getAlphaStrikeSize()).toBe(3);

        const buster = build((f) => { f.setFighterType("conventional"); f.setTonnage(50); f.setSafeThrust(5); f.setEngineType("ice"); f.setFuelTons(4); f.setAdditionalHeatSinks(9); },
            [18, 11, 11, 10], [["medium-laser", "nose"], ["medium-laser", "nose"], ["medium-laser", "nose"]]);
        const result = card(buster);
        // 50 points of armor / 30 = 2; Structural Integrity 5 / 2 = 3; three medium lasers 1.5/1.5 = 2/2/0.
        expect(result).toMatchObject({ size: 2, move: 5, armor: 2, structure: 3, threshold: 1, damage: "2/2/0", overheat: 0 });
        expect(result.specials).toEqual(expect.arrayContaining(["ATMO", "BOMB2", "EE", "ENE", "VSTOL"]));
        expect(result.specials).not.toContain("SPC");
        expect(buster.getAlphaStrikeUnit().type).toBe("CF");
    });

    it("gives Point Defense and Flak specials (ASC pp.121, 128): the SPR-H5 Sparrowhawk is 2/1/0, PNT1, PV 27", () => {
        // 30 tons, Safe Thrust 10, 112 points of armor, two medium lasers and two small lasers.
        const fighter = build((f) => { f.setTonnage(30); f.setSafeThrust(10); f.setFuelTons(5); },
            [35, 28, 28, 21], [["medium-laser", "leftWing"], ["medium-laser", "rightWing"], ["small-laser", "nose"], ["small-laser", "nose"]]);
        const result = card(fighter);
        expect(result).toMatchObject({ size: 1, move: 10, armor: 4, structure: 5, threshold: 2, damage: "2/1/0", overheat: 0, pointValue: 27 });
        expect(result.specials).toEqual(expect.arrayContaining(["BOMB1", "ENE", "FUEL20", "PNT1", "SPC", "VSTOL"]));

        // An LB 10-X (0.63 at every range) earns FLK 1/1/1; a small pulse laser is not a Point Defense weapon.
        const flak = build((f) => { f.setTonnage(50); f.setSafeThrust(5); }, [20, 10, 10, 10], [["autocannon-lbx-10", "nose"], ["small-pulse-laser", "nose"]], ["ammo-is-lb-10x-standard"]);
        const specials = card(flak).specials;
        expect(specials).toContain("FLK1/1/1");
        expect(specials.some((code) => code.startsWith("PNT"))).toBe(false);
    });
});
