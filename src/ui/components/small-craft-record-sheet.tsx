import React, { type JSX } from 'react';
import SmallCraft, { SMALL_CRAFT_CRITICAL_TRACKS } from '../../classes/small-craft';
import { SMALL_CRAFT_ARCS, findTransportBayType, quartersTypes } from '../../data/small-craft-construction';
import FighterDiagramSVG from './svg/fighter-diagram-svg';
import SmallCraftAlphaStrikeCard from './small-craft-as-card';

// A Small Craft record sheet (TechManual pp.337-338): craft data, the armor diagram with Damage Thresholds,
// weapons by firing arc, crew, quarters and bays, the critical damage tracks and the Alpha Strike card. With
// showDamage, damage marked in play is filled in.
export default class SmallCraftRecordSheet extends React.Component<ISmallCraftRecordSheetProps> {
    renderBoxes = (label: string, count: number, filled: number = 0): JSX.Element => (
        <span style={{ display: "inline-block", marginRight: "1.5em", whiteSpace: "nowrap" }}>
            <strong>{label}</strong>&nbsp;
            {Array.from({ length: count }, (_, index) => (
                <span key={index} style={{
                    display: "inline-block", width: "0.9em", height: "0.9em", border: "1px solid #000", marginRight: "0.2em", verticalAlign: "middle",
                    background: index < filled ? "#000" : "transparent",
                }} />
            ))}
        </span>
    );

