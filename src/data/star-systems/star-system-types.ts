/*
 * The star system catalog: MegaMek Data's canon systems as the base, verified against our own books (NGCFells's
 * rule, 2026-11-19). See STAR-SYSTEMS-CREDITS.md.
 */

/** A value with where it came from: MegaMek's citation, or the book and page after a correction. */
export interface ISourced<T> {
    value: T;
    source: string;
}

/** In the data files a field MegaMek does not cite is stored bare; read it with `readSourced`. */
export type StoredSourced<T> = T | ISourced<T>;

/** The source shown for a field MegaMek gives without a citation. */
export const MEGAMEK_DATA_SOURCE = "MegaMek Data";

export const readSourced = <T>( field: StoredSourced<T> | null | undefined ): ISourced<T> | null => {
    if( field === null || field === undefined ) return null;
    if( typeof field === "object" && "value" in ( field as object ) && "source" in ( field as object ) ) return field as ISourced<T>;
    return { value: field as T, source: MEGAMEK_DATA_SOURCE };
}

export interface IStarSystemIndexEntry {
    id: string;
    name: string;
    x: number;
    y: number;
    /** Owning faction codes from each date on (the primary planet's). */
    owners: { date: string; factions: string[] }[];
}

export interface IStarPlanet {
    name: StoredSourced<string>;
    type: string;
    sysPos: number | null;
    gravity?: StoredSourced<number>;
    atmosphere?: StoredSourced<string>;
    pressure?: StoredSourced<string>;
    temperature?: StoredSourced<number>;
    water?: StoredSourced<number>;
    events: { date: string; population?: number; socioIndustrial?: string; factions?: string[] }[];
}

export interface IStarSystemDetail {
    id: string;
    spectralType: StoredSourced<string> | null;
    primarySlot: number | null;
    recharge: { date: string; nadir?: boolean; zenith?: boolean }[];
    planets: IStarPlanet[];
}

/** A field read from one of our books that wins over MegaMek's. path: "x", "y", "name", "spectralType",
 * "primarySlot" or "planets.<sysPos>.<field>". */
export interface IStarSystemCorrection {
    systemId: string;
    path: string;
    value: unknown;
    source: string;
    note: string;
}

/** An industrial site from the Objectives books. heavy = makes 'Mechs, vehicles, fighters or ships (NGCFells's call). */
export interface IStarSystemSite {
    id: string;
    systemId: string;
    planet: string;
    name: string;
    products: string[];
    heavy: boolean;
    position?: string;
    date: string;
    source: string;
}

/** Which units were on a world on a date, from the book that says so. */
export interface IStarSystemGarrison {
    systemId: string;
    date: string;
    faction: string;
    units: string[];
    source: string;
}
