import { expect, test } from "@playwright/test";

// A saved gun emplacement joins a roster group and prints with its record sheet (Tactical Operations: Advanced
// Rules p. 128).
test("a gun emplacement joins the roster and prints", async ({ page }) => {
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
    await page.getByLabel("Building gunnery skill").first().selectOption("3");

    await page.goto("classic-battletech/roster/print");
    await expect(page.getByRole("heading", { name: "Battery Kenyon" })).toBeVisible();
    await expect(page.getByTestId("building-sheet-hex")).toBeVisible();
    await expect(page.getByTestId("building-sheet-data")).toContainText("Armor Factor: 80");

    expect(errors).toEqual([]);
});
