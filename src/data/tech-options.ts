import { ITechOptions } from "./data-interfaces";

/*
 * The data here is/may be copyrighted and NOT included in the GPLv3 license.
 */

export const btTechOptions: ITechOptions[] = [
	{
		id: 1,
		tag: "is",
		name: 'Inner Sphere'
	},
	{
		id: 2,
		tag: "clan",
		name: 'Clan'
	},
	{
		id: 3,
		tag: "mis",
		name: 'Mixed - IS Base'
	},
	{
		id: 4,
		tag: "mclan",
		name: 'Mixed - Clan Base',
	}
];

export function getTechOptions(): ITechOptions[] {
    return btTechOptions;
}

