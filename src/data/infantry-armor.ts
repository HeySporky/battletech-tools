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
    { tag: "inf-armor-sneak-suit-camo", editions: ["total-warfare"], name: "Sneak Suit (Camo)", group: "sneak", damageDivisor: 1, encumbering: false, vacuum: false, stealth: ["camo"], techBase: "universal", techRating: "D", availability: "C-C-C", introduced: 2450, cost: 7000, page: 130 },
    { tag: "inf-armor-sneak-suit-ir", editions: ["total-warfare"], name: "Sneak Suit (IR)", group: "sneak", damageDivisor: 1, encumbering: false, vacuum: false, stealth: ["ir"], techBase: "universal", techRating: "D", availability: "C-C-C", introduced: 2450, cost: 7000, page: 130 },
    { tag: "inf-armor-sneak-suit-ecm", editions: ["total-warfare"], name: "Sneak Suit (ECM)", group: "sneak", damageDivisor: 1, encumbering: false, vacuum: false, stealth: ["ecm"], techBase: "universal", techRating: "D", availability: "C-C-C", introduced: 2450, cost: 7000, page: 130 },
    { tag: "inf-armor-sneak-suit-camo-ir", editions: ["total-warfare"], name: "Sneak Suit (Camo, IR)", group: "sneak", damageDivisor: 1, encumbering: false, vacuum: false, stealth: ["camo", "ir"], techBase: "universal", techRating: "D", availability: "D-D-D", introduced: 2460, cost: 21000, page: 130 },
    { tag: "inf-armor-sneak-suit-camo-ecm", editions: ["total-warfare"], name: "Sneak Suit (Camo, ECM)", group: "sneak", damageDivisor: 1, encumbering: false, vacuum: false, stealth: ["camo", "ecm"], techBase: "universal", techRating: "D", availability: "D-D-D", introduced: 2460, cost: 21000, page: 130 },
    { tag: "inf-armor-sneak-suit-ir-ecm", editions: ["total-warfare"], name: "Sneak Suit (IR, ECM)", group: "sneak", damageDivisor: 1, encumbering: false, vacuum: false, stealth: ["ir", "ecm"], techBase: "universal", techRating: "D", availability: "D-D-D", introduced: 2460, cost: 21000, page: 130 },
    { tag: "inf-armor-sneak-suit-camo-ir-ecm", editions: ["total-warfare"], name: "Sneak Suit (Camo, IR, ECM)", group: "sneak", damageDivisor: 1, encumbering: false, vacuum: false, stealth: ["camo", "ir", "ecm"], techBase: "universal", techRating: "D", availability: "D-E-E", introduced: 2475, cost: 28000, page: 130 },
];

export const findInfantryArmor = (tag: string): IInfantryArmor | null =>
    infantryArmor.find((armor) => armor.tag === tag) ?? null;
