import { blkValue, parseBlkFile } from "../utils/blk-file";
import type AerospaceFighter from "./aerospace-fighter";
import type BattleArmor from "./battle-armor";
import { importBattleArmorBlk } from "./battle-armor-blk";
import type ProtoMech from "./protomech";
import { importProtoMechBlk } from "./protomech-blk";
import type SmallCraft from "./small-craft";
import { importSmallCraftBlk } from "./small-craft-blk";
import type Vehicle from "./vehicle";
import { importFixedWingSupportBlk, importSupportVehicleBlk, importVehicleBlk } from "./vehicle-blk";

// MegaMek saves every unit other than a 'Mech as a ".blk" file. This is the one way in for all of them: the file's
// UnitType picks the reader, and every reader gives the same result.

export type BlkUnitKind = "vehicles" | "support-vehicles" | "fixed-wing-support" | "battle-armor" | "protomechs" | "small-craft";
export type BlkUnit = Vehicle | AerospaceFighter | BattleArmor | ProtoMech | SmallCraft;

export interface IBlkUnitImport {
    /** The kind of unit the file holds; none when it is not a unit file or holds a type this app does not read. */
    kind: BlkUnitKind | null;
    unit: BlkUnit | null;
    /** What could not be carried over. */
    issues: string[];
    /** What was carried over in a different form. */
    notes: string[];
}

interface IBlkReader {
    /** The kind, said for a message: "a Combat Vehicle". */
    name: string;
    /** The file's UnitType values, lower case. */
    unitTypes: string[];
    read: (text: string) => Omit<IBlkUnitImport, "kind">;
}

export const BLK_READERS: Record<BlkUnitKind, IBlkReader> = {
    "vehicles": { name: "a Combat Vehicle", unitTypes: ["tank", "vtol"],
        read: (text) => { const { vehicle, issues } = importVehicleBlk(text); return { unit: vehicle, issues, notes: [] }; } },
    "support-vehicles": { name: "a ground or VTOL Support Vehicle", unitTypes: ["supporttank", "largesupporttank", "supportvtol"],
        read: (text) => { const { vehicle, issues, notes } = importSupportVehicleBlk(text); return { unit: vehicle, issues, notes }; } },
    "fixed-wing-support": { name: "a Fixed-Wing Support Vehicle", unitTypes: ["fixedwingsupport"],
        read: (text) => { const { fighter, issues, notes } = importFixedWingSupportBlk(text); return { unit: fighter, issues, notes }; } },
    "battle-armor": { name: "battle armor", unitTypes: ["battlearmor"],
        read: (text) => { const { suit, issues } = importBattleArmorBlk(text); return { unit: suit, issues, notes: [] }; } },
    "protomechs": { name: "a ProtoMech", unitTypes: ["protomek", "protomech"],
        read: (text) => { const { proto, issues } = importProtoMechBlk(text); return { unit: proto, issues, notes: [] }; } },
    "small-craft": { name: "a Small Craft or DropShip", unitTypes: ["smallcraft", "dropship"],
        read: (text) => { const { craft, issues, notes } = importSmallCraftBlk(text); return { unit: craft, issues, notes }; } },
};

/** The kind of unit a MegaMek file holds, from its UnitType alone; none when it is not one this app reads. */
export const getBlkUnitKind = (text: string): BlkUnitKind | null => {
    const file = parseBlkFile(text);
    const unitType = file ? blkValue(file, "UnitType").toLowerCase().trim() : "";
    return (Object.keys(BLK_READERS) as BlkUnitKind[]).find((kind) => BLK_READERS[kind].unitTypes.includes(unitType)) ?? null;
};

/**
 * Reads any MegaMek ".blk" unit file. `accept` limits it to the kinds a page builds; a file of another kind is
 * refused with a message naming what it holds.
 */
export const importBlkUnit = (text: string, accept?: BlkUnitKind[]): IBlkUnitImport => {
    const file = parseBlkFile(text);
    if (!file) return { kind: null, unit: null, issues: ["This is not a MegaMek unit file."], notes: [] };
    const kind = getBlkUnitKind(text);
    const unitType = blkValue(file, "UnitType");
    if (!kind) return { kind: null, unit: null, issues: [`This file holds a ${unitType || "unit of an unknown type"}, which this app does not read yet.`], notes: [] };
    if (accept && !accept.includes(kind)) {
        const wanted = accept.map((item) => BLK_READERS[item].name).join(" or ");
        return { kind, unit: null, issues: [`This file holds ${BLK_READERS[kind].name}, not ${wanted}: load it in that unit's creator.`], notes: [] };
    }
    return { kind, ...BLK_READERS[kind].read(text) };
};
