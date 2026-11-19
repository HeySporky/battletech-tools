import { getCompatibleAmmo, getEquipmentRecordsByTech, getWeaponShotsPerTon } from "../data/equipment-registry";
import { IEquipmentItem } from "../data/data-interfaces";
import {
    DROPSHIP_MAX_TONNAGE, DROPSHIP_MIN_TONNAGE, SMALL_CRAFT_ARCS, SMALL_CRAFT_MAX_TONNAGE, SMALL_CRAFT_MIN_TONNAGE, SmallCraftArc, findTransportBayType, quartersTypes,
    PRIMITIVE_ARMOR_FACTOR,
} from "../data/small-craft-construction";
import { IBlkFile, blkLines, blkValue, parseBlkFile } from "../utils/blk-file";
import { readBlkTechnicalReadout } from "../utils/blk-technical-readout";
import SmallCraft from "./small-craft";
import { findImportedEquipment } from "../utils/importedEquipment";
import { IBlkAmmoLine, findBlkAmmo, findBlkAmmoWeapon, parseBlkAmmoLine } from "../utils/blk-ammo";
import { findCapitalWeaponByName, getCapitalAmmoTags } from "../data/capital-weapon-helpers";
import { ICapitalWeapon } from "../data/data-interfaces";
import { applyBlkQuirks, IBlkImportedItem } from "../utils/blk-quirks";
import { getBlkFireControlSuffix, getBlkFittedTag } from "../utils/blk-fire-control";

// Reads a MegaMek Small Craft ".blk" file into a SmallCraft. The file names its equipment by MegaMek's lookup
// names; the tables below pair those names with this catalog. Anything that has no match is left off and
// reported, so the importer never guesses. Each ammunition line is one ton for the weapon it names.

// Lookup names with spaces and punctuation removed, in lower case: [Inner Sphere tag, Clan tag].
const EQUIPMENT: Record<string, [string | null, string | null]> = {
    smalllaser: ["small-laser", "small-laser-clan"],
    mediumlaser: ["medium-laser", "medium-laser-clan"],
    largelaser: ["large-laser", "clan-large-laser"],
    ppc: ["standard-ppc", "clan-standard-ppc"],
    isppc: ["standard-ppc", null],
    heavyppc: ["heavy-ppc", null],
    isheavyppc: ["heavy-ppc", null],
    isersmalllaser: ["er-small-laser", null],
    isermediumlaser: ["er-medium-laser", null],
    iserlargelaser: ["er-large-laser", null],
    iserppc: ["er-ppc", null],
    issmallpulselaser: ["small-pulse-laser", null],
    ismediumpulselaser: ["medium-pulse-laser", null],
    islargepulselaser: ["large-pulse-laser", null],
    clersmalllaser: [null, "er-small-laser-clan"],
    clermediumlaser: [null, "er-medium-laser-clan"],
    clerlargelaser: [null, "clan-er-large-laser"],
    clerppc: [null, "er-ppc-clan"],
    clsmallpulselaser: [null, "clan-small-pulse-laser"],
    clmediumpulselaser: [null, "clan_medium-pulse-laser"],
    cllargepulselaser: [null, "clan_large-pulse-laser"],
    lrm5: ["lrm-5", "clan-sl-lrm-5"],
    lrm10: ["lrm-10", "clan-sl-lrm-10"],
    lrm15: ["lrm-15", "clan-sl-lrm-15"],
    lrm20: ["lrm-20", "clan-sl-lrm-20"],
    srm6: ["srm-6", "clan-sl-srm-6"],
    mrm40: ["mrm-40", null],
    isantimissilesystem: ["is-ams", null],
    clantimissilesystem: [null, "clan-ams"],
    islaserantimissilesystem: ["is-laser-ams", null],
    isimprovedheavygaussrifle: ["gauss-rifle-heavy-improved", null],
    islightgaussrifle: ["gauss-rifle-light", null],
    isrotaryac5: ["rotary-ac-5", null],
    clrotaryac5: [null, "clan-autocannon-rac-5"],
    isarrowiv: ["arrow-iv-system", null],
    beagleactiveprobe: ["beagle-active-probe", null],
    isguardianecmsuite: ["ecm-suite", null],
    isangelecmsuite: ["angel-ecm", null],
    clactiveprobe: [null, "clan-active-probe"],
    clecmsuite: [null, "clan-ecm-system"],
};