    render = (): JSX.Element => {
        const craft = this.props.craft;
        const play = this.props.showDamage ? craft.getInPlay() : null;
        const pilot = craft.getPilot();
        const armor = craft.getArmorAllocation();
        const thresholds = craft.getDamageThresholds();
        const quarters = quartersTypes.filter((type) => craft.getQuarters()[type.tag] > 0).map((type) => `${craft.getQuarters()[type.tag]} ${type.name}`);
        const locations: { tag: string; name: string }[] = [...SMALL_CRAFT_ARCS.map((arc) => ({ tag: arc as string, name: craft.getArcName(arc) })), { tag: "hull", name: "Hull" }];

        return (
            <div className="print-page">
                <h2>{`${craft.getName()} ${craft.getModel()}`.trim() || "Small Craft"}</h2>
                <p data-testid="small-craft-sheet-data">
                    <strong>{craft.getShapeName()} Small Craft</strong> - {craft.getTonnage()} tons &nbsp;|&nbsp;
                    {craft.getTech().name} &nbsp;|&nbsp;
                    Thrust {craft.getSafeThrust()} safe / {craft.getMaxThrust()} max &nbsp;|&nbsp;
                    Structural Integrity {craft.getStructuralIntegrity()} &nbsp;|&nbsp;
                    Fuel {craft.getFuelPoints()} points ({craft.getFuelTons()} tons, {craft.getBurnDays()} days at 1 G) &nbsp;|&nbsp;
                    Heat Sinks {craft.getTotalHeatSinks()} ({craft.getHeatSinkType().name}, {craft.getHeatDissipation()} dissipated) &nbsp;|&nbsp;
                    Armor: {craft.getArmorType().name} &nbsp;|&nbsp;
                    BV {craft.getBattleValue()} &nbsp;|&nbsp; {craft.getCBillCost().toLocaleString("en-US")} C-Bills
                    {this.props.showPilot ? <> &nbsp;|&nbsp; Gunnery {pilot.gunnery} / Piloting {pilot.piloting}{pilot.name ? ` (${pilot.name})` : ""} &nbsp;|&nbsp; Adjusted BV {craft.getPilotAdjustedBattleValue()}</> : null}
                </p>

                <FighterDiagramSVG
                    armor={{ nose: armor.nose, leftWing: armor.left, rightWing: armor.right, aft: armor.aft }}
                    structuralIntegrity={craft.getStructuralIntegrity()}
                    thresholds={{ nose: thresholds.nose, leftWing: thresholds.left, rightWing: thresholds.right, aft: thresholds.aft }}
                    armorDamage={play ? { nose: play.armorDamage.nose, leftWing: play.armorDamage.left, rightWing: play.armorDamage.right, aft: play.armorDamage.aft } : undefined}
                    structureDamage={play?.structureDamage}
                    sideLabels={{ left: craft.getFacingName("left"), right: craft.getFacingName("right") }}
                    width={600}
                />

                <table className="table" data-testid="small-craft-sheet-weapons">
                    <thead>
                        <tr><th>Firing Arc</th><th>Weapons and Equipment</th><th className="text-right">Heat</th></tr>
                    </thead>
                    <tbody>
                        {locations.map((location) => {
                            const items = craft.getEquipmentList().filter((item) => item.location === location.tag);
                            if (items.length === 0 && location.tag !== "nose") return null;
                            return (
                                <tr key={location.tag}>
                                    <td>{location.name}</td>
                                    <td>{items.map((item) => item.name + (play && craft.isWeaponDestroyed(item.uuid ?? "") ? " (destroyed)" : "")).join(", ") || "-"}</td>
                                    <td className="text-right">{items.filter((item) => !item.isAmmo).reduce((sum, item) => sum + (item.heatAero ?? item.heat ?? 0), 0) || "-"}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <h3>Crew and Cargo</h3>
                <p data-testid="small-craft-sheet-crew">
                    <strong>Crew</strong>: {craft.getCrew()} ({craft.getOfficers()} officer{craft.getOfficers() === 1 ? "" : "s"}, {craft.getMinimumGunners()} gunner{craft.getMinimumGunners() === 1 ? "" : "s"}) &nbsp;|&nbsp;
                    <strong>Passengers</strong>: {craft.getPassengers()} &nbsp;|&nbsp;
                    <strong>Quarters</strong>: {quarters.join(", ") || "none"} &nbsp;|&nbsp;
                    <strong>Escape Pods / Lifeboats</strong>: {craft.getEscapePods()} / {craft.getLifeBoats()}
                </p>
                {craft.getBays().length > 0 ? (
                    <ul>
                        {craft.getBays().map((bay, index) => {
                            const type = findTransportBayType(bay.tag);
                            return (
                                <li key={index}>
                                    {craft.getBayName(bay)}: {type?.tonsEach === null ? `${bay.amount} tons` : `${bay.amount} (${craft.getBayWeight(bay)} tons)`}, {bay.doors} door{bay.doors === 1 ? "" : "s"}
                                </li>
                            );
                        })}
                    </ul>
                ) : <p>No transport bays.</p>}

                <h3>Critical Damage</h3>
                <p>
                    {SMALL_CRAFT_CRITICAL_TRACKS.map((track) => (
                        <React.Fragment key={track.tag}>{this.renderBoxes(track.name, track.boxes, play?.[track.tag] ?? 0)}</React.Fragment>
                    ))}
                    {this.renderBoxes("Gear", 1, play?.gear ? 1 : 0)}
                    {this.renderBoxes("Life Support", 1, play?.lifeSupport ? 1 : 0)}
                    {play && play.doorsDamaged > 0 ? <span><strong>Doors damaged</strong>: {play.doorsDamaged} &nbsp;</span> : null}
                    {play && play.cargoLostPercent > 0 ? <span><strong>Cargo lost</strong>: {play.cargoLostPercent}%</span> : null}
                </p>
                <p className="small-text">
                    Each engine hit takes 1 off Safe Thrust; each FCS hit adds 2 to hit, each sensor and crew hit 1; avionics hits add
                    to Control Rolls; a thruster hit raises the cost of turning away from that side (TW pp. 239-240). Heat is tracked
                    as on a fighter (TW p. 161).
                </p>

                <h3>Alpha Strike</h3>
                <SmallCraftAlphaStrikeCard craft={craft} />
            </div>
        );
    }
}

interface ISmallCraftRecordSheetProps {
    craft: SmallCraft;
    showPilot?: boolean;
    showDamage?: boolean;
}
