import { IEquipmentItem } from "../data/data-interfaces";
import { ITroComponentRow, ITroConstructionRow, ITroEquipmentCopy, ITroSpecValues, ITroUnitAdapter } from "../data/technical-readout-interfaces";
import { generateUUID } from "../utils/generateUUID";
import { SMALL_CRAFT_ARCS, SmallCraftArc } from "../data/small-craft-construction";
import AerospaceFighter, { FIGHTER_ARCS, FIGHTER_LOCATIONS } from "./aerospace-fighter";
import { ADVANCED_AEROSPACE_FACINGS, AdvancedAerospaceArc } from "../data/advanced-aerospace-construction";
import BattleArmor from "./battle-armor";
import Building from "./building";
import CapitalShip from "./capital-ship";
import InfantryPlatoon from "./infantry-platoon";
import ProtoMech from "./protomech";
import SmallCraft from "./small-craft";
import Vehicle from "./vehicle";
import Walker from "./walker";

// TRO fields round 2: the shared Technical Readout adapter for the Classic types other than 'Mechs (those have
// battlemech-tro.ts), JumpShips, WarShips, space stations and buildings included. Each type gives its spec block, component rows, equipment and construction table.

export type TroUnit = Vehicle | AerospaceFighter | InfantryPlatoon | BattleArmor | ProtoMech | SmallCraft | CapitalShip | Building | Walker;

/** Modern TROs print speeds in kph: 10.8 kph per movement point, to the whole kph. */
const kph = (movementPoints: number): string => `${Math.round(movementPoints * 10.8)} kph`;

interface IUnitTroParts {
    spec: ITroSpecValues;
    components: ITroComponentRow[];
    construction: ITroConstructionRow[];
    /** The construction table's rows under "Weapons and Equipment", ammunition included; built from `equipment` when left out. */
    equipmentRows?: ITroConstructionRow[];
    /** Weapons and equipment, each with a uuid where the type keeps one. */
    equipment: { item: { uuid?: string; tag: string }; name: string; location: string; armament: boolean; mass?: string }[];
}

function buildAdapter(parts: () => IUnitTroParts): ITroUnitAdapter {
    const copies = (): ITroEquipmentCopy[] => parts().equipment.map((entry) => ({
        uuid: entry.item.uuid ?? "",
        tag: entry.item.tag,
        name: entry.name,
        locationLabel: entry.location,
        armament: entry.armament,
    }));
    return {
        getComponentRows: () => parts().components,
        getEquipmentCopies: copies,
        getKnownEquipmentUuids: () => parts().equipment.map((entry) => entry.item.uuid).filter((uuid): uuid is string => !!uuid),
        getKnownEquipmentTags: () => parts().equipment.map((entry) => entry.item.tag),
        ensureEquipmentUuid(copy: ITroEquipmentCopy): string {
            if (copy.uuid) {
                return copy.uuid;
            }
            const entry = parts().equipment.find((candidate) => !candidate.item.uuid && candidate.item.tag === copy.tag && candidate.location === copy.locationLabel);
            if (!entry) {
                return copy.uuid;
            }
            entry.item.uuid = generateUUID();
            return entry.item.uuid;
        },
        getSpecValues: () => parts().spec,
        getConstructionRows(): ITroConstructionRow[] {
            const { construction, equipment, equipmentRows } = parts();
            const rows = equipmentRows ?? equipment.map((entry) => ({ label: entry.name, value: entry.location, mass: entry.mass }));
            if (rows.length === 0) {
                return construction;
            }
            return [
                ...construction,
                { label: "Weapons and Equipment", value: "Location", mass: "Mass", heading: true },
                ...rows,
            ];
        },
    };
}

const catalogEquipment = (items: IEquipmentItem[], locationName: (location?: string) => string): IUnitTroParts["equipment"] => items
    .filter((item) => item && !item.isAmmo)
    .map((item) => ({ item, name: item.name, location: locationName(item.location?.toString()), armament: item.category !== "Miscellaneous Equipment", mass: `${item.weight}` }));

/** Weapons kept as mounts with their own uuid (capital, sub-capital and a building's Light and Medium weapons). */
const mountEquipment = <T extends { uuid: string; weapon: { tag: string; name: string } }>(mounts: T[], where: (mount: T) => string): IUnitTroParts["equipment"] =>
    mounts.map((mount) => ({ item: { uuid: mount.uuid, tag: mount.weapon.tag }, name: mount.weapon.name, location: where(mount), armament: true }));

