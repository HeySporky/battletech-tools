import { IASMULUnit } from "./classes/alpha-strike-unit";
import { BattleMech, IGATOR, ITargetToHit } from "./classes/battlemech";
import { CONST_MUL_API_ENABLED } from "./configVars";
import { IEquipmentItem } from "./data/data-interfaces";
import { getEquipmentCatalogs, getEquipmentListByTech } from "./data/equipment-registry";
import { isTargetingComputerWeapon } from "./data/variable-equipment";
import { DEFAULT_MUL_SOURCE_SELECTION, getMULRecordKey, loadMULListItems } from "./data/mul-list-items";
import { IAppGlobals } from "./ui/app-router";
import { replaceAll } from "./utils/replaceAll";
import { getQuirkToHit } from "./utils/quirk-effects";
import { getFutureWarsPlayKind, getLRFlamerRangeModifier } from "./utils/future-wars-play";
import { FW_LONG_RANGE_WARS, getLongRangeWarsBand, getLongRangeWarsFirerModifier, getLongRangeWarsTargetModifier } from "./utils/future-wars-ruleset-tools";
import { unitHasAbility } from "./utils/mulAbilities";
import { resolveMULEraFilter } from "./utils/mulUtilities";
import { filterMULByRulesets, IMULSearchFilters } from "./utils/mulSearchFilters";

export function getISEquipmentList(): IEquipmentItem[] {
    return getEquipmentListByTech("is");
}

export function getClanEquipmentList(): IEquipmentItem[] {
    return getEquipmentListByTech("clan");
}

export function getAllEquipmentLists(): Record<string, IEquipmentItem[]> {
    return getEquipmentCatalogs();
}

// Parsed form of the free-text search box tokens (pv:10-20, s>5, a:CASE, etc.),
// used to filter units identically whether they came from the live API or a local fallback list.
interface IMULSearchTokens {
    nameTerms: string[];
    abilitySearch: string[];
    abilityExclude: string[];
    minPV: number;
    maxPV: number;
    minDamage: number[];
    maxDamage: number[];
    minArmorStructure: number[];
    maxArmorStructure: number[];
    introDate: number[];
    minMove: number;
    maxMove: number;
    minJump: number;
    minDefense: number;
    exactDamageProfile: { short: number; medium: number; long: number } | null;
}

// Maps the "Rules" dropdown value to the set of MUL Rules-level labels it should match.
const MUL_RULES_LEVEL_MAP: Record<string, string[]> = {
    "introductory": ["introductory"],
    "standard": ["standard"],
    "advanced": ["advanced"],
    "experimental": ["experimental"],
    "era specific": ["era specific"],
    "unknown": ["unknown"],
    "intro+standard": ["introductory", "standard"],
    "intro+standard+advanced": ["introductory", "standard", "advanced"],
    "intro+standard+advanced+experimental": ["introductory", "standard", "advanced", "experimental"],
};

