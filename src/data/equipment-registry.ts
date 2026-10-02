import { IEquipmentItem } from "./data-interfaces";
import { matchesTag } from "./tag-match";
import { mechISEquipmentBallistic } from "./mech-is-equipment-weapons-ballistic";
import { mechISEquipmentEnergy } from "./mech-is-equipment-weapons-energy";
import { mechISEquipmentMisc } from "./mech-is-equipment-weapons-misc";
import { mechISEquipmentMissiles } from "./mech-is-equipment-weapons-missiles";
import { mechISEquipmentArtillery } from "./mech-is-equipment-weapons-artillery";
import { mechClanEquipmentBallistic } from "./mech-clan-equipment-weapons-ballistic";
import { mechClanEquipmentEnergy } from "./mech-clan-equipment-weapons-energy";
import { mechClanEquipmentMisc } from "./mech-clan-equipment-weapons-misc";
import { mechClanEquipmentMissile } from "./mech-clan-equipment-weapons-missile";
import { mechClanEquipmentArtillery } from "./mech-clan-equipment-weapons-artillery";
import { mechCustomEquipmentBallistic } from "./mech-custom-equipment-weapons-ballistic";
import { mechCustomEquipmentEnergy } from "./mech-custom-equipment-weapons-energy";
import { mechCustomEquipmentMisc } from "./mech-custom-equipment-weapons-misc";
import { mechCustomEquipmentMissile } from "./mech-custom-equipment-weapons-missile";
import { mechCustomAmmo } from "./mech-custom-ammo";
import { mechISAmmo } from "./mech-is-ammo";
import { mechClanAmmo } from "./mech-clan-ammo";
import { mechUniversalAmmo } from "./mech-universal-ammo";
import { isUniversalEquipment, mechUniversalEquipment } from "./mech-universal-equipment";

export type EquipmentCatalog = "is" | "clan" | "custom" | "universal";

export interface IEquipmentCatalogDefinition {
    id: string;
    exportName: string;
    techBase: EquipmentCatalog;
    category: "ballistic" | "energy" | "missile" | "misc" | "artillery" | "ammunition";
    equipment: IEquipmentItem[];
}

export interface IEquipmentCatalogSummary {
    catalogId: string;
    techBase: EquipmentCatalog;
    category: IEquipmentCatalogDefinition["category"];
    itemCount: number;
    ammoCount: number;
    weaponCount: number;
    duplicateTags: string[];
    missingSourceCount: number;
    /** Records whose book is known but whose page has not been verified (page: null). */
    unverifiedPageCount: number;
}

