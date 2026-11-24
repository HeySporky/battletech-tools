import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { IASMULUnit } from "./classes/alpha-strike-unit";
import { filterMULRecords, getMULSearchWarnings } from "./utils";

// #625: role: and tech: as search terms, short/medium/long ranges, and a warning for unknown word:value terms.
const record = (name: string, role: string, tech: string, damage: [number, number, number]): IASMULUnit => ({
    Name: name, Variant: "", Class: name, BFPointValue: 30,
    BFDamageShort: damage[0], BFDamageMedium: damage[1], BFDamageLong: damage[2], BFArmor: 4, BFStructure: 3,
    DateIntroduced: "3050", BFMove: "8\"", BFAbilities: "",
    Role: { Id: 1, Name: role, Image: "", SortOrder: 0 }, Technology: { Id: 1, Name: tech, Image: "", SortOrder: 0 },
} as unknown as IASMULUnit);
const UNITS = [
    record("Timber Wolf", "Skirmisher", "Clan", [5, 5, 4]),
    record("Shadow Hawk", "Skirmisher", "Inner Sphere", [2, 2, 1]),
    record("Shilone", "Fire Support", "Clan", [3, 3, 2]),
    record("Awesome", "Brawler", "Inner Sphere", [3, 3, 2]),
];
const filters = (term: string) => ({ term, abilities: [], era: 0, rules: "", tech: "", role: "", type: 0, factions: [], rulesets: [], sources: [] }) as never;
const names = (term: string) => filterMULRecords(UNITS, filters(term)).map((found) => found.Name);

describe("MUL search: role: and tech: terms", () => {
    it("role:<name> matches the Role filter, ignoring case", () => {
        expect(names("role:skirmisher")).toEqual(["Timber Wolf", "Shadow Hawk"]);
        expect(names("role:Brawler")).toEqual(["Awesome"]);
    });

    it("a role of two words is typed without its space (role:firesupport, role:fire-support)", () => {
        expect(names("role:firesupport")).toEqual(["Shilone"]);
        expect(names("role:fire-support")).toEqual(["Shilone"]);
        expect(names("role:fire_support")).toEqual(["Shilone"]);
    });

    it("tech:<name> matches the Tech filter; tech:is is Inner Sphere", () => {
        expect(names("tech:clan")).toEqual(["Timber Wolf", "Shilone"]);
        expect(names("tech:innersphere")).toEqual(["Shadow Hawk", "Awesome"]);
        expect(names("tech:is")).toEqual(["Shadow Hawk", "Awesome"]);
    });

    it("combine with each other and with name words", () => {
        expect(names("role:skirmisher tech:clan")).toEqual(["Timber Wolf"]);
        expect(names("hawk role:skirmisher")).toEqual(["Shadow Hawk"]);
    });
});

describe("MUL search: damage ranges", () => {
    it("short:, medium: and long: take a min-max range, as do s:, m: and l:", () => {
        expect(names("short:3-5")).toEqual(["Timber Wolf", "Shilone", "Awesome"]);
        expect(names("medium:2-3")).toEqual(["Shadow Hawk", "Shilone", "Awesome"]);
        expect(names("long:4-9")).toEqual(["Timber Wolf"]);
        expect(names("s:2-2")).toEqual(["Shadow Hawk"]);
        expect(names("m:5-5 l:4-4")).toEqual(["Timber Wolf"]);
    });
});

describe("MUL search: unknown word:value terms", () => {
    it("are not searched as names, so they hide nothing", () => {
        expect(names("colour:red")).toEqual(["Timber Wolf", "Shadow Hawk", "Shilone", "Awesome"]);
        expect(names("wolf colour:red")).toEqual(["Timber Wolf"]);
    });

    it("are named in a warning; known terms are not", () => {
        expect(getMULSearchWarnings("wolf colour:red")).toEqual(['"colour:red" is not a search term, so it was left out.']);
        expect(getMULSearchWarnings("role:skirmisher tech:clan a:ECM dmg:3/3/2 pv:20-40 short:2-3 pv>20")).toEqual([]);
        expect(getMULSearchWarnings("")).toEqual([]);
    });

    it("warn on a role or tech that no unit can have", () => {
        expect(getMULSearchWarnings("role:tank")).toEqual(['"role:tank" is not a MUL role, so no unit matches it.']);
        expect(getMULSearchWarnings("tech:martian")).toEqual(['"tech:martian" is not a MUL tech base, so no unit matches it.']);
    });

    it("none of the Home page's search examples warns", () => {
        const home = readFileSync(new URL("./ui/pages/home.tsx", import.meta.url), "utf8");
        const section = home.slice(home.indexOf("Advanced Search Terms"), home.indexOf("A word:value term"));
        const examples = [...section.matchAll(/<i>([^<]+)<\/i>/g)].map((found) => found[1]
            .replace(/&gt;/g, ">").replace(/&lt;/g, "<"));
        expect(examples.length).toBeGreaterThan(5);
        expect(examples.flatMap((example) => getMULSearchWarnings(example))).toEqual([]);
    });

    it("a range on a field that takes none is named too", () => {
        expect(getMULSearchWarnings("colour:2-3")).toEqual(['"colour:2-3" is not a search term, so it was left out.']);
    });
});
