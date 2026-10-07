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

/**
 * Editions of the BattleTech rules, oldest first. A record's `introducedInEdition` names the first edition whose
 * rules include it, so a player can later choose to build and play with one edition's rules only.
 *
 * Reserved for that feature (roadmap: "select a rules version"); nothing filters on it yet, and no record is
 * tagged with an earlier edition until its entry has been checked against that edition's rulebook.
 *
 * The list is the line of core rulebooks, each of which replaced the one before it. The Core Rulebook's
 * designer's notes (CRB p.247) give that line and its years for 1987 to 2001 and date the Second Edition box
 * set to 1985; the other years are the copyright dates on the books' own credits pages. The Third Edition (1992)
 * and Fourth Edition (1996) box sets are not listed: they are the introductory game sold beside the reference
 * rulebook of the day (Master Rules, introduction: "The introductory game in the BattleTech line is the
 * BattleTech, Fourth Edition boxed set"), not steps in the line. Add or change an entry only from a cited book,
 * never from memory.
 */
export interface IRulesEdition {
    /** Stable id stored on records and in saves. */
    tag: string;
    name: string;
    /** First publication year of the edition's core rulebook. */
    year: number;
    /** The core rulebook, by the abbreviation used in record citations. */
    book: string;
}

export const btRulesEditions: IRulesEdition[] = [
    {
        // Battledroids, the game's first edition: credits page, "Copyright 1984 FASA Corporation".
        tag: "battledroids",
        name: "Battledroids",
        year: 1984,
        book: "BD",
    },
    {
        // BattleTech, Second Edition box set: "that 1985 box set" (CRB p.247).
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
        // BattleTech Compendium: The Rules of Warfare: CRB p.247.
        tag: "compendium-rules-of-warfare",
        name: "BattleTech Compendium: The Rules of Warfare",
        year: 1994,
        book: "BTC:RoW",
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

/** A record's first edition: its own `introducedInEdition`, or the default when it has none. */
export function getIntroducedInEdition(record: { introducedInEdition?: string }): string {
    return record.introducedInEdition ?? DEFAULT_RULES_EDITION;
}

/**
 * Do the rules of `editionTag` include this record? True when the record's first edition is that edition or an
 * earlier one. An edition tag that is not in the list never matches.
 */
export function isInRulesEdition(record: { introducedInEdition?: string }, editionTag: string = DEFAULT_RULES_EDITION): boolean {
    const order = (tag: string) => btRulesEditions.findIndex(edition => edition.tag === tag);
    const introduced = order(getIntroducedInEdition(record));
    const selected = order(editionTag);
    return introduced >= 0 && selected >= 0 && introduced <= selected;
}
