import { IEWarDefenseRule, getEWarPlayRules, getRulesEdition } from "../data/rules-editions";

/**
 * Electronic warfare in play: the kinds of E-War gear, the per-unit play state and the structural carrier the unit
 * classes and the force board share. Phase 0 holds the types and `getEWarKind`; the rule functions that turn gear and
 * state into to-hit and cluster modifiers (`getEWarToHit`, `getEWarClusterShift`, `getEWarNotes`) come in a later task,
 * and in Phase 0 they return no modifiers. No React or unit-class imports, so every unit class can use it.
 */

export type EWarKind =
    | "ams" | "laser-ams" | "apds" | "chaff-pod"
    | "artemis-iv" | "artemis-v" | "artemis-prototype" | "apollo"
    | "narc" | "inarc" | "tag" | "light-tag"
    | "ecm-guardian" | "ecm-guardian-prototype" | "ecm-angel" | "ecm-clan" | "ecm-watchdog" | "ecm-nova" | "ecm-personal" | "ecm-infantry"
    | "probe-beagle" | "probe-beagle-prototype" | "probe-bloodhound" | "probe-clan" | "probe-light"
    | "c3-master" | "c3-slave" | "c3-boosted-master" | "c3-boosted-slave" | "c3-emergency-master" | "c3i"
    | "c3-remote-sensor" | "c3-naval" | "c3-modular"
    | "stealth-armor" | "stealth-vehicular" | "stealth-ba"
    | "null-sig" | "void-sig" | "chameleon" | "mimetic" | "communications" | "ew-equipment"
    // Target-side stealth armor types the play views let the player tick (never gear a unit carries).
    | "stealth-ba-standard" | "stealth-ba-improved" | "stealth-ba-achileus" | "stealth-ba-infiltrator" | "stealth-ba-infiltrator-mk2"
    | "sneak-camo" | "sneak-ir" | "dest-suit";

/** One piece of E-War gear on a unit, as the play panel and the rules read it. */
export interface IEWarGear {
    kind: EWarKind;
    tag: string;
    name: string;
    uuid?: string;
    location?: string;
    destroyed: boolean;
}

/** What a unit has switched on, been hit by or been told by the force board; every field is optional. */
export interface IEWarPlayState {
    /** Gear uuid, or kind, to on. */
    ecmOn?: Record<string, boolean>;
    ecmMode?: Record<string, "ecm" | "eccm" | "ghost">;
    /** Stealth system on, by gear uuid (or kind where the gear has none); "*" is a pre-Phase-2 save's single switch. */
    stealthOn?: Record<string, boolean>;
    c3On?: boolean;
    /** Turns this Emergency Master has acted as Master (it stops at the edition limit, 6; turns in hostile ECM do not count). */
    c3EmergencyTurns?: number;
    /** Infantry disposable Narc launchers fired so far (each fires once). */
    narcFired?: number;
    /** Inside friendly ECCM cover (cancels hostile ECM on this unit, where the edition has an ECCM mode). */
    inFriendlyEccm?: boolean;
    /** The hostile ECM on this unit includes an Angel suite / a Nova suite (they beat Boosted C3 / a Nova link). */
    hostileAngelEcm?: boolean;
    hostileNovaEcm?: boolean;
    inHostileEcm?: boolean;
    inFriendlyEcm?: boolean;
    /** Carriers (uuids) whose "Personal" ECM covers this unit because it shares their hex; written by the force board. */
    personalEcmOf?: string[];
    narcPods?: { kind: "narc" | "inarc"; pod: string; turn: number }[];
    tagged?: boolean;
    /** Missile attacks each anti-missile item (by gear uuid) has engaged this turn; cleared by Next Turn. */
    amsUses?: Record<string, number>;
    /** Heat the unit E-War items made this turn (anti-missile systems); counts in the turn heat and is cleared by Next Turn. */
    heat?: number;
    /** Power-dial setting by weapon uuid (the Bombast Laser, #645); none kept is the top setting. */
    dialSettings?: Record<string, number>;
    /** Field names set by hand over the board. */
    overrides?: string[];
}

/** A clean play state from a saved one; a pre-Phase-2 boolean `stealthOn: true` becomes the any-system key. */
export function normalizeEWarPlay(raw: unknown): IEWarPlayState {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return {};
    }
    const state = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
    if (state.stealthOn === true) {
        state.stealthOn = { "*": true };
    } else if (!state.stealthOn || typeof state.stealthOn !== "object" || Array.isArray(state.stealthOn)) {
        delete state.stealthOn;
    }
    return state as IEWarPlayState;
}

/** Whether `gear` (a stealth system) is switched on for `unit`. */
export function isEWarStealthOn(unit: { ewarPlay: IEWarPlayState } | IEWarCarrier, gear: IEWarGear): boolean {
    // Battle armor stealth on a heavy non-battle-armor unit does nothing (Ghosts of Obeedah p.55).
    if ("getRulesEdition" in unit && isBaGearDisabled(unit, gear)) {
        return false;
    }
    const on = unit.ewarPlay.stealthOn;
    return !!on && (!!on["*"] || !!on[gear.uuid ?? gear.kind]);
}

/** A unit that carries E-War gear in play. */
export interface IEWarCarrier {
    getUUID(): string;
    getRulesEdition(): string;
    getEWarGear(): IEWarGear[];
    ewarPlay: IEWarPlayState;
    /** Weight in tons, where the unit class has one (the Naval C3 minimum). */
    getTonnage?(): number;
    /** Troopers in a battle armor squad (a squad under three cannot join a C3 network). */
    getSquadSize?(): number;
    /** Troopers a battle armor squad has left (a squad under three cannot stay in a C3 network). */
    getActiveTroopers?(): number;
    /** Disposable Narc launchers an infantry platoon carries (Maximum Tech p.40). */
    getNarcLaunchers?(): number;
    /** A Pleiades Mechworks Blue Saviour Dispersion Field that is switched on: missiles are met as by an anti-missile system and the unit is inside hostile ECM that ECCM cannot negate. */
    isBlueSaviourOn?(): boolean;
}

/** What an attack is, for the E-War effects that apply to it. */
export interface IEWarAttack {
    weaponUuid?: string;
    ammoTag?: string;
    hostileEcmOnLine?: boolean;
    friendlyEccmOnLine?: boolean;
    /** The hostile ECM on the line includes an Angel suite (spoils Streak locks). */
    hostileAngelEcm?: boolean;
    /** The target (the Narc pod) is inside hostile ECM. */
    targetInHostileEcm?: boolean;
    /** The missile launcher firing, when the weapon is one. */
    launcher?: { family: "lrm" | "srm" | "mrm" | "streak" | "other"; size: number; indirect?: boolean };
    target?: {
        stealthOn?: boolean; narcPods?: string[]; tagged?: boolean; ams?: boolean; ecm?: boolean;
        /** The target's active stealth systems; `moved` is the hexes it moved (Void-Signature, Mimetic). */
        stealth?: { kind: EWarKind; moved?: number }[];
    };
    /** The range band of the attack, for the stealth tables. */
    rangeBand?: "short" | "medium" | "long" | "extreme";
    /** The attacker is infantry: infantry attackers ignore the IR effects of sneak suits (TO:AUE p.130). */
    attackerInfantry?: boolean;
    /** C3: the range band of the nearest networked unit, the attacker own band, and the attacker link status (see getC3Status). */
    /** Aerospace ECM: the hostile fields on the line of fire (see getEWarAeroEcm). */
    aero?: IEWarAeroEcmContext;
    c3?: { nearestRangeBand: "short" | "medium" | "long" | "extreme"; ownRangeBand: "short" | "medium" | "long" | "extreme"; status: IC3Status; nearestInEcm?: boolean };
}

/** One to-hit or cluster modifier with its label. */
export interface IEWarModifier {
    modifier: number;
    label: string;
}

const SUFFIX_KINDS: [string, EWarKind][] = [
    ["-artemis-iv", "artemis-iv"],
    ["-artemis-v", "artemis-v"],
    ["-artemis-p", "artemis-prototype"],
    ["-apollo", "apollo"],
];

const EXACT_KINDS: Record<string, EWarKind> = {
    "is-ams": "ams", "clan-ams": "ams",
    "is-laser-ams": "laser-ams", "clan-laser-ams": "laser-ams",
    "is-risc-apds": "apds",
    "narc": "narc", "clan-narc": "narc", "narc-os": "narc", "prototype-narc": "narc",
    "is-compact-narc": "narc", "clan-compact-narc": "narc",
    "clan-narc-os": "narc", "narc-ios": "narc", "clan-narc-ios": "narc", "narc-missile-beacon": "narc", "improved-narc-launcher": "inarc",
    "inarc": "inarc", "inarc-os": "inarc", "custom-er-inarc": "inarc",
    "is-tag": "tag", "clan-tag": "tag", "prototype-tag": "tag",
    // Maximum Tech p.40 infantry field gear (disposable Narc launcher, TAG).
    "inf-field-narc": "narc", "inf-field-tag": "tag",
    "clan-light-tag": "light-tag", "is-light-tag": "light-tag", "ba-is-light-tag": "light-tag", "ba-clan-light-tag": "light-tag",
    "ecm-suite": "ecm-guardian", "is-ecm-suite": "ecm-guardian", "ba-is-ecm-suite": "ecm-guardian", "guardian-ecm-suite": "ecm-guardian",
    "clan-ecm-suite": "ecm-clan", "ba-clan-ecm-suite": "ecm-clan",
    "guardian-ecm-prototype": "ecm-guardian-prototype",
    "angel-ecm": "ecm-angel", "is-angel-ecm": "ecm-angel", "clan-angel-ecm": "ecm-angel", "ba-is-angel-ecm": "ecm-angel", "ba-clan-angel-ecm": "ecm-angel",
    "clan-ecm-system": "ecm-clan",
    "clan-watchdog-cews": "ecm-watchdog",
    "clan-nova-cews": "ecm-nova",
    "custom-personal-ecm": "ecm-personal",
    "inf-armor-sneak-suit-ecm": "ecm-infantry", "inf-armor-sneak-suit-camo-ecm": "ecm-infantry", "inf-armor-sneak-suit-ir-ecm": "ecm-infantry", "inf-armor-sneak-suit-camo-ir-ecm": "ecm-infantry",
    // Battle armor probes follow the 'Mech probe rules (TM p.252, TW p.129): the Inner Sphere suit probe has the Beagle's range 4, the Clan one 5.
    "beagle-active-probe": "probe-beagle", "is-active-probe": "probe-beagle", "ba-is-active-probe": "probe-beagle",
    "beagle-active-probe-prototype": "probe-beagle-prototype",
    "bloodhound-active-probe": "probe-bloodhound",
    "clan-active-probe": "probe-clan", "ba-clan-active-probe": "probe-clan",
    "clan-light-active-probe": "probe-light",
    "c3-computer-master": "c3-master",
    "c3-computer-slave": "c3-slave",
    "is-c3-system": "c3-slave", "ba-is-c3-system": "c3-slave",
    "c3-boosted-master": "c3-boosted-master",
    "c3-boosted-slave": "c3-boosted-slave",
    "c3-emergency-master": "c3-emergency-master",
    "c3i-computer": "c3i",
    "is-improved-c3-system": "c3i", "ba-is-improved-c3-system": "c3i",
    "c3-remote-sensor-launcher": "c3-remote-sensor",
    "naval-c3": "c3-naval",
    "chaff-pod": "chaff-pod",
    "custom-modular-c3": "c3-modular", "custom-chaff-pod-2": "chaff-pod",
    "stealth-basic": "stealth-armor",
    "vehicular-stealth": "stealth-vehicular",
    "ba-stealth-basic": "stealth-ba", "ba-stealth-improved": "stealth-ba", "ba-stealth-prototype": "stealth-ba", "ba-stealth-standard": "stealth-ba",
    // Battle-armor-only armor record (TM p.252); no book prints an Improved stealth armor for BattleMechs or vehicles.
    "stealth-improved": "stealth-ba",
    "null-signature-system": "null-sig", "custom-null-signature-system": "null-sig",
    "void-signature-system": "void-sig",
    "chameleon-lps": "chameleon",
    "mimetic": "mimetic", "ba-mimetic": "mimetic",
    "communications-equipment": "communications",
    "ew-equipment": "ew-equipment",
};

/** The E-War kind of a catalog equipment tag, or null for anything else. A "micro-" prefix is dropped first. */
export function getEWarKind(tag: string): EWarKind | null {
    const bare = tag.startsWith("micro-") ? tag.slice("micro-".length) : tag;
    if (Object.prototype.hasOwnProperty.call(EXACT_KINDS, bare)) {
        return EXACT_KINDS[bare];
    }
    if (bare.startsWith("ammo-")) {
        return null;
    }
    for (const [suffix, kind] of SUFFIX_KINDS) {
        if (bare.endsWith(suffix)) {
            return kind;
        }
    }
    return null;
}

/*
 * The rule functions. Phase 0 enters no rules, so each returns no modifiers: under an edition with no E-War rules, and
 * under one with rules alike. Later phases fill them from the books.
 */

const KIND_TITLES: Partial<Record<EWarKind, string>> = {
    "artemis-iv": "Artemis IV", "artemis-v": "Artemis V", "artemis-prototype": "Artemis IV (prototype)", apollo: "Apollo", narc: "Narc pod", inarc: "iNarc pod",
};

const signed = (value: number): string => (value > 0 ? `+${value}` : `${value}`);

