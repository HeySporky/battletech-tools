import { IJumpJet } from "./data-interfaces";

/*
* DISCLAIMER: This file processes gameplay data derived from the BattleTech universe. 
* All lore, stats, and intellectual property belong strictly to Catalyst Game Labs, 
* Topps, and their respective rights holders. 
*
* This open-source utility is a non-commercial fan project designed purely for 
* tabletop gameplay assistance. Content processed by this file is not intended 
* to challenge any copyright or trademark status, and this data is explicitly 
* excluded from the software's underlying license (GNU GPLv3).
*
* Dates: IO:AE p.29 tech progression. Improved jump jets: Clan prototype 3060, production 3069;
* Inner Sphere introduction 3070. UMUs (TO:AUE p.107) follow the jump jet
* construction rules and give underwater MP instead: Inner Sphere 3066, Clan prototype 3061, Clan introduction 3072.
*/

/**
 * The 'Mech jump pack: strapped-on cargo, so not one of the jump jet types. It adds no design weight (plan ruling R2).
 * Dates are IO:AE p.29's; Maximum Tech prints none, so BMR(R) offers it by edition and level alone.
 */
export const mechJumpPack: IJumpJet = {
	name: "Jump Pack",
	tag: "jump-pack",
	rulesLevel: 3,
	techBase: "universal",
	editions: ["master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"],
	editionLevels: { "master-rules-revised": 3 },
	weight_multiplier: { light: 0, medium: 0, heavy: 0, superheavy: 0 },
	criticals: 0,
	costMultiplier: 20000,
	book: "TO:AUE",
	page: 105,
	packByTonnage: [
		{ upTo: 5, mpPerTon: 10, fuelPerTon: 20 },
		{ upTo: 19, mpPerTon: 5, fuelPerTon: 16 },
		{ upTo: 59, mpPerTon: 2, fuelPerTon: 12 },
		{ upTo: 89, mpPerTon: 1, fuelPerTon: 8 },
		{ upTo: 100, mpPerTon: 0.5, fuelPerTon: 6 },
	],
	maxPackTons: 20,
	prototype: 2430,
	introduced: 2457,
	extinct: 2840,
	reintroduced: 3083,
	clanDates: { prototype: 2839, introduced: 3083, extinct: null, reintroduced: null },
	introducedInEdition: "master-rules-revised",
	editionStats: {
		"master-rules-revised": {
			book: "MaxTech", page: 80, name: "BattleMech Jump Pack",
			notes: "Level 3. One per 'Mech, of any weight up to its tonnage as unprotected cargo (BMR(R) p.77). MP from the BMR Jump Jet Weight Table, at most Walking MP; a part of a jet's weight gives no MP (the book is silent on fractions). No heat. Fuel for MP x 2 hexes, then dropped. Any rear torso hit destroys it (pp.80-81). 20,000 C-bills a ton (p.87). Slots: pp.85-86 print Crit. 4* (\"see special rules\"), but the special rules give none, cargo takes none, and the p.118 master table prints none, so it takes no slots. BV1: pack MP x 5 on the final BV (p.92).",
		},
	},
};

