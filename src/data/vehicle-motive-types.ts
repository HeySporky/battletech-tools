import { IVehicleMotiveType } from "./data-interfaces";

/*
 * The data here is/may be copyrighted and NOT included in the GPLv3 license.
 *
 * Tonnage bounds per Sarna's Combat Vehicle / Superheavy Combat Vehicle rules summaries.
 * Standard rules cap at standardMaxTonnage; Superheavy configurations (Advanced+ rules,
 * same gating tier as Superheavy/Colossal 'Mechs) unlock up to superheavyMaxTonnage.
 * Conventional Fighters are an Aerospace-domain unit (Phase 3), not a ground/naval motive type.
 */
export const vehicleMotiveTypes: IVehicleMotiveType[] = [
    { id: 1, tag: "tracked", name: "Tracked", minTonnage: 1, standardMaxTonnage: 100, superheavyMaxTonnage: 200 },
    { id: 2, tag: "wheeled", name: "Wheeled", minTonnage: 1, standardMaxTonnage: 100, superheavyMaxTonnage: 160 },
    { id: 3, tag: "hover", name: "Hover", minTonnage: 1, standardMaxTonnage: 50, superheavyMaxTonnage: 100 },
    { id: 4, tag: "wige", name: "WiGE", minTonnage: 5, standardMaxTonnage: 80, superheavyMaxTonnage: 160 },
    { id: 5, tag: "vtol", name: "VTOL", minTonnage: 1, standardMaxTonnage: 30, superheavyMaxTonnage: 60 },
    { id: 6, tag: "naval-surface", name: "Naval (Surface)", minTonnage: 100, standardMaxTonnage: 555, superheavyMaxTonnage: 100000 },
    { id: 7, tag: "naval-sub", name: "Naval (Submarine)", minTonnage: 100, standardMaxTonnage: 555, superheavyMaxTonnage: 100000 },
];

export function getVehicleMotiveType(motiveTag: string): IVehicleMotiveType {
    return vehicleMotiveTypes.find((m) => m.tag === motiveTag) ?? vehicleMotiveTypes[0];
}

// Mirrors getTonnageBoundsForMechType()'s rules-level gating: Advanced+ (or Custom Homebrew) unlocks Superheavy tonnages.
export function getVehicleTonnageBounds(motiveTag: string, rulesLevel: number = 2): { min: number; max: number } {
    const motiveType = getVehicleMotiveType(motiveTag);
    const superheavyUnlocked = rulesLevel >= 3;
    return {
        min: motiveType.minTonnage,
        max: superheavyUnlocked ? motiveType.superheavyMaxTonnage : motiveType.standardMaxTonnage,
    };
}