/** Why the item cannot combine with this attack, or null. */
function getExclusion(excludes: string[] | undefined, attack: IEWarAttack): string | null {
    if (!excludes) {
        return null;
    }
    const ammo = attack.ammoTag ?? "";
    const reasons: [string, boolean][] = [
        ["streak", attack.launcher?.family === "streak"],
        ["narc", ammo.includes("narc")],
        ["artemis", ammo.includes("artemis")],
        ["swarm", ammo.includes("swarm")],
        ["thunder", ammo.includes("thunder")],
        ["indirect", !!attack.launcher?.indirect],
    ];
    const hit = reasons.find(([name, applies]) => applies && excludes.includes(name));
    return hit ? hit[0] : null;
}

/** Hostile ECM cancels the item on this attack: anywhere on the line, or for a pod (TW, CRB Narc) only when the target is inside it. */
function podEcmBlocked(item: { ecmBlocks?: boolean; ecmPodOnly?: boolean }, attack: IEWarAttack): boolean {
    if (!item.ecmBlocks || attack.friendlyEccmOnLine) {
        return false;
    }
    return item.ecmPodOnly ? !!attack.targetInHostileEcm : !!attack.hostileEcmOnLine;
}

/** One item row of the cluster-shift list: its shift, or a zero modifier saying why there is none. */
function clusterEntry(kind: EWarKind, attack: IEWarAttack, rules: NonNullable<ReturnType<typeof getEWarPlayRules>>): IEWarModifier {
    const title = KIND_TITLES[kind] ?? kind;
    const item = rules.items[kind];
    if (!item || item.clusterShift === undefined) {
        return { modifier: 0, label: `${title}: not in this edition` };
    }
    const excluded = getExclusion(item.excludes, attack);
    if (excluded) {
        return { modifier: 0, label: `${title}: not with ${excluded === "streak" ? "Streak" : excluded}` };
    }
    if (podEcmBlocked(item, attack)) {
        return { modifier: 0, label: `${title}: hostile ECM` };
    }
    return { modifier: item.clusterShift, label: `${title} (${signed(item.clusterShift)})` };
}

/**
 * Cluster-table shifts E-War gives an attack by `attacker`: Artemis IV/V/prototype and Apollo from the firing launcher,
 * a Narc or iNarc pod from the target. A zero modifier carries the reason the item does nothing. Nothing under an edition
 * with no E-War rules, and nothing for a destroyed item.
 */
export function getEWarClusterShift(attacker: IEWarCarrier, attack: IEWarAttack): IEWarModifier[] {
    const rules = getEWarPlayRules(attacker.getRulesEdition());
    if (!rules) {
        return [];
    }
    const shifts: IEWarModifier[] = [];
    if (rules.mrm?.clusterBase && attack.launcher?.family === "mrm") {
        shifts.push({ modifier: rules.mrm.clusterBase, label: `MRM (${signed(rules.mrm.clusterBase)})` });
    }
    const weapon = attack.weaponUuid ? attacker.getEWarGear().find(gear => gear.uuid === attack.weaponUuid) : undefined;
    if (weapon && !weapon.destroyed) {
        if (weapon.kind === "artemis-iv" || weapon.kind === "artemis-v") {
            const wanted = weapon.kind === "artemis-iv" ? "-artemis-iv" : "-artemis-v";
            if (attack.ammoTag && !attack.ammoTag.includes(wanted)) {
                shifts.push({ modifier: 0, label: `${KIND_TITLES[weapon.kind]}: not loaded with Artemis ammunition` });
            } else {
                shifts.push(clusterEntry(weapon.kind, attack, rules));
            }
        } else if (weapon.kind === "artemis-prototype" || weapon.kind === "apollo") {
            const entry = clusterEntry(weapon.kind, attack, rules);
            // Where the book gives a plain MRM its own -1, the Apollo entry is the removal of that -1.
            shifts.push(weapon.kind === "apollo" && rules.mrm?.clusterBase && entry.modifier ? { ...entry, label: `Apollo (${signed(entry.modifier)}, removes the MRM -1)` } : entry);
        }
    }
    // Only Narc-capable missiles (a missile launcher loaded with Narc ammunition) home on a Narc or iNarc homing pod.
    if (attack.launcher && attack.target?.narcPods?.some(pod => pod === "narc" || pod === "homing")) {
        shifts.push(attack.ammoTag?.includes("narc")
            ? clusterEntry("narc", attack, rules)
            : { modifier: 0, label: "Narc pod: needs Narc-capable missiles" });
    }
    return shifts;
}

/** True when this attack is ECM-blocked for an item that ECM cancels. */
function ecmCancels(attack: IEWarAttack): boolean {
    return !!attack.hostileEcmOnLine && !attack.friendlyEccmOnLine;
}

/**
 * To-hit modifiers E-War gives an attack by `attacker`: Artemis V (-1) from the launcher, a homing iNarc pod (-1) and,
 * under the Core Rulebook, any Narc pod (-1) from the target. Hostile ECM cancels each of them where the edition says so.
 */
export function getEWarToHit(attacker: IEWarCarrier, attack: IEWarAttack): IEWarModifier[] {
    const stealth = [...getEWarStealthToHit(attacker, attack), ...getEWarC3Range(attacker, attack), ...(attack.aero ? getEWarAeroEcm(attacker, attack.aero) : [])];
    const rules = getEWarPlayRules(attacker.getRulesEdition());
    if (!rules) {
        return stealth;
    }
    const modifiers: IEWarModifier[] = [...stealth];
    const weapon = attack.weaponUuid ? attacker.getEWarGear().find(gear => gear.uuid === attack.weaponUuid) : undefined;
    // The catalog MRM carries the +1 of the Total Warfare family (its Apollo records already drop it); a book that prints none takes it off a plain MRM.
    if (rules.mrm?.toHit === 0 && attack.launcher?.family === "mrm" && weapon?.kind !== "apollo") {
        modifiers.push({ modifier: -1, label: `MRM: no +1 to-hit in ${rules.mrm.label}` });
    }
    if (weapon && !weapon.destroyed && weapon.kind === "artemis-v") {
        const item = rules.items["artemis-v"];
        if (item?.toHit !== undefined && (!attack.ammoTag || attack.ammoTag.includes("-artemis-v")) && !getExclusion(item.excludes, attack)) {
            modifiers.push(item.ecmBlocks && ecmCancels(attack)
                ? { modifier: 0, label: "Artemis V: hostile ECM" }
                : { modifier: item.toHit, label: `Artemis V (${signed(item.toHit)})` });
        }
    }
    const pods = attack.target?.narcPods ?? [];
    const podEntries: [string, EWarKind, string][] = [["homing", "inarc", "iNarc homing pod"], ["narc", "narc", "Narc pod"]];
    for (const [pod, kind, title] of podEntries) {
        const item = rules.items[kind];
        if (attack.launcher && attack.ammoTag?.includes("narc") && pods.includes(pod) && item?.toHit !== undefined && !getExclusion(item.excludes, attack)) {
            modifiers.push(podEcmBlocked(item, attack)
                ? { modifier: 0, label: `${title}: hostile ECM` }
                : { modifier: item.toHit, label: `${title} (${signed(item.toHit)})` });
        }
    }
    return modifiers;
}

const STEALTH_TITLES: Partial<Record<EWarKind, string>> = {
    "stealth-armor": "Stealth armor", "stealth-vehicular": "Vehicular stealth", "stealth-ba": "Battle armor stealth",
    "null-sig": "Null-Signature", "void-sig": "Void-Signature", chameleon: "Chameleon LPS", mimetic: "Mimetic armor",
    "stealth-ba-standard": "Standard BA stealth", "stealth-ba-improved": "Improved BA stealth", "stealth-ba-achileus": "Achileus",
    "stealth-ba-infiltrator": "Infiltrator", "stealth-ba-infiltrator-mk2": "Infiltrator Mk. II",
    "sneak-camo": "Sneak suit (camo)", "sneak-ir": "Sneak suit (IR)", "dest-suit": "DEST infiltration suit",
};

const RANGE_BANDS = ["short", "medium", "long", "extreme"] as const;

const bandTable = (mods: { short?: number; medium?: number; long?: number; extreme?: number }): string =>
    RANGE_BANDS.filter(band => mods[band]).map(band => `${signed(mods[band]!)} ${band}`).join(", ");

/**
 * What the target's active stealth systems add to the attacker's to-hit number, as the attacker's edition prints each
 * system: a range-band table (Stealth armor, Null-Signature, Chameleon) or a table by hexes the target moved
 * (Void-Signature, Mimetic). Systems add up; a system the edition lacks, or that cannot run with another one the target
 * has on, gives a zero entry saying why.
 */
export function getEWarStealthToHit(attacker: IEWarCarrier, attack: IEWarAttack): IEWarModifier[] {
    const systems = attack.target?.stealth ?? [];
    if (!systems.length) {
        return [];
    }
    const edition = attacker.getRulesEdition();
    const rules = getEWarPlayRules(edition);
    const editionName = getRulesEdition(edition).name;
    const accepted = new Set<EWarKind>();
    const out: IEWarModifier[] = [];
    for (const system of systems) {
        const title = STEALTH_TITLES[system.kind] ?? system.kind;
        const item = rules?.items[system.kind];
        if (!item || (!item.stealthMods && !item.stealthMoveMods)) {
            out.push({ modifier: 0, label: `${title}: not in ${editionName}` });
            continue;
        }
        const clash = item.stealthExcludes?.find(kind => accepted.has(kind))
            ?? [...accepted].find(kind => rules?.items[kind]?.stealthExcludes?.includes(system.kind));
        if (clash) {
            out.push({ modifier: 0, label: `${title}: not with ${STEALTH_TITLES[clash] ?? clash}` });
            continue;
        }
        accepted.add(system.kind);
        if (item.stealthMoveMods && item.stealthMods) {
            // Both tables at once (DEST infiltration suit: camo by movement, IR by range; infantry attackers ignore the IR part).
            const moved = system.moved ?? 0;
            const row = [...item.stealthMoveMods].reverse().find(entry => moved >= entry.hexes);
            const ignoresRange = !!item.stealthRangeIgnoredByInfantry && !!attack.attackerInfantry;
            const rangePart = ignoresRange || !attack.rangeBand ? 0 : item.stealthMods[attack.rangeBand] ?? 0;
            const modifier = (row?.modifier ?? 0) + rangePart;
            const why = [`moved ${moved}`, ignoresRange ? "IR ignored by infantry" : attack.rangeBand ?? "range band not set"].join(", ");
            out.push({ modifier, label: `${title} (${signed(modifier)}: ${why})` });
            continue;
        }
        if (item.stealthMoveMods) {
            const moved = system.moved ?? 0;
            const row = [...item.stealthMoveMods].reverse().find(entry => moved >= entry.hexes);
            const standard = item.replacesMovement ? standardMovementModifier(moved) : 0;
            const modifier = (row?.modifier ?? 0) - standard;
            out.push({ modifier, label: `${title} (${signed(modifier)}, moved ${moved}${standard ? `, replaces the standard +${standard}` : ""})` });
            continue;
        }
        if (item.stealthRangeIgnoredByInfantry && attack.attackerInfantry) {
            out.push({ modifier: 0, label: `${title}: infantry attackers ignore it` });
            continue;
        }
        const band = attack.rangeBand;
        if (!band) {
            out.push({ modifier: 0, label: `${title}: range band not set (${bandTable(item.stealthMods!)})` });
            continue;
        }
        const modifier = item.stealthMods?.[band] ?? 0;
        out.push({ modifier, label: `${title} (${signed(modifier)} ${band})` });
    }
    return out;
}

/** The standard target movement modifier for a target that moved this many hexes. */
function standardMovementModifier(hexes: number): number {
    return hexes >= 25 ? 7 : hexes >= 18 ? 6 : hexes >= 10 ? 5 : hexes >= 7 ? 4 : hexes >= 5 ? 3 : hexes >= 3 ? 2 : hexes >= 1 ? 1 : 0;
}

/** An ECM suite of the unit that is not destroyed (a stealth system needs one, and Angel counts). */
function hasWorkingEcm(unit: IEWarCarrier): boolean {
    return unit.getEWarGear().some(gear => !gear.destroyed && gear.kind.startsWith("ecm-") && gear.kind !== "ecm-personal" && gear.kind !== "ecm-infantry");
}

/** A stealth system that is not destroyed and, where the book needs an ECM suite, has one left. */
function isEWarStealthWorking(unit: IEWarCarrier, gear: IEWarGear): boolean {
    const item = getEWarPlayRules(unit.getRulesEdition())?.items[gear.kind];
    return !gear.destroyed && !!item && (!item.needsEcm || hasWorkingEcm(unit));
}

/**
 * To-hit modifiers E-War puts on the unit own ranged attacks: a Void-Signature that is on (+1), and the +1 of ghost
 * targets made by an Angel suite while stealth armor is on (TO:AR p.100). A stealth system with no ECM suite left gives none.
 */
