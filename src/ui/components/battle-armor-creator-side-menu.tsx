import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../app-router';
import './mech-creator-side-menu.scss';

const steps: { tag: string; path: string; title: string; subtitle?: string }[] = [
    { tag: "home", path: "", title: "Welcome" },
    { tag: "chassis", path: "/chassis", title: "Steps 1-4", subtitle: "Chassis, Motive Systems, Manipulators, Armor" },
    { tag: "equipment", path: "/equipment", title: "Step 5", subtitle: "Weapons and Equipment" },
    { tag: "loadouts", path: "/loadouts", title: "Loadouts", subtitle: "Modular mounts and adaptors" },
    { tag: "summary", path: "/summary", title: "Summary", subtitle: "Values and legality" },
];

export default class BattleArmorCreatorSideMenu extends React.Component<IBattleArmorCreatorSideMenuProps> {

    render = (): JSX.Element => {
        return (
            <ul className="sidebar-menu">
                {steps.map((step) => (
                    <li key={step.tag}>
                        <Link
                            to={`${process.env.PUBLIC_URL}/classic-battletech/battle-armor-creator${step.path}`}
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

interface IBattleArmorCreatorSideMenuProps {
    current?: string;
    appGlobals: IAppGlobals;
}
