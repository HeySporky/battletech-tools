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

import type { EWarKind } from "../utils/ewar-play";
import { IEditionHistory, IEditionStats, IEditionStatsTable, IEquipmentItem, IRawMechStructure, IRulesLevelOption } from "./data-interfaces";
import { APOCRYPHAL_RULES_LEVEL, btRulesLevelOptions, getRulesLevelOptions } from "./rules-level-options";

/** The unit types the creators build, for an edition's `unitTypes`. */
export type RulesEditionUnitType = "mech" | "vehicle" | "fighter" | "small-craft" | "capital-ship" | "infantry" | "battle-armor" | "protomech" | "building" | "walker";

/** Every unit type: Total Warfare and its companion books (TechManual, Tactical and Strategic Operations) build them all. */
export const ALL_RULES_EDITION_UNIT_TYPES: RulesEditionUnitType[] = ["mech", "vehicle", "fighter", "small-craft", "capital-ship", "infantry", "battle-armor", "protomech", "building", "walker"];

/**
 * Editions of the BattleTech rules, oldest first, so a player can choose to build with one edition's rules only.
 * The Mech Creator's Rules Edition control is the first user: BattleMech.setRulesEdition() filters its lists and
 * reads its stats through the helpers at the end of this file.
 *
 * Each official record lists the editions it is canon in, in `editions` (empty when it never was): that list is
 * what an edition contains. `editionStats` holds only stats, with one key per earlier edition in the list: what that
 * edition prints, or `null` when it matches the previous edition that lists the record. `introducedInEdition` is the
 * list's first entry; catalog-editions.test.ts keeps the three in step. Custom and Munchkin records have no list,
 * and getRecordEditions() works one out. An edition is entered whole, from its rulebook's page images, before the
 * next is begun; `complete` says which are done. Never tag from memory or from OCR text.
 *
 * Stats are entered as printed, with one exception (user ruling, 2026-10-07): an obvious misprint is corrected,
 * and the entry's `errata` says what the book prints and why it was changed. Anything less than obvious stays
 * as printed with a note, such as the 6.5-ton 170 engine in Battledroids.
 *
 * The core rulebooks replaced one another: the Core Rulebook's designer's notes (CRB p.247) give that line and
 * its years for 1987 to 2001 and date the Second Edition box set to 1985. The other years are the copyright
 * dates on the books' own credits pages. No book in the library prints a release month, so the months are
 * sarna.net's release dates (user ruling 2026-10-24; tools/book-editions-reviewed.tsv). The Third Edition (1992) and Fourth Edition (1996) box sets were the
 * introductory game sold beside the reference rulebook of the day (Master Rules, introduction: "The introductory
 * game in the BattleTech line is the BattleTech, Fourth Edition boxed set"), so each holds less than the
 * rulebook before it in this list. That is why an edition's contents come from each record's `editions` and
 * never from the edition's place in this list.
 */
/** The game rules play mode applies, where an earlier edition's differ from Total Warfare's. */
export interface IEditionPlayRules {
    /** Heat points for moving: walking, running, and each hex jumped with its least. */
    moveHeat: { walk: number; run: number; jumpPerHex: number; jumpMinimum: number };
    /** Highest target movement modifier on the edition's table, before the +1 for jumping. */
    maxTargetMovementModifier: number;
    /** False when the edition has no modifier for firing at a second target. */
    secondaryTargetModifiers: boolean;
    /** Two-dice roll that makes a hit on the internal structure a critical hit. */
    criticalHitRoll: number;
    /** To-hit modifier against an immobile target, which may then take aimed shots; 0 when the edition has neither. */
    immobileTargetModifier: number;
}

/** A page of an edition's rulebook that governs one E-War item; Phases 1-3 add the rule fields here. */
export interface IEWarItemRule {
    book: string;
    page: number;
    note?: string;
    /** Alpha Strike: the radius or range in inches (ECM 12, LPRB 12, PRB 18, BH 26, DJ and HJ 34). */
    inches?: number;
    /** Alpha Strike: how many units one network links (C3 four, C3i six, NOVA three, NC3 six). */
    networkSize?: number;
    /** A later edition no longer prints the item: it stays available there as apocryphal and plays by this earlier printing (book and page above). */
    apocryphal?: boolean;
    /** Added to the 2D6 Cluster Hits roll (Artemis IV +2, V +3, prototype +1, Narc/iNarc pod +2, Apollo +1 by losing the MRM -1). */
    clusterShift?: number;
    /** The highest the shifted roll may reach (Artemis V: 12). */
    clusterMax?: number;
    /** Added to the attack to-hit number (Artemis V -1, homing pods -1, Core Rulebook Narc -1). */
    toHit?: number;
    /** Hostile ECM (attacker or target inside it) cancels the item in this edition. */
    ecmBlocks?: boolean;
    /** ECM cancels it only when the pod (the target) is inside the bubble, not when the attacker is (TW, CRB Narc). */
    ecmPodOnly?: boolean;
    /** Ammunition or launcher families the item does not combine with. */
    excludes?: string[];
    /** The defense an anti-missile item gives its carrier. */
    defense?: IEWarDefenseRule;
    /** Range bands (short, medium, long) in hexes. */
    rangeBands?: number[];
    /** TAG designates semi-guided LRMs (BMR p.131 on). */
    semiGuided?: boolean;
    /** What a TAG designation does for semi-guided LRMs: ignore target movement (default), or the Core Rulebook -1 Cluster and designated bonuses (CRB p.193). */
    semiGuidedMode?: "movement" | "designated-bonus";
    /** Stealth to-hit modifiers by range band (Stealth armor, Null-Signature, Chameleon). */
    stealthMods?: { short?: number; medium?: number; long?: number; extreme?: number };
    /** Stealth to-hit by hexes the target moved: the row with the highest `hexes` not above the move applies (Void-Signature, Mimetic). */
    stealthMoveMods?: { hexes: number; modifier: number }[];
    /** Heat a stealth system makes each turn it is on. */
    stealthHeat?: number;
    /** Added to the controlling unit's own ranged attacks (Void-Signature +1). */
    stealthOwnAttack?: number;
    /** Stealth systems this one cannot run with. */
    stealthExcludes?: EWarKind[];
    /** What the stealth system does to the unit's own ECM suite. */
    stealthEcm?: "switches-off" | "keeps-working" | "none-needed";
    /** An active stealth system cuts the unit off from its C3 network. */
    cutsC3?: boolean;
    /** The stealth system works only while an ECM suite of the unit is undestroyed (BMR(R) p.147, TO:AUE p.161, CRB p.209). */
    needsEcm?: boolean;
    /** While the system is on, the unit cannot use these probes: every probe (Void-Signature) or only the Bloodhound (Stealth armor). */
    blocksProbes?: "all" | "bloodhound";
    /** The movement table replaces the standard target movement modifier instead of adding to it (Purifier, BMR(R) p.71). */
    replacesMovement?: boolean;
    /** An Angel counts as two suites on each side of the ECM and ECCM ratio (Maximum Tech p.77), not the Angel-only rule of TO:AR p.99. */
    ecmRatio?: boolean;
    /** The range table applies only to non-infantry attackers; infantry attackers ignore it (IR sneak suits, TO:AUE p.130). */
    stealthRangeIgnoredByInfantry?: boolean;
    /** ECM bubble radius in hexes. */
    ecmRadius?: number;
    /** How many ECM or ECCM suites the item counts as (Angel 2). */
    ecmCounts?: number;
    /** What a hostile ECM bubble cancels in this edition (artemis, narc, c3, c3i, beagle, streak-lock, bloodhound, c3-boosted). */
    ecmCancels?: string[];
    /** An ECCM mode exists in this edition (Maximum Tech p.77, TO:AR p.98). */
    eccm?: boolean;
    /** Ghost targets (TO:AR p.100): the Piloting roll modifier and the to-hit modifier they give. */
    ghostTargets?: { piloting: number; modifier: number };
    /** Active probe range in hexes. */
    probeRange?: number;
    /** What the probe finds, beyond the plain hidden unit. */
    probeFinds?: ("hidden" | "stealth" | "null-sig" | "mimetic" | "void-sig" | "sneak-ecm")[];
    /** How a C3 network of this kind plays in the edition (Phase 3). */
    c3?: IEWarC3Rule;
    /** What the network ignores: "ecm-except-angel" (Boosted), "fighter-ecm" and "small-craft-ecm" (Naval C3), "ecm-except-nova" (Nova link). */
    c3Immune?: string[];
    /** Turns the item works: Emergency Master 6 consecutive turns, a Remote Sensor pod 3 full turns after the launch turn. */
    c3Turns?: number;
    /** A Remote Sensor pod is destroyed by an attack of more than this many damage. */
    c3PodDamage?: number;
    /** Suites of ECCM the item counts as: communications equipment 3-6 t half a suite (TO:AR p.99); 7 t or more is one, applied from the unit's tonnage. */
    eccmShare?: number;
    /** Communications equipment of 7 t or more can make ghost targets (TO:AR p.100). */
    ghostByComms?: boolean;
    /** Battle armor C3, ECM and stealth work on a non-battle-armor unit only at this tonnage or less (Ghosts of Obeedah p.55). */
    nonBaTonnage?: number;
    /** Aerospace ECM in this edition (on the Guardian entry): "so-field" the advanced aerospace field rule (SO pp.99-100, TW p.238), "none-between-aero" no effect between aerospace units (AT2R p.25). */
    aeroEcm?: "so-field" | "none-between-aero";
}

/** The network rules of one C3 item as an edition prints them. */
export interface IEWarC3Rule {
    /** The most units one network holds. */
    maxUnits: number;
    /** Slaves one Master controls (BTC to BMR(R): three; Total Warfare: one to three Slaves or one to three Masters). */
    slavesPerMaster?: number;
    /** A Master may control Masters and Slaves together. */
    mastersMixable?: boolean;
    /** Hostile ECM cuts a unit off, degrades the range (Core Rulebook), or does nothing to the network. */
    ecm: "cut-off" | "degrade" | "none";
    /** Core Rulebook: TN penalty per range bracket the network gained, when the attacker, its Master or the nearest unit is in hostile ECM (CRB p.199). */
    degrade?: { perBracket: number };
    /** Whose line of sight counts: the attacker's only, the whole network's, or the nearest networked unit's. */
    needsLos: "attacker" | "network" | "nearest";
    /** Indirect fire gets the network's range. */
    indirectBenefit: boolean;
    /** The Master (not the Slaves) duplicates TAG. */
    masterTag: boolean;
    /** Losing the Master ends only the portion it controlled (BTC to BMR(R)); otherwise the whole network. */
    portionEnds: boolean;
    /** Units further apart than this many hexes cannot share the network (Naval C3: 60). */
    maxHexes?: number;
}

/** How an anti-missile item defends: missiles destroyed (older books) or a Cluster Hits shift (Total Warfare on). */
export interface IEWarDefenseRule {
    mode: "missiles-destroyed" | "cluster-shift";
    /** Missiles destroyed: dice rolled (Inner Sphere), and for a Clan item. */
    dice?: number;
    clanDice?: number;
    /** Ammunition shots spent for each missile destroyed. */
    ammoPerMissile?: number;
    /** Cluster Hits shift on the carrier own unit (-4). */
    shift?: number;
    /** The shift for a friendly unit 0 to 3 hexes away (APDS). */
    friendlyShifts?: number[];
    heat?: number;
    clanHeat?: number;
    /** The heat is the number of missiles destroyed (Maximum Tech Laser AMS). */
    heatFromRoll?: boolean;
    /** Ammunition shots spent each engagement (0: none). */
    ammoPerUse?: number;
    /** The missiles are shot down before the to-hit roll and the survivors pick the table column (Compendium, Rules of Warfare). */
    beforeRoll?: boolean;
    /** Ammunition spent is its own roll: dice D6 (Clan clanDice) times the multiplier (Compendium, Rules of Warfare). */
    ammoRoll?: { dice: number; multiplier: number };
    /** A shifted roll below 2 destroys the whole flight (CRB p.206, TO:AUE p.134, IO:AE p.85); otherwise it is held at 2. */
    belowTwoDestroys?: boolean;
    /** Missile attacks it may engage in a turn. */
    maxPerTurn?: number;
}

/** The edition's E-War rules, by kind of gear; an item absent from the table has no rule entered in that edition. */
export interface IEWarPlayRules {
    items: Partial<Record<EWarKind, IEWarItemRule>>;
    /**
     * The standard MRM launcher as this book prints it where it differs from the catalog (+1 to-hit, no Cluster Hits
     * modifier): the Core Rulebook has no to-hit penalty and a -1 Cluster Hits modifier (CRB p.186-187).
     */
    mrm?: { toHit: number; clusterBase: number; label: string };
    /** Missile munitions an anti-missile item cannot engage: "arrow-iv", "thunder", "swarm", "flare" (BTC p.117, BMR p.122, BMR(R) p.130, TW, BMM, CRB). */
    amsImmune?: string[];
}

/** One of an edition's own game levels, as its rulebook names it, and the tool's rules level it stands for. */
export interface IRulesEditionLevel {
    /** The tool's rules level (0-4) this level stands for. */
    id: number;
    name: string;
    book: string;
    page: number;
    /** Below the construction level: a printed unit may be edited after a warning that this moves it to that level. */
    editsAfterWarning?: boolean;
}

