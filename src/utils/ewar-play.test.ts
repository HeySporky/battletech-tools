import { describe, expect, it } from "vitest";
import { EWarKind, IEWarCarrier, applyEWarBoard, clearEWarOverridesFor, setEWarOverride, getEWarClusterShift, getEWarWeaponClusterShifts, buildEWarAttack, getEWarMissileHits, getEWarLauncher, getEWarDefense, getEWarSemiGuided, applyEWarClusterShift, getEWarKind, getEWarNotes, getEWarToHit, normalizeEWarPlay, isEWarStealthOn, getEWarOwnAttackToHit, getEWarStealthNotes, IEWarTargetTicks, getEWarEcmEffective, getEWarEcmMode, getEWarGhostTargets, getEWarStreakLock, getEWarEcmEffects, getEWarProbe, getMissileDamageGroups, isClanEWarTag, withAttackerEcm, getEWarModeOptions, setEWarEcmMode, setEWarStealth, IC3Network, C3Role, inferC3Role, validateC3Network, getC3NetworkMap, getC3Status, IEWarAttack, IEWarBoard, getC3Members, tickC3Emergency, addC3SensorPod, getEWarEccmSuites, getEWarProbeNotes, AeroEcmClass, IEWarAeroEcmContext, getEWarAeroEcm, getNavalC3EccmRoll, getAeroEcmRadius, getInfantryNarcLeft, fireInfantryNarc, getForceEccmTick, getC3GearType } from "./ewar-play";
import { BLUE_SAVIOUR_GEAR_KEY, getPersonalEcmCover } from "./ewar-play";
import { getEquipmentCatalogDefinitions } from "../data/equipment-registry";
import { getEWarPlayRules } from "../data/rules-editions";
import { BattleMech } from "../classes/battlemech";
import Vehicle from "../classes/vehicle";
import AerospaceFighter from "../classes/aerospace-fighter";
import SmallCraft from "../classes/small-craft";
import CapitalShip from "../classes/capital-ship";
import InfantryPlatoon from "../classes/infantry-platoon";
import BattleArmor from "../classes/battle-armor";
import ProtoMech from "../classes/protomech";
import MicroMech from "../classes/micro-mech";
import Walker from "../classes/walker";
import Building from "../classes/building";
import BattledroidsUnit from "../classes/battledroids-unit";

const CASES: [EWarKind, string[]][] = [
    ["ams", ["is-ams", "clan-ams"]],
    ["laser-ams", ["is-laser-ams", "clan-laser-ams"]],
    ["apds", ["is-risc-apds"]],
    ["artemis-iv", ["lrm-15-artemis-iv", "clan-srm-6-artemis-iv", "mml-5-artemis-iv"]],
    ["artemis-v", ["clan-lrm-20-artemis-v"]],
    ["artemis-prototype", ["srm-4-artemis-p"]],
    ["apollo", ["mrm-30-apollo"]],
    ["narc", ["narc", "clan-narc", "narc-os", "prototype-narc", "is-compact-narc", "clan-compact-narc", "clan-narc-os", "narc-ios", "clan-narc-ios", "micro-narc-missile-beacon"]],
    ["inarc", ["inarc", "inarc-os", "custom-er-inarc", "micro-improved-narc-launcher"]],
    ["tag", ["is-tag", "clan-tag", "prototype-tag"]],
    // Battle armor Light TAG (TW p.229) and the Inner Sphere light TAG record.
    ["light-tag", ["clan-light-tag", "is-light-tag", "ba-is-light-tag", "ba-clan-light-tag"]],
    ["ecm-guardian", ["ecm-suite", "is-ecm-suite", "ba-is-ecm-suite", "micro-guardian-ecm-suite"]],
    ["ecm-guardian-prototype", ["guardian-ecm-prototype"]],
    ["ecm-angel", ["angel-ecm", "micro-angel-ecm", "is-angel-ecm", "clan-angel-ecm", "ba-is-angel-ecm", "ba-clan-angel-ecm"]],
    ["ecm-clan", ["clan-ecm-system", "clan-ecm-suite", "ba-clan-ecm-suite"]],
    ["ecm-watchdog", ["clan-watchdog-cews"]],
    ["ecm-nova", ["clan-nova-cews"]],
    ["ecm-personal", ["custom-personal-ecm"]],
    ["ecm-infantry", ["inf-armor-sneak-suit-ecm", "inf-armor-sneak-suit-camo-ecm", "inf-armor-sneak-suit-ir-ecm", "inf-armor-sneak-suit-camo-ir-ecm"]],
    // Battle armor active probes (TM p.252, TW p.129): the Inner Sphere suit probe is a Beagle (range 4), the Clan one the Clan probe (range 5).
    ["probe-beagle", ["beagle-active-probe", "is-active-probe", "ba-is-active-probe", "micro-beagle-active-probe"]],
    ["probe-beagle-prototype", ["beagle-active-probe-prototype"]],
    ["probe-bloodhound", ["bloodhound-active-probe"]],
    ["probe-clan", ["clan-active-probe", "ba-clan-active-probe"]],
    ["probe-light", ["clan-light-active-probe"]],
    ["c3-master", ["c3-computer-master"]],
    ["c3-slave", ["c3-computer-slave", "is-c3-system", "ba-is-c3-system"]],
    ["c3-boosted-master", ["c3-boosted-master"]],
    ["c3-boosted-slave", ["c3-boosted-slave"]],
    ["c3-emergency-master", ["c3-emergency-master"]],
    ["c3i", ["c3i-computer", "micro-c3i-computer", "is-improved-c3-system", "ba-is-improved-c3-system"]],
    ["c3-remote-sensor", ["c3-remote-sensor-launcher"]],
    ["c3-naval", ["naval-c3"]],
    ["chaff-pod", ["chaff-pod"]],
    ["c3-modular", ["custom-modular-c3"]],
    ["stealth-armor", ["stealth-basic"]],
    ["stealth-vehicular", ["vehicular-stealth"]],
    // "stealth-improved" is the battle-armor-only armor record (TM p.252); no book prints an Improved stealth armor for 'Mechs or vehicles.
    ["stealth-ba", ["ba-stealth-basic", "ba-stealth-improved", "ba-stealth-prototype", "ba-stealth-standard", "stealth-improved"]],
    ["null-sig", ["null-signature-system", "custom-null-signature-system"]],
    ["void-sig", ["void-signature-system"]],
    ["chameleon", ["chameleon-lps"]],
    ["mimetic", ["mimetic", "ba-mimetic"]],
    ["communications", ["communications-equipment"]],
    ["ew-equipment", ["ew-equipment"]],
];

describe("getEWarKind", () => {
    it("classifies every catalog E-War tag", () => {
        for (const [kind, tags] of CASES) {
            for (const tag of tags) {
                expect(getEWarKind(tag), tag).toBe(kind);
            }
        }
    });

    it("returns null for tags that are not E-War gear", () => {
        for (const tag of ["medium-laser", "ammo-clan-lrm-artemis-iv", "ammo-is-srm-artemis-iv", "ammo-clan-lrm-artemis-v", "ammo-is-ams-standard", "quirk-sensor-ghosts", "vdc-stealth", "inf-laser-pistol-sunbeam-nova"]) {
            expect(getEWarKind(tag), tag).toBeNull();
        }
    });
});

describe("E-War rule functions", () => {
    it("gives no modifiers under an edition with no E-War rules", () => {
        const carrier: IEWarCarrier = {
            getUUID: () => "u1",
            getRulesEdition: () => "battledroids",
            getEWarGear: () => [{ kind: "ecm-guardian", tag: "ecm-suite", name: "Guardian ECM Suite", destroyed: false }],
            ewarPlay: {},
        };
        expect(getEWarToHit(carrier, {})).toEqual([]);
        expect(getEWarClusterShift(carrier, {})).toEqual([]);
        expect(getEWarNotes(carrier)).toEqual([]);
    });
});

describe("E-War carriers", () => {
    it("every roster unit class is an E-War carrier", () => {
        // A type-level check: tsc fails here when a class lacks getUUID, getRulesEdition, getEWarGear or ewarPlay.
        const carriers: IEWarCarrier[] = [
            new BattleMech(), new Vehicle(), new AerospaceFighter(), new SmallCraft(), new CapitalShip(), new InfantryPlatoon(),
            new BattleArmor(), new ProtoMech(), new MicroMech(), new Walker(), new Building(), new BattledroidsUnit(),
        ];
        expect(carriers).toHaveLength(12);
        for (const carrier of carriers) {
            expect(carrier.getUUID()).toBeTruthy();
            expect(carrier.getEWarGear()).toEqual([]);
            expect(carrier.ewarPlay).toEqual({});
        }
    });
});

describe("E-War board apply", () => {
    it("applyEWarBoard writes the board, skips overridden fields and ignores enemy letters", () => {
        const a = new BattleMech();
        const b = new Vehicle();
        const board = { hostileEcm: [a.getUUID(), "e"], tagged: [b.getUUID()], narcPods: { [b.getUUID()]: [{ kind: "inarc" as const, pod: "haywire", turn: 1 }] } };
        setEWarOverride(a, "inHostileEcm", false);
        applyEWarBoard(board, [a, b]);
        expect(a.ewarPlay.inHostileEcm).toBe(false);
        expect(b.ewarPlay).toEqual({ tagged: true, narcPods: board.narcPods[b.getUUID()] });
        clearEWarOverridesFor([a], "inHostileEcm");
        expect(a.ewarPlay.overrides).toBeUndefined();
        applyEWarBoard(board, [a, b]);
        expect(a.ewarPlay.inHostileEcm).toBe(true);
    });
});

describe("E-War Phase 1: Cluster Hits shifts (#642)", () => {
    const carrier = (edition: string, gear: { kind: EWarKind; uuid: string; destroyed?: boolean }[]): IEWarCarrier => ({
        getUUID: () => "u1",
        getRulesEdition: () => edition,
        getEWarGear: () => gear.map(item => ({ kind: item.kind, tag: item.kind, name: item.kind, uuid: item.uuid, destroyed: item.destroyed ?? false })),
        ewarPlay: {},
    });
    const lrm = { family: "lrm" as const, size: 15 };
    it("artemis iv adds 2 for an lrm with artemis ammo", () => {
        const unit = carrier("total-warfare", [{ kind: "artemis-iv", uuid: "w1" }]);
        expect(getEWarClusterShift(unit, { weaponUuid: "w1", ammoTag: "ammo-is-lrm-artemis-iv", launcher: lrm })).toEqual([{ modifier: 2, label: "Artemis IV (+2)" }]);
    });
    it("artemis iv gives nothing for a streak launcher and says so", () => {
        const unit = carrier("total-warfare", [{ kind: "artemis-iv", uuid: "w1" }]);
        expect(getEWarClusterShift(unit, { weaponUuid: "w1", launcher: { family: "streak", size: 6 } })).toEqual([{ modifier: 0, label: "Artemis IV: not with Streak" }]);
    });
    it("artemis iv gives nothing on indirect fire", () => {
        const unit = carrier("master-rules", [{ kind: "artemis-iv", uuid: "w1" }]);
        expect(getEWarClusterShift(unit, { weaponUuid: "w1", launcher: { ...lrm, indirect: true } })).toEqual([{ modifier: 0, label: "Artemis IV: not with indirect" }]);
    });
    it("artemis iv with ordinary ammo gives nothing", () => {
        const unit = carrier("total-warfare", [{ kind: "artemis-iv", uuid: "w1" }]);
        expect(getEWarClusterShift(unit, { weaponUuid: "w1", ammoTag: "ammo-lrm-standard", launcher: lrm })).toEqual([{ modifier: 0, label: "Artemis IV: not loaded with Artemis ammunition" }]);
    });
    it("hostile ecm cancels artemis and narc, but not apollo, and eccm restores them", () => {
        const unit = carrier("battlemech-manual", [{ kind: "artemis-iv", uuid: "w1" }, { kind: "apollo", uuid: "w2" }]);
        expect(getEWarClusterShift(unit, { weaponUuid: "w1", hostileEcmOnLine: true, launcher: lrm })).toEqual([{ modifier: 0, label: "Artemis IV: hostile ECM" }]);
        expect(getEWarClusterShift(unit, { weaponUuid: "w1", hostileEcmOnLine: true, friendlyEccmOnLine: true, launcher: lrm })).toEqual([{ modifier: 2, label: "Artemis IV (+2)" }]);
        expect(getEWarClusterShift(unit, { weaponUuid: "w2", hostileEcmOnLine: true, launcher: { family: "mrm", size: 20 } })).toEqual([{ modifier: -1, label: "Apollo (-1)" }]);
        const plain = carrier("master-rules", []);
        expect(getEWarClusterShift(plain, { ammoTag: "ammo-lrm-narc", target: { narcPods: ["homing"] }, hostileEcmOnLine: true, launcher: lrm })).toEqual([{ modifier: 0, label: "Narc pod: hostile ECM" }]);
    });
    it("narc pod on the target adds 2 once, not once per pod", () => {
        const plain = carrier("core-rulebook", []);
        expect(getEWarClusterShift(plain, { ammoTag: "ammo-lrm-narc", target: { narcPods: ["homing", "narc"] }, launcher: lrm })).toEqual([{ modifier: 2, label: "Narc pod (+2)" }]);
        expect(getEWarClusterShift(plain, { ammoTag: "ammo-lrm-narc", target: { narcPods: ["haywire"] }, launcher: lrm })).toEqual([]);
    });
    it("artemis v adds 3 and the result is capped at 12", () => {
        const unit = carrier("total-warfare", [{ kind: "artemis-v", uuid: "w1" }]);
        const shifts = getEWarClusterShift(unit, { weaponUuid: "w1", ammoTag: "ammo-clan-lrm-artemis-v", launcher: lrm });
        expect(shifts).toEqual([{ modifier: 3, label: "Artemis V (+3)" }]);
        expect(applyEWarClusterShift(11, shifts)).toBe(12);
        expect(applyEWarClusterShift(2, [{ modifier: -4, label: "AMS" }])).toBe(2);
    });
    it("a destroyed artemis item gives nothing", () => {
        const unit = carrier("total-warfare", [{ kind: "artemis-iv", uuid: "w1", destroyed: true }]);
        expect(getEWarClusterShift(unit, { weaponUuid: "w1", launcher: lrm })).toEqual([]);
    });
    it("an edition without the item gives a zero modifier labelled as such, and an edition without rules gives none", () => {
        const plain = carrier("battletech-compendium", []);
        expect(getEWarClusterShift(plain, { ammoTag: "ammo-lrm-narc", target: { narcPods: ["homing"] }, launcher: lrm })).toEqual([{ modifier: 2, label: "Narc pod (+2)" }]);
        const unit = carrier("battletech-compendium", [{ kind: "apollo", uuid: "w1" }]);
        expect(getEWarClusterShift(unit, { weaponUuid: "w1", launcher: { family: "mrm", size: 10 } })).toEqual([{ modifier: 0, label: "Apollo: not in this edition" }]);
        expect(getEWarClusterShift(carrier("battletech-4th-edition", [{ kind: "artemis-iv", uuid: "w1" }]), { weaponUuid: "w1", launcher: lrm })).toEqual([]);
    });
});

describe("E-War Phase 1: to-hit effects, TAG and semi-guided ammunition (#642)", () => {
    const carrier = (edition: string, gear: { kind: EWarKind; uuid: string }[] = []): IEWarCarrier => ({
        getUUID: () => "u1",
        getRulesEdition: () => edition,
        getEWarGear: () => gear.map(item => ({ kind: item.kind, tag: item.kind, name: item.kind, uuid: item.uuid, destroyed: false })),
        ewarPlay: {},
    });
    const lrm = { family: "lrm" as const, size: 15 };
    it("artemis v is -1 to hit under tw and bmm, and nothing under bmr before Maximum Tech is used", () => {
        const artemisV = { weaponUuid: "w1", ammoTag: "ammo-clan-lrm-artemis-v", launcher: lrm };
        expect(getEWarToHit(carrier("total-warfare", [{ kind: "artemis-v", uuid: "w1" }]), artemisV)).toEqual([{ modifier: -1, label: "Artemis V (-1)" }]);
        expect(getEWarToHit(carrier("battlemech-manual", [{ kind: "artemis-v", uuid: "w1" }]), artemisV)).toEqual([{ modifier: -1, label: "Artemis V (-1)" }]);
        expect(getEWarToHit(carrier("total-warfare", [{ kind: "artemis-v", uuid: "w1" }]), { ...artemisV, hostileEcmOnLine: true })).toEqual([{ modifier: 0, label: "Artemis V: hostile ECM" }]);
    });
    it("a homing inarc pod is -1 to hit, a core rulebook narc pod is -1, and an older narc pod is not", () => {
        const narcAmmo = { ammoTag: "ammo-lrm-narc", launcher: lrm };
        expect(getEWarToHit(carrier("total-warfare"), { ...narcAmmo, target: { narcPods: ["homing"] } })).toEqual([{ modifier: -1, label: "iNarc homing pod (-1)" }]);
        expect(getEWarToHit(carrier("core-rulebook"), { ...narcAmmo, target: { narcPods: ["narc"] } })).toEqual([{ modifier: -1, label: "Narc pod (-1)" }]);
        expect(getEWarToHit(carrier("master-rules"), { ...narcAmmo, target: { narcPods: ["narc"] } })).toEqual([]);
    });
    it("semi-guided lrm ignores target movement under bmr on a tagged target, and indirect penalties too", () => {
        const sg = { ammoTag: "ammo-is-lrm-semi-guided", target: { tagged: true }, launcher: lrm };
        expect(getEWarSemiGuided(carrier("master-rules"), sg)).toMatchObject({ applies: true, ignoreTargetMovement: true, ignoreIndirectModifiers: false, clusterShift: [] });
        expect(getEWarSemiGuided(carrier("master-rules"), { ...sg, launcher: { ...lrm, indirect: true } })).toMatchObject({ ignoreTargetMovement: true, ignoreIndirectModifiers: true });
    });
    it("semi-guided lrm gives nothing without a tagged target under tw and says so, and no ecm stops tag", () => {
        const result = getEWarSemiGuided(carrier("total-warfare"), { ammoTag: "ammo-is-lrm-semi-guided", hostileEcmOnLine: true, target: { tagged: false }, launcher: lrm });
        expect(result).toMatchObject({ applies: false, ignoreTargetMovement: false, label: "Semi-guided: target not designated by TAG" });
        expect(getEWarSemiGuided(carrier("total-warfare"), { ammoTag: "ammo-is-lrm-semi-guided", hostileEcmOnLine: true, target: { tagged: true }, launcher: lrm }).ignoreTargetMovement).toBe(true);
    });
    it("core rulebook semi-guided is -1 cluster untagged and +2 cluster with a terrain bonus when tagged", () => {
        const sg = { ammoTag: "ammo-is-lrm-semi-guided", launcher: lrm };
        expect(getEWarSemiGuided(carrier("core-rulebook"), { ...sg, target: { tagged: false } }).clusterShift).toEqual([{ modifier: -1, label: "Semi-guided (-1)" }]);
        expect(getEWarSemiGuided(carrier("core-rulebook"), { ...sg, target: { tagged: true } })).toMatchObject({ clusterShift: [{ modifier: 2, label: "Semi-guided, TAG-designated (+2)" }], terrainReduction: 2, ignorePartialCover: true });
    });
    it("semi-guided does nothing under the compendium, whose tag only spots for Arrow IV homing, and for other ammunition", () => {
        expect(getEWarSemiGuided(carrier("battletech-compendium"), { ammoTag: "ammo-is-lrm-semi-guided", target: { tagged: true }, launcher: lrm })).toMatchObject({ applies: false, label: "Semi-guided: not in this edition" });
        expect(getEWarSemiGuided(carrier("total-warfare"), { ammoTag: "ammo-lrm-standard", target: { tagged: true }, launcher: lrm })).toMatchObject({ applies: false, label: "" });
    });
});

