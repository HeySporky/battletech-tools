import { IMechType } from "./data-interfaces";

/*
* DISCLAIMER: This file processes gameplay data derived from the BattleTech universe. 
* All lore, stats, and intellectual property belong strictly to Catalyst Game Labs, 
* Topps, and their respective rights holders. 
*
* This open-source utility is a non-commercial fan project designed purely for 
* tabletop gameplay assistance. Content processed by this file is not intended 
* to challenge any copyright or trademark status, and this data is explicitly 
* excluded from the software's underlying license (GNU GPLv3).
*/

// Rules levels follow IO:AE p.44 as implemented by MegaMek (Mek/QuadVee/LandAirMek tech
// advancement); book not yet in hand. Standard (tournament) play excludes Advanced and
// Experimental chassis, so they never appear on tournament lists or cards by default.
export const mechTypeOptions: IMechType[] = [
	{
		id: 1,
		tag: "biped",
		name: "Biped",
		rulesLevel: 0,
		book: "TM",
		introducedInEdition: "battledroids",
		// The only layout: head, three torsos, two arms and two legs (Internal Structure Table, BD p.24).
		editionStats: { battledroids: { book: "BD", page: 24 }, "battletech-2nd-edition": null, "battletech-manual": null },
	},
	{
		id: 2,
		tag: "quad",
		name:  "Quad",
		rulesLevel: 0,
		book: "TM",
	},
	{
		id: 3,
		tag: "tripod",
		name:  "Tripod",
		rulesLevel: 3,
		book: "IO",
		page: 50,
		notes: "Advanced",
	},
	{
		id: 4,
		tag: "lam",
		introducedInEdition: "battletech-manual",
		editionStats: {
			"battletech-manual": { book: "BTM", page: 74, name: "Land-Air 'Mech", notes: "Built as a 'Mech with 10 percent of its tonnage given to conversion equipment (BTM p.78). 'Mech, Air'Mech and Fighter modes; the standard configurations are variations of the Wasp, Stinger and Phoenix Hawk (BTM p.74). Conversion costs (weapons cost + structure cost) x .75 (BTM p.84)." },
		},
		name:  "LAM",
		rulesLevel: 4,
		book: "IO",
		page: 50,
		notes: "Experimental",
	},
	{
		id: 5,
		tag: "quadvee",
		name:  "QuadVee",
		rulesLevel: 3,
		book: "IO",
		page: 50,
		notes: "Advanced",
	}
];

export function getMechTypeOptionsForRulesLevel(rulesLevel: number): IMechType[] {
	return mechTypeOptions.filter(option => option.rulesLevel <= rulesLevel);
}
