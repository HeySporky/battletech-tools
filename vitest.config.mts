import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.mts";

// Tests reuse the app's Vite config (plugins, `process.env.PUBLIC_URL` / `__APP_VERSION__` defines) so code under
// test is transformed exactly like the app. Kept separate from vite.config.mts so `npm run dev` never loads Playwright.
//
// Projects:
//   unit     `*.test.ts(x)` in Node. Component tests opt into a DOM per file with `// @vitest-environment happy-dom`.
//            Runs everywhere, including Android/Termux. This is what `npm test` runs.
//   browser  `*.browser.test.ts(x)` in real Chromium, Firefox and WebKit via Playwright (desktop and CI only).
//            Run with `npm run test:browser` after `npx playwright install`.
//            VITEST_BROWSERS=chromium,webkit limits the engines; PLAYWRIGHT_CHANNEL=msedge|chrome uses an installed
//            Edge/Chrome for Chromium instead of Playwright's download.
const BROWSERS = (process.env.VITEST_BROWSERS ?? "chromium,firefox,webkit").split(",").map((name) => name.trim()) as (
    "chromium" | "firefox" | "webkit"
)[];
const CHANNEL = process.env.PLAYWRIGHT_CHANNEL;

export default defineConfig((env) =>
    mergeConfig(viteConfig(env), {
        test: {
            projects: [
                {
                    extends: true,
                    test: {
                        name: "unit",
                        environment: "node",
                        include: ["src/**/*.test.{ts,tsx}"],
                        exclude: ["src/**/*.browser.test.{ts,tsx}"],
                    },
                },
                {
                    extends: true,
                    test: {
                        name: "browser",
                        include: ["src/**/*.browser.test.{ts,tsx}"],
                        browser: {
                            enabled: true,
                            headless: true,
                            provider: playwright(),
                            instances: BROWSERS.map((browser) => ({
                                browser,
                                // Drive an installed Edge/Chrome instead of Playwright's Chromium download.
                                ...(browser === "chromium" && CHANNEL
                                    ? { provider: playwright({ launchOptions: { channel: CHANNEL } }) }
                                    : {}),
                            })),
                        },
                    },
                },
            ],
            coverage: {
                provider: "v8",
                include: ["src/**/*.{ts,tsx}"],
                exclude: ["src/**/*.test.{ts,tsx}", "src/data/ssw/**"],
                reporter: ["text-summary", "html"],
            },
        },
    }),
);
