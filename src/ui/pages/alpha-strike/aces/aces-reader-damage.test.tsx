// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IAcesUnitStats } from "../../../../classes/aces-engine";
import { acesSampleMechWarriorC, acesSampleSniper475 } from "../../../../data/aces-card-samples";
import AcesCardReader from "./_card-reader";

afterEach( cleanup );

const stats: IAcesUnitStats = {
    "armor": 2, "structure": 2, "armor-lost": 0, "structure-lost": 0, "tmm": 2, "pv": 20, "mv": 12,
    "damage-s": 2, "damage-m": 2, "damage-l": 0, "size": 1, "heat": 0, "armor-start": 4, "structure-start": 4,
};

const renderCombat = () => render(
    <AcesCardReader
        phase="combat"
        card={acesSampleSniper475}
        commandCard={acesSampleMechWarriorC}
        unit={{
            name: "Longbow", isBattleMech: true, canJump: false, canIndirectFire: false, ovRating: 0, currentHeat: 0, fireControlHits: 0,
            damage: { short: 3, medium: 5, long: 2, extreme: 0 },
        }}
        enemies={[ { id: "locust", name: "Locust", stats: stats } ]}
        resetKey="t"
    />,
);

const damageInput = (): HTMLInputElement => screen.getByLabelText( /Damage at this range/ ) as HTMLInputElement;

describe("Aces reader damage at range (#630)", () => {
    it("fills the damage from the unit values at the distance entered for the target", () => {
        renderCombat();
        fireEvent.change( screen.getByLabelText( "Distance to Locust" ), { target: { value: "4" } } );
        expect( damageInput().value ).toBe( "3" );
        fireEvent.change( screen.getByLabelText( "Distance to Locust" ), { target: { value: "12" } } );
        expect( damageInput().value ).toBe( "5" );
        fireEvent.change( screen.getByLabelText( "Distance to Locust" ), { target: { value: "30" } } );
        expect( damageInput().value ).toBe( "2" );
    });

    it("lets a typed number override the worked-out damage", () => {
        renderCombat();
        fireEvent.change( screen.getByLabelText( "Distance to Locust" ), { target: { value: "12" } } );
        fireEvent.change( damageInput(), { target: { value: "7" } } );
        expect( damageInput().value ).toBe( "7" );
    });
});
