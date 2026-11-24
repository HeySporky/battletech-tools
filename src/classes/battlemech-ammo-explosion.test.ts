import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";

// A rolled critical hit on an ammunition slot explodes that bin (TW pp.125, 134; TO:AUE p.111; CRB pp.96-97).

const build = (options: { tech?: string, edition?: string } = {}) => {
    const mech = new BattleMech();
    mech.setTech(options.tech ?? "is");
    mech.setEra("dark-ages");
    if (options.edition) mech.setRulesEdition(options.edition);
    mech.setTonnage(50);
    mech.setWalkSpeed(3);
    mech.setArmorWeight(10);
    mech.setLeftTorsoArmor(10);
    mech.setLeftTorsoRearArmor(5);
    mech.setLeftArmArmor(9);
    mech.setCenterTorsoRearArmor(6);
    // The AC/10 values the ammunition at 10 a shot; it need not be placed.
    mech.addEquipmentFromTag("autocannon-standard-c", "is", "", false, undefined, "", false, [], undefined, undefined);
    return mech;
};
const placeIn = (mech: BattleMech, tag: string, location: string, key: string) => {
    const item = mech.addEquipmentFromTag(tag, "is", "", false, undefined, "", false, [], undefined, undefined)!;
    const from = mech.unallocatedCriticals.findIndex(critical => critical?.uuid === item.uuid);
    const slot = mech.getCriticals()[key].findIndex(critical => !critical);
    expect(mech.moveCritical("un", from, location, slot)).toBe(true);
    return { item, slot };
};
/** Load AC/10 ammunition with `shots` in the location and roll a critical hit onto it. */
const explode = (mech: BattleMech, shots: number, location = "lt", key = "leftTorso") => {
    const { item, slot } = placeIn(mech, "ammo-ac-10-standard", location, key);
    item.currentAmmo = shots;
    const lines = location === "la" || location === "lt" ? [slot < 6 ? 1 : 4, slot % 6 + 1] : [slot + 1];
    const log = mech.rollCriticalHit(location, { chance: 8, lines });
    return { log, bin: item };
};
const lost = (mech: BattleMech, location: string, kind: "structure" | "armor") =>
    Array.from({ length: 40 }, (_, index) => kind === "structure" ? mech.structureDamaged(location, index) : mech.armorDamaged(location, index))
        .filter(Boolean).length;

describe("'Mech ammunition explosions (Total Warfare)", () => {
    it("explodes the bin hit into internal structure, transferring inward, and hurts the MechWarrior (TW p.125)", () => {
        const mech = build();
        const { log, bin } = explode(mech, 2);
        // 2 shots x 10: the side torso's 12 structure, then 8 into the center torso's.
        expect(lost(mech, "lt", "structure")).toBe(12);
        expect(lost(mech, "ct", "structure")).toBe(8);
        expect(lost(mech, "lt", "armor")).toBe(0);
        expect(mech.getAmmoBinRemaining(bin)).toBe(0);
        expect(log).toContain("AC/10 - Standard Ammo explodes for 20 damage.");
        expect(log.at(-1)).toBe("The MechWarrior takes 2 damage (TW p.125, TO:AUE p.111)");
    });

    it("uses only the shots left, and an empty bin does not explode", () => {
        const mech = build();
        explode(mech, 1);
        expect(lost(mech, "lt", "structure")).toBe(10);
        expect(lost(mech, "ct", "structure")).toBe(0);

        const empty = build();
        expect(explode(empty, 0).log.at(-1)).toMatch(/is hit\.$/);
        expect(lost(empty, "lt", "structure")).toBe(0);
    });

    it("vents the excess at a location with CASE (TW p.134)", () => {
        const mech = build();
        placeIn(mech, "case", "lt", "leftTorso");
        const { log } = explode(mech, 2);
        expect(lost(mech, "lt", "structure")).toBe(12);
        expect(lost(mech, "ct", "structure")).toBe(0);
        expect(log).toContain("CASE vents the rest.");
    });

    it("vents an arm explosion at the side torso's CASE after damaging it (TW p.134)", () => {
        const mech = build();
        placeIn(mech, "case", "lt", "leftTorso");
        explode(mech, 3, "la", "leftArm");
        // 30: the arm's 8, the side torso's 12, and the last 10 vented.
        expect(lost(mech, "la", "structure")).toBe(8);
        expect(lost(mech, "lt", "structure")).toBe(12);
        expect(lost(mech, "ct", "structure")).toBe(0);
    });

    it("counts Clan CASE in every location", () => {
        const mech = build({ tech: "mis" });
        mech.setClanCASE(true);
        explode(mech, 2);
        expect(lost(mech, "ct", "structure")).toBe(0);
    });

    it("lets 1 point through CASE II and sends the rest to a torso's rear armor (TO:AUE p.111)", () => {
        const mech = build();
        placeIn(mech, "case-ii", "lt", "leftTorso");
        const { log } = explode(mech, 2);
        expect(lost(mech, "lt", "structure")).toBe(1);
        expect(lost(mech, "ltr", "armor")).toBe(5);
        expect(lost(mech, "lt", "armor")).toBe(0);
        expect(lost(mech, "ct", "structure")).toBe(0);
        expect(log).toContain("CASE II vents the rest.");
    });

    it("strips half a limb's original armor behind CASE II, rounding up (TO:AUE p.111)", () => {
        const mech = build();
        placeIn(mech, "case-ii", "la", "leftArm");
        explode(mech, 2, "la", "leftArm");
        expect(lost(mech, "la", "structure")).toBe(1);
        expect(lost(mech, "la", "armor")).toBe(5);
    });
});

