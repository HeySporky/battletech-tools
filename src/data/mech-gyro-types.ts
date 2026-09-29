import { IGyro } from "./data-interfaces";

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
export const mechGyroTypes: IGyro[] = [
	{
		name: "Standard Gyro",
		tag: "standard",
		weight_multiplier: 1,
		criticals: 4,
		costMultiplier: 300000,
		introduced: 2350,
		extinct: 0,
		reintroduced: 0
	},
	{
		name: "Extra-light (XL) Gyro",
		tag: "xl",
		weight_multiplier: 0.5,
		criticals: 6,
		costMultiplier: 750000,
		introduced: 3067,
		extinct: 0,
		reintroduced: 0
	},
	{
		name: "Compact Gyro",
		tag: "compact",
		weight_multiplier: 1.5,
		criticals: 2,
		costMultiplier: 400000,
		introduced: 3068,
		extinct: 0,
		reintroduced: 0
	},
	{
		name: "Heavy Duty Gyro",
		tag: "heavy-duty",
		weight_multiplier: 2,
		criticals: 4,
		costMultiplier: 500000,
		introduced: 3067,
		extinct: 0,
		reintroduced: 0
	}
];
