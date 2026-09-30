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

/*
 * BattleTech: Aces (solo/co-op automated opponent and campaign system for Alpha Strike).
 *
 * Only the rulebook's procedure, tables and campaign math are encoded here, summarized in our own words and
 * cited to the printed page. Aces, Command, Special Order, Edge ability and Named Pilot card text and the
 * Campaign Book sortie stories are NOT shipped: players read those from their own box and enter what the app
 * needs (priority numbers, card ids, Command card target lists).
 *
 * Page numbers are the printed pages of the Aces rulebook (Aces) and the Scouring Sands Campaign Book (Aces SS).
 */

export const ACES_BOOK = "BattleTech: Aces Rulebook";
export const ACES_SS_BOOK = "BattleTech: Aces - Scouring Sands";

export interface IAcesSource {
    book: string;
    page: number;
}

export const acesSource = ( page: number ): IAcesSource => {
    return { book: ACES_BOOK, page: page };
}

export const acesSSSource = ( page: number ): IAcesSource => {
    return { book: ACES_SS_BOOK, page: page };
}

/* ---------------------------------------------------------------------------------------------------------------
 * Additional rules for Alpha Strike (Aces pp. 3-6)
 * ------------------------------------------------------------------------------------------------------------- */

/** Indirect fire: the spotter must be within this many inches of the target (Aces p.3). */
export const ACES_IF_SPOTTER_MAX_RANGE = 42;
/** Target number modifier for an indirect fire attack (Aces p.3). */
export const ACES_IF_MODIFIER = 1;
/** Extra modifier on both the IF attack and the spotter's own attack when the spotter also attacks (Aces p.3). */
export const ACES_IF_SPOTTER_ATTACKING_MODIFIER = 1;

export type TAcesMotiveEffect = "none" | "minus2-move-minus1-tmm" | "halve-move-tmm" | "immobilized";

export interface IAcesTableRow<T> {
    min: number;
    max: number;
    effect: T;
    label: string;
}

/** Motive Systems Damage Table; hover (h) and wheeled (w) units add +1 to the roll (Aces p.4). */
export const acesMotiveSystemsTable: IAcesTableRow<TAcesMotiveEffect>[] = [
    { min: 2, max: 8, effect: "none", label: "No effect" },
    { min: 9, max: 10, effect: "minus2-move-minus1-tmm", label: "-2\" Move, -1 TMM" },
    { min: 11, max: 11, effect: "halve-move-tmm", label: "Halve Move and TMM (round down)" },
    { min: 12, max: 12, effect: "immobilized", label: "Unit immobilized" },
];
export const ACES_MOTIVE_HOVER_WHEELED_MODIFIER = 1;

export type TAcesVehicleCritical =
    "ammo" | "crew-stunned" | "fire-control" | "weapon" | "mp" | "crew-killed" | "engine";

/**
 * Aces Vehicle Critical Hit Table (Aces p.4). This differs from the Combat Vehicles table in Alpha Strike:
 * Commander's Edition. A first vehicle engine hit halves (round down) Move, TMM and damage at all ranges; a
 * second destroys the unit.
 */
export const acesVehicleCriticalHitTable: IAcesTableRow<TAcesVehicleCritical>[] = [
    { min: 2, max: 2, effect: "ammo", label: "Ammo Hit" },
    { min: 3, max: 3, effect: "crew-stunned", label: "Crew Stunned: no move or attack next turn; treated as immobile" },
    { min: 4, max: 5, effect: "fire-control", label: "Fire Control Hit" },
    { min: 6, max: 6, effect: "weapon", label: "Weapon Hit" },
    { min: 7, max: 7, effect: "mp", label: "MP Hit" },
    { min: 8, max: 10, effect: "weapon", label: "Weapon Hit" },
    { min: 11, max: 11, effect: "crew-killed", label: "Crew Killed: the unit is destroyed" },
    { min: 12, max: 12, effect: "engine", label: "Engine Hit (Vehicles): halve Move, TMM and damage; second hit destroys" },
];

export const lookupAcesTable = <T>( table: IAcesTableRow<T>[], roll: number ): IAcesTableRow<T> => {
    const clamped = Math.max( table[0].min, Math.min( table[table.length - 1].max, roll ) );
    for( const row of table ) {
        if( clamped >= row.min && clamped <= row.max ) {
            return row;
        }
    }
    return table[table.length - 1];
}

/** Move cost per inch; null = prohibited (Aces p.4 ground vehicles, p.5 infantry). */
export interface IAcesMovementCostRow {
    terrain: string;
    tracked: number | null;
    wheeled: number | null;
    hover: number | null;
    infantry: number | null;
    note: string;
}

