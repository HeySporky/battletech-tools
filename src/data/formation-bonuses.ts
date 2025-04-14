/*
 * The data here is/may be copyrighted and NOT included in the GPLv3 license.
 */

import { ASMULRole } from "../classes/alpha-strike-unit";
import AlphaStrikeGroup from "../classes/alpha-strike-group";

export interface IFormationBonus {
    Name: string;
    IdealRole?: ASMULRole;
    IsValid(group:AlphaStrikeGroup): boolean;
    BonusDescription: string
    RequirementsDescription: string
}

class FormationBonusBase {
    CheckIdealRole(group:AlphaStrikeGroup, role:string):boolean{
        for(let i=0; i<group.members.length; i++){
            if (group.members[i].role!==role)
            return false;
        }
        return true;
    }
    RoleCount(group:AlphaStrikeGroup, role:string):number{
        return group.members.filter(x=>x.role===role).length;
    }
    HasMinimumMembers(group:AlphaStrikeGroup):boolean{
        return group.members.length>=3;
    }
}
class None extends FormationBonusBase implements IFormationBonus {
    Name: string="None";
    IsValid(group: AlphaStrikeGroup): boolean {
        return true;
    }
    BonusDescription: string="None";
    RequirementsDescription: string="None";

}
class BattleLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Battle Lance";
    IdealRole: ASMULRole = {Id:109, Name: "Brawler", Image:"", SortOrder:109};
    BonusDescription: string = "The Battle Lance formation receives the equivalent of a Lucky Special Pilot Ability (see p. 97) as a level of the number of units in the formation at Setup plus two. So a Lance of 4 ‘Mechs in a Battle Lance receives a 6-point Lucky Special Ability. It is useable by any unit in the Battle Lance, rather than limited to any single unit. This bonus ability may be stacked with a Lucky SPA assigned to one or more of the Battle Lance’s member units. But if this is done, the maximum number of rerolls a Battle Lance unit may attempt for the duration of the scenario— between both the pilot’s ability and that provided bythis formation bonus—is 4.";
    RequirementsDescription: string = "50 percent of the standard Battle Lance must be Size 3 or higher. If the Battle Lance is a vehicle formation, these Size 3+ units must also be pairs of the same vehicle model. At least three units in a Battle Lance must also be any combination of the Brawler, Sniper and/or Skirmisher unit roles.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }
        if (this.CheckIdealRole(group, this.IdealRole.Name)){
            return true;
        }
        let result =true;
        result = result && (Math.ceil(group.members.length*.50)<=group.members.filter(x=>x.size>=3).length);
        let brawlerSniperSkirmisherCount = this.RoleCount(group, "Brawler") + this.RoleCount(group, "Sniper")+this.RoleCount(group, "Skirmisher");
        result = result && (brawlerSniperSkirmisherCount >=3)
        return result;
    }

}
class LightBattleLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Light Battle Lance";
    BonusDescription: string = "The Battle Lance formation receives the equivalent of a Lucky Special Pilot Ability (see p. 97) as a level of the number of units in the formation at Setup plus two. So a Lance of 4 ‘Mechs in a Battle Lance receives a 6-point Lucky Special Ability. It is useable by any unit in the Battle Lance, rather than limited to any single unit. This bonus ability may be stacked with a Lucky SPA assigned to one or more of the Battle Lance’s member units. But if this is done, the maximum number of rerolls a Battle Lance unit may attempt for the duration of the scenario— between both the pilot’s ability and that provided bythis formation bonus—is 4.";
    RequirementsDescription: string = "At least 75 percent of this Lance must be Size 1, and there may be no units of Size 4 of higher in this formation type. If this is a vehicle formation, there must be at least 2 matched pairs of Size 1 units. At least one of the units in a Light Battle Lance must be of the Scout unit role.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if (group.members.filter(x=>x.size>=4).length>0){
            return false;
        }
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        let result =true;
        result = result && (Math.ceil(group.members.length*.75)<=group.members.filter(x=>x.size===1).length);
        result = result && (this.RoleCount(group, "Scout")>=1);
        return result;
    }

}
class MediumBattleLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Medium Battle Lance";
    BonusDescription: string = "The Battle Lance formation receives the equivalent of a Lucky Special Pilot Ability (see p. 97) as a level of the number of units in the formation at Setup plus two. So a Lance of 4 ‘Mechs in a Battle Lance receives a 6-point Lucky Special Ability. It is useable by any unit in the Battle Lance, rather than limited to any single unit. This bonus ability may be stacked with a Lucky SPA assigned to one or more of the Battle Lance’s member units. But if this is done, the maximum number of rerolls a Battle Lance unit may attempt for the duration of the scenario— between both the pilot’s ability and that provided bythis formation bonus—is 4.";
    RequirementsDescription: string = "At least 50 percent of the Medium Battle Lance must be of Size 2, and there may be no units of Size 4 or larger in this formation at all. If this is a vehicle formation, there must be at least 2 matched pairs of Size 2 units.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }
        if (group.members.filter(x=>x.size>=4).length>0){
            return false;
        }
        let result =true;
        result = result && (Math.ceil(group.members.length*.50)<=group.members.filter(x=>x.size===2).length);
        return result;
    }

}
class HeavyBattleLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Heavy Battle Lance";
    BonusDescription: string = "The Battle Lance formation receives the equivalent of a Lucky Special Pilot Ability (see p. 97) as a level of the number of units in the formation at Setup plus two. So a Lance of 4 ‘Mechs in a Battle Lance receives a 6-point Lucky Special Ability. It is useable by any unit in the Battle Lance, rather than limited to any single unit. This bonus ability may be stacked with a Lucky SPA assigned to one or more of the Battle Lance’s member units. But if this is done, the maximum number of rerolls a Battle Lance unit may attempt for the duration of the scenario— between both the pilot’s ability and that provided bythis formation bonus—is 4.";
    RequirementsDescription: string = "At least 50 percent of the Heavy Battle Lance must be of Size 3 or higher, and there may be no Size 1 units in this formation. If this is a vehicle formation, there must be at least 2 matched pairs of Size 3 units.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        if (group.members.filter(x=>x.size===1).length>0){
            return false;
        }
        let result =true;
        result = result && (Math.ceil(group.members.length*.50)<=group.members.filter(x=>x.size>=3).length);
        return result;
    }

}
class AssaultLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Assault Lance";
    IdealRole: ASMULRole = {Id:108, Name: "Juggernaut", Image:"", SortOrder:108};
    BonusDescription: string = "At the beginning of play, the Assault Lance’s controlling player must choose either the Demoralizer or the Multi-Tasker SPAs (see pp. 93 and 98, respectively). When each turn of game play begins, the player may designate up to half the units in the Assault Lance (rounded down) to receive the chosen ability for the duration of the turn. Destroyed or withdrawn units do not count towards the current number of units in the formation. Note that while the chosen ability can switch its user from turn to turn, it cannot be changed to a different ability during the course of the same scenario.";
    RequirementsDescription: string = "At least 3 units in a basic Assault Lance must be of Size 3 or greater, and there can be no units of Size 1 in this formation type. All units in an Assault Lance must have a minimum (undamaged) Armor value of 5 points, and at least 75 percent of the units in this formation must possess a Medium-range attack value of 3 or more. An Assault Lance must contain at least one unit of the Juggernaut role, or 2 units of the Sniper role.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }
        if (this.CheckIdealRole(group, this.IdealRole.Name)){
            return true;
        }

        if (group.members.filter(x=>x.size===1).length>0){
            return false;
        }
        let result =true;
        result = result && (group.members.filter(x=>x.size>=3).length>=3);
        result = result && (group.members.filter(x=>x.armor<5).length===0);
        let medRange3OrGreaterCount = group.members.filter(x=>+x.damage.medium>=3).length;
        result = result && (Math.ceil(group.members.length*.75)<=medRange3OrGreaterCount);
        result = result && (this.RoleCount(group, "Juggernaut")>=1||this.RoleCount(group, "Sniper")>=2)

        return result;
    }

}
class FastAssaultLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Fast Assault Lance";
    BonusDescription: string = "At the beginning of play, the Fast Assault Lance’s controlling player must choose either the Demoralizer or the Multi- Tasker SPAs (see pp. 93 and 98, respectively). When each turn of game play begins, the player may designate up to half the units in the Fast Assault Lance (rounded down) to receive the chosen ability for the duration of the turn. Destroyed or withdrawn units do not count towards the current number of units in the formation. Note that while the chosen ability can switch its user from turn to turn, it cannot be changed to a different ability during the course of the same scenario. In addition to the bonus ability granted for the standard Assault lance, up to 2 units per Fast Assault Lance may also receive the Stand Aside SPA per turn (see p. 99). These two units need not be the same ones that are granted the Demoralizer or Multi- Tasker abilities, and it is possible for a Fast Assault Lance unit to thus receive two SPAs in the same turn as a result (i.e. Stand Aside and either Demoralizer or Multi-Tasker; depending on whichever one was chosen at the start of the scenario).";
    RequirementsDescription: string = "At least 3 units in a basic Fast Assault Lance must be of Size 3 or greater, and there can be no units of Size 1 in this formation type. All units in an Fast Assault Lance must have a minimum (undamaged) Armor value of 5 points, and at least 75 percent of the units in this formation must possess a Medium-range attack value of 3 or more. A Fast Assault Lance must contain at least one unit of the Juggernaut role, or 2 units of the Sniper role, all units must have a minimum ground-based Move of 10”, or possess the ability to jump (any distance), to qualify as a Fast Assault Lance.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if (group.members.filter(x=>x.size===1).length>0){
            return false;
        }
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        let result =true;
        result = result && (group.members.filter(x=>x.size>=3).length>=3);
        result = result && (group.members.filter(x=>x.armor<5).length===0);
        let medRange3OrGreaterCount = group.members.filter(x=>+x.damage.medium>=3).length;
        result = result && (Math.ceil(group.members.length*.75)<=medRange3OrGreaterCount);
        // faster than 10 or Jump capable

        result = result && (group.members.filter(x=>(x.move.filter(y=>y.type==="j").length>0)||(x.move.filter(y=>y.move>=10).length>0)).length===group.members.length);

        return result;
    }

}
class StrikerCavalryLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Striker/Cavalry Lance";
    IdealRole: ASMULRole = {Id:106, Name: "Striker", Image:"", SortOrder:106};
    BonusDescription: string = "75 percent of the units in a standard Striker/ Cavalry Lance receive the Speed Demon Special Pilot Ability (see p. 99).";
    RequirementsDescription: string = "All units in a Striker/Cavalry Lance must have a minimum ground Move of 10” or a jumping Move of 8”j. No units in a Striker/Cavalry Lance may be of Size 4 or above. At least 50 percent of the Striker/Cavalry Lance must be of the Striker or Skirmisher unit role";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }
        if (this.CheckIdealRole(group, this.IdealRole.Name)){
            return true;
        }

        if (group.members.filter(x=>x.size>=4).length>0){
            return false;
        }
        let result =true;

        // 50% striker or skirmisher
        result = result && (Math.ceil(group.members.length*.50)<=(this.RoleCount(group, "Striker")+this.RoleCount(group, "Skirmisher")));
        // faster than 10 or Jump capable greater than 8

        result = result
            && (
                group.members.filter(
                    x=>(
                        x.move.filter(
                            y=>y.type==="j"
                        &&
                            y.move >= 8).length > 0
                        )
                    ||
                        (
                        x.move.filter(
                            y=>y.move >= 10
                        &&
                            y.type!=="j").length > 0
                        )
                ).length > 0
            );


        return result;
    }

}
class LightStrikerCavalryLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Light Striker/Cavalry Lance";
    BonusDescription: string = "75 percent of the units in a standard Striker/ Cavalry Lance receive the Speed Demon Special Pilot Ability (see p. 99).";
    RequirementsDescription: string = "All units in a Light Striker/Cavalry Lance must have a minimum Move of 10”, with or without jumping capability. None of these units may be of Size 3 or higher, and at least 2 units in this formation must have a Long-range attack value higher than 0. At least 2 members of the Light Striker/Cavalry Lance must be of the Striker or Skirmisher unit roles.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if (group.members.filter(x=>x.size>=3).length>0){
            return false;
        }
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        let result =true;
        //must have 2 with long damage
        result = result && (group.members.filter(x=>+x.damage.long>0).length>=2)

        // 2 striker or skirmisher
        result = result && ((this.RoleCount(group, "Striker")+this.RoleCount(group, "Skirmisher"))>=2);
        // faster than 10

        result = result && (group.members.filter(x=>(x.move.filter(y=>y.move>=10).length>0)).length===group.members.length);

        return result;
    }

}
class HeavyStrikerCavalryLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Heavy Striker/Cavalry Lance";
    BonusDescription: string = "75 percent of the units in a standard Striker/ Cavalry Lance receive the Speed Demon Special Pilot Ability (see p. 99).";
    RequirementsDescription: string = "All units in a Heavy Striker/ Cavalry Lance must have a minimum Move of 8”, with or without jumping capability. At least 3 units in this formation type must be of Size 3 or greater, and none may be smaller than a Size 2. At least 1 unit in this formation type must have a Long-range attack value greater than 1 point. At least 2 units in the Heavy Striker/Cavalry Lance must be of the Striker or Skirmisher unit roles.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if (group.members.filter(x=>x.size>=3).length<3){
            return false;
        }
        if (group.members.filter(x=>x.size<2).length>0){
            return false;
        }
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        let result =true;
        //must have at least 1 with long damage
        result = result && (group.members.filter(x=>+x.damage.long>1).length>=1)

        // 2 striker or skirmisher
        result = result && ((this.RoleCount(group, "Striker")+this.RoleCount(group, "Skirmisher"))>=2);
        // faster than 8

        result = result && (group.members.filter(x=>(x.move.filter(y=>y.move>=8).length>0)).length===group.members.length);

        return result;
    }

}
class FireLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Fire Lance";
    IdealRole: ASMULRole = {Id:110, Name: "Missile Boat", Image:"", SortOrder:110};
    BonusDescription: string = "At the beginning of each turn, up to half the Fire Lance units (rounded down) may receive the Sniper Special Pilot Ability (see p. 99), which will affect their weapon attacks during that turn. Destroyed or withdrawn units do not count towards the current number of units in the formation.";
    RequirementsDescription: string = "At least 75 percent of the units in a standard Fire Lance must be of either the Missile Boat or Sniper unit roles.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }
        if (this.CheckIdealRole(group, this.IdealRole.Name)){
            return true;
        }

        let result =true;

        // 75% sniper or missileboat
        result = result && (Math.ceil(group.members.length*.75)<=(this.RoleCount(group, "Missile Boat")+this.RoleCount(group, "Sniper")));
        return result;
    }

}
class FireSupportLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Fire Support Lance";
    BonusDescription: string = "At the beginning of each turn, up to half the Fire Support Lance units (rounded down) may receive the Oblique Attacker Special Pilot Ability (see p. 98), which will affect their weapon attacks during that turn. Destroyed or withdrawn units do not count towards the current number of units in the formation.";
    RequirementsDescription: string = "To serve as a Fire Support Lance, at least 3 units in this formation must possess the Indirect Fire (IF#) special ability.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        let result =true;

        // 3 IF mechs
        //console.log(group);
        var regex = /IF\d+/;
        result = result && (group.members.filter(x=>x.abilities.some(y=>regex.test(y))).length>=3);
        return result;
    }

}
class ArtilleryFireLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Artillery Fire Lance";
    BonusDescription: string = "At the beginning of each turn, up to half the Artillery Fire Lance units (rounded down) may receive the Oblique Artilleryman Special Pilot Ability (see p. 98), which will affect their weapon attacks during that turn. Destroyed or withdrawn units do not count towards the current number of units in the formation.";
    RequirementsDescription: string = "To serve as an Artillery Fire Lance, at least 2 units in this formation must have an Artillery (ARTX-#) special ability.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        let result =true;

        // 2 Art mechs
        var regex = /ART.+\d+/;
        result = result && (group.members.filter(x=>x.abilities.some(y=>regex.test(y))).length>=2);
        return result;
    }

}

class DirectFireLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Direct Fire Lance";
    BonusDescription: string = "At the beginning of each turn, up to half the Direct Fire Lance units (rounded down) may receive the Weapon Specialist Special Pilot Ability (see p. 101), which will affect their weapon attacks during that turn. Destroyed or withdrawn units do not count towards the current number of units in the formation.";
    RequirementsDescription: string = "At least 2 units in a Direct Fire Lance must be of Size 3 or larger, and all units in this formation must be able to deliver at least 2 points of damage to their Long-range attack bracket.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        let result =true;

        // 3 or larger
        result = result && (group.members.filter(x=>x.size>=3).length>=2);
        result = result && (group.members.filter(x=>+x.damage.long<2).length===0);
        return result;
    }

}
class AntiAirLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Anti-Air Lance";
    IdealRole: ASMULRole = {Id:110, Name: "Missile Boat", Image:"", SortOrder:110};
    BonusDescription: string = "At the beginning of each turn, up to half the Anti-Air Lance units (rounded down) may receive the effects of the Anti-Aircraft Specialists Special Command Ability (see p. 102), which will affect their weapon attacks during that turn. Destroyed or withdrawn units do not count towards the current number of units in the formation.";
    RequirementsDescription: string = "In addition to the requirements established for the standard Fire Lance, at least 2 units in an Anti-Air Lance must possess the Flak (FLK#), Autocannon (AC#/#/#), or Artillery (ARTX-#) special abilities.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }
        if (this.CheckIdealRole(group, this.IdealRole.Name)){
            return true;
        }

        let result =true;

        // 75% sniper or missileboat
        result = result && (Math.ceil(group.members.length*.75)<=(this.RoleCount(group, "Missile Boat")+this.RoleCount(group, "Sniper")));
        var artRegex = /ART\d+/;
        var acRegex = /AC\d+/;
        result = result && ((group.members.filter(x=>x.abilities.includes('FLK')).length + group.members.filter(x=>x.abilities.some(y=>artRegex.test(y))).length + group.members.filter(x=>x.abilities.some(y=>acRegex.test(y))).length)>=2);
        return result;
    }

}

class ReconLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Recon Lance";
    IdealRole: ASMULRole = {Id:105, Name: "Scout", Image:"", SortOrder:105};
    BonusDescription: string = "At the beginning of play, the Recon Lance’s controlling player must choose either the Eagle’s Eyes, Forward Observer, or Maneuvering Ace SPAs (see pp. 95, 96, and 97, respectively). Every unit in this Recon Lance receives the chosen SPA. Note that the abilities chosen at the scenario’s start cannot be exchanged for a different ability during the course of the same scenario.";
    RequirementsDescription: string = "All units in a Recon Lance must possess a minimum Move of 10”. At least 2 units in this formation type must also be of the Scout or Striker unit roles.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        if (this.CheckIdealRole(group, this.IdealRole.Name)){
            return true;
        }
        let result =true;

        // faster than 10

        result = result && ((this.RoleCount(group, "Scout")+this.RoleCount(group, "Striker"))>=2);
        result = result && (group.members.filter(x=>(x.move.filter(y=>y.move>=10).length>0)).length===group.members.length);
        return result;
    }

}
class LightRecon extends FormationBonusBase implements IFormationBonus {
    Name: string = "Light Recon Lance";
    BonusDescription: string = "At the beginning of play, the Light Recon Lance’s controlling player can choose from the Eagle’s Eyes, Forward Observer, or Maneuvering Ace SPAs (see pp. 95, 96, and 97, respectively) for each unit. Note that the abilities chosen at the scenario’s start cannot be exchanged for a different ability during the course of the same scenario.";
    RequirementsDescription: string = "All units in a Light Recon Lance must be of Size 1, with a minimum Move of 12” (with or without jump capability). Furthermore, all of these units must be of the Scout unit role.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        let result =true;

