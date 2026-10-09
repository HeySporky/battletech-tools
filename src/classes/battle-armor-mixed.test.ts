import { describe, expect, it } from "vitest";
import BattleArmor from "./battle-armor";
import { importBattleArmorBlk } from "./battle-armor-blk";
import { getBattleArmorCarrierLoad, isCarrierWeaponBlocked } from "./battle-armor-transport";
import { battleArmorMineTypes, findBattleArmorEquipment } from "../data/battle-armor-equipment";

const CARRIER = "11111111-aaaa";

// A Kage-like light suit: jump jets, basic stealth armor, armored gloves.
const kage = (troopers: number = 4): BattleArmor => {
    const suit = new BattleArmor();
    suit.setWeightClass("light");
    suit.setGroundMP(1);
    suit.setMotive("jump", 3);
    suit.setManipulator("la", "armored-glove");
    suit.setManipulator("ra", "armored-glove");
    suit.setArmor("ba-stealth-basic");
    suit.setArmorPoints(5);
    suit.setSquadSize(troopers);
    return suit;
};

const rider = (troopers: number, techBase: "is" | "clan" = "clan"): BattleArmor => {
    const suit = new BattleArmor();
    suit.setTechBase(techBase);
    suit.setWeightClass("medium");
    suit.setManipulator("la", "battle-claw");
    suit.setArmorPoints(5);
    suit.setSquadSize(troopers);
    suit.setRiding(CARRIER, "mech");
    return suit;
};