export const acesMovementCostTable: IAcesMovementCostRow[] = [
    { terrain: "Base move", tracked: 1, wheeled: 1, hover: 1, infantry: 1, note: "" },
    { terrain: "Clear, paved, road, bridge, water depth 0\"", tracked: 0, wheeled: 0, hover: 0, infantry: 0, note: "Additional inches per inch" },
    { terrain: "Rough, rubble", tracked: 1, wheeled: null, hover: 1, infantry: 1, note: "" },
    { terrain: "Woods", tracked: 1, wheeled: null, hover: null, infantry: 0, note: "" },
    { terrain: "Level change (1\")", tracked: 4, wheeled: 4, hover: 4, infantry: 4, note: "Level changes of more than 1\" at a time are prohibited" },
    { terrain: "Water depth 1\"+", tracked: null, wheeled: null, hover: 0, infantry: null, note: "Hover vehicles move along the surface" },
];

/** Infantry pay this many inches of Move to mount a transport; dismounting uses up to half MV, rounded up (Aces p.5). */
export const ACES_INFANTRY_MOUNT_COST = 2;
/** An Omni transport hit applies to the mounted battle armor instead on 1D6 of this or more (Aces p.6). */
export const ACES_OMNI_TRANSPORT_BA_HIT_ON = 5;

/** Emplacement modifiers (Aces p.6). */
export const ACES_EMPLACEMENT_TARGET_MODIFIER = -4;
export const ACES_EMPLACEMENT_ATTACK_MODIFIER = -1;

/** Anti-'Mech physical attack modifiers (Aces p.5). */
export const ACES_AM_ATTACK_MODIFIER = 1;
export const ACES_AM_CONVENTIONAL_INFANTRY_MODIFIER = 3;
export const ACES_AM_TARGET_CARRYING_BA_MODIFIER = 3;
export const ACES_BATTLE_ARMOR_TARGET_MODIFIER = 1;

/* ---------------------------------------------------------------------------------------------------------------
 * Automated opponent (Aces pp. 8-21, 38-39)
 * ------------------------------------------------------------------------------------------------------------- */

/** Special priority tokens (Aces p.8) and the Forced Withdrawal priority modifier (Aces p.16, Special Order card). */
export const ACES_MOVE_FIRST_PRIORITY = 0;
export const ACES_MOVE_LAST_PRIORITY = 1000;
export const ACES_FORCED_WITHDRAWAL_PRIORITY_MODIFIER = -500;
/** Automated units ignore a target whose Target Number would be 13 or more (Aces p.18). */
export const ACES_MAX_AUTOMATED_TARGET_NUMBER = 12;
/** Cards in one Aces deck (Aces p.10). */
export const ACES_CARDS_PER_DECK = 6;

export type TAcesDeckId =
    "ambusher-infantry" | "brawler" | "missile-boat" | "juggernaut" | "scout" | "skirmisher" | "sniper" |
    "striker" | "scout-hover" | "striker-hover" | "skirmisher-jmps";

export interface IAcesDeck {
    id: TAcesDeckId;
    name: string;
    /** The MUL unit role this deck plays. */
    role: string;
    /** Summary in our own words. */
    summary: string;
    /** Product the deck ships in. */
    product: "Aces" | "Scouring Sands";
    source: IAcesSource;
}

