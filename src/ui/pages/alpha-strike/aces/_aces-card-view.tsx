import React, { type JSX } from 'react';
import {
    acesBehaviorIds,
    acesTextToPlain,
    formatAcesZone,
    IAcesBehaviorColumn,
    IAcesCard,
    IAcesCommandCard,
    IAcesPriorityRule,
    IAcesScenario,
    IAcesSpecialOrder,
} from '../../../../data/aces-cards';
import { acesBehaviorLabel } from '../../../../classes/aces-engine';
import AcesText from './_aces-text';

/*
 * Read-only views of library records, used by the library editor, the card reader and the print page.
 */

const moveLabels: { [key: string]: string } = { ground: "Ground", sprint: "Sprint", jump: "Jump", standstill: "Standstill" };

const zoneText = ( rings: number[], keyword: "" | "nearest" | "any" ): string => {
    if( keyword ) return keyword === "nearest" ? "Nearest" : "Any";
    return rings.map( ( ring ) => ring + "\"" ).join( " " );
}

export const AcesRuleList = ( props: { rules: IAcesPriorityRule[], numbered?: boolean } ): JSX.Element | null => {
    if( props.rules.length === 0 ) return null;
    const items = props.rules.map( ( rule, index ) => (
        <li key={index} className={rule.unresolved ? "aces-muted" : ""}>
            <AcesText text={rule.text} />{rule.unresolved ? " (unreadable in the source)" : ""}
        </li>
    ) );
    return props.numbered === false ? <ul>{items}</ul> : <ol>{items}</ol>;
}

export const AcesColumnView = ( props: { title: string, column: IAcesBehaviorColumn } ): JSX.Element => {
    const column = props.column;
    const chips: string[] = [];
    if( column.targetInAttackRange ) chips.push( "⌖ in attack range" );
    if( column.targetMoved ) chips.push( "✔ moved" );
    if( column.targetSelect ) chips.push( column.targetSelect === "nearest" ? "nearest" : column.targetSelect.toUpperCase() + " list" );
    return (
        <div className="aces-card-column">
            <h5>{props.title}</h5>
            {column.condition ? <p className="aces-condition"><AcesText text={column.condition} /></p> : null}
            <p>
                <strong>Zone:</strong> {zoneText( column.zoneRings, column.zoneKeyword ) || "-"}
                {chips.length > 0 ? <> · {chips.join( ", " )}</> : null}
            </p>
            <p>
                <strong>Move:</strong> {moveLabels[column.moveType]}
                {column.altMoveType ? <> ({moveLabels[column.altMoveType]} <AcesText text={column.altMoveWhen} />)</> : null}
            </p>
            {column.filters.length > 0 ? (
                <ol>{column.filters.map( ( filter, index ) => <li key={index}><AcesText text={filter} /></li> )}</ol>
            ) : null}
        </div>
    );
}

export const AcesCardView = ( props: { card: IAcesCard } ): JSX.Element => {
    const card = props.card;
    return (
        <div className="aces-card-view">
            <div className="aces-card-head">
                <strong>{card.deck || "Deck?"}</strong> {card.cardNumber}
                <span className="aces-priority">{card.movePriority === null ? "---" : String( card.movePriority ).padStart( 3, "0" )}</span>
                {card.sample ? <span className="aces-muted"> sample</span> : null}
            </div>
            <div className="aces-card-columns">
                {acesBehaviorIds.map( ( behavior ) => (
                    <AcesColumnView key={behavior} title={acesBehaviorLabel( behavior )} column={card[behavior]} />
                ) )}
            </div>
            <div className="aces-card-combat">
                <h5>Combat <span className="aces-priority">{card.combatPriority === null ? "---" : String( card.combatPriority ).padStart( 3, "0" )}</span></h5>
                <p><strong>Zone:</strong> {zoneText( card.combat.zoneRings, card.combat.zoneKeyword ) || "-"}</p>
                <AcesRuleList rules={card.combat.filters} />
                {card.combat.overheat.length > 0 ? (
                    <>
                        <strong>Overheat</strong>
                        <ul>{card.combat.overheat.map( ( row, index ) => <li key={index}>{acesTextToPlain( row.text )}</li> )}</ul>
                    </>
                ) : null}
            </div>
            {card.source ? <p className="aces-muted">{card.source.book} p.{card.source.page}</p> : null}
            {card.notes ? <p className="aces-muted">{card.notes}</p> : null}
        </div>
    );
}

