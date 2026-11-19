import { expect, test, type Page } from "@playwright/test";

// ArtVee (Custom Homebrew) in the Vehicle Creator: offered at the Custom Homebrew level only, and it unlocks the ComboGuns.

function watchErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });
    return errors;
}

test("Vehicle Creator: the ArtVee toggle unlocks the ComboGuns at Custom Homebrew only", async ({ page }) => {
    const errors = watchErrors(page);
    const option = page.getByTestId("artvee-option");

    await page.goto("classic-battletech/vehicle-creator/step1");
    await page.getByLabel("Rules Level").selectOption("6");
    await page.getByLabel("Motive Type").selectOption("tracked");
    await page.getByLabel("Era:").selectOption({ label: "Star League (2571-2780)" });
    await expect(option).toBeVisible();
    await expect(page.getByTestId("artvee")).toHaveCount(0);

    // Without the toggle there is no ComboGun to pick.
    await page.goto("classic-battletech/vehicle-creator/equipment-selection");
    await page.getByPlaceholder("Filter Equipment").fill("ComboGun");
    await expect(page.getByText(/ArtVee Thumper ComboGun/)).toHaveCount(0);

    await page.goto("classic-battletech/vehicle-creator/step1");
    await option.click();
    await expect(page.getByTestId("artvee")).toContainText("no ComboGun yet");

    await page.goto("classic-battletech/vehicle-creator/equipment-selection");
    await page.getByPlaceholder("Filter Equipment").fill("ComboGun");
    await expect(page.getByText(/ArtVee Thumper ComboGun/).first()).toBeVisible();

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
    await page.getByLabel("Era:").selectOption({ label: "Star League (2571-2780)" });
    await page.getByTestId("artvee-option").click();

    await page.goto("classic-battletech/vehicle-creator/equipment-selection");
    await page.getByPlaceholder("Filter Equipment").fill("ArtVee Thumper ComboGun");
    await page.getByRole("row").filter({ has: page.getByRole("cell", { name: "ArtVee Thumper ComboGun", exact: true }) })
        .getByRole("button", { name: "Add" }).first().click();

    await page.goto("classic-battletech/vehicle-creator/record-sheet");
    const notes = page.getByTestId("artvee-note");
    await expect(notes.first()).toContainText("ArtVee (MAP): Vehicle Mode");
    await expect(notes.filter({ hasText: "Siege Mode Thumper artillery (6 heat, 15 damage, 21 mapsheets)" })).toHaveCount(1);
    await expect(page.getByText(/ArtVee \(MAP\)/).first()).toBeVisible();
    await expect(page.getByText("Siege Mode: Cruising 0, Flanking 0").first()).toBeVisible();

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

test("ArtVee readout: the sample list links to the Technical Readout, which lists all nine designs", async ({ page }) => {
    const errors = watchErrors(page);

    await page.goto("classic-battletech/vehicle-creator/step1");
    await page.getByLabel("Rules Level").selectOption("6");
    await page.getByLabel("Motive Type").selectOption("tracked");
    await page.getByLabel("Era:").selectOption({ label: "Star League (2571-2780)" });
    await page.getByRole("link", { name: "Read the ArtVee Technical Readout" }).click();

    const readout = page.getByTestId("tro-readout");
    await expect(readout.getByRole("heading", { name: "ArtVees and MAPs (3085)" })).toBeVisible();
    const pages = page.getByRole("combobox");
    await expect(pages.getByRole("option", { name: /ArtVee [A-Z]{3}-/ })).toHaveCount(9);
    for (const faction of ["Star League Defense Force", "The Clans", "The Inner Sphere"]) {
        await expect(pages.getByRole("option", { name: faction, exact: true })).toHaveCount(1);
    }
    await pages.selectOption({ label: "How Conversion Works and Other Things" });
    const plates = readout.getByRole("img", { name: /Falconet ArtVee in three stages/ });
    await expect(plates).toBeVisible();
    expect(await plates.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Next" }).first().click();
    await expect(readout.getByRole("heading", { name: "The Blind Infinity" })).toBeVisible();
    await pages.selectOption({ label: "Tormentum ArtVee TRM-1M" });
    await expect(page).toHaveURL(/#tormentum-artvee-trm-1m$/);
    await expect(readout.getByRole("heading", { name: "Tormentum ArtVee TRM-1M" })).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("tro-readout").getByRole("heading", { name: "Tormentum ArtVee TRM-1M" })).toBeVisible();

    await page.getByRole("link", { name: "Back to TRO - JBT" }).click();
    await expect(page.getByTestId("tro-introduction").getByRole("heading", { name: "Explanation" })).toBeVisible();
    await page.getByTestId("tro-category-ammunition").getByRole("link", { name: "Long Tom Artillery: Anti-Orbital Ammo" }).click();
    await expect(page.getByTestId("tro-readout").getByRole("heading", { name: "Long Tom Artillery: Anti-Orbital Ammo" })).toBeVisible();
    expect(errors).toEqual([]);
});
