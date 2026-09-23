import {chain as $2cf8bb4b9e45dc81$export$e08e3b67e392101e} from "../utils/chain.js";
import {createEventHandler as $9f1ad800ae5e6534$export$48d1ea6320830260} from "./createEventHandler.js";
import {createKeyboardShortcutHandler as $b15d3ffd1d5f90aa$export$2fd1fc8039383ae1} from "./createKeyboardShortcutHandler.js";
import {getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29, nodeContains as $d8ac7ed472840322$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.js";

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



function $bf74df7506f65576$export$8f71654801c2f7cd(props) {
    let { shortcuts: shortcuts, allowRepeats: allowRepeats = false, allowComposing: allowComposing = false } = props;
    let onKeyDown;
    let onKeyUp;
    if (shortcuts) {
        let shortcutHandler = (0, $b15d3ffd1d5f90aa$export$2fd1fc8039383ae1)(shortcuts);
        let shortcutOnKeyDown = (0, $9f1ad800ae5e6534$export$48d1ea6320830260)((e)=>{
            var _e_nativeEvent, _e_nativeEvent1;
            // If keyboard event didn't originate from a child of the current target,
            // then it's a React event coming through a portal. We should ignore it.
            if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) {
                e.continuePropagation();
                return;
            }
            if (((_e_nativeEvent = e.nativeEvent) === null || _e_nativeEvent === void 0 ? void 0 : _e_nativeEvent.repeat) && !allowRepeats || ((_e_nativeEvent1 = e.nativeEvent) === null || _e_nativeEvent1 === void 0 ? void 0 : _e_nativeEvent1.isComposing) && !allowComposing) {
                e.continuePropagation();
                return;
            }
            shortcutHandler(e);
        });
        let shortcutOnKeyUp = (0, $9f1ad800ae5e6534$export$48d1ea6320830260)((e)=>{
            var _e_nativeEvent, _e_nativeEvent1;
            // If keyboard event didn't originate from a child of the current target,
            // then it's a React event coming through a portal. We should ignore it.
            if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) {
                e.continuePropagation();
                return;
            }
            if (((_e_nativeEvent = e.nativeEvent) === null || _e_nativeEvent === void 0 ? void 0 : _e_nativeEvent.repeat) && !allowRepeats || ((_e_nativeEvent1 = e.nativeEvent) === null || _e_nativeEvent1 === void 0 ? void 0 : _e_nativeEvent1.isComposing) && !allowComposing) {
                e.continuePropagation();
                return;
            }
            // implement shortcut handler on keyup, what should the map be called? or should it be another syntax on shortcuts?
            e.continuePropagation();
        });
        onKeyDown = props.onKeyDown ? (0, $2cf8bb4b9e45dc81$export$e08e3b67e392101e)(props.onKeyDown, shortcutOnKeyDown) : shortcutOnKeyDown;
        onKeyUp = props.onKeyUp ? (0, $2cf8bb4b9e45dc81$export$e08e3b67e392101e)(props.onKeyUp, shortcutOnKeyUp) : shortcutOnKeyUp;
    } else {
        onKeyDown = (0, $9f1ad800ae5e6534$export$48d1ea6320830260)(props.onKeyDown);
        onKeyUp = (0, $9f1ad800ae5e6534$export$48d1ea6320830260)(props.onKeyUp);
    }
    return {
        keyboardProps: props.isDisabled ? {} : {
            onKeyDown: onKeyDown,
            onKeyUp: onKeyUp
        }
    };
}


export {$bf74df7506f65576$export$8f71654801c2f7cd as useKeyboard};
//# sourceMappingURL=useKeyboard.js.map
