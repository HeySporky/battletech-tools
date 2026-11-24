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
    // The shared settings block comes first, Special Rulesets then the edition: they decide what the others offer (#324).
    const step1 = page.locator(".text-section", { has: page.getByRole("heading", { name: "Step 1: Design the Chassis" }) });
    await expect(step1.locator("input, select").first()).toHaveAccessibleName(/Special Rulesets/);
    await expect(step1.locator("input, select").nth(1)).toHaveAccessibleName(/Rules Edition/);
    await expect(step1.locator("input, select").nth(2)).toHaveAccessibleName(/Rules Level/);
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
        "RFL-3N Rifleman", "CRD-3R Crusader", "ARC-2R Archer", "WHM-6R Warhammer", "MAD-3R Marauder", "Merlin",
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

// A rules level Battledroids does not list (3, Advanced) becomes its nearest game level, Expert, never Apocryphal
// (#324 call 10); Step 1 judges everything by the level shown.
test("a rules level Battledroids does not list becomes its nearest game level", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Level").selectOption("3");
    await page.getByLabel("Rules Edition").selectOption("battledroids");
    await expect(page.getByLabel("Rules Level")).toHaveValue("2");
    // The Goliath is not in the book: Apocryphal offers it.
    await page.getByLabel("Rules Level").selectOption("5");
    await page.getByRole("combobox", { name: /^Droid/ }).selectOption("gol-1h");
    await expect(page.getByText("Not in this rules edition")).toHaveCount(0);
    await expect(page.getByLabel("Mech Type").locator("option")).toHaveText(["Biped", "Quad"]);
    // The figurine's turret holds what the center torso has no slots for.
    await page.goto("classic-battletech/mech-creator/step6");
    await expect(page.getByRole("group", { name: "Turret" })).toContainText("PPC");
    await expect(page.getByText("Machine Gun").first()).toBeVisible();
    expect(errors).toEqual([]);
});

// The rules edition decides: Total Warfare caps the Griffin's Jumping MP, and switching straight back to
// Battledroids brings back the droid as printed.
test("going back to Battledroids restores the printed droid's specs", async ({ page }) => {
    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Edition").selectOption("battledroids");
    await page.getByLabel("Rules Level").selectOption("2");
    await page.getByRole("combobox", { name: /^Droid/ }).selectOption("grf-1n");
    await page.getByLabel("Rules Edition").selectOption("total-warfare");
    await page.getByLabel("Rules Edition").selectOption("battledroids");
    await expect(page.getByRole("combobox", { name: /^Droid/ })).toHaveValue("grf-1n");
});

// BMR(R) p.141: flare LRMs are Level 2 (Standard); TM errata v4.1 p.18 removes them, so TW offers them as Apocryphal.
test("offers flare LRM ammo by edition and rules level", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    // The add dialog's rows; the installed list below it keeps the ton already added.
    const row = (name: string) => page.getByRole("dialog").getByRole("row").filter({ has: page.getByRole("cell", { name, exact: true }) });
    const flare = row("LRM - Flare Ammo");
    const levelAndFilter = async (edition: string, level: string, mounted = true) => {
        await page.goto("classic-battletech/mech-creator/step1");
        await page.getByLabel("Rules Edition").selectOption(edition);
        await page.getByLabel("Rules Level").selectOption(level);
        await page.goto("classic-battletech/mech-creator/step5");
        await page.getByTitle("Open the add dialog").first().click();
        await page.getByPlaceholder("Filter Equipment").fill("LRM");
        // The mounted LRM 5 survives a level or edition change, so its ammo is listed without Show all.
        if (mounted) await expect(row("LRM - Standard Ammo")).not.toHaveCount(0);
        await page.getByLabel(/Show all ammunition/).check();
        await expect(row("LRM - Standard Ammo")).not.toHaveCount(0);
    };
    await levelAndFilter("master-rules-revised", "2", false);
    await row("LRM 5").getByRole("button", { name: "Add" }).first().click();
    await expect(flare).toHaveCount(1);
    await flare.getByRole("button", { name: "Add" }).first().click();
    await page.getByRole("button", { name: "Close" }).first().click();
    await expect(page.getByText("LRM - Flare Ammo").first()).toBeVisible();
    await levelAndFilter("master-rules-revised", "1");
    await expect(row("LRM 5")).not.toHaveCount(0);
    await expect(flare).toHaveCount(0);
    await levelAndFilter("total-warfare", "4");
    await expect(flare).toHaveCount(0);
    await levelAndFilter("total-warfare", "5");
    await expect(flare).toHaveCount(1);
    expect(errors).toEqual([]);
});

