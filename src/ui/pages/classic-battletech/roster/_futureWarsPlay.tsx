import React, { useState } from "react";
import { BattleMech } from "../../../../classes/battlemech";
import { IEquipmentItem } from "../../../../data/data-interfaces";
import { getPowerBoostedWeapon } from "../../../../data/best-of-future-wars-conversions";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../../../../data/rules-level-options";
import {
    getFutureWarsPlayKind, getLRFlamerScatter, getPDSInterception, getPenitratorDie, getPenitratorHit, getSabotDamage, getVHESplashLocations,
    INFERNO_GAUSS_HEAT_PER_TURN, VHE_AMMO_EXPLOSION_PER_SHELL, VHE_DAMAGE,
} from "../../../../utils/future-wars-play";
import { getLocationName } from "../../../../utils";

/**
 * Best of Future Wars (#172), Chunk C: counters, rollers and reminders for the fanzine equipment in roster play.
 * Rules from *The Best of Future Wars, Volume One* (1991); the numbers live in `src/utils/future-wars-play.ts`.
 */

/** The panel shows for a 'Mech carrying fanzine equipment, one with fanzine play state, or any 'Mech at Custom Homebrew. */
export function showFutureWarsPlay(mech: BattleMech): boolean {
    return mech.getFutureWarsPlayItems().length > 0
        || Object.keys(mech.futureWarsPlay).length > 0
        || mech.getRulesLevel(0) >= CUSTOM_HOMEBREW_RULES_LEVEL;
}

interface IFutureWarsPlayPanelProps {
    mech: BattleMech;
    onChange: (mech: BattleMech) => void;
}

const FAIL_ON = ["", "5", "9", "11"];

const NumberBox = (props: { testId: string; value: number; min: number; max: number; label: string; onChange: (value: number) => void }) => (
    <label className="small-text">
        {props.label}{" "}
        <input
            type="number"
            data-testid={props.testId}
            value={props.value}
            min={props.min}
            max={props.max}
            style={{ width: "4em" }}
            onChange={(e) => props.onChange(Math.max(props.min, Math.min(props.max, Number(e.currentTarget.value) || props.min)))}
        />
    </label>
);

