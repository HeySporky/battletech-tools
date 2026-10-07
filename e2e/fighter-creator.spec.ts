import { expect, test } from "@playwright/test";

// The Fighter Creator builds an aerospace fighter step by step, saves it and reports whether it is legal
// (TechManual pp. 180-197).
test("an aerospace fighter can be built, armed, checked and saved", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech");
    await page.getByRole("link", { name: "Fighter Creator" }).first().click();
    await expect(page.getByText("Your Saved Fighters")).toBeVisible();
    await page.getByRole("link", { name: /Start Building/ }).click();

    // 75 tons at Safe Thrust 6 needs a 300-rated engine and has a Structural Integrity of 7.
    await page.getByLabel("Fighter Name").fill("Testbed");
    await page.getByLabel("Tonnage").selectOption("75");
    await page.getByLabel("Safe Thrust").selectOption("6");
    await expect(page.getByText(/Engine Rating.*300 \(19 tons\)/)).toBeVisible();
    await expect(page.getByText(/Structural Integrity.*: 7/)).toBeVisible();

    await page.getByRole("link", { name: /Next: Armor/ }).click();
    await page.getByRole("button", { name: "Max Armor" }).click();
    await expect(page.getByText(/Allocated.*600 points/)).toBeVisible();
    await expect(page.getByText(/Armor Weight.*37.5 tons/)).toBeVisible();

    await page.getByRole("link", { name: /Next: Weapons and Equipment/ }).click();
    await expect(page.getByText("Nothing installed yet.")).toBeVisible();

    await page.getByRole("link", { name: /Next: Summary/ }).click();
    await expect(page.getByText("This design is legal under the TechManual construction rules.")).toBeVisible();
    await expect(page.getByText("Summary: Testbed")).toBeVisible();

    await page.goto("classic-battletech/fighter-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();
    await expect(page.getByRole("cell", { name: "Testbed", exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("cell", { name: "Testbed", exact: true })).toBeVisible();

    expect(errors).toEqual([]);
});
