import SmallCraft, { ISmallCraftExport } from "../classes/small-craft";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "./rules-level-options";
import type { SmallCraftArc } from "./small-craft-construction";
import type { TroProductionKey, TroTextKey } from "./technical-readout-interfaces";
import { FW_DROPSHIP_RULESET_IDS, FwDropShipMethod, IHousemanChoices, IStockChoices } from "./future-wars-dropships";

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
 * Sample DropShips under the Future Wars construction methods (#172, Custom Homebrew, NOT OFFICIAL), loadable from
 * the Small Craft Creator's home and printed in TRO - JBT: Future Wars DropShips.
 *
 * Two groups:
 *  - "sheet": the designs the authors printed, every value read from their sheets (Mark Stock's Pioneer, Future
 *    Wars #16 pp.34-36; Mike Reese's UNION-12, THUNDERWOLF and GOLIATH-R, Future Wars #36 pp.19-21). Each is built
 *    to its author's rule; where the sheet prints something else, the notes say so (a sheet that breaks its own rule
 *    is a finding, not a fix: NGCFells, 2026-11-19).
 *  - "canon": NGCFells's verification builds, the Leopard, Union and Overlord of DropShips and JumpShips (FASA, 1988)
 *    under each method, to show how far each method lands from the canon tonnage.
 *
 * A record sheet has five armor locations (nose, wings or sides, fuselage, engine); the builder has four facings, so
 * fuselage and engine armor go to the aft facing.
 */

interface IMount { tag: string; arc: SmallCraftArc; count?: number }
interface IBay { tag: string; amount: number; doors?: number }

interface IDropShipSampleSpec {
    id: string;
    group: "sheet" | "canon";
    name: string;
    model?: string;
    method: FwDropShipMethod;
    shape: "aerodyne" | "spheroid";
    tonnage: number;
    thrust: number;
    structuralIntegrity: number;
    era: string;
    /** Stock and Eid: tons carried. Reese and Houseman work from days instead. */
    fuelTons?: number;
    fuelDays?: number;
    engines?: number;
    stock?: IStockChoices;
    houseman?: IHousemanChoices;
    /** Armor points as the sheet allocates them; the tons are bought at the method's points a ton unless set. */
    armor: { nose: number; left: number; right: number; fuselage: number; engine: number };
    armorTons?: number;
    addedHeatSinks?: number;
    mounts: IMount[];
    ammo?: { tag: string; tons: number }[];
    bays?: IBay[];
    crew: number;
    officers?: number;
    passengers?: number;
    firstClass?: number;
    /** Where it was printed: the issue and page, for the list and the readout. */
    source: string;
    production?: Partial<Record<TroProductionKey, string>>;
    text: Partial<Record<TroTextKey, string>>;
}

export interface IFwDropShipSample {
    id: string;
    group: "sheet" | "canon";
    name: string;
    method: FwDropShipMethod;
    tonnage: number;
    source: string;
    save: ISmallCraftExport;
}

const SHEET = "Custom Homebrew, NOT OFFICIAL. ";
const CANON_NOTE = (ship: string, method: string): string => SHEET
    + `NGCFells's verification build: the ${ship} as DropShips and JumpShips (FASA, 1988) prints it, rebuilt by ${method}'s rules to check the math. `
    + "The canon ship's tonnage is kept; the summary shows how far the method lands from it.";

const PIONEER_TEXT = (model: string, load: string): Partial<Record<TroTextKey, string>> => ({
    overview: "Tired of building designs other than their own, Brigadier Corporation built a versatile passenger and cargo craft with a unique shape "
        + "and interior. The Pioneer Project finished its first prototype in 2989; after some skepticism the design caught on, and it is now popular "
        + "with independent liner companies. A new Pioneer costs about 180 million C-stars, a heavily used one as little as 75 million.",
    capabilities: `Model ${model}: ${load} Seven large lasers, five in the nose and two aft, are its only weapons.`,
    notes: SHEET + "Mark Stock's sample for 'Dropship Construction', Future Wars #16 (1990), pp.34-36. Built to Stock's rule as NGCFells directed: "
        + "the engine is tonnage / (15 / thrust) = 780 tons, where the sheet prints 990 tons. The sheet's 6 thrust points a ton and 2.98 tons a day "
        + "are kept as Stock's looked-up values; the bridge is NGCFells's formula, as the sheet leaves it blank. So built, model A is 15.5 tons "
        + "over, B fits with 18.5 to spare and C is 49.5 over. It prints \"Weapons: 35\" under the armor, with no rule for it. Fuselage (130) and engine (70) "
        + "armor are on the aft facing.",
});
const PIONEER_BASE = {
    group: "sheet" as const, name: "Pioneer", method: "stock" as FwDropShipMethod, shape: "aerodyne" as const, tonnage: 3900, thrust: 3,
    structuralIntegrity: 9, era: "late-sw-lt", fuelTons: 180, stock: { thrustPointsPerTon: 6, burnDay: 2.98 },
    armor: { nose: 110, left: 85, right: 85, fuselage: 130, engine: 70 },
    mounts: [{ tag: "large-laser", arc: "nose" as SmallCraftArc, count: 5 }, { tag: "large-laser", arc: "aft" as SmallCraftArc, count: 2 }],
    source: "Future Wars #16 (1990), pp.34-36",
    production: { manufacturer: "Brigadier Corporation" },
};

// The DropShips and JumpShips (1988) loadouts, by arc, with their armor and people (data blocks pp.39, 41 and 43).
const LEOPARD = {
    name: "Leopard", shape: "aerodyne" as const, tonnage: 1720, thrust: 4, structuralIntegrity: 7, era: "age-of-war", fuelTons: 123,
    armor: { nose: 100, left: 90, right: 90, fuselage: 140, engine: 60 },
    mounts: [
        { tag: "standard-ppc", arc: "nose", count: 2 }, { tag: "lrm-20", arc: "nose" }, { tag: "medium-laser", arc: "nose", count: 3 },
        { tag: "lrm-20", arc: "left" }, { tag: "large-laser", arc: "left", count: 2 }, { tag: "medium-laser", arc: "left" },
        { tag: "lrm-20", arc: "right" }, { tag: "large-laser", arc: "right", count: 2 }, { tag: "medium-laser", arc: "right" },
        { tag: "large-laser", arc: "aft" }, { tag: "medium-laser", arc: "aft", count: 2 },
    ] as IMount[],
    ammo: [{ tag: "ammo-lrm-standard", tons: 4 }],
    bays: [{ tag: "mech", amount: 4, doors: 4 }, { tag: "fighter", amount: 2, doors: 2 }],
    crew: 9, passengers: 6, page: "p.39",
};
const SIDE = (arc: SmallCraftArc): IMount[] => [
    { tag: "standard-ppc", arc }, { tag: "autocannon-standard-b", arc, count: 2 }, { tag: "lrm-20", arc, count: 2 },
    { tag: "large-laser", arc }, { tag: "medium-laser", arc, count: 2 },
];
const UNION_MOUNTS: IMount[] = [
    { tag: "standard-ppc", arc: "nose" }, { tag: "autocannon-standard-b", arc: "nose", count: 2 }, { tag: "lrm-20", arc: "nose", count: 2 },
    { tag: "medium-laser", arc: "nose", count: 2 },
    ...SIDE("left"), ...SIDE("right"),
    ...(["leftAft", "rightAft", "aft"] as SmallCraftArc[]).flatMap((arc) => [{ tag: "large-laser", arc }, { tag: "medium-laser", arc, count: 2 }]),
];
const UNION = {
    name: "Union", shape: "spheroid" as const, tonnage: 3500, thrust: 3, structuralIntegrity: 11, era: "star-league", fuelTons: 209,
    armor: { nose: 140, left: 140, right: 140, fuselage: 160, engine: 60 },
    mounts: UNION_MOUNTS,
    ammo: [{ tag: "ammo-lrm-standard", tons: 9 }, { tag: "ammo-ac-5-standard", tons: 12 }],
    bays: [{ tag: "mech", amount: 12, doors: 4 }, { tag: "fighter", amount: 2, doors: 2 }],
    crew: 14, passengers: 14, page: "p.41",
};
const OVERLORD_SIDE = (arc: SmallCraftArc): IMount[] => [
    { tag: "standard-ppc", arc }, { tag: "autocannon-standard-b", arc }, { tag: "lrm-20", arc }, { tag: "large-laser", arc }, { tag: "medium-laser", arc, count: 2 },
];
const OVERLORD_REAR = (arc: SmallCraftArc): IMount[] => [{ tag: "standard-ppc", arc }, { tag: "large-laser", arc }, { tag: "medium-laser", arc, count: 2 }];
const OVERLORD = {
    name: "Overlord", shape: "spheroid" as const, tonnage: 9700, thrust: 3, structuralIntegrity: 18, era: "star-league", fuelTons: 306,
    armor: { nose: 170, left: 160, right: 160, fuselage: 210, engine: 100 },
    mounts: [
        { tag: "standard-ppc", arc: "nose", count: 2 }, { tag: "autocannon-standard-b", arc: "nose", count: 2 },
        { tag: "autocannon-standard-d", arc: "nose", count: 2 }, { tag: "medium-laser", arc: "nose", count: 2 },
        ...OVERLORD_SIDE("left"), ...OVERLORD_SIDE("right"), ...OVERLORD_REAR("leftAft"), ...OVERLORD_REAR("rightAft"),
        { tag: "autocannon-standard-b", arc: "aft", count: 2 }, { tag: "lrm-20", arc: "aft" }, { tag: "large-laser", arc: "aft", count: 2 },
        { tag: "medium-laser", arc: "aft", count: 2 },
    ] as IMount[],
    ammo: [{ tag: "ammo-lrm-standard", tons: 16 }, { tag: "ammo-ac-5-standard", tons: 10 }, { tag: "ammo-ac-20-standard", tons: 6 }],
    bays: [{ tag: "mech", amount: 36, doors: 6 }, { tag: "fighter", amount: 6, doors: 2 }],
    crew: 43, passengers: 42, page: "p.43",
};

const METHOD_NAMES: Record<FwDropShipMethod, string> = { stock: "Mark Stock", eid: "Erik Eid", reese: "Mike Reese", houseman: "Doug Houseman" };

const canonSpecs = (): IDropShipSampleSpec[] => [LEOPARD, UNION, OVERLORD].flatMap((ship) =>
    (["stock", "eid", "reese", "houseman"] as FwDropShipMethod[]).map((method) => {
        const { page, fuelTons, ...rest } = ship;
        return {
            ...rest, id: `${ship.name.toLowerCase()}-${method}`, group: "canon" as const, model: `${METHOD_NAMES[method].split(" ")[1]} build`, method,
            fuelTons: method === "stock" || method === "eid" ? fuelTons : undefined,
            source: `DropShips and JumpShips (FASA, 1988), ${page}`,
            text: { notes: CANON_NOTE(ship.name, METHOD_NAMES[method]) },
        };
    }));

const SPECS: IDropShipSampleSpec[] = [
    {
        ...PIONEER_BASE, id: "pioneer-a", model: "A", crew: 35, passengers: 194, firstClass: 19, bays: [{ tag: "cargo", amount: 1240 }],
        text: PIONEER_TEXT("A", "the liner, 175 passengers and 19 in first class with 20 stewards, and 1,240 tons of cargo."),
    },
    {
        ...PIONEER_BASE, id: "pioneer-b", model: "B", crew: 15, passengers: 10, bays: [{ tag: "cargo", amount: 2355 }],
        text: PIONEER_TEXT("B", "the freighter, 10 passengers and 2,355 tons of cargo, flown by the base crew alone."),
    },
    {
        ...PIONEER_BASE, id: "pioneer-c", model: "C", crew: 55, passengers: 381, firstClass: 40, bays: [{ tag: "cargo", amount: 100 }],
        text: PIONEER_TEXT("C", "the transport, 341 passengers and 40 in first class with 40 stewards, and 100 tons of cargo."),
    },
    {
        id: "union-12", group: "sheet", name: "UNION-12", method: "reese", shape: "spheroid", tonnage: 22860, thrust: 3, structuralIntegrity: 11,
        era: "late-sw-lt", fuelDays: 30, armorTons: 53, armor: { nose: 140, left: 140, right: 140, fuselage: 60, engine: 60 },
        mounts: UNION_MOUNTS, ammo: [{ tag: "ammo-lrm-standard", tons: 9 }, { tag: "ammo-ac-5-standard", tons: 12 }],
        bays: [{ tag: "mech", amount: 12, doors: 4 }, { tag: "fighter", amount: 2, doors: 2 }, { tag: "cargo", amount: 964 }],
        crew: 58, officers: 12, passengers: 28,
        source: "Future Wars #36 (1993), pp.17-19",
        production: { manufacturer: "EII Industries", primaryFactory: "UR System" },
        text: {
            overview: "Mike Reese's Union as his rules build it from a 12-inch globe model: 22,860 tons, the book Union's weapons on a hull six and a half times its size. "
                + "First introduced 3008 by EII Industries in the UR System; common.",
            capabilities: "The book Union's 166 tons of weapons and 21 tons of ammunition, twelve 'Mech and two fighter cubicles, 30 burn-days of fuel and 964 tons of cargo.",
            notes: SHEET + "Mike Reese, Future Wars #36 (1993): worked example p.17, sheet p.19. His crew is 12 officers and 46 other ranks as the sheet prints "
                + "them (the worked example counts 56); the 14 pilots and 14 techs ride as passengers. His 22,860 tons include the twelve 'Mechs and two "
                + "fighters carried (1,400 tons), which the builder does not weigh, so 1,440 tons show unspent: those 1,400, 50 for the ten fewer "
                + "enlisted, less the 10 tons his pilots' line drops (14 x 5 printed as 60). The sheet allocates 640 armor "
                + "points where 53 tons at 12 a ton buy 636; fuselage (60) and engine (60) are on the aft facing.",
        },
    },
    {
        id: "thunderwolf", group: "sheet", name: "THUNDERWOLF", method: "reese", shape: "aerodyne", tonnage: 404, thrust: 2, structuralIntegrity: 3,
        era: "late-sw-lt", fuelDays: 20, engines: 4, armorTons: 14, addedHeatSinks: 32, armor: { nose: 4, left: 44, right: 44, fuselage: 50, engine: 25 },
        mounts: [
            { tag: "medium-laser", arc: "nose", count: 4 },
            { tag: "standard-ppc", arc: "left" }, { tag: "large-laser", arc: "left" }, { tag: "is-ams", arc: "left" },
            { tag: "standard-ppc", arc: "right" }, { tag: "large-laser", arc: "right" }, { tag: "is-ams", arc: "right" },
            { tag: "is-tag", arc: "nose" },
        ],
        ammo: [{ tag: "ammo-is-ams-standard", tons: 2 }],
        bays: [{ tag: "vehicle-light", amount: 1, doors: 1 }, { tag: "infantry-jump", amount: 1 }, { tag: "cargo", amount: 23.5 }],
        crew: 5, officers: 0,
        source: "Future Wars #36 (1993), p.20",
        production: { manufacturer: "EII Industries", primaryFactory: "UR System" },
        text: {
            overview: "Mike Reese's light assault DropShip: four small drives, a platoon of jump infantry and a light vehicle. First introduced 3015 by EII Industries "
                + "in the UR System; rare. It can lift 200 tons with outside cargo.",
            capabilities: "Four medium lasers in the nose; a PPC, a large laser and an anti-missile turret firing front and rear in each wing; Guardian ECM, a C3 computer and TAG.",
            notes: SHEET + "Mike Reese, Future Wars #36 (1993), p.20. Built to his rule: 20 burn-days of fuel (his minimum), where the sheet carries 108 tons, 7.5 "
                + "burn-days, and his 8 tons a jump trooper make its platoon of 30 weigh 240 tons, so by his rules it is 366.5 tons over. "
                + "The sheet prints \"E20+22\" heat sinks in its header and \"5, Added HS = 37\" in its stat block; the stat block is followed. "
                + "Its armor allocation (nose 4, wings 44, fuselage 50, engine 25) adds to 167 of the 224 points 14 tons buy; the nose may be a misprint "
                + "for 44. The sheet prints one 'Mech bay door with no 'Mech cubicle. Its Guardian ECM and C3 computer are left off: the "
                + "builder's catalog follows Total Warfare, where a DropShip mounts neither. TAG predates its canon introduction; the sheet's date is kept.",
        },
    },
    {
        id: "goliath-r", group: "sheet", name: "GOLIATH-R", method: "reese", shape: "aerodyne", tonnage: 23413, thrust: 3, structuralIntegrity: 5,
        era: "star-league", fuelDays: 20, armorTons: 53, addedHeatSinks: 7, armor: { nose: 140, left: 140, right: 140, fuselage: 160, engine: 60 },
        mounts: [
            { tag: "standard-ppc", arc: "nose", count: 2 },
            { tag: "standard-ppc", arc: "left" }, { tag: "large-laser", arc: "left", count: 4 }, { tag: "lrm-20", arc: "left" },
            { tag: "standard-ppc", arc: "right" }, { tag: "large-laser", arc: "right", count: 4 }, { tag: "lrm-20", arc: "right" },
            { tag: "standard-ppc", arc: "aft" }, { tag: "lrm-20", arc: "aft" },
        ],
        ammo: [{ tag: "ammo-lrm-standard", tons: 6 }],
        bays: [
            { tag: "vehicle-heavy", amount: 9, doors: 2 }, { tag: "vehicle-superheavy", amount: 1, doors: 1 },
            { tag: "infantry-jump", amount: 12 }, { tag: "cargo", amount: 287 },
        ],
        crew: 62, officers: 18,
        source: "Future Wars #36 (1993), p.21",
        production: {},
        text: {
            overview: "Mike Reese's heavy assault lander: 23,413 tons, a Norton 40 series drive, twelve platoons of jump infantry and ten vehicle bays. "
                + "After landing, 2,630 tons of conversion gear turn it into a VTOL and fighter launch platform. First introduced 2705; rare.",
            capabilities: "Two PPCs in the nose; a PPC, four large lasers and an LRM-20 in each wing; a PPC and an LRM-20 aft. Four hard points dock light DropShips.",
            notes: SHEET + "Mike Reese, Future Wars #36 (1993), p.21. Built to his rule, which gives the engine 4,390 tons and the structure 1,171 tons, where the "
                + "sheet prints 4,931 and 1,578. Its armor line (53 tons at 12 a ton, 640 points, nose 140, wings 140, fuselage 160, engine 60) is the "
                + "UNION-12's: by his Chart C an aerodyne of this size buys 10 points a ton. The 2,630 tons of conversion gear and the four docking hard "
                + "points have no rule in the builder and are not weighed; the sheet's two fighter and four 'Mech bay doors have no cubicles. "
                + "Its 36 LRM-20 packs are 6 tons.",
        },
    },
    ...canonSpecs(),
];

const build = (spec: IDropShipSampleSpec): SmallCraft => {
    const craft = new SmallCraft();
    craft.setCraftType("dropShip");
    craft.gameSettings.set(CUSTOM_HOMEBREW_RULES_LEVEL, [FW_DROPSHIP_RULESET_IDS[spec.method]]);
    craft.setName(spec.name);
    if (spec.model) craft.setModel(spec.model);
    craft.setEra(spec.era);
    craft.setShape(spec.shape);
    craft.setTonnage(spec.tonnage);
    craft.setSafeThrust(spec.thrust);
    craft.setStructuralIntegrity(spec.structuralIntegrity);
    craft.setFwOptions({
        ...(spec.fuelDays ? { fuelDays: spec.fuelDays } : {}),
        ...(spec.engines ? { engines: spec.engines } : {}),
        ...(spec.stock ? { stock: spec.stock } : {}),
        ...(spec.houseman ? { houseman: spec.houseman } : {}),
    });
    if (spec.fuelTons !== undefined) craft.setFuelTons(spec.fuelTons);
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
    for (const bay of spec.bays ?? []) {
        if (!craft.addBay(bay.tag, bay.amount)) throw new Error(`${spec.id}: bay ${bay.tag} was refused`);
        const index = craft.getBays().length - 1;
        craft.setBay(index, bay.amount, bay.doors ?? craft.getBays()[index].doors);
    }
    if (spec.addedHeatSinks) craft.setAdditionalHeatSinks(spec.addedHeatSinks);
    craft.setPassengers(spec.passengers ?? 0);
    if (spec.firstClass) craft.setQuarters("firstClass", spec.firstClass);
    craft.setCrew(spec.crew);
    craft.setOfficers(spec.officers ?? 0);
    const points = spec.armor.nose + spec.armor.left + spec.armor.right + spec.armor.fuselage + spec.armor.engine;
    craft.setArmorTons(spec.armorTons ?? Math.ceil(points / (craft.getArmorPointsPerTon() ?? 16) * 2) / 2);
    craft.setArmorAllocation("nose", spec.armor.nose);
    craft.setArmorAllocation("left", spec.armor.left);
    craft.setArmorAllocation("right", spec.armor.right);
    craft.setArmorAllocation("aft", spec.armor.fuselage + spec.armor.engine);
    for (const [key, value] of Object.entries(spec.production ?? {})) craft.tro.setProduction(key as TroProductionKey, value);
    for (const [key, value] of Object.entries(spec.text)) craft.tro.setText(key as TroTextKey, value);
    return craft;
};

let samples: IFwDropShipSample[] | null = null;

/** The sample DropShips, built the first time they are asked for. */
export const getFwDropShipSamples = (): IFwDropShipSample[] => {
    samples ??= SPECS.map((spec) => ({
        id: spec.id, group: spec.group, name: spec.model && spec.group === "sheet" ? `${spec.name} ${spec.model}` : spec.name,
        method: spec.method, tonnage: spec.tonnage, source: spec.source, save: build(spec).export(),
    }));
    return samples;
};
