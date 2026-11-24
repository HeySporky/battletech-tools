// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IAlphaStrikeScanResult } from "../../../../classes/alpha-strike-card-scan";
import { AlphaStrikeUnit, IASMULUnit } from "../../../../classes/alpha-strike-unit";
import { IAppGlobals } from "../../../app-router";
import { AppSettings } from "../../../classes/app_settings";
import ScanUnitCard from "./_ScanUnitCard";

const scanResult: { current: IAlphaStrikeScanResult } = { current: null as unknown as IAlphaStrikeScanResult };

vi.mock( "../../../../classes/card-scan-browser", () => ( {
    scanCardPhoto: vi.fn( async () => scanResult.current ),
} ) );

const thugMUL = {
    Id: 1, MulSource: "mul2", Name: "Thug", Variant: "THG-10E", Class: "BattleMech", BFType: "BM", BFSize: 4, BFTMM: 1, BFMove: "8\"",
    Role: { Id: 110, Name: "Brawler", Image: "", SortOrder: 0 }, BFDamageShort: 3, BFDamageMedium: 3, BFDamageLong: 2, BFDamageExtreme: 0,
    BFOverheat: 1, BFArmor: 8, BFStructure: 6, BFAbilities: "SRM 1/1", BFPointValue: 39, Skill: 4,
    Type: { Id: 18, Name: "BattleMech", Image: "", SortOrder: 0 }, Technology: { Id: 1, Name: "Inner Sphere", Image: "", SortOrder: 0 },
} as unknown as IASMULUnit;

vi.mock( "../../../../data/mul-list-items", async ( original ) => ( {
    ...( await original<typeof import( "../../../../data/mul-list-items" )>() ),
    loadMULListItems: vi.fn( async () => [ thugMUL ] ),
} ) );

const thugScan: IAlphaStrikeScanResult = {
    chassis: "Thug", model: "THG-10E", pv: "39", type: "BM", size: "4", tmm: "1", move: "8\"", role: "Brawler",
    short: "3", medium: "3", long: "2", extreme: "", overheat: "1", armor: "8", structure: "6", specials: "SRM 1/1",
};

afterEach( cleanup );

beforeEach( () => {
    URL.createObjectURL = vi.fn( () => "blob:photo" );
    URL.revokeObjectURL = vi.fn();
    scanResult.current = thugScan;
} );

const setup = () => {
    const added: AlphaStrikeUnit[] = [];
    const appGlobals = { appSettings: new AppSettings( null ), currentASForce: null } as unknown as IAppGlobals;
    const view = render( <ScanUnitCard appGlobals={appGlobals} addToGroup={( unit ) => added.push( unit )} /> );
    return { added, view };
}

const choosePhoto = async ( container: HTMLElement ) => {
    const input = container.querySelector( ".as-scan input[type=file]" ) as HTMLInputElement;
    await act( async () => {
        fireEvent.change( input, { target: { files: [ new File( [ "photo" ], "card.jpg", { type: "image/jpeg" } ) ] } } );
    } );
}

// Players with printed cards add a unit by photo: the MUL's unit when it agrees, the card as printed when it doesn't.
describe( "Alpha Strike roster: add from a card photo", () => {
    it( "adds the MUL unit when the card agrees with it", async () => {
        const { added, view } = setup();
        await choosePhoto( view.container );
        expect( screen.getByText( /Found on the MUL:/ ) ).toBeTruthy();
        expect( screen.getByText( "The card reader isn't perfect." ) ).toBeTruthy();
        fireEvent.click( screen.getByText( "Add Thug THG-10E" ) );
        expect( added.length ).toBe( 1 );
        expect( added[0].basePoints ).toBe( 39 );
        expect( added[0].isOfficial() ).toBe( true );
    } );

    it( "shows a differing printing beside the MUL and adds whichever is chosen", async () => {
        scanResult.current = { ...thugScan, pv: "41" };
        const { added, view } = setup();
        await choosePhoto( view.container );
        expect( screen.getByText( /with different values/ ) ).toBeTruthy();
        expect( screen.getByText( "41" ) ).toBeTruthy();
        const printed = screen.getByText( "Use the card as printed" ) as HTMLButtonElement;
        expect( printed.disabled ).toBe( true );
        fireEvent.click( screen.getByLabelText( /checked these against the card/ ) );
        fireEvent.click( printed );
        expect( added[0].basePoints ).toBe( 41 );
        expect( added[0].isOfficial() ).toBe( false );
        fireEvent.click( screen.getByText( "Use the MUL's" ) );
        expect( added[1].basePoints ).toBe( 39 );
        expect( added[1].isOfficial() ).toBe( true );
    } );

    it( "adds a card the MUL doesn't list as printed, after it's checked and edited", async () => {
        scanResult.current = { ...thugScan, chassis: "Dragon Fire", model: "DRG-9D", pv: "44" };
        const { added, view } = setup();
        await choosePhoto( view.container );
        expect( screen.getByText( /Not on the MUL/ ) ).toBeTruthy();
        const add = screen.getByText( "Add as printed" ) as HTMLButtonElement;
        expect( add.disabled ).toBe( true );
        fireEvent.change( screen.getByLabelText( /^PV/ ), { target: { value: "45" } } );
        fireEvent.click( screen.getByLabelText( /checked these against the card/ ) );
        fireEvent.click( add );
        expect( added[0].name ).toContain( "Dragon Fire" );
        expect( added[0].basePoints ).toBe( 45 );
    } );

    it( "says so when the photo isn't a unit card", async () => {
        scanResult.current = { ...thugScan, chassis: "", type: "", size: "" };
        const { view } = setup();
        await choosePhoto( view.container );
        expect( screen.getByText( /doesn't read as the front of a unit card/ ) ).toBeTruthy();
    } );
} );
