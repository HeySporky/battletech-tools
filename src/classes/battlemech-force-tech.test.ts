import { describe, expect, it } from "vitest";
import { getEquipmentCatalogDefinitions, getEquipmentOfferIssue } from "../data/equipment-registry";
import AerospaceFighter from "./aerospace-fighter";
import BattledroidsUnit from "./battledroids-unit";
import { BattleMech } from "./battlemech";
import { BattleMechForce } from "./battlemech-force";
import { BattleMechGroup } from "./battlemech-group";
import { getSpeedFactor } from "../data/battle-value";
import Vehicle from "./vehicle";
import { buildMech } from "../test-support/builders";
import { setEWarEcmMode, setEWarOverride } from "../utils/ewar-play";
import InfantryPlatoon from "./infantry-platoon";

// The Tech line on the printed Classic BattleTech force (issue 18 roster review).
describe("Classic BattleTech force and group tech", () => {
    it("names a group of Battledroids units for their rulebook", () => {
        const group = new BattleMechGroup();
        group.battledroidsUnits.push(new BattledroidsUnit("scr-8n-scorpion"));
        expect(group.getTech()).toBe("Battledroids");
    });

    it("ignores an empty group instead of calling the force Mixed", () => {
        const force = new BattleMechForce();
        force.newGroup();
        force.groups[0].members.push(new BattleMech());
        force.newGroup();
        expect(force.getTech()).toBe(force.groups[0].getTech());
        expect(force.getTech()).not.toBe("Mixed");
    });
});

