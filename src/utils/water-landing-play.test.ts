import { describe, expect, it } from "vitest";
import SmallCraft from "../classes/small-craft";
import {
    canUseBowRamp, canUseWellDeck, getAfloatBayNote, getAfloatEffects, getAfloatHeatSinks, getFloodingNote, getWaterLandingModifier, getWaterTakeoffNote, normalizeWaterPlay, OLDER_WATER_EDITIONS,
} from "./water-landing-play";
import { getLargeWellDeckVesselTons } from "../data/small-craft-construction";

const buildShip = (shape: "aerodyne" | "spheroid" = "aerodyne", hull = false): SmallCraft => {
    const ship = new SmallCraft();
    ship.setCraftType("dropShip");
    ship.setShape(shape);
    ship.setTonnage(4000);
    if (hull) ship.setFlotationHull(true);
    return ship;
};

describe("water landings and afloat play (#643)", () => {
    it("older books give +3 for water and the hull waives it", () => {
        expect(OLDER_WATER_EDITIONS).toEqual(["aerotech", "battletech-manual", "battlespace", "aerotech-2", "aerotech-2-revised"]);
        for (const edition of OLDER_WATER_EDITIONS) {
            expect(getWaterLandingModifier(edition, false, true).modifier).toBe(3);
            expect(getWaterLandingModifier(edition, false, false).modifier).toBe(3);
            expect(getWaterLandingModifier(edition, true, true).modifier).toBe(0);
            expect(getWaterLandingModifier(edition, true, true).crash).toBe(false);
        }
    });

    it("under SO an aerodyne horizontal water landing crashes; with the hull it is a runway", () => {
        const plain = getWaterLandingModifier("total-warfare", false, true);
        expect(plain.crash).toBe(true);
        expect(plain.label).toContain("x10");
        const hulled = getWaterLandingModifier("total-warfare", true, true);
        expect(hulled.crash).toBe(false);
        expect(hulled.label).toContain("runway");
        expect(getWaterLandingModifier("total-warfare", false, false).label).toContain("SO:AAR p.61");
        expect(getWaterLandingModifier("total-warfare", false, false).crash).toBe(false);
    });

    it("a canon DropShip afloat cannot move; a hulled one has Cruise 2 / Flank 3", () => {
        expect(getAfloatEffects(false)).toMatchObject({ cruise: 0, flank: 0, heatSinkMultiplier: 1.1, noGroundedModifier: true, criticalBonus: 1 });
        expect(getAfloatEffects(true)).toMatchObject({ cruise: 2, flank: 3 });
        const canon = buildShip("spheroid");
        expect(canon.canHaveFlotationHull()).toBe(false);
        expect(canon.setWaterState("afloat")).toBe("afloat");
        expect(canon.getAfloatEffects().cruise).toBe(0);
        expect(canon.getWaterLanding(false).modifier).toBe(0);
    });

    it("heat sinks x1.1 round down afloat", () => {
        expect(getAfloatHeatSinks(33)).toBe(36);
        expect(getAfloatHeatSinks(10)).toBe(11);
        expect(getAfloatHeatSinks(0)).toBe(0);
        const ship = buildShip("aerodyne", true);
        ship.setAdditionalHeatSinks(40);
        const dry = ship.getPlayHeatDissipation();
        ship.setWaterState("afloat");
        expect(ship.getPlayHeatDissipation()).toBeGreaterThan(dry);
        // construction, BV and the card never read the afloat bonus
        expect(ship.getHeatDissipation()).toBe(dry);
        ship.setWaterState("airborne");
        expect(ship.getPlayHeatDissipation()).toBe(dry);
    });

    it("the well deck works only afloat", () => {
        expect(canUseWellDeck(undefined)).toBe(false);
        expect(canUseWellDeck({ state: "grounded" })).toBe(false);
        expect(canUseWellDeck({ state: "afloat" })).toBe(true);
        const ship = buildShip("aerodyne", true);
        ship.addBay("well-deck", 1);
        expect(ship.canUseWellDeck()).toBe(false);
        ship.setWaterState("afloat");
        expect(ship.canUseWellDeck()).toBe(true);
    });

    it("a flooded aft names the well deck vehicles under the SO bay flooding rule", () => {
        expect(getFloodingNote(true)).toContain("well deck");
        expect(getFloodingNote(true)).toContain("stay aboard");
        expect(getFloodingNote(false)).not.toContain("well deck");
        const ship = buildShip("aerodyne", true);
        ship.setWaterState("afloat");
        ship.setFlooded(true);
        expect(ship.isFlooded()).toBe(true);
    });

    it("water state saves, loads, and an old save loads airborne", () => {
        const ship = buildShip("aerodyne", true);
        expect(ship.export().waterPlay).toBeUndefined();
        ship.setWaterState("afloat");
        ship.setFlooded(true);
        const saved = JSON.parse(ship.exportJSON());
        expect(saved.waterPlay).toEqual({ state: "afloat", flooded: true });
        const loaded = new SmallCraft(JSON.stringify(saved));
        expect(loaded.getWaterState()).toBe("afloat");
        expect(loaded.isFlooded()).toBe(true);
        delete saved.waterPlay;
        expect(new SmallCraft(JSON.stringify(saved)).getWaterState()).toBe("airborne");
        expect(normalizeWaterPlay({ state: "junk" })).toBeUndefined();
        ship.setWaterState("airborne");
        expect(ship.waterPlay).toBeUndefined();
    });

    it("a Small Craft in water is grounded, never afloat", () => {
        const small = new SmallCraft();
        expect(small.setWaterState("afloat")).toBe("grounded");
    });

    it("FLT converts at level 6 only: the hulled card has it, a canon one does not", () => {
        const plain = buildShip();
        expect(plain.getAlphaStrikeStats().specialAbilities).not.toContain("FLT");
        const hulled = buildShip("aerodyne", true);
        expect(hulled.getAlphaStrikeStats().specialAbilities).toContain("FLT");
        expect(hulled.getRequiredRulesLevel()).toBeGreaterThanOrEqual(6);
        expect(plain.getRequiredRulesLevel()).toBeLessThan(6);
    });
});

