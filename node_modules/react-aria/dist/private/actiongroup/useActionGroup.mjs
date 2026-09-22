import {createFocusManager as $535772f9d2c1f38d$export$c5251b9e124bf29} from "../focus/FocusScope.mjs";
import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import {useKeyboard as $8296dad1a4c5e0dc$export$8f71654801c2f7cd} from "../interactions/useKeyboard.mjs";
import {useLayoutEffect as $c4867b2f328c2698$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {useState as $4PGsl$useState} from "react";

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





const $db60a6d462053998$var$BUTTON_GROUP_ROLES = {
    none: 'toolbar',
    single: 'radiogroup',
    multiple: 'toolbar'
};
function $db60a6d462053998$export$f4bf8d43c16de704(props, state, ref) {
    let { isDisabled: isDisabled, orientation: orientation = 'horizontal' } = props;
    let [isInToolbar, setInToolbar] = (0, $4PGsl$useState)(false);
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        setInToolbar(!!(ref.current && ref.current.parentElement?.closest('[role="toolbar"]')));
    }, [
        ref
    ]);
    let allKeys = [
        ...state.collection.getKeys()
    ];
    if (!allKeys.some((key)=>!state.disabledKeys.has(key))) isDisabled = true;
    let { direction: direction } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    // oxlint-disable-next-line react/react-compiler
    let focusManager = (0, $535772f9d2c1f38d$export$c5251b9e124bf29)(ref);
    // ArrowLeft/ArrowRight follow the locale's text direction regardless of orientation, so
    // ArrowLeft always moves to the next item in RTL. ArrowUp/ArrowDown are never flipped.
    let flipDirection = direction === 'rtl';
    let { keyboardProps: keyboardProps } = (0, $8296dad1a4c5e0dc$export$8f71654801c2f7cd)({
        shortcuts: {
            ArrowRight: ()=>{
                if (flipDirection) focusManager.focusPrevious({
                    wrap: true
                });
                else focusManager.focusNext({
                    wrap: true
                });
            },
            ArrowDown: ()=>{
                focusManager.focusNext({
                    wrap: true
                });
            },
            ArrowLeft: ()=>{
                if (flipDirection) focusManager.focusNext({
                    wrap: true
                });
                else focusManager.focusPrevious({
                    wrap: true
                });
            },
            ArrowUp: ()=>{
                focusManager.focusPrevious({
                    wrap: true
                });
            }
        },
        allowRepeats: true
    });
    let role = $db60a6d462053998$var$BUTTON_GROUP_ROLES[state.selectionManager.selectionMode];
    if (isInToolbar && role === 'toolbar') role = 'group';
    return {
        actionGroupProps: {
            ...(0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(props, {
                labelable: true
            }),
            role: role,
            'aria-orientation': role === 'toolbar' ? orientation : undefined,
            'aria-disabled': isDisabled,
            ...keyboardProps
        }
    };
}


export {$db60a6d462053998$export$f4bf8d43c16de704 as useActionGroup};
//# sourceMappingURL=useActionGroup.mjs.map
