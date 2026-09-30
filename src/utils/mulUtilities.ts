import { btEraOptions } from "../data/era-options";

export function getMULFactionLabels(id: number): string {
    if(id === 1){ return 'Clan Burrock'; }
        if(id === 2){ return 'Clan Blood Spirit'; }
        if(id === 3){ return 'Extinct'; }
        if(id === 4){ return 'Unique'; }
        if(id === 5){ return 'Capellan Confederation'; }
        if(id === 6){ return 'Clan Cloud Cobra'; }
        if(id === 7){ return 'Clan Coyote'; }
        if(id === 8){ return 'Clan Diamond Shark'; }
        if(id === 9){ return 'Circinus Federation'; }
        if(id === 10){ return 'Clan Fire Mandrill'; }
        if(id === 11){ return 'Clan Ghost Bear'; }
        if(id === 12){ return 'Clan Goliath Scorpion'; }
        if(id === 13){ return 'Clan Hell\'s Horses'; }
        if(id === 14){ return 'Clan Ice Hellion'; }
        if(id === 15){ return 'Clan Jade Falcon'; }
        if(id === 16){ return 'Clan Mongoose'; }
        if(id === 17){ return 'Clan Nova Cat'; }
        if(id === 18){ return 'ComStar'; }
        if(id === 19){ return 'Clan Star Adder'; }
        if(id === 20){ return 'Clan Smoke Jaguar'; }
        if(id === 21){ return 'Clan Snow Raven'; }
        if(id === 22){ return 'Clan Steel Viper'; }
        if(id === 23){ return 'Clan Wolf (in Exile)'; }
        if(id === 24){ return 'Clan Wolf'; }
        if(id === 25){ return 'Clan Widowmaker'; }
        if(id === 26){ return 'Clan Wolverine'; }
        if(id === 27){ return 'Draconis Combine'; }
        if(id === 28){ return 'Free Rasalhague Republic'; }
        if(id === 29){ return 'Federated Suns'; }
        if(id === 30){ return 'Free Worlds League'; }
        if(id === 31){ return 'Kell Hounds'; }
        if(id === 32){ return 'Lyran Alliance'; }
        if(id === 33){ return 'Magistracy of Canopus'; }
        if(id === 34){ return 'Mercenary'; }
        if(id === 35){ return 'Marian Hegemony'; }
        if(id === 36){ return 'Outworlds Alliance'; }
        if(id === 38){ return 'Pirates'; }
        if(id === 39){ return 'Raven Alliance'; }
        if(id === 40){ return 'Rasalhague Dominion'; }
        if(id === 41){ return 'Republic of the Sphere'; }
        if(id === 42){ return 'Rim Worlds Republic - Home Guard'; }
        if(id === 43){ return 'Star League Royal'; }
        if(id === 44){ return 'Solaris 7'; }
        if(id === 45){ return 'Star League Regular'; }
        if(id === 46){ return 'Star League (Second)'; }
        if(id === 47){ return 'Taurian Concordat'; }
        if(id === 48){ return 'Word of Blake'; }
        if(id === 49){ return 'Wolf\'s Dragoons'; }
        if(id === 54){ return 'Not Available'; }
        if(id === 55){ return 'Inner Sphere General'; }
        if(id === 56){ return 'IS Clan General'; }
        if(id === 57){ return 'Periphery General'; }
        if(id === 59){ return 'Free Worlds League (Duchy of Andurien)'; }
        if(id === 60){ return 'Lyran Commonwealth'; }
        if(id === 67){ return 'Free Worlds League (Oriente Protectorate)'; }
        if(id === 72){ return 'Free Worlds League (Regulan Fiefs)'; }
        if(id === 74){ return 'Free Worlds League (Marik-Stewart Commonwealth)'; }
        if(id === 75){ return 'Free Worlds League (Duchy of Tamarind-Abbey)'; }
        if(id === 76){ return 'Free Worlds League (Rim Commonality)'; }
        if(id === 77){ return 'Filtvelt Coalition'; }
        if(id === 78){ return 'Calderon Protectorate'; }
        //if(id === 79){ return 'Blank General List'; } We don't need this one
        if(id === 80){ return 'Clan Stone Lion'; }
        if(id === 82){ return 'Clan Sea Fox'; }
        if(id === 83){ return 'St. Ives Compact'; }
        if(id === 84){ return 'Federated Commonwealth'; }
        if(id === 85){ return 'HW Clan General'; }
        if(id === 86){ return 'Society'; }
        if(id === 87){ return 'Terran Hegemony'; }
        if(id === 88){ return 'Rim Worlds Republic - Terran Corps'; }
        if(id === 89){ return 'Free Worlds League (Non-Aligned Worlds)'; }
        if(id === 90){ return 'Star League General'; }
        if(id === 91){ return 'Scorpion Empire'; }
        if(id === 92){ return 'Escorpión Imperio'; }
        if(id === 94){ return 'Star League in Exile'; }
        if(id === 95){ return 'Fronc Reaches'; }
        if(id === 96){ return 'Star League (Clan Wolf)'; }
        if(id === 97){ return 'Star League (Clan Jade Falcon)'; }
        if(id === 98){ return 'Star League (Clan Smoke Jaguar)'; }
        if(id === 100){ return 'Clan Protectorate'; }
        if(id === 101){ return 'Wolf Empire'; }
        if(id === 102){ return 'Alyina Mercantile League'; }
        if(id === 104){ return 'Tamar Pact'; }
        if(id === 105){ return 'Vesper Marches'; }
        if(id === 106){ return 'BA: Other Squad Size in Use'; }
        if(id === 107){ return 'Barber\'s Marauder IIs'; }
        if(id === 108){ return 'No Significant Distribution'; }
        if(id === 109){ return 'Insufficient Data'; }
        if(id === 110){ return 'Spirit Cats'; }
        if(id === 111){ return 'Star League (SLDF)'; }
        // MUL 2.0 factions with no single MUL 1.0 id (see getLegacyMULFactionID in mul-list-items.ts).
        if(id === 1041){ return 'Rim Worlds Republic'; }
        if(id === 1044){ return 'Star League (First)'; }
        if(id === 1076){ return 'ilClan Wolf'; }
        if(id === 1190){ return 'Jade Falcon Remnant'; }
      
        return "";
}

