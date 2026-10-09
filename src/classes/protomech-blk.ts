import { ProtoMechMissileFamily, ProtoMechMountLocation } from "../data/protomech-construction";
import { IBlkFile, blkLines, blkValue, parseBlkFile } from "../utils/blk-file";
import ProtoMech from "./protomech";

// Reads a MegaMek ProtoMech ".blk" file into a ProtoMech. The file names its equipment by MegaMek's lookup names;
// the tables below pair those names with this catalog. Anything that has no match is left off and reported, so the
// importer never guesses. Ammunition is listed by type with a shot count, which is shared out between the weapons
// that fire it.

// Lookup names with spaces and punctuation removed, in lower case.
const EQUIPMENT: Record<string, string> = {
    clermicrolaser: "er-micro-laser",
    clersmalllaser: "er-small-laser-clan",
    clermediumlaser: "er-medium-laser-clan",
    clerlargelaser: "clan-er-large-laser",
    clerppc: "er-ppc-clan",
    clmicropulselaser: "micro-pulse-laser",
    clsmallpulselaser: "clan-small-pulse-laser",
    clmediumpulselaser: "clan_medium-pulse-laser",
    cllargepulselaser: "clan_large-pulse-laser",
    clheavysmalllaser: "small-heavy-laser",
    clheavymediumlaser: "medium-heavy-laser",
    clheavylargelaser: "large-heavy-laser",
    climprovedsmallheavylaser: "clan-improved-heavy-small-laser",
    climprovedmediumheavylaser: "clan-improved-heavy-medium-laser",
    climprovedlargeheavylaser: "clan-improved-heavy-large-laser",
    clsmallchemicallaser: "clan-small-chemical-laser",
    clmediumchemicallaser: "clan-medium-chemical-laser",
    cllargechemicallaser: "clan-large-chemical-laser",
    clplasmacannon: "plasma-cannon",
    clflamer: "clan-flamer",
    clerflamer: "clan-er-flamer",
    clheavyflamer: "clan-heavy-flamer",
    clmg: "clan-machine-gun",
    cllightmg: "clan-light-machine-gun",
    clheavymg: "clan-heavy-machine-gun",
    clapgaussrifle: "ap-gauss-rifle",
    clgaussrifle: "clan-gauss-rifle",
    cllbxac2: "clan-autocannon-lbx-2",
    cllbxac5: "clan-autocannon-lbx-5",
    cllbxac10: "clan-autocannon-lbx-10",
    clultraac2: "clan-autocannon-uac-2",
    clultraac5: "clan-autocannon-uac-5",
    clultraac10: "clan-autocannon-uac-10",
    clprotomechac2: "protomech-autocannon-2",
    clprotomechac4: "protomech-autocannon-4",
    clprotomechac8: "protomech-autocannon-8",
    clams: "clan-ams",
    clecmsuite: "clan-ecm-system",
    clangelecmsuite: "clan-angel-ecm",
    clactiveprobe: "clan-active-probe",
    cllightactiveprobe: "clan-light-active-probe",
    cltag: "clan-tag",
    cllighttag: "clan-light-tag",
    protomagneticclamp: "protomech-magnetic-clamp",
    protoquadmeleesystem: "protomech-quad-melee-system",
    protomechmelee: "protomech-melee-weapon",
    protomechpartialwing: "protomech-partial-wing",
    fusillade: "protomech-fusillade",
};

// Ammunition names, with the shot count taken off, and the weapon each feeds.
const AMMO: Record<string, string> = {
    clapgaussrifleammo: "ap-gauss-rifle",
    clanmachinegunammoproto: "clan-machine-gun",
    clanlightmachinegunammoproto: "clan-light-machine-gun",
    clanheavymachinegunammoproto: "clan-heavy-machine-gun",
    clsmallchemlaserammo: "clan-small-chemical-laser",
    clmediumchemlaserammo: "clan-medium-chemical-laser",
    cllargechemlaserammo: "clan-large-chemical-laser",
    clplasmacannonammo: "plasma-cannon",
    clanlb2xacammo: "clan-autocannon-lbx-2",
    clanlb5xacammo: "clan-autocannon-lbx-5",
    clanlb10xacammo: "clan-autocannon-lbx-10",
    clanprotomechac2ammo: "protomech-autocannon-2",
    clanprotomechac4ammo: "protomech-autocannon-4",
    clanprotomechac8ammo: "protomech-autocannon-8",
};

