import {focusWithoutScrolling as $d559d872031c749f$export$de79e2c695e052f3} from "../utils/focusWithoutScrolling.js";
import {getActiveElement as $d8ac7ed472840322$export$cd4e5573fbe2b576, nodeContains as $d8ac7ed472840322$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.js";
import {getFocusableTreeWalker as $903814aeb7d53b38$export$2d6ec8fc375ceafa} from "../focus/FocusScope.js";
import {getInteractionModality as $b50b1cc8a843ace7$export$630ff653c5ada6a9, useFocusVisibleListener as $b50b1cc8a843ace7$export$ec71b4b83ac08ec3, useInteractionModality as $b50b1cc8a843ace7$export$98e20ec92f614cfe} from "../interactions/useFocusVisible.js";
import {getOwnerDocument as $cc3c3666b64debad$export$b204af158042fbac} from "../utils/domHelpers.js";
import $gQzfJ$intlStringsjs from "./intlStrings.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useEffectEvent as $85567ef950781b7d$export$7f54fc3180508a52} from "../utils/useEffectEvent.js";
import {useEvent as $c3cab330536504ec$export$90fc3a17d93f704c} from "../utils/useEvent.js";
import {useHover as $f7f05710dfc01c4c$export$ae780daf29e6d456} from "../interactions/useHover.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {useLongPress as $4a63d38d4cd3f004$export$c24ed0104d07eab9} from "../interactions/useLongPress.js";
import {useSafeArea as $4ffb93780cd64f2c$export$c7bf694416f38471} from "./useSafeArea.js";
import {useRef as $gQzfJ$useRef, useEffect as $gQzfJ$useEffect} from "react";


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














function $acf876daf361d659$export$cfc4af0616336448(props, state) {
    let { triggerRef: triggerRef, popoverRef: popoverRef, isDisabled: isDisabled } = props;
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($gQzfJ$intlStringsjs))), '@react-aria/link-preview');
    let popoverId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    // Suppresses the next focus from reopening the preview (e.g. when restoring focus on Escape).
    let ignoreFocus = (0, $gQzfJ$useRef)(false);
    // When opened via long press, move focus into the popover once it opens so touch screen readers
    // (e.g. VoiceOver) move their virtual cursor into the preview.
    let shouldFocusOnOpen = (0, $gQzfJ$useRef)(false);
    // Whether the pointer is currently within the safe area (the trigger, the popover, or the region
    // between them). Tracked by useSafeArea below so the preview stays open while the pointer travels
    // from the link to the popover, even with closeDelay of 0.
    let pointerInSafeArea = (0, $gQzfJ$useRef)(false);
    let isFocusVisible = (0, $gQzfJ$useRef)(false);
    (0, $b50b1cc8a843ace7$export$ec71b4b83ac08ec3)((visible)=>{
        isFocusVisible.current = visible;
    }, []);
    // Cancel a pending close and keep the preview open.
    let keepOpen = (0, $85567ef950781b7d$export$7f54fc3180508a52)(()=>state.open(true));
    // Close the preview unless something is still keeping it open: the pointer is within the safe
    // area, or focus is within the trigger or popover. During focus transitions the active element
    // may briefly be the body; the popover's focusin handler re-opens in that case (focus moving in).
    let checkClose = (0, $85567ef950781b7d$export$7f54fc3180508a52)(()=>{
        if (pointerInSafeArea.current) return;
        let active = triggerRef.current ? (0, $d8ac7ed472840322$export$cd4e5573fbe2b576)((0, $cc3c3666b64debad$export$b204af158042fbac)(triggerRef.current)) : null;
        if (isFocusVisible.current && (triggerRef.current && (0, $d8ac7ed472840322$export$4282f70798064fe0)(triggerRef.current, active) || popoverRef.current && (0, $d8ac7ed472840322$export$4282f70798064fe0)(popoverRef.current, active))) return;
        state.close();
    });
    (0, $gQzfJ$useEffect)(()=>{
        let popover = popoverRef.current;
        if (!state.isOpen || !popover || !shouldFocusOnOpen.current) return;
        // When opened via long press, move focus to the popover itself so touch screen readers move
        // their virtual cursor into the preview.
        shouldFocusOnOpen.current = false;
        (0, $d559d872031c749f$export$de79e2c695e052f3)(popover);
    }, [
        state.isOpen,
        popoverRef
    ]);
    let onHoverStart = ()=>{
        // Match useTooltipTrigger: only treat as hovered when the modality is actually a pointer.
        if ((0, $b50b1cc8a843ace7$export$630ff653c5ada6a9)() === 'pointer') {
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
            (0, $d559d872031c749f$export$de79e2c695e052f3)(popoverRef.current);
            return;
        }
        if (isFocusVisible.current) // Open after the warmup delay on keyboard focus, not immediately like a tooltip. This way
        // tabbing quickly through the page doesn't open previews (and add their tab stops); the
        // delay ensures the user is actually interested in the link's details.
        state.open();
    };
    (0, $c3cab330536504ec$export$90fc3a17d93f704c)(triggerRef, 'react-aria-focus-scope-restore', (e)=>{
        var _triggerRef_current;
        e.preventDefault();
        ignoreFocus.current = true;
        (_triggerRef_current = triggerRef.current) === null || _triggerRef_current === void 0 ? void 0 : _triggerRef_current.focus();
    });
    // Move focus from the link into the preview when the user presses Tab while it is open.
    // Tabbing back out of the popover is handled by the popover's own FocusScope.
    let onTriggerKeyDown = (e)=>{
        if (e.key === 'Tab' && !e.shiftKey && state.isOpen && popoverRef.current) {
            let walker = (0, $903814aeb7d53b38$export$2d6ec8fc375ceafa)(popoverRef.current, {
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
    let { hoverProps: hoverProps } = (0, $f7f05710dfc01c4c$export$ae780daf29e6d456)({
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
    let modality = (0, $b50b1cc8a843ace7$export$98e20ec92f614cfe)();
    let shouldLongPress = (modality === 'pointer' || modality === 'virtual' || modality == null) && typeof window !== 'undefined' && 'ontouchstart' in window;
    // Open the preview on long press on touch devices, since there is no hover. Move focus into the
    // popover once it opens so touch screen readers (e.g. VoiceOver) move their virtual cursor in.
    let { longPressProps: longPressProps } = (0, $4a63d38d4cd3f004$export$c24ed0104d07eab9)({
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
    (0, $4ffb93780cd64f2c$export$c7bf694416f38471)({
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
    let triggerProps = (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(focusableProps, hoverProps, longPressProps);
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


export {$acf876daf361d659$export$cfc4af0616336448 as usePreviewTrigger};
//# sourceMappingURL=usePreviewTrigger.js.map
