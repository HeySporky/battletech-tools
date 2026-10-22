import { IEquipmentItem } from "./data-interfaces";
import { ammoCatalog } from "./ammo";
import { equipmentArtillery } from "./equipment-artillery";
import { equipmentBallistic } from "./equipment-ballistic";
import { equipmentEnergy } from "./equipment-energy";
import { equipmentMisc } from "./equipment-misc";
import { equipmentMissile } from "./equipment-missile";

function hasUniversalMetrics(item: IEquipmentItem, counterpart: IEquipmentItem): boolean {
    return item.name === counterpart.name
        && item.weight === counterpart.weight
        && item.space.battlemech === counterpart.space.battlemech
        && JSON.stringify(item.damage) === JSON.stringify(counterpart.damage)
        && JSON.stringify(item.range) === JSON.stringify(counterpart.range);
}

/** Every official weapon and equipment record (not ammunition) whose tech base is universal, in catalog order. */
export const universalEquipment: IEquipmentItem[] = [
    ...equipmentBallistic, ...equipmentEnergy, ...equipmentMissile, ...equipmentMisc, ...equipmentArtillery,
].filter(item => item.techBase === "universal");

// The universal records join both the Inner Sphere and the Clan lists.
const universalEquipmentTags = new Set([
    ...universalEquipment.map(item => item.tag),
    ...ammoCatalog.filter(item => item.techBase === "universal").map(item => item.tag),
]);

export function isUniversalEquipment(item: IEquipmentItem): boolean {
    return item.catalog === "universal" || universalEquipmentTags.has(item.tag);
}

export function hasUniversalEquipmentMetrics(item: IEquipmentItem, counterpart: IEquipmentItem): boolean {
    return hasUniversalMetrics(item, counterpart);
}
