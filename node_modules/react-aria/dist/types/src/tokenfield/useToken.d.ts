import { HTMLAttributes, RefObject } from 'react';
export interface TokenProps {
}
export interface TokenAria {
    /** Props for the token element. */
    tokenProps: HTMLAttributes<HTMLSpanElement>;
    /** Whether the token is currently selected. */
    isSelected: boolean;
}
/**
 * Provides the behavior and accessibility implementation for a token within a token field.
 * A token field allows users to enter text with inline tokens.
 */
export declare function useToken(_props: TokenProps, _state: any, ref: RefObject<HTMLSpanElement | null>): TokenAria;
