import React, { type JSX } from "react";
import AlphaStrikeForce from "../../../../classes/alpha-strike-force";
import { AlphaStrikeUnit } from "../../../../classes/alpha-strike-unit";
import { getAlphaStrikeEWarRules } from "../../../../data/rules-editions";
import { describeASMunition, getASMunition } from "../../../../data/alpha-strike-munitions";
import {
    ASEcmMode, IASC3Network, IASEWarBoard, IASEWarTarget, applyASTaserHit, applyASTsempHit, getASTaserEffect, isASBlueSaviourOn, layASSmoke, resolveASStun, rollASBlueSaviourFailure, toggleASBlueSaviour, triggerASPowerBooster, fireASChaffPod, fireASTsemp, getASDefenseLines, getASEWarSpecials,
    getASEWarStatus, getASEWarToHit, getASIncomingDamage, getASMhqRating, getASTsempEffect, hasASSpecial, syncASChaffClouds, validateASC3Network,
} from "../../../../utils/alpha-strike-ewar-play";

/**
 * The Alpha Strike in-play E-War block for each card and the force's board panel (#642 Phase 5). The SVG card is not
 * changed: this view works the declared coverage, networks and ticks through `utils/alpha-strike-ewar-play.ts` and shows
 * the modified numbers beside the card's own. Every modifier line names its book and page.
 */

const unitLabel = (unit: AlphaStrikeUnit, index: number): string => `${[unit.name, unit.variant].filter(Boolean).join(" ") || "Unit"} (#${index + 1})`;

const EWAR_CODES_FOR_BLOCK = ["ECM", "LECM", "AECM", "WAT", "AMS", "RAMS", "PRB", "LPRB", "BH", "DRO", "RSD", "TAG", "LTAG", "SNARC", "CNARC", "INARC",
    "C3M", "C3S", "C3BSM", "C3BSS", "C3EM", "C3I", "C3RS", "NC3", "NOVA", "STL", "MAS", "LMAS", "JAM", "TSEMP", "DJ", "HJ", "CHF", "SNC",
    "MTAS", "ITAS", "BSF", "PBR", "PBJ", "SMKT", "SMKB", "PSC"];

/** Whether the board panel is worth showing: a unit with ECM, MHQ 7+, C3, NC3, drones or chaff. */
const BOARD_CODES = ["ECM", "AECM", "LECM", "WAT", "NOVA", "C3M", "C3S", "C3BSM", "C3BSS", "C3EM", "C3I", "NC3", "DRO", "CHF"];

function useRedraw(): () => void {
    const [, setTick] = React.useState(0);
    return React.useCallback(() => setTick((value) => value + 1), []);
}

interface IBlockProps {
    unit: AlphaStrikeUnit;
    force: AlphaStrikeForce;
    onChange: () => void;
}

/** Whether the unit has anything for the block to show. */
function unitHasEWar(unit: AlphaStrikeUnit, force: AlphaStrikeForce): boolean {
    if (getASEWarSpecials(unit.abilities, unit.rulesLevel).some((entry) => EWAR_CODES_FOR_BLOCK.includes(entry.code))) return true;
    if (getASMhqRating(unit.abilities) >= 7) return true;
    if ((unit.ewarPlay.narcs?.length ?? 0) > 0 || (unit.ewarPlay.jammed?.length ?? 0) > 0) return true;
    if (unit.munition) return true;
    const board = force.ewarBoard;
    return !!board.friendlyEcm?.[unit.uuid]
        || Object.values(board.friendlyEcm ?? {}).some((uuids) => uuids.includes(unit.uuid))
        || !!board.droneControl?.[unit.uuid]
        || (board.c3Networks ?? []).some((network) => network.members.includes(unit.uuid) || network.master === unit.uuid);
}

const MODES: ASEcmMode[] = ["ecm", "eccm"];

