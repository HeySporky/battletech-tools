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
