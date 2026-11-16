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

import { IBattledroidsRulesTable } from "./battledroids-rules";

/**
 * The five optional play rules of The Best of Future Wars, Volume One (1991; cited BoFW), as rules summaries in our
 * own words (#172, Best of Future Wars plan Chunk D). Every number is read from the page image; the tables are given
 * in full where a game needs them at hand. Calls the article leaves open are marked "Ours".
 */
export interface IFutureWarsPlayRules {
    summary: string;
    tables: IBattledroidsRulesTable[];
}

export const FUTURE_WARS_PLAY_RULESET_IDS = [
    "fw-opportunity-fire",
    "fw-strategic-movement",
    "fw-morale",
    "fw-weapon-malfunctions",
    "fw-long-range-wars",
] as const;

const BOOK = "The Best of Future Wars, Volume One (1991)";

/** Source titles for the registry, "<Author>, '<Title>', <book>, p.N". */
export const FUTURE_WARS_PLAY_SOURCES: Record<typeof FUTURE_WARS_PLAY_RULESET_IDS[number], string> = {
    "fw-opportunity-fire": `Charles J. Tomaszewski, 'Rules Variant: Opportunity Fire', ${BOOK}, p.17`,
    "fw-strategic-movement": `H. Barents, 'Strategic Movement for BattleTech', ${BOOK}, pp.18-19`,
    "fw-morale": `H. Barents, 'Stand, I Say!!! Morale in BattleTech', ${BOOK}, pp.22-26`,
    "fw-weapon-malfunctions": `Karl Bruanning, 'Weapons Malfunctions During Combat', ${BOOK}, p.29`,
    "fw-long-range-wars": `Herb Barents, 'The Long Range Wars', ${BOOK}, pp.55-56`,
};

