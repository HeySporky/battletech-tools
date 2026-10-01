// Custom (homebrew) content drafted in this browser from imported designs, before it is submitted for the
// mech-custom-* catalogs. See docs/superpowers/specs/2026-09-30-ssw-runtime-import-custom-content-design.md.

export type CustomComponentKind = "armor" | "structure" | "engine" | "gyro" | "heatSink" | "jumpJet" | "myomer";
export type CustomContentKind = "equipment" | "ammunition" | CustomComponentKind;
export type CustomFaction = "is" | "clan" | "universal";

export interface ICustomContentSource {
    fileName: string;
    designs: string[];
    sha256: string;
}

export interface ICustomContentDraft {
    id: string;
    kind: CustomContentKind;
    faction: CustomFaction;
    /** Catalog id, e.g. "mech-custom-ammo" or "mech-custom-armor-types". */
    targetCatalogId: string;
    /** The catalog record, field-for-field; null where the stat is still unknown. */
    record: Record<string, unknown>;
    status: "draft" | "complete";
    /** The slot count was estimated from the SSW file and the user has not confirmed it yet. */
    slotsEstimated: boolean;
    sourceFiles: ICustomContentSource[];
    /** The source .ssw text by file name, for the PR's evidence branch. */
    sourceXml?: Record<string, string>;
    sourceNote: string;
    prUrl?: string;
}

/** An item or component an SSW import could not resolve to any record. */
export interface ISSWUnresolvedItem {
    kind: CustomContentKind | "cockpit";
    /** The name the importer looked up (markers such as "(IS) " removed; SSW ammo "@ X" read as "Ammo (X)"). */
    name: string;
    /** The name exactly as the file wrote it. */
    sswName: string;
    faction: "is" | "clan";
    /** SSW's <type> for equipment ("energy", "ammunition", ...); the component kind otherwise. */
    sswType: string;
    /** SSW location code, lowercased ("lt", "ra"); "" for components. */
    location: string;
    /** Starting slot, or -1. */
    slotIndex: number;
    splitLocations: { location: string; index: number }[];
    tons: number | null;
}
