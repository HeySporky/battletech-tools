import AlphaStrikeForce, { IASForceExport } from "./classes/alpha-strike-force";
import AlphaStrikeGroup, { IASGroupExport } from "./classes/alpha-strike-group";
import { BattleMech, IBattleMechExport } from "./classes/battlemech";
import { BattleMechForce, ICBTForceExport, MAX_FORCE_GROUPS } from "./classes/battlemech-force";
import { BattleMechGroup, ICBTGroupExport, MAX_GROUP_VEHICLES } from "./classes/battlemech-group";
import Vehicle, { IVehicleExport, normalizeVehicleExport } from "./classes/vehicle";
import { IAppGlobals } from "./ui/app-router";
import { AppSettings, IAppSettingsExport } from "./ui/classes/app_settings";
// import {Storage} from 'session-storage-sync';

export enum ESaveDataMode {
    localStorage = 0,
    firebase = 1,
}

export function getSaveDataModes(): number[] {
    return [0,1];
}

export function getSaveDataModeName( id: ESaveDataMode ): string {

    if( id === ESaveDataMode.localStorage ) return "localStorage";
    if( id === ESaveDataMode.firebase) return "Firebase";

    return "n/a";
}

export interface IFullBackup {
    battleMechSaves: IBattleMechExport[];
    // appSettings: IAppSettingsExport;
    favoriteASGroups: IASGroupExport[];
    currentASForce: IASForceExport | null;

    favoriteCBTGroups: ICBTGroupExport[];
    currentCBTForce: ICBTForceExport | null;

    currentVBattleMech: string | null;

    vehicleSaves: IVehicleExport[];
    currentVehicle: string | null;
}

export async function getFullBackup(
    appSettings: AppSettings,
): Promise<string> {
    let rv: IFullBackup  = {
        battleMechSaves: await getBattleMechSaves(appSettings),
        // appSettings: getAppSettings(),
        favoriteASGroups: await getFavoriteASGroups(appSettings),
        currentASForce: await getCurrentASForce(appSettings),
        favoriteCBTGroups: await getFavoriteCBTGroups(appSettings),
        currentCBTForce: await getCurrentCBTForce(appSettings),
        currentVBattleMech: await getCurrentBattleMech(appSettings),
        vehicleSaves: await getVehicleSaves(appSettings),
        currentVehicle: await getCurrentVehicle(appSettings),
    }

    return JSON.stringify( rv );
}

export interface IRestoreMessage {
    severity: string;
    message: string;
}

/** Most saved vehicle designs read from storage or a backup: each is validated on load (a few ms apiece). */
export const MAX_VEHICLE_SAVES = 500;
/** Most groups read from one backup's favorites or force. */
export const MAX_RESTORE_GROUPS = MAX_FORCE_GROUPS;

const warning = (message: string): IRestoreMessage => ({ severity: "warning", message });

/**
 * What restoring the vehicles in a list of saved groups (favorites, a force) will clean or drop: vehicles over
 * the per-group limit, and every field a vehicle's import fixes.
 */
function groupVehicleWarnings(label: string, groups: unknown): IRestoreMessage[] {
    const rv: IRestoreMessage[] = [];
    if( !Array.isArray(groups) ) {
        return rv;
    }
    if( groups.length > MAX_RESTORE_GROUPS ) {
        rv.push(warning(label + ": only the first " + MAX_RESTORE_GROUPS + " of " + groups.length + " groups are read"));
    }
    for( const group of groups.slice(0, MAX_RESTORE_GROUPS) ) {
        const record = group && typeof group === "object" ? group as { name?: unknown, vehicles?: unknown } : {};
        const name = label + (typeof record.name === "string" && record.name ? " '" + record.name.slice(0, 60) + "'" : "");
        const vehicles = Array.isArray(record.vehicles) ? record.vehicles : [];
        if( vehicles.length > MAX_GROUP_VEHICLES ) {
            rv.push(warning(name + ": only the first " + MAX_GROUP_VEHICLES + " of " + vehicles.length + " vehicles are kept"));
        }
        for( const vehicle of vehicles.slice(0, MAX_GROUP_VEHICLES) ) {
            for( const issue of normalizeVehicleExport(vehicle).issues ) {
                rv.push(warning(name + " vehicle: " + issue));
            }
        }
    }
    return rv;
}

