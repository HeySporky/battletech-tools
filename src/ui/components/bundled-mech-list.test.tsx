// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppSettings } from "../classes/app_settings";
import type { IAppGlobals } from "../app-router";
import BundledMechList from "./bundled-mech-list";

const mech = { getName: () => "Atlas AS7-D" };
vi.mock("../../data/bundled-mechs", () => ({
    loadBundledMechIndex: vi.fn(async () => [{ id: 0, name: "Atlas", model: "AS7-D", tech: "Inner Sphere", rulesLevel: 1, tons: 100, bv: 1897 }]),
    loadBundledMechDesign: vi.fn(async () => mech),
}));

afterEach(cleanup);

const appGlobals = () => ({ appSettings: new AppSettings({} as never), saveAppSettings: vi.fn() }) as unknown as IAppGlobals;

describe("BundledMechList", () => {
    // The Classic Roster's list gave a record sheet and Add but no TRO, unlike its MUL search (#374).
    it("offers the TRO when the page handles it", async () => {
        const onTRO = vi.fn();
        render(<BundledMechList appGlobals={appGlobals()} onView={vi.fn()} onAdd={vi.fn()} onTRO={onTRO} />);
        fireEvent.click(await screen.findByRole("button", { name: "TRO Atlas AS7-D" }));
        await waitFor(() => expect(onTRO).toHaveBeenCalledWith(mech));
    });

    it("leaves the TRO button out when the page does not", async () => {
        render(<BundledMechList appGlobals={appGlobals()} onView={vi.fn()} onAdd={vi.fn()} />);
        await screen.findByRole("button", { name: "View Atlas AS7-D" });
        expect(screen.queryByRole("button", { name: "TRO Atlas AS7-D" })).toBeNull();
    });
});
