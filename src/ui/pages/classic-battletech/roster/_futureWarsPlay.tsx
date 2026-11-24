import React, { useState } from "react";
import { BattleMech } from "../../../../classes/battlemech";
import { IEquipmentItem } from "../../../../data/data-interfaces";
import { getPowerBoostedWeapon } from "../../../../data/best-of-future-wars-conversions";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../../../../data/rules-level-options";
import {
    getFutureWarsPlayKind, getLRFlamerScatter, getPDSInterception, getPenitratorDie, getPenitratorHit, getSabotDamage, getVHESplashLocations,
    BLUE_SAVIOUR_HEAT, INFERNO_GAUSS_HEAT_PER_TURN, MAX_EXTERNAL_HEAT_PER_TURN, VHE_AMMO_EXPLOSION_PER_SHELL, VHE_DAMAGE,
} from "../../../../utils/future-wars-play";
import { getLocationName } from "../../../../utils";
import { getJamThreshold, getMaxShots, isPermanentJam, type AutocannonKind, type IAutocannonPlay } from "../../../../utils/autocannon-play";

/**
 * Fan equipment in roster play: Best of Future Wars (#172), Chunk C counters, rollers and reminders for the fanzine equipment, and the Pleiades Mechworks Blue Saviour (#641).
 * Rules from *The Best of Future Wars, Volume One* (1991); the numbers live in `src/utils/future-wars-play.ts`.
 */

/** The panel shows for a 'Mech carrying fanzine equipment, one with fanzine play state, or any 'Mech at Custom Homebrew. */
export function showFutureWarsPlay(mech: BattleMech): boolean {
    return mech.getFutureWarsPlayItems().length > 0
        || mech.hasBlueSaviour() || mech.hasPilotSuit()
        || Object.keys(mech.futureWarsPlay).length > 0
        || mech.getRulesLevel(0) >= CUSTOM_HOMEBREW_RULES_LEVEL;
}

/** The movement dialog's note on the Run or Jump button when a Power Booster is on this turn: " (boosted N)" (p.28). */
export function getBoostedMoveNote(mech: BattleMech, mode: string): string {
    if (mode === "r" && mech.getPlayRunSpeed() !== mech.getRunSpeed()) return ` (boosted ${mech.getPlayRunSpeed()})`;
    if (mode === "j" && mech.getPlayJumpSpeed() !== mech.getJumpSpeed()) return ` (boosted ${mech.getPlayJumpSpeed()})`;
    return "";
}

interface IFutureWarsPlayPanelProps {
    mech: BattleMech;
    onChange: (mech: BattleMech) => void;
}

const FAIL_ON = ["", "5", "9", "11"];

/**
 * A small number box. While typing, the text is kept as a draft: a whole number in range is taken at once (or, with
 * `commitOnBlur`, only when the box is left or Enter is pressed); anything else waits for the box to be left, then is
 * brought into range. So typing "12" into a 2-12 box does not jump to 2 on the "1".
 */
export const NumberBox = (props: { testId: string; value: number; min: number; max: number; label: string; commitOnBlur?: boolean; onChange: (value: number) => void }) => {
    const [draft, setDraft] = useState<string | null>(null);
    const commit = (text: string) => {
        setDraft(null);
        const value = Math.max(props.min, Math.min(props.max, Math.round(Number(text)) || props.min));
        if (value !== props.value) props.onChange(value);
    };
    return (
        <label className="small-text">
            {props.label}{" "}
            <input
                type="number"
                data-testid={props.testId}
                value={draft ?? props.value}
                min={props.min}
                max={props.max}
                style={{ width: "4em" }}
                onChange={(e) => {
                    const text = e.currentTarget.value;
                    const value = Number(text);
                    if (!props.commitOnBlur && text !== "" && Number.isInteger(value) && value >= props.min && value <= props.max) {
                        setDraft(null);
                        props.onChange(value);
                    } else {
                        setDraft(text);
                    }
                }}
                onBlur={(e) => { if (draft !== null) commit(e.currentTarget.value); }}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
            />
        </label>
    );
};

