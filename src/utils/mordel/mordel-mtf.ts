// A mordel.net 'Mech detail (BattleMech or IndustrialMech) written as a MegaMek ".mtf" file, so the MTF import builds
// it. mordel.net lists each item with its location and slots; the fixed parts (actuators, engine, gyro, cockpit) and
// the slots of armor and structure types are not listed, so they are laid out here the way MegaMek does.
import { BattleMech } from "../../classes/battlemech";
import { importBattleMechMtf } from "../../classes/battlemech-mtf";
import { IEquipmentItem } from "../../data/data-interfaces";
import { mechArmorTypes } from "../../data/mech-armor-types";
import { mechInternalStructureTypes } from "../../data/mech-internal-structure-types";
import { findImportedEquipment, ImportFaction } from "../importedEquipment";
import { IMordelDetail, IMordelEquipment } from "./mordel-types";

type Layout = "biped" | "quad" | "tripod";

const SECTIONS: Record<Layout, [code: string, section: string, armor: string][]> = {
    biped: [["LA", "Left Arm", "LA"], ["RA", "Right Arm", "RA"], ["LT", "Left Torso", "LT"], ["RT", "Right Torso", "RT"],
        ["CT", "Center Torso", "CT"], ["H", "Head", "HD"], ["LL", "Left Leg", "LL"], ["RL", "Right Leg", "RL"]],
    quad: [["LFL", "Front Left Leg", "FLL"], ["RFL", "Front Right Leg", "FRL"], ["LT", "Left Torso", "LT"], ["RT", "Right Torso", "RT"],
        ["CT", "Center Torso", "CT"], ["H", "Head", "HD"], ["LRL", "Rear Left Leg", "RLL"], ["RRL", "Rear Right Leg", "RRL"]],
    tripod: [["LA", "Left Arm", "LA"], ["RA", "Right Arm", "RA"], ["LT", "Left Torso", "LT"], ["RT", "Right Torso", "RT"],
        ["CT", "Center Torso", "CT"], ["H", "Head", "HD"], ["LL", "Left Leg", "LL"], ["RL", "Right Leg", "RL"], ["CL", "Center Leg", "CL"]],
};
const REAR: Record<string, string> = { CT: "RTC", LT: "RTL", RT: "RTR" };
const ARMS = new Set(["LA", "RA"]);
const LEGS = new Set(["LL", "RL", "CL", "LFL", "RFL", "LRL", "RRL"]);

const ENGINES: Record<string, string> = {
    "Fusion": "Fusion", "XL": "XL", "XXL": "XXL", "Light Fusion": "Light", "Compact": "Compact", "Internal Combustion": "ICE",
    "Fuel Cell": "Fuel Cell", "Fission": "Fission",
    // A primitive 'Mech's engine: the MTF import takes it as primitive from the primitive cockpit.
    "Primitive Fusion": "Fusion", "Primitive Internal Combustion": "ICE", "Primitive Fission": "Fission", "Primitive Fuel Cell": "Fuel Cell",
};
/** Engine slots in each side torso: Inner Sphere, Clan. */
const SIDE_ENGINE_SLOTS: Record<string, [number, number]> = { "XL": [3, 2], "XXL": [6, 4], "Light Fusion": [2, 2] };
const GYRO_SLOTS: Record<string, number> = { "Standard": 4, "XL": 6, "Compact": 2, "Heavy-Duty": 4, "None": 0, "Superheavy": 2, "Primitive": 4 };
const GYROS: Record<string, string> = {
    "Standard": "Standard Gyro", "XL": "XL Gyro", "Compact": "Compact Gyro", "Heavy-Duty": "Heavy Duty Gyro", "None": "None",
    "Superheavy": "Superheavy Gyro", "Primitive": "Standard Gyro",
};
const COCKPITS: Record<string, string> = {
    "Standard": "Standard Cockpit", "Small": "Small Cockpit", "Interface": "Interface Cockpit", "Torso-Mounted": "Torso-Mounted Cockpit",
    "Superheavy": "Superheavy Cockpit", "Primitive": "Primitive Cockpit", "Tripod": "Tripod Cockpit", "Superheavy Tripod": "Superheavy Tripod Cockpit",
    "QuadVee": "QuadVee Cockpit", "Industrial": "Industrial",
};
const ARMORS: Record<string, string> = { "Laser Reflective": "Reflective", "Ferro-Fibrous (Prototype)": "Ferro-Fibrous Prototype" };
const STRUCTURES: Record<string, string> = { "Endo Steel (Prototype)": "Endo Steel Prototype" };
export const RULES: Record<string, number> = { Introductory: 1, Standard: 2, Advanced: 3, Experimental: 4, Unofficial: 4, Unavailable: 4 };

