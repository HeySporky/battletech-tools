/*
* DISCLAIMER: This file processes gameplay data derived from the BattleTech universe.
* All lore, stats, and intellectual property belong strictly to Catalyst Game Labs,
* Topps, and their respective rights holders.
*
* This open-source utility is a non-commercial fan project designed purely for
* tabletop gameplay assistance. Content processed by this file is not intended
* to challenge any copyright or trademark status, and this data is explicitly
* excluded from the software's underlying license (GNU GPLv3).
*/

import { IEditionStats, IEditionStatsTable } from "./data-interfaces";

/**
 * Editions of the BattleTech rules, oldest first, so a player can later choose to build and play with one
 * edition's rules only. Reserved for that feature (roadmap: "select a rules version"); nothing filters on it yet.
 *
 * Each record an earlier edition includes carries an `editionStats` table with one key per such edition: the
 * stats that edition prints, or `null` when they match the previous edition that lists the record. The record's
 * `introducedInEdition` is the first of those keys. A record with no table belongs to the edition the catalogs
 * cite (Total Warfare). An edition is entered whole, from its rulebook's page images, before the next is begun;
 * `complete` says which are done. Never tag from memory or from OCR text.
 *
 * Stats are entered as printed, with one exception (user ruling, 2026-10-07): an obvious misprint is corrected,
 * and the entry's `errata` says what the book prints and why it was changed. Anything less than obvious stays
 * as printed with a note, such as the 6.5-ton 170 engine in Battledroids.
 *
 * The core rulebooks replaced one another: the Core Rulebook's designer's notes (CRB p.247) give that line and
 * its years for 1987 to 2001 and date the Second Edition box set to 1985. The other years are the copyright
 * dates on the books' own credits pages. The Third Edition (1992) and Fourth Edition (1996) box sets were the
 * introductory game sold beside the reference rulebook of the day (Master Rules, introduction: "The introductory
 * game in the BattleTech line is the BattleTech, Fourth Edition boxed set"), so each holds less than the
 * rulebook before it in this list. That is why an edition's contents come from the `editionStats` keys and
 * never from its place in the list.
 */
export interface IRulesEdition {
    /** Stable id stored on records and in saves. */
    tag: string;
    name: string;
    /** First publication year of the edition's core rulebook. */
    year: number;
    /** The core rulebook, by the abbreviation used in record citations. */
    book: string;
    /** True once every item the edition's rulebook includes has its `editionStats` entry. */
    complete?: boolean;
    /** The 'Mechs the rulebook prints, as it names them. */
    mechs?: string[];
    /** Other units the rulebook gives rules for; they are fixed designs, not built from the catalogs. */
    otherUnits?: string[];
    /** What the edition includes that the tool has no record for. */
    notModelled?: string[];
}

