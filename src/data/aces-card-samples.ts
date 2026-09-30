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

import {
    IAcesCard,
    IAcesCardLibrary,
    IAcesCommandCard,
    IAcesScenario,
    IAcesSpecialOrder,
    ACES_CARD_LIBRARY_VERSION,
} from "./aces-cards";
import { acesSource, acesSSSource } from "./aces-rules";

/*
 * One sample of each record type, transcribed from the examples printed in the rulebooks so players can see how a
 * card is entered. Everything else comes from the players' own cards. Lines the illustration hides are marked
 * unresolved rather than guessed.
 */

/** Sniper 475, both sides, as printed in the guided tutorial (Aces SS pp.6-7). */
export const acesSampleSniper475: IAcesCard = {
    id: "sample-sniper-475",
    deck: "Sniper",
    deckId: "sniper",
    cardNumber: "3/6",
    movePriority: 475,
    combatPriority: 475,
    aggressive: {
        condition: "If there are any [moved] enemies in 18\" and no [notmoved] enemies in 6\"",
        zoneRings: [ 12, 18, 24 ],
        zoneKeyword: "",
        targetInAttackRange: true,
        targetMoved: true,
        targetSelect: "yellow",
        moveType: "ground",
        altMoveType: null,
        altMoveWhen: "",
        filters: [
            "occupy woods",
            "cover vs [highest] enemies",
            "in [lowest] enemy [range]",
        ],
    },
    balanced: {
        condition: "If there are any [moved] enemies in 30\"",
        zoneRings: [ 12, 20, 30 ],
        zoneKeyword: "",
        targetInAttackRange: true,
        targetMoved: false,
        targetSelect: "yellow",
        moveType: "ground",
        altMoveType: "jump",
        altMoveWhen: "if needed",
        filters: [
            "no [notmoved] enemies in 12\"",
            "onto lowest elevation (use [jump] if needed)",
            "occupy woods",
        ],
    },
    cautious: {
        condition: "",
        zoneRings: [],
        zoneKeyword: "nearest",
        targetInAttackRange: false,
        targetMoved: false,
        targetSelect: "",
        moveType: "ground",
        altMoveType: "jump",
        altMoveWhen: "if needed",
        filters: [
            "24\" [spacing] target",
            "[range] [highest] enemies",
            "cover vs [highest] enemies",
            "occupy woods",
        ],
    },
    combat: {
        zoneRings: [ 6, 24 ],
        zoneKeyword: "",
        filters: [
            { text: "Attacked by ally this turn" },
            { text: "[lowest] Armor", stat: "armor", direction: "lowest" },
            { text: "[yellow] command list", color: "yellow" },
        ],
        overheat: [
            { text: "If TN4 or less or if this unit is destroyed: Use maximum OV.", tnAtMost: 4, tnAtLeast: null, join: "or", also: "destroyed", action: "max", ovLimit: null },
            { text: "If TN6 or less and OV might let unit hit target's structure: Use up to 3 OV.", tnAtMost: 6, tnAtLeast: null, join: "and", also: "could-hit-structure", action: "up-to", ovLimit: 3 },
            { text: "If TN9 or more and this unit has any heat: Don't attack.", tnAtMost: null, tnAtLeast: 9, join: "and", also: "has-heat", action: "no-attack", ovLimit: null },
        ],
    },
    source: acesSSSource( 6 ),
    sample: true,
    notes: "Movement side Aces SS p.6, combat side Aces SS p.7.",
};

