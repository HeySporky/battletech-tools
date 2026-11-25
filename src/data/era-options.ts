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
 * Based on BattleTech Master Unit List eras: http://masterunitlist.info/Era/Index
 */
export const btEraOptions: IEras[] = [
	{
		id: 1,
		name: "Age of War (2005-2570)",
		tag: "age-of-war",
		yearStart: 2005,
		yearEnd: 2570,
	},
	{
		id: 2,
		name: "Star League (2571-2780)",
		tag: "star-league",
		yearStart: 2571,
		yearEnd: 2780,
	},
	{
		id: 3,
		name: "Early Succcession War (2781-2900)",
		tag: "early-sw",
		yearStart: 2781,
		yearEnd: 2900,
	},
	{
		id: 4,
		name: "Late Succcession War - LosTech (2901-3019)",
		tag: "late-sw-lt",
		yearStart: 2901,
		yearEnd: 3019,
	},
	{
		id: 5,
		name: "Late Succcession War - Renaissance (3020-3049)",
		tag: "late-sw-rn",
		yearStart: 3020,
		yearEnd: 3049,
	},
	{
		id: 6,
		name: "Clan Invasion (3050-3061)",
		tag: "clan-inv",
		yearStart: 3050,
		yearEnd: 3061,
	},
	{
		id: 7,
		name: "Civil War (3062-3067)",
		tag: "civil-war",
		yearStart: 3062,
		yearEnd: 3067,
	},
	{
		id: 8,
		name: "Jihad (3068-3085)",
		tag: "jihad",
		yearStart: 3068,
		yearEnd: 3085,
	},
	{
		id: 8,
		name: "Early Republic (3086-3100)",
		tag: "early-rep",
		yearStart: 3086,
		yearEnd: 3100,
	},
	{
		id: 9,
		name:  "Late Republic (3101-3130)",
		tag: "late-rep",
		yearStart: 3101,
		yearEnd: 3130,
	},
	{
		id: 10,
		name: "Dark Ages (3131-3999)",
		tag: "dark-ages",
		yearStart: 3131,
		yearEnd: 3999,
	}
];
