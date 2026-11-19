import React, { type JSX } from 'react';
import { editionAllowsConstruction, editionEditsPrintedUnitsAfterWarning, getRulesEdition, getRulesLevelOptionsForEdition, getShownRulesLevel } from '../../data/rules-editions';
import { isUnmodifiedPrintedDroid } from '../../classes/printed-droid';
import { IAppGlobals } from '../app-router';

/** The current 'Mech design's own rules level, or the app-wide one for a design that has none yet (#324). */
export function mechRulesLevel(appGlobals: IAppGlobals): number {
    return appGlobals.currentBattleMech?.getRulesLevel(appGlobals.appSettings.mechRulesFilter) ?? appGlobals.appSettings.mechRulesFilter;
}

type Mech = NonNullable<IAppGlobals["currentBattleMech"]>;

/**
 * A 'Mech picked in place of the current design (a printed droid, a sample) keeps the design's rules level and
 * rulesets: the picker listed it under them (#324).
 */
export function keepDesignSettings(appGlobals: IAppGlobals, next: Mech): Mech {
    const level = mechRulesLevel(appGlobals);
    next.applyGameSettings({ ...next.getGameSettings(level), rulesLevel: level, rulesets: appGlobals.currentBattleMech?.getRulesets() ?? [] });
    return next;
}

/** Why the current 'Mech design cannot be changed at the selected rules level, or null when it can. */
export function getDesignLockNote(appGlobals: IAppGlobals): string | null {
    const mech = appGlobals.currentBattleMech;
    if (!mech) {
        return null;
    }
    const editionTag = mech.getRulesEdition();
    const level = getShownRulesLevel(editionTag, mechRulesLevel(appGlobals));
    if (editionAllowsConstruction(editionTag, level)) {
        return null;
    }
    const names = getRulesLevelOptionsForEdition(editionTag);
    const levelName = names.find(option => option.id === level)?.name;
    const buildName = names.find(option => option.id === getRulesEdition(editionTag).constructionLevel)?.name;
    return isUnmodifiedPrintedDroid(mech)
        ? `${levelName} plays the printed droids only.`
        : `${levelName} plays the printed droids only: building a droid needs ${buildName}.`;
}

/**
 * Confirm that editing a printed unit moves the design to the edition's construction level, and raise the design's
 * rules level to it (and the app-wide default with it). Cancelling changes nothing.
 */
export function confirmEditPrintedDroid(appGlobals: IAppGlobals): void {
    const editionTag = appGlobals.currentBattleMech?.getRulesEdition();
    const construction = getRulesEdition(editionTag).constructionLevel ?? 0;
    const buildName = getRulesLevelOptionsForEdition(editionTag).find(option => option.id === construction)?.name;
    if (window.confirm(`Editing this droid moves the design to ${buildName}, the rules for designing droids. Continue?`)) {
        const mech = appGlobals.currentBattleMech;
        const level = Math.max(mechRulesLevel(appGlobals), construction);
        if (mech) {
            mech.applyGameSettings({ ...mech.getGameSettings(level), rulesLevel: level });
            appGlobals.saveCurrentBattleMech(mech);
        }
        const appSettings = appGlobals.appSettings;
        appSettings.mechRulesFilter = level;
        appGlobals.saveAppSettings(appSettings);
    }
}

/**
 * A Mech Creator step's main column. At a rules level whose edition has no construction rules it says why, offers
 * the edit warning where the level allows one, and disables every field.
 */
export default function DesignLockColumn(props: { appGlobals: IAppGlobals; children: React.ReactNode }): JSX.Element {
    const note = getDesignLockNote(props.appGlobals);
    const editionTag = props.appGlobals.currentBattleMech?.getRulesEdition();
    const level = getShownRulesLevel(editionTag, mechRulesLevel(props.appGlobals));
    return (
        <div className="col-md-9 col-lg-10">
            {note ? (
                <p className="color-red smaller-text">
                    {note}{" "}
                    {editionEditsPrintedUnitsAfterWarning(editionTag, level) ? (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => confirmEditPrintedDroid(props.appGlobals)}>Edit this droid</button>
                    ) : null}
                </p>
            ) : null}
            {/* A disabled fieldset stops form controls only; clickable lists (Step 6's criticals) need the pointer turned off too. */}
            <fieldset className="design-lock" disabled={!!note} style={{ border: 0, margin: 0, padding: 0, minWidth: 0, pointerEvents: note ? "none" : undefined }}>
                {props.children}
            </fieldset>
        </div>
    );
}
