import * as React from 'react';
import type { JSX } from "react";
import { QuirkList } from '../../classes/quirk-list';
import { IAssignedQuirk, IQuirk, IQuirkLocation, QuirkAttach, QuirkUnitType } from '../../data/quirk-interfaces';
import { getAssignedAttach, getOfferedQuirks, getQuirk, getQuirkOfferIssue, getQuirkPoints, isQuirkLocationAllowed, QUIRK_LOCATION_RULE_TEXT } from '../../data/quirk-registry';
import { getRecordEditions, getRulesEdition } from '../../data/rules-editions';
import { CUSTOM_HOMEBREW_RULES_LEVEL } from '../../data/rules-level-options';
import { buildCustomQuirkDraft, customQuirkTag, getLocalCustomContentDrafts, saveLocalCustomContentDrafts } from '../../data/custom-content-local';
import { generateUUID } from '../../utils/generateUUID';

const ATTACH_NAMES: Record<QuirkAttach, string> = { unit: "Whole unit", location: "Location", weapon: "Weapon" };
const BLANK_CUSTOM = { customName: "", customKind: "positive" as const, customPoints: "", customAttach: "unit" as QuirkAttach, customSummary: "" };

/** The builder's list of a unit's design quirks, with a row to add one. Quirks never block a design. */
export default class QuirkPicker extends React.Component<IQuirkPickerProps, IQuirkPickerState> {
    constructor(props: IQuirkPickerProps) {
        super(props);
        this.state = { tag: "", attach: "unit", target: "", parameter: "", fromYear: "", toYear: "", message: "", ...BLANK_CUSTOM };
    }

    /** Saves a custom quirk for this unit type in this browser; it is then offered like any other. */
    private _saveCustom = (): void => {
        const name = this.state.customName.trim();
        const points = Number(this.state.customPoints);
        if (!name || !customQuirkTag(name).replace("quirk-custom-", "")) {
            this.setState({ message: "Name the custom quirk" });
            return;
        }
        if (!Number.isFinite(points) || points <= 0) {
            this.setState({ message: "Give the custom quirk a cost of more than 0 points" });
            return;
        }
        if (getQuirk(name) || getQuirk(customQuirkTag(name))) {
            this.setState({ message: `A quirk named ${name} already exists` });
            return;
        }
        const draft = buildCustomQuirkDraft(generateUUID(), {
            name, kind: this.state.customKind, points, attaches: [this.state.customAttach],
            unitTypes: [this.props.unitType], summary: this.state.customSummary,
        });
        const saved = saveLocalCustomContentDrafts([...getLocalCustomContentDrafts(), draft]);
        this.setState({
            ...BLANK_CUSTOM, tag: String(draft.record.tag), attach: this.state.customAttach, target: "", parameter: "",
            message: saved ? "" : "This browser would not save the custom quirk (private mode or storage full). It works until you close this tab.",
        });
    };

    private _selected(): IQuirk | undefined {
        return this.state.tag ? getQuirk(this.state.tag) : undefined;
    }

    /** The locations this quirk may go on. */
    private _allowedLocations(quirk: IQuirk): IQuirkLocation[] {
        return this.props.locations.filter((location) => isQuirkLocationAllowed(quirk, location));
    }

    /** What the quirk's location rule asks for when this assignment breaks it; null when it does not. */
    private _locationRuleBroken(quirk: IQuirk, assigned: IAssignedQuirk): string | null {
        if (!quirk.locationRule) {
            return null;
        }
        const attach = getAssignedAttach(assigned);
        const location = this.props.locations.find((entry) => entry.tag === assigned.location);
        const broken = attach === "location" ? !location || !isQuirkLocationAllowed(quirk, location)
            : attach === "unit" ? this._allowedLocations(quirk).length === 0 : false;
        return broken ? `needs ${QUIRK_LOCATION_RULE_TEXT[quirk.locationRule]}` : null;
    }

    /** The cost choices this unit may take: a quad-only choice only on a quad. */
    private _choices(quirk: IQuirk): number[] | undefined {
        return quirk.cost.choices?.filter((choice) => this.props.quad || !(quirk.quadOnlyChoices ?? []).includes(choice));
    }

