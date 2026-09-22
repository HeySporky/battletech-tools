declare global {
    interface Window {
        __webpack_nonce__?: string;
    }
    var __webpack_nonce__: string | undefined;
}
export declare function getMetaValue(key: string, doc?: Document): string | undefined;