export const acesDecks: IAcesDeck[] = [
    { id: "ambusher-infantry", name: "Ambusher (Infantry)", role: "Ambusher", product: "Aces", source: acesSource(39),
        summary: "Stays hidden and in cover until a target is close or offers a rear shot. Best for short-range units, usually infantry." },
    { id: "brawler", name: "Brawler", role: "Brawler", product: "Aces", source: acesSource(39),
        summary: "Advances boldly to medium or short range and soaks hits to deal maximum damage." },
    { id: "missile-boat", name: "Missile Boat", role: "Missile Boat", product: "Aces", source: acesSource(39),
        summary: "Behavior depends on IF#. Low IF plays like a Brawler; high IF stays out of line of sight and uses spotters." },
    { id: "juggernaut", name: "Juggernaut", role: "Juggernaut", product: "Aces", source: acesSource(39),
        summary: "Uses high armor and damage to dominate firing lanes and force the players to react." },
    { id: "scout", name: "Scout", role: "Scout", product: "Aces", source: acesSource(39),
        summary: "Advances but stays at range; values clear line of sight so it can spot for indirect fire." },
    { id: "skirmisher", name: "Skirmisher", role: "Skirmisher", product: "Aces", source: acesSource(39),
        summary: "Uses speed to flank and keep its distance; between Brawler and Striker." },
    { id: "sniper", name: "Sniper", role: "Sniper", product: "Aces", source: acesSource(39),
        summary: "Holds defensive positions in cover with good lines of sight and takes long-range shots." },
    { id: "striker", name: "Striker", role: "Striker", product: "Aces", source: acesSource(39),
        summary: "Closes aggressively to short range or the target's rear to strike at the right time." },
    { id: "scout-hover", name: "Scout (Hover)", role: "Scout", product: "Scouring Sands", source: acesSSSource(20),
        summary: "Scout deck for wheeled (w) or hover (h) units; keeps safe engagement distances to spot and harass." },
    { id: "striker-hover", name: "Striker (Hover)", role: "Striker", product: "Scouring Sands", source: acesSSSource(20),
        summary: "Striker deck for wheeled (w) or hover (h) units; gets close or behind targets." },
    { id: "skirmisher-jmps", name: "Skirmisher (JMPS)", role: "Skirmisher", product: "Scouring Sands", source: acesSSSource(20),
        summary: "Skirmisher deck for units with Strong Jump Jets (JMPS#); favors jumping and rear shots." },
];

export const getAcesDeck = ( id: string ): IAcesDeck | null => {
    return acesDecks.find( (deck) => deck.id === id ) || null;
}

/** Behavior columns on an Aces card, checked left to right; Cautious is the default (Aces p.11). */
export const acesBehaviors = [ "Aggressive", "Balanced", "Cautious" ];

/** Steps to activate an automated unit in the Movement Phase (Aces p.11). */
export const acesMovementSteps = [
    "Check Command and Special Order cards",
    "Determine behavior",
    "Identify the target",
    "Resolve movement",
    "Facing",
    "Flip Aces card",
];

/** Steps for each automated unit in the Combat Phase (Aces p.18). */
export const acesCombatSteps = [
    "Check Command and Special Order cards",
    "Identify target",
    "Check for Overheat Value",
    "Roll the attack",
    "Cycle Aces card",
];

/** Summaries of the Aces golden rules (Aces p.10). */
export const acesGoldenRules = [
    "Do what's best: when the card leaves options open, choose the one that benefits the automated unit or force most.",
    "Keep the game moving: follow the intent of the card and rule 1 rather than fixing minor mistakes.",
];

/** Order of the End Phase in a campaign sortie (Aces p.32). */
export const acesEndPhaseSteps = [
    "End Phase sortie special rules",
    "Apply damage and check for crippled units (Forced Withdrawal)",
    "Heat",
    "Check objectives and game end",
    "Commander strategy decision (back of the current Command card)",
    "Next turn and Waypoints on the turn track",
];

/** Initiative modifiers (Aces p.32). */
export const ACES_INITIATIVE_LAST_WINNER_MODIFIER = -2;
export const ACES_INITIATIVE_COMMANDER_DESTROYED_MODIFIER = -2;

/** Non-campaign difficulty options (Aces p.38). */
export const acesNonCampaignDifficulty = [
    { id: "easier-pv", label: "Automated force ~80% of player PV", pvPercent: 80, skillChange: 0 },
    { id: "easier-skill", label: "Automated units Skill +1 (PV not recalculated)", pvPercent: 100, skillChange: 1 },
    { id: "harder-pv", label: "Automated force ~120% of player PV", pvPercent: 120, skillChange: 0 },
    { id: "harder-skill", label: "Automated units Skill -1 (PV not recalculated)", pvPercent: 100, skillChange: -1 },
];

/* ---------------------------------------------------------------------------------------------------------------
 * Campaign (Aces pp. 24-37)
 * ------------------------------------------------------------------------------------------------------------- */

/** Optional Alpha Strike rules a campaign must use (Aces p.24). */
export const acesRequiredOptionalRules = [
    "Multiple Attack Rolls",
    "\"Front-Loaded\" Unequal Numbers of Units (Aces p.6)",
];

/** Waypoint scan range in inches; the unit must not have Sprinted (Aces p.24). */
export const ACES_WAYPOINT_SCAN_RANGE = 4;
export const acesWaypointScanRanges: { ability: string, range: number }[] = [
    { ability: "LPRB", range: 8 },
    { ability: "PRB", range: 12 },
    { ability: "BH", range: 16 },
];

