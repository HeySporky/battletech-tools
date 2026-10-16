import type { IASMULUnit } from "../classes/alpha-strike-unit";

// Custom MUL entries saved in this browser only. They show up in this browser's unit search (when
// customs are enabled) and can be proposed for the shared list with a pull request.
const LOCAL_CUSTOM_MUL_STORAGE_KEY = "localCustomMULUnits";

export function getLocalCustomMULUnits(): IASMULUnit[] {
    try {
        if (typeof localStorage === "undefined") {
            return [];
        }
        const parsed = JSON.parse(localStorage.getItem(LOCAL_CUSTOM_MUL_STORAGE_KEY) ?? "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

// Returns false when storage is unavailable (private mode, quota), so callers can warn the user.
export function saveLocalCustomMULUnits(records: IASMULUnit[]): boolean {
    try {
        localStorage.setItem(LOCAL_CUSTOM_MUL_STORAGE_KEY, JSON.stringify(records));
        return true;
    } catch {
        return false;
    }
}
