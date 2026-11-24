import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleRight } from "react-icons/fa";
import InfantryPlatoon, { INFANTRY_BEAST_MOUNTS, INFANTRY_BEAST_RULES_LEVEL, INFANTRY_BEAST_SIZES, INFANTRY_MIXED_TECH_RULES_LEVEL, INFANTRY_ENGINEER_TASKS, INFANTRY_MAX_SQUADS, INFANTRY_MOTIVE_TYPES, INFANTRY_SPECIALTIES, INFANTRY_SPECIALTY_RULES_LEVEL, INFANTRY_VETERAN_ANTI_MECH, INFANTRY_VETERAN_GUNNERY, INFANTRY_XCT_ENVIRONMENTS } from '../../../../classes/infantry-platoon';
import { INFANTRY_ARMOR_GROUPS, INFANTRY_ARMOR_RULES_LEVEL, infantryArmor } from '../../../../data/infantry-armor';
import InfantryAugmentationPanel from './augmentation';
import { IAppGlobals } from '../../../app-router';
import { InfantryCreatorSideMenu } from '../../../components/creator-side-menus';
import InputField from "../../../components/form_elements/input_field";
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import { UnitGameSettingsBlock, unitRulesLevel } from '../../../components/game-settings-block';
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
        const rulesLevel = unitRulesLevel(this.props.appGlobals.currentInfantry, this.props.appGlobals.appSettings);
        const armor = platoon.getArmor();
        const armorOffered = rulesLevel >= INFANTRY_ARMOR_RULES_LEVEL || armor !== null;
        const availableArmor = platoon.getAvailableArmor();
        const motive = platoon.getMotive();
        const subPlatoons = platoon.getSubPlatoons();
        const formationSize = platoon.getFormationSizes();
        const mount = platoon.getMount();
        // Specialized infantry and XCT troops are Advanced rules (TO:AUE pp.152, 162); a platoon that has them keeps the controls at any level.
        const specialtiesOffered = rulesLevel >= INFANTRY_SPECIALTY_RULES_LEVEL || platoon.isSpecialized() || platoon.getXCT() !== null;

        return (
            <UIPage current="classic-battletech-infantry-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <InfantryCreatorSideMenu appGlobals={this.props.appGlobals} current="platoon" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label="Step 1: Establish Platoon Type">
                            {/* The shared settings block comes first: it decides what every field below offers (#324). */}
                            <UnitGameSettingsBlock unitType="infantry" unit={platoon} appGlobals={this.props.appGlobals} onChange={() => this.update(() => undefined)} />
                            <p className="smaller-text">
                                The weapons step offers what was in production in this era (TM pp. 298-301).
                            </p>
                            <InputField
                                label="Platoon Name (e.g. Laser Rifle Platoon, Third Crucis Lancers)"
                                value={platoon.getName()}
                                onChange={(e) => { const value = e.currentTarget.value; this.update((p) => p.setName(value)); }}
                            />
                            <p className="smaller-text">Left empty, the platoon is called by its motive type and weapon: {platoon.getNomenclature()}.</p>

                            <label>
                                Motive Type:
                                <select value={motive.tag} onChange={(e) => { const value = e.currentTarget.value; this.update((p) => p.setMotive(value)); }}>
                                    {INFANTRY_MOTIVE_TYPES.filter((option) => option.tag === motive.tag || (option.tag !== "beast" || rulesLevel >= INFANTRY_BEAST_RULES_LEVEL) && rulesLevel >= (option.rulesLevel ?? 0)).map((option) => (
                                        <option key={option.tag} value={option.tag}>{option.name}</option>
                                    ))}
                                </select>
                            </label>
                            {mount ? (
                                <>
                                    <label>
                                        Creature:
                                        <select data-testid="infantry-mount" value={mount.tag} onChange={(e) => { const value = e.currentTarget.value; this.update((p) => p.setMount(value)); }}>
                                            {INFANTRY_BEAST_MOUNTS.map((option) => (
                                                <option key={option.tag} value={option.tag}>
                                                    {option.name} - {INFANTRY_BEAST_SIZES[option.size].name}, {option.mp} MP ({option.moveType}), divisor {option.damageDivisor}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <p className="smaller-text" data-testid="infantry-mount-notes">
                                        Advanced rules (Tactical Operations: Advanced Units &amp; Equipment pp. 106-108). {platoon.getBeastSize()?.name} creature: {mount.weight} tons each, riders 0.2 tons each;
                                        attacks against the platoon take {platoon.getAttackerToHitModifier() >= 0 ? "+" : ""}{platoon.getAttackerToHitModifier()} to-hit and its damage is divided by {platoon.getDamageDivisor()}.
                                        {platoon.getBonusDamageText() ? ` ${platoon.getBonusDamageText()}.` : ""}
                                        {mount.moveType === "Submarine" ? " Submarine creatures need SCUBA gear on their riders." : ""}
                                        {" "}A Very Large or Monstrous creature is a squad of its own riders; a Large creature carries one trooper.
                                    </p>
                                </>
                            ) : null}
                            <p className="smaller-text">
                                {platoon.getMovementText()}; squads of up to {platoon.getMaxSquadSize()}, platoons of up to {platoon.getMaxPlatoonSize()}{platoon.getMaxSquads() < 5 ? ` and ${platoon.getMaxSquads()} squads` : ""}.
                                Prohibited terrain: {platoon.getProhibitedTerrain()} ({platoon.isSpecialized() || motive.rulesLevel ? "TO:AUE pp. 135, 153" : "TM p. 145"}).
                                {mount ? " Beast-mounted infantry may not use the mechanized rules." : ""}
                                {motive.mechanized ? " Mechanized infantry ride their own vehicles; they cannot make Anti-'Mech attacks or use melee and point-blank weapons." : ""}
                            </p>

                            <label>
                                Technology Base:
                                <select
                                    data-testid="infantry-tech-base"
                                    value={`${platoon.isMixedTech() ? "mixed-" : ""}${platoon.getTechBase()}`}
                                    onChange={(e) => { const value = e.currentTarget.value; this.update((p) => { p.setTechBase(value.endsWith("clan") ? "clan" : "is"); p.setMixedTech(value.startsWith("mixed-")); }); }}
                                >
                                    <option value="is">Inner Sphere</option>
                                    <option value="clan">Clan</option>
                                    {rulesLevel >= INFANTRY_MIXED_TECH_RULES_LEVEL || platoon.isMixedTech() ? (
                                        <>
                                            <option value="mixed-is">Mixed (Inner Sphere)</option>
                                            <option value="mixed-clan">Mixed (Clan)</option>
                                        </>
                                    ) : null}
                                </select>
                            </label>
                            {platoon.isMixedTech() ? (
                                <p className="smaller-text">
                                    Mixed technology (Tactical Operations: Advanced Units &amp; Equipment p. 189, Advanced): the platoon keeps its {platoon.isClan() ? "Clan" : "Inner Sphere"} formations
                                    and eras, and may carry weapons and armor kits of either technology base, each by its own base&apos;s dates.
                                </p>
                            ) : null}

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
                                    {range(1, platoon.getMaxSquadSize()).map((value) => <option key={value} value={value}>{value}</option>)}
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
                                    A formation of more than {platoon.getMaxPlatoonSize()} troopers is divided as evenly as possible into sub-platoons, each
                                    moving, attacking and taking damage on its own record sheet line (TM p. 146).
                                </p>
                            ) : null}

                            {armorOffered ? (
                                <>
                                    <h3>Infantry Armor</h3>
                                    <label>
                                        Infantry Armor:
                                        <select value={armor ? armor.tag : ""} onChange={(e) => { const value = e.currentTarget.value; this.update((p) => p.setArmor(value)); }}>
                                            <option value="">None (standard rules)</option>
                                            {INFANTRY_ARMOR_GROUPS.map((group) => (
                                                <optgroup key={group.tag} label={group.name}>
                                                    {availableArmor.filter((item) => item.group === group.tag).map((item) => (
                                                        <option key={item.tag} value={item.tag}>
                                                            {item.name} - divisor {item.damageDivisor}{item.encumbering ? "E" : ""}, {item.cost.toLocaleString("en-US")} C-bills
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </label>
                                    <p className="smaller-text">
                                        Advanced rules (Tactical Operations: Advanced Units &amp; Equipment pp. 129-130). The whole platoon wears one
                                        type. Damage to the platoon is divided by the armor's divisor; "E" armor is encumbering: -1 MP and no
                                        Anti-'Mech attacks.
                                    </p>
                                </>
                            ) : null}

                            {specialtiesOffered ? (
                                <>
                                    <h3>Specialized Infantry</h3>
                                    <p className="smaller-text" data-testid="infantry-specialty-intro">
                                        Advanced rules (Tactical Operations: Advanced Units &amp; Equipment pp. 152-153). Specialists must be Veteran or better (Gunnery 3, and Anti-'Mech 4 with a kit);
                                        several may be combined, and the most restrictive limits of the motive type and every specialty apply. SCUBA and the VTOL types are motive types above.
                                    </p>
                                    {INFANTRY_SPECIALTIES.filter((item) => item.tag !== "paramedics" && item.tag !== "tag").map((item) => {
                                        const bar = platoon.getSpecialtyBar(item.tag);
                                        const on = platoon.hasSpecialty(item.tag);
                                        return (
                                            <label key={item.tag} className="d-block" title={bar ?? undefined}>
                                                <input
                                                    type="checkbox"
                                                    data-testid={`infantry-specialty-${item.tag}`}
                                                    disabled={!on && bar !== null}
                                                    checked={on}
                                                    onChange={(e) => { const value = e.currentTarget.checked; this.update((p) => { p.setSpecialty(item.tag, value); }); }}
                                                />
                                                &nbsp;{item.name} (squads of {item.maxSquadSize}, platoons of {item.maxPlatoonSize} and {item.maxSquads} squads, {item.maxSecondary === null ? "any number of" : item.maxSecondary} secondary, +{item.addedTons} t a trooper, cost x{item.costMultiplier}, ratings {item.ratings})
                                                {bar && !on ? <span className="smaller-text color-red"> &nbsp;{bar}</span> : null}
                                            </label>
                                        );
                                    })}
                                    {platoon.hasSpecialty("engineers") ? (
                                        <fieldset className="fieldset" data-testid="infantry-engineer-tasks">
                                            <legend>Combat Engineer Tasks</legend>
                                            <p className="smaller-text">Tick the tasks the platoon is trained for; with none ticked every task is open. One is designated before the scenario.</p>
                                            {INFANTRY_ENGINEER_TASKS.map((task) => (
                                                <label key={task.tag} className="d-block" title={task.text}>
                                                    <input
                                                        type="checkbox"
                                                        data-testid={`infantry-engineer-task-${task.tag}`}
                                                        checked={platoon.getEngineerTasks().includes(task.tag)}
                                                        onChange={(e) => {
                                                            const on = e.currentTarget.checked;
                                                            this.update((p) => { p.setEngineerTasks([...p.getEngineerTasks().filter((tag) => tag !== task.tag), ...(on ? [task.tag] : [])]); });
                                                        }}
                                                    />
                                                    &nbsp;{task.name}{task.alphaStrike ? ` (Alpha Strike ${task.alphaStrike})` : ""}
                                                </label>
                                            ))}
                                        </fieldset>
                                    ) : null}
                                    <label>
                                        Paramedics per Squad (each replaces a secondary weapon trooper; no weapon and no damage; +0.05 t; 0.375 of the total cost each):
                                        <select data-testid="infantry-paramedics" value={platoon.getParamedicsPerSquad()} onChange={(e) => { const value = +e.currentTarget.value; this.update((p) => { p.setParamedicsPerSquad(value); }); }}>
                                            {range(0, 2).map((value) => <option key={value} value={value} disabled={value > platoon.getParamedicsPerSquad() && platoon.getSpecialTroopersPerSquad() - platoon.getParamedicsPerSquad() + value > Math.min(2, platoon.getSecondarySlotsPerSquad())}>{value}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        TAG Troopers per Squad (TAG attacks at 3/6/9; 2 a squad are needed to work; 2 paramedics or TAG troopers a squad at most together):
                                        <select data-testid="infantry-tag-troopers" value={platoon.getTagTroopersPerSquad()} onChange={(e) => { const value = +e.currentTarget.value; this.update((p) => { p.setTagTroopersPerSquad(value); }); }}>
                                            {range(0, 2).map((value) => <option key={value} value={value} disabled={value > platoon.getTagTroopersPerSquad() && platoon.getSpecialTroopersPerSquad() - platoon.getTagTroopersPerSquad() + value > Math.min(2, platoon.getSecondarySlotsPerSquad())}>{value}</option>)}
                                        </select>
                                    </label>
                                    <p className="smaller-text">
                                        Secondary weapon slots a squad: {platoon.getSecondarySlotsPerSquad()}; paramedics and TAG troopers take them, and the secondary weapons give way.
                                    </p>
                                    {platoon.isSpecialized() && !platoon.meetsVeteranRule() ? (
                                        <p className="color-red" data-testid="infantry-veteran-warning">
                                            Specialists must be Veteran or better.{" "}
                                            <button className="btn btn-primary btn-sm" onClick={() => this.update((p) => { p.setGunnery(INFANTRY_VETERAN_GUNNERY); p.setAntiMechSkill(INFANTRY_VETERAN_ANTI_MECH); })}>
                                                Set Gunnery {INFANTRY_VETERAN_GUNNERY} and Anti-'Mech {INFANTRY_VETERAN_ANTI_MECH}
                                            </button>
                                        </p>
                                    ) : null}

                                    <h3>Xenoplanetary Condition-Trained (XCT) Troops</h3>
                                    <label>
                                        Environment (TO:AUE pp. 162-163; cost x1.5, Battle Value +0.1; one environment only):
                                        <select data-testid="infantry-xct" value={platoon.getXCT() ?? ""} onChange={(e) => { const value = e.currentTarget.value; this.update((p) => { p.setXCT(value); }); }}>
                                            <option value="">Not XCT troops</option>
                                            {INFANTRY_XCT_ENVIRONMENTS.map((item) => <option key={item.tag} value={item.tag}>{item.name}</option>)}
                                        </select>
                                    </label>
                                    {platoon.getXCTEnvironment() ? (
                                        <p className="smaller-text" data-testid="infantry-xct-notes">
                                            {platoon.getXCTEnvironment()?.effect} Needs one of these armor kits (chosen under Infantry Armor above): {platoon.getXCTEnvironment()?.armor.map((tag) => infantryArmor.find((item) => item.tag === tag)?.name ?? tag).join(", ")}.
                                            {platoon.getXCTProblem() ? <span className="color-red"> {platoon.getXCTProblem()}.</span> : null}
                                        </p>
                                    ) : null}
                                </>
                            ) : null}
                            <InfantryAugmentationPanel platoon={platoon} rulesLevel={rulesLevel} update={this.update} />

                            <h3>Field Gear (apocryphal)</h3>
                            <p className="small-text">Maximum Tech p. 40 (Master Rules): a disposable Narc launcher a squad (up to four a platoon, three for jump) and TAG for a platoon with lasers. Later rulebooks dropped them, so they are apocryphal here.</p>
                            {platoon.getFieldGearOptions().map((option) => (
                                <label key={option.tag} className="d-block">
                                    <input
                                        type="checkbox"
                                        data-testid={`infantry-field-gear-${option.tag}`}
                                        disabled={!option.available}
                                        checked={platoon.getFieldGear().includes(option.tag)}
                                        onChange={(e) => {
                                            const on = e.currentTarget.checked;
                                            this.update((p) => { p.setFieldGear([...p.getFieldGear().filter((tag) => tag !== option.tag), ...(on ? [option.tag] : [])]); });
                                        }}
                                    />
                                    &nbsp;{option.name} (+{option.cost.toLocaleString("en-US")} C-bills{option.tag === "inf-field-narc" ? " each" : ""}; apocryphal)
                                </label>
                            ))}

                            <h3>Anti-'Mech Capability and Skills</h3>
                            {!motive.mechanized ? (
                                <label>
                                    <input type="checkbox" checked={platoon.isAntiMechKitChosen()} onChange={(e) => { const value = e.currentTarget.checked; this.update((p) => p.setAntiMechKit(value)); }} />
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
