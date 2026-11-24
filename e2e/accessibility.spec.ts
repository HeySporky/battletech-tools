import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// An axe scan of every page reachable from the site's menus, as each first opens. Issue #10 (light text on a white
// table cell) is the kind of fault this catches before a player has to report it. Chromium only: the rules do not
// change between engines, and the scan of ~90 pages is slow enough once.
const PAGES = [
    "",
    "classic-battletech",
    "alpha-strike",
    "game-management",
    "game-management/match-play",
    "other-tools",
    "about",
    "settings",
    "settings/backup-and-restore",
    "alpha-strike/roster",
    "alpha-strike/aces",
    "alpha-strike/aces/game",
    "alpha-strike/aces/campaign",
    "alpha-strike/aces/library",
    "alpha-strike/aces/rules",
    "alpha-strike/aces/print",
    "classic-battletech/roster",
    "classic-battletech/mech-creator",
    "classic-battletech/mech-creator/step1",
    "classic-battletech/mech-creator/step2",
    "classic-battletech/mech-creator/step3",
    "classic-battletech/mech-creator/step4",
    "classic-battletech/mech-creator/step5",
    "classic-battletech/mech-creator/step6",
    "classic-battletech/mech-creator/summary",
    "classic-battletech/mech-creator/exports",
    "classic-battletech/mech-creator/imports",
    "classic-battletech/mech-creator/ssw-file-import",
    "classic-battletech/mech-creator/print-rs",
    "classic-battletech/mech-creator/print-as",
    "classic-battletech/vehicle-creator",
    "classic-battletech/vehicle-creator/step1",
    "classic-battletech/vehicle-creator/armor",
    "classic-battletech/vehicle-creator/equipment-selection",
    "classic-battletech/vehicle-creator/equipment-placement",
    "classic-battletech/vehicle-creator/summary",
    "classic-battletech/vehicle-creator/record-sheet",
    "classic-battletech/vehicle-creator/print-as",
    "classic-battletech/fighter-creator",
    "classic-battletech/fighter-creator/chassis",
    "classic-battletech/fighter-creator/armor",
    "classic-battletech/fighter-creator/equipment",
    "classic-battletech/fighter-creator/summary",
    "classic-battletech/fighter-creator/record-sheet",
    "classic-battletech/fighter-creator/print-as",
    "classic-battletech/infantry-creator",
    "classic-battletech/infantry-creator/platoon",
    "classic-battletech/infantry-creator/weapons",
    "classic-battletech/infantry-creator/summary",
    "classic-battletech/infantry-creator/record-sheet",
    "classic-battletech/infantry-creator/print-as",
    "classic-battletech/battle-armor-creator",
    "classic-battletech/battle-armor-creator/chassis",
    "classic-battletech/battle-armor-creator/equipment",
    "classic-battletech/battle-armor-creator/loadouts",
    "classic-battletech/battle-armor-creator/summary",
    "classic-battletech/battle-armor-creator/record-sheet",
    "classic-battletech/battle-armor-creator/print-as",
    "classic-battletech/protomech-creator",
    "classic-battletech/protomech-creator/chassis",
    "classic-battletech/protomech-creator/equipment",
    "classic-battletech/protomech-creator/summary",
    "classic-battletech/protomech-creator/record-sheet",
    "classic-battletech/protomech-creator/print-as",
    "classic-battletech/small-craft-creator",
    "classic-battletech/small-craft-creator/chassis",
    "classic-battletech/small-craft-creator/armor",
    "classic-battletech/small-craft-creator/equipment",
    "classic-battletech/small-craft-creator/crew",
    "classic-battletech/small-craft-creator/summary",
    "classic-battletech/small-craft-creator/record-sheet",
    "classic-battletech/small-craft-creator/print-as",
    "classic-battletech/capital-ship-creator",
    "classic-battletech/capital-ship-creator/chassis",
    "classic-battletech/capital-ship-creator/armor",
    "classic-battletech/capital-ship-creator/equipment",
    "classic-battletech/capital-ship-creator/crew",
    "classic-battletech/capital-ship-creator/summary",
    "classic-battletech/capital-ship-creator/record-sheet",
    "classic-battletech/capital-ship-creator/print-as",
    "classic-battletech/building-creator",
    "classic-battletech/building-creator/structure",
    "classic-battletech/building-creator/equipment",
    "classic-battletech/building-creator/summary",
    "classic-battletech/building-creator/record-sheet",
];

test.describe("axe", () => {
    test.skip(({ browserName, isMobile }) => browserName !== "chromium" || !!isMobile, "one engine is enough for the rules");

    for (const path of PAGES) {
        test(`/${path} has no accessibility violations`, async ({ page }) => {
            // A cold first paint under parallel load can take most of the default 30 s before axe even starts.
            test.setTimeout(90_000);
            await page.goto(path);
            // Not "networkidle": on a cold start the app loads every bundled SSW 'Mech in the background, which can
            // outlast the test timeout. The page is ready once its route has painted the site banner.
            await page.waitForLoadState("load");
            await expect(page.getByRole("banner")).toBeVisible({ timeout: 60_000 });
            const results = await new AxeBuilder({ page }).analyze();
            const found = results.violations.map((violation) => `${violation.id} (${violation.nodes.length}): ${violation.nodes[0]?.target.join(" ")}`);
            expect(found).toEqual([]);
        });
    }
});