// Maximum Tech p.59: the targeting and tracking systems are Level 3 (Advanced) of BMR(R), one to a 'Mech (p.58).
test("offers the Maximum Tech targeting systems under BMR(R) Advanced, one to a 'Mech", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    const row = (name: string) => page.getByRole("dialog").getByRole("row").filter({ has: page.getByRole("cell", { name, exact: true }) });
    const openAt = async (level: string) => {
        await page.goto("classic-battletech/mech-creator/step1");
        await page.getByLabel("Rules Edition").selectOption("master-rules-revised");
        await page.getByLabel("Rules Level").selectOption(level);
        await page.goto("classic-battletech/mech-creator/step5");
        await page.getByTitle("Open the add dialog").first().click();
        await page.getByPlaceholder("Filter Equipment").fill("Targeting");
    };
    await openAt("2");
    await expect(row("Variable-Range Targeting")).toHaveCount(0);
    await openAt("3");
    for (const name of ["Long-Range Targeting", "Short-Range Targeting", "Variable-Range Targeting", "Anti-Aircraft Targeting", "Multi-Trac Targeting", "Multi-Trac II Targeting"]) {
        await expect(row(name), name).toHaveCount(1);
    }
    await row("Variable-Range Targeting").getByRole("button", { name: "Add" }).first().click();
    await expect(row("Long-Range Targeting").getByRole("button", { name: "Add" })).toHaveCount(0);
    await page.getByRole("button", { name: "Close" }).first().click();
    await expect(page.getByText("Variable-Range Targeting").first()).toBeVisible();
    // Placed in the head (its one allowed location): the record sheet's critical table shows it.
    await page.goto("classic-battletech/mech-creator/summary");
    await expect(page.locator("svg").getByText(/Variable-Range Targeting/).first()).toBeAttached();
    expect(errors).toEqual([]);
});

// Maximum Tech pp.60-61, p.87: the Clan EI cockpit, BMR(R) Level 3, no weight or slots.
test("offers Enhanced Imaging to Clan 'Mechs under BMR(R) Advanced", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    const imaging = page.getByRole("checkbox", { name: /Enhanced Imaging/ });
    const openAt = async (level: string, tech: string) => {
        await page.goto("classic-battletech/mech-creator/step1");
        await page.getByLabel("Rules Edition").selectOption("master-rules-revised");
        await page.getByLabel("Rules Level").selectOption(level);
        await page.getByLabel("Technology Base").selectOption(tech);
        // EI dates from 3040 (IO:AE p.52); the Clan default era ends in 2840.
        await page.getByLabel("Era:").selectOption("clan-inv");
        await page.goto("classic-battletech/mech-creator/step2");
    };
    await openAt("2", "clan");
    await expect(imaging).toHaveCount(0);
    await openAt("3", "is");
    await expect(imaging).toHaveCount(0);
    await openAt("3", "clan");
    await imaging.check();
    await expect(imaging).toBeChecked();
    await page.goto("classic-battletech/mech-creator/summary");
    await expect(page.getByText("Enhanced Imaging").first()).toBeAttached();
    expect(errors).toEqual([]);
});

test("offers a jump pack under BMR(R) Advanced, saved across a reload", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    const tons = page.getByTestId("jump-pack-tons");
    await page.goto("classic-battletech/mech-creator");
    await page.getByTitle("Click here to clear out your current 'mech and start over.").click();
    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Edition").selectOption("master-rules-revised");
    await page.getByLabel("Rules Level").selectOption("2");
    await page.goto("classic-battletech/mech-creator/step2");
    await expect(tons).toHaveCount(0);
    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Level").selectOption("3");
    await page.goto("classic-battletech/mech-creator/step2");
    await tons.selectOption("4");
    await page.reload();
    await expect(tons).toHaveValue("4");
    expect(errors).toEqual([]);
});

