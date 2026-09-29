import { describe, expect, it, vi } from "vitest";
import { sswMechs } from "../data/ssw/sswMechs";
import { getSSWXMLBasicInfo } from "../utils/getSSWXMLBasicInfo";
import { BattleMech } from "./battlemech";

// Known engine fault (tracked in TODO.md): the BV speed factor uses Run MP + Jump MP / 2 as a table index, so mechs
// with an odd Jump MP produce a fractional index and importSSWXML throws "reading 'toFixed'". Any other failure is new.
const KNOWN_SPEED_FACTOR_FAULT = /reading 'toFixed'/;

describe("BattleMech", () => {
    it("constructs a default mech that survives a JSON round trip", () => {
        const mech = new BattleMech();
        const exported = mech.exportJSON();

        expect(new BattleMech(exported).exportJSON()).toBe(exported);
    });

    it("imports bundled SSW mechs at their declared tonnage and round-trips them through JSON", () => {
        let imported = 0;
        for (const xml of sswMechs) {
            const info = getSSWXMLBasicInfo(xml)!;
            const label = `${info.name} ${info.model}`;

            const mech = new BattleMech();
            try {
                mech.importSSWXML(xml);
            } catch (error) {
                expect((error as Error).message, label).toMatch(KNOWN_SPEED_FACTOR_FAULT);
                continue;
            }
            imported++;
            expect(mech.getTonnage(), label).toBe(+info.tonnage);

            const reimported = new BattleMech(mech.exportJSON());
            expect(reimported.getTonnage(), label).toBe(mech.getTonnage());
            expect(reimported.getName(), label).toBe(mech.getName());
        }
        expect(imported).toBeGreaterThan(400);
    }, 120_000); // ~500 full imports; generous for slower phones running Termux

    // Flips to a failure once the speed factor fault is fixed - then turn it into a normal `it`.
    it.fails("imports a mech with odd Jump MP (Griffin GRF-1N) [known fault, see TODO.md]", () => {
        const griffin = sswMechs.find((xml) => /name="Griffin" model="GRF-1N"/.test(xml))!;
        new BattleMech().importSSWXML(griffin);
    });

    // Regression: setEngine(0) is how reset() and Walk MP 0 clear the engine; it used to log an error and keep the
    // previous engine.
    it("clears the engine when Walk MP is set back to 0", () => {
        const errors = vi.spyOn(console, "error").mockImplementation(() => {});
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.setWalkSpeed(4);
        expect(mech.getEngine()?.rating).toBe(200);

        mech.setWalkSpeed(0);
        expect(mech.getEngine()).toBeNull();
        expect(errors).not.toHaveBeenCalled();
        errors.mockRestore();
    });
});
