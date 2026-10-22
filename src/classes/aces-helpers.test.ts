import { describe, expect, it } from "vitest";
import {
    calculateAcesToHit,
    getAcesCrippledReasons,
    getAcesEffectivePriority,
    getAcesFrontLoadedMoveOrder,
    getAcesInitiativeModifiers,
    getAcesRangeBracket,
    sortAcesActivation,
    splitAcesDeck,
    suggestAcesDeck,
} from "./aces-helpers";
import { acesMotiveSystemsTable, acesVehicleCriticalHitTable, lookupAcesTable } from "../data/aces-rules";

describe("Aces target numbers (ASCE p.44, Aces pp.3-6)", () => {
    it("reproduces the Indirect Fire example: Archer via Wasp spotter is TN 8 (Aces p.3)", () => {
        // Skill 3, -1 standstill, +2 medium, +2 Timber Wolf TMM, +1 IF, +0 Wasp ground, +1 woods in the Wasp's LOS.
        const result = calculateAcesToHit( {
            skill: 3,
            rangeInches: 20,
            attackType: "indirect",
            attackerMovement: "standstill",
            targetType: "BM",
            targetTMM: 2,
            targetMovement: "ground",
            woods: true,
            spotter: { movement: "ground", alsoAttacking: false, rangeToTargetInches: 18 },
        } );
        expect( result.allowed ).toBe( true );
        expect( result.targetNumber ).toBe( 8 );
    });

    it("adds +1 to the IF attack when the spotter also attacks, and blocks spotters beyond 42\" (Aces p.3)", () => {
        const base = {
            skill: 4,
            rangeInches: 30,
            attackType: "indirect" as const,
            attackerMovement: "ground" as const,
            targetType: "BM",
            targetTMM: 1,
            targetMovement: "ground" as const,
        };
        const quiet = calculateAcesToHit( { ...base, spotter: { movement: "ground", rangeToTargetInches: 10 } } );
        const busy = calculateAcesToHit( { ...base, spotter: { movement: "ground", alsoAttacking: true, rangeToTargetInches: 10 } } );
        expect( busy.targetNumber ).toBe( quiet.targetNumber + 1 );
        const far = calculateAcesToHit( { ...base, spotter: { movement: "ground", rangeToTargetInches: 43 } } );
        expect( far.allowed ).toBe( false );
        const none = calculateAcesToHit( base );
        expect( none.allowed ).toBe( false );
    });

    it("never gives partial cover to vehicles or infantry, and adds +1 against battle armor (Aces pp.4-5)", () => {
        const base = {
            skill: 4,
            rangeInches: 5,
            attackType: "weapon" as const,
            attackerMovement: "ground" as const,
            targetTMM: 1,
            targetMovement: "ground" as const,
            partialCover: true,
        };
        expect( calculateAcesToHit( { ...base, targetType: "BM" } ).targetNumber ).toBe( 6 );
        expect( calculateAcesToHit( { ...base, targetType: "CV" } ).targetNumber ).toBe( 5 );
        expect( calculateAcesToHit( { ...base, targetType: "BA" } ).targetNumber ).toBe( 6 );
    });

    it("infantry attackers ignore attacker movement modifiers (Aces p.5)", () => {
        const result = calculateAcesToHit( {
            skill: 4,
            rangeInches: 3,
            attackType: "weapon",
            attackerMovement: "jump",
            attackerIsInfantry: true,
            targetType: "BM",
            targetTMM: 0,
            targetMovement: "standstill",
        } );
        expect( result.targetNumber ).toBe( 4 );
    });

    it("stacks Anti-'Mech modifiers: +1, +3 conventional infantry, +3 target carrying BA (Aces p.5)", () => {
        const result = calculateAcesToHit( {
            skill: 4,
            rangeInches: 0,
            attackType: "anti-mech",
            attackerMovement: "ground",
            attackerIsInfantry: true,
            attackerIsConventionalInfantry: true,
            attackerHeat: 2,
            targetType: "BM",
            targetTMM: 1,
            targetMovement: "ground",
            targetCarryingBattleArmor: true,
        } );
        // No range or heat for physical attacks.
        expect( result.rangeBracket ).toBe( null );
        expect( result.targetNumber ).toBe( 4 + 1 + 1 + 3 + 3 );
    });

    it("emplacements are -4 to hit and -1 when attacking (Aces p.6)", () => {
        const result = calculateAcesToHit( {
            skill: 4,
            rangeInches: 10,
            attackType: "weapon",
            attackerMovement: "immobile",
            attackerIsEmplacement: true,
            targetType: "BM",
            targetTMM: 2,
            targetMovement: "ground",
            targetIsEmplacement: false,
        } );
        // 4 +2 medium -1 immobile attacker -1 emplacement +2 TMM
        expect( result.targetNumber ).toBe( 6 );
        const vsEmplacement = calculateAcesToHit( {
            skill: 4,
            rangeInches: 10,
            attackType: "weapon",
            attackerMovement: "ground",
            targetType: "BD",
            targetTMM: 0,
            targetMovement: "ground",
            targetIsEmplacement: true,
        } );
        expect( vsEmplacement.targetNumber ).toBe( 2 );
    });

    it("automated attackers ignore targets at TN 13 or more (Aces p.18)", () => {
        const result = calculateAcesToHit( {
            skill: 4,
            rangeInches: 30,
            attackType: "weapon",
            attackerMovement: "jump",
            attackerHeat: 2,
            targetType: "BM",
            targetTMM: 2,
            targetMovement: "jump",
            automatedAttacker: true,
        } );
        expect( result.targetNumber ).toBe( 4 + 4 + 2 + 2 + 3 );
        expect( result.allowed ).toBe( false );
    });

    it("uses the ASCE range brackets", () => {
        expect( getAcesRangeBracket( 6 ) ).toBe( "short" );
        expect( getAcesRangeBracket( 6.5 ) ).toBe( "medium" );
        expect( getAcesRangeBracket( 24 ) ).toBe( "medium" );
        expect( getAcesRangeBracket( 42 ) ).toBe( "long" );
        expect( getAcesRangeBracket( 43 ) ).toBe( "extreme" );
    });
});

