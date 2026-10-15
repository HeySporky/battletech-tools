import React, { type JSX } from 'react';
import ProtoMech, { PROTOMECH_CRITICAL_BOXES, PROTOMECH_CRITICAL_EFFECTS, PROTOMECH_HIT_LOCATIONS } from '../../classes/protomech';

// A ProtoMech record sheet (TechManual p.89; Total Warfare pp.184-187): the unit data, then a block for each ProtoMech
// of the Point with its weapons inventory, the hit locations and critical hits, and the armor diagram: a white circle
// for every point of armor and a gray one for every point of internal structure.
export default class ProtoMechRecordSheet extends React.Component<IProtoMechRecordSheetProps> {
    render = (): JSX.Element => {
        const proto = this.props.proto;
        const showDamage = !!this.props.showDamage;
        const cell: React.CSSProperties = { border: "1px solid #000", padding: "0.15em 0.4em", textAlign: "left", verticalAlign: "top" };
        const circle = (structure: boolean, marked: boolean): React.CSSProperties => ({
            display: "inline-block", width: "1em", height: "1em", border: "1px solid #000", borderRadius: "50%",
            marginRight: "0.15em", background: marked ? "#000" : structure ? "#999" : "#fff", verticalAlign: "middle",
        });
        const box = (marked: boolean): React.CSSProperties => ({
            display: "inline-block", width: "0.9em", height: "0.9em", border: "1px solid #000", marginRight: "0.2em",
            background: marked ? "#000" : "#fff", verticalAlign: "middle",
        });
        const lines = proto.getWeaponLines();
        const rolls = (location: string): string => Object.entries(PROTOMECH_HIT_LOCATIONS).filter((entry) => entry[1] === location).map((entry) => entry[0]).join(", ");
        const units = Array.from({ length: proto.getPointSize() }, (_unused, unit) => unit);

        return (
            <div className="print-page">
                <h2>{proto.getDisplayName()}</h2>
                <p data-testid="protomech-sheet-data">
                    <strong>ProtoMech</strong> - {proto.getTons()} tons, {proto.getChassisName()}{proto.isUltraheavy() ? ", Ultraheavy" : ""} &nbsp;|&nbsp;
                    {proto.getTechName()} &nbsp;|&nbsp;
                    Movement: {proto.getMovementText()} &nbsp;|&nbsp;
                    <strong>Gunnery</strong> {proto.getGunnery()} &nbsp;|&nbsp;
                    BV {proto.getBattleValue()}{proto.getPointSize() > 1 ? ` (Point of ${proto.getPointSize()}: ${proto.getPointBattleValue()})` : ""} &nbsp;|&nbsp;
                    {proto.getCBillCost().toLocaleString("en-US")} C-Bills
                </p>

                {units.map((unit) => {
                    const destroyed = showDamage && proto.isUnitDestroyed(unit);
                    return (
                        <div key={unit} style={{ marginBottom: "1em", pageBreakInside: "avoid" }} data-testid={`protomech-sheet-unit-${unit}`}>
                            <h4>ProtoMech {unit + 1}{destroyed ? " - destroyed" : ""}</h4>
                            <table style={{ borderCollapse: "collapse", marginBottom: "0.5em" }}>
                                <thead>
                                    <tr>
                                        <th style={cell}>Weapons Inventory</th><th style={cell}>Loc</th><th style={cell}>Dmg</th>
                                        <th style={cell}>Min</th><th style={cell}>Sht</th><th style={cell}>Med</th><th style={cell}>Lng</th><th style={cell}>Ammo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lines.length === 0 ? <tr><td style={cell} colSpan={8}>No weapons or equipment</td></tr> : null}
                                    {lines.map((line) => {
                                        const lost = showDamage && proto.isMountLost(unit, line.index);
                                        const left = showDamage ? proto.getShotsLeft(unit, line.index) : line.shots;
                                        return (
                                            <tr key={line.index} style={lost ? { textDecoration: "line-through" } : undefined}>
                                                <td style={cell}>{line.name}</td>
                                                <td style={cell}>{line.location}</td>
                                                <td style={cell}>{line.damage}</td>
                                                <td style={cell}>{line.long ? line.min || "-" : ""}</td>
                                                <td style={cell}>{line.long ? line.short : ""}</td>
                                                <td style={cell}>{line.long ? line.medium : ""}</td>
                                                <td style={cell}>{line.long ? line.long : ""}</td>
                                                <td style={cell}>{line.shots === null ? "" : `${left}${showDamage ? ` of ${line.shots}` : ""}`}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <table style={{ borderCollapse: "collapse" }}>
                                <thead>
                                    <tr><th style={cell}>2D6</th><th style={cell}>Location</th><th style={cell}>Armor and Structure</th><th style={cell}>Critical Hits</th></tr>
                                </thead>
                                <tbody>
                                    {proto.getLocations().map((location) => {
                                        const damage = showDamage ? proto.getLocationDamage(unit, location) : 0;
                                        const armor = proto.getArmor(location);
                                        const criticals = showDamage ? proto.getCriticals(unit, location) : 0;
                                        return (
                                            <tr key={location}>
                                                <td style={cell}>{rolls(location)}</td>
                                                <td style={cell}>{proto.getLocationName(location)}</td>
                                                <td style={cell}>
                                                    {Array.from({ length: armor }, (_point, point) => <span key={`a${point}`} style={circle(false, point < damage)} />)}
                                                    {Array.from({ length: proto.getStructure(location) }, (_point, point) => <span key={`s${point}`} style={circle(true, armor + point < damage)} />)}
                                                </td>
                                                <td style={cell} className="small-text">
                                                    {PROTOMECH_CRITICAL_EFFECTS[location].slice(0, PROTOMECH_CRITICAL_BOXES[location]).map((effect, index) => (
                                                        <div key={index}><span style={box(index < criticals)} />{effect}</div>
                                                    ))}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    <tr>
                                        <td style={cell}>3, 11</td>
                                        <td style={cell} colSpan={3}>Near miss: no damage{proto.isGlider() ? "; a Glider in flight loses 1 WiGE Cruising MP (IO:AE p. 94)" : ""}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <p style={{ marginTop: "0.3em" }}>
                                <strong>Warrior hits</strong>: {Array.from({ length: 6 }, (_hit, hit) => <span key={hit} style={box(showDamage && hit < proto.getPilotHits(unit))} />)}
                                &nbsp; one for each attack that crosses off a critical hit box (TW p. 186)
                                &nbsp;|&nbsp; <strong>Frenzy attack</strong>: {proto.getFrenzyDamage()} damage
                            </p>
                        </div>
                    );
                })}

                <p>
                    <strong>Armor</strong>: {proto.getArmorTypeName()}, {proto.getTotalArmor()} points &nbsp;|&nbsp;
                    <strong>Heat sinks</strong>: {proto.getHeatSinks()}
                    {proto.getJumpType() === "extended" ? <> &nbsp;|&nbsp; Extended jump jets</> : null}
                    {proto.hasMyomerBooster() ? <> &nbsp;|&nbsp; Myomer booster</> : null}
                </p>
                {proto.getNotes().length > 0 ? <p className="small-text">{proto.getNotes().join(" ")}</p> : null}
            </div>
        );
    }
}

interface IProtoMechRecordSheetProps {
    proto: ProtoMech;
    showDamage?: boolean;
}
