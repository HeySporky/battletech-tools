import { expect, test } from "@playwright/test";

// A saved fighter joins a roster group, takes a hit in play mode and prints with its damage
// (Total Warfare pp. 237-240).
test("a fighter joins the roster, takes damage in play and prints", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech/fighter-creator/chassis");
    await page.getByLabel("Fighter Name").fill("Wingman");
    await page.getByLabel("Tonnage:").selectOption("50");
    await page.goto("classic-battletech/fighter-creator/armor");
    await page.getByRole("button", { name: "Max Armor" }).click();
    await page.goto("classic-battletech/fighter-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();

    await page.goto("classic-battletech/roster");
    await page.getByLabel("Saved fighter to add").first().selectOption({ index: 1 });
    await page.getByRole("button", { name: "Add Fighter" }).first().click();
    await expect(page.getByText("This Fighter is Undamaged")).toBeVisible();
    await page.getByLabel("Fighter gunnery skill").first().selectOption("3");

    await page.getByTitle("Click here to go into 'Play Mode'").click();
    await page.locator(".mech-selector").getByTitle("Select Wingman").click();
    const panel = page.getByTestId("fighter-play");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Aerospace Fighter, 50 tons");
    await expect(panel).toContainText("Gunnery 3");

    // A 7 from the nose strikes Nose / Control (TW p. 237). 400 points of armor: 100 a facing, threshold 10.
    await panel.getByLabel("Attack from").selectOption("nose");
    await panel.getByLabel("Hit location roll").selectOption("7");
    await panel.getByLabel("Damage:").fill("5");
    await panel.getByRole("button", { name: "Apply Hit" }).click();
    await expect(panel.getByTestId("fighter-play-log")).toContainText("Hit location 7: Nose / Control takes 5 armor");

    // Heat: nothing fired, one engine hit adds 2 a turn, ten heat sinks take it off again.
    await panel.getByLabel("Current heat").fill("14");
    await panel.getByLabel("Engine hits").selectOption("1");
    await panel.getByRole("button", { name: "End Turn: Apply Heat" }).click();
    await expect(panel.getByTestId("fighter-play-log")).toContainText("Heat Phase: 14 + 2 generated - 10 dissipated = 6");
    await expect(panel.getByTestId("fighter-heat")).toContainText("Random movement (5+)");
    await expect(panel).toContainText("+2 heat a turn from engine hits");

    await page.goto("classic-battletech/roster");
    await expect(page.getByText("This Fighter is Damaged")).toBeVisible();

    await page.goto("classic-battletech/roster/print");
    await expect(page.getByRole("heading", { name: "Wingman" })).toBeVisible();
    // The printed sheet carries the damage: 5 points off the nose, none off the aft.
    await expect(page.getByTestId("armor-diagram-nose").first()).toHaveAttribute("data-damage", "5");
    await expect(page.getByTestId("armor-diagram-aft").first()).toHaveAttribute("data-damage", "0");
    await expect(page.getByText(/Gunnery 3 \/ Piloting 5/)).toBeVisible();

    expect(errors).toEqual([]);
});

// Saved fighters are offered in the Alpha Strike roster's unit picker with their converted card.
test("a saved fighter can be added to an Alpha Strike force", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));

    await page.goto("classic-battletech/fighter-creator/chassis");
    await page.getByLabel("Fighter Name").fill("Cardholder");
    await page.goto("classic-battletech/fighter-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();

    await page.goto("alpha-strike-roster");
    await page.getByRole("button", { name: /Add Units/ }).first().click();
    await expect(page.getByText("Your Created Fighters")).toBeVisible();
    await page.getByTitle("Add this fighter to your current group").first().click();
    await expect(page.getByText("Cardholder").first()).toBeVisible();

    expect(errors).toEqual([]);
});
