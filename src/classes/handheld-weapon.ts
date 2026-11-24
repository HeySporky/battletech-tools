import { IEquipmentItem } from "../data/data-interfaces";
import { getAmmoBattleValuePerTon, getCompatibleAmmo, getEquipmentCatalogDefinitions, getItemBattleValue as getCatalogBattleValue, getWeaponShotsPerTon } from "../data/equipment-registry";
import { getBattleValueFor, rateBattleValue1 } from "../data/battle-value";
import { getHandheldRules, IHandheldRules } from "../data/mech-handheld-weapon";
import { matchesTag } from "../data/tag-match";

/**
 * A 'Mech handheld weapon (#611): its own small design, built in the 'Mech creator's equipment step, carried in the hands and not part
 * of the 'Mech's weight or slots. Maximum Tech p.79 builds it, p.92 prices it; Tactical Operations: Advanced Units & Equipment
 * pp.126-128 builds it and p.193 prices it for Total Warfare and later.
 */
export interface IHandheldEntry {
    /** The weapon or item's catalog tag. */
    tag: string;
    /** How many of it: a handheld holds several of one weapon. Default 1. */
    count?: number;
    /** Shots of ammunition for each of them, for a weapon that needs it (carried by the shot, in 1/shotsPerTon of a ton). */
    shots?: number;
    /** The ammunition's tag; the weapon's standard round when absent. */
    ammoTag?: string;
}

export interface IHandheldDesign {
    entries: IHandheldEntry[];
    /** Points of standard armor on the weapon (an armored weapon is destroyed only by damage that passes it). */
    armor: number;
}

export interface IHandheldLine {
    label: string;
    tons: number;
    cost: number;
    battleValue: number;
}

export interface IHandheldAnalysis {
    rules: IHandheldRules | undefined;
    lines: IHandheldLine[];
    heatSinks: number;
    weaponTons: number;
    ammoTons: number;
    heatSinkTons: number;
    armorTons: number;
    /** All components, rounded up to the half ton. */
    weight: number;
    /** Weapons and ammunition only. */
    partsBattleValue: number;
    /** Weapons, ammunition and armor factor x 2, added to the carrying 'Mech's final BV. */
    battleValue: number;
    cost: number;
    /** Items counted toward the item limit. */
    itemCount: number;
    issues: string[];
}

const HEAT_SINK_COST = 2000;
const STANDARD_ARMOR_COST_PER_TON = 10000;
const WEAPON_CATEGORIES = ["Energy Weapons", "Ballistic Weapons", "Missile Weapons", "Artillery Weapons"];
/** Weapons built to sit in one body location only: "exceptional location restrictions (such as a Heavy Gauss Rifle)" (TO:AUE p.126). */
const LOCATION_RESTRICTED_TAGS = ["gauss-rifle-heavy", "gauss-rifle-heavy-improved", "clan-gauss-rifle-heavy"];

let catalog: IEquipmentItem[] | undefined;
const allItems = (): IEquipmentItem[] => (catalog ??= getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment));

/** The catalog item a handheld entry names, by tag or an earlier tag. */
export const findHandheldItem = (tag: string): IEquipmentItem | undefined =>
    allItems().find((item) => !item.isAmmo && item.tag === tag) ?? allItems().find((item) => !item.isAmmo && matchesTag(item, tag));

const isTag = (item: IEquipmentItem): boolean => /(^|-)tag$|light-tag/.test(item.tag);
const isMineDispenser = (item: IEquipmentItem): boolean => /mine-dispenser/.test(item.tag);
const isAntiMissile = (item: IEquipmentItem): boolean => /(^|-)ams(-|$)/.test(item.tag);
const isPhysical = (item: IEquipmentItem): boolean => item.category === "Melee" || item.isMelee === true;

