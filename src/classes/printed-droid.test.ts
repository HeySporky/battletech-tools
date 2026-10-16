import { describe, expect, it } from "vitest";
import { APOCRYPHAL_RULES_LEVEL, CUSTOM_HOMEBREW_RULES_LEVEL } from "../data/rules-level-options";
import { battledroidsPrintedDroids, getPrintedDroids, IPrintedDroid } from "../data/battledroids-mechs";
import { editionAllowsConstruction, getRulesEdition } from "../data/rules-editions";
import { BattleMech } from "./battlemech";
import { buildPrintedDroid, isUnmodifiedPrintedDroid, getPrintedTurretCriticals, getUnallocatedCriticals } from "./printed-droid";

const droid = (id: string): IPrintedDroid => battledroidsPrintedDroids.find(entry => entry.id === id)!;

const codes: Record<string, string> = {
    head: "hd", centerTorso: "ct", leftTorso: "lt", rightTorso: "rt", leftArm: "la", rightArm: "ra", leftLeg: "ll", rightLeg: "rl",
};

// Each mounted item once, as "tag location", with "(R)" when it faces rear; sorted so the order does not matter.
const mounted = (mech: BattleMech): string[] => {
    const seen = new Set<string>();
    const found: string[] = [];
    const criticals = mech.getCriticals() as unknown as Record<string, ({ uuid: string; tag: string; rear: boolean; obj?: unknown } | null)[]>;
    for (const [key, slots] of Object.entries(criticals)) {
        for (const slot of slots ?? []) {
            if (slot && codes[key] && !seen.has(slot.uuid) && mech.getInstalledEquipment().some(item => item.uuid === slot.uuid)) {
                seen.add(slot.uuid);
                found.push(`${slot.tag} ${codes[key]}${slot.rear ? "(R)" : ""}`);
            }
        }
    }
    return found.sort();
};

const armor = (mech: BattleMech) => {
    const a = mech.export().armor_allocation;
    return [a.head, a.centerTorso, a.centerTorsoRear, a.leftTorso, a.leftTorsoRear, a.rightTorso, a.rightTorsoRear, a.leftArm, a.rightArm, a.leftLeg, a.rightLeg];
};

// Building a droid is slow: each is built once and shared by the tests that only read it.
const builds = new Map<string, BattleMech>();
const built = (id: string): BattleMech => builds.get(id) ?? builds.set(id, buildPrintedDroid(droid(id))).get(id)!;

const BOOK = ["stg-3r", "wsp-1a", "pxh-1k", "grf-1n", "shd-2h", "rfl-3n", "crd-3r", "arc-2r", "whm-6r", "mad-3r"];

