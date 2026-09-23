import { RefObject } from '@react-types/shared';
interface SafeAreaOptions {
    /** Ref for the trigger element. */
    triggerRef: RefObject<Element | null>;
    /** Ref for the overlay element. */
    overlayRef: RefObject<Element | null>;
    /** Whether the overlay is open. */
    isOpen: boolean;
    /** Whether this feature is disabled. */
    isDisabled?: boolean;
    /**
     * Called on pointer move (and when the pointer leaves the document) with whether the pointer is
     * currently within the "safe area" — the trigger, the overlay, or the region between them. This
     * lets an overlay stay open while the pointer travels from the trigger to the overlay, even
     * diagonally and regardless of placement.
     */
    onSafeAreaChange: (isInSafeArea: boolean) => void;
}
/**
 * Tracks whether the pointer is within a "safe area" connecting a trigger and its overlay, so the
 * overlay can stay open while the pointer moves between them. The safe area is the union of the
 * trigger rect, the overlay rect, and the convex hull connecting the two (a polygon), which works
 * for any placement of the overlay relative to the trigger.
 */
export declare function useSafeArea(options: SafeAreaOptions): void;
export {};
