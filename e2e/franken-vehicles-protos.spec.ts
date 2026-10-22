import { expect, test, type Page } from "@playwright/test";

// FrankenVehicles and FrankenProtos: Custom Homebrew rules after CO pp.213-214's FrankenMechs.

function watchErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });
    return errors;
}

test("Vehicle Creator: a FrankenVehicle's turret from a lighter tank, fired from the chassis", async ({ page }) => {
    const errors = watchErrors(page);

    await page.goto("classic-battletech/vehicle-creator/step1");
    await page.getByLabel("Rules Level").selectOption("6");
    await page.getByLabel("Motive Type").selectOption("tracked");
    // A new vehicle has a turret.
    await page.getByText(/^FrankenVehicle \(Custom Homebrew/).click();
    await expect(page.getByTestId("franken-vehicle")).toBeVisible();

    await page.getByLabel("Turret donor tonnage").fill("15");
    await page.getByLabel("Turret donor vehicle").fill("Galleon");
    await page.getByLabel("Turret weapons fired by").selectOption("chassis");
    // 15 tons: 2 structure points.
    await expect(page.getByTestId("franken-vehicle-summary")).toContainText("Turret: 2 structure points");

    // Kept through a reload.
    await page.reload();
    await expect(page.getByLabel("Turret donor vehicle")).toHaveValue("Galleon");
    await expect(page.getByLabel("Turret weapons fired by")).toHaveValue("chassis");

    expect(errors).toEqual([]);
});

test("ProtoMech Creator: a FrankenProto with a heavier left arm", async ({ page }) => {
    const errors = watchErrors(page);

    await page.goto("classic-battletech");
    await page.getByRole("link", { name: "ProtoMech Creator" }).last().click();
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.getByRole("link", { name: /Start Building/ }).click();
    await page.getByLabel("Rules Level").selectOption("6");
    await page.getByTestId("pm-tons").selectOption("5");
    await page.getByTestId("pm-franken").check();
    await expect(page.getByTestId("pm-franken-donors")).toBeVisible();

    await page.getByLabel("Left Arm donor tons").selectOption("9");
    await page.getByLabel("Left Arm donor ProtoMech").fill("Minotaur");
    // Torso 275 + head 25 + arms 90 and 50 + legs 100 = 540 kg.
    await expect(page.getByText(/Internal structure 540 kg/)).toBeVisible();
    await expect(page.getByTestId("pm-franken-la").locator("td").nth(4)).toHaveText("90");

    expect(errors).toEqual([]);
});
