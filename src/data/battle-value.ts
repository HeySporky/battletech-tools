import { IEquipmentItem } from "./data-interfaces";
import { ARTEMIS_FIRE_CONTROL, getAmmoBattleValuePerTon, getEquipmentCatalogDefinitions, getItemBattleValue as getCatalogBattleValue } from "./equipment-registry";
import { DEFAULT_RULES_EDITION, RulesEditionUnitType, btRulesEditions, getEditionStats, getRulesEdition } from "./rules-editions";

/**
 * Battle Value by rules edition: the scheme each edition uses for each unit type (BV1 from the Master Rules, BV2 from
 * the TechManual), and the skill multipliers. Research and rulings: docs/superpowers/plans/2026-11-03-edition-aware-bv.md.
 */

export type BattleValueScheme = "none" | "bv1" | "bv2";
/** Unit types with a Battle Value of their own (buildings have none here yet). */
export type BattleValueUnitType = Exclude<RulesEditionUnitType, "building">;

export interface IBattleValueRules {
    scheme: BattleValueScheme;
    /** Where the rules are printed, errata included. */
    source: string;
    /** BV1 not entered yet for this unit type: BV2 is worked out and shown alone. */
    pending?: true;
    /** Level 3 additions to the edition's BV1 (Maximum Tech). */
    levelThree?: IBattleValueLevelThree;
    /**
     * BV1: explosive ammunition in an arm is excused only by CASE in the next location inward, not by CASE in the arm
     * (FanPro BMR errata p.12). Without it, CASE in either counts (BMR(R) p.153).
     */
    armCaseInwardOnly?: true;
}

/** Maximum Tech's Level 3 BV1 tables (pp.90-91); its other rules are steps in each unit's BV1. */
export interface IBattleValueLevelThree {
    source: string;
    /** p.90: BV, then ammo BV per ton, by tag (one-shot rows: the slash figure). */
    items: Record<string, [number, number?]>;
    /** p.90 Clan table, where it prints another BV than the Inner Sphere one (no row does today). */
    clanItems: Record<string, number>;
    /** p.91 Special Ammunition: ammo BV multiplier by ammo tag, `tagged` ones only with TAG on their side; the rest (caseless, tracer, smoke...) x 1. */
    ammo: Array<[pattern: RegExp, multiplier: number, tagged?: true]>;
    /** p.91 Engine Multipliers: the internal structure multiplier by engine tag, replacing x 1.5 as an XL engine's does. */
    engines: Record<string, number>;
    /** p.91: a command console's BV for its side, added once after the total. */
    commandConsole: number;
    /** p.92: vehicle equipment by tag, rated at this figure in this step instead of as a weapon. */
    vehicleItems: Record<string, [step: "defensive" | "movement" | "weapons", value: number]>;
    /** p.92: added to the Vehicle Type Modifier by chassis modification tag; p.90: any other has no impact on BV. */
    vehicleChassis: Record<string, number>;
    /** p.92: Base Weapon Battle Rating for each additional crewman. */
    vehicleCrew: number;
}

/** Maximum Tech, Revised (FanPro 35013) pp.90-92: the Level 3 tables that go with the Revised Master Rules. */
const MAX_TECH: IBattleValueLevelThree = {
    source: "Maximum Tech, Revised pp.90-92",
    items: {
        "er-ppc-capacitor": [321], "ppc-capacitor": [247], "is-laser-ams": [105], "clan-laser-ams": [105],
        "large-x-pulse-laser": [178], "medium-x-pulse-laser": [71], "small-x-pulse-laser": [21],
        "er_large_pulse_laser": [271], "er_medium_pulse_laser": [116], "er_small_pulse_laser": [36],
        "vehicular-grenade-launcher": [1], "heavy-flamer": [20, 3], "autocannon-light-2": [30, 3], "autocannon-light-5": [62, 5],
        "long-tom-cannon": [348, 48], "sniper-cannon": [115, 16], "thumper-cannon": [58, 7],
        "thunderbolt-5": [64, 8], "thunderbolt-10": [127, 16], "thunderbolt-15": [229, 26], "thunderbolt-20": [305, 35],
        "thunderbolt-5-os": [13], "thunderbolt-10-os": [25], "thunderbolt-15-os": [46], "thunderbolt-20-os": [61],
        "streak-lrm-5": [87, 11], "streak-lrm-10": [173, 22], "streak-lrm-15": [260, 32], "streak-lrm-20": [346, 43],
        "streak-lrm-5-os": [17], "streak-lrm-10-os": [35], "streak-lrm-15-os": [52], "streak-lrm-20-os": [69],
        "angel-ecm": [100], "bloodhound-active-probe": [25],
    },
    clanItems: {},
    ammo: [[/-ac-\d+-armor-piercing$/, 6], [/-lb-\d+x-cluster$/, 0.75], [/-ac-\d+-flechette$/, 0.5],
        [/-(srm-frag|lrm-fragmentation)$/, 0.5], [/-lrm-swarm-i$/, 1.5], [/-lrm-flare$/, 0.05], [/-lrm-semi-guided$/, 6, true]],
    engines: { "large-standard": 1.125, "large-ice": 1.125, clan_xxl: 0.75, "large-clan_xl": 0.75, "large-clan_xxl": 0.5,
        xxl: 0.5, "large-xl": 0.75, "large-xxl": 0.375 },
    commandConsole: 200,
    vehicleItems: { bulldozer: ["defensive", 10], "bridge-layer-light": ["movement", 5], "bridge-layer-medium": ["movement", 10],
        "bridge-layer-heavy": ["movement", 20], "vtol-mast-mount": ["weapons", 10] },
    vehicleChassis: { "limited-amphibious": 0.1, "fully-amphibious": 0.1, "dune-buggy": 0.05 },
    vehicleCrew: 2,
};

