/**
 * A location's critical slots as the tables a player rolls on. Canon (TW p.124): a 6-slot location is one table, its
 * line picked by one die; a 12-slot location is two tables of six, 1-3 picking the first and 4-6 the second, then a die
 * for the line. Clell Flint's construction rules (#172) give bipeds locations of other lengths and no rule for them, so
 * this is ours, the canon method stretched: tables of six, the last one short; when the tables divide 6 evenly each
 * gets that share of the die (three tables: 1-2, 3-4, 5-6), otherwise one number each and the rest are rolled again
 * (four tables: 1, 2, 3, 4). A line past the end of a short table is rolled again, as an empty line is.
 */
export interface ICriticalTable {
    /** Index of the table's first slot in the location. */
    start: number;
    length: number;
    /** Die numbers that pick this table; empty when the location is one table. */
    dice: number[];
    /** The die numbers as printed ("1-3", "4", ...); "" when the location is one table. */
    label: string;
}

export const CRITICAL_TABLE_LINES = 6;

export function getCriticalTables(slotCount: number): ICriticalTable[] {
    const count = Math.max(0, Math.floor(slotCount || 0));
    const tableCount = Math.ceil(count / CRITICAL_TABLE_LINES);
    const share = CRITICAL_TABLE_LINES % tableCount === 0 ? CRITICAL_TABLE_LINES / tableCount : 1;
    const tables: ICriticalTable[] = [];
    for (let index = 0; index < tableCount; index++) {
        const start = index * CRITICAL_TABLE_LINES;
        const dice = tableCount > 1 ? Array.from({ length: share }, (_, die) => index * share + die + 1) : [];
        const label = dice.length === 0 ? "" : dice.length === 1 ? `${dice[0]}` : `${dice[0]}-${dice[dice.length - 1]}`;
        tables.push({ start, length: Math.min(CRITICAL_TABLE_LINES, count - start), dice, label });
    }
    return tables;
}

export interface ICriticalLineRoll {
    /** Slot index hit, or null when the roll must be made again (no table, or no line). */
    index: number | null;
    /** The table rolled, or null for a one-table location or a table roll with no table. */
    table: ICriticalTable | null;
    /** 1-based number of the table rolled, when there is more than one table. */
    tableNumber?: number;
    tableRoll?: number;
    /** The die for the line, when one was rolled. */
    line?: number;
}

/** One attempt at picking a line: a die for the table when there is more than one, then a die for the line. */
export function rollCriticalLine(slotCount: number, nextDie: () => number): ICriticalLineRoll {
    const tables = getCriticalTables(slotCount);
    if (tables.length === 0) return { index: null, table: null };
    if (tables.length === 1) {
        const line = nextDie();
        return { index: line <= tables[0].length ? line - 1 : null, table: null, line };
    }
    const tableRoll = nextDie();
    const tableIndex = tables.findIndex(table => table.dice.includes(tableRoll));
    if (tableIndex < 0) return { index: null, table: null, tableRoll };
    const table = tables[tableIndex];
    const line = nextDie();
    return { index: line <= table.length ? table.start + line - 1 : null, table, tableNumber: tableIndex + 1, tableRoll, line };
}
