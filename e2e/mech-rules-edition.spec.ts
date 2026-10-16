import { expect, test } from "@playwright/test";

// The Mech Creator builds a design under an earlier rules edition: only what that rulebook includes is offered.
test("a design built under Battledroids takes that rulebook's tonnages and parts", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech/mech-creator/step1");
    const edition = page.getByLabel("Rules Edition");
    await expect(edition).toHaveValue("total-warfare");
    // The edition is the first field: it decides what the others offer.
    const step1 = page.locator(".text-section", { has: page.getByRole("heading", { name: "Step 1: Design the Chassis" }) });
    await expect(step1.locator("input, select").first()).toHaveAccessibleName(/Rules Edition/);
    await expect(step1.locator("input, select").nth(1)).toHaveAccessibleName(/Rules Level/);
    await expect(page.getByLabel("Mech Tonnage").locator("option").first()).toHaveText("20 (Light)");

    await edition.selectOption("battledroids");
    await expect(page.getByText(/Built from the Battledroids rulebook/)).toBeVisible();
    // Battledroids' tables start at 5 tons (BD p.23) and know one chassis and one structure.
    await expect(page.getByLabel("Mech Tonnage").locator("option").first()).toHaveText("5 (Ultralight)");
    await expect(page.getByText(/has no Battle Value/)).toBeVisible();
    await expect(page.getByLabel("Mech Type").locator("option")).toHaveText(["Biped"]);
    // Battledroids has no Clan or Mixed technology.
    await expect(page.getByLabel("Technology Base").locator("option")).toHaveText(["Inner Sphere"]);
    await expect(page.getByLabel("Internal Structure Type").locator("option:not([disabled])")).toHaveText(["Standard"]);

    await page.goto("classic-battletech/mech-creator/step3");
    await expect(page.getByLabel("Heat Sink Technology").locator("option:not([disabled])")).toHaveText(["Single"]);

    // The edition stays with the design.
    await page.goto("classic-battletech/mech-creator/step1");
    await expect(page.getByLabel("Rules Edition")).toHaveValue("battledroids");
    await page.getByLabel("Rules Edition").selectOption("total-warfare");
    await expect(page.getByText(/Built from the/)).toHaveCount(0);

    expect(errors).toEqual([]);
});

// BD p.1 Basic, p.7 Advanced, p.14 Expert Battledroids: only Expert has the rules to design a droid.
test("Battledroids lists its own rules levels and plays the printed droids below Expert", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    const book = [
        "STG-3R Stinger", "WSP-1A Wasp", "PXH-1K Phoenix Hawk", "GRF-1N Griffin", "SHD-2H Shadow Hawk",
        "RFL-3N Rifleman", "CRD-3R Crusader", "ARC-2R Archer", "WHM-6R Warhammer", "MAD-3R Marauder",
    ];

    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Edition").selectOption("battledroids");
    const level = page.getByLabel("Rules Level");
    await expect(level.locator("option")).toHaveText([
        "Basic Battledroids", "Advanced Battledroids", "Expert Battledroids", "Apocryphal", "Custom Homebrew", "Munchkin",
    ]);
    await expect(level).toHaveValue("2");

    // Basic: choose a printed droid; nothing can be changed.
    await level.selectOption("0");
    const droid = page.getByRole("combobox", { name: /^Droid/ });
    await expect(droid.locator("option:not([value=''])")).toHaveText(book);
    await expect(page.getByLabel("Mech Tonnage")).toHaveCount(0);
    await droid.selectOption("grf-1n");
    await expect(page.getByText("Basic Battledroids plays the printed droids only.")).toBeVisible();
    await page.goto("classic-battletech/mech-creator/step2");
    await expect(page.locator("fieldset.design-lock :is(input, select)").first()).toBeDisabled();
    await expect(page.getByRole("button", { name: "Edit this droid" })).toHaveCount(0);
    // The critical slots move by clicks on list items, which a disabled fieldset does not stop.
    await page.goto("classic-battletech/mech-creator/step6");
    const criticals = page.locator("fieldset.design-lock");
    const before = await criticals.innerText();
    await page.locator("fieldset.design-lock li.cursor-pointer[title]").first().dispatchEvent("click");
    await page.locator("fieldset.design-lock li.critical-empty").last().dispatchEvent("click");
    expect(await criticals.innerText()).toEqual(before);

    // Advanced: the droid can be edited after a warning that this moves the design to Expert.
    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Level").selectOption("1");
    await page.goto("classic-battletech/mech-creator/step2");
    await expect(page.locator("fieldset.design-lock :is(input, select)").first()).toBeDisabled();
    const messages: string[] = [];
    page.once("dialog", (dialog) => { messages.push(dialog.message()); void dialog.dismiss(); });
    await page.getByRole("button", { name: "Edit this droid" }).click();
    expect(messages[0]).toContain("Expert Battledroids");
    await expect(page.locator("fieldset.design-lock :is(input, select)").first()).toBeDisabled();
    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: "Edit this droid" }).click();
    await expect(page.locator("fieldset.design-lock :is(input, select)").first()).toBeEnabled();
    await page.goto("classic-battletech/mech-creator/step1");
    await expect(page.getByLabel("Rules Level")).toHaveValue("2");
    await expect(page.getByLabel("Mech Model # (e.g. WSP-1A, Timber Wolf)")).toHaveValue("GRF-1N");
    await expect(page.getByRole("combobox", { name: /^Droid/ })).toHaveValue("grf-1n");
    // Once changed it is no longer the printed Griffin.
    await page.goto("classic-battletech/mech-creator/step2");
    await page.getByLabel("Walking Movement Points").selectOption("4");
    await page.goto("classic-battletech/mech-creator/step1");
    await expect(page.getByRole("combobox", { name: /^Droid/ })).toHaveValue("");

    // Apocryphal: the magazine's Spider and the TCI kit backs join the list, and the chassis can be built.
    await page.getByLabel("Rules Level").selectOption("5");
    await expect(page.getByRole("combobox", { name: /^Droid/ }).locator("option")).toContainText(["SPI-5R Spider", "GOL-1H Goliath", "SHD-2H Shadow Hawk (Dougram Jakt-type kit) (inferred)"]);
    await expect(page.getByLabel("Mech Tonnage")).toBeVisible();

    expect(errors).toEqual([]);
});

// A stored rules level Battledroids does not list (3) shows as Apocryphal, and Step 1 judges everything by it.
test("a stored level Battledroids does not list acts as the level shown", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Level").selectOption("3");
    await page.getByLabel("Rules Edition").selectOption("battledroids");
    await expect(page.getByLabel("Rules Level")).toHaveValue("5");
    await page.getByRole("combobox", { name: /^Droid/ }).selectOption("gol-1h");
    await expect(page.getByText("Not in this rules edition")).toHaveCount(0);
    await expect(page.getByLabel("Mech Type").locator("option")).toHaveText(["Biped", "Quad"]);
    expect(errors).toEqual([]);
});
