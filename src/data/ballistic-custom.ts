import { IEquipmentItem } from "./data-interfaces";
import { applyDerivedValues } from "./derived-custom-values";
import { futureWarsPomPoms } from "./best-of-future-wars-conversions";
import { equipmentBallistic } from "./equipment-ballistic";

/*
 * DISCLAIMER: This file processes gameplay data derived from the BattleTech universe. 
 * All official lore, trademarks, and intellectual property belong strictly to 
 * Catalyst Game Labs, Topps, and/or their respective corporate rights holders. 
 * Any original, fan-made content or custom homebrew data processed by this tool 
 * remains the exclusive property of its respective community creators, which,
 * where known, has been appropriately attributed.
 *
 * This open-source utility is a non-commercial fan project designed purely for 
 * tabletop gameplay assistance. Content processed by this file is not intended 
 * to challenge any copyright or trademark status, and this data is explicitly 
 * excluded from the software's underlying license (GNU GPLv3).
 */

/**
 * The Improved 'Mech Taser (Ideas #92): VoiceOfAN's police equipment submission, posted on Battletech Into The Future
 * (professorheyteen, 2024-04-27). The PDF keeps the canon BattleMech Taser's weight, slots, heat and damage and adds 14 BV
 * and 100,000 C-bills, so every other stat is copied from the canon record.
 */
