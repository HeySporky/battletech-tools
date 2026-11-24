import { describe, expect, it } from "vitest";
import {
    IASC3Network, IASEWarBoard, IASEWarPlayState, IASEWarUnit, applyASEWarEndRound, applyASTsempHit, fireASChaffPod, fireASTsemp, getASEWarStatus, getASTsempEffect, syncASChaffClouds, validateASC3Network, getASDefenseLines, getASEWarToHit, getASIncomingDamage, getASEWarRule, getASEWarSpecials, getASEcmFields, getASFriendlyCover, getASMhqRating, resolveASEcm, resolveASStun,
} from "./alpha-strike-ewar-play";
import { IAlphaStrikeEdition, asRulesEditions } from "../data/rules-editions";

const ASCE = "alpha-strike-commanders-edition";
const BOOK_2013 = "alpha-strike";

let counter = 0;
export function makeUnit(abilities: string[], extra: Partial<IASEWarUnit> & { wrecked?: boolean } = {}, play: IASEWarPlayState = {}): IASEWarUnit {
    const { wrecked, ...rest } = extra;
    return {
        uuid: `u${++counter}`, abilities, type: "BM", isInfantry: false, isAerospace: false, rulesLevel: 4,
        ewarPlay: play, isWrecked: () => !!wrecked, ...rest,
    };
}

describe("getASEWarSpecials", () => {
    const codes = (abilities: string[]) => getASEWarSpecials(abilities).map((entry) => `${entry.code}:${entry.count}`);
    it("matches codes exactly, once each", () => {
        expect(codes(["ECM", "AECM", "LECM"])).toEqual(["ECM:1", "AECM:1", "LECM:1"]);
        expect(codes(["ECM", "ECM"])).toEqual(["ECM:1"]);
    });
    it("reads the number with or without a space", () => {
        expect(codes(["C3M 2"])).toEqual(["C3M:2"]);
        expect(codes(["C3BSM2"])).toEqual(["C3BSM:2"]);
        expect(codes(["RSD 1"])).toEqual(["RSD:1"]);
        expect(codes(["TSEMP-O 1"])).toEqual(["TSEMP:1"]);
        expect(getASEWarSpecials(["TSEMP-O 1"])[0].oneShot).toBe(true);
        expect(getASEWarSpecials(["TSEMP2"])[0].oneShot).toBeUndefined();
    });
    it("marks the AMS inside a turret", () => {
        expect(getASEWarSpecials(["TUR(2/2/1", "AMS)"])[0]).toMatchObject({ code: "AMS", turret: true });
        expect(getASEWarSpecials(["AMS"])[0]).toMatchObject({ code: "AMS", turret: false });
        expect(getASEWarSpecials(["TUR(2/2/1", "AMS)", "AMS"]).length).toBe(1);
    });
    it("ignores non-E-War specials and reads MHQ separately", () => {
        expect(codes(["IF2", "MHQ7"])).toEqual([]);
        expect(getASMhqRating(["IF2", "MHQ7"])).toBe(7);
        expect(getASMhqRating(["ECM"])).toBe(0);
    });
    it("keeps CHF (the inferred canon Chaff Pod) at every level, and drops our other codes below Custom Homebrew", () => {
        for (const level of [undefined, 0, 4, 5, 6, 7]) expect(getASEWarSpecials(["CHF2"], level), `level ${level}`).toMatchObject([{ code: "CHF", count: 2 }]);
        for (const level of [undefined, 4, 5]) expect(getASEWarSpecials(["SMKT"], level)).toEqual([]);
        expect(makeUnit(["CHF2"]).abilities).toEqual(["CHF2"]);
    });
});

describe("getASEWarRule", () => {
    it("gets the Companion's RAMS in the 2013 edition and ECM in the Commander's Edition", () => {
        expect(getASEWarRule("RAMS", BOOK_2013)).toMatchObject({ apocryphal: false, rule: { book: "ASC", page: 39 } });
        expect(getASEWarRule("ECM", ASCE)).toMatchObject({ apocryphal: false, rule: { book: "ASCE", page: 77 } });
    });
    it("carries an earlier edition's special forward as apocryphal and never backward", () => {
        const editions: IAlphaStrikeEdition[] = [
            asRulesEditions[0],
            { ...asRulesEditions[1], tag: "later", name: "Later", year: 2030, book: "X", ewarRules: { specials: { AMS: { book: "X", page: 1 } } } },
        ];
        expect(getASEWarRule("ECM", "later", editions)).toMatchObject({ apocryphal: true, rule: { book: "AS", page: 46 } });
        expect(getASEWarRule("AMS", "later", editions)).toMatchObject({ apocryphal: false });
        expect(getASEWarRule("AMS", BOOK_2013, editions)).toMatchObject({ apocryphal: false, rule: { book: "AS" } });
        expect(getASEWarRule("RAMS", BOOK_2013, editions)).toMatchObject({ rule: { book: "ASC" } });
        expect(getASEWarRule("NOVA", "alpha-strike", [{ ...asRulesEditions[0], tag: "alpha-strike", name: "Old", year: 2013, book: "AS", ewarRules: { specials: {} } }, editions[1]])).toBeUndefined();
        expect(getASEWarRule("ECM", "unknown-edition", editions)).toBeUndefined();
    });
});

describe("getASEcmFields", () => {
    it("counts each carrier's suites and radius", () => {
        expect(getASEcmFields(makeUnit(["ECM"]), ASCE)).toEqual({ ecm: 1, eccm: 0, inches: 12 });
        expect(getASEcmFields(makeUnit(["AECM"]), ASCE)).toEqual({ ecm: 2, eccm: 0, inches: 12 });
        expect(getASEcmFields(makeUnit(["AECM"], {}, { angelModes: ["ecm", "eccm"] }), ASCE)).toEqual({ ecm: 1, eccm: 1, inches: 12 });
        expect(getASEcmFields(makeUnit(["LECM"]), ASCE)).toEqual({ ecm: 1, eccm: 0, inches: 2 });
        expect(getASEcmFields(makeUnit(["WAT", "ECM", "LPRB"]), ASCE).ecm).toBe(1);
        expect(getASEcmFields(makeUnit(["ECM"], {}, { ecmMode: "eccm" }), ASCE)).toEqual({ ecm: 0, eccm: 1, inches: 12 });
    });
    it("projects nothing when wrecked or jammed by a DJ", () => {
        expect(getASEcmFields(makeUnit(["ECM"], { wrecked: true }), ASCE)).toEqual({ ecm: 0, eccm: 0, inches: 0 });
        expect(getASEcmFields(makeUnit(["ECM"], {}, { jammed: [{ kind: "DJ", turnsLeft: 3 }] }), ASCE)).toEqual({ ecm: 0, eccm: 0, inches: 0 });
        expect(getASEcmFields(makeUnit(["ECM"], {}, { jammed: [{ kind: "HJ", turnsLeft: 3 }] }), ASCE).ecm).toBe(1);
    });
    it("lets STL jam a non-infantry unit's own ECM in the Commander's Edition only", () => {
        expect(getASEcmFields(makeUnit(["ECM", "STL"]), ASCE)).toEqual({ ecm: 0, eccm: 0, inches: 0 });
        expect(getASEcmFields(makeUnit(["AECM", "STL"], {}, { angelModes: ["eccm", "eccm"] }), ASCE)).toEqual({ ecm: 0, eccm: 1, inches: 12 });
        expect(getASEcmFields(makeUnit(["ECM", "STL"]), BOOK_2013)).toEqual({ ecm: 1, eccm: 0, inches: 12 });
        expect(getASEcmFields(makeUnit(["ECM", "STL"], {}, { stealthOff: true }), ASCE).ecm).toBe(1);
        expect(getASEcmFields(makeUnit(["ECM", "STL"], {}, { stealthOff: true }), BOOK_2013).ecm).toBe(1);
        expect(getASEcmFields(makeUnit(["ECM", "STL"], { type: "BA", isInfantry: true }), ASCE).ecm).toBe(1);
    });
    it("adds one field for an MHQ of 7 or more", () => {
        expect(getASEcmFields(makeUnit(["MHQ7"], {}, { mhqField: "ecm" }), ASCE)).toEqual({ ecm: 1, eccm: 0, inches: 12 });
        expect(getASEcmFields(makeUnit(["MHQ6"], {}, { mhqField: "ecm" }), ASCE)).toEqual({ ecm: 0, eccm: 0, inches: 0 });
        expect(getASEcmFields(makeUnit(["MHQ7"], {}, {}), ASCE).ecm).toBe(0);
    });
});