describe("E-War Phase 1: defenses (#642)", () => {
    const carrier = (edition: string, gear: { kind: EWarKind; uuid: string; tag?: string; destroyed?: boolean }[], uses?: Record<string, number>): IEWarCarrier => ({
        getUUID: () => "d1",
        getRulesEdition: () => edition,
        getEWarGear: () => gear.map(item => ({ kind: item.kind, tag: item.tag ?? item.kind, name: item.kind, uuid: item.uuid, destroyed: item.destroyed ?? false })),
        ewarPlay: uses ? { amsUses: uses } : {},
    });
    it("ams under btc is 1d6 missiles destroyed and twice that in ammunition, clan ams 2d6", () => {
        const is = getEWarDefense(carrier("battletech-compendium", [{ kind: "ams", uuid: "a1", tag: "is-ams" }]), { missileAttack: true, launcherSize: 20 });
        expect(is).toMatchObject({ applies: true, mode: "missiles-destroyed", destroyedDice: 1, beforeRoll: true, ammoRoll: { dice: 1, multiplier: 2 }, spentGearUuid: "a1" });
        const clan = getEWarDefense(carrier("battletech-compendium", [{ kind: "ams", uuid: "a1", tag: "clan-ams" }]), { missileAttack: true, launcherSize: 20 });
        expect(clan.destroyedDice).toBe(2);
    });
    it("ams under bmm is a -4 shift, 1 heat and 1 ammunition, once a turn", () => {
        const unit = carrier("battlemech-manual", [{ kind: "ams", uuid: "a1", tag: "is-ams" }]);
        expect(getEWarDefense(unit, { missileAttack: true, launcherSize: 15 })).toMatchObject({ applies: true, mode: "cluster-shift", shift: -4, heat: 1, ammoShots: 1, labels: ["AMS (-4)"] });
        const used = carrier("battlemech-manual", [{ kind: "ams", uuid: "a1", tag: "is-ams" }], { a1: 1 });
        expect(getEWarDefense(used, { missileAttack: true, launcherSize: 15 }).applies).toBe(false);
    });
    it("the core rulebook lets an ams engage a second missile attack in a turn", () => {
        const unit = carrier("core-rulebook", [{ kind: "ams", uuid: "a1", tag: "is-ams" }], { a1: 1 });
        expect(getEWarDefense(unit, { missileAttack: true, launcherSize: 15 }).applies).toBe(true);
        const twice = carrier("core-rulebook", [{ kind: "ams", uuid: "a1", tag: "is-ams" }], { a1: 2 });
        expect(getEWarDefense(twice, { missileAttack: true, launcherSize: 15 }).applies).toBe(false);
    });
    it("a second ams on the unit takes over when the first has engaged", () => {
        const unit = carrier("total-warfare", [{ kind: "ams", uuid: "a1", tag: "is-ams" }, { kind: "ams", uuid: "a2", tag: "is-ams" }], { a1: 1 });
        expect(getEWarDefense(unit, { missileAttack: true, launcherSize: 6 })).toMatchObject({ applies: true, spentGearUuid: "a2" });
    });
    it("no ammunition, a destroyed item, a non-missile attack or an edition without ams gives no defense", () => {
        const unit = carrier("total-warfare", [{ kind: "ams", uuid: "a1", tag: "is-ams" }]);
        expect(getEWarDefense(unit, { missileAttack: true, launcherSize: 6, ammoShots: { a1: 0 } }).applies).toBe(false);
        expect(getEWarDefense(unit, { missileAttack: false, launcherSize: 6 }).applies).toBe(false);
        expect(getEWarDefense(carrier("total-warfare", [{ kind: "ams", uuid: "a1", destroyed: true }]), { missileAttack: true, launcherSize: 6 }).applies).toBe(false);
        expect(getEWarDefense(carrier("battletech-4th-edition", [{ kind: "ams", uuid: "a1" }]), { missileAttack: true, launcherSize: 6 }).applies).toBe(false);
    });
    it("laser ams needs no ammunition, and under maximum tech the heat is the 2d6 roll", () => {
        const tw = getEWarDefense(carrier("total-warfare", [{ kind: "laser-ams", uuid: "l1" }]), { missileAttack: true, launcherSize: 10, ammoShots: { l1: 0 } });
        expect(tw).toMatchObject({ applies: true, mode: "cluster-shift", shift: -4, heat: 7, ammoShots: 0 });
        const mt = getEWarDefense(carrier("master-rules", [{ kind: "laser-ams", uuid: "l1" }]), { missileAttack: true, launcherSize: 10 });
        expect(mt).toMatchObject({ applies: true, mode: "missiles-destroyed", destroyedDice: 2, heatFromRoll: true, ammoShots: 0 });
    });
    it("apds defends a friend at -3 one hex away and not beyond three hexes, and a streak is treated as an 11 first", () => {
        const unit = carrier("total-warfare", [{ kind: "apds", uuid: "p1" }]);
        expect(getEWarDefense(unit, { missileAttack: true, launcherSize: 20, friendlyDistance: 1 })).toMatchObject({ applies: true, shift: -3 });
        expect(getEWarDefense(unit, { missileAttack: true, launcherSize: 20, friendlyDistance: 4 }).applies).toBe(false);
        const streak = getEWarDefense(unit, { missileAttack: true, launcherSize: 6, streak: true });
        expect(streak).toMatchObject({ applies: true, shift: -4, streakBaseRoll: 11 });
    });
});

describe("getEWarLauncher", () => {
    it("reads the family and size from a weapon tag", () => {
        expect(getEWarLauncher("clan-lrm-20-artemis-v")).toEqual({ family: "lrm", size: 20, indirect: undefined });
        expect(getEWarLauncher("is-streak-srm-4")).toMatchObject({ family: "streak", size: 4 });
        expect(getEWarLauncher("mrm-30-apollo", true)).toEqual({ family: "mrm", size: 30, indirect: true });
        expect(getEWarLauncher("medium-laser")).toBeUndefined();
    });
});

describe("E-War Phase 1: attack and missile-hit helpers", () => {
    const hits = (roll: number, size: number) => roll * 10 + size;
    it("buildEWarAttack carries the weapon, ammunition and target ticks", () => {
        expect(buildEWarAttack({ uuid: "w1", tag: "lrm-15-artemis-iv" }, { tag: "ammo-is-lrm-artemis-iv" }, { hostileEcm: true, narcPods: ["narc"], tagged: true, indirectFire: true }))
            .toEqual({
                weaponUuid: "w1", ammoTag: "ammo-is-lrm-artemis-iv", hostileEcmOnLine: true, friendlyEccmOnLine: undefined,
                launcher: { family: "lrm", size: 15, indirect: true }, target: { narcPods: ["narc"], tagged: true },
            });
    });
    it("a cluster-shift defense shifts the roll before the table lookup, and a destroyed-missiles defense subtracts after it", () => {
        const shift = { applies: true, mode: "cluster-shift" as const, shift: -4, heat: 1, ammoShots: 1, labels: [] };
        expect(getEWarMissileHits(shift, 15, 9, 0, hits)).toBe(5 * 10 + 15);
        const destroyed = { applies: true, mode: "missiles-destroyed" as const, destroyedDice: 1, heat: 0, ammoShots: 0, labels: [] };
        expect(getEWarMissileHits(destroyed, 15, 9, 4, (roll, size) => roll === 9 ? 12 : size)).toBe(8);
        expect(getEWarMissileHits(destroyed, 15, 9, 20, (roll, size) => roll === 9 ? 12 : size)).toBe(0);
        expect(getEWarMissileHits({ applies: false, heat: 0, ammoShots: 0, labels: [] }, 15, 9, 0, hits)).toBe(9 * 10 + 15);
    });
});

describe("E-War Phase 1: the cluster shifts for one weapon of a unit", () => {
    it("finds the loaded ammunition, adds the semi-guided shift and uses the target ticks", () => {
        const unit = {
            getUUID: () => "u1", getRulesEdition: () => "core-rulebook", ewarPlay: {},
            getEWarGear: () => [{ kind: "artemis-iv" as const, tag: "lrm-15-artemis-iv", name: "LRM 15 + Artemis IV", uuid: "w1", destroyed: false }],
            equipmentList: [
                { uuid: "w1", tag: "lrm-15-artemis-iv", selectedAmmoBinUUID: "b1" },
                { uuid: "b1", tag: "ammo-is-lrm-artemis-iv" },
            ],
        };
        expect(getEWarWeaponClusterShifts(unit, 0, { narcPods: ["narc"] }).map(shift => shift.label)).toEqual(["Artemis IV (+2)", "Narc pod: needs Narc-capable missiles"]);
        expect(getEWarWeaponClusterShifts(unit, 0, { hostileEcm: true }).map(shift => shift.label)).toEqual(["Artemis IV: hostile ECM"]);
        const tw = { ...unit, getRulesEdition: () => "total-warfare" };
        expect(getEWarWeaponClusterShifts(tw, 0, { hostileEcmCount: 1, friendlyEccmCount: 1 }).map(shift => shift.label)).toEqual(["Artemis IV (+2)"]);
        expect(getEWarWeaponClusterShifts(tw, 0, { hostileEcmCount: 2, friendlyEccmCount: 1 }).map(shift => shift.label)).toEqual(["Artemis IV: hostile ECM"]);
        const semi = { ...unit, equipmentList: [{ uuid: "w1", tag: "lrm-15", selectedAmmoBinUUID: "b1" }, { uuid: "b1", tag: "ammo-is-lrm-semi-guided" }], getEWarGear: () => [] };
        expect(getEWarWeaponClusterShifts(semi, 0, { tagged: true }).map(shift => shift.label)).toEqual(["Semi-guided, TAG-designated (+2)"]);
    });
});

describe("E-War Phase 1: the gear notes a play view shows", () => {
    const carrier = (edition: string, gear: { kind: EWarKind; tag?: string; destroyed?: boolean }[]): IEWarCarrier => ({
        getUUID: () => "u1",
        getRulesEdition: () => edition,
        getEWarGear: () => gear.map((item, index) => ({ kind: item.kind, tag: item.tag ?? item.kind, name: item.kind, uuid: "g" + index, destroyed: item.destroyed ?? false })),
        ewarPlay: {},
    });
    it("states each missile item with its edition numbers and page", () => {
        const notes = getEWarNotes(carrier("total-warfare", [{ kind: "artemis-iv" }, { kind: "ams" }, { kind: "tag" }]));
        expect(notes).toContain("Artemis IV: +2 on the Cluster Hits roll; not with streak, narc, swarm, thunder, indirect; hostile ECM cancels it (TW p.130)");
        expect(notes).toContain("AMS: -4 on the attacker Cluster Hits roll, 1 heat and 1 ammunition, 1 missile attack a turn (TW p.129)");
        expect(notes).toContain("TAG: designates a target for the turn, for semi-guided LRMs as well as Arrow IV homing missiles (TW p.142)");
    });
    it("states the older AMS as missiles shot down, and the Clan dice", () => {
        expect(getEWarNotes(carrier("battletech-compendium", [{ kind: "ams", tag: "is-ams" }]))).toEqual(["AMS: shoots down 1D6 missiles of a missile attack before the to-hit roll (2D6 for the Clan AMS), spending 1D6 x 2 ammunition and 1 heat (BTC p.117)"]);
    });
    it("says nothing for a destroyed item, a kind with no Phase 1 rule or an edition without the rules", () => {
        expect(getEWarNotes(carrier("total-warfare", [{ kind: "artemis-iv", destroyed: true }, { kind: "ecm-guardian" }]))).toEqual([]);
        expect(getEWarNotes(carrier("battletech-4th-edition", [{ kind: "ams" }]))).toEqual([]);
    });
});

describe("E-War Phase 1 review fixes (#642)", () => {
    const carrier = (edition: string, gear: { kind: EWarKind; uuid?: string }[] = []): IEWarCarrier => ({
        getUUID: () => "u1", getRulesEdition: () => edition, ewarPlay: {},
        getEWarGear: () => gear.map(item => ({ kind: item.kind, tag: item.kind, name: item.kind, uuid: item.uuid, destroyed: false })),
    });
    const lrm = { family: "lrm" as const, size: 20 };
    it("a Narc pod gives a laser nothing and an LRM with ordinary ammunition a labelled zero", () => {
        const pods = { target: { narcPods: ["narc"] } };
        expect(getEWarClusterShift(carrier("total-warfare"), { ...pods })).toEqual([]);
        expect(getEWarClusterShift(carrier("total-warfare"), { ...pods, ammoTag: "ammo-lrm-standard", launcher: lrm })).toEqual([{ modifier: 0, label: "Narc pod: needs Narc-capable missiles" }]);
    });
    it("the Narc bonus is lost on indirect fire and with Artemis ammunition", () => {
        const base = { ammoTag: "ammo-lrm-narc", target: { narcPods: ["narc"] } };
        expect(getEWarClusterShift(carrier("total-warfare"), { ...base, launcher: { ...lrm, indirect: true } })).toEqual([{ modifier: 0, label: "Narc pod: not with indirect" }]);
        expect(getEWarClusterShift(carrier("total-warfare"), { ammoTag: "ammo-is-lrm-artemis-iv-narc", launcher: lrm, target: { narcPods: ["narc"] } })).toEqual([{ modifier: 0, label: "Narc pod: not with artemis" }]);
    });
    it("under Total Warfare and the Core Rulebook only a pod inside hostile ECM loses its bonus; under the Master Rules the attacker in ECM does too", () => {
        const narc = { ammoTag: "ammo-lrm-narc", launcher: lrm, target: { narcPods: ["narc"] } };
        expect(getEWarClusterShift(carrier("total-warfare"), { ...narc, hostileEcmOnLine: true })).toEqual([{ modifier: 2, label: "Narc pod (+2)" }]);
        expect(getEWarClusterShift(carrier("total-warfare"), { ...narc, hostileEcmOnLine: true, targetInHostileEcm: true })).toEqual([{ modifier: 0, label: "Narc pod: hostile ECM" }]);
        expect(getEWarClusterShift(carrier("master-rules"), { ...narc, hostileEcmOnLine: true })).toEqual([{ modifier: 0, label: "Narc pod: hostile ECM" }]);
    });
    it("Apollo is -1 under the Total Warfare family and +1 under the Core Rulebook (it removes the MRM -1 there)", () => {
        const apollo = { weaponUuid: "w1", launcher: { family: "mrm" as const, size: 20 } };
        expect(getEWarClusterShift(carrier("total-warfare", [{ kind: "apollo", uuid: "w1" }]), apollo)).toEqual([{ modifier: -1, label: "Apollo (-1)" }]);
        expect(getEWarClusterShift(carrier("core-rulebook", [{ kind: "apollo", uuid: "w1" }]), apollo).map(shift => shift.modifier)).toEqual([-1, 1]);
    });
    it("a roll pushed below 2 destroys the whole flight where the book says so, and is held at 2 where it does not", () => {
        const crb = getEWarDefense(carrier("core-rulebook", [{ kind: "ams", uuid: "a1" }]), { missileAttack: true, launcherSize: 20 });
        const tw = getEWarDefense(carrier("total-warfare", [{ kind: "ams", uuid: "a1" }]), { missileAttack: true, launcherSize: 20 });
        const table = (roll: number) => roll * 10;
        expect(getEWarMissileHits(crb, 20, 4, 0, table)).toBe(0);
        expect(getEWarMissileHits(tw, 20, 4, 0, table)).toBe(20);
        expect(getEWarMissileHits(crb, 20, 6, 0, table)).toBe(20);
    });
    it("the attacker Artemis or Narc shift adds to the roll before the defense shift", () => {
        const tw = getEWarDefense(carrier("total-warfare", [{ kind: "ams", uuid: "a1" }]), { missileAttack: true, launcherSize: 20 });
        expect(getEWarMissileHits(tw, 20, 7, 0, roll => roll * 10, 2)).toBe(50);
    });
    it("the Compendium AMS shoots first: the survivors pick the table column, and the ammunition is its own roll", () => {
        const btc = getEWarDefense(carrier("battletech-compendium", [{ kind: "ams", uuid: "a1" }]), { missileAttack: true, launcherSize: 20 });
        expect(btc).toMatchObject({ beforeRoll: true, heat: 1, ammoRoll: { dice: 1, multiplier: 2 } });
        const hitsFor = (_roll: number, size: number) => size;
        // The Compendium columns are 2, 4, 5, 6, 10, 15 and 20 (RoW p.38), and a flight cannot hit with more than its survivors.
        expect(getEWarMissileHits(btc, 20, 7, 4, hitsFor)).toBe(15);
        expect(getEWarMissileHits(btc, 20, 7, 5, hitsFor)).toBe(15);
        expect(getEWarMissileHits(btc, 10, 7, 1, hitsFor)).toBe(9);
        expect(getEWarMissileHits(btc, 10, 7, 2, hitsFor)).toBe(6);
        expect(getEWarMissileHits(btc, 5, 7, 4, () => 99)).toBe(1);
        expect(getEWarMissileHits(btc, 5, 7, 5, () => 99)).toBe(0);
    });
    it("the Master Rules AMS spends one shot for each missile destroyed and 1 heat", () => {
        const bmr = getEWarDefense(carrier("master-rules", [{ kind: "ams", uuid: "a1" }]), { missileAttack: true, launcherSize: 20 });
        expect(bmr).toMatchObject({ ammoPerMissile: 1, heat: 1 });
        expect(bmr.beforeRoll).toBeFalsy();
    });
    it("APDS is 2 heat and a Total Warfare Laser AMS is 7 (Clan 5)", () => {
        expect(getEWarDefense(carrier("total-warfare", [{ kind: "apds", uuid: "p1" }]), { missileAttack: true, launcherSize: 10 }).heat).toBe(2);
        expect(getEWarDefense(carrier("total-warfare", [{ kind: "laser-ams", uuid: "l1" }]), { missileAttack: true, launcherSize: 10 }).heat).toBe(7);
    });
});

