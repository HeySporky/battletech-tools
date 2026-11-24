// A mordel.net unit's Alpha Strike card as a MUL record, so AlphaStrikeUnit.importMUL builds it like any MUL unit.
import { IASMULUnit } from "../../classes/alpha-strike-unit";
import { IMordelDetail, IMordelListRow } from "./mordel-types";

const RULES = new Set(["Introductory", "Standard", "Advanced", "Experimental", "Unofficial"]);

/** "3", "0*" (minimal damage) or "-": the value and whether it is minimal. */
const damageOf = (text: string | undefined): { value: number; min: boolean } => {
    const raw = (text ?? "").trim();
    return { value: Number.parseInt(raw, 10) || 0, min: raw.endsWith("*") };
};

const named = (name: string) => ({ Id: 0, Image: null, Name: name, SortOrder: 0 });

/** Null when the unit has no Alpha Strike card. */
export function mordelToASMULUnit(unit: IMordelListRow | IMordelDetail): IASMULUnit | null {
    const card = unit.alpha_strike;
    if (!card) return null;
    const chassis = unit.name_parts?.name?.trim() || unit.name;
    const model = unit.name_parts?.model?.trim() || "";
    const short = damageOf(card.damage?.short);
    const medium = damageOf(card.damage?.medium);
    const long = damageOf(card.damage?.long);
    const extreme = damageOf(card.damage?.extreme);
    const sources = (unit as IMordelDetail).sources;
    return {
        FormatedTonnage: null,
        GroupName: null,
        BFAbilities: (card.specials ?? []).join(","),
        BFArmor: card.armor,
        BFDamageShort: short.value,
        BFDamageMedium: medium.value,
        BFDamageLong: long.value,
        BFDamageExtreme: extreme.value,
        BFDamageShortMin: short.min,
        BFDamageMediumMin: medium.min,
        BFDamageLongMin: long.min,
        BFDamageExtremeMin: extreme.min,
        BFMove: card.move,
        BFOverheat: card.overheat ?? 0,
        BFPointValue: card.point_value,
        BFSize: card.size,
        BFStructure: card.structure,
        BFTMM: card.tmm,
        BFThreshold: 0,
        BFType: card.type,
        BattleValue: unit.battle_value ?? 0,
        // Without a MUL 2.0 key, importMUL reads Class as the chassis and Name as the whole name.
        Class: chassis,
        Name: unit.name.trim(),
        Variant: model || null,
        Cost: unit.cost ?? 0,
        DateIntroduced: unit.year ? String(unit.year) : "",
        EraIcon: "",
        EraId: 0,
        EraStart: unit.year ?? 0,
        // Not a MUL unit: a mordel.net id here could be taken for a real MUL id.
        Id: 0,
        ImageUrl: (unit as IMordelDetail).image_url ?? "",
        IsFeatured: false,
        IsPublished: true,
        RS: "",
        RSId: 0,
        Release: 0,
        Role: named(unit.role?.trim() || "None"),
        Rules: RULES.has(unit.rules_level ?? "") ? unit.rules_level! : "Standard",
        Skill: 4,
        TRO: sources?.[0]?.title ?? (unit.canon ? "" : "mordel.net fan design"),
        TROId: 0,
        Technology: named(unit.tech_base),
        Tonnage: unit.tons,
        Type: named(unit.unit_type),
        MulSource: "mordel",
    };
}
