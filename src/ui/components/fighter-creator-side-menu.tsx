import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../app-router';
import './mech-creator-side-menu.scss';

const steps: { tag: string; path: string; title: string; subtitle?: string }[] = [
    { tag: "home", path: "", title: "Welcome" },
    { tag: "chassis", path: "/chassis", title: "Step 1", subtitle: "Design the Chassis" },
    { tag: "armor", path: "/armor", title: "Step 2", subtitle: "Allocate Armor" },
    { tag: "equipment", path: "/equipment", title: "Step 3", subtitle: "Weapons and Equipment" },
    { tag: "summary", path: "/summary", title: "Summary", subtitle: "Weights and legality" },
];

export default class FighterCreatorSideMenu extends React.Component<IFighterCreatorSideMenuProps> {

    render = (): JSX.Element => {
        return (
            <ul className="sidebar-menu">
                {steps.map((step) => (
                    <li key={step.tag}>
                        <Link
                            to={`${process.env.PUBLIC_URL}/classic-battletech/fighter-creator${step.path}`}
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

interface IFighterCreatorSideMenuProps {
    current?: string;
    appGlobals: IAppGlobals;
}
