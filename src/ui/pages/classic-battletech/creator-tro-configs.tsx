import type { BattleMech } from '../../../classes/battlemech';
import { getBattleMechTroAdapter } from '../../../classes/battlemech-tro';
import { getUnitTroAdapter } from '../../../classes/unit-tro';
import type { ICreatorTroConfig } from '../../components/creator-tro-pages';
import {
    BattleArmorCreatorSideMenu, BuildingCreatorSideMenu, CapitalShipCreatorSideMenu, FighterCreatorSideMenu, InfantryCreatorSideMenu, MechCreatorSideMenu,
    ProtoMechCreatorSideMenu, SmallCraftCreatorSideMenu, VehicleCreatorSideMenu, WalkerCreatorSideMenu,
} from '../../components/creator-side-menus';
import MechCreatorStatusBar from '../../components/mech-creator-status-bar';

// Each creator's Technical Readout step and printed TRO sheet (shared pages in creator-tro-pages.tsx).

export const MECH_TRO: ICreatorTroConfig = {
    creator: "mech-creator", name: "'Mech Creator", step: 7, path: "step7", previous: "step6",
    current: "currentBattleMech", save: "saveCurrentBattleMech", adapter: getBattleMechTroAdapter,
    SideMenu: MechCreatorSideMenu, StatusBar: MechCreatorStatusBar,
    provisionalNote: (mech: BattleMech) => mech.isBattleValueProvisional() ? "provisional BV" : undefined,
};

export const VEHICLE_TRO: ICreatorTroConfig = {
    creator: "vehicle-creator", name: "Vehicle Creator", step: 5, previous: "equipment-placement",
    current: "currentVehicle", save: "saveCurrentVehicle", adapter: getUnitTroAdapter, SideMenu: VehicleCreatorSideMenu,
};

export const FIGHTER_TRO: ICreatorTroConfig = {
    creator: "fighter-creator", name: "Fighter Creator", step: 4, previous: "equipment",
    current: "currentFighter", save: "saveCurrentFighter", adapter: getUnitTroAdapter, SideMenu: FighterCreatorSideMenu,
};

export const INFANTRY_TRO: ICreatorTroConfig = {
    creator: "infantry-creator", name: "Infantry Creator", step: 3, previous: "weapons",
    current: "currentInfantry", save: "saveCurrentInfantry", adapter: getUnitTroAdapter, SideMenu: InfantryCreatorSideMenu,
};

export const BATTLE_ARMOR_TRO: ICreatorTroConfig = {
    creator: "battle-armor-creator", name: "Battle Armor Creator", step: 6, previous: "loadouts",
    current: "currentBattleArmor", save: "saveCurrentBattleArmor", adapter: getUnitTroAdapter, SideMenu: BattleArmorCreatorSideMenu,
};

export const PROTOMECH_TRO: ICreatorTroConfig = {
    creator: "protomech-creator", name: "ProtoMech Creator", step: 6, previous: "equipment",
    current: "currentProtoMech", save: "saveCurrentProtoMech", adapter: getUnitTroAdapter, SideMenu: ProtoMechCreatorSideMenu,
};

export const SMALL_CRAFT_TRO: ICreatorTroConfig = {
    creator: "small-craft-creator", name: "Small Craft Creator", step: 7, previous: "crew",
    current: "currentSmallCraft", save: "saveCurrentSmallCraft", adapter: getUnitTroAdapter, SideMenu: SmallCraftCreatorSideMenu,
};

export const CAPITAL_SHIP_TRO: ICreatorTroConfig = {
    creator: "capital-ship-creator", name: "JumpShip and WarShip Creator", step: 7, previous: "crew",
    current: "currentCapitalShip", save: "saveCurrentCapitalShip", adapter: getUnitTroAdapter, SideMenu: CapitalShipCreatorSideMenu,
};

export const BUILDING_TRO: ICreatorTroConfig = {
    creator: "building-creator", name: "Building Creator", step: 4, previous: "equipment",
    current: "currentBuilding", save: "saveCurrentBuilding", adapter: getUnitTroAdapter, SideMenu: BuildingCreatorSideMenu,
};

export const WALKER_TRO: ICreatorTroConfig = {
    creator: "walker-creator", name: "Walker Creator", step: 6, previous: "criticals",
    current: "currentWalker", save: "saveCurrentWalker", adapter: getUnitTroAdapter, SideMenu: WalkerCreatorSideMenu,
    provisionalNote: () => "provisional BV",
};

export const CREATOR_TRO_CONFIGS: ICreatorTroConfig[] = [
    MECH_TRO, VEHICLE_TRO, FIGHTER_TRO, INFANTRY_TRO, BATTLE_ARMOR_TRO, PROTOMECH_TRO, SMALL_CRAFT_TRO, CAPITAL_SHIP_TRO, BUILDING_TRO, WALKER_TRO,
];
