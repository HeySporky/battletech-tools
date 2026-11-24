import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BattleMech } from "../../../classes/battlemech";
import RecordSheetEquipmentTable from "./record-sheet-equipment-table";

// The live sheet in Play Mode shows the same to-hit as the attack list, quirks included (quirks plan 3, final review).
describe("the in-play record sheet's to-hit numbers", () => {
    const accurateLaser = (): BattleMech => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.setWalkSpeed(4);
        mech.addEquipmentFromTag("medium-laser", "is", "rt", false, undefined, "a", false, [], undefined, undefined);
        const laser = mech.equipmentList[0];
        laser.target = "a";
        const target = mech.getTarget("a");
        if (target) target.range = 1;
        expect(mech.quirks.add({ tag: "quirk-accurate-weapon", equipmentUuid: laser.uuid })).toBeNull();
        return mech;
    };
    const toHit = (quirksInPlay: boolean): number => {
        const markup = renderToStaticMarkup(
            <svg><RecordSheetEquipmentTable mechData={accurateLaser()} inPlay={true} quirksInPlay={quirksInPlay} xLoc={0} yLoc={0} width={1215} height={645} /></svg>,
        );
        const match = markup.match(/>(\d+)\+</);
        expect(match).not.toBeNull();
        return Number(match![1]);
    };

    it("takes 1 off an Accurate Weapon's to-hit with the game's switch on, and not with it off", () => {
        expect(toHit(true)).toBe(toHit(false) - 1);
    });
});

describe("a weapon with no medium or long bracket (issue 31)", () => {
    it("prints a dash, not 0", () => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.addEquipmentFromTag("nail-gun", "is", "rt", false, undefined, "", false, [], undefined, undefined);
        expect(mech.equipmentList.length).toBe(1);
        const markup = renderToStaticMarkup(
            <svg><RecordSheetEquipmentTable mechData={mech} inPlay={false} quirksInPlay={false} xLoc={0} yLoc={0} width={1215} height={645} /></svg>,
        );
        expect(markup).toContain("—");
    });
});

// Future Wars printing alternates, final review: the sheet's heat column follows "equipment as first printed".
describe("the EII PDS's heat on the sheet", () => {
    const heatCell = (rulesets: string[]): string => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.setWalkSpeed(4);
        mech.applyGameSettings({ ...mech.getGameSettings(6), rulesLevel: 6, rulesets });
        mech.addEquipmentFromTag("custom-eii-pds", "is", "rt", false, undefined, "", false, [], undefined, undefined, -1, "", true);
        expect(mech.equipmentList.length).toBe(1);
        const markup = renderToStaticMarkup(
            <svg><RecordSheetEquipmentTable mechData={mech} inPlay={false} quirksInPlay={false} xLoc={0} yLoc={0} width={1215} height={645} /></svg>,
        );
        const cells = Array.from(markup.matchAll(/<text[^>]*>([^<]*)<\/text>/g)).map((m) => m[1]);
        const name = cells.findIndex((text) => /Point Defense/.test(text));
        expect(name).toBeGreaterThanOrEqual(0);
        return cells[name + 2];
    };

    it("is 1 as the reprint has it, 0 with Future Wars: equipment as first printed", () => {
        expect(heatCell([])).toBe("1");
        expect(heatCell(["fw-equipment-first-printings"])).toBe("0");
    });
});

// The power-dial and sonic weapons (#645): the printed sheet shows the dial range, "Dial" damage and the band footnote.
describe("the power-dial weapons on the sheet", () => {
    const sheet = (tags: string[], inPlay: boolean): string => {
        const mech = new BattleMech();
        mech.setTonnage(50);
        mech.setWalkSpeed(4);
        mech.applyGameSettings({ ...mech.getGameSettings(6), rulesLevel: 6 });
        for (const tag of tags) mech.addEquipmentFromTag(tag, "is", "rt", false, undefined, "", false, [], undefined, undefined, -1, "", true);
        expect(mech.equipmentList.length).toBe(tags.length);
        return renderToStaticMarkup(
            <svg><RecordSheetEquipmentTable mechData={mech} inPlay={inPlay} quirksInPlay={false} xLoc={0} yLoc={0} width={1215} height={645} /></svg>,
        );
    };

    it("prints a Bombast's heat as its dial range, its damage as Dial, and the band footnote", () => {
        const markup = sheet(["bombast-laser"], false);
        expect(markup).toContain(">7-12<");
        expect(markup).toContain(">Dial<");
        expect(markup).toContain("Bombast dial: 7-12");
    });

    it("prints a sonic projector's damage as Stun with its footnote", () => {
        const markup = sheet(["custom-sonic-projector-military"], false);
        expect(markup).toContain(">Stun<");
        expect(markup).toContain("Hail / Deter, never lethal");
    });

    it("shows the live setting in play", () => {
        const markup = sheet(["bombast-laser"], true);
        expect(markup).toContain(">12<");
    });
});
