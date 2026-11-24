import { getEquipmentRecordsByTech } from "../data/equipment-registry";

// MegaMek lists a launcher's fire control system (Artemis IV or V, Apollo) and a PPC's capacitor as lines of their own.
// This catalog has a record for the weapon with the system fitted ("lrm-20-artemis-iv", "ppc-capacitor"), so a reader
// swaps one weapon in the same location for that record. Shared by the MegaMek readers.

/** The fitted record's tag suffix, by the line's lookup name (lower case, letters and digits, no IS/CL prefix). */
const FIRE_CONTROL_SUFFIXES: Record<string, string> = Object.assign(Object.create(null), {
    artemisiv: "-artemis-iv", artemisv: "-artemis-v", apollo: "-apollo", ppccapacitor: "-capacitor",
});

/** The suffix a fire control or capacitor line fits, or none when the line is something else. */
export const getBlkFireControlSuffix = (name: string): string | undefined =>
    FIRE_CONTROL_SUFFIXES[name.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/^(is|cl)(?=[a-z])/, "")];

let catalogTags: Set<string> | null = null;

/** The record with the system fitted: "lrm-20" to "lrm-20-artemis-iv", "standard-ppc" to "ppc-capacitor"; none if the catalog has none. */
export const getBlkFittedTag = (tag: string, suffix: string): string | undefined => {
    catalogTags ??= new Set([...getEquipmentRecordsByTech("is"), ...getEquipmentRecordsByTech("clan")].map((item) => item.tag));
    return /-(artemis|apollo|capacitor)/.test(tag) ? undefined
        : [tag + suffix, tag.replace(/^standard-/, "") + suffix].find((candidate) => catalogTags!.has(candidate));
};
