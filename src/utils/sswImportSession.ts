import { BattleMech } from "../classes/battlemech";
import { getLocalCustomContentDrafts, saveLocalCustomContentDrafts } from "../data/custom-content-local";
import type { ICustomContentDraft, ISSWUnresolvedItem } from "../data/custom-content-types";
import { isSSWCanonPending } from "../data/ssw/ssw-canon-pending-names";
import { getSSWXMLBasicInfo } from "./getSSWXMLBasicInfo";
import { buildDrafts, draftMatches, estimateSlots, IDraftSourceEntry } from "./sswDraftBuilder";

// Imports a batch of .ssw files: one result per file, the unresolved items turned into custom drafts (one per
// name across the batch), and the affected designs imported again with the drafts registered so they carry
// placeholders.

export interface ISSWImportFile { fileName: string; xml: string; }
export type SSWImportStatus = "clean" | "warnings" | "unresolved" | "canonPending" | "failed";
export interface ISSWImportResult {
    fileName: string;
    xml: string;
    sha256: string;
    designName: string;
    mech: BattleMech | null;
    status: SSWImportStatus;
    failureReason?: string;
    sswBV2: number | null;
    ourBV: number | null;
    unresolved: ISSWUnresolvedItem[];
    canonPending: string[];
    warnings: string[];
    draftIds: string[];
}

/** Most files one import takes. The bundled SSW corpus is 512 designs; a user batch is usually a handful. */
export const MAX_SSW_IMPORT_FILES = 200;
/** Largest single file read. A .ssw file is a few tens of kilobytes. */
export const MAX_SSW_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

/** Why a batch cannot be imported, checked on names and sizes before any file is read; null when it can. */
export function sswImportLimitError(files: { name: string; size: number }[]): string | null {
    if (files.length > MAX_SSW_IMPORT_FILES) {
        return `${files.length} files were selected. Import at most ${MAX_SSW_IMPORT_FILES} at a time.`;
    }
    const oversized = files.find((file) => file.size > MAX_SSW_IMPORT_FILE_BYTES);
    if (oversized) {
        return `"${oversized.name}" is larger than ${MAX_SSW_IMPORT_FILE_BYTES / (1024 * 1024)} MB, which is too big to be an .ssw file.`;
    }
    return null;
}

export async function sha256Hex(text: string): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

const importOne = (xml: string): BattleMech => {
    const mech = new BattleMech();
    mech.importSSWXML(xml);
    return mech;
};

const fail = (base: Pick<ISSWImportResult, "fileName" | "xml" | "sha256">, reason: string): ISSWImportResult => ({
    ...base, designName: base.fileName, mech: null, status: "failed", failureReason: reason, sswBV2: null, ourBV: null,
    unresolved: [], canonPending: [], warnings: [], draftIds: [],
});

// A registered draft resolves like any record, so the import doesn't report it. Find the drafts a design used
// (by tag in its export) and report them as the unresolved items they stand in for.
const draftsInUse = (mech: BattleMech, drafts: ICustomContentDraft[]): ISSWUnresolvedItem[] => {
    const exported = JSON.stringify(mech.export(true));
    return drafts
        .filter((draft) => exported.includes(JSON.stringify(draft.record.tag)))
        .map((draft) => ({
            kind: draft.kind, name: String(draft.record.name), sswName: String(draft.record.name),
            faction: draft.faction === "clan" ? "clan" : "is", sswType: "", location: "", slotIndex: -1,
            splitLocations: [], tons: null,
        }));
};

export async function runSSWImportSession(
    files: ISSWImportFile[],
    options: { existingDrafts?: ICustomContentDraft[]; save?: (drafts: ICustomContentDraft[]) => boolean; newId?: () => string } = {},
): Promise<{ results: ISSWImportResult[]; drafts: ICustomContentDraft[]; saved: boolean }> {
    const results: ISSWImportResult[] = [];
    const entries: IDraftSourceEntry[] = [];
    const existingDrafts = options.existingDrafts ?? getLocalCustomContentDrafts();

    for (const file of files) {
        const base = { fileName: file.fileName, xml: file.xml, sha256: await sha256Hex(file.xml) };
        let info: ReturnType<typeof getSSWXMLBasicInfo> = null;
        try {
            info = getSSWXMLBasicInfo(file.xml);
        } catch (error) {
            results.push(fail(base, `Not a readable SSW file: ${String(error)}`));
            continue;
        }
        if (!info) { results.push(fail(base, "Not an SSW 'Mech file (no <mech> element).")); continue; }
        if (info.mech_type !== "BattleMech") { results.push(fail(base, `${info.mech_type || "This unit type"} designs are not supported yet; only BattleMechs import.`)); continue; }
        try {
            const mech = importOne(file.xml);
            const designName = `${mech.name} ${mech.model}`.trim();
            const unresolved = [...mech.getSSWUnresolved(), ...draftsInUse(mech, existingDrafts)];
            for (const item of unresolved) {
                const slots = estimateSlots(item.slotIndex, mech.getCriticalOccupancy(item.location));
                entries.push({ item, slots, design: designName, source: { fileName: file.fileName, designs: [designName], sha256: base.sha256 }, xml: file.xml });
            }
            results.push({
                ...base, designName, mech, status: "clean", sswBV2: info.bv2 > 0 ? info.bv2 : null, ourBV: mech.getBattleValue(),
                unresolved, canonPending: unresolved.filter((item) => isSSWCanonPending(item.kind, item.name)).map((item) => item.name),
                warnings: mech.sswImportErrors.filter((error) => !unresolved.some((item) => error.includes(`'${item.name}'`) || error.includes(`'${item.sswName}'`))),
                draftIds: [],
            });
        } catch (error) {
            results.push(fail(base, `The import failed: ${String(error)}`));
        }
    }

    const drafts = buildDrafts(entries, existingDrafts, options.newId);
    const saved = (options.save ?? saveLocalCustomContentDrafts)(drafts);

    for (const result of results) {
        if (result.status === "failed") continue;
        result.draftIds = drafts.filter((draft) => result.unresolved.some((item) => draftMatches(draft, item))).map((draft) => draft.id);
        if (result.draftIds.length > 0) {
            // Again, now that the drafts are registered, so the design carries its placeholders.
            result.mech = importOne(result.xml);
            result.ourBV = result.mech.getBattleValue();
            const missingTons = result.mech.getTonnage() - result.mech.getCurrentTonnage();
            if (missingTons > 0) {
                result.warnings.push(`The design weighs ${result.mech.getCurrentTonnage()} of ${result.mech.getTonnage()} tons: SSW files don't give each item's weight, so placeholders count as 0 tons until their stats are entered.`);
            }
        }
        const otherUnresolved = result.unresolved.filter((item) => !isSSWCanonPending(item.kind, item.name) && item.kind !== "cockpit");
        result.status = otherUnresolved.length > 0 ? "unresolved"
            : result.canonPending.length > 0 ? "canonPending"
                : result.warnings.length > 0 || result.unresolved.length > 0 ? "warnings" : "clean";
    }
    return { results, drafts, saved };
}
