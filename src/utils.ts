import { IASMULUnit } from "./classes/alpha-strike-unit";
import { BattleMech, IGATOR, ITargetToHit } from "./classes/battlemech";
import { CONST_MUL_API_ENABLED } from "./configVars";
import { IEquipmentItem } from "./data/data-interfaces";
import { getEquipmentCatalogs, getEquipmentListByTech } from "./data/equipment-registry";
import battleArmorMulListItems from "./data/mul-battle-armor";
import { mulListItems } from "./data/mul-list-items";
import { IAppGlobals } from "./ui/app-router";
import { replaceAll } from "./utils/replaceAll";

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

const cachedMULListItems = [...mulListItems, ...battleArmorMulListItems];

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

        switch (true) {
            case term.startsWith("pv>"):
                value = term.substring(3);
                tokens.minPV = parseInt(value) + 1;
                break;
            case term.startsWith("pv<"):
                value = term.substring(3);
                tokens.maxPV = parseInt(value) - 1;
                break;
            case term.startsWith("pv="):
                value = term.substring(3);
                tokens.minPV = parseInt(value);
                tokens.maxPV = parseInt(value);
                break;
            case term.startsWith("short>"):
                value = term.includes("=") ? term.substring(7) : term.substring(6);
                tokens.minDamage[0] = term.includes("=") ? parseInt(value) : parseInt(value) + 1;
                break;
            case term.startsWith("medium>"):
                value = term.includes("=") ? term.substring(8) : term.substring(7);
                tokens.minDamage[1] = term.includes("=") ? parseInt(value) : parseInt(value) + 1;
                break;
            case term.startsWith("long>"):
                value = term.includes("=") ? term.substring(6) : term.substring(5);
                tokens.minDamage[2] = term.includes("=") ? parseInt(value) : parseInt(value) + 1;
                break;
            case term.startsWith("armor>"):
                value = term.includes("=") ? term.substring(7) : term.substring(6);
                tokens.minArmorStructure[0] = term.includes("=") ? parseInt(value) : parseInt(value) + 1;
                break;
            case term.startsWith("structure>"):
                value = term.includes("=") ? term.substring(11) : term.substring(10);
                tokens.minArmorStructure[1] = term.includes("=") ? parseInt(value) : parseInt(value) + 1;
                break;
            case term.startsWith("intro>"):
                value = term.includes("=") ? term.substring(7) : term.substring(6);
                tokens.introDate[0] = term.includes("=") ? parseInt(value) : parseInt(value) + 1;
                break;
            case term.startsWith("intro<"):
                value = term.includes("=") ? term.substring(7) : term.substring(6);
                tokens.introDate[1] = term.includes("=") ? parseInt(value) : parseInt(value) - 1;
                break;
            default:
                tokens.nameTerms.push(term);
                break;
        }
    }

    return tokens;
}

