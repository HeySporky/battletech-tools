import { expect, test } from "@playwright/test";

// Issue #10: a header cell inside a table body ("Target number" in the Aces to-hit calculator) kept the table's
// white cell background under the site's light table text, so it could not be read.
test("the to-hit calculator's Target number row sits on the dark table background", async ({ page }) => {
    await page.goto("alpha-strike/aces/rules");
    const cell = page.locator("tbody th", { hasText: "Target number" }).first();
    await expect(cell).toBeVisible();
    const background = await cell.evaluate((element) => getComputedStyle(element).backgroundColor);
    const bodyCell = await page.locator("tbody td", { hasText: "Range" }).first().evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(background).not.toBe("rgb(255, 255, 255)");
    expect(background).toBe(bodyCell);
});
