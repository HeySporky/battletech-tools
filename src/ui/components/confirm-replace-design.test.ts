import { describe, expect, it } from "vitest";
import { BattleMech } from "../../classes/battlemech";
import AerospaceFighter from "../../classes/aerospace-fighter";
import { confirmReplaceDesign, designWouldBeLost } from "./confirm-replace-design";

describe("Replacing the design in a creator", () => {
    it("loses nothing when the design is blank or already saved as it stands", () => {
        const blankMech = () => new BattleMech();
        expect(designWouldBeLost(new BattleMech(), blankMech, [])).toBe(false);
        const mech = new BattleMech();
        mech.setTonnage(55);
        expect(designWouldBeLost(mech, blankMech, [])).toBe(true);
        expect(designWouldBeLost(mech, blankMech, [JSON.parse(mech.exportJSON())])).toBe(false);
        expect(designWouldBeLost(new AerospaceFighter(), () => new AerospaceFighter(), [])).toBe(false);
        // A blank design moved to another rules edition is still blank.
        const droidless = new BattleMech();
        droidless.setRulesEdition("battledroids");
        expect(designWouldBeLost(droidless, blankMech, [])).toBe(false);
        expect(designWouldBeLost(null, blankMech, [])).toBe(false);
        // The game settings block's level and rulesets are settings, not design work (#324).
        const levelled = new BattleMech();
        levelled.applyGameSettings({ ...levelled.getGameSettings(2), rulesLevel: 0, rulesets: ["sample-no-clans"] });
        expect(designWouldBeLost(levelled, blankMech, [])).toBe(false);
        levelled.setTonnage(55);
        expect(designWouldBeLost(levelled, blankMech, [JSON.parse(levelled.exportJSON())])).toBe(false);
    });

    it("offers to save first, to discard, or to cancel", () => {
        const calls: string[] = [];
        let dialog: { yes: string; no: string; alt?: string; confirm: Function; other?: Function } | undefined;
        const appGlobals = {
            openConfirmDialog: (_t: string, _m: string, yes: string, no: string, confirm: Function, alt?: string, other?: Function) => {
                dialog = { yes, no, alt, confirm, other };
            },
        };
        const ask = () => confirmReplaceDesign(appGlobals, {
            what: "'mech", lost: true, save: () => calls.push("save"), replace: () => calls.push("replace"),
        });
        ask();
        expect([dialog?.yes, dialog?.alt, dialog?.no]).toEqual(["Save it first", "Discard it", "Cancel"]);
        dialog?.confirm();
        expect(calls).toEqual(["save", "replace"]);
        ask();
        dialog?.other?.();
        expect(calls).toEqual(["save", "replace", "replace"]);
        dialog = undefined;
        confirmReplaceDesign(appGlobals, { what: "'mech", lost: false, save: () => calls.push("save"), replace: () => calls.push("replace") });
        expect([dialog, calls.length]).toEqual([undefined, 4]);
    });
});
