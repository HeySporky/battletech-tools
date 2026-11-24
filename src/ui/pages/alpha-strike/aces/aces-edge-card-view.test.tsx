// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { newAcesEdgeCard } from "../../../../data/aces-cards";
import { AcesEdgeCardView } from "./_aces-card-view";

afterEach( cleanup );

describe("Aces Edge card view (print page)", () => {
    it("shows the name, cost, timing, condition and text the player entered", () => {
        const card = { ...newAcesEdgeCard(), name: "Kite Day", cardNumber: "E9", cost: 2, category: "Piloting", phase: "movement" as const, trigger: "moving" as const, condition: "If the wind is up.", text: "Fly a little higher." };
        render( <AcesEdgeCardView card={card} /> );
        expect( screen.getByText( "Kite Day" ) ).toBeTruthy();
        expect( screen.getByText( "2 Edge" ) ).toBeTruthy();
        expect( screen.getByText( "Piloting · Movement · Moving" ) ).toBeTruthy();
        expect( screen.getByText( "If the wind is up." ) ).toBeTruthy();
        expect( screen.getByText( "Fly a little higher." ) ).toBeTruthy();
    });

    it("leaves out the cost and timing when none are set", () => {
        const card = { ...newAcesEdgeCard(), name: "Teapot Luck", cost: null, phase: "any" as const, trigger: "none" as const };
        render( <AcesEdgeCardView card={card} /> );
        expect( screen.queryByText( /Edge$/ ) ).toBeNull();
        expect( screen.getByText( "Any phase" ) ).toBeTruthy();
    });
});
