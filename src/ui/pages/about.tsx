import React from 'react';
import { IAppGlobals } from '../app-router';
import './about.scss';
import UIPage from '../components/ui-page';
import TextSection from '../components/text-section';
let pjson = require('../../../package.json');

export default class About extends React.Component<IAboutProps, IAboutState> {

  constructor(props: IAboutProps) {
    super(props);

    this.props.appGlobals.makeDocumentTitle("About Jeff's BattleTech Tools");
  }

    render = (): JSX.Element => {
      return (
    <UIPage current="about" appGlobals={this.props.appGlobals}>

    <div className="text-center">Version {pjson.version}</div>

    <div className="row">
        <div className="col-md-6">
          <TextSection
            label="Credits"
          >
              <h4><a href="https://github.com/JDGwf" rel="noopener noreferrer" target="_blank">Jeffrey D. Gordon</a></h4>
              <strong>Original Developer</strong> - <a href="https://jdgwf.com/">Jeffery D. Gordon</a><br />
              <p>Jeff started playing BattleTech in 1985 and started his career as a professional developer in 1996. He created this and other gaming tools as a labor of love. He passed from cancer in late 2024. You can find his original version of this software at <a href="https://jdgwf.github.io">https://jdgwf.github.io</a></p>

              <hr />
              <h4><a href="https://github.com/MoonSword22" rel="noopener noreferrer" target="_blank">MoonSword22</a></h4>
              <p><strong>Data Entry and consulting</strong></p>

              <hr />
              <h4><a href="https://github.com/cam-smith" rel="noopener noreferrer" target="_blank">cam-smith</a></h4>
              <p><strong>Fixes for formation bonuses and aero damages</strong></p>

              </TextSection>
        </div>
        <div className="col-md-6">
          <TextSection
            label="Copyrights"
          >
          <p>This site and app is a completely free fan-site that makes no claim to ownership to any of <a href="http://catalystgamelabs.com/">Catalyst Game Labs</a> or <a href="http://topps.com">The Topps Company, Inc</a> properties.</p>

          <p>MechWarrior, BattleMech, ‘Mech and AeroTech are registered trademarks
          of <a href="http://topps.com">The Topps Company, Inc</a>. All Rights Reserved.</p>

          <p> Catalyst Game Labs and the Catalyst Game Labs logo are trademarks of InMediaRes Production, LLC. Used with permission. Neither Topps nor Catalyst Game Labs makes no representation or warranty as to the quality, viability, or suitability for purpose of this product.</p>

          <p><a href="http://bg.battletech.com/?page_id=34">See additional information on the BattleTech The Board Game Website</a></p>
        </TextSection>

      </div>
    </div>
    <div className="row">
      <div className="col-md-6">
        <TextSection
          label="Software License"
        >
            <p>This project is open source (GPLv3) with exceptions to the Data directory, see below.</p>

            <p>View the full license here: <a href="https://github.com/HeySporky/battletech-tools/blob/master/LICENSE">at the GitHub repository</a></p>

            <h4>Exceptions</h4>
            <p>The data in ./src/data/* contains copyrighted material and is not included. Each of the comments header in the file repeats this exception in the above license.</p>
          </TextSection>
        </div>

      <div className="col-md-6">
      <TextSection
        label="Bug Reporting"
      >
          <p>Please submit any bugs as issues on the <a href="https://github.com/HeySporky/battletech-tools/issues">github project</a>.</p>
        </TextSection>
      </div>
	</div>
          </UIPage>
      );
    }
}

interface IAboutProps {
  appGlobals: IAppGlobals;
}

interface IAboutState {

}