import { expect, test, type Page } from "@playwright/test";

// ArtVee (Custom Homebrew) in the Vehicle Creator: offered at the Custom Homebrew level only, and it unlocks the combo guns.

function watchErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });
    return errors;
}

test("Vehicle Creator: the ArtVee toggle unlocks the combo guns at Custom Homebrew only", async ({ page }) => {
    const errors = watchErrors(page);
    const option = page.getByTestId("artvee-option");

    await page.goto("classic-battletech/vehicle-creator/step1");
    await page.getByLabel("Rules Level").selectOption("6");
    await page.getByLabel("Motive Type").selectOption("tracked");
    await page.getByLabel("Vehicle Era").selectOption({ label: "Star League (2571-2780)" });
    await expect(option).toBeVisible();
    await expect(page.getByTestId("artvee")).toHaveCount(0);

    // Without the toggle there is no combo gun to pick.
    await page.goto("classic-battletech/vehicle-creator/equipment-selection");
    await page.getByPlaceholder("Filter Equipment").fill("Combo Gun");
    await expect(page.getByText(/ArtVee Thumper Combo Gun/)).toHaveCount(0);

    await page.goto("classic-battletech/vehicle-creator/step1");
    await option.click();
    await expect(page.getByTestId("artvee")).toContainText("no combo gun yet");

    await page.goto("classic-battletech/vehicle-creator/equipment-selection");
    await page.getByPlaceholder("Filter Equipment").fill("Combo Gun");
    await expect(page.getByText(/ArtVee Thumper Combo Gun/).first()).toBeVisible();

    // Level 4 hides the option (a design that is already an ArtVee keeps it, so it can be unticked).
    await page.goto("classic-battletech/vehicle-creator/step1");
    await option.click();
    await expect(page.getByTestId("artvee")).toHaveCount(0);
    await page.getByLabel("Rules Level").selectOption("4");
    await expect(page.getByTestId("artvee-option")).toHaveCount(0);

    expect(errors).toEqual([]);
});

test("Vehicle Creator: the record sheet shows both ArtVee modes", async ({ page }) => {
    const errors = watchErrors(page);

    await page.goto("classic-battletech/vehicle-creator/step1");
    await page.getByLabel("Rules Level").selectOption("6");
    await page.getByLabel("Motive Type").selectOption("tracked");
    await page.getByLabel("Vehicle Era").selectOption({ label: "Star League (2571-2780)" });
    await page.getByTestId("artvee-option").click();

    await page.goto("classic-battletech/vehicle-creator/equipment-selection");
    await page.getByPlaceholder("Filter Equipment").fill("ArtVee Thumper Combo Gun");
    await page.getByRole("row").filter({ has: page.getByRole("cell", { name: "ArtVee Thumper Combo Gun", exact: true }) })
        .getByRole("button", { name: "Add" }).first().click();

    await page.goto("classic-battletech/vehicle-creator/record-sheet");
    const notes = page.getByTestId("artvee-note");
    await expect(notes.first()).toContainText("ArtVee (MAP): Vehicle Mode");
    await expect(notes.filter({ hasText: "Siege Mode Thumper artillery (6 heat, 15 damage, 21 mapsheets)" })).toHaveCount(1);
    await expect(page.getByText(/ArtVee \(MAP\)/).first()).toBeVisible();
    await expect(page.getByText(/, Siege 0\/0/).first()).toBeVisible();

    expect(errors).toEqual([]);
});

test("Vehicle Creator: a sample ArtVee loads at Custom Homebrew and is hidden below it", async ({ page }) => {
    const errors = watchErrors(page);

    await page.goto("classic-battletech/vehicle-creator/step1");
    await page.getByLabel("Rules Level").selectOption("6");
    await page.getByTestId("artvee-samples").selectOption({ label: "Falconet ArtVee FLC-1 (55 tons)" });
    await expect(page.getByTestId("artvee")).toContainText("Thumper");
    await expect(page.getByLabel("Vehicle Model Name")).toHaveValue("Falconet ArtVee");

    await page.getByLabel("Rules Level").selectOption("4");
    await expect(page.getByTestId("artvee-samples")).toHaveCount(0);

    expect(errors).toEqual([]);
});
