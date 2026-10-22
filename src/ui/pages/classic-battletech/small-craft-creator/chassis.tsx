import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight } from "react-icons/fa";
import SmallCraft from '../../../../classes/small-craft';
import { SMALL_CRAFT_MAX_TONNAGE, SMALL_CRAFT_MIN_TONNAGE, SMALL_CRAFT_SHAPES, SMALL_CRAFT_TONNAGE_STEP } from '../../../../data/small-craft-construction';
import { btTechOptions } from '../../../../data/tech-options';
import { chooseEra, getEraChoices, getTechChoices } from '../../../../data/era-choice';
import { IAppGlobals } from '../../../app-router';
import InputField from "../../../components/form_elements/input_field";
import InputNumeric from "../../../components/form_elements/input_numeric";
import SmallCraftCreatorSideMenu from '../../../components/small-craft-creator-side-menu';
import RulesEditionSelect from '../../../components/rules-edition-select';
import RulesLevelSelect from '../../../components/rules-level-select';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import SmallCraftStatusBar from './_statusBar';
const ArrowCircleRight = FaArrowCircleRight as any;

const range = (from: number, to: number, step: number = 1): number[] => {
    const values: number[] = [];
    for (let value = from; value <= to; value += step) values.push(value);
    return values;
};

export default class SmallCraftCreatorChassis extends React.Component<IChassisProps> {
    constructor(props: IChassisProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Steps 1-2 | Small Craft Creator");
    }

    // Every control changes the loaded craft and saves it.
    update = (change: (craft: SmallCraft) => void): void => {
        const craft = this.props.appGlobals.currentSmallCraft;
        if (craft) {
            change(craft);
            this.props.appGlobals.saveCurrentSmallCraft(craft);
        }
    }

    updateRulesLevel = (level: number): void => {
        const appSettings = this.props.appGlobals.appSettings;
        appSettings.mechRulesFilter = level;
        this.props.appGlobals.saveAppSettings(appSettings);
    }

