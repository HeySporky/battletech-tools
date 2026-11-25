import { describe, expect, it, vi } from "vitest";
import { sswMechs } from "../data/ssw/sswMechs";
import { getSSWXMLBasicInfo } from "../utils/getSSWXMLBasicInfo";
import { BattleMech } from "./battlemech";

describe("BattleMech", () => {
    it("constructs a default mech that survives a JSON round trip", () => {
        const mech = new BattleMech();
        const exported = mech.exportJSON();

        expect(new BattleMech(exported).exportJSON()).toBe(exported);
    });

    it("imports every bundled SSW mech at its declared tonnage and round-trips it through JSON", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const failedAllocations: string[] = [];
        for (const xml of sswMechs) {
            const info = getSSWXMLBasicInfo(xml)!;
            const label = `${info.name} ${info.model}`;

            const mech = new BattleMech();
            warn.mockClear();
            mech.importSSWXML(xml);
            for (const [message] of warn.mock.calls) {
                if (String(message).startsWith("_allocateCritical failed")) failedAllocations.push(`${label}: ${message}`);
            }
            expect(mech.getTonnage(), label).toBe(+info.tonnage);

            const reimported = new BattleMech(mech.exportJSON());
            expect(reimported.getTonnage(), label).toBe(mech.getTonnage());
            expect(reimported.getName(), label).toBe(mech.getName());
        }
        // Regression: allocation used to match by UUID only, so ~8,300 SSW-import allocations failed (heat sinks etc.).
        expect(failedAllocations).toEqual([]);
        warn.mockRestore();
    }, 120_000); // ~500 full imports; generous for slower phones running Termux

    // Odd Jump MP is the edge case for the Speed Factor: half of it must be rounded, not used as a fraction.
    // TechManual p. 316: MP = Run + round(Jump / 2) = 8 + round(2.5) = 11 -> Speed Factor 1.76.
    it("rounds half the Jump MP for the Speed Factor (Griffin GRF-1N: Run 8 + Jump 5 -> x1.76)", () => {
        const griffin = sswMechs.find((xml) => /name="Griffin" model="GRF-1N"/.test(xml))!;
        const mech = new BattleMech();
        mech.importSSWXML(griffin);

        expect(mech.getRunSpeed()).toBe(8);
        expect(mech.getJumpSpeed()).toBe(5);
        expect(mech.getBVCalcHTML()).toContain("x 1.76 (speed factor rating)");
    });

    // Every component of a bundled design should land in a critical slot; nothing left unallocated after import.
    it("places every critical of an imported SSW mech (Griffin GRF-1N)", () => {
        const griffin = sswMechs.find((xml) => /name="Griffin" model="GRF-1N"/.test(xml))!;
        const mech = new BattleMech();
        mech.importSSWXML(griffin);

        expect(mech.getUnallocatedCriticals()).toEqual([]);
    });
});
