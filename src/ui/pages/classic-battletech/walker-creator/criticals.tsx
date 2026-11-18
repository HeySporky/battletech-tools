import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { FaArrowCircleLeft, FaArrowCircleRight } from "react-icons/fa";
import { IAppGlobals } from '../../../app-router';
import { WalkerCreatorSideMenu } from '../../../components/creator-side-menus';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import WalkerStatusBar from './_statusBar';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;

/**
 * Step 5: every location's critical slots, as the design places them. The fixed items (actuators, engine, gyro, the
 * control section), the equipment, the jump jets and the heat sinks the engine cannot hold are placed by the class;
 * a slot with nothing in it is free. Changing where an item goes is the equipment page's job.
 */
export default class WalkerCreatorCriticals extends React.Component<ICriticalsProps> {
    constructor(props: ICriticalsProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("Step 5 | Walker Creator");
    }

    render = (): JSX.Element => {
        const walker = this.props.appGlobals.currentWalker;
        if (!walker) return <></>;

        return (
            <UIPage current="classic-battletech-walker-creator" appGlobals={this.props.appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <WalkerCreatorSideMenu appGlobals={this.props.appGlobals} current="criticals" />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <WalkerStatusBar walker={walker} />
                        <TextSection label="Step 5: Critical Slots">
                            <p className="smaller-text">
                                Engine, gyro, actuators and the control section are placed for you, as on a 'Mech. Jump jets go in the legs and outer
                                torsos and the heat sinks the engine cannot hold where there is room (NGCFells's). An item split between two locations is listed in both.
                            </p>
                            <div className="row" data-testid="walker-criticals">
                                {walker.getLocations().map((location) => {
                                    const slots = walker.getSlots(location);
                                    return (
                                        <div className="col-md-6 col-xl-4" key={location}>
                                            <table className="table table-sm" data-testid={`walker-slots-${location}`}>
                                                <thead>
                                                    <tr>
                                                        <th colSpan={2}>
                                                            {walker.getLocationName(location)}
                                                            <span className="smaller-text"> ({walker.getFreeSlots(location)} of {walker.getSlotCount(location)} free)</span>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {slots.map((slot, index) => (
                                                        <tr key={index}>
                                                            <td className="min-width">{index + 1}</td>
                                                            <td>{slot ?? <span className="smaller-text">(free)</span>}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/walker-creator/technical-readout`} className="btn btn-primary pull-right btn-sm">
                                    Summary <ArrowCircleRight />
                                </Link>
                                <Link to={`${process.env.PUBLIC_URL}/classic-battletech/walker-creator/equipment`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
                            </div>
                        </TextSection>
                    </div>
                </div>
            </UIPage>
        );
    }
}

interface ICriticalsProps {
    appGlobals: IAppGlobals;
}
