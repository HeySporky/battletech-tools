import type { Campaign } from "./campaign";

/*
 * Shared by the unit editions (Mercenary's Handbook 1987 and 3055): quality, range tables, dice and the unit's side.
 */

export type Quality = "green" | "regular" | "veteran" | "elite";

export const QUALITIES: Quality[] = ["green", "regular", "veteran", "elite"];

export const QUALITY_LABELS: Record<Quality, string> = { green: "Green", regular: "Regular", veteran: "Veteran", elite: "Elite" };

/** A printed range table as `[highest number in the row, value]`, rows in ascending order. */
export type RangeTable<T> = [number, T][];

/** The first row whose upper bound is at or above `n`; below the table reads the first row, above it the last. */
export function rangeLookup<T>( table: RangeTable<T>, n: number ): T {
    for( const [max, value] of table ) {
        if( n <= max ) return value;
    }
    return table[table.length - 1][1];
}

/** The dice a unit edition rolls; the screens pass the campaign dice, tests pass fixed rolls. */
export interface ICampaignRoll {
    d6(): number;
    twoD6(): number;
}

/** A queue of fixed rolls (tests and the worked examples): d6 and twoD6 take the next number. */
export const fixedRolls = ( rolls: number[] ): ICampaignRoll => {
    const queue = [...rolls];
    const next = (): number => {
        const roll = queue.shift();
        if( roll === undefined ) throw new Error( "Out of fixed rolls" );
        return roll;
    };
    return { d6: next, twoD6: next };
}

/** The side the unit edition books its money to: the chosen side when it still exists, else the first side. */
export const unitSideId = ( c: Campaign, sideId: string | null ): string | null =>
    sideId && c.sides.some( ( s ) => s.id === sideId ) ? sideId : c.sides[0]?.id ?? null;

export const isQuality = ( v: unknown ): v is Quality => QUALITIES.includes( v as Quality );

/** A whole number in [min, max], or the fallback. */
export const clampInt = ( v: unknown, min: number, max: number, fallback: number ): number =>
    typeof v === "number" && isFinite( v ) ? Math.min( max, Math.max( min, Math.round( v ) ) ) : fallback;
