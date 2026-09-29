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

// Rules levels follow IO p.50 as implemented by MegaMek (Mek/QuadVee/LandAirMek tech
// advancement); book not yet in hand. Standard (tournament) play excludes Advanced and
// Experimental chassis, so they never appear on tournament lists or cards by default.
export const mechTypeOptions: IMechType[] = [
	{
		id: 1,
		tag: "biped",
		name: "Biped",
		rulesLevel: 0,
		book: "TM",
	},
	{
		id: 2,
		tag: "quad",
		name:  "Quad",
		rulesLevel: 0,
		book: "TM",
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
