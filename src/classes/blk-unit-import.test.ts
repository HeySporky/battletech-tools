import { describe, expect, it } from "vitest";
import { getBlkUnitKind, importBlkUnit } from "./blk-unit-import";
import Vehicle from "./vehicle";
import AerospaceFighter from "./aerospace-fighter";
import InfantryPlatoon from "./infantry-platoon";

const block = (tag: string, ...lines: string[]): string[] => [`<${tag}>`, ...lines, `</${tag}>`];
const tank = [
    ...block("UnitType", "Tank"), ...block("Name", "Test Tank"), ...block("Model", "TT-1"), ...block("year", "3025"), ...block("type", "IS Level 1"),
    ...block("motion_type", "Tracked"), ...block("cruiseMP", "4"), ...block("engine_type", "0"), ...block("armor_type", "0"),
    ...block("armor", "10", "8", "8", "6"), ...block("Front Equipment", "Medium Laser"), ...block("tonnage", "30.0"),
].join("\n");

describe("the one MegaMek unit file reader", () => {
    it("picks the reader by the file's UnitType", () => {
        expect(getBlkUnitKind(tank)).toBe("vehicles");
        expect(getBlkUnitKind(tank.replace(">\nTank\n<", ">\nSupportTank\n<"))).toBe("support-vehicles");
        expect(getBlkUnitKind(tank.replace(">\nTank\n<", ">\nBattleArmor\n<"))).toBe("battle-armor");
        expect(getBlkUnitKind(tank.replace(">\nTank\n<", ">\nDropship\n<"))).toBe("small-craft");
        expect(getBlkUnitKind(tank.replace(">\nTank\n<", ">\nProtoMek\n<"))).toBe("protomechs");
        expect(getBlkUnitKind(tank.replace(">\nTank\n<", ">\nFixedWingSupport\n<"))).toBe("fixed-wing-support");
        expect(getBlkUnitKind("hello")).toBeNull();
    });

    it("reads a file of a kind the page builds", () => {
        const result = importBlkUnit(tank, ["vehicles", "support-vehicles"]);
        expect(result.kind).toBe("vehicles");
        expect(result.unit).toBeInstanceOf(Vehicle);
        expect(result.issues).toEqual([]);
    });

    it("refuses a file of another kind, naming what it holds, and a type this app does not read", () => {
        expect(importBlkUnit(tank, ["battle-armor"])).toEqual({ kind: "vehicles", unit: null, notes: [],
            issues: ["This file holds a Combat Vehicle, not battle armor: load it in that unit's creator."] });
        expect(importBlkUnit(tank.replace(">\nTank\n<", ">\nWarship\n<")).issues).toEqual(["This file holds a Warship, which this app does not read yet."]);
        expect(importBlkUnit("hello").issues).toEqual(["This is not a MegaMek unit file."]);
    });
});

// A MegaMek fighter file as its writer saves one (BLKAeroSpaceFighterFile): armor nose, right wing, left wing, aft.
const fighterFile = (overrides: Record<string, string[]> = {}): string => {
    const blocks: Record<string, string[]> = {
        "UnitType": ["AeroSpaceFighter"], "Name": ["Test Hawk"], "Model": ["TH-2"], "year": ["3058"], "type": ["Clan Level 2"],
        "motion_type": ["Aerodyne"], "SafeThrust": ["6"], "cockpit_type": ["0"], "heatsinks": ["14"], "sink_type": ["1"], "fuel": ["400"],
        "engine_type": ["2"], "armor_type": ["19"], "armor_tech_rating": ["5"], "armor_tech_level": ["2"], "armor": ["40", "30", "32", "24"],
        "Nose Equipment": ["CLLRM10", "CLArtemisIV", "CLERMediumLaser"], "Left Wing Equipment": ["CLERMediumLaser"], "Right Wing Equipment": ["CLERMediumLaser"],
        "Aft Equipment": ["CLERSmallLaser"], "Wings Equipment": [], "Fuselage Equipment": ["Clan Ammo LRM-10 (Clan) Artemis-capable", "CLCASE"],
        "tonnage": ["40.0"], ...overrides,
    };
    return Object.entries(blocks).flatMap(([tag, lines]) => block(tag, ...lines)).join("\n");
};

describe("MegaMek fighter files (#600 round 4b)", () => {
    it("reads aerospace and conventional fighters as fighters", () => {
        expect(getBlkUnitKind(fighterFile())).toBe("fighters");
        expect(getBlkUnitKind(fighterFile({ UnitType: ["ConvFighter"] }))).toBe("fighters");
        expect(importBlkUnit(fighterFile(), ["fixed-wing-support"]).issues[0]).toMatch(/holds a fighter/);
    });

    it("carries a Clan fighter over whole: engine, thrust, heat sinks, fuel, armor by arc, fire control and ammunition", () => {
        const { unit, issues, kind } = importBlkUnit(fighterFile(), ["fighters"]);
        expect(issues).toEqual([]);
        expect(kind).toBe("fighters");
        const fighter = unit as AerospaceFighter;
        expect(fighter).toBeInstanceOf(AerospaceFighter);
        expect(fighter.getName()).toBe("Test Hawk");
        expect(fighter.getModel()).toBe("TH-2");
        expect(fighter.getTech().tag).toBe("clan");
        expect(fighter.getTonnage()).toBe(40);
        expect(fighter.getEngineType().tag).toBe("clan_xl");
        expect(fighter.getSafeThrust()).toBe(6);
        expect(fighter.getHeatSinkType().tag).toBe("double");
        expect(fighter.getTotalHeatSinks()).toBe(14);
        expect(fighter.getFuelPoints()).toBe(400);
        expect(fighter.getArmorType().tag).toBe("clan-ferro-aluminum");
        // The file lists the right wing before the left.
        expect(fighter.getArmorAllocation()).toEqual({ nose: 40, rightWing: 30, leftWing: 32, aft: 24 });
        const tags = fighter.getEquipmentList().map((item) => `${item.tag}@${item.location ?? ""}`);
        expect(tags.some((tag) => /artemis/.test(tag) && tag.endsWith("@nose"))).toBe(true);
        expect(fighter.getEquipmentList().filter((item) => item.isAmmo)).toHaveLength(1);
        expect(fighter.getBattleValue()).toBeGreaterThan(0);
    });

    it("reads a conventional fighter with a turbine and VSTOL gear", () => {
        const { unit, issues } = importBlkUnit(fighterFile({
            "UnitType": ["ConvFighter"], "type": ["IS Level 1"], "engine_type": ["1"], "SafeThrust": ["6"], "vstol": ["1"], "heatsinks": ["0"], "sink_type": ["0"],
            "fuel": ["320"], "armor_type": ["0"], "armor_tech_level": ["1"], "armor": ["7", "4", "4", "4"], "tonnage": ["20.0"],
            "Nose Equipment": ["Machine Gun"], "Left Wing Equipment": [], "Right Wing Equipment": [], "Aft Equipment": [], "Fuselage Equipment": ["IS Ammo MG - Full"],
        }), ["fighters"]);
        expect(issues).toEqual([]);
        const fighter = unit as AerospaceFighter;
        expect(fighter.isConventional()).toBe(true);
        expect(fighter.getEngineType().tag).toBe("ice");
        expect(fighter.hasVSTOL()).toBe(true);
        expect(fighter.getFuelPoints()).toBe(320);
        expect(fighter.getArmorType().tag).toBe("aerospace-standard");
    });

    it("marks an OmniFighter's pod-mounted items", () => {
        const { unit, issues } = importBlkUnit(fighterFile({ "omni": ["1"], "Nose Equipment": ["CLLRM10:OMNI", "CLArtemisIV:OMNI", "CLERMediumLaser"] }), ["fighters"]);
        expect(issues).toEqual([]);
        const fighter = unit as AerospaceFighter;
        expect(fighter.isOmni()).toBe(true);
        expect(fighter.getEquipmentList().filter((item) => fighter.isPodMounted(item.uuid ?? "")).length).toBeGreaterThan(0);
    });

    it("reports what this builder cannot build, so nothing is guessed", () => {
        expect(importBlkUnit(fighterFile({ cockpit_type: ["1"] })).issues).toEqual(["The file's Small Cockpit is not one this builder has; a standard cockpit used."]);
        expect(importBlkUnit(fighterFile({ engine_type: ["3"] })).issues[0]).toMatch(/Engine type 3/);
        expect(importBlkUnit(fighterFile({ armor_type: ["22"] })).issues[0]).toMatch(/Armor type 22/);
        expect(importBlkUnit(fighterFile({ "Nose Equipment": ["CLLRM10", "CLArtemisIV", "CLERMediumLaser", "No Such Gun"] })).issues).toEqual(["\"No Such Gun\" has no match in this catalog and was left off."]);
    });

    // #599 fighter queue: one kind of MRM round feeds every MRM size, so a bin keeps the launcher its line names, and the
    // BV counts it at that launcher's ammunition BV and as its own type (TM pp.311-312, 317). Tatsu MIK-O 1,502 -> 1,541 = MUL.
    it("loads each bin for the launcher its line names, and counts a launcher's rounds as their own type", () => {
        const { unit, issues } = importBlkUnit(fighterFile({
            type: ["IS Level 2"], engine_type: ["0"], armor_type: ["0"], "Nose Equipment": ["MRM 10"], "Left Wing Equipment": [], "Right Wing Equipment": [],
            "Aft Equipment": ["MRM 30"], "Fuselage Equipment": ["IS MRM 10 Ammo", "IS MRM 30 Ammo", "IS MRM 30 Ammo"], tonnage: ["50.0"],
        }), ["fighters"]);
        expect(issues).toEqual([]);
        const fighter = unit as AerospaceFighter;
        const fed = fighter.getEquipmentList().filter((item) => item.isAmmo).map((item) => item.feedsWeaponTag);
        expect(fed).toEqual(["mrm-10", "mrm-30", "mrm-30"]);
        const steps = fighter.getBattleValueBreakdown("total-warfare").steps;
        expect(steps.filter((step) => step.id.startsWith("af.bv2.off.ammo")).map((step) => [step.label, step.value])).toEqual([["Ammunition for MRM 10", 7], ["Ammunition for MRM 30", 42]]);
        expect(steps.find((step) => step.id === "af.bv2.def.explosive")?.value).toBe(-30);
        // The binding is saved with the design.
        const copy = new AerospaceFighter(fighter.exportJSON());
        expect(copy.getEquipmentList().filter((item) => item.isAmmo).map((item) => item.feedsWeaponTag)).toEqual(["mrm-10", "mrm-30", "mrm-30"]);
    });
});

