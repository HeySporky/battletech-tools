import type { IEquipmentItem } from "./data-interfaces";

/*
 * DISCLAIMER: This file processes gameplay data derived from the BattleTech universe.
 * All official lore, trademarks, and intellectual property belong strictly to
 * Catalyst Game Labs, Topps, and/or their respective corporate rights holders.
 * Any original, fan-made content or custom homebrew data processed by this tool
 * remains the exclusive property of its respective community creators, which,
 * where known, has been appropriately attributed.
 *
 * This open-source utility is a non-commercial fan project designed purely for
 * tabletop gameplay assistance. Content processed by this file is not intended
 * to challenge any copyright or trademark status, and this data is explicitly
 * excluded from the software's underlying license (GNU GPLv3).
 */

/**
 * The Alpha Strike Alternate Munitions (ASCE pp.142-150, table p.146) and our own rounds (#647).
 * `alphaStrike.munition` on an ammunition record names the row its round plays as.
 */
export type ASMunitionKey =
    | "ac-armor-piercing" | "ac-flak" | "ac-flechette" | "ac-precision" | "ac-tracer"
    | "msl-heat-seeking" | "msl-inferno" | "msl-magnetic-pulse" | "msl-mine-clearance" | "msl-semi-guided" | "msl-smoke"
    | "msl-swarm" | "msl-tandem-charge" | "msl-thunder"
    | "art-cluster" | "art-copperhead" | "art-flechette" | "art-illumination" | "art-smoke"
    | "boosted" | "emp" | "vhe" | "gauss-inferno";

export interface IASMunition {
    key: ASMunitionKey;
    name: string;
    /** The attack modifier of the ASCE table; null where the table says "See rules". */
    toHit: number | null;
    /** One of these specials (by base code) must be on the unit. */
    requires: string[];
    rule: string;
    page: number;
    /** Ours: shown only at Custom Homebrew and Munchkin (levels 6-7). */
    custom?: boolean;
}

const AC = ["AC"];
const MSL = ["LRM", "SRM"];
const ART = ["ART-T", "ART-S", "ART-LT", "ART-AIS", "ART-AC", "HAIL"];