/** "Ferro-Fibrous (Prototype)" and "Ferro-Fibrous Prototype" alike. */
const typeKey = (name: string): string => name.toLowerCase().replace(/\barmor\b/g, "").replace(/[^a-z]+/g, " ").trim();
/** Slots an armor or structure type takes, from our own construction data. Stealth's are placed apart. */
function typeSlots(types: { name: string; crits?: Record<string, number> }[], name: string, clan: boolean): number {
    if (/^stealth$/i.test(name)) return 0;
    const crits = types.find((t) => typeKey(t.name) === typeKey(name))?.crits ?? {};
    // A type only one side builds keeps that side's slots.
    return (clan ? crits.clan || crits.is : crits.is || crits.clan) ?? 0;
}

/** Ammunition kinds the MTF import reads, as MegaMek words them. */
export const AMMO_KINDS: Record<string, string> = {
    "Artemis IV": "Artemis-capable", "Artemis V": "Artemis V-capable", "Narc": "Narc-capable", "LRM": "LRM", "SRM": "SRM",
    "ER": "ER", "HE": "HE", "Cluster": "Cluster", "Homing": "Homing", "Arrow IV Homing": "Homing",
};

const FIRE_CONTROL: Record<string, string> = { "Artemis IV FCS": "ArtemisIV", "Artemis V FCS": "ArtemisV", "MRM Apollo FCS": "Apollo" };
const MULTISLOT_NAMES: Record<string, string> = {
    "Environmental Sealing": "Environmental Sealing", "Tracks": "Tracks", "Blue Shield PFD": "Blue Shield PFD",
    "Chameleon LPS": "Chameleon LPS", "Null-Signature System": "Null Signature System", "Void-Signature System": "Void Signature System",
};
const JUMP_JETS: Record<string, string> = {
    "Jump Jet": "Jump Jet", "Improved Jump Jet": "Improved Jump Jet", "Improved (Prototype) Jump Jet": "ISPrototypeImprovedJumpJet",
    "Jump Jet (Prototype)": "ISPrototypeJumpJet", "UMU": "UMU",
};

/** mordel.net names our catalog does not know, as the catalog names them. */
const NAME_ALIASES: Record<string, string> = {
    "MASH Equipment (Core)": "MASH (Core Unit)", "MASH Equipment (Theater)": "MASH (Added Theater)",
    "C3 Slave": "C3 Computer (Slave)", "Machine Gun Array Module": "Machine Gun Array", "Ejection Seat": "Ejection Seat (IndustrialMech)",
    "Light Machine Gun Array Module": "Light Machine Gun Array", "Heavy Machine Gun Array Module": "Heavy Machine Gun Array",
};
/** Items with no slots, written in the header instead. */
const HEADER_ITEMS: Record<string, string> = { "Full-Head Ejection System": "ejection:Full Head Ejection System" };

export const clanTech = (technology: string | null | undefined): boolean => /^clan/i.test(technology ?? "");
const prefix = (technology: string | null | undefined): string => (clanTech(technology) ? "CL" : "IS");

export const oneLine =(text: string | null | undefined): string => String(text ?? "").replace(/\s+/g, " ").trim();

const layoutOf = (detail: IMordelDetail): Layout => {
    const codes = new Set((detail.locations ?? []).map((l) => l.code));
    if (codes.has("LFL") || /^quad/i.test(detail.configuration ?? "")) return "quad";
    return codes.has("CL") || /^tripod/i.test(detail.configuration ?? "") ? "tripod" : "biped";
};