// The roster's rules edition (edition-aware BV plan, ruling 3): its Battle Values follow the edition being played.
describe("Classic BattleTech force rules edition", () => {
    it("totals Battle Value under the force's edition, and saves only an edition other than the default", () => {
        const force = new BattleMechForce();
        const mech = new BattleMech();
        force.groups[0].members.push(mech);
        const bv2 = mech.getPilotAdjustedBattleValue("total-warfare").toLocaleString("en-US");
        expect(force.getBattleValueText()).toBe(bv2);
        expect(force.export().rulesEdition).toBeUndefined();

        force.rulesEdition = "master-rules";
        const bv1 = mech.getPilotAdjustedBattleValue("master-rules").toLocaleString("en-US");
        expect(force.getBattleValueText()).toBe(`${bv1} (BV2: ${bv2})`);
        expect(force.groups[0].getBattleValueText(force.rulesEdition)).toBe(`${bv1} (BV2: ${bv2})`);
        expect(new BattleMechForce(JSON.parse(JSON.stringify(force.export()))).rulesEdition).toBe("master-rules");
        expect(new BattleMechForce({ ...force.export(), rulesEdition: "no-such-edition" }).rulesEdition).toBe("total-warfare");
    });

    it("adds the force's TAG-guided ammo to each TAG carrier before skill (BV v4.1 p.23; TO:AUE p.198)", () => {
        const force = new BattleMechForce();
        const spotter = new Vehicle();
        spotter.addEquipmentFromTag("is-tag", "front");
        spotter.addEquipmentFromTag("is-tag", "turret");
        const launcher = new Vehicle();
        launcher.addEquipmentFromTag("lrm-10", "front");
        launcher.addEquipmentFromTag("ammo-is-lrm-semi-guided", "body");
        launcher.addEquipmentFromTag("ammo-is-lrm-semi-guided", "body");
        const bomber = new AerospaceFighter();
        bomber.setExternalStore("ammo-is-bomb-arrow-iv-homing", 1);
        const rearSpotter = new BattleMech();
        rearSpotter.addEquipmentByName("TAG", "is", "rt", true, null, undefined, []);
        force.groups[0].members.push(rearSpotter);
        force.groups[0].vehicles.push(spotter, launcher);
        force.newGroup();
        force.groups[1].fighters.push(bomber);

        // Semi-guided LRM ammo takes its launcher's ammo BV (2 tons x 11); the homing bomb its own 30. TO:AUE adds
        // the bonus once per TAG carried; a unit whose only TAG is rear-mounted adds half.
        expect(spotter.getBattleValueTagShare()).toEqual({ times: 2, ammo: 0 });
        expect(launcher.getBattleValueTagShare()).toEqual({ times: 0, ammo: 22 });
        expect(bomber.getBattleValueTagShare()).toEqual({ times: 0, ammo: 30 });
        expect(rearSpotter.getBattleValueTagShare()).toEqual({ times: 0.5, ammo: 0 });
        expect(spotter.getBattleValueTagShare("core-rulebook").times).toBe(0);

        const tw = "total-warfare";
        const guided = 22 + 30;
        expect(spotter.getPilotAdjustedBattleValue(tw, 2 * guided)).toBe(spotter.getPilotAdjustedBattleValue(tw) + 2 * guided);
        const total = spotter.getPilotAdjustedBattleValue(tw, 2 * guided) + launcher.getPilotAdjustedBattleValue(tw)
            + rearSpotter.getPilotAdjustedBattleValue(tw, guided / 2) + bomber.getPilotAdjustedBattleValue(tw);
        expect(force.getBattleValueText()).toBe(total.toLocaleString("en-US"));
        expect(force.groups[0].getTotalBattleValue(tw, force.groups) + force.groups[1].getTotalBattleValue(tw, force.groups)).toBe(total);
        // A group on its own counts only the guided ammo in it.
        expect(force.groups[0].getTotalBattleValue(tw)).toBe(spotter.getPilotAdjustedBattleValue(tw, 2 * 22)
            + launcher.getPilotAdjustedBattleValue(tw) + rearSpotter.getPilotAdjustedBattleValue(tw, 11));
    });

    it("adds each C3 network's share to its members before skill (BV v4.1 p.23; TO:AUE p.198; CRB p.220)", () => {
        const force = new BattleMechForce();
        const master = new Vehicle();
        master.addEquipmentFromTag("c3-computer-master", "body");
        const boosted = new Vehicle();
        boosted.addEquipmentFromTag("c3-boosted-slave", "body");
        const slave = new BattleMech();
        slave.addEquipmentByName("C3 Computer (Slave)", "is", "ct", false, null, undefined, []);
        const loner = new Vehicle();
        loner.addEquipmentFromTag("c3-computer-slave", "body");
        const plain = new Vehicle();
        force.groups[0].vehicles.push(master, boosted, loner, plain);
        force.newGroup();
        force.groups[1].members.push(slave);
        expect([master, boosted, slave, plain].map((unit) => unit.getBattleValueC3Type())).toEqual(["standard", "boosted", "standard", undefined]);

        // A network spans groups; a unit alone in its network, or one with no C3 system, adds nothing.
        for (const unit of [master, boosted, slave, plain]) force.setC3Network(unit.getUUID(), "A");
        force.setC3Network(loner.getUUID(), "B");
        const tw = "total-warfare";
        const network = master.getBattleValue(tw) + boosted.getBattleValue(tw) + slave.getBattleValue(tw);
        expect(Math.min(master.getBattleValue(tw), boosted.getBattleValue(tw), slave.getBattleValue(tw))).toBeGreaterThan(0);
        const twTotal = master.getPilotAdjustedBattleValue(tw, network * 0.05) + boosted.getPilotAdjustedBattleValue(tw, network * 0.07)
            + slave.getPilotAdjustedBattleValue(tw, network * 0.05) + loner.getPilotAdjustedBattleValue(tw) + plain.getPilotAdjustedBattleValue(tw);
        expect(force.getBattleValueText()).toBe(twTotal.toLocaleString("en-US"));

        // The Core Rulebook: a three-unit network adds 15 percent of each member's own BV, boosted 5 more.
        const crb = "core-rulebook";
        const crbTotal = master.getPilotAdjustedBattleValue(crb, master.getBattleValue(crb) * 0.15)
            + boosted.getPilotAdjustedBattleValue(crb, boosted.getBattleValue(crb) * 0.2)
            + slave.getPilotAdjustedBattleValue(crb, slave.getBattleValue(crb) * 0.15) + loner.getPilotAdjustedBattleValue(crb) + plain.getPilotAdjustedBattleValue(crb);
        expect(force.groups[0].getTotalBattleValue(crb, force.groups, force.c3Networks)
            + force.groups[1].getTotalBattleValue(crb, force.groups, force.c3Networks)).toBe(crbTotal);

        // Saved per unit: a removed unit's entry is dropped, and clearing a unit's network removes it.
        force.groups[0].vehicles.pop();
        force.setC3Network(loner.getUUID(), "");
        const saved = JSON.parse(JSON.stringify(force.export()));
        expect(saved.c3Networks).toEqual({ [master.getUUID()]: "A", [boosted.getUUID()]: "A", [slave.getUUID()]: "A" });
        expect(new BattleMechForce(saved).c3Networks).toEqual(saved.c3Networks);
        expect(new BattleMechForce().export().c3Networks).toBeUndefined();
    });

    it("adds 200 to each homing Arrow IV and TAG unit of a BV1 force, before skill (BMR pp.143-144; BMR(R) pp.157-158)", () => {
        const force = new BattleMechForce();
        const spotter = new Vehicle();
        spotter.addEquipmentFromTag("is-tag", "front");
        const launcher = new Vehicle();
        launcher.addEquipmentFromTag("arrow-iv-system", "front");
        launcher.addEquipmentFromTag("ammo-is-arrow-iv-homing", "body");
        const plain = new Vehicle();
        const master = new Vehicle();
        master.addEquipmentFromTag("c3-computer-master", "body");
        force.groups[0].vehicles.push(launcher, plain);
        const total = (edition: string) => force.groups[0].getTotalBattleValue(edition, force.groups);
        const bmr = "master-rules";
        const bmrr = "master-rules-revised";
        const skilled = (edition: string, bonuses: Array<[Vehicle, number]>) => bonuses.reduce((sum, [unit, bonus]) => sum + unit.getPilotAdjustedBattleValue(edition, bonus), 0);

        // Homing missiles with nothing to guide them add nothing.
        expect(total(bmr)).toBe(skilled(bmr, [[launcher, 0], [plain, 0]]));
        // A C3 master guides them only under the Revised Edition's note A (p.157).
        force.groups[0].vehicles.push(master);
        expect(total(bmr)).toBe(skilled(bmr, [[launcher, 0], [plain, 0], [master, 0]]));
        expect(total(bmrr)).toBe(skilled(bmrr, [[launcher, 200], [plain, 0], [master, 200]]));
        // Once per unit however many TAGs it has; the C3 master still counts beside TAG.
        spotter.addEquipmentFromTag("is-tag", "turret");
        force.groups[0].vehicles.push(spotter);
        expect(total(bmr)).toBe(skilled(bmr, [[launcher, 200], [plain, 0], [master, 0], [spotter, 200]]));
        expect(total(bmrr)).toBe(skilled(bmrr, [[launcher, 200], [plain, 0], [master, 200], [spotter, 200]]));
    });

    it("adds 35 percent of each unit's weapons to a complete BV1 C3 network (BMR p.143; BMR(R) p.157)", () => {
        const force = new BattleMechForce();
        const master = new Vehicle();
        master.addEquipmentFromTag("c3-computer-master", "body");
        master.addEquipmentFromTag("medium-laser", "front");
        master.addEquipmentFromTag("medium-laser", "rear");
        master.addEquipmentFromTag("arrow-iv-system", "front");
        master.addEquipmentFromTag("is-ams", "front");
        const slave = new Vehicle();
        slave.addEquipmentFromTag("c3-computer-slave", "body");
        slave.addEquipmentFromTag("lrm-10", "front");
        slave.addEquipmentFromTag("ammo-is-lrm-10", "body");
        const secondMaster = new Vehicle();
        secondMaster.addEquipmentFromTag("c3-computer-master", "body");
        secondMaster.addEquipmentFromTag("lrm-10", "front");
        force.groups[0].vehicles.push(master, slave, secondMaster);
        const edition = "master-rules-revised";
        const total = () => force.groups[0].getTotalBattleValue(edition, force.groups, force.c3Networks);

        // Medium laser 46 + rear 46 / 2, no artillery or AMS: 69 x .35 = 24; LRM 10 90 without its ammo: 31.5 rounds to 32.
        expect(master.getBattleValueC3Part(edition).weapons).toBe(69);
        expect(slave.getBattleValueC3Part(edition).weapons).toBe(90);
        force.setC3Network(master.getUUID(), "A");
        force.setC3Network(slave.getUUID(), "A");
        expect(total()).toBe(master.getPilotAdjustedBattleValue(edition, 24) + slave.getPilotAdjustedBattleValue(edition, 32) + secondMaster.getPilotAdjustedBattleValue(edition));

        // Two masters and no slave, or a lone unit, are not a complete network.
        force.setC3Network(slave.getUUID(), "");
        force.setC3Network(secondMaster.getUUID(), "A");
        const unadjusted = master.getPilotAdjustedBattleValue(edition) + slave.getPilotAdjustedBattleValue(edition) + secondMaster.getPilotAdjustedBattleValue(edition);
        expect(total()).toBe(unadjusted);

        // Two Improved C3 Computers are.
        const improved = [new Vehicle(), new Vehicle()];
        improved.forEach((unit) => {
            unit.addEquipmentFromTag("c3i-computer", "body");
            unit.addEquipmentFromTag("medium-laser", "front");
            force.groups[0].vehicles.push(unit);
            force.setC3Network(unit.getUUID(), "B");
        });
        expect(total()).toBe(unadjusted + improved.reduce((sum, unit) => sum + unit.getPilotAdjustedBattleValue(edition, 16), 0));
    });

    it("counts semi-guided LRM ammo x 6 beside friendly TAG, not a C3 master (Maximum Tech p.91)", () => {
        const force = new BattleMechForce();
        const launcher = new BattleMech();
        launcher.addEquipmentFromTag("lrm-10", "is", "", false, undefined, "", false, [], undefined, undefined);
        launcher.addEquipmentFromTag("ammo-is-lrm-semi-guided", "is", "", false, undefined, "", false, [], undefined, undefined);
        const master = new Vehicle();
        master.addEquipmentFromTag("c3-computer-master", "body");
        force.groups[0].members.push(launcher);
        force.groups[0].vehicles.push(master);
        const edition = "master-rules-revised";
        const total = () => force.groups[0].getTotalBattleValue(edition, force.groups);
        const plain = launcher.getPilotAdjustedBattleValue(edition) + master.getPilotAdjustedBattleValue(edition);
        expect(total()).toBe(plain);

        const spotter = new Vehicle();
        spotter.addEquipmentFromTag("is-tag", "front");
        force.groups[0].vehicles.push(spotter);
        // One ton of LRM 10 ammo at 11 goes to 66: 55 more, times the Speed Factor.
        const semiGuided = launcher.getBattleValueTagShare(edition).semiGuided ?? 0;
        expect(Math.abs(semiGuided - 55 * getSpeedFactor(launcher.getRunSpeed()))).toBeLessThanOrEqual(1);
        expect(total()).toBe(launcher.getPilotAdjustedBattleValue(edition, semiGuided) + master.getPilotAdjustedBattleValue(edition) + spotter.getPilotAdjustedBattleValue(edition));
        // The 1998 Master Rules read the FASA printing of Maximum Tech: the same x 6.
        expect(Math.abs((launcher.getBattleValueTagShare("master-rules").semiGuided ?? 0) - 55 * getSpeedFactor(launcher.getRunSpeed()))).toBeLessThanOrEqual(1);
    });

    it("adds a command console's 200 once per side, after skill and outside any group (Maximum Tech p.91)", () => {
        const force = new BattleMechForce();
        force.rulesEdition = "master-rules-revised";
        const consoles = [new BattleMech(), new BattleMech()];
        force.groups[0].members.push(...consoles);
        const units = consoles.reduce((sum, unit) => sum + unit.getPilotAdjustedBattleValue(force.rulesEdition), 0);
        const twice = consoles.reduce((sum, unit) => sum + unit.getPilotAdjustedBattleValue("total-warfare"), 0);
        expect(force.getBattleValueText()).toBe(`${units.toLocaleString("en-US")} (BV2: ${twice.toLocaleString("en-US")})`);

        expect(consoles.every((unit) => unit.setCommandConsole(true))).toBe(true);
        const withConsoles = consoles.reduce((sum, unit) => sum + unit.getPilotAdjustedBattleValue(force.rulesEdition), 0);
        const bv2 = consoles.reduce((sum, unit) => sum + unit.getPilotAdjustedBattleValue("total-warfare"), 0);
        expect(force.getBattleValueText()).toBe(`${(withConsoles + 200).toLocaleString("en-US")} (BV2: ${bv2.toLocaleString("en-US")})`);
        expect(force.groups[0].getTotalBattleValue(force.rulesEdition, force.groups)).toBe(withConsoles);
    });
});

