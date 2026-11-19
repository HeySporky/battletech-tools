import { describe, expect, it } from "vitest";
import { ammoCatalog } from "./ammo";

// #34: alternate rounds out of step with their standard round. Tactical Operations' Alternative Munitions Table
// (BV addendum, TO p.386; TO:AUE) changes the base BV only of the munitions it lists. For artillery that is
// Thunder/FASCAM alone, priced as minefields. Every other artillery round, homing and Copperhead included, keeps its
// standard round's BV (homing rounds are counted again at force level, through the TAG bonus). LB-X cluster rounds
// share the standard round's row in the TechManual weapon tables.
const bv = (tag: string) => {
    // A merged IS/Clan twin answers to the Clan tag as an alias (catalog consolidation §2).
    const item = ammoCatalog.find((ammo) => ammo.tag === tag) ?? ammoCatalog.find((ammo) => !!ammo.altTags?.includes(tag));
    if (!item) throw new Error("no ammo " + tag);
    return item.battleValue;
};

// Rounds whose BV the table does change, or that are not priced from the standard round.
const PRICED_APART = /-(thunder|fascam|vibrabomb|davy-crockett-m|anti-orbital)$/;

const families: { pattern: RegExp; standard: (tag: string) => string }[] = [
    // "ammo-is-arrow-iv-homing" -> "ammo-is-arrow-iv-standard"
    { pattern: /^ammo-(is|clan)-arrow-iv-[a-z0-9-]+$/, standard: (tag) => tag.replace(/^(ammo-(?:is|clan)-arrow-iv)-.+$/, "$1-standard") },
    // Clan and IS tube artillery share one standard round: "ammo-clan-thumper-copperhead" -> "ammo-thumper-standard"
    { pattern: /^ammo-((is|clan)-)?(thumper|sniper|long-tom)-[a-z0-9-]+$/, standard: (tag) => tag.replace(/^ammo-(?:(?:is|clan)-)?(thumper|sniper|long-tom)-.+$/, "ammo-$1-standard") },
    { pattern: /^ammo-(thumper|sniper|long-tom)-cannon-[a-z0-9-]+$/, standard: (tag) => tag.replace(/-cannon-.+$/, "-cannon-standard") },
    { pattern: /^ammo-(is|clan)-lb-\d+x-cluster$/, standard: (tag) => tag.replace(/-cluster$/, "-standard") },
];

describe("alternate munition Battle Values (#34)", () => {
    const cases = ammoCatalog
        .map((ammo) => ammo.tag)
        .filter((tag) => !PRICED_APART.test(tag))
        .flatMap((tag) => families.filter((family) => family.pattern.test(tag) && !/-cannon-/.test(tag) === !/-cannon-/.test(family.pattern.source))
            .map((family) => [tag, family.standard(tag)] as const))
        .filter(([tag, standard]) => tag !== standard);

    it("finds the rounds named in the issue", () => {
        const tags = cases.map(([tag]) => tag);
        for (const tag of ["ammo-is-lb-5x-cluster", "ammo-thumper-copperhead", "ammo-is-arrow-iv-homing", "ammo-clan-arrow-iv-homing"]) {
            expect(tags).toContain(tag);
        }
    });

    it.each(cases)("%s has the BV of %s", (tag, standard) => {
        expect(bv(tag)).toBe(bv(standard));
    });

    it("matches the TechManual and Tactical Operations values for the three rounds in the issue and their Clan twins", () => {
        expect(bv("ammo-is-lb-5x-cluster")).toBe(10);
        expect(bv("ammo-clan-lb-5x-cluster")).toBe(12);
        expect(bv("ammo-thumper-copperhead")).toBe(5);
        expect(bv("ammo-clan-thumper-copperhead")).toBe(5);
        expect(bv("ammo-is-arrow-iv-homing")).toBe(30);
        expect(bv("ammo-clan-arrow-iv-homing")).toBe(30);
    });
});
