import { Key } from '@react-types/shared';
import { LayoutInfo } from './LayoutInfo';
import { Rect, RectCorner } from './Rect';
import { Size } from './Size';
export type ScrollAnchorAxis = 'x' | 'y';
export type ScrollAnchorEdge = 'start' | 'end';
export interface ScrollAnchor {
    key: Key;
    corner: RectCorner;
    offset: number;
}
export interface ScrollAnchorInfo {
    /** Which edge of the content the viewport should stay anchored to. */
    edge: 'start' | 'end';
    /** Which axis `edge` refers to — 'y' for vertical lists, 'x' for horizontal. */
    axis: 'x' | 'y';
    /** Distance (px) from `edge` within which the viewport is considered "following" it. */
    threshold: number;
    /**
     * Optional classifier excluding structural/ephemeral layout infos (e.g. loaders) from being
     * selected as the anchor. Defaults to allowing any layoutInfo.
     */
    isAnchorable?: (layoutInfo: LayoutInfo) => boolean;
}
/**
 * Given a previously-captured anchor, computes the new viewport coordinate (along `axis`) needed
 * to keep it at the same offset from the viewport's start.
 */
export declare function computeScrollAnchorTarget(anchor: ScrollAnchor, axis: ScrollAnchorAxis, getLayoutInfo: (key: Key) => LayoutInfo | null, visibleRect: Rect, contentSize: Size): number | null;
/**
 * Picks the item to anchor scroll to: the one nearest the top of the viewport when
 * anchoring to 'end', or nearest the bottom when anchoring to 'start'. Callers can
 * exclude certain items (like loaders) with `isAnchorable`.
 */
export declare function captureScrollAnchor(edge: ScrollAnchorEdge, axis: ScrollAnchorAxis, visibleRect: Rect, visibleLayoutInfos: Iterable<[Key, LayoutInfo]>, isAnchorable?: (layoutInfo: LayoutInfo) => boolean): ScrollAnchor | null;
/** Returns the viewport coordinate (along `axis`) that pins the viewport to `edge` of the content. */
export declare function getEdgeSnapTarget(edge: ScrollAnchorEdge, axis: ScrollAnchorAxis, contentSize: Size, previousVisibleRect: Rect): number;
/**
 * Whether the viewport is currently within `threshold` px of the anchored edge — used by
 * Virtualizer to compute wasNearAnchorEdge generically, without any layout-specific state.
 */
export declare function isNearEdge(visibleRect: Rect, contentSize: Size, edge: ScrollAnchorEdge, axis: ScrollAnchorAxis, threshold: number): boolean;
/**
 * Works out the new scroll position after content changes. Tries to keep the anchor
 * item where it was. If that doesn't apply, sticks the view to the edge instead, but
 * only if the user was already near the edge and didn't just scroll away on their own.
 */
export declare function resolveScrollAdjustment(edge: ScrollAnchorEdge, axis: ScrollAnchorAxis, anchor: ScrollAnchor | null, wasNearAnchorEdge: boolean, isScrolling: boolean, itemSizeChanged: boolean, contentSizeDelta: number, getLayoutInfo: (key: Key) => LayoutInfo | null, previousVisibleRect: Rect, contentSize: Size): Rect | null;
export interface ResolveAfterLayoutOptions {
    anchorInfo: ScrollAnchorInfo | null;
    /** The anchor captured by `captureBeforeLayout` before this pass's `layout.update()` ran. */
    anchor: ScrollAnchor | null;
    /** The full post-layout visible layout infos, i.e. `virtualizer.getVisibleLayoutInfos()`. */
    postLayoutInfos: Map<Key, LayoutInfo>;
    previousVisibleRect: Rect;
    previousContentSize: Size;
    contentSize: Size;
    itemSizeChanged: boolean;
    isScrolling: boolean;
    getLayoutInfo: (key: Key) => LayoutInfo | null;
}
/**
 * Tracks the cross-pass state needed to keep the viewport anchored to a layout's edge across
 * relayouts.
 */
export declare class ScrollAnchorTracker {
    private hasSnappedToEdge;
    private hadEstimatedVisibleItems;
    private wasNearAnchorEdge;
    /** Resets all tracked state, e.g. when the virtualizer's layout instance changes. */
    reset(): void;
    /**
     * Captures the anchor from pre-layout view positions.
     */
    captureBeforeLayout(anchorInfo: ScrollAnchorInfo | null, preLayoutInfos: Iterable<[Key, LayoutInfo]>, visibleRect: Rect): ScrollAnchor | null;
    /**
     * Runs the full post-layout decision: updates the tracked state for the next pass, and
     * returns the resolved scroll target, or null if nothing should change.
     */
    resolveAfterLayout(options: ResolveAfterLayoutOptions): Rect | null;
}
