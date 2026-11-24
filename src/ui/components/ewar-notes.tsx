import * as React from 'react';
import type { BattleMechForce } from '../../classes/battlemech-force';
import { getEWarPlayRules, getRulesEdition } from '../../data/rules-editions';
import {
    AeroEcmClass, EWarKind, IEWarAttack, IEWarCarrier, hasC3Gear, setEWarFlag, getEWarAeroEcm, getEWarC3Range, getEWarEccmSuites, setEWarOverride, getEWarStealthToHit, getEWarEcmMode, getEWarModeOptions, getEWarNotes,
    getPersonalEcmCover, isEWarStealthOn, isInHostileEcm, setEWarEcmMode, setEWarStealth, getInfantryNarcLeft, fireInfantryNarc,
} from '../../utils/ewar-play';

const TARGET_STEALTH: [EWarKind, string][] = [
    ["stealth-armor", "Stealth armor"], ["null-sig", "Null-Signature"], ["void-sig", "Void-Signature"], ["chameleon", "Chameleon LPS"], ["mimetic", "Mimetic armor"],
    ["stealth-ba", "BA stealth (basic or prototype)"], ["stealth-ba-standard", "BA stealth (standard)"], ["stealth-ba-improved", "BA stealth (improved)"], ["stealth-ba-achileus", "Achileus"], ["stealth-ba-infiltrator", "Infiltrator"], ["stealth-ba-infiltrator-mk2", "Infiltrator Mk. II"], ["sneak-camo", "Sneak suit (camo)"], ["sneak-ir", "Sneak suit (IR)"], ["dest-suit", "DEST infiltration suit"],
];

