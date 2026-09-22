import { AriaLabelingProps, DOMAttributes, FocusableProps } from '@react-types/shared';
import { ClipboardEventHandler, HTMLAttributes, RefObject } from 'react';
import { Position, SelectedRange, TokenFieldProps, TokenFieldState, TokenFieldValue } from 'react-stately/useTokenFieldState';
export interface AriaTokenFieldProps<T extends TokenFieldValue = TokenFieldValue> extends TokenFieldProps<T>, FocusableProps, AriaLabelingProps {
    /**
     * The accessibility role of the token field.
     *
     * @default 'textbox'
     */
    role?: 'textbox' | 'searchbox' | 'combobox';
    /** Whether the token field allows newlines. */
    allowsNewlines?: boolean;
    /** Whether the token field is read only. */
    isReadOnly?: boolean;
    /** Whether the token field is disabled. */
    isDisabled?: boolean;
    /** A function that is called when the user presses the Enter key. */
    onSubmit?: () => void;
    /** Handler that is called when a key is pressed. */
    onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
    /** Handler that is called when a key is released. */
    onKeyUp?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
    /**
     * Handler that is called when the user copies text. See
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/oncopy).
     */
    onCopy?: ClipboardEventHandler<T>;
    /**
     * Handler that is called when the user cuts text. See
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/oncut).
     */
    onCut?: ClipboardEventHandler<T>;
    /**
     * Handler that is called when the user pastes text. See
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/onpaste).
     */
    onPaste?: ClipboardEventHandler<T>;
}
export interface TokenFieldAria {
    /** Props for the token field's input element. */
    tokenFieldProps: HTMLAttributes<HTMLDivElement>;
    /** Props for the text field's visible label element, if any. */
    labelProps: DOMAttributes;
    /** Props for the text field's description element, if any. */
    descriptionProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a token field.
 * A token field allows users to enter text with inline tokens.
 *
 * @param props - Props for the token field.
 * @param state - State for the token field, as returned by `useTokenFieldState`.
 */
export declare function useTokenField<T extends TokenFieldValue = TokenFieldValue>(props: AriaTokenFieldProps<T>, state: TokenFieldState, ref: RefObject<HTMLDivElement | null>): TokenFieldAria;
export declare function getSelection(container: Element): [Position, Position] | null;
export declare function getSelectedRange(container: Element): SelectedRange | null;
export declare function setTokenFieldSelection(root: Element, selectedRange: SelectedRange, fireEvent?: boolean): void;
export declare function tokenFieldPositionToDOMRange(root: Element, pos: Position): Range;
