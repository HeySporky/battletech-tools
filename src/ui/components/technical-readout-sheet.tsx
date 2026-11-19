import React, { type JSX } from "react";
import { TechnicalReadout } from "../../classes/technical-readout";
import { ITroUnitAdapter, TRO_TEXT_SECTIONS } from "../../data/technical-readout-interfaces";
import BattleTechLogo from "./battletech-logo";
import { GRAY, INK } from "./svg/record-sheet-svg-kit";
import { RulesetsAttribution } from "./rulesets-attribution";
import TrademarkNoticeParagraphs from "./trademark-notice";
import TroConstructionTable from "./tro-construction-table";
import "./technical-readout-sheet.scss";

/** Text with blank-line-separated paragraphs, as `<p>`s; the text goes through JSX, so it is always escaped. */
const paragraphs = (text: string): JSX.Element[] => text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => <p key={index}>{paragraph}</p>);

/** The printed Technical Readout of a unit: spec block, text in two columns, construction table. Shared by every unit type. */
/** `rulesets`: the Special Rulesets the unit is built under, credited in the footer (#324). */
export default function TechnicalReadoutSheet(props: { tro: TechnicalReadout; adapter: ITroUnitAdapter; rulesets?: readonly string[] }): JSX.Element {
    const { tro, adapter } = props;
    const spec = adapter.getSpecValues();
    const armament = tro.getArmamentLine(adapter.getEquipmentCopies());
    const componentRows = adapter.getComponentRows();
    /** The entered make, else the one the rules edition suggests. */
    const make = (key: string): string => tro.getComponent(key) || componentRows.find((row) => row.key === key)?.suggested || "";
    const lines: [string, string | undefined][] = [
        ["Mass", spec.mass],
        ["Chassis", make("chassis")],
        ["Power Plant", make("engine")],
        ["Cruising Speed", spec.cruisingSpeed],
        ["Maximum Speed", spec.maximumSpeed],
        ["Jump Jets", make("jumpJets")],
        ["Jump Capacity", spec.jumpCapacity],
        ["Armor", make("armor") || spec.armorType],
        ["Armament", armament],
        ["Manufacturer", tro.getProduction("manufacturer")],
        ["Primary Factory", tro.getProduction("primaryFactory")],
        ["Communications System", tro.getProduction("communications")],
        ["Targeting & Tracking", tro.getProduction("targeting")],
    ];
    const sections = TRO_TEXT_SECTIONS.filter((section) => tro.getText(section.key).trim());

    return (
        <div className="tro-sheet">
            <h2>{spec.title}</h2>
            <div className="tro-subtitle">{spec.subtitle}</div>
            <div className="tro-spec-row">
                <div className="tro-spec">
                    {lines.filter(([, value]) => value && value.trim()).map(([label, value]) => (
                        <div key={label}><b>{label}:</b> {value}</div>
                    ))}
                </div>
                <div className="tro-image-space" />
            </div>
            {sections.length > 0 && (
                <div className="tro-text">
                    {sections.map((section) => (
                        <section key={section.key}>
                            <h3>{section.label}</h3>
                            {paragraphs(tro.getText(section.key))}
                        </section>
                    ))}
                </div>
            )}
            <TroConstructionTable rows={adapter.getConstructionRows()} />
            <footer className="tro-footer">
                <BattleTechLogo baseColor={INK} altColor={GRAY} />
                <RulesetsAttribution rulesets={props.rulesets ?? []} />
                <TrademarkNoticeParagraphs />
            </footer>
        </div>
    );
}
