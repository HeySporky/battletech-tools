import { describe, expect, it } from "vitest";
import { convertMtfToSSW, correctMtfDesign, importBattleMechMtf, parseMtfFile } from "./battlemech-mtf";

// Synthetic MegaMek files: the shape of a MegaMekLab save, with made-up designs.
const location = (name: string, ...slots: string[]): string[] =>
    [`${name}:`, ...slots, ...Array(12 - slots.length).fill("-Empty-"), ""];
const fill = (count: number, slot: string): string[] => Array(count).fill(slot);
const armor = (points: number[]): string[] => ["LA", "RA", "LT", "RT", "CT", "HD", "LL", "RL", "RTL", "RTR", "RTC"]
    .map((loc, index) => `${loc} armor:${points[index]}`);

// A Clan striker: Clan XL engine, endo steel, ferro-fibrous, two Clan double heat sinks outside the engine, Artemis IV,
// environmental sealing in every location and Battlefists on both hands.
const striker = [
    "chassis:Test Striker", "model:TS-1C", "Config:Biped", "techbase:Clan", "era:3060", "rules level:2", "mass:35",
    "engine:315 XL (Clan) Engine", "structure:Clan Endo Steel", "myomer:Standard", "heat sinks:12 Clan Double",
    "walk mp:9", "jump mp:0", "armor:Ferro-Fibrous(Clan)", ...armor([8, 8, 10, 10, 13, 9, 10, 10, 3, 3, 4]),
    "quirk:battle_fists_la", "quirk:battle_fists_ra", "",
    ...location("Left Arm", "Shoulder", "Upper Arm Actuator", "Lower Arm Actuator", "Hand Actuator", "CLSRM6", "CLArtemisIV",
        "Clan Endo Steel", "Environmental Sealing (Mech)", "Clan Ferro-Fibrous"),
    ...location("Right Arm", "Shoulder", "Upper Arm Actuator", "Lower Arm Actuator", "Hand Actuator", "CLERMediumLaser",
        "Clan Endo Steel", "Environmental Sealing (Mech)", "Clan Ferro-Fibrous"),
    ...location("Left Torso", "Fusion Engine", "Fusion Engine", "Clan Ammo SRM-6", ...fill(2, "CLDoubleHeatSink"),
        ...fill(3, "Clan Ferro-Fibrous"), "Clan Endo Steel", "Environmental Sealing (Mech)"),
    ...location("Right Torso", "Fusion Engine", "Fusion Engine", "Clan Streak SRM 4 Ammo", ...fill(2, "CLDoubleHeatSink"),
        ...fill(2, "Clan Ferro-Fibrous"), ...fill(2, "Clan Endo Steel"), "Environmental Sealing (Mech)"),
    ...location("Center Torso", ...fill(3, "Fusion Engine"), ...fill(4, "Gyro"), ...fill(3, "Fusion Engine"), "CLStreakSRM4",
        "Environmental Sealing (Mech)"),
    ...location("Head", "Life Support", "Sensors", "Cockpit", "Environmental Sealing (Mech)", "Sensors", "Life Support"),
    ...location("Left Leg", "Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator", "Clan Endo Steel",
        "Environmental Sealing (Mech)"),
    ...location("Right Leg", "Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator", "Clan Endo Steel",
        "Environmental Sealing (Mech)"),
].join("\n");

// An Inner Sphere brawler: a variable-size hatchet and a three-slot IS double heat sink.
const brawler = [
    "chassis:Test Brawler", "model:TB-2", "Config:Biped", "techbase:Inner Sphere", "era:3058", "rules level:2", "mass:50",
    "engine:250 Fusion Engine", "structure:IS Standard", "myomer:Standard", "heat sinks:11 Double", "walk mp:5", "jump mp:0",
    "armor:Standard(Inner Sphere)", ...armor([14, 14, 18, 18, 22, 9, 18, 18, 5, 5, 6]), "",
    ...location("Left Arm", "Shoulder", "Upper Arm Actuator", "Lower Arm Actuator", "Hand Actuator", ...fill(3, "Hatchet")),
    ...location("Right Arm", "Shoulder", "Upper Arm Actuator", "Lower Arm Actuator", "Hand Actuator", "Medium Laser"),
    ...location("Left Torso", ...fill(3, "ISDoubleHeatSink"), "Medium Laser"),
    ...location("Right Torso", "Medium Laser"),
    ...location("Center Torso", ...fill(3, "Fusion Engine"), ...fill(4, "Gyro"), ...fill(3, "Fusion Engine")),
    ...location("Head", "Life Support", "Sensors", "Cockpit", "-Empty-", "Sensors", "Life Support"),
    ...location("Left Leg", "Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator"),
    ...location("Right Leg", "Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator"),
].join("\n");

// An Inner Sphere quad: MegaMek's leg names.
const quad = [
    "chassis:Test Walker", "model:TW-1", "Config:Quad", "techbase:Inner Sphere", "era:3025", "rules level:1", "mass:50",
    "engine:250 Fusion Engine", "structure:IS Standard", "myomer:Standard", "heat sinks:10 Single", "walk mp:5", "jump mp:0",
    "armor:Standard(Inner Sphere)", "FLL armor:12", "FRL armor:12", "LT armor:16", "RT armor:16", "CT armor:20", "HD armor:9",
    "RLL armor:12", "RRL armor:12", "RTL armor:4", "RTR armor:4", "RTC armor:5", "",
    ...location("Front Left Leg", "Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator"),
    ...location("Front Right Leg", "Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator"),
    ...location("Left Torso", "Large Laser", "Large Laser"),
    ...location("Right Torso", "Large Laser", "Large Laser"),
    ...location("Center Torso", ...fill(3, "Fusion Engine"), ...fill(4, "Gyro"), ...fill(3, "Fusion Engine")),
    ...location("Head", "Life Support", "Sensors", "Cockpit", "-Empty-", "Sensors", "Life Support"),
    ...location("Rear Left Leg", "Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator"),
    ...location("Rear Right Leg", "Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator"),
].join("\n");