test("a jump pack jumps without heat in play, burns its fuel and drops when empty", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    await page.goto("classic-battletech/mech-creator");
    await page.getByTitle("Click here to clear out your current 'mech and start over.").click();
    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Edition").selectOption("master-rules-revised");
    await page.getByLabel("Rules Level").selectOption("3");
    await page.getByLabel("Mech Tonnage").selectOption("55");
    await page.goto("classic-battletech/mech-creator/step2");
    await page.getByLabel("Walking Movement Points").selectOption("5");
    await page.getByTestId("jump-pack-tons").selectOption("4");
    await page.goto("classic-battletech/mech-creator");
    await page.getByTitle("Click here to save a a new 'mech row").click();

    await page.goto("classic-battletech/roster");
    await page.getByTitle("Add 'Mechs, or search the Master Unit List for any unit type").first().click();
    await page.locator(".modal tr", { hasText: "Saved" }).getByRole("button", { name: /^Add / }).first().click();
    await page.goto("classic-battletech/roster/play");
    await page.locator(".mech-selector li button").first().click();
    await expect(page.getByTestId("jump-pack-note").first()).toContainText("Jump pack: 4 t, 10 hexes");

    const jump = async () => {
        await page.getByText("Click here to set move for the turn").first().click();
        const dialog = page.locator(".modal");
        await expect(dialog.getByTestId("jump-pack-play")).toContainText("Jump pack");
        await dialog.getByRole("button", { name: /Jump:\s+5/ }).click();
        await dialog.getByLabel(/Jumping MP Used/).selectOption("5");
        await dialog.getByRole("button", { name: "Save" }).first().click();
    };
    const nextTurn = async () => {
        await page.getByTitle("End Phase").click();
        await page.getByRole("button", { name: "Next Turn" }).click();
        await page.getByTitle("Movement Phase").click();
    };
    await jump();
    await expect(page.getByTestId("jump-pack-note").first()).toContainText("5 hexes");
    await nextTurn();
    await jump();
    await nextTurn();
    await expect(page.getByTestId("jump-pack-note").first()).toHaveText("Jump pack: out of fuel, dropped");
    expect(errors).toEqual([]);
});

test("offers armless 'Mechs under BMR(R) Advanced, saved across a reload, and the later steps open", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    const armless = page.getByTestId("armless");
    await page.goto("classic-battletech/mech-creator");
    await page.getByTitle("Click here to clear out your current 'mech and start over.").click();
    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Edition").selectOption("master-rules-revised");
    await page.getByLabel("Rules Level").selectOption("2");
    await expect(armless).toHaveCount(0);
    await page.getByLabel("Rules Level").selectOption("3");
    await armless.check();
    await page.reload();
    await expect(armless).toBeChecked();
    for (const step of ["step3", "step4", "step5", "step6", "summary"]) {
        await page.goto(`classic-battletech/mech-creator/${step}`);
        await expect(page.getByRole("main").or(page.locator("body")).first()).toBeVisible();
    }
    expect(errors).toEqual([]);
});

// Maximum Tech p.62: the critical hit dialog has no arms to hit.
test("plays an armless 'Mech with no arm critical tables", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    await page.goto("classic-battletech/mech-creator");
    await page.getByTitle("Click here to clear out your current 'mech and start over.").click();
    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Edition").selectOption("master-rules-revised");
    await page.getByLabel("Rules Level").selectOption("3");
    await page.getByTestId("armless").check();
    await page.goto("classic-battletech/mech-creator");
    await page.getByTitle("Click here to save a a new 'mech row").click();

    await page.goto("classic-battletech/roster");
    await page.getByTitle("Add 'Mechs, or search the Master Unit List for any unit type").first().click();
    await page.locator(".modal tr", { hasText: "Saved" }).getByRole("button", { name: /^Add / }).first().click();
    await page.goto("classic-battletech/roster/play");
    await page.locator(".mech-selector li button").first().click();
    await page.getByTitle("Weapon Attack Phase").click();
    await page.locator("svg.cursor-pointer[viewBox='0 0 210 210']").last().click();

    const legends = page.locator(".modal fieldset legend");
    await expect(legends.filter({ hasText: /^Head$/ })).toHaveCount(1);
    await expect(legends.filter({ hasText: /Arm$/ })).toHaveCount(0);
    expect(errors).toEqual([]);
});

