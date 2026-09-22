import {getOwnerDocument as $cc3c3666b64debad$export$b204af158042fbac, getOwnerWindow as $cc3c3666b64debad$export$f21a1ffae260145a} from "../utils/domHelpers.js";
import {useEffectEvent as $85567ef950781b7d$export$7f54fc3180508a52} from "../utils/useEffectEvent.js";
import {useEffect as $lMuEN$useEffect} from "react";

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
const $4ffb93780cd64f2c$var$PADDING = 8;
function $4ffb93780cd64f2c$export$c7bf694416f38471(options) {
    let { triggerRef: triggerRef, overlayRef: overlayRef, isOpen: isOpen, isDisabled: isDisabled } = options;
    let onSafeAreaChange = (0, $85567ef950781b7d$export$7f54fc3180508a52)(options.onSafeAreaChange);
    (0, $lMuEN$useEffect)(()=>{
        let trigger = triggerRef.current;
        if (isDisabled || !isOpen || !trigger) return;
        let onPointerMove = (e)=>{
            var _overlayRef_current;
            if (e.pointerType === 'touch') return;
            let point = {
                x: e.clientX,
                y: e.clientY
            };
            let triggerRect = trigger.getBoundingClientRect();
            let overlayRect = (_overlayRef_current = overlayRef.current) === null || _overlayRef_current === void 0 ? void 0 : _overlayRef_current.getBoundingClientRect();
            onSafeAreaChange($4ffb93780cd64f2c$var$isPointInSafeArea(point, triggerRect, overlayRect));
        };
        // If the pointer leaves the document entirely, it is no longer in the safe area.
        let onPointerLeave = ()=>onSafeAreaChange(false);
        let win = (0, $cc3c3666b64debad$export$f21a1ffae260145a)(trigger);
        let doc = (0, $cc3c3666b64debad$export$b204af158042fbac)(trigger);
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
function $4ffb93780cd64f2c$var$isPointInSafeArea(point, triggerRect, overlayRect) {
    if ($4ffb93780cd64f2c$var$rectContains(triggerRect, point)) return true;
    if (!overlayRect) return false;
    if ($4ffb93780cd64f2c$var$rectContains(overlayRect, point)) return true;
    // Otherwise, check whether the point is within the convex hull connecting the two rects.
    let hull = $4ffb93780cd64f2c$var$convexHull([
        ...$4ffb93780cd64f2c$var$rectCorners(triggerRect),
        ...$4ffb93780cd64f2c$var$rectCorners(overlayRect)
    ]);
    return hull.length >= 3 && $4ffb93780cd64f2c$var$isPointInPolygon(point, hull);
}
function $4ffb93780cd64f2c$var$rectContains(rect, point) {
    return point.x >= rect.left - $4ffb93780cd64f2c$var$PADDING && point.x <= rect.right + $4ffb93780cd64f2c$var$PADDING && point.y >= rect.top - $4ffb93780cd64f2c$var$PADDING && point.y <= rect.bottom + $4ffb93780cd64f2c$var$PADDING;
}
function $4ffb93780cd64f2c$var$rectCorners(rect) {
    let left = rect.left - $4ffb93780cd64f2c$var$PADDING;
    let right = rect.right + $4ffb93780cd64f2c$var$PADDING;
    let top = rect.top - $4ffb93780cd64f2c$var$PADDING;
    let bottom = rect.bottom + $4ffb93780cd64f2c$var$PADDING;
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
function $4ffb93780cd64f2c$var$convexHull(points) {
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
function $4ffb93780cd64f2c$var$isPointInPolygon(point, polygon) {
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


export {$4ffb93780cd64f2c$export$c7bf694416f38471 as useSafeArea};
//# sourceMappingURL=useSafeArea.js.map
