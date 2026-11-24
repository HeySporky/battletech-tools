import { FW_PAYDAY_MONTHS, FW_PRINTED_COMBINATIONS, getPayday, IFwCombination } from "../../data/future-wars-economics";
import type { Campaign } from "./campaign";
import { ICampaignBattleResult, ICampaignPlanet } from "./campaign-types";

/** The printed combinations plus the GM's own on this planet. */
export const getPlanetCombinations = ( planet: ICampaignPlanet ): IFwCombination[] =>
    FW_PRINTED_COMBINATIONS.concat( ( planet.customCombinations || [] ).map( ( c ) => ( {
        id: c.id, name: c.name, needs: c.needs, pays: { multiplier: c.multiplier }, source: "GM",
    } ) ) );

/*
 * What each campaign ruleset does as the campaign moves on. Rolls a person makes (economic damage, partisans) are
 * made from the planet page, not here.
 */

export interface ICampaignRuleHooks {
    onStep?: ( campaign: Campaign ) => void;
    afterBattle?: ( campaign: Campaign, result: ICampaignBattleResult ) => void;
}

export const CAMPAIGN_RULE_HOOKS: Record<string, ICampaignRuleHooks> = {
    "fw-economics": {
        // Payday every three campaign months (Future Wars #5 p.5; Best of p.33), never at the start.
        onStep: ( campaign ) => {
            if( campaign.timeStep !== "month" || !campaign.planet ) return;
            if( campaign.step <= 0 || campaign.step % FW_PAYDAY_MONTHS !== 0 ) return;
            const entries = getPayday( campaign.planet.areas, campaign.sides, getPlanetCombinations( campaign.planet ), campaign.planet.customDotTypes, campaign.step );
            for( const entry of entries ) campaign.addLedger( entry );
            const total = entries.reduce( ( sum, e ) => sum + e.amount, 0 );
            campaign.addLog( entries.length > 0 ? `Payday: ${total.toLocaleString( "en-US" )} C-bills` : "Payday: no area paid" );
        },
    },
    "fw-economic-damage": {},
};