export function getEWarOwnAttackToHit(unit: IEWarCarrier, _attack: IEWarAttack): IEWarModifier[] {
    const rules = getEWarPlayRules(unit.getRulesEdition());
    const out: IEWarModifier[] = [];
    let armorOn = false;
    for (const gear of unit.getEWarGear()) {
        const own = rules?.items[gear.kind]?.stealthOwnAttack;
        if (own && isEWarStealthWorking(unit, gear) && isEWarStealthOn(unit, gear)) {
            out.push({ modifier: own, label: `${STEALTH_TITLES[gear.kind] ?? gear.kind} (${signed(own)} to own attacks)` });
        }
        if (gear.kind === "stealth-armor" && isEWarStealthWorking(unit, gear) && isEWarStealthOn(unit, gear)) {
            armorOn = true;
        }
    }
    if (armorOn && rules?.items["ecm-guardian"]?.ghostTargets
        && unit.getEWarGear().some(gear => gear.kind === "ecm-angel" && getEWarEcmMode(unit, gear) === "ghost")) {
        out.push({ modifier: 1, label: "Ghost targets with stealth armor (+1 to own attacks)" });
    }
    return out;
}

/** What each working stealth system of `unit` does, one line each with the book and page, for its E-War block. */
export function getEWarStealthNotes(unit: IEWarCarrier): string[] {
    const rules = getEWarPlayRules(unit.getRulesEdition());
    if (!rules) {
        return [];
    }
    const notes: string[] = [];
    const seen = new Set<EWarKind>();
    for (const gear of unit.getEWarGear()) {
        const item = rules.items[gear.kind];
        const title = STEALTH_TITLES[gear.kind];
        if (!item || !title || gear.destroyed || seen.has(gear.kind) || (!item.stealthMods && !item.stealthMoveMods)) {
            continue;
        }
        seen.add(gear.kind);
        const parts: string[] = [];
        if (item.stealthMods) {
            parts.push(`${bandTable(item.stealthMods)} to attacks against this unit`);
        }
        if (item.stealthMoveMods) {
            const rows = item.stealthMoveMods;
            parts.push(`to attacks against this unit by hexes moved: ${rows.map((row, i) => `${row.hexes}${i === rows.length - 1 ? "+" : ""} ${signed(row.modifier)}`).join(", ")}`);
        }
        if (item.needsEcm && !hasWorkingEcm(unit)) {
            parts.push("cannot work without an ECM suite (all destroyed)");
        }
        if (item.stealthHeat) {
            parts.push(`${item.stealthHeat} heat while on`);
        }
        if (item.stealthOwnAttack) {
            parts.push(`${signed(item.stealthOwnAttack)} to its own ranged attacks`);
        }
        if (item.stealthEcm === "switches-off") {
            parts.push("ECM switched off while on");
        } else if (item.stealthEcm === "keeps-working") {
            parts.push("ECM keeps working but the unit suffers as if inside enemy ECM");
        }
        if (item.cutsC3) {
            parts.push("cut off from its C3 network");
        }
        if (item.stealthExcludes?.length) {
            parts.push(`not with ${item.stealthExcludes.map(kind => STEALTH_TITLES[kind] ?? kind).join(", ")}`);
        }
        const finders = Object.entries(rules.items)
            .filter(([kind, probe]) => kind.startsWith("probe-") && probe?.probeFinds?.some(find => find === "stealth" || find === gear.kind))
            .map(([kind]) => kind.replace("probe-", ""));
        if (finders.length) {
            parts.push(`found by ${finders.join(", ")} probes`);
        }
        notes.push(`${title}: ${parts.join("; ")} (${item.book} p.${item.page})`);
    }
    return notes;
}

/**
 * Whether hostile ECM works on a line of fire, from the ECM and ECCM the player counts there. Where the edition has an
 * ECCM mode, one ECCM suite counters one ECM suite (equal or more ECCM and the ECM does not work), an Angel ECM suite is
 * countered only by Angel ECCM, and one Angel ECCM counters any amount of ordinary ECM (TO:AR p.99, MT p.77). Without
 * ECCM in the edition any hostile ECM works. The older single ticks (`hostileEcm`, `friendlyEccm`) still count as one
 * suite each.
 */
export function getEWarEcmEffective(ticks: IEWarTargetTicks, edition: string): { ecmWorks: boolean; label: string } {
    const ordinary = ticks.hostileEcmCount ?? (ticks.hostileEcm ? 1 : 0);
    const angel = !!ticks.hostileAngelEcm;
    if (ordinary <= 0 && !angel) {
        return { ecmWorks: false, label: "No hostile ECM" };
    }
    const eccmItem = getEWarPlayRules(edition)?.items["ecm-guardian"];
    const eccmCount = ticks.friendlyEccmCount ?? (ticks.friendlyEccm ? 1 : 0);
    if (!eccmItem?.eccm) {
        return { ecmWorks: true, label: "Hostile ECM works" };
    }
    if (getEWarPlayRules(edition)?.items["ecm-angel"]?.ecmRatio) {
        // Maximum Tech p.77: an Angel counts as two suites for the ratio, on either side.
        const ecmWorks = ordinary + (angel ? 2 : 0) > eccmCount + (ticks.friendlyAngelEccm ? 2 : 0);
        return { ecmWorks, label: ecmWorks ? "Hostile ECM works" : "Hostile ECM cancelled by ECCM" };
    }
    const angelCounter = !!ticks.friendlyAngelEccm;
    const ordinaryWorks = ordinary > 0 && !angelCounter && ordinary > eccmCount;
    const angelWorks = angel && !angelCounter;
    const ecmWorks = ordinaryWorks || angelWorks;
    return { ecmWorks, label: ecmWorks ? "Hostile ECM works" : "Hostile ECM cancelled by ECCM" };
}

/**
 * The mode a suite of `unit` is in now: "off" when destroyed, switched off, absent from the edition, or shut down by
 * the unit's own stealth system (Stealth armor and Void-Signature switch the ECM off in the editions that say so; TO:AR
 * p.99); otherwise the chosen mode, held to "ecm" when the edition lacks ECCM or ghost targets.
 */
export function getEWarEcmMode(unit: IEWarCarrier, gear: IEWarGear): "ecm" | "eccm" | "ghost" | "off" {
    const rules = getEWarPlayRules(unit.getRulesEdition());
    const item = rules?.items[gear.kind];
    const key = gear.uuid ?? gear.kind;
    if (!rules || !item || gear.destroyed || unit.ewarPlay.ecmOn?.[key] === false || isBaGearDisabled(unit, gear)) {
        return "off";
    }
    if (gear.kind === "communications") {
        return getCommunicationsMode(unit);
    }
    const wanted = gear.kind === "ecm-personal" ? "ecm" : unit.ewarPlay.ecmMode?.[key] ?? "ecm";
    const shutDown = unit.getEWarGear().some(other => !other.destroyed && rules.items[other.kind]?.stealthEcm === "switches-off" && isEWarStealthOn(unit, other));
    // An Angel suite making ghost targets keeps running under stealth armor (TO:AR p.100).
    const ghostException = gear.kind === "ecm-angel" && wanted === "ghost" && !!rules.items["ecm-guardian"]?.ghostTargets;
    if (shutDown && !ghostException) {
        return "off";
    }
    if (wanted === "eccm") {
        return item.eccm || rules.items["ecm-guardian"]?.eccm ? "eccm" : "ecm";
    }
    if (wanted === "ghost") {
        return rules.items["ecm-guardian"]?.ghostTargets ? "ghost" : "ecm";
    }
    return "ecm";
}

/** Tons of communications equipment a unit carries that are not destroyed (the catalog holds one record per ton). */
function getCommunicationsTons(unit: IEWarCarrier): number {
    return unit.getEWarGear().filter((gear) => gear.kind === "communications" && !gear.destroyed).length;
}

/**
 * The mode of a unit communications set (TO:AR pp.99-100): it makes no ECM, so it is off until the player sets ECCM or, from
 * 7 tons, ghost targets; under 3 tons it does nothing. The first working record carries the set mode.
 */
function getCommunicationsMode(unit: IEWarCarrier): "eccm" | "ghost" | "off" {
    const rules = getEWarPlayRules(unit.getRulesEdition());
    const tons = getCommunicationsTons(unit);
    const first = unit.getEWarGear().find((gear) => gear.kind === "communications" && !gear.destroyed);
    if (!rules?.items.communications || !first || tons < 3) {
        return "off";
    }
    const key = first.uuid ?? first.kind;
    const wanted = unit.ewarPlay.ecmMode?.[key];
    if (unit.ewarPlay.ecmOn?.[key] === false || !wanted || !rules.items["ecm-guardian"]?.eccm) {
        return "off";
    }
    return wanted === "ghost" && tons >= 7 && rules.items.communications.ghostByComms && rules.items["ecm-guardian"]?.ghostTargets ? "ghost" : "eccm";
}

/**
 * The ECCM a force sets against hostile ECM, from the suites of `units` in ECCM mode (an Angel suite is flagged apart) and
 * communications equipment (3-6 tons half a suite, 7 tons or more one; TO:AR p.99). Feeds `friendlyEccmCount`.
 */
export function getEWarEccmSuites(units: IEWarCarrier[]): { suites: number; angel: boolean } {
    let suites = 0;
    let angel = false;
    for (const unit of units) {
        const share = getEWarPlayRules(unit.getRulesEdition())?.items.communications?.eccmShare ?? 0.5;
        let commsCounted = false;
        for (const gear of unit.getEWarGear()) {
            if (gear.kind === "communications") {
                if (!commsCounted && getEWarEcmMode(unit, gear) === "eccm") {
                    suites += getCommunicationsTons(unit) >= 7 ? share * 2 : share;
                }
                commsCounted = true;
            } else if ((gear.kind.startsWith("ecm-") || gear.kind === "ew-equipment") && getEWarEcmMode(unit, gear) === "eccm") {
                if (gear.kind === "ecm-angel") {
                    angel = true;
                } else {
                    suites += 1;
                }
            }
        }
    }
    return { suites, angel };
}

/** Suites of `unit` making ghost targets: ECM suites and EW Equipment in ghost mode, and one for a communications set of 7 tons or more. */
function countGhostSuites(unit: IEWarCarrier): number {
    let count = 0;
    let commsCounted = false;
    for (const gear of unit.getEWarGear()) {
        if (gear.kind === "communications") {
            if (!commsCounted && getEWarEcmMode(unit, gear) === "ghost") count += 1;
            commsCounted = true;
        } else if ((gear.kind.startsWith("ecm-") || gear.kind === "ew-equipment") && getEWarEcmMode(unit, gear) === "ghost") {
            count += 1;
        }
    }
    return count;
}

/**
 * Ghost targets (TO:AR p.100): each suite in ghost mode gives +1 to the friendly or enemy target of the phase, up to +3
 * from three suites, when the Piloting/Driving roll passed. An active probe of any kind ignores them.
 */
export function getEWarGhostTargets(unit: IEWarCarrier, passed: boolean, proberPresent: boolean = false): IEWarModifier[] {
    const rules = getEWarPlayRules(unit.getRulesEdition());
    const ghost = rules?.items["ecm-guardian"]?.ghostTargets;
    if (!ghost || !passed || proberPresent) {
        return [];
    }
    const modifier = Math.min(3, countGhostSuites(unit)) * ghost.modifier;
    return modifier ? [{ modifier, label: `Ghost targets (${signed(modifier)})` }] : [];
}

/** Whether a Streak launcher keeps its lock: hostile Angel ECM spoils it where the edition says so (MT p.77, TO:AUE p.91). */
export function getEWarStreakLock(attacker: IEWarCarrier, attack: IEWarAttack): { blocked: boolean; label: string } {
    if (attack.launcher?.family !== "streak" || !attack.hostileAngelEcm) {
        return { blocked: false, label: "" };
    }
    const angel = getEWarPlayRules(attacker.getRulesEdition())?.items["ecm-angel"];
    if (!angel?.ecmCancels?.includes("streak-lock")) {
        return { blocked: false, label: "" };
    }
    return { blocked: true, label: `Streak: no lock inside hostile Angel ECM, fires as a standard launcher (${angel.book} p.${angel.page})` };
}

/** What hostile ECM on the line of fire cancels, in the attacker edition (the labels the play view shows). */
export function getEWarEcmEffects(attacker: IEWarCarrier, attack: IEWarAttack): IEWarModifier[] {
    if (!attack.hostileEcmOnLine || attack.friendlyEccmOnLine) {
        return [];
    }
    const rules = getEWarPlayRules(attacker.getRulesEdition());
    const item = rules?.items["ecm-guardian"] ?? rules?.items["ecm-clan"];
    if (!item?.ecmCancels?.length) {
        return [];
    }
    const cancels = [...item.ecmCancels];
    const angel = rules?.items["ecm-angel"];
    if (attack.hostileAngelEcm && angel?.ecmCancels) {
        cancels.push(...angel.ecmCancels.filter(entry => !cancels.includes(entry)));
    }
    return [{ modifier: 0, label: `Hostile ECM cancels: ${cancels.join(", ")} (${item.book} p.${item.page})` }];
}

const PROBE_TITLES: Partial<Record<EWarKind, string>> = {
    "ew-equipment": "EW Equipment", "probe-beagle": "Beagle", "probe-beagle-prototype": "Beagle (prototype)", "probe-clan": "Clan", "probe-light": "Light", "probe-bloodhound": "Bloodhound", "ecm-watchdog": "Watchdog", "ecm-nova": "Nova CEWS",
};

/** The stealth key a probe must find for each of the target systems (Chameleon is visual only and needs none). */
const STEALTH_FIND: Partial<Record<EWarKind, "stealth" | "null-sig" | "mimetic" | "void-sig">> = {
    "stealth-armor": "stealth", "stealth-vehicular": "stealth", "stealth-ba": "stealth", "null-sig": "null-sig", mimetic: "mimetic", "void-sig": "void-sig",
    "stealth-ba-standard": "stealth", "stealth-ba-improved": "stealth", "stealth-ba-achileus": "stealth", "stealth-ba-infiltrator": "stealth", "stealth-ba-infiltrator-mk2": "stealth",
};

