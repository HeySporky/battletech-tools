import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../app-router';
import './mech-creator-side-menu.scss';

const steps: { tag: string; path: string; title: string; subtitle?: string }[] = [
    { tag: "home", path: "", title: "Welcome" },
    { tag: "platoon", path: "/platoon", title: "Step 1", subtitle: "Establish Platoon Type" },
    { tag: "weapons", path: "/weapons", title: "Step 2", subtitle: "Establish Platoon Weaponry" },
    { tag: "summary", path: "/summary", title: "Summary", subtitle: "Values and legality" },
];

export default class InfantryCreatorSideMenu extends React.Component<IInfantryCreatorSideMenuProps> {

    render = (): JSX.Element => {
        return (
            <ul className="sidebar-menu">
                {steps.map((step) => (
                    <li key={step.tag}>
                        <Link
                            to={`${process.env.PUBLIC_URL}/classic-battletech/infantry-creator${step.path}`}
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

interface IInfantryCreatorSideMenuProps {
    current?: string;
    appGlobals: IAppGlobals;
}