describe("E-War Phase 2: per-system stealth state", () => {
    const gear = (kind: EWarKind, uuid?: string) => ({ kind, tag: kind, name: kind, uuid, destroyed: false });
    const carrier = (ewarPlay: object): IEWarCarrier => ({ getUUID: () => "u", getRulesEdition: () => "total-warfare", getEWarGear: () => [], ewarPlay });
    it("turns a legacy boolean into the any-system key", () => {
        expect(normalizeEWarPlay({ stealthOn: true })).toEqual({ stealthOn: { "*": true } });
        expect(normalizeEWarPlay({ stealthOn: false })).toEqual({});
    });
    it("passes a map through and rejects garbage", () => {
        expect(normalizeEWarPlay({ stealthOn: { a: true }, inHostileEcm: true })).toEqual({ stealthOn: { a: true }, inHostileEcm: true });
        expect(normalizeEWarPlay("x")).toEqual({});
        expect(normalizeEWarPlay([1])).toEqual({});
        expect(normalizeEWarPlay(null)).toEqual({});
    });
    it("reads a gear on-state by uuid, by kind, or by the legacy key", () => {
        expect(isEWarStealthOn(carrier({ stealthOn: { "*": true } }), gear("null-sig"))).toBe(true);
        expect(isEWarStealthOn(carrier({ stealthOn: { g1: true } }), gear("null-sig", "g1"))).toBe(true);
        expect(isEWarStealthOn(carrier({ stealthOn: { g1: true } }), gear("null-sig", "g2"))).toBe(false);
        expect(isEWarStealthOn(carrier({ stealthOn: { chameleon: true } }), gear("chameleon"))).toBe(true);
        expect(isEWarStealthOn(carrier({}), gear("chameleon"))).toBe(false);
    });
});

describe("E-War Phase 2: stealth to-hit and notes", () => {
    const carrier = (edition: string, gear: { kind: EWarKind; uuid?: string; destroyed?: boolean }[] = [], ewarPlay: object = {}): IEWarCarrier => ({
        getUUID: () => "u", getRulesEdition: () => edition, ewarPlay,
        getEWarGear: () => gear.map(g => ({ kind: g.kind, tag: g.kind, name: g.kind, uuid: g.uuid, destroyed: !!g.destroyed })),
    });
    const against = (stealth: { kind: EWarKind; moved?: number }[], rangeBand?: "short" | "medium" | "long" | "extreme") => ({ target: { stealth }, rangeBand });
    const total = (mods: { modifier: number }[]) => mods.reduce((sum, m) => sum + m.modifier, 0);

    it("stealth armor adds 1 medium and 2 long under tw, bmm and bmr(r) (the +3 and +6 replace the standard modifiers)", () => {
        expect(total(getEWarToHit(carrier("total-warfare"), against([{ kind: "stealth-armor" }], "medium")))).toBe(1);
        expect(total(getEWarToHit(carrier("battlemech-manual"), against([{ kind: "stealth-armor" }], "long")))).toBe(2);
        expect(total(getEWarToHit(carrier("master-rules-revised"), against([{ kind: "stealth-armor" }], "medium")))).toBe(1);
        expect(total(getEWarToHit(carrier("master-rules-revised"), against([{ kind: "stealth-armor" }], "long")))).toBe(2);
        expect(total(getEWarToHit(carrier("total-warfare"), against([{ kind: "stealth-armor" }], "short")))).toBe(0);
        expect(getEWarToHit(carrier("total-warfare"), against([{ kind: "stealth-armor" }], "medium"))[0].label).toBe("Stealth armor (+1 medium)");
    });
    it("null-sig and chameleon stack to 2 medium and 4 long", () => {
        const both = [{ kind: "null-sig" as EWarKind }, { kind: "chameleon" as EWarKind }];
        expect(total(getEWarToHit(carrier("total-warfare"), against(both, "medium")))).toBe(2);
        expect(total(getEWarToHit(carrier("total-warfare"), against(both, "long")))).toBe(4);
    });
    it("chameleon is refused with void-sig", () => {
        const mods = getEWarToHit(carrier("total-warfare"), against([{ kind: "void-sig", moved: 0 }, { kind: "chameleon" }], "medium"));
        expect(total(mods)).toBe(3);
        expect(mods.find(m => m.label.startsWith("Chameleon"))).toEqual({ modifier: 0, label: "Chameleon LPS: not with Void-Signature" });
    });
    it("void-sig modifier follows hexes moved, 3 at 0 and none at 6", () => {
        const at = (moved: number) => total(getEWarToHit(carrier("total-warfare"), against([{ kind: "void-sig", moved }], "medium")));
        expect([at(0), at(1), at(2), at(3), at(5), at(6), at(9)]).toEqual([3, 2, 2, 1, 1, 0, 0]);
    });
    it("mimetic follows hexes moved under tw and bmr(r) and does nothing under bmr", () => {
        const at = (edition: string, moved: number) => total(getEWarToHit(carrier(edition), against([{ kind: "mimetic", moved }], "medium")));
        expect([at("total-warfare", 0), at("total-warfare", 2), at("total-warfare", 3)]).toEqual([3, 1, 0]);
        expect(at("master-rules-revised", 1)).toBe(1);
        expect(at("master-rules", 0)).toBe(0);
        expect(getEWarToHit(carrier("master-rules"), against([{ kind: "mimetic", moved: 0 }], "medium"))[0].label).toMatch(/not in/);
    });
    it("bt3 gives a label saying the edition lacks it", () => {
        const mods = getEWarToHit(carrier("battletech-3rd-edition"), against([{ kind: "null-sig" }], "medium"));
        expect(mods).toHaveLength(1);
        expect(mods[0].modifier).toBe(0);
        expect(mods[0].label).toMatch(/Null-Signature: not in /);
    });
    it("a stealth system gives no modifier at a range band the table leaves out", () => {
        expect(total(getEWarToHit(carrier("total-warfare"), against([{ kind: "null-sig" }], "short")))).toBe(0);
        expect(total(getEWarToHit(carrier("total-warfare"), against([{ kind: "null-sig" }], "extreme")))).toBe(2);
    });
    it("getEWarOwnAttackToHit gives +1 for a working void-sig that is on", () => {
        const gear = [{ kind: "void-sig" as EWarKind, uuid: "v1" }, { kind: "ecm-guardian" as EWarKind, uuid: "e1" }];
        expect(getEWarOwnAttackToHit(carrier("total-warfare", gear, { stealthOn: { v1: true } }), {})).toEqual([{ modifier: 1, label: "Void-Signature (+1 to own attacks)" }]);
        expect(getEWarOwnAttackToHit(carrier("total-warfare", gear), {})).toEqual([]);
        expect(getEWarOwnAttackToHit(carrier("total-warfare", [{ kind: "void-sig", uuid: "v1", destroyed: true }, { kind: "ecm-guardian", uuid: "e1" }], { stealthOn: { v1: true } }), {})).toEqual([]);
    });
    it("a destroyed own stealth system gives no notes; a working one lists heat and ecm", () => {
        expect(getEWarStealthNotes(carrier("battlemech-manual", [{ kind: "stealth-armor", destroyed: true }]))).toEqual([]);
        const notes = getEWarStealthNotes(carrier("battlemech-manual", [{ kind: "stealth-armor" }]));
        expect(notes).toHaveLength(1);
        expect(notes[0]).toContain("+1 medium");
        expect(notes[0]).toContain("+2 long");
        expect(notes[0]).toContain("10 heat");
        expect(notes[0]).toContain("ECM switched off");
        expect(notes[0]).toContain("BMM p.115");
        expect(getEWarNotes(carrier("battlemech-manual", [{ kind: "stealth-armor" }]))).toContain(notes[0]);
    });
});

const getGear = (unit: IEWarCarrier, uuid: string) => unit.getEWarGear().find(gear => gear.uuid === uuid)!;

describe("E-War Phase 2: ECM, ECCM, Angel and ghost targets", () => {
    const carrier = (edition: string, gear: { kind: EWarKind; uuid?: string; destroyed?: boolean }[] = [], ewarPlay: object = {}): IEWarCarrier => ({
        getUUID: () => "u", getRulesEdition: () => edition, ewarPlay,
        getEWarGear: () => gear.map(g => ({ kind: g.kind, tag: g.kind, name: g.kind, uuid: g.uuid, destroyed: !!g.destroyed })),
    });
    const works = (edition: string, ticks: IEWarTargetTicks) => getEWarEcmEffective(ticks, edition).ecmWorks;

    it("two hostile ecm against one eccm still works, equal does not (tw)", () => {
        expect(works("total-warfare", { hostileEcmCount: 2, friendlyEccmCount: 1 })).toBe(true);
        expect(works("total-warfare", { hostileEcmCount: 1, friendlyEccmCount: 1 })).toBe(false);
        expect(works("total-warfare", { hostileEcmCount: 1 })).toBe(true);
        expect(works("total-warfare", {})).toBe(false);
    });
    it("under tw one angel eccm beats any ordinary ecm and angel ecm is beaten only by angel eccm", () => {
        expect(works("total-warfare", { hostileEcmCount: 4, friendlyAngelEccm: true })).toBe(false);
        expect(works("total-warfare", { hostileAngelEcm: true, friendlyEccmCount: 5 })).toBe(true);
        expect(works("total-warfare", { hostileAngelEcm: true, friendlyAngelEccm: true })).toBe(false);
    });
    it("no eccm in btc so one hostile ecm always works", () => {
        expect(works("battletech-compendium", { hostileEcmCount: 1, friendlyEccmCount: 3 })).toBe(true);
    });
    it("the older hostile ecm tick still works and a friendly eccm tick cancels it", () => {
        expect(works("total-warfare", { hostileEcm: true })).toBe(true);
        expect(works("total-warfare", { hostileEcm: true, friendlyEccm: true })).toBe(false);
    });
    it("buildEWarAttack derives the ecm on the line from the counts", () => {
        const weapon = { uuid: "w1", tag: "lrm-15" };
        expect(buildEWarAttack(weapon, undefined, { hostileEcmCount: 1 }, "total-warfare").hostileEcmOnLine).toBe(true);
        const cancelled = buildEWarAttack(weapon, undefined, { hostileEcmCount: 1, friendlyEccmCount: 1 }, "total-warfare");
        expect(cancelled.hostileEcmOnLine && !cancelled.friendlyEccmOnLine).toBe(false);
        expect(buildEWarAttack(weapon, undefined, { hostileEcm: true }).hostileEcmOnLine).toBe(true);
    });
    it("stealth armor on switches the own ecm off under bmm but not under bmr(r)", () => {
        const gear = [{ kind: "ecm-guardian" as EWarKind, uuid: "e1" }, { kind: "stealth-armor" as EWarKind, uuid: "s1" }];
        const state = { stealthOn: { s1: true } };
        expect(getEWarEcmMode(carrier("battlemech-manual", gear, state), getGear(carrier("battlemech-manual", gear, state), "e1"))).toBe("off");
        expect(getEWarEcmMode(carrier("master-rules-revised", gear, state), getGear(carrier("master-rules-revised", gear, state), "e1"))).toBe("ecm");
        expect(getEWarEcmMode(carrier("battlemech-manual", gear), getGear(carrier("battlemech-manual", gear), "e1"))).toBe("ecm");
    });
    it("eccm mode is unavailable under bmm and crb and a ghost mode needs the tw rule", () => {
        const gear = [{ kind: "ecm-guardian" as EWarKind, uuid: "e1" }];
        const mode = (edition: string, wanted: "eccm" | "ghost") => {
            const unit = carrier(edition, gear, { ecmMode: { e1: wanted } });
            return getEWarEcmMode(unit, getGear(unit, "e1"));
        };
        expect(mode("total-warfare", "eccm")).toBe("eccm");
        // Dropped by BMM and CRB, so the ECCM mode stays available there as apocryphal (carried from Total Warfare).
        expect(mode("battlemech-manual", "eccm")).toBe("eccm");
        expect(mode("core-rulebook", "eccm")).toBe("eccm");
        expect(mode("total-warfare", "ghost")).toBe("ghost");
        expect(mode("master-rules", "ghost")).toBe("ecm");
    });
    it("a destroyed suite or one switched off gives off, and an edition without ecm rules gives off", () => {
        const dead = carrier("total-warfare", [{ kind: "ecm-guardian", uuid: "e1", destroyed: true }]);
        expect(getEWarEcmMode(dead, getGear(dead, "e1"))).toBe("off");
        const off = carrier("total-warfare", [{ kind: "ecm-guardian", uuid: "e1" }], { ecmOn: { e1: false } });
        expect(getEWarEcmMode(off, getGear(off, "e1"))).toBe("off");
        const bt3 = carrier("battletech-3rd-edition", [{ kind: "ecm-guardian", uuid: "e1" }]);
        expect(getEWarEcmMode(bt3, getGear(bt3, "e1"))).toBe("off");
    });
    it("ghost targets give +1 each to a stack of 3, and none when a probe is present or the roll failed", () => {
        const three = carrier("total-warfare", ["a", "b", "c", "d"].map(uuid => ({ kind: "ecm-guardian" as EWarKind, uuid })), { ecmMode: { a: "ghost", b: "ghost", c: "ghost", d: "ghost" } });
        expect(getEWarGhostTargets(three, true)).toEqual([{ modifier: 3, label: "Ghost targets (+3)" }]);
        const one = carrier("total-warfare", [{ kind: "ecm-guardian", uuid: "a" }], { ecmMode: { a: "ghost" } });
        expect(getEWarGhostTargets(one, true)).toEqual([{ modifier: 1, label: "Ghost targets (+1)" }]);
        expect(getEWarGhostTargets(one, false)).toEqual([]);
        expect(getEWarGhostTargets(one, true, true)).toEqual([]);
        expect(getEWarGhostTargets(carrier("master-rules", [{ kind: "ecm-guardian", uuid: "a" }], { ecmMode: { a: "ghost" } }), true)).toEqual([]);
    });
    it("streak lock is blocked by hostile angel ecm under to:aue and mt but not before", () => {
        const attack = { launcher: { family: "streak" as const, size: 2 }, hostileAngelEcm: true };
        expect(getEWarStreakLock(carrier("total-warfare"), attack)).toMatchObject({ blocked: true });
        expect(getEWarStreakLock(carrier("master-rules"), attack)).toMatchObject({ blocked: true });
        expect(getEWarStreakLock(carrier("battletech-compendium"), attack)).toMatchObject({ blocked: false });
        expect(getEWarStreakLock(carrier("total-warfare"), { ...attack, hostileAngelEcm: false })).toMatchObject({ blocked: false });
        expect(getEWarStreakLock(carrier("total-warfare"), { launcher: { family: "lrm", size: 15 }, hostileAngelEcm: true })).toMatchObject({ blocked: false });
    });
    it("lists what hostile ecm cancels per edition, and nothing under bt3", () => {
        const withEcm = { hostileEcmOnLine: true };
        expect(getEWarEcmEffects(carrier("battletech-compendium"), withEcm)[0].label).toContain("artemis, narc, c3, beagle");
        expect(getEWarEcmEffects(carrier("total-warfare"), withEcm)[0].label).toContain("c3i");
        expect(getEWarEcmEffects(carrier("battletech-3rd-edition"), withEcm)).toEqual([]);
        expect(getEWarEcmEffects(carrier("total-warfare"), {})).toEqual([]);
    });
});

describe("E-War Phase 2: probes and detection", () => {
    const carrier = (edition: string, kinds: { kind: EWarKind; destroyed?: boolean }[]): IEWarCarrier => ({
        getUUID: () => "u", getRulesEdition: () => edition, ewarPlay: {},
        getEWarGear: () => kinds.map((g, i) => ({ kind: g.kind, tag: g.kind, name: g.kind, uuid: `p${i}`, destroyed: !!g.destroyed })),
    });
    const probe = (edition: string, kind: EWarKind, target: Parameters<typeof getEWarProbe>[1] = {}) =>
        getEWarProbe(carrier(edition, [{ kind }]), target)[0];

    it("beagle range 4 under tw, clan 5, light 3, bloodhound 8", () => {
        expect([probe("total-warfare", "probe-beagle").range, probe("total-warfare", "probe-clan").range,
            probe("total-warfare", "probe-light").range, probe("total-warfare", "probe-bloodhound").range]).toEqual([4, 5, 3, 8]);
    });
    it("beagle cannot find null-sig, bloodhound can", () => {
        expect(probe("total-warfare", "probe-beagle", { stealth: ["null-sig"] })).toMatchObject({ detects: false });
        expect(probe("total-warfare", "probe-bloodhound", { stealth: ["null-sig"] })).toMatchObject({ detects: true });
        expect(probe("total-warfare", "probe-beagle", { stealth: ["stealth-armor"] }).reason).toMatch(/cannot find Stealth armor/);
        expect(probe("total-warfare", "probe-beagle", { stealth: ["chameleon"] })).toMatchObject({ detects: true });
    });
    it("hostile ecm blocks a beagle but not a bloodhound, and angel blocks the bloodhound", () => {
        expect(probe("battlemech-manual", "probe-beagle", { hostileEcm: true })).toMatchObject({ detects: false });
        expect(probe("battlemech-manual", "probe-bloodhound", { hostileEcm: true })).toMatchObject({ detects: true });
        expect(probe("battlemech-manual", "probe-bloodhound", { hostileEcm: true, hostileAngelEcm: true })).toMatchObject({ detects: false });
        expect(probe("battlemech-manual", "probe-beagle", { hostileAngelEcm: true })).toMatchObject({ detects: false });
    });
    it("conventional infantry is not found under btc and bmr, and ecm sneak suits only by a bloodhound", () => {
        expect(probe("battletech-compendium", "probe-beagle", { infantry: "conventional" })).toMatchObject({ detects: false });
        expect(probe("master-rules", "probe-beagle", { infantry: "conventional" })).toMatchObject({ detects: false });
        expect(probe("total-warfare", "probe-beagle", { infantry: "conventional" })).toMatchObject({ detects: true });
        expect(probe("total-warfare", "probe-beagle", { infantry: "ecm-sneak" })).toMatchObject({ detects: false });
        expect(probe("total-warfare", "probe-bloodhound", { infantry: "ecm-sneak" })).toMatchObject({ detects: true });
    });
    it("a target hidden underwater is not found by an above-water probe", () => {
        expect(probe("total-warfare", "probe-beagle", { underwater: true })).toMatchObject({ detects: false });
    });
    it("a destroyed probe returns no rows", () => {
        expect(getEWarProbe(carrier("total-warfare", [{ kind: "probe-beagle", destroyed: true }]), {})).toEqual([]);
        expect(getEWarProbe(carrier("battletech-3rd-edition", [{ kind: "probe-beagle" }]), {})).toEqual([]);
    });
    it("watchdog works as a light probe", () => {
        expect(probe("total-warfare", "ecm-watchdog")).toMatchObject({ kind: "ecm-watchdog", range: 3, detects: true });
    });
    it("probe notes list range and book for a working probe only", () => {
        const notes = getEWarNotes(carrier("total-warfare", [{ kind: "probe-bloodhound" }, { kind: "probe-clan", destroyed: true }]));
        expect(notes.filter(note => note.includes("probe"))).toHaveLength(1);
        expect(notes.find(note => note.startsWith("Bloodhound probe"))).toContain("8 hexes");
    });
});

