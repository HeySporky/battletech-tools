import type { CatalogTechBase, ICatalogStanding } from "./data-interfaces";
// Conventional infantry armor: the Conventional Infantry Armor Table (Tactical Operations: Advanced Units &
// Equipment pp.129-130) and the Infantry Stealth Modifiers Table (p.130). Advanced rules. One record per table
// row, except Sneak Suits: the table prices them by the number of stealth systems (one, two or three), and each
// combination of Camo, IR and ECM is a record here so that its modifiers can be worked out.

/*
* DISCLAIMER: This file processes gameplay data derived from the BattleTech universe.
* All lore, stats, and intellectual property belong strictly to Catalyst Game Labs,
* Topps, and their respective rights holders.
*
* This open-source utility is a non-commercial fan project designed purely for
* tabletop gameplay assistance. Content processed by this file is not intended
* to challenge any copyright or trademark status, and this data is explicitly
* excluded from the software's underlying license (GNU GPLv3).
*/

export type InfantryArmorGroup = "general" | "faction" | "sneak";
export type InfantryStealthSystem = "dest" | "camo" | "ir" | "ecm";

export const INFANTRY_ARMOR_GROUPS: { tag: InfantryArmorGroup; name: string }[] = [
    { tag: "general", name: "Infantry Armor" },
    { tag: "faction", name: "Faction Armor Kits" },
    { tag: "sneak", name: "Sneak Suits" },
];

export interface IInfantryArmor extends ICatalogStanding {
    tag: string;
    name: string;
    /** Other spellings, e.g. MegaMek's names for the faction kits. */
    altNames?: string[];
    group: InfantryArmorGroup;
    /** Damage the platoon receives is divided by this, fractions rounded up (TO:AUE p.129). */
    damageDivisor: number;
    /** The table's "E": -1 MP, and no Anti-'Mech Leg or Swarm attacks (TO:AUE p.130). */
    encumbering: boolean;
    /** The table's "**": the troopers may operate in vacuum. */
    vacuum: boolean;
    stealth: InfantryStealthSystem[];
    techBase: CatalogTechBase;
    techRating: string;
    availability: string;
    /** Year, or "PS" (Pre-Spaceflight) or "ES" (Early Spaceflight). */
    introduced: number | "PS" | "ES";
    /** C-bills for each trooper. */
    cost: number;
    /** Page of TO:AUE. */
    page: number;
}

/** Rules level of infantry armor: Advanced. */
export const INFANTRY_ARMOR_RULES_LEVEL = 3;

// Infantry Stealth Modifiers Table (TO:AUE p.130) and the Defensive Factors Modifier Table addendum (p.191).
export const INFANTRY_STEALTH_SYSTEMS: Record<InfantryStealthSystem, { name: string; camoToHit: string; irToHit: string; ecm: string; defensiveFactor: number }> = {
    dest: { name: "DEST Infiltration Suit", camoToHit: "+1/0/0/0/0", irToHit: "+1/+1/+2", ecm: "None", defensiveFactor: 0.2 },
    camo: { name: "Sneak, Camo", camoToHit: "+3/+2/+1/0/0", irToHit: "0/0/0", ecm: "None", defensiveFactor: 0.2 },
    ir: { name: "Sneak, IR", camoToHit: "0/0/0/0/0", irToHit: "+1/+1/+2", ecm: "None", defensiveFactor: 0.2 },
    ecm: { name: "Sneak, ECM", camoToHit: "0/0/0/0/0", irToHit: "0/0/0", ecm: "Invisible to Standard/Light Active Probes", defensiveFactor: 0.1 },
};

