// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMech } from "../../../../classes/battlemech";
import type { IAppGlobals } from "../../../app-router";
import InPlayCriticalHitTable, { getPlayCritSlotCount } from "./_criticalHitTable";
import { buildMech } from "../../../../test-support/builders";

/** Compact 'Mechs plan, Chunk D (#172): the play-mode critical hit table in tables of six. */
afterEach(cleanup);

const build = (tonnage: number): BattleMech => buildMech({ tonnage, homebrew: ["best-of-future-wars-construction"] });

const table = (mech: BattleMech, location: string, critData: any[], numberCritSlots: number) => render(
    <InPlayCriticalHitTable appGlobals={{} as IAppGlobals} mechData={mech} location={location} critData={critData} numberCritSlots={numberCritSlots} onChange={vi.fn()} />
);

describe("the play-mode critical hit table (#172)", () => {
    it("shows a 20-slot center torso as four tables with their die numbers", () => {
        const mech = build(100);
        table(mech, "ct", mech.getCriticals().centerTorso, 20);
        expect(screen.getAllByTestId("play-crit-table-dice").map(cell => cell.textContent)).toEqual(["1", "2", "3", "4"]);
        expect(screen.getAllByTestId("play-crit-line").map(cell => cell.textContent)).toEqual(
            ["1", "2", "3", "4", "5", "6", "1", "2", "3", "4", "5", "6", "1", "2", "3", "4", "5", "6", "1", "2"]);
    });

    it("keeps a standard arm's two tables, 1-3 and 4-6", () => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        table(mech, "la", mech.getCriticals().leftArm, 12);
        expect(screen.getAllByTestId("play-crit-table-dice").map(cell => cell.textContent)).toEqual(["1-3", "4-6"]);
        expect(screen.getAllByTestId("play-crit-line")).toHaveLength(12);
    });

    it("play mode reads Flint's slot counts, and today's counts without the ruleset", () => {
        const flint = build(100);
        expect(["la", "lt", "ll", "hd", "ct"].map(location => getPlayCritSlotCount(flint, location))).toEqual([12, 16, 16, 8, 20]);
        const standard = new BattleMech();
        expect(["la", "lt", "ll", "hd", "ct"].map(location => getPlayCritSlotCount(standard, location))).toEqual([12, 12, 6, 6, 12]);
        const quadVee = new BattleMech();
        quadVee.setMechType("quadvee");
        expect(["la", "ll"].map(location => getPlayCritSlotCount(quadVee, location))).toEqual([6, 6]);
    });
});