describe("getASFriendlyCover", () => {
    it("covers the carrier and the mates the board names, skips removed units, adds carriers up", () => {
        const a = makeUnit(["ECM"]);
        const b = makeUnit([]);
        const c = makeUnit(["ECM"]);
        const board = { friendlyEcm: { [a.uuid]: [b.uuid, "gone"], [c.uuid]: [b.uuid] } };
        const cover = getASFriendlyCover(board, [a, b, c], ASCE);
        expect(cover.get(a.uuid)).toEqual({ ecm: 1, eccm: 0 });
        expect(cover.get(b.uuid)).toEqual({ ecm: 2, eccm: 0 });
        expect(cover.has("gone")).toBe(false);
    });
    it("a wrecked carrier covers nobody", () => {
        const a = makeUnit(["ECM"], { wrecked: true });
        const b = makeUnit([]);
        expect(getASFriendlyCover({ friendlyEcm: { [a.uuid]: [b.uuid] } }, [a, b], ASCE).size).toBe(0);
    });
});

describe("resolveASEcm", () => {
    it("sets hostile ECM against friendly ECCM: higher wins, a tie cancels both", () => {
        const unit = (hostile: number) => makeUnit([], {}, { hostileEcm: hostile });
        expect(resolveASEcm(unit(1), { ecm: 0, eccm: 1 }, ASCE).inHostileEcm).toBe(false);
        expect(resolveASEcm(unit(2), { ecm: 0, eccm: 1 }, ASCE).inHostileEcm).toBe(true);
        expect(resolveASEcm(unit(1), undefined, ASCE).inHostileEcm).toBe(true);
        expect(resolveASEcm(unit(0), undefined, ASCE).inHostileEcm).toBe(false);
    });
    it("keeps the hostile Angel and NOVA effects only when the hostile side wins", () => {
        const angel = makeUnit([], {}, { hostileEcm: 2, hostileAngel: true, hostileNova: true });
        const result = resolveASEcm(angel, undefined, ASCE);
        expect(result.hostileAngel).toBe(true);
        expect(result.hostileNova).toBe(true);
        expect(resolveASEcm(angel, { ecm: 0, eccm: 2 }, ASCE).hostileAngel).toBe(false);
    });
    it("protects from Narc inside friendly ECM unless hostile ECCM matches it", () => {
        const unit = makeUnit([], {}, { hostileEccm: 0 });
        expect(resolveASEcm(unit, { ecm: 1, eccm: 0 }, ASCE).inFriendlyEcm).toBe(true);
        expect(resolveASEcm(makeUnit([], {}, { hostileEccm: 1 }), { ecm: 1, eccm: 0 }, ASCE).inFriendlyEcm).toBe(false);
        expect(resolveASEcm(unit, undefined, ASCE).inFriendlyEcm).toBe(false);
    });
    it("makes an STL unit inside hostile ECM for its own gear in the Commander's Edition, not a battle armor", () => {
        const stealth = makeUnit(["STL"]);
        const result = resolveASEcm(stealth, { ecm: 0, eccm: 3 }, ASCE);
        expect(result.selfJammed).toBe(true);
        expect(result.inHostileEcm).toBe(true);
        expect(result.lines.join(" ")).toContain("ASCE p.79");
        expect(resolveASEcm(makeUnit(["STL"], { type: "BA", isInfantry: true }), undefined, ASCE).selfJammed).toBe(false);
        expect(resolveASEcm(stealth, undefined, BOOK_2013).selfJammed).toBe(false);
    });
    it("names the book and page in each line", () => {
        const result = resolveASEcm(makeUnit([], {}, { hostileEcm: 1 }), undefined, ASCE);
        expect(result.lines[0]).toMatch(/ASCE p\.77/);
        expect(resolveASEcm(makeUnit([], {}, { hostileEcm: 1 }), undefined, BOOK_2013).lines[0]).toMatch(/AS p\.46/);
    });
});

describe("getASEWarToHit", () => {
    const status = { hj: false, nc3Up: false };
    const bracket = (unit: IASEWarUnit, edition = ASCE, missile = false, st = status) => {
        const result = getASEWarToHit(unit, st, edition, missile);
        return [result.short, result.medium, result.long, result.extreme];
    };
    it("adds the target's stealth numbers (STL, battle armor, conventional infantry)", () => {
        expect(bracket(makeUnit([], {}, { target: { stealth: "unit" } }))).toEqual([0, 1, 2, 2]);
        expect(bracket(makeUnit([], {}, { target: { stealth: "battle-armor" } }))).toEqual([1, 1, 2, 2]);
        const infantry = makeUnit([], {}, { target: { stealth: "infantry" } });
        expect(bracket(infantry)).toEqual([0, 0, 0, 0]);
        expect(getASEWarToHit(infantry, status, ASCE, false).labels.join(" ")).toContain("no printed modifier");
    });
    it("plays the 2013 book's STL numbers the same", () => {
        expect(bracket(makeUnit([], {}, { target: { stealth: "unit" } }), BOOK_2013)).toEqual([0, 1, 2, 2]);
        expect(getASEWarToHit(makeUnit([], {}, { target: { stealth: "unit" } }), status, BOOK_2013, false).labels[0]).toContain("AS p.48");
    });
    it("adds MAS +3 and LMAS +2 on every bracket", () => {
        expect(bracket(makeUnit([], {}, { target: { mimetic: 3 } }))).toEqual([3, 3, 3, 3]);
        expect(bracket(makeUnit([], {}, { target: { mimetic: 2 } }))).toEqual([2, 2, 2, 2]);
    });
    it("adds HJ +1 only to missile attacks and NC3 -1 only to aerospace units", () => {
        expect(bracket(makeUnit([]), ASCE, true, { hj: true, nc3Up: false })).toEqual([1, 1, 1, 1]);
        expect(bracket(makeUnit([]), ASCE, false, { hj: true, nc3Up: false })).toEqual([0, 0, 0, 0]);
        expect(bracket(makeUnit([], { isAerospace: true }), ASCE, false, { hj: false, nc3Up: true })).toEqual([-1, -1, -1, -1]);
        expect(bracket(makeUnit([]), ASCE, false, { hj: false, nc3Up: true })).toEqual([0, 0, 0, 0]);
    });
    it("shows nothing for a unit with no ticks", () => {
        expect(getASEWarToHit(makeUnit([]), status, ASCE, true).labels).toEqual([]);
    });
});

