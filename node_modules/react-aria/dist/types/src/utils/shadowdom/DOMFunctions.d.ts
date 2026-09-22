import type { SyntheticEvent } from 'react';
/**
 * ShadowDOM safe version of Node.contains.
 */
export declare function nodeContains(node: Node | Element | null | undefined, otherNode: Node | Element | null | undefined): boolean;
/**
 * ShadowDOM safe version of document.activeElement.
 */
export declare const getActiveElement: (doc?: Document) => Element | null;
type EventTargetType<T> = T extends SyntheticEvent<infer E, any> ? E : EventTarget;
/**
 * ShadowDOM safe version of event.target.
 */
export declare function getEventTarget<T extends Event | SyntheticEvent>(event: T): EventTargetType<T>;
/**
 * Returns the set of event targets a listener must be attached to in order to
 * globally observe an event.
 *
 * @param from - The target element to start from.
 * @param to - The element to stop at when bubbling. @default getOwnerWindow(from)
 *   `to` is generally going to be either `document` or `window`, but
 *   it can be any intermediate node.
 * @returns [global, ...shadowRoots]
 */
export declare function getPropagationTargets(from: Element | null | undefined, to?: Document | Window | Element | null): EventTarget[];
/**
 * ShadowDOM safe fast version of node.contains(document.activeElement).
 *
 * @param node
 * @returns
 */
export declare function isFocusWithin(node: Element | null | undefined): boolean;
export {};
