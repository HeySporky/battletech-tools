// The tables the battle armor record sheet prints beside the squads (Total Warfare pp.221-222 and 227).

/** Leg Attacks Table (TW p.221): battle armor troopers active and the base to-hit modifier. */
export const BA_LEG_ATTACKS: [string, string][] = [["4-6", "0"], ["3", "+2"], ["2", "+5"], ["1", "+7"]];

/** Swarm Attacks Table (TW p.221). */
export const BA_SWARM_ATTACKS: [string, string][] = [["4-6", "+2"], ["1-3", "+5"]];

/**
 * Swarm Attack Modifiers Table (TW p.221): by attacking enemy battle armor troopers active (6 down to 1), the
 * modifier for 1 to 6 friendly mechanized battle armor troopers active.
 */
export const BA_SWARM_ATTACK_MODIFIERS: [string, string[]][] = [
    ["6", ["+0", "+0", "+0", "+0", "+1", "+2"]],
    ["5", ["+0", "+0", "+0", "+1", "+2", "+3"]],
    ["4", ["+0", "+0", "+1", "+2", "+3", "+4"]],
    ["3", ["+0", "+1", "+2", "+3", "+4", "+5"]],
    ["2", ["+1", "+2", "+3", "+4", "+5", "+6"]],
    ["1", ["+2", "+3", "+4", "+5", "+6", "+7"]],
];

/** The equipment and situation modifiers under the Swarm Attack Modifiers Table (TW p.221); they are cumulative. */
export const BA_SWARM_EQUIPMENT_MODIFIERS: [string, string][] = [["Claws with magnets", "-1"]];
export const BA_SWARM_SITUATION_MODIFIERS: [string, string][] = [["'Mech prone", "-2"], ["'Mech or vehicle immobile", "-4"], ["Vehicle", "-2"]];

/** Swarm Attacks Hit Location Table (TW p.222): 2D6 roll, bipedal location, four-legged location. */
export const BA_SWARM_HIT_LOCATIONS: [string, string, string][] = [
    ["2", "Head", "Head"],
    ["3", "Rear Center Torso", "Front Right Torso"],
    ["4", "Rear Right Torso", "Rear Center Torso"],
    ["5", "Front Right Torso", "Rear Right Torso"],
    ["6", "Right Arm", "Front Right Torso"],
    ["7", "Front Center Torso", "Front Center Torso"],
    ["8", "Left Arm", "Front Left Torso"],
    ["9", "Front Left Torso", "Rear Left Torso"],
    ["10", "Rear Left Torso", "Rear Center Torso"],
    ["11", "Rear Center Torso", "Front Left Torso"],
    ["12", "Head", "Head"],
];

/**
 * Battle Armor Transport Position Table (TW p.227): trooper number, 'Mech location, vehicle location and Large Support
 * Vehicle location, where Unit 1 and Unit 2 are the two battle armor units a Large Support Vehicle may carry.
 */
export const BA_TRANSPORT_POSITIONS: [string, string, string, string][] = [
    ["1", "Right Torso", "Right Side", "Right Side (Unit 1/Unit 2)"],
    ["2", "Left Torso", "Right Side", "Right Side (Unit 1/Unit 2)"],
    ["3", "Right Torso (rear)", "Left Side", "Left Side (Unit 1/Unit 2)"],
    ["4", "Left Torso (rear)", "Left Side", "Left Side (Unit 1/Unit 2)"],
    ["5", "Center Torso (rear)", "Rear", "Rear (Unit 1/Unit 2)"],
    ["6", "Center Torso", "Rear", "Rear (Unit 1/Unit 2)"],
];
