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
