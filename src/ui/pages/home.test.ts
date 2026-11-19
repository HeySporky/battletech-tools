import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("home page news", () => {
    // October 26th had three entries; a day gets one entry, which grows through the day (#375).
    it("has one entry per date", () => {
        const text = readFileSync(new URL("./home.tsx", import.meta.url), "utf8");
        const dates = [...text.matchAll(/<strong>([A-Z][a-z]+ \d+(?:st|nd|rd|th), \d{4})<\/strong>/g)].map((m) => m[1]);
        expect(dates.length).toBeGreaterThan(10);
        expect(dates.filter((d, i) => dates.indexOf(d) !== i)).toEqual([]);
    });
});
