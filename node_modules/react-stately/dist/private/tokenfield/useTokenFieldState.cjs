var $8b1d61ca9a986fd4$exports = require("./TokenFieldValue.cjs");
var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");
var $bawsn$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTokenFieldState", function () { return $89e7d699d0a0abe4$export$f2f6e9a6aa7f62e7; });
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


function $89e7d699d0a0abe4$export$f2f6e9a6aa7f62e7(props) {
    let { value: valueProp, defaultValue: defaultValueProp = new (0, $8b1d61ca9a986fd4$exports.TokenFieldValue)([]), onChange: onChange } = props;
    let [value, setValue] = (0, $14cedf286405cc4b$exports.useControlledState)(valueProp, defaultValueProp, onChange);
    let [isComposing, setComposing] = (0, $bawsn$react.useState)(false);
    return {
        value: value,
        setValue: setValue,
        isComposing: isComposing,
        setComposing: setComposing
    };
}


//# sourceMappingURL=useTokenFieldState.cjs.map
