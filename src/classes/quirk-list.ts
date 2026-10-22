import { IAssignedQuirk, IQuirk } from "../data/quirk-interfaces";
import { getQuirk, getQuirkPoints } from "../data/quirk-registry";

const copy = (quirk: IAssignedQuirk): IAssignedQuirk => ({ ...quirk });

/**
 * Two assignments of one quirk are the same when they share a target; a range bracket also tells them apart (one Improved
 * Targeting per bracket), but a value does not (Rugged 1 and Rugged 2 are one quirk twice).
 */
const sameAssignment = (record: IQuirk, a: IAssignedQuirk, b: IAssignedQuirk): boolean =>
    a.tag === b.tag && a.equipmentUuid === b.equipmentUuid && a.location === b.location
    && (record.parameter?.kind !== "range-band" || a.parameter === b.parameter);

const inYears = (quirk: IAssignedQuirk, year: number | undefined): boolean =>
    year === undefined || ((quirk.fromYear === undefined || year >= quirk.fromYear) && (quirk.toYear === undefined || year <= quirk.toYear));

/** The quirks assigned to one unit. */
export class QuirkList {
    private _quirks: IAssignedQuirk[] = [];

    public getAll(): IAssignedQuirk[] {
        return this._quirks.map(copy);
    }

    /** Adds the quirk; null on success, otherwise why not: "unknown quirk", "duplicate", "only once per unit" or "excluded by <name>". */
    public add(quirk: IAssignedQuirk): string | null {
        const record = getQuirk(quirk.tag);
        if (!record) {
            return "unknown quirk";
        }
        if (this._quirks.some((other) => sameAssignment(record, other, quirk))) {
            return "duplicate";
        }
        if (record.once && this._quirks.some((other) => getQuirk(other.tag)?.tag === record.tag)) {
            return "only once per unit";
        }
        for (const other of this._quirks) {
            const otherRecord = getQuirk(other.tag);
            if (otherRecord && ((record.excludes ?? []).includes(otherRecord.tag) || (otherRecord.excludes ?? []).includes(record.tag))) {
                return `excluded by ${otherRecord.name}`;
            }
        }
        this._quirks.push(copy(quirk));
        return null;
    }

    public remove(index: number): void {
        this._quirks.splice(index, 1);
    }

    /** The saved form; undefined when there are none, so a unit without quirks saves as before. */
    public export(): IAssignedQuirk[] | undefined {
        return this._quirks.length ? this.getAll() : undefined;
    }

    /** Loads a save's quirks, keeping tags this browser does not know (another player's custom quirk). */
    public import(data: unknown): void {
        this._quirks = Array.isArray(data)
            ? data.filter((entry): entry is IAssignedQuirk => typeof entry === "object" && entry !== null && typeof (entry as IAssignedQuirk).tag === "string").map(copy)
            : [];
    }

    /**
     * The assignments in force: weapon quirks only on installed weapons, and only those whose years include `year`.
     * With `year` undefined, as in the builder and on the record sheet, every assignment counts whatever its years.
     */
    public getActive(installedUuids: string[], year: number | undefined): IAssignedQuirk[] {
        return this._quirks
            .filter((quirk) => !quirk.equipmentUuid || installedUuids.includes(quirk.equipmentUuid))
            .filter((quirk) => inYears(quirk, year))
            .map(copy);
    }

    /**
     * The positive and negative point totals of the active quirks, so a quirk on a weapon not installed counts nothing;
     * `unitMaxDamage` is the sum of all non-physical weapons' maximum damage.
     */
    public getPointTotals(installedUuids: string[], unitMaxDamage: number, weaponDamage: (uuid: string) => number): { positive: number; negative: number } {
        let positive = 0;
        let negative = 0;
        for (const quirk of this.getActive(installedUuids, undefined)) {
            const record = getQuirk(quirk.tag);
            if (!record) {
                continue;
            }
            const damage = record.cost.per?.scope === "weapon" && quirk.equipmentUuid ? weaponDamage(quirk.equipmentUuid) : unitMaxDamage;
            const points = getQuirkPoints(record, quirk, damage);
            if (points > 0) {
                positive += points;
            } else {
                negative += points;
            }
        }
        return { positive, negative };
    }
}