// MegaMek infantry files (BLKInfantryFile), as the unit_files/infantry ones are written: fields kept, long overviews cut.
const infantryFile = (fields: Record<string, string[]>): string =>
    Object.entries({ "UnitType": ["Infantry"], "Field Guns Equipment": [], ...fields }).flatMap(([tag, lines]) => block(tag, ...lines)).join("\n");

// "Mob (Small)": a foot platoon with a secondary weapon, an inferno mini grenade named by MegaMek's own name.
const mobSmall = infantryFile({
    Name: ["Mob"], Model: ["(Small)"], year: ["2400"], type: ["IS Level 2"], motion_type: ["Leg"], "Troopers Equipment": [],
    overview: ["<p>A small mob is little more than an angry handful of civilians.</p>"], source: ["Apocryphal"],
    squad_size: ["5"], squadn: ["1"], secondn: ["1"], Primary: ["Rifle (Makeshift)"], Secondary: ["InfantryMiniGrenadeInferno"],
});

// "Anti-'Mech Jump Infantry Third Ueda Infantry" (mul id 46): a jump platoon with the anti-'Mech kit and a faction kit.
const thirdUeda = infantryFile({
    Name: ["Anti-'Mech Jump Infantry"], Model: ["Third Ueda Infantry"], "mul id:": ["46"], year: ["2600"], type: ["IS Level 2"], role: ["Ambusher"],
    motion_type: ["Jump"], "Troopers Equipment": ["Free Rasalhague Republic Infantry Kit", "AntiMekGear"],
    overview: ["<p>The Third Ueda Infantry is a typical example of the KungsErme forces absorbed into the Rasalhague Dominion touman.</p>"],
    source: ["TR:3085"], published: ["RS:3085u-CE"], squad_size: ["7"], squadn: ["3"], secondn: ["1"],
    Primary: ["Laser Rifle (Blazer)"], Secondary: ["Support Laser (Heavy)"],
});

// A mechanized platoon with the Fed Suns 3067+ kit, which the file also marks encumbering, and MegaMek's own weapon names.
const mechHover = infantryFile({
    Name: ["Mechanized Hover Platoon (AFFS)"], Model: ["(Flamer 3067+)"], year: ["3067"], type: ["IS Level 3"], role: ["Skirmisher"],
    motion_type: ["Hover"], "Troopers Equipment": ["Fed Suns Infantry Kit (3067+)"],
    overview: ["<p>Federated Suns infantry benefit from one of the strongest industrial bases in the Inner Sphere.</p>"],
    notes: ["Intro date based on production date of AFFS 3067+ advanced infantry kit."],
    squad_size: ["5"], squadn: ["4"], secondn: ["2"], Primary: ["Rifle (Federated Long)"], Secondary: ["Flamer (Man-Portable)"], encumberingarmor: ["true"],
});

// A sneak suit named in Troopers Equipment, with its flag.
const daiDaChi = infantryFile({
    Name: ["Sniper"], Model: ["House Dai Da Chi Snipers"], "mul id:": ["2978"], year: ["3055"], type: ["IS Level 3"], role: ["Ambusher"],
    motion_type: ["Leg"], "Troopers Equipment": ["Sneak Suit (Camo)"], overview: ["<p>Warrior House Dai Da Chi has trained an elite squad of snipers.</p>"],
    source: ["TR:3085"], squad_size: ["7"], squadn: ["1"], Primary: ["Sniper Rifle (Minolta 9000 Advanced Sniper System)"], sneakcamo: ["true"],
});

// "Beast Infantry (Elephant) (Auto-Rifle/MG)", MegaMek's Beast Mounted folder: 5 creatures of 2 riders, the creature's divisor written as armordivisor.
const elephantFile = infantryFile({
    Name: ["Beast Infantry (Elephant)"], Model: ["(Auto-Rifle/MG)"], year: ["2000"], type: ["IS Level 3"], motion_type: ["Beast:Elephant"],
    "Troopers Equipment": ["Clothing, Fatigues/Civilian/Non-Armored", "AntiMekGear"],
    overview: ["<p>Terran elephants have been employed as beasts of war for millennia.</p>"],
    squad_size: ["2"], squadn: ["5"], secondn: ["1"], Primary: ["InfantryAssaultRifle"], Secondary: ["Machine Gun (Support)"], armordivisor: ["2.0"],
});

// A field artillery platoon: its Arrow IV and ammunition are the platoon's field artillery (TO:AUE p.122).
const arrowIv = infantryFile({
    Name: ["Field Artillery Platoon (AFFS)"], Model: ["(Motorized Arrow IV 3067+)"], year: ["3067"], type: ["IS Level 3"], role: ["Missile Boat"],
    motion_type: ["Motorized"], "Troopers Equipment": ["Fed Suns Infantry Kit (3067+)"], "Field Guns Equipment": ["ISArrowIV", "ISArrowIVAmmo"],
    squad_size: ["7"], squadn: ["4"], secondn: ["1"], Primary: ["Submachine Gun"], Secondary: ["Rifle (Federated Long)"], encumberingarmor: ["true"],
});

// "Field Gun Platoon (AFFS) (Motorized UAC5 3067+)" as MegaMek writes it: three Ultra AC/5 and a ton of ammunition each.
const uac5Guns = infantryFile({
    Name: ["Field Gun Platoon (AFFS)"], Model: ["(Motorized UAC5 3067+)"], year: ["3067"], type: ["IS Level 3"], role: ["Sniper"],
    motion_type: ["Motorized"], "Troopers Equipment": ["Fed Suns Infantry Kit (3067+)"],
    "Field Guns Equipment": ["ISUltraAC5", "IS Ultra AC/5 Ammo", "ISUltraAC5", "IS Ultra AC/5 Ammo", "ISUltraAC5", "IS Ultra AC/5 Ammo"],
    squad_size: ["7"], squadn: ["4"], Primary: ["Rifle (Federated Long)"], encumberingarmor: ["true"],
});

// "Manei Domini Attack Squad 'Tau Zombie'" (MegaMek 0.51, 3085 unit files): a six-trooper foot squad with seven implants and improved prosthetic limbs.
const tauZombie = infantryFile({
    Name: ["Manei Domini Attack Squad"], Model: ["'Tau Zombie'"], "mul id:": ["3167"], year: ["3065"], type: ["IS Level 4"], role: ["Ambusher"], motion_type: ["Leg"],
    "Troopers Equipment": ["AntiMekGear", "Word of Blake Infantry Kit"], source: ["TR:3085"], published: ["RS:3085u-CE"],
    overview: ["<p>The Manei Domini's Tau Zombie attack squads were among the most terrifying infantry formations fielded during the Jihad.</p>"],
    squad_size: ["6"], squadn: ["1"], secondn: ["4"], Primary: ["Laser Rifle (Mauser 1200 LSS)"], Secondary: ["Support Laser (Heavy)"],
    augmentation: ["artificial_pain_shunt", "cyber_imp_visual", "cyber_imp_laser", "dermal_armor", "tsm_implant", "pl_ienhanced", "suicide_implants"],
    prostheticEnhancement1: ["Ballistic"], prostheticEnhancement1Count: ["2"], prostheticEnhancement2: ["Grappler"], prostheticEnhancement2Count: ["2"],
});

// "Manei Domini Recon Squad 'Tau Wraith'": a sneak suit and five implants (the file's specialization 512 is left out here).
const tauWraith = infantryFile({
    Name: ["Manei Domini Recon Squad"], Model: ["'Tau Wraith'"], "mul id:": ["3166"], year: ["3065"], type: ["IS Level 4"], role: ["Scout"], motion_type: ["Leg"],
    "Troopers Equipment": ["Sneak Suit (Camo/IR/ECM)"], source: ["TR:3085"], published: ["RS:3085u-CE"],
    overview: ["<p>Tau Wraith reconnaissance squads served as the Manei Domini's eyes on the battlefield, operating from the shadows.</p>"],
    squad_size: ["6"], squadn: ["1"], Primary: ["Laser Rifle (Mauser 1200 LSS)"], sneakcamo: ["true"], sneakir: ["true"], sneakecm: ["true"],
    augmentation: ["boost_comm_implant", "cyber_imp_visual", "cyber_imp_laser", "gas_effuser_pheromone", "gas_effuser_toxin"],
});

