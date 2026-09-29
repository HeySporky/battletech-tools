// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorBoundary from "./error-boundary";

afterEach(cleanup);

const Broken = (): never => {
    throw new Error("bad saved data");
};

describe("ErrorBoundary", () => {
    it("renders its children when nothing throws", () => {
        render(<ErrorBoundary><p>fine</p></ErrorBoundary>);
        expect(screen.getByText("fine")).toBeTruthy();
    });

    // A page that throws while rendering (e.g. on malformed saved data) must not blank the whole app.
    it("shows a recovery message instead of unmounting the app", () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
        render(<div><nav>menu</nav><ErrorBoundary><Broken /></ErrorBoundary></div>);
        expect(screen.getByText("menu")).toBeTruthy();
        expect(screen.getByRole("alert").textContent).toContain("Settings");
        expect(screen.getByRole("alert").textContent).toContain("bad saved data");
        consoleError.mockRestore();
    });
});
