import { describe, expect, it } from "vitest";
import { btEraOptions, findEraByTag, fitTechToEra, getClosestEraForTech, getErasForTech, getTechTagsForEra } from "./era-options";
import { btTechOptions } from "./tech-options";

const tags = (techTag: string) => getErasForTech(techTag).map((era) => era.tag);
const era = (tag: string) => btEraOptions.find((option) => option.tag === tag)!;
const fromClanInvasion = ["clan-inv", "civil-war", "jihad", "early-rep", "late-rep", "dark-ages"];

describe("eras by tech base", () => {
    it("runs the Clan eras from the Founding Years, never the Star League (user ruling 2026-10-21; IO:AE p.9)", () => {
        expect(tags("clan")).toEqual([
            "clan-founding-years", "clan-golden-years",
            ...fromClanInvasion, "clan-post-reaving", "ilClan",
        ]);
    });

    it("keeps the Clan-only eras out of the Inner Sphere list", () => {
        expect(tags("is")).toEqual([
            "age-of-war", "star-league", "early-sw", "late-sw-lt", "late-sw-rn",
            ...fromClanInvasion, "ilClan",
        ]);
    });

    it("starts both Mixed Tech bases at the Clan Invasion; only Clan-base designs get Post-Reaving (IO:AE p.11)", () => {
        expect(tags("mis")).toEqual([...fromClanInvasion, "ilClan"]);
        expect(tags("mclan")).toEqual([...fromClanInvasion, "clan-post-reaving", "ilClan"]);
    });

    it("gives every tech option at least one era", () => {
        for (const tech of btTechOptions) {
            expect(tags(tech.tag).length).toBeGreaterThan(0);
        }
    });

    it("gives every era a unique id and tag", () => {
        expect(new Set(btEraOptions.map((option) => option.id)).size).toBe(btEraOptions.length);
        expect(new Set(btEraOptions.map((option) => option.tag)).size).toBe(btEraOptions.length);
    });

    it("starts the Classic Age of War in 2300 (IO:AE p.17)", () => {
        expect(era("age-of-war").yearStart).toBe(2300);
    });

    it("resolves the Clan era tags of earlier builds", () => {
        expect(findEraByTag("the-exodus")?.tag).toBe("clan-founding-years");
        expect(findEraByTag("the-founding")?.tag).toBe("clan-founding-years");
        expect(findEraByTag("golden-century")?.tag).toBe("clan-golden-years");
        expect(findEraByTag("political-century")?.tag).toBe("clan-golden-years");
    });

    it("moves an unavailable era to the nearest one the tech base has", () => {
        expect(getClosestEraForTech(era("clan-golden-years"), "is").tag).toBe("early-sw");
        expect(getClosestEraForTech(era("clan-post-reaving"), "is").tag).toBe("early-rep");
        expect(getClosestEraForTech(era("late-sw-rn"), "clan").tag).toBe("clan-golden-years");
        expect(getClosestEraForTech(era("late-sw-lt"), "clan").tag).toBe("clan-golden-years");
        // Nothing Clan covers 2781-2799, so the next Clan era.
        expect(getClosestEraForTech(era("early-sw"), "clan").tag).toBe("clan-founding-years");
        expect(getClosestEraForTech(era("age-of-war"), "clan").tag).toBe("clan-founding-years");
        expect(getClosestEraForTech(era("star-league"), "clan").tag).toBe("clan-founding-years");
        expect(getClosestEraForTech(era("star-league"), "mclan").tag).toBe("clan-inv");
        expect(getClosestEraForTech(era("jihad"), "mis").tag).toBe("jihad");
    });
});

describe("the era decides the tech base (user ruling 2026-10-21)", () => {
    it("offers only the Inner Sphere in the Star League", () => {
        expect(getTechTagsForEra(era("star-league"))).toEqual(["is"]);
        expect(getTechTagsForEra(era("clan-founding-years"))).toEqual(["clan"]);
    });

    it("keeps a tech base the era allows", () => {
        expect(fitTechToEra("mclan", era("jihad"))).toBe("mclan");
        expect(fitTechToEra("clan", era("clan-golden-years"))).toBe("clan");
    });

    it("switches Mixed to its base, then Clan and Inner Sphere to each other", () => {
        expect(fitTechToEra("mclan", era("clan-golden-years"))).toBe("clan");
        expect(fitTechToEra("mis", era("star-league"))).toBe("is");
        expect(fitTechToEra("clan", era("star-league"))).toBe("is");
        expect(fitTechToEra("is", era("clan-founding-years"))).toBe("clan");
        expect(fitTechToEra("mis", era("clan-golden-years"))).toBe("clan");
        expect(fitTechToEra("mclan", era("late-sw-rn"))).toBe("is");
    });

    it("leaves the tech base alone when the era allows a limited set it is already in", () => {
        expect(fitTechToEra("mclan", era("clan-post-reaving"))).toBe("mclan");
        expect(fitTechToEra("mis", era("clan-post-reaving"))).toBe("mclan");
    });
});
