// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AlphaStrikeForce from "../../../../classes/alpha-strike-force";
import { AlphaStrikeUnit } from "../../../../classes/alpha-strike-unit";
import { ASEWarBlock } from "./_asEWar";
import { getASEWarSpecials, getASEWarToHit, getASTaserEffect, applyASTaserHit } from "../../../../utils/alpha-strike-ewar-play";
import { canUseASMunition, getASMunition } from "../../../../data/alpha-strike-munitions";
import { getEquipmentCatalogDefinitions } from "../../../../data/equipment-registry";
import AerospaceFighter from "../../../../classes/aerospace-fighter";

afterEach(cleanup);

const ASCE = "alpha-strike-commanders-edition";
const plain = (abilities: string[], munition: string, rulesLevel = 2) => ({
    uuid: "r1", abilities, type: "BM", isInfantry: false, isAerospace: false, rulesLevel, munition, ewarPlay: {}, isWrecked: () => false,
});

describe("#647 review fixes", () => {
    it("C1: only the Armor-Piercing +1 is a flat modifier; the -2 rounds are conditional misses, so no flat modifier", () => {
        const hit = { hj: false, nc3Up: false };
        expect(getASEWarToHit(plain(["AC2/2/0"], "ac-armor-piercing"), hit, ASCE, false).short).toBe(1);
        const precision = getASEWarToHit(plain(["AC2/2/0"], "ac-precision"), hit, ASCE, false);
        expect(precision.short).toBe(0);
        expect(precision.labels.join(" ")).toContain("miss by 2 or less");
        expect(getASEWarToHit(plain(["LRM1/1/1"], "msl-heat-seeking"), hit, ASCE, false).long).toBe(0);
    });

    it("I1: a level 4 unit's canon Chaff Pod keeps its CHF play", () => {
        expect(getASEWarSpecials(["CHF1"], 4).map((entry) => entry.code)).toEqual(["CHF"]);
        expect(getASEWarSpecials(["SMKT"], 4)).toEqual([]);
    });

    it("I2: the taser type is the attacker's, the hit on a vehicle adds no heat, and ITAS damages infantry", () => {
        const vehicle = { ...plain([], "", 6), type: "CV", currentHeat: 0 };
        applyASTaserHit(vehicle, "interference", "ITAS");
        expect(vehicle.currentHeat).toBe(0);
        expect(getASTaserEffect("ITAS", "BM", ["ITAS1"], 8)).toBe("shutdown");
        const unit = new AlphaStrikeUnit();
        unit.name = "Atlas"; unit.armor = 10; unit.structure = 10; unit.rulesLevel = 6; unit.abilities = ["MTAS1"];
        unit.move = [{ move: 8, currentMove: 8, type: "" }];
        unit.calcCurrentValues();
        const force = new AlphaStrikeForce();
        force.addToGroup(unit);
        render(<ASEWarBlock unit={unit} force={force} onChange={vi.fn()} />);
        fireEvent.change(screen.getByLabelText("Taser type"), { target: { value: "ITAS" } });
        fireEvent.change(screen.getByLabelText("Special roll"), { target: { value: "8" } });
        fireEvent.click(screen.getByRole("button", { name: "Hit by a Taser (roll above)" }));
        expect(unit.ewarPlay.tsempHit?.effect).toBe("shutdown");
    });

    it("I3: a unit with only a munition shows its card line, and says what it needs", () => {
        const unit = new AlphaStrikeUnit();
        unit.name = "Thunderbolt"; unit.armor = 10; unit.structure = 10; unit.rulesLevel = 4; unit.abilities = ["SRM1/1"];
        unit.munition = "msl-semi-guided";
        unit.move = [{ move: 8, currentMove: 8, type: "" }];
        unit.calcCurrentValues();
        const force = new AlphaStrikeForce();
        force.addToGroup(unit);
        render(<ASEWarBlock unit={unit} force={force} onChange={vi.fn()} />);
        expect(screen.getByTestId("as-ewar-block").textContent).toContain("needs LRM");
    });

    it("I4: the VHE and Inferno Gauss rounds need no AC special", () => {
        expect(canUseASMunition(getASMunition("vhe", 6)!, [])).toBe(true);
        expect(canUseASMunition(getASMunition("gauss-inferno", 6)!, [])).toBe(true);
    });

    it("I5: canon standard rounds are not stamped as ours", () => {
        for (const catalog of getEquipmentCatalogDefinitions()) {
            for (const item of catalog.equipment) {
                if (item.isAmmo && (item.rulesLevel ?? 0) < 5 && item.alphaStrike?.noConversion) {
                    expect(item.alphaStrike.notes?.some((note) => note.startsWith("Ours")), item.tag).toBeFalsy();
                }
            }
        }
    });

    it("I7: a Coolant Pod adds to a fighter's Alpha Strike dissipation", () => {
        const build = (pod: boolean) => {
            const fighter = new AerospaceFighter();
            fighter.setTonnage(50);
            for (let i = 0; i < 3; i++) fighter.addEquipmentFromTag("large-laser");
            if (pod) fighter.addEquipmentFromTag("coolant-pod");
            return fighter.getAlphaStrikeStats().overheat;
        };
        expect(build(true)).toBeLessThanOrEqual(build(false));
    });

});
