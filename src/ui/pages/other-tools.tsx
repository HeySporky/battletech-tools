import React, { type JSX } from 'react';
import { IAppGlobals } from '../app-router';
import TextSection from '../components/text-section';
import UIPage from '../components/ui-page';

// Fan-made tools elsewhere on the web. Add new ones here as we find them.
const OTHER_TOOLS: IOtherTool[] = [
  {
    name: "MegaMek",
    url: "https://megamek.org",
    description: "The open-source computer version of Classic BattleTech, played against the computer or online. It comes with MegaMekLab for designing units and MekHQ for running campaigns.",
  },
  {
    name: "Solaris Skunk Werks",
    url: "https://solarisskunkwerks.com",
    description: "A desktop designer for 'Mechs, vehicles and aerospace units, with printable record sheets. This site imports its .ssw 'Mech files.",
  },
  {
    name: "Flechs",
    url: "https://www.flechs.net",
    description: "Interactive Classic BattleTech record sheets that run in the browser.",
  },
  {
    name: "BattletechCCG",
    url: "https://phoenixhawkx2.itch.io/battletechccg",
    description: "A fan-made digital version of the BattleTech collectible card game for Windows, macOS and Linux: build decks, play against AI decks or play online.",
  },
];

export default class OtherTools extends React.Component<IOtherToolsProps> {
  constructor(props: IOtherToolsProps) {
    super(props);

    this.props.appGlobals.makeDocumentTitle("Other Tools");
  }

  render = (): JSX.Element => {
    return (
      <UIPage current="other-tools" appGlobals={this.props.appGlobals}>
        <TextSection label="Other Tools">
          <p>Other BattleTech tools made by the community. These sites aren't part of Jeff's BattleTech Tools IIC; the links open in a new tab.</p>
          <ul className="styleless">
            {OTHER_TOOLS.map( (tool) => {
              return (
                <li key={tool.url}>
                  <h3><a href={tool.url} target="_blank" rel="noopener noreferrer">{tool.name}</a></h3>
                  <p>{tool.description}</p>
                </li>
              )
            })}
          </ul>
          <p>Know of another tool that belongs here? Tell us on the <a href="https://discord.gg/U539K45v8U" target="_blank" rel="noopener noreferrer">Discord</a>.</p>
        </TextSection>
      </UIPage>
    );
  }
}

interface IOtherTool {
  name: string;
  url: string;
  description: string;
}

interface IOtherToolsProps {
  appGlobals: IAppGlobals;
}