/** The books that keep conventional infantry out of an active probe's reach (BTC p.118, RoW p.114, BMR p.122, BMR(R) p.130). */
const PROBES_MISS_INFANTRY = new Set(["battletech-compendium", "compendium-rules-of-warfare", "master-rules", "master-rules-revised"]);

/** One working probe and what it finds for a given target. */
export interface IEWarProbeResult {
    kind: EWarKind;
    /** Hexes; undefined where the book prints none (Nova CEWS, IO:AE p.60). */
    range: number | undefined;
    detects: boolean;
    reason: string;
}

/**
 * What each working active probe of `unit` finds of a target: its range in hexes from the edition, and whether it
 * detects the target, with the reason when it does not (hostile ECM, a stealth system only the Bloodhound sees, infantry
 * the book leaves out, a unit hidden underwater). A probe the edition has no range for gives no row.
 */
export function getEWarProbe(
    unit: IEWarCarrier,
    target: { stealth?: EWarKind[]; hostileEcm?: boolean; hostileAngelEcm?: boolean; infantry?: "none" | "conventional" | "ecm-sneak" | "camo-sneak"; underwater?: boolean },
): IEWarProbeResult[] {
    const edition = unit.getRulesEdition();
    const rules = getEWarPlayRules(edition);
    if (!rules) {
        return [];
    }
    const results: IEWarProbeResult[] = [];
    for (const gear of unit.getEWarGear()) {
        const item = rules.items[gear.kind];
        if (gear.destroyed || (!item?.probeRange && !item?.probeFinds) || !PROBE_TITLES[gear.kind]) {
            continue;
        }
        const finds = item.probeFinds ?? ["hidden"];
        const row = (detects: boolean, reason: string): IEWarProbeResult => ({ kind: gear.kind, range: item.probeRange, detects, reason });
        const bloodhound = gear.kind === "probe-bloodhound";
        const ecmBlocks = bloodhound ? !!target.hostileAngelEcm : !!(target.hostileEcm || target.hostileAngelEcm);
        const blockable = bloodhound || !!rules.items["ecm-guardian"]?.ecmCancels?.includes("beagle");
        const blocker = unit.getEWarGear().find(other => {
            const blocks = rules.items[other.kind]?.blocksProbes;
            return !other.destroyed && isEWarStealthOn(unit, other) && (blocks === "all" || (blocks === "bloodhound" && bloodhound));
        });
        if (blocker) {
            results.push(row(false, `its own ${STEALTH_TITLES[blocker.kind] ?? blocker.kind} is on and stops it`));
        } else if (target.underwater) {
            results.push(row(false, "an above-water probe cannot detect a unit hidden underwater"));
        } else if (ecmBlocks && blockable) {
            results.push(row(false, bloodhound ? "hostile Angel ECM blocks it" : "hostile ECM blocks it"));
        } else if (target.infantry === "conventional" && PROBES_MISS_INFANTRY.has(edition) && !bloodhound) {
            results.push(row(false, "conventional infantry is not found by an active probe in this edition"));
        } else if (target.infantry === "ecm-sneak" && !finds.includes("sneak-ecm")) {
            results.push(row(false, "an ECM sneak suit is found only by a Bloodhound"));
        } else {
            const missed = (target.stealth ?? []).find(system => STEALTH_FIND[system] && !finds.includes(STEALTH_FIND[system]!));
            results.push(missed
                ? row(false, `cannot find ${STEALTH_TITLES[missed] ?? missed}`)
                : row(true, item.probeRange ? `finds hidden units within ${item.probeRange} hexes` : "finds hidden units (the book prints no range for it)"));
        }
    }
    return results;
}

/** One note line for each working probe of `unit`, with its range, what it finds and the book and page. */
export function getEWarProbeNotes(unit: IEWarCarrier): string[] {
    const rules = getEWarPlayRules(unit.getRulesEdition());
    const notes: string[] = [];
    const seen = new Set<EWarKind>();
    for (const gear of unit.getEWarGear()) {
        const item = rules?.items[gear.kind];
        const title = PROBE_TITLES[gear.kind];
        if ((!item?.probeRange && !item?.probeFinds) || !title || gear.destroyed || seen.has(gear.kind)) {
            continue;
        }
        seen.add(gear.kind);
        const extra = (item.probeFinds ?? []).filter(find => find !== "hidden");
        notes.push(`${title} probe: ${item.probeRange ? `${item.probeRange} hexes` : "range not printed"}, finds hidden units${extra.length ? `, also ${extra.join(", ")}` : ""}; blocked by ${gear.kind === "probe-bloodhound" ? "Angel ECM only" : "hostile ECM"} (${item.book} p.${item.page}${item.apocryphal ? "; apocryphal in this edition, which no longer prints it" : ""})`);
    }
    return notes;
}

/** The modes the play panel offers for an ECM suite under the unit edition: ECCM and ghost targets only where it prints them. */
export function getEWarModeOptions(unit: IEWarCarrier, gear: IEWarGear): ("ecm" | "eccm" | "ghost" | "off")[] {
    const rules = getEWarPlayRules(unit.getRulesEdition());
    const item = rules?.items[gear.kind];
    if (!rules || !item) {
        return [];
    }
    if (gear.kind === "communications") {
        // No ECM of its own: ECCM from 3 tons, ghost targets from 7 tons (TO:AR pp.99-100).
        const tons = getCommunicationsTons(unit);
        return tons < 3 ? ["off"] : tons >= 7 && item.ghostByComms && rules.items["ecm-guardian"]?.ghostTargets ? ["eccm", "ghost", "off"] : ["eccm", "off"];
    }
    if (gear.kind === "ecm-personal") {
        // The Personal ECM has no ECCM mode and makes no ghost targets (Pleiades Mechworks).
        return ["ecm", "off"];
    }
    const options: ("ecm" | "eccm" | "ghost" | "off")[] = ["ecm"];
    if (item.eccm || rules.items["ecm-guardian"]?.eccm) {
        options.push("eccm");
    }
    if (rules.items["ecm-guardian"]?.ghostTargets) {
        options.push("ghost");
    }
    options.push("off");
    return options;
}

/** Sets an ECM suite to a mode, or off; the state is replaced so a view can compare it. */
export function setEWarEcmMode(unit: IEWarCarrier, gear: IEWarGear, mode: "ecm" | "eccm" | "ghost" | "off"): void {
    const key = gear.uuid ?? gear.kind;
    const ecmOn = { ...(unit.ewarPlay.ecmOn ?? {}), [key]: mode !== "off" };
    const ecmMode = { ...(unit.ewarPlay.ecmMode ?? {}) };
    if (mode === "ecm" || mode === "off") {
        delete ecmMode[key];
    } else {
        ecmMode[key] = mode;
    }
    unit.ewarPlay = { ...unit.ewarPlay, ecmOn, ecmMode };
}

/** Switches one stealth system on or off; a legacy any-system switch is spread over the unit stealth gear first. */
export function setEWarStealth(unit: IEWarCarrier, gear: IEWarGear, on: boolean): void {
    const stealth = { ...(unit.ewarPlay.stealthOn ?? {}) };
    if (stealth["*"]) {
        delete stealth["*"];
        for (const other of unit.getEWarGear()) {
            if (getEWarPlayRules(unit.getRulesEdition())?.items[other.kind]?.stealthHeat) {
                stealth[other.uuid ?? other.kind] = true;
            }
        }
    }
    const key = gear.uuid ?? gear.kind;
    if (on) {
        stealth[key] = true;
    } else {
        delete stealth[key];
    }
    unit.ewarPlay = { ...unit.ewarPlay, stealthOn: stealth };
}

/** What a semi-guided LRM attack gets from a TAG designation. */
export interface IEWarSemiGuided {
    applies: boolean;
    ignoreTargetMovement: boolean;
    /** Indirect fire ignores its indirect-fire, spotter and (Core Rulebook) terrain modifiers. */
    ignoreIndirectModifiers: boolean;
    /** Core Rulebook direct fire: the target terrain modifier is reduced by this (minimum zero). */
    terrainReduction: number;
    ignorePartialCover: boolean;
    clusterShift: IEWarModifier[];
    label: string;
}

/**
 * Semi-guided LRM ammunition (BMR p.131, TW p.142, BMM, CRB p.193): a target designated by TAG that turn lets the
 * attack ignore target movement (and, fired indirectly, the indirect and spotter movement penalties). The Core Rulebook
 * instead takes -1 on the Cluster Hits roll unless designated, and gives bonuses when it is. ECM does not stop TAG.
 */
export function getEWarSemiGuided(attacker: IEWarCarrier, attack: IEWarAttack): IEWarSemiGuided {
    const none: IEWarSemiGuided = { applies: false, ignoreTargetMovement: false, ignoreIndirectModifiers: false, terrainReduction: 0, ignorePartialCover: false, clusterShift: [], label: "" };
    if (!attack.ammoTag?.includes("semi-guided")) {
        return none;
    }
    const rules = getEWarPlayRules(attacker.getRulesEdition());
    const tag = rules?.items.tag;
    if (!tag?.semiGuided) {
        return { ...none, label: "Semi-guided: not in this edition" };
    }
    const designated = !!attack.target?.tagged;
    const indirect = !!attack.launcher?.indirect;
    if (tag.semiGuidedMode === "designated-bonus") {
        if (!designated) {
            return { ...none, clusterShift: [{ modifier: -1, label: "Semi-guided (-1)" }], label: "Semi-guided: target not designated by TAG" };
        }
        return {
            applies: true, ignoreTargetMovement: false, ignoreIndirectModifiers: indirect, terrainReduction: indirect ? 0 : 2, ignorePartialCover: !indirect,
            clusterShift: indirect ? [] : [{ modifier: 2, label: "Semi-guided, TAG-designated (+2)" }], label: "Semi-guided: TAG-designated",
        };
    }
    if (!designated) {
        return { ...none, label: "Semi-guided: target not designated by TAG" };
    }
    return { ...none, applies: true, ignoreTargetMovement: true, ignoreIndirectModifiers: indirect, label: "Semi-guided: TAG-designated" };
}

/** The launcher family and size a weapon tag names ("clan-lrm-20-artemis-v" is an LRM 20), or undefined for a weapon that is no missile launcher. */
export function getEWarLauncher(weaponTag: string, indirect: boolean = false): IEWarAttack["launcher"] | undefined {
    const match = /(?:^|-)(streak-srm|streak-lrm|streak|lrm|srm|mrm|mml|atm|nlrm)-?(\d+)?/.exec(weaponTag);
    if (!match) {
        return undefined;
    }
    const name = match[1];
    const family = name.startsWith("streak") ? "streak" : name === "lrm" || name === "nlrm" ? "lrm" : name === "srm" ? "srm" : name === "mrm" ? "mrm" : "other";
    return { family, size: Number(match[2] ?? 0), indirect: indirect || undefined };
}

/** The target ticks an attack reads: ECM and ECCM on the line, TAG, pods, indirect fire. */
export interface IEWarTargetTicks {
    hostileEcm?: boolean;
    friendlyEccm?: boolean;
    /** The attacker Blue Saviour field is on the line: hostile ECM no ECCM cancels (set by withAttackerEcm). */
    ecmNoEccm?: boolean;
    tagged?: boolean;
    narcPods?: string[];
    indirectFire?: boolean;
    targetHostileEcm?: boolean;
    /** Hostile ECM and friendly ECCM suites counted on the line (Phase 2); an Angel suite counts apart. */
    hostileEcmCount?: number;
    hostileAngelEcm?: boolean;
    friendlyEccmCount?: number;
    friendlyAngelEccm?: boolean;
    /** The target active stealth systems, and the range band, for the stealth tables. */
    stealth?: { kind: EWarKind; moved?: number }[];
    rangeBand?: IEWarAttack["rangeBand"];
    /** C3: the range band of the nearest networked unit, and the attacker link status (linked with no degrade when left out). */
    c3NearestRange?: "short" | "medium" | "long" | "extreme";
    c3NearestInEcm?: boolean;
    c3Status?: IC3Status;
}

/**
 * The ticks with the attacker own board state added: a unit the force board marks inside hostile ECM has hostile ECM on
 * every line of fire (CRB p.200: the attacker or the target inside the radius). It is the same bubble the player may
 * also have ticked, so it counts as at least one suite, not one more.
 */
export function withAttackerEcm(unit: { ewarPlay: IEWarPlayState; isBlueSaviourOn?(): boolean }, ticks: IEWarTargetTicks): IEWarTargetTicks {
    if (unit.isBlueSaviourOn?.()) {
        // A Blue Saviour field is hostile ECM that no ECCM can negate (Pleiades Mechworks, TW p.134): ECM is on the line whatever the
        // ECCM, but the ECCM counts stay, for it still cancels the other, real ECM (Angel, the Narc pod) the attack meets.
        return { ...ticks, hostileEcmCount: Math.max(ticks.hostileEcmCount ?? 0, 1), ecmNoEccm: true };
    }
    return unit.ewarPlay.inHostileEcm ? { ...ticks, hostileEcmCount: Math.max(ticks.hostileEcmCount ?? 0, 1) } : ticks;
}

/** Whether a unit counts as inside hostile ECM: the board or its hand tick says so, or its Blue Saviour field is on. */
export function isInHostileEcm(unit: { ewarPlay: IEWarPlayState; isBlueSaviourOn?(): boolean }): boolean {
    return !!unit.ewarPlay.inHostileEcm || !!unit.isBlueSaviourOn?.();
}

