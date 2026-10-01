import { IInternalStructure, IInternalStructurePerTon, IRawMechStructure } from "./data-interfaces";
import { getTonnageBoundsForMechType } from "./mech-tonnages";

/*
* DISCLAIMER: This file processes gameplay data derived from the BattleTech universe. 
* All lore, stats, and intellectual property belong strictly to Catalyst Game Labs, 
* Topps, and their respective rights holders. 
*
* This open-source utility is a non-commercial fan project designed purely for 
* tabletop gameplay assistance. Content processed by this file is not intended 
* to challenge any copyright or trademark status, and this data is explicitly 
* excluded from the software's underlying license (GNU GPLv3).
*/

// Defining the 10-100 ton Bipeds here.
const baselineBipedData: Record<number, IRawMechStructure> = {
  //Ultralights
  10: { head: 3, ct: 4, torso: 3, arm: 1, leg: 2 },
  15: { head: 3, ct: 5, torso: 4, arm: 2, leg: 3 },
  // Lights
  20: { head: 3, ct: 6, torso: 5, arm: 3, leg: 4 },
  25: { head: 3, ct: 8, torso: 6, arm: 4, leg: 5 },
  30: { head: 3, ct: 10, torso: 7, arm: 5, leg: 7 },
  35: { head: 3, ct: 11, torso: 8, arm: 6, leg: 8 },
  // Mediums
  40: { head: 3, ct: 12, torso: 10, arm: 6, leg: 10 },
  45: { head: 3, ct: 14, torso: 11, arm: 7, leg: 11 },
  50: { head: 3, ct: 16, torso: 12, arm: 8, leg: 12 },
  55: { head: 3, ct: 17, torso: 13, arm: 9, leg: 13 },
  // Heavies
  60: { head: 3, ct: 19, torso: 14, arm: 10, leg: 14 },
  65: { head: 3, ct: 20, torso: 15, arm: 10, leg: 15 },
  70: { head: 3, ct: 22, torso: 15, arm: 11, leg: 15 },
  75: { head: 3, ct: 23, torso: 16, arm: 12, leg: 16 },
  // Assaults
  80: { head: 3, ct: 25, torso: 17, arm: 13, leg: 17 },
  85: { head: 3, ct: 27, torso: 18, arm: 14, leg: 18 },
  90: { head: 3, ct: 29, torso: 19, arm: 15, leg: 19 },
  95: { head: 3, ct: 30, torso: 20, arm: 16, leg: 20 },
  100: { head: 3, ct: 31, torso: 21, arm: 17, leg: 21 },
};

// Superheavy 'Mech Structure Table, 105 to 200 tons (IO:AE p.155)
const superheavyBipedData: Record<number, IRawMechStructure> = {
  105: { head: 4, ct: 32, torso: 22, arm: 17, leg: 22 },
  110: { head: 4, ct: 33, torso: 23, arm: 18, leg: 23 },
  115: { head: 4, ct: 35, torso: 24, arm: 19, leg: 24 },
  120: { head: 4, ct: 36, torso: 25, arm: 20, leg: 25 },
  125: { head: 4, ct: 38, torso: 26, arm: 21, leg: 26 },
  130: { head: 4, ct: 39, torso: 27, arm: 21, leg: 27 },
  135: { head: 4, ct: 41, torso: 28, arm: 22, leg: 28 },
  140: { head: 4, ct: 42, torso: 29, arm: 23, leg: 29 },
  145: { head: 4, ct: 44, torso: 31, arm: 24, leg: 31 },
  150: { head: 4, ct: 45, torso: 32, arm: 25, leg: 32 },
  155: { head: 4, ct: 47, torso: 33, arm: 26, leg: 33 },
  160: { head: 4, ct: 48, torso: 34, arm: 26, leg: 34 },
  165: { head: 4, ct: 50, torso: 35, arm: 27, leg: 35 },
  170: { head: 4, ct: 51, torso: 36, arm: 28, leg: 36 },
  175: { head: 4, ct: 53, torso: 37, arm: 29, leg: 37 },
  180: { head: 4, ct: 54, torso: 38, arm: 30, leg: 38 },
  185: { head: 4, ct: 56, torso: 39, arm: 31, leg: 39 },
  190: { head: 4, ct: 57, torso: 40, arm: 31, leg: 40 },
  195: { head: 4, ct: 59, torso: 41, arm: 32, leg: 41 },
  200: { head: 4, ct: 60, torso: 42, arm: 33, leg: 42 },
};

// Combine all raw weights
const allTonnages = { ...baselineBipedData, ...superheavyBipedData };

// Helper function to populate variants dynamically
function generateStructuresForType(
  type: 'biped' | 'quad' | 'tripod' | 'lam' | 'quadvee',
  _rulesLevel: number = 2 // Defaults to Standard/Tournament Legal
): Record<number, IInternalStructurePerTon> {
  const result: Record<number, IInternalStructurePerTon> = {};

  Object.keys(allTonnages).forEach((tonStr) => {
    const ton = parseInt(tonStr);
    const raw = allTonnages[ton];

    // Standard Biped mapping
    if (type === 'biped' || type === 'lam') {
      result[ton] = {
        tonnage: ton,
        head: raw.head,
        centerTorso: raw.ct,
        leftTorso: raw.torso,
        rightTorso: raw.torso,
        leftArm: raw.arm,
        rightArm: raw.arm,
        leftLeg: raw.leg,
        rightLeg: raw.leg,
      };
    }

    // Quads and QuadVees share the exact same structural anatomy
    if (type === 'quad' || type === 'quadvee') {
      result[ton] = {
        tonnage: ton,
        head: raw.head,
        centerTorso: raw.ct,
        leftTorso: raw.torso,
        rightTorso: raw.torso,
        leftLeg: raw.leg,       // Rear Left Leg
        rightLeg: raw.leg,      // Rear Right Leg
        frontLeftLeg: raw.leg,  // Front Left Leg
        frontRightLeg: raw.leg, // Front Right Leg
      };
    }

    // Tripod mapping (Clones leg parameter a third time to create centerLeg)
    if (type === 'tripod') {
      result[ton] = {
        tonnage: ton,
        head: raw.head,
        centerTorso: raw.ct,
        leftTorso: raw.torso,
        rightTorso: raw.torso,
        leftArm: raw.arm,
        rightArm: raw.arm,
        leftLeg: raw.leg,
        rightLeg: raw.leg,
        centerLeg: raw.leg,
      };
    }
  });

  return result;
}

