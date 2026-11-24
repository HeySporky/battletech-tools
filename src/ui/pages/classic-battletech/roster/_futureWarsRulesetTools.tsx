import React, { useState } from "react";
import { BattleMech } from "../../../../classes/battlemech";
import { IEquipmentItem } from "../../../../data/data-interfaces";
import FutureWarsRulesReference from "../../../components/future-wars-rules-reference";
import { getLocationName } from "../../../../utils";
import {
    FW_LONG_RANGE_WARS, FW_LONG_RANGE_WARS_12, FW_MORALE, FW_MORALE_17, FW_OPPORTUNITY_FIRE, FW_STRATEGIC_MOVEMENT, FW_WEAPON_MALFUNCTIONS,
    FW_WEAPON_MALFUNCTIONS_9, getMalfunctionEffect, getMalfunctionTable,
    getMoraleBase, getOpportunityFireToHit, getStrategicMovementHeat, MALFUNCTION_DICE, MORALE_CLASSES, OpportunityFireBand, OpportunityFireTargetMove,
} from "../../../../utils/future-wars-ruleset-tools";
import { NumberBox } from "./_futureWarsPlay";
import { getPowerArmorBuildingRow, getPowerArmorSheetRules, POWER_ARMOR_RULES_CITE } from "../../../../data/future-wars-power-armor";

/**
 * Best of Future Wars (#172), Chunk E: the play-rule rulesets' tools in roster play, one section for each of the five
 * rulesets the 'Mech carries (rosters keep rulesets only as search filters, so each unit's own count). The numbers live
 * in `src/utils/future-wars-ruleset-tools.ts`; to-hit and heat changes reach the Target dialog and the heat phase.
 */

export function showFutureWarsRulesetTools(mech: BattleMech): boolean {
    return mech.getFutureWarsPlayRulesets().length > 0 || mech.usesPowerArmorConstruction();
}

/**
 * Whether the Target dialog offers the Power Armor target flag (+1, Best-of p.14; #172): when any 'Mech in the force
 * is a suit or plays a Best of Future Wars ruleset (NGCFells's: the opposing suit need not be in this force), and always
 * while the flag is ticked, so a +1 left over from a suit that has gone can still be unticked.
 */
export function showPowerArmorTargetFlag(units: BattleMech[], ticked: boolean): boolean {
    return ticked || units.some((unit) => unit.usesPowerArmorConstruction()
        || unit.getRulesets().some((id) => id.startsWith("fw-") || id.startsWith("best-of-future-wars")));
}

interface IFutureWarsRulesetToolsProps {
    mech: BattleMech;
    onChange: (mech: BattleMech) => void;
}

