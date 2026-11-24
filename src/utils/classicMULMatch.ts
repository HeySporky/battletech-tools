import { BattleMech } from "../classes/battlemech";
import { IASMULUnit } from "../classes/alpha-strike-unit";
import { getMechFingerprint } from "./bundled-designs";
import { mulEras } from "./mulUtilities";
export { getMULAerospaceClass, isMULCapitalShip, isMULLargeAerospaceCraft } from "./mulAerospaceClass";
export type { MULAerospaceClass } from "./mulAerospaceClass";

// Matches Master Unit List entries to Classic designs by chassis + model. The MUL writes nicknames and alternate
// names with quotes and parentheses ('STK-3F (Jamison)', '"Butterbee"'), Skunk Werks with HTML entities, so both
// sides are reduced to the same plain words.

export interface IClassicDesignEntry<T> {
    chassis: string;
    model: string;
    design: T;
    /** The design's layout (a 'Mech's crit table and armor): one name and model with two layouts is two designs. */
    fingerprint?: string;
    /** Another name the design is matched by, not a row of its own (an OmniMech's "model + configuration"). */
    alias?: boolean;
    /** The MUL record the design was checked against, which may spell its name another way (#241). */
    mulId?: number;
}

/** Each match key's designs, one per layout, earliest first. */
export type ClassicDesignIndex<T> = Map<string, { design: T; fingerprint?: string }[]>;