const equipmentCatalogDefinitions: IEquipmentCatalogDefinition[] = [
    { id: "mech-is-equipment-weapons-ballistic", exportName: "mechISEquipmentBallistic", techBase: "is", category: "ballistic", equipment: mechISEquipmentBallistic },
    { id: "mech-is-equipment-weapons-energy", exportName: "mechISEquipmentEnergy", techBase: "is", category: "energy", equipment: mechISEquipmentEnergy },
    { id: "mech-is-equipment-weapons-missiles", exportName: "mechISEquipmentMissiles", techBase: "is", category: "missile", equipment: mechISEquipmentMissiles },
    { id: "mech-is-equipment-weapons-misc", exportName: "mechISEquipmentMisc", techBase: "is", category: "misc", equipment: mechISEquipmentMisc },
    { id: "mech-is-equipment-weapons-artillery", exportName: "mechISEquipmentArtillery", techBase: "is", category: "artillery", equipment: mechISEquipmentArtillery },
    { id: "mech-is-ammo", exportName: "mechISAmmo", techBase: "is", category: "ammunition", equipment: mechISAmmo },
    { id: "mech-clan-equipment-weapons-ballistic", exportName: "mechClanEquipmentBallistic", techBase: "clan", category: "ballistic", equipment: mechClanEquipmentBallistic },
    { id: "mech-clan-equipment-weapons-energy", exportName: "mechClanEquipmentEnergy", techBase: "clan", category: "energy", equipment: mechClanEquipmentEnergy },
    { id: "mech-clan-equipment-weapons-missile", exportName: "mechClanEquipmentMissile", techBase: "clan", category: "missile", equipment: mechClanEquipmentMissile },
    { id: "mech-clan-equipment-weapons-misc", exportName: "mechClanEquipmentMisc", techBase: "clan", category: "misc", equipment: mechClanEquipmentMisc },
    { id: "mech-clan-equipment-weapons-artillery", exportName: "mechClanEquipmentArtillery", techBase: "clan", category: "artillery", equipment: mechClanEquipmentArtillery },
    { id: "mech-clan-ammo", exportName: "mechClanAmmo", techBase: "clan", category: "ammunition", equipment: mechClanAmmo },
    { id: "mech-custom-equipment-weapons-ballistic", exportName: "mechCustomEquipmentBallistic", techBase: "custom", category: "ballistic", equipment: mechCustomEquipmentBallistic },
    { id: "mech-custom-equipment-weapons-energy", exportName: "mechCustomEquipmentEnergy", techBase: "custom", category: "energy", equipment: mechCustomEquipmentEnergy },
    { id: "mech-custom-equipment-weapons-missile", exportName: "mechCustomEquipmentMissile", techBase: "custom", category: "missile", equipment: mechCustomEquipmentMissile },
    { id: "mech-custom-equipment-weapons-misc", exportName: "mechCustomEquipmentMisc", techBase: "custom", category: "misc", equipment: mechCustomEquipmentMisc },
    { id: "mech-custom-ammo", exportName: "mechCustomAmmo", techBase: "custom", category: "ammunition", equipment: mechCustomAmmo },
    { id: "mech-universal-equipment", exportName: "mechUniversalEquipment", techBase: "universal", category: "artillery", equipment: mechUniversalEquipment },
    { id: "mech-universal-ammo", exportName: "mechUniversalAmmo", techBase: "universal", category: "ammunition", equipment: mechUniversalAmmo },
];

function cloneEquipment(items: IEquipmentItem[]): IEquipmentItem[] {
    return JSON.parse(JSON.stringify(items)) as IEquipmentItem[];
}

function getCatalogByTech(techBase: EquipmentCatalog): IEquipmentItem[] {
    return equipmentCatalogDefinitions
        .filter((catalog) => catalog.techBase === techBase)
        .flatMap((catalog) => catalog.equipment)
        .filter((item) => techBase === "universal" || !isUniversalEquipment(item));
}

export function getEquipmentCatalogDefinitions(): IEquipmentCatalogDefinition[] {
    return equipmentCatalogDefinitions.map((catalog) => ({ ...catalog }));
}

export function getEquipmentCatalogById(catalogId: string): IEquipmentItem[] | null {
    const catalog = equipmentCatalogDefinitions.find((definition) => definition.id === catalogId);
    return catalog ? cloneEquipment(catalog.equipment) : null;
}

export function getEquipmentCatalogExportName(catalogId: string): string | null {
    return equipmentCatalogDefinitions.find((catalog) => catalog.id === catalogId)?.exportName ?? null;
}

export function equipmentMatchesIdentifier(item: IEquipmentItem, identifier: string): boolean {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const identifiers = [
        item.tag,
        item.name,
        item.alternateName ?? "",
        ...(item.altNames ?? []),
        ...(item.altTags ?? []),
    ];

    return identifiers.some(value => value.trim().toLowerCase() === normalizedIdentifier);
}

export function getAlphaStrikeEquipmentAbilityCodes(item: IEquipmentItem): string[] {
    return item.alphaStrike.specialAbility && item.alphaStrike.specialAbility.length > 0
        ? item.alphaStrike.specialAbility
        : item.weaponType ?? [];
}

