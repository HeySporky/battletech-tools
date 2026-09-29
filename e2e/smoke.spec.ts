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

for (const route of ROUTES) {
    test(`/${route} renders without crashing`, async ({ page }) => {
        // Uncaught exceptions and console.error output both fail the test.
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
        page.on("console", (message) => {
            if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
        });

        await page.goto(route);
        await expect(page.locator("#root")).not.toBeEmpty();
        await page.waitForLoadState("networkidle");

        await expect(page).not.toHaveTitle(/404/);
        expect(errors).toEqual([]);
    });
}

// 500 ms after startup, app-router imports every bundled SSW mech in the background, after most smoke tests are done.
// Give it time to run: an exception there silently truncates the SSW mech list (it once did, on odd Jump MP).
test("background SSW import finishes without an uncaught error", async ({ page }) => {
    const pageError = page.waitForEvent("pageerror", { timeout: 15_000 }).catch(() => null);
    await page.goto("");
    expect((await pageError)?.stack).toBeUndefined();
});

test("deep links resolve under the GitHub Pages base path", async ({ page }) => {
    await page.goto("about");
    await expect(page).toHaveURL(/\/battletech-tools\/about$/);
    await expect(page.locator("#root")).not.toBeEmpty();
});