describe("review fixes (#643)", () => {
    it("the hull is dropped when the shape changes to spheroid or the craft becomes a Small Craft", () => {
        const ship = buildShip("aerodyne", true);
        ship.setShape("spheroid");
        expect(ship.hasFlotationHull()).toBe(false);
        const other = buildShip("aerodyne", true);
        other.setCraftType("smallCraft");
        expect(other.hasFlotationHull()).toBe(false);
    });

    it("the hull is an issue below rules level 6", () => {
        const ship = buildShip("aerodyne", true);
        expect(ship.getIssues(2).some((issue) => issue.includes("Flotation Hull is Custom Homebrew"))).toBe(true);
        expect(ship.getIssues(6).some((issue) => issue.includes("Flotation Hull is Custom Homebrew"))).toBe(false);
    });

    it("a water takeoff multiplies damage by 1.25", () => {
        expect(getWaterTakeoffNote(true, true)).toContain("x1.25");
        expect(getWaterTakeoffNote(false, true)).toContain("crash");
    });
});

describe("BattleTech forums merges (#643, 2026-11-23)", () => {
    it("nothing launches afloat in a turn the ship spends MP (TO:AUE p.25); the mark clears at the new turn and saves", () => {
        expect(canUseWellDeck({ state: "afloat", moved: true })).toBe(false);
        expect(canUseWellDeck({ state: "afloat", moved: false })).toBe(true);
        const ship = buildShip("aerodyne", true);
        ship.addBay("well-deck", 1);
        ship.setWaterState("afloat");
        ship.setMovedAfloat(true);
        expect(ship.isMovedAfloat()).toBe(true);
        expect(ship.canUseWellDeck()).toBe(false);
        expect(JSON.parse(ship.exportJSON()).waterPlay).toEqual({ state: "afloat", moved: true });
        expect(new SmallCraft(ship.exportJSON()).isMovedAfloat()).toBe(true);
        ship.turnReset();
        expect(ship.isMovedAfloat()).toBe(false);
        expect(ship.canUseWellDeck()).toBe(true);
        // Leaving the water clears it.
        ship.setMovedAfloat(true);
        ship.setWaterState("airborne");
        expect(ship.isMovedAfloat()).toBe(false);
    });

    it("StingerTheRaven's bow ramp: a hulled ship afloat launches hover vehicles from its vehicle bays; a canon ship has none", () => {
        expect(canUseBowRamp(true, { state: "afloat" })).toBe(true);
        expect(canUseBowRamp(true, { state: "afloat", moved: true })).toBe(false);
        expect(canUseBowRamp(true, { state: "grounded" })).toBe(false);
        expect(canUseBowRamp(false, { state: "afloat" })).toBe(false);
        const ship = buildShip("aerodyne", true);
        ship.addBay("vehicle-light", 2);
        ship.setWaterState("afloat");
        expect(ship.canUseBowRamp()).toBe(true);
        const noBays = buildShip("aerodyne", true);
        noBays.setWaterState("afloat");
        expect(noBays.canUseBowRamp()).toBe(false);
        const note = getAfloatBayNote(true);
        expect(note).toContain("bow ramp");
        expect(note).toContain("StingerTheRaven");
        expect(note).toContain("as ground units");
        expect(note).toContain("TO:AUE p.25");
        expect(getAfloatBayNote(false)).toBe("");
    });

    it("the Large Well Deck (Chaeronea and The_Caveman) holds one large naval vessel at 1.3 tons of bay a ton, needs the hull and a door", () => {
        expect(getLargeWellDeckVesselTons(11050)).toBe(8500);
        expect(getLargeWellDeckVesselTons(1000)).toBe(769);
        const ship = buildShip("aerodyne", false);
        ship.setTonnage(20000);
        ship.addBay("well-deck-large", 11050);
        const bay = ship.getBays()[0];
        expect(ship.getBayWeight(bay)).toBe(11050);
        expect(bay.doors).toBe(1);
        expect(ship.getIssues(6).join(" ")).toContain("Well Deck, Large Vessel needs the Flotation Hull");
        ship.setFlotationHull(true);
        expect(ship.getIssues(6).join(" ")).not.toContain("needs the Flotation Hull");
        ship.setBay(0, 11050, 0);
        expect(ship.getIssues(6).join(" ")).toContain("Well Deck, Large Vessel: a bay for units other than infantry needs a door");
        ship.setBay(0, 11050, 1);
        expect(ship.getRequiredRulesLevel()).toBeGreaterThanOrEqual(6);
        expect(ship.getCargoCapacity()).toBe(0);
        expect(ship.hasWellDeck()).toBe(true);
        expect(ship.getAlphaStrikeStats().specialAbilities).toContain("NVT1-D1");
    });
});
