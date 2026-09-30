import { expect, test } from "@playwright/test";

// Every Combat Vehicle motive type can be built in the Vehicle Creator, added to a roster, hit in play
// mode and printed, with the controls its rules call for (TW pp. 192-199).
const CATEGORIES: { motive: string; name: string; control: RegExp }[] = [
    { motive: "tracked", name: "Tracked", control: /Turret facing/ },
    { motive: "wheeled", name: "Wheeled", control: /Turret facing/ },
    { motive: "hover", name: "Hover", control: /Over Depth 1\+ water/ },
    { motive: "wige", name: "WiGE", control: /Over a clear, paved, rough or building hex/ },
    { motive: "vtol", name: "VTOL", control: /Elevation/ },
    { motive: "naval-surface", name: "Naval (Surface)", control: /Attacker is underwater/ },
    { motive: "hydrofoil", name: "Naval (Hydrofoil)", control: /Attacker is underwater/ },
    { motive: "naval-sub", name: "Naval (Submarine)", control: /Surfaced/ },
];

for (const category of CATEGORIES) {
    test(`${category.name} vehicles build, play and print`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
        page.on("console", (message) => {
            if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
        });

        await page.goto("classic-battletech/vehicle-creator/step1");
        await page.getByLabel("Motive Type").selectOption(category.motive);
        await expect(page.getByLabel("Motive Type")).toHaveValue(category.motive);
        await page.goto("classic-battletech/vehicle-creator");
        await page.getByRole("button", { name: /Save as New/ }).click();

        await page.goto("classic-battletech/roster");
        await page.getByLabel("Saved vehicle to add").first().selectOption({ index: 1 });
        await page.getByRole("button", { name: "Add Vehicle" }).first().click();
        await expect(page.getByText("This Vehicle is Undamaged")).toBeVisible();

        await page.getByTitle("Click here to go into 'Play Mode'").click();
        await page.locator(".mech-selector").getByTitle(/^Select /).last().click();
        const panel = page.getByTestId("vehicle-play");
        await expect(panel).toBeVisible();
        await expect(panel).toContainText(category.name);
        await expect(panel.getByText(category.control).first()).toBeVisible();

        // A 7 from the front strikes the Front on every table (TW pp. 193, 196).
        await panel.getByLabel("Damage amount").fill("1");
        await panel.getByLabel("Hit location roll").fill("7");
        await panel.getByRole("button", { name: "Apply Hit" }).click();
        await expect(panel.getByTestId("vehicle-play-log")).toContainText("Hit location 7: Front");

        await page.goto("classic-battletech/roster/print");
        await expect(page.locator(".print-page").first()).toBeVisible();

        expect(errors).toEqual([]);
    });
}

// Naval hits call for a Hull Integrity roll after any critical roll (TW pp. 121, 198).
test("surface naval hits call for a Hull Integrity roll", async ({ page }) => {
    await page.goto("classic-battletech/vehicle-creator/step1");
    await page.getByLabel("Motive Type").selectOption("naval-surface");
    await page.goto("classic-battletech/vehicle-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();
    await page.goto("classic-battletech/roster");
    await page.getByLabel("Saved vehicle to add").first().selectOption({ index: 1 });
    await page.getByRole("button", { name: "Add Vehicle" }).first().click();
    await page.getByTitle("Click here to go into 'Play Mode'").click();
    await page.locator(".mech-selector").getByTitle(/^Select /).last().click();
    const panel = page.getByTestId("vehicle-play");

    await panel.getByLabel("Damage amount").fill("1");
    await panel.getByLabel("Hit location roll").fill("7");
    await panel.getByRole("button", { name: "Apply Hit" }).click();
    const pending = panel.getByTestId("pending-roll");
    await expect(pending).toContainText("Critical Hit roll");
    await panel.getByRole("button", { name: "Skip" }).click();
    await expect(pending).toContainText("Hull Integrity roll: Front (breached on 12+)");
    await panel.getByLabel("Pending roll").fill("12");
    await panel.getByRole("button", { name: "Roll", exact: true }).click();
    await expect(panel.getByTestId("vehicle-play-log")).toContainText("breached and floods");
    await expect(panel.getByLabel("Front hull breached")).toBeChecked();
});

// Skids (TW p. 192) and armor-piercing hits (TW p. 140) queue their rolls; sponsons are a creator option (TO p. 348).
test("skid motive rolls, armor-piercing criticals and sponson turrets", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));

    await page.goto("classic-battletech/vehicle-creator/step1");
    await page.getByText(/Sponson Turrets \(Advanced/).click();
    await page.goto("classic-battletech/vehicle-creator/equipment-placement");
    await expect(page.getByText(/weapons on the left and right sides go in the sponsons/)).toBeVisible();
    await page.goto("classic-battletech/vehicle-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();

    await page.goto("classic-battletech/roster");
    await page.getByLabel("Saved vehicle to add").first().selectOption({ index: 1 });
    await page.getByRole("button", { name: "Add Vehicle" }).first().click();
    await page.getByTitle("Click here to go into 'Play Mode'").click();
    await page.locator(".mech-selector").getByTitle(/^Select /).last().click();
    const panel = page.getByTestId("vehicle-play");

    await panel.getByRole("button", { name: /Skidded/ }).click();
    await expect(panel.getByTestId("pending-roll")).toContainText("after a skid");
    await panel.getByRole("button", { name: "Skip" }).click();

    await panel.getByLabel("Armor-piercing ammunition").selectOption("10");
    await expect(panel.getByLabel("Armor-piercing ammunition")).toHaveValue("10");
    expect(errors).toEqual([]);
});