describe("MegaMek infantry files (#600 round 4c)", () => {
    it("reads the UnitType Infantry as a platoon, and the creator may accept it", () => {
        expect(getBlkUnitKind(mobSmall)).toBe("infantry");
        const result = importBlkUnit(mobSmall, ["infantry"]);
        expect(result.kind).toBe("infantry");
        expect(result.unit).toBeInstanceOf(InfantryPlatoon);
        expect(importBlkUnit(mobSmall, ["vehicles"]).issues).toEqual(["This file holds conventional infantry, not a Combat Vehicle: load it in that unit's creator."]);
    });

    it("reads a foot platoon with a secondary weapon, and the readout's text, role and source", () => {
        const { unit, issues } = importBlkUnit(mobSmall, ["infantry"]);
        expect(issues).toEqual([]);
        const platoon = unit as InfantryPlatoon;
        expect(platoon.getName()).toBe("Mob (Small)");
        expect(platoon.getMotive().tag).toBe("foot");
        expect([platoon.getSquadSize(), platoon.getSquads()]).toEqual([5, 1]);
        expect(platoon.getPrimaryWeapon().name).toBe("Rifle (Makeshift)");
        expect(platoon.getSecondaryWeapon()?.name).toBe("Grenade (Mini) (Inferno)");
        expect(platoon.getSecondaryPerSquad()).toBe(1);
        expect(platoon.getEra().yearStart).toBeLessThanOrEqual(2400);
        expect(platoon.tro.getText("overview")).toBe("A small mob is little more than an angry handful of civilians.");
        expect(platoon.tro.getText("notes")).toBe("Source: Apocryphal.");
    });

    it("reads a jump platoon with the anti-'Mech kit and a faction armor kit", () => {
        const { unit, issues, notes } = importBlkUnit(thirdUeda, ["infantry"]);
        expect(issues).toEqual([]);
        expect(notes).toEqual([]);
        const platoon = unit as InfantryPlatoon;
        expect(platoon.getMotive().tag).toBe("jump");
        expect([platoon.getSquadSize(), platoon.getSquads()]).toEqual([7, 3]);
        expect(platoon.getPrimaryWeapon().name).toBe("Laser Rifle (Blazer)");
        expect(platoon.getSecondaryWeapon()?.name).toBe("Support Laser (Heavy)");
        expect(platoon.hasAntiMechKit()).toBe(true);
        expect(platoon.getArmor()?.name).toBe("Free Rasalhague Republic");
        expect(platoon.tro.getText("notes")).toBe("Role: Ambusher.\n\nSource: TR:3085.");
    });

    it("reads a mechanized platoon with a faction kit, matching the kit's own flags and MegaMek's weapon names", () => {
        const { unit, issues } = importBlkUnit(mechHover, ["infantry"]);
        expect(issues).toEqual([]);
        const platoon = unit as InfantryPlatoon;
        expect(platoon.getMotive().tag).toBe("mech-hover");
        expect(platoon.getArmor()?.name).toBe("Federated Suns (3067+)");
        expect(platoon.getArmor()?.encumbering).toBe(true);
        expect(platoon.getPrimaryWeapon().name).toBe("Rifle (Federated Long)");
        expect(platoon.getSecondaryWeapon()?.name).toBe("Flamer (Man-Portable)");
        expect(platoon.getSecondaryPerSquad()).toBe(2);
        expect(platoon.hasAntiMechKit()).toBe(false);
        expect(platoon.tro.getText("notes")).toBe("Intro date based on production date of AFFS 3067+ advanced infantry kit.\n\nRole: Skirmisher.");
    });

    it("takes MegaMek's own weapon names for the weapons it names that way", () => {
        const named = (primary: string, secondary?: string) => importBlkUnit(mobSmall.replace(">\nRifle (Makeshift)\n<", `>\n${primary}\n<`)
            .replace(">\nInfantryMiniGrenadeInferno\n<", `>\n${secondary ?? "Machine Gun (Support)"}\n<`), ["infantry"]);
        const { unit, issues } = named("InfantryAssaultRifle", "InfantryHeavySRM");
        expect(issues).toEqual([]);
        expect((unit as InfantryPlatoon).getPrimaryWeapon().name).toBe("Auto-Rifle");
        expect((unit as InfantryPlatoon).getSecondaryWeapon()?.name).toBe("SRM Launcher (Heavy)");
        expect((named("InfantryFederatedBarrettM42B").unit as InfantryPlatoon).getPrimaryWeapon().name).toBe("Rifle (Federated-Barrett M42B)");
    });

    it("reads a sneak suit named in the equipment, and one written as its flags alone", () => {
        const named = importBlkUnit(daiDaChi, ["infantry"]);
        expect(named.issues).toEqual([]);
        expect((named.unit as InfantryPlatoon).getArmor()?.name).toBe("Sneak Suit (Camo)");
        expect((named.unit as InfantryPlatoon).getStealthDefensiveFactor()).toBeCloseTo(0.2);
        const flags = infantryFile({
            Name: ["Test"], Model: ["Sneaks"], year: ["3064"], type: ["IS Level 3"], motion_type: ["Leg"], "Troopers Equipment": [],
            squad_size: ["7"], squadn: ["3"], Primary: ["InfantryAssaultRifle"], sneakcamo: ["true"], sneakir: ["true"], sneakecm: ["true"],
        });
        const read = importBlkUnit(flags, ["infantry"]);
        expect(read.issues).toEqual([]);
        expect((read.unit as InfantryPlatoon).getArmor()?.name).toBe("Sneak Suit (Camo, IR, ECM)");
        // Camo/IR in MegaMek's own spelling.
        const twoSystems = importBlkUnit(daiDaChi.replace("Sneak Suit (Camo)", "Sneak Suit (Camo/IR)").replace("<sneakcamo>", "<sneakir>\ntrue\n</sneakir>\n<sneakcamo>"), ["infantry"]);
        expect(twoSystems.issues).toEqual([]);
        expect((twoSystems.unit as InfantryPlatoon).getArmor()?.name).toBe("Sneak Suit (Camo, IR)");
    });

    it("reads field artillery, and a real MegaMek field gun file (Field Gun Platoon (AFFS) Motorized UAC5 3067+)", () => {
        const field = importBlkUnit(arrowIv, ["infantry"]);
        expect(field.issues).toEqual([]);
        const artillery = field.unit as InfantryPlatoon;
        expect(artillery.isFieldArtillery()).toBe(true);
        expect(artillery.getFieldGunWeapon()?.tag).toBe("arrow-iv-system");
        expect(artillery.getFieldGunAmmo().map((ammo) => ammo.tag)).toEqual(["ammo-is-arrow-iv-standard"]);
        expect(artillery.getMP()).toBe(1);
        const guns = importBlkUnit(uac5Guns, ["infantry"]);
        expect(guns.issues).toEqual([]);
        const platoon = guns.unit as InfantryPlatoon;
        expect(platoon.getFieldGunWeapon()?.tag).toBe("autocannon-ultra-b");
        expect(platoon.getFieldGunCount()).toBe(3);
        expect(platoon.getFieldGunAmmo().map((ammo) => ammo.tag)).toEqual(["ammo-is-ultra-ac-5-standard", "ammo-is-ultra-ac-5-standard", "ammo-is-ultra-ac-5-standard"]);
        expect(platoon.getIssues()).toEqual([]);
        // The guns come back out in the platoon's own save.
        expect(new InfantryPlatoon(platoon.exportJSON()).getFieldGunCount()).toBe(3);
    });

    it("reports a field gun item it has no record for, a mixed or over-crewed set, and a motive that cannot tow guns", () => {
        const odd = importBlkUnit(uac5Guns.replace("<Field Guns Equipment>", "<Field Guns Equipment>\nISHeavyGaussRifle\nNo Such Gun"), ["infantry"]);
        expect(odd.issues).toEqual([
            "Field gun item \"ISHeavyGaussRifle\" (the file's Field Guns Equipment) is not a field gun, field artillery or ammunition this builder has.",
            "Field gun item \"No Such Gun\" (the file's Field Guns Equipment) is not a field gun, field artillery or ammunition this builder has.",
        ]);
        const crowd = importBlkUnit(uac5Guns.replace("<Field Guns Equipment>", "<Field Guns Equipment>\nISUltraAC5\nIS Ultra AC/5 Ammo"), ["infantry"]);
        expect(crowd.issues.join(" ")).toContain("4 Ultra AC/5 are over what 28 troopers can crew; 3 used.");
        const foot = importBlkUnit(uac5Guns.replace(">\nMotorized\n<", ">\nLeg\n<"), ["infantry"]);
        expect(foot.issues.join(" ")).toContain("cannot be carried as a field gun");
        const noAmmo = importBlkUnit(uac5Guns.replace(/IS Ultra AC\/5 Ammo\n/g, ""), ["infantry"]);
        expect(noAmmo.issues).toEqual([]);
        expect((noAmmo.unit as InfantryPlatoon).getFieldGunAmmo().length).toBe(3);
        const short = importBlkUnit(uac5Guns.replace("IS Ultra AC/5 Ammo\n", ""), ["infantry"]);
        expect(short.issues.join(" ")).toContain("3 field guns but 2 tons of ammunition");
    });

    // MegaMek's "Clan Field Gun Point (Tracked UAC5 Basic)" is a Clan file whose guns are written ISUltraAC5: the Inner Sphere
    // Ultra AC/5 (BV 112), not the Clan one (BV 122). It is built as mixed technology on its Clan chassis (TO:AUE p.189), as the
    // Clan LRM points are: the Clan platoon keeps its formation and fields the Inner Sphere gun the file names.
    it("builds a Clan platoon whose field guns the file names for the Inner Sphere with mixed technology (TO:AUE p.189)", () => {
        const clanFile = uac5Guns.replace(">\nIS Level 3\n<", ">\nClan Level 3\n<").replace("Fed Suns Infantry Kit (3067+)", "Generic Infantry Kit")
            .replace(">\nRifle (Federated Long)\n<", ">\nInfantryAssaultRifle\n<").replace("<encumberingarmor>\ntrue\n</encumberingarmor>", "");
        const read = importBlkUnit(clanFile, ["infantry"]);
        const platoon = read.unit as InfantryPlatoon;
        expect(read.issues).toEqual([]);
        expect(platoon.getTechBase()).toBe("clan");
        expect(platoon.isMixedTech()).toBe(true);
        expect(read.notes.join(" ")).toContain("Ultra AC/5 is Inner Sphere equipment: the platoon is built with mixed technology (TO:AUE p.189, Advanced).");
        expect(platoon.getFieldGunWeapon()?.tag).toBe("autocannon-ultra-b");
        expect(platoon.getFieldGunAmmo().map((ammo) => ammo.tag)).toEqual(["ammo-is-ultra-ac-5-standard", "ammo-is-ultra-ac-5-standard", "ammo-is-ultra-ac-5-standard"]);
        expect(platoon.getFieldGunBattleValue().each).toBe(112);
        // The mixed platoon keeps its Inner Sphere guns through its own save.
        const saved = new InfantryPlatoon(platoon.exportJSON());
        expect([saved.getFieldGunWeapon()?.tag, saved.getFieldGunCount(), saved.getImportIssues()]).toEqual(["autocannon-ultra-b", 3, []]);
        // A straight Clan platoon is offered Clan guns only.
        const straight = new InfantryPlatoon();
        straight.setTechBase("clan");
        straight.setMotive("motorized");
        expect(straight.getAvailableFieldGuns(5).some((gun) => gun.tag === "autocannon-ultra-b")).toBe(false);
        expect(straight.setFieldGuns("autocannon-ultra-b", 1)).toBe(false);
        straight.setMixedTech(true);
        expect(straight.getAvailableFieldGuns(5).some((gun) => gun.tag === "autocannon-ultra-b")).toBe(true);
        // A gun both technology bases share (the Thumper, one record) is no swap and no mix.
        const thumper = importBlkUnit(clanFile.replace(/ISUltraAC5\nIS Ultra AC\/5 Ammo\n/g, "").replace("<Field Guns Equipment>", "<Field Guns Equipment>\nISThumper\nISThumperAmmo"), ["infantry"]);
        expect(thumper.issues).toEqual([]);
        expect((thumper.unit as InfantryPlatoon).isFieldArtillery()).toBe(true);
    });

    it("reports what a platoon cannot carry yet, each in its own words, and still returns the platoon", () => {
        const beast = importBlkUnit(mobSmall.replace(">\nLeg\n<", ">\nBeast:Dragon\n<"), ["infantry"]);
        expect(beast.issues).toEqual(["The mount \"Beast:Dragon\" is not a creature of the Beast-Mounted Infantry Sample Types Table (TO:AUE p.106)."]);
        // Specializations and the rare motion types are built (TO:AUE pp.135, 152-153): a bit this builder does not know, and a motion it has no motive for, are reported.
        const spec = importBlkUnit(daiDaChi + "\n<specialization>\n16384\n</specialization>", ["infantry"]);
        expect(spec.issues).toEqual(["The file's specialization is not one this platoon can have: bit mask 16384 has bits this builder does not know."]);
        const rare = importBlkUnit(mobSmall.replace(">\nLeg\n<", ">\nAirship\n<") + "\n<augmentation>\nvdni\n</augmentation>", ["infantry"]);
        expect(rare.issues).toEqual(["The motion type \"Airship\" is not one a platoon has yet.", "The file's augmentation (vdni) is not one conventional infantry has rules for (IO:AE pp.70-79: the neural interfaces and the Clan EI implant are for other unit types)."]);
        const item = importBlkUnit(tauZombie.replace("<prostheticEnhancement2>\nGrappler", "<prostheticEnhancement2>\nSonic Fist"), ["infantry"]);
        expect(item.issues).toEqual(["The file's prosthetic item \"Sonic Fist\" is not on the Enhanced Prosthetic Equipment Table (IO:AE p.78)."]);
        const orphan = importBlkUnit(tauZombie.replace("pl_ienhanced\n", ""), ["infantry"]);
        expect(orphan.issues.join(" ")).toContain("need the pl_enhanced or pl_ienhanced augmentation");
    });

    it("reads the Tau Zombie Manei Domini squad from a real MegaMek file: seven implants, improved prosthetic limbs and four secondary weapons a squad", () => {
        const { unit, issues } = importBlkUnit(tauZombie, ["infantry"]);
        expect(issues).toEqual([]);
        const platoon = unit as InfantryPlatoon;
        expect(platoon.getAugmentations().map((item) => item.megamekKey)).toEqual(["artificial_pain_shunt", "cyber_imp_visual", "cyber_imp_laser", "dermal_armor", "tsm_implant", "suicide_implants", "pl_ienhanced"]);
        expect(platoon.getLimbs()).toEqual([{ item: "ballistic", count: 2 }, { item: "grappler", count: 2 }]);
        expect([platoon.getSquadSize(), platoon.getSquads(), platoon.getTroopers()]).toEqual([6, 1, 6]);
        // Four support lasers a squad: only dermal armor with triple-strength myomer lets a squad carry that many (pp.74-75).
        expect(platoon.getSecondaryPerSquad()).toBe(4);
        // The Word of Blake kit's divisor 2, +1 for the dermal armor; triple-strength adds nothing over armor.
        expect(platoon.getDamageDivisor()).toBe(3);
        expect(platoon.getProbeRange()).toBe(2);
        expect(platoon.getImplantToHitModifier()).toBe(-1);
        expect(platoon.getRequiredRulesLevel()).toBe(4);
        expect(platoon.getAntiMechToHitModifier()).toBe(-2);
        // Per trooper: 500,000 + 650,000 + 600,000 + 1,500,000 + 2,500,000 + 202,000 x 2 + 250.
        expect(platoon.getAugmentationCost().value).toBe(6 * (500000 + 650000 + 600000 + 1500000 + 2500000 + 404000 + 250));
        expect(platoon.getImportIssues()).toEqual([]);
        // A real file is a platoon the creator saves and loads again.
        const copy = new InfantryPlatoon(platoon.exportJSON());
        expect(copy.getAugmentations().length).toBe(7);
        expect(copy.getSecondaryPerSquad()).toBe(4);
        expect(copy.getImportIssues()).toEqual([]);
    });

    it("reads the Tau Wraith Manei Domini squad: boosted communications, optics, and both gas effusers (its specialization is read with the specializations)", () => {
        const { unit, issues } = importBlkUnit(tauWraith, ["infantry"]);
        expect(issues).toEqual([]);
        const platoon = unit as InfantryPlatoon;
        expect(platoon.getAugmentations().map((item) => item.megamekKey)).toEqual(["boost_comm_implant", "cyber_imp_visual", "cyber_imp_laser", "gas_effuser_pheromone", "gas_effuser_toxin"]);
        expect(platoon.getArmor()?.name).toBe("Sneak Suit (Camo, IR, ECM)");
        expect(platoon.getAlphaStrikeStats().specialAbilities).toEqual(expect.arrayContaining(["CI", "C3I", "LPRB", "RCN", "LMAS"]));
        // A fourth of 6 troopers, rounded up, carry the boosted communications implant.
        expect(platoon.getAugmentationCost().log.join("\n")).toContain("2 (a fourth of the troopers) x 8,000");
    });

    it("reads a beast-mounted platoon from a real MegaMek file: its creature, divisor, squads and weight", () => {
        const { unit, issues } = importBlkUnit(elephantFile, ["infantry"]);
        expect(issues).toEqual([]);
        const platoon = unit as InfantryPlatoon;
        expect(platoon.getMount()?.name).toBe("Elephant");
        expect(platoon.getMotive().tag).toBe("beast");
        expect([platoon.getSquadSize(), platoon.getSquads(), platoon.getTroopers()]).toEqual([2, 5, 10]);
        expect(platoon.getPrimaryWeapon().name).toBe("Auto-Rifle");
        expect(platoon.getSecondaryWeapon()?.name).toBe("Machine Gun (Support)");
        expect(platoon.getSecondaryPerSquad()).toBe(1);
        expect(platoon.hasAntiMechKit()).toBe(true);
        expect(platoon.getDamageDivisor()).toBe(3);
        expect(platoon.getMP()).toBe(2);
        // 5 creatures of 6 t and 10 riders of 0.2 t.
        expect(platoon.getWeight()).toBe(32);
    });

    it("reads every creature of the table by MegaMek's name, and reports a platoon over the creature limit", () => {
        for (const [name, tag] of [["Coventry Kangaroo", "coventry-kangaroo"], ["Odessan Raxx", "odessan-raxx"], ["Branth", "branth"], ["Tariq", "tariq"]]) {
            // A Large creature carries no support weapon, so the mob's inferno mini grenade goes.
            const read = importBlkUnit(mobSmall.replace(">\nLeg\n<", `>\nBeast:${name}\n<`).replace("<Secondary>\nInfantryMiniGrenadeInferno\n</Secondary>", ""), ["infantry"]);
            expect(read.issues, name).toEqual([]);
            expect((read.unit as InfantryPlatoon).getMount()?.tag).toBe(tag);
        }
        // MegaMek's Hipposaur files list 4 squads of 2 riders: 8 riders, which is the table's 2 Monstrous creatures of 4 (see the specialized files below);
        // 3 creatures of 4 riders (6 squads of 2) are over the 2 a platoon.
        const hipposaur = importBlkUnit(elephantFile.replace("Beast:Elephant", "Beast:Hipposaur").replace(">\n5\n<", ">\n6\n<").replace("<secondn>\n1\n</secondn>", "<secondn>\n1\n</secondn>").replace("<armordivisor>\n2.0\n</armordivisor>", "<armordivisor>\n4.0\n</armordivisor>"), ["infantry"]);
        expect(hipposaur.issues).toEqual(["A Hipposaur platoon holds at most 2 Hipposaurs (Monstrous creatures, TO:AUE p.107)"]);
    });

    it("builds a Clan file that carries an Inner Sphere weapon as a mixed technology point (TO:AUE p.189)", () => {
        // MegaMek's Clan Foot Point (LRM): the generic Clan LRM point of TW p.213, built with the Inner Sphere FarShot (TM p.300).
        const lrmPoint = infantryFile({
            Name: ["Clan Foot Point"], Model: ["(LRM)"], "mul id:": ["604"], year: ["3065"], type: ["Clan Level 5"], motion_type: ["Leg"],
            "Troopers Equipment": ["Clan Armor Kit (All)"], squad_size: ["5"], squadn: ["5"], secondn: ["2"], Primary: ["InfantryAssaultRifle"], Secondary: ["InfantryLRM"],
        });
        const read = importBlkUnit(lrmPoint, ["infantry"]);
        expect(read.issues).toEqual([]);
        expect(read.notes.join(" ")).toContain("mixed technology (TO:AUE p.189");
        const point = read.unit as InfantryPlatoon;
        expect([point.isMixedTech(), point.getTechBase(), point.getSecondaryWeapon()?.tag, point.getSecondaryPerSquad()]).toEqual([true, "clan", "inf-lrm-launcher-corean-farshot", 2]);
        expect(point.getRequiredRulesLevel()).toBe(3);
        // A pure Clan file stays pure.
        const pure = importBlkUnit(lrmPoint.replace("InfantryLRM", "InfantryStandardSRM"), ["infantry"]);
        expect((pure.unit as InfantryPlatoon).isMixedTech()).toBe(false);
    });

    it("gives the HALO Paratroopers the one heavy recoilless rifle a squad TRO 3085 p.202 prints (the file has two)", () => {
        const halo = infantryFile({
            Name: ["HALO Paratrooper"], Model: ["Lyran Paratrooper Corps"], "mul id:": ["1364"], year: ["3060"], type: ["IS Level 3"], motion_type: ["Leg"],
            "Troopers Equipment": ["Lyran Alliance/Lyran Commonwealth (3060+) Infantry Kit"], squad_size: ["7"], squadn: ["3"], secondn: ["2"],
            Primary: ["Rifle (M&G G-150)"], Secondary: ["InfantryHRR"], specialization: ["512"],
        });
        const read = importBlkUnit(halo, ["infantry"]);
        expect(read.issues).toEqual([]);
        const platoon = read.unit as InfantryPlatoon;
        // "18 Mauser & Gray G-150 Rifles", "3 Heavy Recoilless Rifles", 21 (7/3), Foot (Paratroopers): Paratroops carry one a squad (TO:AUE p.153).
        expect([platoon.getPrimaryCount(), platoon.getSecondaryCount(), platoon.getSpecialties()]).toEqual([18, 3, ["paratroops"]]);
        // 63 + (29.52 + 8.73) x 2 x 0.54 = 104.31, x 1.1 = 114.74: 115.
        expect(platoon.getBattleValue()).toBe(115);
    });

    it("gives the Branth Irregulars the 3035 issue kit TRO 3085 p.201 prints (the file names the older kit)", () => {
        const aerial = infantryFile({
            Name: ["Beast Infantry"], Model: ["(Aerial)"], "mul id:": ["12"], year: ["2300"], type: ["IS Level 3"], motion_type: ["Beast:Branth"],
            "Troopers Equipment": ["Free Worlds League Infantry Kit"], squad_size: ["7"], squadn: ["1"], Primary: ["Elephant Gun"],
        });
        const read = importBlkUnit(aerial, ["infantry"]);
        expect(read.issues).toEqual([]);
        const platoon = read.unit as InfantryPlatoon;
        // "Armor: Free Worlds League Standard Infantry Kit (3035 Issue)", "Armor Divisor: 2", "Cannot conduct Anti-'Mech or Swarming
        // Attacks": the 3035+ kit is encumbering (TO:AUE p.130).
        expect(platoon.getArmor()?.name).toBe("Free Worlds League (3035+)");
        expect([platoon.getDamageDivisor(), platoon.canMakeAntiMechAttacks()]).toEqual([3, false]);
        // 7 x 1.5 x (2 + 1) = 31.5 (the sum of the divisors, TO:AUE p.191); the kit takes 1 MP off the branth's 6 (p.130): 5 VTOL MP
        // is +2, airborne +1, factor 1.3: 40.95; 7 x 0.34 x 1.0 = 2.38; 43.33, rounded 43, the MUL's figure (107489).
        expect(platoon.getMP()).toBe(5);
        expect(platoon.getBattleValue()).toBe(43);
    });

    it("reports a weapon, a kit or an armor flag with no match, and never guesses", () => {
        const odd = importBlkUnit(mobSmall.replace("Rifle (Makeshift)", "Rifle (Unlisted Make)")
            .replace("<Troopers Equipment>\n</Troopers Equipment>", "<Troopers Equipment>\nSLDF Infantry Kit\n</Troopers Equipment>"), ["infantry"]);
        expect(odd.issues).toEqual([
            "Primary weapon \"Rifle (Unlisted Make)\" has no match in this catalog.",
            "\"SLDF Infantry Kit\" (Troopers Equipment) has no match in this catalog and was left off.",
        ]);
        // A divisor the kit does not have is custom armor.
        const custom = importBlkUnit(mobSmall.replace("<Troopers Equipment>\n</Troopers Equipment>", "<Troopers Equipment>\nClothing, Fatigues/Civilian/Non-Armored\n</Troopers Equipment>") + "\n<armordivisor>\n2.0\n</armordivisor>", ["infantry"]);
        expect(custom.issues).toEqual(["The file's armor differs from its kit (Clothing, Fatigues/Civilian/Non-Armored: damage divisor 2); custom infantry armor is not modeled."]);
    });
});