/**
 * Maximum Tech (FASA 1700, corrected second printing) pp.90-92: written for the 1998 Master Rules (its p.90 names
 * their pp.139-145), so it is that edition's Level 3 (owner ruling 2026-11-10). Read on the page images on
 * 2026-11-11: every table and figure above is the same in this printing.
 */
const MAX_TECH_FASA: IBattleValueLevelThree = { ...MAX_TECH, source: "Maximum Tech (FASA) pp.90-92" };

/**
 * BV1 Vehicle Type Modifiers (BMR p.141, BMR(R) p.154): surface vessels, hydrofoils and submarines are Naval. The books
 * have no WiGE, read here as Hover.
 */
export const BV1_VEHICLE_TYPE_MODIFIERS: Record<string, number> = {
    tracked: 0.8, wheeled: 0.7, hover: 0.6, wige: 0.6, "naval-surface": 0.5, "naval-sub": 0.5, hydrofoil: 0.5, vtol: 0.4,
};

const NO_BATTLE_VALUE: IBattleValueRules = { scheme: "none", source: "No Battle Value system before the BattleTech Master Rules (1998)" };

const bv1 = (source: string, entered = false): IBattleValueRules => entered ? { scheme: "bv1", source } : { scheme: "bv1", source, pending: true };
// AT2 pp.53-54 and AT2R p.81 print the same steps; each reads its own edition's equipment BVs (plan, segment 2).
const AT2 = bv1("AeroTech 2 pp.53-54 (with BMR equipment BVs); AT2 errata 1.2 bomb BVs");
const AT2R = bv1("AeroTech 2, Revised Edition pp.81-82 (with BMR(R) equipment BVs)");
const BV2: IBattleValueRules = { scheme: "bv2", source: "TechManual pp.302-319, replaced by Battle Value v4.1 (2024) and TM errata v8.0 tables pp.315-319" };

const MECH_MASTER_RULES: IBattleValueRules = { ...bv1("BattleTech Master Rules pp.139-145; FanPro BMR errata p.12; Maximum Tech (FASA) pp.90-92 (Level 3)", true), armCaseInwardOnly: true, levelThree: MAX_TECH_FASA };
const MECH_MASTER_RULES_REVISED: IBattleValueRules = { ...bv1("BattleTech Master Rules, Revised Edition pp.152-159; Maximum Tech, Revised pp.90-92 (Level 3)", true), levelThree: MAX_TECH };
/**
 * A Future Wars Walker (#172, Custom Homebrew) has no published Battle Value. Ours is the edition's BattleMech procedure
 * run over the walker's locations, always provisional (Walker.isBattleValueProvisional).
 */
const asWalker = (mech: IBattleValueRules): IBattleValueRules =>
    ({ ...mech, source: `${mech.source}; a BattleMech's rules, provisional: none are published for a Future Wars Walker` });

/**
 * Battle Value rules by edition tag, then unit type. An edition not listed reads the newest edition before it that is
 * (the CBT box set reads BMR(R); the BattleMech Manual and Core Rulebook read Total Warfare); a unit type an edition
 * leaves out has no Battle Value in it.
 */
export const BV_RULES: Record<string, Partial<Record<BattleValueUnitType, IBattleValueRules>>> = {
    "master-rules": {
        mech: MECH_MASTER_RULES, walker: asWalker(MECH_MASTER_RULES),
        vehicle: { ...bv1("BattleTech Master Rules pp.141-142; FanPro BMR errata p.12; Maximum Tech (FASA) pp.90-92 (Level 3)", true), levelThree: MAX_TECH_FASA },
        fighter: AT2, "small-craft": AT2, "capital-ship": AT2,
        infantry: bv1("BattleTech Master Rules p.142 (table); FanPro BMR errata p.12"),
        "battle-armor": bv1("BattleTech Master Rules p.142 (table)"),
    },
    "master-rules-revised": {
        mech: MECH_MASTER_RULES_REVISED, walker: asWalker(MECH_MASTER_RULES_REVISED),
        vehicle: { ...bv1("BattleTech Master Rules, Revised Edition pp.154-155; Maximum Tech, Revised pp.90-92 (Level 3)", true), levelThree: MAX_TECH },
        fighter: AT2R, "small-craft": AT2R, "capital-ship": AT2R,
        protomech: bv1("BattleTech Master Rules, Revised Edition pp.155-156"),
        infantry: bv1("BattleTech Master Rules, Revised Edition pp.155-156 (table); Maximum Tech p.93 (Level 3)"),
        // Newer than, and replacing, the BMR(R) p.155 battle armor rows.
        "battle-armor": bv1("Classic BattleTech Companion pp.187-191"),
    },
    "total-warfare": {
        mech: BV2, walker: asWalker(BV2), vehicle: BV2, fighter: BV2, "small-craft": BV2, infantry: BV2, "battle-armor": BV2, protomech: BV2,
        "capital-ship": { scheme: "bv2", source: "Strategic Operations: Advanced Aerospace pp.148-149" },
    },
};