describe("'Mech ammunition explosions on an edition's own critical hit roll", () => {
    it("leaves the bin alone on the Battledroids roll, where only heat explodes ammunition (BD pp.13, 19)", () => {
        const mech = build({ edition: "battledroids" });
        const { log, bin } = explode(mech, 1);
        expect(log.join(" ")).not.toContain("explode");
        expect(lost(mech, "lt", "structure")).toBe(0);
        expect(mech.getAmmoBinRemaining(bin)).toBe(1);
    });

    it("explodes every bin in the location from BattleTech 2nd Edition to 4th (BT2 p.25, BT4 p.24)", () => {
        for (const edition of ["battletech-2nd-edition", "battletech-3rd-edition", "battletech-4th-edition"]) {
            const mech = build({ edition });
            const other = placeIn(mech, "ammo-ac-10-standard", "lt", "leftTorso").item;
            other.currentAmmo = 1;
            const { log, bin } = explode(mech, 1);
            // 2 shots x 10 across both bins: the side torso's 12, then 8 into the center torso.
            expect(lost(mech, "lt", "structure")).toBe(12);
            expect(lost(mech, "ct", "structure")).toBe(8);
            expect(mech.getAmmoBinRemaining(other)).toBe(0);
            expect(mech.getAmmoBinRemaining(bin)).toBe(0);
            expect(log).toContain("AC/10 - Standard Ammo, AC/10 - Standard Ammo explode for 20 damage.");
        }
    });

    it("explodes only the bin hit under the Master Rules (BMR p.36)", () => {
        const mech = build({ edition: "master-rules" });
        placeIn(mech, "ammo-ac-10-standard", "lt", "leftTorso").item.currentAmmo = 1;
        explode(mech, 1);
        expect(lost(mech, "lt", "structure")).toBe(10);
    });
});

describe("'Mech ammunition explosions (Core Rulebook)", () => {
    it("caps the damage at 20 and blows out the rear armor where the last point lands (CRB p.96)", () => {
        const mech = build({ edition: "core-rulebook" });
        explode(mech, 3);
        expect(lost(mech, "lt", "structure")).toBe(12);
        expect(lost(mech, "ct", "structure")).toBe(8);
        expect(lost(mech, "ctr", "armor")).toBe(6);
        expect(lost(mech, "ct", "armor")).toBe(0);
    });

    it("caps CASE at 10 to structure and 10 more to the rear armor (CRB p.96)", () => {
        const mech = build({ edition: "core-rulebook" });
        placeIn(mech, "case", "lt", "leftTorso");
        const { log } = explode(mech, 2);
        expect(lost(mech, "lt", "structure")).toBe(10);
        expect(lost(mech, "ltr", "armor")).toBe(5);
        expect(log.at(-1)).toBe("The MechWarrior takes 1 damage (CRB pp.96, 107)");
    });
});
