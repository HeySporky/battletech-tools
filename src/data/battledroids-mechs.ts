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

import { APOCRYPHAL_RULES_LEVEL, CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";

/** A location on a printed record listing, by the creator's location code. */
export type PrintedDroidLocation = "hd" | "ct" | "lt" | "rt" | "la" | "ra" | "ll" | "rl";

/**
 * A droid as a Battledroids-era record listing prints it: the book's ten, the SPI-5R Spider of Game News #3 and the
 * TCI kit-back sheets. Every figure is as printed; corrections and anything that does not add up are in `notes`.
 */
export interface IPrintedDroid {
    id: string;
    model: string;
    name: string;
    /** The lowest rules level that lists it: 0 for the book's droids, Apocryphal for the rest. */
    rulesLevel: number;
    source: string;
    page?: number;
    /** The model kit whose box carried the sheet. */
    kit?: string;
    /** No sheet has been found: the figures stand in from the book's listing of the same 'Mech. */
    inferred?: boolean;
    mechType: "biped" | "quad";
    tonnage: number;
    /** The engine rating printed; the creator builds the engine from tonnage and Walking MP. */
    engineRating: number;
    walk: number;
    jump: number;
    heatSinks: number;
    /** Armor boxes by location; sides, arms and legs are printed once for both. On a quad, "arm" is the front legs. */
    armor: { head: number; centerTorso: number; centerTorsoRear: number; sideTorso: number; sideTorsoRear: number; arm: number; leg: number };
    /** The sheet's Armor Factor, even where the locations add up to something else. */
    printedArmorFactor: number;
    /** One entry per item; each ammunition line is one ton per critical box printed. */
    equipment: { tag: string; location: PrintedDroidLocation; rear?: boolean }[];
    notes: string[];
}

const items = (count: number, tag: string, location: PrintedDroidLocation, rear?: boolean) =>
    Array.from({ length: count }, () => (rear ? { tag, location, rear } : { tag, location }));

const TCI = "TCI kit back (FASA 1984)";

// The SHD-2H and GRF-1N as BD p.16 prints them, for the two kits whose sheets have not been found.
const shadowHawk2H: Pick<IPrintedDroid, "tonnage" | "engineRating" | "walk" | "jump" | "heatSinks" | "armor" | "printedArmorFactor" | "equipment"> = {
    tonnage: 55, engineRating: 275, walk: 5, jump: 3, heatSinks: 12,
    armor: { head: 9, centerTorso: 23, centerTorsoRear: 8, sideTorso: 18, sideTorsoRear: 6, arm: 16, leg: 16 },
    printedArmorFactor: 152,
    equipment: [
        ...items(1, "autocannon-standard-b", "lt"), ...items(1, "ammo-is-ac-5-standard", "lt"), ...items(1, "lrm-5", "rt"),
        ...items(1, "ammo-lrm-standard", "lt"), ...items(1, "medium-laser", "ra"), ...items(1, "srm-2", "hd"),
        ...items(1, "ammo-srm-standard", "lt"),
    ],
};
const griffin1N: typeof shadowHawk2H = {
    tonnage: 55, engineRating: 275, walk: 5, jump: 6, heatSinks: 12,
    armor: { head: 8, centerTorso: 20, centerTorsoRear: 6, sideTorso: 20, sideTorsoRear: 6, arm: 13, leg: 16 },
    printedArmorFactor: 144,
    equipment: [...items(1, "standard-ppc", "ra"), ...items(1, "lrm-10", "rt"), ...items(2, "ammo-lrm-standard", "rt")],
};

const wolverine = (id: string, model: string, kit: string): IPrintedDroid => ({
    id, model, name: "Wolverine", rulesLevel: APOCRYPHAL_RULES_LEVEL, source: TCI, kit, mechType: "biped",
    tonnage: 55, engineRating: 275, walk: 5, jump: 5, heatSinks: 12,
    armor: { head: 8, centerTorso: 24, centerTorsoRear: 8, sideTorso: 20, sideTorsoRear: 6, arm: 16, leg: 16 },
    printedArmorFactor: 168,
    equipment: [
        ...items(3, "srm-2", "lt"), ...items(1, "ammo-srm-standard", "lt"), ...items(1, "autocannon-standard-b", "ra"),
        ...items(1, "ammo-is-ac-5-standard", "rt"), ...items(1, "medium-laser", "hd"),
    ],
    notes: [
        "The locations add up to 156 armor boxes against the printed Armor Factor of 168; it is not clear which is wrong, so both are as printed (flagged).",
        "With the printed Armor Factor of 168 (10.5 tons), the sheet comes to 56 tons, a ton over.",
        "The T-10B and T-10C Blockhead sheets print the same figures; the model codes WLV-3Nb and WLV-3Nc tell them apart here.",
    ],
});

export const battledroidsPrintedDroids: IPrintedDroid[] = [
    // BD p.16 (STG-3R, GRF-1N, ARC-2R, SHD-2H, WHM-6R) and p.17 (PXH-1K, WSP-1A, CRD-3R, MAD-3R, RFL-3N).
    {
        id: "stg-3r", model: "STG-3R", name: "Stinger", rulesLevel: 0, source: "BD", page: 16, mechType: "biped",
        tonnage: 20, engineRating: 120, walk: 6, jump: 6, heatSinks: 10,
        armor: { head: 9, centerTorso: 10, centerTorsoRear: 4, sideTorso: 7, sideTorsoRear: 2, arm: 6, leg: 8 },
        printedArmorFactor: 64,
        equipment: [
            ...items(1, "medium-laser", "ra"), ...items(1, "machine-gun", "ra"), ...items(1, "machine-gun", "la"),
            ...items(1, "ammo-machine-gun-standard", "ct"),
        ],
        notes: [
            "The locations add up to 69 armor boxes against the printed Armor Factor of 64 (4 tons); both are as printed (flagged).",
            "The tons column adds up to 21, a ton over, as printed.",
        ],
    },
    {
        id: "wsp-1a", model: "WSP-1A", name: "Wasp", rulesLevel: 0, source: "BD", page: 17, mechType: "biped",
        tonnage: 20, engineRating: 120, walk: 6, jump: 6, heatSinks: 10,
        armor: { head: 6, centerTorso: 10, centerTorsoRear: 4, sideTorso: 7, sideTorsoRear: 2, arm: 6, leg: 7 },
        printedArmorFactor: 64,
        equipment: [...items(1, "medium-laser", "ra"), ...items(1, "srm-2", "ll"), ...items(1, "ammo-srm-standard", "ct")],
        notes: ["The tons column adds up to 21, a ton over, as printed."],
    },
    {
        id: "pxh-1k", model: "PXH-1K", name: "Phoenix Hawk", rulesLevel: 0, source: "BD", page: 17, mechType: "biped",
        tonnage: 45, engineRating: 270, walk: 6, jump: 6, heatSinks: 10,
        armor: { head: 6, centerTorso: 25, centerTorsoRear: 5, sideTorso: 18, sideTorsoRear: 3, arm: 10, leg: 15 },
        printedArmorFactor: 128,
        equipment: [
            ...items(1, "large-laser", "ra"), ...items(1, "medium-laser", "ra"), ...items(1, "medium-laser", "la"),
            ...items(1, "machine-gun", "ra"), ...items(1, "machine-gun", "la"), ...items(1, "ammo-machine-gun-standard", "ct"),
        ],
        notes: [],
    },
    { id: "grf-1n", model: "GRF-1N", name: "Griffin", rulesLevel: 0, source: "BD", page: 16, mechType: "biped", ...griffin1N, notes: [] },
    { id: "shd-2h", model: "SHD-2H", name: "Shadow Hawk", rulesLevel: 0, source: "BD", page: 16, mechType: "biped", ...shadowHawk2H, notes: [] },
    {
        id: "rfl-3n", model: "RFL-3N", name: "Rifleman", rulesLevel: 0, source: "BD", page: 17, mechType: "biped",
        tonnage: 60, engineRating: 260, walk: 4, jump: 0, heatSinks: 10,
        armor: { head: 6, centerTorso: 22, centerTorsoRear: 4, sideTorso: 15, sideTorsoRear: 2, arm: 15, leg: 12 },
        printedArmorFactor: 120,
        equipment: [
            ...items(1, "large-laser", "ra"), ...items(1, "large-laser", "la"), ...items(1, "autocannon-standard-b", "ra"),
            ...items(1, "autocannon-standard-b", "la"), ...items(1, "ammo-is-ac-5-standard", "ct"),
        ],
        notes: [
            "The engine is printed as a VOX 260 (13.5 tons), larger than the 240 that 4 Walking MP on 60 tons needs; the creator builds the 240, so it weighs less than the sheet's 60 tons.",
        ],
    },
    {
        id: "crd-3r", model: "CRD-3R", name: "Crusader", rulesLevel: 0, source: "BD", page: 17, mechType: "biped",
        tonnage: 65, engineRating: 260, walk: 4, jump: 0, heatSinks: 10,
        armor: { head: 6, centerTorso: 30, centerTorsoRear: 8, sideTorso: 24, sideTorsoRear: 6, arm: 20, leg: 20 },
        printedArmorFactor: 184,
        equipment: [
            ...items(1, "lrm-15", "ra"), ...items(1, "lrm-15", "la"), ...items(1, "ammo-lrm-standard", "rt"),
            ...items(1, "ammo-lrm-standard", "lt"), ...items(1, "srm-6", "rl"), ...items(1, "srm-6", "ll"),
            ...items(1, "ammo-srm-standard", "ct"), ...items(1, "medium-laser", "ra"), ...items(1, "medium-laser", "la"),
            ...items(1, "machine-gun", "ra"), ...items(1, "machine-gun", "la"), ...items(1, "ammo-machine-gun-standard", "ct"),
        ],
        notes: ["The tons column adds up to 64.5, half a ton under, as printed."],
    },
    {
        id: "arc-2r", model: "ARC-2R", name: "Archer", rulesLevel: 0, source: "BD", page: 16, mechType: "biped",
        tonnage: 70, engineRating: 280, walk: 4, jump: 0, heatSinks: 10,
        armor: { head: 9, centerTorso: 35, centerTorsoRear: 10, sideTorso: 30, sideTorsoRear: 7, arm: 15, leg: 25 },
        printedArmorFactor: 208,
        equipment: [
            ...items(1, "lrm-20", "rt"), ...items(1, "lrm-20", "lt"), ...items(2, "ammo-lrm-standard", "rt"),
            ...items(2, "ammo-lrm-standard", "lt"), ...items(1, "medium-laser", "ra"), ...items(1, "medium-laser", "la"),
            ...items(2, "medium-laser", "ct", true),
        ],
        notes: [],
    },
    {
        id: "whm-6r", model: "WHM-6R", name: "Warhammer", rulesLevel: 0, source: "BD", page: 16, mechType: "biped",
        tonnage: 70, engineRating: 280, walk: 4, jump: 0, heatSinks: 18,
        armor: { head: 9, centerTorso: 22, centerTorsoRear: 9, sideTorso: 17, sideTorsoRear: 8, arm: 20, leg: 15 },
        printedArmorFactor: 160,
        equipment: [
            ...items(1, "standard-ppc", "la"), ...items(1, "standard-ppc", "ra"), ...items(1, "srm-6", "rt"),
            ...items(1, "ammo-srm-standard", "rt"), ...items(1, "medium-laser", "rt"), ...items(1, "medium-laser", "lt"),
            ...items(1, "small-laser", "rt"), ...items(1, "small-laser", "lt"), ...items(1, "machine-gun", "rt"),
            ...items(1, "machine-gun", "lt"), ...items(1, "ammo-machine-gun-standard", "ct"),
        ],
        notes: [],
    },
    {
        id: "mad-3r", model: "MAD-3R", name: "Marauder", rulesLevel: 0, source: "BD", page: 17, mechType: "biped",
        tonnage: 75, engineRating: 300, walk: 4, jump: 0, heatSinks: 16,
        armor: { head: 9, centerTorso: 35, centerTorsoRear: 16, sideTorso: 16, sideTorsoRear: 8, arm: 22, leg: 16 },
        printedArmorFactor: 184,
        equipment: [
            ...items(1, "standard-ppc", "ra"), ...items(1, "standard-ppc", "la"), ...items(1, "medium-laser", "ra"),
            ...items(1, "medium-laser", "la"), ...items(1, "autocannon-standard-b", "rt"), ...items(1, "ammo-is-ac-5-standard", "lt"),
        ],
        notes: [],
    },
    {
        id: "spi-5r", model: "SPI-5R", name: "Spider", rulesLevel: APOCRYPHAL_RULES_LEVEL,
        source: "Game News #3 (May 1985)", page: 13, mechType: "biped",
        tonnage: 30, engineRating: 180, walk: 6, jump: 8, heatSinks: 13,
        armor: { head: 6, centerTorso: 10, centerTorsoRear: 4, sideTorso: 6, sideTorsoRear: 2, arm: 7, leg: 7 },
        printedArmorFactor: 64,
        equipment: [
            ...items(1, "medium-laser", "hd"), ...items(1, "medium-laser", "ct"), ...items(1, "medium-laser", "ra"),
            ...items(1, "medium-laser", "la"),
        ],
        notes: [
            "\"New Battledroid\", Game News #3 pp.12-13: not the canon SDR-5V Spider; its model code, head-mounted laser and background are the magazine's.",
        ],
    },
    {
        id: "gol-1h", model: "GOL-1H", name: "Goliath", rulesLevel: APOCRYPHAL_RULES_LEVEL, source: TCI,
        kit: "Abitate F44A Crabgunner", mechType: "quad",
        tonnage: 80, engineRating: 320, walk: 4, jump: 0, heatSinks: 13,
        armor: { head: 12, centerTorso: 50, centerTorsoRear: 40, sideTorso: 30, sideTorsoRear: 27, arm: 20, leg: 20 },
        printedArmorFactor: 296,
        equipment: [
            ...items(1, "standard-ppc", "ct"), ...items(1, "lrm-10", "rt"), ...items(1, "lrm-10", "lt"),
            ...items(2, "ammo-lrm-standard", "ct"), ...items(2, "machine-gun", "ct"), ...items(1, "ammo-machine-gun-standard", "ct"),
        ],
        notes: [
            "Special Rules-Four Legged Walkers: Treat All Arm and Arm Critical Hits As Leg Hits and Leg Criticals. Four Legged walkers May Do No Jumping or Punching. Four legged walkers also get a Bonus of -3 on the falling and Standing Table.",
            "The sheet has no cockpit line; the cockpit is the standard 3 tons. Its \"Rt/Lt Arm\" armor is the front legs'.",
            "The four-legged layout is not in Battledroids: it needs the Apocryphal level under this edition.",
            "The sheet lists 8 critical boxes of weapons and ammunition in the center torso, which holds 2 beside the engine and gyro here: the PPC, the machine guns and their ammunition stay unallocated, listed in the center torso.",
        ],
    },
    wolverine("wlv-3nb", "WLV-3Nb", "Abitate T-10B Blockhead"),
    wolverine("wlv-3nc", "WLV-3Nc", "Abitate T-10C Blockhead"),
    {
        id: "grf-2n", model: "GRF-2N", name: "Griffin", rulesLevel: APOCRYPHAL_RULES_LEVEL, source: TCI,
        kit: "Soltic H8 Round Facer", mechType: "biped",
        ...griffin1N,
        heatSinks: 13,
        notes: [
            "The sheet prints 7 for the head; the GRF-1N's 8 (BD p.16) makes the printed Armor Factor of 144, so the head is entered as 8.",
            "13 heat sinks as printed (the GRF-1N has 12): the 13th makes it 56 tons, a ton over, as the book's own STG-3R and WSP-1A are (flagged).",
        ],
    },
    {
        id: "shd-3h", model: "SHD-3H", name: "Shadow Hawk", rulesLevel: APOCRYPHAL_RULES_LEVEL, source: TCI,
        kit: "Dougram", mechType: "biped",
        ...shadowHawk2H,
        equipment: [
            ...items(1, "autocannon-standard-b", "lt"), ...items(1, "ammo-is-ac-5-standard", "lt"), ...items(1, "lrm-5", "rt"),
            ...items(1, "ammo-lrm-standard", "lt"), ...items(1, "medium-laser", "ra"), ...items(1, "machine-gun", "hd"),
            ...items(1, "ammo-machine-gun-standard", "lt"),
        ],
        notes: [
            "The head armor is blank on the sheet; the other locations make 143 of the printed 152, and the SHD-2H's head is 9 (BD p.16), so it is entered as 9.",
            "The SHD-2H with a machine gun and 200 rounds in place of the head SRM 2 and its ammunition: 54.5 tons, half a ton under.",
        ],
    },
    {
        id: "thn-8t", model: "THN-8T", name: "Thunderbolt", rulesLevel: APOCRYPHAL_RULES_LEVEL, source: TCI,
        kit: "Hasty F4X Ironfoot", mechType: "biped",
        tonnage: 65, engineRating: 260, walk: 4, jump: 0, heatSinks: 15,
        armor: { head: 9, centerTorso: 30, centerTorsoRear: 11, sideTorso: 24, sideTorsoRear: 6, arm: 20, leg: 29 },
        printedArmorFactor: 208,
        equipment: [
            ...items(1, "lrm-15", "lt"), ...items(2, "ammo-lrm-standard", "rt"), ...items(1, "large-laser", "ra"),
            ...items(2, "medium-laser", "lt"), ...items(1, "srm-2", "rt"), ...items(1, "ammo-srm-standard", "rt"),
            ...items(2, "machine-gun", "rt", true), ...items(1, "ammo-machine-gun-standard", "rt"),
        ],
        notes: [
            "\"2 M. Laser\" in the left torso with 3 critical boxes: two medium lasers as printed (user ruling, 2026-10-16), though the boxes fit three.",
            "64 tons as printed, a ton under.",
        ],
    },
    {
        id: "btl-5r", model: "BTL-5R", name: "BattleMaster", rulesLevel: APOCRYPHAL_RULES_LEVEL, source: TCI,
        kit: "Soltic HT-128 Bigfoot", mechType: "biped",
        tonnage: 85, engineRating: 340, walk: 4, jump: 0, heatSinks: 18,
        armor: { head: 9, centerTorso: 40, centerTorsoRear: 11, sideTorso: 28, sideTorsoRear: 8, arm: 24, leg: 26 },
        printedArmorFactor: 232,
        equipment: [
            ...items(1, "standard-ppc", "ra"), ...items(3, "srm-2", "lt"), ...items(1, "ammo-srm-standard", "lt"),
            ...items(2, "medium-laser", "lt"), ...items(2, "medium-laser", "rt"), ...items(2, "machine-gun", "la"),
            ...items(1, "ammo-machine-gun-standard", "la"), ...items(1, "medium-laser", "lt", true),
            ...items(1, "medium-laser", "rt", true),
        ],
        notes: [
            "\"2 M.G.\" in the left arm with 1 critical box: two machine guns as printed (flagged).",
            "84 tons as printed, a ton under.",
        ],
    },
    {
        id: "shd-2h-jakt", model: "SHD-2H", name: "Shadow Hawk (Dougram Jakt-type kit)", rulesLevel: APOCRYPHAL_RULES_LEVEL,
        source: TCI, kit: "Dougram Jakt-type", inferred: true, mechType: "biped",
        ...shadowHawk2H,
        notes: [
            "Sheet not found: inferred from the SHD-2H of BD p.16 (the MG kit, SHD-3H, is the one that departs from the book). Replace with the sheet when a photograph turns up.",
        ],
    },
    {
        id: "grf-1n-soltic-h8", model: "GRF-1N", name: "Griffin (Soltic H8 kit)", rulesLevel: APOCRYPHAL_RULES_LEVEL,
        source: TCI, kit: "Soltic H8", inferred: true, mechType: "biped",
        ...griffin1N,
        notes: [
            "Sheet not found: inferred from the GRF-1N of BD p.16 (the Round Facer kit's sheet is the GRF-2N). Replace with the sheet when a photograph turns up.",
        ],
    },
    // The user's conversions of canon designs whose Ral Partha miniatures were sold in Battledroids blister packs
    // (user, 2026-10-16), corrected to the book's rules: armor within twice the internal structure and in half tons
    // (BD pp.24-25), a ton of ammunition for each weapon that uses it (BD p.25), heat sinks for the weapons' heat,
    // then the rest of the tonnage in armor.
    {
        id: "fle-15", model: "FLE-15", name: "Flea", rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL, source: "Ral Partha Battledroids miniature; statistics by the user (2026-10-16)", mechType: "biped",
        tonnage: 15, engineRating: 150, walk: 10, jump: 0, heatSinks: 10,
        armor: { head: 3, centerTorso: 6, centerTorsoRear: 1, sideTorso: 4, sideTorsoRear: 1, arm: 3, leg: 3 },
        printedArmorFactor: 32,
        equipment: [...items(1, "small-laser", "ra"), ...items(1, "small-laser", "la")],
        notes: [
            "Listed with 38 armor points in locations adding up to 46; a 15-ton droid has 2 tons left for armor, so 32 points, shared out in the listing's proportions.",
        ],
    },
    {
        id: "fs9-h", model: "FS9-H", name: "Firestarter", rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL, source: "Ral Partha Battledroids miniature; statistics by the user (2026-10-16)", mechType: "biped",
        tonnage: 35, engineRating: 210, walk: 6, jump: 0, heatSinks: 11,
        armor: { head: 8, centerTorso: 18, centerTorsoRear: 4, sideTorso: 12, sideTorsoRear: 2, arm: 12, leg: 11 },
        printedArmorFactor: 104,
        equipment: [
            ...items(1, "medium-laser", "rt"), ...items(1, "medium-laser", "lt"), ...items(1, "standard-flamer", "ra"),
            ...items(1, "standard-flamer", "la"), ...items(1, "standard-flamer", "rt"), ...items(1, "standard-flamer", "lt"),
            ...items(1, "machine-gun", "hd"), ...items(1, "machine-gun", "ct"), ...items(1, "ammo-machine-gun-standard", "ct"),
            ...items(1, "ammo-machine-gun-standard", "lt"),
        ],
        notes: [
            "Listed with 70 armor points in locations adding up to 90; the 90 are kept and the 1.5 tons left over go to an 11th heat sink and 8 more armor points (arms 12, legs 11).",
            "Two tons of machine gun ammunition, one for each machine gun (BD p.25), in place of the listing's 10 rounds each; the second is in the left torso, as the center torso is full.",
            "Full fire makes 18 heat against 11 heat sinks.",
        ],
    },
    {
        id: "bkx-7k", model: "BKX-7K", name: "Battleaxe", rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL, source: "Ral Partha Battledroids miniature; statistics by the user (2026-10-16)", mechType: "biped",
        tonnage: 70, engineRating: 280, walk: 4, jump: 0, heatSinks: 15,
        armor: { head: 9, centerTorso: 33, centerTorsoRear: 10, sideTorso: 22, sideTorsoRear: 8, arm: 22, leg: 30 },
        printedArmorFactor: 216,
        equipment: [
            ...items(1, "large-laser", "ra"), ...items(1, "autocannon-standard-b", "la"), ...items(1, "ammo-is-ac-5-standard", "lt"),
            ...items(1, "srm-6", "rt"), ...items(1, "srm-6", "lt"), ...items(1, "ammo-srm-standard", "rt"),
            ...items(1, "ammo-srm-standard", "lt"),
        ],
        notes: [
            "Ral Partha blister 20-811. The listing's Autocannon/10 is the book's Auto Cannon (user, 2026-10-16), with a ton of its ammunition and a ton for each SRM 6 (BD p.25).",
            "The listing's 133 armor points left 10.5 tons unspent: three more heat sinks cover full fire (13 heat), armor goes to its limit (216 points, 13.5 tons) and two more heat sinks take the rest. 69.5 tons, half a ton under, since armor comes in half tons and is at its limit.",
        ],
    },
    {
        id: "lct-1v", model: "LCT-1V", name: "Locust", rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL, source: "Ral Partha Battledroids miniature; statistics by the user (2026-10-16)", mechType: "biped",
        tonnage: 20, engineRating: 160, walk: 8, jump: 0, heatSinks: 10,
        armor: { head: 4, centerTorso: 10, centerTorsoRear: 2, sideTorso: 6, sideTorsoRear: 1, arm: 4, leg: 5 },
        printedArmorFactor: 48,
        equipment: [
            ...items(1, "medium-laser", "ct"), ...items(1, "machine-gun", "ra"), ...items(1, "machine-gun", "la"),
            ...items(1, "ammo-machine-gun-standard", "ct"), ...items(1, "ammo-machine-gun-standard", "lt"),
        ],
        notes: [
            "Ral Partha blister 20-844. The listing's 50 armor points need 3.5 tons and the droid has 3 left, so the center torso front goes from 12 to 10: 48 points.",
            "Two tons of machine gun ammunition, one for each machine gun (BD p.25), in place of the listing's 10 rounds each; the second is in the left torso, as the center torso is full.",
        ],
    },
];

/** The printed droids a player may choose at this rules level. */
export function getPrintedDroids(rulesLevel: number): IPrintedDroid[] {
    return battledroidsPrintedDroids.filter(droid => droid.rulesLevel <= rulesLevel);
}

export function getPrintedDroid(id: string | undefined): IPrintedDroid | undefined {
    return battledroidsPrintedDroids.find(droid => droid.id === id);
}

/** Whether the rules edition prints droids a player can choose from (only Battledroids so far). */
export function editionHasPrintedDroids(editionTag: string | undefined): boolean {
    return editionTag === "battledroids";
}
