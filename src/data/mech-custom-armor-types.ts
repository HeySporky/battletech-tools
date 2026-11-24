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

export const mechCustomArmorTypes: IArmorType[] = [
	{
		// Solaris7 forum (#301). Munchkin: 1.5 times standard armor with no slots beats every canon armor, and its author
		// called it "munchtek" ("end boss armor", Prince).
		name: "Nanotube Armor",
		tag: "custom-nanotube-armor",
		techBase: "universal",
		rulesLevel: 7,
		unitTypes: {
			battlemech: true,
			protomech: false,
			combatVehicle: false,
			supportVehicle: false,
			aerospaceFighter: false,
			smallCraft: false,
			dropShip: false,
			battleArmor: false,
			jumpShip: false,
			warShip: false
		},
		crits: { clan: 0, is: 0 },
		armorMultiplier: { clan: 24, is: 24 },
		costMultiplier: 75000,
		// Not printed: Ferro-Fibrous's dates (Prince suggested it grew out of Ferro-Fibrous).
		introduced: 2571,
		extinct: 2810,
		reintroduced: 3040,
		book: "http://solaris7.com/thread/nanotube-armor-plating/",
		page: 0,
		notes: "Munchkin by Nightstalker666, Solaris7 forum ('Nanotube armor plating', November 2018): 24 armor points a ton, no critical slots, 75,000 C-bills a ton. "
			+ "Made only in specialized plants, five times as costly and ten times slower than other armor factories. The drawbacks he asked about (an extra point "
			+ "of damage per 5 or 10 ballistic damage, an extra critical hit) were never settled and are not applied. Not printed: dates are Ferro-Fibrous's.",
		lore: "Nanotube armor weaves carbon nanotubes into plate so strong and so thin that it takes no critical slots at all, yet protects half as much again as the best canon armor. Only a few specialized plants can make it, five times as costly and ten times slower than an ordinary armor factory, and its makers guard the process.",
		rules: "24 armor points a ton, no critical slots, 75,000 C-Bills a ton, for BattleMechs only. The drawbacks its author raised (an extra point of damage per 5 or 10 ballistic damage, an extra critical hit) were never settled and are not applied."
	}
];