/** The newest edition at or before `edition` that `table` lists. An unknown edition reads the default edition's. */
const getListedEdition = (edition: string | undefined, table: Record<string, unknown>): string | undefined => {
    const at = btRulesEditions.indexOf(getRulesEdition(edition));
    return btRulesEditions.slice(0, at + 1).reverse().find((entry) => Object.prototype.hasOwnProperty.call(table, entry.tag))?.tag;
};

/** The Battle Value rules `unitType` follows under `edition`. An unknown edition reads the default edition's. */
export const getBattleValueRules = (edition: string | undefined, unitType: BattleValueUnitType): IBattleValueRules => {
    const listed = getListedEdition(edition, BV_RULES);
    return (listed && BV_RULES[listed][unitType]) || NO_BATTLE_VALUE;
};

/** A C3 network's BV: a share of the whole network's BV added to each member, a percent of each member's own, or of each member's weapons. */
export type BattleValueC3Rule =
    | { kind: "network"; percent: number; boostedPercent: number }
    | { kind: "per-unit"; twoUnits: number; perExtraUnit: number; cap: number; boostedFlat: number }
    | { kind: "weapons"; percent: number };

/** Battle force adjustments, applied in this order before skill (BV v4.1 p.23; TO:AUE p.198). */
export interface IBattleValueForceRules {
    source: string;
    /** Ammo whose tons in the force add their BV to each unit with TAG, Light TAG or a C3 master (half if rear-only). */
    tagAmmo?: string[];
    /** BV1: a flat bonus on each unit with homing Arrow IV or a designator, once the force has both. */
    homingTag?: { bonus: number; ammo: string[]; designators: string[] };
    c3: BattleValueC3Rule;
    /** A fighter's external stores join its BV before skill. */
    externalStores?: true;
}

const TAGS = ["is-tag", "prototype-tag", "clan-tag", "clan-light-tag"];
/** TAG, Light TAG and C3 masters: each adds the force's TAG-guided ammo to its unit's BV (BV v4.1 p.23; TO:AUE p.198). */
const TAG_DESIGNATORS = [...TAGS, "c3-computer-master", "c3-boosted-master", "c3-emergency-master"];
const HOMING_ARROW_IV = ["ammo-is-arrow-iv-homing", "ammo-clan-arrow-iv-homing"];
const BV1_C3: BattleValueC3Rule = { kind: "weapons", percent: 35 };

/**
 * Force adjustments by edition tag, read like `BV_RULES`. BV1 adds these to a unit's final BV, which skill then
 * multiplies; "fighting group" reads as the force, like TAG and C3 below. TO:AUE p.198 adds Arrow IV homing, Copperhead and
 * semi-guided mortar ammo to TAG, one bonus per TAG carried, and boosted C3 at 7 percent. The Core Rulebook p.220
 * lists only C3: +10% to each unit of a two-unit network, +5% per unit beyond, at most +40%, boosted +5% on top.
 */
export const BV_FORCE_RULES: Record<string, IBattleValueForceRules> = {
    "master-rules": {
        source: "BattleTech Master Rules pp.143-144, notes A and D",
        homingTag: { bonus: 200, ammo: HOMING_ARROW_IV, designators: TAGS },
        c3: BV1_C3,
    },
    "master-rules-revised": {
        source: "BattleTech Master Rules, Revised Edition pp.157-158, notes A and D",
        // Note A adds the C3 master.
        homingTag: { bonus: 200, ammo: HOMING_ARROW_IV, designators: TAG_DESIGNATORS },
        c3: BV1_C3,
    },
    "total-warfare": {
        source: "Battle Value v4.1 p.23 (TM p.315); TO:AUE p.198",
        // Air-launched Arrow IV homing bombs count too (user ruling, 2026-11-03).
        tagAmmo: ["ammo-is-lrm-semi-guided", "ammo-is-enhanced-lrm-semi-guided", "ammo-is-arrow-iv-homing", "ammo-clan-arrow-iv-homing",
            "ammo-long-tom-copperhead", "ammo-sniper-copperhead", "ammo-thumper-copperhead", "ammo-is-mech-mortar-guided",
            "ammo-is-bomb-arrow-iv-homing", "ammo-clan-bomb-arrow-iv-homing"],
        c3: { kind: "network", percent: 5, boostedPercent: 7 },
        externalStores: true,
    },
    "core-rulebook": {
        source: "BattleTech Core Rulebook p.220",
        c3: { kind: "per-unit", twoUnits: 10, perExtraUnit: 5, cap: 40, boostedFlat: 5 },
    },
};

