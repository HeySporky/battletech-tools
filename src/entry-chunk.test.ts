import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

// The entry chunk holds the app shell and the home page; the unit classes and equipment catalogs (megabytes of
// data) load after it (#589). This follows the entry's static imports, as the bundler does once TypeScript has
// dropped the type-only ones, and fails if any of the heavy modules can be reached without a dynamic import().
const HEAVY_MODULES = /^src\/(classes\/|dataSaves\.ts$|data\/(equipment-|ammo|quirks|infantry-weapons|battle-armor-equipment))/;

const EXTENSIONS = [".ts", ".tsx", "/index.ts", "/index.tsx"];
const STATIC_IMPORT = /(?:^|\n)\s*(?:import|export)\s+(?:[^"';]*?\s+from\s+)?["']([^"']+)["']/g;

const resolveImport = (from: string, spec: string): string | null => {
    if (!spec.startsWith(".")) {
        return null;
    }
    const base = resolve(dirname(from), spec);
    if (/\.(tsx?|m?js)$/.test(base) && existsSync(base)) {
        return base;
    }
    const found = EXTENSIONS.map((ext) => base + ext).find((path) => existsSync(path));
    return found ?? null;
};

/** Each module the entry reaches through static imports, with the module that first imported it. */
const walkStaticImports = (entry: string): Map<string, string | null> => {
    const importedBy = new Map<string, string | null>([[entry, null]]);
    const queue = [entry];
    while (queue.length) {
        const file = queue.shift()!;
        const source = readFileSync(file, "utf8");
        const js = ts.transpileModule(source, {
            fileName: file,
            compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext, jsx: ts.JsxEmit.Preserve },
        }).outputText;
        for (const match of js.matchAll(STATIC_IMPORT)) {
            const target = resolveImport(file, match[1]);
            if (target && !importedBy.has(target)) {
                importedBy.set(target, file);
                queue.push(target);
            }
        }
    }
    return importedBy;
};

describe("entry chunk", () => {
    it("does not statically import the unit classes or the equipment catalogs", () => {
        const root = process.cwd();
        const short = (path: string) => relative(root, path).replace(/\\/g, "/");
        const importedBy = walkStaticImports(resolve(root, "src/index.tsx"));
        const heavy = [...importedBy.keys()].filter((path) => HEAVY_MODULES.test(short(path))).map((path) => {
            const chain = [short(path)];
            for (let parent = importedBy.get(path); parent; parent = importedBy.get(parent)) {
                chain.push(short(parent));
            }
            return chain.join(" <- ");
        });
        expect(heavy).toEqual([]);
    });
});