const subtitle = (...parts: (string | undefined)[]): string => parts.filter(Boolean).join(" · ");

/** A mass in tons, to the kilogram, without floating-point tails. */
const tonsText = (tons: number): string => `${Math.round(tons * 1000) / 1000}`;

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** An aerospace engine's construction row with its thrust indented under it. */
const engineWithThrust = (label: string, mass: string, unit: { getSafeThrust(): number; getMaxThrust(): number }): ITroConstructionRow[] => [
    { label, mass },
    { label: "Safe Thrust", value: `${unit.getSafeThrust()}`, indent: true },
    { label: "Maximum Thrust", value: `${unit.getMaxThrust()}`, indent: true },
];

/** One construction row per weight line, in the unit's own order, so the table adds up to the unit's mass. */
interface IWeightLine {
    name: string;
    weight: number;
    /** An equipment line's item, located by its own location. */
    item?: { location?: { toString(): string } };
    /** An equipment line's location, for types whose lines say where they are instead of carrying the item. */
    location?: string;
}

/**
 * Splits a weight list into the rows above "Weapons and Equipment" and the rows under it. Equipment lines carry their
 * item. A line after the equipment stays with the equipment (a support vehicle's kilogram items, rounded up together)
 * unless `afterEquipment` is "construction" (a Small Craft's quarters, bays and escape pods).
 */
function weightLineRows(
    lines: IWeightLine[],
    chassisRow: (line: IWeightLine) => ITroConstructionRow[],
    locationName: (location?: string) => string,
    afterEquipment: "equipment" | "construction" = "equipment",
): { construction: ITroConstructionRow[]; equipmentRows: ITroConstructionRow[] } {
    const construction: ITroConstructionRow[] = [];
    const equipmentRows: ITroConstructionRow[] = [];
    let pastEquipment = false;
    for (const line of lines) {
        if (line.item || line.location !== undefined) {
            pastEquipment = true;
            equipmentRows.push({ label: line.name, value: line.location ?? locationName(line.item?.location?.toString()), mass: tonsText(line.weight) });
        } else if (pastEquipment && afterEquipment === "equipment") {
            equipmentRows.push({ label: line.name, mass: tonsText(line.weight) });
        } else {
            construction.push(...chassisRow(line));
        }
    }
    return { construction, equipmentRows };
}

function vehicleLocationName(vehicle: Vehicle, location?: string): string {
    if (!location || location === "body") {
        return "Body";
    }
    return vehicle.getLocations().find((entry) => entry.tag === location)?.name ?? capitalize(location);
}

/** TRO-style rows: the vehicle's weight list with engine rating, movement, heat sinks and armor factor, then armor by location. */
function vehicleConstruction(vehicle: Vehicle): { construction: ITroConstructionRow[]; equipmentRows: ITroConstructionRow[] } {
    const support = vehicle.isSupportVehicle();
    const lines: IWeightLine[] = vehicle.getWeights();
    const weightedHeatSinks = lines.some((line) => !line.item && line.name.includes("Heat Sinks"));
    const movement = (): ITroConstructionRow[] => [
        { label: "Cruising MP", value: `${vehicle.getCruiseMP()}`, indent: true },
        { label: "Flank MP", value: `${vehicle.getFlankMP()}`, indent: true },
        ...(vehicle.getJumpMP() > 0 ? [{ label: "Jumping MP", value: `${vehicle.getJumpMP()}`, indent: true }] : []),
    ];
    const chassisRow = (line: IWeightLine): ITroConstructionRow[] => {
        const mass = tonsText(line.weight);
        if (line.name === "Internal Structure") {
            const type = vehicle.getStructureType();
            return [{ label: type === "standard" ? "Internal Structure" : `Internal Structure (${capitalize(type)})`, mass }];
        }
        if (line.name === vehicle.getEngineType().name || (support && line.name.endsWith(" Engine"))) {
            const heatSinks: ITroConstructionRow[] = weightedHeatSinks || support ? [] : [{ label: "Heat Sinks", value: `${vehicle.getTotalHeatSinks()}`, mass: "0" }];
            return [{ label: line.name, value: `${vehicle.getEngineRating()}`, mass }, ...movement(), ...heatSinks];
        }
        if (line.name.includes("Heat Sinks")) {
            return [{ label: line.name, value: `${vehicle.getTotalHeatSinks()}`, mass }];
        }
        if (line.name === "Armor" || line.name.startsWith("Armor (BAR")) {
            const type = line.name === "Armor" ? vehicle.getArmorType().name : line.name.slice("Armor (".length, -1);
            return [{ label: `Armor Factor (${type})`, value: `${vehicle.getArmorPoints()}`, mass }];
        }
        if (line.name === "Jump Jets") {
            return [{ label: line.name, value: `${vehicle.getJumpMP()}`, mass }];
        }
        return [{ label: line.name, mass }];
    };
    const { construction, equipmentRows } = weightLineRows(lines, chassisRow, (location) => vehicleLocationName(vehicle, location));
    const structure = vehicle.getStructureAllocation();
    const armor = vehicle.getArmorAllocation();
    construction.push(
        { label: "Internal Structure / Armor by location", heading: true },
        ...vehicle.getLocations().map((location) => ({ label: location.name, value: `${structure[location.tag] ?? 0} / ${armor[location.tag] ?? 0}`, indent: true })),
    );
    return { construction, equipmentRows };
}

