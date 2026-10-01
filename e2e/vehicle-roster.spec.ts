import { expect, test } from "@playwright/test";

// A vehicle saved in the Vehicle Creator can be added to a Classic BattleTech roster group,
// played (damage, motive damage) and printed, and its damage survives a reload.
test("saved vehicles join a roster group, take damage in play mode, and print", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech/vehicle-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();

    await page.goto("classic-battletech/roster");
    const savedVehicle = page.getByLabel("Saved vehicle to add").first();
    await savedVehicle.selectOption({ index: 1 });
    await page.getByRole("button", { name: "Add Vehicle" }).first().click();
    await expect(page.getByText("This Vehicle is Undamaged")).toBeVisible();

    await page.getByTitle("Click here to go into 'Play Mode'").click();
    await page.locator(".mech-selector").getByTitle(/^Select /).last().click();
    const panel = page.getByTestId("vehicle-play");
    await expect(panel).toBeVisible();

    // The default design is unarmored (2 front structure at 20 t), so 1 point damages without destroying it.
    // A front attack rolling 7 hits the Front; structure damage calls for a critical roll (TW p. 193).
    await panel.getByLabel("Damage amount").fill("1");
    await panel.getByLabel("Hit location roll").fill("7");
    await panel.getByRole("button", { name: "Apply Hit" }).click();
    await expect(panel.getByTestId("vehicle-play-log")).toContainText("Hit location 7: Front");
    await expect(panel.getByTestId("pending-roll")).toContainText("Critical Hit roll: Front");
    await panel.getByLabel("Pending roll").fill("4");
    await panel.getByRole("button", { name: "Roll", exact: true }).click();
    await expect(panel.getByTestId("vehicle-play-log")).toContainText("No Critical Hit");
    await panel.getByRole("button", { name: /\+ Moderate/ }).click();
    await expect(panel).toContainText("Driving Skill Modifier: +2");

    await page.reload();
    await page.goto("classic-battletech/roster");
    await expect(page.getByText("This Vehicle is Damaged")).toBeVisible();

    await page.goto("classic-battletech/roster/print");
    await expect(page.locator(".print-page").first()).toBeVisible();

    expect(errors).toEqual([]);
});
