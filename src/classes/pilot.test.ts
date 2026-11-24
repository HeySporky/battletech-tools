import { describe, expect, it } from "vitest";
import Pilot from "./pilot";

// Separate aerospace skills for LAM and PAM pilots (IO:AE p.100; #161).
describe("Pilot aerospace skills", () => {
    it("leaves them out until set, so an old save has only the BattleMech pair", () => {
        const pilot = new Pilot({ name: "Old", piloting: 5, gunnery: 4, wounds: 0, alphaStrikeAbilities: [] });
        expect(pilot.aeroPiloting).toBeUndefined();
        expect(pilot.aeroGunnery).toBeUndefined();
        expect(pilot.export()).not.toHaveProperty("aeroPiloting");
        expect(pilot.export()).not.toHaveProperty("aeroGunnery");
    });

    it("keeps them through export and import, whole numbers 0 to 8", () => {
        const pilot = new Pilot({ name: "Steve", piloting: 4, gunnery: 5, wounds: 0, alphaStrikeAbilities: [], aeroPiloting: 3, aeroGunnery: 2 });
        const again = new Pilot(pilot.export());
        expect([again.aeroPiloting, again.aeroGunnery]).toEqual([3, 2]);
        const clamped = new Pilot({ name: "", piloting: 5, gunnery: 4, wounds: 0, alphaStrikeAbilities: [], aeroPiloting: 12, aeroGunnery: -3 });
        expect([clamped.aeroPiloting, clamped.aeroGunnery]).toEqual([8, 0]);
        const junk = new Pilot({ name: "", piloting: 5, gunnery: 4, wounds: 0, alphaStrikeAbilities: [], aeroPiloting: "x" as unknown as number });
        expect(junk.aeroPiloting).toBeUndefined();
    });
});