// The force E-War board (E-War play design, Phase 0): declared coverage and pods, written onto units.
describe("Classic BattleTech force E-War board", () => {
    const pod = { kind: "narc" as const, pod: "homing", turn: 2 };

    it("board puts units inside hostile ECM", () => {
        const force = new BattleMechForce();
        const mech = new BattleMech();
        const tank = new Vehicle();
        const jump = new BattleMech();
        force.groups[0].members.push(mech, jump);
        force.groups[0].vehicles.push(tank);
        force.setEWarBoardEntry("hostileEcm", [mech.getUUID(), tank.getUUID()]);
        force.setEWarBoardEntry("friendlyEcm", [jump.getUUID()]);
        force.setEWarBoardEntry("tagged", [tank.getUUID()]);
        force.setEWarNarcPods(jump.getUUID(), [pod]);
        expect(force.getEWarUnits()).toHaveLength(3);
        expect(mech.ewarPlay.inHostileEcm).toBe(true);
        expect(tank.ewarPlay.inHostileEcm).toBe(true);
        expect(jump.ewarPlay.inHostileEcm).toBeFalsy();
        expect(jump.ewarPlay.inFriendlyEcm).toBe(true);
        expect(tank.ewarPlay.tagged).toBe(true);
        expect(jump.ewarPlay.narcPods).toEqual([pod]);
        force.setEWarBoardEntry("hostileEcm", [tank.getUUID()]);
        expect(mech.ewarPlay.inHostileEcm).toBeFalsy();
    });

    it("a hand override beats the board until the board entry changes", () => {
        const force = new BattleMechForce();
        const mech = new BattleMech();
        const other = new BattleMech();
        force.groups[0].members.push(mech, other);
        force.setEWarBoardEntry("hostileEcm", [mech.getUUID()]);
        setEWarOverride(mech, "inHostileEcm", false);
        expect(mech.ewarPlay.overrides).toEqual(["inHostileEcm"]);
        force.setEWarBoardEntry("tagged", [mech.getUUID()]);
        expect(mech.ewarPlay.inHostileEcm).toBe(false);
        force.setEWarBoardEntry("hostileEcm", [mech.getUUID(), other.getUUID()]);
        expect(mech.ewarPlay.inHostileEcm).toBe(true);
        expect(mech.ewarPlay.overrides ?? []).not.toContain("inHostileEcm");
    });

    it("removing the board entry clears the override and the field", () => {
        const force = new BattleMechForce();
        const mech = new BattleMech();
        force.groups[0].members.push(mech);
        force.setEWarBoardEntry("hostileEcm", [mech.getUUID()]);
        setEWarOverride(mech, "inHostileEcm", true);
        force.setEWarBoardEntry("hostileEcm", []);
        expect(mech.ewarPlay.inHostileEcm).toBeFalsy();
        expect(mech.ewarPlay.overrides ?? []).not.toContain("inHostileEcm");
    });

    it("board entries for removed units are ignored and dropped on export", () => {
        const force = new BattleMechForce();
        const kept = new BattleMech();
        const gone = new Vehicle();
        force.groups[0].members.push(kept);
        force.groups[0].vehicles.push(gone);
        force.setEWarBoardEntry("hostileEcm", [kept.getUUID(), gone.getUUID(), "a"]);
        force.setEWarNarcPods(gone.getUUID(), [pod]);
        force.setEWarNarcPods("b", [pod]);
        force.groups[0].vehicles.pop();
        const saved = JSON.parse(JSON.stringify(force.export()));
        expect(saved.ewarBoard).toEqual({ hostileEcm: [kept.getUUID(), "a"], narcPods: { b: [pod] } });
        expect(new BattleMechForce(saved).ewarBoard).toEqual(saved.ewarBoard);
    });

    it("a stripped export (no in-play variables) leaves the board out", () => {
        const force = new BattleMechForce();
        const mech = new BattleMech();
        force.groups[0].members.push(mech);
        force.setEWarBoardEntry("hostileEcm", [mech.getUUID()]);
        expect(force.export(true).ewarBoard).toBeUndefined();
        expect(force.export().ewarBoard).toEqual({ hostileEcm: [mech.getUUID()] });
    });

    it("old force saves load with an empty board", () => {
        const saved = JSON.parse(JSON.stringify(new BattleMechForce().export()));
        expect(saved.ewarBoard).toBeUndefined();
        expect(new BattleMechForce(saved).ewarBoard).toEqual({});
        const bad = new BattleMechForce({ ...saved, ewarBoard: { hostileEcm: [1, "x"], friendlyEcm: "no", narcPods: { a: [{ kind: "bad", pod: "x", turn: 1 }, pod] }, tagged: ["q"] } });
        expect(bad.ewarBoard).toEqual({ hostileEcm: ["x"], narcPods: { a: [pod] }, tagged: ["q"] });
    });
});

