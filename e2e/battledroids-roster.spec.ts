import { expect, test } from "@playwright/test";

// The tanks, jeeps and infantry of Expert Battledroids (Battledroids, FASA 1984, pp.22-23) are fixed designs: they
// are added to a roster group from the rulebook's list, take hits in play mode and print with their damage.
test("a Battledroids tank joins the roster, takes hits in play and prints", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech/roster");
    await page.getByLabel("Battledroids unit to add").first().selectOption("vde-3t-vedette");
    await page.getByRole("button", { name: "Add Battledroids Unit" }).first().click();
    await page.getByLabel("Battledroids unit to add").first().selectOption("infantry-srm");
    await page.getByRole("button", { name: "Add Battledroids Unit" }).first().click();
    const table = page.getByTestId("battledroids-group-table").first();
    await expect(table).toContainText("VDE-3T Vedette");
    await expect(table).toContainText("4 (3 firing)");
    await expect(table).toContainText("Infantry Squad (SRM)");
    await table.getByLabel("Battledroids unit gunnery skill").first().selectOption("3");

    await page.getByTitle("Click here to go into 'Play Mode'").click();
    await page.locator(".mech-selector").getByTitle("Select VDE-3T Vedette").click();
    const panel = page.getByTestId("battledroids-play");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Gunnery: 3");
    await expect(panel.getByTestId("battledroids-play-mp")).toHaveText("4");
    await panel.getByLabel(/Intends to fire this turn/).check();
    await expect(panel.getByTestId("battledroids-play-mp")).toHaveText("3");
    // Auto cannon 40 shots, machine gun 200 (BD p.22).
    await expect(panel.getByTestId("battledroids-play-weapons")).toContainText("40 of 40");
    await panel.getByRole("button", { name: /^Fire Auto/ }).click();
    await expect(panel.getByTestId("battledroids-play-weapons")).toContainText("39 of 40");

    // Tank Hit Locations: a 7 from the front is the front armor, 20 points; a 4 from a side is the tracks.
    await panel.getByLabel(/Hit Location Roll/).fill("7");
    await panel.getByLabel("Damage:").fill("8");
    await panel.getByRole("button", { name: "Apply Hit" }).click();
    await expect(panel.getByTestId("battledroids-play-log")).toContainText("front armor. 8 points: 20 to 12 of 20");
    await panel.getByLabel("Attack Comes From:").selectOption("left");
    await panel.getByLabel(/Hit Location Roll/).fill("4");
    await panel.getByRole("button", { name: "Apply Hit" }).click();
    await expect(panel.getByTestId("battledroids-play-log")).toContainText("tracks. The tank cannot move");
    await expect(panel.getByTestId("battledroids-play-mp")).toHaveText("0");
    await expect(panel.getByTestId("battledroids-rules-reference")).toContainText("Movement Modifiers");

    // Basic Battledroids: a Warhammer firing at a Crusader 7 hexes away is at medium range, 6 to hit; its Damage
    // Value of 16 against an Armor Value of 10 needs a 4 (BD pp.5-6).
    const basic = panel.getByTestId("battledroids-basic-game");
    await basic.locator("summary").click();
    await expect(basic.getByTestId("battledroids-basic-result")).toContainText("To-Hit Number: 6");
    await expect(basic.getByTestId("battledroids-basic-result")).toContainText("Damage Number: 4");
    await basic.getByLabel("Range in Hexes:").fill("15");
    await expect(basic.getByTestId("battledroids-basic-result")).toContainText("Range: long");
    await basic.getByRole("button", { name: "Roll the Shot" }).click();
    await expect(basic.getByTestId("battledroids-basic-log")).toContainText("To-hit roll");

    // One point kills an infantry unit; the rest carries over.
    await page.locator(".mech-selector").getByTitle("Select Infantry Squad (SRM)").click();
    const squad = page.getByTestId("battledroids-play");
    await squad.getByLabel("Damage:").fill("3");
    await squad.getByRole("button", { name: "Apply Hit" }).click();
    await expect(squad.getByTestId("battledroids-play-log")).toContainText("2 points are left over for another infantry unit");
    await expect(squad).toContainText("DESTROYED");

    await page.goto("classic-battletech/roster");
    await expect(page.getByText("This Unit is Damaged")).toBeVisible();
    await expect(page.getByText("This Unit is Destroyed")).toBeVisible();

    await page.goto("classic-battletech/roster/print");
    const sheet = page.getByTestId("battledroids-unit-record-sheet").first();
    await expect(sheet.getByRole("heading", { name: "VDE-3T Vedette" })).toBeVisible();
    await expect(sheet).toContainText("Hit: the tank cannot move");
    await expect(sheet).toContainText("39 of 40");

    expect(errors).toEqual([]);
});

// A 'Mech built under Battledroids brings that rulebook's helpers into play mode: the Heat Scale, physical attack
// damage and Piloting Skill Rolls (BD pp.11-15).
test("a battledroid in play mode shows the Battledroids helpers", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));

    await page.goto("classic-battletech/mech-creator");
    await page.getByTitle("Click here to clear out your current 'mech and start over.").click();
    await page.goto("classic-battletech/mech-creator/step1");
    await page.getByLabel("Rules Edition").selectOption("battledroids");
    await page.getByLabel("Mech Tonnage").selectOption({ label: "70 (Heavy)" });
    await page.goto("classic-battletech/mech-creator");
    await page.getByTitle("Click here to save a a new 'mech row").click();

    await page.goto("classic-battletech/roster");
    await page.getByTitle("Click here to open the add 'mech dialog").first().click();
    await page.locator(".modal button.btn-xs.btn-primary").nth(1).click();
    await page.goto("classic-battletech/roster/play");
    const helper = page.getByTestId("battledroids-droid-helper");
    if (!(await helper.isVisible().catch(() => false))) {
        await page.locator(".mech-selector li button").first().click();
    }
    await helper.locator("summary").click();
    // A 70-ton droid punches for 7 and kicks for 14 (BD pp.11-12); a fall in its own hex does 7 (BD p.15).
    await expect(helper.getByTestId("battledroids-droid-physical")).toContainText("punch 7 (base 4), kick 14 (base 3)");
    await expect(helper.getByTestId("battledroids-droid-heat")).toContainText("Heat 0: no effect");
    await expect(helper.getByTestId("battledroids-droid-piloting")).toHaveText("5");
    await helper.getByLabel(/Gyro hit/).check();
    await expect(helper.getByTestId("battledroids-droid-piloting")).toHaveText("8");
    await expect(helper.getByTestId("battledroids-droid-fall")).toHaveText("7");
    await helper.getByRole("button", { name: "Roll", exact: true }).click();
    await expect(helper.getByTestId("battledroids-droid-log")).toContainText("Piloting Skill Roll");
    await expect(page.getByTestId("battledroids-rules-reference")).toBeVisible();

    expect(errors).toEqual([]);
});
