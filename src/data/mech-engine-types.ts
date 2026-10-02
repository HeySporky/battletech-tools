import { EngineRequirement, IEngineType } from "./data-interfaces";

/*
 * DISCLAIMER: This file processes gameplay data derived from the BattleTech universe. 
 * All lore, stats, and intellectual property belong strictly to Catalyst Game Labs, 
 * Topps, and their respective rights holders. 
 *
 * This open-source utility is a non-commercial fan project designed purely for 
 * tabletop gameplay assistance. Content processed by this file is not intended 
 * to challenge any copyright or trademark status, and this data is explicitly 
 * excluded from the software's underlying license (GNU GPLv3).
 *
 * 'Mech critical slots and cost multipliers: TechManual pp.48-49 and p.278.
 * Dates: IO tech progression (prototype, production, extinct, reintroduced).
 * Fission and Light engines are Inner Sphere only; ICE and Fuel Cell engines
 * use six center torso slots in a 'Mech like a standard fusion engine.
 *
 * Large engines (ratings above 400) follow in `mechLargeEngineTypes`: rules TO:AUE p.119,
 * slots and weights p.120, cost p.219, dates IO:AE p.38. Their weights are the rows above
 * 400 in mech-engine-options.ts.
 */

export const mechEngineTypes: IEngineType[] = [
	{
		name: "Standard Fusion",
		alternateName: "Fusion Engine",
		tag: "standard",
		book: "TM",
		page: 214,
		criticals: {
			is: { ct: 6 },
			clan: { ct: 6 }
		},
		costMultiplier: 5000,
		introduced: 2300,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "XL Fusion",
		tag: "xl",
		book: "TM",
		page: 214,
		criticals: {
			is: { ct: 6, lt: 3, rt: 3 }
		},
		costMultiplier: 20000,
		prototype: 2556,
		introduced: 2579,
		extinct: 2865,
		reintroduced: 3035,
		rating: 0
	},
	{
		name: "Clan XL Fusion",
		tag: "clan_xl",
		book: "TM",
		page: 214,
		criticals: {
			clan: { ct: 6, lt: 2, rt: 2 }
		},
		costMultiplier: 20000,
		prototype: 2824,
		introduced: 2827,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Light Fusion",
		tag: "light",
		book: "TM",
		page: 214,
		criticals: {
			is: { ct: 6, lt: 2, rt: 2 }
		},
		costMultiplier: 15000,
		prototype: 3055,
		introduced: 3062,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Compact Fusion",
		tag: "compact",
		book: "TM",
		page: 214,
		criticals: {
			is: { ct: 3 }
		},
		costMultiplier: 10000,
		prototype: 3065,
		introduced: 3068,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "XXL Fusion",
		tag: "xxl",
		book: "TO:AUE",
		page: 121,
		criticals: {
			is: { ct: 6, lt: 6, rt: 6 }
		},
		costMultiplier: 100000,
		prototype: 3055,
		introduced: 3110,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Clan XXL Fusion",
		tag: "clan_xxl",
		book: "TO:AUE",
		page: 121,
		criticals: {
			clan: { ct: 6, lt: 4, rt: 4 }
		},
		costMultiplier: 100000,
		prototype: 2954,
		introduced: 3084,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Internal Combustion Engine",
		alternateName: "ICE",
		tag: "ice",
		book: "TM",
		page: 215,
		criticals: {
			is: { ct: 6 },
			clan: { ct: 6 }
		},
		costMultiplier: 1250,
		introduced: 1950,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Fuel Cell Engine",
		alternateName: "FCE",
		tag: "cell",
		book: "TM",
		page: 215,
		criticals: {
			is: { ct: 6 },
			clan: { ct: 6 }
		},
		costMultiplier: 3500,
		prototype: 2300,
		introduced: 2470,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Fission Engine",
		tag: "fission",
		book: "TM",
		page: 215,
		criticals: {
			is: { ct: 6 }
		},
		costMultiplier: 7500,
		prototype: 2470,
		introduced: 2882,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Primitive Fusion Engine",
		tag: "primitive",
		book: "IO:AE",
		page: 117,
		criticals: {
			is: { ct: 6 }
		},
		costMultiplier: 5000,
		prototype: 2439,
		introduced: 2443,
		extinct: 2520,
		reintroduced: null,
		rating: 0
	}
];

