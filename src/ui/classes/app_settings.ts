import { IASMULUnit } from "../../classes/alpha-strike-unit";
import { DEFAULT_MUL_SOURCE_SELECTION, MULSourceSelection, normalizeMULSourceSelection } from "../../data/mul-list-items";
import { normalizeStandingSelection, UNIT_STANDING_ORDER, UnitStanding } from "../../utils/unit-standing";
import { ESaveDataMode } from "../../dataSavesStorage";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../../data/rules-level-options";
import { IMULSearchFilters, newMULSearchFilters } from "../../utils/mulSearchFilters";

/** BattleMech: the Classic MUL search covers 'Mechs first (Ideas #84, round 1). */
export const CBT_MUL_DEFAULT_TYPE = 18;

/** 2: levels 5 Apocryphal, 6 Custom Homebrew, 7 Munchkin. Before it, 5 was Custom Homebrew. */
const RULES_LEVEL_SCHEME = 2;

export class AppSettings {
    developerMenu: boolean = false;
    alphaStrikeMeasurementsInHexes: boolean = false;
    uiTheme: string = "";
    equipmentFilter: string = "";
    installEquipCategory: string = "";

    mechRulesFilter: number = 2; // Defaults to "Standard"
    mechNameFilter: string = "";
    // The Classic Roster's Master Unit List search, kept apart from the Alpha Strike one.
    cbtMULSearch: IMULSearchFilters = newMULSearchFilters({ type: CBT_MUL_DEFAULT_TYPE });

    storageLocation: ESaveDataMode = ESaveDataMode.localStorage;

    alphasStrikeCachedSearchResults: IASMULUnit[] = [];
    alphaStrikeSearchTerm: string = "";
    alphaStrikeInPlayColumns: number = 2;
    alphaStrikeSearchRules: string = "";
    alphaStrikeSearchTech: string = "";
    alphaStrikeSearchRole: string = "";
    alphaStrikeSearchEra: number = 0;
    alphaStrikeSearchType: number = 0;
    alphaStrikeFactionSearchTerm: string = "";
    alphaStrikeSearchFactions: Array<number> = [];
    alphaStrikeAbilitySearchTerm: string = "";
    // Ability codes the unit must have; a "!" prefix means it must not have it.
    alphaStrikeSearchAbilities: Array<string> = [];
    // Special Rulesets (#324) the search follows.
    alphaStrikeSearchRulesets: Array<string> = [];
    alphaStrikeMULSources: MULSourceSelection = DEFAULT_MUL_SOURCE_SELECTION;
    alphaStrikeSearchStandings: UnitStanding[] = UNIT_STANDING_ORDER;
    hideMPIntro: boolean = false;

    equipmentEditorFile: string = "";
    asValues: Record<string, number> = {};

    constructor( io: IAppSettingsExport | null ) {
        this.import(io);
    }

    import( io: IAppSettingsExport | null ) {
        if( io ) {
            if ( typeof( io.uiTheme ) !== "undefined" ) {
                this.uiTheme = io.uiTheme;
            }

            if ( typeof( io.alphaStrikeMeasurementsInHexes ) !== "undefined" ) {
                this.alphaStrikeMeasurementsInHexes = io.alphaStrikeMeasurementsInHexes;
            }

            if ( typeof( io.developerMenu ) !== "undefined" ) {
                this.developerMenu = io.developerMenu;
            }
            if ( typeof( io.equipmentFilter ) !== "undefined" ) {
                this.equipmentFilter = io.equipmentFilter;
            }

            if ( typeof( io.installEquipCategory ) !== "undefined" ) {
                this.installEquipCategory = io.installEquipCategory;
            }

            if ( typeof( io.alphaStrikeSearchRules ) !== "undefined" ) {
                this.alphaStrikeSearchRules = io.alphaStrikeSearchRules;
            }

            if ( typeof( io.alphaStrikeSearchTerm ) !== "undefined" ) {
                this.alphaStrikeSearchTerm = io.alphaStrikeSearchTerm;
            }

            if ( typeof( io.alphaStrikeInPlayColumns ) !== "undefined" ) {
                this.alphaStrikeInPlayColumns = io.alphaStrikeInPlayColumns;
            }

            if ( typeof( io.equipmentEditorFile ) !== "undefined" ) {
                this.equipmentEditorFile = io.equipmentEditorFile;
            }

            if ( typeof( io.alphaStrikeSearchEra ) !== "undefined" && !isNaN(io.alphaStrikeSearchEra) ) {
                this.alphaStrikeSearchEra = +io.alphaStrikeSearchEra;
            }

            if ( typeof( io.alphaStrikeSearchTech ) === "string" ) {
                this.alphaStrikeSearchTech = io.alphaStrikeSearchTech;
            }
            if ( typeof( io.alphaStrikeSearchType ) !== "undefined" ) {
                this.alphaStrikeSearchType = io.alphaStrikeSearchType;
            }

            if ( typeof( io.alphaStrikeSearchRole ) !== "undefined" ) {
                this.alphaStrikeSearchRole = io.alphaStrikeSearchRole;
            }

            if ( typeof( io.alphaStrikeSearchFactions ) !== "undefined" ) {
                this.alphaStrikeSearchFactions = io.alphaStrikeSearchFactions;
            }

            if ( Array.isArray( io.alphaStrikeSearchAbilities ) ) {
                this.alphaStrikeSearchAbilities = io.alphaStrikeSearchAbilities.filter( (ability) => typeof ability === "string" );
            }
            if ( Array.isArray( io.alphaStrikeSearchRulesets ) ) {
                this.alphaStrikeSearchRulesets = io.alphaStrikeSearchRulesets.filter( (id) => typeof id === "string" );
            }

            this.alphaStrikeMULSources = normalizeMULSourceSelection( io.alphaStrikeMULSources ) ?? DEFAULT_MUL_SOURCE_SELECTION;
            this.alphaStrikeSearchStandings = normalizeStandingSelection( io.alphaStrikeSearchStandings ) ?? UNIT_STANDING_ORDER;

            if ( typeof( io.asValues ) !== "undefined" ) {
                this.asValues = io.asValues;
            }
            if ( typeof( io.mechNameFilter ) !== "undefined" ) {
                this.mechNameFilter = io.mechNameFilter;
            }
            if ( typeof( io.mechRulesFilter ) !== "undefined" ) {
                this.mechRulesFilter = io.mechRulesFilter;
                // Settings saved before the rules levels were renumbered: 5 was Custom Homebrew, which is now 6
                // (5 became Apocryphal). Without this the saved choice would hide the user's custom content.
                if ( io.rulesLevelScheme !== RULES_LEVEL_SCHEME && this.mechRulesFilter === 5 ) {
                    this.mechRulesFilter = CUSTOM_HOMEBREW_RULES_LEVEL;
                }
            }
            if ( io.cbtMULSearch && typeof( io.cbtMULSearch ) === "object" ) {
                const saved = io.cbtMULSearch;
                this.cbtMULSearch = newMULSearchFilters({
                    term: typeof saved.term === "string" ? saved.term : "",
                    rules: typeof saved.rules === "string" ? saved.rules : "",
                    tech: typeof saved.tech === "string" ? saved.tech : "",
                    role: typeof saved.role === "string" ? saved.role : "",
                    era: Number.isFinite( +saved.era ) ? +saved.era : 0,
                    type: Number.isFinite( +saved.type ) ? +saved.type : CBT_MUL_DEFAULT_TYPE,
                    factions: Array.isArray( saved.factions ) ? saved.factions.filter( (id) => typeof id === "number" ) : [],
                    sources: normalizeMULSourceSelection( saved.sources ) ?? DEFAULT_MUL_SOURCE_SELECTION,
                    rulesets: Array.isArray( saved.rulesets ) ? saved.rulesets.filter( (id) => typeof id === "string" ) : [],
                    standings: normalizeStandingSelection( saved.standings ) ?? UNIT_STANDING_ORDER,
                });
            }
            if ( typeof( io.hideMPIntro ) !== "undefined" ) {
                this.hideMPIntro = io.hideMPIntro;
            }
        }
    }

