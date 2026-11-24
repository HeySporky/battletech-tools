import SmallCraft, { ISmallCraftExport } from "../classes/small-craft";
import type { QuartersTag, SmallCraftArc } from "./small-craft-construction";
import type { TroProductionKey, TroTextKey } from "./technical-readout-interfaces";
import {
    BLACK_AND_BLUE_THREAD, forumCreditLine, forumSourceLine, IForumCredit, PREGNANT_GUPPY_THREAD,
    VEHREC_GUPPY_POST, VEHREC_WATER_TAKEOFF_POST,
} from "./credited-ideas";

export { BLACK_AND_BLUE_THREAD, forumCreditLine, PREGNANT_GUPPY_THREAD };
export type { IForumCredit };

/*
* DISCLAIMER: This file processes gameplay data derived from the BattleTech universe.
* All lore, stats, and intellectual property belong strictly to Catalyst Game Labs,
* Topps, and their respective rights holders.
*
* This open-source utility is a non-commercial fan project designed purely for
* tabletop gameplay assistance. Content processed by this file is not intended
* to challenge any copyright or trademark status, and this data is explicitly
* excluded from the software's underlying license (GNU GPLv3).
*/

/*
 * The three SeaDropships (#643, Custom Homebrew, NOT OFFICIAL): aerodyne DropShips on the Flotation Hull that land on
 * water like a runway and sail afloat. The Pelican is Vehrec's idea; the Petrel, the Gannet and the hull are NGCFells's.
 * Each is built through the SmallCraft class by TechManual DropShip construction; weight, BV and cost are read from it.
 * A record sheet has five armor locations and the builder four facings, so fuselage and engine armor go aft.
 */

interface IMount { tag: string; arc: SmallCraftArc; count?: number }
interface IBay { tag: string; amount: number; doors?: number }

export interface ISeaDropshipSpec {
    id: string;
    name: string;
    tonnage: number;
    thrust: number;
    structuralIntegrity: number;
    era: string;
    fuelTons: number;
    armorTons: number;
    armor: { nose: number; left: number; right: number; aft: number };
    mounts: IMount[];
    ammo?: { tag: string; tons: number }[];
    bays: IBay[];
    addedHeatSinks?: number;
    /** The total from a posted stat block; the build adds what the engine does not give free. */
    totalHeatSinks?: number;
    /** A military DropShip (TM p.193 free heat sinks). */
    military?: boolean;
    escapePods?: number;
    crew: number;
    officers?: number;
    passengers?: number;
    quarters: Partial<Record<QuartersTag, number>>;
    /** Who dreamed it up, for the list and the readout. */
    credit: string;
    /** A forum design: the thread it was posted in, for the credit line. */
    forum?: IForumCredit;
    production: Partial<Record<TroProductionKey, string>>;
    text: Partial<Record<TroTextKey, string>>;
}

export interface ISeaDropshipSample {
    id: string;
    name: string;
    tonnage: number;
    credit: string;
    forum?: IForumCredit;
    save: ISmallCraftExport;
}

export const SEADROPSHIP_NOTE = "Custom Homebrew, NOT OFFICIAL. ";

const HULL_NOTE = "Flotation Hull (5% of the tonnage, cost x1.25): it lands and takes off horizontally on Depth 1+ water as on a runway, "
    + "can still deploy its gear for a runway or clear ground, and sails afloat at Cruise 2 / Flank 3 on water jets. ";

