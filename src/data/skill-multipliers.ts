/**
 * Battle Value skill multipliers from the TechManual p. 305 cross-grid lookup matrix
 * (rows: Piloting/Driving 0-5, columns: Gunnery 0-8). Used for 'Mechs and combat vehicles.
 */
export const PILOT_MULTIPLIER_MATRIX: number[][] = [
    //                      GUNNERY: 0     1     2     3     4     5     6     7     8
    /* Piloting 0 */        [2.80, 2.56, 2.24, 1.92, 1.60, 1.50, 1.43, 1.36, 1.28],
    /* Piloting 1 */        [2.63, 2.40, 2.10, 1.80, 1.50, 1.35, 1.33, 1.26, 1.19],
    /* Piloting 2 */        [2.45, 2.24, 1.96, 1.68, 1.40, 1.26, 1.19, 1.16, 1.10],
    /* Piloting 3 */        [2.28, 2.08, 1.82, 1.56, 1.30, 1.17, 1.11, 1.04, 1.01],
    /* Piloting 4 */        [2.01, 1.84, 1.61, 1.38, 1.15, 1.04, 0.98, 0.92, 0.86],
    /* Piloting 5 (Base) */ [1.82, 1.60, 1.40, 1.20, 1.00, 0.90, 0.85, 0.80, 0.75],
];

/** The skill multiplier, or null when the skills fall outside the matrix. */
export const getSkillMultiplier = (gunnery: number, piloting: number): number | null => {
    return PILOT_MULTIPLIER_MATRIX[piloting]?.[gunnery] ?? null;
};

/**
 * The BV Skill Multiplier Table as the TechManual's corrected sixth printing gives it (p. 315): rows Gunnery 0-8,
 * columns Piloting / Driving / Anti-'Mech 0-8. Conventional infantry use it, as an Anti-'Mech Skill of 8 lies outside
 * the matrix above.
 */
export const BV_SKILL_MULTIPLIER_TABLE: number[][] = [
    //                PILOTING / ANTI-'MECH: 0     1     2     3     4     5     6     7     8
    /* Gunnery 0 */                         [2.42, 2.31, 2.21, 2.10, 1.93, 1.75, 1.68, 1.59, 1.50],
    /* Gunnery 1 */                         [2.21, 2.11, 2.02, 1.92, 1.76, 1.60, 1.54, 1.46, 1.38],
    /* Gunnery 2 */                         [1.93, 1.85, 1.76, 1.68, 1.54, 1.40, 1.35, 1.28, 1.21],
    /* Gunnery 3 */                         [1.66, 1.58, 1.51, 1.44, 1.32, 1.20, 1.16, 1.10, 1.04],
    /* Gunnery 4 */                         [1.38, 1.32, 1.26, 1.20, 1.10, 1.00, 0.95, 0.90, 0.85],
    /* Gunnery 5 */                         [1.31, 1.19, 1.13, 1.08, 0.99, 0.90, 0.86, 0.81, 0.77],
    /* Gunnery 6 */                         [1.24, 1.12, 1.07, 1.02, 0.94, 0.85, 0.81, 0.77, 0.72],
    /* Gunnery 7 */                         [1.17, 1.06, 1.01, 0.96, 0.88, 0.80, 0.76, 0.72, 0.68],
    /* Gunnery 8 */                         [1.10, 0.99, 0.95, 0.90, 0.83, 0.75, 0.71, 0.68, 0.64],
];

/** The multiplier from the table above, or null when a skill falls outside 0-8. */
export const getTechManualSkillMultiplier = (gunnery: number, pilotingOrAntiMech: number): number | null => {
    return BV_SKILL_MULTIPLIER_TABLE[gunnery]?.[pilotingOrAntiMech] ?? null;
};
