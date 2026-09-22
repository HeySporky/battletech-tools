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
 */ const $cc3c3666b64debad$export$b204af158042fbac = (target)=>{
    if ($cc3c3666b64debad$var$isWindow(target)) return target.document;
    if ($cc3c3666b64debad$export$62858bae88b53fd0(target)) return target;
    var _target_ownerDocument;
    // @ts-expect-error Ensure safe access in SSR environments.
    return (_target_ownerDocument = target === null || target === void 0 ? void 0 : target.ownerDocument) !== null && _target_ownerDocument !== void 0 ? _target_ownerDocument : typeof document !== 'undefined' ? document : undefined;
};
const $cc3c3666b64debad$export$f21a1ffae260145a = (target)=>{
    let ownerDocument = $cc3c3666b64debad$export$b204af158042fbac(target);
    var _ownerDocument_defaultView;
    // @ts-expect-error Ensure safe access in SSR environments.
    return (_ownerDocument_defaultView = ownerDocument === null || ownerDocument === void 0 ? void 0 : ownerDocument.defaultView) !== null && _ownerDocument_defaultView !== void 0 ? _ownerDocument_defaultView : typeof window !== 'undefined' ? window : undefined;
};
function $cc3c3666b64debad$export$8ee0fc9ee280b4ee(value) {
    return value !== null && typeof value === 'object' && 'nodeType' in value && typeof value.nodeType === 'number';
}
/**
 * Type guard that checks if a value is a Window. Uses window self reference checks to
 * distinguish Window from other values.
 */ function $cc3c3666b64debad$var$isWindow(value) {
    return typeof value === 'object' && value != null && 'window' in value && value.window === value;
}
function $cc3c3666b64debad$export$62858bae88b53fd0(value) {
    return $cc3c3666b64debad$export$8ee0fc9ee280b4ee(value) && value.nodeType === 9;
}
function $cc3c3666b64debad$export$af51f0f06c0f328a(value) {
    // 11 = DOCUMENT_FRAGMENT_NODE
    return $cc3c3666b64debad$export$8ee0fc9ee280b4ee(value) && value.nodeType === 11 && 'host' in value;
}
function $cc3c3666b64debad$export$f531f92e2a15358f(target, event, listener, options) {
    if (listener == null || target == null) return ()=>{};
    let eventTargets = Array.isArray(target) ? target : [
        target
    ];
    for (let eventTarget of eventTargets)eventTarget.addEventListener(event, listener, options);
    return ()=>{
        for (let eventTarget of eventTargets)eventTarget.removeEventListener(event, listener, options);
    };
}
function $cc3c3666b64debad$export$37a5fde709c1db82(target, property, value, priority) {
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


export {$cc3c3666b64debad$export$b204af158042fbac as getOwnerDocument, $cc3c3666b64debad$export$62858bae88b53fd0 as isDocument, $cc3c3666b64debad$export$f21a1ffae260145a as getOwnerWindow, $cc3c3666b64debad$export$8ee0fc9ee280b4ee as isNode, $cc3c3666b64debad$export$af51f0f06c0f328a as isShadowRoot, $cc3c3666b64debad$export$f531f92e2a15358f as addEvent, $cc3c3666b64debad$export$37a5fde709c1db82 as setStyle};
//# sourceMappingURL=domHelpers.js.map
