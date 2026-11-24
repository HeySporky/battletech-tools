// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StandardModal from "./standard-modal";

afterEach(cleanup);

describe("StandardModal", () => {
    // Viewing a record sheet in the roster offered Save and Close but no Print (#372).
    it("prints only its own contents when printable", () => {
        const marks: string[] = [];
        // happy-dom has no print().
        window.print = vi.fn(() => {
            marks.push(document.body.className, document.querySelector(".modal-printing")?.textContent ?? "");
        });
        render(<StandardModal show={true} onClose={vi.fn()} printable={true}><p>Atlas AS7-D</p></StandardModal>);
        fireEvent.click(screen.getAllByRole("button", { name: "Print" })[0]);
        expect(marks[0]).toContain("printing-modal");
        expect(marks[1]).toContain("Atlas AS7-D");
        window.dispatchEvent(new Event("afterprint"));
        expect(document.body.className).not.toContain("printing-modal");
        expect(document.querySelector(".modal-printing")).toBeNull();
    });

    it("has no Print button unless printable", () => {
        render(<StandardModal show={true} onClose={vi.fn()}><p>Atlas AS7-D</p></StandardModal>);
        expect(screen.queryByRole("button", { name: "Print" })).toBeNull();
    });
});
