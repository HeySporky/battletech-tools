import { describe, expect, it } from "vitest";
import { ammoCatalog } from "./ammo";
import { ammoCustom } from "./ammo-custom";
import { equipmentMissile } from "./equipment-missile";
import { missileCustom } from "./missile-custom";
import { getAmmoBattleValuePerTon, getCompatibleAmmo, getWeaponShotsPerTon } from "./equipment-registry";
import ammunitionReadout from "../../docs/lore/ammunition-tro.md?raw";
import equipmentReadout from "../../docs/lore/homebrew-equipment-tro.md?raw";

// Lopunny's entry (QueerTech Discord, 2026-11-17): Heat-Seeking Thunderbolt ammunition and Thunderbolt torpedo launchers, both introduced 3082.

const SIZES = [5, 10, 15, 20] as const;
const byTag = <T extends { tag: string }>(list: T[], tag: string): T => {
    const found = list.find((item) => item.tag === tag);
    if (!found) throw new Error(`missing ${tag}`);
    return found;
};
const canonLauncher = (size: number) => byTag(equipmentMissile, `thunderbolt-${size}`);
const canonAmmo = (size: number) => byTag(ammoCatalog, `ammo-is-thunderbolt-${size}-standard`);
const heatSeeking = (size: number) => byTag(ammoCustom, `ammo-is-thunderbolt-${size}-heat-seeking`);
const torpedo = (size: number) => byTag(missileCustom, `custom-thunderbolt-torpedo-${size}`);
const torpedoAmmo = (size: number) => byTag(ammoCustom, `ammo-is-thunderbolt-torpedo-${size}-standard`);
const canonLrmHeatSeeking = () => byTag(ammoCatalog, "ammo-lrm-heat-seeking");

describe("Lopunny's Heat-Seeking Thunderbolt ammunition", () => {
    it.each(SIZES)("Thunderbolt %i: keeps the standard round's shots a ton and takes the canon Heat-Seeking cost and BV factors", (size) => {
        const round = heatSeeking(size);
        const standard = canonAmmo(size);
        const launcher = canonLauncher(size);
        expect(round.isSpecialAmmo).toBe(true);
        expect(round.techBase).toBe("is");
        expect(round.introduced).toBe(3082);
        expect(round.roundsPerTon).toBe(standard.roundsPerTon);
        expect(getWeaponShotsPerTon(launcher, round)).toBe(launcher.shotsPerTon);
        expect(round.cbills).toBe(standard.cbills * 2);
        expect(round.battleValueMultiplier).toBe(canonLrmHeatSeeking().battleValueMultiplier);
        expect(getAmmoBattleValuePerTon(launcher, round)).toBeCloseTo(getAmmoBattleValuePerTon(launcher, standard) * 1.5);
        expect(round.explosive).toBe(true);
        expect(round.rulesLevel).toBe(6);
    });

    it("feeds its own Thunderbolt size and no other launcher", () => {
        for (const size of SIZES) {
            for (const other of SIZES) {
                expect(getCompatibleAmmo(canonLauncher(other), heatSeeking(size)), `${other} <- ${size}`).toBe(other === size);
            }
            expect(getCompatibleAmmo(torpedo(size), heatSeeking(size))).toBe(false);
        }
    });

    it("credits Lopunny and the server, and carries the Heat-Seeking rules", () => {
        const round = heatSeeking(10);
        expect(round.notes).toContain("Lopunny");
        expect(round.notes).toContain("QueerTech Discord");
        expect(round.notes).toContain("Inspired by");
        expect(round.rules).toContain("+1");
        expect(round.rules).toContain("on fire");
        expect(round.lore).toBeTruthy();
    });
});