export function checkFullRestoreData(
    io: IFullBackup
): boolean {
    if( typeof(io.battleMechSaves) !== "object" ) {
        return false;
    }
    // if( typeof(io.appSettings) !== "object" ) {
    //     return false;
    // }
    // if( typeof(io.currentASForce) !== "object" ) {
    //     return false;
    // }
    if( typeof(io.favoriteASGroups) !== "object" ) {
        return false;
    }
    // if( typeof(io.favoriteCBTGroups) !== "object" ) {
    //     return false;
    // }
    // if( typeof(io.currentVBattleMech) !== "object" ) {
    //     return false;
    // }

    return true;
}

export function restoreFullBackup(
    io: IFullBackup,
    appGlobals: IAppGlobals,
    overWriteCurrentBattlemech: boolean = false,
    overWriteCurrentASGroup: boolean = false,
    overWriteCurrentCBTGroup: boolean = false,
    performActions: boolean = false,
): IRestoreMessage[] {

    let restoreMessages: IRestoreMessage[] = [];

    restoreMessages.push({
        severity: "replace",
        message: "Overwrite your Settings",
    })

    if( io.favoriteASGroups ) {
        for( let item of io.favoriteASGroups ) {
            let foundItem: IASGroupExport | null = null;
            let itemName = "(nameless)";
            if( item.name ) {
                itemName = item.name;
            }
            for( let existingItem of appGlobals.favoriteASGroups ) {
                let existingItemExport = existingItem.export();
                if( existingItem.uuid === item.uuid ) {
                    foundItem = existingItemExport;

                    let existingName = "(nameless)";
                    if( existingItemExport.name ) {
                        existingName = existingItemExport.name;
                    }
                    restoreMessages.push({
                        severity: "replace",
                        message: "Replace Alpha Strike Favorite Group '" + existingName + "' with '" + itemName + "'",
                    })
                    if( performActions ) {

                        existingItem.import( item );
                    }
                }
            }

            if( !foundItem ) {
                restoreMessages.push({
                    severity: "add",
                    message: "Add To your Alpha Strike Favorite groups: '" + itemName + "'",
                })
                if( performActions ) {
                    appGlobals.favoriteASGroups.push( new AlphaStrikeGroup(item) );
                }
            }
        }
    }

    if( Array.isArray(io.favoriteCBTGroups) ) {
        restoreMessages.push(...groupVehicleWarnings("Classic BattleTech Favorite Group", io.favoriteCBTGroups));
        for( let item of io.favoriteCBTGroups.slice(0, MAX_RESTORE_GROUPS) ) {
            let foundItem: ICBTGroupExport | null = null;
            let itemName = "(nameless)";
            if( item.name ) {
                itemName = item.name;
            }
            for( let existingItem of appGlobals.favoriteCBTGroups ) {
                let existingItemExport = existingItem.export();
                if( existingItem.uuid === item.uuid ) {
                    foundItem = existingItemExport;

                    let existingName = "(nameless)";
                    if( existingItemExport.name ) {
                        existingName = existingItemExport.name;
                    }
                    restoreMessages.push({
                        severity: "replace",
                        message: "Replace Classic BattleTech Favorite Group '" + existingName + "' with '" + itemName + "'",
                    })
                    if( performActions ) {

                        existingItem.import( item );
                    }
                }
            }

            if( !foundItem ) {
                restoreMessages.push({
                    severity: "add",
                    message: "Add To your Classic BattleTech Favorite groups: '" + itemName + "'",
                })
                if( performActions ) {
                    appGlobals.favoriteCBTGroups.push( new BattleMechGroup(item) );
                }
            }
        }
    }

    if( io.battleMechSaves ) {
        for( let item of io.battleMechSaves ) {
            let foundItem: IBattleMechExport | null = null;
            let itemName = "(nameless)";
            if( item.name ) {
                itemName = item.name;
            }
            for( let existingItemIndex in appGlobals.battleMechSaves ) {

                if( appGlobals.battleMechSaves[existingItemIndex].uuid === item.uuid ) {
                    foundItem = appGlobals.battleMechSaves[existingItemIndex];

                    let existingName = "(nameless)";

                    if( appGlobals.battleMechSaves[existingItemIndex].name ) {
                        existingName = appGlobals.battleMechSaves[existingItemIndex].name;
                    }

                    restoreMessages.push({
                        severity: "replace",
                        message: "Replace Saved BattleMech '" + existingName + "' with '" + itemName + "'",
                    });

                    if( performActions ) {
                        appGlobals.battleMechSaves[existingItemIndex] = item;
                    }

                }
            }

            if( !foundItem ) {
                restoreMessages.push({
                    severity: "add",
                    message: "Add to your Saved BattleMech: '" + itemName + "'",
                })
                if( performActions ) {
                    appGlobals.battleMechSaves.push( item )
                }
            }
        }
    }

    if( Array.isArray(io.vehicleSaves) ) {
        // Saved vehicles in a backup may come from someone else: clean each one and report what changed.
        if( io.vehicleSaves.length > MAX_VEHICLE_SAVES ) {
            restoreMessages.push(warning("Only the first " + MAX_VEHICLE_SAVES + " of " + io.vehicleSaves.length + " saved vehicles are restored"));
        }
        for( let rawItem of io.vehicleSaves.slice(0, MAX_VEHICLE_SAVES) ) {
            const normalized = normalizeVehicleExport( rawItem );
            const item = normalized.vehicle;
            for( const issue of normalized.issues ) {
                restoreMessages.push({ severity: "warning", message: "Saved vehicle '" + (item?.name || "(nameless)") + "': " + issue });
            }
            if( !item ) {
                continue;
            }
            let foundItem: IVehicleExport | null = null;
            let itemName = "(nameless)";
            if( item.name ) {
                itemName = item.name;
            }
            for( let existingItemIndex in appGlobals.vehicleSaves ) {

                if( appGlobals.vehicleSaves[existingItemIndex].uuid === item.uuid ) {
                    foundItem = appGlobals.vehicleSaves[existingItemIndex];

                    let existingName = "(nameless)";

                    if( appGlobals.vehicleSaves[existingItemIndex].name ) {
                        existingName = appGlobals.vehicleSaves[existingItemIndex].name;
                    }

                    restoreMessages.push({
                        severity: "replace",
                        message: "Replace Saved Vehicle '" + existingName + "' with '" + itemName + "'",
                    });

                    if( performActions ) {
                        appGlobals.vehicleSaves[existingItemIndex] = item;
                    }

                }
            }

            if( !foundItem ) {
                restoreMessages.push({
                    severity: "add",
                    message: "Add to your Saved Vehicles: '" + itemName + "'",
                })
                if( performActions ) {
                    appGlobals.vehicleSaves.push( item )
                }
            }
        }
    }

    // The current vehicle and force are only restored when their box is ticked: the preview (before any box
    // is ticked) says what would be cleaned, and the restore itself reports only what it actually restores.
    const conditional = ( overwrite: boolean, what: string ) => performActions ? ( overwrite ? "" : null ) : "If you overwrite your " + what + ": ";
    const vehiclePrefix = conditional( overWriteCurrentBattlemech, "current vehicle" );
    if( io.currentVehicle && vehiclePrefix !== null ) {
        for( const issue of new Vehicle(io.currentVehicle).getImportIssues() ) {
            restoreMessages.push(warning(vehiclePrefix + "Current vehicle: " + issue));
        }
    }
    const forcePrefix = conditional( overWriteCurrentCBTGroup, "current Classic force" );
    if( io.currentCBTForce && forcePrefix !== null ) {
        for( const msg of groupVehicleWarnings("Classic force group", io.currentCBTForce.groups) ) {
            restoreMessages.push(warning(forcePrefix + msg.message));
        }
    }

    if( overWriteCurrentBattlemech && performActions ) {
        if( io.currentVBattleMech ) {
            let bmObj = new BattleMech();
            bmObj.importJSON(io.currentVBattleMech);
            appGlobals.currentBattleMech = bmObj;
        }
        if( io.currentVehicle ) {
            appGlobals.currentVehicle = new Vehicle(io.currentVehicle);
        }
    }

    if( overWriteCurrentASGroup && performActions ) {
        appGlobals.currentASForce = new AlphaStrikeForce(io.currentASForce);
    }

    if( overWriteCurrentCBTGroup && performActions && io.currentCBTForce) {
        appGlobals.currentCBTForce = new BattleMechForce(io.currentCBTForce);
    }

    if( performActions ) {
        appGlobals.saveCurrentBattleMech( appGlobals.currentBattleMech );
        appGlobals.saveCurrentASForce( appGlobals.currentASForce );
        if( appGlobals.currentCBTForce )
            appGlobals.saveCurrentCBTForce( appGlobals.currentCBTForce );
        appGlobals.saveBattleMechSaves( appGlobals.battleMechSaves );
        appGlobals.saveVehicleSaves( appGlobals.vehicleSaves );
        if( appGlobals.currentVehicle )
            appGlobals.saveCurrentVehicle( appGlobals.currentVehicle );
        // let appSettingsObj = new AppSettings(io.appSettings);
        // appGlobals.saveAppSettings( appSettingsObj );
    }

    return restoreMessages;
}