describe("Classic BattleTech force E-War turn end (#642 Phase 1)", () => {
    it("Next Turn clears TAG and the anti-missile engagements, on units and on the board, and keeps the Narc pods", () => {
        const force = new BattleMechForce();
        const mech = new BattleMech();
        const tank = new Vehicle();
        force.groups[0].members.push(mech);
        force.groups[0].vehicles.push(tank);
        force.setEWarBoardEntry("tagged", [tank.getUUID()]);
        force.setEWarNarcPods(mech.getUUID(), [{ kind: "narc", pod: "narc", turn: 1 }]);
        mech.ewarPlay.amsUses = { a1: 2 };
        setEWarOverride(mech, "tagged", true);
        force.endEWarTurn();
        expect(tank.ewarPlay.tagged).toBeFalsy();
        expect(mech.ewarPlay.tagged).toBeUndefined();
        expect(mech.ewarPlay.overrides ?? []).not.toContain("tagged");
        expect(mech.ewarPlay.amsUses).toBeUndefined();
        expect(force.ewarBoard.tagged).toBeUndefined();
        expect(mech.ewarPlay.narcPods).toEqual([{ kind: "narc", pod: "narc", turn: 1 }]);
    });
});

describe("Classic BattleTech force E-War turn end (#642 Phase 2)", () => {
    it("Next Turn keeps the stealth switches, the ECM mode and the ECM on-state: they are set in the End Phase and last", () => {
        const force = new BattleMechForce();
        const mech = new BattleMech();
        force.groups[0].members.push(mech);
        mech.ewarPlay.stealthOn = { "null-sig": true };
        mech.ewarPlay.ecmMode = { e1: "eccm" };
        mech.ewarPlay.ecmOn = { e1: true };
        force.endEWarTurn();
        expect(mech.ewarPlay.stealthOn).toEqual({ "null-sig": true });
        expect(mech.ewarPlay.ecmMode).toEqual({ e1: "eccm" });
        expect(mech.ewarPlay.ecmOn).toEqual({ e1: true });
    });
});

describe("Classic BattleTech E-War heat (#642 Phase 1 minors)", () => {
    it("heat an anti-missile item made counts in the turn heat and clears at Next Turn, never touching the heat scale directly", () => {
        const mech = new BattleMech();
        const base = mech.getTurnHeatDifference();
        mech.ewarPlay.heat = 3;
        expect(mech.getTurnHeatDifference()).toBe(base + 3);
        expect(mech.currentHeat).toBe(0);
        const force = new BattleMechForce();
        force.groups[0].members.push(mech);
        force.endEWarTurn();
        expect(mech.ewarPlay.heat).toBeUndefined();
        expect(mech.getTurnHeatDifference()).toBe(base);
    });
});

// ---- E-War Phase 3, Task 2: network records on the force ----
describe("force C3 network records", () => {
    const c3Vehicle = (tag: string) => {
        const vehicle = new Vehicle();
        vehicle.addEquipmentFromTag(tag, "body");
        return vehicle;
    };
    const forceWith = (tags: string[]) => {
        const force = new BattleMechForce();
        force.rulesEdition = "total-warfare";
        const units = tags.map(c3Vehicle);
        force.groups[0].vehicles.push(...units);
        return { force, units };
    };

    it("loads an old c3Networks map as one record per name, and keeps the map Battle Value reads", () => {
        const { force, units } = forceWith(["c3-computer-master", "c3-computer-slave"]);
        const saved = force.export();
        saved.c3Networks = { [units[0].getUUID()]: "Alpha", [units[1].getUUID()]: "Alpha" };
        delete saved.c3NetworkRecords;
        const loaded = new BattleMechForce(saved);
        expect(loaded.c3Records).toEqual([{ name: "Alpha", type: "master-slave", members: [
            { uuid: units[0].getUUID(), role: "master" }, { uuid: units[1].getUUID(), role: "slave" }] }]);
        expect(loaded.c3Networks).toEqual(saved.c3Networks);
    });

    it("keeps Battle Value the same through the records", () => {
        const { force, units } = forceWith(["c3-computer-master", "c3-computer-slave", "c3-computer-slave"]);
        const before = new BattleMechForce(force.export()).getBattleValueText();
        for (const unit of units) expect(force.setC3Network(unit.getUUID(), "A")).toEqual([]);
        const after = force.getBattleValueText();
        expect(after).not.toBe(before);
        expect(new BattleMechForce(force.export()).getBattleValueText()).toBe(after);
    });

    it("refuses a thirteenth unit with a label and leaves the network as it was", () => {
        const { force, units } = forceWith(Array(13).fill("c3-computer-slave"));
        units.slice(0, 12).forEach((unit) => force.setC3Network(unit.getUUID(), "A"));
        const sized = force.c3Records[0].members.length;
        const labels = force.setC3Network(units[12].getUUID(), "A");
        expect(labels.join(" ")).toContain("at most");
        expect(force.c3Records[0].members).toHaveLength(sized);
        expect(force.c3Networks[units[12].getUUID()]).toBeUndefined();
    });

    it("moves a unit between networks, drops an empty network, and round-trips the records", () => {
        const { force, units } = forceWith(["c3-computer-master", "c3-computer-slave"]);
        force.setC3Network(units[0].getUUID(), "A", "master");
        force.setC3Network(units[1].getUUID(), "A");
        force.setC3Network(units[1].getUUID(), "B");
        expect(force.c3Records.map((record) => record.name)).toEqual(["A", "B"]);
        force.setC3Network(units[1].getUUID(), "");
        expect(force.c3Records.map((record) => record.name)).toEqual(["A"]);
        force.setC3NetworkType("A", "boosted");
        const loaded = new BattleMechForce(force.export());
        expect(loaded.c3Records).toEqual(force.c3Records);
        expect(loaded.c3Records[0].type).toBe("boosted");
    });
});

