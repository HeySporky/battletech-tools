import { EventMapType, RefObject } from '@react-types/shared';
export declare function useEvent<T extends EventTarget, K extends keyof EventMapType<T>>(ref: RefObject<T | null>, event: Extract<K, string> | (string & {}), listener?: (this: T, ev: EventMapType<Exclude<T, null>>[K]) => any, options?: boolean | AddEventListenerOptions): void;
