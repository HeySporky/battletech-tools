// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMordelKey, markMordelKeyRejected, saveMordelKey } from "../../../utils/mordel/mordel-key";
import MordelKeySettings from "./_mordel-key-settings";

beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ status: "OK", message: "API key is valid" }), { status: 200 })));
});
afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

describe("Mordel.net key settings", () => {
    it("saves a key, shows only its last four characters, and tests it", async () => {
        render(<MordelKeySettings developerMenu={false} />);
        fireEvent.change(screen.getByLabelText("API key:"), { target: { value: "made-up-key-1234" } });
        fireEvent.click(screen.getByText("Save key"));
        expect(await screen.findByText("mordel.net accepted the key.")).toBeTruthy();
        expect(getMordelKey()).toBe("made-up-key-1234");
        expect(screen.getByText("••••1234")).toBeTruthy();
        expect(document.body.textContent).not.toContain("made-up-key-1234");
    });

    it("says when mordel.net refused the saved key, and removes it", () => {
        saveMordelKey("made-up-key-1234");
        markMordelKeyRejected();
        render(<MordelKeySettings developerMenu={false} />);
        expect(screen.getByText(/refused it/)).toBeTruthy();
        fireEvent.click(screen.getByText("Remove key"));
        expect(getMordelKey()).toBeNull();
        expect(screen.getByText("No key saved.")).toBeTruthy();
    });

    it("offers the sandbox only with the developer menu on", () => {
        const { rerender } = render(<MordelKeySettings developerMenu={false} />);
        expect(screen.queryByText("sandbox.mordel.net")).toBeNull();
        rerender(<MordelKeySettings developerMenu={true} />);
        expect(screen.getByText("sandbox.mordel.net")).toBeTruthy();
    });
});