function parseMULSearchTokens(searchTerm: string): IMULSearchTokens {
    const tokens: IMULSearchTokens = {
        nameTerms: [],
        abilitySearch: [],
        abilityExclude: [],
        minPV: 1,
        maxPV: 999,
        minDamage: [-1, -1, -1],
        maxDamage: [999, 999, 999],
        minArmorStructure: [-1, -1],
        maxArmorStructure: [999, 999],
        introDate: [-1, 10000],
        minMove: -1,
        maxMove: 999,
        minJump: -1,
        minDefense: -1,
        exactDamageProfile: null,
    };

    const searchTerms = searchTerm.trim().split(" ").filter((term) => term.length > 0);

    for (const term of searchTerms) {
        let value: string | undefined;
        let match: RegExpMatchArray | null;

        if ((match = term.match(/^(\w+):(\d+)-(\d+)$/))) {
            const [, field, minStr, maxStr] = match;
            const min = parseInt(minStr);
            const max = parseInt(maxStr);

            switch (field) {
                case "pv":
                case "points":
                    tokens.minPV = min;
                    tokens.maxPV = max;
                    break;
                case "year":
                case "intro":
                    tokens.introDate[0] = min;
                    tokens.introDate[1] = max;
                    break;
                case "armor":
                case "ar":
                    tokens.minArmorStructure[0] = min;
                    tokens.maxArmorStructure[0] = max;
                    break;
                case "structure":
                case "st":
                    tokens.minArmorStructure[1] = min;
                    tokens.maxArmorStructure[1] = max;
                    break;
                case "mv":
                case "move":
                    tokens.minMove = min;
                    tokens.maxMove = max;
                    break;
            }
            continue;
        }

        if ((match = term.match(/^(\w+)(>=|<=|!=|>|<|=)(.+)$/))) {
            const [, field, op, valueStr] = match;
            const val = parseInt(valueStr);
            // "pv>x" has no number to compare with: a NaN bound would hide every unit, so the term is dropped.
            if (Number.isNaN(val)) {
                continue;
            }

            switch (field) {
                case "pv":
                case "points":
                    switch (op) {
                        case ">": tokens.minPV = val + 1; break;
                        case ">=": tokens.minPV = val; break;
                        case "<": tokens.maxPV = val - 1; break;
                        case "<=": tokens.maxPV = val; break;
                        case "=": tokens.minPV = val; tokens.maxPV = val; break;
                    }
                    break;
                case "short":
                case "s":
                    switch (op) {
                        case ">": tokens.minDamage[0] = val + 1; break;
                        case ">=": tokens.minDamage[0] = val; break;
                        case "<": tokens.maxDamage[0] = val - 1; break;
                        case "<=": tokens.maxDamage[0] = val; break;
                        case "=": tokens.minDamage[0] = val; tokens.maxDamage[0] = val; break;
                    }
                    break;
                case "medium":
                case "m":
                    switch (op) {
                        case ">": tokens.minDamage[1] = val + 1; break;
                        case ">=": tokens.minDamage[1] = val; break;
                        case "<": tokens.maxDamage[1] = val - 1; break;
                        case "<=": tokens.maxDamage[1] = val; break;
                        case "=": tokens.minDamage[1] = val; tokens.maxDamage[1] = val; break;
                    }
                    break;
                case "long":
                case "l":
                    switch (op) {
                        case ">": tokens.minDamage[2] = val + 1; break;
                        case ">=": tokens.minDamage[2] = val; break;
                        case "<": tokens.maxDamage[2] = val - 1; break;
                        case "<=": tokens.maxDamage[2] = val; break;
                        case "=": tokens.minDamage[2] = val; tokens.maxDamage[2] = val; break;
                    }
                    break;
                case "armor":
                case "ar":
                    switch (op) {
                        case ">": tokens.minArmorStructure[0] = val + 1; break;
                        case ">=": tokens.minArmorStructure[0] = val; break;
                        case "<": tokens.maxArmorStructure[0] = val - 1; break;
                        case "<=": tokens.maxArmorStructure[0] = val; break;
                        case "=": tokens.minArmorStructure[0] = val; tokens.maxArmorStructure[0] = val; break;
                    }
                    break;
                case "structure":
                case "st":
                    switch (op) {
                        case ">": tokens.minArmorStructure[1] = val + 1; break;
                        case ">=": tokens.minArmorStructure[1] = val; break;
                        case "<": tokens.maxArmorStructure[1] = val - 1; break;
                        case "<=": tokens.maxArmorStructure[1] = val; break;
                        case "=": tokens.minArmorStructure[1] = val; tokens.maxArmorStructure[1] = val; break;
                    }
                    break;
                case "year":
                case "intro":
                    switch (op) {
                        case ">": tokens.introDate[0] = val + 1; break;
                        case ">=": tokens.introDate[0] = val; break;
                        case "<": tokens.introDate[1] = val - 1; break;
                        case "<=": tokens.introDate[1] = val; break;
                        case "=": tokens.introDate[0] = val; tokens.introDate[1] = val; break;
                    }
                    break;
                case "mv":
                case "move":
                    switch (op) {
                        case ">": tokens.minMove = val + 1; break;
                        case ">=": tokens.minMove = val; break;
                        case "<": tokens.maxMove = val - 1; break;
                        case "<=": tokens.maxMove = val; break;
                        case "=": tokens.minMove = val; tokens.maxMove = val; break;
                    }
                    break;
                case "jump":
                case "j":
                    switch (op) {
                        case ">": tokens.minJump = val + 1; break;
                        case ">=": tokens.minJump = val; break;
                        case "=": tokens.minJump = val; break;
                    }
                    break;
                case "defense":
                case "def":
                    switch (op) {
                        case ">": tokens.minDefense = val + 1; break;
                        case ">=": tokens.minDefense = val; break;
                    }
                    break;
            }
            continue;
        }

        if (term.startsWith("a:")) {
            value = term.substring(2);
            if (value.includes(",")) {
                const abilities = value.split(",").filter((a) => a.length > 1);
                tokens.abilitySearch.push(...abilities);
            } else if (value.startsWith("!")) {
                const ability = value.substring(1);
                if (ability.length > 1) {
                    tokens.abilityExclude.push(ability);
                }
            } else if (value.length > 1) {
                tokens.abilitySearch.push(value);
            }
            continue;
        }

        if (term.startsWith("dmg:") || term.startsWith("damage:")) {
            const dmgStr = term.substring(term.indexOf(":") + 1);
            const parts = dmgStr.split("/");
            if (parts.length === 3) {
                tokens.exactDamageProfile = {
                    short: parts[0] === "*" ? -1 : parseInt(parts[0]),
                    medium: parts[1] === "*" ? -1 : parseInt(parts[1]),
                    long: parts[2] === "*" ? -1 : parseInt(parts[2]),
                };
            }
            continue;
        }

        // An operator still being typed ("pv>", "short>=") has no value yet: it filters nothing, and is not a name.
        if (/^\w+(>=|<=|!=|>|<|=)$/.test(term)) {
            continue;
        }

        tokens.nameTerms.push(term);
    }

    return tokens;
}

// Applies the dropdown filters (Rules/Technology/Role/Era/Type/Faction) the live API used to take as query params.
function matchesMULDropdownFilters(
    unit: IASMULUnit,
    mechRules: string,
    techFilter: string,
    roleFilter: string,
    eraFilter: number,
    typeFilter: number,
    factionFilter: number[],
): boolean {
    // MUL 2.0 records carry no Rules level, so the Rules filter only narrows records that have one.
    if (mechRules && mechRules.trim() && unit.Rules) {
        const allowedRules = MUL_RULES_LEVEL_MAP[mechRules.toLowerCase()];
        if (allowedRules && !allowedRules.includes(unit.Rules.toLowerCase())) {
            return false;
        }
    }

    if (techFilter && techFilter.trim()) {
        if ((unit.Technology?.Name ?? "").toLowerCase() !== techFilter.toLowerCase()) {
            return false;
        }
    }

    if (roleFilter && roleFilter.trim()) {
        if ((unit.Role?.Name ?? "").toLowerCase() !== roleFilter.trim().toLowerCase()) {
            return false;
        }
    }

    // The MUL era filter means "available in the era" (the live site's AvailableEras), not the era the unit was
    // introduced in. With factions selected, a unit matches when any of them fields it (in that era, if one is set).
    if ((eraFilter && eraFilter > 0) || factionFilter.length > 0) {
        if (unit.Availability) {
            const available = unit.Availability.some((entry) =>
                (!eraFilter || entry.EraId === eraFilter)
                && (factionFilter.length === 0 || entry.FactionIds.some((id) => factionFilter.includes(id))));
            if (!available) {
                return false;
            }
        } else if (factionFilter.length > 0 || unit.EraId !== eraFilter) {
            // MUL 1.0 records carry no availability: only the introduction era can be checked.
            return false;
        }
    }

    if (typeFilter) {
        if (unit.Type?.Id !== typeFilter) {
            return false;
        }
    }

    return true;
}

