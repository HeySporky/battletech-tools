import React, { type JSX, useState } from 'react';

/** A unit whose canon quirks can be looked up and added: a BattleMech, by the BattleMech Quirk Table. */
interface ICanonQuirkUnit {
    hasCanonQuirks(): boolean;
    applyCanonQuirks(): { added: number; notes: string[] } | null;
    quirks: { getAll(): unknown[] };
}

/**
 * "Apply canon quirks (BMM pp.90-95)": adds the chassis' quirks from the BattleMech Quirk Table, then says how many
 * it added and why any were left off, until the unit's quirks change or another unit loads. Shows nothing when the
 * table does not list the chassis.
 */
const CanonQuirksButton = (props: { unit: ICanonQuirkUnit; onApplied: () => void }): JSX.Element | null => {
    const [applied, setApplied] = useState<{ result: { added: number; notes: string[] }; unit: ICanonQuirkUnit; quirks: string } | null>(null);
    if (!props.unit.hasCanonQuirks()) return null;
    const apply = () => {
        const outcome = props.unit.applyCanonQuirks();
        setApplied(outcome ? { result: outcome, unit: props.unit, quirks: JSON.stringify(props.unit.quirks.getAll()) } : null);
        props.onApplied();
    };
    const result = applied && applied.unit === props.unit && applied.quirks === JSON.stringify(props.unit.quirks.getAll()) ? applied.result : null;
    return (
        <div className="canon-quirks">
            <button type="button" className="btn btn-sm btn-primary" onClick={apply}>Apply canon quirks (BMM pp.90-95)</button>
            {result ? (
                <>
                    <p>Added {result.added} canon {result.added === 1 ? "quirk" : "quirks"}.</p>
                    {result.notes.length ? <ul>{result.notes.map((note) => <li key={note}>{note}</li>)}</ul> : null}
                </>
            ) : null}
        </div>
    );
};

export default CanonQuirksButton;
