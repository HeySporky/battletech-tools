export type TroTextKey = "overview" | "capabilities" | "deployment" | "battleHistory" | "variants" | "notableUnits" | "notes";

/** The text sections of a Technical Readout, in print order. */
export const TRO_TEXT_SECTIONS: { key: TroTextKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "capabilities", label: "Capabilities" },
    { key: "deployment", label: "Deployment" },
    { key: "battleHistory", label: "Battle History" },
    { key: "variants", label: "Variants" },
    { key: "notableUnits", label: "Notable Units" },
    { key: "notes", label: "Notes" },
];

/** Labels for component keys a unit type may have no row for (an imported make), by key. */
export const TRO_COMPONENT_LABELS: Record<string, string> = {
    chassis: "Chassis", engine: "Engine", armor: "Armor", structure: "Internal Structure", heatSinks: "Heat Sinks",
    jumpJets: "Jump Jets", gyro: "Gyro", cockpit: "Cockpit", myomer: "Myomer", kfDrive: "K-F Drive",
};

export type TroProductionKey = "manufacturer" | "primaryFactory" | "communications" | "targeting";

export interface ITroMake {
    manufacturer?: string;
    model?: string;
}

export interface ITroEquipmentMake extends ITroMake {
    mixed?: boolean;
    /** Per-copy makes, keyed by equipment uuid; only used while mixed. */
    copies?: Record<string, ITroMake>;
}

export interface ITechnicalReadoutExport {
    production?: Partial<Record<TroProductionKey, string>>;
    /** Component key to one make. */
    components?: Record<string, string>;
    /** Catalog tag to make. */
    equipment?: Record<string, ITroEquipmentMake>;
    text?: Partial<Record<TroTextKey, string>>;
}

export interface ITroComponentRow {
    key: string;
    label: string;
    /** A make the rules edition's own tables name (a Battledroids engine's maker): shown as a hint, printed when none is entered. */
    suggested?: string;
}

export interface ITroEquipmentCopy {
    uuid: string;
    tag: string;
    name: string;
    locationLabel: string;
    /** False for equipment the Armament line leaves out (electronics and other miscellaneous items); weapons when absent. */
    armament?: boolean;
}

export interface ITroSpecValues {
    title: string;
    subtitle: string;
    /** Left out for types with no mass of their own (buildings carry a weight capacity instead). */
    mass?: string;
    cruisingSpeed?: string;
    maximumSpeed?: string;
    jumpCapacity?: string;
    armorType?: string;
}

export interface ITroConstructionRow {
    label: string;
    value?: string;
    mass?: string;
    indent?: boolean;
    heading?: boolean;
}

/** What a unit type tells the shared Technical Readout section and sheet about itself. */
export interface ITroUnitAdapter {
    getComponentRows(): ITroComponentRow[];
    /** The current loadout, ammunition excluded. */
    getEquipmentCopies(): ITroEquipmentCopy[];
    /** Every uuid any configuration holds (OmniMech pods too). */
    getKnownEquipmentUuids(): string[];
    /** Every catalog tag any configuration holds, so a make on a pod in another configuration is not pruned. */
    getKnownEquipmentTags(): string[];
    /** Gives a uuid-less copy one and returns it. */
    ensureEquipmentUuid(copy: ITroEquipmentCopy): string;
    getSpecValues(): ITroSpecValues;
    getConstructionRows(): ITroConstructionRow[];
}
