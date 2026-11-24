import type { IBattleArmorExport } from "../classes/battle-armor";

/*
 * Sample battle armor (Custom Homebrew): the Hardsuit PA(L) and the Hardsuit PA(L) VTOL, the suits Pleiades Mechworks built the
 * Pilot Suit on (u/PleiadesMechworks, r/NormalBattletech; the two record sheets are in the ResourceLibrary, scrapes/reddit/1rbyavi*).
 * They ship with the app like the VTOLAMs: the roster's unit search adds them from the custom unit list
 * (sample-mul.ts). Both are built from the sheets: squad of 5, ground 3, two Armored Gloves, 2 points of Standard (Basic) armor;
 * the Hardsuit jumps 3 with a Fuel Tank and 45 kg of Mission Equipment Storage, the VTOL is Clan technology with VTOL 7 and
 * 10 kg of storage. Dates are ours: the Hardsuit 2768 (late Star League), the VTOL 3083 (the post). `sheet` is the BV/PV the
 * sheet prints: the point values match our Alpha Strike conversion; the Battle Values do not (ours are lower), and the VTOL
 * as printed weighs 450 kg against the 400 kg of the PA(L) class, which the creator flags.
 */

export const BATTLE_ARMOR_SAMPLES_CREDIT = "Custom Homebrew by u/PleiadesMechworks (r/NormalBattletech, Pleiades Mechworks equipment post and record sheets).";

export const BATTLE_ARMOR_SAMPLES: { id: string; name: string; sheet: string; save: IBattleArmorExport }[] = [
    {
        id: "hardsuit-pa-l",
        name: "Hardsuit PA(L)",
        sheet: "63/9",
        save: {
            "uuid": "f1602e66-c2e9-462c-b9bd-06d5ad1effa1",
            "lastUpdated": "2026-11-21T00:00:00.000Z",
            "name": "Hardsuit PA(L)",
            "techBase": "is",
            "weightClass": "pa-l",
            "bodyType": "humanoid",
            "groundMP": 3,
            "motive": "jump",
            "motiveMP": 3,
            "arms": {
                "la": {
                    "manipulator": "armored-glove",
                    "adaptor": false,
                    "cargoHalfTons": 1
                },
                "ra": {
                    "manipulator": "armored-glove",
                    "adaptor": false,
                    "cargoHalfTons": 1
                }
            },
            "armor": "ba-standard",
            "armorPoints": 2,
            "items": [
                {
                    "tag": "is-fuel-tank",
                    "location": "body",
                    "uuid": "hardsuit-pa-l-is-fuel-tank"
                },
                {
                    "tag": "is-mission-equipment",
                    "location": "body",
                    "uuid": "hardsuit-pa-l-is-mission-equipment",
                    "kg": 45
                }
            ],
            "apMounts": [],
            "squadSize": 5,
            "gunnery": 4,
            "antiMech": 5,
            "era": "star-league"
        },
    },
    {
        id: "hardsuit-pa-l-vtol",
        name: "Hardsuit PA(L) VTOL",
        sheet: "84/12",
        save: {
            "uuid": "fa0d097e-8693-46ab-acc3-7b2c1c866486",
            "lastUpdated": "2026-11-21T00:00:00.000Z",
            "name": "Hardsuit PA(L) VTOL",
            "techBase": "clan",
            "weightClass": "pa-l",
            "bodyType": "humanoid",
            "groundMP": 3,
            "motive": "vtol",
            "motiveMP": 7,
            "arms": {
                "la": {
                    "manipulator": "armored-glove",
                    "adaptor": false,
                    "cargoHalfTons": 1
                },
                "ra": {
                    "manipulator": "armored-glove",
                    "adaptor": false,
                    "cargoHalfTons": 1
                }
            },
            "armor": "ba-standard",
            "armorPoints": 2,
            "items": [
                {
                    "tag": "clan-mission-equipment",
                    "location": "body",
                    "uuid": "hardsuit-pa-l-vtol-clan-mission-equipment",
                    "kg": 10
                }
            ],
            "apMounts": [],
            "squadSize": 5,
            "gunnery": 4,
            "antiMech": 5,
            "era": "jihad"
        },
    },
];