    export(): IAppSettingsExport {
        return {
            uiTheme: this.uiTheme,
            developerMenu: this.developerMenu,
            equipmentFilter: this.equipmentFilter,
            installEquipCategory: this.installEquipCategory,
            alphaStrikeSearchTerm: this.alphaStrikeSearchTerm,
            alphaStrikeInPlayColumns: this.alphaStrikeInPlayColumns,
            equipmentEditorFile: this.equipmentEditorFile,
            alphaStrikeSearchRules: this.alphaStrikeSearchRules,
            alphaStrikeSearchEra: this.alphaStrikeSearchEra,
            alphaStrikeSearchTech: this.alphaStrikeSearchTech,
            alphaStrikeSearchType: this.alphaStrikeSearchType,
            alphaStrikeSearchRole: this.alphaStrikeSearchRole,
            alphaStrikeMeasurementsInHexes: this.alphaStrikeMeasurementsInHexes,
            asValues: this.asValues,
            alphaStrikeSearchFactions: this.alphaStrikeSearchFactions,
            alphaStrikeSearchAbilities: this.alphaStrikeSearchAbilities,
            alphaStrikeSearchRulesets: this.alphaStrikeSearchRulesets,
            alphaStrikeMULSources: this.alphaStrikeMULSources,
            alphaStrikeSearchStandings: this.alphaStrikeSearchStandings,
            hideMPIntro: this.hideMPIntro,
        

            mechRulesFilter: this.mechRulesFilter,
            rulesLevelScheme: RULES_LEVEL_SCHEME,
            mechNameFilter: this.mechNameFilter,
            cbtMULSearch: this.cbtMULSearch,
        }
    }
}

export interface IAppSettingsExport {
    uiTheme: string;
    developerMenu: boolean;
    equipmentFilter: string;
    installEquipCategory: string;

    alphaStrikeSearchTerm: string;
    alphaStrikeSearchRules: string;
    alphaStrikeSearchTech: string;
    alphaStrikeSearchRole: string;
    alphaStrikeSearchEra: number;
    alphaStrikeSearchType: number;
    alphaStrikeInPlayColumns: number;
    alphaStrikeMeasurementsInHexes: boolean;
    alphaStrikeSearchFactions: Array<number>;
    alphaStrikeSearchAbilities?: Array<string>;
    alphaStrikeSearchRulesets?: Array<string>;
    // A "mul2+mul1"-style string in settings saved before the lists became checkboxes.
    alphaStrikeMULSources?: MULSourceSelection | string;
    alphaStrikeSearchStandings?: unknown;
    hideMPIntro: boolean;
   
    equipmentEditorFile: string;
    asValues: Record<string, number>;

    mechRulesFilter: number
    /** Which numbering mechRulesFilter uses; absent in settings saved before the levels above Experimental were added. */
    rulesLevelScheme?: number
    mechNameFilter: string
    cbtMULSearch?: IMULSearchFilters
}