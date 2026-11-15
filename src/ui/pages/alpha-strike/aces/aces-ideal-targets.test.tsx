// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getAcesIdealTargets, IAcesUnitStats } from "../../../../classes/aces-engine";
import { acesSampleStarCaptainB } from "../../../../data/aces-card-samples";
import AcesIdealTargets from "./_ideal-targets";

afterEach( cleanup );

const stats = ( values: Partial<IAcesUnitStats> ): IAcesUnitStats => ( {
    "armor": 4, "structure": 4, "armor-lost": 0, "structure-lost": 0, "tmm": 1, "pv": 30, "mv": 8,
    "damage-s": 2, "damage-m": 2, "damage-l": 1, "size": 2, "heat": 0, "armor-start": 4, "structure-start": 4, ...values,
} );

describe("Aces ideal targets list (#630)", () => {
    it("shows the ideal unit for each color", () => {
        const targets = getAcesIdealTargets( [
            { id: "locust", name: "Locust", stats: stats( { armor: 2, structure: 3 } ) },
            { id: "atlas", name: "Atlas", stats: stats( { armor: 9, structure: 8, "armor-lost": 5 } ) },
        ], acesSampleStarCaptainB );
        render( <AcesIdealTargets targets={targets} /> );
        const text = document.body.textContent || "";
        expect( text ).toContain( "Ideal RED: Locust" );
        expect( text ).toContain( "Ideal YELLOW: Atlas" );
        expect( text ).toContain( "Ideal BLUE:" );
    } );

    it("shows nothing without a Command card", () => {
        render( <AcesIdealTargets targets={[]} /> );
        expect( document.body.textContent ).toBe( "" );
    } );
} );