/** The fixed parts of each location, before any equipment. */
function fixedSlots(detail: IMordelDetail, layout: Layout, clan: boolean, notes: string[]): Record<string, string[]> {
    const engineType = detail.engine?.type ?? "Fusion";
    const engineClan = clanTech(detail.engine?.technology) || (!detail.engine?.technology && clan);
    // A superheavy's engine takes half its slots in each location, rounded up (IO:AE pp.156-157).
    const half = (n: number) => (detail.tons > 100 ? Math.ceil(n / 2) : n);
    const side = half(SIDE_ENGINE_SLOTS[engineType.replace(/ \(Prototype\)$/, "")]?.[engineClan ? 1 : 0] ?? 0);
    const gyroType = detail.gyro?.type ?? "Standard";
    const gyro = GYRO_SLOTS[gyroType] ?? 4;
    if (GYRO_SLOTS[gyroType] === undefined) notes.push(`Gyro '${gyroType}' is laid out as a standard one`);
    const centerEngine = half(/^compact$/i.test(engineType) ? 3 : 6);
    const engine = (n: number) => Array<string>(n).fill("Fusion Engine");
    const cockpit = detail.cockpit?.type ?? (detail.unit_type_short === "im" ? "Industrial" : "Standard");
    const slots: Record<string, string[]> = {
        CT: [...engine(Math.min(3, centerEngine)), ...Array<string>(gyro).fill("Gyro"), ...engine(Math.max(0, centerEngine - 3))],
        LT: engine(side),
        RT: engine(side),
        H: ["Life Support", "Sensors", "Cockpit", "-Empty-", "Sensors", "Life Support"],
    };
    if (cockpit === "Small") slots.H = ["Life Support", "Sensors", "Cockpit", "Sensors"];
    if (cockpit === "Interface") slots.H = ["Life Support", "Sensors", "Cockpit", "Cockpit", "Sensors", "Life Support"];
    if (cockpit === "Torso-Mounted") {
        slots.H = ["Sensors", "Sensors"];
        slots.CT.push("Cockpit", "Sensors");
        slots.LT.push("Life Support");
        slots.RT.push("Life Support");
    }
    if (!COCKPITS[cockpit]) notes.push(`Cockpit '${cockpit}' is laid out as a standard one`);
    for (const [code] of SECTIONS[layout]) {
        if (ARMS.has(code)) slots[code] = ["Shoulder", "Upper Arm Actuator", "Lower Arm Actuator", "Hand Actuator"];
        if (LEGS.has(code)) slots[code] = ["Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator"];
    }
    // A standard head's "-Empty-" is its one free slot, between the cockpit and the second sensors: see place().
    return slots;
}

/**
 * An ammunition entry ("LRM 15 (Ammo 8) [Artemis IV]") as a MegaMek ammunition line. A bin of half a ton's shots
 * ("Machine Gun (Ammo 100)") is a half-ton one.
 */
export function ammoLine(item: IMordelEquipment, notes: string[], faction: ImportFaction = "is"): string | null {
    const match = /^(.+?)\s*\(Ammo (\d+)\)\s*(?:\[(.+)\])?$/.exec(item.name);
    if (!match) return null;
    const { record } = findMordelRecord({ ...item, name: match[1] }, faction);
    const half = !!record?.shotsPerTon && Number(match[2]) * 2 === record.shotsPerTon;
    const kinds = (match[3] ?? "").split("/").map((part) => part.trim()).filter(Boolean);
    const words: string[] = [];
    for (const kind of kinds) {
        if (AMMO_KINDS[kind]) words.push(AMMO_KINDS[kind]);
        else notes.push(`'${item.name}': ${kind} rounds are read as standard ones`);
    }
    return `${clanTech(item.technology) ? "Clan" : "IS"} ${match[1]}${words.length ? " " + words.join(" ") : ""} Ammo${half ? " - Half" : ""}`;
}

