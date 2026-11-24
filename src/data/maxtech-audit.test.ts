import { writeFileSync } from "node:fs";
import { describe, it } from "vitest";
import { getEquipmentCatalogDefinitions } from "./equipment-registry";

// Dev audit (#612): lists the records the Maximum Tech master table (p.118) prints and whether each carries both Master Rules
// editions. Skipped unless MAXTECH_AUDIT=1.
const rows: [string, string][] = [
    ["is", "ER Large Laser"], ["is", "^ER Medium Laser$"], ["is", "^ER Small Laser$"], ["is", "^Flamer$"],
    ["is", "^Large Laser$"], ["is", "^Medium Laser$"], ["is", "^Small Laser$"], ["is", "^PPC$"], ["is", "^ER PPC$"],
    ["is", "Large Pulse Laser"], ["is", "Medium Pulse Laser"], ["is", "Small Pulse Laser"],
    ["is", "X-Pulse"], ["is", "^Anti-Missile System$|^AMS$"], ["is", "Long Tom Cannon"], ["is", "Sniper Cannon"], ["is", "Thumper Cannon"],
    ["is", "^(Autocannon|AC)/?\\s?(2|5|10|20)$"], ["is", "Flamer \\(Vehicle\\)|Vehicle Flamer"], ["is", "Heavy Flamer"], ["is", "^Gauss Rifle$"],
    ["is", "^Light Gauss Rifle$"], ["is", "Grenade Launcher"], ["is", "^LB \\d+-X"], ["is", "^Light AC"], ["is", "^Machine Gun$"], ["is", "^Ultra AC"],
    ["is", "^LRM \\d+$"], ["is", "^MRM \\d+$"], ["is", "^Narc"], ["is", "^SRM \\d$"], ["is", "^Streak SRM"], ["is", "^Thunderbolt \\d+$"],
    ["is", "^Arrow IV"], ["is", "^Long Tom$"], ["is", "^Sniper$"], ["is", "^Thumper$"],
    ["is", "^A-Pod|Anti-Personnel Pod"], ["is", "^Artemis IV"], ["is", "^Beagle"], ["is", "^Bloodhound"], ["is", "^CASE$"], ["is", "^CASE II$"],
    ["is", "^C3 Computer|^C3 Master"], ["is", "^C3 Slave"], ["is", "^Coolant Pod"], ["is", "^Angel ECM"], ["is", "^Guardian ECM"], ["is", "^Hatchet"],
    ["is", "^Sword"], ["is", "^MASC"], ["is", "^Null"], ["is", "PPC w/ Capacitor"], ["is", "^Supercharger"], ["is", "^Targeting Computer"],
    ["is", "^TAG$"], ["is", "^Triple|^TSM"], ["is", "Laser AMS"],
    ["clan", "ER Large Laser|Large ER Laser"], ["clan", "ER Medium Laser"], ["clan", "ER Small Laser"], ["clan", "ER Micro Laser"],
    ["clan", "ER Pulse"], ["clan", "Heavy Laser"], ["clan", "Flamer"], ["clan", "Pulse Laser"], ["clan", "ER PPC"],
    ["clan", "Heavy Machine Gun"], ["clan", "Light Machine Gun"], ["clan", "Machine Gun"], ["clan", "^ATM"], ["clan", "Streak LRM"], ["clan", "Grenade Launcher"],
    ["clan", "CASE II"], ["clan", "Coolant Pod"], ["clan", "Laser Heat Sink"], ["clan", "Supercharger"], ["clan", "Active Probe"], ["clan", "Light TAG"],
];

describe.skipIf(!process.env.MAXTECH_AUDIT)("Maximum Tech master table audit", () => {
    it("lists records and their Master Rules editions", () => {
        const all = getEquipmentCatalogDefinitions().flatMap((d) => d.equipment);
        const lines: string[] = [];
        for (const [side, pattern] of rows) {
            const re = new RegExp(pattern, "i");
            const hits = all.filter((e) => re.test(e.name)
                && (side === "clan" ? (e.techBase === "clan" || /clan/i.test(e.tag)) : (e.techBase !== "clan" && !/clan/i.test(e.tag)))
                && !/\(OS\)|\(I-OS\)|prototype|ammo/i.test(e.name + e.tag));
            for (const h of hits) {
                lines.push(`${side} | ${h.tag} | ${["master-rules", "master-rules-revised"].map((ed) => ((h.editions ?? []).includes(ed) ? "Y" : "-")).join("")}`);
            }
            if (!hits.length) { lines.push(`${side} | NO RECORD for ${pattern}`); }
        }
        writeFileSync(process.env.MAXTECH_AUDIT_OUT ?? "maxtech-audit.txt", lines.filter((l) => !l.endsWith("YY")).join("\n"));
    });
});
