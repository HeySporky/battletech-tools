import type { IArmorType, IEngineType, IGyro, IHeatSync, IInternalStructure, IJumpJet, IMyomerType } from "./data-interfaces";
import type { CustomComponentKind } from "./custom-content-types";
import { mechArmorTypes } from "./mech-armor-types";
import { mechEngineTypes } from "./mech-engine-types";
import { mechGyroTypes } from "./mech-gyro-types";
import { mechHeatSinkTypes } from "./mech-heat-sink-types";
import { mechInternalStructureTypes } from "./mech-internal-structure-types";
import { mechJumpJetTypes } from "./mech-jump-jet-types";
import { mechMyomerTypes } from "./mech-myomer-types";
import { mechCustomArmorTypes } from "./mech-custom-armor-types";
import { mechCustomEngineTypes } from "./mech-custom-engine-types";
import { mechCustomGyroTypes } from "./mech-custom-gyro-types";
import { mechCustomHeatSinkTypes } from "./mech-custom-heat-sink-types";
import { mechCustomInternalStructureTypes } from "./mech-custom-internal-structure-types";
import { mechCustomJumpJetTypes } from "./mech-custom-jump-jet-types";
import { mechCustomMyomerTypes } from "./mech-custom-myomer-types";

// Chassis components in three tiers: canon, the shared custom catalogs, and this browser's drafts. Lookups go
// in that order, so canon always wins. Using a custom or draft component makes a design Custom Homebrew.

interface IComponentRecordMap {
    armor: IArmorType;
    structure: IInternalStructure;
    engine: IEngineType;
    gyro: IGyro;
    heatSink: IHeatSync;
    jumpJet: IJumpJet;
    myomer: IMyomerType;
}
export type ComponentRecord<K extends CustomComponentKind> = IComponentRecordMap[K];

const canon: { [K in CustomComponentKind]: readonly IComponentRecordMap[K][] } = {
    armor: mechArmorTypes, structure: mechInternalStructureTypes, engine: mechEngineTypes, gyro: mechGyroTypes,
    heatSink: mechHeatSinkTypes, jumpJet: mechJumpJetTypes, myomer: mechMyomerTypes,
};
const custom: { [K in CustomComponentKind]: readonly IComponentRecordMap[K][] } = {
    armor: mechCustomArmorTypes, structure: mechCustomInternalStructureTypes, engine: mechCustomEngineTypes,
    gyro: mechCustomGyroTypes, heatSink: mechCustomHeatSinkTypes, jumpJet: mechCustomJumpJetTypes,
    myomer: mechCustomMyomerTypes,
};
const local: { [K in CustomComponentKind]: IComponentRecordMap[K][] } = {
    armor: [], structure: [], engine: [], gyro: [], heatSink: [], jumpJet: [], myomer: [],
};

export const CUSTOM_COMPONENT_KINDS: readonly CustomComponentKind[] = ["armor", "structure", "engine", "gyro", "heatSink", "jumpJet", "myomer"];

export const CUSTOM_COMPONENT_CATALOGS: Record<CustomComponentKind, { id: string; exportName: string }> = {
    armor: { id: "mech-custom-armor-types", exportName: "mechCustomArmorTypes" },
    structure: { id: "mech-custom-internal-structure-types", exportName: "mechCustomInternalStructureTypes" },
    engine: { id: "mech-custom-engine-types", exportName: "mechCustomEngineTypes" },
    gyro: { id: "mech-custom-gyro-types", exportName: "mechCustomGyroTypes" },
    heatSink: { id: "mech-custom-heat-sink-types", exportName: "mechCustomHeatSinkTypes" },
    jumpJet: { id: "mech-custom-jump-jet-types", exportName: "mechCustomJumpJetTypes" },
    myomer: { id: "mech-custom-myomer-types", exportName: "mechCustomMyomerTypes" },
};

/** The first canon record of each kind: a draft's field template. */
export const CANON_COMPONENT_TEMPLATES: { [K in CustomComponentKind]: IComponentRecordMap[K] } = {
    armor: mechArmorTypes[0], structure: mechInternalStructureTypes[0], engine: mechEngineTypes[0],
    gyro: mechGyroTypes[0], heatSink: mechHeatSinkTypes[0], jumpJet: mechJumpJetTypes[0], myomer: mechMyomerTypes[0],
};

export function getComponentTiers<K extends CustomComponentKind>(kind: K): readonly (readonly IComponentRecordMap[K][])[] {
    return [canon[kind], custom[kind], local[kind]];
}

export function getComponentRecords<K extends CustomComponentKind>(kind: K): IComponentRecordMap[K][] {
    return getComponentTiers(kind).flat();
}

export function setLocalCustomComponents<K extends CustomComponentKind>(kind: K, records: IComponentRecordMap[K][]): void {
    (local as Record<CustomComponentKind, unknown[]>)[kind] = records;
}

/** Whether a component is homebrew: not a canon record (by identity or tag). */
export function isCustomComponent<K extends CustomComponentKind>(kind: K, record: IComponentRecordMap[K] | null | undefined): boolean {
    return !!record && !canon[kind].some((candidate) => candidate === record || candidate.tag === record.tag);
}
