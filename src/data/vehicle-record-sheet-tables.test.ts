import { describe, expect, it } from "vitest";
import {
    getVehicleCriticalHitsSheet,
    getVehicleHitLocationSheet,
    getVehicleMotiveTypeModifierRows,
    getVehicleSheetKind,
    getVehicleSheetTitle,
    getVehicleTableName,
    VEHICLE_MOTIVE_DAMAGE_SHEET_ROWS,
} from "./vehicle-record-sheet-tables";

// Expected values read off the Total Warfare record sheets (Ground Vehicle, V.T.O.L. and Naval Vehicle).
describe("vehicle record sheet tables", () => {
    it("picks the sheet from the motive type", () => {
        expect(getVehicleSheetKind("tracked", false)).toBe("ground");
        expect(getVehicleSheetKind("wige", false)).toBe("ground");
        expect(getVehicleSheetKind("vtol", false)).toBe("vtol");
        expect(getVehicleSheetKind("hydrofoil", false)).toBe("naval");
        expect(getVehicleSheetKind("naval-sub", false)).toBe("naval");
        expect(getVehicleSheetKind("naval-surface", true)).toBe("largeNaval");
    });

    it("titles the sheet by motive type", () => {
        expect(getVehicleSheetTitle("tracked", { superheavy: false, support: false, largeNaval: false })).toBe("TRACKED VEHICLE RECORD SHEET");
        expect(getVehicleSheetTitle("hover", { superheavy: false, support: false, largeNaval: false })).toBe("HOVER VEHICLE RECORD SHEET");
        expect(getVehicleSheetTitle("vtol", { superheavy: false, support: false, largeNaval: false })).toBe("VTOL RECORD SHEET");
        expect(getVehicleSheetTitle("naval-sub", { superheavy: false, support: false, largeNaval: false })).toBe("SUBMARINE RECORD SHEET");
        expect(getVehicleSheetTitle("tracked", { superheavy: true, support: false, largeNaval: false })).toBe("SUPER-HEAVY TRACKED VEHICLE RECORD SHEET");
        expect(getVehicleSheetTitle("wheeled", { superheavy: false, support: true, largeNaval: false })).toBe("WHEELED SUPPORT VEHICLE RECORD SHEET");
        expect(getVehicleSheetTitle("naval-surface", { superheavy: false, support: false, largeNaval: true })).toBe("LARGE NAVAL VESSEL RECORD SHEET");
    });

    it("titles a Large Support Vehicle's sheet and tables as the official sheet does", () => {
        expect(getVehicleSheetTitle("wheeled", { superheavy: true, support: true, largeNaval: false })).toBe("LARGE GROUND SUPPORT VEHICLE RECORD SHEET");
        expect(getVehicleTableName("ground", { superheavy: true, support: true }, "hit")).toBe("Large Ground Support Vehicle");
        expect(getVehicleTableName("ground", { superheavy: true, support: true }, "critical")).toBe("Large Ground Support Vehicle");
        expect(getVehicleTableName("ground", { superheavy: true, support: false }, "hit")).toBe("Super-Heavy Combat Vehicle");
        expect(getVehicleTableName("ground", { superheavy: true, support: false }, "critical")).toBe("Ground Combat Vehicle");
        expect(getVehicleTableName("ground", { superheavy: false, support: true }, "hit")).toBe("Ground Combat Vehicle");
        expect(getVehicleTableName("vtol", { superheavy: false, support: false }, "critical")).toBe("VTOL Combat Vehicle");
        expect(getVehicleTableName("largeNaval", { superheavy: true, support: true }, "hit")).toBe("Large Naval Vessel");
        expect(getVehicleTableName("largeNaval", { superheavy: true, support: true }, "critical")).toBe("Naval Combat Vehicle");
    });

    it("prints the Ground Combat Vehicle Hit Location Table", () => {
        const table = getVehicleHitLocationSheet("ground", false);
        expect(table.columns).toEqual(["Front", "Rear", "Side§"]);
        expect(table.rows.map((row) => row.roll)).toEqual(["2*", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12*"]);
        expect(table.rows[0].cells).toEqual(["Front (critical)", "Rear (critical)", "Side (critical)"]);
        expect(table.rows[1].cells).toEqual(["Front†", "Rear†", "Side†"]);
        expect(table.rows[3].cells).toEqual(["Right Side†", "Left Side†", "Front†"]);
        expect(table.rows[6].cells).toEqual(["Front", "Rear", "Side (critical)*"]);
        expect(table.rows[7].cells).toEqual(["Left Side†", "Right Side†", "Rear†"]);
        expect(table.rows[10].cells).toEqual(["Turret (critical)", "Turret (critical)", "Turret (critical)"]);
    });

    it("prints the VTOL Combat Vehicle Hit Location Table with rotor daggers", () => {
        const table = getVehicleHitLocationSheet("vtol", false);
        expect(table.columns).toEqual(["Front", "Rear", "Side"]);
        expect(table.rows[1].cells).toEqual(["Rotors†", "Rotors†", "Rotors†"]);
        expect(table.rows[3].cells).toEqual(["Right Side", "Left Side", "Front"]);
        expect(table.rows[7].cells).toEqual(["Left Side", "Right Side", "Rear"]);
        expect(table.rows[10].cells).toEqual(["Rotors (critical)†", "Rotors (critical)†", "Rotors (critical)†"]);
    });

    it("prints four attack directions for super-heavy vehicles", () => {
        const table = getVehicleHitLocationSheet("ground", true);
        expect(table.columns).toEqual(["Front", "Rear", "Front Side§", "Rear Side§"]);
        expect(table.rows[1].cells[0]).toBe("Right Side†");
    });

    it("prints the Ground Combat Vehicle Critical Hits Table", () => {
        const table = getVehicleCriticalHitsSheet(false);
        expect(table.columns).toEqual(["Front", "Side", "Rear", "Turret"]);
        expect(table.rows[0]).toEqual({ roll: "2-5", cells: ["No Critical Hit", "No Critical Hit", "No Critical Hit", "No Critical Hit"] });
        expect(table.rows[1].cells).toEqual(["Driver Hit", "Cargo/Infantry Hit", "Weapon Malfunction", "Stabilizer"]);
        expect(table.rows[6].cells).toEqual(["Weapon Destroyed", "Engine Hit", "Ammunition**", "Ammunition**"]);
        expect(table.rows[7]).toEqual({ roll: "12", cells: ["Crew Killed", "Fuel Tank*", "Fuel Tank*", "Turret Blown Off"] });
    });

    it("prints the VTOL Combat Vehicle Critical Hits Table", () => {
        const table = getVehicleCriticalHitsSheet(true);
        expect(table.columns).toEqual(["Front", "Side", "Rear", "Rotors"]);
        expect(table.rows[1].cells).toEqual(["Co-Pilot Hit", "Weapon Malfunction", "Cargo/Infantry Hit", "Rotor Damage"]);
        expect(table.rows[5].cells).toEqual(["Pilot Hit", "Engine Hit", "Sensors", "Flight Stabilizer Hit"]);
        expect(table.rows[7].cells).toEqual(["Crew Killed", "Fuel Tank*", "Fuel Tank*", "Rotors Destroyed"]);
    });

    it("prints the Motive System Damage Table rolls and modifiers", () => {
        expect(VEHICLE_MOTIVE_DAMAGE_SHEET_ROWS.map((row) => row.roll)).toEqual(["2-5", "6-7", "8-9", "10-11", "12+"]);
        expect(getVehicleMotiveTypeModifierRows("ground")).toEqual([
            ["Tracked, Naval", "+0"], ["Wheeled", "+2"], ["Hovercraft, Hydrofoil", "+3"], ["WiGE", "+4"],
        ]);
        expect(getVehicleMotiveTypeModifierRows("naval")).toEqual([["Naval", "+0"], ["Hydrofoil", "+3"]]);
    });
});
