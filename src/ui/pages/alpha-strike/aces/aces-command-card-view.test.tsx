// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { acesSampleStarCaptainB } from "../../../../data/aces-card-samples";
import { AcesCommandCardView } from "./_aces-card-view";

afterEach( cleanup );

describe("Aces Command card view", () => {
    // Rekikire: on the print page the Support orders ran into the Emplacements on one line (#603).
    it("prints the Support orders above the Emplacements columns, not beside them", () => {
        render( <AcesCommandCardView card={acesSampleStarCaptainB} /> );
        const support = Array.from( document.querySelectorAll( "p" ) ).find( ( p ) => p.textContent === acesSampleStarCaptainB.supportOrders );
        expect( support ).toBeTruthy();
        expect( support!.closest( ".aces-card-columns" ) ).toBeNull();
        const emplacements = Array.from( document.querySelectorAll( "h5" ) ).find( ( h ) => ( h.textContent || "" ).startsWith( "Emplacements" ) );
        expect( emplacements!.closest( ".aces-card-columns" ) ).toBeTruthy();
    });

    it("renders no order row for a \"None.\" order (#637)", () => {
        const card = { ...acesSampleStarCaptainB, orders: [ { phase: "any", text: "None." } ] } as typeof acesSampleStarCaptainB;
        render( <AcesCommandCardView card={card} /> );
        const rows = Array.from( document.querySelectorAll( "li" ) ).filter( ( li ) => ( li.textContent || "" ).includes( "None" ) );
        expect( rows ).toHaveLength( 0 );
    });
});