export function getMULFactionIDs(): number[] {
    return [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,38,39,40,41,42,43,44,45,46,47,48,49,54,55,56,57,59,60,67,72,74,75,76,77,78,80,82,83,84,85,86,87,88,89,90,91,92,94,95,96,97,98,100,101,102,104,105,106,107,108,109,110,111,1041,1044,1076,1190];
}

export interface IMULEra {
    id: number;
    label: string;
    yearStart: number;
    yearEnd: number | null;
}

// The Master Unit List's own eras (IDs and start years from the MUL unit data's EraId/EraStart). The MUL
// starts the Age of War in 2005 and the Early Republic in 3081; the Classic eras in era-options.ts follow
// Interstellar Operations instead (Age of War from 2300).
export const mulEras: IMULEra[] = [
    { id: 1, label: "Age of War", yearStart: 2005, yearEnd: 2570 },
    { id: 10, label: "Star League", yearStart: 2571, yearEnd: 2780 },
    { id: 11, label: "Early Succession War", yearStart: 2781, yearEnd: 2900 },
    { id: 255, label: "Late Succession War - LosTech", yearStart: 2901, yearEnd: 3019 },
    { id: 256, label: "Late Succession War - Renaissance", yearStart: 3020, yearEnd: 3049 },
    { id: 13, label: "Clan Invasion", yearStart: 3050, yearEnd: 3061 },
    { id: 247, label: "Civil War", yearStart: 3062, yearEnd: 3067 },
    { id: 14, label: "Jihad", yearStart: 3068, yearEnd: 3080 },
    { id: 15, label: "Early Republic", yearStart: 3081, yearEnd: 3100 },
    { id: 254, label: "Late Republic", yearStart: 3101, yearEnd: 3130 },
    { id: 16, label: "Dark Ages", yearStart: 3131, yearEnd: 3150 },
    { id: 257, label: "ilClan", yearStart: 3151, yearEnd: null },
];

export interface IMULEraAlias {
    /** Filter value for the alias; never a MUL era ID. */
    id: number;
    label: string;
    /** The MUL era searched in its place. */
    mulEraId: number;
}

const MUL_ERA_ALIAS_OFFSET = 1000;

const overlapYears = (startA: number, endA: number | null, startB: number, endB: number | null): number => {
    const end = Math.min(endA ?? 9999, endB ?? 9999);
    return Math.max(0, end - Math.max(startA, startB) + 1);
};

/**
 * The MUL has no Clan eras: it files Clan units by Inner Sphere era. Each Clan era (one the Inner Sphere
 * tech base cannot use) searches the MUL era holding most of its years, so the Golden Years, for example,
 * search the Late Succession War - LosTech.
 */
export function getMULEraAliases(): IMULEraAlias[] {
    return btEraOptions.filter((era) => !era.techBases.includes("is")).map((era) => {
        const mulEra = mulEras.reduce((best, option) =>
            overlapYears(era.yearStart, era.yearEnd, option.yearStart, option.yearEnd)
                > overlapYears(era.yearStart, era.yearEnd, best.yearStart, best.yearEnd) ? option : best);
        return { id: MUL_ERA_ALIAS_OFFSET + era.id, label: `${era.name} (as MUL ${mulEra.label})`, mulEraId: mulEra.id };
    });
}

/** The MUL era ID to search for an era filter value (a MUL era or a Clan era alias). */
export function resolveMULEraFilter(eraFilter: number): number {
    return getMULEraAliases().find((alias) => alias.id === eraFilter)?.mulEraId ?? eraFilter;
}

export function getMULEraLabel(
    id: number,
): string {
    return mulEras.find((era) => era.id === id)?.label
        ?? getMULEraAliases().find((alias) => alias.id === id)?.label
        ?? "n/a";
}

export function getMULEraIDs(): number[] {
    return mulEras.map((era) => era.id);
}

export function getMULTypeLabel(
    id: number,
): string {

    if( id === 18 ) {
        return "BattleMech";
    }
    if( id === 19 ) {
        return "Combat Vehicle";
    }
    if( id === 17 ) {
        return "Aerospace";
    }
    if( id === 21 ) {
        return "Infantry";
    }
    if( id === 22 ) {
        return "Battle Armor";
    }
    if( id === 20 ) {
        return "IndustrialMech";
    }
    if( id === 23 ) {
        return "Protomech";
    }
    if( id === 24 ) {
        return "Support Vehicle ";
    }

    return "n/a";
}

export function getMULTypeIDs(): number[] {
    return [18, 19, 17, 21, 22, 20, 23, 24 ];
}


export function getMULGroundRoles(): string[] {
    return [
        "Ambusher",
        "Brawler",
        "Juggernaut",
        "Missile Boat",
        "Scout",
        "Skirmisher",
        "Sniper",
        "Striker",
     ];
}

export function getMULAerospaceRoles(): string[] {
    return [
        "Attack",
        "Dogfighter",
        "Fast Dogfighter",
        "Fire Support",
        "Interceptor",
        "Transport",
     ];
}
