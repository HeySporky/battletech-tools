export const CONST_AS_OPFOR_BEHAVIORS: OpForBehavior[] = [
    /* ***************************
      All behaviors for OpFor
    ***************************** */
      {
        name: "Overheat Protocol",
        quarry: "Nearest enemy that already moved this round",
        movement: "Move to put Quarry in physical attack range <i>outside of Quarry's firing arc</i> <b>-OR-</b> move out of LOS of Quarry <b>-OR-</b> increase range from Quarry",
        attack: "Physical attack nearest enemy <b>-OR-</b> attack nearest enemy with no remaining armor and TN <= 8 <b>-OR-</b> do not attack.",
        reroll: false
    },
    {
        name: "Forced Withdrawal",
        quarry: "Nearest enemy",
        movement: "Expend full MV to move towards home edge",
        attack: "Nearest enemy",
        reroll: false
    },
    {
        name: "Advance",
        quarry: "Enemy with lowest remaining armor <i>at medium or short range</i> (tie: nearest)",
        movement: "Move to put Quarry in short range <i>and be in rear arc of Quarry that already moved this round</i> <b>-OR-</b> Reduce distance <i>and range</i> to Quarry",
        attack: "Enemy with lowest TN (tie: lowest remaining armor) Use overheat max 1 if TN <= 8; use overheat max 3 if TN <= 6",
        reroll: false
    },
    {
        name: "Bring It Down",
        quarry: "Enemy with least remaining armor (tie: nearest)",
        movement: "Standstill in woods/partial cover with Quarry in LOS at medium range <b>-OR-</b> Move to put Quarry at medium range <b>-OR-</b> Move towards putting Quarry at medium range",
        attack: "Attack enemy with least remaining armor if TN <= 9 <b>-OR-</b> attack enemy with lowest TN (tie: least armor) Use overheat max 1 if TN <= 8; use overheat max 3 if TN <= 6",
        reroll: false
    },
    {
        name: "Charge",
        quarry: "Nearest enemy that moved and unit can reach in b2b contact <b>-OR-</b> Nearest enemy",
        movement: "<i>If DFA TN <= 9, jumping</i> move to base to base contact with Quarry that has already moved <b>-OR-</b> Move to reduce distance <i>and range</i> to Quarry",
        attack: "Execute DFA on Quarry if TN <= 9 <b>-OR-</b> Execute charge attack on Quarry if charge will do more damage than other attacks <b>-OR-</b> Attack enemy with lowest TN (tie: nearest) Use overheat max 1 if TN <= 9, use overheat max 3 if TN <= 7",
        reroll: false
    },
    {
        name: "Flank",
        quarry: "Enemy whose rear arc unit can move to this round <i>that already moved</i> <b>-OR-</b> Nearest enemy <i>that already moved</i>",
        movement: "Move to rear firing arc of Quarry <b>-OR-</b> Move towards rear firing arc of Quarry by circling to the side and keeping Quarry at medium range <b>-OR-</b> Reduce distance to Quarry",
        attack: "Enemy that unit can hit in rear (tie: lowest TN) <b>-OR-</b> Enemy with lowest TN Use overheat max 1 if TN <= 9; use overheat max 3 if TN <= 7",
        reroll: false
    },
    {
        name: "Hold The Line",
        quarry: "Nearest enemy",
        movement: "Move to put Quarry at med. range <b>-OR-</b> Move towards putting Quarry at med. range",
        attack: "Enemy with lowest TN (tie: least remaining armor) Use overheat max 2 if TN <= 6",
        reroll: false
    },
    {
        name: "Indirect Fire",
        quarry: "Nearest enemy",
        movement: "Standstill out of line of sight of all enemies <b>-OR-</b> Move out of line of sight of all enemies <b>-OR-</b>Move to put Quarry at long range <b>-OR-</b> Move towards putting Quarry at long range",
        attack: "Attack enemy with lowest TN, using IF special if needed",
        reroll: false
    },
    {
        name: "Soften Them Up",
        quarry: "Enemy with most remaining armor (tie: nearest)",
        movement: "Standstill in woods or partial cover with Quarry in LOS at long or medium range <b>-OR-</b> Move to put Quarry at long range <b>-OR-</b> Move towards putting Quarry at long range",
        attack: "Enemy with most remaining armor if TN <= 9 <b>-OR-</b> Enemy with lowest TN (tie: most remaining armor) Use overheat max 1 if TN <= 8",
        reroll: false
    },
    {
        name: "Regroup",
        quarry: "Nearest enemy",
        movement: "Move to increase distance <i>and range to Quarry while moving towards home edge</i>",
        attack: "Enemy with lowest TN (tie: most remaining armor)",
        reroll: true
    },
    {
        name: "Hide",
        quarry: "Nearest enemy",
        movement: "Move to nearest location out of Line of Sight from enemies <b>-OR-</b> Move into nearest forest or building",
        attack: "If able to break LoS or enter forest/building, unit cannot attack or be attacked this round",
        reroll: false
    },
    {
        name: "Harass",
        quarry: "Nearest enemy that has already moved",
        movement: "Move towards putting quarry <i>at short range</i> while remaining within sprint distance of forest or building. Reroll if unit cannot move to put quarry in range.",
        attack: "Enemy with lowest TN (tie: least remaining armor)",
        reroll: true
    },
    {
        name: "Ambush",
        quarry: "Nearest enemy that has already moved",
        movement: "Move to base to base contact with Quarry that has already moved <b>-OR-</b> Move to reduce distance <i>and range</i> to Quarry.",
        attack: "Nearest enemy <i>and use AM special if available</i>",
        reroll: true
    },
    {
        name: "Air Superiority",
        quarry: "Nearest aerospace unit flight path or VTOL. Reroll if no enemy airborne units.",
        movement: "Highest altitude and shortest path on map that puts quarry at max damage range.",
        attack: "Nearest enemy. Use overheat max 1 if TN <= 9; use overheat max 3 if TN <= 7",
        reroll: true
    },
    {
        name: "Strafe",
        quarry: "Largest number of enemies within 10x2 strafe template.",
        movement: "Low altitude flight with the highest number of enemies.",
        attack: "All units within strafe zone.",
        reroll: false
    },
    {
        name: "Soften The Front",
        quarry: "Enemy nearest to this unit's home side. (tie: shortest flight path)",
        movement: "Flight path as far from all other enemy units as possible. Altitude set to highest range possible.",
        attack: "Strike enemy nearest to this unit's home side. (tie: lowest remaining armor)",
        reroll: false
    },
    {
        name: "Rear Strike",
        quarry: "Enemy nearest to its own home side. (tie: shortest flight path)",
        movement: "Flight path as far from all other enemy units as possible. Altitude set to longest range with most damage.",
        attack: "Strike enemy nearest to its own home side. (tie: lowest remaining armor)",
        reroll: false
    },
    {
        name: "Strike",
        quarry: "Enemy within shortest path across battlefield",
        movement: "Shortest path across battlefield at longest range with most damage.",
        attack: "First enemy on flight path.",
        reroll: false
    },
    {
        name: "Divebomb",
        quarry: "Enemy within shortest path across battlefield",
        movement: "Shortest path across battlefield at middle altitude.",
        attack: "Use all available bombs on most enemies within a single area effect. (tie: farthest from friendlies) Reroll if out of bombs.",
        reroll: true
    },
    {
        name: "Bombing Run",
        quarry: "Largest number of enemies along flight path.",
        movement: "<i>Extreme</i> or high altitude flight with the highest number of enemies.",
        attack: "First enemy along flight path. Drop multiple bombs another enemy is within 2 inches. Reroll if out of bombs.",
        reroll: true
    },
]
export interface OpForBehavior {
    name: string;
    quarry: string;
    movement: string;
    attack: string;
    reroll: boolean; // This is for the regroup tactic
}