/** The force adjustments under `edition`; none before the Master Rules. */
export const getBattleValueForceRules = (edition: string | undefined): IBattleValueForceRules | undefined => {
    const listed = getListedEdition(edition, BV_FORCE_RULES);
    return listed ? BV_FORCE_RULES[listed] : undefined;
};

const isRearMounted = (item: IEquipmentItem) => !!item.rear || item.location === "rear" || item.location === "aft";

/**
 * A unit's part in its force's TAG adjustment: how many times it adds the force's guided ammo BV, and the BV of the
 * guided ammo it carries. BV1: `tag` when a TAG is among its designators, and `semiGuided`, what its semi-guided LRM
 * ammo adds beside friendly TAG (Maximum Tech p.91).
 */
export interface IBattleValueTagShare { times: number; ammo: number; tag?: boolean; semiGuided?: number }

/**
 * A unit's TAG share under `edition`: once for each designator it carries (TO:AUE p.198), half each when all are
 * rear-mounted (v4.1 p.23). Each ton of guided ammo counts its BV for the launcher it feeds (semi-guided LRM ammo
 * takes the launcher's); `stores` are a fighter's bombs, each counting its own BV (user ruling, 2026-11-03). BV1's
 * edition lists its own ammo and designators; `taggedGain` gives what the unit's BV1 gains with its semi-guided LRM ammo
 * beside TAG, asked only when it carries some.
 */
export const getBattleValueTagShare = (edition: string | undefined, equipment: IEquipmentItem[], binWeapon: (bin: IEquipmentItem) => IEquipmentItem | null | undefined,
    stores: Array<{ item: IEquipmentItem | undefined; count: number }> = [], taggedGain?: () => number): IBattleValueTagShare => {
    const rules = getBattleValueForceRules(edition);
    const tagAmmo = rules?.tagAmmo ?? rules?.homingTag?.ammo ?? [];
    const designatorTags = rules?.homingTag?.designators ?? TAG_DESIGNATORS;
    const designators = tagAmmo.length > 0 ? equipment.filter((item) => !item.isAmmo && designatorTags.includes(item.tag)) : [];
    const rearOnly = designators.every(isRearMounted);
    const bins = equipment.filter((item) => item.isAmmo && tagAmmo.includes(item.tag));
    const semiGuided = taggedGain && equipment.some((item) => getAmmoBattleValueMultiplier(item, edition, true) !== getAmmoBattleValueMultiplier(item, edition));
    return {
        ...(semiGuided ? { semiGuided: taggedGain() } : {}),
        times: designators.length * (rearOnly ? 0.5 : 1),
        ammo: bins.reduce((sum, bin) => sum + getAmmoBattleValuePerTon(binWeapon(bin) ?? null, bin) * (bin.weight || 0), 0)
            + stores.reduce((sum, store) => sum + (store.item && tagAmmo.includes(store.item.tag) ? (store.item.battleValue || 0) * store.count : 0), 0),
        tag: (rules?.homingTag && designators.some((item) => TAGS.includes(item.tag))) || undefined,
    };
};

/**
 * What `share` adds before skill among its force's `shares` under `edition`: its designators' guided ammo, or BV1's
 * flat bonus (once a unit, whichever side of the pair it holds) and its semi-guided ammo beside friendly TAG.
 */
export const getBattleValueTagBonus = (edition: string | undefined, share: IBattleValueTagShare, shares: IBattleValueTagShare[]): number => {
    const guided = shares.reduce((sum, entry) => sum + entry.ammo, 0);
    const homing = getBattleValueForceRules(edition)?.homingTag;
    if (!homing) return share.times * guided;
    const paired = guided > 0 && shares.some((entry) => entry.times > 0) && (share.times > 0 || share.ammo > 0);
    return (paired ? homing.bonus : 0) + (shares.some((entry) => entry.tag) ? share.semiGuided ?? 0 : 0);
};

/** C3 systems that join a network (TW p.131; TO:AUE p.110). C3i counts like standard C3 (CRB p.220). */
export type BattleValueC3Type = "standard" | "boosted";
const C3_SYSTEMS: Record<string, BattleValueC3Type> = {
    "c3-computer-master": "standard", "c3-computer-slave": "standard", "c3-emergency-master": "standard", "c3i-computer": "standard",
    "c3-boosted-master": "boosted", "c3-boosted-slave": "boosted",
};

/** The C3 system a unit networks with: boosted when it carries any boosted C3; undefined with none. */
export const getBattleValueC3Type = (equipment: IEquipmentItem[]): BattleValueC3Type | undefined => {
    const types = equipment.map((item) => C3_SYSTEMS[item.tag]).filter(Boolean);
    return types.includes("boosted") ? "boosted" : types[0];
};

