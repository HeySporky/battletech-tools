import { expect, test } from "@playwright/test";

// The Infantry Creator builds a conventional infantry platoon in the TechManual's steps (pp. 144-155), saves it and
// prints a record sheet.
test("a motorized laser rifle platoon can be built, checked, saved and printed", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech");
    await page.getByRole("link", { name: "Infantry Creator" }).first().click();
    await expect(page.getByText("Your Saved Platoons")).toBeVisible();
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.getByRole("link", { name: /Start Building/ }).click();

    // TechManual's example: 4 squads of 7 motorized troopers with laser rifles (TM pp. 146-153).
    await page.getByLabel("Platoon Name").fill("Third Crucis Lancers");
    await page.getByLabel("Motive Type:").selectOption("motorized");
    await expect(page.getByTestId("infantry-size")).toContainText("Troopers: 28");
    await expect(page.getByTestId("infantry-size")).toContainText("Transport Weight: 5.5 tons");

    await page.getByRole("link", { name: /Next: Weapons/ }).click();
    await page.getByLabel("Primary Weapon:").selectOption("inf-laser-rifle");
    await expect(page.getByTestId("infantry-attack")).toContainText("Movement: 3 (Ground)");
    await expect(page.getByTestId("infantry-attack")).toContainText("Platoon Damage: 8");
    // Base Range 2: -2 in its own hex, out to +4 at 6 hexes.
    await expect(page.getByTestId("infantry-ranges").getByRole("cell")).toHaveText(["0", "1", "2", "3", "4", "5", "6", "-2", "0", "0", "+2", "+2", "+4", "+4"]);

    await page.getByRole("link", { name: /Next: Summary/ }).click();
    await expect(page.getByText("This platoon is legal under the TechManual construction rules.")).toBeVisible();
    await expect(page.getByText("Summary: Third Crucis Lancers")).toBeVisible();
    await expect(page.getByTestId("infantry-summary")).toContainText("Cost: 3,167,838 C-bills");

    await page.getByRole("link", { name: "View Record Sheet" }).click();
    await expect(page.getByRole("heading", { name: "Third Crucis Lancers" })).toBeVisible();
    await expect(page.getByTestId("infantry-sheet-line")).toHaveCount(1);

    await page.goto("classic-battletech/infantry-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();
    await expect(page.getByRole("cell", { name: "Third Crucis Lancers", exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("cell", { name: "Third Crucis Lancers", exact: true })).toBeVisible();

    expect(errors).toEqual([]);
});

// An oversized platoon with support weapons: the Marian Hegemony's 100 foot troopers with 2 support machine guns
// per squad (TM pp. 147-153).
test("an oversized foot platoon splits into sub-platoons and trades mobility for support weapons", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));

    await page.goto("classic-battletech/infantry-creator");
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.goto("classic-battletech/infantry-creator/platoon");
    await page.getByLabel("Affiliation:").selectOption("marian-hegemony");
    await expect(page.getByTestId("infantry-size")).toContainText("Troopers: 100");
    await expect(page.getByTestId("infantry-size")).toContainText("Sub-Platoons: 4 of 25, 25, 25, 25");

    await page.getByRole("link", { name: /Next: Weapons/ }).click();
    await page.getByLabel("Secondary Weapon:").selectOption("inf-machine-gun-support");
    await page.getByLabel("Secondary Weapons per Squad:").selectOption("2");
    await expect(page.getByTestId("infantry-attack")).toContainText("Movement: 1 (Ground), Move or Shoot");
    await expect(page.getByTestId("infantry-attack")).toContainText("Platoon Damage: 60");
    await expect(page.getByText("Heavy burst: -1 to-hit in its own hex")).toBeVisible();
    await expect(page.getByTestId("infantry-weapons").getByRole("row")).toHaveCount(3);

    // A mechanized platoon cannot keep a melee weapon, and Clan weapons need a Clan platoon.
    await page.goto("classic-battletech/infantry-creator/platoon");
    await page.getByLabel("Technology Base:").selectOption("clan");
    await page.getByLabel("Motive Type:").selectOption("mech-tracked");
    await expect(page.getByTestId("infantry-size")).toContainText("Troopers: 20");
    await expect(page.getByLabel(/Anti-'Mech Infantry kits/)).toHaveCount(0);
    await page.getByRole("link", { name: /Next: Weapons/ }).click();
    await page.getByLabel("Primary Weapon:").selectOption("inf-gauss-submachine-gun");
    await page.getByLabel("Secondary Weapon:").selectOption("inf-autocannon-bearhunter-super-heavy");
    // The machine guns' 2 per squad carries over to the new weapon.
    await expect(page.getByTestId("infantry-attack")).toContainText("Platoon Damage: 24");
    await page.getByLabel("Secondary Weapons per Squad:").selectOption("1");
    await expect(page.getByTestId("infantry-attack")).toContainText("Platoon Damage: 17");

    expect(errors).toEqual([]);
});

// Infantry armor is an Advanced rule (Tactical Operations: Advanced Units & Equipment pp. 129-130) and platoons are
// raised in an era.
test("infantry armor is offered at the Advanced rules level and the era limits the weapons", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));

    await page.goto("classic-battletech/infantry-creator");
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.goto("classic-battletech/infantry-creator/platoon");
    await page.getByLabel("Rules Level:").selectOption("2");
    await expect(page.getByLabel("Infantry Armor:")).toHaveCount(0);
    await page.getByLabel("Rules Level:").selectOption("3");
    await page.getByLabel("Infantry Armor:").selectOption("inf-armor-ballistic-plate-standard");
    await page.getByLabel("Motive Type:").selectOption("motorized");

    await page.getByLabel("Era:").selectOption("early-sw");
    await page.getByRole("link", { name: /Next: Weapons/ }).click();
    // Encumbering armor takes 1 MP off the motorized platoon's 3.
    await expect(page.getByTestId("infantry-attack")).toContainText("Movement: 2 (Ground)");
    // The Stetta auto-pistol dates from 3010 and is not made in the early Succession Wars.
    await expect(page.getByLabel("Primary Weapon:").locator("option[value='inf-auto-pistol-stetta']")).toHaveCount(0);
    await expect(page.getByLabel("Primary Weapon:").locator("option[value='inf-auto-rifle']")).toHaveCount(1);

    await page.getByRole("link", { name: /Next: Summary/ }).click();
    await expect(page.getByText("Infantry Armor: Ballistic Plate, Standard (damage divisor 2)")).toBeVisible();
    await expect(page.getByText(/Encumbering armor: -1 MP/)).toBeVisible();
    await page.getByRole("link", { name: "View Record Sheet" }).click();
    await expect(page.getByText(/Damage Divisor 2E/)).toBeVisible();

    expect(errors).toEqual([]);
});
