import { expect, Page, test } from "@playwright/test";

// The Support Vehicle types beyond the ground ones (TM pp.116-139; TO:AUE pp.16-71; TW pp.204-207): an Airship built
// in the fighter creator, a Large Naval Vessel and a Rail Tractor in the vehicle creator, transport bays and Light
// weapons on pintles, each saved, played and printed.

const collectErrors = (page: Page): string[] => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });
    return errors;
};

test("an Airship Support Vehicle builds in the fighter creator, plays on the DropShip table and prints", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("classic-battletech/fighter-creator/chassis");
    await page.getByLabel("Fighter Name").fill("Patrol Blimp");
    await page.getByLabel("Fighter Type").selectOption("support");
    await page.getByLabel("Support Vehicle Type").selectOption("airship");
    await page.getByLabel(/Weight in tons/).fill("100");
    await page.getByLabel(/Weight in tons/).press("Tab");
    await page.getByLabel("Engine Type").selectOption("fusion");
    await expect(page.getByText(/This engine needs no Fuel Points/)).toBeVisible();
    await page.goto("classic-battletech/fighter-creator/armor");
    await page.getByLabel("Barrier Armor Rating (BAR)").selectOption("5");
    await page.getByRole("button", { name: "Max Armor" }).click();
    await page.goto("classic-battletech/fighter-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();

    await page.goto("classic-battletech/roster");
    await page.getByLabel("Saved fighter to add").first().selectOption({ index: 1 });
    await page.getByRole("button", { name: "Add Fighter" }).first().click();
    await page.getByTitle("Click here to go into 'Play Mode'").click();
    await page.locator(".mech-selector").getByTitle("Select Patrol Blimp").click();
    const panel = page.getByTestId("fighter-play");
    await expect(panel).toContainText("Airship Support Vehicle, 100 tons");
    await expect(panel.getByTestId("support-aircraft-play")).toContainText("Support Vehicle, BAR 5, +2 to-hit for fire control");
    await expect(panel.getByTestId("airship-velocity")).toBeVisible();

    await page.goto("classic-battletech/roster/print");
    const sheet = page.getByTestId("support-aircraft-record-sheet-svg").first();
    await expect(sheet).toContainText("CREW DATA");
    await expect(sheet.getByTestId("airship-velocity").first()).toBeAttached();
    expect(errors).toEqual([]);
});

test("transport bays and a Light weapon on a pintle build into a Small Support Vehicle", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("classic-battletech/vehicle-creator/step1");
    await page.getByLabel("Motive Type").selectOption("wheeled");
    await page.getByLabel("Unit Type").selectOption("support");
    await page.getByLabel(/Weight in tons/).fill("3");
    await page.getByLabel(/Weight in tons/).press("Tab");
    await page.getByLabel("Add a bay:").selectOption("cargo");
    await page.getByRole("button", { name: "Add Bay" }).click();
    await expect(page.getByTestId("vehicle-bays")).toContainText("Cargo, Standard");

    await page.goto("classic-battletech/vehicle-creator/equipment-selection");
    await page.getByLabel("Weapon:").selectOption({ index: 1 });
    await page.getByLabel("Location:").selectOption("left");
    await page.getByText(/^On a pintle/).click();
    await page.getByRole("button", { name: "Add Weapon" }).click();
    await page.goto("classic-battletech/vehicle-creator/equipment-placement");
    await expect(page.getByLabel(/is on a pintle/)).toBeChecked();
    await page.goto("classic-battletech/vehicle-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();

    await page.goto("classic-battletech/roster");
    await page.getByLabel("Saved vehicle to add").first().selectOption({ index: 1 });
    await page.getByRole("button", { name: "Add Vehicle" }).first().click();
    await page.goto("classic-battletech/roster/print");
    await expect(page.locator(".print-page").first()).toContainText("(pintle)");
    await expect(page.getByTestId("vehicle-bays-sheet").first()).toContainText("Cargo, Standard");
    expect(errors).toEqual([]);
});

test("a Rail Tractor slows under its Trailers and a Large Naval Vessel takes turrets (TO:AUE)", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("classic-battletech/vehicle-creator/step1");
    await page.getByLabel("Rules Level").selectOption({ index: 3 });
    await page.getByLabel("Motive Type").selectOption("rail");
    await expect(page.getByLabel("Unit Type")).toHaveValue("support");
    await page.getByLabel(/Weight in tons/).fill("100");
    await page.getByLabel(/Weight in tons/).press("Tab");
    await page.getByText(/^Tractor \(x 1\.2/).click();
    await page.getByLabel("Engine Type").selectOption("fusion");
    await page.getByLabel("Cruise MP").selectOption("8");
    await page.goto("classic-battletech/vehicle-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();

    await page.goto("classic-battletech/roster");
    await page.getByLabel("Saved vehicle to add").first().selectOption({ index: 1 });
    await page.getByRole("button", { name: "Add Vehicle" }).first().click();
    await page.getByTitle("Click here to go into 'Play Mode'").click();
    await page.locator(".mech-selector").getByTitle(/^Select /).last().click();
    const panel = page.getByTestId("vehicle-play");
    await expect(panel).toContainText("Rail: moves only along rails");
    await panel.getByLabel("Trailers towed").fill("300");
    await expect(panel.getByLabel("Trailers towed")).toHaveValue("300");

    await page.goto("classic-battletech/vehicle-creator/step1");
    await page.getByLabel("Motive Type").selectOption("naval-surface");
    await page.getByLabel(/Weight in tons/).fill("5000");
    await page.getByLabel(/Weight in tons/).press("Tab");
    await page.getByRole("combobox", { name: /Turrets/ }).selectOption("3");
    await page.goto("classic-battletech/vehicle-creator/armor");
    await expect(page.getByRole("cell", { name: "Turret 3" })).toBeVisible();
    expect(errors).toEqual([]);
});
