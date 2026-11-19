import { expect, test } from "@playwright/test";

// Discussion #13: the news runs to a hundred items, so it scrolls inside its own box instead of making the home
// page go on forever. The box can take keyboard focus, so it can be scrolled without a mouse.
test("the news scrolls in a box no taller than the window", async ({ page }) => {
    await page.goto("");
    const news = page.getByRole("region", { name: "News" });
    await expect(news).toBeVisible();

    const viewport = page.viewportSize()!;
    const box = (await news.boundingBox())!;
    expect(box.height).toBeLessThanOrEqual(viewport.height * 0.75 + 1);

    const scroll = await news.evaluate((element) => ({ scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }));
    expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight);

    await news.focus();
    await page.keyboard.press("End");
    await expect.poll(() => news.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
});
