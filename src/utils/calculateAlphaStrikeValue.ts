import { IAlphaStrikeDamage } from "../classes/alpha-strike-unit";
import { calculateGroundPointValue } from "./alphaStrikeGroundPointValue";
import { roundAlphaStrikeAbilityDamage, roundUpToTenth } from "./alphaStrikeHeat";

/** Notes the conversion turns into damage codes below ("LRM" into "LRM 1/1/1", "Indirect Fire" into "IF 1"). */
const ALPHA_STRIKE_CONVERSION_KEYWORDS: readonly string[] = ["heat", "lrm", "flak", "ac", "srm", "missile", "msl", "rear", "indirect fire", "if"];

export function isAlphaStrikeConversionKeyword(note: string): boolean {
    return ALPHA_STRIKE_CONVERSION_KEYWORDS.includes(note.trim().toLowerCase());
}

export interface IAlphaStrikeExport {
    mechCreatorUUID: string;
    name: string;
    move: number;
    type: string;
    customName: string;
    role: string;
    jumpMove: number;
    pv: number;
    damage: IAlphaStrikeDamage;
    armor: number;
    structure: number;
    size: number;
    skill: number;
    overheat: number;
    notes: string;
    tmm: number;
    sizeClass: number;
    sizeClassName: string;
    ov: number;
    specialUnitAbilities: string[],
    longHeat: number;
    longOverheat: number;
    abilityCodes: string[],
}

export interface IAlphaStrikeCalculationResult {
    calcLogs: string;
    finalValue: number;
    alphaStrikeForceStats: IAlphaStrikeExport;
}

export function calculateAlphaStrikeValue(
    _alphaStrikeForceStats: IAlphaStrikeExport,
    rearDamage: IAlphaStrikeDamage,
    heatDamage: IAlphaStrikeDamage,
    lrmDamage: IAlphaStrikeDamage,
    flakDamage: IAlphaStrikeDamage,
    acDamage: IAlphaStrikeDamage,
    srmDamage: IAlphaStrikeDamage,
    mslDamage: IAlphaStrikeDamage,
    indirectFireRating: number,
    /** The heat-modified damage's multiplier per bracket (Short, Medium, Long, Extreme), from applyAlphaStrikeHeat. */
    heatFactor: readonly number[] = [1, 1, 1, 1],
): IAlphaStrikeCalculationResult {
    let _calcLogAS = "";
    _alphaStrikeForceStats.pv = 0;

    if (+rearDamage.short > 0 || +rearDamage.medium > 0 || +rearDamage.long > 0) {
        _alphaStrikeForceStats.abilityCodes.push("Rear");
    }

    // Write the damage-bearing special abilities onto the card ("LRM" becomes "LRM 1/1/1"); null leaves one off (#378).
    // LRM, SRM and AC need 10 or more points (1 or more) at medium range, before rounding (StratOps errata 2.0, Base
    // Damage; ASC errata); below that their damage stays in the base damage. A special with no damage at all is left off.
    // Each value is heat-modified as the base damage is, rounded up to the tenth, then rounded normally (Converting Heat
    // errata v1.3, Special Ability Damage); REAR is not heat-modified, its weapons' heat being left out.
    const damageCode = (label: string, damage: IAlphaStrikeDamage, needsMedium: boolean, heatModified: boolean = true): string | null => {
        // The Medium threshold is on the damage before the heat, rounded up to the tenth first, as
        // Vehicle._asFamilySpecials does (0.95 counts as 1).
        if (needsMedium && roundUpToTenth(+damage.medium) < 1) return null;
        const values = (["short", "medium", "long"] as const).map((range, bracket) => {
            const value = roundAlphaStrikeAbilityDamage(+damage[range] * (heatModified ? heatFactor[bracket] : 1));
            return value.minimal && !needsMedium ? "0*" : String(value.damage);
        });
        if (values.every((value) => value === "0")) return null;
        _calcLogAS += "<strong>Adding</strong> " + label + " Ability: " + values.join("/") + "<br />\n";
        return label + " " + values.join("/");
    };
    // IF is the final damage of the indirect-fire weapons, rounded normally; under 0.5 is minimal, IF 0*, as the vehicle
    // conversion and the MUL print it.
    const indirectFireCode = (): string | null => {
        if (indirectFireRating <= 0) return null;
        const rounded = roundAlphaStrikeAbilityDamage(indirectFireRating * heatFactor[2]);
        const value = rounded.minimal ? "0*" : String(rounded.damage);
        _calcLogAS += "<strong>Adding</strong> IF Ability: " + value + "<br />\n";
        return "IF " + value;
    };
    const writeCode = (code: string): string | null => {
        switch (code.toLowerCase()) {
            case "heat": return damageCode("Heat", heatDamage, false);
            case "lrm": return damageCode("LRM", lrmDamage, true);
            case "flak": return damageCode("Flak", flakDamage, false);
            case "ac": return damageCode("AC", acDamage, true);
            case "srm": return damageCode("SRM", srmDamage, true);
            case "missile": case "msl": return damageCode("MSL", mslDamage, false);
            case "rear": return damageCode("Rear", rearDamage, false, false);
            case "indirect fire": case "if": return indirectFireCode();
            default: return code;
        }
    };
    _alphaStrikeForceStats.abilityCodes = _alphaStrikeForceStats.abilityCodes.map(writeCode).filter((code): code is string => code !== null);

    /* Point Value: ASC pp.138-141 as corrected by errata v1.6, shared with the Alpha Strike unit creator. */
    _calcLogAS += "<div class=\"text-center\"><strong> - Calculating Point Value - </strong></div>\n";
    const stats = _alphaStrikeForceStats;
    const damageValue = (damage: number | string, minimal: boolean | undefined) => ({
        damage: damage.toString() === "-" || damage.toString() === "0*" ? 0 : +damage || 0,
        minimal: !!minimal || damage.toString() === "0*",
    });
    const pv = calculateGroundPointValue({
        type: stats.type,
        size: stats.sizeClass,
        moves: [{ inches: stats.move, mode: "" }],
        jump: stats.jumpMove,
        short: damageValue(stats.damage.short, stats.damage.shortMinimal),
        medium: damageValue(stats.damage.medium, stats.damage.mediumMinimal),
        long: damageValue(stats.damage.long, stats.damage.longMinimal),
        overheat: stats.ov,
        armor: stats.armor,
        structure: stats.structure,
        // The conversion writes Heat as "Heat 1/1/-"; its card code is HT.
        specials: [...new Set([...stats.abilityCodes, ...stats.specialUnitAbilities])].map((code) => code.replace(/^heat\b/i, "HT")),
    });
    for (const line of pv.log) _calcLogAS += line + "<br />\n";
    _alphaStrikeForceStats.pv = pv.pointValue;

    return {
        calcLogs: _calcLogAS,
        finalValue: pv.pointValue,
        alphaStrikeForceStats: _alphaStrikeForceStats,
    };
}


