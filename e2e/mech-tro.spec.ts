import { expect, test } from "@playwright/test";

// The optional Technical Readout step of the 'Mech Creator: fields saved with the design, a printed sheet,
// and the TRO text importer leaving them alone.
test("Step 7 keeps the Technical Readout fields, prints them, and the TRO text importer does not wipe them", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Mech Tonnage").selectOption("50");

    await page.goto("classic-battletech/mech-creator/step7");
    await expect(page.getByText("Step 7: Technical Readout (optional)")).toBeVisible();
    await page.getByLabel("Manufacturer", { exact: true }).fill("Earthwerks Incorporated");
    await page.getByLabel("Overview").fill("Test overview");

    await page.reload();
    await expect(page.getByLabel("Manufacturer", { exact: true })).toHaveValue("Earthwerks Incorporated");
    await expect(page.getByLabel("Overview")).toHaveValue("Test overview");

    await page.getByRole("link", { name: /Print TRO sheet/ }).click();
    await expect(page.locator(".tro-sheet")).toContainText("Earthwerks Incorporated");
    await expect(page.locator(".tro-sheet")).toContainText("Test overview");

    await page.goto("classic-battletech/mech-creator/imports");
    await page.getByRole("button", { name: /Try the TRO text importer/ }).click();
    await page.locator("textarea").first().fill("Type: Test TRO\nTechnology Base: Inner Sphere\nTonnage: 50\n");
    await page.getByRole("button", { name: "Import and Replace" }).first().click();
    // The design in hand has unsaved changes, so replacing it asks first.
    await page.getByRole("dialog").getByRole("button", { name: "Discard it" }).click();

    // The imported unit took over, and the TRO fields entered before it are still there.
    await page.goto("classic-battletech/mech-creator/summary");
    await expect(page.locator(".mech-tro").first()).toContainText("Type: Test TRO");
    await page.goto("classic-battletech/mech-creator/step7");
    await expect(page.getByLabel("Manufacturer", { exact: true })).toHaveValue("Earthwerks Incorporated");

    expect(errors).toEqual([]);
});

// Battledroids droids, the book's and the player's own, take the same Technical Readout; the Engine Table's maker
// (BD p.23) is the power plant until the player enters another.
test("a Battledroids droid has a Technical Readout with the Engine Table's maker as its power plant", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));

    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Edition").selectOption("battledroids");
    // Basic plays the printed droid as it stands; its readout can still be written.
    await page.getByLabel("Rules Level").selectOption("0");
    await page.getByRole("combobox", { name: /^Droid/ }).selectOption("grf-1n");

    await page.goto("classic-battletech/mech-creator/step7");
    const engine = page.getByLabel(/^Engine \(/);
    await expect(engine).toHaveAttribute("placeholder", "CoreTek 275");
    await expect(engine).toHaveValue("");
    await page.getByLabel("Overview").fill("Griffin overview");

    await page.getByRole("link", { name: /Print TRO sheet/ }).click();
    const sheet = page.locator(".tro-sheet");
    await expect(sheet).toContainText("Power Plant: CoreTek 275");
    await expect(sheet).toContainText("Griffin overview");

    expect(errors).toEqual([]);
});

test("a player's own Battledroids droid takes the Engine Table's maker until another is entered", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));

    // Expert Battledroids designs droids; a 60-ton, 4 MP design is the book's Merlin, with its Pitban 240 (BD p.23).
    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Edition").selectOption("battledroids");
    await expect(page.getByLabel("Rules Level")).toHaveValue("2");
    await page.getByLabel("Mech Tonnage").selectOption("60");
    await page.goto("classic-battletech/mech-creator/step2");
    await page.getByLabel("Walking Movement Points").selectOption("4");
    await page.goto("classic-battletech/mech-creator/step7");
    await expect(page.getByLabel(/^Engine \(/)).toHaveAttribute("placeholder", "Pitban 240");
    await page.getByLabel(/^Engine \(/).fill("Vlar 240");
    await page.getByRole("link", { name: /Print TRO sheet/ }).click();
    await expect(page.locator(".tro-sheet")).toContainText("Power Plant: Vlar 240");

    expect(errors).toEqual([]);
});