// Applies the dropdown filters (Rules/Technology/Role/Era/Type) the live API used to take as query params.
// Faction filtering is intentionally excluded: per-faction availability isn't part of the bundled/cached unit data.
function matchesMULDropdownFilters(
    unit: IASMULUnit,
    mechRules: string,
    techFilter: string,
    roleFilter: string,
    eraFilter: number,
    typeFilter: number,
): boolean {
    if (mechRules && mechRules.trim()) {
        const allowedRules = MUL_RULES_LEVEL_MAP[mechRules.toLowerCase()];
        if (allowedRules && !allowedRules.includes((unit.Rules ?? "").toLowerCase())) {
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

    if (eraFilter && eraFilter > 0) {
        if (unit.EraId !== eraFilter) {
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

    if (tokens.abilitySearch.length > 0) {
        const unitAbilities = (unit.BFAbilities ?? "").toUpperCase();
        for (const ability of tokens.abilitySearch) {
            if (!unitAbilities.includes(ability.toUpperCase())) {
                return false;
            }
        }
    }

    if (tokens.abilityExclude.length > 0) {
        const unitAbilities = unit.BFAbilities
            ? unit.BFAbilities.toUpperCase().split(",").map((a) => a.trim())
            : [];
        for (const excludeAbility of tokens.abilityExclude) {
            if (unitAbilities.some((a) => a.startsWith(excludeAbility.toUpperCase()))) {
                return false;
            }
        }
    }

    return true;
}

function getCachedMULSearchResults(
    searchTerm: string,
    mechRules: string,
    techFilter: string,
    roleFilter: string,
    eraFilter: number,
    typeFilter: number,
    appGlobals: IAppGlobals | null,
): IASMULUnit[] {
    const tokens = parseMULSearchTokens(searchTerm);
    const matchesAllFilters = (unit: IASMULUnit) =>
        matchesMULDropdownFilters(unit, mechRules, techFilter, roleFilter, eraFilter, typeFilter) &&
        matchesMULSearchTokens(unit, tokens);

    const cachedUnits = appGlobals?.appSettings.alphasStrikeCachedSearchResults ?? [];
    const cachedMatches = cachedUnits.filter(matchesAllFilters);
    if (cachedMatches.length > 0) {
        return cachedMatches;
    }

    // Fall back to the bundled, verified MUL snapshot if the user's own session cache has nothing.
    return cachedMULListItems.filter(matchesAllFilters);
}

function addMULUnavailableAlert(appGlobals: IAppGlobals | null, factionFilterActive: boolean): void {
    if (!appGlobals) {
        return;
    }

    appGlobals.siteAlerts.addAlert(
        "warning",
        "",
        "The Master Unit List live search is unavailable. Showing matching results from this device's saved data instead."
            + (factionFilterActive ? " Faction filtering is not available in this offline mode." : ""),
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
): Promise<IASMULUnit[]> {

    let returnUnits: IASMULUnit[] = [];

    let rulesNumbersURI: string[] = [];

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

    let roleFilterURI: string[] = [];
    if( roleFilter.trim() ) {
        roleFilterURI.push( "&Roles=" + replaceAll(roleFilter, " ", "%20", false, false, true) );
    }

    let techFilterURI: string[] = [];
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

    let typesFilterURI: string[] = [];
    if( typeFilter ) {
        typesFilterURI.push( "&Types=" + typeFilter.toString() );
    }

    let factionFilterURI: string[] = [];
    if( factionFilter.length > 0 ) {
        for( let faction of factionFilter ) {
            factionFilterURI.push( "&Factions=" + faction );
        }
    }

    const tokens = parseMULSearchTokens(searchTerm);

    console.log('Searching...');
    if( offLine === false && CONST_MUL_API_ENABLED ) {
        try {
            let url = "https://masterunitlist.azurewebsites.net/Unit/QuickList?";

            if( eraFilter && eraFilter > 0 ) {
                url += "&AvailableEras=" + eraFilter.toString();
            }

            url += rulesNumbersURI.join("");
            url += typesFilterURI.join();
            url += techFilterURI.join();
            url += roleFilterURI.join();
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
            addMULUnavailableAlert(appGlobals, factionFilter.length > 0);
            return getCachedMULSearchResults(searchTerm, mechRules, techFilter, roleFilter, eraFilter, typeFilter, appGlobals);
        }
    } else {
        if( offLine ) {
            console.warn("Navigator is offline!");
        } else {
            console.warn("MUL API is disabled, using bundled fallback data.");
        }
        addMULUnavailableAlert(appGlobals, factionFilter.length > 0);
        return getCachedMULSearchResults(searchTerm, mechRules, techFilter, roleFilter, eraFilter, typeFilter, appGlobals);
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

export function sortEquipment (
    a: IEquipmentItem,
    b: IEquipmentItem,
): number {
    if( a.sort.toLocaleLowerCase().trim() >  b.sort.toLocaleLowerCase().trim() ) {
        return 1;
    } else if( a.sort.toLocaleLowerCase().trim() <  b.sort.toLocaleLowerCase().trim() ) {
        return -1;
    } else {
        return 0;
    }
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
    if( clusterHitsTable[ roll - 2 ] && clusterHitsTable[ roll - 2][ numberCluster - 2] ) {
        return clusterHitsTable[ roll - 2][ numberCluster - 2];
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
    }

    return "???";
}

export function getTargetToHitFromWeapon(
    mech: BattleMech,
    index: number,
    target: ITargetToHit | null = null,
    equipmentList: IEquipmentItem[] | null = null,
): IGATOR {
    let gator: IGATOR = JSON.parse(JSON.stringify(mech.getGATOR()));

    if( equipmentList === null ) {
        equipmentList = mech.equipmentList;
    }
    gator.finalToHit = -1;
    if(
        equipmentList.length > index
        && equipmentList[index]
        && typeof( equipmentList[index].target ) !== "undefined"
        && equipmentList[index].target
    ) {
        // @ts-expect-error Legacy compatibility type mismatch        let targetLetter: string = equipmentList[index].target;

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

            let otherModifiersExplanation: string[] = [];
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
                // @ts-expect-error Legacy compatibility type mismatch                gator.finalToHit += equipmentList[index].accuracyModifier;
                // @ts-expect-error Legacy compatibility type mismatch                gator.otherModifiers = equipmentList[index].accuracyModifier;

                otherModifiersExplanation.push( "Weapon Accuracy Modifier" );
            }
            if( !target.primary) {
                if( target.inRearArc ) {
                    otherModifiersExplanation.push( "Secondary Target In Rear Arc (+2)");
                    gator.otherModifiers += 2;
                    gator.finalToHit += 2;
                } else {
                    otherModifiersExplanation.push( "Secondary Target In Rear Arc (+1)");
                    gator.otherModifiers += 1;
                    gator.finalToHit += 1;
                }
            }
            gator.otherModifiersExplanation = otherModifiersExplanation.join(", ");

            if(
                target.range <= equipmentList[index].range.short
            ) {
                gator.rangeExplanation = "Short";

                if(
                    equipmentList[index].range.min
                    &&
                    // @ts-expect-error Legacy compatibility type mismatch
                    equipmentList[index].range.min > 0
                ) {
                    let minRange: number = 0;
                    // @ts-expect-error Legacy compatibility type mismatch
                    minRange = equipmentList[index].range.min;

                    if( target.range < minRange ) {
                        let rangeModifier = minRange - target.range;
                        gator.finalToHit += rangeModifier;
                        gator.rangeModifier = rangeModifier;
                        gator.rangeExplanation = "Minimum Range";
                    }
                }
            } else if(
                target.range <= equipmentList[index].range.medium
            ) {
                gator.finalToHit += 2;
                gator.rangeModifier = 2;
                gator.rangeExplanation = "Medium";
            } else if( target.range <= equipmentList[index].range.long ) {
                gator.finalToHit += 4;
                gator.rangeModifier = 4;
                gator.rangeExplanation = "Long";
            } else {
                gator.finalToHit = -1;
                gator.explanation = "The target is out of this weapon's range.";
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
            percentageToHit = 31.66;
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
