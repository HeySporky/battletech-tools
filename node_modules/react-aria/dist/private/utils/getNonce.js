import {getMetaValue as $e5cbb54a67a6569d$export$a929f3f93e2cc67e} from "./getMetaValue.js";
import {getOwnerDocument as $cc3c3666b64debad$export$b204af158042fbac} from "./domHelpers.js";

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

let $fb5d33e131fca75a$var$nonceCache = new WeakMap();
function $fb5d33e131fca75a$export$88b319273f3705b4() {
    $fb5d33e131fca75a$var$nonceCache = new WeakMap();
}
function $fb5d33e131fca75a$export$2b85b721e524d74b(doc) {
    let ownerDocument = (0, $cc3c3666b64debad$export$b204af158042fbac)(doc);
    let nonce = $fb5d33e131fca75a$var$nonceCache.get(ownerDocument);
    nonce !== null && nonce !== void 0 ? nonce : nonce = (0, $e5cbb54a67a6569d$export$a929f3f93e2cc67e)('csp-nonce', ownerDocument);
    if (nonce !== undefined) $fb5d33e131fca75a$var$nonceCache.set(ownerDocument, nonce);
    return nonce;
}


export {$fb5d33e131fca75a$export$88b319273f3705b4 as resetNonceCache, $fb5d33e131fca75a$export$2b85b721e524d74b as getNonce};
//# sourceMappingURL=getNonce.js.map
