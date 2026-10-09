import React, { type JSX } from 'react';
import Building, { findBuildingCapitalWeapon } from '../../classes/building';

// The last `lost` circles are filled in.
const boxes = (count: number, lost: number = 0): JSX.Element[] => Array.from({ length: count }, (_unused, index) => (
    <span key={index} style={{ display: "inline-block", width: "0.75em", height: "0.75em", border: "1px solid #000", borderRadius: "50%", margin: "0 0.12em 0.12em 0", background: index >= count - lost ? "#000" : undefined }} />
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
        const showDamage = !!this.props.showDamage;
        const doors = building.getDoors();
        const modifications = [
            ...(building.getSubsurface() !== "none" ? [`${building.getSubsurface() === "underwater" ? "Underwater" : "Underground"}, depth ${building.getDepth()}`] : []),
            ...(building.isTunnel() ? ["Tunnel"] : []),
            ...(building.isSealed() ? [`Environmental sealing (breach roll ${building.getBreachModifier() >= 0 ? "+" : ""}${building.getBreachModifier()})`] : []),
            ...(building.isOpenSpace() ? ["Open-space construction"] : []),
            ...(building.hasHeavyMetalSuperstructure() ? ["Heavy metal superstructure"] : []),
            ...(building.getCeilings() !== "standard" ? [`${building.getCeilings() === "high" ? "High" : "Low"} ceilings`] : []),
            ...(doors.length > 0 ? [`${doors.length} large ${doors.length === 1 ? "door" : "doors"} (${doors.map((height) => `${height} ${height === 1 ? "level" : "levels"}`).join(", ")})`] : []),
            ...building.getElevators().map((elevator) => `Industrial elevator in hex ${elevator.hex}: ${elevator.capacity} tons, ${elevator.levels} ${elevator.levels === 1 ? "level" : "levels"}`),
            ...(building.getLiquidStorage() > 0 ? [`Liquid storage for ${building.getLiquidCapacity()} tons`] : []),
            ...(building.getMinimumNonGunners() > 0 ? [`${building.getMinimumNonGunners()} other crew`] : []),
        ];
        const armorLost = (hex: number): number => showDamage ? building.getArmorPoints() - building.getHexArmor(hex) : 0;
        const cfLost = (hex: number): number => showDamage ? building.getCF() - building.getHexCF(hex) : 0;
        // What play has done to a hex beyond its circles.
        const condition = (hex: number): string => {
            const state = building.getHexState(hex);
            return [
                ...(building.isHexDestroyed(hex) ? [building.isGunEmplacement() ? "Destroyed" : "Collapsed"] : []),
                ...(state.gunnersKilled ? ["Gunners killed"] : []),
                ...(state.gunnersStunned > 0 ? [`Gunners stunned (${state.gunnersStunned})`] : []),
                ...(state.turretLocked ? ["Turret locked"] : state.turretJammed ? ["Turret jammed"] : []),
                ...(state.ammoExploded ? ["Ammunition lost"] : []),
            ].join(", ");
        };

        return (
            <div className="print-page">
                <h2>{building.getDisplayName()}</h2>
                <p data-testid="building-sheet-data">
                    <strong>Structure Type</strong>: {classification.name}{type.tag === "none" ? "" : `, ${type.name}`} &nbsp;|&nbsp;
                    <strong>Tech Base</strong>: {building.getTech().name} &nbsp;|&nbsp;
                    <strong>Motive Type</strong>: Static &nbsp;|&nbsp;
                    <strong>MP</strong>: NA &nbsp;|&nbsp;
                    <strong>CF</strong>: {building.getCF()}{building.isCapitalScale() ? " (capital scale)" : ""} &nbsp;|&nbsp;
                    <strong>Armor Factor</strong>: {building.getArmorPoints()} &nbsp;|&nbsp;
                    <strong>Size</strong>: {building.getHexes()} {building.getHexLabel(building.getHexes() !== 1)}, {building.getLevels()} {building.getLevels() === 1 ? "level" : "levels"}
                </p>
                <p>
                    <strong>Power</strong>: {generator ? `${generator.name} generator, ${building.getGeneratorWeight()} tons` : "Local grid"} &nbsp;|&nbsp;
                    <strong>Heat Sinks</strong>: {building.getHeatSinks()}{building.getHeatSinks() > 0 ? ` ${building.getHeatSinkType().name}` : ""} &nbsp;|&nbsp;
                    <strong>Damage Scaling</strong>: {building.getDamageScalingText()} &nbsp;|&nbsp;
                    <strong>Minimum Crew</strong>: {building.getMinimumGunners()} gunners, {building.getMinimumOfficers()} officers &nbsp;|&nbsp;
                    {showDamage && building.getMinimumGunners() > 0 ? <><strong>Gunnery</strong>: {building.getGunnery()} &nbsp;|&nbsp;</> : null}
                    <strong>Cost</strong>: {building.getCBillCost().toLocaleString("en-US")} C-bills
                </p>
                <p>
                    <strong>Entering a hex</strong>: {type.mpCost === null ? "Units cannot enter" : `+${type.mpCost} MP`}
                    {type.pilotingModifier === null ? "" : `, Piloting/Driving Skill Roll +${type.pilotingModifier}`}
                    {type.mpCost === null ? "" : " (before the hex's equipment and the modifications below, TO:AR p.117)"}
                </p>
                {modifications.length > 0 ? <p data-testid="building-sheet-modifications"><strong>Modifications and Fittings</strong>: {modifications.join("; ")}</p> : null}
                {showDamage && building.isBreached() ? <p><strong>BREACHED: unprotected personnel and equipment inside are lost.</strong></p> : null}

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
                                <td style={cell}>
                                    {mount.item.name}{mount.turret ? " (T)" : ""}{mount.automated ? " (A)" : ""}{mount.item.isAmmo && mount.item.roundsPerTon ? ` (${mount.item.roundsPerTon} rounds)` : ""}
                                    {showDamage && mount.item.isAmmo && building.getAmmoCapacity(mount.item.uuid || "") > 0 ? `, ${building.getAmmoShots(mount.item.uuid || "")} of ${building.getAmmoCapacity(mount.item.uuid || "")} shots left` : ""}
                                    {showDamage && !mount.item.isAmmo && building.getMountStatus(mount.item.uuid || "") ? <strong> - {building.getMountStatus(mount.item.uuid || "")}</strong> : null}
                                </td>
                                <td style={cell}>{mount.item.isAmmo ? "" : mount.item.heat}</td>
                                <td style={cell}>{mount.item.isAmmo || typeof mount.item.damage === "object" ? "" : mount.item.damage}</td>
                                <td style={cell}>{mount.item.isAmmo ? "" : mount.item.range?.min ?? ""}</td>
                                <td style={cell}>{mount.item.isAmmo ? "" : mount.item.range?.short ?? ""}</td>
                                <td style={cell}>{mount.item.isAmmo ? "" : mount.item.range?.medium ?? ""}</td>
                                <td style={cell}>{mount.item.isAmmo ? "" : mount.item.range?.long ?? ""}</td>
                                <td style={cell}>{mount.item.weight}</td>
                            </tr>
                        ))}
                        {building.getLightWeapons().map((mount) => {
                            const ranges = Building.getLightWeaponRanges(mount.weapon);
                            const shots = Building.getLightMountShots(mount);
                            const status = showDamage ? building.getLightWeaponStatus(mount.uuid) : "";
                            return (
                                <tr key={mount.uuid} data-testid="building-sheet-light-weapon">
                                    <td style={cell}>{mount.hex}</td>
                                    <td style={cell}>
                                        {mount.weapon.name}{mount.mount === "turret" ? " (T)" : mount.mount === "pintle" ? " (P)" : ""}
                                        {shots !== null ? (showDamage ? `, ${building.getLightWeaponShots(mount.uuid)} of ${shots} shots left` : ` (${shots} shots)`) : ""}
                                        {status ? <strong> - {status}</strong> : null}
                                    </td>
                                    <td style={cell}></td>
                                    <td style={cell}>{Building.getLightWeaponDamage(mount.weapon)}{mount.weapon.special ? ` (${mount.weapon.special})` : ""}</td>
                                    <td style={cell}></td>
                                    <td style={cell}>{ranges.short}</td>
                                    <td style={cell}>{ranges.medium}</td>
                                    <td style={cell}>{ranges.long}</td>
                                    <td style={cell}>{Building.getLightMountWeight(mount)}</td>
                                </tr>
                            );
                        })}
                        {building.getCapitalWeapons().map((mount) => (
                            <tr key={mount.uuid} data-testid="building-sheet-capital-weapon">
                                <td style={cell}>{mount.hex}{mount.sharedHexes.length > 0 ? ` (+${mount.sharedHexes.join(", ")})` : ""}</td>
                                <td style={cell}>
                                    {mount.weapon.name}
                                    {Object.keys(mount.shots).filter((tag) => mount.shots[tag] > 0).map((tag) => (
                                        ` (${mount.shots[tag]} ${Object.keys(mount.shots).length > 1 ? `${findBuildingCapitalWeapon(tag)?.name} ` : ""}${mount.shots[tag] === 1 ? "shot" : "shots"})`
                                    )).join("")}
                                    {mount.ammoHex !== null ? `, ammunition in the hex ${mount.ammoHex} bunker` : ""}
                                </td>
                                <td style={cell}>{mount.weapon.heat ?? "*"}</td>
                                <td style={cell}>{mount.weapon.damage !== null ? `${mount.weapon.damage}-C` : mount.weapon.tag === "ar-10-launcher" ? "*" : ""}</td>
                                <td style={{ ...cell, textTransform: "capitalize" }} colSpan={4}>{mount.weapon.range ? `${mount.weapon.range}-C, upward only` : "As the missile fired, upward only"}</td>
                                <td style={cell}>{Building.getCapitalMountWeight(mount)}</td>
                            </tr>
                        ))}
                        {equipment.length === 0 && building.getLightWeapons().length === 0 && building.getCapitalWeapons().length === 0 ? <tr><td style={cell} colSpan={9}>No weapons or equipment.</td></tr> : null}
                    </tbody>
                </table>
                <p className="smaller-text">(T) marks an item in the hex's rooftop turret; anything else has a fixed arc chosen when the building is placed. (A) marks an automated weapon, Gunnery 5.{building.getCapitalWeapons().length > 0 ? " -C marks capital-scale damage and range brackets: those weapons fire upward only and have no arc on a ground map (TO:AUE p. 83)." : ""}{building.getLightWeapons().length > 0 ? " (P) marks a Light or Medium weapon on a pintle. After a Light or Medium weapon's damage: A anti-aircraft, B heavy burst, F flame-based, N non-penetrating." : ""}</p>

                <h3>Armor and Construction Factor</h3>
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                        <tr><th style={cell}>{building.getHexLabel() === "hex" ? "Hex" : "Hexside"}</th><th style={cell}>Armor Factor ({building.getArmorPoints()})</th><th style={cell}>Construction Factor ({building.getCF()})</th></tr>
                    </thead>
                    <tbody>
                        {hexes.map((hex) => (
                            <tr key={hex} data-testid="building-sheet-hex">
                                <td style={{ ...cell, textAlign: "center" }}>{hex}</td>
                                <td style={cell}>
                                    {building.getArmorPoints() > 0 ? boxes(building.getArmorPoints(), armorLost(hex)) : "None"}
                                    {armorLost(hex) > 0 ? <div>{building.getHexArmor(hex)} left</div> : null}
                                </td>
                                <td style={cell}>
                                    {boxes(building.getCF(), cfLost(hex))}
                                    {cfLost(hex) > 0 ? <div>{building.getHexCF(hex)} left</div> : null}
                                    {showDamage && condition(hex) ? <div><strong>{condition(hex)}</strong></div> : null}
                                </td>
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
    /** Fill in the armor and Construction Factor lost in play, and list critical hits. */
    showDamage?: boolean;
}
