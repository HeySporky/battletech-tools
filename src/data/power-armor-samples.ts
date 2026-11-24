import { BattleMech } from "../classes/battlemech";
import { FW_POWER_ARMOR_RULESET } from "./future-wars-power-armor";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";

/*
 * Sample Power Armor suits (Custom Homebrew, NOT OFFICIAL), loadable from the 'Mech Creator's step 1 at the Custom
 * Homebrew level. IPA-1 to IPA-3 are the three record sheets Future Wars #14 printed after Bill Swisher's article
 * (printed pp.43-45, read from the page images); the Best of Future Wars reprint left them out. IPA-4 is NGCFells's.
 * NGCFells's rulings 2026-11-17 (plan Chunk E): no sheet fills in its armor, so it is spread as the creator's Best Guess
 * spreads a 'Mech's; IPA-2's jump 3 gets the missing third jet in RT 3; IPA-1 and IPA-3 are named after the series.
 */

type Loc = "lt" | "rt" | "la" | "ra" | "ll" | "rl";
/** [tag, location, slot on the sheet (1 to 6), name, slots, weight]: a weight marks a weapon; jets and heat sinks have none. */
type Item = [string, Loc, number, string, number, number?];

interface IPowerArmorSpec {
    id: string;
    model: string;
    tonnage: number;
    walk: number;
    jump: number;
    items: Item[];
    /** Armor as built, when the design gives it; otherwise every ton left over, spread by the creator's Best Guess. */
    armor?: { weight: number; allocation: Record<string, number> };
    piloting?: number;
    overview: string;
    notes: string;
}

const HS = (loc: Loc, slot: number): Item => ["heat-sink", loc, slot, "Heat Sink", 1];
const JJ = (loc: Loc, slot: number): Item => ["jj-standard", loc, slot, "Standard Jump Jets", 1];
const SL = (loc: Loc, slot: number): Item => ["small-laser", loc, slot, "Small Laser", 1, 0.5];
const ML = (loc: Loc, slot: number): Item => ["medium-laser", loc, slot, "Medium Laser", 1, 1];
const LL = (loc: Loc, slot: number): Item => ["large-laser", loc, slot, "Large Laser", 2, 5];

const CREDIT = "Custom Homebrew, NOT OFFICIAL. Power Armor by Bill Swisher, \"Power Armor: The Poor Man's Battlemech\", Future Wars #14 (1989) p.39, reprinted in The Best of Future Wars, Volume One (1991) pp.14-16.";
const SHEET = (page: number) => `${CREDIT} This suit is the record sheet printed in Future Wars #14 p.${page} (not in the reprint): tonnage, movement, weapons, heat sinks and slots as printed.`;
const ARMOR_OURS = "The sheet leaves the armor blank, so the armor is NGCFells's: every ton left over, spread as the 'Mech Creator spreads a 'Mech's.";
const NAME_OURS = (page: number, why: string) => `NGCFells could not read the suit's name on the scan (${why}), so the name is NGCFells's, after IPA-2 on p.44; p.${page}'s design is the article's.`;