// MegaMek's own specialized infantry files (unit_files/infantry), fields kept, overviews cut: the specialization bit mask and the
// SCUBA, Submarine and Microcopter motion types (TO:AUE pp.135, 152-153, 162).
const specFile = (fields: Record<string, string[]>): string => infantryFile({ type: ["IS Level 3"], year: ["3067"], "Troopers Equipment": [], squad_size: ["7"], squadn: ["2"], Primary: ["Submachine Gun"], ...fields });
const sappers = specFile({ Name: ["Foot Platoon (AFFS)"], Model: ["(Sappers 2315+)"], year: ["2315"], motion_type: ["Leg"], "Troopers Equipment": ["Demolition Charge", "Demolition Charge", "Demolition Charge", "Ballistic Plate, Standard"], encumberingarmor: ["true"], specialization: ["10"] });
const combatEngineers = specFile({ Name: ["Motorized Platoon (AFFS)"], Model: ["(Combat Engineers 3067+)"], motion_type: ["Motorized"], "Troopers Equipment": ["Vibro-Shovel", "Vibro-Shovel", "Vibro-Shovel", "Fed Suns Infantry Kit (3067+)", "Infantry Bridge Kit"], encumberingarmor: ["true"], specialization: ["33"] });
const minesweepers = specFile({ Name: ["Clan Engineer Point"], Model: ["(Minesweeper)"], type: ["Mixed (Clan Chassis) Advanced"], year: ["2840"], motion_type: ["Motorized"], "Troopers Equipment": ["Clothing, Leather/Synthetic Hide", "Light Minesweeper", "Light Minesweeper"], squad_size: ["10"], Primary: ["Rifle (Bolt-Action)"], specialization: ["8"] });
const mountaineers = specFile({ Name: ["Mountaineer"], Model: ["45th Cerulean Mountain Infantry; 3rd Davion Guards"], "mul id:": ["2242"], year: ["3064"], motion_type: ["Leg"], "Troopers Equipment": ["Federated Suns Infantry Kit"], secondn: ["1"], Primary: ["InfantryFederatedBarrettM42B"], Secondary: ["InfantrySRMLight"], specialization: ["128"] });
const paratrooper = specFile({ Name: ["SpecOps Paratrooper"], Model: ["MI6 Extraction Team"], "mul id:": ["3001"], year: ["3064"], motion_type: ["Leg"], "Troopers Equipment": ["Sneak Suit (Camo/IR/ECM)"], squadn: ["3"], secondn: ["1"], Primary: ["InfantryFederatedBarrettM42B"], Secondary: ["Sonic Stunner"], sneakcamo: ["true"], sneakir: ["true"], sneakecm: ["true"], specialization: ["512"] });
const medic = specFile({ Name: ["Foot Squad"], Model: ["(Medic)"], year: ["2500"], motion_type: ["Leg"], "Troopers Equipment": ["Generic Infantry Kit"], squadn: ["1"], Primary: ["Rifle (Federated Long)"], specialization: ["256"] });
const tagSpotter = specFile({ Name: ["TAG Spotter Infantry"], Model: ["Stalwart Support - Spotter Infantry"], "mul id:": ["3149"], year: ["3055"], motion_type: ["Leg"], "Troopers Equipment": ["Flak, Standard"], squadn: ["4"], secondn: ["2"], Primary: ["Laser Rifle (Marx XX)"], Secondary: ["InfantryTAG"], specialization: ["1024"] });
const laserTag = specFile({ Name: ["Jump Platoon (DCMS)"], Model: ["(Laser TAG 3051+)"], year: ["3051"], motion_type: ["Jump"], "Troopers Equipment": ["Draconis Combine Infantry Kit"], squadn: ["3"], Primary: ["Laser Rifle (Magna)"], specialization: ["1024"] });
const xctMarine = specFile({ Name: ["XCT Marine"], Model: ["Special Asteroid Support Forces"], "mul id:": ["3607"], year: ["2500"], motion_type: ["Leg"], "Troopers Equipment": ["Environment Suit, Marine"], squad_size: ["10"], squadn: ["3"], secondn: ["2"], Primary: ["Laser Rifle (Marx XX)"], Secondary: ["Blade (Vibro-blade)"], spacesuit: ["true"], specialization: ["2048"] });
const frogmen = specFile({ Name: ["Frogmen"], Model: ["Blue Water Marine Response Teams (Frogmen)"], "mul id:": ["1153"], year: ["2500"], motion_type: ["Motorized SCUBA"], "Troopers Equipment": ["Flak, Standard"], squad_size: ["6"], secondn: ["1"], Primary: ["InfantryFederatedBarrettM61A"], Secondary: ["Support Laser"], specialization: ["4096"] });
const mermen = specFile({ Name: ["Submersible Mechanized Infantry"], Model: ["Kraken Unleashed - The Mermen"], "mul id:": ["3116"], year: ["2600"], motion_type: ["Submarine"], "Troopers Equipment": ["Environment Suit, Marine"], squad_size: ["5"], squadn: ["4"], secondn: ["2"], Primary: ["Gyroslug Rifle"], Secondary: ["InfantryStandardSRM"], spacesuit: ["true"], specialization: ["4096"] });
const microcopter = specFile({ Name: ["VTOL Infantry"], Model: ["Hachiman Taro Enterprise Extraction Force"], "mul id:": ["3457"], year: ["3045"], motion_type: ["Microcopter"], "Troopers Equipment": ["Myomer, Vest"], squad_size: ["4"], squadn: ["4"], Primary: ["InfantryAssaultRifle"] });
// The Hipposaur files: 4 squads of 2 riders, which is 2 creatures of 4, and bit 4096 for the SCUBA gear its riders need.
const hipposaurFile = specFile({ Name: ["Beast Infantry (Hipposaur)"], Model: ["(Auto-Rifle/Auto-Cannon)"], year: ["2750"], motion_type: ["Beast:Hipposaur"], "Troopers Equipment": ["Environment Suit, Hostile"], squad_size: ["2"], squadn: ["4"], secondn: ["2"], Primary: ["InfantryAssaultRifle"], Secondary: ["Autocannon (Semi-Portable)"], encumberingarmor: ["true"], spacesuit: ["true"], specialization: ["4096"] });