    /** Why this assignment's cost choice does not fit the unit; null when it does. */
    private _choiceRuleBroken(quirk: IQuirk, assigned: IAssignedQuirk): string | null {
        const value = Number(assigned.parameter);
        return !this.props.quad && (quirk.quadOnlyChoices ?? []).includes(value) ? `the ${value}-point version needs a quad 'Mech` : null;
    }

    /** Offered here only as apocrypha: a canon quirk the selected edition does not include. */
    private _isApocryphal(quirk: IQuirk): boolean {
        return !quirk.custom && !getRecordEditions(quirk).includes(this.props.editionTag)
            && getQuirkOfferIssue(quirk, this.props.unitType, this.props.editionTag, this.props.rulesLevel) === null;
    }

    private _selectQuirk = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        const quirk = getQuirk(event.target.value);
        this.setState({ tag: event.target.value, attach: quirk?.attaches[0] ?? "unit", target: "", parameter: "", message: "" });
    };

    private _add = (): void => {
        const quirk = this._selected();
        if (!quirk) {
            return;
        }
        const assigned: IAssignedQuirk = { tag: quirk.tag };
        if (this.state.attach === "weapon") {
            if (!this.state.target) {
                this.setState({ message: "Choose a weapon" });
                return;
            }
            assigned.equipmentUuid = this.state.target;
        } else if (this.state.attach === "location") {
            if (!this.state.target) {
                this.setState({ message: "Choose a location" });
                return;
            }
            assigned.location = this.state.target;
        }
        const ruleBroken = this._locationRuleBroken(quirk, assigned);
        if (ruleBroken) {
            this.setState({ message: `${quirk.name}: ${ruleBroken}` });
            return;
        }
        const parameter = this._parameterValue(quirk);
        if (parameter !== undefined) {
            assigned.parameter = parameter;
        }
        const choiceBroken = this._choiceRuleBroken(quirk, assigned);
        if (choiceBroken) {
            this.setState({ message: `${quirk.name}: ${choiceBroken}` });
            return;
        }
        const fromYear = parseInt(this.state.fromYear, 10);
        const toYear = parseInt(this.state.toYear, 10);
        if (Number.isFinite(fromYear)) assigned.fromYear = fromYear;
        if (Number.isFinite(toYear)) assigned.toYear = toYear;
        const refusal = this.props.quirks.add(assigned);
        if (refusal) {
            this.setState({ message: `${quirk.name}: ${refusal}` });
            return;
        }
        this.setState({ tag: "", attach: "unit", target: "", parameter: "", fromYear: "", toYear: "", message: "" });
        this.props.onChange();
    };

    private _remove = (index: number): void => {
        this.props.quirks.remove(index);
        this.setState({ message: "" });
        this.props.onChange();
    };

    /** The parameter as saved: the chosen option or cost, or the typed number; undefined when the quirk has none. */
    private _parameterValue(quirk: IQuirk): string | number | undefined {
        if (!quirk.parameter) {
            return undefined;
        }
        if (quirk.parameter.options) {
            return this.state.parameter || quirk.parameter.options[0];
        }
        const value = Number(this.state.parameter);
        const choices = this._choices(quirk);
        if (choices) {
            return choices.includes(value) ? value : choices[0];
        }
        return this.state.parameter.trim() !== "" && Number.isFinite(value) ? value : undefined;
    }

    private _maxDamage(quirk: IQuirk, assigned: IAssignedQuirk): number {
        if (quirk.cost.per?.scope === "weapon" && assigned.equipmentUuid) {
            return this.props.weapons.find((weapon) => weapon.uuid === assigned.equipmentUuid)?.maxDamage ?? 0;
        }
        return this.props.unitMaxDamage;
    }

    private _describe(assigned: IAssignedQuirk): { name: string; notes: string[]; points: number } {
        const quirk = getQuirk(assigned.tag);
        if (!quirk) {
            return { name: assigned.tag, notes: ["not in this browser's quirk list"], points: 0 };
        }
        const notes: string[] = [];
        const attach = getAssignedAttach(assigned);
        if (attach === "weapon") {
            const weapon = this.props.weapons.find((entry) => entry.uuid === assigned.equipmentUuid);
            notes.push(weapon ? weapon.label : "weapon not installed");
        } else if (attach === "location") {
            notes.push(this.props.locations.find((entry) => entry.tag === assigned.location)?.label ?? assigned.location ?? "");
        }
        const ruleBroken = this._locationRuleBroken(quirk, assigned);
        if (ruleBroken) notes.push(ruleBroken);
        if (assigned.parameter !== undefined) notes.push(String(assigned.parameter));
        const choiceBroken = this._choiceRuleBroken(quirk, assigned);
        if (choiceBroken) notes.push(choiceBroken);
        if (this._isApocryphal(quirk)) notes.push("apocryphal");
        if (assigned.fromYear !== undefined || assigned.toYear !== undefined) notes.push(`${assigned.fromYear ?? ""}-${assigned.toYear ?? ""}`);
        const issue = getQuirkOfferIssue(quirk, this.props.unitType, this.props.editionTag, this.props.rulesLevel);
        if (issue === "edition") notes.push(`not offered in ${getRulesEdition(this.props.editionTag).name}`);
        else if (issue === "level") notes.push("above the selected rules level");
        else if (issue === "unit-type") notes.push("not for this unit type");
        const installed = attach !== "weapon" || this.props.weapons.some((entry) => entry.uuid === assigned.equipmentUuid);
        return { name: quirk.name, notes, points: installed ? getQuirkPoints(quirk, assigned, this._maxDamage(quirk, assigned)) : 0 };
    }

    private _parameterControl(quirk: IQuirk): JSX.Element | null {
        if (!quirk.parameter) {
            return null;
        }
        const update = (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => this.setState({ parameter: event.target.value });
        const choices = quirk.parameter.options ?? this._choices(quirk)?.map(String) ?? null;
        if (choices) {
            const label = quirk.parameter.kind === "range-band" ? "Range bracket" : "Value";
            return (
                <label>{label}{" "}
                    <select aria-label={label} value={choices.includes(this.state.parameter) ? this.state.parameter : choices[0]} onChange={update}>
                        {choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
                    </select>
                </label>
            );
        }
        return (
            <label>Value <input type="number" value={this.state.parameter} onChange={update} style={{ width: "5em" }} /></label>
        );
    }

    render = (): JSX.Element => {
        const assigned = this.props.quirks.getAll();
        const described = assigned.map((entry) => this._describe(entry));
        const { positive, negative } = this.props.quirks.getPointTotals(
            this.props.weapons.map((weapon) => weapon.uuid),
            this.props.unitMaxDamage,
            (uuid) => this.props.weapons.find((weapon) => weapon.uuid === uuid)?.maxDamage ?? 0,
        );
        const offered = getOfferedQuirks(this.props.unitType, this.props.editionTag, this.props.rulesLevel);
        const selected = this._selected();
        const attaches = selected?.attaches ?? [];
        return (
            <div className="quirk-picker">
                <h3>Design Quirks</h3>
                <p className="smaller-text">
                    An optional rule all players should agree to. Campaign Operations (p.225) recommends giving a design
                    negative quirks worth at least as much as its positive ones; each group decides whether to require it.
                </p>
                {assigned.length > 0 ? (
                    <ul>
                        {described.map((entry, index) => (
                            <li key={index}>
                                {entry.name}{entry.notes.length ? ` (${entry.notes.join(", ")})` : ""}: {entry.points > 0 ? "+" : ""}{entry.points}{" "}
                                <button type="button" className="btn btn-xs btn-danger" aria-label={`Remove ${entry.name}`} onClick={() => this._remove(index)}>Remove</button>
                            </li>
                        ))}
                    </ul>
                ) : <p>No quirks.</p>}
                <p>Positive {positive}, negative {negative}</p>
                <div>
                    <label>Quirk{" "}
                        <select aria-label="Quirk" value={this.state.tag} onChange={this._selectQuirk}>
                            <option value="">{offered.length ? "Choose a quirk" : "None offered"}</option>
                            {offered.map((quirk) => (
                                <option key={quirk.tag} value={quirk.tag}>{quirk.kind === "positive" ? "+" : "-"} {quirk.name}{this._isApocryphal(quirk) ? " (apocryphal)" : ""}</option>
                            ))}
                        </select>
                    </label>
                    {attaches.length > 1 ? (
                        <label>{" "}On{" "}
                            <select aria-label="Attach to" value={this.state.attach} onChange={(event) => this.setState({ attach: event.target.value as QuirkAttach, target: "" })}>
                                {attaches.map((attach) => <option key={attach} value={attach}>{ATTACH_NAMES[attach]}</option>)}
                            </select>
                        </label>
                    ) : null}
                    {selected && this.state.attach === "weapon" ? (
                        <label>{" "}Weapon{" "}
                            <select aria-label="Weapon" value={this.state.target} onChange={(event) => this.setState({ target: event.target.value })}>
                                <option value="">Choose</option>
                                {this.props.weapons.map((weapon) => <option key={weapon.uuid} value={weapon.uuid}>{weapon.label}</option>)}
                            </select>
                        </label>
                    ) : null}
                    {selected && this.state.attach === "location" ? (
                        <label>{" "}Location{" "}
                            <select aria-label="Location" value={this.state.target} onChange={(event) => this.setState({ target: event.target.value })}>
                                <option value="">Choose</option>
                                {this._allowedLocations(selected).map((location) => <option key={location.tag} value={location.tag}>{location.label}</option>)}
                            </select>
                        </label>
                    ) : null}
                    {selected ? this._parameterControl(selected) : null}
                    {selected ? (
                        <>
                            <label>{" "}From year <input type="number" value={this.state.fromYear} onChange={(event) => this.setState({ fromYear: event.target.value })} style={{ width: "5em" }} /></label>
                            <label>{" "}to <input type="number" value={this.state.toYear} onChange={(event) => this.setState({ toYear: event.target.value })} style={{ width: "5em" }} /></label>
                        </>
                    ) : null}
                    {" "}<button type="button" className="btn btn-sm btn-primary" disabled={!selected} onClick={this._add}>Add quirk</button>
                </div>
                {selected ? <p className="smaller-text">{selected.summary}{selected.restrictions ? ` ${selected.restrictions}` : ""}</p> : null}
                {this.state.message ? <p className="color-red" role="alert">{this.state.message}</p> : null}
                {this.props.rulesLevel >= CUSTOM_HOMEBREW_RULES_LEVEL ? (
                    <div>
                        <h4>Add custom quirk</h4>
                        <p className="smaller-text">Saved in this browser only, for this unit type; offered at the Custom rules level in every edition.</p>
                        <label>Name <input type="text" aria-label="Custom quirk name" value={this.state.customName} onChange={(event) => this.setState({ customName: event.target.value })} /></label>
                        <label>{" "}Kind{" "}
                            <select aria-label="Custom quirk kind" value={this.state.customKind} onChange={(event) => this.setState({ customKind: event.target.value as "positive" | "negative" })}>
                                <option value="positive">Positive</option>
                                <option value="negative">Negative</option>
                            </select>
                        </label>
                        <label>{" "}Points <input type="number" min={1} aria-label="Custom quirk points" value={this.state.customPoints} onChange={(event) => this.setState({ customPoints: event.target.value })} style={{ width: "5em" }} /></label>
                        <label>{" "}On{" "}
                            <select aria-label="Custom quirk attaches to" value={this.state.customAttach} onChange={(event) => this.setState({ customAttach: event.target.value as QuirkAttach })}>
                                {(Object.keys(ATTACH_NAMES) as QuirkAttach[]).map((attach) => <option key={attach} value={attach}>{ATTACH_NAMES[attach]}</option>)}
                            </select>
                        </label>
                        <div><label>Summary <textarea aria-label="Custom quirk summary" value={this.state.customSummary} onChange={(event) => this.setState({ customSummary: event.target.value })} rows={2} style={{ width: "100%" }} /></label></div>
                        <button type="button" className="btn btn-sm btn-primary" onClick={this._saveCustom}>Save custom quirk</button>
                    </div>
                ) : null}
            </div>
        );
    };
}

interface IQuirkPickerProps {
    quirks: QuirkList;
    unitType: QuirkUnitType;
    editionTag: string;
    rulesLevel: number;
    locations: IQuirkLocation[];
    weapons: { uuid: string; label: string; maxDamage: number }[];
    unitMaxDamage: number;
    /** A quad 'Mech, which alone may take the quad-only cost choices. */
    quad?: boolean;
    onChange: () => void;
}

interface IQuirkPickerState {
    tag: string;
    attach: QuirkAttach;
    target: string;
    parameter: string;
    fromYear: string;
    toYear: string;
    message: string;
    customName: string;
    customKind: "positive" | "negative";
    customPoints: string;
    customAttach: QuirkAttach;
    customSummary: string;
}
