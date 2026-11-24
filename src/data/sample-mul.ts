import type { IASMULUnit } from "../classes/alpha-strike-unit";
import { BattleMech } from "../classes/battlemech";
import BattleArmor from "../classes/battle-armor";
import Vehicle from "../classes/vehicle";
import { BATTLE_ARMOR_SAMPLES, BATTLE_ARMOR_SAMPLES_CREDIT } from "./battle-armor-samples";
import { groundTMM } from "../utils/alphaStrikeGroundPointValue";
import { mulEras } from "../utils/mulUtilities";
import { buildCustomMULRecord, CUSTOM_MUL_ID_START, CUSTOM_MUL_KEY_PREFIX, CUSTOM_TECHNOLOGIES, emptyCustomMULForm, ICustomMULForm } from "./custom-mul";
import { VTOLAM_SAMPLES } from "./vtolam-samples";
import { EMPLACEMENT_CARDS, IEmplacementCard } from "./emplacement-cards";

// The sample units the creators ship (VTOLAMs, emplacements, battle armor) as entries in the shared custom unit list
// (src/data/mul/custom/custom-units.json), so the Alpha Strike and Classic roster searches find them when "Custom
// units" is ticked (#376). Stats come from each creator's own Alpha Strike conversion; sample-mul.test.ts checks the
// list still matches it.

/** VTOLAM entries take the ids from 9100 after the editor's first custom id, in sample order (ids kept where they were); the rest follow at +100. */
export const VTOLAM_MUL_ID_START = CUSTOM_MUL_ID_START + 9100;
export const VTOLAM_MUL_DATE = "2026-10-26T00:00:00.000Z";
export const EMPLACEMENT_MUL_ID_START = VTOLAM_MUL_ID_START + 100;
export const EMPLACEMENT_MUL_DATE = "2026-11-15T00:00:00.000Z";
export const BATTLE_ARMOR_MUL_ID_START = EMPLACEMENT_MUL_ID_START + 100;
export const BATTLE_ARMOR_MUL_DATE = "2026-11-21T00:00:00.000Z";

export function getMULEraIdForYear(year: number): number {
    return mulEras.find((era) => year >= era.yearStart && (era.yearEnd === null || year <= era.yearEnd))?.id ?? 0;
}

function customTechnology(techName: string): string {
    if (techName.startsWith("Mixed")) return "Mixed";
    return CUSTOM_TECHNOLOGIES.some((tech) => tech.name === techName) ? techName : "Inner Sphere";
}

function sampleRecord(form: ICustomMULForm, id: number, key: string, date: string): IASMULUnit {
    return buildCustomMULRecord(form, { id, key: `${CUSTOM_MUL_KEY_PREFIX}${key}`, createdAt: date }, date);
}

/** A vehicle's custom-list entry, from its own Battle Value and Alpha Strike conversion; credits are the caller's. */
export function vehicleMULForm(vehicle: Vehicle): ICustomMULForm {
    const stats = vehicle.getAlphaStrikeStats();
    return {
        ...emptyCustomMULForm(),
        name: vehicle.getName(),
        variant: vehicle.getModel(),
        unitType: vehicle.isSupportVehicle() ? "Support Vehicle" : vehicle.isOmni() ? "OmniVehicle" : "Combat Vehicle",
        technology: customTechnology(vehicle.getTech().name),
        eraId: String(getMULEraIdForYear(vehicle.getEra().yearStart)),
        tonnage: String(vehicle.getTonnage()),
        battleValue: String(vehicle.getBattleValue()),
        pointValue: String(stats.pointValue),
        size: String(stats.size),
        // Written the way Vehicle.getAlphaStrikeUnit() writes BFMove.
        move: `${stats.movement}"${stats.movementType}` + (stats.jumpMovement ? `/${stats.jumpMovement}"j` : ""),
        tmm: String(stats.tmm),
        armor: String(stats.armor),
        structure: String(stats.structure),
        damageShort: stats.damageValues.short.minimal ? "0*" : String(stats.damageValues.short.damage),
        damageMedium: stats.damageValues.medium.minimal ? "0*" : String(stats.damageValues.medium.damage),
        damageLong: stats.damageValues.long.minimal ? "0*" : String(stats.damageValues.long.damage),
        damageExtreme: stats.damageValues.extreme.minimal ? "0*" : String(stats.damageValues.extreme.damage),
        abilities: stats.specialAbilities.join(","),
    };
}

// Who designed each VTOLAM sample, by the fan rule set its name carries (see vtolam-samples.ts).
function vtolamCredit(sampleName: string): { author: string; notes: string } {
    if (sampleName.includes("BishopSteiner")) {
        return {
            author: "BishopSteiner",
            notes: "Custom Homebrew VTOLAM under BishopSteiner's rules (DeviantArt, 2021). He gives its role, movement, engine rating and weapons; the rest of the build is Jeff's BattleTech Tools'.",
        };
    }
    return {
        author: "professorheyteen",
        notes: "Custom Homebrew VTOLAM by professorheyteen, built as published in Battletech Into The Future (battletechfuture.com, 2024).",
    };
}

const DAMAGE_RANGES = ["short", "medium", "long", "extreme"] as const;