/** Ways to spend Edge (Aces p.24). */
export const acesEdgeUses = [
    "Add a Pip: +1 to one attack roll after rolling, once per Combat Phase (a raised 12 does not cause a critical hit)",
    "Reroll a Motive Systems Damage roll against your unit (one Edge per check)",
    "Reroll a Critical Hit roll against your unit (one Edge per critical hit)",
    "Use an Edge Ability",
];

/** Force creation (Aces p.26). */
export const ACES_STARTING_PV = 400;
export const ACES_MIN_UNITS = 8;
export const ACES_FORCE_SKILL = 4;
export const ACES_ADVANCED_FORCE_TYPES = [ "BM", "BA", "CV", "CI" ];
/** At most two 'Mechs of one chassis, and they may not be the same variant (Aces p.26). */
export const ACES_MAX_MECHS_PER_CHASSIS = 2;
/** At most two of the same chassis and variant for other unit types (Aces p.26). */
export const ACES_MAX_OTHER_PER_VARIANT = 2;
/** Unspent PV converts to SP at this rate (Aces pp.26, 29). */
export const ACES_UNSPENT_PV_TO_SP = 40;
/** Existing-force warchest is raised to at least this much (Aces p.29). */
export const ACES_EXISTING_FORCE_MIN_WARCHEST = 400;

/** Named Pilots (Aces p.27). */
export const ACES_MIN_NAMED_PILOTS = 2;
export const ACES_MAX_NAMED_PILOTS = 6;
export const ACES_NAMED_PILOT_STARTING_SP = 150;
export const ACES_NAMED_PILOT_TYPES = [ "BM", "CV", "BA" ];

/** SP thresholds printed on the Named Pilot card: cumulative SP in a column to reach each value (Aces pp.27, 29). */
export interface IAcesPilotThreshold {
    value: number;
    sp: number;
}
export const acesPilotSkillThresholds: IAcesPilotThreshold[] = [
    { value: 4, sp: 0 },
    { value: 3, sp: 400 },
    { value: 2, sp: 900 },
    { value: 1, sp: 1900 },
    { value: 0, sp: 3400 },
];
export const acesPilotEdgeTokenThresholds: IAcesPilotThreshold[] = [
    { value: 1, sp: 0 },
    { value: 2, sp: 60 },
    { value: 3, sp: 120 },
    { value: 4, sp: 200 },
    { value: 5, sp: 300 },
    { value: 6, sp: 420 },
    { value: 7, sp: 560 },
    { value: 8, sp: 720 },
    { value: 9, sp: 900 },
    { value: 10, sp: 1100 },
];
export const acesPilotEdgeAbilityThresholds: IAcesPilotThreshold[] = [
    { value: 0, sp: 0 },
    { value: 1, sp: 60 },
    { value: 2, sp: 180 },
    { value: 3, sp: 360 },
    { value: 4, sp: 600 },
    { value: 5, sp: 900 },
];

export interface IAcesDifficultyLevel {
    id: "rookie" | "standard" | "veteran" | "elite" | "legendary";
    name: string;
    /** Change to the player force PV allowed each sortie, in percent. */
    pvModifier: number;
    /** SP earned from objectives, in percent. */
    spPercent: number;
    recommendedFor: string;
}

/** Campaign Difficulty Adjustments (Aces p.28). Legendary is "-30% PV or less". */
export const acesDifficultyLevels: IAcesDifficultyLevel[] = [
    { id: "rookie", name: "Rookie", pvModifier: 20, spPercent: 120, recommendedFor: "New to both Alpha Strike and Aces, or a casual game" },
    { id: "standard", name: "Standard", pvModifier: 0, spPercent: 100, recommendedFor: "Some Alpha Strike experience, new to Aces" },
    { id: "veteran", name: "Veteran", pvModifier: -10, spPercent: 90, recommendedFor: "Experienced with Alpha Strike or some Aces experience" },
    { id: "elite", name: "Elite", pvModifier: -20, spPercent: 80, recommendedFor: "Experts of both Alpha Strike and Aces" },
    { id: "legendary", name: "Legendary", pvModifier: -30, spPercent: 70, recommendedFor: "Expert commanders with something to prove" },
];

/** Existing Force Difficulty Modifiers, by total SP earned by all Named Pilots (Aces p.29). */
export const acesExistingForceBrackets: { minSP: number, maxSP: number | null, pvModifier: number }[] = [
    { minSP: 0, maxSP: 3000, pvModifier: 0 },
    { minSP: 3001, maxSP: 6000, pvModifier: -10 },
    { minSP: 6001, maxSP: 9000, pvModifier: -20 },
    { minSP: 9001, maxSP: 12000, pvModifier: -30 },
    { minSP: 12001, maxSP: null, pvModifier: -40 },
];

