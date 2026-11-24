import { expect, test } from "@playwright/test";

// The JumpShip and WarShip Creator builds a vessel in Strategic Operations' steps (SO:AA pp.130-149) and saves it.
test("SO:AA's McKenna hull can be built, checked and saved", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech");
    await page.getByRole("link", { name: "JumpShip and WarShip Creator" }).last().click();
    await expect(page.getByText("Your Saved Vessels")).toBeVisible();
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.getByRole("link", { name: /Start Building/ }).click();

    // Lynn's McKenna: 1,930,000 tons, Safe Thrust 3, Structural Integrity 95, 1,600 tons of fuel (SO:AA pp.134-136).
    await page.getByLabel("Class (e.g.").fill("McKenna");
    await page.getByTestId("cs-type").selectOption("warShip");
    await page.getByTestId("cs-tonnage").fill("1930000");
    await page.getByTestId("cs-thrust").selectOption("3");
    await page.getByLabel(/Structural Integrity \(5 to 150\)/).fill("95");
    await page.getByLabel(/Structural Integrity \(5 to 150\)/).press("Enter");
    await page.getByLabel("Fuel (tons)").fill("1600");
    await expect(page.getByText(/Engine.*: 347,400 tons/)).toBeVisible();
    await expect(page.getByTestId("cs-kf")).toContainText("873,325 tons, Integrity 37");
    await expect(page.getByTestId("cs-kf")).toContainText("127 tons, Integrity 8");

    // Crew quarters: 72 officers' and 359 crew (SO:AA p.138), and 5,447 more heat sinks (p.139).
    await page.goto("classic-battletech/capital-ship-creator/crew");
    const officers = page.getByLabel(/Officers among the crew/);
    await officers.fill("72");
    await officers.press("Enter");
    await page.getByTestId("cs-quarters-fill").click();
    await expect(page.getByTestId("cs-remaining")).toHaveText("516,108");

    // Step 7, the optional Technical Readout, and its printed sheet (#78).
    await page.getByRole("link", { name: /Next: Technical Readout/ }).click();
    await expect(page.getByText("Step 7: Technical Readout (optional)")).toBeVisible();
    await page.getByLabel("Manufacturer", { exact: true }).fill("Dekirk Shipyards");
    await page.getByRole("link", { name: "Print TRO sheet" }).click();
    await expect(page.getByText("Dekirk Shipyards").first()).toBeVisible();
    await expect(page.getByText("1,930,000 tons").first()).toBeVisible();
    await expect(page.getByText("Compact K-F Drive (Integrity 37)").first()).toBeVisible();

    await page.goto("classic-battletech/capital-ship-creator/armor");
    const sinks = page.getByLabel(/Additional Heat Sinks/);
    await sinks.fill("5447");
    await sinks.press("Enter");
    await expect(page.getByTestId("cs-remaining")).toHaveText("510,661");
    await page.getByLabel(/Armor \(tons/).fill("1603.5");
    await expect(page.getByTestId("cs-remaining")).toHaveText("509,057.5");
    await page.getByTestId("cs-armor-spread").click();
    await expect(page.getByTestId("cs-armor-unallocated")).toHaveText("0");

    // Broadsides are a WarShip's alone; side arcs must mirror each other (SO:AA pp.133, 142).
    await page.goto("classic-battletech/capital-ship-creator/equipment");
    await expect(page.getByTestId("cs-arcs")).toContainText("Left Broadside");

    await page.goto("classic-battletech/capital-ship-creator/summary");
    await expect(page.getByText("Summary: McKenna")).toBeVisible();
    await expect(page.getByTestId("cs-weight-log")).toContainText("Compact K-F Drive (Integrity 37)");
    await expect(page.getByTestId("cs-summary")).toContainText("C-bills");
    // No weapons yet: Battle Value is the defensive rating. Standard capital armor here (the book uses ferro-carbide):
    // 641 points bought + 10 free a facing = 701; (701 x 25 + SI 95 x 20) x 0.8 = 15,540 (SO:AA p.149).
    await expect(page.getByTestId("cs-bv")).toHaveText("15,540");
    // Alpha Strike: a WarShip of 1,200,000 tons or more is Size 4; Thrust is its Safe Thrust (ASC p.92).
    await expect(page.getByTestId("capital-ship-as-line")).toContainText("TP: WS SZ: 4 THR: 3");

    // The record sheet (SO:AA pp.9-11): data block, armor in capital-scale squares, K-F drive integrity.
    await page.getByRole("link", { name: "View Record Sheet" }).click();
    const sheet = page.getByTestId("capital-ship-record-sheet-svg");
    await expect(sheet).toContainText(/Safe Thrust:\s*3\s*Maximum Thrust:\s*5/);
    await expect(page.getByTestId("capital-track-si")).toHaveAttribute("data-count", "95");
    await expect(sheet).toContainText("K-F Drive Integrity: 37");
    await expect(page.getByTestId("capital-track-kf")).toHaveAttribute("data-count", "37");

    await page.goto("classic-battletech/capital-ship-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();
    await expect(page.getByRole("cell", { name: "McKenna", exact: true })).toBeVisible();
    await expect(page.getByText("1,930,000 tons, WarShip")).toBeVisible();

    expect(errors).toEqual([]);
});