/** The E-War attack for a weapon (and the ammunition loaded) against a target with these ticks. */
export function buildEWarAttack(weapon: { uuid?: string; tag: string }, ammo: { tag?: string } | undefined, ticks: IEWarTargetTicks, edition?: string): IEWarAttack {
    // With the edition known, the ECM and ECCM counts decide whether the ECM works; without it the older ticks stand.
    const effective = edition ? getEWarEcmEffective(ticks, edition).ecmWorks : undefined;
    return {
        weaponUuid: weapon.uuid,
        ammoTag: ammo?.tag,
        hostileEcmOnLine: ticks.ecmNoEccm ? true : effective ?? ticks.hostileEcm,
        friendlyEccmOnLine: ticks.ecmNoEccm ? false : effective === undefined ? ticks.friendlyEccm : false,
        hostileAngelEcm: ticks.hostileAngelEcm && (!edition || getEWarEcmEffective({ hostileAngelEcm: true, friendlyEccmCount: ticks.friendlyEccmCount, friendlyEccm: ticks.friendlyEccm, friendlyAngelEccm: ticks.friendlyAngelEccm }, edition).ecmWorks),
        targetInHostileEcm: ticks.targetHostileEcm && (!edition || getEWarEcmEffective({
            hostileEcmCount: ticks.hostileEcmCount ?? 1, hostileAngelEcm: ticks.hostileAngelEcm,
            friendlyEccmCount: ticks.friendlyEccmCount, friendlyEccm: ticks.friendlyEccm, friendlyAngelEccm: ticks.friendlyAngelEccm,
        }, edition).ecmWorks),
        launcher: getEWarLauncher(weapon.tag, !!ticks.indirectFire),
        target: { narcPods: ticks.narcPods, tagged: ticks.tagged, stealth: ticks.stealth },
        rangeBand: ticks.rangeBand,
        c3: ticks.c3NearestRange && ticks.rangeBand
            ? { nearestRangeBand: ticks.c3NearestRange, ownRangeBand: ticks.rangeBand, status: ticks.c3Status ?? { linked: true, degrade: 0, labels: [] }, nearestInEcm: ticks.c3NearestInEcm }
            : undefined,
    };
}

/** An incoming missile attack, for the defender anti-missile items. */
export interface IEWarIncoming {
    missileAttack: boolean;
    launcherSize: number;
    /** A Streak launcher: its roll is taken as an 11 before the shift. */
    streak?: boolean;
    /** The munition of the incoming attack when it is one anti-missile systems may not engage: "arrow-iv", "thunder", "swarm", "flare". */
    munition?: string;
    /** Defending a friendly unit this many hexes away (APDS); absent when defending the carrier own unit. */
    friendlyDistance?: number;
    /** Ammunition shots left, by gear uuid; absent: assume enough. */
    ammoShots?: Record<string, number>;
}

/** What an anti-missile item does to an incoming missile attack; the dialog rolls the dice and spends the heat and ammunition. */
export interface IEWarDefenseResult {
    applies: boolean;
    mode?: "missiles-destroyed" | "cluster-shift";
    shift?: number;
    /** Dice (D6) rolled for the number of missiles destroyed. */
    destroyedDice?: number;
    heat: number;
    /** The heat is the number of missiles destroyed. */
    heatFromRoll?: boolean;
    /** Ammunition shots spent this engagement. */
    ammoShots: number;
    /** Ammunition shots spent for each missile destroyed. */
    ammoPerMissile?: number;
    /** A Streak launcher: take the base roll as this before the shift. */
    streakBaseRoll?: number;
    /** A single missile (a Narc beacon): roll 1D6, 1-3 destroys it (TW p.129, BMM p.118). */
    singleMissile?: boolean;
    /** The missiles are shot down before the to-hit roll (Compendium, Rules of Warfare). */
    beforeRoll?: boolean;
    /** Ammunition spent is its own roll: this many D6 times the multiplier. */
    ammoRoll?: { dice: number; multiplier: number };
    /** A shifted roll below 2 destroys the whole flight. */
    belowTwoDestroys?: boolean;
    labels: string[];
    spentGearUuid?: string;
    /** The defense is a Blue Saviour field, not a gear item: it spends no ammunition and makes no heat of its own. */
    fromField?: boolean;
}

/** The `spentGearUuid` and `amsUses` key of a Blue Saviour field answering missiles. */
export const BLUE_SAVIOUR_GEAR_KEY = "blue-saviour";

const DEFENSE_KINDS: EWarKind[] = ["ams", "laser-ams", "apds"];

/** Whether a catalog tag is a Clan item: the catalog names every Clan anti-missile item "clan-..." (a test keeps this true). */
export function isClanEWarTag(tag: string): boolean {
    return tag.startsWith("clan-") || tag.includes("-clan-");
}

/**
 * The first working anti-missile item of the defender (AMS, Laser AMS, APDS) that can engage this attack, as the
 * defender edition prints it. A destroyed item, one that has used up its engagements this turn, one with no ammunition
 * where it needs some, and an edition without the item give no defense.
 */
export function getEWarDefense(defender: IEWarCarrier, incoming: IEWarIncoming): IEWarDefenseResult {
    const none: IEWarDefenseResult = { applies: false, heat: 0, ammoShots: 0, labels: [] };
    const rules = getEWarPlayRules(defender.getRulesEdition());
    if (!rules || !incoming.missileAttack) {
        return none;
    }
    const fieldRule = defender.isBlueSaviourOn?.() ? rules.items.ams?.defense : undefined;
    if (incoming.munition && rules.amsImmune?.includes(incoming.munition) && (fieldRule || defender.getEWarGear().some(gear => !gear.destroyed && DEFENSE_KINDS.includes(gear.kind) && rules.items[gear.kind]?.defense))) {
        return { ...none, labels: [`Anti-missile systems cannot engage ${incoming.munition === "arrow-iv" ? "Arrow IV" : incoming.munition} missiles in this edition`] };
    }
    for (const gear of defender.getEWarGear()) {
        const rule = gear.uuid && DEFENSE_KINDS.includes(gear.kind) ? rules.items[gear.kind]?.defense : undefined;
        if (!rule || gear.destroyed || !gear.uuid) {
            continue;
        }
        if ((defender.ewarPlay.amsUses?.[gear.uuid] ?? 0) >= (rule.maxPerTurn ?? 1)) {
            continue;
        }
        const needsAmmo = (rule.ammoPerUse ?? 0) > 0 || (rule.ammoPerMissile ?? 0) > 0 || !!rule.ammoRoll;
        if (needsAmmo && incoming.ammoShots && (incoming.ammoShots[gear.uuid] ?? 0) <= 0) {
            continue;
        }
        let shift = rule.shift;
        if (incoming.friendlyDistance !== undefined) {
            shift = rule.friendlyShifts?.[incoming.friendlyDistance];
            if (shift === undefined) {
                continue;
            }
        }
        const title = gear.kind === "ams" ? "AMS" : gear.kind === "laser-ams" ? "Laser AMS" : "APDS";
        return buildDefenseResult(rule, shift, isClanEWarTag(gear.tag), title, incoming, gear.uuid);
    }
    // The Blue Saviour answers as one more AMS once no gear item can (Pleiades Mechworks: missiles treated as met by an anti-missile system, TW p.129).
    if (fieldRule && incoming.friendlyDistance === undefined && (defender.ewarPlay.amsUses?.[BLUE_SAVIOUR_GEAR_KEY] ?? 0) < (fieldRule.maxPerTurn ?? 1)) {
        const result = buildDefenseResult({ ...fieldRule, heat: 0, clanHeat: 0, ammoPerUse: 0, ammoPerMissile: undefined, ammoRoll: undefined, heatFromRoll: undefined }, fieldRule.shift, false, "Blue Saviour (treated as AMS, TW p.129)", incoming, BLUE_SAVIOUR_GEAR_KEY);
        result.fromField = true;
        return result;
    }
    return none;
}

/** What one anti-missile rule does to an incoming missile attack, with its labels. */
function buildDefenseResult(rule: IEWarDefenseRule, shift: number | undefined, clan: boolean, title: string, incoming: IEWarIncoming, spentGearUuid: string): IEWarDefenseResult {
    const result: IEWarDefenseResult = {
        applies: true, mode: rule.mode, heat: (clan ? rule.clanHeat : undefined) ?? rule.heat ?? 0, ammoShots: rule.ammoPerUse ?? 0,
        labels: [], spentGearUuid, belowTwoDestroys: rule.belowTwoDestroys,
    };
    if (rule.mode === "cluster-shift") {
        result.shift = shift;
        result.labels.push(`${title} (${signed(shift ?? 0)})`);
        if (incoming.launcherSize === 1) {
            result.singleMissile = true;
            result.labels.push("Single missile: roll 1D6, 1-3 destroys it, 4-6 it hits");
        }
        if (incoming.streak) {
            result.streakBaseRoll = 11;
            result.labels.push("Streak: base roll taken as 11");
        }
    } else {
        result.destroyedDice = (clan ? rule.clanDice : undefined) ?? rule.dice ?? 1;
        result.ammoPerMissile = rule.ammoPerMissile;
        result.beforeRoll = rule.beforeRoll;
        result.ammoRoll = rule.ammoRoll;
        result.heatFromRoll = rule.heatFromRoll;
        result.labels.push(`${title}: ${result.destroyedDice}D6 missiles destroyed`);
    }
    return result;
}

/**
 * Missiles that hit a defender after its anti-missile item: a cluster-shift defense shifts the 2D6 roll before the table
 * lookup, a destroyed-missiles defense takes the entered number off the result. `hitsFor` is the Cluster Hits table.
 */
export function getEWarMissileHits(
    defense: IEWarDefenseResult,
    size: number,
    roll: number,
    destroyed: number,
    hitsFor: (roll: number, size: number) => number,
    attackerShift: number = 0,
): number {
    const clamp = (value: number) => Math.min(12, Math.max(2, value));
    if (!defense.applies) {
        return hitsFor(clamp(roll + attackerShift), size);
    }
    if (defense.singleMissile) {
        return destroyed > 0 ? 0 : 1;
    }
    if (defense.mode === "cluster-shift") {
        const raw = (defense.streakBaseRoll ?? roll + attackerShift) + (defense.shift ?? 0);
        if (raw < 2 && defense.belowTwoDestroys) {
            return 0;
        }
        return hitsFor(clamp(raw), size);
    }
    if (defense.beforeRoll) {
        // The survivors pick the Cluster Hits column: the nearest size, a tie going to the smaller.
        const survivors = Math.max(0, size - destroyed);
        if (survivors < 2) {
            return survivors;
        }
        const columns = [2, 4, 5, 6, 10, 15, 20];
        const column = columns.reduce((best, candidate) => (Math.abs(candidate - survivors) < Math.abs(best - survivors) ? candidate : best), columns[0]);
        return Math.min(survivors, hitsFor(clamp(roll + attackerShift), column));
    }
    return Math.max(0, hitsFor(clamp(roll + attackerShift), size) - destroyed);
}

/**
 * Every Cluster Hits shift for one weapon of a unit against a target with these ticks: its Artemis or Apollo, a Narc pod
 * on the target, and semi-guided ammunition. The loaded ammunition is the bin the weapon has selected.
 */
export function getEWarWeaponClusterShifts(
    unit: IEWarCarrier & { equipmentList: { uuid?: string; tag: string; selectedAmmoBinUUID?: string }[] },
    index: number,
    ticks: IEWarTargetTicks,
): IEWarModifier[] {
    const weapon = unit.equipmentList[index];
    if (!weapon) {
        return [];
    }
    const ammo = weapon.selectedAmmoBinUUID ? unit.equipmentList.find(item => item.uuid === weapon.selectedAmmoBinUUID) : undefined;
    const attack = buildEWarAttack(weapon, ammo, withAttackerEcm(unit, ticks), unit.getRulesEdition());
    const shifts = [...getEWarClusterShift(unit, attack), ...getEWarSemiGuided(unit, attack).clusterShift];
    // An Artemis launcher with no ammunition bin chosen is taken to be loaded with Artemis ammunition: say so.
    const gear = unit.getEWarGear().find(item => item.uuid === weapon.uuid);
    if (!ammo && gear && !gear.destroyed && (gear.kind === "artemis-iv" || gear.kind === "artemis-v") && shifts.some(shift => shift.modifier)) {
        shifts.push({ modifier: 0, label: `${gear.kind === "artemis-iv" ? "Artemis IV" : "Artemis V"}: no ammunition bin chosen, assumed Artemis ammunition` });
    }
    return shifts;
}

/**
 * The damage groupings of a missile hit (TW p.113: the number left of the slash in the Damage column is the most damage
 * in one grouping; each grouping gets its own hit location): whole missiles that fit `groupMax` damage, the last group
 * holding what is left. An LRM (1 a missile, groups of 5) with 12 hits is 5, 5 and 2; an SRM (2 a missile, groups of 2)
 * is one group a missile.
 */
export function getMissileDamageGroups(hits: number, perMissile: number, groupMax: number): number[] {
    const per = Math.max(1, perMissile);
    const missilesPerGroup = Math.max(1, Math.floor(Math.max(1, groupMax) / per));
    const groups: number[] = [];
    for (let left = Math.max(0, Math.floor(hits)); left > 0; left -= missilesPerGroup) {
        groups.push(Math.min(left, missilesPerGroup) * per);
    }
    return groups;
}

