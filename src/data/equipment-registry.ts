import { CatalogTechBase, IEquipmentItem, ITechDates } from "./data-interfaces";
import { matchesTag } from "./tag-match";
import { isAlphaStrikeAbilityCode } from "./alpha-strike-special-abilities";
import { equipmentBallistic } from "./equipment-ballistic";
import { equipmentEnergy } from "./equipment-energy";
import { equipmentMisc } from "./equipment-misc";
import { equipmentMissile } from "./equipment-missile";
import { equipmentArtillery } from "./equipment-artillery";
import { ballisticCustom } from "./ballistic-custom";
import { energyCustom } from "./energy-custom";
import { miscCustom } from "./misc-custom";
import { missileCustom } from "./missile-custom";
import { ammoCustom } from "./ammo-custom";
import { artilleryCustom } from "./artillery-custom";
import { ammoApocryphal, artilleryApocryphal } from "./hailstorm-apocryphal";
import { ammoCatalog } from "./ammo";
import { isUniversalEquipment } from "./universal-equipment";
import { APOCRYPHAL_RULES_LEVEL, CUSTOM_HOMEBREW_RULES_LEVEL, EXPERIMENTAL_RULES_LEVEL, MUNCHKIN_RULES_LEVEL, STANDARD_RULES_LEVEL } from "./rules-level-options";
import { getBattleArmorScaleEquipment } from "./battle-armor-scale-equipment";
import { getRecordOfferIssue } from "./rules-editions";

export type EquipmentCatalog = "is" | "clan" | "custom" | "universal";

export interface IEquipmentCatalogDefinition {
    id: string;
    exportName: string;
    /** A Custom Homebrew or Munchkin catalog. Official catalogs leave it out; their records say their own tech base. */
    custom?: true;
    category: "ballistic" | "energy" | "missile" | "misc" | "artillery" | "ammunition";
    equipment: IEquipmentItem[];
}

export interface IEquipmentCatalogSummary {
    catalogId: string;
    /** The tiers its records belong to (see getEquipmentTier). */
    techBases: EquipmentCatalog[];
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
    { id: "equipment-ballistic", exportName: "equipmentBallistic", category: "ballistic", equipment: equipmentBallistic },
    { id: "equipment-energy", exportName: "equipmentEnergy", category: "energy", equipment: equipmentEnergy },
    { id: "equipment-missile", exportName: "equipmentMissile", category: "missile", equipment: equipmentMissile },
    { id: "equipment-misc", exportName: "equipmentMisc", category: "misc", equipment: equipmentMisc },
    { id: "equipment-artillery", exportName: "equipmentArtillery", category: "artillery", equipment: equipmentArtillery },
    { id: "ammo", exportName: "ammoCatalog", category: "ammunition", equipment: ammoCatalog },
    { id: "artillery-apocryphal", exportName: "artilleryApocryphal", category: "artillery", equipment: artilleryApocryphal },
    { id: "ammo-apocryphal", exportName: "ammoApocryphal", category: "ammunition", equipment: ammoApocryphal },
    { id: "ballistic-custom", exportName: "ballisticCustom", custom: true, category: "ballistic", equipment: ballisticCustom },
    { id: "energy-custom", exportName: "energyCustom", custom: true, category: "energy", equipment: energyCustom },
    { id: "missile-custom", exportName: "missileCustom", custom: true, category: "missile", equipment: missileCustom },
    { id: "misc-custom", exportName: "miscCustom", custom: true, category: "misc", equipment: miscCustom },
    { id: "artillery-custom", exportName: "artilleryCustom", custom: true, category: "artillery", equipment: artilleryCustom },
    { id: "ammo-custom", exportName: "ammoCustom", custom: true, category: "ammunition", equipment: ammoCustom },
];

function cloneEquipment(items: IEquipmentItem[]): IEquipmentItem[] {
    return JSON.parse(JSON.stringify(items)) as IEquipmentItem[];
}

