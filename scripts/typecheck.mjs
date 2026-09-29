#!/usr/bin/env node
// Type-checks the project with TypeScript 7 (the native Go compiler) when a native binary exists for
// this platform, and falls back to TypeScript 6 otherwise.
//
// TypeScript 7 ships native binaries for Windows, macOS, Linux and the BSDs, but not for Android, so Termux
// users get TypeScript 6 automatically. ESLint (typescript-eslint) always uses TypeScript 6, which is the
// plain `typescript` package, because typescript-eslint does not support TypeScript 7 yet.
//
// Usage:  npm run typecheck [-- extra tsc args]
//         TYPECHECK_TS=6 npm run typecheck   (force TypeScript 6)
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const tscArgs = ["--noEmit", "-p", "tsconfig.json", ...process.argv.slice(2)];

function packageDir(name) {
    try {
        return dirname(require.resolve(`${name}/package.json`));
    } catch {
        return null;
    }
}

function hasNativeTypeScript7(ts7Dir) {
    const nativePackage = `@typescript/typescript-${process.platform}-${process.arch}`;
    try {
        createRequire(join(ts7Dir, "package.json")).resolve(`${nativePackage}/package.json`);
        return true;
    } catch {
        return false;
    }
}

const ts7Dir = process.env.TYPECHECK_TS === "6" ? null : packageDir("typescript-7");
const useTs7 = ts7Dir !== null && hasNativeTypeScript7(ts7Dir);
const tsDir = useTs7 ? ts7Dir : packageDir("typescript");

if (tsDir === null) {
    console.error("typecheck: no TypeScript installation found - run `npm install` first.");
    process.exit(1);
}

const version = require(join(tsDir, "package.json")).version;
if (!useTs7 && process.env.TYPECHECK_TS !== "6") {
    console.log(`typecheck: no TypeScript 7 native binary for ${process.platform}-${process.arch}; using TypeScript ${version}.`);
} else {
    console.log(`typecheck: TypeScript ${version}`);
}

const result = spawnSync(process.execPath, [join(tsDir, "bin", "tsc"), ...tscArgs], { stdio: "inherit" });
process.exit(result.status ?? 1);
