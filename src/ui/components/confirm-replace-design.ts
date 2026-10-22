import { BattleMech } from "../../classes/battlemech";
import { isUnmodifiedPrintedDroid } from "../../classes/printed-droid";
import { IAppGlobals } from "../app-router";

// Random ids, timestamps and the way back to an earlier edition differ between two copies of the same design,
// so they do not count as a change.
const withoutIds = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(withoutIds);
    }
    if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).filter(([key]) => !/uuid|updated|created|rulesEditionReturn/i.test(key)).map(([key, v]) => [key, withoutIds(v)]));
    }
    return value;
};
const same = (a: unknown, b: unknown): boolean => JSON.stringify(withoutIds(a)) === JSON.stringify(withoutIds(b));

interface IDesign {
    exportJSON(): string;
    getRulesEdition(): string;
    setRulesEdition(editionTag: string): string;
}

/**
 * Would replacing the design lose work: it is neither a blank design (in its own rules edition) nor one of the
 * saves as it stands?
 */
export function designWouldBeLost(current: IDesign | null | undefined, makeBlank: () => IDesign, saves: unknown[]): boolean {
    if (!current) {
        return false;
    }
    const blank = makeBlank();
    blank.setRulesEdition(current.getRulesEdition());
    const design = JSON.parse(current.exportJSON());
    return !same(design, JSON.parse(blank.exportJSON())) && !saves.some(save => same(design, JSON.parse(JSON.stringify(save))));
}

interface IReplaceDialogHost {
    openConfirmDialog(title: string, message: string, yesLabel: string, noLabel: string, confirm: Function, altLabel?: string, alt?: Function): void;
}

/** Before a creator's design is replaced, offer to save it first, to discard it, or to cancel. */
export function confirmReplaceDesign(
    appGlobals: IReplaceDialogHost,
    options: { what: string; lost: boolean; save: () => void; replace: () => void },
): void {
    if (!options.lost) {
        options.replace();
        return;
    }
    appGlobals.openConfirmDialog(
        "Replace the current " + options.what + "?",
        "The " + options.what + " in the creator has changes that are not saved. Save it before it is replaced?",
        "Save it first",
        "Cancel",
        () => { options.save(); options.replace(); },
        "Discard it",
        options.replace,
    );
}

/** Replace the 'mech in the creator (an import, a printed droid), offering to save the current one first. */
export function replaceCurrentBattleMech(appGlobals: IAppGlobals, replace: () => void): void {
    confirmReplaceDesign(appGlobals, {
        what: "'mech",
        // A printed droid nobody has changed comes back from the picker as it was.
        lost: !(appGlobals.currentBattleMech && isUnmodifiedPrintedDroid(appGlobals.currentBattleMech))
            && designWouldBeLost(appGlobals.currentBattleMech, () => new BattleMech(), appGlobals.battleMechSaves || []),
        save: () => {
            if (appGlobals.currentBattleMech) {
                appGlobals.saveBattleMechSaves([...(appGlobals.battleMechSaves || []), appGlobals.currentBattleMech.export(true)]);
            }
        },
        replace,
    });
}
