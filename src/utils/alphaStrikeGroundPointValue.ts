/**
 * Alpha Strike Point Value for ground units: Alpha Strike Companion pp.138-141 as corrected by errata v1.6.
 *
 * Shared by the BattleMech conversion and the Alpha Strike unit creator, so a card built either way is priced the same.
 */

export interface IGroundPVDamage {
    damage: number;
    /** 0* (minimal damage): counts as 0.5 in the Point Value. */
    minimal: boolean;
}

export interface IGroundPVInput {
    /** Alpha Strike unit type: BM, IM, PM, CV, SV, BA, CI ...; MM is our Micro-Mech, WK and IWK our walkers. */
    type: string;
    size: number;
    /** Non-jumping Move rates in inches, with their mode letter ("" for a 'Mech's walk; t, w, h, n, v, g, f ...). */
    moves: { inches: number; mode: string }[];
    /** Jump Move in inches (0 when the unit cannot jump). */
    jump: number;
    short: IGroundPVDamage;
    medium: IGroundPVDamage;
    long: IGroundPVDamage;
    overheat: number;
    armor: number;
    structure: number;
    /** Special ability codes as they print on the card, e.g. "IF1", "HT1/1/-", "ECM", "JMPS2", "ARTLT-1". */
    specials: string[];
}

export interface IGroundPVResult {
    pointValue: number;
    offensive: number;
    defensive: number;
    log: string[];
}

/** Target Movement Modifier for a Move in inches (Alpha Strike p.30). */
export function groundTMM(inches: number): number {
    if (inches >= 35) return 5;
    if (inches >= 19) return 4;
    if (inches >= 13) return 3;
    if (inches >= 9) return 2;
    if (inches >= 5) return 1;
    return 0;
}

const roundToHalf = (value: number): number => 0.5 * Math.round(value * 2 + 1e-9);

/** Artillery damage (errata v1.6, p.111 table) and blast radius by ARTX code. */
const ARTILLERY: Record<string, { inner: number; innerMinimal?: boolean; outer: number; radius: number }> = {
    AIS: { inner: 2, outer: 0, radius: 2 },
    AC: { inner: 2, outer: 0, radius: 2 },
    T: { inner: 1, outer: 0, radius: 2 },
    S: { inner: 2, outer: 0, radius: 2 },
    LT: { inner: 3, outer: 1, radius: 6 },
    CM5: { inner: 5, outer: 0, radius: 2 },
    CM7: { inner: 7, outer: 2, radius: 6 },
    CM9: { inner: 9, outer: 4, radius: 6 },
    CM12: { inner: 12, outer: 5, radius: 6 },
    BA: { inner: 1, outer: 0, radius: 2 },
    TC: { inner: 0, innerMinimal: true, outer: 0, radius: 2 },
    SC: { inner: 1, outer: 0, radius: 2 },
    LTC: { inner: 2, outer: 0, radius: 2 },
};

/** One artillery weapon's Offensive Factor (errata v1.6: damage x 6; slashed damage adds 3 per outer point and per 2" of radius over 2"). */
function artilleryFactor(code: string): number {
    const art = ARTILLERY[code];
    if (!art) return 0;
    const inner = art.innerMinimal ? 0.5 : art.inner;
    if (art.outer <= 0) return inner * 6;
    return inner * 6 + art.outer * 3 + 3 * Math.floor((art.radius - 2) / 2);
}

/** Reads one value of a "#/#/#" rating: "-" is 0, "0*" is 0.5. */
function ratingValue(text: string | undefined): number {
    if (!text) return 0;
    const value = text.trim();
    if (value === "0*") return 0.5;
    const number = parseFloat(value);
    return Number.isFinite(number) ? number : 0;
}