// ---- E-War Phase 3, Task 4: sensor pods and Nova links saved on the force ----
describe("force sensor pods and Nova links", () => {
    it("saves and loads a Remote Sensor pod, and refuses one over the limit", () => {
        const force = new BattleMechForce();
        force.rulesEdition = "total-warfare";
        const master = new Vehicle();
        master.addEquipmentFromTag("c3-computer-master", "body");
        force.groups[0].vehicles.push(master);
        force.turn = 2;
        force.setC3Network(master.getUUID(), "A");
        expect(force.addC3SensorPod("A", "0505")).toEqual([]);
        expect(force.ewarBoard.sensorPods).toEqual([{ network: "A", hex: "0505", turn: 2 }]);
        const loaded = new BattleMechForce(force.export());
        expect(loaded.ewarBoard.sensorPods).toEqual([{ network: "A", hex: "0505", turn: 2 }]);
        expect(force.addC3SensorPod("Nope", "0101").join(" ")).toContain("no network");
    });

    it("stamps a Nova link with the turn it was declared and keeps it through a save", () => {
        const force = new BattleMechForce();
        force.rulesEdition = "total-warfare";
        const first = new Vehicle();
        const second = new Vehicle();
        force.groups[0].vehicles.push(first, second);
        force.turn = 4;
        force.setC3Network(first.getUUID(), "N");
        force.setC3NetworkType("N", "nova");
        force.turn = 6;
        force.setC3Network(second.getUUID(), "N");
        expect(force.c3Records[0].members.map((member) => member.since)).toEqual([undefined, 6]);
        expect(new BattleMechForce(force.export()).c3Records[0].members.map((member) => member.since)).toEqual([undefined, 6]);
        // Moving the only member away and back keeps the network type.
        force.setC3Network(second.getUUID(), "");
        force.setC3Network(first.getUUID(), "N");
        expect(force.c3Records[0].type).toBe("nova");
    });
});

// ---- E-War Phase 3, Task 8: the unit link status read from the force network ----
describe("force C3 status", () => {
    it("reads a unit link status from its network, and says when it is in none", () => {
        const force = new BattleMechForce();
        force.rulesEdition = "total-warfare";
        const master = new Vehicle();
        master.addEquipmentFromTag("c3-computer-master", "body");
        const slave = new Vehicle();
        slave.addEquipmentFromTag("c3-computer-slave", "body");
        force.groups[0].vehicles.push(master, slave);
        expect(force.getC3StatusFor(slave.getUUID())).toMatchObject({ linked: false, labels: [expect.stringContaining("not in a C3 network")] });
        force.setC3Network(master.getUUID(), "A");
        force.setC3Network(slave.getUUID(), "A");
        expect(force.getC3StatusFor(slave.getUUID())).toMatchObject({ linked: true, degrade: 0 });
        slave.ewarPlay = { inHostileEcm: true };
        expect(force.getC3StatusFor(slave.getUUID()).linked).toBe(false);
    });
});

// ---- E-War Phase 3, Task 9: Next Turn ----
describe("force Next Turn and C3", () => {
    it("ages Remote Sensor pods out after three turns and keeps records, roles and Nova links", () => {
        const force = new BattleMechForce();
        force.rulesEdition = "total-warfare";
        const master = new Vehicle();
        master.addEquipmentFromTag("c3-computer-master", "body");
        force.groups[0].vehicles.push(master);
        force.turn = 2;
        force.setC3Network(master.getUUID(), "A");
        force.addC3SensorPod("A", "0505");
        const records = JSON.stringify(force.c3Records);
        // The play page raises the turn first and then ends the E-War turn: a pod launched on turn 2 works turns 3, 4 and 5.
        for (const ended of [2, 3, 4]) {
            force.turn = ended + 1;
            force.endEWarTurn();
            expect(force.ewarBoard.sensorPods, `after turn ${ended}`).toHaveLength(1);
        }
        force.turn = 6;
        force.endEWarTurn();
        expect(force.ewarBoard.sensorPods).toBeUndefined();
        expect(JSON.stringify(force.c3Records)).toBe(records);
    });

    it("counts a turn on an Emergency Master that has taken over, and stops at six", () => {
        const force = new BattleMechForce();
        force.rulesEdition = "total-warfare";
        const brokenMaster = new Vehicle();
        brokenMaster.addEquipmentFromTag("c3-computer-master", "body");
        brokenMaster.setWeaponStatus(brokenMaster.getEWarGear()[0].uuid as string, "destroyed");
        const emergency = new Vehicle();
        emergency.addEquipmentFromTag("c3-emergency-master", "body");
        force.groups[0].vehicles.push(brokenMaster, emergency);
        force.setC3Network(brokenMaster.getUUID(), "A", "master");
        force.setC3Network(emergency.getUUID(), "A", "emergency");
        for (let turn = 1; turn <= 8; turn++) {
            force.turn = turn;
            force.endEWarTurn();
        }
        expect(emergency.ewarPlay.c3EmergencyTurns).toBe(6);
    });
});

// ---- E-War Phase 3, review fix pass: force side ----
describe("force C3 review fixes", () => {
    const vehicleWith = (tag: string) => {
        const vehicle = new Vehicle();
        vehicle.addEquipmentFromTag(tag, "body");
        return vehicle;
    };

    it("keeps the chosen roles, Master links and Nova turns when the network type changes", () => {
        const force = new BattleMechForce();
        force.rulesEdition = "total-warfare";
        const master = vehicleWith("c3-computer-master");
        const slave = vehicleWith("c3-computer-slave");
        force.groups[0].vehicles.push(master, slave);
        force.setC3Network(master.getUUID(), "A", "master");
        force.setC3Network(slave.getUUID(), "A", "slave");
        force.setC3MasterOf(slave.getUUID(), master.getUUID());
        expect(force.c3Records[0].members.find((member) => member.uuid === slave.getUUID())?.master).toBe(master.getUUID());
        expect(force.setC3NetworkType("A", "boosted")).toEqual([]);
        const roles = Object.fromEntries(force.c3Records[0].members.map((member) => [member.uuid, member.role]));
        expect(roles).toEqual({ [master.getUUID()]: "master", [slave.getUUID()]: "slave" });
        expect(force.c3Records[0].members.find((member) => member.uuid === slave.getUUID())?.master).toBe(master.getUUID());
        // A Nova link is refused for Master/Slave gear.
        expect(force.setC3NetworkType("A", "nova").join(" ")).toContain("cannot join");
        expect(force.c3Records[0].type).toBe("boosted");
    });

    it("saves the network of a unit that is not a mech or vehicle", () => {
        const force = new BattleMechForce();
        const fighter = new AerospaceFighter();
        force.groups[0].fighters.push(fighter);
        force.setC3Network(fighter.getUUID(), "A");
        expect(force.export().c3NetworkRecords?.[0].members[0].uuid).toBe(fighter.getUUID());
        expect(new BattleMechForce(force.export()).c3Networks[fighter.getUUID()]).toBe("A");
    });

    it("lets an Emergency Master run the network in the link status once the Master is lost", () => {
        const force = new BattleMechForce();
        force.rulesEdition = "total-warfare";
        const brokenMaster = vehicleWith("c3-computer-master");
        brokenMaster.setWeaponStatus(brokenMaster.getEWarGear()[0].uuid as string, "destroyed");
        const emergency = vehicleWith("c3-emergency-master");
        const slave = vehicleWith("c3-computer-slave");
        force.groups[0].vehicles.push(brokenMaster, emergency, slave);
        force.setC3Network(brokenMaster.getUUID(), "A", "master");
        force.setC3Network(emergency.getUUID(), "A", "emergency");
        force.setC3Network(slave.getUUID(), "A", "slave");
        force.turn = 4;
        expect(force.getC3StatusFor(slave.getUUID()).linked).toBe(true);
        emergency.ewarPlay.c3EmergencyTurns = 6;
        expect(force.getC3StatusFor(slave.getUUID()).linked).toBe(false);
    });
});

