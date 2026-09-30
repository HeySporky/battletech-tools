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
 *
 * Based upon and expanded from the BattleTech Master Unit List eras: https://masterunitlist.battletech.com/eras
 */

// Tech bases that can design in each era (Interstellar Operations: Alternate Eras, pp.8-11). Clan designs run
// from the Star League through the Clan Founding Years and Golden Years, then join the Inner Sphere eras at
// the Clan Invasion; after the Jihad, Homeworld Clan designs may also use the Post-Reaving era. Mixed Tech
// (either base) starts at the Clan Invasion: before it, Clan designs use the Clans' own copies of Star League
// equipment.
const IS_ONLY = ["is"];
const CLAN_ONLY = ["clan"];
const IS_AND_CLAN = ["is", "clan"];
const CLAN_BASE = ["clan", "mclan"];
const ALL_TECH = ["is", "clan", "mis", "mclan"];

export const btEraOptions: IEras[] = [
	{
		id: 1,
		name: "Age of War (2300-2570)",
		tag: "age-of-war",
		yearStart: 2300,
		yearEnd: 2570,
		techBases: IS_ONLY,
		description: "The Master Unit List starts this era in 2005."
	},
	{
		id: 2,
		name: "Star League (2571-2780)",
		tag: "star-league",
		yearStart: 2571,
		yearEnd: 2780,
		techBases: IS_AND_CLAN
	},
	{
		id: 14,
		name: "Clan Founding Years (2800-2840)",
		tag: "clan-founding-years",
		altTags: ["the-exodus", "the-founding"],
		yearStart: 2800,
		yearEnd: 2840,
		techBases: CLAN_ONLY,
		description: "The Exodus (2784) and the founding of the Clans; Star League technology gives way to the first Clan designs (IO:AE p.9)."
	},
	{
		id: 12,
		name: "Clan Golden Years (2841-3049)",
		tag: "clan-golden-years",
		altTags: ["golden-century", "political-century"],
		yearStart: 2841,
		yearEnd: 3049,
		techBases: CLAN_ONLY,
		description: "The Clans' Golden Century and Political Century, up to the invasion of the Inner Sphere (IO:AE p.9)."
	},
	{
		id: 3,
		name: "Early Succession War (2781-2900)",
		tag: "early-sw",
		yearStart: 2781,
		yearEnd: 2900,
		techBases: IS_ONLY
	},
	{
		id: 4,
		name: "Late Succession War - LosTech (2901-3019)",
		tag: "late-sw-lt",
		yearStart: 2901,
		yearEnd: 3019,
		techBases: IS_ONLY
	},
	{
		id: 5,
		name: "Late Succession War - Renaissance (3020-3049)",
		tag: "late-sw-rn",
		yearStart: 3020,
		yearEnd: 3049,
		techBases: IS_ONLY
	},
	{
		id: 6,
		name: "Clan Invasion (3050-3061)",
		tag: "clan-inv",
		yearStart: 3050,
		yearEnd: 3061,
		techBases: ALL_TECH
	},
	{
		id: 7,
		name: "Civil War (3062-3067)",
		tag: "civil-war",
		yearStart: 3062,
		yearEnd: 3067,
		techBases: ALL_TECH
	},
	{
		id: 8,
		name: "Jihad (3068-3085)",
		tag: "jihad",
		yearStart: 3068,
		yearEnd: 3085,
		techBases: ALL_TECH
	},
	{
		id: 16,
		name: "Early Republic (3086-3100)",
		tag: "early-rep",
		yearStart: 3086,
		yearEnd: 3100,
		techBases: ALL_TECH
	},
	{
		id: 9,
		name: "Late Republic (3101-3130)",
		tag: "late-rep",
		yearStart: 3101,
		yearEnd: 3130,
		techBases: ALL_TECH
	},
	{
		id: 10,
		name: "Dark Ages (3131-3150)",
		tag: "dark-ages",
		yearStart: 3131,
		yearEnd: 3150,
		techBases: ALL_TECH
	},
	{
		id: 17,
		name: "Clan Post-Reaving (3086-3150)",
		tag: "clan-post-reaving",
		yearStart: 3086,
		yearEnd: 3150,
		techBases: CLAN_BASE,
		description: "The Homeworld Clans after the Wars of Reaving (IO:AE p.11). Clans in the Inner Sphere use the Republic and Dark Age eras."
	},
	{
		id: 11,
		name: "ilClan (3151+)",
		tag: "ilClan",
		yearStart: 3151,
		yearEnd: null,
		techBases: ALL_TECH
	}
];

/** The era with this tag, or one it replaced (saved designs keep their old era tags). */
export function findEraByTag(tag: string): IEras | undefined {
	return btEraOptions.find((era) => era.tag === tag)
		?? btEraOptions.find((era) => era.altTags?.includes(tag));
}

/** The eras a design with this tech base (a tech option tag) can be built in, in chronological order. */
export function getErasForTech(techTag: string): IEras[] {
	return btEraOptions.filter((era) => era.techBases.includes(techTag));
}

export function isEraAvailableForTech(era: IEras, techTag: string): boolean {
	return era.techBases.includes(techTag);
}

/**
 * The era to use when `era` is not open to `techTag`: the tech base's era that contains the start of `era`,
 * else its next era, else its latest one. Returns `era` itself when the tech base can use it.
 */
export function getClosestEraForTech(era: IEras, techTag: string): IEras {
	const eras = getErasForTech(techTag);
	if (eras.length === 0 || eras.includes(era)) {
		return era;
	}
	return eras.find((option) => option.yearStart <= era.yearStart && (option.yearEnd ?? Infinity) >= era.yearStart)
		?? eras.filter((option) => option.yearStart >= era.yearStart).sort((a, b) => a.yearStart - b.yearStart)[0]
		?? eras[eras.length - 1];
}