/** Why a handheld weapon of `edition` cannot hold `item`, null when it can. */
export const getHandheldIssue = (item: IEquipmentItem, edition: string): string | null => {
    const rules = getHandheldRules(edition);
    if (!rules) return "This edition has no handheld weapon rules.";
    if (isPhysical(item)) {
        if (rules.id === "maxtech") return "Maximum Tech p.79 builds a handheld weapon from weapons, Artemis and TAG: no physical weapons.";
        if (/^shield|^spikes$/.test(item.tag)) return "Shields and Spikes are forbidden in a handheld weapon (TO:AUE p.126).";
        if (item.variableSize || item.weightDivisor) return `${item.name}: its weight and damage depend on the weight of the unit carrying it (TO:AUE p.126).`;
        return null;
    }
    if ((item.space?.battlemech ?? -1) < 0) return `${item.name} is not legal for a 'Mech to mount.`;
    if (LOCATION_RESTRICTED_TAGS.includes(item.tag) || item.allowedLocations || item.spreadLocations) {
        return `${item.name} has an exceptional location restriction (such as the Heavy Gauss Rifle) (TO:AUE p.126).`;
    }
    if (isAntiMissile(item) || isMineDispenser(item)) {
        return rules.id === "maxtech" ? `${item.name} is from the Other Equipment tables: only Artemis, TAG and heat sinks may go in a handheld weapon (Maximum Tech p.79).` : null;
    }
    if (isTag(item)) return null;
    if (item.variableSize) return `${item.name}: its size depends on the weight of the unit carrying it.`;
    if (!WEAPON_CATEGORIES.includes(item.category)) {
        return rules.id === "maxtech" ? `${item.name} is from the Other Equipment tables: only Artemis, TAG and heat sinks may go in a handheld weapon (Maximum Tech p.79).`
            : `${item.name} is not a weapon type a handheld weapon holds (TO:AUE p.126: AE, DB, DE, M, P, PD, Mine Dispensers and TAG).`;
    }
    return null;
};

/** The weapon's standard round of its own faction (or neutral), or the named round. */
export const findHandheldAmmo = (weapon: IEquipmentItem, ammoTag?: string): IEquipmentItem | undefined => {
    const rounds = allItems().filter((item) => item.isAmmo);
    if (ammoTag) return rounds.find((round) => round.tag === ammoTag || matchesTag(round, ammoTag));
    const clan = weapon.techBase === "clan" || /^clan-/.test(weapon.tag);
    const standard = rounds.filter((round) => !round.isSpecialAmmo && getCompatibleAmmo(weapon, round));
    const own = standard.filter((round) => (clan ? !/^ammo-is-/.test(round.tag) : !/^ammo-clan-/.test(round.tag)));
    const pool = own.length > 0 ? own : standard;
    return pool.find((round) => round.tag.endsWith("-standard")) ?? pool[0];
};

const needsAmmunition = (weapon: IEquipmentItem): boolean => !weapon.isOneShot && ((weapon.shotsPerTon ?? 0) > 0 || (weapon.ammoTypes?.length ?? 0) > 0);

const roundUpToHalfTon = (tons: number): number => Math.ceil(tons * 2 - 1e-9) / 2;

/**
 * Works a handheld weapon out under `edition`'s rules: its weight, heat sinks, cost and Battle Value, and everything wrong with
 * the design. `techTag` is the carrying 'Mech's tech option ("is", "clan", "mis", "mclan"), which picks a Clan item's own BV.
 */
