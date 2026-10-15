import { expect, test, type Page } from "@playwright/test";

// The Smart Robotic Control System (IO:AE pp.134-135) in the Vehicle and Fighter Creators: offered from the Advanced
// rules level, it gives the unit its own Skills.

const ADVANCED = "3";
const STANDARD = "2";

function watchErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });
    return errors;
}

test("Vehicle Creator: an Improved SRCS drives the vehicle at Gunnery 4 / Driving 5", async ({ page }) => {
    const errors = watchErrors(page);
    const option = page.getByTestId("robotic-control-option");

    await page.goto("classic-battletech/vehicle-creator/step1");
    await page.getByLabel("Rules Level").selectOption(STANDARD);
    await expect(option).toHaveCount(0);

    await page.getByLabel("Rules Level").selectOption(ADVANCED);
    await option.getByLabel("Robotic Control (Advanced):").selectOption("srcs-improved");
    await expect(page.getByTestId("robotic-control-summary")).toContainText("Gunnery 4 / Driving 5");

    // Kept through a reload of the saved design.
    await page.reload();
    await expect(option.getByLabel("Robotic Control (Advanced):")).toHaveValue("srcs-improved");

    expect(errors).toEqual([]);
});

test("Fighter Creator: an SRCS flies the drone at Gunnery 5 / Piloting 6", async ({ page }) => {
    const errors = watchErrors(page);
    const option = page.getByTestId("robotic-control-option");

    await page.goto("classic-battletech/fighter-creator");
    await page.getByRole("link", { name: /Start Building/ }).click();
    await page.getByLabel("Rules Level").selectOption(STANDARD);
    await expect(option).toHaveCount(0);

    await page.getByLabel("Rules Level").selectOption(ADVANCED);
    await option.getByLabel("Robotic Control (Advanced):").selectOption("srcs");
    await expect(page.getByTestId("robotic-control-summary")).toContainText("Gunnery 5 / Piloting 6");

    expect(errors).toEqual([]);
});
