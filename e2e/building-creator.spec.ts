import { expect, test } from "@playwright/test";

// The Building Creator builds a gun emplacement or other building in the Tactical Operations: Advanced Rules steps
// (pp. 126-131), saves it and prints a record sheet.
test("a Clan gun emplacement can be built, armed, checked, saved and printed", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech");
    await page.getByRole("link", { name: "Building Creator" }).first().click();
    await expect(page.getByText("Your Saved Buildings")).toBeVisible();
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.getByRole("link", { name: /Start Building/ }).click();

    // The book's example: a Heavy Clan gun emplacement, CF 80, with 4 tons of armor for 80 points (TO:AR p. 128).
    await page.getByLabel("Building Name").fill("Battery Kenyon");
    await page.getByLabel("Rules Level:").selectOption({ label: "Advanced" });
    await page.getByLabel("Technology Base:").selectOption("clan");
    await page.getByLabel("Building Classification:").selectOption("gun-emplacement");
    await page.getByLabel("Building Type:").selectOption("heavy");
    await page.getByLabel(/Construction Factor/).selectOption("80");
    await expect(page.getByTestId("building-capacity")).toContainText("Internal Weight Capacity: 80 tons a hex");
    await page.getByLabel(/Tons of Armor/).selectOption("4");
    await expect(page.getByTestId("building-armor")).toContainText("Armor Factor: 80 of 80 points");

    // Two ER Large Lasers in the turret: 24 heat to sink and 0.8 tons of power amplifiers on grid power (p. 130).
    await page.getByRole("link", { name: /Next: Weapons, Power and Equipment/ }).click();
    await page.getByPlaceholder("Filter Equipment").fill("ER Large Laser");
    const laser = page.getByRole("row", { name: /^ER Large Laser \(Clan\) Energy Weapons/ }).getByRole("button", { name: "Add" });
    await laser.click();
    await laser.click();
    await expect(page.getByTestId("building-equipment").getByRole("row")).toHaveCount(3);
    await expect(page.getByTestId("building-remaining")).toContainText("Energy Weapon Heat: 24 of 0 sunk");
    await page.getByLabel(/Heat Sinks \(1 ton each/).selectOption("24");
    for (const box of await page.getByLabel(/Turret-mount/).all()) await box.check();
    // 76 tons after armor, less 8 of lasers, 24 of heat sinks, 0.8 of amplifiers and a 1-ton turret.
    await expect(page.getByTestId("building-remaining")).toContainText("Remaining Capacity: 42.2 tons");
    await expect(page.getByTestId("building-loads")).toContainText("8 / 26");

    await page.getByRole("link", { name: /Next: Summary/ }).click();
    await expect(page.getByText("This building is legal under the Tactical Operations construction rules.")).toBeVisible();
    await expect(page.getByText("Summary: Battery Kenyon")).toBeVisible();
    await expect(page.getByTestId("building-summary")).toContainText("Heavy Gun Emplacement");
    await expect(page.getByTestId("building-cost-log")).toContainText("1 + CF 80 / 100");

    await page.getByRole("link", { name: "View Record Sheet" }).click();
    await expect(page.getByRole("heading", { name: "Battery Kenyon" })).toBeVisible();
    await expect(page.getByTestId("building-sheet-data")).toContainText("Armor Factor: 80");

    await page.goto("classic-battletech/building-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();
    await expect(page.getByRole("cell", { name: "Battery Kenyon", exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("cell", { name: "Battery Kenyon", exact: true })).toBeVisible();

    expect(errors).toEqual([]);
});

// A fortress covers several hexes: each hex has its own capacity and Heavy weapon limit, and a standard building
// mounts no Heavy weapons at all.
test("a fortress tracks its load hex by hex and a standard building takes no weapons", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));

    await page.goto("classic-battletech/building-creator");
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.goto("classic-battletech/building-creator/structure");
    await page.getByLabel("Rules Level:").selectOption({ label: "Advanced" });
    await page.getByLabel("Building Classification:").selectOption("fortress");
    await page.getByLabel("Building Type:").selectOption("hardened");
    await page.getByLabel(/Construction Factor/).selectOption("150");
    await page.getByLabel("Size in hexes:").selectOption("6");
    await page.getByLabel("Height in Levels:").selectOption("5");
    // Tara's central building: 750 tons a hex, 741 after 9 tons of armor for 144 points (TO:AR p. 129).
    await expect(page.getByTestId("building-capacity")).toContainText("Internal Weight Capacity: 750 tons a hex, 4500 in all");
    await page.getByLabel(/Tons of Armor/).selectOption("9");
    await expect(page.getByTestId("building-armor")).toContainText("Armor Factor: 144 of 150 points");

    await page.goto("classic-battletech/building-creator/equipment");
    await page.getByLabel("Power Generator:").selectOption("fusion");
    // 30 tons of fusion generator, 5 on each hex.
    await expect(page.getByTestId("building-loads").getByRole("row")).toHaveCount(7);
    await expect(page.getByTestId("building-loads").getByRole("row").nth(1)).toContainText("736");

    await page.goto("classic-battletech/building-creator/structure");
    await page.getByLabel("Building Classification:").selectOption("standard");
    await expect(page.getByText("Only walls, gun emplacements and fortresses may install armor")).toBeVisible();
    await page.goto("classic-battletech/building-creator/equipment");
    await expect(page.getByText("Only gun emplacements and fortresses mount Heavy weapons")).toBeVisible();

    expect(errors).toEqual([]);
});
