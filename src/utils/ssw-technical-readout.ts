import { ITechnicalReadoutExport, TroProductionKey, TroTextKey } from "../data/technical-readout-interfaces";

/** SSW writes "", "Unknown" and "None" where a design has no make. */
export function isSSWNoMake(value: unknown): boolean {
    if (typeof value === "number") {
        return false;
    }
    if (typeof value !== "string") {
        return true;
    }
    const text = value.trim().toLowerCase();
    return text === "" || text === "unknown" || text === "none";
}

/** The make text of an SSW value, or undefined for no make. Numbers (SSW fluff such as a bare "5") become text. */
function makeOf(value: unknown): string | undefined {
    if (isSSWNoMake(value)) {
        return undefined;
    }
    return String(value).trim();
}

function textOf(value: unknown): string | undefined {
    if (typeof value !== "string" && typeof value !== "number") {
        return undefined;
    }
    const text = String(value).trim();
    return text ? text : undefined;
}

const PRODUCTION: [TroProductionKey, (mech: any) => unknown][] = [
    ["manufacturer", (mech) => mech.techbase?.["@_manufacturer"]],
    ["primaryFactory", (mech) => mech.techbase?.["@_location"]],
    ["communications", (mech) => mech.fluff?.commsystem],
    ["targeting", (mech) => mech.fluff?.tandtsystem],
];

const COMPONENTS: [string, (mech: any) => unknown][] = [
    ["chassis", (mech) => mech.structure?.["@_manufacturer"]],
    ["engine", (mech) => mech.engine?.["@_manufacturer"]],
    ["armor", (mech) => mech.armor?.["@_manufacturer"]],
    ["jumpJets", (mech) => mech.fluff?.jumpjet_model],
];

const TEXT: [TroTextKey, string][] = [
    ["overview", "overview"],
    ["capabilities", "capabilities"],
    ["deployment", "deployment"],
    ["battleHistory", "battlehistory"],
    ["variants", "variants"],
    ["notableUnits", "notables"],
    ["notes", "additional"],
];

/** The Technical Readout fields of a parsed SSW `<mech>` (everything but the per-weapon makes). */
export function readSSWTechnicalReadout(mech: any): ITechnicalReadoutExport {
    const result: ITechnicalReadoutExport = {};
    if (!mech || typeof mech !== "object") {
        return result;
    }
    const production: Partial<Record<TroProductionKey, string>> = {};
    for (const [key, read] of PRODUCTION) {
        const make = makeOf(read(mech));
        if (make) {
            production[key] = make;
        }
    }
    if (Object.keys(production).length) {
        result.production = production;
    }
    const components: Record<string, string> = {};
    for (const [key, read] of COMPONENTS) {
        const make = makeOf(read(mech));
        if (make) {
            components[key] = make;
        }
    }
    if (Object.keys(components).length) {
        result.components = components;
    }
    const text: Partial<Record<TroTextKey, string>> = {};
    for (const [key, tag] of TEXT) {
        const value = textOf(mech.fluff?.[tag]);
        if (value) {
            text[key] = value;
        }
    }
    if (Object.keys(text).length) {
        result.text = text;
    }
    return result;
}
