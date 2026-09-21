import React from 'react';
import { Link } from 'react-router-dom';
import { IAppGlobals } from '../app-router';
import './mech-creator-side-menu.scss';

export default class VehicleCreatorSideMenu extends React.Component<IVehicleCreatorSideMenuProps, IVehicleCreatorSideMenuState> {

    render = (): JSX.Element => {
        return (
            <>
                <ul className="sidebar-menu">
                    <li>
                        <Link
                            to={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator`}
                            className={this.props.current === "home" ? "btn btn-primary" : "btn btn-lightbg"}
                        >
                            <div className="title">Welcome</div>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/step1`}
                            className={this.props.current === "step1" ? "btn btn-primary" : "btn btn-lightbg"}
                        >
                            <div className="title">Step 1</div>
                            <div className="subtitle">Design the Chassis</div>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/armor`}
                            className={this.props.current === "armor" ? "btn btn-primary" : "btn btn-lightbg"}
                        >
                            <div className="title">Step 2</div>
                            <div className="subtitle">Allocate Armor</div>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/equipment-selection`}
                            className={this.props.current === "equipment-selection" ? "btn btn-primary" : "btn btn-lightbg"}
                        >
                            <div className="title">Step 3</div>
                            <div className="subtitle">Select Equipment</div>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/equipment-placement`}
                            className={this.props.current === "equipment-placement" ? "btn btn-primary" : "btn btn-lightbg"}
                        >
                            <div className="title">Step 4</div>
                            <div className="subtitle">Place Equipment</div>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/summary`}
                            className={this.props.current === "summary" ? "btn btn-primary" : "btn btn-lightbg"}
                        >
                            <div className="title">Summary</div>
                            <div className="subtitle">Weights and Alpha Strike stats</div>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to={`${process.env.PUBLIC_URL}/classic-battletech/vehicle-creator/record-sheet`}
                            className={this.props.current === "record-sheet" ? "btn btn-primary" : "btn btn-lightbg"}
                        >
                            <div className="title">Record Sheet</div>
                            <div className="subtitle">Printable diagram</div>
                        </Link>
                    </li>
                </ul>
            </>
        );
    }
}

interface IVehicleCreatorSideMenuProps {
    current?: string;
    appGlobals: IAppGlobals;
}

interface IVehicleCreatorSideMenuState {
}
