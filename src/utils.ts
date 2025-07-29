import { IASMULUnit } from "./classes/alpha-strike-unit";
import { BattleMech, IGATOR, ITargetToHit } from "./classes/battlemech";
import { IEquipmentItem } from "./data/data-interfaces";
import { mechClanEquipmentEnergy } from "./data/mech-clan-equipment-weapons-energy";
import { mechISEquipmentBallistic } from "./data/mech-is-equipment-weapons-ballistic";
import { mechISEquipmentEnergy } from "./data/mech-is-equipment-weapons-energy";
import { mechISEquipmentMisc } from "./data/mech-is-equipment-weapons-misc";
import { mechISEquipmentMissiles } from "./data/mech-is-equipment-weapons-missiles";
import { IAppGlobals } from "./ui/app-router";
import { replaceAll } from "./utils/replaceAll";

export function getISEquipmentList(): IEquipmentItem[] {
    return mechISEquipmentBallistic
        .concat(
            mechISEquipmentEnergy,
            mechISEquipmentMissiles,
            mechISEquipmentMisc
        );
}

export function getClanEquipmentList(): IEquipmentItem[] {
    return mechClanEquipmentEnergy;
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

    // console.log("mechRules", mechRules, searchTerm)

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
    if( mechRules.toLowerCase() === "unknown" ) {//unknown
        rulesNumbersURI.push( "&Rules=78" );
    }

    let roleFilterURI: string[] = [];
    if( roleFilter.trim() ) {
        roleFilterURI.push( "&Roles=" + replaceAll(roleFilter, " ", "%20", false, false, true) );
    }

    let techFilterURI: string[] = [];
    // we can get passed 'is+clan' here from home.tsx if we're searching for mechs
    // in a mixed-tech lance (e.g. GDL, WD, KH) - we just skip any filtering
    // at this point.
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
        // let url = "https://btmul.net/Unit/QuickList?MinPV=1&MaxPV=999";
        // let url = "http://localhost:5001/Unit/QuickList?MinPV=1&MaxPV=999";
        let url = "https://masterunitlist.azurewebsites.net/Unit/QuickList?"
        let minpv = 1;
        let maxpv = 999;

        // if( eraFilter && eraFilter > 0 ) {
        //     url += "&Eras=" + eraFilter.toString();
        // }
        if( eraFilter && eraFilter > 0 ) {
            url += "&AvailableEras=" + eraFilter.toString();
        }

        url += rulesNumbersURI.join("");
        url += typesFilterURI.join();
        url += techFilterURI.join();
        url += roleFilterURI.join();
        url += factionFilterURI.join("");

        var abilitySearch: string[] = [];
        var abilityExclude: string[] = [];
        var nameSearch: string[] = [];
        var minDamage = [-1, -1, -1];
        var maxDamage = [999, 999, 999];
        var minArmorStructure = [-1, -1];
        var maxArmorStructure = [999, 999];
        var introDate = [-1,10000];
        var minMove = -1;
        var maxMove = 999;
        var minJump = -1;
        var minDefense = -1;
        var exactDamageProfile: { short: number; medium: number; long: number } | null = null
    


        var searchTerms = searchTerm.trim().split(" ");

        for (var i = 0; i < searchTerms.length; i++) {
            let term = searchTerms[i];
            let value;
            let match;
            
            // Range syntax: field:min-max
            if (match = term.match(/^(\w+):(\d+)-(\d+)$/)) {
                const [, field, minStr, maxStr] = match;
                const min = parseInt(minStr);
                const max = parseInt(maxStr);
                
                switch(field) {
                    case 'pv':
                    case 'points':
                        minpv = min;
                        maxpv = max;
                        break;
                    case 'year':
                    case 'intro':
                        introDate[0] = min;
                        introDate[1] = max;
                        break;
                    case 'armor':
                    case 'ar':
                        minArmorStructure[0] = min;
                        maxArmorStructure[0] = max;
                        break;
                    case 'structure':
                    case 'st':
                        minArmorStructure[1] = min;
                        maxArmorStructure[1] = max;
                        break;
                    case 'mv':
                    case 'move':
                        minMove = min;
                        maxMove = max;
                        break;
                }
                continue;
            }
            
            // Enhanced comparison operators: field>=value, field<=value, field!=value
            if (match = term.match(/^(\w+)(>=|<=|!=|>|<|=)(.+)$/)) {
                const [, field, op, valueStr] = match;
                const val = parseInt(valueStr);
                
                switch(field) {
                    case 'pv':
                    case 'points':
                        switch(op) {
                            case '>': minpv = val + 1; break;
                            case '>=': minpv = val; break;
                            case '<': maxpv = val - 1; break;
                            case '<=': maxpv = val; break;
                            case '=': minpv = val; maxpv = val; break;
                            case '!=': 
                                // Handle != by setting ranges around the value
                                if (val > minpv && val < maxpv) {
                                    // This is tricky with MUL API, we'll filter locally
                                }
                                break;
                        }
                        break;
                    case 'short':
                    case 's':
                        switch(op) {
                            case '>': minDamage[0] = val + 1; break;
                            case '>=': minDamage[0] = val; break;
                            case '<': maxDamage[0] = val - 1; break;
                            case '<=': maxDamage[0] = val; break;
                            case '=': minDamage[0] = val; maxDamage[0] = val; break;
                        }
                        break;
                    case 'medium':
                    case 'm':
                        switch(op) {
                            case '>': minDamage[1] = val + 1; break;
                            case '>=': minDamage[1] = val; break;
                            case '<': maxDamage[1] = val - 1; break;
                            case '<=': maxDamage[1] = val; break;
                            case '=': minDamage[1] = val; maxDamage[1] = val; break;
                        }
                        break;
                    case 'long':
                    case 'l':
                        switch(op) {
                            case '>': minDamage[2] = val + 1; break;
                            case '>=': minDamage[2] = val; break;
                            case '<': maxDamage[2] = val - 1; break;
                            case '<=': maxDamage[2] = val; break;
                            case '=': minDamage[2] = val; maxDamage[2] = val; break;
                        }
                        break;
                    case 'armor':
                    case 'ar':
                        switch(op) {
                            case '>': minArmorStructure[0] = val + 1; break;
                            case '>=': minArmorStructure[0] = val; break;
                            case '<': maxArmorStructure[0] = val - 1; break;
                            case '<=': maxArmorStructure[0] = val; break;
                            case '=': minArmorStructure[0] = val; maxArmorStructure[0] = val; break;
                        }
                        break;
                    case 'structure':
                    case 'st':
                        switch(op) {
                            case '>': minArmorStructure[1] = val + 1; break;
                            case '>=': minArmorStructure[1] = val; break;
                            case '<': maxArmorStructure[1] = val - 1; break;
                            case '<=': maxArmorStructure[1] = val; break;
                            case '=': minArmorStructure[1] = val; maxArmorStructure[1] = val; break;
                        }
                        break;
                    case 'year':
                    case 'intro':
                        switch(op) {
                            case '>': introDate[0] = val + 1; break;
                            case '>=': introDate[0] = val; break;
                            case '<': introDate[1] = val - 1; break;
                            case '<=': introDate[1] = val; break;
                            case '=': introDate[0] = val; introDate[1] = val; break;
                        }
                        break;
                    case 'mv':
                    case 'move':
                        switch(op) {
                            case '>': minMove = val + 1; break;
                            case '>=': minMove = val; break;
                            case '<': maxMove = val - 1; break;
                            case '<=': maxMove = val; break;
                            case '=': minMove = val; maxMove = val; break;
                        }
                        break;
                    case 'jump':
                    case 'j':
                        switch(op) {
                            case '>': minJump = val + 1; break;
                            case '>=': minJump = val; break;
                            case '=': minJump = val; break;
                        }
                        break;
                    case 'defense':
                    case 'def':
                        switch(op) {
                            case '>': minDefense = val + 1; break;
                            case '>=': minDefense = val; break;
                        }
                        break;
                }
                continue;
            }
            
            // Enhanced ability syntax
            if (term.startsWith("a:")) {
                value = term.substring(2);
                if (value.includes(",")) {
                    // AND logic - must have all abilities
                    const abilities = value.split(",").filter(a => a.length > 1);
                    abilitySearch.push(...abilities);
                } else if (value.startsWith("!")) {
                    // NOT logic - must not have
                    const ability = value.substring(1);
                    if (ability.length > 1) {
                        abilityExclude.push(ability);
                    }
                } else if (value.length > 1) {
                    // Single ability
                    abilitySearch.push(value);
                }
                continue;
            }
            
            // Damage profile syntax: dmg:3/3/2 or dmg:3/*/*
            if (term.startsWith("dmg:") || term.startsWith("damage:")) {
                const dmgStr = term.substring(term.indexOf(":") + 1);
                const parts = dmgStr.split("/");
                if (parts.length === 3) {
                    exactDamageProfile = {
                        short: parts[0] === "*" ? -1 : parseInt(parts[0]),
                        medium: parts[1] === "*" ? -1 : parseInt(parts[1]),
                        long: parts[2] === "*" ? -1 : parseInt(parts[2])
                    };
                }
                continue;
            }
            
            // Legacy syntax support (backward compatibility)
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
                    if (term.includes("=")) {
                        value = term.substring(7);
                        minDamage[0] = parseInt(value);
                    } else {
                        value = term.substring(6);
                        minDamage[0] = parseInt(value) + 1;
                    }
                    break;
        
                case term.startsWith("medium>"):
                    if (term.includes("=")) {
                        value = term.substring(8);
                        minDamage[1] = parseInt(value);
                    } else {
                        value = term.substring(7);
                        minDamage[1] = parseInt(value) + 1;
                    }
                    break;
        
                case term.startsWith("long>"):
                    if (term.includes("=")) {
                        value = term.substring(6);
                        minDamage[2] = parseInt(value);
                    } else {
                        value = term.substring(5);
                        minDamage[2] = parseInt(value) + 1;
                    }
                    break;

                case term.startsWith("armor>"):
                    if (term.includes("=")) {
                        value = term.substring(7);
                        minArmorStructure[0] = parseInt(value);
                    } else {
                        value = term.substring(6);
                        minArmorStructure[0] = parseInt(value) + 1;
                    }
                    break;

                case term.startsWith("structure>"):
                    if (term.includes("=")) {
                        value = term.substring(11);
                        minArmorStructure[1] = parseInt(value);
                    } else {
                        value = term.substring(10);
                        minArmorStructure[1] = parseInt(value) + 1;
                    }
                    break;
            
                case term.startsWith("intro>"):
                    if (term.includes("=")) {
                        value = term.substring(7);
                        introDate[0] = parseInt(value);
                    } else {
                        value = term.substring(6);
                        introDate[0] = parseInt(value) + 1;
                    }
                    break;

                case term.startsWith("intro<"):
                    if (term.includes("=")) {
                        value = term.substring(7);
                        introDate[1] = parseInt(value);
                    } else {
                        value = term.substring(6);
                        introDate[1] = parseInt(value) - 1;
                    }
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

        if( nameSearch.length > 0) {
            if(nameSearch.join("%20").length > 2){
                url += "&Name=" + nameSearch.join("%20");
            }
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
            await fetch(url)
            .then(async res => {
                let returnData = await res.json();

                if(!returnData) {
                    return [];
                }

                returnUnits = returnData.Units;
               
                if( !returnUnits ) {
                    return [];
                }
                for (i = 0; i < returnUnits.length; i++) {
                    let unit = returnUnits[i];
                    let shouldRemove = false;
                    
                    // Damage range filters
                    if( unit.BFDamageShort < minDamage[0] || unit.BFDamageShort > maxDamage[0] ) {
                        shouldRemove = true;
                    } else if( unit.BFDamageMedium < minDamage[1] || unit.BFDamageMedium > maxDamage[1] ) {
                        shouldRemove = true;
                    } else if( unit.BFDamageLong < minDamage[2] || unit.BFDamageLong > maxDamage[2] ) {
                        shouldRemove = true;
                    }
                    
                    // Armor/Structure range filters
                    else if( unit.BFArmor < minArmorStructure[0] || unit.BFArmor > maxArmorStructure[0] ) {
                        shouldRemove = true;
                    } else if( unit.BFStructure < minArmorStructure[1] || unit.BFStructure > maxArmorStructure[1] ) {
                        shouldRemove = true;
                    }
                    
                    // Year range filter
                    else if( parseInt(unit.DateIntroduced) < introDate[0] || parseInt(unit.DateIntroduced) > introDate[1] ) {
                        shouldRemove = true;
                    }
                    
                    // Movement filters
                    else if( minMove > -1 || maxMove < 999 ) {
                        // Parse movement string (e.g., "10"j", "8"/12"j", "10"")
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
                    }
                    
                    // Jump filter
                    else if( minJump > -1 ) {
                        let hasJump = unit.BFMove && unit.BFMove.includes("j");
                        let jumpValue = 0;
                        if( hasJump ) {
                            // Extract jump value from strings like "10"j" or "8"/12"j"
                            const jumpMatch = unit.BFMove.match(/(\d+)"?j/);
                            if( jumpMatch ) {
                                jumpValue = parseInt(jumpMatch[1]);
                            }
                        }
                        if( jumpValue < minJump ) {
                            shouldRemove = true;
                        }
                    }
                    
                    // Defense filter (armor + structure)
                    else if( minDefense > -1 ) {
                        const totalDefense = unit.BFArmor + unit.BFStructure;
                        if( totalDefense < minDefense ) {
                            shouldRemove = true;
                        }
                    }
                    
                    // Exact damage profile filter
                    else if( exactDamageProfile ) {
                        if( exactDamageProfile.short !== -1 && unit.BFDamageShort !== exactDamageProfile.short ) {
                            shouldRemove = true;
                        } else if( exactDamageProfile.medium !== -1 && unit.BFDamageMedium !== exactDamageProfile.medium ) {
                            shouldRemove = true;
                        } else if( exactDamageProfile.long !== -1 && unit.BFDamageLong !== exactDamageProfile.long ) {
                            shouldRemove = true;
                        }
                    }
                    
                    // Enhanced ability filtering
                    else if( abilityExclude.length > 0 ) {
                        const unitAbilities = unit.BFAbilities ? unit.BFAbilities.toUpperCase().split(", ") : [];
                        
                        // Exclude abilities
                        for( let excludeAbility of abilityExclude ) {
                            if( unitAbilities.includes(excludeAbility.toUpperCase()) ) {
                                shouldRemove = true;
                                break;
                            }
                        }
                    }
                    
                    // Remove unit if it failed any filter
                    if( shouldRemove ) {
                        returnUnits.splice(i, 1);
                        i--;
                    }
                }
            })
            .catch(err => {
                console.error('MUL Fetch Error: ', err);
                if( appGlobals ) {
                    appGlobals.siteAlerts.addAlert(
                        "danger",
                        "",
                        "Cannot reach the Master Unit List! You're either offline or the MUL is down :(",
                        "danger",
                        true,
                        null,
                        10,
                        "",
                        "",
                        "",
                        "MULDOWN"
                    )
                }
            })
        }

    } else {

        console.warn("Navigator is offline!")
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
        return 0
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
        return "25+"
    } else if( mod > 4 ) {
        return "18-24"
    } else if( mod > 3 ) {
        return "10-17"
    } else if( mod > 2 ) {
        return "7-9"
    } else if( mod > 1 ) {
        return "5-6"
    } else if( mod > 0 ) {
        return "3-4"
    } else {
        return "0-2"
    }

}

const clusterHitsTable = [
    [   // roll of 2, array index 0
        1,1,1,1,2,2,3,3,3,4,4,4,5,5,5,5,6,6,6,7,7,7,8,8,9,9,9,10,10,12,
    ],
    [ // roll of 3, array index 1
        1,1,2,2,2,2,3,3,3,4,4,4,5,5,5,5,6,6,6,7,7,7,8,8,9,9,9, 10, 10, 12,
    ],
    [// roll of 4, array index 2
        1,1,2,2,3,3,4,4,4,5,5,5,6,6,7,7,8,8,9,9,9, 10, 10, 10, 11, 11, 11, 12, 12, 18,
    ],
    [ // roll of 5, array index 3
        1,2,2,3,3,4,4,5,6,7,8,8,9,9, 10, 10, 11, 11, 12, 13, 14, 15, 16, 16, 17, 17, 17, 18, 18, 24,
    ],
    [ // roll of 6, array index 4
        1,2,2,3,4,4,5,5,6,7,8,8,9,9, 10, 10, 11, 11, 12, 13, 14, 15, 16, 16, 17, 17, 17, 18, 18, 24,
    ],
    [ // roll of 7, array index 5
        1,2,3,3,4,4,5,5,6,7,8,8,9,9, 10, 10, 11, 11, 12, 13, 14, 15, 16, 16, 17, 17, 17, 18, 18, 24,
    ],
    [ // roll of 8, array index 6
        2,2,3,3,4,4,5,5,6,7,8,8,9,9, 10, 10, 11, 11, 12, 13, 14, 15, 16, 16, 17, 17, 17, 18, 18, 24,
    ],
    [ // roll of 9, array index 7
        2,2,3,4,5,6,6,7,8,9, 10, 11, 11, 12, 13, 14, 14, 15, 16, 17, 18, 19, 20, 21, 21, 22, 23, 23, 24, 32,
    ],
    [ // roll of 10, array index 8
        2,3,3,4,5,6,6,7,8,9, 10, 11, 11, 12, 13, 14, 14, 15, 16, 17, 18, 19, 20, 21, 21, 22, 23, 23, 24, 32,
    ],
    [ // roll of 11, array index 9
        2,3,4,5,6,7,8,9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 40,
    ],
    [ // roll of 12, array index 10
        2,3,4,5,6,7,8,9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 40,
    ],
]

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
            return "Head"
        }

        case "ct": {
            return "Center Torso"
        }
        case "rt": {
            return "Right Torso"
        }
        case "lt": {
            return "Left Torso"
        }

        case "ctr": {
            return "Center Torso (Rear)"
        }
        case "rtr": {
            return "Right Torso (Rear)"
        }
        case "ltr": {
            return "Left Torso (Rear)"
        }

        case "ra": {
            if( forQuad )
                return "Right Front Leg"

            return "Right Arm"
        }
        case "la": {
            if( forQuad )
                return "Left Front Leg"
            return "Left Arm"
        }

        case "rl": {
            if( forQuad )
                return "Right Rear Leg"
            return "Right Leg"
        }
        case "ll": {
            if( forQuad )
                return "Left Rear Leg"
            return "Left Leg"
        }
    }

    return "???"
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

        // TS Typechecker is being an idiot here >:(
        // At this point, it's NOT undefined... how many times do I have to check?
        //@ts-ignore
        let targetLetter: string = equipmentList[index].target;

        if( target === null && mech ) {
            target = mech.getTarget( targetLetter )
        }

        if( target ) {
            gator.targetObj = target;
            gator.targetName = target.name;

            gator.target = "Target " + targetLetter.toUpperCase();
            gator.weaponName = equipmentList[index].name;

            // G
            gator.finalToHit = gator.gunnerySkill;

            // A
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

            // T
            gator.finalToHit += target.movement;
            gator.targetMovementModifier = target.movement;

            // O
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
                //@ts-ignore
                gator.finalToHit += equipmentList[index].accuracyModifier;
                //@ts-ignore
                gator.otherModifiers = equipmentList[index].accuracyModifier;

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
            gator.otherModifiersExplanation = otherModifiersExplanation.join(", ")

            // R
            if(
                target.range <= equipmentList[index].range.short
            ) {

                gator.rangeExplanation = "Short";

                // Check minimum range
                if(
                    equipmentList[index].range.min
                    &&
                    //@ts-ignore
                    equipmentList[index].range.min > 0
                ) {
                    let minRange: number = 0;
                    //@ts-ignore
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
            } else if( target.range <=equipmentList[index].range.long ) {
                gator.finalToHit += 4;
                gator.rangeModifier = 4;
                gator.rangeExplanation = "Long";
            } else {
                // Out of range
                gator.finalToHit = -1;
                gator.explanation = "The target is out of this weapon's range."
            }

        }

    }

    if( gator.finalToHit > 12 ) {
        gator.explanation = "Any roll over 12 is an impossible shot."
    } else if( gator.finalToHit >= 2 ) {
        let percentageToHit = 0;
        if( gator.finalToHit === 2 ) {
            percentageToHit = 100
        } else if( gator.finalToHit === 3 ) {
            percentageToHit = 97.22
        } else if( gator.finalToHit === 4 ) {
            percentageToHit = 91.66
        } else if( gator.finalToHit === 5 ) {
            percentageToHit = 83.33
        } else if( gator.finalToHit === 6 ) {
            percentageToHit = 72.22
        } else if( gator.finalToHit === 7 ) {
            percentageToHit = 58.33
        } else if( gator.finalToHit === 8 ) {
            percentageToHit = 31.66
        } else if( gator.finalToHit === 9 ) {
            percentageToHit = 27.77
        } else if( gator.finalToHit === 10 ) {
            percentageToHit = 16.66
        } else if( gator.finalToHit === 11 ) {
            percentageToHit = 8.33
        } else if( gator.finalToHit === 12 ) {
            percentageToHit = 2.77
        }

        gator.explanation = "This roll has a " + percentageToHit.toString() + "% chance of success"

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
