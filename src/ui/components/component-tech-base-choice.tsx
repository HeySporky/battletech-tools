import React, { type JSX } from 'react';

/**
 * Which version of a component a design mounts, when it may choose: Inner Sphere or Clan on Mixed Tech (#43), or on
 * a Clan design the Star League version beside the Clan one while the era holds both (#168). Hidden with one choice.
 */
export default function ComponentTechBaseChoice(props: {
    label: string;
    choices: ("is" | "clan")[];
    value: "is" | "clan";
    clanDesign: boolean;
    onChange: (techBase: "is" | "clan") => void;
}): JSX.Element | null {
    if (props.choices.length < 2) return null;
    const name = (techBase: "is" | "clan") => techBase === "clan" ? "Clan" : props.clanDesign ? "Star League" : "Inner Sphere";
    return (
        <label>
            {props.label}:
            <select value={props.value} onChange={(event) => props.onChange(event.currentTarget.value === "clan" ? "clan" : "is")}>
                {props.choices.map((techBase) => <option key={techBase} value={techBase}>{name(techBase)}</option>)}
            </select>
        </label>
    );
}
