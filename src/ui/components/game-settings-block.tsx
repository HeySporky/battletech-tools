import React, { useState, type JSX } from 'react';
import SpecialRulesetsStep from './special-rulesets-step';
import { findEraByTag } from '../../data/era-options';
import { changeGameSetting, describeGameSettingMove, GameSettingChange, getGameSettingOptions, getStaleGameSettingSteps, IGameSettings } from '../../data/game-settings';
import { isEarlierRulesEdition, RulesEditionUnitType } from '../../data/rules-editions';
import { GameSettingStep, getRulesetRemovingUnitType, UNIT_TYPE_PLURALS } from '../../data/special-rulesets';
import { btTechOptions } from '../../data/tech-options';
import EditionChoice from './edition-choice';
import RulesEditionSelect from './rules-edition-select';
import RulesLevelSelect from './rules-level-select';
import { applyUnitGameSettings, getUnitGameSettings, IGameSettingsUnit } from '../../classes/unit-game-settings';
import { IAppGlobals } from '../app-router';

export const STALE_WARNING = "not offered under the ticked rulesets";

/**
 * The shared game settings block (#324): Special Rulesets, Edition, Rules Level, Tech Base and Era, first on every
 * builder. Each step offers only what the steps above allow; a change moves later steps that no longer fit and says
 * so in one line under the block. The parent keeps the settings (on its design) and passes them back in, and learns
 * which step was edited.
 */
export default function GameSettingsBlock(props: {
    unitType: RulesEditionUnitType;
    settings: IGameSettings;
    onChange: (settings: IGameSettings, step: GameSettingStep | "rulesets") => void;
    /** Steps the creator does not have (call 6): not shown, never flagged, and their moves not reported. */
    hiddenSteps?: Array<"edition" | "techBase" | "era">;
}): JSX.Element {
    // The notice describes the settings its change made; once the design differs (replaced, or restored by a way back
    // to an edition) it no longer applies.
    const [notice, setNotice] = useState({ text: "", made: "" });
    const { settings } = props;
    const shownNotice = notice.made === JSON.stringify(settings) ? notice.text : "";
    const options = getGameSettingOptions(settings, props.unitType);
    const stale = getStaleGameSettingSteps(settings, props.unitType);

    const shown = (step: "edition" | "techBase" | "era") => !props.hiddenSteps?.includes(step);

    // Runs each change in turn and reports every move they made, or why a ruleset was refused.
    const change = (...changes: GameSettingChange[]): void => {
        let next = settings;
        const lines: string[] = [];
        for (const one of changes) {
            const result = changeGameSetting(next, one, props.unitType);
            next = result.settings;
            lines.push(...result.moves.filter((move) => move.step === "rulesLevel" || shown(move.step))
                .map((move) => describeGameSettingMove(move, next.edition)));
            if (result.removesUnitType) lines.push(`${UNIT_TYPE_PLURALS[props.unitType]} do not exist under ${result.refused?.name}`);
            else if (result.block) lines.push(result.block.reason);
            else if (result.refused) lines.push("Clashes with " + result.refused.name);
        }
        setNotice({ text: lines.join("; "), made: JSON.stringify(next) });
        props.onChange(next, changes[0]?.step ?? "rulesets");
    };

    const staleNote = (step: "edition" | "techBase" | "era") => shown(step) && stale.includes(step)
        ? <p className="color-red smaller-text">The stored value is {STALE_WARNING}.</p> : null;
    const techName = (tag: string) => btTechOptions.find((option) => option.tag === tag)?.name ?? tag;
    const era = findEraByTag(settings.era);
    const removedBy = getRulesetRemovingUnitType(settings.rulesets, props.unitType);

    return (
        <div className="game-settings-block">
            <SpecialRulesetsStep rulesets={settings.rulesets} unitType={props.unitType} notice={shownNotice}
                onToggle={(ids) => change(...ids.map((id): GameSettingChange => ({ step: "rulesets", toggle: id })))} />

            {shown("edition") ? <RulesEditionSelect unitType={props.unitType} value={settings.edition} editions={options.editions} staleLabel={STALE_WARNING} onChange={(value) => change({ step: "edition", value })} /> : null}
            {staleNote("edition")}
            <RulesLevelSelect editionTag={settings.edition} value={settings.rulesLevel} options={options.rulesLevels} staleLabel={STALE_WARNING} onChange={(value) => change({ step: "rulesLevel", value })} />
            {/* A unit type or an earlier rulebook with one tech base has no such choice: the field is hidden (call 6). */}
            {shown("techBase") ? <EditionChoice earlierEdition={isEarlierRulesEdition(settings.edition)} hidden={options.techBases.length === 1 && !stale.includes("techBase")}>
                <label>
                    Technology Base:
                    <select value={settings.techBase} onChange={(e) => change({ step: "techBase", value: e.currentTarget.value })}>
                        {stale.includes("techBase") ? <option value={settings.techBase}>{techName(settings.techBase)} ({STALE_WARNING})</option> : null}
                        {options.techBases.map((tag) => <option key={tag} value={tag}>{techName(tag)}</option>)}
                    </select>
                </label>
            </EditionChoice> : null}
            {staleNote("techBase")}
            {shown("era") && options.eras.length > 0 ? (
                <>
                    <label>
                        Era:
                        <select value={settings.era} onChange={(e) => change({ step: "era", value: e.currentTarget.value })}>
                            {stale.includes("era") ? <option value={settings.era}>{era?.name ?? settings.era} ({STALE_WARNING})</option> : null}
                            {options.eras.map((option) => <option key={option.tag} value={option.tag}>{option.name}</option>)}
                        </select>
                    </label>
                    {staleNote("era")}
                    {era?.description ? <p className="smaller-text">{era.description}</p> : null}
                </>
            ) : null}
            {/* An older save with such a ruleset ticked; untick it to build the design. */}
            {removedBy ? <p className="color-red smaller-text">{UNIT_TYPE_PLURALS[props.unitType]} do not exist under {removedBy.name}.</p> : null}
            {shownNotice ? <p className="smaller-text" role="status">{shownNotice}</p> : null}
        </div>
    );
}