export const infantryArmor: IInfantryArmor[] = [
    { tag: "inf-armor-ablative-standard", editions: ["total-warfare"], name: "Ablative, Standard", group: "general", damageDivisor: 1, encumbering: true, vacuum: false, stealth: [], techBase: "universal", techRating: "D", availability: "A-B-A", introduced: 2300, cost: 1000, page: 129 },
    { tag: "inf-armor-ablative-concealed", editions: ["total-warfare"], name: "Ablative, Concealed", group: "general", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "is", techRating: "E", availability: "E-D-B", introduced: 2400, cost: 1500, page: 129 },
    { tag: "inf-armor-ablative-flak-standard", editions: ["total-warfare"], name: "Ablative/Flak, Standard", group: "general", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "universal", techRating: "D", availability: "B-C-B", introduced: 2305, cost: 800, page: 129 },
    { tag: "inf-armor-ablative-flak-concealed", editions: ["total-warfare"], name: "Ablative/Flak, Concealed", group: "general", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "is", techRating: "E", availability: "F-D-C", introduced: 2400, cost: 1400, page: 129 },
    { tag: "inf-armor-ballistic-plate-standard", editions: ["total-warfare"], name: "Ballistic Plate, Standard", group: "general", damageDivisor: 2, encumbering: true, vacuum: false, stealth: [], techBase: "universal", techRating: "D", availability: "C-C-C", introduced: 2310, cost: 1600, page: 129 },
    { tag: "inf-armor-ballistic-plate-concealed", editions: ["total-warfare"], name: "Ballistic Plate, Concealed", group: "general", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "is", techRating: "E", availability: "X-F-D", introduced: 2820, cost: 2880, page: 129 },
    { tag: "inf-armor-clothing-fatigues-civilian-non-armored", editions: ["total-warfare"], name: "Clothing, Fatigues/Civilian/Non-Armored", group: "general", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "universal", techRating: "A", availability: "A-A-A", introduced: "PS", cost: 25, page: 129 },
    { tag: "inf-armor-clothing-leather-synthetic-hide", editions: ["total-warfare"], name: "Clothing, Leather/Synthetic Hide", group: "general", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "universal", techRating: "A", availability: "A-A-A", introduced: "PS", cost: 100, page: 129 },
    { tag: "inf-armor-clothing-light-e-g-summer-wear-none", editions: ["total-warfare"], name: "Clothing, Light (e.g. Summer Wear/None)", group: "general", damageDivisor: 0.5, encumbering: false, vacuum: false, stealth: [], techBase: "universal", techRating: "A", availability: "A-A-A", introduced: "PS", cost: 15, page: 129 },
    { tag: "inf-armor-engineering-suit", editions: ["total-warfare"], name: "Engineering Suit", group: "general", damageDivisor: 1, encumbering: true, vacuum: true, stealth: [], techBase: "universal", techRating: "D", availability: "D-D-D", introduced: 2350, cost: 7500, page: 129 },
    { tag: "inf-armor-environment-suit-light", editions: ["total-warfare"], name: "Environment Suit, Light", group: "general", damageDivisor: 1, encumbering: true, vacuum: false, stealth: [], techBase: "universal", techRating: "C", availability: "B-B-B", introduced: 2200, cost: 200, page: 129 },
    { tag: "inf-armor-environment-suit-hostile", editions: ["total-warfare"], name: "Environment Suit, Hostile", group: "general", damageDivisor: 2, encumbering: true, vacuum: true, stealth: [], techBase: "universal", techRating: "D", availability: "C-C-C", introduced: 2300, cost: 10000, page: 129 },
    { tag: "inf-armor-environment-suit-marine", editions: ["total-warfare"], name: "Environment Suit, Marine", group: "general", damageDivisor: 2, encumbering: false, vacuum: true, stealth: [], techBase: "universal", techRating: "D", availability: "E-E-D", introduced: 2325, cost: 15000, page: 129 },
    { tag: "inf-armor-flak-standard", editions: ["total-warfare"], name: "Flak, Standard", group: "general", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "universal", techRating: "C", availability: "A-A-A", introduced: 2200, cost: 150, page: 129 },
    { tag: "inf-armor-flak-concealed", editions: ["total-warfare"], name: "Flak, Concealed", group: "general", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "is", techRating: "D", availability: "D-C-B", introduced: 2230, cost: 225, page: 129 },
    { tag: "inf-armor-heatsuit", editions: ["total-warfare"], name: "Heatsuit", group: "general", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "universal", techRating: "D", availability: "C-C-C", introduced: 2355, cost: 100, page: 129 },
    { tag: "inf-armor-mechwarrior-combat-suit", editions: ["total-warfare"], name: "MechWarrior Combat Suit", group: "general", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "universal", techRating: "E", availability: "D-F-E", introduced: 2790, cost: 20000, page: 129 },
    { tag: "inf-armor-mechwarrior-cooling-suit", editions: ["total-warfare"], name: "MechWarrior Cooling Suit", group: "general", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "universal", techRating: "E", availability: "D-F-E", introduced: 2500, cost: 5000, page: 129 },
    { tag: "inf-armor-mechwarrior-cooling-vest-only", editions: ["total-warfare"], name: "MechWarrior Cooling Vest (Only)", group: "general", damageDivisor: 0.5, encumbering: false, vacuum: false, stealth: [], techBase: "universal", techRating: "D", availability: "C-C-C", introduced: 2460, cost: 200, page: 129 },
    { tag: "inf-armor-myomer-suit", editions: ["total-warfare"], name: "Myomer, Suit", group: "general", damageDivisor: 2, encumbering: true, vacuum: false, stealth: [], techBase: "is", techRating: "E", availability: "X-X-E", introduced: 3047, cost: 5800, page: 129 },
    { tag: "inf-armor-myomer-vest", editions: ["total-warfare"], name: "Myomer, Vest", group: "general", damageDivisor: 2, encumbering: false, vacuum: false, stealth: [], techBase: "is", techRating: "E", availability: "X-X-E", introduced: 3045, cost: 1800, page: 130 },
    { tag: "inf-armor-parka", editions: ["total-warfare"], name: "Parka", group: "general", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "universal", techRating: "C", availability: "A-A-A", introduced: "PS", cost: 50, page: 130 },
    { tag: "inf-armor-neo-chainmail", editions: ["total-warfare"], name: "Neo-Chainmail", group: "general", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "is", techRating: "D", availability: "X-X-C", introduced: 3065, cost: 920, page: 130 },
    { tag: "inf-armor-snowsuit", editions: ["total-warfare"], name: "Snowsuit", group: "general", damageDivisor: 1, encumbering: true, vacuum: false, stealth: [], techBase: "universal", techRating: "C", availability: "A-A-A", introduced: "PS", cost: 70, page: 130 },
    { tag: "inf-armor-spacesuit", editions: ["total-warfare"], name: "Spacesuit", group: "general", damageDivisor: 1, encumbering: true, vacuum: true, stealth: [], techBase: "universal", techRating: "C", availability: "B-B-B", introduced: "ES", cost: 5000, page: 130 },
    { tag: "inf-armor-spacesuit-combat", editions: ["total-warfare"], name: "Spacesuit, Combat", group: "general", damageDivisor: 1, encumbering: true, vacuum: true, stealth: [], techBase: "universal", techRating: "C", availability: "D-D-D", introduced: 2200, cost: 7000, page: 130 },
    { tag: "inf-armor-capellan-confederation", altNames: ["Capellan Confederation Armor Kit (3050)"], editions: ["total-warfare"], name: "Capellan Confederation", group: "faction", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "is", techRating: "C", availability: "X-X-C", introduced: 3050, cost: 450, page: 130 },
    { tag: "inf-armor-clan-all", altNames: ["Clan Armor Kit (All)"], editions: ["total-warfare"], name: "Clan (All)", group: "faction", damageDivisor: 2, encumbering: false, vacuum: false, stealth: [], techBase: "clan", techRating: "E", availability: "X-E-E", introduced: 2900, cost: 5560, page: 130 },
    { tag: "inf-armor-comstar", altNames: ["ComStar Infantry Kit"], editions: ["total-warfare"], name: "ComStar", group: "faction", damageDivisor: 2, encumbering: false, vacuum: false, stealth: [], techBase: "is", techRating: "F", availability: "X-F-D", introduced: 2830, cost: 4280, page: 130 },
    { tag: "inf-armor-draconis-combine", altNames: ["Draconis Combine Infantry Kit"], editions: ["total-warfare"], name: "Draconis Combine", group: "faction", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "is", techRating: "C", availability: "B-B-B", introduced: 2625, cost: 360, page: 130 },
    { tag: "inf-armor-federated-suns", altNames: ["Federated Suns Infantry Kit"], editions: ["total-warfare"], name: "Federated Suns", group: "faction", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "is", techRating: "C", availability: "B-B-B", introduced: 2330, cost: 750, page: 130 },
    { tag: "inf-armor-federated-suns-commonwealth-3030-plus", altNames: ["Fed Suns/Fed Commonwealth Infantry Kit (3030-3066)"], editions: ["total-warfare"], name: "Federated Suns/Commonwealth (3030+)", group: "faction", damageDivisor: 2, encumbering: false, vacuum: false, stealth: [], techBase: "is", techRating: "C", availability: "X-D-B", introduced: 3030, cost: 1040, page: 130 },
    { tag: "inf-armor-federated-suns-3067-plus", altNames: ["Fed Suns Infantry Kit (3067+)"], editions: ["total-warfare"], name: "Federated Suns (3067+)", group: "faction", damageDivisor: 2, encumbering: true, vacuum: false, stealth: [], techBase: "is", techRating: "D", availability: "X-X-D", introduced: 3067, cost: 2080, page: 130 },
    { tag: "inf-armor-free-rasalhague-republic", altNames: ["Free Rasalhague Republic Infantry Kit"], editions: ["total-warfare"], name: "Free Rasalhague Republic", group: "faction", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "is", techRating: "C", availability: "X-X-B", introduced: 3040, cost: 360, page: 130 },
    { tag: "inf-armor-free-worlds-league", altNames: ["Free Worlds League Infantry Kit"], editions: ["total-warfare"], name: "Free Worlds League", group: "faction", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "is", techRating: "C", availability: "B-B-B", introduced: 2290, cost: 950, page: 130 },
    { tag: "inf-armor-free-worlds-league-3035-plus", altNames: ["Free Worlds League Infantry Kit (3035+)"], editions: ["total-warfare"], name: "Free Worlds League (3035+)", group: "faction", damageDivisor: 2, encumbering: true, vacuum: false, stealth: [], techBase: "is", techRating: "C", availability: "X-E-B", introduced: 3035, cost: 1830, page: 130 },
    { tag: "inf-armor-lyran-alliance-commonwealth", altNames: ["Lyran Commonwealth Infantry Kit"], editions: ["total-warfare"], name: "Lyran Alliance/Commonwealth", group: "faction", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "is", techRating: "C", availability: "B-B-B", introduced: 2425, cost: 650, page: 130 },
    { tag: "inf-armor-lyran-alliance-3060-plus", altNames: ["Lyran Alliance/Lyran Commonwealth (3060+) Infantry Kit"], editions: ["total-warfare"], name: "Lyran Alliance (3060+)", group: "faction", damageDivisor: 2, encumbering: false, vacuum: false, stealth: [], techBase: "is", techRating: "C", availability: "X-X-B", introduced: 3060, cost: 730, page: 130 },
    { tag: "inf-armor-magistracy-of-canopus", altNames: ["Magistracy of Canopus Infantry Kit"], editions: ["total-warfare"], name: "Magistracy of Canopus", group: "faction", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "is", techRating: "C", availability: "B-B-B", introduced: 2610, cost: 400, page: 130 },
    { tag: "inf-armor-marian-hegemony", altNames: ["Marian Hegemony Infantry Kit"], editions: ["total-warfare"], name: "Marian Hegemony", group: "faction", damageDivisor: 2, encumbering: false, vacuum: false, stealth: [], techBase: "is", techRating: "C", availability: "X-F-B", introduced: 3049, cost: 1580, page: 130 },
    { tag: "inf-armor-taurian-concordat-calderon", altNames: ["Taurian Concordat/Calderon Infantry Kit"], editions: ["total-warfare"], name: "Taurian Concordat/Calderon", group: "faction", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "is", techRating: "C", availability: "X-X-B", introduced: 3047, cost: 370, page: 130 },
    { tag: "inf-armor-word-of-blake", altNames: ["Word of Blake Infantry Kit"], editions: ["total-warfare"], name: "Word of Blake", group: "faction", damageDivisor: 2, encumbering: false, vacuum: false, stealth: [], techBase: "is", techRating: "F", availability: "X-X-D", introduced: 3055, cost: 4300, page: 130 },
    { tag: "inf-armor-other-periphery-generic", altNames: ["Generic Infantry Kit"], editions: ["total-warfare"], name: "Other Periphery/Generic", group: "faction", damageDivisor: 1, encumbering: false, vacuum: false, stealth: [], techBase: "universal", techRating: "C", availability: "B-B-B", introduced: "ES", cost: 330, page: 130 },
    { tag: "inf-armor-dest-infiltration-suit", editions: ["total-warfare"], name: "DEST Infiltration Suit", group: "sneak", damageDivisor: 1, encumbering: false, vacuum: false, stealth: ["dest"], techBase: "is", techRating: "D", availability: "X-E-E", introduced: 2840, cost: 50000, page: 130 },
    { tag: "inf-armor-sneak-suit-camo", editions: ["master-rules", "master-rules-revised", "total-warfare"], introducedInEdition: "master-rules", editionLevels: { "master-rules": 3, "master-rules-revised": 3 }, editionStats: { "master-rules": { book: "MaxTech", page: 38, name: "Camo Suit", notes: "Maximum Tech, Level 3, Infantry Equipment (p.38): an advanced camouflage sneak suit lets the platoon hide in any terrain, Paved and Clear hexes included (see Hidden Units, p.72, BMR); it doubles the infantry unit's C-bill cost. Priced as a multiple of the whole unit, not per trooper." }, "master-rules-revised": { book: "MaxTech", page: 38, name: "Camo Suit", notes: "Maximum Tech, Level 3, Infantry Equipment (p.38): an advanced camouflage sneak suit lets the platoon hide in any terrain, Paved and Clear hexes included (see Hidden Units, p.72, BMR); it doubles the infantry unit's C-bill cost. Priced as a multiple of the whole unit, not per trooper." } }, name: "Sneak Suit (Camo)", group: "sneak", damageDivisor: 1, encumbering: false, vacuum: false, stealth: ["camo"], techBase: "universal", techRating: "D", availability: "C-C-C", introduced: 2450, cost: 7000, page: 130 },
    { tag: "inf-armor-sneak-suit-ir", editions: ["total-warfare"], name: "Sneak Suit (IR)", group: "sneak", damageDivisor: 1, encumbering: false, vacuum: false, stealth: ["ir"], techBase: "universal", techRating: "D", availability: "C-C-C", introduced: 2450, cost: 7000, page: 130 },
    { tag: "inf-armor-sneak-suit-ecm", editions: ["master-rules", "master-rules-revised", "total-warfare"], introducedInEdition: "master-rules", editionLevels: { "master-rules": 3, "master-rules-revised": 3 }, editionStats: { "master-rules": { book: "MaxTech", page: 38, name: "ECM Suit", notes: "Maximum Tech, Level 3, Infantry Equipment (p.38): extra concealment: a hidden unit in ECM suits cannot be detected by any means, not even a Bloodhound active probe (p.38; p.72 says a Bloodhound cannot spot ECM-equipped infantry); it doubles the infantry unit's C-bill cost. Priced as a multiple of the whole unit, not per trooper." }, "master-rules-revised": { book: "MaxTech", page: 38, name: "ECM Suit", notes: "Maximum Tech, Level 3, Infantry Equipment (p.38): extra concealment: a hidden unit in ECM suits cannot be detected by any means, not even a Bloodhound active probe (p.38; p.72 says a Bloodhound cannot spot ECM-equipped infantry); it doubles the infantry unit's C-bill cost. Priced as a multiple of the whole unit, not per trooper." } }, name: "Sneak Suit (ECM)", group: "sneak", damageDivisor: 1, encumbering: false, vacuum: false, stealth: ["ecm"], techBase: "universal", techRating: "D", availability: "C-C-C", introduced: 2450, cost: 7000, page: 130 },
    { tag: "inf-armor-sneak-suit-camo-ir", editions: ["total-warfare"], name: "Sneak Suit (Camo, IR)", group: "sneak", damageDivisor: 1, encumbering: false, vacuum: false, stealth: ["camo", "ir"], techBase: "universal", techRating: "D", availability: "D-D-D", introduced: 2460, cost: 21000, page: 130 },
    { tag: "inf-armor-sneak-suit-camo-ecm", editions: ["master-rules", "master-rules-revised", "total-warfare"], introducedInEdition: "master-rules", editionLevels: { "master-rules": 3, "master-rules-revised": 3 }, editionStats: { "master-rules": { book: "MaxTech", page: 38, name: "Camo and ECM Suits", notes: "Maximum Tech, Level 3, Infantry Equipment (p.38): both suits at once: the effects of both, at quadruple the infantry unit's C-bill cost. Priced as a multiple of the whole unit, not per trooper." }, "master-rules-revised": { book: "MaxTech", page: 38, name: "Camo and ECM Suits", notes: "Maximum Tech, Level 3, Infantry Equipment (p.38): both suits at once: the effects of both, at quadruple the infantry unit's C-bill cost. Priced as a multiple of the whole unit, not per trooper." } }, name: "Sneak Suit (Camo, ECM)", group: "sneak", damageDivisor: 1, encumbering: false, vacuum: false, stealth: ["camo", "ecm"], techBase: "universal", techRating: "D", availability: "D-D-D", introduced: 2460, cost: 21000, page: 130 },
    { tag: "inf-armor-sneak-suit-ir-ecm", editions: ["total-warfare"], name: "Sneak Suit (IR, ECM)", group: "sneak", damageDivisor: 1, encumbering: false, vacuum: false, stealth: ["ir", "ecm"], techBase: "universal", techRating: "D", availability: "D-D-D", introduced: 2460, cost: 21000, page: 130 },
    { tag: "inf-armor-sneak-suit-camo-ir-ecm", editions: ["total-warfare"], name: "Sneak Suit (Camo, IR, ECM)", group: "sneak", damageDivisor: 1, encumbering: false, vacuum: false, stealth: ["camo", "ir", "ecm"], techBase: "universal", techRating: "D", availability: "D-E-E", introduced: 2475, cost: 28000, page: 130 },
];