const SPECS: IPowerArmorSpec[] = [
    {
        id: "ipa-1", model: "IPA-1", tonnage: 10, walk: 14, jump: 0,
        items: [HS("la", 5), SL("ra", 5), HS("ll", 5), HS("ll", 6), HS("rl", 5), HS("rl", 6)],
        overview: "The fastest of the three suits Future Wars printed: a 10-ton runner with one small laser, walking 14.",
        notes: `${SHEET(43)} ${NAME_OURS(43, "the top of the sheet is cut off above Tonnage")} ${ARMOR_OURS}`,
    },
    {
        id: "ipa-2", model: "IPA-2", tonnage: 10, walk: 7, jump: 3,
        items: [SL("la", 5), SL("la", 6), ML("ra", 5), HS("ra", 6), HS("lt", 1), JJ("lt", 2), HS("lt", 3), HS("rt", 1), JJ("rt", 2), JJ("rt", 3),
            HS("ll", 5), HS("ll", 6), HS("rl", 5), HS("rl", 6)],
        overview: "A 10-ton jumper with a medium laser and two small lasers, the one suit Future Wars named on its sheet (written \"I PA - 2\").",
        notes: `${SHEET(44)} The sheet gives Jumping 3 but draws two jump jets (LT 2, RT 2); we added the third in the free right torso slot (RT 3), by NGCFells's ruling. ${ARMOR_OURS}`,
    },
    {
        id: "ipa-3", model: "IPA-3", tonnage: 15, walk: 3, jump: 2,
        items: [ML("la", 5), HS("la", 6), LL("ra", 5), SL("lt", 1), HS("lt", 2), HS("lt", 3), JJ("lt", 4), SL("rt", 1), HS("rt", 2), HS("rt", 3), JJ("rt", 4),
            HS("ll", 5), HS("ll", 6), HS("rl", 5), HS("rl", 6)],
        overview: "The heaviest suit Future Wars printed: 15 tons, slow, with a large laser, a medium laser and two small lasers.",
        notes: `${SHEET(45)} ${NAME_OURS(45, "the top half of the type line is cut off; its lower halves fit \"I PA - 3\"")} ${ARMOR_OURS}`,
    },
    {
        id: "ipa-4", model: "IPA-4", tonnage: 5, walk: 6, jump: 0, piloting: 3,
        items: [SL("la", 5), SL("ra", 5), HS("ra", 6), HS("lt", 1), HS("lt", 2), HS("rt", 1), HS("rt", 2), HS("ll", 5), HS("ll", 6), HS("rl", 5), HS("rl", 6)],
        armor: { weight: 1.5, allocation: { head: 2, centerTorso: 5, centerTorsoRear: 1, leftTorso: 4, rightTorso: 4, leftArm: 2, rightArm: 2, leftLeg: 2, rightLeg: 2 } },
        overview: "A 5-ton suit with two small lasers: no gyro, a shielded fusion engine and every point of armor its frame can hold.",
        notes: `${CREDIT} IPA-4 is NGCFells's, design and name: no Future Wars sheet is 5 tons, so NGCFells built one under the article's 5-ton rules and numbered it after the three printed suits. Its pilot has Piloting 3, as a 5-ton suit asks.`,
    },
];

const LOCATIONS = ["head", "centerTorso", "rightTorso", "leftTorso", "centerTorsoRear", "rightTorsoRear", "leftTorsoRear", "leftArm", "rightArm", "leftLeg", "rightLeg", "centerLeg", "frontLeftLeg", "frontRightLeg"];

// Stable ids for the slots, so a sample loads the same way every time.
const uuidFor = (id: string, index: number): string => {
    let hash = 0;
    for (const char of `${id}-${index}`) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    const hex = (hash.toString(16) + "00000000").slice(0, 8);
    return `${hex}-0000-4000-8000-${(index + 1).toString(16).padStart(12, "0")}`;
};

const build = (spec: IPowerArmorSpec): BattleMech => {
    const allocation: object[] = [];
    const equipment: object[] = [];
    spec.items.forEach(([tag, loc, sheetSlot, name, crits, weight], index) => {
        const uuid = uuidFor(spec.id, index);
        const slot = sheetSlot - 1;
        allocation.push({ uuid, name, tag, loc, rear: false, crits, movable: true, size: crits, slot });
        if (weight !== undefined) equipment.push({ tag, loc, allocationIndex: slot, allocationLocation: loc, rear: false, uuid, weight });
    });
    const armorAllocation = Object.fromEntries(LOCATIONS.map(location => [location, spec.armor?.allocation[location] ?? 0]));
    const mech = new BattleMech(JSON.stringify({
        model: spec.model,
        name: "Power Armor",
        tech: "is",
        tonnage: spec.tonnage,
        omnimech: false,
        additionalHeatSinks: 0,
        allocation,
        armor_allocation: armorAllocation,
        armor_type: "standard",
        armor_weight: spec.armor?.weight ?? 0,
        engineType: "standard",
        engineTechBase: "is",
        equipment,
        era: "late-sw-rn",
        rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
        rulesets: [FW_POWER_ARMOR_RULESET],
        features: [],
        gyro: "standard",
        heat_sink_type: "single",
        jump_jet_type: "standard",
        myomer_type: "standard",
        is_type: "standard",
        walkSpeed: spec.walk,
        jumpSpeed: spec.jump,
        mechType: "biped",
        mirrorArmorAllocations: true,
        strictEra: true,
        uuid: uuidFor(spec.id, 999),
        lastUpdated: "2026-11-17T00:00:00.000Z",
        pilot: { name: "", piloting: spec.piloting ?? 5, gunnery: 4, wounds: 0, alphaStrikeAbilities: [], eiImplants: false },
        tro: { text: { overview: spec.overview, notes: spec.notes } },
    }));
    if (!spec.armor) {
        mech.setArmorWeight(Math.min(Math.floor(mech.getRemainingTonnage() * 2) / 2, mech.getMaxArmorTonnage()));
        mech.allocateArmorSane();
    }
    return mech;
};

