import { useCallback, useEffect, useRef, useState } from "react";
import { Campaign } from "../../../../classes/campaign/campaign";
import { ICampaignExport } from "../../../../classes/campaign/campaign-types";
import { getCampaigns, saveCampaigns } from "../../../../dataSaves";
import { IAppGlobals } from "../../../app-router";

export const formatMoney = ( amount: number ): string => amount.toLocaleString( "en-US" );

/** The campaign screens' dice; tests replace roll2d6 and roll1d6. */
export const campaignDice = {
    roll2d6: (): number => 2 + Math.floor( Math.random() * 6 ) + Math.floor( Math.random() * 6 ),
    roll1d6: (): number => 1 + Math.floor( Math.random() * 6 ),
};

/** The campaign dice as a unit edition takes them; read at roll time so a test's replacement is used. */
export const campaignRoll = { d6: () => campaignDice.roll1d6(), twoD6: () => campaignDice.roll2d6() };

/**
 * Every saved campaign, and a save that writes the whole list (as the Aces campaign page does). `latest` always
 * holds the newest list, so a save made after an await builds on what is there now, not on an older render.
 */
export function useCampaigns( appGlobals: IAppGlobals ) {
    const [campaigns, setCampaigns] = useState<ICampaignExport[] | null>( null );
    const latest = useRef<ICampaignExport[] | null>( null );
    useEffect( () => {
        let live = true;
        getCampaigns( appGlobals.appSettings ).then( ( list ) => {
            if( !live ) return;
            latest.current = list;
            setCampaigns( list );
        } );
        return () => { live = false; };
    }, [appGlobals.appSettings] );
    const saveAll = useCallback( ( next: ICampaignExport[] ) => {
        latest.current = next;
        setCampaigns( next );
        saveCampaigns( appGlobals.appSettings, next );
    }, [appGlobals.appSettings] );
    return { campaigns, saveAll, latest };
}

/**
 * A stored campaign as the class, or why it cannot be read (a newer version's save, oversized edition data, a
 * hand-edited file). Restore already refuses these; one already in storage must not crash the page.
 */
export function readCampaign( data: ICampaignExport ): { campaign: Campaign | null; error: string | null } {
    try {
        return { campaign: new Campaign( data ), error: null };
    }
    catch( e ) {
        return { campaign: null, error: e instanceof Error ? e.message : String( e ) };
    }
}

/** One campaign by id; update() changes the newest copy through the class and saves it at once. */
export function useCampaign( appGlobals: IAppGlobals, id: string | undefined ) {
    const { campaigns, saveAll, latest } = useCampaigns( appGlobals );
    const data = campaigns?.find( ( c ) => c.id === id ) ?? null;
    const { campaign, error } = data ? readCampaign( data ) : { campaign: null, error: null };
    const update = ( change: ( c: Campaign ) => void ) => {
        const list = latest.current;
        const current = list?.find( ( c ) => c.id === id );
        if( !list || !current ) return;
        const next = readCampaign( current ).campaign;
        if( !next ) return;
        change( next );
        saveAll( list.map( ( c ) => ( c.id === next.id ? next.export() : c ) ) );
    };
    return { loaded: campaigns !== null, campaign, error, update };
}
