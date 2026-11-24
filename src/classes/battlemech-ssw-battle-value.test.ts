import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { BattleMech } from "./battlemech";

// Battle Value of SSW designs against the BV2 SSW wrote in each file (#46).
function importFixture(name: string): BattleMech {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const mech = new BattleMech();
    mech.importSSWXML(readFileSync(`src/utils/__fixtures__/${name}.ssw`, "utf8"));
    return mech;
}
const tags = (mech: BattleMech) => mech.getInstalledEquipment().map((item) => item.tag);

describe("SSW Battle Value (#46)", () => {
    it("reads SSW's Triple-Strength Myomer enhancement, 1 more Walking MP for BV: Raider JL-1", () => {
        const mech = importFixture("raider-jl-1");
        expect(mech.getMyomerType().tag).toBe("tsm");
        expect(mech.getBattleValue()).toBe(817);
    });

    it("treats the B-Pod as a Gauss weapon for defensive BV, as the MUL does: Bloodhound B3-HND", () => {
        // TM errata v8.0 item 8 (#608): -1 for each unprotected B-Pod slot.
        expect(importFixture("bloodhound-b3-hnd").getBattleValue()).toBe(1005);
    });

    it("reads MASC from SSW's enhancement, and Hardened Armor costs 1 Running MP: Amarok 2", () => {
        const mech = importFixture("amarok-2");
        expect(tags(mech)).toContain("clan-masc");
        expect(mech.getArmorType()).toBe("hardened");
        expect(mech.getWalkSpeed()).toBe(4);
        expect(mech.getRunSpeed()).toBe(5);
        // MASC and a Supercharger: 4 x 2.5 = 10, less 1 for Hardened Armor (TO:AUE p.93).
        expect(mech.getBVRunSpeed()).toBe(9);
        expect(mech.getBattleValue()).toBe(3351);
    });

    it("counts Narc pods as explosive ammunition: Archer ARC-5S", () => {
        const mech = importFixture("archer-arc-5s");
        expect(mech.getInstalledEquipment().find((item) => item.tag === "ammo-is-narc-standard")?.explosive).toBe(true);
        expect(mech.getBattleValue()).toBe(1353);
    });

    it("installs the machine guns of SSW's MG Array items: Flea FLE-19", () => {
        const mech = importFixture("flea-fle-19");
        expect(tags(mech).filter((tag) => tag === "machine-gun-light")).toHaveLength(8);
        expect(mech.getUnallocatedCriticals()).toEqual([]);
        expect(mech.getBattleValue()).toBe(381);
    });

    it("counts Modular Armor's points and ignores its speed penalty: Trebuchet TBT-XK7", () => {
        const mech = importFixture("trebuchet-tbt-xk7");
        expect(mech.hasActiveModularArmor()).toBe(true);
        // In play the packs cost 1 Walking and Jumping MP; Battle Value ignores that (TO:AUE p.192).
        expect(mech.getWalkSpeed()).toBe(4);
        expect(mech.getBVJumpSpeed()).toBe(5);
        expect(mech.getBattleValue()).toBe(1549);
    });

    it("doubles the heat of Clan Ultra autocannons: Hunchback IIC", () => {
        expect(importFixture("hunchback-iic").getBattleValue()).toBe(1679);
    });

    it("reads SSW's Clan CASE on an Inner Sphere-base Mixed Tech design: Archer C", () => {
        const mech = importFixture("archer-c");
        expect(mech.hasClanCASE()).toBe(true);
        expect(mech.getBattleValue()).toBe(1883);

        const copy = new BattleMech();
        copy.importJSON(mech.exportJSON());
        expect(copy.hasClanCASE()).toBe(true);
        expect(copy.getBattleValue()).toBe(1883);

        mech.setClanCASE(false);
        // Four slots of LRM ammo in the side torsos, -15 each, x 1.2 Defensive Factor.
        expect(mech.getBattleValue()).toBe(1883 - 72);
    });

    it("reads each patchwork location's armor type: Victor VTR-9K2 St.James", () => {
        const mech = importFixture("victor-vtr-9k2-st-james");
        expect(mech.isPatchworkArmor()).toBe(true);
        expect(mech.getPatchworkArmorType("head").tag).toBe("standard");
        expect(mech.getPatchworkArmorType("leftArm").tag).toBe("ferro-fibrous");
        expect(mech.getPatchworkArmorType("rightLeg").tag).toBe("ferro-fibrous");
        expect(mech.getTotalArmor()).toBe(244);
        expect(mech.sswImportErrors).toEqual([]);
        expect(mech.getBattleValue()).toBe(2006);
    });

    it("takes 0.8 of a drone's weapon BV and 0.95 of its total, with no cockpit modifier (TO:AUE p.192): Celerity CLR-04-R", () => {
        const mech = importFixture("celerity-clr-04-r");
        expect(mech.hasDroneOperatingSystem()).toBe(true);
        // Defensive 82.50 (the front legs' armor included) + Offensive (TSEMP One-Shot 98 x 0.8 + 15 tons) x 3.44 = 403.80;
        // x 0.95, the Small Cockpit's 0.95 not applied.
        expect(mech.getBattleValue()).toBe(384);
    });

    it("adds 5 per slot for an armored cockpit, and 1 ton (TO:AUE pp.94, 192): Violator VT-U1", () => {
        const mech = importFixture("violator-vt-u1");
        expect(mech.getArmoredComponentRecords().map((armored) => armored.record.tag)).toEqual(["cockpit"]);
        expect(mech.getArmoredComponentWeight()).toBe(1);
        expect(mech.isCriticalSlotArmored("hd", 2)).toBe(true);
        expect(mech.isCriticalSlotArmored("hd", 1)).toBe(false);
        expect(mech.getRequiredRulesLevel()).toBeGreaterThanOrEqual(4);
        expect(mech.getBattleValue()).toBe(928);

        const copy = new BattleMech();
        copy.importJSON(mech.exportJSON());
        expect(copy.getArmoredComponentSlots()).toBe(1);
        expect(copy.getBattleValue()).toBe(928);

        mech.setComponentArmored("cockpit", false);
        expect(mech.hasArmoredComponents()).toBe(false);
        expect(mech.getBattleValue()).toBe(921);
    });

    it("adds 5 per slot for an armored engine, 0.5 tons and 150,000 C-bills a slot: Zeus X ZEU-X2", () => {
        const mech = importFixture("zeus-x-zeu-x2");
        expect(mech.getArmoredComponentSlots()).toBe(18);
        expect(mech.getArmoredComponentWeight()).toBe(9);
        expect(mech.getArmorableComponents().find((component) => component.key === "engine")?.armored).toBe(true);
        // The file's reactive armor everywhere is corrected to the printed patchwork (DESIGN_CORRECTIONS): SSW wrote 2,120.
        expect(mech.getBattleValue()).toBe(1915);
    });

    // A design whose SSW file differs from its newest printed sheet is corrected on import, by name, model and
    // configuration, from DESIGN_CORRECTIONS (each entry cited) (#607).
    it("corrects an SSW design from its printed sheet: Zeus X ZEU-X2, Skinwalker B", () => {
        const zeus = importFixture("zeus-x-zeu-x2");
        expect(zeus.sswImportErrors).toEqual([]);
        expect(zeus.getPatchworkArmorType("leftArm").tag).toBe("reactive");
        expect(zeus.getPatchworkArmorType("centerTorso").tag).toBe("standard");
        expect(zeus.getUnallocatedCriticals()).toEqual([]);

        const skinwalker = importFixture("skinwalker-ryoken-iii");
        expect(skinwalker.switchOmniConfiguration("B")).toBe(true);
        expect(tags(skinwalker).filter((tag) => /heavy-medium-laser/.test(tag))).toEqual(Array(3).fill("clan-improved-heavy-medium-laser"));
        expect(skinwalker.getBattleValue()).toBe(2851);
        // Only B is listed: D keeps its own lasers and BV.
        expect(skinwalker.switchOmniConfiguration("D")).toBe(true);
        expect(skinwalker.getBattleValue()).toBe(2545);
    });

    it("counts 5% of the gyro's BV for each armored gyro slot: Hunchback HBK-7X-4", () => {
        const mech = importFixture("hunchback-hbk-7x-4");
        // 50 tons x 0.5 = 25 gyro points; 4 slots x 5% = 5.
        expect(mech.getArmoredComponentSlots()).toBe(4);
        expect(mech.getBattleValue()).toBe(1208);
    });

    it("installs SSW's cockpit systems: Full-Head Ejection System (Phoenix Hawk PXH-4L Sante), ejection seat (Rock Hound)", () => {
        const hawk = importFixture("phoenix-hawk-pxh-4l-sante");
        expect(tags(hawk)).toContain("full-head-ejection-system");
        expect(hawk.sswImportErrors).toEqual([]);
        expect(hawk.getBattleValue()).toBe(1442);

        const hound = importFixture("rock-hound-am-prm-rh7");
        const seat = hound.getInstalledEquipment().find((item) => item.tag === "industrialmech-ejection-seat");
        expect(seat?.location).toBe("hd");
        expect(hound.getUnallocatedCriticals()).toEqual([]);
        expect(hound.sswImportErrors).toEqual([]);
    });

    it("imports IndustrialMech and Primitive files, which were skipped: Harvester Ant KIC-3, Commando COM-1A", () => {
        const ant = importFixture("harvester-ant-kic-3");
        expect(ant.isIndustrialMech()).toBe(true);
        // A quad's front legs keep SSW's la/ra armor.
        expect(ant.getTotalArmor()).toBe(48);
        expect(ant.sswImportErrors).toEqual([]);
        expect(ant.getBattleValue()).toBe(143);

        const commando = importFixture("commando-com-1a");
        expect(commando.sswImportErrors).toEqual([]);
        expect(commando.getBattleValue()).toBe(475);
    });

    it("places a jump jet listed in a single location: Space Hound AM-PRM-SH1", () => {
        const mech = importFixture("space-hound-am-prm-sh1");
        expect(mech.getJumpSpeed()).toBe(1);
        expect(mech.getUnallocatedCriticals()).toEqual([]);
        expect(mech.getBattleValue()).toBe(465);
    });

    it("lets an Experimental IndustrialMech mount BattleMech armor (TO:AUE p.92): Spindrift SDT-1", () => {
        const mech = importFixture("spindrift-sdt-1");
        expect(mech.sswImportErrors).toEqual([]);
        expect(mech.getRequiredRulesLevel()).toBeGreaterThanOrEqual(4);
        expect(mech.getBattleValue()).toBe(441);
    });

    it("reports a Torso-Mounted Cockpit on an IndustrialMech: Crosscut ED-XX", () => {
        const mech = importFixture("crosscut-ed-xx");
        expect(mech.sswImportErrors).toContain("Cannot mount a Torso-Mounted Cockpit on an IndustrialMech (TM p.69)");
    });

    it("imports an arm AES, x 1.25 for the arm's weapons and +10% tonnage (TO:AUE p.192), and the shoulder turret: Dig Lord RCL-Z1", () => {
        const mech = importFixture("dig-lord-rcl-z1");
        expect(mech.getInstalledEquipment().find((item) => item.tag === "aes-arm")?.location).toBe("ra");
        expect(mech.getInstalledEquipment().find((item) => item.tag === "mech-turret-shoulder")?.location).toBe("lt");
        expect(mech.getCurrentTonnage()).toBe(65);
        expect(mech.getBattleValue()).toBe(681);
    });

    it("loads an MML (LRM) ton for the MML, not the LRM 15 beside it: HawkWolf HWK-3F", () => {
        const mech = importFixture("hawkwolf-hwk-3f");
        const bins = mech.getInstalledEquipment().filter((item) => item.tag === "ammo-lrm-standard");
        expect(bins.map((bin) => mech.getAmmoBinWeapon(bin)?.tag).sort()).toEqual(["lrm-15", "lrm-15", "lrm-15", "mml-5"]);
        expect(mech.getBattleValue()).toBe(1349);
    });

    it("adds the PPC Capacitor's 5 heat to its PPC for BV (TO:AUE p.194): Rook-X NH-1B", () => {
        expect(importFixture("rook-x-nh-1b").getBattleValue()).toBe(1187);
    });

    it("places SSW's multislot Blue Shield in each listed slot; +0.2 armor and structure modifiers, explosive in every location but the head (TO:AUE p.194): Zeus-X ZEU-9WD (Stacy)", () => {
        const mech = importFixture("zeus-x-zeu-9wd-stacy");
        const criticals = mech.getCriticals() as unknown as Record<string, ({ tag: string } | null)[]>;
        expect(criticals.leftTorso[2]?.tag).toBe("blue-shield");
        expect(criticals.rightArm[3]?.tag).toBe("blue-shield");
        expect(criticals.centerTorso[10]?.tag).toBe("blue-shield");
        expect(mech.getUnallocatedCriticals()).toEqual([]);
        expect(mech.sswImportErrors).toEqual([]);
        expect(mech.getBattleValue()).toBe(1921);
    });

    it("reports a multislot system it does not know", () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const mech = new BattleMech();
        mech.importSSWXML(readFileSync("src/utils/__fixtures__/zeus-x-zeu-9wd-stacy.ssw", "utf8").replace("Blue Shield PFD", "Mystery Field"));
        expect(mech.sswImportErrors).toContain("Cannot import the Mystery Field");
    });

    it("takes the Null Signature System's 10 heat and the Chameleon LPS's 6 off the heat pool: Exterminator EXT-4C", () => {
        const mech = importFixture("exterminator-ext-4c");
        const criticals = mech.getCriticals() as unknown as Record<string, ({ tag: string } | null)[]>;
        expect(criticals.leftTorso[9]?.tag).toBe("null-signature-system");
        expect(criticals.leftLeg[4]?.tag).toBe("chameleon-lps");
        expect(mech.sswImportErrors).toEqual([]);
        expect(mech.getBattleValue()).toBe(1420);
    });

    it("counts the Void Signature System: Raptor II RPT-5X", () => {
        const mech = importFixture("raptor-ii-rpt-5x");
        expect(tags(mech)).toContain("void-signature-system");
        expect(mech.getBattleValue()).toBe(1124);
    });

    it("adds 0.4 heat sink capacity per heat sink, rounded up, for a Radical Heat Sink System (IO:AE p.185): Lament LMT-4RC, LMT-3C", () => {
        // 15 double heat sinks: 30 + 6 = 36, as the rule's own example gives.
        expect(importFixture("lament-lmt-4rc").getBattleValue()).toBe(2474);
        expect(importFixture("lament-lmt-3c").getBattleValue()).toBe(1874);
    });

    it("doubles the center torso armor and takes 0.95 for a Torso-Mounted Cockpit (TO:AUE p.193): Great Turtle GTR-2", () => {
        const mech = importFixture("great-turtle-gtr-2");
        expect(mech.getCockpitType().tag).toBe("torso-mounted");
        expect(mech.sswImportErrors).toEqual([]);
        expect(mech.getBattleValue()).toBe(2355);
    });

    it("counts 5 heat for an LRM 15 + Artemis IV (TM p.206): Griffin GRF-6S", () => {
        const mech = importFixture("griffin-grf-6s");
        expect(mech.getInstalledEquipment().find((item) => item.tag === "lrm-15-artemis-iv")?.heat).toBe(5);
        expect(mech.getBattleValue()).toBe(1781);
    });

    it("loads an \"@ LRM-20\" ton for an LRM 20 mounted with Artemis IV, not the LRM 15 beside it: Longbow LGB-12C", () => {
        const mech = importFixture("longbow-lgb-12c");
        const bins = mech.getInstalledEquipment().filter((item) => item.tag === "ammo-is-lrm-artemis-iv");
        expect(bins.map((bin) => mech.getAmmoBinWeapon(bin)?.tag).filter((tag) => tag === "lrm-20-artemis-iv")).toHaveLength(5);
        expect(mech.getBattleValue()).toBe(1686);
    });

    it("reads SSW's \"@ ELRM-15\" ammo for the Extended LRM 15: Salamander PPR-7T", () => {
        const mech = importFixture("salamander-ppr-7t");
        const bins = mech.getInstalledEquipment().filter((item) => item.tag === "ammo-is-extended-lrm-standard");
        expect(bins.map((bin) => mech.getAmmoBinWeapon(bin)?.tag).filter((tag) => tag === "extended-lrm-15")).toHaveLength(6);
        expect(mech.getBattleValue()).toBe(1647);
    });

    it("counts a split Heavy Gauss Rifle's explosive slots once, each in its own location (TM p.302): Barghest BGS-3T, Highlander HGN-694", () => {
        // XL engine: 9 right torso + 2 center torso slots, -11 in all.
        expect(importFixture("barghest-bgs-3t").getBattleValue()).toBe(1900);
        // The 9 left torso slots are behind CASE; only the 2 center torso slots cost BV. The MUL gives 2369;
        // SSW gives 2358, counting all 11.
        expect(importFixture("highlander-hgn-694").getBattleValue()).toBe(2369);
    });

    it("takes the explosive ammo penalty in a Clan XXL 'Mech's side torsos but not its arms (TO:AUE p.193): Warhammer IIC 9, Locust IIC 9, Rifleman C 2", () => {
        // Seven tons of side torso ammunition, -105 before the 1.3 defensive factor. SSW and the MUL give 2819.
        expect(importFixture("warhammer-iic-9").getBattleValue()).toBe(2819);
        // A Clan Gauss Rifle in an arm stays behind the arm's Clan CASE. SSW and the MUL give 1133 and 2150.
        expect(importFixture("locust-iic-9").getBattleValue()).toBe(1133);
        expect(importFixture("rifleman-c-2").getBattleValue()).toBe(2150);
    });

    it("leaves equipment with no BV and no heat out of the weapon steps (TM p.303): Amarok 3", () => {
        // The MUL gives 2675; SSW gives 2788.
        const mech = importFixture("amarok-3");
        expect(mech.getBattleValue()).toBe(2675);
        const steps = mech.getBattleValueBreakdown().steps;
        expect(steps.filter((step) => step.label.includes("Weapon CASE II"))).toHaveLength(0);
        const heat = steps.find((step) => step.id === "bv2.off.heat.weapons");
        expect(heat?.detail).toBe("2 + 2 + 2 + 2 + 2 + 2 + 2 + 4 + 6");
        expect(heat?.value).toBe(24);
    });

    it("fits the design's Artemis IV to an Improved LRM (IO:AE p.91): Excalibur EXC-B2b-EC", () => {
        const mech = importFixture("excalibur-exc-b2b-ec");
        const launcher = mech.getInstalledEquipment().find((item) => item.tag.startsWith("clan-improved-lrm-20"));
        expect(launcher?.tag).toBe("clan-improved-lrm-20-artemis-iv");
        expect((mech.getCriticals() as unknown as Record<string, ({ tag: string, crits?: number } | null)[]>).leftTorso[3]).toMatchObject({ tag: "clan-improved-lrm-20-artemis-iv", crits: 5 });
        // 181 x 1.2 for the launcher. SSW gives 2001; the MUL gives 2008.
        expect(mech.getBattleValue()).toBe(2001);
    });

    it("leaves ammunition behind CASE in an arm free of the XL engine penalty (TM p.302): Conjurer (Hellhound) 8, Charger C", () => {
        // Inner Sphere XL engine and Clan CASE: the side torso bins cost 15 a slot, the right arm's two do not.
        // SSW and the MUL give 2197 and 2756.
        expect(importFixture("conjurer-hellhound-8").getBattleValue()).toBe(2197);
        expect(importFixture("charger-c").getBattleValue()).toBe(2756);
    });

    it("gives a weapon split between torso and arm the torso arc for rear-firing BV (TM pp.57, 303): Hercules HRC-LS-9000 (Julius)", () => {
        // The LB 20-X AC, 7 right torso + 4 right arm slots, is a forward torso weapon: it outweighs the two
        // rear Small Pulse Lasers, which count half. SSW and the MUL give 1644.
        expect(importFixture("hercules-hrc-ls-9000-julius").getBattleValue()).toBe(1644);
    });

    it("counts a quad's front leg weapons as forward-firing leg weapons (TM p.303)", () => {
        const mech = new BattleMech();
        mech.setTech("is");
        mech.setMechType("quad");
        mech.setTonnage(50);
        mech.addEquipmentFromTag("large-laser", "is", "frl", false, undefined, "", false, [], undefined, undefined);
        mech.addEquipmentFromTag("medium-laser", "is", "ct", true, undefined, "", false, [], undefined, undefined);
        expect(mech.getTotalBVFrontWeapons()).toBe(123);
        expect(mech.getTotalBVRearWeapons()).toBe(46);
    });

    it("imports an SSW Mixed design on an Inner Sphere chassis, Clan CASE only when chosen (TM p.302): Banshee BNC-11X, Vision Quest VQ-1NC", () => {
        // A Clan XL engine had made the Banshee a Clan chassis, with Clan CASE in every location; its Silver
        // Bullet Gauss Rifle's 7 left torso slots now cost 7 BV. SSW and the MUL give 2030.
        const banshee = importFixture("banshee-bnc-11x");
        expect(banshee.getTech().tag).toBe("mis");
        expect(banshee.hasClanCASE()).toBe(false);
        expect(banshee.getBattleValue()).toBe(2030);
        // SSW gives 2401.
        expect(importFixture("vision-quest-vq-1nc").getBattleValue()).toBe(2401);
    });

    it("compares forward and rear weapons by BV before Artemis (TM p.303): Quickdraw QKD-5Mr", () => {
        // The two rear Medium Lasers (92) outweigh the LRM 10 (90; 108 with Artemis IV), so the LRM counts half
        // and the lasers in full. SSW and the MUL give 1471.
        expect(importFixture("quickdraw-qkd-5mr").getBattleValue()).toBe(1471);
    });

    it("counts 'Mech Mortar/4 ammunition at 3 BV a ton (TO:AUE pp.194, 197): Antlion LK-3D", () => {
        // Both addendum tables give 3, and Armor-Piercing (Shaped-Charge) rounds take x1 (TO:AUE p.229).
        // SSW, MegaMek and the MUL give 859 from 3.6 a ton.
        expect(importFixture("antlion-lk-3d").getBattleValue()).toBe(854);
    });

    it("counts each prototype improved jump jet slot as explosive (IO:AE p.97): Super Griffin GRF-2N-X", () => {
        // A critical hit is a 10-point internal explosion: 1 BV a slot like other explosive components,
        // six slots in the side torsos with no CASE. SSW and MegaMek give 1269.
        expect(importFixture("super-griffin-grf-2n-x").getBattleValue()).toBe(1269);
    });

    it("does not count Nail/Rivet Gun ammo as explosive (TM p.317): Jabberwocky JAW-66D", () => {
        // SSW gives 353: it counts the ammo at 1 BV a ton where TM p.317 gives 0.
        expect(importFixture("jabberwocky-jaw-66d").getBattleValue()).toBe(352);
    });
});