export const btRulesEditions: IRulesEdition[] = [
    {
        // Battledroids, the game's first edition: credits page, "Copyright 1984 FASA Corporation".
        tag: "battledroids",
        name: "Battledroids",
        year: 1984,
        book: "BD",
        complete: true,
        // BD pp.16-17, the ten record listings.
        mechs: [
            "STG-3R Stinger", "WSP-1A Wasp", "PXH-1K Phoenix Hawk", "GRF-1N Griffin", "SHD-2H Shadow Hawk",
            "RFL-3N Rifleman", "CRD-3R Crusader", "ARC-2R Archer", "WHM-6R Warhammer", "MAD-3R Marauder",
        ],
        // BD pp.22-23, Expert Battledroids optional rules.
        otherUnits: ["SCR-8N Scorpion tank", "HNT-3R Hunter tank", "VDE-3T Vedette tank", "Jeep", "Infantry squad"],
        notModelled: [
            "5-ton battledroids: tonnage runs from 5 to 100 in steps of 5 (BD p.23); the tool starts at 10.",
            "Tanks, jeeps and infantry are fixed designs with their own armor and movement (BD pp.22-23).",
            "A severed arm or leg picked up as a club: an optional rule, not an item (BD p.21).",
        ],
    },
    {
        // BattleTech, Second Edition box set: "that 1985 box set" (CRB p.247); its rulebook prints "Copyright 1985".
        tag: "battletech-2nd-edition",
        name: "BattleTech, Second Edition",
        year: 1985,
        book: "BT2",
        complete: true,
        // BT2 pp.36-41, the fourteen record listings, and the training 'Mech of p.1.
        mechs: [
            "LCT-1V Locust", "STG-3R Stinger", "WSP-1A Wasp", "PXH-1 Phoenix Hawk", "GRF-1N Griffin",
            "SHD-2H Shadow Hawk", "WVR-6R Wolverine", "RFL-3N Rifleman", "CRD-3R Crusader", "TDR-5S Thunderbolt",
            "ARC-2R Archer", "WHM-6R Warhammer", "MAD-3R Marauder", "BLR-1G BattleMaster", "CHM-3 Chameleon",
        ],
        // Tanks, jeeps and infantry are mentioned in the background text only (BT2 p.5); they have no rules.
        otherUnits: [],
        notModelled: [
            "A severed arm or leg picked up as a club: an optional rule, not an item (BT2 p.36).",
        ],
    },
    {
        // The BattleTech Manual: The Rules of Warfare: credits page, "Copyright 1987"; CRB p.247.
        tag: "battletech-manual",
        name: "The BattleTech Manual",
        year: 1987,
        book: "BTM",
        complete: true,
        // A rulebook only: it prints no 'Mech record listings and names designs in passing (BTM pp.41, 74).
        mechs: [],
        // Units with their own construction rules (BTM pp.80-84) or tables (BTM pp.36, 50).
        otherUnits: [
            "Tracked vehicle", "Wheeled vehicle", "Hovercraft", "VTOL", "Hydrofoil",
            "Conventional naval vessel", "Submarine",
            "Foot infantry platoon", "Motorized infantry platoon", "Jump infantry platoon",
            "AeroSpace Fighter", "Conventional Fighter", "DropShip", "Land-Air 'Mech",
            "Gun emplacement or building",
        ],
        notModelled: [
            "Component prices: the 'Mech Cost Chart gives formulas for the cockpit, life support, sensors, musculature, skeleton, actuators, engine, gyro, jump jets and armor (BTM p.84); only the fixed prices are entered.",
            "Mines: command-detonated, conventional and Vibrabombs are placed by scenario, not mounted (BTM p.45).",
            "Cargo space: tonnage a 'Mech or vehicle sets aside, with no item of its own (BTM p.40).",
            "Vehicle parts: lift, rotor and diving equipment, turrets, power amplifiers and fusion shielding are percentages of the vehicle, not items (BTM pp.81-82).",
            "Infantry weapons: rifles, machine guns, flamers, portable lasers and SRMs exist only as platoon damage rows (BTM p.36).",
            "Clubs: a severed arm or leg, an uprooted tree or a girder from a rubbled building, picked up on the map (BTM p.27).",
        ],
    },
    {
        // The BattleTech Compendium (FASA 1640): credits page, "Copyright 1990 FASA Corporation"; CRB p.247.
        tag: "battletech-compendium",
        name: "The BattleTech Compendium",
        year: 1990,
        book: "BTC",
        complete: true,
        // A rulebook only: it prints no 'Mech record listings and names designs in passing (BTC pp.56, 61, 104).
        mechs: [],
        // Units with their own construction rules (BTC pp.105, 122-127), tables (BTC pp.45-46) or record sheets.
        otherUnits: [
            "Tracked vehicle", "Wheeled vehicle", "Hovercraft", "VTOL", "Hydrofoil",
            "Displacement hull vessel", "Submarine",
            "Foot infantry platoon", "Motorized infantry platoon", "Jump infantry platoon", "BattleArmor point",
            "AeroSpace Fighter", "Conventional Fighter", "DropShip", "JumpShip", "Land-Air BattleMech",
            "OmniMech", "OmniFighter",
            "Installation (building or gun emplacement)",
        ],
        notModelled: [
            "Component prices: the BattleMech Costs and Formulas chart prices the cockpit, life support, sensors, musculature, skeleton, actuators, engine, gyro, jump jets, heat sinks and armor by formula, with x.75 for a LAM and x.25 for an OmniMech (BTC p.128); only the fixed prices are entered.",
            "Clan CASE: no weight, no critical slot, built into every Clan ammunition-fed weapon pod (BTC pp.118-119, 122); the catalogs have no record for it.",
            "OmniMech pods: a design sets aside tonnage and critical slots for pods filled before each battle; engines, Endo Steel, MASC and armor never go in pods (BTC pp.112, 122-123).",
            "Mines: conventional, command-detonated and Vibrabomb fields are placed by scenario; Thunder LRMs and the Clan Arrow IV FASCAM round lay conventional fields (BTC pp.60-61, 117, 121).",
            "Vehicle parts: lift, rotor and diving equipment, controls, turrets, power amplifiers and fusion shielding are percentages of the vehicle, not items (BTC pp.123-125).",
            "Infantry weapons: rifles, machine guns, flamers, portable lasers and SRMs exist only as platoon to-hit and damage rows and platoon prices (BTC pp.45, 130).",
            "BattleArmor: a fixed design, five Elementals to a Point, each suit with 11 points of armor, SRMs and a small laser, flamer or machine gun; 3,500,000 C-bills a Point (BTC pp.8, 45-46, 130).",
            "Clubs: a severed arm or leg, an uprooted tree or a girder from a rubbled building, picked up on the map (BTC p.31).",
            "Single-shot Streak, Narc and Artemis launchers: allowed at double the launcher's base price, with no rows of their own (BTC p.121); only the LRM and SRM single-shot launchers are entered.",
        ],
    },
    {
        // BattleTech, Third Edition box set: rulebook credits page, "Copyright 1992 FASA Corporation".
        tag: "battletech-3rd-edition",
        name: "BattleTech, Third Edition",
        year: 1992,
        book: "BT3",
        complete: true,
        // The four training scenarios name the fourteen 'Mechs of the box by chassis (BT3 pp.36-39); the model
        // codes are from the pregenerated record sheets (BT3 p.5: "the fourteen 'Mechs included in the basic
        // game"). The sheets in the library's scan are footed "Copyright 1996", so they are a later printing
        // of that booklet; the blank sheet beside them is footed 1992.
        mechs: [
            "LCT-1V Locust", "STG-3R Stinger", "WSP-1A Wasp", "PXH-1 Phoenix Hawk", "GRF-1N Griffin",
            "SHD-2H Shadow Hawk", "WVR-6R Wolverine", "RFL-3N Rifleman", "CRD-3R Crusader", "TDR-5S Thunderbolt",
            "ARC-2R Archer", "WHM-6R Warhammer", "MAD-3R Marauder", "BLR-1G BattleMaster",
        ],
        // BattleMechs only: other combat units appear in the background text alone.
        otherUnits: [],
        notModelled: [
            "Clubs: a severed arm or leg, or an uprooted tree good for one successful attack, picked up on the map and swung with two hands (BT3 pp.30-31).",
        ],
    },
    {
        // BattleTech Compendium: The Rules of Warfare: credits page, "Copyright 1994 FASA Corporation"; CRB p.247.
        // The library's copy is the third printing (September 1995); what it may correct over the first
        // printing is not known.
        tag: "compendium-rules-of-warfare",
        name: "BattleTech Compendium: The Rules of Warfare",
        year: 1994,
        book: "BTC:RoW",
        complete: true,
        // The Technical Readout sections (BTC:RoW pp.125-132), with a record sheet for each at the back of the
        // book. The Clan designs are headed by their Clan names, with the Inner Sphere designation beside them.
        mechs: [
            "RVN-3L Raven", "BSW-X1 Bushwacker", "AXM-2N Axman", "MAL-1R Mauler",
            "Hunchback IIC", "Mad Dog (Vulture)", "Summoner (Thor)", "Timber Wolf (Mad Cat)",
        ],
        // Units with their own construction rules (BTC:RoW pp.106-109), tables (BTC:RoW pp.66, 69) or rules
        // sections (BTC:RoW pp.56, 70, 88). It is a ground game: the AeroTech rules and Land-Air BattleMechs of
        // the 1990 Compendium are gone (BTC:RoW p.7), and fighters appear only as off-map support.
        otherUnits: [
            "Tracked vehicle", "Wheeled vehicle", "Hovercraft", "VTOL", "Hydrofoil",
            "Displacement hull vessel", "Submarine",
            "Foot infantry platoon", "Motorized infantry platoon", "Jump infantry platoon",
            "Battle armor Point", "Inner Sphere battle suit unit",
            "OmniMech",
            "Aerospace support fighter (light, medium, heavy)",
            "Building", "Gun emplacement",
        ],
        notModelled: [
            "Component prices: the BattleMech Cost Table prices the cockpit, life support, sensors, musculature, skeleton, actuators, engine, gyro, jump jets, heat sinks and armor by formula, with x.25 for an OmniMech and a final multiplier of 1 + tonnage / 100 (BTC:RoW p.123); only the fixed prices are entered.",
            "Clan CASE: no weight and no critical slots, in every Clan weapon pod that holds an ammunition-fed weapon (BTC:RoW pp.104, 115); the catalogs have no record for it.",
            "OmniMech pods: a design sets aside tonnage and critical slots for pods filled before each battle; engines, endo steel, MASC and armor never go in pods, and lower arm and hand actuators are pods that cannot share an arm with a PPC, autocannon or Gauss rifle (BTC:RoW pp.106-107).",
            "Mines: Thunder LRMs, the Clan Arrow IV FASCAM round and the mine-type bomb lay conventional fields (BTC:RoW pp.73, 93, 113, 121).",
            "Vehicle parts: control components, lift, rotor and diving equipment, turrets, power amplifiers and fusion shielding are percentages of the vehicle, not items; a vehicle carries 5 items plus 1 for every 5 full tons (BTC:RoW pp.107-109).",
            "Cargo space: tonnage a vehicle sets aside; BattleMechs cannot allocate it (BTC:RoW p.115).",
            "Infantry weapons: rifles, machine guns, flamers, portable lasers and SRMs exist only as platoon damage rows and platoon prices (BTC:RoW pp.66, 123).",
            "Battle armor: a fixed design, five Elementals to a Point, each suit with 10 points of armor and an SRM-2 with a small laser, flamer or machine gun; Inner Sphere battle suits have 9 points and no SRMs (BTC:RoW pp.66, 69). 3,500,000 C-bills a Clan Point, 3,000,000 an Inner Sphere unit (BTC:RoW p.123).",
            "Clubs: a severed arm or leg, an uprooted tree good for one successful attack, or a girder from a rubbled building, picked up on the map and swung with two hands (BTC:RoW p.46).",
            "Single-shot launchers fitted for special munitions or an Artemis IV FCS: allowed at double the launcher's base cost, with no rows of their own (BTC:RoW p.120). The LRM, SRM, Streak and Narc single-shot launchers are entered; the Streak and Narc ones carry no price, because the book does not say which base cost is doubled.",
        ],
    },
    {
        // BattleTech, Fourth Edition box set: rulebook credits page, "4th Edition Revision", "Copyright 1996
        // FASA Corporation".
        tag: "battletech-4th-edition",
        name: "BattleTech, Fourth Edition",
        year: 1996,
        book: "BT4",
        complete: true,
        // The box holds playing pieces for "twenty-four different BattleMech designs" (BT4 p.5). Their record
        // sheets and the Introduction to BattleTech book that describes them are not in the library, so only
        // the twenty the rulebook's scenarios name are listed (BT4 pp.36-39); the Assassin is named without
        // a model code (BT4 p.36).
        mechs: [
            "COM-2D Commando", "SDR-5V Spider", "JR7-D Jenner", "PNT-9R Panther", "Assassin", "CDA-2A Cicada",
            "CLNT-2-3T Clint", "HER-2S Hermes II", "ENF-4R Enforcer", "HBK-4G Hunchback", "TBT-5N Trebuchet",
            "DV-6M Dervish", "DRG-1N Dragon", "QKD-4G Quickdraw", "CPLT-C1 Catapult", "JM6-S JagerMech",
            "GHR-5H Grasshopper", "AWS-8Q Awesome", "ZEU-6S Zeus", "AS7-D Atlas",
        ],
        // BattleMechs only: infantry and conventional vehicles are left to CityTech, Second Edition (BT4 p.4).
        otherUnits: [],
        notModelled: [
            "Four of the box's twenty-four BattleMech designs: the rulebook names twenty, and the record sheet book is not in the library (BT4 p.5).",
            "Clubs: picked up on the map and swung with two hands; the hatchet attacks by the same rules with one (BT4 pp.28, 46).",
        ],
    },
    {
        // BattleTech Master Rules (FASA 1707): back cover, "Copyright 1998 FASA Corporation"; CRB p.247.
        tag: "master-rules",
        name: "BattleTech Master Rules",
        year: 1998,
        book: "BMR",
        complete: true,
        // A rulebook only: it prints no 'Mech record listings. The construction example builds a 45-ton Wyvern
        // (BMR pp.109-114), and designs are named in passing.
        mechs: [],
        // Units with their own construction rules (BMR pp.118-120), rules sections (BMR pp.51, 56-67) or prices
        // (BMR p.137). There are no aerospace units or Land-Air BattleMechs in this book.
        otherUnits: [
            "Tracked vehicle", "Wheeled vehicle", "Hovercraft", "VTOL", "Hydrofoil",
            "Displacement hull vessel", "Submarine",
            "Foot infantry platoon", "Motorized infantry platoon", "Jump infantry platoon",
            "Clan battle armor Point (Standard, Gnome, Salamander)",
            "Inner Sphere battle armor squad (Standard, Infiltrator, Sloth, Gray Death Light Scout, Longinus, Achileus, Kage, Kanazuchi)",
            "OmniMech", "OmniVehicle",
            "Building",
        ],
        notModelled: [
            "Component prices: the BattleMech Costs Table prices the cockpit, life support, sensors, musculature, skeleton, actuators, engine, gyro, jump jets, heat sinks and armor by formula, with x.25 for an OmniMech and a final multiplier of 1 + tonnage / 100 (BMR p.136); only the fixed prices are entered.",
            "Clan CASE: no weight and no critical slots, in every Clan location that holds explosive ammunition or equipment (BMR pp.117, 126); the catalogs have no record for it.",
            "OmniMech and OmniVehicle pods: a design fixes its structure, engine and armor and leaves tonnage and space for pods (BMR pp.114, 120).",
            "Flare LRMs: fired at a hex to light it and everything within 3 hexes, for the launcher's size divided by 5 turns (BMR p.130); the catalogs have no record for them.",
            "Narc Explosive Pods for the Clan launcher: the price list serves both technology bases (BMR pp.133, 138); the catalogs have an Inner Sphere record only.",
            "Mines: conventional, command-detonated and vibrabomb fields are placed before play; Thunder LRMs and the Clan Arrow IV FASCAM round lay conventional fields (BMR pp.80-81, 132).",
            "Vehicle parts: control components, lift, rotor and diving equipment, turrets, power amplifiers and fusion shielding are percentages of the vehicle, not items; a vehicle carries 5 items plus 1 for every 5 full tons (BMR pp.118-119).",
            "Cargo space: tonnage a vehicle sets aside; BattleMechs cannot allocate it (BMR pp.125-126).",
            "Infantry weapons: rifles, machine guns, flamers, portable lasers and SRMs exist only as platoon damage rows and platoon prices (BMR p.137).",
            "Battle armor: eleven fixed designs with their own armor, movement and weapons, priced by the Point or squad (BMR pp.60-66, 137).",
            "Clubs: a severed arm or leg, an uprooted tree good for one successful attack, or a girder from a rubbled building, picked up on the map and swung with two hands (BMR p.40).",
            "Single-shot launchers with special munitions: the launcher's base cost is multiplied by the munition's multiple (BMR p.129); only the plain single-shot launchers are entered.",
        ],
    },
    {
        // Classic BattleTech Master Rules, Revised Edition (FanPro 35000): credits page, "2001-2005 WizKids";
        // CRB p.247.
        tag: "master-rules-revised",
        name: "BattleTech Master Rules, Revised Edition",
        year: 2001,
        book: "BMR(R)",
        complete: true,
        // A rulebook only, as the Master Rules was: no 'Mech record listings. The construction example is again the
        // 45-ton Wyvern (BMR(R) pp.115-120), and the Battle Value example a Goshawk (BMR(R) p.159).
        mechs: [],
        // Units with their own construction rules (BMR(R) pp.124-129), rules sections (BMR(R) pp.49-71) or prices
        // (BMR(R) p.150). ProtoMechs are new; the battle armor names are those of the Infantry Costs Table.
        otherUnits: [
            "Tracked vehicle", "Wheeled vehicle", "Hovercraft", "VTOL", "Hydrofoil",
            "Displacement hull vessel", "Submarine",
            "Foot infantry platoon", "Motorized infantry platoon", "Jump infantry platoon",
            "Clan battle armor Point (Standard, Gnome, Salamander, Sylph, Undine)",
            "Inner Sphere battle armor squad (Standard, Achileus, Cavalier, Fa Shih, Fenrir, Gray Death Light Scout, Gray Death Standard, Infiltrator, Infiltrator Mk. II, Kage, Kanazuchi, Longinus, Raiden, Purifier, Sloth)",
            "ProtoMech",
            "OmniMech", "OmniVehicle",
            "Building", "Gun emplacement",
        ],
        notModelled: [
            "Component prices: the BattleMech Costs Table prices the cockpit, life support, sensors, musculature, skeleton, actuators, engine, gyro, jump jets, heat sinks and armor by formula, with x.25 for an OmniMech and a final multiplier of 1 + tonnage / 100 (BMR(R) p.149); only the fixed prices are entered.",
            "Battle Values: the Battle Value System gives formulas for BattleMechs, vehicles, ProtoMechs and infantry and a Battle Value for every weapon and item (BMR(R) pp.152-159); the edition entries hold no Battle Values.",
            "ProtoMechs: 2 to 9 tons, built from their own tables and priced by their own cost table (BMR(R) pp.54-55, 124-126, 150); they are fixed designs here, not built from the catalogs.",
            "Clan CASE: no weight and no critical slots, in every Clan location that holds explosive ammunition or equipment (BMR(R) pp.123, 136); the catalogs have no record for it.",
            "OmniMech and OmniVehicle pods: a design fixes its structure, engine and armor and leaves tonnage and space for pods (BMR(R) pp.120, 129).",
            "Flare LRMs: fired at a hex to light it and everything within 3 hexes, for the launcher's size divided by 5 turns (BMR(R) p.141); the catalogs have no record for them.",
            "Incendiary autocannon ammunition: 2 more points against unarmored infantry, fires on 5+, a +1 night modifier, and an explosion if the autocannon takes a critical hit in a turn it fired the rounds; 2 x normal (BMR(R) pp.133, 151). The catalogs have no record for it.",
            "Narc Explosive Pods for the Clan launcher: the one Narc munition Clan units may use (BMR(R) pp.146, 151); the catalogs have an Inner Sphere record only.",
            "Rocket launcher reloads: the price list's Ammo Cost for a rocket launcher is its reload after a mission (BMR(R) pp.140, 151); it is noted on the launchers, which carry no ammunition.",
            "Mines: conventional, command-detonated and vibrabomb fields are placed before play; Thunder LRMs and their variants and the Arrow IV FASCAM and Vibrabomb-IV rounds lay fields in play (BMR(R) pp.77, 86, 144-145).",
            "Vehicle parts: control components, lift, rotor and diving equipment, turrets, power amplifiers and fusion shielding are percentages of the vehicle, not items; a vehicle carries 5 items plus 1 for every 5 full tons (BMR(R) pp.126-128).",
            "Cargo space: tonnage a vehicle sets aside; BattleMechs cannot allocate it (BMR(R) p.135).",
            "Infantry weapons: rifles, machine guns, flamers, portable lasers and SRMs exist only as platoon damage rows and platoon prices (BMR(R) p.150).",
            "Battle armor: fixed designs with their own armor, movement and weapons, priced by the Point or squad (BMR(R) pp.62-71, 150).",
            "Clubs: picked up on the map and swung with two hands (BMR(R) p.40).",
            "Single-shot launchers with special munitions: the launcher's base cost is multiplied by the munition's multiple (BMR(R) p.140); only the plain single-shot launchers are entered.",
        ],
    },
    {
        // Total Warfare, ©2006 (first printing), with TechManual, Tactical Operations, Strategic Operations and
        // Interstellar Operations: the rules line every catalog record cites.
        tag: "total-warfare",
        name: "Total Warfare",
        year: 2006,
        book: "TW",
    },
    {
        // BattleTech Core Rulebook: credits page, "First Printing", "2026 The Topps Company". Its changes to the
        // Total Warfare rules are not modelled yet; a record first published in it is tagged with this edition.
        tag: "core-rulebook",
        name: "BattleTech Core Rulebook",
        year: 2026,
        book: "CRB",
    },
];

