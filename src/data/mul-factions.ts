/*
 * DISCLAIMER: This file processes gameplay data derived from the BattleTech universe.
 * All official lore, trademarks, and intellectual property belong strictly to
 * Catalyst Game Labs, Topps, and/or their respective corporate rights holders.
 *
 * This open-source utility is a non-commercial fan project designed purely for
 * tabletop gameplay assistance. Content processed by this file is not intended
 * to challenge any copyright or trademark status, and this data is explicitly
 * excluded from the software's underlying license (GNU GPLv3).
 */

// Factions of the live Master Unit List (masterunitlist.battletech.com, MUL 2.0), from the
// site's published data/factions.<hash>.json (listed in data/manifest.json), copied 2026-11-24.
// The bundled unit data's Availability[].FactionIds use these ids. They match the old MUL 1.0
// ids only up to 36: from 37 on, MUL 2.0 renumbered (Pirates is 37 here, 38 in MUL 1.0).
export interface IMULFaction {
    id: number;
    name: string;
}

export const MUL_FACTIONS: readonly IMULFaction[] = [
    { id: 1, name: "Clan Burrock" },
    { id: 2, name: "Clan Blood Spirit" },
    { id: 5, name: "Capellan Confederation" },
    { id: 6, name: "Clan Cloud Cobra" },
    { id: 7, name: "Clan Coyote" },
    { id: 8, name: "Clan Diamond Shark" },
    { id: 9, name: "Circinus Federation" },
    { id: 10, name: "Clan Fire Mandrill" },
    { id: 11, name: "Clan Ghost Bear" },
    { id: 12, name: "Clan Goliath Scorpion" },
    { id: 13, name: "Clan Hell's Horses" },
    { id: 14, name: "Clan Ice Hellion" },
    { id: 15, name: "Clan Jade Falcon" },
    { id: 16, name: "Clan Mongoose" },
    { id: 17, name: "Clan Nova Cat" },
    { id: 18, name: "ComStar" },
    { id: 19, name: "Clan Star Adder" },
    { id: 20, name: "Clan Smoke Jaguar" },
    { id: 21, name: "Clan Snow Raven" },
    { id: 22, name: "Clan Steel Viper" },
    { id: 23, name: "Clan Wolf (in Exile)" },
    { id: 24, name: "Clan Wolf" },
    { id: 25, name: "Clan Widowmaker" },
    { id: 26, name: "Clan Wolverine" },
    { id: 27, name: "Draconis Combine" },
    { id: 28, name: "Free Rasalhague Republic" },
    { id: 29, name: "Federated Suns" },
    { id: 30, name: "Free Worlds League" },
    { id: 31, name: "Kell Hounds" },
    { id: 32, name: "Lyran Alliance" },
    { id: 33, name: "Magistracy of Canopus" },
    { id: 34, name: "Mercenary" },
    { id: 35, name: "Marian Hegemony" },
    { id: 36, name: "Outworlds Alliance" },
    { id: 37, name: "Pirates" },
    { id: 38, name: "Raven Alliance" },
    { id: 39, name: "Rasalhague Dominion" },
    { id: 40, name: "Republic of the Sphere" },
    { id: 41, name: "Rim Worlds Republic" },
    { id: 43, name: "Solaris 7" },
    { id: 44, name: "Star League (First)" },
    { id: 45, name: "Star League (Second)" },
    { id: 46, name: "Taurian Concordat" },
    { id: 47, name: "Word of Blake" },
    { id: 48, name: "Wolf's Dragoons" },
    { id: 53, name: "Duchy of Andurien (FWL)" },
    { id: 54, name: "Lyran Commonwealth" },
    { id: 55, name: "Oriente Protectorate (FWL)" },
    { id: 56, name: "Regulan Fiefs (FWL)" },
    { id: 57, name: "Marik-Stewart Commonwealth (FWL)" },
    { id: 58, name: "Duchy of Tamarind-Abbey (FWL)" },
    { id: 59, name: "Rim Commonality (FWL)" },
    { id: 60, name: "Filtvelt Coalition" },
    { id: 61, name: "Calderon Protectorate" },
    { id: 62, name: "Clan Stone Lion" },
    { id: 63, name: "Clan Sea Fox" },
    { id: 64, name: "St. Ives Compact" },
    { id: 65, name: "Federated Commonwealth" },
    { id: 67, name: "Society" },
    { id: 68, name: "Terran Hegemony" },
    { id: 70, name: "Non-Aligned Worlds (FWL)" },
    { id: 73, name: "Scorpion Empire" },
    { id: 74, name: "Star League in Exile" },
    { id: 75, name: "Fronc Reaches" },
    { id: 76, name: "ilClan Wolf" },
    { id: 79, name: "Clan Protectorate" },
    { id: 80, name: "Wolf Empire" },
    { id: 81, name: "Alyina Mercantile League" },
    { id: 82, name: "Tamar Pact" },
    { id: 83, name: "Vesper Marches" },
    { id: 190, name: "Jade Falcon Remnant" },
];