describe("Lopunny's Thunderbolt torpedo launchers", () => {
    it.each(SIZES)("Thunderbolt Torpedo %i: the Thunderbolt's statistics as its own launcher", (size) => {
        const tube = torpedo(size);
        const canon = canonLauncher(size);
        expect(tube.techBase).toBe("is");
        expect(tube.introduced).toBe(3082);
        expect(tube.rulesLevel).toBe(6);
        for (const field of ["damage", "heat", "weight", "cbills", "battleValue", "shotsPerTon", "ammoBattleValue", "techRating"] as const) {
            expect(tube[field], field).toEqual(canon[field]);
        }
        expect(tube.range).toEqual(canon.range);
        expect(tube.space.battlemech).toBe(canon.space.battlemech);
        expect(tube.alphaStrike.rangeShort).toBe(canon.alphaStrike.rangeShort);
        expect(tube.alphaStrike.rangeMedium).toBe(canon.alphaStrike.rangeMedium);
        expect(tube.alphaStrike.notes).toContain("TOR");
    });

    it.each(SIZES)("Thunderbolt Torpedo %i: torpedoes and missiles do not mix", (size) => {
        const tube = torpedo(size);
        const ammo = torpedoAmmo(size);
        const standard = canonAmmo(size);
        expect(getCompatibleAmmo(tube, ammo)).toBe(true);
        expect(getWeaponShotsPerTon(tube, ammo)).toBe(canonLauncher(size).shotsPerTon);
        expect(getCompatibleAmmo(tube, standard)).toBe(false);
        expect(getCompatibleAmmo(canonLauncher(size), ammo)).toBe(false);
        for (const field of ["cbills", "battleValue", "roundsPerTon", "explosive", "techRating"] as const) {
            expect(ammo[field], field).toEqual(standard[field]);
        }
        expect(ammo.introduced).toBe(3082);
    });

    it("credits Lopunny, names NGCFells's ruling and keeps the water rule", () => {
        const tube = torpedo(15);
        expect(tube.notes).toContain("Lopunny");
        expect(tube.notes).toContain("QueerTech Discord");
        expect(tube.notes).toContain("NGCFells");
        expect(tube.rules).toContain("Water");
        expect(tube.lore).toBeTruthy();
        expect(torpedoAmmo(15).rules).toBeTruthy();
    });
});

describe("Lopunny's items in TRO - JBT", () => {
    it("the readouts quote the catalog's figures", () => {
        expect(ammunitionReadout).toContain("## Thunderbolt: Heat-Seeking Ammo");
        for (const size of SIZES) {
            expect(ammunitionReadout).toContain(`${heatSeeking(size).cbills.toLocaleString("en-US")} C-bills a ton`);
            expect(ammunitionReadout).toContain(`| ${getAmmoBattleValuePerTon(canonLauncher(size), heatSeeking(size))} a ton `);
        }
        const row = (label: string, values: (string | number)[]) => `| **${label}** | ${values.join(" | ")} |`;
        expect(equipmentReadout).toContain(row("Weight", SIZES.map((size) => `${torpedo(size).weight} tons`)));
        expect(equipmentReadout).toContain(row("Slots", SIZES.map((size) => torpedo(size).space.battlemech)));
        expect(equipmentReadout).toContain(row("Heat", SIZES.map((size) => torpedo(size).heat)));
        expect(equipmentReadout).toContain(row("Damage", SIZES.map((size) => torpedo(size).damage as number)));
        expect(equipmentReadout).toContain(row("Torpedoes a ton", SIZES.map((size) => torpedoAmmo(size).roundsPerTon!)));
        expect(equipmentReadout).toContain(row("Battle Value", SIZES.map((size) => torpedo(size).battleValue ?? 0)));
        expect(equipmentReadout).toContain("## Thunderbolt Torpedoes");
        for (const size of SIZES) {
            const tube = torpedo(size);
            expect(equipmentReadout).toContain(`| ${tube.battleValue} `);
            expect(equipmentReadout).toContain(`${tube.cbills.toLocaleString("en-US")} C-Bills`);
        }
        expect(ammunitionReadout).toContain("QueerTech Discord");
        expect(equipmentReadout).toContain("QueerTech Discord");
    });
});