// Ammunition lines: the weapon lookup name the round belongs to, and the kind of round where it is not the standard one.
const AMMO: Record<string, { weapon: string; kind?: RegExp }> = {
    isammolrm5: { weapon: "lrm5" },
    isammolrm10: { weapon: "lrm10" },
    isammolrm15: { weapon: "lrm15" },
    isammolrm20: { weapon: "lrm20" },
    isammolrm5artemiscapable: { weapon: "lrm5", kind: /artemis-iv/ },
    isammolrm10artemiscapable: { weapon: "lrm10", kind: /artemis-iv/ },
    isammolrm15artemiscapable: { weapon: "lrm15", kind: /artemis-iv/ },
    isammolrm20artemiscapable: { weapon: "lrm20", kind: /artemis-iv/ },
    isammosrm6: { weapon: "srm6" },
    ismrm40ammo: { weapon: "mrm40" },
    isamsammo: { weapon: "isantimissilesystem" },
    clamsammo: { weapon: "clantimissilesystem" },
    isimprovedheavygaussammo: { weapon: "isimprovedheavygaussrifle" },
    islightgaussammo: { weapon: "islightgaussrifle" },
    isrotaryac5ammo: { weapon: "isrotaryac5" },
    clrotaryac5ammo: { weapon: "clrotaryac5" },
    isarrowivammo: { weapon: "isarrowiv" },
    isarrowivhomingammo: { weapon: "isarrowiv", kind: /homing/ },
};

const ARMOR: Record<string, [string, string]> = {
    "41": ["aerospace-standard", "aerospace-standard"],
    // MegaMek's primitive aerospace armor: standard armor on a craft built to the Primitive rules (IO:AE pp.120-121).
    "40": ["aerospace-standard", "aerospace-standard"],
    "19": ["ferro-aluminum", "clan-ferro-aluminum"],
    "20": ["heavy-ferro-aluminum", "heavy-ferro-aluminum"],
    "21": ["light-ferro-aluminum", "light-ferro-aluminum"],
};

// A file names its own equipment: keep "constructor" or "__proto__" from finding an inherited property.
[EQUIPMENT, AMMO, ARMOR].forEach((table) => Object.setPrototypeOf(table, null));

const LOCATIONS: { block: string; arc: SmallCraftArc | "hull"; rear?: SmallCraftArc }[] = [
    { block: "nose equipment", arc: "nose" },
    { block: "left side equipment", arc: "left", rear: "leftAft" },
    { block: "right side equipment", arc: "right", rear: "rightAft" },
    { block: "aft equipment", arc: "aft" },
    { block: "hull equipment", arc: "hull" },
];

// MegaMek's location abbreviations in a weapon quirk line, as the file's equipment blocks.
const BLK_ARCS: Record<string, string> = { NOS: "nose", LS: "left", LWG: "left", RS: "right", RWG: "right", AFT: "aft", HULL: "hull" };

/** MegaMek's names for the bays of each of our bay classes, which its weapon quirk lines use ("mod_weapons:NOS:1:PPC Bay"). */
const MEGAMEK_BAY_NAMES: Record<string, string[]> = Object.assign(Object.create(null), {
    "Lasers": ["Laser Bay"], "Pulse Lasers": ["Pulse Laser Bay"], "PPCs": ["PPC Bay"], "Autocannons": ["AC Bay"], "LB-X Autocannons": ["LBX AC Bay"], "Gauss": ["Gauss Bay"],
    "LRM": ["LRM Bay"], "SRM": ["SRM Bay"], "MML": ["MML Bay"], "MRM": ["MRM Bay"], "Rocket Launchers": ["Rocket Launcher Bay"],
    "Thunderbolt": ["Thunderbolt Bay"], "Artillery": ["Artillery Bay"], "Point Defense": ["AMS Bay", "Point Defense Bay"], "Plasma": ["Plasma Bay"],
});

