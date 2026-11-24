import { describe, expect, it } from "vitest";
import { sswTestFixtures } from "../data/ssw/sswTestFixtures";
import { BattleMech } from "./battlemech";
import { getBattleMechTroAdapter } from "./battlemech-tro";
import { getPrintedDroid } from "../data/battledroids-mechs";
import { buildPrintedDroid } from "./printed-droid";

const archer = (): BattleMech => {
    const mech = new BattleMech();
    mech.importSSWXML(sswTestFixtures["Archer ARC-2R"]);
    return mech;
};

describe("'Mech Technical Readout", () => {
    it("an old save loads with no TRO and saves without one", () => {
        const source = archer().export(true) as unknown as Record<string, unknown>;
        delete source.tro;
        const mech = new BattleMech();
        mech.importJSON(JSON.stringify(source));
        const saved = mech.export(true) as unknown as { tro?: unknown; equipment: { uuid?: string }[] };
        expect(saved.tro).toBeUndefined();
        expect(saved.equipment.map((item) => item.uuid)).toEqual((source.equipment as { uuid?: string }[]).map((item) => item.uuid));
    });

    it("the TRO round-trips through the save", () => {
        const mech = archer();
        mech.tro.setProduction("manufacturer", "Earthwerks Incorporated");
        mech.tro.setComponent("engine", "VOX 280");
        mech.tro.setText("overview", "Line one\n\nLine two");
        const copy = new BattleMech();
        copy.importJSON(mech.exportJSON(true));
        expect(copy.tro.getProduction("manufacturer")).toBe("Earthwerks Incorporated");
        expect(copy.tro.getComponent("engine")).toBe("VOX 280");
        expect(copy.tro.getText("overview")).toBe("Line one\n\nLine two");
    });

    it("reset clears the TRO", () => {
        const mech = archer();
        mech.tro.setText("overview", "x");
        mech.reset();
        expect(mech.tro.export()).toBeUndefined();
    });

    it("the adapter lists no ammo and labels rear mounts", () => {
        const copies = getBattleMechTroAdapter(archer()).getEquipmentCopies();
        expect(copies.filter((copy) => copy.name === "Medium Laser")).toHaveLength(4);
        expect(copies.filter((copy) => copy.name === "LRM 20")).toHaveLength(2);
        expect(copies.some((copy) => /ammo/i.test(copy.name))).toBe(false);
        expect(copies.filter((copy) => copy.locationLabel.endsWith(" (R)"))).toHaveLength(2);
        expect(copies.every((copy) => copy.uuid)).toBe(true);
    });

    it("speeds in kph", () => {
        const spec = getBattleMechTroAdapter(archer()).getSpecValues();
        expect(spec.cruisingSpeed).toBe("43 kph");
        expect(spec.maximumSpeed).toBe("65 kph");
        expect(spec.jumpCapacity).toBeUndefined();
        expect(spec.title).toBe("Archer");
    });

    it("construction rows agree with the readout", () => {
        const mech = archer();
        const rows = getBattleMechTroAdapter(mech).getConstructionRows();
        const engine = rows.find((row) => row.label === mech.getEngineName());
        expect(engine?.value).toBe("280");
        expect(engine?.mass).toBe("16");
        expect(mech.makeTROHTML()).toContain(">280<");
    });

    it("a Battledroids droid's power plant defaults to the Engine Table's maker", () => {
        const engine = (mech: BattleMech) => getBattleMechTroAdapter(mech).getComponentRows().find((row) => row.key === "engine");
        // BD p.23: the 270 is a GM, the 275 a CoreTek.
        expect(engine(buildPrintedDroid(getPrintedDroid("pxh-1k")!))?.suggested).toBe("GM 270");
        expect(engine(buildPrintedDroid(getPrintedDroid("grf-1n")!))?.suggested).toBe("CoreTek 275");
        // Total Warfare prints no makers.
        expect(engine(archer())?.suggested).toBeUndefined();
    });

    it("a design built under a later edition defaults to that edition's Engine Table maker", () => {
        const engine = (edition: string) => {
            const mech = new BattleMech();
            mech.setRulesEdition(edition);
            mech.setTonnage(65);
            mech.setWalkSpeed(2);
            expect(mech.getEngineRating()).toBe(130);
            return getBattleMechTroAdapter(mech).getComponentRows().find((row) => row.key === "engine")?.suggested;
        };
        // BT3 p.44: the 130 is a Magna (a Vlar in BD p.23); the Master Rules print no makers (MR p.111).
        expect(engine("battletech-3rd-edition")).toBe("Magna 130");
        expect(engine("battledroids")).toBe("Vlar 130");
        expect(engine("master-rules")).toBeUndefined();
    });

    it("component rows follow the design", () => {
        const keys = getBattleMechTroAdapter(archer()).getComponentRows().map((row) => row.key);
        expect(keys).toEqual(["chassis", "engine", "armor", "heatSinks", "gyro", "cockpit", "myomer"]);
    });

    it("an unmixed make on a pod survives opening Step 7 in a configuration without that weapon", () => {
        const omni = new BattleMech();
        omni.toggleOmni();
        omni.addEquipmentFromTag("medium-laser", "is", "", false, undefined, "", false, [], undefined, undefined);
        const adapter = getBattleMechTroAdapter(omni);
        omni.tro.setTypeMake("medium-laser", { manufacturer: "Martell" });
        expect(omni.addOmniConfiguration("B")).toBe(true);
        omni.tro.prune(adapter.getEquipmentCopies(), adapter.getKnownEquipmentUuids(), adapter.getKnownEquipmentTags());
        expect(omni.switchOmniConfiguration("Prime")).toBe(true);
        expect(omni.tro.getTypeMake("medium-laser")).toEqual({ manufacturer: "Martell" });
    });

    it("an OmniMech pod in another configuration keeps its make", () => {
        const omni = new BattleMech();
        omni.toggleOmni();
        const pod = omni.addEquipmentFromTag("medium-laser", "is", "", false, undefined, "", false, [], undefined, undefined)!;
        const adapter = getBattleMechTroAdapter(omni);
        omni.tro.setMixed("medium-laser", true, adapter.getEquipmentCopies());
        omni.tro.setCopyMake("medium-laser", pod.uuid!, { manufacturer: "Martell" });
        expect(omni.addOmniConfiguration("B")).toBe(true);
        omni.tro.prune(adapter.getEquipmentCopies(), adapter.getKnownEquipmentUuids(), adapter.getKnownEquipmentTags());
        expect(omni.switchOmniConfiguration("Prime")).toBe(true);
        expect(omni.tro.getCopyMake("medium-laser", pod.uuid!)).toEqual({ manufacturer: "Martell" });
    });
});

describe("'Mech reset and SSW import", () => {
    it("an SSW import does not keep the previous design's quirks", () => {
        const mech = new BattleMech();
        mech.quirks.add({ tag: "quirk-command-mech" });
        mech.importSSWXML(sswTestFixtures["Archer ARC-2R"]);
        expect(mech.quirks.getAll()).toEqual([]);
    });
});
