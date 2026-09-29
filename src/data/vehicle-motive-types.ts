import { IVehicleMotiveType } from "./data-interfaces";

/*
* DISCLAIMER: This file processes gameplay data derived from the BattleTech universe. 
* All lore, stats, and intellectual property belong strictly to Catalyst Game Labs, 
* Topps, and their respective rights holders. 
*
* This open-source utility is a non-commercial fan project designed purely for 
* tabletop gameplay assistance. Content processed by this file is not intended 
* to challenge any copyright or trademark status, and this data is explicitly 
* excluded from the software's underlying license (GNU GPLv3).
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


/**
 * Suspension factor subtracted from cruise MP x tonnage to find a combat vehicle's engine rating
 * (TechManual Combat Vehicle construction, suspension factor table). Tracked vehicles have none.
 */
export function getVehicleSuspensionFactor(motiveTag: string, tonnage: number): number {
    const byWeight = (steps: [number, number][], beyond: (weight: number) => number): number => {
        const step = steps.find(([maxTons]) => tonnage <= maxTons);
        return step ? step[1] : beyond(tonnage);
    };
    switch (motiveTag) {
        case "hover":
            return byWeight([[10, 40], [20, 85], [30, 130], [40, 175], [50, 235]], w => 235 + 45 * Math.ceil((w - 50) / 25));
        case "wheeled":
            return tonnage <= 80 ? 20 : 40;
        case "vtol":
            return byWeight([[10, 50], [20, 95], [30, 140]], w => 140 + 45 * Math.ceil((w - 30) / 20));
        case "wige":
            return byWeight([[15, 45], [30, 80], [45, 115], [80, 140]], w => 140 + 35 * Math.ceil((w - 80) / 30));
        case "naval-surface":
        case "naval-sub":
            // Over 300 tons: unverified (MegaMek's formula); 30 up to 300 tons.
            return tonnage <= 300 ? 30 : (() => { const factor = Math.ceil(tonnage / 10); return factor + (factor % 5); })();
        default:
            return 0;
    }
}
