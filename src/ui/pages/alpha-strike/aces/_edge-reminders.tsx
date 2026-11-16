import React, { type JSX } from 'react';
import { TAcesPhase } from '../../../../classes/aces-game';
import { acesEdgeCardForName, IAcesEdgeCard, TAcesEdgeTrigger } from '../../../../data/aces-cards';

/** The least a reminder needs from a Named Pilot; an AcesNamedPilot or its export both fit. */
export interface IAcesEdgeReminderPilot {
    callsign: string;
    killed: boolean;
    edgeAbilities: string[];
}

/** One short hint per trigger, in our own words. "none" and "other" have none. */
export const acesEdgeTriggerHints: { [trigger in TAcesEdgeTrigger]: string } = {
    "none": "",
    "moving": "when the unit moves",
    "attacking": "when the unit attacks",
    "attacked": "when the unit is attacked",
    "critical-hit": "when the unit takes a critical hit",
    "enemy-rear": "if the unit is in an enemy's rear arc",
    "damaged": "when the unit takes damage",
    "other": "",
};

/**
 * The Edge abilities of living pilots that apply in a phase. Game phases and card phases share names, and a card
 * phase of "any" applies to all of them. A name with no entered card gives nothing (sample cards count as entered).
 */
export const getAcesEdgeReminders = ( pilots: IAcesEdgeReminderPilot[], cards: IAcesEdgeCard[], phase: TAcesPhase ): { pilot: string; card: IAcesEdgeCard }[] => {
    const reminders: { pilot: string; card: IAcesEdgeCard }[] = [];
    for( const pilot of pilots ) {
        if( pilot.killed ) continue;
        for( const name of pilot.edgeAbilities ) {
            const card = acesEdgeCardForName( cards, name );
            if( card && ( card.phase === "any" || card.phase === phase ) ) {
                reminders.push( { pilot: pilot.callsign || "Unnamed pilot", card } );
            }
        }
    }
    return reminders;
}

/** The reminders for a game: null when the game has no linked campaign, or the campaign is not found. */
export const getAcesGameEdgeReminders = (
    campaignId: string,
    campaigns: { id: string, pilots: IAcesEdgeReminderPilot[] }[],
    cards: IAcesEdgeCard[],
    phase: TAcesPhase,
): { pilot: string; card: IAcesEdgeCard }[] | null => {
    if( !campaignId ) return null;
    const campaign = campaigns.find( ( item ) => item.id === campaignId );
    if( !campaign ) return null;
    return getAcesEdgeReminders( campaign.pilots, cards, phase );
}

interface IAcesEdgeRemindersProps {
    pilots: IAcesEdgeReminderPilot[];
    cards: IAcesEdgeCard[];
    phase: TAcesPhase;
}

/** Edge abilities the campaign's living Named Pilots can use in this phase; nothing when there are none. */
export default function AcesEdgeReminders( props: IAcesEdgeRemindersProps ): JSX.Element | null {
    const reminders = getAcesEdgeReminders( props.pilots, props.cards, props.phase );
    if( reminders.length === 0 ) return null;
    return <AcesEdgeReminderList reminders={reminders} />;
}

/** The list of reminders, already gathered for the phase. */
export function AcesEdgeReminderList( props: { reminders: { pilot: string; card: IAcesEdgeCard }[] } ): JSX.Element | null {
    const reminders = props.reminders;
    if( reminders.length === 0 ) return null;
    return (
        <div className="aces-edge-reminders">
            <h4>Edge abilities this phase</h4>
            <ul>
                {reminders.map( ( item, index ) => {
                    const hint = acesEdgeTriggerHints[ item.card.trigger ] || "";
                    return (
                        <li key={index}>
                            <strong>{item.pilot}</strong>: {item.card.name}
                            {item.card.cost !== null ? <> (cost {item.card.cost})</> : null}
                            {item.card.condition ? <> &mdash; {item.card.condition}</> : null}
                            {hint ? <> <em>({hint})</em></> : null}
                        </li>
                    );
                } )}
            </ul>
        </div>
    );
}
