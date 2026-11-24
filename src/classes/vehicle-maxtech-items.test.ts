import { describe, expect, it } from "vitest";
import { buildVehicle } from "../test-support/builders";
import { COMBAT_VEHICLE_CHASSIS_MODIFICATIONS } from "../data/combat-vehicle-chassis-modifications";
import { getEquipmentCatalogDefinitions } from "../data/equipment-registry";
import { getEditionStats, isOfferedInEdition } from "../data/rules-editions";

// Maximum Tech's Level 3 vehicle items under the Master Rules (#624): the bulldozer blade (p.87), amphibious vehicles and dune buggies
// (p.88), with the BV each adds on p.92 (bulldozer +10 to the base Defensive Battle Rating, amphibious +0.1 and dune buggy +0.05 to
// the Vehicle Type Modifier). A Combat Vehicle can only be built under Total Warfare so far, so these are the records' standing in the
// Master Rules editions (what a BV1 edition's vehicle may carry), checked against the BV1 their figures give.
const MASTER = ["master-rules", "master-rules-revised"];
const bulldozer = () => getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment).find((item) => item.tag === "bulldozer")!;
const mod = (tag: string) => COMBAT_VEHICLE_CHASSIS_MODIFICATIONS.find((entry) => entry.tag === tag)!;
const offered = (edition: string, level: number) => COMBAT_VEHICLE_CHASSIS_MODIFICATIONS.filter((entry) => isOfferedInEdition(entry, edition, level)).map((entry) => entry.tag).sort();

describe("amphibious vehicles and dune buggies (Maximum Tech p.88)", () => {
    it.each(MASTER)("%s offers amphibious capability and the dune buggy at Level 3, and nothing else", (edition) => {
        expect(offered(edition, 3)).toEqual(["dune-buggy", "fully-amphibious"]);
        expect(offered(edition, 2)).toEqual([]);
    });

    it("leaves Total Warfare's list as it was, and the earlier editions without them", () => {
        expect(offered("total-warfare", 3)).toEqual(["dune-buggy", "environmental-sealing", "flotation-hull", "fully-amphibious", "limited-amphibious"]);
        expect(offered("citytech-2nd-edition", 3)).toEqual([]);
    });

    it.each(MASTER)("prints Maximum Tech's page and a note for each in %s", (edition) => {
        for (const tag of ["fully-amphibious", "dune-buggy"]) {
            expect(getEditionStats(mod(tag), edition)).toMatchObject({ book: "MaxTech", page: 88 });
            expect(getEditionStats(mod(tag), edition)?.notes).toMatch(/Level 3/);
        }
    });

    it("adds 0.05 for a dune buggy to the Vehicle Type Modifier in BV1 (Maximum Tech p.92: wheeled 0.7 to 0.75), 0.1 under Total Warfare BV", () => {
        const plain = buildVehicle("wheeled", 50);
        const dune = buildVehicle("wheeled", 50);
        dune.setChassisModification("dune-buggy", true, 3);
        expect(dune.getChassisModifications().map((entry) => entry.tag)).toEqual(["dune-buggy"]);
        const typeModifier = (vehicle: typeof plain) => vehicle.getBattleValueBreakdown("master-rules-revised").steps.find((step) => step.id === "cv.bv1.def.type")?.value;
        expect(typeModifier(dune)).toBe(0.75);
        expect(typeModifier(plain)).toBe(0.7);
        expect(dune.getBattleValueLog("total-warfare")).toContain("+0.1");
    });
});

describe("the bulldozer blade (Maximum Tech p.87)", () => {
    it.each(MASTER)("is a Level 3 item of %s: 2 tons, 20,000 C-bills (10,000 x its tons), on tracked and wheeled vehicles", (edition) => {
        const item = bulldozer();
        expect(isOfferedInEdition(item, edition, 3)).toBe(true);
        expect(isOfferedInEdition(item, edition, 2)).toBe(false);
        expect(getEditionStats(item, edition)).toMatchObject({ book: "MaxTech", page: 87, weight: 2, cbills: 20000 });
        expect(getEditionStats(item, edition)?.notes).toMatch(/tracked and wheeled/);
    });

    it("is still Total Warfare's at the price the Technical Manual prints, at Standard rules", () => {
        expect(bulldozer().cbills).toBe(50000);
        expect(isOfferedInEdition(bulldozer(), "total-warfare", 2)).toBe(true);
    });

    it("adds 10 to the base Defensive Battle Rating in BV1 (Maximum Tech p.92)", () => {
        const plain = buildVehicle("tracked", 50);
        const dozer = buildVehicle("tracked", 50);
        dozer.addEquipmentFromTag("bulldozer", "front");
        expect(dozer.getBattleValue("master-rules-revised")).toBeGreaterThan(plain.getBattleValue("master-rules-revised"));
    });
});

// The minesweeper (+30) and coolant system (+15) go to the base Defensive Battle Rating in BV1 (Maximum Tech p.92).
describe("additional crew (Maximum Tech pp.87, 92)", () => {
    const crew = () => getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment).find((item) => item.tag === "additional-crew")!;

    it.each(MASTER)("is a Level 3 item of %s: half a ton, 1 item, 5,000 C-bills each, Combat Vehicles only", (edition) => {
        expect(isOfferedInEdition(crew(), edition, 3)).toBe(true);
        expect(isOfferedInEdition(crew(), edition, 2)).toBe(false);
        expect(getEditionStats(crew(), edition)).toMatchObject({ book: "MaxTech", page: 87, weight: 0.5, criticals: 1, cbills: 5000 });
        expect(crew().space).toMatchObject({ combatVehicle: 1, supportVehicle: -1 });
    });

    it("adds 2 to the base Weapon Battle Rating in BV1 for each extra crewman", () => {
        const plain = buildVehicle("tracked", 50);
        const crowded = buildVehicle("tracked", 50);
        crowded.addEquipmentFromTag("additional-crew", "body");
        crowded.addEquipmentFromTag("additional-crew", "body");
        expect(crowded.getBattleValueLog("master-rules-revised")).toContain("Level 3 4 ");
        expect(plain.getBattleValueLog("master-rules-revised")).not.toContain("Level 3 ");
    });
});

describe("the minesweeper and coolant system in BV1 (Maximum Tech p.92)", () => {
    // The BV1 defensive subtotal step lists "defensive gear N" in its detail.
    const defensiveGear = (vehicle: ReturnType<typeof buildVehicle>) => vehicle.getBattleValueBreakdown("master-rules-revised").steps.find((step) => step.id === "cv.bv1.def.subtotal")?.detail ?? "";
    it("adds 30 to the base Defensive Battle Rating for a minesweeper", () => {
        const sweeper = buildVehicle("tracked", 50);
        sweeper.addEquipmentFromTag("minesweeper", "front");
        expect(defensiveGear(sweeper)).toContain("defensive gear 30");
    });
    it("adds 15 to the base Defensive Battle Rating for each coolant system", () => {
        const truck = buildVehicle("tracked", 50);
        truck.addEquipmentFromTag("vehicle-coolant-system", "body");
        truck.addEquipmentFromTag("vehicle-coolant-system", "body");
        expect(defensiveGear(truck)).toContain("defensive gear 30");
    });
});
