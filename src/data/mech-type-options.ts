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
		editionStats: { battledroids: { book: "BD", page: 24 }, "battletech-2nd-edition": null, "battletech-manual": null, "battletech-compendium": null, "battletech-3rd-edition": null, "battletech-4th-edition": null, "master-rules": null, "master-rules-revised": null },
	},
	{
		id: 2,
		tag: "quad",
		introducedInEdition: "battletech-compendium", editionStats: { "battletech-compendium": { book: "BTC", page: 56, name: "Four-Legged BattleMech", notes: "Optional rules for the Goliath and Scorpion; without them a four-legged BattleMech plays as a biped. The arms become a second pair of legs, with 12 fewer critical slots. Lateral shift for 1 extra MP; -2 on Piloting Skill rolls to avoid falls while all four legs remain; no punching, pushing or club attacks (BTC p.56). The construction rules do not mention it (BTC pp.111-113)." }, "master-rules": { book: "BMR", page: 75, name: "Four-Legged BattleMech", notes: "Optional rules; without them a four-legged 'Mech uses the bipedal rules. Construction is now covered: the arms are replaced by a second set of legs with the internal structure of legs, which can carry leg armor, and each has the 2 open critical slots of a leg (BMR pp.75, 109). Lateral shifts and improved Piloting Skill target numbers (BMR p.75)." }, "master-rules-revised": { book: "BMR(R)", page: 82, name: "Four-Legged BattleMech", notes: "Optional rules; without them a four-legged 'Mech uses the bipedal rules. The arms are replaced by a second set of legs with the internal structure of legs, which can carry leg armor, and each has the 2 open critical slots of a leg (BMR(R) pp.82, 115). Lateral shifts and improved Piloting Skill target numbers (BMR(R) p.82)." } },
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
			"battletech-compendium": { book: "BTC", page: 104, name: "Land-Air BattleMech", notes: "Built as a BattleMech with 10 percent of its tonnage, rounded up to the half ton, given to conversion equipment. New: never heavier than 55 tons, never an OmniMech, and it may not carry bombs (BTC p.105). BattleMech, AirMech and Fighter modes; the standard configurations are variations of the Wasp, Stinger and Phoenix Hawk (BTC p.104). Conversion costs (weapons and equipment cost + structure cost) x .75 (BTC p.128)." },
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
