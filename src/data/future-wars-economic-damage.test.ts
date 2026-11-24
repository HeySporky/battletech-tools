import { describe, expect, it } from "vitest";
import { ICampaignArea, ICampaignSide } from "../classes/campaign/campaign-types";
import {
    FW_DOT_DESTROY_TARGETS,
    FW_FIGHT_SIZE_MODIFIERS,
    getDotDamageModifier,
    isDefenderRestraint,
    isDotDestroyed,
    rollAreaDamage,
    rollPartisans,
} from "./future-wars-economic-damage";

const company = { size: "company" as const, defenderRestraint: false, scorchedEarth: false };
const sides: ICampaignSide[] = [ { id: "d", name: "Defender", role: "defender" }, { id: "a", name: "Attacker", role: "attacker" } ];
const area = ( controllerSideId: string | null, types: string[] = ["food"] ): ICampaignArea => ( {
    id: "x", name: "X", terrain: "", controllerSideId, comboOverride: null,
    dots: types.map( ( type, i ) => ( { id: "d" + i, type, destroyed: false } ) ),
} );

describe( "Economic damage table (derived by NGCFells, inspired by Barents)", () => {
    it( "prints NGCFells's table", () => {
        expect( FW_DOT_DESTROY_TARGETS ).toEqual( {
            "food": 6, "oil": 7, "mining": 8, "radioactive-materials": 8, "refining": 9, "processing": 9,
            "light-manufacturing": 10, "heavy-manufacturing": 11,
        } );
        expect( FW_FIGHT_SIZE_MODIFIERS ).toEqual( { lance: -2, company: 0, battalion: 1, regiment: 2 } );
    } );

    it( "food falls on 6+ in a company fight", () => {
        expect( isDotDestroyed( 6, 6, getDotDamageModifier( company ) ) ).toBe( true );
        expect( isDotDestroyed( 6, 5, getDotDamageModifier( company ) ) ).toBe( false );
    } );

    it( "a lance fight takes 2 off", () => {
        expect( isDotDestroyed( 6, 7, getDotDamageModifier( { ...company, size: "lance" } ) ) ).toBe( false );
    } );

    it( "heavy industry needs 11+", () => {
        expect( isDotDestroyed( 11, 9, getDotDamageModifier( { ...company, size: "regiment" } ) ) ).toBe( true );
        expect( isDotDestroyed( 11, 10, getDotDamageModifier( company ) ) ).toBe( false );
    } );

    it( "scorched earth adds 3 and restraint takes 1", () => {
        expect( getDotDamageModifier( { ...company, scorchedEarth: true } ) ).toBe( 3 );
        expect( getDotDamageModifier( { ...company, defenderRestraint: true } ) ).toBe( -1 );
    } );

    it( "a natural 2 never destroys", () => {
        expect( isDotDestroyed( 6, 2, getDotDamageModifier( { size: "regiment", defenderRestraint: false, scorchedEarth: true } ) ) ).toBe( false );
    } );

    it( "defender's restraint only in the first quarter", () => {
        expect( isDefenderRestraint( area( "d" ), sides, 2 ) ).toBe( true );
        expect( isDefenderRestraint( area( "d" ), sides, 3 ) ).toBe( false );
        expect( isDefenderRestraint( area( "a" ), sides, 0 ) ).toBe( false );
        expect( isDefenderRestraint( area( null ), sides, 0 ) ).toBe( false );
    } );

    it( "partisans roll at -2", () => {
        const food = { id: "f", type: "food", destroyed: false };
        expect( rollPartisans( food, [], () => 8 ) ).toEqual( { roll: 8, destroyed: true } );
        expect( rollPartisans( food, [], () => 7 ) ).toEqual( { roll: 7, destroyed: false } );
    } );

    it( "rolls each live dot of an area, custom types at their own target", () => {
        const a = area( "d", ["food", "heavy-manufacturing", "spice"] );
        a.dots.push( { id: "gone", type: "oil", destroyed: true } );
        const rolls = [6, 10, 8];
        const results = rollAreaDamage( a, [ { id: "spice", name: "Spice", value: 1, target: 8 } ], company, () => rolls.shift()! );
        expect( results ).toEqual( [
            { dotId: "d0", roll: 6, destroyed: true },
            { dotId: "d1", roll: 10, destroyed: false },
            { dotId: "d2", roll: 8, destroyed: true },
        ] );
    } );
} );
