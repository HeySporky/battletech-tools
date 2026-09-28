import { IJumpJet } from "./data-interfaces";

/*
 * The data here is/may be copyrighted and NOT included in the GPLv3 license.
 *
 * Dates: IO tech progression. Improved jump jets: Inner Sphere prototype 3067,
 * Clan prototype 3060, production 3068 for both.
 */
export const mechJumpJetTypes: IJumpJet[] = [
	{
		name: "Standard Jump Jets",
		tag: "standard",
		weight_multiplier: {
			light: 0.5,
			medium: 1,
			heavy: 2,
			superheavy: 4
		},
		criticals: 1,
		costMultiplier: 200,
		prototype: 2464,
		introduced: 2471,
		extinct: 0,
		reintroduced: 0
	},

	{
		name:  "Improved Jump Jets",
		tag: "improved",
		weight_multiplier: {
			light: 1,
			medium: 2,
			heavy: 4,
			superheavy: 8
		},
		criticals: 2,
		costMultiplier: 500,
		prototype: 3067,
		introduced: 3068,
		extinct: 0,
		reintroduced: 0,
		clanDates: { prototype: 3060, introduced: 3068, extinct: 0, reintroduced: 0 }
	}
];
