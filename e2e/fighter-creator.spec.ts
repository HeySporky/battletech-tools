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

// A conventional fighter: TechManual's 50-ton 'Mechbuster chassis, Safe Thrust 5 on a 250 turbine (TM pp. 184-193).
test("a conventional fighter can be built and saved", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech/fighter-creator");
    await page.getByRole("link", { name: /Start Building/ }).click();

    await page.getByLabel("Fighter Name").fill("Buster");
    await page.getByLabel("Fighter Type").selectOption("conventional");
    await expect(page.getByLabel("Tonnage:").locator("option")).toHaveCount(10);
    await page.getByLabel("Tonnage:").selectOption("50");
    await page.getByLabel("Safe Thrust").selectOption("5");
    await page.getByLabel("Engine Type").selectOption("ice");
    await expect(page.getByText(/Engine Rating.*250 \(25 tons\)/)).toBeVisible();
    await expect(page.getByText(/Cockpit and Controls.*: 5 tons/)).toBeVisible();
    await expect(page.getByText(/160 per ton/)).toBeVisible();
    await expect(page.getByLabel("Heat Sink Type").locator("option")).toHaveCount(1);
    await page.getByLabel(/VSTOL equipment/).check();
    await expect(page.getByText(/VSTOL equipment \(2.5 tons/)).toBeVisible();

    await page.getByRole("link", { name: /Next: Armor/ }).click();
    await page.getByRole("button", { name: "Max Armor" }).click();
    await expect(page.getByText(/Allocated.*50 points/)).toBeVisible();
    await expect(page.getByText(/Armor Weight.*3.5 tons/)).toBeVisible();

    await page.goto("classic-battletech/fighter-creator/summary");
    await expect(page.getByText("This design is legal under the TechManual construction rules.")).toBeVisible();
    await expect(page.getByText(/Conventional Fighter \(VSTOL\)/)).toBeVisible();

    await page.goto("classic-battletech/fighter-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();
    await expect(page.getByRole("cell", { name: "Conventional", exact: true })).toBeVisible();

    expect(errors).toEqual([]);
});
