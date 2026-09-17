import { IEquipmentItem } from "./data-interfaces";
import { mechISEquipmentBallistic } from "./mech-is-equipment-weapons-ballistic";
import { mechISEquipmentEnergy } from "./mech-is-equipment-weapons-energy";
import { mechISEquipmentMisc } from "./mech-is-equipment-weapons-misc";
import { mechISEquipmentMissiles } from "./mech-is-equipment-weapons-missiles";
import { mechClanEquipmentBallistic } from "./mech-clan-equipment-weapons-ballistic";
import { mechClanEquipmentEnergy } from "./mech-clan-equipment-weapons-energy";
import { mechClanEquipmentMisc } from "./mech-clan-equipment-weapons-misc";
import { mechClanEquipmentMissile } from "./mech-clan-equipment-weapons-missile";

export interface IEquipmentCatalogDefinition {
    id: string;
    exportName: string;
    techBase: "is" | "clan";
    category: "ballistic" | "energy" | "missile" | "misc";
    equipment: IEquipmentItem[];
}

const equipmentCatalogDefinitions: IEquipmentCatalogDefinition[] = [
    { id: "mech-is-equipment-weapons-ballistic", exportName: "mechISEquipmentBallistic", techBase: "is", category: "ballistic", equipment: mechISEquipmentBallistic },
    { id: "mech-is-equipment-weapons-energy", exportName: "mechISEquipmentEnergy", techBase: "is", category: "energy", equipment: mechISEquipmentEnergy },
    { id: "mech-is-equipment-weapons-missiles", exportName: "mechISEquipmentMissiles", techBase: "is", category: "missile", equipment: mechISEquipmentMissiles },
    { id: "mech-is-equipment-weapons-misc", exportName: "mechISEquipmentMisc", techBase: "is", category: "misc", equipment: mechISEquipmentMisc },
    { id: "mech-clan-equipment-weapons-ballistic", exportName: "mechClanEquipmentBallistic", techBase: "clan", category: "ballistic", equipment: mechClanEquipmentBallistic },
    { id: "mech-clan-equipment-weapons-energy", exportName: "mechClanEquipmentEnergy", techBase: "clan", category: "energy", equipment: mechClanEquipmentEnergy },
    { id: "mech-clan-equipment-weapons-missile", exportName: "mechClanEquipmentMissile", techBase: "clan", category: "missile", equipment: mechClanEquipmentMissile },
    { id: "mech-clan-equipment-weapons-misc", exportName: "mechClanEquipmentMisc", techBase: "clan", category: "misc", equipment: mechClanEquipmentMisc },
];

function cloneEquipment(items: IEquipmentItem[]): IEquipmentItem[] {
    return JSON.parse(JSON.stringify(items)) as IEquipmentItem[];
}

function getCatalogByTech(techBase: "is" | "clan"): IEquipmentItem[] {
    return equipmentCatalogDefinitions
        .filter((catalog) => catalog.techBase === techBase)
        .flatMap((catalog) => catalog.equipment);
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

export function getEquipmentCatalogs(): Record<string, IEquipmentItem[]> {
    return {
        is: getEquipmentListByTech("is"),
        clan: getEquipmentListByTech("clan"),
        mis: getEquipmentListByTech("mis"),
        mclan: getEquipmentListByTech("mclan"),
    };
}

export function getEquipmentListByTech(techTag: string): IEquipmentItem[] {
    const normalizedTech = techTag.toLowerCase();

    switch (normalizedTech) {
        case "clan":
            return cloneEquipment(getCatalogByTech("clan"));
        case "mis":
            return cloneEquipment([...getCatalogByTech("is"), ...getCatalogByTech("clan")]);
        case "mclan":
            return cloneEquipment([...getCatalogByTech("clan"), ...getCatalogByTech("is")]);
        case "is":
        default:
            return cloneEquipment(getCatalogByTech("is"));
    }
}