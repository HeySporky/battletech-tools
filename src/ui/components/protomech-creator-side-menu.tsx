import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../app-router';
import './mech-creator-side-menu.scss';

const steps: { tag: string; path: string; title: string; subtitle?: string }[] = [
    { tag: "home", path: "", title: "Welcome" },
    { tag: "chassis", path: "/chassis", title: "Steps 1-4", subtitle: "Chassis, Engine, Jump Jets, Armor" },
    { tag: "equipment", path: "/equipment", title: "Step 5", subtitle: "Weapons, Ammunition and Equipment" },
    { tag: "summary", path: "/summary", title: "Summary", subtitle: "Values and legality" },
];

export default class ProtoMechCreatorSideMenu extends React.Component<IProtoMechCreatorSideMenuProps> {

    render = (): JSX.Element => {
        return (
            <ul className="sidebar-menu">
                {steps.map((step) => (
                    <li key={step.tag}>
                        <Link
                            to={`${process.env.PUBLIC_URL}/classic-battletech/protomech-creator${step.path}`}
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

interface IProtoMechCreatorSideMenuProps {
    current?: string;
    appGlobals: IAppGlobals;
}
