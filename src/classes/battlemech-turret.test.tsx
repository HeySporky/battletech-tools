import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BattleMech } from "./battlemech";
import BattleMechSVG from "../ui/components/svg/battlemech-svg";
import { buildMech } from "../test-support/builders";

// BattleMech Turrets (TO:AUE pp.158-159, BV p.194; #88).
const build = () => buildMech();
const placeIn = (mech: BattleMech, tag: string, location: string, key: string) => {
    const item = mech.addEquipmentFromTag(tag, "is", "", false, undefined, "", false, [], undefined, undefined)!;
    const from = mech.unallocatedCriticals.findIndex(critical => critical?.uuid === item.uuid);
    const slot = mech.getCriticals()[key].findIndex(critical => !critical);
    expect(mech.moveCritical("un", from, location, slot)).toBe(true);
    return mech.getInstalledEquipment().find(installed => installed.uuid === item.uuid)!;
};
const importFixture = (name: string) => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const mech = new BattleMech();
    mech.importSSWXML(readFileSync(`src/utils/__fixtures__/${name}.ssw`, "utf8"));
    return mech;
};
const turrets = (mech: BattleMech) => mech.getInstalledEquipment().filter(item => item.variableFormula === "mech-turret");

describe("BattleMech Turrets", () => {
    it("weighs 10 percent of what it carries, rounded up to the half ton, in one slot: a shoulder turret with a PPC and a Medium Laser", () => {
        const mech = build();
        const turret = placeIn(mech, "mech-turret-shoulder", "lt", "leftTorso");
        const ppc = placeIn(mech, "standard-ppc", "lt", "leftTorso");
        const laser = placeIn(mech, "medium-laser", "lt", "leftTorso");
        const ammo = placeIn(mech, "ammo-ac-10-standard", "lt", "leftTorso");
        const before = mech.getCurrentTonnage();
        expect(turret.weight).toBe(0);
        mech.setEquipmentTurret(ppc.uuid, true);
        mech.setEquipmentTurret(laser.uuid, true);
        // Ammunition is never marked.
        expect(mech.setEquipmentTurret(ammo.uuid, true)?.turret).toBeUndefined();
        // 7 + 1 = 8 tons, 0.8 rounds up to 1 ton; 10,000 C-bills a ton.
        expect(turret.weight).toBe(1);
        expect(turret.cbills).toBe(10000);
        expect(mech.getCurrentTonnage()).toBe(before + 1);
        expect(mech.isTurretMounted(ppc)).toBe(true);
        // A turret item fires all around: marking it rear-firing takes it out of the turret, and back.
        mech.setRear(laser.uuid, true);
        expect(laser.turret).toBeUndefined();
        mech.setEquipmentTurret(laser.uuid, true);
        expect(laser.rear).toBe(false);
        // Saved and loaded with the design.
        const loaded = new BattleMech(mech.exportJSON());
        expect(loaded.getInstalledEquipment().filter(item => item.turret).map(item => item.tag).sort()).toEqual(["medium-laser", "standard-ppc"]);
        expect(turrets(loaded)[0].weight).toBe(1);
    });

    it("carries only its own location's items; a head turret's slot is in the center torso and needs a Torso-Mounted Cockpit", () => {
        const mech = build();
        placeIn(mech, "mech-turret-shoulder", "rt", "rightTorso");
        const laser = placeIn(mech, "medium-laser", "lt", "leftTorso");
        mech.setEquipmentTurret(laser.uuid, true);
        expect(mech.isTurretMounted(laser)).toBe(false);
        expect(turrets(mech)[0].weight).toBe(0);
        const head = build();
        placeIn(head, "mech-turret-head", "ct", "centerTorso");
        expect(head.getChassisEquipmentViolations()).toContain("BattleMech Turret (Head) needs a Torso-Mounted Cockpit (TO:AUE p.158).");
        head.setCockpitType("torso-mounted");
        expect(head.getChassisEquipmentViolations().join(" ")).not.toContain("Torso-Mounted Cockpit");
    });

    it("counts turret weapons in the front arc when the forward weapons outside it are worth more than the rear ones (TO:AUE p.194)", () => {
        // The Quickdraw QKD-8X's head-turret PPC; SSW and the MUL have 1,612.
        const quickdraw = importFixture("quickdraw-qkd-8x");
        expect(turrets(quickdraw).map(item => [item.tag, item.location, item.weight])).toEqual([["mech-turret-head", "ct", 1]]);
        expect(quickdraw.getInstalledEquipment().find(item => item.tag === "standard-ppc")?.turret).toBe(true);
        expect(quickdraw.getCurrentTonnage()).toBe(60);
        expect(quickdraw.getBattleValue()).toBe(1612);
        expect(quickdraw.sswImportErrors.join(" ")).not.toContain("turret");
        // The Uraeus UAE-7R's shoulder-turret Bombast Laser: 1,843.
        const uraeus = importFixture("uraeus-uae-7r");
        expect(uraeus.getCurrentTonnage()).toBe(75);
        expect(uraeus.getBattleValue()).toBe(1843);
    });

    it("counts a turret carrying every weapon in full: Howler (Baboon) 6, 550", () => {
        const howler = importFixture("howler-baboon-6");
        expect(turrets(howler).map(item => [item.tag, item.location, item.weight])).toEqual([["mech-turret-shoulder", "rt", 0.5]]);
        expect(howler.getCurrentTonnage()).toBe(20);
        expect(howler.getBattleValue()).toBe(550);
    });

    it("marks turret weapons on the record sheet", () => {
        const markup = renderToStaticMarkup(<BattleMechSVG mechData={importFixture("quickdraw-qkd-8x")} inPlay={false} />);
        expect(markup).toContain("PPC [T]");
        expect(markup).toContain("PPC (turret)");
    });
});