const isWeapon = (item: IEquipmentItem): boolean => !item.isAmmo && !item.tag.startsWith("ammo-") && !!item.range && item.range.long > 0;
const label = (item: IEquipmentItem): string => item.location ? `${item.name} (${getLocationName(item.location, false)})` : item.name;
const signed = (value: number): string => (value > 0 ? "+" : "") + value;
const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const FutureWarsRulesetTools = (props: IFutureWarsRulesetToolsProps) => {
    const { mech } = props;
    const [, setTick] = useState(0);
    const [rolls, setRolls] = useState<Record<string, number>>({});
    const [choices, setChoices] = useState<Record<string, string>>({});
    const [results, setResults] = useState<Record<string, string>>({});
    const changed = () => { setTick((tick) => tick + 1); props.onChange(mech); };
    const roll = (key: string, fallback: number) => rolls[key] ?? fallback;
    const setRoll = (key: string, value: number) => setRolls((previous) => ({ ...previous, [key]: value }));
    const choice = (key: string, fallback: string) => choices[key] ?? fallback;
    const setChoice = (key: string, value: string) => setChoices((previous) => ({ ...previous, [key]: value }));
    const play = mech.futureWarsPlay;
    const weapons = mech.equipmentList.filter(isWeapon);
    const gunnery = mech.getPilot()?.gunnery ?? 4;

    const strategicMovement = () => {
        const mp = mech.getStrategicMovementMP();
        const move = play.strategicMovement;
        return (
            <div>
                <div data-testid="fw-strategic-mp">Strategic Movement MP: Walk {mp.walk}, run {mp.run} (more than four map sheets only).</div>
                <label className="small-text">
                    This turn{" "}
                    <select data-testid="fw-strategic-mode" value={move?.mode ?? ""}
                        onChange={(e) => {
                            const mode = e.currentTarget.value as "w" | "r" | "";
                            mech.setStrategicMovement(mode || null, mode ? (move?.mp ?? mp[mode === "w" ? "walk" : "run"]) : 0);
                            changed();
                        }}>
                        <option value="">Not used</option>
                        <option value="w">Walking</option>
                        <option value="r">Running</option>
                    </select>
                </label>{" "}
                {move ? (
                    <>
                        <NumberBox testId="fw-strategic-hexes" label="MP used" min={0} max={mp[move.mode === "w" ? "walk" : "run"]} value={move.mp}
                            onChange={(value) => { mech.setStrategicMovement(move.mode, value); changed(); }} />
                        <div data-testid="fw-strategic-heat">
                            {getStrategicMovementHeat(move.mode, move.mp, mech.getWalkSpeed(), mech.getRunSpeed())} heat in place of the movement heat (2, plus {move.mode === "w" ? "1" : "2"} a MP beyond the normal {move.mode === "w" ? "walk" : "run"}).
                        </div>
                    </>
                ) : null}
                <div>No firing and no physical attacks; no target movement modifier for it; 2 MP a hexside turned, with a Piloting Skill Roll each; it stops the moment it is attacked; it needs a full turn before with no fire by it or at it.</div>
            </div>
        );
    };

    const opportunityFire = () => {
        const eligible = weapons.filter((item) => item.category !== "Missile Weapons" && getMalfunctionTable(item) !== "missile");
        const weaponUuid = choice("opp-weapon", eligible[0]?.uuid ?? "");
        const band = choice("opp-band", "short") as OpportunityFireBand;
        const targetMove = choice("opp-target", "walked") as OpportunityFireTargetMove;
        const firerMoved = choice("opp-moved", mech.currentMovementMode !== "n" ? "yes" : "") === "yes";
        const toHit = getOpportunityFireToHit({ gunnery, band, targetMove, firerMoved, other: roll("opp-other", 0) });
        const taken = weapons.find((item) => item.uuid === play.opportunityShot);
        return (
            <div>
                <div>
                    <select data-testid="fw-opportunity-weapon" value={weaponUuid} onChange={(e) => setChoice("opp-weapon", e.currentTarget.value)}>
                        {eligible.map((item) => <option key={item.uuid} value={item.uuid}>{label(item)}</option>)}
                    </select>{" "}
                    <select data-testid="fw-opportunity-band" value={band} onChange={(e) => setChoice("opp-band", e.currentTarget.value)}>
                        <option value="short">Short</option>
                        <option value="medium">Medium</option>
                        <option value="long">Long</option>
                    </select>{" "}
                    <select data-testid="fw-opportunity-target" value={targetMove} onChange={(e) => setChoice("opp-target", e.currentTarget.value)}>
                        <option value="walked">Target walking</option>
                        <option value="ran">Target running</option>
                        <option value="jumped">Target jumping</option>
                    </select>{" "}
                    <label className="small-text">
                        <input type="checkbox" data-testid="fw-opportunity-moved" checked={firerMoved} onChange={(e) => setChoice("opp-moved", e.currentTarget.checked ? "yes" : "no")} /> Firer moved (+2)
                    </label>{" "}
                    <NumberBox testId="fw-opportunity-other" label="Terrain and other" min={-10} max={20} value={roll("opp-other", 0)} onChange={(value) => setRoll("opp-other", value)} />
                </div>
                <div data-testid="fw-opportunity-to-hit">To hit: {toHit}+ (Gunnery {gunnery}; one non-missile weapon, claimed the moment the target crosses the line of sight).</div>
                {taken ? (
                    <div data-testid="fw-opportunity-taken">
                        Opportunity shot taken with {label(taken)}: the other weapons are +1 in the Weapon Attack Phase this turn.{" "}
                        <button className="btn btn-sm btn-secondary" data-testid="fw-opportunity-undo" onClick={() => { mech.recordOpportunityShot(null); changed(); }}>Undo</button>
                    </div>
                ) : (
                    <button className="btn btn-sm btn-primary" data-testid="fw-opportunity-fire" disabled={!weaponUuid}
                        onClick={() => { mech.recordOpportunityShot(weaponUuid); changed(); }}>
                        Take the opportunity shot
                    </button>
                )}
            </div>
        );
    };

    const morale = () => {
        const classIndex = mech.getMoraleClassIndex();
        const state = play.morale;
        const status = state?.status;
        const original = mech.getFutureWarsPrinting("morale") === "original";
        const statusText = (current: NonNullable<typeof status>): string => current.untilOffBoard
            ? `${capitalize(current.kind)} (result ${current.label}): until it is off the board`
            : `${capitalize(current.kind)} (result ${current.label}): ${current.pending ? `this turn, then ${current.turnsLeft}` : current.turnsLeft} turn${current.turnsLeft === 1 ? "" : "s"} more`;
        return (
            <div>
                <label className="small-text">
                    Morale class{" "}
                    <select data-testid="fw-morale-class" value={classIndex} onChange={(e) => { mech.setMoraleClassIndex(Number(e.currentTarget.value)); changed(); }}>
                        {MORALE_CLASSES.map((name, index) => <option key={name} value={index}>{name} ({getMoraleBase(index)}+{original ? "; shaken: +1 / +2 / +3" : ""})</option>)}
                    </select>
                </label>{" "}
                <span className="small-text" data-testid="fw-morale-need">
                    Passes on {getMoraleBase(classIndex, status?.kind, original ? "original" : "best-of")}+ on 2D6{original && status ? ` (${status.kind})` : ""}
                </span>
                <div data-testid="fw-morale-status" className={status || mech.isMoraleSurrendered() ? "color-red" : ""}>
                    {mech.isMoraleSurrendered() ? "Surrendered: a second rout." : status
                        ? statusText(status)
                            + (status.fire === "none" ? "; no firing" : status.fire ? `; ${signed(status.fire)} to fire (in the to-hit)` : "") + "."
                        : "Steady."}
                    {state?.laterRollModifier ? ` ${signed(state.laterRollModifier)} on later results rolls.` : ""}
                </div>
                {status ? (
                    <button className="btn btn-sm btn-secondary" data-testid="fw-morale-clear" title="A check rolled by mistake, or a routed unit that has left the board"
                        onClick={() => { mech.clearMoraleStatus(); changed(); }}>Clear status</button>
                ) : null}
                <div>Check when: a head hit; each hit doing internal damage; {original ? "once three locations have internal damage, every hit" : "three or more locations damaged"}; hit while shaken; a friend within 10 hexes and in sight routs; each failed Piloting Skill Roll; set on fire.</div>
                <div>
                    <NumberBox testId="fw-morale-check" label="Check 2D6" min={2} max={12} value={roll("morale-check", 7)} onChange={(value) => setRoll("morale-check", value)} />{" "}
                    <NumberBox testId="fw-morale-result" label="If failed, 2D6" min={2} max={12} value={roll("morale-result", 7)} onChange={(value) => setRoll("morale-result", value)} />{" "}
                    <NumberBox testId="fw-morale-other" label="Other modifiers" min={-30} max={30} value={roll("morale-other", 0)} onChange={(value) => setRoll("morale-other", value)} />{" "}
                    <span className="small-text">(class, status and earlier results: {signed(mech.getMoraleModifier())}, added for you)</span>{" "}
                    <button className="btn btn-sm btn-primary" data-testid="fw-morale-roll"
                        onClick={() => { mech.rollMorale(roll("morale-check", 7), roll("morale-result", 7), roll("morale-other", 0)); changed(); }}>
                        Check morale
                    </button>
                </div>
                {state?.last ? <div data-testid="fw-morale-last">Last check: {state.last}</div> : null}
            </div>
        );
    };

    const malfunctions = () => (
        <div>
            <div>On a to-hit roll of 2 the shot misses; roll on the weapon&apos;s table.</div>
            {weapons.map((item, index) => {
                const uuid = item.uuid ?? `weapon-${index}`;
                const table = getMalfunctionTable(item);
                if (!table) return <div key={uuid}>{label(item)}: no table (a 2 is only a miss).</div>;
                const dice = MALFUNCTION_DICE[table];
                const recorded = play.malfunctions?.[uuid] ?? [];
                return (
                    <div key={uuid} style={{ marginBottom: "0.25em" }}>
                        <strong>{label(item)}</strong>{" "}
                        <NumberBox testId={`fw-malfunction-roll-${uuid}`} label={dice.label} min={dice.min} max={dice.max} value={roll(`malf-${uuid}`, dice.min)} onChange={(value) => setRoll(`malf-${uuid}`, value)} />{" "}
                        <button className="btn btn-sm btn-primary" data-testid={`fw-malfunction-record-${uuid}`}
                            onClick={() => {
                                const effect = mech.recordWeaponMalfunction(uuid, roll(`malf-${uuid}`, dice.min));
                                setResults((previous) => ({ ...previous, [uuid]: effect ? `${roll(`malf-${uuid}`, dice.min)}: ${effect.text}` : "" }));
                                changed();
                            }}>
                            Roll on the table
                        </button>
                        {results[uuid] ? <div data-testid={`fw-malfunction-result-${uuid}`}>{results[uuid]}</div> : null}
                        {recorded.length ? (
                            <ul data-testid={`fw-malfunction-list-${uuid}`} className="small-text" style={{ marginBottom: 0 }}>
                                {recorded.map((value, at) => {
                                    const effect = getMalfunctionEffect(table, value, mech.getFutureWarsPrinting("malfunctions"));
                                    const applied = effect.out ? " (cannot fire: applied)" : effect.toHit || effect.heat ? " (applied)" : "";
                                    return (
                                        <li key={at} className={effect.out ? "color-red" : ""}>
                                            {value}: {effect.text}{applied}{" "}
                                            <button className="btn btn-sm btn-secondary" data-testid={`fw-malfunction-clear-${uuid}-${at}`}
                                                onClick={() => { mech.clearWeaponMalfunction(uuid, at); changed(); }}>
                                                {effect.clearable ? "Cleared" : "Repaired"}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );

    const longRangeWars = () => {
        const ranging = play.ranging ?? 0;
        return (
            <div>
                <NumberBox testId="fw-ranging" label="Ranging: turns in a row at the same target" min={0} max={20} value={ranging}
                    onChange={(value) => { if (value) play.ranging = value; else delete play.ranging; changed(); }} />
                <div>Before movement: firer walked / ran / jumped +2 / +3 / +5; target moved 7-9 / 10+ hexes +4 / +5 (the Target dialog applies them).</div>
                {weapons.map((item, index) => {
                    const long = item.range!.long;
                    return (
                        <div key={item.uuid ?? index} data-testid={`fw-long-range-${item.uuid ?? index}`}>
                            {label(item)}: Extended {long + 1}-{long * 2}: {gunnery + 6 - ranging}+, extreme {long * 2 + 1}-{long * 4}: {gunnery + 9 - ranging}+
                        </div>
                    );
                })}
            </div>
        );
    };

    // Power Armor (Power Armor plan Chunk C): the app has no 'Mech physical attacks or hexes, so those rules are shown
    // as text; the +1 to hit goes through the attacker's Target dialog, pilot criticals and explosions through the
    // critical hit log, and the exit turn is tracked here.
    const powerArmor = () => {
        const tons = mech.getTonnage();
        const exit = mech.getPowerArmorExit();
        const pilotModifier = mech.getPowerArmorPilotingModifier();
        return (
            <div data-testid="fw-tool-power-armor" className="small-text" style={{ marginBottom: "0.75em" }}>
                <strong>Power Armor</strong>
                <div>+1 to hit this suit: tick Power Armor in the attacker&apos;s Target dialog.</div>
                {pilotModifier ? <div data-testid="pa-pilot">{`No gyro, Piloting 4: +${pilotModifier} to every Piloting Skill Roll.`}</div> : null}
                <div data-testid="pa-building">
                    {`Buildings (${tons} tons): `
                        + getPowerArmorBuildingRow(tons).map((cell) => `${cell.building} ${cell.mp} MP, +${cell.pilot}`).join("; ")
                        + " to the Piloting Skill Roll."}
                </div>
                <ul style={{ marginBottom: "0.25em" }}>
                    {getPowerArmorSheetRules(tons).slice(1).map((rule) => <li key={rule}>{rule}</li>)}
                </ul>
                <div data-testid="pa-exit-state" className={exit ? "color-red" : ""}>
                    {exit === "out" ? "The pilot has left the suit."
                        : exit === "unlatching" ? "Unlatching the front plate: no moving or firing this turn; a center torso hit is 1D3 hits to the pilot. Out in the End Phase."
                            : "The pilot is in the suit."}{" "}
                    {exit ? (
                        <button className="btn btn-sm btn-secondary" data-testid="pa-exit-cancel" onClick={() => { mech.cancelPowerArmorExit(); changed(); }}>
                            {exit === "out" ? "Back in" : "Call it off"}
                        </button>
                    ) : (
                        <button className="btn btn-sm btn-primary" data-testid="pa-exit" onClick={() => { mech.startPowerArmorExit(); changed(); }}>
                            Unlatch the front plate
                        </button>
                    )}
                </div>
                <div className="text-muted">{POWER_ARMOR_RULES_CITE}.</div>
            </div>
        );
    };

    const sections: Record<string, { title: string; body: () => React.ReactElement }> = {
        [FW_STRATEGIC_MOVEMENT]: { title: "Strategic Movement", body: strategicMovement },
        [FW_OPPORTUNITY_FIRE]: { title: "Opportunity Fire", body: opportunityFire },
        [FW_MORALE]: { title: "Morale", body: morale },
        [FW_WEAPON_MALFUNCTIONS]: { title: "Weapon Malfunctions", body: malfunctions },
        [FW_LONG_RANGE_WARS]: { title: "The Long Range Wars", body: longRangeWars },
        // The original printings (#172, printing alternates): the same tools, reading the original's tables.
        [FW_MORALE_17]: { title: "Morale (FW #17 printing)", body: morale },
        [FW_WEAPON_MALFUNCTIONS_9]: { title: "Weapon Malfunctions (FW #9 printing)", body: malfunctions },
        [FW_LONG_RANGE_WARS_12]: { title: "The Long Range Wars (FW #12 printing)", body: longRangeWars },
    };

    return (
        <fieldset className="fieldset" data-testid="fw-ruleset-tools">
            <legend>Future Wars Rules</legend>
            {mech.usesPowerArmorConstruction() ? powerArmor() : null}
            {mech.getFutureWarsPlayRulesets().map((id) => (
                <div key={id} data-testid={`fw-tool-${id}`} className="small-text" style={{ marginBottom: "0.75em" }}>
                    <strong>{sections[id].title}</strong>
                    {sections[id].body()}
                    <FutureWarsRulesReference rulesetId={id} />
                </div>
            ))}
        </fieldset>
    );
};

export default FutureWarsRulesetTools;
