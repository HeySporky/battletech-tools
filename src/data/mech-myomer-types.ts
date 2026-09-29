import { IMyomerType } from "./data-interfaces";

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