export function getAlphaStrikeEquipmentDisplayAbilityCodes(item: IEquipmentItem): string[] {
    const damageAoE = item.alphaStrike.damageAoE;
    return getAlphaStrikeEquipmentAbilityCodes(item).map(abilityCode =>
        damageAoE && damageAoE > 0 ? `${abilityCode} ${damageAoE}` : abilityCode
    );
}

export function getEquipmentMaximumRangeInHexes(item: IEquipmentItem): number {
    return (item.range.maxMapSheets ?? 0) * 17;
}

/**
 * Fallback only: rounds in a ton divided by the launcher's tubes, rounded up.
 * Published shots-per-ton values (weapon `shotsPerTon`/`shotsPerTonByAmmo`)
 * always win, because canon deviates from this formula (SRM 6 = 15, not 17).
 */
export function calculateShotsPerTon(totalRoundsPerTon: number, launcherSize: number): number {
    if (!Number.isFinite(totalRoundsPerTon) || !Number.isFinite(launcherSize) || totalRoundsPerTon <= 0 || launcherSize <= 0) {
        return 0;
    }

    return Math.ceil(totalRoundsPerTon / launcherSize);
}

/** Rules level at which experimental prototypes may be used (Experimental and Custom Homebrew). */
export const EXPERIMENTAL_RULES_LEVEL = 4;

/** Custom Homebrew rules level: the only level at which fan-made rules are enabled. */
export const CUSTOM_HOMEBREW_RULES_LEVEL = 5;

/**
 * 'Mech equipment an OmniMech must build into its base chassis: it can never be pod-mounted.
 * Via MegaMek's `omniFixedOnly` flags (TM/TO:AUE/IO:AE pages cited there; provisional).
 * HarJel I stays pod-mountable; HarJel II and III "may not be pod-mounted" (IO:AE p.83).
 */
export const OMNI_FIXED_ONLY_TAGS: readonly string[] = [
    "masc", "clan-masc",
    "partial-wing", "clan-partial-wing",
    "aes-arm", "aes-leg", "clan-aes-arm", "clan-aes-leg",
    "null-signature-system", "custom-null-signature-system", "void-signature-system", "chameleon-lps",
    "blue-shield",
    "risc-emergency-coolant-system",
    "tracks",
    "environmental-sealing",
    "clan-harjel-ii", "clan-harjel-iii",
];

let artemisIVLaunchers: Set<string> | null = null;

/**
 * Is this a launcher Artemis IV applies to, i.e. one that also exists with Artemis IV fitted?
 * "every single standard LRM, SRM and MML launcher on the unit must have Artemis IV" once one does (TM p.207).
 */
export function isArtemisIVCapableLauncher(tag: string): boolean {
    if (!artemisIVLaunchers) {
        const suffix = "-artemis-iv";
        artemisIVLaunchers = new Set(equipmentCatalogDefinitions.flatMap(definition => definition.equipment)
            .filter(item => item.tag.endsWith(suffix))
            .map(item => item.tag.slice(0, -suffix.length)));
    }
    return artemisIVLaunchers.has(tag);
}

export function isOmniFixedOnly(item: IEquipmentItem): boolean {
    return OMNI_FIXED_ONLY_TAGS.some((tag) => matchesTag(item, tag));
}

/**
 * Lowest rules level an installed item needs: Custom Homebrew for custom content,
 * Experimental for prototype-only items, otherwise its own rules level (0 when unknown).
 */
export function getEquipmentRulesLevel(item: IEquipmentItem): number {
    let level = typeof item.rulesLevel === "number" ? item.rulesLevel : 0;
    if (item.catalog === "custom" || item.category === "Custom Equipment" || item.book === "Custom") {
        level = Math.max(level, CUSTOM_HOMEBREW_RULES_LEVEL);
    }
    if (item.introduced === null && item.prototype) {
        level = Math.max(level, EXPERIMENTAL_RULES_LEVEL);
    }
    return level;
}

