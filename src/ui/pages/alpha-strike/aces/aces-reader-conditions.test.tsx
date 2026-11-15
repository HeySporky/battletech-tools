// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IAcesUnitStats } from "../../../../classes/aces-engine";
import { acesSampleBrawler383, acesSampleMechWarriorC } from "../../../../data/aces-card-samples";
import AcesCardReader from "./_card-reader";

afterEach( cleanup );

const stats: IAcesUnitStats = {
    "armor": 2, "structure": 2, "armor-lost": 0, "structure-lost": 0, "tmm": 2, "pv": 20, "mv": 12,
    "damage-s": 2, "damage-m": 2, "damage-l": 0, "size": 1, "heat": 0, "armor-start": 4, "structure-start": 4,
};

const unit = { name: "Longbow", isBattleMech: true, canJump: false, canIndirectFire: false, ovRating: 0, currentHeat: 0, fireControlHits: 0 };

// Brawler 383: Aggressive "any [moved] enemies in 12"", Balanced "at least 3 enemies in [los] and 24"".
const renderMovement = ( extra: { movedIds?: string[], onMovedChange?: ( id: string, moved: boolean ) => void } = {} ) => render(
    <AcesCardReader
        phase="movement"
        card={acesSampleBrawler383}
        commandCard={acesSampleMechWarriorC}
        unit={unit}
        enemies={[ { id: "locust", name: "Locust", stats: stats } ]}
        resetKey="t"
        {...extra}
    />,
);

describe("Aces reader answers Behavior conditions from the table data (#630 point 2)", () => {
    it("settles the condition without asking when nobody has moved, and flips when a close unit is marked moved", () => {
        renderMovement();
        expect( screen.queryByText( /^True$/ ) ).toBeNull();
        expect( screen.getByText( /Behavior: Cautious/ ) ).toBeTruthy();

        fireEvent.change( screen.getByLabelText( "Distance to Locust" ), { target: { value: "6" } } );
        fireEvent.click( screen.getByLabelText( "Locust moved" ) );
        expect( screen.getByText( /Behavior: Aggressive/ ) ).toBeTruthy();
        expect( screen.getByText( /Answered from the distances/ ) ).toBeTruthy();
    });

    it("still asks when the distance is not known", () => {
        renderMovement( { movedIds: [ "locust" ] } );
        expect( screen.getByText( "True" ) ).toBeTruthy();
        expect( screen.getByText( "False" ) ).toBeTruthy();
    });

    it("takes the moved marks from the game and reports a tick back to it", () => {
        const changed = vi.fn();
        renderMovement( { movedIds: [ "locust" ], onMovedChange: changed } );
        fireEvent.change( screen.getByLabelText( "Distance to Locust" ), { target: { value: "6" } } );
        expect( ( screen.getByLabelText( "Locust moved" ) as HTMLInputElement ).checked ).toBe( true );
        expect( screen.getByText( /Behavior: Aggressive/ ) ).toBeTruthy();
        fireEvent.click( screen.getByLabelText( "Locust moved" ) );
        expect( changed ).toHaveBeenCalledWith( "locust", false );
    });

    it("a button the players press beats the table answer", () => {
        renderMovement( { movedIds: [ "locust" ] } );
        fireEvent.click( screen.getByText( "False" ) );
        fireEvent.change( screen.getByLabelText( "Distance to Locust" ), { target: { value: "6" } } );
        expect( screen.getByText( /Behavior: Cautious/ ) ).toBeTruthy();
    });
});