export function ASEWarBlock({ unit, force, onChange }: IBlockProps): JSX.Element | null {
    const redraw = useRedraw();
    const [missileAttack, setMissileAttack] = React.useState(false);
    const [front, setFront] = React.useState(true);
    const [ramsFromUuid, setRamsFromUuid] = React.useState("");
    const [tsempRoll, setTsempRoll] = React.useState(7);
    const [stunRoll, setStunRoll] = React.useState(7);
    const [lastHit, setLastHit] = React.useState<string[]>([]);
    // Our specials (#647): the roll boxes, and the kind of the incoming attack.
    const [specialRoll, setSpecialRoll] = React.useState(7);
    const [taserKind, setTaserKind] = React.useState<"MTAS" | "ITAS">("MTAS");
    const [moved, setMoved] = React.useState(false);
    const [attackKind, setAttackKind] = React.useState<"missile" | "energy" | "other">("missile");
    const [nuclear, setNuclear] = React.useState(false);
    const [opened, setOpened] = React.useState(false);
    // A unit with no E-War gear can still be Narced, TSEMP'd, jammed or shot at: its block opens on request only.
    if (!unitHasEWar(unit, force) && !opened) {
        return <button type="button" className="as-ewar-open" onClick={() => setOpened(true)}>E-War</button>;
    }

    const edition = force.rulesEdition;
    const units = force.getEWarUnits();
    const state = unit.ewarPlay;
    const specials = getASEWarSpecials(unit.abilities, unit.rulesLevel);
    const has = (code: string) => specials.some((entry) => entry.code === code);
    const rules = getAlphaStrikeEWarRules(edition);
    const mutate = (change: () => void) => { change(); onChange(); redraw(); };
    const status = getASEWarStatus(unit, force.ewarBoard, units, edition);
    const defenseLines = getASDefenseLines(unit, edition);
    const toHit = getASEWarToHit(unit, { hj: status.hj, nc3Up: status.nc3Up }, edition, missileAttack);
    const mhq = getASMhqRating(unit.abilities);
    const munitionRow = getASMunition(unit.munition, unit.rulesLevel ?? 0);
    const inNetwork = (force.ewarBoard.c3Networks ?? []).some((network) => network.members.includes(unit.uuid));
    const friendsWithRams = units.filter((other) => other.uuid !== unit.uuid && hasASSpecial(other, "RAMS") && !other.isWrecked());
    const setTarget = (change: Partial<IASEWarTarget>) => mutate(() => {
        const target: IASEWarTarget = { ...(state.target ?? {}), ...change };
        for (const key of Object.keys(target) as (keyof IASEWarTarget)[]) if (!target[key]) delete target[key];
        if (Object.keys(target).length === 0) delete state.target; else state.target = target;
    });
    const card = [unit.currentToHitShort, unit.currentToHitMedium, unit.currentToHitLong, unit.currentToHitExtreme];
    const mods = [toHit.short, toHit.medium, toHit.long, toHit.extreme];
    const brackets = ["Short", "Medium", "Long", "Extreme"];

    const missileHit = (points: number) => mutate(() => {
        const ramsFrom = units.find((other) => other.uuid === ramsFromUuid);
        const result = getASIncomingDamage(unit, points, { missile: attackKind === "missile", energy: attackKind === "energy", nuclear, front, ramsFrom }, status.inFriendlyEcm, edition);
        unit.takeDamage(result.damage);
        if (result.spendsRams === "self") state.ramsUse = "self";
        if ((result.spendsRams === "friend" || result.spendsFriendRams) && ramsFrom) ramsFrom.ewarPlay.ramsUse = "friend";
        setLastHit([`${points} ${attackKind === "missile" ? "missile" : attackKind} damage becomes ${result.damage}`, ...result.lines]);
    });

    return (
        <div className="text-section lr-margin as-ewar-block" data-testid="as-ewar-block">
            <h3>E-War</h3>
            <div className="section-content">
                {status.lines.length + defenseLines.length + (munitionRow ? 1 : 0) > 0 ? (
                    <ul className="as-ewar-lines">
                        {[...status.lines, ...defenseLines, ...(munitionRow ? [describeASMunition(munitionRow, unit.abilities)] : [])].map((line, index) => <li key={index}>{line}</li>)}
                    </ul>
                ) : null}

                {(has("ECM") || has("WAT") || has("NOVA")) ? (
                    <label>ECM mode{" "}
                        <select aria-label="ECM mode" value={state.ecmMode ?? "ecm"} onChange={(e) => mutate(() => { state.ecmMode = e.target.value as ASEcmMode; })}>
                            {MODES.map((mode) => <option key={mode} value={mode}>{mode.toUpperCase()}</option>)}
                        </select>
                    </label>
                ) : null}
                {has("AECM") ? [0, 1].map((field) => (
                    <label key={field}> Angel field {field + 1}{" "}
                        <select aria-label={`Angel field ${field + 1}`} value={(state.angelModes ?? ["ecm", "ecm"])[field]}
                            onChange={(e) => mutate(() => {
                                const next: [ASEcmMode, ASEcmMode] = [...(state.angelModes ?? ["ecm", "ecm"])] as [ASEcmMode, ASEcmMode];
                                next[field] = e.target.value as ASEcmMode;
                                state.angelModes = next;
                            })}>
                            {MODES.map((mode) => <option key={mode} value={mode}>{mode.toUpperCase()}</option>)}
                        </select>
                    </label>
                )) : null}
                {mhq >= 7 ? (
                    <label> MHQ {mhq} stands in for a field{" "}
                        <select aria-label="MHQ field" value={state.mhqField ?? ""} onChange={(e) => mutate(() => { if (e.target.value) state.mhqField = e.target.value as ASEcmMode; else delete state.mhqField; })}>
                            <option value="">off</option>
                            {MODES.map((mode) => <option key={mode} value={mode}>{mode.toUpperCase()}</option>)}
                        </select>
                    </label>
                ) : null}
                {has("STL") && rules?.stealthJamsOwnEcm ? (
                    <label> <input type="checkbox" aria-label="STL on" checked={!state.stealthOff} onChange={(e) => mutate(() => { if (e.target.checked) delete state.stealthOff; else state.stealthOff = true; })} /> STL on (End Phase)</label>
                ) : null}
                {has("MAS") || has("LMAS") ? (
                    <label> <input type="checkbox" aria-label="Stood still this turn" checked={!!state.stoodStill} onChange={(e) => mutate(() => { if (e.target.checked) state.stoodStill = true; else delete state.stoodStill; })} /> Stood still this turn</label>
                ) : null}

                <fieldset>
                    <legend>Hostile electronics over this unit</legend>
                    <label>Hostile ECM suites{" "}
                        <input type="number" min={0} aria-label="Hostile ECM suites" value={state.hostileEcm ?? 0} onChange={(e) => mutate(() => { state.hostileEcm = Math.max(0, Number(e.target.value) || 0); })} />
                    </label>
                    <label> Hostile ECCM suites{" "}
                        <input type="number" min={0} aria-label="Hostile ECCM suites" value={state.hostileEccm ?? 0} onChange={(e) => mutate(() => { state.hostileEccm = Math.max(0, Number(e.target.value) || 0); })} />
                    </label>
                    <label> <input type="checkbox" aria-label="Hostile Angel" checked={!!state.hostileAngel} onChange={(e) => mutate(() => { state.hostileAngel = e.target.checked; })} /> Hostile Angel (both fields ECM)</label>
                    <label> <input type="checkbox" aria-label="Hostile NOVA" checked={!!state.hostileNova} onChange={(e) => mutate(() => { state.hostileNova = e.target.checked; })} /> Hostile NOVA</label>
                    {has("DRO") ? (
                        <label> <input type="checkbox" aria-label="Line to the controller crosses an ECM bubble" checked={!!state.droneLineBlocked} onChange={(e) => mutate(() => { if (e.target.checked) state.droneLineBlocked = true; else delete state.droneLineBlocked; })} /> Line to the controller crosses an ECM bubble</label>
                    ) : null}
                    {inNetwork ? (
                        <label> <input type="checkbox" aria-label="Line to the master crosses hostile ECM" checked={!!state.c3LineBlocked} onChange={(e) => mutate(() => { state.c3LineBlocked = e.target.checked; })} /> Line to the master crosses hostile ECM</label>
                    ) : null}
                </fieldset>

                <div className="as-ewar-narcs">
                    Narc beacons attached: {(state.narcs ?? []).length === 0 ? "none" : (state.narcs ?? []).map((kind, index) => (
                        <button key={index} type="button" title="Remove this beacon" onClick={() => mutate(() => { state.narcs = (state.narcs ?? []).filter((_, at) => at !== index); if (state.narcs.length === 0) delete state.narcs; })}>{kind} ✕</button>
                    ))}
                    {(["SNARC", "CNARC", "INARC"] as const).map((kind) => (
                        <button key={kind} type="button" onClick={() => mutate(() => { state.narcs = [...(state.narcs ?? []), kind]; })}>Attach {kind}</button>
                    ))}
                </div>

                <div className="as-ewar-jams">
                    {(["DJ", "HJ"] as const).flatMap((kind) => {
                        // The jammers running now, strongest first (most turns left); the board holds no distances, so the player picks the closest.
                        const running = units.filter((other) => other.uuid !== unit.uuid && (other.ewarPlay.jammerTurnsLeft ?? 0) > 0 && hasASSpecial(other, kind))
                            .sort((a, b) => (b.ewarPlay.jammerTurnsLeft ?? 0) - (a.ewarPlay.jammerTurnsLeft ?? 0));
                        const jamBy = (from?: string, turns = 5) => mutate(() => { state.jammed = [...(state.jammed ?? []).filter((jam) => jam.kind !== kind), { kind, turnsLeft: turns, from }]; });
                        if (running.length === 0) return [<button key={kind} type="button" onClick={() => jamBy()}>Jammed by {kind} (5 turns)</button>];
                        return running.map((jammer) => (
                            <button key={`${kind}-${jammer.uuid}`} type="button" onClick={() => jamBy(jammer.uuid, Math.min(5, jammer.ewarPlay.jammerTurnsLeft ?? 5))}>
                                Jammed by {kind} of {jammer.customName || jammer.name} ({jammer.ewarPlay.jammerTurnsLeft} turns left)
                            </button>
                        ));
                    })}
                    {(["DJ", "HJ"] as const).filter((kind) => has(kind) && !state.jammerSpent && !state.jammerTurnsLeft).map((kind) => (
                        <button key={kind} type="button" onClick={() => mutate(() => { state.jammerTurnsLeft = 5; })}>Activate my {kind}</button>
                    ))}
                </div>

                {has("RAMS") ? (
                    <label>RAMS this turn{" "}
                        <select aria-label="RAMS use" value={state.ramsUse ?? ""} onChange={(e) => mutate(() => { if (e.target.value) state.ramsUse = e.target.value as "self" | "friend"; else delete state.ramsUse; })}>
                            <option value="">not used</option>
                            <option value="self">for itself</option>
                            <option value="friend">for a friend</option>
                        </select>
                    </label>
                ) : null}
                {has("RSD") ? (
                    <button type="button" onClick={() => mutate(() => { state.rsdUsed = (state.rsdUsed ?? 0) + 1; })}>Dispense a remote sensor</button>
                ) : null}
                {has("C3RS") ? (
                    <button type="button" onClick={() => mutate(() => { state.c3rsUsed = (state.c3rsUsed ?? 0) + 1; })}>Fire a C3 remote sensor</button>
                ) : null}
                {has("CHF") ? (
                    <button type="button" onClick={() => mutate(() => { fireASChaffPod(unit); })}>Fire a chaff pod</button>
                ) : null}
                {has("TSEMP") ? (
                    <button type="button" onClick={() => mutate(() => { fireASTsemp(unit); })}>Fire TSEMP</button>
                ) : null}
                {rules?.specials.TSEMP ? (
                    <span>
                        <label> Hit by TSEMP, effect roll{" "}
                            <input type="number" min={2} max={12} aria-label="TSEMP effect roll" value={tsempRoll} onChange={(e) => setTsempRoll(Number(e.target.value) || 7)} />
                        </label>
                        <button type="button" onClick={() => mutate(() => { applyASTsempHit(unit, getASTsempEffect(unit.type, unit.abilities, tsempRoll)); })}>Apply TSEMP hit</button>
                    </span>
                ) : null}

                {has("BSF") ? (
                    <span data-testid="as-bsf">
                        <label> <input type="checkbox" aria-label="Blue Saviour on" checked={isASBlueSaviourOn(unit)} disabled={!!state.bsfDead} onChange={(e) => mutate(() => { toggleASBlueSaviour(unit, e.target.checked); })} /> Blue Saviour on (End Phase; ours){state.bsfDead ? ", dead for the scenario" : ""}</label>
                        {isASBlueSaviourOn(unit) ? (
                            <button type="button" onClick={() => mutate(() => { setLastHit([rollASBlueSaviourFailure(unit, specialRoll) ? "Blue Saviour failed: dead for the scenario (BSF, ours)" : "Blue Saviour holds (BSF, ours)"]); })}>Blue Saviour failure roll</button>
                        ) : null}
                    </span>
                ) : null}
                {has("PBR") || has("PBJ") || has("MTAS") || has("ITAS") || has("BSF") ? (
                    <label> Roll (2D6){" "}
                        <input type="number" min={2} max={12} aria-label="Special roll" value={specialRoll} onChange={(e) => setSpecialRoll(Number(e.target.value) || 7)} />
                    </label>
                ) : null}
                {(["PBR", "PBJ"] as const).filter((code) => has(code)).map((code) => (
                    <button key={code} type="button" onClick={() => mutate(() => { setLastHit([triggerASPowerBooster(unit, code, specialRoll).line]); })}>Use {code} (ours)</button>
                ))}
                <span data-testid="as-taser-hit">
                    <label> Taser type{" "}
                        <select aria-label="Taser type" value={taserKind} onChange={(e) => setTaserKind(e.target.value as "MTAS" | "ITAS")}>
                            <option value="MTAS">BattleMech Taser (MTAS)</option>
                            <option value="ITAS">Improved Taser (ITAS, ours)</option>
                        </select>
                    </label>
                    <button type="button" onClick={() => mutate(() => { const effect = getASTaserEffect(taserKind, unit.type, unit.abilities, specialRoll); applyASTaserHit(unit, effect, taserKind); if (effect === "infantry-damage") unit.takeDamage(1); setLastHit([`Hit by a ${taserKind === "ITAS" ? "Improved " : ""}Taser: ${effect === "infantry-damage" ? "1 damage" : effect}`]); })}>Hit by a Taser (roll above)</button>
                </span>
                {has("SMKT") ? <button type="button" onClick={() => mutate(() => { layASSmoke(unit, "SMKT", true); })}>Lay a smoke trail (ours)</button> : null}
                {has("SMKB") ? (
                    <span>
                        <label> <input type="checkbox" aria-label="Moved this turn" checked={moved} onChange={(e) => setMoved(e.target.checked)} /> Moved this turn</label>
                        <button type="button" onClick={() => mutate(() => { setLastHit([layASSmoke(unit, "SMKB", moved) ? "Smoke screen laid (SMKB, ours)" : "No smoke: the unit moved, or the dispenser is empty"]); })}>Lay a smoke screen (ours)</button>
                    </span>
                ) : null}
                {has("SNC") ? <span className="small-text"> Sonic projector (ours): Deter, CI stun and rout only; Thin atmosphere or denser.</span> : null}
                {state.fellBack ? <p data-testid="as-fell-back">Fell back (ours): must move away from the firer and cannot attack, {state.fellBack.turnsLeft} turn(s) left</p> : null}
                {unit.isInfantry && (force.getEWarUnits().some((each) => (each.rulesLevel ?? 0) >= 6) || state.fellBack) ? (
                <span data-testid="as-stun-hit">
                    <label> Hit by a stun (sonic projector), 2D6{" "}
                        <input type="number" min={2} max={12} aria-label="Stun roll" value={stunRoll} onChange={(e) => setStunRoll(Number(e.target.value) || 7)} />
                    </label>
                    <button type="button" onClick={() => mutate(() => { setLastHit([resolveASStun(unit, stunRoll).line]); })}>Apply stun hit</button>
                </span>
                ) : null}

                <fieldset>
                    <legend>This turn&apos;s target (when this unit attacks)</legend>
                    <label>Stealth{" "}
                        <select aria-label="Target stealth" value={state.target?.stealth ?? ""} onChange={(e) => setTarget({ stealth: (e.target.value || undefined) as IASEWarTarget["stealth"] })}>
                            <option value="">none</option>
                            <option value="unit">STL unit</option>
                            <option value="battle-armor">STL battle armor</option>
                            <option value="infantry">STL infantry</option>
                        </select>
                    </label>
                    <label> Mimetic, stood still{" "}
                        <select aria-label="Target mimetic" value={state.target?.mimetic ?? ""} onChange={(e) => setTarget({ mimetic: (Number(e.target.value) || undefined) as IASEWarTarget["mimetic"] })}>
                            <option value="">none</option>
                            <option value="3">MAS +3</option>
                            <option value="2">LMAS +2</option>
                        </select>
                    </label>
                    <label> <input type="checkbox" aria-label="Target TAG'd" checked={!!state.target?.tagged} onChange={(e) => setTarget({ tagged: e.target.checked })} /> TAG&apos;d</label>
                    <label> <input type="checkbox" aria-label="Missile attack" checked={missileAttack} onChange={(e) => setMissileAttack(e.target.checked)} /> Missile attack (IATM, LRM, SRM, Narc)</label>
                    <table className="as-ewar-tohit" aria-label="Modified to-hit">
                        <thead><tr>{brackets.map((name) => <th key={name}>{name}</th>)}</tr></thead>
                        <tbody>
                            <tr>{card.map((value, index) => (
                                <td key={index}>{value}{mods[index] !== 0 ? <> {"→"} <strong>{value + mods[index]}</strong> ({mods[index] > 0 ? "+" : ""}{mods[index]})</> : null}</td>
                            ))}</tr>
                        </tbody>
                    </table>
                    {toHit.labels.length > 0 ? <ul>{toHit.labels.map((label, index) => <li key={index}>{label}</li>)}</ul> : null}
                </fieldset>

                <fieldset>
                    <legend>Missile hit on this unit</legend>
                    <label><input type="checkbox" aria-label="Front arc" checked={front} onChange={(e) => setFront(e.target.checked)} /> Front arc</label>
                    <label> Kind of attack{" "}
                        <select aria-label="Incoming attack kind" value={attackKind} onChange={(e) => setAttackKind(e.target.value as "missile" | "energy" | "other")}>
                            <option value="missile">Missile (IF, LRM, SRM)</option>
                            <option value="energy">Energy</option>
                            <option value="other">Other</option>
                        </select>
                    </label>
                    <label> <input type="checkbox" aria-label="Nuclear attack" checked={nuclear} onChange={(e) => setNuclear(e.target.checked)} /> Nuclear (no AMS or Blue Saviour reduction)</label>
                    {friendsWithRams.length > 0 ? (
                        <label> Friendly RAMS{" "}
                            <select aria-label="Friendly RAMS" value={ramsFromUuid} onChange={(e) => setRamsFromUuid(e.target.value)}>
                                <option value="">none</option>
                                {friendsWithRams.map((other) => <option key={other.uuid} value={other.uuid}>{unitLabel(other, units.indexOf(other))}</option>)}
                            </select>
                        </label>
                    ) : null}
                    <div>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((points) => (
                            <button key={points} type="button" onClick={() => missileHit(points)}>Missile hit {points}</button>
                        ))}
                    </div>
                    {lastHit.length > 0 ? <ul aria-label="Last missile hit">{lastHit.map((line, index) => <li key={index}>{line}</li>)}</ul> : null}
                </fieldset>
            </div>
        </div>
    );
}