describe("Mixed-technology battle armor (TO:AUE p.189)", () => {
    it("takes equipment of either technology base only as a mixed-technology suit", () => {
        const suit = new BattleArmor();
        expect(suit.addItem("clan-er-small-laser", "ra")).toBe(false);
        suit.setMixedTech(true);
        expect(suit.addItem("clan-er-small-laser", "ra")).toBe(true);
        expect(suit.addItem("is-small-laser", "la")).toBe(true);
        expect(suit.getTechName()).toBe("Mixed (Inner Sphere chassis)");
        expect(suit.getAvailableEquipment().some((item) => item.techBase === "clan")).toBe(true);
        expect(suit.getAvailableEquipment().some((item) => item.techBase === "is")).toBe(true);
        // Each item keeps its own table's figures, and is labelled with its technology base.
        expect(suit.getItems().map((entry) => findBattleArmorEquipment(entry.tag)?.damage)).toEqual(["5", "3"]);
        expect(suit.getItemLabel(suit.getItems()[0])).toBe("Clan ER Small Laser, Right Arm");
        expect(suit.getItemLabel(suit.getItems()[1])).toBe("IS Small Laser, Left Arm");
        expect(suit.getIssues()).toEqual([]);
    });

    it("is an advanced construction option, in the eras from the Clan Invasion on", () => {
        const suit = new BattleArmor();
        expect(suit.getRequiredRulesLevel()).toBe(2);
        suit.setEra("late-sw-rn");
        suit.setMixedTech(true);
        expect(suit.getRequiredRulesLevel()).toBe(3);
        expect(suit.getAvailableEras().map((era) => era.tag)).not.toContain("late-sw-rn");
        expect(suit.getAvailableEras()[0].tag).toBe("clan-inv");
        expect(suit.getAvailableEras().map((era) => era.tag)).toContain(suit.getEra().tag);
        expect(suit.getNotes().join(" ")).toContain("TO:AUE p.189");
    });

    it("takes its armor from either base, at that base's weight", () => {
        const suit = new BattleArmor();
        suit.setArmorPoints(6);
        expect(suit.getArmorWeight()).toBe(300);
        suit.setMixedTech(true);
        expect(suit.getArmorChoices().filter((choice) => choice.armor.tag === "ba-standard").map((choice) => [choice.techBase, choice.kgPerPoint])).toEqual([["is", 50], ["clan", 25]]);
        // Fire Resistant armor is Clan-made, Mimetic armor Inner Sphere-made: a mixed suit may have either.
        expect(suit.getArmorChoices().some((choice) => choice.armor.tag === "ba-fire-resistant" && choice.techBase === "clan")).toBe(true);
        expect(suit.getArmorChoices().some((choice) => choice.armor.tag === "ba-mimetic" && choice.techBase === "is")).toBe(true);
        expect(suit.setArmor("ba-standard", "clan")).toBe(true);
        expect([suit.getArmorTechBase(), suit.getArmorWeight()]).toEqual(["clan", 150]);
        expect(suit.setArmor("ba-fire-resistant")).toBe(true);
        expect([suit.getArmorTechBase(), suit.getArmorKgPerPoint()]).toEqual(["clan", 30]);
        expect(suit.setArmor("ba-mimetic", "clan")).toBe(false);
    });

    it("saves and loads, and a suit saved before mixed technology still loads as it was", () => {
        const suit = new BattleArmor();
        suit.setMixedTech(true);
        suit.setArmor("ba-standard", "clan");
        suit.setArmorPoints(4);
        suit.addItem("clan-er-small-laser", "ra");
        const saved = suit.export();
        expect([saved.mixedTech, saved.armorTechBase]).toEqual([true, "clan"]);
        const loaded = new BattleArmor(suit.exportJSON());
        expect(loaded.getImportIssues()).toEqual([]);
        expect([loaded.isMixedTech(), loaded.getArmorTechBase(), loaded.getWeight(), loaded.getBattleValue()]).toEqual([true, "clan", suit.getWeight(), suit.getBattleValue()]);

        const plain = new BattleArmor();
        plain.addItem("is-small-laser", "ra");
        const old = plain.export() as unknown as Record<string, unknown>;
        expect("mixedTech" in old).toBe(false);
        expect("armorTechBase" in old).toBe(false);
        // The other base's equipment in a suit that is not mixed is refused on loading.
        const tampered = new BattleArmor(JSON.stringify({ ...old, items: [{ tag: "clan-er-small-laser", location: "ra" }] }));
        expect(tampered.getItems()).toEqual([]);
        expect(tampered.getImportIssues().join(" ")).toContain("cannot be mounted");
    });

    it("goes back to its chassis' technology base when it stops being mixed", () => {
        const suit = new BattleArmor();
        suit.setMixedTech(true);
        suit.setArmor("ba-standard", "clan");
        suit.addItem("clan-er-small-laser", "ra");
        suit.addItem("clan-micro-pulse-laser", "la");
        suit.setMixedTech(false);
        // The ER small laser has an Inner Sphere version; the micro pulse laser has none and is dropped.
        expect(suit.getItems().map((entry) => entry.tag)).toEqual(["is-er-small-laser"]);
        expect(suit.getArmorTechBase()).toBe("is");
        expect(suit.getTechName()).toBe("Inner Sphere");
    });

    it("is read from a MegaMek file with each item's own technology base", () => {
        const text = `<UnitType>\nBattleArmor\n</UnitType>\n<Name>\nTest Longinus C\n</Name>\n<Model>\n(Sqd4)\n</Model>\n<year>\n3144\n</year>\n<type>\nMixed (IS Chassis)\n</type>\n`
            + `<motion_type>\nJump\n</motion_type>\n<cruiseMP>\n1\n</cruiseMP>\n<armor_type>\n28\n</armor_type>\n<armor_tech>\n2\n</armor_tech>\n`
            + `<Squad Equipment>\nCLBAMedium Recoilless Rifle:RA\nBABattleClaw:LA\nISBASmallLaser:LA\n</Squad Equipment>\n`
            + `<Trooper 1 Equipment>\n</Trooper 1 Equipment>\n<chassis>\nbiped\n</chassis>\n<jumpingMP>\n3\n</jumpingMP>\n<armor>\n7\n</armor>\n<Trooper Count>\n4\n</Trooper Count>\n<weightclass>\n2\n</weightclass>\n`;
        const { suit, issues } = importBattleArmorBlk(text);
        expect(issues).toEqual([]);
        expect(suit).not.toBeNull();
        if (!suit) return;
        expect([suit.getTechBase(), suit.isMixedTech()]).toEqual(["is", true]);
        // "CLBA..." names both tables use are read on the chassis' base; the armor technology level 2 is Clan.
        expect(suit.getItems().map((entry) => entry.tag)).toEqual(["is-medium-recoilless-rifle", "is-small-laser"]);
        expect([suit.getArmorTechBase(), suit.getArmorWeight()]).toEqual(["clan", 175]);
        // The same file marked as a plain Inner Sphere suit keeps Inner Sphere armor.
        const plain = importBattleArmorBlk(text.replace("Mixed (IS Chassis)", "IS Level 2")).suit;
        expect([plain?.isMixedTech(), plain?.getArmorWeight()]).toEqual([false, 350]);
    });
});

