import { describe, expect, it } from "vitest";
import { paginate } from "./paginate";

const items = Array.from({ length: 8711 }, (_, index) => index);

describe("paginate", () => {
    it("returns only one page of a large result set", () => {
        const page = paginate(items, 0, 25);
        expect(page.items).toHaveLength(25);
        expect(page.items[0]).toBe(0);
        expect(page.totalPages).toBe(349);
        expect(page.firstIndex).toBe(0);
        expect(page.lastIndex).toBe(24);
    });

    it("returns a short final page", () => {
        const page = paginate(items, 348, 25);
        expect(page.items).toEqual([8700, 8701, 8702, 8703, 8704, 8705, 8706, 8707, 8708, 8709, 8710]);
        expect(page.firstIndex).toBe(8700);
        expect(page.lastIndex).toBe(8710);
    });

    it("clamps a page past the end to the last page", () => {
        const page = paginate(items, 9999, 25);
        expect(page.page).toBe(348);
        expect(page.items[0]).toBe(8700);
    });

    it("clamps a negative page to the first page", () => {
        expect(paginate(items, -3, 25).page).toBe(0);
    });

    it("treats an empty list as one empty page", () => {
        const page = paginate([], 4, 25);
        expect(page.items).toEqual([]);
        expect(page.page).toBe(0);
        expect(page.totalPages).toBe(1);
    });
});