export const findInfantryArmor = (tag: string): IInfantryArmor | null =>
    infantryArmor.find((armor) => armor.tag === tag) ?? null;

/** The armor a MegaMek file names, by our name or an altName, case and punctuation aside. */
export const findInfantryArmorByName = (name: string): IInfantryArmor | null => {
    const key = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]/g, "");
    const wanted = key(name);
    return wanted ? infantryArmor.find((armor) => [armor.name, ...(armor.altNames ?? [])].some((item) => key(item) === wanted)) ?? null : null;
};

// ---------------------------------------------------------------------------------------------------------------------
// Cybernetic and prosthetic augmentation for conventional infantry (Interstellar Operations: Alternate Eras pp.70-79; the
// tech and availability table is p.52, the cost table p.217, the rules levels p.216, Battle Value pp.184-185 and 191,
// Alpha Strike pp.194-195). Only the implants the book gives conventional infantry (unit type CI) rules for are here; the
// vehicular neural interfaces (VDNI, buffered VDNI, prototype DNI) and the Clan EI implant are for other unit types.
// ---------------------------------------------------------------------------------------------------------------------

/** Who must carry the implant for the platoon to have it: every trooper, a fourth of them (rounded up), or the commander alone. */
export type InfantryAugmentationScope = "all" | "quarter" | "commander";
export type InfantryAugmentationGroup = "implant" | "prosthetic";

