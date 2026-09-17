import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Matches the CRA "homepage" field behavior: no path prefix in dev, "/battletech-tools" in production builds.
const PRODUCTION_BASE = "/battletech-tools/";

export default defineConfig(({ command }) => ({
    base: command === "build" ? PRODUCTION_BASE : "/",
    plugins: [react()],
    define: {
        // Back-compat shim for the ~70 existing `process.env.PUBLIC_URL` call sites carried over from CRA.
        "process.env.PUBLIC_URL": JSON.stringify(
            command === "build" ? PRODUCTION_BASE.replace(/\/$/, "") : ""
        ),
    },
    build: {
        outDir: "build",
        sourcemap: false,
    },
    server: {
        port: 3000,
    },
}));
