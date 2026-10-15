import { expect, test } from "@playwright/test";

// Every unit creator opens Step 1 with the Rules Edition: it decides what the fields below it offer.
const creators: [string, string, string[]][] = [
    ["vehicle-creator/step1", "Step 1: Design the Chassis", ["Total Warfare (2006)"]],
    ["fighter-creator/chassis", "Step 1: Design the Chassis", ["Total Warfare (2006)"]],
    ["small-craft-creator/chassis", "Step 1: Design the Hull", ["Total Warfare (2006)"]],
    ["infantry-creator/platoon", "Step 1: Establish Platoon Type", ["Total Warfare (2006)"]],
    ["battle-armor-creator/chassis", "Step 1: Design the Chassis", ["Total Warfare (2006)"]],
    ["protomech-creator/chassis", "Step 1: Design the Chassis", ["Total Warfare (2006)"]],
    ["building-creator/structure", "Step 1: Establish Superstructure", ["Total Warfare (2006)", "BattleTech Core Rulebook (2026)"]],
];

test("each unit creator starts Step 1 with the rules editions it has rules for", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));

    for (const [path, heading, editions] of creators) {
        await page.goto(`classic-battletech/${path}`);
        const step1 = page.locator(".text-section", { has: page.getByRole("heading", { name: heading }) });
        await expect(step1.locator("input, select").first(), path).toHaveAccessibleName(/Rules Edition/);
        await expect(page.getByLabel("Rules Edition").locator("option"), path).toHaveText(editions);
    }

    // The edition stays with the design.
    await page.getByLabel("Rules Edition").selectOption("core-rulebook");
    await page.goto("classic-battletech/building-creator/summary");
    await page.goto("classic-battletech/building-creator/structure");
    await expect(page.getByLabel("Rules Edition")).toHaveValue("core-rulebook");
    expect(errors).toEqual([]);
});
