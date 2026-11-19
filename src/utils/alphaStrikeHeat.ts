/**
 * The Alpha Strike heat conversion for units that track heat ('Mechs and walkers), after the Alpha Strike Companion's
 * Converting Heat errata v1.3 (CGL, 2025), which supersedes ASC pp.115-116.
 * Source text: ResourceLibrary/text/AlphaStrikeCompanionConvertingHeatErrata-CGL-2025-v1-3.txt
 */

/** Rounds up to the nearest tenth (0.401 becomes 0.5); noise past the thousandth is dropped first (0.3 x 3 is 0.9). */
export const roundUpToTenth = (value: number): number => Math.ceil(Math.round(value * 1000) / 100) / 10;

export interface IAlphaStrikeFinalDamage {
    damage: number;
    /** Minimal Damage, printed 0*. */
    minimal: boolean;
}

/** A base damage value: rounded up to the tenth, then up to the whole number; more than 0 and under 0.5 is 0*. */
export const finalAlphaStrikeDamage = (heatModified: number): IAlphaStrikeFinalDamage => {
    const tenth = roundUpToTenth(heatModified);
    if (tenth <= 0) return { damage: 0, minimal: false };
    if (tenth < 0.5) return { damage: 0, minimal: true };
    return { damage: Math.ceil(tenth), minimal: false };
};

/** A special ability's damage value (AC, FLK, IF, LRM, SRM, HT...): rounded up to the tenth, then rounded normally. */
export const roundAlphaStrikeAbilityDamage = (heatModified: number): IAlphaStrikeFinalDamage => {
    const tenth = roundUpToTenth(heatModified);
    if (tenth <= 0) return { damage: 0, minimal: false };
    if (tenth < 0.5) return { damage: 0, minimal: true };
    return { damage: Math.round(tenth + 1e-9), minimal: false };
};

export interface IAlphaStrikeMovementHeatInput {
    jumpMP: number;
    xxl?: boolean;
    improvedJets?: boolean;
    /** An IndustrialMech (or an industrial walker): no movement heat unless it jumps or has an XXL engine. */
    industrial?: boolean;
}

/** The heat of the unit's most heat-intensive movement mode (errata v1.3, Heat Output; XXL Engine; Improved Jump Jets). */
export const alphaStrikeMovementHeat = ({ jumpMP, xxl = false, improvedJets = false, industrial = false }: IAlphaStrikeMovementHeatInput): number => {
    if (jumpMP <= 0) return xxl ? 6 : industrial ? 0 : 2;
    if (xxl && improvedJets) return Math.max(3, jumpMP);
    if (xxl) return Math.max(6, jumpMP * 2);
    if (improvedJets) return Math.max(3, Math.ceil(jumpMP / 2));
    return Math.max(3, jumpMP);
};

/** Anti-missile systems' heat each (errata v1.3): the item's own Alpha Strike heat is not used for these. */
const AMS_HEAT: Readonly<Record<string, number>> = {
    "is-ams": 1,
    "clan-ams": 1,
    "clan-laser-ams": 5,
    "is-laser-ams": 7,
};
const SIGNATURE_SYSTEMS: readonly string[] = ["null-signature-system", "void-signature-system", "custom-null-signature-system"];

/** True for an anti-missile system, whose heat comes from {@link alphaStrikeExtraHeat}, not from the weapon heat. */
export const isAlphaStrikeAntiMissileSystem = (tag: string): boolean => tag in AMS_HEAT;

/**
 * True for a weapon whose own heat the output leaves out (errata v1.3): rocket launchers and one-shot launchers add
 * none; an AMS adds its heat through {@link alphaStrikeExtraHeat} instead.
 */
export const addsNoAlphaStrikeWeaponHeat = (item: { tag: string; isOneShot?: boolean }): boolean =>
    !!item.isOneShot || /(^|-)rocket-launcher-\d+$/.test(item.tag) || isAlphaStrikeAntiMissileSystem(item.tag);

export interface IAlphaStrikeExtraHeatInput {
    /** Every mounted item's tag, one entry per item. */
    equipmentTags: readonly string[];
    stealthArmor?: boolean;
}

/** The special-case heat (errata v1.3): every AMS, stealth armor / Null- or Void-Signature (+10 once), Chameleon LPS (+6). */
export const alphaStrikeExtraHeat = ({ equipmentTags, stealthArmor = false }: IAlphaStrikeExtraHeatInput): number => {
    let heat = equipmentTags.reduce((total, tag) => total + (AMS_HEAT[tag] ?? 0), 0);
    if (stealthArmor || equipmentTags.some((tag) => SIGNATURE_SYSTEMS.includes(tag))) heat += 10;
    if (equipmentTags.includes("chameleon-lps")) heat += 6;
    return heat;
};

export interface IAlphaStrikeHeatInput {
    /** The damage subtotals before any rounding: Short, Medium, Long, Extreme. */
    subtotals: readonly number[];
    /** All heat: weapons, movement, special cases. */
    heatOutput: number;
    /** The same, leaving out the weapons with no Long damage. */
    longHeatOutput: number;
    dissipation: number;
}

export interface IAlphaStrikeHeatResult {
    /** True when the dissipation is under the heat output - 4. */
    hot: boolean;
    /** The heat-modified damage per bracket, rounded up to the tenth. */
    modified: number[];
    /** The final damage values. */
    values: IAlphaStrikeFinalDamage[];
    /** The Overheat value, 0 to 4. */
    overheat: number;
    /** The unit qualifies for OVL (its Long damage is then heat-modified with the full output). */
    ovl: boolean;
    /** The multiplier on each bracket, for the special abilities' damage (1 where unmodified). */
    factor: number[];
}

/** The heat-modified damage, Overheat and OVL of a heat-tracking unit (errata v1.3). */
export const applyAlphaStrikeHeat = ({ subtotals, heatOutput, longHeatOutput, dissipation }: IAlphaStrikeHeatInput): IAlphaStrikeHeatResult => {
    const [short = 0, medium = 0, long = 0, extreme = 0] = subtotals;
    const hot = dissipation < heatOutput - 4;
    const factorAll = hot ? dissipation / (heatOutput - 4) : 1;

    // OVL: the Long subtotal rounded up against the Long-output heat-modified Long, also rounded up; at least 1 lower.
    let ovl = false;
    if (long > 0 && dissipation < longHeatOutput - 4) {
        const check = roundUpToTenth(long * dissipation / (longHeatOutput - 4));
        ovl = Math.ceil(roundUpToTenth(long)) - Math.ceil(check) >= 1;
    }
    const factorLong = ovl ? factorAll : 1;
    const factor = [factorAll, factorAll, factorLong, factorLong];
    const modified = [short, medium, long, extreme].map((value, bracket) => roundUpToTenth(value * factor[bracket]));
    const values = modified.map(finalAlphaStrikeDamage);

    // Overheat: what the Medium damage dropped by (Short when there is none at Medium), at most 4.
    const bracket = medium > 0 ? 1 : 0;
    const before = Math.ceil(roundUpToTenth(bracket === 1 ? medium : short));
    const overheat = Math.min(4, Math.max(0, before - values[bracket].damage));

    return { hot, modified, values, overheat, ovl, factor };
};
