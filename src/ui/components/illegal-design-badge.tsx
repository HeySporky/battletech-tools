import type { JSX } from "react";
import { FaExclamationTriangle } from "react-icons/fa";

/** A design that breaks the construction rules as printed: kept, and marked with what it breaks on hover. */
export default function IllegalDesignBadge( props: { issues: string[] | undefined } ): JSX.Element | null {
    if( !props.issues?.length ) return null;
    return (
        <span className="badge bg-danger ms-1" title={"Illegal as printed: " + props.issues.join( "; " )}>
            <FaExclamationTriangle aria-hidden="true" /> Illegal
        </span>
    );
}
