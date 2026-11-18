/**
 * Cited calculation steps (#599): a Battle Value or cost calculation records each step it takes, and each step
 * names the rule it comes from.
 *
 * The citations live in a definitions table per calculation, written by whoever read the page. The calculation adds
 * steps by id, so the breakdown a player reads is the calculation itself and not a second description of it.
 */
import { CALC_SOURCES } from "./calc-sources";

/**
 * `cited`: the rule was read on the cited page and the step follows it.
 * `provisional`: the books do not cover the case; the note says what we chose and why.
 * `source-missing`: the rule points to a document our library does not hold; the note names it.
 */
export type CalcStepStatus = "cited" | "provisional" | "source-missing";
export type CalcKind = "battle-value" | "cost";

/** `source` is a key of CALC_SOURCES; `page` is as printed ("302", "302-304"). */
export interface ICalcCitation { source: string; page: string }

export interface ICalcStepDef {
    section: string;
    cites: ICalcCitation[];
    status: CalcStepStatus;
    note?: string;
}
export type CalcStepDefs = Record<string, ICalcStepDef>;

export interface ICalcStep extends ICalcStepDef {
    /** The definition's key. It repeats for per-item steps (one per weapon, one per location). */
    id: string;
    /** Plain text: never markup. */
    label: string;
    /** The arithmetic as shown to the reader, plain text. */
    detail?: string;
    /** This step's result. */
    value?: number;
    /** The running total after this step, where that helps. */
    total?: number;
    /** A section subtotal or the final line. */
    emphasis?: boolean;
}

export interface ICalcBreakdown {
    kind: CalcKind;
    edition: string;
    scheme?: "none" | "bv1" | "bv2";
    steps: ICalcStep[];
    /** Null where the edition has no such value (no Battle Value before the Master Rules). */
    result: number | null;
    /** Plain-text notes on the whole breakdown (a construction ruleset it was worked out under). */
    notes?: string[];
}

export interface ICalcStepInput {
    label: string;
    detail?: string;
    value?: number;
    total?: number;
    emphasis?: boolean;
    /** Added to the definition's: a per-item value that comes from another book. */
    cites?: ICalcCitation[];
}

export class CalcTrace {
    public readonly steps: ICalcStep[] = [];

    constructor(private readonly _defs: CalcStepDefs) {}

    public add(id: string, step: ICalcStepInput): void {
        const def = Object.prototype.hasOwnProperty.call(this._defs, id) ? this._defs[id] : undefined;
        if (!def) throw new Error(`No step definition: ${id}`);
        const { cites, ...rest } = step;
        this.steps.push({ ...def, ...rest, id, cites: [...def.cites, ...(cites ?? [])] });
    }
}

export const formatCitation = (cite: ICalcCitation): string => {
    const page = cite.page.trim();
    return `${CALC_SOURCES[cite.source]?.short ?? cite.source} ${/[-,]/.test(page) ? "pp." : "p."}${page}`;
};

export const formatCitations = (cites: ICalcCitation[]): string => cites.map(formatCitation).join("; ");

export const escapeCalcText = (value: unknown): string => value === null || typeof value === "undefined" ? "" : String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** A number as a step shows it: whole numbers as they are, others to at most three places. */
export const formatCalcNumber = (value: number): string => Number.isInteger(value) ? String(value) : String(Math.round(value * 1000) / 1000);

const STATUS_PREFIX: Record<Exclude<CalcStepStatus, "cited">, string> = {
    "provisional": "provisional",
    "source-missing": "source not yet in NGCFells's library",
};

/** One step as a line of plain text: "Armor: 152 x 2.5 = 380 (TM p.302) -> 504.5". */
export const formatCalcStep = (step: ICalcStep): string => {
    let line = step.label;
    if (step.detail) line += `: ${step.detail}`;
    if (typeof step.value === "number") line += `${step.detail ? " =" : ":"} ${formatCalcNumber(step.value)}`;
    const cites = formatCitations(step.cites);
    if (cites) line += ` (${cites})`;
    if (step.status !== "cited") line += ` (${STATUS_PREFIX[step.status]}: ${step.note ?? ""})`;
    if (typeof step.total === "number") line += ` -> ${formatCalcNumber(step.total)}`;
    return line;
};

/** The steps as the old calculation logs were: a heading per section, a line per step. Everything is escaped. */
export const renderCalcStepsHtml = (steps: ICalcStep[]): string => {
    let html = "";
    let section: string | undefined;
    for (const step of steps) {
        if (step.section !== section) {
            section = step.section;
            html += `<strong>${escapeCalcText(section)}</strong><br />`;
        }
        const line = escapeCalcText(formatCalcStep(step));
        html += `${step.emphasis ? `<strong>${line}</strong>` : line}<br />`;
    }
    return html;
};

/** The steps as the cost table: a heading row per section, a row per step (label, value, citation). Everything is escaped. */
export const renderCalcStepsTable = (steps: ICalcStep[]): string => {
    let html = "<table class=\"cbill-cost\"><tbody>";
    let section: string | undefined;
    for (const step of steps) {
        if (step.section !== section) {
            section = step.section;
            html += `<tr><td colspan="3"><strong>${escapeCalcText(section)}</strong></td></tr>`;
        }
        let label = escapeCalcText(step.label);
        let value = typeof step.value === "number" ? escapeCalcText(step.value.toLocaleString("en-US", { maximumFractionDigits: 3 })) : "";
        if (step.emphasis) {
            label = `<strong>${label}</strong>`;
            if (value) value = `<strong>${value}</strong>`;
        }
        if (step.detail) label += `<br /><span class="smaller-text">${escapeCalcText(step.detail)}</span>`;
        let cites = escapeCalcText(formatCitations(step.cites));
        if (step.status !== "cited") cites += `${cites ? " " : ""}(${escapeCalcText(STATUS_PREFIX[step.status])}: ${escapeCalcText(step.note ?? "")})`;
        html += `<tr><td>${label}</td><td>${value}</td><td class="smaller-text">${cites}</td></tr>`;
    }
    return `${html}</tbody></table>`;
};

/** What is wrong with a definitions table, in words. Empty when it is clean. */
export const findCalcDefProblems = (defs: CalcStepDefs): string[] => {
    const problems: string[] = [];
    for (const [id, def] of Object.entries(defs)) {
        if (!def.section.trim()) problems.push(`${id}: no section`);
        for (const cite of def.cites) {
            if (!CALC_SOURCES[cite.source]) problems.push(`${id}: unknown source "${cite.source}"`);
            if (!cite.page.trim()) problems.push(`${id}: a citation of "${cite.source}" has no page`);
        }
        if (def.status === "cited" && def.cites.length === 0) problems.push(`${id}: cited, but names no source`);
        if (def.status !== "cited" && !def.note?.trim()) problems.push(`${id}: ${def.status} needs a note`);
    }
    return problems;
};