describe("Aces vehicle tables (Aces p.4)", () => {
    it("reads the Motive Systems Damage Table", () => {
        expect( lookupAcesTable( acesMotiveSystemsTable, 8 ).effect ).toBe( "none" );
        expect( lookupAcesTable( acesMotiveSystemsTable, 9 ).effect ).toBe( "minus2-move-minus1-tmm" );
        expect( lookupAcesTable( acesMotiveSystemsTable, 11 ).effect ).toBe( "halve-move-tmm" );
        // 12 + 1 for hover clamps to 12.
        expect( lookupAcesTable( acesMotiveSystemsTable, 13 ).effect ).toBe( "immobilized" );
    });

    it("reads the Aces Vehicle Critical Hit Table", () => {
        expect( lookupAcesTable( acesVehicleCriticalHitTable, 3 ).effect ).toBe( "crew-stunned" );
        expect( lookupAcesTable( acesVehicleCriticalHitTable, 5 ).effect ).toBe( "fire-control" );
        expect( lookupAcesTable( acesVehicleCriticalHitTable, 9 ).effect ).toBe( "weapon" );
        expect( lookupAcesTable( acesVehicleCriticalHitTable, 11 ).effect ).toBe( "crew-killed" );
        expect( lookupAcesTable( acesVehicleCriticalHitTable, 12 ).effect ).toBe( "engine" );
    });
});

describe("Aces crippled units (Forced Withdrawal card, Aces p.8)", () => {
    const healthy = {
        startingArmor: 5,
        currentArmor: 5,
        startingStructure: 5,
        currentStructure: 5,
        startingMediumDamage: 3,
        startingLongDamage: 1,
        currentMediumDamage: 3,
        currentLongDamage: 1,
        startingMove: 8,
        currentMove: 8,
    };

    it("cripples with no armor and structure at half or less, rounded up", () => {
        expect( getAcesCrippledReasons( healthy ) ).toEqual( [] );
        // A 6-structure unit: 3 left is half, 4 is not.
        expect( getAcesCrippledReasons( { ...healthy, startingStructure: 6, currentArmor: 0, currentStructure: 3 } ).length ).toBe( 1 );
        expect( getAcesCrippledReasons( { ...healthy, startingStructure: 6, currentArmor: 0, currentStructure: 4 } ).length ).toBe( 0 );
    });

    it("counts minimal damage as damage, and skips units that started with no M/L damage", () => {
        expect( getAcesCrippledReasons( { ...healthy, currentMediumDamage: 0, currentLongDamage: 0 } ).length ).toBe( 1 );
        expect( getAcesCrippledReasons( { ...healthy, currentMediumDamage: 0, currentMediumMinimal: true, currentLongDamage: 0 } ).length ).toBe( 0 );
        expect( getAcesCrippledReasons( { ...healthy, startingMediumDamage: 0, startingLongDamage: 0, currentMediumDamage: 0, currentLongDamage: 0 } ).length ).toBe( 0 );
    });

    it("cripples at less than half MV, and emplacements only at 0 damage (Aces p.6)", () => {
        expect( getAcesCrippledReasons( { ...healthy, currentMove: 4 } ).length ).toBe( 0 );
        expect( getAcesCrippledReasons( { ...healthy, currentMove: 3 } ).length ).toBe( 1 );
        expect( getAcesCrippledReasons( { ...healthy, currentMove: 0 } ) ).toEqual( [ "Movement: immobilized" ] );
        expect( getAcesCrippledReasons( { ...healthy, isEmplacement: true, currentArmor: 0, currentStructure: 1 } ).length ).toBe( 0 );
        expect( getAcesCrippledReasons( { ...healthy, isEmplacement: true, currentShortDamage: 0, currentMediumDamage: 0, currentLongDamage: 0 } ).length ).toBe( 1 );
    });
});

