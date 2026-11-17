import { IEquipmentItem } from "./data-interfaces";
import { ammoBattleValueFromWeapon, ammoCostFromBattleValue, canonRecord, costFromBattleValue, COST_PER_BV, derivedNote, directFireBattleValue, extrapolate,
    fusionLanceBattleValue, interpolate, meleeBattleValue, oneShotBattleValue } from "./derived-values";

/*
 * Fills the Battle Value and cost that a fan item's author did not give (Custom Homebrew, Apocryphal, Munchkin), by the methods in
 * derived-values.ts, and says so in the item's notes. Only a missing field (0) is filled; a figure the author gave is never changed.
 * Each custom catalog wraps its list in applyDerivedValues. BV1 (Master Rules) prints nothing for these items, so it reads the same
 * figure through the catalog fallback.
 */

export type DerivationRule =
    /** Damage over reach, cost at the energy median. */
    | { kind: "direct-fire" }
    /** A physical weapon: damage times the canon melee multiplier. */
    | { kind: "melee" }
    /** Missile launcher of `tubes`, from the canon line of its family, a fifth of that if one-shot. */
    | { kind: "launcher"; family: "srm" | "srt" | "streak-srm"; tubes: number; oneShot?: boolean }
    /** An autocannon between the canon size 10 and 20 of its family; its ammunition ton on the same line. */
    | { kind: "autocannon"; low: string; high: string; size: number }
    /** The same figures as a canon item doing the same job. */
    | { kind: "copy-of"; tag: string }
    /** The Fusion Lance at the smallest engine; the 'Mech's engine sizes it in play (variable-equipment.ts). */
    | { kind: "fusion-lance" }
    /** A ton of ammunition: BV an eighth of the weapon's (given here), cost by the canon median. */
    | { kind: "ammo-of-weapon"; weaponBattleValue: number }
    /** A ton of ammunition between the canon size 10 and 20 of a family, by their weapons' ammunition BV. */
    | { kind: "ammo-interpolated"; low: string; high: string; size: number }
    /** A weapon whose damage is rolled by range band: the average roll over each band's hexes (hexes 1 to the long range). */
    | { kind: "dice-bands"; bands: { hexes: number; average: number }[] }
    /** Battle Value 0 is the canon figure for this kind of item; each tag named has 0 in the catalog. */
    | { kind: "no-battle-value"; like: string[]; why: string };

const canonCost = (tag: string): number => canonRecord(tag).cbills!;
const canonBV = (tag: string): number => canonRecord(tag).battleValue!;
const n = (value: number): string => value.toLocaleString("en-US");

/** The weapon's damage for the direct-fire method: the field, or a cluster weapon's groups times their size. */
const damageOf = (item: IEquipmentItem) =>
    item.damage && (typeof item.damage !== "number" || item.damage > 0) ? item.damage : (item.damageClusters ?? 0) * (item.damagePerCluster ?? 0);

