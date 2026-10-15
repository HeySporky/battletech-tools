import { expect, test } from "@playwright/test";

// A saved infantry platoon joins a roster group, loses troopers in play mode and prints with them blacked out
// (Total Warfare pp. 215-217).
test("an infantry platoon joins the roster, takes damage in play and prints", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech/infantry-creator");
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.goto("classic-battletech/infantry-creator/platoon");
    await page.getByLabel("Platoon Name").fill("Home Guard");
    await page.getByLabel("Motive Type:").selectOption("motorized");
    await page.goto("classic-battletech/infantry-creator/weapons");
    await page.getByLabel("Primary Weapon:").selectOption("inf-laser-rifle");
    await page.goto("classic-battletech/infantry-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();

    await page.goto("classic-battletech/roster");
    await page.getByLabel("Saved infantry platoon to add").first().selectOption({ index: 1 });
    await page.getByRole("button", { name: "Add Infantry" }).first().click();
    await expect(page.getByText("This Platoon is at Full Strength")).toBeVisible();
    await page.getByLabel("Infantry gunnery skill").first().selectOption("3");

    await page.getByTitle("Click here to go into 'Play Mode'").click();
    await page.locator(".mech-selector").getByTitle("Select Home Guard").click();
    const panel = page.getByTestId("infantry-play");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Motorized infantry, 28 troopers");
    await expect(panel).toContainText("Gunnery: 3");
    await expect(panel.getByTestId("infantry-play-line")).toContainText("Troopers: 28 of 28");
    await expect(panel.getByTestId("infantry-play-line")).toContainText("Attack Damage: 8");

    // An LRM 20 in Clear terrain: 20 / 5 = 4 troopers, doubled to 8.
    await panel.getByLabel("Attack Type:").selectOption("cluster-missile");
    await panel.getByLabel("Weapon Damage Value:").fill("20");
    await panel.getByLabel(/Platoon is in Clear terrain/).check();
    await panel.getByRole("button", { name: "Apply Attack" }).click();
    await expect(panel.getByTestId("infantry-play-log")).toContainText("8 troopers eliminated: 20 of 28 remain");
    await expect(panel.getByTestId("infantry-play-line")).toContainText("Attack Damage: 6");

    // Marking by hand: click trooper 10 to leave ten.
    await panel.getByRole("button", { name: "Trooper 10", exact: true }).click();
    await expect(panel.getByTestId("infantry-play-line")).toContainText("Troopers: 10 of 28");

    await page.goto("classic-battletech/roster");
    await expect(page.getByText("This Platoon is Under Strength")).toBeVisible();

    await page.goto("classic-battletech/roster/print");
    await expect(page.getByRole("heading", { name: "Home Guard" })).toBeVisible();
    await expect(page.getByTestId("infantry-sheet-line")).toContainText("28 troopers, 5.5 tons (10 active)");

    expect(errors).toEqual([]);
});

// A saved platoon shows its converted Alpha Strike card and is offered in the Alpha Strike roster's unit picker.
test("a saved infantry platoon converts to Alpha Strike and joins an Alpha Strike force", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));

    await page.goto("classic-battletech/infantry-creator");
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.goto("classic-battletech/infantry-creator/platoon");
    await page.getByLabel("Platoon Name").fill("Cardbearers");
    await page.getByLabel("Motive Type:").selectOption("motorized");
    await page.getByLabel(/Anti-'Mech Infantry kits/).check();
    await page.goto("classic-battletech/infantry-creator/weapons");
    await page.getByLabel("Primary Weapon:").selectOption("inf-laser-rifle");

    // The Master Unit List's Motorized Platoon (Rifle, Energy): 6"m, 1/1/0, Armor 2, AM, CAR6, 10 points.
    await page.goto("classic-battletech/infantry-creator/summary");
    const stats = page.getByTestId("infantry-as");
    await expect(stats).toContainText("6\"m");
    await expect(stats).toContainText("1/1/0");
    await expect(stats).toContainText("AM, CAR6");
    await expect(stats.getByRole("row", { name: /Point Value/ })).toContainText("10");
    await page.getByRole("link", { name: "Print Alpha Strike Card" }).click();
    await expect(page.getByTestId("alpha-strike-card").first()).toBeVisible();
    await expect(page.getByTestId("alpha-strike-card").first()).toContainText("CAR6");

    await page.goto("classic-battletech/infantry-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();
    await page.goto("alpha-strike-roster");
    await page.getByRole("button", { name: /Add Units/ }).first().click();
    await expect(page.getByText("Your Created Infantry")).toBeVisible();
    await page.getByTitle("Add this platoon to your current group").first().click();
    await expect(page.getByText("Cardbearers").first()).toBeVisible();

    expect(errors).toEqual([]);
});
