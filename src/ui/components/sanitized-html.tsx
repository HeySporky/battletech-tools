import * as React from 'react';
import sanitizeHtml from 'sanitize-html';
import DOMPurify from 'dompurify';
import type { JSX } from "react";

// SVG text (tspans) is only SVG inside an <svg>: purified in one, then unwrapped.
function purifySVGText( html: string ): string {
    const purified = DOMPurify.sanitize( "<svg>" + html + "</svg>", { USE_PROFILES: { svg: true } } );
    return purified.replace( /^<svg[^>]*>/, "" ).replace( /<\/svg>$/, "" );
}

export default class SanitizedHTML extends React.Component<ISanitizedHTMLProps, ISanitizedHTMLState> {

    // For the SanitizeHTML function/module docs go here:
    // https://www.npmjs.com/package/sanitize-html

    render = (): JSX.Element => {

        // Raw sites (TRO text, BV and cost logs, sheet text) take any markup the app writes, but they are built from
        // unit data and imported files bring their own names, so DOMPurify still takes out script and event
        // handlers (#215). The normal path below keeps its strict whitelist.
        if( this.props.raw ) {
            if( this.props.svg ) {
                return (
                    <text
                        dangerouslySetInnerHTML={
                            {
                                __html: purifySVGText( this.props.html )
                            }
                        }
                    ></text>
                )
            } else {
                return (
                    <span
                        dangerouslySetInnerHTML={
                            {
                                __html: DOMPurify.sanitize( this.props.html )
                            }
                        }
                    ></span>
                )
            }

        } else {
            return (
                <span
                    dangerouslySetInnerHTML={
                        {
                            __html: sanitizeHtml(
                                this.props.html,
                                {
                                    allowedTags: [
                                        "h1",
                                        "h2",
                                        "h3",
                                        "h4",

                                        "svg",

                                        "div",
                                        "span",
                                        "p",

                                        "ol",
                                        "ul",
                                        "li",

                                        "img",

                                        "sup",

                                        "strong",
                                        "em",

                                        "br",
                                        "hr"
                                    ],
                                    allowedAttributes: {
                                        'div': [ 'class', 'id' ],
                                        'span': [ 'class', 'id' ],
                                        'p': [ 'class', 'id' ],
                                        'img': ['src', 'class', 'id', 'style'],
                                        'ul': [ 'class', 'id' ],
                                    },
                                }
                            )
                        }
                    }
                />
            )
        }
    }
}

interface ISanitizedHTMLProps {
    html: string;
    raw?: boolean;
    svg?: boolean;
}

interface ISanitizedHTMLState {

}