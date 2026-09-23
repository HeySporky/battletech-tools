import {getOwnerDocument as $d447af545b77c9f1$export$b204af158042fbac, getOwnerWindow as $d447af545b77c9f1$export$f21a1ffae260145a} from "../utils/domHelpers.mjs";
import {useEffectEvent as $fe16bffc7a557bf0$export$7f54fc3180508a52} from "../utils/useEffectEvent.mjs";
import {useEffect as $eNJV9$useEffect} from "react";

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
const $80d0af5af0c3b3bd$var$PADDING = 8;
function $80d0af5af0c3b3bd$export$c7bf694416f38471(options) {
    let { triggerRef: triggerRef, overlayRef: overlayRef, isOpen: isOpen, isDisabled: isDisabled } = options;
    let onSafeAreaChange = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)(options.onSafeAreaChange);
    (0, $eNJV9$useEffect)(()=>{
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
            onSafeAreaChange($80d0af5af0c3b3bd$var$isPointInSafeArea(point, triggerRect, overlayRect));
        };
        // If the pointer leaves the document entirely, it is no longer in the safe area.
        let onPointerLeave = ()=>onSafeAreaChange(false);
        let win = (0, $d447af545b77c9f1$export$f21a1ffae260145a)(trigger);
        let doc = (0, $d447af545b77c9f1$export$b204af158042fbac)(trigger);
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
function $80d0af5af0c3b3bd$var$isPointInSafeArea(point, triggerRect, overlayRect) {
    if ($80d0af5af0c3b3bd$var$rectContains(triggerRect, point)) return true;
    if (!overlayRect) return false;
    if ($80d0af5af0c3b3bd$var$rectContains(overlayRect, point)) return true;
    // Otherwise, check whether the point is within the convex hull connecting the two rects.
    let hull = $80d0af5af0c3b3bd$var$convexHull([
        ...$80d0af5af0c3b3bd$var$rectCorners(triggerRect),
        ...$80d0af5af0c3b3bd$var$rectCorners(overlayRect)
    ]);
    return hull.length >= 3 && $80d0af5af0c3b3bd$var$isPointInPolygon(point, hull);
}
function $80d0af5af0c3b3bd$var$rectContains(rect, point) {
    return point.x >= rect.left - $80d0af5af0c3b3bd$var$PADDING && point.x <= rect.right + $80d0af5af0c3b3bd$var$PADDING && point.y >= rect.top - $80d0af5af0c3b3bd$var$PADDING && point.y <= rect.bottom + $80d0af5af0c3b3bd$var$PADDING;
}
function $80d0af5af0c3b3bd$var$rectCorners(rect) {
    let left = rect.left - $80d0af5af0c3b3bd$var$PADDING;
    let right = rect.right + $80d0af5af0c3b3bd$var$PADDING;
    let top = rect.top - $80d0af5af0c3b3bd$var$PADDING;
    let bottom = rect.bottom + $80d0af5af0c3b3bd$var$PADDING;
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
function $80d0af5af0c3b3bd$var$convexHull(points) {
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
function $80d0af5af0c3b3bd$var$isPointInPolygon(point, polygon) {
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


export {$80d0af5af0c3b3bd$export$c7bf694416f38471 as useSafeArea};
//# sourceMappingURL=useSafeArea.mjs.map
