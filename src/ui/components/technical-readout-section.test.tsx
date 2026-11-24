// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TechnicalReadout } from "../../classes/technical-readout";
import { ITroEquipmentCopy, ITroUnitAdapter } from "../../data/technical-readout-interfaces";
import TechnicalReadoutSection from "./technical-readout-section";

afterEach(cleanup);

const copies: ITroEquipmentCopy[] = [
    { uuid: "c", tag: "medium-laser", name: "Medium Laser", locationLabel: "LT" },
    { uuid: "d", tag: "medium-laser", name: "Medium Laser", locationLabel: "RT" },
    { uuid: "a", tag: "lrm-20", name: "LRM-20", locationLabel: "RT" },
];

const adapter = (): ITroUnitAdapter => ({
    getComponentRows: () => [{ key: "engine", label: "Engine (Fusion 280)" }],
    getEquipmentCopies: () => copies,
    getKnownEquipmentUuids: () => copies.map((copy) => copy.uuid),
    getKnownEquipmentTags: () => copies.map((copy) => copy.tag),
    ensureEquipmentUuid: (copy) => copy.uuid,
    getSpecValues: () => ({ title: "Test", subtitle: "", mass: "20 tons" }),
    getConstructionRows: () => [],
});

const section = (tro = new TechnicalReadout(), onChange = vi.fn()) => {
    render(<TechnicalReadoutSection tro={tro} adapter={adapter()} onChange={onChange} />);
    return { tro, onChange };
};

describe("TechnicalReadoutSection", () => {
    it("typing in Manufacturer sets the record and reports the change", () => {
        const { tro, onChange } = section();
        fireEvent.change(screen.getByLabelText("Manufacturer"), { target: { value: "Earthwerks" } });
        expect(tro.getProduction("manufacturer")).toBe("Earthwerks");
        expect(onChange).toHaveBeenCalled();
    });

    it("keeps a space typed between two words of a make", () => {
        const { tro } = section();
        const input = screen.getByLabelText("LRM-20 manufacturer") as HTMLInputElement;
        fireEvent.change(input, { target: { value: "Diverse " } });
        expect(input.value).toBe("Diverse ");
        expect(tro.export()).toEqual({ equipment: { "lrm-20": { manufacturer: "Diverse" } } });
    });

    it("lists one equipment row per type with its quantity", () => {
        section();
        expect(screen.getByLabelText("Medium Laser manufacturer")).toBeTruthy();
        expect(screen.getByLabelText("LRM-20 manufacturer")).toBeTruthy();
        const laserRow = screen.getByLabelText("Medium Laser manufacturer").closest("tr")!;
        expect(laserRow.cells[1].textContent).toBe("2");
        expect(screen.getByLabelText("LRM-20 manufacturer").closest("tr")!.cells[1].textContent).toBe("1");
    });

    it("Mixed opens a row per copy and a copy's make is its own", () => {
        const { tro } = section();
        fireEvent.click(screen.getByLabelText("Medium Laser mixed"));
        expect(screen.getByLabelText("Medium Laser (LT) manufacturer")).toBeTruthy();
        fireEvent.change(screen.getByLabelText("Medium Laser (RT) manufacturer"), { target: { value: "Martell" } });
        expect(tro.getCopyMake("medium-laser", "d")).toEqual({ manufacturer: "Martell" });
        expect(tro.getCopyMake("medium-laser", "c")).toEqual({});
    });

    it("shows a script tag as literal text and adds no element", () => {
        const tro = new TechnicalReadout();
        tro.setText("overview", "<script>alert(1)</script>");
        const { container } = render(<TechnicalReadoutSection tro={tro} adapter={adapter()} onChange={vi.fn()} />);
        expect((screen.getByLabelText("Overview") as HTMLTextAreaElement).value).toBe("<script>alert(1)</script>");
        expect(container.querySelector("script")).toBeNull();
    });

    it("has all seven text sections", () => {
        section();
        for (const label of ["Overview", "Capabilities", "Deployment", "Battle History", "Variants", "Notable Units", "Notes"]) {
            expect(screen.getByLabelText(label)).toBeTruthy();
        }
    });

    it("shows the edition's suggested make as a placeholder without entering it", () => {
        const tro = new TechnicalReadout();
        const suggesting = { ...adapter(), getComponentRows: () => [{ key: "engine", label: "Engine (Fusion 240)", suggested: "Pitban 240" }] };
        render(<TechnicalReadoutSection tro={tro} adapter={suggesting} onChange={vi.fn()} />);
        const input = screen.getByLabelText("Engine (Fusion 240)") as HTMLInputElement;
        expect(input.placeholder).toBe("Pitban 240");
        expect(input.value).toBe("");
        expect(tro.export()).toBeUndefined();
    });

    it("shows an imported component make that has no row of its own", () => {
        const tro = new TechnicalReadout();
        tro.setComponent("kfDrive", "X");
        section(tro);
        expect((screen.getByLabelText("K-F Drive") as HTMLInputElement).value).toBe("X");
    });

    it("labels an imported jump jet make the way TROs do, and keeps an unknown key as it came", () => {
        const tro = new TechnicalReadout();
        tro.setComponent("jumpJets", "Hellespont");
        tro.setComponent("lifeSupport", "Ceres");
        section(tro);
        expect((screen.getByLabelText("Jump Jets") as HTMLInputElement).value).toBe("Hellespont");
        expect((screen.getByLabelText("lifeSupport") as HTMLInputElement).value).toBe("Ceres");
    });

    it("prunes makes for equipment the design no longer has", () => {
        const tro = new TechnicalReadout();
        tro.setTypeMake("ppc", { manufacturer: "Gone" });
        const { onChange } = section(tro);
        expect(tro.getTypeMake("ppc")).toEqual({});
        expect(onChange).toHaveBeenCalled();
    });
});