async function saveData(
    appSettings: AppSettings,
    keyName: string,
    data: string,
): Promise<void> {
    switch( appSettings.storageLocation ) {
        case ESaveDataMode.localStorage: {
            localStorage.setItem(keyName, data);
            break;
        }
        case ESaveDataMode.firebase: {
            // localStorage.setItem(keyName, data);
            break;
        }
        default: {
            console.error("Unknown Save Storage", appSettings.storageLocation)
            break;
        }
    }

}

async function getData(
    appSettings: AppSettings,
    keyName: string,
): Promise<string | null> {
    switch( appSettings.storageLocation ) {
        case ESaveDataMode.localStorage: {

            return localStorage.getItem( keyName );;
        }
        case ESaveDataMode.firebase: {
            return null;
        }
        default: {
            console.error("Unknown Save Storage", appSettings.storageLocation)
            return null;
        }
    }
}

export function saveBattleMechSaves(
    appSettings: AppSettings,
    newValue: IBattleMechExport[]
) {
    for( let itemIndex in newValue ) {
        newValue[itemIndex].lastUpdated = new Date();
    }
    saveData(appSettings, "battleMechSaves", JSON.stringify(newValue) );
}

export async function getBattleMechSaves(
    appSettings: AppSettings,
): Promise<IBattleMechExport[]> {
    let rv: IBattleMechExport[] = [];

    let rawData = await getData(appSettings, "battleMechSaves" );
    try {
        if( rawData )
            rv = JSON.parse( rawData );

        if(!rv ) {
            rv = [];
        }
    }
    catch {
        rv = [];
    }

    return rv;
}

