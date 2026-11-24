import React, { type JSX } from 'react';
import { getRulesetCredits, getRulesetsAttribution } from '../../data/special-rulesets';

// The credit every sheet, card, TRO and printout gives the Special Rulesets a unit was built under (#324). Pass the
// unit's saved rulesets (getUnitRulesets, call 11); with none, nothing is drawn.

/** The credit as a paragraph, each source linked when it has an address: for the TRO sheet and the HTML cards. */
export function RulesetsAttribution(props: { rulesets: readonly string[]; className?: string }): JSX.Element | null {
    if (props.rulesets.length === 0) {
        return null;
    }
    return (
        <p data-testid="rulesets-attribution" className={props.className}>
            <strong>Special Rulesets:</strong>{" "}
            {getRulesetCredits(props.rulesets).map(({ name, source }, index) => (
                <React.Fragment key={index}>
                    {index > 0 ? "; " : null}
                    {name}
                    {source ? <>, {source.url ? <a href={source.url} rel="noopener noreferrer" target="_blank">{source.title}</a> : source.title}</> : null}
                    {source?.url ? <span className="d-none d-print-inline"> ({source.url})</span> : null}
                </React.Fragment>
            ))}
        </p>
    );
}

interface IRulesetsAttributionSvgOptions {
    size?: number;
    anchor?: "start" | "end";
    fill?: string;
    /** The room the line has; a longer line is squeezed to fit. */
    maxWidth?: number;
    transform?: string;
}

/** The credit as one line of SVG text, for the record sheets and the SVG cards. */
export function rulesetsAttributionSvg(x: number, y: number, rulesets: readonly string[], options: IRulesetsAttributionSvgOptions = {}): JSX.Element | null {
    const line = getRulesetsAttribution(rulesets);
    if (!line) {
        return null;
    }
    const size = options.size ?? 15;
    // About 0.55 em a character in sans-serif.
    const squeeze = options.maxWidth !== undefined && line.length * size * 0.55 > options.maxWidth;
    return (
        <text data-testid="rulesets-attribution" x={x} y={y} fontFamily="sans-serif" fontSize={size} textAnchor={options.anchor ?? "start"}
            fill={options.fill ?? "rgb(0,0,0)"} transform={options.transform}
            textLength={squeeze ? options.maxWidth : undefined} lengthAdjust={squeeze ? "spacingAndGlyphs" : undefined}
        >{line}</text>
    );
}
