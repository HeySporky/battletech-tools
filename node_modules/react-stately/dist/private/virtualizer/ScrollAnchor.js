import {Rect as $546350db2c358941$export$c79fc6492f3af13d} from "./Rect.js";

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
/**
 * Minimum overlap an item must have with the viewport, along the scroll axis,
 * to be eligible as a scroll anchor. Without this, an item that only overlaps the viewport
 * by a sliver (e.g. 1px, essentially scrolled out of view) can still "win" the anchor
 * tie-break over a substantially visible item.
 */ const $20fe89c1b1ab405a$var$MIN_ANCHOR_OVERLAP = 4;
function $20fe89c1b1ab405a$var$dimensionForAxis(axis) {
    return axis === 'x' ? 'width' : 'height';
}
function $20fe89c1b1ab405a$export$413719533c5919c9(anchor, axis, getLayoutInfo, visibleRect, contentSize) {
    let finalInfo = getLayoutInfo(anchor.key);
    if (!finalInfo) return null;
    let adjustment = finalInfo.rect[anchor.corner][axis] - visibleRect[axis] - anchor.offset;
    if (adjustment === 0) return null;
    let target = visibleRect[axis] + adjustment;
    let dimension = $20fe89c1b1ab405a$var$dimensionForAxis(axis);
    let max = Math.max(0, contentSize[dimension] - visibleRect[dimension]);
    let clamped = Math.max(0, Math.min(max, target));
    return clamped !== visibleRect[axis] ? clamped : null;
}
function $20fe89c1b1ab405a$export$69fb4c6de5f339b7(edge, axis, visibleRect, visibleLayoutInfos, isAnchorable = ()=>true) {
    let dimension = $20fe89c1b1ab405a$var$dimensionForAxis(axis);
    let best = null;
    for (let [key, layoutInfo] of visibleLayoutInfos){
        if (!layoutInfo || !isAnchorable(layoutInfo)) continue;
        let overlap = layoutInfo.rect.intersection(visibleRect)[dimension];
        if (layoutInfo.rect.area > 0 && overlap >= $20fe89c1b1ab405a$var$MIN_ANCHOR_OVERLAP) {
            var _layoutInfo_rect_getCornerInRect;
            let corner = (_layoutInfo_rect_getCornerInRect = layoutInfo.rect.getCornerInRect(visibleRect)) !== null && _layoutInfo_rect_getCornerInRect !== void 0 ? _layoutInfo_rect_getCornerInRect : 'topLeft';
            let offset = layoutInfo.rect[corner][axis] - visibleRect[axis];
            let isBetter = !best || (edge === 'end' ? offset < best.offset : offset > best.offset);
            if (isBetter) best = {
                key: key,
                corner: corner,
                offset: offset
            };
        }
    }
    return best;
}
function $20fe89c1b1ab405a$export$c74597e403428eac(edge, axis, contentSize, previousVisibleRect) {
    if (edge === 'start') return 0;
    let dimension = $20fe89c1b1ab405a$var$dimensionForAxis(axis);
    return Math.max(0, contentSize[dimension] - previousVisibleRect[dimension]);
}
function $20fe89c1b1ab405a$export$f644bffd4937530e(visibleRect, contentSize, edge, axis, threshold) {
    if (edge === 'start') return visibleRect[axis] <= threshold;
    let dimension = $20fe89c1b1ab405a$var$dimensionForAxis(axis);
    let distanceFromEnd = contentSize[dimension] - (visibleRect[axis] + visibleRect[dimension]);
    return distanceFromEnd <= threshold;
}
function $20fe89c1b1ab405a$export$dcb80b718ca193d7(edge, axis, anchor, wasNearAnchorEdge, isScrolling, itemSizeChanged, contentSizeDelta, getLayoutInfo, previousVisibleRect, contentSize) {
    let withTarget = (target)=>axis === 'x' ? new (0, $546350db2c358941$export$c79fc6492f3af13d)(target, previousVisibleRect.y, previousVisibleRect.width, previousVisibleRect.height) : new (0, $546350db2c358941$export$c79fc6492f3af13d)(previousVisibleRect.x, target, previousVisibleRect.width, previousVisibleRect.height);
    if (anchor) {
        let target = $20fe89c1b1ab405a$export$413719533c5919c9(anchor, axis, getLayoutInfo, previousVisibleRect, contentSize);
        if (target != null) return withTarget(target);
    }
    if (wasNearAnchorEdge && !isScrolling && (!itemSizeChanged || contentSizeDelta > 0)) {
        let target = withTarget($20fe89c1b1ab405a$export$c74597e403428eac(edge, axis, contentSize, previousVisibleRect));
        return target.equals(previousVisibleRect) ? null : target;
    }
    return null;
}
class $20fe89c1b1ab405a$export$8ce0fdedc36cb6b {
    /** Resets all tracked state, e.g. when the virtualizer's layout instance changes. */ reset() {
        this.hasSnappedToEdge = false;
        this.hadEstimatedVisibleItems = false;
        this.wasNearAnchorEdge = false;
    }
    /**
   * Captures the anchor from pre-layout view positions.
   */ captureBeforeLayout(anchorInfo, preLayoutInfos, visibleRect) {
        if (!anchorInfo) return null;
        return $20fe89c1b1ab405a$export$69fb4c6de5f339b7(anchorInfo.edge, anchorInfo.axis, visibleRect, preLayoutInfos, anchorInfo.isAnchorable);
    }
    /**
   * Runs the full post-layout decision: updates the tracked state for the next pass, and
   * returns the resolved scroll target, or null if nothing should change.
   */ resolveAfterLayout(options) {
        let { anchorInfo: anchorInfo, anchor: anchor, postLayoutInfos: postLayoutInfos, previousVisibleRect: previousVisibleRect, previousContentSize: previousContentSize, contentSize: contentSize, itemSizeChanged: itemSizeChanged, isScrolling: isScrolling, getLayoutInfo: getLayoutInfo } = options;
        if (!anchorInfo) return null;
        // Read the previous pass's state into locals before any writes below overwrite it.
        let wasSettlingLastPass = this.hadEstimatedVisibleItems;
        let wasNearAnchorEdgeLastPass = this.wasNearAnchorEdge;
        let hasEstimated = false;
        for (let layoutInfo of postLayoutInfos.values())if (layoutInfo.estimatedSize) {
            hasEstimated = true;
            break;
        }
        this.hadEstimatedVisibleItems = hasEstimated;
        // Don't recheck "near edge?" mid-resize because it could look like a scroll that never happened.
        // Reuse the answer from before the resizing started.
        if (!wasSettlingLastPass) this.wasNearAnchorEdge = $20fe89c1b1ab405a$export$f644bffd4937530e(previousVisibleRect, previousContentSize, anchorInfo.edge, anchorInfo.axis, anchorInfo.threshold);
        if (previousVisibleRect.area === 0) return null;
        let dimension = anchorInfo.axis === 'x' ? 'width' : 'height';
        let contentSizeDelta = contentSize[dimension] - previousContentSize[dimension];
        let isFirstAnchoredLayout = !this.hasSnappedToEdge;
        this.hasSnappedToEdge = true;
        // Only modify scroll when content actually changed (or this is the first layout, which always snaps)
        if (!(isFirstAnchoredLayout || contentSizeDelta !== 0 || itemSizeChanged)) return null;
        let wasNearAnchorEdge = isFirstAnchoredLayout || wasSettlingLastPass && wasNearAnchorEdgeLastPass || $20fe89c1b1ab405a$export$f644bffd4937530e(previousVisibleRect, previousContentSize, anchorInfo.edge, anchorInfo.axis, anchorInfo.threshold);
        // A first-ever layout always snaps to the edge, even if the raw distance check says
        // otherwise. Save that real decision here so later passes in this cascade reuse it.
        if (!wasSettlingLastPass) this.wasNearAnchorEdge = wasNearAnchorEdge;
        // Skip restoring to the captured anchor while still resizing because items above it are also still growing,
        // and following it would fall short of the edge.
        let effectiveAnchor = isFirstAnchoredLayout || wasSettlingLastPass && wasNearAnchorEdgeLastPass ? null : anchor;
        return $20fe89c1b1ab405a$export$dcb80b718ca193d7(anchorInfo.edge, anchorInfo.axis, effectiveAnchor, wasNearAnchorEdge, isScrolling, itemSizeChanged, contentSizeDelta, getLayoutInfo, previousVisibleRect, contentSize);
    }
    constructor(){
        this.hasSnappedToEdge = false;
        this.hadEstimatedVisibleItems = false;
        this.wasNearAnchorEdge = false;
    }
}


export {$20fe89c1b1ab405a$export$413719533c5919c9 as computeScrollAnchorTarget, $20fe89c1b1ab405a$export$69fb4c6de5f339b7 as captureScrollAnchor, $20fe89c1b1ab405a$export$c74597e403428eac as getEdgeSnapTarget, $20fe89c1b1ab405a$export$f644bffd4937530e as isNearEdge, $20fe89c1b1ab405a$export$dcb80b718ca193d7 as resolveScrollAdjustment, $20fe89c1b1ab405a$export$8ce0fdedc36cb6b as ScrollAnchorTracker};
//# sourceMappingURL=ScrollAnchor.js.map