export const DERIVATION_RULES: Record<string, DerivationRule> = {
    // Energy weapons.
    "custom-omni-laser": { kind: "direct-fire" },
    "custom-disruptor": { kind: "direct-fire" },
    "custom-gatling-laser": { kind: "direct-fire" },
    "custom-lr-flamer": { kind: "direct-fire" },
    "custom-fusion-lance": { kind: "fusion-lance" },
    // Physical weapons.
    "custom-pile-bunker": { kind: "melee" },
    "ammo-custom-pile-bunker-standard": { kind: "ammo-of-weapon", weaponBattleValue: meleeBattleValue(15) },
    // Launchers of 8 and 10 tubes.
    ...Object.fromEntries(([["srm", "srm"], ["srt", "srt"], ["streak-srm", "streak-srm"], ["streak-srt", "streak-srm"]] as const).flatMap(([name, family]) =>
        [8, 10].flatMap((tubes) => [
            [`custom-${name}-${tubes}`, { kind: "launcher", family, tubes } as DerivationRule],
            [`custom-${name}-${tubes}-os`, { kind: "launcher", family, tubes, oneShot: true } as DerivationRule],
        ]))),
    // Autocannon of size 15.
    "custom-ac-15": { kind: "autocannon", low: "autocannon-standard-c", high: "autocannon-standard-d", size: 15 },
    "custom-lb-15x-ac": { kind: "autocannon", low: "autocannon-lbx-10", high: "autocannon-lbx-20", size: 15 },
    "custom-ultra-ac-15": { kind: "autocannon", low: "autocannon-ultra-c", high: "autocannon-ultra-d", size: 15 },
    "ammo-ac-15-standard": { kind: "ammo-interpolated", low: "autocannon-standard-c", high: "autocannon-standard-d", size: 15 },
    "ammo-lb-15x-standard": { kind: "ammo-interpolated", low: "autocannon-lbx-10", high: "autocannon-lbx-20", size: 15 },
    "ammo-lb-15x-cluster": { kind: "ammo-interpolated", low: "autocannon-lbx-10", high: "autocannon-lbx-20", size: 15 },
    "ammo-ultra-ac-15-standard": { kind: "ammo-interpolated", low: "autocannon-ultra-c", high: "autocannon-ultra-d", size: 15 },
    // Defensive systems and their ammunition.
    "custom-eii-pds": { kind: "copy-of", tag: "is-ams" },
    "ammo-custom-eii-pds-standard": { kind: "copy-of", tag: "ammo-is-ams-standard" },
    "custom-null-signature-system": { kind: "copy-of", tag: "null-signature-system" },
    // A launcher whose damage is rolled by range band.
    "custom-penitrator": { kind: "dice-bands", bands: [{ hexes: 7, average: 1.25 }, { hexes: 5, average: 4.5 }, { hexes: 12, average: 3.5 }, { hexes: 12, average: 2.5 }] },
    // Special ammunition: the canon special round carries its standard round's Battle Value (AC/2 Flak and AP: 5 and 5).
    ...Object.fromEntries(["heavy", "light"].flatMap((size) => ["ap", "incendiary", "tracer"].map((kind) =>
        [`ammo-${size}-machine-gun-${kind}`, { kind: "copy-of", tag: `ammo-is-${size}-machine-gun-standard` } as DerivationRule]))),
    ...Object.fromEntries(["ap", "incendiary", "tracer"].map((kind) => [`ammo-machine-gun-${kind}`, { kind: "copy-of", tag: "ammo-machine-gun-standard" } as DerivationRule])),
    ...Object.fromEntries([2, 5, 10, 20].map((size) => [`ammo-ac-${size}-sabot`, { kind: "copy-of", tag: `ammo-ac-${size}-standard` } as DerivationRule])),
    "ammo-is-gauss-rifle-vhe": { kind: "copy-of", tag: "ammo-is-gauss-rifle-standard" },
    "ammo-is-gauss-rifle-inferno": { kind: "copy-of", tag: "ammo-is-gauss-rifle-standard" },
    "ammo-custom-lr-flamer-standard": { kind: "copy-of", tag: "ammo-heavy-flamer-standard" },
    "ammo-is-heavy-rotary-rifle-standard": { kind: "ammo-of-weapon", weaponBattleValue: 105 },
    "ammo-medium-rotary-rifle-standard": { kind: "ammo-of-weapon", weaponBattleValue: 72 },
    "ammo-light-rotary-rifle-standard": { kind: "ammo-of-weapon", weaponBattleValue: 45 },
    // Battle Value 0 as the canon items of the kind carry it.
    "custom-small-laser-array": { kind: "no-battle-value", like: ["is-machine-gun-array"], why: "an array's damage is carried by the lasers linked to it." },
    "custom-medium-laser-array": { kind: "no-battle-value", like: ["is-machine-gun-array"], why: "an array's damage is carried by the lasers linked to it." },
    "custom-modular-c3": { kind: "no-battle-value", like: ["c3-computer-slave"], why: "a C3 computer adds no firepower of its own." },
    "custom-power-booster-running": { kind: "no-battle-value", like: ["masc"], why: "a movement booster adds no firepower; speed counts through the 'Mech's movement." },
    "custom-power-booster-jumping": { kind: "no-battle-value", like: ["masc"], why: "a movement booster adds no firepower; speed counts through the 'Mech's movement." },
    "custom-mech-periscope": { kind: "no-battle-value", like: ["masc", "c3-computer-slave"], why: "it is not a weapon." },
    "custom-mech-improved-magnetic-grapples": { kind: "no-battle-value", like: ["masc", "c3-computer-slave"], why: "it is not a weapon." },
    ...Object.fromEntries(["lrm", "srm", "mrm", "enhanced-lrm", "extended-lrm", "lrt", "srt", "enhanced-lrt"].map((family) =>
        [`ammo-is-${family}-emp`, { kind: "no-battle-value", like: ["ammo-lrm-standard", "ammo-srm-standard"], why: "missile ammunition's Battle Value rides on the launcher, and the canon missile ammunition records read 0." } as DerivationRule])),
};

