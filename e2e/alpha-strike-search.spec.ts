import { expect, test } from "@playwright/test";

// Issue #86: an empty search with every bundled MUL list selected matches ~8.7k units. Rendering them all locked
// the page, so results are paged and only one page of rows is ever in the DOM.
test("a search matching the whole bundled MUL shows one page of results", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));

    await page.goto("alpha-strike/roster");
    await page.getByRole("button", { name: "Add Units" }).first().click();
    await page.getByLabel("Search Terms").fill("");
    await page.locator("select[name=alphaStrikeMULSources]").selectOption("mul2+mul1");

    await expect(page.getByRole("heading", { name: /Search Results \(\d{4,}\)/ })).toBeVisible();
    const pager = page.getByRole("navigation", { name: "Search results pages" }).first();
    await expect(pager).toContainText(/Page 1 of \d+/);
    await expect(page.getByText(/^Showing 1–25 of \d{4,}$/)).toBeVisible();
    // Two rows per unit, one <tbody> each.
    await expect(page.locator(".table-wrapper table").first().locator("tbody")).toHaveCount(25);

    await pager.getByRole("button", { name: /Next/ }).click();
    await expect(pager).toContainText(/Page 2 of \d+/);
    await expect(page.getByText(/^Showing 26–50 of \d{4,}$/)).toBeVisible();

    expect(errors).toEqual([]);
});
