import { IASMULUnit } from "./classes/alpha-strike-unit";
import { BattleMech, IGATOR, ITargetToHit } from "./classes/battlemech";
import { IEquipmentItem } from "./data/data-interfaces";
import { getEquipmentCatalogs, getEquipmentListByTech } from "./data/equipment-registry";
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

function filterMULUnitsByName(units: IASMULUnit[], normalizedSearch: string): IASMULUnit[] {
    if (!normalizedSearch) {
        return [...units];
    }

    return units.filter((unit) => {
        const searchableName = `${unit.Name ?? ""} ${unit.Variant ?? ""}`.toLowerCase();
        return searchableName.includes(normalizedSearch);
    });
}

function getCachedMULSearchResults(
    searchTerm: string,
    appGlobals: IAppGlobals | null,
): IASMULUnit[] {
    const cachedUnits = appGlobals?.appSettings.alphasStrikeCachedSearchResults ?? [];
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const cachedMatches = filterMULUnitsByName(cachedUnits, normalizedSearch);
    if (cachedMatches.length > 0) {
        return cachedMatches;
    }

    // Fall back to the bundled, verified MUL snapshot if the user's own session cache has nothing.
    return filterMULUnitsByName(mulListItems, normalizedSearch);
}

function addMULUnavailableAlert(appGlobals: IAppGlobals | null): void {
    if (!appGlobals) {
        return;
    }

    appGlobals.siteAlerts.addAlert(
        "warning",
        "",
        "The Master Unit List live search is unavailable. Showing matching results from this device's saved search cache.",
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

    console.log('Searching...');
    if( offLine === false ) {
        try {
            let url = "https://masterunitlist.azurewebsites.net/Unit/QuickList?";
            let minpv = 1;
            let maxpv = 999;

            if( eraFilter && eraFilter > 0 ) {
                url += "&AvailableEras=" + eraFilter.toString();
            }

            url += rulesNumbersURI.join("");
            url += typesFilterURI.join();
            url += techFilterURI.join();
            url += roleFilterURI.join();
            url += factionFilterURI.join("");

            const abilitySearch: string[] = [];
            const abilityExclude: string[] = [];
            const nameSearch: string[] = [];
            const minDamage = [-1, -1, -1];
            const maxDamage = [999, 999, 999];
            const minArmorStructure = [-1, -1];
            const maxArmorStructure = [999, 999];
            const introDate = [-1, 10000];
            let minMove = -1;
            let maxMove = 999;
            let minJump = -1;
            let minDefense = -1;
            let exactDamageProfile: { short: number; medium: number; long: number } | null = null;

            const searchTerms = searchTerm.trim().split(" ");

            for (let i = 0; i < searchTerms.length; i++) {
                const term = searchTerms[i];
                let value: string | undefined;
                let match: RegExpMatchArray | null;

                if ((match = term.match(/^(\w+):(\d+)-(\d+)$/))) {
                    const [, field, minStr, maxStr] = match;
                    const min = parseInt(minStr);
                    const max = parseInt(maxStr);

                    switch (field) {
                        case "pv":
                        case "points":
                            minpv = min;
                            maxpv = max;
                            break;
                        case "year":
                        case "intro":
                            introDate[0] = min;
                            introDate[1] = max;
                            break;
                        case "armor":
                        case "ar":
                            minArmorStructure[0] = min;
                            maxArmorStructure[0] = max;
                            break;
                        case "structure":
                        case "st":
                            minArmorStructure[1] = min;
                            maxArmorStructure[1] = max;
                            break;
                        case "mv":
                        case "move":
                            minMove = min;
                            maxMove = max;
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
                                case ">": minpv = val + 1; break;
                                case ">=": minpv = val; break;
                                case "<": maxpv = val - 1; break;
                                case "<=": maxpv = val; break;
                                case "=": minpv = val; maxpv = val; break;
                            }
                            break;
                        case "short":
                        case "s":
                            switch (op) {
                                case ">": minDamage[0] = val + 1; break;
                                case ">=": minDamage[0] = val; break;
                                case "<": maxDamage[0] = val - 1; break;
                                case "<=": maxDamage[0] = val; break;
                                case "=": minDamage[0] = val; maxDamage[0] = val; break;
                            }
                            break;
                        case "medium":
                        case "m":
                            switch (op) {
                                case ">": minDamage[1] = val + 1; break;
                                case ">=": minDamage[1] = val; break;
                                case "<": maxDamage[1] = val - 1; break;
                                case "<=": maxDamage[1] = val; break;
                                case "=": minDamage[1] = val; maxDamage[1] = val; break;
                            }
                            break;
                        case "long":
                        case "l":
                            switch (op) {
                                case ">": minDamage[2] = val + 1; break;
                                case ">=": minDamage[2] = val; break;
                                case "<": maxDamage[2] = val - 1; break;
                                case "<=": maxDamage[2] = val; break;
                                case "=": minDamage[2] = val; maxDamage[2] = val; break;
                            }
                            break;
                        case "armor":
                        case "ar":
                            switch (op) {
                                case ">": minArmorStructure[0] = val + 1; break;
                                case ">=": minArmorStructure[0] = val; break;
                                case "<": maxArmorStructure[0] = val - 1; break;
                                case "<=": maxArmorStructure[0] = val; break;
                                case "=": minArmorStructure[0] = val; maxArmorStructure[0] = val; break;
                            }
                            break;
                        case "structure":
                        case "st":
                            switch (op) {
                                case ">": minArmorStructure[1] = val + 1; break;
                                case ">=": minArmorStructure[1] = val; break;
                                case "<": maxArmorStructure[1] = val - 1; break;
                                case "<=": maxArmorStructure[1] = val; break;
                                case "=": minArmorStructure[1] = val; maxArmorStructure[1] = val; break;
                            }
                            break;
                        case "year":
                        case "intro":
                            switch (op) {
                                case ">": introDate[0] = val + 1; break;
                                case ">=": introDate[0] = val; break;
                                case "<": introDate[1] = val - 1; break;
                                case "<=": introDate[1] = val; break;
                                case "=": introDate[0] = val; introDate[1] = val; break;
                            }
                            break;
                        case "mv":
                        case "move":
                            switch (op) {
                                case ">": minMove = val + 1; break;
                                case ">=": minMove = val; break;
                                case "<": maxMove = val - 1; break;
                                case "<=": maxMove = val; break;
                                case "=": minMove = val; maxMove = val; break;
                            }
                            break;
                        case "jump":
                        case "j":
                            switch (op) {
                                case ">": minJump = val + 1; break;
                                case ">=": minJump = val; break;
                                case "=": minJump = val; break;
                            }
                            break;
                        case "defense":
                        case "def":
                            switch (op) {
                                case ">": minDefense = val + 1; break;
                                case ">=": minDefense = val; break;
                            }
                            break;
                    }
                    continue;
                }

                if (term.startsWith("a:")) {
                    value = term.substring(2);
                    if (value.includes(",")) {
                        const abilities = value.split(",").filter(a => a.length > 1);
                        abilitySearch.push(...abilities);
                    } else if (value.startsWith("!")) {
                        const ability = value.substring(1);
                        if (ability.length > 1) {
                            abilityExclude.push(ability);
                        }
                    } else if (value.length > 1) {
                        abilitySearch.push(value);
                    }
                    continue;
                }

                if (term.startsWith("dmg:") || term.startsWith("damage:")) {
                    const dmgStr = term.substring(term.indexOf(":") + 1);
                    const parts = dmgStr.split("/");
                    if (parts.length === 3) {
                        exactDamageProfile = {
                            short: parts[0] === "*" ? -1 : parseInt(parts[0]),
                            medium: parts[1] === "*" ? -1 : parseInt(parts[1]),
                            long: parts[2] === "*" ? -1 : parseInt(parts[2]),
                        };
                    }
                    continue;
                }

                switch (true) {
                    case term.startsWith("a:"):
                        value = term.substring(2);
                        if (value.length > 1) {
                            abilitySearch.push(value);
                        }
                        break;
                    case term.startsWith("pv>"):
                        value = term.substring(3);
                        minpv = parseInt(value) + 1;
                        break;
                    case term.startsWith("pv<"):
                        value = term.substring(3);
                        maxpv = parseInt(value) - 1;
                        break;
                    case term.startsWith("pv="):
                        value = term.substring(3);
                        minpv = parseInt(value);
                        maxpv = parseInt(value);
                        break;
                    case term.startsWith("short>"):
                        value = term.includes("=") ? term.substring(7) : term.substring(6);
                        minDamage[0] = term.includes("=") ? parseInt(value) : parseInt(value) + 1;
                        break;
                    case term.startsWith("medium>"):
                        value = term.includes("=") ? term.substring(8) : term.substring(7);
                        minDamage[1] = term.includes("=") ? parseInt(value) : parseInt(value) + 1;
                        break;
                    case term.startsWith("long>"):
                        value = term.includes("=") ? term.substring(6) : term.substring(5);
                        minDamage[2] = term.includes("=") ? parseInt(value) : parseInt(value) + 1;
                        break;
                    case term.startsWith("armor>"):
                        value = term.includes("=") ? term.substring(7) : term.substring(6);
                        minArmorStructure[0] = term.includes("=") ? parseInt(value) : parseInt(value) + 1;
                        break;
                    case term.startsWith("structure>"):
                        value = term.includes("=") ? term.substring(11) : term.substring(10);
                        minArmorStructure[1] = term.includes("=") ? parseInt(value) : parseInt(value) + 1;
                        break;
                    case term.startsWith("intro>"):
                        value = term.includes("=") ? term.substring(7) : term.substring(6);
                        introDate[0] = term.includes("=") ? parseInt(value) : parseInt(value) + 1;
                        break;
                    case term.startsWith("intro<"):
                        value = term.includes("=") ? term.substring(7) : term.substring(6);
                        introDate[1] = term.includes("=") ? parseInt(value) : parseInt(value) - 1;
                        break;
                    default:
                        nameSearch.push(term);
                        break;
                }
            }

            if( abilitySearch.length > 0 ) {
                url += "&HasBFAbility=" + abilitySearch.join("+");
            }

            url += "&MinPV=" + minpv.toString();
            url += "&MaxPV=" + maxpv.toString();

            if( nameSearch.length > 0 && nameSearch.join("%20").length > 2 ) {
                url += "&Name=" + nameSearch.join("%20");
            }

            if(
                nameSearch.join("%20").length > 2
                || overrideSearchLimitLength
                || abilitySearch.length > 0
                || abilityExclude.length > 0
                || maxpv - minpv <= 40
                || minMove > -1
                || minJump > -1
                || minDefense > -1
                || exactDamageProfile !== null
            ) {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`MUL search request failed with HTTP ${response.status}`);
                }
                const returnData = await response.json();

                if( !returnData ) {
                    return [];
                }

                returnUnits = returnData.Units ?? [];

                for (let i = 0; i < returnUnits.length; i++) {
                    const unit = returnUnits[i];
                    let shouldRemove = false;

                    if( unit.BFDamageShort < minDamage[0] || unit.BFDamageShort > maxDamage[0] ) {
                        shouldRemove = true;
                    } else if( unit.BFDamageMedium < minDamage[1] || unit.BFDamageMedium > maxDamage[1] ) {
                        shouldRemove = true;
                    } else if( unit.BFDamageLong < minDamage[2] || unit.BFDamageLong > maxDamage[2] ) {
                        shouldRemove = true;
                    } else if( unit.BFArmor < minArmorStructure[0] || unit.BFArmor > maxArmorStructure[0] ) {
                        shouldRemove = true;
                    } else if( unit.BFStructure < minArmorStructure[1] || unit.BFStructure > maxArmorStructure[1] ) {
                        shouldRemove = true;
                    } else if( parseInt(unit.DateIntroduced) < introDate[0] || parseInt(unit.DateIntroduced) > introDate[1] ) {
                        shouldRemove = true;
                    } else if( minMove > -1 || maxMove < 999 ) {
                        let moveValue = 0;
                        if( unit.BFMove ) {
                            const moveMatch = unit.BFMove.match(/^(\d+)"?/);
                            if( moveMatch ) {
                                moveValue = parseInt(moveMatch[1]);
                            }
                        }
                        if( moveValue < minMove || moveValue > maxMove ) {
                            shouldRemove = true;
                        }
                    } else if( minJump > -1 ) {
                        let jumpValue = 0;
                        if( unit.BFMove && unit.BFMove.includes("j") ) {
                            const jumpMatch = unit.BFMove.match(/(\d+)"?j/);
                            if( jumpMatch ) {
                                jumpValue = parseInt(jumpMatch[1]);
                            }
                        }
                        if( jumpValue < minJump ) {
                            shouldRemove = true;
                        }
                    } else if( minDefense > -1 ) {
                        const totalDefense = unit.BFArmor + unit.BFStructure;
                        if( totalDefense < minDefense ) {
                            shouldRemove = true;
                        }
                    } else if( exactDamageProfile ) {
                        if( exactDamageProfile.short !== -1 && unit.BFDamageShort !== exactDamageProfile.short ) {
                            shouldRemove = true;
                        } else if( exactDamageProfile.medium !== -1 && unit.BFDamageMedium !== exactDamageProfile.medium ) {
                            shouldRemove = true;
                        } else if( exactDamageProfile.long !== -1 && unit.BFDamageLong !== exactDamageProfile.long ) {
                            shouldRemove = true;
                        }
                    } else if( abilityExclude.length > 0 ) {
                        const unitAbilities = unit.BFAbilities ? unit.BFAbilities.toUpperCase().split(", ") : [];
                        for( const excludeAbility of abilityExclude ) {
                            if( unitAbilities.includes(excludeAbility.toUpperCase()) ) {
                                shouldRemove = true;
                                break;
                            }
                        }
                    }

                    if( shouldRemove ) {
                        returnUnits.splice(i, 1);
                        i--;
                    }
                }
            }
        } catch (err) {
            console.error('MUL Fetch Error: ', err);
            addMULUnavailableAlert(appGlobals);
            return getCachedMULSearchResults(searchTerm, appGlobals);
        }
    } else {
        console.warn("Navigator is offline!");
        addMULUnavailableAlert(appGlobals);
        return getCachedMULSearchResults(searchTerm, appGlobals);
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