export interface IRulesEdition {
    /** Stable id stored on records and in saves. */
    tag: string;
    name: string;
    /** First publication year of the edition's core rulebook. */
    year: number;
    /** Publication month (1-12), where the credits page prints one. */
    month?: number;
    /** The core rulebook, by the abbreviation used in record citations. */
    book: string;
    /** True once every item the edition's rulebook includes has its `editionStats` entry. */
    complete?: boolean;
    /**
     * The least ammunition a design must carry: a ton for each launcher or ballistic weapon ("launcher": BD p.25,
     * BTM p.79), or a ton for each class of them ("class": BT3 p.43, BTC:RoW p.101, BT4 p.43, BMR p.114,
     * BMR(R) p.120). One-shot weapons need none.
     */
    ammoTonsFor?: "launcher" | "class";
    /**
     * Each torso's front and rear armor sections are capped apart, each at twice the location's internal structure
     * (BD p.25, BT2 p.40, BTM p.80). Absent: front and rear together stay within twice the boxes, from the
     * Compendium on (BTC p.113, BT3 p.43, BMR p.113, BTC:RoW p.102, BT4 p.44, BMR(R) p.120; TM p.54).
     */
    torsoArmorSectionsApart?: boolean;
    /** Where the edition's game rules differ from Total Warfare's in what play mode works out; absent while not reviewed. */
    playRules?: IEditionPlayRules;
    /** The edition's E-War rules; absent while not entered, and then E-War gear gives no modifiers. */
    ewarPlayRules?: IEWarPlayRules;
    /** The edition's rulebook prints no prices, for equipment or for a finished unit. */
    noPrices?: boolean;
    /**
     * An earlier edition graded as Total Warfare is: Level 1 is the technology of 3025, Level 2 the rest (BMR p.6,
     * BMR(R) p.6), so its records take their `rulesLevel` unless `editionLevels` says otherwise.
     */
    gradedLikeTotalWarfare?: boolean;
    /**
     * An earlier edition whose rules let Clan and Inner Sphere technology be mixed on one chassis. Whether it has
     * the Clan technology base at all follows from its Clan equipment (`editionStats`).
     */
    mixedTech?: boolean;
    /**
     * The unit types a design can be built for under this edition. Absent means 'Mechs only: the earlier rulebooks
     * print their other units as fixed designs (`otherUnits`), with no rules to build them.
     */
    unitTypes?: RulesEditionUnitType[];
    /** The 'Mechs the rulebook prints, as it names them. */
    mechs?: string[];
    /** Other units the rulebook gives rules for; they are fixed designs, not built from the catalogs. */
    otherUnits?: string[];
    /** What the edition includes that the tool has no record for. */
    notModelled?: string[];
    /** The edition predates OmniMechs, which first appeared in Technical Readout: 3050 (1989). */
    noOmniMechs?: boolean;
    /** The rulebook has no eras to build in; the design keeps its era, out of sight. */
    noEras?: boolean;
    /** The edition's own game levels; absent means Total Warfare's. Apocryphal, Custom Homebrew and Munchkin follow. */
    levels?: IRulesEditionLevel[];
    /** The lowest rules level whose rules design new units; absent means every level. */
    constructionLevel?: number;
}