// ---- E-War Phase 3, deferred minors: force side ----
describe("force C3 deferred minors", () => {
    const vehicleWith = (tag: string) => {
        const vehicle = new Vehicle();
        vehicle.addEquipmentFromTag(tag, "body");
        return vehicle;
    };

    it("checks a network against each member's own rules edition, not only the force's (M2)", () => {
        const force = new BattleMechForce();
        force.rulesEdition = "total-warfare";
        const old = buildMech();
        old.setRulesEdition("master-rules");
        old.addEquipmentFromTag("c3i-computer", "is", "ct", false, undefined, "", false, [], undefined, undefined);
        force.groups[0].members.push(old);
        expect(force.setC3Network(old.getUUID(), "A").join(" ")).toContain("not printed");
        expect(force.c3Records).toEqual([]);
    });

    it("keeps Battle Value of an old name-only save the same as the records give, in every edition (M6)", () => {
        const editions = ["total-warfare", "master-rules", "master-rules-revised", "core-rulebook", "battlemech-manual", "battletech-compendium"];
        for (const edition of editions) {
            const force = new BattleMechForce();
            force.rulesEdition = edition;
            const units = ["c3-computer-master", "c3-computer-slave", "c3-computer-slave"].map(vehicleWith);
            force.groups[0].vehicles.push(...units);
            const saved = force.export();
            saved.c3Networks = Object.fromEntries(units.map((unit) => [unit.getUUID(), "A"]));
            delete saved.c3NetworkRecords;
            const fromOld = new BattleMechForce(saved).getBattleValueText();
            const direct = new BattleMechForce(saved);
            for (const unit of units) direct.setC3Network(unit.getUUID(), "A");
            const viaRecords = new BattleMechForce(direct.export()).getBattleValueText();
            expect(fromOld, edition).toBe(viaRecords);
        }
    });

    it("loads an old save whose members carry Nova or Naval gear as that network type (M7)", () => {
        const force = new BattleMechForce();
        const fighter = new AerospaceFighter();
        fighter.addEquipmentFromTag("clan-nova-cews", "nose");
        force.groups[0].fighters.push(fighter);
        const saved = force.export();
        saved.c3Networks = { [fighter.getUUID()]: "N" };
        const loaded = new BattleMechForce(saved);
        expect(loaded.c3Records[0].type).toBe(fighter.getEWarGear().some((gear) => gear.kind === "ecm-nova") ? "nova" : "master-slave");
    });

    it("falls back to the name map when every saved record is unusable (M8)", () => {
        const force = new BattleMechForce();
        const unit = vehicleWith("c3-computer-slave");
        force.groups[0].vehicles.push(unit);
        const saved = force.export();
        saved.c3Networks = { [unit.getUUID()]: "A" };
        saved.c3NetworkRecords = [{ name: "", type: "bogus", members: [] } as never];
        expect(new BattleMechForce(saved).c3Networks).toEqual({ [unit.getUUID()]: "A" });
    });
});

describe("E-War Phase 4: Personal ECM hex-mates on the force board (#642)", () => {
    const carrierMech = () => {
        const mech = buildMech();
        mech.setRulesEdition("total-warfare");
        mech.addEquipmentFromTag("custom-personal-ecm", "is", "un", false, null, "", false, [], undefined, undefined, -1, "", true);
        return mech;
    };
    const rig = () => {
        const force = new BattleMechForce();
        const carrier = carrierMech();
        const mate = buildMech();
        mate.setRulesEdition("total-warfare");
        const other = buildMech();
        force.groups[0].members.push(carrier, mate, other);
        return { force, carrier, mate, other };
    };

    it("covers the named units, saves and loads the entry, and keeps it through Next Turn", () => {
        const { force, carrier, mate, other } = rig();
        force.setPersonalEcmMates(carrier.getUUID(), [mate.getUUID(), carrier.getUUID()]);
        expect(force.ewarBoard.personalEcm).toEqual({ [carrier.getUUID()]: [mate.getUUID()] });
        expect(mate.ewarPlay).toMatchObject({ inFriendlyEcm: true, personalEcmOf: [carrier.getUUID()] });
        expect(other.ewarPlay.personalEcmOf).toBeUndefined();
        const saved = JSON.parse(JSON.stringify(force.export()));
        expect(new BattleMechForce(saved).ewarBoard.personalEcm).toEqual({ [carrier.getUUID()]: [mate.getUUID()] });
        force.endEWarTurn();
        expect(force.ewarBoard.personalEcm).toEqual({ [carrier.getUUID()]: [mate.getUUID()] });
        force.setPersonalEcmMates(carrier.getUUID(), []);
        expect(force.ewarBoard.personalEcm).toBeUndefined();
        expect(mate.ewarPlay.personalEcmOf).toBeUndefined();
    });

    it("drops a mate or a carrier that left the force on export, and a switched-off suite uncovers its mates on refresh", () => {
        const { force, carrier, mate, other } = rig();
        force.setPersonalEcmMates(carrier.getUUID(), [mate.getUUID(), other.getUUID()]);
        force.groups[0].members.pop();
        expect(JSON.parse(JSON.stringify(force.export())).ewarBoard.personalEcm).toEqual({ [carrier.getUUID()]: [mate.getUUID()] });
        const gear = carrier.getEWarGear().find((entry) => entry.kind === "ecm-personal")!;
        setEWarEcmMode(carrier, gear, "off");
        force.refreshEWarBoard();
        expect(mate.ewarPlay.personalEcmOf).toBeUndefined();
        force.groups[0].members.shift();
        expect(JSON.parse(JSON.stringify(force.export())).ewarBoard).toBeUndefined();
    });

    it("reads a bad saved entry as empty", () => {
        const force = new BattleMechForce({ ...JSON.parse(JSON.stringify(new BattleMechForce().export())), ewarBoard: { personalEcm: { a: ["b", 3], c: "no", d: [] } } });
        expect(force.ewarBoard.personalEcm).toEqual({ a: ["b"] });
    });
});

