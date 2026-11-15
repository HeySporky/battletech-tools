import Walker, { IWalkerExport } from "../classes/walker";
import type { TroProductionKey, TroTextKey } from "./technical-readout-interfaces";
import type { WalkerLocation } from "./walker-construction";
import { WALKER_LOCATIONS } from "./walker-construction";

/*
 * Sample walkers (Custom Homebrew, NOT OFFICIAL), loadable from the Walker Creator's home and printed in
 * TRO - JBT: Walkers. Clell Flint printed no walker designs (the fanzine's art insert has no stats), so all three are
 * ours, built under his rules: a light walker, a heavy with a turret, and an assault under his variant slots.
 */

interface IWalkerSampleMount {
    tag: string;
    location: WalkerLocation;
    inTurret?: boolean;
}

interface IWalkerSampleSpec {
    id: string;
    name: string;
    tons: number;
    walkMP: number;
    heatSinks?: number;
    jumpJets?: number;
    turret?: boolean;
    /** Built under Flint's variant slots (the Best of Future Wars construction ruleset). */
    variantSlots?: boolean;
    /** Armor in tons (16 points a ton), spread over the locations in proportion to their maximums. */
    armorTons: number;
    mounts: IWalkerSampleMount[];
    production: Partial<Record<TroProductionKey, string>>;
    text: Partial<Record<TroTextKey, string>>;
}

export interface IWalkerSample {
    id: string;
    name: string;
    save: IWalkerExport;
}

const OURS = "Custom Homebrew, NOT OFFICIAL. A design of ours under Clell Flint's walker rules (Best of Future Wars, 1991); Flint printed no designs.";

const SPECS: IWalkerSampleSpec[] = [
    {
        id: "harrowhound-hrh-1", name: "Harrowhound HRH-1", tons: 30, walkMP: 6, armorTons: 6.5,
        mounts: [
            { tag: "medium-laser", location: "ft" },
            { tag: "medium-laser", location: "lt" },
            { tag: "medium-laser", location: "rt" },
            { tag: "srm-4", location: "ft" },
            { tag: "ammo-srm-standard", location: "rrt" },
            { tag: "small-laser", location: "rrt" },
            { tag: "machine-gun", location: "ct" },
            { tag: "machine-gun", location: "ct" },
            { tag: "ammo-machine-gun-standard", location: "rrt" },
        ],
        production: { manufacturer: "Kressly Walkerworks", primaryFactory: "Epsilon Eridani", communications: "Garret T10-B", targeting: "Dalban HiRez" },
        text: {
            overview: "The Harrowhound is a light walker built to hold ground that a biped 'Mech of its weight would only cross. Four legs give it a steady gun platform on broken ground and keep it upright after damage that would topple a two-legged machine.",
            capabilities: "Three medium lasers cover the front and both flanks, backed by a short-range missile rack in the front torso. A small laser guards the rear, and two machine guns under the belly sweep away infantry that close in. Its armor is the most a walker of its weight can carry, but its ten heat sinks cannot keep up with every weapon at once.",
            deployment: "Garrison commands post Harrowhounds at depots, passes and spaceports, where a picket that cannot be knocked over by a lucky kick is worth more than speed.",
            notes: OURS,
        },
    },
    {
        id: "ironback-ibk-2t", name: "Ironback IBK-2T", tons: 65, walkMP: 4, turret: true, heatSinks: 16, armorTons: 11,
        mounts: [
            { tag: "standard-ppc", location: "cs", inTurret: true },
            { tag: "lrm-10", location: "lt" },
            { tag: "ammo-lrm-standard", location: "lt" },
            { tag: "medium-laser", location: "ft" },
            { tag: "medium-laser", location: "ft" },
            { tag: "medium-laser", location: "rt" },
            { tag: "medium-laser", location: "rrt" },
            { tag: "machine-gun", location: "ct" },
            { tag: "machine-gun", location: "ct" },
            { tag: "ammo-machine-gun-standard", location: "rt" },
        ],
        production: { manufacturer: "Kressly Walkerworks", primaryFactory: "Epsilon Eridani", communications: "Garret T19-G", targeting: "Dalban Turretlink" },
        text: {
            overview: "The Ironback is a heavy walker built around its turret. Where a biped heavy turns its whole body to bring a PPC to bear, the Ironback turns only its control section, and keeps its legs and its thickest armor facing the threat.",
            capabilities: "The turret's PPC fires in any direction. A long-range missile rack and three medium lasers fill the front arcs, a fourth laser guards the rear, and two belly machine guns deal with infantry. Sixteen heat sinks carry the PPC and two of the lasers; firing everything at once runs it hot.",
            deployment: "Ironbacks anchor defensive lines and escort supply columns. Crews value the turret most in city fighting, where an enemy can appear on any side.",
            notes: OURS,
        },
    },
    {
        id: "steppe-titan-stn-5v", name: "Steppe Titan STN-5V", tons: 95, walkMP: 3, variantSlots: true, heatSinks: 18, armorTons: 17,
        mounts: [
            { tag: "autocannon-standard-d", location: "ft" },
            { tag: "ammo-ac-20-standard", location: "lt" },
            { tag: "ammo-ac-20-standard", location: "rt" },
            { tag: "large-laser", location: "lt" },
            { tag: "large-laser", location: "rt" },
            { tag: "lrm-15", location: "cs" },
            { tag: "ammo-lrm-standard", location: "cs" },
            { tag: "medium-laser", location: "rrt" },
            { tag: "medium-laser", location: "rrt" },
            { tag: "small-laser", location: "ct" },
            { tag: "small-laser", location: "ct" },
        ],
        production: { manufacturer: "Kressly Walkerworks", primaryFactory: "Hesperus II", communications: "Neil 9000", targeting: "RCA Instatrac Mark X" },
        text: {
            overview: "The Steppe Titan is the largest walker Kressly builds, made under Flint's variant construction rules so that its outer torsos hold more than a standard walker's. Its designers wanted an assault machine that could carry an Autocannon/20 without splitting it across locations.",
            capabilities: "The front torso carries the Autocannon/20, fed from both flanks. Two large lasers and a control-section LRM 15 give it reach, two medium lasers cover the rear, and two small lasers under the belly keep infantry off its legs. Seventeen tons of armor cover it, thickest over the torsos.",
            deployment: "Few units can afford a Steppe Titan. Those that do use it to break fortified lines and to hold the ground behind them.",
            notes: OURS,
        },
    },
];

