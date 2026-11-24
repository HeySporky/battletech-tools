import React, { type JSX } from 'react';
import type Vehicle from '../../classes/vehicle';
import CalcBreakdown, { BV_ACCURACY_PATH } from './calc-breakdown';

/**
 * Support Vehicles enter the rules with the TechManual (2007): no Master Rules edition builds or rates one, so there is
 * no Support Vehicle BV1 and the breakdown offers the Total Warfare edition alone (#599, #600, the Support Vehicle round).
 */
export const SUPPORT_VEHICLE_BREAKDOWN_EDITIONS = ["total-warfare"];

/**
 * A Support Vehicle's Battle Value (TM pp.307-308, 316) and cost (TM pp.280-285) as cited steps, with the Master Unit
 * List's Battle Value beside ours when one is given.
 */
export function SupportVehicleCalcBreakdown(props: { vehicle: Vehicle; mulBattleValue?: number; accuracyHref?: string }): JSX.Element {
    const { vehicle } = props;
    const pilot = vehicle.getPilot();
    return (
        <CalcBreakdown
            battleValue={(edition) => vehicle.getBattleValueBreakdown(edition)}
            cost={(edition) => vehicle.getCostBreakdown(edition)}
            editions={SUPPORT_VEHICLE_BREAKDOWN_EDITIONS}
            edition="total-warfare"
            skillBattleValue={(edition) => vehicle.getPilotAdjustedBattleValue(edition)}
            skillLabel={`Gunnery ${pilot.gunnery}, Piloting ${pilot.piloting}`}
            mulBattleValue={props.mulBattleValue}
            accuracyHref={props.accuracyHref ?? BV_ACCURACY_PATH}
        />
    );
}
