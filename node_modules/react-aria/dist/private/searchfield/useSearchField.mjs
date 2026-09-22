import {useTextField as $054f71d2330da2e3$export$712718f7aec83d5} from "../textfield/useTextField.mjs";
import $kb1Sb$intlStringsmjs from "./intlStrings.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useKeyboard as $8296dad1a4c5e0dc$export$8f71654801c2f7cd} from "../interactions/useKeyboard.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
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




function $44614525ec969a63$export$9bb30bbe003b82e0(props, state, inputRef) {
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($kb1Sb$intlStringsmjs))), '@react-aria/searchfield');
    let { isDisabled: isDisabled, isReadOnly: isReadOnly, onSubmit: onSubmit, onClear: onClear, type: type = 'search' } = props;
    let { keyboardProps: keyboardProps } = (0, $8296dad1a4c5e0dc$export$8f71654801c2f7cd)({
        isDisabled: isDisabled || isReadOnly,
        shortcuts: {
            Enter: ()=>{
                if (onSubmit) {
                    // for backward compatibility;
                    // otherwise, "Enter" on an input would trigger a form submit, the default browser behavior
                    onSubmit(state.value);
                    return;
                }
                return false;
            },
            Escape: ()=>{
                // Also check the inputRef value for the case where the value was set directly on the input element instead of going through
                // the hook
                if (state.value === '' && (!inputRef.current || inputRef.current.value === '')) return false;
                state.setValue('');
                onClear?.();
            }
        }
    });
    let onClearButtonClick = ()=>{
        state.setValue('');
        if (onClear) onClear();
    };
    let onPressStart = ()=>{
        // this is in PressStart for mobile so that touching the clear button doesn't remove focus from
        // the input and close the keyboard
        inputRef.current?.focus();
    };
    let { labelProps: labelProps, inputProps: inputProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps, ...validation } = (0, $054f71d2330da2e3$export$712718f7aec83d5)({
        ...props,
        value: state.value,
        onChange: state.setValue,
        onKeyDown: props.onKeyDown,
        onKeyUp: props.onKeyUp,
        type: type
    }, inputRef);
    return {
        labelProps: labelProps,
        // An edge case, in Autocomplete, if the keyboard hanlders are not in this order, then
        // Escape runs autocomplete/listbox first, then the search-field shortcut returns false and
        // continues propagation, leaking Escape to a parent Dialog.
        inputProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(keyboardProps, {
            ...inputProps,
            // already handled by useSearchFieldState
            defaultValue: undefined
        }),
        clearButtonProps: {
            'aria-label': stringFormatter.format('Clear search'),
            excludeFromTabOrder: true,
            preventFocusOnPress: true,
            isDisabled: isDisabled || isReadOnly,
            onPress: onClearButtonClick,
            onPressStart: onPressStart
        },
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps,
        ...validation
    };
}


export {$44614525ec969a63$export$9bb30bbe003b82e0 as useSearchField};
//# sourceMappingURL=useSearchField.mjs.map
