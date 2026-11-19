import { IAssignedQuirk } from "./quirk-interfaces";

/** One quirk as a canon table lists it for a chassis (BMM pp.90-95; later the TROs). */
export interface ICanonQuirk {
    tag: string;
    /** A range bracket ("short") or a value (Rugged 1). */
    parameter?: string | number;
    /** Locations it goes on, one assignment each: "Barrel Fist (LA/RA)" is ["la", "ra"]. */
    locations?: string[];
    /** The weapon it goes on, by equipment name; `all` for a plural ("CT Medium Lasers": every one in the CT). */
    weapon?: { name: string; location?: string; all?: true };
    /** The years it applies, inclusive: "prior to 3025" is toYear 3024. */
    fromYear?: number;
    toYear?: number;
    /** "Bad Reputation (Clan)": the quirk applies only to that tech base's 'Mechs. */
    techBase?: "clan" | "inner-sphere";
    /** A qualifier the fields above cannot hold, as printed; the resolver never applies such a quirk. */
    note?: string;
}

/** A chassis' canon quirks, as its table row lists them. */
export interface ICanonQuirkEntry {
    chassis: string;
    /** Other names the chassis goes by ("Ebon Jaguar" for the Cauldron-Born). */
    altChassis?: string[];
    quirks: ICanonQuirk[];
    source: { book: string; page: number };
}

/** A canon entry placed on one unit: the assignments, and a note for each quirk it could not place. */
export interface ICanonResolution {
    quirks: IAssignedQuirk[];
    notes: string[];
}
