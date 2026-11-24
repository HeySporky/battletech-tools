import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Fractional Accounting (TO:AUE pp.188-189) in the 'Mech, Vehicle, Fighter and Small Craft Creators: the option is only offered at the
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
    // 37 machine gun shots at 1 ton / 200 shots = 0.185 tons. Retried: typing can land while the page re-renders.
    await expect(async () => {
        await shots.locator("input").fill("37");
        await expect(shots).toContainText("0.185 tons", { timeout: 2000 });
    }).toPass();
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
test("'Mech Creator: a battle armor weapon is Experimental and turns Fractional Accounting on by default", async ({ page }) => {
    const errors = watchErrors(page);
    const option = page.getByTestId("fractional-accounting-option");
    const weaponRow = () => page.getByRole("row").filter({ has: page.getByRole("cell", { name: "BA-Medium Recoilless Rifle", exact: true }) });

    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Era:").selectOption(DARK_AGE);
    await page.getByLabel("Rules Level").selectOption(STANDARD);

    await page.goto("classic-battletech/mech-creator/step5");
    await page.getByTitle("Open the add dialog").first().click();
    await page.getByPlaceholder("Filter Equipment").fill("BA-Medium Recoilless");
    await expect(weaponRow()).toHaveCount(0);
    await page.getByRole("button", { name: "Close" }).first().click();

    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Level").selectOption(EXPERIMENTAL);
    await expect(option.getByTestId("fractional-accounting-default")).toHaveCount(0);

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
    // Retried: typing can land while the page re-renders.
    await expect(async () => {
        await shots.locator("input").fill("75");
        await expect(shots).toContainText("0.15 tons", { timeout: 2000 });
    }).toPass();

    // Mounting the weapon turned the option on "by default" (Ghosts of Obeedah p.54); it may be turned off, and the
    // battle armor ammunition is still bought by the kilogram.
    await page.goto("classic-battletech/mech-creator/step1");
    await expect(option.getByTestId("fractional-accounting-default")).toBeVisible();
    await expectAccessible(page, "fractional-accounting-option");
    await option.getByText("Fractional Accounting", { exact: true }).click();
    // Off: armor is bought by the half ton again.
    await page.goto("classic-battletech/mech-creator/step4");
    await expect(page.getByText("Armor Weight:").first()).toBeVisible();
    await expect(page.getByTestId("fractional-armor-points")).toHaveCount(0);
    await page.goto("classic-battletech/mech-creator/step5");
    await expect(shots.locator("input")).toHaveValue("75");
    await expect(shots).toContainText("0.15 tons");

    expect(errors).toEqual([]);
});

test("Vehicle Creator: a battle armor energy weapon runs off heat sinks or power cells", async ({ page }) => {
    const errors = watchErrors(page);
    const option = page.getByTestId("fractional-accounting-option");

    await page.goto("classic-battletech/vehicle-creator/step1");
    await page.getByLabel("Era:").selectOption(DARK_AGE);
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
    await expect(option.getByTestId("fractional-accounting-default")).toBeVisible();
    await expectAccessible(page, "fractional-accounting-option");

    expect(errors).toEqual([]);
});

test("Vehicle Creator: non-weapon battle armor equipment is offered at its own weight and turns Fractional Accounting on", async ({ page }) => {
    const errors = watchErrors(page);
    const option = page.getByTestId("fractional-accounting-option");

    await page.goto("classic-battletech/vehicle-creator/step1");
    await page.getByLabel("Era:").selectOption(DARK_AGE);
    await page.getByLabel("Rules Level").selectOption(EXPERIMENTAL);

    await page.goto("classic-battletech/vehicle-creator/equipment-selection");
    const row = (name: string) => page.getByRole("row").filter({ has: page.getByRole("cell", { name, exact: true }) });
    // Mobility gear is never offered (Ghosts of Obeedah p.54).
    await page.getByPlaceholder("Filter Equipment").fill("BA-Partial Wing");
    await expect(row("BA-Partial Wing")).toHaveCount(0);
    // A 250 kg active probe (TM p.346) is not rounded: it stays a quarter ton, and a 5 kg cutting torch 0.005 tons.
    await page.getByPlaceholder("Filter Equipment").fill("BA-Cutting Torch");
    await expect(row("BA-Cutting Torch").first()).toContainText("0.005");
    // The battle armor weapons with rules of their own are offered too; the Bomb Rack is Clan only.
    // Ammunition is listed for mounted weapons only, unless all ammunition is shown.
    await page.getByLabel(/Show all ammunition/).check();
    for (const name of ["BA-Taser", "BA-Pop-Up Mine", "BA-Tube Artillery", "BA-Tube Artillery Ammo"]) {
        await page.getByPlaceholder("Filter Equipment").fill(name);
        await expect(row(name).first()).toBeVisible();
    }
    await page.getByPlaceholder("Filter Equipment").fill("BA-Active Probe");
    await row("BA-Active Probe").getByRole("button", { name: "Add" }).first().click();

    await page.goto("classic-battletech/vehicle-creator/step1");
    await expect(option.getByTestId("fractional-accounting-default")).toBeVisible();

    expect(errors).toEqual([]);
});

