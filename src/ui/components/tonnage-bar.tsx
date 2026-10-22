import React, { type JSX } from 'react';
import './mech-creator-status-bar.scss';

const tidy = (value: number): number => Math.round(value * 1000) / 1000;

/**
 * The weight (and slots) a design has used, held at the foot of the screen while equipment is added, red when over
 * (beta feedback 2026-10-21). The 'Mech Creator has its own bar; every other builder's equipment pages use this one.
 */
export default class TonnageBar extends React.Component<ITonnageBarProps> {
    render = (): JSX.Element => {
        const { used, total, slots } = this.props;
        const unit = this.props.unit ?? "tons";
        const left = tidy(total - used);
        const overWeight = left < 0;
        const overSlots = !!slots && slots.used > slots.total;
        return (
            <>
                {/* Keeps the last rows of the page clear of the fixed bar. */}
                <div style={{ height: "3rem" }} aria-hidden="true" />
                <div className="mech-creator-status-bar" data-testid="tonnage-bar" role="status">
                    <span className={`no-wrap inline-block${overWeight ? " color-red" : ""}`}>
                        <strong>Weight</strong>: {tidy(used)} / {tidy(total)} {unit} ({overWeight ? `${-left} ${unit} over` : `${left} ${unit} left`})
                    </span>
                    {slots ? (
                        <>
                            &nbsp;|&nbsp;
                            <span className={`no-wrap inline-block${overSlots ? " color-red" : ""}`}>
                                <strong>{slots.label ?? "Slots"}</strong>: {slots.used} / {slots.total}
                            </span>
                        </>
                    ) : null}
                </div>
            </>
        );
    }
}

interface ITonnageBarProps {
    used: number;
    total: number;
    /** "tons" unless the design is weighed in kilograms (battle armor). */
    unit?: "tons" | "kg";
    slots?: { used: number; total: number; label?: string };
}
