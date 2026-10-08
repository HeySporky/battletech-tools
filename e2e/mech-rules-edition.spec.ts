import { expect, test } from "@playwright/test";

// The Mech Creator builds a design under an earlier rules edition: only what that rulebook includes is offered.
test("a design built under Battledroids takes that rulebook's tonnages and parts", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech/mech-creator/step1");
    const edition = page.getByLabel("Rules Edition");
    await expect(edition).toHaveValue("total-warfare");
    await expect(page.getByLabel("Mech Tonnage").locator("option").first()).toHaveText("20 (Light)");

    await edition.selectOption("battledroids");
    await expect(page.getByText(/Built from the Battledroids rulebook/)).toBeVisible();
    // Battledroids' tables start at 10 tons (BD p.23) and know one chassis and one structure.
    await expect(page.getByLabel("Mech Tonnage").locator("option").first()).toHaveText("10 (Ultralight)");
    await expect(page.getByLabel("Mech Type").locator("option")).toHaveText(["Biped"]);
    await expect(page.getByLabel("Internal Structure Type").locator("option:not([disabled])")).toHaveText(["Standard"]);

    await page.goto("classic-battletech/mech-creator/step3");
    await expect(page.getByLabel("Heat Sink Technology").locator("option:not([disabled])")).toHaveText(["Single"]);

    // The edition stays with the design.
    await page.goto("classic-battletech/mech-creator/step1");
    await expect(page.getByLabel("Rules Edition")).toHaveValue("battledroids");
    await page.getByLabel("Rules Edition").selectOption("total-warfare");
    await expect(page.getByText(/Built from the/)).toHaveCount(0);

    expect(errors).toEqual([]);
});