export const analyseHandheld = (design: IHandheldDesign, edition: string, techTag: string): IHandheldAnalysis => {
    const rules = getHandheldRules(edition);
    const result: IHandheldAnalysis = { rules, lines: [], heatSinks: 0, weaponTons: 0, ammoTons: 0, heatSinkTons: 0, armorTons: 0, weight: 0, partsBattleValue: 0, battleValue: 0, cost: 0, itemCount: 0, issues: [] };
    if (!rules) {
        result.issues.push("This edition has no handheld weapon rules.");
        return result;
    }
    const bv1 = getBattleValueFor<boolean>(edition, "mech", { bv1: () => true, bv2: () => false });
    let physicalEntries = 0;
    let otherEntries = 0;
    for (const entry of design.entries) {
        const count = Math.max(1, Math.floor(entry.count ?? 1));
        const item = findHandheldItem(entry.tag);
        if (!item) {
            result.issues.push(`${entry.tag}: no such weapon in the catalog.`);
            continue;
        }
        const issue = getHandheldIssue(item, edition);
        if (issue) {
            result.issues.push(issue);
            continue;
        }
        if (isPhysical(item)) physicalEntries += count; else otherEntries += count;
        result.itemCount += count;
        const weaponBV = bv1 ? rateBattleValue1(edition, techTag, false, item).value : getCatalogBattleValue(item, techTag);
        const weaponTons = (item.weight || 0) * count;
        result.weaponTons += weaponTons;
        result.partsBattleValue += weaponBV * count;
        result.cost += (item.cbills || 0) * count;
        result.lines.push({ label: count > 1 ? `${count} x ${item.name}` : item.name, tons: weaponTons, cost: (item.cbills || 0) * count, battleValue: weaponBV * count });
        // Heat sinks: one standard sink for each point of the heat the weapon can make (every weapon under Maximum Tech, energy weapons under TO:AUE).
        const heatWeapon = rules.heatSinksFor === "all" || item.category === "Energy Weapons";
        if (heatWeapon && item.heat > 0) result.heatSinks += item.heat * count;
        if (needsAmmunition(item)) {
            const ammo = findHandheldAmmo(item, entry.ammoTag);
            const shots = Math.max(0, Math.floor(entry.shots ?? 0));
            if (!ammo) {
                result.issues.push(`${item.name}: no ammunition on record for it.`);
            } else if (shots <= 0) {
                result.issues.push(`${item.name} needs ammunition in the handheld weapon (shots on its own supply, ${rules.constructionSource}).`);
            } else {
                const shotsPerTon = getWeaponShotsPerTon(item, ammo) || 1;
                const tons = shots * count / shotsPerTon;
                const perTon = bv1 ? rateBattleValue1(edition, techTag, false, ammo, item).value : getAmmoBattleValuePerTon(item, ammo);
                result.ammoTons += tons;
                result.partsBattleValue += perTon * tons;
                result.cost += (ammo.cbills || 0) * tons;
                result.lines.push({ label: `${shots * count} shots of ${ammo.name}`, tons, cost: (ammo.cbills || 0) * tons, battleValue: perTon * tons });
            }
        }
    }
    if (result.itemCount === 0 && result.issues.length === 0) result.issues.push("A handheld weapon needs at least one weapon.");
    if (physicalEntries > 0 && (otherEntries > 0 || physicalEntries > 1)) {
        result.issues.push("A single 'Mech physical weapon may be installed instead of other items, not with them (TO:AUE p.126).");
    }
    if (rules.itemLimit !== null && result.itemCount > rules.itemLimit) {
        result.issues.push(`A handheld weapon holds up to six items; ammunition and heat sinks do not count (${rules.constructionSource}).`);
    }
    const armor = Math.max(0, Math.floor(design.armor || 0));
    result.armorTons = Math.ceil(armor / rules.armorPointsPerHalfTon) / 2;
    result.heatSinkTons = result.heatSinks;
    result.cost += result.heatSinks * HEAT_SINK_COST + result.armorTons * STANDARD_ARMOR_COST_PER_TON;
    result.cost *= rules.costMultiplier;
    result.weight = roundUpToHalfTon(result.weaponTons + result.ammoTons + result.heatSinkTons + result.armorTons);
    result.battleValue = Math.round(result.partsBattleValue + armor * 2);
    if (result.heatSinks > 0) result.lines.push({ label: `${result.heatSinks} heat sinks`, tons: result.heatSinks, cost: result.heatSinks * HEAT_SINK_COST, battleValue: 0 });
    if (armor > 0) result.lines.push({ label: `${armor} armor points`, tons: result.armorTons, cost: result.armorTons * STANDARD_ARMOR_COST_PER_TON, battleValue: armor * 2 });
    return result;
};
