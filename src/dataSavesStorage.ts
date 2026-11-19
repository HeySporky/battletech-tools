// Browser storage basics the app shell needs before the unit classes load (#589): dataSaves.ts re-exports them.
import { AppSettings, IAppSettingsExport } from "./ui/classes/app_settings";

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

export type StorageSaveErrorHandler = (keyName: string, error: unknown) => void;

let storageSaveErrorHandler: StorageSaveErrorHandler | null = null;

/** Registers the one listener that is told when a save cannot be written (pass null to remove it). */
export function onStorageSaveError( handler: StorageSaveErrorHandler | null ): void {
    storageSaveErrorHandler = handler;
}

/** Saves that could not be written since the page loaded; a restore compares it before and after. */
let storageWriteFailures = 0;

export function getStorageWriteFailures(): number {
    return storageWriteFailures;
}

// Reading throws when storage is blocked (some private modes): load as if nothing were saved.
export function readLocalStorage( keyName: string ): string | null {
    try {
        return localStorage.getItem( keyName );
    } catch( error ) {
        console.error("Unable to read " + keyName + " from localStorage", error);
        return null;
    }
}

// localStorage.setItem throws when the origin's quota (about 5 MB) is used up, or when storage is disabled.
export function writeLocalStorage( keyName: string, data: string ): void {
    try {
        localStorage.setItem(keyName, data);
    } catch( error ) {
        storageWriteFailures++;
        console.error("Unable to save " + keyName + " to localStorage", error);
        if( storageSaveErrorHandler )
            storageSaveErrorHandler( keyName, error );
    }
}

export function saveAppSettings(
    newValue: IAppSettingsExport,
) {
    writeLocalStorage("appSettings", JSON.stringify(newValue) );
}

export function getAppSettings(): IAppSettingsExport {
    let rv: IAppSettingsExport = (new AppSettings(null)).export()
    const rawData = localStorage.getItem("appSettings" );

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
