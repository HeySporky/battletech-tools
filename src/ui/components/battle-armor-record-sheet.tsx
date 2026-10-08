import React, { type JSX } from 'react';
import BattleArmor, { BATTLE_ARMOR_LOCATION_NAMES } from '../../classes/battle-armor';
import { findBattleArmorEquipment } from '../../data/battle-armor-equipment';
import { findInfantryWeapon } from '../../data/infantry-weapons';

// A battle armor record sheet (TechManual pp.172-173): the unit data, the weapons inventory with a line to count
// missile shots, the Swarm / Leg / Mechanized boxes, and a row for each trooper: the gray trooper circle and a
// white circle for every point of armor.
export default class BattleArmorRecordSheet extends React.Component<IBattleArmorRecordSheetProps> {
    render = (): JSX.Element => {
        const suit = this.props.suit;
        const capabilities = suit.getCapabilities();
        const cell: React.CSSProperties = { border: "1px solid #000", padding: "0.15em 0.4em", textAlign: "left" };
        const circle = (filled: boolean): React.CSSProperties => ({
            display: "inline-block", width: "1.1em", height: "1.1em", border: "1px solid #000", borderRadius: "50%",
            marginRight: "0.2em", background: filled ? "#999" : "#fff", verticalAlign: "middle",
        });
        const box = (checked: boolean, label: string): JSX.Element => (
            <span style={{ marginRight: "1.5em" }}>
                <span style={{ display: "inline-block", width: "1em", height: "1em", border: "1px solid #000", textAlign: "center", lineHeight: "1em", marginRight: "0.3em" }}>{checked ? "X" : ""}</span>
                {label}
            </span>
        );

        return (
            <div className="print-page">
                <h2>{suit.getDisplayName()}</h2>
                <p data-testid="battle-armor-sheet-data">
                    <strong>Battle Armor</strong> - {suit.getWeightClass().name}, {suit.isQuad() ? "Quad" : "Humanoid"} &nbsp;|&nbsp;
                    {suit.isClan() ? "Clan" : "Inner Sphere"} &nbsp;|&nbsp;
                    {suit.getWeight()} kg &nbsp;|&nbsp;
                    Movement: {suit.getMovementText()} &nbsp;|&nbsp;
                    <strong>Gunnery</strong> {suit.getGunnery()} / <strong>Anti-'Mech</strong> {suit.getAntiMechSkill()} &nbsp;|&nbsp;
                    BV {suit.getBattleValue()} &nbsp;|&nbsp;
                    {suit.getCBillCost().toLocaleString("en-US")} C-Bills
                </p>

                <table style={{ borderCollapse: "collapse", marginBottom: "1em" }}>
                    <thead>
                        <tr>
                            <th style={cell}>Weapons Inventory</th><th style={cell}>Loc</th><th style={cell}>Dmg</th>
                            <th style={cell}>Min</th><th style={cell}>Sht</th><th style={cell}>Med</th><th style={cell}>Lng</th><th style={cell}>Shots</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suit.getItems().map((entry, index) => {
                            const equipment = findBattleArmorEquipment(entry.tag);
                            if (!equipment) return null;
                            const range = equipment.range.split("/");
                            const bands = range.length === 4 ? range : ["", "", "", equipment.range];
                            const shots = suit.getItemShots(entry);
                            return (
                                <tr key={index}>
                                    <td style={cell}>
                                        {equipment.name}
                                        {entry.squadSupport ? " (squad support weapon)" : ""}{entry.modular ? " (modular)" : ""}{entry.detachable ? " (detachable)" : ""}
                                    </td>
                                    <td style={cell}>{BATTLE_ARMOR_LOCATION_NAMES[entry.location]}</td>
                                    <td style={cell}>{equipment.damage}</td>
                                    {bands.map((band, bandIndex) => <td key={bandIndex} style={cell}>{band === "-" ? "" : band}</td>)}
                                    <td style={cell}>{shots > 0 ? `${shots}: ${"O ".repeat(shots * suit.getSquadSize()).trim()}` : ""}</td>
                                </tr>
                            );
                        })}
                        {suit.getAPMounts().map((mount, index) => {
                            const weapon = findInfantryWeapon(mount.weapon);
                            return (
                                <tr key={`ap-${index}`}>
                                    <td style={cell}>Anti-personnel mount: {weapon ? weapon.name : "empty"}</td>
                                    <td style={cell}>{BATTLE_ARMOR_LOCATION_NAMES[mount.location]}</td>
                                    <td style={cell}>{weapon ? weapon.damage : ""}</td>
                                    <td style={cell} colSpan={5}>{weapon ? `Conventional infantry weapon, base range ${weapon.baseRange}` : ""}</td>
                                </tr>
                            );
                        })}
                        {suit.getItems().length + suit.getAPMounts().length === 0 ? <tr><td style={cell} colSpan={8}>No weapons or equipment</td></tr> : null}
                    </tbody>
                </table>

                <p>
                    {box(capabilities.swarm, "Swarm")}{box(capabilities.leg, "Leg")}{box(capabilities.mechanized, "Mechanized")}
                    {suit.isQuad() ? null : <>&nbsp; <strong>Manipulators</strong>: {suit.getManipulator("la").name} (left), {suit.getManipulator("ra").name} (right)</>}
                </p>

                <table style={{ borderCollapse: "collapse" }} data-testid="battle-armor-sheet-troopers">
                    <tbody>
                        {Array.from({ length: suit.getSquadSize() }, (_unused, trooper) => (
                            <tr key={trooper}>
                                <th style={cell}>{trooper + 1}</th>
                                <td style={cell}>
                                    <span style={circle(true)} title="The trooper" />
                                    {Array.from({ length: suit.getArmorPoints() }, (_point, point) => <span key={point} style={circle(false)} />)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p>
                    <strong>Armor</strong>: {suit.getArmor().name}, {suit.getArmorPoints()} points a trooper
                    {suit.getArmor().special !== "None" && suit.getArmorPoints() > 0 ? ` - ${suit.getArmor().special}` : ""}
                </p>
                {capabilities.notes.length > 0 ? <p className="small-text">{capabilities.notes.join(" ")}</p> : null}
            </div>
        );
    }
}

interface IBattleArmorRecordSheetProps {
    suit: BattleArmor;
}
