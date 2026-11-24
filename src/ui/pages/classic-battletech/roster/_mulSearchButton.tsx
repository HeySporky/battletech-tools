import * as React from 'react';
import type { JSX } from "react";

/** Opens the group's Master Unit List search filtered to one unit type; shared by the non-'Mech group tables. */
export default function MULSearchButton( props: { unitLabel: string; onClick?: ( e: React.FormEvent<HTMLButtonElement> ) => void } ): JSX.Element | null {
    if( !props.onClick ) {
        return null;
    }
    return (
        <>
            {" "}
            <button
                className="btn btn-primary btn-sm"
                onClick={props.onClick}
                title={"Search the Master Unit List for " + props.unitLabel + " and add the ones you have saved"}
            >
                Search MUL
            </button>
        </>
    );
}