/** Brawler 383, the Timber Wolf's first card in the guided tutorial (Aces SS pp.6-7). */
export const acesSampleBrawler383: IAcesCard = {
    id: "sample-brawler-383",
    deck: "Brawler",
    deckId: "brawler",
    cardNumber: "4/6",
    movePriority: 383,
    combatPriority: 383,
    aggressive: {
        condition: "If there are any [moved] enemies in 12\"",
        zoneRings: [ 12 ],
        zoneKeyword: "",
        targetInAttackRange: true,
        targetMoved: true,
        targetSelect: "red",
        moveType: "ground",
        altMoveType: null,
        altMoveWhen: "",
        filters: [
            "[closer] target",
            "no [notmoved] enemies in 12\"",
            "occupy woods",
        ],
    },
    balanced: {
        condition: "If there are at least 3 enemies in [los] and 24\"",
        zoneRings: [],
        zoneKeyword: "any",
        targetInAttackRange: true,
        targetMoved: true,
        targetSelect: "nearest",
        moveType: "jump",
        altMoveType: null,
        altMoveWhen: "",
        filters: [
            "no [notmoved] enemies in 12\"",
            "[closer] target",
            "cover vs [highest] enemies",
            "occupy woods",
        ],
    },
    cautious: {
        condition: "",
        zoneRings: [],
        zoneKeyword: "nearest",
        targetInAttackRange: false,
        targetMoved: false,
        targetSelect: "",
        moveType: "ground",
        altMoveType: "jump",
        altMoveWhen: "if needed",
        filters: [
            "[range] target",
            "in [lowest] enemy [range]",
            "cover vs target",
            "18\" [spacing] target",
        ],
    },
    combat: {
        zoneRings: [ 24 ],
        zoneKeyword: "",
        filters: [
            { text: "[lowest] Armor", stat: "armor", direction: "lowest" },
            { text: "[red] command list", color: "red" },
        ],
        overheat: [
            { text: "If TN5 or less or if this unit is destroyed: Use maximum OV.", tnAtMost: 5, tnAtLeast: null, join: "or", also: "destroyed", action: "max", ovLimit: null },
            { text: "If TN7 or less and OV might let unit hit target's structure: Use up to 2 OV.", tnAtMost: 7, tnAtLeast: null, join: "and", also: "could-hit-structure", action: "up-to", ovLimit: 2 },
            { text: "If TN9 or more and this unit has any heat: Don't attack.", tnAtMost: null, tnAtLeast: 9, join: "and", also: "has-heat", action: "no-attack", ovLimit: null },
        ],
    },
    source: acesSSSource( 6 ),
    sample: true,
    notes: "Movement side Aces SS p.6, combat side Aces SS p.7.",
};

/**
 * Star Captain B, Clan Jade Falcon: the Command card anatomy example (Aces p.8). Two Artillery lines are hidden
 * behind a callout in the illustration and are left unresolved.
 */
export const acesSampleStarCaptainB: IAcesCommandCard = {
    id: "sample-star-captain-b",
    deck: "Star Captain",
    faction: "Clan Jade Falcon",
    letter: "B",
    cardNumber: "2/10",
    orders: [
        {
            phase: "initiative",
            text: "Assign the MOVE LAST token to your unit with ([highest] M Damage, [highest] PV).",
            token: "move-last",
            tokenRank: [
                { text: "[highest] M Damage", stat: "damage-m", direction: "highest" },
                { text: "[highest] PV", stat: "pv", direction: "highest" },
            ],
            behavior: null,
        },
    ],
    red: [
        { text: "[lowest] Armor", stat: "armor", direction: "lowest" },
        { text: "[lowest] TMM", stat: "tmm", direction: "lowest" },
        { text: "[highest] PV", stat: "pv", direction: "highest" },
    ],
    yellow: [
        { text: "[destroyobj] Objective", objective: true },
        { text: "[highest] Armor lost", stat: "armor-lost", direction: "highest" },
        { text: "[lowest] TMM", stat: "tmm", direction: "lowest" },
        { text: "[highest] M damage", stat: "damage-m", direction: "highest" },
    ],
    blue: [
        { text: "[destroyobj] Objective", objective: true },
        { text: "[lowest] Structure", stat: "structure", direction: "lowest" },
        { text: "[highest] PV", stat: "pv", direction: "highest" },
        { text: "[highest] MV", stat: "mv", direction: "highest" },
    ],
    supportOrders: "Only spend Battlefield Support card(s) if they will hit target's structure.",
    supportOnlyIfStructure: true,
    emplacementZoneRings: [ 24 ],
    emplacements: [
        { text: "[highest] Structure", stat: "structure", direction: "highest" },
        { text: "[lowest] TMM", stat: "tmm", direction: "lowest" },
        { text: "[highest] M damage", stat: "damage-m", direction: "highest" },
    ],
    artillery: [
        { text: "[highest] Armor lost", stat: "armor-lost", direction: "highest" },
        { text: "[lowest] TMM", stat: "tmm", direction: "lowest" },
        { text: "… enemies in … (hidden in the illustration)", unresolved: true },
        { text: "… damage (hidden in the illustration)", unresolved: true },
    ],
    bsp: [
        { text: "[lowest] Structure", stat: "structure", direction: "lowest" },
        { text: "[highest] enemies in template" },
        { text: "[highest] PV", stat: "pv", direction: "highest" },
        { text: "[highest] MV", stat: "mv", direction: "highest" },
    ],
    strategy: [
        { letter: "E", text: "If this automated force's objective is complete", auto: "objective-complete" },
        { letter: "D", text: "If there is an enemy in one of your unit's rear", auto: "" },
        { letter: "C", text: "If you lost [highest] PV worth of units this turn", auto: "" },
        { letter: "A", text: "If you lost [lowest] PV worth of units this turn", auto: "" },
    ],
    source: acesSource( 8 ),
    sample: true,
    notes: "Artillery lines 3 and 4 are covered by a callout in the rulebook illustration.",
};