function vehicleParts(vehicle: Vehicle): IUnitTroParts {
    const tons = vehicle.getTonnage();
    const jump = vehicle.getJumpMP();
    const { construction, equipmentRows } = vehicleConstruction(vehicle);
    return {
        spec: {
            title: vehicle.getName(),
            subtitle: subtitle(vehicle.getModel(), vehicle.getTech().name, `${tons} tons`),
            mass: `${tons} tons`,
            cruisingSpeed: kph(vehicle.getCruiseMP()),
            maximumSpeed: kph(vehicle.getFlankMP()),
            jumpCapacity: jump > 0 ? `${jump * 30} meters` : undefined,
            armorType: vehicle.getArmorType().name,
        },
        components: [
            { key: "chassis", label: `Chassis (${capitalize(vehicle.getStructureType())})` },
            { key: "engine", label: vehicle.isUnpoweredTrailer() ? "Engine (None, Trailer)" : `Engine (${vehicle.getEngineType().name} ${vehicle.getEngineRating()})` },
            { key: "armor", label: `Armor (${vehicle.getArmorType().name})` },
        ],
        construction,
        equipmentRows,
        equipment: catalogEquipment(vehicle.getEquipmentList(), (location) => vehicleLocationName(vehicle, location)),
    };
}

function fighterLocationName(location?: string): string {
    return FIGHTER_LOCATIONS.find((entry) => entry.tag === location)?.name ?? (location ? capitalize(location) : "Fuselage");
}

/** TRO-style rows: the fighter's weight list with thrust and structural integrity under the engine, then armor by arc. */
function fighterConstruction(fighter: AerospaceFighter): { construction: ITroConstructionRow[]; equipmentRows: ITroConstructionRow[] } {
    const support = fighter.isSupportVehicle();
    const integrity = `${fighter.getStructuralIntegrity()}`;
    const chassisRow = (line: IWeightLine): ITroConstructionRow[] => {
        const mass = tonsText(line.weight);
        if (line.name === "Chassis (Structural Integrity)") {
            return [{ label: line.name, value: integrity, mass }];
        }
        if (line.name.startsWith("Engine (") || (support && line.name.endsWith(" Engine"))) {
            return [
                ...engineWithThrust(line.name, mass, fighter),
                // An aerospace fighter's structural integrity weighs nothing; a support vehicle's is its chassis.
                ...(support ? [] : [{ label: "Structural Integrity", value: integrity, mass: "0" }]),
            ];
        }
        return [{ label: line.name, mass }];
    };
    const { construction, equipmentRows } = weightLineRows(fighter.getWeights(), chassisRow, fighterLocationName);
    const armor = fighter.getArmorAllocation();
    construction.push(
        { label: "Armor by location", heading: true },
        ...FIGHTER_ARCS.map((arc) => ({
            label: arc.name,
            value: fighter.isPatchworkArmor() ? `${armor[arc.tag]} (${fighter.getPatchworkArmorType(arc.tag).name})` : `${armor[arc.tag]}`,
            indent: true,
        })),
    );
    return { construction, equipmentRows };
}

