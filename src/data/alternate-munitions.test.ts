import { describe, expect, it } from "vitest";
import { getAmmoFamily } from "./equipment-registry";
import { mechISAmmo } from "./mech-is-ammo";
import { mechUniversalAmmo } from "./mech-universal-ammo";

const find = (tag: string) => [...mechISAmmo, ...mechUniversalAmmo].find(item => item.tag === tag)!;

describe("alternate munitions added for canon completeness", () => {
    it("Retro-Streak SRMs and Shoot-and-Sit Narc missiles join their launcher families at x1.1 cost (IO:AE pp.126-127)", () => {
        const retro = find("ammo-is-streak-srm-retro-streak");
        expect(getAmmoFamily(retro)).toBe(getAmmoFamily(find("ammo-is-streak-srm-standard")));
        expect(retro).toMatchObject({ isSpecialAmmo: true, cbills: 54000 * 1.1, roundsPerTon: 100, introduced: null, prototype: 3048, extinct: 3057, rulesLevel: 4 });
        const sit = find("ammo-is-narc-shoot-and-sit");
        expect(getAmmoFamily(sit)).toBe(getAmmoFamily(find("ammo-is-narc-standard")));
        expect(sit).toMatchObject({ cbills: 10000 * 1.1, roundsPerTon: 6, prototype: 3049, extinct: 3059, rulesLevel: 4 });
    });

    it("Bola Narc pods and Thunder Active-IV missiles (TO:AUE pp.169, 180, 227)", () => {
        expect(getAmmoFamily(find("ammo-is-narc-bola"))).toBe(getAmmoFamily(find("ammo-is-narc-standard")));
        expect(find("ammo-is-narc-bola")).toMatchObject({ cbills: 2000, roundsPerTon: 6, prototype: 3056, introduced: null, rulesLevel: 4 });
        expect(getAmmoFamily(find("ammo-is-arrow-iv-active"))).toBe(getAmmoFamily(find("ammo-is-arrow-iv-standard")));
        expect(find("ammo-is-arrow-iv-active")).toMatchObject({ cbills: 30000, roundsPerTon: 5, prototype: 3056, introduced: 3065, rulesLevel: 3 });
    });

    it("Thunder bombs are worth seven 20-point minefields of their mine type (TO:AUE p.197)", () => {
        // Minefield BV per 5 points: Standard 4, Active 6, Vibrabomb 5.
        expect(find("ammo-is-bomb-thunder").battleValue).toBe(7 * 4 * 4);
        expect(find("ammo-is-bomb-thunder-active")).toMatchObject({ battleValue: 7 * 4 * 6, cbills: 36000, introduced: 3065 });
        expect(find("ammo-is-bomb-thunder-vibrabomb")).toMatchObject({ battleValue: 7 * 4 * 5, cbills: 24000, introduced: 3065 });
    });

    it("fluid gun munitions are priced per TO:AUE p.227 and fire from the Fluid Gun (pp.173-175)", () => {
        const costs = { coolant: 3000, corrosive: 5000, "flame-retardant-foam": 1000, "inferno-fuel": 2000, "oil-slick": 2000, "paint-obscurant": 1000 };
        const standard = getAmmoFamily(find("ammo-fluid-gun-standard"));
        for (const [round, cbills] of Object.entries(costs)) {
            const ammo = find(`ammo-fluid-gun-${round}`);
            expect(ammo, round).toMatchObject({ cbills, roundsPerTon: 20, battleValue: 1, rulesLevel: 3 });
            expect(getAmmoFamily(ammo), round).toBe(standard);
        }
    });
});
