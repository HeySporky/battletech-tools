import { IMyomerType } from "./data-interfaces";

/*
 * The data here is/may be copyrighted and NOT included in the GPLv3 license.
 *
 * Dates: IO tech progression. TSM: Inner Sphere prototype 3028, production 3050.
 * Industrial TSM: prototype 3035, production 3045. Prototype TSM (IO:AE p.98):
 * 3028 until production TSM replaces it in 3050.
 */
export const mechMyomerTypes: IMyomerType[] = [
	{
		name: "Standard",
		tag: "standard",
		criticals: 0,
		costPerTon: 2000,
		bvWeightMultiplier: 1,
		tripleStrength: false,
		book: "TM",
		page: null,
		introduced: 1950,
		extinct: 0,
		reintroduced: 0
	},
	{
		name: "Triple-Strength Myomer",
		tag: "tsm",
		criticals: 6,
		costPerTon: 16000,
		bvWeightMultiplier: 1.5,
		tripleStrength: true,
		techBase: "is",
		book: "TM",
		page: 240,
		notes: "+1 walk MP and double physical attack damage at 9+ heat.",
		prototype: 3028,
		introduced: 3050,
		extinct: 0,
		reintroduced: 0
	},
	{
		name: "Industrial Triple-Strength Myomer",
		tag: "industrial-tsm",
		criticals: 12,
		costPerTon: 12000,
		bvWeightMultiplier: 1.15,
		tripleStrength: false,
		techBase: "is",
		book: "TM",
		page: 240,
		notes: "IndustrialMech myomer; no MP bonus.",
		prototype: 3035,
		introduced: 3045,
		extinct: 0,
		reintroduced: 0
	},
	{
		name: "Prototype Triple-Strength Myomer",
		tag: "prototype-tsm",
		criticals: 6,
		costPerTon: 32000,
		bvWeightMultiplier: 1.5,
		tripleStrength: true,
		techBase: "is",
		book: "IO_AE",
		page: 98,
		notes: "Experimental rules only; no MP bonus.",
		prototype: 3028,
		introduced: null,
		extinct: 3050,
		reintroduced: 0
	}
];