export const AS_MUNITIONS: readonly IASMunition[] = [
    { key: "ac-armor-piercing", name: "Armor-Piercing", toHit: 1, requires: AC, page: 145,
        rule: "+1 to hit. A hit reduces the AC damage by 1 (minimum 1); then 2D6, and on 10+ roll once on the target's critical table even with armor left. Treated as standard fire against aerospace and infantry (including battle armor)." },
    { key: "ac-flak", name: "Flak", toHit: -2, requires: AC, page: 145,
        rule: "Only against airborne units and units that used VTOL, WiGE or thrust movement this turn: the AC attack uses the FLK rules at the AC damage, so a miss by 2 or less still hits." },
    { key: "ac-flechette", name: "Flechette", toHit: 0, requires: AC, page: 145,
        rule: "Against conventional infantry or woods/jungle adds the AC damage; against all else the AC damage is halved (round down) and subtracted from the attack. An AC-only attack deals twice the AC damage to infantry and woods, half to the rest." },
    { key: "ac-precision", name: "Precision", toHit: -2, requires: AC, page: 145,
        rule: "Against a target with TMM 2+, a miss by 2 or less still hits for the AC damage." },
    { key: "ac-tracer", name: "Tracer", toHit: 0, requires: AC, page: 145,
        rule: "Removes the dusk and dawn target number modifiers and reduces other darkness modifiers by 1." },
    { key: "msl-heat-seeking", name: "Heat-Seeker", toHit: -2, requires: MSL, page: 149,
        rule: "Against a target at heat 1 or higher, a miss by 2 or less still hits for the LRM or SRM damage. No effect on a target that is not overheating or has no heat scale." },
    { key: "msl-inferno", name: "Inferno", toHit: 0, requires: ["SRM"], page: 149,
        rule: "Converts up to the SRM damage to HT damage, at most 2 heat on a target that tracks heat; standard damage against others." },
    { key: "msl-magnetic-pulse", name: "Magnetic Pulse", toHit: 0, requires: MSL, page: 149,
        rule: "A hit on a target other than conventional infantry gives it +1 to all its weapon attacks for the next turn. No physical damage." },
    { key: "msl-mine-clearance", name: "Mine Clearance", toHit: 0, requires: MSL, page: 149,
        rule: "Aimed at a point; reduces the density of minefields in a 2-inch area by the LRM or SRM damage." },
    { key: "msl-semi-guided", name: "Semi-Guided", toHit: -2, requires: ["LRM"], page: 150,
        rule: "Against a target designated by a friendly TAG this turn, a miss by 2 or less still hits. May be used with indirect fire." },
    { key: "msl-smoke", name: "Smoke", toHit: 0, requires: MSL, page: 150,
        rule: "Aimed at a point; fills a 2-inch area with smoke (light below 3 damage, heavy at 3 or more). No damage." },
    { key: "msl-swarm", name: "Swarm / Swarm-I", toHit: 0, requires: ["LRM"], page: 150,
        rule: "A miss that leaves units within 2 inches of the target makes a new attack at a random one of them for the LRM damage (Swarm-I skips friends)." },
    { key: "msl-tandem-charge", name: "Tandem Charge", toHit: 0, requires: ["SRM"], page: 150,
        rule: "A hit on a 'Mech, ProtoMech or vehicle also rolls 2D6; on 10+ roll once on its critical table. Conventional infantry take 1 less damage." },
    { key: "msl-thunder", name: "Thunder", toHit: 0, requires: ["LRM"], page: 150,
        rule: "Aimed at a point; lays a minefield of density equal to the LRM damage (1 to 5) in a 2-inch area. No damage." },
    { key: "art-cluster", name: "Cluster (artillery)", toHit: null, requires: ART, page: 146,
        rule: "A larger area of effect than standard artillery rounds (artillery rules)." },
    { key: "art-copperhead", name: "Copperhead (artillery)", toHit: 0, requires: ART, page: 146,
        rule: "A homing round; see the artillery rules for a spotted target." },
    { key: "art-flechette", name: "Flechette (artillery)", toHit: 0, requires: ART, page: 146,
        rule: "Anti-personnel rounds; see the artillery rules." },
    { key: "art-illumination", name: "Illumination (artillery)", toHit: 0, requires: ART, page: 146,
        rule: "Lights the area; no damage." },
    { key: "art-smoke", name: "Smoke (artillery)", toHit: 0, requires: ART, page: 146,
        rule: "Fills the area with smoke; no damage." },
    { key: "boosted", name: "Boosted AC ammunition", toHit: 0, requires: AC, page: 0, custom: true,
        rule: "Ours (NGCFells, 2026-11-22, #647; Pleiades): the AC special's attack may reach one bracket further, at the last bracket's AC damage, +1 heat." },
    { key: "emp", name: "EMP missiles", toHit: 0, requires: MSL, page: 0, custom: true,
        rule: "Ours (NGCFells, 2026-11-22, #647; VoiceOfAN): standard damage; on a hit roll 2D6, and on 10+ a target that is not conventional infantry shuts down for the next turn." },
    { key: "vhe", name: "VHE Gauss shell", toHit: 0, requires: [], page: 0, custom: true,
        rule: "Ours (NGCFells, 2026-11-22, #647; Congdon): +1 damage per Gauss Rifle firing it, on a hit at Short or Medium range." },
    { key: "gauss-inferno", name: "Inferno Gauss shell", toHit: 0, requires: [], page: 0, custom: true,
        rule: "Ours (NGCFells, 2026-11-22, #647; Liao): +1 heat to a target that tracks heat, this turn and the next." },
];

