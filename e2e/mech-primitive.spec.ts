import { expect, test } from "@playwright/test";

// The Mech Creator builds Primitive 'Mechs and IndustrialMechs with the limits their rules set
// (IO:AE pp.116-118; TM pp.68-72).
test("a Primitive BattleMech takes the Mackie's engine, cockpit and limits", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Mech Tonnage").selectOption("100");
    await page.getByText("Is a Primitive 'Mech").click();
    await expect(page.getByText(/Primitive BattleMech \(IO:AE pp\.116-118\)/)).toBeVisible();
    // Nothing modern on it yet, so it is not RetroTech (IO:AE p.116).
    await expect(page.getByText(/it becomes a RetroTech unit/)).toBeVisible();
    // A Primitive 'Mech cannot be an OmniMech, and takes standard or industrial structure only.
    await expect(page.getByLabel("Internal Structure Type").locator("option:not([disabled])")).toHaveText(["Standard", "Industrial"]);

    await page.goto("classic-battletech/mech-creator/step2");
    const walking = page.getByLabel("Walking Movement Points");
    // 100 tons x 4 MP x 1.2 = 480: past the 400-rated end of the Master Engine Table.
    await expect(walking.locator("option")).toHaveText(["-Select Walking Speed-", "1 MP", "2 MP", "3 MP"]);
    await walking.selectOption("3");
    await expect(page.getByLabel("Select Cockpit")).toHaveValue("primitive");
    // Fission engines need a higher rules level than the default.
    await expect(page.getByLabel("Select Engine Type").locator("option")).toHaveText(["Standard Fusion", "Internal Combustion Engine", "Fuel Cell Engine"]);
    // 100 - 10 structure - 33 engine (rating 360) - 4 gyro - 5 cockpit.
    await expect(page.locator(".mech-creator-status-bar")).toContainText("Remaining Tons: 48");

    await page.goto("classic-battletech/mech-creator/step3");
    await expect(page.getByText("Your BattleMech includes 10 heat sinks.")).toBeVisible();
    await expect(page.getByLabel("Heat Sink Technology").locator("option:not([disabled])")).toHaveText(["Single"]);

    expect(errors).toEqual([]);
});

test("an ICE-powered IndustrialMech comes with no heat sinks and cannot jump", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Mech Tonnage").selectOption("50");
    await page.getByLabel("Internal Structure Type").selectOption("industrial");

    await page.goto("classic-battletech/mech-creator/step2");
    await page.getByLabel("Walking Movement Points").selectOption("3");
    const engine = page.getByLabel("Select Engine Type");
    // No XL, Light or Compact engines (TM p.68); fission needs a higher rules level than the default.
    await expect(engine.locator("option")).toHaveText(["Standard Fusion", "Internal Combustion Engine", "Fuel Cell Engine"]);
    await engine.selectOption("ice");
    // The book's Buster: 50 - 10 structure - 11 engine - 2 gyro - 3 cockpit (TM pp.68-70).
    await expect(page.locator(".mech-creator-status-bar")).toContainText("Remaining Tons: 24");

    await page.goto("classic-battletech/mech-creator/step3");
    await expect(page.getByText("This engine type comes with no heat sinks.")).toBeVisible();

    expect(errors).toEqual([]);
});