export interface IBattleValueC3Part { systems: string[]; weapons: number }

/** A unit's C3 systems, and the BV of its weapons without ammo, defensive gear or artillery, rear ones halved (BMR p.143; BMR(R) p.157). */
export const getBattleValueC3Part = (edition: string | undefined, equipment: IEquipmentItem[]): IBattleValueC3Part => ({
    systems: equipment.filter((item) => C3_SYSTEMS[item.tag]).map((item) => item.tag),
    weapons: equipment.filter((item) => !item.isAmmo && !item.battleValueDefensive && ["Energy Weapons", "Ballistic Weapons", "Missile Weapons"].includes(item.category ?? ""))
        .reduce((sum, item) => sum + (getItemBattleValue(item, edition) ?? 0) * (isRearMounted(item) ? 0.5 : 1), 0),
});

/** BV1 counts C3 only in a complete network: a master and a slave, or two Improved C3 Computers (BMR p.143; BMR(R) p.157). */
export const isBattleValueC3Complete = (systems: string[]): boolean => systems.filter((tag) => tag === "c3i-computer").length > 1
    || (systems.some((tag) => tag.endsWith("-master")) && systems.some((tag) => tag.endsWith("-slave")));

/**
 * What a C3 network member adds before skill under `edition`: TM's percent of the network's total BV (`network`;
 * each member by its own C3 type, TO:AUE p.198), the CRB's percent of its own (`own`), growing with the network's
 * `members` (p.220), or BV1's percent of its `weapons`, rounded, when the network's `systems` are complete.
 * A network of one adds nothing.
 */
export const getBattleValueC3Share = (edition: string | undefined, type: BattleValueC3Type | undefined, own: number, network: number, members: number, weapons = 0, systems: string[] = []): number => {
    const rule = getBattleValueForceRules(edition)?.c3;
    if (!rule || !type || members < 2) return 0;
    if (rule.kind === "weapons") return isBattleValueC3Complete(systems) ? Math.round(weapons * rule.percent / 100) : 0;
    if (rule.kind === "network") return network * (type === "boosted" ? rule.boostedPercent : rule.percent) / 100;
    return own * (Math.min(rule.cap, rule.twoUnits + (members - 2) * rule.perExtraUnit) + (type === "boosted" ? rule.boostedFlat : 0)) / 100;
};

/**
 * An item's BV, or a weapon's ammo BV per ton, as `edition` prints it (BV1: BMR pp.142-144, BMR(R) pp.156-158); the
 * catalog's BV2 figure where the edition prints none.
 */
export const getItemBattleValue = (item: IEquipmentItem, edition: string | undefined, field: "battleValue" | "ammoBattleValue" = "battleValue", clan = false): number | undefined =>
    getPrintedItemBattleValue(item, edition, field, clan) ?? item[field];

/** The edition whose tables `edition` reads its Battle Values from (the CBT box set reads BMR(R)'s). */
export const getBattleValueEdition = (edition: string | undefined): string => getListedEdition(edition, BV_RULES) ?? getRulesEdition(edition).tag;

/**
 * An item's BV, or a weapon's ammo BV per ton, only where `edition`'s tables print one (`clan`: on a Clan unit), its
 * Level 3 tables included. An Artemis V launcher is its launcher's x 1.3 (Maximum Tech p.90).
 */
export const getPrintedItemBattleValue = (item: IEquipmentItem, edition: string | undefined, field: "battleValue" | "ammoBattleValue" = "battleValue", clan = false): number | undefined =>
    readPrintedItemBattleValue(item, edition, field, clan)?.value;

/** Where a BV1 figure was read: the edition's own tables, Maximum Tech's Level 3 table, or its Artemis V rule. */
export type BattleValue1Source = "tables" | "level-three" | "artemis-v";

const readPrintedItemBattleValue = (item: IEquipmentItem, edition: string | undefined, field: "battleValue" | "ammoBattleValue", clan: boolean): { value: number; source: BattleValue1Source } | undefined => {
    const printed = getEditionStats(item, getBattleValueEdition(edition))?.[field];
    if (printed !== undefined) return { value: printed, source: "tables" };
    const levelThree = getBattleValueRules(edition, "mech").levelThree;
    if (!levelThree) return undefined;
    const value = (clan && field === "battleValue" ? levelThree.clanItems[item.tag] : undefined) ?? levelThree.items[item.tag]?.[field === "battleValue" ? 0 : 1];
    if (value !== undefined) return { value, source: "level-three" };
    const artemisV = ARTEMIS_FIRE_CONTROL.find((system) => system.suffix === "-artemis-v")!;
    if (!item.tag.endsWith(artemisV.suffix)) return undefined;
    const launcher = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment).find((record) => record.tag === item.tag.slice(0, -artemisV.suffix.length));
    const launcherValue = launcher && getPrintedItemBattleValue(launcher, edition, field, clan);
    return launcherValue === undefined ? undefined : { value: launcherValue * (field === "battleValue" ? artemisV.battleValueMultiplier : 1), source: "artemis-v" };
};

