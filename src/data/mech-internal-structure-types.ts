import { IInternalStructure } from "./data-interfaces";

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
export const mechInternalStructureTypes: IInternalStructure[] = [
	{
		name: "Standard",
		tag: "standard",
		crits: {
			clan: 0,
			is: 0
		},

		perTon: {
			20: {
				tonnage: 2,
				head: 3,
				centerTorso: 6,
				rlTorso: 5,
				rlArm: 3,
				rlLeg: 4
			},
			25: {
				tonnage: 2.5,
				head: 3,
				centerTorso: 8,
				rlTorso: 6,
				rlArm: 4,
				rlLeg: 6
			},
			30: {
				tonnage: 3,
				head: 3,
				centerTorso: 10,
				rlTorso: 7,
				rlArm: 5,
				rlLeg: 7
			},
			35: {
				tonnage: 3.5,
				head: 3,
				centerTorso: 11,
				rlTorso: 8,
				rlArm: 6,
				rlLeg: 8
			},
			40: {
				tonnage: 4,
				head: 3,
				centerTorso: 12,
				rlTorso: 10,
				rlArm: 6,
				rlLeg: 10
			},
			45: {
				tonnage: 4.5,
				head: 3,
				centerTorso: 14,
				rlTorso: 11,
				rlArm: 7,
				rlLeg: 11
			},
			50: {
				tonnage: 5,
				head: 3,
				centerTorso: 16,
				rlTorso: 12,
				rlArm: 8,
				rlLeg: 12
			},
			55: {
				tonnage: 5.5,
				head: 3,
				centerTorso: 18,
				rlTorso: 13,
				rlArm: 9,
				rlLeg: 13
			},
			60: {
				tonnage: 6,
				head: 3,
				centerTorso: 20,
				rlTorso: 14,
				rlArm: 10,
				rlLeg: 14
			},
			65: {
				tonnage: 6.5,
				head: 3,
				centerTorso: 21,
				rlTorso: 15,
				rlArm: 10,
				rlLeg: 15
			},
			70: {
				tonnage: 7,
				head: 3,
				centerTorso: 22,
				rlTorso: 15,
				rlArm: 11,
				rlLeg: 15
			},
			75: {
				tonnage: 7.5,
				head: 3,
				centerTorso: 23,
				rlTorso: 16,
				rlArm: 12,
				rlLeg: 16
			},
			80: {
				tonnage: 8,
				head: 3,
				centerTorso: 25,
				rlTorso: 17,
				rlArm: 13,
				rlLeg: 17
			},
			85: {
				tonnage: 8.5,
				head: 3,
				centerTorso: 27,
				rlTorso: 18,
				rlArm: 14,
				rlLeg: 18
			},
			90: {
				tonnage: 9,
				head: 3,
				centerTorso: 29,
				rlTorso: 19,
				rlArm: 15,
				rlLeg: 19
			},
			95: {
				tonnage: 9.5,
				head: 3,
				centerTorso: 30,
				rlTorso: 20,
				rlArm: 16,
				rlLeg: 20
			},
			100: {
				tonnage: 10,
				head: 3,
				centerTorso: 31,
				rlTorso: 21,
				rlArm: 17,
				rlLeg: 21
			}
		},

		cost: 400,
		introduced: 2470,
		extinct: 0,
		reintroduced: 0
	},
	{
		name: "Endo-Steel",
		tag: "endo-steel",
		crits: {
			clan: 7,
			is: 14
		},

		perTon: {
			20: {
				tonnage: 1,
				head: 3,
				centerTorso: 6,
				rlTorso: 5,
				rlArm: 3,
				rlLeg: 4
			},
			25: {
				tonnage: 1.5,
				head: 3,
				centerTorso: 8,
				rlTorso: 6,
				rlArm: 4,
				rlLeg: 6
			},
			30: {
				tonnage: 1.5,
				head: 3,
				centerTorso: 10,
				rlTorso: 7,
				rlArm: 5,
				rlLeg: 7
			},
			35: {
				tonnage: 2,
				head: 3,
				centerTorso: 11,
				rlTorso: 8,
				rlArm: 6,
				rlLeg: 8
			},
			40: {
				tonnage: 2,
				head: 3,
				centerTorso: 12,
				rlTorso: 10,
				rlArm: 6,
				rlLeg: 10
			},
			45: {
				tonnage: 2.5,
				head: 3,
				centerTorso: 14,
				rlTorso: 11,
				rlArm: 7,
				rlLeg: 11
			},
			50: {
				tonnage: 2.5,
				head: 3,
				centerTorso: 16,
				rlTorso: 12,
				rlArm: 8,
				rlLeg: 12
			},
			55: {
				tonnage: 3,
				head: 3,
				centerTorso: 18,
				rlTorso: 13,
				rlArm: 9,
				rlLeg: 13
			},
			60: {
				tonnage: 3,
				head: 3,
				centerTorso: 20,
				rlTorso: 14,
				rlArm: 10,
				rlLeg: 14
			},
			65: {
				tonnage: 3.5,
				head: 3,
				centerTorso: 21,
				rlTorso: 15,
				rlArm: 10,
				rlLeg: 15
			},
			70: {
				tonnage: 3.5,
				head: 3,
				centerTorso: 22,
				rlTorso: 15,
				rlArm: 11,
				rlLeg: 15
			},
			75: {
				tonnage: 4,
				head: 3,
				centerTorso: 23,
				rlTorso: 16,
				rlArm: 12,
				rlLeg: 16
			},
			80: {
				tonnage: 4,
				head: 3,
				centerTorso: 25,
				rlTorso: 17,
				rlArm: 13,
				rlLeg: 17
			},
			85: {
				tonnage: 4.5,
				head: 3,
				centerTorso: 27,
				rlTorso: 18,
				rlArm: 14,
				rlLeg: 18
			},
			90: {
				tonnage: 4.5,
				head: 3,
				centerTorso: 29,
				rlTorso: 19,
				rlArm: 15,
				rlLeg: 19
			},
			95: {
				tonnage: 5,
				head: 3,
				centerTorso: 30,
				rlTorso: 20,
				rlArm: 16,
				rlLeg: 20
			},
			100: {
				tonnage: 5,
				head: 3,
				centerTorso: 31,
				rlTorso: 21,
				rlArm: 17,
				rlLeg: 21
			}
		},

		cost: 1600,
		introduced: 2470,
		extinct: 0,
		reintroduced: 0
	}
];
