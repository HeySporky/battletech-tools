// Test support, not app code: the bundled SSW corpus checks, run in shards (ssw-corpus-1..4.test.ts) so the ~500
// full imports spread over the test workers. Each design is imported once and every check runs on that import.
import { sswMechs } from "../data/ssw/sswMechs";
import { getSSWXMLBasicInfo } from "../utils/getSSWXMLBasicInfo";
import { BattleMech } from "./battlemech";

export const SSW_CORPUS_SHARDS = 4;

/**
 * Import errors the corpus may still raise. New spellings go in the records' altNames; this list only shrinks as
 * missing canon records are added (importedEquipment.test.ts checks each entry still happens).
 */
export const SSW_KNOWN_MISSING_ITEMS = [
    "Cannot find any equipment named: 'Electronic Warfare Equipment'",
];

// SSW's names for chassis components ("XL Engine", "Extra-Light Gyro", "Endo-Steel"). SSW's engine techbase
// attribute (0 Inner Sphere, 1 Clan) picks the Inner Sphere or Clan XL/XXL engine.
const ENGINES: Record<string, string> = {
    "Fusion Engine": "standard", "XL Engine/0": "xl", "XL Engine/1": "clan_xl", "XXL Engine/0": "xxl",
    "XXL Engine/1": "clan_xxl", "Light Fusion Engine": "light", "Compact Fusion Engine": "compact",
    "I.C.E. Engine": "ice", "Fuel-Cell Engine": "cell", "Fission Engine": "fission",
    "Primitive Fusion Engine": "primitive",
};
const GYROS: Record<string, string> = {
    "Standard Gyro": "standard", "Extra-Light Gyro": "xl", "Compact Gyro": "compact", "Heavy-Duty Gyro": "heavy-duty",
};
const STRUCTURES: Record<string, string> = {
    "Standard Structure": "standard", "Endo-Steel": "endo-steel", "Endo-Composite": "endo-composite",
    "Composite Structure": "composite", "Reinforced Structure": "reinforced", "Industrial Structure": "industrial",
};

export interface ISSWCorpusResult {
    designs: number;
    /** Imported tonnage, or the JSON round trip's tonnage or name, differs from the file. */
    mismatches: string[];
    /** "_allocateCritical failed" warnings during import. */
    failedAllocations: string[];
    /** Engine, gyro or structure imported as another type, or structure slots left unplaced. */
    wrongComponents: string[];
    /** "Cannot find ..." import errors. */
    unresolved: Set<string>;
}

/** The designs of one shard: every SSW_CORPUS_SHARDS-th design from `shard`. */
export const getSSWCorpusShard = (shard: number): string[] =>
    sswMechs.filter((_xml, index) => index % SSW_CORPUS_SHARDS === shard);

export function checkSSWCorpus(designs: string[]): ISSWCorpusResult {
    const result: ISSWCorpusResult = { designs: designs.length, mismatches: [], failedAllocations: [], wrongComponents: [], unresolved: new Set() };
    const { warn, log } = console;
    let label = "";
    console.warn = (message?: unknown) => {
        if (String(message).startsWith("_allocateCritical failed")) result.failedAllocations.push(`${label}: ${message}`);
    };
    console.log = () => {};
    try {
        for (const xml of designs) {
            const info = getSSWXMLBasicInfo(xml)!;
            label = `${info.name} ${info.model}`;
            const mech = new BattleMech();
            mech.importSSWXML(xml);

            if (mech.getTonnage() !== +info.tonnage) result.mismatches.push(`${label}: ${mech.getTonnage()} t, file says ${info.tonnage}`);

            const engine = /<engine [^>]*techbase="(\d)"[^>]*>([^<]+)</.exec(xml)!;
            const gyro = /<gyro[^>]*>([^<]+)</.exec(xml)![1];
            const structure = /<structure[^>]*>\s*<type>([^<]+)</.exec(xml)![1];
            const expectedEngine = ENGINES[`${engine[2]}/${engine[1]}`] ?? ENGINES[engine[2]];
            if (mech.getEngineType().tag !== expectedEngine) result.wrongComponents.push(`${label}: ${engine[2]} -> ${mech.getEngineType().tag}`);
            if (mech.getGyro().tag !== GYROS[gyro]) result.wrongComponents.push(`${label}: ${gyro} -> ${mech.getGyro().tag}`);
            if (mech.getInternalStructureType() !== STRUCTURES[structure]) {
                result.wrongComponents.push(`${label}: ${structure} -> ${mech.getInternalStructureType()}`);
            }
            const unplacedStructure = mech.getUnallocatedCriticals().filter((slot) => slot?.tag === STRUCTURES[structure]);
            if (unplacedStructure.length > 0) result.wrongComponents.push(`${label}: ${unplacedStructure.length} ${structure} slots unplaced`);

            for (const error of mech.sswImportErrors.filter((entry) => entry.startsWith("Cannot find"))) result.unresolved.add(error);

            const reimported = new BattleMech(mech.exportJSON());
            if (reimported.getTonnage() !== mech.getTonnage() || reimported.getName() !== mech.getName()) {
                result.mismatches.push(`${label}: JSON round trip gave ${reimported.getName()} at ${reimported.getTonnage()} t`);
            }
        }
    } finally {
        console.warn = warn;
        console.log = log;
    }
    return result;
}
