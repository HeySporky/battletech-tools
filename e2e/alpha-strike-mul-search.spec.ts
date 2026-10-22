import { expect, test } from "@playwright/test";

// Issue #119 (reported on Discord): searching with Era "ilClan" and the Mercenary faction listed only an UrbanMech
// and an Ares, the units first introduced in the ilClan era. The MUL era filter means "available in the era".
test("Alpha Strike unit search lists units available in the era to the chosen faction", async ({ page }) => {
    // Thousands of results render in the dialog, which is slow on the WebKit and Firefox runners.
    test.setTimeout(180_000);
    await page.goto("alpha-strike/roster");
    await page.locator("button", { hasText: "Add Units" }).first().click();

    const heading = page.getByRole("heading", { name: /^Search Results/ });
    const resultCount = async () => Number((await heading.textContent())?.match(/\((\d+)\)/)?.[1] ?? -1);
    await expect(heading).toBeVisible();

    await page.getByLabel("Era:").selectOption({ label: "ilClan" });
    await expect.poll(resultCount, { timeout: 60_000 }).toBeGreaterThan(1000);
    const inEra = await resultCount();

    await page.getByPlaceholder(/Type 3 or more characters/).fill("Mercenary");
    await page.getByText("Add to Faction Filter?").locator("..").getByRole("button").first().click();
    await expect.poll(resultCount, { timeout: 60_000 }).toBeLessThan(inEra);
    expect(await resultCount()).toBeGreaterThan(1000);
});