/** A 'Mech's custom-list entry, from its own Battle Value and Alpha Strike conversion; credits are the caller's. */
export function mechMULForm(mech: BattleMech): ICustomMULForm {
    const unit = mech.calcAlphaStrike();
    const damage = Object.fromEntries(DAMAGE_RANGES.map((range) => {
        const minimal = unit.damage[`${range}Minimal`];
        return [range, minimal ? "0*" : String(unit.damage[range])];
    })) as Record<typeof DAMAGE_RANGES[number], string>;
    const moves = unit.move.filter((move) => move.move > 0);
    return {
        ...emptyCustomMULForm(),
        name: mech.getChassisName(),
        variant: mech.getModelName(),
        unitType: mech.isIndustrialMech() ? "IndustrialMech" : "BattleMech",
        technology: customTechnology(mech.getTech().name),
        role: unit.role,
        eraId: String(getMULEraIdForYear(mech.getEra().yearStart)),
        tonnage: String(mech.getTonnage()),
        battleValue: String(mech.getBattleValue()),
        pointValue: String(unit.basePoints),
        size: String(unit.size),
        // The MUL's style: 16"/16"j.
        move: moves.map((move) => `${move.move}"${move.type}`).join("/"),
        // As the vehicle conversion does, from the ground move.
        tmm: String(groundTMM(moves[0]?.move ?? 0)),
        armor: String(unit.armor),
        structure: String(unit.structure),
        damageShort: damage.short,
        damageMedium: damage.medium,
        damageLong: damage.long,
        damageExtreme: damage.extreme,
        overheat: String(unit.overheat),
        // The MUL writes "SRM1/1", not the creator's "SRM 1/1/1" spacing.
        abilities: ([] as string[]).concat(unit.abilities).flatMap((codes) => codes.split(","))
            .map((code) => code.trim().replace(/\s+/g, "")).filter((code) => code).join(","),
    };
}

export function buildVTOLAMMULRecords(): IASMULUnit[] {
    return VTOLAM_SAMPLES.map((sample, index) => {
        const save = sample.save as { name: string; model: string };
        const form = {
            ...mechMULForm(new BattleMech(JSON.stringify(sample.save))),
            name: save.name,
            variant: save.model,
            unitType: "BattleMech",
            rules: "Experimental",
            ...vtolamCredit(sample.name),
            source: "VTOLAM samples ('Mech Creator, Custom Homebrew)",
        };
        return sampleRecord(form, VTOLAM_MUL_ID_START + index, `VTOLAM-${sample.id.toUpperCase()}`, VTOLAM_MUL_DATE);
    });
}

/** The Aces: Scouring Sands emplacement cards (#191), copied from the cards as printed. */
export function emplacementMULForm(card: IEmplacementCard): ICustomMULForm {
    return {
        ...emptyCustomMULForm(),
        name: card.name,
        variant: card.variant,
        unitType: "Emplacement",
        technology: "Inner Sphere",
        role: "None",
        eraId: String(getMULEraIdForYear(3151)),
        tonnage: "0",
        pointValue: String(card.pointValue),
        size: "0",
        move: "0\"",
        tmm: "0",
        armor: String(card.armor),
        structure: String(card.structure),
        damageShort: card.damage[0],
        damageMedium: card.damage[1],
        damageLong: card.damage[2],
        abilities: card.abilities.join(","),
        author: "Catalyst Game Labs",
        source: `BattleTech: Aces - Scouring Sands, Battlefield Support card ${card.cardNumber}`,
        notes: "Not on the MUL. Copied from the box's Battlefield Support card (photos from Rekikire). Immobile; critical hits are Weapon Hits, -1 damage each; crippled at 0 damage; no Forced Withdrawal (Aces p.6).",
    };
}

export function buildEmplacementMULRecords(): IASMULUnit[] {
    return EMPLACEMENT_CARDS.map((card, index) =>
        sampleRecord(emplacementMULForm(card), EMPLACEMENT_MUL_ID_START + index, card.key, EMPLACEMENT_MUL_DATE));
}

/** A battle armor squad's custom-list entry, from its own Battle Value and Alpha Strike conversion; credits are the caller's. */
export function battleArmorMULForm(suit: BattleArmor): ICustomMULForm {
    const stats = suit.getAlphaStrikeStats();
    const damage = (value: { damage: number; minimal: boolean }): string => (value.minimal ? "0*" : String(value.damage));
    return {
        ...emptyCustomMULForm(),
        name: suit.getName(),
        unitType: "Battle Armor",
        technology: customTechnology(suit.getTechName()),
        eraId: String(getMULEraIdForYear(suit.getEra().yearStart)),
        // The squad's weight in tons.
        tonnage: String(Math.round(suit.getWeight() * suit.getSquadSize()) / 1000),
        battleValue: String(suit.getBattleValue()),
        pointValue: String(stats.pointValue),
        size: String(stats.size),
        move: stats.move,
        tmm: String(groundTMM(stats.movement)),
        armor: String(stats.armor),
        structure: String(stats.structure),
        damageShort: damage(stats.damageValues.short),
        damageMedium: damage(stats.damageValues.medium),
        damageLong: damage(stats.damageValues.long),
        abilities: stats.specialAbilities.join(","),
    };
}

/** The Hardsuit battle armor (Pleiades Mechworks, #640): each sample, in sample order. */
export function buildBattleArmorMULRecords(): IASMULUnit[] {
    return BATTLE_ARMOR_SAMPLES.map((sample, index) => {
        const form = {
            ...battleArmorMULForm(new BattleArmor(JSON.stringify(sample.save))),
            rules: "Experimental",
            author: "u/PleiadesMechworks",
            source: "Battle armor samples (Battle Armor Creator, Custom Homebrew)",
            notes: `${BATTLE_ARMOR_SAMPLES_CREDIT} Built from the record sheet, which prints BV/PV ${sample.sheet}; the point value matches, the Battle Value is ours.`,
        };
        return sampleRecord(form, BATTLE_ARMOR_MUL_ID_START + index, `BATTLEARMOR-${sample.id.toUpperCase()}`, BATTLE_ARMOR_MUL_DATE);
    });
}

export function buildSampleMULRecords(): IASMULUnit[] {
    return [...buildVTOLAMMULRecords(), ...buildEmplacementMULRecords(), ...buildBattleArmorMULRecords()];
}