// Stun and rout through Next Turn (#645).
describe("stun timers at the end of the turn (#645)", () => {
    const turnOver = (force: BattleMechForce) => { force.turn++; force.endEWarTurn(); };

    it("a stunned platoon returns in the End Phase of the next turn, through Next Turn", () => {
        const force = new BattleMechForce();
        const platoon = new InfantryPlatoon();
        force.groups[0].infantry.push(platoon);
        force.turn = 3;
        platoon.resolveStun(5, 3, {});
        turnOver(force);
        expect(platoon.getStunnedTroopers()).toBe(5);
        turnOver(force);
        expect(platoon.getStunnedTroopers()).toBe(0);
    });
});

// Maximum Tech (both printings) p.59 (enhanced satellite uplink, command console), p.70 (field and mobile HQ), pp.91-92 (BV):
// the uplink and the HQs bring Initiative and a per-side BV; a side takes only one uplink or HQ, the console's 200 stacks with
// an uplink but not with an HQ (#622).
describe("Satellite uplink and field or mobile HQ: Initiative and side BV (Maximum Tech pp.59, 70, 91-92)", () => {
    const edition = "master-rules-revised";
    const withUplink = (): BattleMech => {
        const unit = new BattleMech();
        unit.addEquipmentFromTag("satellite-uplink", "is", "", false, undefined, "", false, [], undefined, undefined);
        return unit;
    };
    const withConsole = (): BattleMech => {
        const unit = new BattleMech();
        unit.setCommandConsole(true);
        return unit;
    };
    const hq = (tons: number): Vehicle => {
        const vehicle = new Vehicle();
        for (let ton = 0; ton < tons; ton++) vehicle.addEquipmentFromTag("communications-equipment", "body");
        return vehicle;
    };
    const side = (...units: (BattleMech | Vehicle)[]): BattleMechForce => {
        const force = new BattleMechForce();
        force.rulesEdition = edition;
        for (const unit of units) {
            if (unit instanceof BattleMech) force.groups[0].members.push(unit);
            else force.groups[0].vehicles.push(unit);
        }
        return force;
    };

    it("offers the uplink at Level 3 of BMR and BMR(R), apocryphal under Total Warfare", () => {
        const uplink = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment).find((entry) => entry.tag === "satellite-uplink")!;
        for (const book of ["master-rules", "master-rules-revised"]) {
            expect(getEquipmentOfferIssue(uplink, book, 2), book).toBe("level");
            expect(getEquipmentOfferIssue(uplink, book, 3), book).toBeNull();
            expect([uplink.editionStats?.[book]?.book, uplink.editionStats?.[book]?.page, uplink.editionStats?.[book]?.weight], book).toEqual(["MaxTech", 59, 0]);
        }
        expect(getEquipmentOfferIssue(uplink, "total-warfare", 5)).toBeNull();
        expect(getEquipmentOfferIssue(uplink, "total-warfare", 4)).toBe("edition");
    });

    it("reads a vehicle's added communications tons as no HQ below 3, a field HQ at 3 to 6, a mobile HQ at 7 and up (p.70)", () => {
        expect([0, 2, 3, 6, 7, 12].map((tons) => hq(tons).getHeadquartersKind())).toEqual([null, null, "field", "field", "mobile", "mobile"]);
    });

    it("adds one 200 for any number of uplinks, 100 for a field HQ and 200 for a mobile HQ, and the console's 200 only beside an uplink", () => {
        const bonus = (...units: (BattleMech | Vehicle)[]) => side(...units).getSideBonuses(edition).battleValue;
        expect(bonus(new BattleMech())).toBe(0);
        expect(bonus(withUplink())).toBe(200);
        expect(bonus(withUplink(), withUplink())).toBe(200);
        expect(bonus(hq(4))).toBe(100);
        expect(bonus(hq(8))).toBe(200);
        expect(bonus(withConsole())).toBe(200);
        expect(bonus(withConsole(), withUplink())).toBe(400);
        expect(bonus(withConsole(), hq(8))).toBe(200);
        expect(bonus(withConsole(), hq(4))).toBe(200);
        // A side takes only one uplink or HQ (p.91 and p.92); the uplink wins a tie, so the console still stacks with it.
        expect(bonus(withUplink(), hq(8))).toBe(200);
        expect(bonus(withUplink(), hq(8), withConsole())).toBe(400);
        expect(bonus(withUplink(), hq(4))).toBe(200);
    });

    it("names the bonus that won in the log and shows the side BV on the force line", () => {
        const force = side(withConsole(), hq(8));
        expect(force.getSideBonuses(edition).log.join(" ")).toMatch(/mobile HQ/i);
        expect(force.getSideBonuses(edition).log.join(" ")).toMatch(/console.*not cumulative/i);
        const plain = side(withConsole());
        const units = plain.groups[0].members.reduce((sum, unit) => sum + unit.getPilotAdjustedBattleValue(edition), 0);
        plain.groups[0].members.push(withUplink());
        const total = plain.groups[0].members.reduce((sum, unit) => sum + unit.getPilotAdjustedBattleValue(edition), 0);
        expect(units).toBeGreaterThan(0);
        expect(plain.getBattleValueText().replace(/,/g, "")).toContain(String(total + 400));
        expect(side(withUplink()).getSideBonuses("total-warfare").battleValue).toBe(0);
    });

    it("gives Initiative +2 for an uplink that is on, +1 or +2 for an HQ, +2 for a console, as the book stacks them", () => {
        const initiative = (...units: (BattleMech | Vehicle)[]) => side(...units).getSideBonuses(edition).initiative;
        expect(initiative(new BattleMech())).toBe(0);
        expect(initiative(withUplink())).toBe(2);
        expect(initiative(withUplink(), withUplink())).toBe(2);
        const off = withUplink();
        off.satelliteUplinkOff = true;
        expect(initiative(off)).toBe(0);
        expect(initiative(hq(4))).toBe(1);
        expect(initiative(hq(8))).toBe(2);
        expect(initiative(withConsole())).toBe(2);
        expect(initiative(withConsole(), withUplink())).toBe(4);
        expect(initiative(withConsole(), hq(8))).toBe(2);
        expect(initiative(withConsole(), hq(4))).toBe(2);
        expect(initiative(withUplink(), hq(8))).toBe(2);
    });

    it("costs the unit +1 on its attacks and Piloting Skill Rolls and keeps it out of C3 and spotting while the uplink is on, none of it once off or beside a console", () => {
        const unit = withUplink();
        expect([unit.hasSatelliteUplink(), unit.isSatelliteUplinkActive()]).toEqual([true, true]);
        expect(unit.getSatelliteUplinkToHitModifier()).toBe(1);
        const piloting = new BattleMech().getPilotingSkillModifier();
        expect(unit.getPilotingSkillModifier()).toBe(piloting + 1);
        expect(unit.canSpotOrJoinC3()).toBe(false);
        unit.satelliteUplinkOff = true;
        expect([unit.isSatelliteUplinkActive(), unit.getSatelliteUplinkToHitModifier(), unit.getPilotingSkillModifier(), unit.canSpotOrJoinC3()]).toEqual([false, 0, piloting, true]);
        const commanded = withUplink();
        commanded.setCommandConsole(true);
        expect([commanded.getSatelliteUplinkToHitModifier(), commanded.canSpotOrJoinC3()]).toEqual([0, true]);
    });

    it("saves and loads the switch", () => {
        const unit = withUplink();
        unit.satelliteUplinkOff = true;
        expect(new BattleMech(unit.exportJSON()).satelliteUplinkOff).toBe(true);
    });

    // Maximum Tech p.59: "Many 'Mechs and vehicles" carry the uplink, and "a unit with this system" gives its side the bonus; the
    // record offers it to vehicles too, so a vehicle's uplink counts for the side as a 'Mech's does (Opus review).
    it("counts an uplink carried by a vehicle, once per side, for Initiative and BV", () => {
        const vehicle = new Vehicle();
        vehicle.addEquipmentFromTag("satellite-uplink", "body");
        expect(vehicle.hasSatelliteUplink()).toBe(true);
        expect(side(vehicle).getSideBonuses(edition)).toMatchObject({ initiative: 2, battleValue: 200 });
        expect(side(vehicle, withUplink()).getSideBonuses(edition)).toMatchObject({ initiative: 2, battleValue: 200 });
        expect(side(vehicle, withConsole()).getSideBonuses(edition)).toMatchObject({ initiative: 4, battleValue: 400 });
    });
});

