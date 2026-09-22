import { KeyboardShortcutBindings } from './createKeyboardShortcutHandler';
import { DOMAttributes, KeyboardEvents } from '@react-types/shared';
export interface KeyboardProps extends KeyboardEvents {
    /** Whether the keyboard events should be disabled. */
    isDisabled?: boolean;
    /** Keyboard shortcuts to handle. */
    shortcuts?: KeyboardShortcutBindings;
    /** Whether to allow repeating keys. Only affects shortcuts. */
    allowRepeats?: boolean;
    /** Whether to allow composing keys. Only affects shortcuts. */
    allowComposing?: boolean;
}
export interface KeyboardResult {
    /** Props to spread onto the target element. */
    keyboardProps: DOMAttributes;
}
/**
 * Handles keyboard interactions for a focusable element.
 */
export declare function useKeyboard(props: KeyboardProps): KeyboardResult;