const LOCATION_BLOCKS: [string, ProtoMechMountLocation][] = [
    ["Torso Equipment", "torso"],
    ["Right Arm Equipment", "ra"],
    ["Left Arm Equipment", "la"],
    ["Main Gun Equipment", "mainGun"],
];

// Inner Sphere items a published ProtoMech file carries, and the Clan record each is entered as. The Gorgon 6's
// file lists an Inner Sphere Angel ECM suite: the plain Clan ECM suite would leave the design a ton light, so it is
// entered as the Angel ECM suite, as printed (user ruling, 2026-10-09). Both Angel suites weigh 2 tons.
const INNER_SPHERE_STAND_INS: Record<string, { tag: string; note: string }> = {
    isangelecmsuite: { tag: "clan-angel-ecm", note: "The file's Inner Sphere Angel ECM suite is entered as the Angel ECM Suite (Clan): the same 2 tons and values." },
};

const slug = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, "");

// A file names its own equipment: keep "constructor" or "__proto__" from finding an inherited property.
[EQUIPMENT, AMMO, INNER_SPHERE_STAND_INS].forEach((table) => Object.setPrototypeOf(table, null));

/** A tube launcher's family and size from a weapon name ("CLSRM4") or an ammunition name ("Clan Ammo ProtoMech LRM-4"). */
const readMissile = (name: string): { family: ProtoMechMissileFamily; tubes: number } | null => {
    const match = /^(?:cl|clanammo(?:protomech)?|clan)(streaksrm|streaklrm|srm|lrm)(\d+)(?:ammo)?$/.exec(slug(name));
    if (!match) return null;
    const family: ProtoMechMissileFamily = match[1] === "streaksrm" ? "streak-srm" : match[1] === "streaklrm" ? "streak-lrm" : match[1] === "srm" ? "srm" : "lrm";
    return { family, tubes: Number(match[2]) };
};

export interface IProtoMechBlkImport {
    proto: ProtoMech | null;
    /** What could not be carried over. */
    issues: string[];
    /** What was carried over in another form. */
    notes?: string[];
}

export const isProtoMechBlk = (file: IBlkFile): boolean => ["protomek", "protomech"].includes(blkValue(file, "UnitType").toLowerCase());

