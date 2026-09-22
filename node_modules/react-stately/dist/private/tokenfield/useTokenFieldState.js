import {TokenFieldValue as $bb130d0e51bd3001$export$f3decd0c2cd2fe2e} from "./TokenFieldValue.js";
import {useControlledState as $2a35a170cf8e413e$export$40bfa8c7b0832715} from "../utils/useControlledState.js";
import {useState as $3aXlP$useState} from "react";

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


function $0cd81fae0bf3e1e8$export$f2f6e9a6aa7f62e7(props) {
    let { value: valueProp, defaultValue: defaultValueProp = new (0, $bb130d0e51bd3001$export$f3decd0c2cd2fe2e)([]), onChange: onChange } = props;
    let [value, setValue] = (0, $2a35a170cf8e413e$export$40bfa8c7b0832715)(valueProp, defaultValueProp, onChange);
    let [isComposing, setComposing] = (0, $3aXlP$useState)(false);
    return {
        value: value,
        setValue: setValue,
        isComposing: isComposing,
        setComposing: setComposing
    };
}


export {$0cd81fae0bf3e1e8$export$f2f6e9a6aa7f62e7 as useTokenFieldState};
//# sourceMappingURL=useTokenFieldState.js.map
