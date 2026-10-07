import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight } from "react-icons/fa";
import Building from '../../../../classes/building';
import { BUILDING_CLASSIFICATIONS } from '../../../../data/building-classifications';
import { getRulesLevelOptions } from '../../../../data/rules-level-options';
import { btTechOptions } from '../../../../data/tech-options';
import { IAppGlobals } from '../../../app-router';
import BuildingCreatorSideMenu from '../../../components/building-creator-side-menu';
import InputField from "../../../components/form_elements/input_field";
import InputNumeric from "../../../components/form_elements/input_numeric";
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
const ArrowCircleRight = FaArrowCircleRight as any;

const range = (from: number, to: number): number[] => Array.from({ length: Math.max(0, to - from + 1) }, (_unused, index) => from + index);

export default class BuildingCreatorStructure extends React.Component<IStructureProps> {
    constructor(props: IStructureProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Steps 1 and 2 | Building Creator");
    }

    update = (change: (building: Building) => void): void => {
        const building = this.props.appGlobals.currentBuilding;
        if (building) {
            change(building);
            this.props.appGlobals.saveCurrentBuilding(building);
        }
    }

    updateRulesLevel = (e: React.FormEvent<HTMLSelectElement>): void => {
        const appSettings = this.props.appGlobals.appSettings;
        appSettings.mechRulesFilter = +e.currentTarget.value;
        this.props.appGlobals.saveAppSettings(appSettings);
    }