// Custom drafts made in this browser (see custom-content-local.ts). They join the custom tier at runtime and
// never appear in the catalog definitions, summaries or exports.
let localCustomEquipment: IEquipmentItem[] = [];
// Goes up whenever the catalogs change at runtime, so caches built from them (equipment-lookup.ts) know to rebuild.
let catalogVersion = 0;

export function getEquipmentCatalogVersion(): number {
    return catalogVersion;
}

export function setLocalCustomEquipment(items: IEquipmentItem[]): void {
    localCustomEquipment = items.map((item) => ({ ...item, catalog: "custom" }));
    catalogVersion++;
    standardAmmoBases = null;
    standardRoundsByFamily = null;
    weaponAmmoFamilies = new Map();
}

export function getLocalCustomEquipment(): IEquipmentItem[] {
    return localCustomEquipment;
}

/** The tier a catalog record belongs to: "custom" for the custom catalogs, otherwise the record's own tech base. */
export function getEquipmentTier(definition: Pick<IEquipmentCatalogDefinition, "custom">, item: IEquipmentItem): EquipmentCatalog {
    return definition.custom ? "custom" : item.techBase ?? "is";
}

function getCatalogByTech(techBase: EquipmentCatalog): IEquipmentItem[] {
    const items = equipmentCatalogDefinitions
        .flatMap((catalog) => catalog.equipment.filter((item) => getEquipmentTier(catalog, item) === techBase))
        .filter((item) => techBase === "universal" || !isUniversalEquipment(item));
    return techBase === "custom" ? [...items, ...localCustomEquipment] : items;
}

/**
 * Battle armor weapons, and their ammunition, that a larger unit of this technology base may mount
 * (Ghosts of Obeedah pp.53-54). They are kept out of the catalog lists: a unit looks a tag up here only
 * after the catalogs, so no catalog record is ever reached through them.
 */
export function getBattleArmorScaleListByTech(techTag: string): IEquipmentItem[] {
    return cloneEquipment([...getBattleArmorScaleRecordsByTech(techTag)]);
}