// IO:AE p.184: under TW a pilot with EI implants in a 'Mech with the EI interface reads Gunnery and Piloting 1 better.
test("EI implants raise the roster's adjusted BV under TW", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    await page.goto("classic-battletech/mech-creator");
    await page.getByTitle("Click here to clear out your current 'mech and start over.").click();
    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Level").selectOption("4");
    await page.getByLabel("Technology Base").selectOption("clan");
    await page.getByLabel("Era:").selectOption("clan-inv");
    await page.goto("classic-battletech/mech-creator/step2");
    await page.getByRole("checkbox", { name: /Enhanced Imaging/ }).check();
    await page.goto("classic-battletech/mech-creator");
    await page.getByTitle("Click here to save a a new 'mech row").click();

    await page.goto("classic-battletech/roster");
    await page.getByTitle("Add 'Mechs, or search the Master Unit List for any unit type").first().click();
    // #614: the design is Experimental (TW, the IO:AE interface), so Search Rules narrows to it, and Standard leaves it out.
    const saved = page.locator(".modal tr", { hasText: "Saved" });
    await page.getByLabel(/Search Rules/).selectOption("standard");
    await expect(saved).toHaveCount(0);
    await page.getByLabel(/Search Rules/).selectOption("experimental");
    await saved.getByRole("button", { name: /^Add / }).first().click();
    await page.getByRole("dialog").getByRole("button", { name: "Close" }).first().click();
    await expect(page.locator(".modal")).toHaveCount(0);
    await page.getByTitle("Edit the name and pilot of this unit").first().click();
    const dialog = page.locator(".modal");
    const adjusted = dialog.locator("div", { hasText: /^Adjusted BV:/ });
    const before = await adjusted.textContent();
    await dialog.getByRole("checkbox", { name: /EI neural implants/ }).check();
    await expect(adjusted).not.toHaveText(before ?? "");
    const value = (text: string | null) => Number((text ?? "").replace(/\D/g, ""));
    expect(value(await adjusted.textContent())).toBeGreaterThan(value(before));
    await dialog.getByRole("button", { name: "Save" }).first().click();

    // Play: the End Phase switch sits in the Target dialog; with implants and the switch on, EI is active (IO:AE p.69).
    await page.goto("classic-battletech/roster/play");
    await page.locator(".mech-selector li button").first().click();
    // The sheet's EI note: the box is marked while EI is active, beside the feedback reminder (IO:AE p.69).
    await expect(page.getByTestId("ei-box").first()).toHaveAttribute("fill", "rgb(0,0,0)");
    await expect(page.locator("svg text", { hasText: "Structure damage:" }).first()).toBeVisible();
    await page.getByTitle(/^Open the Target Dialog for /).first().click();
    const ei =page.locator(".modal label", { hasText: "Enhanced Imaging on" });
    await expect(ei.getByRole("checkbox")).toBeChecked();
    await expect(ei).not.toContainText("Not active.");
    await ei.getByRole("checkbox").uncheck();
    await expect(ei).toContainText("Not active.");
    // Woods / smoke hexes per target, which EI reduces in the GATOR (IO:AE p.69).
    const heavyWoods = page.locator(".modal").getByLabel("Heavy Woods / Smoke Hexes").first();
    await heavyWoods.selectOption("2");
    await expect(heavyWoods).toHaveValue("2");
    // An aimed shot names a location; EI aims at an active target as a targeting computer does (IO:AE p.69).
    const aimed = page.locator(".modal").getByLabel("Aimed Shot").first();
    await aimed.selectOption("la");
    await expect(aimed).toHaveValue("la");
    const immobile = page.locator(".modal label.checkbox-input", { hasText: "Immobile" }).first();
    const unchecked = await immobile.innerHTML();
    await immobile.click();
    await expect.poll(() => immobile.innerHTML()).not.toBe(unchecked);
    expect(errors).toEqual([]);
});

// A field the edition's rulebook does not have is not shown: Battledroids has one engine, one gyro, one armor, no
// eras and no OmniMechs. Total Warfare keeps them all.
test("Battledroids hides the fields its rulebook does not have", async ({ page }) => {
    await page.goto("classic-battletech/mech-creator/step1");
    await expect(page.getByText("Is an Omnimech")).toBeVisible();
    await expect(page.getByLabel("Technology Base")).toBeVisible();
    await page.getByLabel("Rules Edition").selectOption("battledroids");
    await page.getByLabel("Rules Level").selectOption("2");
    for (const field of ["Technology Base", "Mech Type", "Era:", "Internal Structure Type"]) {
        await expect(page.getByLabel(field), field).toBeHidden();
    }
    await expect(page.getByText("Is an Omnimech")).toBeHidden();
    await expect(page.getByLabel("Mech Tonnage")).toBeVisible();
    await page.goto("classic-battletech/mech-creator/step2");
    for (const field of ["Myomer", "Jump Jet Type", "Select Engine Type", "Select Gyro Type", "Select Cockpit"]) {
        await expect(page.getByLabel(field), field).toBeHidden();
    }
    await expect(page.getByRole("heading", { name: "Engine Type" })).toBeHidden();
    await expect(page.getByLabel("Walking Movement Points")).toBeVisible();
    await page.goto("classic-battletech/mech-creator/step3");
    await expect(page.getByLabel("Heat Sink Technology")).toBeHidden();
    await page.goto("classic-battletech/mech-creator/step4");
    await expect(page.getByLabel("Armor Type")).toBeHidden();
    await expect(page.getByLabel("Armor Weight")).toBeVisible();
});
