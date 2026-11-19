import { describe, expect, it } from "vitest";
import { ITroEquipmentCopy } from "../data/technical-readout-interfaces";
import { TechnicalReadout } from "./technical-readout";

const lrm = (uuid: string): ITroEquipmentCopy => ({ uuid, tag: "lrm-20", name: "LRM-20", locationLabel: "RT" });
const ml = (uuid: string, loc: string): ITroEquipmentCopy => ({ uuid, tag: "medium-laser", name: "Medium Laser", locationLabel: loc });

const sixCopies = [lrm("a"), lrm("b"), ml("c", "LT"), ml("d", "RT"), ml("e", "LT (R)"), ml("f", "RT (R)")];

describe("TechnicalReadout", () => {
    it("an empty readout saves as undefined", () => {
        expect(new TechnicalReadout().export()).toBeUndefined();
    });

    it("blank strings are not saved", () => {
        const t = new TechnicalReadout();
        t.setText("overview", "  ");
        t.setProduction("manufacturer", "");
        expect(t.export()).toBeUndefined();
    });

    it("round-trips every field", () => {
        const t = new TechnicalReadout();
        t.setProduction("manufacturer", "Earthwerks");
        t.setProduction("primaryFactory", "Calloway VI");
        t.setComponent("engine", "VOX 280");
        t.setText("overview", "Line one\n\nLine two");
        t.setTypeMake("lrm-20", { manufacturer: "Doombud", model: "Mk 2" });
        t.setMixed("medium-laser", true, sixCopies);
        t.setCopyMake("medium-laser", "c", { manufacturer: "Martell" });
        const saved = t.export();
        const u = new TechnicalReadout();
        u.import(JSON.parse(JSON.stringify(saved)));
        expect(u.export()).toEqual(saved);
        expect(u.getComponent("engine")).toBe("VOX 280");
        expect(u.isMixed("medium-laser")).toBe(true);
        expect(u.getCopyMake("medium-laser", "c")).toEqual({ manufacturer: "Martell" });
    });

    it("import ignores junk", () => {
        const t = new TechnicalReadout();
        t.import({ text: { overview: 5 }, equipment: "x" });
        expect(t.export()).toBeUndefined();
        t.import("junk");
        expect(t.export()).toBeUndefined();
    });

    it("prints the armament line with makes", () => {
        const t = new TechnicalReadout();
        t.setTypeMake("lrm-20", { manufacturer: "Doombud" });
        t.setMixed("medium-laser", true, sixCopies);
        t.setCopyMake("medium-laser", "c", { manufacturer: "Diverse Optics", model: "Type 2" });
        t.setCopyMake("medium-laser", "d", { manufacturer: "Diverse Optics", model: "Type 2" });
        t.setCopyMake("medium-laser", "e", { manufacturer: "Martell" });
        t.setCopyMake("medium-laser", "f", { manufacturer: "Martell" });
        expect(t.getArmamentLine(sixCopies)).toBe("2 Doombud LRM-20, 2 Diverse Optics Type 2 Medium Laser, 2 Martell Medium Laser");
    });

    it("does not repeat a name the make contains", () => {
        const t = new TechnicalReadout();
        t.setTypeMake("lrm-15", { manufacturer: "Zeus LRM-15" });
        t.setTypeMake("lrm-20", { manufacturer: "Doombud Long Range Missile 20 Racks" });
        expect(t.getArmamentLine([{ uuid: "x", tag: "lrm-15", name: "LRM-15", locationLabel: "RT" }])).toBe("1 Zeus LRM-15");
        expect(t.getArmamentLine([lrm("y")])).toBe("1 Doombud Long Range Missile 20 Racks LRM-20");
    });

    it("a copy with no make prints its plain name", () => {
        expect(new TechnicalReadout().getArmamentLine([ml("c", "LT"), ml("d", "RT")])).toBe("2 Medium Laser");
    });

    it("turning Mixed off keeps the type's make and drops the copies", () => {
        const t = new TechnicalReadout();
        t.setTypeMake("medium-laser", { manufacturer: "Diverse Optics" });
        t.setMixed("medium-laser", true, sixCopies);
        t.setCopyMake("medium-laser", "c", { manufacturer: "Martell" });
        t.setMixed("medium-laser", false, sixCopies);
        expect(t.isMixed("medium-laser")).toBe(false);
        expect(t.getCopyMake("medium-laser", "c")).toEqual({ manufacturer: "Diverse Optics" });
        expect(t.export()).toEqual({ equipment: { "medium-laser": { manufacturer: "Diverse Optics" } } });
    });

    it("prune drops removed copies and unmixes a single copy", () => {
        const t = new TechnicalReadout();
        t.setMixed("medium-laser", true, sixCopies);
        t.setCopyMake("medium-laser", "c", { manufacturer: "Diverse Optics" });
        t.setCopyMake("medium-laser", "e", { manufacturer: "Martell" });
        t.prune([ml("e", "LT (R)")], ["e"]);
        expect(t.isMixed("medium-laser")).toBe(false);
        expect(t.getTypeMake("medium-laser")).toEqual({ manufacturer: "Martell" });
    });

    it("prune drops the entry of a type no longer in the design", () => {
        const t = new TechnicalReadout();
        t.setTypeMake("lrm-20", { manufacturer: "Doombud" });
        t.prune([ml("c", "LT")], ["c"]);
        expect(t.export()).toBeUndefined();
    });

    it("prune keeps makes for uuids another configuration holds", () => {
        const t = new TechnicalReadout();
        t.setMixed("medium-laser", true, sixCopies);
        t.setCopyMake("medium-laser", "c", { manufacturer: "Martell" });
        t.prune([], ["c"]);
        expect(t.getCopyMake("medium-laser", "c")).toEqual({ manufacturer: "Martell" });
    });

    it("a copy cleared on purpose stays blank through a save and load", () => {
        const copies = [ml("c", "LT"), ml("d", "RT")];
        const t = new TechnicalReadout();
        t.setTypeMake("medium-laser", { manufacturer: "Diverse Optics" });
        t.setMixed("medium-laser", true, copies);
        t.setCopyMake("medium-laser", "d", {});
        const u = new TechnicalReadout();
        u.import(JSON.parse(JSON.stringify(t.export())));
        expect(u.getArmamentLine(copies)).toBe("1 Diverse Optics Medium Laser, 1 Medium Laser");
    });

    it("prune keeps a type's make while another configuration holds the type", () => {
        const t = new TechnicalReadout();
        t.setTypeMake("lrm-20", { manufacturer: "Doombud" });
        t.prune([], ["podInPrime"], ["lrm-20"]);
        expect(t.getTypeMake("lrm-20")).toEqual({ manufacturer: "Doombud" });
        t.prune([], [], []);
        expect(t.export()).toBeUndefined();
    });

    it("applyImportedCopyMakes: all alike is a type make, differing is mixed", () => {
        const t = new TechnicalReadout();
        const copies = [ml("c", "LT"), ml("d", "RT"), lrm("a"), lrm("b")];
        t.applyImportedCopyMakes([
            { uuid: "c", make: "Diverse Optics" }, { uuid: "d", make: "Martell" }, { uuid: "a", make: "Doombud" }, { uuid: "b", make: "Doombud" },
        ], copies, (copy) => copy.uuid);
        expect(t.isMixed("lrm-20")).toBe(false);
        expect(t.getTypeMake("lrm-20")).toEqual({ manufacturer: "Doombud" });
        expect(t.isMixed("medium-laser")).toBe(true);
        expect(t.getCopyMake("medium-laser", "d")).toEqual({ manufacturer: "Martell" });
    });
});