describe("getASIncomingDamage", () => {
    const hit = (front = true, ramsFrom?: IASEWarUnit) => ({ missile: true, front, ramsFrom });
    it("takes 1 off for an AMS in the front arc, never below 1", () => {
        expect(getASIncomingDamage(makeUnit(["AMS"]), 3, hit(), false, ASCE).damage).toBe(2);
        expect(getASIncomingDamage(makeUnit(["AMS"]), 1, hit(), false, ASCE).damage).toBe(1);
    });
    it("does not defend the rear unless the AMS is in a turret", () => {
        expect(getASIncomingDamage(makeUnit(["AMS"]), 3, hit(false), false, ASCE).damage).toBe(3);
        expect(getASIncomingDamage(makeUnit(["TUR(2/2/1", "AMS)"]), 3, hit(false), false, ASCE).damage).toBe(2);
    });
    it("adds the Narc +1 first, unless inside friendly ECM", () => {
        const narced = () => makeUnit([], {}, { narcs: ["SNARC"] });
        expect(getASIncomingDamage(narced(), 3, hit(), false, ASCE).damage).toBe(4);
        expect(getASIncomingDamage(narced(), 3, hit(), true, ASCE).damage).toBe(3);
        const both = makeUnit(["AMS"], {}, { narcs: ["INARC"] });
        expect(getASIncomingDamage(both, 1, hit(), false, ASCE).damage).toBe(1);
        expect(getASIncomingDamage(both, 3, hit(), false, ASCE).damage).toBe(3);
    });
    it("leaves a non-missile hit unchanged", () => {
        const unit = makeUnit(["AMS"], {}, { narcs: ["INARC"] });
        expect(getASIncomingDamage(unit, 3, { missile: false, front: true }, false, ASCE)).toEqual({ damage: 3, lines: [] });
    });
    it("lets RAMS defend its own unit once, or a friend, not both in a turn", () => {
        const ram = makeUnit(["RAMS"]);
        const own = getASIncomingDamage(ram, 3, hit(), false, ASCE);
        expect(own.damage).toBe(2);
        expect(own.spendsRams).toBe("self");
        const friend = makeUnit([]);
        const helped = getASIncomingDamage(friend, 3, hit(true, ram), false, ASCE);
        expect(helped.damage).toBe(2);
        expect(helped.spendsRams).toBe("friend");
        ram.ewarPlay.ramsUse = "self";
        expect(getASIncomingDamage(friend, 3, hit(true, ram), false, ASCE).damage).toBe(3);
        const busy = makeUnit(["RAMS"], {}, { ramsUse: "friend" });
        expect(getASIncomingDamage(busy, 3, hit(), false, ASCE).damage).toBe(3);
    });
    it("plays the Companion's RAMS in the 2013 edition", () => {
        expect(getASIncomingDamage(makeUnit(["RAMS"]), 3, hit(), false, BOOK_2013).damage).toBe(2);
    });
});

describe("getASDefenseLines", () => {
    it("shows nothing for a unit with no specials", () => {
        expect(getASDefenseLines(makeUnit(["IF2"]), ASCE)).toEqual([]);
    });
    it("shows STL by unit kind, and none when it is off", () => {
        expect(getASDefenseLines(makeUnit(["STL"]), ASCE)[0]).toContain("+1 Medium, +2 Long/Extreme");
        expect(getASDefenseLines(makeUnit(["STL"], { type: "BA", isInfantry: true }), ASCE)[0]).toContain("+1 Short and Medium");
        expect(getASDefenseLines(makeUnit(["STL"], { type: "CI", isInfantry: true }), ASCE)[0]).toContain("no printed modifier");
        expect(getASDefenseLines(makeUnit(["STL"], {}, { stealthOff: true }), ASCE)).toEqual([]);
        expect(getASDefenseLines(makeUnit(["STL"], {}, { stealthOff: true }), BOOK_2013)[0]).toContain("AS p.48");
        expect(getASDefenseLines(makeUnit(["STL"], {}, { jammed: [{ kind: "DJ", turnsLeft: 2 }] }), ASCE)).toEqual([]);
    });
    it("shows MAS and LMAS only while the unit stood still", () => {
        expect(getASDefenseLines(makeUnit(["MAS"]), ASCE)).toEqual([]);
        expect(getASDefenseLines(makeUnit(["MAS"], {}, { stoodStill: true }), ASCE)[0]).toContain("+3");
        expect(getASDefenseLines(makeUnit(["LMAS"], {}, { stoodStill: true }), ASCE)[0]).toContain("+2");
    });
    it("shows AMS arcs, RAMS and Narc beacons", () => {
        expect(getASDefenseLines(makeUnit(["AMS"]), ASCE)[0]).toContain("front arc only");
        expect(getASDefenseLines(makeUnit(["TUR(1/1/1", "AMS)"]), ASCE)[0]).toContain("turret");
        expect(getASDefenseLines(makeUnit(["RAMS"]), ASCE)[0]).toContain("RAMS");
        expect(getASDefenseLines(makeUnit([], {}, { narcs: ["CNARC"] }), ASCE)[0]).toContain("Narc beacon");
    });
});

describe("getASEWarStatus: probes", () => {
    const status = (unit: IASEWarUnit, units: IASEWarUnit[] = [unit], board: IASEWarBoard = {}, edition = ASCE) => getASEWarStatus(unit, board, units, edition);
    it("gives each probe its range", () => {
        expect(status(makeUnit(["PRB"])).probe).toEqual({ code: "PRB", inches: 18, overwhelmed: false });
        expect(status(makeUnit(["LPRB"])).probe).toEqual({ code: "LPRB", inches: 12, overwhelmed: false });
        expect(status(makeUnit(["BH"])).probe).toEqual({ code: "BH", inches: 26, overwhelmed: false });
        expect(status(makeUnit(["PRB"]), undefined, undefined, BOOK_2013).probe?.inches).toBe(18);
    });
    it("overwhelms a PRB in hostile ECM, and a BH only under a hostile Angel", () => {
        expect(status(makeUnit(["PRB"], {}, { hostileEcm: 1 })).probe?.overwhelmed).toBe(true);
        expect(status(makeUnit(["BH"], {}, { hostileEcm: 1 })).probe?.overwhelmed).toBe(false);
        expect(status(makeUnit(["BH"], {}, { hostileEcm: 2, hostileAngel: true })).probe?.overwhelmed).toBe(true);
    });
    it("shows nothing for a unit with no E-War specials", () => {
        const result = status(makeUnit(["IF2"]));
        expect(result.lines).toEqual([]);
        expect(result).toMatchObject({ hj: false, dj: false, nc3Up: false, inFriendlyEcm: false });
    });
    it("counts remote sensors and TAG reminders; the Homing Jammer stops TAG", () => {
        expect(status(makeUnit(["C3RS"], {}, { c3rsUsed: 1 })).lines.join(" ")).toContain("3 of 4 sensors left this scenario");
        // An RSD dispenses per turn: a used one is back after End Round, and a C3RS count never touches it.
        const dispenser = makeUnit(["RSD 2"], {}, { rsdUsed: 1, c3rsUsed: 3 });
        expect(status(dispenser).lines.join(" ")).toContain("1 remote sensors left to dispense this turn");
        applyASEWarEndRound([dispenser], {}, ASCE);
        expect(status(dispenser).lines.join(" ")).toContain("2 remote sensors left to dispense this turn");
        expect(status(makeUnit(["TAG"])).lines.join(" ")).toContain("Short and Medium");
        expect(status(makeUnit(["LTAG"])).lines.join(" ")).toContain("Short range");
        expect(status(makeUnit(["TAG"], {}, { jammed: [{ kind: "HJ", turnsLeft: 2 }] })).lines.join(" ")).toContain("Homing Jammer stops it");
    });
});

