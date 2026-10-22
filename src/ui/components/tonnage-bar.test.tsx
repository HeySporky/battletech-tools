// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import TonnageBar from "./tonnage-bar";

afterEach(cleanup);

describe("TonnageBar", () => {
    it("shows tons used of the total, what is left, and slots used of the total", () => {
        render(<TonnageBar used={42.5} total={50} slots={{ used: 3, total: 5 }} />);
        const bar = screen.getByTestId("tonnage-bar");
        expect(bar.textContent).toContain("42.5 / 50 tons");
        expect(bar.textContent).toContain("7.5 tons left");
        expect(bar.textContent).toContain("3 / 5");
        expect(bar.querySelector(".color-red")).toBeNull();
    });

    it("turns red and says how far over when the weight or the slots run over", () => {
        render(<TonnageBar used={51} total={50} slots={{ used: 6, total: 5 }} />);
        const bar = screen.getByTestId("tonnage-bar");
        expect(bar.textContent).toContain("1 tons over");
        expect(bar.querySelectorAll(".color-red").length).toBe(2);
    });

    it("measures battle armor in kilograms and leaves slots out when there are none", () => {
        render(<TonnageBar used={700} total={1000} unit="kg" />);
        const bar = screen.getByTestId("tonnage-bar");
        expect(bar.textContent).toContain("700 / 1000 kg");
        expect(bar.textContent).not.toContain("Slots");
    });
});
