import React, { useState, type JSX } from 'react';
import { BattleMech } from '../../classes/battlemech';
import { CalcBreakdownToggle, MechCalcBreakdown } from './calc-breakdown';
import SanitizedHTML from './sanitized-html';
import BattleMechSVG from './svg/battlemech-svg';
import './mech-view-panel.scss';

/**
 * A 'Mech's TRO beside its record sheet. A click on the sheet shows it alone at full width, another brings the TRO back (#372).
 * Below them, closed until asked for, the Battle Value and cost breakdown (#599). `mulBattleValue` is the Master Unit
 * List's BV for a bundled design that matched an entry there.
 */
export default function MechViewPanel( props: { mech: BattleMech; mulBattleValue?: number; accuracyHref?: string } ): JSX.Element {
    const [sheetOnly, setSheetOnly] = useState(false);
    return (
        <>
            <div className="row">
                {sheetOnly ? null : (
                    <div className="col">
                        <SanitizedHTML raw={true} html={props.mech.makeTROHTML()} />
                    </div>
                )}
                <div className="col">
                    <button type="button" className="mech-view-sheet" aria-pressed={sheetOnly} aria-label="Record sheet, full width"
                        title={sheetOnly ? "Click to show the TRO beside the record sheet" : "Click to show the record sheet full width"}
                        onClick={() => setSheetOnly( !sheetOnly )}>
                        <BattleMechSVG mechData={props.mech} />
                    </button>
                </div>
            </div>
            <CalcBreakdownToggle>
                {() => <MechCalcBreakdown mech={props.mech} mulBattleValue={props.mulBattleValue} accuracyHref={props.accuracyHref} />}
            </CalcBreakdownToggle>
        </>
    );
}