export function saveVehicleSaves(
    appSettings: AppSettings,
    newValue: IVehicleExport[]
) {
    for( let itemIndex in newValue ) {
        newValue[itemIndex].lastUpdated = new Date();
    }
    saveData(appSettings, "vehicleSaves", JSON.stringify(newValue) );
}

export async function getVehicleSaves(
    appSettings: AppSettings,
): Promise<IVehicleExport[]> {
    let rv: IVehicleExport[] = [];

    let rawData = await getData(appSettings, "vehicleSaves" );
    try {
        if( rawData )
            rv = JSON.parse( rawData );

        // Clean stored designs before anything renders them (older saves and restored backups).
        rv = Array.isArray( rv ) ? rv.slice( 0, MAX_VEHICLE_SAVES ).map( (item) => normalizeVehicleExport( item ).vehicle )
            .filter( (item): item is IVehicleExport => item !== null ) : [];
    }
    catch {
        rv = [];
    }

    return rv;
}

export function saveCurrentCBTForce(
    appSettings: AppSettings,
    newValue: ICBTForceExport,
) {


    saveData(appSettings, "currentCBTForce", JSON.stringify(newValue) );
}

export function saveCurrentASForce(
    appSettings: AppSettings,
    newValue: IASForceExport,
) {
    newValue.lastUpdated = new Date();

    saveData(appSettings, "currentASForce", JSON.stringify(newValue) );
}

