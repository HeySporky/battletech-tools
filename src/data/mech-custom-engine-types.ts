import { IEngineType } from "./data-interfaces";

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

export const mechCustomEngineTypes: IEngineType[] = [
	{
		// r/battletech post 1nk9g3e (#249). Weight is read from the light engine's column and movement heat follows
		// the XXL engine (battlemech.ts: getEngineWeightTag, isXXLEngine).
		name: "Mini Engine",
		alternateName: "Minimally Shielded Fusion Engine",
		tag: "mini-engine",
		rulesLevel: 6,
		techBase: "is",
		editions: [],
		criticals: {
			is: { ct: 6 }
		},
		// Not given in the post: the light engine's cost and dates.
		costMultiplier: 15000,
		introduced: 3062,
		extinct: null,
		reintroduced: null,
		rating: 0,
		book: "https://www.reddit.com/r/battletech/comments/1nk9g3e/",
		page: 0,
		notes: "Custom Homebrew by u/VanillaPhysics, 'Homebrew Experimental Tech #2: The Mini Engine', r/battletech: "
			+ "https://www.reddit.com/r/battletech/comments/1nk9g3e/. Made by General Motors (Inner Sphere). From the post: the critical "
			+ "slots of a standard fusion engine, placed the same way; the weight of a light fusion engine of the same rating; heat "
			+ "exactly as an XXL engine (2 standing, 4 walking, 6 running, double jumping heat; the author confirmed this in the "
			+ "comments). In play it is destroyed after two engine hits: mark the first hit as two. "
			+ "Engine-hit heat follows the XXL engine, which has no rule of its own for it (TO:AUE p.121), so the Heat Point Table "
			+ "applies (TW p.159): the first hit, marked as two, adds 10 heat a turn (owner ruling, 2026-11-12; the post left "
			+ "this open when u/Bookwyrm517 asked). "
			+ "Inspired by: u/VanillaPhysics. Ours, not in the post: Battle Value counts it as a standard engine (engine modifier 1.0, "
			+ "no side torso slots); cost and introduction date are the light engine's; it is not offered above a rating of 400 or on "
			+ "superheavy 'Mechs, which the post does not cover. "
			+ "Why Custom Homebrew and not Munchkin: it trades rather than outclasses. Against a light engine it frees four side "
			+ "torso slots and survives losing a side torso, but it carries XXL heat all game and dies at two hits instead of "
			+ "three. On a 200-rated engine the 2 tons saved over a standard engine go back into the heat sinks the extra "
			+ "running heat needs; the saving grows with larger engines. Why engine modifier 1.0: the modifier prices losing "
			+ "the engine with a side torso, and this engine has no side torso slots; its higher heat is already charged "
			+ "through heat efficiency."
	},
	{
		// r/battletech post 1iky8lg (#267). Weight is a third under the standard engine's (battlemech.ts: getEngineWeight);
		// the three side torso slots make hasXLEngine() true, so a lost side torso destroys it.
		name: "Re-Engineered Fusion Engine",
		alternateName: "RFE",
		tag: "re-engineered-fusion",
		rulesLevel: 6,
		techBase: "is",
		editions: [],
		criticals: {
			is: { ct: 3, lt: 3, rt: 3 }
		},
		// Not given in the post: cost and dates. Ours: the light engine's dates, the XL engine's cost.
		costMultiplier: 20000,
		introduced: 3062,
		extinct: null,
		reintroduced: null,
		rating: 0,
		book: "https://www.reddit.com/r/battletech/comments/1iky8lg/",
		page: 0,
		notes: "Custom Homebrew by u/Bookwyrm517, 'Feedback for a custom engine type', r/battletech: "
			+ "https://www.reddit.com/r/battletech/comments/1iky8lg/. From the post: 33% lighter than a standard engine; three "
			+ "slots in each side torso and three in the center torso, which frees three center torso slots as a compact engine does; "
			+ "it is destroyed if a side torso is lost, which the author kept on purpose so it does not outlast a light engine. "
			+ "The post asks for feedback and leaves open a way to survive a side torso loss for a time; none is adopted here. "
			+ "Side ideas from the replies, not adopted: u/FweeCom suggested a side benefit such as more heat sinks in the engine or "
			+ "movement that builds no heat, and u/MasonStonewall engine rating divided by 20 heat sinks. "
			+ "Inspired by: u/Bookwyrm517. Ours, not in the post: the weight is 0.67 of the standard engine's, rounded up to the half ton; "
			+ "heat is a standard engine's; it takes three engine hits to destroy, as every fusion engine; Battle Value and Alpha Strike "
			+ "count it as an XL engine (engine modifier 0.5); cost is the XL engine's and the dates are the light engine's; it is not "
			+ "offered above a rating of 400 or on superheavy 'Mechs, which the post does not cover. "
			+ "Owner's observation (2026-11-16), not the author's: the freed center torso slots make it a good match for tripods and for "
			+ "'Mechs with a center torso cockpit, which are short of center torso space. "
			+ "Why Custom Homebrew and not Munchkin: against an XL engine it is heavier and takes more slots; against a light engine it is "
			+ "lighter but dies with a side torso, so it trades survival for weight and center torso room."
	}
];
