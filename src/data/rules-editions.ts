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
    },
    {
        // The BattleTech Manual: The Rules of Warfare: credits page, "Copyright 1987"; CRB p.247.
        tag: "battletech-manual",
        name: "The BattleTech Manual",
        year: 1987,
        book: "BTM",
    },
    {
        // The BattleTech Compendium (FASA 1640): credits page, "Copyright 1990 FASA Corporation"; CRB p.247.
        tag: "battletech-compendium",
        name: "The BattleTech Compendium",
        year: 1990,
        book: "BTC",
    },
    {
        // BattleTech, Third Edition box set: rulebook credits page, "Copyright 1992 FASA Corporation".
        tag: "battletech-3rd-edition",
        name: "BattleTech, Third Edition",
        year: 1992,
        book: "BT3",
    },
    {
        // BattleTech Compendium: The Rules of Warfare: CRB p.247.
        tag: "compendium-rules-of-warfare",
        name: "BattleTech Compendium: The Rules of Warfare",
        year: 1994,
        book: "BTC:RoW",
    },
    {
        // BattleTech, Fourth Edition box set: rulebook credits page, "4th Edition Revision", "Copyright 1996
        // FASA Corporation".
        tag: "battletech-4th-edition",
        name: "BattleTech, Fourth Edition",
        year: 1996,
        book: "BT4",
    },
    {
        // BattleTech Master Rules (FASA 1707): back cover, "Copyright 1998 FASA Corporation"; CRB p.247.
        tag: "master-rules",
        name: "BattleTech Master Rules",
        year: 1998,
        book: "BMR",
    },
    {
        // Classic BattleTech Master Rules, Revised Edition (FanPro 35000): credits page, "2001-2005 WizKids";
        // CRB p.247.
        tag: "master-rules-revised",
        name: "BattleTech Master Rules, Revised Edition",
        year: 2001,
        book: "BMR(R)",
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