export function calculateGroundPointValue(input: IGroundPVInput): IGroundPVResult {
    const log: string[] = [];
    const given = input.type.trim().toUpperCase();
    // A walker (Custom Homebrew, ours): WK is priced on the BattleMech lines, IWK on the IndustrialMech's.
    const type = given === "WK" ? "BM" : given === "IWK" ? "IM" : given;
    // The Master Unit List prints a space before the rating ("IF 1", "ARTAIS -1"); the card prints none.
    const specials = input.specials.map((code) => code.replace(/\s+/g, "").toUpperCase()).filter((code) => code !== "");
    const has = (code: string) => specials.includes(code);
    const find = (pattern: RegExp) => specials.find((code) => pattern.test(code));
    const ratingOf = (prefix: string): number => {
        const code = find(new RegExp(`^${prefix}\\d`));
        return code ? ratingValue(code.slice(prefix.length)) : 0;
    };

    const points = (value: IGroundPVDamage) => (value.minimal ? 0.5 : value.damage);
    const short = points(input.short);
    const medium = points(input.medium);
    const long = points(input.long);
    const armed = short + medium + long > 0;
    const shortOnly = short > 0 && medium === 0 && long === 0;
    const isInfantry = type === "BA" || type === "CI";
    const groundMoves = input.moves.filter((move) => move.inches > 0);
    const bestGround = groundMoves.reduce((best, move) => Math.max(best, move.inches), 0);
    const highestMove = Math.max(bestGround, input.jump);
    const bestGroundMode = (groundMoves.find((move) => move.inches === bestGround)?.mode ?? "").toLowerCase();
    const artillery = specials.filter((code) => /^ART[A-Z0-9]+-\d+$/.test(code));

    /* Step 1: Offensive Value */
    let offensive = short + medium * 2 + long;
    const offensiveParts: string[] = [`${short} + 2 x ${medium} + ${long}`];
    const addOffensive = (label: string, amount: number): void => {
        if (amount > 0) { offensive += amount; offensiveParts.push(`${amount} (${label})`); }
    };
    // A Micro-Mech ("MM", Custom Homebrew, ours) is priced on the BattleMech lines.
    if (type === "BM" || type === "IM" || type === "PM" || type === "MM") addOffensive("half its Size", input.size / 2);
    let overheat = input.overheat > 1 ? 1 + (input.overheat - 1) / 2 : input.overheat;
    if (shortOnly) overheat /= 2;
    addOffensive("Overheat", overheat);

    for (const code of artillery) {
        const [, artCode, count] = /^ART([A-Z0-9]+)-(\d+)$/.exec(code) ?? [];
        addOffensive(code, artilleryFactor(artCode) * +count);
    }
    const heat = find(/^HT/);
    if (heat) {
        const ratings = heat.slice(2).split("/");
        addOffensive("HT", Math.max(...ratings.map(ratingValue)) + (ratingValue(ratings[1]) > 0 ? 0.5 : 0));
    }
    // Torpedoes price like a second attack (MUL cards for UMU units: TOR S + 2M + L).
    const torpedo = find(/^TOR\d/);
    if (torpedo) {
        const [torShort, torMedium, torLong] = torpedo.slice(3).split("/").map(ratingValue);
        addOffensive("TOR", torShort + 2 * torMedium + torLong);
    }
    const indirect = find(/^IF\d/);
    if (indirect) addOffensive("IF", ratingValue(indirect.slice(2)));
    const iatm = find(/^IATM/);
    if (iatm) addOffensive("IATM", ratingValue(iatm.slice(4).split("/")[2]));
    addOffensive("SNARC", has("SNARC") ? 1 : ratingOf("SNARC"));
    addOffensive("INARC", has("INARC") ? 1 : ratingOf("INARC"));
    addOffensive("CNARC", has("CNARC") ? 0.5 : ratingOf("CNARC") * 0.5);
    addOffensive("TAG", has("TAG") ? 0.5 : 0);
    addOffensive("LTAG", has("LTAG") ? 0.25 : 0);
    addOffensive("MEL", has("MEL") ? 0.5 : 0);
    addOffensive("TSM", has("TSM") ? 1 : 0);
    addOffensive("ECS", has("ECS") ? 0.25 : 0);
    addOffensive("MTAS", ratingOf("MTAS"));
    addOffensive("BTAS", ratingOf("BTAS") * 0.25);
    addOffensive("MDS", ratingOf("MDS"));
    // The 'Mech conversion prints the long-range overheat with its value ("OVL 2").
    const overheatLong = specials.some((code) => /^OVL\d*$/.test(code));
    addOffensive("OVL", overheatLong ? input.overheat * 0.25 : 0);
    if (has("RHS")) addOffensive("RHS", overheatLong ? 1 : input.overheat >= 1 ? 0.5 : 0.25);
    if (has("BT")) addOffensive("BT", input.size * highestMove * 0.5);
    addOffensive("TSEMP", ratingOf("TSEMP") * 5);
    addOffensive("TSEMP-O", Math.min(5, ratingOf("TSEMP-O")));

    // Step 1a: blanket multipliers (errata v1.6 removes C3 and DRO, and the round-up).
    let multiplier = 1;
    if (has("VRT")) multiplier += 0.1;
    if (has("BFC")) multiplier -= 0.1;
    if (has("SHLD")) multiplier -= 0.1;
    if ((type === "IM" || type === "SV") && !has("AFC") && !has("BFC")) multiplier -= 0.2;
    offensive *= multiplier;
    // The printed round-up to the half point (deleted by errata v1.6) still holds on the Master Unit List's cards
    // for IndustrialMechs and support vehicles; a combat unit's multiplied value is left unrounded.
    if (multiplier !== 1 && (type === "IM" || type === "SV")) offensive = Math.ceil(offensive * 2 - 1e-9) / 2;
    log.push(`Offensive Value: (${offensiveParts.join(" + ")})${multiplier !== 1 ? ` x ${multiplier.toFixed(1)}` : ""} = ${offensive}`);

    /* Step 2: Defensive Value */
    const jumps = input.jump > 0;
    let defensive = highestMove / 8 + (jumps ? 0.5 : 0);
    const defensiveParts: string[] = [`${highestMove} / 8${jumps ? " + 0.5 (jump)" : ""}`];
    const addDefensive = (label: string, amount: number): void => {
        if (amount > 0) { defensive += amount; defensiveParts.push(`${amount} (${label})`); }
    };
    const barrier = specials.some((code) => /^BAR\d*$/.test(code));
    const perThreeArmor = (factor: number) => factor * Math.floor(input.armor / 3) / (barrier ? 2 : 1);
    addDefensive("ABA", has("ABA") ? 0.5 : 0);
    addDefensive("AMS", has("AMS") ? 1 : 0);
    addDefensive("ARM", has("ARM") && input.structure > 1 ? 0.5 : 0);
    addDefensive("BHJ2", has("BHJ2") ? perThreeArmor(1) : 0);
    addDefensive("BHJ3", has("BHJ3") ? perThreeArmor(1.5) : 0);
    addDefensive("BRA", has("BRA") ? perThreeArmor(0.75) : 0);
    addDefensive("CR", has("CR") && input.structure >= 3 ? 0.25 : 0);
    addDefensive("FR", has("FR") ? 0.5 : 0);
    addDefensive("IRA", has("IRA") ? perThreeArmor(0.5) : 0);
    addDefensive("RAMS", has("RAMS") ? 1.25 : 0);
    addDefensive("RCA", has("RCA") ? perThreeArmor(1) : 0);
    addDefensive("SHLD", has("SHLD") ? perThreeArmor(1) : 0);

    // Step 2a: Defensive Interaction Rating.
    const vehicle = type === "CV" || type === "SV";
    let armorMultiplier = 2;
    if (vehicle) {
        armorMultiplier = ["t", "n", "s"].includes(bestGroundMode) ? 1.8 : ["w", "h"].includes(bestGroundMode) ? 1.7 : 1.5;
        if (has("ARS")) armorMultiplier += 0.1;
    }
    if (barrier) armorMultiplier *= 0.5;
    const structureMultiplier = type === "IM" || barrier ? 0.5 : isInfantry ? 2 : 1;
    // Movement Modifier: the best non-jumping Move; a jump-only unit uses its jump.
    let movementModifier = groundTMM(bestGround > 0 ? bestGround : input.jump);
    const mimetic = has("MAS") ? 3 : has("LMAS") ? 2 : 0;
    if (mimetic > movementModifier) movementModifier = mimetic;
    let modifier = movementModifier;
    const noDamage = !armed && !find(/^TSEMP\d/) && artillery.length === 0;
    if (jumps && (isInfantry || noDamage)) modifier += 1;
    if (type === "BA" || type === "PM") modifier += 1;
    if (vehicle && ["v", "g"].includes(bestGroundMode)) modifier += 1;
    if (has("LG") || has("VLG") || has("SLG")) modifier -= 1;
    if (has("STL")) modifier += 1;
    modifier += ratingOf("JMPS") / 2 + ratingOf("SUBS") / 2;
    const defenseFactor = 1 + (modifier > 2 ? 0.25 : 0.1) * modifier;
    const dir = roundToHalf((input.armor * armorMultiplier + input.structure * structureMultiplier) * defenseFactor);
    defensive += dir;
    defensiveParts.push(`DIR (${input.armor} x ${armorMultiplier} + ${input.structure} x ${structureMultiplier}) x ${defenseFactor.toFixed(2)} = ${dir}`);
    log.push(`Defensive Value: ${defensiveParts.join(" + ")} = ${defensive}`);

    /* Step 3: Final Point Value */
    const subTotal = offensive + defensive;
    const tmm = groundTMM(bestGround > 0 ? bestGround : input.jump);
    const agileTMM = tmm + ratingOf("JMPS") / 2 + ratingOf("SUBS") / 2;
    let agile = 0;
    if (agileTMM > 1 && medium > 0) agile = (agileTMM - 1) * medium;
    else if (medium === 0 && tmm >= 3) agile = (agileTMM - 2) * short;
    agile = roundToHalf(Math.max(0, agile));
    const c3 = specials.some((code) => /^C3(?!RS)/.test(code));
    const c3Cost = c3 || has("NOVA") ? roundToHalf(subTotal * 0.05) : 0;
    let brawler = 0;
    const ecm = has("ECM") || has("AECM") || has("WAT");
    // No Brawler for a unit an infantry transport can carry (CAR 8 or less) or one with MEC: MegaMek, citing
    // errata v1.4, and the Master Unit List cards agree (see battle-armor.ts and infantry-platoon.ts).
    const carried = has("MEC") || (ratingOf("CAR") > 0 && ratingOf("CAR") <= 8);
    if (!carried && armed && highestMove >= 2 && artillery.length === 0 && !has("BT") && !c3 && !ecm && !has("NOVA")) {
        if (highestMove >= 6 && highestMove <= 10 && shortOnly) brawler = subTotal * 0.25;
        else if (highestMove <= 5 && shortOnly) brawler = subTotal * 0.5;
        else if (highestMove <= 5 && long === 0) brawler = subTotal * 0.25;
    }
    brawler = roundToHalf(brawler);

    // Step 3a: force bonuses.
    let force = 0;
    if (has("AECM")) force += 3;
    if (has("BH")) force += 2;
    if (has("C3RS")) force += 2;
    if (has("ECM") || has("WAT")) force += 2;
    if (has("LECM")) force += 0.5;
    const mhq = ratingOf("MHQ");
    if (mhq > 0) force += mhq <= 4 ? mhq : 4 + Math.ceil(mhq / 5);
    if (has("PRB")) force += 1;
    if (has("LPRB")) force += 1;
    if (has("RCN")) force += 2;
    if (has("TRN")) force += 2;

    const final = subTotal + agile + c3Cost - brawler + force;
    const pointValue = Math.max(1, Math.round(final + 1e-9));
    const steps = [
        agile > 0 ? `+ ${agile} (Agile)` : "",
        c3Cost > 0 ? `+ ${c3Cost} (C3)` : "",
        brawler > 0 ? `- ${brawler} (Brawler)` : "",
        force > 0 ? `+ ${force} (force bonuses)` : "",
    ].filter((step) => step !== "");
    log.push(`Point Value: ${subTotal}${steps.length ? " " + steps.join(" ") : ""} = ${final}, rounded to ${pointValue}`);

    return { pointValue, offensive, defensive, log };
}

