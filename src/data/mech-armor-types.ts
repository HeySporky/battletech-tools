import { IArmorType } from "./data-interfaces";

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
 */

export const mechArmorTypes: IArmorType[] = [
	{
		name: "Standard",
		tag: "standard",
		crits: {
			clan: 0,
			is: 0
		},
		armorMultiplier: {
			clan: 16,
			is: 16
		},

		costMultiplier: 10000,
		introduced: 2470,
		extinct: 0,
		reintroduced: 0
	},
	{
		name: "Ferro Fibrous",
		tag: "ferro-fibrous",
		armorMultiplier: {
			clan: 16 * 1.2,
			is: 16 * 1.12
		},
		crits: {
			clan: 7,
			is: 14
		},
		costMultiplier: 20000,
		introduced: 2571,
		extinct: 2810,
		reintroduced: 3040
	},

	{
		name: "Light Ferro Fibrous",
		tag: "light-ferro-fibrous",
		armorMultiplier: {
			clan: 0,
			is: 16 * 1.06,
		},
		crits: {
			clan: 0,
			is: 7
		},
		costMultiplier: 15000,
		introduced: 3067,
		extinct: 0,
		reintroduced: 0
	},

	{
		name: "Heavy Ferro Fibrous",
		tag: "heavy-ferro-fibrous",
		armorMultiplier: {
			clan: 0,
			is: 16 * 1.24,
		},
		crits: {
			clan: 0,
			is: 21,
		},
		costMultiplier: 25000,
		introduced: 3069,
		extinct: 0,
		reintroduced: 0
	},

	{
		name: "Stealth",
		tag: "stealth",
		armorMultiplier: {
			clan: 0,
			is: 16,
		},
		crits: {
			clan: 0,
			is: 12,
		},
		critLocs: {
			ra: 2,
			rl: 2,
			rt: 2,
			la: 2,
			ll: 2,
			lt: 2
		},
		costMultiplier: 50000,
		introduced: 3063,
		extinct: 0,
		reintroduced: 0
	}
];