test("Fighter Creator: Fractional Accounting weighs the engine by its multiplier and battle armor weapons turn it on by default", async ({ page }) => {
    const errors = watchErrors(page);
    const option = page.getByTestId("fractional-accounting-option");

    await page.goto("classic-battletech/fighter-creator");
    await page.getByRole("link", { name: /Start Building/ }).click();
    await page.getByLabel("Rules Level").selectOption(STANDARD);
    await expect(option).toHaveCount(0);

    await page.getByLabel("Rules Level").selectOption(EXPERIMENTAL);
    await page.getByLabel("Era:").selectOption(DARK_AGE);
    await page.getByLabel("Tonnage:").selectOption("50");
    await page.getByLabel("Safe Thrust").selectOption("9");
    await page.getByLabel("Engine Type").selectOption("light");
    await expect(page.getByText(/Engine Rating.*350 \(22.5 tons\)/)).toBeVisible();
    await expect(option).toBeVisible();
    await option.getByLabel("Fractional Accounting (Experimental)").check();
    // A 350 Light engine: 29.5 tons x 0.75 = 22.125 tons, the example on TO:AUE p.188.
    await expect(page.getByText(/Engine Rating.*350 \(22.125 tons\)/)).toBeVisible();

    await page.goto("classic-battletech/fighter-creator/equipment");
    for (const name of ["BA-ER Medium Laser", "Machine Gun", "MG - Standard Ammo"]) {
        await page.getByPlaceholder("Filter Equipment").fill(name);
        await page.getByRole("row").filter({ has: page.getByRole("cell", { name, exact: true }) })
            .getByRole("button", { name: "Add" }).first().click();
    }
    const shots = page.getByTestId("fractional-ammo-shots");
    await expect(shots.locator("input")).toHaveValue("200");
    await shots.locator("input").fill("37");
    // 37 machine gun shots at 1 ton / 200 shots = 0.185 tons.
    await expect(page.getByRole("row").filter({ has: shots })).toContainText("0.185");

    // The option is on "by default" with the battle armor weapon (Ghosts of Obeedah p.54), and may be turned off.
    await page.goto("classic-battletech/fighter-creator/chassis");
    await expect(option.getByTestId("fractional-accounting-default")).toBeVisible();
    await option.getByLabel("Fractional Accounting (Experimental)").click();
    await expect(option.getByLabel("Fractional Accounting (Experimental)")).not.toBeChecked();

    expect(errors).toEqual([]);
});

test("Small Craft Creator: Fractional Accounting buys armor by the point and battle armor weapons turn it on by default", async ({ page }) => {
    const errors = watchErrors(page);
    const option = page.getByTestId("fractional-accounting-option");

    await page.goto("classic-battletech/small-craft-creator");
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.getByRole("link", { name: /Start Building/ }).click();
    await page.getByLabel("Rules Level").selectOption(STANDARD);
    await expect(option).toHaveCount(0);

    // The Astrolux: 200 tons, Safe Thrust 5, 20 tons of fuel (TM pp. 184-188).
    await page.getByLabel("Rules Level").selectOption(EXPERIMENTAL);
    await page.getByLabel("Era:").selectOption(DARK_AGE);
    await page.getByTestId("sc-tonnage").selectOption("200");
    await page.getByTestId("sc-thrust").selectOption("5");
    await page.getByLabel("Fuel (tons)").fill("20");
    await expect(page.getByText(/Tanks and Pumps.*: 0.5 tons/)).toBeVisible();
    await option.getByLabel("Fractional Accounting (Experimental)").check();
    // 2 percent of 20 tons of fuel, to the kilogram rather than the half ton.
    await expect(page.getByText(/Tanks and Pumps.*: 0.4 tons/)).toBeVisible();

    await page.goto("classic-battletech/small-craft-creator/armor");
    const armor = page.getByTestId("fractional-armor-points");
    await armor.getByLabel(/Armor \(points/).selectOption("33");
    // 33 points x 0.0625 tons = 2.0625, rounded up to the kilogram.
    await expect(armor).toContainText("2.063 tons");

    await page.goto("classic-battletech/small-craft-creator/equipment");
    await page.getByPlaceholder("Filter Equipment").fill("BA-ER Medium Laser");
    await page.getByRole("row").filter({ has: page.getByRole("cell", { name: "BA-ER Medium Laser", exact: true }) })
        .getByRole("button", { name: "Add" }).first().click();

    await page.goto("classic-battletech/small-craft-creator/chassis");
    await expect(option.getByTestId("fractional-accounting-default")).toBeVisible();
    await option.getByLabel("Fractional Accounting (Experimental)").click();
    await expect(option.getByLabel("Fractional Accounting (Experimental)")).not.toBeChecked();

    expect(errors).toEqual([]);
});

test("ProtoMech Creator: Clan battle armor weapons are offered at the Experimental rules level", async ({ page }) => {
    const errors = watchErrors(page);

    await page.goto("classic-battletech/protomech-creator");
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.getByRole("link", { name: /Start Building/ }).click();
    await page.getByLabel("Era:").selectOption(DARK_AGE);
    await page.getByLabel("Rules Level").selectOption(STANDARD);
    await page.goto("classic-battletech/protomech-creator/equipment");
    await expect(page.getByTestId("pm-add-ba-clan-er-small-laser")).toHaveCount(0);

    await page.goto("classic-battletech/protomech-creator/chassis");
    await page.getByLabel("Rules Level").selectOption(EXPERIMENTAL);
    await page.goto("classic-battletech/protomech-creator/equipment");
    await page.getByTestId("pm-add-location").selectOption("torso");
    await page.getByTestId("pm-add-ba-clan-er-small-laser").click();
    // 350 kg on a battlesuit, rounded up to 500 kg (Ghosts of Obeedah p.54).
    await expect(page.getByRole("row").filter({ hasText: "BA-ER Small Laser" }).first()).toContainText("500");

    expect(errors).toEqual([]);
});
