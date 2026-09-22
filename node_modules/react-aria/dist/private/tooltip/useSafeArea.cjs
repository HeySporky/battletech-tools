var $49582955cc364b1c$exports = require("../utils/domHelpers.cjs");
var $d6e22460ce4d6b26$exports = require("../utils/useEffectEvent.cjs");
var $ipEYR$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useSafeArea", function () { return $410abcf732b250aa$export$c7bf694416f38471; });
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


// A small amount of padding (in pixels) added around the trigger and overlay so the safe area is
// slightly forgiving of sub-pixel jitter and the gap between the elements.
const $410abcf732b250aa$var$PADDING = 8;
function $410abcf732b250aa$export$c7bf694416f38471(options) {
    let { triggerRef: triggerRef, overlayRef: overlayRef, isOpen: isOpen, isDisabled: isDisabled } = options;
    let onSafeAreaChange = (0, $d6e22460ce4d6b26$exports.useEffectEvent)(options.onSafeAreaChange);
    (0, $ipEYR$react.useEffect)(()=>{
        let trigger = triggerRef.current;
        if (isDisabled || !isOpen || !trigger) return;
        let onPointerMove = (e)=>{
            if (e.pointerType === 'touch') return;
            let point = {
                x: e.clientX,
                y: e.clientY
            };
            let triggerRect = trigger.getBoundingClientRect();
            let overlayRect = overlayRef.current?.getBoundingClientRect();
            onSafeAreaChange($410abcf732b250aa$var$isPointInSafeArea(point, triggerRect, overlayRect));
        };
        // If the pointer leaves the document entirely, it is no longer in the safe area.
        let onPointerLeave = ()=>onSafeAreaChange(false);
        let win = (0, $49582955cc364b1c$exports.getOwnerWindow)(trigger);
        let doc = (0, $49582955cc364b1c$exports.getOwnerDocument)(trigger);
        win.addEventListener('pointermove', onPointerMove);
        doc.documentElement.addEventListener('pointerleave', onPointerLeave);
        return ()=>{
            win.removeEventListener('pointermove', onPointerMove);
            doc.documentElement.removeEventListener('pointerleave', onPointerLeave);
        };
    }, [
        isDisabled,
        isOpen,
        triggerRef,
        overlayRef
    ]);
}
function $410abcf732b250aa$var$isPointInSafeArea(point, triggerRect, overlayRect) {
    if ($410abcf732b250aa$var$rectContains(triggerRect, point)) return true;
    if (!overlayRect) return false;
    if ($410abcf732b250aa$var$rectContains(overlayRect, point)) return true;
    // Otherwise, check whether the point is within the convex hull connecting the two rects.
    let hull = $410abcf732b250aa$var$convexHull([
        ...$410abcf732b250aa$var$rectCorners(triggerRect),
        ...$410abcf732b250aa$var$rectCorners(overlayRect)
    ]);
    return hull.length >= 3 && $410abcf732b250aa$var$isPointInPolygon(point, hull);
}
function $410abcf732b250aa$var$rectContains(rect, point) {
    return point.x >= rect.left - $410abcf732b250aa$var$PADDING && point.x <= rect.right + $410abcf732b250aa$var$PADDING && point.y >= rect.top - $410abcf732b250aa$var$PADDING && point.y <= rect.bottom + $410abcf732b250aa$var$PADDING;
}
function $410abcf732b250aa$var$rectCorners(rect) {
    let left = rect.left - $410abcf732b250aa$var$PADDING;
    let right = rect.right + $410abcf732b250aa$var$PADDING;
    let top = rect.top - $410abcf732b250aa$var$PADDING;
    let bottom = rect.bottom + $410abcf732b250aa$var$PADDING;
    return [
        {
            x: left,
            y: top
        },
        {
            x: right,
            y: top
        },
        {
            x: right,
            y: bottom
        },
        {
            x: left,
            y: bottom
        }
    ];
}
// Computes the convex hull of a set of points using the monotone chain algorithm.
function $410abcf732b250aa$var$convexHull(points) {
    let sorted = points.slice().sort((a, b)=>a.x - b.x || a.y - b.y);
    if (sorted.length < 3) return sorted;
    let cross = (o, a, b)=>(a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    let lower = [];
    for (let p of sorted){
        while(lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)lower.pop();
        lower.push(p);
    }
    let upper = [];
    for(let i = sorted.length - 1; i >= 0; i--){
        let p = sorted[i];
        while(upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)upper.pop();
        upper.push(p);
    }
    lower.pop();
    upper.pop();
    return lower.concat(upper);
}
// Ray casting point-in-polygon test.
function $410abcf732b250aa$var$isPointInPolygon(point, polygon) {
    let { x: x, y: y } = point;
    let inside = false;
    for(let i = 0, j = polygon.length - 1; i < polygon.length; j = i++){
        let xi = polygon[i].x;
        let yi = polygon[i].y;
        let xj = polygon[j].x;
        let yj = polygon[j].y;
        let intersect = yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}


//# sourceMappingURL=useSafeArea.cjs.map