/** The MTF slot name for an item, or null when it has no slot of its own. */
function slotName(item: IMordelEquipment, faction: ImportFaction, notes: string[]): string | null {
    const name = item.name.trim();
    const p = prefix(item.technology);
    if (name === "Double Heat Sink") return `${p}DoubleHeatSink`;
    if (name === "Heat Sink") return "Heat Sink";
    if (name === "Laser Heat Sink") return "CLLaser Heat Sink";
    if (name === "Compact Heat Sink") return "IS1 Compact Heat Sink";
    if (JUMP_JETS[name]) return JUMP_JETS[name];
    if (/^(Industrial )?Triple-Strength Myomer$/i.test(name)) return "Triple Strength Myomer";
    if (name === "RISC Super-Cooled Myomer") return "ISSuperCooledMyomer";
    if (FIRE_CONTROL[name]) return `${p}${FIRE_CONTROL[name]}`;
    if (MULTISLOT_NAMES[name]) return MULTISLOT_NAMES[name];
    if (name === "Actuator Enhancement System") return `${p}AES`;
    if (name === "PPC Capacitor") return `${p}PPC Capacitor`;
    if (name === "RISC Laser Pulse Module") return "ISRISCLaserPulseModule";
    if (name === "Partial Wing") return `${p}PartialWing`;
    if (/^(Narc Missile Beacon|Improved Narc Launcher) \(Ammo \d+\)/.test(name)) {
        if (!/\[Homing\]$/.test(name)) notes.push(`'${name}': only homing pods are read; these are read as homing ones`);
        return `${p}${name.startsWith("Improved") ? "iNarc" : "Narc"} Pods`;
    }
    if (/\(Ammo \d+\)/.test(name)) return ammoLine(item, notes, faction);
    const { record, base, oneShot, itemFaction } = findMordelRecord(item, faction);
    const os = oneShot ? ` (${oneShot})` : "";
    // Unknown here: the MTF import names it in its issues.
    if (!record) return base + os;
    // The MTF import reads an item of the other faction (on a mixed-tech design) by its "IS " or "Clan " prefix.
    const tag = itemFaction === faction ? record.tag : `${itemFaction === "clan" ? "Clan" : "IS"} ${record.tag.replace(/^(is|clan)[-_]/, "")}`;
    return tag + os;
}

/**
 * The catalog record for a mordel.net item, looked up in the item's own faction first: a Clan "Streak SRM 4" is the
 * Clan launcher, not the Inner Sphere one of the same name. A one-shot mark ("(OS)", "(I-OS)") is taken off the name
 * and returned apart.
 */
export function findMordelRecord(item: IMordelEquipment, faction: ImportFaction, vehicle = false): { record: IEquipmentItem | null; base: string; oneShot: string | null; itemFaction: ImportFaction } {
    const trimmed = item.name.trim();
    // A ladder is one record per length; the light fluid suction system one per unit kind.
    const name = trimmed === "Ladder" && item.stacks?.unit === "meters" ? `Ladder (${item.stacks.count}m)`
        : trimmed === "Light Fluid Suction System" ? `Fluid Suction System (Light, ${vehicle ? "Vehicular" : "'Mech"})`
        : NAME_ALIASES[trimmed] ?? trimmed;
    const oneShot = /\s*\((OS|I-OS|IOS)\)$/i.exec(name);
    const base = oneShot ? name.slice(0, oneShot.index) : name;
    const itemFaction: ImportFaction = clanTech(item.technology) ? "clan" : /inner sphere|primitive/i.test(item.technology ?? "") ? "is" : faction;
    const record = (findImportedEquipment(base, itemFaction, false) ?? findImportedEquipment(base, itemFaction, true))?.item ?? null;
    return { record, base, oneShot: oneShot?.[1] ?? null, itemFaction };
}

const marks = (item: IMordelEquipment, omni: boolean): string =>
    (/rear/i.test(item.facing ?? "") ? " (R)" : "") + (item.armored ? " (ARMORED)" : "") + (omni && !item.fixed ? " (OMNIPOD)" : "");

/** mordel.net does not list arm actuators: shown with every 'Mech that keeps a guessed one. */
export const ACTUATOR_CAUTION = "mordel.net does not list arm actuators, so hand and lower arm actuators are fitted wherever they fit. Check the arms against the record sheet.";

/**
 * The detail as an MTF file. Notes name what was read approximately or left out; cautions name what was guessed
 * without changing the Battle Value (arm actuators).
 */
