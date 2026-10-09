import { battleArmorArmorTypes } from "../data/battle-armor-armor-types";
import { BattleArmorTechBase, BattleArmorWeightClass, battleArmorManipulators } from "../data/battle-armor-construction";
import { findBattleArmorEquipment } from "../data/battle-armor-equipment";
import { btEraOptions } from "../data/era-options";
import { IBlkFile, blkLines, blkValue, parseBlkFile } from "../utils/blk-file";
import BattleArmor, { BattleArmorArm, BattleArmorLocation, IBattleArmorMountedItem } from "./battle-armor";

// Reads a MegaMek battle armor ".blk" file into a suit. The file names its equipment by MegaMek's lookup names;
// the tables below pair those names with this catalog. Anything that has no match is left off and reported, so
// the importer never guesses. A mixed-technology suit keeps each item's own technology base; a name both bases
// use is read on the chassis' base. Equipment listed for every trooper is the squad's; the rest is that trooper's.

const WEIGHT_CLASSES: BattleArmorWeightClass[] = ["pa-l", "light", "medium", "heavy", "assault"];

// The file's armor type numbers.
const ARMOR_CODES: Record<string, string> = {
    "28": "ba-standard", "29": "ba-standard-prototype", "30": "ba-standard-advanced", "31": "ba-stealth-basic", "32": "ba-stealth-standard",
    "33": "ba-stealth-improved", "34": "ba-stealth-prototype", "35": "ba-fire-resistant", "36": "ba-mimetic", "37": "ba-laser-reflective",
    "38": "ba-reactive",
};

const MANIPULATORS: Record<string, string> = {
    baarmoredglove: "armored-glove",
    babasicmanipulator: "basic",
    babasicmanipulatormineclearance: "basic-mine-clearance",
    babattleclaw: "battle-claw",
    babattleclawmagnets: "battle-claw-magnets",
    babattleclawvibro: "battle-claw-vibro",
    bacargolifter: "cargo-lifter",
    baheavybattleclaw: "heavy-battle-claw",
    baheavybattleclawmagnets: "heavy-battle-claw-magnets",
    baheavybattleclawvibro: "heavy-battle-claw-vibro",
    baindustrialdrill: "industrial-drill",
    basalvagearm: "salvage-arm",
};

interface IBlkEquipment {
    /** The catalog tag without its technology base. */
    slug: string;
    /** The technology base the name belongs to; absent for a name both bases use. */
    base?: BattleArmorTechBase;
}
const is = (slug: string): IBlkEquipment => ({ slug, base: "is" });
const clan = (slug: string): IBlkEquipment => ({ slug, base: "clan" });
const either = (slug: string): IBlkEquipment => ({ slug });

