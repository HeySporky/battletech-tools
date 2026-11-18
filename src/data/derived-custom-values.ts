import { IEquipmentItem } from "./data-interfaces";
import { applyLoreAndRules } from "./custom-lore-rules";
import { applyDerivedAlphaStrike } from "./derived-alpha-strike";
import { ammoBattleValueFromWeapon, ammoCostFromBattleValue, canonRecord, costFromBattleValue, COST_PER_BV, derivedNote, directFireBattleValue, extrapolate, reloadableBattleValue, reloadableCost,
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
    /** A reloadable launcher from its one-shot twin: a fifth of the Battle Value and half the cost mean the reloadable is 5 and 2 times them. */
    | { kind: "reloadable-twin"; oneShotTag: string }
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
    "custom-plasma-lance": { kind: "melee" },
    "custom-pilebunker-xenosama": { kind: "melee" },
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
    // The reloading rocket launchers, from the canon one-shot rocket launchers.
    ...Object.fromEntries([10, 15, 20].map((size) => [`custom-rrl-${size}`, { kind: "reloadable-twin", oneShotTag: `rocket-launcher-${size}` } as DerivationRule])),
    "ammo-custom-penitrator-standard": { kind: "no-battle-value", like: ["ammo-lrm-standard", "ammo-srm-standard"], why: "missile ammunition's Battle Value rides on the launcher, and the canon missile ammunition records read 0." },
    "ammo-rocket-launcher-standard": { kind: "no-battle-value", like: ["ammo-lrm-standard", "ammo-srm-standard"], why: "missile ammunition's Battle Value rides on the launcher, and the canon missile ammunition records read 0." },
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

/** A ruling by NGCFells on an item's era, applied over the record (NGCFells, 2026-11-16): tech base, dates, and a note saying who ruled and why. */
interface IEraRuling {
    techBase?: IEquipmentItem["techBase"];
    prototype?: number | null;
    introduced?: number | null;
    extinct?: number | null;
    reintroduced?: number | null;
    /** The day of NGCFells's ruling, if not 2026-11-16. */
    date?: string;
    /** Who settled it, if not a ruling by NGCFells (an era review that read the original article). */
    by?: string;
    note: string;
}

export const ERA_RULINGS: Record<string, IEraRuling> = {
    "custom-gatling-laser": {
        date: "2026-11-17", prototype: 3025, introduced: 3028, extinct: null,
        note: "Future Wars #8 (the 'New Technology' column, Karl Sanders) has it 'being tested in the field right now', a Charger refit the example, so NGCFells dates the prototype 3025; by Future Wars #12, whose cover is the Fourth Succession War, 'Mechs and VTOLs carry it, so it enters service in 3028 (NGCFells's year). Never extinct.",
    },
    "custom-power-booster-gatling-laser": {
        date: "2026-11-17", prototype: 3025, introduced: 3028, extinct: null,
        note: "it boosts the Gatling Laser and so follows its dates: prototype 3025, in service 3028 (NGCFells's year).",
    },
    ...Object.fromEntries([2, 5, 10, 20].map((size) => [`custom-pom-pom-ac-${size}`, {
        by: "era review of the original article", date: "2026-11-17", techBase: "is", introduced: 3025, extinct: null,
        note: "Future Wars #11 draws the Krupp Rapid Fire Auto Cannon only on a lost-plans super-assault design that was never built; the article itself (Future Wars #9 (1988) p.27, reprinted in the Best of Future Wars p.27) says House Marik 'has come up witha very good system that is quite relyiable' after long work, "
            + "fitted to Riflemen and an Atlas variant. So it is an Inner Sphere, House Marik field modification of the Succession Wars, in service at the 3025 baseline (NGCFells's year); never extinct.",
    } as IEraRuling])),
    ...Object.fromEntries(["custom-penitrator", "ammo-custom-penitrator-standard"].map((tag) => [tag, {
        by: "era review of the original article", date: "2026-11-17", techBase: "is", introduced: 3025, extinct: null,
        note: "Future Wars #3 (Nov 1987, p.5, under the old Mech War Times running head) has the Silveradoes of the 113th Regiment capture it on Glow, a moon of Harvest: 'only House Steiner has these weapons'; the 1991 reprint says the Federated Commonwealth. A Steiner, Inner Sphere weapon of the 3025 baseline; never extinct.",
    } as IEraRuling])),
    ...Object.fromEntries([2, 5, 10, 20].map((size) => [`ammo-ac-${size}-sabot`, {
        by: "era review of the original article", date: "2026-11-17", techBase: "is", introduced: 3025, extinct: null,
        note: "Future Wars #15 (C. Tomaszewski) presents it as a way to 'kick Goliath where it counts' against the super-assault 'Mechs of the 3025 setting; Future Wars #32 (Gargoyle Industries, p.17) says independent researchers developed it and Gargoyle licensed, produced and marketed it in the early Clan war. An Inner Sphere round, introduced 3025 (NGCFells's year), never extinct.",
    } as IEraRuling])),
    ...Object.fromEntries(["ppc", "large-laser", "medium-laser", "small-laser", "running", "jumping"].map((kind) => [`custom-power-booster-${kind}`, {
        by: "era review of the original article", date: "2026-11-17", introduced: 3025, extinct: null,
        note: "Future Wars #14 (1989, p.46, Karl Sander) prints it with the Hellborer and the Gatling Laser in the super-assault 'Mech series, and the Gatling Laser it also boosts is a 3025 prototype; so the booster is a Succession Wars item at the 3025 baseline (NGCFells's year), never extinct.",
    } as IEraRuling])),
    ...Object.fromEntries(["custom-lr-flamer", "ammo-custom-lr-flamer-standard"].map((tag) => [tag, {
        date: "2026-11-17", introduced: 1950, extinct: null,
        note: "the original (Future Wars #9 (1988) p.27) and the Best of Future Wars (p.28) print stats only: 15 shots a ton of fuel, 4/8/12 hexes. It is a pressurised vehicle flamer, simple old tech that is still with us, so it takes the vehicle flamer's dates: introduced 1950, never extinct.",
    } as IEraRuling])),
    "custom-smoker": {
        techBase: "universal", introduced: 1950, extinct: null,
        note: "very old, simple tech that has never gone out of style: a tank of oil and a nozzle, found in the 'Mech parks of the Inner Sphere and the Clans alike. Introduced 1950, never extinct (the vehicle flamer's dates).",
    },
    "custom-mech-periscope": {
        techBase: "is", introduced: 2900, extinct: null,
        note: "developed in the Succession Wars (NGCFells dates it 2900) for the Houses' water-world campaigns, where a 'Mech wading or half-submerged needs its sensors above the surface. An Inner Sphere item: the Clans took no part in those wars and do not field it.",
    },
    "custom-buckler-smoke-dispenser": {
        techBase: "universal", introduced: 2650, extinct: null,
        note: "designed by the SLDF about 2650 (NGCFells's year, the middle of the Star League) as a smoke screen for units that want to hide, so it is common in second-line and garrison units and on ArtVees (artillery vehicles), which the SLDF fielded and the Clans kept, "
            + "and in the Clans' second-line Solahma units rather than their front line. It left with the Exodus (2784) and stayed in the Inner Sphere; never extinct, though Future Wars #32 calls it 'an old idea that has been largely overlooked'. "
            + "Gargoyle Industries, an Inner Sphere firm selling in the early Clan war (the 3050s), markets it; the article gives no end to that production.",
    },
    "custom-fusion-lance": {
        techBase: "is", prototype: 3028, introduced: 3028, extinct: null,
        note: "a Succession Wars desperation weapon built in Tikograd on Tikonov III, a Capellan Confederation world, during the Battle of Tikonov (23 September to 18 October 3028, Operation RAT), "
            + "when the Federated Suns' Crucis Lancers under Charles Duncan besieged it and Pavel Ridzik commanded the defence. The world, the battle, the dates and the Houses are from Sarna; the workshop, the technician Natalya Orlova and the number built are NGCFells's. "
            + "Prototype and introduced 3028; never extinct, as the idea outlived the city.",
    },
    "custom-eii-pds": {
        prototype: 3028, introduced: null,
        note: "a prototype of the late Succession Wars, about 3028 (the year of Future Wars #36's campaign near Tikonov, where Ellena Industries is named). Ellena Industries, near Tikonov in Capellan space, is one of the few yards still able to build JumpShips; the PDS is its first move into 'Mech equipment. "
            + "One system is known and no production was announced, so it has a prototype date and no introduction date.",
    },
    "ammo-custom-eii-pds-standard": {
        prototype: 3028, introduced: null,
        note: "it follows the Point Defense System, a prototype of about 3028 with no production run.",
    },
};

/** Where a missing date or tech rating comes from: a canon neighbour's, a sibling record's in the same list, or a stated figure. */
type DatingSource = { like: string } | { local: string } | { value: number | string };
interface IDating { introduced?: DatingSource; prototype?: DatingSource; rating?: DatingSource; why: string }

const FANZINE_YEAR = { value: 3025 };
const FANZINE_WHY = "The Best of Future Wars (1991) prints no year or tech rating, and its setting is the Succession Wars, so the date is the catalog's 3025 baseline";

/** Dates and tech ratings the sources do not give, each from the canon neighbour named (NGCFells's, labelled in the notes). */
export const DATING_RULES: Record<string, IDating> = {
    "light-blazer": { introduced: { like: "medium-laser" }, rating: { like: "medium-laser" }, why: "BattleTech Gothic prints neither, and a blazer is a laser, so the canon medium laser's" },
    "custom-superheavy-ppc": { introduced: { like: "heavy-ppc" }, prototype: { like: "heavy-ppc" }, rating: { like: "heavy-ppc" }, why: "the post gives none, and it is the Heavy PPC enlarged, so the Heavy PPC's" },
    "custom-fusion-lance": { rating: { like: "heavy-ppc" }, why: "the post gives none, and an energy weapon of its heat rates as the canon Heavy PPC" },
    "custom-omni-laser": { rating: { like: "risc-hyper-laser" }, why: "the post gives none, and it is introduced in the 3150s, the age of the RISC Hyper Laser, so its rating" },
    "custom-disruptor": { rating: { like: "large-laser" }, why: "the catalog already gives it the Standard Large Laser's dates, so its rating" },
    "custom-plasma-lance": { rating: { like: "risc-hyper-laser" }, why: "the post gives none, and it is introduced in 3138, the age of the RISC Hyper Laser, so its rating" },
    "custom-pilebunker-xenosama": { rating: { like: "risc-hyper-laser" }, why: "the post gives none, and it is introduced in 3138, the age of the RISC Hyper Laser, so its rating" },
    "custom-pile-bunker": { rating: { like: "pile-driver" }, why: "the catalog already gives it the Heavy-Duty Pile Driver's dates, so its rating" },
    "ammo-custom-pile-bunker-standard": { rating: { like: "pile-driver" }, why: "it follows the Pile Bunker, which follows the Heavy-Duty Pile Driver" },
    "custom-null-signature-system": { rating: { like: "null-signature-system" }, why: "it is a fan version of the canon Null Signature System" },
    // The Best of Future Wars.
    "custom-gatling-laser": { introduced: FANZINE_YEAR, rating: { like: "medium-laser" }, why: `${FANZINE_WHY}; a laser rates as the canon medium laser` },
    "custom-power-booster-gatling-laser": { introduced: FANZINE_YEAR, rating: { like: "medium-laser" }, why: `${FANZINE_WHY}; it rates as the Gatling Laser it boosts` },
    "custom-lr-flamer": { rating: { like: "vehicle-flamer" }, why: "the article prints no rating, and it is a pressurised vehicle flamer, so the canon Vehicle Flamer's" },
    "ammo-custom-lr-flamer-standard": { rating: { like: "vehicle-flamer" }, why: "it follows the Long Range Flamer" },
    "custom-eii-pds": { rating: { like: "is-ams" }, why: "the article prints no rating, and it does the job of the canon Anti-Missile System, so its rating" },
    "ammo-custom-eii-pds-standard": { rating: { like: "is-ams" }, why: "the article prints no rating, and it follows the Point Defense System" },
    "custom-penitrator": { introduced: FANZINE_YEAR, rating: { like: "lrm-5" }, why: `${FANZINE_WHY}; a missile launcher rates as the canon LRM` },
    "ammo-custom-penitrator-standard": { introduced: FANZINE_YEAR, rating: { like: "lrm-5" }, why: `${FANZINE_WHY}; it follows the Penitrator` },
    "custom-power-booster-running": { introduced: FANZINE_YEAR, rating: { like: "masc" }, why: `${FANZINE_WHY}; a movement booster rates as the canon MASC` },
    "custom-power-booster-jumping": { introduced: FANZINE_YEAR, rating: { like: "masc" }, why: `${FANZINE_WHY}; a movement booster rates as the canon MASC` },
    ...Object.fromEntries(["ppc", "large-laser", "medium-laser", "small-laser"].map((weapon) => [`custom-power-booster-${weapon}`, { introduced: FANZINE_YEAR, why: FANZINE_WHY } as IDating])),
    ...Object.fromEntries([2, 5, 10, 20].map((size) => [`custom-pom-pom-ac-${size}`, { introduced: FANZINE_YEAR, why: FANZINE_WHY } as IDating])),
    ...Object.fromEntries([2, 5, 10, 20].map((size) => [`ammo-ac-${size}-sabot`, { introduced: FANZINE_YEAR, rating: { like: `ammo-ac-${size}-standard` }, why: `${FANZINE_WHY}; the round rates as the standard round it replaces` } as IDating])),
    "ammo-is-gauss-rifle-vhe": { rating: { like: "ammo-is-gauss-rifle-standard" }, why: "the article gives a date but no rating; the round rates as the standard Gauss round" },
    "ammo-is-gauss-rifle-inferno": { introduced: { local: "ammo-is-gauss-rifle-vhe" }, rating: { like: "ammo-is-gauss-rifle-standard" }, why: "the article gives the VHE shell a date and neither a date nor a rating for the Inferno shell, so the VHE's date and the standard Gauss round's rating" },
    // Kronos Battle Systems 15-class autocannon ammunition and the older caseless rounds.
    ...Object.fromEntries(["ammo-ac-15-standard", "ammo-lb-15x-standard", "ammo-lb-15x-cluster", "ammo-ultra-ac-15-standard"].map((tag) =>
        [tag, { rating: { value: "f" }, why: "the Class 15 autocannons it feeds are rated F" } as IDating])),
    ...Object.fromEntries([["is", 2], ["is", 5], ["clan", 2], ["clan", 5]].map(([base, size]) =>
        [`ammo-${base}-rotary-ac-${size}-caseless`, { rating: { like: `ammo-${base}-rotary-ac-${size}-standard` }, why: "caseless rounds rate as the standard round of the same autocannon" } as IDating])),
};

const sourceValue = (source: DatingSource, byTag: Map<string, IEquipmentItem>, field: "introduced" | "prototype" | "techRating"): number | string | undefined => {
    if ("value" in source) return source.value;
    const neighbour = "like" in source ? canonRecord(source.like) : byTag.get(source.local);
    if (!neighbour) throw new Error(`derived-custom-values: dating neighbour not found`);
    return neighbour[field] ?? undefined;
};

function applyDating(item: IEquipmentItem, dating: IDating, byTag: Map<string, IEquipmentItem>): boolean {
    const said: string[] = [];
    if ((item.introduced === null || item.introduced === undefined) && dating.introduced) {
        const year = sourceValue(dating.introduced, byTag, "introduced");
        if (typeof year === "number") { item.introduced = year; said.push(`introduced ${year}`); }
    }
    if ((item.prototype === null || item.prototype === undefined) && dating.prototype) {
        const year = sourceValue(dating.prototype, byTag, "prototype");
        if (typeof year === "number") { item.prototype = year; said.push(`prototype ${year}`); }
    }
    if ((!item.techRating || item.techRating === "x") && dating.rating) {
        const rating = sourceValue(dating.rating, byTag, "techRating");
        if (typeof rating === "string") { item.techRating = rating; said.push(`tech rating ${rating.toUpperCase()}`); }
    }
    if (!said.length) return false;
    item.notes = `${item.notes ? item.notes.replace(/\s+$/, "") + " " : ""}Not given by the source, so ours: ${said.join(", ")}, because ${dating.why}.`;
    return true;
}

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
        case "reloadable-twin": {
            const twin = canonRecord(rule.oneShotTag);
            const battleValue = reloadableBattleValue(twin.battleValue!), cbills = reloadableCost(twin.cbills!);
            return { battleValue, cbills, ammoBattleValue: ammoBattleValueFromWeapon(battleValue),
                text: `the canon ${twin.name} is one-shot (BV ${twin.battleValue}, ${n(twin.cbills!)} C-Bills); a one-shot launcher is a fifth of its reloadable twin in Battle Value and half in cost in the canon SRM, Streak SRM, SRT and LRM lines, so this launcher is Battle Value ${battleValue} and ${n(cbills)} C-Bills, and its ton of ammunition ${ammoBattleValueFromWeapon(battleValue)}, an eighth of the weapon's, riding on the launcher as a canon missile launcher's does (derived-values.ts). BV1 reads the same figure.` };
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
    const byTag = new Map(items.map((item) => [item.tag, item]));
    for (const item of items) {
        const ruling = ERA_RULINGS[item.tag];
        if (ruling) {
            if (ruling.techBase) item.techBase = ruling.techBase;
            for (const field of ["prototype", "introduced", "extinct", "reintroduced"] as const) {
                if (field in ruling) (item as unknown as Record<string, number | null | undefined>)[field] = ruling[field];
            }
            item.notes = `${item.notes ? item.notes.replace(/\s+$/, "") + " " : ""}Era (${ruling.by ?? "NGCFells's ruling"}, ${ruling.date ?? "2026-11-16"}):${ruling.note}`;
        }
        const dating = DATING_RULES[item.tag];
        if (dating) applyDating(item, dating, byTag);
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
    return applyDerivedAlphaStrike(applyLoreAndRules(items, true));
}
