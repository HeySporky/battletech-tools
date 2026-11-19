import { describe, expect, it } from "vitest";
import { miscCustom } from "./misc-custom";

const find = (tag: string) => miscCustom.find((item) => item.tag === tag)!;

describe("u/Xenosama's QueerTech Discord examples", () => {
    it("keeps the Plasma Lance as posted and prices it by the melee method", () => {
        const lance = find("custom-plasma-lance");
        expect(lance.weight).toBe(4);
        expect(lance.space?.battlemech).toBe(4);
        expect(lance.heat).toBe(5);
        expect(lance.introduced).toBe(3138);
        expect(lance.techBase).toBe("is");
        expect(lance.damage).toBe(15);
        expect(lance.battleValue).toBe(Math.round(15 * 1.275));
        expect(lance.cbills).toBe(Math.round((lance.battleValue! * 1310) / 1000) * 1000);
        expect(lance.rules).toContain("5 + (T x D / 20)");
        expect(lance.notes).toContain("QueerTech Discord");
    });

    it("keeps Xenosama's Pilebunker apart from the Reddit Pile Bunker and credits each author", () => {
        const mine = find("custom-pilebunker-xenosama");
        const reddit = find("custom-pile-bunker");
        expect(mine.tag).not.toBe(reddit.tag);
        expect([mine.weight, mine.space?.battlemech, mine.damage, mine.heat]).toEqual([5, 3, 20, 7]);
        expect([reddit.weight, reddit.space?.battlemech, reddit.damage, reddit.heat]).toEqual([5, 5, 15, 2]);
        expect(mine.introduced).toBe(3138);
        expect(mine.battleValue).toBe(Math.round(20 * 1.275));
        expect(mine.notes).toContain("u/FweeCom");
        expect(reddit.notes).toContain("u/FweeCom");
        expect(mine.notes).toContain("u/Xenosama");
    });
});