const build = (spec: IWalkerSampleSpec): Walker => {
    const walker = new Walker();
    walker.setName(spec.name);
    if (spec.variantSlots) walker.gameSettings.set(walker.getRequiredRulesLevel(), ["best-of-future-wars-construction"]);
    walker.setTons(spec.tons);
    walker.setWalkMP(spec.walkMP);
    if (spec.turret) walker.setTurret(true);
    if (spec.jumpJets) walker.setJumpJets(spec.jumpJets);
    for (const mount of spec.mounts) {
        const result = walker.addEquipment(mount.tag, mount.location, !!mount.inTurret);
        if (!result.added) throw new Error(`${spec.name}: ${mount.tag} in ${mount.location}: ${result.reason}`);
    }
    if (spec.heatSinks) walker.setHeatSinks(spec.heatSinks);
    const points = Math.min(spec.armorTons * 16, walker.getMaxArmor());
    const share = points / walker.getMaxArmor();
    for (const location of WALKER_LOCATIONS) walker.setArmor(location, Math.floor(walker.getMaxArmor(location) * share));
    // Hand out the points the rounding left over, one at a time, in location order.
    let left = points - WALKER_LOCATIONS.reduce((sum, location) => sum + walker.getArmor(location), 0);
    while (left > 0) {
        for (const location of WALKER_LOCATIONS) {
            if (left > 0 && walker.getArmor(location) < walker.getMaxArmor(location)) { walker.setArmor(location, walker.getArmor(location) + 1); left--; }
        }
    }
    for (const [key, value] of Object.entries(spec.production)) walker.tro.setProduction(key as TroProductionKey, value);
    for (const [key, value] of Object.entries(spec.text)) walker.tro.setText(key as TroTextKey, value);
    return walker;
};

let samples: IWalkerSample[] | null = null;

/** The three sample walkers, built the first time they are asked for. */
export const getWalkerSamples = (): IWalkerSample[] => {
    samples ??= SPECS.map((spec) => ({ id: spec.id, name: spec.name, save: build(spec).export() }));
    return samples;
};
