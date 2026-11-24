import { WALKER_LOCATIONS } from "../data/walker-construction";
import Walker, { formatWalkerASDamage } from "./walker";

/*
 * A walker as a printed Technical Readout entry, in Markdown for the TRO - JBT reader: the header block, the history,
 * capabilities and deployment, the stat block (with the ten-location structure and armor table and the weapons by
 * location), then the Alpha Strike card line. Made from the design, so the figures always match the creator.
 */

const kph = (mp: number): string => `${Math.round(mp * 10.8)} kph`;
const tons = (weight: number): string => (weight === 0 ? "0" : `${weight}`);
const thousands = (value: number): string => value.toLocaleString("en-US");

/** A column of the stat block, padded so the figures line up in the monospaced block. */
const row = (label: string, middle: string, mass: string): string => `${label.padEnd(30)}${middle.padStart(8)}${mass.padStart(9)}`;

/** "3 Medium Lasers" style counts, in the order the weapons were mounted. */
const armament = (walker: Walker): string => {
    const counts = new Map<string, number>();
    for (const each of walker.getEquipment().filter((item) => !item.isAmmo)) counts.set(each.name, (counts.get(each.name) ?? 0) + 1);
    return [...counts].map(([name, count]) => (count > 1 ? `${count} ${name}s` : `1 ${name}`)).join(", ");
};

export function getWalkerStatBlock(walker: Walker): string {
    const weight = (name: string): number => walker.getWeightLog().filter((line) => line.name === name).reduce((sum, line) => sum + line.weight, 0);
    const where = (item: ReturnType<Walker["getEquipment"]>[number]): string =>
        `${item.location.toUpperCase()}${item.split ? `/${item.split.location.toUpperCase()}` : ""}${item.inTurret ? " (T)" : ""}`;
    const lines = [
        `Type: ${walker.getDisplayName()}`,
        `Technology Base: ${walker.getTechTag() === "clan" ? "Clan" : "Inner Sphere"} (Custom Homebrew)`,
        `Tonnage: ${walker.getTons()}`,
        `Battle Value: ${thousands(walker.getBattleValue())} (provisional)`,
        "",
        row("Equipment", "", "Mass"),
        row("Internal Structure:", "", tons(weight("Internal Structure"))),
        row(`Engine (${walker.getEngineName()}):`, `${walker.getEngineRating()}`, tons(weight("Engine"))),
        `    Walking MP: ${walker.getWalkerWalkMP()} (${walker.getWalkMP()} rated, on two legs)`,
        `    Running MP: ${walker.getRunMP()}`,
        `    Jumping MP: ${walker.getJumpMP()}`,
        row("Heat Sinks:", `${walker.getHeatSinks()}`, tons(weight("Heat Sinks"))),
        row("Gyro:", "", tons(weight("Gyro"))),
        row("Cockpit:", "", tons(weight("Cockpit"))),
        ...(walker.hasTurret() ? [row("Turret:", "", tons(weight("Turret")))] : []),
        ...(walker.getJumpMP() > 0 ? [row("Jump Jets:", `${walker.getJumpMP()}`, tons(weight("Jump Jets")))] : []),
        row("Armor Factor:", `${walker.getArmorPoints()}`, tons(walker.getArmorWeight())),
        "",
        `${"".padEnd(26)}${"Internal".padStart(10)}${"Armor".padStart(8)}`,
        `${"".padEnd(26)}${"Structure".padStart(10)}${"Value".padStart(8)}`,
        ...WALKER_LOCATIONS.map((location) => `${walker.getLocationName(location).padEnd(26)}${`${walker.getStructure(location)}`.padStart(10)}${`${walker.getArmor(location)}`.padStart(8)}`),
        "",
        `${"Weapons and Ammo".padEnd(26)}${"Location".padStart(10)}${"Critical".padStart(10)}${"Tonnage".padStart(9)}`,
        ...walker.getEquipment().map((item) => `${item.name.padEnd(26)}${where(item).padStart(10)}${`${item.slots}`.padStart(10)}${tons(item.weight).padStart(9)}`),
    ];
    return lines.join("\n");
}

/** One full entry: the header block, the readout text, the stat block and the Alpha Strike card line. */
export function getWalkerReadout(walker: Walker): string {
    const text = (key: Parameters<Walker["tro"]["getText"]>[0]): string => walker.tro.getText(key).trim();
    const made = (key: Parameters<Walker["tro"]["getProduction"]>[0]): string => walker.tro.getProduction(key).trim() || "Unknown";
    const card = walker.getAlphaStrikeStats();
    const damage = [card.damageValues.short, card.damageValues.medium, card.damageValues.long].map(formatWalkerASDamage).join("/");
    const sections: string[] = [
        `### ${walker.getDisplayName()}`,
        [
            `**Mass:** ${walker.getTons()} tons`,
            `**Chassis:** ${walker.isIndustrial() ? "Industrial " : ""}Walker, four-legged`,
            `**Power Plant:** ${walker.getEngineRating()} ${walker.getEngineName()}`,
            `**Cruising Speed:** ${kph(walker.getWalkerWalkMP())}`,
            `**Maximum Speed:** ${kph(walker.getRunMP())}`,
            `**Jump Jets:** ${walker.getJumpMP() > 0 ? `${walker.getJumpMP() * 30} meters` : "None"}`,
            `**Armor:** ${walker.getArmorPoints()} points (${walker.getArmorWeight()} tons)`,
            `**Armament:** ${armament(walker)}`,
            `**Manufacturer:** ${made("manufacturer")}`,
            `**Primary Factory:** ${made("primaryFactory")}`,
            `**Communications System:** ${made("communications")}`,
            `**Targeting and Tracking System:** ${made("targeting")}`,
        ].map((line) => `- ${line}`).join("\n"),
    ];
    for (const [heading, key] of [["Overview", "overview"], ["Capabilities", "capabilities"], ["Deployment", "deployment"]] as const) {
        if (text(key)) sections.push(`#### ${heading}`, text(key));
    }
    sections.push("```\n" + getWalkerStatBlock(walker) + "\n```");
    sections.push(
        "#### Alpha Strike (NOT OFFICIAL)",
        [
            "| Type | Size | Move | TMM | Armor / Structure | Damage S/M/L | OV | Specials | Point Value |",
            "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
            `| ${card.type} | ${card.size} | ${card.move} | ${card.tmm} | ${card.armor} / ${card.structure} | ${damage} | ${card.overheat} | ${card.specialAbilities.join(", ")} | ${card.pointValue} |`,
        ].join("\n"),
    );
    if (text("notes")) sections.push(`*${text("notes")}*`);
    return sections.join("\n\n");
}
