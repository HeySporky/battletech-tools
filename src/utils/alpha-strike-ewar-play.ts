import { isCustomAlphaStrikeAbilityCode } from "../data/alpha-strike-special-abilities";
import { canUseASMunition, getASMunition } from "../data/alpha-strike-munitions";
import { AlphaStrikeEWarSpecial, IEWarItemRule, asRulesEditions, getAlphaStrikeEWarRules, IAlphaStrikeEdition } from "../data/rules-editions";

/**
 * Alpha Strike electronic warfare in play (#642 Phase 5): the specials a card lists (ECM, probes, stealth, AMS, Narc,
 * C3, drones, jammers, TSEMP) applied as modifiers and status lines, beside the Classic `ewar-play.ts`. Pure: it works
 * on the small `IASEWarUnit` interface, so the unit class and the tests share it. No hex map: the player declares
 * coverage, line of sight and range (design Call 1). Every line names its book and page.
 */

/** Our own special (CHF#) rides with the book codes. */
// SNC (sonic projectors, #645) is ours too.
export type ASEWarCode = AlphaStrikeEWarSpecial | "CHF" | "SNC" | "MTAS" | "ITAS" | "BSF" | "NPC" | "HAIL" | "PSC" | "SMKT" | "SMKB" | "PBR" | "PBJ";

export type ASEcmMode = "ecm" | "eccm";

export interface IASEWarSpecial {
    code: ASEWarCode;
    /** The ability exactly as the card lists it, with its turret brackets removed. */
    raw: string;
    /** The number after the code: how many (C3M 2, RSD 1, TSEMP 2, CHF 4); 1 when none is printed. */
    count: number;
    /** Inside a TUR(...) run: an AMS there defends every arc. */
    turret: boolean;
    /** TSEMP-O: the one-shot form, whose number counts attacks for the whole scenario. */
    oneShot?: boolean;
}

/** Longest codes first, so C3BSM never reads as C3 and TSEMP-O never as TSEMP. */
const AS_EWAR_CODES: ASEWarCode[] = [
    "TSEMP", "C3BSM", "C3BSS", "SNARC", "CNARC", "INARC", "C3EM", "C3RS", "LECM", "AECM", "LMAS", "LPRB", "RAMS", "NOVA", "LTAG",
    "C3M", "C3S", "C3I", "JAM", "TAG", "WAT", "ECM", "AMS", "PRB", "DRO", "RSD", "NC3", "STL", "MAS", "CHF", "SNC", "MTAS", "ITAS", "BSF", "NPC", "HAIL", "PSC", "SMKT", "SMKB", "PBR", "PBJ", "BH", "DJ", "HJ",
];
const AS_EWAR_CODE_PATTERN = new RegExp(`^(TSEMP-O|${AS_EWAR_CODES.join("|")})\\s*(\\d+(?:/\\d+)*)?$`);

/**
 * The E-War specials in a card's ability list. Codes match exactly, so "ECM" never reads inside "AECM" or "LECM";
 * the number after a code (with or without a space) is its count; TUR(...) runs mark their AMS as turreted. Our own
 * codes (CHF#) are dropped below Custom Homebrew (rules level 6; canon 0-4, Apocryphal 5; NGCFells, 2026-11-21).
 */
