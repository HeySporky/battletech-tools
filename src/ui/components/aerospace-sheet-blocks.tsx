import React, { type JSX } from 'react';
import { IEquipmentItem } from '../../data/data-interfaces';
import { AEROSPACE_HEAT_SCALE, AEROSPACE_PILOT_HITS, getAerospaceDamageByBracket, toCapitalScale } from '../../data/aerospace-record-sheet';

// Blocks the aerospace record sheets share (TM pp.336-339; SO:AA pp.9-11): the Weapons and Equipment Inventory with
// Attack Values by range bracket, pilot or crew hits, critical damage boxes, the Heat Scale and the Velocity Record.

export interface IAerospaceInventoryRow {
    quantity: number;
    name: string;
    location: string;
    heat: number;
    /** Standard-scale SRV, MRV, LRV, ERV; null when unknown. */
    values: [number, number, number, number] | null;
    /** Capital weapons: their values are capital scale already. */
    capital?: boolean;
}

/** Rows for standard-scale items, one per weapon model and location, with combined heat and damage (TW p.30). */
export function aerospaceInventoryRows(items: IEquipmentItem[], locationName: (location: string) => string, suffix?: (item: IEquipmentItem) => string): IAerospaceInventoryRow[] {
    const rows: IAerospaceInventoryRow[] = [];
    for (const item of items.filter((entry) => !entry.isAmmo)) {
        const name = item.name + (suffix ? suffix(item) : "");
        const location = locationName(item.location ?? "");
        const values = getAerospaceDamageByBracket(item);
        const row = rows.find((entry) => entry.name === name && entry.location === location);
        if (row) {
            row.quantity++;
            row.heat += item.heatAero ?? item.heat ?? 0;
            row.values = row.values && values ? row.values.map((value, index) => value + values[index]) as [number, number, number, number] : null;
        } else {
            rows.push({ quantity: 1, name, location, heat: item.heatAero ?? item.heat ?? 0, values: values ? [...values] : null });
        }
    }
    return rows;
}

/**
 * The inventory table. With capitalScale (JumpShips, WarShips, stations), standard weapons show capital-scale values
 * with standard scale in parentheses and capital weapons capital scale alone (SO:AA p.9; MegaMekLab prints the same).
 * SO:AA p.146's example puts standard scale first; p.9 and MegaMekLab are followed. The sheets print the Medium
 * bracket as "6-12", an obvious misprint for 7-12 (Short ends at 6).
 */
