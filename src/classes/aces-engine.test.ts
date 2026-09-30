import { describe, expect, it } from "vitest";
import {
    acesSampleBrawler383,
    acesSampleForcedWithdrawal,
    acesSampleMechWarriorC,
    acesSampleMovementObjective,
    acesSampleSniper475,
    acesSampleStarCaptainB,
} from "../data/aces-card-samples";
import {
    acesSpotterAttacks,
    acesSupportCardAllowed,
    applyAcesCriticalToUnit,
    chooseAcesTokenUnit,
    determineAcesBehavior,
    evaluateAcesStrategy,
    findAcesCard,
    IAcesCandidate,
    IAcesUnitStats,
    identifyAcesCombatTarget,
    identifyAcesMovementTarget,
    narrowAcesCandidates,
    newAcesRngState,
    orderAcesSupportCards,
    resolveAcesMoveType,
    resolveAcesMovementFilters,
    resolveAcesOverheat,
    rollAces2D6,
    rollAcesCriticalHit,
    selectAcesZone,
    shouldAcesMakePhysicalAttack,
    shuffleAces,
} from "./aces-engine";
import { getAcesEffectivePriority, IAcesActivationInput } from "./aces-helpers";
import { AlphaStrikeUnit } from "./alpha-strike-unit";

const stats = ( values: Partial<IAcesUnitStats> ): IAcesUnitStats => ( {
    "armor": 4,
    "structure": 4,
    "armor-lost": 0,
    "structure-lost": 0,
    "tmm": 1,
    "pv": 30,
    "mv": 8,
    "damage-s": 2,
    "damage-m": 2,
    "damage-l": 1,
    "size": 2,
    "heat": 0,
    ...values,
} );

const enemy = ( id: string, values: Partial<IAcesUnitStats>, extra: Partial<IAcesCandidate> = {} ): IAcesCandidate => ( {
    id: id,
    name: id,
    stats: stats( values ),
    ...extra,
} );

describe("Aces seeded dice", () => {
    it("repeats the same rolls from the same seed and continues after a save", () => {
        const a = newAcesRngState( 1234 );
        const b = newAcesRngState( 1234 );
        const rollsA = [ rollAces2D6( a ), rollAces2D6( a ), rollAces2D6( a ) ];
        const rollsB = [ rollAces2D6( b ), rollAces2D6( b ), rollAces2D6( b ) ];
        expect( rollsA ).toEqual( rollsB );
        const saved = JSON.parse( JSON.stringify( a ) );
        expect( rollAces2D6( saved ) ).toBe( rollAces2D6( b ) );
        for( const roll of rollsA ) {
            expect( roll ).toBeGreaterThanOrEqual( 2 );
            expect( roll ).toBeLessThanOrEqual( 12 );
        }
    });

    it("shuffles without losing cards", () => {
        const cards = [ "475", "535", "265", "625", "785", "345" ];
        const shuffled = shuffleAces( cards, newAcesRngState( 7 ) );
        expect( shuffled.slice().sort() ).toEqual( cards.slice().sort() );
        expect( cards[0] ).toBe( "475" );
    });
});

describe("Aces Zones (Aces p.12)", () => {
    const units = [ enemy( "a", {}, { distance: 5 } ), enemy( "b", {}, { distance: 15 } ), enemy( "c", {}, { distance: 30 } ) ];

    it("uses the closest occupied band", () => {
        expect( selectAcesZone( units.slice( 1 ), [ 12, 18, 24 ], "" ).map( ( unit ) => unit.id ) ).toEqual( [ "b" ] );
        expect( selectAcesZone( units, [ 12, 18, 24 ], "" ).map( ( unit ) => unit.id ) ).toEqual( [ "a" ] );
    });

    it("treats everything past the last ring as the final Zone", () => {
        expect( selectAcesZone( [ units[2] ], [ 12, 18, 24 ], "" ).map( ( unit ) => unit.id ) ).toEqual( [ "c" ] );
    });

    it("handles the nearest and any keywords", () => {
        expect( selectAcesZone( units, [], "nearest" ).map( ( unit ) => unit.id ) ).toEqual( [ "a" ] );
        expect( selectAcesZone( units, [], "any" ).length ).toBe( 3 );
    });
});

