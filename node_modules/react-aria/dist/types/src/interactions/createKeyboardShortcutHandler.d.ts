import { KeyboardEvent } from '@react-types/shared';
export type KeyboardShortcutAction = (e: KeyboardEvent) => void | boolean | Partial<{
    shouldContinuePropagation?: boolean;
    shouldPreventDefault?: boolean;
}>;
/** Maps shortcut strings (e.g. `"Mod+s"`, `"Control+Shift+a"`) to handlers. */
export type KeyboardShortcutBindings = Record<string, KeyboardShortcutAction>;
export interface ParsedKeyboardShortcut {
    shift: boolean;
    alt: boolean;
    ctrl: boolean;
    meta: boolean;
    /**
     * Platform primary: Cmd on Mac, Control on Windows/Linux — expands to Meta or Control in
     * canonical form.
     */
    mod: boolean;
    key: string;
}
/**
 * Builds the set of canonical modifier tokens for a binding.
 * `Mod` contributes Meta (Mac) or Ctrl (non-Mac); explicit Ctrl/Meta add those keys too.
 */
export declare function modifierSetFromParsed(parsed: ParsedKeyboardShortcut): Set<string>;
/** Modifier set from a keydown event (native flags only). */
export declare function modifierSetFromEvent(e: KeyboardEvent): Set<string>;
/**
 * Parses a shortcut like `"Mod+Shift+z"`, `"Ctrl+Alt+Enter"`, or `"Escape"`.
 * Modifiers are case-insensitive; order does not matter. `control` is an alias for `ctrl`.
 */
export declare function parseKeyboardShortcut(spec: string): ParsedKeyboardShortcut;
/** Canonical shortcut string for a binding (modifiers sorted: Alt, Ctrl, Meta, Shift, then key). */
export declare function canonicalKeyboardShortcut(parsed: ParsedKeyboardShortcut): string;
/** Canonical shortcut string for a keydown event. */
export declare function keyboardEventToCanonicalShortcut(e: KeyboardEvent): string;
/**
 * Returns a keydown handler that runs the action only for an exact modifier+key match.
 * Modifier order in the string does not matter (`Shift+Mod+a` ≡ `Mod+Shift+a`).
 * Any combination of **Shift**, **Alt**, **Ctrl**, **Meta**, and **Mod** is allowed; **Mod** means
 * Cmd on Apple platforms and Ctrl on Windows/Linux (same as before). **control** aliases **ctrl**.
 *
 * Duplicate bindings that normalize to the same shortcut: later object entries win.
 *
 * @example
 *   ```tsx
 *   let onKeyDown = createKeyboardShortcutHandler({
 *     'Mod+s': e => {
 *       e.preventDefault();
 *       save();
 *     },
 *     'Ctrl+Shift+k': () => palette(),
 *     'Meta+Alt+ArrowLeft': () => back()
 *   });
 *   ```;
 */
export declare function createKeyboardShortcutHandler(bindings: KeyboardShortcutBindings): (e: KeyboardEvent) => void;
