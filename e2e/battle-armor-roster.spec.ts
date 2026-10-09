import { expect, test, type Page } from "@playwright/test";

const watchErrors = (page: Page): string[] => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });
    return errors;
};

// The TechManual's Purifier (TM pp. 162-171): Inner Sphere medium, 3 Jumping MP, a battle claw, 6 points of mimetic
// armor and an ER small laser in a modular mount.
const buildPurifier = async (page: Page, name: string): Promise<void> => {
    await page.goto("classic-battletech/battle-armor-creator");
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.goto("classic-battletech/battle-armor-creator/chassis");
    await page.getByLabel("Name (e.g.").fill(name);
    await page.getByTestId("ba-weight-class").selectOption("medium");
    await page.getByTestId("ba-motive").selectOption("jump");
    await page.getByTestId("ba-motive-mp").selectOption("3");
    await page.getByTestId("ba-manipulator-ra").selectOption("battle-claw");
    await page.getByTestId("ba-armor").selectOption("ba-mimetic");
    await page.getByTestId("ba-armor-points").selectOption("6");
    await page.goto("classic-battletech/battle-armor-creator/equipment");
    await page.getByTestId("ba-add-location").selectOption("la");
    await page.getByTestId("ba-add-is-er-small-laser").click();
    await page.getByTestId("ba-item-modular").check();
};

test("a suit gets an alternate loadout, an era and an Alpha Strike card", async ({ page }) => {
    const errors = watchErrors(page);
    await buildPurifier(page, "Purifier");

    // A second loadout puts a support PPC in the modular mount: 100 kg lighter than the laser.
    await page.getByRole("link", { name: /Next Step/ }).click();
    await expect(page.getByRole("heading", { name: "Alternate Loadouts" })).toBeVisible();
    await page.getByTestId("ba-add-loadout").click();
    await page.getByLabel("Loadout name").fill("PPC");
    await page.getByTestId("ba-loadout-weapon").selectOption("is-support-ppc");
    await expect(page.getByTestId("ba-loadout-values")).toContainText("Weight: 900 of 1000 kg");
    await expect(page.getByTestId("ba-loadout-issues")).toHaveCount(0);

    // The summary lists the loadout and converts the base design as the Master Unit List publishes the
    // Purifier Adaptive [Laser] (Sqd4): 6"j, 2/2/0, Armor 1, Structure 2, MAS, 19 points.
    await page.getByRole("link", { name: /Summary/ }).last().click();
    await expect(page.getByTestId("ba-legal")).toBeVisible();
    await expect(page.getByTestId("ba-loadout-summary")).toContainText("Support PPC (modular mount), Left Arm");
    const card = page.getByTestId("ba-alpha-strike");
    await expect(card).toContainText("Move: 6\"j");
    await expect(card).toContainText("Damage (S/M/L): 2/2/0");
    await expect(card).toContainText("Armor: 1");
    await expect(card).toContainText("Specials: AM, CAR4, MAS, MEC");
    await expect(card).toContainText("Point Value: 19");

    // One card and one record sheet for the base design and one for the loadout.
    await page.getByRole("link", { name: "View Alpha Strike Card" }).click();
    await expect(page.getByTestId("ba-as-card")).toHaveCount(2);
    await page.goto("classic-battletech/battle-armor-creator/record-sheet");
    await expect(page.getByRole("heading", { name: "Purifier [PPC]" })).toBeVisible();

    // An earlier era has no mimetic armor, and the creator says so (IO:AE pp. 45-47).
    await page.goto("classic-battletech/battle-armor-creator/chassis");
    await page.getByTestId("ba-era").selectOption("late-sw-rn");
    await expect(page.getByTestId("ba-issues")).toContainText("Mimetic armor is not available to Inner Sphere battle armor");
    await page.getByTestId("ba-era").selectOption("jihad");
    await expect(page.getByTestId("ba-issues")).toHaveCount(0);

    expect(errors).toEqual([]);
});

