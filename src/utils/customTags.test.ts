import { describe, expect, it } from "vitest";
import { ammoSlug, buildCustomTag, finalizeTag, sanitizeSubmitter, slugifyName } from "./customTags";

describe("custom tags", () => {
    it("sanitizes the submitter's GitHub login", () => {
        expect(sanitizeSubmitter("NgcFells")).toBe("ngcfells");
        expect(sanitizeSubmitter("some_user.name")).toBe("some-user-name");
        expect(sanitizeSubmitter("__")).toBe("anonymous");
    });

    it("slugs names the way the catalogs do", () => {
        expect(slugifyName("Coil (L)")).toBe("coil-l");
        expect(slugifyName("Reactive Armor Mk.2")).toBe("reactive-armor-mk-2");
    });

    it("slugs ammunition with its round type", () => {
        expect(ammoSlug("Ammo (AC/25)")).toBe("ac-25-standard");
        expect(ammoSlug("Ammo (LRM-10 Swarm)")).toBe("lrm-10-swarm");
    });

    it.each([
        [{ submitter: "ngcfells", faction: "universal", slug: "ac-25-standard", isAmmo: true }, "ammo-ngcfells-ac-25-standard"],
        [{ submitter: "ngcfells", faction: "is", slug: "ac-25-standard", isAmmo: true }, "ammo-ngcfells-is-ac-25-standard"],
        [{ submitter: "ngcfells", faction: "clan", slug: "ac-25-standard", isAmmo: true }, "ammo-ngcfells-clan-ac-25-standard"],
        [{ submitter: "ngcfells", faction: "clan", slug: "coil-l", isAmmo: false }, "ngcfells-clan-coil-l"],
        [{ submitter: "local", faction: "is", slug: "reactive-armor-mk-2", isAmmo: false }, "local-is-reactive-armor-mk-2"],
    ] as const)("builds %o as %s", (args, expected) => {
        expect(buildCustomTag(args)).toBe(expected);
    });

    it("replaces the provisional submitter with the real one", () => {
        expect(finalizeTag("ammo-local-is-ac-25-standard", "ngcfells")).toBe("ammo-ngcfells-is-ac-25-standard");
        expect(finalizeTag("local-coil-l", "ngcfells")).toBe("ngcfells-coil-l");
    });
});
