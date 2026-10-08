/*
* DISCLAIMER: This file processes gameplay data derived from the BattleTech universe.
* All lore, stats, and intellectual property belong strictly to Catalyst Game Labs,
* Topps, and their respective rights holders.
*
* This open-source utility is a non-commercial fan project designed purely for
* tabletop gameplay assistance. Content processed by this file is not intended
* to challenge any copyright or trademark status, and this data is explicitly
* excluded from the software's underlying license (GNU GPLv3).
*/

/**
 * The tables of Advanced and Expert Battledroids (Battledroids, FASA 1984, cited as BD) that a game needs at the
 * table, for the play screen's reference panel. Each table carries its page. Tables that match Total Warfare's
 * (the Hit Location, Missile Hit and DroidWarrior Damage tables, and the Heat Scale) are named in the last entry
 * and not repeated.
 */
export interface IBattledroidsRulesTable {
    title: string;
    page: string;
    rows: [string, string][];
    note?: string;
}

export const battledroidsRulesTables: IBattledroidsRulesTable[] = [
    {
        title: "To-Hit Number",
        page: "BD pp.9-10, 15",
        rows: [
            ["Base", "Gunnery Skill (4 unless skills are rolled), plus the Heat Scale's Fire modifier"],
            ["Short / Medium / Long range", "None / +2 / +4"],
            ["Minimum range", "+1 at the minimum range, +1 more for each hex closer"],
            ["13 or more", "Automatic miss"],
        ],
    },
    {
        title: "Movement Modifiers",
        page: "BD pp.5, 15",
        rows: [
            ["Attacker stationary / walked / ran / jumped", "None / +1 / +2 / +3"],
            ["Attacker lying down", "+2; both arms must work, and it fires one weapon not on the supporting arm"],
            ["Target moved 0-2 / 3-4 / 5-6 / 7-9 hexes", "None / +1 / +2 / +3"],
            ["Target jumped", "+1 more"],
            ["Target lying down", "-2"],
        ],
    },
    {
        title: "Terrain Modifiers",
        page: "BD p.10",
        rows: [
            ["Light woods", "+1 for each hex between, +1 if the target is in one"],
            ["Heavy woods", "+2 for each hex between, +2 if the target is in one"],
            ["Water", "+1 if the attacker is in a water hex, -1 if the target is"],
            ["Partial cover", "+3"],
        ],
    },
    {
        title: "Targets Other Than Battledroids",
        page: "BD pp.22-23",
        rows: [
            ["Tank", "No modifier; Tank Hit Locations table"],
            ["Jeep", "+1"],
            ["Infantry", "+2"],
        ],
    },
    {
        title: "Heat Points",
        page: "BD p.12",
        rows: [
            ["Walking / running", "0 / +1 a turn"],
            ["Jumping", "+1 a hex"],
            ["Weapon fire", "As the Weapons Table"],
            ["Heat sinks", "-1 for each one working"],
            ["Occupying a water hex", "-6 a turn"],
            ["1st / 2nd engine critical hit", "+5 / +10 a turn afterwards"],
            ["Occupying / moving through a fire hex", "+5 a turn / +2 a hex"],
            ["Shut down", "Restarts by itself once the heat is below 15"],
        ],
    },
    {
        title: "Critical Hits",
        page: "BD pp.18-19",
        rows: [
            ["Chance", "Each time the internal structure is damaged, roll two dice: 7 or more is one critical hit"],
            ["Which one", "Head and legs: one die. Torso and arms: one die for the group (1-3 or 4-6), one for the line. Roll again on an empty line"],
            ["Life support", "The DroidWarrior takes 1 point a turn at heat 15-25, 2 above 25"],
            ["Cockpit", "DroidWarrior killed"],
            ["Sensors", "+2 to hit; a second hit and the droid cannot fire"],
            ["Engine", "+5 heat, then +10; the third hit destroys the droid"],
            ["Gyro", "Piloting Skill Roll to run or jump, +3 on all such rolls; the second hit destroys it"],
            ["Hip", "MP halved, no kicks, +2 Piloting; the other hip too and the droid cannot move"],
            ["Upper or lower leg actuator", "-1 MP, +1 Piloting, kick damage halved (both: 1 point for every 20 tons)"],
            ["Foot actuator", "+1 Piloting"],
            ["Shoulder", "No punch with that arm; +4 for its weapons, +2 to push"],
            ["Upper or lower arm actuator", "+2 to punch at half damage; +1 for the arm's weapons and to push. Both add up"],
            ["Hand actuator", "+1 to punch"],
            ["Weapon", "Destroyed by the first hit"],
            ["Heat sink", "1 less heat lost; once none are left, +1 heat a turn for each further hit"],
        ],
    },
    {
        title: "Physical Attacks",
        page: "BD pp.11-12, 19-21",
        rows: [
            ["Punch", "Base 4; 1 damage for every 10 tons; one die on the Punch table"],
            ["Kick", "Base 3; 1 damage for every 5 tons; one die: 1-3 right leg, 4-6 left leg from the front or back"],
            ["Push", "Base 4; no damage, the target is moved a hex and makes a Piloting Skill Roll"],
            ["Charge", "Base 5, adjusted by the difference in Piloting skills; 1 damage for every 10 tons times hexes moved, in groups of 5; the charger takes 1 for every 10 tons of the target"],
            ["Club (a severed limb)", "Base 4; 1 damage for every 5 tons"],
            ["Punch table, front or back", "1 left arm, 2 left torso, 3 center torso, 4 right torso, 5 right arm, 6 head"],
            ["Punch table, left / right side", "1-2 torso, 3 center torso, 4-5 arm, 6 head, all on that side"],
        ],
        note: "All are modified by movement like weapon fire.",
    },
    {
        title: "Falling Or Standing (added to the Piloting Skill, 5 unless rolled)",
        page: "BD p.15",
        rows: [
            ["Kicked, pushed, missed a kick, trying to get up", "None"],
            ["Charged, or charging", "+2"],
            ["Takes 20 damage", "+1"],
            ["Reactor shut down", "+3"],
            ["Each leg actuator destroyed", "+1"],
            ["Each hip critical hit (2 at most)", "+2"],
            ["Gyro hit", "+3"],
            ["Entering or leaving a water hex", "-1"],
            ["Each level fallen", "+1"],
            ["Falling damage", "1 for every 10 tons times (levels fallen + 1), in groups of 5; halved in water"],
            ["Standing up", "2 MP and a Piloting Skill Roll"],
        ],
    },
    {
        title: "Aimed Shots At A Shut-Down Droid",
        page: "BD p.19",
        rows: [
            ["Any location but the head", "After a hit, 6, 7 or 8 on two dice hits the chosen location; otherwise roll normally. Not for missiles"],
            ["Head", "+3 to hit; then 8 or more hits the head, otherwise roll on the Punch table"],
        ],
    },
    {
        title: "DroidWarrior Skills (optional)",
        page: "BD p.22",
        rows: [
            ["Die roll 1-2", "Piloting 6, Gunnery 4"],
            ["Die roll 3-4", "Piloting 5, Gunnery 4"],
            ["Die roll 5-6", "Piloting 4, Gunnery 3"],
        ],
    },
    {
        title: "Same As The Screen's Own Tables",
        page: "BD pp.10-11, 13, 19",
        rows: [
            ["Hit Location Table", "As shown by the hit location chart"],
            ["Missile Hit Table", "As shown by the cluster chart"],
            ["Heat Scale", "As on the record sheet"],
            ["DroidWarrior Damage", "Consciousness 3, 5, 7, 10, 11; dead on the sixth point. 1 point for a head hit or a failed roll after a fall, 2 for an ammunition explosion"],
        ],
    },
];
