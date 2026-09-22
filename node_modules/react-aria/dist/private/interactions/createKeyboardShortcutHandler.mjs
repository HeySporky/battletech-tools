import {isMac as $2add3ce32c6007eb$export$9ac100e40613ea10} from "../utils/platform.mjs";

/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 
/** Modifier names in shortcut strings (case-insensitive). Order in the string does not matter. */ const $cbf729ad7eb217b0$var$MODIFIER_NAMES = new Set([
    'shift',
    'alt',
    'control',
    'meta',
    'mod' // OS dependent - Cmd on Mac, Control on Windows/Linux
]);
/** Canonical modifier order for stable keys (sorted, fixed order). */ const $cbf729ad7eb217b0$var$CANONICAL_MODIFIER_ORDER = [
    'Alt',
    'Control',
    'Meta',
    'Shift'
];
function $cbf729ad7eb217b0$export$9932402e211e7315(parsed) {
    let set = new Set();
    if (parsed.alt) set.add('Alt');
    if (parsed.shift) set.add('Shift');
    if (parsed.ctrl) set.add('Control');
    if (parsed.meta) set.add('Meta');
    if (parsed.mod) set.add((0, $2add3ce32c6007eb$export$9ac100e40613ea10)() ? 'Meta' : 'Control');
    return set;
}
function $cbf729ad7eb217b0$export$bf26c410e1f8fe6d(e) {
    let set = new Set();
    if (e.altKey) set.add('Alt');
    if (e.ctrlKey) set.add('Control');
    if (e.metaKey) set.add('Meta');
    if (e.shiftKey) set.add('Shift');
    return set;
}
function $cbf729ad7eb217b0$var$sortedModifierTokens(set) {
    return $cbf729ad7eb217b0$var$CANONICAL_MODIFIER_ORDER.filter((name)=>set.has(name));
}
function $cbf729ad7eb217b0$export$d636f01a2eaffd51(spec) {
    let parts = spec.split('+').reduce((prev, part)=>{
        let lower = part.toLowerCase();
        if ($cbf729ad7eb217b0$var$MODIFIER_NAMES.has(lower)) {
            if (lower === 'shift') prev.shift = true;
            else if (lower === 'alt') prev.alt = true;
            else if (lower === 'control') prev.ctrl = true;
            else if (lower === 'meta') prev.meta = true;
            else if (lower === 'mod') prev.mod = true;
        } else prev.key = part;
        return prev;
    }, {
        shift: false,
        alt: false,
        ctrl: false,
        meta: false,
        mod: false,
        key: ''
    });
    if (parts.key === '') throw new Error(`Invalid keyboard shortcut: "${spec}". Must include exactly one non-modifier key (e.g. "a", "Enter", "ArrowDown"). Combine any of Shift, Alt, Ctrl, Meta, and Mod.`);
    return parts;
}
function $cbf729ad7eb217b0$var$normalizeEventKey(key) {
    return key.toLowerCase();
}
/** Short aliases for common keys (shortcut side, before match). */ const $cbf729ad7eb217b0$var$KEY_ALIASES = {
    space: ' ',
    esc: 'escape',
    del: 'delete',
    ins: 'insert',
    left: 'arrowleft',
    right: 'arrowright',
    up: 'arrowup',
    down: 'arrowdown',
    pageup: 'pageup',
    pagedown: 'pagedown'
};
/** Canonical key segment (lowercase); aliases like `down` → `arrowdown`. */ function $cbf729ad7eb217b0$var$canonicalKeyFromSpecKey(specKey) {
    let k = $cbf729ad7eb217b0$var$normalizeEventKey(specKey);
    let aliased = $cbf729ad7eb217b0$var$KEY_ALIASES[k];
    return aliased != null ? aliased : k;
}
function $cbf729ad7eb217b0$export$6cfa2ace150c84a5(parsed) {
    let mods = $cbf729ad7eb217b0$var$sortedModifierTokens($cbf729ad7eb217b0$export$9932402e211e7315(parsed));
    let key = $cbf729ad7eb217b0$var$canonicalKeyFromSpecKey(parsed.key);
    return mods.length > 0 ? `${mods.join('+')}+${key}` : key;
}
function $cbf729ad7eb217b0$export$786304bda41dd69f(e) {
    let mods = $cbf729ad7eb217b0$var$sortedModifierTokens($cbf729ad7eb217b0$export$bf26c410e1f8fe6d(e));
    let key = $cbf729ad7eb217b0$var$normalizeEventKey(e.key);
    let prefix = mods.length > 0 ? `${mods.join('+')}+` : '';
    return prefix + key;
}
function $cbf729ad7eb217b0$export$2fd1fc8039383ae1(bindings) {
    let map = new Map();
    for (let [spec, action] of Object.entries(bindings)){
        let parsed = $cbf729ad7eb217b0$export$d636f01a2eaffd51(spec);
        map.set($cbf729ad7eb217b0$export$6cfa2ace150c84a5(parsed), action);
    }
    return (e)=>{
        let canonical = $cbf729ad7eb217b0$export$786304bda41dd69f(e);
        let action = map.get(canonical);
        let result = action?.(e);
        if (result === undefined && action !== undefined) result = {
            shouldContinuePropagation: false,
            shouldPreventDefault: true
        };
        else if (typeof result === 'boolean') result = {
            shouldContinuePropagation: !result,
            shouldPreventDefault: result
        };
        if (result?.shouldPreventDefault) e.preventDefault();
        if (!action || result?.shouldContinuePropagation) e.continuePropagation();
    };
}


export {$cbf729ad7eb217b0$export$9932402e211e7315 as modifierSetFromParsed, $cbf729ad7eb217b0$export$bf26c410e1f8fe6d as modifierSetFromEvent, $cbf729ad7eb217b0$export$d636f01a2eaffd51 as parseKeyboardShortcut, $cbf729ad7eb217b0$export$6cfa2ace150c84a5 as canonicalKeyboardShortcut, $cbf729ad7eb217b0$export$786304bda41dd69f as keyboardEventToCanonicalShortcut, $cbf729ad7eb217b0$export$2fd1fc8039383ae1 as createKeyboardShortcutHandler};
//# sourceMappingURL=createKeyboardShortcutHandler.mjs.map