/** The 2D6 Cluster Hits roll with the shifts added, kept within the table (2 to 12). */
export function applyEWarClusterShift(roll: number, shifts: IEWarModifier[]): number {
    const total = shifts.reduce((sum, shift) => sum + shift.modifier, 0);
    return Math.min(12, Math.max(2, roll + total));
}

const NOTE_TITLES: Partial<Record<EWarKind, string>> = {
    "artemis-iv": "Artemis IV", "artemis-v": "Artemis V", "artemis-prototype": "Artemis IV (prototype)", apollo: "Apollo", narc: "Narc", inarc: "iNarc",
    tag: "TAG", "light-tag": "Light TAG", ams: "AMS", "laser-ams": "Laser AMS", apds: "APDS",
};

/**
 * What each working missile item (Phase 1) does for `unit` as its edition prints it, one line each with the book and page,
 * for the play views to show. Items of later phases and destroyed items have no line.
 */
export function getEWarNotes(unit: IEWarCarrier): string[] {
    const rules = getEWarPlayRules(unit.getRulesEdition());
    if (!rules) {
        return [];
    }
    const notes: string[] = [];
    const seen = new Set<EWarKind>();
    for (const gear of unit.getEWarGear()) {
        const item = rules.items[gear.kind];
        const title = NOTE_TITLES[gear.kind];
        if (!item || !title || gear.destroyed || seen.has(gear.kind)) {
            continue;
        }
        seen.add(gear.kind);
        const source = gear.tag.startsWith("inf-field-") ? " (MT p.40; apocryphal in this edition, which no longer prints it)"
            : ` (${item.book} p.${item.page}${item.apocryphal ? "; apocryphal in this edition, which no longer prints it" : ""})`;
        const defense = item.defense;
        if (defense) {
            if (defense.mode === "missiles-destroyed") {
                const ammo = defense.ammoRoll ? `spending ${defense.ammoRoll.dice}D6 x ${defense.ammoRoll.multiplier} ammunition`
                    : defense.ammoPerMissile ? `spending ${defense.ammoPerMissile} ammunition for each missile` : "using no ammunition";
                const heat = defense.heat ? ` and ${defense.heat} heat` : defense.heatFromRoll ? " and heat equal to the missiles destroyed" : "";
                notes.push(`${title}: shoots down ${defense.dice ?? 1}D6 missiles of a missile attack${defense.beforeRoll ? " before the to-hit roll" : ""} `
                    + `(${defense.clanDice ?? 2}D6 for the Clan ${title}), ${ammo}${heat}${source}`);
            } else {
                const per = defense.maxPerTurn ?? 1;
                notes.push(`${title}: ${signed(defense.shift ?? 0)} on the attacker Cluster Hits roll, ${defense.heat ?? 0} heat and ${defense.ammoPerUse ?? 0} ammunition, ${per} missile attack${per === 1 ? "" : "s"} a turn${source}`);
            }
        } else if (item.clusterShift !== undefined) {
            const parts = [`${signed(item.clusterShift)} on the Cluster Hits roll`];
            if (item.toHit !== undefined) {
                parts.push(`${signed(item.toHit)} to hit`);
            }
            if (item.excludes?.length) {
                parts.push(`not with ${item.excludes.join(", ")}`);
            }
            if (item.ecmBlocks) {
                parts.push("hostile ECM cancels it");
            }
            notes.push(`${title}: ${parts.join("; ")}${source}`);
        } else if (gear.kind === "tag" || gear.kind === "light-tag") {
            notes.push(`${title}: designates a target for the turn, for ${item.semiGuided ? "semi-guided LRMs as well as " : ""}Arrow IV homing missiles${item.semiGuided ? "" : " only"}${source}`);
        }
    }
    notes.push(...getEWarStealthNotes(unit), ...getEWarProbeNotes(unit));
    if (unit.isBlueSaviourOn?.()) {
        const per = rules.items.ams?.defense?.maxPerTurn ?? 1;
        notes.push(`Blue Saviour (Pleiades Mechworks, Custom Homebrew): counts as inside hostile ECM that ECCM cannot cancel, and meets ${per} missile attack${per === 1 ? "" : "s"} a turn as an anti-missile system would (TW pp.129, 134)`);
    }
    // Custom and fan items (Phase 3 customs): the table note carries the attribution.
    for (const kind of ["ecm-personal", "c3-modular"] as const) {
        const gear = unit.getEWarGear().find((entry) => entry.kind === kind && !entry.destroyed);
        const item = rules.items[kind];
        if (gear && item) notes.push(`${kind === "ecm-personal" ? "Personal ECM" : "Modular C3"}: ${item.note}${item.apocryphal ? " (apocryphal in this edition, which no longer prints it)" : ""}`);
    }
    if (unit.getEWarGear().some((entry) => entry.tag === "custom-chaff-pod-2" && !entry.destroyed)) {
        notes.push("Chaff Pod 2.0 (Custom Homebrew by Prince, Solaris7 forum, LosTech custom weapons, April 2020): 4 pods in one launcher, each a Chaff Pod (light smoke, a one-hex ECM bubble and anti-missile cover for a turn) in the own hex or an adjacent one; an unfired pod explodes for 3 points on a critical hit");
    }
    for (const kind of ["ew-equipment", "communications"] as const) {
        const gear = unit.getEWarGear().find((entry) => entry.kind === kind && !entry.destroyed);
        const item = rules.items[kind];
        if (!gear || !item) continue;
        const source = `(${item.book} p.${item.page}${item.apocryphal ? "; apocryphal in this edition, which no longer prints it" : ""})`;
        notes.push(kind === "ew-equipment"
            ? `EW Equipment: works as a Beagle Active Probe and a Guardian ECM Suite, both 3 hexes; only one probe and one ECM at a time; not the Guardian ECM stealth armor needs ${source}`
            : `Communications equipment (${getCommunicationsTons(unit)} t): ${getCommunicationsTons(unit) >= 7 ? "one ECCM suite and ghost targets" : getCommunicationsTons(unit) >= 3 ? "half an ECCM suite" : "too small for ECCM"}; its other bonus modifiers are lost while it makes ECCM ${source}`);
    }
    const ghosts = countGhostSuites(unit);
    if (ghosts > 0) {
        notes.push(`Ghost targets: ${ghosts} suite${ghosts === 1 ? "" : "s"} making them; each Weapon Attack Phase roll Piloting/Driving at +3, and on a pass the chosen unit gets +1 (stacking to +3); an active probe ignores them (TO:AR p.100)`);
    }
    return notes;
}

/*
 * The force E-War board: what the player declares for the whole force (units inside hostile or friendly ECM, Narc and
 * iNarc pods, TAG), written onto each unit's play state. A field set by hand on a unit (`overrides`) is left alone
 * until the board entry that names the unit changes.
 */

/** One Narc or iNarc pod stuck to a unit. */
export interface IEWarPod {
    kind: "narc" | "inarc";
    pod: string;
    turn: number;
}

/** The board's entries: unit uuids, or one lower-case letter for an enemy target. C3 stays in the force's c3Networks. */
export interface IEWarBoard {
    hostileEcm?: string[];
    friendlyEcm?: string[];
    narcPods?: Record<string, IEWarPod[]>;
    tagged?: string[];
    /** "Personal" ECM carrier uuid -> the uuids of the other friendly units in its hex (it covers its own hex only). */
    personalEcm?: Record<string, string[]>;
    /** C3 Remote Sensor pods fired into a network (by network name): a stationary Slave for 3 turns after the launch turn. */
    sensorPods?: { network: string; hex: string; turn: number }[];
}

/** The unit field each board entry sets. */
export const EWAR_BOARD_FIELDS = { hostileEcm: "inHostileEcm", friendlyEcm: "inFriendlyEcm", narcPods: "narcPods", tagged: "tagged", personalEcm: "personalEcmOf" } as const;

/**
 * The units a working "Personal" ECM covers (Pleiades Mechworks: a Guardian for its own hex only, no ECCM mode): each carrier
 * whose suite is in ECM mode (not destroyed, not switched off, not silenced by its own stealth system), and the units the board
 * names as sharing its hex. Maps each covered uuid to the carriers covering it; the carrier covers itself.
 */
export function getPersonalEcmCover(board: IEWarBoard, units: IEWarCarrier[]): Map<string, string[]> {
    const cover = new Map<string, string[]>();
    const present = new Set(units.map((unit) => unit.getUUID()));
    for (const carrier of units) {
        if (!carrier.getEWarGear().some((entry) => entry.kind === "ecm-personal" && getEWarEcmMode(carrier, entry) === "ecm")) continue;
        const id = carrier.getUUID();
        for (const covered of [id, ...(board.personalEcm?.[id] ?? [])]) {
            if (!present.has(covered)) continue;
            const list = cover.get(covered) ?? [];
            if (!list.includes(id)) list.push(id);
            cover.set(covered, list);
        }
    }
    return cover;
}

/** Sets each unit's board-driven fields from `board`, except the fields in that unit's `overrides`. */
export function applyEWarBoard(board: IEWarBoard, units: IEWarCarrier[]): void {
    const personal = getPersonalEcmCover(board, units);
    for (const unit of units) {
        const id = unit.getUUID();
        const state = unit.ewarPlay as Record<string, unknown>;
        const overrides = unit.ewarPlay.overrides ?? [];
        const values: Record<string, unknown> = {
            inHostileEcm: board.hostileEcm?.includes(id) ? true : undefined,
            inFriendlyEcm: board.friendlyEcm?.includes(id) || personal.has(id) ? true : undefined,
            personalEcmOf: overrides.includes("inFriendlyEcm") ? undefined : personal.get(id),
            narcPods: board.narcPods?.[id]?.length ? board.narcPods[id].map((pod) => ({ ...pod })) : undefined,
            tagged: board.tagged?.includes(id) ? true : undefined,
        };
        for (const [field, value] of Object.entries(values)) {
            if (overrides.includes(field)) continue;
            if (value === undefined) {
                delete state[field];
            } else {
                state[field] = value;
            }
        }
    }
}

/** Sets a play-state field by hand: the board no longer overwrites it until its board entry changes. */
export function setEWarOverride(unit: IEWarCarrier, field: keyof IEWarPlayState, value: unknown): void {
    (unit.ewarPlay as Record<string, unknown>)[field] = value;
    if (field !== "overrides" && !(unit.ewarPlay.overrides ?? []).includes(field)) {
        unit.ewarPlay.overrides = [...(unit.ewarPlay.overrides ?? []), field];
    }
}

/** Takes `field` out of the overrides of each unit in `units`, so the board speaks for it again. */
export function clearEWarOverridesFor(units: IEWarCarrier[], field: keyof IEWarPlayState): void {
    for (const unit of units) {
        const overrides = unit.ewarPlay.overrides;
        if (!overrides?.includes(field)) continue;
        const rest = overrides.filter((name) => name !== field);
        if (rest.length > 0) {
            unit.ewarPlay.overrides = rest;
        } else {
            delete unit.ewarPlay.overrides;
        }
    }
}

// ---- C3 network records (Phase 3) ----

/** A unit in a network plays one role: Master, Slave, the Emergency Master (acts as a Slave until it takes over), or a C3i, Naval or Nova member. */
export type C3Role = "master" | "slave" | "emergency" | "member";

/** One C3 network: its name, kind and members. The force keeps these; Battle Value reads the uuid-to-name map they give. */
export interface IC3Network {
    name: string;
    type: "master-slave" | "c3i" | "boosted" | "naval" | "nova" | "modular";
    /** `since`: the turn a Nova link was declared (the End Phase); it works from the next turn (IO:AE p.60). */
    members: { uuid: string; role: C3Role; since?: number; master?: string }[];
}

/** What a network of each type needs from the edition table, and what to call it in a label. */
const C3_TYPE_ITEMS: Record<IC3Network["type"], { kinds: EWarKind[]; label: string }> = {
    "master-slave": { kinds: ["c3-master", "c3-slave"], label: "C3 Master/Slave" },
    c3i: { kinds: ["c3i"], label: "C3i" },
    boosted: { kinds: ["c3-boosted-master", "c3-boosted-slave"], label: "Boosted C3" },
    naval: { kinds: ["c3-naval"], label: "Naval C3" },
    nova: { kinds: ["ecm-nova"], label: "Nova CEWS" },
    modular: { kinds: ["c3-modular"], label: "Modular C3" },
};

const C3_MASTER_KINDS: EWarKind[] = ["c3-master", "c3-boosted-master"];
const C3_SLAVE_KINDS: EWarKind[] = ["c3-slave", "c3-boosted-slave", "c3-emergency-master"];

/** The network type the C3 gear of `unit` joins, or undefined with none. */
export function getC3GearType(unit: IEWarCarrier): IC3Network["type"] | undefined {
    const kinds = unit.getEWarGear().map((gear) => gear.kind);
    if (kinds.some((kind) => kind === "c3-boosted-master" || kind === "c3-boosted-slave")) return "boosted";
    if (kinds.some((kind) => kind === "c3-master" || kind === "c3-slave" || kind === "c3-emergency-master")) return "master-slave";
    if (kinds.includes("c3-modular")) return "modular";
    if (kinds.includes("c3i")) return "c3i";
    if (kinds.includes("c3-naval")) return "naval";
    if (kinds.includes("ecm-nova")) return "nova";
    return undefined;
}

