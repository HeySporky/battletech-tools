import { describe, expect, it } from "vitest";
import { isSSWCanonPending, SSW_CANON_PENDING_NAMES } from "./ssw-canon-pending-names";

describe("SSW canon-pending names", () => {
    it.skipIf(SSW_CANON_PENDING_NAMES.length === 0)("matches by kind and case-insensitive name", () => {
        const first = SSW_CANON_PENDING_NAMES[0];
        expect(isSSWCanonPending(first.kind, first.name.toUpperCase())).toBe(true);
        expect(isSSWCanonPending(first.kind, "Widget Cannon")).toBe(false);
    });

    it("every entry cites a book and page", () => {
        for (const entry of SSW_CANON_PENDING_NAMES) {
            expect(entry.note, entry.name).toMatch(/p\.\s?\d+/);
        }
    });

    it("an unlisted name is not pending", () => {
        expect(isSSWCanonPending("equipment", "Widget Cannon")).toBe(false);
    });
});