test("Tactical Operations equipment appears at its rules level", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto("classic-battletech/battle-armor-creator");
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.goto("classic-battletech/battle-armor-creator/chassis");
    await page.getByTestId("ba-weight-class").selectOption("heavy");
    await page.getByTestId("ba-ground-mp").selectOption("2");
    await page.getByLabel("Rules Level:").selectOption({ label: "Standard" });
    await page.goto("classic-battletech/battle-armor-creator/equipment");
    await expect(page.getByTestId("ba-add-is-medium-laser")).toBeVisible();
    await expect(page.getByTestId("ba-add-is-heavy-flamer")).toHaveCount(0);

    await page.goto("classic-battletech/battle-armor-creator/chassis");
    await page.getByLabel("Rules Level:").selectOption({ label: "Advanced" });
    await page.goto("classic-battletech/battle-armor-creator/equipment");
    await expect(page.getByTestId("ba-add-is-heavy-flamer")).toBeVisible();
    await expect(page.getByTestId("ba-add-is-angel-ecm")).toHaveCount(0);

    // A medium laser in a detachable weapon pack: 375 kg and one slot (TO:AUE pp. 98-99).
    await page.getByTestId("ba-add-location").selectOption("ra");
    await page.getByTestId("ba-add-is-medium-laser").click();
    await expect(page.getByTestId("ba-mounted-item")).toContainText("500 kg");
    await page.getByTestId("ba-item-dwp").check();
    await expect(page.getByTestId("ba-mounted-item")).toContainText("375 kg");
    await expect(page.getByTestId("ba-issues")).toHaveCount(0);

    expect(errors).toEqual([]);
});

