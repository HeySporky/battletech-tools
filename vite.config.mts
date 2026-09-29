import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

// Only the version string is inlined - importing package.json directly would bundle the whole file into the client.
const APP_VERSION: string = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")).version;

// Matches the CRA "homepage" field behavior: no path prefix in dev, "/battletech-tools" in production builds.
const PRODUCTION_BASE = "/battletech-tools/";

export default defineConfig(({ command, mode }) => {
    // "vite preview" also reports command "serve" (same as "vite dev"), so branch on mode
    // instead - only true local dev should use the root base; build and preview both need
    // the production base to correctly resolve the deployed GitHub Pages sub-path.
    const isDev = command === "serve" && mode === "development";

    return {
        base: isDev ? "/" : PRODUCTION_BASE,
        plugins: [react()],
        define: {
            // Back-compat shim for the ~70 existing `process.env.PUBLIC_URL` call sites carried over from CRA.
            "process.env.PUBLIC_URL": JSON.stringify(isDev ? "" : PRODUCTION_BASE.replace(/\/$/, "")),
            __APP_VERSION__: JSON.stringify(APP_VERSION),
        },
        build: {
            outDir: "build",
            sourcemap: false,
        },
        server: {
            port: 3000,
        },
    };
});
