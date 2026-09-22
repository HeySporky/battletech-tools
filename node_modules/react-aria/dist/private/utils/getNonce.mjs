import {getMetaValue as $7096878c21af5e66$export$a929f3f93e2cc67e} from "./getMetaValue.mjs";
import {getOwnerDocument as $d447af545b77c9f1$export$b204af158042fbac} from "./domHelpers.mjs";

/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

let $2b2d34ff061957fb$var$nonceCache = new WeakMap();
function $2b2d34ff061957fb$export$88b319273f3705b4() {
    $2b2d34ff061957fb$var$nonceCache = new WeakMap();
}
function $2b2d34ff061957fb$export$2b85b721e524d74b(doc) {
    let ownerDocument = (0, $d447af545b77c9f1$export$b204af158042fbac)(doc);
    let nonce = $2b2d34ff061957fb$var$nonceCache.get(ownerDocument);
    nonce ??= (0, $7096878c21af5e66$export$a929f3f93e2cc67e)('csp-nonce', ownerDocument);
    if (nonce !== undefined) $2b2d34ff061957fb$var$nonceCache.set(ownerDocument, nonce);
    return nonce;
}


export {$2b2d34ff061957fb$export$88b319273f3705b4 as resetNonceCache, $2b2d34ff061957fb$export$2b85b721e524d74b as getNonce};
//# sourceMappingURL=getNonce.mjs.map
