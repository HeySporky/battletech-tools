import { expect, test } from "@playwright/test";

// The ProtoMech Creator builds a ProtoMech in the TechManual's steps (pp. 80-89), saves it and prints a record sheet.
test("the TechManual's Delphyne-2 can be built, checked, saved and printed", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech");
    await page.getByRole("link", { name: "ProtoMech Creator" }).last().click();
    await expect(page.getByText("Your Saved ProtoMechs")).toBeVisible();
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.getByRole("link", { name: /Start Building/ }).click();

    // Lara's Delphyne-2: 9 tons, Walking MP 5, 5 jump jets, 40 points of armor, two ER micro lasers in the arms and
    // two SRM 3s in the torso with 10 shots each (TM pp. 81-89).
    await page.getByLabel("Name (e.g.").fill("Delphyne-2");
    await page.getByTestId("pm-tons").selectOption("9");
    await page.getByTestId("pm-walk").selectOption("5");
    await expect(page.getByTestId("pm-engine")).toContainText("Engine Rating 72, built as 75: 2000 kg");
    await page.getByTestId("pm-jump-type").selectOption("standard");
    await page.getByTestId("pm-jump-mp").selectOption("5");
    await page.getByTestId("pm-armor-max").click();
    await page.getByTestId("pm-armor-torso").selectOption("16");
    await expect(page.getByTestId("pm-remaining")).toHaveText("3100");

    await page.getByRole("link", { name: /Step 5/ }).last().click();
    await page.getByTestId("pm-add-location").selectOption("la");
    await page.getByTestId("pm-add-er-micro-laser").click();
    await page.getByTestId("pm-add-location").selectOption("ra");
    await page.getByTestId("pm-add-er-micro-laser").click();
    await page.getByTestId("pm-add-location").selectOption("torso");
    await page.getByTestId("pm-tubes-srm").selectOption("3");
    await page.getByTestId("pm-add-pm-srm").click();
    await page.getByTestId("pm-add-pm-srm").click();
    await expect(page.getByTestId("pm-issues")).toContainText("SRM 3 carries no ammunition");
    await page.getByTestId("pm-shots-2").fill("10");
    await page.getByTestId("pm-shots-3").fill("10");
    await expect(page.getByTestId("pm-weight")).toHaveText("9000");
    await expect(page.getByTestId("pm-issues")).toHaveCount(0);

    // A third torso item is one too many; taking it off mends that.
    await page.getByTestId("pm-add-clan-machine-gun").click();
    await expect(page.getByTestId("pm-issues")).toContainText("Torso: 3 items, over the limit of 2");
    await page.getByRole("button", { name: "Remove Machine Gun (Clan)" }).click();
    await expect(page.getByTestId("pm-issues")).toHaveCount(0);

    await page.getByRole("link", { name: /Summary/ }).last().click();
    await expect(page.getByTestId("pm-legal")).toBeVisible();
    await expect(page.getByText("Summary: Delphyne-2")).toBeVisible();
    // TM p.307: Battle Value 316. TM pp.279-285: (741,700 + 80,000) x 1.09.
    await expect(page.getByTestId("pm-summary")).toContainText("Battle Value: 316 (Point of 5: 1580)");
    await expect(page.getByTestId("pm-cost-log")).toContainText("895,653 C-bills");
    // The Master Unit List's Delphyne card: 10"j, 2/1/0, Armor 1, Structure 1, 13 points.
    const card = page.getByTestId("pm-alpha-strike");
    await expect(card).toContainText("Move: 10\"j");
    await expect(card).toContainText("Damage (S/M/L): 2/1/0");
    await expect(card).toContainText("Armor: 1");
    await expect(card).toContainText("Point Value: 13");
    await page.getByRole("link", { name: "View Alpha Strike Card" }).click();
    await expect(page.getByTestId("pm-as-card")).toHaveCount(1);
    await page.goto("classic-battletech/protomech-creator/summary");

    await page.getByRole("link", { name: "View Record Sheet" }).click();
    await expect(page.getByRole("heading", { name: "Delphyne-2" })).toBeVisible();
    await expect(page.getByTestId("protomech-sheet-unit-4")).toBeVisible();

    await page.goto("classic-battletech/protomech-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();
    await expect(page.getByRole("cell", { name: "Delphyne-2", exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("cell", { name: "Delphyne-2", exact: true })).toBeVisible();

    // The saved ProtoMech is offered to an Alpha Strike force.
    await page.goto("alpha-strike-roster");
    await page.getByRole("button", { name: /Add Units/ }).first().click();
    const offered = page.getByTestId("as-protomech-saves");
    await expect(offered).toContainText("Delphyne-2");
    await expect(offered).toContainText("Type: PM");
    await offered.getByTitle("Add this ProtoMech to your current group").click();

    expect(errors).toEqual([]);
});

test("Quad and Glider ProtoMechs are offered at the Advanced rules level", async ({ page }) => {
    await page.goto("classic-battletech/protomech-creator");
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.getByRole("link", { name: /Start Building/ }).click();
    await page.getByLabel("Rules Level:").selectOption({ label: "Advanced" });
    await page.getByTestId("pm-chassis").selectOption("glider");
    // A Glider is an Ultraheavy: the tonnage moves to 10, and jump jets and the booster are not offered.
    await expect(page.getByTestId("pm-tons")).toHaveValue("10");
    await expect(page.getByTestId("pm-jump-type")).toHaveCount(0);
    await expect(page.getByTestId("pm-status")).toContainText("WiGE");
    await page.getByTestId("pm-chassis").selectOption("quad");
    await expect(page.getByTestId("pm-armor-la")).toHaveCount(0);
    await expect(page.getByTestId("pm-status")).toContainText("Torso 0/6 (0/8000 kg)");
});
