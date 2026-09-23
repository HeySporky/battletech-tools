import { IEquipmentItem } from "./data-interfaces";
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

export function calculateShotsPerTon(totalRoundsPerTon: number, launcherSize: number): number {
    if (!Number.isFinite(totalRoundsPerTon) || !Number.isFinite(launcherSize) || launcherSize <= 0) {
        return 0;
    }

    return Math.floor(totalRoundsPerTon / launcherSize);
}

export function getCompatibleAmmo(weapon: IEquipmentItem, ammo: IEquipmentItem): boolean {
    if (!ammo.isAmmo || !weapon.ammoTypes || weapon.ammoTypes.length === 0) {
        return false;
    }

    return weapon.ammoTypes.some(ammoType => equipmentMatchesIdentifier(ammo, ammoType));
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
            missingSourceCount: definition.equipment.filter(item => !item.book || item.page < 0).length
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
            return cloneEquipment([...universalEquipment, ...getCatalogByTech("clan"), ...customEquipment]);
        case "mis":
            return cloneEquipment([...universalEquipment, ...getCatalogByTech("is"), ...getCatalogByTech("clan"), ...customEquipment]);
        case "mclan":
            return cloneEquipment([...universalEquipment, ...getCatalogByTech("clan"), ...getCatalogByTech("is"), ...customEquipment]);
        case "is":
        default:
            return cloneEquipment([...universalEquipment, ...getCatalogByTech("is"), ...customEquipment]);
    }
}