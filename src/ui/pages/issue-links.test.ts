import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const files = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(name) ? [path] : [];
});

describe("issue links (issue 18)", () => {
    it("send bug reports to a repository someone answers, not Jeff's original one", () => {
        const stale = files(join(__dirname)).filter((path) => /github\.com\/jdgwf\/battletech-tools\/issues/i.test(readFileSync(path, "utf-8")));
        expect(stale).toEqual([]);
    });
});
