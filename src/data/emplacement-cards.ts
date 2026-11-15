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

// The three gun emplacements on the Battlefield Support cards in the BattleTech: Aces - Scouring Sands box (#191). The
// MUL does not list them, so they ride in the shared custom unit list as type BD, the way the cards print them. Read
// from photos of the cards that Rekikire sent (2026-11). Every card: TP BD, SZ -, TMM 0, MV 0", Role None; critical
// hits are Weapon Hits, -1 damage each (Aces p.6).

export interface IEmplacementCard {
    /** The MUL-style key, after CUSTOM-. */
    key: string;
    name: string;
    /** The guns, printed before the name on the card: "(3x AC/2) Light Emplacement". */
    variant: string;
    pointValue: number;
    armor: number;
    structure: number;
    damage: [string, string, string];
    abilities: string[];
    /** The card's number in the box, "29/42". */
    cardNumber: string;
}

export const EMPLACEMENT_CARDS: IEmplacementCard[] = [
    {
        key: "EMPLACEMENT-LIGHT", name: "Light Emplacement", variant: "3x AC/2", pointValue: 9,
        armor: 3, structure: 3, damage: ["0*", "1", "1"], abilities: ["CF3", "IMMOBILE"], cardNumber: "29/42",
    },
    {
        key: "EMPLACEMENT-MEDIUM", name: "Medium Emplacement", variant: "2x AC/5", pointValue: 10,
        armor: 4, structure: 4, damage: ["1", "1", "1"], abilities: ["AC1/1/1", "CF4", "IMMOBILE"], cardNumber: "30/42",
    },
    {
        key: "EMPLACEMENT-HEAVY", name: "Heavy Emplacement", variant: "AC/20", pointValue: 15,
        armor: 6, structure: 6, damage: ["2", "2", "0"], abilities: ["AC2/2/0", "CF6", "IMMOBILE"], cardNumber: "37/42",
    },
];

/** An emplacement's name as the unit list shows it: "Heavy Emplacement AC/20". */
export function getEmplacementDisplayName(card: IEmplacementCard): string {
    return `${card.name} ${card.variant}`;
}
