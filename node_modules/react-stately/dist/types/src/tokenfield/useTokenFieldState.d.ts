import { TokenFieldValue } from './TokenFieldValue';
import { ValueBase } from '@react-types/shared';
export interface TokenFieldProps<T extends TokenFieldValue = TokenFieldValue> extends ValueBase<T> {
}
export interface TokenFieldState<T extends TokenFieldValue = TokenFieldValue> {
    /** The current value of the token field. */
    value: T;
    /** Sets the value of the token field. */
    setValue: (fn: T | ((value: T) => T)) => void;
    /** Whether the token field is composing. */
    isComposing: boolean;
    /** Sets the composing state of the token field. */
    setComposing: (isComposing: boolean) => void;
}
/**
 * Provides state management for a token field. Tracks the field value and the
 * composition state.
 */
export declare function useTokenFieldState<T extends TokenFieldValue = TokenFieldValue>(props: TokenFieldProps<T>): TokenFieldState<T>;