    render = (): JSX.Element => {
        const building = this.props.appGlobals.currentBuilding;
        if (!building) return <></>;
        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;
        const classification = building.getClassification();
        const type = building.getType();
        const hexLabel = building.getHexLabel(true);

        return (
            <UIPage current="classic-battletech-building-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <BuildingCreatorSideMenu appGlobals={this.props.appGlobals} current="structure" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="Step 1: Establish Superstructure">
                            <InputField
                                label="Building Name (e.g. Battery Kenyon, Gate Bunker)"
                                value={building.getName()}
                                onChange={(e) => { const value = e.currentTarget.value; this.update((b) => b.setName(value)); }}
                            />

                            <label>
                                Technology Base:
                                <select value={building.getTech().tag} onChange={(e) => { const value = e.currentTarget.value; this.update((b) => b.setTech(value)); }}>
                                    {btTechOptions.map((option) => (
                                        <option key={option.tag} value={option.tag}>{option.name}</option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Rules Level:
                                <select value={rulesLevel} onChange={this.updateRulesLevel}>
                                    {getRulesLevelOptions().map((option) => (
                                        <option key={option.id} value={option.id}>{option.name}</option>
                                    ))}
                                </select>
                            </label>
                            <p className="smaller-text">Building construction is an Advanced rule (Tactical Operations: Advanced Rules p. 126).</p>

                            <label>
                                Era:
                                <select value={building.getEra().tag} onChange={(e) => { const value = e.currentTarget.value; this.update((b) => b.setEra(value)); }}>
                                    {building.getAvailableEras().map((option) => (
                                        <option key={option.tag} value={option.tag}>{option.name}</option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Building Classification:
                                <select value={classification.tag} onChange={(e) => { const value = e.currentTarget.value; this.update((b) => b.setClassification(value)); }}>
                                    {BUILDING_CLASSIFICATIONS.map((option) => (
                                        <option key={option.tag} value={option.tag}>{option.name}</option>
                                    ))}
                                </select>
                            </label>
                            <p className="smaller-text">
                                {classification.description} Damage to the building, and to units inside it, is multiplied by {classification.damageToBuilding};
                                damage the building does to a unit, as when one crashes through its walls, by {classification.damageToUnits} (TO:AR pp. 113, 124).
                            </p>

                            {classification.types.length > 1 ? (
                                <label>
                                    Building Type:
                                    <select value={type.tag} onChange={(e) => { const value = e.currentTarget.value; this.update((b) => b.setType(value)); }}>
                                        {classification.types.map((option) => (
                                            <option key={option.tag} value={option.tag}>{option.name} (CF {option.minCF}-{option.maxCF})</option>
                                        ))}
                                    </select>
                                </label>
                            ) : null}
                            <p className="smaller-text">
                                {type.mpCost === null ? "Units cannot enter this building's hexes." : `Entering a hex costs +${type.mpCost} MP`}
                                {type.pilotingModifier === null ? "" : `, with a +${type.pilotingModifier} Piloting/Driving Skill Roll modifier.`}
                            </p>

                            <InputNumeric
                                label={`Construction Factor (${type.minCF} to ${type.maxCF})`}
                                value={building.getCF()}
                                min={type.minCF}
                                max={type.maxCF}
                                step={1}
                                setValue={(value) => this.update((b) => b.setCF(value))}
                            />

                            {building.getMaxHexes() > 1 ? (
                                <label>
                                    Size in {hexLabel}:
                                    <select value={building.getHexes()} onChange={(e) => { const value = +e.currentTarget.value; this.update((b) => b.setHexes(value)); }}>
                                        {range(1, building.getMaxHexes()).map((value) => <option key={value} value={value}>{value}</option>)}
                                    </select>
                                </label>
                            ) : null}
                            {building.getMaxLevels() > 1 ? (
                                <label>
                                    Height in Levels:
                                    <select value={building.getLevels()} onChange={(e) => { const value = +e.currentTarget.value; this.update((b) => b.setLevels(value)); }}>
                                        {range(1, building.getMaxLevels()).map((value) => <option key={value} value={value}>{value}</option>)}
                                    </select>
                                </label>
                            ) : null}
                            <p data-testid="building-capacity">
                                <strong>Size</strong>: {building.getHexes()} {building.getHexLabel(building.getHexes() !== 1)}, {building.getLevels()} {building.getLevels() === 1 ? "level" : "levels"} &nbsp;|&nbsp;
                                <strong>Internal Weight Capacity</strong>: {building.getCapacityPerHex()} tons a {building.getHexLabel()}
                                {building.getHexes() > 1 ? `, ${building.getTotalCapacity()} in all` : ""}
                            </p>
                            <p className="smaller-text">
                                A hex carries its Construction Factor times its levels in equipment, armor included. Hangars triple that, to
                                600 tons for every 4 levels; tents, fences and bridges carry nothing (TO:AR p. 127).
                            </p>
                        </TextSection>

                        <TextSection label="Structural Modifications">
                            <div data-testid="building-modifications">
                                {building.canBeSubsurface() ? (
                                    <>
                                        <label>
                                            Location:
                                            <select value={building.getSubsurface()} onChange={(e) => { const value = e.currentTarget.value; this.update((b) => b.setSubsurface(value)); }}>
                                                <option value="none">On the surface</option>
                                                <option value="underground">Underground</option>
                                                <option value="underwater">Underwater</option>
                                            </select>
                                        </label>
                                        {building.getSubsurface() !== "none" ? (
                                            <label>
                                                Depth in levels below the surface:
                                                <input type="number" min={1} max={1000} value={building.getDepth()} onChange={(e) => { const value = +e.currentTarget.value || 1; this.update((b) => b.setDepth(value)); }} />
                                            </label>
                                        ) : null}
                                        <p className="smaller-text">
                                            An underground building may be half the usual size and mounts nothing on its roof; an underwater one is sealed
                                            and no deeper than its Construction Factor. Either multiplies the structure cost by 5 (TO:AR pp. 138, 208).
                                        </p>
                                    </>
                                ) : null}
                                {building.canBeTunnel() ? (
                                    <label>
                                        <input type="checkbox" checked={building.isTunnel()} onChange={(e) => { const value = e.currentTarget.checked; this.update((b) => b.setTunnel(value)); }} />
                                        &nbsp;Tunnel: a hangar that links buildings, with no equipment and a large door at each end (cost x1.875, TO:AR p. 139)
                                    </label>
                                ) : null}
                                {building.canSeal() ? (
                                    <label>
                                        <input type="checkbox" checked={building.isSealed()} disabled={building.getSubsurface() === "underwater"} onChange={(e) => { const value = e.currentTarget.checked; this.update((b) => b.setSealed(value)); }} />
                                        &nbsp;Environmental Sealing: for vacuum, toxic air or water; no weight (cost x1.5, TO:AR pp. 134-135)
                                    </label>
                                ) : null}
                                {building.canHaveHeavyMetalSuperstructure() ? (
                                    <label>
                                        <input type="checkbox" checked={building.hasHeavyMetalSuperstructure()} onChange={(e) => { const value = e.currentTarget.checked; this.update((b) => b.setHeavyMetalSuperstructure(value)); }} />
                                        &nbsp;Heavy Metal Superstructure: interferes with sensors; takes a quarter of the weight capacity (cost x1.25, TO:AR p. 135)
                                    </label>
                                ) : null}
                                {building.canSetCeilings() ? (
                                    <label>
                                        Ceilings:
                                        <select value={building.getCeilings()} onChange={(e) => { const value = e.currentTarget.value; this.update((b) => b.setCeilings(value)); }}>
                                            <option value="standard">Standard</option>
                                            <option value="high">High (cost x1.1)</option>
                                            <option value="low">Low (cost x1.1)</option>
                                        </select>
                                    </label>
                                ) : null}
                                {building.canMountDoors() ? (
                                    <>
                                        <p><strong>Large Doors</strong>: {building.getDoors().length}</p>
                                        {building.getDoors().map((height, index) => (
                                            <p key={index}>
                                                <label>
                                                    Door {index + 1} height in levels:
                                                    <select value={height} onChange={(e) => { const value = +e.currentTarget.value; this.update((b) => b.setDoorHeight(index, value)); }}>
                                                        {range(1, building.getLevels()).map((value) => <option key={value} value={value}>{value}</option>)}
                                                    </select>
                                                </label>
                                                <button className="btn btn-danger btn-sm" onClick={() => this.update((b) => b.removeDoor(index))}>Remove Door {index + 1}</button>
                                            </p>
                                        ))}
                                        <button className="btn btn-primary btn-sm" onClick={() => this.update((b) => b.addDoor(1))}>Add Large Door</button>
                                        <p className="smaller-text">
                                            One a hexside, on an outer hexside, at no weight and 10,000 C-bills a level of height. 'Mechs need a door 2
                                            levels high (TO:AR pp. 136, 208).
                                        </p>
                                    </>
                                ) : null}
                                {!building.canBeSubsurface() && !building.canSeal() && !building.canHaveHeavyMetalSuperstructure() && !building.canSetCeilings() && !building.canMountDoors() ? (
                                    <p>A {classification.name.toLowerCase()} of this type takes no structural modifications.</p>
                                ) : (
                                    <p><strong>Structure Cost Multiplier</strong>: x{building.getStructureCostMultiplier()}</p>
                                )}
                            </div>
                        </TextSection>

                        <TextSection label="Step 2: Add Armor">
                            {building.canMountArmor() ? (
                                <>
                                    <InputNumeric
                                        label={`Tons of Armor on each ${building.getHexLabel()} (0 to ${building.getMaxArmorTons()})`}
                                        value={building.getArmorTons()}
                                        min={0}
                                        max={building.getMaxArmorTons()}
                                        step={1}
                                        setValue={(value) => this.update((b) => b.setArmorTons(value))}
                                    />
                                    <p data-testid="building-armor">
                                        <strong>Armor Factor</strong>: {building.getArmorPoints()} of {building.getMaxArmorPoints()} points a {building.getHexLabel()} &nbsp;|&nbsp;
                                        <strong>Armor Weight</strong>: {building.getArmorTons() * building.getHexes()} tons
                                    </p>
                                    <p className="smaller-text">
                                        Armor comes in full tons, the same on every {building.getHexLabel()}: {building.getArmorPointsPerTon()} points a ton
                                        for {building.getTechBase() === "clan" ? "Clan" : "Inner Sphere"} buildings, up to the Construction Factor. It must
                                        be destroyed before the building itself takes damage (TO:AR p. 128).
                                    </p>
                                </>
                            ) : (
                                <p>Only walls, gun emplacements and fortresses may install armor (TO:AR p. 128).</p>
                            )}

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/building-creator/equipment`} className="btn btn-primary pull-right btn-sm">
                                    Next: Weapons, Power and Equipment <ArrowCircleRight />
                                </Link>
                            </div>
                        </TextSection>
                    </div>
                </div>
            </UIPage>
        );
    }
}

interface IStructureProps {
    appGlobals: IAppGlobals;
}
