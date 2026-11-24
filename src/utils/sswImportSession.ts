import { BattleMech } from "../classes/battlemech";
import { getLocalCustomContentDrafts, saveLocalCustomContentDrafts, saveLocalCustomContentEvidence } from "../data/custom-content-local";
import type { ICustomContentDraft, ISSWUnresolvedItem } from "../data/custom-content-types";
import { isSSWCanonPending } from "../data/ssw/ssw-canon-pending-names";
import { getSSWXMLBasicInfo } from "./getSSWXMLBasicInfo";
import { buildDrafts, draftMatches, estimateItemSlots, guessTonnage, importQuestionKey, IDraftSourceEntry } from "./sswDraftBuilder";
import type { ISSWImportAnswer, ISSWImportQuestion } from "./sswDraftBuilder";
import { sha256HexSync } from "./sha256";

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

/** SHA-256 of the text as hex. crypto.subtle only exists on a secure origin (https or localhost); elsewhere, such as
 * LAN dev over http, the hash is computed in script. */
export async function sha256Hex(text: string): Promise<string> {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) return sha256HexSync(text);
    const digest = await subtle.digest("SHA-256", new TextEncoder().encode(text));
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
        .filter((draft) => draft.kind !== "quirk" && exported.includes(JSON.stringify(draft.record.tag)))
        .map((draft) => ({
            kind: draft.kind, name: String(draft.record.name), sswName: String(draft.record.name),
            faction: draft.faction === "clan" ? "clan" : "is", sswType: "", location: "", slotIndex: -1,
            splitLocations: [], tons: null,
        }));
};

export interface ISSWImportAnalysis {
    results: ISSWImportResult[];
    questions: ISSWImportQuestion[];
    /** Internal: what accept turns into drafts, and the source text it stores as evidence. */
    entries: IDraftSourceEntry[];
    evidence: Record<string, string>;
}
export interface ISSWImportOptions {
    existingDrafts?: ICustomContentDraft[];
    save?: (drafts: ICustomContentDraft[]) => boolean;
    /** Stores the source text of the files that made drafts, by SHA-256 (the evidence store). */
    saveEvidence?: (evidence: Record<string, string>, drafts: ICustomContentDraft[]) => boolean;
    newId?: () => string;
}
export type { ISSWImportAnswer, ISSWImportQuestion };

const statusOf = (result: ISSWImportResult): SSWImportStatus => {
    const otherUnresolved = result.unresolved.filter((item) => !isSSWCanonPending(item.kind, item.name) && item.kind !== "cockpit");
    return otherUnresolved.length > 0 ? "unresolved"
        : result.canonPending.length > 0 ? "canonPending"
            : result.warnings.length > 0 || result.unresolved.length > 0 ? "warnings" : "clean";
};

const requiredFor =(kind: ISSWUnresolvedItem["kind"]): ISSWImportQuestion["required"] =>
    kind === "equipment" ? ["techBase", "tons", "slots"] : kind === "ammunition" ? ["techBase", "tons"] : kind === "quirk" ? [] : ["techBase"];

