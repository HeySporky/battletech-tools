import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";

describe("BattleMech engine availability by era", () => {
    it("shows the expected Inner Sphere engines for a Star League mech", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setTonnage(20);
        mech.setEra("star-league");

        const availableEngineTags = mech.getAvailableEngines()
            .filter(engine => engine.available)
            .map(engine => engine.tag);

        expect(availableEngineTags).toEqual(["standard", "xl", "ice", "cell", "fission"]);
    });

    it("includes engines introduced during the selected era", () => {
        const mech = new BattleMech();
        mech.setEra("star-league");

        const engineTags = mech.getAvailableEngines()
            .filter(engine => engine.available)
            .map(engine => engine.tag);

        expect(engineTags).toContain("xl");
    });

    it("excludes engines in the gap between extinction and reintroduction", () => {
        const mech = new BattleMech();
        mech.setEra("late-sw-lt");

        const engineTags = mech.getAvailableEngines()
            .filter(engine => engine.available)
            .map(engine => engine.tag);

        expect(engineTags).not.toContain("xl");
    });

    it("includes reintroduced engines when the selected era overlaps reintroduction", () => {
        const mech = new BattleMech();
        mech.setEra("jihad");

        const engineTags = mech.getAvailableEngines()
            .filter(engine => engine.available)
            .map(engine => engine.tag);

        expect(engineTags).toContain("xl");
    });

    it("keeps Clan engines available after Inner Sphere extinction", () => {
        const mech = new BattleMech();
        mech.setTech("clan");
        mech.setEra("jihad");

        const engineTags = mech.getAvailableEngines()
            .filter(engine => engine.available)
            .map(engine => engine.tag);

        expect(engineTags).toContain("clan_xl");
        expect((mech as any)._itemIsAvailable(2300, 2500, 3070, true)).toBe(true);
    });
});

describe("BattleMech TRO anatomy", () => {
    it("renders Tripod legs instead of Quad front and rear legs", () => {
        const mech = new BattleMech();
        mech.setType("tripod");

        const troHtml = mech.makeTROHTML();

        expect(troHtml).toContain("Center Leg");
        expect(troHtml).not.toContain("Front Leg");
        expect(troHtml).not.toContain("Rear Leg");
    });
});