/**
 * Year an item becomes usable in construction: its production year, or its
 * IO prototype year when the rules level allows experimental technology.
 */
export function getEffectiveIntroduction(item: Pick<IEquipmentItem, "prototype" | "introduced">, rulesLevel: number): number | null {
    if (rulesLevel >= EXPERIMENTAL_RULES_LEVEL && item.prototype && (!item.introduced || item.prototype < item.introduced)) {
        return item.prototype;
    }
    return item.introduced;
}

export function getAmmoRoundsPerTon(ammo: IEquipmentItem): number {
    return ammo.roundsPerTon ?? ammo.ammoPerTon ?? 0;
}

function stripAmmoFaction(tag: string): string {
    return tag.toLowerCase().replace(/^ammo-(is|clan)-/, "ammo-");
}

function getAllAmmo(): IEquipmentItem[] {
    return equipmentCatalogDefinitions
        .filter(catalog => catalog.category === "ammunition")
        .flatMap(catalog => catalog.equipment);
}

function getCustomAmmo(): IEquipmentItem[] {
    return equipmentCatalogDefinitions
        .filter(catalog => catalog.category === "ammunition" && catalog.techBase === "custom")
        .flatMap(catalog => catalog.equipment);
}

let standardAmmoBases: { base: string; tag: string }[] | null = null;

function getStandardAmmoBases(): { base: string; tag: string }[] {
    if (!standardAmmoBases) {
        standardAmmoBases = getAllAmmo()
            .filter(ammo => !ammo.isSpecialAmmo && ammo.tag.endsWith("-standard"))
            .map(ammo => ({ base: stripAmmoFaction(ammo.tag).replace(/-standard$/, ""), tag: stripAmmoFaction(ammo.tag) }))
            .sort((a, b) => b.base.length - a.base.length);
    }
    return standardAmmoBases;
}

/**
 * The ammunition family an ammo record belongs to, expressed as the
 * faction-neutral tag of that family's standard round. Special munitions join
 * the family whose standard tag is their longest prefix
 * (ammo-is-lrm-swarm -> ammo-lrm-standard). Unmatched special ammo is its own family.
 */
export function getAmmoFamily(ammo: IEquipmentItem): string {
    const tag = stripAmmoFaction(ammo.tag);
    if (!ammo.isSpecialAmmo && tag.endsWith("-standard")) {
        return tag;
    }
    return getStandardAmmoBases().find(({ base }) => tag.startsWith(base + "-"))?.tag ?? tag;
}

/**
 * Ammo families a weapon can fire: those named by its explicit `ammoTypes`,
 * plus any family containing a record tagged `ammo-<weapon tag>` (the
 * historical per-weapon ammo tags kept in `altTags`).
 */
export function getWeaponAmmoFamilies(weapon: IEquipmentItem): string[] {
    const families = new Set<string>();
    const weaponIdentifiers = [weapon.tag, ...(weapon.altTags ?? [])].map(tag => `ammo-${tag}`);
    // One-shot launchers carry their single volley and take no canon ammunition bins;
    // only custom homebrew reload rules (custom catalog ammo) may feed them.
    const ammoPool = weapon.isOneShot ? getCustomAmmo() : getAllAmmo();
    for (const ammo of ammoPool) {
        const explicit = (weapon.ammoTypes ?? []).some(ammoType => equipmentMatchesIdentifier(ammo, ammoType));
        const conventional = weaponIdentifiers.some(identifier => [ammo.tag, ...(ammo.altTags ?? [])]
            .some(tag => tag.toLowerCase() === identifier.toLowerCase()));
        if (explicit || conventional) {
            families.add(getAmmoFamily(ammo));
        }
    }
    return Array.from(families);
}

