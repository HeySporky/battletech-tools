// The tables the conventional infantry record sheet prints under the platoons (Total Warfare pp.216-217, 221).

import { BA_SWARM_ATTACK_MODIFIERS, BA_SWARM_SITUATION_MODIFIERS } from './battle-armor-record-sheet';

/** Leg Attacks Table (TW p.221): active troopers in a conventional platoon and the attack modifier. */
export const INFANTRY_LEG_ATTACKS: [string, string][] = [["22 or more", "0"], ["16-21", "+2"], ["10-15", "+5"], ["5-9", "+7"], ["1-4", "No attack possible"]];

/** Swarm Attacks Table (TW p.221). */
export const INFANTRY_SWARM_ATTACKS: [string, string][] = [["22 or more", "+2"], ["16-21", "+5"], ["1-15", "No attack possible"]];

/**
 * Swarm Attack Modifiers Table (TW p.221): by active troopers in the attacking conventional platoon, the modifier for
 * 1 to 6 friendly mechanized battle armor troopers active. These are the battle armor rows for 5 down to 1 trooper.
 */
export const INFANTRY_SWARM_ATTACK_MODIFIERS: [string, string[]][] = ["28-30", "24-27", "21-23", "18-20", "16-17**"]
    .map((troopers, i) => [troopers, BA_SWARM_ATTACK_MODIFIERS[i + 1][1]]);

/** The situation modifiers under the Swarm Attack Modifiers Table (TW p.221); they are cumulative. */
export const INFANTRY_SWARM_SITUATION_MODIFIERS = BA_SWARM_SITUATION_MODIFIERS;

/** Non-Infantry Weapon Damage Against Infantry Table (TW p.216): weapon type and the conventional troopers hit. */
export const INFANTRY_NON_INFANTRY_DAMAGE: [string, string][] = [
    ["BattleMech Physical Attack**", "Damage Value / 10"],
    ["Direct Fire (Ballistic or Energy)", "Damage Value / 10"],
    ["Cluster (Ballistic)", "Damage Value / 10 + 1"],
    ["Pulse***", "Damage Value / 10 + 2"],
    ["Cluster (Missile)", "Damage Value / 5"],
    ["Area-Effect (AE)", "Damage Value / .5"],
    ["Burst-Fire", "See Burst-Fire Table"],
    ["Heat-Effect Weapons", "See Heat-Effect Weapons†"],
];

/** The footnotes under the Non-Infantry Weapon Damage Against Infantry Table (TW p.216), shortened. */
export const INFANTRY_NON_INFANTRY_DAMAGE_NOTES: string[] = [
    "*See Combat, TW p.113, for weapon terminology. A weapon of several types uses the type that inflicts the most damage.",
    "**Not including Thrashing Attacks (TW p.151).",
    "***Except Small and Micro Pulse Lasers, which are Burst-Fire weapons.",
    "The result is the number of troopers hit and eliminated, regardless of armor; round fractions up. Attacks by non-infantry weapons against mechanized infantry double the troopers eliminated, after rounding.",
    "†Each Heat-Effect weapon has its own damage against conventional infantry (TW p.129).",
];

/** Burst-Fire Weapon Damage Vs. Conventional Infantry Table (TW p.217): BattleMechs, ProtoMechs and vehicles. */
export const INFANTRY_BURST_FIRE_UNITS: [string, string][] = [
    ["AP Gauss Rifle", "2D6"], ["Light Machine Gun", "1D6"], ["Machine Gun", "2D6"], ["Heavy Machine Gun", "3D6"],
    ["Small/Micro Pulse Laser", "2D6"], ["Flamer", "4D6"],
];

/** Burst-Fire Weapon Damage Vs. Conventional Infantry Table (TW p.217): battle armor. */
export const INFANTRY_BURST_FIRE_BATTLE_ARMOR: [string, string][] = [
    ["Light Machine Gun", "1D6/2 (round up)"], ["Machine Gun", "1D6"], ["Heavy Machine Gun", "2D6"], ["Flamer", "3D6"],
    ["Light Recoilless Rifle", "1D6"], ["Medium Recoilless Rifle", "2D6"], ["Heavy Recoilless Rifle", "2D6"],
    ["Light Mortar", "1D6"], ["Heavy Mortar", "1D6"], ["Automatic Grenade Launcher", "1D6/2 (round up)"], ["Heavy Grenade Launcher", "1D6"],
];