interface IFigures { battleValue?: number; cbills?: number; ammoBattleValue?: number; defensive?: boolean; text: string }

function derive(rule: DerivationRule, item: IEquipmentItem): IFigures {
    switch (rule.kind) {
        case "direct-fire": {
            const battleValue = directFireBattleValue(damageOf(item), item.range);
            return { battleValue, cbills: costFromBattleValue(battleValue),
                text: `Battle Value ${battleValue} is its damage over the ${item.range.long} hexes it reaches (derived-values.ts); cost ${n(costFromBattleValue(battleValue))} C-Bills is that Battle Value at the canon energy median of ${n(COST_PER_BV)} C-Bills a point. BV1 reads the same figure.` };
        }
        case "melee": {
            const battleValue = meleeBattleValue(item.damage as number);
            return { battleValue, cbills: costFromBattleValue(battleValue),
                text: `Battle Value ${battleValue} is its ${item.damage} damage at the canon melee median of 1.275 a point (hatchet, sword, mace, lance and claw); cost ${n(costFromBattleValue(battleValue))} C-Bills is that Battle Value at the canon energy median of ${n(COST_PER_BV)} C-Bills a point. BV1 reads the same figure.` };
        }
        case "launcher": {
            const sizes = [4, 6].map((tubes) => [tubes, canonBV(`${rule.family}-${tubes}`)] as [number, number]);
            const reloadable = Math.round(extrapolate(sizes[0], sizes[1], rule.tubes));
            const battleValue = rule.oneShot ? oneShotBattleValue(reloadable) : reloadable;
            return { battleValue, text: `Battle Value ${battleValue} carries the canon ${rule.family === "srt" ? "SRT" : rule.family === "srm" ? "SRM" : "Streak SRM"} line (${sizes[0][1]} at 4 tubes, ${sizes[1][1]} at 6) on to ${rule.tubes} tubes${rule.oneShot ? ", a fifth of that for a one-shot launcher" : ""} (derived-values.ts). BV1 reads the same figure.` };
        }
        case "autocannon": {
            const low = canonRecord(rule.low), high = canonRecord(rule.high);
            const battleValue = Math.round(interpolate([10, low.battleValue!], [20, high.battleValue!], rule.size));
            const cbills = Math.round(interpolate([10, low.cbills!], [20, high.cbills!], rule.size));
            return { battleValue, cbills, ammoBattleValue: Math.round(interpolate([10, low.ammoBattleValue!], [20, high.ammoBattleValue!], rule.size)),
                text: `Battle Value ${battleValue} and cost ${n(cbills)} C-Bills lie midway between the canon size 10 (${low.battleValue}, ${n(low.cbills!)}) and size 20 (${high.battleValue}, ${n(high.cbills!)}) of its family (derived-values.ts). BV1 reads the same figure.` };
        }
        case "copy-of": {
            const neighbour = canonRecord(rule.tag);
            return { battleValue: neighbour.battleValue, cbills: neighbour.cbills, defensive: neighbour.battleValueDefensive,
                text: `Battle Value ${neighbour.battleValue}${item.cbills ? "" : ` and cost ${n(neighbour.cbills!)} C-Bills`} ${item.cbills ? "is" : "are"} those of the canon ${neighbour.name}, which does the same job (derived-values.ts). BV1 reads the same figure.` };
        }
        case "fusion-lance": {
            const battleValue = fusionLanceBattleValue(100);
            return { battleValue, cbills: costFromBattleValue(battleValue),
                text: `Battle Value and cost follow the 'Mech's engine (variable-equipment.ts, "fusion-lance"): Battle Value is its damage over the 3 hexes it reaches (an engine rated 250: 25 + 20 + 15 = 60), cost that Battle Value at the canon energy median of ${n(COST_PER_BV)} C-Bills a point. The figures on this record are for an engine rated 100 or less (15 + 10 + 5 = ${battleValue}, ${n(costFromBattleValue(battleValue))} C-Bills). BV1 reads the same figure.` };
        }
        case "ammo-of-weapon": {
            const battleValue = ammoBattleValueFromWeapon(rule.weaponBattleValue);
            return { battleValue, cbills: ammoCostFromBattleValue(battleValue),
                text: `Battle Value ${battleValue} a ton is an eighth of its weapon's ${rule.weaponBattleValue} (the canon ammunition ratio, .122 to .135)${item.cbills ? "" : `; cost ${n(ammoCostFromBattleValue(battleValue))} C-Bills a ton is that at the canon median of 450 C-Bills a point`} (derived-values.ts).` };
        }
        case "dice-bands": {
            const battleValue = Math.round(rule.bands.reduce((sum, band) => sum + band.hexes * band.average, 0));
            return { battleValue, cbills: costFromBattleValue(battleValue), ammoBattleValue: ammoBattleValueFromWeapon(battleValue),
                text: `Battle Value ${battleValue} is the average of its dice over the ${item.range.long} hexes it reaches (${rule.bands.map((band) => `${band.hexes} hexes at ${band.average}`).join(", ")}); it ignores the critical-hit check and the structure damage. Cost ${n(costFromBattleValue(battleValue))} C-Bills is that Battle Value at the canon energy median of ${n(COST_PER_BV)} C-Bills a point; the ammunition ton's Battle Value, ${ammoBattleValueFromWeapon(battleValue)}, an eighth of it, rides on the launcher as a canon missile launcher's does (derived-values.ts). BV1 reads the same figure.` };
        }
        case "no-battle-value":
            return { text: `Battle Value 0 is deliberate, not missing: ${rule.why} The canon ${rule.like.map((tag) => canonRecord(tag).name).join(" and ")} ${rule.like.length > 1 ? "carry" : "carries"} none either.` };
        case "ammo-interpolated": {
            const low = canonRecord(rule.low), high = canonRecord(rule.high);
            const battleValue = Math.round(interpolate([10, low.ammoBattleValue!], [20, high.ammoBattleValue!], rule.size));
            return { battleValue, text: `Battle Value ${battleValue} a ton lies midway between the canon size 10 (${low.ammoBattleValue}) and size 20 (${high.ammoBattleValue}) rounds of its family (derived-values.ts).` };
        }
    }
}

/** Fills the missing Battle Value and cost of the listed items and notes how; returns the same list. */
export function applyDerivedValues(items: IEquipmentItem[]): IEquipmentItem[] {
    for (const item of items) {
        const rule = DERIVATION_RULES[item.tag];
        if (!rule) continue;
        const figures = derive(rule, item);
        const fills: string[] = [];
        if (!item.battleValue && figures.battleValue !== undefined) { item.battleValue = figures.battleValue; fills.push("battleValue"); }
        if (!item.cbills && figures.cbills !== undefined) { item.cbills = figures.cbills; fills.push("cbills"); }
        if (item.ammoBattleValue === undefined && figures.ammoBattleValue !== undefined) item.ammoBattleValue = figures.ammoBattleValue;
        if (figures.defensive && item.battleValueDefensive === undefined) item.battleValueDefensive = true;
        if (rule.kind === "no-battle-value" && !item.notes?.includes("Battle Value 0 is deliberate")) fills.push("note");
        if (fills.length) item.notes = `${item.notes ? item.notes.replace(/\s+$/, "") + " " : ""}${rule.kind === "no-battle-value" ? figures.text : derivedNote(figures.text)}`;
    }
    return items;
}
