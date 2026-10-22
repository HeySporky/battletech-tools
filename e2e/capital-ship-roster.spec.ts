import { expect, test } from "@playwright/test";

// A saved WarShip joins a roster group, takes a hit in play mode (SO:AA p.83 hit table; TW pp.237-240) and prints.
test("a WarShip joins the roster, takes damage in play and prints", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech/capital-ship-creator");
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.goto("classic-battletech/capital-ship-creator/chassis");
    await page.getByLabel("Class (e.g.").fill("Picket");
    await page.getByTestId("cs-type").selectOption("warShip");
    await page.getByTestId("cs-tonnage").fill("200000");
    await page.getByTestId("cs-thrust").selectOption("3");
    await page.goto("classic-battletech/capital-ship-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();

    await page.goto("classic-battletech/roster");
    await page.getByLabel("Saved vessel to add").first().selectOption({ index: 1 });
    await page.getByRole("button", { name: "Add Vessel" }).first().click();
    await expect(page.getByText("This vessel is Undamaged")).toBeVisible();
    await page.getByLabel("Vessel gunnery skill").first().selectOption("3");

    await page.getByTitle("Click here to go into 'Play Mode'").click();
    await page.locator(".mech-selector").getByTitle("Select Picket").click();
    const panel = page.getByTestId("capital-ship-play");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("WarShip, 200,000 tons");
    await expect(panel).toContainText("Gunnery 3");

    // An 8 from the nose strikes Nose / Sensors (SO:AA p.83); 25 standard-scale points are 3 capital. The bare hull
    // has only its free armor (SI / 10 = 1 a facing, SO:AA p.140); half the 2 left over reaches the SI (TW p.238).
    await panel.getByLabel("Attack from").selectOption("nose");
    await panel.getByLabel("Hit location roll").selectOption("8");
    await panel.getByLabel("Damage", { exact: true }).fill("25");
    await panel.getByLabel(/Standard-scale damage/).check();
    await panel.getByRole("button", { name: "Apply Hit" }).click();
    await expect(panel.getByTestId("capital-ship-play-log")).toContainText(
        "Hit location 8: Nose / Sensors takes 1 armor (25 standard-scale damage / 10 = 3) and 1 Structural Integrity (half of the 2 left over, rounded down)");

    // Each engine hit takes 1 off Safe Thrust (TW p.240): 3 becomes 1 after two.
    await panel.getByLabel("Engine hits").selectOption("2");
    await expect(panel.getByTestId("capital-ship-play-status")).toContainText("Thrust: 1 safe / 2 max");

    await page.goto("classic-battletech/roster");
    await expect(page.getByText("This vessel is Damaged")).toBeVisible();

    await page.goto("classic-battletech/roster/print");
    await expect(page.getByText("Picket (WarShip)")).toBeVisible();
    await expect(page.getByTestId("cs-sheet-data").first()).toBeVisible();

    expect(errors).toEqual([]);
});
