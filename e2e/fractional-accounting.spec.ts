import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Fractional Accounting (TO:AUE pp.188-189) in the 'Mech and Vehicle Creators: the option is only offered at the
// Experimental rules level, armor is bought by the point and ammunition by the shot, and the design keeps the option
// across a reload. The controls this option adds are also checked with axe for accessibility violations.

const EXPERIMENTAL = "4";
const STANDARD = "2";

function watchErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });
    return errors;
}

async function expectAccessible(page: Page, testId: string): Promise<void> {
    const results = await new AxeBuilder({ page }).include(`[data-testid="${testId}"]`).analyze();
    expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}

test("'Mech Creator: Fractional Accounting is an Experimental option that buys armor by the point", async ({ page }) => {
    const errors = watchErrors(page);
    const option = page.getByTestId("fractional-accounting-option");

    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Level").selectOption(STANDARD);
    await expect(option).toHaveCount(0);

    await page.getByLabel("Rules Level").selectOption(EXPERIMENTAL);
    await expect(option).toBeVisible();
    await expectAccessible(page, "fractional-accounting-option");
    await option.getByText("Fractional Accounting", { exact: true }).click();

    // A fresh page load: the option was saved with the design.
    await page.goto("classic-battletech/mech-creator/step4");
    const armor = page.getByTestId("fractional-armor-points");
    await expect(armor).toBeVisible();
    await armor.locator("input").fill("33");
    // 33 points x 0.0625 tons = 2.0625, rounded up to the kilogram.
    await expect(armor).toContainText("2.063 tons");
    await expect(armor).toContainText("0.0625 tons per point");
    await expectAccessible(page, "fractional-armor-points");

    await page.goto("classic-battletech/mech-creator/step5");
    await page.getByTitle("Open the add dialog").first().click();
    for (const name of ["Machine Gun", "MG - Standard Ammo"]) {
        await page.getByPlaceholder("Filter Equipment").fill(name);
        await page.getByRole("row").filter({ has: page.getByRole("cell", { name, exact: true }) })
            .getByRole("button", { name: "Add" }).first().click();
    }
    await page.getByRole("button", { name: "Close" }).first().click();
    const shots = page.getByTestId("fractional-ammo-shots");
    await expect(shots.locator("input")).toHaveValue("200");
    await shots.locator("input").fill("37");
    // 37 machine gun shots at 1 ton / 200 shots = 0.185 tons.
    await expect(shots).toContainText("0.185 tons");
    await expectAccessible(page, "fractional-ammo-shots");

    // Lowering the rules level keeps the saved option visible, so it can be turned off, and flags the design.
    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Level").selectOption(STANDARD);
    await expect(option).toBeVisible();
    await expect(page.getByText(/This design requires the Experimental/)).toBeVisible();
    await option.getByText("Fractional Accounting", { exact: true }).click();
    await expect(option).toHaveCount(0);

    expect(errors).toEqual([]);
});

test("Vehicle Creator: Fractional Accounting buys armor by the point and ammunition by the shot", async ({ page }) => {
    const errors = watchErrors(page);
    const option = page.getByTestId("fractional-accounting-option");

    await page.goto("classic-battletech/vehicle-creator/step1");
    await page.getByLabel("Rules Level").selectOption(STANDARD);
    await expect(option).toHaveCount(0);

    await page.getByLabel("Rules Level").selectOption(EXPERIMENTAL);
    await expect(option).toBeVisible();
    await expectAccessible(page, "fractional-accounting-option");
    await option.getByText("Fractional Accounting (Experimental)", { exact: true }).click();

    await page.goto("classic-battletech/vehicle-creator/armor");
    const armor = page.getByTestId("fractional-armor-points");
    await expect(armor).toBeVisible();
    await armor.locator("input").fill("33");

    await expect(armor).toContainText("2.063 tons");
    await expectAccessible(page, "fractional-armor-points");

    await page.goto("classic-battletech/vehicle-creator/equipment-selection");
    for (const name of ["Machine Gun", "MG - Standard Ammo"]) {
        await page.getByPlaceholder("Filter Equipment").fill(name);
        await page.getByRole("row").filter({ has: page.getByRole("cell", { name, exact: true }) })
            .getByRole("button", { name: "Add" }).first().click();
    }

    await page.goto("classic-battletech/vehicle-creator/equipment-placement");
    const shots = page.getByTestId("fractional-ammo-shots");
    await expect(shots).toBeVisible();
    await expect(shots.locator("input")).toHaveValue("200");
    await shots.locator("input").fill("37");
    // 37 machine gun shots at 1 ton / 200 shots = 0.185 tons.
    await expect(page.getByRole("row").filter({ has: shots })).toContainText("0.185");
    await expectAccessible(page, "fractional-ammo-shots");

    expect(errors).toEqual([]);
});
