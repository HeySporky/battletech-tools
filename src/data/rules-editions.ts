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
 * Reserved for that feature (roadmap: "select a rules version"); nothing filters on it yet. Only the edition
 * the catalogs are written against is listed. Add an older edition here, in order, once its rulebook is in the
 * local library and its year and contents can be cited; never from memory.
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
        // Total Warfare, ©2006 (first printing), with TechManual, Tactical Operations, Strategic Operations and
        // Interstellar Operations: the rules line every catalog record cites.
        tag: "total-warfare",
        name: "Total Warfare",
        year: 2006,
        book: "TW",
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
