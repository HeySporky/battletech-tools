import { describe, expect, it } from "vitest";
import { equipmentEnergy } from "./equipment-energy";
import { equipmentMissile } from "./equipment-missile";
import { IEquipmentItem } from "./data-interfaces";

// Catalog Alpha Strike heat against the Alpha Strike Companion's weapon conversion table (ASC pp.104-107). For these
// weapons the table's heat is the weapon's own heat; a wrong value turns cards hot (or cool) that the MUL prints otherwise.
const all: IEquipmentItem[] = [...equipmentEnergy, ...equipmentMissile];
const record = (tag: string): IEquipmentItem => {
    const found = all.find((item) => item.tag === tag);
    if (!found) throw new Error(`no record ${tag}`);
    return found;
};

describe("Alpha Strike weapon heat (ASC conversion table)", () => {
    it("an ER Small Laser converts at 2 heat", () => {
        expect(record("er-small-laser").alphaStrike.heat).toBe(2);
    });

    it("an LRM 20, with or without Artemis, TOR or one-shot, converts at 6 heat", () => {
        for (const tag of ["lrm-20", "lrm-20-artemis-iv", "lrm-20-artemis-p", "lrt-20", "lrt-20-artemis-iv", "lrm-20-os", "lrm-20-ios", "lrt-20-os", "lrt-20-ios",
            "clan-sl-lrm-20", "clan-sl-lrm-20-artemis-iv", "clan-sl-lrm-20-os", "clan-improved-lrm-20", "clan-improved-lrm-20-artemis-iv", "clan-improved-lrm-20-artemis-v"]) {
            expect(record(tag).alphaStrike.heat, tag).toBe(6);
        }
    });
});

it("no launcher that gives the LRM ability takes a targeting computer (ASC tables: N)", () => {
    const wrong = all.filter((item) => item.alphaStrike?.notes?.includes("LRM") && item.alphaStrike.tc).map((item) => item.tag);
    expect(wrong).toEqual([]);
});

describe("Clan LRMs (ASC Clan weapon table)", () => {
    // No minimum range, so the same damage at Short, Medium and Long: plain, with Artemis IV, with Artemis V.
    const TABLE: Record<number, { heat: number; plain: number; artemisIV: number; artemisV: number }> = {
        5: { heat: 2, plain: 0.3, artemisIV: 0.4, artemisV: 0.42 },
        10: { heat: 4, plain: 0.6, artemisIV: 0.8, artemisV: 0.84 },
        15: { heat: 5, plain: 0.9, artemisIV: 1.2, artemisV: 1.26 },
        20: { heat: 6, plain: 1.2, artemisIV: 1.6, artemisV: 1.68 },
    };
    const brackets = (tag: string) => {
        const block = record(tag).alphaStrike;
        return [block.heat, block.rangeShort, block.rangeMedium, block.rangeLong];
    };
    for (const size of [5, 10, 15, 20]) {
        const row = TABLE[size];
        it(`a Clan LRM ${size} converts at ${row.heat} heat and ${row.plain} at every range`, () => {
            for (const tag of [`clan-lrm-${size}`, `clan-lrm-${size}-os`, `clan-lrm-${size}-ios`]) {
                expect(brackets(tag), tag).toEqual([row.heat, row.plain, row.plain, row.plain]);
            }
            expect(brackets(`clan-lrm-${size}-artemis-iv`)).toEqual([row.heat, row.artemisIV, row.artemisIV, row.artemisIV]);
            expect(brackets(`clan-lrm-${size}-artemis-v`)).toEqual([row.heat, row.artemisV, row.artemisV, row.artemisV]);
        });
    }

    it("a Clan LRT converts as the Clan LRM of its size (ASC p.110: torpedoes take the comparable launcher's damage)", () => {
        for (const size of [5, 10, 15, 20]) for (const suffix of ["", "-os", "-ios"]) {
            const row = TABLE[size];
            expect(brackets(`clan-lrt-${size}${suffix}`), `clan-lrt-${size}${suffix}`).toEqual([row.heat, row.plain, row.plain, row.plain]);
        }
    });

    it("an Improved LRM with Artemis IV takes the Artemis damage (ASC Improved LRM rows), half at Short for its minimum range", () => {
        for (const size of [5, 10, 15, 20]) {
            const row = TABLE[size];
            expect(brackets(`clan-improved-lrm-${size}-artemis-iv`), `clan-improved-lrm-${size}-artemis-iv`).toEqual([row.heat, row.artemisIV / 2, row.artemisIV, row.artemisIV]);
        }
    });

    it("every Clan LRM gives the LRM and Indirect Fire abilities and takes no targeting computer", () => {
        for (const size of [5, 10, 15, 20]) for (const suffix of ["", "-os", "-ios", "-artemis-iv", "-artemis-v"]) {
            const tag = `clan-lrm-${size}${suffix}`;
            const block = record(tag).alphaStrike;
            expect(block.notes, tag).toEqual(expect.arrayContaining(["LRM", "Indirect Fire"]));
            expect(block.tc, tag).toBe(false);
        }
    });
});
