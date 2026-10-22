import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../app-router';
import './mech-creator-side-menu.scss';

const steps: { tag: string; path: string; title: string; subtitle?: string }[] = [
    { tag: "home", path: "", title: "Welcome" },
    { tag: "chassis", path: "/chassis", title: "Steps 1-2", subtitle: "Hull, Drives, K-F Drive, Fuel" },
    { tag: "armor", path: "/armor", title: "Steps 3-4", subtitle: "Heat Sinks and Armor" },
    { tag: "equipment", path: "/equipment", title: "Step 5", subtitle: "Weapons and Equipment" },
    { tag: "crew", path: "/crew", title: "Step 6", subtitle: "Crew, Quarters, Bays and Collars" },
    { tag: "summary", path: "/summary", title: "Summary", subtitle: "Weight, cost and legality" },
];

export default class CapitalShipCreatorSideMenu extends React.Component<ICapitalShipCreatorSideMenuProps> {

    render = (): JSX.Element => {
        return (
            <ul className="sidebar-menu">
                {steps.map((step) => (
                    <li key={step.tag}>
                        <Link
                            to={`${process.env.PUBLIC_URL}/classic-battletech/capital-ship-creator${step.path}`}
                            className={this.props.current === step.tag ? "btn btn-primary" : "btn btn-lightbg"}
                        >
                            <div className="title">{step.title}</div>
                            {step.subtitle ? <div className="subtitle">{step.subtitle}</div> : null}
                        </Link>
                    </li>
                ))}
            </ul>
        );
    }
}

interface ICapitalShipCreatorSideMenuProps {
    current?: string;
    appGlobals: IAppGlobals;
}
