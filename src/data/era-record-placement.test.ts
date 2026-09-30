import { describe, expect, it } from "vitest";
import { getStarLeagueCarryOverDates, parseTechYear } from "./equipment-registry";
import { mechClanAmmo } from "./mech-clan-ammo";
import { mechClanEquipmentArtillery } from "./mech-clan-equipment-weapons-artillery";
import { mechCustomEquipmentBallistic } from "./mech-custom-equipment-weapons-ballistic";
import { mechCustomEquipmentEnergy } from "./mech-custom-equipment-weapons-energy";
import { mechCustomEquipmentMisc } from "./mech-custom-equipment-weapons-misc";
import { mechHeatSinkTypes } from "./mech-heat-sink-types";
import { mechInternalStructureTypes } from "./mech-internal-structure-types";
import { mechISEquipmentArtillery } from "./mech-is-equipment-weapons-artillery";
import { mechISEquipmentEnergy } from "./mech-is-equipment-weapons-energy";
import { mechClanEquipmentMisc } from "./mech-clan-equipment-weapons-misc";
import { mechISAmmo } from "./mech-is-ammo";
import { mechISEquipmentMisc } from "./mech-is-equipment-weapons-misc";
import { mechUniversalAmmo } from "./mech-universal-ammo";
import { mechUniversalEquipment } from "./mech-universal-equipment";

const hasTag = (list: { tag: string }[], tag: string) => list.some((item) => item.tag === tag);

describe("records whose IS and Clan dates differ are not universal", () => {
    it("keeps Listen-Kill ammo Inner Sphere only (IO p.62: IS, prototype 3037, extinct 3040)", () => {
        for (const launcher of ["lrm", "srm"]) {
            expect(hasTag(mechUniversalAmmo, `ammo-${launcher}-listen-kill`)).toBe(false);
            const ammo = mechISAmmo.find((item) => item.tag === `ammo-is-${launcher}-listen-kill`)!;
            expect(ammo.altTags).toContain(`ammo-${launcher}-listen-kill`);
            expect(ammo).toMatchObject({ introduced: null, prototype: 3037, extinct: 3040 });
        }
    });

    it("splits the Laser Insulator: the IS lost it in 2820, the Clans never did (IO p.44, p.63)", () => {
        expect(hasTag(mechUniversalEquipment, "laser-insulator")).toBe(false);
        expect(mechISEquipmentMisc.find((item) => item.tag === "laser-insulator"))
            .toMatchObject({ extinct: 2820, reintroduced: 3073 });
        const clan = mechClanEquipmentMisc.find((item) => item.tag === "clan-laser-insulator")!;
        expect(clan.altTags).toContain("laser-insulator");
        expect(clan.extinct).toBeNull();
    });
});

describe("artillery cannons split by side (IO p.37, p.59; TO:AUE p.97)", () => {
    it("keeps the IS cannons and shells in production from 3079/3072, and the Clan ones prototype-only (3032)", () => {
        for (const gun of ["long-tom", "sniper", "thumper"]) {
            expect(hasTag(mechUniversalEquipment, `${gun}-cannon`)).toBe(false);
            expect(mechISEquipmentArtillery.find((item) => item.tag === `${gun}-cannon`))
                .toMatchObject({ prototype: 3012, introduced: 3079 });
            const clan = mechClanEquipmentArtillery.find((item) => item.tag === `clan-${gun}-cannon`)!;
            expect(clan).toMatchObject({ prototype: 3032, introduced: null });
            expect(clan.altTags).toContain(`${gun}-cannon`);

            expect(hasTag(mechUniversalAmmo, `ammo-${gun}-cannon-standard`)).toBe(false);
            expect(mechISAmmo.find((item) => item.tag === `ammo-is-${gun}-cannon-standard`))
                .toMatchObject({ prototype: 3012, introduced: 3072 });
            expect(mechClanAmmo.find((item) => item.tag === `ammo-clan-${gun}-cannon-standard`))
                .toMatchObject({ prototype: 3032, introduced: null });
        }
    });
});

describe("date corrections", () => {
    it("dates every PPC capacitor combination to production in 3081 (project decision)", () => {
        const prototypes: Record<string, number> = {
            "light-ppc-capacitor": 3064, "ppc-capacitor": 3060, "heavy-ppc-capacitor": 3062,
            "er-ppc-capacitor": 3060, "snub-nose-ppc-capacitor": 3067,
        };
        for (const [tag, prototype] of Object.entries(prototypes)) {
            expect(mechISEquipmentEnergy.find((item) => item.tag === tag), tag).toMatchObject({ introduced: 3081, prototype });
        }
    });

    it("makes standard structure available from the first 'Mech (IO p.48: prototype 2430, production 2439)", () => {
        expect(mechInternalStructureTypes.find((item) => item.tag === "standard"))
            .toMatchObject({ prototype: 2430, introduced: 2439 });
    });

    it("dates custom items from the canon item they are built on (IO p.38, p.43, p.45)", () => {
        expect(mechCustomEquipmentBallistic.find((item) => item.tag === "custom-ac-15"))
            .toMatchObject({ prototype: 2488, introduced: 2500 }); // AC/20
        expect(mechCustomEquipmentEnergy.find((item) => item.tag === "custom-disruptor"))
            .toMatchObject({ prototype: 2306, introduced: 2316 }); // Large Laser
        expect(mechCustomEquipmentMisc.find((item) => item.tag === "custom-null-signature-system"))
            .toMatchObject({ prototype: 2615, introduced: 2630, extinct: 2790, reintroduced: 3110 }); // Null-Signature System
    });
});

describe("tech date helpers", () => {
    it("reads blank, zero and invalid years as unknown (null)", () => {
        expect(parseTechYear("")).toBeNull();
        expect(parseTechYear("  ")).toBeNull();
        expect(parseTechYear(undefined)).toBeNull();
        expect(parseTechYear(null)).toBeNull();
        expect(parseTechYear(0)).toBeNull();
        expect(parseTechYear("-5")).toBeNull();
        expect(parseTechYear("abc")).toBeNull();
        expect(parseTechYear("3050")).toBe(3050);
        expect(parseTechYear(2827.4)).toBe(2827);
    });

    it("carries Star League equipment over to the Clans until their own version enters production", () => {
        const doubleHeatSink = mechHeatSinkTypes.find((item) => item.tag === "double")!;
        expect(getStarLeagueCarryOverDates(doubleHeatSink)).toMatchObject({ introduced: 2567, extinct: 2827, reintroduced: null });
        // Nothing to carry over: no separate Clan dates, or introduced after the Star League fell.
        expect(getStarLeagueCarryOverDates({ introduced: 2567, extinct: null, reintroduced: null })).toBeNull();
        expect(getStarLeagueCarryOverDates({ introduced: 3040, extinct: null, reintroduced: null,
            clanDates: { introduced: 3050, extinct: null, reintroduced: null } })).toBeNull();
    });
});