export interface IInfantryAugmentation extends ICatalogStanding {
    tag: string;
    /** The tag MegaMek writes in a file's augmentation list. */
    megamekKey: string;
    name: string;
    group: InfantryAugmentationGroup;
    scope: InfantryAugmentationScope;
    /** C-bills for each trooper that carries it (p.217); `costUnit` says where that is not each trooper. */
    cost: number;
    /** What the cost is for, when it is not each trooper. */
    costUnit?: string;
    techBase: CatalogTechBase;
    techRating: string;
    /** As printed on p.52 (four ratings). */
    availability: string;
    /** Prototype year, or "ES" (Early Spaceflight) or "PS" (Pre-Spaceflight). */
    introduced: number | "PS" | "ES";
    /** The Notes column of p.52, when the implant is extinct. */
    extinct?: number;
    /** Formation tags (INFANTRY_FORMATIONS) of the factions that field it; empty for "Any". A platoon of another faction pays double. */
    factions: string[];
    factionNames: string;
    /** Advanced (3) or Experimental (4), the Rules Level column of p.216. */
    rulesLevel: number;
    /** Printed page of IO:AE where the implant is described. */
    page: number;
    /** What it does for a conventional infantry platoon, in brief (the book's rules, not its text). */
    rules: string;
}

// The formation tags the factions of the tech table map to: Word of Blake, Capellan Confederation, and the Magistracy of
// Canopus (which the Periphery (Major) formation includes). The Terran Hegemony has no formation of its own here.
const AUG_WB = "comstar-word-of-blake";
const AUG_CC = "capellan-confederation";
const AUG_MC = "periphery-major";

