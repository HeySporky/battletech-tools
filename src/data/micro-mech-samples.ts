import type { IMicroMechExport, IMicroMechMountExport } from "../classes/micro-mech";
import type { MicroMechLocation } from "./micro-mech-construction";

/*
 * Sample Micro-Mechs (Custom Homebrew), the four designs "Micro-Mechs" 6.1.0.2 prints (PDF pages 16 to 22), loadable from
 * the Micro-Mech Creator's home. The rules are Solarmech's; this version of them was revised by an unnamed editor with
 * Discord. Each design is the document's, built under NGCFells's Micro-Mech rules (6.1.0.2), and its notes say every place where
 * our figure or the document's text differs from its print.
 */

interface IMicroMechSampleSpec {
    id: string;
    name: string;
    tons: number;
    layout: "biped" | "quad";
    walkMP: number;
    jumpJets: number;
    lowerArms?: { left: boolean; right: boolean };
    armor: Partial<Record<MicroMechLocation, number>>;
    mounts: IMicroMechMountExport[];
    overview: string;
    differences: string;
}

const CREDIT = "Custom Homebrew, NOT OFFICIAL. Design from \"Micro-Mechs\" version 6.1.0.2 (rules by Solarmech; this version revised by an unnamed editor with Discord), built under NGCFells's Micro-Mech rules.";

const SPECS: IMicroMechSampleSpec[] = [
    {
        id: "storm-stm-3x", name: "Storm STM-3X", tons: 11, layout: "biped", walkMP: 6, jumpJets: 6,
        armor: { head: 4, torso: 16, torsoRear: 6, la: 4, ra: 4, ll: 6, rl: 6 },
        mounts: [
            { tag: "micro-er-laser-small", location: "ra" },
            { tag: "micro-machine-gun", location: "la", ammo: [{ type: "standard", kg: 500, location: "torso" }] },
        ],
        overview: "A fast jumping scout that skirmishes with an ER small laser and a machine gun.",
        differences: "Weight (10,975 kg) and cost (695,853 C-bills) agree with the print. Battle Value: the rules text gives 223 and the print 217; the app keeps the rules text. The print's totals line says 24 of 26 slots used; by its slot tables it is 25, which is what the app counts.",
    },
    {
        id: "tunnel-rat-tnr-1x", name: "Tunnel Rat TNR-1X", tons: 13, layout: "biped", walkMP: 4, jumpJets: 4,
        lowerArms: { left: false, right: true },
        armor: { head: 4, torso: 18, torsoRear: 6, la: 4, ra: 4, ll: 6, rl: 6 },
        mounts: [
            { tag: "micro-er-laser-medium", location: "ra" },
            { tag: "micro-grenade-launcher", location: "head", ammo: [{ type: "standard", kg: 500, location: "torso" }] },
            { tag: "micro-beagle-active-probe", location: "torso" },
            { tag: "micro-recoilless-rifle-heavy", location: "la", ammo: [{ type: "standard", kg: 500, location: "la" }] },
        ],
        overview: "A tunnel and city scout: a probe, a grenade launcher in the head and a heavy recoilless rifle in the arm that has no hand.",
        differences: "Weight (12,975 kg) agrees with the print. The print's mass (90 tons), jump (0), cost (8,993,460), Battle Value (1,117) and BattleForce armor are corrupt, so the cost (990,510) and Battle Value (309) here are NGCFells's. The print lists 6 free heat sinks; the text says the rating divided by ten, rounded down, which is 5. Under Solarmech's 2019 post it is not legal (a head weapon, arm ammunition).",
    },
    {
        id: "hillman-hmn-2x", name: "Hillman HMN-2X", tons: 15, layout: "quad", walkMP: 5, jumpJets: 0,
        armor: { head: 4, torso: 18, torsoRear: 8, fll: 4, frl: 4, ll: 8, rl: 8 },
        mounts: [
            { tag: "micro-pulse-laser-small", location: "head" },
            { tag: "micro-lrm-9", location: "torso", ammo: [{ type: "standard", kg: 750, location: "torso" }] },
        ],
        overview: "A quad fire-support walker with an LRM 9 and a small pulse laser.",
        differences: "Weight (14,975 kg) and cost (852,898 C-bills, with the 750 kg of ammunition) agree with the print. Battle Value: the rules text gives 339 and the print 352; the app keeps the rules text. The print lists 8 free heat sinks (the text gives 7) and 27 structure points where its own table gives 31; its heading says \"Hillman\", its text \"Hillsman\", and its weapon line \"LMR-9\". The app follows the text and the table.",
    },
    {
        id: "slayer-sl-x4", name: "Slayer SL-X4", tons: 18, layout: "quad", walkMP: 5, jumpJets: 5,
        armor: { head: 4, torso: 20, torsoRear: 4, fll: 8, frl: 8, ll: 8, rl: 8 },
        mounts: [
            { tag: "micro-laser-large", location: "torso" },
            { tag: "micro-laser-small", location: "head" },
        ],
        overview: "A quad that jumps, with a large laser in the torso and a small laser in the head.",
        differences: "Weight (17,925 kg), cost (1,073,387 C-bills) and Battle Value (531) agree with the print. The print writes its engine as \"09 Fusion\" (rating 90).",
    },
];

// Stable ids, so a sample loads the same way every time.
const uuidFor = (id: string): string => {
    let hash = 0;
    for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return `${hash.toString(16).padStart(8, "0")}-0000-4000-8000-000000000173`;
};

const buildSave = (spec: IMicroMechSampleSpec): IMicroMechExport => ({
    format: 1,
    version: "6.1.0.2",
    uuid: uuidFor(spec.id),
    name: spec.name,
    tons: spec.tons,
    layout: spec.layout,
    walkMP: spec.walkMP,
    engineKind: "fusion",
    jumpJets: spec.jumpJets,
    ...(spec.lowerArms ? { lowerArms: spec.lowerArms } : {}),
    armor: spec.armor,
    mounts: spec.mounts,
    era: "jihad",
    lastUpdated: "2026-11-14T00:00:00.000Z",
    tro: { text: { overview: spec.overview, notes: `${CREDIT} Where this design differs from the print: ${spec.differences}` } },
} as IMicroMechExport);

export const MICRO_MECH_SAMPLES: { id: string; name: string; save: IMicroMechExport; differences: string }[] =
    SPECS.map((spec) => ({ id: spec.id, name: `${spec.name} (${spec.tons} tons${spec.layout === "quad" ? ", quad" : ""})`, save: buildSave(spec), differences: spec.differences }));
