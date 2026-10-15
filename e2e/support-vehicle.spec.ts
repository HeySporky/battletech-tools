import { expect, test } from "@playwright/test";

// A Support Vehicle built in the Vehicle Creator (TM pp.116-139), hit in play mode harder than its BAR for a
// penetrating critical hit (TW p.206), and printed.
test("a Support Vehicle builds, takes a penetrating critical hit and prints", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech/vehicle-creator/step1");
    await page.getByLabel("Motive Type").selectOption("tracked");
    await page.getByLabel("Unit Type").selectOption("support");
    await expect(page.getByText("Support Vehicle Chassis")).toBeVisible();
    await page.getByLabel("Structural Tech Rating").selectOption("d");
    await page.getByLabel("Fire Control").selectOption("basic");
    await expect(page.getByText(/Range/).first()).toBeVisible();

    await page.goto("classic-battletech/vehicle-creator/armor");
    await page.getByLabel(/Barrier Armor Rating/).selectOption("5");
    await page.getByRole("button", { name: "Max Armor" }).click();

    await page.goto("classic-battletech/vehicle-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();

    await page.goto("classic-battletech/roster");
    await page.getByLabel("Saved vehicle to add").first().selectOption({ index: 1 });
    await page.getByRole("button", { name: "Add Vehicle" }).first().click();
    await page.getByTitle("Click here to go into 'Play Mode'").click();
    await page.locator(".mech-selector").getByTitle(/^Select /).last().click();
    const panel = page.getByTestId("vehicle-play");
    await expect(panel).toContainText("Tracked Support Vehicle, BAR 5, +1 to-hit for fire control");

    await panel.getByLabel("Damage amount").fill("6");
    await panel.getByLabel("Hit location roll").fill("7");
    await panel.getByRole("button", { name: "Apply Hit" }).click();
    await expect(panel.getByTestId("vehicle-play-log")).toContainText("6 damage exceeds BAR 5: roll for a penetrating critical hit");
    await expect(panel.getByTestId("pending-roll")).toContainText("Critical Hit roll");

    await page.goto("classic-battletech/roster/print");
    await expect(page.locator(".print-page").first()).toContainText("Tracked Support Vehicle");
    await expect(page.locator(".print-page").first()).toContainText("BAR 5");

    expect(errors).toEqual([]);
});

// MegaMek files load into the Vehicle Creator and the Fighter Creator, with what could not be carried over listed.
test("Support Vehicles and Fixed-Wing Support Vehicles import from MegaMek files", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });
    const block = (tag: string, ...lines: string[]): string[] => [`<${tag}>`, ...lines, `</${tag}>`];
    const common = [
        ...block("year", "3050"), ...block("type", "IS Level 2"), ...block("engine_type", "0"), ...block("structural_tech_rating", "3"),
        ...block("engine_tech_rating", "3"), ...block("armor_tech_rating", "3"), ...block("barrating", "5"), ...block("armor_type", "43"),
    ];
    const tank = [...block("UnitType", "SupportTank"), ...block("Name", "Import Hauler"), ...common, ...block("motion_type", "Wheeled"),
        ...block("cruiseMP", "4"), ...block("armor", "4", "4", "4", "4"), ...block("Front Equipment", "Machine Gun", "No Such Gun"),
        ...block("fuel", "1.0"), ...block("tonnage", "20.0")].join("\n");
    const plane = [...block("UnitType", "FixedWingSupport"), ...block("Name", "Import Spotter"), ...common, ...block("motion_type", "Aerodyne"),
        ...block("SafeThrust", "4"), ...block("armor", "2", "2", "2", "2"), ...block("fuel", "40"), ...block("tonnage", "10.0")].join("\n");

    await page.goto("classic-battletech/vehicle-creator");
    await page.getByTestId("sv-import-file").setInputFiles({ name: "hauler.blk", mimeType: "text/plain", buffer: Buffer.from(tank) });
    await expect(page.getByTestId("sv-import-result")).toContainText("hauler.blk: loaded into the editor.");
    await expect(page.getByTestId("sv-import-result")).toContainText("\"No Such Gun\" has no match");
    await page.getByTestId("sv-import-file").setInputFiles({ name: "mech.blk", mimeType: "text/plain", buffer: Buffer.from(tank.replace("SupportTank", "Mek")) });
    await expect(page.getByTestId("sv-import-result")).toContainText("mech.blk: not loaded.");

    await page.goto("classic-battletech/fighter-creator");
    await page.getByTestId("fw-import-file").setInputFiles({ name: "spotter.blk", mimeType: "text/plain", buffer: Buffer.from(plane) });
    await expect(page.getByTestId("fw-import-result")).toContainText("spotter.blk: loaded into the editor.");
    await page.goto("classic-battletech/fighter-creator/chassis");
    await expect(page.getByLabel(/^Fighter Name/)).toHaveValue("Import Spotter");
    expect(errors).toEqual([]);
});