// BD p.16 (STG-3R, GRF-1N, ARC-2R, SHD-2H, WHM-6R) and p.17 (PXH-1K, WSP-1A, CRD-3R, MAD-3R, RFL-3N), the record listings.
describe("Printed Battledroids droids: the ten of the box set", () => {
    const listing = (id: string, page: number, stats: number[], armorBoxes: number[], items: string[], tons: number) => {
        const entry = droid(id);
        const mech = built(id);
        expect([entry.rulesLevel, entry.source, entry.page], id).toEqual([0, "BD", page]);
        expect([mech.getTonnage(), mech.getWalkSpeed(), mech.getJumpSpeed(), mech.getHeatSinks(), entry.printedArmorFactor], id).toEqual(stats);
        expect(armor(mech), id).toEqual(armorBoxes);
        expect(mounted(mech), id).toEqual(items);
        expect(mech.getCurrentTonnage(), id).toBe(tons);
        return entry.notes.join(" ");
    };

    it("STG-3R Stinger: armor boxes add up to 69 against the printed 64, a ton over", () => {
        const notes = listing("stg-3r", 16, [20, 6, 6, 10, 64], [9, 10, 4, 7, 2, 7, 2, 6, 6, 8, 8],
            ["ammo-machine-gun-standard ct", "machine-gun la", "machine-gun ra", "medium-laser ra"], 21);
        expect(notes).toContain("69");
        expect(notes).toContain("a ton over");
    });
    it("WSP-1A Wasp: a ton over", () => {
        const notes = listing("wsp-1a", 17, [20, 6, 6, 10, 64], [6, 10, 4, 7, 2, 7, 2, 6, 6, 7, 7],
            ["ammo-srm-standard ct", "medium-laser ra", "srm-2 ll"], 21);
        expect(notes).toContain("a ton over");
    });
    it("PXH-1K Phoenix Hawk", () => {
        listing("pxh-1k", 17, [45, 6, 6, 10, 128], [6, 25, 5, 18, 3, 18, 3, 10, 10, 15, 15],
            ["ammo-machine-gun-standard ct", "large-laser ra", "machine-gun la", "machine-gun ra", "medium-laser la", "medium-laser ra"], 45);
    });
    it("GRF-1N Griffin", () => {
        listing("grf-1n", 16, [55, 5, 6, 12, 144], [8, 20, 6, 20, 6, 20, 6, 13, 13, 16, 16],
            ["ammo-lrm-standard rt", "ammo-lrm-standard rt", "lrm-10 rt", "standard-ppc ra"], 55);
    });
    it("SHD-2H Shadow Hawk", () => {
        listing("shd-2h", 16, [55, 5, 3, 12, 152], [9, 23, 8, 18, 6, 18, 6, 16, 16, 16, 16],
            ["ammo-is-ac-5-standard lt", "ammo-lrm-standard lt", "ammo-srm-standard lt", "autocannon-standard-b lt", "lrm-5 rt", "medium-laser ra", "srm-2 hd"], 55);
    });
    it("RFL-3N Rifleman: the VOX 260 printed is larger than its Walking MP needs", () => {
        const entry = droid("rfl-3n");
        const notes = listing("rfl-3n", 17, [60, 4, 0, 10, 120], [6, 22, 4, 15, 2, 15, 2, 15, 15, 12, 12],
            ["ammo-is-ac-5-standard ct", "autocannon-standard-b la", "autocannon-standard-b ra", "large-laser la", "large-laser ra"],
            built("rfl-3n").getCurrentTonnage());
        expect(entry.engineRating).toBe(260);
        expect(built("rfl-3n").getEngineRating()).toBe(240);
        expect(notes).toContain("VOX 260");
    });
    it("CRD-3R Crusader: half a ton under", () => {
        const notes = listing("crd-3r", 17, [65, 4, 0, 10, 184], [6, 30, 8, 24, 6, 24, 6, 20, 20, 20, 20], [
            "ammo-lrm-standard lt", "ammo-lrm-standard rt", "ammo-machine-gun-standard ct", "ammo-srm-standard ct", "lrm-15 la", "lrm-15 ra",
            "machine-gun la", "machine-gun ra", "medium-laser la", "medium-laser ra", "srm-6 ll", "srm-6 rl",
        ], 64.5);
        expect(notes).toContain("half a ton under");
    });
    it("ARC-2R Archer: two medium lasers facing rear", () => {
        listing("arc-2r", 16, [70, 4, 0, 10, 208], [9, 35, 10, 30, 7, 30, 7, 15, 15, 25, 25], [
            "ammo-lrm-standard lt", "ammo-lrm-standard lt", "ammo-lrm-standard rt", "ammo-lrm-standard rt", "lrm-20 lt", "lrm-20 rt",
            "medium-laser ct(R)", "medium-laser ct(R)", "medium-laser la", "medium-laser ra",
        ], 70);
    });
    it("WHM-6R Warhammer", () => {
        listing("whm-6r", 16, [70, 4, 0, 18, 160], [9, 22, 9, 17, 8, 17, 8, 20, 20, 15, 15], [
            "ammo-machine-gun-standard ct", "ammo-srm-standard rt", "machine-gun lt", "machine-gun rt", "medium-laser lt", "medium-laser rt",
            "small-laser lt", "small-laser rt", "srm-6 rt", "standard-ppc la", "standard-ppc ra",
        ], 70);
    });
    it("MAD-3R Marauder", () => {
        listing("mad-3r", 17, [75, 4, 0, 16, 184], [9, 35, 16, 16, 8, 16, 8, 22, 22, 16, 16], [
            "ammo-is-ac-5-standard lt", "autocannon-standard-b rt", "medium-laser la", "medium-laser ra", "standard-ppc la", "standard-ppc ra",
        ], 75);
    });

    it("are the edition's 'Mechs, and the apocryphal droids are not", () => {
        expect(getRulesEdition("battledroids").mechs).toEqual(BOOK.map(id => `${droid(id).model} ${droid(id).name}`));
    });
});

