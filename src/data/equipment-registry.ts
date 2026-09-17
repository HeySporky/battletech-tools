import { IEquipmentItem } from "./data-interfaces";
import { mechISEquipmentBallistic } from "./mech-is-equipment-weapons-ballistic";
import { mechISEquipmentEnergy } from "./mech-is-equipment-weapons-energy";
import { mechISEquipmentMisc } from "./mech-is-equipment-weapons-misc";
import { mechISEquipmentMissiles } from "./mech-is-equipment-weapons-missiles";
import { mechClanEquipmentBallistic } from "./mech-clan-equipment-weapons-ballistic";
import { mechClanEquipmentEnergy } from "./mech-clan-equipment-weapons-energy";
import { mechClanEquipmentMisc } from "./mech-clan-equipment-weapons-misc";
import { mechClanEquipmentMissile } from "./mech-clan-equipment-weapons-missile";

const isEquipmentCatalog: IEquipmentItem[] = [
    ...mechISEquipmentEnergy,
    ...mechISEquipmentBallistic,
    ...mechISEquipmentMissiles,
    ...mechISEquipmentMisc,
];

const clanEquipmentCatalog: IEquipmentItem[] = [
    ...mechClanEquipmentEnergy,
    ...mechClanEquipmentBallistic,
    ...mechClanEquipmentMissile,
    ...mechClanEquipmentMisc,
];

export function getEquipmentCatalogs(): Record<string, IEquipmentItem[]> {
    return {
        is: [...isEquipmentCatalog],
        clan: [...clanEquipmentCatalog],
        mis: [...isEquipmentCatalog, ...clanEquipmentCatalog],
        mclan: [...clanEquipmentCatalog, ...isEquipmentCatalog],
    };
}

export function getEquipmentListByTech(techTag: string): IEquipmentItem[] {
    const normalizedTech = techTag.toLowerCase();

    switch (normalizedTech) {
        case "clan":
            return [...clanEquipmentCatalog];
        case "mis":
            return [...isEquipmentCatalog, ...clanEquipmentCatalog];
        case "mclan":
            return [...clanEquipmentCatalog, ...isEquipmentCatalog];
        case "is":
        default:
            return [...isEquipmentCatalog];
    }
}