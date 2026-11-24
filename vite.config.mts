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
            // Vite's 500 kB default is already lenient (webpack warns at 250 kB, the Angular CLI at 170 kB). It is
            // raised only enough for the missile catalog, one 501 kB module the bundler cannot split (#589).
            chunkSizeWarningLimit: 510,
            rolldownOptions: {
                // The plugin-timing note only reports a slow machine (it came and went between identical builds).
                checks: { bundlerTimings: false },
                output: {
                    codeSplitting: {
                        // The big equipment catalogs get a chunk each, so their shared chunk stays under the size
                        // warning (#589). They import only data types, so moving them cannot change the order
                        // modules run in (broad groups did, and broke startup) nor pull anything else along.
                        groups: [
                            {
                                name: (id: string) => id.replace(/\\/g, "/").split("/").pop()!.replace(/\.ts$/, ""),
                                debugName: "equipment-catalogs",
                                test: /src[\\/]data[\\/](equipment-(missile|misc|ballistic|energy)|ammo)\.ts$/,
                            },
                        ],
                    },
                },
            },
        },
        server: {
            port: 3000,
        },
    };
});