const lookupName = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, "");

/** A capital or sub-capital weapon line: "Capital Missile Launcher (AR10 Launcher)", "Tele-operated Missile (Kraken T)". */
const findBlkCapitalWeapon = (name: string): ICapitalWeapon | undefined => {
    if (/^ammo\b/i.test(name)) return undefined;
    const inner = /capital|tele-?operated/i.test(name) ? /\(([^)]*)\)\s*$/.exec(name)?.[1] : undefined;
    return findCapitalWeaponByName(name) ?? (inner ? findCapitalWeaponByName(inner) : undefined);
};
/** The weapon whose rounds a capital ammunition line holds: "Ammo AR10 Killer Whale", "Ammo KrakenT", "Ammo Screen". */
const findBlkCapitalAmmo = (name: string): ICapitalWeapon | undefined => {
    if (!/^ammo\s/i.test(name)) return undefined;
    const rest = name.replace(/^ammo\s+/i, "").replace(/^AR10\s+/i, "");
    return findCapitalWeaponByName(rest) ?? findCapitalWeaponByName(`${rest} Launcher`);
};
const numberOf = (file: IBlkFile, tag: string, fallback: number = 0): number => {
    const value = Number(blkValue(file, tag));
    return Number.isFinite(value) ? value : fallback;
};

/** MegaMek transporter names for cargo bays (bought by the ton) and unit bays (by the cubicle). */
const CARGO_BAYS: Record<string, string> = Object.assign(Object.create(null), {
    cargobay: "cargo", liquidcargobay: "cargo-liquid", refrigeratedcargobay: "cargo-refrigerated",
    insulatedcargobay: "cargo-insulated", livestockcargobay: "cargo-livestock",
});
const UNIT_BAYS: Record<string, string> = Object.assign(Object.create(null), {
    mekbay: "mech", asfbay: "fighter", smallcraftbay: "small-craft", lightvehiclebay: "vehicle-light",
    heavyvehiclebay: "vehicle-heavy", superheavyvehiclebay: "vehicle-superheavy", protomekbay: "protomech",
});

export interface ISmallCraftBlkResult {
    craft: SmallCraft | null;
    /** What could not be carried over. */
    issues: string[];
    /** What was carried over in a different form. */
    notes: string[];
}

