import { expect, test, type Page } from "@playwright/test";

// FrankenMechs (CO pp.213-214): Sneede's 60-ton FrankenMech, built location by location, then lighter jump jets.

function watchErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });
    return errors;
}

test("Mech Creator: the worked example FrankenMech and its lighter jump jets", async ({ page }) => {
    const errors = watchErrors(page);

    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Level").selectOption("4");
    await page.getByLabel("Era:").selectOption("dark-ages");
    await page.getByLabel("Mech Tonnage").selectOption("60");
    await page.getByText("Is a FrankenMech").click();
    await expect(page.getByTestId("frankenmech-donors")).toBeVisible();

    // An Archer's left torso and arm, a Warhammer's right arm and a Phoenix Hawk's head.
    await page.getByLabel("Left Torso donor tonnage").selectOption("70");
    await page.getByLabel("Left Arm donor tonnage").selectOption("70");
    await page.getByLabel("Right Arm donor tonnage").selectOption("70");
    await page.getByLabel("Head donor tonnage").selectOption("45");
    await page.getByLabel("Head donor 'Mech").fill("Phoenix Hawk");
    await expect(page.getByTestId("frankenmech-leftTorso").locator("td").nth(5)).toHaveText("15");
    await expect(page.getByTestId("frankenmech-summary")).toContainText("Internal structure: 6.5 tons (Standard, FrankenMech).");

    // Legs from a heavier 'Mech than the other: +2 to Piloting Skill Rolls.
    await page.getByLabel("Left Leg donor tonnage").selectOption("65");
    await expect(page.getByTestId("frankenmech-summary")).toContainText("+2 to Piloting Skill Rolls");
    await page.getByLabel("Left Leg donor tonnage").selectOption("60");

    // An endo steel right leg that kept two slots from its donor's design, where the table gives one.
    await page.getByLabel("Right Leg structure", { exact: true }).selectOption("endo-steel");
    await expect(page.getByLabel("Right Leg structure slots")).toHaveValue("0");
    await page.getByLabel("Right Leg structure slots").selectOption("2");
    await expect(page.locator(".mech-tro").first()).toContainText(/Right Leg: 60-ton .Mech, Endo-Steel, 2 slots/);
    await page.getByLabel("Right Leg structure slots").selectOption("0");
    await page.getByLabel("Right Leg structure", { exact: true }).selectOption("standard");

    // Kept through a reload.
    await page.reload();
    await expect(page.getByLabel("Head donor 'Mech")).toHaveValue("Phoenix Hawk");
    await expect(page.getByTestId("frankenmech-summary")).toContainText("6.5 tons");

    // Six half-ton jump jets on a 60-ton 'Mech: 3 MP, 6 heat (CO p.213).
    await page.goto("classic-battletech/mech-creator/step2");
    await page.getByLabel("Walking Movement Points").selectOption("4");
    await page.getByLabel("Jump Jet Size").selectOption("light");
    await page.getByRole("combobox", { name: "Jump Jets:", exact: true }).selectOption("6");
    await expect(page.getByTestId("frankenmech-jump")).toHaveText("Jumping MP: 3, 6 heat, 3 tons.");

    expect(errors).toEqual([]);
});