export function adjustAlphaStrikeDamage(
    incomingDamageObjects: IAlphaStrikeDamage,
    useZeros: boolean = false,
) {

    if( incomingDamageObjects.short.toString() === "0" ) {
        if( useZeros)
            incomingDamageObjects.short = 0;
        else
            incomingDamageObjects.short = 0;
    } else if( +incomingDamageObjects.short < .5) {
        incomingDamageObjects.shortMinimal = true;
        incomingDamageObjects.short= 0;
    } else {
        incomingDamageObjects.short = Math.round(+incomingDamageObjects.short);
    }

    if( incomingDamageObjects.medium.toString() === "0" ) {
        if( useZeros)
            incomingDamageObjects.medium = 0;
        else
            incomingDamageObjects.medium = 0;
    } else if( +incomingDamageObjects.medium < .5) {
        incomingDamageObjects.mediumMinimal = true;
        incomingDamageObjects.medium = 0;
    } else {
        incomingDamageObjects.medium = Math.round(+incomingDamageObjects.medium);
    }

    if( incomingDamageObjects.long.toString() === "0" ) {
        if( useZeros)
            incomingDamageObjects.long = 0;
        else
            incomingDamageObjects.long = 0;
    } else if( +incomingDamageObjects.long < .5) {
        incomingDamageObjects.long = 0;
        incomingDamageObjects.longMinimal = true;
    } else {
        incomingDamageObjects.long = Math.round(+incomingDamageObjects.long);
    }

    if( incomingDamageObjects.extreme.toString() === "0" ) {
        if( useZeros)
            incomingDamageObjects.extreme = 0;
        else
            incomingDamageObjects.extreme = 0;
    } else if( +incomingDamageObjects.extreme < .5) {
        incomingDamageObjects.extreme = 0;
        incomingDamageObjects.extremeMinimal= true;
    } else {
        incomingDamageObjects.extreme = Math.round(+incomingDamageObjects.extreme);
    }

    return incomingDamageObjects;
}