export const AerospaceInventoryTable = (props: { rows: IAerospaceInventoryRow[]; capitalScale?: boolean; locationHeader?: string; testId?: string }): JSX.Element => {
    const format = (row: IAerospaceInventoryRow, value: number): string => {
        if (value === 0) return "-";
        if (row.capital) return String(value);
        return props.capitalScale ? `${toCapitalScale(value)} (${value})` : String(value);
    };
    return (
        <table className="table" data-testid={props.testId}>
            <thead>
                <tr>
                    <th>Qty</th><th>Weapons and Equipment</th><th>{props.locationHeader ?? "Loc."}</th><th className="text-right">Ht</th>
                    <th className="text-right">SRV</th><th className="text-right">MRV</th><th className="text-right">LRV</th><th className="text-right">ERV</th>
                </tr>
                <tr className="small-text">
                    <th colSpan={4}>{props.capitalScale ? "Capital scale (standard scale)" : "Standard scale"}</th>
                    {(props.capitalScale ? ["1-12", "13-24", "25-40", "41-50"] : ["0-6", "7-12", "13-20", "21-25"]).map((range) => <th key={range} className="text-right">({range})</th>)}
                </tr>
            </thead>
            <tbody>
                {props.rows.length === 0 ? <tr><td colSpan={8}>-</td></tr> : props.rows.map((row, index) => (
                    <tr key={index}>
                        <td>{row.quantity}</td>
                        <td>{row.name}</td>
                        <td>{row.location}</td>
                        <td className="text-right">{row.heat || "-"}</td>
                        {[0, 1, 2, 3].map((bracket) => (
                            <td key={bracket} className="text-right">{row.values ? format(row, row.values[bracket]) : "?"}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const box = (filled: boolean, key?: React.Key): JSX.Element => (
    <span key={key} style={{
        display: "inline-block", width: "0.9em", height: "0.9em", border: "1px solid #000", marginRight: "0.2em", verticalAlign: "middle",
        background: filled ? "#000" : "transparent",
    }} />
);

/** Critical damage tracks, each box labelled with its printed effect; filled boxes are hits marked in play. */
export const AerospaceCriticalBlock = (props: { tracks: { name: string; boxes: string[]; filled?: number }[]; testId?: string }): JSX.Element => (
    <table className="table table-condensed" data-testid={props.testId}>
        <tbody>
            {props.tracks.map((track) => (
                <tr key={track.name}>
                    <th>{track.name}</th>
                    <td>
                        {track.boxes.map((label, index) => (
                            <span key={index} style={{ marginRight: "0.8em", whiteSpace: "nowrap" }}>{box(index < (track.filled ?? 0))}{label}</span>
                        ))}
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);

/** Pilot (or crew) data: name, skills and the hits-taken track with consciousness numbers (TM p.336). */
export const AerospacePilotBlock = (props: { title?: string; name?: string; gunnery?: number; piloting?: number; hits?: number; crewModifiers?: string[] }): JSX.Element => (
    <>
        <h3>{props.title ?? "Pilot Data"}</h3>
        <p>
            <strong>Name</strong>: {props.name || "________________"} &nbsp;|&nbsp;
            <strong>Gunnery Skill</strong>: {props.gunnery ?? "__"} &nbsp;|&nbsp;
            <strong>Piloting Skill</strong>: {props.piloting ?? "__"}
        </p>
        <table className="table table-condensed">
            <tbody>
                <tr><th>Hits Taken</th>{[1, 2, 3, 4, 5, 6].map((hit) => <td key={hit} className="text-center">{box(hit <= (props.hits ?? 0))} {hit}</td>)}</tr>
                {props.crewModifiers ? null : <tr><th>Consciousness #</th>{AEROSPACE_PILOT_HITS.map((row) => <td key={row.hit} className="text-center">{row.consciousness}</td>)}</tr>}
                <tr><th>Modifier</th>{(props.crewModifiers ?? AEROSPACE_PILOT_HITS.map((row) => row.modifier)).map((modifier, index) => <td key={index} className="text-center">{modifier}</td>)}</tr>
            </tbody>
        </table>
    </>
);

/** Heat Data: heat sinks and the Heat Scale with its effects (TM p.336; rules TW p.161). */
export const AerospaceHeatBlock = (props: { heatSinks: number; heatSinkType: string; dissipation: number; heat?: number }): JSX.Element => (
    <>
        <h3>Heat Data</h3>
        <p>
            <strong>Heat Sinks</strong>: {props.heatSinks} {props.heatSinkType} ({props.dissipation})
            {props.heat !== undefined && props.heat > 0 ? <> &nbsp;|&nbsp; <strong>Current heat</strong>: {props.heat}{props.heat > 30 ? ` (overflow ${props.heat - 30})` : ""}</> : null}
        </p>
        <table className="table table-condensed" data-testid="aerospace-heat-scale">
            <thead><tr><th>Heat Level</th><th>Effects</th></tr></thead>
            <tbody>
                {AEROSPACE_HEAT_SCALE.map((row) => (
                    <tr key={row.heat} style={props.heat !== undefined && props.heat >= row.heat ? { fontWeight: "bold" } : undefined}>
                        <td>{row.heat}*</td><td>{row.effect}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </>
);

/** Velocity Record: 20 turns of Thrust, Velocity and Effective Velocity, plus Altitude for units that fly in atmosphere. */
export const AerospaceVelocityRecord = (props: { altitude?: boolean }): JSX.Element => {
    const rows = ["Thrust", "Velocity", "Effective Velocity", ...(props.altitude ? ["Altitude"] : [])];
    return (
        <>
            <h3>Velocity Record</h3>
            {[[1, 10], [11, 20]].map(([first, last]) => (
                <table className="table table-condensed table-bordered" key={first}>
                    <tbody>
                        <tr><th>Turn #</th>{Array.from({ length: last - first + 1 }, (_, index) => <th key={index} className="text-center">{first + index}</th>)}</tr>
                        {rows.map((row) => <tr key={row}><th>{row}</th>{Array.from({ length: 10 }, (_, index) => <td key={index}>&nbsp;</td>)}</tr>)}
                    </tbody>
                </table>
            ))}
        </>
    );
};
