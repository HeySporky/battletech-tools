import React, { type JSX } from 'react';
import { TRADEMARK_NOTICE } from './svg/record-sheet-svg-kit';

/**
 * The record sheets' trademark notice as paragraphs: for the footer of a printed page of sheets or cards, or, with
 * subject "site", for the About page.
 */
const TrademarkNoticeParagraphs = (props: { subject?: "sheet" | "site" }): JSX.Element => (
    <>
        {TRADEMARK_NOTICE(new Date().getFullYear()).map((line) => <p key={line}>{line}</p>)}
        <p>This {props.subject ?? "sheet"} is not published or endorsed by The Topps Company, Inc. or Catalyst Game Labs.</p>
    </>
);

export default TrademarkNoticeParagraphs;