export function getCompatibleAmmo(weapon: IEquipmentItem, ammo: IEquipmentItem): boolean {
    if (!ammo.isAmmo || weapon.isAmmo) {
        return false;
    }

    return getWeaponAmmoFamilies(weapon).includes(getAmmoFamily(ammo));
}

/**
 * How many times `weapon` can fire from one ton of `ammo`. Published values
 * win: a per-family override (dual-mode launchers such as the MML), then the
 * weapon's `shotsPerTon`. Only when neither exists is the count derived from
 * the ammo's rounds per ton and the launcher's tubes.
 */
let standardRoundsByFamily: Map<string, number> | null = null;

/** Rounds per ton of a family's standard round (cached: shot counts are read on every render). */
function getStandardRoundsPerTon(family: string): number {
    if (!standardRoundsByFamily) {
        standardRoundsByFamily = new Map();
        for (const ammo of getAllAmmo()) {
            if (!ammo.isSpecialAmmo && ammo.tag.endsWith("-standard")) {
                const key = stripAmmoFaction(ammo.tag);
                if (!standardRoundsByFamily.has(key)) standardRoundsByFamily.set(key, getAmmoRoundsPerTon(ammo));
            }
        }
    }
    return standardRoundsByFamily.get(family) ?? 0;
}

export function getWeaponShotsPerTon(weapon: IEquipmentItem, ammo?: IEquipmentItem): number {
    if (ammo && weapon.shotsPerTonByAmmo) {
        const family = getAmmoFamily(ammo);
        const override = Object.entries(weapon.shotsPerTonByAmmo)
            .find(([ammoTag]) => stripAmmoFaction(ammoTag) === family || equipmentMatchesIdentifier(ammo, ammoTag));
        if (override) {
            return override[1];
        }
    }

    const published = weapon.shotsPerTon ?? (weapon.isAmmo ? undefined : weapon.ammoPerTon);
    if (published && published > 0) {
        // Munitions packing fewer rounds per ton than the family's standard round (e.g. Thunder-Augmented,
        // 60 LRM missiles per ton against 120) give proportionally fewer shots.
        const standardRounds = ammo ? getStandardRoundsPerTon(getAmmoFamily(ammo)) : 0;
        const ammoRounds = ammo ? getAmmoRoundsPerTon(ammo) : 0;
        if (standardRounds > 0 && ammoRounds > 0 && ammoRounds !== standardRounds) {
            return Math.max(1, Math.floor(published * ammoRounds / standardRounds));
        }
        return published;
    }

    if (ammo) {
        // Only missile launchers spend more than one round per shot.
        const isLauncher = weapon.category.toLowerCase().includes("missile");
        const tubes = weapon.ammoPerShot ?? (isLauncher ? weapon.damageClusters : undefined) ?? 1;
        return calculateShotsPerTon(getAmmoRoundsPerTon(ammo), tubes);
    }

    return 0;
}

/**
 * BV of one ton of ammunition loaded for a weapon: the launcher's standard ammo BV
 * times the munition's multiplier, or the ammo record's own BV when the weapon
 * lists none.
 */
export function getAmmoBattleValuePerTon(weapon: IEquipmentItem | null, ammo: IEquipmentItem): number {
    if (weapon && ammo.minefieldBattleValue) {
        // Minefield munitions (TO:AUE pp.185, 197-198): value from rack size R and shots per ton S.
        const isArrowIV = /arrow-iv/.test(weapon.tag);
        const clanArrowIV = weapon.catalog === "clan" || weapon.tag.startsWith("clan") || weapon.name.includes("(Clan");
        const rack = isArrowIV ? (clanArrowIV ? 30 : 20) : (weapon.damageClusters ?? 0);
        const shots = getWeaponShotsPerTon(weapon, ammo);
        switch (ammo.minefieldBattleValue) {
            case "thunder":
            case "fascam":
                return rack * shots / 5 * 4;
            case "thunder-augmented":
                return Math.ceil(rack / 2) * 7 * shots / 5 * 4;
            case "thunder-inferno":
            case "thunder-vibrabomb":
                return rack * shots;
            case "thunder-active":
                return rack * shots / 5 * 6;
        }
    }
    if (weapon && ammo.battleValueByLauncher) {
        // Published per launcher (e.g. Dead-Fire, IO:AE p.190).
        const launcher = /(mml|lrm|srm)-(\d+)/.exec(weapon.tag);
        const published = launcher ? ammo.battleValueByLauncher[`${launcher[1]}-${launcher[2]}`] : undefined;
        if (published !== undefined) {
            return published;
        }
    }
    if (weapon && weapon.ammoBattleValue !== undefined) {
        return weapon.ammoBattleValue * (ammo.battleValueMultiplier ?? 1);
    }
    return ammo.battleValue || 0;
}

