import {TokenFieldValue as $4a46f1c4231e5dde$export$f3decd0c2cd2fe2e} from "./TokenFieldValue.mjs";
import {useControlledState as $3e6197669829fe11$export$40bfa8c7b0832715} from "../utils/useControlledState.mjs";
import {useState as $360x8$useState} from "react";

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


function $df69ee4de894ef40$export$f2f6e9a6aa7f62e7(props) {
    let { value: valueProp, defaultValue: defaultValueProp = new (0, $4a46f1c4231e5dde$export$f3decd0c2cd2fe2e)([]), onChange: onChange } = props;
    let [value, setValue] = (0, $3e6197669829fe11$export$40bfa8c7b0832715)(valueProp, defaultValueProp, onChange);
    let [isComposing, setComposing] = (0, $360x8$useState)(false);
    return {
        value: value,
        setValue: setValue,
        isComposing: isComposing,
        setComposing: setComposing
    };
}


export {$df69ee4de894ef40$export$f2f6e9a6aa7f62e7 as useTokenFieldState};
//# sourceMappingURL=useTokenFieldState.mjs.map