export async function getCurrentCBTForce(
    appSettings: AppSettings,
): Promise<ICBTForceExport | null> {
    let rv: ICBTForceExport | null = null;

    let rawData = await getData(appSettings, "currentCBTForce" );
    try {
        if( rawData )
            rv = JSON.parse( rawData );

        if(!rv ) {
            return rv;
        }
    }
    catch {
        return rv;
    }

    return rv;
}

export async function getCurrentASForce(
    appSettings: AppSettings,
): Promise<IASForceExport | null> {
    let rv: IASForceExport | null = null;

    let rawData = await getData(appSettings, "currentASForce" );
    try {
        if( rawData )
            rv = JSON.parse( rawData );

        if(!rv ) {
            return rv;
        }
    }
    catch {
        return rv;
    }

    return rv;
}

export function saveCurrentBattleMech(
    appSettings: AppSettings,
    newValue: string,
) {
    saveData(appSettings, "currentBattleMech", newValue );
}

export async function getCurrentBattleMech(
    appSettings: AppSettings,
): Promise<string | null> {

    return await getData(
        appSettings,
        "currentBattleMech"
    );

}

export function saveCurrentVehicle(
    appSettings: AppSettings,
    newValue: string,
) {
    saveData(appSettings, "currentVehicle", newValue );
}

export async function getCurrentVehicle(
    appSettings: AppSettings,
): Promise<string | null> {

    return await getData(
        appSettings,
        "currentVehicle"
    );

}

export function saveFavoriteASGroups(
    appSettings: AppSettings,
    newValue: IASGroupExport[]
) {

    for( let itemIndex in newValue ) {
        newValue[itemIndex].lastUpdated = new Date();
    }
    saveData(appSettings, "favoriteASGroups", JSON.stringify(newValue) );
}

export function saveFavoriteASGroupsObjects(
    appSettings: AppSettings,
    newValue: AlphaStrikeGroup[]
) {
    let rv: IASGroupExport[] = [];
    for( let unit of newValue ) {
        rv.push( unit.export() );
    }

    for( let itemIndex in newValue ) {
        newValue[itemIndex].lastUpdated = new Date();
    }

    saveData(appSettings, "favoriteASGroups", JSON.stringify(rv) );
}

export async function getFavoriteASGroups(
    appSettings: AppSettings,
): Promise<IASGroupExport[]> {
    let rv: IASGroupExport[] = [];

    let rawData = await getData(appSettings, "favoriteASGroups" );
    try {
        if( rawData )
            rv = JSON.parse( rawData );

        if(!rv ) {
            rv = [];
        }
    }
    catch {
        rv = [];
    }

    return rv;
}

export function saveFavoriteCBTGroupsObjects(
    appSettings: AppSettings,
    newValue: BattleMechGroup[]
) {
    let rv: ICBTGroupExport[] = [];
    for( let unit of newValue ) {
        rv.push( unit.export() );
    }

    for( let itemIndex in newValue ) {
        newValue[itemIndex].lastUpdated = new Date();
    }
    saveData(appSettings, "favoriteCBTGroups", JSON.stringify(rv) );
}

export async function getFavoriteCBTGroups(
    appSettings: AppSettings,
): Promise<ICBTGroupExport[]> {
    let rv: ICBTGroupExport[] = [];

    let rawData = await getData(appSettings, "favoriteCBTGroups" );
    try {
        if( rawData )
            rv = JSON.parse( rawData );

        if(!rv ) {
            rv = [];
        }
    }
    catch {
        rv = [];
    }

    return rv;
}

export function saveAppSettings(
    newValue: IAppSettingsExport,
) {
    localStorage.setItem("appSettings", JSON.stringify(newValue) );
}

export function getAppSettings(): IAppSettingsExport {
    let rv: IAppSettingsExport = (new AppSettings(null)).export()
    let rawData = localStorage.getItem("appSettings" );

    try {
        if( rawData )
            rv = JSON.parse( rawData );

        if(rv ) {
            return rv;
        }
    }
    catch {
        return rv;
    }

    return rv;
}