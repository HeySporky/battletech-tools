// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import AppRouter from "./app-router";

// AppRouter is the root component, so it only unmounts on hot reload and in tests. It still has to take its
// window listeners and its bundled-'Mech import timer with it, or each remount leaves a copy running.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mount = async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
        root.render(<AppRouter />);
    });
    return root;
};

describe("AppRouter cleanup on unmount", () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("removes the online and offline listeners it added", async () => {
        const added = vi.spyOn(window, "addEventListener");
        const removed = vi.spyOn(window, "removeEventListener");
        const root = await mount();
        await act(async () => root.unmount());

        for (const type of ["online", "offline"]) {
            const listeners = added.mock.calls.filter((call) => call[0] === type).map((call) => call[1]);
            expect(listeners).toHaveLength(1);
            expect(removed.mock.calls.some((call) => call[0] === type && call[1] === listeners[0])).toBe(true);
        }
    });

    it("cancels the bundled 'Mech import that is still waiting to start", async () => {
        vi.useFakeTimers();
        const timeouts = vi.spyOn(globalThis, "setTimeout");
        const cleared = vi.spyOn(globalThis, "clearTimeout");
        const root = await mount();
        const importTimer = timeouts.mock.results[timeouts.mock.calls.findIndex((call) => call[1] === 500)]?.value;
        expect(importTimer).toBeDefined();

        await act(async () => root.unmount());

        expect(cleared.mock.calls.some((call) => call[0] === importTimer)).toBe(true);
    });
});
