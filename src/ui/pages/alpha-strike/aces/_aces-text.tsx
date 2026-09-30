import React, { type JSX } from 'react';
import { parseAcesText } from '../../../../data/aces-cards';

/** Card text with its bracket tokens drawn as icons; the rulebook meaning shows on hover. */
export default class AcesText extends React.Component<IAcesTextProps> {
    render = (): JSX.Element => {
        return (
            <span className="aces-text">
                {parseAcesText( this.props.text ).map( ( segment, index ) => segment.kind === "icon" ? (
                    <span
                        key={index}
                        className={"aces-icon aces-icon-" + segment.value.toLowerCase()}
                        title={segment.meaning}
                    >{segment.label}</span>
                ) : (
                    <React.Fragment key={index}>{segment.value}</React.Fragment>
                ) )}
            </span>
        );
    }
}

interface IAcesTextProps {
    text: string;
}
