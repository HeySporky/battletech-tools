import { expect, test } from "@playwright/test";

// A saved gun emplacement joins a roster group, takes scaled damage and a critical hit in play mode and prints with
// the damage marked (Tactical Operations: Advanced Rules pp. 118-119, 124, 128).
test("a gun emplacement joins the roster, takes damage in play and prints", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech/building-creator");
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.goto("classic-battletech/building-creator/structure");
    await page.getByLabel("Building Name").fill("Battery Kenyon");
    await page.getByLabel("Rules Level:").selectOption({ label: "Advanced" });
    await page.getByLabel("Technology Base:").selectOption("clan");
    await page.getByLabel("Building Classification:").selectOption("gun-emplacement");
    await page.getByLabel("Building Type:").selectOption("heavy");
    await page.getByLabel(/Construction Factor/).selectOption("80");
    await page.getByLabel(/Tons of Armor/).selectOption("4");
    await page.getByRole("link", { name: /Next: Weapons, Power and Equipment/ }).click();
    await page.getByPlaceholder("Filter Equipment").fill("ER Large Laser");
    await page.getByRole("row", { name: /^ER Large Laser \(Clan\) Energy Weapons/ }).getByRole("button", { name: "Add" }).click();
    await page.getByLabel(/Heat Sinks \(1 ton each/).selectOption("12");
    await page.getByLabel(/Turret-mount/).check();
    await page.goto("classic-battletech/building-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();

    await page.goto("classic-battletech/roster");
    await page.getByLabel("Saved building to add").first().selectOption({ index: 1 });
    await page.getByRole("button", { name: "Add Building" }).first().click();
    await expect(page.getByText("This Building is Undamaged")).toBeVisible();
    await page.getByLabel("Building gunnery skill").first().selectOption("3");

    await page.getByTitle("Click here to go into 'Play Mode'").click();
    await page.locator(".mech-selector").getByTitle("Select Battery Kenyon").click();
    const panel = page.getByTestId("building-play");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Heavy Gun Emplacement, CF 80, 1 hex, 1 level");
    await expect(panel).toContainText("Gunnery: 3");
    const hex = panel.getByTestId("building-play-hex");
    await expect(hex).toContainText("Armor: 80 of 80");
    await expect(hex).toContainText("Construction Factor: 80 of 80");
    await expect(hex).toContainText("Damage Threshold: 8");

    // 100 points are halved against a gun emplacement and stop in the armor.
    await panel.getByLabel("Damage:", { exact: true }).fill("100");
    await panel.getByRole("button", { name: "Apply Attack" }).click();
    await expect(panel.getByTestId("building-play-log")).toContainText("50 to armor, 30 left");
    await expect(panel.getByTestId("building-play-critical")).not.toContainText("A critical hit roll is due");

    // 80 more: 40 after scaling, 10 of it through to the Construction Factor and above the threshold of 8.
    await panel.getByLabel("Damage:", { exact: true }).fill("80");
    await panel.getByRole("button", { name: "Apply Attack" }).click();
    await expect(hex).toContainText("Construction Factor: 70 of 80");
    await expect(panel.getByTestId("building-play-critical")).toContainText("A critical hit roll is due");
    await panel.getByLabel("2D6 roll:").fill("6");
    await panel.getByLabel("1D6 roll:").fill("1");
    await panel.getByRole("button", { name: "Resolve Critical Hit" }).click();
    await expect(panel.getByTestId("building-play-log")).toContainText("Weapon Malfunction");
    await expect(panel.getByTestId("building-play-equipment")).toContainText("Malfunction");
    await panel.getByRole("button", { name: /clear malfunction/ }).click();
    await expect(panel.getByTestId("building-play-equipment")).toContainText("Working");

    await page.goto("classic-battletech/roster");
    await expect(page.getByText("This Building is Damaged")).toBeVisible();

    await page.goto("classic-battletech/roster/print");
    await expect(page.getByRole("heading", { name: "Battery Kenyon" })).toBeVisible();
    await expect(page.getByTestId("building-sheet-hex")).toContainText("70 left");
    await expect(page.getByTestId("building-sheet-data")).toContainText("Armor Factor: 80");

    expect(errors).toEqual([]);
});
