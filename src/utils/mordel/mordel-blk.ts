// A mordel.net Combat Vehicle or ProtoMech detail written as a MegaMek ".blk" file, so the BLK import builds it.
// Vehicle items are written as our catalog tags, which the BLK import reads first; ProtoMech items as the MegaMek
// names its ProtoMech import pairs with the catalog. What has no counterpart is named in the issues.
import { importBlkUnit } from "../../classes/blk-unit-import";
import type ProtoMech from "../../classes/protomech";
import type Vehicle from "../../classes/vehicle";
import { findBlkAmmo, findBlkAmmoWeapon, parseBlkAmmoLine } from "../blk-ammo";
import { getBlkFittedTag } from "../blk-fire-control";
import { findImportedEquipment, ImportFaction } from "../importedEquipment";
import { AMMO_KINDS, clanTech, findMordelRecord, oneLine, RULES } from "./mordel-mtf";
import { IMordelDetail, IMordelEquipment } from "./mordel-types";

const block = (tag: string, ...lines: (string | number)[]): string[] => [`<${tag}>`, ...lines.map(String), `</${tag}>`];
const squash = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const AMMO = /^(.+?)\s*\(Ammo (\d+)\)\s*(?:\[(.+)\])?$/;

/** The rules level and tech base, as a BLK "type" line: "IS Level 2", "Mixed (Clan Chassis) Level 3". */
function typeLine(detail: IMordelDetail): string {
    const clan = clanTech(detail.tech_base);
    const base = detail.mixed_tech ? `Mixed (${clan ? "Clan" : "IS"} Chassis)` : clan ? "Clan" : "IS";
    return `${base} Level ${RULES[detail.rules_level ?? ""] ?? 2}`;
}

const header = (detail: IMordelDetail, unitType: string): string[] => [
    ...block("BlockVersion", 1), ...block("Version", "MAM0"), ...block("UnitType", unitType),
    ...block("Name", oneLine(detail.name_parts?.name || detail.name)), ...block("Model", oneLine(detail.name_parts?.model)),
    ...(detail.year ? block("year", detail.year) : []), ...block("type", typeLine(detail)), ...block("tonnage", detail.tons),
];

// ---- Combat Vehicles ----

const MOTION: Record<string, string> = {
    "Tracked": "Tracked", "Wheeled": "Wheeled", "Hover": "Hover", "VTOL": "VTOL", "WiGE": "WiGE",
    "Naval (Hydrofoil)": "Hydrofoil", "Naval Hydrofoil": "Hydrofoil", "Naval (Displacement Hull)": "Naval", "Naval Displacement": "Naval",
    "Naval (Submarine)": "Submarine", "Submarine": "Submarine",
};
/** MegaMek's engine codes (Engine.java). */
const ENGINE_CODES: Record<string, number> = {
    "Internal Combustion": 0, "Fusion": 1, "XL": 2, "XXL": 3, "Fuel Cell": 4, "Light Fusion": 5, "Compact": 6, "Fission": 7,
};
/** MegaMek's armor codes (EquipmentType.T_ARMOR_*), by mordel.net's armor names with spaces and punctuation removed. */
const ARMOR_CODES: Record<string, number> = {
    standard: 0, ferrofibrous: 1, reactive: 2, laserreflective: 3, reflective: 3, hardened: 4, lightferrofibrous: 5,
    heavyferrofibrous: 6, ferrofibrousprototype: 9, commercial: 10, industrial: 14, ferrolamellor: 16, primitive: 17,
    vehicularstealth: 22, antipenetrativeablation: 23, heatdissipating: 24, impactresistant: 25, ballisticreinforced: 26, ferroaluminum: 27,
};
/** Location codes as BLK equipment blocks. */
const BLOCKS: Record<string, string> = {
    FR: "Front", RS: "Right", LS: "Left", RR: "Rear", TU: "Turret", RT: "Rear Turret", FT: "Front Turret", RO: "Rotor", BD: "Body",
};
/** Chassis modifications, as the BLK import's body lines. */
const CHASSIS_MODS: Record<string, string> = {
    "Chassis Modification, Environmental (Vacuum) Sealing": "EnvironmentalSealedChassis", "Chassis Modification, Fully Amphibious": "FullyAmphibiousChassis",
    "Chassis Modification, Limited Amphibious": "LimitedAmphibiousChassis", "Chassis Modification, Flotation Hull": "FlotationHull",
    "Chassis Modification, Dune Buggy": "DuneBuggyChassis", "Armored Motive System": "ArmoredMotiveSystem",
};
/** Bays, by tons: mordel.net counts them in half-ton increments. */
const BAYS: Record<string, string> = {
    "Compartment, Infantry": "troopspace", "Cargo, Standard": "cargobay", "Cargo, Insulated": "insulatedcargobay",
    "Cargo, Refrigerated": "refrigeratedcargobay", "Cargo, Liquid": "liquidcargobay", "Cargo, Livestock": "livestockcargobay",
};

