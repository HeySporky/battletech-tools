import React, { type JSX } from 'react';
import SmallCraft from '../../../../classes/small-craft';
import {
    FW_DROPSHIP_SOURCES, IHousemanChoices, IStockChoices, ReeseShape, getHousemanIntegrity, getReeseModelTonnage, stockArmorPointsPerTon,
    stockBridgeMultiplier, stockBurnDay, stockCrew, stockHeatSinkDivisor, stockThrustPointsPerTon,
} from '../../../../data/future-wars-dropships';
import InputNumeric from "../../../components/form_elements/input_numeric";

/**
 * Step 2 for a DropShip built by a Future Wars method (#172, future-wars-dropships.ts): thrust, fuel and integrity, the
 * method's own choices, and Reese's tonnage from a model. The method's weights are listed on the summary.
 */
export default class FwDropShipStep extends React.Component<IFwDropShipStepProps, IFwDropShipStepState> {
    state: IFwDropShipStepState = { shapes: [], newShape: "sphere" };

    render = (): JSX.Element => {
        const { craft, update } = this.props;
        const method = craft.getFwDropShipMethod();
        const result = craft.getFwDropShipResult();
        if (!method || !result) return <></>;
        const options = craft.getFwOptions();
        const byDays = method === "reese" || method === "houseman";
        return (
            <div data-testid="fw-dropship-step">
                <p className="smaller-text">Built by {FW_DROPSHIP_SOURCES[method]}.</p>
                {method === "reese" ? this._renderReeseModel() : null}
                <label>
                    Safe Thrust:
                    <select data-testid="sc-thrust" value={craft.getSafeThrust()} onChange={(e) => { const value = +e.currentTarget.value; update((c) => c.setSafeThrust(value)); }}>
                        {Array.from({ length: 12 }, (_unused, index) => index + 1).map((thrust) => (
                            <option key={thrust} value={thrust}>{thrust} (Overthrust {Math.ceil(thrust * 1.5)})</option>
                        ))}
                    </select>
                </label>
                {method === "reese" ? (
                    <InputNumeric label="Engines (each armored)" value={options.engines} min={1} max={20} step={1} setValue={(engines) => update((c) => c.setFwOptions({ engines }))} />
                ) : null}
                <p>
                    <strong>{method === "houseman" ? "Thrusters" : "Engine"}</strong>: {craft.getEngineWeight()} tons &nbsp;|&nbsp;
                    <strong>{method === "houseman" ? "Communications and Controls" : "Bridge"}</strong>: {craft.getControlsWeight()} tons &nbsp;|&nbsp;
                    <strong>Free Heat Sinks</strong>: {craft.getFreeHeatSinks()}
                </p>

                {byDays ? (
                    <InputNumeric label={`Days of fuel${method === "reese" ? " (20 to 30)" : ""}`} value={options.fuelDays} min={1} max={1000} step={1} setValue={(fuelDays) => update((c) => c.setFwOptions({ fuelDays }))} />
                ) : (
                    <InputNumeric label="Fuel (tons)" value={craft.getFuelTons()} min={0} max={craft.getTonnage()} step={0.5} setValue={(tons) => update((c) => c.setFuelTons(tons))} />
                )}
                <p>
                    <strong>Fuel</strong>: {craft.getFuelTons()} tons &nbsp;|&nbsp;
                    <strong>Fuel Points</strong>: {craft.getFuelPoints()} ({result.thrustPointsPerTon != null ? `${result.thrustPointsPerTon} a ton` : "480 a ton, NGCFells's reading"}) &nbsp;|&nbsp;
                    <strong>Burn-days at 1 G</strong>: {craft.getBurnDays()} ({craft.getStrategicFuelPerDay()} tons a day)
                </p>
                {method === "eid" && craft.getTonnage() >= 15000 ? (
                    this._renderOptional("Tons of fuel a burn-day above 15,000 tons (Eid: up to about 9)", options.eidBurnDay, stockBurnDay(craft.getTonnage()), 0.01,
                        (value) => update((c) => c.setFwOptions({ eidBurnDay: value })))
                ) : null}

                <InputNumeric
                    label={method === "houseman" ? "Structural Integrity" : `Structural Integrity (${this._integrityRange(craft)})`}
                    value={craft.getStructuralIntegrity()}
                    min={craft.getMinStructuralIntegrity()}
                    max={craft.getMaxStructuralIntegrity()}
                    step={1}
                    setValue={(value) => update((c) => c.setStructuralIntegrity(value))}
                />
                <p>
                    <strong>{method === "houseman" ? "Internal Structure" : "Structure"}</strong>: {craft.getStructureWeight()} tons &nbsp;|&nbsp;
                    <strong>Armor</strong>: {craft.getArmorPointsPerTon()} points a ton
                </p>
                {method === "houseman" ? this._renderHousemanIntegrity(craft) : null}
                {method === "stock" ? this._renderStock(craft, options.stock) : null}
                {method === "houseman" ? this._renderHouseman(options.houseman) : null}
            </div>
        );
    }

