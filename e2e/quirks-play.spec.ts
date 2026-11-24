import { expect, test } from "@playwright/test";

// Design quirks in play (quirks design, plan 3): a per-game switch on the roster, off by default.
test("the roster's design quirks switch is off by default and is saved with the force", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech/mech-creator");
    await page.getByTitle("Click here to clear out your current 'mech and start over.").click();
    await page.getByTitle("Click here to save a a new 'mech row").click();

    await page.goto("classic-battletech/roster");
    await page.getByTitle("Add 'Mechs, or search the Master Unit List for any unit type").first().click();
    await page.locator(".modal tr", { hasText: "Saved" }).getByRole("button", { name: /^Add / }).first().click();
    await page.goto("classic-battletech/roster");

    // InputCheckbox is a label with a square icon, green when on.
    const quirks = page.locator("label.checkbox-input", { hasText: "Use design quirks" });
    await expect(quirks.locator("svg.color-green")).toHaveCount(0);
    await quirks.click();
    await expect(quirks.locator("svg.color-green")).toHaveCount(1);
    await page.reload();
    await expect(page.locator("label.checkbox-input", { hasText: "Use design quirks" }).locator("svg.color-green")).toHaveCount(1);

    expect(errors).toEqual([]);
});

test("with the switch on, play shows the side's quirk Initiative and the unit's quirks; off, neither", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech/mech-creator");
    await page.getByTitle("Click here to clear out your current 'mech and start over.").click();
    // The quirk records are rules level 3 (Advanced).
    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Level").selectOption("3");
    await page.goto("classic-battletech/mech-creator/summary");
    await page.getByLabel("Quirk", { exact: true }).selectOption({ label: "+ Battle Computer" });
    await page.getByRole("button", { name: "Add quirk" }).click();
    await page.goto("classic-battletech/mech-creator");
    await page.getByTitle("Click here to save a a new 'mech row").click();

    await page.goto("classic-battletech/roster");
    await page.getByTitle("Add 'Mechs, or search the Master Unit List for any unit type").first().click();
    await page.locator(".modal tr", { hasText: "Saved" }).getByRole("button", { name: /^Add / }).first().click();

    await page.goto("classic-battletech/roster/play");
    await page.locator(".mech-selector li button").first().click();
    await expect(page.getByTestId("quirk-initiative")).toHaveCount(0);
    await expect(page.getByTestId("quirks-in-play")).toHaveCount(0);

    await page.goto("classic-battletech/roster");
    await page.locator("label.checkbox-input", { hasText: "Use design quirks" }).click();
    await page.goto("classic-battletech/roster/play");
    await page.locator(".mech-selector li button").first().click();
    await expect(page.getByTestId("quirk-initiative")).toHaveText("Initiative: +2 (Battle Computer)");
    await expect(page.getByTestId("quirks-in-play")).toContainText("Battle Computer: +2 to its side's Initiative");

    expect(errors).toEqual([]);
});

test("with the switch on, the roster takes a game year and saves it with the force", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech/mech-creator");
    await page.getByTitle("Click here to clear out your current 'mech and start over.").click();
    await page.getByTitle("Click here to save a a new 'mech row").click();

    await page.goto("classic-battletech/roster");
    await page.getByTitle("Add 'Mechs, or search the Master Unit List for any unit type").first().click();
    await page.locator(".modal tr", { hasText: "Saved" }).getByRole("button", { name: /^Add / }).first().click();
    await page.goto("classic-battletech/roster");

    await expect(page.getByLabel("Game year")).toHaveCount(0);
    await page.locator("label.checkbox-input", { hasText: "Use design quirks" }).click();
    await page.getByLabel("Game year").fill("3025");
    await page.reload();
    await expect(page.getByLabel("Game year")).toHaveValue("3025");
    await page.getByLabel("Game year").fill("");
    await page.reload();
    await expect(page.getByLabel("Game year")).toHaveValue("");

    expect(errors).toEqual([]);
});