test("a battle armor squad joins the roster, takes damage in play and prints", async ({ page }) => {
    const errors = watchErrors(page);
    await buildPurifier(page, "Purifier Squad");
    await page.goto("classic-battletech/battle-armor-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();

    await page.goto("classic-battletech/roster");
    await page.getByLabel("Saved battle armor to add").first().selectOption({ index: 1 });
    await page.getByRole("button", { name: "Add Battle Armor" }).first().click();
    await expect(page.getByText("This Squad is at Full Strength")).toBeVisible();
    await page.getByLabel("Battle armor gunnery skill").first().selectOption("3");

    await page.getByTitle("Click here to go into 'Play Mode'").click();
    await page.locator(".mech-selector").getByTitle("Select Purifier Squad").click();
    const panel = page.getByTestId("battle-armor-play");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Medium battle armor, 4 troopers");
    await expect(panel.getByTestId("battle-armor-play-movement")).toHaveText("Ground 1 / Jump 3");
    await expect(panel).toContainText("Gunnery: 3");
    await expect(panel.getByTestId("battle-armor-play-weapons")).toContainText("ER Small Laser");
    // Four troopers active: Leg attack at Anti-'Mech 5 + 0, Swarm at 5 + 2 (TW p. 221).
    await expect(panel.getByTestId("battle-armor-play-antimech")).toContainText("Anti-'Mech Skill 5 +0 = 5");
    await expect(panel.getByTestId("battle-armor-play-antimech")).toContainText("Anti-'Mech Skill 5 +2 = 7");

    // A Purifier can ride as mechanized battle armor; this force has nothing for it to ride.
    await expect(panel.getByTestId("battle-armor-play-transport")).toContainText("Add a 'Mech or vehicle to the force for the squad to ride.");

    // An area-effect attack of 3 points marks every trooper; each has 6 armor and the trooper.
    await panel.getByTestId("battle-armor-play-damage").fill("3");
    await panel.getByLabel(/Area-effect weapon/).check();
    await panel.getByTestId("battle-armor-play-apply").click();
    await expect(panel.getByTestId("battle-armor-play-log")).toContainText("Trooper 1 takes 3: 4 left");
    await expect(panel.getByTestId("battle-armor-play-log")).toContainText("Trooper 4 takes 3: 4 left");

    // Marking by hand: the last circle of trooper 2 destroys them, which moves the Anti-'Mech numbers.
    await panel.getByRole("button", { name: "Trooper 2 trooper", exact: true }).click();
    await expect(panel.getByTestId("battle-armor-play-trooper").nth(1)).toContainText("destroyed");
    await expect(panel.getByTestId("battle-armor-play-antimech")).toContainText("Anti-'Mech Skill 5 +2 = 7");
    await expect(panel.getByTestId("battle-armor-play-antimech")).toContainText("Anti-'Mech Skill 5 +5 = 10");

    await page.goto("classic-battletech/roster");
    await expect(page.getByText("This Squad is Damaged")).toBeVisible();
    await page.reload();
    await expect(page.getByText("This Squad is Damaged")).toBeVisible();

    await page.goto("classic-battletech/roster/print");
    await expect(page.getByRole("heading", { name: "Purifier Squad" })).toBeVisible();
    await expect(page.getByTestId("battle-armor-sheet-troopers")).toContainText("destroyed");

    expect(errors).toEqual([]);
});

test("a saved suit is offered to an Alpha Strike force, and a MegaMek file loads into the creator", async ({ page }) => {
    const errors = watchErrors(page);
    await buildPurifier(page, "Card Purifier");
    await page.goto("classic-battletech/battle-armor-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();

    await page.goto("alpha-strike-roster");
    await page.getByRole("button", { name: /Add Units/ }).first().click();
    await expect(page.getByText("Your Created Battle Armor")).toBeVisible();
    const saves = page.getByTestId("as-battle-armor-saves");
    await expect(saves).toContainText("Card Purifier");
    await expect(saves).toContainText("Type: BA");
    await expect(saves).toContainText("Move: 6\"j");
    await expect(saves).toContainText("Damage: 2/2/0");
    await page.getByTitle("Add this squad to your current group").first().click();
    await expect(page.getByText("Card Purifier").first()).toBeVisible();

    // A file in the layout MegaMek's battle armor files use, written for this test.
    const blk = [
        "<UnitType>", "BattleArmor", "</UnitType>",
        "<Name>", "Imported Elemental", "</Name>",
        "<Model>", "[Laser]", "</Model>",
        "<year>", "2868", "</year>",
        "<type>", "Clan Level 2", "</type>",
        "<motion_type>", "Jump", "</motion_type>",
        "<cruiseMP>", "1", "</cruiseMP>",
        "<armor_type>", "28", "</armor_type>",
        "<Point Equipment>", "CLBASmall Laser:RA", "CLBASRM2:Body", "BA-SRM2 Ammo:Body:Shots2#", "BABattleClaw:LA", "MysteryDevice:Body", "</Point Equipment>",
        "<chassis>", "biped", "</chassis>",
        "<jumpingMP>", "3", "</jumpingMP>",
        "<armor>", "10", "</armor>",
        "<Trooper Count>", "5", "</Trooper Count>",
        "<weightclass>", "2", "</weightclass>",
    ].join("\n");
    await page.goto("classic-battletech/battle-armor-creator");
    await page.getByTestId("ba-import-file").setInputFiles({ name: "Imported Elemental.blk", mimeType: "text/plain", buffer: Buffer.from(blk) });
    const result = page.getByTestId("ba-import-result");
    await expect(result).toContainText("loaded into the editor");
    await expect(result).toContainText("'MysteryDevice' is not in the battle armor equipment tables: left off.");

    await page.goto("classic-battletech/battle-armor-creator/summary");
    await expect(page.getByText("Summary: Imported Elemental [Laser]")).toBeVisible();
    // The Master Unit List's Elemental [Laser] (Sqd5): 447 Battle Value, 6"j, 2/1/0, 19 points.
    await expect(page.getByTestId("ba-summary")).toContainText("Tech: Clan");
    await expect(page.getByTestId("ba-summary")).toContainText("Battle Value: 447");
    await expect(page.getByTestId("ba-alpha-strike")).toContainText("Damage (S/M/L): 2/1/0");
    await expect(page.getByTestId("ba-alpha-strike")).toContainText("Point Value: 19");

    // Something that is not a unit file is refused and leaves the editor alone.
    await page.goto("classic-battletech/battle-armor-creator");
    await page.getByTestId("ba-import-file").setInputFiles({ name: "notes.blk", mimeType: "text/plain", buffer: Buffer.from("hello") });
    await expect(page.getByTestId("ba-import-result")).toContainText("not loaded");

    expect(errors).toEqual([]);
});

test("a mixed-technology suit takes Clan equipment, and one trooper can carry an item of their own", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto("classic-battletech/battle-armor-creator");
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.goto("classic-battletech/battle-armor-creator/chassis");
    await page.getByLabel("Rules Level:").selectOption({ label: "Standard" });
    await expect(page.getByTestId("ba-mixed-tech")).toHaveCount(0);
    await page.getByLabel("Rules Level:").selectOption({ label: "Advanced" });
    await page.getByTestId("ba-mixed-tech").check();
    // Clan-made standard armor on the Inner Sphere chassis: 25 kg a point in place of 50.
    await page.getByTestId("ba-armor").selectOption("clan:ba-standard");
    await page.getByTestId("ba-armor-points").selectOption("4");

    await page.goto("classic-battletech/battle-armor-creator/equipment");
    await expect(page.getByRole("heading", { name: /Inner Sphere and Clan \(mixed technology\)/ })).toBeVisible();
    await page.getByTestId("ba-add-location").selectOption("ra");
    await page.getByTestId("ba-add-clan-er-small-laser").click();
    await expect(page.getByTestId("ba-mounted-item")).toContainText("Clan ER Small Laser");
    await page.getByTestId("ba-item-trooper").selectOption("2");
    await expect(page.getByTestId("ba-item-trooper")).toHaveValue("2");

    // A mine dispenser is valued by the mines it carries (TO:AUE pp. 195, 197).
    await page.getByTestId("ba-add-location").selectOption("body");
    await page.getByTestId("ba-add-is-mine-dispenser").click();
    await page.getByTestId("ba-item-mine").selectOption("inferno");
    await expect(page.getByTestId("ba-item-mine")).toHaveValue("inferno");
    await expect(page.getByTestId("ba-issues")).toHaveCount(0);

    await page.getByRole("link", { name: /Summary/ }).last().click();
    await expect(page.getByTestId("ba-legal")).toBeVisible();
    await expect(page.getByText("Mixed (Inner Sphere chassis)")).toBeVisible();
    await expect(page.getByText(/Average of the 4 troopers' suits/)).toBeVisible();

    // Turning mixed technology off brings the laser back to the Inner Sphere table.
    await page.goto("classic-battletech/battle-armor-creator/chassis");
    await page.getByTestId("ba-mixed-tech").uncheck();
    await page.goto("classic-battletech/battle-armor-creator/equipment");
    await expect(page.getByTestId("ba-mounted-item").first()).toContainText("ER Small Laser");
    await expect(page.getByTestId("ba-mounted-item").first()).not.toContainText("Clan");

    expect(errors).toEqual([]);
});

test("a vehicle carrying a squad is told what it may not do", async ({ page }) => {
    const errors = watchErrors(page);
    await buildPurifier(page, "Purifier Riders");
    await page.goto("classic-battletech/battle-armor-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();
    await page.goto("classic-battletech/vehicle-creator/step1");
    await page.getByLabel("Motive Type").selectOption("tracked");
    await page.goto("classic-battletech/vehicle-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();

    await page.goto("classic-battletech/roster");
    await page.getByLabel("Saved battle armor to add").first().selectOption({ index: 1 });
    await page.getByRole("button", { name: "Add Battle Armor" }).first().click();
    await page.getByLabel("Saved vehicle to add").first().selectOption({ index: 1 });
    await page.getByRole("button", { name: "Add Vehicle" }).first().click();

    await page.getByTitle("Click here to go into 'Play Mode'").click();
    await page.locator(".mech-selector").getByTitle("Select Purifier Riders").click();
    const panel = page.getByTestId("battle-armor-play");
    await panel.getByTestId("battle-armor-play-carrier").selectOption({ index: 1 });
    await expect(panel.getByTestId("battle-armor-play-transport")).toContainText("Right Side");

    // The vehicle's own panel says who rides it and where, and what that stops (TW pp. 226-227).
    await page.locator(".mech-selector").getByTitle(/^Select (?!Purifier)/).first().click();
    const notes = page.getByTestId("vehicle-carrier-notes");
    await expect(notes).toContainText("Carrying Purifier Riders (Right Side, Left Side).");
    await expect(notes).toContainText("turret weapons may");
    await expect(notes).toContainText("no VTOL, WiGE or Jumping MP");

    expect(errors).toEqual([]);
});
