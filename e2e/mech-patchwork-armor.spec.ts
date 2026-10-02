import { expect, test } from "@playwright/test";

// Patchwork Armor: an armor type per location, weighed location by location (TO:AUE pp.188-189).
test("a 55-ton 'Mech mounts the book's Griffin arm of ferro-fibrous under Patchwork Armor", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Level").selectOption("3");
    await page.getByLabel("Mech Era").selectOption("dark-ages");
    await page.getByLabel("Mech Tonnage").selectOption("55");
    // The Fractional Accounting switch is there, but cannot be turned on yet.
    await expect(page.getByText("Fractional Accounting (TO:AUE p.188) is not built yet.")).toBeVisible();

    await page.goto("classic-battletech/mech-creator/step2");
    await page.getByLabel("Walking Movement Points").selectOption("5");

    await page.goto("classic-battletech/mech-creator/step4");
    await page.getByRole("combobox", { name: /^Armor Type/ }).selectOption("patchwork");
    await expect(page.getByText("Patchwork Armor (TO:AUE p.189)")).toBeVisible();
    await page.getByLabel("Right Arm armor type").selectOption("ferro-fibrous");

    const rightArm = page.locator("fieldset.patchwork-armor tr", { hasText: "Right Arm" });
    await page.getByTitle("Change this BattleMech's right arm armor value").selectOption("18");
    // 18 x 0.0558 = 1.0044, rounded up to 1.5 tons; two slots in the arm.
    await expect(rightArm.locator("td")).toHaveText(["Right Arm", /Ferro Fibrous/, "18", "1.5", "2"]);
    await page.getByTitle("Change this BattleMech's right arm armor value").selectOption("17");
    // 17 x 0.0558 = 0.9486: 1 ton. The mirrored left arm carries 17 points of Standard: 1.0625, so 1.5 tons.
    await expect(rightArm.locator("td")).toHaveText(["Right Arm", /Ferro Fibrous/, "17", "1", "2"]);
    await expect(page.getByText("Armor Weight: 2.5 tons")).toBeVisible();

    expect(errors).toEqual([]);
});