describe("E-War Phase 2: own gear switches", () => {
    const carrier = (edition: string, gear: { kind: EWarKind; uuid?: string }[], ewarPlay: object = {}): IEWarCarrier => ({
        getUUID: () => "u", getRulesEdition: () => edition, ewarPlay,
        getEWarGear: () => gear.map(g => ({ kind: g.kind, tag: g.kind, name: g.kind, uuid: g.uuid, destroyed: false })),
    });
    it("offers ecm, eccm, ghost and off only as the edition prints them", () => {
        const gear = [{ kind: "ecm-guardian" as EWarKind, uuid: "e1" }];
        const options = (edition: string) => { const unit = carrier(edition, gear); return getEWarModeOptions(unit, getGear(unit, "e1")); };
        expect(options("total-warfare")).toEqual(["ecm", "eccm", "ghost", "off"]);
        expect(options("master-rules")).toEqual(["ecm", "eccm", "off"]);
        // The BattleMech Manual dropped ECCM and ghost targets: they stay as apocryphal, by the Total Warfare rule.
        expect(options("battlemech-manual")).toEqual(["ecm", "eccm", "ghost", "off"]);
    });
    it("sets the ecm mode and off, and the stealth switch, on the play state", () => {
        const unit = carrier("total-warfare", [{ kind: "ecm-guardian", uuid: "e1" }, { kind: "null-sig" }]);
        setEWarEcmMode(unit, getGear(unit, "e1"), "eccm");
        expect(getEWarEcmMode(unit, getGear(unit, "e1"))).toBe("eccm");
        setEWarEcmMode(unit, getGear(unit, "e1"), "off");
        expect(getEWarEcmMode(unit, getGear(unit, "e1"))).toBe("off");
        setEWarEcmMode(unit, getGear(unit, "e1"), "ecm");
        expect(getEWarEcmMode(unit, getGear(unit, "e1"))).toBe("ecm");
        const sig = unit.getEWarGear()[1];
        setEWarStealth(unit, sig, true);
        expect(isEWarStealthOn(unit, sig)).toBe(true);
        setEWarStealth(unit, sig, false);
        expect(isEWarStealthOn(unit, sig)).toBe(false);
    });
    it("turning one system off clears a legacy any-system switch for the others", () => {
        const unit = carrier("total-warfare", [{ kind: "null-sig" }, { kind: "chameleon" }], { stealthOn: { "*": true } });
        const [sig, cham] = unit.getEWarGear();
        setEWarStealth(unit, sig, false);
        expect(isEWarStealthOn(unit, sig)).toBe(false);
        expect(isEWarStealthOn(unit, cham)).toBe(true);
    });
});

describe("E-War Phase 2: review fixes", () => {
    const carrier = (edition: string, gear: { kind: EWarKind; uuid?: string; destroyed?: boolean }[] = [], ewarPlay: object = {}): IEWarCarrier => ({
        getUUID: () => "u", getRulesEdition: () => edition, ewarPlay,
        getEWarGear: () => gear.map(g => ({ kind: g.kind, tag: g.kind, name: g.kind, uuid: g.uuid, destroyed: !!g.destroyed })),
    });
    const against = (stealth: { kind: EWarKind; moved?: number }[], rangeBand: "short" | "medium" | "long" | "extreme") => ({ target: { stealth }, rangeBand });
    const total = (mods: { modifier: number }[]) => mods.reduce((sum, m) => sum + m.modifier, 0);

    it("C1: bmr(r) stealth armor and mt null-sig add only the part above the standard range modifier (+3 replaces +2, +6 replaces +4, +10 replaces +8)", () => {
        for (const [edition, kind] of [["master-rules-revised", "stealth-armor"], ["master-rules", "null-sig"]] as const) {
            expect([total(getEWarToHit(carrier(edition), against([{ kind }], "medium"))), total(getEWarToHit(carrier(edition), against([{ kind }], "long"))),
                total(getEWarToHit(carrier(edition), against([{ kind }], "extreme")))]).toEqual([1, 2, 2]);
        }
    });
    it("I6: tw stealth armor counts extreme range as long range", () => {
        expect(total(getEWarToHit(carrier("total-warfare"), against([{ kind: "stealth-armor" }], "extreme")))).toBe(2);
        expect(total(getEWarToHit(carrier("total-warfare"), against([{ kind: "stealth-vehicular" }], "extreme")))).toBe(2);
    });
    it("I1: under mt an angel counts as two suites on each side; under tw angel eccm counters any ecm", () => {
        expect(getEWarEcmEffective({ hostileAngelEcm: true, friendlyEccmCount: 2 }, "master-rules").ecmWorks).toBe(false);
        expect(getEWarEcmEffective({ hostileEcmCount: 3, friendlyAngelEccm: true }, "master-rules").ecmWorks).toBe(true);
        expect(getEWarEcmEffective({ hostileEcmCount: 3, friendlyAngelEccm: true }, "total-warfare").ecmWorks).toBe(false);
    });
    it("I2: friendly angel eccm restores a streak lock under tw", () => {
        const weapon = { uuid: "w1", tag: "streak-srm-2" };
        const blocked = buildEWarAttack(weapon, undefined, { hostileAngelEcm: true }, "total-warfare");
        expect(getEWarStreakLock(carrier("total-warfare"), blocked).blocked).toBe(true);
        const freed = buildEWarAttack(weapon, undefined, { hostileAngelEcm: true, friendlyAngelEccm: true }, "total-warfare");
        expect(getEWarStreakLock(carrier("total-warfare"), freed).blocked).toBe(false);
    });
    it("I3: friendly eccm that matches the ecm frees a tw narc pod again", () => {
        const weapon = { uuid: "w1", tag: "lrm-15" };
        const ticks = { narcPods: ["narc"], targetHostileEcm: true };
        expect(buildEWarAttack(weapon, { tag: "ammo-lrm-narc" }, ticks, "total-warfare").targetInHostileEcm).toBe(true);
        expect(buildEWarAttack(weapon, { tag: "ammo-lrm-narc" }, { ...ticks, friendlyEccmCount: 1 }, "total-warfare").targetInHostileEcm).toBe(false);
    });
    it("I4: excluded stealth systems are refused whichever is listed first", () => {
        const refused = (order: EWarKind[]) => getEWarToHit(carrier("total-warfare"), against(order.map(kind => ({ kind })), "medium")).filter(m => /not with/.test(m.label)).length;
        expect(refused(["chameleon", "stealth-armor"])).toBe(1);
        expect(refused(["stealth-armor", "chameleon"])).toBe(1);
        expect(refused(["null-sig", "void-sig"])).toBe(1);
        expect(refused(["null-sig", "stealth-armor"])).toBe(1);
        expect(total(getEWarToHit(carrier("total-warfare"), against([{ kind: "null-sig" }, { kind: "chameleon" }], "medium")))).toBe(2);
    });
    it("I5: under the crb an active null-sig switches the own ecm off, the chameleon does not", () => {
        const gear = [{ kind: "ecm-guardian" as EWarKind, uuid: "e1" }, { kind: "null-sig" as EWarKind }, { kind: "chameleon" as EWarKind }];
        const unit = (on: object) => carrier("core-rulebook", gear, { stealthOn: on });
        const mode = (u: IEWarCarrier) => getEWarEcmMode(u, u.getEWarGear()[0]);
        expect(mode(unit({ "null-sig": true }))).toBe("off");
        expect(mode(unit({ chameleon: true }))).toBe("ecm");
    });
    it("I7: a bloodhound finds unarmored infantry but not ecm-suited infantry under bmr", () => {
        const hound = (infantry: "conventional" | "ecm-sneak") => getEWarProbe(carrier("master-rules", [{ kind: "probe-bloodhound" }]), { infantry })[0];
        expect(hound("conventional").detects).toBe(true);
        expect(hound("ecm-sneak").detects).toBe(false);
    });
    it("I8: bmr(r) mimetic replaces the standard movement modifier", () => {
        const at = (moved: number) => total(getEWarToHit(carrier("master-rules-revised"), against([{ kind: "mimetic", moved }], "medium")));
        expect([at(0), at(1), at(2), at(3)]).toEqual([3, 1, 0, -2]);
        const tw = (moved: number) => total(getEWarToHit(carrier("total-warfare"), against([{ kind: "mimetic", moved }], "medium")));
        expect([tw(0), tw(3)]).toEqual([3, 0]);
    });
    it("I9: stealth armor and void-sig cannot work once every ecm suite is destroyed", () => {
        const gear = (ecmDead: boolean) => [{ kind: "void-sig" as EWarKind, uuid: "v1" }, { kind: "ecm-guardian" as EWarKind, uuid: "e1", destroyed: ecmDead }];
        expect(getEWarOwnAttackToHit(carrier("total-warfare", gear(false), { stealthOn: { v1: true } }), {})).toHaveLength(1);
        expect(getEWarOwnAttackToHit(carrier("total-warfare", gear(true), { stealthOn: { v1: true } }), {})).toEqual([]);
        expect(getEWarStealthNotes(carrier("total-warfare", gear(true)))[0]).toContain("cannot work without an ECM suite");
    });
    it("I10: own void-sig stops every probe and own stealth armor stops the bloodhound", () => {
        const probes = (stealth: EWarKind, on: object) => getEWarProbe(carrier("total-warfare", [{ kind: stealth, uuid: "s1" }, { kind: "ecm-guardian", uuid: "e1" }, { kind: "probe-beagle" }, { kind: "probe-bloodhound" }], { stealthOn: on }), {});
        expect(probes("void-sig", { s1: true }).map(p => p.detects)).toEqual([false, false]);
        expect(probes("stealth-armor", { s1: true }).map(p => p.detects)).toEqual([true, false]);
        expect(probes("void-sig", {}).map(p => p.detects)).toEqual([true, true]);
    });
    it("I11: stealth armor with an angel in ghost mode keeps the angel running and gives +1 to own attacks", () => {
        const gear = [{ kind: "stealth-armor" as EWarKind, uuid: "s1" }, { kind: "ecm-angel" as EWarKind, uuid: "a1" }, { kind: "ecm-guardian" as EWarKind, uuid: "e1" }];
        const unit = carrier("total-warfare", gear, { stealthOn: { s1: true }, ecmMode: { a1: "ghost", e1: "ghost" } });
        expect(getEWarEcmMode(unit, getGear(unit, "a1"))).toBe("ghost");
        expect(getEWarEcmMode(unit, getGear(unit, "e1"))).toBe("off");
        expect(getEWarOwnAttackToHit(unit, {})).toEqual([{ modifier: 1, label: "Ghost targets with stealth armor (+1 to own attacks)" }]);
        expect(getEWarNotes(unit).some(note => note.startsWith("Ghost targets"))).toBe(true);
    });
    it("I12: bmr(r) ecm cancels c3i", () => {
        expect(getEWarEcmEffects(carrier("master-rules-revised"), { hostileEcmOnLine: true })[0].label).toContain("c3i");
    });
});

describe("E-War Phase 2 minors: BA stealth variants, sneak suits, Nova probe", () => {
    const carrier = (edition: string, gear: { kind: EWarKind; destroyed?: boolean }[] = []): IEWarCarrier => ({
        getUUID: () => "u", getRulesEdition: () => edition, ewarPlay: {},
        getEWarGear: () => gear.map((g, i) => ({ kind: g.kind, tag: g.kind, name: g.kind, uuid: `g${i}`, destroyed: !!g.destroyed })),
    });
    const hit = (edition: string, kind: EWarKind, band: "short" | "medium" | "long", extra: { moved?: number; attackerInfantry?: boolean } = {}) => {
        const mods = getEWarToHit(carrier(edition), { target: { stealth: [{ kind, moved: extra.moved }] }, rangeBand: band, attackerInfantry: extra.attackerInfantry });
        return mods.reduce((sum, m) => sum + m.modifier, 0);
    };

    it("battle armor stealth variants under tw: basic +1/+2, standard +1/+1/+2, improved +1/+2/+3", () => {
        expect(["short", "medium", "long"].map(b => hit("total-warfare", "stealth-ba", b as "short"))).toEqual([0, 1, 2]);
        expect(["short", "medium", "long"].map(b => hit("total-warfare", "stealth-ba-standard", b as "short"))).toEqual([1, 1, 2]);
        expect(["short", "medium", "long"].map(b => hit("total-warfare", "stealth-ba-improved", b as "short"))).toEqual([1, 2, 3]);
    });
    it("achileus and infiltrator suits add the part above the standard modifier under bmr and bmr(r)", () => {
        expect(["short", "medium", "long"].map(b => hit("master-rules", "stealth-ba-achileus", b as "short"))).toEqual([1, 2, 3]);
        expect(["short", "medium", "long"].map(b => hit("master-rules", "stealth-ba-infiltrator", b as "short"))).toEqual([0, 1, 2]);
        expect(["short", "medium", "long"].map(b => hit("master-rules-revised", "stealth-ba-infiltrator-mk2", b as "short"))).toEqual([1, 1, 2]);
        // Dropped after BMR(R): it stays available in the later books as apocryphal and plays by the last printing (carry-forward along the edition chain).
        expect(hit("battlemech-manual", "stealth-ba-achileus", "medium")).toBe(2);
    });
    it("sneak suits under tw: camo by movement, IR by range for non-infantry only, DEST both", () => {
        expect([0, 1, 2, 3, 9].map(moved => hit("total-warfare", "sneak-camo", "medium", { moved }))).toEqual([3, 2, 1, 0, 0]);
        expect(["short", "medium", "long"].map(b => hit("total-warfare", "sneak-ir", b as "short"))).toEqual([1, 1, 2]);
        expect(hit("total-warfare", "sneak-ir", "long", { attackerInfantry: true })).toBe(0);
        expect(hit("total-warfare", "dest-suit", "long", { moved: 0 })).toBe(3);
        expect(hit("total-warfare", "dest-suit", "long", { moved: 2, attackerInfantry: true })).toBe(0);
        expect(hit("total-warfare", "dest-suit", "short", { moved: 0, attackerInfantry: true })).toBe(1);
        expect(hit("battletech-3rd-edition", "sneak-camo", "medium", { moved: 0 })).toBe(0);
        // The BattleMech Manual no longer prints sneak suits: they stay available there as apocryphal, by the TO:AUE table.
        expect(hit("battlemech-manual", "sneak-camo", "medium", { moved: 0 })).toBe(3);
    });
    it("a camo or IR sneak suit is found by every probe, only the ecm suit hides from the standard ones", () => {
        const probe = (kind: EWarKind, infantry: "camo-sneak" | "ecm-sneak") => getEWarProbe(carrier("total-warfare", [{ kind }]), { infantry })[0].detects;
        expect(probe("probe-beagle", "camo-sneak")).toBe(true);
        expect(probe("probe-light", "camo-sneak")).toBe(true);
        expect(probe("probe-beagle", "ecm-sneak")).toBe(false);
        expect(probe("probe-bloodhound", "ecm-sneak")).toBe(true);
    });
    it("the nova cews is a probe whose range the book does not print", () => {
        const rows = getEWarProbe(carrier("total-warfare", [{ kind: "ecm-nova" }]), {});
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({ kind: "ecm-nova", range: undefined, detects: true });
        expect(rows[0].reason).toContain("prints no range");
        expect(getEWarNotes(carrier("total-warfare", [{ kind: "ecm-nova" }])).some(n => n.startsWith("Nova CEWS probe: range not printed"))).toBe(true);
        expect(getEWarProbe(carrier("total-warfare", [{ kind: "ecm-nova", destroyed: true }]), {})).toEqual([]);
    });
});

describe("E-War Phase 2 minors: the board puts the attacker inside hostile ECM", () => {
    const unit = (inHostileEcm: boolean) => ({
        getUUID: () => "u1", getRulesEdition: () => "total-warfare", ewarPlay: { inHostileEcm },
        getEWarGear: () => [{ kind: "artemis-iv" as const, tag: "lrm-15-artemis-iv", name: "LRM 15 + Artemis IV", uuid: "w1", destroyed: false }],
        equipmentList: [{ uuid: "w1", tag: "lrm-15-artemis-iv", selectedAmmoBinUUID: "b1" }, { uuid: "b1", tag: "ammo-is-lrm-artemis-iv" }],
    });
    it("an attacker the board marks inside hostile ECM loses its Artemis shift, and one friendly ECCM frees it", () => {
        expect(getEWarWeaponClusterShifts(unit(true), 0, {}).map(shift => shift.label)).toEqual(["Artemis IV: hostile ECM"]);
        expect(getEWarWeaponClusterShifts(unit(false), 0, {}).map(shift => shift.label)).toEqual(["Artemis IV (+2)"]);
        expect(getEWarWeaponClusterShifts(unit(true), 0, { friendlyEccmCount: 1 }).map(shift => shift.label)).toEqual(["Artemis IV (+2)"]);
    });
    it("the ticked hostile count and the board are one bubble, not two", () => {
        expect(withAttackerEcm(unit(true), { hostileEcmCount: 1 }).hostileEcmCount).toBe(1);
        expect(withAttackerEcm(unit(true), { hostileEcmCount: 3 }).hostileEcmCount).toBe(3);
        expect(withAttackerEcm(unit(false), {}).hostileEcmCount).toBeUndefined();
    });
});

