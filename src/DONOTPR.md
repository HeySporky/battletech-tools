# Project State Continuity: BattleTech Tools (TypeScript)
## Context Restoration Document for Multi-Chassis Architecture (Biped, LAM, Quad, QuadVee, Tripod)

### 1. MISSION OBJECTIVE
Refactor the core `BattleMech` implementation class file to natively support all five canonical BattleTech chassis structural layouts (**Biped, LAM, Quad, QuadVee, and Tripod**) without falling back to legacy arm-swapping string hacks. Ensure absolute strict type-safety under compilation filters and enforce proper **16 points per full ton** standard armor conversions.

### 2. DATA BLUEPRINTS & INTERFACES (From `data-interface.ts`)
The class backing objects must implement these exact interface profiles natively:

```typescript
export interface IInternalStructurePerTon {
    tonnage: number;
    head: number;
    centerTorso: number;
    leftTorso: number;
    rightTorso: number;
    leftArm?: number;     // Optional (Quads lack arms)
    rightArm?: number;    // Optional (Quads lack arms)
    leftLeg: number;      // Biped legs or Quad rear-left leg
    rightLeg: number;     // Biped legs or Quad rear-right leg
    centerLeg?: number;    // Used explicitly by Tripods
    frontLeftLeg?: number; // Used explicitly by Quads / QuadVees
    frontRightLeg?: number;// Used explicitly by Quads / QuadVees
}

export interface IMechDamageAllocation {
    head: any[];
    centerTorso: any[];
    rightTorso: any[];
    leftTorso: any[];
    leftArm?: any[];
    rightArm?: any[];
    leftLeg: any[];
    rightLeg: any[];
    rightTorsoRear: any[];
    leftTorsoRear: any[];
    centerTorsoRear: any[];
    centerLeg?: any[];
    frontLeftLeg?: any[];
    frontRightLeg?: any[];
}

export interface IArmorAllocation {
    head: number;
    centerTorso: number;
    rightTorso: number;
    leftTorso: number;
    centerTorsoRear: number;
    rightTorsoRear: number;
    leftTorsoRear: number;
    leftArm: number;
    rightArm: number;
    leftLeg: number;
    rightLeg: number;
    centerLeg: number;
    frontLeftLeg: number;
    frontRightLeg: number;
}
```

### 3. COMPLETED SUBROUTINES & CORE ALGORITHMS
The following sections have been fully over-hauled, cleaned of legacy pointer hacks, and type-secured:

* **Property Fields Block:** Configured explicit property type declarations on lines 262-305. Objects like `_internalStructure`, `_armorBubbles`, and `_structureBubbles` initialize empty matching buckets for all expanded anatomical locations.
* **`setTonnage()` Engine:** Correctly maps incoming tonnage structural blocks from `perMechType` using your repository arrays. Dynamically increments `_maxArmor` based on layout equations (2× Internal Structure per active location, plus 9 points for the head).
* **`getMaxArmorTonnage()` Logic:** Fully synchronizes with the `mechArmorTypes` multiplier array database. Evaluates canonical BattleTech armor rules base points (**16 points per full ton** / 8 per half-ton) and rounds up to the next half-ton using `Math.ceil(rawTonnage * 2) / 2`.
* **HTML Status String Generation Engine:** Formats text output layouts contextually. Employs descriptive column markers (e.g. "R/L Front Leg") and fixes a structural padding alignment error on rear torso layout tracks.
* **Jump Jet Table Aggregation Subroutine:** Groups unallocated and slot-bound Jump Jet components cleanly. Calculates weight criteria upfront based on tech weights (`light`, `medium`, etc.) to eliminate nested loop redundancies.
* **Core Syncing Handlers (`_calcArmorStructureBubbles()`, `_calcCriticals()`, `_trimCriticals()`):** Employs safe numerical variable indices (`for (let i = 0; i < len; i++)`) and explicit array size length settings (`.length = targetCount`) to truncate array vectors safely without mutating objects or inducing memory leaks.
* **Damage Tracker and Allocation Methods:** Lookups for method metrics (`_structureInLocation()`, `_armorInLocation()`, `_takeArmorDamageAtLocation()`, `_takeStructureDamageAtLocation()`, `_addCriticalItem()`, and `_updateCriticalAllocationTable()`) execute through high-speed translation dictionaries instead of deep conditional blocks. Advanced components safely understand shorthand tokens like `"cl"`, `"fll"`, and `"frl"`.
* **`_moveDamageLocationIn()` System:** Employs explicit transfer routing maps modeling tabletop armor rules—Quad front legs transfer damage cleanly inward to side torsos (`"lt"` / `"rt"`) rather than shifting straight to the center drive core.
* **Limb Actuator Setup Blocks:** Distributes precise critical joint objects sequentially. Standard arms allocate 12 critical slots, whereas driving legs, Quad front limbs, and Tripod third legs enforce the absolute structural rule clamp of **6 slots max**.
* **Movement Managers (`moveCritical()`, `_moveItemToArea()`, `_allocateCritical()`):** Decouples inventory management from name tags by querying definitive unique object strings (`currentItem.uuid === equipmentUUID`). Fully supports split-location multi-slot items.
* **`setEngine()` and `resetDamage()` Guards:** Standardizes input variables securely using base-10 numerical parsing. Dynamically flushes outdated tracking cache structures to cleanly clear sheet boxes without throwing prototype errors.

### 4. IMMEDIATE NEXT STEPS / OPEN TASK ITEMS
When resuming this session, advance straight to the remaining items in the build layout cleanup queue:

1. **Internal Structure Allocation Setters:** Implement matching context-aware layout routers for structure points (e.g., matching the architectural blueprint of the `setLeftArmInternalStructure` systems).
2. **Heat Sink Calculation Engine Overhaul:** Update inventory processing logic tracking single vs. double dissipation heat sink structures across custom layout allocations.
3. **UI / View Layer Synchronization:** Map frontend reactive state elements to correctly hook into the new unified anatomical setter pathways.