function fighterParts(fighter: AerospaceFighter): IUnitTroParts {
    const tons = fighter.getTonnage();
    const { construction, equipmentRows } = fighterConstruction(fighter);
    return {
        spec: {
            title: fighter.getName(),
            subtitle: subtitle(fighter.getModel(), fighter.getTech().name, `${tons} tons`),
            mass: `${tons} tons`,
            cruisingSpeed: `Safe Thrust ${fighter.getSafeThrust()}`,
            maximumSpeed: `Maximum Thrust ${fighter.getMaxThrust()}`,
            armorType: fighter.getArmorType().name,
        },
        components: [
            { key: "chassis", label: "Chassis" },
            { key: "engine", label: `Engine (${fighter.getEngineType().name} ${fighter.getEngineRating()})` },
            { key: "armor", label: `Armor (${fighter.getArmorType().name})` },
        ],
        construction,
        equipmentRows,
        equipment: catalogEquipment(fighter.getEquipmentList(), (location) => fighterLocationName(location)),
    };
}

function infantryParts(platoon: InfantryPlatoon): IUnitTroParts {
    const secondary = platoon.getSecondaryWeapon();
    const armor = platoon.getArmor();
    const equipment: IUnitTroParts["equipment"] = [
        { item: platoon.getPrimaryWeapon(), name: platoon.getPrimaryWeapon().name, location: `${platoon.getPrimaryCount()} troopers`, armament: true },
    ];
    if (secondary) {
        equipment.push({ item: secondary, name: secondary.name, location: `${platoon.getSecondaryCount()} troopers (${platoon.getSecondaryPerSquad()} per squad)`, armament: true });
    }
    // Field guns or field artillery with their ammunition, a ton for each gun (TO:AUE pp.122-123).
    const gun = platoon.getFieldGunWeapon();
    if (gun && platoon.getFieldGunCount() > 0) {
        equipment.push({ item: gun, name: `${platoon.getFieldGunCount()} x ${gun.name}`, location: platoon.isFieldArtillery() ? "field artillery" : `field guns, ${platoon.getFieldGunCrew()} troopers each`, armament: true, mass: `${platoon.getFieldGunCount() * gun.weight}` });
        for (const ammo of platoon.getFieldGunAmmo()) equipment.push({ item: ammo, name: ammo.name, location: "field gun ammunition, 1 ton", armament: false, mass: "1" });
    }
    return {
        spec: {
            title: platoon.getName(),
            subtitle: subtitle(`${platoon.getMotive().name} infantry`, `${platoon.getTroopers()} troopers`),
            mass: `${platoon.getWeight()} tons`,
            armorType: armor?.name,
        },
        components: [{ key: "armor", label: `Armor (${armor?.name ?? "none"})` }],
        construction: [
            { label: "Transport Weight", mass: `${platoon.getWeight()}` },
            { label: "Tech Base", value: platoon.getTechName() },
            { label: `Motive (${platoon.getMotive().name})`, value: platoon.getMovementText() },
            ...(platoon.getMount() ? [
                { label: `Creature (${platoon.getMount()!.name}, ${platoon.getBeastSize()!.name})`, value: `${platoon.getMount()!.weight} tons each; attackers ${platoon.getAttackerToHitModifier() >= 0 ? "+" : ""}${platoon.getAttackerToHitModifier()} to-hit; damage divisor ${platoon.getMount()!.damageDivisor}` },
                ...(platoon.getBonusDamageText() ? [{ label: "Bonus Damage", value: platoon.getBonusDamageText() }] : []),
            ] : []),
            { label: "Formation", value: platoon.getFormation().name },
            { label: "Platoon", value: `${platoon.getSquads()} squads of ${platoon.getSquadSize()} (${platoon.getTroopers()} troopers)` },
            { label: `Armor Kit (${armor?.name ?? "None"})`, value: `Damage Divisor ${platoon.getDamageDivisor()}` },
            ...(platoon.hasAntiMechKit() ? [{ label: "Anti-'Mech Training", value: `Skill ${platoon.getAntiMechSkill()}` }] : []),
            // Cybernetic and prosthetic augmentation (IO:AE pp.70-79), each implant with what it does and costs.
            ...platoon.getAugmentations().map((item, index) => ({ label: `Augmentation: ${platoon.getAugmentationLabels()[index]}`, value: `IO:AE p.${item.page}; ${item.cost.toLocaleString("en-US")} C-bills ${item.costUnit ?? (item.scope === "all" ? "a trooper" : item.scope === "quarter" ? "for a fourth of the troopers" : "for the commander")}` })),
            ...(platoon.getSpecialFeatures().length > 0 ? [{ label: "Special Features", value: platoon.getSpecialFeatures().join(", ") }] : []),
            // Specialized infantry, VTOL and SCUBA infantry and XCT troops (TO:AUE pp.135, 152-153, 162).
            ...(platoon.getSpecialtySheetText() ? [{ label: "Specialization", value: platoon.getSpecialtySheetText() }] : []),
            ...(platoon.getEngineerTasks().length > 0 ? [{ label: "Engineer Tasks", value: platoon.getEngineerTasks().join(", ") }] : []),
            ...(platoon.getTypeModifierParts().length > 0 ? [{ label: "Unit Type Modifier", value: `${platoon.getTypeModifier().toFixed(1)}${platoon.isSpecialized() ? " (Veteran or better required)" : ""}` }] : []),
        ],
        equipment,
    };
}