// Costs per ton of 'Mech: TechManual (Endo-Composite and Reinforced: TO:AUE).
// Dates: IO tech progression; clanDates where the Clan window differs.
export const mechInternalStructureTypes: IInternalStructure[] = [
  {
    name: "Standard",
    tag: "standard",
    book: "TM",
    page: 225,
    prototype: 2430,
    introduced: 2439,
    extinct: null,
    reintroduced: null,
    crits: { clan: 0, is: 0 },
    cost: 400,
    perMechType: {
      biped: generateStructuresForType('biped'),
      quad: generateStructuresForType('quad'),
      tripod: generateStructuresForType('tripod'),
      lam: generateStructuresForType('lam'),
      quadvee: generateStructuresForType('quadvee'),
    }
  },
  {
    name: "Endo-Steel",
    tag: "endo-steel",
    book: "TM",
    page: 224,
    prototype: 2480,
    introduced: 2487,
    extinct: 2850,
    reintroduced: 3035,
    clanDates: { prototype: 2825, introduced: 2827, extinct: null, reintroduced: null },
    crits: { clan: 7, is: 14 }, // Halves structure weight
    cost: 1600,
    perMechType: {
      biped: generateStructuresForType('biped'),
      quad: generateStructuresForType('quad'),
      tripod: generateStructuresForType('tripod'),
      lam: generateStructuresForType('lam'),
      quadvee: generateStructuresForType('quadvee'),
    }
  },
  {
    name: "Endo-Composite",
    tag: "endo-composite",
    book: "TO:AUE",
    page: 154,
    prototype: 3067,
    introduced: 3085,
    extinct: null,
    reintroduced: null,
    clanDates: { prototype: 3073, introduced: 3085, extinct: null, reintroduced: null },
    crits: { clan: 4, is: 7 }, // Reduces structure weight by 25%
    cost: 3200,
    perMechType: {
      biped: generateStructuresForType('biped'),
      quad: generateStructuresForType('quad'),
      tripod: generateStructuresForType('tripod'),
      lam: generateStructuresForType('lam'),
      quadvee: generateStructuresForType('quadvee'),
    }
  },
  {
    name: "Reinforced",
    tag: "reinforced",
    book: "TO:AUE",
    page: 155,
    prototype: 3057,
    introduced: 3084,
    extinct: null,
    reintroduced: null,
    clanDates: { prototype: 3065, introduced: 3084, extinct: null, reintroduced: null },
    bvMultiplier: 2,
    crits: { clan: 0, is: 0 }, // Doubles structure weight but adds hit resistance
    cost: 6400,
    perMechType: {
      biped: generateStructuresForType('biped'),
      quad: generateStructuresForType('quad'),
      tripod: generateStructuresForType('tripod'),
      lam: generateStructuresForType('lam'),
      quadvee: generateStructuresForType('quadvee'),
    }
  },
  {
    name: "Composite",
    tag: "composite",
    book: "TO:AUE",
    page: 154,
    prototype: 3061,
    introduced: 3082,
    extinct: null,
    reintroduced: null,
    crits: { clan: 0, is: 0 }, // Half the weight of standard structure in no slots; Inner Sphere only
    cost: 1600,
    bvMultiplier: 0.5,
    innerSphereOnly: true,
    perMechType: {
      biped: generateStructuresForType('biped'),
      quad: generateStructuresForType('quad'),
      tripod: generateStructuresForType('tripod'),
      lam: generateStructuresForType('lam'),
      quadvee: generateStructuresForType('quadvee'),
    }
  },
  {
    name: "Industrial",
    tag: "industrial",
    book: "TM",
    page: 224,
    prototype: 2300,
    introduced: 2350,
    extinct: null,
    reintroduced: null,
    bvMultiplier: 0.5,
    crits: { clan: 0, is: 0 }, // Heavily restricts armor types and critical limits
    cost: 300,
    perMechType: {
      biped: generateStructuresForType('biped'),
      quad: generateStructuresForType('quad'),
      tripod: generateStructuresForType('tripod'),
      lam: generateStructuresForType('lam'),
      quadvee: generateStructuresForType('quadvee'),
    }
  }
];

export function validateChassisCombination(
  structureTag: string, 
  mechTypeTag: string, 
  tonnage: number, 
  rulesLevel: number = 2
): boolean {
  // Industrial structure cannot be paired with LAM or QuadVee
  if (structureTag === 'industrial' && (mechTypeTag === 'lam' || mechTypeTag === 'quadvee')) {
    return false; // Invalid combination!
  }
  // Rules-enforcement: tonnage must fall within the chassis type's legal range for the rules level in play
  const { min, max } = getTonnageBoundsForMechType(mechTypeTag, rulesLevel);
  if (tonnage < min || tonnage > max) {
    return false; // Invalid combination!
  }
  return true; // Legal build
}
