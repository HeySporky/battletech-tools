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
      
        return "";
}

export function getMULFactionIDs(): number[] {
    return [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,38,39,40,41,42,43,44,45,46,47,48,49,54,55,56,57,59,60,67,72,74,75,76,77,78,80,82,83,84,85,86,87,88,89,90,91,92,94,95,96,97,98,100,101,102,104,105,106,107,108,109,110,111];
}

export function getMULEraLabel(
    id: number,
): string {

    if( id === 10 ) {
        return "Star League";
    } else if( id === 11 ) {
        return "Early Succession War";
    } else  if( id === 255 ) {
        return "Late Succession War - LosTech";
    } else if( id === 256 ) {
        return "Late Succession War - renaissance";
    } else if( id === 13 ) {
        return "Clan Invasion";
    } else if( id === 247 ) {
        return "Civil War";
    } else if( id === 14 ) {
        return "Jihad";
    } else if( id === 15 ) {
        return "Early Republic";
    } else if( id === 254 ) {
        return "Late Republic";
    } else if( id === 16 ) {
        return "Dark Ages";
    } else if( id === 257 ) {
        return "ilClan";
    }
    return "n/a";
}

export function getMULEraIDs(): number[] {
    return [10, 11, 255, 256, 13, 247, 14, 15, 254, 16, 257]
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
    return [18, 19, 17, 21, 20, 23, 24 ];
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
