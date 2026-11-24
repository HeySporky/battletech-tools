/**
 * MegaMek ".blk" unit files that differ from the book, keyed by "Name Model" as the file gives them (the model
 * trimmed). Each correction replaces whole blocks of the file, keyed by tag in lower case. Applied when the file is
 * read, so the bundle and a player's own import of the file both get the book's design.
 */
export interface IBlkDesignCorrection {
    blocks: Record<string, string[]>;
    source: string;
}

// Both armed Brunels "carry some nine and a half tons of standard armor" (152 points), NGCFells's ruling 2026-11-20:
// BAR 10. The files give BAR 6 (AC) or no BAR (LRM) at armor Tech Rating C, where BAR 10 does not exist; it needs
// Tech Rating D or better and the Armored chassis modification (TM p.134). At D the 152 points weigh 9,576 kg, the
// nearest to the book's figure (10 tons rounded up; E would be 8.5).
const BRUNEL_SOURCE = "Historical: Operation Klondike, the armed Brunel Dump Trucks (no record sheet printed)";
const BRUNEL_ARMOR = { armor_type: ["0"], barrating: ["10"], armor_tech_rating: ["3"] };

/**
 * Designs checked and found illegal as printed, by "Name Model" as above: kept, and flagged in the lists with what
 * their construction checks report (NGCFells 2026-11-20: "Leave them, but add an illegal flag"). Only a design
 * checked against its book goes here, so a fault in our own checks never brands a legal design.
 */
export const BLK_ILLEGAL_AS_PRINTED: ReadonlySet<string> = new Set([
    // Both armed Brunels mount their weapons in a 150-ton Large Support Vehicle's 20 item slots (5 + tonnage / 10,
    // TM p.120): three AC/20s take 10 slots each and four LRM 20s 5 each (Support Vehicle column, TM p.136), so 34
    // and 24 slots. Built as Superheavy Combat Vehicles they would fit (one slot a weapon, 35 slots), but the
    // Operation Klondike text describes Support Vehicles.
    "Brunel Dump Truck (AC)",
    "Brunel Dump Truck (LRM)",
    // Ajax Assault Tank C (Record Sheets: 3067 Unabridged): the chassis leaves 42 tons of pod space and fixes the turret
    // at 3.5 tons (TRO 3067 p.27; TM p.108), but the C's targeting computer, MRM 40, four Streak SRM 6s, Guardian ECM,
    // PPC and four tons of ammunition come to 44.5 tons: 92.5 tons on a 90-ton tank.
    "Ajax Assault Tank C",
    // Air Car (MechWarrior, 1st edition, 1986, p.60): a 40-ton hovercraft from the role-playing game's vehicle list, a
    // 265-rated ICE with no fuel and 32 points of plain armor. Under the TechManual's Support Vehicle rules the ICE needs
    // fuel (TM p.128), BAR 10 needs the Armored chassis (TM p.134) and the whole comes to 42.5 tons.
    "Air Car",
    // Both Estevez tanks (Era Digest: Age of War pp.25-26 and the record sheets pp.30-31) print 164 points of BAR 8 at
    // Equipment Rating C, 10.5 tons (64 kg a point, the Advanced Support Vehicle column, TO:AUE p.69); BAR 8 starts at
    // Tech Rating D on a Support Vehicle (TM p.134, errata v8.0).
    "Estevez MBT",
    "Estevez MBT (Anti-Aircraft)",
    // Debbie (Touring the Stars: Tortuga Prime p.10): nine flamers, nine machine guns, an SRM 2 and a combine on an
    // 80-ton chassis's 13 item slots (TM p.120), and BAR 5 armor at Tech Rating B without the Armored chassis it needs
    // there (TM p.134).
    "Debbie 'The Warcrime Wagon'",
    // Both racers (TRO: Vehicle Annex pp.11, 56) print the Ultra-Light chassis with BAR 6 and BAR 8 armor; an
    // Ultra-Light chassis "may not mount armor better than a BAR of 5" (TM p.123).
    "Saturnus V Grande Circuit Racer",
    "Champion Hoversports Crimson Streak Hover Racer",
    // Jonah (TRO: Vehicle Annex p.170): 5 armor points on a 2-ton Naval chassis, whose maximum is 4 + 0.334 x 2 = 4.67,
    // rounded down to 4 (TM p.134). The builder keeps the 4 that fit, which leaves the rear of its Submersible chassis
    // bare.
    "Jonah Submarine JN-002",
    // Combat Vehicles that list a Support Vehicle item or an Inner Sphere armor their tech base cannot take, kept as printed
    // (NGCFells 2026-11-23, Combat Vehicle round); BLK_ILLEGAL_REASONS says what each breaks.
    "Jeep",
    "Nike Air Defense Platform",
    "Huitzilopochtli Assault Tank 'Huey' (AAA)",
    "Eldingar Hover Sled (Streak)",
]);

/** What a design in BLK_ILLEGAL_AS_PRINTED breaks where its own construction checks do not say it (shown beside their findings). */
export const BLK_ILLEGAL_REASONS: Readonly<Record<string, string>> = {
    "Jeep": "Lists the Support Vehicle Off-Road chassis modification on a Combat Vehicle (TM p.134); kept as printed with no effect applied",
    "Nike Air Defense Platform": "Lists the Support Vehicle Armored chassis modification and Advanced Fire Control as items on a Combat Vehicle (TM p.134, TO:AUE p.113); kept as printed with no effect applied",
    "Huitzilopochtli Assault Tank 'Huey' (AAA)": "Clan design printed with Inner Sphere heavy ferro-fibrous armor, which a Clan chassis cannot take; built on a mixed chassis with Inner Sphere armor",
    "Eldingar Hover Sled (Streak)": "Clan design printed with Inner Sphere heavy ferro-fibrous armor, which a Clan chassis cannot take; built on a mixed chassis with Inner Sphere armor",
};

