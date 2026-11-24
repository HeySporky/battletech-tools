import * as React from 'react';
import type { JSX } from "react";
import {
    alphaStrikeScanFields, alphaStrikeScanRecord, IAlphaStrikeScanMatch, IAlphaStrikeScanResult, isAlphaStrikeScanRead,
    matchAlphaStrikeScan, scanAlphaStrikeCard, TAlphaStrikeScanField,
} from '../../../../classes/alpha-strike-card-scan';
import { AlphaStrikeUnit, IASMULUnit } from '../../../../classes/alpha-strike-unit';
import { loadMULListItems } from '../../../../data/mul-list-items';
import { IAppGlobals } from '../../../app-router';
import TextSection from '../../../components/text-section';

interface IScanUnitCardProps {
    appGlobals: IAppGlobals;
    addToGroup: ( unit: AlphaStrikeUnit, groupIndex: number ) => void;
}

interface IScanUnitCardState {
    scanning: boolean;
    photo: string;
    error: string;
    scan: IAlphaStrikeScanResult | null;
    match: IAlphaStrikeScanMatch | null;
    checked: boolean;
    groupIndex: number;
    added: string;
}

/**
 * Adding a unit from a photo of its printed Alpha Strike card. A card the MUL lists with the same values adds the
 * MUL's unit; a printing that differs is shown beside the MUL for the player to choose; a card the MUL doesn't list
 * (a custom, or a unit printed elsewhere) is read into a form to check before it's added as printed.
 */
export default class ScanUnitCard extends React.Component<IScanUnitCardProps, IScanUnitCardState> {
    constructor( props: IScanUnitCardProps ) {
        super( props );
        this.state = { scanning: false, photo: "", error: "", scan: null, match: null, checked: false, groupIndex: 0, added: "" };
    }

    componentWillUnmount = () => {
        if( this.state.photo ) URL.revokeObjectURL( this.state.photo );
    }

    private _scanPhoto = async ( e: React.ChangeEvent<HTMLInputElement> ) => {
        const input = e.currentTarget;
        const file = input.files && input.files[0];
        if( !file ) return;
        if( this.state.photo ) URL.revokeObjectURL( this.state.photo );
        this.setState({ scanning: true, photo: URL.createObjectURL( file ), error: "", scan: null, match: null, checked: false, added: "" });
        try {
            // Loaded on demand, with tesseract, so the roster stays small for everyone else.
            const { scanCardPhoto } = await import( '../../../../classes/card-scan-browser' );
            const scan = await scanCardPhoto( file, scanAlphaStrikeCard );
            const units = await loadMULListItems( this.props.appGlobals.appSettings.alphaStrikeMULSources );
            this.setState({ scan: scan, match: matchAlphaStrikeScan( scan, units ) });
        } catch( err ) {
            this.setState({ error: "The photo couldn't be read (" + ( err instanceof Error ? err.message : String( err ) ) + "). The text reader downloads its English data the first time, so it needs a connection once." });
        }
        input.value = "";
        this.setState({ scanning: false });
    }

    private _edit = ( field: TAlphaStrikeScanField, value: string ) => {
        if( !this.state.scan ) return;
        this.setState({ scan: { ...this.state.scan, [field]: value } });
    }

    private _add = ( record: IASMULUnit ) => {
        const unit = new AlphaStrikeUnit();
        unit.importMUL( JSON.parse( JSON.stringify( record ) ) );
        this.props.addToGroup( unit, this.state.groupIndex );
        this.setState({ added: unit.name || record.Name });
    }

    private _renderGroup = (): JSX.Element | null => {
        const force = this.props.appGlobals.currentASForce;
        if( !force || force.groups.length < 2 ) return null;
        return (
            <label>
                Add to:{" "}
                <select value={this.state.groupIndex} style={{ width: "auto" }} onChange={( e ) => this.setState({ groupIndex: +e.currentTarget.value })}>
                    {force.groups.map( ( group, index ) => <option key={index} value={index}>{group.getName( index + 1 )}</option> )}
                </select>
            </label>
        );
    }

