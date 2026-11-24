// SSW names that are canon BattleTech items with no catalog record yet. An import that meets one reports it as
// "canon item, not yet in the catalog" instead of making a custom draft, so canon gear is never submitted as
// homebrew. Generated from the SSW corpus audit (src/utils/ssw-corpus-audit.test.ts) and reviewed by hand; each
// entry names the book and page that make it canon. Remove an entry when its record is added.
// Reviewed and approved by the user 2026-09-30 (WorkingData_DEV/ssw-canon-pending-review.md).
export const SSW_CANON_PENDING_NAMES: readonly { kind: string; name: string; note: string }[] = [
    { kind: "gyro", name: "No Gyro", note: "IO p.193 (Gyroless 'Mechs)" },
];

const keys = new Set(SSW_CANON_PENDING_NAMES.map((entry) => `${entry.kind}|${entry.name.trim().toLowerCase()}`));

export function isSSWCanonPending(kind: string, name: string): boolean {
    return keys.has(`${kind}|${name.trim().toLowerCase()}`);
}
