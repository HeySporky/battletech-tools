import React, { type JSX } from 'react';

/**
 * A labelled number box for the large counts of a capital ship (crew, heat sinks, armor points). InputNumeric turns a
 * whole-number range into a drop-down with one option per value, which is unusable at these sizes. The value is
 * applied on blur or Enter, so a minimum (a crew of 431, say) does not fight the typing.
 */
export default class CapitalShipNumberField extends React.Component<INumberFieldProps, INumberFieldState> {
    state: INumberFieldState = { draft: null };

    commit = (): void => {
        if (this.state.draft === null) return;
        const value = Number(this.state.draft);
        this.setState({ draft: null });
        if (this.state.draft.trim() !== "" && Number.isFinite(value)) this.props.setValue(value);
    }

    render = (): JSX.Element => (
        <label className="d-block">
            <strong>{this.props.label}</strong>:<br />
            <input
                type="number"
                className="full-width"
                data-testid={this.props.testId}
                min={this.props.min}
                max={this.props.max}
                step={this.props.step ?? 1}
                value={this.state.draft ?? String(this.props.value)}
                onChange={(e) => this.setState({ draft: e.currentTarget.value })}
                onBlur={this.commit}
                onKeyDown={(e) => { if (e.key === "Enter") this.commit(); }}
            />
        </label>
    )
}

interface INumberFieldProps {
    label: string;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    testId?: string;
    setValue: (value: number) => void;
}

interface INumberFieldState {
    /** What is typed but not applied yet; null shows the vessel's value. */
    draft: string | null;
}