export const btRulesEditions: IRulesEdition[] = [
    {
        // Battledroids, the game's first edition: credits page, "Copyright 1984 FASA Corporation".
        tag: "battledroids",
        noEras: true,
        noOmniMechs: true,
        name: "Battledroids",
        year: 1984,
        month: 8,
        book: "BD",
        complete: true,
        // Heat Point Table, BD p.12; Movement Modifiers Table, BD p.5; Determining Critical Hits, BD p.18. The
        // weapon attack rules (BD pp.8-11, 15) have no modifier for a second target, nor for an immobile one.
        playRules: {
            moveHeat: { walk: 0, run: 1, jumpPerHex: 1, jumpMinimum: 0 },
            maxTargetMovementModifier: 3,
            secondaryTargetModifiers: false,
            criticalHitRoll: 7,
            immobileTargetModifier: 0,
        },
        ammoTonsFor: "launcher",
        // "the Armor Value may not be more than twice the number of internal structure boxes at that location", over
        // the Armor Diagram's 11 locations (BD p.25). The book's Stinger, Wasp, Phoenix Hawk, Archer and Marauder
        // fit only this way.
        torsoArmorSectionsApart: true,
        noPrices: true,
        levels: [
            { id: 0, name: "Basic Battledroids", book: "BD", page: 1 },
            { id: 1, name: "Advanced Battledroids", book: "BD", page: 7, editsAfterWarning: true },
            // "the information needed to design and build new classes of droids"
            { id: 2, name: "Expert Battledroids", book: "BD", page: 14 },
        ],
        constructionLevel: 2,
        // BD pp.16-17, the ten record listings.
        mechs: [
            "STG-3R Stinger", "WSP-1A Wasp", "PXH-1K Phoenix Hawk", "GRF-1N Griffin", "SHD-2H Shadow Hawk",
            "RFL-3N Rifleman", "CRD-3R Crusader", "ARC-2R Archer", "WHM-6R Warhammer", "MAD-3R Marauder",
        ],
        // BD pp.22-23, Expert Battledroids optional rules.
        otherUnits: ["SCR-8N Scorpion tank", "HNT-3R Hunter tank", "VDE-3T Vedette tank", "Jeep", "Infantry squad"],
        notModelled: [
            "A severed arm or leg picked up as a club: an optional rule, not an item (BD p.21).",
        ],
    },
    {
        // BattleTech, Second Edition box set: "that 1985 box set" (CRB p.247); its rulebook prints "Copyright 1985".
        tag: "battletech-2nd-edition",
        noOmniMechs: true,
        name: "BattleTech, Second Edition",
        year: 1985,
        month: 6,
        book: "BT2",
        complete: true,
        ammoTonsFor: "launcher",
        // The Battledroids wording: 11 locations, each at twice its boxes (BT2 p.40).
        torsoArmorSectionsApart: true,
        noPrices: true,
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
        noOmniMechs: true,
        name: "The BattleTech Manual",
        year: 1987,
        month: 8,
        book: "BTM",
        complete: true,
        ammoTonsFor: "launcher",
        // The Battledroids wording: eleven locations, each at twice its boxes (BTM p.80).
        torsoArmorSectionsApart: true,
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
        month: 7,
        book: "BTC",
        // E-War audit, missiles and defenses (Task 8): where each edition prints the play rule.
        ewarPlayRules: {
            items: {
                ams: { book: "BTC", page: 117 },
                "artemis-iv": { book: "BTC", page: 118 },
                narc: { book: "BTC", page: 120 },
                tag: { book: "BTC", page: 117, note: "TAG is described with the Arrow IV homing missile (pp.117-118); it cannot target infantry (p.118)" },
                // E-War audit, ECM and probes (Task 9). The Compendium prints one ECM rule, the Guardian's; the Clan ECM suite is in the tables only.
                "ecm-guardian": { book: "BTC", page: 120, ecmRadius: 6, ecmCancels: ["artemis","narc","c3","beagle"], note: "Nullifies enemy Beagle probes, Artemis IV, Narc beacons and C3 within 6 hexes or on a line passing within 6 hexes; friendly systems unaffected" },
                "c3-master": { book: "BTC", page: 118, note: "Inner Sphere only; command computer 5 t and 5 slots, slave 1 t and 1 slot; one command computer links three slaves, a company links lance command computers to a company command computer; no network over twelve units; range to target from the network's nearest unit with LOS, own modifiers, normal LOS and maximum range; command computer also duplicates TAG; a destroyed command-computer carrier destroys its portion of the network" },
                "c3-slave": { book: "BTC", page: 118, note: "slave computer; the command computer's rules apply" },
                "ecm-clan": { book: "BTC", page: 120, ecmRadius: 6, ecmCancels: ["artemis","narc","c3","beagle"], note: "No text of its own: the Clan ECM Suite is a table row (p.115: 6 hexes, 1 t, 1 slot) and the Guardian rule applies" },
                "probe-beagle": { book: "BTC", page: 118, probeRange: 4, probeFinds: ["hidden"], note: "Detects hidden 'Mechs and vehicles, not infantry, within 4 hexes (Inner Sphere)" },
                "probe-clan": { book: "BTC", page: 118, probeRange: 5, probeFinds: ["hidden"], note: "Radius 5 for the Clan probe (p.115 table)" },
            },
        },
        complete: true,
        ammoTonsFor: "launcher",
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
            "Single-shot launchers fitted for special munitions or an Artemis IV FCS: allowed at double the launcher's base price, with no rows of their own (BTC p.121). The LRM, SRM, Streak and Narc single-shot launchers are entered; the Streak and Narc ones carry no price, because the book does not say which base price is doubled.",
        ],
    },
    {
        // BattleTech, Third Edition box set: rulebook credits page, "Copyright 1992 FASA Corporation".
        tag: "battletech-3rd-edition",
        name: "BattleTech, Third Edition",
        year: 1992,
        book: "BT3",
        complete: true,
        ammoTonsFor: "class",
        noPrices: true,
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
        month: 7,
        book: "BTC:RoW",
        // E-War audit, missiles and defenses (Task 8): where each edition prints the play rule.
        ewarPlayRules: {
            items: {
                ams: { book: "BTC:RoW", page: 112 },
                "artemis-iv": { book: "BTC:RoW", page: 113, note: "continues p.114" },
                narc: { book: "BTC:RoW", page: 119 },
                tag: { book: "BTC:RoW", page: 120, note: "TAG for the Arrow IV homing missile, also p.113; aerospace TAG pod p.102" },
                "ecm-guardian": { book: "BTC:RoW", page: 116, ecmRadius: 6, ecmCancels: ["artemis","narc","c3","beagle"], note: "continues p.117 (diagram); no effect on TAG or Clan targeting computers" },
                "c3-master": { book: "BTC:RoW", page: 114, note: "continues p.115 (diagram); Inner Sphere only; command computer 5 t and 5 slots, slave 1 t and 1 slot; three slaves to a command computer, twelve units at most; nearest-unit range, own modifiers, normal LOS and maximum range; the command unit (not the slaves) duplicates TAG; C3 units spotting for or launching indirect LRMs use the indirect rules (p.77)" },
                "c3-slave": { book: "BTC:RoW", page: 114, note: "slave computer; the command computer's rules apply" },
                "ecm-clan": { book: "BTC:RoW", page: 116, ecmRadius: 6, ecmCancels: ["artemis","narc","c3","beagle"], note: "No text of its own: the Clan ECM Suite is a table row (6 hexes) and the Guardian rule applies" },
                "probe-beagle": { book: "BTC:RoW", page: 114, probeRange: 4, probeFinds: ["hidden"], note: "Hidden Units rules p.89; Inner Sphere radius 4" },
                "probe-clan": { book: "BTC:RoW", page: 114, probeRange: 5, probeFinds: ["hidden"], note: "Clan radius 5; Hidden Units rules p.89" },
            },
        },
        complete: true,
        ammoTonsFor: "class",
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
        ammoTonsFor: "class",
        noPrices: true,
        // The box holds playing pieces for "twenty-four different BattleMech designs" (BT4 p.5). Only the
        // twenty the rulebook's scenarios name are listed (BT4 pp.36-39); the Assassin is named without a model
        // code (BT4 p.36). The box's 'Mech sheets scan, added to the library since, names all twenty-four
        // (the Assassin as ASN-21); its sheets are still to be read from the page images and entered.
        mechs: [
            "COM-2D Commando", "SDR-5V Spider", "JR7-D Jenner", "PNT-9R Panther", "Assassin", "CDA-2A Cicada",
            "CLNT-2-3T Clint", "HER-2S Hermes II", "ENF-4R Enforcer", "HBK-4G Hunchback", "TBT-5N Trebuchet",
            "DV-6M Dervish", "DRG-1N Dragon", "QKD-4G Quickdraw", "CPLT-C1 Catapult", "JM6-S JagerMech",
            "GHR-5H Grasshopper", "AWS-8Q Awesome", "ZEU-6S Zeus", "AS7-D Atlas",
        ],
        // BattleMechs only: infantry and conventional vehicles are left to CityTech, Second Edition (BT4 p.4).
        otherUnits: [],
        notModelled: [
            "Four of the box's twenty-four BattleMech designs: the rulebook names twenty; the box's sheets for the other four have not been entered yet (BT4 p.5).",
            "Clubs: picked up on the map and swung with two hands; the hatchet attacks by the same rules with one (BT4 pp.28, 46).",
        ],
    },
    {
        // BattleTech Master Rules (FASA 1707): back cover, "Copyright 1998 FASA Corporation"; CRB p.247.
        tag: "master-rules",
        name: "BattleTech Master Rules",
        year: 1998,
        book: "BMR",
        // E-War audit, missiles and defenses (Task 8): where each edition prints the play rule.
        ewarPlayRules: {
            items: {
                ams: { book: "BMR", page: 122, note: "continues p.123" },
                "artemis-iv": { book: "BMR", page: 123 },
                narc: { book: "BMR", page: 133, note: "Narc explosive pods p.133; semi-guided LRMs (TAG-designated) p.131" },
                tag: { book: "BMR", page: 134 },
                "light-tag": { book: "BMR", page: 134, note: "Clan only" },
                "laser-ams": { book: "MT", page: 72, note: "Maximum Tech, Level 3 (rides on BMR); Revised printing (FanPro 35013) p.72" },
                "artemis-v": { book: "MT", page: 75, note: "Maximum Tech, Level 3 (rides on BMR); Revised printing (FanPro 35013) p.75" },
                "ecm-guardian": { book: "BMR", page: 126, ecmRadius: 6, ecmCancels: ["artemis","narc","c3","beagle"], eccm: true, note: "continues p.127; the ECM suite section covers the Clan suite too; ECCM mode: MT p.77 (Level 3); double-blind sensor modifiers: MT pp.54-55" },
                "c3-master": { book: "BMR", page: 124, note: "continues p.125 (diagram, configurations); Inner Sphere only; master 5 t and 5 slots, slave 1 t and 1 slot; no maximum range but only units on the map count; three slaves to a master, twelve 'Mechs at most; a critical hit to the master or its carrier's destruction ends the portion it controlled; the master (not the slaves) duplicates TAG; C3 units gain no benefit from the network for indirect LRM fire (p.80)" },
                "c3-slave": { book: "BMR", page: 124, note: "slave computer; the master's rules apply" },
                "ecm-clan": { book: "BMR", page: 126, ecmRadius: 6, ecmCancels: ["artemis","narc","c3","beagle"], eccm: true, note: "continues p.127; the Clans' ECM suite has the same capabilities, lighter and smaller" },
                "ecm-angel": { book: "MT", page: 77, ecmRatio: true, ecmRadius: 6, ecmCounts: 2, ecmCancels: ["artemis","narc","c3","beagle","streak-lock","bloodhound","c3-boosted"], eccm: true, note: "Maximum Tech, Level 3 (rides on BMR); continues p.78; counts as two ECM or ECCM suites; Revised printing (FanPro 35013) p.77" },
                "ecm-infantry": { book: "MT", page: 38, note: "Maximum Tech, Level 3, infantry ECM and camo suits (rides on BMR); Revised printing p.38" },
                "probe-beagle": { book: "BMR", page: 122, probeRange: 4, probeFinds: ["hidden"], note: "Active probe and its Clan equivalent; detects hidden 'Mechs, battle armor and vehicles, not conventional infantry; Hidden Units rules p.77" },
                "probe-clan": { book: "BMR", page: 122, probeRange: 5, probeFinds: ["hidden"], note: "As the active probe" },
                "probe-light": { book: "BMR", page: 122, probeRange: 3, probeFinds: ["hidden"], note: "Clan only; smaller and shorter range than the standard probe: 3 hexes, 0.5 t, 1 slot (Clan table p.117)" },
                "probe-bloodhound": { book: "MT", page: 72, probeRange: 8, probeFinds: ["hidden","stealth","null-sig","mimetic","void-sig"], note: "Maximum Tech, Level 3 (rides on BMR); range 8 hexes; finds stealth, sneak and null-signature units; Revised printing (FanPro 35013) p.72" },
                "stealth-ba": { book: "BMR", page: 66, note: "Built-in suit rules, no armor type: Achileus +1 short, +4 medium, +7 long (p.66), Infiltrator +3 medium, +6 long (p.66), Kage (p.64); Beagle and Clan probes cannot locate hidden Achileus, Infiltrator or Kage units. The Mk. II and the mimetic Purifier are not in this printing" },
                "stealth-ba-achileus": { book: "BMR", page: 66, stealthMods: {short:1,medium:2,long:3}, note: "Achileus: +1 short, +4 medium and +7 long in place of the standard medium and long modifiers (stored as the part above them)" },
                "stealth-ba-infiltrator": { book: "BMR", page: 66, stealthMods: {medium:1,long:2}, note: "Infiltrator: +3 medium and +6 long in place of the standard medium and long modifiers (stored as the part above them)" },
                "null-sig": { book: "MT", page: 83, stealthMods: {medium:1,long:2,extreme:2}, stealthHeat: 10, stealthEcm: "none-needed", cutsC3: true, note: "Maximum Tech, Level 3 (rides on BMR); +3 medium (replacing the standard modifier), +6 long; Beagle and Clan probes cannot locate it, only the Bloodhound (MT p.72) can; no advanced targeting computer, C3 or satellite uplink; 10 heat; 7 slots; costs p.87; Revised printing (FanPro 35013) p.83" },
            },
        },
        complete: true,
        ammoTonsFor: "class",
        gradedLikeTotalWarfare: true,
        // Designs are built "factory-built" with one technology base; custom modifications may mix Clan and Inner
        // Sphere technology on a chassis (BMR pp.87, 108).
        mixedTech: true,
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
            "Flare LRMs: fired at a hex to light it and everything within 3 hexes, for the launcher's size divided by 5 turns (BMR p.130); the ammunition is in the catalogs (`ammo-lrm-flare`), the lighting is not played out.",
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
        // E-War audit, missiles and defenses (Task 8): where each edition prints the play rule.
        ewarPlayRules: {
            items: {
                ams: { book: "BMR(R)", page: 130, note: "continues p.131" },
                "artemis-iv": { book: "BMR(R)", page: 131 },
                narc: { book: "BMR(R)", page: 145, note: "Narc explosive pods p.146" },
                inarc: { book: "BMR(R)", page: 145, note: "Improved Narc Launcher pp.145-146; homing, explosive, ECM, haywire and Nemesis pods pp.146-147" },
                tag: { book: "BMR(R)", page: 147 },
                "light-tag": { book: "BMR(R)", page: 147, note: "Clan only" },
                "laser-ams": { book: "MT", page: 72, note: "Maximum Tech, Level 3 (rides on BMR(R)); Revised printing (FanPro 35013) p.72" },
                "artemis-v": { book: "MT", page: 75, note: "Maximum Tech, Level 3 (rides on BMR(R)); Revised printing (FanPro 35013) p.75" },
                "ecm-guardian": { book: "BMR(R)", page: 136, ecmRadius: 6, ecmCancels: ["artemis","narc","c3","c3i","beagle"], eccm: true, note: "continues p.137; the ECM suite section covers the Clan suite too; ECCM mode: MT p.77 (Level 3); aerospace: AT2R p.25 says ECM has no effect on combat between AT2 units but works as here on BattleTech mapsheets" },
                "c3-master": { book: "BMR(R)", page: 134, note: "continues p.135 (diagram, configurations); same text as BMR p.124-125: Inner Sphere only, master 5 t and 5 slots, slave 1 t and 1 slot, three slaves to a master, twelve 'Mechs at most" },
                "c3-slave": { book: "BMR(R)", page: 134, note: "slave computer; the master's rules apply" },
                "c3i": { book: "BMR(R)", page: 135, note: "Improved C3; no master, every unit mounts one, up to six units, networks cannot be linked; loss of one unit cannot shut the network down (only units in enemy ECM or with a destroyed computer are isolated); not compatible with Masters and Slaves; no TAG" },
                "ecm-clan": { book: "BMR(R)", page: 136, ecmRadius: 6, ecmCancels: ["artemis","narc","c3","c3i","beagle"], eccm: true, note: "continues p.137; the Clans' ECM suite has the same capabilities, lighter and smaller" },
                "ecm-angel": { book: "MT", page: 77, ecmRatio: true, ecmRadius: 6, ecmCounts: 2, ecmCancels: ["artemis","narc","c3","c3i","beagle","streak-lock","bloodhound","c3-boosted"], eccm: true, note: "Maximum Tech, Level 3 (rides on BMR(R)); continues p.78; counts as two ECM or ECCM suites; Revised printing (FanPro 35013) p.77" },
                "ecm-infantry": { book: "MT", page: 38, note: "Maximum Tech, Level 3, infantry ECM and camo suits (rides on BMR(R)); Revised printing p.38" },
                "probe-beagle": { book: "BMR(R)", page: 130, probeRange: 4, probeFinds: ["hidden"], note: "Active probe and its Clan equivalent; detects hidden 'Mechs, battle armor and vehicles, not conventional infantry; Hidden Units rules p.83" },
                "probe-clan": { book: "BMR(R)", page: 130, probeRange: 5, probeFinds: ["hidden"], note: "As the active probe" },
                "probe-light": { book: "BMR(R)", page: 130, probeRange: 3, probeFinds: ["hidden"], note: "Clan only; range 3 hexes, 0.5 t, 1 slot (table p.123)" },
                "probe-bloodhound": { book: "MT", page: 72, probeRange: 8, probeFinds: ["hidden","stealth","null-sig","mimetic","void-sig"], note: "Maximum Tech, Level 3 (rides on BMR(R)); range 8 hexes; finds stealth, sneak and null-signature units; Revised printing (FanPro 35013) p.72" },
                "stealth-armor": { book: "BMR(R)", page: 147, needsEcm: true, blocksProbes: "bloodhound", stealthMods: {medium:1,long:2,extreme:2}, stealthHeat: 10, stealthEcm: "keeps-working", cutsC3: true, note: "Inner Sphere BattleMechs only, not vehicles; needs a Guardian ECM suite (p.136), which keeps working while stealth is engaged, though the unit suffers the effects of being inside an enemy ECM suite's radius; if the ECM suite is destroyed the stealth armor cannot function; +3 medium (replacing the standard modifier), +6 long; Beagle and Clan probes cannot locate it; no secondary target; 10 heat; 12 slots (construction p.119); BV +10 heat and +0.2 speed factor (p.154)" },
                "stealth-ba": { book: "BMR(R)", page: 69, note: "Built-in suit rules, no armor type: Achileus +1 short, +4 medium, +7 long (p.67), Infiltrator +3 medium, +6 long (p.69), Infiltrator Mk. II +1 short, +3 medium, +6 long with limited ECM in its own hex (p.69), Kage (pp.69-70); Beagle and Clan probes cannot locate them" },
                "stealth-ba-achileus": { book: "BMR(R)", page: 67, stealthMods: {short:1,medium:2,long:3}, note: "Achileus: +1 short, +4 medium and +7 long in place of the standard medium and long modifiers (stored as the part above them)" },
                "stealth-ba-infiltrator": { book: "BMR(R)", page: 69, stealthMods: {medium:1,long:2}, note: "Infiltrator: +3 medium and +6 long in place of the standard medium and long modifiers (stored as the part above them)" },
                "stealth-ba-infiltrator-mk2": { book: "BMR(R)", page: 69, stealthMods: {short:1,medium:1,long:2}, note: "Infiltrator Mk. II: +1 short, +3 medium and +6 long in place of the standard medium and long modifiers (stored as the part above them)" },
                "null-sig": { book: "MT", page: 83, stealthMods: {medium:1,long:2,extreme:2}, stealthHeat: 10, stealthEcm: "none-needed", cutsC3: true, note: "Maximum Tech, Level 3 (rides on BMR(R)); as under BMR: +3 medium, +6 long; only the Bloodhound (MT p.72) locates it; 10 heat; Revised printing (FanPro 35013) p.83" },
                "mimetic": { book: "BMR(R)", page: 71, replacesMovement: true, stealthMoveMods: [{hexes:0,modifier:3},{hexes:1,modifier:2},{hexes:2,modifier:1},{hexes:3,modifier:0}], note: "Purifier adaptive battle armor, always on: the target movement modifier is +0 if the Purifier moved 3 hexes, +1 for 2, +2 for 1, +3 for none, replacing the standard one" },
            },
        },
        complete: true,
        ammoTonsFor: "class",
        gradedLikeTotalWarfare: true,
        // As in the Master Rules: custom modifications may mix Clan and Inner Sphere technology (BMR(R) pp.89, 115).
        mixedTech: true,
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
            "Flare LRMs: fired at a hex to light it and everything within 3 hexes, for the launcher's size divided by 5 turns (BMR(R) p.141); the ammunition is in the catalogs (`ammo-lrm-flare`), the lighting is not played out.",
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
        // Classic BattleTech box set (FanPro), the introductory game beside the Master Rules, Revised Edition. The
        // year is the box set's first release as the user gave it (2026-10-15); the library holds only the 2005
        // printing of its rulebook (FanPro 10980A, "©2005 WizKids"), which does not confirm 2002. Not entered yet.
        tag: "classic-battletech-box-set",
        name: "Classic BattleTech (box set)",
        year: 2002,
        book: "CBT",
    },
    {
        // Total Warfare, ©2006 (first printing), with TechManual, Tactical Operations, Strategic Operations and
        // Interstellar Operations: the rules line every catalog record cites.
        tag: "total-warfare",
        name: "Total Warfare",
        year: 2006,
        book: "TW",
        // E-War audit, missiles and defenses (Task 8): where each edition prints the play rule.
        ewarPlayRules: {
            items: {
                ams: { book: "TW", page: 129, note: "Enhanced Missile Defense and AMS as a weapon: TO:AR p.98" },
                "laser-ams": { book: "TO:AUE", page: 134, note: "Experimental; the standard AMS rules apply (TW p.129)" },
                apds: { book: "IO:AE", page: 85, note: "Advanced, Dark Age RISC equipment" },
                "artemis-iv": { book: "TW", page: 130, note: "Artemis-equipped missiles p.140" },
                "artemis-v": { book: "TO:AUE", page: 95, note: "Experimental, Clan; otherwise as Artemis IV (TW p.130)" },
                "artemis-prototype": { book: "IO:AE", page: 65, note: "Prototype Artemis IV: +1 on the Cluster Hits Table, not +2" },
                apollo: { book: "TO:AUE", page: 142, note: "Experimental, Inner Sphere MRMs; construction rules p.142" },
                narc: { book: "TW", page: 138, note: "Narc pods and Narc-equipped missiles pp.139, 141-142; Bola pods TO:AUE p.180; shoot-and-sit missiles IO:AE p.126; prototype Narc IO:AE p.67; battle armor Narc TW p.229" },
                inarc: { book: "TW", page: 139, note: "Improved Narc Launcher pp.139-140; ECM, explosive, haywire, homing and Nemesis pods pp.141-142; ECM pod as ECCM TO:AR p.100" },
                tag: { book: "TW", page: 142, note: "continues p.143; aerospace TAG p.246; prototype TAG IO:AE p.67" },
                "light-tag": { book: "TW", page: 229, note: "Battle armor entry: as TAG, range 3/6/9" },
                "ecm-guardian": { book: "TW", page: 134, ghostTargets: { piloting: 3, modifier: 1 }, ecmRadius: 6, ecmCancels: ["artemis","narc","c3","c3i","beagle"], eccm: true, note: "continues p.135 (water); ECCM mode and ghost targets: TO:AR pp.98-100; battle armor ECM works as this but only in its own hex (p.228); aerospace ECM only affects ground units and the aerospace unit always has its benefits (p.238); the advanced aerospace rules (SO pp.99-100) give military Small Craft and Large Craft an integral ECM field (+1 per hostile ECM hex on the line of fire, +4 at most) and ECCM Control Rolls; optional modes are set in the End Phase" },
                "c3-master": { book: "TW", page: 131, note: "continues pp.132-133 (diagram, four configurations, All-Master networks, multiple networks, losing a network); up to twelve units; a Master controls one to three Slaves or one to three Masters, not both; a unit holding both a Master and a Slave uses one, named at the start of the game; one network per unit; LOS needed by the attacker, not by the network; stealth armor: only the range from the target to the nearest networked unit counts; the Master duplicates TAG; TAG helps indirect fire, the network does not; water: a C3 above the surface cannot link underwater" },
                "c3-slave": { book: "TW", page: 131, note: "Slave; the Master's rules apply" },
                "c3i": { book: "TW", page: 133, note: "Improved C3; up to six units, no Master, loss of one unit or one ECM field cannot shut the network down (only units in enemy ECM or with a destroyed computer are isolated); not compatible with Masters and Slaves; no TAG" },
                "c3-boosted-master": { book: "TO:AUE", page: 110, note: "Experimental, IS; C3 Boosted System (C3BS): a Master and Slaves used like a standard C3 network with the same limits, but hostile ECM does not interfere (except the Angel ECM suite); needs a working Master, whose loss disables the network; does not work on a unit with stealth armor engaged; standard and boosted units may share a network: a non-boosted member is still cut off by any hostile ECM and a non-boosted master cannot send to boosted members inside any hostile ECM" },
                "c3-boosted-slave": { book: "TO:AUE", page: 110, note: "Boosted Slave; the Boosted Master's rules apply (see c3-boosted-master)" },
                "c3-emergency-master": { book: "TO:AUE", page: 110, note: "Experimental, IS; C3EM duplicates a Slave and acts as the Master for up to 6 consecutive turns after the network's Master is destroyed or knocked out by ECM (turns inside hostile ECM do not count, the unit goes to standby); cannot be switched off once active; shuts down after 6 operating turns until reset after the scenario; cannot act as TAG" },
                "c3-naval": { book: "TO:AUE", page: 144, note: "Experimental, IS (F/X-X-F), JS/DS/SS/WS; Naval C3 links up to six Large Craft of 200 tons or more like a ground C3i network (TW p.133); the weapon range bracket (capital or standard) comes from the networked friendly unit nearest the target, but an attack outside the weapon's normal range still cannot be made; not affected by fighter or Small Craft ECM; Large Craft ECM applies its modifiers (SO) but does not negate the network; units more than 60 hexes apart cannot share it; each unit may make an ECCM Control Roll and the highest bonus is shared (SO p.112); a DropShip with Naval C3 may cut an orbit-to-surface range band by one (SO p.105)" },
                "ew-equipment": { book: "TO:AUE", page: 123, note: "Experimental, IS (D/X-F-E), BM, IM, CV, SV, AF, CF, SC, DS; one piece that works as a Beagle Active Probe and a Guardian ECM Suite (TW pp.129, 134), both with a 3-hex range; only one probe and one ECM may be used at a time; not a substitute for the Guardian ECM on Stealth Armor (p.122); sensor range as the Clan Active Probe (TO:AR p.190)" },
                "communications": { book: "TO:AR", page: 99, note: "Communications equipment (TM p.212) can generate an ECCM field with the Guardian ECM's area: 3-6 tons count as half an ECM suite, 7 tons or more as one; all other bonus modifiers are lost while it does; 7+ tons can also make ghost targets (p.100)" },
                "chaff-pod": { book: "TO:AUE", page: 111, note: "Experimental, IS (C/X-X-E), one-shot; declared at the end of the Movement Phase; fills the unit's hex with a cloud 2 elevations high that counts as light smoke for LOS and as a 1-hex ECM bubble that ECCM cannot negate, and works as an anti-missile system (TW pp.129-130) against all missile attacks on units in the hex except standard MRMs and Rocket Launchers; lasts through the Weapon and Physical Attack Phases only, friend and foe alike; no effect in vacuum; an unfired pod explodes for 3 points on a critical hit" },
                "c3-remote-sensor": { book: "TO:AUE", page: 110, note: "continues p.111; Experimental, IS; C3 Remote Sensor Launcher fires like a Narc launcher but only at a hex; the pod activates the next turn as a stationary Slave of a network declared before firing, cannot exceed network size limits, a full network gains nothing, works 3 full turns after the launch turn, destroyed by an attack of more than 2 damage (+2 to hit, immobile -4); incompatible with C3i; a miss (or a roll of 2) destroys the pod; critical hits deal 2 points per unfired pod" },
                "ecm-clan": { book: "TW", page: 134, ecmRadius: 6, ecmCancels: ["artemis","narc","c3","c3i","beagle"], eccm: true, note: "As the ECM suite (the Clan suite is lighter); TO:AR pp.98-100 for ECCM and ghost targets" },
                "ecm-angel": { book: "TO:AUE", page: 91, ecmRadius: 6, ecmCounts: 2, ecmCancels: ["artemis","narc","c3","c3i","beagle","streak-lock","bloodhound","c3-boosted"], eccm: true, note: "Experimental; as ECM (TW p.134), plus blocks Bloodhound probes and C3 Booster Systems and spoils Streak locks" },
                "ecm-watchdog": { book: "TO:AUE", page: 90, ecmRadius: 6, ecmCancels: ["artemis","narc","c3","c3i","beagle"], eccm: true, probeRange: 3, probeFinds: ["hidden"], note: "Experimental, Clan; ECM suite and Light Active Probe in one (TW pp.129, 134); can power Stealth armor" },
                "ecm-nova": { book: "IO:AE", page: 60, probeFinds: ["hidden"], ecmRadius: 6, ecmCancels: ["artemis","narc","c3","c3i","beagle"], eccm: true, note: "Experimental, Clan; ECM, active probe and C3i in one: links up to two other Nova CEWS units; ECM does not affect the link unless it comes from another hostile Nova CEWS; no TAG; +2 heat while active; needs a fusion engine" },
                "ecm-guardian-prototype": { book: "IO:AE", page: 66, ecmRadius: 6, ecmCancels: ["artemis","narc","c3","c3i","beagle"], eccm: true, note: "Prototype ECM-P: the same rules as the Guardian (TW p.134)" },
                "ecm-infantry": { book: "TO:AUE", page: 130, note: "Sneak suits; Infantry Stealth Modifiers Table: invisible to standard and Light active probes, not to the Bloodhound" },
                "probe-beagle": { book: "TW", page: 129, probeRange: 4, probeFinds: ["hidden"], note: "The active-probe rule covers the Beagle, the Clan and Light probes and the battle armor probe (range from the table, p.303); Hidden Units rules p.256" },
                "probe-clan": { book: "TW", page: 129, probeRange: 5, probeFinds: ["hidden"], note: "As the active probe" },
                "probe-light": { book: "TW", page: 129, probeRange: 3, probeFinds: ["hidden"], note: "As the active probe; Clan only" },
                "probe-bloodhound": { book: "TO:AUE", page: 90, probeRange: 8, probeFinds: ["hidden","stealth","null-sig","mimetic","void-sig","sneak-ecm"], note: "Experimental; as the Beagle (TW p.129), 8 hexes, finds stealth and sneak units" },
                "probe-beagle-prototype": { book: "IO:AE", page: 65, probeRange: 4, probeFinds: ["hidden"], note: "Prototype BAP-P: the same rules as the Beagle (TW p.129)" },
                "stealth-armor": { book: "TW", page: 142, needsEcm: true, blocksProbes: "bloodhound", stealthMods: {medium:1,long:2,extreme:2}, stealthHeat: 10, stealthEcm: "switches-off", cutsC3: true, note: "ECM suite required; while stealth is engaged the ECM does not function and the unit suffers effects as if inside an enemy ECM suite's radius (p.134); +1 medium, +2 long; no secondary target; 10 heat; no effect on attacks by aerospace units; critical hits on stealth slots are re-rolled; infantry carried or swarming does not lose the modifiers; TM pp.55-56, 206" },
                "stealth-vehicular": { book: "TO:AUE", page: 94, needsEcm: true, blocksProbes: "bloodhound", stealthMods: {medium:1,long:2,extreme:2}, stealthHeat: 10, stealthEcm: "switches-off", cutsC3: true, note: "Experimental, CV/SV/AF/CF; as BattleMech stealth armor (TW p.142) incl. the ECM suite and heat; aerospace fighters get no benefit above the space/atmosphere interface if they expend Thrust" },
                "stealth-ba": { book: "TW", page: 228, stealthMods: {medium:1,long:2}, note: "Battle armor entry (continues p.229; TM pp.252-253): prototype +1 medium, +2 long; basic +1 medium, +2 long; standard +1 short, +1 medium, +2 long; improved +1 short, +2 medium, +3 long" },
                "stealth-ba-standard": { book: "TW", page: 228, stealthMods: {short:1,medium:1,long:2}, note: "Standard battle armor stealth: +1 short, +1 medium, +2 long (TM p.252-253)" },
                "stealth-ba-improved": { book: "TW", page: 228, stealthMods: {short:1,medium:2,long:3}, note: "Improved battle armor stealth: +1 short, +2 medium, +3 long (TM p.252-253)" },
                "sneak-camo": { book: "TO:AUE", page: 130, stealthMoveMods: [{hexes:0,modifier:3},{hexes:1,modifier:2},{hexes:2,modifier:1},{hexes:3,modifier:0}], note: "Infantry Stealth Modifiers Table: camo sneak suit +3/+2/+1/0 for 0/1/2/3+ MPs moved, against every attacker" },
                "sneak-ir": { book: "TO:AUE", page: 130, stealthMods: {short:1,medium:1,long:2}, stealthRangeIgnoredByInfantry: true, note: "Infantry Stealth Modifiers Table: IR sneak suit +1/+1/+2 short/medium/long against non-infantry attackers only" },
                "dest-suit": { book: "TO:AUE", page: 130, stealthMoveMods: [{hexes:0,modifier:1},{hexes:1,modifier:0}], stealthMods: {short:1,medium:1,long:2}, stealthRangeIgnoredByInfantry: true, note: "DEST infiltration suit: camo +1 at 0 MPs moved, IR +1/+1/+2 against non-infantry attackers (Infantry Stealth Modifiers Table)" },
                "null-sig": { book: "TO:AUE", stealthExcludes: ["stealth-armor","void-sig"], page: 148, stealthMods: {medium:1,long:2,extreme:2}, stealthHeat: 10, stealthEcm: "none-needed", cutsC3: true, note: "Experimental; +1 medium, +2 long and extreme; Beagle and Clan probes cannot locate it, only the Bloodhound (p.90) can; heat-seeking weapons treat the unit as 18 cooler; 10 heat; no ECM suite needed; no advanced targeting computers, C3, Stealth Armor or Void-Signature; cumulative with the Chameleon LPS" },
                "void-sig": { book: "TO:AUE", page: 161, needsEcm: true, blocksProbes: "all", stealthMoveMods: [{hexes:0,modifier:3},{hexes:1,modifier:2},{hexes:3,modifier:1},{hexes:6,modifier:0}], stealthHeat: 10, stealthOwnAttack: 1, stealthExcludes: ["chameleon"], stealthEcm: "switches-off", cutsC3: true, note: "Experimental; needs an ECM suite, which does not work while it is on; modifier by hexes the target moved: +3 for 0, +2 for 1-2, +1 for 3-5, none for 6+; only the Bloodhound can locate it; 10 heat and +1 to the controlling unit's ranged attacks; cannot be combined with the Chameleon LPS" },
                "chameleon": { book: "TO:AUE", page: 112, stealthMods: {medium:1,long:2,extreme:2}, stealthHeat: 6, stealthExcludes: ["stealth-armor","void-sig"], cutsC3: true, note: "Experimental; +1 medium, +2 long and extreme, even against infantry; 6 heat; cumulative with the Null-Signature System; like other stealth systems, it cuts the unit from its C3 network (CRB p.209 says it does not)" },
                "mimetic": { book: "TW", page: 228, stealthMoveMods: [{hexes:0,modifier:3},{hexes:1,modifier:2},{hexes:2,modifier:1},{hexes:3,modifier:0}], note: "Battle armor entry: +3 for 0 hexes moved, +2 for 1, +1 for 2, none for 3 or more" },
            },
        },
        unitTypes: ALL_RULES_EDITION_UNIT_TYPES,
    },
    {
        // BattleMech Manual: credits page, "©2017, 2023 The Topps Company" (the library's copy is the corrected 7th
        // printing). A play rulebook for 'Mechs on the Total Warfare rules: it has no construction rules (an item
        // that needs them is marked so, BMM pp.126-127) and takes Battle Values from the Master Unit List (BMM p.9),
        // so its designs are built as under Total Warfare. Its rule differences are not modelled yet.
        tag: "battlemech-manual",
        name: "BattleMech Manual",
        year: 2017,
        month: 10,
        book: "BMM",
        // E-War audit, missiles and defenses (Task 8): where each edition prints the play rule.
        ewarPlayRules: {
            items: {
                ams: { book: "BMM", page: 118 },
                "laser-ams": { book: "BMM", page: 118 },
                "artemis-iv": { book: "BMM", page: 110, note: "Artemis IV missiles p.107" },
                "artemis-v": { book: "BMM", page: 110, note: "Artemis V missiles p.107" },
                apollo: { book: "BMM", page: 113 },
                narc: { book: "BMM", page: 104, note: "Narc and iNarc pods pp.107-108" },
                inarc: { book: "BMM", page: 104, note: "iNarc pods pp.107-108" },
                tag: { book: "BMM", page: 113, note: "continues p.114" },
                "light-tag": { book: "BMM", page: 114 },
                "ecm-guardian": { book: "BMM", page: 112, ecmRadius: 6, ecmCancels: ["artemis","narc","c3","c3i","beagle"], eccm: false, note: "ECM suites create a 6-hex bubble; blocks Artemis IV and V, C3 and C3i, Narc homing bonuses and standard probes; only one suite works at a time; Clan or Inner Sphere" },
                "c3-master": { book: "BMM", page: 110, note: "continues pp.111-112 (diagram, configurations, designating a network); up to twelve 'Mechs; nearest networked 'Mech sets the range; indirect fire gains nothing (TAG does); minimum range from the actual attacker; same-hex attacks legal; ECM cuts a 'Mech off from the network unless it can draw a line to its master that avoids the ECM radius, and a network stays up while not cut off (6th printings p.112, 4th/5th/7th differ: see Appendix A); stealth armor range penalties use the distance to the closest networked 'Mech; the Master duplicates TAG" },
                "c3-slave": { book: "BMM", page: 110, note: "Slave; the Master's rules apply" },
                "c3i": { book: "BMM", page: 112, note: "up to six 'Mechs, no master, loss of one 'Mech cannot shut the network down, only 'Mechs in enemy ECM or with a destroyed computer are isolated; not compatible with Masters and Slaves; no TAG" },
                "c3-boosted-master": { book: "BMM", page: 112, note: "C3BS works as standard C3 but only Angel ECM can block it; standard and boosted units may share a network: a non-boosted member is still cut off by ECM and a non-boosted master cannot send to boosted members inside any hostile ECM" },
                "c3-boosted-slave": { book: "BMM", page: 112, note: "C3BS works as standard C3 but only Angel ECM can block it; standard and boosted units may share a network: a non-boosted member is still cut off by ECM and a non-boosted master cannot send to boosted members inside any hostile ECM" },
                "ecm-clan": { book: "BMM", page: 112, ecmRadius: 6, ecmCancels: ["artemis","narc","c3","c3i","beagle"], eccm: false, note: "Same section as the Guardian ECM suite" },
                "ecm-angel": { book: "BMM", page: 113, ecmRadius: 6, ecmCounts: 2, ecmCancels: ["artemis","narc","c3","c3i","beagle","streak-lock","bloodhound","c3-boosted"], eccm: false, note: "As ECM, plus blocks Bloodhound probes and Boosted C3 and spoils Streak locks" },
                "ecm-watchdog": { book: "BMM", page: 114, ecmRadius: 6, ecmCancels: ["artemis","narc","c3","c3i","beagle"], eccm: false, probeRange: 3, probeFinds: ["hidden"], note: "Works as the Clans' ECM and Light Active Probe (pp.112, 110); can be the ECM suite stealth armor needs" },
                "probe-beagle": { book: "BMM", page: 110, probeRange: 4, probeFinds: ["hidden"], note: "Light Active Probe 3, Beagle 4, Active Probe 5 hexes; only with the Hidden 'Mechs rules (p.82)" },
                "probe-clan": { book: "BMM", page: 110, probeRange: 5, probeFinds: ["hidden"], note: "Active Probe range 5" },
                "probe-light": { book: "BMM", page: 110, probeRange: 3, probeFinds: ["hidden"], note: "Range 3" },
                "probe-bloodhound": { book: "BMM", page: 110, probeRange: 8, probeFinds: ["hidden","stealth","null-sig","mimetic","void-sig","sneak-ecm"], note: "Range 8; only Angel ECM stops it" },
                "stealth-armor": { book: "BMM", page: 115, needsEcm: true, blocksProbes: "bloodhound", stealthMods: {medium:1,long:2}, stealthHeat: 10, stealthEcm: "switches-off", cutsC3: true, note: "ECM suite required; while stealth is engaged the ECM does not function and the unit suffers effects as if inside an enemy ECM suite's radius (p.112); +1 medium, +2 long; no secondary target; 10 heat; the Null-Signature, Void-Signature and Chameleon systems appear in the quirk lists only" },
            },
        },
        unitTypes: ["mech"],
    },
    {
        // BattleTech Core Rulebook: credits page, "First Printing", "2026 The Topps Company". Its changes to the
        // Total Warfare rules are not modelled yet; a record first published in it is tagged with this edition.
        tag: "core-rulebook",
        name: "BattleTech Core Rulebook",
        year: 2026,
        month: 7,
        book: "CRB",
        // E-War audit, missiles and defenses (Task 8): where each edition prints the play rule.
        ewarPlayRules: {
            items: {
                ams: { book: "CRB", page: 206 },
                "laser-ams": { book: "CRB", page: 206 },
                apds: { book: "CRB", page: 206 },
                "artemis-iv": { book: "CRB", page: 197, note: "Artemis IV missiles p.192" },
                "artemis-v": { book: "CRB", page: 197, note: "Artemis V missiles p.192" },
                apollo: { book: "CRB", page: 197 },
                narc: { book: "CRB", page: 188, note: "Narc and iNarc pods pp.193-194" },
                inarc: { book: "CRB", page: 188, note: "iNarc pods pp.193-194" },
                tag: { book: "CRB", page: 200, note: "Light TAG as TAG, range altered" },
                "light-tag": { book: "CRB", page: 200 },
                "ecm-guardian": { book: "CRB", page: 200, ecmRadius: 6, ecmCancels: ["artemis","narc","c3","c3i","beagle"], eccm: false, note: "Activated (p.180); hostile ECM within 6 hexes blocks Artemis IV and V, degrades C3, strips Narc homing bonuses and stops standard probes; Streak, TAG, targeting computers and Apollo are unaffected; unlike the earlier books, LOS merely drawn through the radius has no effect (p.200)" },
                "c3-master": { book: "CRB", page: 198, note: "continues p.199 (configurations, ECM, stealth, TAG); activated per p.180; every networked 'Mech uses the range from the closest networked 'Mech that has LOS, only the Range Modifier changes; Masters must be on the battlefield and a destroyed Master disables its network; a network raises the BV of every unit in it (p.220); up to twelve 'Mechs; a Master controls one to three Slaves or one to three Masters; ECM degrades the network with a +1 (one range bracket gained) or +2 (two brackets) TN modifier that never stacks, a Master in ECM degrades all its Slaves; a unit with an active stealth system is cut off (not Chameleon LPS); the Master duplicates TAG (p.200)" },
                "c3-slave": { book: "CRB", page: 198, note: "Slave; the Master's rules apply" },
                "c3i": { book: "CRB", page: 199, note: "activated per p.180; up to six 'Mechs, no Master, treated as Slaves for ECM purposes, so no single 'Mech or one ECM field degrades the whole network; not in a network with Masters and Slaves; no TAG" },
                "c3-boosted-master": { book: "CRB", page: 199, note: "C3BS works as standard C3; only Angel ECM degrades it (a 'Mech with an active stealth system is still cut off); standard and boosted units may share a network: a non-boosted member can be degraded as normal and a non-boosted Master's data to boosted members is degraded inside any hostile ECM" },
                "c3-boosted-slave": { book: "CRB", page: 199, note: "C3BS works as standard C3; only Angel ECM degrades it (a 'Mech with an active stealth system is still cut off); standard and boosted units may share a network: a non-boosted member can be degraded as normal and a non-boosted Master's data to boosted members is degraded inside any hostile ECM" },
                "ecm-clan": { book: "CRB", page: 200, ecmRadius: 6, ecmCancels: ["artemis","narc","c3","c3i","beagle"], eccm: false, note: "Same section as the Guardian ECM suite (Clan ECM suite)" },
                "ecm-angel": { book: "CRB", page: 200, ecmRadius: 6, ecmCounts: 2, ecmCancels: ["artemis","narc","c3","c3i","beagle","streak-lock","bloodhound","c3-boosted"], eccm: false, note: "As ECM, plus blocks the Bloodhound probe and Boosted C3 and spoils Streak locks" },
                "ecm-watchdog": { book: "CRB", page: 201, ecmRadius: 6, ecmCancels: ["artemis","narc","c3","c3i","beagle"], eccm: false, probeRange: 3, probeFinds: ["hidden"], note: "Same radius, range and functions as the Clans' ECM and Active Probe (pp.200, 197); can be the ECM suite stealth armor needs (p.209)" },
                "probe-beagle": { book: "CRB", page: 197, probeRange: 4, probeFinds: ["hidden"], note: "Light Active Probe 3, Beagle 4, Active Probe 5 hexes; blocked by hostile ECM" },
                "probe-clan": { book: "CRB", page: 197, probeRange: 5, probeFinds: ["hidden"], note: "Active Probe range 5" },
                "probe-light": { book: "CRB", page: 197, probeRange: 3, probeFinds: ["hidden"], note: "Range 3" },
                "probe-bloodhound": { book: "CRB", page: 197, probeRange: 8, probeFinds: ["hidden","stealth","null-sig","mimetic","void-sig","sneak-ecm"], note: "Range 8; immune to standard ECM, only Angel ECM blocks it" },
                "stealth-armor": { book: "CRB", page: 202, needsEcm: true, blocksProbes: "bloodhound", stealthMods: {medium:1,long:2}, stealthHeat: 10, stealthEcm: "switches-off", cutsC3: true, note: "Activated (p.180); ECM suite required; while active no ECM on the unit functions, the unit suffers effects as if inside a hostile ECM suite's radius (p.200) and it cannot use any C3 system; +1 medium and +2 long stealth TN modifiers; no secondary target; not detected by a standard probe if hidden; 10 heat" },
                "null-sig": { book: "CRB", page: 209, stealthMods: {medium:1,long:2}, stealthHeat: 10, stealthEcm: "switches-off", cutsC3: true, note: "Stealth systems, general: a unit with an active stealth system is cut from its C3 network and cannot create a hostile ECM field; +1 medium and +2 long stealth TN modifiers; only the Bloodhound locates it; 10 heat; cumulative with the Chameleon LPS; +2 TN to a scan (p.233)" },
                "void-sig": { book: "CRB", page: 209, needsEcm: true, blocksProbes: "all", stealthMoveMods: [{hexes:0,modifier:3},{hexes:1,modifier:2},{hexes:3,modifier:1},{hexes:6,modifier:0}], stealthHeat: 10, stealthOwnAttack: 1, stealthExcludes: ["chameleon"], stealthEcm: "switches-off", cutsC3: true, note: "ECM suite required (does not work while active); stealth TN by hexes moved: +3 for 0, +2 for 1-2, +1 for 3-5, none for 6+; only the Bloodhound locates it; 10 heat and +1 TN on all ranged attacks the unit makes" },
                "chameleon": { book: "CRB", page: 209, stealthMods: {medium:1,long:2}, stealthHeat: 6, stealthExcludes: ["stealth-armor","void-sig"], cutsC3: false, note: "+1 medium and +2 long stealth TN modifiers, cumulative with the Null-Signature System; 6 heat; unlike other stealth systems it does not prevent C3 use or hostile ECM fields (TO:AUE p.112 cuts C3)" },
            },
        },
        // 'Mechs, and buildings in its urban combat rules (CRB pp.130-137). Vehicles, infantry and aerospace units
        // are Battlefield Support Assets there (CRB p.140), not units built or played on their own.
        unitTypes: ["mech", "building"],
    },
];