describe("Equipment carried by one trooper of a squad", () => {
    it("is on that trooper's suit only: the heaviest suit is weighed and each suit is checked", () => {
        const suit = kage();
        const before = suit.getWeight();
        suit.addItem("is-ecm-suite", "body");
        const every = suit.getWeight();
        suit.updateItem(0, { trooper: 1 });
        expect(suit.hasTrooperEquipment()).toBe(true);
        expect(suit.getWeight()).toBe(every);
        expect(suit.getTrooperWeight(1)).toBe(every);
        expect(suit.getTrooperWeight(2)).toBe(before);
        expect(suit.getItemLabel(suit.getItems()[0])).toBe("ECM Suite (trooper 1 only), Body");
        expect(suit.getNotes().join(" ")).toContain("one trooper only");

        // Two troopers with improved sensors each do not add up; two sets on trooper 1 do.
        const slots = suit.getUsedSlots("body");
        suit.addItem("is-improved-sensors", "body");
        suit.addItem("is-improved-sensors", "body");
        suit.updateItem(1, { trooper: 1 });
        suit.updateItem(2, { trooper: 2 });
        expect(suit.getUsedSlots("body")).toBe(slots + 1);
        expect(suit.getIssues().filter((issue) => issue.includes("may mount only"))).toEqual([]);
        suit.updateItem(2, { trooper: 1 });
        expect(suit.getIssues().some((issue) => issue.startsWith("Trooper 1: A suit may mount only 1 Improved Sensors"))).toBe(true);
    });

    it("values the squad at the average of its troopers' suits", () => {
        const plain = kage();
        const all = kage();
        all.addItem("is-ecm-suite", "body");
        const one = kage();
        one.addItem("is-ecm-suite", "body");
        one.updateItem(0, { trooper: 1 });
        expect(one.getBattleValue()).toBeGreaterThan(plain.getBattleValue());
        expect(one.getBattleValue()).toBeLessThan(all.getBattleValue());
        expect(one.getBattleValueLog().join("\n")).toContain("Average of the 4 troopers' suits");
        expect(one.getBattleValueLog()).toContain("Trooper 1:");
        expect(one.getBattleValueLog()).toContain("The other 3 troopers:");
        // One ECM suite is bought, not four.
        expect(all.getCBillCost() - plain.getCBillCost()).toBe(4 * (one.getCBillCost() - plain.getCBillCost()));
    });

    it("is never the squad support weapon, and names a trooper the squad has", () => {
        const suit = kage();
        suit.addItem("is-small-laser", "ra");
        suit.updateItem(0, { trooper: 2 });
        suit.updateItem(0, { squadSupport: true });
        expect(suit.getItems()[0].trooper).toBeUndefined();
        suit.updateItem(0, { squadSupport: false, trooper: 6 });
        expect(suit.getIssues()).toContain("Small Laser is carried by trooper 6, but the squad has 4 troopers.");
        suit.updateItem(0, { trooper: 9 });
        expect(suit.getItems()[0].trooper).toBeUndefined();
    });

    it("is saved with the suit, lost with its trooper, and counted once in the Alpha Strike damage", () => {
        const suit = kage();
        suit.addItem("is-small-laser", "ra");
        const squadDamage = suit.getAlphaStrikeStats().calcLog.join("\n");
        suit.updateItem(0, { trooper: 2 });
        const loaded = new BattleArmor(suit.exportJSON());
        expect(loaded.getItems()).toEqual([{ tag: "is-small-laser", location: "ra", trooper: 2 }]);
        expect(loaded.getAlphaStrikeStats().calcLog.join("\n")).not.toBe(squadDamage);
        expect(loaded.getAlphaStrikeStats().calcLog.join("\n")).toContain("weapons the squad has only one of");
        expect(loaded.isItemLost(loaded.getItems()[0])).toBe(false);
        loaded.setTrooperDamage(1, loaded.getTrooperCapacity());
        expect(loaded.isItemLost(loaded.getItems()[0])).toBe(true);
    });

    it("is read from a MegaMek file: what every trooper lists is the squad's, the rest that trooper's", () => {
        const block = (trooper: number, lines: string): string => `<Trooper ${trooper} Equipment>\n${lines}</Trooper ${trooper} Equipment>\n`;
        const text = `<UnitType>\nBattleArmor\n</UnitType>\n<Name>\nTest Kage\n</Name>\n<Model>\n[ECM](Sqd4)\n</Model>\n<year>\n3058\n</year>\n<type>\nIS Level 3\n</type>\n`
            + `<motion_type>\nJump\n</motion_type>\n<cruiseMP>\n1\n</cruiseMP>\n<armor_type>\n31\n</armor_type>\n<Squad Equipment>\nBAArmoredGlove:LA\nBAArmoredGlove:RA\n</Squad Equipment>\n`
            + block(1, "IS BA ECM:Body\nISBAMineDispenser:Body\n") + block(2, "ISBAMineDispenser:Body\n") + block(3, "ISBAMineDispenser:Body\n") + block(4, "ISBAMineDispenser:Body\n")
            + `<chassis>\nbiped\n</chassis>\n<jumpingMP>\n3\n</jumpingMP>\n<armor>\n5\n</armor>\n<Trooper Count>\n4\n</Trooper Count>\n<weightclass>\n1\n</weightclass>\n`;
        const { suit, issues } = importBattleArmorBlk(text);
        expect(issues).toEqual([]);
        expect(suit?.getItems()).toEqual([{ tag: "is-mine-dispenser", location: "body" }, { tag: "is-ecm-suite", location: "body", trooper: 1 }]);
    });
});