/** A design's own rules level, or the app-wide one for a save from before designs kept one (or no design). A 'Mech keeps its own. */
export function unitRulesLevel(unit: IGameSettingsUnit | { getRulesLevel(fallback: number): number } | undefined | null, appSettings: { mechRulesFilter: number }): number {
    if (!unit) return appSettings.mechRulesFilter;
    return "gameSettings" in unit ? unit.gameSettings.getRulesLevel(appSettings.mechRulesFilter) : unit.getRulesLevel(appSettings.mechRulesFilter);
}

/** The last level picked is the default for the next new design and the roster searches (call 12). */
export function rememberRulesLevel(appGlobals: IAppGlobals, settings: IGameSettings, step: GameSettingStep | "rulesets"): void {
    if (step !== "rulesLevel") return;
    appGlobals.appSettings.mechRulesFilter = settings.rulesLevel;
    appGlobals.saveAppSettings(appGlobals.appSettings);
}

/**
 * The settings block wired to a design other than a 'Mech: the block's values go onto the design and a picked level
 * becomes the default. The builder saves the design (and does its own follow-up) in `onChange`.
 */
export function UnitGameSettingsBlock(props: {
    unitType: RulesEditionUnitType;
    unit: IGameSettingsUnit;
    appGlobals: IAppGlobals;
    onChange: (step: GameSettingStep | "rulesets") => void;
}): JSX.Element {
    const change = (settings: IGameSettings, step: GameSettingStep | "rulesets"): void => {
        applyUnitGameSettings(props.unit, settings);
        rememberRulesLevel(props.appGlobals, settings, step);
        props.onChange(step);
    };
    return <GameSettingsBlock unitType={props.unitType} settings={getUnitGameSettings(props.unit, props.appGlobals.appSettings.mechRulesFilter)} onChange={change} />;
}