/** A vehicle ammunition entry: one per ton (or half ton), "(Ammo N)" its shots. Written by the weapon's catalog tag. */
function vehicleAmmoLine(item: IMordelEquipment, faction: ImportFaction, issues: string[]): string | null {
    const match = AMMO.exec(item.name);
    if (!match) return null;
    const { record } = findMordelRecord({ ...item, name: match[1] }, faction);
    if (!record) {
        issues.push(`'${item.name}' feeds a weapon this catalog does not know and is left out`);
        return null;
    }
    // The BLK reader drops words such as "standard" from an ammunition line, so the weapon is written by whichever of
    // its spellings reads back as that weapon ("autocannon-standard-d" does not; its "ac/20" does).
    const spelling = [record.tag, record.alternateName, record.name, ...(record.altNames ?? [])]
        .find((name) => { const line = name && parseBlkAmmoLine(`${name} Ammo`); return !!line && findBlkAmmoWeapon(line, [record]) === record; });
    if (!spelling) {
        issues.push(`'${item.name}' cannot be written as a BLK ammunition line and is left out`);
        return null;
    }
    const words: string[] = [];
    for (const kind of (match[3] ?? "").split("/").map((part) => part.trim()).filter(Boolean)) {
        // A Narc's pods are homing ones; that is its standard round.
        if (kind === "Homing" && /narc/i.test(record.tag)) continue;
        if (AMMO_KINDS[kind]) words.push(AMMO_KINDS[kind]);
        else issues.push(`'${item.name}': ${kind} rounds are read as standard ones`);
    }
    const half = !!record.shotsPerTon && Number(match[2]) * 2 === record.shotsPerTon;
    const line = `${clanTech(item.technology) ? "Clan" : "IS"} ${spelling}${words.length ? " " + words.join(" ") : ""} Ammo${half ? " - Half" : ""}`;
    const parsed = parseBlkAmmoLine(line);
    if (words.length && parsed && !findBlkAmmo(parsed, record)) {
        issues.push(`'${item.name}': ${match[3]} rounds are read as standard ones`);
        return line.replace(` ${words.join(" ")} Ammo`, " Ammo");
    }
    return line;
}

