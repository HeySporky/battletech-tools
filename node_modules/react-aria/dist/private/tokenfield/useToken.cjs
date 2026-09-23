var $8f130d4aeb0f65e8$exports = require("../utils/isVirtualEvent.cjs");
var $6e76e65001bbcda2$exports = require("../utils/useEvent.cjs");
var $TNch7$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useToken", function () { return $a3b6a59b8fbd0941$export$31dcd79391e423fe; });
/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing
 */ 


function $a3b6a59b8fbd0941$export$31dcd79391e423fe(// Unused but matches the normal signature.
_props, _state, ref) {
    let [isSelected, setSelected] = (0, $TNch7$react.useState)(false);
    (0, $6e76e65001bbcda2$exports.useEvent)((0, $TNch7$react.useRef)(typeof document !== 'undefined' ? document : null), 'selectionchange', ()=>{
        let selection = window.getSelection();
        if (!selection || !ref.current) return;
        let range = selection.rangeCount === 0 ? null : selection.getRangeAt(0);
        if (!range?.collapsed && range?.intersectsNode(ref.current)) setSelected(true);
        else setSelected(false);
    });
    return {
        tokenProps: {
            contentEditable: false,
            suppressContentEditableWarning: true,
            style: {
                userSelect: 'all',
                WebkitUserSelect: 'all',
                WebkitTapHighlightColor: 'transparent'
            },
            onClick (e) {
                // Select the token when a screen reader clicks on it.
                if (isSelected || !(0, $8f130d4aeb0f65e8$exports.isVirtualClick)(e.nativeEvent)) return;
                let selection = window.getSelection();
                let wrapper = ref.current?.parentElement;
                if (!selection || !wrapper) return;
                let range = document.createRange();
                range.setStartBefore(wrapper);
                range.setEndAfter(wrapper);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        },
        isSelected: isSelected
    };
}


//# sourceMappingURL=useToken.cjs.map