export const CONST_AS_BEHAVIOR_TABLE: BehaviorTable[] = [
    /* ***************************
      Table of behaviors based on role
    ***************************** */
    {
        role: "Scout",
        behavior: [
            "Flank",
            "Flank",
            "Flank",
            "Advance",
            "Advance",
            "Charge",
            "Charge",
            "Regroup",
        ]
    },
    {
        role: "Striker",
        behavior: [
            "Flank",
            "Flank",
            "Flank",
            "Advance",
            "Advance",
            "Charge",
            "Charge",
            "Regroup",
        ]
    },
    {
        role: "Missile Boat",
        behavior: [
            "Soften Them Up",
            "Soften Them Up",
            "Indirect Fire",
            "Indirect Fire",
            "Indirect Fire",
            "Bring It Down",
            "Bring It Down",
            "Bring It Down",
        ]
    },
    {
        role: "Sniper",
        behavior: [
            "Soften Them Up",
            "Soften Them Up",
            "Indirect Fire",
            "Indirect Fire",
            "Indirect Fire",
            "Bring It Down",
            "Bring It Down",
            "Bring It Down",
        ]
    },
    {
        role: "Skirmisher",
        behavior: [
            "Flank",
            "Flank",
            "Advance",
            "Advance",
            "Charge",
            "Charge",
            "Regroup",
            "Regroup",
        ]
    },
    {
        role: "Brawler",
        behavior: [
            "Flank",
            "Flank",
            "Advance",
            "Advance",
            "Hold The Line",
            "Hold The Line",
            "Hold The Line",
            "Charge",
        ]
    },
    {
        role: "Juggernaut",
        behavior: [
            "Advance",
            "Advance",
            "Advance",
            "Hold The Line",
            "Hold The Line",
            "Hold The Line",
            "Charge",
            "Charge",
        ]
    },
    {
        role: "Ambusher",
        behavior: [
            "Harass",
            "Harass",
            "Harass",
            "Hide",
            "Hide",
            "Hide",
            "Ambush",
            "Ambush",
        ]
    },
    {
        role: "Interceptor",
        behavior: [
            "Air Superiority",
            "Air Superiority",
            "Air Superiority",
            "Air Superiority",
            "Strike",
            "Strike",
            "Divebomb",
            "Divebomb",
        ]
    },
    {
        role: "Attack",
        behavior: [
            "Air Superiority",
            "Soften The Front",
            "Strike",
            "Strike",
            "Divebomb",
            "Bombing Run",
            "Rear Strike",
            "Rear Strike",
        ]
    },
    {
        role: "Dogfighter",
        behavior: [
            "Air Superiority",
            "Air Superiority",
            "Soften The Front",
            "Soften The Front",
            "Strike",
            "Strike",
            "Divebomb",
            "Bombing Run",
        ]
    },
    {
        role: "Fast Dogfighter",
        behavior: [
            "Air Superiority",
            "Air Superiority",
            "Air Superiority",
            "Soften The Front",
            "Soften The Front",
            "Strike",
            "Divebomb",
            "Divebomb",
        ]
    },
    {
        role: "Fire-Support",
        behavior: [
            "Air Superiority",
            "Soften The Front",
            "Soften The Front",
            "Strike",
            "Divebomb",
            "Bombing Run",
            "Bombing Run",
            "Rear Strike",
        ]
    },
]

export interface BehaviorTable {
    role: string;
    behavior: string[];
}