import SmallCraft from "../classes/small-craft";
import { getFwDropShipSamples, IFwDropShipSample } from "./future-wars-dropship-samples";
import {
    DSJS_DROPSHIPS, FwDropShipMethod, stockArmorPointsPerTon, stockBridgeMultiplier, stockBurnDay, stockCrew, stockThrustPointsPerTon,
} from "./future-wars-dropships";

/*
 * The generated half of TRO - JBT: Future Wars DropShips (#172): the DS&JS table beside NGCFells's formulae, the
 * verification builds and a page for each sample sheet design. Every figure is read from the tables and the designs, so
 * the readout always matches the creator.
 */

const METHODS: FwDropShipMethod[] = ["stock", "eid", "reese", "houseman"];
const METHOD_NAMES: Record<FwDropShipMethod, string> = { stock: "Stock", eid: "Eid", reese: "Reese", houseman: "Houseman" };
const tons = (value: number): string => Math.round(value * 10) / 10 === Math.round(value) ? Math.round(value).toLocaleString("en-US") : (Math.round(value * 10) / 10).toLocaleString("en-US");
const cell = (printed: number | null, formula: number): string => printed === null ? `- / ${formula}` : printed === formula ? `${printed}` : `${printed} / ${formula}`;

/** Stock's four "look in DS/JS" values and the bridge multiplier, printed and by NGCFells's formulae. */
export function getDsJsFitTable(): string {
    const rows = DSJS_DROPSHIPS.map((ship) => {
        const multiplier = Math.round(ship.bridge / ship.crew * 10) / 10;
        return `| ${ship.name} | ${ship.page} | ${ship.shape === "aerodyne" ? "A" : "S"} | ${ship.tonnage.toLocaleString("en-US")} `
            + `| ${cell(ship.thrustPointsPerTon, stockThrustPointsPerTon(ship.tonnage))} | ${cell(ship.burnDay, stockBurnDay(ship.tonnage))} `
            + `| ${cell(ship.crew, stockCrew(ship.tonnage))} | ${cell(ship.armorPointsPerTon, stockArmorPointsPerTon(ship.tonnage))} `
            + `| ${cell(multiplier, stockBridgeMultiplier(ship.tonnage))} |`;
    });
    return [
        "## Stock's Values from DropShips and JumpShips",
        "",
        "*NGCFells, Inspired by Mark Stock; the figures from DropShips and JumpShips (FASA, 1988).*",
        "",
        "Each cell gives the value the book prints, then NGCFells's formula where the two differ. Ship A is aerodyne, S spheroid. The bridge "
            + "multiplier is the bridge's tons over the crew. The formulae are thrust points a ton of 10 under 2,000 tons, 6 under 10,000, 4 under "
            + "50,000 and 2 above; a burn-day of 1.84 tons to 16,000 tons, then on a straight line through the Mammoth and the Behemoth; a crew of "
            + "1.2378 x tonnage^0.3211; armor of 16 points a ton under 10,000 tons, then 259.49 x tonnage^-0.3225; and a bridge of "
            + "0.00675 x tonnage^0.6661 times the crew, from 1 to 10. The crew is the loosest fit: a liner like the Monarch or a carrier like the "
            + "Vengeance is crewed for its role, not its size. The Leopard CV repeats the Leopard's figures and is left out; the Intruder prints no fuel.",
        "",
        "| Ship | Page | Shape | Tons | Thrust points a ton | Burn-day (tons) | Crew | Armor a ton | Bridge x crew |",
        "|---|---|---|---|---|---|---|---|---|",
        ...rows,
    ].join("\n");
}

const load = (sample: IFwDropShipSample): SmallCraft => new SmallCraft(JSON.stringify(sample.save));

/** The canon ships weighed by each method, against their canon tonnage. */
export function getVerificationTable(samples: IFwDropShipSample[] = getFwDropShipSamples()): string {
    const ships = [...new Set(samples.filter((sample) => sample.group === "canon").map((sample) => sample.name))];
    const rows = ships.map((ship) => {
        const builds = METHODS.map((method) => samples.find((sample) => sample.group === "canon" && sample.name === ship && sample.method === method)!);
        const canon = builds[0].tonnage;
        return `| ${ship} | ${canon.toLocaleString("en-US")} | ` + builds.map((sample) => {
            const built = load(sample).getCurrentTonnage();
            const over = built - canon;
            return `${tons(built)} (${over > 0 ? "+" : ""}${tons(over)})`;
        }).join(" | ") + " |";
    });
    return [
        "### Verification Builds",
        "",
        "Tons each method weighs the canon ship at, and how far that lands from its canon tonnage. Each build is a sample in the Small Craft Creator.",
        "",
        `| Ship | Canon tons | ${METHODS.map((method) => METHOD_NAMES[method]).join(" | ")} |`,
        `|---|---|${METHODS.map(() => "---").join("|")}|`,
        ...rows,
    ].join("\n");
}

/** A page for each design an author printed. */
export function getSheetSamplesReadout(samples: IFwDropShipSample[] = getFwDropShipSamples()): string {
    return ["## The Authors' Designs", "",
        "*Mark Stock, Future Wars #16; Mike Reese, Future Wars #36.*", "",
        "The DropShips Stock and Reese printed, each built to its author's rule. Where a sheet breaks its own rule, the design follows the rule and "
            + "its notes say what the sheet prints (NGCFells: a sheet that breaks its own rule is a finding, not a fix). Each is a sample in the Small Craft Creator.",
        "", ...samples.filter((sample) => sample.group === "sheet").map((sample) => {
        const craft = load(sample);
        const text = craft.tro.export()?.text ?? {};
        const built = craft.getCurrentTonnage();
        const left = sample.tonnage - built;
        return [
            `### ${sample.name}`,
            "",
            `*${sample.method === "stock" ? "Mark Stock" : "Mike Reese"}, Future Wars ${sample.source.replace(/^Future Wars /, "")}.*`,
            "",
            `- **Built by:** ${METHOD_NAMES[sample.method]}'s method`,
            `- **Type:** ${craft.getShapeName()} DropShip, ${sample.tonnage.toLocaleString("en-US")} tons; thrust ${craft.getSafeThrust()} / ${craft.getMaxThrust()}; `
                + `Structural Integrity ${craft.getStructuralIntegrity()}`,
            `- **Weighed by the rule:** ${tons(built)} tons, ${left >= 0 ? `${tons(left)} to spare` : `${tons(-left)} over`}`,
            `- **Battle Value:** ${craft.getBattleValue().toLocaleString("en-US")}; **cost:** ${craft.getCBillCost().toLocaleString("en-US")} C-bills`,
            "",
            text.overview ?? "",
            "",
            text.capabilities ?? "",
            "",
            text.notes ?? "",
        ].join("\n").replace(/\n{3,}/g, "\n\n");
    })].join("\n").replace(/\n{3,}/g, "\n\n");
}

/** Everything the readout generates, after the docs/lore text. */
export function getFwDropShipsGeneratedReadout(): string {
    // The verification table closes the text's "Canon and the Methods" page; the fit table and the designs are pages of their own.
    return [getVerificationTable(), getDsJsFitTable(), getSheetSamplesReadout()].join("\n\n");
}