describe("Battle armor mine dispenser (TO:AUE pp.137, 195, 197)", () => {
    it("is worth a 10-point minefield of the mines it carries", () => {
        // Minefield BV Table, BV per 5 points: Standard 4, Active and Command-Detonated 6, Inferno and Vibrabomb 5; EMP 45 a hex.
        expect(battleArmorMineTypes.map((mine) => [mine.tag, mine.bv])).toEqual([
            ["standard", 8], ["active", 12], ["command-detonated", 12], ["emp", 45], ["inferno", 10], ["vibrabomb", 10],
        ]);
        const suit = kage();
        const without = suit.getBattleValueLog().join("\n");
        suit.addItem("is-mine-dispenser", "body");
        expect(suit.getBattleValueLog().join("\n")).toContain("+ 8 (other)");
        expect(without).toContain("+ 0 (other)");
        suit.updateItem(0, { mine: "emp" });
        expect(suit.getBattleValueLog().join("\n")).toContain("+ 45 (other)");
        expect(suit.getItemLabel(suit.getItems()[0])).toBe("Mine Dispenser (EMP mines), Body");
        // Standard mines are the default and are not written to the save; an unknown kind falls back to them.
        suit.updateItem(0, { mine: "standard" });
        expect(suit.getItems()[0].mine).toBeUndefined();
        suit.updateItem(0, { mine: "confetti" });
        expect(suit.getItems()[0].mine).toBeUndefined();
        suit.updateItem(0, { mine: "vibrabomb" });
        expect(new BattleArmor(suit.exportJSON()).getItems()[0].mine).toBe("vibrabomb");
    });

    it("lets each trooper carry a different kind of mine", () => {
        const suit = kage();
        suit.addItem("is-mine-dispenser", "body");
        suit.addItem("is-mine-dispenser", "body");
        suit.updateItem(0, { trooper: 1, mine: "inferno" });
        suit.updateItem(1, { trooper: 2, mine: "active" });
        expect(suit.getIssues()).toEqual([]);
        // One dispenser to a suit in the Alpha Strike conversion (ASC p.127).
        expect(suit.getAlphaStrikeStats().specialAbilities).toContain("MDS1");
    });
});

