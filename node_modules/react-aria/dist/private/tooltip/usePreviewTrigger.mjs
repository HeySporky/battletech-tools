import {focusWithoutScrolling as $1969ac565cfec8d0$export$de79e2c695e052f3} from "../utils/focusWithoutScrolling.mjs";
import {getActiveElement as $23f2114a1b82827e$export$cd4e5573fbe2b576, nodeContains as $23f2114a1b82827e$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.mjs";
import {getFocusableTreeWalker as $535772f9d2c1f38d$export$2d6ec8fc375ceafa} from "../focus/FocusScope.mjs";
import {getInteractionModality as $8f5a2122b0992be3$export$630ff653c5ada6a9, useFocusVisibleListener as $8f5a2122b0992be3$export$ec71b4b83ac08ec3, useInteractionModality as $8f5a2122b0992be3$export$98e20ec92f614cfe} from "../interactions/useFocusVisible.mjs";
import {getOwnerDocument as $d447af545b77c9f1$export$b204af158042fbac} from "../utils/domHelpers.mjs";
import $cuAD7$intlStringsmjs from "./intlStrings.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useEffectEvent as $fe16bffc7a557bf0$export$7f54fc3180508a52} from "../utils/useEffectEvent.mjs";
import {useEvent as $600b3cf69ae46262$export$90fc3a17d93f704c} from "../utils/useEvent.mjs";
import {useHover as $e969f22b6713ca4a$export$ae780daf29e6d456} from "../interactions/useHover.mjs";
import {useId as $390e54f620492c70$export$f680877a34711e37} from "../utils/useId.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {useLongPress as $7b01448eaad0fe7c$export$c24ed0104d07eab9} from "../interactions/useLongPress.mjs";
import {useSafeArea as $80d0af5af0c3b3bd$export$c7bf694416f38471} from "./useSafeArea.mjs";
import {useRef as $cuAD7$useRef, useEffect as $cuAD7$useEffect} from "react";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
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














function $dab43360cbeb70e5$export$cfc4af0616336448(props, state) {
    let { triggerRef: triggerRef, popoverRef: popoverRef, isDisabled: isDisabled } = props;
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($cuAD7$intlStringsmjs))), '@react-aria/link-preview');
    let popoverId = (0, $390e54f620492c70$export$f680877a34711e37)();
    // Suppresses the next focus from reopening the preview (e.g. when restoring focus on Escape).
    let ignoreFocus = (0, $cuAD7$useRef)(false);
    // When opened via long press, move focus into the popover once it opens so touch screen readers
    // (e.g. VoiceOver) move their virtual cursor into the preview.
    let shouldFocusOnOpen = (0, $cuAD7$useRef)(false);
    // Whether the pointer is currently within the safe area (the trigger, the popover, or the region
    // between them). Tracked by useSafeArea below so the preview stays open while the pointer travels
    // from the link to the popover, even with closeDelay of 0.
    let pointerInSafeArea = (0, $cuAD7$useRef)(false);
    let isFocusVisible = (0, $cuAD7$useRef)(false);
    (0, $8f5a2122b0992be3$export$ec71b4b83ac08ec3)((visible)=>{
        isFocusVisible.current = visible;
    }, []);
    // Cancel a pending close and keep the preview open.
    let keepOpen = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)(()=>state.open(true));
    // Close the preview unless something is still keeping it open: the pointer is within the safe
    // area, or focus is within the trigger or popover. During focus transitions the active element
    // may briefly be the body; the popover's focusin handler re-opens in that case (focus moving in).
    let checkClose = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)(()=>{
        if (pointerInSafeArea.current) return;
        let active = triggerRef.current ? (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)((0, $d447af545b77c9f1$export$b204af158042fbac)(triggerRef.current)) : null;
        if (isFocusVisible.current && (triggerRef.current && (0, $23f2114a1b82827e$export$4282f70798064fe0)(triggerRef.current, active) || popoverRef.current && (0, $23f2114a1b82827e$export$4282f70798064fe0)(popoverRef.current, active))) return;
        state.close();
    });
    (0, $cuAD7$useEffect)(()=>{
        let popover = popoverRef.current;
        if (!state.isOpen || !popover || !shouldFocusOnOpen.current) return;
        // When opened via long press, move focus to the popover itself so touch screen readers move
        // their virtual cursor into the preview.
        shouldFocusOnOpen.current = false;
        (0, $1969ac565cfec8d0$export$de79e2c695e052f3)(popover);
    }, [
        state.isOpen,
        popoverRef
    ]);
    let onHoverStart = ()=>{
        // Match useTooltipTrigger: only treat as hovered when the modality is actually a pointer.
        if ((0, $8f5a2122b0992be3$export$630ff653c5ada6a9)() === 'pointer') {
            pointerInSafeArea.current = true;
            state.open();
        }
    };
    let onHoverEnd = ()=>{
        // Before the preview opens, cancel a pending warmup if the pointer leaves the trigger. Once
        // open, the safe-area polygon (useSafeArea) governs closing as the pointer moves to the popover.
        if (!state.isOpen) {
            pointerInSafeArea.current = false;
            state.close();
        }
    };
    let onTriggerFocus = (e)=>{
        if (ignoreFocus.current) {
            ignoreFocus.current = false;
            return;
        }
        // Prevent browser focusing the link on long press when focus is already in the popover.
        if (state.isOpen && e.relatedTarget === popoverRef.current) {
            (0, $1969ac565cfec8d0$export$de79e2c695e052f3)(popoverRef.current);
            return;
        }
        if (isFocusVisible.current) // Open after the warmup delay on keyboard focus, not immediately like a tooltip. This way
        // tabbing quickly through the page doesn't open previews (and add their tab stops); the
        // delay ensures the user is actually interested in the link's details.
        state.open();
    };
    (0, $600b3cf69ae46262$export$90fc3a17d93f704c)(triggerRef, 'react-aria-focus-scope-restore', (e)=>{
        e.preventDefault();
        ignoreFocus.current = true;
        triggerRef.current?.focus();
    });
    // Move focus from the link into the preview when the user presses Tab while it is open.
    // Tabbing back out of the popover is handled by the popover's own FocusScope.
    let onTriggerKeyDown = (e)=>{
        if (e.key === 'Tab' && !e.shiftKey && state.isOpen && popoverRef.current) {
            let walker = (0, $535772f9d2c1f38d$export$2d6ec8fc375ceafa)(popoverRef.current, {
                tabbable: true
            });
            let first = walker.nextNode();
            if (first) {
                e.preventDefault();
                first.focus();
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            state.close(true);
        }
    };
    let { hoverProps: hoverProps } = (0, $e969f22b6713ca4a$export$ae780daf29e6d456)({
        isDisabled: isDisabled,
        onHoverStart: onHoverStart,
        onHoverEnd: onHoverEnd
    });
    let focusableProps = {
        onFocus: onTriggerFocus,
        onBlur: checkClose,
        onKeyDown: onTriggerKeyDown
    };
    // Only describe the long press interaction when the user is actually using touch, otherwise it
    // is confusing (e.g. a screen reader announcing "long press" while navigating with a keyboard).
    // null is the default before the user has interacted with anything.
    let modality = (0, $8f5a2122b0992be3$export$98e20ec92f614cfe)();
    let shouldLongPress = (modality === 'pointer' || modality === 'virtual' || modality == null) && typeof window !== 'undefined' && 'ontouchstart' in window;
    // Open the preview on long press on touch devices, since there is no hover. Move focus into the
    // popover once it opens so touch screen readers (e.g. VoiceOver) move their virtual cursor in.
    let { longPressProps: longPressProps } = (0, $7b01448eaad0fe7c$export$c24ed0104d07eab9)({
        isDisabled: isDisabled,
        pointerType: 'touch',
        accessibilityDescription: shouldLongPress ? stringFormatter.format('longPressMessage') : undefined,
        onLongPress () {
            shouldFocusOnOpen.current = true;
            state.open(true);
        }
    });
    // Keep the preview open while the pointer is anywhere within the safe area connecting the link
    // and the popover, so moving the pointer between them (even diagonally) doesn't close it. This
    // works for any popover placement and even when closeDelay is 0.
    (0, $80d0af5af0c3b3bd$export$c7bf694416f38471)({
        triggerRef: triggerRef,
        overlayRef: popoverRef,
        isOpen: state.isOpen,
        isDisabled: isDisabled,
        onSafeAreaChange: (isInSafeArea)=>{
            if (isInSafeArea === pointerInSafeArea.current) return;
            pointerInSafeArea.current = isInSafeArea;
            if (isInSafeArea) keepOpen();
            else checkClose();
        }
    });
    // oxlint-disable-next-line react/react-compiler
    let triggerProps = (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(focusableProps, hoverProps, longPressProps);
    let describedBy = [
        triggerProps['aria-describedby'],
        state.isOpen ? popoverId : null
    ].filter(Boolean).join(' ');
    return {
        triggerProps: {
            ...triggerProps,
            'aria-haspopup': 'dialog',
            'aria-expanded': state.isOpen,
            'aria-controls': state.isOpen ? popoverId : undefined,
            'aria-describedby': describedBy || undefined,
            style: {
                WebkitTouchCallout: 'none',
                // @ts-ignore
                WebkitUserDrag: 'none'
            }
        },
        popoverProps: {
            id: popoverId,
            onFocusWithin: keepOpen,
            onBlurWithin: checkClose
        }
    };
}


export {$dab43360cbeb70e5$export$cfc4af0616336448 as usePreviewTrigger};
//# sourceMappingURL=usePreviewTrigger.mjs.map