const improvedMechTaser = (): IEquipmentItem => {
    const canon = equipmentBallistic.find((item) => item.tag === "mech-taser");
    if (!canon) throw new Error("iTaser: canon record mech-taser not found");
    const stats = { ...canon };
    delete stats.editions;
    return {
        ...stats,
        name: "Improved 'Mech Taser (iTaser)",
        altNames: ["iTaser", "Improved BattleMech Taser"],
        tag: "custom-improved-mech-taser",
        altTags: [],
        sort: "taser, battlemech, improved",
        catalog: "custom",
        rulesLevel: 6,
        cbills: canon.cbills + 100000,
        battleValue: (canon.battleValue ?? 0) + 14,
        prototype: 3090,
        introduced: 3101,
        book: "https://battletechfuture.com/2024/04/27/more-police-equipment-for-battletech/",
        page: 0,
        alphaStrike: { specialAbility: ["ITAS1"], heat: 6, rangeShort: 0.1, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Ours (NGCFells, 2026-11-22, #647): ITAS#, as the canon MTAS# (ASCE p.90, the nearest special) without the -2 against a BattleMech, plus 1 heat to a target that tracks heat (Improved Taser: VoiceOfAN)"] },
        notes: "Custom Homebrew by VoiceOfAN, Battletech Into The Future (2024-04-27). A hit adds 5 heat to the target, then roll 2D6: "
            + "the target shuts down on 8+; a unit that stays active takes +2 to any roll it makes the following turn. It kills one member "
            + "of an infantry unit, battle armor included. No effect on buildings, aerospace fighters in flight or capital-scale units. "
            + "Its gauss-launched explosive harpoons do 6 damage to the carrier if the weapon or its ammunition is hit. Weight, slots, heat, "
            + "damage, range and ammunition are the canon BattleMech Taser's (TO:AUE p.158); +14 BV and +100,000 C-bills. Federated Suns, "
            + "prototype 3090, available 3101."
    };
};

export const ballisticCustom: IEquipmentItem[] = applyDerivedValues([
    improvedMechTaser(),
    // Pleiades Mechworks (u/PleiadesMechworks, r/NormalBattletech, #641): the Autocannon/12. Every number is the post's.
    {
        isAmmo: false,
        name: "Autocannon/12 (Pleiades Mechworks)", altNames: ["AC/12", "Autocannon/12"], tag: "custom-ac-12", techBase: "is", catalog: "custom",
        sort: "ac, 12", category: "Ballistic Weapons",
        notes: "Custom Homebrew by u/PleiadesMechworks (r/NormalBattletech, Pleiades Mechworks equipment post). Inner Sphere ballistic direct fire, introduced 3020 by the Federated Suns: "
            + "12 damage, 4 heat, no minimum range, 4/8/12, 13 tons, 7 slots, 8 shots a ton, 300,000 C-bills unloaded, ammunition 10,000 C-bills a ton, Battle Value 142 and 18 an ammunition ton. "
            + "It headcaps: 12 damage to the head is allowed, with no reduction (the author's reply). "
            + "Not given by the post: tech rating. Specialist ammunition for it (the seven AC/10 munitions) is derived from its standard round and is ours.",
        damage: 12, damageAero: 12, accuracyModifier: 0, cbills: 300000, prototype: 3020, introduced: 3020, extinct: null, reintroduced: null, battleValue: 142, ammoBattleValue: 18, heat: 4, heatAero: 4, weight: 13,
        range: { min: 0, short: 4, medium: 8, long: 12 }, space: { battlemech: 7, protomech: -1, combatVehicle: 1, supportVehicle: 7, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 8, ammoTypes: ["ammo-custom-ac-12-standard"], minAmmoTons: 1, explosive: false, weaponType: ["DB", "S"], techRating: "x",
        book: "https://www.reddit.com/r/NormalBattletech/", page: 0, rulesLevel: 6, rangeAero: "m",
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: [] },
        rules: "A standard autocannon: 12 damage a hit, 4 heat, range 4/8/12 with no minimum, 8 shots a ton. 12 damage to the head is allowed, with no reduction.",
        lore: "The Federated Suns' answer to the gap between the AC/10 and the AC/20, first fielded in 3020 by the Flying Foxes, a mercenary company that built its name "
            + "as clanbusters. Pleiades Mechworks built it for them, and the full range of specialist ammunition was developed for it. The AC/15 later superseded it."
    },
    {
        name: "AC/15 (Solaris7)", tag: "custom-ac-15", techBase: "universal", sort: "ac, 15", category: "Custom Equipment", notes: "Unverified placeholder based on the Kronos Battle Systems 'Class 15 autocannons' homebrew rules (Solaris7 forum thread, archived).",
        damage: 15, damageAero: 15, accuracyModifier: 0, cbills: 0, introduced: 2500, prototype: 2488, extinct: null, reintroduced: null, battleValue: 0, heat: 5, heatAero: 5, weight: 13, // Dates of the heavier-bore Standard AC/20 (IO p.38).
        range: { min: 3, short: 5, medium: 10, long: 15 }, space: { battlemech: 9, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 7, minAmmoTons: 1, explosive: false, weaponType: ["DB", "S"], techRating: "f", book: "https://drive.google.com/drive/folders/0B5bLPOivte0vdjZ0YVQySDZ2SGc?resourcekey=0-oabxb-hZhk9iZVmeTa9zPQ", page: 0, rulesLevel: 6,
        alphaStrike: { heat: 5, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Unverified custom equipment"] }
    },
    {
        isAmmo: false,
        name: "Heavy Rotary Rifle Cannon",
        altNames: ["Heavy RRC", "HRRC"],
        tag: "heavy-rotary-rifle-cannon",
        techBase: "universal",
        altTags: ["weapon-hrrc"],
        sort: "rotary rifle cannon, heavy",
        category: "Ballistic Weapons",
        damage: 9,
        notes: "Fanon Age of War stop-gap system. Fires up to 6 shots; prone to jamming. Inflicts 6 damage vs BAR8+ armor types.",
        damageAero: 9,
        accuracyModifier: 0,
        cbills: 125000,
        introduced: 2400,
        extinct: 2500,
        reintroduced: null,
        battleValue: 105,
        heat: 6,
        heatAero: 6,
        weight: 10,
        range: { min: 0, short: 6, medium: 12, long: 18 },
        space: { battlemech: 5, protomech: -1, combatVehicle: 1, supportVehicle: 5, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 6,
        ammoTypes: ["ammo-is-heavy-rotary-rifle-standard"],
        minAmmoTons: 1,
        explosive: false,
        weaponType: ["DB", "Fanon"],
        techRating: "c",
        book: "https://battletechfanon.fandom.com/wiki/Rotary_Rifle_Cannon",
        page: 0,
        alphaStrike: { heat: 6, rangeShort: 0.9, rangeMedium: 0.9, rangeLong: 0.9, rangeExtreme: 0, tc: true, notes: ["BAR8-Penalty"] },
        rangeAero: "m"
    },
    {
        isAmmo: false,
        name: "LB 15-X Autocannon",
        altNames: ["LB 15-X AC", "LBX 15"],
        tag: "custom-lb-15x-ac",
        techBase: "universal",
        sort: "ac, 15 lbx",
        category: "Custom Equipment",
        notes: "Custom weapon based on the Kronos Battle Systems 'Class 15 autocannons' homebrew rules. Can switch between solid slugs and cluster ammunition.",
        damage: 15,
        damageAero: 15,
        accuracyModifier: -1,
        cbills: 500000,
        introduced: 3050,
        extinct: null,
        reintroduced: null,
        battleValue: 0,
        heat: 4,
        heatAero: 4,
        weight: 12.5,
        range: { min: 1, short: 5, medium: 10, long: 15 },
        space: { battlemech: 9, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 7,
        ammoTypes: ["ammo-lb-15x-standard"],
        minAmmoTons: 1,
        explosive: false,
        weaponType: ["DB", "C"],
        techRating: "f",
        book: "https://drive.google.com/drive/folders/0B5bLPOivte0vdjZ0YVQySDZ2SGc?resourcekey=0-oabxb-hZhk9iZVmeTa9zPQ",
        page: 0,
        rulesLevel: 6,
        alphaStrike: { heat: 4, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["FLK"] }
    },
    {
        isAmmo: false,
        name: "Light Rotary Rifle Cannon",
        altNames: ["Light RRC", "LRRC"],
        tag: "light-rotary-rifle-cannon",
        techBase: "universal",
        altTags: ["weapon-lrrc"],
        sort: "rotary rifle cannon, light",
        category: "Ballistic Weapons",
        damage: 3,
        notes: "Fanon Age of War stop-gap system. Fires up to 6 shots; prone to jamming. Inflicts 0 damage vs BAR8+ armor types.",
        damageAero: 3,
        accuracyModifier: 0,
        cbills: 65000,
        introduced: 2400,
        extinct: 2500,
        reintroduced: null,
        battleValue: 45,
        heat: 2,
        heatAero: 2,
        weight: 6,
        range: { min: 0, short: 3, medium: 6, long: 9 },
        space: { battlemech: 3, protomech: -1, combatVehicle: 1, supportVehicle: 3, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 18,
        ammoTypes: ["ammo-light-rotary-rifle-standard"],
        minAmmoTons: 1,
        explosive: false,
        weaponType: ["DB", "Fanon"],
        techRating: "c",
        book: "https://battletechfanon.fandom.com/wiki/Rotary_Rifle_Cannon",
        page: 0,
        alphaStrike: { heat: 2, rangeShort: 0.3, rangeMedium: 0.3, rangeLong: 0.0, rangeExtreme: 0, tc: true, notes: ["BAR8-Penalty"] },
        rangeAero: "s"
    },
    {
        isAmmo: false,
        name: "Medium Rotary Rifle Cannon",
        altNames: ["Medium RRC", "MRRC"],
        tag: "medium-rotary-rifle-cannon",
        techBase: "universal",
        altTags: ["weapon-mrrc"],
        sort: "rotary rifle cannon, medium",
        category: "Ballistic Weapons",
        damage: 6,
        notes: "Fanon Age of War stop-gap system. Fires up to 6 shots; prone to jamming. Inflicts 3 damage vs BAR8+ armor types.",
        damageAero: 6,
        accuracyModifier: 0,
        cbills: 95000,
        introduced: 2400,
        extinct: 2500,
        reintroduced: null,
        battleValue: 72,
        heat: 4,
        heatAero: 4,
        weight: 8,
        range: { min: 0, short: 4, medium: 8, long: 12 },
        space: { battlemech: 4, protomech: -1, combatVehicle: 1, supportVehicle: 4, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 9,
        ammoTypes: ["ammo-medium-rotary-rifle-standard"],
        minAmmoTons: 1,
        explosive: false,
        weaponType: ["DB", "Fanon"],
        techRating: "c",
        book: "https://battletechfanon.fandom.com/wiki/Rotary_Rifle_Cannon",
        page: 0,
        alphaStrike: { heat: 4, rangeShort: 0.6, rangeMedium: 0.6, rangeLong: 0.0, rangeExtreme: 0, tc: true, notes: ["BAR8-Penalty"] },
        rangeAero: "s"
    },
    {
        isAmmo: false,
        name: "Ultra AC/15",
        altNames: ["Ultra Autocannon/15", "UAC/15"],
        tag: "custom-ultra-ac-15", isUltra: true,
        techBase: "universal",
        sort: "ac, 15 ultra",
        category: "Custom Equipment",
        notes: "Custom weapon based on the Kronos Battle Systems 'Class 15 autocannons' homebrew rules. Capable of firing double rate with a risk of jamming.",
        damage: 15,
        damageAero: 15,
        accuracyModifier: 0,
        cbills: 400000,
        introduced: 3050,
        extinct: null,
        reintroduced: null,
        battleValue: 0,
        heat: 4,
        heatAero: 4,
        weight: 14,
        range: { min: 1, short: 5, medium: 10, long: 14 },
        space: { battlemech: 9, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 7,
        ammoTypes: ["ammo-ultra-ac-15-standard"],
        minAmmoTons: 1,
        explosive: false,
        weaponType: ["DB", "F"],
        techRating: "f",
        book: "https://drive.google.com/drive/folders/0B5bLPOivte0vdjZ0YVQySDZ2SGc?resourcekey=0-oabxb-hZhk9iZVmeTa9zPQ",
        page: 0,
        rulesLevel: 6,
        alphaStrike: { heat: 8, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["UAC"] }
    },
    // Solaris7 forum railguns (#301), both Munchkin: the thread is tagged "munchtek", and each outclasses the Heavy Gauss
    // Rifle (18 t, 25 damage, 4/6/13/20) on damage, range or both. What a post does not print comes from that rifle (TM p.219).
    // Battle Value (user request 2026-11-02): no book gives a formula for a new weapon, and BV2 leaves heat to the unit, so
    // it is fitted to the canon single-hit weapons: about 21.3 a point of damage at a long range of 22 (Gauss Rifle,
    // 320 for 15) and 26.5 at 35 (HVAC/2), so 21.3 + 0.3 a hex past 22. Ammunition is an eighth of the weapon's, as
    // the Gauss rifles and HAGs have it (320/40, 346/43, 267/33).
    {
        name: "Railgun (Nightstalker666)", tag: "custom-railgun-nightstalker666", techBase: "universal", catalog: "custom", sort: "railgun, nightstalker666", category: "Ballistic Weapons",
        notes: "Munchkin by Nightstalker666, Solaris7 forum ('Railgun varient', July 2018), a one-of-a-kind prototype. His 22 July revision doubles the weight "
            + "to 20 tons and 8 slots and sets the heat at 12; damage, range, ammunition and cost are his first post's. The 25 points are armor-piercing and do not "
            + "transfer to another location, except from a destroyed front torso to its rear. It cannot fire indirectly. An ammunition hit does only 2 damage a round "
            + "unless a laser or PPC caused it; heat, flamers and infernos do not set it off. BV 660 (83 a ton of ammunition), fitted to the canon single-hit "
            + "weapons for 25 damage at a long range of 39 (Thunder's 704 came from the pre-BV2 Heavy Metal tool). "
            + "Not printed in the thread: dates and tech rating are the Heavy Gauss Rifle's (prototype 3051, available 3061, tech E).",
        damage: 25, damageAero: 25, accuracyModifier: 0, cbills: 2500000, prototype: 3051, introduced: 3061, extinct: null, reintroduced: null, battleValue: 660, heat: 12, heatAero: 12, weight: 20,
        range: { min: 6, short: 12, medium: 25, long: 39, extreme: 50 }, space: { battlemech: 8, protomech: -1, combatVehicle: 1, supportVehicle: 8, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 16, ammoTypes: ["ammo-custom-railgun-nightstalker666-standard"], minAmmoTons: 1, explosive: false, weaponType: ["DB"], techRating: "e",
        book: "http://solaris7.com/thread/railgun-varient/", page: 0, rulesLevel: 7,
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Custom equipment: no Alpha Strike conversion"] }
    },
    {
        name: "Railgun (Captain)", tag: "custom-railgun-captain", techBase: "universal", catalog: "custom", sort: "railgun, captain", category: "Ballistic Weapons",
        notes: "Munchkin by Captain, Solaris7 forum ('Railgun varient', July 2018), after the MekTek railgun of MechWarrior 4: Mercenaries. A critical hit on it "
            + "explodes like a 60-point ammunition explosion. Firing it from a 'Mech below the Super-Heavy class forces an immediate Piloting Skill Roll: +1 for an "
            + "Assault 'Mech, +2 for a Heavy, doubled if the 'Mech moved this turn; a Medium fails automatically. A Super-Heavy that moves and fires it rolls with no "
            + "modifier. Its 22 'Mech slots take one whole side: all 12 of a side torso and the 10 left in the arm on that side once the lower arm and hand "
            + "actuators are removed (user ruling 2026-11-02; the post gives no placement). "
            + "BV 1,230 (154 a ton of ammunition), fitted to the canon single-hit weapons for 50 damage at a long range of 33. "
            + "Not printed in the thread: cost, dates and tech rating are the Heavy Gauss Rifle's (500,000 C-bills, prototype 3051, available 3061, tech E).",
        damage: 50, damageAero: 50, accuracyModifier: 0, cbills: 500000, prototype: 3051, introduced: 3061, extinct: null, reintroduced: null, battleValue: 1230, heat: 5, heatAero: 5, weight: 30,
        range: { min: 10, short: 11, medium: 22, long: 33 }, space: { battlemech: 22, protomech: -1, combatVehicle: 1, supportVehicle: 22, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        spreadSlots: true, spreadLocations: "one-side",
        shotsPerTon: 2, ammoTypes: ["ammo-custom-railgun-captain-standard"], minAmmoTons: 1, explosive: true, weaponType: ["DB"], techRating: "e",
        book: "http://solaris7.com/thread/railgun-varient/", page: 0, rulesLevel: 7,
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Custom equipment: no Alpha Strike conversion"] }
    },
    // Solaris7 forum ideas (#301, 'LosTech custom weapons', April 2020): the big light autocannons. Weights are Lycaon's (about
    // a third off, as the Light AC/2 and AC/5 are), ranges Prince's. Custom Homebrew: they trade the AC/10's and AC/20's
    // reach for 4 tons, as the canon light autocannons do. Heat, shots a ton and the half-size slots follow those (TM p.208);
    // cost is the AC's plus the 25,000 C-bills the LAC/2 and LAC/5 add. BV fitted to canon weapons of the same reach.
    {
        name: "Light Autocannon/10", tag: "custom-light-ac-10", techBase: "is", catalog: "custom", altNames: ["LAC/10"], sort: "Light Autocannon/10", category: "Ballistic Weapons",
        notes: "Custom Homebrew from the Solaris7 forum ('LosTech custom weapons', April 2020): Prince's idea, with medium laser range; Lycaon set it at 8 tons. "
            + "Not printed in the thread: 3 heat, 10 shots a ton and 4 slots follow the AC/10 as the canon Light AC/5 follows the AC/5 (TM p.208); 225,000 C-bills "
            + "and the Light AC/5's dates and tech rating. BV 89 is the AC/20's 8.9 a point of damage at a long range of 9 (178 for 20). Standard rounds only.",
        damage: 10, damageAero: 10, accuracyModifier: 0, cbills: 225000, prototype: 3062, introduced: 3068, extinct: null, reintroduced: null, battleValue: 89, heat: 3, heatAero: 3, weight: 8,
        range: { min: 0, short: 3, medium: 6, long: 9 }, space: { battlemech: 4, protomech: -1, combatVehicle: 1, supportVehicle: 4, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 10, ammoTypes: ["ammo-custom-light-ac-10-standard"], minAmmoTons: 1, explosive: false, weaponType: ["DB", "S"], techRating: "d",
        book: "http://solaris7.com/thread/lostech-custom-weapons/", page: 0, rulesLevel: 6, rangeAero: "s",
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Custom equipment: no Alpha Strike conversion"] }
    },
    {
        name: "Light Autocannon/20", tag: "custom-light-ac-20", techBase: "is", catalog: "custom", altNames: ["LAC/20"], sort: "Light Autocannon/20", category: "Ballistic Weapons",
        notes: "Custom Homebrew from the Solaris7 forum ('LosTech custom weapons', April 2020): Prince's idea at 2/4/6, for fast Mediums such as the Legionnaire "
            + "and Blitzkrieg; Lycaon set it at 10 tons. Not printed in the thread: 7 heat, 5 shots a ton and 5 slots follow the AC/20 as the canon Light AC/5 "
            + "follows the AC/5 (TM p.208); 325,000 C-bills and the Light AC/5's dates and tech rating. BV 160 is the Medium Pulse Laser's 8 a point of damage "
            + "at a long range of 6 (48 for 6). Standard rounds only.",
        damage: 20, damageAero: 20, accuracyModifier: 0, cbills: 325000, prototype: 3062, introduced: 3068, extinct: null, reintroduced: null, battleValue: 160, heat: 7, heatAero: 7, weight: 10,
        range: { min: 0, short: 2, medium: 4, long: 6 }, space: { battlemech: 5, protomech: -1, combatVehicle: 1, supportVehicle: 5, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 5, ammoTypes: ["ammo-custom-light-ac-20-standard"], minAmmoTons: 1, explosive: false, weaponType: ["DB", "S"], techRating: "d",
        book: "http://solaris7.com/thread/lostech-custom-weapons/", page: 0, rulesLevel: 6, rangeAero: "s",
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Custom equipment: no Alpha Strike conversion"] }
    },
    // The Best of Future Wars, Volume One (1991), Chunk A of the fanzine plan (#172). Custom Homebrew: fan material.
    {
        name: "EII Point Defense System", tag: "custom-eii-pds", techBase: "universal", catalog: "custom", altNames: ["EII PDS", "Point Defense System (EII)"], sort: "point defense system, eii", category: "Ballistic Weapons",
        notes: "Custom Homebrew: Mike Reese, 'Ellena Industries Inc. Point Defense System (EII PDS)', *Future Wars* #14 (1989), p.46 ('New Technology'); reprinted in *The Best of Future Wars, Volume One* (1991), p.8. "
            + "The first printing's stat line gives heat 0; the record follows Future Wars #24 (below), and the 'Future Wars: equipment as first printed' Special Ruleset plays it at heat 0. "
            + "Not printed in The Best of Future Wars: the article calls the system experimental and gives no year; tech rating unverified. Heat 1 is from the original EII PDS table in Future Wars #24, p.10 (heat 1, damage 4, ranges the Machine Gun's, 1.5 tons plus a 0.5-ton ammunition load, 100 shots a ton, one critical slot, one to a unit), which the reprint leaves out. The company profile, 'Ell - Serving Your Needs' by Larry Ellena (Future Wars #24, pp.24-25), gives Ellena Industries: the planet UR in the Capellan Confederation, the Ellena family, a secret factory for Mitchel Vehicle Interstellar in the early First Succession War, JumpShips, DropShips, vehicles, VTOLs and 'Mech modifications, and the PDS as its latest development.",
        rules: "A gatling machine gun with its own radar, tied to the unit's fire control. 2 tons including 0.5 ton of ammunition built in, 50 bursts, in 2 slots "
            + "(one for the gun, one for that ammunition); an extra ton is 100 bursts in a separate magazine (ammo-custom-eii-pds-standard). "
            + "Damage 4 (it fires twice as fast as a machine gun), machine gun range with a longest of 3 hexes. When SRM or LRM fire is declared against the unit, "
            + "the defender rolls a die: that many SRM, or that many plus 1 LRM, are shot down. One burst is spent per salvo, and it can answer every salvo in a turn.",
        lore: "Ellena Industries built its Point Defense System as an experiment in stopping missiles before they strike. A gatling machine gun that fires twice as fast as a standard model is slaved to its own radar and to the host's fire control, an EII Mark 52 or later, and sweeps incoming salvos from the sky. The test installation took the place of the AC/5 on a Marauder II. Ellena has announced no production run. Ellena Industries sits on the planet UR in the Capellan Confederation, near Tikonov, and the Ellena family has run it for generations. It began as a small shop making simple goods for its own world, became a secret factory for the long-gone Mitchel Vehicle Interstellar in the early years of the First Succession War, and soon outgrew its patron. Since the war it has built JumpShips and DropShips (the Union, Leopard, Thunderwolf and Backlash classes), tracked and hover vehicles, VTOLs and BattleMech modifications, and it repairs almost anything, with sales of over a billion C-Bills a year. The Point Defense System is its latest development and its first move into 'Mech equipment.",
        damage: 4, damageAero: 4, accuracyModifier: 0, cbills: 0, introduced: null, extinct: null, reintroduced: null, battleValue: 0, heat: 1, heatAero: 1, weight: 2,
        range: { min: 0, short: 1, medium: 2, long: 3 }, space: { battlemech: 2, protomech: -1, combatVehicle: 2, supportVehicle: 2, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 },
        shotsPerTon: 100, ammoTypes: ["ammo-custom-eii-pds-standard"], minAmmoTons: 0, explosive: false, weaponType: ["DB"], techRating: "x", book: "The Best of Future Wars, Volume One", page: 8, rulesLevel: 6,
        alphaStrike: { specialAbility: ["AMS"], heat: 1, rangeShort: 0.4, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Ours (NGCFells, 2026-11-22, #647): AMS plus its machine-gun damage (0.4 short), the nearest canon special being AMS; the EII PDS is a gun and an anti-missile system (EII PDS: Mike Reese)"] }
    },
    // The Best of Future Wars (1991) p.27: Rapid Fire Autocannon (#172).
    ...futureWarsPomPoms(),
]);