// A 150-ton superheavy (IO:AE pp.154-157): every item but the actuators in half its slots (a Gauss Rifle in 4),
// two tons of ammunition sharing one slot, and MegaMek's superheavy cockpit and gyro.
const superheavy = [
    "chassis:Test Colossus", "model:TC-X", "Config:Biped", "techbase:Inner Sphere", "era:3076", "rules level:3", "mass:150",
    "engine:300 Fusion Engine(IS)", "structure:IS Standard", "myomer:Standard", "cockpit:Superheavy Cockpit", "gyro:Superheavy Gyro",
    "heat sinks:10 Single", "walk mp:2", "jump mp:0", "armor:Standard (IS)", ...armor([30, 30, 30, 30, 40, 12, 40, 40, 10, 10, 10]), "",
    ...location("Left Arm", "Shoulder", "Upper Arm Actuator", "Lower Arm Actuator", "Hand Actuator", ...fill(3, "ISLBXAC10")),
    ...location("Right Arm", "Shoulder", "Upper Arm Actuator", "Lower Arm Actuator", "Hand Actuator", "Medium Laser"),
    ...location("Left Torso", ...fill(4, "ISGaussRifle"), "IS Gauss Ammo|IS Gauss Ammo"),
    ...location("Right Torso", "IS LB 10-X AC Ammo|IS LB 10-X Cluster Ammo"),
    ...location("Center Torso", ...fill(3, "Fusion Engine"), ...fill(2, "Gyro")),
    ...location("Head", "Life Support", "Sensors", "Cockpit", "-Empty-", "Sensors", "Life Support"),
    ...location("Left Leg", "Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator"),
    ...location("Right Leg", "Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator"),
].join("\n");

// A tripod (IO:AE pp.128-130): a real Center Leg, its armor, and a laser mounted in it.
const tripod = brawler.replace("Config:Biped", "Config:Tripod").replace("walk mp:5", "walk mp:5\ncockpit:Tripod Cockpit")
    .replace("RL armor:18", "RL armor:18\nCL armor:16") + "\n"
    + location("Center Leg", "Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator", "Medium Laser").join("\n");

// A LAM (IO:AE p.108): MegaMek's "lam" line, Landing Gear in the center and side torsos, and Avionics in the side
// torsos and head slot 4, like the Shadow Hawk LAM SHD-X1.
const lam = [
    "chassis:Test Flyer", "model:TF-1L", "Config:LAM", "techbase:Inner Sphere", "era:2690", "rules level:4", "mass:50",
    "engine:250 Fusion Engine", "structure:IS Standard", "myomer:Standard", "lam:Standard", "heat sinks:10 Single",
    "walk mp:5", "jump mp:3", "armor:Standard(Inner Sphere)", ...armor([10, 10, 12, 12, 15, 9, 12, 12, 3, 3, 4]), "",
    ...location("Left Arm", "Shoulder", "Upper Arm Actuator", "Lower Arm Actuator", "Hand Actuator"),
    ...location("Right Arm", "Shoulder", "Upper Arm Actuator", "Lower Arm Actuator", "Hand Actuator", "Medium Laser"),
    ...location("Left Torso", "Landing Gear", "Avionics", "Jump Jet", "Medium Laser"),
    ...location("Right Torso", "Landing Gear", "Avionics", "Jump Jet"),
    ...location("Center Torso", ...fill(3, "Fusion Engine"), ...fill(4, "Gyro"), ...fill(3, "Fusion Engine"), "Landing Gear", "Jump Jet"),
    ...location("Head", "Life Support", "Sensors", "Cockpit", "Avionics", "Sensors", "Life Support"),
    ...location("Left Leg", "Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator"),
    ...location("Right Leg", "Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator"),
].join("\n");

// A Clan QuadVee (IO:AE pp.127-128): MegaMek's motive line, QuadVee cockpit in head slots 3-4, and Conversion Gear and
// Tracks in every leg; endo steel and ferro-fibrous like the Arion.
const quadVeeLeg = ["Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator", "Conversion Gear", "Tracks"];
const quadVee = quad.replace("Config:Quad", "Config:QuadVee").replace("techbase:Inner Sphere", "techbase:Clan")
    .replace("structure:IS Standard", "structure:Clan Endo Steel").replace("armor:Standard(Inner Sphere)", "armor:Ferro-Fibrous(Clan)")
    .replace("walk mp:5", "walk mp:5\nmotive:Track\ncockpit:QuadVee Cockpit")
    .replace(/(Front|Rear) (Left|Right) Leg:\nHip\nUpper Leg Actuator\nLower Leg Actuator\nFoot Actuator\n-Empty-\n-Empty-/g,
        (_, end, side) => `${end} ${side} Leg:\n${quadVeeLeg.join("\n")}`)
    .replace("Large Laser\nLarge Laser\n-Empty-\n-Empty-\n-Empty-\n-Empty-\n-Empty-\n-Empty-\n-Empty-",
        "CLERMediumLaser\n" + fill(7, "Clan Endo Steel").join("\n") + "\n-Empty-")
    .replace("Large Laser\nLarge Laser\n-Empty-\n-Empty-\n-Empty-\n-Empty-\n-Empty-\n-Empty-\n-Empty-",
        "CLERMediumLaser\n" + fill(7, "Clan Ferro-Fibrous").join("\n") + "\n-Empty-")
    .replace("Head:\nLife Support\nSensors\nCockpit\n-Empty-", "Head:\nLife Support\nSensors\nCockpit\nCockpit");