describe("Printed Battledroids droids: across rules editions and old saves", () => {
    it("keeps the printed droid through a change of edition and back", () => {
        const mech = buildPrintedDroid(droid("whm-6r"));
        mech.setRulesEdition("total-warfare");
        expect(mech.getPrintedDroid()).toBe("whm-6r");
        expect(editionAllowsConstruction(mech.getRulesEdition(), 0)).toBe(true);
        mech.setRulesEdition("battledroids");
        expect(mech.getPrintedDroid()).toBe("whm-6r");
        expect(editionAllowsConstruction(mech.getRulesEdition(), 0)).toBe(false);
    });

    // An edited droid is no longer the printed one: the picker and the lock stop naming it.
    it("knows a printed droid from one that has been changed", () => {
        expect(isUnmodifiedPrintedDroid(built("grf-1n"))).toBe(true);
        // A round trip through Total Warfare changes nothing on a droid without jump jets; Total Warfare caps Jumping MP
        // at Walking MP, so the Griffin's 6 comes back as 5, and it is then a changed droid.
        const roundTrip = buildPrintedDroid(droid("whm-6r"));
        roundTrip.setRulesEdition("total-warfare");
        roundTrip.setRulesEdition("battledroids");
        expect(isUnmodifiedPrintedDroid(roundTrip)).toBe(true);
        const jumper = buildPrintedDroid(droid("grf-1n"));
        jumper.setRulesEdition("total-warfare");
        jumper.setRulesEdition("battledroids");
        expect(isUnmodifiedPrintedDroid(jumper)).toBe(false);
        const faster = buildPrintedDroid(droid("grf-1n"));
        faster.setWalkSpeed(6);
        expect(isUnmodifiedPrintedDroid(faster)).toBe(false);
        const rearmed = buildPrintedDroid(droid("grf-1n"));
        rearmed.addEquipmentFromTag("medium-laser", "is", "la", false, undefined, "", false, [], undefined, undefined);
        expect(isUnmodifiedPrintedDroid(rearmed)).toBe(false);
        const armored = buildPrintedDroid(droid("grf-1n"));
        armored.setHeadArmor(9);
        expect(isUnmodifiedPrintedDroid(armored)).toBe(false);
        expect(isUnmodifiedPrintedDroid(new BattleMech())).toBe(false);
    }, 30000);

    it("loads a Battledroids save without a printed droid as a built design, unchanged", () => {
        const saved = JSON.parse(built("arc-2r").exportJSON());
        delete saved.printedDroid;
        const loaded = new BattleMech();
        loaded.importJSON(JSON.stringify(saved));
        expect(loaded.getPrintedDroid()).toBeUndefined();
        expect(loaded.getRulesEdition()).toBe("battledroids");
        expect(JSON.parse(loaded.exportJSON())).toEqual(saved);
    });
});

