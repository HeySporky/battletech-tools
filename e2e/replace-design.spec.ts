import { expect, test } from "@playwright/test";

// Replacing a creator's design asks first whether to save it, so a change is never lost by a click.
test("Start Over offers to save the 'mech first, to discard it, or to cancel", async ({ page }) => {
    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Tonnage").selectOption("75");
    await page.goto("classic-battletech/mech-creator");
    const dialog = page.getByRole("dialog");

    await page.getByRole("button", { name: "Start Over" }).click();
    await expect(dialog).toContainText("Replace the current 'mech?");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await page.goto("classic-battletech/mech-creator/step1");
    await expect(page.getByLabel("Tonnage")).toHaveValue("75");

    await page.goto("classic-battletech/mech-creator");
    await page.getByRole("button", { name: "Start Over" }).click();
    await dialog.getByRole("button", { name: "Save it first" }).click();
    await expect(page.getByRole("button", { name: /^Click here to load/ })).toHaveCount(1);
    await page.goto("classic-battletech/mech-creator/step1");
    await expect(page.getByLabel("Tonnage")).toHaveValue("20");

    // A blank design has nothing to lose: no question.
    await page.goto("classic-battletech/mech-creator");
    await page.getByRole("button", { name: "Start Over" }).click();
    await expect(dialog).toHaveCount(0);
});

test("loading a saved fighter over a changed one offers to discard the change", async ({ page }) => {
    await page.goto("classic-battletech/fighter-creator/chassis");
    await page.getByLabel("Fighter Name").fill("Wingman");
    await page.goto("classic-battletech/fighter-creator");
    await page.getByRole("button", { name: "Save as New" }).click();
    await page.goto("classic-battletech/fighter-creator/chassis");
    await page.getByLabel("Fighter Name").fill("Changed");
    await page.goto("classic-battletech/fighter-creator");
    await page.getByRole("button", { name: "Load Wingman into the editor" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Discard it" }).click();
    await page.goto("classic-battletech/fighter-creator/chassis");
    await expect(page.getByLabel("Fighter Name")).toHaveValue("Wingman");
});
