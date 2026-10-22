import { getComboArtillery } from "../data/artillery-custom";
import type { IEquipmentItem } from "../data/data-interfaces";
import type Vehicle from "./vehicle";

/*
 * ArtVee rules over a Vehicle (Custom Homebrew; ArtVee design 2026-10-20). The flag, weight, slots, cost and
 * pruning live on Vehicle itself; the issues, warnings and variant logic live here. Vehicle is imported as a type
 * only, so this module never loads before vehicle.ts.
 */

export type ArtVeeVariant = "thumper" | "sniper" | "long-tom";

const ENGINES = ["xl", "clan_xl", "xxl", "clan_xxl"];

const VARIANT_BY_PIECE: Record<string, ArtVeeVariant> = {
    "thumper-artillery": "thumper",
    "sniper-artillery": "sniper",
    "long-tom-artillery": "long-tom",
};

/** Every combo gun mounted on the vehicle. */
export function getArtVeeComboGuns(vehicle: Vehicle): IEquipmentItem[] {
    return vehicle.getEquipmentList().filter((item) => !!item.comboArtilleryTag);
}

/** The variant a single combo gun fixes; null with no combo gun, or with more than one. */
export function getArtVeeVariant(vehicle: Vehicle): ArtVeeVariant | null {
    const guns = getArtVeeComboGuns(vehicle);
    if (guns.length !== 1) return null;
    return VARIANT_BY_PIECE[guns[0].comboArtilleryTag ?? ""] ?? null;
}

/** Construction errors. An ordinary vehicle has none unless it still mounts a combo gun. */
export function getArtVeeIssues(vehicle: Vehicle): string[] {
    const guns = getArtVeeComboGuns(vehicle);
    if (!vehicle.isArtVee()) {
        return guns.map((gun) => `${gun.name} is an ArtVee combo gun, but the vehicle is not an ArtVee`);
    }
    const issues: string[] = [];
    const eraIssue = vehicle.getArtVeeEraIssue();
    if (eraIssue) issues.push(eraIssue);
    if (!ENGINES.includes(vehicle.getEngineType().tag)) issues.push("ArtVee needs an XL or XXL engine");
    if (getArtVeeVariant(vehicle) === "long-tom") {
        if (vehicle.getCruiseMP() < 3) issues.push("ArtVee with a Long Tom combo gun needs at least 3 Cruising MP");
    } else if (vehicle.getCruiseMP() < 4) {
        issues.push("ArtVee needs at least 4 Cruising MP");
    }
    if (guns.length !== 1) issues.push(`ArtVee needs exactly one combo gun (has ${guns.length})`);
    else if (guns[0].location !== "turret") issues.push("ArtVee combo gun must be mounted in the turret");
    return issues;
}

/** Design advice, not errors. */
export function getArtVeeWarnings(vehicle: Vehicle, rulesLevel: number): string[] {
    if (!vehicle.isArtVee()) return [];
    const warnings: string[] = [];
    const maxArmor = vehicle.getMaxArmorPoints();
    const armor = vehicle.getTotalArmorPoints();
    if (armor < maxArmor / 2) warnings.push(`ArtVee armor is below half the maximum (${armor} of ${maxArmor} points)`);
    const motiveOffered = vehicle.getAvailableChassisModifications(rulesLevel).some((mod) => mod.tag === "armored-motive");
    if (motiveOffered && !vehicle.hasChassisModification("armored-motive")) warnings.push("Armored Motive System recommended");
    return warnings;
}

/** Record sheet and card notes: both modes of an ArtVee, with the Siege numbers from the canon artillery piece. */
export function getArtVeeNotes(vehicle: Vehicle): string[] {
    if (!vehicle.isArtVee()) return [];
    const notes = [`ArtVee (MAP): Vehicle Mode ${vehicle.getCruiseMP()}/${vehicle.getFlankMP()}, Siege Mode 0/0`];
    const alphaStrike: string[] = [];
    for (const gun of getArtVeeComboGuns(vehicle)) {
        const piece = getComboArtillery(gun);
        const pieceName = piece ? piece.name.replace(/ Artillery Piece$/, "") : "artillery";
        const range = gun.range;
        const vehicleMode = `Vehicle Mode AC/${gun.damage} (${gun.damage} damage, ${gun.heat} heat, ${range.min}/${range.short}/${range.medium}/${range.long})`;
        const siegeMode = piece
            ? `Siege Mode ${pieceName} artillery (${piece.heat} heat, ${piece.damage} damage, ${piece.range.maxMapSheets} mapsheets)`
            : "Siege Mode artillery";
        notes.push(`${pieceName} / AC/${gun.damage} combo: ${vehicleMode}; ${siegeMode}`);
        const code = gun.alphaStrike?.specialAbility?.find((special) => special.startsWith("ART"));
        if (code) alphaStrike.push(`Alpha Strike: ${code} in Siege Mode only; Siege Mode Move 0"`);
    }
    notes.push("Transforms in the Movement Phase before moving; it cannot move or fire that turn", ...alphaStrike);
    // Identical combo guns share one line each.
    return [...new Set(notes)];
}