describe("Printed Battledroids droids: the apocryphal sources", () => {
    // Game News #3 (May 1985) pp.12-13, "New Battledroid".
    it("builds the SPI-5R Spider from Game News #3", () => {
        const spider = droid("spi-5r");
        expect([spider.rulesLevel, spider.source, spider.page]).toEqual([APOCRYPHAL_RULES_LEVEL, "Game News #3 (May 1985)", 13]);
        const mech = built("spi-5r");
        expect([mech.getTonnage(), mech.getWalkSpeed(), mech.getJumpSpeed(), mech.getHeatSinks()]).toEqual([30, 6, 8, 13]);
        expect(armor(mech)).toEqual([6, 10, 4, 6, 2, 6, 2, 7, 7, 7, 7]);
        expect(spider.printedArmorFactor).toBe(64);
        expect(mounted(mech)).toEqual(["medium-laser ct", "medium-laser hd", "medium-laser la", "medium-laser ra"]);
        expect(mech.getCurrentTonnage()).toBe(30);
        expect(mech.getRulesEdition()).toBe("battledroids");
    });

    // TCI kit back, Abitate F44A Crabgunner (FASA 1984).
    it("builds the GOL-1H Goliath on four legs", () => {
        const goliath = droid("gol-1h");
        expect([goliath.mechType, goliath.kit, goliath.printedArmorFactor]).toEqual(["quad", "Abitate F44A Crabgunner", 296]);
        const mech = built("gol-1h");
        expect(mech.getType().tag).toBe("quad");
        expect([mech.getTonnage(), mech.getWalkSpeed(), mech.getJumpSpeed(), mech.getHeatSinks()]).toEqual([80, 4, 0, 13]);
        // The center torso holds 2 slots beside the engine and gyro; the sheet lists 8 boxes of items there.
        expect(mounted(mech)).toEqual(["ammo-lrm-standard ct", "ammo-lrm-standard ct", "lrm-10 lt", "lrm-10 rt"]);
        // The figurine carries them in a turret on the center torso: mounted there as printed, nothing left over.
        expect(getPrintedTurretCriticals(mech).map(critical => critical.tag).sort()).toEqual(
            ["ammo-machine-gun-standard", "machine-gun", "machine-gun", "standard-ppc"]);
        // The extra heat sinks wait for slots on every droid (TODO.md); no weapon or ammunition does.
        expect(getUnallocatedCriticals(mech).filter(critical => critical.tag !== "heat-sink")).toEqual([]);
        expect(mech.getInstalledEquipment().filter(item => item.location === "ct").map(item => item.tag).sort()).toEqual([
            "ammo-lrm-standard", "ammo-lrm-standard", "ammo-machine-gun-standard", "machine-gun", "machine-gun", "standard-ppc",
        ]);
        expect([goliath.turret, goliath.notes.join(" ")]).toEqual(["ct", expect.stringContaining("turret")]);
        expect(mech.getCurrentTonnage()).toBe(80);
        expect(goliath.notes.join(" ")).toContain("Four Legged Walkers");
        expect(goliath.notes.join(" ")).toContain("no cockpit line");
    });

    // TCI kit backs, Abitate T-10B and T-10C Blockhead (FASA 1984): the two sheets print the same figures.
    it("builds the WLV-3Nb and WLV-3Nc Wolverines with the armor as printed", () => {
        for (const id of ["wlv-3nb", "wlv-3nc"]) {
            const wolverine = droid(id);
            const mech = built(id);
            expect(armor(mech)).toEqual([8, 24, 8, 20, 6, 20, 6, 16, 16, 16, 16]);
            expect(armor(mech).reduce((sum, points) => sum + points, 0)).toBe(156);
            expect(wolverine.printedArmorFactor).toBe(168);
            expect(wolverine.notes.join(" ")).toContain("156");
            expect([mech.getWalkSpeed(), mech.getJumpSpeed(), mech.getHeatSinks()]).toEqual([5, 5, 12]);
            expect(mounted(mech)).toEqual([
                "ammo-is-ac-5-standard rt", "ammo-srm-standard lt", "autocannon-standard-b ra", "medium-laser hd",
                "srm-2 lt", "srm-2 lt", "srm-2 lt",
            ]);
            expect(mech.getCurrentTonnage()).toBe(56);
        }
    });

    // TCI kit back, Soltic H8 Round Facer (FASA 1984), against the GRF-1N of BD p.16.
    it("builds the GRF-2N Griffin with the head corrected and the 13th heat sink as printed", () => {
        const griffin = droid("grf-2n");
        const mech = built("grf-2n");
        expect(armor(mech)).toEqual([8, 20, 6, 20, 6, 20, 6, 13, 13, 16, 16]);
        expect(mech.getHeatSinks()).toBe(13);
        expect(mounted(mech)).toEqual(["ammo-lrm-standard rt", "ammo-lrm-standard rt", "lrm-10 rt", "standard-ppc ra"]);
        expect(mech.getCurrentTonnage()).toBe(56);
        expect(griffin.notes.join(" ")).toContain("prints 7");
        expect(griffin.notes.join(" ")).toContain("a ton over");
    });

    // TCI kit back, Dougram (FASA 1984): the SHD-2H of BD p.16 with a machine gun in place of the head SRM 2.
    it("builds the SHD-3H Shadow Hawk with the blank head filled in", () => {
        const hawk = droid("shd-3h");
        const mech = built("shd-3h");
        expect(armor(mech)).toEqual([9, 23, 8, 18, 6, 18, 6, 16, 16, 16, 16]);
        expect(mounted(mech)).toEqual([
            "ammo-is-ac-5-standard lt", "ammo-lrm-standard lt", "ammo-machine-gun-standard lt", "autocannon-standard-b lt",
            "lrm-5 rt", "machine-gun hd", "medium-laser ra",
        ]);
        expect(hawk.notes.join(" ")).toContain("blank");
        expect(mech.getCurrentTonnage()).toBe(54.5);
    });

    // TCI kit back, Hasty F4X Ironfoot (FASA 1984).
    it("builds the THN-8T Thunderbolt with two medium lasers as printed", () => {
        const thunderbolt = droid("thn-8t");
        const mech = built("thn-8t");
        expect([mech.getTonnage(), mech.getWalkSpeed(), mech.getHeatSinks()]).toEqual([65, 4, 15]);
        expect(armor(mech)).toEqual([9, 30, 11, 24, 6, 24, 6, 20, 20, 29, 29]);
        expect(mounted(mech)).toEqual([
            "ammo-lrm-standard rt", "ammo-lrm-standard rt", "ammo-machine-gun-standard rt", "ammo-srm-standard rt",
            "large-laser ra", "lrm-15 lt", "machine-gun rt(R)", "machine-gun rt(R)", "medium-laser lt", "medium-laser lt", "srm-2 rt",
        ]);
        expect(thunderbolt.notes.join(" ")).toContain("3 critical boxes");
        expect(mech.getCurrentTonnage()).toBe(64);
    });

    // TCI kit back, Soltic HT-128 Bigfoot (FASA 1984).
    it("builds the BTL-5R BattleMaster with both machine guns in the left arm", () => {
        const battlemaster = droid("btl-5r");
        const mech = built("btl-5r");
        expect([mech.getTonnage(), mech.getWalkSpeed(), mech.getHeatSinks()]).toEqual([85, 4, 18]);
        expect(armor(mech)).toEqual([9, 40, 11, 28, 8, 28, 8, 24, 24, 26, 26]);
        expect(mounted(mech)).toEqual([
            "ammo-machine-gun-standard la", "ammo-srm-standard lt", "machine-gun la", "machine-gun la",
            "medium-laser lt", "medium-laser lt", "medium-laser lt(R)", "medium-laser rt", "medium-laser rt", "medium-laser rt(R)",
            "srm-2 lt", "srm-2 lt", "srm-2 lt", "standard-ppc ra",
        ]);
        expect(battlemaster.notes.join(" ")).toContain("1 critical box");
        expect(battlemaster.notes.join(" ")).toContain("84 tons");
        expect(mech.getCurrentTonnage()).toBe(84);
    });

    // No sheet found yet for these two kits: the box set's own listings (BD p.16) stand in.
    it("enters the two missing kit sheets from the book's listings, marked inferred", () => {
        for (const [id, model] of [["shd-2h-jakt", "SHD-2H"], ["grf-1n-soltic-h8", "GRF-1N"]]) {
            const kit = droid(id);
            expect([kit.inferred, kit.rulesLevel, kit.model]).toEqual([true, APOCRYPHAL_RULES_LEVEL, model]);
            expect(kit.notes.join(" ")).toContain("inferred");
            expect(built(id).getCurrentTonnage()).toBe(55);
        }
        expect(mounted(built("shd-2h-jakt"))).toContain("srm-2 hd");
    });
});

