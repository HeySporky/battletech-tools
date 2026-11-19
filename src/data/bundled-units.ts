import BattleArmor from "../classes/battle-armor";
import ProtoMech from "../classes/protomech";
import SmallCraft from "../classes/small-craft";
import Vehicle from "../classes/vehicle";
import { untabulate } from "../utils/packed-json";
import { BUNDLED_CHUNK_SIZE, IBundledDesignHeader, IBundledUnitClass, loadBundledUnit, unshareDesign } from "../utils/bundled-designs";

/*
    The data here is/may be copyrighted and NOT included in the GPLv3 license.
    The 'Mechs are converted from the Solaris Skunk Werks project's files at https://github.com/Solaris-Skunk-Werks/SSW-Master;
    the other types from MegaMek's unit files (https://github.com/MegaMek/megamek), MegaMek Data (C) 2025-2026 by The
    MegaMek Team, licensed under CC BY-NC-SA 4.0 (https://creativecommons.org/licenses/by-nc-sa/4.0/).
    Regenerate with npm run build:bundled and
    WRITE_BUNDLED_UNITS=1 npx vitest run src/data/bundled-units.test.ts.
*/

/** Each bundled type is a folder of chunks and an index under ./bundled, fetched the first time something needs it. */
export type BundledType = "mechs" | "battle-armor" | "protomechs" | "small-craft" | "support-vehicles" | "vehicles";

type Loaders = Record<string, () => Promise<unknown>>;
const indexLoaders = import.meta.glob("./bundled/*-index.json", { import: "default" }) as Loaders;
const chunkLoaders = import.meta.glob("./bundled/*/*.json", { import: "default" }) as Loaders;

const indexes = new Map<BundledType, Promise<IBundledDesignHeader[]>>();
interface IBundledChunk { shared?: unknown[]; designs: Record<string, Record<string, unknown>> }
const chunks = new Map<string, Promise<IBundledChunk>>();

/** A bundled type's headers; a type not built yet has none. */
export function loadBundledIndex(type: BundledType): Promise<IBundledDesignHeader[]> {
    if (!indexes.has(type)) {
        const loader = indexLoaders[`./bundled/${type}-index.json`];
        indexes.set(type, loader ? loader().then((data) => untabulate((data as { designs: unknown }).designs) as IBundledDesignHeader[]) : Promise.resolve([]));
    }
    return indexes.get(type)!;
}

/** The compact design behind a header. */
export function loadBundledDesignData(type: BundledType, header: Pick<IBundledDesignHeader, "id">): Promise<Record<string, unknown>> {
    const file = `./bundled/${type}/${Math.floor(header.id / BUNDLED_CHUNK_SIZE)}.json`;
    if (!chunks.has(file)) chunks.set(file, chunkLoaders[file]().then((data) => data as IBundledChunk));
    return chunks.get(file)!.then((chunk) => unshareDesign(chunk.designs[header.id], chunk.shared ?? []));
}

export type BundledUnit = BattleArmor | ProtoMech | SmallCraft | Vehicle;
export type BundledUnitType = Exclude<BundledType, "mechs">;

// Looked up when used: the classes and this module import each other through the unit data.
export const getBundledUnitClass = (type: BundledUnitType): IBundledUnitClass<BundledUnit> =>
    ({ "battle-armor": BattleArmor, "protomechs": ProtoMech, "small-craft": SmallCraft, "support-vehicles": Vehicle, "vehicles": Vehicle })[type];

/** Imports one bundled unit of a type other than 'Mechs. */
export const loadBundledUnitDesign = async (type: BundledUnitType, header: Pick<IBundledDesignHeader, "id">): Promise<BundledUnit> =>
    loadBundledUnit(await loadBundledDesignData(type, header), getBundledUnitClass(type));

/** A bundled unit as the Master Unit List search matches it, imported only when it is opened. */
export interface IBundledUnitRef {
    type: BundledUnitType;
    header: IBundledDesignHeader;
}
