import { expect, test } from "@playwright/test";

// Every top-level area of the app must load from a cold start without a JavaScript error or the 404 page.
// This is the regression net for toolchain and dependency upgrades (bundler, React, router), not a feature test.
const ROUTES = [
    "",
    "about",
    "classic-battletech",
    "mech-creator",
    "classic-battletech/mech-creator/ssw-file-import",
    "alpha-strike",
    "alpha-strike-roster",
    "equipment-editor",
    "game-management",
    "settings",
    "other-tools",
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

// The bundled 'Mechs (#241) load when a list shows them: the index, then one design's chunk when it is opened.
test("the 'Mech Creator imports page lists the bundled 'Mechs and opens one", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    await page.goto("classic-battletech/mech-creator/imports");
    await page.getByPlaceholder("Filter").fill("Atlas AS7-D");
    await page.getByRole("button", { name: "View Atlas AS7-D", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Viewing AS7-D" })).toBeVisible();
    expect(errors).toEqual([]);
});

test("deep links resolve under the GitHub Pages base path", async ({ page }) => {
    await page.goto("about");
    await expect(page).toHaveURL(/\/battletech-tools\/about$/);
    await expect(page.locator("#root")).not.toBeEmpty();
});

// The top menu and logo must fit the window at every width that shows them (#626).
for (const width of [768, 900, 991, 992, 1024, 1059, 1280]) {
    test(`the header does not scroll sideways at ${width} px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto("about");
        await expect(page.locator("header.topmenu li.logo")).toBeVisible();

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBe(0);
    });
}

// GitHub Pages answers a direct link with public/404.html, which packs the query for the decoder in index.html (#627).
// `vite preview` serves the app instead, so the test answers the first request with the real 404.html, and adds the
// trailing slash that GitHub Pages adds to the redirect.
for (const [link, search, hash] of [
    ["about?v=123", "?v=123", ""],
    ["about?a=1&b=2", "?a=1&b=2", ""],
    ["about?v=123#top", "?v=123", "#top"],
    ["about?next=a%2Fb", "?next=a%2Fb", ""],
]) {
    test(`the direct link /${link} opens the page and keeps its query`, async ({ page }) => {
        await page.route(/\/battletech-tools\/about\?/, (route) => route.fulfill({ path: "public/404.html", contentType: "text/html" }));
        await page.route(/\/battletech-tools\?rd=/, (route) => route.fulfill({ status: 301, headers: { location: route.request().url().replace("/battletech-tools?", "/battletech-tools/?") } }));
        await page.goto(link);

        await expect(page.locator("#root")).not.toBeEmpty();
        await expect(page).toHaveURL(/\/battletech-tools\/about\?/);
        await expect(page).not.toHaveTitle(/404/);
        expect(await page.evaluate(() => [location.pathname, location.search, location.hash])).toEqual(["/battletech-tools/about", search, hash]);
    });
}