    private _integrityRange = (craft: SmallCraft): string => {
        const overthrust = Math.ceil(craft.getSafeThrust() * 1.5);
        switch (craft.getFwDropShipMethod()) {
            case "eid": return `more than the Overthrust, ${overthrust}`;
            case "reese": return `${overthrust} to ${overthrust * 3}`;
            default: return "the builder's choice";
        }
    }

    /** A number field that may be left empty, showing the value used when it is. */
    private _renderOptional = (label: string, value: number | undefined, fallback: number, step: number, set: (value: number | undefined) => void): JSX.Element => (
        <label className="d-block">
            {label}:{" "}
            <input
                type="number"
                step={step}
                value={value ?? ""}
                placeholder={String(fallback)}
                onChange={(e) => { const text = e.currentTarget.value; set(text === "" || !Number.isFinite(+text) ? undefined : +text); }}
            />
            {value === undefined ? <span className="smaller-text"> (empty: {fallback})</span> : null}
        </label>
    )

    private _renderStock = (craft: SmallCraft, stock: IStockChoices): JSX.Element => {
        const tons = craft.getTonnage();
        const set = (key: keyof IStockChoices) => (value: number | undefined) => this.props.update((c) => c.setFwOptions({ stock: { [key]: value } }));
        return (
            <fieldset className="mt-2" data-testid="fw-stock-values">
                <legend className="smaller-text"><strong>Stock's "look in DS/JS" values</strong></legend>
                <p className="smaller-text">
                    Left empty, each uses NGCFells's formula, fitted to every DropShip in DropShips and JumpShips (1988); Inspired by Stock.
                    See TRO - JBT: Future Wars DropShips for the fit.
                </p>
                {this._renderOptional("Thrust points a ton of fuel", stock.thrustPointsPerTon, stockThrustPointsPerTon(tons), 1, set("thrustPointsPerTon"))}
                {this._renderOptional("Tons of fuel a burn-day", stock.burnDay, stockBurnDay(tons), 0.01, set("burnDay"))}
                {this._renderOptional("Armor points a ton", stock.armorPointsPerTon, stockArmorPointsPerTon(tons), 1, set("armorPointsPerTon"))}
                {this._renderOptional("Bridge tons a crew member (1 to 10)", stock.bridgeMultiplier, stockBridgeMultiplier(tons), 0.1, set("bridgeMultiplier"))}
                {this._renderOptional("Heat-sink divisor (10 to 25)", stock.heatSinkDivisor, stockHeatSinkDivisor(craft.getEngineWeight()), 1, set("heatSinkDivisor"))}
                <p className="smaller-text">A DS&amp;JS DropShip of {tons.toLocaleString("en-US")} tons has a crew of about {stock.crew ?? stockCrew(tons)}; set the crew on the Crew step.</p>
            </fieldset>
        );
    }

    private _renderHousemanIntegrity = (craft: SmallCraft): JSX.Element => {
        const row = getHousemanIntegrity(craft.getStructuralIntegrity());
        return (
            <p className="smaller-text" data-testid="fw-houseman-integrity">
                Integrity {row.integrity}: {row.percentOfMass}% of the mass, internal structure {row.internalStructure}, at most {row.maxArmor} armor
                a facing, up to {row.acceleration} G of thrust.
                {row.extended ? " Past Houseman's printed rows (1-8): NGCFells's extension of his table." : ""}
            </p>
        );
    }