/** The edition a record belongs to when it does not say: the one the catalogs are written against. */
export const DEFAULT_RULES_EDITION = "total-warfare";

/**
 * The first edition published after FanPro took over the line. FASA-era licensed material (BattleTechnology and the
 * like) is canon in the editions before it that were current at its publication, and apocryphal from this one on
 * (user ruling, 2026-10-21). The library's copy of the Master Rules, Revised Edition names its publisher on its credits
 * page (BMR(R) p.4): "Published by FanPro LLC", "© 2001-2005 WizKids". That copy is a 2005 printing; its record
 * sheets (BMR(R) p.2) still read "Copyright 2001" under FASA Corporation, so the first printing's publisher is not
 * shown in the library.
 */
export const FANPRO_FIRST_EDITION = "master-rules-revised";

export function getRulesEditions(): IRulesEdition[] {
    return btRulesEditions;
}

type IEditionRecord = {
    introducedInEdition?: string;
    editionStats?: IEditionStatsTable;
    apocryphalIn?: IEditionHistory["apocryphalIn"];
    editions?: string[];
    editionLevels?: { [editionTag: string]: number };
    rulesLevel?: number;
};

const editionOrder = (tag: string) => btRulesEditions.findIndex(edition => edition.tag === tag);

/** A record's first edition: its own `introducedInEdition`, or the default when it has none. */
export function getIntroducedInEdition(record: IEditionRecord): string {
    return record.introducedInEdition ?? DEFAULT_RULES_EDITION;
}

