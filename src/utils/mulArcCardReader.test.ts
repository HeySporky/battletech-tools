import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// The MUL publishes large craft arc damage only on the card-back image (#32). The fixtures keep just the card's
// header and value text, in black and white.
import { bitmapOfPng, compactArcs, readArcCard } from "../../tools/mul-sync/arc-card-reader.mjs";
import glyphs from "../../tools/mul-sync/arc-card-glyphs.json";

type Arc = Record<string, string[]> & { spe: string };
interface IReadCard { capital?: boolean; arcs: Record<"front" | "rear" | "left" | "right", Arc>; unknown?: string[] }
const fixture = (name: string) => bitmapOfPng(readFileSync(`tools/mul-sync/__fixtures__/${name}-back.png`));
const read = (name: string, table: Record<string, string> = glyphs): IReadCard => readArcCard(fixture(name), table) as IReadCard;
const empty = ["", "", "", ""];

describe("reading a large craft's MUL card back", () => {
    it("reads a DropShip's four arcs: Overlord (Vehicle)", () => {
        const card = read("overlord-vehicle");
        expect(card.unknown).toBeUndefined();
        expect(card.capital).toBe(false);
        expect(card.arcs.front).toEqual({ std: ["8", "9", "4", ""], scap: empty, msl: empty, spe: "" });
        expect(card.arcs.rear).toEqual({ std: ["5", "6", "3", ""], scap: empty, msl: empty, spe: "" });
        expect(card.arcs.left).toEqual({ std: ["3", "3", "2", ""], scap: empty, msl: empty, spe: "" });
        expect(card.arcs.right).toEqual({ std: ["3", "3", "2", ""], scap: empty, msl: empty, spe: "" });
    });

    it("reads a WarShip's CAP column and arc abilities: Kimagure (Surprise)", () => {
        const card = read("kimagure-surprise");
        expect(card.capital).toBe(true);
        expect(card.arcs.front).toEqual({ std: ["11", "11", "11", ""], cap: ["90", "90", "90", "36"], scap: empty, msl: empty, spe: "FLK8/8/8/-" });
        expect(card.arcs.rear).toEqual({ std: ["10", "10", "5", ""], cap: ["20", "20", "20", ""], scap: empty, msl: empty, spe: "" });
        expect(card.arcs.left).toEqual({ std: ["4", "4", "4", ""], cap: ["126", "126", "126", "126"], scap: empty, msl: empty, spe: "FLK4/4/4/-" });
        expect(card.arcs.right).toEqual(card.arcs.left);
    });

    it("reads an arc with abilities but no damage, spaces kept: Foxhound Gunboat TIG-40", () => {
        const card = read("foxhound-tig-40");
        expect(card.arcs.front).toEqual({ std: ["4", "4", "4", ""], scap: empty, msl: empty, spe: "PNT1" });
        expect(card.arcs.rear).toEqual({ std: empty, scap: empty, msl: empty, spe: "ENE, PNT1" });
        expect(card.arcs.left.std).toEqual(["1", "2", "2", ""]);
    });

    it("keeps a two-digit ability value whole, and spaces only after commas: Thera Carrier", () => {
        const card = read("thera-carrier");
        expect(card.arcs.front.spe).toBe("PNT12, FLK4/4/4/-");
        expect(card.arcs.front.cap).toEqual(["187", "187", "187", "17"]);
        expect(card.arcs.front.msl).toEqual(["4", "4", "4", "4"]);
        expect(card.arcs.rear.spe).toBe("PNT4, FLK1/1/1/-");
    });

    it("reads a minimal-damage asterisk, drawn in two pieces: Sassanid", () => {
        const card = read("sassanid");
        expect(card.arcs.front).toEqual({ std: ["19", "19", "10", "3"], scap: empty, msl: empty, spe: "FLK1/1/1/-" });
        expect(card.arcs.left.spe).toBe("FLK0*/0*/0*/-");
    });

    it("refuses a card with a glyph it has never been taught, instead of guessing", () => {
        const card = read("overlord-vehicle", {});
        expect(card.arcs).toBeUndefined();
        expect(card.unknown?.length).toBeGreaterThan(0);
    });

    it("stores only the columns with values, and abilities when there are any", () => {
        const card = read("foxhound-tig-40");
        expect(compactArcs(card.arcs)).toEqual({
            front: { std: ["4", "4", "4", ""], spe: "PNT1" },
            rear: { spe: "ENE, PNT1" },
            left: { std: ["1", "2", "2", ""] },
            right: { std: ["1", "2", "2", ""] },
        });
    });

    it("stores an unarmed craft's blank card back as no arcs at all: Hephaestus Station", () => {
        const card = read("hephaestus-station");
        expect(card.unknown).toBeUndefined();
        expect(compactArcs(card.arcs)).toEqual({});
    });
});
