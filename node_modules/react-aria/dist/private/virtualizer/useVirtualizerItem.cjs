var $d0ea836c96ed0bf7$exports = require("../utils/isElementVisible.cjs");
var $d6e22460ce4d6b26$exports = require("../utils/useEffectEvent.cjs");
var $429333cab433657c$exports = require("../utils/useLayoutEffect.cjs");
var $f9e7u$reactstatelyuseVirtualizerState = require("react-stately/useVirtualizerState");
var $f9e7u$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useVirtualizerItem", function () { return $a2b3121359008119$export$1da781778207e0a2; });
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
 */ 




function $a2b3121359008119$export$1da781778207e0a2(options) {
    let { layoutInfo: layoutInfo, virtualizer: virtualizer, ref: ref, shouldObserveItemSize: shouldObserveItemSize } = options;
    let key = layoutInfo?.key;
    let updateSize = (0, $f9e7u$react.useCallback)(()=>{
        if (key != null && ref.current) {
            // if the virtualized item is not visible (aka display none on virtualized collection),
            // we want to avoid reporting size 0 otherwise we get into a state where the virtualizer renders 0 items
            // when it is hidden and thus won't remeasure when it is is unhidden
            if (!(0, $d0ea836c96ed0bf7$exports.isElementVisible)(ref.current)) return;
            let size = $a2b3121359008119$var$getSize(ref.current);
            virtualizer.updateItemSize(key, size);
        }
    }, [
        virtualizer,
        key,
        ref
    ]);
    let updateSizeEvent = (0, $d6e22460ce4d6b26$exports.useEffectEvent)(updateSize);
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        if (layoutInfo?.estimatedSize) updateSizeEvent();
    });
    // TODO: Consider using a MutationObserver in addition to ResizeObserver to detect
    // when inner DOM structure changes cause an item's height to change.
    // The current ResizeObserver only observes direct children,
    // so mutations deeper in the tree won't trigger a remeasure, leading to stale cached heights and overlapping items.
    // useResizeObserver observes one element via ref, but the wrapper height is fixed by layout
    // and won't change when content grows. Observe direct children instead, then remeasure the
    // wrapper in updateSize.
    (0, $f9e7u$react.useEffect)(()=>{
        if (!shouldObserveItemSize) return;
        let el = ref.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        let resizeObserver = new ResizeObserver((entries)=>{
            if (!entries.length) return;
            updateSizeEvent();
        });
        for (let child of el.children)resizeObserver.observe(child);
        return ()=>{
            resizeObserver.disconnect();
        };
    }, [
        shouldObserveItemSize,
        ref,
        key
    ]);
    return {
        updateSize: updateSize
    };
}
function $a2b3121359008119$var$getSize(node) {
    // Reset height before measuring so we get the intrinsic size
    let height = node.style.height;
    node.style.height = '';
    let size = new (0, $f9e7u$reactstatelyuseVirtualizerState.Size)(node.scrollWidth, node.scrollHeight);
    node.style.height = height;
    return size;
}


//# sourceMappingURL=useVirtualizerItem.cjs.map
