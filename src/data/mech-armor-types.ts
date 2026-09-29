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
		unitTypes: {
			battlemech: true,
			protomech: false,
			combatVehicle: true,
			supportVehicle: true,
			aerospaceFighter: false,
			smallCraft: false,
			dropShip: false,
			battleArmor: false,
			jumpShip: false,
			warShip: false
		},
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
		reintroduced: 0,
		page: 205,
		book: "TM",
		prototype: 2460
	},
	{
		name: "Ferro Fibrous",
		tag: "ferro-fibrous",
		unitTypes: {
			battlemech: true,
			protomech: false,
			combatVehicle: true,
			supportVehicle: true,
			aerospaceFighter: false,
			smallCraft: false,
			dropShip: false,
			battleArmor: false,
			jumpShip: false,
			warShip: false
		},
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
		reintroduced: 3040,
		notes: "IS Ferro-Fibrous 2571 (Star League); Clan Ferro-Fibrous 2825. The Clans' earlier use of Star League Ferro-Fibrous is not modelled separately.",
		page: 205,
		book: "TM",
		clanDates: { prototype: 2820, introduced: 2825, extinct: 0, reintroduced: 0 },
		prototype: 2557
	},
	{
		name: "Light Ferro Fibrous",
		tag: "light-ferro-fibrous",
		unitTypes: {
			battlemech: true,
			protomech: false,
			combatVehicle: true,
			supportVehicle: true,
			aerospaceFighter: false,
			smallCraft: false,
			dropShip: false,
			battleArmor: false,
			jumpShip: false,
			warShip: false
		},
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
		reintroduced: 0,
		page: 205,
		book: "TM",
		prototype: 3055
	},
	{
		name: "Heavy Ferro Fibrous",
		tag: "heavy-ferro-fibrous",
		unitTypes: {
			battlemech: true,
			protomech: false,
			combatVehicle: true,
			supportVehicle: true,
			aerospaceFighter: false,
			smallCraft: false,
			dropShip: false,
			battleArmor: false,
			jumpShip: false,
			warShip: false
		},
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
		reintroduced: 0,
		page: 205,
		book: "TM",
		prototype: 3056
	},
	{
		name: "Basic Stealth",
		tag: "stealth-basic",
		alphaStrikeAbility: "STL",
		unitTypes: {
			battlemech: true,
			protomech: false,
			combatVehicle: true,
			supportVehicle: false,
			aerospaceFighter: false,
			smallCraft: false,
			dropShip: false,
			battleArmor: false,
			jumpShip: false,
			warShip: false
		},
		armorMultiplier: {
			clan: 0,
			is: 16,
		},
		crits: {
			clan: 0,
			is: 12,
		},
		critLocs: {
			biped: { ra: 2, rl: 2, rt: 2, la: 2, ll: 2, lt: 2 },
			quad: { frl: 2, rl: 2, rt: 2, fll: 2, ll: 2, lt: 2 }
		},
		costMultiplier: 50000,
		introduced: 3063,
		extinct: 0,
		reintroduced: 0,
		page: 206,
		book: "TM",
		prototype: 3051
	},
	{
		name: "Hardened Armor",
		tag: "hardened",
		alphaStrikeAbility: "CR",
		unitTypes: {
			battlemech: true,
			protomech: false,
			combatVehicle: true,
			supportVehicle: false,
			aerospaceFighter: false,
			smallCraft: false,
			dropShip: false,
			battleArmor: false,
			jumpShip: false,
			warShip: false
		},
		armorMultiplier: {
			clan: 8,
			is: 8,
		},
		crits: {
			clan: 0,
			is: 0,
		},
		critLocs: {},
		costMultiplier: 15000,
		introduced: 3081,
		extinct: 0,
		reintroduced: 0,
		page: 93,
		book: "TO:AUE",
		bvMultiplier: 2,
		clanDates: { prototype: 3061, introduced: 3081, extinct: 0, reintroduced: 0 },
		prototype: 3047
	},
	{
		name: "Laser Reflective Armor",
		tag: "laser-reflective",
		alphaStrikeAbility: "RFA",
		unitTypes: {
			battlemech: true,
			protomech: false,
			combatVehicle: true,
			supportVehicle: false,
			aerospaceFighter: true,
			smallCraft: false,
			dropShip: false,
			battleArmor: false,
			jumpShip: false,
			warShip: false
		},
		armorMultiplier: {
			clan: 16,
			is: 16,
		},
		crits: {
			clan: 5,
			is: 10,
		},
		critLocs: {},
		costMultiplier: 30000,
		introduced: 3080,
		extinct: 0,
		reintroduced: 0,
		page: 93,
		book: "TO:AUE",
		bvMultiplier: 1.5,
		clanDates: { prototype: 3061, introduced: 3080, extinct: 0, reintroduced: 0 },
		prototype: 3058
	},
	{
		name: "Reactive Armor",
		tag: "reactive",
		alphaStrikeAbility: "RCA",
		unitTypes: {
			battlemech: true,
			protomech: false,
			combatVehicle: true,
			supportVehicle: false,
			aerospaceFighter: false,
			smallCraft: false,
			dropShip: false,
			battleArmor: false,
			jumpShip: false,
			warShip: false
		},
		armorMultiplier: {
			clan: 16,
			is: 16,
		},
		crits: { clan: 7, is: 14 },
		critLocs: {},
		costMultiplier: 30000,
		introduced: 3081,
		extinct: 0,
		reintroduced: 0,
		page: 94,
		book: "TO:AUE",
		bvMultiplier: 1.5,
		clanDates: { prototype: 3065, introduced: 3081, extinct: 0, reintroduced: 0 },
		prototype: 3063
	},
	{
		name: "Ferro-Lamellor Armor",
		tag: "ferro-lamellor",
		alphaStrikeAbility: "CR",
		unitTypes: {
			battlemech: true,
			protomech: false,
			combatVehicle: true,
			supportVehicle: false,
			aerospaceFighter: true,
			smallCraft: true,
			dropShip: true,
			battleArmor: false,
			jumpShip: false,
			warShip: false
		},
		armorMultiplier: {
			clan: 14,
			is: 0,
		},
		crits: {
			clan: 12,
			is: 0,
		},
		critLocs: {},
		costMultiplier: 35000,
		introduced: 3109,
		extinct: 0,
		reintroduced: 0,
		page: 92,
		book: "TO:AUE",
		bvMultiplier: 1.2,
		prototype: 3070
	},
	{
		name: "Ballistic-Reinforced Armor",
		tag: "ballistic-reinforced",
		alphaStrikeAbility: "BRA",
		unitTypes: {
			battlemech: true,
			protomech: false,
			combatVehicle: true,
			supportVehicle: false,
			aerospaceFighter: false,
			smallCraft: false,
			dropShip: false,
			battleArmor: false,
			jumpShip: false,
			warShip: false
		},
		armorMultiplier: { clan: 0, is: 16 * 0.75 },
		crits: { clan: 0, is: 10 },
		critLocs: {},
		costMultiplier: 25000,
		introduced: 3131,
		extinct: 0,
		reintroduced: 0,
		page: 81,
		book: "IO_AE",
		bvMultiplier: 1.5,
		prototype: 3120
	},
	{
		name: "Primitive Armor",
		tag: "primitive",
		unitTypes: {
			battlemech: true,
			protomech: false,
			combatVehicle: true,
			supportVehicle: true,
			aerospaceFighter: true,
			smallCraft: false,
			dropShip: false,
			battleArmor: false,
			jumpShip: false,
			warShip: false
		},
		armorMultiplier: { clan: 0, is: 16 * 0.67 },
		crits: {
			clan: 0,
			is: 0,
		},
		critLocs: {},
		costMultiplier: 5000,
		introduced: 2290,
		extinct: 0,
		reintroduced: 0
	},
	{
		name: "Ferro-Aluminum Armor",
		tag: "ferro-aluminum",
		unitTypes: {
			battlemech: false,
			protomech: false,
			combatVehicle: false,
			supportVehicle: false,
			aerospaceFighter: true,
			smallCraft: true,
			dropShip: true,
			battleArmor: false,
			jumpShip: false,
			warShip: false
		},
		armorMultiplier: {
			clan: 1.20,
			is: 1.12,
		},
		crits: {
			clan: 0,
			is: 0,
		},
		critLocs: {},
		costMultiplier: 20000,
		introduced: 2650,
		extinct: 0,
		reintroduced: 0
	},
	{
		name: "Commercial Armor",
		tag: "commercial",
		unitTypes: {
			battlemech: false,
			protomech: false,
			combatVehicle: false,
			supportVehicle: true,
			aerospaceFighter: false,
			smallCraft: false,
			dropShip: false,
			battleArmor: false,
			jumpShip: false,
			warShip: false
		},
		armorMultiplier: {
			clan: 0,
			is: 16,
		},
		crits: {
			clan: 0,
			is: 0,
		},
		critLocs: {},
		costMultiplier: 1200,
		introduced: 2400,
		extinct: 0,
		reintroduced: 0,
		bvMultiplier: 0.5
	},
	{
		name: "Modular Armor",
		tag: "modular",
		constructionStatus: "implemented",
		constructionMode: "equipment",
		unitTypes: {
			battlemech: true,
			protomech: false,
			combatVehicle: true,
			supportVehicle: false,
			aerospaceFighter: false,
			smallCraft: false,
			dropShip: false,
			battleArmor: false,
			jumpShip: false,
			warShip: false
		},
		armorMultiplier: {
			clan: 0,
			is: 16,
		},
		crits: {
			clan: 0,
			is: 1,
		},
		critLocs: {},
		costMultiplier: 15000,
		introduced: 3070,
		extinct: 0,
		reintroduced: 0
	},
	{
		name: "Mimetic Armor",
		tag: "mimetic",
		alphaStrikeAbility: "MAS",
		unitTypes: {
			battlemech: false,
			protomech: false,
			combatVehicle: false,
			supportVehicle: false,
			aerospaceFighter: false,
			smallCraft: false,
			dropShip: false,
			battleArmor: true,
			jumpShip: false,
			warShip: false
		},
		armorMultiplier: {
			clan: 16,
			is: 16,
		},
		crits: {
			clan: 3,
			is: 6,
		},
		critLocs: {},
		costMultiplier: 65000,
		introduced: 3061,
		extinct: 0,
		reintroduced: 0
	},
	{
		name: "Improved Stealth Armor",
		tag: "stealth-improved",
		unitTypes: {
			battlemech: false,
			protomech: false,
			combatVehicle: false,
			supportVehicle: false,
			aerospaceFighter: false,
			smallCraft: false,
			dropShip: false,
			battleArmor: true,
			jumpShip: false,
			warShip: false
		},
		armorMultiplier: {
			clan: 16,
			is: 16,
		},
		crits: {
			clan: 0,
			is: 0,
		},
		critLocs: {},
		costMultiplier: 60000,
		introduced: 3057,
		extinct: 0,
		reintroduced: 0
	},
	{
		name: "Patchwork Armor Setup",
		tag: "patchwork",
		constructionStatus: "deferred",
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
		armorMultiplier: {
			clan: 16,
			is: 16,
		},
		crits: {
			clan: 0,
			is: 0,
		},
		critLocs: {},
		costMultiplier: 12000,
		introduced: 3075,
		extinct: 0,
		reintroduced: 0
	},
	{
		name: "ProtoMech Standard Armor",
		tag: "protomech-standard",
		unitTypes: {
			battlemech: false,
			protomech: true,
			combatVehicle: false,
			supportVehicle: false,
			aerospaceFighter: false,
			smallCraft: false,
			dropShip: false,
			battleArmor: false,
			jumpShip: false,
			warShip: false
		},
		armorMultiplier: {
			clan: 22,
			is: 0,
		},
		crits: {
			clan: 0,
			is: 0,
		},
		critLocs: {},
		costMultiplier: 10000,
		introduced: 3060,
		extinct: 0,
		reintroduced: 0
	},
	{
		name: "Ferro-Fibrous Prototype",
		tag: "ferro-fibrous-prototype",
		unitTypes: { battlemech: true, protomech: false, combatVehicle: true, supportVehicle: true, aerospaceFighter: false, smallCraft: false, dropShip: false, battleArmor: false, jumpShip: false, warShip: false },
		crits: { clan: 0, is: 16 },
		armorMultiplier: { clan: 0, is: 16 * 1.12 },
		costMultiplier: 60000,
		introduced: null,
		extinct: 2571,
		reintroduced: 3034,
		prototype: 2557,
		book: "IO",
		page: null,
		notes: "IO prototype: Experimental rules only."
	},
	{
		name: "Heat-Dissipating Armor",
		tag: "heat-dissipating",
		unitTypes: { battlemech: true, protomech: false, combatVehicle: true, supportVehicle: true, aerospaceFighter: false, smallCraft: false, dropShip: false, battleArmor: false, jumpShip: false, warShip: false },
		crits: { clan: 6, is: 6 },
		armorMultiplier: { clan: 16 * 0.625, is: 16 * 0.625 },
		costMultiplier: 25000,
		introduced: 3123,
		extinct: 0,
		reintroduced: 0,
		prototype: 3115,
		clanDates: { prototype: 3115, introduced: 3126, extinct: 0, reintroduced: 0 },
		bvMultiplier: 1.1,
		book: "IO_AE",
		page: 81
	},
	{
		name: "Impact-Resistant Armor",
		tag: "impact-resistant",
		unitTypes: { battlemech: true, protomech: false, combatVehicle: true, supportVehicle: true, aerospaceFighter: false, smallCraft: false, dropShip: false, battleArmor: false, jumpShip: false, warShip: false },
		crits: { clan: 0, is: 10 },
		armorMultiplier: { clan: 0, is: 16 * 0.875 },
		costMultiplier: 20000,
		introduced: 3103,
		extinct: 0,
		reintroduced: 0,
		prototype: 3090,
		book: "IO_AE",
		page: 81
	},
	{
		name: "Anti-Penetrative Ablation Armor",
		tag: "anti-penetrative-ablation",
		unitTypes: { battlemech: true, protomech: false, combatVehicle: true, supportVehicle: true, aerospaceFighter: false, smallCraft: false, dropShip: false, battleArmor: false, jumpShip: false, warShip: false },
		crits: { clan: 0, is: 6 },
		armorMultiplier: { clan: 0, is: 16 * 0.75 },
		costMultiplier: 15000,
		introduced: 3114,
		extinct: 0,
		reintroduced: 0,
		prototype: 3100,
		bvMultiplier: 1.2,
		book: "IO_AE",
		page: 80
	}
];