// Applies the free-text search tokens (name words + pv:/s:/a:/etc. operators) to a single unit.
function matchesMULSearchTokens(unit: IASMULUnit, tokens: IMULSearchTokens): boolean {
    if (tokens.nameTerms.length > 0) {
        const haystack = `${unit.Name ?? ""} ${unit.Variant ?? ""} ${unit.Class ?? ""}`.toLowerCase();
        for (const term of tokens.nameTerms) {
            if (!haystack.includes(term.toLowerCase())) {
                return false;
            }
        }
    }

    const pv = +unit.BFPointValue;
    if (pv < tokens.minPV || pv > tokens.maxPV) {
        return false;
    }

    if (unit.BFDamageShort < tokens.minDamage[0] || unit.BFDamageShort > tokens.maxDamage[0]) {
        return false;
    }
    if (unit.BFDamageMedium < tokens.minDamage[1] || unit.BFDamageMedium > tokens.maxDamage[1]) {
        return false;
    }
    if (unit.BFDamageLong < tokens.minDamage[2] || unit.BFDamageLong > tokens.maxDamage[2]) {
        return false;
    }

    if (unit.BFArmor < tokens.minArmorStructure[0] || unit.BFArmor > tokens.maxArmorStructure[0]) {
        return false;
    }
    if (unit.BFStructure < tokens.minArmorStructure[1] || unit.BFStructure > tokens.maxArmorStructure[1]) {
        return false;
    }

    const introYear = parseInt(unit.DateIntroduced);
    if (!isNaN(introYear) && (introYear < tokens.introDate[0] || introYear > tokens.introDate[1])) {
        return false;
    }

    if (tokens.minMove > -1 || tokens.maxMove < 999) {
        let moveValue = 0;
        if (unit.BFMove) {
            const moveMatch = unit.BFMove.match(/^(\d+)"?/);
            if (moveMatch) {
                moveValue = parseInt(moveMatch[1]);
            }
        }
        if (moveValue < tokens.minMove || moveValue > tokens.maxMove) {
            return false;
        }
    }

    if (tokens.minJump > -1) {
        let jumpValue = 0;
        if (unit.BFMove && unit.BFMove.includes("j")) {
            const jumpMatch = unit.BFMove.match(/(\d+)"?j/);
            if (jumpMatch) {
                jumpValue = parseInt(jumpMatch[1]);
            }
        }
        if (jumpValue < tokens.minJump) {
            return false;
        }
    }

    if (tokens.minDefense > -1) {
        const totalDefense = (+unit.BFArmor) + (+unit.BFStructure);
        if (totalDefense < tokens.minDefense) {
            return false;
        }
    }

    if (tokens.exactDamageProfile) {
        const profile = tokens.exactDamageProfile;
        if (profile.short !== -1 && unit.BFDamageShort !== profile.short) {
            return false;
        }
        if (profile.medium !== -1 && unit.BFDamageMedium !== profile.medium) {
            return false;
        }
        if (profile.long !== -1 && unit.BFDamageLong !== profile.long) {
            return false;
        }
    }

    // Matched by ability code, so "ECM" does not also match LECM or AECM.
    if (!tokens.abilitySearch.every((ability) => unitHasAbility(unit.BFAbilities, ability))) {
        return false;
    }
    if (tokens.abilityExclude.some((ability) => unitHasAbility(unit.BFAbilities, ability))) {
        return false;
    }

    return true;
}

function getMULSearchTokens(searchTerm: string, abilityFilters: string[]): IMULSearchTokens {
    const tokens = parseMULSearchTokens(searchTerm);
    for (const filter of abilityFilters) {
        if (filter.startsWith("!")) {
            tokens.abilityExclude.push(filter.substring(1));
        } else {
            tokens.abilitySearch.push(filter);
        }
    }
    return tokens;
}

/** Searches the MUL copy bundled with the app; the Classic roster uses it, and the Alpha Strike offline path matches the same way. */
/** The records that pass a MUL search's filters, whatever list they come from. */
export function filterMULRecords(units: IASMULUnit[], filters: IMULSearchFilters): IASMULUnit[] {
    const tokens = getMULSearchTokens(filters.term, filters.abilities);
    const era = resolveMULEraFilter(filters.era);
    return filterMULByRulesets(units.filter((unit) =>
        matchesMULDropdownFilters(unit, filters.rules, filters.tech, filters.role, era, filters.type, filters.factions) &&
        matchesMULSearchTokens(unit, tokens)), filters.rulesets);
}

export async function searchBundledMUL(filters: IMULSearchFilters): Promise<IASMULUnit[]> {
    return filterMULRecords(await loadMULListItems(filters.sources), filters);
}

async function getCachedMULSearchResults(
    tokens: IMULSearchTokens,
    mechRules: string,
    techFilter: string,
    roleFilter: string,
    eraFilter: number,
    typeFilter: number,
    factionFilter: number[],
    appGlobals: IAppGlobals | null,
): Promise<IASMULUnit[]> {
    const matchesAllFilters = (unit: IASMULUnit) =>
        matchesMULDropdownFilters(unit, mechRules, techFilter, roleFilter, eraFilter, typeFilter, factionFilter) &&
        matchesMULSearchTokens(unit, tokens);

    const selection = appGlobals?.appSettings.alphaStrikeMULSources ?? DEFAULT_MUL_SOURCE_SELECTION;
    const allowedSources = selection;
    const bundledMatches = (await loadMULListItems(selection)).filter(matchesAllFilters);
    const sessionMatches = (appGlobals?.appSettings.alphasStrikeCachedSearchResults ?? [])
        .filter((unit) => allowedSources.includes(unit.MulSource ?? "mul2"))
        .filter(matchesAllFilters);
    const seen = new Set(bundledMatches.map(getMULRecordKey));

    // Bundled deployment data is authoritative. Session-only records supplement it without
    // replacing newer records shipped by a subsequent deployment.
    return bundledMatches.concat(sessionMatches.filter((unit) => {
        const key = getMULRecordKey(unit);
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    }));
}

function addMULUnavailableAlert(appGlobals: IAppGlobals | null): void {
    if (!appGlobals) {
        return;
    }

    appGlobals.siteAlerts.addAlert(
        "warning",
        "",
        "The Master Unit List live search is unavailable. Showing matching results from this device's saved data instead.",
        "warning",
        true,
        null,
        10,
        "",
        "",
        "",
        "MULDOWN"
    );
}

export async function getMULASSearchResults(
    searchTerm: string,
    mechRules: string,
    techFilter: string,
    roleFilter: string,
    eraFilter: number,
    typeFilter: number,
    factionFilter: number[],
    offLine: boolean,
    overrideSearchLimitLength: boolean = false,
    appGlobals: IAppGlobals | null = null,
    // Ability codes the unit must have, or must not have when prefixed with "!" (e.g. ["ECM", "!IF"]).
    abilityFilters: string[] = [],
): Promise<IASMULUnit[]> {

    // A Clan era picked in the filter searches the MUL era it maps to; the MUL has no Clan eras.
    eraFilter = resolveMULEraFilter(eraFilter);

    let returnUnits: IASMULUnit[] = [];

    const rulesNumbersURI: string[] = [];

    if( mechRules.toLowerCase() === "introductory" ) {
        rulesNumbersURI.push( "&Rules=55" );
    }
    if( mechRules.toLowerCase() === "standard" ) {
        rulesNumbersURI.push( "&Rules=4" );
    }
    if( mechRules.toLowerCase() === "advanced" ) {
        rulesNumbersURI.push( "&Rules=5" );
    }
    if( mechRules.toLowerCase() === "intro+standard" ) {
        rulesNumbersURI.push( "&Rules=55" );
        rulesNumbersURI.push( "&Rules=4" );
    }
    if( mechRules.toLowerCase() === "intro+standard+advanced" ) {
        rulesNumbersURI.push( "&Rules=55" );
        rulesNumbersURI.push( "&Rules=4" );
        rulesNumbersURI.push( "&Rules=5" );
    }
    if( mechRules.toLowerCase() === "intro+standard+advanced+experimental" ) {
        rulesNumbersURI.push( "&Rules=55" );
        rulesNumbersURI.push( "&Rules=4" );
        rulesNumbersURI.push( "&Rules=5" );
        rulesNumbersURI.push( "&Rules=6" );
    }
    if( mechRules.toLowerCase() === "experimental" ) {
        rulesNumbersURI.push( "&Rules=6" );
    }
    if( mechRules.toLowerCase() === "era specific" ) {
        rulesNumbersURI.push( "&Rules=56" );
    }
    if( mechRules.toLowerCase() === "unknown" ) {
        rulesNumbersURI.push( "&Rules=78" );
    }

    const roleFilterURI: string[] = [];
    if( roleFilter.trim() ) {
        roleFilterURI.push( "&Roles=" + replaceAll(roleFilter, " ", "%20", false, false, true) );
    }

    const techFilterURI: string[] = [];
    if( techFilter.toLowerCase() === "inner sphere" ) {
        techFilterURI.push( "&Technologies=1" );
    }
    if( techFilter.toLowerCase() === "clan" ) {
        techFilterURI.push( "&Technologies=2" );
    }
    if( techFilter.toLowerCase() === "mixed" ) {
        techFilterURI.push( "&Technologies=3" );
    }
    if( techFilter.toLowerCase() === "primitive" ) {
        techFilterURI.push( "&Technologies=57" );
    }

    const typesFilterURI: string[] = [];
    if( typeFilter ) {
        typesFilterURI.push( "&Types=" + typeFilter.toString() );
    }

    const factionFilterURI: string[] = [];
    if( factionFilter.length > 0 ) {
        for( const faction of factionFilter ) {
            factionFilterURI.push( "&Factions=" + faction );
        }
    }

    const tokens = getMULSearchTokens(searchTerm, abilityFilters);

    if( offLine === false && CONST_MUL_API_ENABLED ) {
        try {
            let url = "https://masterunitlist.azurewebsites.net/Unit/QuickList?";

            if( eraFilter && eraFilter > 0 ) {
                url += "&AvailableEras=" + eraFilter.toString();
            }

            url += rulesNumbersURI.join("");
            url += typesFilterURI.join("");
            url += techFilterURI.join("");
            url += roleFilterURI.join("");
            url += factionFilterURI.join("");

            if( tokens.abilitySearch.length > 0 ) {
                url += "&HasBFAbility=" + tokens.abilitySearch.join("+");
            }

            url += "&MinPV=" + tokens.minPV.toString();
            url += "&MaxPV=" + tokens.maxPV.toString();

            if( tokens.nameTerms.length > 0 && tokens.nameTerms.join("%20").length > 2 ) {
                url += "&Name=" + tokens.nameTerms.join("%20");
            }

            if(
                tokens.nameTerms.join("%20").length > 2
                || overrideSearchLimitLength
                || tokens.abilitySearch.length > 0
                || tokens.abilityExclude.length > 0
                || tokens.maxPV - tokens.minPV <= 40
                || tokens.minMove > -1
                || tokens.minJump > -1
                || tokens.minDefense > -1
                || tokens.exactDamageProfile !== null
            ) {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`MUL search request failed with HTTP ${response.status}`);
                }
                const returnData = await response.json();

                if( !returnData ) {
                    return [];
                }

                returnUnits = (returnData.Units ?? []).filter((unit: IASMULUnit) => matchesMULSearchTokens(unit, tokens));
            }
        } catch (err) {
            console.error('MUL Fetch Error: ', err);
            addMULUnavailableAlert(appGlobals);
            return await getCachedMULSearchResults(tokens, mechRules, techFilter, roleFilter, eraFilter, typeFilter, factionFilter, appGlobals);
        }
    } else {
        if( offLine ) {
            console.warn("Navigator is offline!");
        } else {
            console.warn("MUL API is disabled, using bundled fallback data.");
        }
        addMULUnavailableAlert(appGlobals);
        return await getCachedMULSearchResults(tokens, mechRules, techFilter, roleFilter, eraFilter, typeFilter, factionFilter, appGlobals);
    }

    return returnUnits;
}

