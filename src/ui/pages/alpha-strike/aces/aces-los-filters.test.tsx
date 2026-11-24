// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IAcesUnitStats } from "../../../../classes/aces-engine";
import { acesSampleMechWarriorC, acesSampleSniper475 } from "../../../../data/aces-card-samples";
import { IAcesCard, newAcesBehaviorColumn } from "../../../../data/aces-cards";
import { AcesColumnView } from "./_aces-card-view";
import AcesCardReader from "./_card-reader";

afterEach( cleanup );

const stats = ( armor: number ): IAcesUnitStats => ( {
    "armor": armor, "structure": 2, "armor-lost": 0, "structure-lost": 0, "tmm": 2, "pv": 20, "mv": 12,
    "damage-s": 2, "damage-m": 2, "damage-l": 0, "size": 1, "heat": 0, "armor-start": 4, "structure-start": 4,
} );

// A Missile Boat style column: target an enemy the unit cannot see (#591).
const missileBoat = (): IAcesCard => ( {
    ...JSON.parse( JSON.stringify( acesSampleSniper475 ) ),
    aggressive: { ...newAcesBehaviorColumn(), condition: "If first", zoneKeyword: "any", targetNoLOS: true },
} );

const renderReader = ( card: IAcesCard ) => render(
    <AcesCardReader
        phase="movement"
        card={card}
        commandCard={acesSampleMechWarriorC}
        unit={{ name: "Longbow", isBattleMech: true, canJump: false, canIndirectFire: true, ovRating: 0, currentHeat: 0, fireControlHits: 0 }}
        enemies={[ { id: "locust", name: "Locust", stats: stats( 2 ) }, { id: "phawk", name: "Phoenix Hawk", stats: stats( 4 ) } ]}
        resetKey="t"
    />,
);

describe("Aces line-of-sight target filters (#591)", () => {
    it("shows the [los] and [nolos] chips on a card column", () => {
        render( <AcesColumnView title="Aggressive" column={{ ...newAcesBehaviorColumn(), targetInLOS: true, targetNoLOS: true }} /> );
        expect( document.body.textContent ).toContain( "👁 in line of sight" );
        expect( document.body.textContent ).toContain( "⊘ out of line of sight" );
    });

    it("lists the line-of-sight chips before moved, as the cards print them (Rekikire)", () => {
        render( <AcesColumnView title="Aggressive" column={{ ...newAcesBehaviorColumn(), targetInAttackRange: true, targetMoved: true, targetInLOS: true, targetNoLOS: true }} /> );
        const text = document.body.textContent || "";
        expect( text.indexOf( "👁 in line of sight" ) ).toBeLessThan( text.indexOf( "✔ moved" ) );
        expect( text.indexOf( "⊘ out of line of sight" ) ).toBeLessThan( text.indexOf( "✔ moved" ) );
    });

    it("asks about line of sight before moved in the card reader", () => {
        renderReader( missileBoat() );
        const headers = Array.from( document.querySelectorAll( ".aces-reader-candidates th" ) ).map( ( th ) => th.textContent );
        expect( headers.indexOf( "In line of sight" ) ).toBeLessThan( headers.indexOf( "Moved" ) );
    });

    it("asks which enemies are in line of sight and targets one out of it", () => {
        renderReader( missileBoat() );
        fireEvent.click( screen.getByText( "True" ) );
        expect( screen.getByText( "Go to the next column" ) ).toBeTruthy();
        fireEvent.click( screen.getByLabelText( "Line of sight to Locust" ) );
        expect( screen.getByText( "Movement target: Locust" ) ).toBeTruthy();
    });

    // Rekikire: the Missile Boat card's "no enemies in [los]: use indirect fire special order card" line, as a tick.
    it("reminds the player of the Indirect Fire special order card when the card has the line", () => {
        const card: IAcesCard = { ...missileBoat(), combat: { ...acesSampleSniper475.combat, indirectIfNoLOS: true } };
        render(
            <AcesCardReader phase="combat" card={card} commandCard={acesSampleMechWarriorC} resetKey="t" enemies={[]}
                unit={{ name: "Longbow", isBattleMech: true, canJump: false, canIndirectFire: true, ovRating: 0, currentHeat: 0, fireControlHits: 0 }} />,
        );
        expect( screen.getByText( "Indirect fire" ) ).toBeTruthy();
        expect( document.body.textContent ).toContain( "use the Indirect Fire special order card" );
    });

    it("leaves the line-of-sight column out for a card without the filters", () => {
        renderReader( acesSampleSniper475 );
        expect( screen.queryByLabelText( "Line of sight to Locust" ) ).toBeNull();
    });
});
