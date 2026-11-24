import type { IASMULUnit } from "../classes/alpha-strike-unit";

// Kept apart from classicMULMatch.ts, which needs the BattleMech class: the MUL search filters (part of the app
// settings, loaded at startup) use these, and must not pull the unit classes into the entry chunk (#589).

/**
 * The MUL files fighters and the larger aerospace craft (Small Craft, DropShips, capital ships) under the same type,
 * 17. The live MUL names the larger ones "Aerospace Craft" (fighters are "Fighter Craft"); the older MUL calls both
 * "Aerospace" and gives the kind in its page's Unit Type, else the tonnage tells (a fighter is 100 tons at most).
 */
export function isMULLargeAerospaceCraft(unit: Pick<IASMULUnit, "Type" | "Tonnage">): boolean {
    if (unit.Type?.Id !== 17) {
        return false;
    }
    if (unit.Type.Name === "Aerospace Craft") {
        return true;
    }
    if (unit.Type.Name === "Fighter Craft") {
        return false;
    }
    const unitType = (unit as { Mul1Page?: { Fields?: Record<string, string> } }).Mul1Page?.Fields?.["Unit Type"] ?? "";
    if (/fighter/i.test(unitType)) {
        return false;
    }
    return /small craft|dropship|jumpship|warship|station/i.test(unitType) || +unit.Tonnage > 100;
}

/** DropShips weigh 100,000 tons at most (TM p.180); anything heavier is a JumpShip, WarShip or station. */
const DROPSHIP_MAX_TONS = 100000;
const CAPITAL_SHIP_NAME = /jump ?ship|warship|station|battleship|cruiser|destroyer|frigate|corvette|carrier|yard|habitat|factory|facility|colony ship|monitor|leviathan|auto scout/i;
// Capital ships whose MUL names give no class (astech ruling, 2026-10-23): the stat-less "Scout" and "League" can only
// be the Scout JumpShip and the League Destroyer. Monitor (XTRO: Boondoggles p.19), Leviathan (The Wars of Reaving
// p.40) and the Bright Star Auto Scout (Boondoggles p.16) are matched above. Words like "monitor" and "carrier" also
// name DropShips, which is safe only because those have a move and never reach the name test.
const CAPITAL_SHIP_WHOLE_NAME = /^(scout|league)$/i;

/**
 * Of the MUL's large aerospace craft, the JumpShips, WarShips and space stations, which the Capital Ship Creator
 * builds (the rest are Small Craft and DropShips). The MUL gives them all the same type and Alpha Strike type, so the
 * Alpha Strike move tells (AS:CE p.93): Small Craft and DropShips move as spheroids ("3p") or aerodynes ("4a"),
 * WarShips have a bare thrust ("3"), JumpShips and stations only keep station ("0.2k"). Where the MUL has no Alpha
 * Strike stats (it sends a dash) the name and variant, then the DropShip tonnage limit, decide.
 */
export function isMULCapitalShip(unit: Pick<IASMULUnit, "Type" | "Tonnage" | "Name"> & { BFMove?: string | null; Variant?: string | null }): boolean {
    if (!isMULLargeAerospaceCraft(unit)) {
        return false;
    }
    const move = (unit.BFMove ?? "").trim();
    if (/^\d+(\.\d+)?[pa]$/i.test(move)) {
        return false;
    }
    if (/^\d+(\.\d+)?k$/i.test(move) || /^\d+$/.test(move)) {
        return true;
    }
    const name = (unit.Name ?? "").trim();
    const fullName = name + " " + (unit.Variant ?? "");
    if (/pocket warship/i.test(fullName)) {
        return false;
    }
    return CAPITAL_SHIP_NAME.test(fullName) || CAPITAL_SHIP_WHOLE_NAME.test(name) || +unit.Tonnage > DROPSHIP_MAX_TONS;
}

export type MULAerospaceClass = "AF" | "CF" | "SC" | "DS" | "JS" | "WS" | "SS";

/**
 * Which kind of MUL type 17 unit this is, by its Alpha Strike type (AS:CE p.93): aerospace or conventional fighter,
 * Small Craft, DropShip (spheroid or aerodyne), JumpShip, WarShip or space station (issue 322). Where the MUL has no
 * Alpha Strike stats the tests above decide, then the tonnage (Small Craft weigh 200 tons at most, TM p.180) and name.
 */
export function getMULAerospaceClass(unit: Pick<IASMULUnit, "Type" | "Tonnage" | "Name" | "BFType"> & { BFMove?: string | null; Variant?: string | null }): MULAerospaceClass | null {
    if (unit.Type?.Id !== 17) {
        return null;
    }
    const bfType = (unit.BFType ?? "").trim().toUpperCase();
    if (bfType === "DA") {
        return "DS";
    }
    if (["AF", "CF", "SC", "DS", "JS", "WS", "SS"].includes(bfType)) {
        return bfType as MULAerospaceClass;
    }
    const fullName = (unit.Name ?? "") + " " + (unit.Variant ?? "");
    if (!isMULLargeAerospaceCraft(unit)) {
        return /conventional/i.test(fullName) ? "CF" : "AF";
    }
    if (!isMULCapitalShip(unit)) {
        return +unit.Tonnage <= 200 ? "SC" : "DS";
    }
    if (/station|yard|habitat|factory|facility/i.test(fullName)) {
        return "SS";
    }
    return /jump ?ship|^scout$/i.test(fullName.trim()) ? "JS" : "WS";
}