/**
 * Every edition this record is canon in, in `btRulesEditions` order; empty when it is never canon. A record's own
 * `editions` wins. Without one, the list is derived from today's rules: nothing for a record at the Apocryphal rules
 * level or above; otherwise the earlier editions its `editionStats` lists, then every edition from the default
 * edition on that is not before the record's first edition.
 */
export function getRecordEditions(record: IEditionRecord): string[] {
    if (record.editions !== undefined) {
        return record.editions;
    }
    if (record.rulesLevel !== undefined && record.rulesLevel >= APOCRYPHAL_RULES_LEVEL) {
        return [];
    }
    const defaultOrder = editionOrder(DEFAULT_RULES_EDITION);
    const introduced = editionOrder(getIntroducedInEdition(record));
    return btRulesEditions
        .filter((edition, index) => {
            if (index < defaultOrder) {
                return record.editionStats !== undefined && edition.tag in record.editionStats;
            }
            return introduced >= 0 && introduced <= index;
        })
        .map(edition => edition.tag);
}

/**
 * The rules level at which this record is canon in `editionTag`: its own `editionLevels` entry, else 0 in an earlier
 * edition or expansion (the box sets and the expansions before Total Warfare are not graded by level) and the
 * record's `rulesLevel` in one graded like Total Warfare and from the default edition on.
 */
export function getRecordLevelInEdition(record: IEditionRecord, editionTag: string): number {
    if (record.editionLevels !== undefined && editionTag in record.editionLevels) {
        return record.editionLevels[editionTag];
    }
    if (btRulesExpansions.some(expansion => expansion.tag === editionTag)) {
        return 0;
    }
    return isEarlierRulesEdition(editionTag) && !getRulesEdition(editionTag).gradedLikeTotalWarfare ? 0 : (record.rulesLevel ?? 0);
}

/**
 * Why the rules of `editionTag` at `rulesLevel` do not offer this record: "edition" when the edition does not
 * include it, "level" when it does but at a higher rules level, null when it is offered. A record dropped from the
 * rules is apocryphal in the later editions, and a never-canon record with no source is apocryphal from the default
 * edition on; both appear from the Apocryphal rules level up.
 */
export function getRecordOfferIssue(record: IEditionRecord, editionTag: string, rulesLevel: number): "edition" | "level" | null {
    const selected = timelineOrder(editionTag);
    if (selected < 0) {
        return "edition";
    }
    const editions = getRecordEditions(record);
    if (editions.includes(editionTag)) {
        return getRecordLevelInEdition(record, editionTag) <= rulesLevel ? null : "level";
    }
    if (rulesLevel < APOCRYPHAL_RULES_LEVEL) {
        return "edition";
    }
    if (record.apocryphalIn && editionTag in record.apocryphalIn) {
        return null;
    }
    if (editions.length === 0) {
        if (record.apocryphalIn) {
            return "edition";
        }
        return selected >= timelineOrder(DEFAULT_RULES_EDITION) ? null : "edition";
    }
    return selected > Math.max(...editions.map(timelineOrder)) ? null : "edition";
}

/** Does the rules of `editionTag` at `rulesLevel` offer this record? */
export function isOfferedInEdition(record: IEditionRecord, editionTag: string, rulesLevel: number): boolean {
    return getRecordOfferIssue(record, editionTag, rulesLevel) === null;
}

/**
 * Do the rules of `editionTag` include this record? Without a `rulesLevel`, when the edition is one of its editions,
 * read without regard to its rules level. With one, unless the record is missing from the edition itself; a record held back only by its level
 * still counts as included, as do the apocryphal appearances from the Apocryphal rules level up.
 */
export function isInRulesEdition(record: IEditionRecord, editionTag: string = DEFAULT_RULES_EDITION, rulesLevel?: number): boolean {
    if (rulesLevel === undefined) {
        // The question here is the record's first edition, not its level: an Apocryphal-level record still counts.
        return getRecordEditions({ ...record, rulesLevel: undefined }).includes(editionTag);
    }
    return getRecordOfferIssue(record, editionTag, rulesLevel) !== "edition";
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
    // Expansions count as editions here: AeroTech 2, Revised reprints AeroTech 2's capital weapons (null).
    for (let index = timelineOrder(editionTag); index >= 0; index--) {
        const stats = table[editionTimeline[index].tag];
        if (stats) {
            return stats;
        }
    }
    return undefined;
}

