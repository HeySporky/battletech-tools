import { expect, test } from "@playwright/test";

// Every top-level area of the app must load from a cold start without a JavaScript error or the 404 page.
// This is the regression net for toolchain and dependency upgrades (bundler, React, router), not a feature test.
const ROUTES = [
    "",
    "about",
    "classic-battletech",
    "mech-creator",
    "alpha-strike",
    "alpha-strike-roster",
    "equipment-editor",
    "game-management",
    "settings",
    "dev-status",
];

// Known engine fault (tracked in TODO.md): 500 ms after startup, app-router imports every bundled SSW mech in the
// background, and the BV speed factor throws on the first mech with an odd Jump MP. Whether a smoke test sees it
// depends on timing, so the smoke tests report it as an annotation and the dedicated test below pins it down.
const KNOWN_SPEED_FACTOR_FAULT = /reading 'toFixed'[\s\S]*_calcBattleValue/;

for (const route of ROUTES) {
    test(`/${route} renders without crashing`, async ({ page }) => {
        // Uncaught exceptions fail the test. console.error output is attached to the report instead: the app logs
        // some known engine-validation noise on startup (see TODO.md) that does not break rendering.
        const crashes: string[] = [];
        page.on("pageerror", (error) => {
            const detail = error.stack ?? error.message;
            if (KNOWN_SPEED_FACTOR_FAULT.test(detail)) {
                test.info().annotations.push({ type: "known fault", description: error.message });
            } else {
                crashes.push(detail);
            }
        });
        page.on("console", (message) => {
            if (message.type() === "error") {
                test.info().annotations.push({ type: "console.error", description: message.text() });
            }
        });

        await page.goto(route);
        await expect(page.locator("#root")).not.toBeEmpty();
        await page.waitForLoadState("networkidle");

        await expect(page).not.toHaveTitle(/404/);
        expect(crashes).toEqual([]);
    });
}

// Flips to "unexpectedly passed" once the speed factor fault is fixed - then turn it into a normal `test`.
test.fail("background SSW import finishes without an uncaught error [known fault, see TODO.md]", async ({ page }) => {
    const pageError = page.waitForEvent("pageerror", { timeout: 15_000 }).catch(() => null);
    await page.goto("");
    expect((await pageError)?.stack).toBeUndefined();
});

test("deep links resolve under the GitHub Pages base path", async ({ page }) => {
    await page.goto("about");
    await expect(page).toHaveURL(/\/battletech-tools\/about$/);
    await expect(page.locator("#root")).not.toBeEmpty();
});
