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

interface IBattlemechLocation {
    tag: string;
    rear: boolean;
    name: string;
    abbr: string;
}

export const battlemechLocations: IBattlemechLocation[] = [
	{
		tag: "hd",
		rear: false,
		name:  "Head",
		abbr:  "hd",
	},
	{
		tag: "hdr",
		rear: true,
		name: "Head (Rear)",
		abbr: "hd(r)",
	},
	{
		tag: "rt",
		rear: false,
		name:  "Right Torso",
		abbr: "rt",
	},
	{
		tag: "ct",
		rear: false,
		name:  "Center Torso",
		abbr: "ct",
	},
	{
		tag: "lt",
		rear: false,
		name:  "Left Torso",
		abbr: "lt",
	},
	{
		tag: "rtr",
		rear: true,
		name: "Right Torso (Rear)",
		abbr: "rt(r)",
	},
	{
		tag: "ctr",
		rear: true,
		name: "Center Torso (Rear)",
		abbr: "ct(r)",
	},
	{
		tag: "ltr",
		rear: true,
		name: "Left Torso (Rear)",
		abbr: "lt(r)",
	},
	{
		tag: "ra",
		rear: false,
		name: "Right Arm",
		abbr: "ra",
	},
	{
		tag: "la",
		rear: false,
		name: "Left Arm",
		abbr: "la",
	},
	{
		tag: "rl",
		rear: false,
		name: "Right Leg",
		abbr: "rl",
	},
	{
		tag: "ll",
		rear: false,
		name: "Left Leg",
		abbr: "ll",
	}
];