function battleArmorParts(squad: BattleArmor): IUnitTroParts {
    const jump = squad.getJumpMP();
    return {
        spec: {
            title: squad.getName(),
            subtitle: subtitle(`${squad.getSquadSize()} troopers`),
            mass: `${squad.getWeight()} kg per trooper`,
            cruisingSpeed: kph(squad.getGroundMP()),
            jumpCapacity: jump > 0 ? `${jump * 30} meters` : undefined,
            armorType: squad.getArmor().name,
        },
        components: [
            { key: "chassis", label: "Chassis" },
            { key: "armor", label: `Armor (${squad.getArmor().name})` },
        ],
        construction: squad.getWeightLog().map((line) => ({ label: line.label, mass: `${line.kg} kg` })),
        equipment: squad.getItems().map((item) => ({ item, name: squad.getItemLabel(item), location: `${item.location}`, armament: true, mass: `${squad.getItemWeight(item)} kg` })),
    };
}

function protoMechParts(proto: ProtoMech): IUnitTroParts {
    const jump = proto.getJumpMP();
    return {
        spec: {
            title: proto.getName(),
            subtitle: subtitle(proto.getChassisName(), `${proto.getTons()} tons`),
            mass: `${proto.getTons()} tons`,
            cruisingSpeed: kph(proto.getWalkMP()),
            maximumSpeed: kph(proto.getRunMP()),
            jumpCapacity: jump > 0 ? `${jump * 30} meters` : undefined,
            armorType: proto.getArmorTypeName(),
        },
        components: [
            { key: "chassis", label: "Chassis" },
            { key: "engine", label: `Engine (${proto.getEngineRating()})` },
            { key: "armor", label: `Armor (${proto.getArmorTypeName()})` },
        ],
        construction: proto.getWeightLog().map((line) => ({ label: line.label, mass: `${line.kg} kg` })),
        equipment: proto.getWeaponLines().map((line) => ({ item: { tag: line.name }, name: line.name, location: line.location, armament: true })),
    };
}

/** A Walker (fan-made four-legged 'Mech): its spec block, components, weight list and the equipment by location. */
function walkerParts(walker: Walker): IUnitTroParts {
    const jump = walker.getJumpMP();
    const equipment = walker.getEquipment();
    const where = (each: (typeof equipment)[number]): string =>
        `${walker.getLocationName(each.location)}${each.split ? ` and ${walker.getLocationName(each.split.location)}` : ""}${each.inTurret ? " (turret)" : ""}`;
    return {
        spec: {
            title: walker.getDisplayName(),
            subtitle: subtitle(walker.isIndustrial() ? "Industrial Walker" : "Walker", walker.getTechTag() === "clan" ? "Clan" : "Inner Sphere", `${walker.getTons()} tons`),
            mass: `${walker.getTons()} tons`,
            cruisingSpeed: kph(walker.getWalkerWalkMP()),
            maximumSpeed: kph(walker.getRunMP()),
            jumpCapacity: jump > 0 ? `${jump * 30} meters` : undefined,
        },
        components: [
            { key: "chassis", label: walker.isIndustrial() ? "Industrial Walker Chassis" : "Walker Chassis" },
            { key: "engine", label: `Engine (${walker.getEngineName()} ${walker.getEngineRating()})` },
            { key: "armor", label: "Armor" },
        ],
        construction: walker.getWeightLog().map((line) => ({ label: line.name, mass: tonsText(line.weight) })),
        equipment: equipment.filter((each) => !each.isAmmo).map((each) => ({ item: { uuid: each.uuid, tag: each.tag }, name: each.name, location: where(each), armament: !each.item.isEquipment })),
    };
}

