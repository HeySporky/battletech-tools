import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..");

describe("site metadata", () => {
    it("calls the app a SPA, not a PWA: no service worker is registered", () => {
        const html = readFileSync(join(root, "index.html"), "utf8");
        const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
        expect(description).toContain("SPA");
        expect(description).not.toMatch(/\bPWA\b/);
        expect(readFileSync(join(root, "src/index.tsx"), "utf8")).toContain("serviceWorker.unregister()");
        expect(readFileSync(join(root, "src/serviceWorker.ts"), "utf8")).not.toMatch(/\bregister\(/);
        expect(readFileSync(join(root, "README.md"), "utf8")).not.toMatch(/\bPWA\b/);
    });

    it("lists only manifest icons that exist in public/", () => {
        const manifest = JSON.parse(readFileSync(join(root, "public/manifest.json"), "utf8"));
        for (const icon of manifest.icons) {
            expect(existsSync(join(root, "public", icon.src)), icon.src).toBe(true);
        }
    });
});