export function getEquipmentCatalogSummaries(): IEquipmentCatalogSummary[] {
    return equipmentCatalogDefinitions.map((definition) => {
        const tagCounts = new Map<string, number>();
        for (const item of definition.equipment) {
            tagCounts.set(item.tag, (tagCounts.get(item.tag) ?? 0) + 1);
        }

        return {
            catalogId: definition.id,
            techBase: definition.techBase,
            category: definition.category,
            itemCount: definition.equipment.length,
            ammoCount: definition.equipment.filter(item => item.isAmmo).length,
            weaponCount: definition.equipment.filter(item => !item.isAmmo && !item.isEquipment).length,
            duplicateTags: Array.from(tagCounts.entries())
                .filter(([, count]) => count > 1)
                .map(([tag]) => tag),
            missingSourceCount: definition.equipment.filter(item => !item.book || (item.page !== null && item.page < 0)).length,
            unverifiedPageCount: definition.equipment.filter(item => item.page === null).length
        };
    });
}

export function getEquipmentCatalogs(): Record<string, IEquipmentItem[]> {
    return {
        is: getEquipmentListByTech("is"),
        clan: getEquipmentListByTech("clan"),
        mis: getEquipmentListByTech("mis"),
        mclan: getEquipmentListByTech("mclan"),
        universal: cloneEquipment(getCatalogByTech("universal")),
    };
}

export function getEquipmentListByTech(techTag: string, includeCustom: boolean = false): IEquipmentItem[] {
    const normalizedTech = techTag.toLowerCase();
    const universalEquipment = getCatalogByTech("universal");
    const customEquipment = includeCustom ? getCatalogByTech("custom") : [];

    switch (normalizedTech) {
        case "clan":
            return cloneEquipment([...getCatalogByTech("clan"), ...customEquipment, ...universalEquipment]);
        case "mis":
            return cloneEquipment([...getCatalogByTech("is"), ...getCatalogByTech("clan"), ...customEquipment, ...universalEquipment]);
        case "mclan":
            return cloneEquipment([...getCatalogByTech("clan"), ...getCatalogByTech("is"), ...customEquipment, ...universalEquipment]);
        case "custom":
            return cloneEquipment([...getCatalogByTech("custom"), ...universalEquipment]);
        case "is":
        default:
            return cloneEquipment([...getCatalogByTech("is"), ...customEquipment, ...universalEquipment]);
    }
}

export function getEquipmentListForChassis(techTag: string, includeCustom: boolean = false): IEquipmentItem[] {
    const normalizedTech = techTag.toLowerCase();
    const techCatalogs: EquipmentCatalog[] = normalizedTech === "clan"
        ? ["clan"]
        : normalizedTech === "mis"
            ? ["is", "clan"]
            : normalizedTech === "mclan"
                ? ["clan", "is"]
                : ["is"];
    const specific = techCatalogs.flatMap(getCatalogByTech);
    const custom = includeCustom ? getCatalogByTech("custom") : [];

    return cloneEquipment([...specific, ...custom, ...getCatalogByTech("universal")]);
}