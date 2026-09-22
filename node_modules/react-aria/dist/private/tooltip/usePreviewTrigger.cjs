var $4b9e9ed3f006ad27$exports = require("../utils/focusWithoutScrolling.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $9fb4ac1cc58342cc$exports = require("../focus/FocusScope.cjs");
var $d0df89f3abe2c2ca$exports = require("../interactions/useFocusVisible.cjs");
var $49582955cc364b1c$exports = require("../utils/domHelpers.cjs");
var $c504f9ba4be67faf$exports = require("./intlStrings.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $d6e22460ce4d6b26$exports = require("../utils/useEffectEvent.cjs");
var $6e76e65001bbcda2$exports = require("../utils/useEvent.cjs");
var $eb87b11bb9010ec1$exports = require("../interactions/useHover.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $8615756fee3bdacc$exports = require("../interactions/useLongPress.cjs");
var $410abcf732b250aa$exports = require("./useSafeArea.cjs");
var $exBAa$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "usePreviewTrigger", function () { return $f380572484cf16a5$export$cfc4af0616336448; });
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














function $f380572484cf16a5$export$cfc4af0616336448(props, state) {
    let { triggerRef: triggerRef, popoverRef: popoverRef, isDisabled: isDisabled } = props;
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($c504f9ba4be67faf$exports))), '@react-aria/link-preview');
    let popoverId = (0, $7ac82d1fee77eb8a$exports.useId)();
    // Suppresses the next focus from reopening the preview (e.g. when restoring focus on Escape).
    let ignoreFocus = (0, $exBAa$react.useRef)(false);
    // When opened via long press, move focus into the popover once it opens so touch screen readers
    // (e.g. VoiceOver) move their virtual cursor into the preview.
    let shouldFocusOnOpen = (0, $exBAa$react.useRef)(false);
    // Whether the pointer is currently within the safe area (the trigger, the popover, or the region
    // between them). Tracked by useSafeArea below so the preview stays open while the pointer travels
    // from the link to the popover, even with closeDelay of 0.
    let pointerInSafeArea = (0, $exBAa$react.useRef)(false);
    let isFocusVisible = (0, $exBAa$react.useRef)(false);
    (0, $d0df89f3abe2c2ca$exports.useFocusVisibleListener)((visible)=>{
        isFocusVisible.current = visible;
    }, []);
    // Cancel a pending close and keep the preview open.
    let keepOpen = (0, $d6e22460ce4d6b26$exports.useEffectEvent)(()=>state.open(true));
    // Close the preview unless something is still keeping it open: the pointer is within the safe
    // area, or focus is within the trigger or popover. During focus transitions the active element
    // may briefly be the body; the popover's focusin handler re-opens in that case (focus moving in).
    let checkClose = (0, $d6e22460ce4d6b26$exports.useEffectEvent)(()=>{
        if (pointerInSafeArea.current) return;
        let active = triggerRef.current ? (0, $da02ee888921bc9e$exports.getActiveElement)((0, $49582955cc364b1c$exports.getOwnerDocument)(triggerRef.current)) : null;
        if (isFocusVisible.current && (triggerRef.current && (0, $da02ee888921bc9e$exports.nodeContains)(triggerRef.current, active) || popoverRef.current && (0, $da02ee888921bc9e$exports.nodeContains)(popoverRef.current, active))) return;
        state.close();
    });
    (0, $exBAa$react.useEffect)(()=>{
        let popover = popoverRef.current;
        if (!state.isOpen || !popover || !shouldFocusOnOpen.current) return;
        // When opened via long press, move focus to the popover itself so touch screen readers move
        // their virtual cursor into the preview.
        shouldFocusOnOpen.current = false;
        (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(popover);
    }, [
        state.isOpen,
        popoverRef
    ]);
    let onHoverStart = ()=>{
        // Match useTooltipTrigger: only treat as hovered when the modality is actually a pointer.
        if ((0, $d0df89f3abe2c2ca$exports.getInteractionModality)() === 'pointer') {
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
            (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(popoverRef.current);
            return;
        }
        if (isFocusVisible.current) // Open after the warmup delay on keyboard focus, not immediately like a tooltip. This way
        // tabbing quickly through the page doesn't open previews (and add their tab stops); the
        // delay ensures the user is actually interested in the link's details.
        state.open();
    };
    (0, $6e76e65001bbcda2$exports.useEvent)(triggerRef, 'react-aria-focus-scope-restore', (e)=>{
        e.preventDefault();
        ignoreFocus.current = true;
        triggerRef.current?.focus();
    });
    // Move focus from the link into the preview when the user presses Tab while it is open.
    // Tabbing back out of the popover is handled by the popover's own FocusScope.
    let onTriggerKeyDown = (e)=>{
        if (e.key === 'Tab' && !e.shiftKey && state.isOpen && popoverRef.current) {
            let walker = (0, $9fb4ac1cc58342cc$exports.getFocusableTreeWalker)(popoverRef.current, {
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
    let { hoverProps: hoverProps } = (0, $eb87b11bb9010ec1$exports.useHover)({
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
    let modality = (0, $d0df89f3abe2c2ca$exports.useInteractionModality)();
    let shouldLongPress = (modality === 'pointer' || modality === 'virtual' || modality == null) && typeof window !== 'undefined' && 'ontouchstart' in window;
    // Open the preview on long press on touch devices, since there is no hover. Move focus into the
    // popover once it opens so touch screen readers (e.g. VoiceOver) move their virtual cursor in.
    let { longPressProps: longPressProps } = (0, $8615756fee3bdacc$exports.useLongPress)({
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
    (0, $410abcf732b250aa$exports.useSafeArea)({
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
    let triggerProps = (0, $89b39774f3b79dbb$exports.mergeProps)(focusableProps, hoverProps, longPressProps);
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


//# sourceMappingURL=usePreviewTrigger.cjs.map
