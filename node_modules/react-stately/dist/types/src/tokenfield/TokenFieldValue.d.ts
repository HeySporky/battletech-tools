export type TokenFieldSegment<T = any> = TextSegment | TokenSegment<T>;
export interface TextSegment {
    type: 'text';
    text: string;
}
export interface TokenSegment<T = any> {
    type: 'token';
    text: string;
    /** An arbitrary value associated with the token. */
    value?: T;
}
export interface Position {
    /** Index of the segment in the list. */
    index: number;
    /** Text offset within the segment in UTF-16 code units. */
    offset: number;
}
/** Represents a text selection in a TokenField. */
export declare class SelectedRange {
    /** The anchor position. */
    anchor: Position;
    /** The current (i.e. caret) position. */
    current: Position;
    /**
     * Creates a new selection range. If only a single position is provided, the selection is
     * collapsed.
     */
    constructor(anchor: Position, current?: Position);
    /** Whether the selection is collapsed to a single caret position. */
    get isCollapsed(): boolean;
    /** The side of the selection closest to the start of the value. */
    get start(): Position;
    /** The side of the selection closest to the end of the value. */
    get end(): Position;
    /** Returns whether this selection is equal to another. */
    isEqual(other: SelectedRange): boolean;
}
declare enum Direction {
    Forward = 1,
    Backward = -1
}
export interface TokenFieldValueOptions {
    selectedRange?: SelectedRange | null;
}
/**
 * A list of segments containing editable text and non-editable tokens.
 */
export declare class TokenFieldValue<T = any> {
    static readonly Direction: typeof Direction;
    static readonly SelectedRange: typeof SelectedRange;
    /** The text and token segments in the list. */
    readonly segments: readonly TokenFieldSegment<T>[];
    /** The selected range. */
    selectedRange: SelectedRange;
    private previous;
    private next;
    private isCoalescing;
    /** Create a new list with the given segments. */
    constructor(tokens: readonly TokenFieldSegment<T>[], options?: TokenFieldValueOptions);
    protected createFieldValue(segments: readonly TokenFieldSegment<T>[]): this;
    get caretPosition(): Position;
    /** Create a new list with the caret position set to the given position. */
    withSelectedRange(selectedRange: SelectedRange): this;
    withCaretPosition(position: Position): this;
    private splitSegment;
    private createTextSegment;
    protected tokenize(text: string): TokenFieldSegment<T>[];
    private clampPosition;
    /** Replace the text between two positions with new text. */
    replaceRange(start: Position, end: Position, text: string, coalesce?: boolean): this;
    /** Replace the text between two positions with new segments. */
    replaceRangeWithSegments(start: Position, end: Position, insert: TokenFieldSegment<T>[], coalesce?: boolean): this;
    /** Find the boundary before or after a position using an Intl.Segmenter. */
    findBoundaryWithSegmenter(position: Position, segmenter: Intl.Segmenter, direction: Direction): Position | null;
    /** Find a line boundary before or after a position. */
    findLineBoundary(position: Position, direction: Direction): Position | null;
    /** Find a string or regular expression match before or after a position. */
    findText(position: Position, direction: Direction, search: string | RegExp): Position | null;
    /** Delete text at a position using a segmenter. */
    delete(position: Position, segmenter: Intl.Segmenter, direction: Direction, coalesce?: boolean): this;
    /** Delete text to the next or previous line break. */
    deleteLine(position: Position, direction: Direction, coalesce?: boolean): this;
    /** Create a new list containing a subset of the segments. */
    slice(start: Position, end: Position): this;
    /** Convert the list to a string. */
    toString(): string;
    /** Returns the previous list in the undo history. */
    undo(): this;
    /** Returns the next list in the redo history. */
    redo(): this;
    /** End coalescing undo/redo history. */
    endCoalescing(): void;
}
export {};
