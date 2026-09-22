import type { EventMapType } from '@react-types/shared';
export declare const getOwnerDocument: (target?: EventTarget | null) => Document;
export declare const getOwnerWindow: (target?: EventTarget | null) => Window & typeof globalThis;
/**
 * Type guard that checks if a value is a Node. Verifies the presence and type of the nodeType
 * property.
 */
export declare function isNode(value: unknown): value is Node;
/**
 * Type guard that checks if a value is a Document. Uses nodeType and host property checks to
 * distinguish Document from other values.
 */
export declare function isDocument(value: unknown): value is Document;
/**
 * Type guard that checks if a value is a ShadowRoot. Uses nodeType and host property checks to
 * distinguish ShadowRoot from other values.
 */
export declare function isShadowRoot(value: unknown): value is ShadowRoot;
/**
 * Attaches an event listener on target(s) and returns a cleanup function.
 */
export declare function addEvent<T extends EventTarget, K extends keyof EventMapType<Exclude<T, null>>>(target: T | EventTarget[] | null, event: Extract<K, string> | (string & {}), listener?: (this: T, ev: EventMapType<Exclude<T, null>>[K]) => any, options?: boolean | AddEventListenerOptions): () => void;
/**
 * Sets a CSS property on an element and returns a cleanup function.
 */
export declare function setStyle(target: HTMLElement | HTMLElement[] | null, property: string, value: string, priority?: string): () => void;
