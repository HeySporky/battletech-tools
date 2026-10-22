import { expect, test } from "@playwright/test";

// The Battle Armor Creator builds a suit in the TechManual's steps (pp. 160-173), saves it and prints a record sheet.
test("the TechManual's Purifier can be built, checked, saved and printed", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech");
    await page.getByRole("link", { name: "Battle Armor Creator" }).last().click();
    await expect(page.getByText("Your Saved Battle Armor")).toBeVisible();
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.getByRole("link", { name: /Start Building/ }).click();

    // Max's Purifier: Inner Sphere medium humanoid, 3 Jumping MP, a battle claw, 6 points of mimetic armor and an
    // ER small laser in a modular mount, six to a Level I (TM pp. 162-171).
    await page.getByLabel("Name (e.g.").fill("Purifier");
    await page.getByTestId("ba-weight-class").selectOption("medium");
    await page.getByTestId("ba-squad-size").selectOption("6");
    await page.getByTestId("ba-motive").selectOption("jump");
    await page.getByTestId("ba-motive-mp").selectOption("3");
    await page.getByTestId("ba-manipulator-ra").selectOption("battle-claw");
    await expect(page.getByTestId("ba-capabilities")).toContainText("Swarm attacks: Yes");
    await page.getByTestId("ba-armor").selectOption("ba-mimetic");
    await page.getByTestId("ba-armor-points").selectOption("6");
    await expect(page.getByTestId("ba-remaining")).toHaveText("360");

    await page.getByRole("link", { name: /Next Step/ }).click();
    await page.getByTestId("ba-add-location").selectOption("la");
    await page.getByTestId("ba-add-is-er-small-laser").click();
    await expect(page.getByTestId("ba-mounted-item")).toHaveCount(1);
    await page.getByTestId("ba-item-modular").check();
    await expect(page.getByTestId("ba-weight")).toHaveText("1000");
    await expect(page.getByTestId("ba-issues")).toHaveCount(0);

    // One more weapon in the arm breaks the weight, the slots and the weapon limit; taking it off mends them.
    await page.getByTestId("ba-add-is-small-laser").click();
    await expect(page.getByTestId("ba-issues")).toContainText("at most 1 anti-'Mech weapon");
    await page.getByRole("button", { name: "Remove Small Laser" }).click();
    await expect(page.getByTestId("ba-issues")).toHaveCount(0);

    await page.goto("classic-battletech/battle-armor-creator/summary");
    await expect(page.getByTestId("ba-legal")).toBeVisible();
    await expect(page.getByText("Summary: Purifier")).toBeVisible();
    // TM p.311: 51.78 a suit, 466 for the Level I.
    await expect(page.getByTestId("ba-summary")).toContainText("Battle Value: 466 (52 a suit)");
    await expect(page.getByTestId("ba-cost-log")).toContainText("Structural cost: 425,000");

    await page.getByRole("link", { name: "View Record Sheet" }).click();
    await expect(page.getByRole("heading", { name: "Purifier" })).toBeVisible();
    await expect(page.getByTestId("battle-armor-sheet-troopers").getByRole("row")).toHaveCount(6);

    await page.goto("classic-battletech/battle-armor-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();
    await expect(page.getByRole("cell", { name: "Purifier", exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("cell", { name: "Purifier", exact: true })).toBeVisible();

    expect(errors).toEqual([]);
});

test("a Clan quad with a turret follows the quad rules", async ({ page }) => {
    await page.goto("classic-battletech/battle-armor-creator");
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.getByRole("link", { name: /Start Building/ }).click();
    await page.getByTestId("ba-tech-base").selectOption("clan");
    await page.getByTestId("ba-weight-class").selectOption("assault");
    await page.getByTestId("ba-body-type").selectOption("quad");
    await expect(page.getByText("Quad battle armor may not use manipulators")).toBeVisible();
    await expect(page.getByTestId("ba-motive").getByRole("option")).toHaveCount(1);
    await expect(page.getByTestId("ba-capabilities")).toContainText("Mechanized battle armor: No");

    await page.getByRole("link", { name: /Next Step/ }).click();
    await page.getByTestId("ba-turret").selectOption("4");
    await page.getByTestId("ba-turret-configurable").check();
    await page.getByTestId("ba-add-location").selectOption("turret");
    await page.getByTestId("ba-add-clan-srm-4").click();
    await page.getByTestId("ba-item-shots").selectOption("4");
    // Clan SRM 4: 140 kg and 4 shots of 40 kg; 2 slots and 1 for the shots, filling the 3-slot turret.
    await expect(page.getByTestId("ba-mounted-item")).toContainText("300 kg");
    await expect(page.getByTestId("ba-status")).toContainText("Turret 0/3");
    await expect(page.getByTestId("ba-issues")).toHaveCount(0);
});
