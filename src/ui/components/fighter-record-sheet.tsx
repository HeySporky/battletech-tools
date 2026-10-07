import React, { type JSX } from 'react';
import AerospaceFighter, { FIGHTER_CRITICAL_TRACKS, FIGHTER_LOCATIONS, formatFighterASDamage } from '../../classes/aerospace-fighter';
import FighterDiagramSVG from './svg/fighter-diagram-svg';

// A fighter record sheet: summary line, armor diagram with damage thresholds, weapons by arc, external stores,
// the critical damage tracks and the converted Alpha Strike stats. With showDamage, damage marked in play is
// filled in.
export default class FighterRecordSheet extends React.Component<IFighterRecordSheetProps> {
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
        const fighter = this.props.fighter;
        const as = fighter.getAlphaStrikeStats();
        const stores = fighter.getExternalStores();
        const play = this.props.showDamage ? fighter.getInPlay() : null;
        const pilot = fighter.getPilot();

        return (
            <div className="print-page">
                <h2>{`${fighter.getModel()} ${fighter.getName()}`.trim() || fighter.getFighterTypeName()}</h2>
                <p>
                    <strong>{fighter.isOmni() ? "Omni " : ""}{fighter.getFighterTypeName()}</strong> - {fighter.getTonnage()} tons &nbsp;|&nbsp;
                    {fighter.getTech().name} &nbsp;|&nbsp;
                    Thrust {fighter.getSafeThrust()} safe / {fighter.getMaxThrust()} max &nbsp;|&nbsp;
                    Structural Integrity {fighter.getStructuralIntegrity()} &nbsp;|&nbsp;
                    Fuel {fighter.getFuelPoints()} points &nbsp;|&nbsp;
                    Heat Sinks {fighter.getTotalHeatSinks()} ({fighter.getHeatSinkType().name}, {fighter.getHeatDissipation()} dissipated) &nbsp;|&nbsp;
                    {fighter.getEngineType().name} {fighter.getEngineRating()} &nbsp;|&nbsp;
                    Armor: {fighter.getArmorType().name}{fighter.hasVSTOL() ? <> &nbsp;|&nbsp; VSTOL</> : null} &nbsp;|&nbsp;
                    BV {fighter.getBattleValue()} &nbsp;|&nbsp; {fighter.getCBillCost().toLocaleString("en-US")} C-Bills
                    {this.props.showPilot ? <> &nbsp;|&nbsp; Gunnery {pilot.gunnery} / Piloting {pilot.piloting}{pilot.name ? ` (${pilot.name})` : ""} &nbsp;|&nbsp; Adjusted BV {fighter.getPilotAdjustedBattleValue()}</> : null}
                </p>

                <FighterDiagramSVG
                    armor={fighter.getArmorAllocation()}
                    structuralIntegrity={fighter.getStructuralIntegrity()}
                    thresholds={fighter.getDamageThresholds()}
                    armorDamage={play?.armorDamage}
                    structureDamage={play?.structureDamage}
                    width={600}
                />

                <table className="table">
                    <thead>
                        <tr><th>Location</th><th>Weapons and Equipment</th><th className="text-right">Heat</th></tr>
                    </thead>
                    <tbody>
                        {FIGHTER_LOCATIONS.map((location) => {
                            const items = fighter.getEquipmentList().filter((item) => item.location === location.tag);
                            return (
                                <tr key={location.tag}>
                                    <td>{location.name}</td>
                                    <td>{items.map((item) => item.name + (fighter.isPodMounted(item.uuid ?? "") ? " (pod)" : "") + (play && fighter.isWeaponDestroyed(item.uuid ?? "") ? " (destroyed)" : "")).join(", ") || "-"}</td>
                                    <td className="text-right">{items.filter((item) => !item.isAmmo).reduce((sum, item) => sum + (item.heatAero ?? item.heat ?? 0), 0) || "-"}</td>
                                </tr>
                            );
                        })}
                        <tr>
                            <td>External Stores</td>
                            <td colSpan={2}>
                                {stores.length ? stores.map((store) => `${store.count} x ${store.name}`).join(", ") : "-"}
                                {" "}({fighter.getExternalStoresHardpointsUsed()} of {fighter.getExternalStoresHardpoints()} hardpoints
                                {stores.length ? `; thrust ${fighter.getLoadedSafeThrust()}/${fighter.getLoadedMaxThrust()} while loaded` : ""})
                            </td>
                        </tr>
                    </tbody>
                </table>

                <h3>Critical Damage</h3>
                <p>
                    {FIGHTER_CRITICAL_TRACKS.map((track) => (
                        <React.Fragment key={track.tag}>{this.renderBoxes(track.name, track.boxes, play?.[track.tag] ?? 0)}</React.Fragment>
                    ))}
                    {this.renderBoxes("Gear", 1, play?.gear ? 1 : 0)}
                    {play && play.heatSinks > 0 ? <span><strong>Heat sinks lost</strong>: {play.heatSinks}</span> : null}
                </p>

                <h3>Alpha Strike</h3>
                <table className="table">
                    <tbody>
                        <tr><td>Type / Size</td><td>{as.type} / {as.size}</td></tr>
                        <tr><td>Thrust</td><td>{as.movement}a</td></tr>
                        <tr><td>Damage (S/M/L)</td><td>{formatFighterASDamage(as.damageValues.short)}/{formatFighterASDamage(as.damageValues.medium)}/{formatFighterASDamage(as.damageValues.long)}</td></tr>
                        <tr><td>Overheat (OV)</td><td>{as.overheat}</td></tr>
                        <tr><td>Armor / Structure / Threshold</td><td>{as.armor} / {as.structure} / {as.threshold}</td></tr>
                        <tr><td>Special Abilities</td><td>{as.specialAbilities.join(", ")}</td></tr>
                        <tr><td>Point Value</td><td>{as.pointValue}</td></tr>
                    </tbody>
                </table>
            </div>
        );
    }
}

interface IFighterRecordSheetProps {
    fighter: AerospaceFighter;
    showPilot?: boolean;
    showDamage?: boolean;
}