/** The edition a record belongs to when it does not say: the one the catalogs are written against. */
export const DEFAULT_RULES_EDITION = "total-warfare";

export function getRulesEditions(): IRulesEdition[] {
    return btRulesEditions;
}

type IEditionRecord = { introducedInEdition?: string; editionStats?: IEditionStatsTable };

const editionOrder = (tag: string) => btRulesEditions.findIndex(edition => edition.tag === tag);

/** A record's first edition: its own `introducedInEdition`, or the default when it has none. */
export function getIntroducedInEdition(record: IEditionRecord): string {
    return record.introducedInEdition ?? DEFAULT_RULES_EDITION;
}

/**
 * Do the rules of `editionTag` include this record? Before the default edition, only when the record's
 * `editionStats` lists that edition: the box sets hold less than the rulebooks around them, so nothing is
 * inherited from an earlier edition. From the default edition on, when the record's first edition is that
 * edition or an earlier one. An edition tag that is not in the list never matches.
 */
export function isInRulesEdition(record: IEditionRecord, editionTag: string = DEFAULT_RULES_EDITION): boolean {
    const selected = editionOrder(editionTag);
    if (selected < 0) {
        return false;
    }
    if (selected < editionOrder(DEFAULT_RULES_EDITION)) {
        return record.editionStats !== undefined && editionTag in record.editionStats;
    }
    const introduced = editionOrder(getIntroducedInEdition(record));
    return introduced >= 0 && introduced <= selected;
}

/**
 * The stats `editionTag` prints for this record: its own entry, or, where that is `null` (unchanged), the entry
 * of the nearest earlier edition that lists the record. Undefined when the edition does not include the record,
 * or is the default edition or later, whose stats are the record itself.
 */
export function getEditionStats(record: IEditionRecord, editionTag: string): IEditionStats | undefined {
    const table = record.editionStats;
    if (!table || !(editionTag in table)) {
        return undefined;
    }
    for (let index = editionOrder(editionTag); index >= 0; index--) {
        const stats = table[btRulesEditions[index].tag];
        if (stats) {
            return stats;
        }
    }
    return undefined;
}
