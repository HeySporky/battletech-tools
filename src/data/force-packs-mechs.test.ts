import { describe, expect, it } from "vitest";
import { getMULDisplayName } from "../classes/alpha-strike-unit";
import { CONST_FORCE_PACKS } from "./force-packs-mechs";
import { loadMULListItems } from "./mul-list-items";

describe("ForcePacks", () => {
    it("name every member as a bundled MUL unit's full name, so the roster finds it", async () => {
        const names = new Set((await loadMULListItems(["mul2", "custom"])).map((unit) => getMULDisplayName(unit).toLowerCase()));
        const missing = CONST_FORCE_PACKS.flatMap((pack) => pack.members.filter((member) => !names.has(member.trim().toLowerCase())).map((member) => `${pack.name}: ${member}`));
        expect(missing).toEqual([]);
    }, 60000);

    it("give a skill for each member where skills are set", () => {
        for (const pack of CONST_FORCE_PACKS.filter((pack) => pack.skills)) {
            expect(pack.skills, pack.name).toHaveLength(pack.members.length);
        }
    });

    // Ideas #82: the Aces: Scouring Sands campaign book's opposing forces, one pack per setup page.
    it("hold every Aces: Scouring Sands opposing force, two training and 21 sorties", () => {
        const aces = CONST_FORCE_PACKS.filter((pack) => pack.name.startsWith("Aces: Scouring Sands"));
        expect(aces).toHaveLength(23);
        expect(aces.filter((pack) => pack.name.includes(" Sortie ")).map((pack) => pack.name.slice(28, 30)))
            .toEqual(Array.from({ length: 21 }, (_, index) => String(index + 1).padStart(2, "0")));
        expect(aces.find((pack) => pack.name.includes("Sortie 01"))).toMatchObject({
            members: ["Rifleman C 2", "Locust IIC 4", "Baboon (Howler) 6", "Fulcrum Heavy Hovertank", "Fulcrum Heavy Hovertank"],
            skills: [3, 3, 3, 3, 3],
        });
        expect(aces.find((pack) => pack.name.includes("Sortie 06"))?.skills?.[0]).toBe(2);
    });

    // #191: the sorties' emplacements are the box's Battlefield Support cards, in the custom unit list at Skill 4.
    it("give the Aces sorties their emplacement cards at Skill 4", () => {
        const sortie03 = CONST_FORCE_PACKS.find((pack) => pack.name.includes("Scouring Sands Sortie 03"))!;
        expect(sortie03.members.slice(-2)).toEqual(["Heavy Emplacement AC/20", "Heavy Emplacement AC/20"]);
        expect(sortie03.skills?.slice(-2)).toEqual([4, 4]);
        expect(CONST_FORCE_PACKS.filter((pack) => pack.members.some((member) => member.includes(" Emplacement "))))
            .toHaveLength(6);
        expect(CONST_FORCE_PACKS.some((pack) => pack.note?.includes("not MUL units"))).toBe(false);
    });
});
