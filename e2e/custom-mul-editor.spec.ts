import { expect, test } from "@playwright/test";

// The Custom MUL Editor saves entries in this browser. Its pull-request path, which takes a GitHub token in the
// page, is switched off (CONST_CUSTOM_MUL_SUBMISSION_ENABLED) until it has had a security review.
test("the Custom MUL Editor offers local saves only while submission is switched off", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.goto("custom-mul-editor");
    await expect(page.getByText("switched off for now")).toBeVisible();
    await expect(page.getByRole("button", { name: /Submit/ })).toHaveCount(0);
    await expect(page.locator("input[type=password]")).toHaveCount(0);

    await page.getByRole("button", { name: /New Custom Unit/ }).first().click();
    await expect(page.getByRole("button", { name: "Save Locally" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Submit PR/ })).toHaveCount(0);

    expect(errors).toEqual([]);
});