// Satellite uplink and field or mobile HQ side Initiative (#622, Maximum Tech pp.59, 70, 91-92).
describe("Side Initiative from uplinks and HQs (#622)", () => {
    const uplinkMech = () => {
        const mech = new BattleMech();
        mech.addEquipmentFromTag("satellite-uplink", "is", "ct", false, undefined, "", false, [], undefined, undefined);
        return mech;
    };
    const hqVehicle = (tons: number) => {
        const tank = new Vehicle();
        for (let i = 0; i < tons; i++) tank.addEquipmentFromTag("communications-equipment", "body");
        return tank;
    };

    it("names the source unit and page on the Initiative line", () => {
        const force = new BattleMechForce();
        const mech = uplinkMech();
        force.groups[0].members.push(mech);
        const bonuses = force.getSideBonuses();
        expect(bonuses.initiative).toBe(2);
        expect(bonuses.initiativeLog.join(" ")).toContain("Maximum Tech p.59");
        expect(bonuses.initiativeLog.join(" ")).toContain(mech.getName());
    });

    it("drops the Initiative when the uplink unit is destroyed, keeping its BV", () => {
        const force = new BattleMechForce();
        const mech = uplinkMech();
        force.groups[0].members.push(mech);
        expect(force.getSideBonuses().initiative).toBe(2);
        const bv = force.getSideBonuses().battleValue;
        mech.pilot.wounds = 6;
        expect(mech.isDestroyed()).toBe(true);
        expect(force.getSideBonuses().initiative).toBe(0);
        expect(force.getSideBonuses().battleValue).toBe(bv);
    });

    it("drops the uplink Initiative while the unit has it switched off", () => {
        const force = new BattleMechForce();
        const mech = uplinkMech();
        force.groups[0].members.push(mech);
        mech.satelliteUplinkOff = true;
        expect(force.getSideBonuses().initiative).toBe(0);
    });

    it("a vehicle uplink has its own switch, penalties and spotting limits", () => {
        const force = new BattleMechForce();
        const tank = new Vehicle();
        tank.addEquipmentFromTag("satellite-uplink", "body");
        tank.addEquipmentFromTag("medium-laser", "front");
        force.groups[0].vehicles.push(tank);
        const laser = tank.getEquipmentList().find((item) => item.tag === "medium-laser")!;
        tank.setSatelliteUplinkOn(false);
        const plain = tank.getDrivingModifier();
        tank.setSatelliteUplinkOn(true);
        expect(tank.isSatelliteUplinkActive()).toBe(true);
        expect(force.getSideBonuses().initiative).toBe(2);
        const withUplink = tank.getWeaponToHitModifier(laser)!;
        expect(tank.getDrivingModifier()).toBe(plain + 1);
        expect(tank.canSpotOrJoinC3()).toBe(false);
        tank.setSatelliteUplinkOn(false);
        expect(tank.getWeaponToHitModifier(laser)).toBe(withUplink - 1);
        expect(tank.getDrivingModifier()).toBe(plain);
        expect(tank.canSpotOrJoinC3()).toBe(true);
        expect(force.getSideBonuses().initiative).toBe(0);
        // The switch saves.
        const saved = new Vehicle(tank.exportJSON());
        expect(saved.isSatelliteUplinkActive()).toBe(false);
    });

    it("a field HQ is +1 and a mobile HQ +2; Crew Killed ends it", () => {
        const force = new BattleMechForce();
        const field = hqVehicle(3);
        force.groups[0].vehicles.push(field);
        expect(force.getSideBonuses().initiative).toBe(1);
        expect(force.getSideBonuses().initiativeLog.join(" ")).toContain("Maximum Tech p.70");
        force.groups[0].vehicles.push(hqVehicle(7));
        expect(force.getSideBonuses().initiative).toBe(2);
        force.groups[0].vehicles.pop();
        field.applyCriticalHit("crewKilled", "front");
        expect(field.isHeadquartersActive()).toBe(false);
        expect(force.getSideBonuses().initiative).toBe(0);
    });

    it("Maximum Tech p.70: the HQ bonus ends when the commander is killed (Crew Killed), not on a Commander Hit alone", () => {
        const force = new BattleMechForce();
        const hq = hqVehicle(3);
        force.groups[0].vehicles.push(hq);
        hq.applyCriticalHit("commanderHit", "front");
        expect(hq.isHeadquartersActive()).toBe(true);
        expect(force.getSideBonuses().initiative).toBe(1);
        hq.applyCriticalHit("crewKilled", "front");
        expect(hq.isHeadquartersActive()).toBe(false);
        expect(force.getSideBonuses().initiative).toBe(0);
    });

    it("a stabilizer hit keeps the HQ bonus only if the vehicle was stationary the turn before", () => {
        const force = new BattleMechForce();
        const hq = hqVehicle(7);
        force.groups[0].vehicles.push(hq);
        hq.setStabilizerHit("front", true);
        hq.setMovement("cruise", 4);
        hq.turnReset();
        expect(hq.isHeadquartersActive()).toBe(false);
        expect(force.getSideBonuses().initiative).toBe(0);
        hq.turnReset();
        expect(hq.isHeadquartersActive()).toBe(true);
        expect(force.getSideBonuses().initiative).toBe(2);
        // Without a stabilizer hit movement does not matter.
        hq.setStabilizerHit("front", false);
        hq.setMovement("flank", 6);
        hq.turnReset();
        expect(hq.isHeadquartersActive()).toBe(true);
    });
});