/** The detail as a Combat Vehicle BLK file. Issues name what was read approximately or left out. */
export function mordelVehicleToBlk(detail: IMordelDetail): { text: string; issues: string[] } {
    const issues: string[] = [];
    const clan = clanTech(detail.tech_base);
    const faction: ImportFaction = clan ? "clan" : "is";
    const config = detail.configuration ?? "Tracked";
    const vtol = /^VTOL/i.test(config);
    const motion = MOTION[config];
    if (!motion) issues.push(`Vehicle configuration '${config}' is not converted yet`);
    if (detail.tons > 100) issues.push("Superheavy vehicles are not converted yet");

    const engineType = detail.engine?.type ?? "Fusion";
    const engineCode = ENGINE_CODES[engineType];
    if (engineCode === undefined) issues.push(`Engine '${engineType}' is not converted yet`);
    const armorType = detail.armor?.type ?? "Standard";
    const armorCode = ARMOR_CODES[squash(armorType)];
    if (armorCode === undefined) issues.push(`Armor '${armorType}' is not converted yet`);
    const armorClan = detail.armor?.technology ? clanTech(detail.armor.technology) : clan;

    // Armor: front, right, left, rear, the rotor, then the turret (a dual turret: rear, then front).
    const armorOf = (code: string) => detail.locations?.find((location) => location.code === code)?.armor;
    const codes = ["FR", "RS", "LS", "RR", ...(vtol ? ["RO"] : []), ...(detail.turret_config === "Dual" ? ["RT", "FT"] : armorOf("TU") != null ? ["TU"] : [])];
    const armor = codes.map((code) => armorOf(code) ?? 0);

    const blocks: Record<string, string[]> = {};
    const add = (code: string | null, line: string) => (blocks[BLOCKS[code ?? "BD"] ?? "Body"] ??= []).push(line);
    const transporters: string[] = [];
    const fitted = detail.fire_control?.artemis === "V" ? "-artemis-v" : detail.fire_control?.artemis ? "-artemis-iv" : detail.fire_control?.apollo ? "-apollo" : "";
    const omni = !!detail.omni;
    // mordel.net gives Artemis for the whole design, and marks the ammunition that uses it. Where any ammunition is
    // marked, only the launchers it feeds are fitted; otherwise (and for Apollo) every launcher that takes it is.
    const artemisFed = new Set<string>();
    if (/artemis/.test(fitted)) {
        for (const item of detail.equipment ?? []) {
            const match = AMMO.exec(item.name.trim());
            const record = match && /Artemis/.test(match[3] ?? "") ? findMordelRecord({ ...item, name: match[1] }, faction).record : null;
            if (record) artemisFed.add(record.tag);
        }
    }
    const fits = (launcherTag: string) => !!fitted && (artemisFed.size === 0 || artemisFed.has(launcherTag));
    for (const item of detail.equipment ?? []) {
        const name = item.name.trim();
        // The fire control is fitted to its launchers below, not mounted apart.
        if (/^(Artemis IV|Artemis V|MRM Apollo) FCS$/.test(name)) continue;
        if (name === "Sponson Turret") { add("BD", "SponsonTurret"); continue; }
        if (name === "Vehicular Jump Jet") continue;
        if (CHASSIS_MODS[name]) { add("BD", CHASSIS_MODS[name]); continue; }
        if (BAYS[name]) { transporters.push(`${BAYS[name]}:${(item.stacks?.count ?? 1) * 0.5}`); continue; }
        const code = item.location && BLOCKS[item.location] ? item.location : null;
        if (item.location && !code) issues.push(`'${name}' is in location '${item.location}', which is not converted yet`);
        if (AMMO.test(name)) {
            const line = vehicleAmmoLine(item, faction, issues);
            if (line) add("BD", line);
            continue;
        }
        const { record: base, oneShot, itemFaction } = findMordelRecord(item, faction, true);
        if (!base) { issues.push(`'${name}' has no match in this catalog and is left out`); continue; }
        // One-shot launchers are their own records: the launcher's tag plus "-os" or "-ios".
        const oneShotRecord = oneShot ? findImportedEquipment(base.tag + (/^OS$/i.test(oneShot) ? "-os" : "-ios"), itemFaction, true)?.item : undefined;
        if (oneShot && !oneShotRecord) issues.push(`'${name}' is read as a standard launcher, not a one-shot one`);
        const record = oneShotRecord ?? base;
        // Communications equipment is mounted a ton to a record; mordel.net counts it in increments, read as tons.
        // A drone carrier's drones are set once the unit is built.
        const copies = record.tag === "communications-equipment" ? Math.max(1, item.stacks?.count ?? 1) : 1;
        // A ladder's length is its record.
        if (item.stacks && item.stacks.count > 1 && copies === 1 && item.stacks.unit !== "drones" && !/^ladder-/.test(record.tag)) {
            issues.push(`'${name}' (${item.stacks.count} ${item.stacks.unit}) is read as one`);
        }
        if (item.insulator || item.pulse_module || item.dumper) issues.push(`'${name}': its add-on is left out`);
        const tag = (fits(base.tag) && getBlkFittedTag(record.tag, fitted)) || record.tag;
        const rear = /rear/i.test(item.facing ?? "") ? " (R)" : "";
        for (let copy = 0; copy < copies; copy++) add(code, `${tag}${item.sponson_turret ? " (ST)" : ""}${rear}${omni && !item.fixed ? ":OMNI" : ""}`);
    }
    for (let jet = 0; jet < (detail.movement?.jump ?? 0); jet++) add("BD", "VehicleJumpJet");

    const lines = [
        ...header(detail, vtol ? "VTOL" : "Tank"),
        ...block("motion_type", motion ?? "Tracked"),
        ...block("cruiseMP", detail.movement?.cruise ?? 0),
        ...block("engine_type", engineCode ?? 1),
        ...(detail.mixed_tech ? block("clan_engine", clanTech(detail.engine?.technology) ? "true" : "false") : []),
        ...(omni ? block("omni", 1) : []),
        ...block("armor_type", armorCode ?? 0),
        ...block("armor_tech_level", armorClan ? 2 : 1),
        ...block("armor", ...armor),
        ...Object.entries(blocks).flatMap(([name, items]) => block(`${name} Equipment`, ...items)),
        ...(transporters.length ? block("transporters", ...transporters) : []),
    ];
    return { text: lines.join("\n") + "\n", issues };
}

