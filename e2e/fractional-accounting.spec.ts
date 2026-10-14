import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Fractional Accounting (TO:AUE pp.188-189) in the 'Mech and Vehicle Creators: the option is only offered at the
// Experimental rules level, armor is bought by the point and ammunition by the shot, and the design keeps the option
// across a reload. The controls this option adds are also checked with axe for accessibility violations.

const EXPERIMENTAL = "4";
const STANDARD = "2";
const DARK_AGE = "dark-ages";

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

// Vehicle-Mounted Battle Armor Equipment (Ghosts of Obeedah pp.53-54): battle armor weapons are offered at the
// Experimental rules level, weigh a multiple of a quarter ton, and keep Fractional Accounting on while mounted.
test("'Mech Creator: a battle armor weapon is Experimental and keeps Fractional Accounting on", async ({ page }) => {
    const errors = watchErrors(page);
    const option = page.getByTestId("fractional-accounting-option");
    const weaponRow = () => page.getByRole("row").filter({ has: page.getByRole("cell", { name: "BA-Medium Recoilless Rifle", exact: true }) });

    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Mech Era").selectOption(DARK_AGE);
    await page.getByLabel("Rules Level").selectOption(STANDARD);

    await page.goto("classic-battletech/mech-creator/step5");
    await page.getByTitle("Open the add dialog").first().click();
    await page.getByPlaceholder("Filter Equipment").fill("BA-Medium Recoilless");
    await expect(weaponRow()).toHaveCount(0);
    await page.getByRole("button", { name: "Close" }).first().click();

    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Level").selectOption(EXPERIMENTAL);
    await expect(option.getByTestId("fractional-accounting-required")).toHaveCount(0);

    await page.goto("classic-battletech/mech-creator/step5");
    await page.getByTitle("Open the add dialog").first().click();
    for (const name of ["BA-Medium Recoilless Rifle", "BA-Medium Recoilless Rifle Ammo"]) {
        await page.getByPlaceholder("Filter Equipment").fill(name);
        await page.getByRole("row").filter({ has: page.getByRole("cell", { name, exact: true }) })
            .getByRole("button", { name: "Add" }).first().click();
    }
    await page.getByRole("button", { name: "Close" }).first().click();
    // A quarter-ton bin at 2 kg a shot (TM p.346) is 125 shots; 75 shots are 150 kg.
    const shots = page.getByTestId("fractional-ammo-shots");
    await expect(shots.locator("input")).toHaveValue("125");
    await shots.locator("input").fill("75");
    await expect(shots).toContainText("0.15 tons");

    // Mounting the weapon turned the option on, and it cannot be turned off while the weapon is there.
    await page.goto("classic-battletech/mech-creator/step1");
    await expect(option.getByTestId("fractional-accounting-required")).toBeVisible();
    await expectAccessible(page, "fractional-accounting-option");
    await option.getByText("Fractional Accounting", { exact: true }).click();
    await expect(option.getByTestId("fractional-accounting-required")).toBeVisible();

    expect(errors).toEqual([]);
});

test("Vehicle Creator: a battle armor energy weapon runs off heat sinks or power cells", async ({ page }) => {
    const errors = watchErrors(page);
    const option = page.getByTestId("fractional-accounting-option");

    await page.goto("classic-battletech/vehicle-creator/step1");
    await page.getByLabel("Vehicle Era").selectOption(DARK_AGE);
    await page.getByLabel("Rules Level").selectOption(EXPERIMENTAL);

    await page.goto("classic-battletech/vehicle-creator/equipment-selection");
    for (const name of ["BA-ER Medium Laser", "BA-ER Medium Laser Ammo"]) {
        await page.getByPlaceholder("Filter Equipment").fill(name);
        await page.getByRole("row").filter({ has: page.getByRole("cell", { name, exact: true }) })
            .getByRole("button", { name: "Add" }).first().click();
    }

    await page.goto("classic-battletech/vehicle-creator/equipment-placement");
    const shots = page.getByTestId("fractional-ammo-shots");
    // A quarter-ton of power cells at 0.25 kg a shot (TM p.346) is 1,000 shots.
    await expect(shots.locator("input")).toHaveValue("1000");
    await expectAccessible(page, "fractional-ammo-shots");

    await page.goto("classic-battletech/vehicle-creator/step1");
    await expect(option.getByTestId("fractional-accounting-required")).toBeVisible();
    await expectAccessible(page, "fractional-accounting-option");

    expect(errors).toEqual([]);
});
