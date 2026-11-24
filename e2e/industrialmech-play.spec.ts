import { expect, test } from "@playwright/test";

// An IndustrialMech in play mode: +2 on the Determining Critical Hits Table (TW p.124) and the End Phase damage check
// after a fall or a physical attack (TW pp.68, 144).
test("an IndustrialMech rolls for critical hits at +2 and makes its End Phase damage check", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech/mech-creator");
    await page.getByTitle("Click here to clear out your current 'mech and start over.").click();
    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Mech Tonnage").selectOption("50");
    await page.getByLabel("Internal Structure Type").selectOption("industrial");
    await page.goto("classic-battletech/mech-creator/step2");
    await page.getByLabel("Walking Movement Points").selectOption("3");
    await page.getByLabel("Select Engine Type").selectOption("ice");
    await page.goto("classic-battletech/mech-creator");
    await page.getByTitle("Click here to save a a new 'mech row").click();

    await page.goto("classic-battletech/roster");
    await page.getByTitle("Add 'Mechs, or search the Master Unit List for any unit type").first().click();
    // The picker shows BattleMechs until its Type filter is changed.
    await page.getByLabel("Type:").selectOption({ label: "IndustrialMech" });
    await page.locator(".modal tr", { hasText: "Saved" }).getByRole("button", { name: /^Add / }).first().click();
    await page.goto("classic-battletech/roster/play");
    await page.locator(".mech-selector li button").first().click();
    await page.getByTitle("Weapon Attack Phase").click();
    // The record sheet's critical hits button is the last of its damage buttons.
    await page.locator("svg.cursor-pointer[viewBox='0 0 210 210']").last().click();

    const dialog = page.locator(".modal");
    await expect(dialog.getByRole("button", { name: "Roll for a Critical Hit (8+, +2 to the roll)" }).first()).toBeVisible();
    const head = dialog.locator("fieldset", { has: page.locator("legend", { hasText: /^Head$/ }) });
    await head.getByRole("button", { name: /Roll for a Critical Hit/ }).click();
    await expect(head).toContainText(/Critical hit roll \d+ \+ 2 = \d+\./);

    const check = dialog.getByTestId("industrial-damage-check");
    await check.getByLabel(/Levels fallen/).fill("3");
    await check.getByRole("button", { name: "Roll the Damage Check" }).click();
    await expect(check).toContainText(/Location roll \d+: /);
    // Two levels above 1 and the IndustrialMech's +2.
    await expect(check).toContainText(/Critical hit roll \d+ \+ 4 = \d+\./);

    expect(errors).toEqual([]);
});
