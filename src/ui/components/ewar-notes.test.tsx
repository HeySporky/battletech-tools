// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { IEWarCarrier } from "../../utils/ewar-play";
import EWarNotes from "./ewar-notes";

afterEach(cleanup);

const carrier = (edition: string, kinds: ("ams" | "artemis-iv" | "ecm-guardian")[]): IEWarCarrier => ({
    getUUID: () => "u1",
    getRulesEdition: () => edition,
    getEWarGear: () => kinds.map((kind, index) => ({ kind, tag: kind === "ams" ? "is-ams" : kind, name: kind, uuid: "g" + index, destroyed: false })),
    ewarPlay: {},
});

describe("EWarNotes", () => {
    it("lists each missile item with its edition numbers", () => {
        render(<EWarNotes unit={carrier("total-warfare", ["artemis-iv", "ams"])} />);
        expect(screen.getByTestId("ewar-notes").textContent).toContain("Artemis IV: +2 on the Cluster Hits roll");
        expect(screen.getByTestId("ewar-notes").textContent).toContain("AMS: -4 on the attacker Cluster Hits roll");
    });
    it("shows nothing for a unit with no missile E-War gear, or under an edition without the rules", () => {
        render(<EWarNotes unit={carrier("total-warfare", ["ecm-guardian"])} targetCalculator={false} />);
        expect(screen.queryByTestId("ewar-notes")).toBeNull();
        cleanup();
        render(<EWarNotes unit={carrier("battletech-4th-edition", ["ams"])} />);
        expect(screen.queryByTestId("ewar-notes")).toBeNull();
    });
});

describe("EWarNotes switches (Phase 2)", () => {
    const stealthCarrier = (edition: string, ewarPlay: object = {}): IEWarCarrier => ({
        getUUID: () => "u1",
        getRulesEdition: () => edition,
        getEWarGear: () => [
            { kind: "ecm-guardian", tag: "ecm-suite", name: "ECM Suite", uuid: "e1", destroyed: false },
            { kind: "stealth-armor", tag: "stealth-basic", name: "Stealth Armor", destroyed: false },
        ],
        ewarPlay,
    });
    it("shows a stealth switch and an ECM mode select when the view passes onChange", () => {
        const unit = stealthCarrier("total-warfare");
        const onChange = vi.fn();
        render(<EWarNotes unit={unit} onChange={onChange} />);
        fireEvent.click(screen.getByTestId("ewar-stealth-stealth-armor"));
        expect(unit.ewarPlay.stealthOn).toEqual({ "stealth-armor": true });
        expect(onChange).toHaveBeenCalledTimes(1);
        fireEvent.change(screen.getByTestId("ewar-mode-e1"), { target: { value: "eccm" } });
        expect(unit.ewarPlay.ecmMode).toEqual({ e1: "eccm" });
        expect(onChange).toHaveBeenCalledTimes(2);
    });
    it("shows the ECM as off while stealth armor is on under BMM, and offers ECCM only as apocryphal (carried from Total Warfare)", () => {
        const unit = stealthCarrier("battlemech-manual", { stealthOn: { "stealth-armor": true } });
        render(<EWarNotes unit={unit} onChange={vi.fn()} />);
        expect((screen.getByTestId("ewar-mode-e1") as HTMLSelectElement).value).toBe("off");
        expect(Array.from((screen.getByTestId("ewar-mode-e1") as HTMLSelectElement).options).map((o) => o.value)).toEqual(["ecm", "eccm", "ghost", "off"]);
    });
    it("shows no switches without onChange", () => {
        render(<EWarNotes unit={stealthCarrier("total-warfare")} />);
        expect(screen.queryByTestId("ewar-stealth-stealth-armor")).toBeNull();
    });
});

describe("EWarNotes target stealth calculator (Phase 2)", () => {
    const plain = (edition: string): IEWarCarrier => ({ getUUID: () => "u1", getRulesEdition: () => edition, getEWarGear: () => [], ewarPlay: {} });
    it("totals a stealth target to-hit for a unit with no E-War gear of its own", () => {
        render(<EWarNotes unit={plain("total-warfare")} />);
        fireEvent.click(screen.getByTestId("ewar-target-null-sig"));
        expect(screen.getByTestId("ewar-target-total").textContent).toContain("To hit +1: Null-Signature (+1 medium)");
        fireEvent.click(screen.getByTestId("ewar-target-chameleon"));
        expect(screen.getByTestId("ewar-target-total").textContent).toContain("To hit +2");
        fireEvent.change(screen.getByTestId("ewar-target-band"), { target: { value: "long" } });
        expect(screen.getByTestId("ewar-target-total").textContent).toContain("To hit +4");
    });
    it("is hidden when the edition prints no stealth, or the view has its own target dialog", () => {
        render(<EWarNotes unit={plain("battletech-3rd-edition")} />);
        expect(screen.queryByTestId("ewar-target-stealth")).toBeNull();
        cleanup();
        render(<EWarNotes unit={plain("total-warfare")} targetCalculator={false} />);
        expect(screen.queryByTestId("ewar-target-stealth")).toBeNull();
    });
});

describe("EWarNotes sneak suits (Phase 2 minors)", () => {
    const plain = (): IEWarCarrier => ({ getUUID: () => "u1", getRulesEdition: () => "total-warfare", getEWarGear: () => [], ewarPlay: {} });
    it("an IR sneak suit adds to a non-infantry attacker and is ignored by an infantry one", () => {
        render(<EWarNotes unit={plain()} />);
        fireEvent.click(screen.getByTestId("ewar-target-sneak-ir"));
        expect(screen.getByTestId("ewar-target-total").textContent).toContain("To hit +1");
        cleanup();
        render(<EWarNotes unit={plain()} attackerInfantry />);
        fireEvent.click(screen.getByTestId("ewar-target-sneak-ir"));
        expect(screen.getByTestId("ewar-target-total").textContent).toContain("To hit +0");
    });
});
