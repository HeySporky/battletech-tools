// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ComponentTechBaseChoice from "./component-tech-base-choice";

afterEach(cleanup);

describe("ComponentTechBaseChoice", () => {
    it("shows nothing with a single version", () => {
        const { container } = render(<ComponentTechBaseChoice label="Armor Version" choices={["clan"]} value="clan" clanDesign onChange={vi.fn()} />);
        expect(container.innerHTML).toBe("");
    });

    it("names the Inner Sphere version Star League on a Clan design (#168) and reports the pick", () => {
        const onChange = vi.fn();
        render(<ComponentTechBaseChoice label="Armor Version" choices={["clan", "is"]} value="clan" clanDesign onChange={onChange} />);
        expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Clan", "Star League"]);
        fireEvent.change(screen.getByLabelText("Armor Version:"), { target: { value: "is" } });
        expect(onChange).toHaveBeenCalledWith("is");
    });

    it("names it Inner Sphere on a Mixed Tech design", () => {
        render(<ComponentTechBaseChoice label="Structure Version" choices={["is", "clan"]} value="is" clanDesign={false} onChange={vi.fn()} />);
        expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Inner Sphere", "Clan"]);
    });
});