    private _renderMatch = ( scan: IAlphaStrikeScanResult, match: IAlphaStrikeScanMatch ): JSX.Element => {
        const unit = match.unit;
        if( match.status === "matched" && unit ) {
            return (
                <>
                    <p><strong>Found on the MUL:</strong> {unit.Name} {unit.Variant}, and every value read from the card agrees.</p>
                    <button className="btn btn-primary btn-sm" onClick={() => this._add( unit )}>Add {unit.Name} {unit.Variant}</button>
                </>
            );
        }
        if( match.status === "conflict" && unit ) {
            return (
                <>
                    <p><strong>The MUL lists {unit.Name} {unit.Variant}, with different values.</strong> Check these against the card: OCR may have misread them, or the card may be an older printing.</p>
                    <table className="table table-sm">
                        <thead><tr><th></th><th>Card as read</th><th>MUL</th></tr></thead>
                        <tbody>
                            {match.differences.map( ( difference ) => (
                                <tr key={difference.field}><th>{difference.label}</th><td>{difference.card || "-"}</td><td>{difference.mul || "-"}</td></tr>
                            ) )}
                        </tbody>
                    </table>
                    <button className="btn btn-primary btn-sm" onClick={() => this._add( unit )}>Use the MUL's</button>{" "}
                    <button className="btn btn-secondary btn-sm" disabled={!this.state.checked} onClick={() => this._add( alphaStrikeScanRecord( scan, unit ) )}>Use the card as printed</button>
                    {this._renderForm( scan )}
                </>
            );
        }
        return (
            <>
                <p><strong>Not on the MUL.</strong> A custom unit, or one printed elsewhere: check every value below against the card, then add it as printed.</p>
                {this._renderForm( scan )}
                <button className="btn btn-primary btn-sm" disabled={!this.state.checked || !scan.chassis} onClick={() => this._add( alphaStrikeScanRecord( scan ) )}>Add as printed</button>
            </>
        );
    }

    private _renderForm = ( scan: IAlphaStrikeScanResult ): JSX.Element => (
        <>
            <div className="as-scan-fields">
                {alphaStrikeScanFields.map( ( { field, label } ) => (
                    <label key={field} className="as-scan-field">
                        {label}: <input type="text" value={scan[field]} onChange={( e ) => this._edit( field, e.currentTarget.value )} />
                    </label>
                ) )}
            </div>
            <label>
                <input type="checkbox" checked={this.state.checked} onChange={( e ) => this.setState({ checked: e.currentTarget.checked })} />
                {" "}I've checked these against the card
            </label>
        </>
    );

    render = (): JSX.Element => {
        const { scan, match } = this.state;
        return (
            <TextSection label="Add from a Card Photo">
                <div className="as-scan">
                    <p className="small-text">
                        Photograph a printed unit card straight on, and it's looked up on the Master Unit List. The photo stays on your device.
                    </p>
                    <p className="small-text as-scan-note">
                        <strong>The card reader isn't perfect.</strong> It misreads some letters and numbers, and can match the wrong unit. Check what it found against your card before you add it, and check the unit on your force afterwards.
                    </p>
                    <label>
                        Photo of the card's front:{" "}
                        <input type="file" accept="image/*" disabled={this.state.scanning} style={{ width: "auto" }} onChange={this._scanPhoto} />
                    </label>
                    {this.state.scanning ? <p><strong>Reading the card...</strong> This takes a little while, longer the first time.</p> : null}
                    {this.state.error ? <p className="text-danger">{this.state.error}</p> : null}
                    {this.state.photo && !this.state.scanning ? (
                        <a href={this.state.photo} target="_blank" rel="noopener noreferrer"><img className="as-scan-photo" src={this.state.photo} alt="Your photo of the card" /></a>
                    ) : null}
                    {scan && match ? (
                        isAlphaStrikeScanRead( scan ) || match.status !== "unmatched" ? (
                            <>
                                {this._renderGroup()}
                                {this._renderMatch( scan, match )}
                            </>
                        ) : <p>This doesn't read as the front of a unit card. Try a straighter photo with the whole card in it.</p>
                    ) : null}
                    {this.state.added ? <p className="text-success">Added {this.state.added} to your force.</p> : null}
                </div>
            </TextSection>
        );
    }
}
