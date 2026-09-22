import { DOMAttributes, FocusableElement, RefObject } from '@react-types/shared';
import { AriaPopoverProps } from '../overlays/usePopover';
import { TooltipTriggerProps, TooltipTriggerState } from 'react-stately/useTooltipTriggerState';
export interface AriaPreviewTriggerProps extends Omit<TooltipTriggerProps, 'trigger' | 'shouldCloseOnPress'> {
}
export interface AriaPreviewTriggerOptions extends AriaPreviewTriggerProps {
    /** A ref to the trigger element (e.g. a Link). */
    triggerRef: RefObject<FocusableElement | null>;
    /** A ref to the popover element. */
    popoverRef: RefObject<Element | null>;
}
export interface PreviewTriggerTriggerAria {
    /**
     * Props for the trigger element (e.g. a Link).
     */
    triggerProps: DOMAttributes;
    /**
     * Props for the popover overlay element.
     */
    popoverProps: Omit<AriaPopoverProps, 'triggerRef' | 'popoverRef'> & DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a preview trigger.
 * A preview trigger displays a popover on hover, focus, or long press. Unlike a
 * tooltip, the popover may contain interactive content.
 */
export declare function usePreviewTrigger(props: AriaPreviewTriggerOptions, state: TooltipTriggerState): PreviewTriggerTriggerAria;