export function getMovementModifier( moveScore: number ): number {
	if( moveScore >= 25 ) {
		return 6;
	} else if ( moveScore >= 18 ) {
		return 5;
	} else if ( moveScore >= 10 ) {
		return 4;
	} else if ( moveScore >= 7 ) {
		return 3;
	} else if ( moveScore >= 5 ) {
		return 2;
	} else if ( moveScore >= 3 ) {
		return 1;
	}

	return 0;
}

export function getAeroRangeLabel( aeroAbbr: string): string {
    if( aeroAbbr === "s" )
        return "Short";
    if( aeroAbbr === "m" )
        return "Medium";
    if( aeroAbbr === "l" )
        return "Long";
    if( aeroAbbr === "e" )
        return "Extreme";
    return "";
}

// Natural sort: numbers compare by value, so "atm 3" sorts before "atm 12"
const equipmentSortCollator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

export function sortEquipment (
    a: IEquipmentItem,
    b: IEquipmentItem,
): number {
    return equipmentSortCollator.compare( a.sort.trim(), b.sort.trim() )
        || equipmentSortCollator.compare( a.name.trim(), b.name.trim() );
}

export function getTargetColor(
    targetLetter: string | undefined,
): string {

    if( targetLetter && targetLetter.toLowerCase() === "a" ) {
        return "red";
    }
    if( targetLetter && targetLetter.toLowerCase() === "b" ) {
        return "blue";
    }
    if( targetLetter && targetLetter.toLowerCase() === "c" ) {
        return "orange";
    }
    return "#cccccc";
}

