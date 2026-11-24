import React, { type ComponentType, type JSX, useEffect, useState } from 'react';
import { FaArrowCircleLeft, FaArrowCircleRight, FaPrint } from "react-icons/fa";
import { Link } from 'react-router';
import type { TechnicalReadout } from '../../classes/technical-readout';
import { getUnitRulesets, type IRulesetsHost } from '../../classes/unit-game-settings';
import type { ITroUnitAdapter } from '../../data/technical-readout-interfaces';
import { shrinkUnitImage } from '../../utils/unit-image';
import { IAppGlobals } from '../app-router';
import PrintablePage from './printable-page';
import { unitRulesLevel } from './game-settings-block';
import TechnicalReadoutSection from './technical-readout-section';
import TechnicalReadoutSheet from './technical-readout-sheet';
import TextSection from './text-section';
import UIPage from './ui-page';
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;
const Print = FaPrint as any;

// The Technical Readout step and the printed TRO sheet, shared by every unit creator. Each creator supplies one
// ICreatorTroConfig (creator-tro-configs.tsx) instead of its own copy of these pages.

/** Any unit that carries a TRO record, and the Special Rulesets its TRO credits. */
export type ITroHost = IRulesetsHost & {
    tro: TechnicalReadout;
    getRequiredRulesLevel(): number;
};

type CurrentUnitKey = "currentBattleMech" | "currentVehicle" | "currentFighter" | "currentInfantry" | "currentBattleArmor"
    | "currentProtoMech" | "currentSmallCraft" | "currentCapitalShip" | "currentBuilding" | "currentWalker";
type SaveUnitKey = "saveCurrentBattleMech" | "saveCurrentVehicle" | "saveCurrentFighter" | "saveCurrentInfantry" | "saveCurrentBattleArmor"
    | "saveCurrentProtoMech" | "saveCurrentSmallCraft" | "saveCurrentCapitalShip" | "saveCurrentBuilding" | "saveCurrentWalker";

export interface ICreatorTroConfig {
    /** The creator's route, e.g. "small-craft-creator". */
    creator: string;
    /** The creator's name for the page title, e.g. "Small Craft Creator". */
    name: string;
    /** The step number shown in the heading. */
    step: number;
    /** The step's own route and side menu tag; "technical-readout" unless the creator numbers its steps. */
    path?: string;
    /** The route of the step before it. */
    previous: string;
    current: CurrentUnitKey;
    save: SaveUnitKey;
    adapter: (unit: any) => ITroUnitAdapter;
    SideMenu: ComponentType<{ appGlobals: IAppGlobals; current?: string }>;
    StatusBar?: ComponentType<{ appGlobals: IAppGlobals }>;
    /** A note for the print bar, such as "provisional BV". */
    provisionalNote?: (unit: any) => string | undefined;
}

export const troStepPath = (config: ICreatorTroConfig): string => config.path ?? "technical-readout";
const creatorUrl = (config: ICreatorTroConfig, route: string): string => `${process.env.PUBLIC_URL}/classic-battletech/${config.creator}/${route}`;
const currentUnit = (appGlobals: IAppGlobals, config: ICreatorTroConfig): ITroHost | null => (appGlobals[config.current] as ITroHost | null) ?? null;