/**
 * MechWarrior C, Clan Jade Falcon: the tutorial sortie's starting Command card (Aces SS p.5). Only the front is
 * printed, so the support columns and strategy decisions are empty.
 */
export const acesSampleMechWarriorC: IAcesCommandCard = {
    id: "sample-mechwarrior-c",
    deck: "MechWarrior",
    faction: "Clan Jade Falcon",
    letter: "C",
    cardNumber: "8/10",
    orders: [
        {
            phase: "initiative",
            text: "Assign the MOVE LAST token to your unit with ([highest] S damage, [highest] MV).",
            token: "move-last",
            tokenRank: [
                { text: "[highest] S damage", stat: "damage-s", direction: "highest" },
                { text: "[highest] MV", stat: "mv", direction: "highest" },
            ],
            behavior: null,
        },
    ],
    red: [
        { text: "[highest] Structure lost", stat: "structure-lost", direction: "highest" },
        { text: "[highest] Armor lost", stat: "armor-lost", direction: "highest" },
        { text: "[highest] PV", stat: "pv", direction: "highest" },
    ],
    yellow: [
        { text: "[destroyobj] Objective", objective: true },
        { text: "[lowest] Armor", stat: "armor", direction: "lowest" },
        { text: "[lowest] TMM", stat: "tmm", direction: "lowest" },
        { text: "[lowest] Structure", stat: "structure", direction: "lowest" },
    ],
    blue: [
        { text: "[destroyobj] Objective", objective: true },
        { text: "[highest] Armor lost", stat: "armor-lost", direction: "highest" },
        { text: "[highest] TMM", stat: "tmm", direction: "highest" },
        { text: "[highest] PV", stat: "pv", direction: "highest" },
    ],
    supportOrders: "",
    supportOnlyIfStructure: false,
    emplacementZoneRings: [],
    emplacements: [],
    artillery: [],
    bsp: [],
    strategy: [],
    source: acesSSSource( 5 ),
    sample: true,
    notes: "Front only; the back of this card is not printed in the sortie. Enter it from your own card.",
};

/** Forced Withdrawal Special Order (Aces p.8 card, rules on p.16). */
export const acesSampleForcedWithdrawal: IAcesSpecialOrder = {
    id: "sample-forced-withdrawal",
    kind: "forced-withdrawal",
    name: "Forced Withdrawal",
    cardNumber: "Special Order 1/5",
    priority: -500,
    priorityIsModifier: true,
    rules: [
        "Crippled: no armor left and structure at half its starting value (rounded up) or less; or damage 0 at Medium and Long range; or Move below half through critical hits.",
        "Add -500 to the unit's card priority and use this column instead of the Aces card's behavior columns.",
        "Units under Forced Withdrawal ignore Movement Objectives and effects that change priority numbers (Move Last, etc.).",
    ],
    column: {
        condition: "If this unit is crippled",
        zoneRings: [],
        zoneKeyword: "nearest",
        targetInAttackRange: false,
        targetMoved: false,
        targetSelect: "",
        moveType: "jump",
        altMoveType: null,
        altMoveWhen: "",
        filters: [
            "escape from edge ([sprint] if needed)",
            "[closer] escape edge",
            "cover vs [highest] enemies",
            "[range] nearest enemy",
            "in [lowest] enemy arcs",
        ],
    },
    preFilters: [],
    spotter: [],
    source: acesSource( 16 ),
    sample: true,
    notes: "Card shown on Aces p.8; rules and worked example on Aces p.16.",
};

/** Movement Objective filters 0a-0c (Aces p.17). */
export const acesSampleMovementObjective: IAcesSpecialOrder = {
    id: "sample-movement-objective",
    kind: "movement-objective",
    name: "Movement Objective",
    cardNumber: "",
    priority: null,
    priorityIsModifier: false,
    rules: [
        "Applies only when the sortie gives the automated force a Movement Objective.",
        "These filters come before the Aces card's own filters in every behavior column.",
        "They don't apply when the chosen column only says to stand still.",
    ],
    column: null,
    preFilters: [
        "overlap [moveobj] objective",
        "if enemies also want to overlap [moveobj] objective: [range] [moveobj] objective",
        "[closer] [moveobj] objective",
    ],
    spotter: [],
    source: acesSource( 17 ),
    sample: true,
    notes: "",
};