describe("The carrier of mechanized battle armor (Total Warfare pp.226-227)", () => {
    const mech = { uuid: CARRIER, name: "Timber Wolf", kind: "mech" as const, omni: true };
    const tank = { uuid: CARRIER, name: "Badger", kind: "vehicle" as const, omni: null };

    it("may not fire torso weapons from a location a trooper occupies", () => {
        // Four troopers hold the side torsos, front and rear; the fifth the rear center torso.
        const four = getBattleArmorCarrierLoad([rider(4)], mech);
        expect(four.blockedLocations.sort()).toEqual(["lt", "rt"]);
        expect(isCarrierWeaponBlocked(four, { location: "rt" })).toBe(true);
        expect(isCarrierWeaponBlocked(four, { location: "ct" })).toBe(false);
        expect(isCarrierWeaponBlocked(four, { location: "ra" })).toBe(false);
        // A weapon that occupies several locations is blocked if any of them is occupied.
        expect(isCarrierWeaponBlocked(four, { location: "ra", split_location: [{ loc: "rt" }] })).toBe(true);
        expect(getBattleArmorCarrierLoad([rider(5)], mech).blockedLocations.sort()).toEqual(["ct", "lt", "rt"]);
        expect(four.noAmmoDump).toBe(true);
        expect([four.walkingPenalty, four.noJump, four.issues.length]).toEqual([0, false, 0]);
    });

    it("gets a location back when the troopers on it are destroyed", () => {
        const squad = rider(4);
        squad.setTrooperDamage(0, squad.getTrooperCapacity());
        expect(getBattleArmorCarrierLoad([squad], mech).blockedLocations.sort()).toEqual(["lt", "rt"]);
        // Troopers 1 and 3 ride the right torso, front and rear.
        squad.setTrooperDamage(2, squad.getTrooperCapacity());
        expect(getBattleArmorCarrierLoad([squad], mech).blockedLocations).toEqual(["lt"]);
        for (const trooper of [1, 3]) squad.setTrooperDamage(trooper, squad.getTrooperCapacity());
        expect(getBattleArmorCarrierLoad([squad], mech).riders).toEqual([]);
    });

    it("keeps a vehicle's turret free, and its VTOL, WiGE and Jumping MP unspent", () => {
        const squad = rider(4);
        squad.setRiding(CARRIER, "vehicle");
        const load = getBattleArmorCarrierLoad([squad], tank);
        expect(isCarrierWeaponBlocked(load, { location: "left" })).toBe(true);
        expect(isCarrierWeaponBlocked(load, { location: "right" })).toBe(true);
        expect(isCarrierWeaponBlocked(load, { location: "rear" })).toBe(false);
        expect(isCarrierWeaponBlocked(load, { location: "turret" })).toBe(false);
        expect(isCarrierWeaponBlocked(load, { location: "front" })).toBe(false);
        expect([load.noJump, load.noAmmoDump]).toEqual([true, false]);
        const five = rider(5);
        five.setRiding(CARRIER, "vehicle");
        const full = getBattleArmorCarrierLoad([five], tank);
        expect(isCarrierWeaponBlocked(full, { location: "rear" })).toBe(true);
        expect(full.noAmmoDump).toBe(true);
    });

    it("carries one unit at a time, loses 1 MP if it is not an Omni, and needs magnetic clamps on the squad", () => {
        const standard = { ...mech, name: "Atlas", omni: false };
        const squad = rider(4, "is");
        const load = getBattleArmorCarrierLoad([squad, rider(5)], standard);
        expect(load.walkingPenalty).toBe(1);
        expect(load.issues.some((issue) => issue.includes("one at a time"))).toBe(true);
        expect(load.issues.some((issue) => issue.includes("no magnetic clamps"))).toBe(true);
        squad.addItem("is-magnetic-clamps", "body");
        expect(getBattleArmorCarrierLoad([squad], standard).issues).toEqual([]);
        // A unit nobody rides is not affected, and neither is one whose riders are on another unit.
        expect(getBattleArmorCarrierLoad([squad], { ...mech, uuid: "22222222-bbbb" }).blockedLocations).toEqual([]);
    });
});

