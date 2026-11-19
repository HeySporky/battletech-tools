import { IEquipmentItem } from "./data-interfaces";
import { applyDerivedValues } from "./derived-custom-values";
import { futureWarsBoostedWeapons } from "./best-of-future-wars-conversions";

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

const energyCustomBase: IEquipmentItem[] = applyDerivedValues([
    {
        name: "Disruptor (MekTek)", tag: "custom-disruptor", techBase: "universal", sort: "disruptor", category: "Custom Equipment", notes: "Unverified placeholder associated with MekTek Issue 2.",
        damage: 10, damageAero: 10, accuracyModifier: 0, cbills: 0, introduced: 2316, prototype: 2306, extinct: null, reintroduced: null, battleValue: 0, heat: 8, heatAero: 8, weight: 6, // Dates of the Standard Large Laser, which shares its heat and ranges (IO p.43).
        range: { min: 0, short: 5, medium: 10, long: 15 }, space: { battlemech: 4, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: ["DE", "E"], techRating: "x", book: "MekTek", page: 0, rulesLevel: 6,
        alphaStrike: { heat: 8, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Unverified custom equipment"] }
    },
    {
        isAmmo: false,
        name: "Enhanced ER Large Laser",
        tag: "enhanced_er_large_laser",
        techBase: "universal",
        catalog: "custom",
        notes: "No canon source found: the original tool cited IO p.189, but neither Interstellar Operations (2016) nor IO: Alternate Eras lists a Clan \"Enhanced ER Large Laser\". Kept as Custom Homebrew with its old tag and statistics until a source is found.",
        sort: "laser, enhanced er large",
        category: "Energy Weapons",
        damage: 10,
        damageAero: 10,
        accuracyModifier: 0,
        cbills: 200000,
        introduced: 2823,
        extinct: 2828,
        reintroduced: null,
        battleValue: 222,
        heat: 12,
        weight: 4,
        range: {
            min: 0,
            short: 6,
            medium: 12,
            long: 20
        },
        space: {
            battlemech: 2,
            protomech: -1,
            combatVehicle: 1,
            supportVehicle: 2,
            aerospaceFighter: 1,
            smallCraft: 1,
            dropShip: 1
        },
        shotsPerTon: 0,
        minAmmoTons: 0,
        explosive: false,
        weaponType: [
            "DE"
        ],
        techRating: "f",
        book: "Custom",
        page: null,
        rulesLevel: 6,
        alphaStrike: {
            heat: 12,
            rangeShort: 1.0,
            rangeMedium: 1.0,
            rangeLong: 1.0,
            rangeExtreme: 0,
            tc: true,
            notes: []
        },
        heatAero: 12,
        rangeAero: "l"
    },
    {
        // Solaris7 forum (#301). Captain's last revision (26 April 2020) keeps his first stats and adds the meltdown.
        // Custom Homebrew, not Munchkin: against the Heavy PPC (10 t, 15 damage, minimum range 3) it trades 1 ton and
        // the minimum range for shorter reach and a 25-point explosion when hit.
        name: "Heavy Laser (IS, Solaris7)", tag: "custom-is-heavy-laser-solaris7", techBase: "is", catalog: "custom", sort: "laser, heavy, is, solaris7", category: "Energy Weapons",
        notes: "Custom Homebrew by Captain, Solaris7 forum ('LosTech custom weapons', April 2020): a Word of Blake reverse-engineered Clan Heavy Large Laser, "
            + "wrapped in radiation-absorbing layers and cooling jackets, so it has no to-hit penalty. A critical hit on it causes a catastrophic meltdown: "
            + "25 damage to the location it is mounted in and another critical hit roll on that location. "
            + "Not printed in the thread: cost, dates and tech rating are the Binary Laser Cannon's (TO:AUE p.131), which shares its weight, heat and ranges "
            + "and was reintroduced by the Word of Blake: 200,000 C-bills, available 3077, tech D; vehicle and aerospace slots follow the canon lasers. "
            + "BV 296 is that cannon's 18.5 a point of damage (222 for 12) for 16 damage.",
        damage: 16, damageAero: 16, accuracyModifier: 0, cbills: 200000, introduced: 3077, extinct: null, reintroduced: null, battleValue: 296, heat: 16, heatAero: 16, weight: 9,
        range: { min: 0, short: 5, medium: 10, long: 15 }, space: { battlemech: 5, protomech: -1, combatVehicle: 1, supportVehicle: 5, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0, minAmmoTons: 0, explosive: true, weaponType: ["DE"], techRating: "d", book: "http://solaris7.com/thread/lostech-custom-weapons/", page: 0, rulesLevel: 6,
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Custom equipment: no Alpha Strike conversion"] }
    },
    {
        // Solaris7 forum idea (#301, 'Inner Sphere Chemical Lasers', November 2018): Prince's 'light' class; the 'heavy' class is a
        // capital-scale anti-orbital gun with no statistics and is not entered. Captain ruled out the artillery fire (lasers fly
        // straight). Prince meant it to be "munchy", but 15 tons for 10 damage trails the Gauss Rifle (15 tons, 15 damage) even
        // with no heat, and its ammunition is a bomb: Custom Homebrew.
        name: "Light Chemical Laser (IS)", tag: "custom-is-light-chemical-laser", techBase: "is", catalog: "custom", sort: "laser, chemical, light, is", category: "Energy Weapons",
        notes: "Custom Homebrew by Prince, Solaris7 forum ('Inner Sphere Chemical Lasers', November 2018): a Succession Wars chemical laser built to fight "
            + "orbital bombardment, 15 tons and 10-12 slots, needing no fusion engine and no heat sinks, about 5 charges a ton. Direct fire only. Every hit "
            + "also rolls for a critical hit on the location struck, as the beam goes through. Its ammunition is catastrophic (see the ammunition). "
            + "First built about 2850 (Free Worlds League), in general use 2880, lost about 2950 after the Holy Shroud, rediscovered about 3085. "
            + "Not printed in the thread: damage 10 is one point of capital damage (Prince: 'calculated as capital'; the Sub-Capital Laser /1's, SO); "
            + "the 10 slots are the low end of his range; ranges, cost per ton and tech rating are the Clan Large Chemical Laser's (TO:AUE p.132), "
            + "225,000 C-bills. BV 123 is the AC/10's 12.3 a point of damage at a long range of 15.",
        damage: 10, damageAero: 10, accuracyModifier: 0, cbills: 225000, prototype: 2850, introduced: 2880, extinct: 2950, reintroduced: 3085, battleValue: 123, heat: 0, heatAero: 0, weight: 15,
        range: { min: 0, short: 5, medium: 10, long: 15 }, space: { battlemech: 10, protomech: -1, combatVehicle: 1, supportVehicle: 10, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 5, ammoTypes: ["ammo-custom-is-light-chemical-laser-standard"], ammoBattleValue: 15, minAmmoTons: 1, explosive: false, weaponType: ["DE"], techRating: "e",
        book: "http://solaris7.com/thread/inner-sphere-chemical-lasers/", page: 0, rulesLevel: 6, rangeAero: "m",
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Custom equipment: no Alpha Strike conversion"] }
    },
    {
        // Solaris7 forum idea (#301, 'LosTech custom weapons', April 2020): Lonely Coyote's rotary laser, recalled by Thunder. Of its
        // three sizes only one is remembered, 5 tons and 2 slots, "possibly a Rotary Laser-3": a small chemical laser (3 damage)
        // on rotary barrels. Custom Homebrew: the Rotary AC rules on the Clan Small Chemical Laser.
        name: "Rotary Small Chemical Laser", tag: "custom-rotary-small-chemical-laser", techBase: "clan", catalog: "custom", sort: "laser, chemical, small, rotary", category: "Energy Weapons",
        notes: "Custom Homebrew from the Solaris7 forum ('LosTech custom weapons', April 2020): Lonely Coyote's rotary chemical laser, 5 tons and 2 slots "
            + "(Thunder's notes), a hybrid energy and ammunition weapon whose barrels cool in turn for a higher rate of fire. Fires as a Rotary AC: one, "
            + "two, four or six shots, heat and ammunition multiplied by the shots, the Missile Hits Table column saying how many hit, jamming on 2 (two "
            + "shots), 2-3 (four) or 2-4 (six) (BMR(R) pp.132-133). Not printed in the thread: damage, heat, ranges, dates and ammunition are the Clan "
            + "Small Chemical Laser's (TO:AUE p.132); BV 25 and 22,000 C-bills are that laser's 7 BV and 10,000 C-bills times the Rotary AC/5's over the "
            + "AC/5's (247/70 and 275,000/125,000).",
        damage: 3, damageAero: 12, accuracyModifier: 0, cbills: 22000, prototype: 3059, introduced: 3083, extinct: null, reintroduced: null, battleValue: 25, heat: 1, heatAero: 6, weight: 5,
        range: { min: 0, short: 1, medium: 2, long: 3 }, space: { battlemech: 2, protomech: -1, combatVehicle: 1, supportVehicle: 2, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 60, ammoTypes: ["ammo-clan-small-chemical-laser-standard"], ammoBattleValue: 4, minAmmoTons: 1, explosive: false, weaponType: ["DE"], techRating: "e", isRotary: true,
        book: "http://solaris7.com/thread/lostech-custom-weapons/", page: 0, rulesLevel: 6, rangeAero: "s",
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Custom equipment: no Alpha Strike conversion"] }
    },
    // Solaris7 forum idea (#301, 'LosTech custom weapons', April 2020): Thunder's Megaton Cannon (medium lasers linked to hit one spot,
    // 4 tons and 3 slots for 15 damage) and Prince's laser bracket, which Lycaon held to one weapon type, at most four, rolled on the
    // cluster table "as an outgrowth of the Machine Gun array". Custom Homebrew: the Machine Gun Array's rules on lasers, at the weight
    // of one linked laser as the array weighs one machine gun (Thunder's 4 tons for three medium lasers), a quarter of its cost, its dates.
    {
        name: "Laser Array (Small)", tag: "custom-small-laser-array", techBase: "is", catalog: "custom", sort: "laser, array, small", category: "Energy Weapons",
        notes: "Custom Homebrew from the Solaris7 forum ('LosTech custom weapons', April 2020): links two to four Small Lasers in its location and fires them "
            + "as one cluster weapon, as a Machine Gun Array does (TM p.228): one to-hit roll, the Missile Hits Table for how many hit. BV is 0.67 times the "
            + "linked lasers'.",
        damage: 3, damageAero: 3, accuracyModifier: 0, cbills: 2813, prototype: 3066, introduced: 3068, extinct: null, reintroduced: null, battleValue: 0, heat: 0, heatAero: 0, weight: 0.5,
        range: { min: 0, short: 1, medium: 2, long: 3 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: ["DE"], techRating: "e", linkedWeaponTags: ["small-laser"],
        book: "http://solaris7.com/thread/lostech-custom-weapons/", page: 0, rulesLevel: 6,
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Array damage is carried by its linked lasers"] }
    },
    {
        name: "Laser Array (Medium)", tag: "custom-medium-laser-array", techBase: "is", catalog: "custom", altNames: ["Megaton Cannon"], sort: "laser, array, medium", category: "Energy Weapons",
        notes: "Custom Homebrew from the Solaris7 forum ('LosTech custom weapons', April 2020): Thunder's Megaton Cannon. Links two to four Medium Lasers in its "
            + "location and fires them as one cluster weapon, as a Machine Gun Array does (TM p.228): one to-hit roll, the Missile Hits Table for how many hit. "
            + "BV is 0.67 times the linked lasers'.",
        damage: 5, damageAero: 5, accuracyModifier: 0, cbills: 10000, prototype: 3066, introduced: 3068, extinct: null, reintroduced: null, battleValue: 0, heat: 0, heatAero: 0, weight: 1,
        range: { min: 0, short: 3, medium: 6, long: 9 }, space: { battlemech: 1, protomech: -1, combatVehicle: 1, supportVehicle: 1, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: ["DE"], techRating: "e", linkedWeaponTags: ["medium-laser"],
        book: "http://solaris7.com/thread/lostech-custom-weapons/", page: 0, rulesLevel: 6,
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Array damage is carried by its linked lasers"] }
    },
    {
        name: "Omni-Laser", tag: "custom-omni-laser", techBase: "is", sort: "laser, omni", category: "Custom Equipment",
        notes: "Homebrew laser by u/heavyarmormecha (https://www.reddit.com/r/battletech/comments/1n30c2j/custom_weapons_omnilaser/); the replies called it overpowered. "
            + "The player picks a mode at the start of the Weapons Phase, kept until the next one. A critical hit disables the weapon. "
            + "Focus: 20 heat, 16 damage to one location; if armor still covers the location, a through-armor critical roll at -2. "
            + "Pulse: 18 heat, four 5-damage shots on the 4 column of the cluster table, -1 to hit and +1 on the cluster roll. "
            + "Dazzler: 12 heat, fifteen 1-damage shots on the 15 column; against infantry, battle armor or ProtoMechs a hit does 4d6 in 5-damage clusters. "
            + "A targeting computer and laser insulation apply; a power amplifier is needed on ICE and fuel cell units. Inspired by: u/heavyarmormecha. "
            + "The record carries the Focus mode's heat and damage; the other modes are play text. "
            + "Not given by the author, so NGCFells's: the author's Experimental availability is read as introduced 3150; cost and Battle Value are priced at the Focus mode, the strongest of its three, "
            + "as the canon MML is priced at its LRM mode (the MML 5 is 45, the LRM 5's, not LRM plus SRM); the other two modes add nothing.",
        damage: 16, damageAero: 16, accuracyModifier: 0, cbills: 0, introduced: 3150, extinct: null, reintroduced: null, battleValue: 0, heat: 20, heatAero: 20, weight: 10,
        range: { min: 0, short: 6, medium: 12, long: 18 }, space: { battlemech: 4, protomech: -1, combatVehicle: 4, supportVehicle: 4, aerospaceFighter: 4, smallCraft: 4, dropShip: -1 },
        shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: ["DE", "E"], techRating: "x", book: "Reddit u/heavyarmormecha", page: 0, rulesLevel: 6,
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Unverified custom equipment"] }
    },
    {
        name: "Superheavy PPC", tag: "custom-superheavy-ppc", techBase: "universal", catalog: "custom", sort: "ppc, 3, superheavy", category: "Energy Weapons",
        notes: "Custom Homebrew by u/FedditSuns, 'Custom Weapon Feedback: Superheavy PPC', r/battletech (https://www.reddit.com/r/battletech/comments/1bhfssf/). "
            + "From the post: 13 tons, 5 slots, 20 heat, 20 damage, range 3/6/12/18, aerospace range medium, Battle Value 422, cost 300,000 C-Bills. "
            + "Inspired by: u/FedditSuns. Not given in the post, so NGCFells's: the tech base is left universal and the dates and tech rating are unverified.",
        damage: 20, damageAero: 20, accuracyModifier: 0, cbills: 300000, introduced: null, extinct: null, reintroduced: null, battleValue: 422, heat: 20, heatAero: 20, weight: 13,
        range: { min: 3, short: 6, medium: 12, long: 18 }, space: { battlemech: 5, protomech: -1, combatVehicle: 5, supportVehicle: 5, aerospaceFighter: 5, smallCraft: -1, dropShip: -1 },
        shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: ["DE"], rangeAero: "m", techRating: "x", book: "Reddit u/FedditSuns", page: 0, rulesLevel: 6,
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Unverified custom equipment"] }
    },
    {
        name: "Fusion Lance", tag: "custom-fusion-lance", techBase: "universal", catalog: "custom", sort: "lance, fusion", category: "Energy Weapons",
        notes: "Custom Homebrew by u/Magical_Savior, 'Weapon Idea - Fusion Lance', r/battletech (https://www.reddit.com/r/battletech/comments/1mhvhwp/). "
            + "The first draft was 5 damage per 100 of engine rating; u/sokttocs called it too weak for 30 heat and 3 hexes, and the author replied with the revised damage used here. "
            + "From the post: 4 tons, 2 slots, 30 heat, a 3-hex attack range. "
            + "Inspired by: u/Magical_Savior, u/sokttocs. Not given in the post, so NGCFells's: the record's damage is the smallest the formula gives (15, for an engine rated 100 or less) "
            + "because a record holds one number; the rules text carries the formula. Range is read as 1 / 2 / 3 hexes for the weapon's 3-hex reach with its 5-a-hex falloff. "
            + "Dates and tech rating are unverified. The Engine-slot mounting is not enforced by the builder.",
        rules: "Mounted only where there are Engine critical slots. Activating it costs 30 heat; its attack reaches 3 hexes. Damage is 10 plus 5 for each 100 of "
            + "engine rating or part of 100 (15 at the least, 30 at the most), less 5 for each hex after the first, and it does full damage to infantry. "
            + "Each activation needs a Supercharger roll, and activations stack with a mounted Supercharger. A failed roll is a critical hit on the topmost engine slot, "
            + "applied at once. Each engine hit takes 5 off the damage.",
        damage: { short: 15, medium: 10, long: 5, aeroShort: 15, aeroMedium: 10, aeroLong: 5 }, damageAero: 15, accuracyModifier: 0, cbills: 0, introduced: null, extinct: null, reintroduced: null, battleValue: 0, heat: 30, heatAero: 30, weight: 4,
        range: { min: 0, short: 1, medium: 2, long: 3 }, space: { battlemech: 2, protomech: -1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 },
        shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: ["DE"], techRating: "x", book: "Reddit u/Magical_Savior", page: 0, rulesLevel: 6, variableFormula: "fusion-lance",
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Unverified custom equipment"] }
    },
    // The Best of Future Wars, Volume One (1991), Chunk A of the fanzine plan (#172). Custom Homebrew: fan material. Heat, Battle Value,
    // dates and tech rating are left unverified where the article's stat block gives none.
    {
        name: "Gatling Laser", tag: "custom-gatling-laser", techBase: "universal", catalog: "custom", sort: "laser, gatling", category: "Energy Weapons",
        notes: "Custom Homebrew: Karl Sanders, 'The Gatling Laser', *Future Wars* #8 (1988), p.37 ('New Technology'); reprinted in *The Best of Future Wars, Volume One* (1991), p.27. The original's prose cuts damage and range by a third, heat by over 75% and weight by a third (the reprint says 36% lighter), but the stat block "
            + "says 4 tons, and the block is used. Not printed in The Best of Future Wars: heat is NGCFells's, 1, the 75% cut read off a medium laser's 3 heat and rounded up (the block gives none); "
            + "dates and tech rating are unverified.",
        rules: "A rotating-barrel laser: six shots a turn of 2 points each, rolled to hit on the SRM 6 cluster column. Ranges 1-2, 3-4, 5-6. 1 heat.",
        lore: "The Gatling Laser spins six small focusing barrels around a common power feed, so each pulse leaves through a barrel that has had a "
            + "moment to cool. Its designers set out to match a medium laser's punch for far less waste heat, and the weapon trades one heavy bolt "
            + "for a stream of light hits scattered across the target.",
        damageClusters: 6, damagePerCluster: 2, damageAero: 12, accuracyModifier: 0, cbills: 50000, introduced: null, extinct: null, reintroduced: null, battleValue: 0, heat: 1, heatAero: 1, weight: 4,
        range: { min: 0, short: 2, medium: 4, long: 6 }, space: { battlemech: 2, protomech: -1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 },
        shotsPerTon: 0, minAmmoTons: 0, explosive: false, weaponType: ["DE", "C"], techRating: "x", book: "The Best of Future Wars, Volume One", page: 27, rulesLevel: 6,
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Unverified custom equipment"] }
    },
    {
        name: "Long Range Flamer", tag: "custom-lr-flamer", techBase: "universal", catalog: "custom", altNames: ["LR Flamer"], sort: "flamer, long range", category: "Energy Weapons",
        notes: "Custom Homebrew: Karl Sander, 'Long Range Flamer', *Future Wars* #9 (1988), p.27 ('New Technology...'); reprinted in *The Best of Future Wars, Volume One* (1991), p.28. Every number matches the original. Not printed in either: "
            + "dates and tech rating are unverified.",
        rules: "Fuel-fed (ammo-custom-lr-flamer-standard, 15 shots a ton). "
            + "The blaze sticks to the target as an inferno hit does: it does 5 plus 5 heat levels the first turn, 2 plus 5 the second and 0 plus 5 the third; a second hit adds its damage to "
            + "the one still burning, and each earlier hit still burning adds 1 heat, to a most of 10 heat a turn. Harder to hit at range: +2 at medium, +3 at long. A miss "
            + "scatters on a die: 1-3 one hex short of the target, 4 left, 5 right, 6 behind it, and the hexes struck catch fire.",
        lore: "Rather than vent plasma bled from the fusion reactor, the Long Range Flamer throws a jet of jellied fuel from tanks of its own. "
            + "The fuel clings and keeps burning for several turns, and a stream that misses still sets the ground ablaze around its target. "
            + "It reaches far beyond any standard flamer, at the price of a fuel supply that can turn on its carrier if the tanks are breached.",
        damage: 5, damageAero: 5, accuracyModifier: 0, cbills: 65000, introduced: null, extinct: null, reintroduced: null, battleValue: 0, heat: 8, heatAero: 8, weight: 5,
        range: { min: 0, short: 4, medium: 8, long: 12 }, space: { battlemech: 2, protomech: -1, combatVehicle: -1, supportVehicle: -1, aerospaceFighter: -1, smallCraft: -1, dropShip: -1 },
        shotsPerTon: 15, ammoTypes: ["ammo-custom-lr-flamer-standard"], minAmmoTons: 1, explosive: false, weaponType: ["DE"], techRating: "x", book: "The Best of Future Wars, Volume One", page: 28, rulesLevel: 6,
        alphaStrike: { heat: 0, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Unverified custom equipment"] }
    }
]);

/** The Best of Future Wars (1991) p.28: weapons with a Power Booster (#172), the Gatling Laser built from the record above. */
const gatlingLaser = energyCustomBase.find((item) => item.tag === "custom-gatling-laser");
if (!gatlingLaser) throw new Error("energy-custom: custom-gatling-laser not found");
// The boosted weapons are built from records the first pass has filled, and take the same pass themselves (a figure already there is never changed).
export const energyCustom: IEquipmentItem[] = applyDerivedValues([...energyCustomBase, ...futureWarsBoostedWeapons(gatlingLaser)]);
