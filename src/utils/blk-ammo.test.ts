import { describe, expect, it } from "vitest";
import { getEquipmentListByTech } from "../data/equipment-registry";
import { findBlkAmmo, findBlkAmmoWeapon, parseBlkAmmoLine } from "./blk-ammo";

describe("MegaMek .blk ammunition lines", () => {
    it("reads the weapon, half-ton bins and the kind of round", () => {
        expect(parseBlkAmmoLine("IS Ammo AC/10 - Half")).toMatchObject({ weaponKey: "ac10", half: true, kind: undefined });
        expect(parseBlkAmmoLine("IS LB 10-X Cluster Ammo")?.kind?.source).toBe("cluster");
        expect(parseBlkAmmoLine("Medium Laser")).toBeNull();
        expect(parseBlkAmmoLine("IS Ammo MG - Full")).toMatchObject({ weaponKey: "machinegun", half: false });
    });

    it("finds the mounted weapon a line feeds and its standard round", () => {
        const lrm20 = getEquipmentListByTech("is", false).find((item) => item.tag === "lrm-20");
        expect(lrm20).toBeDefined();
        const line = parseBlkAmmoLine("IS Ammo LRM-20");
        expect(line).not.toBeNull();
        expect(findBlkAmmoWeapon(line!, [lrm20!])).toBe(lrm20);
        const ammo = findBlkAmmo(line!, lrm20!);
        expect(ammo?.isAmmo).toBe(true);
        expect(ammo?.isSpecialAmmo).toBeFalsy();
        // No weapon is guessed when nothing mounted fires the round.
        expect(findBlkAmmoWeapon(parseBlkAmmoLine("IS Gauss Ammo")!, [lrm20!])).toBeUndefined();
    });

    const all = [...getEquipmentListByTech("is", false), ...getEquipmentListByTech("clan", false)];
    const record = (tag: string) => all.find((item) => item.tag === tag)!;
    // The round a line names, fed to the one weapon given.
    const roundFor = (lineName: string, weaponTag: string) => {
        const line = parseBlkAmmoLine(lineName)!;
        const weapon = findBlkAmmoWeapon(line, [record(weaponTag)]);
        return weapon ? findBlkAmmo(line, weapon)?.tag : undefined;
    };

    it("reads the rounds of Clan, MML, ATM and HAG lines", () => {
        // A Clan launcher is found by its name, not just its import names.
        expect(roundFor("Clan Ammo LRM-20 (Clan) Artemis-capable", "clan-lrm-20-artemis-iv")).toBe("ammo-clan-lrm-artemis-iv");
        expect(roundFor("Clan Ammo SRM-6 (Clan) Artemis V-capable", "clan-srm-6-artemis-v")).toBe("ammo-clan-srm-artemis-v");
        // An MML line names which of its two rounds it holds; Artemis IV fits MMLs (TM p.207).
        expect(roundFor("IS Ammo MML-9 LRM Artemis-capable", "mml-9-artemis-iv")).toBe("ammo-is-lrm-artemis-iv");
        expect(roundFor("IS Ammo MML-9 SRM Artemis-capable", "mml-9-artemis-iv")).toBe("ammo-is-srm-artemis-iv");
        expect(roundFor("Clan Ammo ATM-9 ER", "atm-9")).toBe("ammo-clan-atm-er");
        expect(roundFor("Clan Ammo ATM-9 HE", "atm-9")).toBe("ammo-clan-atm-he");
        expect(roundFor("Hyper-Assault Gauss Rifle/20 Ammo", "hyper-assault-gauss-20")).toBe("ammo-clan-hag-20-standard");
        // "AC/10 Primitive" rounds feed the Primitive Prototype AC/10 (IO:AE p.112).
        expect(roundFor("IS Ammo AC/10 Primitive", "primitive-prototype-ac-10")).toBe("ammo-ac-10-standard");
    });

    it("reads Narc-capable LRM and SRM rounds, each of its own tech base (Orion ON1-M-DC)", () => {
        expect(roundFor("IS Ammo LRM-20 Narc-capable", "lrm-20")).toBe("ammo-lrm-narc");
        expect(roundFor("IS Ammo SRM-4 Narc-capable", "srm-4")).toBe("ammo-is-srm-narc");
        expect(roundFor("Clan Ammo SRM-6 (Clan) Narc-capable", "clan-srm-6")).toBe("ammo-clan-srm-narc");
        expect(roundFor("Clan Ammo LRM-20 (Clan) Narc-capable", "clan-lrm-20")).toBe("ammo-lrm-narc");
    });

    it("reads MegaMek's run-together names, torpedoes, pods and shaped-charge mortar rounds (combat vehicles, #241)", () => {
        expect(roundFor("ISArrowIVHomingAmmo", "arrow-iv-system")).toBe("ammo-is-arrow-iv-homing");
        expect(roundFor("ISLongTomAmmo", "long-tom-artillery")).toBe("ammo-long-tom-standard");
        expect(roundFor("IS Ammo SRTorpedo-6", "srt-6")).toMatch(/srt/);
        expect(roundFor("IS Ammo LRTorpedo-20", "lrt-20")).toMatch(/lrt/);
        expect(roundFor("ISiNarc Pods", "inarc")).toBe("ammo-is-inarc-standard");
        expect(roundFor("ISNarc Pods", "narc")).toBe("ammo-is-narc-standard");
        // TM: the 'Mech Mortar's standard round is the shaped (armor-piercing) charge.
        expect(roundFor("IS Ammo SC Mortar-8", "mech-mortar-8")).toBe("ammo-mech-mortar-standard");
        expect(roundFor("CLLargeChemLaserAmmo", "clan-large-chemical-laser")).toBe("ammo-clan-large-chemical-laser-standard");
    });
});
