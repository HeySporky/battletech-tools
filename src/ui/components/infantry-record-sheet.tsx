import React, { type JSX } from 'react';
import InfantryPlatoon, { INFANTRY_SPECIAL_FEATURES } from '../../classes/infantry-platoon';

const formatModifier = (modifier: number): string => modifier > 0 ? `+${modifier}` : `${modifier}`;

// A conventional infantry record sheet (TechManual p.154): the platoon's data, one line of troopers for each
// platoon or sub-platoon with the Max Weapon Damage under each trooper, and the Range Modifiers row.
export default class InfantryRecordSheet extends React.Component<IInfantryRecordSheetProps> {
    render = (): JSX.Element => {
        const platoon = this.props.platoon;
        const lines = platoon.getSubPlatoons();
        const modifiers = platoon.getRangeModifiers();
        const secondary = platoon.getSecondaryWeapon();
        const features = platoon.getSpecialFeatures();
        const cost = platoon.getCBillCost();
        const cell: React.CSSProperties = { border: "1px solid #000", textAlign: "center", padding: "0.15em 0.3em", minWidth: "1.9em" };
        // With showDamage, troopers eliminated in play are blacked out.
        const trooperCell = (line: number, number: number): React.CSSProperties =>
            this.props.showDamage && number > platoon.getLineTroopers(line) ? { ...cell, background: "#000", color: "#fff" } : cell;

        return (
            <div className="print-page">
                <h2>{platoon.getDisplayName()}</h2>
                <p>
                    <strong>Conventional Infantry</strong> - {platoon.getMotive().name} &nbsp;|&nbsp;
                    {platoon.isClan() ? "Clan" : "Inner Sphere"} ({platoon.getFormation().name}) &nbsp;|&nbsp;
                    {platoon.getSquads()} squads of {platoon.getSquadSize()}: {platoon.getTroopers()} troopers &nbsp;|&nbsp;
                    Movement {platoon.getMovementText()} &nbsp;|&nbsp;
                    {platoon.getWeight()} tons &nbsp;|&nbsp;
                    BV {platoon.getBattleValue()} &nbsp;|&nbsp;
                    {cost === null ? "Cost not listed" : `${cost.toLocaleString("en-US")} C-Bills`}
                </p>
                <p>
                    <strong>Primary Weapon</strong>: {platoon.getPrimaryWeapon().name} &nbsp;|&nbsp;
                    <strong>Secondary Weapon</strong>: {secondary && platoon.getSecondaryPerSquad() > 0 ? `${secondary.name}, ${platoon.getSecondaryPerSquad()} per squad` : "None"} &nbsp;|&nbsp;
                    <strong>Gunnery</strong> {platoon.getGunnery()} / <strong>Anti-'Mech</strong> {platoon.getAntiMechSkill()} &nbsp;|&nbsp;
                    <strong>Prohibited Terrain</strong>: {platoon.getMotive().prohibitedTerrain}
                </p>
                {features.length > 0 ? (
                    <p><strong>Special</strong>: {features.map((code) => INFANTRY_SPECIAL_FEATURES[code]).join("; ")}</p>
                ) : null}

                {lines.map((troopers, lineIndex) => (
                    <div key={lineIndex} style={{ marginBottom: "1em" }} data-testid="infantry-sheet-line">
                        <h4>
                            {lines.length > 1 ? `Sub-Platoon ${lineIndex + 1}` : platoon.isClan() ? "Point" : "Platoon"}: {troopers} troopers, {platoon.getWeight(troopers)} tons
                            {this.props.showDamage && platoon.getLineTroopers(lineIndex) < troopers ? ` (${platoon.getLineTroopers(lineIndex)} active)` : ""}
                        </h4>
                        <table style={{ borderCollapse: "collapse" }}>
                            <tbody>
                                <tr>
                                    <th style={{ ...cell, textAlign: "left" }}>Trooper</th>
                                    {Array.from({ length: troopers }, (_unused, index) => troopers - index).map((number) => (
                                        <td key={number} style={trooperCell(lineIndex, number)}>{number}</td>
                                    ))}
                                </tr>
                                <tr>
                                    <th style={{ ...cell, textAlign: "left" }}>Max Weapon Damage</th>
                                    {Array.from({ length: troopers }, (_unused, index) => troopers - index).map((number) => (
                                        <td key={number} style={cell}>{platoon.getDamageForTroopers(number)}</td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ))}

                <h4>Range Modifiers ({platoon.getRangeWeapon().name}, Base Range {platoon.getRangeWeapon().baseRange})</h4>
                <table style={{ borderCollapse: "collapse" }} data-testid="infantry-sheet-ranges">
                    <tbody>
                        <tr>
                            <th style={{ ...cell, textAlign: "left" }}>Range in Hexes</th>
                            {modifiers.map((_unused, range) => <td key={range} style={cell}>{range}</td>)}
                        </tr>
                        <tr>
                            <th style={{ ...cell, textAlign: "left" }}>To-Hit Modifier</th>
                            {modifiers.map((modifier, range) => <td key={range} style={cell}>{formatModifier(modifier)}</td>)}
                        </tr>
                    </tbody>
                </table>
                <p className="small-text">
                    Range 0 is the platoon's own hex. The platoon cannot attack beyond {platoon.getMaxRange()} {platoon.getMaxRange() === 1 ? "hex" : "hexes"}.
                </p>
            </div>
        );
    }
}

interface IInfantryRecordSheetProps {
    platoon: InfantryPlatoon;
    showDamage?: boolean;
}