/** Upload, preview and remove the unit picture (#95). The picture is shrunk before it is stored in the design. */
function UnitPictureField({ tro, onChange }: { tro: TechnicalReadout; onChange: () => void }): JSX.Element {
    const [image, setImage] = useState(() => tro.getImage());
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const choose = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        if (!file) return;
        setBusy(true);
        let result: Awaited<ReturnType<typeof shrinkUnitImage>>;
        try {
            result = await shrinkUnitImage(file);
        } catch {
            result = { error: "That picture could not be read." };
        } finally {
            setBusy(false);
        }
        if ("error" in result) {
            setError(result.error);
            return;
        }
        setError("");
        tro.setImage(result.dataUrl);
        setImage(tro.getImage());
        onChange();
    };
    const remove = () => {
        tro.setImage("");
        setImage("");
        setError("");
        onChange();
    };
    return (
        <fieldset className="mb-3">
            <legend className="fs-6">Unit picture</legend>
            <p className="small">Optional. It is shrunk to fit and kept in the design. It prints on the record sheet, the Technical Readout and the Alpha Strike card.</p>
            <label>Unit picture <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => void choose(event)} disabled={busy} /></label>
            {image ? (
                <div className="mt-2">
                    <img src={image} alt="Unit picture preview" style={{ maxWidth: 200, maxHeight: 200 }} />{" "}
                    <button type="button" className="btn btn-secondary btn-sm" onClick={remove}>Remove picture</button>
                </div>
            ) : null}
            {error ? <div className="alert alert-warning mt-2" role="alert">{error}</div> : null}
        </fieldset>
    );
}

export function CreatorTechnicalReadoutStep({ appGlobals, config }: ICreatorTroPageProps): JSX.Element {
    useEffect(() => {
        appGlobals.makeDocumentTitle(`Step ${config.step} | ${config.name}`);
    }, [appGlobals, config]);
    const unit = currentUnit(appGlobals, config);
    if (!unit) {
        return <></>;
    }
    const save = appGlobals[config.save] as (saved: ITroHost) => void;
    const { SideMenu, StatusBar } = config;
    return (
        <>
            {StatusBar ? <StatusBar appGlobals={appGlobals} /> : null}
            <UIPage current={`classic-battletech-${config.creator}`} appGlobals={appGlobals}>
                <div className="row">
                    <div className="d-none d-md-block col-md-3 col-lg-2">
                        <SideMenu appGlobals={appGlobals} current={troStepPath(config)} />
                    </div>
                    <div className="col-md-9 col-lg-10">
                        <TextSection label={`Step ${config.step}: Technical Readout (optional)`}>
                            <p>Everything here is optional. Makes and text appear on the printed Technical Readout sheet; they do not change the design.</p>
                            <UnitPictureField tro={unit.tro} onChange={() => save(unit)} />
                            <TechnicalReadoutSection tro={unit.tro} adapter={config.adapter(unit)} onChange={() => save(unit)} />
                            <div className="clear-both overflow-hidden">
                                <hr />
                                <Link to={creatorUrl(config, "summary")} className="btn btn-primary pull-right btn-sm">Summary <ArrowCircleRight /></Link>
                                <div className="inline-block text-left">
                                    <Link to={creatorUrl(config, config.previous)} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
                                    {" "}
                                    <Link to={creatorUrl(config, "print-tro")} className="btn btn-primary btn-sm"><Print /> Print TRO sheet</Link>
                                </div>
                            </div>
                        </TextSection>
                    </div>
                </div>
            </UIPage>
        </>
    );
}

export function CreatorPrintTRO({ appGlobals, config }: ICreatorTroPageProps): JSX.Element {
    useEffect(() => {
        appGlobals.makeDocumentTitle(`Technical Readout | ${config.name}`);
    }, [appGlobals, config]);
    const unit = currentUnit(appGlobals, config);
    if (!unit) {
        return <></>;
    }
    return (
        <PrintablePage backTo={creatorUrl(config, troStepPath(config))} appGlobals={appGlobals}
            requiredRulesLevel={unit.getRequiredRulesLevel()}
            rulesLevel={unitRulesLevel(unit as unknown as Parameters<typeof unitRulesLevel>[0], appGlobals.appSettings)}
            provisionalNote={config.provisionalNote?.(unit)}
        >
            <div className="print-page">
                <TechnicalReadoutSheet tro={unit.tro} adapter={config.adapter(unit)} rulesets={getUnitRulesets(unit)} />
            </div>
        </PrintablePage>
    );
}

interface ICreatorTroPageProps {
    appGlobals: IAppGlobals;
    config: ICreatorTroConfig;
}
