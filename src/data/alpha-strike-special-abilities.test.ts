import { describe, expect, it } from "vitest";
import { isAlphaStrikeAbilityCode } from "./alpha-strike-special-abilities";

describe("isAlphaStrikeAbilityCode", () => {
    it("accepts the special ability codes the catalog lists, with their numbers", () => {
        for (const code of ["AMS", "ECM", "CASE", "CASEII", "OVL", "ENE", "STL", "RCA", "MEL", "BHJ2", "C3BSM1",
            "IF1", "IF 1", "LRM 1/1/1", "LRM1/1/1/0", "AC 0/1/1", "SRM 2/2", "TOR2", "REAR 1/1/1", "ARTLTC-1", "HT1/1/0", "FLK1/1/1/0"]) {
            expect(isAlphaStrikeAbilityCode(code), code).toBe(true);
        }
    });

    it("refuses TechManual weapon type codes and descriptive notes", () => {
        for (const code of ["DE", "DB", "M", "MS", "S", "P", "I", "C", "H", "ST", "", "One-Shot", "Provisional workbook conversion",
            "Requires Artemis IV capable launcher", "IF", "LRM"]) {
            expect(isAlphaStrikeAbilityCode(code), code).toBe(false);
        }
    });
});