// BD p.25: a location's armor is at most twice its internal structure boxes, the head up to 9. Read for the front
// section of a torso: the book's own Stinger, Wasp, Phoenix Hawk, Archer and Marauder pass only that way.
const overCap = (mech: BattleMech): string[] => {
    const structure = mech.getInternalStructure() as unknown as Record<string, number>;
    const a = mech.export().armor_allocation as unknown as Record<string, number>;
    const sums: [string, number, number][] = [
        ["head", a.head, 9], ["center torso", a.centerTorso, 2 * structure.centerTorso],
        ["left torso", a.leftTorso, 2 * structure.leftTorso], ["right torso", a.rightTorso, 2 * structure.rightTorso],
        ["left arm", a.leftArm, 2 * structure.leftArm], ["right arm", a.rightArm, 2 * structure.rightArm],
        ["left leg", a.leftLeg, 2 * structure.leftLeg], ["right leg", a.rightLeg, 2 * structure.rightLeg],
    ];
    return mech.getType().tag === "biped" ? sums.filter(([, points, cap]) => points > cap).map(([name]) => name) : [];
};

describe("Printed Battledroids droids: the armor limit", () => {
    it("flags every droid whose printed armor is over twice a location's internal structure", () => {
        const unflagged = battledroidsPrintedDroids
            .map(entry => [entry, overCap(built(entry.id))] as const)
            .filter(([entry, over]) => over.length && !entry.notes.join(" ").includes("twice its internal structure"))
            .map(([entry, over]) => `${entry.id}: ${over.join(", ")}`);
        expect(unflagged).toEqual([]);
    }, 30000);
});

