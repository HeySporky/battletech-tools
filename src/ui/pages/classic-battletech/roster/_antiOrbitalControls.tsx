import * as React from 'react';
import { BattleMechForce } from '../../../../classes/battlemech-force';
import { findAntiOrbitalGuns, IAntiOrbitalGun } from '../../../../classes/space-tracker';
import { HIT_REMINDER, MISFIRE_REMINDER, RESOLUTION_ROLLS, ResolutionOutcome } from '../../../../utils/space-turn';
import StandardModal from '../../../components/standard-modal';

/*
 * The space turn tracker's anti-orbital controls (design 2026-10-22; house rules in TRO.md, user rulings 2026-10-22).
 * The app rolls no dice: the player types each roll in.
 */

interface IGunEntry {
    hex: string;
    target: string;
    roll: string;
    message: string;
    /** The ground turn the message was made in: it shows only in that turn. */
    messageTurn: number;
}

const emptyEntry: IGunEntry = { hex: "", target: "", roll: "", message: "", messageTurn: 0 };

const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? "" : "s"}`;

function GunRow(props: { force: BattleMechForce; gun: IAntiOrbitalGun; onChange: () => void }) {
    const { force, gun } = props;
    const tracker = force.spaceTracker;
    const [entry, setEntry] = React.useState<IGunEntry>(emptyEntry);
    const id = React.useId();
    const destroyed = tracker.isGunDestroyed(gun);
    const cooldown = tracker.getGunCooldown(gun, force.turn);
    const set = (fields: Partial<IGunEntry>) =>
        setEntry((current) => ({ ...current, ...fields, ...("message" in fields ? { messageTurn: force.turn } : {}) }));

    const fire = () => {
        const roll = entry.roll.trim() === "" ? undefined : Number(entry.roll);
        const result = tracker.fire(gun, entry.hex, entry.target, force.turn, roll);
        switch (result.result) {
            case "fired": set({ message: `Fired at hex ${result.shot.aimedHex}. It is resolved in the next space turn.`, roll: "" }); break;
            case "needs-roll": set({ message: `Firing before the next space turn is unsafe. Enter the 2D6 roll, then fire again.` }); break;
            case "misfire": set({ message: result.reminder, roll: "" }); break;
            case "destroyed": set({ message: result.reminder, roll: "" }); break;
            case "refused": set({ message: result.reason }); break;
        }
        props.onChange();
    };

    const earlyGroundShot = () => {
        const result = tracker.rollEarlyFireForOtherRound(gun, Number(entry.roll));
        if (result === null) set({ message: "A 2D6 roll is 2 to 12" });
        else if (result === "misfire") set({ message: MISFIRE_REMINDER, roll: "" });
        else if (result === "normal") set({ message: "The round fires normally.", roll: "" });
        else set({ message: "", roll: "" });
        props.onChange();
    };

    return (
        <fieldset className="fieldset">
            <legend>{gun.weapon.name}: anti-orbital</legend>
            <div>{plural(gun.shotsLeft, "shot")} left</div>
            {destroyed ? <div className="text-danger"><strong>Destroyed: inoperable for the rest of the game</strong></div> : null}
            {!destroyed && cooldown > 0 ? (
                <div>
                    Fires again in {plural(cooldown, "ground turn")}. Firing any round before then risks the 2D6 table.
                </div>
            ) : null}
            <label htmlFor={`${id}-hex`}>Aimed hex</label>
            <input id={`${id}-hex`} type="text" maxLength={16} value={entry.hex} disabled={destroyed}
                onChange={(e) => set({ hex: e.currentTarget.value })} />
            <label htmlFor={`${id}-target`}>Target (optional)</label>
            <input id={`${id}-target`} type="text" maxLength={60} value={entry.target} disabled={destroyed}
                onChange={(e) => set({ target: e.currentTarget.value })} />
            {!destroyed && cooldown > 0 ? (
                <>
                    <label htmlFor={`${id}-roll`}>2D6 roll</label>
                    <input id={`${id}-roll`} type="number" min={2} max={12} step={1} value={entry.roll}
                        onChange={(e) => set({ roll: e.currentTarget.value })} />
                </>
            ) : null}
            <button className="btn btn-sm btn-primary" disabled={destroyed || gun.shotsLeft <= 0} onClick={fire}>
                Fire anti-orbital
            </button>
            {!destroyed && cooldown > 0 ? (
                <button className="btn btn-sm btn-secondary" disabled={entry.roll.trim() === ""} onClick={earlyGroundShot}
                    title="A ground round fired before the next space turn: enter its 2D6 roll">
                    Early ground shot
                </button>
            ) : null}
            {entry.message && entry.messageTurn === force.turn ? <div className="small-text">{entry.message}</div> : null}
        </fieldset>
    );
}

/** The selected unit's anti-orbital guns; nothing while the option is off or the unit has none. */
export function AntiOrbitalGunControls(props: { force: BattleMechForce; unitUuid: string; onChange: () => void }) {
    if (!props.force.spaceInPlay) return null;
    const guns = findAntiOrbitalGuns(props.force).filter((gun) => gun.unitUuid === props.unitUuid);
    if (guns.length === 0) return null;
    return (
        <div className="anti-orbital-controls">
            {guns.map((gun) => <GunRow key={gun.key} force={props.force} gun={gun} onChange={props.onChange} />)}
        </div>
    );
}

/** The shots due at the start of this space turn: pick what happened, then record a hit or a miss. */
export function SpaceResolutionDialog(props: { force: BattleMechForce; onChange: () => void; onClose: () => void }) {
    const { force } = props;
    const [outcomes, setOutcomes] = React.useState<Record<string, ResolutionOutcome>>({});
    const [results, setResults] = React.useState<string[]>([]);
    const id = React.useId();
    const due = force.spaceTracker.getDueShots(force.turn);

    const record = (shotId: string, label: string, hit: boolean) => {
        force.spaceTracker.resolve(shotId);
        setResults((current) => [...current, hit ? `${label}: ${HIT_REMINDER}` : `${label}: miss.`]);
        props.onChange();
    };

    return (
        <StandardModal show={true} onClose={props.onClose} title="Space turn: anti-orbital shots">
            {results.map((line, index) => <div key={index}>{line}</div>)}
            {due.length === 0 ? <p>No shots left to resolve.</p> : null}
            {due.map((shot) => {
                const outcome = outcomes[shot.id] ?? "in-hex";
                const label = `${shot.unitName}: ${shot.weaponName} at hex ${shot.aimedHex}${shot.targetName ? ` (${shot.targetName})` : ""}`;
                return (
                    <fieldset className="fieldset" key={shot.id}>
                        <legend>{label}</legend>
                        <label htmlFor={`${id}-${shot.id}`}>What happened</label>
                        <select id={`${id}-${shot.id}`} value={outcome}
                            onChange={(e) => {
                                const value = e.currentTarget.value as ResolutionOutcome;
                                setOutcomes((current) => ({ ...current, [shot.id]: value }));
                            }}>
                            {(Object.keys(RESOLUTION_ROLLS) as ResolutionOutcome[]).map((key) => (
                                <option key={key} value={key}>{RESOLUTION_ROLLS[key].label}</option>
                            ))}
                        </select>
                        <div><strong>{RESOLUTION_ROLLS[outcome].roll}</strong></div>
                        <button className="btn btn-sm btn-primary" disabled={outcome === "two-plus"} onClick={() => record(shot.id, label, true)}>Hit</button>
                        <button className="btn btn-sm btn-secondary" onClick={() => record(shot.id, label, false)}>Miss</button>
                    </fieldset>
                );
            })}
        </StandardModal>
    );
}