describe("E-War Phase 1 minors: the base MRM modifiers and Apollo", () => {
    const carrier = (edition: string, gear: { kind: EWarKind; uuid: string }[] = []): IEWarCarrier => ({
        getUUID: () => "u", getRulesEdition: () => edition, ewarPlay: {},
        getEWarGear: () => gear.map(g => ({ kind: g.kind, tag: g.kind, name: g.kind, uuid: g.uuid, destroyed: false })),
    });
    const mrm = { weaponUuid: "w1", launcher: { family: "mrm" as const, size: 20 } };
    const apollo = [{ kind: "apollo" as EWarKind, uuid: "w1" }];

    it("tw and bmm: Apollo takes 1 off the Cluster Hits roll (its catalog record already drops the +1 to-hit); a plain MRM gets nothing from E-War", () => {
        for (const edition of ["total-warfare", "battlemech-manual"]) {
            expect(getEWarToHit(carrier(edition, apollo), mrm), edition).toEqual([]);
            expect(getEWarClusterShift(carrier(edition, apollo), mrm), edition).toEqual([{ modifier: -1, label: "Apollo (-1)" }]);
            expect(getEWarToHit(carrier(edition), mrm), edition).toEqual([]);
            expect(getEWarClusterShift(carrier(edition), mrm), edition).toEqual([]);
        }
    });
    it("crb: a plain MRM has no to-hit penalty and a -1 Cluster Hits modifier, and Apollo removes that -1", () => {
        expect(getEWarToHit(carrier("core-rulebook"), mrm)).toEqual([{ modifier: -1, label: "MRM: no +1 to-hit in the Core Rulebook" }]);
        expect(getEWarClusterShift(carrier("core-rulebook"), mrm)).toEqual([{ modifier: -1, label: "MRM (-1)" }]);
        expect(getEWarClusterShift(carrier("core-rulebook", apollo), mrm)).toEqual([{ modifier: -1, label: "MRM (-1)" }, { modifier: 1, label: "Apollo (+1, removes the MRM -1)" }]);
        expect(getEWarToHit(carrier("core-rulebook", apollo), mrm)).toEqual([]);
    });
    it("a non-MRM launcher gets no MRM modifier under the crb", () => {
        expect(getEWarClusterShift(carrier("core-rulebook"), { weaponUuid: "w1", launcher: { family: "lrm", size: 20 } })).toEqual([]);
        expect(getEWarToHit(carrier("core-rulebook"), { weaponUuid: "w1", launcher: { family: "lrm", size: 20 } })).toEqual([]);
    });
});

describe("E-War Phase 1 minors: missiles an AMS cannot engage, and a single missile", () => {
    const defender = (edition: string): IEWarCarrier => ({
        getUUID: () => "u", getRulesEdition: () => edition, ewarPlay: {},
        getEWarGear: () => [{ kind: "ams" as const, tag: "is-ams", name: "AMS", uuid: "a1", destroyed: false }],
    });
    const hits = (roll: number, size: number) => (roll >= 8 ? size : 1);

    it("btc and rules of warfare: no AMS against thunder or swarm LRMs, but standard missiles and Streaks are fine", () => {
        for (const edition of ["battletech-compendium", "compendium-rules-of-warfare"]) {
            expect(getEWarDefense(defender(edition), { missileAttack: true, launcherSize: 15, munition: "swarm" }), edition).toMatchObject({ applies: false });
            expect(getEWarDefense(defender(edition), { missileAttack: true, launcherSize: 15, munition: "thunder" }).labels[0]).toContain("cannot engage");
            expect(getEWarDefense(defender(edition), { missileAttack: true, launcherSize: 15, munition: "arrow-iv" }), edition).toMatchObject({ applies: true });
            expect(getEWarDefense(defender(edition), { missileAttack: true, launcherSize: 15 }), edition).toMatchObject({ applies: true });
        }
    });
    it("bmr and bmr(r): no AMS against arrow iv, thunder, flare or swarm missiles", () => {
        for (const edition of ["master-rules", "master-rules-revised"]) {
            for (const munition of ["arrow-iv", "thunder", "flare", "swarm"]) {
                expect(getEWarDefense(defender(edition), { missileAttack: true, launcherSize: 10, munition }), `${edition} ${munition}`).toMatchObject({ applies: false });
            }
        }
    });
    it("tw, bmm and crb: an arrow iv missile is unaffected by AMS, thunder and swarm munitions are not", () => {
        for (const edition of ["total-warfare", "battlemech-manual", "core-rulebook"]) {
            expect(getEWarDefense(defender(edition), { missileAttack: true, launcherSize: 1, munition: "arrow-iv" }), edition).toMatchObject({ applies: false });
            expect(getEWarDefense(defender(edition), { missileAttack: true, launcherSize: 15, munition: "swarm" }), edition).toMatchObject({ applies: true });
        }
    });
    it("a single missile under tw is destroyed on a 1D6 of 1-3, so the dialog enters it as destroyed or not", () => {
        const defense = getEWarDefense(defender("total-warfare"), { missileAttack: true, launcherSize: 1 });
        expect(defense.singleMissile).toBe(true);
        expect(defense.labels.join(" ")).toContain("1D6");
        expect(getEWarMissileHits(defense, 1, 9, 1, hits)).toBe(0);
        expect(getEWarMissileHits(defense, 1, 9, 0, hits)).toBe(1);
        expect(getEWarDefense(defender("total-warfare"), { missileAttack: true, launcherSize: 10 }).singleMissile).toBeFalsy();
        expect(getEWarDefense(defender("battletech-compendium"), { missileAttack: true, launcherSize: 1 }).singleMissile).toBeFalsy();
    });
});

describe("E-War Phase 1 minors: missile damage groupings", () => {
    it("divides the hit into whole-missile groupings of at most the group damage", () => {
        expect(getMissileDamageGroups(12, 1, 5)).toEqual([5, 5, 2]);
        expect(getMissileDamageGroups(7, 1, 5)).toEqual([5, 2]);
        expect(getMissileDamageGroups(4, 2, 2)).toEqual([2, 2, 2, 2]);
        expect(getMissileDamageGroups(3, 2, 5)).toEqual([4, 2]);
        expect(getMissileDamageGroups(0, 1, 5)).toEqual([]);
        expect(getMissileDamageGroups(5, 1, 5)).toEqual([5]);
    });
});

describe("E-War Phase 1 minors: Clan anti-missile gear and Artemis with no ammunition bin", () => {
    it("every catalog AMS, Laser AMS and APDS item is classed Clan by its tag exactly when its tech base is Clan", () => {
        const items = getEquipmentCatalogDefinitions().flatMap(definition => definition.equipment)
            .filter(item => ["ams", "laser-ams", "apds"].includes(getEWarKind(item.tag) ?? ""));
        expect(items.length).toBeGreaterThan(3);
        for (const item of items) {
            expect(isClanEWarTag(item.tag), `${item.tag} (${item.techBase})`).toBe(item.techBase === "clan");
        }
    });
    it("a launcher with Artemis and no ammunition bin chosen is assumed loaded with Artemis ammunition, and says so", () => {
        const unit = {
            getUUID: () => "u1", getRulesEdition: () => "total-warfare", ewarPlay: {},
            getEWarGear: () => [{ kind: "artemis-iv" as const, tag: "lrm-15-artemis-iv", name: "LRM 15 + Artemis IV", uuid: "w1", destroyed: false }],
            equipmentList: [{ uuid: "w1", tag: "lrm-15-artemis-iv" }],
        };
        expect(getEWarWeaponClusterShifts(unit, 0, {}).map(shift => shift.label)).toEqual(["Artemis IV (+2)", "Artemis IV: no ammunition bin chosen, assumed Artemis ammunition"]);
        const loaded = { ...unit, equipmentList: [{ uuid: "w1", tag: "lrm-15-artemis-iv", selectedAmmoBinUUID: "b1" }, { uuid: "b1", tag: "ammo-is-lrm-artemis-iv" }] };
        expect(getEWarWeaponClusterShifts(loaded, 0, {}).map(shift => shift.label)).toEqual(["Artemis IV (+2)"]);
    });
});

// ---- E-War Phase 3, Task 2: C3 network records ----
function c3Carrier(uuid: string, kinds: EWarKind[], extra: { tonnage?: number; squad?: number } = {}): IEWarCarrier {
    return {
        getUUID: () => uuid,
        getRulesEdition: () => "total-warfare",
        getEWarGear: () => kinds.map((kind) => ({ kind, tag: kind, name: kind, destroyed: false })),
        ewarPlay: {},
        getTonnage: extra.tonnage === undefined ? undefined : () => extra.tonnage as number,
        getSquadSize: extra.squad === undefined ? undefined : () => extra.squad as number,
    };
}

describe("C3 network records", () => {
    const slaves = (count: number, kind: EWarKind = "c3-slave") => Array.from({ length: count }, (_, index) => c3Carrier(`s${index}`, [kind]));
    const record = (type: IC3Network["type"], units: IEWarCarrier[], roles?: C3Role[]): IC3Network => ({
        name: "A", type, members: units.map((unit, index) => ({ uuid: unit.getUUID(), role: roles?.[index] ?? inferC3Role(unit, type) })),
    });

    it("accepts a Master with three Slaves and refuses thirteen units under Total Warfare", () => {
        const master = c3Carrier("m", ["c3-master"]);
        const ok = [master, ...slaves(3)];
        expect(validateC3Network(record("master-slave", ok), ok, "total-warfare")).toEqual([]);
        const many = [master, ...slaves(12)];
        expect(validateC3Network(record("master-slave", many), many, "total-warfare").join(" ")).toContain("at most 12");
    });

    it("refuses seven C3i units and four Slaves on one Master before Total Warfare", () => {
        const six = slaves(7, "c3i");
        expect(validateC3Network(record("c3i", six), six, "master-rules-revised").join(" ")).toContain("at most 6");
        const bmr = [c3Carrier("m", ["c3-master"]), ...slaves(4)];
        expect(validateC3Network(record("master-slave", bmr), bmr, "master-rules").join(" ")).toContain("controls at most 3 Slaves");
    });

    it("refuses C3i mixed with Master/Slave, and a network type the edition does not print", () => {
        const mixed = [c3Carrier("m", ["c3-master"]), c3Carrier("i", ["c3i"])];
        expect(validateC3Network(record("master-slave", mixed), mixed, "total-warfare").join(" ")).toContain("C3i cannot be mixed");
        expect(validateC3Network(record("c3i", mixed), mixed, "total-warfare").join(" ")).toContain("C3i cannot be mixed");
        expect(validateC3Network(record("c3i", slaves(2, "c3i")), slaves(2, "c3i"), "master-rules").join(" ")).toContain("not printed");
    });

    it("refuses a Naval member under 200 tons, a two-trooper squad, and counts Remote Sensor pods", () => {
        const small = [c3Carrier("n1", ["c3-naval"], { tonnage: 100 }), c3Carrier("n2", ["c3-naval"], { tonnage: 300 })];
        expect(validateC3Network(record("naval", small), small, "total-warfare").join(" ")).toContain("200 tons");
        const squad = [c3Carrier("b1", ["c3-slave"], { squad: 2 })];
        expect(validateC3Network(record("master-slave", squad), squad, "total-warfare").join(" ")).toContain("three or more troopers");
        const eleven = slaves(11);
        expect(validateC3Network(record("master-slave", eleven), eleven, "total-warfare", { pods: 1 })).toEqual([]);
        expect(validateC3Network(record("master-slave", eleven), eleven, "total-warfare", { pods: 2 }).join(" ")).toContain("at most 12");
    });

    it("refuses a unit named in two networks and builds the Battle Value map", () => {
        const units = [c3Carrier("m", ["c3-master"]), ...slaves(1)];
        const a = record("master-slave", units);
        const b: IC3Network = { name: "B", type: "master-slave", members: [{ uuid: "s0", role: "slave" }] };
        expect(validateC3Network(a, units, "total-warfare", { others: [b] }).join(" ")).toContain("two C3 networks");
        expect(getC3NetworkMap([a])).toEqual({ m: "A", s0: "A" });
    });
});

