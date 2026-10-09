import { expect, test } from "@playwright/test";

// A saved Small Craft joins a roster group, takes a hit in play mode and prints with its damage
// (Total Warfare pp. 237-240).
test("a Small Craft joins the roster, takes damage in play and prints", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech/small-craft-creator");
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.goto("classic-battletech/small-craft-creator/chassis");
    await page.getByLabel("Name (e.g.").fill("Longboat");
    await page.getByTestId("sc-thrust").selectOption("4");
    await page.goto("classic-battletech/small-craft-creator/armor");
    await page.getByLabel(/Armor \(tons/).fill("10");
    await page.getByTestId("sc-armor-spread").click();
    await page.goto("classic-battletech/small-craft-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();

    await page.goto("classic-battletech/roster");
    await page.getByLabel("Saved Small Craft to add").first().selectOption({ index: 1 });
    await page.getByRole("button", { name: "Add Small Craft" }).first().click();
    await expect(page.getByText("This Small Craft is Undamaged")).toBeVisible();
    await page.getByLabel("Small Craft gunnery skill").first().selectOption("3");

    await page.getByTitle("Click here to go into 'Play Mode'").click();
    await page.locator(".mech-selector").getByTitle("Select Longboat").click();
    const panel = page.getByTestId("small-craft-play");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Aerodyne Small Craft, 200 tons");
    await expect(panel).toContainText("Gunnery 3");

    // A 7 from the nose strikes Nose / Weapon on the DropShips/Small Craft table (TW p. 237).
    await panel.getByLabel("Attack from").selectOption("nose");
    await panel.getByLabel("Hit location roll").selectOption("7");
    await panel.getByLabel("Damage:").fill("5");
    await panel.getByRole("button", { name: "Apply Hit" }).click();
    await expect(panel.getByTestId("small-craft-play-log")).toContainText("Hit location 7: Nose / Weapon takes 5 armor");

    // Each engine hit takes 1 off Safe Thrust (TW p. 240): 4 becomes 2 after two.
    await panel.getByLabel("Engine hits").selectOption("2");
    await expect(panel.getByTestId("small-craft-play-status")).toContainText("Thrust: 2 safe / 3 max");
    await panel.getByLabel("Current heat").fill("9");
    await panel.getByRole("button", { name: "End Turn: Apply Heat" }).click();
    await expect(panel.getByTestId("small-craft-play-log")).toContainText("Heat Phase: 9 + 0 generated - 0 dissipated = 9");
    await expect(panel.getByTestId("small-craft-heat")).toContainText("Random movement (5+)");

    await page.goto("classic-battletech/roster");
    await expect(page.getByText("This Small Craft is Damaged")).toBeVisible();

    await page.goto("classic-battletech/roster/print");
    await expect(page.getByRole("heading", { name: "Longboat" }).first()).toBeVisible();
    await expect(page.getByText(/Gunnery 3 \/ Piloting 5/)).toBeVisible();
    await expect(page.getByTestId("small-craft-as-card").first()).toBeVisible();

    expect(errors).toEqual([]);
});