export const importSmallCraftBlk = (text: string): ISmallCraftBlkResult => {
    const file = parseBlkFile(text);
    if (!file) return { craft: null, issues: ["This is not a MegaMek unit file."], notes: [] };
    const unitType = blkValue(file, "UnitType");
    const dropShip = unitType.toLowerCase() === "dropship";
    if (unitType.toLowerCase() !== "smallcraft" && !dropShip) {
        return { craft: null, issues: [`This file holds a ${unitType || "unit of an unknown type"}, not a Small Craft or DropShip.`], notes: [] };
    }
    const issues: string[] = [];
    const notes: string[] = [];
    const spheroid = blkValue(file, "motion_type").toLowerCase() === "spheroid";
    const fileTons = numberOf(file, "tonnage", dropShip ? DROPSHIP_MIN_TONNAGE : SMALL_CRAFT_MAX_TONNAGE);
    if (!dropShip && (fileTons < SMALL_CRAFT_MIN_TONNAGE || fileTons > SMALL_CRAFT_MAX_TONNAGE)) {
        return { craft: null, issues: [`At ${fileTons} tons this is not a Small Craft, which weighs 100 to 200 tons (TM p.184).`], notes: [] };
    }
    const dropShipMax = DROPSHIP_MAX_TONNAGE[spheroid ? "spheroid" : "aerodyne"];
    if (dropShip && (fileTons < DROPSHIP_MIN_TONNAGE || fileTons > dropShipMax)) {
        return { craft: null, issues: [`At ${fileTons} tons this is not a DropShip, which weighs 200 to ${dropShipMax.toLocaleString("en-US")} tons (TM p.184).`], notes: [] };
    }
    const craft = new SmallCraft();
    if (dropShip) {
        craft.setCraftType("dropShip");
        // MegaMek's design type: 1 military, 0 civilian.
        craft.setMilitary(blkValue(file, "designtype") === "1");
    }
    for (const quarters of quartersTypes) craft.setQuarters(quarters.tag, 0);
    craft.setName(blkValue(file, "Name"));
    craft.setModel(blkValue(file, "Model"));
    craft.setShape(spheroid ? "spheroid" : "aerodyne");

    const type = blkValue(file, "type").toLowerCase();
    const clan = type.startsWith("clan") || type.includes("clan chassis");
    const mixed = type.includes("mixed");
    // A Clan craft uses a Clan engine and an Inner Sphere craft an Inner Sphere one (TM p.184); the file's engine
    // flag only decides it for a Mixed Tech craft.
    const engineFlag = blkValue(file, "clan_engine").toLowerCase();
    const techBase = clan ? "clan" : "is";
    craft.setTech(mixed ? (clan ? "mclan" : "mis") : techBase);
    if (mixed) craft.setEngineTechBase(engineFlag === "true" ? "clan" : engineFlag === "false" ? "is" : techBase);

    const year = numberOf(file, "year");
    if (year > 0) {
        const era = craft.getAvailableEras().find((item) => item.yearStart <= year && (item.yearEnd ?? Infinity) >= year);
        if (era) craft.setEra(era.tag);
    }
    // MegaMek marks a Primitive craft by its armor type and builds it to the rules of its year (IO:AE pp.119-121).
    if (blkValue(file, "armor_type") === "40") {
        if (craft.setPrimitiveYear(year > 0 ? year : null) === null) issues.push("The file's primitive armor needs an Inner Sphere craft with a year of introduction; built to the modern rules.");
    }
    // MegaMek's collar type: 0 K-F boom, 1 prototype boom, 2 no boom (IO:AE p.113).
    const boom = ({ "1": "prototype", "2": "none" } as Record<string, string>)[blkValue(file, "collartype")];
    if (boom) craft.setKFBoom(boom);
    craft.setTonnage(fileTons);
    if (craft.getTonnage() !== fileTons) issues.push(`The file's weight of ${fileTons} tons is not a ${craft.getCraftTypeName()} weight; ${craft.getTonnage()} tons used.`);
    // A value the file does not give is never filled in silently: say what was used in its place.
    const missing = (tag: string): boolean => blkValue(file, tag).trim() === "";
    const thrust = numberOf(file, "SafeThrust", 4);
    craft.setSafeThrust(missing("SafeThrust") ? 4 : thrust);
    if (missing("SafeThrust")) issues.push(`The file gives no Safe Thrust; ${craft.getSafeThrust()} used.`);
    else if (craft.getSafeThrust() !== thrust) issues.push(`Safe Thrust ${thrust} is outside the rules; ${craft.getSafeThrust()} used.`);
    if (missing("fuel")) issues.push("The file gives no fuel; none carried.");
    craft.setFuelTons(numberOf(file, "fuel") / craft.getFuelPointsPerTon());
    const integrity = missing("structural_integrity") ? craft.getMinStructuralIntegrity() : numberOf(file, "structural_integrity", craft.getMinStructuralIntegrity());
    craft.setStructuralIntegrity(integrity);
    if (missing("structural_integrity")) issues.push(`The file gives no Structural Integrity; the least allowed, ${craft.getStructuralIntegrity()}, used.`);
    else if (craft.getStructuralIntegrity() !== integrity) issues.push(`Structural Integrity ${integrity} is outside the rules; ${craft.getStructuralIntegrity()} used.`);

    if (missing("armor_type")) notes.push("The file names no armor type; standard armor used, as MegaMek reads it.");
    const armorCode = blkValue(file, "armor_type") || "41";
    const armorTag = ARMOR[armorCode]?.[clan ? 1 : 0];
    if (!armorTag) issues.push(`Armor type ${armorCode} is not one this builder has for Small Craft; standard armor used.`);
    else if (craft.setArmorType(armorTag).tag !== armorTag) issues.push(`${armorTag} armor is not available to this tech base; standard armor used.`);
    const armor = blkLines(file, "armor").map((line) => Number(line)).filter((value) => Number.isFinite(value));
    if (armor.length < 4) issues.push(`The file lists armor for ${armor.length} of the 4 facings; the rest carry none.`);
    const facings = ["nose", "left", "right", "aft"] as const;
    const total = armor.slice(0, 4).reduce((sum, value) => sum + value, 0);
    // The file lists the points on each facing, the structure's free points among them; on a Primitive craft after the x 0.66.
    const bought = Math.max(0, (craft.isPrimitive() ? Math.ceil(total / PRIMITIVE_ARMOR_FACTOR - 1e-9) : total) - craft.getBonusArmorPoints());
    craft.setArmorTons(Math.ceil(bought / (craft.getArmorPointsPerTon() ?? 16) * 2 - 1e-9) / 2);
    facings.forEach((facing, index) => craft.setArmorAllocation(facing, armor[index] ?? 0));

    // Equipment.
    const techCatalog = clan ? "clan" : "is";
    const ammoCatalog = [...getEquipmentRecordsByTech("is"), ...getEquipmentRecordsByTech("clan")].filter((item) => item.isAmmo);
    const mounted: Record<string, IEquipmentItem[]> = Object.create(null);
    // What the file placed where, by its own names, for its weapon quirk lines; a side's rear half counts as the side.
    const placed: IBlkImportedItem[] = [];
    const pendingAmmo: string[] = [];
    const pendingFireControl: { name: string; arc: string; rear?: string }[] = [];
    const pendingLineAmmo: { line: IBlkAmmoLine; raw: string; arc: string }[] = [];
    const pendingCapitalAmmo: { tag: string; ar10: boolean; arc: string; shots: number; raw: string }[] = [];
    for (const location of LOCATIONS) {
        for (const rawLine of blkLines(file, location.block)) {
            const rear = /\(R\)/i.test(rawLine);
            // MegaMek marks the first weapon of each DropShip weapon bay "(B)"; bays are worked out from the arcs here.
            const fileName = rawLine.replace(/\((R|B)\)/gi, "").replace(/:.*$/, "").trim();
            const capitalArc = rear && location.rear ? location.rear : location.arc;
            const capitalAmmo = findBlkCapitalAmmo(fileName);
            if (capitalAmmo) {
                const shots = Number(rawLine.split(":")[1]);
                pendingCapitalAmmo.push({ tag: capitalAmmo.tag, ar10: /^ammo\s+ar10\s/i.test(fileName), arc: capitalArc, shots: shots > 0 ? shots : 1, raw: rawLine.trim() });
                continue;
            }
            const capitalWeapon = findBlkCapitalWeapon(fileName);
            if (capitalWeapon) {
                const mount = craft.addCapitalWeapon(capitalWeapon.tag, capitalArc);
                if (!mount) issues.push(`"${rawLine.trim()}" cannot be mounted on a ${craft.getCraftTypeName()} and was left off.`);
                // Shots come from the file's ammunition lines, not the 10 a new launcher starts with.
                else {
                    for (const tag of Object.keys(mount.shots)) craft.setCapitalWeaponShots(mount.uuid, tag, 0);
                    placed.push({ name: fileName, location: location.arc, uuid: mount.uuid });
                }
                continue;
            }
            const name = lookupName(fileName);
            if (!name) continue;
            if (AMMO[name] && !dropShip) {
                pendingAmmo.push(name);
                continue;
            }
            // Fire control systems and PPC Capacitors upgrade a weapon in the arc (blk-fire-control); for aerospace
            // units a capacitor is integral to its PPC (TO:AUE p.131).
            if (getBlkFireControlSuffix(name)) {
                pendingFireControl.push({ name, arc: location.arc, rear: location.rear });
                continue;
            }
            const ammoLine = parseBlkAmmoLine(fileName);
            if (ammoLine) {
                pendingLineAmmo.push({ line: ammoLine, raw: rawLine.trim(), arc: rear && location.rear ? location.rear : location.arc });
                continue;
            }
            const pair = EQUIPMENT[name];
            // Names the table does not list go to the catalog's own import names (altNames and altTags).
            const match = pair ? null : findImportedEquipment(fileName, techCatalog, mixed);
            if (match?.item.isAmmo) {
                const shots = Number(rawLine.split(":")[1]);
                const perTon = match.item.roundsPerTon || 0;
                const bin = craft.addEquipmentFromTag(match.item.tag, rear && location.rear ? location.rear : location.arc);
                if (!bin) issues.push(`"${rawLine.trim()}" could not be carried and was left off.`);
                else if (dropShip && shots > 0 && perTon > 0) craft.setAmmoBinTons(bin.uuid, Math.ceil(shots / perTon - 1e-9));
                continue;
            }
            const tag = pair ? pair[techCatalog === "clan" ? 1 : 0] ?? pair[0] ?? pair[1] : match?.item.tag ?? null;
            const arc = rear && location.rear ? location.rear : location.arc;
            const item = tag ? craft.addEquipmentFromTag(tag, arc) : null;
            if (!item) {
                issues.push(`"${rawLine.trim()}" has no match in this catalog and was left off.`);
                continue;
            }
            (mounted[name] = mounted[name] ?? []).push(item);
            if (item.uuid) placed.push({ name: fileName, location: location.arc, uuid: item.uuid });
        }
    }
    // A fire control system upgrades one launcher in its arc to the catalog's record for the fitted launcher: any
    // standard LRM, SRM, MML (TM p.207) or MRM the catalog has with the system; a capacitor one PPC. The file does not
    // mark the system "(R)" when its weapon faces the rear, so the arc's rear half is searched too.
    for (const fireControl of pendingFireControl) {
        const suffix = getBlkFireControlSuffix(fireControl.name)!;
        const launcher = craft.getEquipmentList().find((item) => (item.location === fireControl.arc || (!!fireControl.rear && item.location === fireControl.rear)) && !item.isAmmo
            && !!getBlkFittedTag(item.tag, suffix));
        const upgradedTag = launcher ? getBlkFittedTag(launcher.tag, suffix) : undefined;
        const upgraded = launcher && upgradedTag ? craft.addEquipmentFromTag(upgradedTag, launcher.location) : null;
        if (launcher && upgraded) {
            craft.removeEquipment(launcher.uuid ?? "");
            for (const list of Object.values(mounted)) {
                const index = list.indexOf(launcher);
                if (index >= 0) list[index] = upgraded;
            }
            for (const entry of placed) if (entry.uuid === launcher.uuid && upgraded.uuid) entry.uuid = upgraded.uuid;
        } else {
            issues.push(`A fire control system or capacitor (${fireControl.name}) had no weapon to fit and was left off.`);
        }
    }
    // Ammunition the table above does not list: the line names the weapon it feeds.
    for (const { line, raw, arc } of pendingLineAmmo) {
        const weapon = findBlkAmmoWeapon(line, craft.getEquipmentList());
        const ammo = weapon ? findBlkAmmo(line, weapon) : undefined;
        // A DropShip line gives its shots after the colon; the bins are whole tons (TM p.194).
        const shots = Number(raw.split(":")[1]);
        // An MML's LRM and SRM rounds pack differently: the shots a ton are the weapon's for that round.
        const perTon = (weapon && ammo ? getWeaponShotsPerTon(weapon, ammo) : 0) || weapon?.shotsPerTon || ammo?.roundsPerTon || 0;
        const tons = dropShip && shots > 0 && perTon > 0 ? Math.ceil(shots / perTon - 1e-9) : 1;
        let added = 0;
        // A DropShip keeps each line as one bin in the bays of its arc (TM p.195); other craft carry a ton an item.
        if (ammo && dropShip) {
            const bin = craft.addEquipmentFromTag(ammo.tag, arc);
            // One kind of round may feed launchers of several sizes in a bay: the bin keeps the one its line names.
            if (bin && weapon) bin.feedsWeaponTag = weapon.tag;
            // The mass rounds up to the whole ton; the bin keeps the rounds the line gives (TM p.194).
            if (bin) added = (shots > 0 ? craft.setAmmoBinCarriedShots(bin.uuid, shots) : 0) || craft.setAmmoBinTons(bin.uuid, tons) || 1;
        }
        else for (let ton = 0; ammo && ton < tons; ton++) if (craft.addEquipmentFromTag(ammo.tag, arc)) added++;
        if (!ammo || added === 0) issues.push(`Ammunition "${raw}" has no weapon or no match in this catalog and was left off.`);
        else if (line.half && !dropShip) notes.push(`"${raw}" is a half-ton bin; carried as a full ton.`);
    }
    // Capital ammunition goes to a launcher that fires it, one in the same arc first; an "AR10" line to an AR-10.
    for (const ammo of pendingCapitalAmmo) {
        const launchers = craft.getCapitalWeapons().filter((mount) => getCapitalAmmoTags(mount.weapon).includes(ammo.tag));
        const kind = (entry: { weapon: { tag: string } }) => (entry.weapon.tag === "ar-10-launcher") === ammo.ar10;
        const groups = [
            launchers.filter((entry) => entry.location === ammo.arc && kind(entry)), launchers.filter((entry) => entry.location === ammo.arc),
            launchers.filter(kind), launchers,
        ];
        // The launchers of a bay share its ammunition; the shots are split evenly among them (a reading).
        const bay = groups.find((group) => group.length > 0) ?? [];
        if (bay.length === 0) issues.push(`Ammunition "${ammo.raw}" has no launcher that fires it and was left off.`);
        bay.forEach((mount, index) => {
            const share = Math.floor(ammo.shots / bay.length) + (index < ammo.shots % bay.length ? 1 : 0);
            craft.setCapitalWeaponShots(mount.uuid, ammo.tag, (mount.shots[ammo.tag] ?? 0) + share);
        });
    }
    for (const name of pendingAmmo) {
        const weapon = mounted[AMMO[name].weapon]?.[0];
        const kind = AMMO[name].kind;
        // A Clan weapon takes the Clan record of its round where the catalog has one for each tech base.
        const wantClan = AMMO[name].weapon.startsWith("cl");
        const candidates = (weapon ? ammoCatalog.filter((ammo) => getCompatibleAmmo(weapon, ammo)) : [])
            .sort((a, b) => Number(b.tag.includes("clan") === wantClan) - Number(a.tag.includes("clan") === wantClan));
        const ammo = candidates.find((candidate) => (kind ? kind.test(candidate.tag) : !candidate.isSpecialAmmo))
            ?? (kind ? undefined : candidates[0]);
        if (!weapon || !ammo || !craft.addEquipmentFromTag(ammo.tag)) issues.push(`Ammunition "${name}" has no weapon or no match in this catalog and was left off.`);
    }

    // Heat sinks: the file gives the total.
    craft.setHeatSinkType(blkValue(file, "sink_type") === "1" ? "double" : "single");
    const sinks = numberOf(file, "heatsinks");
    craft.setAdditionalHeatSinks(Math.max(0, sinks - craft.getFreeHeatSinks()));
    if (sinks < craft.getFreeHeatSinks()) notes.push(`The file lists ${sinks} heat sinks; the engine gives ${craft.getFreeHeatSinks()} free.`);

    // Crew, quarters and bays.
    const quarterTags: Record<string, (typeof quartersTypes)[number]> = {
        "1stclassquarters": quartersTypes[0], "2ndclassquarters": quartersTypes[1], crewquarters: quartersTypes[2], steeragequarters: quartersTypes[3],
    };
    for (const line of blkLines(file, "transporters")) {
        const parts = line.split(":");
        const kind = parts[0].toLowerCase();
        const size = Number(parts[1]);
        const doors = Number(parts[2]) || 0;
        if (!Number.isFinite(size) || size <= 0) continue;
        const quarters = quarterTags[kind];
        if (quarters) {
            craft.setQuarters(quarters.tag, Math.round(size / quarters.tons));
        } else if (CARGO_BAYS[kind] || UNIT_BAYS[kind]) {
            if (craft.addBay(CARGO_BAYS[kind] ?? UNIT_BAYS[kind], size)) craft.setBay(craft.getBays().length - 1, size, doors);
        } else if (kind === "troopspace") {
            craft.addBay("infantry-compartment", size);
        } else if (kind === "infantrybay") {
            const platoon = (parts[4] ?? "").toLowerCase();
            const tag = platoon === "jump" ? "infantry-jump" : platoon === "motorized" ? "infantry-motorized" : platoon === "mechanized" ? "infantry-mechanized" : "infantry-foot";
            if (craft.addBay(tag, size)) craft.setBay(craft.getBays().length - 1, size, doors);
        } else if (kind === "battlearmorbay") {
            // The last field marks a Clan (2) or ComStar (1) bay; otherwise the bay follows the craft's tech base.
            const flags = Number(parts[6]) || 0;
            const tag = flags & 2 || (!flags && clan) ? "battle-armor-clan" : flags & 1 ? "battle-armor-is-6" : "battle-armor-is";
            if (craft.addBay(tag, size)) craft.setBay(craft.getBays().length - 1, size, doors);
        } else {
            issues.push(`Transport bay "${kind}" is not one this builder has and was left off.`);
        }
    }
    // The file's crew count takes in the troops its bays carry and the bay personnel, who bunk in the bays and need
    // no quarters (TM pp.188, 239): the crew proper is whoever has quarters, and never fewer than the rules require.
    const passengers = numberOf(file, "passengers") + numberOf(file, "otherpassenger");
    const listed = numberOf(file, "crew", craft.getMinimumCrew());
    const housed = Math.max(0, craft.getQuartersCapacity() - passengers);
    const bayPersonnel = craft.getBays().reduce((sum, bay) => sum + (findTransportBayType(bay.tag)?.personnel ?? 0) * bay.amount, 0);
    const carriesTroops = craft.getBays().some((bay) => bay.tag.startsWith("infantry") || bay.tag.startsWith("battle-armor"));
    const crew = (carriesTroops || bayPersonnel > 0) && listed > housed ? Math.max(housed, listed - bayPersonnel) : listed;
    craft.setCrew(crew);
    if (crew !== listed) notes.push(`The file lists ${listed} aboard; ${craft.getCrew()} are crew with quarters, the rest ride in the bays.`);
    else if (craft.getCrew() !== listed) notes.push(`The file lists a crew of ${listed}; the minimum for this craft is ${craft.getMinimumCrew()}.`);
    craft.setOfficers(numberOf(file, "officers"));
    craft.setPassengers(passengers);
    craft.setLifeBoats(numberOf(file, "life_boat"));
    craft.setEscapePods(numberOf(file, "escape_pod"));
    // A bay quirk line names the bay by its class; a side's rear half counts as the side, as for weapons.
    for (const arc of SMALL_CRAFT_ARCS) {
        const side = arc === "leftAft" ? "left" : arc === "rightAft" ? "right" : arc;
        for (const bay of craft.getArcWeaponBays(arc)) {
            const names = MEGAMEK_BAY_NAMES[bay.name] ?? [`${bay.name} Bay`];
            if (bay.uuids[0]) for (const name of names) placed.push({ name, location: side, uuid: bay.uuids[0] });
        }
    }
    applyBlkQuirks(file, craft, placed, issues, (abbr) => BLK_ARCS[abbr.toUpperCase()]);
    craft.tro.import(readBlkTechnicalReadout(file));
    return { craft, issues, notes };
};