/** Maximum Tech's special ammunition multiplier (p.91) for an ammo bin under `edition`: 1 without its Level 3 rules. */
export const getAmmoBattleValueMultiplier = (ammo: IEquipmentItem, edition: string | undefined, tagged = false): number =>
    getBattleValueRules(edition, "mech").levelThree?.ammo.find(([pattern, , needsTag]) => pattern.test(ammo.tag) && (tagged || !needsTag))?.[1] ?? 1;

/** BV1's defensive equipment: AMS (with its ammo), A-Pods and ECM; an active probe is offensive (BMR(R) pp.152, 154). */
export const isBattleValue1Defensive = (item: IEquipmentItem): boolean => item.battleValueDefensive === true && !/probe/.test(item.tag);

/** Rates an item, or with `weapon` an ammo bin's ton, in a BV1 calculation. */
export type BattleValue1Rater = (item: IEquipmentItem, weapon?: IEquipmentItem) => number;

/** How a BV1 rater reached a figure: where it was read ("unlisted": the catalog's BV2 figure), and any special ammunition multiplier. */
export interface IBattleValue1Rating { value: number; source: BattleValue1Source | "unlisted"; multiplier: number }

/**
 * Rates an item, or with `weapon` an ammo bin's ton, in a BV1 calculation under `edition`, and says where the figure
 * came from. An item its tables do not print falls back on the catalog's BV2 figure. Special ammunition is worth a
 * multiple of the standard ammo's BV (Maximum Tech p.91).
 */
export const rateBattleValue1 = (edition: string, techTag: string, tagged: boolean, item: IEquipmentItem, weapon?: IEquipmentItem): IBattleValue1Rating => {
    const multiplier = weapon ? getAmmoBattleValueMultiplier(item, edition, tagged) : 1;
    const printed = readPrintedItemBattleValue(weapon ?? item, edition, weapon ? "ammoBattleValue" : "battleValue", techTag === "clan" || techTag === "mclan");
    if (printed !== undefined) return { value: printed.value * multiplier, source: printed.source, multiplier };
    const bv2 = weapon ? getAmmoBattleValuePerTon(weapon, item) : getCatalogBattleValue(item, techTag);
    return { value: bv2 * multiplier, source: "unlisted", multiplier };
};

/**
 * A BV1 rater under `edition`, from its tables; an item they do not print falls back on the catalog's BV2 figure, which
 * `note` logs.
 */
export const getBattleValue1Rater = (edition: string, techTag: string, tagged: boolean, note: (line: string) => void): BattleValue1Rater => (item, weapon) => {
    const rating = rateBattleValue1(edition, techTag, tagged, item, weapon);
    const bv2 = rating.multiplier ? rating.value / rating.multiplier : 0;
    if (rating.source === "unlisted" && bv2) note(`${item.name}: not in the ${getRulesEdition(getBattleValueEdition(edition)).name} tables, BV2 figure ${bv2} used`);
    return rating.value;
};

/** The BV1 of the ammo in `equipment`: the bins feeding defensive weapons, or the rest. A bin feeding nothing counts for neither. */
export const getBattleValue1Ammo = (equipment: IEquipmentItem[], binWeapon: (bin: IEquipmentItem) => IEquipmentItem | null | undefined, rate: BattleValue1Rater, defensive: boolean): number =>
    equipment.filter((item) => item.isAmmo || item.tag.startsWith("ammo-")).reduce((sum, bin) => {
        const fed = binWeapon(bin);
        return fed && isBattleValue1Defensive(fed) === defensive ? sum + rate(bin, fed) * bin.weight : sum;
    }, 0);

/** Speed Factor: ((MP - 5) / 10 + 1) ^ 1.2 to two places, the curve both BV1 (BMR(R) p.154) and BV2 (TM p.316) tabulate. */
export const getSpeedFactor = (mp: number): number => Number.isFinite(mp) ? Math.round(Math.pow(1 + (mp - 5) / 10, 1.2) * 100) / 100 : 0.44;

/** True once `edition` works out a BV1 of its own for `unitType` (its BV1 record is entered, not pending). */
const worksOutBv1 = (edition: string | undefined, unitType: BattleValueUnitType): boolean => {
    const rules = getBattleValueRules(edition, unitType);
    return rules.scheme === "bv1" && !rules.pending;
};

/** Does `edition` have a Battle Value system for `unitType`? The first is in the Master Rules (BV_RULES). */
export const editionHasBattleValue = (edition: string | undefined, unitType: BattleValueUnitType = "mech"): boolean =>
    getBattleValueRules(edition, unitType).scheme !== "none";

/**
 * The skill table edition that goes with the Battle Value `edition` works out for `unitType` (plan ruling 2): its own
 * (or the newest before it, as the box set reads BMR(R)'s) once its BV1 is entered, and the TechManual's for BV2.
 */
export const getBattleValueSkillEdition = (edition: string | undefined, unitType: BattleValueUnitType): string =>
    (worksOutBv1(edition, unitType) && getListedEdition(edition, SKILL_MULTIPLIERS_BY_EDITION)) || DEFAULT_RULES_EDITION;

