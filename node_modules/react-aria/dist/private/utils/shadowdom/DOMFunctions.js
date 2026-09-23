import {getOwnerWindow as $cc3c3666b64debad$export$f21a1ffae260145a, isShadowRoot as $cc3c3666b64debad$export$af51f0f06c0f328a} from "../domHelpers.js";
import {shadowDOM as $3dg2Q$shadowDOM} from "react-stately/private/flags/flags";

// Source: https://github.com/microsoft/tabster/blob/a89fc5d7e332d48f68d03b1ca6e344489d1c3898/src/Shadowdomize/DOMFunctions.ts#L16
/* eslint-disable rsp-rules/no-non-shadow-contains, rsp-rules/safe-event-target */ 

function $d8ac7ed472840322$export$4282f70798064fe0(node, otherNode) {
    if (!(0, $3dg2Q$shadowDOM)()) return otherNode && node ? node.contains(otherNode) : false;
    if (!node || !otherNode) return false;
    let currentNode = otherNode;
    while(currentNode !== null){
        var _currentNode_assignedSlot;
        if (currentNode === node) return true;
        if (typeof currentNode.assignedElements !== 'function' && ((_currentNode_assignedSlot = currentNode.assignedSlot) === null || _currentNode_assignedSlot === void 0 ? void 0 : _currentNode_assignedSlot.parentNode)) // Element is slotted
        currentNode = currentNode.assignedSlot.parentNode;
        else if ((0, $cc3c3666b64debad$export$af51f0f06c0f328a)(currentNode)) // Element is in shadow root
        currentNode = currentNode.host;
        else currentNode = currentNode.parentNode;
    }
    return false;
}
const $d8ac7ed472840322$export$cd4e5573fbe2b576 = (doc = document)=>{
    var _activeElement_shadowRoot;
    if (!(0, $3dg2Q$shadowDOM)()) return doc.activeElement;
    let activeElement = doc.activeElement;
    while(activeElement && 'shadowRoot' in activeElement && ((_activeElement_shadowRoot = activeElement.shadowRoot) === null || _activeElement_shadowRoot === void 0 ? void 0 : _activeElement_shadowRoot.activeElement))activeElement = activeElement.shadowRoot.activeElement;
    return activeElement;
};
function $d8ac7ed472840322$export$e58f029f0fbfdb29(event) {
    if ((0, $3dg2Q$shadowDOM)() && event.target instanceof Element && event.target.shadowRoot) {
        var _event_composedPath_, _event_nativeEvent_composedPath_;
        if ('composedPath' in event) return (_event_composedPath_ = event.composedPath()[0]) !== null && _event_composedPath_ !== void 0 ? _event_composedPath_ : null;
        else if ('composedPath' in event.nativeEvent) return (_event_nativeEvent_composedPath_ = event.nativeEvent.composedPath()[0]) !== null && _event_nativeEvent_composedPath_ !== void 0 ? _event_nativeEvent_composedPath_ : null;
    }
    return event.target;
}
function $d8ac7ed472840322$export$da7af4355d792141(from, to) {
    // If `to` is coming from a ref, its type technically allows `null`.
    // In practice, this function will generally be called from within a useEffect.
    // If the ref has not resolved by that point, then a coding error has been made.
    // Better to return an empty array than `[window]`, which may appear to work
    // in the light DOM, but fail in the shadow DOM.
    if (to === null) return [];
    to = to !== null && to !== void 0 ? to : (0, $cc3c3666b64debad$export$f21a1ffae260145a)(from);
    let targets = [
        to
    ];
    if (!(0, $3dg2Q$shadowDOM)() || !from || from === to) return targets;
    // The root `to` itself lives in. The event already reaches `to` once
    // it is inside this root, so we must NOT collect this root or anything above
    // it — only the shadow roots strictly between `refNode` and `to`.
    // `window` has no getRootNode; its boundary is the document, which the walk
    // reaches naturally (the document is not a ShadowRoot, so the loop exits).
    let toRoot = 'getRootNode' in to ? to.getRootNode() : null;
    var _from_getRootNode;
    let current = (_from_getRootNode = from.getRootNode()) !== null && _from_getRootNode !== void 0 ? _from_getRootNode : null;
    while((0, $cc3c3666b64debad$export$af51f0f06c0f328a)(current) && current !== toRoot){
        // order shouldn't matter
        targets.push(current);
        current = current.host.getRootNode();
    }
    return targets;
}
function $d8ac7ed472840322$export$b4f377a2b6254582(node) {
    if (!node) return false;
    // Get the active element within the node's parent shadow root (or the document). Can return null.
    let root = node.getRootNode();
    let ownerWindow = (0, $cc3c3666b64debad$export$f21a1ffae260145a)(node);
    if (!(root instanceof ownerWindow.Document || root instanceof ownerWindow.ShadowRoot)) return false;
    let activeElement = root.activeElement;
    // Check if the active element is within this node. These nodes are within the same shadow root.
    return activeElement != null && node.contains(activeElement);
}


export {$d8ac7ed472840322$export$4282f70798064fe0 as nodeContains, $d8ac7ed472840322$export$cd4e5573fbe2b576 as getActiveElement, $d8ac7ed472840322$export$e58f029f0fbfdb29 as getEventTarget, $d8ac7ed472840322$export$da7af4355d792141 as getPropagationTargets, $d8ac7ed472840322$export$b4f377a2b6254582 as isFocusWithin};
//# sourceMappingURL=DOMFunctions.js.map
