import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Security guard rails for the whole source tree. The app renders data from files other people send
// (backups, SSW/MegaMek imports, rosters), so any new way to turn text into markup or code needs review.
// When one of these tests fails, fix the code; only extend an allowlist after reviewing the new site, and
// run the OWASP review skill (/paad:agentic-owasp --changed <base>) on the branch.
const SRC = fileURLToPath(new URL(".", import.meta.url));
const MUL_DATA = join(SRC, "data", "mul");
const CODE_FILE = /\.(js|jsx|mjs|cjs|ts|tsx|mts|cts)$/;
const TEST_FILE = /\.test\.(js|jsx|ts|tsx)$/;

const sourceFiles = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return path === MUL_DATA ? [] : sourceFiles(path);
    return CODE_FILE.test(name) && !TEST_FILE.test(name) ? [path] : [];
});

const files = sourceFiles(SRC).map((path) => ({ path: relative(SRC, path).split(sep).join("/"), text: readFileSync(path, "utf8") }));

const occurrences = (pattern: RegExp): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const file of files) {
        const found = file.text.match(pattern)?.length ?? 0;
        if (found) counts[file.path] = found;
    }
    return counts;
};

/**
 * Each `<SanitizedHTML ...>` opening tag, read to its real end: a `>` inside a `{...}` expression or inside a
 * quoted string does not close it, and braces inside quoted strings do not count.
 */
const sanitizedHtmlTags = (text: string): string[] => {
    const tags: string[] = [];
    for (let start = text.indexOf("<SanitizedHTML"); start >= 0; start = text.indexOf("<SanitizedHTML", start + 1)) {
        let depth = 0;
        let quote = "";
        let end = start;
        for (; end < text.length; end++) {
            const ch = text[end];
            if (quote) {
                if (ch === "\\") end++;
                else if (ch === quote) quote = "";
            } else if (ch === "\"" || ch === "'" || ch === "`") quote = ch;
            else if (ch === "{") depth++;
            else if (ch === "}") depth--;
            else if (ch === ">" && depth === 0) break;
        }
        tags.push(text.slice(start, end + 1));
    }
    return tags;
};

/** Source text without comments, for checks that must not trip on prose. */
const withoutComments = (text: string): string =>
    text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1");

