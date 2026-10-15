import React, { type JSX } from 'react';
import AerospaceFighter, { FIGHTER_LOCATIONS, formatFighterASDamage } from '../../classes/aerospace-fighter';
import { AEROSPACE_FIGHTER_CRITICAL_BLOCK } from '../../data/aerospace-record-sheet';
import { AerospaceCriticalBlock, AerospaceHeatBlock, AerospaceInventoryTable, AerospacePilotBlock, AerospaceVelocityRecord, aerospaceInventoryRows } from './aerospace-sheet-blocks';
import FighterDiagramSVG from './svg/fighter-diagram-svg';
import { SUPPORT_VEHICLE_CHASSIS_MODIFICATIONS, SUPPORT_VEHICLE_FIRE_CONTROL } from '../../data/support-vehicle-construction';

// A fighter record sheet after TechManual's Aerospace and Conventional Fighter Record Sheets (TM pp.336-337): fighter
// data, the Weapons and Equipment Inventory with Attack Values by range bracket, external stores, pilot data,
// critical damage, the Heat Scale (aerospace fighters; conventional fighters have none), the Velocity Record and the
// armor diagram with damage thresholds, then the converted Alpha Strike stats. With showDamage, damage marked in
// play is filled in.
export default class FighterRecordSheet extends React.Component<IFighterRecordSheetProps> {
    render = (): JSX.Element => {
        const fighter = this.props.fighter;
        const as = fighter.getAlphaStrikeStats();
        const stores = fighter.getExternalStores();
        const play = this.props.showDamage ? fighter.getInPlay() : null;
        const pilot = fighter.getPilot();
        const ammo = fighter.getEquipmentList().filter((item) => item.isAmmo).map((item) => item.name);
        const criticalHits = (track: string): number => {
            if (!play) return 0;
            switch (track) {
                case "Avionics": return play.avionics;
                case "Engine": return play.engine;
                case "FCS": return play.fcs;
                case "Sensors": return play.sensors;
                case "Gear": return play.gear ? 1 : 0;
                default: return 0;
            }
        };

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
                    {fighter.isSupportVehicle() ? fighter.getSupportEngine()?.name : fighter.getEngineType().name} {fighter.getEngineRating()} &nbsp;|&nbsp;
                    Armor: {fighter.isSupportVehicle() ? `BAR ${fighter.getBAR()} (Tech ${fighter.getSupportVehicleSettings()?.armorTechRating.toUpperCase()})` : fighter.getArmorDescription()}{fighter.hasVSTOL() ? <> &nbsp;|&nbsp; VSTOL</> : null} &nbsp;|&nbsp;
                    BV {fighter.getBattleValue()} &nbsp;|&nbsp; {fighter.getCBillCost().toLocaleString("en-US")} C-Bills
                    {this.props.showPilot ? <> &nbsp;|&nbsp; Gunnery {pilot.gunnery} / Piloting {pilot.piloting}{pilot.name ? ` (${pilot.name})` : ""} &nbsp;|&nbsp; Adjusted BV {fighter.getPilotAdjustedBattleValue()}</> : null}
                </p>

                {fighter.isSupportVehicle() ? (
                    <p className="smaller-text" data-testid="support-aircraft-sheet">
                        Support Vehicle: Tech Rating {fighter.getSupportOverallTechRating()?.toUpperCase()} &nbsp;|&nbsp; Crew {fighter.getCrew()} &nbsp;|&nbsp;
                        {SUPPORT_VEHICLE_FIRE_CONTROL[fighter.getSupportFireControl()].name}{fighter.getFireControlToHitModifier() > 0 ? ` (+${fighter.getFireControlToHitModifier()} to-hit)` : ""}
                        {fighter.getSupportChassisModifications().length > 0 ? <> &nbsp;|&nbsp; {fighter.getSupportChassisModifications().map((tag) => SUPPORT_VEHICLE_CHASSIS_MODIFICATIONS.find((mod) => mod.tag === tag)?.name).join(", ")}</> : null}
                        {fighter.getBays().length > 0 ? <> &nbsp;|&nbsp; Bays: {fighter.getBays().map((bay) => `${fighter.getBayName(bay)} ${bay.amount}`).join(", ")}</> : null}
                    </p>
                ) : null}

                <FighterDiagramSVG
                    armor={fighter.getArmorAllocation()}
                    structuralIntegrity={fighter.getStructuralIntegrity()}
                    thresholds={fighter.getDamageThresholds()}
                    armorDamage={play?.armorDamage}
                    structureDamage={play?.structureDamage}
                    width={600}
                />

                <h3>Weapons and Equipment Inventory</h3>
                <AerospaceInventoryTable
                    testId="fighter-sheet-inventory"
                    rows={aerospaceInventoryRows(
                        fighter.getEquipmentList(),
                        (tag) => FIGHTER_LOCATIONS.find((location) => location.tag === tag)?.name ?? tag,
                        (item) => (fighter.isPodMounted(item.uuid ?? "") ? " (pod)" : "") + (play && fighter.isWeaponDestroyed(item.uuid ?? "") ? " (destroyed)" : ""),
                    )}
                />
                {ammo.length ? <p><strong>Ammo</strong>: {ammo.join(", ")}</p> : null}
                <p>
                    <strong>External Stores</strong>: {stores.length ? stores.map((store) => `${store.count} x ${store.name}`).join(", ") : "-"}
                    {" "}({fighter.getExternalStoresHardpointsUsed()} of {fighter.getExternalStoresHardpoints()} hardpoints
                    {stores.length ? `; thrust ${fighter.getLoadedSafeThrust()}/${fighter.getLoadedMaxThrust()} while loaded` : ""})
                </p>

                <AerospacePilotBlock name={this.props.showPilot ? pilot.name : undefined} gunnery={this.props.showPilot ? pilot.gunnery : undefined}
                    piloting={this.props.showPilot ? pilot.piloting : undefined} hits={play?.pilotHits ?? 0} />

                <h3>Critical Damage</h3>
                <AerospaceCriticalBlock testId="fighter-sheet-criticals" tracks={AEROSPACE_FIGHTER_CRITICAL_BLOCK.map((track) => ({ ...track, filled: criticalHits(track.name) }))} />
                {play && play.heatSinks > 0 ? <p><strong>Heat sinks lost</strong>: {play.heatSinks}</p> : null}

                {fighter.isConventional() ? null : (
                    <AerospaceHeatBlock heatSinks={fighter.getTotalHeatSinks()} heatSinkType={fighter.getHeatSinkType().name} dissipation={fighter.getHeatDissipation()} heat={play?.heat} />
                )}
                <AerospaceVelocityRecord altitude />

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