describe("getASEWarStatus: C3 networks", () => {
    const net = (kind: IASC3Network["kind"], members: IASEWarUnit[], master?: IASEWarUnit): IASEWarBoard => ({
        c3Networks: [{ name: "N", kind, members: members.map((each) => each.uuid), master: master?.uuid }],
    });
    const up = (unit: IASEWarUnit, units: IASEWarUnit[], board: IASEWarBoard) => getASEWarStatus(unit, board, units, ASCE).c3?.up;
    const lance = (masterPlay: IASEWarPlayState = {}, slavePlay: IASEWarPlayState = {}) => {
        const master = makeUnit(["C3M"], {}, masterPlay);
        const slaves = [makeUnit(["C3S"], {}, slavePlay), makeUnit(["C3S"]), makeUnit(["C3S"])];
        return { master, slaves, units: [master, ...slaves], board: net("c3", [master, ...slaves], master) };
    };
    it("keeps a C3 network up when nothing is jammed", () => {
        const { units, board } = lance();
        for (const unit of units) expect(up(unit, units, board)).toBe(true);
    });
    it("takes the whole network down when the master is in hostile ECM", () => {
        const { units, board } = lance({ hostileEcm: 1 });
        for (const unit of units) expect(up(unit, units, board), unit.abilities.join()).toBe(false);
    });
    it("cuts only the slave whose line is blocked, or that sits in hostile ECM", () => {
        const { slaves, units, board } = lance({}, { c3LineBlocked: true });
        expect(up(slaves[0], units, board)).toBe(false);
        expect(up(slaves[1], units, board)).toBe(true);
        expect(up(units[0], units, board)).toBe(true);
    });
    it("takes the network down when the master is wrecked", () => {
        const master = makeUnit(["C3M"], { wrecked: true });
        const slave = makeUnit(["C3S"]);
        expect(up(slave, [master, slave], net("c3", [master, slave], master))).toBe(false);
    });
    it("cuts a C3i member in hostile ECM only", () => {
        const a = makeUnit(["C3I"], {}, { hostileEcm: 1 });
        const b = makeUnit(["C3I"]);
        const board = net("c3i", [a, b]);
        expect(up(a, [a, b], board)).toBe(false);
        expect(up(b, [a, b], board)).toBe(true);
    });
    it("lets a boosted network ignore plain ECM but not a hostile Angel", () => {
        const master = makeUnit(["C3BSM"], {}, { hostileEcm: 1 });
        const slave = makeUnit(["C3BSS"], {}, { hostileEcm: 1 });
        expect(up(slave, [master, slave], net("c3-boosted", [master, slave], master))).toBe(true);
        slave.ewarPlay = { hostileEcm: 2, hostileAngel: true };
        expect(up(slave, [master, slave], net("c3-boosted", [master, slave], master))).toBe(false);
    });
    it("cuts a NOVA only under a hostile NOVA, and a naval network only under an enemy JAM", () => {
        const nova = makeUnit(["NOVA", "ECM"], {}, { hostileEcm: 1 });
        const mate = makeUnit(["NOVA", "ECM"]);
        expect(up(nova, [nova, mate], net("nova", [nova, mate]))).toBe(true);
        nova.ewarPlay = { hostileEcm: 1, hostileNova: true };
        expect(up(nova, [nova, mate], net("nova", [nova, mate]))).toBe(false);
        const ship = makeUnit(["NC3"], { isAerospace: true });
        const sister = makeUnit(["NC3"]);
        const board = net("naval", [ship, sister]);
        expect(getASEWarStatus(ship, board, [ship, sister], ASCE).nc3Up).toBe(true);
        board.c3Networks![0].enemyJam = true;
        expect(getASEWarStatus(ship, board, [ship, sister], ASCE)).toMatchObject({ nc3Up: false, c3: { up: false } });
    });
    it("lets a Homing Jammer cut every kind, and a burnt unit stays cut", () => {
        const a = makeUnit(["C3I"], {}, { jammed: [{ kind: "HJ", turnsLeft: 3 }] });
        const b = makeUnit(["C3I"], {}, { c3Burnt: true });
        const board = net("c3i", [a, b]);
        expect(up(a, [a, b], board)).toBe(false);
        expect(up(b, [a, b], board)).toBe(false);
        expect(getASEWarStatus(a, board, [a, b], ASCE).hj).toBe(true);
    });
    it("cuts the C3 of a unit whose own STL jams it, in the Commander's Edition only", () => {
        const a = makeUnit(["C3I", "STL"]);
        const b = makeUnit(["C3I"]);
        const board = net("c3i", [a, b]);
        expect(up(a, [a, b], board)).toBe(false);
        expect(getASEWarStatus(a, board, [a, b], BOOK_2013).c3?.up).toBe(true);
    });
    it("skips a board naming a unit that left the force", () => {
        const a = makeUnit(["C3I"]);
        const board = { c3Networks: [{ name: "N", kind: "c3i" as const, members: [a.uuid, "gone"] }], droneControl: { gone: "gone" }, friendlyEcm: { gone: [a.uuid] } };
        expect(() => getASEWarStatus(a, board, [a], ASCE)).not.toThrow();
        expect(up(a, [a], board)).toBe(true);
    });
});

describe("getASEWarStatus: drones", () => {
    it("shuts a drone down in the End Phase, and restarts it in the End Phase after the cause ends (#648 M6)", () => {
        const controller = makeUnit(["DRO"]);
        const drone = makeUnit(["DRO"]);
        const board = { droneControl: { [drone.uuid]: controller.uuid } };
        const units = [controller, drone];
        const down = () => getASEWarStatus(drone, board, units, ASCE).droneShutDown;
        expect(down()).toBe(false);
        controller.ewarPlay.hostileEcm = 1;
        expect(down()).toBe(false); // still running until the End Phase
        applyASEWarEndRound(units, board, ASCE);
        expect(down()).toBe(true);
        controller.ewarPlay.hostileEcm = 0;
        expect(down()).toBe(true); // restarts in the End Phase
        applyASEWarEndRound(units, board, ASCE);
        expect(down()).toBe(false);
    });
    it("shuts a drone down when the line from its controller crosses an ECM bubble, and for good when the controller is eliminated", () => {
        const controller = makeUnit(["DRO"]);
        const drone = makeUnit(["DRO"], {}, { droneLineBlocked: true });
        const board = { droneControl: { [drone.uuid]: controller.uuid } };
        applyASEWarEndRound([controller, drone], board, ASCE);
        expect(getASEWarStatus(drone, board, [controller, drone], ASCE).droneShutDown).toBe(true);
        delete drone.ewarPlay.droneLineBlocked;
        applyASEWarEndRound([controller, drone], board, ASCE);
        expect(getASEWarStatus(drone, board, [controller, drone], ASCE).droneShutDown).toBe(false);
        const dead = { ...controller, isWrecked: () => true } as IASEWarUnit;
        applyASEWarEndRound([dead, drone], board, ASCE);
        applyASEWarEndRound([controller, drone], board, ASCE);
        expect(getASEWarStatus(drone, board, [controller, drone], ASCE).droneShutDown).toBe(true);
    });
    it("shuts down a drone with no controller named", () => {
        const drone = makeUnit(["DRO"]);
        applyASEWarEndRound([drone], {}, ASCE);
        expect(getASEWarStatus(drone, {}, [drone], ASCE).droneShutDown).toBe(true);
    });
});