const futureWarsPlayRules: Record<string, IFutureWarsPlayRules> = {
    "fw-opportunity-fire": {
        summary: "During the Movement Phase, before any other fire is declared, a 'Mech may shoot one weapon at an enemy the moment "
            + "that enemy crosses its line of sight. The mover stops while the shot is resolved, then finishes its move; damage that "
            + "would hinder its movement takes effect from the next phase. The firer's other weapons shoot in the Weapon Attack "
            + "Phase as usual, at +1. To keep play moving, mark where the line of sight was crossed and resolve the opportunity "
            + "shots first in the Weapon Attack Phase.",
        tables: [{
            title: "Opportunity Fire",
            page: "BoFW p.17",
            rows: [
                ["When", "The target crosses the firer's line of sight during the Movement Phase; the firer claims the shot at once"],
                ["Weapons", "One, and not a missile weapon"],
                ["To-hit at short / medium / long", "6 / 8 / 10 (Gunnery 4), plus the usual targeting modifiers"],
                ["Target walked / ran / jumped", "+0 / +1 / +2; hexes moved are not counted"],
                ["Firer moved this turn", "+2"],
                ["Terrain", "As usual"],
                ["The firer's other weapons", "Fire in the Weapon Attack Phase at +1, as if after a torso twist"],
            ],
            note: "Ours: with a Gunnery Skill other than 4, the to-hit numbers move by the difference.",
        }],
    },
    "fw-strategic-movement": {
        summary: "For games on more than four map sheets only: a unit may move at double speed to reach or leave the fight. It gets "
            + "no target movement modifier while doing so, builds heat fast, may not fire or make physical attacks, and must stop "
            + "the moment it is attacked. A unit already in the fight may use it only after a full turn in which it neither fired "
            + "nor was fired on.",
        tables: [{
            title: "Strategic Movement",
            page: "BoFW pp.18-19",
            rows: [
                ["Map", "More than four map sheets; never on four or fewer"],
                ["Movement", "Walking and running MP doubled"],
                ["Heat, walking", "2, plus 1 for each MP beyond the normal walking MP"],
                ["Heat, running", "2, plus 2 for each MP beyond the normal running MP"],
                ["Turning", "2 MP a hexside, and a Piloting Skill Roll for each; a fall on a failure"],
                ["Target movement modifier", "None while using Strategic Movement"],
                ["Combat", "No firing and no physical attacks; stops the moment the unit is attacked"],
                ["To start", "A full turn before with no firing by the unit and none at it"],
            ],
            note: "Article's example: an Atlas (3 / 5) runs 10 for 2 + 2 x 5 = 12 heat. Ours: the extra heat counts MP beyond the "
                + "unit's normal walk or run, as the example does (the closing summary says \"every MP used\").",
        }],
    },
    "fw-morale": {
        summary: "A unit has a morale class: Militia, Green, Regular, Veteran, Elite or Crack. When a check is called for, roll 2D6: "
            + "the class's number or more passes. On a failure, roll 2D6 again, add the modifiers, and apply the result on the "
            + "unit's table. Results last one turn unless the table says otherwise; a rout takes the unit off the board, and a "
            + "second rout (or a rout and a broken, for vehicles and infantry) means surrender. Carry On penalties to fire and "
            + "physical attacks last the current turn; drops on the morale scale last the game. Results may be kept secret on "
            + "the record sheet.",
        tables: [
            {
                title: "Morale check",
                page: "BoFW p.24",
                rows: [
                    ["Militia / Green / Regular / Veteran / Elite / Crack", "7 / 7 / 6 / 6 / 5 / 5"],
                    ["Pass", "2D6 equal to the number or more"],
                    ["Fail", "2D6 again, plus the modifiers, on the results table"],
                ],
                note: "Ours: vehicles and infantry use the same numbers (the article says they are treated as 'Mechs are).",
            },
            {
                title: "When a 'Mech checks",
                page: "BoFW p.23",
                rows: [
                    ["Head hit", "A hit to the head (named in the text on p.23, not in the chart)"],
                    ["Internal damage", "The first, and each later hit that does internal damage (one roll a hit)"],
                    ["Damage spread", "Three or more locations damaged, armor or internal"],
                    ["Hit while shaken", "Hit while disorganized, broken or routed"],
                    ["A friend routs","A friendly unit within 10 hexes and in LOS rolls -5 on the results table"],
                    ["Piloting", "Each failed Piloting Skill Roll"],
                    ["Fire", "Set on fire (Inferno rounds)"],
                ],
                note: "No armor breach, no check.",
            },
            {
                title: "'Mech modifiers",
                page: "BoFW p.24",
                rows: [
                    ["Militia / Green / Regular / Veteran / Elite / Crack", "-2 / -1 / 0 / +1 / +2 / +3"],
                    ["Behind its own lines", "+1"],
                    ["Each friendly 'Mech within 10 hexes or in LOS", "+1"],
                    ["Behind a hill, partial cover", "+1"],
                    ["Totally behind a hill", "+2"],
                    ["In light woods", "+1"],
                    ["Behind light woods", "+1"],
                    ["Each hex of heavy woods", "+2"],
                    ["Behind smoke", "+1"],
                    ["Lance leader", "+1"],
                    ["Lost leg", "-5"],
                    ["Lost arm", "-3"],
                    ["Internal damage: leg", "-3"],
                    ["Internal damage: arm", "-1"],
                    ["Internal damage: center torso", "-2"],
                    ["Internal damage: head", "-3"],
                    ["Critical: engine", "-1"],
                    ["Critical: sensor", "-1"],
                    ["Critical: shoulder", "-1"],
                    ["Critical: hip", "-2"],
                    ["Critical: foot actuator", "-1"],
                    ["Critical: each weapon", "-1"],
                    ["Critical: jump jets", "-1"],
                    ["Out of ammo", "-1"],
                    ["On fire from an Inferno round", "-4"],
                    ["Hex on fire", "-2"],
                    ["Disorganized", "-1"],
                    ["Broken", "-2"],
                    ["Routed", "-3"],
                ],
            },
            {
                title: "'Mech results (2D6 + modifiers)",
                page: "BoFW p.24",
                rows: [
                    ["-5", "Routed 3 turns; leaves the battle as soon as it can; no combat; every friendly unit within 10 hexes and in LOS checks morale"],
                    ["-4", "Routed 2 turns; leaves the battle as soon as it can; no combat"],
                    ["-3", "Routed 1 turn; leaves the battle as soon as it can; physical attacks in defense only, at +8"],
                    ["-2", "Broken 4 turns; retreats to the map edge away from every enemy; physical attacks in defense only, at +8; no firing; off the map is out of the game"],
                    ["-1", "Broken 3 turns; retreats to the map edge; physical attacks in defense only, at +7; no firing; off the map is out of the game"],
                    ["0", "Broken 2 turns; retreats to the map edge; physical attacks in defense only, at +6; no firing; off the map is out of the game"],
                    ["1", "Broken 3 turns; runs for friendly cover; physical attacks in defense only, at +4; no firing"],
                    ["2", "Broken 2 turns; walks for friendly cover; physical attacks in defense only, at +4; no firing"],
                    ["3", "Broken 1 turn; walks for friendly cover; physical attacks in defense only, at +4; no firing"],
                    ["4", "Disorganized 2 turns; no forward movement, may retreat at full speed; physical attacks +2; firing +5"],
                    ["5", "Disorganized 1 turn; no forward movement, may retreat at full speed; physical attacks +2; firing +3"],
                    ["6", "Disorganized 1 turn; half forward movement, may retreat at full speed; physical attacks +2; firing +2"],
                    ["7", "Disorganized 1 turn; half forward movement, may retreat at full speed; physical attacks +2; firing +1"],
                    ["8", "Carry on; down 2 on the morale scale"],
                    ["9", "Carry on; down 1 on the morale scale"],
                    ["10", "Carry on; -2 on later rolls on this table"],
                    ["11", "Carry on; -1 on later rolls on this table"],
                    ["12", "Carry on; +1 on later rolls on this table"],
                    ["13", "Carry on; +2 on later rolls on this table"],
                    ["14+", "No effect"],
                ],
            },
            {
                title: "When a vehicle checks",
                page: "BoFW p.25",
                rows: [
                    ["Hit by 'Mech fire", "Each time"],
                    ["Armor", "Half the side, front or turret armor gone"],
                    ["Rear", "Any rear hit"],
                    ["Movement", "MP lost"],
                ],
                note: "No more than one check a turn. A disorganized, broken or routed vehicle still takes damage.",
            },
            {
                title: "Vehicle modifiers",
                page: "BoFW p.25",
                rows: [
                    ["Militia / Green / Regular / Veteran / Elite / Crack", "-3 / -2 / -1 / 0 / +2 / +3"],
                    ["Behind a hill", "+2"],
                    ["In light woods", "+1"],
                    ["Each hex of light woods", "+1"],
                    ["Behind heavy cover (stone wall, building and the like)", "+2"],
                    ["In heavy woods", "+2"],
                    ["Behind smoke", "+2"],
                    ["Lance leader", "+1"],
                    ["Side armor hit", "-1"],
                    ["Front armor gone", "-2"],
                    ["Turret armor hit", "-1"],
                    ["Weapon", "-2"],
                    ["Each MP lost", "-1"],
                    ["Immobile", "-4"],
                    ["Disorganized", "-1"],
                    ["Broken", "-3"],
                    ["Routed", "-5"],
                    ["Out of ammo", "-3"],
                ],
            },
            {
                title: "Vehicle results (2D6 + modifiers)",
                page: "BoFW p.25",
                rows: [
                    ["2 or less", "Rout; leaves as soon as it can; every unit in LOS checks morale; surrenders if immobile"],
                    ["3", "Rout; leaves as soon as it can; surrenders if immobile"],
                    ["4", "Broken 4 turns; retreats at full speed; no combat"],
                    ["5", "Broken 3 turns; retreats at full speed; no combat"],
                    ["6", "Broken 2 turns; retreats facing the enemy; +6 to fire"],
                    ["7", "Disorganized; no movement; +4 to fire"],
                    ["8", "Disorganized; half movement toward the enemy; +3 to fire"],
                    ["9", "Disorganized; half movement toward the enemy; +2 to fire"],
                    ["10", "Carry on; down 2 on the morale scale; -2 on later rolls on this table"],
                    ["11", "Carry on; down 2 on the morale scale"],
                    ["12", "Carry on; down 1 on the morale scale"],
                    ["13+", "No effect"],
                ],
                note: "A second rout, or a rout after a broken result, means surrender.",
            },
            {
                title: "When infantry checks",
                page: "BoFW p.25",
                rows: [
                    ["Hit", "Each time it is hit"],
                    ["Strength", "When it falls below half strength"],
                    ["In a building", "The building takes the hit: no check unless the unit is below half strength"],
                ],
            },
            {
                title: "Infantry modifiers",
                page: "BoFW p.25",
                rows: [
                    ["Militia / Green / Regular / Veteran / Elite / Crack", "-3 / -2 / 0 / +1 / +3 / +5"],
                    ["In light woods", "+2"],
                    ["In heavy woods", "+3"],
                    ["Each woods hex between", "+1"],
                    ["In a light building", "+1"],
                    ["In a medium building", "+2"],
                    ["In a heavy building", "+3"],
                    ["In a hardened building", "+5"],
                    ["Behind smoke", "+1"],
                    ["Behind walls and the like", "+1"],
                    ["Fired on by a 'Mech", "-2"],
                    ["Every fourth trooper lost", "-1"],
                    ["Caught in the open", "-3"],
                    ["Woods on fire", "-5"],
                    ["Building on fire", "-3"],
                    ["Building destroyed", "-5"],
                    ["Disorganized", "-1"],
                    ["Broken", "-3"],
                    ["Routed", "-5"],
                ],
            },
            {
                title: "Infantry results (2D6 + modifiers)",
                page: "BoFW p.26",
                rows: [
                    ["1 or less", "Rout; leaves as soon as it can; surrenders with no clear way out"],
                    ["2", "Broken 2 turns; retreats away from the enemy, by cover across open ground; no fire"],
                    ["3", "Broken 1 turn; retreats from the enemy; no fire"],
                    ["4", "Disorganized 1 turn; no forward movement; +4 to fire"],
                    ["5", "Disorganized; half forward movement; +2 to fire"],
                    ["6", "Carry on; down 1 on the morale scale"],
                    ["7+", "No effect"],
                ],
                note: "Two routs, or a rout and a broken result, mean surrender. Ours: the article's \"1\" covers every lower total.",
            },
        ],
    },
    "fw-weapon-malfunctions": {
        summary: "A to-hit roll of 2 always misses. The weapon then rolls on its kind's malfunction table, and the result is noted "
            + "on the record sheet; most results last the rest of the game. Lasers roll 3D6, missiles and autocannons 2D6, "
            + "flamers 1D6.",
        tables: [
            {
                title: "Flamers (1D6)",
                page: "BoFW p.29",
                rows: [
                    ["1", "No effect"],
                    ["2", "Range cut to 2 hexes"],
                    ["3", "+2 heat a turn when used"],
                    ["4", "No effect"],
                    ["5", "+2 heat a turn and +2 to-hit"],
                    ["6", "Chemicals explode: 2D6 damage, and 1D6 heat for 1D6 turns"],
                ],
            },
            {
                title: "Missiles (2D6)",
                page: "BoFW p.29",
                rows: [
                    ["2", "No effect"],
                    ["3", "No effect"],
                    ["4", "Jam: a Piloting Skill Roll at +2 clears it"],
                    ["5", "No effect"],
                    ["6", "Serious jam: a Piloting Skill Roll and a Gunnery Skill Roll at +3 clear it"],
                    ["7", "No effect"],
                    ["8", "Catastrophic jam: three Piloting Skill Rolls in a row, at +3, +2 and +1, with no running or jumping, clear it"],
                    ["9", "Sights off: +2 to-hit"],
                    ["10", "Sights off: +1 to-hit"],
                    ["11", "Shielding breaks down: +2 heat a use"],
                    ["12", "Missile explodes on launch: 2D6 damage and 1D6 heat"],
                ],
            },
            {
                title: "Autocannons and machine guns (2D6)",
                page: "BoFW p.29",
                rows: [
                    ["2", "No effect"],
                    ["3", "Round jams: a Piloting Skill Roll at +3 clears it, with no movement or firing while clearing"],
                    ["4", "Casing fails to clear: a Piloting Skill Roll at +2 with no firing clears it. Until then it can fire at +1 to-hit and +1 heat for each turn fired (the third turn: +3 and +3); after 5 turns of firing only a repair roll clears it"],
                    ["5", "Shielding loss: +1 heat a turn when fired"],
                    ["6", "Ammo jam: Piloting and Gunnery Skill Rolls at +1 clear it"],
                    ["7", "No effect"],
                    ["8", "No effect"],
                    ["9", "Sights damaged: +2 to-hit"],
                    ["10", "Sights off a little: +1 to-hit"],
                    ["11", "Casing jams in the ejector: no way to clear it; the weapon is out of action"],
                    ["12", "Round explodes in the barrel: the autocannon's damage to its location; the weapon is destroyed"],
                ],
            },
            {
                title: "Lasers (3D6)",
                page: "BoFW p.29",
                rows: [
                    ["3", "No effect"],
                    ["4", "No effect"],
                    ["5", "No effect"],
                    ["6", "Minor shielding loss: +1 heat when used"],
                    ["7", "Major shielding loss: +2 heat when used"],
                    ["8", "No effect"],
                    ["9", "+1 to-hit, +2 heat when used"],
                    ["10", "+1 to-hit, +3 heat when used"],
                    ["11", "+2 to-hit, +2 heat when used"],
                    ["12", "No effect"],
                    ["13", "+4 heat when used"],
                    ["14", "+2 to-hit, +3 heat when used"],
                    ["15", "+3 to-hit, +5 heat when used"],
                    ["16", "+5 to-hit, +5 heat when used, and roll on this table again each time it is used"],
                    ["17", "Burned out: a technician can repair it"],
                    ["18", "Total burn-through: 1D6 damage and 2D6 heat"],
                ],
                note: "Ours: other weapons (PPCs, Gauss rifles and the like) have no table: a 2 is only a miss. Pulse lasers use the "
                    + "laser table, Streak and other launchers the missile table.",
            },
        ],
    },
    "fw-long-range-wars": {
        summary: "For big games on many map sheets: two range bands past long. Extended range is twice long range and extreme twice "
            + "extended, with base to-hit numbers of 10 and 13 and their own movement modifiers. A firer can range on a target that "
            + "stays still or moves 6 hexes or less: each turn in a row the same 'Mech fires at it, the to-hit drops by 1 more. "
            + "An option replaces the six-sided to-hit dice with two eight-sided dice; the article suggests dropping ranging with it.",
        tables: [
            {
                title: "New range bands",
                page: "BoFW pp.55-56",
                rows: [
                    ["Extended / extreme", "2 x long / 2 x extended (a PPC: 36 / 72)"],
                    ["Base to-hit, extended / extreme", "10 / 13"],
                    ["Short, medium and long", "Unchanged"],
                ],
                note: "Article's examples: medium laser 18 / 36; LRM 42 / 84; AC/2 48 / 96.",
            },
            {
                title: "Modifiers at extended and extreme range",
                page: "BoFW p.56",
                rows: [
                    ["Firer walked / ran / jumped", "+2 / +3 / +5"],
                    ["Target moved 7-9 / 10+ hexes", "+4 / +5"],
                    ["Ranging", "-1 for each turn in a row the same 'Mech fires at a target that stayed still or moved 6 hexes or less"],
                    ["Ranging lost", "The target leaves LOS, or another 'Mech takes the shot: start again"],
                ],
                note: "Ranging works only at extended and extreme range. The article's average is -4 by the time the target reaches "
                    + "extended range. Ours: no limit on the ranging bonus is printed, so none is set.",
            },
            {
                title: "Option: eight-sided dice",
                page: "BoFW p.56",
                rows: [
                    ["Dice", "2D8 for to-hit rolls"],
                    ["Base to-hit, short / medium / long / extended / extreme", "4 / 7 / 10 / 13 / 16"],
                    ["2 or less", "Always a miss"],
                    ["16", "Always a hit"],
                ],
                note: "The article suggests leaving ranging out when this option is used.",
            },
        ],
    },
};

/** The rules summary for a Best of Future Wars play ruleset, or undefined for any other ruleset. */
export function getFutureWarsPlayRules(rulesetId: string): IFutureWarsPlayRules | undefined {
    return futureWarsPlayRules[rulesetId];
}