// ---- E-War Phase 3, Task 3: C3 cut-off, range sharing and ECM ----
describe("C3 range sharing and cut-off", () => {
    type Spec = { kind: EWarKind; destroyed?: boolean };
    const unit = (uuid: string, edition: string, gear: Spec[], play: IEWarCarrier["ewarPlay"] = {}): IEWarCarrier => ({
        getUUID: () => uuid,
        getRulesEdition: () => edition,
        getEWarGear: () => gear.map((entry) => ({ kind: entry.kind, tag: entry.kind, name: entry.kind, uuid: `${uuid}-${entry.kind}`, destroyed: !!entry.destroyed })),
        ewarPlay: play,
    });
    const net = (type: IC3Network["type"], members: [IEWarCarrier, C3Role][]): IC3Network => ({ name: "A", type, members: members.map(([carrier, role]) => ({ uuid: carrier.getUUID(), role })) });
    /** The to-hit change C3 gives `attacker` when the nearest networked unit is at `nearest` and the attacker at `own`. */
    const c3Hit = (attacker: IEWarCarrier, network: IC3Network, all: IEWarCarrier[], nearest: "short" | "medium" | "long", own: "short" | "medium" | "long",
        opts: { angel?: boolean; indirect?: boolean } = {}) => {
        const status = getC3Status(attacker, network, all, { hostileAngelEcm: opts.angel });
        const attack: IEWarAttack = { c3: { nearestRangeBand: nearest, ownRangeBand: own, status }, rangeBand: own, launcher: opts.indirect ? { family: "lrm", size: 10, indirect: true } : undefined };
        return { status, mods: getEWarToHit(attacker, attack).filter((entry) => entry.label.includes("C3")) };
    };

    it("moves the attacker to the nearest networked unit range under Total Warfare, with a label", () => {
        const master = unit("m", "total-warfare", [{ kind: "c3-master" }]);
        const slave = unit("s", "total-warfare", [{ kind: "c3-slave" }]);
        const { status, mods } = c3Hit(slave, net("master-slave", [[master, "master"], [slave, "slave"]]), [master, slave], "short", "long");
        expect(status.linked).toBe(true);
        expect(mods).toEqual([{ modifier: -4, label: expect.stringContaining("C3") }]);
        expect(c3Hit(slave, net("master-slave", [[master, "master"], [slave, "slave"]]), [master, slave], "long", "short").mods).toEqual([]);
    });

    it("cuts a unit off inside hostile ECM unless friendly ECCM covers it", () => {
        const master = unit("m", "total-warfare", [{ kind: "c3-master" }]);
        const jammed = unit("s", "total-warfare", [{ kind: "c3-slave" }], { inHostileEcm: true });
        const network = net("master-slave", [[master, "master"], [jammed, "slave"]]);
        const cut = c3Hit(jammed, network, [master, jammed], "short", "long");
        expect(cut.status.linked).toBe(false);
        expect(cut.status.labels.join(" ")).toContain("hostile ECM");
        expect(cut.mods.map((entry) => entry.modifier)).toEqual([0]);
        const covered = unit("s", "total-warfare", [{ kind: "c3-slave" }], { inHostileEcm: true, inFriendlyEccm: true });
        expect(c3Hit(covered, net("master-slave", [[master, "master"], [covered, "slave"]]), [master, covered], "short", "long").status.linked).toBe(true);
    });

    it("adds a TN penalty for the range gained when the attacker, its Master or the nearest unit is in ECM, under the Core Rulebook (CRB p.199)", () => {
        const master = unit("m", "core-rulebook", [{ kind: "c3-master" }]);
        const slave = unit("s", "core-rulebook", [{ kind: "c3-slave" }], { inHostileEcm: true });
        const network = net("master-slave", [[master, "master"], [slave, "slave"]]);
        // Long to Medium: -2 for the range, +1 for ECM.
        const one = c3Hit(slave, network, [master, slave], "medium", "long");
        expect(one.status).toMatchObject({ linked: true, degrade: 1 });
        expect(one.mods.map((entry) => entry.modifier)).toEqual([-2, 1]);
        // Long to Short: -4, +2 for ECM.
        expect(c3Hit(slave, network, [master, slave], "short", "long").mods.map((entry) => entry.modifier)).toEqual([-4, 2]);
        // The Master in ECM degrades its Slaves.
        const masterJammed = unit("m", "core-rulebook", [{ kind: "c3-master" }], { inHostileEcm: true });
        const clean = unit("s", "core-rulebook", [{ kind: "c3-slave" }]);
        const two = c3Hit(clean, net("master-slave", [[masterJammed, "master"], [clean, "slave"]]), [masterJammed, clean], "short", "long");
        expect(two.status.degrade).toBe(1);
        expect(two.mods.map((entry) => entry.modifier)).toEqual([-4, 2]);
        // The nearest networked unit in ECM, ticked by the player, costs the same; no range gain, no penalty.
        const nearestJammed = getEWarToHit(clean, { c3: { nearestRangeBand: "medium", ownRangeBand: "long", status: { linked: true, degrade: 0, labels: [] }, nearestInEcm: true }, rangeBand: "long" });
        expect(nearestJammed.map((entry) => entry.modifier)).toEqual([-2, 1]);
        expect(c3Hit(slave, network, [master, slave], "long", "long").mods).toEqual([]);
    });

    it("cuts off every Slave of a Master that is inside hostile ECM, before the Core Rulebook, and a Boosted member of a Standard Master", () => {
        for (const edition of ["total-warfare", "battlemech-manual", "master-rules-revised"]) {
            const master = unit("m", edition, [{ kind: "c3-master" }], { inHostileEcm: true });
            const slave = unit("s", edition, [{ kind: "c3-slave" }]);
            const status = getC3Status(slave, net("master-slave", [[master, "master"], [slave, "slave"]]), [master, slave], {});
            expect(status.linked, edition).toBe(false);
            expect(status.labels.join(" "), edition).toContain("Master");
        }
        const standard = unit("m", "battlemech-manual", [{ kind: "c3-master" }], { inHostileEcm: true });
        const boosted = unit("b", "battlemech-manual", [{ kind: "c3-boosted-slave" }]);
        expect(getC3Status(boosted, net("boosted", [[standard, "master"], [boosted, "slave"]]), [standard, boosted], {}).linked).toBe(false);
    });

    it("degrades rather than cuts off Boosted C3 against an Angel suite under the Core Rulebook, cuts it off under the Battlemech Manual", () => {
        const crbMaster = unit("m", "core-rulebook", [{ kind: "c3-boosted-master" }]);
        const crbSlave = unit("s", "core-rulebook", [{ kind: "c3-boosted-slave" }], { inHostileEcm: true, hostileAngelEcm: true });
        expect(getC3Status(crbSlave, net("boosted", [[crbMaster, "master"], [crbSlave, "slave"]]), [crbMaster, crbSlave], {})).toMatchObject({ linked: true, degrade: 1 });
        const bmmMaster = unit("m", "battlemech-manual", [{ kind: "c3-boosted-master" }]);
        const bmmSlave = unit("s", "battlemech-manual", [{ kind: "c3-boosted-slave" }], { inHostileEcm: true, hostileAngelEcm: true });
        expect(getC3Status(bmmSlave, net("boosted", [[bmmMaster, "master"], [bmmSlave, "slave"]]), [bmmMaster, bmmSlave], {}).linked).toBe(false);
    });

    it("ends only the portion of a destroyed Master before the Core Rulebook, the whole network in it, and a Master-less Slave follows the network", () => {
        const masters = (edition: string) => [unit("r", edition, [{ kind: "c3-master", destroyed: true }]), unit("y", edition, [{ kind: "c3-master" }])];
        for (const edition of ["total-warfare", "master-rules"]) {
            const [red, yellow] = masters(edition);
            const redSlave = unit("rs", edition, [{ kind: "c3-slave" }]);
            const yellowSlave = unit("ys", edition, [{ kind: "c3-slave" }]);
            const network: IC3Network = { name: "A", type: "master-slave", members: [
                { uuid: "r", role: "master" }, { uuid: "y", role: "master" }, { uuid: "rs", role: "slave", master: "r" }, { uuid: "ys", role: "slave", master: "y" }] };
            const all = [red, yellow, redSlave, yellowSlave];
            expect(getC3Status(redSlave, network, all, {}).linked, `${edition} red`).toBe(false);
            expect(getC3Status(yellowSlave, network, all, {}).linked, `${edition} yellow`).toBe(true);
        }
        const [red, yellow] = masters("core-rulebook");
        const redSlave = unit("rs", "core-rulebook", [{ kind: "c3-slave" }]);
        const yellowSlave = unit("ys", "core-rulebook", [{ kind: "c3-slave" }]);
        const network: IC3Network = { name: "A", type: "master-slave", members: [
            { uuid: "r", role: "master" }, { uuid: "y", role: "master" }, { uuid: "rs", role: "slave", master: "r" }, { uuid: "ys", role: "slave", master: "y" }] };
        expect(getC3Status(yellowSlave, network, [red, yellow, redSlave, yellowSlave], {}).linked).toBe(true);
        const bothLost = [unit("r", "core-rulebook", [{ kind: "c3-master", destroyed: true }]), unit("y", "core-rulebook", [{ kind: "c3-master", destroyed: true }]), redSlave, yellowSlave];
        expect(getC3Status(yellowSlave, network, bothLost, {}).linked).toBe(false);
    });

    it("lets the Emergency Master take over in the status, holds back a new Nova link, and drops a squad down to two troopers", () => {
        const lost = unit("m", "total-warfare", [{ kind: "c3-master", destroyed: true }]);
        const emergency = unit("e", "total-warfare", [{ kind: "c3-emergency-master" }]);
        const slave = unit("s", "total-warfare", [{ kind: "c3-slave" }]);
        const network: IC3Network = { name: "A", type: "master-slave", members: [{ uuid: "m", role: "master" }, { uuid: "e", role: "emergency" }, { uuid: "s", role: "slave" }] };
        const all = [lost, emergency, slave];
        expect(getC3Status(slave, network, all, { turn: 4 }).linked).toBe(true);
        expect(getC3Status(slave, network, all, {}).linked).toBe(false);
        emergency.ewarPlay.c3EmergencyTurns = 6;
        expect(getC3Status(slave, network, all, { turn: 9 }).linked).toBe(false);
        const novaA = unit("a", "total-warfare", [{ kind: "ecm-nova" }]);
        const novaB = unit("b", "total-warfare", [{ kind: "ecm-nova" }]);
        const link: IC3Network = { name: "N", type: "nova", members: [{ uuid: "a", role: "member" }, { uuid: "b", role: "member", since: 5 }] };
        expect(getC3Status(novaB, link, [novaA, novaB], { turn: 5 }).linked).toBe(false);
        expect(getC3Status(novaB, link, [novaA, novaB], { turn: 6 }).linked).toBe(true);
        const squad = { ...unit("q", "total-warfare", [{ kind: "c3-slave" }]), getSquadSize: () => 4, getActiveTroopers: () => 2 };
        expect(getC3Status(squad, { name: "A", type: "master-slave", members: [{ uuid: "q", role: "slave" }] }, [squad], {}).linked).toBe(false);
    });

    it("knocks the Master out with hostile ECM so an Emergency Master takes over (TO:AUE p.110)", () => {
        const master = unit("m", "total-warfare", [{ kind: "c3-master" }], { inHostileEcm: true });
        const emergency = unit("e", "total-warfare", [{ kind: "c3-emergency-master" }]);
        const network: IC3Network = { name: "A", type: "master-slave", members: [{ uuid: "m", role: "master" }, { uuid: "e", role: "emergency" }] };
        expect(Object.fromEntries(getC3Members(network, [master, emergency], {}, 3).map((member) => [member.uuid, member.role]))).toEqual({ m: "master", e: "master" });
    });

    it("keeps Boosted C3 linked in ECM except against an Angel suite, and C3i cuts off only the unit inside ECM", () => {
        const master = unit("m", "total-warfare", [{ kind: "c3-boosted-master" }]);
        const slave = unit("s", "total-warfare", [{ kind: "c3-boosted-slave" }], { inHostileEcm: true });
        const boosted = net("boosted", [[master, "master"], [slave, "slave"]]);
        expect(c3Hit(slave, boosted, [master, slave], "short", "long").status.linked).toBe(true);
        expect(c3Hit(slave, boosted, [master, slave], "short", "long", { angel: true }).status.linked).toBe(false);
        const a = unit("a", "total-warfare", [{ kind: "c3i" }], { inHostileEcm: true });
        const b = unit("b", "total-warfare", [{ kind: "c3i" }]);
        const improved = net("c3i", [[a, "member"], [b, "member"]]);
        expect(getC3Status(a, improved, [a, b], {}).linked).toBe(false);
        expect(getC3Status(b, improved, [a, b], {}).linked).toBe(true);
    });

    it("stops a network whose Master is destroyed, and a unit whose own computer is destroyed", () => {
        for (const edition of ["total-warfare", "master-rules"]) {
            const master = unit("m", edition, [{ kind: "c3-master", destroyed: true }]);
            const slave = unit("s", edition, [{ kind: "c3-slave" }]);
            const status = getC3Status(slave, net("master-slave", [[master, "master"], [slave, "slave"]]), [master, slave], {});
            expect(status.linked, edition).toBe(false);
            expect(status.labels.join(" ")).toContain("Master");
        }
        const master = unit("m", "total-warfare", [{ kind: "c3-master" }]);
        const broken = unit("s", "total-warfare", [{ kind: "c3-slave", destroyed: true }]);
        expect(getC3Status(broken, net("master-slave", [[master, "master"], [broken, "slave"]]), [master, broken], {}).linked).toBe(false);
    });

    it("cuts a unit off when a stealth system is on, except Chameleon LPS", () => {
        const master = unit("m", "core-rulebook", [{ kind: "c3-master" }]);
        const stealthy = unit("s", "core-rulebook", [{ kind: "c3-slave" }, { kind: "stealth-armor" }], { stealthOn: { "s-stealth-armor": true } });
        expect(getC3Status(stealthy, net("master-slave", [[master, "master"], [stealthy, "slave"]]), [master, stealthy], {}).linked).toBe(false);
        const chameleon = unit("c", "core-rulebook", [{ kind: "c3-slave" }, { kind: "chameleon" }], { stealthOn: { "c-chameleon": true } });
        expect(getC3Status(chameleon, net("master-slave", [[master, "master"], [chameleon, "slave"]]), [master, chameleon], {}).linked).toBe(true);
    });

    it("gives indirect fire nothing, says TAG still helps, and does nothing in an edition without C3", () => {
        const master = unit("m", "total-warfare", [{ kind: "c3-master" }]);
        const slave = unit("s", "total-warfare", [{ kind: "c3-slave" }]);
        const indirect = c3Hit(slave, net("master-slave", [[master, "master"], [slave, "slave"]]), [master, slave], "short", "long", { indirect: true });
        expect(indirect.mods).toEqual([{ modifier: 0, label: expect.stringContaining("TAG") }]);
        const old = unit("s", "battletech-3rd-edition", [{ kind: "c3-slave" }]);
        const none = getEWarToHit(old, { c3: { nearestRangeBand: "short", ownRangeBand: "long", status: { linked: true, degrade: 0, labels: [] } }, rangeBand: "long" });
        expect(none).toEqual([{ modifier: 0, label: expect.stringContaining("not in") }]);
        const btc = unit("s", "battletech-compendium", [{ kind: "c3-slave" }]);
        expect(getEWarToHit(btc, { c3: { nearestRangeBand: "medium", ownRangeBand: "long", status: { linked: true, degrade: 0, labels: [] } }, rangeBand: "long" })
            .map((entry) => entry.modifier)).toEqual([-2]);
    });
});

// ---- E-War Phase 3, Task 4: emergency master, remote sensor pods, battle armor and Nova links ----
describe("C3 emergency master, sensor pods, battle armor and Nova links", () => {
    const unit = (uuid: string, kinds: { kind: EWarKind; tag?: string; destroyed?: boolean }[], play: IEWarCarrier["ewarPlay"] = {},
        extra: { tonnage?: number; squad?: number } = {}): IEWarCarrier => ({
        getUUID: () => uuid,
        getRulesEdition: () => "total-warfare",
        getEWarGear: () => kinds.map((entry) => ({ kind: entry.kind, tag: entry.tag ?? entry.kind, name: entry.kind, uuid: `${uuid}-${entry.kind}`, destroyed: !!entry.destroyed })),
        ewarPlay: play,
        getTonnage: extra.tonnage === undefined ? undefined : () => extra.tonnage as number,
        getSquadSize: extra.squad === undefined ? undefined : () => extra.squad as number,
    });
    const rolesAt = (members: { uuid: string; role: C3Role }[]) => Object.fromEntries(members.map((member) => [member.uuid, member.role]));

    it("lets the Emergency Master act as Master for six turns after the Master is lost, turns in ECM not counted", () => {
        const master = unit("m", [{ kind: "c3-master", destroyed: true }]);
        const emergency = unit("e", [{ kind: "c3-emergency-master" }], {});
        const slave = unit("s", [{ kind: "c3-slave" }]);
        const network: IC3Network = { name: "A", type: "master-slave", members: [{ uuid: "m", role: "master" }, { uuid: "e", role: "emergency" }, { uuid: "s", role: "slave" }] };
        const acting: boolean[] = [];
        for (let turn = 3; turn <= 9; turn++) {
            acting.push(rolesAt(getC3Members(network, [master, emergency, slave], {}, turn)).e === "master");
            tickC3Emergency(emergency, [master, emergency, slave], network);
        }
        expect(acting).toEqual([true, true, true, true, true, true, false]);
        const jammed = unit("e", [{ kind: "c3-emergency-master" }], { inHostileEcm: true });
        tickC3Emergency(jammed, [master, jammed, slave], network);
        expect(jammed.ewarPlay.c3EmergencyTurns ?? 0).toBe(0);
        const healthy = unit("m", [{ kind: "c3-master" }]);
        const quiet = unit("e", [{ kind: "c3-emergency-master" }]);
        tickC3Emergency(quiet, [healthy, quiet, slave], network);
        expect(quiet.ewarPlay.c3EmergencyTurns ?? 0).toBe(0);
    });

    it("works a Remote Sensor pod for three full turns after the launch turn, and refuses one over the limit or in C3i", () => {
        const network: IC3Network = { name: "A", type: "master-slave", members: [{ uuid: "m", role: "master" }] };
        const master = unit("m", [{ kind: "c3-master" }]);
        const board: IEWarBoard = { sensorPods: [{ network: "A", hex: "0505", turn: 2 }] };
        const podsAt = (turn: number) => getC3Members(network, [master], board, turn).filter((member) => member.uuid.startsWith("pod:")).length;
        expect([2, 3, 5, 6].map(podsAt)).toEqual([0, 1, 1, 0]);
        const full: IC3Network = { name: "F", type: "master-slave", members: Array.from({ length: 12 }, (_, index) => ({ uuid: `u${index}`, role: "slave" as C3Role })) };
        const crowd: IEWarBoard = {};
        expect(addC3SensorPod(crowd, full, [], "total-warfare", { hex: "0101", turn: 1 }).join(" ")).toContain("at most 12");
        expect(crowd.sensorPods).toBeUndefined();
        const improved: IC3Network = { name: "I", type: "c3i", members: [{ uuid: "a", role: "member" }] };
        expect(addC3SensorPod(crowd, improved, [], "total-warfare", { hex: "0101", turn: 1 }).join(" ")).toContain("C3i");
        expect(addC3SensorPod(crowd, network, [master], "total-warfare", { hex: "0202", turn: 1 })).toEqual([]);
        expect(crowd.sensorPods).toEqual([{ network: "A", hex: "0202", turn: 1 }]);
    });

    it("leaves a two-trooper battle armor squad out of the members, and a Nova link out until the turn after it is declared", () => {
        const squad = unit("b", [{ kind: "c3-slave" }], {}, { squad: 2 });
        const full = unit("f", [{ kind: "c3-slave" }], {}, { squad: 4 });
        const network: IC3Network = { name: "A", type: "master-slave", members: [{ uuid: "b", role: "slave" }, { uuid: "f", role: "slave" }] };
        expect(getC3Members(network, [squad, full], {}, 1).map((member) => member.uuid)).toEqual(["f"]);
        const nova: IC3Network = { name: "N", type: "nova", members: [{ uuid: "a", role: "member" }, { uuid: "b", role: "member", since: 5 }] };
        expect(getC3Members(nova, [], {}, 5).map((member) => member.uuid)).toEqual(["a"]);
        expect(getC3Members(nova, [], {}, 6).map((member) => member.uuid)).toEqual(["a", "b"]);
        const four: IC3Network = { name: "N", type: "nova", members: ["a", "b", "c", "d"].map((uuid) => ({ uuid, role: "member" as C3Role })) };
        expect(validateC3Network(four, [], "total-warfare").join(" ")).toContain("at most 3");
    });

    it("gives a battle armor suite no effect on a non-battle-armor unit over three tons (Ghosts of Obeedah p.55)", () => {
        const gearOf = (tonnage: number) => {
            const heavy = unit("v", [{ kind: "ecm-guardian", tag: "ba-is-ecm-suite" }], {}, { tonnage });
            return getEWarEcmMode(heavy, heavy.getEWarGear()[0]);
        };
        expect(gearOf(3)).toBe("ecm");
        expect(gearOf(4)).toBe("off");
        const own = unit("v", [{ kind: "ecm-guardian", tag: "ecm-suite" }], {}, { tonnage: 50 });
        expect(getEWarEcmMode(own, own.getEWarGear()[0])).toBe("ecm");
        const trooper = unit("b", [{ kind: "ecm-guardian", tag: "ba-is-ecm-suite" }], {}, { tonnage: 1, squad: 4 });
        expect(getEWarEcmMode(trooper, trooper.getEWarGear()[0])).toBe("ecm");
        const squadC3 = unit("v", [{ kind: "c3-slave", tag: "is-c3-system" }], {}, { tonnage: 20 });
        const master = unit("m", [{ kind: "c3-master" }]);
        expect(getC3Status(squadC3, { name: "A", type: "master-slave", members: [{ uuid: "m", role: "master" }, { uuid: "v", role: "slave" }] }, [master, squadC3], {}).linked).toBe(false);
    });
});

