import { expect, test } from "@playwright/test";

// The Small Craft Creator builds a Small Craft in the TechManual's steps (pp. 180-197), saves it and prints a
// record sheet and an Alpha Strike card.
test("the TechManual's Astrolux can be built, checked, saved and printed", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech");
    await page.getByRole("link", { name: "Small Craft Creator" }).first().click();
    await expect(page.getByText("Your Saved Small Craft")).toBeVisible();
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.getByRole("link", { name: /Start Building/ }).click();

    // Bruce's Astrolux: 200 tons, aerodyne, Safe Thrust 5, 20 tons of fuel, Structural Integrity 8 (TM pp. 184-188).
    await page.getByLabel("Name (e.g.").fill("Astrolux");
    await page.getByTestId("sc-tonnage").selectOption("200");
    await page.getByTestId("sc-thrust").selectOption("5");
    await expect(page.getByText(/Engine.*: 65 tons/)).toBeVisible();
    await page.getByLabel("Fuel (tons)").fill("20");
    await expect(page.getByText(/Fuel Points.*: 1600/)).toBeVisible();
    await expect(page.getByText(/Days at 1 G.*: 10.87/)).toBeVisible();
    await page.getByLabel(/Structural Integrity \(8 to 240\)/).selectOption("8");
    await expect(page.getByText(/Most Armor.*: 36 tons/)).toBeVisible();

    // 5 tons of standard armor: 80 points, and 32 free from the structure (TM p. 192).
    await page.getByRole("link", { name: /Next: Armor/ }).click();
    await page.getByLabel(/Armor \(tons/).fill("5");
    await expect(page.getByTestId("sc-armor-unallocated")).toHaveText("112");
    await page.getByTestId("sc-armor-spread").click();
    await expect(page.getByTestId("sc-armor-unallocated")).toHaveText("0");
    await expect(page.getByText(/Heat Sinks.*: 1 /)).toBeVisible();

    // Three crew in crew quarters, seven passengers in first class, and the rest cargo (TM p. 196).
    await page.getByRole("link", { name: /Crew, Quarters and Bays/ }).last().click();
    await page.getByLabel("Passengers").selectOption("7");
    await expect(page.getByTestId("sc-issues")).toContainText("Quarters for 3 of 10");
    await page.getByLabel(/Officer \/ 1st Class/).selectOption("7");
    await expect(page.getByTestId("sc-issues")).toHaveCount(0);
    await expect(page.getByTestId("sc-remaining")).toHaveText("9");
    await page.getByTestId("sc-fill-cargo").click();
    await expect(page.getByTestId("sc-weight")).toHaveText("200");
    await expect(page.getByTestId("sc-bays")).toContainText("Cargo, Standard");

    await page.getByRole("link", { name: /Summary/ }).last().click();
    await expect(page.getByTestId("sc-legal")).toBeVisible();
    await expect(page.getByText("Summary: Astrolux")).toBeVisible();
    // 112 armor x 2.5 + Structural Integrity 8 x 2; TM p.283 structure costs x 5 for 200 tons.
    await expect(page.getByTestId("sc-summary")).toContainText("Battle Value: 296");
    await expect(page.getByTestId("sc-summary")).toContainText("7,925,000 C-bills");
    // The Master Unit List's Astrolux card: Thrust 5a, Armor 4, Structure 4, Threshold 1.
    await expect(page.getByTestId("small-craft-as-line")).toContainText("THR: 5a");
    await expect(page.getByTestId("small-craft-as-line")).toContainText("TH: 1");
    await expect(page.getByTestId("small-craft-as-card")).toContainText("A (4)");
    await expect(page.getByTestId("small-craft-as-card")).toContainText("S (4)");

    await page.getByRole("link", { name: "View Alpha Strike Card" }).click();
    await expect(page.getByTestId("sc-as-card")).toHaveCount(1);
    await expect(page.getByTestId("small-craft-as-arcs")).toContainText("Nose (STD)");
    await page.goto("classic-battletech/small-craft-creator/summary");

    await page.getByRole("link", { name: "View Record Sheet" }).click();
    await expect(page.getByRole("heading", { name: "Astrolux" }).first()).toBeVisible();
    await expect(page.getByTestId("small-craft-sheet-data")).toContainText("Aerodyne Small Craft");
    await expect(page.getByTestId("small-craft-sheet-crew")).toContainText("Passengers: 7");

    await page.goto("classic-battletech/small-craft-creator");
    await page.getByRole("button", { name: /Save as New/ }).click();
    await expect(page.getByRole("cell", { name: "Astrolux", exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("cell", { name: "Astrolux", exact: true })).toBeVisible();

    expect(errors).toEqual([]);
});

// An armed spheroid craft: weapons go in firing arcs, side arcs must match, and gunners join the crew.
test("weapons are mounted by firing arc and checked", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("classic-battletech/small-craft-creator");
    await page.getByRole("button", { name: /Start Over/ }).click();
    await page.goto("classic-battletech/small-craft-creator/chassis");
    await page.getByLabel("Shape").selectOption("spheroid");
    await expect(page.getByText(/SI x tonnage \/ 500/)).toBeVisible();

    await page.goto("classic-battletech/small-craft-creator/equipment");
    await expect(page.getByText("Nothing installed yet.")).toBeVisible();
    await expect(page.getByTestId("sc-arcs")).toContainText("Fore-Left");
    await page.getByPlaceholder("Filter Equipment").fill("Medium Laser");
    await page.getByRole("row", { name: /^Medium Laser Energy Weapons/ }).getByRole("button", { name: "Add" }).click();
    await expect(page.getByTestId("sc-issues")).toContainText("no firing arc yet");
    await page.getByLabel(/Firing arc for/).first().selectOption("left");
    await expect(page.getByTestId("sc-issues")).toContainText("Fore-Left and Fore-Right must carry the same weapons");
    await page.getByLabel(/Firing arc for/).first().selectOption("nose");
    await expect(page.getByTestId("sc-issues")).not.toContainText("must carry the same weapons");
    // The laser needs a gunner, and the gunner needs quarters (TM pp. 189, 195).
    await expect(page.getByText(/Gunners needed.*: 1/)).toBeVisible();
    await expect(page.getByTestId("sc-issues")).toContainText("Quarters for 3 of 4");
    await page.goto("classic-battletech/small-craft-creator/crew");
    await page.getByLabel(/^Crew \(7 tons each\)/).selectOption("4");
    await expect(page.getByTestId("sc-issues")).toHaveCount(0);

    expect(errors).toEqual([]);
});