// ---- ProtoMechs ----

/** mordel.net names the ProtoMech import reads by another name (its lookup names, squashed). */
const PROTO_NAMES: Record<string, string> = {
    "Machine Gun": "clmg", "Light Machine Gun": "cllightmg", "Heavy Machine Gun": "clheavymg",
    "Improved Heavy Small Laser": "climprovedsmallheavylaser", "Improved Heavy Medium Laser": "climprovedmediumheavylaser",
    "Improved Heavy Large Laser": "climprovedlargeheavylaser", "Magnetic Clamp System": "protomagneticclamp",
    "ProtoMech Quad Melee Weapon": "protoquadmeleesystem", "ProtoMech Melee Weapon": "protomechmelee",
    "Partial Wing": "protomechpartialwing", "Fusillade Launcher": "fusillade",
};
const PROTO_BLOCKS: Record<string, string> = { T: "Torso", RA: "Right Arm", LA: "Left Arm", MG: "Main Gun" };
const PROTO_MISSILE = /^(Streak SRM|Streak LRM|SRM|LRM) (\d+)$/;

/** A ProtoMech weapon's MegaMek lookup name. */
function protoName(name: string): string {
    if (PROTO_NAMES[name]) return PROTO_NAMES[name];
    const lbx = /^LB (\d+)-X AC$/.exec(name);
    return lbx ? `CLLBXAC${lbx[1]}` : `CL${name}`;
}

/** The ammunition line the ProtoMech import reads for a weapon's shots: "Clan Ammo ProtoMech LRM 5 (10)". */
function protoAmmoName(weapon: string): string {
    if (PROTO_MISSILE.test(weapon)) return `Clan Ammo ProtoMech ${weapon}`;
    if (/Machine Gun$/.test(weapon)) return `Clan ${weapon} Ammo - Proto`;
    if (/^(LB \d+-X AC|ProtoMech AC\/\d+)$/.test(weapon)) return `Clan ${weapon} Ammo`;
    return `CL${weapon.replace(/Chemical/, "Chem")} Ammo`;
}