export const AcesCommandCardView = ( props: { card: IAcesCommandCard } ): JSX.Element => {
    const card = props.card;
    return (
        <div className="aces-card-view">
            <div className="aces-card-head">
                <strong>{card.deck || "Command deck?"}</strong> {card.faction ? "(" + card.faction + ")" : ""} {card.cardNumber}
                <span className="aces-priority">{card.letter}</span>
                {card.sample ? <span className="aces-muted"> sample</span> : null}
            </div>
            {card.orders.length > 0 ? (
                <ul>{card.orders.map( ( order, index ) => <li key={index}><em>{order.phase}:</em> <AcesText text={order.text} /></li> )}</ul>
            ) : null}
            <div className="aces-card-columns">
                <div className="aces-card-column aces-red"><h5>Red</h5><AcesRuleList rules={card.red} /></div>
                <div className="aces-card-column aces-yellow"><h5>Yellow</h5><AcesRuleList rules={card.yellow} /></div>
                <div className="aces-card-column aces-blue"><h5>Blue</h5><AcesRuleList rules={card.blue} /></div>
            </div>
            {card.supportOrders || card.emplacements.length > 0 || card.artillery.length > 0 || card.bsp.length > 0 ? (
                <div className="aces-card-columns">
                    {card.supportOrders ? <p className="aces-condition">{card.supportOrders}</p> : null}
                    {card.emplacements.length > 0 ? (
                        <div className="aces-card-column"><h5>Emplacements {formatAcesZone( card.emplacementZoneRings, "" ) ? "(" + zoneText( card.emplacementZoneRings, "" ) + ")" : ""}</h5><AcesRuleList rules={card.emplacements} /></div>
                    ) : null}
                    {card.artillery.length > 0 ? <div className="aces-card-column"><h5>Artillery</h5><AcesRuleList rules={card.artillery} /></div> : null}
                    {card.bsp.length > 0 ? <div className="aces-card-column"><h5>Battlefield Support</h5><AcesRuleList rules={card.bsp} /></div> : null}
                </div>
            ) : null}
            {card.strategy.length > 0 ? (
                <>
                    <strong>Strategy decisions</strong>
                    <ul>{card.strategy.map( ( row, index ) => <li key={index}><strong>{row.letter}</strong> <AcesText text={row.text} /></li> )}</ul>
                </>
            ) : null}
            {card.source ? <p className="aces-muted">{card.source.book} p.{card.source.page}</p> : null}
            {card.notes ? <p className="aces-muted">{card.notes}</p> : null}
        </div>
    );
}

export const AcesSpecialOrderView = ( props: { order: IAcesSpecialOrder } ): JSX.Element => {
    const order = props.order;
    return (
        <div className="aces-card-view">
            <div className="aces-card-head">
                <strong>{order.name || "Special Order?"}</strong> {order.cardNumber}
                {order.priority !== null ? <span className="aces-priority">{order.priorityIsModifier && order.priority > 0 ? "+" : ""}{order.priority}</span> : null}
                {order.sample ? <span className="aces-muted"> sample</span> : null}
            </div>
            {order.rules.length > 0 ? <ul>{order.rules.map( ( rule, index ) => <li key={index}><AcesText text={rule} /></li> )}</ul> : null}
            {order.column ? <AcesColumnView title={order.name} column={order.column} /> : null}
            {order.preFilters.length > 0 ? (
                <ol>{order.preFilters.map( ( filter, index ) => <li key={index}>0{"abcdefghij".charAt( index )}. <AcesText text={filter} /></li> )}</ol>
            ) : null}
            {order.spotter.length > 0 ? (
                <><strong>Spotter</strong><ol>{order.spotter.map( ( line, index ) => <li key={index}><AcesText text={line} /></li> )}</ol></>
            ) : null}
            {order.source ? <p className="aces-muted">{order.source.book} p.{order.source.page}</p> : null}
            {order.notes ? <p className="aces-muted">{order.notes}</p> : null}
        </div>
    );
}

