// The Technical Readout fields of a MegaMek unit file (TRO fields spec, "BLK import"). Shared by every BLK importer.
import { ITechnicalReadoutExport, TroProductionKey, TroTextKey } from "../data/technical-readout-interfaces";
import { IBlkFile, blkLines } from "./blk-file";

const TEXT: [TroTextKey, string][] = [
    ["overview", "overview"],
    ["capabilities", "capabilities"],
    ["deployment", "deployment"],
    ["battleHistory", "history"],
    ["notes", "notes"],
];

const PRODUCTION: [TroProductionKey, string][] = [
    ["manufacturer", "manufacturer"],
    ["primaryFactory", "primaryFactory"],
];

/** The `<systemManufacturers>` / `<systemModels>` types, to where the record keeps them. */
const SYSTEMS: Record<string, { production?: TroProductionKey; component?: string }> = {
    CHASSIS: { component: "chassis" },
    ENGINE: { component: "engine" },
    ARMOR: { component: "armor" },
    JUMP_JET: { component: "jumpJets" },
    COMMUNICATIONS: { production: "communications" },
    TARGETING: { production: "targeting" },
};

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", "#39": "'" };

/** MegaMek "none" values, as SSW writes them. */
const isNoMake = (text: string): boolean => /^(unknown|none)?$/i.test(text.trim());

/** MegaMek's fluff text as plain paragraphs: `<p>` and line ends split paragraphs, `<br>` breaks a line, other markup goes. */
export function blkPlainText(lines: string[]): string {
    return lines.join("\n\n")
        .replace(/<\s*br\s*\/?\s*>/gi, "\n")
        .replace(/<\s*\/?\s*p(\s[^<>]*)?>/gi, "\n\n")
        .replace(/<[^<>]*>/g, "")
        .replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g, (_match, name: string) => ENTITIES[name])
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.split("\n").map((line) => line.trim()).join("\n").trim())
        .filter((paragraph) => paragraph)
        .join("\n\n");
}

/** The `TYPE:value` lines of a block, by type in upper case. */
function systemLines(file: IBlkFile, tag: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const line of blkLines(file, tag)) {
        const colon = line.indexOf(":");
        if (colon <= 0) continue;
        const value = line.slice(colon + 1).trim();
        if (!isNoMake(value)) result[line.slice(0, colon).trim().toUpperCase()] = value;
    }
    return result;
}

export function readBlkTechnicalReadout(file: IBlkFile): ITechnicalReadoutExport {
    const result: ITechnicalReadoutExport = {};
    const production: Partial<Record<TroProductionKey, string>> = {};
    for (const [key, tag] of PRODUCTION) {
        const value = blkPlainText(blkLines(file, tag)).replace(/\s+/g, " ");
        if (!isNoMake(value)) production[key] = value;
    }
    const components: Record<string, string> = {};
    const makers = systemLines(file, "systemManufacturers");
    const models = systemLines(file, "systemModels");
    for (const [type, place] of Object.entries(SYSTEMS)) {
        const make = [makers[type], models[type]].filter((part) => part).join(" ");
        if (!make) continue;
        if (place.production) production[place.production] = make;
        if (place.component) components[place.component] = make;
    }
    if (Object.keys(production).length) result.production = production;
    if (Object.keys(components).length) result.components = components;
    const text: Partial<Record<TroTextKey, string>> = {};
    for (const [key, tag] of TEXT) {
        const value = blkPlainText(blkLines(file, tag));
        if (value) text[key] = value;
    }
    if (Object.keys(text).length) result.text = text;
    return result;
}
