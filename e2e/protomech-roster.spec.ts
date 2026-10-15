import { expect, test, type Page } from "@playwright/test";

const watchErrors = (page: Page): string[] => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });
    return errors;
};

// The TechManual's Delphyne-2 (TM pp. 81-89): 9 tons, Walking MP 5, 5 jump jets, 40 points of armor, two ER micro
// lasers in the arms and two SRM 3s in the torso with 10 shots each.
const buildDelphyne = async (page: Page, name: string): Promise<void> => {
    await page.goto("classic-battletech/protomech-creator");
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.goto("classic-battletech/protomech-creator/chassis");
    await page.getByLabel("Name (e.g.").fill(name);
    await page.getByTestId("pm-tons").selectOption("9");
    await page.getByTestId("pm-walk").selectOption("5");
    await page.getByTestId("pm-jump-type").selectOption("standard");
    await page.getByTestId("pm-jump-mp").selectOption("5");
    await page.getByTestId("pm-armor-max").click();
    await page.getByTestId("pm-armor-torso").selectOption("16");
    await page.goto("classic-battletech/protomech-creator/equipment");
    await page.getByTestId("pm-add-location").selectOption("la");
    await page.getByTestId("pm-add-er-micro-laser").click();
    await page.getByTestId("pm-add-location").selectOption("ra");
    await page.getByTestId("pm-add-er-micro-laser").click();
    await page.getByTestId("pm-add-location").selectOption("torso");
    await page.getByTestId("pm-tubes-srm").selectOption("3");
    await page.getByTestId("pm-add-pm-srm").click();
    await page.getByTestId("pm-add-pm-srm").click();
    await page.getByTestId("pm-shots-2").fill("10");
    await page.getByTestId("pm-shots-3").fill("10");
    await expect(page.getByTestId("pm-weight")).toHaveText("9000");
};

test("a ProtoMech Point joins the roster, takes damage in play and prints", async ({ page }) => {
    const errors = watchErrors(page);
    await buildDelphyne(page, "Delphyne Point");
    await page.goto("classic-battletech/protomech-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();

    await page.goto("classic-battletech/roster");
    await page.getByLabel("Saved ProtoMech to add").first().selectOption({ index: 1 });
    await page.getByRole("button", { name: "Add ProtoMech Point" }).first().click();
    await expect(page.getByText("This Point is at Full Strength")).toBeVisible();
    // Five ProtoMechs of Battle Value 316 (TM p. 307).
    await expect(page.getByTestId("protomech-group-table")).toContainText("1580");
    await page.getByLabel("ProtoMechs in the Point").first().selectOption("4");
    await expect(page.getByTestId("protomech-group-table")).toContainText("1264");

    await page.getByTitle("Click here to go into 'Play Mode'").click();
    await page.locator(".mech-selector").getByTitle("Select Delphyne Point").click();
    const panel = page.getByTestId("protomech-play-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("9-ton Biped ProtoMech");
    await expect(panel.getByTestId("protomech-play-move-0")).toHaveText("5 / 8 / 5");

    // 8 points to an arm of 4 armor and 2 structure: the arm is destroyed with its laser, and 2 points pass to the torso.
    await panel.getByTestId("protomech-play-damage").fill("8");
    await panel.getByTestId("protomech-play-location").selectOption("la");
    await panel.getByTestId("protomech-play-apply").click();
    await expect(panel.getByTestId("protomech-play-log")).toContainText("Left Arm destroyed.");
    await expect(panel.getByTestId("protomech-play-log")).toContainText("Torso: 2 damage.");

    // A leg critical hit slows the second ProtoMech only; firing an SRM 3 uses one of its ten volleys.
    await panel.getByRole("button", { name: "ProtoMech 2 Legs critical hit 1", exact: true }).click();
    await expect(panel.getByTestId("protomech-play-move-1")).toHaveText("4 / 6 / 5");
    await expect(panel.getByTestId("protomech-play-move-0")).toHaveText("5 / 8 / 5");
    await panel.getByTestId("protomech-play-unit-1").getByTitle("Fire SRM 3").first().click();
    await expect(panel.getByTestId("protomech-play-shots-1-2")).toHaveText("9");

    await page.goto("classic-battletech/roster");
    await expect(page.getByText("This Point is Damaged")).toBeVisible();
    await page.reload();
    await expect(page.getByText("This Point is Damaged")).toBeVisible();

    await page.goto("classic-battletech/roster/print");
    await expect(page.getByRole("heading", { name: "Delphyne Point" })).toBeVisible();
    await expect(page.getByTestId("protomech-sheet-unit-3")).toBeVisible();
    await expect(page.getByTestId("protomech-sheet-unit-4")).toHaveCount(0);

    expect(errors).toEqual([]);
});