/**
 * Large engines: the over-400 form of an engine type (TO:AUE p.119). Each costs twice its base
 * type and takes two more center torso slots (TO:AUE pp.120, 219), and has its own dates (IO:AE p.38).
 * There is no large Compact, Fuel Cell or Fission engine (TO:AUE p.120), and a Primitive engine
 * cannot be large.
 *
 * Large XL (Inner Sphere): the Star League prototype of ~2635 was lost in 2822 and prototyped
 * again in 3054; production came only in ~3085, so `extinct` is earlier than `introduced`.
 */
export const mechLargeEngineTypes: IEngineType[] = [
	{
		name: "Large Fusion",
		alternateName: "LSF",
		tag: "large-standard",
		largeOf: "standard",
		book: "TO:AUE",
		page: 119,
		criticals: {
			is: { ct: 8 },
			clan: { ct: 8 }
		},
		costMultiplier: 10000,
		prototype: 2630,
		introduced: 3085,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Large XL Fusion",
		alternateName: "LXL",
		tag: "large-xl",
		largeOf: "xl",
		book: "TO:AUE",
		page: 119,
		criticals: {
			is: { ct: 8, lt: 3, rt: 3 }
		},
		costMultiplier: 40000,
		prototype: 2635,
		introduced: 3085,
		extinct: 2822,
		reintroduced: 3054,
		rating: 0
	},
	{
		name: "Large Clan XL Fusion",
		alternateName: "LXL",
		tag: "large-clan_xl",
		largeOf: "clan_xl",
		book: "TO:AUE",
		page: 119,
		criticals: {
			clan: { ct: 8, lt: 2, rt: 2 }
		},
		costMultiplier: 40000,
		prototype: 2850,
		introduced: 3080,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Large Light Fusion",
		alternateName: "LLF",
		tag: "large-light",
		largeOf: "light",
		book: "TO:AUE",
		page: 119,
		criticals: {
			is: { ct: 8, lt: 2, rt: 2 }
		},
		costMultiplier: 30000,
		prototype: 3064,
		introduced: 3065,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Large XXL Fusion",
		alternateName: "LXXL",
		tag: "large-xxl",
		largeOf: "xxl",
		book: "TO:AUE",
		page: 119,
		criticals: {
			is: { ct: 8, lt: 6, rt: 6 }
		},
		costMultiplier: 200000,
		prototype: 3058,
		introduced: 3130,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Large Clan XXL Fusion",
		alternateName: "LXXL",
		tag: "large-clan_xxl",
		largeOf: "clan_xxl",
		book: "TO:AUE",
		page: 119,
		criticals: {
			clan: { ct: 8, lt: 4, rt: 4 }
		},
		costMultiplier: 200000,
		prototype: 3055,
		introduced: 3125,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Large Internal Combustion Engine",
		alternateName: "LIC",
		tag: "large-ice",
		largeOf: "ice",
		book: "TO:AUE",
		page: 119,
		criticals: {
			is: { ct: 8 },
			clan: { ct: 8 }
		},
		costMultiplier: 2500,
		prototype: 2630,
		introduced: 3085,
		extinct: null,
		reintroduced: null,
		rating: 0
	}
];

/** The large engine record for an engine type, or undefined when that type cannot be large. */
/** Fusion engine types (large engines are sized forms of these). ICE, fuel cell and fission are not. */
export const FUSION_ENGINE_TAGS: readonly string[] = ["standard", "xl", "clan_xl", "light", "compact", "xxl", "clan_xxl", "primitive"];

/** Does an engine of this type power an item with the given `requiresEngine` (IO:AE p.85, TO:AUE p.158)? */
export function engineMeetsRequirement(requirement: EngineRequirement | undefined, engineTag: string): boolean {
    if (!requirement) return true;
    // Extended Fuel Tanks: ICE or fuel cell engines only (TM p.244).
    if (requirement === "ice-or-fuel-cell") return engineTag === "ice" || engineTag === "cell";
    if (FUSION_ENGINE_TAGS.includes(engineTag)) return true;
    return requirement === "fusion-or-fission" && engineTag === "fission";
}

/** "a fusion engine", "an ICE or fuel cell engine": for messages about `requiresEngine`. */
export function describeEngineRequirement(requirement: EngineRequirement): string {
    switch (requirement) {
        case "fusion": return "a fusion engine";
        case "fusion-or-fission": return "a fusion or fission engine";
        case "ice-or-fuel-cell": return "an ICE or fuel cell engine";
    }
}

export function getLargeEngineType(baseTag: string): IEngineType | undefined {
	return mechLargeEngineTypes.find(engine => engine.largeOf === baseTag);
}