export const AcesScenarioView = ( props: { scenario: IAcesScenario } ): JSX.Element => {
    const scenario = props.scenario;
    return (
        <div className="aces-card-view">
            <div className="aces-card-head">
                <strong>{scenario.code ? scenario.code + " - " : ""}{scenario.name || "Sortie?"}</strong>
                {scenario.campaign ? <> ({scenario.campaign})</> : null}
                {scenario.sample ? <span className="aces-muted"> sample</span> : null}
            </div>
            <p>
                Play area {scenario.playArea || "-"}
                {scenario.playerPVLimit !== null ? <> · player force up to {scenario.playerPVLimit} PV</> : null}
                {scenario.turnLimit !== null ? <> · {scenario.turnLimit} turns</> : null}
            </p>
            {scenario.playerUnits.length > 0 ? (
                <p><strong>Player units:</strong> {scenario.playerUnits.map( ( unit ) => unit.name + ( unit.skill !== null ? " (Skill " + unit.skill + ")" : "" ) ).join( ", " )}</p>
            ) : null}
            {scenario.playerUnitsNote ? <p className="aces-muted">{scenario.playerUnitsNote}</p> : null}
            <p>
                <strong>{scenario.opposingName || "Opposing force"}</strong>
                {scenario.opposingPV !== null ? <> ({scenario.opposingPV} PV)</> : null}
                {scenario.commandDeck ? <> · Command deck {scenario.commandDeck}, start on {scenario.commandStartCard}</> : null}
            </p>
            {scenario.opposingUnits.length > 0 ? (
                <ul>{scenario.opposingUnits.map( ( unit, index ) => (
                    <li key={index}>{unit.name}{unit.skill !== null ? " (Skill " + unit.skill + ")" : ""}{unit.deck ? " - " + unit.deck + " deck" : ""}</li>
                ) )}</ul>
            ) : null}
            {scenario.objectives.length > 0 ? (
                <>
                    <strong>Objectives</strong>
                    <ul>{scenario.objectives.map( ( objective, index ) => (
                        <li key={index}>{objective.kind === "secondary" ? "Secondary: " : "Primary: "}{objective.text}{objective.sp !== null ? " (" + objective.sp + " SP)" : ""}</li>
                    ) )}</ul>
                </>
            ) : null}
            {scenario.sortieEnd ? <p><strong>Sortie end:</strong> {scenario.sortieEnd}</p> : null}
            {scenario.reconnaissance ? <p><strong>Reconnaissance:</strong> {scenario.reconnaissance}</p> : null}
            {scenario.waypointSetup ? <p><strong>Waypoints:</strong> {scenario.waypointSetup}</p> : null}
            {scenario.waypoints.length > 0 ? (
                <ul>{scenario.waypoints.map( ( waypoint, index ) => <li key={index}>Turn {waypoint.turn}: {waypoint.label} {waypoint.text}</li> )}</ul>
            ) : null}
            {scenario.specialRules.length > 0 ? (
                <ul>{scenario.specialRules.map( ( rule, index ) => <li key={index}><em>{rule.phase}</em> {rule.name}: {rule.text}</li> )}</ul>
            ) : null}
            {scenario.deckOrder.length > 0 ? (
                <p><strong>Stacked decks:</strong> {scenario.deckOrder.map( ( order ) => order.deck + ": " + order.cards.join( ", " ) ).join( "; " )}</p>
            ) : null}
            {scenario.storyReference ? <p className="aces-muted">{scenario.storyReference}</p> : null}
            {scenario.source ? <p className="aces-muted">{scenario.source.book} p.{scenario.source.page}</p> : null}
            {scenario.notes ? <p className="aces-muted">{scenario.notes}</p> : null}
        </div>
    );
}
