import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";

// makeTROHTML() and the BV / C-Bill calc logs are rendered through SanitizedHTML raw={true},
// so names and locations that can come from an imported file must reach them HTML-escaped.
const PAYLOAD = "<img src=x onerror=alert(1)>";
const ESCAPED = "&lt;img src=x onerror=alert(1)&gt;";

function mechWithPoisonedStrings(): BattleMech {
    const mech = new BattleMech();
    mech.setTonnage(50);
    mech.setWalkSpeed(4);
    mech.setModel(PAYLOAD);
    const added = mech.addEquipmentFromTag("medium-laser", "is", PAYLOAD, false, null, "", false, [], undefined, undefined);
    expect(added).toBeTruthy();
    mech.setTonnage(50); // recalculates BV and cost, refilling the calc logs
    return mech;
}

describe("BattleMech raw-HTML output escaping", () => {
    it("escapes the model name in the TRO table", () => {
        const html = mechWithPoisonedStrings().makeTROHTML();
        expect(html).not.toContain("<img");
        expect(html).toContain(ESCAPED);
    });

    it("escapes equipment locations in the BV calc log", () => {
        const log = mechWithPoisonedStrings().getBVCalcHTML();
        expect(log).toContain("Medium Laser");
        expect(log).not.toContain("<img");
        expect(log).toContain(ESCAPED);
    });
});
