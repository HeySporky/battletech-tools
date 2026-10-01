import { expect, test } from "@playwright/test";
import path from "node:path";

test("imports two .ssw files, saves one with its placeholder, and it survives a reload", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("classic-battletech/mech-creator/ssw-file-import");
    await page.getByLabel("Choose .ssw files").setInputFiles([
        path.join(__dirname, "fixtures/griffin-widget.ssw"),
        path.join(__dirname, "fixtures/griffin-widget-b.ssw"),
    ]);
    await expect(page.getByRole("row", { name: /griffin-widget\.ssw/ })).toContainText("Placeholders");
    await expect(page.getByRole("row", { name: /griffin-widget-b\.ssw/ })).toContainText("Placeholders");

    await page.getByRole("row", { name: /griffin-widget\.ssw/ }).getByRole("button", { name: "Details" }).click();
    await expect(page.getByTestId("ssw-import-detail")).toContainText("Custom content drafts (placeholders, saved in this browser): Widget Cannon");

    await page.getByLabel("Select griffin-widget-b.ssw").uncheck();
    await page.getByRole("button", { name: "Save selected to my 'Mechs" }).click();
    await expect(page.getByText("1 design added")).toBeVisible();

    // After a reload the draft is registered again at startup, so the saved Griffin still carries its placeholder.
    await page.reload();
    await page.goto("classic-battletech/mech-creator");
    const row = page.getByRole("row", { name: /Griffin/ });
    await expect(row).toBeVisible();
    await row.getByTitle(/Click here to load/).click();
    await page.goto("classic-battletech/mech-creator/summary");
    await expect(page.getByText("Widget Cannon").first()).toBeVisible();
    expect(errors).toEqual([]);
});
