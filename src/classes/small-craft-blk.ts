import { getCompatibleAmmo, getEquipmentListByTech } from "../data/equipment-registry";
import { IEquipmentItem } from "../data/data-interfaces";
import { SMALL_CRAFT_FUEL_POINTS_PER_TON, SMALL_CRAFT_MAX_TONNAGE, SMALL_CRAFT_MIN_TONNAGE, SmallCraftArc, quartersTypes } from "../data/small-craft-construction";
import { IBlkFile, blkLines, blkValue, parseBlkFile } from "../utils/blk-file";
import SmallCraft from "./small-craft";

// Reads a MegaMek Small Craft ".blk" file into a SmallCraft. The file names its equipment by MegaMek's lookup
// names; the tables below pair those names with this catalog. Anything that has no match is left off and
// reported, so the importer never guesses. Each ammunition line is one ton for the weapon it names.

// Lookup names with spaces and punctuation removed, in lower case: [Inner Sphere tag, Clan tag].
const EQUIPMENT: Record<string, [string | null, string | null]> = {
    smalllaser: ["small-laser", "small-laser-clan"],
    mediumlaser: ["medium-laser", "medium-laser-clan"],
    largelaser: ["large-laser", "clan-large-laser"],
    ppc: ["standard-ppc", "clan-standard-ppc"],
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

/** Launchers that the file fits with a fire control system listed on its own line. */
const FIRE_CONTROL: Record<string, string> = { isartemisiv: "-artemis-iv", isapollo: "-apollo" };

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
    "19": ["ferro-aluminum", "clan-ferro-aluminum"],
    "20": ["heavy-ferro-aluminum", "heavy-ferro-aluminum"],
    "21": ["light-ferro-aluminum", "light-ferro-aluminum"],
};

const LOCATIONS: { block: string; arc: SmallCraftArc | "hull"; rear?: SmallCraftArc }[] = [
    { block: "nose equipment", arc: "nose" },
    { block: "left side equipment", arc: "left", rear: "leftAft" },
    { block: "right side equipment", arc: "right", rear: "rightAft" },
    { block: "aft equipment", arc: "aft" },
    { block: "hull equipment", arc: "hull" },
];

