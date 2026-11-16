// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AcesNamedPilot } from "../../../../classes/aces-campaign";
import { IAcesEdgeCard, newAcesEdgeCard } from "../../../../data/aces-cards";
import AcesEdgeReminders, { getAcesEdgeReminders } from "./_edge-reminders";

afterEach( cleanup );

const card = ( name: string, phase: IAcesEdgeCard["phase"], extra: Partial<IAcesEdgeCard> = {} ): IAcesEdgeCard => {
    const made = newAcesEdgeCard();
    made.name = name;
    made.phase = phase;
    return Object.assign( made, extra );
};

const pilot = ( callsign: string, edgeAbilities: string[], killed = false ): AcesNamedPilot => {
    const made = new AcesNamedPilot();
    made.callsign = callsign;
    made.edgeAbilities = edgeAbilities;
    made.killed = killed;
    return made;
};

describe( "Edge reminders during play", () => {
    it( "shows a movement card in Movement and not in Combat", () => {
        const cards = [ card( "Teapot Dash", "movement" ) ];
        const pilots = [ pilot( "Kite", [ "Teapot Dash" ] ) ];
        expect( getAcesEdgeReminders( pilots, cards, "movement" ).map( ( r ) => r.card.name ) ).toEqual( [ "Teapot Dash" ] );
        expect( getAcesEdgeReminders( pilots, cards, "combat" ) ).toEqual( [] );
        const { container } = render( <AcesEdgeReminders pilots={pilots} cards={cards} phase="combat" /> );
        expect( container.textContent ).toBe( "" );
    } );

    it( "shows an any-phase card in every phase", () => {
        const cards = [ card( "Kite Flight", "any" ) ];
        const pilots = [ pilot( "Kite", [ "kite flight" ] ) ];
        for( const phase of [ "initiative", "movement", "combat", "end" ] as const ) {
            expect( getAcesEdgeReminders( pilots, cards, phase ).length ).toBe( 1 );
        }
    } );

    it( "skips a killed pilot's cards", () => {
        const cards = [ card( "Teapot Dash", "movement" ) ];
        const pilots = [ pilot( "Gone", [ "Teapot Dash" ], true ), pilot( "Kite", [ "Teapot Dash" ] ) ];
        expect( getAcesEdgeReminders( pilots, cards, "movement" ).map( ( r ) => r.pilot ) ).toEqual( [ "Kite" ] );
    } );

    it( "shows pilot, name, cost, condition and the trigger hint", () => {
        const cards = [ card( "Teapot Dash", "combat", { cost: 2, condition: "While the kite flies", trigger: "enemy-rear", text: "Hidden body text" } ) ];
        render( <AcesEdgeReminders pilots={[ pilot( "Kite", [ "Teapot Dash" ] ) ]} cards={cards} phase="combat" /> );
        const text = document.body.textContent || "";
        expect( text ).toContain( "Kite" );
        expect( text ).toContain( "Teapot Dash" );
        expect( text ).toContain( "2" );
        expect( text ).toContain( "While the kite flies" );
        expect( text ).toContain( "if the unit is in an enemy's rear arc" );
        expect( text ).not.toContain( "Hidden body text" );
    } );

    it( "gives no reminder for a name with no entered card", () => {
        const cards = [ card( "Teapot Dash", "combat" ) ];
        const pilots = [ pilot( "Kite", [ "Unknown Teacup" ] ) ];
        expect( getAcesEdgeReminders( pilots, cards, "combat" ) ).toEqual( [] );
        render( <AcesEdgeReminders pilots={pilots} cards={cards} phase="combat" /> );
        expect( screen.queryByText( /Unknown Teacup/ ) ).toBeNull();
    } );
} );
