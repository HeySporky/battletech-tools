// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AcesSupportCards from "./_support-cards";

afterEach( cleanup );

const cards = [
    { id: "a", name: "Made Up Strike", spentTurn: null },
    { id: "b", name: "Made Up Barrage", spentTurn: null },
    { id: "c", name: "Made Up Volley", spentTurn: 2 },
];

describe( "AcesSupportCards", () => {
    it( "disables ticking past the limit and spends the ticked cards", () => {
        const onSpend = vi.fn();
        render( <AcesSupportCards cards={cards} limit={1} onlyIfStructure={false} onSpend={onSpend} onAdd={vi.fn()} onRemove={vi.fn()} /> );
        const first = screen.getByLabelText( "Made Up Strike" ) as HTMLInputElement;
        const second = screen.getByLabelText( "Made Up Barrage" ) as HTMLInputElement;
        fireEvent.click( first );
        expect( second.disabled ).toBe( true );
        fireEvent.click( screen.getByRole( "button", { name: "Spend selected" } ) );
        expect( onSpend ).toHaveBeenCalledWith( [ "a" ] );
    } );

    it( "shows spent cards with their turn and no checkbox", () => {
        render( <AcesSupportCards cards={cards} limit={null} onlyIfStructure={false} onSpend={vi.fn()} onAdd={vi.fn()} onRemove={vi.fn()} /> );
        expect( screen.queryByLabelText( "Made Up Volley" ) ).toBeNull();
        expect( screen.getByText( /Made Up Volley/ ).textContent ).toContain( "turn 2" );
    } );

    it( "keeps the structure reminder beside the list", () => {
        render( <AcesSupportCards cards={cards} limit={null} onlyIfStructure={true} onSpend={vi.fn()} onAdd={vi.fn()} onRemove={vi.fn()} /> );
        expect( screen.getByText( /gets through the target's armor/ ) ).toBeTruthy();
    } );

    it( "adds and removes a card", () => {
        const onAdd = vi.fn();
        const onRemove = vi.fn();
        render( <AcesSupportCards cards={cards} limit={null} onlyIfStructure={false} onSpend={vi.fn()} onAdd={onAdd} onRemove={onRemove} /> );
        fireEvent.change( screen.getByLabelText( "Card name" ), { target: { value: "Made Up Smoke" } } );
        fireEvent.click( screen.getByRole( "button", { name: "Add card" } ) );
        expect( onAdd ).toHaveBeenCalledWith( "Made Up Smoke" );
        fireEvent.click( screen.getByRole( "button", { name: "Remove Made Up Strike" } ) );
        expect( onRemove ).toHaveBeenCalledWith( "a" );
    } );
} );