/** The role a unit takes in a network of `type` when none is named: Master when it carries only Master gear, `member` for the link types, else Slave. */
export function inferC3Role(unit: IEWarCarrier, type: IC3Network["type"]): C3Role {
    if (type !== "master-slave" && type !== "boosted") return "member";
    const kinds = unit.getEWarGear().map((gear) => gear.kind);
    return kinds.some((kind) => C3_MASTER_KINDS.includes(kind)) && !kinds.some((kind) => C3_SLAVE_KINDS.includes(kind)) ? "master" : "slave";
}

/** The uuid-to-name map Battle Value reads from the network records. */
export function getC3NetworkMap(records: IC3Network[]): Record<string, string> {
    const map: Record<string, string> = {};
    for (const record of records) {
        for (const member of record.members) {
            map[member.uuid] = record.name;
        }
    }
    return map;
}

/**
 * The labels for what stops `network` being a legal network under `edition`: no such network in the edition, too many units
 * (Remote Sensor pods count), too many Slaves for the Masters, C3i mixed with Master/Slave gear, a Large Craft under 200 t on a
 * Naval network, a battle armor squad of fewer than three, a unit in two networks. An empty list means valid.
 */
export function validateC3Network(network: IC3Network, units: IEWarCarrier[], edition: string, extra: { others?: IC3Network[]; pods?: number } = {}): string[] {
    const labels: string[] = [];
    const info = C3_TYPE_ITEMS[network.type];
    const items = getEWarPlayRules(edition)?.items ?? {};
    const rule = info.kinds.map((kind) => items[kind]?.c3).find((found) => !!found);
    const editionName = getRulesEdition(edition).name;
    if (!rule) {
        return [`${info.label} networks are not printed in ${editionName}.`];
    }
    const total = network.members.length + (extra.pods ?? 0);
    if (total > rule.maxUnits) {
        labels.push(`${info.label} networks hold at most ${rule.maxUnits} units in ${editionName} (${total} named).`);
    }
    const masters = network.members.filter((member) => member.role === "master").length;
    const slaves = network.members.filter((member) => member.role === "slave" || member.role === "emergency").length;
    if (rule.slavesPerMaster && masters > 0 && slaves + (extra.pods ?? 0) > masters * rule.slavesPerMaster) {
        labels.push(`A Master controls at most ${rule.slavesPerMaster} Slaves in ${editionName} (${masters} Master(s), ${slaves} Slaves).`);
    }
    for (const member of network.members) {
        const unit = units.find((candidate) => candidate.getUUID() === member.uuid);
        if (!unit) continue;
        const own = getC3GearType(unit);
        const mixable = (own === "master-slave" || own === "boosted") && (network.type === "master-slave" || network.type === "boosted");
        if (own && own !== network.type && !mixable) {
            labels.push((own === "c3i" && (network.type === "master-slave" || network.type === "boosted")) || (network.type === "c3i" && (own === "master-slave" || own === "boosted"))
                ? "C3i cannot be mixed with Master and Slave units."
                : `A unit with ${C3_TYPE_ITEMS[own].label} gear cannot join a ${info.label} network.`);
        }
        const kinds = unit.getEWarGear().map((gear) => gear.kind);
        if (own && member.role === "master" && !kinds.some((kind) => C3_MASTER_KINDS.includes(kind))) {
            labels.push("A unit with no Master computer cannot be a Master.");
        }
        if (own && member.role === "emergency" && !kinds.includes("c3-emergency-master")) {
            labels.push("Only a unit with an Emergency Master computer can be the Emergency Master.");
        }
        if (network.type === "naval" && (unit.getTonnage?.() ?? 200) < 200) {
            labels.push("Naval C3 links Large Craft of 200 tons or more only.");
        }
        const squad = unit.getSquadSize?.();
        if (squad !== undefined && own && squad < 3) {
            labels.push("A battle armor squad needs three or more troopers to join a C3 network.");
        }
    }
    for (const other of extra.others ?? []) {
        if (other.name !== network.name && other.members.some((member) => network.members.some((mine) => mine.uuid === member.uuid))) {
            labels.push(`A unit is in two C3 networks (${network.name} and ${other.name}); each unit joins one.`);
        }
    }
    return [...new Set(labels)];
}

/** Whether a unit is linked into its network now (`degrade` is 1 when hostile ECM degrades it, as the Core Rulebook prints), and why. */
export interface IC3Status {
    linked: boolean;
    degrade: number;
    labels: string[];
}

const C3_ALL_KINDS: EWarKind[] = ["c3-master", "c3-slave", "c3-boosted-master", "c3-boosted-slave", "c3-emergency-master", "c3i", "c3-remote-sensor", "c3-naval", "ecm-nova", "c3-modular"];
const RANGE_BAND_TO_HIT = { short: 0, medium: 2, long: 4, extreme: 6 } as const;
const C3_WORKING_MASTER_KINDS: EWarKind[] = ["c3-master", "c3-boosted-master", "c3-emergency-master"];

/** Troopers a battle armor squad has left (or its design size), undefined for a unit that is not a squad. */
function squadOf(carrier: IEWarCarrier): number | undefined {
    return carrier.getActiveTroopers?.() ?? carrier.getSquadSize?.();
}

/** Hostile ECM covers the unit and no friendly ECCM cancels it (ECCM only where the edition has the mode; TO:AR p.99). */
function isJammed(carrier: IEWarCarrier): boolean {
    const eccm = !!carrier.ewarPlay.inFriendlyEccm && !!getEWarPlayRules(carrier.getRulesEdition())?.items["ecm-guardian"]?.eccm;
    // A Blue Saviour field is hostile ECM that ECCM cannot negate (Pleiades Mechworks).
    return carrier.isBlueSaviourOn?.() ? true : !!carrier.ewarPlay.inHostileEcm && !eccm;
}

function hasBoostedGear(gear: IEWarGear[]): boolean {
    return gear.some((entry) => entry.kind === "c3-boosted-master" || entry.kind === "c3-boosted-slave");
}

/** A Master that still runs a network: an undestroyed Master (or acting Emergency Master) computer that is not switched off by distance from its carrier. */
function isMasterWorking(master: IEWarCarrier): boolean {
    return master.getEWarGear().some((gear) => !gear.destroyed && C3_WORKING_MASTER_KINDS.includes(gear.kind) && !isBaGearDisabled(master, gear));
}

/**
 * What ties `unit` into `network` right now. Out: a destroyed computer, a battle armor squad under three troopers, a Nova link
 * declared this turn; the Master it hangs from destroyed (its portion, BTC to TW) or every Master destroyed (Core Rulebook, and any
 * Slave with no Master named); a stealth system that cuts C3 (not Chameleon LPS; stealth armor also stops Boosted C3); hostile ECM on
 * the unit or on its Master, cutting it off (BTC to BMM), or, in the Core Rulebook, degrading it with a TN penalty on the range gain
 * (`degrade` 1). Friendly ECCM cancels the ECM, and the network may ignore it (Boosted except an Angel suite, which in the Core
 * Rulebook only degrades; the Nova link except another Nova suite). A Standard Master cannot send to Boosted members inside any
 * hostile ECM. With `opts.turn` the acting members come from getC3Members (Emergency Master takeover, Nova delay).
 */
export function getC3Status(unit: IEWarCarrier, network: IC3Network, units: IEWarCarrier[],
    opts: { hostileAngelEcm?: boolean; hostileNovaEcm?: boolean; board?: IEWarBoard; turn?: number } = {}): IC3Status {
    const edition = unit.getRulesEdition();
    const items = getEWarPlayRules(edition)?.items ?? {};
    const editionName = getRulesEdition(edition).name;
    const angel = opts.hostileAngelEcm ?? !!unit.ewarPlay.hostileAngelEcm;
    const nova = opts.hostileNovaEcm ?? !!unit.ewarPlay.hostileNovaEcm;
    const own = unit.getEWarGear();
    const itemFor = (gear: IEWarGear[]) => {
        const type = network.type === "boosted" && !hasBoostedGear(gear) ? "master-slave" : network.type;
        return C3_TYPE_ITEMS[type].kinds.map((kind) => items[kind]).find((found) => !!found?.c3);
    };
    const item = itemFor(own);
    const rule = item?.c3;
    if (!item || !rule) {
        return { linked: false, degrade: 0, labels: [`${C3_TYPE_ITEMS[network.type].label} is not in ${editionName}.`] };
    }
    const apocryphal = item.apocryphal ? " (apocryphal in this edition)" : "";
    const out = (why: string): IC3Status => ({ linked: false, degrade: 0, labels: [`${why}${apocryphal}`] });
    const members = opts.turn !== undefined ? getC3Members(network, units, opts.board ?? {}, opts.turn, edition) : network.members;
    const me = members.find((member) => member.uuid === unit.getUUID());
    if (!me) {
        return out("C3: the unit is not an acting member of the network (a Nova link works from the turn after it is declared; a squad needs three troopers).");
    }
    const fitted = own.filter((gear) => C3_ALL_KINDS.includes(gear.kind));
    const computers = fitted.filter((gear) => !isBaGearDisabled(unit, gear));
    if (computers.length === 0 || computers.every((gear) => gear.destroyed)) {
        return out(fitted.length === 0 ? "C3: the unit carries no C3 computer."
            : computers.length === 0 ? "C3: battle armor equipment works on a unit that is not battle armor only at 3 tons or less (Ghosts of Obeedah p.55)."
                : "C3: the unit computer is destroyed.");
    }
    const squad = squadOf(unit);
    if (squad !== undefined && squad < 3) {
        return out("C3: a battle armor squad with fewer than three troopers loses the network (TO:AUE p.109).");
    }
    const masters = members.filter((member) => member.role === "master")
        .map((member) => units.find((candidate) => candidate.getUUID() === member.uuid)).filter((master): master is IEWarCarrier => !!master);
    const networked = network.type === "master-slave" || network.type === "boosted";
    const controlling = me.master ? units.find((candidate) => candidate.getUUID() === me.master) : undefined;
    if (networked && me.role !== "master") {
        if (rule.portionEnds && me.master && !(controlling && isMasterWorking(controlling))) {
            if (!masters.some((master) => master.getEWarGear().some((gear) => gear.kind === "c3-emergency-master" && !gear.destroyed))) {
                return out("C3: the Master this unit hangs from is destroyed, so its portion of the network is down.");
            }
        } else if (!(rule.portionEnds && me.master) && masters.length > 0 && !masters.some(isMasterWorking)) {
            return out("C3: the network Master is destroyed, so the network is down.");
        }
    }
    for (const gear of own) {
        if (gear.destroyed || !isEWarStealthOn(unit, gear)) continue;
        if (items[gear.kind]?.cutsC3 || (network.type === "boosted" && hasBoostedGear(own) && gear.kind === "stealth-armor")) {
            return out(`C3: cut off by its own stealth system (${editionName}).`);
        }
    }
    const effectOf = (carrier: IEWarCarrier): "none" | "cut-off" | "degrade" => {
        if (!isJammed(carrier)) return "none";
        const gear = carrier.getEWarGear();
        const carrierItem = itemFor(gear);
        const carrierRule = carrierItem?.c3;
        if (!carrierItem || !carrierRule) return "cut-off";
        const immune = carrierItem.c3Immune ?? [];
        if (immune.includes("ecm-except-angel") && angel) {
            const standard = items["c3-master"]?.c3?.ecm ?? "cut-off";
            return standard === "degrade" ? "degrade" : "cut-off";
        }
        if (immune.includes("ecm-except-nova") && nova) return "cut-off";
        return carrierRule.ecm;
    };
    let degraded = false;
    const apply = (effect: "none" | "cut-off" | "degrade", who: string): IC3Status | null => {
        if (effect === "cut-off") return out(`C3: cut off because ${who} is inside hostile ECM (${editionName}).`);
        if (effect === "degrade") degraded = true;
        return null;
    };
    const own1 = apply(effectOf(unit), "the unit");
    if (own1) return own1;
    if (networked && me.role !== "master") {
        for (const master of me.master && controlling ? [controlling] : masters) {
            if (network.type === "boosted" && hasBoostedGear(own) && !hasBoostedGear(master.getEWarGear()) && isJammed(master)) {
                return out("C3: a standard Master cannot send data to Boosted members while it is inside hostile ECM.");
            }
            const cut = apply(effectOf(master), "its Master");
            if (cut) return cut;
        }
    }
    return { linked: true, degrade: degraded ? 1 : 0, labels: degraded ? [`C3: hostile ECM degrades the network, a TN penalty on the range gain (${editionName})${apocryphal}.`] : [] };
}

/**
 * The to-hit change C3 gives the attacker: its range band becomes the nearest networked unit when that is shorter. Under the Core
 * Rulebook, hostile ECM on the attacker, the Master or the nearest unit adds a TN penalty equal to the brackets gained (+1, +2),
 * never stacking. A unit cut off, an edition without C3, and indirect fire (where the edition gives it nothing) get a zero line
 * saying so. Master TAG duplication is a note, not a modifier.
 */
