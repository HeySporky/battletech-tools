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
    getAcesOrdersForPhase,
    isAcesNoOrder,
    determineAcesBehavior,
    evaluateAcesStrategy,
    findAcesCard,
    findAcesCommandCard,
    getAcesIdealTargets,
    evaluateAcesCondition,
    IAcesCandidate,
    IAcesUnitStats,
    identifyAcesCombatTarget,
    identifyAcesMovementTarget,
    getAcesUnitStats,
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
import { newAcesBehaviorColumn } from "../data/aces-cards";
import { asceAerospaceCriticalTable, asceDropShipCriticalTable, asceMechCriticalTable, asceProtoMechCriticalTable, asceVehicleCriticalTable, lookupAcesTable } from "../data/aces-rules";
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
    "armor-start": 4,
    "structure-start": 4,
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

describe("Aces unit-card ranking lines (#637)", () => {
    const candidate = ( id: string, armor: number, damaged: number ): IAcesCandidate => {
        const unit = new AlphaStrikeUnit();
        unit.type = "CV";
        unit.armor = armor;
        unit.structure = 4;
        unit.move = [ { move: 8, currentMove: 8, type: "t" } ];
        unit.calcCurrentValues();
        unit.currentArmor = unit.currentArmor.map( ( _hit, index ) => index < damaged );
        return { id: id, name: id, stats: getAcesUnitStats( unit ) };
    };

    it("ranks Starting Armor from the printed value", () => {
        const rule = { text: "[highest] Starting Armor", stat: "armor-start" as const, direction: "highest" as const };
        const result = narrowAcesCandidates( [ candidate( "A", 6, 0 ), candidate( "B", 8, 6 ) ], [ rule ], null );
        expect( result.remaining.map( ( unit ) => unit.id ) ).toEqual( [ "B" ] );
        expect( result.pending ).toBeNull();
    });

    it("re-reads an old saved rule", () => {
        const result = narrowAcesCandidates( [ candidate( "A", 6, 0 ), candidate( "B", 8, 6 ) ], [ { text: "[highest] Starting Armor" } ], null );
        expect( result.remaining.map( ( unit ) => unit.id ) ).toEqual( [ "B" ] );
        expect( result.pending ).toBeNull();
    });

    it("filters no Armor", () => {
        const some = narrowAcesCandidates( [ candidate( "A", 6, 0 ), candidate( "B", 8, 8 ) ], [ { text: "no Armor" } ], null );
        expect( some.remaining.map( ( unit ) => unit.id ) ).toEqual( [ "B" ] );
        const none = narrowAcesCandidates( [ candidate( "A", 6, 0 ), candidate( "B", 8, 6 ) ], [ { text: "no Armor" } ], null );
        expect( none.remaining.length ).toBe( 2 );
        expect( none.trace.join( " " ) ).toContain( "matches nobody" );
    });

    it("still asks about a judged line", () => {
        const result = narrowAcesCandidates( [ candidate( "A", 6, 0 ), candidate( "B", 8, 6 ) ], [ { text: "Attacked by ally this turn" } ], null );
        expect( result.pending!.text ).toBe( "Attacked by ally this turn" );
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

    it("keeps only enemies in line of sight for a [los] target, out of it for [nolos] (Aces p.9, #591)", () => {
        const enemies = [
            enemy( "seen", {}, { distance: 10, inLOS: true } ),
            enemy( "hidden", {}, { distance: 20, inLOS: false } ),
        ];
        const scout = { ...newAcesBehaviorColumn(), zoneKeyword: "any" as const, targetInLOS: true };
        expect( identifyAcesMovementTarget( scout, enemies, null ).target?.id ).toBe( "seen" );
        const missileBoat = { ...newAcesBehaviorColumn(), zoneKeyword: "any" as const, targetNoLOS: true };
        expect( identifyAcesMovementTarget( missileBoat, enemies, null ).target?.id ).toBe( "hidden" );
    });

    it("skips a column when a line-of-sight filter leaves nobody (#591)", () => {
        const column = { ...newAcesBehaviorColumn(), zoneKeyword: "any" as const, targetNoLOS: true };
        const result = identifyAcesMovementTarget( column, [ enemy( "a", {}, { inLOS: true } ) ], null );
        expect( result.skipColumn ).toBe( true );
        expect( result.trace.join( " " ) ).toContain( "line of sight" );
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

    it("treats a \"None.\" order as no order (#637)", () => {
        const card = { ...acesSampleStarCaptainB, orders: [
            { phase: "any", text: "None." },
            { phase: "end", text: "none" },
            { phase: "end", text: "Real order" },
        ] } as typeof acesSampleStarCaptainB;
        expect( getAcesOrdersForPhase( card, "end" ).map( ( order ) => order.text ) ).toEqual( [ "Real order" ] );
        expect( isAcesNoOrder( "  None " ) ).toBe( true );
        expect( isAcesNoOrder( "None of the above" ) ).toBe( false );
    });

    it("reads strategy decisions top down, first true row wins", () => {
        const card = acesSampleStarCaptainB;
        expect( evaluateAcesStrategy( card, {}, { objectiveComplete: true, enemyWithNoArmor: false } ).letter ).toBe( "E" );
        expect( evaluateAcesStrategy( card, {}, { objectiveComplete: false, enemyWithNoArmor: false } ).pending!.letter ).toBe( "D" );
        expect( evaluateAcesStrategy( card, { D: false, C: true }, { objectiveComplete: false, enemyWithNoArmor: false } ).letter ).toBe( "C" );
        expect( evaluateAcesStrategy( card, { D: false, C: false, A: false }, { objectiveComplete: false, enemyWithNoArmor: false } ).letter ).toBeNull();
    });

    it("keeps the current card on a 'Maintain this strategy' row, and reads the structure rule from the support text (#602)", () => {
        const card = { ...acesSampleStarCaptainB, letter: "E", strategy: [ { letter: "", text: "Maintain this strategy", auto: "maintain" as const } ] };
        const result = evaluateAcesStrategy( card, {}, { objectiveComplete: false, enemyWithNoArmor: false } );
        expect( result.pending ).toBeNull();
        expect( result.letter ).toBeNull();
        expect( result.trace[result.trace.length - 1] ).toBe( "Maintain this strategy: card E stays." );
        const textOnly = { ...acesSampleStarCaptainB, supportOnlyIfStructure: false };
        expect( acesSupportCardAllowed( textOnly, 3, 3 ) ).toBe( false );
        expect( acesSupportCardAllowed( { ...textOnly, supportOrders: "Spend up to 2 Battlefield Support cards." }, 3, 3 ) ).toBe( true );
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
        // ASCE tables are built in (p.50, p.187): no more "look it up".
        for( const type of [ "BM", "IM", "PM", "CV", "SV", "AF", "CF", "SC", "DS" ] ) {
            const result = rollAcesCriticalHit( "asce", type, false, newAcesRngState( 1 ) );
            expect( result.effect, type ).not.toBe( "use-asce-table" );
            expect( result.roll, type ).not.toBeNull();
        }
        // Infantry and battle armor never roll for a critical hit under ASCE (p.49).
        const infantry = rollAcesCriticalHit( "asce", "CI", false, newAcesRngState( 1 ) );
        expect( infantry.effect ).toBe( "none" );
        expect( infantry.roll ).toBeNull();
        // Ships and anything else the book prints no table for stay a lookup.
        expect( rollAcesCriticalHit( "asce", "WS", false, newAcesRngState( 1 ) ).effect ).toBe( "use-asce-table" );
    });

    it("rolls the ASCE column for the unit type, and an IndustrialMech rolls twice (p.50)", () => {
        expect( lookupAcesTable( asceMechCriticalTable, 2 ).effect ).toBe( "ammo" );
        expect( lookupAcesTable( asceMechCriticalTable, 12 ).effect ).toBe( "destroyed" );
        expect( lookupAcesTable( asceProtoMechCriticalTable, 10 ).effect ).toBe( "destroyed" );
        expect( lookupAcesTable( asceVehicleCriticalTable, 12 ).effect ).toBe( "engine" );
        expect( lookupAcesTable( asceVehicleCriticalTable, 9 ).effect ).toBe( "weapon" );
        expect( lookupAcesTable( asceAerospaceCriticalTable, 12 ).effect ).toBe( "crew-killed" );
        expect( lookupAcesTable( asceDropShipCriticalTable, 7 ).effect ).toBe( "thruster" );
        const rng = newAcesRngState( 5 );
        const industrial = rollAcesCriticalHit( "asce", "IM", false, rng );
        expect( rng.calls ).toBe( 4 );
        expect( industrial.also ).toBeDefined();
        const mech = newAcesRngState( 5 );
        rollAcesCriticalHit( "asce", "BM", false, mech );
        expect( mech.calls ).toBe( 2 );
        // A walker rolls as a 'Mech, an industrial walker twice as an IndustrialMech (Custom Homebrew).
        const walker = newAcesRngState( 5 );
        expect( rollAcesCriticalHit( "asce", "WK", false, walker ).also ).toBeUndefined();
        expect( walker.calls ).toBe( 2 );
        const industrialWalker = newAcesRngState( 5 );
        expect( rollAcesCriticalHit( "asce", "IWK", false, industrialWalker ).also ).toBeDefined();
        expect( industrialWalker.calls ).toBe( 4 );
    });

    it("gives a Micro-Mech's Engine Hit the MCR reading (Custom Homebrew): a Weapon Hit too, unless ENE; the second destroys it", () => {
        let seed = 1;
        while( rollAcesCriticalHit( "asce", "BM", false, newAcesRngState( seed ) ).effect !== "engine" ) seed++;
        for( const ruleset of [ "asce", "aces" ] as const ) {
            const first = rollAcesCriticalHit( ruleset, "MM", false, newAcesRngState( seed ), { energy: false, engineHits: 0 } );
            expect( first.effect ).toBe( "engine" );
            expect( first.label ).toMatch( /MCR/ );
            expect( first.also?.effect ).toBe( "weapon" );
            const energy = rollAcesCriticalHit( ruleset, "MM", false, newAcesRngState( seed ), { energy: true, engineHits: 0 } );
            expect( energy.also ).toBeUndefined();
            expect( energy.label ).toMatch( /no more weapon attacks/ );
            const second = rollAcesCriticalHit( ruleset, "MM", false, newAcesRngState( seed ), { energy: false, engineHits: 1 } );
            expect( second.also ).toBeUndefined();
            expect( second.label ).toMatch( /destroyed/ );
        }
        // A BattleMech's Engine Hit is untouched.
        expect( rollAcesCriticalHit( "asce", "BM", false, newAcesRngState( seed ) ).also ).toBeUndefined();
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

describe("Aces ideal targets on a Command card (#630)", () => {
    it("works out the ideal unit for the red, yellow and blue lists", () => {
        // Star Captain B. Red: lowest armor. Yellow: objective, highest armor lost. Blue: objective, lowest structure.
        const units = [
            enemy( "Locust", { armor: 2, structure: 3, "armor-lost": 0 } ),
            enemy( "Atlas", { armor: 9, structure: 8, "armor-lost": 5 } ),
            enemy( "Hunchback", { armor: 6, structure: 2, "armor-lost": 1 } ),
        ];
        const ideals = getAcesIdealTargets( units, acesSampleStarCaptainB );
        expect( ideals.map( ( entry ) => entry.color ) ).toEqual( [ "red", "yellow", "blue" ] );
        expect( ideals[0].ideal!.id ).toBe( "Locust" );
        expect( ideals[1].ideal!.id ).toBe( "Atlas" );
        expect( ideals[2].ideal!.id ).toBe( "Hunchback" );
    });
    it("says so when the units are tied on every line, and when a line needs the players", () => {
        const twins = [ enemy( "A", {} ), enemy( "B", {} ) ];
        const tied = getAcesIdealTargets( twins, acesSampleStarCaptainB );
        expect( tied[0].ideal ).toBeNull();
        expect( tied[0].tied.map( ( entry ) => entry.id ) ).toEqual( [ "A", "B" ] );

        const judged = { ...acesSampleStarCaptainB, red: [ { text: "Attacked by ally this turn" } ] };
        const asked = getAcesIdealTargets( twins, judged );
        expect( asked[0].pending!.text ).toBe( "Attacked by ally this turn" );
    });
    it("gives nothing without a Command card or without units", () => {
        expect( getAcesIdealTargets( [ enemy( "A", {} ) ], null ) ).toEqual( [] );
        expect( getAcesIdealTargets( [], acesSampleStarCaptainB )[0].ideal ).toBeNull();
    });
});

describe("Aces Command card lookup", () => {
    const cards = [ acesSampleStarCaptainB, acesSampleMechWarriorC ];
    it("matches a sortie deck name that holds the deck and the faction", () => {
        // Sortie text: "MechWarrior, Clan Jade Falcon"; the library card stores deck and faction apart.
        expect( findAcesCommandCard( cards, "C", "MechWarrior, Clan Jade Falcon", "" )!.id ).toBe( acesSampleMechWarriorC.id );
        expect( findAcesCommandCard( cards, "C", " mechwarrior  clan jade falcon ", "" )!.id ).toBe( acesSampleMechWarriorC.id );
        expect( findAcesCommandCard( cards, "C", "MechWarrior deck", "" )!.id ).toBe( acesSampleMechWarriorC.id );
    });
    it("still matches the plain deck name, the saved id, and a blank deck", () => {
        expect( findAcesCommandCard( cards, "B", "Star Captain", "" )!.id ).toBe( acesSampleStarCaptainB.id );
        expect( findAcesCommandCard( cards, "C", "Anything", acesSampleMechWarriorC.id )!.id ).toBe( acesSampleMechWarriorC.id );
        expect( findAcesCommandCard( cards, "B", "", "" )!.id ).toBe( acesSampleStarCaptainB.id );
    });
    it("falls back to the only card with that letter, and returns null when the letter is missing", () => {
        expect( findAcesCommandCard( cards, "C", "Some Other Deck", "" )!.id ).toBe( acesSampleMechWarriorC.id );
        expect( findAcesCommandCard( cards, "D", "MechWarrior", "" ) ).toBeNull();
    });
    it("does not guess between several cards with the same letter", () => {
        const other = { ...acesSampleMechWarriorC, id: "other-c", deck: "Star Colonel", faction: "" };
        expect( findAcesCommandCard( [ acesSampleMechWarriorC, other ], "C", "Unknown", "" ) ).toBeNull();
        expect( findAcesCommandCard( [ acesSampleMechWarriorC, other ], "C", "Star Colonel", "" )!.id ).toBe( "other-c" );
    });
});

describe("Aces behavior conditions answered from known data (#630 point 2)", () => {
    const at = ( id: string, distance: number | null, extra: Partial<IAcesCandidate> = {} ) => enemy( id, {}, { distance, ...extra } );
    const ask = ( text: string, candidates: IAcesCandidate[], more: { crippled?: boolean | null } = {} ) =>
        evaluateAcesCondition( text, { candidates: candidates, ideals: getAcesIdealTargets( candidates, acesSampleStarCaptainB ), crippled: more.crippled === undefined ? null : more.crippled } );

    it("any [moved] enemies in N inches: true for a moved unit inside, false when none moved, asks on an unknown distance", () => {
        const text = "If there are any [moved] enemies in 18\"";
        expect( ask( text, [ at( "A", 10, { moved: true } ) ] ) ).toBe( true );
        expect( ask( text, [ at( "A", 30, { moved: true } ) ] ) ).toBe( false );
        expect( ask( text, [ at( "A", 5, { moved: false } ) ] ) ).toBe( false );
        expect( ask( text, [ at( "A", null, { moved: true } ) ] ) ).toBeNull();
        expect( ask( text, [] ) ).toBe( false );
    });
    it("no [moved] / no [notmoved] enemies in N inches", () => {
        expect( ask( "If there are no [moved] enemies in 12\"", [ at( "A", 20, { moved: true } ) ] ) ).toBe( true );
        expect( ask( "If there are no [moved] enemies in 12\"", [ at( "A", 4, { moved: true } ) ] ) ).toBe( false );
        expect( ask( "If there are no [notmoved] enemies in 12\"", [ at( "A", 4, { moved: false } ) ] ) ).toBe( false );
        expect( ask( "If there are no [notmoved] enemies in 12\"", [ at( "A", null, { moved: false } ) ] ) ).toBeNull();
        expect( ask( "If there are no [notmoved] enemies in 12\"", [ at( "A", null, { moved: true } ) ] ) ).toBe( true );
    });
    it("joins clauses with and: false wins, all true is true, anything unknown asks", () => {
        const text = "If there are any [moved] enemies in 18\" and no [notmoved] enemies in 6\"";
        expect( ask( text, [ at( "A", 10, { moved: true } ), at( "B", 20, { moved: false } ) ] ) ).toBe( true );
        expect( ask( text, [ at( "A", 10, { moved: true } ), at( "B", 3, { moved: false } ) ] ) ).toBe( false );
        expect( ask( text, [ at( "A", 10, { moved: true } ), at( "B", null, { moved: false } ) ] ) ).toBeNull();
        expect( ask( text, [ at( "A", 30, { moved: true } ), at( "B", null, { moved: false } ) ] ) ).toBe( false );
    });
    it("at least K enemies in [los] and N inches", () => {
        const text = "If there are at least 3 enemies in [los] and 24\"";
        const three = [ at( "A", 5, { inLOS: true } ), at( "B", 10, { inLOS: true } ), at( "C", 24, { inLOS: true } ) ];
        expect( ask( text, three ) ).toBe( true );
        expect( ask( text, [ ...three.slice( 0, 2 ), at( "C", 30, { inLOS: true } ) ] ) ).toBe( false );
        expect( ask( text, [ ...three.slice( 0, 2 ), at( "C", 10, { inLOS: false } ) ] ) ).toBe( false );
        expect( ask( text, [ ...three.slice( 0, 2 ), at( "C", null, { inLOS: true } ) ] ) ).toBeNull();
    });
    it("ideal [c] is [moved] (and in N inches)", () => {
        // Star Captain B red: lowest armor.
        const low = enemy( "Locust", { armor: 2 }, { distance: 10, moved: true } );
        const high = enemy( "Atlas", { armor: 9 }, { distance: 4, moved: false } );
        expect( ask( "If the ideal [red] is [moved]", [ low, high ] ) ).toBe( true );
        expect( ask( "If the ideal [red] is [moved] and in 8\"", [ low, high ] ) ).toBe( false );
        expect( ask( "If the ideal [red] is [moved] and in 12\"", [ low, high ] ) ).toBe( true );
        expect( ask( "If the ideal [red] is [moved]", [ { ...low, moved: false }, high ] ) ).toBe( false );
        expect( ask( "If the ideal [red] is [moved] and in 12\"", [ { ...low, distance: null }, high ] ) ).toBeNull();
        // Tied ideal: the players must judge first.
        expect( ask( "If the ideal [red] is [moved]", [ enemy( "A", {} ), enemy( "B", {} ) ] ) ).toBeNull();
    });
    it("a not-moved ideal answers false even when the rest of the line needs the table", () => {
        const low = enemy( "Locust", { armor: 2 }, { distance: 10, moved: false } );
        const atlas = enemy( "Atlas", { armor: 9 } );
        expect( ask( "If the ideal [red] is [moved] and unit can move behind it", [ low, atlas ] ) ).toBe( false );
        expect( ask( "If the ideal [red] is [moved] and unit can move behind it", [ { ...low, moved: true }, atlas ] ) ).toBeNull();
    });
    it("this unit is crippled, and unknown wording asks", () => {
        expect( ask( "If this unit is crippled", [], { crippled: true } ) ).toBe( true );
        expect( ask( "If this unit is crippled", [], { crippled: false } ) ).toBe( false );
        expect( ask( "If this unit is crippled", [] ) ).toBeNull();
        expect( ask( "If there are any enemies in this unit's [range]", [ at( "A", 3 ) ] ) ).toBeNull();
        expect( ask( "", [ at( "A", 3 ) ] ) ).toBeNull();
    });
});