/** The edition's own play rules, or undefined where play mode follows Total Warfare. */
export function getEditionPlayRules(editionTag: string | undefined): IEditionPlayRules | undefined {
    return getRulesEdition(editionTag).playRules;
}

/*
 * Phase 1 (#642): the missile family numbers, read from each edition pages (the book and page of each item are on the
 * edition entry above). Merged into the entries at load.
 */
const ARTEMIS_EXCLUDES = ["streak", "narc", "swarm", "thunder", "indirect"];
const BTC_AMS: IEWarDefenseRule = { mode: "missiles-destroyed", dice: 1, clanDice: 2, heat: 1, beforeRoll: true, ammoRoll: { dice: 1, multiplier: 2 } };
const OLD_AMS: IEWarDefenseRule = { mode: "missiles-destroyed", dice: 1, clanDice: 2, heat: 1, ammoPerMissile: 1 };
const TW_AMS: IEWarDefenseRule = { mode: "cluster-shift", shift: -4, heat: 1, ammoPerUse: 1, maxPerTurn: 1 };
const ARTEMIS_IV: Partial<IEWarItemRule> = { clusterShift: 2, ecmBlocks: true, excludes: ARTEMIS_EXCLUDES };
const ARTEMIS_V: Partial<IEWarItemRule> = { clusterShift: 3, clusterMax: 12, toHit: -1, ecmBlocks: true, excludes: ARTEMIS_EXCLUDES };
const NARC_EXCLUDES = ["streak", "artemis", "swarm", "thunder", "indirect"];
const NARC: Partial<IEWarItemRule> = { clusterShift: 2, ecmBlocks: true, excludes: NARC_EXCLUDES };
const INARC: Partial<IEWarItemRule> = { clusterShift: 2, toHit: -1, ecmBlocks: true, excludes: NARC_EXCLUDES };
const NARC_POD_ONLY: Partial<IEWarItemRule> = { ...NARC, ecmPodOnly: true };
const INARC_POD_ONLY: Partial<IEWarItemRule> = { ...INARC, ecmPodOnly: true };
const TW_LASER_AMS: IEWarDefenseRule = { mode: "cluster-shift", shift: -4, heat: 7, clanHeat: 5, ammoPerUse: 0, maxPerTurn: 1, belowTwoDestroys: true };
const MT_LASER_AMS: IEWarDefenseRule = { mode: "missiles-destroyed", dice: 2, clanDice: 2, heatFromRoll: true, ammoPerUse: 0 };
const APDS: IEWarDefenseRule = { mode: "cluster-shift", shift: -4, friendlyShifts: [-4, -3, -2, -1], heat: 2, ammoPerUse: 1, maxPerTurn: 1, belowTwoDestroys: true };
const MISSILE_NUMBERS: Record<string, Partial<Record<EWarKind, Partial<IEWarItemRule>>>> = {
    "battletech-compendium": { ams: { defense: BTC_AMS }, "artemis-iv": ARTEMIS_IV, narc: NARC },
    "compendium-rules-of-warfare": { ams: { defense: BTC_AMS }, "artemis-iv": ARTEMIS_IV, narc: NARC },
    "master-rules": {
        ams: { defense: OLD_AMS }, "artemis-iv": ARTEMIS_IV, narc: NARC, tag: { semiGuided: true }, "light-tag": { rangeBands: [3, 6, 9] },
        "laser-ams": { defense: MT_LASER_AMS }, "artemis-v": ARTEMIS_V,
    },
    "master-rules-revised": {
        ams: { defense: OLD_AMS }, "artemis-iv": ARTEMIS_IV, narc: NARC, inarc: INARC, tag: { semiGuided: true }, "light-tag": { rangeBands: [3, 6, 9] },
        "laser-ams": { defense: MT_LASER_AMS }, "artemis-v": ARTEMIS_V,
    },
    "total-warfare": {
        ams: { defense: TW_AMS }, "artemis-iv": ARTEMIS_IV, narc: NARC_POD_ONLY, inarc: INARC_POD_ONLY, tag: { semiGuided: true }, "light-tag": { rangeBands: [3, 6, 9] },
        "laser-ams": { defense: TW_LASER_AMS }, apds: { defense: APDS },
        "artemis-v": ARTEMIS_V, "artemis-prototype": { clusterShift: 1, ecmBlocks: true, excludes: ARTEMIS_EXCLUDES },
        apollo: { clusterShift: -1, ecmBlocks: false },
    },
    "battlemech-manual": {
        ams: { defense: TW_AMS }, "artemis-iv": ARTEMIS_IV, narc: NARC, inarc: INARC, tag: { semiGuided: true }, "light-tag": { rangeBands: [3, 6, 9] },
        "laser-ams": { defense: { mode: "cluster-shift", shift: -4, heat: 5, clanHeat: 5, ammoPerUse: 0, maxPerTurn: 1, belowTwoDestroys: true } },
        "artemis-v": ARTEMIS_V, apollo: { clusterShift: -1, ecmBlocks: false },
    },
    "core-rulebook": {
        ams: { defense: { ...TW_AMS, maxPerTurn: 2, belowTwoDestroys: true } }, "artemis-iv": ARTEMIS_IV, narc: { ...NARC_POD_ONLY, toHit: -1 }, inarc: INARC_POD_ONLY,
        tag: { semiGuided: true, semiGuidedMode: "designated-bonus" }, "light-tag": { rangeBands: [3, 6, 9] },
        "laser-ams": { defense: { mode: "cluster-shift", shift: -4, heat: 7, clanHeat: 5, ammoPerUse: 0, maxPerTurn: 2, belowTwoDestroys: true } },
        apds: { defense: { ...APDS, maxPerTurn: 2 } }, "artemis-v": ARTEMIS_V, apollo: { clusterShift: 1, ecmBlocks: false },
    },
};
// Missiles the anti-missile systems cannot engage, as each book prints them.
{
    const immune: Record<string, string[]> = {
        "battletech-compendium": ["thunder", "swarm"], "compendium-rules-of-warfare": ["thunder", "swarm"],
        "master-rules": ["arrow-iv", "thunder", "flare", "swarm"], "master-rules-revised": ["arrow-iv", "thunder", "flare", "swarm"],
        "total-warfare": ["arrow-iv"], "battlemech-manual": ["arrow-iv"], "core-rulebook": ["arrow-iv"],
    };
    for (const [tag, munitions] of Object.entries(immune)) {
        const rules = btRulesEditions.find(edition => edition.tag === tag)?.ewarPlayRules;
        if (rules) {
            rules.amsImmune = munitions;
        }
    }
}
// The Core Rulebook MRM: no +1 to-hit, a -1 Cluster Hits modifier (CRB p.186; Apollo FCS p.197 removes it).
{
    const crb = btRulesEditions.find(edition => edition.tag === "core-rulebook")?.ewarPlayRules;
    if (crb) {
        crb.mrm = { toHit: 0, clusterBase: -1, label: "the Core Rulebook" };
    }
}
for (const edition of btRulesEditions) {
    const numbers = MISSILE_NUMBERS[edition.tag];
    const items = edition.ewarPlayRules?.items;
    if (numbers && items) {
        for (const [kind, extra] of Object.entries(numbers) as [EWarKind, Partial<IEWarItemRule>][]) {
            if (items[kind]) {
                Object.assign(items[kind] as IEWarItemRule, extra);
            }
        }
    }
}

// C3 network numbers (Phase 3), read from Appendix A "C3" (BTC p.118, BTC:RoW pp.114-115, BMR pp.124-125, BMR(R) pp.134-135, TW pp.131-133,
// TO:AUE pp.109-111 and 144, BMM pp.110-112, CRB pp.198-199, TO:AR pp.99-100, IO:AE p.60, Ghosts of Obeedah p.55).
const C3_OLD: IEWarC3Rule = { maxUnits: 12, slavesPerMaster: 3, mastersMixable: false, ecm: "cut-off", needsLos: "nearest", indirectBenefit: false, masterTag: true, portionEnds: true };
const C3_TW: IEWarC3Rule = { maxUnits: 12, slavesPerMaster: 3, mastersMixable: false, ecm: "cut-off", needsLos: "attacker", indirectBenefit: false, masterTag: true, portionEnds: true };
const C3_BMM: IEWarC3Rule = { ...C3_TW };
const C3_CRB: IEWarC3Rule = { ...C3_BMM, needsLos: "nearest", portionEnds: false, ecm: "degrade", degrade: { perBracket: 1 } };
const C3I_RULE = (base: IEWarC3Rule): IEWarC3Rule => ({ ...base, maxUnits: 6, slavesPerMaster: undefined, mastersMixable: undefined, masterTag: false, portionEnds: false });
const C3_BOOSTED = (base: IEWarC3Rule): Partial<IEWarItemRule> => ({ c3: { ...base, ecm: "none" }, c3Immune: ["ecm-except-angel"] });
const C3_NUMBERS: Record<string, Partial<Record<EWarKind, Partial<IEWarItemRule>>>> = {
    "battletech-compendium": { "c3-master": { c3: C3_OLD }, "c3-slave": { c3: C3_OLD } },
    "compendium-rules-of-warfare": { "c3-master": { c3: C3_OLD }, "c3-slave": { c3: C3_OLD } },
    "master-rules": { "c3-master": { c3: C3_OLD }, "c3-slave": { c3: C3_OLD } },
    "master-rules-revised": { "c3-master": { c3: C3_OLD }, "c3-slave": { c3: C3_OLD }, c3i: { c3: C3I_RULE(C3_OLD) } },
    "total-warfare": {
        "c3-master": { c3: C3_TW }, "c3-slave": { c3: C3_TW, nonBaTonnage: 3 }, c3i: { c3: C3I_RULE(C3_TW), nonBaTonnage: 3 },
        "c3-boosted-master": C3_BOOSTED(C3_TW), "c3-boosted-slave": C3_BOOSTED(C3_TW),
        "c3-emergency-master": { c3: { ...C3_TW, masterTag: false }, c3Turns: 6 },
        "c3-remote-sensor": { c3: { ...C3_TW, masterTag: false }, c3Turns: 3, c3PodDamage: 2 },
        "c3-naval": { c3: { ...C3I_RULE(C3_TW), ecm: "none", maxHexes: 60 }, c3Immune: ["fighter-ecm", "small-craft-ecm"] },
        "ew-equipment": { ecmRadius: 3, ecmCancels: ["artemis", "narc", "c3", "c3i", "beagle"], probeRange: 3, probeFinds: ["hidden"] },
        communications: { eccmShare: 0.5, ghostByComms: true },
        "ecm-guardian": { nonBaTonnage: 3 }, "ecm-clan": { nonBaTonnage: 3 }, "ecm-angel": { nonBaTonnage: 3 }, "stealth-ba": { nonBaTonnage: 3 },
        "stealth-ba-standard": { nonBaTonnage: 3 }, "stealth-ba-improved": { nonBaTonnage: 3 }, "stealth-ba-achileus": { nonBaTonnage: 3 }, "stealth-ba-infiltrator": { nonBaTonnage: 3 }, "stealth-ba-infiltrator-mk2": { nonBaTonnage: 3 },
        "ecm-nova": { c3: { ...C3I_RULE(C3_TW), maxUnits: 3, ecm: "none" }, c3Immune: ["ecm-except-nova"] },
    },
    "battlemech-manual": {
        "c3-master": { c3: C3_BMM }, "c3-slave": { c3: C3_BMM }, c3i: { c3: C3I_RULE(C3_BMM) },
        "c3-boosted-master": C3_BOOSTED(C3_BMM), "c3-boosted-slave": C3_BOOSTED(C3_BMM),
    },
    "core-rulebook": {
        "c3-master": { c3: C3_CRB }, "c3-slave": { c3: C3_CRB }, c3i: { c3: C3I_RULE(C3_CRB) },
        "c3-boosted-master": C3_BOOSTED(C3_CRB), "c3-boosted-slave": C3_BOOSTED(C3_CRB),
    },
};
for (const edition of btRulesEditions) {
    const numbers = C3_NUMBERS[edition.tag];
    const items = edition.ewarPlayRules?.items;
    if (numbers && items) {
        for (const [kind, extra] of Object.entries(numbers) as [EWarKind, Partial<IEWarItemRule>][]) {
            if (items[kind]) {
                Object.assign(items[kind] as IEWarItemRule, extra);
            }
        }
    }
}

// Custom and fan E-War items (Custom Homebrew; they enter the rules editions at the default edition, Total Warfare, so Total Warfare
// holds their entries and the later books carry them forward as apocryphal): the Personal ECM, the Modular C3. The Chaff Pod 2.0 plays by
// the Chaff Pod entry, the ER iNarc by the iNarc entry and the fan Null-Signature System by the Null-Signature entry.
{
    const totalWarfare = btRulesEditions.find(edition => edition.tag === "total-warfare")?.ewarPlayRules?.items;
    if (totalWarfare) {
        totalWarfare["ecm-personal"] = {
            book: "Custom Homebrew", page: 0, ecmRadius: 0, ecmCancels: totalWarfare["ecm-guardian"]?.ecmCancels, eccm: false,
            note: "Custom Homebrew by u/PleiadesMechworks (r/NormalBattletech, Pleiades Mechworks equipment post): the capabilities of a Guardian ECM Suite, but only in the hex of the unit that mounts it, with no ECCM mode and no ghost targets; it is not an ECM suite for Stealth Armor or anything else that needs one",
        };
        totalWarfare["c3-modular"] = {
            book: "Custom Homebrew", page: 0, c3: { ...C3I_RULE(C3_TW), maxUnits: 12 },
            note: "Custom Homebrew by Prince (Solaris7 forum, LosTech custom weapons, April 2020): an outgrowth of the Improved C3 Computer that links up to 12 units (1 ton shares targeting with 1 unit, each half ton more adds one); every unit mounts one, links need line of sight and are named at the start of each Initiative Phase; otherwise as the Improved C3 Computer",
        };
    }
}

// Aerospace ECM (Phase 3): the advanced field rule of Strategic Operations under Total Warfare (TW p.238, SO pp.99-100); the
// Revised Master Rules era AT2 Revised prints no effect between AT2 units (AT2R p.25). No other book has aerospace combat rules.
for (const [tag, aeroEcm] of [["master-rules", "none-between-aero"], ["total-warfare", "so-field"], ["master-rules-revised", "none-between-aero"]] as const) {
    const guardian = btRulesEditions.find(edition => edition.tag === tag)?.ewarPlayRules?.items["ecm-guardian"];
    if (guardian) {
        guardian.aeroEcm = aeroEcm;
    }
}

