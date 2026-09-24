import { describe, expect, it } from "vitest";
import { loadMULListItems } from "./mul-list-items";

describe("MUL chunk loader", () => {
    it("loads unit records from the chunked JSON and ignores metadata-only entries", async () => {
        const items = await loadMULListItems();

        expect(items.length).toBeGreaterThan(0);
        expect(items.some((item) => item.Id === 2 && item.Name?.trim() === "AA Jump Infantry")).toBe(true);
        expect(items.some((item) => item.Id === 2 && "Title" in item)).toBe(false);
    });
});