describe("validateASC3Network", () => {
    const members = (code: string, count: number) => Array.from({ length: count }, () => makeUnit([code]));
    it("rejects too many members and members without the special", () => {
        const master = makeUnit(["C3M"]);
        const five = [master, ...members("C3S", 4)];
        const ok = [master, ...members("C3S", 3)];
        const network = (list: IASEWarUnit[]): IASC3Network => ({ name: "N", kind: "c3", members: list.map((u) => u.uuid), master: master.uuid });
        expect(validateASC3Network(network(ok), ok, ASCE)).toEqual([]);
        expect(validateASC3Network(network(five), five, ASCE).join(" ")).toContain("links 4");
        const wrong = [master, makeUnit(["ECM"])];
        expect(validateASC3Network(network(wrong), wrong, ASCE).join(" ")).toContain("cannot join");
        expect(validateASC3Network({ name: "N", kind: "c3", members: [master.uuid] }, [master], ASCE).join(" ")).toContain("no master");
    });
    it("counts a master that is not ticked as a member, and lets 2013 boosted C3 link five (#648 M4, M5)", () => {
        const master = makeUnit(["C3M"]);
        const slaves = members("C3S", 4);
        expect(validateASC3Network({ name: "N", kind: "c3", members: slaves.map((u) => u.uuid), master: master.uuid }, [master, ...slaves], ASCE).join(" ")).toContain("links 4");
        const bsm = makeUnit(["C3BSM"]);
        const bss = members("C3BSS", 4);
        expect(validateASC3Network({ name: "N", kind: "c3-boosted", members: bss.map((u) => u.uuid), master: bsm.uuid }, [bsm, ...bss], BOOK_2013)).toEqual([]);
    });
    it("ends a jam when its jammer is destroyed or has run out (#648 M10)", () => {
        const jammer = makeUnit(["DJ"], {}, { jammerTurnsLeft: 4 });
        const victim = makeUnit([], {}, { jammed: [{ kind: "DJ", turnsLeft: 5, from: jammer.uuid }] });
        applyASEWarEndRound([jammer, victim], {}, ASCE);
        expect(victim.ewarPlay.jammed?.[0].turnsLeft).toBe(4);
        jammer.ewarPlay.jammerTurnsLeft = 0;
        applyASEWarEndRound([jammer, victim], {}, ASCE);
        expect(victim.ewarPlay.jammed).toBeUndefined();
    });
    it("lets standard and boosted C3 share a network, and a master of masters reach 12 units (#648 M5)", () => {
        const std = makeUnit(["C3M"]);
        const boosted = makeUnit(["C3BSS"]);
        expect(validateASC3Network({ name: "N", kind: "c3", members: [std.uuid, boosted.uuid], master: std.uuid }, [std, boosted], ASCE)).toEqual([]);
        const lanceMasters = [makeUnit(["C3M"]), makeUnit(["C3M"]), makeUnit(["C3M"])];
        const slaves = members("C3S", 9);
        const all = [...lanceMasters, ...slaves];
        const network: IASC3Network = { name: "Company", kind: "c3", members: all.map((u) => u.uuid), master: lanceMasters[0].uuid };
        expect(validateASC3Network(network, all, ASCE)).toEqual([]);
        const thirteen = [...all, makeUnit(["C3S"])];
        expect(validateASC3Network({ ...network, members: thirteen.map((u) => u.uuid) }, thirteen, ASCE).join(" ")).toContain("links 12");
    });
    it("tells the player a hostile Angel or NOVA tick does nothing without a hostile ECM suite (#648 M11)", () => {
        const unit = makeUnit(["C3S"], {}, { hostileAngel: true });
        expect(getASEWarStatus(unit, {}, [unit], ASCE).lines.join(" ")).toContain("no hostile ECM suite is counted");
    });
    it("takes -1 on the TSEMP roll against a BattleMech or aerospace unit, not an industrial mech (#648 M3)", () => {
        expect(getASTsempEffect("BM", [], 8)).toBe("interference");
        expect(getASTsempEffect("SC", [], 8)).toBe("interference");
        expect(getASTsempEffect("IM", [], 8)).toBe("shutdown");
    });
    it("spends both the own and the friend RAMS on one hit (#648 M1)", () => {
        const friend = makeUnit(["RAMS"]);
        const both = makeUnit(["RAMS"]);
        const result = getASIncomingDamage(both, 4, { missile: true, front: true, ramsFrom: friend }, false, ASCE);
        expect(result.damage).toBe(2);
        expect(result.spendsRams).toBe("self");
        expect(result.spendsFriendRams).toBe(true);
    });
    it("limits C3i to 6, NOVA to 3 and a naval network to 6", () => {
        const seven = members("C3I", 7);
        expect(validateASC3Network({ name: "N", kind: "c3i", members: seven.map((u) => u.uuid) }, seven, ASCE).join(" ")).toContain("links 6");
        const six = seven.slice(0, 6);
        expect(validateASC3Network({ name: "N", kind: "c3i", members: six.map((u) => u.uuid) }, six, ASCE)).toEqual([]);
        const four = members("NOVA", 4);
        expect(validateASC3Network({ name: "N", kind: "nova", members: four.map((u) => u.uuid) }, four, ASCE).join(" ")).toContain("links 3");
        const ships = members("NC3", 7);
        expect(validateASC3Network({ name: "N", kind: "naval", members: ships.map((u) => u.uuid) }, ships, ASCE).join(" ")).toContain("links 6");
    });
});

