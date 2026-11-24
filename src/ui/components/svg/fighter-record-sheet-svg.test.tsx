import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AerospaceFighter from "../../../classes/aerospace-fighter";
import FighterRecordSheetSVG, { externalStoreCode } from "./fighter-record-sheet-svg";

// Rendered markup escapes apostrophes and ampersands.
const render = (fighter: AerospaceFighter, props: { showPilot?: boolean; showDamage?: boolean } = {}) =>
    renderToStaticMarkup(<FighterRecordSheetSVG fighter={fighter} {...props} />).replace(/&#x27;/g, "'").replace(/&amp;/g, "&");

const fighter = (type: "aerospace" | "conventional" = "aerospace"): AerospaceFighter => {
    const f = new AerospaceFighter();
    f.setFighterType(type);
    f.setTonnage(50);
    f.setSafeThrust(5);
    f.setName("Test Hawk");
    f.setArmorAllocation("nose", 20);
    f.setArmorAllocation("leftWing", 15);
    f.setArmorAllocation("rightWing", 15);
    f.setArmorAllocation("aft", 10);
    f.addEquipmentFromTag("medium-laser", "nose");
    f.addEquipmentFromTag("medium-laser", "nose");
    return f;
};

// The parity checklist: everything the Total Warfare aerospace and conventional fighter record sheets print.
describe("fighter record sheet (full page)", () => {
    it("prints every block of the official aerospace fighter sheet", () => {
        const markup = render(fighter());
        for (const text of [
            "AEROSPACE FIGHTER RECORD SHEET", "FIGHTER DATA", "Weapons & Equipment Inventory", "EXTERNAL STORES/BOMBS",
            "ARMOR DIAGRAM", "NOTES", "CRITICAL DAMAGE", "PILOT DATA", "VELOCITY RECORD", "HEAT DATA", "Overflow",
        ]) expect(markup).toContain(text);
        expect(markup).not.toContain("GROUND MAP STRAIGHT MOVEMENT");
    });

    it("prints the fighter data and its weapons with values by range bracket", () => {
        const markup = render(fighter());
        for (const text of ["Test Hawk", "Safe Thrust:", "Maximum Thrust:", "Tonnage:", "Tech Base:", "Cost:", "BV:", "SRV", "MRV", "LRV", "ERV", "(0-6)", "(7-12)", "(13-20)", "(21-25)", "Standard Scale"]) {
            expect(markup).toContain(text);
        }
        // Two medium lasers in the nose share a row: 2 of them, 10 heat... their names and the nose code.
        expect(markup).toMatch(/>2<\/text><text[^>]*>Medium Laser</);
    });

    it("prints the critical damage, pilot hits and velocity record boxes", () => {
        const markup = render(fighter());
        for (const text of ["Avionics", "Engine", "FCS", "Sensors", "Gear", "Life Support", "Hits Taken", "Consciousness #", "Modifier", "Dead", "Gunnery Skill:", "Piloting Skill:", "Effective Velocity", "Altitude"]) {
            expect(markup).toContain(text);
        }
        expect(markup).toContain(">20<");
    });

    it("prints the aerospace heat scale with its effects", () => {
        const markup = render(fighter());
        expect(markup).toContain("Random Movement, avoid on 5+");
        expect(markup).toContain("Heat Sinks:");
        expect(markup).toContain(">30*<");
        expect(markup).toContain(">29<");
    });

    it("prints the conventional fighter sheet: ground map movement and the return table in place of heat", () => {
        const markup = render(fighter("conventional"));
        for (const text of ["CONVENTIONAL FIGHTER RECORD SHEET", "GROUND MAP STRAIGHT MOVEMENT", "FIGHTER RETURN TABLE", "VSTOL", "STOL", "BAR:", "TURNS BEFORE RETURN", "13+"]) {
            expect(markup).toContain(text);
        }
        expect(markup).not.toContain("HEAT DATA");
        expect(markup).not.toContain("Overflow");
    });

    it("fills the external stores boxes with the bombs carried, one box a hardpoint", () => {
        const f = fighter();
        f.setExternalStore(f.getAvailableExternalStores(3).find((store) => store.name === "Bomb - High-Explosive (Standard)")!.tag, 3);
        const markup = render(f);
        expect((markup.match(/data-testid="store-box"/g) ?? []).length).toBe(20);
        expect((markup.match(/data-testid="store-box"[^>]*data-hardpoint="true"/g) ?? []).length).toBe(10);
        expect((markup.match(/>HE</g) ?? []).length).toBe(3);
        expect(markup).toContain("HE - High-Explosive");
    });

    it("marks damage taken in play", () => {
        const f = fighter();
        f.setCriticalHits("avionics", 2);
        f.setCriticalHits("pilotHits", 1);
        const markup = render(f, { showDamage: true });
        expect((markup.match(/data-hit="filled"/g) ?? []).length).toBe(3);
    });
});

describe("external store codes", () => {
    it("matches the official key and abbreviates the rest from their names", () => {
        expect(externalStoreCode("Bomb - High-Explosive (Standard)")).toBe("HE");
        expect(externalStoreCode("Bomb - Laser-Guided (C)")).toBe("LG");
        expect(externalStoreCode("Bomb - Cluster")).toBe("C");
        expect(externalStoreCode("Bomb - Rocket Launcher Pod")).toBe("RL");
        expect(externalStoreCode("Bomb - TAG Pod")).toBe("TAG");
        expect(externalStoreCode("Bomb - Light Air-to-Air (LAA) Missile")).toBe("LAA");
        expect(externalStoreCode("Bomb - Thunder (FASCAM)")).toBe("FASCAM");
        expect(externalStoreCode("Bomb - Fuel-Air (Large)")).toBe("FA-L");
        expect(externalStoreCode("Bomb - Arrow IV Homing Missile (Air-Launched)")).toBe("AIVH");
    });
});