const baseCode = (code: string): string => code.trim().replace(/[\d#/*\s-]+$/, "").replace(/^(ART-[A-Z]+).*$/, "$1").toUpperCase();

/** The row for a munition key; undefined for our own rows below Custom Homebrew (level 6). */
export function getASMunition(key: string | undefined, rulesLevel: number): IASMunition | undefined {
    const found = AS_MUNITIONS.find((munition) => munition.key === key);
    if (!found || (found.custom && rulesLevel < 6)) return undefined;
    return found;
}

/** Whether the unit has one of the specials the munition needs (by base code; HAIL counts as artillery). */
export function canUseASMunition(munition: IASMunition, unitSpecials: string[]): boolean {
    const bases = unitSpecials.map(baseCode);
    if (munition.requires.length === 0) return true;
    return munition.requires.some((required) => bases.some((code) => code === required || (required.startsWith("ART-") && code.startsWith("ART"))));
}

/** The card line for the selected munition: its rule, and what it needs when the unit lacks the special. */
export function describeASMunition(munition: IASMunition, unitSpecials: string[]): string {
    const needs = canUseASMunition(munition, unitSpecials) ? "" : ` (needs ${munition.requires.filter((code) => !code.startsWith("ART-") || munition.key.startsWith("art-")).slice(0, 3).join(" or ")})`;
    return `${munition.name}${munition.toHit ? ` ${munition.toHit > 0 ? "+" : ""}${munition.toHit}` : ""}${needs}: ${munition.rule}${munition.page ? ` (ASCE p.${munition.page})` : ""}`;
}

type Assignment = { munition: ASMunitionKey } | { noConversion: NonNullable<IEquipmentItem["alphaStrike"]["noConversion"]> };

const AC_SUFFIX: Record<string, ASMunitionKey> = {
    "armor-piercing": "ac-armor-piercing", "flak": "ac-flak", "flechette": "ac-flechette", "precision": "ac-precision", "tracer": "ac-tracer",
};
const MSL_SUFFIX: Record<string, ASMunitionKey> = {
    "heat-seeking": "msl-heat-seeking", "inferno": "msl-inferno", "magnetic-pulse": "msl-magnetic-pulse", "mine-clearance": "msl-mine-clearance",
    "semi-guided": "msl-semi-guided", "smoke": "msl-smoke", "swarm": "msl-swarm", "swarm-i": "msl-swarm", "tandem-charge": "msl-tandem-charge", "thunder": "msl-thunder",
};
const ART_SUFFIX: Record<string, ASMunitionKey> = {
    "cluster": "art-cluster", "copperhead": "art-copperhead", "flechette": "art-flechette", "illumination": "art-illumination", "smoke": "art-smoke",
};

/** The munition (or the stated reason) an ammunition tag plays as; undefined when it is no special round or not ours to settle. */
export function assignASMunition(tag: string): Assignment | undefined {
    let match: RegExpMatchArray | null;
    if (tag === "ammo-custom-ac-12-caseless" || /^ammo-(is|clan)-rotary-ac-\d+-caseless$/.test(tag)) return { noConversion: "no-alpha-strike-munition" };
    if ((match = tag.match(/^ammo-(?:is-|clan-)?(?:protomech-|light-)?(?:custom-)?ac-\d+-(armor-piercing|flak|flechette|precision|tracer)$/))) return { munition: AC_SUFFIX[match[1]] };
    if (/^ammo-(?:ac-\d+|custom-ac-12)-boosted$/.test(tag)) return { munition: "boosted" };
    if (/^ammo-ac-\d+-sabot$/.test(tag)) return { munition: "ac-armor-piercing" };
    if (/-emp$/.test(tag)) return { munition: "emp" };
    if (tag === "ammo-is-gauss-rifle-vhe") return { munition: "vhe" };
    if (tag === "ammo-is-gauss-rifle-inferno") return { munition: "gauss-inferno" };
    if (/^ammo-is-thunderbolt-\d+-narc-capable$/.test(tag)) return { noConversion: "no-alpha-strike-munition" };
    if ((match = tag.match(/^ammo-is-thunderbolt-\d+-(heat-seeking|semi-guided|thunder)$/))) return { munition: MSL_SUFFIX[match[1]] };
    if ((match = tag.match(/^ammo-(?:is-|clan-)?(?:enhanced-|extended-)?(?:lrm|srm|lrt|srt)-(heat-seeking|inferno|magnetic-pulse|mine-clearance|semi-guided|smoke|swarm|swarm-i|tandem-charge|thunder)$/))) return { munition: MSL_SUFFIX[match[1]] };
    if ((match = tag.match(/^ammo-(?:hailstorm|long-tom|sniper|thumper)-(cluster|copperhead|flechette|illumination|smoke)$/))) return { munition: ART_SUFFIX[match[1]] };
    if (/^ammo-hailstorm-(thunder|fae)$/.test(tag)) return { noConversion: "no-alpha-strike-munition" };
    if (/^ammo-(?:heavy-|light-)?machine-gun-(ap|incendiary|tracer)$/.test(tag) || tag === "ammo-is-vehicle-flamer-acid") return { noConversion: "no-alpha-strike-munition" };
    if (tag === "ammo-lb-15x-cluster") return { noConversion: "carried-by-weapon" };
    if (tag === "ammo-custom-smoker-fuel" || tag === "ammo-custom-nuclear-pulse-cannon-standard") return { noConversion: "feeds-special" };
    return undefined;
}

const OURS = "Ours (NGCFells, 2026-11-22, #647): ";
const BANNED = /^Unverified custom equipment$|^Unresolved|not yet looked up|no Alpha Strike (conversion|effect)|^Apocryphal: no Alpha Strike/i;

/**
 * Fills the `alphaStrike.munition` or `noConversion` of every ammunition record whose tag the table above settles (#647), and gives every
 * other custom or Munchkin standard round "standard-ammunition". Notes say which ASCE row the round plays as, or that it is ours.
 */
export function applyAlphaStrikeMunitions(items: IEquipmentItem[]): IEquipmentItem[] {
    for (const item of items) {
        if (!item.isAmmo || !item.alphaStrike) continue;
        const strike = item.alphaStrike;
        if (strike.munition || strike.noConversion) continue;
        const standardRound = ((item.rulesLevel ?? 0) >= 5 || strike.notes?.some((note) => /not yet looked up/i.test(note))) && /-standard$/.test(item.tag) && !strike.rangeShort && !strike.rangeMedium && !strike.rangeLong && !strike.specialAbility?.length;
        const assignment: Assignment | undefined = assignASMunition(item.tag) ?? (standardRound ? { noConversion: "standard-ammunition" } : undefined);
        if (!assignment) continue;
        const kept = (strike.notes ?? []).filter((note) => !BANNED.test(note));
        if ("munition" in assignment) {
            const row = AS_MUNITIONS.find((munition) => munition.key === assignment.munition)!;
            strike.munition = row.key;
            const sabot = /sabot/.test(item.tag) ? " (the nearest canon round: a penetrator with a critical chance)" : "";
            const ours = (item.rulesLevel ?? 0) >= 6 || row.custom;
            kept.push(!ours ? `ASCE p.${row.page}, Alternate Munitions: ${row.name}` : row.custom || sabot || /^ammo-custom-ac-12-/.test(item.tag) || /thunderbolt/.test(item.tag)
                ? `${OURS}plays as the ${row.name} round${sabot}${row.custom ? ": " + row.rule : ""}`
                : `ASCE p.${row.page}, Alternate Munitions: ${row.name}`);
        } else {
            strike.noConversion = assignment.noConversion;
            kept.push(`${(item.rulesLevel ?? 0) >= 6 ? OURS : "Not converted by the books: "}${{
                "standard-ammunition": "standard rounds; the weapon's own block carries the damage",
                "feeds-special": "it supplies another item's special and has no code of its own",
                "carried-by-weapon": "the weapon's block already carries the effect",
                "no-alpha-strike-munition": "ASCE Alternate Munitions (pp.142-146) has no such round, and the canon equivalent has none either",
                "no-alpha-strike-rule": "no Alpha Strike rule covers it",
                "carried-by-linked-weapons": "the linked weapons carry the damage",
                "explosive-component-only": "counted only as an explosive component",
            }[assignment.noConversion]}`);
        }
        strike.notes = kept;
    }
    return items;
}