describe("MegaMek specialized infantry files (TO:AUE pp.135, 152-153, 162)", () => {
    const read = (text: string) => {
        const result = importBlkUnit(text, ["infantry"]);
        return { platoon: result.unit as InfantryPlatoon, issues: result.issues, notes: result.notes };
    };

    it("decodes the combat engineer bits into tasks and takes their tools as the tasks' gear", () => {
        const sap = read(sappers);
        expect(sap.issues).toEqual([]);
        expect([sap.platoon.getSpecialties(), sap.platoon.getEngineerTasks()]).toEqual([["engineers"], ["demolition", "minesweeping"]]);
        expect([sap.platoon.getGunnery(), sap.platoon.isSpecialized()]).toEqual([3, true]);
        const engineers = read(combatEngineers);
        expect(engineers.issues).toEqual([]);
        expect(engineers.platoon.getEngineerTasks()).toEqual(["bridge", "trench"]);
        expect(engineers.platoon.getMotive().tag).toBe("motorized");
        // The 7 x 2 troopers of 0.195 t and 0.1 t more, the book's weight.
        expect(engineers.platoon.getWeightPerTrooper()).toBeCloseTo(0.295, 6);
        const sweep = read(minesweepers);
        expect(sweep.issues).toEqual([]);
        expect(sweep.platoon.getEngineerTasks()).toEqual(["minesweeping"]);
        // A tool the specialization does not carry is reported, not dropped without a word.
        const stray = read(sappers.replace("<specialization>\n10\n</specialization>", "<specialization>\n8\n</specialization>"));
        expect(stray.issues.join(" ")).toContain("\"Demolition Charge\" is Demolition engineer gear");
        // A file with the bits and no tool still reads.
        expect(read(sappers.replace(/Demolition Charge\n/g, "")).issues).toEqual([]);
    });

    it("reads Mountain Troops, Paratroops, and the Veteran skills a specialist needs", () => {
        const mountain = read(mountaineers);
        expect(mountain.issues).toEqual([]);
        expect(mountain.platoon.getSpecialties()).toEqual(["mountain"]);
        expect([mountain.platoon.getSecondaryPerSquad(), mountain.platoon.getGunnery()]).toEqual([1, 3]);
        expect(mountain.notes.join(" ")).toContain("Veteran or better");
        expect(mountain.platoon.getIssues()).toEqual([]);
        const para = read(paratrooper);
        expect(para.issues).toEqual([]);
        expect(para.platoon.getSpecialties()).toEqual(["paratroops"]);
        expect(para.platoon.getArmor()?.stealth).toEqual(["camo", "ir", "ecm"]);
        // The book's one secondary a squad: a file with two is reported, one is used.
        const two = read(paratrooper.replace("<secondn>\n1\n</secondn>", "<secondn>\n2\n</secondn>"));
        // The issue names the rule that holds it: the Paratroops' one a squad, not the crew.
        expect(two.issues).toEqual(["2 Sonic Stunner per squad are over the 1 secondary weapon a squad of Paratroops may carry (TO:AUE p.153); 1 used."]);
        // A file with no specialization has none of this.
        expect(read(mobSmall).platoon.getGunnery()).toBe(4);
        expect(read(mobSmall).notes.join(" ")).not.toContain("Veteran");
    });

    it("reads Paramedics and TAG troops, the flag and the TAG secondary weapon, and says what it assumed", () => {
        const medics = read(medic);
        expect(medics.issues).toEqual([]);
        expect([medics.platoon.getParamedicsPerSquad(), medics.platoon.getParamedicCount(), medics.platoon.getPrimaryCount()]).toEqual([1, 1, 6]);
        expect(medics.notes.join(" ")).toContain("paramedics and not how many");
        const spotters = read(tagSpotter);
        expect(spotters.issues).toEqual([]);
        expect([spotters.platoon.getTagTroopersPerSquad(), spotters.platoon.getTagTrooperCount(), spotters.platoon.isTagWorking(), spotters.platoon.getSecondaryWeapon()]).toEqual([2, 8, true, null]);
        // The flag with no TAG line: 2 a squad, said in a note.
        const flagOnly = read(laserTag);
        expect(flagOnly.issues).toEqual([]);
        expect(flagOnly.platoon.getTagTroopersPerSquad()).toBe(2);
        expect(flagOnly.notes.join(" ")).toContain("TAG troops and not how many");
        // Engineers have no secondary slot for a TAG trooper: reported.
        expect(read(sappers.replace("<specialization>\n10\n", "<specialization>\n1034\n")).issues.join(" ")).toContain("TAG troops have no secondary weapon slots");
    });

    it("reads XCT troops, the environment taken from the armor kit and said in a note", () => {
        const xct = read(xctMarine);
        expect(xct.issues).toEqual([]);
        expect([xct.platoon.getXCT(), xct.platoon.getArmor()?.name]).toEqual(["vacuum", "Environment Suit, Marine"]);
        expect(xct.notes.join(" ")).toContain("not which environment");
        expect(xct.platoon.getXCTProblem()).toBeNull();
        expect(read(xctMarine.replace("Environment Suit, Marine", "Flak, Standard").replace("<spacesuit>\ntrue\n</spacesuit>", "")).issues.join(" ")).toContain("suits no XCT environment");
    });

    it("reads Motorized SCUBA, Submarine and Microcopter motion types, and the SCUBA bit of a water beast", () => {
        const motorized = read(frogmen);
        expect(motorized.issues).toEqual([]);
        expect([motorized.platoon.getMotive().tag, motorized.platoon.getSquadSize(), motorized.platoon.getSquads(), motorized.platoon.getSecondaryPerSquad()]).toEqual(["scuba-motorized", 6, 2, 1]);
        expect(motorized.platoon.getGunnery()).toBe(3);
        const mech = read(mermen);
        expect(mech.issues).toEqual([]);
        expect([mech.platoon.getMotive().tag, mech.platoon.getTroopers(), mech.platoon.getSecondaryPerSquad(), mech.platoon.getMP()]).toEqual(["scuba-mech", 20, 2, 3]);
        const copter = read(microcopter);
        expect(copter.issues).toEqual([]);
        expect([copter.platoon.getMotive().tag, copter.platoon.getTroopers(), copter.platoon.getMP(), copter.platoon.getGunnery()]).toEqual(["microcopter", 16, 5, 4]);
        // Microlite and plain SCUBA too; a foot file with the SCUBA bit is standard SCUBA.
        expect(read(microcopter.replace("Microcopter", "Microlite").replace(">\n4\n<", ">\n2\n<")).platoon.getMotive().tag).toBe("microlite");
        expect(read(mobSmall.replace(">\nLeg\n<", ">\nSCUBA\n<")).platoon.getMotive().tag).toBe("scuba");
        const footBit = read(mobSmall + "\n<specialization>\n4096\n</specialization>");
        expect(footBit.platoon.getMotive().tag).toBe("scuba");
        // SCUBA on a motorized motion type is not a thing the book has.
        expect(read(mobSmall.replace(">\nLeg\n<", ">\nMotorized\n<") + "\n<specialization>\n4096\n</specialization>").issues.join(" ")).toContain("SCUBA needs the foot");
    });

    it("regroups the Hipposaur files' riders as the creatures' squads, and takes their SCUBA bit as the riders' gear", () => {
        const hippo = read(hipposaurFile);
        expect([hippo.platoon.getSquadSize(), hippo.platoon.getSquads(), hippo.platoon.getTroopers()]).toEqual([4, 2, 8]);
        expect(hippo.platoon.getMount()?.name).toBe("Hipposaur");
        expect(hippo.platoon.hasSpecialty("marines")).toBe(false);
        expect(hippo.notes.join(" ")).toContain("each Hipposaur carries 4 riders");
        // The file's 2 weapons for each of 2 riders are 4 for each of 4: over the 3 a Monstrous creature carries.
        expect(hippo.issues.join(" ")).toContain("per squad are over what a squad of 4 can crew; 3 used");
        expect(hippo.issues.join(" ")).not.toContain("SCUBA");
    });

    it("reports a specialization a platoon cannot have, and leaves the platoon", () => {
        const motorizedMountain = read(mountaineers.replace(">\nLeg\n<", ">\nMotorized\n<"));
        expect(motorizedMountain.issues.join(" ")).toContain("Mountain Troops use the Foot motive type");
        expect(motorizedMountain.platoon).not.toBeNull();
        expect(read(sappers.replace("<specialization>\n10\n</specialization>", "<specialization>\n16394\n</specialization>")).issues.join(" ")).toContain("has bits this builder does not know");
    });
});

