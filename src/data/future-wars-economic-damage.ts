import { FightSize, ICampaignArea, ICampaignDot, ICampaignSide, ICustomDotType } from "../classes/campaign/campaign-types";
import { FwDotType } from "./future-wars-economics";

/*
 * Economic damage: derived by NGCFells, inspired by Herb Barents, Future Wars #5 (1987) p.6 ("make up a table for
 * each of the things on your planet") and The Best of Future Wars (1991) pp.33-34. Approved by NGCFells 2026-11-19.
 * After a battle in an area, roll 2D6 for each live dot there; the target or more destroys it. A natural 2 never does.
 */

export type { FightSize };

/** Food is easiest to destroy, heavy industry hardest (both printings); the steps are NGCFells's. */
export const FW_DOT_DESTROY_TARGETS: Record<FwDotType, number> = {
    "food": 6,
    "oil": 7,
    "mining": 8,
    "radioactive-materials": 8,
    "refining": 9,
    "processing": 9,
    "light-manufacturing": 10,
    "heavy-manufacturing": 11,
};

/** The largest force on either side. */
export const FW_FIGHT_SIZE_MODIFIERS: Record<FightSize, number> = { lance: -2, company: 0, battalion: 1, regiment: 2 };

/** Defender's restraint (FW #5 p.6): defenders avoid wrecking their own planet early. */
export const FW_DEFENDER_RESTRAINT_MODIFIER = -1;
/** Scorched earth (Best of p.34): declared by the side leaving the area. */
export const FW_SCORCHED_EARTH_MODIFIER = 3;
/** Partisans (both printings): once a quarter, one dot chosen by the GM in each area the invader holds. */
export const FW_PARTISANS_MODIFIER = -2;
/** The first quarter: steps 0, 1 and 2 of a month campaign. */
export const FW_RESTRAINT_MONTHS = 3;

export interface IDotDamageInput {
    size: FightSize;
    defenderRestraint: boolean;
    scorchedEarth: boolean;
}

export const getDotDamageModifier = ( input: IDotDamageInput ): number =>
    FW_FIGHT_SIZE_MODIFIERS[input.size] +
    ( input.defenderRestraint ? FW_DEFENDER_RESTRAINT_MODIFIER : 0 ) +
    ( input.scorchedEarth ? FW_SCORCHED_EARTH_MODIFIER : 0 );

export const isDotDestroyed = ( target: number, naturalRoll: number, modifier: number ): boolean =>
    naturalRoll !== 2 && naturalRoll + modifier >= target;

export const getDotDestroyTarget = ( type: string, custom: ICustomDotType[] ): number =>
    custom.find( ( t ) => t.id === type )?.target ?? FW_DOT_DESTROY_TARGETS[type as FwDotType] ?? 8;

/** True when the defender holds the area and the campaign is in its first quarter. */
export const isDefenderRestraint = ( area: ICampaignArea, sides: ICampaignSide[], step: number ): boolean => {
    const controller = sides.find( ( side ) => side.id === area.controllerSideId );
    return !!controller && controller.role === "defender" && step < FW_RESTRAINT_MONTHS;
}

export const rollAreaDamage = (
    area: ICampaignArea,
    custom: ICustomDotType[],
    input: IDotDamageInput,
    roll2d6: () => number,
): { dotId: string; roll: number; destroyed: boolean }[] => {
    const modifier = getDotDamageModifier( input );
    return area.dots.filter( ( dot ) => !dot.destroyed ).map( ( dot ) => {
        const roll = roll2d6();
        return { dotId: dot.id, roll, destroyed: isDotDestroyed( getDotDestroyTarget( dot.type, custom ), roll, modifier ) };
    } );
}

export const rollPartisans = ( dot: ICampaignDot, custom: ICustomDotType[], roll2d6: () => number ): { roll: number; destroyed: boolean } => {
    const roll = roll2d6();
    return { roll, destroyed: isDotDestroyed( getDotDestroyTarget( dot.type, custom ), roll, FW_PARTISANS_MODIFIER ) };
}
