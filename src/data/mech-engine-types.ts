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
		rating: 0,
		introducedInEdition: "battledroids",
		editionStats: {
			battledroids: {
				book: "BD", page: 23, name: "Engine", criticals: 6,
				// Engine Table, BD p.23, as printed.
				engineWeights: {
					10: 0.5, 15: 0.5, 20: 0.5, 25: 0.5, 30: 1, 35: 1, 40: 1, 45: 1, 50: 1.5, 55: 1.5,
					60: 1.5, 65: 2, 70: 2, 75: 2, 80: 2.5, 85: 2.5, 90: 3, 95: 3, 100: 3, 105: 3.5,
					110: 3.5, 115: 4, 120: 4, 125: 4, 130: 4.5, 135: 4.5, 140: 5, 145: 5, 150: 5.5, 155: 5.5,
					160: 6, 165: 6, 170: 6.5, 175: 7, 180: 7, 185: 7.5, 190: 7.5, 195: 8, 200: 8.5, 205: 8.5,
					210: 9, 215: 9.5, 220: 10, 225: 10, 230: 10.5, 235: 11, 240: 11.5, 245: 12, 250: 12.5, 255: 13,
					260: 13.5, 265: 14, 270: 14.5, 275: 15.5, 280: 16, 285: 16.5, 290: 17.5, 295: 18, 300: 19, 305: 19.5,
					310: 20.5, 315: 21.5, 320: 22.5, 325: 23.5, 330: 24.5, 335: 25.5, 340: 27, 345: 28.5, 350: 29.5, 355: 31.5,
					360: 33, 365: 34.5, 370: 36.5, 375: 38.5, 380: 41, 385: 43.5, 390: 46, 395: 49, 400: 52.5,
				},
				notes: "Engine rating = tonnage x walking movement points; the Engine Table runs from 10 to 400 (BD p.23). The 170 is printed at 6.5 tons, half a ton over the later tables. The engine includes 10 heat sinks (BD p.24). Six Engine boxes in the center torso (record sheet, BD p.13).",
			},
			"battletech-2nd-edition": {
				book: "BT2", page: 37, name: "Engine", criticals: 6,
				// Engine Table, BT2 p.37, as printed.
				engineWeights: {
					10: 0.5, 15: 0.5, 20: 0.5, 25: 0.5, 30: 1, 35: 1, 40: 1, 45: 1, 50: 1.5, 55: 1.5,
					60: 1.5, 65: 2, 70: 2, 75: 2, 80: 2.5, 85: 2.5, 90: 3, 95: 3, 100: 3, 105: 3.5,
					110: 3.5, 115: 4, 120: 4, 125: 4, 130: 4.5, 135: 4.5, 140: 5, 145: 5, 150: 5.5, 155: 5.5,
					160: 6, 165: 6, 170: 6, 175: 7, 180: 7, 185: 7.5, 190: 7.5, 195: 8, 200: 8.5, 205: 8.5,
					210: 9, 215: 9.5, 220: 10, 225: 10, 230: 10.5, 235: 11, 240: 11.5, 245: 12, 250: 12.5, 255: 13,
					260: 13.5, 265: 14, 270: 14.5, 275: 15.5, 280: 16, 285: 16.5, 290: 17.5, 295: 18, 300: 19, 305: 19.5,
					310: 20.5, 315: 21.5, 320: 22.5, 325: 23.5, 330: 24.5, 335: 25.5, 340: 27, 345: 28.5, 350: 29.5, 355: 31.5,
					360: 33, 365: 34.5, 370: 36.5, 375: 38.5, 380: 41, 385: 43.5, 390: 46, 395: 49, 400: 52.5,
				},
				notes: "Engine rating = tonnage x walking movement points; the Engine Table runs from 10 to 400, and the 170 is now 6.0 tons (BT2 p.37). The engine includes 10 heat sinks (BT2 p.39). Six Engine boxes in the center torso (record sheet).",
			},
			"battletech-manual": null,
			"battletech-compendium": null,
			"battletech-3rd-edition": null,
		},
	},
	{
		name: "XL Fusion",
		tag: "xl",
		introducedInEdition: "battletech-compendium", editionStats: { "battletech-compendium": { book: "BTC", page: 122, name: "Inner Sphere XL Engine", notes: "Any fusion engine may be built as an XL: half the normal engine weight, rounded up to the half ton, with extra engine critical slots in the side torsos, 3 in the left torso and 3 in the right. Three engine critical hits destroy the BattleMech whichever torso they are in. BattleMechs, vehicles and AeroSpace fighters may use it; there is no XL ICE (BTC pp.122-123). Price: (20,000 x rating x tonnage) / 75 (BTC p.128)." } },
		altNames: ["XL Engine"],
		book: "TM",
		page: 214,
		criticals: {
			is: { ct: 6, lt: 3, rt: 3 },
			// The Clans kept the Star League XL until their own Clan XL (2827) replaced it.
			clan: { ct: 6, lt: 3, rt: 3 }
		},
		costMultiplier: 20000,
		prototype: 2556,
		introduced: 2579,
		extinct: 2865,
		reintroduced: 3035,
		// Retirement date set by the project owner (2026-09-30), in line with the Clans' other Star League
		// copies (~2850); no published extinction date.
		clanDates: { prototype: 2556, introduced: 2579, extinct: 2850, reintroduced: null },
		rating: 0
	},
	{
		name: "Clan XL Fusion",
		tag: "clan_xl",
		introducedInEdition: "battletech-compendium", editionStats: { "battletech-compendium": { book: "BTC", page: 122, name: "Clan XL Engine", notes: "Any fusion engine may be built as an XL: half the normal engine weight, rounded up to the half ton, with extra engine critical slots in the side torsos, 2 in the left torso and 2 in the right. Three engine critical hits destroy the BattleMech whichever torso they are in. BattleMechs, vehicles and AeroSpace fighters may use it; there is no XL ICE (BTC pp.122-123). Price: (20,000 x rating x tonnage) / 75 (BTC p.128)." } },
		altNames: ["XL Engine"],
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
		altNames: ["Light Fusion Engine"],
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
		altNames: ["Compact Fusion Engine"],
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
		altNames: ["XXL Engine"],
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
		altNames: ["XXL Engine"],
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
		introducedInEdition: "battletech-manual",
		editionStats: {
			"battletech-manual": { book: "BTM", page: 81, name: "Internal Combustion Engine", notes: "Offered for vehicles and installations, and as the turbine of conventional aircraft: twice the weight of an identically rated fusion engine from the Engine Table, with no built-in heat sinks, and power amplifiers at one ton per ten tons of energy weapons (BTM pp.81-82, 84). BattleMech construction does not mention it (BTM pp.78-80)." },
			"battletech-compendium": null,
		},
		altNames: ["I.C.E. Engine"],
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
		altNames: ["Fuel-Cell Engine"],
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
