import * as React from "react";
import type { JSX } from "react";
import { TechnicalReadout } from "../../classes/technical-readout";
import { ITroComponentRow, ITroEquipmentCopy, ITroMake, ITroUnitAdapter, TroProductionKey, TRO_COMPONENT_LABELS, TRO_TEXT_SECTIONS } from "../../data/technical-readout-interfaces";

const PRODUCTION_FIELDS: { key: TroProductionKey; label: string }[] = [
    { key: "manufacturer", label: "Manufacturer" },
    { key: "primaryFactory", label: "Primary Factory" },
    { key: "communications", label: "Communications System" },
    { key: "targeting", label: "Targeting & Tracking" },
];

interface ITechnicalReadoutSectionProps {
    tro: TechnicalReadout;
    adapter: ITroUnitAdapter;
    /** Called after every edit, so the page can save the design. */
    onChange: () => void;
}

/** The optional Technical Readout fields of a unit: production, component makes, equipment makes and text. Shared by every unit creator. */
export default class TechnicalReadoutSection extends React.Component<ITechnicalReadoutSectionProps> {
    componentDidMount(): void {
        const before = JSON.stringify(this.props.tro.export());
        this.props.tro.prune(this.props.adapter.getEquipmentCopies(), this.props.adapter.getKnownEquipmentUuids(), this.props.adapter.getKnownEquipmentTags());
        if (JSON.stringify(this.props.tro.export()) !== before) {
            this.props.onChange();
            this.forceUpdate();
        }
    }

    /** Applies an edit to the record, then saves and redraws. */
    private _edit = (change: () => void): void => {
        change();
        this.props.onChange();
        this.forceUpdate();
    };

    private _setMixed = (tag: string, mixed: boolean): void => {
        this._edit(() => {
            const { adapter, tro } = this.props;
            const copies = adapter.getEquipmentCopies().map((copy) => (mixed && copy.tag === tag ? { ...copy, uuid: adapter.ensureEquipmentUuid(copy) } : copy));
            tro.setMixed(tag, mixed, copies);
        });
    };

    private _makeInputs(label: string, make: ITroMake, onMake: (make: ITroMake) => void): JSX.Element {
        return (
            <>
                <td>
                    <input type="text" aria-label={`${label} manufacturer`} value={make.manufacturer ?? ""}
                        onChange={(event) => this._edit(() => onMake({ ...make, manufacturer: event.target.value }))} />
                </td>
                <td>
                    <input type="text" aria-label={`${label} model`} value={make.model ?? ""}
                        onChange={(event) => this._edit(() => onMake({ ...make, model: event.target.value }))} />
                </td>
            </>
        );
    }

    private _renderEquipmentType(tag: string, copies: ITroEquipmentCopy[]): JSX.Element[] {
        const { tro } = this.props;
        const name = copies[0].name;
        const mixed = tro.isMixed(tag);
        const rows: JSX.Element[] = [
            <tr key={tag}>
                <td>{name}</td>
                <td>{copies.length}</td>
                {mixed
                    ? <td colSpan={2} className="muted">mixed: set on each copy below</td>
                    : this._makeInputs(name, tro.getTypeMake(tag), (make) => tro.setTypeMake(tag, make))}
                <td>
                    <input type="checkbox" aria-label={`${name} mixed`} checked={mixed} disabled={copies.length < 2 && !mixed}
                        onChange={(event) => this._setMixed(tag, event.target.checked)} />
                </td>
            </tr>,
        ];
        if (mixed) {
            copies.forEach((copy, index) => {
                rows.push(
                    <tr key={`${tag}-${copy.uuid || index}`} className="sub">
                        <td>{`${name} (${copy.locationLabel})`}</td>
                        <td />
                        {this._makeInputs(`${name} (${copy.locationLabel})`, tro.getCopyMake(tag, copy.uuid), (make) => tro.setCopyMake(tag, copy.uuid, make))}
                        <td />
                    </tr>,
                );
            });
        }
        return rows;
    }

    render(): JSX.Element {
        const { tro, adapter } = this.props;
        const rows = adapter.getComponentRows();
        const extraKeys = tro.getComponentKeys().filter((key) => !rows.some((row) => row.key === key));
        const copies = adapter.getEquipmentCopies();
        const tags = [...new Set(copies.map((copy) => copy.tag))];

        return (
            <div className="tro-section">
                <fieldset>
                    <legend>Production</legend>
                    {PRODUCTION_FIELDS.map((field) => (
                        <div className="tro-field" key={field.key}>
                            <label htmlFor={`tro-${field.key}`}>{field.label}</label>
                            <input id={`tro-${field.key}`} type="text" value={tro.getProduction(field.key)}
                                onChange={(event) => this._edit(() => tro.setProduction(field.key, event.target.value))} />
                        </div>
                    ))}
                </fieldset>

                <fieldset>
                    <legend>Components</legend>
                    <p className="muted">One make each.</p>
                    {[...rows, ...extraKeys.map((key): ITroComponentRow => ({ key, label: TRO_COMPONENT_LABELS[key] ?? key }))].map((row) => (
                        <div className="tro-field" key={row.key}>
                            <label htmlFor={`tro-component-${row.key}`}>{row.label}</label>
                            <input id={`tro-component-${row.key}`} type="text" value={tro.getComponent(row.key)} placeholder={row.suggested}
                                onChange={(event) => this._edit(() => tro.setComponent(row.key, event.target.value))} />
                        </div>
                    ))}
                </fieldset>

                <fieldset>
                    <legend>Equipment</legend>
                    <p className="muted">One row per equipment type. Ammunition has no make.</p>
                    {tags.length === 0
                        ? <p className="muted">This design has no equipment.</p>
                        : (
                            <table>
                                <thead>
                                    <tr><th>Equipment</th><th>Qty</th><th>Manufacturer</th><th>Model</th><th>Mixed</th></tr>
                                </thead>
                                <tbody>
                                    {tags.flatMap((tag) => this._renderEquipmentType(tag, copies.filter((copy) => copy.tag === tag)))}
                                </tbody>
                            </table>
                        )}
                </fieldset>

                <fieldset>
                    <legend>Text</legend>
                    {TRO_TEXT_SECTIONS.map((section) => (
                        <div className="tro-field" key={section.key}>
                            <label htmlFor={`tro-text-${section.key}`}>{section.label}</label>
                            <textarea id={`tro-text-${section.key}`} rows={4} value={tro.getText(section.key)}
                                onChange={(event) => this._edit(() => tro.setText(section.key, event.target.value))} />
                        </div>
                    ))}
                </fieldset>
            </div>
        );
    }
}