// ---- E-War Phase 3, Task 5: EW Equipment, communications equipment, ghost targets ----
describe("EW Equipment, communications equipment and ghost targets", () => {
    const rig = (uuid: string, edition: string, gear: { kind: EWarKind; destroyed?: boolean }[], play: IEWarCarrier["ewarPlay"] = {}): IEWarCarrier => ({
        getUUID: () => uuid,
        getRulesEdition: () => edition,
        getEWarGear: () => gear.map((entry, index) => ({ kind: entry.kind, tag: entry.kind, name: entry.kind, uuid: `${uuid}-${entry.kind}-${index}`, destroyed: !!entry.destroyed })),
        ewarPlay: play,
    });
    const comms = (tons: number) => Array.from({ length: tons }, () => ({ kind: "communications" as EWarKind }));
    const first = (unit: IEWarCarrier) => unit.getEWarGear()[0];

    it("makes EW Equipment an ECM suite and a 3-hex probe, not the ECM a stealth system needs, one of each at a time", () => {
        const unit = rig("u", "total-warfare", [{ kind: "ew-equipment" }]);
        expect(getEWarEcmMode(unit, first(unit))).toBe("ecm");
        expect(getEWarProbe(unit, {})[0]).toMatchObject({ kind: "ew-equipment", range: 3, detects: true });
        expect(getEWarProbe(unit, { hostileEcm: true })[0].detects).toBe(false);
        expect(getEWarNotes(unit).join(" ")).toContain("one probe and one ECM at a time");
        const stealthy = rig("s", "total-warfare", [{ kind: "ew-equipment" }, { kind: "stealth-armor" }]);
        expect(getEWarStealthNotes(stealthy).join(" ")).toContain("cannot work without an ECM suite");
    });

    it("holds EW Equipment as apocryphal under the BattleMech Manual and Core Rulebook, playing by the Total Warfare rule", () => {
        for (const edition of ["battlemech-manual", "core-rulebook"]) {
            const unit = rig("u", edition, [{ kind: "ew-equipment" }]);
            expect(getEWarEcmMode(unit, first(unit)), edition).toBe("ecm");
            expect(getEWarProbe(unit, {})[0].range, edition).toBe(3);
            expect(getEWarProbeNotes(unit).join(" "), edition).toContain("apocryphal");
        }
        const early = rig("u", "battletech-3rd-edition", [{ kind: "ew-equipment" }]);
        expect(getEWarEcmMode(early, first(early))).toBe("off");
    });

    it("counts communications equipment as half an ECCM suite from 3 tons and one from 7 tons", () => {
        const small = rig("a", "total-warfare", comms(5), { ecmMode: {} });
        const smaller = rig("b", "total-warfare", comms(5));
        for (const unit of [small, smaller]) {
            for (const gear of unit.getEWarGear()) setEWarEcmMode(unit, gear, "eccm");
        }
        expect(getEWarEccmSuites([small])).toEqual({ suites: 0.5, angel: false });
        expect(getEWarEccmSuites([small, smaller])).toEqual({ suites: 1, angel: false });
        expect(getEWarEcmEffective({ hostileEcmCount: 1, friendlyEccmCount: 1 }, "total-warfare").ecmWorks).toBe(false);
        expect(getEWarEcmEffective({ hostileEcmCount: 1, friendlyEccmCount: 0.5 }, "total-warfare").ecmWorks).toBe(true);
        const big = rig("c", "total-warfare", comms(8));
        for (const gear of big.getEWarGear()) setEWarEcmMode(big, gear, "eccm");
        expect(getEWarEccmSuites([big]).suites).toBe(1);
        const tiny = rig("d", "total-warfare", comms(2));
        for (const gear of tiny.getEWarGear()) setEWarEcmMode(tiny, gear, "eccm");
        expect(getEWarEccmSuites([tiny]).suites).toBe(0);
        const broken = rig("e", "total-warfare", [...comms(7).slice(1), { kind: "communications", destroyed: true }]);
        for (const gear of broken.getEWarGear()) setEWarEcmMode(broken, gear, "eccm");
        expect(getEWarEccmSuites([broken]).suites).toBe(0.5);
    });

    it("lets communications equipment of 7 tons or more make ghost targets, not a smaller set", () => {
        const big = rig("c", "total-warfare", comms(8));
        for (const gear of big.getEWarGear()) setEWarEcmMode(big, gear, "ghost");
        expect(getEWarGhostTargets(big, true)).toEqual([{ modifier: 1, label: expect.stringContaining("Ghost") }]);
        const small = rig("d", "total-warfare", comms(5));
        for (const gear of small.getEWarGear()) setEWarEcmMode(small, gear, "ghost");
        expect(getEWarGhostTargets(small, true)).toEqual([]);
        expect(getEWarModeOptions(big, big.getEWarGear()[0])).toEqual(["eccm", "ghost", "off"]);
        expect(getEWarModeOptions(small, small.getEWarGear()[0])).toEqual(["eccm", "off"]);
    });
});

// ---- E-War Phase 3, Task 6: aerospace ECM (SO pp.99-100, TW p.238, AT2R p.25) ----
describe("aerospace ECM", () => {
    const craft = (edition: string, gear: { kind: EWarKind; destroyed?: boolean }[] = []): IEWarCarrier => ({
        getUUID: () => "a",
        getRulesEdition: () => edition,
        getEWarGear: () => gear.map((entry, index) => ({ kind: entry.kind, tag: entry.kind, name: entry.kind, uuid: `a-${index}`, destroyed: !!entry.destroyed })),
        ewarPlay: {},
    });
    const hexes = (count: number, aeroClass: AeroEcmClass = "fighter") => Array.from({ length: count }, (_, index) => ({ hex: `h${index}`, class: aeroClass }));
    const ctx = (fields: { hex: string; class: AeroEcmClass }[], extra: Partial<IEWarAeroEcmContext> = {}): IEWarAeroEcmContext =>
        ({ fields, attackerClass: "fighter", mapsheet: "aero", ...extra });
    const total = (modifiers: { modifier: number }[]) => modifiers.reduce((sum, entry) => sum + entry.modifier, 0);

    it("adds +1 for each ECM hex on the line of fire up to +4", () => {
        const unit = craft("total-warfare");
        expect(total(getEWarAeroEcm(unit, ctx(hexes(3))))).toBe(3);
        expect(total(getEWarAeroEcm(unit, ctx(hexes(6))))).toBe(4);
        expect(getEWarAeroEcm(unit, ctx(hexes(3)))[0].label).toContain("SO p.99");
    });

    it("counts one field per class in a hex, and ignores fighter and Small Craft ECM when the attacker is a Large Craft", () => {
        const unit = craft("total-warfare");
        const twoFighters = [{ hex: "h", class: "fighter" as AeroEcmClass }, { hex: "h", class: "fighter" as AeroEcmClass }];
        expect(total(getEWarAeroEcm(unit, ctx(twoFighters)))).toBe(1);
        const mixed = [{ hex: "h", class: "fighter" as AeroEcmClass }, { hex: "h", class: "large-craft" as AeroEcmClass }];
        expect(total(getEWarAeroEcm(unit, ctx(mixed)))).toBe(2);
        expect(total(getEWarAeroEcm(unit, ctx(hexes(3), { attackerClass: "large-craft" })))).toBe(0);
    });

    it("lets a fighter tuned to ECCM cancel fighter ECM in its own hex and shave one off Large Craft ECM, and a Large Craft roll its MoS", () => {
        const unit = craft("total-warfare");
        const fields = [{ hex: "own", class: "fighter" as AeroEcmClass }, { hex: "x", class: "large-craft" as AeroEcmClass }, { hex: "y", class: "large-craft" as AeroEcmClass }];
        expect(total(getEWarAeroEcm(unit, ctx(fields, { eccm: "tuned", ownHex: "own" })))).toBe(1);
        expect(total(getEWarAeroEcm(unit, ctx(hexes(3), { attackerClass: "large-craft", eccm: { roll: 2 } })))).toBe(0);
        expect(total(getEWarAeroEcm(unit, ctx(hexes(4, "large-craft"), { attackerClass: "large-craft", eccm: { roll: 2 } })))).toBe(2);
        expect(getNavalC3EccmRoll([1, 3, 2])).toBe(3);
    });

    it("shrinks a field one hex for each critical hit", () => {
        expect(getAeroEcmRadius("warship", true, 0)).toBe(2);
        expect(getAeroEcmRadius("warship", true, 1)).toBe(1);
        expect(getAeroEcmRadius("dropship", true, 0)).toBe(1);
        expect(getAeroEcmRadius("small-craft", false, 0)).toBe(0);
        expect(getAeroEcmRadius("small-craft", true, 0)).toBe(1);
        expect(getAeroEcmRadius("warship", true, 5)).toBe(0);
    });

    it("applies on ground mapsheets as normal ECM, not at all in AT2R, and names the edition where no rule is printed", () => {
        const labelOf = (edition: string, mapsheet: "aero" | "ground") => getEWarAeroEcm(craft(edition), ctx(hexes(2), { mapsheet }))[0];
        expect(labelOf("total-warfare", "ground")).toMatchObject({ modifier: 0, label: expect.stringContaining("ground") });
        expect(labelOf("master-rules-revised", "aero")).toMatchObject({ modifier: 0, label: expect.stringContaining("AT2R p.25") });
        expect(labelOf("battletech-3rd-edition", "aero")).toMatchObject({ modifier: 0, label: expect.stringContaining("no aerospace ECM rule") });
        // BMM prints no aerospace rules: the SO field rule stays as apocryphal, carried from Total Warfare.
        expect(labelOf("battlemech-manual", "aero")).toMatchObject({ modifier: 2, label: expect.stringContaining("SO p.99") });
    });

    it("sends the aerospace context through getEWarToHit", () => {
        const unit = craft("total-warfare");
        expect(total(getEWarToHit(unit, { aero: ctx(hexes(2)) }))).toBe(2);
    });
});

// ---- E-War Phase 3, review fix pass: validation by gear, BA gear limits, aerospace class rules, flags carried forward ----
describe("review fixes: gear checks, BA limits, aerospace classes, carried flags", () => {
    const rig = (uuid: string, edition: string, gear: { kind: EWarKind; tag?: string; destroyed?: boolean }[], play: IEWarCarrier["ewarPlay"] = {}, extra: { tonnage?: number; squad?: number } = {}): IEWarCarrier => ({
        getUUID: () => uuid,
        getRulesEdition: () => edition,
        getEWarGear: () => gear.map((entry, index) => ({ kind: entry.kind, tag: entry.tag ?? entry.kind, name: entry.kind, uuid: `${uuid}-${entry.kind}-${index}`, destroyed: !!entry.destroyed })),
        ewarPlay: play,
        getTonnage: extra.tonnage === undefined ? undefined : () => extra.tonnage as number,
        getSquadSize: extra.squad === undefined ? undefined : () => extra.squad as number,
    });

    it("refuses a network type the members gear cannot join, and a role the gear does not give", () => {
        const master = rig("m", "total-warfare", [{ kind: "c3-master" }]);
        const slave = rig("s", "total-warfare", [{ kind: "c3-slave" }]);
        const asNova: IC3Network = { name: "A", type: "nova", members: [{ uuid: "m", role: "member" }, { uuid: "s", role: "member" }] };
        expect(validateC3Network(asNova, [master, slave], "total-warfare").join(" ")).toContain("cannot join");
        const slaveAsMaster: IC3Network = { name: "A", type: "master-slave", members: [{ uuid: "s", role: "master" }] };
        expect(validateC3Network(slaveAsMaster, [slave], "total-warfare").join(" ")).toContain("Master computer");
        const noEmergency: IC3Network = { name: "A", type: "master-slave", members: [{ uuid: "s", role: "emergency" }] };
        expect(validateC3Network(noEmergency, [slave], "total-warfare").join(" ")).toContain("Emergency Master");
        const boostedMix: IC3Network = { name: "A", type: "boosted", members: [{ uuid: "m", role: "master" }, { uuid: "s", role: "slave" }] };
        expect(validateC3Network(boostedMix, [master, slave], "total-warfare")).toEqual([]);
    });

    it("switches off Clan ECM, Angel and battle armor stealth on a heavy non-battle-armor unit, not on battle armor", () => {
        for (const kind of ["ecm-clan", "ecm-angel"] as const) {
            const heavy = rig("v", "total-warfare", [{ kind, tag: `ba-${kind}` }], {}, { tonnage: 50 });
            expect(getEWarEcmMode(heavy, heavy.getEWarGear()[0]), kind).toBe("off");
            const light = rig("v", "total-warfare", [{ kind, tag: `ba-${kind}` }], {}, { tonnage: 3 });
            expect(getEWarEcmMode(light, light.getEWarGear()[0]), kind).not.toBe("off");
        }
        const heavyStealth = rig("v", "total-warfare", [{ kind: "stealth-ba", tag: "ba-stealth-basic" }], { stealthOn: { "*": true } }, { tonnage: 50 });
        expect(isEWarStealthOn(heavyStealth, heavyStealth.getEWarGear()[0])).toBe(false);
        const trooper = rig("b", "total-warfare", [{ kind: "stealth-ba", tag: "ba-stealth-basic" }], { stealthOn: { "*": true } }, { tonnage: 1, squad: 4 });
        expect(isEWarStealthOn(trooper, trooper.getEWarGear()[0])).toBe(true);
    });

    it("treats fighters and Small Craft as one class, gives the control roll to Large Craft only, and takes the tuned -1 off one Large Craft", () => {
        const unit = rig("a", "total-warfare", []);
        const base = { attackerClass: "fighter" as AeroEcmClass, mapsheet: "aero" as const };
        const both = [{ hex: "h", class: "fighter" as AeroEcmClass }, { hex: "h", class: "small-craft" as AeroEcmClass }];
        expect(getEWarAeroEcm(unit, { ...base, fields: both })[0].modifier).toBe(1);
        const three = Array.from({ length: 3 }, (_, index) => ({ hex: `h${index}`, class: "fighter" as AeroEcmClass }));
        expect(getEWarAeroEcm(unit, { ...base, fields: three, eccm: { roll: 2 } })[0].modifier).toBe(3);
        const fields = [{ hex: "own", class: "small-craft" as AeroEcmClass }, { hex: "x", class: "large-craft" as AeroEcmClass }, { hex: "y", class: "large-craft" as AeroEcmClass }, { hex: "z", class: "large-craft" as AeroEcmClass }];
        expect(getEWarAeroEcm(unit, { ...base, fields, eccm: "tuned", ownHex: "own" })[0].modifier).toBe(2);
    });

    it("carries the aerospace, Battle Armor and ghost-target flags into the later books, apocryphal, and gives BMR the AT2 rule", () => {
        const guardian = (edition: string) => getEWarPlayRules(edition)!.items["ecm-guardian"]!;
        expect(guardian("master-rules").aeroEcm).toBe("none-between-aero");
        for (const edition of ["battlemech-manual", "core-rulebook"]) {
            expect(guardian(edition).aeroEcm, edition).toBe("so-field");
            expect(guardian(edition).nonBaTonnage, edition).toBe(3);
            expect(guardian(edition).ghostTargets, edition).toBeDefined();
            expect(guardian(edition).eccm, edition).toBe(true);
        }
        const comms = rig("c", "battlemech-manual", Array.from({ length: 8 }, () => ({ kind: "communications" as EWarKind })));
        for (const gear of comms.getEWarGear()) setEWarEcmMode(comms, gear, "eccm");
        expect(getEWarEcmMode(comms, comms.getEWarGear()[0])).toBe("eccm");
    });
});

// ---- E-War Phase 3, deferred minors ----
describe("deferred minors: pods, infantry Narc notes, aerospace label, force ECCM", () => {
    const rig = (uuid: string, edition: string, gear: { kind: EWarKind; tag?: string }[], play: IEWarCarrier["ewarPlay"] = {}, extra: { launchers?: number } = {}): IEWarCarrier => ({
        getUUID: () => uuid,
        getRulesEdition: () => edition,
        getEWarGear: () => gear.map((entry, index) => ({ kind: entry.kind, tag: entry.tag ?? entry.kind, name: entry.kind, uuid: `${uuid}-${index}`, destroyed: false })),
        ewarPlay: play,
        ...(extra.launchers === undefined ? {} : { getNarcLaunchers: () => extra.launchers as number }),
    });

    it("counts a Remote Sensor pod toward the three Slaves a Master controls", () => {
        const master = rig("m", "total-warfare", [{ kind: "c3-master" }]);
        const slaves = [1, 2, 3].map((n) => rig(`s${n}`, "total-warfare", [{ kind: "c3-slave" }]));
        const network: IC3Network = { name: "A", type: "master-slave", members: [{ uuid: "m", role: "master" }, ...slaves.map((s) => ({ uuid: s.getUUID(), role: "slave" as C3Role }))] };
        expect(validateC3Network(network, [master, ...slaves], "total-warfare")).toEqual([]);
        expect(validateC3Network(network, [master, ...slaves], "total-warfare", { pods: 1 }).join(" ")).toContain("controls at most 3");
    });

    it("cites Maximum Tech p.40 as apocryphal for infantry field gear, and counts the one-shot Narc launchers", () => {
        const platoon = rig("i", "total-warfare", [{ kind: "narc", tag: "inf-field-narc" }, { kind: "tag", tag: "inf-field-tag" }], {}, { launchers: 2 });
        const notes = getEWarNotes(platoon).join(" ");
        expect(notes).toContain("MT p.40");
        expect(notes).toContain("apocryphal");
        expect(getInfantryNarcLeft(platoon)).toBe(2);
        fireInfantryNarc(platoon);
        fireInfantryNarc(platoon);
        fireInfantryNarc(platoon);
        expect(getInfantryNarcLeft(platoon)).toBe(0);
        expect(platoon.ewarPlay.narcFired).toBe(2);
    });

    it("says the aerospace field is an advanced, optional rule", () => {
        const craft = rig("a", "total-warfare", []);
        const label = getEWarAeroEcm(craft, { fields: [{ hex: "h", class: "fighter" }], attackerClass: "fighter", mapsheet: "aero" })[0].label;
        expect(label).toContain("advanced");
    });

    it("turns the units in ECCM mode into the friendly ECCM tick, halves and an Angel suite included", () => {
        const guardian = rig("g", "total-warfare", [{ kind: "ecm-guardian" }]);
        setEWarEcmMode(guardian, guardian.getEWarGear()[0], "eccm");
        const angel = rig("n", "total-warfare", [{ kind: "ecm-angel" }]);
        setEWarEcmMode(angel, angel.getEWarGear()[0], "eccm");
        expect(getForceEccmTick([guardian])).toEqual({ friendlyEccmCount: 1, friendlyAngelEccm: false });
        expect(getForceEccmTick([guardian, angel])).toEqual({ friendlyEccmCount: 1, friendlyAngelEccm: true });
        expect(getForceEccmTick([])).toEqual({ friendlyEccmCount: 0, friendlyAngelEccm: false });
    });
});