        result = result && (group.members.filter(x=>x.size===1).length===group.members.length);
        result = result && (group.members.filter(x=>(x.move.filter(y=>y.move>=12).length>0)).length===group.members.length);
        result = result && (this.RoleCount(group, "Scout")===group.members.length)
        return result;
    }

}
class HeavyReconLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Heavy Recon Lance";
    BonusDescription: string = "At the beginning of play, the Heavy Recon Lance’s controlling player must choose either the Eagle’s Eyes, Forward Observer, or Maneuvering Ace SPAs (see pp. 95, 96, and 97, respectively). Half the units in this Heavy Recon Lance receives the chosen SPA. Note that the abilities chosen at the scenario’s start cannot be exchanged for a different ability during the course of the same scenario.";
    RequirementsDescription: string = "All units in a Heavy Recon Lance must have a Move of 8” of more, with no less than 2 able to move 10” or more (all with or without jump capability). At least 1 unit in this formation type must be of Size 3 or larger. Finally, at least 2 units in a Heavy Recon Lance must be of the Scout unit role.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        let result =true;

        result = result && (group.members.filter(x=>(x.move.filter(y=>y.move>=8).length>0)).length===group.members.length);
        result = result && (group.members.filter(x=>(x.move.filter(y=>y.move>=10).length>0)).length>=2);
        result = result && (group.members.filter(x=>x.size>=3).length>=1);
        result = result && (this.RoleCount(group, "Scout")>=2);
        return result;
    }

}
class PursuitLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Pursuit Lance";
    IdealRole: ASMULRole = {Id:106, Name: "Striker", Image:"", SortOrder:106};
    BonusDescription: string = "75 percent of the units in this formation (round normally) receive the Blood Stalker Special Pilot Ability (see p. 93). The Pursuit Lance may choose an enemy Formation rather than a single unit as the target for the Blood Stalker SPA. If this option is used, all members of the Pursuit Lance must choose the same enemy Formation for the Blood Stalker SPA granted by this ability, and the destruction of the chosen Formation is the only time the Pursuit Lance may change the target of the Blood Stalker SPA, by choosing a new enemy Formation.";
    RequirementsDescription: string = "All units in a Pursuit Lance must be of Size 2 or less, and 75 percent of this formation must have a Move of 12” or more, regardless of jumping capability. At least 1 unit in the Pursuit Lance must have a Medium-range attack value over 1 point.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        if (this.CheckIdealRole(group, this.IdealRole.Name)){
            return true;
        }
        let result =true;

        result = result && (group.members.filter(x=>x.size<=2).length===group.members.length);
        result = result && (Math.ceil(group.members.length*.75)<=(group.members.filter(x=>(x.move.filter(y=>y.move>=12).length>0)).length));
        result = result && (group.members.filter(x=>+x.damage.medium<=1).length>=1);
        return result;
    }

}
class ProbeLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Probe Lance";
    BonusDescription: string = "75 percent of the units in this formation receive the Blood Stalker Special Pilot Ability (see p. 93). The Probe Lance may choose an enemy Formation rather than a single unit as the target for the Blood Stalker SPA. If this option is used, all members of the Probe Lance must choose the same enemy Formation for the Blood Stalker SPA granted by this ability, and the destruction of the chosen Formation is the only time the Probe Lance may change the target of the Blood Stalker SPA, by choosing a new enemy Formation.";
    RequirementsDescription: string = "All units in a Probe Lance must be of Size 3 or less, and 75 percent must have a Move of 10” or more, with or without jump capability. All Probe Lance units must be able to deliver at least 2 points of damage at Medium range.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        let result =true;

        result = result && (group.members.filter(x=>x.size>3).length===0);
        result = result && (Math.ceil(group.members.length*.75)<=(group.members.filter(x=>(x.move.filter(y=>y.move>=10).length>0)).length));
        result = result && (group.members.filter(x=>+x.damage.medium<2).length===0);

        return result;
    }

}
class SweepLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Sweep Lance";
    BonusDescription: string = "75 percent of the units in this formation receive the Blood Stalker Special Pilot Ability (see p. 93). The Sweep Lance may choose an enemy Formation rather than a single unit as the target for the Blood Stalker SPA. If this option is used, all members of the Sweep Lance must choose the same enemy Formation for the Blood Stalker SPA granted by this ability, and the destruction of the chosen Formation is the only time the Sweep Lance may change the target of the Blood Stalker SPA, by choosing a new enemy Formation.";
    RequirementsDescription: string = "All units in a Sweep Lance must be of Size 2 or less, and have a Move of 10” or more, regardless of jumping capability. All Sweep Lance units must be able to deliver at least 2 points of damage at Short range.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        let result =true;

        result = result && (group.members.filter(x=>x.size>2).length===0);
        result = result && (group.members.filter(x=>(x.move.filter(y=>y.move>=10).length>0)).length===group.members.length);
        result = result && (group.members.filter(x=>+x.damage.short<2).length===0);

        return result;
    }

}
class CommandLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Command Lance";
    BonusDescription: string = "Prior to the beginning of play, half of the units in this formation (round up) receive one of the following Special Pilot Abilities for free (each unit may receive a different SPA): Antagonizer, Blood Stalker, Combat Intuition, Eagle’s Eyes, Marksman, or Multi-Tasker (see pp. 92, 93, 93, 95, 97 and 98, respectively).  In addition to this, the commander’s unit receives the Tactical Genius SPA (see p. 100). If the Special Pilot Abilities rules are in full effect and the commander already has the Tactical Genius SPA, this ability adds a +1 modifier to the force’s Initiative roll results instead (including any rerolls made as a result of the Tactical Genius SPA).";
    RequirementsDescription: string = "At least one unit in the Command Lance must be designated as either the force commander or a key lieutenant. For the purposes of building a force, these rules recommend that one unit in the overall combat force be identified as the force’s field commander, with no more than 1 sub-commanding lieutenant assigned for every 6 non-infantry units in the entire force. The Command Lance would then be established as the lance in which the senior force commander is assigned, but additional Command Lances can be built around the sub-commanders as well. In this formation, 50 percent of the units must have one of the following unit roles: Sniper, Missile Boat, Skirmisher, or Juggernaut. One additional unit in the lance must be a Brawler, Striker, or Scout. The unit designated as the commander’s unit may be any of the lance’s members, including these prerequisite units.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        let result =true;
        //50 percent of the units must have one of the following unit roles: Sniper, Missile Boat, Skirmisher, or Juggernaut.
        //One additional unit in the lance must be a Brawler, Striker, or Scout.
        result = result && (Math.ceil(group.members.length*.5)<=(this.RoleCount(group, "Missile Boat")+this.RoleCount(group, "Sniper")+this.RoleCount(group, "Skirmisher")+this.RoleCount(group, "Juggernaut")));
        result = result && ((this.RoleCount(group, "Brawler")+this.RoleCount(group, "Striker")+this.RoleCount(group, "Scout"))>=1);

        return result;
    }

}
class LightFireLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Light Fire Lance";
    BonusDescription: string = "If a unit in this Formation hits a target with at least one of its weapons (atleast one weapon attack), other units in this Formation making weapon attacks against the same target receive a –1 target number modifier to their attack rolls. This bonus is cumulative per attacking unit, up to a –3 target number modifier.";
    RequirementsDescription: string = "No unit of Heavy weight class or larger (Size 3+) may be included. At least 50 percent of the units in this formation must have either the Missile Boat or Sniper Unit Roles.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        let result = true;
        result = result && (Math.ceil(group.members.length*.5)<=(this.RoleCount(group, "Missile Boat")+this.RoleCount(group, "Sniper")));
        result = result && (group.members.filter(x=>x.size>2).length===0);
        return result;
    }
}

class RifleLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Rifle Lance";
    BonusDescription: string = "At the beginning of each turn, up to two Rifle Lance units may receive either the Weapon Specialist or Sandblaster Special Pilot Ability. The player may assign the same SPA to both units, or one unit may receive Weapon Specialist and the other unit Sandblaster.";
    RequirementsDescription: string = "Exclusive to House Davion (Not Implemented). At least 75 percent of the units in this Formation must be Medium or Heavy (Size 2 or 3). No units may be Light (Size 1). At least 50 percent of these units must have an autocannon, including LB-X, Ultra, or Rotary autocannons (usually with the AC or FLK special ability), and all units must have at least a minimum Walk/Cruise speed of 4 (Move 8”+).";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        let result = true;
        result = result && (group.members.filter(x=>x.size===1).length===0);
        result = result && (Math.ceil(group.members.length*.75)<=(group.members.filter(x=>x.size===2||x.size===3).length));
        var acRegex = /AC\d+/;
        result = result && (Math.ceil(group.members.length*.5)<=group.members.filter(x=>(x.abilities.filter(y=>acRegex.test(y)||y.includes('FLK')).length>0)).length);
        result = result && (group.members.filter(x=>x.move.filter(y=>y.move>=8)).length===group.members.length);
        return result;
    }

}

class HunterLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Hunter Lance";
    BonusDescription: string = "At the beginning of each turn, 50 percent of the units in the Formation may be granted the Combat Intuition Special Pilot Ability.";
    RequirementsDescription: string = "At least 50 percent of the units in this Formation must have the Ambusher or Juggernaut role.";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        let result = true;
        result = result && (Math.ceil(group.members.length*.5)<=(this.RoleCount(group, "Ambusher")+this.RoleCount(group, "Juggernaut")));
        return result;
    }
}

class PhalanxStar extends FormationBonusBase implements IFormationBonus {
    Name: string = "Phalanx Star"
    BonusDescription: string = "The Phalanx Star Formation receives the equivalent of a 4-point Float Like A Butterfly Special Pilot Ability (see p . 96, AS:CE), except that the ability may be used by any unit in the Phalanx Star, rather one unit alone . This SPA need not be assigned to any specific unit(s) and may be employed after a successful attack or critical hit roll by any unit, to a maximum of six times for the entire Formation per track . As with the normal Float Like A Butterfly SPA, only one reroll per attack or critical hit roll is possible.";
    RequirementsDescription: string = "The Phalanx Star must consist of at least two combat vehicles or BattleMechs, with the remainder of the Star comprised of Elementals, more combat vehicles or more BattleMechs . There must be at least two different unit types (BattleMech, combat vehicle, battle armor) in a Phalanx Star . A Clan Steel Viper Phalanx Star may include conventional infantry in place of battle armor."

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        let result = true;
        if(group.members.length === 0){
            return result;
        }
        let aType = group.members.map(x => x.type);

