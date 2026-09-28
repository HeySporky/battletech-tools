import { IEras } from "./data-interfaces";

/*
 * DISCLAIMER: This file processes gameplay data derived from the BattleTech universe. 
 * All official lore, trademarks, and intellectual property belong strictly to 
 * Catalyst Game Labs, Topps, and/or their respective corporate rights holders. 
 * Any original, fan-made content or custom homebrew data processed by this tool 
 * remains the exclusive property of its respective community creators, which,
 * where known, has been appropriately attributed.
 *
 * This open-source utility is a non-commercial fan project designed purely for 
 * tabletop gameplay assistance. Content processed by this file is not intended 
 * to challenge any copyright or trademark status, and this data is explicitly 
 * excluded from the software's underlying license (GNU GPLv3).
 *
 * Based upon and expanded from the BattleTech Master Unit List eras: https://masterunitlist.battletech.com/eras
 */

export const btEraOptions: IEras[] = [
	{
		id: 1,
		name: "Age of War (2398-2570)",
		tag: "age-of-war",
		yearStart: 2398,
		yearEnd: 2570
	},
	{
		id: 2,
		name: "Star League (2571-2780)",
		tag: "star-league",
		yearStart: 2571,
		yearEnd: 2780
	},
	{
		id: 13,
		name: "The Exodus (2784-2800)",
		tag: "the-exodus",
		yearStart: 2784,
		yearEnd: 2800
	},
	{
		id: 14,
		name: "The Founding - Early Clan Era (2801-2824)",
		tag: "the-founding",
		yearStart: 2801,
		yearEnd: 2824
	},
	{
		id: 12,
		name: "Clan Golden Century (2825–2946)",
		tag: "golden-century",
		yearStart: 2825,
		yearEnd: 2946
	},
	{
		id: 3,
		name: "Early Succcession War (2781-2900)",
		tag: "early-sw",
		yearStart: 2781,
		yearEnd: 2900
	},
	{
		id: 4,
		name: "Late Succcession War - LosTech (2901-3019)",
		tag: "late-sw-lt",
		yearStart: 2901,
		yearEnd: 3019
	},
	{
		id: 15,
		name: "Political Century - Mid Clan Era (2947–3049)",
		tag: "political-century",
		yearStart: 2947,
		yearEnd: 3049
	},
	{
		id: 5,
		name: "Late Succcession War - Renaissance (3020-3049)",
		tag: "late-sw-rn",
		yearStart: 3020,
		yearEnd: 3049
	},
	{
		id: 6,
		name: "Clan Invasion (3050-3061)",
		tag: "clan-inv",
		yearStart: 3050,
		yearEnd: 3061
	},
	{
		id: 7,
		name: "Civil War (3062-3067)",
		tag: "civil-war",
		yearStart: 3062,
		yearEnd: 3067
	},
	{
		id: 8,
		name: "Jihad (3068-3085)",
		tag: "jihad",
		yearStart: 3068,
		yearEnd: 3085
	},
	{
		id: 8,
		name: "Early Republic (3086-3100)",
		tag: "early-rep",
		yearStart: 3086,
		yearEnd: 3100
	},
	{
		id: 9,
		name:  "Late Republic (3101-3130)",
		tag: "late-rep",
		yearStart: 3101,
		yearEnd: 3130
	},
	{
		id: 10,
		name: "Dark Ages (3131-3150)",
		tag: "dark-ages",
		yearStart: 3131,
		yearEnd: 3150
	},
	{
		id: 11,
		name: "ilClan (3151+)",
		tag: "ilClan",
		yearStart: 3151,
		yearEnd: null
	}
];