export const BLK_DESIGN_CORRECTIONS: Record<string, IBlkDesignCorrection> = {
    "Brunel Dump Truck (AC)": {
        blocks: { ...BRUNEL_ARMOR, "body equipment": ["IS Ammo MG - Full", "IS Ammo AC/20", "IS Ammo AC/20", "IS Ammo AC/20", "ISOffRoadChassis", "ArmoredChassis"] },
        source: BRUNEL_SOURCE,
    },
    "Brunel Dump Truck (LRM)": {
        blocks: {
            ...BRUNEL_ARMOR,
            "body equipment": ["Basic Fire Control", "ISOffRoadChassis", "ArmoredChassis", "IS Ammo MG - Full",
                "IS Ammo LRM-20", "IS Ammo LRM-20", "IS Ammo LRM-20", "IS Ammo LRM-20", "IS Ammo LRM-20"],
        },
        source: BRUNEL_SOURCE,
    },
    // The NapFind (TRO 3039 p.71, page image): Tech Rating D throughout ("D/X-F-D/C"; the 250 kg chassis and 1,432 kg
    // fuel cell are D's weights), no armor ("Armor Factor (BAR 2): 0") and "Crew: 0", so no seat (TO:AUE p.117). The
    // file gives the structure A, the engine F, a front armor point and a seat.
    "Hi-Scout Drone (NapFind)": {
        blocks: {
            structural_tech_rating: ["3"], engine_tech_rating: ["3"], armor_tech_rating: ["3"], armor: ["0", "0", "0", "0"],
            transporters: ["cargobay:0.015:1:2::-1:0"],
        },
        source: "TRO 3039 p.71",
    },
    // The PathTrack (TRO 3039 p.71): "Crew: 0", no seat; its masses come to the 3,000 kg without one.
    "Hi-Scout Drone (PathTrak)": { blocks: { transporters: [] }, source: "TRO 3039 p.71" },
    // Debbie (Touring the Stars: Tortuga Prime p.10, page image): "Armor Factor (BAR 5, B)" and "Fuel: 1,000km 0.5";
    // the file gives BAR 4 and 2.5 tons of fuel.
    "Debbie 'The Warcrime Wagon'": { blocks: { barrating: ["5"], fuel: ["0.5"] }, source: "Touring the Stars: Tortuga Prime p.10" },
    // Both Estevez tanks: "Armor Factor (BAR 8)" (Era Digest: Age of War p.25) and "BAR: 8" on both record sheets
    // (pp.30-31); the files give standard armor, which reads as BAR 10.
    "Estevez MBT": { blocks: { barrating: ["8"] }, source: "Era Digest: Age of War pp.25, 31" },
    // Buffalo Drone Bomb (XTRO: Succession Wars p.12): "Armor Factor (BAR 5)" and "BAR: 5" on its record sheet; the
    // file gives standard armor, which reads as BAR 10.
    "Buffalo BFFL Drone Bomb": { blocks: { barrating: ["5"] }, source: "XTRO: Succession Wars p.12" },
    // HMRV Salvage Bed (TRO 3075 p.63): "Armor Factor (BAR 8): 244"; the file gives standard armor, which reads as BAR 10.
    "HMRV (Hazardous Materials Recovery Vehicle) Salvage Bed": { blocks: { barrating: ["8"] }, source: "TRO 3075 p.63" },
    "Estevez MBT (Anti-Aircraft)": { blocks: { barrating: ["8"] }, source: "Era Digest: Age of War p.30" },
    // Trireme (CS) (Record Sheets: 3085 Unabridged, Cutting Edge): "BAR: 10" and the Armored chassis, with no armor Tech
    // Rating printed. The file's C has no BAR 10 armor (TM p.134); the chassis is E ("E/X-X-D/E", TRO 3085 Supplemental
    // p.23), and armor "usually does not exceed" the chassis's Tech Rating (TM p.134, errata v8.0), so E.
    "Trireme Infantry Transport (CS)": { blocks: { armor_tech_rating: ["4"] }, source: "Record Sheets: 3085 Unabridged; TRO 3085 Supplemental p.23" },
    // Branth Irregulars, the Aerial Beast Infantry (TRO 3085 p.201): "Armor: Free Worlds League Standard Infantry Kit (3035
    // Issue)", "Armor Divisor: 2", "Cannot conduct Anti-'Mech or Swarming Attacks". The file names the plain kit (divisor 1);
    // the 3035+ kit is the encumbering divisor 2 one (TO:AUE p.130).
    // HALO Paratrooper, Lyran Paratrooper Corps (TRO 3085 p.202): "18 Mauser & Gray G-150 Rifles", "3 Heavy Recoilless Rifles",
    // 21 (7/3), Foot (Paratroopers). Paratroops carry one secondary weapon a squad (TO:AUE p.153, every printing); the file
    // has two.
    "HALO Paratrooper Lyran Paratrooper Corps": { blocks: { secondn: ["1"] }, source: "TRO 3085 p.202" },
    // Svartalfa Ultra ProtoMech (TRO: Prototypes p.91, page image): "Armor Factor 65", Head 9, Torso 23, R/L Arm 6/6, Legs 14,
    // Main Gun 7, and "Battle Value: 540". The file gives 64: legs 15 and main gun 5.
    "Svartalfa": { blocks: { armor: ["9", "23", "6", "6", "14", "7"] }, source: "TRO: Prototypes p.91" },
    "Beast Infantry (Aerial)": { blocks: { "troopers equipment": ["Free Worlds League Infantry Kit (3035+)"], encumberingarmor: ["true"] }, source: "TRO 3085 p.201" },
};
