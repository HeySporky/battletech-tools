import { AlphaStrikeUnit } from "../alpha-strike-unit";
import { BattleMech } from "../battlemech";
import { generateUUID } from "../../utils/generateUUID";
import { ICampaignForceUnit } from "./campaign-types";

/*
 * A campaign force unit is a reference to the saved unit plus a snapshot of it (NGCFells's builder's call 2): the
 * campaign plays from the snapshot, so deleting or editing the saved unit never breaks it; Refresh copies the saved
 * unit's figures in again.
 */

export type { ICampaignForceUnit };

const joinName = ( ...parts: ( string | undefined )[] ): string => parts.map( ( p ) => ( p || "" ).trim() ).filter( Boolean ).join( " " );

export const snapshotBattleMech = ( mech: BattleMech, sideId: string ): ICampaignForceUnit => {
    const snapshot = mech.export(); // also brings the cost, BV and Alpha Strike figures up to date
    return {
        id: generateUUID(),
        sideId,
        kind: "battlemech",
        savedId: mech.getUUID(),
        name: joinName( mech.getChassisName(), mech.getModelName() ),
        cost: mech.getCBillCostNumeric(),
        bv: mech.getBattleValue(),
        pv: mech.getAlphaStrikeValue(),
        snapshot: JSON.parse( JSON.stringify( snapshot ) ),
        status: "",
    };
}

export const snapshotAlphaStrikeUnit = ( unit: AlphaStrikeUnit, sideId: string ): ICampaignForceUnit => {
    return {
        id: generateUUID(),
        sideId,
        kind: "alpha-strike",
        savedId: unit.uuid,
        name: unit.customName || joinName( unit.name, unit.variant ),
        cost: unit.costCR || null,
        bv: null, // the Alpha Strike unit keeps no Battle Value
        pv: unit.currentPoints || unit.basePoints,
        snapshot: JSON.parse( JSON.stringify( unit.export() ) ),
        status: "",
    };
}

/** New figures and snapshot from the saved unit; keeps the campaign's id, side and status. */
export const refreshForceUnit = ( unit: ICampaignForceUnit, saved: BattleMech | AlphaStrikeUnit ): ICampaignForceUnit => {
    const fresh = saved instanceof BattleMech ? snapshotBattleMech( saved, unit.sideId ) : snapshotAlphaStrikeUnit( saved, unit.sideId );
    return { ...fresh, id: unit.id, sideId: unit.sideId, status: unit.status };
}