describe("Aces priority lists (Aces pp.12, 18)", () => {
    it("stops at one candidate and ignores lines that match nobody", () => {
        const result = narrowAcesCandidates(
            [ enemy( "a", { armor: 3 } ), enemy( "b", { armor: 5 } ) ],
            [ { text: "[destroyobj] Objective", objective: true }, { text: "[lowest] Armor", stat: "armor", direction: "lowest" } ],
            null,
        );
        expect( result.remaining.map( ( unit ) => unit.id ) ).toEqual( [ "a" ] );
        expect( result.trace.join( " " ) ).toContain( "matches nobody" );
    });

    it("asks the players about a judged line before going on", () => {
        const rules = [ { text: "Attacked by ally this turn" }, { text: "[lowest] Armor", stat: "armor" as const, direction: "lowest" as const } ];
        const candidates = [ enemy( "a", { armor: 3 } ), enemy( "b", { armor: 5 } ) ];
        const first = narrowAcesCandidates( candidates, rules, null );
        expect( first.pending!.text ).toBe( "Attacked by ally this turn" );
        const second = narrowAcesCandidates( candidates, rules, null, { "Attacked by ally this turn": [ "b" ] } );
        expect( second.remaining.map( ( unit ) => unit.id ) ).toEqual( [ "b" ] );
    });

    it("skips unreadable lines", () => {
        const result = narrowAcesCandidates( [ enemy( "a", {} ), enemy( "b", {} ) ], acesSampleStarCaptainB.artillery.slice( 2 ), null );
        expect( result.pending ).toBeNull();
        expect( result.remaining.length ).toBe( 2 );
    });

    it("tutorial: the Timber Wolf's yellow list picks the Archer, which has less armor (Aces SS p.8)", () => {
        const archer = enemy( "Archer", { armor: 5 }, { distance: 16 } );
        const warhammer = enemy( "Warhammer", { armor: 7 }, { distance: 17 } );
        const result = narrowAcesCandidates( [ archer, warhammer ], [ { text: "[yellow]", color: "yellow" } ], acesSampleMechWarriorC );
        expect( result.remaining.map( ( unit ) => unit.id ) ).toEqual( [ "Archer" ] );
    });
});

describe("Aces movement (Aces pp.11-17)", () => {
    it("reads behavior conditions in order and defaults to Cautious (Aces p.11)", () => {
        expect( determineAcesBehavior( acesSampleSniper475, {} ).pending ).toBe( "aggressive" );
        expect( determineAcesBehavior( acesSampleSniper475, { aggressive: false } ).pending ).toBe( "balanced" );
        expect( determineAcesBehavior( acesSampleSniper475, { aggressive: false, balanced: true } ).behavior ).toBe( "balanced" );
        expect( determineAcesBehavior( acesSampleSniper475, { aggressive: false, balanced: false } ).behavior ).toBe( "cautious" );
    });

    it("uses the Forced Withdrawal column instead of the card (Aces p.16)", () => {
        const result = determineAcesBehavior( acesSampleSniper475, {}, { specialOrder: acesSampleForcedWithdrawal } );
        expect( result.behavior ).toBe( "forced-withdrawal" );
        expect( result.column.filters[0] ).toContain( "escape" );
    });

    it("forced withdrawal: priority 625 activates at 125 (Aces p.16)", () => {
        const input: IAcesActivationInput = { id: "w", priority: 625, pv: 40, token: null, forcedWithdrawal: true, fleeing: false };
        expect( getAcesEffectivePriority( input, "movement" ) ).toBe( 625 + ( acesSampleForcedWithdrawal.priority as number ) );
        expect( getAcesEffectivePriority( input, "movement" ) ).toBe( 125 );
    });

    it("skips a column when the attack-range filter leaves nobody (Aces p.12)", () => {
        const result = identifyAcesMovementTarget( acesSampleSniper475.aggressive, [ enemy( "a", {}, { canAttack: false, moved: true } ) ], null );
        expect( result.skipColumn ).toBe( true );
        const fallThrough = determineAcesBehavior( acesSampleSniper475, { balanced: false }, { skip: [ "aggressive" ] } );
        expect( fallThrough.behavior ).toBe( "cautious" );
    });

    it("holds position with no enemies (Aces p.16)", () => {
        expect( identifyAcesMovementTarget( acesSampleSniper475.cautious, [], null ).noTargets ).toBe( true );
    });

    it("does not use the closest-unit tie-break for movement targets", () => {
        const result = identifyAcesMovementTarget( acesSampleBrawler383.balanced, [
            enemy( "a", {}, { distance: 10, canAttack: true, moved: true } ),
            enemy( "b", {}, { distance: 10, canAttack: true, moved: true } ),
        ], null );
        expect( result.target ).toBeNull();
        expect( result.tied.length ).toBe( 2 );
    });

    it("falls back to Ground when a unit can't jump (Aces p.14)", () => {
        expect( resolveAcesMoveType( acesSampleForcedWithdrawal.column!, false, false ).moveType ).toBe( "ground" );
        expect( resolveAcesMoveType( acesSampleSniper475.balanced, true, true ).moveType ).toBe( "jump" );
        expect( resolveAcesMoveType( acesSampleSniper475.balanced, true, false ).moveType ).toBe( "ground" );
    });

    it("walks movement filters, with Movement Objective filters first (Aces pp.14, 17)", () => {
        const column = acesSampleSniper475.cautious;
        const pre = acesSampleMovementObjective.preFilters;
        const start = resolveAcesMovementFilters( column, [], pre );
        expect( start.next ).toBe( 0 );
        expect( start.filters[0].label ).toBe( "0a" );
        const single = resolveAcesMovementFilters( column, [ "none", "some", "none", "one" ], pre );
        expect( single.outcome ).toBe( "single-location" );
        const all = resolveAcesMovementFilters( column, start.filters.map( () => "some" ), pre );
        expect( all.outcome ).toBe( "golden-rule" );
    });
});

