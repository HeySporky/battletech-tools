// SSW names that are canon BattleTech items with no catalog record yet. An import that meets one reports it as
// "canon item, not yet in the catalog" instead of making a custom draft, so canon gear is never submitted as
// homebrew. Generated from the SSW corpus audit (src/utils/ssw-corpus-audit.test.ts) and reviewed by hand; each
// entry names the book and page that make it canon. Remove an entry when its record is added.
// Reviewed and approved by the user 2026-09-30 (WorkingData_DEV/ssw-canon-pending-review.md).
export const SSW_CANON_PENDING_NAMES: readonly { kind: string; name: string; note: string }[] = [
    { kind: "equipment", name: "Coolant Pod", note: "TO:AUE p.115" },
    { kind: "equipment", name: "B-Pod", note: "TM p.204 (Anti-Battle Armor Pods)" },
    { kind: "equipment", name: "M-Pod", note: "TO:AUE p.142" },
    { kind: "equipment", name: "Protomech AC/2", note: "TO:AUE p.98; mounts per each unit's standard rules, TO:AUE p.96" },
    { kind: "equipment", name: "Protomech AC/8", note: "TO:AUE p.98; mounts per each unit's standard rules, TO:AUE p.96" },
    { kind: "equipment", name: "TSEMP", note: "IO p.91" },
    { kind: "equipment", name: "TSEMPOS", note: "IO p.91 (one-shot)" },
    { kind: "equipment", name: "HarJel II", note: "IO p.86-88 (HarJel II/III)" },
    { kind: "equipment", name: "HarJel III", note: "IO p.86-88 (HarJel II/III)" },
    { kind: "equipment", name: "BattleMech Taser", note: "TO:AUE p.156" },
    { kind: "ammunition", name: "Ammo (BattleMech Taser)", note: "TO:AUE p.156" },
    { kind: "equipment", name: "Drone Operating System", note: "TO:AUE p.118" },
    { kind: "equipment", name: "Cargo, Standard", note: "TO:AUE p.72 (cargo)" },
    { kind: "equipment", name: "Cargo, Liquid", note: "TO:AUE p.72 (liquid storage)" },
    { kind: "equipment", name: "Vehicular Grenade Launcher", note: "TO:AUE p.127" },
    { kind: "equipment", name: "Electronic Warfare Equipment", note: "TO:AUE p.122" },
    { kind: "equipment", name: "Chaff Pod", note: "TO:AUE p.110" },
    { kind: "equipment", name: "Collapsible Command Module (CCM)", note: "TO:AUE p.112-114" },
    { kind: "equipment", name: "Communications Equipment", note: "TM p.212" },
    { kind: "equipment", name: "C3 Remote Sensor Launcher", note: "TO:AUE p.110" },
    { kind: "ammunition", name: "Ammo (C3 Remote Launcher)", note: "TO:AUE p.110" },
    { kind: "equipment", name: "Extra Double Heat Sink (Freezers)", note: "IO p.102 (Double Heat Sinks (Freezers))" },
    { kind: "equipment", name: "Medium Pulse Laser (Insulated)", note: "laser + Laser Insulator, TO:AUE p.134 (SSW adapter, spec B)" },
    { kind: "equipment", name: "ER Large Pulse Laser (Insulated)", note: "laser + Laser Insulator, TO:AUE p.134 (SSW adapter, spec B)" },
    { kind: "equipment", name: "ER Medium Pulse Laser (Insulated)", note: "laser + Laser Insulator, TO:AUE p.134 (SSW adapter, spec B)" },
    { kind: "equipment", name: "Bombast Laser (Insulated)", note: "laser + Laser Insulator, TO:AUE p.134 (SSW adapter, spec B)" },
    { kind: "equipment", name: "Heavy Large Laser (Insulated)", note: "laser + Laser Insulator, TO:AUE p.134 (SSW adapter, spec B)" },
    { kind: "equipment", name: "Medium Variable Speed Pulse Laser (Insulated)", note: "laser + Laser Insulator, TO:AUE p.134 (SSW adapter, spec B)" },
    { kind: "equipment", name: "ER PPC + PPC Capacitor", note: "ER PPC + PPC Capacitor, TO:AUE p.148 (SSW adapter, spec B)" },
    { kind: "equipment", name: "Enhanced ER PPC", note: "Enhanced PPC, IO p.95 (SSW name, spec B)" },
    { kind: "equipment", name: "Streak SRM-6 CP", note: "SSW name; Streak SRM 6, TM p.291 (cost table) (spec B)" },
    { kind: "ammunition", name: "Ammo (Streak SRM-6 CP)", note: "SSW name; Streak SRM 6 ammo, TM p.291 (spec B)" },
    { kind: "gyro", name: "No Gyro", note: "IO p.193 (Gyroless 'Mechs)" },
    { kind: "armor", name: "Ablation Armor", note: "IO p.86 (Anti-Penetrative Ablation)" },
    { kind: "jumpJet", name: "Prototype Improved Jump Jet", note: "IO p.70 (prototype systems) to verify" },
];

const keys = new Set(SSW_CANON_PENDING_NAMES.map((entry) => `${entry.kind}|${entry.name.trim().toLowerCase()}`));

export function isSSWCanonPending(kind: string, name: string): boolean {
    return keys.has(`${kind}|${name.trim().toLowerCase()}`);
}
