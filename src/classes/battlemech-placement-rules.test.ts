import { describe, expect, it } from "vitest";
import { BattleMech } from "./battlemech";

// Placement rules for physical weapons (TM pp.220, 237; TO:AUE p.100), Actuator Enhancement Systems (TO:AUE p.91)
// and equipment spread over several locations (TO:AUE pp.108, 112, 137, 148, 161; TM pp.70, 249; IO:AE p.159).

const build = (type?: string, tech: string = "is", tons: number = 75) => {
    const mech = new BattleMech();
    mech.setTech(tech);
    mech.setEra("dark-ages");
    if (type) mech.setType(type);
    mech.setTonnage(tons);
    mech.setWalkSpeed(4);
    return mech;
};
const add = (mech: BattleMech, tag: string, tech: string = "is") =>
    mech.addEquipmentFromTag(tag, tech, "", false, undefined, "", false, [], undefined, undefined)!;
const KEY: Record<string, string> = {
    hd: "head", ct: "centerTorso", lt: "leftTorso", rt: "rightTorso", la: "leftArm", ra: "rightArm",
    ll: "leftLeg", rl: "rightLeg", cl: "centerLeg", fll: "frontLeftLeg", frl: "frontRightLeg",
};
/** Moves the first unplaced slot of an item (by uuid, or by tag for spread items) into the first free slot of a location. */
const place = (mech: BattleMech, match: { uuid?: string } | string, loc: string) => {
    const index = mech.unallocatedCriticals.findIndex(slot => typeof match === "string"
        ? slot?.tag === match
        : slot?.uuid === match.uuid);
    if (index < 0) throw new Error(`nothing unplaced for ${JSON.stringify(match)}`);
    const area: unknown[] = (mech.getCriticals() as any)[KEY[loc]];
    return mech.moveCritical("un", index, loc, area.findIndex(slot => !slot));
};
const unplaced = (mech: BattleMech, tag: string) => mech.unallocatedCriticals.filter(slot => slot?.tag === tag).length;
const violations = (mech: BattleMech) => mech.getChassisEquipmentViolations();

describe("physical weapon actuators (TM pp.220, 237; TO:AUE p.100)", () => {
    it("needs lower arm and hand actuators for a hatchet, sword, mace or vibroblade", () => {
        for (const tag of ["melee-hatchet", "melee-sword", "melee-mace", "melee-vibroblade-small"]) {
            const mech = build();
            const weapon = add(mech, tag);
            expect(place(mech, weapon, "la"), tag).toBe(true);
            expect(violations(mech), tag).toEqual([]);
            mech.removeHandActuator("la");
            expect(violations(mech).join(" "), tag).toMatch(/needs lower arm and hand actuators in the LA/);
        }
    });

    it("needs a lower arm actuator, but no hand, for a lance or a retractable blade", () => {
        for (const tag of ["melee-lance", "melee-retractable-blade"]) {
            const mech = build();
            const weapon = add(mech, tag);
            expect(place(mech, weapon, "ra"), tag).toBe(true);
            mech.removeHandActuator("ra");
            expect(violations(mech), tag).toEqual([]);
            mech.removeLowerArmActuator("ra");
            expect(violations(mech).join(" "), tag).toMatch(/needs a lower arm actuator in the RA/);
        }
    });

    it("has a Claw or a Flail replace the hand actuator", () => {
        for (const [tag, tech] of [["melee-claw", "is"], ["clan-melee-claw", "clan"], ["melee-flail", "is"]]) {
            const mech = build(undefined, tech);
            const weapon = add(mech, tag, tech);
            expect(place(mech, weapon, "la"), tag).toBe(true);
            expect(violations(mech).join(" "), tag).toMatch(/replaces the hand actuator: remove the LA hand actuator/);
            mech.removeHandActuator("la");
            expect(violations(mech), tag).toEqual([]);
            mech.removeLowerArmActuator("la");
            expect(violations(mech).join(" "), tag).toMatch(/needs a lower arm actuator in the LA/);
        }
    });

    it("mounts the TO:AUE melee weapons and shields only in the arms", () => {
        for (const tag of ["melee-chain-whip", "melee-flail", "melee-lance", "melee-mace", "melee-claw", "melee-vibroblade-large", "shield-small", "shield-large"]) {
            const mech = build();
            const weapon = add(mech, tag);
            expect(place(mech, weapon, "lt"), tag).toBe(false);
            expect(place(mech, weapon, "ra"), tag).toBe(true);
        }
    });

    it("allows one physical weapon to a location, plus one shield and one spike cluster", () => {
        const mech = build(undefined, "is", 50);
        const hatchet = add(mech, "melee-hatchet");
        const mace = add(mech, "melee-mace");
        const shield = add(mech, "shield-small");
        const secondShield = add(mech, "shield-small");
        const spikes = add(mech, "spikes");
        const secondSpikes = add(mech, "spikes");
        expect(place(mech, hatchet, "la")).toBe(true);
        expect(place(mech, mace, "la")).toBe(false);
        expect(place(mech, shield, "la")).toBe(true);
        expect(place(mech, secondShield, "la")).toBe(false);
        expect(place(mech, spikes, "la")).toBe(true);
        expect(place(mech, secondSpikes, "la")).toBe(false);
        expect(place(mech, mace, "ra")).toBe(true);
        expect(place(mech, secondSpikes, "ct")).toBe(true);
        expect(violations(mech)).toEqual([]);
    });
});

