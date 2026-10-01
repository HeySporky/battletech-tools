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
		extinct: null,
		reintroduced: null,
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
		clanDates: { prototype: 2820, introduced: 2825, extinct: null, reintroduced: null },
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
		extinct: null,
		reintroduced: null,
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
		extinct: null,
		reintroduced: null,
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
			clan: 0,
			is: 16,
		},
		crits: {
			clan: 0,
			is: 12,
		},
		critLocs: {
			biped: { ra: 2, rl: 2, rt: 2, la: 2, ll: 2, lt: 2 },
			lam: { ra: 2, rl: 2, rt: 2, la: 2, ll: 2, lt: 2 },
			quad: { frl: 2, rl: 2, rt: 2, fll: 2, ll: 2, lt: 2 },
			quadvee: { frl: 2, rl: 2, rt: 2, fll: 2, ll: 2, lt: 2 },
			tripod: { ra: 2, rl: 2, rt: 2, la: 2, ll: 2, lt: 2, cl: 2 }
		},
		costMultiplier: 50000,
		introduced: 3063,
		extinct: null,
		reintroduced: null,
		page: 206,
		book: "TM",
		prototype: 3051
	},
	{
		name: "Vehicular Stealth Armor",
		tag: "vehicular-stealth",
		alphaStrikeAbility: "STL",
		unitTypes: {
			battlemech: false,
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
		armorMultiplier: {
			clan: 0,
			is: 16,
		},
		crits: {
			clan: 0,
			is: 2,
		},
		critLocs: {},
		costMultiplier: 50000,
		introduced: 3084,
		extinct: null,
		reintroduced: null,
		page: 94,
		book: "TO:AUE",
		prototype: 3067,
		notes: "Vehicles and fighters only; not BattleMech-legal (TO:AUE p.94). 2 item slots; needs an ECM suite and generates 10 heat (TO:AUE p.92). Cost TO:AUE p.217."
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
		extinct: null,
		reintroduced: null,
		page: 93,
		book: "TO:AUE",
		bvMultiplier: 2,
		clanDates: { prototype: 3061, introduced: 3081, extinct: null, reintroduced: null },
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
			supportVehicle: true,
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
		extinct: null,
		reintroduced: null,
		page: 93,
		book: "TO:AUE",
		bvMultiplier: 1.5,
		clanDates: { prototype: 3061, introduced: 3080, extinct: null, reintroduced: null },
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
			supportVehicle: true,
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
		crits: { clan: 7, is: 14 },
		critLocs: {},
		costMultiplier: 30000,
		introduced: 3081,
		extinct: null,
		reintroduced: null,
		page: 94,
		book: "TO:AUE",
		bvMultiplier: 1.5,
		clanDates: { prototype: 3065, introduced: 3081, extinct: null, reintroduced: null },
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
			supportVehicle: true,
			aerospaceFighter: true,
			smallCraft: false,
			dropShip: false,
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
		extinct: null,
		reintroduced: null,
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
			supportVehicle: true,
			aerospaceFighter: true,
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
		extinct: null,
		reintroduced: null,
		page: 81,
		book: "IO:AE",
		bvMultiplier: 1.5,
		prototype: 3120
	},
	{
		name: "Primitive Armor",
		tag: "primitive",
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
		armorMultiplier: { clan: 0, is: 16 * 0.67 },
		crits: {
			clan: 0,
			is: 0,
		},
		critLocs: {},
		costMultiplier: 5000,
		introduced: 2439,
		extinct: null,
		reintroduced: null,
		prototype: 2430,
		book: "IO:AE",
		page: 118,
		notes: "Primitive BattleMech armor (IO:AE p.118); the same 0.67 multiplier and dates as IndustrialMech Industrial armor (TM p.72, p.205). Primitive aerospace fighter armor is a separate item with its own dates (IO:AE p.119)."
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
		introduced: 2571,
		extinct: 2810,
		reintroduced: 3040,
		prototype: 2557,
		book: "TM",
		page: 205,
		notes: "Aerospace name for ferro-fibrous armor (TM p.206); shares its dates. Aerospace points per ton are not modelled here.",
		clanDates: { prototype: 2820, introduced: 2825, extinct: null, reintroduced: null }
	},
	{
		name: "Commercial Armor",
		tag: "commercial",
		unitTypes: {
			battlemech: false,
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
			clan: 16 * 1.5,
			is: 16 * 1.5,
		},
		crits: {
			clan: 0,
			is: 0,
		},
		critLocs: {},
		costMultiplier: 3000,
		introduced: 2300,
		extinct: null,
		reintroduced: null,
		bvMultiplier: 0.5,
		prototype: 2290,
		book: "TM",
		page: 205,
		notes: "IndustrialMech only (TM p.206). BAR 5; 16 x 1.5 points per ton (TM p.72)."
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
			supportVehicle: true,
			aerospaceFighter: true,
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
		introduced: 3096,
		extinct: null,
		reintroduced: null,
		prototype: 3072,
		book: "TO:AUE",
		page: 93,
		clanDates: { prototype: 3074, introduced: 3096, extinct: null, reintroduced: null }
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
		extinct: null,
		reintroduced: null,
		prototype: 3058,
		book: "TM",
		page: 253,
		notes: "Battle armor only (TM p.253). Inner Sphere tech base."
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
		extinct: null,
		reintroduced: null,
		prototype: 3055,
		book: "TM",
		page: 252,
		notes: "Battle armor only (TM p.252).",
		clanDates: { introduced: 3058, extinct: null, reintroduced: null }
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
		extinct: null,
		reintroduced: null,
		book: "TO:AUE",
		page: 189
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
			clan: 20,
			is: 0,
		},
		crits: {
			clan: 0,
			is: 0,
		},
		critLocs: {},
		costMultiplier: 10000,
		introduced: 3060,
		extinct: null,
		reintroduced: null,
		prototype: 3055,
		book: "TM",
		page: 205,
		notes: "ProtoMech only. 50 kg per point (TM p.86)."
	},
	{
		name: "Electric Discharge ProtoMech (EDP) Armor",
		tag: "protomech-edp",
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
			clan: 1000 / 75,
			is: 0,
		},
		crits: {
			clan: 0,
			is: 0,
		},
		critLocs: {},
		costMultiplier: 1250 * (1000 / 75),
		introduced: null,
		extinct: 3085,
		reintroduced: null,
		prototype: 3071,
		book: "IO:AE",
		page: 58,
		notes: "ProtoMech only; prototype that never reached production (IO:AE p.30). 75 kg per point and one fewer torso item (IO:AE p.59); 1,250 C-bills per point (IO:AE p.178); BV 32 as a weapon, no armor modifier (IO:AE p.190)."
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
		book: "IO:AE",
		page: 66,
		notes: "IO:AE p.66 prototype (2557); recovered as a prototype in 3034 (IO:AE p.97). Experimental rules only."
	},
	{
		name: "Heat-Dissipating Armor",
		tag: "heat-dissipating",
		unitTypes: { battlemech: true, protomech: false, combatVehicle: false, supportVehicle: false, aerospaceFighter: false, smallCraft: false, dropShip: false, battleArmor: false, jumpShip: false, warShip: false },
		crits: { clan: 6, is: 6 },
		armorMultiplier: { clan: 16 * 0.625, is: 16 * 0.625 },
		costMultiplier: 25000,
		introduced: 3123,
		extinct: null,
		reintroduced: null,
		prototype: 3111,
		clanDates: { introduced: 3126, extinct: null, reintroduced: null },
		bvMultiplier: 1.1,
		book: "IO:AE",
		page: 81
	},
	{
		name: "Impact-Resistant Armor",
		tag: "impact-resistant",
		unitTypes: { battlemech: true, protomech: false, combatVehicle: false, supportVehicle: false, aerospaceFighter: false, smallCraft: false, dropShip: false, battleArmor: false, jumpShip: false, warShip: false },
		crits: { clan: 0, is: 10 },
		armorMultiplier: { clan: 0, is: 16 * 0.875 },
		costMultiplier: 20000,
		introduced: 3103,
		extinct: null,
		reintroduced: null,
		prototype: 3092,
		book: "IO:AE",
		page: 81
	},
	{
		name: "Anti-Penetrative Ablation Armor",
		tag: "anti-penetrative-ablation",
		unitTypes: { battlemech: true, protomech: false, combatVehicle: true, supportVehicle: true, aerospaceFighter: true, smallCraft: false, dropShip: false, battleArmor: false, jumpShip: false, warShip: false },
		crits: { clan: 0, is: 6 },
		armorMultiplier: { clan: 0, is: 16 * 0.75 },
		costMultiplier: 15000,
		introduced: 3114,
		extinct: null,
		reintroduced: null,
		prototype: 3105,
		bvMultiplier: 1.2,
		book: "IO:AE",
		page: 80
	}
];