export function getHexDistanceFromModifier(
    mod: number
): string {
    if( mod > 5 ) {
        return "25+";
    } else if( mod > 4 ) {
        return "18-24";
    } else if( mod > 3 ) {
        return "10-17";
    } else if( mod > 2 ) {
        return "7-9";
    } else if( mod > 1 ) {
        return "5-6";
    } else if( mod > 0 ) {
        return "3-4";
    } else {
        return "0-2";
    }
}

const clusterHitsTable = [
    [1,1,1,1,2,2,3,3,3,4,4,4,5,5,5,5,6,6,6,7,7,7,8,8,9,9,9,10,10,12],
    [1,1,2,2,2,2,3,3,3,4,4,4,5,5,5,5,6,6,6,7,7,7,8,8,9,9,9,10,10,12],
    [1,1,2,2,3,3,4,4,4,5,5,5,6,6,7,7,8,8,9,9,9,10,10,10,11,11,11,12,12,18],
    [1,2,2,3,3,4,4,5,6,7,8,8,9,9,10,10,11,11,12,13,14,15,16,16,17,17,17,18,18,24],
    [1,2,2,3,4,4,5,5,6,7,8,8,9,9,10,10,11,11,12,13,14,15,16,16,17,17,17,18,18,24],
    [1,2,3,3,4,4,5,5,6,7,8,8,9,9,10,10,11,11,12,13,14,15,16,16,17,17,17,18,18,24],
    [2,2,3,3,4,4,5,5,6,7,8,8,9,9,10,10,11,11,12,13,14,15,16,16,17,17,17,18,18,24],
    [2,2,3,4,5,6,6,7,8,9,10,11,11,12,13,14,14,15,16,17,18,19,20,21,21,22,23,23,24,32],
    [2,3,3,4,5,6,6,7,8,9,10,11,11,12,13,14,14,15,16,17,18,19,20,21,21,22,23,23,24,32],
    [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,40],
    [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,40],
];

export function getClusterHitsPerRoll(
    roll: number,
    numberCluster: number,
): number {
    // The table's columns are cluster sizes 2 to 30, then 40 (TW p.116): there is no column for 31 to 39.
    if( numberCluster > 30 && numberCluster !== 40 ) {
        return -1;
    }
    const column = numberCluster === 40 ? 29 : numberCluster - 2;
    if( clusterHitsTable[ roll - 2 ] && clusterHitsTable[ roll - 2][ column ] ) {
        return clusterHitsTable[ roll - 2][ column ];
    }

    return -1;
}