export const SEADROPSHIP_SPECS: ISeaDropshipSpec[] = [
    {
        id: "pelican", name: "Pelican", tonnage: 5000, thrust: 4, structuralIntegrity: 16, era: "star-league", fuelTons: 200, armorTons: 72,
        armor: { nose: 340, left: 290, right: 290, aft: 296 },
        mounts: [
            { tag: "lrm-20", arc: "nose", count: 2 }, { tag: "autocannon-standard-b", arc: "nose", count: 2 }, { tag: "autocannon-standard-c", arc: "nose", count: 2 },
            { tag: "lrm-20", arc: "left", count: 2 }, { tag: "autocannon-standard-b", arc: "left" },
            { tag: "lrm-20", arc: "right", count: 2 }, { tag: "autocannon-standard-b", arc: "right" },
            { tag: "medium-laser", arc: "aft", count: 2 }, { tag: "lrm-20", arc: "aft", count: 2 },
        ],
        ammo: [{ tag: "ammo-lrm-standard", tons: 16 }, { tag: "ammo-ac-5-standard", tons: 6 }, { tag: "ammo-ac-10-standard", tons: 6 }],
        bays: [{ tag: "well-deck", amount: 6 }, { tag: "mech", amount: 4, doors: 2 }, { tag: "infantry-foot", amount: 2 }, { tag: "cargo", amount: 1230, doors: 2 }],
        addedHeatSinks: 30, crew: 40, officers: 8, quarters: { firstClass: 8, crew: 32 },
        credit: "Vehrec", forum: VEHREC_WATER_TAKEOFF_POST,
        production: { manufacturer: "Terran Hegemony naval yards", primaryFactory: "Ocean worlds of the Hegemony" },
        text: {
            overview: "After Vehrec's BattleTech forums posts (14 February 2015, and again 4 May 2021): an aerodyne DropShip shaped to land on and take off from water, here an assault carrier on NGCFells's Flotation Hull that motors about as a ship and can still drop its landing gear. "
                + "The Terran Hegemony's ocean-world marines took the Pelican in 2655.",
            capabilities: "Six well decks each carry one hover or naval vehicle of up to 50 tons and launch it through the stern door once the ship is afloat; "
                + "four 'Mech cubicles and two foot infantry bays ride behind them, with 1,230 tons of cargo for the marines' stores. Beach support is "
                + "eight LRM-20s, two medium lasers, four AC/5s and two AC/10s.",
            deployment: "After the Succession Wars began the Pelican survived on water worlds and in the Periphery, where a ship that needs no spaceport is worth keeping flying.",
            notes: SEADROPSHIP_NOTE + "Vehrec's Pelican, after his BattleTech forums posts; NGCFells built it as the assault carrier of a family of three. "
                + `Vehrec's public posts: ${forumSourceLine(VEHREC_WATER_TAKEOFF_POST)} (an aerodyne DropShip whose hull and engines let it take off from water, `
                + `to supply sites with no landing field); ${forumSourceLine(VEHREC_GUPPY_POST)} (his water-landing DropShip, a Mule rival for ocean worlds). ` + HULL_NOTE
                + "Fit: 5,000 tons at 4 thrust (grown from 4,000 so six 65-ton well decks and the ship around them fit with room for cargo), Structural Integrity 16 (the integrity that lets 72 tons of armor on an aerodyne, TM p.191), well deck for 6 vehicles "
                + "(390 tons), the beach-support guns the job names, and the spare tons in cargo, heat sinks and LRM ammunition.",
        },
    },
    {
        id: "petrel", name: "Petrel", tonnage: 7000, thrust: 3, structuralIntegrity: 15, era: "star-league", fuelTons: 300, armorTons: 67,
        armor: { nose: 300, left: 250, right: 250, aft: 198 },
        mounts: [{ tag: "medium-laser", arc: "nose", count: 2 }, { tag: "medium-laser", arc: "aft", count: 2 }, { tag: "is-ams", arc: "left" }, { tag: "is-ams", arc: "right" }],
        ammo: [{ tag: "ammo-is-ams-standard", tons: 2 }],
        bays: [{ tag: "cargo", amount: 3600, doors: 4 }],
        crew: 40, officers: 8, passengers: 50, quarters: { firstClass: 8, crew: 32, secondClass: 50 },
        credit: "NGCFells",
        production: { manufacturer: "Merchant line yards (Terran Hegemony)", primaryFactory: "Ocean worlds of the Hegemony" },
        text: {
            overview: "NGCFells's ocean freighter on the Flotation Hull, the Pelican's sister. Merchant lines took the Petrel around 2690 to load and unload at any harbor, with or without a spaceport.",
            capabilities: "3,600 tons of cargo through four doors, quarters for 50 passengers, and a light defensive fit of four medium lasers and two anti-missile systems.",
            deployment: "Where spaceports fell to the Succession Wars the Petrel kept the ocean worlds supplied, one harbor at a time.",
            notes: SEADROPSHIP_NOTE + "NGCFells's Petrel. " + HULL_NOTE + "Fit: 7,000 tons at 3 thrust, Structural Integrity 15, the cargo the job names (about 3,500 tons, here 3,600) "
                + "and a light defensive fit; spare tons in fuel.",
        },
    },
    {
        id: "gannet", name: "Gannet", tonnage: 2000, thrust: 5, structuralIntegrity: 12, era: "star-league", fuelTons: 200, armorTons: 54,
        armor: { nose: 280, left: 220, right: 220, aft: 192 },
        mounts: [
            { tag: "lrt-20", arc: "nose", count: 2 }, { tag: "autocannon-standard-d", arc: "nose" }, { tag: "standard-ppc", arc: "nose", count: 2 },
            { tag: "autocannon-standard-b", arc: "left" }, { tag: "large-laser", arc: "left", count: 2 },
            { tag: "autocannon-standard-b", arc: "right" }, { tag: "large-laser", arc: "right", count: 2 },
            { tag: "medium-laser", arc: "aft", count: 2 }, { tag: "standard-ppc", arc: "aft", count: 2 },
        ],
        ammo: [{ tag: "ammo-lrt-standard", tons: 4 }, { tag: "ammo-ac-20-standard", tons: 4 }, { tag: "ammo-ac-5-standard", tons: 4 }],
        bays: [{ tag: "small-craft", amount: 1, doors: 1 }],
        addedHeatSinks: 30, crew: 30, officers: 6, passengers: 30, quarters: { firstClass: 6, crew: 24, secondClass: 30 },
        credit: "NGCFells",
        production: { manufacturer: "Terran Navy coastal yards", primaryFactory: "Ocean worlds of the Hegemony" },
        text: {
            overview: "NGCFells's naval patrol ship on the Flotation Hull, the Pelican's sister. The Hegemony's coastal squadrons took the Gannet around 2710 to police the sea lanes the Pelican and Petrel use.",
            capabilities: "Heavy guns: four PPCs, four large lasers, an AC/20 and two AC/5s, and two LRT-20 launchers whose torpedoes can be fired while the ship is afloat. "
                + "A small craft cubicle carries a tender, and quarters for 60 let it keep the sea for weeks.",
            deployment: "Like its sisters the Gannet outlasted the Star League on water worlds and in the Periphery.",
            notes: SEADROPSHIP_NOTE + "NGCFells's Gannet. " + HULL_NOTE + "Fit: 2,000 tons at 5 thrust, Structural Integrity 12, heavy guns and LRT torpedoes, "
                + "a small craft bay, 200 tons of fuel and quarters for weeks at sea.",
        },
    },
    {
        // StingerTheRaven's stat block (first post, 25 April 2021), built as posted on our Flotation Hull. The forum's
        // smiley filter ate "8)" twice: Bay 1 is Light Vehicle (8) (his 30 April post: "8x Light Vees") and each
        // Large Laser line reads 1(8). The 200 tons he reserves for sealant, bilge pumps and anti-corrosion plating
        // are our hull's 5% of 4,000 tons.
        id: "pregnant-guppy", name: "Pregnant Guppy", tonnage: 4000, thrust: 2, structuralIntegrity: 10, era: "star-league", fuelTons: 222, armorTons: 45,
        armor: { nose: 210, left: 200, right: 200, aft: 150 },
        mounts: [
            { tag: "large-pulse-laser", arc: "nose", count: 2 }, { tag: "large-laser", arc: "nose", count: 2 }, { tag: "autocannon-standard-b", arc: "nose", count: 5 },
            { tag: "large-pulse-laser", arc: "left" }, { tag: "large-laser", arc: "left" }, { tag: "autocannon-standard-b", arc: "left", count: 3 }, { tag: "lrm-20", arc: "left", count: 4 },
            { tag: "large-pulse-laser", arc: "right" }, { tag: "large-laser", arc: "right" }, { tag: "autocannon-standard-b", arc: "right", count: 3 }, { tag: "lrm-20", arc: "right", count: 4 },
            { tag: "large-pulse-laser", arc: "aft" }, { tag: "large-laser", arc: "aft" },
        ],
        ammo: [{ tag: "ammo-ac-5-standard", tons: 11 }, { tag: "ammo-lrm-standard", tons: 26 }],
        bays: [
            { tag: "vehicle-light", amount: 8, doors: 2 }, { tag: "vehicle-superheavy", amount: 2, doors: 1 }, { tag: "vehicle-heavy", amount: 4, doors: 1 },
            { tag: "fighter", amount: 2, doors: 2 }, { tag: "cargo", amount: 204, doors: 1 },
        ],
        military: true, totalHeatSinks: 83, escapePods: 20, crew: 14, officers: 3, quarters: { firstClass: 3, crew: 11 },
        credit: "StingerTheRaven", forum: PREGNANT_GUPPY_THREAD,
        production: { manufacturer: "Nikanor group (Capellan-built)" },
        text: {
            overview: "StingerTheRaven's flying boat, the Bluewater model: a Capellan-built aerodyne DropShip of 2721, first meant for civilian use, that "
                + "lands on the sea and keeps its wheels for a dry landing. It is slow, but for invasions and for feeding coastal settlements its "
                + "builders put buoyancy and sheer capacity ahead of nimbleness.",
            capabilities: "Eight light vehicle bays carry hovercraft in the bow, where the flooded aft raises the nose so they can jump straight into the "
                + "water, with a ramp for the less daring and for recovery. Heavy and superheavy vehicle bays sit in a floodable aft compartment where "
                + "monitors and patrol boats disembark and dry-dock. Two fighter bays ride above the wings, with 204 tons of cargo. The guns are five "
                + "large pulse lasers, five large lasers, eleven AC/5s and eight LRM-20s on the wings.",
            deployment: "The Nikanor group's commonest variant is a civilian freighter: six large lasers and five AC/5s against pirates, the same armor "
                + "for the hull's rigidity, no fighter bays, 2,310 tons of cargo and 40 passengers in steerage. Military cargo versions drop the vehicle "
                + "bays and keep the fighters, and a rare 'Mech transport swaps both vehicle bays for twelve 'Mech cubicles; little used, it came "
                + "through the Succession Wars intact, though its pulse lasers were often stripped for other work.",
            notes: SEADROPSHIP_NOTE + `${forumCreditLine(PREGNANT_GUPPY_THREAD)}, ${PREGNANT_GUPPY_THREAD.url}; built by NGCFells on the Flotation Hull. `
                + HULL_NOTE + "Fit: his first post's stat block as posted (4,000 tons, thrust 2/3, Structural Integrity 10, 222 tons of fuel, 83 heat "
                + "sinks, 45 tons of armor at 210/200/200/150, 20 escape pods). His 200 tons of sealant, bilge pumps and anti-corrosion plating are the "
                + "hull's 5%. He gave 3,751 BV and 312,796,368 C-bills without the hull; the figures above are ours, with it. Built here by TechManual "
                + "construction his ship has tons to spare, which stay unspent rather than guessed. His 30 April 2021 "
                + "revision (400 tons of amphibious gear after the Tactical Operations Fully Amphibious 10%, 2 heavy bays, 218 tons of cargo, 101 "
                + "steerage berths) and the variants came without full stat blocks, so they are told here and not built.",
        },
    },
];