export const importProtoMechBlk = (text: string): IProtoMechBlkImport => {
    const file = parseBlkFile(text);
    if (!file) return { proto: null, issues: ["The file could not be read as a MegaMek unit file."] };
    if (!isProtoMechBlk(file)) return { proto: null, issues: [`This is not a ProtoMech file${blkValue(file, "UnitType") ? ` (unit type: ${blkValue(file, "UnitType").slice(0, 40)})` : ""}.`] };

    const issues: string[] = [];
    const notes: string[] = [];
    const proto = new ProtoMech();
    proto.setName(`${blkValue(file, "Name")} ${blkValue(file, "Model")}`.trim());

    const motion = blkValue(file, "motion_type").toLowerCase();
    proto.setChassis(motion === "quad" ? "quad" : motion === "wige" ? "glider" : "biped");
    const tons = Number(blkValue(file, "tonnage"));
    proto.setTons(tons);
    if (proto.getTons() !== tons) issues.push(`Tonnage '${blkValue(file, "tonnage").slice(0, 20)}' is outside what the chassis allows: set to ${proto.getTons()}.`);
    if (blkValue(file, "interface_cockpit").toLowerCase() === "true") proto.setInterfaceCockpit(true);

    const walk = Number(blkValue(file, "cruiseMP"));
    proto.setWalkMP(walk);
    if (proto.getWalkMP() !== walk) issues.push(`${proto.isGlider() ? "WiGE Cruising" : "Walking"} MP ${blkValue(file, "cruiseMP").slice(0, 20)} is outside what the chassis allows: set to ${proto.getWalkMP()}.`);

    const body = blkLines(file, "Body Equipment").map((line) => line.trim());
    const count = (name: string): number => body.filter((line) => slug(line) === name).length;
    const jets = count("protomechjumpjet");
    const extended = count("extendedjumpjetsystem");
    const umus = count("protomechumu");
    if (extended > 0) proto.setJump("extended", extended);
    else if (jets > 0) proto.setJump("standard", jets);
    else if (umus > 0) proto.setJump("umu", umus);
    const wanted = extended || jets || umus;
    if (wanted > 0 && proto.getJumpJets() !== wanted) issues.push(`${wanted} ${umus ? "UMUs" : "jump jets"} are more than the chassis allows: set to ${proto.getJumpJets()}.`);
    if (count("clmyomerbooster") > 0) {
        proto.setMyomerBooster(true);
        if (!proto.hasMyomerBooster()) issues.push("A Glider cannot mount a myomer booster: left off.");
    }

    if (blkLines(file, "Main Gun Equipment").some((line) => line.trim())) proto.setMainGun(true);
    for (const [block, location] of LOCATION_BLOCKS) {
        for (const line of blkLines(file, block).map((item) => item.trim()).filter(Boolean)) {
            const name = slug(line);
            // EDP armor is listed in the torso, where it takes an item's place.
            if (name === "clanelectricdischargeprotomech") {
                proto.setArmorType("edp");
                continue;
            }
            const rear = /\(r\)$/i.test(line);
            const missile = readMissile(line.replace(/\(r\)$/i, ""));
            const standIn = INNER_SPHERE_STAND_INS[slug(line.replace(/\(r\)$/i, ""))];
            if (standIn) notes.push(standIn.note);
            const tag = missile ? `pm-${missile.family}` : standIn?.tag ?? EQUIPMENT[slug(line.replace(/\(r\)$/i, ""))];
            if (!tag || !proto.getMountLocations().includes(location) || !proto.addMount(tag, location, missile?.tubes)) {
                issues.push(`Unknown or unmountable equipment '${line.slice(0, 60)}' (${block.replace(" Equipment", "")}) was left off.`);
                continue;
            }
            if (rear) proto.updateMount(proto.getMounts().length - 1, { rear: true });
        }
    }
    if (blkValue(file, "armor_type") === "18") proto.setArmorType("edp");

    // Ammunition: "name (shots)", shared between the weapons that fire it.
    for (const line of body) {
        const match = /^(.*?)\s*\((\d+)\)$/.exec(line);
        if (!match) {
            if (!["eiinterface", "protomechjumpjet", "extendedjumpjetsystem", "protomechumu", "clmyomerbooster"].includes(slug(line))) issues.push(`Unknown equipment '${line.slice(0, 60)}' (Body) was left off.`);
            continue;
        }
        const shots = Number(match[2]);
        const missile = readMissile(match[1]);
        const weaponTag = missile ? `pm-${missile.family}` : AMMO[slug(match[1])];
        const fed = proto.getMounts().map((mount, index) => ({ mount, index }))
            .filter((item) => item.mount.tag === weaponTag && (!missile || item.mount.tubes === missile.tubes));
        if (!weaponTag || fed.length === 0) {
            issues.push(`Ammunition '${line.slice(0, 60)}' has no weapon here to feed: left off.`);
            continue;
        }
        const each = Math.floor(shots / fed.length);
        fed.forEach((item, position) => proto.updateMount(item.index, { shots: (item.mount.shots ?? 0) + each + (position < shots % fed.length ? 1 : 0) }));
    }

    // Armor: head, torso, right arm, left arm, legs, and the main gun when there is one.
    const armor = blkLines(file, "armor").map(Number);
    if (armor.filter((points) => Number.isFinite(points)).length < 5) issues.push("The file does not list armor for every location: the rest carry none.");
    const order = ["head", "torso", "ra", "la", "legs", "mainGun"] as const;
    order.forEach((location, index) => {
        const points = armor[index];
        if (!Number.isFinite(points) || points <= 0) return;
        if (location === "mainGun" && !proto.hasMainGun()) proto.setMainGun(true);
        proto.setArmor(location, points);
        if (proto.getArmor(location) !== points) issues.push(`${proto.getLocationName(location)} armor ${points} is over the limit of ${proto.getMaxArmor(location)}: set to ${proto.getArmor(location)}.`);
    });

    const year = Number(blkValue(file, "year"));
    if (Number.isFinite(year) && year > 0) {
        const era = proto.getAvailableEras().find((item) => item.yearStart <= year && (item.yearEnd ?? Infinity) >= year);
        if (era) proto.setEra(era.tag);
    }
    return { proto, issues, notes };
};