export function mordelToMtf(detail: IMordelDetail): { text: string; notes: string[]; cautions: string[] } {
    const notes: string[] = [];
    const layout = layoutOf(detail);
    const clan = /^clan/i.test(detail.tech_base);
    const faction: ImportFaction = clan ? "clan" : "is";
    const omni = !!detail.omni;
    const config = detail.configuration ?? "Biped";
    if (/^(QuadVee|Land-Air)/i.test(config)) notes.push(`'Mech configuration '${config}' is not converted yet`);
    if (detail.turret_config) notes.push("Turrets are not converted yet");

    const slots = fixedSlots(detail, layout, clan, notes);
    // Heads and legs have 6 slots, the rest 12; the file lists 12 lines for every location.
    const sizeOf = (code: string) => (code === "H" || LEGS.has(code) ? 6 : 12);
    const codes = SECTIONS[layout].map(([code]) => code);
    /** Fills a location's "-Empty-" placeholder first (a standard head's fourth slot), then its end. */
    const place = (code: string, name: string, count = 1) => {
        for (let i = 0; i < count; i++) {
            const free = slots[code].indexOf("-Empty-");
            if (free >= 0) slots[code][free] = name;
            else slots[code].push(name);
        }
    };
    // Some designs list a pulse module with no associated_id, the laser marked instead: it goes to a marked laser in its
    // location that has no module of its own.
    const equipment = [...(detail.equipment ?? [])];
    const isModule = (item: IMordelEquipment) => item.name === "RISC Laser Pulse Module";
    for (const [index, module] of equipment.entries()) {
        if (!isModule(module) || module.associated_id != null) continue;
        const laser = equipment.find((item) => item.pulse_module && item.location === module.location
            && !equipment.some((other) => isModule(other) && other.associated_id === item.id));
        if (laser) equipment[index] = { ...module, associated_id: laser.id };
    }
    // A PPC Capacitor follows its PPC, and a RISC Laser Pulse Module its laser (IO:AE p.87): the MTF import pairs each
    // with the item listed before it. A marked weapon with no add-on listed gets one.
    const capacitors = equipment.filter((item) => (item.name === "PPC Capacitor" || isModule(item)) && item.associated_id != null);
    const ordered = equipment.filter((item) => !capacitors.includes(item)).flatMap((item) => {
        const own = capacitors.filter((c) => c.associated_id === item.id);
        const missing = [
            ...(item.capacitor && !own.some((c) => c.name === "PPC Capacitor") ? [{ ...item, name: "PPC Capacitor", slots: 1, capacitor: false }] : []),
            ...(item.pulse_module && !own.some(isModule) ? [{ ...item, name: "RISC Laser Pulse Module", slots: 1, pulse_module: false }] : []),
        ];
        return [item, ...own, ...missing];
    });
    const booster = detail.movement?.mechanical_jump_booster ?? 0;
    const headerItems: string[] = [];
    let commandConsole = false;
    let advancedFireControl = false;
    for (const item of ordered) {
        if (item.name === "Mechanical Jump Booster") {
            if (item.location && codes.includes(item.location)) place(item.location, `MechanicalJumpBooster:SIZE:${booster}`, Math.max(1, item.slots));
            continue;
        }
        if (HEADER_ITEMS[item.name]) { headerItems.push(HEADER_ITEMS[item.name]); continue; }
        // The MTF import reads a Command Console from the cockpit line, and its head slot as free.
        if (item.name === "Command Console") { commandConsole = true; continue; }
        if (item.name === "Advanced Fire Control System") { advancedFireControl = true; continue; }
        // Heat sinks with no location are in the engine.
        if (!item.location) {
            if (!/Heat Sink$/i.test(item.name)) notes.push(`'${item.name}' has no location and is left out`);
            continue;
        }
        if (!codes.includes(item.location)) { notes.push(`'${item.name}' is in location '${item.location}', which is not converted yet`); continue; }
        if (item.sponson_turret) notes.push(`Turret-mounted '${item.name}' is not converted yet`);
        if (item.insulator || item.pulse_module || item.dumper) notes.push(`'${item.name}': its add-on is left out`);
        const name = slotName(item, faction, notes);
        if (!name) continue;
        place(item.location, name + marks(item, omni), Math.max(1, item.slots));
    }

    // The armor and structure types' own slots, in arms and legs first (stealth: two in each arm, leg and side torso).
    const armorType = detail.armor?.type ?? "Standard";
    const structureType = detail.structure?.type ?? "Standard";
    const dynamic: { name: string; count: number }[] = [];
    const armorTech = clanTech(detail.armor?.technology) || (!detail.armor?.technology && clan);
    const structureTech = clanTech(detail.structure?.technology) || (!detail.structure?.technology && clan);
    const armorSlots = armorType === "Patchwork" ? 0 : typeSlots(mechArmorTypes, armorType, armorTech);
    const structureSlots = typeSlots(mechInternalStructureTypes, structureType.replace(/^Endo Steel/, "Endo-Steel"), structureTech);
    if (armorSlots) dynamic.push({ name: `${armorTech ? "Clan" : "IS"} ${armorType.replace(/ \(Prototype\)$/, " Prototype")}`, count: armorSlots });
    if (structureSlots) dynamic.push({ name: `${structureTech ? "Clan" : "IS"} ${structureType.replace(/ \(Prototype\)$/, " Prototype")}`, count: structureSlots });
    if (armorType === "Stealth") {
        for (const code of codes.filter((c) => ARMS.has(c) || LEGS.has(c) || c === "LT" || c === "RT").filter((c) => c !== "CL")) {
            place(code, "IS Stealth", 2);
        }
    }
    const fillOrder = [...codes.filter((c) => ARMS.has(c) || LEGS.has(c)), ...codes.filter((c) => !ARMS.has(c) && !LEGS.has(c))];
    const freeIn = (code: string) => sizeOf(code) - slots[code].filter((slot) => slot !== "-Empty-").length;
    // mordel.net does not say which arms lack hand or lower arm actuators. An arm gives them up (hand first) only when
    // its slots, or the armor and structure slots, would not fit otherwise: then the canon unit cannot have them.
    const makeRoom = (code: string) => {
        if (!ARMS.has(code)) return false;
        for (const actuator of ["Hand Actuator", "Lower Arm Actuator"]) {
            const at = slots[code].indexOf(actuator);
            if (at >= 0) { slots[code].splice(at, 1); return true; }
        }
        return false;
    };
    for (const code of codes) while (freeIn(code) < 0 && makeRoom(code));
    const totalFree = () => fillOrder.reduce((sum, code) => sum + Math.max(0, freeIn(code)), 0);
    const needed = dynamic.reduce((sum, d) => sum + d.count, 0);
    const arms = codes.filter((c) => ARMS.has(c));
    let freed = true;
    while (totalFree() < needed && freed) {
        freed = false;
        // Hands in both arms before either lower arm.
        for (const actuator of ["Hand Actuator", "Lower Arm Actuator"]) {
            const arm = arms.find((c) => slots[c].includes(actuator) && (actuator === "Hand Actuator" || !slots[c].includes("Hand Actuator")));
            if (arm && totalFree() < needed) { slots[arm].splice(slots[arm].indexOf(actuator), 1); freed = true; break; }
        }
    }
    for (const { name, count } of dynamic) {
        let left = count;
        for (const code of fillOrder) {
            while (left > 0 && freeIn(code) > 0) { place(code, name); left--; }
        }
        if (left > 0) notes.push(`${left} slots of ${name} do not fit`);
    }
    for (const code of codes) if (freeIn(code) < 0) notes.push(`${code} has more than ${sizeOf(code)} slots`);
    const cautions = arms.some((code) => slots[code].includes("Hand Actuator") || slots[code].includes("Lower Arm Actuator")) ? [ACTUATOR_CAUTION] : [];

    // The header.
    const engineType = detail.engine?.type ?? "Fusion";
    const engineName = ENGINES[engineType];
    if (!engineName) notes.push(`Engine '${engineType}' is not converted yet`);
    const engineClan = clanTech(detail.engine?.technology) || (!detail.engine?.technology && clan);
    const myomer = detail.myomer?.type ?? "Standard";
    const sinkTech = /^(Double|Laser)$/i.test(detail.heat_sinks?.type ?? "") && detail.heat_sinks?.technology
        ? (clanTech(detail.heat_sinks.technology) ? "Clan " : "IS ") : "";
    const lines: string[] = [
        "generator:battletech-tools from mordel.net",
        `chassis:${oneLine(detail.name_parts?.name || detail.name)}`,
        `model:${oneLine(detail.name_parts?.model)}`,
        ...(detail.sources?.[0]?.title ? [`source:${oneLine(detail.sources[0].title)}`] : []),
        "",
        `Config:${layout === "quad" ? "Quad" : layout === "tripod" ? "Tripod" : "Biped"}${omni ? " Omnimech" : ""}`,
        `TechBase:${detail.mixed_tech ? (clan ? "Mixed (Clan Chassis)" : "Mixed (IS Chassis)") : clan ? "Clan" : "Inner Sphere"}`,
        `Era:${detail.year ?? ""}`,
        `Rules Level:${RULES[detail.rules_level ?? ""] ?? 2}`,
        ...(detail.role ? [`role:${detail.role}`] : []),
        "",
        `Mass:${detail.tons}`,
        `Engine:${detail.engine?.rating ?? 0} ${engineName ?? engineType} Engine(${engineClan ? "Clan" : "IS"})`,
        `Structure:${structureTech ? "Clan" : "IS"} ${STRUCTURES[structureType] ?? structureType}`,
        `Myomer:${/Triple-Strength/i.test(myomer) ? (/industrial/i.test(myomer) ? "Industrial Triple-Strength" : "Triple-Strength")
            : /Super-Cooled/i.test(myomer) ? "Super-Cooled" : "Standard"}`,
        ...(GYROS[detail.gyro?.type ?? "Standard"] && detail.gyro?.type !== "Standard" ? [`Gyro:${GYROS[detail.gyro!.type!]}`] : []),
        // MegaMek writes an IndustrialMech's Advanced Fire Control as a BattleMech cockpit; the MTF import reads it so.
        `Cockpit:${commandConsole ? "Command Console" : advancedFireControl && /^industrial$/i.test(detail.cockpit?.type ?? "Industrial") ? "Standard Cockpit"
            : COCKPITS[detail.cockpit?.type ?? ""] ?? (detail.unit_type_short === "im" ? "Industrial" : "Standard Cockpit")}`,
        ...headerItems,
        "",
        // The sinks' own tech base: Clan doubles on an Inner Sphere chassis take 2 slots, not 3.
        `Heat Sinks:${detail.heat_sinks?.count ?? 0} ${sinkTech}${detail.heat_sinks?.type ?? "Single"}`,
        `Walk MP:${detail.movement?.walk ?? 0}`,
        `Jump MP:${detail.movement?.jump ?? 0}`,
        "",
        `Armor:${armorType === "Patchwork" ? "Patchwork" : `${ARMORS[armorType] ?? armorType} (${armorTech ? "Clan" : "IS"})`}`,
    ];
    // A primitive 'Mech's myomer is standard myomer, and so is a superheavy's musculature (IO:AE p.156).
    if (/^Superheavy/i.test(myomer) && detail.tons <= 100) notes.push(`Myomer '${myomer}' is read as standard`);
    for (const location of detail.locations ?? []) {
        const armorKey = SECTIONS[layout].find(([code]) => code === location.code)?.[2];
        if (!armorKey) continue;
        const patchType = location.armor_type?.type;
        const patch = armorType === "Patchwork" && patchType
            ? `${ARMORS[patchType] ?? patchType}(${clanTech(location.armor_type?.technology) ? "Clan" : "Inner Sphere"}):` : "";
        lines.push(`${armorKey} Armor:${patch}${location.armor}`);
        if (REAR[location.code] && location.rear_armor != null) lines.push(`${REAR[location.code]} Armor:${location.rear_armor}`);
    }
    for (const [code, section] of SECTIONS[layout]) {
        lines.push("", `${section}:`, ...slots[code], ...Array<string>(Math.max(0, 12 - slots[code].length)).fill("-Empty-"));
    }
    for (const [key, text] of Object.entries(detail.fluff ?? {})) {
        if (["overview", "capabilities", "deployment", "history", "notes"].includes(key) && oneLine(text)) lines.push("", `${key}:${oneLine(text)}`);
    }
    return { text: lines.join("\n") + "\n", notes, cautions };
}

/**
 * Builds the 'Mech, and checks it against mordel.net: bvOk is true only when nothing was left out or read
 * approximately and our Battle Value is mordel.net's.
 */
export function importMordelMech(detail: IMordelDetail): { mech: BattleMech | null; issues: string[]; cautions: string[]; bvOk: boolean; ourBV: number } {
    const { text, notes, cautions } = mordelToMtf(detail);
    const { mech, issues: importIssues } = importBattleMechMtf(text);
    const issues = [...notes, ...importIssues];
    const ourBV = mech ? mech.getBattleValue() : 0;
    return { mech, issues, cautions, bvOk: !!mech && issues.length === 0 && detail.battle_value != null && ourBV === detail.battle_value, ourBV };
}