describe("Security guard rails", () => {
    it("dangerouslySetInnerHTML appears only inside SanitizedHTML (as an attribute, spread or property)", () => {
        const counts = occurrences(/dangerouslySetInnerHTML\s*[=:]|["']dangerouslySetInnerHTML["']/g);
        expect(Object.keys(counts)).toEqual(["ui/components/sanitized-html.tsx"]);
    });

    it("no code-from-text or raw-markup DOM APIs", () => {
        expect(occurrences(new RegExp([
            String.raw`\beval\s*\(`,
            String.raw`\bnew\s+Function\s*\(`,
            String.raw`\.(innerHTML|outerHTML)\s*(\+?=)(?!=)`,
            String.raw`\[\s*["'\x60](innerHTML|outerHTML)["'\x60]\s*\]`,
            String.raw`\b(innerHTML|outerHTML)\s*:`,
            String.raw`insertAdjacentHTML\s*\(`,
            String.raw`document(\.|\[\s*["'])write(ln)?\b`,
            String.raw`\b(createContextualFragment|setHTMLUnsafe|parseFromString)\s*\(`,
            String.raw`\bsrcDoc\s*=`,
            String.raw`setTimeout\s*\(\s*["'\x60]`,
            String.raw`setInterval\s*\(\s*["'\x60]`,
        ].join("|"), "g"))).toEqual({});
    });

    it("no javascript: URLs", () => {
        expect(occurrences(/["'`]\s*javascript:/gi)).toEqual({});
    });

    it("security lint rules are never switched off inline, by name or by a blanket disable", () => {
        expect(occurrences(/eslint-disable[^\n]*(no-restricted-syntax|no-eval|no-implied-eval|no-new-func|no-script-url)/g)).toEqual({});
        expect(occurrences(/eslint-disable(-next-line|-line)?[ \t]*(\*\/|--|\r?$)/gm)).toEqual({});
    });

    it("no markup property names assembled at run time", () => {
        expect(occurrences(new RegExp([
            String.raw`\[[^\]\n]*(HTML|dangerously)[^\]\n]*\+[^\]\n]*\]`,
            String.raw`\[[^\]\n]*\+[^\]\n]*(HTML|dangerously)[^\]\n]*\]`,
            String.raw`\[\s*\x60[^\x60\n]*(HTML|dangerously)[^\x60\n]*\x60\s*\]`,
        ].join("|"), "g"))).toEqual({});
    });

    // SanitizedHTML raw={true} skips sanitizing: every string it renders must be built from escaped or trusted
    // values (see escapeLogText in vehicle.ts and _escapeLogText in battlemech.ts). These sites were reviewed on
    // 2026-09-29; the list must match the code exactly, so a new site fails until reviewed and a removed one
    // must be taken off.
    const REVIEWED_RAW_SITES: Record<string, number> = {
        "ui/pages/classic-battletech/mech-creator/exports.tsx": 1,
        "ui/pages/classic-battletech/mech-creator/home.tsx": 1,
        "ui/pages/classic-battletech/mech-creator/imports.tsx": 3,
        "ui/pages/classic-battletech/mech-creator/step1.tsx": 1,
        "ui/pages/classic-battletech/mech-creator/step2.tsx": 1,
        "ui/pages/classic-battletech/mech-creator/step3.tsx": 1,
        "ui/pages/classic-battletech/mech-creator/step4.tsx": 1,
        "ui/pages/classic-battletech/mech-creator/step5.tsx": 1,
        "ui/pages/classic-battletech/mech-creator/summary.tsx": 4,
        "ui/pages/classic-battletech/vehicle-creator/summary.tsx": 3,
        "ui/pages/classic-battletech/roster/_tableGroup.tsx": 1,
        "ui/pages/ssw-sanity-check.tsx": 1,
        // Pre-existing sites not traced in the 2026-09-29 review (TRO output was hardened upstream in 7e01b14fe;
        // the Alpha Strike creator log is unreviewed). Review them before extending them.
        "ui/pages/classic-battletech/roster/_addMechDialog.tsx": 1,
        "ui/pages/alpha-strike/unit-creator/home.tsx": 1,
    };

    it("SanitizedHTML raw is used exactly at the reviewed sites", () => {
        const counts: Record<string, number> = {};
        for (const file of files) {
            for (const tag of sanitizedHtmlTags(file.text)) {
                if (/\braw\b|\{\s*\.\.\./.test(tag)) counts[file.path] = (counts[file.path] ?? 0) + 1;
            }
        }
        expect(counts).toEqual(REVIEWED_RAW_SITES);
    });

    it("SanitizedHTML is never created indirectly, where the raw check cannot see its props", () => {
        expect(occurrences(/createElement\s*\(\s*SanitizedHTML\b/g)).toEqual({});
        // Only `import SanitizedHTML from ".../sanitized-html"`: no renames, named or namespace imports, re-exports,
        // and no use of the name except as a JSX tag (an alias, a spread into an object, a wrapper).
        const otherImports: Record<string, number> = {};
        const otherUses: Record<string, number> = {};
        for (const file of files) {
            if (file.path === "ui/components/sanitized-html.tsx") continue;
            const code = withoutComments(file.text);
            const statements = code.match(/\b(import|export)\b[^;]*?from\s*["'][^"']*sanitized-html(\.tsx?)?["']|import\s*\(\s*["'][^"']*sanitized-html/g) ?? [];
            const badImports = statements.filter((statement) => !/^import\s+SanitizedHTML\s+from\s*["']/.test(statement)).length;
            if (badImports) otherImports[file.path] = badImports;
            const uses = (code.match(/(?<![</\w$])SanitizedHTML\b/g)?.length ?? 0) - (code.match(/\bimport\s+SanitizedHTML\s+from/g)?.length ?? 0);
            if (uses) otherUses[file.path] = uses;
        }
        expect(otherImports).toEqual({});
        expect(otherUses).toEqual({});
    });

    // Imports of saved data must rebuild objects field by field (see normalizeVehicleInPlay) rather than merge
    // parsed JSON into class state; Object.assign walks prototype setters (prototype pollution).
    it("no Object.assign onto class state or prototypes", () => {
        expect(occurrences(/Object\.assign\s*\(\s*(this\b|[A-Za-z_$][\w$]*\.prototype)/g)).toEqual({});
    });
});
