export interface IForcePack {
    name: string;
    tech: string;
    groupLabel: string;
    members: string[];
}
export const CONST_FORCE_PACKS: IForcePack[] = [
    {
        name: "Clan Command Star",
        groupLabel: "Star",
        tech: "clan",
        members: [
            "Daishi (Dire Wolf) Prime",
            "Ryoken (Stormcrow) Prime",
            "Shadow Cat Prime",
            "Koshi (Mist Lynx) Prime",
            "Thor (Summoner) Prime",
        ],
    },
    {
        name: "Clan Heavy Striker Star",
        groupLabel: "Star",
        tech: "clan",
        members: [
            "Man O' War (Gargoyle) Prime",
            "Loki (Hellbringer) Prime",
            "Vulture (Mad Dog) Prime",
            "Fenris (Ice Ferret) Prime",
            "Dragonfly (Viper) Prime",
        ],
    },
    {
        name: "Clan Fire Star",
        groupLabel: "Star",
        tech: "clan",
        members: [
            "Masakari (Warhawk) Prime",
            "Nova Cat Prime",
            "Cougar Prime",
            "Uller (Kit Fox) Prime",
            "Dasher (Fire Moth) Prime",
        ],
    },
    {
        name: "Clan Heavy Star",
        groupLabel: "Star",
        tech: "clan",
        members: [
            "Behemoth (Stone Rhino)",
            "Supernova",
            "Marauder IIC",
            "Warhammer IIC",
            "Hunchback IIC",
        ],
    },
    {
        name: "Clan Support Star",
        groupLabel: "Star",
        tech: "clan",
        members: [
            "Night Gyr Prime",
            "Hankyu (Arctic Cheetah) Prime",
            "Linebacker Prime",
            "Battle Cobra Prime",
            "Black Lanner Prime",
        ],
    },
    {
        name: "Clan Heavy Battle Star",
        groupLabel: "Star",
        tech: "clan",
        members: [
            "Turkina Prime",
            "Kingfisher Prime",
            "Cauldron-Born (Ebon Jaguar) Prime",
            "Crossbow Prime",
            "Nobori-nin (Huntsman) Prime",
        ],
    },
    {
        name: "Clan Striker Star",
        groupLabel: "Star",
        tech: "clan",
        members: [
            "Goshawk (Vapor Eagle)",
            "Hellhound (Conjurer)",
            "Peregrine (Horned Owl)",
            "Vixen (Incubus)",
            "Piranha",
        ],
    },
    {
        name: "Clan Ad Hoc Star",
        groupLabel: "Star",
        tech: "clan",
        members: [
            "Kodiak",
            "Pack Hunter",
            "Hellion Prime",
            "Fire Falcon Prime",
            "Baboon (Howler)",
         ],
    },
    {
        name: "Clan Elementals",
        groupLabel: "Star",
        tech: "clan",
        members: [
            "Elemental Battle Armor [Laser] (sqd5)",
            "Elemental Battle Armor [Laser] (sqd5)",
            "Elemental Battle Armor [Laser] (sqd5)",
            "Elemental Battle Armor [Laser] (sqd5)",
            "Elemental Battle Armor [Laser] (sqd5)",
        ],
    },
    {
        name: "Inner Sphere Command Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Marauder MAD-3R",
            "Archer ARC-2R",
            "Valkyrie VLK-QA",
            "Stinger STG-3R",
        ],
    },{
        name: "Inner Sphere Battle Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Warhammer WHM-6R",
            "Rifleman RFL-3N",
            "Phoenix Hawk PXH-1",
            "Wasp WSP-1A",
        ],
    },{
        name: "Inner Sphere Direct Fire Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Atlas AS7-D",
            "Marauder II MAD-4A",
            "Orion ON1-K",
            "Crusader CRD-3R",
        ],
    },{
        name: "Inner Sphere Heavy Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Banshee BNC-3S",
            "Grasshopper GHR-5H",
            "Centurion CN9-A",
            "Hatchetman HCT-3F",
        ],
    },{
        name: "Inner Sphere Striker Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Blackjack BJ-1",
            "Jenner JR7-D ",
            "Panther PNT-9R",
            "Wolfhound WLF-1",
        ],
    },{
        name: "Inner Sphere Fire Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Longbow LGB-0W",
            "Stalker STK-3F",
            "Zeus ZEU-6S",
            "Trebuchet TBT-5N",
        ],
    },{
        name: "Inner Sphere Heavy Battle Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Nightstar NSR-9J",
            "Cataphract CTF-1X",
            "Axman AXM-1N",
            "Bushwacker BSW-X1",
        ],
    },{
        name: "Inner Sphere Urban Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Victor VTR-9B",
            "Enforcer ENF-4R",
            "Hunchback HBK-4G",
            "Raven RVN-3M",
        ],
    },{
        name: "Inner Sphere Support Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Cyclops CP-10-Z",
            "Thug THG-11E",
            "Dragon DRG-1N",
            "Spider SDR-7M",
        ],
    },
    {
        name: "Wolf's Dragoons Assault Star",
        groupLabel: "Star",
        tech: "is+clan",
        members: [
            "Annihilator ANH-2A",
            "Mad Cat (Timber Wolf) Prime",
            "Rifleman RFL-3N",
            "Archer ARC-2W",
           "Blackjack BJ-2",
        ],
    },{
        name: "Eridani Light Horse Hunter Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Thunderbolt TDR-5SE",
            "Cyclops CP-11-A",
            "Banshee BNC-3S",
            "Sagittaire SGT-8R",
        ],
    },{
        name: "Hansen's Roughriders Battle Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Penetrator PTR-4D",
            "Hatchetman HCT-6D",
            "Enforcer ENF-5D",
            "Atlas AS7-D",
        ],
    },{
        name: "Northwind Highlanders Command Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Grasshopper GHR-5J",
            "Gunslinger GUN-1ERD",
            "Highlander HGN-732",
            "Warhammer WHM-7S",
        ],
    },{
        name: "Kell Hounds Striker Lance",
        groupLabel: "Lance",
        tech: "is+clan",
        members: [
            "Wolfhound WLF-6S",
            "Griffin C",
            "Crusader CRD-8R",
            "Nightsky NGS-7S",
        ],
    },{
        name: "Gray Death Legion Heavy Battle Lance",
        groupLabel: "Lance",
        tech: "is+clan",
        members: [
            "Regent Prime",
            "Man O' War (Gargoyle) C",
            "Catapult CPLT-K2K",
            "Shadow Hawk SHD-7H",
        ],
    },{
        name: "Snord's Irregulars Assault Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Spartan SPT-N2",
            "Hybrid Rifleman RFL-3N (Sneede)",
            "Guillotine GLT-3N",
            "Highlander HGN-732",
        ],
    },{
        name:"Somerset Strikers Force Pack",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Hatamoto-Chi HTM-27T",
            "Mauler MAL-1R",
            "Axman AXM-2N",
            "Bushwacker BSW-X1",
            "Wolfhound WLF-2",
        ],
    },{
        name: "McCarron's Armored Cavalry Assault Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Tian-Zong TNZ-N1",
            "Black Knight BL-12-KNT",
            "Awesome AWS-9Q",
            "Starslayer STY-3Dr",
        ],
    },{
        name: "Black Remnant Command Lance",
        groupLabel: "Lance",
        tech: "is+clan",
        members: [
            "Cyclops CP-11-H",
            "Flashman FLS-10E",
            "Star Adder (Blood Asp) I",
            "Dragon Fire DGR-3F",
        ],
    },{
        name: "BattleTech: Proliferation Cycle Pack",
        groupLabel: "Lance",
        tech: "is+clan",
        members: [
            "Battleaxe BKX-7K",
            "Ymir BWP-2B",
            "Coyotl D",
            "Firebee FRB-1E (WAM-B)",
            "Gladiator GLD-1R",
            "Icarus II ICR-1S",
            "Mackie MSK-5S",
         ],
    },{
        name: "BattleTech: UrbanMech Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "UrbanMech UM-R60L",
            "UrbanMech UM-R60",
            "UrbanMech UM-R27",
            "UrbanMech UM-R68",
        ],
    },{
        name: "ComStar Command Level II",
        groupLabel: "Level II",
        tech: "is",
        members: [
            "Black Knight BL-6-KNT",
            "Exterminator EXT-4A",
            "Highlander HGN-732",
            "King Crab KGC-000",
            "Mercury MCY-98",
            "Sentinel STN-3K",
        ],
    },{
        name: "ComStar Battle Level II",
        groupLabel: "Level II",
        tech: "is",
        members: [
            "Crab CRB-20",
            "Crockett CRK-5003-0",
            "Flashman FLS-7K",
            "Guillotine GLT-3N",
            "Lancelot LNC25-01",
            "Mongoose MON-66",
        ],
    },{
        name: "First Star League Command Lance",
        groupLabel: "Lance",
        tech: "Is",
        members: [
            "Atlas II AS7-D-H",
            "Thunder Hawk TDK-7S",
            "Orion ON1-K",
            'Phoenix Hawk PXH-1b "Special"',
         ],
    },{
        name: "Second Star League Assault Lance",
        groupLabel: "Lance",
        tech: "is+Clan",
        members: [
            "Daishi (Dire Wolf) \"Prometheus\"",
            "Emperor EMP-6A",
            "Argus AGS-4D",
            "Helios HEL-3D",
            "Coolant Truck 135-K \"Lifesaver\"",
        ],
    },{
        name: "Legendary MechWarriors Pack",
        groupLabel: "Lance",
        tech: "is+clan",
        members: [
            "Daishi (Dire Wolf) \"Widowmaker\"",
            "Archer ARC-2R",
            "Marauder MAD-3R",
            "Mad Cat (Timber Wolf) (Pryde)",
        ],
    },{
        name: "Legendary MechWarriors Pack II",
        groupLabel: "Lance",
        tech: "is+Clan",
        members: [
            "SM5 Field Commander (Prototype) Prime",
            "Devastator DVS-2",
            "Charger CGR-3K",
            "Marauder (Red Hunter-3146)",
            "Caesar CES-3R \"Archangel\"",
        ],
    },{
        name: "Legendary MechWarriors Pack III",
        groupLabel: "Lance",
        tech: "is+Clan",
        members: [
            "Marauder (Bounty Hunter-3015)",
            "Warhammer WHM-9K",
            "Griffin GRF-2N",
            "Mad Cat (Timber Wolf) (Bounty Hunter)",
            "Loki Mk II (Hel) Prime",
            "Marauder II (Bounty Hunter)",
        ],
    },{
        name: "Inner Sphere Battle Armor Platoon",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "IS Standard Battle Armor [Laser] (Sqd4)",
            "IS Standard Battle Armor [Laser] (Sqd4)",
            "IS Standard Battle Armor [Laser] (Sqd4)",
            "IS Standard Battle Armor [Laser] (Sqd4)",
        ],
    },{
        name: "Inner Sphere Security Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "JagerMech JM6-S",
            "Scorpion SCP-1N",
            "Vulcan VL-2T",
            "Whitworth WTH-1",
        ],
    },{
        name: "Inner Sphere Recon Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Firestarter FS9-H",
            "Spector SPR-5F",
            "Ostscout OTT-7J",
            "Javelin JVN-10N"
      ],
    },{
        name: "Inner Sphere Heavy Recon Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Charger CGR-1A1",
            "Ostroc OSR-2C",
            "Merlin MLN-1A",
            "Assassin ASN-109"
      ],
    },{
        name: "Battlefield Support: Fire Lance",
        groupLabel: "Lance",
        tech: "Is",
        members: [
            "SRM Carrier",
            "SRM Carrier",
            "LRM Carrier",
            "LRM Carrier",
         ],
    },{
        name:"Battlefield Support: Battle Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Manticore Heavy Tank",
            "Manticore Heavy Tank",
            "Vedette Medium Tank",
            "Vedette Medium Tank",
        ],
    },
    {
        name: "Battlefield Support: Cavalry Lance",
        groupLabel: "Lance",
        tech: "Is",
        members: [
            "Condor Heavy Hover Tank",
            "Condor Heavy Hover Tank",
            "Pegasus Scout Hover Tank",
            "Pegasus Scout Hover Tank",
         ],
    },{
        name: "Battlefield Support: Assault Lance",
        groupLabel: "Lance",
        tech: "Is",
        members: [
            "Schrek PPC Carrier",
            "Schrek PPC Carrier",
            "Demolisher Heavy Tank (Defensive)",
            "Demolisher Heavy Tank (Defensive)",
         ],
    },{
        name: "Battlefield Support: Command Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Von Luckner Heavy Tank VNL-K65N",
            "Von Luckner Heavy Tank VNL-K65N",
            "SturmFeur Heavy Tank",
            "SturmFeur Heavy Tank",
        ],
    },{
        name: "Battlefield Support: Rifle Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Bulldog Medium Tank",
            "Bulldog Medium Tank",
            "Hetzer Wheeled Assault Gun",
            "Hetzer Wheeled Assault Gun",
        ],
    },{
        name: "Battlefield Support: Sweep Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Drillson Heavy Hover Tank",
            "Drillson Heavy Hover Tank",
            "J. Edgar Light Hover Tank",
            "J. Edgar Light Hover Tank",
        ],
    },{
        name: "Battlefield Support: Heavy Battle Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
           "Patton Tank",
            "Patton Tank",
            "Pike Support Vehicle",
            "Pike Support Vehicle"
        ],
    },{
        name: "Battlefield Support: Hunter Lance",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Ontos Heavy Tank",
            "Ontos Heavy Tank",
            "Behemoth Heavy Tank",
            "Behemoth Heavy Tank"
        ],
    },{
        name: "Battlefield Support: Recon Lance",
        groupLabel: "Lance",
        tech: "Is",
        members: [
            "Warrior Attack Helicopter H-7",
            "Warrior Attack Helicopter H-7",
            "Skulker Wheeled Scout Tank",
            "Skulker Wheeled Scout Tank",
         ],
    },{
        name:"Battlefield Support: Objectives",
        groupLabel: "Lance",
        tech: "is",
        members: [
            "Mobile Long Tom Artillery LT-MOB-25",
            "Mobile Long Tom Artillery Ammunition Carriage LT-MOB-25",
            "M.A.S.H. Truck",
            "Mobile Headquarters",
        ],
    }
]