describe("Actuator Enhancement Systems (TO:AUE p.91)", () => {
    // AES takes one slot per weight class, so only a light or medium 'Mech has room in a leg.
    it("puts arm AES in an arm and leg AES in a leg, one to a limb", () => {
        const mech = build(undefined, "is", 50);
        const arm = add(mech, "aes-arm");
        const second = add(mech, "aes-arm");
        expect(place(mech, arm, "lt")).toBe(false);
        expect(place(mech, arm, "la")).toBe(true);
        expect(place(mech, second, "la")).toBe(false);
        expect(place(mech, second, "ra")).toBe(true);
        const leg = add(mech, "aes-leg");
        expect(place(mech, leg, "ra")).toBe(false);
        expect(place(mech, leg, "ll")).toBe(true);
    });

    it("needs leg AES in every leg", () => {
        const mech = build(undefined, "is", 50);
        const left = add(mech, "aes-leg");
        expect(place(mech, left, "ll")).toBe(true);
        expect(violations(mech).join(" ")).toMatch(/Leg Actuator Enhancement Systems must be mounted in every leg \(1 of 2\)/);
        const right = add(mech, "aes-leg");
        expect(place(mech, right, "rl")).toBe(true);
        expect(violations(mech)).toEqual([]);
    });
});

describe("spread equipment placement", () => {
    it("puts a Null-Signature System slot in every location but the head, one to a location (TO:AUE p.148)", () => {
        const mech = build();
        add(mech, "null-signature-system");
        expect(place(mech, "null-signature-system", "hd")).toBe(false);
        expect(place(mech, "null-signature-system", "lt")).toBe(true);
        expect(place(mech, "null-signature-system", "lt")).toBe(false);
        for (const loc of ["ct", "rt", "la", "ra", "ll", "rl"]) expect(place(mech, "null-signature-system", loc), loc).toBe(true);
        expect(unplaced(mech, "null-signature-system")).toBe(0);
        expect(violations(mech).filter(v => v.includes("Null Signature"))).toEqual([]);
    });

    it("keeps the Chameleon shield out of the head and center torso (TO:AUE p.112)", () => {
        const mech = build();
        add(mech, "chameleon-lps");
        expect(place(mech, "chameleon-lps", "ct")).toBe(false);
        expect(place(mech, "chameleon-lps", "hd")).toBe(false);
        expect(place(mech, "chameleon-lps", "la")).toBe(true);
    });

    it("splits a partial wing between the side torsos (TO:AUE p.137)", () => {
        const mech = build();
        add(mech, "partial-wing");
        expect(place(mech, "partial-wing", "ct")).toBe(false);
        for (let slot = 0; slot < 4; slot++) expect(place(mech, "partial-wing", "lt")).toBe(true);
        expect(place(mech, "partial-wing", "lt")).toBe(false);
        expect(place(mech, "partial-wing", "rt")).toBe(true);
    });

    it("puts tracks one slot to a leg (TM p.249) and talons two (TO:AUE p.100)", () => {
        const mech = build();
        add(mech, "tracks");
        expect(place(mech, "tracks", "la")).toBe(false);
        expect(place(mech, "tracks", "ll")).toBe(true);
        expect(place(mech, "tracks", "ll")).toBe(false);
        expect(place(mech, "tracks", "rl")).toBe(true);
        const clan = build(undefined, "clan");
        add(clan, "clan-talons", "clan");
        expect(place(clan, "clan-talons", "ll")).toBe(true);
        expect(place(clan, "clan-talons", "ll")).toBe(true);
        expect(place(clan, "clan-talons", "ll")).toBe(false);
        expect(place(clan, "clan-talons", "rl")).toBe(true);
    });

    it("adds the third leg's share on a Tripod (IO:AE p.159)", () => {
        const tripod = build("tripod");
        add(tripod, "tracks");
        add(tripod, "null-signature-system");
        add(tripod, "chameleon-lps");
        expect(unplaced(tripod, "tracks")).toBe(3);
        expect(unplaced(tripod, "null-signature-system")).toBe(8);
        expect(unplaced(tripod, "chameleon-lps")).toBe(7);
        expect(place(tripod, "tracks", "cl")).toBe(true);
        expect(place(tripod, "tracks", "cl")).toBe(false);
    });

    it("flags a loaded design whose spread slots break the rules", () => {
        const mech = build();
        add(mech, "tracks");
        expect(place(mech, "tracks", "ll")).toBe(true);
        expect(place(mech, "tracks", "rl")).toBe(true);
        const saved = JSON.parse(mech.exportJSON());
        for (const slot of saved.allocation) if (slot.tag === "tracks") slot.loc = "lt";
        const copy = new BattleMech();
        copy.importJSON(JSON.stringify(saved));
        expect(violations(copy).join(" ")).toMatch(/Tracks: only in LL, RL/);
    });
});

