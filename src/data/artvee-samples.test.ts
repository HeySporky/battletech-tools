import { describe, expect, it } from "vitest";
import Vehicle from "../classes/vehicle";
import { getArtVeeIssues, getArtVeeWarnings } from "../classes/vehicle-artvee";
import { ARTVEE_SAMPLES, getArtVeeSamples } from "./artvee-samples";
import { getCompatibleAmmo } from "./equipment-registry";

const load = (save: unknown): Vehicle => new Vehicle(JSON.stringify(save));

/** Everything on the vehicle that is not production technology in its era (prototype-only, or not offered at all). */
function getNonProductionItems(vehicle: Vehicle): string[] {
    const found: string[] = [];
    const engine = vehicle.getAvailableEngineTypes(6).find((option) => option.tag === vehicle.getEngineType().tag);
    if (!engine || !engine.available || engine.availableAsPrototype) found.push(`engine ${vehicle.getEngineType().tag}`);
    const armor = vehicle.getAvailableArmorTypes(6).find((option) => option.tag === vehicle.getArmorType().tag);
    if (!armor || !armor.available || armor.availableAsPrototype) found.push(`armor ${vehicle.getArmorType().tag}`);
    const offered = vehicle.getAvailableEquipment(true, 6);
    for (const item of vehicle.getEquipmentList()) {
        const option = offered.find((entry) => entry.tag === item.tag);
        if (!option) found.push(`${item.tag} not offered`);
        else if (option.availableAsPrototype) found.push(`${item.tag} prototype only`);
        else if (!option.available && !option.maxPerUnit) found.push(`${item.tag} not in production`);
    }
    for (const mod of vehicle.getChassisModifications()) {
        if (!vehicle.getAvailableChassisModifications(6).includes(mod)) found.push(`chassis ${mod.tag}`);
    }
    return found;
}

describe("sample ArtVees", () => {
    it("counts the Clan Long Tom combo gun at 560 in the Glyptodon's BV (ArtVee final review 2026-10-21)", () => {
        const sample = ARTVEE_SAMPLES.find((entry) => entry.id === "glyptodon")!;
        expect(load(sample.save).getBattleValueLog()).toContain("ArtVee Long Tom Combo Gun (Clan) (turret) = 560.00");
    });

    it("are the nine named designs", () => {
        expect(ARTVEE_SAMPLES.map((sample) => sample.name)).toEqual([
            "Falconet ArtVee FLC-1", "Pangolin ArtVee PNG-C", "Springald ArtVee SPR-1M",
            "Saker ArtVee SKR-1", "Archerfish ArtVee ARF-C", "Perrier ArtVee PER-1M",
            "Culverin ArtVee CLV-1", "Glyptodon ArtVee GLY-C", "Tormentum ArtVee TRM-1M",
        ]);
        expect(new Set(ARTVEE_SAMPLES.map((sample) => sample.id)).size).toBe(9);
    });

    it("are offered at Custom Homebrew and above only", () => {
        expect(getArtVeeSamples(5)).toEqual([]);
        expect(getArtVeeSamples(6)).toHaveLength(9);
    });

    it("the production check flags prototype-only technology", () => {
        const sample = load(ARTVEE_SAMPLES[0].save);
        expect(getNonProductionItems(sample)).toEqual([]);
        sample.setEngineType("xxl");
        expect(getNonProductionItems(sample)).toEqual(["engine xxl"]);
    });

    describe.each(ARTVEE_SAMPLES.map((sample) => [sample.name, sample] as const))("%s", (_name, sample) => {
        const vehicle = load(sample.save);

        it("loads with no import issues and no ArtVee issues", () => {
            expect(vehicle.getImportIssues()).toEqual([]);
            expect(vehicle.isArtVee()).toBe(true);
            expect(getArtVeeIssues(vehicle)).toEqual([]);
        });

        it("is fully used: no tonnage left, slots within the limit, armor at least half the maximum", () => {
            expect(vehicle.getRemainingTonnage()).toBe(0);
            expect(vehicle.getUsedItemSlots()).toBeLessThanOrEqual(vehicle.getTotalItemSlots());
            expect(vehicle.getTotalArmorPoints()).toBeGreaterThanOrEqual(vehicle.getMaxArmorPoints() / 2);
        });

        it("carries at least 1 ton of AC-profile ammunition its combo gun accepts, and 1 ton of its artillery ammunition", () => {
            const equipment = vehicle.getEquipmentList();
            const gun = equipment.find((item) => item.comboArtilleryTag)!;
            const acAmmo = equipment.filter((item) => item.isAmmo && gun.ammoTypes?.[1] === item.tag);
            const artilleryAmmo = equipment.filter((item) => item.isAmmo && gun.ammoTypes?.[0] === item.tag);
            expect(acAmmo.reduce((tons, item) => tons + item.weight, 0)).toBeGreaterThanOrEqual(1);
            expect(artilleryAmmo.reduce((tons, item) => tons + item.weight, 0)).toBeGreaterThanOrEqual(1);
            for (const item of [...acAmmo, ...artilleryAmmo]) expect(getCompatibleAmmo(gun, item)).toBe(true);
        });

        it("feeds every ammunition bin to a weapon it carries", () => {
            const equipment = vehicle.getEquipmentList();
            const weapons = equipment.filter((item) => !item.isAmmo);
            for (const bin of equipment.filter((item) => item.isAmmo)) {
                expect(weapons.some((weapon) => getCompatibleAmmo(weapon, bin)), bin.tag).toBe(true);
            }
        });

        it("uses production technology only", () => {
            expect(getNonProductionItems(vehicle)).toEqual([]);
        });

        it("has no warning except the Armored Motive System advice", () => {
            expect(getArtVeeWarnings(vehicle, 6).filter((warning) => warning !== "Armored Motive System recommended")).toEqual([]);
        });

        it("exports and reloads identically with the same Battle Value", () => {
            const reloaded = load(vehicle.export());
            expect(reloaded.getImportIssues()).toEqual([]);
            expect(reloaded.getBattleValue()).toBe(vehicle.getBattleValue());
            expect(JSON.stringify(reloaded.export())).toBe(JSON.stringify(vehicle.export()));
        });
    });
});
