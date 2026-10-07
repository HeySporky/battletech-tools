import React, { type JSX } from 'react';
import Building from '../../classes/building';

const boxes = (count: number): JSX.Element[] => Array.from({ length: count }, (_unused, index) => (
    <span key={index} style={{ display: "inline-block", width: "0.75em", height: "0.75em", border: "1px solid #000", borderRadius: "50%", margin: "0 0.12em 0.12em 0" }} />
));

// A Structure Record Sheet for a static building (TO:AR pp.112, 131): the Structure Data block, the Weapons and
// Equipment Inventory with each item's hex and turret mark, and Armor Factor and CF circles for every hex.
export default class BuildingRecordSheet extends React.Component<IBuildingRecordSheetProps> {
    render = (): JSX.Element => {
        const building = this.props.building;
        const classification = building.getClassification();
        const type = building.getType();
        const hexes = Array.from({ length: building.getHexes() }, (_unused, index) => index + 1);
        const cell: React.CSSProperties = { border: "1px solid #000", padding: "0.15em 0.4em", verticalAlign: "top" };
        const equipment = building.getEquipment();
        const generator = building.getGenerator();

        return (
            <div className="print-page">
                <h2>{building.getName() || `${type.tag === "none" ? "" : type.name + " "}${classification.name}`}</h2>
                <p data-testid="building-sheet-data">
                    <strong>Structure Type</strong>: {classification.name}{type.tag === "none" ? "" : `, ${type.name}`} &nbsp;|&nbsp;
                    <strong>Tech Base</strong>: {building.getTech().name} &nbsp;|&nbsp;
                    <strong>Motive Type</strong>: Static &nbsp;|&nbsp;
                    <strong>MP</strong>: NA &nbsp;|&nbsp;
                    <strong>CF</strong>: {building.getCF()} &nbsp;|&nbsp;
                    <strong>Armor Factor</strong>: {building.getArmorPoints()} &nbsp;|&nbsp;
                    <strong>Size</strong>: {building.getHexes()} {building.getHexLabel(building.getHexes() !== 1)}, {building.getLevels()} {building.getLevels() === 1 ? "level" : "levels"}
                </p>
                <p>
                    <strong>Power</strong>: {generator ? `${generator.name} generator, ${building.getGeneratorWeight()} tons` : "Local grid"} &nbsp;|&nbsp;
                    <strong>Heat Sinks</strong>: {building.getHeatSinks()}{building.getHeatSinks() > 0 ? ` ${building.getHeatSinkType().name}` : ""} &nbsp;|&nbsp;
                    <strong>Damage Scaling</strong>: x{classification.damageToBuilding} to the building, x{classification.damageToUnits} to units inside &nbsp;|&nbsp;
                    <strong>Minimum Crew</strong>: {building.getMinimumGunners()} gunners, {building.getMinimumOfficers()} officers &nbsp;|&nbsp;
                    <strong>Cost</strong>: {building.getCBillCost().toLocaleString("en-US")} C-bills
                </p>
                <p>
                    <strong>Entering a hex</strong>: {type.mpCost === null ? "Units cannot enter" : `+${type.mpCost} MP`}
                    {type.pilotingModifier === null ? "" : `, Piloting/Driving Skill Roll +${type.pilotingModifier}`}
                </p>

                <h3>Weapons and Equipment Inventory</h3>
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                        <tr>
                            <th style={cell}>Hex</th><th style={cell}>Item</th><th style={cell}>Heat</th><th style={cell}>Damage</th>
                            <th style={cell}>Min</th><th style={cell}>Short</th><th style={cell}>Medium</th><th style={cell}>Long</th><th style={cell}>Tons</th>
                        </tr>
                    </thead>
                    <tbody>
                        {equipment.map((mount) => (
                            <tr key={mount.item.uuid}>
                                <td style={cell}>{mount.hex}</td>
                                <td style={cell}>{mount.item.name}{mount.turret ? " (T)" : ""}{mount.item.isAmmo && mount.item.roundsPerTon ? ` (${mount.item.roundsPerTon} rounds)` : ""}</td>
                                <td style={cell}>{mount.item.isAmmo ? "" : mount.item.heat}</td>
                                <td style={cell}>{mount.item.isAmmo || typeof mount.item.damage === "object" ? "" : mount.item.damage}</td>
                                <td style={cell}>{mount.item.isAmmo ? "" : mount.item.range?.min ?? ""}</td>
                                <td style={cell}>{mount.item.isAmmo ? "" : mount.item.range?.short ?? ""}</td>
                                <td style={cell}>{mount.item.isAmmo ? "" : mount.item.range?.medium ?? ""}</td>
                                <td style={cell}>{mount.item.isAmmo ? "" : mount.item.range?.long ?? ""}</td>
                                <td style={cell}>{mount.item.weight}</td>
                            </tr>
                        ))}
                        {equipment.length === 0 ? <tr><td style={cell} colSpan={9}>No weapons or equipment.</td></tr> : null}
                    </tbody>
                </table>
                <p className="smaller-text">(T) marks an item in the hex's rooftop turret; anything else has a fixed arc chosen when the building is placed.</p>

                <h3>Armor and Construction Factor</h3>
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                        <tr><th style={cell}>{building.getHexLabel() === "hex" ? "Hex" : "Hexside"}</th><th style={cell}>Armor Factor ({building.getArmorPoints()})</th><th style={cell}>Construction Factor ({building.getCF()})</th></tr>
                    </thead>
                    <tbody>
                        {hexes.map((hex) => (
                            <tr key={hex}>
                                <td style={{ ...cell, textAlign: "center" }}>{hex}</td>
                                <td style={cell}>{building.getArmorPoints() > 0 ? boxes(building.getArmorPoints()) : "None"}</td>
                                <td style={cell}>{boxes(building.getCF())}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
}

interface IBuildingRecordSheetProps {
    building: Building;
}