const lookupName = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, "");
const numberOf = (file: IBlkFile, tag: string, fallback: number = 0): number => {
    const value = Number(blkValue(file, tag));
    return Number.isFinite(value) ? value : fallback;
};

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
    if (unitType.toLowerCase() !== "smallcraft") {
        return { craft: null, issues: [`This file holds a ${unitType || "unit of an unknown type"}, not a Small Craft.`], notes: [] };
    }
    const issues: string[] = [];
    const notes: string[] = [];
    const fileTons = numberOf(file, "tonnage", SMALL_CRAFT_MAX_TONNAGE);
    if (fileTons < SMALL_CRAFT_MIN_TONNAGE || fileTons > SMALL_CRAFT_MAX_TONNAGE) {
        return { craft: null, issues: [`At ${fileTons} tons this is not a Small Craft, which weighs 100 to 200 tons (TM p.184).`], notes: [] };
    }
    const craft = new SmallCraft();
    for (const quarters of quartersTypes) craft.setQuarters(quarters.tag, 0);
    craft.setName(blkValue(file, "Name"));
    craft.setModel(blkValue(file, "Model"));
    craft.setShape(blkValue(file, "motion_type").toLowerCase() === "spheroid" ? "spheroid" : "aerodyne");

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
    craft.setTonnage(fileTons);
    if (craft.getTonnage() !== fileTons) issues.push(`The file's weight of ${fileTons} tons is not a Small Craft weight; ${craft.getTonnage()} tons used.`);
    craft.setSafeThrust(numberOf(file, "SafeThrust", 4));
    craft.setFuelTons(numberOf(file, "fuel") / SMALL_CRAFT_FUEL_POINTS_PER_TON);
    const integrity = numberOf(file, "structural_integrity", craft.getMinStructuralIntegrity());
    craft.setStructuralIntegrity(integrity);
    if (craft.getStructuralIntegrity() !== integrity) issues.push(`Structural Integrity ${integrity} is outside the rules; ${craft.getStructuralIntegrity()} used.`);

    const armorCode = blkValue(file, "armor_type") || "41";
    const armorTag = ARMOR[armorCode]?.[clan ? 1 : 0];
    if (!armorTag) issues.push(`Armor type ${armorCode} is not one this builder has for Small Craft; standard armor used.`);
    else if (craft.setArmorType(armorTag).tag !== armorTag) issues.push(`${armorTag} armor is not available to this tech base; standard armor used.`);
    const armor = blkLines(file, "armor").map((line) => Number(line)).filter((value) => Number.isFinite(value));
    const facings = ["nose", "left", "right", "aft"] as const;
    const total = armor.slice(0, 4).reduce((sum, value) => sum + value, 0);
    // The file lists the points on each facing, the structure's free points among them.
    const bought = Math.max(0, total - craft.getBonusArmorPoints());
    craft.setArmorTons(Math.ceil(bought / (craft.getArmorPointsPerTon() ?? 16) * 2 - 1e-9) / 2);
    facings.forEach((facing, index) => craft.setArmorAllocation(facing, armor[index] ?? 0));

    // Equipment.
    const techCatalog = clan ? "clan" : "is";
    const ammoCatalog: IEquipmentItem[] = [...getEquipmentListByTech("is", false), ...getEquipmentListByTech("clan", false)].filter((item) => item.isAmmo);
    const mounted: Record<string, IEquipmentItem[]> = {};
    const pendingAmmo: string[] = [];
    const pendingFireControl: { name: string; arc: string }[] = [];
    for (const location of LOCATIONS) {
        for (const rawLine of blkLines(file, location.block)) {
            const rear = /\(R\)/i.test(rawLine);
            const name = lookupName(rawLine.replace(/\(R\)/gi, "").replace(/:.*$/, ""));
            if (!name) continue;
            if (AMMO[name]) {
                pendingAmmo.push(name);
                continue;
            }
            if (FIRE_CONTROL[name]) {
                pendingFireControl.push({ name, arc: location.arc });
                continue;
            }
            const pair = EQUIPMENT[name];
            const tag = pair ? pair[techCatalog === "clan" ? 1 : 0] ?? pair[0] ?? pair[1] : null;
            const arc = rear && location.rear ? location.rear : location.arc;
            const item = tag ? craft.addEquipmentFromTag(tag, arc) : null;
            if (!item) {
                issues.push(`"${rawLine.trim()}" has no match in this catalog and was left off.`);
                continue;
            }
            (mounted[name] = mounted[name] ?? []).push(item);
        }
    }
    // A fire control system upgrades one launcher in its arc to the catalog's record for the fitted launcher.
    for (const fireControl of pendingFireControl) {
        const suffix = FIRE_CONTROL[fireControl.name];
        const launcher = craft.getEquipmentList().find((item) => item.location === fireControl.arc && !item.isAmmo
            && /^(lrm|srm|mrm)-\d+$/.test(item.tag));
        const upgraded = launcher ? craft.addEquipmentFromTag(launcher.tag + suffix, fireControl.arc) : null;
        if (launcher && upgraded) {
            craft.removeEquipment(launcher.uuid ?? "");
            for (const list of Object.values(mounted)) {
                const index = list.indexOf(launcher);
                if (index >= 0) list[index] = upgraded;
            }
        } else {
            issues.push(`A fire control system (${fireControl.name}) had no launcher to fit and was left off.`);
        }
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
        } else if (kind === "cargobay") {
            if (craft.addBay("cargo", size)) craft.setBay(craft.getBays().length - 1, size, doors);
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
    // The file's crew count takes in the troops its bays carry, who bunk in the bays and need no quarters (TM
    // p.188): the crew proper is whoever has quarters, and never fewer than the rules require.
    const passengers = numberOf(file, "passengers") + numberOf(file, "otherpassenger");
    const listed = numberOf(file, "crew", craft.getMinimumCrew());
    const housed = Math.max(0, craft.getQuartersCapacity() - passengers);
    const carriesTroops = craft.getBays().some((bay) => bay.tag.startsWith("infantry") || bay.tag.startsWith("battle-armor"));
    const crew = carriesTroops && listed > housed ? housed : listed;
    craft.setCrew(crew);
    if (crew !== listed) notes.push(`The file lists ${listed} aboard; ${craft.getCrew()} are crew with quarters, the rest ride in the bays.`);
    else if (craft.getCrew() !== listed) notes.push(`The file lists a crew of ${listed}; the minimum for this craft is ${craft.getMinimumCrew()}.`);
    craft.setOfficers(numberOf(file, "officers"));
    craft.setPassengers(passengers);
    craft.setLifeBoats(numberOf(file, "life_boat"));
    craft.setEscapePods(numberOf(file, "escape_pod"));
    return { craft, issues, notes };
};