// Weapons named by MegaMek that our catalog now holds: the IS pulse laser rifle by MegaMek name (TM p.349) and the two
// AToW Companion support weapons (p.195).
describe("MegaMek infantry files: weapons added from their books", () => {
    const heavy = (primary: string, secondary: string): string => infantryFile({
        Name: ["Heavy Foot"], Model: ["Support"], year: ["3085"], type: ["IS Level 3"], motion_type: ["Leg"], "Troopers Equipment": [],
        squad_size: ["6"], squadn: ["4"], secondn: ["1"], Primary: [primary], Secondary: [secondary],
    });

    it("reads the Inner Sphere pulse laser rifle, the Gungnir Gauss rifle and the Snub-Nose PPC", () => {
        const pulse = importBlkUnit(heavy("Pulse Laser Rifle (Inner Sphere)", "Gauss Rifle (Gungnir Heavy Support)"), ["infantry"]);
        expect(pulse.issues).toEqual([]);
        const platoon = pulse.unit as InfantryPlatoon;
        expect(platoon.getPrimaryWeapon().tag).toBe("inf-pulse-laser-rifle-is");
        expect(platoon.getSecondaryWeapon()?.tag).toBe("inf-gauss-rifle-gungnir-heavy-support");
        const ppc = importBlkUnit(heavy("Rifle (Makeshift)", "Support PPC (Snub-Nose)"), ["infantry"]);
        expect(ppc.issues).toEqual([]);
        expect((ppc.unit as InfantryPlatoon).getSecondaryWeapon()?.tag).toBe("inf-support-ppc-snub-nose");
    });
});

// MegaMek Combat Vehicle files, the lines the reader needs of each (the overviews cut). Each case is a real file the
// bundle left out for an import gap (#600, the Combat Vehicle round, Task 1).
const vehicleFile = (blocks: Record<string, string[]>): string => Object.entries(blocks).flatMap(([tag, lines]) => block(tag, ...lines)).join("\n");
const tankHeader = (name: string, model: string, year: string, type: string, motion: string, cruise: string, engine: string,
    armorType: string, armorLevel: string, armor: string[]): Record<string, string[]> => ({
    UnitType: ["Tank"], Name: [name], Model: [model], year: [year], type: [type], motion_type: [motion], cruiseMP: [cruise],
    engine_type: [engine], armor_type: [armorType], armor_tech_rating: ["0"], armor_tech_level: [armorLevel], armor,
});