// ---- E-War customs: every custom or fan E-War item has an edition entry, attribution and notes ----
describe("E-War custom and fan items", () => {
    const rig = (edition: string, gear: { kind: EWarKind; tag?: string }[], play: IEWarCarrier["ewarPlay"] = {}): IEWarCarrier => ({
        getUUID: () => "u",
        getRulesEdition: () => edition,
        getEWarGear: () => gear.map((entry, index) => ({ kind: entry.kind, tag: entry.tag ?? entry.kind, name: entry.kind, uuid: `u-${index}`, destroyed: false })),
        ewarPlay: play,
    });

    it("maps the custom Chaff Pod 2.0 to the chaff pod and writes it a note with its source", () => {
        expect(getEWarKind("custom-chaff-pod-2")).toBe("chaff-pod");
        const unit = rig("total-warfare", [{ kind: "chaff-pod", tag: "custom-chaff-pod-2" }]);
        const notes = getEWarNotes(unit).join(" ");
        expect(notes).toContain("Chaff Pod");
        expect(notes).toContain("Prince");
    });

    it("plays the Personal ECM as a Guardian in its own hex only: no ECCM or ghost mode, not the ECM stealth armor needs", () => {
        const unit = rig("total-warfare", [{ kind: "ecm-personal", tag: "custom-personal-ecm" }]);
        const gear = unit.getEWarGear()[0];
        expect(getEWarEcmMode(unit, gear)).toBe("ecm");
        expect(getEWarModeOptions(unit, gear)).toEqual(["ecm", "off"]);
        setEWarEcmMode(unit, gear, "eccm");
        expect(getEWarEcmMode(unit, gear)).toBe("ecm");
        expect(getEWarNotes(unit).join(" ")).toContain("Pleiades Mechworks");
        const stealthy = rig("total-warfare", [{ kind: "ecm-personal", tag: "custom-personal-ecm" }, { kind: "stealth-armor" }]);
        expect(getEWarStealthNotes(stealthy).join(" ")).toContain("cannot work without an ECM suite");
        // Later books keep it as apocryphal, playing by the same entry.
        for (const edition of ["battlemech-manual", "core-rulebook"]) {
            const later = rig(edition, [{ kind: "ecm-personal", tag: "custom-personal-ecm" }]);
            expect(getEWarEcmMode(later, later.getEWarGear()[0]), edition).toBe("ecm");
        }
    });

    it("plays the Modular C3 as an Improved C3 for up to twelve units, its own network type", () => {
        const a = rig("total-warfare", [{ kind: "c3-modular", tag: "custom-modular-c3" }]);
        expect(getC3GearType(a)).toBe("modular");
        const twelve = Array.from({ length: 12 }, (_, index) => ({ ...rig("total-warfare", [{ kind: "c3-modular", tag: "custom-modular-c3" }]), getUUID: () => `m${index}` }));
        const network: IC3Network = { name: "A", type: "modular", members: twelve.map((unit) => ({ uuid: unit.getUUID(), role: "member" as C3Role })) };
        expect(validateC3Network(network, twelve, "total-warfare")).toEqual([]);
        const over: IC3Network = { ...network, members: [...network.members, { uuid: "x", role: "member" }] };
        expect(validateC3Network(over, twelve, "total-warfare").join(" ")).toContain("at most 12");
        const mixed: IC3Network = { name: "A", type: "c3i", members: [{ uuid: "m0", role: "member" }] };
        expect(validateC3Network(mixed, twelve, "total-warfare").join(" ")).toContain("cannot join");
        const slave = { ...rig("total-warfare", [{ kind: "c3-modular", tag: "custom-modular-c3" }]), getUUID: () => "m0" };
        expect(getC3Status(slave, { name: "A", type: "modular", members: [{ uuid: "m0", role: "member" }] }, [slave], {}).linked).toBe(true);
        expect(getEWarNotes(slave).join(" ")).toContain("Prince");
    });

    it("gives every custom E-War item an entry in Total Warfare and keeps it apocryphal after", () => {
        for (const kind of ["ecm-personal", "c3-modular", "chaff-pod", "inarc", "null-sig"] as EWarKind[]) {
            expect(getEWarPlayRules("total-warfare")!.items[kind], `${kind} in TW`).toBeDefined();
            for (const edition of ["battlemech-manual", "core-rulebook"]) {
                expect(getEWarPlayRules(edition)!.items[kind], `${kind} in ${edition}`).toBeDefined();
            }
        }
        expect(getEWarPlayRules("total-warfare")!.items["ecm-personal"]!.note).toContain("Pleiades Mechworks");
        expect(getEWarPlayRules("battlemech-manual")!.items["ecm-personal"]!.apocryphal).toBe(true);
    });
});

describe("E-War Phase 4: the Blue Saviour answers missiles (#642)", () => {
    const carrier = (edition: string, field: boolean, gear: { kind: EWarKind; uuid: string; tag?: string }[] = [], uses?: Record<string, number>): IEWarCarrier => ({
        getUUID: () => "d1",
        getRulesEdition: () => edition,
        getEWarGear: () => gear.map(item => ({ kind: item.kind, tag: item.tag ?? item.kind, name: item.kind, uuid: item.uuid, destroyed: false })),
        ewarPlay: uses ? { amsUses: uses } : {},
        isBlueSaviourOn: () => field,
    });
    it("a Blue Saviour that is on answers a missile attack as the edition AMS, with no heat or ammunition of its own", () => {
        const result = getEWarDefense(carrier("total-warfare", true), { missileAttack: true, launcherSize: 10 });
        expect(result).toMatchObject({ applies: true, mode: "cluster-shift", shift: -4, heat: 0, ammoShots: 0, fromField: true, spentGearUuid: BLUE_SAVIOUR_GEAR_KEY });
        expect(result.labels.join(" ")).toContain("Blue Saviour");
    });
    it("is off when the field is off", () => {
        expect(getEWarDefense(carrier("total-warfare", false), { missileAttack: true, launcherSize: 10 }).applies).toBe(false);
    });
    it("a real AMS is used first and the field next, once each a turn", () => {
        const gear = [{ kind: "ams" as EWarKind, uuid: "a1", tag: "is-ams" }];
        expect(getEWarDefense(carrier("total-warfare", true, gear), { missileAttack: true, launcherSize: 10 })).toMatchObject({ spentGearUuid: "a1" });
        expect(getEWarDefense(carrier("total-warfare", true, gear, { a1: 1 }), { missileAttack: true, launcherSize: 10 })).toMatchObject({ fromField: true, spentGearUuid: BLUE_SAVIOUR_GEAR_KEY });
        expect(getEWarDefense(carrier("total-warfare", true, gear, { a1: 1, [BLUE_SAVIOUR_GEAR_KEY]: 1 }), { missileAttack: true, launcherSize: 10 }).applies).toBe(false);
    });
    it("older editions: the field destroys missiles as that edition AMS does, with no ammunition", () => {
        const result = getEWarDefense(carrier("master-rules", true), { missileAttack: true, launcherSize: 10 });
        expect(result).toMatchObject({ applies: true, mode: "missiles-destroyed", destroyedDice: 1, heat: 0, ammoShots: 0, fromField: true });
        expect(result.ammoPerMissile).toBeUndefined();
        expect(result.ammoRoll).toBeUndefined();
    });
    it("the field cannot engage an Arrow IV, and an edition with no E-War rules gives nothing", () => {
        const arrow = getEWarDefense(carrier("total-warfare", true), { missileAttack: true, launcherSize: 1, munition: "arrow-iv" });
        expect(arrow.applies).toBe(false);
        expect(arrow.labels.join(" ")).toContain("Arrow IV");
        expect(getEWarDefense(carrier("battletech-4th-edition", true), { missileAttack: true, launcherSize: 10 }).applies).toBe(false);
    });
    it("a streak launcher and a single missile get the same labels as for a real AMS", () => {
        const streak = getEWarDefense(carrier("total-warfare", true), { missileAttack: true, launcherSize: 4, streak: true });
        expect(streak.streakBaseRoll).toBe(11);
        const single = getEWarDefense(carrier("total-warfare", true), { missileAttack: true, launcherSize: 1 });
        expect(single.singleMissile).toBe(true);
    });
});

describe("E-War Phase 4: the Blue Saviour sits inside hostile ECM that ECCM cannot negate (#642)", () => {
    const unit = (uuid: string, field: boolean, kinds: { kind: EWarKind; uuid?: string; tag?: string }[] = [], play: IEWarCarrier["ewarPlay"] = {}, edition: string = "total-warfare"): IEWarCarrier => ({
        getUUID: () => uuid,
        getRulesEdition: () => edition,
        getEWarGear: () => kinds.map((entry) => ({ kind: entry.kind, tag: entry.tag ?? entry.kind, name: entry.kind, uuid: entry.uuid ?? `${uuid}-${entry.kind}`, destroyed: false })),
        ewarPlay: play,
        isBlueSaviourOn: () => field,
    });
    it("an Artemis launcher of a Blue Saviour unit loses its shift to ECM that ECCM does not clear; off, ECCM clears it", () => {
        const gear = [{ kind: "artemis-iv" as EWarKind, uuid: "w1", tag: "lrm-15-artemis-iv" }];
        const shift = (field: boolean) => {
            const attacker = unit("a", field, gear);
            const attack = buildEWarAttack({ uuid: "w1", tag: "lrm-15-artemis-iv" }, undefined, withAttackerEcm(attacker, { hostileEcmCount: 1, friendlyEccmCount: 3 }), "total-warfare");
            return getEWarClusterShift(attacker, attack).reduce((sum, entry) => sum + entry.modifier, 0);
        };
        expect(shift(true)).toBe(0);
        expect(shift(false)).toBe(2);
    });
    it("a Slave with the field on is cut off even with friendly ECCM; off with ECCM it stays linked", () => {
        const master = unit("m", false, [{ kind: "c3-master" }]);
        const network: IC3Network = { name: "A", type: "master-slave", members: [{ uuid: "m", role: "master" }, { uuid: "s", role: "slave" }] };
        const jammed = unit("s", true, [{ kind: "c3-slave" }], { inFriendlyEccm: true });
        expect(getC3Status(jammed, network, [master, jammed]).linked).toBe(false);
        const clear = unit("s", false, [{ kind: "c3-slave" }], { inFriendlyEccm: true, inHostileEcm: true });
        expect(getC3Status(clear, network, [master, clear]).linked).toBe(true);
    });
    it("notes say what the field does while it is on, and nothing while it is off", () => {
        expect(getEWarNotes(unit("a", true)).join(" ")).toContain("Blue Saviour");
        expect(getEWarNotes(unit("a", true)).join(" ")).toContain("ECCM cannot cancel");
        expect(getEWarNotes(unit("a", false)).join(" ")).not.toContain("Blue Saviour");
        expect(getEWarNotes(unit("a", true, [], {}, "battletech-4th-edition"))).toEqual([]);
    });
});

describe("E-War Phase 4: the Personal ECM covers the friendly units in its hex (#642)", () => {
    const unit = (uuid: string, kinds: { kind: EWarKind; tag?: string; destroyed?: boolean }[] = [], play: IEWarCarrier["ewarPlay"] = {}, edition: string = "total-warfare"): IEWarCarrier => ({
        getUUID: () => uuid,
        getRulesEdition: () => edition,
        getEWarGear: () => kinds.map((entry, index) => ({ kind: entry.kind, tag: entry.tag ?? entry.kind, name: entry.kind, uuid: `${uuid}-${entry.kind}-${index}`, destroyed: !!entry.destroyed })),
        ewarPlay: play,
    });
    const personal = (uuid: string, play: IEWarCarrier["ewarPlay"] = {}, extra: { kind: EWarKind; destroyed?: boolean }[] = []) => unit(uuid, [{ kind: "ecm-personal", tag: "custom-personal-ecm" }, ...extra], play);

    it("a working Personal ECM covers itself and the units named as sharing its hex", () => {
        const carrier = personal("p");
        const mate = unit("m");
        const stranger = unit("x");
        const cover = getPersonalEcmCover({ personalEcm: { p: ["m"] } }, [carrier, mate, stranger]);
        expect([...cover.keys()].sort()).toEqual(["m", "p"]);
        expect(cover.get("m")).toEqual(["p"]);
    });
    it("a destroyed, switched-off or stealth-silenced Personal ECM covers nobody", () => {
        const mate = unit("m");
        const board = { personalEcm: { p: ["m"] } };
        expect(getPersonalEcmCover(board, [unit("p", [{ kind: "ecm-personal", tag: "custom-personal-ecm", destroyed: true }]), mate]).size).toBe(0);
        const off = personal("p");
        setEWarEcmMode(off, off.getEWarGear()[0], "off");
        expect(getPersonalEcmCover(board, [off, mate]).size).toBe(0);
        const silenced = personal("p", { stealthOn: { "*": true } }, [{ kind: "stealth-armor" }]);
        expect(getPersonalEcmCover(board, [silenced, mate]).size).toBe(0);
    });
    it("a unit named by two carriers lists both, and a mate that is not in the force is ignored", () => {
        const cover = getPersonalEcmCover({ personalEcm: { p: ["m", "gone"], q: ["m"] } }, [personal("p"), personal("q"), unit("m")]);
        expect(cover.get("m")?.sort()).toEqual(["p", "q"]);
        expect(cover.has("gone")).toBe(false);
    });
    it("applyEWarBoard writes inFriendlyEcm and personalEcmOf, leaves a hand override alone, and clears them with the entry", () => {
        const carrier = personal("p");
        const mate = unit("m");
        const overridden = unit("o", [], { overrides: ["inFriendlyEcm"] });
        const board: IEWarBoard = { personalEcm: { p: ["m", "o"] } };
        applyEWarBoard(board, [carrier, mate, overridden]);
        expect(mate.ewarPlay).toMatchObject({ inFriendlyEcm: true, personalEcmOf: ["p"] });
        expect(carrier.ewarPlay.inFriendlyEcm).toBe(true);
        expect(overridden.ewarPlay.inFriendlyEcm).toBeUndefined();
        delete board.personalEcm;
        applyEWarBoard(board, [carrier, mate, overridden]);
        expect(mate.ewarPlay.inFriendlyEcm).toBeUndefined();
        expect(mate.ewarPlay.personalEcmOf).toBeUndefined();
    });
    it("the Personal ECM never makes a mate carry the ECM Stealth Armor needs", () => {
        const mate = unit("m", [{ kind: "stealth-armor" }], { stealthOn: { "*": true } }, "master-rules-revised");
        applyEWarBoard({ personalEcm: { p: ["m"] } }, [personal("p"), mate]);
        expect(getEWarStealthNotes(mate).join(" ")).toContain("cannot work without an ECM suite");
    });
});

describe("E-War Phase 4: review fixes (#642)", () => {
    const unit = (uuid: string, field: boolean, kinds: { kind: EWarKind; uuid?: string; tag?: string; destroyed?: boolean }[] = [], play: IEWarCarrier["ewarPlay"] = {}, edition: string = "total-warfare"): IEWarCarrier => ({
        getUUID: () => uuid,
        getRulesEdition: () => edition,
        getEWarGear: () => kinds.map((entry) => ({ kind: entry.kind, tag: entry.tag ?? entry.kind, name: entry.kind, uuid: entry.uuid ?? `${uuid}-${entry.kind}`, destroyed: !!entry.destroyed })),
        ewarPlay: play,
        isBlueSaviourOn: () => field,
    });
    it("withAttackerEcm: a field that is on puts ECM no ECCM cancels on the line, keeps the ECCM counts, adds no second suite to a ticked bubble", () => {
        const ticks = { hostileEcmCount: 0, friendlyEccmCount: 2, friendlyAngelEccm: true, friendlyEccm: true };
        expect(withAttackerEcm(unit("a", true), ticks)).toEqual({ ...ticks, hostileEcmCount: 1, ecmNoEccm: true });
        expect(withAttackerEcm(unit("a", false), ticks)).toEqual(ticks);
        expect(withAttackerEcm(unit("a", true, [], { inHostileEcm: true }), ticks).hostileEcmCount).toBe(1);
    });
    it("a Blue Saviour unit keeps its Streak lock when friendly Angel ECCM cancels real Angel ECM, and keeps a Narc pod beside a cancelled bubble", () => {
        const attacker = unit("a", true, [{ kind: "artemis-iv", uuid: "w1", tag: "lrm-15-artemis-iv" }]);
        const streak = buildEWarAttack({ uuid: "w1", tag: "streak-srm-4" }, undefined, withAttackerEcm(attacker, { hostileAngelEcm: true, friendlyAngelEccm: true }), "total-warfare");
        expect(streak.launcher?.family).toBe("streak");
        expect(streak.hostileAngelEcm).toBe(false);
        expect(getEWarStreakLock(attacker, streak).blocked).toBe(false);
        const narc = buildEWarAttack({ uuid: "w1", tag: "lrm-15" }, { tag: "ammo-lrm-narc" }, withAttackerEcm(attacker, { narcPods: ["narc"], targetHostileEcm: true, hostileEcmCount: 1, friendlyEccmCount: 1 }), "total-warfare");
        expect(narc.targetInHostileEcm).toBe(false);
        expect(narc.hostileEcmOnLine).toBe(true);
        expect(narc.friendlyEccmOnLine).toBe(false);
    });
    it("a Slave is cut off when its Master has the field on, and not with the field off", () => {
        const network: IC3Network = { name: "A", type: "master-slave", members: [{ uuid: "m", role: "master" }, { uuid: "s", role: "slave" }] };
        const slave = unit("s", false, [{ kind: "c3-slave" }]);
        expect(getC3Status(slave, network, [unit("m", true, [{ kind: "c3-master" }]), slave]).linked).toBe(false);
        expect(getC3Status(slave, network, [unit("m", false, [{ kind: "c3-master" }]), slave]).linked).toBe(true);
    });
    it("an Emergency Master counts its turn with the field off and not with it on", () => {
        const lost = unit("m", false, [{ kind: "c3-master", destroyed: true }]);
        const slave = unit("s", false, [{ kind: "c3-slave" }]);
        const network: IC3Network = { name: "A", type: "master-slave", members: [{ uuid: "m", role: "master" }, { uuid: "e", role: "emergency" }, { uuid: "s", role: "slave" }] };
        const off = unit("e", false, [{ kind: "c3-emergency-master" }]);
        tickC3Emergency(off, [lost, off, slave], network);
        expect(off.ewarPlay.c3EmergencyTurns).toBe(1);
        const on = unit("e", true, [{ kind: "c3-emergency-master" }]);
        tickC3Emergency(on, [lost, on, slave], network);
        expect(on.ewarPlay.c3EmergencyTurns ?? 0).toBe(0);
    });
    it("the Blue Saviour note counts the engagements the edition AMS allows", () => {
        expect(getEWarNotes(unit("a", true)).join(" ")).toContain("meets 1 missile attack a turn");
        expect(getEWarNotes(unit("a", true, [], {}, "core-rulebook")).join(" ")).toContain("meets 2 missile attacks a turn");
    });
    it("the Personal ECM covers while any of its suites works, and personalEcmOf follows a hand override of inFriendlyEcm", () => {
        const carrier = unit("p", false, [{ kind: "ecm-personal", tag: "custom-personal-ecm", destroyed: true }, { kind: "ecm-personal", tag: "custom-personal-ecm" }]);
        expect(getPersonalEcmCover({ personalEcm: { p: ["m"] } }, [carrier, unit("m", false)]).get("m")).toEqual(["p"]);
        const held = unit("m", false, [], { overrides: ["inFriendlyEcm"] });
        applyEWarBoard({ personalEcm: { p: ["m"] } }, [carrier, held]);
        expect(held.ewarPlay.personalEcmOf).toBeUndefined();
    });
});