/** The detail as a ProtoMech BLK file. Issues name what was read approximately or left out. */
export function mordelProtoMechToBlk(detail: IMordelDetail): { text: string; issues: string[] } {
    const issues: string[] = [];
    const config = detail.configuration ?? "Biped";
    const motion = /^quad/i.test(config) ? "Quad" : /^glider/i.test(config) ? "WiGE" : "Biped";
    if (!/^(Biped|Quad|Glider)/i.test(config)) issues.push(`ProtoMech configuration '${config}' is read as a biped`);
    const body: string[] = [];
    const blocks: Record<string, string[]> = {};
    const shots: Record<string, number> = {};
    for (const item of detail.equipment ?? []) {
        const name = item.name.trim();
        const ammo = AMMO.exec(name);
        if (ammo) {
            if (ammo[3]) issues.push(`'${name}': ${ammo[3]} rounds are read as standard ones`);
            shots[ammo[1]] = (shots[ammo[1]] ?? 0) + Number(ammo[2]);
            continue;
        }
        const where = PROTO_BLOCKS[item.location ?? ""];
        if (!where) { issues.push(`'${name}' is in location '${item.location ?? "none"}', which a ProtoMech import does not read`); continue; }
        (blocks[where] ??= []).push(`${protoName(name)}${/rear/i.test(item.facing ?? "") ? " (R)" : ""}`);
    }
    const jump = detail.movement?.jump ?? 0;
    const jet = /^extended/i.test(detail.jump_jets?.type ?? "") ? "Extended Jump Jet System" : /umu/i.test(detail.jump_jets?.type ?? "") ? "ProtoMech UMU" : "ProtoMech Jump Jet";
    for (let n = 0; n < jump; n++) body.push(jet);
    if (/booster/i.test(detail.myomer?.type ?? "")) body.push("CLMyomerBooster");
    for (const [weapon, count] of Object.entries(shots)) body.push(`${protoAmmoName(weapon)} (${count})`);

    const armorOf = (code: string) => detail.locations?.find((location) => location.code === code)?.armor ?? 0;
    const lines = [
        ...header(detail, "ProtoMech"),
        ...block("motion_type", motion),
        ...block("cruiseMP", detail.movement?.walk ?? 0),
        ...(/electric discharge/i.test(detail.armor?.type ?? "") ? block("armor_type", 18) : []),
        ...(/interface/i.test(detail.cockpit?.type ?? "") ? block("interface_cockpit", "true") : []),
        ...block("armor", ...["H", "T", "RA", "LA", "L", "MG"].map(armorOf)),
        ...(body.length ? block("Body Equipment", ...body) : []),
        ...Object.entries(blocks).flatMap(([name, items]) => block(`${name} Equipment`, ...items)),
    ];
    return { text: lines.join("\n") + "\n", issues };
}

export interface IMordelBlkImport {
    unit: Vehicle | ProtoMech | null;
    kind: "vehicle" | "protomech";
    issues: string[];
    /** True only when nothing was left out or read approximately and our Battle Value is mordel.net's. */
    bvOk: boolean;
    ourBV: number;
}

/** Builds a mordel.net Combat Vehicle or ProtoMech, and checks it against mordel.net's Battle Value. */
export function importMordelBlk(detail: IMordelDetail): IMordelBlkImport {
    const kind = detail.unit_type_short === "pm" ? "protomech" : "vehicle";
    const { text, issues: notes } = kind === "protomech" ? mordelProtoMechToBlk(detail) : mordelVehicleToBlk(detail);
    const read = importBlkUnit(text, [kind === "protomech" ? "protomechs" : "vehicles"]);
    const unit = read.unit as Vehicle | ProtoMech | null;
    const issues = [...notes, ...read.issues, ...read.notes];
    if (unit && kind === "vehicle") {
        const vehicle = unit as Vehicle;
        const drones = detail.equipment?.find((item) => item.stacks?.unit === "drones")?.stacks?.count;
        const carrier = vehicle.getEquipmentList().find((item) => item.variableFormula === "drone-carrier-control");
        if (drones && carrier?.uuid) vehicle.setControlledDrones(carrier.uuid, drones);
    }
    const ourBV = unit ? unit.getBattleValue() : 0;
    return { unit, kind, issues, bvOk: !!unit && issues.length === 0 && detail.battle_value != null && ourBV === detail.battle_value, ourBV };
}
