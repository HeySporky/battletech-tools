import { ICanonQuirkEntry } from "./quirk-canon-interfaces";

/*
 * DISCLAIMER: This file processes gameplay data derived from the BattleTech universe. 
 * All official lore, trademarks, and intellectual property belong strictly to 
 * Catalyst Game Labs, Topps, and/or their respective corporate rights holders. 
 * Any original, fan-made content or custom homebrew data processed by this tool 
 * remains the exclusive property of its respective community creators, which,
 * where known, has been appropriately attributed.
 *
 * This open-source utility is a non-commercial fan project designed purely for 
 * tabletop gameplay assistance. Content processed by this file is not intended 
 * to challenge any copyright or trademark status, and this data is explicitly 
 * excluded from the software's underlying license (GNU GPLv3).
 */

/**
 * The BattleMech Quirk Table: the quirks the BattleMech Manual recommends for each canon chassis (BMM pp.90-95,
 * Corrected seventh printing), entered from the page images in printed order.
 */
export const canonMechQuirks: ICanonQuirkEntry[] = [
    {
        chassis: "Akuma",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Albatross",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-improved-targeting", parameter: "long" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Alfar",
        quirks: [
            { tag: "quirk-non-standard-parts" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Annihilator",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Anubis",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-difficult-to-maintain" },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Anvil",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-improved-targeting", parameter: "medium" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Apollo",
        quirks: [
            { tag: "quirk-fast-reload" },
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Aquagladius",
        quirks: [
            { tag: "quirk-difficult-ejection" },
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Arbalest",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Arcas",
        quirks: [
            { tag: "quirk-protected-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Archangel",
        quirks: [
            { tag: "quirk-command-mech" },
            { tag: "quirk-improved-communications" },
            { tag: "quirk-improved-sensors" },
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Archer",
        quirks: [
            { tag: "quirk-battlefists" },
            { tag: "quirk-command-mech" },
            { tag: "quirk-stable" },
            { tag: "quirk-ubiquitous" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Arctic Fox",
        quirks: [
            { tag: "quirk-weak-head-armor", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Arctic Wolf",
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "short" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Arctic Wolf II",
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "short" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Argus",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Assassin",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-cramped-cockpit" },
            { tag: "quirk-non-standard-parts" },
            { tag: "quirk-poor-life-support" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Atlas",
        quirks: [
            { tag: "quirk-battlefists" },
            { tag: "quirk-command-mech" },
            { tag: "quirk-distracting" },
            { tag: "quirk-improved-communications" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Atlas II",
        quirks: [
            { tag: "quirk-battlefists" },
            { tag: "quirk-command-mech" },
            { tag: "quirk-distracting" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Avatar",
        quirks: [
            { tag: "quirk-stabilized-weapon", weapon: { name: "Medium Laser", location: "ct", all: true } },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Awesome",
        quirks: [
            { tag: "quirk-battlefists", locations: ["la"] },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Axman",
        quirks: [
            { tag: "quirk-protected-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Baboon (Howler)",
        altChassis: ["Baboon", "Howler"],
        quirks: [
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-searchlight" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Balius",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Bandersnatch",
        quirks: [
            { tag: "quirk-stable" },
            { tag: "quirk-ubiquitous" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Banshee",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
            { tag: "quirk-bad-reputation", toYear: 3024 },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Banzai",
        quirks: [
            { tag: "quirk-stabilized-weapon", weapon: { name: "Large Pulse Laser", location: "ra", all: true } },
            { tag: "quirk-difficult-to-maintain" },
            { tag: "quirk-non-standard-parts" },
            { tag: "quirk-prototype" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Barghest",
        quirks: [
            { tag: "quirk-directional-torso-mount", locations: ["lt", "rt"] },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Battle Cobra",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Battle Hawk",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "BattleAxe",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "BattleMaster",
        quirks: [
            { tag: "quirk-command-mech" },
            { tag: "quirk-jettison-capable-weapon", weapon: { name: "PPC" } },
            { tag: "quirk-weak-head-armor", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Bear Cub",
        quirks: [
            { tag: "quirk-easy-to-pilot" },
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-cramped-cockpit" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Behemoth (Stone Rhino)",
        altChassis: ["Behemoth", "Stone Rhino"],
        quirks: [
            { tag: "quirk-barrel-fist", locations: ["la", "ra"] },
            { tag: "quirk-protected-actuators" },
            { tag: "quirk-oversized" },
            { tag: "quirk-poor-performance" },
            { tag: "quirk-weak-head-armor", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Beowulf",
        quirks: [
            { tag: "quirk-command-mech" },
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Berserker",
        quirks: [
            { tag: "quirk-distracting" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Bishamon",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Black Hawk (Nova)",
        altChassis: ["Black Hawk", "Nova"],
        quirks: [
            { tag: "quirk-combat-computer" },
            { tag: "quirk-narrow-low-profile" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Black Hawk-KU",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Black Knight",
        quirks: [
            { tag: "quirk-command-mech" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Black Lanner",
        quirks: [
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Black Watch",
        quirks: [
            { tag: "quirk-easy-to-pilot" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Blackjack",
        quirks: [
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Blackjack (Omni)",
        quirks: [
            { tag: "quirk-non-standard-parts" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Blade",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-modular-weapons" },
            { tag: "quirk-exposed-weapon-linkage", weapon: { name: "Rotary AC/5" } },
            { tag: "quirk-static-ammo-feed", note: "no weapon named" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Blitzkrieg",
        quirks: [
            { tag: "quirk-directional-torso-mount", locations: ["ct", "lt"] },
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Blood Asp",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Blood Kite",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-rugged", parameter: 2 },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Blood Reaper",
        quirks: [
            { tag: "quirk-hyper-extending-actuators" },
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Bloodhound",
        quirks: [
            { tag: "quirk-improved-sensors" },
            { tag: "quirk-protected-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Blue Flame",
        quirks: [
            { tag: "quirk-directional-torso-mount", locations: ["hd", "lt", "rt"] },
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Bombard",
        quirks: [
            { tag: "quirk-bad-reputation" },
            { tag: "quirk-non-standard-parts" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Bombardier",
        quirks: [
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Bowman",
        quirks: [
            { tag: "quirk-fast-reload", weapon: { name: "Arrow IV" } },
            { tag: "quirk-stable" },
            { tag: "quirk-bad-reputation", techBase: "clan" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Brahma",
        quirks: [
            { tag: "quirk-stabilized-weapon", weapon: { name: "Light Autocannon/5" } },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Brigand",
        quirks: [
            { tag: "quirk-nimble-jumper" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Bruin",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Buccaneer",
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "short" },
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Burrock",
        quirks: [
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Bushwacker",
        quirks: [
            { tag: "quirk-narrow-low-profile" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Caesar",
        quirks: [
            { tag: "quirk-hyper-extending-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Canis",
        quirks: [
            { tag: "quirk-fast-reload" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Cataphract",
        quirks: [
            { tag: "quirk-protected-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Catapult",
        quirks: [
            { tag: "quirk-no-minimal-arms" },
            { tag: "quirk-weak-head-armor", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Cauldron-Born (Ebon Jaguar)",
        altChassis: ["Cauldron-Born", "Ebon Jaguar"],
        quirks: [
            { tag: "quirk-narrow-low-profile" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Centurion",
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "short" },
            { tag: "quirk-non-standard-parts" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Cephalus",
        quirks: [
            { tag: "quirk-improved-life-support" },
            { tag: "quirk-bad-reputation", techBase: "clan" },
            { tag: "quirk-difficult-to-maintain" },
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Cerberus",
        quirks: [
            { tag: "quirk-barrel-fist", locations: ["la", "ra"] },
            { tag: "quirk-improved-targeting", parameter: "long" },
            { tag: "quirk-vestigial-hands" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Cestus",
        quirks: [
            { tag: "quirk-stabilized-weapon", weapon: { name: "Gauss Rifle" } },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Chameleon",
        quirks: [
            { tag: "quirk-easy-to-pilot" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Champion",
        quirks: [
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Charger",
        quirks: [
            { tag: "quirk-barrel-fist", locations: ["la"] },
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Chimera",
        quirks: [
            { tag: "quirk-nimble-jumper" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Cicada",
        quirks: [
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Clint",
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "medium" },
            { tag: "quirk-improved-targeting", parameter: "long" },
            { tag: "quirk-exposed-actuators" },
            { tag: "quirk-difficult-to-maintain" },
            { tag: "quirk-non-standard-parts" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Clint IIC",
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "medium" },
            { tag: "quirk-improved-targeting", parameter: "long" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Cobra",
        quirks: [
            { tag: "quirk-protected-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Colossus",
        quirks: [
            { tag: "quirk-stable" },
            { tag: "quirk-low-mounted-arms" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Commando",
        quirks: [
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Commando IIC",
        quirks: [
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 90 },
    },
    {
        chassis: "Copperhead",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Corvis",
        quirks: [
            { tag: "quirk-modular-weapons" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Cossack",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Cougar",
        quirks: [
            { tag: "quirk-ubiquitous" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Coyotl",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Crab",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Crimson Hawk",
        quirks: [
            { tag: "quirk-protected-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Crimson Langur",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-improved-communications" },
            { tag: "quirk-protected-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Crockett",
        quirks: [
            { tag: "quirk-easy-to-pilot" },
            { tag: "quirk-poor-life-support" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Cronus",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Crossbow",
        quirks: [
            { tag: "quirk-modular-weapons", note: "LRM 10s" },
            { tag: "quirk-obsolete", note: "2550-3070" },
            { tag: "quirk-poor-targeting", parameter: "long" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Crossbow (Omni)",
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "short" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Crusader",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-rugged", parameter: 1 },
            { tag: "quirk-stabilized-weapon", note: "Legs" },
            { tag: "quirk-ubiquitous" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Cudgel",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Cuirass",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Cyclops",
        quirks: [
            { tag: "quirk-battle-computer" },
            { tag: "quirk-cowl" },
            { tag: "quirk-difficult-ejection" },
            { tag: "quirk-weak-head-armor", parameter: 2 },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Cygnus",
        quirks: [
            { tag: "quirk-exposed-weapon-linkage", note: "no weapon named" },
            { tag: "quirk-static-ammo-feed", note: "no weapon named" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Daboku",
        quirks: [
            { tag: "quirk-stabilized-weapon", note: "Autocannons" },
            { tag: "quirk-prototype" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Daedalus",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Daikyu",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Daimyo",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Daishi (Dire Wolf)",
        altChassis: ["Daishi", "Dire Wolf"],
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "long" },
            { tag: "quirk-difficult-ejection" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Dark Crow",
        quirks: [
            { tag: "quirk-low-mounted-arms" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Dart",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Dasher (Fire Moth)",
        altChassis: ["Dasher", "Fire Moth"],
        quirks: [
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-overhead-arms" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Dasher II",
        quirks: [
            { tag: "quirk-poor-performance" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Defiance",
        quirks: [
            { tag: "quirk-barrel-fist", locations: ["la", "ra"] },
            { tag: "quirk-hyper-extending-actuators" },
            { tag: "quirk-searchlight" },
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Deimos",
        quirks: [
            { tag: "quirk-anti-aircraft-targeting" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Dervish",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-hyper-extending-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Deva",
        quirks: [
            { tag: "quirk-improved-communications" },
            { tag: "quirk-improved-sensors" },
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Devastator",
        quirks: [
            { tag: "quirk-hyper-extending-actuators" },
            { tag: "quirk-searchlight" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Dragon",
        quirks: [
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Dragon Fire",
        quirks: [
            { tag: "quirk-good-reputation", parameter: 1 },
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Dragonfly (Viper)",
        altChassis: ["Dragonfly"],
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "long" },
            { tag: "quirk-narrow-low-profile" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Dragoon",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-modular-weapons" },
            { tag: "quirk-bad-reputation" },
            { tag: "quirk-obsolete", parameter: 2780 },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Duan Gung",
        quirks: [
            { tag: "quirk-protected-actuators" },
            { tag: "quirk-non-standard-parts" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Eagle",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-weak-head-armor", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Ebony",
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "medium" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Eidolon",
        quirks: [
            { tag: "quirk-non-standard-parts" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Eisenfaust",
        quirks: [
            { tag: "quirk-battlefists" },
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-protected-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Emperor",
        quirks: [
            { tag: "quirk-command-mech" },
            { tag: "quirk-improved-cooling-jacket", weapon: { name: "Large Laser", location: "la" } },
            { tag: "quirk-improved-cooling-jacket", weapon: { name: "Large Laser", location: "ra" } },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Enfield",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Enforcer",
        quirks: [
            { tag: "quirk-barrel-fist", locations: ["la", "ra"] },
            { tag: "quirk-fast-reload", weapon: { name: "Autocannon/10" } },
            { tag: "quirk-improved-cooling-jacket", weapon: { name: "Autocannon/10" } },
            { tag: "quirk-ammunition-feed-problem", weapon: { name: "Autocannon/10" } },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Enforcer III",
        quirks: [
            { tag: "quirk-barrel-fist", locations: ["la", "ra"] },
            { tag: "quirk-fast-reload", weapon: { name: "Ultra AC/10" } },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Epimetheus",
        quirks: [
            { tag: "quirk-non-standard-parts" },
            { tag: "quirk-prototype" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Excalibur",
        quirks: [
            { tag: "quirk-vestigial-hands" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Exterminator",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Eyleuka",
        quirks: [
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Fafnir",
        quirks: [
            { tag: "quirk-stabilized-weapon", weapon: { name: "Heavy Gauss Rifle", location: "lt", all: true } },
            { tag: "quirk-stabilized-weapon", weapon: { name: "Heavy Gauss Rifle", location: "rt", all: true } },
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Falcon",
        quirks: [
            { tag: "quirk-narrow-low-profile" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Falcon Hawk",
        quirks: [
            { tag: "quirk-good-reputation", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Falconer",
        quirks: [
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Fennec",
        quirks: [
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Fenris (Ice Ferret)",
        altChassis: ["Fenris", "Ice Ferret"],
        quirks: [
            { tag: "quirk-improved-sensors" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Fire Falcon",
        quirks: [
            { tag: "quirk-improved-sensors" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Fire Scorpion",
        quirks: [
            { tag: "quirk-cowl" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Fireball",
        quirks: [
            { tag: "quirk-improved-communications" },
            { tag: "quirk-narrow-low-profile" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Firebee",
        quirks: [
            { tag: "quirk-poor-life-support" },
            { tag: "quirk-weak-legs" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Firefly",
        quirks: [
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Firestarter",
        quirks: [
            { tag: "quirk-ubiquitous" },
            { tag: "quirk-exposed-weapon-linkage", weapon: { name: "Flamer", location: "la", all: true } },
            { tag: "quirk-exposed-weapon-linkage", weapon: { name: "Flamer", location: "ra", all: true } },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Firestarter (Omni)",
        quirks: [
            { tag: "quirk-cowl" },
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Flamberge",
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "medium" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Flashfire",
        quirks: [
            { tag: "quirk-modular-weapons", note: "Fluid Guns" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Flashman",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Flea",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-improved-life-support" },
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Galahad",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Galahad (Glass Spider)",
        altChassis: ["Glass Spider"],
        quirks: [
            { tag: "quirk-anti-aircraft-targeting" },
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-multi-trac" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Gallant",
        quirks: [
            { tag: "quirk-stabilized-weapon", weapon: { name: "Large Pulse Laser", location: "ra", all: true } },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Gallowglas",
        quirks: [
            { tag: "quirk-good-reputation", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Garm",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Ghost",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-improved-communications" },
            { tag: "quirk-improved-sensors" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Gladiator",
        quirks: [
            { tag: "quirk-cowl" },
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Gladiator (Executioner)",
        altChassis: ["Executioner"],
        quirks: [
            { tag: "quirk-distracting" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Goliath",
        quirks: [
            { tag: "quirk-multi-trac" },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Goshawk (Vapor Eagle)",
        altChassis: ["Goshawk", "Vapor Eagle"],
        quirks: [
            { tag: "quirk-nimble-jumper" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Goshawk II",
        quirks: [
            { tag: "quirk-improved-life-support" },
            { tag: "quirk-nimble-jumper" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Grand Crusader",
        quirks: [
            { tag: "quirk-directional-torso-mount", locations: ["lt", "rt"] },
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Grand Crusader II",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-stable" },
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 91 },
    },
    {
        chassis: "Grand Dragon",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Grand Titan",
        quirks: [
            { tag: "quirk-multi-trac" },
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Grasshopper",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Great Turtle",
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "short" },
            { tag: "quirk-poor-performance" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Great Wyrm",
        quirks: [
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Grendel (Mongrel)",
        altChassis: ["Grendel", "Mongrel"],
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Griffin",
        quirks: [
            { tag: "quirk-battlefists" },
            { tag: "quirk-jettison-capable-weapon", weapon: { name: "PPC" } },
            { tag: "quirk-rugged", parameter: 1 },
            { tag: "quirk-ubiquitous" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Griffin IIC",
        quirks: [
            { tag: "quirk-battlefists" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Grigori",
        quirks: [
            { tag: "quirk-improved-communications" },
            { tag: "quirk-improved-sensors" },
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Grim Reaper",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-protected-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Grizzly",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Guillotine",
        quirks: [
            { tag: "quirk-searchlight" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Guillotine IIC",
        quirks: [
            { tag: "quirk-searchlight" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Gunslinger",
        quirks: [
            { tag: "quirk-cowl" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Gurkha",
        quirks: [
            { tag: "quirk-bad-reputation" },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Ha Otoko",
        quirks: [
            { tag: "quirk-bad-reputation", techBase: "clan" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hachiwara",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hammer",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-improved-targeting", parameter: "long" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hammerhands",
        quirks: [
            { tag: "quirk-barrel-fist", locations: ["la", "ra"] },
            { tag: "quirk-protected-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hankyu (Arctic Cheetah)",
        altChassis: ["Hankyu", "Arctic Cheetah"],
        quirks: [
            { tag: "quirk-protected-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hatamoto",
        quirks: [
            { tag: "quirk-barrel-fist", locations: ["la"] },
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-modular-weapons", note: "Torso SRMs" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hatchetman",
        quirks: [
            { tag: "quirk-anti-aircraft-targeting" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hauptmann",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-extended-torso-twist" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hector",
        quirks: [
            { tag: "quirk-bad-reputation" },
            { tag: "quirk-exposed-actuators" },
            { tag: "quirk-obsolete", parameter: 2420 },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Helepolis",
        quirks: [
            { tag: "quirk-reinforced-legs" },
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Helios",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hellfire",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hellhound (Conjurer)",
        altChassis: ["Hellhound", "Conjurer"],
        quirks: [
            { tag: "quirk-extended-torso-twist" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hellion",
        quirks: [
            { tag: "quirk-weak-head-armor", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hellspawn",
        quirks: [
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hellstar",
        quirks: [
            { tag: "quirk-barrel-fist", locations: ["la", "ra"] },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hercules",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hermes",
        quirks: [
            { tag: "quirk-improved-communications" },
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hermes II",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-improved-communications" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Highlander",
        quirks: [
            { tag: "quirk-command-mech" },
            { tag: "quirk-cowl" },
            { tag: "quirk-reinforced-legs" },
            { tag: "quirk-difficult-ejection" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Highlander IIC",
        quirks: [
            { tag: "quirk-command-mech" },
            { tag: "quirk-cowl" },
            { tag: "quirk-reinforced-legs" },
            { tag: "quirk-difficult-ejection" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hitman",
        quirks: [
            { tag: "quirk-accurate-weapon", weapon: { name: "TAG" } },
            { tag: "quirk-stabilized-weapon", weapon: { name: "TAG" } },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hollander",
        quirks: [
            { tag: "quirk-reinforced-legs" },
            { tag: "quirk-stabilized-weapon", weapon: { name: "Gauss Rifle" } },
            { tag: "quirk-unbalanced" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hollander II",
        quirks: [
            { tag: "quirk-reinforced-legs" },
            { tag: "quirk-stabilized-weapon", weapon: { name: "Gauss Rifle" } },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hoplite",
        quirks: [
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hornet",
        quirks: [
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hunchback",
        quirks: [
            { tag: "quirk-battlefists" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hunchback IIC",
        quirks: [
            { tag: "quirk-bad-reputation", techBase: "clan" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Huron Warrior",
        quirks: [
            { tag: "quirk-improved-sensors" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Hussar",
        quirks: [
            { tag: "quirk-directional-torso-mount", locations: ["ct"] },
            { tag: "quirk-improved-communications" },
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Icarus II",
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "short" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Icestorm",
        quirks: [
            { tag: "quirk-improved-sensors" },
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Imp",
        quirks: [
            { tag: "quirk-command-mech" },
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Initiate",
        quirks: [
            { tag: "quirk-hyper-extending-actuators" },
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Jackal",
        quirks: [
            { tag: "quirk-improved-cooling-jacket", weapon: { name: "ER PPC" } },
            { tag: "quirk-weak-legs" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Jackrabbit",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "JagerMech",
        quirks: [
            { tag: "quirk-anti-aircraft-targeting" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "JagerMech III",
        quirks: [
            { tag: "quirk-anti-aircraft-targeting" },
            { tag: "quirk-overhead-arms" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Javelin",
        quirks: [
            { tag: "quirk-unbalanced" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Jenner",
        quirks: [
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Jenner IIC",
        quirks: [
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Jinggau",
        quirks: [
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-weak-head-armor", parameter: 2 },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Juggernaut",
        quirks: [
            { tag: "quirk-improved-life-support" },
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Jupiter",
        quirks: [
            { tag: "quirk-fine-manipulators" },
            { tag: "quirk-improved-sensors" },
            { tag: "quirk-improved-targeting", parameter: "long" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Kabuto",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Karhu",
        quirks: [
            { tag: "quirk-em-interference" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "King Crab",
        quirks: [
            { tag: "quirk-command-mech" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Kingfisher",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Kintaro",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Kodiak",
        quirks: [
            { tag: "quirk-battlefists" },
            { tag: "quirk-distracting" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Komodo",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-protected-actuators" },
            { tag: "quirk-weak-head-armor", parameter: 2 },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Koschei",
        quirks: [
            { tag: "quirk-improved-life-support" },
            { tag: "quirk-weak-head-armor", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Koshi (Mist Lynx)",
        altChassis: ["Koshi", "Mist Lynx"],
        quirks: [
            { tag: "quirk-improved-sensors" },
            { tag: "quirk-narrow-low-profile" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Koto",
        quirks: [
            { tag: "quirk-em-interference" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Kraken (Bane)",
        altChassis: ["Kraken", "Bane"],
        quirks: [
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-protected-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Kuma",
        quirks: [
            { tag: "quirk-accurate-weapon", weapon: { name: "Heavy Large Laser" } },
            { tag: "quirk-hard-to-pilot" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Kyudo",
        quirks: [
            { tag: "quirk-easy-to-pilot" },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Lancelot",
        quirks: [
            { tag: "quirk-anti-aircraft-targeting" },
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Lao Hu",
        quirks: [
            { tag: "quirk-good-reputation", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Legacy",
        quirks: [
            { tag: "quirk-directional-torso-mount", locations: ["lt", "rt"] },
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Legionnaire",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-improved-targeting", parameter: "medium" },
            { tag: "quirk-exposed-weapon-linkage", note: "no weapon named" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Lightray",
        quirks: [
            { tag: "quirk-hyper-extending-actuators" },
            { tag: "quirk-bad-reputation" },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Linebacker",
        quirks: [
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Lineholder",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Lobo",
        quirks: [
            { tag: "quirk-directional-torso-mount", note: "AMS" },
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 92 },
    },
    {
        chassis: "Locust",
        quirks: [
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-ubiquitous" },
            { tag: "quirk-cramped-cockpit" },
            { tag: "quirk-no-minimal-arms" },
            { tag: "quirk-weak-legs" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Locust IIC",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-no-minimal-arms" },
            { tag: "quirk-weak-legs" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Loki (Hellbringer)",
        altChassis: ["Loki", "Hellbringer"],
        quirks: [
            { tag: "quirk-searchlight" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Longbow",
        quirks: [
            { tag: "quirk-anti-aircraft-targeting" },
            { tag: "quirk-searchlight" },
            { tag: "quirk-ubiquitous" },
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Longshot",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Lupus",
        quirks: [
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Lynx",
        quirks: [
            { tag: "quirk-multi-trac" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Mackie",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-protected-actuators" },
            { tag: "quirk-rugged", parameter: 1 },
            { tag: "quirk-oversized" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Mad Cat (Timber Wolf)",
        altChassis: ["Mad Cat", "Timber Wolf"],
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "medium" },
            { tag: "quirk-weak-head-armor", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Mad Cat Mk II",
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "medium" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Maelstrom",
        quirks: [
            { tag: "quirk-good-reputation", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Malak",
        quirks: [
            { tag: "quirk-improved-communications" },
            { tag: "quirk-improved-sensors" },
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Man O'War (Gargoyle)",
        altChassis: ["Man O'War", "Gargoyle"],
        quirks: [
            { tag: "quirk-stabilized-weapon", note: "LA/RA" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Mandrill",
        quirks: [
            { tag: "quirk-narrow-low-profile" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Mangonel",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Mantis",
        quirks: [
            { tag: "quirk-non-standard-parts" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Marauder",
        quirks: [
            { tag: "quirk-command-mech" },
            { tag: "quirk-directional-torso-mount", locations: ["rt"] },
            { tag: "quirk-hyper-extending-actuators" },
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-exposed-weapon-linkage", weapon: { name: "Autocannon/5" } },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Marauder II",
        quirks: [
            { tag: "quirk-command-mech" },
            { tag: "quirk-hyper-extending-actuators" },
            { tag: "quirk-narrow-low-profile" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Marauder IIC",
        quirks: [
            { tag: "quirk-command-mech" },
            { tag: "quirk-hyper-extending-actuators" },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Marshal",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-rugged", parameter: 2 },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Masakari (Warhawk)",
        altChassis: ["Masakari", "Warhawk"],
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "long" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Matador",
        quirks: [
            { tag: "quirk-battlefists" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Mauler",
        quirks: [
            { tag: "quirk-stabilized-weapon", note: "Autocannons" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Men Shen",
        quirks: [
            { tag: "quirk-improved-communications" },
            { tag: "quirk-improved-sensors" },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Mercury",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-modular-weapons" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Mercury II",
        quirks: [
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-stabilized-weapon", weapon: { name: "Medium Laser", location: "ct" } },
            { tag: "quirk-bad-reputation", techBase: "clan" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Merlin",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Mjolnir",
        quirks: [
            { tag: "quirk-accurate-weapon", weapon: { name: "Mace" } },
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Mongoose",
        quirks: [
            { tag: "quirk-command-mech" },
            { tag: "quirk-easy-to-pilot" },
            { tag: "quirk-stabilized-weapon", weapon: { name: "Small Laser" } },
            { tag: "quirk-stabilized-weapon", weapon: { name: "Medium Laser", location: "ct" } },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Mongoose II",
        quirks: [
            { tag: "quirk-command-mech" },
            { tag: "quirk-improved-communications" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Morpheus",
        quirks: [
            { tag: "quirk-protected-actuators" },
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Morrigan",
        quirks: [
            { tag: "quirk-stabilized-weapon", weapon: { name: "Heavy Large Laser" } },
            { tag: "quirk-weak-legs" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Naga",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-bad-reputation", techBase: "clan" },
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Naginata",
        quirks: [
            { tag: "quirk-cowl" },
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Nexus",
        quirks: [
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Nexus II",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Night Gyr",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Night Hawk",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Night Wolf",
        quirks: [
            { tag: "quirk-directional-torso-mount", note: "AMS" },
            { tag: "quirk-hyper-extending-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Nightsky",
        quirks: [
            { tag: "quirk-modular-weapons", note: "Hatchet" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Nightstar",
        quirks: [
            { tag: "quirk-command-mech" },
            { tag: "quirk-good-reputation", parameter: 1 },
            { tag: "quirk-variable-range-targeting" },
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Ninja-To",
        quirks: [
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Nobori-nin (Huntsman)",
        altChassis: ["Nobori-nin", "Huntsman"],
        quirks: [
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "No-Dachi",
        quirks: [
            { tag: "quirk-hyper-extending-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Nova Cat",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Nyx",
        quirks: [
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "O-Bakemono",
        quirks: [
            { tag: "quirk-modular-weapons" },
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Ocelot",
        quirks: [
            { tag: "quirk-jettison-capable-weapon", weapon: { name: "Medium Laser", location: "ra", all: true } },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Omen",
        quirks: [
            { tag: "quirk-protected-actuators" },
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Onager",
        quirks: [
            { tag: "quirk-battlefists", locations: ["ra"] },
            { tag: "quirk-exposed-actuators" },
            { tag: "quirk-exposed-weapon-linkage", weapon: { name: "Hyper-Assault Gauss (HAG) 30" } },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Onslaught",
        quirks: [
            { tag: "quirk-protected-actuators" },
            { tag: "quirk-non-standard-parts" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Orion",
        quirks: [
            { tag: "quirk-anti-aircraft-targeting" },
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Orion IIC",
        quirks: [
            { tag: "quirk-anti-aircraft-targeting" },
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Orochi",
        quirks: [
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Osiris",
        quirks: [
            { tag: "quirk-directional-torso-mount", note: "1 CT ER Medium Laser" },
            { tag: "quirk-extended-torso-twist" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Osprey",
        quirks: [
            { tag: "quirk-directional-torso-mount", locations: ["rt"] },
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Osteon",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-multi-trac" },
            { tag: "quirk-protected-actuators" },
            { tag: "quirk-bad-reputation", techBase: "clan" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Ostroc",
        quirks: [
            { tag: "quirk-narrow-low-profile" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Ostscout",
        quirks: [
            { tag: "quirk-improved-communications" },
            { tag: "quirk-improved-sensors" },
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Ostsol",
        quirks: [
            { tag: "quirk-improved-sensors" },
            { tag: "quirk-narrow-low-profile" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Ostwar",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Owens",
        quirks: [
            { tag: "quirk-improved-sensors" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Pack Hunter",
        quirks: [
            { tag: "quirk-reinforced-legs" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Pack Hunter II",
        quirks: [
            { tag: "quirk-stabilized-weapon", weapon: { name: "ER PPC" } },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Paladin",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
            { tag: "quirk-non-standard-parts" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Panther",
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "short" },
            { tag: "quirk-nimble-jumper" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Parash",
        quirks: [
            { tag: "quirk-jettison-capable-weapon", weapon: { name: "Large Pulse Laser" } },
            { tag: "quirk-narrow-low-profile" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Pariah (Septicemia)",
        altChassis: ["Pariah", "Septicemia"],
        quirks: [
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-multi-trac" },
            { tag: "quirk-bad-reputation", techBase: "clan" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Pathfinder",
        quirks: [
            { tag: "quirk-improved-sensors" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Patriot",
        quirks: [
            { tag: "quirk-protected-actuators" },
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Peacekeeper",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Penetrator",
        quirks: [
            { tag: "quirk-good-reputation", parameter: 1 },
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 93 },
    },
    {
        chassis: "Penthesilea",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
            { tag: "quirk-stabilized-weapon", weapon: { name: "ER Medium Laser", location: "ct", all: true } },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Peregrine (Horned Owl)",
        altChassis: ["Peregrine", "Horned Owl"],
        quirks: [
            { tag: "quirk-stabilized-weapon", note: "CT" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Perseus",
        quirks: [
            { tag: "quirk-anti-aircraft-targeting" },
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Phantom",
        quirks: [
            { tag: "quirk-improved-sensors" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Phoenix",
        quirks: [
            { tag: "quirk-directional-torso-mount", note: "SRMs" },
            { tag: "quirk-em-interference" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Phoenix Hawk",
        quirks: [
            { tag: "quirk-command-mech" },
            { tag: "quirk-improved-communications" },
            { tag: "quirk-jettison-capable-weapon", weapon: { name: "Large Laser" } },
            { tag: "quirk-ubiquitous" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Phoenix Hawk IIC",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-fast-reload", note: "torso weapons" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Pillager",
        quirks: [
            { tag: "quirk-battlefists" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Pinion",
        quirks: [
            { tag: "quirk-bad-reputation", techBase: "clan" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Piranha",
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "short" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Porcupine",
        quirks: [
            { tag: "quirk-distracting" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Pouncer",
        quirks: [
            { tag: "quirk-weak-head-armor", parameter: 2 },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Predator",
        quirks: [
            { tag: "quirk-cramped-cockpit" },
            { tag: "quirk-difficult-ejection" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Prefect",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Preta",
        quirks: [
            { tag: "quirk-improved-communications" },
            { tag: "quirk-improved-sensors" },
            { tag: "quirk-bad-reputation" },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Prometheus",
        quirks: [
            { tag: "quirk-non-standard-parts" },
            { tag: "quirk-prototype" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Prowler",
        quirks: [
            { tag: "quirk-poor-life-support" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Pulverizer",
        quirks: [
            { tag: "quirk-accurate-weapon", weapon: { name: "Enhanced ER PPC" } },
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-protected-actuators" },
            { tag: "quirk-bad-reputation", techBase: "clan" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Puma (Adder)",
        altChassis: ["Puma", "Adder"],
        quirks: [
            { tag: "quirk-narrow-low-profile" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Quickdraw",
        quirks: [
            { tag: "quirk-hyper-extending-actuators" },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Rabid Coyote",
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "short" },
            { tag: "quirk-bad-reputation", techBase: "clan" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Raijin",
        quirks: [
            { tag: "quirk-directional-torso-mount", locations: ["lt", "rt"] },
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Raijin II",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Rakshasa",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-weak-head-armor", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Rampage",
        quirks: [
            { tag: "quirk-vestigial-hands", locations: ["ra"] },
            { tag: "quirk-bad-reputation" },
            { tag: "quirk-obsolete", parameter: 2780 },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Raptor",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Raptor II",
        quirks: [
            { tag: "quirk-no-minimal-arms" },
            { tag: "quirk-no-ejection-system" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Raven",
        quirks: [
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Razorback",
        quirks: [
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Red Shift",
        quirks: [
            { tag: "quirk-accurate-weapon", weapon: { name: "TAG" } },
            { tag: "quirk-improved-communications" },
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Rifleman",
        quirks: [
            { tag: "quirk-anti-aircraft-targeting" },
            { tag: "quirk-improved-communications" },
            { tag: "quirk-searchlight" },
            { tag: "quirk-ubiquitous" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Rifleman II",
        quirks: [
            { tag: "quirk-anti-aircraft-targeting" },
            { tag: "quirk-improved-communications" },
            { tag: "quirk-searchlight" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Rifleman IIC",
        quirks: [
            { tag: "quirk-anti-aircraft-targeting" },
            { tag: "quirk-improved-communications" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Ronin",
        quirks: [
            { tag: "quirk-non-standard-parts" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Rook",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Ryoken (Stormcrow)",
        altChassis: ["Ryoken", "Stormcrow"],
        quirks: [
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Ryoken II",
        quirks: [
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Sagittaire",
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "short" },
            { tag: "quirk-difficult-to-maintain" },
            { tag: "quirk-weak-head-armor", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Salamander",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Sasquatch",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Savage Coyote",
        quirks: [
            { tag: "quirk-oversized" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Scarabus",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Scorpion",
        quirks: [
            { tag: "quirk-bad-reputation" },
            { tag: "quirk-hard-to-pilot" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Scylla",
        quirks: [
            { tag: "quirk-oversized" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Sentinel",
        quirks: [
            { tag: "quirk-improved-communications" },
            { tag: "quirk-ammunition-feed-problem", weapon: { name: "SRM 2" } },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Sentry",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-easy-to-pilot" },
            { tag: "quirk-rugged", parameter: 1 },
            { tag: "quirk-ubiquitous" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Seraph",
        quirks: [
            { tag: "quirk-improved-communications" },
            { tag: "quirk-improved-sensors" },
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Sha Yu",
        quirks: [
            { tag: "quirk-improved-communications" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Shadow Cat",
        quirks: [
            { tag: "quirk-narrow-low-profile" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Shadow Cat II",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-narrow-low-profile" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Shadow Hawk",
        quirks: [
            { tag: "quirk-battlefists" },
            { tag: "quirk-improved-life-support" },
            { tag: "quirk-rugged", parameter: 1 },
            { tag: "quirk-ubiquitous" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Shadow Hawk IIC",
        quirks: [
            { tag: "quirk-battlefists" },
            { tag: "quirk-improved-life-support" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Shen Yi",
        quirks: [
            { tag: "quirk-weak-head-armor", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Shockwave",
        quirks: [
            { tag: "quirk-battlefists" },
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-exposed-weapon-linkage", weapon: { name: "Rotary AC/5" } },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Shogun",
        quirks: [
            { tag: "quirk-barrel-fist", locations: ["la", "ra"] },
            { tag: "quirk-difficult-to-maintain" },
            { tag: "quirk-non-standard-parts" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Shootist",
        quirks: [
            { tag: "quirk-command-mech" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Shugenja",
        quirks: [
            { tag: "quirk-cowl" },
            { tag: "quirk-hyper-extending-actuators" },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Silver Fox",
        quirks: [
            { tag: "quirk-non-standard-parts" },
            { tag: "quirk-weak-head-armor", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Sirocco",
        quirks: [
            { tag: "quirk-directional-torso-mount", note: "All" },
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Slagmaiden",
        quirks: [
            { tag: "quirk-jettison-capable-weapon", note: "Shield" },
            { tag: "quirk-exposed-actuators" },
            { tag: "quirk-prototype" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Sling",
        quirks: [
            { tag: "quirk-cramped-cockpit" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Snake",
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "short" },
            { tag: "quirk-protected-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Snow Fox",
        quirks: [
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-hard-to-pilot" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Solitaire",
        quirks: [
            { tag: "quirk-improved-cooling-jacket", weapon: { name: "Heavy Large Laser" } },
            { tag: "quirk-stabilized-weapon", weapon: { name: "Heavy Large Laser" } },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Spartan",
        quirks: [
            { tag: "quirk-improved-sensors" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Spatha",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
            { tag: "quirk-non-standard-parts" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Spector",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Sphinx",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Spider",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-nimble-jumper" },
            { tag: "quirk-no-ejection-system" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Spirit",
        quirks: [
            { tag: "quirk-jettison-capable-weapon", weapon: { name: "Streak SRM 4" } },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Stag",
        quirks: [
            { tag: "quirk-improved-communications" },
            { tag: "quirk-improved-sensors" },
            { tag: "quirk-stabilized-weapon", weapon: { name: "ER Large Laser", location: "ra" } },
            { tag: "quirk-bad-reputation", techBase: "clan" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Stalker",
        quirks: [
            { tag: "quirk-combat-computer" },
            { tag: "quirk-ubiquitous" },
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Stalking Spider",
        quirks: [
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Starslayer",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Stealth",
        quirks: [
            { tag: "quirk-improved-sensors" },
        ],
        source: { book: "BattleMech Manual", page: 94 },
    },
    {
        chassis: "Stiletto",
        quirks: [
            { tag: "quirk-multi-trac" },
            { tag: "quirk-difficult-ejection" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Stinger",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
            { tag: "quirk-ubiquitous" },
            { tag: "quirk-cramped-cockpit" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Stooping Hawk",
        quirks: [
            { tag: "quirk-rugged", parameter: 2 },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Strider",
        quirks: [
            { tag: "quirk-easy-to-pilot" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Striker",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Sun Cobra",
        quirks: [
            { tag: "quirk-protected-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Sunder",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Supernova",
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "long" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Tai-sho",
        quirks: [
            { tag: "quirk-improved-communications" },
            { tag: "quirk-stabilized-weapon", weapon: { name: "Ultra AC/10" } },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Talon",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Talos",
        quirks: [
            { tag: "quirk-easy-to-pilot" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Tarantula",
        quirks: [
            { tag: "quirk-easy-to-pilot" },
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Targe",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-bad-reputation" },
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Tempest",
        quirks: [
            { tag: "quirk-directional-torso-mount", note: "H Medium Laser" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Templar",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Tessen",
        quirks: [
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Thanatos",
        quirks: [
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Thor (Summoner)",
        altChassis: ["Thor", "Summoner"],
        quirks: [
            { tag: "quirk-improved-communications" },
            { tag: "quirk-ubiquitous" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Thorn",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Thresher",
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "medium" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Thug",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Thunder",
        quirks: [
            { tag: "quirk-cowl" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Thunder Fox",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Thunder Hawk",
        quirks: [
            { tag: "quirk-command-mech" },
            { tag: "quirk-good-reputation", parameter: 1 },
            { tag: "quirk-variable-range-targeting" },
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Thunder Stallion",
        quirks: [
            { tag: "quirk-cramped-cockpit" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Thunderbolt",
        quirks: [
            { tag: "quirk-multi-trac" },
            { tag: "quirk-rugged", parameter: 2 },
            { tag: "quirk-ubiquitous" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Ti Ts'ang",
        quirks: [
            { tag: "quirk-hyper-extending-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Titan",
        quirks: [
            { tag: "quirk-protected-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Titan II",
        quirks: [
            { tag: "quirk-protected-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Toro",
        quirks: [
            { tag: "quirk-cramped-cockpit" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Toyama",
        quirks: [
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Trebaruna",
        quirks: [
            { tag: "quirk-command-mech" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Trebuchet",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-fast-reload", note: "torso weapons" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Tsunami",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Tundra Wolf",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-weak-head-armor", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Turkina",
        quirks: [
            { tag: "quirk-easy-to-pilot" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Uller (Kit Fox)",
        altChassis: ["Uller", "Kit Fox"],
        quirks: [
            { tag: "quirk-narrow-low-profile" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "UrbanMech",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "UrbanMech IIC",
        quirks: [
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-narrow-low-profile" },
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Ursus",
        quirks: [
            { tag: "quirk-distracting" },
            { tag: "quirk-protected-actuators" },
            { tag: "quirk-cramped-cockpit" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Ursus II",
        quirks: [
            { tag: "quirk-distracting" },
            { tag: "quirk-protected-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Uziel",
        quirks: [
            { tag: "quirk-cowl" },
            { tag: "quirk-bad-reputation" },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Valiant",
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "short" },
            { tag: "quirk-protected-actuators" },
            { tag: "quirk-weak-head-armor", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Valkyrie",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-improved-communications" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Vanquisher",
        quirks: [
            { tag: "quirk-stable" },
            { tag: "quirk-bad-reputation" },
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Venom",
        quirks: [
            { tag: "quirk-nimble-jumper" },
            { tag: "quirk-difficult-ejection" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Verfolger",
        quirks: [
            { tag: "quirk-hyper-extending-actuators" },
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Victor",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Viking",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-multi-trac" },
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Vindicator",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
            { tag: "quirk-difficult-ejection" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Viper (Black Python)",
        altChassis: ["Black Python"],
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "short" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Vixen (Incubus)",
        altChassis: ["Vixen", "Incubus"],
        quirks: [
            { tag: "quirk-jettison-capable-weapon", weapon: { name: "Large Pulse Laser" } },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Volkh",
        quirks: [
            { tag: "quirk-non-standard-parts" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Von Rohrs (Hebi)",
        altChassis: ["Von Rohrs", "Hebi"],
        quirks: [
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Vulcan",
        quirks: [
            { tag: "quirk-narrow-low-profile" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Vulture (Mad Dog)",
        altChassis: ["Vulture", "Mad Dog"],
        quirks: [
            { tag: "quirk-improved-targeting", parameter: "medium" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Wakazashi",
        quirks: [
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "War Dog",
        quirks: [
            { tag: "quirk-accurate-weapon", weapon: { name: "Streak SRM 2 (OS)", all: true } },
            { tag: "quirk-fast-reload", weapon: { name: "Streak SRM 2 (OS)", all: true } },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Warhammer",
        quirks: [
            { tag: "quirk-rugged", parameter: 2 },
            { tag: "quirk-searchlight" },
            { tag: "quirk-stable" },
            { tag: "quirk-ubiquitous" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Warhammer IIC",
        quirks: [
            { tag: "quirk-searchlight" },
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Warlord",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Wasp",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-ubiquitous" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Watchman",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-easy-to-pilot" },
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Werewolf",
        quirks: [
            { tag: "quirk-non-standard-parts" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "White Flame",
        quirks: [
            { tag: "quirk-directional-torso-mount", locations: ["lt", "rt"] },
            { tag: "quirk-bad-reputation" },
            { tag: "quirk-exposed-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Whitworth",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
            { tag: "quirk-weak-legs" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Wight",
        quirks: [
            { tag: "quirk-exposed-actuators" },
            { tag: "quirk-weak-legs" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Wildfire",
        quirks: [
            { tag: "quirk-non-standard-parts" },
            { tag: "quirk-prototype" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Wolf Trap (Tora)",
        altChassis: ["Wolf Trap", "Tora"],
        quirks: [
            { tag: "quirk-bad-reputation" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Wolfhound",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
            { tag: "quirk-good-reputation", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Wolverine",
        quirks: [
            { tag: "quirk-command-mech" },
            { tag: "quirk-extended-torso-twist" },
            { tag: "quirk-improved-communications" },
            { tag: "quirk-jettison-capable-weapon", weapon: { name: "Autocannon/5" } },
            { tag: "quirk-protected-actuators" },
            { tag: "quirk-ubiquitous" },
            { tag: "quirk-cramped-cockpit" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Wolverine II",
        quirks: [
            { tag: "quirk-command-mech" },
            { tag: "quirk-improved-communications" },
            { tag: "quirk-protected-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Woodsman",
        quirks: [
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Wraith",
        quirks: [
            { tag: "quirk-ubiquitous" },
            { tag: "quirk-difficult-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Wyvern",
        quirks: [
            { tag: "quirk-rugged", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Wyvern IIC",
        quirks: [
            { tag: "quirk-protected-actuators" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Xanthos",
        quirks: [
            { tag: "quirk-improved-life-support" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Yao Lien",
        quirks: [
            { tag: "quirk-non-standard-parts" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Yeoman",
        quirks: [
            { tag: "quirk-no-minimal-arms" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Ymir",
        quirks: [
            { tag: "quirk-stable" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Yu Huang",
        quirks: [
            { tag: "quirk-command-mech" },
            { tag: "quirk-good-reputation", parameter: 1 },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
    {
        chassis: "Zeus",
        quirks: [
            { tag: "quirk-barrel-fist", locations: ["ra"] },
            { tag: "quirk-easy-to-maintain" },
        ],
        source: { book: "BattleMech Manual", page: 95 },
    },
];