// Lookup names with spaces and punctuation removed, in lower case.
const EQUIPMENT: Record<string, IBlkEquipment> = {
    isbaermediumlaser: is("er-medium-laser"),
    isbaersmalllaser: is("er-small-laser"),
    isbafiredrakeneedler: is("firedrake-support-needler"),
    isbaheavymachinegun: is("heavy-machine-gun"),
    isbakingdavidlightgaussrifle: is("king-david-light-gauss-rifle"),
    badavidlightgaussrifle: is("david-light-gauss-rifle"),
    isbagrandmaulergausscannon: is("grand-mauler-gauss-rifle"),
    isbamagshotgaussrifle: is("magshot-gauss-rifle"),
    isbatsunamiheavygaussrifle: is("tsunami-gauss-rifle"),
    isbamediumlaser: is("medium-laser"),
    isbamediumpulselaser: is("medium-pulse-laser"),
    isbamediumvsplaser: is("medium-variable-speed-pulse-laser"),
    isbasmalllaser: is("small-laser"),
    isbasmallpulselaser: is("small-pulse-laser"),
    isbasmallvsplaser: is("small-variable-speed-pulse-laser"),
    isbamicrogrenadelauncher: is("micro-grenade-launcher"),
    isbaplasmarifle: is("plasma-rifle-man-portable"),
    isbasupportppc: is("support-ppc"),
    isbataser: is("taser"),
    isbatubeartillery: is("tube-artillery"),
    isbalightactiveprobe: is("active-probe"),
    isbaminedispenser: either("mine-dispenser"),
    isbaremotesensordispenser: either("remote-sensor-dispenser"),
    isbaspaceoperationsadaptation: either("space-operations-adaptation"),
    isbaheatsensor: is("heat-sensor"),
    isbc3i: is("improved-c3-system"),
    battlearmorc3: is("c3-system"),
    isimprovedsensors: is("improved-sensors"),
    isbaecm: is("ecm-suite"),
    baisangelecmsuite: is("angel-ecm"),
    baminelauncher: is("pop-up-mine"),
    camosystem: is("camo-system"),
    bamagneticclamp: is("magnetic-clamps"),
    bapartialwing: is("partial-wing"),
    bamechanicaljumpbooster: is("mechanical-jump-booster"),
    machinegunbearhunterac: clan("bearhunter-superheavy-ac"),
    battlearmorlbxac: clan("lb-x-autocannon"),
    baclermediumpulselaser: clan("er-medium-pulse-laser"),
    clbaersmallpulselaser: clan("er-small-pulse-laser"),
    clbaapgaussrifle: clan("ap-gauss-rifle"),
    clbaermediumlaser: clan("er-medium-laser"),
    clbaermicrolaser: clan("er-micro-laser"),
    clbaersmalllaser: clan("er-small-laser"),
    clbaheavysmalllaser: clan("heavy-small-laser"),
    clbaheavymediumlaser: clan("heavy-medium-laser"),
    clbamediumpulselaser: clan("medium-pulse-laser"),
    clbamicropulselaser: clan("micro-pulse-laser"),
    clbasmalllaser: clan("small-laser"),
    clbasmallpulselaser: clan("small-pulse-laser"),
    clbamyomerbooster: clan("myomer-booster"),
    clbamicrobomb: clan("bomb-rack"),
    climprovedsensors: clan("improved-sensors"),
    clbaecm: clan("ecm-suite"),
    // Names both technology bases use.
    clbaflamer: either("flamer-ba"),
    clbaheavyflamer: either("heavy-flamer"),
    clbamg: either("machine-gun"),
    clbalightmg: either("light-machine-gun"),
    clbaheavymg: either("heavy-machine-gun"),
    clbaheavygrenadelauncher: either("heavy-grenade-launcher"),
    clbalightrecoillessrifle: either("light-recoilless-rifle"),
    clbamediumrecoillessrifle: either("medium-recoilless-rifle"),
    clbaheavyrecoillessrifle: either("heavy-recoilless-rifle"),
    clbalightmortar: either("light-mortar"),
    clbaheavymortar: either("heavy-mortar"),
    clbalighttag: either("light-tag"),
    clbacompactnarc: either("compact-narc"),
    baextendedlifesupport: either("extended-life-support"),
    bacuttingtorch: either("cutting-torch"),
    bajumpbooster: either("jump-booster"),
    baparafoil: either("parafoil"),
    bapowerpack: either("power-pack"),
    basearchlight: either("searchlight"),
    hhsearchlight: either("searchlight"),
    missionequipmentstorage: either("mission-equipment"),
    bafueltank: either("fuel-tank"),
    balasermicrophone: either("laser-microphone"),
    bashotgunmicrophone: either("shotgun-microphone"),
};

// Anti-personnel mount weapons, by the same kind of key.
const AP_WEAPONS: Record<string, string> = {
    infantryassaultrifle: "inf-auto-rifle",
    laserriflemauser960: "inf-laser-rifle-mauser-960-assault-sys",
    laserriflemauseriiciias: "inf-laser-rifle-mauser-iic",
    laserriflemauseriicias: "inf-laser-rifle-mauser-iic",
};

/** Lines that carry no equipment of their own: motive systems and the weapon pack marker. */
const IGNORED = new Set(["bajumpjet", "baumu", "bavtol", "isdetachableweaponpack", "cldetachableweaponpack"]);

const keyOf = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, "");

const launcherFor = (key: string): (IBlkEquipment & { oneShot: boolean }) | null => {
    let match = /^(is|cl)ba(lrm|srm|mrm)(\d)(os)?$/.exec(key);
    if (match) return { slug: `${match[2]}-${match[3]}`, base: match[1] === "is" ? "is" : "clan", oneShot: !!match[4] };
    match = /^cladvancedsrm(\d)(os)?$/.exec(key);
    if (match) return { slug: `advanced-srm-${match[1]}`, base: "clan", oneShot: !!match[2] };
    match = /^isbarl(\d)$/.exec(key);
    if (match) return { slug: `rocket-launcher-${match[1]}`, base: "is", oneShot: false };
    return null;
};

/** The launcher an ammunition line feeds, as a catalog tag ending. */
const ammunitionFor = (key: string): string | null => {
    if (!key.includes("ammo")) return null;
    const match = /(advancedsrm|srm|lrm|mrm)(\d)/.exec(key);
    if (match) return `${match[1] === "advancedsrm" ? "advanced-srm" : match[1]}-${match[2]}`;
    if (key.includes("narc")) return "compact-narc";
    if (key.includes("tubeartillery")) return "tube-artillery";
    return "";
};