/** Runs a unit's BV1 method under a BV1 edition once that unit type's BV1 is entered, and its BV2 method otherwise. */
export const getBattleValueFor = <T>(edition: string | undefined, unitType: BattleValueUnitType, methods: { bv1?: () => T; bv2: () => T }): T =>
    (worksOutBv1(edition, unitType) && methods.bv1 ? methods.bv1 : methods.bv2)();

/**
 * The one Battle Value text for every display (plan ruling 1): a BV2 edition shows its BV, a BV1 edition "1,234 (BV2:
 * 1,456)", and an edition with no Battle Value, or whose BV1 is not entered yet, "— (BV2: 1,456)". `battleValue` gives
 * the base or skill-adjusted BV under an edition, so each figure reads its own skill table (ruling 2). A force total
 * lists each unit type in it and shows a BV1 figure only once every one of them has one.
 */
export const formatBattleValue = (battleValue: (edition: string) => number, unitType: BattleValueUnitType | BattleValueUnitType[], edition: string | undefined): string => {
    const types = Array.isArray(unitType) ? unitType : [unitType];
    const tag = getRulesEdition(edition).tag;
    if (types.every((type) => getBattleValueRules(tag, type).scheme === "bv2")) return battleValue(tag).toLocaleString("en-US");
    const bv2 = battleValue(DEFAULT_RULES_EDITION).toLocaleString("en-US");
    return `${types.length > 0 && types.every((type) => worksOutBv1(tag, type)) ? battleValue(tag).toLocaleString("en-US") : "—"} (BV2: ${bv2})`;
};

/**
 * Battle Value skill multipliers, by rules edition. Every table here is indexed [Gunnery][Piloting]: rows are the
 * Gunnery Skill, columns the Piloting, Driving or Anti-'Mech Skill.
 *
 * - Battledroids to BattleTech, Fourth Edition (1984-1996) have no Battle Value system and so no table.
 *   BattleTech Compendium: The Rules of Warfare (1994) has none either (checked in its OCR text, 2026-10-17).
 * - Master Rules (1998, p.144) and Master Rules, Revised Edition (2001, p.158) print the same table for skills
 *   0 to 7.
 * - Total Warfare's table is the TechManual's (p.315). It has been printed three ways: the 2007 first printing
 *   (Gunnery 0 / Piloting 0 = 3.68), the Battle Value 2.1 revision of 2017 (2.80) and the corrected printings
 *   from 2020 on (2.42), which the replacement Battle Value pages v4.1 (2024) repeat. The newest is used.
 * - The Core Rulebook (2026, p.222) prints the TechManual's current table.
 */

/** How a unit type reads the table: which skill is its column, and which unit types are held to one column. */
export type SkillMultiplierUnitType =
    | "mech"
    | "vehicle"
    | "fighter"
    | "protomech"
    | "battle-armor"
    /** Foot, motorized and jump infantry: the column is the Anti-'Mech Skill. */
    | "infantry"
    | "mechanized-infantry";

export interface IEditionSkillMultipliers {
    /** Where the table is printed. */
    source: string;
    /** [Gunnery][Piloting / Driving / Anti-'Mech]. */
    table: number[][];
    /** Unit types that have no second skill in this edition and read the 5 column. */
    fixedColumnUnitTypes: SkillMultiplierUnitType[];
}

/** The column used by a unit type with no Piloting or Anti-'Mech Skill of its own. */
export const SKILL_MULTIPLIER_FIXED_COLUMN = 5;

// BV Skill Multipliers, BattleTech Master Rules p.144 and Master Rules, Revised Edition p.158.
const MASTER_RULES_TABLE: number[][] = [
    //            PILOTING: 0     1     2     3     4     5     6     7
    /* Gunnery 0 */        [2.05, 2.00, 1.95, 1.90, 1.85, 1.80, 1.75, 1.70],
    /* Gunnery 1 */        [1.85, 1.80, 1.75, 1.70, 1.65, 1.60, 1.55, 1.50],
    /* Gunnery 2 */        [1.65, 1.60, 1.55, 1.50, 1.45, 1.40, 1.35, 1.30],
    /* Gunnery 3 */        [1.45, 1.40, 1.35, 1.30, 1.25, 1.20, 1.15, 1.10],
    /* Gunnery 4 */        [1.25, 1.20, 1.15, 1.10, 1.05, 1.00, 0.95, 0.90],
    /* Gunnery 5 */        [1.15, 1.10, 1.05, 1.00, 0.95, 0.90, 0.85, 0.80],
    /* Gunnery 6 */        [1.05, 1.00, 0.95, 0.90, 0.85, 0.80, 0.75, 0.70],
    /* Gunnery 7 */        [0.95, 0.90, 0.85, 0.80, 0.75, 0.70, 0.65, 0.60],
];

