import {isElementVisible as $ae77152785188400$export$e989c0fffaa6b27a} from "../utils/isElementVisible.mjs";
import {useEffectEvent as $fe16bffc7a557bf0$export$7f54fc3180508a52} from "../utils/useEffectEvent.mjs";
import {useLayoutEffect as $c4867b2f328c2698$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.mjs";
import {Size as $8najZ$Size} from "react-stately/useVirtualizerState";
import {useCallback as $8najZ$useCallback, useEffect as $8najZ$useEffect} from "react";

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




function $cd3854145620ec6a$export$1da781778207e0a2(options) {
    let { layoutInfo: layoutInfo, virtualizer: virtualizer, ref: ref, shouldObserveItemSize: shouldObserveItemSize } = options;
    let key = layoutInfo?.key;
    let updateSize = (0, $8najZ$useCallback)(()=>{
        if (key != null && ref.current) {
            // if the virtualized item is not visible (aka display none on virtualized collection),
            // we want to avoid reporting size 0 otherwise we get into a state where the virtualizer renders 0 items
            // when it is hidden and thus won't remeasure when it is is unhidden
            if (!(0, $ae77152785188400$export$e989c0fffaa6b27a)(ref.current)) return;
            let size = $cd3854145620ec6a$var$getSize(ref.current);
            virtualizer.updateItemSize(key, size);
        }
    }, [
        virtualizer,
        key,
        ref
    ]);
    let updateSizeEvent = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)(updateSize);
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        if (layoutInfo?.estimatedSize) updateSizeEvent();
    });
    // TODO: Consider using a MutationObserver in addition to ResizeObserver to detect
    // when inner DOM structure changes cause an item's height to change.
    // The current ResizeObserver only observes direct children,
    // so mutations deeper in the tree won't trigger a remeasure, leading to stale cached heights and overlapping items.
    // useResizeObserver observes one element via ref, but the wrapper height is fixed by layout
    // and won't change when content grows. Observe direct children instead, then remeasure the
    // wrapper in updateSize.
    (0, $8najZ$useEffect)(()=>{
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
function $cd3854145620ec6a$var$getSize(node) {
    // Reset height before measuring so we get the intrinsic size
    let height = node.style.height;
    node.style.height = '';
    let size = new (0, $8najZ$Size)(node.scrollWidth, node.scrollHeight);
    node.style.height = height;
    return size;
}


export {$cd3854145620ec6a$export$1da781778207e0a2 as useVirtualizerItem};
//# sourceMappingURL=useVirtualizerItem.mjs.map