/** Armor facings: a spheroid's sides are its sides, an aerodyne's its wings. */
function smallCraftFacingName(craft: SmallCraft, facing: "nose" | "left" | "right" | "aft"): string {
    if (facing === "left" || facing === "right") {
        return `${capitalize(facing)} ${craft.getShape() === "spheroid" ? "Side" : "Wing"}`;
    }
    return capitalize(facing);
}

function smallCraftParts(craft: SmallCraft): IUnitTroParts {
    const tons = craft.getTonnage();
    const arcName = (location?: string): string => (SMALL_CRAFT_ARCS as string[]).includes(location ?? "") ? craft.getArcName(location as SmallCraftArc) : "Hull";
    const chassisRow = (line: IWeightLine): ITroConstructionRow[] => {
        const mass = tonsText(line.weight);
        if (line.name.startsWith("Engine (")) {
            return engineWithThrust(line.name, mass, craft);
        }
        return [{ label: line.name, mass }];
    };
    const { construction, equipmentRows } = weightLineRows(craft.getWeights(), chassisRow, arcName, "construction");
    const armor = craft.getArmorAllocation();
    construction.push(
        { label: "Armor by location", heading: true },
        ...(["nose", "left", "right", "aft"] as const).map((facing) => ({ label: smallCraftFacingName(craft, facing), value: `${armor[facing]}`, indent: true })),
    );
    return {
        spec: {
            title: craft.getName(),
            subtitle: subtitle(craft.getModel(), craft.getTech().name, `${craft.getShapeName()} ${craft.getCraftTypeName()}`, `${tons} tons`),
            mass: `${tons} tons`,
            cruisingSpeed: `Safe Thrust ${craft.getSafeThrust()}`,
            maximumSpeed: `Maximum Thrust ${craft.getMaxThrust()}`,
            armorType: craft.getArmorType().name,
        },
        components: [
            { key: "chassis", label: "Hull" },
            { key: "engine", label: "Engine" },
            { key: "armor", label: `Armor (${craft.getArmorType().name})` },
        ],
        construction,
        equipmentRows,
        equipment: [
            ...catalogEquipment(craft.getEquipmentList(), arcName),
            ...mountEquipment(craft.getCapitalWeapons(), (mount) => arcName(mount.location)),
        ],
    };
}

/** TRO-style rows: the vessel's weight list with thrust under a WarShip's engine, then armor by facing (free armor included). */
function capitalShipParts(ship: CapitalShip): IUnitTroParts {
    const tons = `${ship.getTonnage().toLocaleString("en-US")} tons`;
    const arcName = (location?: string): string => ship.getArcs().includes(location as AdvancedAerospaceArc) ? ship.getArcName(location as AdvancedAerospaceArc) : "Hull";
    const chassisRow = (line: IWeightLine): ITroConstructionRow[] => {
        const mass = tonsText(line.weight);
        return ship.isWarShip() && line.name.startsWith("Engine (") ? engineWithThrust(line.name, mass, ship) : [{ label: line.name, mass }];
    };
    const { construction, equipmentRows } = weightLineRows(ship.getWeights(), chassisRow, arcName, "construction");
    construction.push(
        { label: "Armor by location", heading: true },
        ...ADVANCED_AEROSPACE_FACINGS.map((facing) => ({ label: ship.getFacingName(facing), value: `${ship.getFacingArmor(facing)}`, indent: true })),
    );
    return {
        spec: {
            title: ship.getName(),
            subtitle: subtitle(ship.getModel(), ship.getTech().name, ship.getShipTypeName(), tons),
            mass: tons,
            cruisingSpeed: ship.isWarShip() ? `Safe Thrust ${ship.getSafeThrust()}` : "Station-keeping",
            maximumSpeed: ship.isWarShip() ? `Maximum Thrust ${ship.getMaxThrust()}` : undefined,
            armorType: ship.getArmorType().name,
        },
        components: [
            { key: "chassis", label: "Hull" },
            { key: "engine", label: ship.isWarShip() ? "Engine" : "Station-Keeping Drive" },
            ...(ship.hasKFDrive() ? [{ key: "kfDrive", label: "K-F Drive" }] : []),
            { key: "armor", label: `Armor (${ship.getArmorType().name})` },
        ],
        construction,
        equipmentRows,
        equipment: [
            ...catalogEquipment(ship.getEquipmentList(), arcName),
            ...mountEquipment(ship.getCapitalWeapons(), (mount) => arcName(mount.location)),
        ],
    };
}