export function getEWarC3Range(attacker: IEWarCarrier, attack: IEWarAttack): IEWarModifier[] {
    const c3 = attack.c3;
    if (!c3) return [];
    const edition = attacker.getRulesEdition();
    const editionName = getRulesEdition(edition).name;
    const items = getEWarPlayRules(edition)?.items ?? {};
    const gearKinds = attacker.getEWarGear().map((gear) => gear.kind);
    const item = C3_ALL_KINDS.filter((kind) => gearKinds.includes(kind)).map((kind) => items[kind]).find((found) => !!found?.c3);
    const rule = item?.c3;
    const apocryphal = item?.apocryphal ? " (apocryphal in this edition)" : "";
    if (!item || !rule) return [{ modifier: 0, label: `C3 is not in ${editionName}: no effect` }];
    if (!c3.status.linked) return [{ modifier: 0, label: `C3 cut off: ${c3.status.labels.join(" ") || "not linked"}` }];
    if (attack.launcher?.indirect && !rule.indirectBenefit) {
        return [{ modifier: 0, label: `C3 gives nothing to indirect fire in ${editionName} (TAG still helps)${apocryphal}` }];
    }
    const order = ["short", "medium", "long", "extreme"] as const;
    const nearest = order.indexOf(c3.nearestRangeBand);
    const own = order.indexOf(c3.ownRangeBand);
    if (nearest >= own) return [];
    const delta = RANGE_BAND_TO_HIT[order[nearest]] - RANGE_BAND_TO_HIT[order[own]];
    const result: IEWarModifier[] = [{ modifier: delta, label: `C3: ${c3.nearestRangeBand} range from the nearest networked unit instead of ${c3.ownRangeBand} (${item.book} p.${item.page})${apocryphal}` }];
    if (rule.ecm === "degrade" && rule.degrade && (c3.status.degrade > 0 || c3.nearestInEcm)) {
        const penalty = (own - nearest) * rule.degrade.perBracket;
        result.push({ modifier: penalty, label: `C3: hostile ECM TN penalty +${penalty} for ${own - nearest} bracket${own - nearest === 1 ? "" : "s"} gained, never stacking (${item.book} p.${item.page})` });
    }
    return result;
}

/**
 * Whether a battle armor system (a "ba-" tag, or the BC3 and BC3i computers) is switched off because it sits on a unit that is
 * not battle armor and weighs more than the edition lets it (Ghosts of Obeedah p.55: 3 tons or less; the item `nonBaTonnage`).
 */
export function isBaGearDisabled(unit: IEWarCarrier, gear: IEWarGear): boolean {
    if (unit.getSquadSize) return false;
    const isBa = gear.tag.startsWith("ba-") || gear.kind.startsWith("stealth-ba") || gear.tag === "is-c3-system" || gear.tag === "is-improved-c3-system";
    if (!isBa) return false;
    const limit = getEWarPlayRules(unit.getRulesEdition())?.items[gear.kind]?.nonBaTonnage;
    const tons = unit.getTonnage?.();
    return limit !== undefined && tons !== undefined && tons > limit;
}

/** Whether every Master of a Master/Slave or Boosted network is lost: its computer destroyed, or knocked out by hostile ECM (TO:AUE p.110). */
function isC3MasterLost(network: IC3Network, units: IEWarCarrier[]): boolean {
    if (network.type !== "master-slave" && network.type !== "boosted") return false;
    const masters = network.members.filter((member) => member.role === "master")
        .map((member) => units.find((candidate) => candidate.getUUID() === member.uuid)).filter((master): master is IEWarCarrier => !!master);
    // A Boosted Master ignores ordinary hostile ECM.
    const knockedOut = (master: IEWarCarrier) => isJammed(master) && !hasBoostedGear(master.getEWarGear());
    return masters.length > 0 && !masters.some((master) => isMasterWorking(master) && !knockedOut(master));
}

/**
 * The members acting in `network` on `turn`: a battle armor squad under three troopers is left out, a Nova link joins the turn
 * after it is declared (`since`), an Emergency Master acts as Master while the Master is lost and it has run fewer turns than
 * the edition allows (6), and each Remote Sensor pod of the board (`pod:<hex>:<launch turn>`) is a stationary Slave for the 3 full
 * turns after its launch turn (TO:AUE pp.110-111).
 */
export function getC3Members(network: IC3Network, units: IEWarCarrier[], board: IEWarBoard, turn: number, edition?: string): { uuid: string; role: C3Role; master?: string }[] {
    const items = getEWarPlayRules(edition ?? units[0]?.getRulesEdition() ?? "total-warfare")?.items ?? {};
    const emergencyTurns = items["c3-emergency-master"]?.c3Turns ?? 6;
    const podTurns = items["c3-remote-sensor"]?.c3Turns ?? 3;
    const lost = isC3MasterLost(network, units);
    const members: { uuid: string; role: C3Role; master?: string }[] = [];
    for (const member of network.members) {
        if (member.since !== undefined && turn <= member.since) continue;
        const carrier = units.find((candidate) => candidate.getUUID() === member.uuid);
        const squad = carrier ? squadOf(carrier) : undefined;
        if (squad !== undefined && squad < 3) continue;
        let role = member.role;
        if (role === "emergency" && lost && carrier && (carrier.ewarPlay.c3EmergencyTurns ?? 0) < emergencyTurns
            && carrier.getEWarGear().some((gear) => gear.kind === "c3-emergency-master" && !gear.destroyed)) {
            role = "master";
        }
        members.push(member.master ? { uuid: member.uuid, role, master: member.master } : { uuid: member.uuid, role });
    }
    for (const pod of board.sensorPods ?? []) {
        if (pod.network === network.name && turn > pod.turn && turn <= pod.turn + podTurns) {
            members.push({ uuid: `pod:${pod.hex}:${pod.turn}`, role: "slave" });
        }
    }
    return members;
}

/** One turn of an Emergency Master acting as Master: it counts while the Master is lost and the unit is not inside hostile ECM. */
export function tickC3Emergency(unit: IEWarCarrier, units: IEWarCarrier[], network: IC3Network): void {
    const emergencyTurns = getEWarPlayRules(unit.getRulesEdition())?.items["c3-emergency-master"]?.c3Turns ?? 6;
    const acting = unit.getEWarGear().some((gear) => gear.kind === "c3-emergency-master" && !gear.destroyed)
        && isC3MasterLost(network, units) && (unit.ewarPlay.c3EmergencyTurns ?? 0) < emergencyTurns;
    if (acting && !isInHostileEcm(unit)) {
        unit.ewarPlay.c3EmergencyTurns = (unit.ewarPlay.c3EmergencyTurns ?? 0) + 1;
    }
}

/**
 * Fires a Remote Sensor pod into `network` at `hex` on `turn`: refused with labels when the edition has no pod, the network is
 * C3i (incompatible), or the pod would take it over its unit limit. A pod is a stationary Slave (see getC3Members).
 */
export function addC3SensorPod(board: IEWarBoard, network: IC3Network, units: IEWarCarrier[], edition: string, pod: { hex: string; turn: number }): string[] {
    const editionName = getRulesEdition(edition).name;
    if (!getEWarPlayRules(edition)?.items["c3-remote-sensor"]) {
        return [`The C3 Remote Sensor Launcher is not in ${editionName}.`];
    }
    if (network.type === "c3i") {
        return ["A C3 Remote Sensor pod cannot join a C3i network."];
    }
    const existing = (board.sensorPods ?? []).filter((entry) => entry.network === network.name).length;
    const labels = validateC3Network(network, units, edition, { pods: existing + 1 });
    if (labels.length > 0) return labels;
    board.sensorPods = [...(board.sensorPods ?? []), { network: network.name, hex: pod.hex, turn: pod.turn }];
    return [];
}

// ---- Aerospace ECM (Phase 3) ----

/** The classes of aerospace craft the field rule tells apart (SO p.99). */
export type AeroEcmClass = "fighter" | "small-craft" | "large-craft";

/** What the aerospace ECM rule needs: the hostile fields on the line of fire (one entry per hex and class), the attacker, the map. */
export interface IEWarAeroEcmContext {
    fields: { hex: string; class: AeroEcmClass }[];
    attackerClass: AeroEcmClass;
    mapsheet: "aero" | "ground";
    /** ECCM: "tuned" a fighter or Small Craft suite cancels fighter and Small Craft ECM in `ownHex` and takes 1 off Large Craft ECM; a Large Craft rolls its MoS. */
    eccm?: "tuned" | { roll: number };
    ownHex?: string;
}

/**
 * The to-hit modifier of hostile ECM between aerospace craft, as the attacker edition prints it: +1 for each ECM hex on the line
 * of fire (a class counts once in a hex), never above +4 (SO p.99); Large Craft ignore fighter and Small Craft ECM; ECCM takes
 * fighter ECM out of the own hex and 1 off Large Craft ECM, or the Large Craft ECCM Control Roll margin off the total. On a ground
 * mapsheet the normal ECM rules apply instead (TW p.238); AT2R p.25 gives no effect between AT2 units.
 */
export function getEWarAeroEcm(unit: IEWarCarrier, ctx: IEWarAeroEcmContext): IEWarModifier[] {
    const edition = unit.getRulesEdition();
    const guardian = getEWarPlayRules(edition)?.items["ecm-guardian"];
    if (guardian?.aeroEcm === "none-between-aero") {
        return [{ modifier: 0, label: `Aerospace ECM: no effect on combat between AT2 units (AT2R p.25)` }];
    }
    if (guardian?.aeroEcm !== "so-field") {
        return [{ modifier: 0, label: `Aerospace ECM: no aerospace ECM rule in ${getRulesEdition(edition).name}` }];
    }
    if (ctx.mapsheet === "ground") {
        return [{ modifier: 0, label: "Aerospace ECM on a ground mapsheet: the normal ground ECM rules apply (TW p.238)" }];
    }
    // Fighters and Small Craft are one class (SO p.99); one field of a class counts in a hex.
    const large = (klass: AeroEcmClass) => klass === "large-craft";
    const seen = new Set<string>();
    let fields = ctx.fields.filter((field) => {
        const key = `${field.hex}:${large(field.class)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return ctx.attackerClass !== "large-craft" || large(field.class);
    });
    let reduction = 0;
    if (ctx.eccm === "tuned" && !large(ctx.attackerClass)) {
        // A tuned fighter or Small Craft suite cancels fighter and Small Craft ECM in its own hex and takes 1 off one Large Craft field.
        fields = fields.filter((field) => !(field.hex === ctx.ownHex && !large(field.class)));
        const firstLarge = fields.findIndex((field) => large(field.class));
        if (firstLarge >= 0) fields.splice(firstLarge, 1);
    } else if (ctx.eccm && typeof ctx.eccm === "object" && large(ctx.attackerClass)) {
        // Only a Large Craft rolls the ECCM Control Roll, -1 per point of the margin (SO p.99).
        reduction = Math.max(0, ctx.eccm.roll);
    }
    const counted = Math.min(4, fields.length);
    const value = Math.max(0, counted - reduction);
    const eccm = reduction > 0 ? `, ECCM -${reduction}` : "";
    return [{ modifier: value, label: `Aerospace ECM (advanced aerospace rule): ${counted} hostile ECM hex${counted === 1 ? "" : "es"} on the line of fire (max +4)${eccm} (SO p.99)` }];
}

/** The best ECCM Control Roll margin among Naval C3 members, which they all share (SO p.112). */
export function getNavalC3EccmRoll(rolls: number[]): number {
    return rolls.length ? Math.max(0, ...rolls) : 0;
}

/**
 * Hexes an aerospace integral ECM field reaches (SO pp.99-100): a fighter none beyond its own hex; a Small Craft its own hex, one
 * more with a suite; a JumpShip or DropShip one hex; a WarShip or Station two; each critical hit to the field takes one off.
 */
export function getAeroEcmRadius(craft: "fighter" | "small-craft" | "jumpship" | "dropship" | "warship" | "station", hasSuite: boolean, crits: number): number {
    const base = craft === "warship" || craft === "station" ? 2 : craft === "jumpship" || craft === "dropship" ? 1 : craft === "small-craft" && hasSuite ? 1 : 0;
    return Math.max(0, base - Math.max(0, crits));
}

/** Whether the unit carries anything C3 (a computer, or a Remote Sensor launcher), for the views that show the C3 block. */
export function hasC3Gear(unit: IEWarCarrier): boolean {
    return getC3GearType(unit) !== undefined || unit.getEWarGear().some((gear) => gear.kind === "c3-remote-sensor");
}

/** Sets or clears one play-state flag by hand on a unit (the C3 block checkboxes): the state is replaced so a view can compare it. */
export function setEWarFlag(unit: IEWarCarrier, field: "inFriendlyEccm" | "hostileAngelEcm" | "hostileNovaEcm", on: boolean): void {
    unit.ewarPlay = { ...unit.ewarPlay, [field]: on ? true : undefined };
}

/** Infantry disposable Narc launchers still unfired (each fires once, MT p.40). */
export function getInfantryNarcLeft(unit: IEWarCarrier): number {
    return Math.max(0, (unit.getNarcLaunchers?.() ?? 0) - (unit.ewarPlay.narcFired ?? 0));
}

/** Fires one infantry Narc launcher; nothing when none is left. The platoon may not fire its normal weapons that phase. */
export function fireInfantryNarc(unit: IEWarCarrier): void {
    if (getInfantryNarcLeft(unit) > 0) {
        unit.ewarPlay = { ...unit.ewarPlay, narcFired: (unit.ewarPlay.narcFired ?? 0) + 1 };
    }
}

/** The friendly ECCM tick a force gives: suites in ECCM mode (communications equipment as halves), an Angel suite flagged apart. */
export function getForceEccmTick(units: IEWarCarrier[]): { friendlyEccmCount: number; friendlyAngelEccm: boolean } {
    const { suites, angel } = getEWarEccmSuites(units);
    return { friendlyEccmCount: suites, friendlyAngelEccm: angel };
}