/** OMNI reconfiguration: Size x5 SP if the new variant is equal or lower PV, else PV difference x40 (Aces p.31). */
export const ACES_OMNI_RECONFIGURE_SIZE_MULTIPLIER = 5;
export const ACES_OMNI_RECONFIGURE_PV_MULTIPLIER = 40;

/** Salvage Check targets on 2D6 (Aces p.33). */
export const acesSalvageTargets: { [type: string]: number } = {
    BM: 4,
    CV: 6,
    BA: 8,
    CI: 10,
};

export type TAcesCrewResult = "killed" | "wounded" | "unscathed";

/** Crew condition roll for each destroyed unit, 2D6; Edge cannot reroll it (Aces p.33). */
export const acesCrewTable: IAcesTableRow<TAcesCrewResult>[] = [
    { min: 2, max: 3, effect: "killed", label: "Killed and must be replaced" },
    { min: 4, max: 6, effect: "wounded", label: "Wounded (generic crew replaced; Named Pilot skips the next sortie)" },
    { min: 7, max: 12, effect: "unscathed", label: "Unscathed" },
];

/** Expenses (Aces p.34). */
export const ACES_REARM_COST_PER_UNIT = 20;
export const ACES_WOUNDED_CREW_COST = 100;
export const ACES_NEW_NAMED_PILOT_COST = 150;

export type TAcesRepairCategory = "destroyed" | "crippled" | "structure-or-critical" | "armor-only" | "none";

/** Repair cost per point of Size; non-BattleMech units count half Size, not rounded (Aces p.34). */
export const acesRepairMultipliers: { [category in TAcesRepairCategory]: number } = {
    "destroyed": 100,
    "crippled": 60,
    "structure-or-critical": 40,
    "armor-only": 20,
    "none": 0,
};

/** Named Pilots who sat out get half share (Aces p.35); MVP bonus is not taken from earnings. */
export const ACES_MVP_BONUS = 20;

/** Buying and selling units (Aces p.36): always the Skill 4 PV. */
export const ACES_PURCHASE_SP_PER_PV = 40;
export const ACES_SELL_SP_PER_PV = 20;

/* ---------------------------------------------------------------------------------------------------------------
 * Scouring Sands
 * ------------------------------------------------------------------------------------------------------------- */

/** Unit Availability List: Apolakkia (Aces SS p.20). SP cost is PV x40. */
export const acesScouringSandsAvailability: { name: string, type: "BM" | "CV", pv: number }[] = [
    { name: "Howler", type: "BM", pv: 20 },
    { name: "Crimson Hawk", type: "BM", pv: 21 },
    { name: "RFL-3N Rifleman", type: "BM", pv: 26 },
    { name: "Ion Sparrow Prime", type: "BM", pv: 30 },
    { name: "Pouncer Prime", type: "BM", pv: 31 },
    { name: "Griffin IIC", type: "BM", pv: 31 },
    { name: "RFL-5D Rifleman", type: "BM", pv: 32 },
    { name: "Hellcat (Hellhound II)", type: "BM", pv: 36 },
    { name: "Shadow Hawk IIC", type: "BM", pv: 37 },
    { name: "Incubus", type: "BM", pv: 38 },
    { name: "STK-5S Stalker", type: "BM", pv: 38 },
    { name: "BLR-1G BattleMaster", type: "BM", pv: 40 },
    { name: "Phoenix Hawk IIC 5", type: "BM", pv: 44 },
    { name: "Phoenix Hawk IIC 3", type: "BM", pv: 45 },
    { name: "Rifleman IIC 5", type: "BM", pv: 46 },
    { name: "Hierofalcon Prime", type: "BM", pv: 46 },
    { name: "Phoenix Hawk IIC 7", type: "BM", pv: 47 },
    { name: "Night Gyr Prime", type: "BM", pv: 47 },
    { name: "Thresher Mk II", type: "BM", pv: 49 },
    { name: "Tiburon", type: "BM", pv: 50 },
    { name: "Rifleman IIC 8", type: "BM", pv: 50 },
    { name: "Warhammer IIC", type: "BM", pv: 50 },
    { name: "Phoenix Hawk IIC 4", type: "BM", pv: 51 },
    { name: "Jade Phoenix Prime", type: "BM", pv: 53 },
    { name: "Cardinal Transport", type: "CV", pv: 28 },
    { name: "Kite Reconnaissance Vehicle", type: "CV", pv: 30 },
];
