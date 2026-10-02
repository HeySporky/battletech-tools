import { ICockpitType } from "./data-interfaces";

/*
* DISCLAIMER: This file processes gameplay data derived from the BattleTech universe.
* All lore, stats, and intellectual property belong strictly to Catalyst Game Labs,
* Topps, and their respective rights holders.
*
* This open-source utility is a non-commercial fan project designed purely for
* tabletop gameplay assistance. Content processed by this file is not intended
* to challenge any copyright or trademark status, and this data is explicitly
* excluded from the software's underlying license.
*
* 'Mech cockpits. Dates: IO:AE pp.33-34 tech progression; unknown dates are null, not 0.
* `page` is the page of the rules entry; cost and BV pages are in `notes`.
* Only records marked "implemented" are mounted by the 'Mech builder: the chassis
* decides which one (Tripod, QuadVee, superheavy), and Small is the one free choice.
*/
export const mechCockpitTypes: ICockpitType[] = [
	{
		name: "Cockpit",
		tag: "standard",
		weight: 3,
		cost: 200000,
		constructionStatus: "implemented",
		book: "TM",
		page: 211,
		notes: "BattleMech cockpit. Cost TM p.277.",
		prototype: 2468,
		introduced: 2470,
		extinct: null,
		reintroduced: null
	},
	{
		name: "Small Cockpit",
		tag: "small",
		weight: 2,
		cost: 175000,
		bvMultiplier: 0.95,
		constructionStatus: "implemented",
		book: "TM",
		page: 211,
		notes: "+1 to Piloting Skill Rolls; frees one Life Support slot (TM p.52). Cost TM p.277; BV TM p.304.",
		prototype: 3060,
		introduced: 3067,
		extinct: null,
		reintroduced: null,
		clanDates: { introduced: 3080, extinct: null, reintroduced: null }
	},
	{
		name: "IndustrialMech Cockpit",
		tag: "industrial",
		weight: 3,
		cost: 100000,
		constructionStatus: "implemented",
		book: "TM",
		page: 211,
		notes: "IndustrialMech only; no advanced fire control. Cost TM p.277.",
		prototype: 2469,
		introduced: 2470,
		extinct: null,
		reintroduced: null
	},
	{
		name: "IndustrialMech Cockpit (Advanced Fire Control)",
		tag: "industrial-advanced-fire-control",
		weight: 3,
		cost: 200000,
		constructionStatus: "implemented",
		book: "TM",
		page: 211,
		notes: "IndustrialMech only. Cost TM p.277.",
		prototype: 2469,
		introduced: 2470,
		extinct: null,
		reintroduced: null
	},
	{
		name: "Primitive BattleMech Cockpit",
		tag: "primitive",
		weight: 5,
		cost: 200000,
		constructionStatus: "deferred",
		book: "IO:AE",
		page: 117,
		notes: "Primitive BattleMechs only. IO:AE p.117: identical to the standard cockpit, cost included, but 5 tons; the IO:AE p.215 table prints 100,000. The p.117 text is followed, as MegaMek does.",
		prototype: 2430,
		introduced: 2439,
		extinct: 2520,
		reintroduced: null
	},
	{
		name: "Primitive IndustrialMech Cockpit",
		tag: "primitive-industrial",
		weight: 5,
		cost: 100000,
		constructionStatus: "deferred",
		book: "IO:AE",
		page: 117,
		notes: "Primitive IndustrialMechs only; no fire control or ejection system. IO:AE p.117: costs as the IndustrialMech cockpit; the IO:AE p.215 table prints 50,000. The p.117 text is followed, as MegaMek does.",
		prototype: 2300,
		introduced: 2350,
		extinct: 2520,
		reintroduced: null
	},
	{
		name: "Torso-Mounted Cockpit",
		tag: "torso-mounted",
		weight: 4,
		cost: 750000,
		bvMultiplier: 0.95,
		constructionStatus: "deferred",
		book: "TO:AUE",
		page: 113,
		notes: "Experimental. 2 center torso slots (cockpit and sensors); Life Support moves to the side torsos; no Command Console (TO:AUE p.112). Cost TO:AUE p.219. BV: center torso armor counts double, final BV x0.95 (TO:AUE p.193).",
		prototype: 3053,
		introduced: 3080,
		extinct: null,
		reintroduced: null,
		clanDates: { prototype: 3055, introduced: 3080, extinct: null, reintroduced: null }
	},
	{
		name: "Cockpit Command Console",
		tag: "command-console",
		weight: 3,
		cost: 500000,
		addOn: true,
		constructionStatus: "deferred",
		book: "TO:AUE",
		page: 113,
		notes: "Add-on: 1 slot in the same location as the cockpit (TO:AUE p.112). Not with Torso-Mounted, QuadVee or tripod cockpits. Cost TO:AUE p.219.",
		prototype: 2625,
		introduced: 2631,
		extinct: 2850,
		reintroduced: 3030,
		clanDates: { introduced: 2631, extinct: null, reintroduced: null }
	},
	{
		name: "BattleMech Interface Cockpit (Machina Domini)",
		tag: "interface",
		weight: 4,
		cost: 1500000,
		constructionStatus: "deferred",
		book: "IO:AE",
		page: 110,
		notes: "Experimental prototype; never reached production. Takes one extra Cockpit slot; the 'Mech may be built without a gyro (IO:AE p.110). Cost IO:AE p.213, which prints ~3078 for the Inner Sphere prototype against ~3074 on p.33.",
		prototype: 3074,
		introduced: null,
		extinct: null,
		reintroduced: null,
		clanDates: { prototype: 3083, introduced: null, extinct: null, reintroduced: null }
	},
	{
		name: "Direct Neural Interface Cockpit Modification",
		tag: "direct-neural-interface",
		weight: 0,
		cost: 500000,
		techBase: "is",
		addOn: true,
		constructionStatus: "deferred",
		book: "IO:AE",
		page: 62,
		notes: "Add-on with no weight or slots; needs a pilot with a DNI implant. Cost IO:AE p.213.",
		prototype: 3052,
		introduced: 3055,
		extinct: null,
		reintroduced: null
	},
	{
		name: "QuadVee Cockpit",
		tag: "quadvee",
		weight: 4,
		cost: 375000,
		techBase: "clan",
		constructionStatus: "implemented",
		book: "IO:AE",
		page: 128,
		notes: "QuadVees only; 2 head slots (pilot and gunner); no other cockpit type or Command Console. Cost IO:AE p.215.",
		prototype: 3130,
		introduced: 3135,
		extinct: null,
		reintroduced: null
	},
	{
		name: "Tripod 'Mech Cockpit",
		tag: "tripod",
		weight: 4,
		cost: 400000,
		techBase: "is",
		constructionStatus: "implemented",
		book: "IO:AE",
		page: 159,
		notes: "Tripods of up to 100 tons; two crew. No other cockpit type or Command Console. Cost IO:AE p.217.",
		prototype: 2590,
		introduced: 2602,
		extinct: null,
		reintroduced: null
	},
	{
		name: "Superheavy BattleMech Cockpit",
		tag: "superheavy",
		weight: 4,
		cost: 300000,
		techBase: "is",
		constructionStatus: "implemented",
		book: "IO:AE",
		page: 156,
		notes: "Superheavy bipeds and quads; 4 head structure points. May add a Command Console. Cost IO:AE p.215.",
		prototype: 3060,
		introduced: 3076,
		extinct: null,
		reintroduced: null
	},
	{
		name: "Superheavy IndustrialMech Cockpit",
		tag: "superheavy-industrial",
		weight: 4,
		cost: 200000,
		techBase: "is",
		constructionStatus: "implemented",
		book: "IO:AE",
		page: 156,
		notes: "Superheavy IndustrialMechs only. Cost IO:AE p.215.",
		prototype: 2905,
		introduced: 2940,
		extinct: null,
		reintroduced: null
	},
	{
		name: "Superheavy Tripod 'Mech Cockpit",
		tag: "superheavy-tripod",
		weight: 5,
		cost: 500000,
		techBase: "is",
		constructionStatus: "implemented",
		book: "IO:AE",
		page: 156,
		notes: "Superheavy tripods (105-200 tons); three crew; no Command Console (IO:AE pp.156, 159). Cost IO:AE p.217, which prints 2940 against ~3130 / 3135 on p.33.",
		prototype: 3130,
		introduced: 3135,
		extinct: null,
		reintroduced: null
	}
];

export function getCockpitType(tag: string): ICockpitType {
	const cockpit = mechCockpitTypes.find(item => item.tag === tag);
	if (!cockpit) throw new Error(`Unknown cockpit type: ${tag}`);
	return cockpit;
}
