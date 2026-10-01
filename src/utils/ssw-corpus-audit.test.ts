// Dev tool, not a regression test: imports every .ssw file under $SSW_AUDIT_DIR and writes the unresolved
// names, with counts and example designs, to $SSW_AUDIT_OUT (default: ssw-audit.json in the working directory).
// Run: SSW_AUDIT_DIR=<dir> SSW_AUDIT_OUT=<file> npx vitest run --project unit src/utils/ssw-corpus-audit.test.ts
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, vi } from "vitest";
import { BattleMech } from "../classes/battlemech";
import { getSSWXMLBasicInfo } from "./getSSWXMLBasicInfo";

const dir = process.env.SSW_AUDIT_DIR;

const listFiles = (root: string): string[] => readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    return statSync(path).isDirectory() ? listFiles(path) : path.toLowerCase().endsWith(".ssw") ? [path] : [];
});

describe.skipIf(!dir)("SSW corpus audit", () => {
    it("lists every unresolved name", () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        const names = new Map<string, { kind: string; name: string; count: number; designs: string[] }>();
        const skipped = new Map<string, number>();
        const failures: { file: string; error: string }[] = [];
        let designs = 0;
        let clean = 0;
        for (const file of listFiles(dir!)) {
            const xml = readFileSync(file, "utf8");
            try {
                const info = getSSWXMLBasicInfo(xml);
                if (!info || info.mech_type !== "BattleMech") {
                    const type = info?.mech_type || "(not an SSW 'Mech)";
                    skipped.set(type, (skipped.get(type) ?? 0) + 1);
                    continue;
                }
                const mech = new BattleMech();
                mech.importSSWXML(xml);
                designs++;
                const unresolved = mech.getSSWUnresolved();
                if (unresolved.length === 0) clean++;
                for (const item of unresolved) {
                    const key = `${item.kind}|${item.name.toLowerCase()}`;
                    const entry = names.get(key) ?? { kind: item.kind, name: item.name, count: 0, designs: [] };
                    entry.count++;
                    if (entry.designs.length < 5) entry.designs.push(`${mech.getName()} ${mech.model}`);
                    names.set(key, entry);
                }
            } catch (error) {
                failures.push({ file, error: String(error) });
            }
        }
        const report = {
            designs, clean, skipped: Object.fromEntries(skipped), failures,
            unresolved: [...names.values()].sort((a, b) => b.count - a.count),
        };
        writeFileSync(process.env.SSW_AUDIT_OUT ?? "ssw-audit.json", JSON.stringify(report, null, 2));
    }, 1_800_000);
});