describe("MegaMek Combat Vehicle files: the lines the reader lost (#600, Combat Vehicle round)", () => {
    const vehicleOf = (text: string): { vehicle: Vehicle; issues: string[] } => {
        const result = importBlkUnit(text, ["vehicles"]);
        return { vehicle: result.unit as Vehicle, issues: result.issues };
    };

    it("puts side weapons marked (ST) in their sponsons when the file has no SponsonTurret line (Galleon GAL-105)", () => {
        const { vehicle, issues } = vehicleOf(vehicleFile({
            ...tankHeader("Galleon Light Tank", "GAL-105", "3134", "IS Level 3", "Tracked", "6", "2", "1", "5", ["20", "17", "17", "17", "18"]),
            "Body Equipment": ["ISThumperCannonAmmo", "ISCASE"], "Front Equipment": [], "Right Equipment": ["ISERMediumLaser(ST)"],
            "Left Equipment": ["ISERMediumLaser(ST)"], "Rear Equipment": [], "Turret Equipment": ["ISThumperCannon"], tonnage: ["30.0"],
        }));
        expect(issues).toEqual([]);
        expect(vehicle.hasSponsonTurrets()).toBe(true);
        const lasers = vehicle.getEquipmentList().filter((item) => item.location === "right" || item.location === "left");
        expect(lasers).toHaveLength(2);
        expect(lasers.every((item) => vehicle.isSponsonMounted(item))).toBe(true);
    });

    it("puts an anti-missile system marked (ST) in a sponson: TO:AUE p.158 counts the sponson's weapons and equipment (Hexareme HQ)", () => {
        const { vehicle, issues } = vehicleOf(vehicleFile({
            ...tankHeader("Hexareme HQ Hovercraft", "", "3115", "IS Level 3", "Hover", "7", "2", "6", "5", ["40", "34", "34", "34", "34", "30", "32"]),
            transporters: ["troopspace:4.0"],
            "Body Equipment": ["ISAMS Ammo", "ISAMS Ammo", "IS Light Machine Gun Ammo - Half", "IS LB 2-X Cluster Ammo", "Communications Equipment:SIZE:3.0", "ISGuardianECMSuite", "ISCASE"],
            "Front Equipment": [], "Front Right Equipment": ["Light Machine Gun(ST)", "ISAntiMissileSystem(ST)"],
            "Front Left Equipment": ["Light Machine Gun(ST)", "ISAntiMissileSystem(ST)"], "Rear Right Equipment": [], "Rear Left Equipment": [],
            "Rear Equipment": [], "Turret Equipment": ["ISSNPPC", "ISLBXAC2"], tonnage: ["90.0"],
        }));
        expect(issues).toEqual([]);
        const sides = vehicle.getEquipmentList().filter((item) => item.location === "frontRight" || item.location === "frontLeft");
        expect(sides).toHaveLength(4);
        expect(sides.every((item) => vehicle.isSponsonMounted(item))).toBe(true);
        expect(vehicle.getCommunicationsTons()).toBe(3);
    });

    it("reads a Smart Robotic Control System line as the vehicle's robotic control (Swift Guardian, IO:AE pp.134-135)", () => {
        const { vehicle, issues } = vehicleOf(vehicleFile({
            ...tankHeader("Swift Guardian", "Tank", "2732", "IS Level 4", "Hover", "12", "0", "0", "0", ["3", "3", "3", "3", "4"]),
            "Body Equipment": ["SmartRoboticControlSystem"], "Front Equipment": [], "Right Equipment": [], "Left Equipment": [],
            "Rear Equipment": [], "Turret Equipment": ["Small Laser", "Small Laser"], tonnage: ["5.0"],
        }));
        expect(issues).toEqual([]);
        expect(vehicle.getRoboticControl().tag).toBe("srcs");
    });

    it("reads MegaMek's ISC3Sensors as C3 Remote Sensors ammunition, and a carrier control system's drones (Hi-Scout Drone Carrier (Cunnington))", () => {
        const { vehicle, issues } = vehicleOf(vehicleFile({
            ...tankHeader("Hi-Scout Drone Carrier", "(Cunnington)", "3077", "IS Level 4", "Tracked", "4", "2", "0", "1", ["22", "22", "22", "22"]),
            transporters: ["cargobay:13.5:1:1::-1:0"],
            "Body Equipment": ["ISC3Sensors", "ISC3Sensors", "ISC3Sensors", "ISAngelECMSuite", "ISC3MasterBoostedSystemUnit", "ISDroneCarrierControlSystem:SIZE:6.0", "ISLimitedAmphibiousChassis"],
            "Front Equipment": ["RemoteSensorDispenser"], "Right Equipment": [], "Left Equipment": [], "Rear Equipment": ["ISC3RemoteSensorLauncher"],
            tonnage: ["60.0"],
        }));
        expect(issues).toEqual([]);
        expect(vehicle.getEquipmentList().filter((item) => item.tag === "ammo-is-c3-remote-sensor-standard")).toHaveLength(3);
        const carrier = vehicle.getEquipmentList().find((item) => item.tag === "drone-carrier-control-system");
        expect(carrier?.controlledDrones).toBe(6);
    });

    it("reads a carrier control system sized for 5 drones: 2 tons + 0.5 a drone, 10,000 a ton (Hi-Scout Drone Carrier, TO:AUE pp.117, 219)", () => {
        const { vehicle, issues } = vehicleOf(vehicleFile({
            ...tankHeader("Hi-Scout Drone Carrier", "", "3000", "IS Level 3", "Tracked", "4", "1", "0", "1", ["18", "18", "18", "16", "18"]),
            transporters: ["cargobay:15.5:1:1::-1:0"],
            "Body Equipment": ["IS Ammo SRM-2", "ISDroneCarrierControlSystem:SIZE:5.0"], "Front Equipment": [], "Right Equipment": [],
            "Left Equipment": [], "Rear Equipment": [], "Turret Equipment": ["SRM 2"], tonnage: ["60.0"],
        }));
        expect(issues).toEqual([]);
        const carrier = vehicle.getEquipmentList().find((item) => item.tag === "drone-carrier-control-system");
        expect(carrier?.controlledDrones).toBe(5);
        expect(carrier?.weight).toBe(4.5);
        expect(carrier?.cbills).toBe(45000);
    });

    it("reads MegaMek's CLImpAmmoSRM6 as Improved SRM ammunition for the Improved SRM 6 (Zephyr Hovertank EC)", () => {
        const { vehicle, issues } = vehicleOf(vehicleFile({
            ...tankHeader("Zephyr Hovertank", "EC", "2820", "Mixed (IS Chassis) Experimental", "Hover", "9", "0", "1", "6", ["35", "28", "28", "18", "35"]),
            "Body Equipment": ["ISGuardianECMSuite", "CLImpAmmoSRM6", "CLImpAmmoSRM6"], "Front Equipment": ["Improved SRM 6"], "Right Equipment": [],
            "Left Equipment": [], "Rear Equipment": [], "Turret Equipment": ["ISTAG", "CLERMediumLaserPrototype", "CLERMediumLaserPrototype"],
            tonnage: ["40.0"],
        }));
        expect(issues).toEqual([]);
        expect(vehicle.getEquipmentList().filter((item) => item.tag === "ammo-clan-improved-srm-standard")).toHaveLength(2);
    });

    it("reads communications equipment by its size: 7 tons at 10,000 a ton (Mobile Headquarters; TM pp.212, 284)", () => {
        const { vehicle, issues } = vehicleOf(vehicleFile({
            ...tankHeader("Mobile Headquarters", "", "2620", "IS Level 2", "Wheeled", "6", "0", "0", "1", ["16", "19", "19", "16", "10"]),
            transporters: ["cargobay:0.5:1:1::-1:0"],
            "Body Equipment": ["Communications Equipment:SIZE:7.0"], "Front Equipment": [], "Right Equipment": [], "Left Equipment": [],
            "Rear Equipment": [], "Turret Equipment": ["Medium Laser"], tonnage: ["25.0"],
        }));
        expect(issues).toEqual([]);
        expect(vehicle.getCommunicationsTons()).toBe(7);
        const comms = vehicle.getEquipmentList().filter((item) => item.tag === "communications-equipment");
        expect(comms.reduce((sum, item) => sum + item.weight, 0)).toBe(7);
        expect(comms.reduce((sum, item) => sum + (item.cbills ?? 0), 0)).toBe(70000);
    });

    it("reads a MASH by its theaters: the core unit and 6 added theaters for 7 (MIT23 MASH Vehicle; TM p.228)", () => {
        const { vehicle, issues } = vehicleOf(vehicleFile({
            ...tankHeader("MIT23 MASH Vehicle", "", "3067", "IS Level 3", "Wheeled", "5", "0", "0", "1", ["20", "13", "13", "10"]),
            "Body Equipment": ["MASH Equipment:SIZE:7.0"], "Front Equipment": [], "Right Equipment": [], "Left Equipment": [],
            "Rear Equipment": [], tonnage: ["20.0"],
        }));
        expect(issues).toEqual([]);
        expect(vehicle.getEquipmentList().filter((item) => item.tag === "mash-core")).toHaveLength(1);
        expect(vehicle.getEquipmentList().filter((item) => item.tag === "mash-theater")).toHaveLength(6);
    });
});

describe("MegaMek engineless trailers and ammunition carriages (#600, Combat Vehicle round; TM pp.98-104)", () => {
    it("reads engine code 8 as no engine: no engine, control systems or crew, Cruise MP 0 (J-27 Ordnance Transport (Trailer), TM p.99)", () => {
        const result = importBlkUnit(vehicleFile({
            ...tankHeader("J-27 Ordnance Transport", "(Trailer)", "2650", "IS Level 1", "Tracked", "0", "8", "0", "1", ["4", "4", "4", "4"]),
            transporters: ["cargobay:8.0:1:1::-1:0"],
            "Body Equipment": [], "Front Equipment": ["Hitch"], "Right Equipment": [], "Left Equipment": [], "Rear Equipment": [],
            tonnage: ["10.0"], hasNoControlSystems: ["1"], trailer: ["1"],
        }), ["vehicles"]);
        expect(result.issues).toEqual([]);
        const trailer = result.unit as Vehicle;
        expect(trailer.isUnpoweredTrailer()).toBe(true);
        expect([trailer.getEngineWeight(), trailer.getControlSystemsWeight(), trailer.getCrew(), trailer.getCruiseMP()]).toEqual([0, 0, 0, 0]);
        expect(trailer.getEquipmentList().filter((item) => item.tag === "trailer-hitch")).toHaveLength(1);
        // The MUL's value for the design; an unmotorized trailer's Flanking MP is 1 (TM p.308).
        expect(trailer.getBattleValue("total-warfare")).toBe(44);
        // Structure 1 t and 16 armor points = 1 t at 10,000 a ton, a cargo bay door 1,000 (TM pp.294-295), no engine or control systems; x 1.1 for tracked at 10 t.
        expect(trailer.getCBillCost()).toBe(Math.round(21000 * 1.1));
    });

    it("carries Long Tom ammunition with no Long Tom, for the gun carriage to fire (LT-MOB-25F (Ammunition Carriage))", () => {
        const result = importBlkUnit(vehicleFile({
            ...tankHeader("Mobile Long Tom Artillery", "LT-MOB-25F (Ammunition Carriage)", "2695", "IS Level 3", "Tracked", "0", "8", "1", "1", ["15", "16", "16", "15"]),
            "Body Equipment": ["ISCASE", "ISLongTomAmmo", "ISLongTomAmmo", "ISLongTomAmmo", "ISLongTomAmmo", "ISLongTomAmmo"],
            "Front Equipment": ["Hitch"], "Right Equipment": [], "Left Equipment": [], "Rear Equipment": ["Hitch"],
            tonnage: ["10.0"], hasNoControlSystems: ["1"], trailer: ["1"],
        }), ["vehicles"]);
        expect(result.issues).toEqual([]);
        const carriage = result.unit as Vehicle;
        expect(carriage.getEquipmentList().filter((item) => item.tag === "ammo-long-tom-standard")).toHaveLength(5);
        expect(carriage.getEquipmentList().filter((item) => item.tag === "trailer-hitch")).toHaveLength(2);
        expect(carriage.getBattleValue("total-warfare")).toBe(148);
    });
});

