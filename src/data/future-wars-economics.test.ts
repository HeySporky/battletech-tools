import { describe, expect, it } from "vitest";
import { ICampaignArea, ICampaignSide, ICustomDotType } from "../classes/campaign/campaign-types";
import {
    FW_DOT_TYPES,
    FW_DOT_VALUE,
    FW_PAYDAY_MONTHS,
    FW_PRINTED_COMBINATIONS,
    getBestAreaIncome,
    getPayday,
    IFwCombination,
} from "./future-wars-economics";

let dotCount = 0;
const area = ( types: string[], extra: Partial<ICampaignArea> = {} ): ICampaignArea => ( {
    id: "area-" + ( ++dotCount ),
    name: "Area " + dotCount,
    terrain: "",
    controllerSideId: "a",
    dots: types.map( ( type, i ) => ( { id: `d${dotCount}-${i}`, type, destroyed: false } ) ),
    comboOverride: null,
    ...extra,
} );
const income = ( a: ICampaignArea, combos: IFwCombination[] = FW_PRINTED_COMBINATIONS, custom: ICustomDotType[] = [] ) =>
    getBestAreaIncome( a, combos, custom ).total;

describe( "Future Wars Economics (merged printings)", () => {
    it( "lists the dot types and the printed figures", () => {
        expect( FW_DOT_TYPES.map( ( t ) => t.id ) ).toEqual( ["light-manufacturing", "heavy-manufacturing", "mining",
            "radioactive-materials", "oil", "food", "refining", "processing"] );
        expect( FW_DOT_VALUE ).toBe( 1000000 );
        expect( FW_PAYDAY_MONTHS ).toBe( 3 );
    } );

    it( "pays a million a loose dot", () => {
        expect( income( area( ["food", "oil", "light-manufacturing"] ) ) ).toBe( 3000000 );
    } );

    it( "pays the printed combinations", () => {
        expect( income( area( ["mining", "refining", "heavy-manufacturing"] ) ) ).toBe( 7000000 );
        expect( income( area( ["food", "food", "processing"] ) ) ).toBe( 6000000 );
        expect( income( area( ["oil", "refining", "processing"] ) ) ).toBe( 12000000 );
    } );

    it( "picks the grouping that pays most", () => {
        const result = getBestAreaIncome( area( ["mining", "refining", "heavy-manufacturing", "oil", "processing"] ), FW_PRINTED_COMBINATIONS, [] );
        expect( result.total ).toBe( 14000000 );
        expect( result.used.map( ( u ) => u.comboId ) ).toEqual( ["oil-refining-processing"] );
        expect( result.loose ).toHaveLength( 2 );
    } );

    it( "a dot sits in one combination only", () => {
        expect( income( area( ["food", "food", "food", "food", "processing"] ) ) ).toBe( 6000000 + 2000000 );
    } );

    it( "destroyed dots pay nothing and join no combination", () => {
        const a = area( ["oil", "refining", "processing"] );
        a.dots[1].destroyed = true;
        const result = getBestAreaIncome( a, FW_PRINTED_COMBINATIONS, [] );
        expect( result.total ).toBe( 2000000 );
        expect( result.used ).toEqual( [] );
        expect( result.loose ).not.toContain( a.dots[1].id );
    } );

    it( "a GM combination pays double or triple", () => {
        const gm = ( multiplier: 2 | 3 ): IFwCombination => ( { id: "gm", name: "Twin plants", needs: { "light-manufacturing": 2 }, pays: { multiplier }, source: "GM" } );
        expect( income( area( ["light-manufacturing", "light-manufacturing"] ), [gm( 2 )] ) ).toBe( 4000000 );
        expect( income( area( ["light-manufacturing", "light-manufacturing"] ), [gm( 3 )] ) ).toBe( 6000000 );
    } );

    it( "custom dot types pay their own value", () => {
        const custom: ICustomDotType[] = [ { id: "spice", name: "Spice", value: 2500000, target: 8 } ];
        expect( income( area( ["spice", "food"] ), FW_PRINTED_COMBINATIONS, custom ) ).toBe( 3500000 );
        const gm: IFwCombination = { id: "gm", name: "Spice trade", needs: { spice: 1, processing: 1 }, pays: { multiplier: 2 }, source: "GM" };
        expect( income( area( ["spice", "processing"] ), [gm], custom ) ).toBe( 7000000 );
    } );

    it( "the GM's grouping overrides the best one", () => {
        const five = ["mining", "refining", "heavy-manufacturing", "oil", "processing"];
        expect( income( area( five, { comboOverride: ["mining-refining-heavy"] } ) ) ).toBe( 9000000 );
        const broken = area( five, { comboOverride: ["mining-refining-heavy", "food-processing"] } );
        broken.dots[0].destroyed = true; // mining gone: neither override fits; all loose
        expect( income( broken ) ).toBe( 4000000 );
    } );

    it( "payday goes to each area's controller; no controller pays no one", () => {
        const sides: ICampaignSide[] = [ { id: "a", name: "Lyrans", role: "defender" }, { id: "b", name: "Raiders", role: "attacker" }, { id: "c", name: "Idle", role: "other" } ];
        const areas = [
            area( ["food"], { name: "Farms" } ),
            area( ["oil", "refining", "processing"], { name: "Oilfield" } ),
            area( ["mining"], { name: "Mine", controllerSideId: "b" } ),
            area( ["heavy-manufacturing"], { name: "Wasteland", controllerSideId: null } ),
        ];
        const entries = getPayday( areas, sides, FW_PRINTED_COMBINATIONS, [], 3 );
        expect( entries.map( ( e ) => [e.sideId, e.amount] ) ).toEqual( [["a", 13000000], ["b", 1000000]] );
        expect( entries[0] ).toMatchObject( { step: 3, currency: "C-bills", rule: "fw-economics" } );
        expect( entries[0].reason ).toContain( "Farms" );
        expect( entries[0].reason ).toContain( "Oilfield" );
    } );
} );