describe("applyASEWarEndRound", () => {
    it("clears the one-turn state and counts jammers down", () => {
        const unit = makeUnit(["DJ"], {}, {
            stoodStill: true, target: { stealth: "unit" }, ramsUse: "self", tsempUsed: 1, tsempOneShotUsed: 1, chaffCloud: true,
            jammerTurnsLeft: 5, jammed: [{ kind: "DJ", turnsLeft: 2 }],
        });
        applyASEWarEndRound([unit], {}, ASCE);
        expect(unit.ewarPlay).toMatchObject({ jammerTurnsLeft: 4, jammed: [{ kind: "DJ", turnsLeft: 1 }], tsempOneShotUsed: 1 });
        for (const key of ["stoodStill", "target", "ramsUse", "tsempUsed", "chaffCloud"]) expect(unit.ewarPlay, key).not.toHaveProperty(key);
        for (let turn = 0; turn < 4; turn++) applyASEWarEndRound([unit], {}, ASCE);
        expect(unit.ewarPlay.jammerSpent).toBe(true);
        expect(unit.ewarPlay.jammerTurnsLeft).toBeUndefined();
        expect(unit.ewarPlay.jammed).toBeUndefined();
    });
    const wreckedMaster = () => {
        const master = makeUnit(["C3M"], { wrecked: true });
        const slave = makeUnit(["C3S"]);
        const emergency = makeUnit(["C3EM"]);
        const board: IASEWarBoard = { c3Networks: [{ name: "N", kind: "c3", members: [master.uuid, slave.uuid, emergency.uuid], master: master.uuid }] };
        return { master, slave, emergency, board, units: [master, slave, emergency] };
    };
    it("starts the C3EM when the master is wrecked, runs it 2 turns, and burns its unit under ASCE only", () => {
        const { emergency, slave, units, board } = wreckedMaster();
        applyASEWarEndRound(units, board, ASCE);
        expect(emergency.ewarPlay.c3EmergencyTurnsLeft).toBe(2);
        expect(getASEWarStatus(slave, board, units, ASCE).c3?.up).toBe(true);
        applyASEWarEndRound(units, board, ASCE);
        expect(emergency.ewarPlay.c3EmergencyTurnsLeft).toBe(1);
        applyASEWarEndRound(units, board, ASCE);
        expect(emergency.ewarPlay.c3EmergencyTurnsLeft).toBe(0);
        expect(emergency.ewarPlay.c3Burnt).toBe(true);
        expect(getASEWarStatus(slave, board, units, ASCE).c3?.up).toBe(false);
        applyASEWarEndRound(units, board, ASCE);
        expect(emergency.ewarPlay.c3EmergencyTurnsLeft).toBe(0);

        const old = wreckedMaster();
        for (let turn = 0; turn < 3; turn++) applyASEWarEndRound(old.units, old.board, BOOK_2013);
        expect(old.emergency.ewarPlay.c3Burnt).toBeUndefined();
        applyASEWarEndRound(old.units, old.board, BOOK_2013);
        expect(old.emergency.ewarPlay.c3EmergencyTurnsLeft).toBe(0);
    });
    it("does not start a C3EM while the master works", () => {
        const master = makeUnit(["C3M"]);
        const emergency = makeUnit(["C3EM"]);
        const board: IASEWarBoard = { c3Networks: [{ name: "N", kind: "c3", members: [master.uuid, emergency.uuid], master: master.uuid }] };
        applyASEWarEndRound([master, emergency], board, ASCE);
        expect(emergency.ewarPlay.c3EmergencyTurnsLeft).toBeUndefined();
    });
});

describe("TSEMP", () => {
    it("has no effect on infantry, DropShips, VLG or SLG", () => {
        expect(getASTsempEffect("CI", [], 12)).toBe("none");
        expect(getASTsempEffect("DS", [], 12)).toBe("none");
        expect(getASTsempEffect("DA", [], 12)).toBe("none");
        expect(getASTsempEffect("BM", ["VLG"], 12)).toBe("none");
        expect(getASTsempEffect("SV", ["SLG"], 12)).toBe("none");
    });
    it("modifies the roll by target type", () => {
        expect(getASTsempEffect("BM", [], 8)).toBe("interference");
        expect(getASTsempEffect("BM", [], 9)).toBe("shutdown");
        expect(getASTsempEffect("SV", [], 6)).toBe("shutdown");
        expect(getASTsempEffect("BM", ["LG"], 10)).toBe("interference");
        expect(getASTsempEffect("AF", [], 8)).toBe("interference");
        expect(getASTsempEffect("CV", [], 8)).toBe("shutdown");
    });
    it("wears a hit off after the second End Round, and does not stack", () => {
        const unit = makeUnit([]);
        applyASTsempHit(unit, "interference");
        applyASTsempHit(unit, "interference");
        expect(unit.ewarPlay.tsempHit).toEqual({ effect: "interference", turnsLeft: 2 });
        applyASTsempHit(unit, "shutdown");
        expect(unit.ewarPlay.tsempHit?.effect).toBe("shutdown");
        applyASTsempHit(unit, "none");
        applyASEWarEndRound([unit], {}, ASCE);
        expect(unit.ewarPlay.tsempHit?.turnsLeft).toBe(1);
        applyASEWarEndRound([unit], {}, ASCE);
        expect(unit.ewarPlay.tsempHit).toBeUndefined();
    });
    it("counts attacks per turn, and per scenario for the one-shot form", () => {
        const cannon = makeUnit(["TSEMP2"]);
        expect(fireASTsemp(cannon)).toBe(true);
        expect(fireASTsemp(cannon)).toBe(true);
        expect(fireASTsemp(cannon)).toBe(false);
        applyASEWarEndRound([cannon], {}, ASCE);
        expect(fireASTsemp(cannon)).toBe(true);
        const oneShot = makeUnit(["TSEMP-O1"]);
        expect(fireASTsemp(oneShot)).toBe(true);
        applyASEWarEndRound([oneShot], {}, ASCE);
        expect(fireASTsemp(oneShot)).toBe(false);
        expect(getASEWarStatus(oneShot, {}, [oneShot], ASCE).lines.join(" ")).toContain("0 attacks left this scenario");
    });
    it("plays TSEMP in the 2013 edition by the Companion, and adds +1 to the hit unit's attacks while it is interfered with", () => {
        expect(getASEWarStatus(makeUnit(["TSEMP2"]), {}, [], BOOK_2013).lines.join(" ")).toContain("ASC p.39");
        const hit = makeUnit([], {}, { tsempHit: { effect: "interference", turnsLeft: 2 } });
        expect(getASEWarToHit(hit, { hj: false, nc3Up: false }, ASCE, false).short).toBe(1);
        expect(getASEWarToHit(hit, { hj: false, nc3Up: false }, BOOK_2013, false).short).toBe(1);
        expect(getASEWarStatus(hit, {}, [hit], ASCE).lines.join(" ")).toContain("+1 to its attacks");
    });
});

describe("Chaff pods (CHF#, ours)", () => {
    it("spends a pod, the cloud lasts to End Round, and the unit inside takes AMS-like relief from a missile hit", () => {
        const layer = makeUnit(["CHF2"], { rulesLevel: 6 });
        expect(fireASChaffPod(layer)).toBe(true);
        expect(layer.ewarPlay).toMatchObject({ chaffFired: 1, chaffCloud: true });
        const board: IASEWarBoard = { chaffCloud: { [layer.uuid]: [] } };
        const inside = makeUnit([], {}, { chaffCloud: true });
        expect(getASIncomingDamage(inside, 3, { missile: true, front: false }, false, ASCE).damage).toBe(2);
        expect(getASEWarStatus(inside, board, [layer, inside], ASCE).lines.join(" ")).toContain("chaff cloud");
        applyASEWarEndRound([layer, inside], board, ASCE);
        expect(layer.ewarPlay.chaffCloud).toBeUndefined();
        expect(getASIncomingDamage(inside, 3, { missile: true, front: false }, false, ASCE).damage).toBe(3);
        expect(fireASChaffPod(layer)).toBe(true);
        expect(fireASChaffPod(layer)).toBe(false);
    });
    it("cuts the C3 of a unit inside a cloud the board names", () => {
        const layer = makeUnit(["CHF1"], { rulesLevel: 6 });
        const a = makeUnit(["C3I"]);
        const b = makeUnit(["C3I"]);
        const board: IASEWarBoard = { c3Networks: [{ name: "N", kind: "c3i", members: [a.uuid, b.uuid] }], chaffCloud: { [layer.uuid]: [a.uuid] } };
        expect(getASEWarStatus(a, board, [layer, a, b], ASCE).c3?.up).toBe(false);
        expect(getASEWarStatus(b, board, [layer, a, b], ASCE).c3?.up).toBe(true);
        syncASChaffClouds([layer, a, b], board);
        expect(a.ewarPlay.chaffCloud).toBe(true);
    });
    it("plays the inferred CHF at canon levels too (the canon Chaff Pod, #647)", () => {
        const layer = makeUnit(["CHF2"], { rulesLevel: 4 });
        expect(fireASChaffPod(layer)).toBe(true);
    });
});

