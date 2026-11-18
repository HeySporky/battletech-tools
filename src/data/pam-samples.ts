import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";

/*
 * Sample Permanent Air 'Mechs (Custom Homebrew), loadable from the 'Mech Creator's step 1 at the Custom Homebrew level.
 * The designs are LAMFAN's "Air-Slip Mechs" (BattleTech forums topic 83239, 22 Nov 2023), the light 'Mechs of the Logan
 * Prime Militia; Red Pins answered in that thread (reply #4) that he calls the same idea "Permanent Air-Mechs" (topic 44833).
 * They are rebuilt here under our Permanent Air 'Mech rules (LAM_TYPE_RULES.pam), so each note says what changed.
 */

type Loc = "hd" | "ct" | "lt" | "rt" | "la" | "ra" | "ll" | "rl";
/** [tag, location, name, slots, weight]: a weight marks a weapon or ammunition bin; jump jets and heat sinks have none. */
type Item = [string, Loc, string, number, number?];

interface IPAMSpec {
    id: string;
    name: string;
    model: string;
    tonnage: number;
    walk: number;
    jump: number;
    armorWeight: number;
    /** HD, CT, RT, LT, CT rear, RT rear, LT rear, LA, RA, LL, RL. */
    armor: number[];
    additionalHeatSinks: number;
    items: Item[];
    overview: string;
    changes: string;
}

// The first slot free of fixed items: CT after a standard engine and gyro, side torsos after the LAM avionics, limbs
// after their four actuators. The head is full (cockpit, sensors, life support and avionics).
const FIRST_FREE: Record<Loc, number> = { hd: 6, ct: 10, lt: 1, rt: 1, la: 4, ra: 4, ll: 4, rl: 4 };

const JJ: [string, string, number] = ["jj-standard", "Standard Jump Jets", 1];
const HS: [string, string, number] = ["heat-sink", "Heat Sink", 1];
const jj = (loc: Loc, count = 1): Item[] => Array.from({ length: count }, () => [JJ[0], loc, JJ[1], JJ[2]]);
const hs = (loc: Loc, count = 1): Item[] => Array.from({ length: count }, () => [HS[0], loc, HS[1], HS[2]]);
const ML = (loc: Loc): Item => ["medium-laser", loc, "Medium Laser", 1, 1];
const SRM4 = (loc: Loc): Item => ["srm-4", loc, "SRM 4", 1, 2];
const SRM_AMMO = (loc: Loc): Item => ["ammo-srm-standard", loc, "SRM - Standard Ammo", 1, 1];

const SOURCE = "Custom Homebrew. Design by LAMFAN, \"Air-Slip Mechs\", BattleTech forums topic 83239 (22 Nov 2023): https://battletech.com/forums/index.php?topic=83239.0. Inspired by: LAMFAN's Air-Slip Mechs and Red Pins' Permanent Air-Mechs (topic 44833; Red Pins, topic 83239 reply #4). Built under our Permanent Air 'Mech rules, our extrapolation from the LAM rules, not the author's:";
const COMMON = "the wings weigh as the post's Partial Wing but take no slots and add no Jump MP; a required ton of fuel; AirMech Cruise MP is Jump MP x 3 (the post uses (jump jets + 2) x 2) and no bomb bays; standard armor for the post's Durallex Light; the slot layout is NGCFells's where the post does not give it.";
const FUEL_CUT = "Two jump jets (1 ton) come out to carry the fuel";

