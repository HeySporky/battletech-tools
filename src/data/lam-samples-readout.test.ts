import { describe, expect, it } from "vitest";
import { getPAMSamplesReadout, getVTOLAMSamplesReadout, lamSampleDesignName } from "./lam-samples-readout";
import { PAM_SAMPLES } from "./pam-samples";
import { VTOLAM_SAMPLES } from "./vtolam-samples";

// NGCFells, 2026-11-17: every unit type CGL does not ship gets a TRO - JBT readout with its example designs, and every
// source we have a link for is linked.
describe("VTOLAM and Permanent Air 'Mech readout entries", () => {
    it("gives each sample design a page of its own, named without the rules it was built under", () => {
        const vtolam = getVTOLAMSamplesReadout();
        for (const sample of VTOLAM_SAMPLES) expect(vtolam).toContain(`### ${lamSampleDesignName(sample.name)}\n`);
        expect(lamSampleDesignName("Firefly VTOLAM (Battletech Into The Future rules)")).toBe("Firefly VTOLAM");
        const pam = getPAMSamplesReadout();
        for (const sample of PAM_SAMPLES) expect(pam).toContain(`### ${lamSampleDesignName(sample.name)}\n`);
        expect(lamSampleDesignName("Sparrow SPW-2J (Air-Slip Mech, LAMFAN)")).toBe("Sparrow SPW-2J");
    });

    it("reads its figures from the design: VTOL movement for a VTOLAM, AirMech movement for a PAM", () => {
        expect(getVTOLAMSamplesReadout()).toMatch(/### Locust VTOLAM LCT-XX[\s\S]*?Movement:\*\* walk \/ run \/ jump 8 \/ 12 \/ 0; VTOL 13 \/ 20/);
        expect(getPAMSamplesReadout()).toMatch(/### Sparrow SPW-2J[\s\S]*?Movement:\*\* walk \/ run \/ jump 8 \/ 12 \/ 6; AirMech 18 \//);
    });

    it("carries each design's credit and link to the original post", () => {
        const vtolam = getVTOLAMSamplesReadout();
        expect(vtolam).toContain("https://www.deviantart.com/bishopsteiner/art/LOCUST-VTOLAM-concept-899660337");
        expect(vtolam).toContain("https://battletechfuture.com/2024/05/30/firefly-vtolam/");
        expect(getPAMSamplesReadout()).toContain("https://battletech.com/forums/index.php?topic=83239.0");
        expect(getPAMSamplesReadout()).not.toMatch(/\bour\b/);
    });
});