const FutureWarsPlayPanel = (props: IFutureWarsPlayPanelProps) => {
    const { mech } = props;
    const [rolls, setRolls] = useState<Record<string, number>>({});
    const [results, setResults] = useState<Record<string, string>>({});
    const [, setTick] = useState(0);
    const changed = () => { setTick((tick) => tick + 1); props.onChange(mech); };
    const roll = (key: string, fallback: number) => rolls[key] ?? fallback;
    const setRoll = (key: string, value: number) => setRolls({ ...rolls, [key]: value });

    const booster = (item: IEquipmentItem, uuid: string) => {
        const status = mech.getPowerBoosterStatus(uuid);
        const turn = mech.getPowerBoosterTurnInARow(uuid);
        const target = item.conversion?.booster?.target;
        const boosted = getPowerBoostedWeapon(item);
        const statusText = {
            ready: turn >= 4 ? "Ready: a 4th turn running burns out the system" : `Ready: turn ${turn} in a row, fails on ${FAIL_ON[turn]} or less, a 2 burns out the system`,
            on: "Boosted this turn",
            used: "Rolled this turn",
            failed: "Failed: the booster can no longer be used",
            "burned-out": target === "running" ? "Burned out: the 'Mech cannot run until a major overhaul"
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
                        Run MP {mech.getRunSpeed() + 2}, 1 heat a hex run.{" "}
                        <NumberBox testId={`fw-booster-hexes-${uuid}`} label="Hexes run" min={0} max={mech.getRunSpeed() + 2}
                            value={mech.futureWarsPlay.boostedRunHexes ?? mech.getRunSpeed() + 2}
                            onChange={(value) => { mech.futureWarsPlay.boostedRunHexes = value; changed(); }} />
                    </div>
                ) : null}
                {status === "on" && target === "jumping" ? <div>Jump MP {mech.getBoostedJumpMP()}, double heat a hex jumped.</div> : null}
            </div>
        );
    };

    const pds = (uuid: string) => (
        <div>
            <div>Built-in bursts left: <strong data-testid={`fw-pds-bursts-${uuid}`}>{mech.getPDSIntegralBurstsLeft(uuid)}</strong> (an extra magazine is tracked as ammunition)</div>
            <NumberBox testId={`fw-pds-hits-${uuid}`} label="Missiles hitting" min={0} max={40} value={roll(`pds-hits-${uuid}`, 0)} onChange={(value) => setRoll(`pds-hits-${uuid}`, value)} />{" "}
            <NumberBox testId={`fw-pds-roll-${uuid}`} label="1D6" min={1} max={6} value={roll(`pds-roll-${uuid}`, 1)} onChange={(value) => setRoll(`pds-roll-${uuid}`, value)} />{" "}
            {(["srm", "lrm"] as const).map((launcher) => (
                <button key={launcher} className="btn btn-sm btn-primary" data-testid={launcher === "srm" ? `fw-pds-fire-${uuid}` : `fw-pds-fire-lrm-${uuid}`}
                    disabled={mech.getPDSIntegralBurstsLeft(uuid) <= 0}
                    onClick={() => {
                        if (!mech.usePDSBurst(uuid)) return;
                        const result = getPDSInterception(roll(`pds-hits-${uuid}`, 0), roll(`pds-roll-${uuid}`, 1), launcher);
                        setResults({ ...results, [`pds-${uuid}`]: `${launcher.toUpperCase()} salvo: ${result.stopped} stopped, ${result.through} ${result.through === 1 ? "hits" : "hit"}.` });
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
                <NumberBox testId={`fw-penitrator-roll-${uuid}`} label={`Die (1-${sides})`} min={1} max={8} value={roll(`pen-roll-${uuid}`, 1)} onChange={(value) => setRoll(`pen-roll-${uuid}`, value)} />
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

    const reminder = (item: IEquipmentItem): string => {
        switch (getFutureWarsPlayKind(item)) {
            case "lr-flamer": return "Burns the 'Mech it hits for three turns: 5, 2, then 0 damage, 5 heat each turn (+1 heat a hit still burning, 10 at most). Its own +2 at medium, +3 at long is in the to-hit.";
            case "lr-flamer-ammo": return "If this fuel is hit, the damage is as many Long Range Flamer hits as it has shots left.";
            case "pds": return "Declare it when missiles are fired at this 'Mech; one burst against each salvo, any number of salvos a turn.";
            case "penitrator": return "Roll a critical hit check for each missile that hits. Inside 8 hexes it is harder to hit: the minimum-range modifier applies.";
            case "gatling": return "Six shots a round: roll on the cluster table as an SRM 6 (the Target dialog does), 2 damage a hit.";
            case "pom-pom": return "Fires twice a turn, each shot rolled on its own and using a round; double heat even firing once (in the to-hit and heat already). Breakdowns: roll twice on the malfunction table, take the worse.";
            case "swing-fire": return "The rack swings through 180 degrees: it may fire into the rear arc. Its +1 to-hit is in the weapon's accuracy.";
            case "vhe": {
                return `A hit does ${VHE_DAMAGE.hit} to the location and ${VHE_DAMAGE.adjacent} to each adjacent one (from the center torso: `
                    + `${getVHESplashLocations("ct").map((location) => getLocationName(location, false)).join(", ")}). A critical hit adds one more critical hit. `
                    + `An ammunition hit cooks off at ${VHE_AMMO_EXPLOSION_PER_SHELL} a shell (the critical hit roll applies it).`;
            }
            case "inferno-gauss": return `A hit does 2 damage and ${INFERNO_GAUSS_HEAT_PER_TURN} heat a turn for 5 turns (mark it on the target below). An ammunition hit is heat, not damage (the critical hit roll applies it).`;
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

    const burn = mech.getLRFlamerBurnThisTurn();
    const infernoTurns = mech.futureWarsPlay.infernoGaussTurns ?? 0;

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
                <button className="btn btn-sm btn-secondary" data-testid="fw-lr-flamer-hit" onClick={() => { mech.addLRFlamerHit(); changed(); }}>
                    Hit by a Long Range Flamer
                </button>{" "}
                <button className="btn btn-sm btn-secondary" data-testid="fw-inferno-hit" onClick={() => { mech.addInfernoGaussHit(); changed(); }}>
                    Hit by an Inferno Gauss shell
                </button>
            </div>
        </fieldset>
    );
};

export default FutureWarsPlayPanel;
