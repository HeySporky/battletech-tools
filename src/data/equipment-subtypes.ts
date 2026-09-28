import { IEquipmentItem } from "./data-interfaces";

// Step 5 picker subtypes. These are UI groupings derived from the item name,
// not rules data. Order matters: the first matching rule wins, so the more
// specific families (Gauss before Rifles, Plasma before Rifles, MML/ATM/MRM
// before LRM/SRM) come first.
const subtypeRules: Array<{ label: string, pattern: RegExp }> = [
    { label: "Point Defense", pattern: /\bams\b|\bapds\b|anti-missile|point defense/ },
    { label: "Gauss", pattern: /gauss|\bhag\b/ },
    { label: "MML", pattern: /\bmml\b/ },
    { label: "ATM", pattern: /\bi?atm\b/ },
    { label: "MRM", pattern: /\bmrm\b/ },
    { label: "LRM", pattern: /\blr[mt]\b/ },
    { label: "SRM", pattern: /\bsr[mt]\b/ },
    { label: "Rocket Launchers", pattern: /rocket launcher/ },
    { label: "Thunderbolt", pattern: /thunderbolt/ },
    { label: "Narc", pattern: /narc/ },
    { label: "Mortars", pattern: /mortar/ },
    { label: "Artillery", pattern: /arrow iv|long tom|sniper|thumper/ },
    { label: "Lasers", pattern: /laser|\bcoil-/ },
    { label: "PPCs", pattern: /\bppc\b/ },
    { label: "Flamers", pattern: /flamer/ },
    { label: "Plasma", pattern: /plasma/ },
    { label: "Machine Guns", pattern: /machine gun|\b[hl]?mg\b/ },
    { label: "Rifles", pattern: /rifle|\brrc\b/ },
    { label: "Autocannons", pattern: /\bac\b|\bac\/|autocannon|\bhvac\b/ },
];

export const EQUIPMENT_SUBTYPE_OTHER = "Other";

// Categories whose items are grouped by weapon family. Melee and misc gear
// have no weapon family, so the picker shows them without a subtype filter.
const subtypedCategories = [
    "energy weapons",
    "ballistic weapons",
    "missile weapons",
    "artillery weapons",
    "ammunition",
    "custom equipment",
];

/**
 * Weapon family for the Step 5 subtype filter, or null when the item's
 * category is not grouped. Ammunition is grouped by the weapon named before
 * " - " in its name (e.g. "Enhanced LRM - Swarm Ammo (IS)" is LRM).
 */
export function getEquipmentSubtype(item: IEquipmentItem): string | null {
    if (!subtypedCategories.includes(item.category.trim().toLowerCase())) {
        return null;
    }
    let name = item.name.toLowerCase();
    if (item.category.trim().toLowerCase() === "ammunition" && name.includes(" - ")) {
        name = name.split(" - ")[0];
    }
    const rule = subtypeRules.find(candidate => candidate.pattern.test(name));
    return rule ? rule.label : EQUIPMENT_SUBTYPE_OTHER;
}

/** Distinct subtypes in rule order, with Other last. */
export function getEquipmentSubtypes(items: IEquipmentItem[]): string[] {
    const found = new Set(items.map(getEquipmentSubtype).filter((subtype): subtype is string => subtype !== null));
    return [
        ...subtypeRules.map(rule => rule.label).filter(label => found.has(label)),
        ...(found.has(EQUIPMENT_SUBTYPE_OTHER) ? [EQUIPMENT_SUBTYPE_OTHER] : []),
    ];
}