const augmentation = (tag: string, megamekKey: string, name: string, group: InfantryAugmentationGroup, scope: InfantryAugmentationScope, cost: number, techBase: CatalogTechBase, techRating: string, availability: string,
    introduced: number | "PS" | "ES", factionNames: string, factions: string[], rulesLevel: number, page: number, rules: string, extra: Partial<IInfantryAugmentation> = {}): IInfantryAugmentation =>
    ({ tag, editions: ["total-warfare"], megamekKey, name, group, scope, cost, techBase, techRating, availability, introduced, factions, factionNames, rulesLevel, page, book: "IO:AE", rules, ...extra });

/** Advanced rules for the pain shunt (the Rules Level column, IO:AE p.216); every other implant is Experimental. */
export const INFANTRY_AUGMENTATION_RULES_LEVEL = 3;

export const infantryAugmentations: IInfantryAugmentation[] = [
    augmentation("aug-pain-shunt", "artificial_pain_shunt", "Artificial Pain Shunt", "implant", "all", 500000, "universal", "C", "X-X-F-F", "ES", "Any", [], 3, 71,
        "Damage from flame-based weapons is halved; Morale Checks take -4 and Forced Withdrawal is ignored."),
    augmentation("aug-comm", "comm_implant", "Cybernetic Communications Implants", "implant", "quarter", 8000, "universal", "E", "E-F-D-E", 2600, "Any (Terran Hegemony)", [], 4, 72,
        "A fourth of the troopers (rounded up) carry one: -1 to the platoon's Morale Checks, to indirect LRM attacks it spots for, and to avoiding mines."),
    augmentation("aug-boosted-comm", "boost_comm_implant", "Cybernetic Boosted Communications Implants", "implant", "quarter", 8000, "is", "E", "X-X-C-D", 3060, "Word of Blake", [AUG_WB], 4, 72,
        "A fourth of the troopers (rounded up): the communications implant effects, and the platoon links into a friendly C3i network that is not full, with no C3i computer of its own."),
    augmentation("aug-sensory-audio", "cyber_imp_audio", "Cybernetic Sensory Implants (Audio)", "implant", "all", 650000, "universal", "E", "D-E-C-D", 2610, "Any (Terran Hegemony)", [], 4, 72,
        "Enhanced audio: the platoon has an Inner Sphere active probe with a 2-hex range, which hostile ECM disrupts."),
    augmentation("aug-sensory-visual", "cyber_imp_visual", "Cybernetic Sensory Implants (IR/EM)", "implant", "all", 650000, "universal", "E", "D-E-C-D", 2610, "Any (Terran Hegemony)", [], 4, 72,
        "IR or EM optics: the platoon has an Inner Sphere active probe with a 2-hex range, which hostile ECM disrupts."),
    augmentation("aug-sensory-laser", "cyber_imp_laser", "Cybernetic Sensory Implants (Laser)", "implant", "all", 600000, "universal", "E", "D-E-C-D", 2610, "Any (Terran Hegemony)", [], 4, 72,
        "Laser-sight optics: -1 to-hit for all the platoon's weapon attacks."),
    augmentation("aug-sensory-tele", "cyber_imp_tele", "Cybernetic Sensory Implants (Telescopic)", "implant", "all", 600000, "universal", "E", "D-E-C-D", 2610, "Any (Terran Hegemony)", [], 4, 72,
        "Telescopic optics: -1 to-hit for all the platoon's weapon attacks."),
    augmentation("aug-mm", "mm_implants", "Cybernetic Multi-Modal Sensory Implants", "implant", "all", 900000, "is", "E", "X-X-D-E", 3055, "Word of Blake, Capellan Confederation", [AUG_WB, AUG_CC], 4, 73,
        "Both sensory effects: a 2-hex active probe and -1 to-hit for all weapon attacks."),
    augmentation("aug-enh-mm", "enh_mm_implants", "Cybernetic Enhanced Multi-Modal Sensory Implants", "implant", "all", 1600000, "is", "E", "X-X-E-F", 3060, "Word of Blake, Capellan Confederation", [AUG_WB, AUG_CC], 4, 73,
        "As multi-modal, with a 3-hex active probe."),
    augmentation("aug-filtration", "filtration_implants", "Cybernetic Filtration Implants", "implant", "all", 60000, "universal", "C", "A-A-A-B", 2580, "Any (Terran Hegemony)", [], 4, 73,
        "Ignores non-lethal gas and Poisonous atmosphere damage; half damage (rounded down) from Caustic, Radiological and Flammable taints; lethal chemical weapons count as a Poisonous atmosphere. No protection from vacuum or fire."),
    augmentation("aug-pheromone", "gas_effuser_pheromone", "Cybernetic Gas Effuser, Pheromone", "implant", "all", 40000, "is", "E", "X-X-F-F", 3060, "Word of Blake, Capellan Confederation, Magistracy of Canopus", [AUG_WB, AUG_CC, AUG_MC], 4, 73,
        "A Gunnery Skill check against conventional infantry in the same hex (no range modifier): a hit gives the target +1 to all its actions for the scenario. Does nothing to troops in environment or vacuum suits."),
    augmentation("aug-toxin", "gas_effuser_toxin", "Cybernetic Gas Effuser, Toxin", "implant", "all", 10000, "is", "F", "X-X-E-F", 3060, "Word of Blake, Capellan Confederation, Magistracy of Canopus", [AUG_WB, AUG_CC, AUG_MC], 4, 74,
        "As the pheromone effuser, but a hit does 0.25 damage for each attacking trooper to the infantry in the same hex; no effect on non-conventional infantry or on troops in environment or vacuum suits."),
    augmentation("aug-dermal-armor", "dermal_armor", "Cybernetic Myomer Implants, Dermal Armor", "implant", "all", 1500000, "is", "E", "X-E-E-E", 2950, "Word of Blake, Capellan Confederation, Magistracy of Canopus", [AUG_WB, AUG_CC, AUG_MC], 4, 74,
        "+1 to the damage divisor (2 with no other armor). Crew needs of all weapons -1 (-2 with triple-strength myomer, never below 1), no encumbering, up to 3 secondary weapons a squad (4 with triple-strength myomer), no MP loss for them. Not with dermal camouflage."),
    augmentation("aug-dermal-camo", "dermal_camo_armor", "Cybernetic Myomer Implants, Dermal Camouflage Armor", "implant", "all", 1100000, "is", "D", "X-X-F-F", 3065, "Capellan Confederation", [AUG_CC], 4, 74,
        "Foot or jump infantry in no other armor: adds nothing to the divisor but avoids a divisor of 0.5; attacks against the platoon take +3 if it stayed put, +2 if it moved 1 hex, +1 if 2 hexes, none past that. No crew reduction. Not with dermal armor."),
    augmentation("aug-tsm", "tsm_implant", "Cybernetic Myomer Implants, Triple-Strength", "implant", "all", 2500000, "is", "F", "X-X-E-F", 3060, "Word of Blake, Capellan Confederation, Magistracy of Canopus", [AUG_WB, AUG_CC, AUG_MC], 4, 75,
        "Divisor 0.5 with no other armor (adds nothing otherwise); +0.14 damage a trooper against targets in the platoon's own hex. Crew needs -1 (-2 with dermal armor), no encumbering, up to 3 secondary weapons a squad (4 with dermal armor), no MP loss. Not with prosthetic leg MASC."),
    augmentation("aug-tcp", "triple_core_processor", "Cybernetic Triple-Core Processor Implant", "implant", "commander", 3000000, "is", "E", "X-X-F-X", 3068, "Word of Blake", [AUG_WB], 4, 75,
        "Only the commander carries it. Its Initiative bonus needs a VDNI link, which conventional infantry cannot make; it counts as -1 on the Anti-'Mech skill for Battle Value.", { extinct: 3085 }),
    augmentation("aug-suicide", "suicide_implants", "Explosive Suicide Implants", "implant", "all", 250, "universal", "C", "A-A-A-A", "PS", "Any", [], 4, 77,
        "Troopers may detonate in the Attack Phase: 0.57 damage for each trooper who does, to everything in the platoon's hex, friend or foe; each trooper lost also attacks the opposing units in the hex."),
    augmentation("aug-pl-masc", "pl_masc", "Prosthetic Leg MASC", "prosthetic", "all", 255000, "is", "E", "X-X-F-F", 3065, "Word of Blake, Capellan Confederation", [AUG_WB, AUG_CC], 4, 77,
        "Foot infantry only: +1 Ground MP (a platoon held to move-or-fire by encumbering gear still has 1 MP and may attack); attacks against the platoon take +1. Not with triple-strength myomer."),
    augmentation("aug-limb-enhanced", "pl_enhanced", "Prosthetic Limb, Enhanced", "prosthetic", "all", 100000, "universal", "E", "F-E-D-E", "ES", "Any", [], 4, 78,
        "One kind of weapon or tool in a prosthetic limb, one or two limbs a trooper: damage and effects in the platoon's own hex only (Enhanced Prosthetic Equipment Table).", { costUnit: "each limb a trooper" }),
    augmentation("aug-limb-improved", "pl_ienhanced", "Prosthetic Limb, Improved Enhanced", "prosthetic", "all", 202000, "universal", "E", "X-F-E-F", 2650, "Terran Hegemony, Word of Blake, Capellan Confederation, Magistracy of Canopus", [AUG_WB, AUG_CC, AUG_MC], 4, 78,
        "At least two prosthetic items, of the same or different kinds; each set is two items, at most two sets (four items) a trooper; damage and effects stack. Melee items give +2 to hit at most.", { costUnit: "each set of two items a trooper" }),
    augmentation("aug-limb-extraneous", "pl_extra_limbs", "Prosthetic Limb, Extraneous (Enhanced) Limbs", "prosthetic", "all", 400000, "is", "F", "X-X-F-X", 3068, "Capellan Confederation", [AUG_CC], 4, 78,
        "Pairs of extra limbs, up to two pairs a trooper (one with wings); one item a limb, both of a pair the same kind, damage and effects stack with other prosthetics.", { extinct: 3085, costUnit: "each pair a trooper" }),
    augmentation("aug-tail", "pl_tail", "Prosthetic Tail, Enhanced", "prosthetic", "all", 60000, "is", "E", "X-X-F-X", 3068, "Capellan Confederation", [AUG_CC], 4, 79,
        "+0.21 damage a trooper against targets in the platoon's own hex, at +2 to hit (a melee attack).", { extinct: 3085 }),
    augmentation("aug-glider", "pl_glider", "Prosthetic Wings, Glider", "prosthetic", "all", 90000, "is", "E", "X-X-E-X", 3069, "Capellan Confederation", [AUG_CC], 4, 79,
        "Drops from VTOLs and hovering DropShips as jump infantry (not in vacuum or very thin atmosphere); no damage from falls. Not with powered flight wings.", { extinct: 3085 }),
    augmentation("aug-flight", "pl_flight", "Prosthetic Wings, Powered Flight", "prosthetic", "all", 120000, "is", "F", "X-X-F-X", 3070, "Capellan Confederation", [AUG_CC], 4, 79,
        "Everything the glider wings do, and 2 MP of VTOL movement (not in vacuum). Not with glider wings.", { extinct: 3085 }),
];

