// Micro-Mechs 6.1.0.2's appendices for games other than Classic BattleTech (Custom Homebrew, #173). STUBS: the app has
// no RolePlaying, BattleForce 2 or AeroTech 2 tool yet. Each future tool (its own section, as Classic BattleTech and
// Alpha Strike are) starts from these records, read from the document (pp.12-14 of the PDF on Sarna.net, linked in
// docs/lore/micro-mechs-tro.md). The appendices are Discord's work. The DropShip bay is built already (see below).

export type MicroMechOtherGame = "rpg" | "battleforce2" | "aerotech2";

export interface IMicroMechOtherGameStub {
    game: MicroMechOtherGame;
    /** The appendix's own heading. */
    title: string;
    /** "stub": nothing built, waiting for the game's tool. "partial": some of it is built in Classic BattleTech. */
    status: "stub" | "partial";
    /** What is built, and where, for a "partial" appendix. */
    built?: string;
    /** The rules, one line each, in our words. */
    rules: string[];
}

/** BattleForce 2 conversion (BF2 p.100 for the BattleMech rules it follows). */
export const MICRO_MECH_BATTLEFORCE2: IMicroMechOtherGameStub = {
    game: "battleforce2",
    title: "Battle Force 2 Conversions",
    status: "stub",
    rules: [
        "Convert as a BattleMech (BF2 p.100), with these exceptions.",
        "Structure: always 1, whatever the weight. Armor: converted as usual.",
        "Point Blank damage: the physical attack is a kick of damage factor 1; then calculate as usual.",
        "Overheat: none (a Micro-Mech makes no heat).",
        "Class: Mi.",
        "Medium range weapons (not in BF2): X-Pulse Lasers (large, medium, small), Caseless AC/2 (**), Caseless AC/5 (*), Heavy Flamer, Light, Medium and Heavy Recoilless Rifles, RAC/2, Grenade Launcher, 'Mech Mortar 1 (**), 'Mech Mortar 2 (**), Rocket Launchers 10, 15 and 20, Thunderbolt OS (Unbound).",
        "Long range weapons (not in BF2): HV AC/2 (**), LAC/2 (**), LAC/5 (*), ELRM (**), Thunderbolt 5, Thunderbolt 10.",
        "(*) three quarters damage at Point Blank range; (**) half damage at Point Blank range.",
    ],
};

/** AeroTech 2 supplement: the Micro-Mech Bay. */
export const MICRO_MECH_AEROTECH2: IMicroMechOtherGameStub = {
    game: "aerotech2",
    title: "Aerotech 2 Supplement",
    status: "partial",
    built: "The Micro-Mech Bay is a transport bay in the Small Craft / DropShip and capital ship creators at Custom Homebrew (tag \"micro-mech\", small-craft-construction.ts). In Alpha Strike it gives MMT#, and the emergency rule is part of MMT#'s text (MICRO_MECH_TRANSPORT_AS_ABILITY_TEXT).",
    rules: [
        "A Micro-Mech does not use a BattleMech bay: a Micro-Mech Bay weighs 75 tons and carries one Micro-Mech of up to 19 tons.",
        "The bay has basic repair facilities and quarters for a Micro-Mechwarrior and a technician. It costs 15,000 C-bills.",
        "Built for Alpha Strike only (MMT#); waits for an AeroTech 2 play tool: in an emergency up to 2 Micro-Mechs fit one BattleMech bay, but deploying them takes twice as long and they cannot make an orbital drop.",
        "No BattleMech ever fits a Micro-Mech Bay.",
    ],
};

/** CBT: RPG supplement (Classic BattleTech RPG; CBT Companion for skill advancement). */
export const MICRO_MECH_RPG: IMicroMechOtherGameStub = {
    game: "rpg",
    title: "CBT: RPG Micro-Mech Supplement",
    status: "stub",
    rules: [
        "Trait Vehicle (Modified): 0 points no Micro-Mech; 1 point a 10-ton Micro-Mech, and each further point 1 ton more, to 10 points for 19 tons.",
        "Skill Pilot/Micro-Mech (Difficult, Dex/Ref): related to Pilot/BattleMech for skill advancement (CBT Companion).",
        "Skill Pilot/Quad Micro-Mech (Difficult, Dex/Ref): related to Pilot/Quad for skill advancement.",
        "Skill Gunnery/Micro-Mech (attributes as for the gunnery skill type, CBT: RPG p.100): a new gunnery category for all Micro-Mechs.",
        "Skill Tactics/Micro-Mech (Int/Wil): any combat involving Micro-Mechs.",
        "Occupational field Micro-Mechwarrior Training (12 CP). Prerequisites: Basic Training, Dex 4, Ref 4. Skills: Pilot/Micro-Mech or Pilot/Quad Micro-Mech; Gunnery/Micro-Mech/Ballistic, /Laser and /Missile; Tactics/Micro-Mech; Sensor Operations.",
        "Life Path Stage Three: at the gamemaster's discretion, an academy or program with BattleMech training may offer the Micro-Mechwarrior field, with the trait Stigma/Micro-Mechwarrior.",
        "Life Path Stage Four, Micro-Mechwarrior Training: any non-Clan affiliation; none of Combat Paralysis, Disabled, Glass Jaw, Lost Limb, Poor Hearing, Poor Vision; Dex 4 and Ref 4 at least. Time 2 years. Traits Stigma/Micro-Mechwarrior, Vehicle (2). Skills Martial Arts/Military +1, Career/Soldier +2, +2 to any two skills of a military field. Field Micro-Mechwarrior Training. After any Inner Sphere or Periphery Tour of Duty; before any fitting Tour of Duty.",
        "Training events (2D6): 2 live-fire accident (Lost Limb (2), no more military paths, and one of Poor Hearing, Combat Paralysis, Glass Jaw or Bod -1); 3 washed out (-2 to all field skills); 4 the training officer dislikes you (Edg -1, Running +2, Bod +1); 5 minor accident (Lost Limb); 6 extra administrative duties (Rifles -1, Martial Arts/Military -1, Computer +1, Administration +1); 7 a fellow trainee's information (Contact); 8 a rival pushes you (Enemy, +1 to all field skills); 9 extra training in Micro-Mech repair (Tech/Mechanic, Tech/Support, Tech/Myomer, Tech/Communications +1 each); 10 you impress the officers (Promotion, Contact, Vehicle (1)); 11 top of the class (Promotion, Vehicle (3), Wealth (2)); 12 choose an event, or roll twice and take both.",
    ],
};

export const MICRO_MECH_OTHER_GAMES: IMicroMechOtherGameStub[] = [MICRO_MECH_RPG, MICRO_MECH_BATTLEFORCE2, MICRO_MECH_AEROTECH2];
