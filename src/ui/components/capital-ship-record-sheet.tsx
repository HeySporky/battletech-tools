import React, { type JSX } from 'react';
import CapitalShip from '../../classes/capital-ship';
import { ADVANCED_AEROSPACE_FACINGS } from '../../data/advanced-aerospace-construction';
import { ADVANCED_AEROSPACE_CREW_HITS, ADVANCED_AEROSPACE_CRITICAL_BLOCK } from '../../data/aerospace-record-sheet';
import { AerospaceCriticalBlock, AerospaceInventoryTable, AerospacePilotBlock, AerospaceVelocityRecord, IAerospaceInventoryRow } from './aerospace-sheet-blocks';

// A JumpShip, WarShip or space station record sheet (SO:AA pp.9-11, filled in as Step 6 on p.146 says): the unit
// data block, the Weapons and Equipment Inventory by weapon bay with capital-scale Attack Values (standard scale in
// parentheses), the armor diagram in capital-scale squares with each facing's Damage Threshold, Structural Integrity,
// K-F drive and sail integrity, docking collars, crew data, critical damage, heat data and (not for stations) the
// Velocity Record.
export default class CapitalShipRecordSheet extends React.Component<ICapitalShipRecordSheetProps> {
    renderSquares = (count: number, testId?: string): JSX.Element => (
        <div data-testid={testId} data-count={count} style={{ display: "flex", flexWrap: "wrap", gap: "1px", marginBottom: "0.4em" }}>
            {Array.from({ length: count }, (_, index) => (
                <span key={index} style={{ display: "inline-block", width: "0.55em", height: "0.55em", border: "1px solid #000" }} />
            ))}
        </div>
    );