export const findInfantryAugmentation = (tag: string): IInfantryAugmentation | null => infantryAugmentations.find((item) => item.tag === tag) ?? null;
/** The record a MegaMek augmentation line names, or null for one conventional infantry has no use for (VDNI, buffered VDNI, prototype DNI, EI). */
export const findInfantryAugmentationByKey = (key: string): IInfantryAugmentation | null => {
    const wanted = key.trim().toLowerCase();
    return infantryAugmentations.find((item) => item.megamekKey === wanted) ?? null;
};

/** One item a prosthetic limb carries (the Enhanced Prosthetic Equipment Table, IO:AE p.78, and the Battle Value modifiers table, p.185). */
export interface IInfantryProstheticItem {
    tag: string;
    name: string;
    /** Other spellings, MegaMek's among them. */
    altNames: string[];
    category: "ranged" | "melee" | "tool";
    /** Added max weapon damage for each trooper, for each item. */
    damage: number;
    /** The damage counts against other conventional infantry only (the table's asterisk). */
    infantryOnly: boolean;
    /** Weapon Battle Value for each trooper, for each item (p.185). */
    battleValue: number;
    /** Melee items need a +2 to-hit modifier to attack. */
    melee: boolean;
    /** Target-number modifier to the platoon's Anti-'Mech attacks (the grappler line and climbing claws). */
    antiMech: number;
}

