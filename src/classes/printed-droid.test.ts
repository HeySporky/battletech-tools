import { describe, expect, it } from "vitest";
import { APOCRYPHAL_RULES_LEVEL } from "../data/rules-level-options";
import { battledroidsPrintedDroids, getPrintedDroids, IPrintedDroid } from "../data/battledroids-mechs";
import { BattleMech } from "./battlemech";
import { buildPrintedDroid } from "./printed-droid";

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

const built = (id: string) => buildPrintedDroid(droid(id));

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
        expect(mech.unallocatedCriticals.map(critical => critical.tag).sort()).toEqual(
            expect.arrayContaining(["ammo-machine-gun-standard", "machine-gun", "machine-gun", "standard-ppc"]));
        expect(mech.getInstalledEquipment().filter(item => item.location === "ct").map(item => item.tag).sort()).toEqual([
            "ammo-lrm-standard", "ammo-lrm-standard", "ammo-machine-gun-standard", "machine-gun", "machine-gun", "standard-ppc",
        ]);
        expect(goliath.notes.join(" ")).toContain("unallocated");
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
        expect(getPrintedDroids(1)).toEqual([]);
        expect(getPrintedDroids(APOCRYPHAL_RULES_LEVEL).map(entry => entry.id)).toEqual([
            "spi-5r", "gol-1h", "wlv-3nb", "wlv-3nc", "grf-2n", "shd-3h", "thn-8t", "btl-5r", "shd-2h-jakt", "grf-1n-soltic-h8",
        ]);
    });

    it("names each droid with its model, name and source", () => {
        for (const entry of battledroidsPrintedDroids) {
            expect(entry.model, entry.id).toMatch(/^[A-Z]{3}-\d[A-Z]/);
            expect(entry.source, entry.id).not.toBe("");
            expect(buildPrintedDroid(entry).model, entry.id).toBe(entry.model);
        }
    });
});
