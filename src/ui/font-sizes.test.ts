import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

// Readable text (beta feedback 2026-10-21): no text below 0.75rem anywhere, and warning (red) text at least
// 0.875rem, so it can be read. Root font size 16px.
const stylesheets = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return stylesheets(path);
    return /\.s?css$/.test(name) ? [path] : [];
});

const withoutComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("font sizes", () => {
    it("sets no text below 0.75rem (12px) in any stylesheet", () => {
        const tooSmall: string[] = [];
        for (const file of stylesheets(join(__dirname, ".."))) {
            for (const match of withoutComments(readFileSync(file, "utf8")).matchAll(/font-size:\s*([\d.]+)(rem|px)/g)) {
                const rem = match[2] === "px" ? +match[1] / 16 : +match[1];
                if (rem < 0.75) tooSmall.push(`${file}: ${match[0]}`);
            }
        }
        expect(tooSmall).toEqual([]);
    });

    it("draws red warning text at least 0.875rem, keeping larger text as it is", () => {
        const index = withoutComments(readFileSync(join(__dirname, "..", "index.scss"), "utf8"));
        const rule = index.match(/\.color-red[^{]*\{([^}]*)\}/)?.[1] ?? "";
        expect(rule).toMatch(/font-size:\s*max\(\s*0?\.875rem,\s*1em\s*\)/);
    });
});
