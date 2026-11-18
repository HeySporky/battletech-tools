import { BattleMech } from "../classes/battlemech";
import { PAM_SAMPLES } from "./pam-samples";
import { VTOLAM_SAMPLES } from "./vtolam-samples";

/*
 * The TRO - JBT entries for the sample VTOLAMs and Permanent Air 'Mechs: one page a design, its figures read from the
 * design itself so that they always match the 'Mech Creator, and its readout text and credit notes from the save.
 */

interface ILAMSample { id: string; name: string; save: object }
interface ISaveText { tro?: { text?: Record<string, string | undefined> } }

/** The picker's name without the rules or author it adds: "Firefly VTOLAM (Battletech Into The Future rules)" -> "Firefly VTOLAM". */
export const lamSampleDesignName = (name: string): string =>
    name.replace(/ \((BishopSteiner|Battletech Into The Future) rules\)$/, "").replace(/ \(Air-Slip Mech, LAMFAN\)$/, "");

/** Each weapon once, with a count when there is more than one; ammunition is left to the stat lines. */
const armament = (mech: BattleMech): string => {
    const counts = new Map<string, number>();
    for (const item of mech.getInstalledEquipment()) {
        if (/ammo/i.test(item.name)) continue;
        counts.set(item.name, (counts.get(item.name) ?? 0) + 1);
    }
    return [...counts].map(([name, count]) => count > 1 ? `${count} ${name}` : name).join(", ") || "None";
};

const RULES: Record<string, string> = {
    vtolam: "BishopSteiner's VTOLAM rules",
    "vtolam-btitf": "professorheyteen's VTOLAM rules (Battletech Into The Future)",
    pam: "Permanent Air 'Mech rules (NGCFells's, Inspired by Red Pins and LAMFAN)",
};

function entry(sample: ILAMSample): string {
    const mech = new BattleMech(JSON.stringify(sample.save));
    const text = (sample.save as ISaveText).tro?.text ?? {};
    const lamType = mech.getLAMType();
    const second = lamType === "pam"
        ? `AirMech ${mech.getAirMechCruiseMP()} / ${mech.getAirMechFlankMP()}`
        : `VTOL ${mech.getVTOLAMCruiseMP()} / ${mech.getVTOLAMFlankMP()}`;
    const provisional = lamType === "vtolam-btitf" ? "" : " (provisional)";
    const card = mech.calcAlphaStrike();
    const lines = [
        `### ${lamSampleDesignName(sample.name)}`,
        [
            `**Rules:** ${RULES[lamType] ?? lamType}`,
            `**Mass:** ${mech.getTonnage()} tons`,
            `**Movement:** walk / run / jump ${mech.getWalkSpeed()} / ${mech.getRunSpeed()} / ${mech.getJumpSpeed()}; ${second}`,
            `**Armor:** ${mech.getTotalArmor()} points`,
            `**Weapons and Equipment:** ${armament(mech)}`,
            `**Battle Value:** ${mech.getBattleValue().toLocaleString("en-US")}${provisional}`,
            `**Cost:** ${mech.getCostBreakdown().result?.toLocaleString("en-US") ?? "-"} C-bills`,
            `**Alpha Strike Point Value:** ${card?.basePoints ?? "-"} (NOT OFFICIAL)`,
        ].map((line) => `- ${line}`).join("\n"),
    ];
    for (const [heading, key] of [["Overview", "overview"], ["Capabilities", "capabilities"], ["Deployment", "deployment"], ["History", "history"]] as const) {
        const body = text[key]?.trim();
        if (body) lines.push(`#### ${heading}`, body);
    }
    if (text.notes?.trim()) lines.push("#### Source and Notes", text.notes.trim());
    return lines.join("\n\n");
}

export const getVTOLAMSamplesReadout = (): string => VTOLAM_SAMPLES.map(entry).join("\n\n");

export const getPAMSamplesReadout = (): string => PAM_SAMPLES.map(entry).join("\n\n");
