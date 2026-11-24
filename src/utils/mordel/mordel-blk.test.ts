import { describe, expect, it } from "vitest";
import type ProtoMech from "../../classes/protomech";
import type Vehicle from "../../classes/vehicle";
import { importMordelBlk, mordelVehicleToBlk } from "./mordel-blk";
import { IMordelDetail, IMordelEquipment } from "./mordel-types";

// Made-up units in mordel.net's detail shape. Canon or made-up units only.
const item = (id: number, name: string, location: string | null, over: Partial<IMordelEquipment> = {}): IMordelEquipment =>
    ({ id, name, location, technology: "Inner Sphere", slots: 1, facing: "Front", ...over });
const loc = (code: string, armor: number) => ({ location: code, code, armor, rear_armor: null, structure: 0 });

const tank = (over: Partial<IMordelDetail> = {}): IMordelDetail => ({
    unit_type: "Combat Vehicle", unit_type_short: "cv", id: 1, name: "Testudo Tracked Tank TT-1", canon: false,
    tech_base: "Inner Sphere", mixed_tech: false, year: 3050, rules_level: "Standard", tons: 40, battle_value: null,
    point_value: null, updated: null, omni: false, configuration: "Tracked",
    name_parts: { name: "Testudo Tracked Tank", alternate_name: null, model: "TT-1" },
    movement: { cruise: 4, flank: 6, jump: 0 },
    engine: { type: "Fusion", technology: "Inner Sphere", rating: 160 },
    armor: { type: "Standard", technology: "Inner Sphere", points: 100 },
    fire_control: { artemis: "IV", apollo: false, clan_case: false },
    locations: [loc("FR", 30), loc("RS", 20), loc("LS", 20), loc("RR", 12), loc("TU", 18)],
    equipment: [
        item(1, "Medium Laser", "FR"), item(2, "Medium Laser", "FR"), item(3, "LRM 10", "TU"),
        item(4, "Machine Gun", "RR"), item(5, "LRM 10 (Ammo 12) [Artemis IV]", "BD"), item(6, "Machine Gun (Ammo 100)", "BD"),
    ],
    ...over,
});

const proto = (over: Partial<IMordelDetail> = {}): IMordelDetail => ({
    unit_type: "ProtoMech", unit_type_short: "pm", id: 2, name: "Vespa 1", canon: false,
    tech_base: "Clan", mixed_tech: false, year: 3070, rules_level: "Standard", tons: 5, battle_value: null,
    point_value: null, updated: null, omni: false, configuration: "Biped",
    name_parts: { name: "Vespa", alternate_name: null, model: "1" },
    movement: { walk: 5, run: 8, jump: 5 },
    engine: { type: "Fusion", technology: "Clan" }, armor: { type: "Standard", technology: "Clan" },
    jump_jets: { type: "ProtoMech" }, myomer: { type: "Standard" }, cockpit: { type: "ProtoMech" },
    locations: [loc("H", 2), loc("T", 7), loc("RA", 2), loc("LA", 2), loc("L", 5), loc("MG", 3)],
    equipment: [
        item(1, "ER Small Laser", "T", { technology: "Clan" }), item(2, "SRM 2", "MG", { technology: "Clan" }),
        ...[3, 4, 5, 6, 7].map((id) => item(id, "SRM 2 (Ammo 1)", null, { technology: "Clan" })),
    ],
    ...over,
});