interface IBlkLine {
    name: string;
    key: string;
    location: BattleArmorLocation;
    turret: boolean;
    squadSupport: boolean;
    weaponPack: boolean;
    apWeapon: boolean;
    shots: number | null;
    size: number | null;
    /** The one trooper who carries it. */
    trooper?: number;
}

const readLine = (line: string): IBlkLine => {
    const parts = line.split(":").map((part) => part.trim());
    const result: IBlkLine = { name: parts[0], key: keyOf(parts[0]), location: "body", turret: false, squadSupport: false, weaponPack: false, apWeapon: false, shots: null, size: null };
    for (let index = 1; index < parts.length; index++) {
        const part = parts[index];
        const upper = part.toUpperCase();
        if (upper === "LA") result.location = "la";
        else if (upper === "RA") result.location = "ra";
        else if (upper === "BODY") result.location = "body";
        else if (upper === "TU") result.turret = true;
        else if (upper === "SSWM") result.squadSupport = true;
        else if (upper === "DWP") result.weaponPack = true;
        else if (upper === "APM") result.apWeapon = true;
        else if (upper === "SIZE") result.size = Number(parts[index + 1]);
        else if (/^SHOTS\d+#?$/.test(upper)) result.shots = Number(upper.replace(/\D/g, ""));
    }
    return result;
};

export interface IBattleArmorBlkImport {
    suit: BattleArmor | null;
    /** What the import could not carry over, and what it changed. */
    issues: string[];
}

export const isBattleArmorBlk = (file: IBlkFile): boolean => blkValue(file, "UnitType").toLowerCase() === "battlearmor";

export const importBattleArmorBlk = (text: string): IBattleArmorBlkImport => {
    const file = parseBlkFile(text);
    if (!file) return { suit: null, issues: ["The file could not be read as a MegaMek unit file."] };
    if (!isBattleArmorBlk(file)) return { suit: null, issues: [`This is not a battle armor file${blkValue(file, "UnitType") ? ` (unit type: ${blkValue(file, "UnitType").slice(0, 40)})` : ""}.`] };

    const issues: string[] = [];
    const suit = new BattleArmor();
    const type = blkValue(file, "type").toLowerCase();
    const mixed = type.includes("mixed");
    const techBase: BattleArmorTechBase = type.includes("clan chassis") || (!mixed && type.startsWith("clan")) ? "clan" : "is";
    suit.setTechBase(techBase);
    if (mixed) suit.setMixedTech(true);
    const otherBase: BattleArmorTechBase = techBase === "clan" ? "is" : "clan";
    suit.setName(`${blkValue(file, "Name")} ${blkValue(file, "Model")}`.trim());

    const weightClass = WEIGHT_CLASSES[Number(blkValue(file, "weightclass"))];
    if (!weightClass || !suit.setWeightClass(weightClass)) issues.push(`Unknown weight class '${blkValue(file, "weightclass").slice(0, 20)}': using Medium.`);
    if (blkValue(file, "chassis").toLowerCase() === "quad") {
        suit.setBodyType("quad");
        if (!suit.isQuad()) issues.push("This weight class cannot be a quad: built as a humanoid.");
    }
    if (blkValue(file, "exoskeleton").toLowerCase() === "true") suit.setExoskeletonChassis(true);

    const troopers = Number(blkValue(file, "Trooper Count"));
    if (Number.isFinite(troopers) && troopers > 0) suit.setSquadSize(troopers);

    const cruise = Number(blkValue(file, "cruiseMP"));
    if (Number.isFinite(cruise)) {
        suit.setGroundMP(cruise);
        if (suit.getGroundMP() !== cruise) issues.push(`Ground MP ${cruise} is outside what the chassis allows: set to ${suit.getGroundMP()}.`);
    }
    const motion = blkValue(file, "motion_type").toLowerCase();
    const motiveMP = Number(blkValue(file, "jumpingMP"));
    const motive = motion === "jump" ? "jump" : motion === "vtol" ? "vtol" : motion === "umu" ? "umu" : "none";
    if (motive !== "none" && Number.isFinite(motiveMP) && motiveMP > 0) {
        if (!suit.setMotive(motive, motiveMP)) issues.push(`This suit cannot fit ${motive === "jump" ? "jump jets" : motive.toUpperCase()}: left off.`);
        else if (suit.getMotiveMP() !== motiveMP) issues.push(`${motive === "jump" ? "Jumping" : motive.toUpperCase()} MP ${motiveMP} is over the chassis maximum: set to ${suit.getMotiveMP()}.`);
    }

    const turret = /^(modular|standard)\s*:\s*(\d+)$/i.exec(blkValue(file, "turret"));
    if (turret && suit.isQuad()) {
        // A configurable mount gives up one slot of its size to the mechanism.
        const configurable = turret[1].toLowerCase() === "modular";
        suit.setTurret(Number(turret[2]) + (configurable ? 1 : 0), configurable);
    }

    // Equipment: the squad's, then each trooper's own. What every trooper lists is the squad's too.
    const lines = [...blkLines(file, "Squad Equipment"), ...blkLines(file, "Point Equipment")].map(readLine);
    const slotless = blkLines(file, "slotless_equipment").map(readLine);
    const own = Array.from({ length: suit.getSquadSize() }, (_unused, index) => blkLines(file, `Trooper ${index + 1} Equipment`).map((line) => line.trim()));
    for (const line of [...(own[0] ?? [])]) {
        if (!own.every((list) => list.includes(line))) continue;
        own.forEach((list) => list.splice(list.indexOf(line), 1));
        lines.push(readLine(line));
    }
    own.forEach((list, index) => list.forEach((line) => lines.push({ ...readLine(line), trooper: index + 1 })));

    let armorTag = ARMOR_CODES[blkValue(file, "armor_type")] ?? "";
    // The file's armor technology level: MegaMek numbers the Clan levels 2, 6, 8, 10 and 12.
    const armorTech = blkValue(file, "armor_tech");
    let armorBase: BattleArmorTechBase | undefined = /^\d+$/.test(armorTech) ? (["2", "6", "8", "10", "12"].includes(armorTech) ? "clan" : "is") : undefined;
    const pending: IBlkLine[] = [];
    for (const line of [...lines, ...slotless]) {
        if (IGNORED.has(line.key)) continue;
        // Armor is listed once for each slot it takes.
        if (/^(is|clan) ba /i.test(line.name)) {
            const armor = battleArmorArmorTypes.find((entry) => line.name.toLowerCase().endsWith(entry.name.toLowerCase()) || (entry.tag === "ba-standard-advanced" && /ba advanced$/i.test(line.name)));
            if (armor) {
                armorTag = armor.tag;
                armorBase = armorBase ?? (/^clan/i.test(line.name) ? "clan" : "is");
                continue;
            }
        }
        if (line.apWeapon || line.key === "baapmount" || line.key === "bamea" || MANIPULATORS[line.key]) {
            pending.push(line);
            continue;
        }
        if (ammunitionFor(line.key) !== null) {
            pending.push(line);
            continue;
        }
        const launcher = launcherFor(line.key);
        const known = launcher ?? EQUIPMENT[line.key];
        if (!known) {
            issues.push(`'${line.name.slice(0, 60)}' is not in the battle armor equipment tables: left off.`);
            continue;
        }
        if (known.base && known.base !== techBase && !mixed) {
            issues.push(`'${line.name.slice(0, 60)}' is ${known.base === "clan" ? "Clan" : "Inner Sphere"} equipment: left off.`);
            continue;
        }
        const equipment = findBattleArmorEquipment(`${known.base ?? techBase}-${known.slug}`) ?? (mixed && !known.base ? findBattleArmorEquipment(`${otherBase}-${known.slug}`) : null);
        const location: BattleArmorLocation = line.turret && suit.getTurret() ? "turret" : line.location;
        if (!equipment || !suit.addItem(equipment.tag, suit.getLocations().includes(location) ? location : "body")) {
            issues.push(`'${line.name.slice(0, 60)}' is not on the ${(known.base ?? techBase) === "clan" ? "Clan" : "Inner Sphere"} Battle Armor Equipment Table: left off.`);
            continue;
        }
        const index = suit.getItems().length - 1;
        const change: Partial<IBattleArmorMountedItem> = {};
        if (launcher?.oneShot) change.oneShot = true;
        if (line.squadSupport) change.squadSupport = true;
        if (line.weaponPack) change.dwp = true;
        if (line.trooper) change.trooper = line.trooper;
        if (equipment.variableWeight && line.size !== null && Number.isFinite(line.size)) change.kg = line.size;
        // An Inner Sphere suit with jump jets carries its body-mounted launchers as detachable packs (TM p.171).
        if (techBase === "is" && suit.getMotive() === "jump" && equipment.tubes && suit.getItems()[index].location === "body") change.detachable = true;
        if (Object.keys(change).length > 0) suit.updateItem(index, change);
    }

    // Ammunition goes to the launcher it feeds; manipulators, adaptors and anti-personnel mounts to their arms.
    const arms: BattleArmorArm[] = [];
    const order = (line: IBlkLine): number => (line.apWeapon ? 1 : ammunitionFor(line.key) !== null ? 2 : 0);
    for (const line of [...pending].sort((a, b) => order(a) - order(b))) {
        const feeds = ammunitionFor(line.key);
        if (feeds !== null) {
            const items = suit.getItems();
            const index = items.findIndex((entry) => entry.tag.endsWith(`-${feeds}`) && !suit.isOneShot(entry) && (entry.shots ?? 0) <= 1);
            const any = index >= 0 ? index : items.findIndex((entry) => entry.tag.endsWith(`-${feeds}`) && !suit.isOneShot(entry));
            if (!feeds || any < 0) issues.push(`Ammunition '${line.name.slice(0, 60)}' has no launcher on the suit: left off.`);
            else suit.updateItem(any, { shots: (index >= 0 ? 0 : items[any].shots ?? 0) + (line.shots ?? 1) });
            continue;
        }
        if (line.apWeapon) {
            const mounts = suit.getAPMounts();
            // The weapon line may leave its mount's location out.
            const at = mounts.findIndex((mount) => mount.location === line.location && !mount.weapon);
            const index = at >= 0 ? at : mounts.findIndex((mount) => !mount.weapon);
            const weapon = AP_WEAPONS[line.key];
            // An armored glove carries a weapon of its own without a mount (TM p.171); it is not part of the design's weight.
            const glove = !suit.isQuad() && (["la", "ra"] as BattleArmorArm[]).some((arm) => suit.getManipulator(arm).kind === "glove");
            if (index < 0 && glove) continue;
            if (index < 0) issues.push(`Anti-personnel weapon '${line.name.slice(0, 60)}' has no mount: left off.`);
            else if (!weapon) issues.push(`Anti-personnel weapon '${line.name.slice(0, 60)}' is not matched to an infantry weapon: its mount is left empty.`);
            else {
                suit.setAPMountWeapon(index, weapon);
                if (!suit.getAPMounts()[index].weapon) issues.push(`Anti-personnel weapon '${line.name.slice(0, 60)}' cannot be carried in a mount on this suit: its mount is left empty.`);
            }
            continue;
        }
        if (line.key === "baapmount") {
            if (!suit.addAPMount(suit.getLocations().includes(line.location) ? line.location : "body")) issues.push("An anti-personnel weapon mount could not be fitted: left off.");
            continue;
        }
        if (suit.isQuad() || (line.location !== "la" && line.location !== "ra")) {
            issues.push(`'${line.name.slice(0, 60)}' needs an arm: left off.`);
            continue;
        }
        if (line.key === "bamea") {
            suit.setAdaptor(line.location, true);
            continue;
        }
        const manipulator = battleArmorManipulators.find((entry) => entry.tag === MANIPULATORS[line.key]);
        if (!manipulator) continue;
        // A paired manipulator is listed for both arms; setting the second arm must not clear the first.
        if (!(manipulator.mustPair && arms.length > 0 && suit.getManipulator(line.location).tag === manipulator.tag)) suit.setManipulator(line.location, manipulator.tag);
        arms.push(line.location);
        if (manipulator.kind === "cargo" && line.size !== null && Number.isFinite(line.size)) {
            suit.setCargoHalfTons("la", Math.round(line.size * 2));
            suit.setCargoHalfTons("ra", Math.round(line.size * 2));
        }
    }

    if (armorTag && !suit.setArmor(armorTag, mixed ? armorBase : undefined) && !suit.setArmor(armorTag)) issues.push(`${battleArmorArmorTypes.find((entry) => entry.tag === armorTag)?.name ?? "The armor"} is not made for ${techBase === "clan" ? "Clan" : "Inner Sphere"} battle armor: using ${suit.getArmor().name}.`);
    const armorPoints = Number(blkValue(file, "armor"));
    if (Number.isFinite(armorPoints)) {
        suit.setArmorPoints(armorPoints);
        if (suit.getArmorPoints() !== armorPoints) issues.push(`${armorPoints} armor points are over the class maximum: set to ${suit.getArmorPoints()}.`);
    }

    // The era the design first appeared in, when this technology base can design there.
    const year = Number(blkValue(file, "year"));
    if (Number.isFinite(year) && year > 0) {
        const era = btEraOptions.find((option) => year >= option.yearStart && (option.yearEnd === null || year <= option.yearEnd));
        if (era) suit.setEra(era.tag);
    }

    return { suit, issues };
};