const FutureWarsPlayPanel = (props: IFutureWarsPlayPanelProps) => {
    const { mech } = props;
    const [rolls, setRolls] = useState<Record<string, number>>({});
    const [results, setResults] = useState<Record<string, string>>({});
    const [, setTick] = useState(0);
    const changed = () => { setTick((tick) => tick + 1); props.onChange(mech); };
    const roll = (key: string, fallback: number) => rolls[key] ?? fallback;
    const setRoll = (key: string, value: number) => setRolls((previous) => ({ ...previous, [key]: value }));

    const booster = (item: IEquipmentItem, uuid: string) => {
        const status = mech.getPowerBoosterStatus(uuid);
        const turn = mech.getPowerBoosterTurnInARow(uuid);
        const target = item.conversion?.booster?.target;
        const boosted = getPowerBoostedWeapon(item);
        // As first printed (Future Wars #14 p.46): no fourth-turn burnout, later turns at 11 or less (NGCFells's ruling),
        // and a burned-out leg booster leaves the 'Mech walking, with no word of an overhaul.
        const firstPrinting = mech.usesFutureWarsEquipmentFirstPrintings();
        const statusText = {
            ready: turn >= 4 && !firstPrinting ? "Ready: a 4th turn running burns out the system"
                : `Ready: turn ${turn} in a row, fails on ${FAIL_ON[Math.min(3, turn)]} or less, a 2 burns out the system`,
            on: "Boosted this turn",
            used: "Rolled this turn",
            failed: "Failed: the booster can no longer be used",
            "burned-out": target === "running" ? (firstPrinting ? "Burned out: the 'Mech can walk but not run" : "Burned out: the 'Mech cannot run until a major overhaul")
                : target === "jumping" ? "Burned out: the jump jets must be replaced" : "Burned out: the weapon must be replaced before it fires again",
        }[status];
        return (
            <div>
                <div data-testid={`fw-booster-status-${uuid}`} className={status === "failed" || status === "burned-out" ? "color-red" : ""}>{statusText}</div>
                {status === "ready" ? (
                    <div>
                        <NumberBox testId={`fw-booster-roll-${uuid}`} label="2D6" min={2} max={12} value={roll(`booster-${uuid}`, 7)} onChange={(value) => setRoll(`booster-${uuid}`, value)} />{" "}
                        <button className="btn btn-sm btn-primary" data-testid={`fw-booster-use-${uuid}`}
                            onClick={() => { mech.rollPowerBooster(uuid, roll(`booster-${uuid}`, 7)); changed(); }}>
                            Use Booster
                        </button>
                    </div>
                ) : null}
                {status === "on" && boosted ? (
                    <div data-testid={`fw-booster-shot-${uuid}`}>
                        Boosted shot: {boosted.damagePerCluster !== undefined ? `${boosted.damagePerCluster} damage a hit` : `${typeof boosted.damage === "number" ? boosted.damage : "?"} damage`},
                        {" "}{boosted.heat} heat (added to the turn's heat), range {boosted.range.short} / {boosted.range.medium} / {boosted.range.long}.
                    </div>
                ) : null}
                {status === "on" && target === "running" ? (
                    <div>
                        Run MP {mech.getPlayRunSpeed()} (+2), 1 heat a hex run.{" "}
                        <NumberBox testId={`fw-booster-hexes-${uuid}`} label="Hexes run" min={0} max={mech.getPlayRunSpeed()} commitOnBlur
                            value={mech.futureWarsPlay.boostedRunHexes ?? mech.getPlayRunSpeed()}
                            onChange={(value) => { mech.futureWarsPlay.boostedRunHexes = value; changed(); }} />
                    </div>
                ) : null}
                {status === "on" && target === "jumping" ? <div>Jump MP {mech.getPlayJumpSpeed()} (half again), double heat a hex jumped.</div> : null}
            </div>
        );
    };

    const pds = (uuid: string) => (
        <div>
            <div>
                Bursts left: <strong data-testid={`fw-pds-bursts-${uuid}`}>{mech.getPDSBurstsLeft(uuid)}</strong>{" "}
                <span data-testid={`fw-pds-bursts-detail-${uuid}`}>
                    ({mech.getPDSIntegralBurstsLeft(uuid)} built-in{mech.getPDSBurstsLeft(uuid) > mech.getPDSIntegralBurstsLeft(uuid)
                        ? ` + ${mech.getPDSBurstsLeft(uuid) - mech.getPDSIntegralBurstsLeft(uuid)} in the magazine` : ""}; the built-in ones are spent first)
                </span>
            </div>
            <NumberBox testId={`fw-pds-hits-${uuid}`} label="Missiles hitting" min={0} max={40} value={roll(`pds-hits-${uuid}`, 0)} onChange={(value) => setRoll(`pds-hits-${uuid}`, value)} />{" "}
            <NumberBox testId={`fw-pds-roll-${uuid}`} label="1D6" min={1} max={6} value={roll(`pds-roll-${uuid}`, 1)} onChange={(value) => setRoll(`pds-roll-${uuid}`, value)} />{" "}
            {(["srm", "lrm"] as const).map((launcher) => (
                <button key={launcher} className="btn btn-sm btn-primary" data-testid={launcher === "srm" ? `fw-pds-fire-${uuid}` : `fw-pds-fire-lrm-${uuid}`}
                    disabled={mech.getPDSBurstsLeft(uuid) <= 0}
                    onClick={() => {
                        if (!mech.usePDSBurst(uuid)) return;
                        const result = getPDSInterception(roll(`pds-hits-${uuid}`, 0), roll(`pds-roll-${uuid}`, 1), launcher);
                        const text = `${launcher.toUpperCase()} salvo: ${result.stopped} stopped, ${result.through} ${result.through === 1 ? "hits" : "hit"}.`;
                        setResults((previous) => ({ ...previous, [`pds-${uuid}`]: text }));
                        changed();
                    }}>
                    {launcher === "srm" ? "Fire at SRMs" : "Fire at LRMs (+1)"}
                </button>
            ))}
            {results[`pds-${uuid}`] ? <div data-testid={`fw-pds-result-${uuid}`}>{results[`pds-${uuid}`]}</div> : null}
        </div>
    );

    const penitrator = (uuid: string) => {
        const range = roll(`pen-range-${uuid}`, 12);
        const sides = getPenitratorDie(range) ?? 4;
        const hit = getPenitratorHit(range, Math.min(sides, roll(`pen-roll-${uuid}`, 1)));
        return (
            <div>
                <NumberBox testId={`fw-penitrator-range-${uuid}`} label="Range" min={1} max={40} value={range} onChange={(value) => setRoll(`pen-range-${uuid}`, value)} />{" "}
                <NumberBox testId={`fw-penitrator-roll-${uuid}`} label={`Die (1-${sides})`} min={1} max={sides} value={Math.min(sides, roll(`pen-roll-${uuid}`, 1))} onChange={(value) => setRoll(`pen-roll-${uuid}`, value)} />
                <div data-testid={`fw-penitrator-result-${uuid}`}>
                    {hit ? `A hit at ${hit.band} range (${hit.dice}): ${hit.external} to the armor and ${hit.internal} to the internal structure, then a critical hit check.`
                        : "Out of range (36 hexes)."}
                </div>
            </div>
        );
    };

    const scatter = (uuid: string) => (
        <div>
            <NumberBox testId={`fw-scatter-roll-${uuid}`} label="Miss: 1D6" min={1} max={6} value={roll(`scatter-${uuid}`, 1)} onChange={(value) => setRoll(`scatter-${uuid}`, value)} />{" "}
            lands {getLRFlamerScatter(roll(`scatter-${uuid}`, 1))}, and that hex catches fire.
        </div>
    );

    const firstPrinting = mech.usesFutureWarsEquipmentFirstPrintings();
    const reminder = (item: IEquipmentItem): string => {
        switch (getFutureWarsPlayKind(item)) {
            case "lr-flamer": return "Burns the 'Mech it hits for three turns: 5, 2, then 0 damage, 5 heat each turn (+1 heat a hit still burning, 10 at most). Its own +2 at medium, +3 at long is in the to-hit.";
            case "lr-flamer-ammo": return firstPrinting
                ? "If this fuel is hit, it does 2 damage and 3 heat for each round left (the critical hit roll applies it)."
                : "If this fuel is hit, the damage is as many Long Range Flamer hits as it has shots left.";
            case "pds": return "Declare it when missiles are fired at this 'Mech; one burst against each salvo, any number of salvos a turn.";
            case "penitrator": return "Roll a critical hit check for each missile that hits. Inside 8 hexes it is harder to hit: the minimum-range modifier applies.";
            case "gatling": return "Six shots a round: roll on the cluster table as an SRM 6 (the Target dialog does), 2 damage a hit.";
            case "pom-pom": return "Fires twice a turn, each shot rolled on its own and using a round; double heat even firing once (in the to-hit and heat already). Breakdowns: roll twice on the malfunction table, take the worse.";
            case "swing-fire": return "The rack swings through 180 degrees: it may fire into the rear arc. Its +1 to-hit is in the weapon's accuracy."
                + (firstPrinting ? " As first printed: swinging takes a turn; on AeroTech maps it fires into the front or rear arc; a critical hit on its own slot stops the swing." : "");
            case "vhe": {
                return `A hit does ${VHE_DAMAGE.hit} to the location and ${VHE_DAMAGE.adjacent} to each adjacent one (from the center torso: `
                    + `${getVHESplashLocations("ct").map((location) => getLocationName(location, false)).join(", ")}). A critical hit adds one more critical hit. `
                    + `An ammunition hit cooks off at ${VHE_AMMO_EXPLOSION_PER_SHELL} a shell (the critical hit roll applies it).`;
            }
            case "inferno-gauss": return `A hit does 2 damage and ${INFERNO_GAUSS_HEAT_PER_TURN} heat a turn for 5 turns (mark it on the target below). `
                + (firstPrinting ? "An ammunition hit is 30 heat (20 with CASE) and 1 damage a shell (the critical hit roll applies it)."
                    : "An ammunition hit is heat, not damage (the critical hit roll applies it).");
            case "sabot": {
                const weapon = mech.getAmmoBinWeapon(item);
                const damage = typeof weapon?.damage === "number" ? getSabotDamage(weapon.damage) : undefined;
                return `One round in five: declare a SABOT round when firing. `
                    + (damage ? `A hit does ${damage.external} to the armor and ${damage.internal} to the internal structure, ` : "Half the damage to the armor and a quarter inside, rounded up, ")
                    + "then a critical hit check at +1.";
            }
            case "booster-weapon": return "Optional each turn: roll before firing.";
            case "booster-running": return "Optional each turn: roll before running for +2 run MP.";
            case "booster-jumping": return "Optional each turn: roll before jumping for half again the jump MP.";
            default: return "";
        }
    };

    // Pleiades Mechworks Blue Saviour Dispersion Field (#641): switch it in the End Phase, roll its failure check, read the reminders.
    const blueSaviour = () => {
        const state = mech.getBlueSaviourState();
        const target = mech.getBlueSaviourCheckTarget();
        const status = state.exploded ? "Exploded: dead for the scenario"
            : state.failed ? "Failed: off for the scenario"
            : state.on ? `On: ${BLUE_SAVIOUR_HEAT} heat a turn, energy damage in and out halved (round down, at least 1)` : "Off";
        const reminders = mech.getBlueSaviourReminders();
        return (
            <div className="small-text" data-testid="fw-blue-saviour">
                <strong>Blue Saviour Dispersion Field</strong>
                <div data-testid="fw-blue-saviour-status" className={state.failed || state.exploded ? "color-red" : ""}>{status} ({state.activeTurns} turns on){state.next !== state.on ? (state.next ? "; on from next turn" : "; off from next turn") : ""}</div>
                <button className="btn btn-sm btn-secondary" data-testid="fw-blue-saviour-toggle" disabled={state.failed || state.exploded}
                    onClick={() => { mech.setBlueSaviour(!state.next); changed(); }}>
                    {state.next ? "Switch off from next turn (End Phase)" : "Switch on (End Phase: from next turn; before the first turn, now)"}
                </button>
                {target !== undefined ? (
                    <div data-testid="fw-blue-saviour-check">
                        Start of turn: roll 2D6; less than {target} fails it for the scenario. A check left undone is rolled for you when the turn ends.{" "}
                        <NumberBox testId="fw-blue-saviour-roll" label="2D6" min={2} max={12} value={roll("blue-saviour", 7)} onChange={(value) => setRoll("blue-saviour", value)} />{" "}
                        <button className="btn btn-sm btn-primary" data-testid="fw-blue-saviour-roll-button" disabled={rolls["blue-saviour"] === undefined}
                            onClick={() => { mech.rollBlueSaviourCheck(roll("blue-saviour", 7)); setRolls((previous) => { const rest = { ...previous }; delete rest["blue-saviour"]; return rest; }); changed(); }}>
                            Roll
                        </button>{" "}
                        <button className="btn btn-sm btn-secondary" data-testid="fw-blue-saviour-roll-for-me"
                            onClick={() => { mech.rollBlueSaviourCheck(2 + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6)); changed(); }}>
                            Roll for me
                        </button>
                    </div>
                ) : null}
                {mech.getBlueSaviourAutoRoll() ? (
                    <div data-testid="fw-blue-saviour-auto-roll" className="color-red">
                        Skipped check rolled for you: {mech.getBlueSaviourAutoRoll()!.roll} against {mech.getBlueSaviourAutoRoll()!.target}, {mech.getBlueSaviourAutoRoll()!.result}.
                    </div>
                ) : null}
                {reminders.length ? <div data-testid="fw-blue-saviour-reminders">{reminders.join("; ")}</div> : null}
            </div>
        );
    };

    const burn = mech.getLRFlamerBurnThisTurn();
    const infernoTurns = mech.futureWarsPlay.infernoGaussTurns ?? 0;
    const fireHeat = burn.heat + (infernoTurns ? INFERNO_GAUSS_HEAT_PER_TURN : 0);
    const pendingHeat = mech.futureWarsPlay.pendingHeat ?? 0;

    return (
        <fieldset className="fieldset" data-testid="fw-play">
            <legend>Best of Future Wars</legend>
            {mech.getFutureWarsPlayItems().map((item, index) => {
                const uuid = item.uuid ?? `item-${index}`;
                const kind = getFutureWarsPlayKind(item);
                return (
                    <div key={uuid} className="small-text" style={{ marginBottom: "0.5em" }}>
                        <strong>{item.name}</strong> {item.location ? `(${getLocationName(item.location, false)})` : null}
                        <div>{reminder(item)}</div>
                        {kind === "booster-weapon" || kind === "booster-running" || kind === "booster-jumping" ? booster(item, uuid) : null}
                        {kind === "pds" ? pds(uuid) : null}
                        {kind === "penitrator" ? penitrator(uuid) : null}
                        {kind === "lr-flamer" ? scatter(uuid) : null}
                    </div>
                );
            })}
            <div className="small-text">
                <strong>Burning on this 'Mech</strong>
                <div data-testid="fw-burn">
                    Long Range Flamer: {burn.heat || burn.damage ? `${burn.damage} damage this turn (to the location the players choose), ${burn.heat} heat (added at the heat phase)` : "none"}
                </div>
                <div data-testid="fw-inferno">
                    Inferno Gauss: {infernoTurns ? `${INFERNO_GAUSS_HEAT_PER_TURN} heat a turn, ${infernoTurns} turns left` : "none"}
                </div>
                {fireHeat ? (
                    <div data-testid="fw-external-heat">
                        {Math.min(MAX_EXTERNAL_HEAT_PER_TURN, fireHeat)} heat from fires this turn
                        {fireHeat > MAX_EXTERNAL_HEAT_PER_TURN ? ` (${fireHeat}, ${MAX_EXTERNAL_HEAT_PER_TURN} at most)` : ""}, added at the heat phase.
                    </div>
                ) : null}
                {pendingHeat ? (
                    <div data-testid="fw-pending-heat" className="color-red">
                        Inferno shells ignited aboard: {pendingHeat} heat, added at the heat phase.
                    </div>
                ) : null}
                <button className="btn btn-sm btn-secondary" data-testid="fw-lr-flamer-hit" onClick={() => { mech.addLRFlamerHit(); changed(); }}>
                    Hit by a Long Range Flamer
                </button>{" "}
                <button className="btn btn-sm btn-secondary" data-testid="fw-inferno-hit" onClick={() => { mech.addInfernoGaussHit(); changed(); }}>
                    Hit by an Inferno Gauss shell
                </button>
            </div>
            {mech.hasBlueSaviour() ? blueSaviour() : null}
            {mech.hasPilotSuit() ? (
                <div className="small-text" data-testid="fw-pilot-suit">
                    <strong>Pilot Suit cockpit</strong>
                    <div>Piloting and Gunnery 1 better with a MechWarrior in the suit (in the to-hit); it cannot be piloted without the suit.</div>
                    <div>Piloting roll modifier: {mech.getPilotingSkillModifier() > 0 ? "+" : ""}{mech.getPilotingSkillModifier()} on every Piloting Skill Roll (the suit, and anything else on this 'Mech that changes them).</div>
                    {mech.getPilotSuitLines().map((line) => <div key={line}>{line}</div>)}
                </div>
            ) : null}
        </fieldset>
    );
};

/** The unit methods the autocannon panel uses; BattleMech, Vehicle and AerospaceFighter all have them (#643). */
export interface IAutocannonUnit {
    getRateOfFireWeapons(): IEquipmentItem[];
    getAutocannonKind(uuid: string): AutocannonKind | undefined;
    getShots(uuid: string): number;
    setShots(uuid: string, shots: number): void;
    isJammed(uuid: string): boolean;
    recordToHitRoll(uuid: string, roll: number): { jammed: boolean };
    declareClear(uuid: string): boolean;
    isClearingAttempt(uuid: string): boolean;
    resolveClear(uuid: string, success: boolean): boolean;
    autocannonPlay: IAutocannonPlay;
}

/** Rate of fire and jams for rotary and Ultra ACs (#643): pick the shots, record the to-hit roll (a low roll jams it after the shots fire), clear a jam (takes the turn). */
export const AutocannonPlayPanel = (props: { unit: IAutocannonUnit; onChange: () => void }) => {
    const [rolls, setRolls] = useState<Record<string, number>>({});
    const weapons = props.unit.getRateOfFireWeapons();
    if (weapons.length === 0) return null;
    const unitClearing = weapons.some((item) => props.unit.isClearingAttempt(item.uuid!));
    return (
        <fieldset className="fieldset" data-testid="autocannon-play">
            <legend>Rotary and Ultra Autocannons</legend>
            {unitClearing ? <p className="color-red" data-testid="ac-unit-no-attacks">A clearing attempt is under way: this unit makes no weapon attacks this turn (TW p.140).</p> : null}
            {weapons.map((item) => {
                const uuid = item.uuid!;
                const kind = props.unit.getAutocannonKind(uuid)!;
                const state = props.unit.autocannonPlay[uuid];
                const cap = getMaxShots(kind);
                const shots = props.unit.getShots(uuid);
                const threshold = getJamThreshold(kind, shots);
                return (
                    <div key={uuid} data-testid={"ac-" + uuid}>
                        <strong>{item.name}</strong>
                        {props.unit.isJammed(uuid) ? <span data-testid={"ac-jammed-" + uuid}> JAMMED </span> : null}
                        {state?.fired && !props.unit.isJammed(uuid) ? <span> (fired this turn) </span> : null}
                        <label>
                            &nbsp;Shots:
                            <select value={shots} disabled={props.unit.isJammed(uuid)} onChange={(e) => { props.unit.setShots(uuid, +e.currentTarget.value); props.onChange(); }} data-testid={"ac-shots-" + uuid}>
                                {Array.from({ length: cap }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value}</option>)}
                            </select>
                        </label>
                        <span className="small-text">{threshold ? ` jams on a to-hit roll of ${threshold} or less` : " cannot jam at this rate"}</span>
                        {props.unit.isJammed(uuid) ? (
                            isPermanentJam(kind) ? (
                                <span data-testid={"ac-permanent-" + uuid}>Jammed for the rest of the game (TW p.114)</span>
                            ) : props.unit.isClearingAttempt(uuid) ? (
                                <>
                                    <span data-testid={"ac-attempt-" + uuid}>Clearing attempt turn: no weapon attacks (stand still or walk/cruise); Gunnery Skill Roll +3 at the end of the Weapon Attack Phase (TW p.140). </span>
                                    <button className="btn btn-primary btn-sm" onClick={() => { props.unit.resolveClear(uuid, true); props.onChange(); }} data-testid={"ac-cleared-" + uuid}>Roll made: cleared</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => { props.unit.resolveClear(uuid, false); props.onChange(); }} data-testid={"ac-failed-" + uuid}>Roll failed</button>
                                </>
                            ) : state?.clearing === "declared" ? (
                                <span data-testid={"ac-declared-" + uuid}>Clearing declared: the attempt is next turn</span>
                            ) : (
                                <button className="btn btn-secondary btn-sm" onClick={() => { props.unit.declareClear(uuid); props.onChange(); }} data-testid={"ac-declare-" + uuid}>Declare clearing attempt (End Phase)</button>
                            )
                        ) : (
                            <>
                                <input type="number" min={2} max={12} value={rolls[uuid] ?? ""} placeholder="to-hit roll" style={{ width: "5.5em" }}
                                    onChange={(e) => setRolls({ ...rolls, [uuid]: +e.currentTarget.value })} data-testid={"ac-roll-" + uuid} />
                                <button className="btn btn-primary btn-sm" disabled={!(rolls[uuid] >= 2 && rolls[uuid] <= 12) || !!state?.fired || unitClearing}
                                    onClick={() => { props.unit.recordToHitRoll(uuid, rolls[uuid]); props.onChange(); }} data-testid={"ac-record-" + uuid}>Record roll</button>
                            </>
                        )}
                    </div>
                );
            })}
        </fieldset>
    );
};

export default FutureWarsPlayPanel;
