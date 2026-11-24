import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../data/rules-level-options";

/** Rate of fire and jams for rotary and Ultra ACs on a 'Mech (#643). The rules are in src/utils/autocannon-play.ts. */
const build = (): BattleMech => {
    const mech = new BattleMech();
    mech.setTech("is");
    mech.setEra("dark-ages");
    mech.setTonnage(65);
    mech.setWalkSpeed(4);
    mech.applyGameSettings({ ...mech.getGameSettings(CUSTOM_HOMEBREW_RULES_LEVEL), rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL });
    return mech;
};
const mount = (mech: BattleMech, tag: string) => mech.addEquipmentFromTag(tag, "is", "un", false, null, "", false, [], undefined, undefined, -1, "", true)!;

describe("autocannon play on a 'Mech", () => {
    it("finds the rotary AC and holds the shots to six", () => {
        const mech = build();
        const rac = mount(mech, "rotary-ac-5");
        expect(mech.getRateOfFireWeapons().map((item) => item.uuid)).toEqual([rac.uuid]);
        expect(mech.getShots(rac.uuid!)).toBe(1);
        mech.setShots(rac.uuid!, 9);
        expect(mech.getShots(rac.uuid!)).toBe(6);
    });
    it("a jam on the to-hit roll still fires the shots and jams the weapon; it is cleared on the turn after the declaration", () => {
        const mech = build();
        const uuid = mount(mech, "rotary-ac-5").uuid!;
        mech.setShots(uuid, 6);
        expect(mech.recordToHitRoll(uuid, 4)).toEqual({ jammed: true });
        expect(mech.isJammed(uuid)).toBe(true);
        mech.turnReset();
        expect(mech.isJammed(uuid)).toBe(true);
        expect(mech.declareClear(uuid)).toBe(true);
        mech.turnReset();
        expect(mech.isClearingAttempt(uuid)).toBe(true);
        expect(mech.resolveClear(uuid, true)).toBe(true);
        expect(mech.isJammed(uuid)).toBe(false);
    });
    it("an Ultra jams on a 2 at the double rate only", () => {
        const mech = build();
        const uuid = mount(mech, "autocannon-ultra-a").uuid!;
        expect(mech.recordToHitRoll(uuid, 2).jammed).toBe(false);
        mech.turnReset();
        mech.setShots(uuid, 2);
        expect(mech.recordToHitRoll(uuid, 2).jammed).toBe(true);
    });
    it("play state survives a save and load; an old save has 1 shot, not jammed", () => {
        const mech = build();
        const uuid = mount(mech, "rotary-ac-5").uuid!;
        mech.setShots(uuid, 4);
        mech.recordToHitRoll(uuid, 3);
        const copy = new BattleMech();
        copy.import(JSON.parse(JSON.stringify(mech.export())));
        expect(copy.autocannonPlay).toEqual(mech.autocannonPlay);
        const old = mech.export();
        delete (old as { autocannonPlay?: unknown }).autocannonPlay;
        const loaded = new BattleMech();
        loaded.import(JSON.parse(JSON.stringify(old)));
        expect(loaded.autocannonPlay).toEqual({});
    });
    it("a 'Mech without a rotary or Ultra AC offers no controls", () => {
        const mech = build();
        mount(mech, "medium-laser");
        expect(mech.getRateOfFireWeapons()).toEqual([]);
    });
});