        //TODO: Are we going to run into other formations that care about type? If so, make TypeCount function.
        result = result && (aType.filter(x => x === 'BM').length >= 2 || aType.filter(x => x === 'CV').length >= 2);
        //Make sure there's at least 2 different types. 2 items will have an index of 0 if that's true.
        result = result && (aType.filter((x,index, arr) => arr.indexOf(x) === index).length >= 2);
        result = result && (aType.filter(x => x !== 'BM' && x !== 'CV' && x !== 'BA' && x !== 'CI' ).length < 1)
        return result
    }
}

class RogueStar extends FormationBonusBase implements IFormationBonus {
    Name: string = "Rogue Star";
    BonusDescription: string = "At the beginning of each turn, up to two Rogue Star units may receive the Combat Intuition Special Pilot Ability (see p . 73, CO, or p . 93, AS:CE).";
    RequirementsDescription: string = "At least two of the units in the Formation must be the same model (including the same OmniMech configuration).";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        let result = true;
        let aName = group.members.map(x => x.name);
        //At least two of the same named model. Duplicated model will not have the same index as the first model, so that's what we're looking for.
        result = result && (aName.filter((x, index, arr) => arr.indexOf(x) !== index).length >= 1);
        return result;
    }
}

class StrategicCommandStar extends FormationBonusBase implements IFormationBonus {
    Name: string = "Strategic Command Star";
    BonusDescription: string = "The Strategic Command Star receives the same bonus abilities as a Command Star . The Strategic Command Star is treated as a Command Lance for the purposes of a Support Lance Formation, if present";
    RequirementsDescription: string = " This Formation must be comprised of either 4 points of ’Mechs or Elementals and 1 point of aerospace fighters .  If the Strategic Command Star is comprised of ’Mechs, at least two must be Heavy or Assault ’Mechs .  No ’Mechs may be light or size 1 . In addition, every unit must have a Gunnery Skill rating of 3 (TW) or Skill 3 (AS) . The unit designated as the commander’s unit may be any of the Star’s members, except for the aerospace units ";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        let result = true;
        if(group.members.length === 0){
            return result;
        }
        //Exactly 1 Aerospace Fighter
        result = result && (group.members.filter(x => x.type === 'CF').length === 1);
        //Either 4 Mechs or 4 Elementals
        result = result && (group.members.filter(x => x.type ==='BM').length === 4 || group.members.filter(x => x.type === 'BA').length === 4);
        //If Mechs, check they're not little baby mechs.
        if(group.members.filter(x => x.type === 'BM').length > 0){
            result = result && (group.members.filter(x => x.size === 1 && x.type === 'BM').length === 0);
            result = result && (group.members.filter(x => x.size >= 3).length >=2);
        }
        result = result && (group.members.filter(x => x.currentSkill <= 3).length === group.members.length);
        return result;
    }
}

class SupportLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Support Lance";
    BonusDescription: string = "Before the start of play, each Support Lance must designate one other formation type in its army to support. Half of the units in the Support Lance (round down) receive the same SPAs as the supported formation. The Support Lance’s number of SPAs received of each type may not exceed the number the supported formation receives, as determined at start of play. If a bonus ability from the supported formation is assigned at the beginning of each turn, the Support Lance must assign them at start of play and may not switch them to another unit during game play. This bonus ability is retained as long as the Support Lance still has three or more active units on the field; they are not lost if the supported lance is reduced below its own ability to retain the bonus ability. If the Support Lance is supporting a Command Lance, it receives the two SPAs assigned to the Command Lance’s non-commander units, assigning one SPA each to any appropriate Support Lance unit. However, the Support Lance does not receive the commander’s Tactical Genius Special Pilot Ability.";
    RequirementsDescription: string = "None";

    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        return true;
    }

}

class OrderLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Order Lance";
    BonusDescription: string = "Designate one Unit as the command Unit of the Formation; it receives the Tactical Genius, Antagonizer or Sniper SPA. All Units in the Formation receive the Iron Will or Speed Demon SPA; the SPA chosen applies to all Units in the Formation.";
    RequirementsDescription: string = "Exclusive to House Kurita Forces. All Units in the Formation must be of the same Size and model (all Dragons/ Grand Dragons, all Panthers, etc).";
    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }

        var result = true;
        if (group.members.length < 2) {
            return false;
        }
        let firstClass = group.members[0].class;
        result = result && (group.members.filter(x=>x.class !== firstClass).length === 0);
        return result;
    }
}

// not adding this yet as I hjaven't figured out the 'from any special ability' magic
class Horde extends FormationBonusBase implements IFormationBonus {
    Name: string = "Horde";
    BonusDescription: string = "Swarm–When any Unit in this Formation is targeted, the targeted Unit’s player may switch the target to any other Unit in this Formation that is a legal target (within line of sight) and at the same range (or less) from the attacker.";
    RequirementsDescription: string = "Must have 5 to 10 Units. All Units must be unit size 1. No Unit may have a damage value, at any range or from any special ability, greater than 2.";
    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }
        var result = true;
        if (group.members.length < 5 || group.members.length > 10) {
            return false;
        }
        // all size 1
        if (group.members.filter(x=>x.size===1).length !== group.members.length) {
            return false;
        }
        result = result && (group.members.filter(x=>+x.damage.short>2).length===0)
        result = result && (group.members.filter(x=>+x.damage.medium>2).length===0)
        result = result && (group.members.filter(x=>+x.damage.long>2).length===0)
        return result;
    }
}

class BerserkerLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Berserker Lance";
    BonusDescription: string = "Two Units of the Formation receive the Zweihander or Swordsman Special Pilot Ability; the same ability must be assigned to both Units.";
    RequirementsDescription: string = "As Battle Lance.";
    IdealRole: ASMULRole = {Id:109, Name: "Brawler", Image:"", SortOrder:109};
    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }
        if (this.CheckIdealRole(group, this.IdealRole.Name)){
            return true;
        }
        let result =true;
        result = result && (Math.ceil(group.members.length*.50)<=group.members.filter(x=>x.size>=3).length);
        let brawlerSniperSkirmisherCount = this.RoleCount(group, "Brawler") + this.RoleCount(group, "Sniper")+this.RoleCount(group, "Skirmisher");
        result = result && (brawlerSniperSkirmisherCount >=3)
        return result;
    }
}

class AntiMechLance extends FormationBonusBase implements IFormationBonus {
    Name: string = "Anti-‘Mech Lance";
    BonusDescription: string = "Enemy Units in base-to-base contact with an Anti-‘Mech Lance suffer a –1 To-Hit Modifier penalty to any weapon attacks made by that enemy Unit.";
    RequirementsDescription: string = "All Units must be infantry.";
    IsValid(group: AlphaStrikeGroup): boolean {
        if(this.HasMinimumMembers(group)===false){
            return false;
        }
        let result = true;
        result = result && (group.members.filter(x => x.type === 'CI' || x.type === 'BA').length === group.members.length)
        return result
    }
}


export const formationBonuses: IFormationBonus[] = [
    new None(),
    new BattleLance(),
    new LightBattleLance(),
    new MediumBattleLance(),
    new HeavyBattleLance(),
    new AssaultLance(),
    new FastAssaultLance(),
    new StrikerCavalryLance(),
    new LightStrikerCavalryLance(),
    new HeavyStrikerCavalryLance(),
    new FireLance(),
    new FireSupportLance(),
    new ArtilleryFireLance(),
    new DirectFireLance(),
    new AntiAirLance(),
    new ReconLance(),
    new LightRecon(),
    new HeavyReconLance(),
    new PursuitLance(),
    new ProbeLance(),
    new SweepLance(),
    new CommandLance(),
    new LightFireLance(),
    new RifleLance(),
    new HunterLance(),
    new PhalanxStar(),
    new RogueStar(),
    new StrategicCommandStar(),
    new SupportLance(),
    new OrderLance(),
    new Horde(),
    new BerserkerLance(),
    new AntiMechLance()

];