/** Destroy Objective default stats (Aces p.17). */
export const acesSampleDestroyObjective: IAcesSpecialOrder = {
    id: "sample-destroy-objective",
    kind: "destroy-objective",
    name: "Destroy Objective",
    cardNumber: "",
    priority: null,
    priorityIsModifier: false,
    rules: [
        "Immobile. TMM -4, MV 0; always counts as having moved.",
        "0 damage at all ranges; no OV rating.",
        "A building uses its current CF for Armor/Structure and its starting CF for Size.",
        "Always has the highest PV.",
    ],
    column: null,
    preFilters: [],
    spotter: [],
    source: acesSource( 17 ),
    sample: true,
    notes: "",
};

/** Indirect Attacks Special Order (Aces p.20). */
export const acesSampleIndirectAttacks: IAcesSpecialOrder = {
    id: "sample-indirect-attacks",
    kind: "indirect-attacks",
    name: "Indirect Attacks",
    cardNumber: "Special Order 5/5",
    priority: 0,
    priorityIsModifier: false,
    rules: [
        "Use when any unit with IF or ART has no line of sight to any enemy. Resolve at priority 000.",
        "Pick the target with the Command card's Battlefield Support filters; at least one ally must have line of sight to it.",
        "Pick a spotter with the list below.",
        "Every indirect-firing unit attacks that target this phase.",
        "If the spotter deals less damage than the total IF rating (or ART damage) of all indirect units, it doesn't attack.",
    ],
    column: null,
    preFilters: [],
    spotter: [
        "[los] preferred target",
        "is immobile, or used [standstill] standstill movement",
        "deals [lowest] damage",
        "target has no cover",
    ],
    source: acesSource( 20 ),
    sample: true,
    notes: "",
};

/** 00 - BattleROM Review, the guided tutorial sortie (Aces SS pp.4-5). */
export const acesSampleBattleROMReview: IAcesScenario = {
    id: "sample-ss-00-battlerom-review",
    code: "00",
    name: "BattleROM Review",
    campaign: "Scouring Sands",
    playArea: "48x48\"",
    playerPVLimit: 145,
    playerUnits: [
        { name: "ARC-7C Archer", skill: 4, deck: "", deckId: "" },
        { name: "WHM-8R Warhammer", skill: 4, deck: "", deckId: "" },
        { name: "PXH-4M Phoenix Hawk", skill: 4, deck: "", deckId: "" },
        { name: "LCT-7V Locust", skill: 4, deck: "", deckId: "" },
    ],
    playerUnitsNote: "Without the guided tutorial you may bring your own force of 3-4 units worth up to 145 PV.",
    opposingName: "BattleROM Clan Opponents",
    opposingPV: 113,
    commandDeck: "MechWarrior, Clan Jade Falcon",
    commandStartCard: "C",
    opposingUnits: [
        { name: "Timber Wolf T", skill: 3, deck: "Brawler", deckId: "brawler" },
        { name: "Pouncer Prime", skill: 3, deck: "Sniper", deckId: "sniper" },
    ],
    objectives: [
        { kind: "primary", type: "destroy", text: "Destroy both enemy 'Mechs.", sp: null },
    ],
    turnLimit: 5,
    sortieEnd: "After 5 turns, or when one side has no units left in play. Without the guided tutorial: shuffle the Aces decks and play 7 turns.",
    reconnaissance: "None.",
    waypointSetup: "This sortie does not use Waypoints.",
    waypoints: [],
    specialRules: [],
    deckOrder: [
        { deck: "Brawler", cards: [ "383", "253", "643", "213", "093", "513" ] },
        { deck: "Sniper", cards: [ "475", "535", "265", "625", "785", "345" ] },
    ],
    storyReference: "Briefing: Aces SS p.4.",
    source: acesSSSource( 4 ),
    sample: true,
    notes: "Requires the Multiple Attack Rolls and Front-Loaded optional rules (Aces SS p.4). Terrain setup is on the map on Aces SS p.5.",
};

/** The samples as a library, for loading into the editor. */
export const getAcesSampleLibrary = (): IAcesCardLibrary => {
    const copy = <T>( value: T ): T => JSON.parse( JSON.stringify( value ) );
    return {
        version: ACES_CARD_LIBRARY_VERSION,
        cards: [ copy( acesSampleSniper475 ), copy( acesSampleBrawler383 ) ],
        commandCards: [ copy( acesSampleStarCaptainB ), copy( acesSampleMechWarriorC ) ],
        specialOrders: [
            copy( acesSampleForcedWithdrawal ),
            copy( acesSampleMovementObjective ),
            copy( acesSampleDestroyObjective ),
            copy( acesSampleIndirectAttacks ),
        ],
        scenarios: [ copy( acesSampleBattleROMReview ) ],
    };
}