describe("Front-loaded unequal numbers of units (Aces p.6)", () => {
    it("reproduces the Erin (7 movers, won Initiative) and Ben (5) example", () => {
        const order = getAcesFrontLoadedMoveOrder( "player", 5, 7 );
        expect( order.map( ( pair ) => pair.map( ( step ) => step.count ) ) ).toEqual( [
            [ 1, 2 ], [ 1, 2 ], [ 1, 1 ], [ 1, 1 ], [ 1, 1 ],
        ] );
        expect( order[0][0].side ).toBe( "player" );
    });

    it("moves three at a time against more than twice as many (tip: 3 against 8)", () => {
        const order = getAcesFrontLoadedMoveOrder( "automated", 8, 3 );
        expect( order.map( ( pair ) => pair.map( ( step ) => step.count ) ) ).toEqual( [ [ 3, 1 ], [ 3, 1 ], [ 2, 1 ] ] );
    });

    it("lets the remaining side finish when the other has no movers", () => {
        expect( getAcesFrontLoadedMoveOrder( "player", 0, 4 ) ).toEqual( [ [ { side: "automated", count: 4 } ] ] );
        expect( getAcesFrontLoadedMoveOrder( "player", 0, 0 ) ).toEqual( [] );
    });
});

describe("Automated activation order (Aces pp.8, 11, 16)", () => {
    it("applies -500 for Forced Withdrawal: the Warhawk's 625 activates at 125 (Aces p.16)", () => {
        expect( getAcesEffectivePriority( { id: "w", priority: 625, pv: 40, forcedWithdrawal: true }, "movement" ) ).toBe( 125 );
        expect( getAcesEffectivePriority( { id: "w", priority: 93, pv: 40, forcedWithdrawal: true }, "movement" ) ).toBe( -407 );
        // Special Orders have no effect in the Combat Phase (Aces p.18).
        expect( getAcesEffectivePriority( { id: "w", priority: 625, pv: 40, forcedWithdrawal: true }, "combat" ) ).toBe( 625 );
    });

    it("uses Move First 000 / Move Last 1000, which FW and Fleeing units cannot hold (Aces p.8)", () => {
        expect( getAcesEffectivePriority( { id: "a", priority: 500, pv: 30, token: "move-first" }, "movement" ) ).toBe( 0 );
        expect( getAcesEffectivePriority( { id: "a", priority: 500, pv: 30, token: "move-last" }, "movement" ) ).toBe( 1000 );
        expect( getAcesEffectivePriority( { id: "a", priority: 500, pv: 30, token: "move-last", fleeing: true }, "movement" ) ).toBe( 500 );
    });

    it("goes lowest priority first, ties by lowest PV, unrevealed last (Aces p.11)", () => {
        const sorted = sortAcesActivation( [
            { id: "a", priority: 383, pv: 40 },
            { id: "b", priority: 93, pv: 50 },
            { id: "c", priority: 383, pv: 25 },
            { id: "d", priority: null, pv: 10 },
        ], "movement" );
        expect( sorted.map( ( unit ) => unit.id ) ).toEqual( [ "b", "c", "a", "d" ] );
    });
});

describe("Aces decks (Aces pp.38-39, Aces SS p.20)", () => {
    it("splits a shared deck evenly and sets extras aside", () => {
        expect( splitAcesDeck( 6, 2 ) ).toEqual( { cardsPerUnit: 3, setAside: 0 } );
        expect( splitAcesDeck( 6, 4 ) ).toEqual( { cardsPerUnit: 1, setAside: 2 } );
        expect( splitAcesDeck( 12, 5 ) ).toEqual( { cardsPerUnit: 2, setAside: 2 } );
    });

    it("suggests the deck for the unit role and movement", () => {
        expect( suggestAcesDeck( "Brawler", [ "" ], [], false ) ).toBe( "brawler" );
        expect( suggestAcesDeck( "Ambusher", [ "f" ], [], false ) ).toBe( "ambusher-infantry" );
        expect( suggestAcesDeck( "Scout", [ "h" ], [], true ) ).toBe( "scout-hover" );
        expect( suggestAcesDeck( "Scout", [ "h" ], [], false ) ).toBe( "scout" );
        expect( suggestAcesDeck( "Skirmisher", [ "", "j" ], [ "JMPS2" ], true ) ).toBe( "skirmisher-jmps" );
        expect( suggestAcesDeck( "Transport", [ "t" ], [], true ) ).toBe( null );
    });
});

describe("Aces Initiative (Aces p.32)", () => {
    it("gives -2 to last turn's winner in a campaign and -2 for a lost commander", () => {
        expect( getAcesInitiativeModifiers( true, false, true ).map( ( mod ) => mod.value ) ).toEqual( [ -2 ] );
        expect( getAcesInitiativeModifiers( true, false, false ) ).toEqual( [] );
        expect( getAcesInitiativeModifiers( true, true, true ).reduce( ( total, mod ) => total + mod.value, 0 ) ).toBe( -4 );
    });
});
