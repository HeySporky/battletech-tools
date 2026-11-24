// The parts of mordel.net's API answers (/api/v1) the app reads. Field names are the API's own.

export type MordelType = "bm" | "cv" | "im" | "pm";

export const MORDEL_TYPES: MordelType[] = ["bm", "cv", "im", "pm"];

export interface IMordelAlphaStrike {
    type: string;
    size: number;
    move: string;
    tmm: number;
    armor: number;
    structure: number;
    /** "0*" is minimal damage. */
    /** The API gives short, medium and long only (no extreme), so `extreme` stays unset on live units. */
    damage: { short: string; medium: string; long: string; extreme?: string };
    overheat: number;
    point_value: number;
    specials: string[];
}

export interface IMordelNameParts {
    name: string;
    alternate_name: string | null;
    model: string;
}

/** A row of the list: the API's list fields, plus the extras our shipped list carries. */
export interface IMordelListRow {
    unit_type: string;
    unit_type_short: MordelType;
    id: number;
    name: string;
    designer?: string | null;
    /** public, semi_private or private. A key sees its owner's own units at every level. */
    privacy?: "public" | "semi_private" | "private";
    canon: boolean;
    tech_base: string;
    mixed_tech?: boolean;
    era?: string | null;
    year: number | null;
    rules_level?: string | null;
    extinct?: boolean;
    tons: number;
    battle_value: number | null;
    point_value: number | null;
    cost?: number | null;
    omni?: boolean;
    omni_base_id?: number | null;
    created?: number | null;
    updated: number | null;
    url?: string;
    name_parts?: IMordelNameParts | null;
    mul_id?: number | null;
    role?: string | null;
    alpha_strike?: IMordelAlphaStrike | null;
}

export interface IMordelTyped { type: string | null; technology?: string | null; tons?: number | null }

export interface IMordelEquipment {
    /** Numbers an item within its unit (the entries of an item spread over locations share it); null on slotless items. */
    id: number | null;
    name: string;
    model?: string | null;
    /** H, CT, LT, RT, LA, RA, LL, RL, ... or null. */
    location: string | null;
    technology: string | null;
    slots: number;
    facing?: string | null;
    associated_id?: number | null;
    /** A stacked item: "Compartment, Infantry" in half-ton increments, a drone control system by drones. */
    stacks?: { count: number; unit: string } | null;
    armored?: boolean;
    capacitor?: boolean;
    dumper?: boolean;
    fixed?: boolean;
    insulator?: boolean;
    linked?: boolean;
    pulse_module?: boolean;
    sponson_turret?: boolean;
}

export interface IMordelLocation {
    location: string;
    code: string;
    armor: number;
    rear_armor: number | null;
    structure: number;
    /** Patchwork armor: this location's own type. */
    armor_type?: IMordelTyped | null;
    structure_type?: IMordelTyped | null;
}

export interface IMordelDetail extends IMordelListRow {
    image_url?: string | null;
    /** Download address per format (record_sheet, alpha_strike_card, megamek and the five texts), or null. */
    files?: Record<string, string | null>;
    /** For an Omni base: the variants the key can see. Empty otherwise. */
    omni_variants?: { id: number; name: string }[];
    retrotech?: boolean;
    frankenmech?: boolean;
    communications_model?: string | null;
    /** Omni Combat Vehicles: the fixed weight of each turret. */
    omni_turret_tons?: { turret: number | null; front_turret: number | null; sponson_turrets: number | null } | null;
    tech_rating?: string | null;
    configuration?: string | null;
    sources?: { title: string; publisher?: string; year?: number }[];
    manufacturers?: { manufacturer: string; factories: string[] }[];
    /** 'Mechs and ProtoMechs: walk, run, jump. Vehicles: cruise, flank, jump. */
    movement?: { walk?: number; run?: number; cruise?: number; flank?: number; jump?: number; mechanical_jump_booster?: number; [key: string]: number | undefined };
    engine?: IMordelTyped & { rating?: number; model?: string | null };
    heat_sinks?: IMordelTyped & { count?: number };
    structure?: IMordelTyped & { model?: string | null };
    armor?: IMordelTyped & { model?: string | null; points?: number };
    gyro?: IMordelTyped;
    cockpit?: IMordelTyped;
    myomer?: IMordelTyped;
    jump_jets?: IMordelTyped & { model?: string | null };
    targeting?: IMordelTyped & { model?: string | null };
    fire_control?: { artemis: string | null; apollo: boolean; clan_case: boolean };
    turret_config?: string | null;
    locations?: IMordelLocation[];
    equipment?: IMordelEquipment[];
    fluff?: Record<string, string | null> | null;
}

/** "bm/23454": the key a unit is stored and cached by. */
export const mordelKeyOf = (unit: { unit_type_short: string; id: number }): string => `${unit.unit_type_short}/${unit.id}`;