describe("Minesweeper, Mobile Field Base and the vehicle Cockpit Command Console (#600, Combat Vehicle round; TO:AUE pp.112, 138, 142)", () => {
    const scorpion = (motion: string, extra: Record<string, string[]> = {}) => importBlkUnit(vehicleFile({
        ...tankHeader("Scorpion Light Tank", "(Minesweeper)", "3087", "IS Level 3", motion, "4", "6", "4", "5", ["16", "11", "11", "10"]),
        "Body Equipment": ["IS Machine Gun Ammo - Half", "IS Ammo LRM-5", "IS Ammo LRM-5", "IS Ammo LRM-5"],
        "Front Equipment": ["LRM 5", "LRM 5", "Machine Gun", "ISMineSweeper"], "Right Equipment": [], "Left Equipment": [], "Rear Equipment": [],
        tonnage: ["25.0"], ...extra,
    }), ["vehicles"]);

    it("keeps the three records as the Advanced Units and Equipment tables print them (pp.138, 142, 221, 219)", () => {
        const sweep = scorpion("Tracked");
        const minesweeper = (sweep.unit as Vehicle).getEquipmentList().find((item) => item.tag === "minesweeper");
        expect([minesweeper?.weight, minesweeper?.cbills, minesweeper?.battleValue, minesweeper?.battleValueDefensive, minesweeper?.book, minesweeper?.page])
            .toEqual([3, 40000, 30, true, "TO:AUE", 138]);
        const field = (importBlkUnit(vehicleFile({
            ...tankHeader("Glaive Medium Tank", "(MFB)", "3068", "IS Level 3", "Wheeled", "5", "0", "0", "1", ["16", "11", "11", "10"]),
            "Body Equipment": ["ISMobileFieldBase", "ISLimitedAmphibiousChassis"], "Front Equipment": [], "Right Equipment": [], "Left Equipment": [], "Rear Equipment": [],
            tonnage: ["45.0"],
        }), ["vehicles"]));
        const base = (field.unit as Vehicle).getEquipmentList().find((item) => item.tag === "mobile-field-base");
        expect([base?.weight, base?.cbills, base?.battleValue, base?.book, base?.page]).toEqual([20, 150000, 0, "TO:AUE", 142]);
        expect(field.issues).toEqual([]);
        const fury = importBlkUnit(vehicleFile({
            ...tankHeader("Fury Command Tank", "CX-17", "3052", "IS Level 4", "Tracked", "4", "4", "2", "7", ["58", "38", "38", "34", "56"]),
            "Body Equipment": ["ISTankCockpitCommandConsole", "ISAngelECMSuite", "IS LB 5-X AC Ammo", "ISDroneCarrierControlSystem:SIZE:5.0"],
            "Front Equipment": [], "Right Equipment": [], "Left Equipment": [], "Rear Equipment": ["Hitch"], "Turret Equipment": ["ISLBXAC5", "ISLBXAC5"],
            tonnage: ["80.0"],
        }), ["vehicles"]);
        const console = (fury.unit as Vehicle).getEquipmentList().find((item) => item.tag === "vehicle-cockpit-command-console");
        expect([console?.weight, console?.cbills, console?.battleValue, console?.book, console?.page]).toEqual([3, 500000, 0, "TO:AUE", 112]);
    });

    it("reads a Minesweeper line on a Tracked vehicle at the MUL Battle Value of 452 (Scorpion Light Tank (Minesweeper))", () => {
        const result = scorpion("Tracked");
        expect(result.issues).toEqual([]);
        expect((result.unit as Vehicle).getBattleValue("total-warfare")).toBe(452);
    });

    it("gives the Alpha Strike card the MSW special for a Minesweeper and MFB for a Mobile Field Base (ASC pp.87-88)", () => {
        const sweeper = scorpion("Tracked").unit as Vehicle;
        expect(sweeper.getAlphaStrikeStats().specialAbilities).toContain("MSW");
        sweeper.addEquipmentFromTag("mobile-field-base");
        expect(sweeper.getAlphaStrikeStats().specialAbilities).toContain("MFB");
    });

    it("mounts a land Minesweeper only on a Wheeled or Tracked vehicle, in a front or rear location (TO:AUE p.138)", () => {
        const tank = (scorpion("Tracked").unit as Vehicle);
        const sweeper = () => tank.getEquipmentList().filter((item) => item.tag === "minesweeper");
        expect(sweeper()).toHaveLength(1);
        tank.addEquipmentFromTag("minesweeper", "right");
        expect(sweeper().every((item) => item.location !== "right")).toBe(true);
        // A hover vehicle is offered none: a land Minesweeper is for Wheeled and Tracked, a maritime one for displacement hull, hydrofoil and submarine.
        const offered = (motion: string, tag: string) => (scorpion(motion, { armor_type: ["0"] }).unit as Vehicle).getAvailableEquipment(false, 3).some((item) => item.tag === tag);
        expect([offered("Tracked", "minesweeper"), offered("Wheeled", "minesweeper"), offered("Hover", "minesweeper")]).toEqual([true, true, false]);
    });
});

// Files that break the construction rules, imported as printed with a note (NGCFells 2026-11-23, owner call 6); the
// bundle flags each "illegal as printed" (BLK_ILLEGAL_AS_PRINTED).
describe("MegaMek Combat Vehicle files that break the rules, as printed (#600, Combat Vehicle round)", () => {
    it("carries the Support Vehicle Off-Road chassis the Jeep lists, with a note", () => {
        const result = importBlkUnit(vehicleFile({
            ...tankHeader("Jeep", "", "1950", "IS Level 3", "Wheeled", "7", "1", "0", "1", ["4", "4", "4", "4"]),
            transporters: ["troopspace:2.0"], "Body Equipment": ["ISOffRoadChassis"], "Front Equipment": [], "Right Equipment": [], "Left Equipment": [], "Rear Equipment": [], tonnage: ["5.0"],
        }), ["vehicles"]);
        expect(result.issues).toEqual([]);
        expect((result.unit as Vehicle).getPrintedSupportItems()).toEqual(["Off-Road chassis"]);
        expect(result.notes.join(" ")).toContain("Support Vehicle");
    });

    it("carries the Armored Chassis and Advanced Fire Control the Nike Air Defense Platform lists, with a note", () => {
        const result = importBlkUnit(vehicleFile({
            ...tankHeader("Nike Air Defense Platform", "", "3079", "IS Level 3", "Tracked", "3", "6", "0", "1", ["35", "20", "20", "20", "35"]),
            "Body Equipment": ["Armored Chassis", "Advanced Fire Control", "IS Ammo LAC/2", "IS Ammo LAC/2", "IS LB 5-X AC Ammo", "IS LB 5-X AC Ammo"],
            "Front Equipment": [], "Right Equipment": [], "Left Equipment": [], "Rear Equipment": [],
            "Turret Equipment": ["Light Auto Cannon/2", "Light Auto Cannon/2", "ISLBXAC5", "ISLBXAC5"], tonnage: ["90.0"],
        }), ["vehicles"]);
        expect(result.issues).toEqual([]);
        expect((result.unit as Vehicle).getPrintedSupportItems()).toEqual(["Armored chassis", "Advanced Fire Control"]);
        expect(result.notes.join(" ")).toContain("Support Vehicle");
    });

    it("builds a Clan design's heavy ferro-fibrous as the Inner Sphere armor on a mixed chassis, with a note (Huitzilopochtli 'Huey' (AAA))", () => {
        const result = importBlkUnit(vehicleFile({
            ...tankHeader("Huitzilopochtli Assault Tank 'Huey'", "(AAA)", "3060", "Clan Level 3", "Tracked", "3", "3", "6", "6", ["40", "30", "30", "30", "40"]),
            "Body Equipment": [], "Front Equipment": [], "Right Equipment": [], "Left Equipment": [], "Rear Equipment": [], "Turret Equipment": [], tonnage: ["85.0"],
        }), ["vehicles"]);
        expect(result.issues).toEqual([]);
        const tank = result.unit as Vehicle;
        expect([tank.getTech().tag, tank.getArmorType().tag, tank.getArmorTechBase()]).toEqual(["mclan", "heavy-ferro-fibrous", "is"]);
        expect(result.notes.join(" ")).toContain("is Inner Sphere armor on a Clan design");
    });
});

describe("MegaMek Super-Heavy VTOL files (#600, Combat Vehicle round; TO:AUE p.190)", () => {
    it("reads the Kamakiri Attack VTOL with its four facings and rotor, at the MUL and MegaMek BV of 1,378", () => {
        const result = importBlkUnit(vehicleFile({
            UnitType: ["VTOL"], Name: ["Kamakiri Attack VTOL"], Model: [""], year: ["3100"], type: ["IS Level 3"], motion_type: ["VTOL"],
            cruiseMP: ["7"], engine_type: ["2"], armor_type: ["3"], armor_tech_rating: ["0"], armor_tech_level: ["5"],
            armor: ["36", "28", "28", "18", "2"],
            "Body Equipment": ["IS Ammo Thunderbolt-10", "IS Ammo Thunderbolt-10", "IS Ammo Thunderbolt-10"],
            "Front Equipment": ["PPC", "Thunderbolt 10", "Thunderbolt 10"], "Right Equipment": [], "Left Equipment": [], "Rear Equipment": [],
            "Rotor Equipment": [], tonnage: ["55.0"],
        }), ["vehicles"]);
        expect(result.issues).toEqual([]);
        const vehicle = result.unit as Vehicle;
        expect(vehicle.isSuperheavy()).toBe(true);
        expect(vehicle.getArmorAllocation()).toMatchObject({ front: 36, right: 28, left: 28, rear: 18, rotor: 2 });
        expect(vehicle.getBattleValue("total-warfare")).toBe(1378);
        // The MUL card: Size 2, 14"v, TMM 3, 2/3/3/0, Armor 4, Structure 3 (the rotor's armor counts in the total).
        const card = vehicle.getAlphaStrikeStats();
        expect([card.size, card.tmm, card.armor, card.structure]).toEqual([2, 3, 4, 3]);
        expect(card.damage).toEqual({ short: 2, medium: 3, long: 3, extreme: 0 });
    });
});
