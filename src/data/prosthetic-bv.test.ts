import { describe, expect, it } from "vitest";
import { findInfantryAugmentation, findInfantryProstheticItem } from "./infantry-armor";

// Prosthetic limbs and their Enhancement BV Modifiers (#611): the Prosthetic Limb Enhancement BV Modifiers Table, Interstellar Operations:
// Alternate Eras p.186 (the platoon builds them: IO:AE pp.77-79; the BV steps are in infantry-platoon.test.ts). The table, per trooper:
// Laser 0.24, Ballistic 0.02, Needler 0.08, Shotgun 0.08, Sonic Stunner 0.10, Submachine Gun 0.10, Blade 0.02, Shocker 0.04,
// Vibroblade 0.14, Rumal/Garrote 0.14, Grappler Line 0 (x1.2 on the Anti-'Mech part), Climbing Claws 0.02 (x1.2). Tail 0.2; glider wings none.
describe("Prosthetic Limb Enhancement BV Modifiers (IO:AE p.186)", () => {
    const table: [string, number][] = [
        ["laser", 0.24], ["ballistic", 0.02], ["needler", 0.08], ["shotgun", 0.08], ["sonic-stunner", 0.10], ["smg", 0.10],
        ["blade", 0.02], ["shocker", 0.04], ["vibroblade", 0.14], ["rumal-garrote", 0.14], ["grappler", 0], ["climbing-claws", 0.02],
    ];

    it.each(table)("%s is worth %s a trooper", (tag, value) => {
        expect(findInfantryProstheticItem(tag)?.battleValue).toBe(value);
    });

    it("is the whole table: no enhancement item is left unrated", () => {
        for (const [tag] of table) expect(findInfantryProstheticItem(tag), tag).toBeDefined();
    });

    it("has the tail and wings records the table notes name (the tail 0.2 a trooper, glider wings no BV; only conventional infantry take a BV effect)", () => {
        expect(findInfantryAugmentation("aug-tail")).toBeDefined();
        expect(findInfantryAugmentation("aug-glider")).toBeDefined();
    });
});
