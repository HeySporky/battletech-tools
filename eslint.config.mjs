import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

// typescript-eslint resolves the plain `typescript` package, which is pinned to 6.0.x on purpose:
// typescript-eslint does not support TypeScript 7 yet. `npm run typecheck` uses TypeScript 7 separately.
export default tseslint.config(
    {
        ignores: [
            "build", "cli-tools", "node_modules", "coverage", "playwright-report", "test-results",
            // local-only environments/working folders that some contributors keep in the repo root
            ".venv", "venv", "**/*_DEV/**",
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        // Node-side scripts and config files.
        files: ["scripts/**/*.{js,mjs,cjs}", "tools/**/*.{js,mjs,cjs}", "*.{js,mjs,cjs,mts}"],
        languageOptions: { globals: { ...globals.node } },
    },
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2022,
            globals: { ...globals.browser, ...globals.node },
        },
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            "react-refresh/only-export-components": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-empty-object-type": ["error", { allowInterfaces: "always" }],
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/no-unsafe-function-type": "off",
            "no-empty": "off",
            "no-useless-assignment": "off",
            // Enabled by typescript-eslint's recommended preset. Both are auto-fixable (`eslint --fix`) but touch
            // ~800 lines across most of src/, so they are left for a dedicated cleanup pass rather than this PR.
            "prefer-const": "off",
            "no-var": "off",
            // TypeScript's own compiler already catches real undefined references and
            // understands ambient globals (JSX, process via vite define, etc.) that no-undef doesn't.
            "no-undef": "off",
        },
    },
);