/** Parses a Master Unit List BFMove string ('8"', '10"/6"j', '12"t', '6"j') into Move rates and jump. */
export function parseGroundMove(text: string): { moves: { inches: number; mode: string }[]; jump: number } {
    const moves: { inches: number; mode: string }[] = [];
    let jump = 0;
    for (const part of (text ?? "").split("/")) {
        // A bike or a microlite prints its subtype after the mode: '24"w(b)'.
        const match = /^\s*(\d+)"?\s*([a-z]*)\s*(?:\([a-z]+\))?\s*$/i.exec(part);
        if (!match) continue;
        const inches = +match[1];
        const mode = match[2].toLowerCase();
        if (mode === "j") jump = inches;
        else moves.push({ inches, mode });
    }
    // A card prints only the jump when it equals the ground Move ('12"j').
    if (moves.length === 0 && jump > 0) moves.push({ inches: jump, mode: "" });
    return { moves, jump };
}

/** Splits a card's special abilities on commas outside parentheses, so "TUR (4/3/2,IF1)" stays one code. */
export function splitSpecialAbilities(text: string | string[] | null | undefined): string[] {
    if (Array.isArray(text)) return text.flatMap((item) => splitSpecialAbilities(item));
    const codes: string[] = [];
    let depth = 0;
    let current = "";
    for (const char of text ?? "") {
        if (char === "(") depth++;
        if (char === ")") depth = Math.max(0, depth - 1);
        if (char === "," && depth === 0) {
            if (current.trim()) codes.push(current.trim());
            current = "";
        } else current += char;
    }
    if (current.trim()) codes.push(current.trim());
    return codes;
}
