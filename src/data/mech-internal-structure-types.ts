import { IInternalStructure, IInternalStructurePerTon, IRawMechStructure } from "./data-interfaces";

/*
 * The data here is/may be copyrighted and NOT included in the GPLv3 license.
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

// Defining the Colossal/Superheavy Master Table (105 to 200 tons)
const superheavyBipedData: Record<number, IRawMechStructure> = {
  105: { head: 4, ct: 32, torso: 22, arm: 17, leg: 22 },
  110: { head: 4, ct: 33, torso: 23, arm: 18, leg: 23 },
  115: { head: 4, ct: 35, torso: 24, arm: 19, leg: 24 },
  120: { head: 4, ct: 36, torso: 25, arm: 20, leg: 25 },
  125: { head: 4, ct: 38, torso: 26, arm: 21, leg: 26 },
  130: { head: 4, ct: 39, torso: 27, arm: 22, leg: 27 },
  135: { head: 4, ct: 41, torso: 28, arm: 23, leg: 28 },
  140: { head: 4, ct: 42, torso: 29, arm: 23, leg: 29 },
  145: { head: 4, ct: 44, torso: 30, arm: 24, leg: 30 },
  150: { head: 4, ct: 45, torso: 32, arm: 25, leg: 32 },
  155: { head: 4, ct: 47, torso: 32, arm: 26, leg: 32 },
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
  rulesLevel: number = 2 // Defaults to Standard/Tournament Legal
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

export const mechInternalStructureTypes: IInternalStructure[] = [
  {
    name: "Standard",
    tag: "standard",
    crits: { clan: 0, is: 0 },
    cost: 400,
    introduced: 0,
    extinct: 0,
    reintroduced: 0,
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
    crits: { clan: 7, is: 14 }, // Halves structure weight
    cost: 800,
    introduced: 0,
    extinct: 0,
    reintroduced: 0,
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
    crits: { clan: 4, is: 7 }, // Reduces structure weight by 25%
    cost: 600,
    introduced: 0,
    extinct: 0,
    reintroduced: 0,
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
    crits: { clan: 0, is: 0 }, // Doubles structure weight but adds hit resistance
    cost: 1200,
    introduced: 0,
    extinct: 0,
    reintroduced: 0,
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
    crits: { clan: 0, is: 0 }, // Heavily restricts armor types and critical limits
    cost: 200,
    introduced: 0,
    extinct: 0,
    reintroduced: 0,
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
  // Rules-enforcement: LAMs cap out strictly at 55 tons unless running homebrew rule tier 5
  if (mechTypeTag === 'lam' && tonnage > 55 && rulesLevel !== 5){
    return false; // Invalid combination!
  }
  return true; // Legal build
}