/** A building's structural modifications (TO:AR pp.134-139), as one line; its fittings are in the weight list. */
function buildingModifications(building: Building): string {
    const doors = building.getDoors().length;
    const subsurface = building.getSubsurface();
    const parts = [
        building.isSealed() ? "environmentally sealed" : "",
        building.isOpenSpace() ? "open-space construction" : "",
        building.hasHeavyMetalSuperstructure() ? "heavy metal superstructure" : "",
        building.getCeilings() !== "standard" ? `${building.getCeilings()} ceilings` : "",
        subsurface !== "none" ? `${subsurface}, ${building.getDepth()} ${building.getDepth() === 1 ? "level" : "levels"} down` : "",
        building.isTunnel() ? "tunnel" : "",
        doors > 0 ? `${doors} large ${doors === 1 ? "door" : "doors"}` : "",
    ].filter(Boolean);
    return capitalize(parts.join(", "));
}

/** TRO-style rows: superstructure, size, capacity and modifications, then the load in the building's own order, weapons by hex. */
function buildingParts(building: Building): IUnitTroParts {
    const hex = capitalize(building.getHexLabel());
    const modifications = buildingModifications(building);
    const { construction, equipmentRows } = weightLineRows(building.getWeights(), (line) => [{ label: line.name, mass: tonsText(line.weight) }], (location) => location ?? "");
    return {
        spec: {
            title: building.getDisplayName(),
            subtitle: subtitle(building.getTypeName(), building.getTech().name, building.getSizeText()),
            armorType: building.getArmorPoints() > 0 ? `${building.getArmorPoints()} points a ${building.getHexLabel()}` : undefined,
        },
        components: [
            { key: "chassis", label: "Superstructure" },
            ...(building.getGenerator() ? [{ key: "engine", label: `Generator (${building.getGenerator()!.name})` }] : []),
            ...(building.canMountArmor() ? [{ key: "armor", label: "Armor" }] : []),
        ],
        construction: [
            { label: `Superstructure (${building.getTypeName()})`, value: `CF ${building.getCF()}${building.isCapitalScale() ? " (capital scale)" : ""}` },
            { label: "Size", value: building.getSizeText() },
            ...(building.getTotalCapacity() > 0 ? [{ label: "Weight Capacity", value: `${building.getTotalWeight()} of ${building.getTotalCapacity()} tons used` }] : []),
            ...(modifications ? [{ label: "Modifications", value: modifications }] : []),
            ...construction,
        ],
        equipmentRows,
        equipment: [
            ...building.getEquipment().filter((mount) => !mount.item.isAmmo).map((mount) => ({
                item: mount.item, name: mount.item.name, location: `${hex} ${mount.hex}`, armament: mount.item.category !== "Miscellaneous Equipment",
            })),
            ...mountEquipment(building.getLightWeapons(), (mount) => `${hex} ${mount.hex}`),
            ...mountEquipment(building.getCapitalWeapons(), (mount) => `${hex} ${mount.hex}${mount.sharedHexes.length > 0 ? ` with ${mount.sharedHexes.join(", ")}` : ""}`),
        ],
    };
}

/** What the shared Technical Readout section and sheet need to know about any non-'Mech Classic unit. */
export function getUnitTroAdapter(unit: TroUnit): ITroUnitAdapter {
    if (unit instanceof Vehicle) return buildAdapter(() => vehicleParts(unit));
    if (unit instanceof AerospaceFighter) return buildAdapter(() => fighterParts(unit));
    if (unit instanceof InfantryPlatoon) return buildAdapter(() => infantryParts(unit));
    if (unit instanceof BattleArmor) return buildAdapter(() => battleArmorParts(unit));
    if (unit instanceof ProtoMech) return buildAdapter(() => protoMechParts(unit));
    if (unit instanceof CapitalShip) return buildAdapter(() => capitalShipParts(unit));
    if (unit instanceof Building) return buildAdapter(() => buildingParts(unit));
    if (unit instanceof Walker) return buildAdapter(() => walkerParts(unit));
    return buildAdapter(() => smallCraftParts(unit));
}
