var $c731fb93d14b07fc$exports = require("../collections/getChildNodes.cjs");
var $0af3d14a0ed99bae$exports = require("../selection/useMultipleSelectionState.cjs");
var $b9a23b9997e48a30$exports = require("../selection/SelectionManager.cjs");
var $7FqS7$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useGridState", function () { return $041063183149bf8f$export$4007ac09ff9c68ed; });




function $041063183149bf8f$export$4007ac09ff9c68ed(props) {
    let { collection: collection, focusMode: focusMode } = props;
    // oxlint-disable-next-line react/react-compiler, react-hooks/rules-of-hooks
    let selectionState = props.UNSAFE_selectionState || (0, $0af3d14a0ed99bae$exports.useMultipleSelectionState)(props);
    let disabledKeys = (0, $7FqS7$react.useMemo)(()=>props.disabledKeys ? new Set(props.disabledKeys) : new Set(), [
        props.disabledKeys
    ]);
    let setFocusedKey = selectionState.setFocusedKey;
    // oxlint-disable-next-line react/react-compiler
    selectionState.setFocusedKey = (key, child)=>{
        // If focusMode is cell and an item is focused, focus a child cell instead.
        if (focusMode === 'cell' && key != null) {
            let item = collection.getItem(key);
            if (item?.type === 'item') {
                let children = (0, $c731fb93d14b07fc$exports.getChildNodes)(item, collection);
                if (child === 'last') key = (0, $c731fb93d14b07fc$exports.getLastItem)(children)?.key ?? null;
                else key = (0, $c731fb93d14b07fc$exports.getFirstItem)(children)?.key ?? null;
            }
        }
        setFocusedKey(key, child);
    };
    let selectionManager = (0, $7FqS7$react.useMemo)(()=>new (0, $b9a23b9997e48a30$exports.SelectionManager)(collection, selectionState), [
        collection,
        selectionState
    ]);
    // Reset focused key if that item is deleted from the collection.
    const cachedCollection = (0, $7FqS7$react.useRef)(null);
    (0, $7FqS7$react.useEffect)(()=>{
        if (selectionState.focusedKey != null && cachedCollection.current && !collection.getItem(selectionState.focusedKey)) {
            const node = cachedCollection.current.getItem(selectionState.focusedKey);
            const parentNode = node?.parentKey != null && (node.type === 'cell' || node.type === 'rowheader' || node.type === 'column') ? cachedCollection.current.getItem(node.parentKey) : node;
            if (!parentNode) {
                selectionState.setFocusedKey(null);
                return;
            }
            const cachedRows = cachedCollection.current.rows;
            const rows = collection.rows;
            const diff = cachedRows.length - rows.length;
            let index = Math.min(diff > 1 ? Math.max(parentNode.index - diff + 1, 0) : parentNode.index, rows.length - 1);
            let newRow = null;
            // Find the nearest focusable row at or after the deleted position...
            for(let i = Math.max(0, index); i < rows.length; i++)if (!selectionManager.isDisabled(rows[i].key) && rows[i].type !== 'headerrow') {
                newRow = rows[i];
                break;
            }
            // ...otherwise the nearest focusable row before it. (Mirrors useListState's
            // getKeyAfter/getKeyBefore walk.)
            if (newRow === null) {
                for(let i = index - 1; i >= 0; i--)if (!selectionManager.isDisabled(rows[i].key) && rows[i].type !== 'headerrow') {
                    newRow = rows[i];
                    break;
                }
            }
            if (newRow) {
                const childNodes = newRow.hasChildNodes ? [
                    ...(0, $c731fb93d14b07fc$exports.getChildNodes)(newRow, collection)
                ] : [];
                const keyToFocus = newRow.hasChildNodes && parentNode !== node && node && node.index < childNodes.length ? childNodes[node.index].key : newRow.key;
                selectionState.setFocusedKey(keyToFocus);
            } else selectionState.setFocusedKey(null);
        }
        cachedCollection.current = collection;
    }, [
        collection,
        selectionManager,
        selectionState,
        selectionState.focusedKey
    ]);
    return {
        collection: collection,
        disabledKeys: disabledKeys,
        isKeyboardNavigationDisabled: false,
        selectionManager: selectionManager
    };
}


//# sourceMappingURL=useGridState.cjs.map
