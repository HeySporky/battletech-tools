import { MUL_FACTIONS } from "../data/mul-factions";

// Faction labels and ids are the live MUL's (MUL 2.0), the same ids the bundled Availability data uses.
const MUL_FACTION_NAME_BY_ID = new Map(MUL_FACTIONS.map((faction) => [faction.id, faction.name]));

export function getMULFactionLabels(id: number): string {
    return MUL_FACTION_NAME_BY_ID.get(id) ?? "";
}

export function getMULFactionIDs(): number[] {
    return MUL_FACTIONS.map((faction) => faction.id);
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
