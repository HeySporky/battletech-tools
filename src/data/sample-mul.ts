import type { IASMULUnit } from "../classes/alpha-strike-unit";
import { BattleMech } from "../classes/battlemech";
import Vehicle from "../classes/vehicle";
import { groundTMM } from "../utils/alphaStrikeGroundPointValue";
import { mulEras } from "../utils/mulUtilities";
import { ARTVEE_SAMPLES } from "./artvee-samples";
import { buildCustomMULRecord, CUSTOM_MUL_ID_START, CUSTOM_MUL_KEY_PREFIX, CUSTOM_TECHNOLOGIES, emptyCustomMULForm, ICustomMULForm } from "./custom-mul";
import { VTOLAM_SAMPLES } from "./vtolam-samples";
import { EMPLACEMENT_CARDS, IEmplacementCard } from "./emplacement-cards";

// The sample units the creators ship (ArtVees, VTOLAMs) as entries in the shared custom unit list
// (src/data/mul/custom/custom-units.json), so the Alpha Strike and Classic roster searches find them when "Custom
// units" is ticked (#376). Stats come from each creator's own Alpha Strike conversion; sample-mul.test.ts checks the
// list still matches it.

/** ArtVee entries take the ids after the editor's first custom id, in sample order; VTOLAMs follow at +100. */
export const ARTVEE_MUL_ID_START = CUSTOM_MUL_ID_START + 9000;
export const ARTVEE_MUL_DATE = "2026-10-23T00:00:00.000Z";
export const VTOLAM_MUL_ID_START = ARTVEE_MUL_ID_START + 100;
export const VTOLAM_MUL_DATE = "2026-10-26T00:00:00.000Z";
export const EMPLACEMENT_MUL_ID_START = VTOLAM_MUL_ID_START + 100;
export const EMPLACEMENT_MUL_DATE = "2026-11-15T00:00:00.000Z";

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

export function buildArtVeeMULRecords(): IASMULUnit[] {
    return ARTVEE_SAMPLES.map((sample, index) => {
        const vehicle = new Vehicle(JSON.stringify(sample.save));
        const form = {
            ...vehicleMULForm(vehicle),
            name: sample.save.name,
            variant: sample.save.model,
            unitType: "Combat Vehicle",
            rules: "Experimental",
            author: "Jeff's BattleTech Tools",
            source: "ArtVee samples (Vehicle Creator, Custom Homebrew)",
            notes: "Custom Homebrew ArtVee (Artillery Vehicle), an idea put forward on the Star League Discord by kris (helvedes heste).",
        };
        return sampleRecord(form, ARTVEE_MUL_ID_START + index, `ARTVEE-${sample.id.toUpperCase()}`, ARTVEE_MUL_DATE);
    });
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

export function buildSampleMULRecords(): IASMULUnit[] {
    return [...buildArtVeeMULRecords(), ...buildVTOLAMMULRecords(), ...buildEmplacementMULRecords()];
}
