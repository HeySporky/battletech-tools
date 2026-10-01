import { describe, expect, it } from "vitest";
import { calculateShotsPerTon, equipmentMatchesIdentifier, getAlphaStrikeEquipmentAbilityCodes, getAlphaStrikeEquipmentDisplayAbilityCodes, getAmmoBattleValuePerTon, getAmmoFamily, getCompatibleAmmo, getEquipmentCatalogDefinitions, getEquipmentCatalogSummaries, getEquipmentListByTech, getEquipmentListForChassis, getEquipmentMaximumRangeInHexes, getWeaponShotsPerTon, getWeaponAmmoFamilies } from "./equipment-registry";
import { mechUniversalEquipment } from "./mech-universal-equipment";
import { mechUniversalAmmo } from "./mech-universal-ammo";
import { mechCustomAmmo } from "./mech-custom-ammo";
import { mechClanAmmo } from "./mech-clan-ammo";
import { mechISAmmo } from "./mech-is-ammo";
import { mechClanEquipmentEnergy } from "./mech-clan-equipment-weapons-energy";

describe("equipment catalog provenance", () => {
    it("resolves equipment aliases and preserves artillery map-sheet range", () => {
        const thumper = mechUniversalEquipment.find(item => item.tag === "thumper-artillery")!;

        expect(equipmentMatchesIdentifier(thumper, "Thumper")).toBe(true);
        expect(equipmentMatchesIdentifier(thumper, "thumper-artillery")).toBe(true);
        expect(getEquipmentMaximumRangeInHexes(thumper)).toBe(357);
    });

    // Workbook Blocks 13-20 decisions (2026-09-28)
    it("doubles Alpha Strike heat for every Ultra autocannon (AS:CE conversion)", () => {
        // Open: the IS Prototype UAC/5 stores Classic heat 2 / 5 slots; MegaMek and the
        // workbook's AS heat 2 imply Classic heat 1 (MegaMek: 6 slots). Needs the IO page.
        const unverifiedClassicHeat = ["prototype-autocannon-uac-5"];
        const ultras = getEquipmentCatalogDefinitions().flatMap(definition => definition.equipment)
            .filter(item => !item.isAmmo && /\bultra\b/i.test(item.name) && !unverifiedClassicHeat.includes(item.tag));
        expect(ultras.length).toBeGreaterThan(10);
        for (const ultra of ultras) {
            expect(ultra.alphaStrike.heat, ultra.tag).toBe(ultra.heat * 2);
        }
    });

    it("uses the chemical lasers' own heat for Alpha Strike (TO:AUE p.132)", () => {
        const chemical = mechClanEquipmentEnergy.filter(item => item.tag.endsWith("chemical-laser"));
        expect(chemical.map(item => [item.tag, item.alphaStrike.heat])).toEqual(chemical.map(item => [item.tag, item.heat]));
        expect(chemical.map(item => item.heat)).toEqual([6, 2, 1]);
    });

    it("keeps 'Mech Mortars universal with ammunition split by side", () => {
        for (const size of [1, 2, 4, 8]) {
            const mortar = mechUniversalEquipment.find(item => item.tag === `mech-mortar-${size}`)!;
            expect(mortar, `mech-mortar-${size}`).toBeDefined();
            const is = mechISAmmo.find(item => item.tag === "ammo-is-mech-mortar-standard")!;
            const clan = mechClanAmmo.find(item => item.tag === "ammo-clan-mech-mortar-standard")!;
            expect(getCompatibleAmmo(mortar, is)).toBe(true);
            expect(getCompatibleAmmo(mortar, clan)).toBe(true);
        }
        const allTags = getEquipmentCatalogDefinitions().flatMap(definition => definition.equipment).map(item => item.tag);
        expect(allTags.filter(tag => /^clan-mech-mortar-\d$/.test(tag))).toEqual([]);
    });

    it("keeps ProtoMech-only launchers off every non-ProtoMech unit", () => {
        const protoOnly = getEquipmentCatalogDefinitions().flatMap(definition => definition.equipment)
            .filter(item => /fusillade|protomech streak lrm|streak lrm \(protomech/i.test(item.name));
        for (const item of protoOnly) {
            const { protomech, ...others } = item.space;
            expect(protomech, item.tag).not.toBe(-1);
            expect(Object.values(others).every(slots => slots === -1), item.tag).toBe(true);
        }
    });

    it("stores Arrow IV range in map sheets like the other artillery pieces", () => {
        const catalogs = getEquipmentCatalogDefinitions().flatMap(definition => definition.equipment);
        for (const tag of ["arrow-iv-system", "prototype-arrow-iv", "clan-arrow-iv-system"]) {
            const arrow = catalogs.find(item => item.tag === tag)!;
            expect(arrow.range.maxMapSheets, tag).toBeGreaterThan(0);
            expect([arrow.range.short, arrow.range.medium, arrow.range.long], tag).toEqual([0, 0, 0]);
        }
        expect(getEquipmentMaximumRangeInHexes(catalogs.find(item => item.tag === "arrow-iv-system")!)).toBe(8 * 17);
    });

    it("prefers explicit Alpha Strike specials over weapon type codes", () => {
        const thumper = mechUniversalEquipment.find(item => item.tag === "thumper-artillery")!;

        expect(getAlphaStrikeEquipmentAbilityCodes(thumper)).toEqual(["ARTTH"]);
        expect(getAlphaStrikeEquipmentDisplayAbilityCodes(thumper)).toEqual(["ARTTH 1"]);
        expect(thumper.alphaStrike.damageAoE).toBe(1);
    });

    it("links launchers to consolidated ammo types and calculates shots per ton", () => {
        const launcher = getEquipmentListByTech("is").find(item => item.tag === "rocket-launcher-20")!;
        const ammo = mechCustomAmmo.find(item => item.tag === "ammo-rocket-launcher-standard")!;

        expect(calculateShotsPerTon(ammo.roundsPerTon!, 20)).toBe(12);
        expect(getCompatibleAmmo({ ...launcher, ammoTypes: ["ammo-rocket-launcher-standard"] }, ammo)).toBe(true);
        expect(launcher.shotsPerTon).toBe(0);
    });

    it("feeds every launcher of a family with that family's special munitions", () => {
        const isItems = getEquipmentListByTech("is");
        const lrm10 = isItems.find(item => item.tag === "lrm-10")!;
        const srm6 = isItems.find(item => item.tag === "srm-6")!;
        const standardLrmAmmo = mechUniversalAmmo.find(item => item.tag === "ammo-lrm-standard")!;
        const swarmILrmAmmo = mechUniversalAmmo.find(item => item.tag === "ammo-lrm-swarm-i")!;
        const standardSrmAmmo = mechUniversalAmmo.find(item => item.tag === "ammo-srm-standard")!;

        expect(getAmmoFamily(swarmILrmAmmo)).toBe("ammo-lrm-standard");
        expect(getCompatibleAmmo(lrm10, standardLrmAmmo)).toBe(true);
        expect(getCompatibleAmmo(lrm10, swarmILrmAmmo)).toBe(true);
        expect(getCompatibleAmmo(lrm10, standardSrmAmmo)).toBe(false);
        expect(getCompatibleAmmo(srm6, swarmILrmAmmo)).toBe(false);
    });

    it("uses published shots per ton rather than rounds divided by tubes", () => {
        const isItems = getEquipmentListByTech("is");
        const clanItems = getEquipmentListByTech("clan");
        const srmAmmo = mechUniversalAmmo.find(item => item.tag === "ammo-srm-standard")!;
        const lrmAmmo = mechUniversalAmmo.find(item => item.tag === "ammo-lrm-standard")!;
        const atmAmmo = mechClanAmmo.find(item => item.tag === "ammo-clan-atm-standard")!;

        // SRM 6: 100 rounds / 6 tubes would round up to 17; the published value is 15.
        expect(calculateShotsPerTon(srmAmmo.roundsPerTon!, 6)).toBe(17);
        expect(getWeaponShotsPerTon(isItems.find(item => item.tag === "srm-6")!, srmAmmo)).toBe(15);
        // ATM 9: 7 shots per ton.
        expect(getWeaponShotsPerTon(clanItems.find(item => item.tag === "atm-9")!, atmAmmo)).toBe(7);
        expect(getWeaponShotsPerTon(isItems.find(item => item.tag === "lrm-10")!, lrmAmmo)).toBe(12);
    });

    it("gives dual-mode MML launchers per-family shots from LRM and SRM ammunition", () => {
        const mml7 = getEquipmentListByTech("is").find(item => item.tag === "mml-7")!;
        const lrmAmmo = mechUniversalAmmo.find(item => item.tag === "ammo-lrm-standard")!;
        const srmAmmo = mechUniversalAmmo.find(item => item.tag === "ammo-srm-standard")!;
        const lrmSwarm = mechISAmmo.find(item => item.tag === "ammo-is-lrm-swarm")!;
        const ac5Ammo = mechISAmmo.find(item => item.tag === "ammo-is-ac-5-standard")!;

        expect(getCompatibleAmmo(mml7, lrmAmmo)).toBe(true);
        expect(getCompatibleAmmo(mml7, srmAmmo)).toBe(true);
        expect(getCompatibleAmmo(mml7, lrmSwarm)).toBe(true);
        expect(getCompatibleAmmo(mml7, ac5Ammo)).toBe(false);
        expect(getWeaponShotsPerTon(mml7, lrmAmmo)).toBe(17);
        expect(getWeaponShotsPerTon(mml7, srmAmmo)).toBe(14);
        expect(getWeaponShotsPerTon(mml7, lrmSwarm)).toBe(17);
    });

    it("keeps each Thunderbolt's single-missile ammunition separate", () => {
        const isItems = getEquipmentListByTech("is");
        for (const [size, shots] of [[5, 12], [10, 6], [15, 4], [20, 3]]) {
            const launcher = isItems.find(item => item.tag === `thunderbolt-${size}`)!;
            const ammo = mechISAmmo.find(item => item.tag === `ammo-is-thunderbolt-${size}-standard`)!;
            // Other launcher sizes' rounds never fit.
            const otherAmmo = mechISAmmo.filter(item => item.tag.startsWith("ammo-is-thunderbolt-") && !item.tag.startsWith(`ammo-is-thunderbolt-${size}-`));
            const ownMunitions = mechISAmmo.filter(item => item.tag.startsWith(`ammo-is-thunderbolt-${size}-`) && item !== ammo);

            expect(ammo.roundsPerTon).toBe(shots);
            expect(getCompatibleAmmo(launcher, ammo)).toBe(true);
            expect(otherAmmo.some(other => getCompatibleAmmo(launcher, other))).toBe(false);
            // Thunderbolts cannot use Artemis or Narc and have no canon special munitions (Sarna, TO:AUE).
            expect(ownMunitions).toEqual([]);
            expect(getWeaponShotsPerTon(launcher, ammo)).toBe(shots);
        }
    });

    it("falls back to rounds divided by tubes, rounded up, only without a published value", () => {
        const srmAmmo = mechUniversalAmmo.find(item => item.tag === "ammo-srm-standard")!;
        const unpublished = { ...getEquipmentListByTech("is").find(item => item.tag === "srm-6")!, shotsPerTon: 0 };

        expect(getWeaponShotsPerTon(unpublished, srmAmmo)).toBe(17);
    });

    it("resolves historical ammo tags from Jeff's and upstream records", () => {
        const all = [...mechISAmmo, ...mechClanAmmo, ...mechUniversalAmmo, ...mechCustomAmmo];
        const resolve = (legacyTag: string) => all.filter(item => equipmentMatchesIdentifier(item, legacyTag)).map(item => item.tag);

        expect(resolve("ammo-lrm-10")).toEqual(["ammo-lrm-standard"]);
        // Split records keep the old tag on both sides; each tech list sees only its own copy.
        expect(resolve("ammo-autocannon-standard-a")).toEqual(["ammo-is-ac-2-standard", "ammo-clan-ac-2-standard"]);
        expect(resolve("ammo-standard-autocannon-d-precision")).toEqual(["ammo-is-ac-20-precision"]);
        expect(resolve("ammo-autocannon-lb-x-c-cluster")).toEqual(["ammo-is-lb-10x-cluster"]);
        expect(resolve("ammo-atm-standard")).toEqual(["ammo-clan-atm-standard"]);
        expect(resolve("ammo-plasma-rifle")).toEqual(["ammo-is-plasma-rifle-standard"]);
    });

    it("gives every ammunition record a weapon its own side can mount", () => {
        const pools = { is: getEquipmentListByTech("is", true), clan: getEquipmentListByTech("clan", true) };
        const catalogs = { is: mechISAmmo, clan: mechClanAmmo, universal: mechUniversalAmmo, custom: mechCustomAmmo };
        const unfed: string[] = [];
        for (const [catalog, items] of Object.entries(catalogs)) {
            const weapons = catalog === "is" ? pools.is : catalog === "clan" ? pools.clan : [...pools.is, ...pools.clan];
            for (const ammo of items) {
                // Bombs load into Bomb Bays (LAM) or fighter bomb slots instead of feeding a weapon.
                if (ammo.bombBaySlots) {
                    if (!weapons.some(item => item.tag === "lam-bomb-bay")) unfed.push(`${catalog} ${ammo.tag} (no bomb bay)`);
                    continue;
                }
                if (!weapons.some(weapon => !weapon.isAmmo && getCompatibleAmmo(weapon, ammo))) unfed.push(`${catalog} ${ammo.tag}`);
            }
        }
        expect(unfed).toEqual([]);
    }, 20000);

    it("marks ammunition ProtoMech-mountable only when a ProtoMech-mountable weapon fires it", () => {
        const pools = { is: getEquipmentListByTech("is", true), clan: getEquipmentListByTech("clan", true) };
        const catalogs = { is: mechISAmmo, clan: mechClanAmmo, universal: mechUniversalAmmo, custom: mechCustomAmmo };
        const wrong: string[] = [];
        for (const [catalog, items] of Object.entries(catalogs)) {
            const weapons = catalog === "is" ? pools.is : catalog === "clan" ? pools.clan : [...pools.is, ...pools.clan];
            for (const ammo of items) {
                const protoFeeder = weapons.some(weapon => !weapon.isAmmo && weapon.space.protomech !== -1 && getCompatibleAmmo(weapon, ammo));
                if (protoFeeder !== (ammo.space.protomech !== -1)) wrong.push(`${catalog} ${ammo.tag} protomech ${ammo.space.protomech}`);
            }
        }
        expect(wrong).toEqual([]);
    }, 20000);

    it("keeps every ammunition record in the canonical ammo format", () => {
        const catalogs = { is: mechISAmmo, clan: mechClanAmmo, universal: mechUniversalAmmo, custom: mechCustomAmmo };
        const expectedKeys = ["isAmmo", "isSpecialAmmo", "name", "altNames", "tag", "altTags", "sort", "category", "cbills",
            "introduced", "extinct", "reintroduced", "battleValue", "heat", "heatAero", "weight", "range", "space",
            "roundsPerTon", "explosive", "techRating", "book", "page", "alphaStrike"];

        for (const [catalog, items] of Object.entries(catalogs)) {
            for (const item of items) {
                const label = `${catalog} ${item.tag}`;
                expect(Object.keys(item).slice(0, expectedKeys.length), label).toEqual(expectedKeys);
                expect(item.ammoPerTon, label).toBeUndefined();
                expect(item.altTags!.every(tag => tag.trim().length > 0), label).toBe(true);
                expect(item.alphaStrike.specialAbility, label).toEqual(expect.any(Array));
                // Standard rounds are the only non-special ammunition.
                expect(item.isSpecialAmmo, label).toBe(!item.tag.endsWith("-standard"));
                if (catalog === "is") expect(item.tag.startsWith("ammo-is-"), label).toBe(true);
                if (catalog === "clan") expect(item.tag.startsWith("ammo-clan-"), label).toBe(true);
                if (catalog === "universal") expect(/^ammo-(is|clan)-/.test(item.tag), label).toBe(false);
            }
        }
    });

    it("links ATM and iATM launchers to their supported ammunition profiles", () => {
        const clanItems = getEquipmentListByTech("clan");
        const atm6 = clanItems.find(item => item.tag === "atm-6")!;
        const iatm6 = clanItems.find(item => item.tag === "iatm-6")!;
        const standardAtm = mechClanAmmo.find(item => item.tag === "ammo-clan-atm-standard")!;
        const extendedRangeAtm = mechClanAmmo.find(item => item.tag === "ammo-clan-atm-er")!;
        const highExplosiveAtm = mechClanAmmo.find(item => item.tag === "ammo-clan-atm-he")!;
        const infernoIatm = mechClanAmmo.find(item => item.tag === "ammo-clan-iatm-inferno")!;
        const magPulseIatm = mechClanAmmo.find(item => item.tag === "ammo-clan-iatm-mag-pulse")!;

        expect(atm6.ammoPerShot).toBe(6);
        expect([standardAtm, extendedRangeAtm, highExplosiveAtm].every(ammo => getCompatibleAmmo(atm6, ammo))).toBe(true);
        expect(getCompatibleAmmo(atm6, infernoIatm)).toBe(false);
        expect(iatm6.ammoPerShot).toBe(6);
        expect([standardAtm, extendedRangeAtm, highExplosiveAtm, infernoIatm, magPulseIatm]
            .every(ammo => getCompatibleAmmo(iatm6, ammo))).toBe(true);
    });

    it("defines filename-owned universal equipment and ammo catalogs", () => {
        const universal = getEquipmentCatalogDefinitions().find(catalog => catalog.id === "mech-universal-equipment");

        expect(universal?.id).toBe("mech-universal-equipment");
        expect(universal?.equipment).toEqual(mechUniversalEquipment);
        expect(new Set(universal?.equipment.map(item => item.tag)).size).toBe(universal?.equipment.length);
        expect(mechUniversalEquipment.every(item => item.catalog === undefined)).toBe(true);
        // The catalog keeps growing (canon ammo is still being added), so check invariants, not a snapshot count.
        expect(mechUniversalAmmo.length).toBeGreaterThan(0);
        expect(mechUniversalAmmo.every(item => item.isAmmo)).toBe(true);
        expect(new Set(mechUniversalAmmo.map(item => item.tag)).size).toBe(mechUniversalAmmo.length);
        expect(getEquipmentCatalogDefinitions().find(catalog => catalog.id === "mech-universal-ammo")?.equipment).toEqual(mechUniversalAmmo);
        expect(getEquipmentCatalogDefinitions().find(catalog => catalog.id === "mech-custom-ammo")?.equipment).toEqual(mechCustomAmmo);
    });

    it("includes universal equipment once in every tech-base list", () => {
        const isItems = getEquipmentListByTech("is");
        const clanItems = getEquipmentListByTech("clan");
        const mixedItems = getEquipmentListByTech("mis");
        const universalTags = getEquipmentCatalogDefinitions()
            .filter(catalog => catalog.techBase === "universal")
            .flatMap(catalog => catalog.equipment)
            .map(item => item.tag);

        for (const tag of universalTags) {
            expect(isItems.filter(item => item.tag === tag)).toHaveLength(1);
            expect(clanItems.filter(item => item.tag === tag)).toHaveLength(1);
            expect(mixedItems.filter(item => item.tag === tag)).toHaveLength(1);
        }
    });

    it("includes custom ammunition only when custom content is requested", () => {
        expect(getEquipmentListByTech("is").some(item => item.tag === "ammo-rocket-launcher-standard")).toBe(false);
        expect(getEquipmentListByTech("is", true).filter(item => item.tag === "ammo-rocket-launcher-standard")).toHaveLength(1);
    });

    it("adds chassis-tech, custom, and universal ammunition for custom-rule machines", () => {
        const innerSphere = getEquipmentListForChassis("is", true);
        const clan = getEquipmentListForChassis("clan", true);
        const mixed = getEquipmentListForChassis("mis", true);

        expect(innerSphere.some(item => item.tag === "ammo-rocket-launcher-standard")).toBe(true);
        expect(innerSphere.some(item => item.tag === "ammo-clan-atm-standard")).toBe(false);
        expect(clan.some(item => item.tag === "ammo-clan-atm-standard")).toBe(true);
        expect(clan.some(item => item.tag === "ammo-rocket-launcher-standard")).toBe(true);
        expect(mixed.some(item => item.tag === "ammo-clan-atm-standard")).toBe(true);
        expect(mixed.some(item => item.tag === "ammo-rocket-launcher-standard")).toBe(true);
        expect(mixed.some(item => item.tag === "ammo-lrm-standard")).toBe(true);
    });

    it("treats only equipment with identical IS and Clan windows as universal", () => {
        // IO gives the Vehicle Flamer the same window for both; the PPC Capacitor is not shared.
        expect(mechUniversalEquipment.some(item => item.tag === "vehicle-flamer")).toBe(true);
        expect(mechUniversalEquipment.some(item => item.tag === "ppc-capacitor")).toBe(false);
        expect(getEquipmentListByTech("clan").filter(item => item.tag === "vehicle-flamer")).toHaveLength(1);
        expect(getEquipmentListByTech("is").filter(item => item.tag === "vehicle-flamer")).toHaveLength(1);
    });

    it("gives the Clans their own copies of Star League weapons with Clan dates", () => {
        const clanItems = getEquipmentListByTech("clan");
        const ac20 = clanItems.find(item => item.tag === "clan-sl-autocannon-standard-d")!;
        const lrm10 = clanItems.find(item => item.tag === "clan-sl-lrm-10")!;
        const clanAc20Ammo = mechClanAmmo.find(item => item.tag === "ammo-clan-ac-20-standard")!;
        const isAc20Ammo = mechISAmmo.find(item => item.tag === "ammo-is-ac-20-standard")!;

        expect([ac20.introduced, ac20.extinct]).toEqual([2500, 2850]);
        expect([lrm10.introduced, lrm10.extinct]).toEqual([2300, 2830]);
        expect([clanAc20Ammo.introduced, clanAc20Ammo.extinct]).toEqual([2500, 2850]);
        expect([isAc20Ammo.introduced, isAc20Ammo.extinct]).toEqual([2500, 0]);
        expect(getCompatibleAmmo(ac20, clanAc20Ammo)).toBe(true);
        expect(getWeaponShotsPerTon(lrm10, mechUniversalAmmo.find(item => item.tag === "ammo-lrm-standard")!)).toBe(12);
        // The Inner Sphere list never sees the Clan copy, and vice versa.
        expect(getEquipmentListByTech("is").some(item => item.tag === "clan-sl-lrm-10" || item.tag === "ammo-clan-ac-20-standard")).toBe(false);
        expect(clanItems.some(item => item.tag === "ammo-is-ac-20-standard")).toBe(false);
    });

    it("keeps every registered item structurally complete", () => {
        for (const definition of getEquipmentCatalogDefinitions()) {
            for (const item of definition.equipment) {
                expect(item.name.length, `${definition.id} ${item.tag} name`).toBeGreaterThan(0);
                expect(item.tag.length, `${definition.id} ${item.name} tag`).toBeGreaterThan(0);
                expect(item.category.length, `${definition.id} ${item.tag} category`).toBeGreaterThan(0);
                expect(item.book.length, `${definition.id} ${item.tag} source book`).toBeGreaterThan(0);
                expect(item.range.short, `${definition.id} ${item.tag} short range`).toEqual(expect.any(Number));
                expect(item.range.medium, `${definition.id} ${item.tag} medium range`).toEqual(expect.any(Number));
                expect(item.range.long, `${definition.id} ${item.tag} long range`).toEqual(expect.any(Number));
                expect(item.space.battlemech, `${definition.id} ${item.tag} BattleMech slots`).toEqual(expect.any(Number));
                expect(item.alphaStrike.heat, `${definition.id} ${item.tag} Alpha Strike heat`).toEqual(expect.any(Number));
            }
        }
    });

    it("groups miscellaneous gear under one UI category label", () => {
        // The equipment browser groups by category; "Misc Equipment" and
        // "Miscellaneous Equipment" showed as two headings for the same gear.
        const labels = new Set(getEquipmentCatalogDefinitions().flatMap(definition => definition.equipment.map(item => item.category)));
        expect([...labels].filter(label => /^misc/i.test(label))).toEqual(["Miscellaneous Equipment"]);
    });

    it("keeps tags unique within each registered source catalog", () => {
        for (const definition of getEquipmentCatalogDefinitions()) {
            const tags = definition.equipment.map(item => item.tag);
            expect(new Set(tags).size, definition.id).toBe(tags.length);
        }
    });

    // Duplicate audit: Mixed Tech lists dedupe by tag, so a tag shared across
    // files hid one record (IS and Clan Arrow IV both used "arrow-iv-system").
    it("keeps tags unique across every registered catalog", () => {
        const owners = new Map<string, string>();
        for (const definition of getEquipmentCatalogDefinitions()) {
            for (const item of definition.equipment) {
                const owner = owners.get(item.tag);
                expect(owner, `${item.tag} in ${definition.id} is already used in ${owner}`).toBeUndefined();
                owners.set(item.tag, definition.id);
            }
        }
    });

    it("never uses another record's tag as an altTag on the same tech side", () => {
        // IS and Clan splits may both keep a historical altTag; tech base picks the record.
        for (const side of ["is", "clan", "custom"] as const) {
            const definitions = getEquipmentCatalogDefinitions().filter(definition => definition.techBase === side || definition.techBase === "universal");
            const items = definitions.flatMap(definition => definition.equipment);
            const tags = new Set(items.map(item => item.tag));
            for (const item of items) {
                for (const altTag of item.altTags ?? []) {
                    expect(altTag !== item.tag && tags.has(altTag), `${side}: ${item.tag} altTag ${altTag} is another record's tag`).toBe(false);
                }
            }
        }
    });

    it("exposes catalog completeness summaries without duplicate tags", () => {
        for (const summary of getEquipmentCatalogSummaries()) {
            expect(summary.itemCount).toBeGreaterThan(0);
            expect(summary.duplicateTags, summary.catalogId).toEqual([]);
            expect(summary.missingSourceCount, summary.catalogId).toBe(0);
            expect(summary.ammoCount + summary.weaponCount).toBeLessThanOrEqual(summary.itemCount);
        }
    });

    it("includes the promoted canon missile families in their tech catalogs", () => {
        const isTags = new Set(getEquipmentListByTech("is").map(item => item.tag));
        const clanTags = new Set(getEquipmentListByTech("clan").map(item => item.tag));
        const isTagsToRequire = [
            "extended-lrm-5", "extended-lrm-10", "extended-lrm-15", "extended-lrm-20",
            "mml-3", "mml-5", "mml-7", "mml-9",
            "mrm-10", "mrm-20", "mrm-30", "mrm-40",
            "rocket-launcher-10", "rocket-launcher-15", "rocket-launcher-20",
            "thunderbolt-5", "thunderbolt-10", "thunderbolt-15", "thunderbolt-20"
        ];
        const clanTagsToRequire = ["streak-lrm-5", "streak-lrm-10", "streak-lrm-15", "streak-lrm-20"];

        expect(isTagsToRequire.every(tag => isTags.has(tag))).toBe(true);
        expect(clanTagsToRequire.every(tag => clanTags.has(tag))).toBe(true);
        expect(getEquipmentListByTech("is").filter(item => item.tag === "mrm-10")[0].alphaStrike.rangeShort).toBe(0.57);
        expect(getEquipmentListByTech("clan").filter(item => item.tag === "streak-lrm-20")[0].notes).toContain("workbook");
        expect(getEquipmentListByTech("is").filter(item => item.tag === "vehicle-flamer")).toHaveLength(1);
        expect(getEquipmentCatalogDefinitions().find(catalog => catalog.techBase === "universal")?.equipment.some(item => item.tag === "vehicle-flamer")).toBe(true);
        expect(getEquipmentListByTech("is").find(item => item.tag === "rocket-launcher-20")?.weight).toBe(1.5);
        expect(getEquipmentListByTech("is").filter(item => item.tag === "rocket-launcher-20")).toHaveLength(1);
        expect(getEquipmentListByTech("clan").find(item => item.tag === "clan-srm-2-artemis-iv")?.weight).toBe(1.5);
        expect(getEquipmentListByTech("clan").find(item => item.tag === "clan-srm-6-artemis-iv")?.space.battlemech).toBe(2);
        expect(getEquipmentCatalogDefinitions().find(catalog => catalog.techBase === "universal")?.equipment.find(item => item.tag === "ppc-capacitor")).toBeUndefined();
    });

    it("covers the requested Clan missile families without Clan MRMs", () => {
        const clanTags = new Set(getEquipmentListByTech("clan").map(item => item.tag));
        const requiredTags = [
            "clan-lrm-5", "clan-lrm-10", "clan-lrm-15", "clan-lrm-20",
            "clan-lrm-5-artemis-iv", "clan-lrm-10-artemis-iv", "clan-lrm-15-artemis-iv", "clan-lrm-20-artemis-iv",
            "streak-lrm-5", "streak-lrm-10", "streak-lrm-15", "streak-lrm-20",
            "clan-srm-2", "clan-srm-4", "clan-srm-6",
            "clan-srm-2-artemis-iv", "clan-srm-4-artemis-iv", "clan-srm-6-artemis-iv",
            "clan-streak-srm-2", "clan-streak-srm-4", "clan-streak-srm-6",
            "atm-3", "atm-6", "atm-9", "atm-12", "iatm-3", "iatm-6", "iatm-9", "iatm-12",
            "clan-lrm-5-os", "clan-lrm-10-os", "clan-lrm-15-os", "clan-lrm-20-os",
            "clan-srm-2-os", "clan-srm-4-os", "clan-srm-6-os",
            "clan-lrt-5", "clan-lrt-10", "clan-lrt-15", "clan-lrt-20",
            "clan-srt-2", "clan-srt-4", "clan-srt-6",
            "clan-lrt-5-os", "clan-lrt-10-os", "clan-lrt-15-os", "clan-lrt-20-os",
            "clan-srt-2-os", "clan-srt-4-os", "clan-srt-6-os"
        ];

        expect(requiredTags.every(tag => clanTags.has(tag))).toBe(true);
            const hasClanMrmOrMrt = Array.from(clanTags).some(tag =>
                tag.startsWith("mrm-")
                || tag.startsWith("clan-mrm-")
                || tag.startsWith("clan-mrt-")
                || tag.startsWith("mrt-")
            );
            expect(hasClanMrmOrMrt).toBe(false);
    });

        it("uses the supplied Alpha Strike ATM and iATM cards", () => {
            const clanItems = getEquipmentListByTech("clan");
            const profile = (tag: string) => clanItems.find(item => item.tag === tag)!.alphaStrike;

            expect([profile("atm-3").rangeShort, profile("atm-3").rangeMedium, profile("atm-3").rangeLong]).toEqual([1, 1, 1]);
            expect([profile("atm-6").rangeShort, profile("atm-6").rangeMedium, profile("atm-6").rangeLong]).toEqual([2, 1, 1]);
            expect([profile("atm-9").rangeShort, profile("atm-9").rangeMedium, profile("atm-9").rangeLong]).toEqual([3, 2, 1]);
            expect([profile("atm-12").rangeShort, profile("atm-12").rangeMedium, profile("atm-12").rangeLong]).toEqual([4, 2, 1]);
            expect(profile("atm-3").notes).toContain("Direct Fire");
            expect(profile("iatm-3").notes).toContain("IF 1");
            expect([profile("iatm-6").rangeShort, profile("iatm-6").rangeMedium, profile("iatm-6").rangeLong]).toEqual([3, 2, 1]);
            expect([profile("iatm-9").rangeShort, profile("iatm-9").rangeMedium, profile("iatm-9").rangeLong]).toEqual([4, 3, 2]);
            expect([profile("iatm-12").rangeShort, profile("iatm-12").rangeMedium, profile("iatm-12").rangeLong]).toEqual([5, 4, 2]);
            expect(profile("iatm-12").notes).toContain("0 heat on miss");
        });

        it("includes the classified Block 11 records in the correct catalogs", () => {
            const isTags = new Set(getEquipmentListByTech("is").map(item => item.tag));
            const clanTags = new Set(getEquipmentListByTech("clan").map(item => item.tag));

            expect(["primitive-prototype-lrm-15", "primitive-prototype-lrm-20", "primitive-prototype-srm-2", "primitive-prototype-srm-4"]
                .every(tag => isTags.has(tag))).toBe(true);
            expect(clanTags.has("ap-gauss-rifle")).toBe(true);
            expect(isTags.has("ap-gauss-rifle")).toBe(false);
        });

        it("includes the classified Block 12 Clan ballistic records", () => {
            const isItems = getEquipmentListByTech("is");
            const clanItems = getEquipmentListByTech("clan");
            const clanItem = (tag: string) => clanItems.find(item => item.tag === tag)!;

            expect(["hyper-assault-gauss-20", "hyper-assault-gauss-30", "hyper-assault-gauss-40", "protomech-autocannon-2", "protomech-autocannon-4", "protomech-autocannon-8"]
                .every(tag => clanItems.some(item => item.tag === tag))).toBe(true);
            expect(clanItem("hyper-assault-gauss-20").alphaStrike.rangeShort).toBe(1.328);
            // TO:AUE HAG 20/30/40 weigh 10/13/16 tons (the workbook listed 20).
            expect(clanItem("hyper-assault-gauss-40").weight).toBe(16);
            expect(clanItem("protomech-autocannon-8").space.protomech).toBe(2);
            // Clan Rotary AC/2 8 t; Rotary AC/5 10 t, 8 slots.
            expect(clanItem("clan-autocannon-rac-2").weight).toBe(8);
            expect(clanItem("clan-autocannon-rac-5").space.battlemech).toBe(8);
            expect(clanItem("clan-autocannon-uac-2").space.battlemech).toBe(2);
            expect(clanItem("nail-gun").weight).toBe(0.5);
            expect(isItems.find(item => item.tag === "nail-gun")?.space.battlemech).toBe(1);
        });
});
describe("ammunition Battle Value", () => {
    const isItems = getEquipmentListByTech("is");
    const weapon = (tag: string) => isItems.find(item => item.tag === tag)!;
    const lrmAmmo = mechUniversalAmmo.find(item => item.tag === "ammo-lrm-standard")!;
    const heatSeeking = mechUniversalAmmo.find(item => item.tag === "ammo-lrm-heat-seeking")!;

    it("prices minefield munitions from rack size and shots (TO:AUE pp.185, 197-198)", () => {
        const universal = (tag: string) => mechUniversalAmmo.find(item => item.tag === tag)!;
        const augmented = universal("ammo-lrm-thunder-augmented"); // 60 missiles per ton
        expect(getWeaponShotsPerTon(weapon("lrm-20"), lrmAmmo)).toBe(6);
        expect(getWeaponShotsPerTon(weapon("lrm-20"), augmented)).toBe(3);
        expect(getAmmoBattleValuePerTon(weapon("lrm-20"), augmented)).toBe(Math.ceil(20 / 2) * 7 * 3 / 5 * 4);
        expect(getAmmoBattleValuePerTon(weapon("lrm-20"), universal("ammo-lrm-thunder-inferno"))).toBe(20 * 3);
        expect(getAmmoBattleValuePerTon(weapon("lrm-20"), universal("ammo-lrm-thunder-active"))).toBe(20 * 3 / 5 * 6);
        const thunder = getEquipmentListByTech("is").find(item => item.tag === "ammo-is-lrm-thunder")!;
        expect(getAmmoBattleValuePerTon(weapon("lrm-20"), thunder)).toBe(20 * 6 / 5 * 4);
    });

    it("prices family ammo per launcher (TM p.229)", () => {
        expect(getAmmoBattleValuePerTon(weapon("lrm-5"), lrmAmmo)).toBe(6);
        expect(getAmmoBattleValuePerTon(weapon("lrm-10"), lrmAmmo)).toBe(11);
        expect(getAmmoBattleValuePerTon(weapon("lrm-20"), lrmAmmo)).toBe(23);
        expect(getAmmoBattleValuePerTon(weapon("lrm-20-artemis-iv"), lrmAmmo)).toBe(23);
    });

    it("applies special munition BV multipliers", () => {
        expect(heatSeeking.battleValueMultiplier).toBe(1.5);
        expect(getAmmoBattleValuePerTon(weapon("lrm-10"), heatSeeking)).toBe(16.5);
    });

    it("gives every canon ammo-fed weapon a standard ammo BV", () => {
        const missing = ["is", "clan"].flatMap(tech => getEquipmentListByTech(tech))
            .filter(item => !item.isAmmo && !item.isOneShot && ((item.shotsPerTon ?? 0) > 0 || getWeaponAmmoFamilies(item).length > 0) && item.ammoBattleValue === undefined)
            .filter(item => !item.tag.startsWith("enhanced_")) // apocryphal, pending review
            .map(item => item.tag);
        expect(missing).toEqual([]);
    });
});