describe("Battle armor rulings (user, 2026-10-08)", () => {
    it("counts only arm-mounted direct-fire weapons again for Anti-'Mech attacks (TM p.310, TW p.220)", () => {
        const suit = new BattleArmor();
        suit.setManipulator("la", "battle-claw");
        suit.addItem("is-small-laser", "ra");
        const arm = suit.getBattleValueLog().join("\n");
        expect(arm).toContain("9 (direct fire)");
        expect(arm).toContain("+ 9 (Anti-'Mech attacks)");
        suit.updateItem(0, { location: "body" });
        const body = suit.getBattleValueLog().join("\n");
        expect(body).toContain("9 (direct fire)");
        expect(body).toContain("+ 0 (Anti-'Mech attacks)");
    });

    it("offers mortars to Clan suits with the Inner Sphere table's figures, from about 3065 (IO:AE p.47)", () => {
        const clan = findBattleArmorEquipment("clan-light-mortar");
        const sphere = findBattleArmorEquipment("is-light-mortar");
        expect([clan?.kg, clan?.slots, clan?.bv, clan?.range, clan?.damage]).toEqual([sphere?.kg, sphere?.slots, sphere?.bv, sphere?.range, sphere?.damage]);
        expect(clan?.dates?.introduced).toBe(3065);
        expect(clan?.notes).toContain("Not on the Clan Battle Armor Equipment Table");
        const suit = new BattleArmor();
        suit.setTechBase("clan");
        expect(suit.addItem("clan-heavy-mortar", "ra")).toBe(true);
        expect(suit.getIssues()).toEqual([]);
        // Battle armor mortars are not Indirect Fire weapons in Alpha Strike (ASC errata v1.2, p.112).
        expect(suit.getAlphaStrikeStats().specialAbilities.some((code) => code.startsWith("IF"))).toBe(false);
    });

    it("allows the published Undine its extra body slot, as a note", () => {
        const undine = (name: string): BattleArmor => {
            const suit = new BattleArmor();
            suit.setName(name);
            suit.setTechBase("clan");
            suit.setWeightClass("medium");
            suit.setMotive("umu", 3);
            suit.setManipulator("ra", "battle-claw");
            suit.addItem("clan-er-micro-laser", "ra");
            suit.addItem("clan-lrm-5", "body");
            suit.updateItem(1, { oneShot: true });
            suit.addItem("clan-searchlight", "body");
            return suit;
        };
        const other = undine("Homebrew Diver");
        expect(other.getIssues()).toContain("Body: 5 slots used of 4 (TM p.163).");
        expect(other.getAllowedExceptions()).toEqual([]);
        const published = undine("Undine Battle Armor (Sqd5)");
        expect(published.getIssues()).toEqual([]);
        expect(published.getNotes().join(" ")).toContain("allowed as published");
        // The exception is for that one thing: a second slot over is an error again.
        published.addItem("clan-searchlight", "body");
        expect(published.getIssues().some((issue) => issue.startsWith("Body: 6 slots used of 4"))).toBe(true);
    });

    it("adds 5% of the Point Value subtotal for C3 and rates tube artillery at 6 (ASC pp.139-141; errata v1.2)", () => {
        const suit = new BattleArmor();
        suit.setWeightClass("heavy");
        suit.setArmorPoints(8);
        suit.addItem("is-c3-system", "body");
        const c3 = suit.getAlphaStrikeStats().calcLog.join("\n");
        expect(c3).toContain("C3: + ");
        expect(c3).not.toContain("(C3)");
        const gunner = new BattleArmor();
        gunner.setWeightClass("assault");
        gunner.addItem("is-tube-artillery", "body");
        expect(gunner.getAlphaStrikeStats().calcLog.join("\n")).toContain("6 (ARTBA, 1 damage x 6)");
    });
});
