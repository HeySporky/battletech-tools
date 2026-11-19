import { describe, expect, it } from "vitest";
import AerospaceFighter from "./aerospace-fighter";
import BattledroidsUnit from "./battledroids-unit";
import { BattleMech } from "./battlemech";
import { BattleMechForce } from "./battlemech-force";
import { BattleMechGroup } from "./battlemech-group";
import { getSpeedFactor } from "../data/battle-value";
import Vehicle from "./vehicle";

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