describe("shut-down units (review I2, I3)", () => {
    const lance = (masterExtra: Partial<IASEWarUnit> = {}, masterPlay: IASEWarPlayState = {}) => {
        const master = makeUnit(["C3M", "ECM"], masterExtra, masterPlay);
        const slave = makeUnit(["C3S"]);
        const mate = makeUnit([]);
        const board: IASEWarBoard = { c3Networks: [{ name: "N", kind: "c3", members: [master.uuid, slave.uuid], master: master.uuid }], friendlyEcm: { [master.uuid]: [mate.uuid] } };
        return { master, slave, mate, board, units: [master, slave, mate] };
    };
    it("takes a C3 network down and stops the ECM cover when the master is shut down by a TSEMP or by heat", () => {
        for (const [extra, play] of [[{}, { tsempHit: { effect: "shutdown" as const, turnsLeft: 2 } }], [{ currentHeat: 4 }, {}]] as [Partial<IASEWarUnit>, IASEWarPlayState][]) {
            const { master, slave, mate, board, units } = lance(extra, play);
            expect(getASEWarStatus(slave, board, units, ASCE).c3?.up).toBe(false);
            expect(getASEcmFields(master, ASCE)).toEqual({ ecm: 0, eccm: 0, inches: 0 });
            expect(getASFriendlyCover(board, units, ASCE).has(mate.uuid)).toBe(false);
            applyASEWarEndRound(units, board, ASCE);
        }
    });
    it("starts the C3EM when the master is shut down, and a shut-down master that is merely heated at level 3 still works", () => {
        const { slave, units, board } = lance({ currentHeat: 3 });
        expect(getASEWarStatus(slave, board, units, ASCE).c3?.up).toBe(true);
        const down = lance({ currentHeat: 4 });
        const emergency = makeUnit(["C3EM"]);
        down.board.c3Networks![0].members.push(emergency.uuid);
        down.units.push(emergency);
        applyASEWarEndRound(down.units, down.board, ASCE);
        expect(emergency.ewarPlay.c3EmergencyTurnsLeft).toBe(2);
    });
    it("does not count a running emergency master that is wrecked, in hostile ECM or jammed", () => {
        const make = (extra: Partial<IASEWarUnit>, play: IASEWarPlayState) => {
            const master = makeUnit(["C3M"], { wrecked: true });
            const slave = makeUnit(["C3S"]);
            const emergency = makeUnit(["C3EM"], extra, { c3EmergencyTurnsLeft: 2, ...play });
            const board: IASEWarBoard = { c3Networks: [{ name: "N", kind: "c3", members: [master.uuid, slave.uuid, emergency.uuid], master: master.uuid }] };
            return { slave, board, units: [master, slave, emergency] };
        };
        const ok = make({}, {});
        expect(getASEWarStatus(ok.slave, ok.board, ok.units, ASCE).c3?.up).toBe(true);
        for (const [extra, play] of [[{ wrecked: true }, {}], [{}, { hostileEcm: 1 }], [{}, { jammed: [{ kind: "HJ" as const, turnsLeft: 2 }] }], [{ currentHeat: 4 }, {}]] as [Partial<IASEWarUnit> & { wrecked?: boolean }, IASEWarPlayState][]) {
            const bad = make(extra, play);
            expect(getASEWarStatus(bad.slave, bad.board, bad.units, ASCE).c3?.up, JSON.stringify(play)).toBe(false);
        }
    });
    it("ends a viral jammer when its unit is shut down", () => {
        const jammer = makeUnit(["DJ"], { currentHeat: 4 }, { jammerTurnsLeft: 3 });
        applyASEWarEndRound([jammer], {}, ASCE);
        expect(jammer.ewarPlay.jammerSpent).toBe(true);
        expect(jammer.ewarPlay.jammerTurnsLeft).toBeUndefined();
    });
    it("treats a Homing-Jammed boosted master as down (review M2) and starts the C3EM under HJ", () => {
        const master = makeUnit(["C3BSM"], {}, { jammed: [{ kind: "HJ", turnsLeft: 2 }] });
        const slave = makeUnit(["C3BSS"]);
        const board: IASEWarBoard = { c3Networks: [{ name: "N", kind: "c3-boosted", members: [master.uuid, slave.uuid], master: master.uuid }] };
        expect(getASEWarStatus(slave, board, [master, slave], ASCE).c3?.up).toBe(false);
        const standard = makeUnit(["C3M"], {}, { jammed: [{ kind: "HJ", turnsLeft: 2 }] });
        const emergency = makeUnit(["C3EM"]);
        const board2: IASEWarBoard = { c3Networks: [{ name: "N", kind: "c3", members: [standard.uuid, emergency.uuid], master: standard.uuid }] };
        applyASEWarEndRound([standard, emergency], board2, ASCE);
        expect(emergency.ewarPlay.c3EmergencyTurnsLeft).toBe(2);
    });
});

// Sonic projectors in Alpha Strike (#645): SNC is ours (levels 6-7).
describe("Alpha Strike sonic projectors (#645)", () => {
    it("reads SNC at level 6 and drops it below it", () => {
        expect(getASEWarSpecials(["SNC"], 6).map((entry) => entry.code)).toEqual(["SNC"]);
        expect(getASEWarSpecials(["SNC"], 4)).toEqual([]);
    });

    it("a CI unit hit by a stun takes no damage and falls back on a failed 2D6 against 8", () => {
        const ci = makeUnit([], { type: "CI", isInfantry: true });
        expect(resolveASStun(ci, 7).fellBack).toBe(true);
        expect(ci.ewarPlay.fellBack).toEqual({ turnsLeft: 2 });
        const steady = makeUnit([], { type: "CI", isInfantry: true });
        expect(resolveASStun(steady, 8).fellBack).toBe(false);
        expect(steady.ewarPlay.fellBack).toBeUndefined();
    });

    it("BA and sealed units are immune, and a stun does nothing to a Mech", () => {
        const ba = makeUnit([], { type: "BA", isInfantry: true });
        expect(resolveASStun(ba, 2).line).toMatch(/Immune/);
        expect(ba.ewarPlay.fellBack).toBeUndefined();
        const sealed = makeUnit(["SEAL"], { type: "CI", isInfantry: true });
        expect(resolveASStun(sealed, 2).line).toMatch(/Immune/);
        const mech = makeUnit([]);
        expect(resolveASStun(mech, 2).line).toMatch(/No effect/);
    });

    it("a fall-back counts down with the End Round", () => {
        const ci = makeUnit([], { type: "CI", isInfantry: true });
        resolveASStun(ci, 3);
        applyASEWarEndRound([ci], {}, ASCE);
        expect(ci.ewarPlay.fellBack).toEqual({ turnsLeft: 1 });
        applyASEWarEndRound([ci], {}, ASCE);
        expect(ci.ewarPlay.fellBack).toBeUndefined();
    });
});