// The user's conversions of the Ral Partha Battledroids miniatures (user, 2026-10-16), corrected to the BD rules:
// armor within twice the internal structure (BD p.25) and in half tons (BD p.24), a ton of ammunition for each
// weapon that uses it (BD p.25), the book's Auto Cannon, and every ton spent.
describe("Printed Battledroids droids: the user's Ral Partha conversions", () => {
    const custom = (id: string, stats: number[], armorBoxes: number[], items: string[], tons: number) => {
        const entry = droid(id);
        const mech = built(id);
        expect([entry.rulesLevel, entry.source], id).toEqual([CUSTOM_HOMEBREW_RULES_LEVEL, "Ral Partha Battledroids miniature; statistics by the user (2026-10-16)"]);
        expect([mech.getTonnage(), mech.getWalkSpeed(), mech.getJumpSpeed(), mech.getHeatSinks(), entry.printedArmorFactor], id).toEqual(stats);
        expect(armor(mech), id).toEqual(armorBoxes);
        expect(mounted(mech), id).toEqual(items);
        expect(mech.getCurrentTonnage(), id).toBe(tons);
        expect(overCap(mech), id).toEqual([]);
        expect(mech.getRulesEditionRuleIssues(), id).toEqual([]);
        return entry.notes.join(" ");
    };

    it("FLE-15 Flea: the armor cut to the 2 tons a 15-ton droid has left", () => {
        const notes = custom("fle-15", [15, 10, 0, 10, 32], [3, 6, 1, 4, 1, 4, 1, 3, 3, 3, 3],
            ["small-laser la", "small-laser ra"], 15);
        expect(notes).toContain("38");
    });
    it("FS9-H Firestarter: two tons of machine gun ammunition, the armor as listed plus what tonnage is left", () => {
        custom("fs9-h", [35, 6, 0, 11, 104], [8, 18, 4, 12, 2, 12, 2, 12, 12, 11, 11], [
            "ammo-machine-gun-standard ct", "ammo-machine-gun-standard lt", "machine-gun ct", "machine-gun hd", "medium-laser lt", "medium-laser rt",
            "standard-flamer la", "standard-flamer lt", "standard-flamer ra", "standard-flamer rt",
        ], 35);
    });
    it("BKX-7K Battleaxe: the book's Auto Cannon, armor to the limit, half a ton under", () => {
        const notes = custom("bkx-7k", [70, 4, 0, 15, 216], [9, 33, 10, 22, 8, 22, 8, 22, 22, 30, 30], [
            "ammo-is-ac-5-standard lt", "ammo-srm-standard lt", "ammo-srm-standard rt", "autocannon-standard-b la", "large-laser ra",
            "srm-6 lt", "srm-6 rt",
        ], 69.5);
        expect(notes).toContain("Auto Cannon");
        expect(notes).toContain("20-811");
    });
    it("LCT-1V Locust: the armor cut to the 3 tons left", () => {
        const notes = custom("lct-1v", [20, 8, 0, 10, 48], [4, 10, 2, 6, 1, 6, 1, 4, 4, 5, 5], [
            "ammo-machine-gun-standard ct", "ammo-machine-gun-standard lt", "machine-gun la", "machine-gun ra", "medium-laser ct",
        ], 20);
        expect(notes).toContain("20-844");
    });
});

describe("Printed Battledroids droids: building and saving", () => {
    it("keeps the printed droid's id through a save and load", () => {
        const mech = built("grf-2n");
        expect(mech.getPrintedDroid()).toBe("grf-2n");
        const loaded = new BattleMech();
        loaded.import(mech.export());
        expect(loaded.getPrintedDroid()).toBe("grf-2n");
        expect(loaded.getRulesEdition()).toBe("battledroids");
        expect(new BattleMech().export().printedDroid).toBeUndefined();
    });

    it("lists the droids at or below a rules level", () => {
        expect(getPrintedDroids(0).map(entry => entry.id)).toEqual(BOOK);
        expect(getPrintedDroids(1).map(entry => entry.id)).toEqual(BOOK);
        expect(getPrintedDroids(APOCRYPHAL_RULES_LEVEL).map(entry => entry.id)).toEqual([
            ...BOOK, "spi-5r", "gol-1h", "wlv-3nb", "wlv-3nc", "grf-2n", "shd-3h", "thn-8t", "btl-5r", "shd-2h-jakt", "grf-1n-soltic-h8",
        ]);
    });

    it("names each droid with its model, name and source", () => {
        for (const entry of battledroidsPrintedDroids) {
            expect(entry.model, entry.id).toMatch(/^[A-Z]{2,3}\d*-[0-9A-Z]+/);
            expect(entry.source, entry.id).not.toBe("");
            expect(built(entry.id).model, entry.id).toBe(entry.model);
        }
    }, 30000);
});
