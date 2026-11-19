import { BattleMech } from "../classes/battlemech";
import { IBundledDesignHeader, loadBundledMech } from "../utils/bundled-designs";
import type { IClassicDesignEntry } from "../utils/classicMULMatch";
import { loadBundledDesignData, loadBundledIndex } from "./bundled-units";

// The bundled 'Mechs (#241), from the Skunk Werks files: see bundled-units.ts for the notice.

/** The bundled 'Mechs' headers, fetched the first time a list needs them. */
export const loadBundledMechIndex = (): Promise<IBundledDesignHeader[]> => loadBundledIndex("mechs");

/** Imports one bundled 'Mech; an OmniMech comes in the configuration asked for, else its own. */
export async function loadBundledMechDesign(header: Pick<IBundledDesignHeader, "id">, configuration?: string): Promise<BattleMech> {
    const mech = loadBundledMech(await loadBundledDesignData("mechs", header));
    return configuration ? mech.cloneOmniConfiguration(configuration) as BattleMech : mech;
}

/** A bundled 'Mech as the Master Unit List search matches it: an OmniMech's configuration is its own entry. */
export interface IBundledMechRef {
    header: IBundledDesignHeader;
    configuration?: string;
    bv: number;
}

/** Index entries for the bundled 'Mechs, as getClassicMechEntries gives them for designs already imported. */
export const getBundledMechEntries = (headers: IBundledDesignHeader[]): IClassicDesignEntry<IBundledMechRef>[] => headers.flatMap((header) => [
    ...(header.configs ?? []).flatMap((config) => {
        const design = { header, configuration: config.name, bv: config.bv };
        const fingerprint = config.layout;
        return [{ chassis: header.name, model: config.name, design, fingerprint }, { chassis: header.name, model: header.model + " " + config.name, design, fingerprint, alias: true }];
    }),
    { chassis: header.name, model: header.model, design: { header, bv: header.bv }, fingerprint: header.layout, ...(header.configs ? { alias: true } : {}), ...(header.mulId ? { mulId: header.mulId } : {}) },
]);