// #647 Task 5: Alpha Strike play for our specials (BSF, PBR, PBJ, SMKT, SMKB, PSC).
import { applyASBlueSaviourCritical, layASSmoke, rollASBlueSaviourFailure, toggleASBlueSaviour, triggerASPowerBooster } from "./alpha-strike-ewar-play";

describe("Blue Saviour (BSF, ours)", () => {
    const field = () => makeUnit(["BSF2/2/1/0"], { rulesLevel: 6 }, { bsfOn: true, bsfTurnsOn: 0 });
    it("halves an energy hit (round down, minimum 1)", () => {
        expect(getASIncomingDamage(field(), 5, { missile: false, front: true, energy: true }, false, ASCE).damage).toBe(2);
        expect(getASIncomingDamage(field(), 1, { missile: false, front: true, energy: true }, false, ASCE).damage).toBe(1);
    });
    it("takes 1 off a missile hit as an AMS, without stacking with a real AMS", () => {
        const result = getASIncomingDamage(field(), 3, { missile: true, front: true }, false, ASCE);
        expect(result.damage).toBe(2);
        expect(result.lines.join(" ")).toContain("Blue Saviour: -1 damage, as an AMS (BSF, ours)");
        const both = makeUnit(["BSF2/2/1/0", "AMS"], { rulesLevel: 6 }, { bsfOn: true });
        expect(getASIncomingDamage(both, 3, { missile: true, front: true }, false, ASCE).damage).toBe(2);
    });
    it("is not applied to a nuclear hit", () => {
        expect(getASIncomingDamage(field(), 5, { missile: false, front: true, energy: true, nuclear: true }, false, ASCE).damage).toBe(5);
        expect(getASIncomingDamage(field(), 3, { missile: true, front: true, nuclear: true }, false, ASCE).damage).toBe(3);
    });
    it("counts as inside hostile ECM, turns STL off and adds 1 heat in the End Phase", () => {
        const unit = makeUnit(["BSF2/2/1/0", "STL"], { rulesLevel: 6, currentHeat: 0 }, { bsfOn: true, bsfTurnsOn: 0 });
        expect(getASEWarStatus(unit, {}, [unit], ASCE).lines.join(" ")).toContain("Blue Saviour on");
        expect(resolveASEcm(unit, undefined, ASCE).inHostileEcm).toBe(true);
        applyASEWarEndRound([unit], {}, ASCE);
        expect(unit.currentHeat).toBe(1);
        expect(unit.ewarPlay.bsfTurnsOn).toBe(1);
    });
    it("fails from the seventh turn: below 2 + (turns on - 6)", () => {
        const failing = makeUnit(["BSF2/2/1/0"], { rulesLevel: 6 }, { bsfOn: true, bsfTurnsOn: 7 });
        expect(rollASBlueSaviourFailure(failing, 3)).toBe(false);
        expect(rollASBlueSaviourFailure(failing, 2)).toBe(true);
        expect(failing.ewarPlay.bsfDead).toBe(true);
    });
    it("a critical hit while on adds 1 damage and kills the field for the scenario", () => {
        const unit = field();
        expect(applyASBlueSaviourCritical(unit)).toBe(1);
        expect(unit.ewarPlay.bsfDead).toBe(true);
        toggleASBlueSaviour(unit, true);
        expect(unit.ewarPlay.bsfOn).toBe(false);
        expect(applyASBlueSaviourCritical(unit)).toBe(0);
    });
});

describe("Power Boosters (PBR, PBJ; ours)", () => {
    it("fails on a 5 and succeeds on a 6 the first turn", () => {
        const dead = makeUnit(["PBR"], { rulesLevel: 6 });
        expect(triggerASPowerBooster(dead, "PBR", 5).ok).toBe(false);
        expect(dead.ewarPlay.boost?.PBR?.dead).toBe(true);
        const unit = makeUnit(["PBR"], { rulesLevel: 6 });
        const result = triggerASPowerBooster(unit, "PBR", 6);
        expect(result.ok).toBe(true);
        expect(result.line).toBe('+2" Move this turn, +1 heat (PBR, ours)');
        expect(unit.ewarPlay.boost?.PBR?.streak).toBe(1);
    });
    it("fails on a 9 the second turn in a row, burns out on a natural 2, and always fails the fourth turn", () => {
        const unit = makeUnit(["PBJ"], { rulesLevel: 6, currentHeat: 0 });
        expect(triggerASPowerBooster(unit, "PBJ", 12).ok).toBe(true);
        applyASEWarEndRound([unit], {}, ASCE);
        expect(unit.currentHeat).toBe(1);
        expect(triggerASPowerBooster(unit, "PBJ", 9).ok).toBe(false);
        const burn = makeUnit(["PBR"], { rulesLevel: 6 }, { boost: { PBR: { streak: 1 } } });
        expect(triggerASPowerBooster(burn, "PBR", 2).burnout).toBe(true);
        const fourth = makeUnit(["PBR"], { rulesLevel: 6 }, { boost: { PBR: { streak: 3 } } });
        expect(triggerASPowerBooster(fourth, "PBR", 12).ok).toBe(false);
    });
    it("an unused turn resets the streak in the End Phase", () => {
        const unit = makeUnit(["PBR"], { rulesLevel: 6 }, { boost: { PBR: { streak: 2 } } });
        applyASEWarEndRound([unit], {}, ASCE);
        expect(unit.ewarPlay.boost?.PBR?.streak).toBe(0);
    });
});

describe("Smoke (SMKT, SMKB; ours)", () => {
    it("a Buckler dispenser needs a unit that did not move and spends one use of its ten", () => {
        const unit = makeUnit(["SMKB10"], { rulesLevel: 6 });
        expect(layASSmoke(unit, "SMKB", true)).toBe(false);
        expect(layASSmoke(unit, "SMKB", false)).toBe(true);
        expect(unit.ewarPlay.smokeUsesSpent).toBe(1);
        unit.ewarPlay.smokeUsesSpent = 10;
        expect(layASSmoke(unit, "SMKB", false)).toBe(false);
    });
    it("smoke lasts to the End Phase of the next turn", () => {
        const unit = makeUnit(["SMKT"], { rulesLevel: 6 });
        expect(layASSmoke(unit, "SMKT", true)).toBe(true);
        applyASEWarEndRound([unit], {}, ASCE);
        expect(unit.ewarPlay.smokeLaid).toBe("trail");
        applyASEWarEndRound([unit], {}, ASCE);
        expect(unit.ewarPlay.smokeLaid).toBeUndefined();
    });
    it("a periscope shows only as a spotting line and adds no to-hit line", () => {
        const unit = makeUnit(["PSC"], { rulesLevel: 6 });
        expect(getASEWarStatus(unit, {}, [unit], ASCE).lines.join(" ")).toContain("PSC");
        const toHit = getASEWarToHit(unit, { hj: false, nc3Up: false }, ASCE, false);
        expect(JSON.stringify(toHit)).not.toContain("PSC");
    });
    it("shows none of our specials on a level 4 unit", () => {
        const unit = makeUnit(["BSF2/2/1/0", "SMKT"], { rulesLevel: 4 });
        expect(getASEWarSpecials(unit.abilities, 4)).toEqual([]);
    });
});
