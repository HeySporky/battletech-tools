import { describe, expect, it } from "vitest";
import { AlphaStrikeUnit } from "../alpha-strike-unit";
import { BattleMech } from "../battlemech";
import { refreshForceUnit, snapshotAlphaStrikeUnit, snapshotBattleMech } from "./campaign-force";

const buildMech = ( tons: number ): BattleMech => {
    const mech = new BattleMech();
    mech.setName( "Campaigner" );
    mech.setModel( "CMP-1" );
    mech.setTonnage( tons );
    mech.addEquipmentFromTag( "lrm-5", "is", "rt", false, undefined, "", false, [], undefined, undefined );
    return mech;
};

describe( "Campaign force snapshots", () => {
    it( "snapshots a 'Mech's cost, BV and PV", () => {
        const mech = buildMech( 50 );
        const unit = snapshotBattleMech( mech, "side-a" );
        expect( unit.kind ).toBe( "battlemech" );
        expect( unit.sideId ).toBe( "side-a" );
        expect( unit.savedId ).toBe( mech.getUUID() );
        expect( unit.name ).toBe( "Campaigner CMP-1" );
        expect( unit.cost ).toBe( mech.getCBillCostNumeric() );
        expect( unit.bv ).toBe( mech.getBattleValue() );
        expect( unit.pv ).toBe( mech.getAlphaStrikeValue() );
        expect( unit.cost ).toBeGreaterThan( 0 );
        expect( unit.bv ).toBeGreaterThan( 0 );
    } );

    it( "keeps playing from the snapshot when the saved 'Mech is gone", () => {
        let mech: BattleMech | null = buildMech( 50 );
        const unit = snapshotBattleMech( mech, "side-a" );
        const cost = mech.getCBillCostNumeric();
        mech = null;
        const rebuilt = new BattleMech( JSON.stringify( JSON.parse( JSON.stringify( unit ) ).snapshot ) );
        expect( rebuilt.getChassisName() ).toBe( "Campaigner" );
        expect( rebuilt.getCBillCostNumeric() ).toBe( cost );
    } );

    it( "refresh replaces figures but keeps status", () => {
        const mech = buildMech( 50 );
        const unit = { ...snapshotBattleMech( mech, "side-a" ), status: "Damaged" };
        mech.setTonnage( 75 );
        const refreshed = refreshForceUnit( unit, mech );
        expect( refreshed.id ).toBe( unit.id );
        expect( refreshed.sideId ).toBe( "side-a" );
        expect( refreshed.status ).toBe( "Damaged" );
        expect( refreshed.cost ).toBe( mech.getCBillCostNumeric() );
        expect( refreshed.cost ).not.toBe( unit.cost );
    } );

    it( "snapshots an Alpha Strike unit", () => {
        const as = new AlphaStrikeUnit();
        as.name = "Atlas";
        as.variant = "AS7-D";
        as.costCR = 9626000;
        as.basePoints = 52;
        as.currentPoints = 52;
        const unit = snapshotAlphaStrikeUnit( as, "side-b" );
        expect( unit.kind ).toBe( "alpha-strike" );
        expect( unit.savedId ).toBe( as.uuid );
        expect( unit.name ).toBe( "Atlas AS7-D" );
        expect( unit.cost ).toBe( 9626000 );
        expect( unit.pv ).toBe( 52 );
        expect( unit.bv ).toBeNull();
        const restored = new AlphaStrikeUnit();
        restored.importUnit( unit.snapshot as never );
        expect( restored.name ).toBe( "Atlas" );
    } );
} );