    render = (): JSX.Element => {
        const ship = this.props.ship;
        const typeName = ship.getShipTypeName();
        const thresholds = ship.getDamageThresholds();
        const arcs = ship.getArcs();
        const rows: IAerospaceInventoryRow[] = arcs.flatMap((arc) => ship.getArcWeaponBays(arc).map((bay) => {
            const counts = new Map<string, number>();
            for (const name of bay.weaponNames) counts.set(name, (counts.get(name) ?? 0) + 1);
            return {
                quantity: bay.weapons,
                name: `${bay.name} bay: ${[...counts].map(([name, count]) => `${count} ${name}`).join(", ")}`,
                location: ship.getArcName(arc),
                heat: bay.heat,
                values: bay.values,
                capital: bay.capital,
            };
        }));
        const ammo = [
            ...ship.getCapitalWeapons().filter((mount) => ship.getCapitalShots(mount) > 0).map((mount) => `${mount.weapon.name} (${ship.getArcName(mount.location as never)}) ${ship.getCapitalShots(mount)} shots`),
            ...ship.getEquipmentList().filter((item) => item.isAmmo).map((item) => item.name),
        ];
        const other = ship.getEquipmentList().filter((item) => !item.isAmmo && !ship.isWeapon(item))
            .map((item) => item.name + (item.location ? ` (${arcs.includes(item.location as never) ? ship.getArcName(item.location as never) : item.location})` : ""));
        const fighterBays = ship.getBays().filter((bay) => /fighter|small-craft/i.test(bay.tag));
        const heatByArc = arcs.map((arc) => ({ arc, heat: ship.getArcWeaponBays(arc).reduce((sum, bay) => sum + bay.heat, 0) }));

        return (
            <div className="print-page">
                <h2>{`${ship.getName()} ${ship.getModel()}`.trim() || typeName}</h2>
                <h3>{typeName} Data</h3>
                <p data-testid="cs-sheet-data">
                    <strong>{typeName}</strong> - {ship.getTonnage().toLocaleString("en-US")} tons &nbsp;|&nbsp;
                    {ship.getTech().name} &nbsp;|&nbsp;
                    {ship.isWarShip() ? <>Safe Thrust {ship.getSafeThrust()} / Maximum Thrust {ship.getMaxThrust()}</> : "Thrust: Station-Keeping Only"} &nbsp;|&nbsp;
                    DropShip Capacity {ship.getDockingCollars()} &nbsp;|&nbsp;
                    Fighters/Small Craft {fighterBays.reduce((sum, bay) => sum + bay.amount, 0)} / {fighterBays.reduce((sum, bay) => sum + bay.doors, 0)} doors &nbsp;|&nbsp;
                    BV {ship.getBattleValue().toLocaleString("en-US")} &nbsp;|&nbsp; {ship.getCBillCost().toLocaleString("en-US")} C-Bills
                </p>

                <h3>Weapons and Equipment Inventory</h3>
                <AerospaceInventoryTable rows={rows} capitalScale testId="cs-sheet-inventory" />
                {ammo.length ? <p><strong>Ammo</strong>: {ammo.join(", ")}</p> : null}
                {other.length ? <p><strong>Other equipment</strong>: {other.join(", ")}</p> : null}

                <h3>Armor Diagram (capital scale)</h3>
                {ADVANCED_AEROSPACE_FACINGS.map((facing) => (
                    <div key={facing}>
                        <strong>{ship.getFacingName(facing)}</strong>: Damage Threshold {thresholds[facing]} (Total Armor {ship.getFacingArmor(facing)})
                        {this.renderSquares(ship.getFacingArmor(facing), `cs-sheet-armor-${facing}`)}
                    </div>
                ))}
                <div>
                    <strong>Structural Integrity</strong>: {ship.getStructuralIntegrity()}
                    {this.renderSquares(ship.getStructuralIntegrity(), "cs-sheet-si")}
                </div>
                <p data-testid="cs-sheet-drive">
                    {ship.hasKFDrive() ? <><strong>K-F Drive Integrity</strong>: {ship.getKFDriveIntegrity()} &nbsp;|&nbsp; </> : null}
                    {ship.getJumpSailIntegrity() > 0 ? <><strong>Sail Integrity</strong>: {ship.getJumpSailIntegrity()} &nbsp;|&nbsp; </> : null}
                    <strong>Docking Collars</strong>: {ship.getDockingCollars()}
                    {ship.isMonitor() ? <> &nbsp;|&nbsp; Monitor (Custom): carried on {ship.getCarrierCollarsNeeded()} docking collars</> : null}
                </p>

                <AerospacePilotBlock title="Crew Data" crewModifiers={ADVANCED_AEROSPACE_CREW_HITS} />
                <p>
                    <strong>Crew</strong>: {ship.getCrew()} ({ship.getOfficers()} officers) &nbsp;|&nbsp;
                    <strong>Marines</strong>: {ship.getMarines()} &nbsp;|&nbsp;
                    <strong>Passengers</strong>: {ship.getPassengers()} &nbsp;|&nbsp;
                    <strong>Life Boats / Escape Pods</strong>: {ship.getLifeBoats()} / {ship.getEscapePods()}
                </p>
                {ship.getBays().length > 0 ? <p><strong>Bays</strong>: {ship.getBays().map((bay) => `${ship.getBayName(bay)} ${bay.amount} (${bay.doors} door${bay.doors === 1 ? "" : "s"})`).join(", ")}</p> : null}

                <h3>Critical Damage</h3>
                <AerospaceCriticalBlock tracks={ADVANCED_AEROSPACE_CRITICAL_BLOCK} testId="cs-sheet-criticals" />

                <h3>Heat Data</h3>
                <p data-testid="cs-sheet-heat">
                    <strong>Heat Sinks</strong>: {ship.getTotalHeatSinks().toLocaleString("en-US")} {ship.getHeatSinkType().name} ({ship.getHeatDissipation().toLocaleString("en-US")})
                    <br />
                    <strong>Heat Generation Per Arc</strong>: {heatByArc.map((entry) => `${ship.getArcName(entry.arc)} ${entry.heat}`).join(", ")}
                </p>
                <p className="small-text">
                    These units run on a zero-net-heat principle and have no Heat Scale; an arc may not fire if that would pass the
                    heat sink capacity (SO:AA p.11).
                </p>

                {ship.isSpaceStation() ? null : <AerospaceVelocityRecord />}
            </div>
        );
    }
}

interface ICapitalShipRecordSheetProps {
    ship: CapitalShip;
}
