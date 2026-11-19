// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IASMULUnit } from "../../../../classes/alpha-strike-unit";
import AcesAddAutomatedUnits from "./_add-automated-units";

const searchMock = vi.hoisted( () => vi.fn() );
vi.mock( "../../../../utils", async ( importOriginal ) => ( {
    ...( await importOriginal<Record<string, unknown>>() ),
    searchBundledMUL: searchMock,
} ) );

afterEach( cleanup );

const record = ( name: string, id: number ): IASMULUnit => ( {
    Id: id, Name: name, Class: "Emplacement", Variant: "", BFType: "BM", BFPointValue: 12,
} as unknown as IASMULUnit );

describe( "AcesAddAutomatedUnits", () => {
    beforeEach( () => { searchMock.mockReset(); } );

    it( "lists a match and calls onAdd with the record, skill and group", async () => {
        const hit = record( "Heavy Emplacement AC/20", 1 );
        searchMock.mockResolvedValue( [ hit ] );
        const onAdd = vi.fn();
        render( <AcesAddAutomatedUnits groups={[ "Group A" ]} onAdd={onAdd} /> );
        fireEvent.change( screen.getByLabelText( "Search the MUL" ), { target: { value: "Heavy Emplacement" } } );
        fireEvent.click( screen.getByRole( "button", { name: "Search" } ) );
        await screen.findByText( /Heavy Emplacement AC\/20/ );
        fireEvent.change( screen.getByLabelText( "Skill" ), { target: { value: "4" } } );
        fireEvent.click( screen.getByRole( "button", { name: /^Add/ } ) );
        expect( onAdd ).toHaveBeenCalledWith( hit, 4, 0 );
    } );

    it( "lists at most 20 results", async () => {
        searchMock.mockResolvedValue( Array.from( { length: 30 }, ( _, i ) => record( "Made Up " + i, i ) ) );
        render( <AcesAddAutomatedUnits groups={[ "Group A" ]} onAdd={vi.fn()} /> );
        fireEvent.change( screen.getByLabelText( "Search the MUL" ), { target: { value: "Made" } } );
        fireEvent.click( screen.getByRole( "button", { name: "Search" } ) );
        await waitFor( () => expect( screen.getAllByRole( "button", { name: /^Add/ } ) ).toHaveLength( 20 ) );
    } );

    it( "lists nothing and shows no error for an empty search", async () => {
        render( <AcesAddAutomatedUnits groups={[ "Group A" ]} onAdd={vi.fn()} /> );
        fireEvent.click( screen.getByRole( "button", { name: "Search" } ) );
        expect( screen.queryAllByRole( "button", { name: /^Add/ } ) ).toHaveLength( 0 );
        expect( screen.queryByRole( "alert" ) ).toBeNull();
        expect( searchMock ).not.toHaveBeenCalled();
    } );
} );
