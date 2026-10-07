import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight } from "react-icons/fa";
import InfantryPlatoon, { INFANTRY_MAX_SQUADS, INFANTRY_MOTIVE_TYPES } from '../../../../classes/infantry-platoon';
import { IAppGlobals } from '../../../app-router';
import InfantryCreatorSideMenu from '../../../components/infantry-creator-side-menu';
import InputField from "../../../components/form_elements/input_field";
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
const ArrowCircleRight = FaArrowCircleRight as any;

const range = (from: number, to: number): number[] => Array.from({ length: Math.max(0, to - from + 1) }, (_unused, index) => from + index);

export default class InfantryCreatorPlatoon extends React.Component<IPlatoonProps> {
    constructor(props: IPlatoonProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Step 1 | Infantry Creator");
    }

    // Every control changes the loaded platoon and saves it.
    update = (change: (platoon: InfantryPlatoon) => void): void => {
        const platoon = this.props.appGlobals.currentInfantry;
        if (platoon) {
            change(platoon);
            this.props.appGlobals.saveCurrentInfantry(platoon);
        }
    }

    render = (): JSX.Element => {
        const platoon = this.props.appGlobals.currentInfantry;
        if (!platoon) return <></>;
        const motive = platoon.getMotive();
        const subPlatoons = platoon.getSubPlatoons();
        const formationSize = platoon.getFormation().sizes[motive.tag];

        return (
            <UIPage current="classic-battletech-infantry-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <InfantryCreatorSideMenu appGlobals={this.props.appGlobals} current="platoon" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="Step 1: Establish Platoon Type">
                            <InputField
                                label="Platoon Name (e.g. Laser Rifle Platoon, Third Crucis Lancers)"
                                value={platoon.getName()}
                                onChange={(e) => { const value = e.currentTarget.value; this.update((p) => p.setName(value)); }}
                            />
                            <p className="smaller-text">Left empty, the platoon is called by its motive type and weapon: {platoon.getNomenclature()}.</p>

                            <label>
                                Motive Type:
                                <select value={motive.tag} onChange={(e) => { const value = e.currentTarget.value; this.update((p) => p.setMotive(value)); }}>
                                    {INFANTRY_MOTIVE_TYPES.map((option) => (
                                        <option key={option.tag} value={option.tag}>{option.name}</option>
                                    ))}
                                </select>
                            </label>
                            <p className="smaller-text">
                                {motive.mp} MP ({motive.moveType}); squads of up to {motive.maxSquadSize}, platoons of up to {motive.maxPlatoonSize}.
                                Prohibited terrain: {motive.prohibitedTerrain} (TM p. 145).
                                {motive.mechanized ? " Mechanized infantry ride their own vehicles; they cannot make Anti-'Mech attacks or use melee and point-blank weapons." : ""}
                            </p>

                            <label>
                                Technology Base:
                                <select value={platoon.getTechBase()} onChange={(e) => { const value = e.currentTarget.value; this.update((p) => p.setTechBase(value === "clan" ? "clan" : "is")); }}>
                                    <option value="is">Inner Sphere</option>
                                    <option value="clan">Clan</option>
                                </select>
                            </label>

                            <label>
                                Era:
                                <select value={platoon.getEra().tag} onChange={(e) => { const value = e.currentTarget.value; this.update((p) => p.setEra(value)); }}>
                                    {platoon.getAvailableEras().map((option) => (
                                        <option key={option.tag} value={option.tag}>{option.name}</option>
                                    ))}
                                </select>
                            </label>
                            <p className="smaller-text">
                                The weapons step offers what was in production in this era (TM pp. 298-301).
                                {platoon.getEra().description ? ` ${platoon.getEra().description}` : ""}
                            </p>

                            <label>
                                Affiliation:
                                <select value={platoon.getFormation().tag} onChange={(e) => { const value = e.currentTarget.value; this.update((p) => p.setFormation(value)); }}>
                                    {platoon.getAvailableFormations().map((option) => (
                                        <option key={option.tag} value={option.tag}>{option.name}</option>
                                    ))}
                                </select>
                            </label>
                            <p className="smaller-text">
                                {platoon.getFormation().name} {motive.name.toLowerCase()} infantry deploy {formationSize[1]} squads of {formationSize[0]} (TM p. 147).
                                {platoon.getFormation().notes ? ` ${platoon.getFormation().notes}` : ""}
                            </p>

                            <h3>Size</h3>
                            <label>
                                Troopers per Squad:
                                <select value={platoon.getSquadSize()} onChange={(e) => { const value = +e.currentTarget.value; this.update((p) => p.setSquadSize(value)); }}>
                                    {range(1, motive.maxSquadSize).map((value) => <option key={value} value={value}>{value}</option>)}
                                </select>
                            </label>
                            <label>
                                Squads:
                                <select value={platoon.getSquads()} onChange={(e) => { const value = +e.currentTarget.value; this.update((p) => p.setSquads(value)); }}>
                                    {range(1, INFANTRY_MAX_SQUADS).map((value) => <option key={value} value={value}>{value}</option>)}
                                </select>
                            </label>
                            {!platoon.usesFormationSizes() ? (
                                <button className="btn btn-primary btn-sm" onClick={() => this.update((p) => p.applyFormation())}>
                                    Use the {platoon.getFormation().name} arrangement
                                </button>
                            ) : null}
                            <p data-testid="infantry-size">
                                <strong>Troopers</strong>: {platoon.getTroopers()}
                                {subPlatoons.length > 1 ? <> &nbsp;|&nbsp; <strong>Sub-Platoons</strong>: {subPlatoons.length} of {subPlatoons.join(", ")}</> : null}
                                &nbsp;|&nbsp; <strong>Transport Weight</strong>: {platoon.getWeight()} tons
                            </p>
                            {subPlatoons.length > 1 ? (
                                <p className="smaller-text">
                                    A formation of more than {motive.maxPlatoonSize} troopers is divided as evenly as possible into sub-platoons, each
                                    moving, attacking and taking damage on its own record sheet line (TM p. 146).
                                </p>
                            ) : null}

                            <h3>Anti-'Mech Capability and Skills</h3>
                            {!motive.mechanized ? (
                                <label>
                                    <input type="checkbox" checked={platoon.hasAntiMechKit()} onChange={(e) => { const value = e.currentTarget.checked; this.update((p) => p.setAntiMechKit(value)); }} />
                                    &nbsp;Anti-'Mech Infantry kits and training (15 kg a trooper, cost x 5; TM pp. 155, 282)
                                </label>
                            ) : null}
                            <label>
                                Gunnery Skill:
                                <select value={platoon.getGunnery()} onChange={(e) => { const value = +e.currentTarget.value; this.update((p) => p.setGunnery(value)); }}>
                                    {range(0, 8).map((value) => <option key={value} value={value}>{value}</option>)}
                                </select>
                            </label>
                            {platoon.hasAntiMechKit() ? (
                                <label>
                                    Anti-'Mech Skill:
                                    <select value={platoon.getAntiMechSkill()} onChange={(e) => { const value = +e.currentTarget.value; this.update((p) => p.setAntiMechSkill(value)); }}>
                                        {range(0, 8).map((value) => <option key={value} value={value}>{value}</option>)}
                                    </select>
                                </label>
                            ) : (
                                <p className="smaller-text">
                                    {motive.mechanized
                                        ? "Mechanized infantry adjust their Gunnery Skill only."
                                        : "Without Anti-'Mech kits the platoon's Anti-'Mech Skill is fixed at 8 (TM p. 155)."}
                                </p>
                            )}

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/infantry-creator/weapons`} className="btn btn-primary pull-right btn-sm">
                                    Next: Weapons <ArrowCircleRight />
                                </Link>
                            </div>
                        </TextSection>
                    </div>
                </div>
            </UIPage>
        );
    }
}

interface IPlatoonProps {
    appGlobals: IAppGlobals;
}
