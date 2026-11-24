// @vitest-environment happy-dom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BattleMech } from "../../classes/battlemech";
import { BattleMechForce } from "../../classes/battlemech-force";
import { sswTestFixtures } from "../../data/ssw/sswTestFixtures";
import { newMULSearchFilters } from "../../utils/mulSearchFilters";
import type { IAppGlobals } from "../app-router";
import BattleMechAddMechDialog from "./classic-battletech/roster/_addMechDialog";
import { getTroDocuments, troIndex } from "./classic-battletech/tro-jbt";
import Home from "./home";

afterEach(() => cleanup());

const appGlobals = {
    appSettings: { developerMenu: false, uiTheme: "" },
    makeDocumentTitle: vi.fn(),
    toggleMobile: vi.fn(),
    closeMobile: vi.fn(),
    siteAlerts: { activeAlerts: [] },
} as unknown as IAppGlobals;

describe("home page news", () => {
    const homeText = (): string => {
        const { container } = render(<MemoryRouter><Home appGlobals={appGlobals} /></MemoryRouter>);
        return container.textContent ?? "";
    };

    it("lists the news the app keeps", () => {
        const text = homeText();
        for (const phrase of [
            "SeaDropships from the BattleTech forums (issue #643",
            "The Pelican follows Vehrec",
            "Sonic projectors (issue #645",
            "Rotary and Ultra autocannon play (issue #643)",
            "Community content update",
            "removed from selection, pending verification from its creators",
        ]) expect(text, phrase).toContain(phrase);
    });
});

describe("TRO - JBT", () => {
    const index = (): Record<string, string[]> => Object.fromEntries(
        Object.entries(troIndex()).map(([category, entries]) => [category, entries.map((entry) => `${entry.slug}|${entry.title}`)]),
    );

    it("holds exactly these documents", () => {
        expect(getTroDocuments().map((document) => document.slug)).toEqual([
            "super-heavy-vehicles", "micro-mechs", "walkers", "beast-mounted-infantry", "specialized-infantry", "seadropships", "power-armor", "vtolam",
            "permanent-air-mech", "best-of-future-wars", "homebrew-equipment", "future-wars-dropships", "ammunition",
        ]);
    });

    it("lists exactly these pages", () => {
        expect(index()).toEqual({
            "unit-types": [
                "micro-mechs|Micro-Mechs", "walkers|Walkers", "beast-mounted-infantry|Beast-Mounted Infantry", "specialized-infantry|Specialized Infantry",
                "seadropships|SeaDropships", "power-armor|Power Armor", "vtolam|VTOLAM", "permanent-air-mech|Permanent Air 'Mech",
            ],
            "equipment": [
                "best-of-future-wars|EII Point Defense System", "best-of-future-wars|Gatling Laser", "best-of-future-wars|Long Range Flamer",
                "best-of-future-wars|The Penitrator", "best-of-future-wars|Rapid Fire Autocannon (Pom-Pom)", "best-of-future-wars|Swing Fire Missile System",
                "best-of-future-wars|Power Booster", "best-of-future-wars|Two printings",
                "homebrew-equipment|Superheavy PPC", "homebrew-equipment|Fusion Lance", "homebrew-equipment|Omni-Laser", "homebrew-equipment|Pile Bunker",
                "homebrew-equipment|PPC-X", "homebrew-equipment|Re-Engineered Fusion Engine", "homebrew-equipment|COIL-S, COIL-M and COIL-L",
                "homebrew-equipment|Smoker, Periscope and Buckler Smoke Dispenser", "homebrew-equipment|Reloading Rocket Launchers",
                "homebrew-equipment|Thunderbolt Torpedoes", "homebrew-equipment|Pleiades Mechworks Equipment", "homebrew-equipment|Electronic Warfare Customs",
                "homebrew-equipment|Sonic Projectors", "homebrew-equipment|DropShip Flotation Hull and Well Deck",
            ],
            "ammunition": [
                "best-of-future-wars|Gauss Rifle Shells: VHE and Inferno", "best-of-future-wars|Autocannon SABOT Rounds",
                "homebrew-equipment|Tandem Charge SRM House Rule", "ammunition|Thunderbolt: Heat-Seeking Ammo",
            ],
            "other": [
                "super-heavy-vehicles|What Sets One Apart", "super-heavy-vehicles|The Super-Heavy Combat Vehicle Table", "super-heavy-vehicles|How the App Counts It",
                "super-heavy-vehicles|Some Canon Designs", "super-heavy-vehicles|Printing Differences",
                "homebrew-equipment|How NGCFells derives Battle Value and cost", "homebrew-equipment|Other Items Priced the Same Way",
                "future-wars-dropships|The Four Methods", "future-wars-dropships|What NGCFells Filled In", "future-wars-dropships|Their Own Arithmetic",
                "future-wars-dropships|Canon and the Methods", "future-wars-dropships|Stock's Values from DropShips and JumpShips", "future-wars-dropships|The Authors' Designs",
            ],
        });
    });
});

describe("Classic roster add dialog (Master Unit List search)", () => {
    const makeGlobals = (term: string, withChampion: boolean): IAppGlobals => {
        const force = new BattleMechForce();
        force.newGroup();
        const saves: object[] = [];
        if (withChampion) {
            const champion = new BattleMech();
            champion.importSSWXML(sswTestFixtures["Champion C"]);
            saves.push(JSON.parse(champion.exportJSON()));
        }
        return {
            appSettings: { developerMenu: false, uiTheme: "", mechNameFilter: "", mechRulesFilter: -1, cbtMULSearch: newMULSearchFilters({ type: 18, term }) },
            currentCBTForce: force,
            battleMechSaves: saves,
            vehicleSaves: [], fighterSaves: [], smallCraftSaves: [], capitalShipSaves: [],
            infantrySaves: [], battleArmorSaves: [], protoMechSaves: [], buildingSaves: [],
            makeDocumentTitle: vi.fn(),
            saveAppSettings: vi.fn(),
            toggleMobile: vi.fn(),
            closeMobile: vi.fn(),
            siteAlerts: { activeAlerts: [] },
        } as unknown as IAppGlobals;
    };
    const renderDialog = (globals: IAppGlobals) => render(
        <MemoryRouter>
            <BattleMechAddMechDialog appGlobals={globals} currentForce={globals.currentCBTForce!.groups[0]} currentForceIndex={0} onChange={vi.fn()} />
        </MemoryRouter>
    );

    it("searches the Master Unit List by default, and still lists a saved design", async () => {
        const { container } = renderDialog(makeGlobals("Champion", true));
        expect(container.textContent).toContain("the Master Unit List copy kept in the app");
        expect(await screen.findByRole("button", { name: /^Add Champion/ }, { timeout: 20_000 })).toBeTruthy();
    }, 30_000);

    it("finds a unit that is only on the Master Unit List by default", async () => {
        const { container } = renderDialog(makeGlobals("Atlas", false));
        await waitFor(() => expect(container.textContent).toContain("MUL only"), { timeout: 20_000 });
    }, 30_000);
});
