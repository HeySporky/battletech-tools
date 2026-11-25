import { IHeatSync } from "./data-interfaces";

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
export const mechHeatSinkTypes: IHeatSync[] = [
	{
		name:  "Single",
		tag: "single",
		dissipation: 1,
		crits: {
			clan: 1,
			is: 1
		},

		cost: 2000,
		introduced: 2470,
		extinct: 0,
		reintroduced: 0
	},
	{
		name: "Double",
		tag: "double",
		dissipation: 2,
		crits: {
			clan: 2,
			is: 3
		},
		cost: 6000,
		introduced: 2470,
		extinct: 0,
		reintroduced: 0
	}
];
