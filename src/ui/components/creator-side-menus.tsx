import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { IAppGlobals } from '../app-router';
import './mech-creator-side-menu.scss';

// The step menu beside every unit creator. Each creator is one list of steps: [route, title, subtitle]; the
// welcome page's route is "" and every other step's route is also the tag its pages pass as `current`.

type CreatorStep = [route: string, title: string, subtitle?: string];

interface ICreatorSideMenuProps {
    current?: string;
    appGlobals: IAppGlobals;
}

const creatorSideMenu = (creator: string, steps: CreatorStep[]) => function CreatorSideMenu(props: ICreatorSideMenuProps): JSX.Element {
    return (
        <ul className="sidebar-menu">
            {[["", "Welcome"] as CreatorStep, ...steps].map(([route, title, subtitle]) => (
                <li key={route || "home"}>
                    <Link
                        to={`${process.env.PUBLIC_URL}/classic-battletech/${creator}${route ? `/${route}` : ""}`}
                        className={props.current === (route || "home") ? "btn btn-primary" : "btn btn-lightbg"}
                    >
                        <div className="title">{title}</div>
                        {subtitle ? <div className="subtitle">{subtitle}</div> : null}
                    </Link>
                </li>
            ))}
        </ul>
    );
};

export const MechCreatorSideMenu = creatorSideMenu("mech-creator", [
    ["step1", "Step 1", "Design the Chassis"],
    ["step2", "Step 2", "Install engine and control systems"],
    ["step3", "Step 3", "Add additional heat sinks"],
    ["step4", "Step 4", "Add Armor"],
    ["step5", "Step 5", "Add weapons, ammunition and other equipment"],
    ["step6", "Step 6", "Complete the record sheet"],
    ["step7", "Step 7", "Technical Readout (optional)"],
    ["summary", "Summary"],
    ["exports", "Exports"],
    ["imports", "Imports"],
]);

export const VehicleCreatorSideMenu = creatorSideMenu("vehicle-creator", [
    ["step1", "Step 1", "Design the Chassis"],
    ["armor", "Step 2", "Allocate Armor"],
    ["equipment-selection", "Step 3", "Select Equipment"],
    ["equipment-placement", "Step 4", "Place Equipment"],
    ["technical-readout", "Step 5", "Technical Readout"],
    ["summary", "Summary", "Weights and Alpha Strike stats"],
    ["record-sheet", "Record Sheet", "Printable diagram"],
]);

export const FighterCreatorSideMenu = creatorSideMenu("fighter-creator", [
    ["chassis", "Step 1", "Design the Chassis"],
    ["armor", "Step 2", "Allocate Armor"],
    ["equipment", "Step 3", "Weapons and Equipment"],
    ["technical-readout", "Step 4", "Technical Readout"],
    ["summary", "Summary", "Weights and legality"],
]);

export const InfantryCreatorSideMenu = creatorSideMenu("infantry-creator", [
    ["platoon", "Step 1", "Establish Platoon Type"],
    ["weapons", "Step 2", "Establish Platoon Weaponry"],
    ["technical-readout", "Step 3", "Technical Readout"],
    ["summary", "Summary", "Values and legality"],
]);

export const BattleArmorCreatorSideMenu = creatorSideMenu("battle-armor-creator", [
    ["chassis", "Steps 1-4", "Chassis, Motive Systems, Manipulators, Armor"],
    ["equipment", "Step 5", "Weapons and Equipment"],
    ["loadouts", "Loadouts", "Modular mounts and adaptors"],
    ["technical-readout", "Step 6", "Technical Readout"],
    ["summary", "Summary", "Values and legality"],
]);

export const ProtoMechCreatorSideMenu = creatorSideMenu("protomech-creator", [
    ["chassis", "Steps 1-4", "Chassis, Engine, Jump Jets, Armor"],
    ["equipment", "Step 5", "Weapons, Ammunition and Equipment"],
    ["technical-readout", "Step 6", "Technical Readout"],
    ["summary", "Summary", "Values and legality"],
]);

export const MicroMechCreatorSideMenu = creatorSideMenu("micro-mech-creator", [
    ["chassis", "Steps 1-3", "Version, Chassis, Engine, Armor"],
    ["equipment", "Step 4", "Weapons, Ammunition and Equipment"],
    ["summary", "Summary", "Cost, Battle Value and legality"],
    ["record-sheet", "Print", "Record sheet"],
    ["print-as", "Alpha Strike", "Card (not official)"],
]);

export const WalkerCreatorSideMenu = creatorSideMenu("walker-creator", [
    ["chassis", "Steps 1-3", "Edition, Chassis, Engine, Armor"],
    ["equipment", "Step 4", "Turret, Weapons, Heat Sinks and Equipment"],
    ["criticals", "Step 5", "Critical Slots"],
    ["technical-readout", "Step 6", "Technical Readout"],
    ["summary", "Summary", "Cost, Battle Value and legality"],
    ["record-sheet", "Print", "Record sheet"],
    ["print-as", "Alpha Strike", "Card (not official)"],
]);

export const SmallCraftCreatorSideMenu = creatorSideMenu("small-craft-creator", [
    ["chassis", "Steps 1-2", "Hull, Engine, Fuel, Structure"],
    ["armor", "Steps 3-4", "Armor and Heat Sinks"],
    ["equipment", "Step 5", "Weapons and Equipment"],
    ["crew", "Step 6", "Crew, Quarters and Bays"],
    ["technical-readout", "Step 7", "Technical Readout"],
    ["summary", "Summary", "Values and legality"],
]);

export const CapitalShipCreatorSideMenu = creatorSideMenu("capital-ship-creator", [
    ["chassis", "Steps 1-2", "Hull, Drives, K-F Drive, Fuel"],
    ["armor", "Steps 3-4", "Heat Sinks and Armor"],
    ["equipment", "Step 5", "Weapons and Equipment"],
    ["crew", "Step 6", "Crew, Quarters, Bays and Collars"],
    ["technical-readout", "Step 7", "Technical Readout"],
    ["summary", "Summary", "Weight, cost and legality"],
]);

export const BuildingCreatorSideMenu = creatorSideMenu("building-creator", [
    ["structure", "Steps 1 and 2", "Superstructure and Armor"],
    ["equipment", "Step 3", "Weapons, Power and Equipment"],
    ["technical-readout", "Step 4", "Technical Readout"],
    ["summary", "Summary", "Values and legality"],
]);