export interface IPowerArmorSample {
    id: string;
    name: string;
    save: object;
}

let samples: IPowerArmorSample[] | null = null;

/** The four sample suits, built the first time they are asked for. */
export const getAllPowerArmorSamples = (): IPowerArmorSample[] => {
    samples ??= SPECS.map(spec => ({ id: spec.id, name: `${spec.model} (${spec.tonnage} t, ${spec.id === "ipa-4" ? "NGCFells" : "Future Wars #14"})`, save: build(spec).export() }));
    return samples;
};

/** Each weapon once, with a count before it when there is more than one: "2 Small Laser, Medium Laser". */
const weaponList = (mech: BattleMech): string => {
    const counts = new Map<string, number>();
    for (const item of mech.getInstalledEquipment()) counts.set(item.name, (counts.get(item.name) ?? 0) + 1);
    return [...counts].map(([name, count]) => count > 1 ? `${count} ${name}` : name).join(", ");
};

/** The TRO - JBT page for the samples, its figures read from the designs so that they match the creator. */
export const getPowerArmorSamplesReadout = (): string => {
    const rows = SPECS.map(spec => {
        const mech = new BattleMech(JSON.stringify(getAllPowerArmorSamples().find(sample => sample.id === spec.id)!.save));
        const card = mech.calcAlphaStrike();
        const source = spec.id === "ipa-4" ? "NGCFells" : `FW #14 p.${43 + SPECS.indexOf(spec)}`;
        return `| ${spec.model} | ${source} | ${spec.tonnage} | ${mech.getWalkSpeed()} / ${mech.getRunSpeed()} / ${mech.getJumpSpeed()} | ${weaponList(mech)} | ${mech.getTotalArmor()} | ${mech.getBattleValue()} | ${mech.getCostBreakdown().result?.toLocaleString("en-US") ?? "-"} | ${card?.basePoints ?? "-"} |`;
    });
    return [
        "## The Sample Suits",
        "",
        "*Future Wars* #14 printed three suits on standard 'Mech record sheets after Swisher's article (pp. 43-45). The",
        "reprint left them out. They load from step 1 of the 'Mech Creator at the Custom Homebrew level, under \"Sample",
        "Power Armor\", with the ruleset ticked. A fourth suit, IPA-4, is NGCFells's: no printed sheet is 5 tons.",
        "",
        "| Suit | Source | Tons | Walk / Run / Jump | Weapons | Armor | Battle Value | Cost (C-bills) | Alpha Strike PV |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
        ...rows,
        "",
        "**What is NGCFells's in the printed suits:** no sheet fills in its armor, so each carries every ton left over, spread as",
        "the 'Mech Creator spreads a 'Mech's. The IPA-2's sheet gives Jumping 3 but draws two jump jets, so NGCFells added a third",
        "in its free right torso slot. Only the IPA-2's sheet shows its name in full (\"I PA - 2\"). The top of the IPA-1's",
        "sheet is cut off, and only the lower half of the IPA-3's name survives, so both names are NGCFells's, after the IPA-2.",
        "Battle Value, cost and the Alpha Strike values are worked out as the sections above describe.",
    ].join("\n");
};

/** The samples a rules level offers: Custom Homebrew only. */
export function getPowerArmorSamples(rulesLevel: number): IPowerArmorSample[] {
    return rulesLevel >= CUSTOM_HOMEBREW_RULES_LEVEL ? getAllPowerArmorSamples() : [];
}
