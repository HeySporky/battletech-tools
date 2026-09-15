import { IEngineType } from "./data-interfaces";

/*
 * The data here is copyrighted and NOT included in the GPLv3 license.
 */

export const mechEngineTypes: IEngineType[] = [
	{
		name: "Standard Fusion",
		alternateName: "Fusion Engine",
		tag: "standard",
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
		criticals: {
			is: { ct: 6, lt: 3, rt: 3 }
		},
		costMultiplier: 20000,
		introduced: 2579,
		extinct: 2865,
		reintroduced: 3035,
		rating: 0
	},
	{
		name: "Clan XL Fusion",
		tag: "clan_xl",
		criticals: {
			clan: { ct: 6, lt: 2, rt: 2 }
		},
		costMultiplier: 20000,
		introduced: 2827,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Light Fusion",
		tag: "light",
		criticals: {
			is: { ct: 6, lt: 2, rt: 2 }
		},
		costMultiplier: 15000,
		introduced: 3062,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Compact Fusion",
		tag: "compact",
		criticals: {
			is: { ct: 3 }
		},
		costMultiplier: 10000,
		introduced: 3068,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "XXL Fusion",
		tag: "xxl",
		criticals: {
			is: { ct: 6, lt: 6, rt: 6 }
		},
		costMultiplier: 100000,
		introduced: 3055,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Clan XXL Fusion",
		tag: "clan_xxl",
		criticals: {
			clan: { ct: 6, lt: 4, rt: 4 }
		},
		costMultiplier: 100000,
		introduced: 3055,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Internal Combustion Engine",
		alternateName: "ICE",
		tag: "ice",
		criticals: {
			is: { ct: 1 },
			clan: { ct: 1 }
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
		criticals: {
			is: { ct: 1 },
			clan: { ct: 1 }
		},
		costMultiplier: 3500,
		introduced: 2025,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Fission Engine",
		tag: "fission",
		criticals: {
			is: { ct: 6 },
			clan: { ct: 6 }
		},
		costMultiplier: 3500,
		introduced: 1950,
		extinct: null,
		reintroduced: null,
		rating: 0
	},
	{
		name: "Primitive Fusion Engine",
		tag: "primitive",
		criticals: {
			is: { ct: 6 }
		},
		costMultiplier: 5000, // Shares standard cost multiplier, calculated via tonnage modifiers instead
		introduced: 2300,
		extinct: 2500, // Replaced completely by modern standards in Military Mechs
		reintroduced: 3070, // Resurged in Jihad-era RetroTech
		rating: 0
	}
];