// BV Skill Multiplier Table, TechManual p.315 (corrected printings from 2020; Battle Value pages v4.1, 2024) and
// Core Rulebook p.222.
const TECH_MANUAL_TABLE: number[][] = [
    //   PILOTING / ANTI-'MECH: 0     1     2     3     4     5     6     7     8
    /* Gunnery 0 */            [2.42, 2.31, 2.21, 2.10, 1.93, 1.75, 1.68, 1.59, 1.50],
    /* Gunnery 1 */            [2.21, 2.11, 2.02, 1.92, 1.76, 1.60, 1.54, 1.46, 1.38],
    /* Gunnery 2 */            [1.93, 1.85, 1.76, 1.68, 1.54, 1.40, 1.35, 1.28, 1.21],
    /* Gunnery 3 */            [1.66, 1.58, 1.51, 1.44, 1.32, 1.20, 1.16, 1.10, 1.04],
    /* Gunnery 4 */            [1.38, 1.32, 1.26, 1.20, 1.10, 1.00, 0.95, 0.90, 0.85],
    /* Gunnery 5 */            [1.31, 1.19, 1.13, 1.08, 0.99, 0.90, 0.86, 0.81, 0.77],
    /* Gunnery 6 */            [1.24, 1.12, 1.07, 1.02, 0.94, 0.85, 0.81, 0.77, 0.72],
    /* Gunnery 7 */            [1.17, 1.06, 1.01, 0.96, 0.88, 0.80, 0.76, 0.72, 0.68],
    /* Gunnery 8 */            [1.10, 0.99, 0.95, 0.90, 0.83, 0.75, 0.71, 0.68, 0.64],
];

/**
 * The table each rules edition uses, by edition tag. An edition that is not listed has no Battle Value skill
 * multipliers: its units' Battle Values are not adjusted for skill.
 */
export const SKILL_MULTIPLIERS_BY_EDITION: Record<string, IEditionSkillMultipliers> = {
    "master-rules": {
        source: "BattleTech Master Rules p.144",
        table: MASTER_RULES_TABLE,
        // "Infantry units have no Piloting Skill; simply use the 5 column of the table."
        fixedColumnUnitTypes: ["infantry", "mechanized-infantry", "battle-armor"],
    },
    "master-rules-revised": {
        source: "BattleTech Master Rules, Revised Edition p.158",
        table: MASTER_RULES_TABLE,
        // As Master Rules, and: "Because ProtoMech pilots have no Piloting Skill ... use the 5 column".
        fixedColumnUnitTypes: ["infantry", "mechanized-infantry", "battle-armor", "protomech"],
    },
    "total-warfare": {
        source: "TechManual p.315",
        table: TECH_MANUAL_TABLE,
        // ProtoMechs have no Piloting Skill; mechanized infantry adjust Gunnery only (TM p.314). Other infantry and
        // battle armor use their Anti-'Mech Skill as the column.
        fixedColumnUnitTypes: ["protomech", "mechanized-infantry"],
    },
    // The BattleMech Manual prints no table: Clan skills "must still be paid for in BV" and Battle Values come from
    // the Master Unit List (BMM p.9), which uses TechManual's. Canon is silent: TechManual's table is used (flagged).
    "battlemech-manual": {
        source: "TechManual p.315 (BattleMech Manual p.9 prints no table)",
        table: TECH_MANUAL_TABLE,
        fixedColumnUnitTypes: ["protomech", "mechanized-infantry"],
    },
    "core-rulebook": {
        source: "BattleTech Core Rulebook p.222",
        table: TECH_MANUAL_TABLE,
        fixedColumnUnitTypes: ["protomech", "mechanized-infantry"],
    },
};

/** The edition's table and how it is read, or null when the edition has no Battle Value skill multipliers. */
export const getEditionSkillMultipliers = (edition: string = DEFAULT_RULES_EDITION): IEditionSkillMultipliers | null => {
    return Object.prototype.hasOwnProperty.call(SKILL_MULTIPLIERS_BY_EDITION, edition) ? SKILL_MULTIPLIERS_BY_EDITION[edition] : null;
};

/** Editions, oldest first, that adjust Battle Value for skill. */
export const getEditionsWithSkillMultipliers = (): string[] =>
    btRulesEditions.map((edition) => edition.tag).filter((tag) => getEditionSkillMultipliers(tag) !== null);

/**
 * The Battle Value multiplier for a unit's skills under one rules edition. `piloting` is the unit's Piloting,
 * Driving or Anti-'Mech Skill; it is ignored for a unit type the edition holds to the 5 column. Null when the
 * edition has no table, or a skill lies outside it.
 */
export const getSkillMultiplier = (
    gunnery: number,
    piloting: number,
    unitType: SkillMultiplierUnitType = "mech",
    edition: string = DEFAULT_RULES_EDITION,
): number | null => {
    const multipliers = getEditionSkillMultipliers(edition);
    if (!multipliers) return null;
    const column = multipliers.fixedColumnUnitTypes.includes(unitType) ? SKILL_MULTIPLIER_FIXED_COLUMN : piloting;
    return multipliers.table[gunnery]?.[column] ?? null;
};
