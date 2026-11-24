/**
 * Water landings and floating DropShips in play (#643). Canon: AeroTech (1986), BattleTech Manual (1987), BattleSpace (1993),
 * AeroTech 2 (1998) and AeroTech 2 Revised (2004) give +3 to land in a water hex; Total Warfare destroys a unit that lands in Depth 1+;
 * Strategic Operations: Advanced Aerospace Rules p.61 lets a DropShip land and float. The Flotation Hull is Custom Homebrew
 * (NOT OFFICIAL; Vehrec and NGCFells): a hulled aerodyne lands on water as on a runway and sails afloat. From the BattleTech
 * forums: StingerTheRaven's bow ramp, and the rules team answer that naval vehicles use bays as ground units.
 */

export type WaterState = "airborne" | "grounded" | "afloat";

export interface IWaterPlay {
    state: WaterState;
    /** The aft is breached and the bays are flooded (SO:AAR p.61, units in a flooded bay). */
    flooded?: boolean;
    /** The ship spent MP afloat this turn (TO:AUE p.25: then only Jumping or VTOL units may disembark). */
    moved?: boolean;
}

/** The editions whose landing table carries the flat +3 for a water hex. */
export const OLDER_WATER_EDITIONS = ["aerotech", "battletech-manual", "battlespace", "aerotech-2", "aerotech-2-revised"];

export interface IWaterLandingModifier {
    modifier: number;
    crash: boolean;
    label: string;
}

/** The to-hit-style landing modifier for a water hex. `hull` is a Flotation Hull; `horizontal` is a runway-style landing. */
export function getWaterLandingModifier(edition: string, hull: boolean, horizontal: boolean): IWaterLandingModifier {
    if (OLDER_WATER_EDITIONS.includes(edition)) {
        return hull
            ? { modifier: 0, crash: false, label: "The Flotation Hull waives the +3 water landing modifier" }
            : { modifier: 3, crash: false, label: "Landing in a water hex +3" };
    }
    // Total Warfare standard rules: Depth 1+ destroys the unit. Play uses Strategic Operations, which is the rest of this function.
    const standard = edition === "total-warfare" ? " (Total Warfare's standard rules destroy a unit landing in Depth 1+ water; this tool plays the Strategic Operations rules)" : "";
    if (horizontal) {
        return hull
            ? { modifier: 0, crash: false, label: `Flotation Hull: a horizontal water landing is a runway landing${standard}` }
            : { modifier: 0, crash: true, label: `An aerodyne horizontal water landing crashes: standard crash damage x10, then 1D6, 1-3 right side up, 4-6 upside down and destroyed (SO:AAR p.61)${standard}` };
    }
    return { modifier: 0, crash: false, label: `Vertical water landing: Control Roll as a spheroid, +1 aerodyne DropShip, +2 aerodyne Small Craft; crash damage at velocity 2 (SO:AAR p.61)${standard}` };
}

export interface IAfloatEffects {
    cruise: number;
    flank: number;
    heatSinkMultiplier: 1.1;
    noGroundedModifier: true;
    criticalBonus: 1;
}

/** SO:AAR p.61 floating DropShip rules. Canon: it cannot move except to take off again; the hull gives Cruise 2 / Flank 3. */
export function getAfloatEffects(hull: boolean): IAfloatEffects {
    return { cruise: hull ? 2 : 0, flank: hull ? 3 : 0, heatSinkMultiplier: 1.1, noGroundedModifier: true, criticalBonus: 1 };
}

/** Heat sinks afloat: x1.1, rounded down (SO:AAR p.61). */
export function getAfloatHeatSinks(sinks: number): number {
    return Math.floor(sinks * 1.1 + 1e-9);
}

/**
 * The well deck launches and recovers only while the ship is afloat, and not in a turn it spends MP: a Large Naval
 * Vessel that moves lets only Jumping or VTOL units disembark (TO:AUE p.25; TO p.156), and afloat the hulled ship moves as one.
 */
export function canUseWellDeck(play: IWaterPlay | undefined): boolean {
    return play?.state === "afloat" && play.moved !== true;
}

/**
 * StingerTheRaven's bow ramp (BattleTech forums, Pregnant Guppy: an amphibious dropship, 25 April 2021; Custom
 * Homebrew): afloat on the Flotation Hull, the vehicle bays launch hover vehicles down a ramp into the water and recover
 * them up it. Not in a turn the ship spends MP (TO:AUE p.25).
 */
export function canUseBowRamp(hull: boolean, play: IWaterPlay | undefined): boolean {
    return hull && canUseWellDeck(play);
}

/** What the bays may do afloat on the hull; empty for a canon DropShip, which keeps the SO:AAR flooded-bay rules. */
export function getAfloatBayNote(hull: boolean): string {
    if (!hull) return "";
    return "Afloat: hover vehicles launch from the vehicle bays down the bow ramp and are recovered up it (Custom Homebrew by "
        + "StingerTheRaven, BattleTech forums, Pregnant Guppy: an amphibious dropship, 25 April 2021); naval vehicles leave and enter "
        + "a well deck or vehicle bay as ground units do a grounded DropShip (TW p.89; rules team answer, BattleTech forums, Blue "
        + "Water Naval Units and Vehicle Bays, 13 August 2020). In a turn the ship spends MP afloat only units with Jumping or VTOL "
        + "MP may disembark (TO:AUE p.25)";
}

/** What a breached aft does to the units in the well deck (SO:AAR p.61, flooded cargo bays). */
export function getFloodingNote(hasWellDeck: boolean): string {
    const base = "Flooded bays: a fire can never occur in a submerged bay; only energy weapons and torpedoes fire inside; weapon attacks from non-submerged units re-roll aft hits; units with UMU MP may mount or dismount at +1 to Piloting Skill Rolls (+2 for an enemy)";
    return hasWellDeck ? `${base}. The vehicles in the well deck stay aboard, in a flooded bay.` : base;
}

export function normalizeWaterPlay(saved: unknown): IWaterPlay | undefined {
    if (!saved || typeof saved !== "object") return undefined;
    const source = saved as Partial<IWaterPlay>;
    const state: WaterState = source.state === "grounded" || source.state === "afloat" ? source.state : "airborne";
    if (state === "airborne" && source.flooded !== true) return undefined;
    return { state, ...(source.flooded === true ? { flooded: true } : {}), ...(state === "afloat" && source.moved === true ? { moved: true } : {}) };
}

/** Taking off from water (SO:AAR pp.61, 83): the Takeoff Damage Table row Water Take Off multiplies damage by 1.25; a gear that is down is destroyed. */
export function getWaterTakeoffNote(hull: boolean, horizontal: boolean): string {
    const damage = "Takeoff Damage x1.25 (Water Take Off, SO:AAR p.83); landing gear left deployed at liftoff is destroyed";
    if (horizontal) {
        return hull
            ? `Flotation Hull: a horizontal takeoff from water is a runway takeoff. ${damage}.`
            : `An aerodyne cannot take off horizontally from water without a hull: more than a quarter water hexes in the strip is a crash (SO:AAR p.61).`;
    }
    return `Vertical liftoff from water: Control Roll as a spheroid, +1 aerodyne DropShip, +2 aerodyne Small Craft. ${damage}.`;
}