    render = (): JSX.Element => {
        const craft = this.props.appGlobals.currentSmallCraft;
        if (!craft) return <></>;
        const rulesLevel = this.props.appGlobals.appSettings.mechRulesFilter;

        return (
            <UIPage current="classic-battletech-small-craft-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <SmallCraftCreatorSideMenu appGlobals={this.props.appGlobals} current="chassis" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <SmallCraftStatusBar craft={craft} rulesLevel={rulesLevel} />
                        <TextSection label="Step 1: Design the Hull">
                            {/* The rules edition comes first: it decides what every field below offers. */}
                            <RulesEditionSelect unitType="small-craft" value={craft.getRulesEdition()} onChange={(tag) => this.update((c) => c.setRulesEdition(tag))} />
                            <RulesLevelSelect editionTag={craft.getRulesEdition()} value={rulesLevel} onChange={this.updateRulesLevel} />
                            {/* The era comes next and decides the tech bases offered below (user ruling 2026-10-21). */}
                            <label>
                                Era:
                                <select value={craft.getEra().tag} onChange={(e) => { const value = e.currentTarget.value; this.update((c) => chooseEra(c, value)); }}>
                                    {getEraChoices(btTechOptions.map((option) => option.tag)).map((option) => (
                                        <option key={option.tag} value={option.tag}>{option.name}</option>
                                    ))}
                                </select>
                            </label>
                            {craft.getEra().description ? <p className="smaller-text">{craft.getEra().description}</p> : null}
                            <InputField
                                label="Model # (e.g. LC-100)"
                                value={craft.getModel()}
                                onChange={(e) => { const value = e.currentTarget.value; this.update((c) => c.setModel(value)); }}
                            />
                            <InputField
                                label="Name (e.g. Astrolux Star Yacht)"
                                value={craft.getName()}
                                onChange={(e) => { const value = e.currentTarget.value; this.update((c) => c.setName(value)); }}
                            />

                            <label>
                                Craft Type:
                                <select data-testid="sc-craft-type" value={craft.getCraftType()} onChange={(e) => { const value = e.currentTarget.value; this.update((c) => c.setCraftType(value)); }}>
                                    <option value="smallCraft">Small Craft (100 to 200 tons)</option>
                                    <option value="dropShip">DropShip (200 to 100,000 tons)</option>
                                </select>
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    data-testid="sc-military"
                                    checked={craft.isMilitary()}
                                    onChange={(e) => { const value = e.currentTarget.checked; this.update((c) => c.setMilitary(value)); }}
                                />
                                {" "}Military design (a DropShip's crew, free heat sinks and fuel use depend on it, TM pp. 186-193)
                            </label>

                            <label>
                                Shape:
                                <select value={craft.getShape()} onChange={(e) => { const value = e.currentTarget.value; this.update((c) => c.setShape(value)); }}>
                                    {SMALL_CRAFT_SHAPES.map((option) => (
                                        <option key={option.tag} value={option.tag}>{option.name}</option>
                                    ))}
                                </select>
                            </label>
                            <p className="smaller-text">
                                {craft.isAerodyne()
                                    ? "An aerodyne craft flies like a fighter: Nose, Wing and Aft arcs, a heavier structure, more armor for its Structural Integrity and up to 2 bay doors (TM pp. 187-196)."
                                    : "A spheroid craft lands on its tail: Nose, Fore-Side, Aft-Side and Aft arcs, a lighter structure, more free heat sinks and up to 4 bay doors (TM pp. 187-196)."}
                            </p>

                            <label>
                                Technology Base:
                                <select value={craft.getTech().tag} onChange={(e) => { const value = e.currentTarget.value; this.update((c) => c.setTech(value)); }}>
                                    {btTechOptions.filter((option) => getTechChoices(craft.getEra(), [option.tag]).length > 0).map((option) => (
                                        <option key={option.tag} value={option.tag}>{option.name}</option>
                                    ))}
                                </select>
                            </label>



                            <label>
                                Tonnage:
                                {craft.isDropShip() ? (
                                    <input
                                        type="number"
                                        data-testid="sc-tonnage"
                                        min={craft.getMinTonnage()}
                                        max={craft.getMaxTonnage()}
                                        step={craft.getTonnageStep()}
                                        value={craft.getTonnage()}
                                        onChange={(e) => { const value = +e.currentTarget.value; this.update((c) => c.setTonnage(value)); }}
                                    />
                                ) : (
                                    <select data-testid="sc-tonnage" value={craft.getTonnage()} onChange={(e) => { const value = +e.currentTarget.value; this.update((c) => c.setTonnage(value)); }}>
                                        {range(SMALL_CRAFT_MIN_TONNAGE, SMALL_CRAFT_MAX_TONNAGE, SMALL_CRAFT_TONNAGE_STEP).map((tons) => (
                                            <option key={tons} value={tons}>{tons}</option>
                                        ))}
                                    </select>
                                )}
                            </label>
                            {craft.canUseFractionalAccounting(rulesLevel) || craft.usesFractionalAccounting() ? (
                                <div data-testid="fractional-accounting-option">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={craft.usesFractionalAccounting()}
                                            onChange={(e) => { const value = e.currentTarget.checked; this.update((c) => c.setWeightAccounting(value ? "fractional" : "standard", rulesLevel)); }}
                                        />
                                        &nbsp;Fractional Accounting (Experimental)
                                    </label>
                                    <p className="smaller-text">
                                        Construction option (TO:AUE p.188): engine, fuel pump, structure, control, fire control and
                                        armor weights are not rounded to the half ton, only up to the kilogram. Armor is bought by
                                        the point and ammunition by the shot. Fuel is still bought in half tons (TM p. 186).
                                    </p>
                                    {craft.defaultsToFractionalAccounting() ? (
                                        <p className="smaller-text" data-testid="fractional-accounting-default">
                                            On by default with battle armor equipment mounted (Ghosts of Obeedah p.54); it may be turned off.
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}
                        </TextSection>

                        <TextSection label="Step 2: Engine, Fuel, Structure and Controls">
                            <label>
                                Safe Thrust:
                                <select data-testid="sc-thrust" value={craft.getSafeThrust()} onChange={(e) => { const value = +e.currentTarget.value; this.update((c) => c.setSafeThrust(value)); }}>
                                    {range(1, 12).map((thrust) => (
                                        <option key={thrust} value={thrust}>{thrust} (Max Thrust {Math.ceil(thrust * 1.5)})</option>
                                    ))}
                                </select>
                            </label>
                            {craft.isMixedTech() ? (
                                <label>
                                    Engine:
                                    <select value={craft.getEngineTechBase()} onChange={(e) => { const value = e.currentTarget.value; this.update((c) => c.setEngineTechBase(value)); }}>
                                        <option value="is">Inner Sphere (x 0.065)</option>
                                        <option value="clan">Clan (x 0.061)</option>
                                    </select>
                                </label>
                            ) : null}
                            <p>
                                <strong>Engine</strong>: {craft.getEngineWeight()} tons &nbsp;|&nbsp;
                                <strong>Controls</strong>: {craft.getControlsWeight()} tons
                            </p>
                            <p className="smaller-text">
                                Engine weight = tonnage x Safe Thrust x 0.065, or 0.061 for a Clan craft, rounded up to the half ton
                                (TM p. 185). Controls weigh tonnage x 0.0075 (TM p. 189).
                            </p>

                            <InputNumeric
                                label="Fuel (tons)"
                                value={craft.getFuelTons()}
                                min={0}
                                max={craft.getTonnage()}
                                step={0.5}
                                setValue={(tons) => this.update((c) => c.setFuelTons(tons))}
                            />
                            <p>
                                <strong>Fuel Points</strong>: {craft.getFuelPoints()} (80 per ton) &nbsp;|&nbsp;
                                <strong>Tanks and Pumps</strong>: {craft.getFuelPumpWeight()} tons &nbsp;|&nbsp;
                                <strong>Days at 1 G</strong>: {craft.getBurnDays()} (1.84 tons a day)
                            </p>
                            <p className="smaller-text">
                                A Small Craft should give at least 5 percent of its weight to fuel; tanks and pumps add 2 percent of
                                the fuel's weight (TM p. 186).
                            </p>

                            <InputNumeric
                                label={`Structural Integrity (${craft.getMinStructuralIntegrity()} to ${craft.getMaxStructuralIntegrity()})`}
                                value={craft.getStructuralIntegrity()}
                                min={craft.getMinStructuralIntegrity()}
                                max={craft.getMaxStructuralIntegrity()}
                                step={1}
                                setValue={(value) => this.update((c) => c.setStructuralIntegrity(value))}
                            />
                            <p>
                                <strong>Structure</strong>: {craft.getStructureWeight()} tons &nbsp;|&nbsp;
                                <strong>Most Armor</strong>: {craft.getMaxArmorTons()} tons &nbsp;|&nbsp;
                                <strong>Free Armor</strong>: {craft.getBonusArmorPoints()} points
                            </p>
                            <p className="smaller-text">
                                Structural Integrity runs from Maximum Thrust to 30 times it, and weighs SI x tonnage / {craft.isAerodyne() ? 200 : 500} (TM
                                p. 187). It sets the most armor the craft may carry and gives each facing that many armor points free (TM p. 191).
                            </p>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/small-craft-creator/armor`} className="btn btn-primary pull-right btn-sm">
                                    Next: Armor <ArrowCircleRight />
                                </Link>
                            </div>
                        </TextSection>
                    </div>
                </div>
            </UIPage>
        );
    }
}

interface IChassisProps {
    appGlobals: IAppGlobals;
}