/** The records getBattleArmorScaleListByTech copies, shared with the catalog: only for looking items up, never to change. */
export function getBattleArmorScaleRecordsByTech(techTag: string): readonly IEquipmentItem[] {
    switch (techTag.toLowerCase()) {
        case "clan":
            return getBattleArmorScaleEquipment("clan");
        case "mis":
            return [...getBattleArmorScaleEquipment("is"), ...getBattleArmorScaleEquipment("clan")];
        case "mclan":
            return [...getBattleArmorScaleEquipment("clan"), ...getBattleArmorScaleEquipment("is")];
        case "custom":
            return [];
        default:
            return getBattleArmorScaleEquipment("is");
    }
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

/**
 * An item's Alpha Strike special abilities: its own list, or else those of its TechManual weapon type codes that
 * are also Alpha Strike codes ("AMS", "ECM"). The others ("DE", "DB", "M", ...) are not special abilities.
 */
export function getAlphaStrikeEquipmentAbilityCodes(item: IEquipmentItem): string[] {
    return item.alphaStrike.specialAbility && item.alphaStrike.specialAbility.length > 0
        ? item.alphaStrike.specialAbility
        : (item.weaponType ?? []).filter(isAlphaStrikeAbilityCode);
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

export { APOCRYPHAL_RULES_LEVEL, CUSTOM_HOMEBREW_RULES_LEVEL, EXPERIMENTAL_RULES_LEVEL, MUNCHKIN_RULES_LEVEL, STANDARD_RULES_LEVEL };

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
    // BattleMech Turrets "may not be pod-mounted" (TO:AUE p.87).
    "mech-turret-shoulder", "mech-turret-head", "mech-turret-quad",
];

/** Artemis fire control, which the catalog holds as launcher records with a tag suffix: the suffix and its BV multiplier. */
export const ARTEMIS_FIRE_CONTROL = [
    // "Multiply the BV for all missile launchers enhanced by prototype Artemis IV by 1.1" (IO:AE p.183).
    { name: "Prototype Artemis IV", suffix: "-artemis-p", battleValueMultiplier: 1.1 },
    // "Increase by 20 percent the BV of any missile launcher equipped with Artemis IV" (TM p.303).
    { name: "Artemis IV", suffix: "-artemis-iv", battleValueMultiplier: 1.2 },
    // "Increase by 30 percent the BV of any missile launcher equipped with Artemis V" (TO:AUE p.197).
    { name: "Artemis V", suffix: "-artemis-v", battleValueMultiplier: 1.3 },
] as const;

const artemisLaunchers = new Map<string, Set<string>>();

/**
 * Is this a launcher the Artemis system applies to, i.e. one that also exists with it fitted? "Every single standard
 * LRM, SRM and MML launcher on the unit must have Artemis IV" once one does (TM p.207); Artemis V likewise for the
 * standard Clan SRM and LRM launchers and their torpedo equivalents (TO:AUE p.94).
 */
export function isArtemisCapableLauncher(tag: string, suffix: string = "-artemis-iv"): boolean {
    if (!artemisLaunchers.has(suffix)) {
        artemisLaunchers.set(suffix, new Set(equipmentCatalogDefinitions.flatMap(definition => definition.equipment)
            .filter(item => item.tag.endsWith(suffix))
            .map(item => item.tag.slice(0, -suffix.length))));
    }
    return artemisLaunchers.get(suffix)!.has(tag);
}

export const isArtemisIVCapableLauncher = (tag: string): boolean => isArtemisCapableLauncher(tag, "-artemis-iv");

/**
 * An item's Battle Value for a unit of the given tech option ("is", "clan", "mis", "mclan"): some items (Clan
 * artillery) list a separate Clan value (TO:AUE p.197).
 */
export function getItemBattleValue(item: IEquipmentItem, techTag?: string): number {
    const clan = item.builtTechBase ? item.builtTechBase === "clan" : techTag === "clan" || techTag === "mclan";
    return (clan && item.battleValueClan !== undefined ? item.battleValueClan : item.battleValue) || 0;
}

/** A launcher's Battle Value with its Artemis system: the plain launcher's raised by the system's multiplier. */
export function getArtemisLauncherBattleValue(item: IEquipmentItem, catalog: () => readonly IEquipmentItem[], techTag?: string): number {
    const system = ARTEMIS_FIRE_CONTROL.find(fireControl => item.tag.endsWith(fireControl.suffix));
    if (system) {
        const plain = catalog().find(candidate => candidate.tag === item.tag.slice(0, -system.suffix.length));
        if (plain && getItemBattleValue(plain, techTag) > 0) return getItemBattleValue(plain, techTag) * system.battleValueMultiplier;
    }
    return getItemBattleValue(item, techTag);
}

/** Fire control the catalog folds into launcher records: Artemis, and the MRM Apollo FCS (BV x1.15, TO:AUE p.197). */
const FIRE_CONTROL_SUFFIXES: readonly string[] = [...ARTEMIS_FIRE_CONTROL.map(system => system.suffix), "-apollo"];

/**
 * A launcher's Battle Value without its fire control: the plain launcher's. Fire control is a modifier, so it stays
 * out of the "unmodified BV" that decides whether forward- or rear-firing weapons count half (TM p.303).
 */
export function getLauncherBattleValueWithoutFireControl(item: IEquipmentItem, catalog: () => readonly IEquipmentItem[], techTag?: string): number {
    const suffix = FIRE_CONTROL_SUFFIXES.find(fireControl => item.tag.endsWith(fireControl));
    if (suffix) {
        const plain = catalog().find(candidate => candidate.tag === item.tag.slice(0, -suffix.length));
        if (plain) return getItemBattleValue(plain, techTag);
    }
    return getItemBattleValue(item, techTag);
}

export function isOmniFixedOnly(item: IEquipmentItem): boolean {
    return OMNI_FIXED_ONLY_TAGS.some((tag) => matchesTag(item, tag));
}

/**
 * Lowest rules level an installed item needs: at least Custom Homebrew for custom content (Munchkin when the
 * record says so), Experimental for prototype-only items, otherwise its own rules level (0 when unknown).
 */
/** One unit carries at most `maxPerUnit` of an item, or of its group (one RISC Viral Jammer of any type). */
export function isUnderUnitLimit(item: IEquipmentItem, installed: readonly (IEquipmentItem | null | undefined)[]): boolean {
    const limitKey = item.maxPerUnitGroup ?? item.tag;
    return !item.maxPerUnit || installed.filter((other) => (other?.maxPerUnitGroup ?? other?.tag) === limitKey).length < item.maxPerUnit;
}

/**
 * The rules level an item needs. Unset is Standard: only the technology of 3025 is Introductory (How the Core
 * Rulebooks Work p.2), and those records say `rulesLevel: 1`. 'Mech part records (armor, engine, gyro and so on)
 * are graded the same way.
 */
export function getEquipmentRulesLevel(item: Partial<Pick<IEquipmentItem, "rulesLevel" | "catalog" | "category" | "book" | "introduced" | "prototype">>): number {
    let level = typeof item.rulesLevel === "number" ? item.rulesLevel : STANDARD_RULES_LEVEL;
    if (item.catalog === "custom" || item.category === "Custom Equipment" || item.book === "Custom") {
        level = Math.max(level, CUSTOM_HOMEBREW_RULES_LEVEL);
    }
    if (item.introduced === null && item.prototype) {
        level = Math.max(level, EXPERIMENTAL_RULES_LEVEL);
    }
    return level;
}

/**
 * Why an item is not offered in `editionTag` at `rulesLevel`: "edition", "level", or null when it is offered. Custom
 * content belongs to no edition: it is offered in every one at its own level or higher. Other records follow
 * `getRecordOfferIssue`, with the canon level raised to the item's installed level (the Experimental floor).
 */
export function getEquipmentOfferIssue(item: IEquipmentItem, editionTag: string, rulesLevel: number): "edition" | "level" | null {
    const level = getEquipmentRulesLevel(item);
    if (level >= CUSTOM_HOMEBREW_RULES_LEVEL) {
        return level > rulesLevel ? "level" : null;
    }
    return getRecordOfferIssue({ ...item, rulesLevel: level }, editionTag, rulesLevel);
}

/** Is the item offered in `editionTag` at `rulesLevel`? */
export function isEquipmentOffered(item: IEquipmentItem, editionTag: string, rulesLevel: number): boolean {
    return getEquipmentOfferIssue(item, editionTag, rulesLevel) === null;
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

/**
 * Availability of a construction component in an era, shared by every unit class: in production, or
 * (at the Experimental rules level) as a prototype. `isAvailable(introduced, extinct, reintroduced)` is the
 * unit's own era-window check.
 */
export function getDatesAvailability(
    dates: ITechDates,
    rulesLevel: number,
    isAvailable: (introduced: number | null, extinct: number | null, reintroduced: number | null) => boolean,
): { available: boolean, asPrototype: boolean } {
    // A prototype year with no production year: IO prototype only (Experimental rules).
    const prototypeOnly = dates.introduced === null && !!dates.prototype;
    // Lost before it reached production (extinct earlier than the production year, e.g. the
    // Inner Sphere Large XL engine): the extinction and recovery bound the prototype phase,
    // and production simply starts at `introduced`.
    const lostAsPrototype = dates.introduced !== null && dates.extinct !== null && dates.extinct < dates.introduced;
    const inProduction = !prototypeOnly && (lostAsPrototype
        ? isAvailable(dates.introduced, null, null)
        : isAvailable(dates.introduced, dates.extinct, dates.reintroduced));
    const effectiveIntroduction = getEffectiveIntroduction(dates, rulesLevel);
    const asPrototype = !inProduction && effectiveIntroduction !== dates.introduced
        && isAvailable(effectiveIntroduction, dates.extinct, dates.reintroduced);
    return { available: inProduction || asPrototype, asPrototype };
}

/**
 * A tech progression year typed by a user or read from an import. Blank, zero or anything that is not a
 * positive year means unknown or none: null, which the availability checks read as "no such date"
 * (`introduced: null` with a `prototype` year marks a prototype-only item).
 */
export function parseTechYear(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
        return null;
    }
    const year = Number(value);
    return Number.isFinite(year) && year > 0 ? Math.round(year) : null;
}

/** Last year of the Star League era: the Exodus fleet left with what the SLDF fielded then. */
export const STAR_LEAGUE_END_YEAR = 2780;

/**
 * Clan designs keep the Star League (Inner Sphere) version of a component until their own Clan version
 * replaces it (project decision, 2026-09-30). The carried version keeps the Inner Sphere slots and armor
 * factor. Null when the item has no separate Clan dates or was not in Star League service.
 */
export function getStarLeagueCarryOverDates(item: ITechDates & { clanDates?: ITechDates }): ITechDates | null {
    if (!item.clanDates || !item.introduced || item.introduced > STAR_LEAGUE_END_YEAR
        || (item.extinct && item.extinct <= STAR_LEAGUE_END_YEAR)) {
        return null;
    }
    const clanProduction = item.clanDates.introduced;
    if (clanProduction && clanProduction <= item.introduced) {
        return null;
    }
    return { prototype: item.prototype, introduced: item.introduced, extinct: clanProduction ?? null, reintroduced: null };
}

/** Whether the era (by `isAvailable`) overlaps the years the Clans fielded the Star League version of a component. */
export function starLeagueVersionInEra(
    item: ITechDates & { clanDates?: ITechDates },
    isAvailable: (introduced: number | null, extinct: number | null, reintroduced: number | null) => boolean,
): boolean {
    const starLeague = getStarLeagueCarryOverDates(item);
    return !!starLeague && isAvailable(starLeague.prototype ?? starLeague.introduced, starLeague.extinct, null);
}

/** Whether a Clan design must field the Star League version: the era holds it and not yet the Clan version. */
export function mustUseStarLeagueVersion(
    item: ITechDates & { clanDates?: ITechDates },
    isAvailable: (introduced: number | null, extinct: number | null, reintroduced: number | null) => boolean,
): boolean {
    if (!item.clanDates || !starLeagueVersionInEra(item, isAvailable)) return false;
    return !(item.clanDates.introduced && isAvailable(item.clanDates.introduced, item.clanDates.extinct, item.clanDates.reintroduced));
}

/** A unit's tech tag from tech-options.ts: "is", "clan", or a mixed base ("mis", "mclan"). */
export type UnitTechBase = string;

/** Whether a record of `techBase` serves a unit of `unitTech`: universal records serve both, and mixed tech takes either. */
export function servesTechBase(techBase: CatalogTechBase | undefined, unitTech: UnitTechBase): boolean {
    return !techBase || techBase === "universal" || (unitTech !== "is" && unitTech !== "clan") || techBase === unitTech;
}

/** Primitive technology is what was introduced by 2500 (IO:AE p.116). */
export const PRIMITIVE_TECHNOLOGY_YEAR = 2500;
/** First introduced, as a prototype or in production, after 2500: it makes a Primitive unit RetroTech (IO:AE p.116). */
export const isPostPrimitiveTechnology = (item: { prototype?: number | null; introduced?: number | null }): boolean => {
    const years = [item.prototype, item.introduced].filter((year): year is number => typeof year === "number" && year > 0);
    return years.length > 0 && Math.min(...years) > PRIMITIVE_TECHNOLOGY_YEAR;
};

/**
 * Availability of a record for a unit of `unitTech` in an era: the Clan dates (`clanDates`, else the record's own)
 * for Clan units, with the Star League carry-over; the record's own dates for Inner Sphere units; for mixed tech,
 * whichever is in production, else whichever is a prototype.
 */
export function getTechDatesAvailability(
    item: ITechDates & { clanDates?: ITechDates },
    unitTech: UnitTechBase,
    rulesLevel: number,
    isAvailable: (introduced: number | null, extinct: number | null, reintroduced: number | null) => boolean,
): { available: boolean, asPrototype: boolean } {
    const innerSphere = getDatesAvailability(item, rulesLevel, isAvailable);
    const clan = getClanDatesAvailability(item, rulesLevel, isAvailable);
    if (unitTech === "clan") return clan;
    if (unitTech === "is") return innerSphere;
    if (innerSphere.available && !innerSphere.asPrototype) return innerSphere;
    if (clan.available && !clan.asPrototype) return clan;
    return innerSphere.available ? innerSphere : clan;
}

/** Clan availability, including the Star League version before the Clan version replaces it. */
function getClanDatesAvailability(
    item: ITechDates & { clanDates?: ITechDates },
    rulesLevel: number,
    isAvailable: (introduced: number | null, extinct: number | null, reintroduced: number | null) => boolean,
): { available: boolean, asPrototype: boolean } {
    const clan = getDatesAvailability(item.clanDates ?? item, rulesLevel, isAvailable);
    const starLeague = getStarLeagueCarryOverDates(item);
    if ((clan.available && !clan.asPrototype) || !starLeague) return clan;
    const carried = getDatesAvailability(starLeague, rulesLevel, isAvailable);
    return carried.available ? carried : clan;
}

export function getAmmoRoundsPerTon(ammo: IEquipmentItem): number {
    return ammo.roundsPerTon ?? ammo.ammoPerTon ?? 0;
}

function stripAmmoFaction(tag: string): string {
    return tag.toLowerCase().replace(/^ammo-(is|clan)-/, "ammo-");
}

// Both include the ammo drafts made in this browser, so an ammo draft can feed a weapon (draft or not).
function getAllAmmo(): IEquipmentItem[] {
    return [...equipmentCatalogDefinitions
        .filter(catalog => catalog.category === "ammunition")
        .flatMap(catalog => catalog.equipment), ...localCustomEquipment.filter(item => item.isAmmo)];
}

function getCustomAmmo(): IEquipmentItem[] {
    return [...equipmentCatalogDefinitions
        .filter(catalog => catalog.category === "ammunition" && catalog.custom)
        .flatMap(catalog => catalog.equipment), ...localCustomEquipment.filter(item => item.isAmmo)];
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
// Families by weapon (keyed on the fields read below): the scan covers every ammunition record, and BV, sheets and the
// catalog checks ask for the same weapons over and over.
let weaponAmmoFamilies = new Map<string, string[]>();

export function getWeaponAmmoFamilies(weapon: IEquipmentItem): string[] {
    const key = JSON.stringify([weapon.tag, weapon.altTags ?? [], weapon.ammoTypes ?? [], !!weapon.isOneShot]);
    const cached = weaponAmmoFamilies.get(key);
    if (cached) return cached;
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
    const result = Array.from(families);
    weaponAmmoFamilies.set(key, result);
    return result;
}

export function getCompatibleAmmo(weapon: IEquipmentItem, ammo: IEquipmentItem): boolean {
    if (!ammo.isAmmo || weapon.isAmmo) {
        return false;
    }
    // Battle armor scale ammunition feeds its own weapon and nothing else, and that weapon takes no other.
    if (ammo.battleArmorScale || weapon.battleArmorScale) {
        return !!ammo.battleArmorScale && !!weapon.battleArmorScale && matchesTag(weapon, ammo.feedsWeaponTag);
    }

    const family = getAmmoFamily(ammo);
    return getWeaponAmmoFamilies(weapon).includes(family)
        || (!!ammo.isSpecialAmmo && (weapon.munitionTypes ?? []).some(type => stripAmmoFaction(type) === family));
}

/**
 * How many times `weapon` can fire from one ton of `ammo`. Published values
 * win: a per-family override (dual-mode launchers such as the MML), then the
 * weapon's `shotsPerTon`. Only when neither exists is the count derived from
 * the ammo's rounds per ton and the launcher's tubes.
 */
let standardRoundsByFamily: Map<string, number> | null = null;

/** The faction an ammunition tag names ("ammo-clan-ams-standard" is Clan), "" for one both share. */
const ammoFaction = (tag: string): string => /^ammo-(is|clan)-/.exec(tag.toLowerCase())?.[1] ?? "";

/**
 * Rounds per ton of the standard round of an ammunition's family, its own faction's first (cached: shot counts are
 * read on every render). Clan AMS rounds pack 24 a ton against the Inner Sphere's 12 (TM pp.342-343).
 */
function getStandardRoundsPerTon(ammo: IEquipmentItem): number {
    if (!standardRoundsByFamily) {
        standardRoundsByFamily = new Map();
        for (const round of getAllAmmo()) {
            if (!round.isSpecialAmmo && round.tag.endsWith("-standard")) {
                for (const key of [`${ammoFaction(round.tag)}|${stripAmmoFaction(round.tag)}`, stripAmmoFaction(round.tag)]) {
                    if (!standardRoundsByFamily.has(key)) standardRoundsByFamily.set(key, getAmmoRoundsPerTon(round));
                }
            }
        }
    }
    const family = getAmmoFamily(ammo);
    return standardRoundsByFamily.get(`${ammoFaction(ammo.tag)}|${family}`) ?? standardRoundsByFamily.get(family) ?? 0;
}

export function getWeaponShotsPerTon(weapon: IEquipmentItem, ammo?: IEquipmentItem): number {
    // Battle armor scale ammunition: the mass carried divided by the weapon's weight per shot (Ghosts of Obeedah p.54).
    if (ammo?.battleArmorScale && ammo.kgPerShot && ammo.kgPerShot > 0) {
        return 1000 / ammo.kgPerShot;
    }
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
        const standardRounds = ammo ? getStandardRoundsPerTon(ammo) : 0;
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
        const rack = ammo.minefieldPoints ?? (isArrowIV ? (clanArrowIV ? 30 : 20) : (weapon.damageClusters ?? 0));
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
            techBases: Array.from(new Set(definition.equipment.map(item => getEquipmentTier(definition, item)))),
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
    return cloneEquipment([...getEquipmentRecordsByTech(techTag, includeCustom)]);
}

/**
 * The records getEquipmentListByTech copies, shared with the catalog: only for looking items up, never to change.
 * A unit copies a record when it mounts it, so its lookups use these and skip copying the whole catalog (#86).
 */
export function getEquipmentRecordsByTech(techTag: string, includeCustom: boolean = false): readonly IEquipmentItem[] {
    const normalizedTech = techTag.toLowerCase();
    const universalEquipment = getCatalogByTech("universal");
    const customEquipment = includeCustom ? getCatalogByTech("custom") : [];

    switch (normalizedTech) {
        case "clan":
            return [...getCatalogByTech("clan"), ...customEquipment, ...universalEquipment];
        case "mis":
            return [...getCatalogByTech("is"), ...getCatalogByTech("clan"), ...customEquipment, ...universalEquipment];
        case "mclan":
            return [...getCatalogByTech("clan"), ...getCatalogByTech("is"), ...customEquipment, ...universalEquipment];
        case "custom":
            return [...getCatalogByTech("custom"), ...universalEquipment];
        case "is":
        default:
            return [...getCatalogByTech("is"), ...customEquipment, ...universalEquipment];
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