describe("systems that exclude or need each other (TO:AUE pp.91, 112, 148, 161; TM p.213)", () => {
    it("keeps AES away from MASC, Triple-Strength Myomer and targeting computers", () => {
        const masc = build(undefined, "is", 50);
        add(masc, "aes-arm");
        expect(violations(masc)).toEqual([]);
        add(masc, "masc");
        expect(violations(masc).join(" ")).toMatch(/Actuator Enhancement System \(Arm\) cannot be combined with MASC \(TO:AUE p\.91\)/);
        const computer = build(undefined, "is", 50);
        add(computer, "aes-arm");
        add(computer, "targeting-computer");
        expect(violations(computer).join(" ")).toMatch(/cannot be combined with Targeting Computer/);
        const tsm = build(undefined, "is", 50);
        tsm.setMyomerType("tsm");
        add(tsm, "aes-arm");
        expect(violations(tsm).join(" ")).toMatch(/cannot be combined with Triple.Strength Myomer/);
    });

    it("keeps the Null-Signature System away from C3, targeting computers and the Void-Signature System", () => {
        const mech = build();
        add(mech, "null-signature-system");
        add(mech, "c3-computer-slave");
        expect(violations(mech)).toContain("Null Signature System cannot be combined with C3 Computer (Slave) (TO:AUE p.148).");
        add(mech, "void-signature-system");
        expect(violations(mech).join(" ")).toMatch(/Void Signature System cannot be combined with .*Null Signature System/);
    });

    // Maximum Tech p.58: one targeting and tracking system to a 'Mech, and a targeting or C3 computer counts as one.
    it("flags two targeting systems, or one with a targeting computer (Max Tech p.58)", () => {
        const mech = build();
        add(mech, "targeting-long-range");
        expect(violations(mech)).toEqual([]);
        add(mech, "targeting-anti-aircraft");
        expect(violations(mech).join(" ")).toMatch(/Anti-Aircraft Targeting \/ Long-Range Targeting: 2 mounted; at most 1 allowed/);
        const computer = build(undefined, "is", 50);
        add(computer, "targeting-multi-trac");
        add(computer, "targeting-computer");
        add(computer, "c3-computer-slave");
        expect(violations(computer)).toContain("Multi-Trac Targeting cannot be combined with Targeting Computer, C3 Computer (Slave) (Maximum Tech p.58).");
    });

    it("has the Void-Signature System and Stealth Armor need an ECM suite", () => {
        const mech = build();
        add(mech, "void-signature-system");
        expect(violations(mech).join(" ")).toMatch(/Void Signature System needs an ECM suite \(TO:AUE p\.161\)/);
        add(mech, "ecm-suite");
        expect(violations(mech).join(" ")).not.toMatch(/needs an ECM suite/);
        const stealth = build();
        stealth.setArmorType("stealth-basic");
        expect(violations(stealth).join(" ")).toMatch(/Stealth Armor needs an ECM suite \(TM p\.213\)/);
        add(stealth, "ecm-suite");
        expect(violations(stealth).join(" ")).not.toMatch(/needs an ECM suite/);
        add(stealth, "chameleon-lps");
        expect(violations(stealth).join(" ")).toMatch(/Chameleon Light Polarization Shield cannot be combined with Stealth Armor \(TO:AUE p\.112\)/);
    });
});
