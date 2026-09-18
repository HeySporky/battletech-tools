import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
    { ignores: ["build", "cli-tools", "node_modules", "battletech-tools"] },
    js.configs.recommended,
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2020,
            globals: { ...globals.browser, ...globals.node },
            // typescript-eslint's own "typescript-eslint" meta-package refuses to run on TS 7 yet;
            // using @typescript-eslint/parser directly here only emits a soft version warning.
            parser: tsParser,
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            "react-refresh/only-export-components": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-empty-object-type": ["error", { allowInterfaces: "always" }],
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-unsafe-function-type": "off",
            "@typescript-eslint/no-require-imports": "off",
            "no-empty": "off",
            "no-useless-assignment": "off",
            // TypeScript's own compiler already catches real undefined references and
            // understands ambient globals (JSX, process via vite define, etc.) that no-undef doesn't.
            "no-undef": "off",
        },
    },
];
