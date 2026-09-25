#!/usr/bin/env node
/**
 * Workaround for Windows self-hosted runners: playwright-core's own downloader (coreBundle.js)
 * consistently times out (30s, every attempt) fetching from cdn.playwright.dev on this network,
 * even though a plain Node `https.get` to the exact same URL succeeds in under a second. Root cause
 * unconfirmed (likely something playwright's request options trip on this network/CDN edge), but
 * since `chromium.launch()` only checks that the executable exists at the expected cache path —
 * it doesn't care how it got there — we just fetch it ourselves with a plain https client and place
 * it directly, skipping `npx playwright install` (which also actively deletes anything it doesn't
 * recognize as installed-by-itself, so this must run instead of, not alongside, that command).
 *
 * Linux/GitHub-hosted runners are unaffected and keep using the official `playwright install --with-deps`.
 */

import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const browsersJsonPath = path.join(repoRoot, "node_modules", "playwright-core", "browsers.json");
const cacheDir = path.join(process.env.LOCALAPPDATA ?? "", "ms-playwright");

function loadHeadlessShellRevision() {
    const manifest = JSON.parse(fs.readFileSync(browsersJsonPath, "utf8"));
    const entry = manifest.browsers.find((b) => b.name === "chromium-headless-shell");
    if (!entry) throw new Error("Could not find chromium-headless-shell entry in browsers.json");
    return { revision: entry.revision, browserVersion: entry.browserVersion };
}

function download(url, dest, redirectsLeft = 5) {
    return new Promise((resolve, reject) => {
        https
            .get(url, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirectsLeft > 0) {
                    res.resume();
                    resolve(download(res.headers.location, dest, redirectsLeft - 1));
                    return;
                }
                if (res.statusCode !== 200) {
                    reject(new Error(`Unexpected status ${res.statusCode} for ${url}`));
                    return;
                }
                const file = fs.createWriteStream(dest);
                res.pipe(file);
                file.on("finish", () => file.close(() => resolve()));
            })
            .on("error", reject);
    });
}

async function main() {
    const { revision, browserVersion } = loadHeadlessShellRevision();
    const installDir = path.join(cacheDir, `chromium_headless_shell-${revision}`);
    const exePath = path.join(installDir, "chrome-headless-shell-win64", "chrome-headless-shell.exe");

    if (fs.existsSync(exePath)) {
        console.log(`Already present: ${exePath}`);
        return;
    }

    const url = `https://cdn.playwright.dev/builds/cft/${browserVersion}/win64/chrome-headless-shell-win64.zip`;
    const zipPath = path.join(process.env.TEMP ?? ".", "chrome-headless-shell-win64.zip");

    console.log(`Downloading ${url}`);
    await download(url, zipPath);
    console.log(`Downloaded ${fs.statSync(zipPath).size} bytes, extracting to ${installDir}`);

    fs.mkdirSync(installDir, { recursive: true });
    execFileSync("powershell.exe", [
        "-NoProfile",
        "-Command",
        `Expand-Archive -Path '${zipPath}' -DestinationPath '${installDir}' -Force`,
    ]);

    if (!fs.existsSync(exePath)) {
        throw new Error(`Extraction did not produce the expected executable at ${exePath}`);
    }
    console.log(`Ready: ${exePath}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
