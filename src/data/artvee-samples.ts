import type { IVehicleExport } from "../classes/vehicle";

/*
 * Sample ArtVees (Custom Homebrew): nine full vehicle designs, three combo guns in three patterns, loadable from the
 * Vehicle Creator's step 1 at the Custom Homebrew level. Every item is production technology in the sample's era
 * (the Armored Motive System is prototype only in these eras, so the Clan and MAP samples carry the creator's
 * "Armored Motive System recommended" advice). Clan standard AC ammunition is extinct from 2850, so the Clan samples
 * carry the custom Clan ArtVee breech ammunition (ammo-custom.ts) as their AC-profile bin.
 *
 * Flavour (spec lore): the Star League samples are 2700s builds, the Clan samples are the line the Clans kept after
 * the Exodus, and the MAP samples are the Inner Sphere rediscovery of 3071.
 */

type ArtVeeSaveData = Omit<IVehicleExport, "lastUpdated"> & { lastUpdated: string };

const SAMPLE_DATA: { id: string; name: string; save: ArtVeeSaveData }[] = [
    {
        id: "falconet",
        name: "Falconet ArtVee FLC-1",
        save: {
            "uuid": "38ce6051-0884-417c-25a8-d6f27699f06e",
            "lastUpdated": "2026-10-21T00:00:00.000Z",
            "name": "Falconet ArtVee",
            "model": "FLC-1",
            "nickname": "",
            "tonnage": 55,
            "motiveType": "tracked",
            "hasTurret": true,
            "dualTurret": false,
            "sponsonTurrets": false,
            "artVee": true,
            "jumpMP": 0,
            "tech": "is",
            "era": "star-league",
            "engineType": "xl",
            "cruiseMP": 4,
            "armorType": "ferro-fibrous",
            "armorAllocation": {
                "front": 38,
                "left": 38,
                "right": 38,
                "rear": 37,
                "turret": 37,
                "rotor": 0,
                "frontLeft": 0,
                "frontRight": 0,
                "rearLeft": 0,
                "rearRight": 0,
                "turret2": 0
            },
            "structureType": "standard",
            "heatSinkType": "single",
            "additionalHeatSinks": 0,
            "equipment": [
                {
                    "tag": "custom-artvee-thumper-combo",
                    "location": "turret",
                    "rear": false,
                    "uuid": "1cd4cb2d-1bce-4fe5-b667-862ee7c0e175"
                },
                {
                    "tag": "ammo-thumper-standard",
                    "rear": false,
                    "uuid": "b5176d0a-0e44-4642-3c58-3f965c005d63"
                },
                {
                    "tag": "ammo-is-ac-5-standard",
                    "rear": false,
                    "uuid": "bbbf30da-fb29-4fe7-9945-c74c40d9b7fd"
                },
                {
                    "tag": "machine-gun",
                    "location": "front",
                    "rear": false,
                    "uuid": "d084a3b4-d5ba-49dd-0895-e69acc8a5b62"
                },
                {
                    "tag": "machine-gun",
                    "location": "front",
                    "rear": false,
                    "uuid": "120078bb-6e4e-428d-a0ae-fa453c78f679"
                },
                {
                    "tag": "small-pulse-laser",
                    "location": "turret",
                    "rear": false,
                    "uuid": "73a9e881-7550-487e-164b-037bf6b65b98"
                },
                {
                    "tag": "searchlight",
                    "location": "front",
                    "rear": false,
                    "uuid": "8c5e5869-e888-4155-aba8-e2019f1a852a"
                },
                {
                    "tag": "custom-buckler-smoke-dispenser",
                    "location": "rear",
                    "rear": false,
                    "uuid": "2d58d494-bf52-4aa6-bca6-31db1911919e"
                },
                {
                    "tag": "ammo-machine-gun-standard",
                    "rear": false,
                    "uuid": "12f55dc4-04f3-46f2-218e-a071e17910a7"
                }
            ],
            "pilot": {
                "name": "",
                "piloting": 5,
                "gunnery": 4,
                "wounds": 0,
                "alphaStrikeAbilities": []
            }
        },
    },
    {
        id: "pangolin",
        name: "Pangolin ArtVee PNG-C",
        save: {
            "uuid": "0d08b714-f7bb-4ecb-202b-4a7ace7a259b",
            "lastUpdated": "2026-10-21T00:00:00.000Z",
            "name": "Pangolin ArtVee",
            "model": "PNG-C",
            "nickname": "",
            "tonnage": 45,
            "motiveType": "tracked",
            "hasTurret": true,
            "dualTurret": false,
            "sponsonTurrets": false,
            "artVee": true,
            "jumpMP": 0,
            "tech": "clan",
            "era": "clan-inv",
            "engineType": "clan_xl",
            "cruiseMP": 4,
            "armorType": "ferro-fibrous",
            "armorAllocation": {
                "front": 23,
                "left": 23,
                "right": 23,
                "rear": 23,
                "turret": 23,
                "rotor": 0,
                "frontLeft": 0,
                "frontRight": 0,
                "rearLeft": 0,
                "rearRight": 0,
                "turret2": 0
            },
            "structureType": "standard",
            "heatSinkType": "single",
            "additionalHeatSinks": 0,
            "equipment": [
                {
                    "tag": "custom-clan-artvee-thumper-combo",
                    "location": "turret",
                    "rear": false,
                    "uuid": "f328127f-5af7-478a-83a0-899ab8a2f9d9"
                },
                {
                    "tag": "ammo-thumper-standard",
                    "rear": false,
                    "uuid": "5eef361d-8ded-42dd-952d-24895862bc58"
                },
                {
                    "tag": "ammo-custom-clan-artvee-ac-5",
                    "rear": false,
                    "uuid": "fb18997d-473f-4e30-b3a9-c519e28b0358"
                },
                {
                    "tag": "clan-machine-gun",
                    "location": "front",
                    "rear": false,
                    "uuid": "5e64cdbb-68aa-4109-a8a3-57c97de4d476"
                },
                {
                    "tag": "clan-machine-gun",
                    "location": "front",
                    "rear": false,
                    "uuid": "2b327fd4-136f-4b02-2323-9ae93ea4e564"
                },
                {
                    "tag": "clan-small-pulse-laser",
                    "location": "turret",
                    "rear": false,
                    "uuid": "92fba7ac-7445-4337-14d5-5289c0df2346"
                },
                {
                    "tag": "clan-flamer",
                    "location": "rear",
                    "rear": false,
                    "uuid": "e50275dd-5535-415e-0f2a-2d73df7ef14b"
                },
                {
                    "tag": "ammo-machine-gun-standard",
                    "rear": false,
                    "uuid": "a3349b9b-1e4e-4365-9ab1-97ce3e06582f"
                }
            ],
            "pilot": {
                "name": "",
                "piloting": 5,
                "gunnery": 4,
                "wounds": 0,
                "alphaStrikeAbilities": []
            }
        },
    },
    {
        id: "springald",
        name: "Springald ArtVee SPR-1M",
        save: {
            "uuid": "793be10c-0409-4034-b3f3-0f5f57f71e91",
            "lastUpdated": "2026-10-21T00:00:00.000Z",
            "name": "Springald ArtVee",
            "model": "SPR-1M",
            "nickname": "",
            "tonnage": 45,
            "motiveType": "tracked",
            "hasTurret": true,
            "dualTurret": false,
            "sponsonTurrets": false,
            "artVee": true,
            "jumpMP": 0,
            "tech": "is",
            "era": "jihad",
            "engineType": "xl",
            "cruiseMP": 4,
            "armorType": "ferro-fibrous",
            "armorAllocation": {
                "front": 22,
                "left": 22,
                "right": 21,
                "rear": 21,
                "turret": 21,
                "rotor": 0,
                "frontLeft": 0,
                "frontRight": 0,
                "rearLeft": 0,
                "rearRight": 0,
                "turret2": 0
            },
            "structureType": "standard",
            "heatSinkType": "single",
            "additionalHeatSinks": 0,
            "equipment": [
                {
                    "tag": "custom-artvee-thumper-combo",
                    "location": "turret",
                    "rear": false,
                    "uuid": "c7110ab6-879e-4beb-b072-8879e58e529b"
                },
                {
                    "tag": "ammo-thumper-standard",
                    "rear": false,
                    "uuid": "8634ae8c-5420-4750-87a9-4077c26caccb"
                },
                {
                    "tag": "ammo-is-ac-5-standard",
                    "rear": false,
                    "uuid": "61bfda9d-b4a3-4f27-2555-d5ac414c50d8"
                },
                {
                    "tag": "machine-gun-light",
                    "location": "front",
                    "rear": false,
                    "uuid": "2ca6d074-c981-4667-a89a-125b6b3aa723"
                },
                {
                    "tag": "machine-gun-light",
                    "location": "front",
                    "rear": false,
                    "uuid": "1f6ac306-850e-4483-0ef4-ed83378f6cc8"
                },
                {
                    "tag": "small-pulse-laser",
                    "location": "turret",
                    "rear": false,
                    "uuid": "2aa8518d-0b31-4a24-2042-a4bea00181f9"
                },
                {
                    "tag": "ammo-is-light-machine-gun-standard",
                    "rear": false,
                    "uuid": "631a7645-47f9-44b8-b6ae-8ab3072dca3a"
                }
            ],
            "pilot": {
                "name": "",
                "piloting": 5,
                "gunnery": 4,
                "wounds": 0,
                "alphaStrikeAbilities": []
            }
        },
    },
    {
        id: "saker",
        name: "Saker ArtVee SKR-1",
        save: {
            "uuid": "bb3d1863-3de8-4f3c-260f-00b81dda02a3",
            "lastUpdated": "2026-10-21T00:00:00.000Z",
            "name": "Saker ArtVee",
            "model": "SKR-1",
            "nickname": "",
            "tonnage": 70,
            "motiveType": "tracked",
            "hasTurret": true,
            "dualTurret": false,
            "sponsonTurrets": false,
            "artVee": true,
            "jumpMP": 0,
            "tech": "is",
            "era": "star-league",
            "engineType": "xl",
            "cruiseMP": 4,
            "armorType": "ferro-fibrous",
            "armorAllocation": {
                "front": 40,
                "left": 40,
                "right": 39,
                "rear": 39,
                "turret": 39,
                "rotor": 0,
                "frontLeft": 0,
                "frontRight": 0,
                "rearLeft": 0,
                "rearRight": 0,
                "turret2": 0
            },
            "structureType": "standard",
            "heatSinkType": "single",
            "additionalHeatSinks": 0,
            "equipment": [
                {
                    "tag": "custom-artvee-sniper-combo",
                    "location": "turret",
                    "rear": false,
                    "uuid": "9baa6e2b-59aa-4c76-bef4-a3ee4159478a"
                },
                {
                    "tag": "ammo-sniper-standard",
                    "rear": false,
                    "uuid": "318a07b2-d8e4-41bd-154b-e49d0a5d5e28"
                },
                {
                    "tag": "ammo-is-ac-10-standard",
                    "rear": false,
                    "uuid": "5a69c012-c3d3-4423-81cd-a4d825e6bf0a"
                },
                {
                    "tag": "machine-gun",
                    "location": "front",
                    "rear": false,
                    "uuid": "e85e93ee-f7e9-4ddc-0bf9-cea483748ab7"
                },
                {
                    "tag": "machine-gun",
                    "location": "front",
                    "rear": false,
                    "uuid": "c4f3959d-3eb0-4388-13d4-51da9dc45964"
                },
                {
                    "tag": "medium-pulse-laser",
                    "location": "turret",
                    "rear": false,
                    "uuid": "6d86b8c3-c101-472e-860c-69a450053408"
                },
                {
                    "tag": "searchlight",
                    "location": "front",
                    "rear": false,
                    "uuid": "0f567110-28be-407a-1686-1a9fdc6048e7"
                },
                {
                    "tag": "custom-buckler-smoke-dispenser",
                    "location": "rear",
                    "rear": false,
                    "uuid": "108e0dd9-298c-4807-9ae5-0e0390097e50"
                },
                {
                    "tag": "ammo-machine-gun-standard",
                    "rear": false,
                    "uuid": "45aa1472-6b5c-4cb7-8123-fb96de787e53"
                }
            ],
            "pilot": {
                "name": "",
                "piloting": 5,
                "gunnery": 4,
                "wounds": 0,
                "alphaStrikeAbilities": []
            }
        },
    },
    {
        id: "archerfish",
        name: "Archerfish ArtVee ARF-C",
        save: {
            "uuid": "bfe70b67-a0c3-4de1-0e9b-7d22cba90f51",
            "lastUpdated": "2026-10-21T00:00:00.000Z",
            "name": "Archerfish ArtVee",
            "model": "ARF-C",
            "nickname": "",
            "tonnage": 65,
            "motiveType": "tracked",
            "hasTurret": true,
            "dualTurret": false,
            "sponsonTurrets": false,
            "artVee": true,
            "jumpMP": 0,
            "tech": "clan",
            "era": "clan-inv",
            "engineType": "clan_xl",
            "cruiseMP": 4,
            "armorType": "ferro-fibrous",
            "armorAllocation": {
                "front": 29,
                "left": 29,
                "right": 29,
                "rear": 29,
                "turret": 28,
                "rotor": 0,
                "frontLeft": 0,
                "frontRight": 0,
                "rearLeft": 0,
                "rearRight": 0,
                "turret2": 0
            },
            "structureType": "standard",
            "heatSinkType": "single",
            "additionalHeatSinks": 0,
            "equipment": [
                {
                    "tag": "custom-clan-artvee-sniper-combo",
                    "location": "turret",
                    "rear": false,
                    "uuid": "a25d150c-b67d-4f65-1b29-d70e563bd5f3"
                },
                {
                    "tag": "ammo-sniper-standard",
                    "rear": false,
                    "uuid": "c6042f2a-2970-4359-816d-6acb3bad0785"
                },
                {
                    "tag": "ammo-custom-clan-artvee-ac-10",
                    "rear": false,
                    "uuid": "f65d858e-ddc3-4c24-1153-dbe6c228d363"
                },
                {
                    "tag": "clan-machine-gun",
                    "location": "front",
                    "rear": false,
                    "uuid": "67306fd2-ea5d-40ab-2f5c-04c33917247b"
                },
                {
                    "tag": "clan-machine-gun",
                    "location": "front",
                    "rear": false,
                    "uuid": "05b19a2c-eb0e-47ee-999a-db6170714da0"
                },
                {
                    "tag": "clan_medium-pulse-laser",
                    "location": "turret",
                    "rear": false,
                    "uuid": "05c81172-0fa6-44c5-39ab-27267b31f629"
                },
                {
                    "tag": "clan-mech-mortar-1",
                    "location": "front",
                    "rear": false,
                    "uuid": "22167155-9d16-4620-0598-14bb19d232e9"
                },
                {
                    "tag": "clan-flamer",
                    "location": "rear",
                    "rear": false,
                    "uuid": "71615fea-a033-4d06-1e1a-2ba3fddc80a8"
                },
                {
                    "tag": "ammo-machine-gun-standard",
                    "rear": false,
                    "uuid": "8eea61f0-d16b-4630-aa68-55bd71236290"
                },
                {
                    "tag": "ammo-clan-mech-mortar-standard",
                    "rear": false,
                    "uuid": "0a026cf2-a467-4481-3d45-9d6f781d6fef"
                }
            ],
            "pilot": {
                "name": "",
                "piloting": 5,
                "gunnery": 4,
                "wounds": 0,
                "alphaStrikeAbilities": []
            }
        },
    },
    {
        id: "perrier",
        name: "Perrier ArtVee PER-1M",
        save: {
            "uuid": "7b12a433-0899-4ae5-0447-c10a328f889f",
            "lastUpdated": "2026-10-21T00:00:00.000Z",
            "name": "Perrier ArtVee",
            "model": "PER-1M",
            "nickname": "",
            "tonnage": 60,
            "motiveType": "tracked",
            "hasTurret": true,
            "dualTurret": false,
            "sponsonTurrets": false,
            "artVee": true,
            "jumpMP": 0,
            "tech": "is",
            "era": "jihad",
            "engineType": "xl",
            "cruiseMP": 4,
            "armorType": "ferro-fibrous",
            "armorAllocation": {
                "front": 29,
                "left": 29,
                "right": 29,
                "rear": 28,
                "turret": 28,
                "rotor": 0,
                "frontLeft": 0,
                "frontRight": 0,
                "rearLeft": 0,
                "rearRight": 0,
                "turret2": 0
            },
            "structureType": "standard",
            "heatSinkType": "single",
            "additionalHeatSinks": 0,
            "equipment": [
                {
                    "tag": "custom-artvee-sniper-combo",
                    "location": "turret",
                    "rear": false,
                    "uuid": "9b19d453-8166-4418-9b1a-7c1f1f28d97b"
                },
                {
                    "tag": "ammo-sniper-standard",
                    "rear": false,
                    "uuid": "7493a799-68c6-43bb-3e7d-83af61c4bbac"
                },
                {
                    "tag": "ammo-is-ac-10-standard",
                    "rear": false,
                    "uuid": "ffb57c62-f778-4305-32bb-3f5bc8602718"
                },
                {
                    "tag": "machine-gun-light",
                    "location": "front",
                    "rear": false,
                    "uuid": "daac94ed-6a45-41bc-39dc-a53d2e0e4438"
                },
                {
                    "tag": "machine-gun-light",
                    "location": "front",
                    "rear": false,
                    "uuid": "6c74e598-7880-46c7-08e6-a8755b50ed55"
                },
                {
                    "tag": "vehicle-flamer",
                    "location": "rear",
                    "rear": false,
                    "uuid": "c138dcb9-c151-4678-b9d0-25fe7ae7d8a8"
                },
                {
                    "tag": "custom-smoker",
                    "location": "rear",
                    "rear": false,
                    "uuid": "e4a18def-ec41-41b4-9b1b-5cb6dc2d9ae7"
                },
                {
                    "tag": "ammo-is-light-machine-gun-standard",
                    "rear": false,
                    "uuid": "fa6d8a1f-6d46-4456-a3b1-4564cd19e708"
                },
                {
                    "tag": "ammo-custom-smoker-fuel",
                    "rear": false,
                    "uuid": "d59676d2-dfaf-4e60-a0bc-8c8409ca68c2"
                }
            ],
            "pilot": {
                "name": "",
                "piloting": 5,
                "gunnery": 4,
                "wounds": 0,
                "alphaStrikeAbilities": []
            }
        },
    },
    {
        id: "culverin",
        name: "Culverin ArtVee CLV-1",
        save: {
            "uuid": "9a282083-4899-4bad-26bc-c0dacc5a0645",
            "lastUpdated": "2026-10-21T00:00:00.000Z",
            "name": "Culverin ArtVee",
            "model": "CLV-1",
            "nickname": "",
            "tonnage": 100,
            "motiveType": "tracked",
            "hasTurret": true,
            "dualTurret": false,
            "sponsonTurrets": false,
            "artVee": true,
            "jumpMP": 0,
            "tech": "is",
            "era": "star-league",
            "engineType": "xl",
            "cruiseMP": 3,
            "armorType": "ferro-fibrous",
            "armorAllocation": {
                "front": 59,
                "left": 59,
                "right": 59,
                "rear": 59,
                "turret": 59,
                "rotor": 0,
                "frontLeft": 0,
                "frontRight": 0,
                "rearLeft": 0,
                "rearRight": 0,
                "turret2": 0
            },
            "structureType": "standard",
            "heatSinkType": "single",
            "additionalHeatSinks": 0,
            "equipment": [
                {
                    "tag": "custom-artvee-long-tom-combo",
                    "location": "turret",
                    "rear": false,
                    "uuid": "ea9ef618-9942-4999-227f-9a92ee93b431"
                },
                {
                    "tag": "ammo-long-tom-standard",
                    "rear": false,
                    "uuid": "17906d34-fb35-4a48-a4ea-155a83db5b9d"
                },
                {
                    "tag": "ammo-is-ac-20-standard",
                    "rear": false,
                    "uuid": "55b76b96-1648-4eb2-89d3-5122706c63a0"
                },
                {
                    "tag": "machine-gun",
                    "location": "front",
                    "rear": false,
                    "uuid": "18106141-1c51-48dd-2f5f-3cf14a93e113"
                },
                {
                    "tag": "machine-gun",
                    "location": "front",
                    "rear": false,
                    "uuid": "ae301d2c-dec7-47d8-9df2-65e52a67be15"
                },
                {
                    "tag": "medium-pulse-laser",
                    "location": "turret",
                    "rear": false,
                    "uuid": "5314660c-cf52-41ce-3510-7c456a74a0b9"
                },
                {
                    "tag": "mech-mortar-1",
                    "location": "front",
                    "rear": false,
                    "uuid": "351059f8-2d8e-4ec9-3a49-b54f0cb570cf"
                },
                {
                    "tag": "vehicular-grenade-launcher",
                    "location": "rear",
                    "rear": false,
                    "uuid": "149ec2e2-98ae-4617-0c05-802489554a9e"
                },
                {
                    "tag": "searchlight",
                    "location": "front",
                    "rear": false,
                    "uuid": "3c892fdc-1f49-4f79-1ecd-c8ef31926fd3"
                },
                {
                    "tag": "custom-buckler-smoke-dispenser",
                    "location": "rear",
                    "rear": false,
                    "uuid": "84d7eca3-8606-403e-1bd8-de62081b9dcf"
                },
                {
                    "tag": "ammo-machine-gun-standard",
                    "rear": false,
                    "uuid": "d9d2379c-4a48-4bba-228e-d05275412236"
                },
                {
                    "tag": "ammo-is-mech-mortar-standard",
                    "rear": false,
                    "uuid": "30a5ceee-a103-449e-3501-b097d146100d"
                }
            ],
            "pilot": {
                "name": "",
                "piloting": 5,
                "gunnery": 4,
                "wounds": 0,
                "alphaStrikeAbilities": []
            }
        },
    },
    {
        id: "glyptodon",
        name: "Glyptodon ArtVee GLY-C",
        save: {
            "uuid": "69bda77a-6c6d-4c3f-0093-38dfefde121f",
            "lastUpdated": "2026-10-21T00:00:00.000Z",
            "name": "Glyptodon ArtVee",
            "model": "GLY-C",
            "nickname": "",
            "tonnage": 75,
            "motiveType": "tracked",
            "hasTurret": true,
            "dualTurret": false,
            "sponsonTurrets": false,
            "artVee": true,
            "jumpMP": 0,
            "tech": "clan",
            "era": "clan-inv",
            "engineType": "clan_xl",
            "cruiseMP": 3,
            "armorType": "ferro-fibrous",
            "armorAllocation": {
                "front": 35,
                "left": 35,
                "right": 34,
                "rear": 34,
                "turret": 34,
                "rotor": 0,
                "frontLeft": 0,
                "frontRight": 0,
                "rearLeft": 0,
                "rearRight": 0,
                "turret2": 0
            },
            "structureType": "standard",
            "heatSinkType": "single",
            "additionalHeatSinks": 0,
            "equipment": [
                {
                    "tag": "custom-clan-artvee-long-tom-combo",
                    "location": "turret",
                    "rear": false,
                    "uuid": "a51db94d-8637-4475-2e23-e28901c7cd2d"
                },
                {
                    "tag": "ammo-long-tom-standard",
                    "rear": false,
                    "uuid": "1adcc629-21f9-4722-b08e-4183374849a6"
                },
                {
                    "tag": "ammo-custom-clan-artvee-ac-20",
                    "rear": false,
                    "uuid": "110dd527-bfb8-42bb-8db2-a03cb4a88330"
                },
                {
                    "tag": "clan-machine-gun",
                    "location": "front",
                    "rear": false,
                    "uuid": "f961f173-a04b-4cab-3744-39794dc5067a"
                },
                {
                    "tag": "clan-machine-gun",
                    "location": "front",
                    "rear": false,
                    "uuid": "036a3ee2-5db1-45df-ba63-d8455d144566"
                },
                {
                    "tag": "clan_medium-pulse-laser",
                    "location": "turret",
                    "rear": false,
                    "uuid": "e8d7d4c0-8ca2-48b0-bfaa-7de5079d2627"
                },
                {
                    "tag": "clan-flamer",
                    "location": "rear",
                    "rear": false,
                    "uuid": "b4f474b3-cb59-4204-af0c-887de2d2d71b"
                },
                {
                    "tag": "ammo-machine-gun-standard",
                    "rear": false,
                    "uuid": "7f7f3fb1-7344-4018-23d4-13212ac3db7c"
                }
            ],
            "pilot": {
                "name": "",
                "piloting": 5,
                "gunnery": 4,
                "wounds": 0,
                "alphaStrikeAbilities": []
            }
        },
    },
    {
        id: "tormentum",
        name: "Tormentum ArtVee TRM-1M",
        save: {
            "uuid": "665c75d5-c706-4e62-a7d6-68f14cede5ff",
            "lastUpdated": "2026-10-21T00:00:00.000Z",
            "name": "Tormentum ArtVee",
            "model": "TRM-1M",
            "nickname": "",
            "tonnage": 75,
            "motiveType": "tracked",
            "hasTurret": true,
            "dualTurret": false,
            "sponsonTurrets": false,
            "artVee": true,
            "jumpMP": 0,
            "tech": "is",
            "era": "jihad",
            "engineType": "xl",
            "cruiseMP": 3,
            "armorType": "ferro-fibrous",
            "armorAllocation": {
                "front": 34,
                "left": 34,
                "right": 34,
                "rear": 34,
                "turret": 34,
                "rotor": 0,
                "frontLeft": 0,
                "frontRight": 0,
                "rearLeft": 0,
                "rearRight": 0,
                "turret2": 0
            },
            "structureType": "standard",
            "heatSinkType": "single",
            "additionalHeatSinks": 0,
            "equipment": [
                {
                    "tag": "custom-artvee-long-tom-combo",
                    "location": "turret",
                    "rear": false,
                    "uuid": "4be71f98-9be5-4731-2a43-f3a450ec524e"
                },
                {
                    "tag": "ammo-long-tom-standard",
                    "rear": false,
                    "uuid": "ba513e88-46b7-433f-2c06-6b9571a608b5"
                },
                {
                    "tag": "ammo-is-ac-20-standard",
                    "rear": false,
                    "uuid": "a38d2d94-048e-419c-a4ed-0fbd2ab05519"
                },
                {
                    "tag": "machine-gun",
                    "location": "front",
                    "rear": false,
                    "uuid": "5552ba9e-c4d8-4473-957b-7191ecaed007"
                },
                {
                    "tag": "machine-gun",
                    "location": "front",
                    "rear": false,
                    "uuid": "d226d766-6f84-4fa6-8903-12cd7a7c57db"
                },
                {
                    "tag": "vehicle-flamer",
                    "location": "rear",
                    "rear": false,
                    "uuid": "fbc9a42f-f7e9-42cf-9088-6a2e6d3b40b1"
                },
                {
                    "tag": "custom-smoker",
                    "location": "rear",
                    "rear": false,
                    "uuid": "bcbce563-8b7d-4d19-9067-6cb4cc0ef1e3"
                },
                {
                    "tag": "ammo-machine-gun-standard",
                    "rear": false,
                    "uuid": "58343a29-688e-45ac-8e4a-8c2c0d4af019"
                },
                {
                    "tag": "ammo-custom-smoker-fuel",
                    "rear": false,
                    "uuid": "07ac3723-89dc-4da9-b956-4675ac2d2da9"
                }
            ],
            "pilot": {
                "name": "",
                "piloting": 5,
                "gunnery": 4,
                "wounds": 0,
                "alphaStrikeAbilities": []
            }
        },
    },
];

export const ARTVEE_SAMPLES: { id: string; name: string; save: IVehicleExport }[] = SAMPLE_DATA.map((sample) => ({
    ...sample,
    save: { ...sample.save, lastUpdated: new Date(sample.save.lastUpdated) },
}));

/** The ArtVee is Custom Homebrew (rules level 6): below it there are no samples to offer. */
export const ARTVEE_SAMPLES_RULES_LEVEL = 6;

export function getArtVeeSamples(rulesLevel: number): { id: string; name: string; save: IVehicleExport }[] {
    return rulesLevel >= ARTVEE_SAMPLES_RULES_LEVEL ? ARTVEE_SAMPLES : [];
}