describe("Aces combat (Aces pp.18-20)", () => {
    it("tutorial: the Pouncer's card 475 targets the Locust, which has less armor (Aces SS p.7)", () => {
        const locust = enemy( "Locust", { armor: 2 }, { distance: 14, targetNumber: 10 } );
        const phoenixHawk = enemy( "Phoenix Hawk", { armor: 4 }, { distance: 16, targetNumber: 10 } );
        const first = identifyAcesCombatTarget( acesSampleSniper475, [ locust, phoenixHawk ], acesSampleMechWarriorC );
        expect( first.pending!.text ).toBe( "Attacked by ally this turn" );
        const result = identifyAcesCombatTarget( acesSampleSniper475, [ locust, phoenixHawk ], acesSampleMechWarriorC, { "Attacked by ally this turn": [] } );
        expect( result.target!.id ).toBe( "Locust" );
    });

    it("tutorial: at TN 10 the Pouncer uses no OV (Aces SS p.7)", () => {
        const result = resolveAcesOverheat( acesSampleSniper475.combat.overheat, {
            isBattleMech: true, ovRating: 1, currentHeat: 0, targetNumber: 10, destroyedThisPhase: false,
            zeroMoveFromHeat: false, damage: 2, targetArmor: 2,
        } );
        expect( result.attack ).toBe( true );
        expect( result.ov ).toBe( 0 );
    });

    it("ignores targets at TN 13+ and doomed targets, and uses the closest to break a tie (Aces p.18)", () => {
        const result = identifyAcesCombatTarget( acesSampleBrawler383, [
            enemy( "far", { armor: 3 }, { distance: 20 } ),
            enemy( "near", { armor: 3 }, { distance: 10 } ),
            enemy( "hard", { armor: 1 }, { distance: 8, targetNumber: 13 } ),
            enemy( "doomed", { armor: 0 }, { distance: 5, doomed: true } ),
        ], null );
        expect( result.target!.id ).toBe( "near" );
    });

    it("attacks with indirect fire when nothing is in line of sight (Aces p.18)", () => {
        const result = identifyAcesCombatTarget( acesSampleBrawler383, [ enemy( "a", {}, { canAttack: false } ) ], null, {}, true );
        expect( result.indirect ).toBe( true );
    });

    it("OV: never shuts down, maximum when destroyed, none on indirect fire, 'Mechs only (Aces pp.19-20)", () => {
        const base = {
            isBattleMech: true, ovRating: 3, currentHeat: 2, targetNumber: 4, destroyedThisPhase: false,
            zeroMoveFromHeat: false, damage: 3, targetArmor: 5,
        };
        const rows = acesSampleSniper475.combat.overheat;
        expect( resolveAcesOverheat( rows, base ).ov ).toBe( 1 );
        expect( resolveAcesOverheat( rows, { ...base, destroyedThisPhase: true } ).ov ).toBe( 3 );
        expect( resolveAcesOverheat( rows, { ...base, indirect: true } ).ov ).toBe( 0 );
        expect( resolveAcesOverheat( rows, { ...base, isBattleMech: false } ).ov ).toBe( 0 );
        expect( resolveAcesOverheat( rows, { ...base, zeroMoveFromHeat: true } ).attack ).toBe( false );
        expect( resolveAcesOverheat( rows, { ...base, targetNumber: 9 } ).attack ).toBe( false );
        expect( resolveAcesOverheat( rows, { ...base, currentHeat: 0, targetNumber: 6, damage: 4, targetArmor: 5 } ).ov ).toBe( 3 );
        expect( resolveAcesOverheat( rows, { ...base, currentHeat: 0, targetNumber: 6, damage: 1, targetArmor: 5 } ).ov ).toBe( 0 );
    });

    it("makes physical attacks only when the rules call for one (Aces p.20)", () => {
        const input = { orderedByCard: false, baseContact: false, inMeleeRange: true, physicalDamage: 2, weaponDamage: 3, fireControlHits: 0, heat: 0 };
        expect( shouldAcesMakePhysicalAttack( input ).physical ).toBe( false );
        expect( shouldAcesMakePhysicalAttack( { ...input, heat: 1 } ).physical ).toBe( true );
        expect( shouldAcesMakePhysicalAttack( { ...input, inMeleeRange: false, baseContact: true } ).physical ).toBe( true );
    });

    it("plays support cards lowest TN first, higher damage on a tie, and honors the structure order (Aces p.20)", () => {
        const order = orderAcesSupportCards( [
            { id: "a", name: "a", targetNumber: 6, damage: 2 },
            { id: "b", name: "b", targetNumber: 4, damage: 1 },
            { id: "c", name: "c", targetNumber: 6, damage: 3 },
        ] );
        expect( order.map( ( card ) => card.id ) ).toEqual( [ "b", "c", "a" ] );
        expect( acesSupportCardAllowed( acesSampleStarCaptainB, 3, 3 ) ).toBe( false );
        expect( acesSupportCardAllowed( acesSampleStarCaptainB, 4, 3 ) ).toBe( true );
        expect( acesSpotterAttacks( 2, 3 ) ).toBe( false );
    });
});

