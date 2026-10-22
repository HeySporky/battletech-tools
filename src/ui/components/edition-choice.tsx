import React, { useLayoutEffect, useRef, type JSX } from 'react';

/**
 * A field the design's rules edition does not have: under an earlier rulebook a choice it leaves only one option for
 * (Battledroids' one engine, gyro or armor) is not shown, and `hidden` hides a field the rulebook lacks outright.
 * Total Warfare and later editions show every field; their rules level narrows the options instead.
 */
export default function EditionChoice(props: { earlierEdition: boolean; hidden?: boolean; children: React.ReactNode }): JSX.Element {
    const box = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        if (!box.current) return;
        const select = box.current.querySelector("select");
        const single = props.earlierEdition && !!select && select.options.length <= 1;
        box.current.style.display = props.hidden || single ? "none" : "contents";
    });
    return <div ref={box} style={{ display: "contents" }}>{props.children}</div>;
}