export function getLocationName(
    abbr: string,
    forQuad: boolean,
): string {
    switch( abbr ) {
        case "hd": {
            return "Head";
        }

        case "ct": {
            return "Center Torso";
        }
        case "rt": {
            return "Right Torso";
        }
        case "lt": {
            return "Left Torso";
        }

        case "ctr": {
            return "Center Torso (Rear)";
        }
        case "rtr": {
            return "Right Torso (Rear)";
        }
        case "ltr": {
            return "Left Torso (Rear)";
        }

        case "ra": {
            if( forQuad )
                return "Right Front Leg";

            return "Right Arm";
        }
        case "la": {
            if( forQuad )
                return "Left Front Leg";
            return "Left Arm";
        }

        case "rl": {
            if( forQuad )
                return "Right Rear Leg";
            return "Right Leg";
        }
        case "ll": {
            if( forQuad )
                return "Left Rear Leg";
            return "Left Leg";
        }

        case "frl": {
            return "Right Front Leg";
        }
        case "fll": {
            return "Left Front Leg";
        }
        case "cl": {
            return "Center Leg";
        }
    }

    return "???";
}

export function getTargetToHitFromWeapon(
    mech: BattleMech,
    index: number,
    target: ITargetToHit | null = null,
    equipmentList: IEquipmentItem[] | null = null,
    quirksInPlay: boolean = false,
): IGATOR {
    const gator: IGATOR = JSON.parse(JSON.stringify(mech.getGATOR()));

    if( equipmentList === null ) {
        equipmentList = mech.equipmentList;
    }
    const weapon = equipmentList[index];
    const ammo = weapon?.selectedAmmoBinUUID
        ? equipmentList.find(item => item.uuid === weapon.selectedAmmoBinUUID)
        : undefined;
    const baseRange = ammo?.ammoProfile?.range ?? weapon?.range;
    // A Power Booster on this turn adds its range to each band (The Best of Future Wars p.28; as getPowerBoostedWeapon).
    const boostedRange = weapon?.uuid && mech.isPowerBoosterOn( weapon.uuid ) ? weapon.conversion?.booster?.addedRange ?? 0 : 0;
    const weaponRange = boostedRange && baseRange
        ? { ...baseRange, short: baseRange.short + boostedRange, medium: baseRange.medium + boostedRange, long: baseRange.long + boostedRange }
        : baseRange;
    gator.finalToHit = -1;
    if(
        equipmentList.length > index
        && equipmentList[index]
        && typeof( equipmentList[index].target ) !== "undefined"
        && equipmentList[index].target
    ) {
        const targetLetter = equipmentList[index].target as string;

        if( target === null && mech ) {
            target = mech.getTarget( targetLetter );
        }

        if( target ) {
            gator.targetObj = target;
            gator.targetName = target.name;

            gator.target = "Target " + targetLetter.toUpperCase();
            gator.weaponName = equipmentList[index].name;

            gator.finalToHit = gator.gunnerySkill;

            if( mech.currentMovementMode === "w") {
                gator.finalToHit += 1;
                gator.attackerMovementModifier = 1;
                gator.rangeExplanation = "Walked";
            } else if( mech.currentMovementMode === "r") {
                gator.finalToHit += 2;
                gator.attackerMovementModifier = 2;
                gator.rangeExplanation = "Ran";
            } else if( mech.currentMovementMode === "j") {
                gator.finalToHit += 3;
                gator.attackerMovementModifier = 3;
                gator.rangeExplanation = "Jumped";
            } else {
                gator.rangeExplanation = "Stationary";
            }

            gator.finalToHit += target.movement;
            gator.targetMovementModifier = target.movement;

            const otherModifiersExplanation: string[] = [];
            gator.finalToHit += target.otherMods;
            gator.otherModifiers = target.otherMods;
            if( target.otherMods ) {
                otherModifiersExplanation.push( "Target Other Modifiers");
            }
            if(
                typeof( equipmentList[index].accuracyModifier ) !== "undefined"
                &&
                equipmentList[index].accuracyModifier !== 0
            ) {
                // @ts-expect-error Legacy compatibility type mismatch
                gator.finalToHit += equipmentList[index].accuracyModifier;
                // @ts-expect-error Legacy compatibility type mismatch
                gator.otherModifiers += equipmentList[index].accuracyModifier;

                otherModifiersExplanation.push( "Weapon Accuracy Modifier" );
            }
            const systemModifier = ( modifier: number, label: string ) => {
                if( !modifier ) return;
                gator.finalToHit += modifier;
                gator.otherModifiers += modifier;
                otherModifiersExplanation.push( label + " (" + (modifier > 0 ? "+" : "") + modifier + ")" );
            };
            // IndustrialMech fire control (TM p.69; IO:AE p.114).
            systemModifier( mech.getFireControlToHitModifier(), mech.isPrimitive() ? "Primitive IndustrialMech cockpit" : "IndustrialMech fire control" );
            // The Heat Scale's fire modifier (TW pp.158-160; BD p.13).
            systemModifier( mech.getHeatToHitModifier(), "Heat" );
            systemModifier( mech.getSensorToHitModifier(), "Sensor Hits" );
            // The Best of Future Wars play rulesets: after an opportunity shot, a morale status, a malfunction.
            for( const { modifier, label } of mech.getFutureWarsRulesetToHit( weapon?.uuid ) ) systemModifier( modifier, label );
            // Woods, jungle or smoke: +1 a light hex, +2 a heavy hex (BD p.10; TW p.117). Enhanced Imaging: each hex 1
            // less, at least +1, and no darkness modifier (IO:AE p.69); Maximum Tech: any light woods +1 in all, heavy or
            // smoke +1 a hex, no night modifier (p.61).
            const enhancedImaging = mech.isEnhancedImagingActive();
            const lightHexes = target.lightWoodsHexes ?? 0;
            const heavyHexes = target.heavyWoodsHexes ?? 0;
            systemModifier(
                !enhancedImaging ? lightHexes + 2 * heavyHexes
                    : mech.usesEarlierRulesEdition() ? Math.min( lightHexes, 1 ) + heavyHexes : lightHexes + heavyHexes,
                enhancedImaging ? "Woods / Smoke, Enhanced Imaging" : "Woods / Smoke",
            );
            systemModifier( enhancedImaging ? 0 : target.darkness ?? 0, "Darkness" );
            // An immobile target -4; an aimed shot at it names a location, the head at +3 in place of the -4, with no
            // missile launcher, LB-X cluster or Hyper-Assault Gauss (TW p.110; BMR(R) pp.24-26). A targeting computer
            // -1 for its direct-fire weapons, lost by LB-X cluster; or, aimed at an active target, +3 in its place, never
            // at the head nor with a pulse weapon (TW p.143; BMR(R) p.148). Enhanced Imaging aims as a computer does: TW
            // +2 more, -1 in place of it with a computer (IO:AE p.69); Maximum Tech +6, +2 with a computer (p.61).
            const immobileModifier = mech.getEditionPlayRules()?.immobileTargetModifier ?? -4;
            const cluster = !!ammo?.tag.includes( "cluster" );
            const computer = mech.hasTargetingComputer() && isTargetingComputerWeapon( weapon ) && !cluster;
            const aimed = target.aimedLocation;
            const canAim = weapon.category !== "Missile Weapons" && !cluster && !/hyper-assault|(^|-)hag(-|$)/.test( weapon.tag );
            const immobileAim = !!aimed && !!target.immobile && !!immobileModifier && canAim;
            const computerAim = !!aimed && !target.immobile && canAim && aimed !== "hd" && !weapon.tag.includes( "pulse" )
                && ( computer || ( enhancedImaging && isTargetingComputerWeapon( weapon ) ) );
            const aimedHead = immobileAim && aimed === "hd";
            systemModifier( target.immobile ? ( aimedHead ? 3 : immobileModifier ) : 0, aimedHead ? "Immobile Target, Aimed At The Head" : "Immobile Target" );
            systemModifier( computer && !computerAim ? -1 : 0, "Targeting Computer" );
            if( computerAim ) {
                systemModifier(
                    computer ? ( enhancedImaging ? 2 : 3 ) : mech.usesEarlierRulesEdition() ? 6 : 5,
                    "Aimed At " + getLocationName( aimed!, false ) + ( computer ? ", Targeting Computer" : "" ) + ( enhancedImaging ? ", Enhanced Imaging" : "" ),
                );
            } else if( immobileAim && !aimedHead ) {
                otherModifiersExplanation.push( "Aimed At " + getLocationName( aimed!, false ) );
            } else if( aimed ) {
                otherModifiersExplanation.push( "Aimed Shot Not Allowed, Fired Unaimed" );
            }
            // A targeting and tracking system: anti-aircraft, or Multi-Trac in place of the secondary-target modifier
            // (Maximum Tech p.59).
            const system = mech.getTargetingSystem();
            if( system?.targetingSystem?.airborne ) {
                systemModifier( system.targetingSystem.airborne[target.airborne ? 0 : 1], system.name );
            }
            const offFrontArc = system?.targetingSystem?.offFrontArc;
            if( offFrontArc !== undefined ) {
                if( target.inRearArc && offFrontArc ) systemModifier( offFrontArc, system!.name + ", Target Outside The Front Arc" );
            // Battledroids has no modifier for a second target (BD pp.8-11, 15).
            } else if( !target.primary && mech.getEditionPlayRules()?.secondaryTargetModifiers !== false ) {
                if( target.inRearArc ) {
                    otherModifiersExplanation.push( "Secondary Target In Rear Arc (+2)");
                    gator.otherModifiers += 2;
                    gator.finalToHit += 2;
                } else {
                    otherModifiersExplanation.push( "Secondary Target In Front Arc (+1)");
                    gator.otherModifiers += 1;
                    gator.finalToHit += 1;
                }
            }
            gator.otherModifiersExplanation = otherModifiersExplanation.join(", ");

            const [shortModifier, mediumModifier, longModifier] = system?.targetingSystem?.ranges ?? [0, 2, 4];
            let inRange = true;
            if(
                target.range <= weaponRange.short
            ) {
                gator.rangeExplanation = "Short";
                gator.finalToHit += shortModifier;
                gator.rangeModifier = shortModifier;

                if(
                    weaponRange.min
                    &&
                    weaponRange.min > 0
                ) {
                    let minRange: number = 0;
                    minRange = weaponRange.min;

                    // +1 at the minimum range and +1 for each hex closer: [minimum] - [target range] + 1 (TW p.118; BD p.9).
                    if( target.range <= minRange ) {
                        const rangeModifier = minRange - target.range + 1;
                        gator.finalToHit += rangeModifier;
                        gator.rangeModifier += rangeModifier;
                        gator.rangeExplanation = "Minimum Range";
                    }
                }
            } else if(
                target.range <= weaponRange.medium
            ) {
                gator.finalToHit += mediumModifier;
                gator.rangeModifier = mediumModifier;
                gator.rangeExplanation = "Medium";
            } else if( target.range <= weaponRange.long ) {
                gator.finalToHit += longModifier;
                gator.rangeModifier = longModifier;
                gator.rangeExplanation = "Long";
            } else {
                // The Long Range Wars: extended and extreme range, with their own firer and target movement modifiers in
                // place of the standard ones, and ranging (The Best of Future Wars pp.55-56).
                const longRangeWars = mech.hasFutureWarsRuleset( FW_LONG_RANGE_WARS ) ? getLongRangeWarsBand( target.range, weaponRange.long ) : undefined;
                if( longRangeWars ) {
                    const mode = mech.currentMovementMode;
                    const standardFirer = mode === "w" ? 1 : mode === "r" ? 2 : mode === "j" ? 3 : 0;
                    const firer = getLongRangeWarsFirerModifier( mode );
                    const targetModifier = getLongRangeWarsTargetModifier( target.movement );
                    gator.finalToHit += longRangeWars.modifier + ( firer - standardFirer ) + ( targetModifier - target.movement );
                    gator.rangeModifier = longRangeWars.modifier;
                    gator.attackerMovementModifier = firer;
                    gator.targetMovementModifier = targetModifier;
                    gator.rangeExplanation = longRangeWars.band === "extended" ? "Extended" : "Extreme";
                    // Ranging only on a target that stayed still or moved 6 hexes or less (standard modifier +2 or less).
                    const ranging = target.movement <= 2 ? mech.futureWarsPlay.ranging ?? 0 : 0;
                    if( ranging > 0 ) {
                        gator.finalToHit -= ranging;
                        gator.otherModifiers -= ranging;
                        otherModifiersExplanation.push( "Ranging (-" + ranging + ")" );
                        gator.otherModifiersExplanation = otherModifiersExplanation.join(", ");
                    }
                } else {
                    inRange = false;
                    gator.finalToHit = -1;
                    gator.explanation = "The target is out of this weapon's range.";
                }
            }

            // Design quirks, with the game's "Use design quirks" switch on (CO pp.225-234).
            const rangeBand = target.range <= weaponRange.short ? "short" : target.range <= weaponRange.medium ? "medium" : target.range <= weaponRange.long ? "long" : undefined;
            // The Long Range Flamer's own penalty at range: +2 medium, +3 long (The Best of Future Wars p.28).
            if( rangeBand && getFutureWarsPlayKind( weapon ) === "lr-flamer" ) {
                const flamerModifier = getLRFlamerRangeModifier( rangeBand );
                if( flamerModifier ) {
                    gator.finalToHit += flamerModifier;
                    gator.otherModifiers += flamerModifier;
                    otherModifiersExplanation.push( "Long Range Flamer (+" + flamerModifier + ")" );
                    gator.otherModifiersExplanation = otherModifiersExplanation.join(", ");
                }
            }
            if( quirksInPlay && rangeBand ) {
                const quirkToHit = getQuirkToHit(mech.quirks, mech.getQuirkInstalledUuids(equipmentList), mech.getQuirkPlayYear(), {
                    weaponUuid: weapon.uuid,
                    rangeBand,
                    vsAirborne: !!target.airborne,
                    attackerRanOrFlanked: mech.currentMovementMode === "r",
                });
                if( quirkToHit.labels.length > 0 ) {
                    gator.finalToHit += quirkToHit.modifier;
                    gator.otherModifiers += quirkToHit.modifier;
                    otherModifiersExplanation.push( ...quirkToHit.labels );
                    gator.otherModifiersExplanation = otherModifiersExplanation.join(", ");
                }
            }

            // The Best of Future Wars play rulesets: a weapon that may not fire this turn (Strategic Movement, morale,
            // an opportunity shot already taken, a malfunction). Last, so no modifier after it lifts the -1.
            const noFire = inRange ? mech.getFutureWarsRulesetNoFire( weapon.uuid ) : undefined;
            if( noFire ) {
                gator.finalToHit = -1;
                gator.explanation = noFire;
            }
        }
    }

    if( gator.finalToHit > 12 ) {
        gator.explanation = "Any roll over 12 is an impossible shot.";
    } else if( gator.finalToHit >= 2 ) {
        let percentageToHit = 0;
        if( gator.finalToHit === 2 ) {
            percentageToHit = 100;
        } else if( gator.finalToHit === 3 ) {
            percentageToHit = 97.22;
        } else if( gator.finalToHit === 4 ) {
            percentageToHit = 91.66;
        } else if( gator.finalToHit === 5 ) {
            percentageToHit = 83.33;
        } else if( gator.finalToHit === 6 ) {
            percentageToHit = 72.22;
        } else if( gator.finalToHit === 7 ) {
            percentageToHit = 58.33;
        } else if( gator.finalToHit === 8 ) {
            percentageToHit = 41.66;
        } else if( gator.finalToHit === 9 ) {
            percentageToHit = 27.77;
        } else if( gator.finalToHit === 10 ) {
            percentageToHit = 16.66;
        } else if( gator.finalToHit === 11 ) {
            percentageToHit = 8.33;
        } else if( gator.finalToHit === 12 ) {
            percentageToHit = 2.77;
        }

        gator.explanation = "This roll has a " + percentageToHit.toString() + "% chance of success";

        if( target && target.inRearArc && !equipmentList[index].rear) {
            gator.explanation = "The target is in rear arc, and weapon is not rear-firing";
            gator.finalToHit = 0;
        }
        if( target && !target.inRearArc && equipmentList[index].rear) {
            gator.explanation = "The target is in front arc, and weapon is rear-firing";
            gator.finalToHit = 0;
        }
    }

    return gator;
}
