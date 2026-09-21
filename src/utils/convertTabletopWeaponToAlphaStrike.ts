export interface ITabletopWeaponDamageByRange {
    short: number;
    medium: number;
    long: number;
    extreme?: number;
}

export interface IAlphaStrikeWeaponConversionRule {
    id: string;
    source: string;
    damageDivisor: number;
    shortMultiplier?: number;
    mediumMultiplier?: number;
    longMultiplier?: number;
    extremeMultiplier?: number;
    minimumDamage?: number;
    rounding: "nearest" | "floor" | "ceil";
}

export interface ITabletopWeaponConversionInput {
    heat: number;
    damage: ITabletopWeaponDamageByRange;
    rule?: IAlphaStrikeWeaponConversionRule;
}

export interface IAlphaStrikeWeaponConversionResult {
    status: "calculated" | "unresolved";
    source?: string;
    ruleId?: string;
    heat?: number;
    rangeShort?: number;
    rangeMedium?: number;
    rangeLong?: number;
    rangeExtreme?: number;
    reason?: string;
}

export function convertTabletopWeaponToAlphaStrike(
    input: ITabletopWeaponConversionInput,
): IAlphaStrikeWeaponConversionResult {
    if (!input.rule) {
        return {
            status: "unresolved",
            reason: "An authoritative Alpha Strike conversion rule is required; Classic BattleTech ranges are not Alpha Strike damage values.",
        };
    }

    if (!Number.isFinite(input.rule.damageDivisor) || input.rule.damageDivisor <= 0) {
        return {
            status: "unresolved",
            reason: "The conversion rule has no valid damage divisor.",
        };
    }

    if (!input.rule.source.trim()) {
        return {
            status: "unresolved",
            reason: "The conversion rule must identify its source.",
        };
    }

    return {
        status: "calculated",
        source: input.rule.source,
        ruleId: input.rule.id,
        heat: input.heat,
        rangeShort: convertDamage(input.damage.short, input.rule.shortMultiplier ?? 1, input.rule),
        rangeMedium: convertDamage(input.damage.medium, input.rule.mediumMultiplier ?? 1, input.rule),
        rangeLong: convertDamage(input.damage.long, input.rule.longMultiplier ?? 1, input.rule),
        rangeExtreme: convertDamage(input.damage.extreme ?? 0, input.rule.extremeMultiplier ?? 1, input.rule),
    };
}

function convertDamage(
    damage: number,
    multiplier: number,
    rule: IAlphaStrikeWeaponConversionRule,
): number {
    const converted = damage * multiplier / rule.damageDivisor;
    const rounded = rule.rounding === "floor"
        ? Math.floor(converted)
        : rule.rounding === "ceil"
            ? Math.ceil(converted)
            : Math.round(converted);

    if (rounded === 0 && converted > 0 && rule.minimumDamage !== undefined) {
        return rule.minimumDamage;
    }

    return rounded;
}