const build = (spec: ISeaDropshipSpec): SmallCraft => {
    const craft = new SmallCraft();
    craft.setCraftType("dropShip");
    craft.setName(spec.name);
    craft.setEra(spec.era);
    craft.setShape("aerodyne");
    if (spec.military) craft.setMilitary(true);
    craft.setTonnage(spec.tonnage);
    craft.setSafeThrust(spec.thrust);
    craft.setStructuralIntegrity(spec.structuralIntegrity);
    craft.setFlotationHull(true);
    craft.setFuelTons(spec.fuelTons);
    for (const mount of spec.mounts) {
        for (let count = 0; count < (mount.count ?? 1); count++) {
            if (!craft.addEquipmentFromTag(mount.tag, mount.arc)) throw new Error(`${spec.id}: ${mount.tag} in ${mount.arc} was refused`);
        }
    }
    for (const bin of spec.ammo ?? []) {
        const item = craft.addEquipmentFromTag(bin.tag);
        if (!item) throw new Error(`${spec.id}: ${bin.tag} was refused`);
        craft.setAmmoBinTons(item.uuid, bin.tons);
    }
    for (const bay of spec.bays) {
        if (!craft.addBay(bay.tag, bay.amount)) throw new Error(`${spec.id}: bay ${bay.tag} was refused`);
        const index = craft.getBays().length - 1;
        craft.setBay(index, bay.amount, bay.doors ?? craft.getBays()[index].doors);
    }
    if (spec.addedHeatSinks) craft.setAdditionalHeatSinks(spec.addedHeatSinks);
    if (spec.totalHeatSinks) craft.setAdditionalHeatSinks(Math.max(0, spec.totalHeatSinks - craft.getFreeHeatSinks()));
    if (spec.escapePods) craft.setEscapePods(spec.escapePods);
    craft.setPassengers(spec.passengers ?? 0);
    for (const [tag, count] of Object.entries(spec.quarters)) craft.setQuarters(tag as QuartersTag, count);
    craft.setCrew(spec.crew);
    craft.setOfficers(spec.officers ?? 0);
    craft.setArmorTons(spec.armorTons);
    craft.setArmorAllocation("nose", spec.armor.nose);
    craft.setArmorAllocation("left", spec.armor.left);
    craft.setArmorAllocation("right", spec.armor.right);
    craft.setArmorAllocation("aft", spec.armor.aft);
    for (const [key, value] of Object.entries(spec.production)) craft.tro.setProduction(key as TroProductionKey, value);
    for (const [key, value] of Object.entries(spec.text)) craft.tro.setText(key as TroTextKey, value);
    return craft;
};

export const buildSeaDropship = (spec: ISeaDropshipSpec): SmallCraft => build(spec);

let samples: ISeaDropshipSample[] | null = null;

/** The SeaDropships, built the first time they are asked for. */
export const getSeaDropshipSamples = (): ISeaDropshipSample[] => {
    samples ??= SEADROPSHIP_SPECS.map((spec) => ({
        id: spec.id, name: spec.name, tonnage: spec.tonnage, credit: spec.credit, ...(spec.forum ? { forum: spec.forum } : {}), save: build(spec).export(),
    }));
    return samples;
};
