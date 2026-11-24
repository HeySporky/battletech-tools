import { IGameSettings } from "../data/game-settings";

/** What a saved design stores of the shared settings block beside its rules edition (#324). Both are left out when unset. */
export interface IUnitGameSettingsExport {
    rulesLevel?: number;
    rulesets?: string[];
}

/**
 * The rules level and Special Rulesets a design is built under (#324). A save from before designs kept them has no
 * level of its own and shows the app-wide one; loading it writes nothing (calls 1-2).
 */
export class UnitGameSettings {
    private _rulesLevel: number | undefined = undefined;
    private _rulesets: string[] = [];

    /** The design's own rules level, or `fallback` (the app-wide level) for a save from before designs kept one. */
    public getRulesLevel(fallback: number): number {
        return this._rulesLevel ?? fallback;
    }

    public getRulesets(): string[] {
        return [...this._rulesets];
    }

    public set(rulesLevel: number, rulesets: string[]): void {
        this._rulesLevel = rulesLevel;
        this._rulesets = [...rulesets];
    }

    public export(): IUnitGameSettingsExport {
        return {
            ...(this._rulesLevel !== undefined ? { rulesLevel: this._rulesLevel } : {}),
            ...(this._rulesets.length > 0 ? { rulesets: [...this._rulesets] } : {}),
        };
    }

    public import(raw: { rulesLevel?: unknown; rulesets?: unknown }): void {
        this._rulesLevel = typeof raw.rulesLevel === "number" ? raw.rulesLevel : undefined;
        this._rulesets = Array.isArray(raw.rulesets) ? raw.rulesets.filter((id): id is string => typeof id === "string") : [];
    }
}

/** A Classic design other than a 'Mech, as the settings block reads and sets it. */
export interface IGameSettingsUnit {
    readonly gameSettings: UnitGameSettings;
    getRulesEdition(): string;
    setRulesEdition(tag: string): unknown;
    /** The tech base as a `btTechOptions` tag. */
    getTechTag(): string;
    setTechTag(tag: string): unknown;
    getEra(): { tag: string };
    /** Sets the era as the builder did before the block: a tech base the era closes moves first. */
    chooseEra(tag: string): void;
}

/** The settings block's values for a design. */
export function getUnitGameSettings(unit: IGameSettingsUnit, fallbackLevel: number): IGameSettings {
    return {
        rulesets: unit.gameSettings.getRulesets(),
        edition: unit.getRulesEdition(),
        rulesLevel: unit.gameSettings.getRulesLevel(fallbackLevel),
        techBase: unit.getTechTag(),
        era: unit.getEra().tag,
    };
}

/** Any unit that keeps Special Rulesets: a Classic design's settings, a 'Mech's own, or an Alpha Strike card's. */
export type IRulesetsHost = { readonly gameSettings: UnitGameSettings } | { getRulesets(): string[] } | { rulesets?: string[] };

/**
 * The Special Rulesets a unit was built under, read from its save (call 11): a Classic design's settings, a 'Mech's own,
 * or an Alpha Strike card's. None for no unit.
 */
export function getUnitRulesets(unit: IRulesetsHost | null | undefined): string[] {
    if (!unit) return [];
    if ("gameSettings" in unit) return unit.gameSettings.getRulesets();
    if ("getRulesets" in unit) return unit.getRulesets();
    return [...(unit.rulesets ?? [])];
}

/** Applies the settings block's values: edition, then tech base, then era, each only when it changed; then level and rulesets. */
export function applyUnitGameSettings(unit: IGameSettingsUnit, settings: IGameSettings): void {
    if (settings.edition !== unit.getRulesEdition()) unit.setRulesEdition(settings.edition);
    if (settings.techBase !== unit.getTechTag()) unit.setTechTag(settings.techBase);
    if (settings.era !== unit.getEra().tag) unit.chooseEra(settings.era);
    unit.gameSettings.set(settings.rulesLevel, settings.rulesets);
}

/** A sample loaded in place of a design keeps the design's level and rulesets: the picker listed it under them (call 19). */
export function keepUnitGameSettings(from: IGameSettingsUnit | undefined | null, next: IGameSettingsUnit, fallbackLevel: number): void {
    next.gameSettings.set(from?.gameSettings.getRulesLevel(fallbackLevel) ?? fallbackLevel, from?.gameSettings.getRulesets() ?? []);
}
