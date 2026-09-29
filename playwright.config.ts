import { defineConfig, devices } from "@playwright/test";

// End-to-end smoke tests against the production build served by `vite preview` (same base path as GitHub Pages).
//
//   npx playwright install            one-time browser download (Chromium, Firefox, WebKit)
//   npm run test:e2e                  all desktop engines + phone/tablet emulation
//   npm run test:e2e -- --project=webkit
//
// PLAYWRIGHT_CHANNEL=msedge|chrome drives an already-installed Edge/Chrome for the Chromium-based projects instead of
// Playwright's own download - useful where the browser download is blocked. Firefox/WebKit always need the download.
// Android (Termux) cannot run these: Playwright has no Android browser builds. Use `npm test` there.
const channel = process.env.PLAYWRIGHT_CHANNEL;
const PORT = 4173;

export default defineConfig({
    testDir: "e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
    use: {
        baseURL: `http://localhost:${PORT}/battletech-tools/`,
        trace: "on-first-retry",
    },
    projects: [
        { name: "chromium", use: { ...devices["Desktop Chrome"], channel } },
        { name: "firefox", use: { ...devices["Desktop Firefox"] } },
        { name: "webkit", use: { ...devices["Desktop Safari"] } },
        { name: "mobile-android", use: { ...devices["Pixel 10"], channel } },
        { name: "mobile-ios", use: { ...devices["iPhone 17"] } },
        { name: "tablet-ipad", use: { ...devices["iPad (gen 11)"] } },
    ],
    webServer: {
        command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}/battletech-tools/`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
    },
});
