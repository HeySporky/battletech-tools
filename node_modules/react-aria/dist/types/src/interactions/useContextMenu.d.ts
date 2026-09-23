import { HTMLAttributes } from 'react';
export interface ContextMenuEvent {
    /** The target element on which the event was triggered. */
    target: Element;
    /** X position relative to the target. */
    x: number;
    /** Y position relative to the target. */
    y: number;
}
export interface ContextMenuProps {
    /** Event that is called when a context menu is triggered. */
    onContextMenu?: (e: ContextMenuEvent) => void;
}
export interface ContextMenuAria {
    /** Props to spread on the target element. */
    contextMenuProps: HTMLAttributes<HTMLElement>;
}
/**
 * Handles context menu events across mouse, touch, keyboard, and screen reader interactions.
 */
export declare function useContextMenu(props: ContextMenuProps): ContextMenuAria;
