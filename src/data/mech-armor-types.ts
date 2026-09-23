import { IArmorType } from "./data-interfaces";

/*
 * The data here is/may be copyrighted and NOT included in the GPLv3 license.
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
		reintroduced: 0
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
		reintroduced: 3040
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
		reintroduced: 0
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
		reintroduced: 0
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
			lam: { ra: 2, rl: 2, rt: 2, la: 2, ll: 2, lt: 2 },
			quad: { frl: 2, rl: 2, rt: 2, fll: 2, ll: 2, lt: 2 },
			quadvee: { frl: 2, rl: 2, rt: 2, fll: 2, ll: 2, lt: 2 },
			tripod: { ra: 2, rl: 2, rt: 2, la: 2, ll: 2, lt: 2, cl: 2 }
		},
		costMultiplier: 50000,
		introduced: 3063,
		extinct: 0,
		reintroduced: 0
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
		introduced: 3047,
		extinct: 0,
		reintroduced: 0
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
		introduced: 3058,
		extinct: 0,
		reintroduced: 0
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
		crits: {
			clan: 5,
			is: 10,
		},
		critLocs: {},
		costMultiplier: 40000,
		introduced: 3063,
		extinct: 0,
		reintroduced: 0
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
		costMultiplier: 60000,
		introduced: 3070,
		extinct: 0,
		reintroduced: 0
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
		armorMultiplier: {
			clan: 16,
			is: 16,
		},
		crits: {
			clan: 5,
			is: 10,
		},
		critLocs: {},
		costMultiplier: 35000,
		introduced: 3108,
		extinct: 0,
		reintroduced: 0
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
		armorMultiplier: {
			clan: 0,
			is: 10,
		},
		crits: {
			clan: 0,
			is: 0,
		},
		critLocs: {},
		costMultiplier: 5000,
		introduced: 2439,
		extinct: 2550,
		reintroduced: 3070
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
		reintroduced: 0
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
			battlemech: true,
			protomech: false,
			combatVehicle: true,
			supportVehicle: false,
			aerospaceFighter: true,
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
];
