import { IVehicleMotiveType } from "./data-interfaces";
import { findByTag } from "./tag-match";

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
* Combat Vehicle motive types (TechManual Combat Vehicle construction). The book is not in hand, so the
* limits below follow MegaMek's implementation (TestTank.maxTonnage, Tank.getSuspensionFactor) and were
* checked against the official Master Unit List: every published vehicle falls inside them, and the
* Alpha Strike movement codes match the MUL cards (t, w, h, v, g, n, s).
* - Every combat vehicle starts at 1 ton; Superheavy tonnages (Advanced rules) go above the standard cap.
* - Hydrofoils have no Superheavy version.
* - Hover, VTOL, WiGE, hydrofoil and submarine vehicles carry lift/dive equipment (10% of tonnage).
* - VTOLs have a Rotor location (at most 2 armor points) and only an optional chin turret (Advanced).
* - Hardened armor is not allowed on VTOL, hover or WiGE vehicles.
* Conventional Fighters are an Aerospace-domain unit (Phase 3), not a ground/naval motive type.
*/

export const vehicleMotiveTypes: IVehicleMotiveType[] = [
    { id: 1, tag: "tracked", name: "Tracked", minTonnage: 1, standardMaxTonnage: 100, superheavyMaxTonnage: 200,
        turret: "standard", allowsHardenedArmor: true, allowsJumpJets: true, naval: false, alphaStrikeMove: "t", book: "TM", page: null },
    { id: 2, tag: "wheeled", name: "Wheeled", minTonnage: 1, standardMaxTonnage: 80, superheavyMaxTonnage: 160,
        turret: "standard", allowsHardenedArmor: true, allowsJumpJets: true, naval: false, alphaStrikeMove: "w", book: "TM", page: null },
    { id: 3, tag: "hover", name: "Hover", minTonnage: 1, standardMaxTonnage: 50, superheavyMaxTonnage: 100,
        liftEquipment: "Lift Equipment", turret: "standard", allowsHardenedArmor: false, allowsJumpJets: true, naval: false, alphaStrikeMove: "h", book: "TM", page: null },
    { id: 4, tag: "wige", name: "WiGE", minTonnage: 1, standardMaxTonnage: 80, superheavyMaxTonnage: 160,
        liftEquipment: "Lift Equipment", turret: "standard", allowsHardenedArmor: false, allowsJumpJets: true, naval: false, alphaStrikeMove: "g", book: "TM", page: null },
    { id: 5, tag: "vtol", name: "VTOL", minTonnage: 1, standardMaxTonnage: 30, superheavyMaxTonnage: 60,
        liftEquipment: "Rotor Assembly", hasRotor: true, turret: "chin", allowsHardenedArmor: false, allowsJumpJets: false, naval: false, alphaStrikeMove: "v", book: "TM", page: null },
    { id: 6, tag: "naval-surface", name: "Naval (Surface)", minTonnage: 1, standardMaxTonnage: 300, superheavyMaxTonnage: 555,
        turret: "standard", allowsHardenedArmor: true, allowsJumpJets: false, naval: true, alphaStrikeMove: "n", book: "TM", page: null },
    { id: 8, tag: "hydrofoil", name: "Naval (Hydrofoil)", minTonnage: 1, standardMaxTonnage: 100, superheavyMaxTonnage: null,
        liftEquipment: "Hydrofoil Equipment", turret: "standard", allowsHardenedArmor: true, allowsJumpJets: false, naval: true, alphaStrikeMove: "n", book: "TM", page: null },
    { id: 7, tag: "naval-sub", name: "Naval (Submarine)", minTonnage: 1, standardMaxTonnage: 300, superheavyMaxTonnage: 555,
        liftEquipment: "Dive Equipment", turret: "standard", allowsHardenedArmor: true, allowsJumpJets: false, naval: true, alphaStrikeMove: "s", book: "TM", page: null },
];

export function getVehicleMotiveType(motiveTag: string): IVehicleMotiveType {
    return findByTag(vehicleMotiveTypes, motiveTag) ?? vehicleMotiveTypes[0];
}

// Mirrors getTonnageBoundsForMechType()'s rules-level gating: Advanced+ (or Custom Homebrew) unlocks Superheavy tonnages.
export function getVehicleTonnageBounds(motiveTag: string, rulesLevel: number = 2): { min: number; max: number } {
    const motiveType = getVehicleMotiveType(motiveTag);
    const superheavyUnlocked = rulesLevel >= 3 && motiveType.superheavyMaxTonnage !== null;
    return {
        min: motiveType.minTonnage,
        max: superheavyUnlocked ? motiveType.superheavyMaxTonnage ?? motiveType.standardMaxTonnage : motiveType.standardMaxTonnage,
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
        case "hydrofoil":
            return byWeight([[10, 60], [20, 105], [30, 150], [40, 195], [50, 255], [60, 300], [70, 345], [80, 390], [90, 435]], () => 480);
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