// An item a later edition drops is not removed: it stays available there as apocryphal and plays by the rule of the last
// book that printed it (NGCFells, 2026-11-21). Carried along the whole chain of editions that have E-War rules, after every
// edition's numbers are filled, so each edition holds everything an earlier one printed (a printed entry is never replaced).
const EWAR_EDITION_CHAIN = ["battletech-compendium", "compendium-rules-of-warfare", "master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"];
for (let index = 1; index < EWAR_EDITION_CHAIN.length; index++) {
    const earlier = btRulesEditions.find(edition => edition.tag === EWAR_EDITION_CHAIN[index - 1])?.ewarPlayRules?.items;
    const later = btRulesEditions.find(edition => edition.tag === EWAR_EDITION_CHAIN[index])?.ewarPlayRules?.items;
    if (earlier && later) {
        for (const [kind, item] of Object.entries(earlier) as [EWarKind, IEWarItemRule][]) {
            const printed = later[kind];
            if (!printed) {
                later[kind] = { ...item, apocryphal: true };
                continue;
            }
            // A rule flag the earlier printing of a kept item had and the later one does not print stays (apocryphal): aerospace ECM,
            // the battle armor tonnage limit, ghost targets, and the ECCM mode.
            if (printed.aeroEcm === undefined && item.aeroEcm !== undefined) printed.aeroEcm = item.aeroEcm;
            if (printed.nonBaTonnage === undefined && item.nonBaTonnage !== undefined) printed.nonBaTonnage = item.nonBaTonnage;
            if (printed.ghostTargets === undefined && item.ghostTargets !== undefined) printed.ghostTargets = item.ghostTargets;
            if (!printed.eccm && item.eccm) printed.eccm = true;
        }
    }
}

/** The edition's E-War rules, or undefined where none are entered. */
export function getEWarPlayRules(editionTag: string): IEWarPlayRules | undefined {
    return getRulesEdition(editionTag).ewarPlayRules;
}

/** Does the edition's rulebook print prices? */
export function editionHasPrices(editionTag: string | undefined): boolean {
    return !getRulesEdition(editionTag).noPrices;
}

/**
 * Internal structure boxes an earlier edition's own table gives a 'Mech of `tons` (read from the standard
 * structure record). With `anyEdition`, the first edition whose table has the row: Battledroids alone has 5 tons.
 */
export function getEditionStructure(record: IEditionRecord, editionTag: string, tons: number, anyEdition: boolean = false): IRawMechStructure | undefined {
    const own = isEarlierRulesEdition(editionTag) ? getEditionStats(record, editionTag)?.structure?.[tons] : undefined;
    if (own || !anyEdition) {
        return own;
    }
    for (const edition of btRulesEditions) {
        const row = record.editionStats?.[edition.tag]?.structure?.[tons];
        if (row) {
            return row;
        }
    }
    return undefined;
}

/** True for an edition before the one the catalogs are written against: its lists and stats come from `editionStats`. */
export function isEarlierRulesEdition(editionTag: string): boolean {
    const selected = editionOrder(editionTag);
    return selected >= 0 && selected < editionOrder(DEFAULT_RULES_EDITION);
}

/**
 * Editions a design of `unitType` can be built under: the default edition, those after it, and each earlier
 * edition that has been entered whole (`complete`), when the edition has rules for that unit type.
 */
export function getSelectableRulesEditions(unitType: RulesEditionUnitType = "mech"): IRulesEdition[] {
    return btRulesEditions.filter(edition => (edition.complete || !isEarlierRulesEdition(edition.tag))
        && (edition.unitTypes ?? ["mech"]).includes(unitType));
}

/** The tag itself when `unitType` can be built under that edition, otherwise the default edition's. */
export function getSelectableRulesEditionTag(editionTag: unknown, unitType: RulesEditionUnitType): string {
    return getSelectableRulesEditions(unitType).find(edition => edition.tag === editionTag)?.tag ?? DEFAULT_RULES_EDITION;
}

/** The edition with this tag, or the default edition when the tag is unknown (a save from a newer version). */
export function getRulesEdition(editionTag: string | undefined): IRulesEdition {
    return btRulesEditions.find(edition => edition.tag === editionTag)
        ?? btRulesEditions.find(edition => edition.tag === DEFAULT_RULES_EDITION)!;
}

/**
 * An equipment record as `editionTag` prints it: a copy with the edition's weight, heat, damage, ranges, critical
 * slots, price and citation in place of the catalog's. The record itself for the default edition and later ones,
 * and for a record the edition does not include. `techBase` is the technology base of the unit that mounts it: for "clan"
 * the edition's `clan` figures (a universal record the book prints apart for the Clan) replace the weight, slots and price.
 */
export function getEquipmentForEdition(item: IEquipmentItem, editionTag: string, techBase?: string): IEquipmentItem {
    const stats = isEarlierRulesEdition(editionTag) ? getEditionStats(item, editionTag) : undefined;
    if (!stats) {
        return item;
    }
    const copy = JSON.parse(JSON.stringify(item)) as IEquipmentItem;
    copy.book = stats.book;
    copy.page = stats.page;
    if (stats.weight !== undefined) copy.weight = stats.weight;
    if (stats.heat !== undefined) copy.heat = stats.heat;
    if (stats.cbills !== undefined) copy.cbills = stats.cbills;
    if (stats.damage !== undefined && typeof copy.damage === "number") copy.damage = stats.damage;
    if (stats.range) copy.range = { ...copy.range, ...stats.range };
    if (stats.criticals !== undefined) copy.space = { ...copy.space, battlemech: stats.criticals };
    if (techBase === "clan" && stats.clan) {
        if (stats.clan.weight !== undefined) copy.weight = stats.clan.weight;
        if (stats.clan.cbills !== undefined) copy.cbills = stats.clan.cbills;
        if (stats.clan.criticals !== undefined) copy.space = { ...copy.space, battlemech: stats.clan.criticals };
    }
    return copy;
}

/** Does `editionTag` print this record for the Inner Sphere only, so a pure Clan unit may not mount it there? */
export function isInnerSphereOnlyInEdition(record: IEditionRecord, editionTag: string): boolean {
    return isEarlierRulesEdition(editionTag) && getEditionStats(record, editionTag)?.innerSphereOnly === true;
}

/** Tons of jump jet for each jump movement point at this tonnage, where `editionTag` prints its own figure. */
export function getEditionJumpJetWeight(jumpJet: IEditionRecord, editionTag: string, tonnage: number): number | undefined {
    const stats = isEarlierRulesEdition(editionTag) ? getEditionStats(jumpJet, editionTag) : undefined;
    return stats?.weightByTonnage?.find(band => tonnage <= band.upTo)?.tons ?? stats?.weight;
}

/** Does the engine hold some heat sinks without critical slots under `editionTag`? The first two editions say no. */
export function editionEngineHoldsHeatSinks(heatSink: IEditionRecord, editionTag: string): boolean {
    const stats = isEarlierRulesEdition(editionTag) ? getEditionStats(heatSink, editionTag) : undefined;
    return stats?.engineHeatSinks ?? true;
}

/**
 * Expansion rulebooks that added unit types to the core rules of their day. Years are the copyright dates on each
 * book's credits page; the unit types come from its contents pages. An expansion is offered once it has been entered
 * whole from its page images (`complete`), as an earlier edition is; until then it is listed here only.
 */
export interface IRulesExpansion {
    tag: string;
    name: string;
    year: number;
    /** Publication month (1-12), where the credits page prints one. */
    month?: number;
    book: string;
    /** The unit types the expansion gives rules (or construction rules) for. */
    unitTypes: RulesEditionUnitType[];
    complete?: boolean;
}

export const btRulesExpansions: IRulesExpansion[] = [
    // CityTech (FASA 1608): "Copyright 1986". Buildings, vehicles with their design rules, and infantry.
    { tag: "citytech", name: "CityTech", year: 1986, month: 8, book: "CT", unitTypes: ["vehicle", "infantry", "building"] },
    // AeroTech (FASA 1609): "Copyright 1986". Aerospace fighters with their design rules, and DropShips.
    { tag: "aerotech", name: "AeroTech", year: 1986, month: 8, book: "AT", unitTypes: ["fighter", "small-craft"] },
    // BattleTroops (FASA 1637): "Copyright © 1989". Infantry, with vehicles and buildings in its tactical game.
    { tag: "battletroops", name: "BattleTroops", year: 1989, month: 8, book: "BTr", unitTypes: ["infantry"] },
    // ClanTroops (FASA 1664): "Copyright © 1991". Clan battle armor (Elementals), supplementing BattleTroops.
    { tag: "clantroops", name: "ClanTroops", year: 1991, month: 12, book: "CTr", unitTypes: ["battle-armor"] },
    // BattleSpace (FASA 1680): "Copyright © 1993". Fighters, Small Craft, DropShips, JumpShips, WarShips and space
    // stations, with their construction rules (Master Weapons Table pp.70-71).
    { tag: "battlespace", name: "BattleSpace", year: 1993, book: "BS", unitTypes: ["fighter", "small-craft", "capital-ship"] },
    // CityTech, Second Edition (FASA 1608R): "Copyright © 1994".
    { tag: "citytech-2nd-edition", name: "CityTech, Second Edition", year: 1994, month: 12, book: "CT2", unitTypes: ["vehicle", "infantry", "building"] },
    // AeroTech 2 (FASA 1718): "Copyright © 2000". Aerospace and conventional fighters, Small Craft, DropShips,
    // JumpShips and WarShips (contents; BV p.53).
    { tag: "aerotech-2", name: "AeroTech 2", year: 2000, book: "AT2", unitTypes: ["fighter", "small-craft", "capital-ship"] },
    // AeroTech 2, Revised Edition (FanPro 35011): "© 2004 WizKids". The same unit types as AT2, revised.
    { tag: "aerotech-2-revised", name: "AeroTech 2, Revised Edition", year: 2004, book: "AT2R", unitTypes: ["fighter", "small-craft", "capital-ship"] },
];

export interface IEditionTimelineEntry {
    tag: string;
    year: number;
    month?: number;
    unitTypes: RulesEditionUnitType[];
    expansion: boolean;
}

/** Editions and expansions in publication order: year, then month where known, then editions before expansions. */
export function getEditionTimeline(): IEditionTimelineEntry[] {
    return editionTimeline.map(entry => ({ ...entry }));
}

function buildEditionTimeline(): IEditionTimelineEntry[] {
    const entries: IEditionTimelineEntry[] = [
        ...btRulesEditions.map(edition => ({ tag: edition.tag, year: edition.year, month: edition.month, unitTypes: edition.unitTypes ?? ["mech" as RulesEditionUnitType], expansion: false })),
        ...btRulesExpansions.map(expansion => ({ tag: expansion.tag, year: expansion.year, month: expansion.month, unitTypes: expansion.unitTypes, expansion: true })),
    ];
    return entries.sort((a, b) => a.year - b.year || (a.month ?? 0) - (b.month ?? 0) || Number(a.expansion) - Number(b.expansion));
}

const editionTimeline = buildEditionTimeline();
const timelineIndex = new Map(editionTimeline.map((entry, index) => [entry.tag, index]));
const timelineOrder = (tag: string) => timelineIndex.get(tag) ?? -1;

/** Is `tag` an edition or expansion tag a record's `editions` may name? */
export function isKnownEditionTag(tag: string): boolean {
    return timelineOrder(tag) >= 0;
}

/**
 * The edition or expansion current for `unitType` when a book was published (design 2026-10-24-catalog-consolidation,
 * ruling 7): the latest on the timeline that covers `unitType` and was published no later than `year`/`month`. An
 * entry with no month counts as published at the start of its year. Undefined before the first.
 */
export function getEditionAtPublication(year: number, month: number | undefined, unitType: RulesEditionUnitType): string | undefined {
    const published = year * 12 + (month ?? 1);
    return editionTimeline
        .filter(entry => entry.unitTypes.includes(unitType) && entry.year * 12 + (entry.month ?? 1) <= published)
        .pop()?.tag;
}

/** Expansions that have been entered whole and give rules for `unitType`. */
export function getSelectableRulesExpansions(unitType: RulesEditionUnitType): IRulesExpansion[] {
    return btRulesExpansions.filter(expansion => expansion.complete && expansion.unitTypes.includes(unitType));
}

/**
 * Editions of the Alpha Strike rules, oldest first. Play mode follows the Commander's Edition; the 2013 rulebook is
 * offered once its differences are entered (`complete`). The ACES rules are a separate ruleset, not an edition.
 */
export interface IAlphaStrikeEdition {
    tag: string;
    name: string;
    year: number;
    book: string;
    complete?: boolean;
    /** Every printing and errata, oldest first. The edition plays by the latest; a difference between printings is noted here, never played (#646). */
    printings: { name: string; year: number; extract: string; errata?: boolean; note?: string }[];
    /** The edition's own game levels; Apocryphal, Custom Homebrew and Munchkin follow. */
    levels: IRulesEditionLevel[];
    /** The lowest rules level whose rules let a unit be built. */
    constructionLevel: number;
    /** Where the edition's play differs from the Commander's Edition (audit in the #646 plan). */
    playRules: {
        /** Heat level 2 or higher takes 1 off the ground TMM (ASCE p.53 only; 2013 keeps the card TMM, v2.5). */
        heatLowersTmm: boolean;
        /** A weapon hit takes a damage value of 1 to 0* and 0* to 0 (ASCE p.50); 2013 takes 1 to a minimum of 0. */
        weaponHitToMinimal: boolean;
        /** A vehicle's first Engine Hit halves its TMM as well as Move and damage (ASCE p.50). */
        vehicleEngineHitHalvesTmm: boolean;
    };
    /** The edition's E-War special abilities; absent while not entered. */
    ewarRules?: {
        specials: Partial<Record<AlphaStrikeEWarSpecial, IEWarItemRule>>;
        /** A non-infantry unit with STL on counts as inside hostile ECM for its own gear and projects no ECM (ASCE p.79 only). */
        stealthJamsOwnEcm?: boolean;
        /** A C3 slave is burnt out when its emergency master shuts down (ASCE p.82 only). */
        c3EmergencyBurnsSlave?: boolean;
    };
}

