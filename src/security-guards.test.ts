import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Security guard rails for the whole source tree. The app renders data from files other people send
// (backups, SSW/MegaMek imports, rosters), so any new way to turn text into markup or code needs review.
// When one of these tests fails, fix the code; only extend an allowlist after reviewing the new site, and
// run the OWASP review skill (/paad:agentic-owasp --changed <base>) on the branch.
const SRC = fileURLToPath(new URL(".", import.meta.url));

const sourceFiles = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "mul" ? [] : sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) ? [path] : [];
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

describe("Security guard rails", () => {
    it("dangerouslySetInnerHTML appears only inside SanitizedHTML", () => {
        expect(Object.keys(occurrences(/dangerouslySetInnerHTML\s*=/g))).toEqual(["ui/components/sanitized-html.tsx"]);
    });

    it("no code-from-text or raw-markup DOM APIs (eval, new Function, innerHTML, insertAdjacentHTML, document.write)", () => {
        expect(occurrences(/\beval\s*\(|\bnew\s+Function\s*\(|\.(innerHTML|outerHTML)\s*=[^=]|insertAdjacentHTML\s*\(|document\.write(ln)?\s*\(|setTimeout\s*\(\s*["'`]/g)).toEqual({});
    });

    it("no javascript: URLs", () => {
        expect(occurrences(/["'`]\s*javascript:/gi)).toEqual({});
    });

    // SanitizedHTML raw={true} skips sanitizing: every string it renders must be built from escaped or trusted
    // values (see escapeLogText in vehicle.ts and _escapeLogText in battlemech.ts). These sites were reviewed on
    // 2026-09-29; a new site fails this test until someone has reviewed it and added it here.
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

    it("SanitizedHTML raw is used only at reviewed sites", () => {
        const counts: Record<string, number> = {};
        for (const file of files) {
            for (const tag of file.text.match(/<SanitizedHTML\b[^>]*?\/?>/g) ?? []) {
                if (/\braw\b/.test(tag)) counts[file.path] = (counts[file.path] ?? 0) + 1;
            }
        }
        const unreviewed = Object.entries(counts).filter(([path, count]) => count > (REVIEWED_RAW_SITES[path] ?? 0));
        expect(unreviewed).toEqual([]);
    });

    // Imports of saved data must rebuild objects field by field (see normalizeVehicleInPlay) rather than merge
    // parsed JSON into class state; Object.assign walks prototype setters (prototype pollution).
    it("no Object.assign onto class state or prototypes", () => {
        expect(occurrences(/Object\.assign\s*\(\s*(this\b|[A-Za-z_$][\w$]*\.prototype)/g)).toEqual({});
    });
});