describe("importMordelBlk: Combat Vehicles", () => {
    it("builds the tank: movement, turret, weapons by location, Artemis on the launcher and its ammunition", () => {
        const result = importMordelBlk(tank());
        expect(result.issues).toEqual([]);
        expect(result.kind).toBe("vehicle");
        const vehicle = result.unit as Vehicle;
        expect(vehicle.getTonnage()).toBe(40);
        expect(vehicle.getCruiseMP()).toBe(4);
        expect(vehicle.getTurretCount()).toBe(1);
        const tags = vehicle.getEquipmentList().map((entry) => entry.tag);
        expect(tags.filter((tag) => /medium-laser/.test(tag))).toHaveLength(2);
        expect(tags.some((tag) => /lrm.*10.*artemis-iv/.test(tag))).toBe(true);
        expect(vehicle.getEquipmentList().filter((entry) => entry.isAmmo)).toHaveLength(2);
        expect(result.ourBV).toBeGreaterThan(0);
    });

    it("fits Artemis only to the launchers its marked ammunition feeds", () => {
        const equipment = [...tank().equipment!, item(7, "SRM 4", "FR"), item(8, "SRM 4 (Ammo 25)", "BD")];
        const tags = (importMordelBlk(tank({ equipment })).unit as Vehicle).getEquipmentList().map((entry) => entry.tag);
        expect(tags.some((tag) => /lrm.*10.*artemis-iv/.test(tag))).toBe(true);
        expect(tags.filter((tag) => /srm.*4/.test(tag) && !/ammo/.test(tag))).toEqual([expect.not.stringMatching(/artemis/)]);
    });

    it("writes the half-ton machine gun bin as a half ton", () => {
        expect(mordelVehicleToBlk(tank()).text).toContain("IS machine-gun Ammo - Half");
    });

    it("trusts the build only when mordel.net's Battle Value is ours", () => {
        const ours = importMordelBlk(tank()).ourBV;
        expect(importMordelBlk(tank({ battle_value: ours })).bvOk).toBe(true);
        expect(importMordelBlk(tank({ battle_value: ours + 1 })).bvOk).toBe(false);
    });

    it("names an item it cannot match, and does not trust the build", () => {
        const unknown = tank({ equipment: [...tank().equipment ?? [], item(9, "Quantum Flux Capacitor", "BD")] });
        const result = importMordelBlk({ ...unknown, battle_value: importMordelBlk(unknown).ourBV });
        expect(result.issues).toContain("'Quantum Flux Capacitor' has no match in this catalog and is left out");
        expect(result.bvOk).toBe(false);
    });

    it("reads a ladder by its length and the vehicular light fluid suction system", () => {
        const blk = mordelVehicleToBlk(tank({ equipment: [...tank().equipment!, item(7, "Ladder", "BD", { stacks: { count: 60, unit: "meters" } }),
            item(8, "Light Fluid Suction System", "BD")] }));
        expect(blk.issues).toEqual([]);
        expect(blk.text).toContain("ladder-60");
        expect(blk.text).toContain("fluid-suction-system-light-vehicular");
    });

    // The BLK reader reads MegaMek's "Primitive" rounds as standard ones; that must not cut "primitive" out of a tag.
    it("loads a primitive prototype autocannon's ammunition (IO:AE p.112)", () => {
        const assault = tank({ year: 2490, rules_level: "Experimental", fire_control: undefined, equipment: [item(1, "Autocannon/20 (Prototype)", "FR"),
            item(2, "Autocannon/20 (Prototype) (Ammo 5)", "BD")] });
        const { issues } = importMordelBlk(assault);
        expect(issues.filter((issue) => /ammunition|ammo/i.test(issue))).toEqual([]);
    });

    it("mounts communications equipment a ton per increment", () => {
        const result = importMordelBlk(tank({ equipment: [item(1, "Communications Equipment", "BD", { stacks: { count: 3, unit: "increments" } })] }));
        expect((result.unit as Vehicle).getEquipmentList().filter((entry) => entry.tag === "communications-equipment")).toHaveLength(3);
    });
});

describe("importMordelBlk: ProtoMechs", () => {
    it("builds the ProtoMech: walk and jump, weapons by location and the summed shots", () => {
        const result = importMordelBlk(proto());
        expect(result.issues).toEqual([]);
        expect(result.kind).toBe("protomech");
        const unit = result.unit as ProtoMech;
        expect(unit.getTons()).toBe(5);
        expect(unit.getWalkMP()).toBe(5);
        expect(unit.getJumpMP()).toBe(5);
        expect(unit.getArmor("torso")).toBe(7);
        const srm = unit.getMounts().find((mount) => mount.location === "mainGun");
        expect(srm?.tubes).toBe(2);
        expect(srm?.shots).toBe(5);
        expect(unit.getMounts().some((mount) => mount.location === "torso" && /small-laser/.test(mount.tag))).toBe(true);
    });

    it("names an item in a location a ProtoMech import does not read", () => {
        const result = importMordelBlk(proto({ equipment: [item(1, "ER Small Laser", "H", { technology: "Clan" })] }));
        expect(result.issues).toContain("'ER Small Laser' is in location 'H', which a ProtoMech import does not read");
        expect(result.bvOk).toBe(false);
    });
});