/** The first half of an import: reads the files and finds the unknown items with best guesses. Saves nothing. */
export async function analyzeSSWImport(files: ISSWImportFile[], existingDrafts: ICustomContentDraft[] = getLocalCustomContentDrafts()): Promise<ISSWImportAnalysis> {
    const results: ISSWImportResult[] = [];
    const entries: IDraftSourceEntry[] = [];
    const evidence: Record<string, string> = {};
    // Per design: the tonnage gap and how many of its unknown items have no weight, for the tons guess.
    const gaps = new Map<string, { gap: number; unknownWeight: number }>();

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
            const unweighed = unresolved.filter((item) => item.kind !== "cockpit" && item.tons === null && !isSSWCanonPending(item.kind, item.name) && !existingDrafts.some((draft) => draftMatches(draft, item)));
            const ammoBins = unweighed.filter((item) => item.kind === "ammunition").length;
            // An SSW ammo entry is one 1-ton lot: take those off the gap, and split the rest over the other items.
            gaps.set(designName, { gap: mech.getTonnage() - mech.getCurrentTonnage() - ammoBins, unknownWeight: unweighed.length - ammoBins });
            for (const item of unresolved) {
                const { slots, exact } = estimateItemSlots(item, (location) => mech.getCriticalOccupancy(location));
                entries.push({ item, slots, slotsExact: exact, design: designName, source: { fileName: file.fileName, designs: [designName], sha256: base.sha256 } });
                evidence[base.sha256] = file.xml;
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

    const questions: ISSWImportQuestion[] = [];
    for (const entry of entries) {
        const { item } = entry;
        if (item.kind === "cockpit" || isSSWCanonPending(item.kind, item.name) || existingDrafts.some((draft) => draftMatches(draft, item))) continue;
        const key = importQuestionKey(item);
        const found = questions.find((question) => question.key === key);
        if (found) {
            if (!found.designs.includes(entry.design)) found.designs.push(entry.design);
            continue;
        }
        const design = gaps.get(entry.design);
        questions.push({
            key, kind: item.kind, name: item.name, designs: [entry.design], required: requiredFor(item.kind),
            guess: {
                techBase: item.faction, tons: item.tons ?? (item.kind === "ammunition" ? 1 : guessTonnage(design?.gap ?? 0, design?.unknownWeight ?? 1)),
                slots: entry.slots, unknown: { techBase: false, tons: false, slots: false },
            },
        });
    }
    for (const result of results) if (result.status !== "failed") result.status = statusOf(result);
    return { results, questions, entries, evidence };
}

/** The second half: builds the drafts from the importer's answers, saves them and imports the designs again. */
export async function acceptSSWImport(
    analysis: Pick<ISSWImportAnalysis, "results" | "entries" | "evidence"> & Partial<Pick<ISSWImportAnalysis, "questions">>,
    answers: Record<string, ISSWImportAnswer>,
    options: ISSWImportOptions = {},
): Promise<{ results: ISSWImportResult[]; drafts: ICustomContentDraft[]; saved: boolean; evidenceSaved: boolean }> {
    const { results, entries, evidence } = analysis;
    const existingDrafts = options.existingDrafts ?? getLocalCustomContentDrafts();
    // An I do not know on a blank field keeps the best guess.
    const kept: Record<string, ISSWImportAnswer> = { ...answers };
    for (const question of analysis.questions ?? []) {
        const answer = kept[question.key];
        if (!answer) continue;
        kept[question.key] = {
            ...answer,
            techBase: answer.techBase ?? (answer.unknown.techBase ? question.guess.techBase : null),
            tons: answer.tons ?? (answer.unknown.tons ? question.guess.tons : null),
            slots: answer.slots ?? (answer.unknown.slots ? question.guess.slots : null),
        };
    }
    const drafts = buildDrafts(entries, existingDrafts, options.newId, kept);
    const saved = (options.save ?? saveLocalCustomContentDrafts)(drafts);
    const evidenceSaved = Object.keys(evidence).length === 0 || (options.saveEvidence ?? saveLocalCustomContentEvidence)(evidence, drafts);

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
        result.status = statusOf(result);
    }
    return { results, drafts, saved, evidenceSaved };
}

/** Analyze, then accept with the best guesses as the answers (no questions asked). */
export async function runSSWImportSession(
    files: ISSWImportFile[],
    options: ISSWImportOptions = {},
): Promise<{ results: ISSWImportResult[]; drafts: ICustomContentDraft[]; saved: boolean; evidenceSaved: boolean }> {
    const existingDrafts = options.existingDrafts ?? getLocalCustomContentDrafts();
    const analysis = await analyzeSSWImport(files, existingDrafts);
    // No questions asked: the guesses stand, except tons. This path always left placeholders at 0 tons (and said so).
    const answers = Object.fromEntries(analysis.questions.map((question) => [question.key, { ...question.guess, tons: null }]));
    return acceptSSWImport(analysis, answers, { ...options, existingDrafts });
}