export function getASEWarSpecials(abilities: string[], rulesLevel: number | undefined = undefined): IASEWarSpecial[] {
    const result: IASEWarSpecial[] = [];
    let inTurret = false;
    for (const ability of abilities) {
        let text = ability.trim();
        let turret = inTurret;
        if (/^TUR\(/i.test(text)) {
            inTurret = true;
            turret = true;
            text = text.replace(/^TUR\(/i, "");
            // A TUR( fragment holds damage figures ("2/2/1"), which no E-War code matches; a closing ")" ends the run.
        }
        if (text.endsWith(")")) {
            text = text.slice(0, -1).trim();
            inTurret = false;
        }
        const match = AS_EWAR_CODE_PATTERN.exec(text);
        if (!match) continue;
        const oneShot = match[1] === "TSEMP-O";
        const code = (oneShot ? "TSEMP" : match[1]) as ASEWarCode;
        if (result.some((entry) => entry.code === code)) continue;
        // HAIL (the Hailstorm) and CHF (the canon Chaff Pod) are inferred conversions that stay at their own level (#647); the Chaff Pod 2.0 is gated by its record.
        if (code !== "HAIL" && code !== "CHF" && (isCustomAlphaStrikeAbilityCode(`${code}1`) || isCustomAlphaStrikeAbilityCode(code)) && (rulesLevel ?? 0) < 6) continue;
        result.push({ code, raw: text, count: match[2] ? parseInt(match[2], 10) : 1, turret, ...(oneShot ? { oneShot } : {}) });
    }
    return result;
}

/** The unit's MHQ rating from an "MHQ7" style ability; 0 when it has none. */
export function getASMhqRating(abilities: string[]): number {
    for (const ability of abilities) {
        const match = /^MHQ\s*(\d+)$/.exec(ability.trim());
        if (match) return Number(match[1]);
    }
    return 0;
}

/** The edition's own entry for a special, else the latest earlier edition's marked apocryphal; never a later edition's. */
export function getASEWarRule(
    code: ASEWarCode,
    edition: string,
    editions: IAlphaStrikeEdition[] = asRulesEditions,
): { rule: IEWarItemRule; apocryphal: boolean } | undefined {
    const index = editions.findIndex((each) => each.tag === edition);
    if (index < 0) return undefined;
    for (let at = index; at >= 0; at--) {
        const rule = editions[at].ewarRules?.specials[code as AlphaStrikeEWarSpecial];
        if (rule) return { rule, apocryphal: at !== index };
    }
    return undefined;
}

/** "ASCE p.77" for the special in this edition (the apocryphal earlier printing when the edition dropped it). */
export function getASEWarCitation(code: ASEWarCode, edition: string): string {
    const found = getASEWarRule(code, edition);
    return found ? `${found.rule.book} p.${found.rule.page}${found.apocryphal ? ", apocryphal" : ""}` : "";
}

export interface IASEWarTarget {
    stealth?: "unit" | "battle-armor" | "infantry";
    mimetic?: 2 | 3;
    tagged?: boolean;
}

export interface IASBoosterState { streak: number; dead?: boolean; usedThisTurn?: boolean }

export interface IASEWarPlayState {
    ecmMode?: ASEcmMode;
    angelModes?: [ASEcmMode, ASEcmMode];
    mhqField?: ASEcmMode;
    stealthOff?: boolean;
    stoodStill?: boolean;
    /** Hostile ECM-mode suites covering this unit, and whether one of them is an Angel (both fields ECM) or a NOVA. */
    hostileEcm?: number;
    hostileAngel?: boolean;
    hostileNova?: boolean;
    hostileEccm?: number;
    /** The line to this unit's C3 master crosses hostile ECM. */
    c3LineBlocked?: boolean;
    /** A drone: the line from its controller passes through an ECM bubble (ASCE p.84). */
    droneLineBlocked?: boolean;
    /** A drone shut down in an End Phase (hostile ECM, a controller caught by ECM or a blocked line); restarts in the End Phase after the cause ends. */
    droneOff?: boolean;
    /** A drone whose controller was eliminated: shut down for the rest of the game (ASCE p.84). */
    droneLost?: boolean;
    narcs?: ("SNARC" | "CNARC" | "INARC")[];
    /** A jam on this unit: `from` is the uuid of the jammer unit, whose running turns and survival the jam depends on (#648 M10). */
    jammed?: { kind: "DJ" | "HJ"; turnsLeft: number; from?: string }[];
    jammerTurnsLeft?: number;
    jammerSpent?: boolean;
    c3EmergencyTurnsLeft?: number;
    /** The emergency master has run its turns and cannot start again. */
    c3EmergencySpent?: boolean;
    c3Burnt?: boolean;
    /** C3 remote sensors fired this scenario (4 a game, ASCE p.82). */
    c3rsUsed?: number;
    /** Remote sensors dispensed this turn by an RSD (one per dispenser per turn, ASCE p.88). */
    rsdUsed?: number;
    ramsUse?: "self" | "friend";
    target?: IASEWarTarget;
    tsempUsed?: number;
    tsempOneShotUsed?: number;
    tsempHit?: { effect: "shutdown" | "interference"; turnsLeft: number };
    /** Chaff pods fired this scenario, and a cloud over the unit this turn (CHF#, ours). */
    chaffFired?: number;
    chaffCloud?: boolean;
    /** Blue Saviour (BSF, ours): the field is on, how many turns it has run, and whether a failure or a critical hit killed it for the scenario. */
    bsfOn?: boolean;
    bsfTurnsOn?: number;
    bsfDead?: boolean;
    /** Power Booster (PBR, PBJ; ours): consecutive turns used, a dead booster, and use this turn. */
    boost?: { PBR?: IASBoosterState; PBJ?: IASBoosterState };
    /** Smoke laid by a Smoker (trail) or a Buckler dispenser (screen); turns left counts this turn and the next; dispenser uses spent. */
    smokeLaid?: "trail" | "screen";
    smokeTurnsLeft?: number;
    smokeUsesSpent?: number;
    /** A stunned conventional infantry unit that failed its 2D6 against 8: moves away and cannot attack; turns left counts this turn and the next. */
    fellBack?: { turnsLeft: number };
}

export interface IASEWarUnit {
    uuid: string;
    abilities: string[];
    type: string;
    isInfantry: boolean;
    isAerospace: boolean;
    rulesLevel?: number;
    /** The ASCE Alternate Munition key the unit's selected special ammunition plays as (alpha-strike-munitions.ts, #647). */
    munition?: string;
    ewarPlay: IASEWarPlayState;
    /** Heat level 4 shuts a unit down (ASCE p.53). */
    currentHeat?: number;
    isWrecked(): boolean;
}

export interface IASC3Network {
    name: string;
    kind: "c3" | "c3-boosted" | "c3i" | "nova" | "naval";
    members: string[];
    master?: string;
    enemyJam?: boolean;
}

export interface IASEWarBoard {
    /** Carrier uuid -> the friendly uuids inside its ECM bubble. */
    friendlyEcm?: Record<string, string[]>;
    c3Networks?: IASC3Network[];
    /** Drone uuid -> its controller's uuid. */
    droneControl?: Record<string, string>;
    /** Chaff cloud: the uuids inside a cloud (CHF#, ours). */
    chaffCloud?: Record<string, string[]>;
}

const specialsOf = (unit: IASEWarUnit): IASEWarSpecial[] => getASEWarSpecials(unit.abilities, unit.rulesLevel);
export const hasASSpecial = (unit: IASEWarUnit, code: ASEWarCode): boolean => specialsOf(unit).some((entry) => entry.code === code);

/** A battle armor or conventional infantry card (STL and its self-jam treat them apart from other units). */
const isInfantryLike = (unit: IASEWarUnit): boolean => unit.isInfantry || ["BA", "CI"].includes(unit.type.trim().toUpperCase());

/** Wrecked, shut down by heat (level 4) or by a TSEMP: its electronics stop working (ASCE p.53, 2013 p.45). */
export function isASInoperative(unit: IASEWarUnit): boolean {
    return unit.isWrecked() || unit.ewarPlay.tsempHit?.effect === "shutdown" || (unit.currentHeat ?? 0) >= 4;
}

const isBattleArmor = (unit: IASEWarUnit): boolean => unit.type.trim().toUpperCase() === "BA";

/** Whether a unit's STL is on and works: not toggled off (ASCE only), not jammed by a DJ, unit not wrecked. */
export function isASStealthOn(unit: IASEWarUnit, edition: string): boolean {
    if (!hasASSpecial(unit, "STL") || isASInoperative(unit) || isASBlueSaviourOn(unit)) return false;
    if (unit.ewarPlay.jammed?.some((jam) => jam.kind === "DJ" && jam.turnsLeft > 0)) return false;
    const toggles = !!getAlphaStrikeEWarRules(edition)?.stealthJamsOwnEcm; // the End Phase toggle is printed only with the self-jam paragraph
    return !(toggles && unit.ewarPlay.stealthOff);
}

/** What the unit projects: ECM-mode and ECCM-mode suite counts and the widest radius in inches (design Calls 1, 2). */
export function getASEcmFields(unit: IASEWarUnit, edition: string): { ecm: number; eccm: number; inches: number } {
    const none = { ecm: 0, eccm: 0, inches: 0 };
    if (isASInoperative(unit)) return none;
    const jammed = unit.ewarPlay.jammed?.some((jam) => jam.kind === "DJ" && jam.turnsLeft > 0);
    if (jammed) return none;
    const specials = specialsOf(unit);
    const rules = getAlphaStrikeEWarRules(edition);
    let ecm = 0;
    let eccm = 0;
    let inches = 0;
    const add = (mode: ASEcmMode, radius: number) => {
        if (mode === "eccm") eccm++;
        else ecm++;
        inches = Math.max(inches, radius);
    };
    const radiusOf = (code: ASEWarCode, fallback: number) => getASEWarRule(code, edition)?.rule.inches ?? fallback;
    const has = (code: ASEWarCode) => specials.some((entry) => entry.code === code);
    const mode = unit.ewarPlay.ecmMode ?? "ecm";
    let angelModes: [ASEcmMode, ASEcmMode] = unit.ewarPlay.angelModes ?? ["ecm", "ecm"];
    // ECM, WAT and NOVA are one suite each; WAT and NOVA list ECM as well, which is the same suite.
    if (has("ECM") || has("WAT") || has("NOVA")) add(mode, radiusOf("ECM", 12));
    if (has("AECM")) {
        add(angelModes[0], radiusOf("AECM", 12));
        add(angelModes[1], radiusOf("AECM", 12));
    }
    if (has("LECM")) add("ecm", radiusOf("LECM", 2));
    const mhq = getASMhqRating(unit.abilities);
    if (mhq >= 7 && unit.ewarPlay.mhqField) add(unit.ewarPlay.mhqField, radiusOf("ECM", 12));
    // STL on a non-infantry unit jams its own ECM (ASCE p.79); an Angel may keep one ECCM field.
    if (rules?.stealthJamsOwnEcm && isASStealthOn(unit, edition) && !isInfantryLike(unit)) {
        angelModes = unit.ewarPlay.angelModes ?? ["ecm", "ecm"];
        const kept = has("AECM") ? Math.min(1, angelModes.filter((each) => each === "eccm").length) : 0;
        return kept > 0 ? { ecm: 0, eccm: kept, inches: radiusOf("AECM", 12) } : none;
    }
    return { ecm, eccm, inches };
}

/** The friendly ECM and ECCM suites covering each unit: each carrier covers itself and the uuids the board names. */
export function getASFriendlyCover(board: IASEWarBoard, units: IASEWarUnit[], edition: string): Map<string, { ecm: number; eccm: number }> {
    const cover = new Map<string, { ecm: number; eccm: number }>();
    const known = new Set(units.map((unit) => unit.uuid));
    const put = (uuid: string, fields: { ecm: number; eccm: number }) => {
        const current = cover.get(uuid) ?? { ecm: 0, eccm: 0 };
        cover.set(uuid, { ecm: current.ecm + fields.ecm, eccm: current.eccm + fields.eccm });
    };
    for (const carrier of units) {
        const fields = getASEcmFields(carrier, edition);
        if (fields.ecm + fields.eccm === 0) continue;
        put(carrier.uuid, fields);
        for (const uuid of board.friendlyEcm?.[carrier.uuid] ?? []) {
            if (known.has(uuid) && uuid !== carrier.uuid) put(uuid, fields);
        }
    }
    return cover;
}

export interface IASEcmResolution {
    inHostileEcm: boolean;
    hostileAngel: boolean;
    hostileNova: boolean;
    inFriendlyEcm: boolean;
    selfJammed: boolean;
    lines: string[];
}

/**
 * ECM against ECCM (design Call 1): the hostile ECM-mode suites covering the unit are set against the friendly ECCM
 * suites covering it, the higher count wins and a tie cancels both (ASCE p.161). Friendly ECM cover against hostile
 * ECCM works the same way. STL on a non-infantry unit puts it inside hostile ECM for its own gear regardless (Call 2).
 */
export function resolveASEcm(unit: IASEWarUnit, cover: { ecm: number; eccm: number } | undefined, edition: string): IASEcmResolution {
    const state = unit.ewarPlay;
    const lines: string[] = [];
    const friendly = cover ?? { ecm: 0, eccm: 0 };
    const hostileEcm = state.hostileEcm ?? 0;
    const hostileEccm = state.hostileEccm ?? 0;
    const ecmCite = getASEWarCitation("ECM", edition);
    const hostileWins = hostileEcm > friendly.eccm;
    const friendlyWins = friendly.ecm > hostileEccm;
    const rules = getAlphaStrikeEWarRules(edition);
    const selfJammed = !!rules?.stealthJamsOwnEcm && isASStealthOn(unit, edition) && !isInfantryLike(unit);
    const bsfJammed = isASBlueSaviourOn(unit);
    if (hostileEcm > 0) {
        lines.push(hostileWins
            ? `Inside hostile ECM: ${hostileEcm} hostile ECM against ${friendly.eccm} friendly ECCM (${ecmCite})`
            : `Hostile ECM cancelled: ${hostileEcm} hostile ECM against ${friendly.eccm} friendly ECCM (${ecmCite})`);
    }
    if (friendly.ecm > 0) {
        lines.push(friendlyWins
            ? `Inside friendly ECM: ${friendly.ecm} against ${hostileEccm} hostile ECCM (${ecmCite})`
            : `Friendly ECM cancelled: ${friendly.ecm} against ${hostileEccm} hostile ECCM (${ecmCite})`);
    }
    if ((state.hostileAngel || state.hostileNova) && hostileEcm === 0) {
        lines.push(`${state.hostileAngel ? "Hostile Angel" : "Hostile NOVA"} is ticked but no hostile ECM suite is counted: it has no effect until a suite is entered`);
    }
    if (bsfJammed) lines.push("Blue Saviour on: counts as inside hostile ECM that ECCM cannot negate, and STL gives no benefit (BSF, ours)");
    if (selfJammed) lines.push(`STL jams its own probes, C3 and drones; friendly ECCM does not clear it (${getASEWarCitation("STL", edition)})`);
    return {
        inHostileEcm: hostileWins || selfJammed || bsfJammed,
        hostileAngel: !!state.hostileAngel && hostileWins,
        hostileNova: !!state.hostileNova && hostileWins,
        inFriendlyEcm: friendlyWins,
        selfJammed,
        lines,
    };
}

// ---------------------------------------------------------------------------------------------------------------
// Defenses, damage and own-attack to-hit (Task 3)
// ---------------------------------------------------------------------------------------------------------------

const cite = (code: ASEWarCode, edition: string): string => getASEWarCitation(code, edition);

/** What the unit defends itself with this turn, as lines for the view: stealth, mimetic, AMS, RAMS and Narc beacons. */
export function getASDefenseLines(unit: IASEWarUnit, edition: string): string[] {
    const lines: string[] = [];
    const state = unit.ewarPlay;
    if (hasASSpecial(unit, "STL") && getASEWarRule("STL", edition) && isASStealthOn(unit, edition)) {
        if (isBattleArmor(unit)) lines.push(`+1 Short and Medium, +2 Long and Extreme to attacks against this unit (STL battle armor, ${cite("STL", edition)})`);
        else if (isInfantryLike(unit)) lines.push(`STL on conventional infantry: no printed modifier (${cite("STL", edition)} covers non-infantry and battle armor)`);
        else lines.push(`+1 Medium, +2 Long/Extreme to attacks against this unit (STL, ${cite("STL", edition)})`);
    }
    if (state.stoodStill) {
        if (hasASSpecial(unit, "MAS")) lines.push(`+3 to non-physical attacks against this unit this turn: it stood still (MAS, ${cite("MAS", edition)})`);
        else if (hasASSpecial(unit, "LMAS")) lines.push(`+2 to non-physical attacks against this unit this turn: it stood still (LMAS, ${cite("LMAS", edition)})`);
    }
    const ams = specialsOf(unit).find((entry) => entry.code === "AMS");
    if (ams) lines.push(`AMS: -1 damage (minimum 1) from IF, SRM and LRM attacks${ams.turret ? ", every arc (turret)" : ", front arc only"} (${cite("AMS", edition)})`);
    if (hasASSpecial(unit, "RAMS") && getASEWarRule("RAMS", edition)) {
        const used = state.ramsUse ? `; used this turn for ${state.ramsUse === "self" ? "itself" : "a friend"}, so not for the other` : "";
        lines.push(`RAMS: as an AMS for itself, or -1 missile damage to one friendly unit within 2"${used} (${cite("RAMS", edition)})`);
    }
    if (state.narcs?.length) lines.push(`Narc beacon attached (${state.narcs.join(", ")}): +1 damage from IF, LRM and SRM attacks unless inside friendly ECM (${cite(state.narcs[0], edition)})`);
    return lines;
}

export interface IASIncomingHit {
    /** An IF, LRM or SRM attack (AMS, RAMS and Narc act on these only). */
    missile: boolean;
    /** The hit comes in through the unit's front arc. */
    front: boolean;
    /** A friendly unit within 2" whose RAMS defends this one (the caller sets its `ramsUse` when it is spent). */
    ramsFrom?: IASEWarUnit;
    /** The attack is an energy attack (a Blue Saviour halves it). */
    energy?: boolean;
    /** A nuclear attack: no AMS, RAMS, chaff or Blue Saviour reduces it (NPC, ours). */
    nuclear?: boolean;
}

/**
 * Damage after Narc, AMS and RAMS (design Call 3): the Narc +1 first (not inside friendly ECM), then AMS or the unit's
 * own RAMS takes 1 off (front arc, or any arc when turreted), then a friend's RAMS takes another; minimum 1.
 */
export function getASIncomingDamage(
    unit: IASEWarUnit, damage: number, hit: IASIncomingHit, inFriendlyEcm: boolean, edition: string,
): { damage: number; lines: string[]; spendsRams?: "self" | "friend"; spendsFriendRams?: boolean } {
    if (hit.nuclear) return { damage, lines: ["Nuclear: AMS, RAMS, chaff and the Blue Saviour do not reduce it (NPC, ours)"] };
    if (!hit.missile) {
        if (hit.energy && isASBlueSaviourOn(unit)) return { damage: Math.max(1, Math.floor(damage / 2)), lines: ["Blue Saviour: energy damage halved, minimum 1 (BSF, ours)"] };
        return { damage, lines: [] };
    }
    const lines: string[] = [];
    let result = damage;
    let spendsRams: "self" | "friend" | undefined;
    let spendsFriendRams = false;
    const state = unit.ewarPlay;
    if (state.narcs?.length) {
        if (inFriendlyEcm) lines.push(`Narc +1 cancelled by friendly ECM (${cite(state.narcs[0], edition)})`);
        else {
            result += 1;
            lines.push(`Narc +1 damage (${cite(state.narcs[0], edition)})`);
        }
    }
    const ams = specialsOf(unit).find((entry) => entry.code === "AMS");
    // A unit inside a chaff cloud counts as covered by an AMS of any arc (CHF, ours).
    const covered = (!!ams && (hit.front || ams.turret)) || !!state.chaffCloud;
    if (covered) {
        result = Math.max(1, result - 1);
        lines.push(ams ? `AMS -1 damage, minimum 1 (${cite("AMS", edition)})` : "Chaff cloud: -1 damage, minimum 1 (CHF, ours)");
    } else if (ams) {
        lines.push(`AMS does not defend this arc (${cite("AMS", edition)})`);
    } else if (hasASSpecial(unit, "RAMS") && getASEWarRule("RAMS", edition) && state.ramsUse !== "friend" && hit.front) {
        result = Math.max(1, result - 1);
        spendsRams = "self";
        lines.push(`RAMS as an AMS for itself, -1 damage, minimum 1 (${cite("RAMS", edition)})`);
    }
    // The field answers missiles as one AMS, but does not stack with the unit's own AMS, RAMS or a chaff cloud (BSF, ours).
    if (isASBlueSaviourOn(unit) && !covered && spendsRams !== "self") {
        result = Math.max(1, result - 1);
        lines.push("Blue Saviour: -1 damage, as an AMS (BSF, ours)");
    }
    const friend = hit.ramsFrom;
    if (friend && hasASSpecial(friend, "RAMS") && !isASInoperative(friend) && friend.ewarPlay.ramsUse !== "self" && getASEWarRule("RAMS", edition)) {
        result = Math.max(1, result - 1);
        spendsFriendRams = true;
        lines.push(`RAMS of a friendly unit within 2" takes 1 off (${cite("RAMS", edition)})`);
    }
    // Own and a friend RAMS on one hit: both are spent (ASCE p.89).
    return { damage: result, lines, spendsRams: spendsRams ?? (spendsFriendRams ? "friend" : undefined), spendsFriendRams };
}

export interface IASEWarToHit {
    short: number;
    medium: number;
    long: number;
    extreme: number;
    labels: string[];
}

/** The attacker's to-hit additions this turn: the target's stealth or mimetic ticks, HJ on missiles, NC3, TSEMP interference. */
export function getASEWarToHit(unit: IASEWarUnit, status: { hj: boolean; nc3Up: boolean }, edition: string, missileAttack: boolean): IASEWarToHit {
    const result: IASEWarToHit = { short: 0, medium: 0, long: 0, extreme: 0, labels: [] };
    const add = (label: string, short: number, medium: number, long: number, extreme: number) => {
        result.short += short; result.medium += medium; result.long += long; result.extreme += extreme;
        result.labels.push(label);
    };
    const target = unit.ewarPlay.target;
    if (target?.stealth && getASEWarRule("STL", edition)) {
        const where = cite("STL", edition);
        if (target.stealth === "battle-armor") add(`Target STL battle armor: +1 Short and Medium, +2 Long and Extreme (${where})`, 1, 1, 2, 2);
        else if (target.stealth === "infantry") result.labels.push(`STL on conventional infantry: no printed modifier (${where} covers non-infantry and battle armor)`);
        else add(`Target STL: +1 Medium, +2 Long and Extreme (${where})`, 0, 1, 2, 2);
    }
    if (target?.mimetic === 3) add(`Target MAS stood still: +3 to non-physical attacks (${cite("MAS", edition)})`, 3, 3, 3, 3);
    else if (target?.mimetic === 2) add(`Target LMAS stood still: +2 to non-physical attacks (${cite("LMAS", edition)})`, 2, 2, 2, 2);
    if (target?.tagged) result.labels.push(`Target designated by TAG (${cite("TAG", edition)}); no change to the card's numbers`);
    if (status.hj && missileAttack && getASEWarRule("HJ", edition)) add(`Homing Jammer: +1 to attacks that include IATM, LRM, CNARC, SNARC or SRM (${cite("HJ", edition)})`, 1, 1, 1, 1);
    if (unit.isAerospace && status.nc3Up && getASEWarRule("NC3", edition)) add(`Naval C3 network: -1 in aerospace combat (${cite("NC3", edition)})`, -1, -1, -1, -1);
    if (unit.ewarPlay.tsempHit?.effect === "interference" && getASEWarRule("TSEMP", edition)) {
        add(`TSEMP interference: +1 to this unit's attacks and Control Rolls (${cite("TSEMP", edition)})`, 1, 1, 1, 1);
    }
    const munition = getASMunition(unit.munition, unit.rulesLevel ?? 0);
    if (munition) {
        if (!canUseASMunition(munition, unit.abilities)) result.labels.push(`${munition.name} ammo: needs ${munition.requires.slice(0, 2).join(" or ")}; no modifier`);
        // Only a positive modifier (Armor-Piercing +1) is a flat one. A -2 is "a miss by 2 or less still hits" against a qualifying target
        // (TMM 2+, heat 1+, TAG-designated, airborne), so it is a line for the player, not a change to the card's number (ASCE pp.145-150).
        else if (munition.toHit && munition.toHit > 0) add(`+${munition.toHit} ${munition.name} ammo${munition.page ? ` (ASCE p.${munition.page})` : " (ours)"}`, munition.toHit, munition.toHit, munition.toHit, munition.toHit);
        else if (munition.toHit) result.labels.push(`${munition.name} ammo (${munition.toHit}): ${munition.rule} A miss by 2 or less still hits a qualifying target; no change to the card's numbers (ASCE p.${munition.page})`);
        else result.labels.push(`${munition.name} ammo: ${munition.rule}${munition.page ? ` (ASCE p.${munition.page})` : ""}`);
    }
    return result;
}

// ---------------------------------------------------------------------------------------------------------------
// Probes, C3 networks, drones, TAG, jammers and the End Round (Task 4)
// ---------------------------------------------------------------------------------------------------------------

export interface IASEWarStatus {
    lines: string[];
    probe?: { code: "PRB" | "LPRB" | "BH" | "NOVA" | "WAT"; inches: number; overwhelmed: boolean };
    c3?: { network: string; up: boolean; reason?: string };
    droneShutDown?: boolean;
    hj: boolean;
    dj: boolean;
    nc3Up: boolean;
    inFriendlyEcm: boolean;
}

const isJammedBy = (unit: IASEWarUnit, kind: "DJ" | "HJ"): boolean => !!unit.ewarPlay.jammed?.some((jam) => jam.kind === kind && jam.turnsLeft > 0);

/** Whether a chaff cloud covers the unit this turn: its own flag, or a CHF carrier's cloud on the board (ours, levels 6-7). */
export function isASInChaffCloud(unit: IASEWarUnit, board: IASEWarBoard, units: IASEWarUnit[]): boolean {
    if (unit.ewarPlay.chaffCloud) return true;
    return units.some((carrier) => hasASSpecial(carrier, "CHF") && (board.chaffCloud?.[carrier.uuid] ?? []).includes(unit.uuid));
}

/** Sets each unit's `chaffCloud` flag from the board's clouds (only CHF carriers at Custom Homebrew or higher count). */
export function syncASChaffClouds(units: IASEWarUnit[], board: IASEWarBoard): void {
    for (const unit of units) {
        const named = units.some((carrier) => hasASSpecial(carrier, "CHF") && (board.chaffCloud?.[carrier.uuid] ?? []).includes(unit.uuid));
        if (named) unit.ewarPlay.chaffCloud = true;
    }
}

/** Fires one chaff pod (ours, CHF#): spends a pod of the scenario and puts the unit inside its own cloud until End Round. */
export function fireASChaffPod(unit: IASEWarUnit): boolean {
    const chaff = specialsOf(unit).find((entry) => entry.code === "CHF");
    if (!chaff || (unit.ewarPlay.chaffFired ?? 0) >= chaff.count || isASInoperative(unit)) return false;
    unit.ewarPlay.chaffFired = (unit.ewarPlay.chaffFired ?? 0) + 1;
    unit.ewarPlay.chaffCloud = true;
    return true;
}

const C3_MEMBER_CODES: Record<IASC3Network["kind"], ASEWarCode[]> = {
    // Standard and boosted C3 connect into one network (ASCE p.80), so both kinds take either family.
    c3: ["C3M", "C3S", "C3EM", "C3BSM", "C3BSS"], "c3-boosted": ["C3M", "C3S", "C3EM", "C3BSM", "C3BSS"], c3i: ["C3I"], nova: ["NOVA"], naval: ["NC3"],
};
const C3_MASTER_CODES: ASEWarCode[] = ["C3M", "C3BSM"];
const C3_SIZE_CODE: Record<IASC3Network["kind"], ASEWarCode> = { c3: "C3M", "c3-boosted": "C3BSM", c3i: "C3I", nova: "NOVA", naval: "NC3" };

/** Problems with a declared network: too many members, a member without the matching special, a C3 network with no master. */
export function validateASC3Network(network: IASC3Network, units: IASEWarUnit[], edition: string): string[] {
    const problems: string[] = [];
    const size = getASEWarRule(C3_SIZE_CODE[network.kind], edition)?.rule.networkSize;
    // The master counts toward the size even when it is not ticked as a member.
    const count = new Set([...network.members, ...(network.master ? [network.master] : [])]).size;
    // A standard C3 master may connect up to three masters into a company-level network of 12 units (ASCE p.80).
    const masters = new Set([...network.members, ...(network.master ? [network.master] : [])]);
    const masterCount = units.filter((unit) => masters.has(unit.uuid) && specialsOf(unit).some((entry) => C3_MASTER_CODES.includes(entry.code))).length;
    const limit = size !== undefined && network.kind === "c3" && masterCount >= 2 ? 12 : size;
    if (limit !== undefined && count > limit) {
        problems.push(`${network.name}: ${count} units, but ${C3_SIZE_CODE[network.kind]} links ${limit}${limit === 12 ? " in a company-level network" : ""} (${cite(C3_SIZE_CODE[network.kind], edition)})`);
    }
    if ((network.kind === "c3" || network.kind === "c3-boosted") && !network.master) problems.push(`${network.name}: no master named`);
    for (const uuid of network.members) {
        const unit = units.find((each) => each.uuid === uuid);
        if (!unit) { problems.push(`${network.name}: a member is no longer in the force`); continue; }
        if (!specialsOf(unit).some((entry) => C3_MEMBER_CODES[network.kind].includes(entry.code))) {
            problems.push(`${network.name}: a unit without ${C3_MEMBER_CODES[network.kind].join("/")} cannot join this network`);
        }
    }
    if (network.master) {
        const master = units.find((each) => each.uuid === network.master);
        if (!master) problems.push(`${network.name}: the master is no longer in the force`);
        else if (!specialsOf(master).some((entry) => C3_MASTER_CODES.includes(entry.code))) problems.push(`${network.name}: the master needs C3M or C3BSM`);
    }
    return problems;
}

function resolveFor(unit: IASEWarUnit, board: IASEWarBoard, units: IASEWarUnit[], edition: string, cover?: Map<string, { ecm: number; eccm: number }>): IASEcmResolution & { chaff: boolean } {
    const fields = (cover ?? getASFriendlyCover(board, units, edition)).get(unit.uuid);
    const base = resolveASEcm(unit, fields, edition);
    const chaff = isASInChaffCloud(unit, board, units);
    return { ...base, inHostileEcm: base.inHostileEcm || chaff, chaff };
}

/**
 * Whether an emergency master of the network is running (its C3EM turns are left) and works: a wrecked or shut-down
 * carrier, one inside hostile ECM or one under a Homing Jammer duplicates no master (ASCE p.82).
 */
function emergencyRunning(network: IASC3Network, units: IASEWarUnit[], board: IASEWarBoard, edition: string, cover: Map<string, { ecm: number; eccm: number }>): boolean {
    return network.members.some((uuid) => {
        const unit = units.find((each) => each.uuid === uuid);
        return !!unit && (unit.ewarPlay.c3EmergencyTurnsLeft ?? 0) > 0 && !isASInoperative(unit) && !isJammedBy(unit, "HJ") && !resolveFor(unit, board, units, edition, cover).inHostileEcm;
    });
}

/** A master that cannot run its network: missing, wrecked or shut down, inside hostile ECM, or under a Homing Jammer. */
function masterIsDown(master: IASEWarUnit | undefined, board: IASEWarBoard, units: IASEWarUnit[], edition: string, cover: Map<string, { ecm: number; eccm: number }>): boolean {
    return !master || isASInoperative(master) || isJammedBy(master, "HJ") || resolveFor(master, board, units, edition, cover).inHostileEcm;
}

/** The unit's network state: up or down and why, per kind (design Call 1; ASCE pp.80-87). */
function getC3State(unit: IASEWarUnit, board: IASEWarBoard, units: IASEWarUnit[], edition: string, cover: Map<string, { ecm: number; eccm: number }>): IASEWarStatus["c3"] {
    const network = board.c3Networks?.find((each) => each.members.includes(unit.uuid) || each.master === unit.uuid);
    if (!network) return undefined;
    const down = (reason: string) => ({ network: network.name, up: false, reason });
    if (unit.isWrecked()) return down("the unit is wrecked");
    if (isASInoperative(unit)) return down("the unit is shut down");
    if (unit.ewarPlay.c3Burnt) return down("burnt out when its emergency master shut down");
    if (isJammedBy(unit, "HJ")) return down("Homing Jammer");
    const self = resolveFor(unit, board, units, edition, cover);
    // A boosted unit shrugs off ordinary ECM wherever it sits in a mixed network; but a standard member, or a standard master, is still cut off (ASCE p.80).
    const isBoosted = (each: IASEWarUnit): boolean => (hasASSpecial(each, "C3BSM") || hasASSpecial(each, "C3BSS")) && !hasASSpecial(each, "C3M") && !hasASSpecial(each, "C3S") && !hasASSpecial(each, "C3EM");
    const kind: IASC3Network["kind"] = network.kind === "c3" || network.kind === "c3-boosted" ? (isBoosted(unit) ? "c3-boosted" : "c3") : network.kind;
    switch (kind) {
        case "c3": {
            if (self.inHostileEcm) return down("inside hostile ECM");
            if (unit.ewarPlay.c3LineBlocked) return down("line to the master crosses hostile ECM");
            const master = network.master ? units.find((each) => each.uuid === network.master) : undefined;
            if (masterIsDown(master, board, units, edition, cover) && !emergencyRunning(network, units, board, edition, cover)) return down("the master is wrecked or inside hostile ECM");
            return { network: network.name, up: true };
        }
        case "c3i":
            return self.inHostileEcm ? down("inside hostile ECM") : unit.ewarPlay.c3LineBlocked ? down("line crosses hostile ECM") : { network: network.name, up: true };
        case "c3-boosted": {
            if (self.hostileAngel) return down("inside a hostile Angel ECM");
            const master = network.master ? units.find((each) => each.uuid === network.master) : undefined;
            if (!master || isASInoperative(master) || isJammedBy(master, "HJ")) return down("the master is wrecked, shut down or jammed");
            if (isBoosted(master) ? resolveFor(master, board, units, edition, cover).hostileAngel : resolveFor(master, board, units, edition, cover).inHostileEcm) return down("the master is inside hostile ECM it cannot talk through");
            return { network: network.name, up: true };
        }
        case "nova":
            return self.hostileNova ? down("inside a hostile NOVA") : { network: network.name, up: true };
        case "naval":
            return network.enemyJam ? down("jammed by an enemy JAM") : { network: network.name, up: true };
    }
}

/** What the unit's E-War gear does this turn, as lines and flags (probes, networks, drones, TAG, jammers, TSEMP). */
export function getASEWarStatus(unit: IASEWarUnit, board: IASEWarBoard, units: IASEWarUnit[], edition: string): IASEWarStatus {
    const lines: string[] = [];
    const cover = getASFriendlyCover(board, units, edition);
    const res = resolveFor(unit, board, units, edition, cover);
    const specials = specialsOf(unit);
    const has = (code: ASEWarCode) => specials.some((entry) => entry.code === code) && !!getASEWarRule(code, edition);
    const state = unit.ewarPlay;
    const has2 = (code: ASEWarCode) => specials.some((entry) => entry.code === code);
    const hj = isJammedBy(unit, "HJ");
    const dj = isJammedBy(unit, "DJ");
    lines.push(...res.lines);
    if (res.chaff) lines.push("Inside a chaff cloud: counts as hostile ECM that ECCM cannot negate (CHF, ours)");

    let probe: IASEWarStatus["probe"];
    for (const [code, fallback] of [["BH", 26], ["PRB", 18], ["LPRB", 12]] as const) {
        if (!has(code)) continue;
        const inches = getASEWarRule(code, edition)?.rule.inches ?? fallback;
        const overwhelmed = code === "BH" ? res.hostileAngel : res.inHostileEcm;
        lines.push(`${code}: ${inches}" ${overwhelmed ? "overwhelmed by hostile ECM, no reading" : "working"} (${cite(code, edition)})`);
        probe ??= { code, inches, overwhelmed };
    }
    if (has("RSD")) {
        const entry = specials.find((each) => each.code === "RSD")!;
        lines.push(`RSD: ${Math.max(0, entry.count - (state.rsdUsed ?? 0))} remote sensors left to dispense this turn${res.inHostileEcm ? "; inside hostile ECM, they are overwhelmed" : ""} (${cite("RSD", edition)})`);
    }
    if (has("C3RS")) {
        lines.push(`C3RS: ${Math.max(0, 4 - (state.c3rsUsed ?? 0))} of 4 sensors left this scenario${res.inHostileEcm ? "; inside hostile ECM, they are overwhelmed" : ""} (${cite("C3RS", edition)})`);
    }
    if (has("TAG") || has("LTAG")) {
        const code: ASEWarCode = has("TAG") ? "TAG" : "LTAG";
        lines.push(`${code}: ${code === "LTAG" ? "Short" : "Short and Medium"} range, an extra attack; ECM does not affect it${hj ? "; the Homing Jammer stops it" : ""} (${cite(code, edition)})`);
    }

    const c3 = getC3State(unit, board, units, edition, cover);
    if (c3) lines.push(`C3 network ${c3.network}: ${c3.up ? "up" : `down (${c3.reason})`}`);
    const network = c3 ? board.c3Networks?.find((each) => each.name === c3.network) : undefined;
    const nc3Up = !!c3?.up && network?.kind === "naval";

    let droneShutDown: boolean | undefined;
    if (has("DRO")) {
        const controllerUuid = board.droneControl?.[unit.uuid];
        const controller = controllerUuid ? units.find((each) => each.uuid === controllerUuid) : undefined;
        const controllerDown = !controller || isASInoperative(controller) || resolveFor(controller, board, units, edition, cover).inHostileEcm;
        // Shutdown and restart happen in the End Phase (ASCE p.84): the state is latched until then.
        const pending = res.inHostileEcm || controllerDown || !!state.droneLineBlocked;
        droneShutDown = !!state.droneLost || !!state.droneOff;
        const why = !controller ? " (no controller named)" : controllerDown ? " (its controller is wrecked, shut down or inside hostile ECM)" : state.droneLineBlocked ? " (the line from its controller crosses an ECM bubble)" : res.inHostileEcm ? " (inside hostile ECM)" : "";
        const when = state.droneLost ? "; its controller was eliminated, it stays down for the game" : pending && !droneShutDown ? "; it shuts down in the End Phase" : !pending && droneShutDown ? "; it restarts in the End Phase" : "";
        lines.push(`DRO: ${droneShutDown ? "shut down" : "under control"}${why}${when} (${cite("DRO", edition)})`);
    }

    for (const kind of ["DJ", "HJ"] as const) {
        if (!has(kind)) continue;
        const range = getASEWarRule(kind, edition)?.rule.inches ?? 34;
        if (state.jammerSpent) lines.push(`${kind === "DJ" ? "Decoy" : "Homing"} Jammer: spent (${cite(kind, edition)})`);
        else if (state.jammerTurnsLeft) lines.push(`${kind === "DJ" ? "Decoy" : "Homing"} Jammer: running, ${state.jammerTurnsLeft} turns left, ${range}" (${cite(kind, edition)})`);
        else lines.push(`${kind === "DJ" ? "Decoy" : "Homing"} Jammer: ready, 5 turns once on, ${range}", 9+ on 2D6 resists (${cite(kind, edition)})`);
    }
    for (const jam of state.jammed ?? []) {
        if (jam.turnsLeft > 0) lines.push(`Jammed by a ${jam.kind === "DJ" ? "Decoy" : "Homing"} Jammer, ${jam.turnsLeft} turns left (${cite(jam.kind, edition)})`);
    }
    if (has("JAM")) lines.push(`JAM: jams an enemy naval C3 network and ATAC, only inside its Extreme range bracket (${cite("JAM", edition)})`);
    if (has("C3EM")) {
        const left = state.c3EmergencyTurnsLeft ?? 0;
        if (left > 0) lines.push(`C3EM: running, ${left} turns left (${cite("C3EM", edition)})`);
        else if (state.c3Burnt) lines.push(`C3EM: spent, this unit's C3 is burnt out (${cite("C3EM", edition)})`);
    }

    const tsemp = specials.find((entry) => entry.code === "TSEMP");
    if (tsemp && has("TSEMP")) {
        const used = tsemp.oneShot ? state.tsempOneShotUsed ?? 0 : state.tsempUsed ?? 0;
        lines.push(`TSEMP: ${Math.max(0, tsemp.count - used)} attacks left ${tsemp.oneShot ? "this scenario" : "this turn"}; Short and Medium only (${cite("TSEMP", edition)})`);
    }
    if (state.tsempHit && getASEWarRule("TSEMP", edition)) {
        lines.push(state.tsempHit.effect === "shutdown"
            ? `Hit by TSEMP: shut down (${cite("TSEMP", edition)})`
            : `Hit by TSEMP: +1 to its attacks and Control Rolls (${cite("TSEMP", edition)})`);
    }
    if (has2("BSF")) lines.push(state.bsfDead ? "BSF: the field is dead for the scenario (ours)" : `BSF: ${state.bsfOn ? `ON, turn ${state.bsfTurnsOn ?? 0}: standard damage with energy halved, energy hits halved, missiles -1, +1 heat in the End Phase` : "off"} (ours)`);
    for (const code of ["PBR", "PBJ"] as const) {
        if (!has2(code)) continue;
        const boost = state.boost?.[code];
        lines.push(boost?.dead ? `${code}: the booster is dead for the scenario (ours)` : `${code}: ${boost?.streak ?? 0} turns in a row${boost?.usedThisTurn ? ", used this turn" : ""} (ours)`);
    }
    if (state.smokeLaid && (state.smokeTurnsLeft ?? 0) > 0) lines.push(`Smoke ${state.smokeLaid === "screen" ? "screen (heavy, blocks line of sight)" : "trail (light)"} until the End Phase of the next turn (${has2("SMKB") ? "SMKB" : "SMKT"}, ours)`);
    if (has2("PSC")) lines.push("PSC: traces line of sight for spotting and indirect fire as if 1 inch higher; cannot attack from the periscope (ours)");
    const chaff = specials.find((entry) => entry.code === "CHF");
    if (chaff) lines.push(`CHF (ours): ${Math.max(0, chaff.count - (state.chaffFired ?? 0))} chaff pods left this scenario`);

    return { lines, probe, c3, droneShutDown, hj, dj, nc3Up, inFriendlyEcm: res.inFriendlyEcm };
}

/** The TSEMP effect roll (ASCE p.90): no effect on CI, DropShips, VLG or SLG; otherwise the modified roll decides. */
export function getASTsempEffect(targetType: string, targetSpecials: string[], roll: number): "none" | "shutdown" | "interference" {
    const type = targetType.trim().toUpperCase();
    const specials = targetSpecials.map((each) => each.trim().toUpperCase());
    if (["CI", "DS", "DA"].includes(type) || specials.includes("VLG") || specials.includes("SLG")) return "none";
    let modified = roll;
    // -1 against a BattleMech or any aerospace unit; no line for IM (ASCE p.90, #648 M3).
    if (["BM", "AF", "CF", "SC"].includes(type)) modified -= 1;
    if (specials.includes("LG")) modified -= 2;
    if (type === "SV") modified += 2;
    return modified >= 8 ? "shutdown" : "interference";
}

/**
 * The Taser effect roll (MTAS, ASCE p.90; ITAS, ours, the Improved Taser of #647): immune are conventional infantry (an Improved Taser
 * hurts them instead), DropShips, LG, VLG, SLG and ABA units. The roll is -2 against a BattleMech (not for the Improved Taser) and +2
 * against battle armor; 8 or more shuts the target down, otherwise it takes interference.
 */
export function getASTaserEffect(kind: "MTAS" | "ITAS", targetType: string, targetSpecials: string[], roll: number): "none" | "shutdown" | "interference" | "infantry-damage" {
    const type = targetType.trim().toUpperCase();
    const specials = targetSpecials.map((each) => each.trim().toUpperCase());
    if (kind === "ITAS" && (type === "CI" || type === "BA")) return "infantry-damage";
    if (["CI", "DS", "DA"].includes(type) || ["LG", "VLG", "SLG", "ABA"].some((code) => specials.includes(code))) return "none";
    let modified = roll;
    if (type === "BM" && kind === "MTAS") modified -= 2;
    if (type === "BA") modified += 2;
    return modified >= 8 ? "shutdown" : "interference";
}

/**
 * Records a Taser hit: interference or shutdown last this turn and the next (the End Phase of the turn after the hit), the same state a TSEMP
 * hit leaves. An Improved Taser also adds 1 heat to a target that tracks heat (battle armor and infantry take 1 damage instead, no heat).
 */
export function applyASTaserHit(unit: IASEWarUnit, effect: "none" | "shutdown" | "interference" | "infantry-damage", kind: "MTAS" | "ITAS"): void {
    if (effect === "none" || effect === "infantry-damage") return;
    applyASTsempHit(unit, effect);
    if (kind === "ITAS" && !unit.isInfantry && !["BA", "CV", "SV", "CI"].includes(unit.type.trim().toUpperCase())) unit.currentHeat = (unit.currentHeat ?? 0) + 1;
}

/** The Blue Saviour (BSF, ours) is on: the unit carries it, it was switched on and it is not dead. */
export function isASBlueSaviourOn(unit: IASEWarUnit): boolean {
    return !!unit.ewarPlay.bsfOn && !unit.ewarPlay.bsfDead && specialsOf(unit).some((entry) => entry.code === "BSF");
}

/** Switches the field on or off (in the End Phase); a dead field stays off, and switching it off restarts the turn count. */
export function toggleASBlueSaviour(unit: IASEWarUnit, on: boolean): void {
    const state = unit.ewarPlay;
    if (on && !state.bsfDead) { state.bsfOn = true; state.bsfTurnsOn = state.bsfTurnsOn ?? 0; }
    else { state.bsfOn = false; state.bsfTurnsOn = 0; }
}

/** The start-of-turn failure roll from the seventh turn on: below 2 + (turns on - 6) the field fails for the scenario. True = failed. */
export function rollASBlueSaviourFailure(unit: IASEWarUnit, roll: number): boolean {
    const state = unit.ewarPlay;
    const turns = state.bsfTurnsOn ?? 0;
    if (!state.bsfOn || turns < 7) return false;
    if (roll >= 2 + (turns - 6)) return false;
    state.bsfOn = false;
    state.bsfDead = true;
    return true;
}

/** A critical hit while the field is on deals +1 damage and kills the field for the scenario; returns the extra damage. */
export function applyASBlueSaviourCritical(unit: IASEWarUnit): number {
    if (!isASBlueSaviourOn(unit)) return 0;
    unit.ewarPlay.bsfOn = false;
    unit.ewarPlay.bsfDead = true;
    return 1;
}

/**
 * Uses a Power Booster (PBR running, PBJ jump jets; ours) with the Classic failure roll: 2D6 of 5 or less on the first turn in a row,
 * 9 or less on the second, 11 or less on the third, and the fourth always fails. Failure kills the booster; a natural 2 also burns out
 * the system it drives (an MP Hit for PBR, the jump Move for PBJ).
 */
export function triggerASPowerBooster(unit: IASEWarUnit, code: "PBR" | "PBJ", roll: number): { ok: boolean; burnout: boolean; line: string } {
    const boosts = unit.ewarPlay.boost ?? (unit.ewarPlay.boost = {});
    const booster = boosts[code] ?? (boosts[code] = { streak: 0 });
    if (booster.dead) return { ok: false, burnout: false, line: `${code}: the booster is dead for the scenario` };
    const turn = booster.streak + 1;
    const limit = [0, 5, 9, 11][turn] ?? Infinity;
    if (turn >= 4 || roll <= limit) {
        booster.dead = true;
        const burnout = roll === 2;
        return { ok: false, burnout, line: `${code} failed (${roll}, turn ${turn} in a row): dead for the scenario${burnout ? (code === "PBR" ? ", and the unit takes an MP Hit critical" : ", and the unit loses its jump Move") : ""} (ours)` };
    }
    booster.streak = turn;
    booster.usedThisTurn = true;
    return { ok: true, burnout: false, line: code === "PBR" ? `+2" Move this turn, +1 heat (PBR, ours)` : `Jump Move x1.5 (round down to an even inch) this turn, +1 heat (PBJ, ours)` };
}

/**
 * Lays smoke (ours): a Smoker (SMKT) fills a 2-inch lane along its path as it moves; a Buckler dispenser (SMKB) fills a 2-inch area on a
 * unit that did not move, using one of its uses (the number on the card, 10 a dispenser). Either lasts to the End Phase of the next turn.
 */
export function layASSmoke(unit: IASEWarUnit, code: "SMKT" | "SMKB", movedThisTurn: boolean): boolean {
    const state = unit.ewarPlay;
    if (code === "SMKB") {
        const uses = specialsOf(unit).find((entry) => entry.code === "SMKB")?.count ?? 0;
        if (movedThisTurn || (state.smokeUsesSpent ?? 0) >= uses) return false;
        state.smokeUsesSpent = (state.smokeUsesSpent ?? 0) + 1;
        state.smokeLaid = "screen";
    } else {
        if (!hasASSpecial(unit, "SMKT")) return false;
        state.smokeLaid = "trail";
    }
    state.smokeTurnsLeft = 2;
    return true;
}

/** Records a TSEMP hit: it lasts this turn and the next, repeat hits do not stack, a shutdown replaces interference. */
export function applyASTsempHit(unit: IASEWarUnit, effect: "none" | "shutdown" | "interference"): void {
    if (effect === "none") return;
    const current = unit.ewarPlay.tsempHit;
    if (!current) unit.ewarPlay.tsempHit = { effect, turnsLeft: 2 };
    else if (current.effect === "interference" && effect === "shutdown") current.effect = "shutdown";
}

/**
 * A stun hit (a sonic projector's Deter; ours) on a unit: conventional infantry take no damage and roll 2D6
 * against 8; on a failure they must move away from the firer and cannot attack next turn. Battle armor and sealed units are immune.
 */
export function resolveASStun(unit: IASEWarUnit, roll: number): { fellBack: boolean; line: string } {
    const type = unit.type.trim().toUpperCase();
    if (type === "BA" || unit.abilities.some((code) => code.trim().toUpperCase() === "SEAL")) return { fellBack: false, line: "Immune: battle armor and sealed units are not stunned" };
    if (type !== "CI") return { fellBack: false, line: "No effect on this unit" };
    if (roll >= 8) return { fellBack: false, line: `Stun resisted: ${roll} against 8` };
    unit.ewarPlay.fellBack = { turnsLeft: 2 };
    return { fellBack: true, line: `Stunned: ${roll} against 8, so it must move away from the firer and cannot attack next turn` };
}

/** Spends one TSEMP attack (this turn, or the scenario for the one-shot form); false when none is left. */
export function fireASTsemp(unit: IASEWarUnit): boolean {
    const tsemp = specialsOf(unit).find((entry) => entry.code === "TSEMP");
    if (!tsemp) return false;
    const key = tsemp.oneShot ? "tsempOneShotUsed" : "tsempUsed";
    if ((unit.ewarPlay[key] ?? 0) >= tsemp.count) return false;
    unit.ewarPlay[key] = (unit.ewarPlay[key] ?? 0) + 1;
    return true;
}

/**
 * End Round bookkeeping: clears what lasts one turn (stood still, target ticks, RAMS use, TSEMP uses, chaff clouds),
 * counts down jammers and TSEMP effects, and runs the C3 emergency master: it activates (2 turns) when a C3
 * network's master is wrecked or inside hostile ECM, and under ASCE burns out its own unit's C3 when it ends.
 */
export function applyASEWarEndRound(units: IASEWarUnit[], board: IASEWarBoard, edition: string): void {
    const burns = !!getAlphaStrikeEWarRules(edition)?.c3EmergencyBurnsSlave;
    const cover = getASFriendlyCover(board, units, edition);
    // A running emergency master counts down first, so one activated this round keeps its two turns.
    for (const unit of units) {
        const left = unit.ewarPlay.c3EmergencyTurnsLeft;
        if (left && left > 0) {
            unit.ewarPlay.c3EmergencyTurnsLeft = left - 1;
            if (left - 1 === 0) {
                unit.ewarPlay.c3EmergencySpent = true;
                if (burns) unit.ewarPlay.c3Burnt = true;
            }
        }
    }
    for (const network of board.c3Networks ?? []) {
        if (network.kind !== "c3" || !network.master) continue;
        const master = units.find((each) => each.uuid === network.master);
        if (!masterIsDown(master, board, units, edition, cover) || emergencyRunning(network, units, board, edition, cover)) continue;
        const carrier = network.members
            .map((uuid) => units.find((each) => each.uuid === uuid))
            .find((each) => each && each.uuid !== network.master && !isASInoperative(each) && !each.ewarPlay.c3Burnt && !each.ewarPlay.c3EmergencySpent && !each.ewarPlay.c3EmergencyTurnsLeft && hasASSpecial(each, "C3EM"));
        if (carrier) carrier.ewarPlay.c3EmergencyTurnsLeft = 2;
    }
    // Drones shut down or restart in the End Phase; a destroyed controller ends them for the game (ASCE p.84).
    for (const unit of units) {
        if (!hasASSpecial(unit, "DRO") || unit.ewarPlay.droneLost) continue;
        const controllerUuid = board.droneControl?.[unit.uuid];
        const controller = controllerUuid ? units.find((each) => each.uuid === controllerUuid) : undefined;
        if (controller?.isWrecked()) { unit.ewarPlay.droneLost = true; continue; }
        const controllerDown = !controller || isASInoperative(controller) || resolveFor(controller, board, units, edition, cover).inHostileEcm;
        const off = resolveFor(unit, board, units, edition, cover).inHostileEcm || controllerDown || !!unit.ewarPlay.droneLineBlocked;
        if (off) unit.ewarPlay.droneOff = true; else delete unit.ewarPlay.droneOff;
    }
    for (const unit of units) {
        const state = unit.ewarPlay;
        delete state.stoodStill;
        delete state.target;
        delete state.ramsUse;
        delete state.tsempUsed;
        delete state.rsdUsed;
        // A viral jammer ends when its unit is destroyed or shut down (ASCE p.89).
        if (state.jammerTurnsLeft && state.jammerTurnsLeft > 0 && isASInoperative(unit)) {
            delete state.jammerTurnsLeft;
            state.jammerSpent = true;
        }
        delete state.chaffCloud;
        // Blue Saviour: +1 heat in each End Phase it is on (BSF, ours); a booster used this turn costs 1 heat; smoke counts down.
        if (isASBlueSaviourOn(unit)) {
            state.bsfTurnsOn = (state.bsfTurnsOn ?? 0) + 1;
            unit.currentHeat = (unit.currentHeat ?? 0) + 1;
        }
        for (const code of ["PBR", "PBJ"] as const) {
            const booster = state.boost?.[code];
            if (!booster) continue;
            if (booster.usedThisTurn) unit.currentHeat = (unit.currentHeat ?? 0) + 1;
            else booster.streak = 0;
            delete booster.usedThisTurn;
        }
        if (state.smokeTurnsLeft) {
            state.smokeTurnsLeft -= 1;
            if (state.smokeTurnsLeft <= 0) { delete state.smokeTurnsLeft; delete state.smokeLaid; }
        }
        if (state.jammed) {
            state.jammed = state.jammed.map((jam) => ({ ...jam, turnsLeft: jam.turnsLeft - 1 })).filter((jam) => jam.turnsLeft > 0);
            if (state.jammed.length === 0) delete state.jammed;
        }
        if (state.jammerTurnsLeft && state.jammerTurnsLeft > 0) {
            state.jammerTurnsLeft -= 1;
            if (state.jammerTurnsLeft === 0) {
                delete state.jammerTurnsLeft;
                state.jammerSpent = true;
            }
        }
    }
    // A jam lasts only while its jammer runs: a jammer that was destroyed, shut down or has run out ends the jams it set (#648 M10).
    for (const unit of units) {
        const state = unit.ewarPlay;
        if (!state.jammed) continue;
        state.jammed = state.jammed.filter((jam) => {
            if (!jam.from) return true;
            const source = units.find((each) => each.uuid === jam.from);
            return !!source && (source.ewarPlay.jammerTurnsLeft ?? 0) > 0;
        });
        if (state.jammed.length === 0) delete state.jammed;
    }
    for (const unit of units) {
        const state = unit.ewarPlay;
        if (state.fellBack) {
            state.fellBack.turnsLeft -= 1;
            if (state.fellBack.turnsLeft <= 0) delete state.fellBack;
        }
        if (state.tsempHit) {
            state.tsempHit.turnsLeft -= 1;
            if (state.tsempHit.turnsLeft <= 0) delete state.tsempHit;
        }
    }
    delete board.chaffCloud;
}
