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
* Dates: IO:AE p.42 tech progression; unknown dates are null, not 0. Standard
* musculature: prototype 2300, production 2350 (cost TM p.277). TSM: Inner Sphere
* prototype 3028, production 3050. Industrial TSM: prototype 3035, production 3045
* (12 slots, TM p.70; BV multipliers TM p.304). Prototype TSM (IO:AE p.98): 3028
* until production TSM replaces it in 3050. Super-Cooled Myomer (IO:AE p.88): RISC
* experimental, prototype 3132, extinct 3140.
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
		page: 277,
		prototype: 2300,
		introduced: 2350,
		extinct: null,
		reintroduced: null
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
		extinct: null,
		reintroduced: null
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
		extinct: null,
		reintroduced: null
	},
	{
		name: "Prototype Triple-Strength Myomer",
		tag: "prototype-tsm",
		criticals: 6,
		costPerTon: 32000,
		bvWeightMultiplier: 1.5,
		tripleStrength: true,
		techBase: "is",
		book: "IO:AE",
		page: 98,
		notes: "Experimental rules only; no MP bonus.",
		prototype: 3028,
		introduced: null,
		extinct: 3050,
		reintroduced: null
	},
	{
		name: "Super-Cooled Myomer",
		tag: "risc-super-cooled-myomer",
		criticals: 6,
		costPerTon: 10000,
		bvWeightMultiplier: 1,
		tripleStrength: false,
		techBase: "is",
		book: "IO:AE",
		page: 88,
		notes: "RISC experimental; 6 slots (IO:AE p.215), cost IO:AE p.179, BV IO:AE p.185.",
		prototype: 3132,
		introduced: null,
		extinct: 3140,
		reintroduced: null
	}
];
