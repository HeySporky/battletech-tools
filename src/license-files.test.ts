import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// License files are legally binding: a change must never slip in unnoticed. Each file's content is pinned here, so
// an edit or deletion fails the tests until the pinned hash is deliberately updated in the same change, where
// reviewers see it. Line endings are normalized so Windows and Unix checkouts hash the same.
//
// LICENSE is the project's GPLv3; LICENSE-MIT is the original Jeff's BattleTech Tools license, kept verbatim.
const PINNED_LICENSE_FILES: Record<string, string> = {
    "LICENSE": "6772a383b01d36b0c7bf3a40b07ad0640d488352362a35842e23ef95b7150c9e",
    "LICENSE-MIT": "4077ae668e893761df237934dfcd601d692e3bba62b2f06547ce209b4c26e94b",
};

describe("license files", () => {
    for (const [file, pinnedHash] of Object.entries(PINNED_LICENSE_FILES)) {
        it(`${file} is present and unchanged`, () => {
            expect(existsSync(file), `${file} is missing; license files must stay tracked`).toBe(true);
            const content = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
            const hash = createHash("sha256").update(content).digest("hex");
            expect(hash, `${file} changed. Only update the pinned hash in src/license-files.test.ts after the change `
                + "has been reviewed and approved as a license change.").toBe(pinnedHash);
        });
    }
});