describe("MegaMek 'Mech import", () => {
    it("rejects what is not a MegaMek 'Mech file", () => {
        expect(parseMtfFile("")).toBeNull();
        expect(parseMtfFile("Name:Nothing")).toBeNull();
        expect(importBattleMechMtf("no chassis here").mech).toBeNull();
    });

    it("reads a Clan 'Mech: tech base, Clan-only weapons, sinks, structure and armor slots, sealing and Artemis", () => {
        const { mech, issues, xml } = importBattleMechMtf(striker);
        expect(issues).toEqual([]);
        expect(mech?.getTech().tag).toBe("clan");
        expect(mech?.getInternalStructureType()).toBe("endo-steel");
        expect(mech?.getArmorType()).toBe("ferro-fibrous");
        const tags = mech!.getInstalledEquipment().map((item) => item.tag);
        // MegaMek's CLStreakSRM4 is the Clan launcher, not the Inner Sphere one.
        expect(tags).toContain("clan-streak-srm-4");
        expect(tags).not.toContain("streak-srm-4");
        expect(tags.filter((tag) => tag === "environmental-sealing")).toHaveLength(1);
        // Two Clan doubles take two slots each: one location per sink.
        expect(xml.match(/<heatsinks[^>]*>[\s\S]*?<\/heatsinks>/)?.[0].match(/<location /g)).toHaveLength(2);
        expect(xml).toContain(`fcsa4="TRUE"`);
        expect(mech!.getBattleValue()).toBeGreaterThan(0);
    });

    it("pays Battlefists on both hands once, naming no hand (CO p.225)", () => {
        const { mech } = importBattleMechMtf(striker);
        const fists = mech!.quirks.getAll().filter((quirk) => quirk.tag === "quirk-battlefists");
        expect(fists).toHaveLength(1);
        expect(fists[0].location).toBeUndefined();
    });

    it("reads a variable-size hatchet as one item and three-slot IS double heat sinks", () => {
        const { mech, issues, xml } = importBattleMechMtf(brawler);
        expect(issues).toEqual([]);
        expect(mech!.getInstalledEquipment().filter((item) => item.tag === "melee-hatchet")).toHaveLength(1);
        expect(xml.match(/<heatsinks[^>]*>[\s\S]*?<\/heatsinks>/)?.[0].match(/<location /g)).toHaveLength(1);
    });

    it("keeps each ton of ammunition with the launcher size its line names (TM p.303)", () => {
        // The LRM 10 comes first, so a bin not kept with its launcher would count as LRM 10 ammunition.
        const twoSizes = brawler
            .replace([...location("Left Torso", ...fill(3, "ISDoubleHeatSink"), "Medium Laser")].join("\n"),
                [...location("Left Torso", ...fill(3, "ISDoubleHeatSink"), ...fill(2, "ISLRM10"), "IS Ammo LRM-20 (OMNIPOD)", "IS Ammo LRM-10")].join("\n"))
            .replace([...location("Right Torso", "Medium Laser")].join("\n"), [...location("Right Torso", ...fill(5, "ISLRM20"))].join("\n"));
        expect(twoSizes).toContain("IS Ammo LRM-20 (OMNIPOD)");
        expect(twoSizes).toContain("ISLRM20");
        const { mech, issues } = importBattleMechMtf(twoSizes);
        expect(issues).toEqual([]);
        const bins = mech!.getInstalledEquipment().filter((item) => item.isAmmo);
        expect(bins.map((bin) => mech!.getAmmoBinWeapon(bin)?.tag).sort()).toEqual(["lrm-10", "lrm-20"]);
        mech!.getBattleValue();
        const ammo = mech!.getBattleValueBreakdown().steps.filter((step) => step.id === "bv2.off.ammo");
        expect(ammo.map((step) => step.value).sort()).toEqual([11, 23]);
    });

    // mordel.net's MegaMek-format files (#241): "Standard (IS)" armor, TSM slots named "TSM", an empty Center Leg on a
    // biped, "Biped Omnimech", and a mixed-tech 'Mech's "Double" sinks whose Clan tech only the slot names give
    // (Jackalope JLP-NH).
    it("reads mordel.net's spellings", () => {
        const mordel = brawler.replace("armor:Standard(Inner Sphere)", "armor:Standard (IS)").replace("techbase:Inner Sphere", "techbase:Mixed (IS Chassis)").replace("myomer:Standard", "myomer:Triple-Strength")
            .replace(/ISDoubleHeatSink\nISDoubleHeatSink\nISDoubleHeatSink\n/, "CLDoubleHeatSink\nCLDoubleHeatSink\nTSM\n")
            .replace("Medium Laser" + "\n-Empty-".repeat(5), "Medium Laser" + "\nTSM".repeat(5)) + "\n" + location("Center Leg").join("\n");
        const { mech, issues, xml } = importBattleMechMtf(mordel);
        expect(issues).toEqual([]);
        expect(mech!.getArmorType()).toBe("standard");
        expect(xml.match(/<enhancement[^>]*>[\s\S]*?<\/enhancement>/)?.[0].match(/<location /g)).toHaveLength(6);
        expect(xml).toMatch(/<heatsinks number="11" techbase="1">/);
        expect(convertMtfToSSW(parseMtfFile(mordel.replace("Config:Biped", "Config:Biped Omnimech"))!).xml).toContain(`omnimech="TRUE"`);
    });

    it("reads Heavy Industrial armor as Standard armor (TM p.205)", () => {
        const { mech, issues } = importBattleMechMtf(brawler.replace("armor:Standard(Inner Sphere)", "armor:Heavy Industrial(Inner Sphere)"));
        expect(issues).toEqual([]);
        expect(mech!.getArmorType()).toBe("standard");
    });

    // MegaMek gives an IndustrialMech with Advanced Fire Control a BattleMech cockpit and writes no line for a
    // Standard one (its Mek.hasAdvancedFireControl); an Industrial cockpit is the one without (#371).
    it("reads an IndustrialMech's BattleMech cockpit as Advanced Fire Control", () => {
        const industrial = brawler.replace("structure:IS Standard", "structure:IS Industrial");
        expect(importBattleMechMtf(industrial).mech!.hasAdvancedFireControl()).toBe(true);
        expect(importBattleMechMtf(industrial.replace("structure:", "cockpit:Primitive Cockpit\nstructure:")).mech!.hasAdvancedFireControl()).toBe(true);
        expect(importBattleMechMtf(industrial.replace("structure:", "cockpit:Industrial Cockpit\nstructure:")).mech!.hasAdvancedFireControl()).toBe(false);
        expect(importBattleMechMtf(brawler).mech!.isIndustrialMech()).toBe(false);
    });

    // "BV is equal to a 10 point minefield" of its mines (TO:AUE p.195): 8 for standard ones (p.197), offensive (#371).
    it("counts a Vehicular Mine Dispenser as 8 offensive BV", () => {
        const mined = brawler.replace("Right Torso:\nMedium Laser\n-Empty-", "Right Torso:\nMedium Laser\nISVehicularMineDispenser");
        const { mech, issues } = importBattleMechMtf(mined);
        expect(issues).toEqual([]);
        expect(mech!.getInstalledEquipment().map((item) => item.tag)).toContain("vehicular-mine-dispenser");
        expect(Math.abs(mech!.getBattleValue() - importBattleMechMtf(brawler).mech!.getBattleValue() - 8 * 1.37)).toBeLessThan(1);
    });

    it("reads a quad's legs", () => {
        const file = parseMtfFile(quad)!;
        const { issues, quad: isQuad } = convertMtfToSSW(file);
        expect(issues).toEqual([]);
        expect(isQuad).toBe(true);
        const { mech, issues: imported } = importBattleMechMtf(quad);
        expect(imported).toEqual([]);
        expect(mech?.isQuad()).toBe(true);
        expect(mech!.getInstalledEquipment().filter((item) => item.tag === "large-laser")).toHaveLength(2);
    });

    it("keeps a quad's front-leg ammunition in the front leg, where its explosion counts (TM p.302)", () => {
        const armed = quad.replace("Left Torso:\nLarge Laser\nLarge Laser\n-Empty-", "Left Torso:\nLarge Laser\nLarge Laser\nMachine Gun")
            .replace("Front Right Leg:\nHip\nUpper Leg Actuator\nLower Leg Actuator\nFoot Actuator\n-Empty-", "Front Right Leg:\nHip\nUpper Leg Actuator\nLower Leg Actuator\nFoot Actuator\nIS Ammo MG - Half");
        expect(armed).toContain("IS Ammo MG - Half");
        const { mech, issues } = importBattleMechMtf(armed);
        expect(issues).toEqual([]);
        const ammo = mech!.getInstalledEquipment().find((item) => item.isAmmo);
        expect(ammo?.location).toBe("frl");
        expect(mech!.getCriticals().frontRightLeg?.[4]?.name).toBe(ammo?.name);
        const steps = mech!.getBattleValueBreakdown("total-warfare").steps.filter((step) => step.id === "bv2.def.explosive.ammo");
        expect(steps.map((step) => step.value)).toEqual([-15]);
    });

    it("keeps an OmniMech's pod items in its pods and the rest fixed (#112)", () => {
        const omni = brawler.replace("Config:Biped", "Config:Biped Omnimek").replace("Right Torso:\nMedium Laser", "Right Torso:\nMedium Laser (omnipod)");
        const { mech, issues } = importBattleMechMtf(omni);
        expect(issues).toEqual([]);
        expect(mech?.isOmnimech).toBe(true);
        const lasers = mech!.getInstalledEquipment().filter((item) => item.tag === "medium-laser");
        expect(lasers.map((item) => !!item.omniFixed).sort()).toEqual([false, true, true]);
        expect(lasers.find((item) => !item.omniFixed)?.location).toBe("rt");
    });

    it("counts pod heat sinks and pod jump jets in an OmniMech's pod tonnage", () => {
        // MegaMek's "base chassis heat sinks" is the engine's capacity (12 in a Dire Wolf's 300 XL): the pod ones are marked.
        const omni = brawler.replace("Config:Biped", "Config:Biped Omnimek").replace("heat sinks:11 Double", "heat sinks:11 Double\nbase chassis heat sinks:10")
            .replace("Left Torso:\nISDoubleHeatSink\nISDoubleHeatSink\nISDoubleHeatSink", "Left Torso:\n" + fill(3, "ISDoubleHeatSink (omnipod)").join("\n"))
            .replace("jump mp:0", "jump mp:2").replace("Right Torso:\nMedium Laser\n-Empty-\n-Empty-", "Right Torso:\nMedium Laser (omnipod)\nJump Jet\nJump Jet (omnipod)");
        const { mech, issues } = importBattleMechMtf(omni);
        expect(issues).toEqual([]);
        // The pod laser, one double heat sink and one half-ton jump jet.
        expect(mech!.getOmniConfigurationStats()[0].podTonnage).toBe(1 + 1 + 0.5);
    });

    it("reads a superheavy 'Mech: half-size slots and two tons of ammunition to a slot (IO:AE pp.155-157)", () => {
        const { mech, issues } = importBattleMechMtf(superheavy);
        expect(issues).toEqual([]);
        expect(mech!.isSuperheavy()).toBe(true);
        const tags = mech!.getInstalledEquipment().map((item) => item.tag);
        expect(tags.filter((tag) => tag === "standard-gauss-rifle")).toHaveLength(1);
        expect(tags.filter((tag) => tag === "autocannon-lbx-10")).toHaveLength(1);
        const ammo = mech!.getInstalledEquipment().filter((item) => item.isAmmo);
        expect(ammo.filter((item) => item.location === "lt")).toHaveLength(2);
        expect(ammo.filter((item) => item.location === "rt")).toHaveLength(2);
    });

    // A Radical Heat Sink System is equipment (IO:AE p.185), not heat sinks: the Ares ARS-V1D Hephaestus carries one.
    it("reads a Radical Heat Sink System as the system, not as heat sinks", () => {
        const radical = brawler.replace(location("Right Torso", "Medium Laser").join("\n"),
            location("Right Torso", "Medium Laser", ...fill(3, "Radical Heat Sink System")).join("\n"));
        const { mech, issues } = importBattleMechMtf(radical);
        expect(issues).toEqual([]);
        expect(mech!.getInstalledEquipment().filter((item) => item.tag === "radical-heat-sink-system")).toHaveLength(1);
        expect(mech!.getHeatSinks()).toBe(11);
    });

    // Prototype double heat sinks go beside single heat sinks, never in the engine (IO:AE p.65). MegaMek counts them
    // in its "heat sinks" line: the Black Knight BL-6-KNT Ian lists 15 Single, three of them prototype doubles.
    it("reads prototype double heat sinks as equipment beside the single heat sinks", () => {
        const prototype = brawler.replace("heat sinks:11 Double", "heat sinks:12 Single")
            .replace(location("Left Torso", ...fill(3, "ISDoubleHeatSink"), "Medium Laser").join("\n"),
                location("Left Torso", ...fill(6, "ISDoubleHeatSinkPrototype"), "Medium Laser").join("\n"));
        const { mech, issues } = importBattleMechMtf(prototype);
        expect(issues).toEqual([]);
        expect(mech!.getHeatSinksType()).toBe("single");
        expect(mech!.getHeatSinks()).toBe(10);
        expect(mech!.getInstalledEquipment().filter((item) => item.tag === "prototype-double-heat-sink")).toHaveLength(2);
        expect(mech!.getHeatDissipation()).toBe(14);
        expect(mech!.getHeatSinksWeight()).toBe(0);
        expect(mech!.getChassisEquipmentViolations()).toEqual([]);
    });

    // "For Superheavy 'Mechs, use the Superheavy Engine Type BV Modifier Table in place of the standard Battle Value
    // modifiers" (IO:AE pp.187-188): Inner Sphere XL 0.75 and Light 0.825, where a 'Mech takes 0.5 and 0.75.
    it.each([["XL", 0.75], ["Light", 0.825]])("rates a superheavy 'Mech's %s engine from the superheavy table (IO:AE p.188)", (engine, modifier) => {
        const engineSlots = fill(engine === "XL" ? 2 : 1, "Fusion Engine");
        const sided = superheavy.replace("300 Fusion Engine(IS)", `300 ${engine} Engine(IS)`)
            .replace(location("Left Torso", ...fill(4, "ISGaussRifle"), "IS Gauss Ammo|IS Gauss Ammo").join("\n"),
                location("Left Torso", ...engineSlots, ...fill(4, "ISGaussRifle"), "IS Gauss Ammo|IS Gauss Ammo").join("\n"))
            .replace(location("Right Torso", "IS LB 10-X AC Ammo|IS LB 10-X Cluster Ammo").join("\n"),
                location("Right Torso", ...engineSlots, "IS LB 10-X AC Ammo|IS LB 10-X Cluster Ammo").join("\n"));
        const { mech, issues } = importBattleMechMtf(sided);
        expect(issues).toEqual([]);
        const engineStep = mech!.getBattleValueBreakdown().steps.find((step) => step.id === "bv2.def.engine.superheavy");
        expect(engineStep?.detail).toMatch(new RegExp(` x ${modifier}$`));
    });

    // "Treat the Superheavy 'Mech as a Clan 'Mech if the explosive components are in a location protected by any form
    // of CASE" (IO:AE p.188): CASE in an XL engine's side torso saves it.
    it("lets CASE protect a superheavy XL 'Mech's side torso ammunition (IO:AE p.188)", () => {
        const xl = superheavy.replace("300 Fusion Engine(IS)", "300 XL Engine(IS)")
            .replace(location("Left Torso", ...fill(4, "ISGaussRifle"), "IS Gauss Ammo|IS Gauss Ammo").join("\n"),
                location("Left Torso", ...fill(2, "Fusion Engine"), ...fill(4, "ISGaussRifle"), "IS Gauss Ammo|IS Gauss Ammo").join("\n"))
            .replace(location("Right Torso", "IS LB 10-X AC Ammo|IS LB 10-X Cluster Ammo").join("\n"),
                location("Right Torso", ...fill(2, "Fusion Engine"), "IS LB 10-X AC Ammo|IS LB 10-X Cluster Ammo", "ISCASE").join("\n"));
        const { mech, issues } = importBattleMechMtf(xl);
        expect(issues).toEqual([]);
        const steps = mech!.getBattleValueBreakdown().steps;
        expect(steps.filter((step) => step.id === "bv2.def.explosive.superheavy" && step.label.includes("ammunition in rightTorso protected by CASE"))).toHaveLength(1);
        expect(steps.filter((step) => step.id === "bv2.def.explosive.ammo" && step.label.includes("rightTorso"))).toHaveLength(0);
    });

    // Treated as a Clan 'Mech where CASE protects it (IO:AE p.188), and a Clan 'Mech still pays for explosives in the
    // center torso, legs and head (TM p.302): CASE there saves nothing.
    it("still charges a superheavy 'Mech's center torso ammunition behind CASE, as for a Clan 'Mech (IO:AE p.188, TM p.302)", () => {
        const ct = superheavy.replace(location("Center Torso", ...fill(3, "Fusion Engine"), ...fill(2, "Gyro")).join("\n"),
            location("Center Torso", ...fill(3, "Fusion Engine"), ...fill(2, "Gyro"), "IS LB 10-X AC Ammo|IS LB 10-X Cluster Ammo", "ISCASE").join("\n"));
        const { mech, issues } = importBattleMechMtf(ct);
        expect(issues).toEqual([]);
        const steps = mech!.getBattleValueBreakdown().steps;
        // One slot holds both tons: -15 once.
        expect(steps.filter((step) => step.id === "bv2.def.explosive.ammo" && step.label.includes("centerTorso")).map((step) => step.value)).toEqual([-15]);
        expect(steps.filter((step) => step.id === "bv2.def.explosive.superheavy" && step.label.includes("centerTorso"))).toHaveLength(0);
    });

    // "Superheavy 'Mechs may ignore the torso-only mounting restrictions applied to Heavy Gauss Rifles (standard and
    // improved), and may place these items in the arms" (IO:AE p.157): the Ares ARS-V1A Hera's right-arm rifle.
    it("mounts an Improved Heavy Gauss Rifle in a superheavy 'Mech's arm (IO:AE p.157)", () => {
        const armed = superheavy.replace([...fill(3, "ISLBXAC10"), ...fill(3, "-Empty-")].join("\n"), fill(6, "ISImprovedHeavyGaussRifle").join("\n"))
            .replace("IS LB 10-X AC Ammo|IS LB 10-X Cluster Ammo", "ISImprovedHeavyGauss Ammo|ISImprovedHeavyGauss Ammo");
        const { mech, issues } = importBattleMechMtf(armed);
        expect(issues).toEqual([]);
        expect(mech!.getInstalledEquipment().find((item) => item.tag === "gauss-rifle-heavy-improved")?.location).toBe("la");
    });

    it("reads a tripod's Center Leg, its armor and what it mounts", () => {
        const { mech, issues } = importBattleMechMtf(tripod);
        expect(issues).toEqual([]);
        expect(mech!.isTripod()).toBe(true);
        expect(mech!.getArmorAllocation().centerLeg).toBe(16);
        expect(mech!.getInstalledEquipment().filter((item) => item.tag === "medium-laser" && item.location === "cl")).toHaveLength(1);
        const omni = convertMtfToSSW(parseMtfFile(tripod.replace("Config:Tripod", "Config:Tripod OmniMek"))!);
        expect(omni.issues).toEqual([]);
        expect(omni.xml).toContain(`omnimech="TRUE"`);
    });

    it("reads a QuadVee: tracks or wheels, its cockpit, and its legs' conversion gear", () => {
        const { mech, issues } = importBattleMechMtf(quadVee);
        expect(issues).toEqual([]);
        expect(mech!.isQuadVee()).toBe(true);
        expect(mech!.getQuadVeeMotive()).toBe("tracked");
        expect(mech!.getArmorType()).toMatch(/ferro/);
        expect(mech!.getInternalStructureType()).toMatch(/endo/);
        expect(mech!.getInstalledEquipment().filter((item) => item.tag === "er-medium-laser-clan")).toHaveLength(2);
        const wheeled = importBattleMechMtf(quadVee.replace("motive:Track", "motive:Wheel").replace(/\nTracks\n/g, "\nQuadVee Wheels\n"));
        expect(wheeled.issues).toEqual([]);
        expect(wheeled.mech!.getQuadVeeMotive()).toBe("wheeled");
        const omni = convertMtfToSSW(parseMtfFile(quadVee.replace("Config:QuadVee", "Config:QuadVee OmniMek"))!);
        expect(omni.issues).toEqual([]);
        expect(omni.xml).toContain(`omnimech="TRUE"`);
    });

    it("reads a LAM: Standard or Bimodal, with the chassis's landing gear and avionics", () => {
        const { mech, issues } = importBattleMechMtf(lam);
        expect(issues).toEqual([]);
        expect(mech!.isLAM()).toBe(true);
        expect(mech!.getLAMType()).toBe("standard");
        expect(mech!.getJumpJetCount()).toBe(3);
        expect(mech!.getInstalledEquipment().filter((item) => item.tag === "medium-laser")).toHaveLength(2);
        const bimodal = importBattleMechMtf(lam.replace("lam:Standard", "lam:Bimodal"));
        expect(bimodal.issues).toEqual([]);
        expect(bimodal.mech!.getLAMType()).toBe("bimodal");
    });

    // mordel.net writes "Industrial" for MegaMek's "Industrial Cockpit" (Rock Hound AM-PRM-RH7C).
    it("reads mordel.net's Industrial cockpit as one without Advanced Fire Control", () => {
        const industrial = brawler.replace("structure:IS Standard", "structure:IS Industrial\ncockpit:Industrial");
        const { mech, issues } = importBattleMechMtf(industrial);
        expect(issues).toEqual([]);
        expect(mech!.hasAdvancedFireControl()).toBe(false);
    });

    // The Patron PTN LoaderMech: a Primitive IndustrialMech whose SSW save has Primitive Industrial Structure and
    // Commercial Armor, and whose fuel-cell engine fills slots named "Fuel Cell Engine".
    it("reads a Primitive IndustrialMech's structure, commercial armor and fuel-cell engine slots", () => {
        const primitive = brawler.replace("structure:IS Standard", "structure:IS Primitive Industrial\ncockpit:Primitive Industrial Cockpit")
            .replace("engine:250 Fusion Engine", "engine:250 Fuel Cell Engine(IS)").replace("armor:Standard(Inner Sphere)", "armor:Primitive Commercial (IS)")
            .replace(/(Center Torso:\n)Fusion Engine\nFusion Engine\nFusion Engine/, "$1Fuel Cell Engine\nFuel Cell Engine\nFuel Cell Engine");
        const { mech, issues } = importBattleMechMtf(primitive);
        expect(issues).toEqual([]);
        expect(mech!.isIndustrialMech()).toBe(true);
        expect(mech!.getArmorType()).toBe("commercial");
        expect(mech!.getInternalStructureType()).toBe("industrial");
    });

    // The Jenner JR7-K Grace: Age of War prototype endo steel and ferro-fibrous, 16 slots each (IO:AE pp.65-66, 211).
    it("reads prototype endo steel structure and prototype ferro-fibrous armor", () => {
        const prototype = brawler.replace("structure:IS Standard", "structure:IS Endo Steel Prototype")
            .replace("armor:Standard(Inner Sphere)", "armor:Ferro-Fibrous Prototype(Inner Sphere)")
            .replace(/(Left Torso:\n(?:.*\n){4})(?:-Empty-\n){8}/, "$1" + "IS Endo Steel Prototype\n".repeat(8))
            .replace(/(Right Torso:\nMedium Laser\n)(?:-Empty-\n){11}/, "$1" + "IS Endo Steel Prototype\n".repeat(8) + "IS Ferro-Fibrous Prototype\n".repeat(3))
            .replace(/(Center Torso:\n(?:.*\n){10})(?:-Empty-\n){2}/, "$1" + "IS Ferro-Fibrous Prototype\n".repeat(2))
            .replace(/(Right Arm:\n(?:.*\n){5})(?:-Empty-\n){7}/, "$1" + "IS Ferro-Fibrous Prototype\n".repeat(7))
            .replace(/(Left Leg:\n(?:.*\n){4})(?:-Empty-\n){2}/, "$1" + "IS Ferro-Fibrous Prototype\n".repeat(2))
            .replace(/(Right Leg:\n(?:.*\n){4})(?:-Empty-\n){2}/, "$1" + "IS Ferro-Fibrous Prototype\n".repeat(2));
        const { mech, issues } = importBattleMechMtf(prototype);
        expect(issues).toEqual([]);
        expect(mech!.getInternalStructureType()).toBe("endo-steel-prototype");
        expect(mech!.getArmorType()).toBe("ferro-fibrous-prototype");
        // Half the standard structure weight, like production endo steel (IO:AE p.211: TT÷20).
        expect(mech!.getInternalStructureWeight()).toBe(2.5);
    });

    // The Wasp WSP-1: primitive prototype jump jets, standard jet mass and slots (IO:AE pp.114, 211).
    it("reads primitive prototype jump jets", () => {
        const prototype = brawler.replace("jump mp:0", "jump mp:2")
            .replace("Right Torso:\nMedium Laser\n-Empty-\n-Empty-", "Right Torso:\nMedium Laser\nISPrototypeJumpJet\nISPrototypeJumpJet");
        const { mech, issues } = importBattleMechMtf(prototype);
        expect(issues).toEqual([]);
        expect(mech!.getJumpJetType().tag).toBe("primitive-prototype");
        expect(mech!.getJumpSpeed()).toBe(2);
    });

    // The Commando COM-1AK: a Primitive 'Mech's file gives the engine installed, 1.2 times the rating its Walking MP
    // needs (IO:AE p.117). 50 tons at Walking MP 5 installs a 300.
    it("reads a Primitive 'Mech's Walking MP from the file, not from the installed engine rating", () => {
        const primitive = brawler.replace("engine:250 Fusion Engine", "engine:300 Fusion Engine").replace("structure:IS Standard", "structure:IS Standard\ncockpit:Primitive Cockpit");
        const { mech } = importBattleMechMtf(primitive);
        expect(mech!.isPrimitive()).toBe(true);
        expect(mech!.getWalkSpeed()).toBe(5);
        expect(mech!.getEngineRating()).toBe(300);
    });

    // The Sasquatch SQS-TH-002 and Kuma 3: MegaMek names a large engine "Large", ours is the same type rated over 400 (TO:AUE p.119).
    it("reads large XXL engines as XXL engines rated over 400", () => {
        const large = (engine: string) => convertMtfToSSW(parseMtfFile(brawler.replace("engine:250 Fusion Engine", engine))!);
        expect(large("engine:425 Large XXL Engine").issues.filter((issue) => /engine/i.test(issue))).toEqual([]);
        expect(large("engine:425 Large XXL Engine").xml).toContain(`<engine rating="425" techbase="0">XXL Engine</engine>`);
        expect(large("engine:420 Large XXL (Clan) Engine").xml).toContain(`<engine rating="420" techbase="1">XXL Engine</engine>`);
    });

    // The Zeus X ZEU-X and Spindrift SDT-1: MegaMek writes "armor:Patchwork" and names each location's armor type and
    // tech base on its armor line; SSW writes them on the location element (TO:AUE p.189).
    it("reads patchwork armor's type in each location", () => {
        const patchwork = brawler.replace("armor:Standard(Inner Sphere)", "armor:Patchwork")
            .replace(/^(LA|RA) armor:/gm, "$1 armor:IS Hardened(Inner Sphere):")
            .replace(/^(LT|RT|CT|LL|RL) armor:/gm, "$1 armor:IS Standard(Inner Sphere):")
            .replace(/^HD armor:/m, "HD armor:Clan Standard(Clan):");
        const { mech, issues } = importBattleMechMtf(patchwork);
        expect(issues).toEqual([]);
        expect(mech!.isPatchworkArmor()).toBe(true);
        expect(mech!.getPatchworkArmorType("leftArm").tag).toBe("hardened");
        expect(mech!.getPatchworkArmorType("centerTorso").tag).toBe("standard");
        expect(mech!.getPatchworkArmorType("head").tag).toBe("standard");
        expect(mech!.getArmorAllocation().leftArm).toBe(14);
    });

    // The Hybrid Rifleman and Temax Cat: MegaMek writes a FrankenMech's donors as "LA structure:IS Endo Steel:65", or
    // with the tonnage alone when the location has the 'Mech's own structure (CO pp.212-213).
    it("reads a FrankenMech's donor for each location", () => {
        const franken = brawler.replace("Config:Biped", "Config:Biped FrankenMek").replace("structure:IS Standard", "structure:Hybrid\n"
            + "LA structure:IS Endo Steel:65\nRA structure:Standard:50\nLT structure:50\nRT structure:50\nCT structure:Standard:50\n"
            + "HD structure:50\nLL structure:60\nRL structure:60")
            .replace(/(Left Arm:\n(?:.*\n){7})-Empty-\n-Empty-\n/, "$1IS Endo Steel\nIS Endo Steel\n");
        const { mech, issues } = importBattleMechMtf(franken);
        expect(issues).toEqual([]);
        expect(mech!.isFrankenMech()).toBe(true);
        expect(mech!.getInternalStructureType()).toBe("standard");
        expect(mech!.getFrankenMechDonor("leftArm")).toMatchObject({ tonnage: 65, structure: "endo-steel", structureTechBase: "is", structureSlots: 2 });
        expect(mech!.getFrankenMechDonor("rightArm")).toMatchObject({ tonnage: 50, structure: "standard" });
        expect(mech!.getFrankenMechDonor("leftLeg")).toMatchObject({ tonnage: 60, structure: "standard" });
        expect(mech!.getFrankenMechLocationStructureSlots("leftArm")).toBe(2);
        // The Hunchback 'Drizella': an endo steel center torso takes its own slot, not the whole 'Mech's 14.
        const endoTorso = importBattleMechMtf(franken.replace("CT structure:Standard:50", "CT structure:IS Endo Steel:50")
            .replace(/(Center Torso:\n(?:.*\n){10})-Empty-\n/, "$1IS Endo Steel\n"));
        expect(endoTorso.issues).toEqual([]);
        expect(endoTorso.mech!.getInternalStructureType()).toBe("endo-steel");
        expect(endoTorso.mech!.getFrankenMechLocationStructureSlots("centerTorso")).toBe(1);
        expect(endoTorso.mech!.getUnallocatedCritCount()).toBe(0);
    });

    // A bundled design whose MegaMek file differs from its newest printed sheet is corrected on import, by chassis
    // and model, from MTF_DESIGN_CORRECTIONS (each line cited).
    it("corrects a design from its printed sheet", () => {
        const file = parseMtfFile(brawler)!;
        correctMtfDesign(file, { "Test Brawler TB-2": { values: { "rtr armor": "3", "la armor": "9" }, source: "test" } });
        expect(file.values["rtr armor"]).toEqual(["3"]);
        expect(file.values["la armor"]).toEqual(["9"]);
        const other = parseMtfFile(brawler)!;
        correctMtfDesign(other, { "Test Brawler TB-3": { values: { "la armor": "9" }, source: "test" } });
        expect(other.values["la armor"]).toEqual(parseMtfFile(brawler)!.values["la armor"]);
        // The import applies the table: the Temax Cat's right rear torso is 6 on XTRO:Boondocks p.6 (MegaMek has 8).
        const temax = brawler.replace("chassis:Test Brawler", "chassis:Temax Cat Ninjabolt").replace("model:TB-2", "model:TMC-NB");
        expect(importBattleMechMtf(temax).mech!.getArmorAllocation().rightTorsoRear).toBe(6);
    });

    // A sheet can differ from the file in a slot: a weapon the file mounts facing forward fires to the rear, say.
    it("corrects a slot from its printed sheet, by location and slot number", () => {
        const file = parseMtfFile(brawler)!;
        const before = [...file.slots["Right Torso"]];
        correctMtfDesign(file, { "Test Brawler TB-2": { slots: { "Right Torso": { 1: "Medium Laser (R)" } }, source: "test" } });
        expect(file.slots["Right Torso"]).toEqual(["Medium Laser (R)", ...before.slice(1)]);
        // A slot the file does not have, or a location it lacks, is not invented.
        expect(() => correctMtfDesign(parseMtfFile(brawler)!, { "Test Brawler TB-2": { slots: { "Right Torso": { 13: "Medium Laser" } }, source: "test" } })).toThrow(/slot 13/);
        expect(() => correctMtfDesign(parseMtfFile(brawler)!, { "Test Brawler TB-2": { slots: { "Front Left Leg": { 1: "Hip" } }, source: "test" } })).toThrow(/Front Left Leg/);
        // The import applies it: the corrected laser fires to the rear.
        const rear = importBattleMechMtf(brawler, { "Test Brawler TB-2": { slots: { "Right Torso": { 1: "Medium Laser (R)" } }, source: "test" } }).mech!;
        expect(rear.getInstalledEquipment().filter((item) => item.rear).map((item) => item.name)).toEqual(["Medium Laser"]);
    });

    // The Skinwalker (Ryoken III): an interface cockpit with no gyro. MegaMek packs the engine into center torso
    // slots 1-6; the gyro's slots are free for other items (IO:AE p.110).
    it("reads an interface cockpit with no gyro", () => {
        const gestalt = brawler.replace("myomer:Standard", "myomer:Standard\ncockpit:Interface Cockpit\ngyro:None")
            .replace(/(Center Torso:\n)(?:.*\n){10}/, "$1" + "Fusion Engine\n".repeat(6) + "Medium Laser\n" + "-Empty-\n".repeat(3))
            .replace("Cockpit\n-Empty-\nSensors", "Cockpit\nCockpit\nSensors");
        const { mech, issues } = importBattleMechMtf(gestalt);
        expect(issues).toEqual([]);
        expect(mech!.getCockpitType().tag).toBe("interface");
        expect(mech!.getGyro().tag).toBe("none");
        expect(mech!.getCockpitWeight()).toBe(4);
        expect(mech!.getGyroWeight()).toBe(0);
        expect(mech!.getChassisEquipmentViolations()).toEqual([]);
        // The cockpit's second slot is head slot 4.
        expect(mech!.getCriticalOccupancy("hd")).toEqual([true, true, true, true, true, true]);
        // Final BV x1.30 (IO:AE p.199); the gyro still adds tonnage x 0.5, as MegaMek counts it.
        const { mech: plain } = importBattleMechMtf(brawler.replace("Right Torso:\nMedium Laser\n-Empty-", "Right Torso:\nMedium Laser\nMedium Laser"));
        expect(mech!.getBattleValue()).toBe(Math.round(plain!.getBattleValue() * 1.3));
    });

    // MegaMek writes the Smart Robotic Control System as a "nocrit" line (Revenant UBM-1A).
    it("reads a Smart Robotic Control System", () => {
        for (const [line, tag] of [["SmartRoboticControlSystem:None", "srcs"], ["ImprovedSmartRoboticControlSystem:None", "srcs-improved"]]) {
            const { mech, issues } = importBattleMechMtf(brawler.replace("myomer:Standard", `myomer:Standard\nnocrit:${line}`));
            expect(issues).toEqual([]);
            expect(mech!.getCockpitType().tag).toBe("standard");
            expect(mech!.getRoboticControl().tag).toBe(tag);
        }
    });

    it("finds MegaMek's prototype rocket launchers (Crosscut ED-X2)", () => {
        // One, two and three slots.
        for (const [size, slots] of [[10, 1], [15, 2], [20, 3]]) {
            const rockets = brawler.replace("Right Torso:\nMedium Laser" + "\n-Empty-".repeat(slots),
                "Right Torso:\nMedium Laser" + `\nISRocketLauncher${size}Prototype`.repeat(slots));
            const { mech, issues } = importBattleMechMtf(rockets);
            expect(issues).toEqual([]);
            expect(mech!.getInstalledEquipment().map((item) => item.tag)).toContain(`prototype-rocket-launcher-${size}`);
        }
    });

    it("reads a Ram Plate as one item with a slot in each torso (OTP: Hanseatic Crusade p.30)", () => {
        const core = [...fill(3, "Fusion Engine"), ...fill(4, "Gyro"), ...fill(3, "Fusion Engine")];
        const rammer = quad.replace("structure:IS Standard", "structure:IS Reinforced").replace("techbase:Inner Sphere", "techbase:Mixed (Clan Chassis)")
            .replace(location("Left Torso", "Large Laser", "Large Laser").join("\n"), location("Left Torso", "Ram Plate").join("\n"))
            .replace(location("Right Torso", "Large Laser", "Large Laser").join("\n"), location("Right Torso", "Ram Plate").join("\n"))
            .replace(location("Center Torso", ...core).join("\n"), location("Center Torso", ...core, "Ram Plate").join("\n"));
        expect(rammer.match(/^Ram Plate$/gm)).toHaveLength(3);
        const { mech, issues } = importBattleMechMtf(rammer);
        expect(issues).toEqual([]);
        expect(mech!.getInstalledEquipment().filter((item) => item.tag === "ram-plate")).toHaveLength(1);
        expect(mech!.getUnallocatedCritCount()).toBe(0);
    });

    it("leaves out what it cannot convert, saying why", () => {
        const lam = striker.replace("Config:Biped", "Config:LAM");
        expect(importBattleMechMtf(lam).issues.some((issue) => /LAM/.test(issue))).toBe(true);
        const unknown = striker.replace("CLERMediumLaser", "CLNoSuchGun");
        expect(importBattleMechMtf(unknown).issues).toContain("Cannot find any equipment named 'CLNoSuchGun'");
    });
});