export const mechJumpJetTypes: IJumpJet[] = [
	{
		name: "Standard Jump Jets",
		tag: "standard",
		rulesLevel: 1,
		techBase: "universal",
		editions: ["battledroids", "battletech-2nd-edition", "battletech-manual", "battletech-compendium", "battletech-3rd-edition", "compendium-rules-of-warfare", "battletech-4th-edition", "master-rules", "master-rules-revised", "total-warfare", "battlemech-manual", "core-rulebook"],
		altNames: ["Standard Jump Jet"],
		weight_multiplier: {
			light: 0.5,
			medium: 1,
			heavy: 2,
			superheavy: 4
		},
		criticals: 1,
		costMultiplier: 200,
		book: "TM",
		page: 225,
		prototype: 2464,
		introduced: 2471,
		extinct: null,
		reintroduced: null,
		introducedInEdition: "battledroids",
		editionStats: {
			battledroids: {
				book: "BD", page: 24, name: "Jump Jets", weight: 0.5, criticals: 0,
				notes: "0.5 tons for every jump movement point at every tonnage; mounted in the feet or back (BD p.24). No critical boxes: the construction rules put weapons and heat sinks on the Critical Hit Chart and do not mention jump jets (BD p.25), and the record listings show none (BD pp.16-17).",
			},
			"battletech-2nd-edition": {
				book: "BT2", page: 39, name: "Jump Jets", criticals: 1,
				weightByTonnage: [{ upTo: 55, tons: 0.5 }, { upTo: 85, tons: 1 }, { upTo: 100, tons: 2 }],
				notes: "Tons for every jump movement point, by the 'Mech's tonnage: 0.5 to 55 tons, 1.0 from 60 to 85, 2.0 from 90 to 100. Each jet's exhaust port takes space on the Equipment Chart of a leg or torso (BT2 p.39); the record listings give one box per jump movement point (BT2 pp.36-41).",
			},
			"battletech-manual": null,
			"battletech-compendium": null,
			"battletech-3rd-edition": null,
			"compendium-rules-of-warfare": null,
			"battletech-4th-edition": null,
			"master-rules": null,
			"master-rules-revised": null,
		},
	},

	{
		name:  "Improved Jump Jets",
		tag: "improved",
		techBase: "universal",
		editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
		altNames: ["Improved Jump Jet"],
		weight_multiplier: {
			light: 1,
			medium: 2,
			heavy: 4,
			superheavy: 8
		},
		criticals: 2,
		costMultiplier: 500,
		book: "TM",
		page: 225,
		introduced: 3070,
		extinct: null,
		reintroduced: null,
		clanDates: { prototype: 3060, introduced: 3069, extinct: null, reintroduced: null }
	},

	{
		name:  "UMU (Underwater Maneuvering Units)",
		tag: "umu",
		rulesLevel: 4,
		techBase: "universal",
		editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
		altNames: ["Mech UMU"],
		weight_multiplier: {
			light: 0.5,
			medium: 1,
			heavy: 2,
			superheavy: 4
		},
		criticals: 1,
		costMultiplier: 200,
		underwater: true,
		book: "TO:AUE",
		page: 107,
		introduced: 3066,
		extinct: null,
		reintroduced: null,
		clanDates: { prototype: 3061, introduced: 3072, extinct: null, reintroduced: null }
	},

	// Recovered prototype (IO:AE p.97): the construction rules of standard jump jets, the reach of
	// improved ones, 2 heat a hex (at least 6), and a 10-point explosion when a jet takes a critical hit.
	// IO:AE prints no cost; the standard jump jet rate is used, as MegaMek does.
	{
		name: "Prototype Improved Jump Jets",
		tag: "prototype-improved",
		techBase: "universal",
		altNames: ["Prototype Improved Jump Jet"],
		editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
		weight_multiplier: {
			light: 0.5,
			medium: 1,
			heavy: 2,
			superheavy: 4
		},
		criticals: 1,
		costMultiplier: 200,
		jumpAsRun: true,
		heatPerHex: 2,
		minimumHeat: 6,
		explosive: true,
		innerSphereOnly: true,
		book: "IO:AE",
		page: 97,
		prototype: 3022,
		introduced: null,
		extinct: 3069,
		reintroduced: null
	},

	// Primitive prototype jump jets (IO:AE p.114): the mass, slots, mounting rules and heat of standard jump
	// jets. A 'Mech that jumps with them makes a Piloting Skill Roll at +3 to avoid falling when it lands.
	// Cost: TT x 200 x Jump^2, the standard jump jet rate (IO:AE p.211).
	{
		name: "Primitive Prototype Jump Jets",
		tag: "primitive-prototype",
		techBase: "universal",
		altNames: ["Primitive Prototype Jump Jet"],
		editions: ["total-warfare", "battlemech-manual", "core-rulebook"],
		weight_multiplier: {
			light: 0.5,
			medium: 1,
			heavy: 2,
			superheavy: 4
		},
		criticals: 1,
		costMultiplier: 200,
		innerSphereOnly: true,
		book: "IO:AE",
		page: 114,
		prototype: 2464,
		introduced: null,
		extinct: null,
		reintroduced: null
	}
];
