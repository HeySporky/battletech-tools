import { expect, test } from "@playwright/test";

// Issue #87: units can be filtered by Alpha Strike special ability from the Add Units search form.
test("the special ability filter finds units by ability code", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));

    await page.goto("alpha-strike/roster");
    await page.getByRole("button", { name: "Add Units" }).first().click();
    await page.getByLabel("Search Terms").fill("Raven");

    await page.getByLabel("Filter By Special Abilities").fill("ecm");
    await expect(page.getByRole("button", { name: "Lacks ECM", exact: true })).toBeVisible();
    // Suggestions are codes that start with what was typed; LECM and AECM are separate codes.
    await expect(page.getByRole("button", { name: "Has LECM" })).toHaveCount(0);
    await page.getByRole("button", { name: "Has ECM", exact: true }).click();

    await expect(page.getByText("Current Ability Filter:")).toBeVisible();
    await expect(page.getByText("Has ECM")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Search Results \([1-9]\d*\)/ })).toBeVisible();
    const specials = page.locator(".table-wrapper td").filter({ hasText: "Special:" });
    await expect(specials.first()).toBeVisible();
    for (const text of await specials.allTextContents()) {
        expect(text).toMatch(/Special: (.*,)?\s*ECM\s*(,|$)/);
    }

    await page.getByRole("button", { name: "Remove Has ECM from the filter" }).click();
    await expect(page.getByText("Current Ability Filter:")).toHaveCount(0);

    expect(errors).toEqual([]);
});
