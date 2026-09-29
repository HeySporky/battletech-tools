import { describe, expect, it } from "vitest";
import { IEquipmentItem } from "./data-interfaces";
import { getEquipmentListForChassis } from "./equipment-registry";
import { EQUIPMENT_SUBTYPE_OTHER, getEquipmentSubtype, getEquipmentSubtypes } from "./equipment-subtypes";
import { sortEquipment } from "../utils";

const allEquipment = getEquipmentListForChassis("mis", true);
const byName = (name: string): IEquipmentItem => {
    const item = allEquipment.find(candidate => candidate.name === name);
    if (!item) throw new Error(`missing test fixture ${name}`);
    return item;
};

describe("Step 5 equipment subtypes", () => {
    it.each([
        ["ER Large Laser", "Lasers"],
        ["Laser AMS", "Point Defense"],
        ["Snub-Nose PPC", "PPCs"],
        ["Heavy Flamer", "Flamers"],
        ["Plasma Rifle", "Plasma"],
        ["Clan Ultra AC/20", "Autocannons"],
        ["LB 10-X AC", "Autocannons"],
        ["HVAC/5", "Autocannons"],
        ["Silver Bullet Gauss Rifle", "Gauss"],
        ["Hyper-Assault Gauss (HAG) 30", "Gauss"],
        ["Heavy Machine Gun Array", "Machine Guns"],
        ["Light Rotary Rifle Cannon", "Rifles"],
        ["ATM 12", "ATM"],
        ["iATM 3", "ATM"],
        ["MML 7 + Artemis IV", "MML"],
        ["Streak LRM 15", "LRM"],
        ["LRT 10 (Clan)", "LRM"],
        ["Clan Streak SRM 6", "SRM"],
        ["MRM 40", "MRM"],
        ["Rocket Launcher 15", "Rocket Launchers"],
        ["Improved Narc Launcher", "Narc"],
        ["Nail Gun", EQUIPMENT_SUBTYPE_OTHER],
    ])("files %s under %s", (name, subtype) => {
        expect(getEquipmentSubtype(byName(name))).toBe(subtype);
    });

    it("groups ammunition by the weapon it feeds", () => {
        expect(getEquipmentSubtype(byName("Enhanced LRM - Swarm Ammo (IS)"))).toBe("LRM");
        expect(getEquipmentSubtype(byName("HMG - Standard Ammo (IS)"))).toBe("Machine Guns");
        expect(getEquipmentSubtype(byName("LB 10-X AC - Slug Ammo (IS)"))).toBe("Autocannons");
    });

    it("leaves melee and misc equipment without a subtype filter", () => {
        expect(getEquipmentSubtype(byName("Hatchet"))).toBeNull();
        expect(getEquipmentSubtype(byName("Targeting Computer"))).toBeNull();
    });

    it("lists subtypes in rule order with Other last", () => {
        const items = ["Nail Gun", "Gauss Rifle", "Ultra AC/5", "Machine Gun"].map(byName);
        expect(getEquipmentSubtypes(items)).toEqual(["Gauss", "Machine Guns", "Autocannons", EQUIPMENT_SUBTYPE_OTHER]);
    });
});

describe("equipment natural sort", () => {
    it("sorts launcher sizes numerically (ATM 3 before ATM 12)", () => {
        const sorted = ["ATM 12", "ATM 9", "ATM 3", "ATM 6"].map(byName).sort(sortEquipment);
        expect(sorted.map(item => item.name)).toEqual(["ATM 3", "ATM 6", "ATM 9", "ATM 12"]);
    });

    it("sorts autocannon classes numerically", () => {
        const sorted = ["Primitive Prototype AC/20", "Primitive Prototype AC/2", "Primitive Prototype AC/10", "Primitive Prototype AC/5"]
            .map(byName).sort(sortEquipment);
        expect(sorted.map(item => item.name)).toEqual([
            "Primitive Prototype AC/2", "Primitive Prototype AC/5", "Primitive Prototype AC/10", "Primitive Prototype AC/20",
        ]);
    });
});
