import { aerospaceArmorTypes } from "./aerospace-armor-types";
import { battleArmorArmorTypes } from "./battle-armor-armor-types";
import { battleArmorEquipment } from "./battle-armor-equipment";
import { getBattleArmorScaleEquipment } from "./battle-armor-scale-equipment";
import { capitalWeapons } from "./capital-weapons";
import { COMBAT_VEHICLE_CHASSIS_MODIFICATIONS } from "./combat-vehicle-chassis-modifications";
import type { ICatalogStanding } from "./data-interfaces";
import { getEquipmentCatalogDefinitions } from "./equipment-registry";
import { infantryArmor } from "./infantry-armor";
import { infantryWeapons } from "./infantry-weapons";
import { mechArmorTypes } from "./mech-armor-types";
import { mechCockpitTypes } from "./mech-cockpit-types";
import { mechEngineTypes, mechLargeEngineTypes } from "./mech-engine-types";
import { mechGyroTypes } from "./mech-gyro-types";
import { mechHeatSinkTypes } from "./mech-heat-sink-types";
import { mechInternalStructureTypes } from "./mech-internal-structure-types";
import { mechJumpJetTypes } from "./mech-jump-jet-types";
import { mechMyomerTypes } from "./mech-myomer-types";
import { protoMechComponents } from "./protomech-components";
import { protoMechEquipment } from "./protomech-construction";
import { subCapitalWeapons } from "./sub-capital-weapons";
import { supportVehicleArmor } from "./support-vehicle-armor";
import { vehicleMotiveTypes } from "./vehicle-motive-types";

export interface ICatalogEntry {
    /** Stable id, e.g. "equipment-energy", "mech-armor", "infantry-weapons". */
    id: string;
    records: ICatalogStanding[];
    custom: boolean;
    /** One of the equipment catalogs (equipment-registry.ts), whose tags are looked up together. */
    equipment?: boolean;
}

/**
 * Every catalog of records that can be given to a unit or a member of one (design 2026-10-24-catalog-consolidation
 * §1). Construction options that are not items (tonnages, 'Mech types) are not listed.
 */
export function getAllCatalogs(): ICatalogEntry[] {
    return [
        ...getEquipmentCatalogDefinitions().map((definition) => ({ id: definition.id, records: definition.equipment, custom: !!definition.custom, equipment: true })),
        { id: "mech-engine", records: [...mechEngineTypes, ...mechLargeEngineTypes], custom: false },
        { id: "mech-gyro", records: mechGyroTypes, custom: false },
        { id: "mech-cockpit", records: mechCockpitTypes, custom: false },
        { id: "mech-heat-sink", records: mechHeatSinkTypes, custom: false },
        { id: "mech-jump-jet", records: mechJumpJetTypes, custom: false },
        { id: "mech-armor", records: mechArmorTypes, custom: false },
        { id: "mech-internal-structure", records: mechInternalStructureTypes, custom: false },
        { id: "mech-myomer", records: mechMyomerTypes, custom: false },
        { id: "infantry-weapons", records: infantryWeapons, custom: false },
        { id: "infantry-armor", records: infantryArmor, custom: false },
        { id: "battle-armor-equipment", records: battleArmorEquipment, custom: false },
        { id: "battle-armor-armor", records: battleArmorArmorTypes, custom: false },
        { id: "battle-armor-scale-is", records: getBattleArmorScaleEquipment("is"), custom: false },
        { id: "battle-armor-scale-clan", records: getBattleArmorScaleEquipment("clan"), custom: false },
        { id: "aerospace-armor", records: aerospaceArmorTypes, custom: false },
        { id: "support-vehicle-armor", records: supportVehicleArmor, custom: false },
        { id: "vehicle-motive", records: vehicleMotiveTypes, custom: false },
        { id: "combat-vehicle-chassis-modifications", records: COMBAT_VEHICLE_CHASSIS_MODIFICATIONS, custom: false },
        { id: "protomech-components", records: protoMechComponents, custom: false },
        { id: "protomech-equipment", records: protoMechEquipment, custom: false },
        { id: "capital-weapons", records: capitalWeapons, custom: false },
        { id: "sub-capital-weapons", records: subCapitalWeapons, custom: false },
    ];
}
