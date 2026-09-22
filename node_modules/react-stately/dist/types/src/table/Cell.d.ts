import { JSX, ReactElement, ReactNode } from 'react';
import { Key } from '@react-types/shared';
export interface CellProps {
    /** The contents of the cell. */
    children: ReactNode;
    /** A string representation of the cell's contents, used for features like typeahead. */
    textValue?: string;
    /** Indicates how many columns the data cell spans. */
    colSpan?: number;
}
export type CellElement = ReactElement<CellProps>;
export type CellRenderer = (columnKey: Key) => CellElement;
/**
 * A Cell represents the value of a single Column within a Table Row.
 */
declare let _Cell: (props: CellProps) => JSX.Element;
export { _Cell as Cell };