describe("Aces Command cards (Aces pp.8, 21)", () => {
    it("gives the Move Last token by the card's ranking", () => {
        const order = acesSampleStarCaptainB.orders[0];
        const result = chooseAcesTokenUnit( order, [
            { ...enemy( "a", { "damage-m": 3 } ), eligible: true },
            { ...enemy( "b", { "damage-m": 4 } ), eligible: true },
            { ...enemy( "c", { "damage-m": 5 } ), eligible: false },
        ] );
        expect( result.unitId ).toBe( "b" );
    });

    it("reads strategy decisions top down, first true row wins", () => {
        const card = acesSampleStarCaptainB;
        expect( evaluateAcesStrategy( card, {}, { objectiveComplete: true, enemyWithNoArmor: false } ).letter ).toBe( "E" );
        expect( evaluateAcesStrategy( card, {}, { objectiveComplete: false, enemyWithNoArmor: false } ).pending!.letter ).toBe( "D" );
        expect( evaluateAcesStrategy( card, { D: false, C: true }, { objectiveComplete: false, enemyWithNoArmor: false } ).letter ).toBe( "C" );
        expect( evaluateAcesStrategy( card, { D: false, C: false, A: false }, { objectiveComplete: false, enemyWithNoArmor: false } ).letter ).toBeNull();
    });
});

describe("Aces rules switch: critical hits (Aces pp.4-6)", () => {
    it("infantry and emplacements always take a Weapon Hit under the Aces rules", () => {
        const rng = newAcesRngState( 1 );
        expect( rollAcesCriticalHit( "aces", "CI", false, rng ).effect ).toBe( "weapon" );
        expect( rollAcesCriticalHit( "aces", "BM", true, rng ).effect ).toBe( "weapon" );
        expect( rng.calls ).toBe( 0 );
    });

    it("vehicles use the Aces table; everything under ASCE uses the Commander's Edition table", () => {
        const vehicle = rollAcesCriticalHit( "aces", "CV", false, newAcesRngState( 1 ) );
        expect( vehicle.effect ).not.toBe( "use-asce-table" );
        expect( rollAcesCriticalHit( "asce", "CV", false, newAcesRngState( 1 ) ).effect ).toBe( "use-asce-table" );
        expect( rollAcesCriticalHit( "asce", "CI", false, newAcesRngState( 1 ) ).effect ).toBe( "use-asce-table" );
    });

    it("marks a critical hit for the End Phase", () => {
        const unit = new AlphaStrikeUnit();
        unit.type = "CV";
        unit.armor = 3;
        unit.structure = 3;
        unit.move = [ { move: 8, currentMove: 8, type: "t" } ];
        unit.calcCurrentValues();
        expect( applyAcesCriticalToUnit( unit, "weapon" ) ).toBe( true );
        expect( unit.roundWeaponHits.filter( ( hit ) => hit ).length ).toBe( 1 );
        expect( applyAcesCriticalToUnit( unit, "ammo" ) ).toBe( false );
    });
});

describe("Aces card lookup", () => {
    it("finds a library card by deck and priority", () => {
        expect( findAcesCard( [ acesSampleSniper475, acesSampleBrawler383 ], "Sniper", 475 )!.id ).toBe( acesSampleSniper475.id );
        expect( findAcesCard( [ acesSampleSniper475 ], "", 475 ) ).not.toBeNull();
        expect( findAcesCard( [ acesSampleSniper475 ], "Brawler", 475 ) ).toBeNull();
    });
});