interface IBoardProps {
    force: AlphaStrikeForce;
    onChange: () => void;
}

const NETWORK_KINDS: { kind: IASC3Network["kind"]; label: string }[] = [
    { kind: "c3", label: "C3 (master and slaves)" }, { kind: "c3-boosted", label: "Boosted C3" }, { kind: "c3i", label: "C3i" },
    { kind: "nova", label: "Nova CEWS" }, { kind: "naval", label: "Naval C3" },
];

export function ASEWarBoardPanel({ force, onChange }: IBoardProps): JSX.Element | null {
    const redraw = useRedraw();
    const [newKind, setNewKind] = React.useState<IASC3Network["kind"]>("c3");
    const units = force.getEWarUnits();
    const carries = (unit: AlphaStrikeUnit, codes: string[]) => getASEWarSpecials(unit.abilities, unit.rulesLevel).some((entry) => codes.includes(entry.code));
    const relevant = units.some((unit) => carries(unit, BOARD_CODES) || getASMhqRating(unit.abilities) >= 7);
    if (!relevant) return null;

    const board: IASEWarBoard = force.ewarBoard;
    const edition = force.rulesEdition;
    const mutate = (change: () => void) => { change(); onChange(); redraw(); };
    const toggle = (list: string[] | undefined, uuid: string, on: boolean): string[] => on ? [...(list ?? []).filter((each) => each !== uuid), uuid] : (list ?? []).filter((each) => each !== uuid);
    const ecmCarriers = units.filter((unit) => carries(unit, ["ECM", "AECM", "LECM", "WAT", "NOVA"]) || getASMhqRating(unit.abilities) >= 7);
    const chaffCarriers = units.filter((unit) => carries(unit, ["CHF"]));
    const drones = units.filter((unit) => carries(unit, ["DRO"]));
    const networks = board.c3Networks ?? [];

    return (
        <div className="text-section lr-margin as-ewar-board" data-testid="as-ewar-board">
            <h2>E-War board</h2>
            <div className="section-content">
                <p><em>You declare coverage, line of sight and range; there is no map.</em></p>
                {ecmCarriers.map((carrier) => (
                    <fieldset key={carrier.uuid}>
                        <legend>Inside the ECM bubble of {unitLabel(carrier, units.indexOf(carrier))}</legend>
                        {units.filter((other) => other.uuid !== carrier.uuid).map((other) => (
                            <label key={other.uuid}>
                                <input type="checkbox" aria-label={`${unitLabel(other, units.indexOf(other))} inside the bubble of ${unitLabel(carrier, units.indexOf(carrier))}`}
                                    checked={(board.friendlyEcm?.[carrier.uuid] ?? []).includes(other.uuid)}
                                    onChange={(e) => mutate(() => {
                                        board.friendlyEcm = { ...(board.friendlyEcm ?? {}), [carrier.uuid]: toggle(board.friendlyEcm?.[carrier.uuid], other.uuid, e.target.checked) };
                                    })} /> {unitLabel(other, units.indexOf(other))}
                            </label>
                        ))}
                    </fieldset>
                ))}

                {chaffCarriers.map((carrier) => (
                    <fieldset key={carrier.uuid}>
                        <legend>Inside the chaff cloud of {unitLabel(carrier, units.indexOf(carrier))} (ours, until End Round)</legend>
                        {units.map((other) => (
                            <label key={other.uuid}>
                                <input type="checkbox" aria-label={`${unitLabel(other, units.indexOf(other))} inside the chaff cloud of ${unitLabel(carrier, units.indexOf(carrier))}`}
                                    checked={(board.chaffCloud?.[carrier.uuid] ?? []).includes(other.uuid)}
                                    onChange={(e) => mutate(() => {
                                        board.chaffCloud = { ...(board.chaffCloud ?? {}), [carrier.uuid]: toggle(board.chaffCloud?.[carrier.uuid], other.uuid, e.target.checked) };
                                        if (!e.target.checked) delete other.ewarPlay.chaffCloud;
                                        syncASChaffClouds(units, board);
                                    })} /> {unitLabel(other, units.indexOf(other))}
                            </label>
                        ))}
                    </fieldset>
                ))}

                <h3>C3 networks</h3>
                {networks.map((network, networkIndex) => {
                    const problems = validateASC3Network(network, units, edition);
                    const update = (change: (target: IASC3Network) => void) => mutate(() => { change(networks[networkIndex]); });
                    return (
                        <fieldset key={networkIndex} data-testid="as-c3-network">
                            <legend>{network.name} ({NETWORK_KINDS.find((entry) => entry.kind === network.kind)?.label})</legend>
                            {network.kind === "c3" || network.kind === "c3-boosted" ? (
                                <label>Master{" "}
                                    <select aria-label={`${network.name} master`} value={network.master ?? ""} onChange={(e) => update((target) => { if (e.target.value) target.master = e.target.value; else delete target.master; })}>
                                        <option value="">none</option>
                                        {units.map((other) => <option key={other.uuid} value={other.uuid}>{unitLabel(other, units.indexOf(other))}</option>)}
                                    </select>
                                </label>
                            ) : null}
                            {units.map((other) => (
                                <label key={other.uuid}>
                                    <input type="checkbox" aria-label={`${unitLabel(other, units.indexOf(other))} in ${network.name}`} checked={network.members.includes(other.uuid)}
                                        onChange={(e) => update((target) => { target.members = toggle(target.members, other.uuid, e.target.checked); })} /> {unitLabel(other, units.indexOf(other))}
                                </label>
                            ))}
                            {network.kind === "naval" ? (
                                <label><input type="checkbox" aria-label={`${network.name} enemy JAM`} checked={!!network.enemyJam} onChange={(e) => update((target) => { target.enemyJam = e.target.checked; })} /> Enemy JAM</label>
                            ) : null}
                            <button type="button" onClick={() => mutate(() => { board.c3Networks = networks.filter((_, at) => at !== networkIndex); })}>Remove network</button>
                            {problems.length > 0 ? <ul className="as-ewar-problems">{problems.map((problem, index) => <li key={index}>{problem}</li>)}</ul> : null}
                        </fieldset>
                    );
                })}
                <label>New network{" "}
                    <select aria-label="New network kind" value={newKind} onChange={(e) => setNewKind(e.target.value as IASC3Network["kind"])}>
                        {NETWORK_KINDS.map((entry) => <option key={entry.kind} value={entry.kind}>{entry.label}</option>)}
                    </select>
                </label>
                <button type="button" onClick={() => mutate(() => {
                    board.c3Networks = [...networks, { name: `Network ${networks.length + 1}`, kind: newKind, members: [] }];
                })}>Add network</button>

                {drones.length > 0 ? <h3>Drone control</h3> : null}
                {drones.map((drone) => (
                    <label key={drone.uuid}>{unitLabel(drone, units.indexOf(drone))} is controlled by{" "}
                        <select aria-label={`Controller of ${unitLabel(drone, units.indexOf(drone))}`} value={board.droneControl?.[drone.uuid] ?? ""}
                            onChange={(e) => mutate(() => {
                                const next = { ...(board.droneControl ?? {}) };
                                if (e.target.value) next[drone.uuid] = e.target.value; else delete next[drone.uuid];
                                board.droneControl = next;
                            })}>
                            <option value="">nobody</option>
                            {units.filter((other) => other.uuid !== drone.uuid).map((other) => <option key={other.uuid} value={other.uuid}>{unitLabel(other, units.indexOf(other))}</option>)}
                        </select>
                    </label>
                ))}
            </div>
        </div>
    );
}
