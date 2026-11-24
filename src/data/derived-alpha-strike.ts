import { IEquipmentItem } from "./data-interfaces";

/*
 * Alpha Strike values for a weapon whose record has none, by the conversion the canon weapons follow (checked against them in
 * derived-alpha-strike.test.ts, which prints how many it reproduces): each range bracket's damage is the weapon's expected damage divided by 10,
 * a bracket is reached when the weapon's long range reaches into it, a minimum range cuts the short bracket, and a cluster weapon's expected damage is
 * its hits on a roll of 7 times the damage of each. Heat is the weapon's heat. A weapon that is not direct fire has no targeting computer bonus.
 */

/** Hits on a roll of 7 on the Cluster Hits Table, by number of missiles or groups (0 to 20). */
export const CLUSTER_HITS_ON_7: number[] = [0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12];

/** The hexes of reach a weapon needs for a bracket's damage: short from 1, medium from 4, long from 16, extreme from 24. */
export const BRACKET_REACH = { short: 1, medium: 4, long: 16, extreme: 24 } as const;

/** What a minimum range does to the short bracket's damage: 1 less a twelfth for each hex of it, to a quarter (min 1 medium rifle .92, 3 PPC .75, 4 AC/2 .66, 6 LRM .5, 10 extended LRM about .28). */
export const shortRangeFactor = (minimum: number): number => Math.max(0.25, 1 - minimum / 12);

export interface IAlphaStrikeValues { heat: number; rangeShort: number; rangeMedium: number; rangeLong: number; rangeExtreme: number }

const round3 = (value: number): number => Math.round(value * 1000) / 1000;

/** Expected damage at each bracket, in Total Warfare points. */
function bracketDamage(item: IEquipmentItem): { short: number; medium: number; long: number; extreme: number } {
    const damage = item.damage;
    if ((item.damageClusters ?? 0) > 0 && (item.damagePerCluster ?? 0) > 0) {
        const expected = (CLUSTER_HITS_ON_7[item.damageClusters!] ?? item.damageClusters!) * item.damagePerCluster!;
        return { short: expected, medium: expected, long: expected, extreme: expected };
    }
    if (typeof damage === "number") return { short: damage, medium: damage, long: damage, extreme: damage };
    if (damage) return { short: damage.short ?? 0, medium: damage.medium ?? 0, long: damage.long ?? 0, extreme: damage.long ?? 0 };
    return { short: 0, medium: 0, long: 0, extreme: 0 };
}

/** Weapons the conversion does not cover: long-range missiles and mortars (their short bracket halves for reasons of their own), arrays, tasers, anti-missile systems and artillery. */
const NOT_CONVERTED = /lrm|lrt|mortar|array|taser|\bams\b|-ams|pds|artillery|cannon-combo|combo|smoker|buckler|chaff/i;

/**
 * Fills the Alpha Strike values of a weapon whose block holds none, from its Total Warfare stats (derive below), and says so in the block's notes.
 * A weapon with no reach, no damage, or of a kind the conversion does not cover is left as it is. Returns the same list.
 */
export function applyDerivedAlphaStrike(items: IEquipmentItem[]): IEquipmentItem[] {
    for (const item of items) {
        if (item.isAmmo || item.battleValueDefensive || NOT_CONVERTED.test(`${item.tag} ${item.name}`) || !(item.range?.long > 0)) continue;
        const block = item.alphaStrike;
        if (block && (block.rangeShort || block.rangeMedium || block.rangeLong || block.rangeExtreme)) continue;
        const derived = deriveAlphaStrike(item);
        if (!derived.rangeShort && !derived.rangeMedium && !derived.rangeLong && !derived.rangeExtreme) continue;
        const direct = item.category === "Energy Weapons" || item.category === "Ballistic Weapons" || item.category === "Custom Equipment";
        item.alphaStrike = { ...(block ?? { rangeExtreme: 0, tc: false, notes: [] }), ...derived, tc: direct && !/missile|srm|srt|streak|rocket/i.test(item.name) && !/missile/i.test(item.category ?? ""),
            notes: [...(block?.notes ?? []).filter((note) => !/^Unverified custom equipment$|^Unresolved|not yet looked up|no Alpha Strike (conversion|effect)/i.test(note)),
                "Derived from the weapon's stats by the canon conversion (derived-alpha-strike.ts)"] };
    }
    return items;
}

/** Alpha Strike heat and damage for a weapon, derived from its Total Warfare stats. */
export function deriveAlphaStrike(item: IEquipmentItem): IAlphaStrikeValues {
    const reach = item.range.long;
    const damage = bracketDamage(item);
    const ultra = /\bultra\b|ultra-ac/i.test(`${item.tag} ${item.name}`);
    // An Ultra autocannon fires twice for a half again the damage and twice the heat (canon Ultra AC/10: 1.5 and heat 8 for 10 damage and heat 4).
    // A bonus to hit counts a twentieth more a point (pulse lasers, -2, a tenth; the extended-range pulse lasers, -1, a twentieth).
    const bonus = (1 + 0.05 * Math.min(2, Math.max(0, -(item.accuracyModifier ?? 0)))) * (ultra ? 1.5 : 1);
    const value = (points: number, reached: boolean, factor = 1): number => reached ? round3(points / 10 * bonus * factor) : 0;
    return {
        heat: (item.heat ?? 0) * (ultra ? 2 : 1),
        rangeShort: value(damage.short, reach >= BRACKET_REACH.short, shortRangeFactor(item.range.min ?? 0)),
        rangeMedium: value(damage.medium, reach >= BRACKET_REACH.medium),
        rangeLong: value(damage.long, reach >= BRACKET_REACH.long),
        rangeExtreme: value(damage.extreme, reach >= BRACKET_REACH.extreme),
    };
}