const SPECS: IPAMSpec[] = [
    {
        id: "sparrow-spw-2j", name: "Sparrow SPW-2J", model: "SPW-2J", tonnage: 25, walk: 8, jump: 6, armorWeight: 3,
        armor: [9, 6, 7, 7, 1, 1, 1, 3, 3, 5, 5], additionalHeatSinks: 0,
        items: [...jj("ll"), ...hs("ct", 2), ...jj("rt", 2), ...jj("lt", 2), ...jj("rl")],
        overview: "An unarmed scout and racer of 2844 that fights with hand-held weapons. Hit-and-run, harassment and racing.",
        changes: `${FUEL_CUT}, one from each leg: Jump MP 8 to 6, AirMech Cruise 18. The post lists its two placed heat sinks at 2 tons; its weights only add up as the engine's free ten.`,
    },
    {
        id: "magpie-mgp-1e", name: "Magpie MGP-1E", model: "MGP-1E", tonnage: 30, walk: 6, jump: 4, armorWeight: 5.5,
        armor: [9, 13, 10, 10, 4, 2, 2, 8, 8, 11, 11], additionalHeatSinks: 0,
        items: [...jj("ll"), ...hs("ct"), SRM_AMMO("ct"), ...hs("rt"), ...jj("rt"), SRM4("rt"), ...hs("lt"), ...jj("lt"), ML("lt"), ...jj("rl")],
        overview: "The primary engagement unit of the Logan Prime Militia (2848): an SRM-4 and a medium laser for scouting, hit-and-run and swarm attacks.",
        changes: `${FUEL_CUT}, one from each leg: Jump MP 6 to 4, AirMech Cruise 12.`,
    },
    {
        id: "magpie-mgp-3a", name: "Magpie MGP-3A", model: "MGP-3A", tonnage: 30, walk: 7, jump: 5, armorWeight: 4,
        armor: [7, 9, 7, 7, 2, 2, 2, 6, 6, 8, 8], additionalHeatSinks: 0,
        items: [...jj("ll"), ...jj("ct"), ...hs("rt"), ...jj("rt"), ML("rt"), ...hs("lt"), ...jj("lt"), ML("lt"), ...jj("rl")],
        overview: "The primary intercept unit of the Logan Prime Militia (2848): faster than the 1E, with two medium lasers.",
        changes: `${FUEL_CUT}, one from each leg: Jump MP 7 to 5, AirMech Cruise 15.`,
    },
    {
        id: "dire-hawk-drh-4k", name: "Dire Hawk DRH-4K", model: "DRH-4K", tonnage: 50, walk: 5, jump: 5, armorWeight: 8.5,
        armor: [9, 19, 16, 16, 6, 4, 4, 12, 12, 19, 19], additionalHeatSinks: 1,
        items: [...jj("ll"), ...jj("ct"), SRM_AMMO("ct"), ...hs("rt"), ML("rt"), ...jj("rt"), SRM4("rt"), ...jj("lt"), ["large-laser", "lt", "Large Laser", 2, 5], ...jj("rl")],
        overview: "A 2867 hit-and-run and harassment 'Mech: a large laser, a medium laser and an SRM-4.",
        changes: "the post's weights add to 48 of its 50 tons, so the fuel fits and 1 ton is spare.",
    },
    {
        id: "dire-hawk-drh-3d", name: "Dire Hawk DRH-3D", model: "DRH-3D", tonnage: 50, walk: 6, jump: 4, armorWeight: 9.5,
        armor: [9, 22, 17, 17, 7, 5, 5, 14, 14, 21, 21], additionalHeatSinks: 0,
        items: [...jj("ll"), ML("rt"), ...jj("rt"), ["rocket-launcher-10", "rt", "Rocket Launcher 10", 1, 0.5], ["rocket-launcher-10", "rt", "Rocket Launcher 10", 1, 0.5],
            ML("lt"), ...jj("lt"), ["rocket-launcher-10", "lt", "Rocket Launcher 10", 1, 0.5], ["rocket-launcher-10", "lt", "Rocket Launcher 10", 1, 0.5], ...jj("rl")],
        overview: "A 2867 hit-and-run, harassment and bombardment 'Mech: two medium lasers and four 10-tube rocket launchers.",
        changes: `${FUEL_CUT}, the two in the center torso: Jump MP 6 to 4, AirMech Cruise 12.`,
    },
];

// Stable ids for the slots, so a sample loads the same way every time.
const uuidFor = (id: string, index: number): string => {
    let hash = 0;
    for (const char of `${id}-${index}`) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    const hex = (hash.toString(16) + "00000000").slice(0, 8);
    return `${hex}-0000-4000-8000-${(index + 1).toString(16).padStart(12, "0")}`;
};

const buildSave = (spec: IPAMSpec): object => {
    const next: Record<string, number> = { ...FIRST_FREE };
    const allocation: object[] = [];
    const equipment: object[] = [];
    spec.items.forEach(([tag, loc, name, crits, weight], index) => {
        const uuid = uuidFor(spec.id, index);
        const slot = next[loc];
        next[loc] += crits;
        allocation.push({ uuid, name, tag, loc, rear: false, crits, movable: true, size: crits, slot });
        if (weight !== undefined) equipment.push({ tag, loc, allocationIndex: slot, allocationLocation: loc, rear: false, uuid, weight });
    });
    const [head, centerTorso, rightTorso, leftTorso, centerTorsoRear, rightTorsoRear, leftTorsoRear, leftArm, rightArm, leftLeg, rightLeg] = spec.armor;
    return {
        model: spec.model,
        name: spec.name.split(" ").slice(0, -1).join(" "),
        tech: "is",
        tonnage: spec.tonnage,
        omnimech: false,
        additionalHeatSinks: spec.additionalHeatSinks,
        allocation,
        armor_allocation: { head, centerTorso, rightTorso, leftTorso, centerTorsoRear, rightTorsoRear, leftTorsoRear, leftArm, rightArm, leftLeg, rightLeg, centerLeg: 0, frontLeftLeg: 0, frontRightLeg: 0 },
        armor_type: "standard",
        armor_weight: spec.armorWeight,
        engineType: "standard",
        engineTechBase: "is",
        equipment,
        era: "ilClan",
        features: [],
        gyro: "standard",
        heat_sink_type: "single",
        jump_jet_type: "standard",
        myomer_type: "standard",
        is_type: "standard",
        walkSpeed: spec.walk,
        jumpSpeed: spec.jump,
        mechType: "lam",
        lamType: "pam",
        transformationMode: "airmech",
        mirrorArmorAllocations: false,
        strictEra: true,
        uuid: uuidFor(spec.id, 999),
        lastUpdated: "2026-11-12T00:00:00.000Z",
        tro: { text: { overview: spec.overview, notes: `${SOURCE} ${COMMON} For this design: ${spec.changes}` } },
    };
};

export const PAM_SAMPLES: { id: string; name: string; save: object }[] = SPECS.map(spec => ({ id: spec.id, name: `${spec.name} (Air-Slip Mech, LAMFAN)`, save: buildSave(spec) }));

export function getPAMSamples(rulesLevel: number): { id: string; name: string; save: object }[] {
    return rulesLevel >= CUSTOM_HOMEBREW_RULES_LEVEL ? PAM_SAMPLES : [];
}
