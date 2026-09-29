import React, { type JSX } from 'react';
import { getRulesLevelOptions } from '../../data/rules-level-options';

// Standard is tournament play; anything above it is stamped on the printout.
export const TOURNAMENT_RULES_LEVEL = 2;

export function getRulesLevelName(level: number): string {
    return getRulesLevelOptions().find(option => option.id === level)?.name ?? `Level ${level}`;
}

/** Highest known rules level among the units being printed (undefined when none is known). */
export function getHighestRulesLevel(levels: (number | undefined)[]): number | undefined {
    const known = levels.filter((level): level is number => typeof level === "number");
    return known.length ? Math.max(...known) : undefined;
}

/**
 * Guard against printing units above the selected rules level by mistake: asks for
 * confirmation and returns whether printing should go ahead.
 */
export function confirmRulesLevelPrint(required: number | undefined, selected: number): boolean {
    if (typeof required !== "number" || required <= selected) {
        return true;
    }
    return window.confirm(
        `This printout includes a unit that requires the ${getRulesLevelName(required)} rules level, but ${getRulesLevelName(selected)} is selected. It is not legal for ${getRulesLevelName(selected)} (or tournament) play. Print anyway?`
    );
}

export function printWithRulesLevelGuard(required: number | undefined, selected: number): void {
    if (confirmRulesLevelPrint(required, selected)) {
        window.print();
    }
}

/** Printed stamp for units above Standard (tournament) rules. */
export default class RulesLevelStamp extends React.Component<IRulesLevelStampProps> {
    render = (): JSX.Element | null => {
        const required = this.props.requiredRulesLevel;
        if (typeof required !== "number" || required <= TOURNAMENT_RULES_LEVEL) {
            return null;
        }
        return (
            <div className="print-rules-level-stamp text-center">
                <strong>Rules Level: {getRulesLevelName(required)}</strong> - not tournament legal
                {this.props.provisionalNote ? <> - {this.props.provisionalNote}</> : null}
            </div>
        );
    }
}

interface IRulesLevelStampProps {
    requiredRulesLevel?: number;
    provisionalNote?: string;
}
