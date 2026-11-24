import SmallCraft from "../classes/small-craft";
import { forumCreditLine, getSeaDropshipSamples, ISeaDropshipSample } from "./seadropship-samples";

/*
 * The generated half of TRO - JBT: SeaDropships (#643): a page for each ship, every figure read from the design so the
 * readout always matches the creator.
 */

const load = (sample: ISeaDropshipSample): SmallCraft => new SmallCraft(JSON.stringify(sample.save));
const tons = (value: number): string => (Math.round(value * 10) / 10).toLocaleString("en-US");

/** A page for each ship, after the docs/lore text. */
export function getSeaDropshipsReadout(samples: ISeaDropshipSample[] = getSeaDropshipSamples()): string {
    return samples.map((sample) => {
        const craft = load(sample);
        const text = craft.tro.export()?.text ?? {};
        const production = craft.tro.export()?.production ?? {};
        const wellDecks = craft.getBays().filter((bay) => bay.tag === "well-deck").reduce((sum, bay) => sum + bay.amount, 0);
        return [
            `## ${sample.name}`,
            "",
            sample.forum
                ? `*${forumCreditLine(sample.forum)}, ${sample.forum.url}; built by NGCFells on the Flotation Hull. NOT OFFICIAL.*`
                : `*${sample.credit}${sample.credit === "Vehrec" ? ", built by NGCFells" : ""}. Custom Homebrew, NOT OFFICIAL.*`,
            "",
            `- **Type:** Aerodyne DropShip on the Flotation Hull, ${sample.tonnage.toLocaleString("en-US")} tons; safe thrust ${craft.getSafeThrust()}, `
                + `maximum ${craft.getMaxThrust()}; Structural Integrity ${craft.getStructuralIntegrity()}`,
            `- **Afloat:** Cruise 2, Flank 3`,
            ...(wellDecks ? [`- **Well deck:** ${wellDecks} vehicle${wellDecks === 1 ? "" : "s"} of up to 50 tons, hover or naval`] : []),
            `- **Unspent tonnage:** ${tons(craft.getRemainingTonnage())}`,
            `- **Battle Value:** ${craft.getBattleValue().toLocaleString("en-US")}; **cost:** ${craft.getCBillCost().toLocaleString("en-US")} C-bills`,
            ...(production.manufacturer ? [`- **Manufacturer:** ${production.manufacturer}`] : []),
            "",
            text.overview ?? "",
            "",
            text.capabilities ?? "",
            "",
            text.deployment ?? "",
            "",
            text.notes ?? "",
        ].join("\n").replace(/\n{3,}/g, "\n\n");
    }).join("\n\n");
}