    private _renderHouseman = (houseman: IHousemanChoices): JSX.Element => {
        const set = (patch: IHousemanChoices) => this.props.update((c) => c.setFwOptions({ houseman: patch }));
        const flags: [keyof IHousemanChoices, string][] = [
            ["heavyLanding", "Tail landing or retractable legs (15%, not 10%)"],
            ["hyperpulseGenerator", "Hyperpulse generator (100 tons)"],
            ["secondComputer", "Second computer (5 tons)"],
            ["fireControl", "Independent fire control (1 ton a weapon)"],
            ["cargoHandling", "Cargo handling (12% of the cargo)"],
        ];
        const numbers: [keyof IHousemanChoices, string, number][] = [
            ["maxMechTons", "Heaviest 'Mech carried (tons)", 100],
            ["maxFighterTons", "Heaviest fighter carried (tons)", 100],
            ["maxSmallCraftTons", "Heaviest small craft carried (tons)", 200],
            ["launchTubes", "Launch tubes (200 tons each)", 0],
            ["assaultRampLanes", "Assault ramp lanes (40 tons each)", 0],
            ["dropCapsules", "Drop capsules (25% of the 'Mech)", 0],
            ["shifts", "Watches a day", 3],
        ];
        return (
            <fieldset className="mt-2" data-testid="fw-houseman-options">
                <legend className="smaller-text"><strong>Houseman's systems</strong></legend>
                {flags.map(([key, label]) => (
                    <label key={key} className="d-block">
                        <input type="checkbox" checked={houseman[key] === true} onChange={(e) => { const value = e.currentTarget.checked; set({ [key]: value || undefined }); }} />
                        {" "}{label}
                    </label>
                ))}
                {numbers.map(([key, label, fallback]) => (
                    <InputNumeric key={key} label={label} value={(houseman[key] as number | undefined) ?? fallback} min={0} max={100000} step={1} setValue={(value) => set({ [key]: value })} />
                ))}
            </fieldset>
        );
    }

    /** Reese's step 3 (FW #36 p.16): the volume of a 1/285 model, in cubic centimeters, x 23.1 x 0.07 for tons. */
    private _renderReeseModel = (): JSX.Element => {
        const { shapes, newShape } = this.state;
        const model = getReeseModelTonnage(shapes);
        const fields = REESE_SHAPE_FIELDS[newShape];
        return (
            <fieldset className="mb-2" data-testid="fw-reese-model">
                <legend className="smaller-text"><strong>Tonnage from a model (Reese)</strong></legend>
                <p className="smaller-text">
                    Measure a 1/285 model in centimeters and add its parts; Pi is 3.145, as Reese prints it. The tonnage field above can
                    still be typed.
                </p>
                <ul className="smaller-text">
                    {shapes.map((shape, index) => (
                        <li key={index}>
                            {describeShape(shape)}{" "}
                            <button type="button" className="btn btn-sm btn-link" onClick={() => this.setState({ shapes: shapes.filter((_s, i) => i !== index) })}>remove</button>
                        </li>
                    ))}
                </ul>
                <label>
                    Part:
                    <select value={newShape} onChange={(e) => this.setState({ newShape: e.currentTarget.value as ReeseShape["kind"] })}>
                        {Object.keys(REESE_SHAPE_FIELDS).map((kind) => <option key={kind} value={kind}>{kind}</option>)}
                    </select>
                </label>
                {fields.map((field) => (
                    <label key={field}>
                        {" "}{field} (cm):{" "}
                        <input type="number" min={0} step={0.1} style={{ width: "6em" }} data-field={field} ref={(input) => { this._fieldInputs[field] = input; }} />
                    </label>
                ))}
                <button type="button" className="btn btn-sm btn-secondary ml-1" onClick={this._addShape}>Add part</button>
                <p>
                    <strong>Model</strong>: {Math.round(model.cubicCentimeters).toLocaleString("en-US")} cc, {Math.round(model.cubicMeters).toLocaleString("en-US")} m³,{" "}
                    <strong>{model.tons.toLocaleString("en-US")} tons</strong>{" "}
                    <button type="button" className="btn btn-sm btn-primary" disabled={model.tons < 1} onClick={() => this.props.update((c) => c.setTonnage(model.tons))}>Use this tonnage</button>
                </p>
            </fieldset>
        );
    }

    private _fieldInputs: Record<string, HTMLInputElement | null> = {};

    private _addShape = (): void => {
        const kind = this.state.newShape;
        const values: Record<string, number> = {};
        for (const field of REESE_SHAPE_FIELDS[kind]) {
            const value = +(this._fieldInputs[field]?.value ?? "");
            if (!Number.isFinite(value) || value <= 0) return;
            values[field] = value;
        }
        this.setState({ shapes: [...this.state.shapes, { kind, ...values } as ReeseShape] });
    }
}

const REESE_SHAPE_FIELDS: Record<ReeseShape["kind"], string[]> = {
    box: ["height", "length", "width"],
    cylinder: ["radius", "height"],
    cone: ["radius", "height"],
    sphere: ["diameter"],
    triangle: ["height", "longestSide", "thickness"],
};

const describeShape = (shape: ReeseShape): string =>
    `${shape.kind}: ${REESE_SHAPE_FIELDS[shape.kind].map((field) => `${field} ${(shape as unknown as Record<string, number>)[field]}`).join(", ")} cm`;

interface IFwDropShipStepProps {
    craft: SmallCraft;
    update: (change: (craft: SmallCraft) => void) => void;
}

interface IFwDropShipStepState {
    shapes: ReeseShape[];
    newShape: ReeseShape["kind"];
}
