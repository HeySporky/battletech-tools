/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ const $d447af545b77c9f1$export$b204af158042fbac = (target)=>{
    if ($d447af545b77c9f1$var$isWindow(target)) return target.document;
    if ($d447af545b77c9f1$export$62858bae88b53fd0(target)) return target;
    // @ts-expect-error Ensure safe access in SSR environments.
    return target?.ownerDocument ?? (typeof document !== 'undefined' ? document : undefined);
};
const $d447af545b77c9f1$export$f21a1ffae260145a = (target)=>{
    let ownerDocument = $d447af545b77c9f1$export$b204af158042fbac(target);
    // @ts-expect-error Ensure safe access in SSR environments.
    return ownerDocument?.defaultView ?? (typeof window !== 'undefined' ? window : undefined);
};
function $d447af545b77c9f1$export$8ee0fc9ee280b4ee(value) {
    return value !== null && typeof value === 'object' && 'nodeType' in value && typeof value.nodeType === 'number';
}
/**
 * Type guard that checks if a value is a Window. Uses window self reference checks to
 * distinguish Window from other values.
 */ function $d447af545b77c9f1$var$isWindow(value) {
    return typeof value === 'object' && value != null && 'window' in value && value.window === value;
}
function $d447af545b77c9f1$export$62858bae88b53fd0(value) {
    return $d447af545b77c9f1$export$8ee0fc9ee280b4ee(value) && value.nodeType === 9;
}
function $d447af545b77c9f1$export$af51f0f06c0f328a(value) {
    // 11 = DOCUMENT_FRAGMENT_NODE
    return $d447af545b77c9f1$export$8ee0fc9ee280b4ee(value) && value.nodeType === 11 && 'host' in value;
}
function $d447af545b77c9f1$export$f531f92e2a15358f(target, event, listener, options) {
    if (listener == null || target == null) return ()=>{};
    let eventTargets = Array.isArray(target) ? target : [
        target
    ];
    for (let eventTarget of eventTargets)eventTarget.addEventListener(event, listener, options);
    return ()=>{
        for (let eventTarget of eventTargets)eventTarget.removeEventListener(event, listener, options);
    };
}
function $d447af545b77c9f1$export$37a5fde709c1db82(target, property, value, priority) {
    if (target == null) return ()=>{};
    let restore = new Array();
    let styleTargets = Array.isArray(target) ? target : [
        target
    ];
    for (let styleTarget of styleTargets){
        let initialValue = styleTarget.style.getPropertyValue(property);
        let initialPriority = styleTarget.style.getPropertyPriority(property);
        styleTarget.style.setProperty(property, value, priority);
        restore.unshift(()=>{
            if (initialValue) styleTarget.style.setProperty(property, initialValue, initialPriority);
            else styleTarget.style.removeProperty(property);
        });
    }
    return ()=>{
        for (let cleanup of restore)cleanup();
    };
}


export {$d447af545b77c9f1$export$b204af158042fbac as getOwnerDocument, $d447af545b77c9f1$export$62858bae88b53fd0 as isDocument, $d447af545b77c9f1$export$f21a1ffae260145a as getOwnerWindow, $d447af545b77c9f1$export$8ee0fc9ee280b4ee as isNode, $d447af545b77c9f1$export$af51f0f06c0f328a as isShadowRoot, $d447af545b77c9f1$export$f531f92e2a15358f as addEvent, $d447af545b77c9f1$export$37a5fde709c1db82 as setStyle};
//# sourceMappingURL=domHelpers.mjs.map