export const infantryProstheticItems: IInfantryProstheticItem[] = [
    { tag: "laser", name: "Laser", altNames: [], category: "ranged", damage: 0.11, infantryOnly: false, battleValue: 0.24, melee: false, antiMech: 0 },
    { tag: "ballistic", name: "Ballistic", altNames: [], category: "ranged", damage: 0.01, infantryOnly: false, battleValue: 0.02, melee: false, antiMech: 0 },
    { tag: "needler", name: "Needler", altNames: [], category: "ranged", damage: 0.04, infantryOnly: false, battleValue: 0.08, melee: false, antiMech: 0 },
    { tag: "shotgun", name: "Shotgun", altNames: [], category: "ranged", damage: 0.05, infantryOnly: false, battleValue: 0.08, melee: false, antiMech: 0 },
    { tag: "sonic-stunner", name: "Sonic Stunner", altNames: [], category: "ranged", damage: 0.05, infantryOnly: true, battleValue: 0.10, melee: false, antiMech: 0 },
    { tag: "smg", name: "Submachine Gun", altNames: ["SMG"], category: "ranged", damage: 0.05, infantryOnly: false, battleValue: 0.10, melee: false, antiMech: 0 },
    { tag: "blade", name: "Blade", altNames: [], category: "melee", damage: 0.02, infantryOnly: true, battleValue: 0.02, melee: true, antiMech: 0 },
    { tag: "shocker", name: "Shocker", altNames: [], category: "melee", damage: 0.04, infantryOnly: true, battleValue: 0.04, melee: true, antiMech: 0 },
    { tag: "vibroblade", name: "Vibroblade", altNames: [], category: "melee", damage: 0.14, infantryOnly: false, battleValue: 0.14, melee: true, antiMech: 0 },
    { tag: "rumal-garrote", name: "Rumal/Garrote", altNames: ["Rumal", "Garrote"], category: "melee", damage: 0.14, infantryOnly: true, battleValue: 0.14, melee: true, antiMech: 0 },
    { tag: "grappler", name: "Grappler Line", altNames: ["Grappler"], category: "tool", damage: 0, infantryOnly: false, battleValue: 0, melee: false, antiMech: -2 },
    { tag: "climbing-claws", name: "Climbing Claws", altNames: ["Climbing Claw"], category: "tool", damage: 0.02, infantryOnly: true, battleValue: 0.02, melee: false, antiMech: -1 },
];

/** The item with that tag or name (MegaMek's too), case and punctuation aside. */
export const findInfantryProstheticItem = (tagOrName: string): IInfantryProstheticItem | null => {
    const key = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]/g, "");
    const wanted = key(tagOrName);
    return wanted ? infantryProstheticItems.find((item) => [item.tag, item.name, ...item.altNames].some((spelling) => key(spelling) === wanted)) ?? null : null;
};