/** The to-hit a stealth target adds to the unit attacks (Phase 2), for the views that have no target dialog of their own. */
const TargetStealth: React.FC<{ unit: IEWarCarrier; attackerInfantry?: boolean; force?: BattleMechForce }> = ({ unit, attackerInfantry, force }) => {
    const [systems, setSystems] = React.useState<EWarKind[]>([]);
    const [band, setBand] = React.useState<NonNullable<IEWarAttack["rangeBand"]>>("medium");
    const [moved, setMoved] = React.useState(0);
    const mods = getEWarStealthToHit(unit, { target: { stealth: systems.map((kind) => ({ kind, moved })) }, rangeBand: band, attackerInfantry });
    const total = mods.reduce((sum, mod) => sum + mod.modifier, 0);
    return (
        <fieldset data-testid="ewar-target-stealth">
            <legend>Attacking a stealth target</legend>
            {TARGET_STEALTH.map(([kind, name]) => (
                <label key={kind} className="d-block">
                    <input type="checkbox" data-testid={`ewar-target-${kind}`} checked={systems.includes(kind)}
                        onChange={(e) => setSystems(e.currentTarget.checked ? [...systems, kind] : systems.filter((item) => item !== kind))} />
                    {" "}Target has {name} on
                </label>
            ))}
            <label className="d-block">
                Range{" "}
                <select data-testid="ewar-target-band" value={band} onChange={(e) => setBand(e.currentTarget.value as NonNullable<IEWarAttack["rangeBand"]>)}>
                    {["short", "medium", "long", "extreme"].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
            </label>
            {force ? <TargetC3 unit={unit} force={force} band={band} /> : null}
            <label className="d-block">
                Target moved (hexes){" "}
                <input type="number" min={0} style={{ width: "5em" }} value={moved} onChange={(e) => setMoved(Math.max(0, Math.floor(+e.currentTarget.value || 0)))} />
            </label>
            {mods.length > 0 ? <p data-testid="ewar-target-total">To hit {total >= 0 ? "+" : ""}{total}: {mods.map((mod) => mod.label).join(", ")}</p> : null}
        </fieldset>
    );
};

/**
 * The unit place in its C3 network and whether it is linked, with the reason when it is not (Phase 3), and the controls that feed
 * it: which network (and Master) the unit is in, whether hostile ECM, friendly ECCM, an Angel or a Nova suite cover it, a Remote
 * Sensor pod launch, and the ECCM the force has set. Nothing without C3 gear.
 */
const C3Line: React.FC<{ unit: IEWarCarrier; force: BattleMechForce; onChange?: () => void }> = ({ unit, force, onChange }) => {
    const [labels, setLabels] = React.useState<string[]>([]);
    const [podHex, setPodHex] = React.useState("");
    if (!hasC3Gear(unit)) {
        return null;
    }
    const uuid = unit.getUUID();
    const rules = getEWarPlayRules(unit.getRulesEdition());
    if (!unit.getEWarGear().some((gear) => rules?.items[gear.kind]?.c3)) {
        return <p data-testid="ewar-c3-line">C3 is not in {getRulesEdition(unit.getRulesEdition()).name}: no effect.</p>;
    }
    const changed = (): void => { if (onChange) onChange(); };
    const apply = (result: string[]): void => { setLabels(result); changed(); };
    const flag = (field: "inFriendlyEccm" | "hostileAngelEcm" | "hostileNovaEcm", on: boolean): void => {
        setEWarFlag(unit, field, on);
        changed();
    };
    const record = force.c3Records.find((entry) => entry.members.some((member) => member.uuid === uuid));
    const role = record?.members.find((member) => member.uuid === uuid)?.role;
    const status = force.getC3StatusFor(uuid);
    const turns = unit.ewarPlay.c3EmergencyTurns;
    const masters = (record?.members ?? []).filter((member) => member.role === "master" && member.uuid !== uuid);
    const eccm = getEWarEccmSuites(force.getEWarUnits());
    const names = [...new Set([...["A", "B", "C", "D", "E", "F", "G", "H"], record?.name ?? ""].filter(Boolean))];
    const nameOf = (id: string): string => (force.getEWarUnits().find((entry) => entry.getUUID() === id) as { getName?: () => string } | undefined)?.getName?.() || id.slice(0, 8);
    return (
        <div data-testid="ewar-c3-block">
            <p data-testid="ewar-c3-line" aria-live="polite">
                C3: {record ? `network ${record.name} (${role})` : "not in a network"}; {record ? (status.linked ? "linked" : "cut off") : "no link"}
                {record && status.labels.length > 0 ? `: ${status.labels.join(" ")}` : ""}
                {turns ? ` Emergency Master has run ${turns} turn${turns === 1 ? "" : "s"}.` : ""}
            </p>
            <label className="d-block">
                Network{" "}
                <select data-testid="ewar-c3-network" value={record?.name ?? ""} onChange={(e) => apply(force.setC3Network(uuid, e.currentTarget.value))}>
                    <option value="">None</option>
                    {names.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
            </label>
            {record && (role === "slave" || role === "emergency") && masters.length > 0 ? (
                <label className="d-block">
                    Hangs from{" "}
                    <select data-testid="ewar-c3-master" value={record.members.find((member) => member.uuid === uuid)?.master ?? ""}
                        onChange={(e) => { force.setC3MasterOf(uuid, e.currentTarget.value); changed(); }}>
                        <option value="">Any Master</option>
                        {masters.map((master) => <option key={master.uuid} value={master.uuid}>{nameOf(master.uuid)}</option>)}
                    </select>
                </label>
            ) : null}
            <label className="d-block">
                <input type="checkbox" data-testid="ewar-in-hostile-ecm" checked={isInHostileEcm(unit)} disabled={!!unit.isBlueSaviourOn?.()}
                    onChange={(e) => { setEWarOverride(unit, "inHostileEcm", e.currentTarget.checked ? true : undefined); changed(); }} />
                {" "}Inside hostile ECM
            </label>
            {unit.isBlueSaviourOn?.() ? <p data-testid="ewar-blue-saviour-ecm">Blue Saviour on: inside hostile ECM, and ECCM cannot cancel it.</p> : null}
            <label className="d-block">
                <input type="checkbox" data-testid="ewar-in-friendly-eccm" checked={!!unit.ewarPlay.inFriendlyEccm} onChange={(e) => flag("inFriendlyEccm", e.currentTarget.checked)} />
                {" "}Covered by friendly ECCM
            </label>
            <label className="d-block">
                <input type="checkbox" data-testid="ewar-hostile-angel" checked={!!unit.ewarPlay.hostileAngelEcm} onChange={(e) => flag("hostileAngelEcm", e.currentTarget.checked)} />
                {" "}The hostile ECM includes an Angel suite
            </label>
            <label className="d-block">
                <input type="checkbox" data-testid="ewar-hostile-nova" checked={!!unit.ewarPlay.hostileNovaEcm} onChange={(e) => flag("hostileNovaEcm", e.currentTarget.checked)} />
                {" "}The hostile ECM includes a Nova suite
            </label>
            {record && unit.getEWarGear().some((gear) => gear.kind === "c3-remote-sensor" && !gear.destroyed) ? (
                <label className="d-block">
                    Remote Sensor pod hex{" "}
                    <input type="text" data-testid="ewar-pod-hex" style={{ width: "6em" }} value={podHex} onChange={(e) => setPodHex(e.currentTarget.value.slice(0, 8))} />
                    {" "}<button type="button" className="btn btn-sm btn-secondary" data-testid="ewar-pod-fire" disabled={!podHex}
                        onClick={() => { apply(force.addC3SensorPod(record.name, podHex)); setPodHex(""); }}>Fire pod</button>
                </label>
            ) : null}
            <p data-testid="ewar-force-eccm">Force ECCM from units in ECCM mode: {eccm.suites} suite{eccm.suites === 1 ? "" : "s"}{eccm.angel ? " plus an Angel suite" : ""} (the friendly ECCM count on the target).</p>
            {labels.length > 0 ? <p className="text-danger" data-testid="ewar-c3-labels" role="alert">{labels.join(" ")}</p> : null}
        </div>
    );
};

/** The C3 range a target calculator applies: the nearest networked unit band against the attacker own (Phase 3). */
const TargetC3: React.FC<{ unit: IEWarCarrier; force: BattleMechForce; band: NonNullable<IEWarAttack["rangeBand"]> }> = ({ unit, force, band }) => {
    const [nearest, setNearest] = React.useState<"" | NonNullable<IEWarAttack["rangeBand"]>>("");
    if (!hasC3Gear(unit)) {
        return null;
    }
    const mods = nearest ? getEWarC3Range(unit, { c3: { nearestRangeBand: nearest, ownRangeBand: band, status: force.getC3StatusFor(unit.getUUID()) }, rangeBand: band }) : [];
    const total = mods.reduce((sum, mod) => sum + mod.modifier, 0);
    return (
        <div className="d-block">
            <label>
                Nearest networked unit to the target is at{" "}
                <select data-testid="ewar-target-c3" value={nearest} onChange={(e) => setNearest(e.currentTarget.value as typeof nearest)}>
                    <option value="">C3 not used</option>
                    {["short", "medium", "long", "extreme"].map((item) => <option key={item} value={item}>{item} range</option>)}
                </select>
            </label>
            {mods.length > 0 ? <p aria-live="polite" data-testid="ewar-target-c3-result">To hit {total >= 0 ? "+" : ""}{total}: {mods.map((mod) => mod.label).join(", ")}</p> : null}
        </div>
    );
};

/** Hostile ECM hexes on the line of fire between aerospace craft (SO pp.99-100, TW p.238); only where the edition prints the rule. */
const AeroEcmBlock: React.FC<{ unit: IEWarCarrier; aero: AeroEcmClass }> = ({ unit, aero }) => {
    const [counts, setCounts] = React.useState<Record<AeroEcmClass, number>>({ fighter: 0, "small-craft": 0, "large-craft": 0 });
    const [mapsheet, setMapsheet] = React.useState<"aero" | "ground">("aero");
    const [eccm, setEccm] = React.useState(0);
    const [tuned, setTuned] = React.useState(false);
    const fields = (Object.keys(counts) as AeroEcmClass[]).flatMap((klass) => Array.from({ length: counts[klass] }, (_, index) => ({ hex: `${klass}-${index}`, class: klass })));
    const ownHex = fields.find((field) => field.class !== "large-craft")?.hex;
    const mods = getEWarAeroEcm(unit, { fields, attackerClass: aero, mapsheet, eccm: aero === "large-craft" ? (eccm > 0 ? { roll: eccm } : undefined) : tuned ? "tuned" : undefined, ownHex });
    return (
        <fieldset data-testid="ewar-aero-ecm">
            <legend>Hostile aerospace ECM on the line of fire</legend>
            {(Object.keys(counts) as AeroEcmClass[]).map((klass) => (
                <label key={klass} className="d-block">
                    {klass.replace("-", " ")} ECM hexes{" "}
                    <input type="number" min={0} style={{ width: "5em" }} data-testid={`ewar-aero-${klass}`} value={counts[klass]}
                        onChange={(e) => setCounts({ ...counts, [klass]: Math.max(0, Math.floor(+e.currentTarget.value || 0)) })} />
                </label>
            ))}
            <label className="d-block">
                Map{" "}
                <select data-testid="ewar-aero-map" value={mapsheet} onChange={(e) => setMapsheet(e.currentTarget.value as "aero" | "ground")}>
                    <option value="aero">Aerospace map</option>
                    <option value="ground">Ground mapsheet</option>
                </select>
            </label>
            {aero === "large-craft" ? (
                <label className="d-block">
                    ECCM Control Roll margin{" "}
                    <input type="number" min={0} style={{ width: "5em" }} data-testid="ewar-aero-eccm" value={eccm} onChange={(e) => setEccm(Math.max(0, Math.floor(+e.currentTarget.value || 0)))} />
                </label>
            ) : (
                <label className="d-block">
                    <input type="checkbox" data-testid="ewar-aero-tuned" checked={tuned} onChange={(e) => setTuned(e.currentTarget.checked)} />
                    {" "}My suite is tuned to ECCM (cancels fighter and Small Craft ECM in my own hex, the first one counted, and takes 1 off one Large Craft)
                </label>
            )}
            {mods.map((mod) => <p key={mod.label} data-testid="ewar-aero-result">{mod.modifier >= 0 ? "+" : ""}{mod.modifier}: {mod.label}</p>)}
        </fieldset>
    );
};

/**
 * The "Personal" ECM hex (Pleiades Mechworks, Phase 4): the carrier names the other force units that share its hex, and each of
 * those shows that a working Personal ECM covers it (a Guardian for its own hex only, so no ECCM and no ghost targets).
 */
const PersonalEcmBlock: React.FC<{ unit: IEWarCarrier; force: BattleMechForce; onChange: () => void }> = ({ unit, force, onChange }) => {
    const uuid = unit.getUUID();
    const nameOf = (id: string): string => (force.getEWarUnits().find((entry) => entry.getUUID() === id) as { getName?: () => string } | undefined)?.getName?.() || id.slice(0, 8);
    const carrier = unit.getEWarGear().some((gear) => gear.kind === "ecm-personal" && !gear.destroyed);
    const mates = force.ewarBoard.personalEcm?.[uuid] ?? [];
    const covering = (getPersonalEcmCover(force.ewarBoard, force.getEWarUnits()).get(uuid) ?? []).filter((id) => id !== uuid);
    return (
        <div data-testid="ewar-personal-ecm">
            {covering.length > 0 ? <p data-testid="ewar-personal-ecm-cover">Inside friendly ECM: Personal ECM of {covering.map(nameOf).join(", ")} (its hex only).</p> : null}
            {carrier ? (
                <fieldset>
                    <legend>Personal ECM: units in this hex</legend>
                    {force.getEWarUnits().filter((entry) => entry.getUUID() !== uuid).map((entry) => (
                        <label key={entry.getUUID()} className="d-block">
                            <input type="checkbox" data-testid={`ewar-personal-mate-${entry.getUUID()}`} checked={mates.includes(entry.getUUID())}
                                onChange={(e) => { force.setPersonalEcmMates(uuid, e.currentTarget.checked ? [...mates, entry.getUUID()] : mates.filter((id) => id !== entry.getUUID())); onChange(); }} />
                            {" "}{nameOf(entry.getUUID())}
                        </label>
                    ))}
                </fieldset>
            ) : null}
        </div>
    );
};

const MODE_LABELS = { ecm: "ECM", eccm: "ECCM", ghost: "Ghost targets", off: "Off" } as const;

/**
 * What the unit E-War gear does under its own rules edition (#642): one note per working item, and, when the view passes
 * `onChange`, the switches for its stealth systems and the mode of each ECM suite. Nothing when it carries none.
 */
const EWarNotes: React.FC<{ unit: IEWarCarrier; onChange?: () => void; targetCalculator?: boolean; attackerInfantry?: boolean; force?: BattleMechForce; aero?: AeroEcmClass }> = ({ unit, onChange, targetCalculator = true, attackerInfantry, force, aero }) => {
    const notes = getEWarNotes(unit);
    const rules = getEWarPlayRules(unit.getRulesEdition());
    const gear = unit.getEWarGear().filter((item) => !item.destroyed);
    const stealth = onChange && rules ? gear.filter((item) => rules.items[item.kind]?.stealthHeat !== undefined) : [];
    // ECM suites, EW Equipment, and one switch for a communications set (its first working record carries the set mode).
    const ecm = onChange && rules ? gear.filter((item, index) => (item.kind.startsWith("ecm-") || item.kind === "ew-equipment") && getEWarModeOptions(unit, item).length > 0 && rules.items[item.kind]?.ecmRadius !== undefined
        || (item.kind === "communications" && gear.findIndex((other) => other.kind === "communications") === index && getEWarModeOptions(unit, item).length > 1)) : [];
    const hasStealthRules = !!rules && Object.values(rules.items).some((item) => item?.stealthMods || item?.stealthMoveMods);
    const calculator = targetCalculator && hasStealthRules;
    const hasC3 = !!force && !!hasC3Gear(unit);
    const showAero = !!aero && !!rules?.items["ecm-guardian"]?.aeroEcm;
    const showPersonal = !!force && !!rules?.items["ecm-personal"] && (unit.getEWarGear().some((item) => item.kind === "ecm-personal" && !item.destroyed)
        || (getPersonalEcmCover(force.ewarBoard, force.getEWarUnits()).get(unit.getUUID()) ?? []).some((id) => id !== unit.getUUID()));
    if (notes.length === 0 && stealth.length === 0 && ecm.length === 0 && !calculator && !hasC3 && !showAero && !showPersonal) {
        return null;
    }
    const changed = (): void => {
        // A suite switched on or off changes who a Personal ECM covers: write the board onto the units again.
        force?.refreshEWarBoard();
        if (onChange) {
            onChange();
        }
    };
    return (
        <div className="alert alert-sm alert-info" data-testid="ewar-notes">
            <strong>E-War</strong>
            <ul>
                {notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
            {stealth.map((item, index) => (
                <label key={`stealth-${item.uuid ?? item.kind}-${index}`} className="d-block">
                    <input
                        type="checkbox"
                        data-testid={`ewar-stealth-${item.uuid ?? item.kind}`}
                        checked={isEWarStealthOn(unit, item)}
                        onChange={(e) => { setEWarStealth(unit, item, e.currentTarget.checked); changed(); }}
                    />
                    {" "}{item.name} on
                </label>
            ))}
            {ecm.map((item, index) => (
                <label key={`ecm-${item.uuid ?? item.kind}-${index}`} className="d-block">
                    {item.name} mode{" "}
                    <select
                        data-testid={`ewar-mode-${item.uuid ?? item.kind}`}
                        value={getEWarEcmMode(unit, item)}
                        onChange={(e) => { setEWarEcmMode(unit, item, e.currentTarget.value as "ecm" | "eccm" | "ghost" | "off"); changed(); }}
                    >
                        {getEWarModeOptions(unit, item).map((mode) => <option key={mode} value={mode}>{MODE_LABELS[mode]}</option>)}
                    </select>
                </label>
            ))}
            {showPersonal && force ? <PersonalEcmBlock unit={unit} force={force} onChange={changed} /> : null}
            {hasC3 && force ? <C3Line unit={unit} force={force} onChange={changed} /> : null}
            {calculator ? <TargetStealth unit={unit} attackerInfantry={attackerInfantry} force={force} /> : null}
            {showAero && aero ? <AeroEcmBlock unit={unit} aero={aero} /> : null}
            {(unit.getNarcLaunchers?.() ?? 0) > 0 ? (
                <p data-testid="ewar-infantry-narc">
                    Disposable Narc launchers left: {getInfantryNarcLeft(unit)} of {unit.getNarcLaunchers?.()} (each fires once; the platoon fires no other weapon that phase, MT p.40){" "}
                    <button type="button" className="btn btn-sm btn-secondary" data-testid="ewar-infantry-narc-fire" disabled={getInfantryNarcLeft(unit) === 0}
                        onClick={() => { fireInfantryNarc(unit); changed(); }}>Fire one</button>
                </p>
            ) : null}
        </div>
    );
};

export default EWarNotes;