/** Alpha Strike specials that carry E-War effects (checked against the 2013 book and the Commander's Edition, #642 Task 12). */
export type AlphaStrikeEWarSpecial =
    | "ECM" | "LECM" | "AECM" | "WAT" | "AMS" | "RAMS" | "PRB" | "LPRB" | "BH" | "DRO" | "RSD"
    | "TAG" | "LTAG" | "SNARC" | "CNARC" | "INARC" | "C3M" | "C3S" | "C3BSM" | "C3BSS" | "C3EM" | "C3I" | "C3RS" | "NC3"
    | "NOVA" | "STL" | "MAS" | "LMAS" | "JAM" | "TSEMP" | "DJ" | "HJ";

export const asRulesEditions: IAlphaStrikeEdition[] = [
    // Alpha Strike: credits page, "©2013 The Topps Company".
    {
        tag: "alpha-strike", name: "Alpha Strike", year: 2013, book: "AS", complete: true,
        printings: [
            { name: "1st printing", year: 2013, extract: "Alpha-Strike.txt", note: "Skill adjusted PV by multipliers (0.68 to 2.63); later printings use the Low-Skill/High-Skill step tables." },
            { name: "Corrected 2nd printing", year: 2015, extract: "AlphaStrike-CGL-2015-Corrected2ndPrinting.txt", note: "Page 167 still prints the old PV multiplier table, a leftover; the step tables are the rule." },
            { name: "Errata v2.3", year: 2017, extract: "AlphaStrike-CGL-2017-V23.txt", errata: true },
            { name: "Errata v2.3.1", year: 2017, extract: "AlphaStrike-CGL-2017-V231Dated20170729.txt", errata: true },
            { name: "Errata v2.4", year: 2018, extract: "AlphaStrike-CGL-2018-V24Dated20180606.txt", errata: true },
            { name: "Errata v2.5", year: 2019, extract: "AlphaStrike-CGL-2019-V25Dated20190918.txt", errata: true, note: "Final errata; superseded by the Commander's Edition." },
        ],
        // Levels 0 and 1 are kept as two entries: the Quick-Start Rules (2015) and the Introductory chapter (pp.10-21) are
        // different books. The extracts are interleaved columns, so no line diff of the two texts was made.
        levels: [
            { id: 0, name: "Alpha Strike Quick-Start Rules", book: "ASQS", page: 1 },
            { id: 1, name: "Introductory Alpha Strike", book: "AS", page: 10 },
            { id: 2, name: "Standard Alpha Strike", book: "AS", page: 22 },
            { id: 3, name: "Advanced Options", book: "AS", page: 62 },
            { id: 4, name: "Experimental", book: "AS", page: 62 },
        ],
        constructionLevel: 2,
        playRules: { heatLowersTmm: false, weaponHitToMinimal: false, vehicleEngineHitHalvesTmm: false },
        // The Corrected 2nd Printing: standard specials pp.46-51, optional specials and probes pp.104-109. The 2013 book
        // prints no RISC (RAMS, DJ, HJ), Naval C3, Nova, SDS Jammer or TSEMP special; the Alpha Strike Companion (2015, a
        // supplement to this book) does, so those are offered here by the Companion's pages (any book that offers an item for an
        // edition makes it available there).
        ewarRules: {
            specials: {
                ECM: { book: "AS", page: 46, inches: 12 }, AECM: { book: "AS", page: 46, inches: 12 }, AMS: { book: "AS", page: 46 },
                LECM: { book: "AS", page: 47, inches: 2 }, MAS: { book: "AS", page: 47 }, LMAS: { book: "AS", page: 47 },
                STL: { book: "AS", page: 48 }, WAT: { book: "AS", page: 49, inches: 12 },
                C3M: { book: "AS", page: 51, networkSize: 4 }, C3S: { book: "AS", page: 51 }, C3BSM: { book: "AS", page: 51, networkSize: 5 },
                C3BSS: { book: "AS", page: 51 }, C3EM: { book: "AS", page: 51 }, C3I: { book: "AS", page: 51, networkSize: 6 },
                C3RS: { book: "AS", page: 51 },
                PRB: { book: "AS", page: 104, inches: 18 }, BH: { book: "AS", page: 105, inches: 26 }, DRO: { book: "AS", page: 106 },
                LPRB: { book: "AS", page: 107, inches: 12 }, INARC: { book: "AS", page: 107 }, LTAG: { book: "AS", page: 107 },
                CNARC: { book: "AS", page: 107 }, SNARC: { book: "AS", page: 107 },
                RSD: { book: "AS", page: 108 }, TAG: { book: "AS", page: 109 },
                NC3: { book: "ASC", page: 38, networkSize: 6, note: "Alpha Strike Companion, a supplement to the 2013 book" },
                NOVA: { book: "ASC", page: 38, networkSize: 3, inches: 12, note: "Alpha Strike Companion, a supplement to the 2013 book" },
                JAM: { book: "ASC", page: 39, note: "Alpha Strike Companion, a supplement to the 2013 book" },
                RAMS: { book: "ASC", page: 39, inches: 2, note: "Alpha Strike Companion, a supplement to the 2013 book" },
                DJ: { book: "ASC", page: 39, inches: 34, note: "Alpha Strike Companion, a supplement to the 2013 book" },
                HJ: { book: "ASC", page: 39, inches: 34, note: "Alpha Strike Companion, a supplement to the 2013 book" },
                TSEMP: { book: "ASC", page: 39, note: "Alpha Strike Companion, a supplement to the 2013 book" },
            },
        },
    },
    // Alpha Strike: Commander's Edition, first published 2019 (as the user gave it, 2026-10-15); the library's copy is
    // the 2024 printing ("©2024 The Topps Company"), the one play mode follows.
    {
        tag: "alpha-strike-commanders-edition", name: "Alpha Strike: Commander's Edition", year: 2019, book: "ASCE", complete: true,
        printings: [
            { name: "1st printing", year: 2019, extract: "AlphaStrikeCommandersEdition-CGL-2019-1stPrinting.txt" },
            { name: "Corrected 2nd printing", year: 2020, extract: "AlphaStrikeCommandersEdition-CGL-2020-Corrected2ndPrinting.txt" },
            { name: "Corrected 3rd printing", year: 2021, extract: "AlphaStrikeCommandersEdition-CGL-2021-Corrected3rdPrinting.txt" },
            { name: "Corrected 5th printing", year: 2022, extract: "AlphaStrikeCommandersEdition-CGL-2022-Corrected5thPrinting.txt" },
            { name: "2024 printing", year: 2024, extract: "Alpha-Strike-Commander-s-Edition.txt" },
            { name: "Errata v6.0", year: 2023, extract: "Alpha-Strike-Commanders-Edition-v6-0-PRE.txt", errata: true },
            { name: "Errata v7.0", year: 2024, extract: "BattleTechRulebookAlphaStrikeCommandersEditionErrata-CGL-2024-V70.txt", errata: true },
            { name: "Errata v7.0.2", year: 2025, extract: "BattleTechRulebookAlphaStrikeCommandersEditionErrata-CGL-2025-V702.txt", errata: true, note: "Latest; newer than the v6.0 the issue named." },
        ],
        // ASCE has no introductory chapter: the box-set Quick-Start Rules are its entry rule set, for levels 0 and 1.
        levels: [
            { id: 0, name: "Quick-Start Rules", book: "ASQSB", page: 1 },
            { id: 1, name: "Quick-Start Rules", book: "ASQSB", page: 1 },
            { id: 2, name: "Standard", book: "ASCE", page: 22 },
            { id: 3, name: "Optional Rules", book: "ASCE", page: 136 },
            { id: 4, name: "Experimental", book: "ASCE", page: 136 },
        ],
        constructionLevel: 2,
        playRules: { heatLowersTmm: true, weaponHitToMinimal: true, vehicleEngineHitHalvesTmm: true },
        // Standard specials pp.76-82, optional specials pp.82-90 (the page the special's own entry starts on).
        ewarRules: {
            specials: {
                AECM: { book: "ASCE", page: 76, inches: 12 }, AMS: { book: "ASCE", page: 76 }, ECM: { book: "ASCE", page: 77, inches: 12 },
                LECM: { book: "ASCE", page: 78, inches: 2 }, MAS: { book: "ASCE", page: 78 }, LMAS: { book: "ASCE", page: 78 },
                STL: { book: "ASCE", page: 79 }, WAT: { book: "ASCE", page: 80, inches: 12 },
                C3BSM: { book: "ASCE", page: 80, networkSize: 4 }, C3BSS: { book: "ASCE", page: 80 },
                C3M: { book: "ASCE", page: 82, networkSize: 4 }, C3S: { book: "ASCE", page: 82 }, C3EM: { book: "ASCE", page: 82 },
                C3I: { book: "ASCE", page: 82, networkSize: 6 }, C3RS: { book: "ASCE", page: 82 },
                PRB: { book: "ASCE", page: 82, inches: 18 }, BH: { book: "ASCE", page: 83, inches: 26 }, DRO: { book: "ASCE", page: 84 },
                INARC: { book: "ASCE", page: 86 }, LTAG: { book: "ASCE", page: 86 }, LPRB: { book: "ASCE", page: 86, inches: 12 },
                CNARC: { book: "ASCE", page: 87 }, SNARC: { book: "ASCE", page: 87 }, NC3: { book: "ASCE", page: 87, networkSize: 6 },
                NOVA: { book: "ASCE", page: 87, networkSize: 3, inches: 12 }, RSD: { book: "ASCE", page: 88 },
                RAMS: { book: "ASCE", page: 89, inches: 2 }, JAM: { book: "ASCE", page: 89 }, DJ: { book: "ASCE", page: 89, inches: 34 },
                HJ: { book: "ASCE", page: 89, inches: 34 }, TAG: { book: "ASCE", page: 90 }, TSEMP: { book: "ASCE", page: 90 },
            },
            stealthJamsOwnEcm: true,
            c3EmergencyBurnsSlave: true,
        },
    },
];

/** The Alpha Strike edition's E-War rules, or undefined where none are entered. */
export function getAlphaStrikeEWarRules(editionTag: string): IAlphaStrikeEdition["ewarRules"] {
    return asRulesEditions.find(edition => edition.tag === editionTag)?.ewarRules;
}

/** The Alpha Strike edition play mode follows. */
export const DEFAULT_ALPHA_STRIKE_EDITION = "alpha-strike-commanders-edition";

/** The Alpha Strike edition for a saved tag; an unknown or missing tag is the default edition. */
export function getAlphaStrikeEdition(tag: string | undefined): IAlphaStrikeEdition {
    return asRulesEditions.find(edition => edition.tag === tag)
        ?? asRulesEditions.find(edition => edition.tag === DEFAULT_ALPHA_STRIKE_EDITION)!;
}

/** The rules levels to offer an Alpha Strike force: the edition's own levels, then Apocryphal, Custom Homebrew and Munchkin. */
export function getAlphaStrikeRulesLevelOptions(tag: string | undefined): IRulesLevelOption[] {
    const canon = getAlphaStrikeEdition(tag).levels.map(level => ({ ...btRulesLevelOptions.find(option => option.id === level.id)!, name: level.name }));
    return [...canon, ...btRulesLevelOptions.filter(option => option.id >= APOCRYPHAL_RULES_LEVEL)];
}

/** Whether the rules level lets an Alpha Strike unit be built; no level set means no limit. */
export function alphaStrikeEditionAllowsConstruction(tag: string | undefined, rulesLevel: number | undefined): boolean {
    return rulesLevel === undefined || rulesLevel >= getAlphaStrikeEdition(tag).constructionLevel;
}

/** The default edition, and each earlier one entered whole. */
export function getSelectableAlphaStrikeEditions(): IAlphaStrikeEdition[] {
    return asRulesEditions.filter(edition => edition.complete || edition.tag === DEFAULT_ALPHA_STRIKE_EDITION);
}

/** The rules levels to offer under an edition: its own game levels, then Apocryphal, Custom Homebrew and Munchkin. */
export function getRulesLevelOptionsForEdition(editionTag: string | undefined): IRulesLevelOption[] {
    const levels = getRulesEdition(editionTag).levels;
    if (!levels) {
        return getRulesLevelOptions();
    }
    const canon = levels.map(level => ({ ...btRulesLevelOptions.find(option => option.id === level.id)!, name: level.name }));
    return [...canon, ...btRulesLevelOptions.filter(option => option.id >= APOCRYPHAL_RULES_LEVEL)];
}

/**
 * The level the Rules Level control shows for the stored app-wide level (see fitRulesLevel). The stored setting is
 * left as it is.
 */
export function getShownRulesLevel(editionTag: string | undefined, storedLevel: number): number {
    return fitRulesLevel(getRulesLevelOptionsForEdition(editionTag).map(option => option.id), storedLevel);
}

/**
 * `storedLevel` when `levelIds` lists it. A game level the edition lacks becomes the edition's nearest game level, the
 * highest at or below it, else its lowest: never Apocryphal or above (user ruling 2026-10-26, #324: Total Warfare
 * Advanced under Battledroids is Expert Battledroids). Apocryphal and above go to the next listed level up.
 */
export function fitRulesLevel(levelIds: number[], storedLevel: number): number {
    if (levelIds.includes(storedLevel)) {
        return storedLevel;
    }
    const game = levelIds.filter(id => id < APOCRYPHAL_RULES_LEVEL);
    if (storedLevel < APOCRYPHAL_RULES_LEVEL && game.length > 0) {
        return [...game].reverse().find(id => id <= storedLevel) ?? game[0];
    }
    return levelIds.find(id => id >= storedLevel) ?? levelIds[levelIds.length - 1] ?? storedLevel;
}

/** Whether the edition's rules allow designing a new unit at this rules level. */
export function editionAllowsConstruction(editionTag: string | undefined, rulesLevel: number): boolean {
    return rulesLevel >= (getRulesEdition(editionTag).constructionLevel ?? 0);
}

/** Whether a printed unit may be edited at this level after a warning that editing moves it to the construction level. */
export function editionEditsPrintedUnitsAfterWarning(editionTag: string | undefined, rulesLevel: number): boolean {
    return !editionAllowsConstruction(editionTag, rulesLevel)
        && !!getRulesEdition(editionTag).levels?.find(level => level.id === rulesLevel)?.editsAfterWarning;
}
