import { expect, test, type Page } from "@playwright/test";

// Every unit builder beside the 'Mech and vehicle creators is reachable from the Classic BattleTech page and the
// menu, and turns a new design into a record sheet and, where the unit has one, an Alpha Strike card.

const watchErrors = (page: Page): string[] => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });
    return errors;
};

interface IBuilder {
    name: string;
    link: string;
    path: string;
    saved: string;
    /** A line of the record sheet that names the unit type. */
    sheet: RegExp;
    /** Whether the unit has an Alpha Strike card page. */
    card: boolean;
    /** The test id of the card where it is not the standard card drawing. */
    cardTestId?: string;
    /** Set up before the sheets are opened. */
    prepare?: (page: Page) => Promise<void>;
}

const builders: IBuilder[] = [
    { name: "infantry", link: "Infantry Creator", path: "infantry-creator", saved: "Your Saved Platoons", sheet: /Infantry/, card: true },
    { name: "battle armor", link: "Battle Armor Creator", path: "battle-armor-creator", saved: "Your Saved Battle Armor", sheet: /Battle Armor/, card: true },
    { name: "ProtoMechs", link: "ProtoMech Creator", path: "protomech-creator", saved: "Your Saved ProtoMechs", sheet: /ProtoMech/, card: true },
    { name: "aerospace fighters", link: "Fighter Creator", path: "fighter-creator", saved: "Your Saved Fighters", sheet: /Aerospace Fighter/, card: true },
    {
        name: "conventional fighters", link: "Fighter Creator", path: "fighter-creator", saved: "Your Saved Fighters", sheet: /Conventional Fighter/, card: true,
        prepare: async (page) => {
            await page.goto("classic-battletech/fighter-creator/chassis");
            await page.getByLabel("Fighter Type").selectOption("conventional");
        },
    },
    { name: "Small Craft", link: "Small Craft Creator", path: "small-craft-creator", saved: "Your Saved Small Craft", sheet: /Small Craft/, card: true, cardTestId: "small-craft-as-card" },
    { name: "buildings", link: "Building Creator", path: "building-creator", saved: "Your Saved Buildings", sheet: /Building|Structure/, card: false },
];

for (const builder of builders) {
    test(`${builder.name}: reachable, with a record sheet${builder.card ? " and an Alpha Strike card" : ""}`, async ({ page }) => {
        const errors = watchErrors(page);
        await page.goto("classic-battletech");
        await page.getByRole("link", { name: builder.link }).first().click();
        await expect(page).toHaveURL(new RegExp(`classic-battletech/${builder.path}`));
        await expect(page.getByText(builder.saved)).toBeVisible();
        await page.getByRole("button", { name: /Start Over/ }).click();
        if (builder.prepare) await builder.prepare(page);

        await page.goto(`classic-battletech/${builder.path}/summary`);
        await expect(page.getByRole("link", { name: /Record Sheet/ }).first()).toBeVisible();
        if (builder.card) await expect(page.getByRole("link", { name: /Alpha Strike Card/ }).first()).toBeVisible();

        await page.goto(`classic-battletech/${builder.path}/record-sheet`);
        await expect(page.locator("body")).toContainText(builder.sheet);
        await expect(page.locator("body")).not.toContainText("404");

        if (builder.card) {
            await page.goto(`classic-battletech/${builder.path}/print-as`);
            await expect(builder.cardTestId ? page.getByTestId(builder.cardTestId) : page.locator("svg").first()).toBeVisible();
        } else {
            // No card is made for this unit type: there is no such page.
            await page.goto(`classic-battletech/${builder.path}/print-as`);
            await expect(page.locator("body")).toContainText(/404|not found/i);
        }
        expect(errors).toEqual([]);
    });
}

test("a roster group takes every builder's saved designs", async ({ page }) => {
    // With nothing saved, each table says where its designs come from.
    await page.goto("classic-battletech/roster");
    for (const creator of ["Fighter", "Small Craft", "Infantry", "Battle Armor", "ProtoMech", "Building"]) {
        await expect(page.getByText(`in the ${creator} Creator to add them to this group.`).first()).toBeVisible();
    }
});
