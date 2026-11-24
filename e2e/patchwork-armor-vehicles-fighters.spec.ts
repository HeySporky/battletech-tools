import { expect, test, type Page } from "@playwright/test";

// Patchwork Armor on Combat Vehicles and fighters (TO:AUE pp.188-189): an armor type per location or arc,
// each weighed by the point and rounded up to the half ton.

function watchErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });
    return errors;
}

test("Vehicle Creator: a reactive-armored front under Patchwork Armor", async ({ page }) => {
    const errors = watchErrors(page);

    await page.goto("classic-battletech/vehicle-creator/step1");
    await page.getByLabel("Rules Level").selectOption("3");
    await page.getByLabel("Era:").selectOption("dark-ages");

    await page.goto("classic-battletech/vehicle-creator/armor");
    await page.getByRole("combobox", { name: /^Armor Type/ }).selectOption("patchwork");
    await expect(page.getByTestId("patchwork-armor-note")).toBeVisible();
    await page.getByLabel("Front Armor Type").selectOption("reactive");

    const front = page.locator("tr").filter({ has: page.getByTestId("patchwork-armor-front") });
    await front.locator("input").fill("40");
    await front.locator("input").blur();
    // 40 x 0.0625 = 2.5 tons; one item slot in the front.
    await expect(front.locator("td").last()).toHaveText("2.5 t, 1 slot");
    await expect(page.getByTestId("patchwork-armor-note")).toContainText("Armor Weight: 2.5 tons.");

    // Kept through a reload, and printed location by location.
    await page.reload();
    await expect(page.getByLabel("Front Armor Type")).toHaveValue("reactive");
    await page.goto("classic-battletech/vehicle-creator/record-sheet");
    await expect(page.getByText(/Armor: Patchwork Armor \(Front: Reactive Armor, /).first()).toBeVisible();

    expect(errors).toEqual([]);
});

test("Fighter Creator: a ferro-aluminum nose under Patchwork Armor gives up one nose slot", async ({ page }) => {
    const errors = watchErrors(page);

    await page.goto("classic-battletech/fighter-creator");
    await page.getByRole("link", { name: /Start Building/ }).click();
    await page.getByLabel("Rules Level").selectOption("3");
    await page.getByLabel("Era:").selectOption("dark-ages");
    await page.getByRole("link", { name: /Next: Armor/ }).click();

    await page.getByRole("combobox", { name: /^Armor Type/ }).selectOption("patchwork");
    await expect(page.getByTestId("patchwork-armor-note")).toBeVisible();
    await page.getByRole("combobox", { name: /^Nose Armor Type/ }).selectOption("ferro-aluminum");
    await page.getByRole("combobox", { name: "Nose:", exact: true }).selectOption("80");
    // 80 x 0.0558 = 4.464, rounded up to 4.5 tons.
    await expect(page.getByTestId("patchwork-armor-nose")).toContainText("4.5 tons, 1 weapon slot given up");

    expect(errors).toEqual([]);
});