function normalise(text: string): string {
    return text
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&amp;/gi, "&")
        .replace(/[‘’]/g, "'")
        .replace(/[“”]/g, '"')
        .toLowerCase()
        .replace(/["()]/g, " ")
        // A quote opening or closing a word ('Warthog', Doris' Delight), not one inside it (O'Bannon).
        .replace(/(^|\s)'+|'+(?=\s|$)/g, "$1 ")
        // An abbreviation's period ("Mk. I"), not a decimal point.
        .replace(/\.(?=\s|$)/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

// Words a chassis carries in parentheses that are not another name for it ("Koshi (Standard)").
const NOT_A_NAME = new Set(["standard", "prime", "omni"]);

/** Every key a chassis + model is known by: "Mad Cat (Timber Wolf)" also gives one for each of its two names. */
export function getMULMatchKeys(chassis: string, model: string): string[] {
    const keys = [normalise(chassis + " " + model)];
    const alternate = chassis.match(/^(.*?)\s*\((.*)\)\s*$/);
    if (alternate) {
        keys.push(normalise(alternate[1] + " " + model));
        if (!NOT_A_NAME.has(normalise(alternate[2]))) {
            keys.push(normalise(alternate[2] + " " + model));
        }
    }
    return keys.filter((key, index) => keys.indexOf(key) === index);
}

/** The key a MUL record's id is known by, beside its name keys: a design checked against it matches it by id. */
export const getMULIdKey = (id: number): string => "#" + id;

// The keys an entry is indexed by: its name keys, then its MUL record's id.
const entryKeys = (entry: IClassicDesignEntry<unknown>): string[] =>
    [...getMULMatchKeys(entry.chassis, entry.model), ...(entry.mulId ? [getMULIdKey(entry.mulId)] : [])];

// A design without a fingerprint is taken for the same as any other under its key.
const sameLayout = (a?: string, b?: string): boolean => a === undefined || b === undefined || a === b;

/**
 * Earlier entries win a shared key and layout, so list saved designs before bundled ones: the same name, model and
 * layout is one design whatever its source, and another layout under the same name and model is kept beside it.
 */
export function buildClassicDesignIndex<T>(entries: IClassicDesignEntry<T>[]): ClassicDesignIndex<T> {
    const index: ClassicDesignIndex<T> = new Map();
    for (const entry of entries) {
        for (const key of entryKeys(entry)) {
            const designs = index.get(key) ?? [];
            if (!designs.some((kept) => kept.design === entry.design || sameLayout(kept.fingerprint, entry.fingerprint))) {
                designs.push({ design: entry.design, fingerprint: entry.fingerprint });
                index.set(key, designs);
            }
        }
    }
    return index;
}

/** Every design a MUL entry matches, one per layout, the earliest first. */
export function findClassicDesigns<T>(unit: Pick<IASMULUnit, "Name" | "Variant"> & { Id?: number }, index: ClassicDesignIndex<T>): T[] {
    for (const key of [...getMULMatchKeys(unit.Name ?? "", unit.Variant ?? ""), ...(unit.Id ? [getMULIdKey(unit.Id)] : [])]) {
        const designs = index.get(key);
        if (designs) {
            return designs.map((kept) => kept.design);
        }
    }
    return [];
}

export const findClassicDesign = <T>(unit: Pick<IASMULUnit, "Name" | "Variant"> & { Id?: number }, index: ClassicDesignIndex<T>): T | null =>
    findClassicDesigns(unit, index)[0] ?? null;

/**
 * The designs no Master Unit List entry names (`onMUL` says whether a match key is on it), each once: the first of a
 * name, model and layout, without the aliases.
 */
export function getDesignsOffMUL<T>(entries: IClassicDesignEntry<T>[], index: ClassicDesignIndex<T>, onMUL: (key: string) => boolean): IClassicDesignEntry<T>[] {
    return entries.filter((entry) => {
        const keys = entryKeys(entry);
        return !entry.alias && !keys.some(onMUL) && (index.get(keys[0]) ?? []).some((kept) => kept.design === entry.design);
    });
}

/** What a design off the Master Unit List shows in the results, and the search's filters test. */
export interface IDesignSummary {
    name: string;
    model: string;
    tons: number;
    bv: number;
    tech: string;
    typeId: number;
    year?: number;
    /** Skunk Werks rules level, 0 Introductory to 4 Era Specific. */
    rulesLevel?: number;
    /** An aerospace unit's Alpha Strike type, which tells fighters, Small Craft, DropShips and capital ships apart. */
    bfType?: string;
}

const SSW_RULES_LEVELS = ["Introductory", "Standard", "Advanced", "Experimental", "Era Specific"];
/** The app rules level (Introductory 1 to Experimental 4) as a Skunk Werks one; ungraded or off-scale stays unset. */
export function getSSWRulesLevel(level: number): number | undefined {
    return level >= 1 && level <= 4 ? level - 1 : undefined;
}

const MUL_TECHNOLOGIES = [{ Id: 1, Name: "Inner Sphere" }, { Id: 2, Name: "Clan" }, { Id: 3, Name: "Mixed" }];

/**
 * A design no Master Unit List entry names, as a MUL record, so the search's filters test it like the rest: it has no
 * factions, role or Alpha Strike values, so a filter on those leaves it out. `key` keeps it apart in the results.
 */
export function getDesignMULRecord(design: IDesignSummary, key: string): IASMULUnit {
    const tech = MUL_TECHNOLOGIES.find((item) => design.tech.toLowerCase().startsWith(item.Name.toLowerCase())) ?? { Id: 5, Name: design.tech };
    const era = design.year ? mulEras.find((item) => item.yearStart <= design.year! && (item.yearEnd ?? Infinity) >= design.year!) : undefined;
    return {
        Id: 0, MulUnitKey: key, Name: design.name, Variant: design.model, Tonnage: design.tons, BattleValue: design.bv,
        Technology: tech, Type: { Id: design.typeId, Name: "" }, EraId: era?.id ?? 0, DateIntroduced: design.year ? String(design.year) : "",
        Rules: design.rulesLevel === undefined ? "" : SSW_RULES_LEVELS[design.rulesLevel] ?? "", BFType: design.bfType ?? null,
    } as unknown as IASMULUnit;
}

/**
 * Index entries for the other Classic types. Vehicles and fighters carry a name and a model; infantry, battle armor
 * and ProtoMechs only a name, which the user writes as the MUL's chassis and variant together.
 */
export function getClassicUnitEntries<T extends { getName(): string; getModel?(): string }>(units: T[]): IClassicDesignEntry<T>[] {
    return units.map((unit) => ({ chassis: unit.getName(), model: unit.getModel ? unit.getModel() : "", design: unit }));
}

/**
 * Index entries for 'Mechs; an OmniMech gives one per configuration, which the MUL lists as its own variant, and its
 * own entry is an alias of the configuration it has on.
 */
export function getClassicMechEntries(mechs: BattleMech[]): IClassicDesignEntry<BattleMech>[] {
    const entries: IClassicDesignEntry<BattleMech>[] = [];
    for (const mech of mechs) {
        const chassis = mech.getChassisName();
        const model = mech.getModelName();
        const configurations = mech.getOmniConfigurationNames();
        if (configurations.length > 1) {
            for (const name of configurations) {
                const configured = mech.cloneOmniConfiguration(name) as BattleMech;
                const fingerprint = getMechFingerprint(configured);
                entries.push({ chassis, model: name, design: configured, fingerprint });
                entries.push({ chassis, model: model + " " + name, design: configured, fingerprint, alias: true });
            }
        }
        entries.push({ chassis, model, design: mech, fingerprint: getMechFingerprint(mech), ...(configurations.length > 1 ? { alias: true } : {}) });
    }
    return entries;
}
