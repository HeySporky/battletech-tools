var $4b9e9ed3f006ad27$exports = require("../utils/focusWithoutScrolling.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $81146576c7bb61f6$exports = require("./intlStrings.cjs");
var $9c80670f8abbe5f2$exports = require("../interactions/useContextMenu.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $6d2f10bb8b359da5$exports = require("../interactions/useKeyboard.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $8615756fee3bdacc$exports = require("../interactions/useLongPress.cjs");
var $d97027197a3758b1$exports = require("../overlays/useOverlayTrigger.cjs");
var $55aFl$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useMenuTrigger", function () { return $5b639fe010c6782f$export$dc9c12ed27dd1b49; });
/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 









function $5b639fe010c6782f$export$dc9c12ed27dd1b49(props, state, ref) {
    let { type: type = 'menu', isDisabled: isDisabled, trigger: trigger = 'press' } = props;
    let menuTriggerId = (0, $7ac82d1fee77eb8a$exports.useId)();
    let { triggerProps: triggerProps, overlayProps: overlayProps } = (0, $d97027197a3758b1$exports.useOverlayTrigger)({
        type: type
    }, state, ref);
    let open = (shouldOpen, e, focusStrategy = 'first')=>{
        if (!shouldOpen || e.isDefaultPrevented()) return false;
        state.toggle(focusStrategy);
    };
    // React puts listeners on the same root, so even if propagation was stopped, immediate propagation is still possible.
    // useTypeSelect will handle the spacebar first if it's running, so we don't want to open if it's handled it already.
    // We use isDefaultPrevented() instead of isPropagationStopped() because createEventHandler stops propagation by default.
    // And default prevented means that the event was handled by something else (typeahead), so we don't want to open the menu.
    let { keyboardProps: keyboardProps } = (0, $6d2f10bb8b359da5$exports.useKeyboard)({
        isDisabled: isDisabled,
        shortcuts: {
            Enter: (e)=>{
                return open(trigger !== 'longPress', e, 'first');
            },
            ' ': (e)=>{
                return open(trigger !== 'longPress', e, 'first');
            },
            ArrowDown: (e)=>{
                return open(trigger !== 'longPress', e, 'first');
            },
            ArrowUp: (e)=>{
                return open(trigger !== 'longPress', e, 'last');
            },
            'Alt+Enter': (e)=>{
                return open(trigger === 'longPress', e, 'first');
            },
            'Alt+ ': (e)=>{
                return open(trigger === 'longPress', e, 'first');
            },
            // Alt+Arrow* must open for both trigger modes: for `press` it matches the same `e.key` cases as
            // plain Arrow*; for `longPress`, plain arrows are ignored elsewhere and Alt+Arrow is the opener
            // (see legacy `if (trigger === 'longPress' && !e.altKey) return` before the ArrowDown/Up switch).
            'Alt+ArrowDown': (e)=>{
                return open(true, e, 'first');
            },
            'Alt+ArrowUp': (e)=>{
                return open(true, e, 'last');
            }
        }
    });
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($81146576c7bb61f6$exports))), '@react-aria/menu');
    let { longPressProps: longPressProps } = (0, $8615756fee3bdacc$exports.useLongPress)({
        isDisabled: isDisabled || trigger !== 'longPress',
        accessibilityDescription: stringFormatter.format('longPressMessage'),
        onLongPressStart () {
            state.close();
        },
        onLongPress () {
            state.open('first');
        }
    });
    let pressProps = {
        preventFocusOnPress: true,
        onPressStart (e) {
            // For consistency with native, open the menu on mouse/key down, but touch up.
            if (e.pointerType !== 'touch' && e.pointerType !== 'keyboard' && !isDisabled) {
                // Ensure trigger has focus before opening the menu so it can be restored by FocusScope on close.
                (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(e.target);
                // If opened with a screen reader, auto focus the first item.
                // Otherwise, the menu itself will be focused.
                state.open(e.pointerType === 'virtual' ? 'first' : null);
            }
        },
        onPress (e) {
            if (e.pointerType === 'touch' && !isDisabled) {
                // Ensure trigger has focus before opening the menu so it can be restored by FocusScope on close.
                (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(e.target);
                state.toggle();
            }
        }
    };
    // omit onPress from triggerProps since we override it above.
    // oxlint-disable-next-line react/react-compiler
    delete triggerProps.onPress;
    let { contextMenuProps: contextMenuProps } = (0, $9c80670f8abbe5f2$exports.useContextMenu)({
        onContextMenu (e) {
            // This is not a DOM event, so the linter is incorrect.
            // eslint-disable-next-line rsp-rules/safe-event-target
            let rect = e.target.getBoundingClientRect();
            state.setPoint({
                x: rect.x + e.x,
                y: rect.y + e.y
            });
            state.open();
        }
    });
    (0, $55aFl$react.useEffect)(()=>{
        // Close context menus when right clicking outside. The browser's context menu will appear instead.
        if (state.isOpen && trigger === 'contextMenu') {
            let onContextMenu = (e)=>{
                // Checking if the target is the body works because everything outside the menu is inert.
                if ((e.button === 2 || e.button === 0 && e.ctrlKey === true) && (0, $da02ee888921bc9e$exports.getEventTarget)(e) === document.body) state.close();
            };
            document.addEventListener('mousedown', onContextMenu);
            return ()=>document.removeEventListener('mousedown', onContextMenu);
        }
    }, [
        state,
        trigger
    ]);
    let interactionProps;
    if (trigger === 'press') interactionProps = {
        ...pressProps,
        ...keyboardProps
    };
    else if (trigger === 'longPress') interactionProps = {
        ...longPressProps,
        ...keyboardProps
    };
    else if (trigger === 'contextMenu') {
        interactionProps = contextMenuProps;
        // Remove aria-haspopup and associated attributes from context menu triggers.
        // aria-haspopup indicates that the trigger opens a menu on activation (i.e. click/Enter),
        // which is not the case for context menus, so this would lead to confusing announcements.
        // Context menus are equally discoverable (or not) by sighted and non-sighted users,
        // so we don't need a screen reader specific announcement.
        // See https://github.com/w3c/aria/issues/1971 for further discussion.
        let { 'aria-haspopup': _a, 'aria-expanded': _b, 'aria-controls': _c, ...rest } = triggerProps;
        triggerProps = rest;
    }
    return {
        // @ts-ignore - TODO we pass out both DOMAttributes AND AriaButtonProps, but useButton will discard the longPress event handlers, it's only through PressResponder magic that this works for RSP and RAC. it does not work in aria examples
        menuTriggerProps: {
            ...triggerProps,
            ...interactionProps,
            id: menuTriggerId
        },
        menuProps: {
            ...overlayProps,
            'aria-labelledby': menuTriggerId,
            autoFocus: state.focusStrategy || true,
            onClose: state.close
        }
    };
}


//# sourceMappingURL=useMenuTrigger.cjs.map
