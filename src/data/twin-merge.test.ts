import { describe, expect, it } from "vitest";
import { equipmentMatchesIdentifier, getEquipmentCatalogDefinitions, getEquipmentListByTech } from "./equipment-registry";

// Catalog consolidation round 2 (design 2026-10-24 §2): IS/Clan pairs whose stats match and whose dates differ are one
// universal record, the Clan dates in `clanDates`. [record tag, retired tags it answers to]
const MERGED: [string, string[]][] = [
    ["modular-armor", ["clan-modular-armor"]],
    ["coolant-pod", ["clan-coolant-pod"]],
    ["full-head-ejection-system", ["clan-full-head-ejection-system"]],
    ["mass", ["clan-mass"]],
    ["harjel", ["clan-harjel"]],
    ["melee-claw", ["clan-melee-claw"]],
    ["laser-insulator", ["clan-laser-insulator"]],
    ["ammo-long-tom-copperhead", ["ammo-is-long-tom-copperhead", "ammo-clan-long-tom-copperhead"]],
    ["ammo-long-tom-thunder", ["ammo-is-long-tom-thunder", "ammo-clan-long-tom-fascam"]],
    ["ammo-mech-mortar-standard", ["ammo-is-mech-mortar-standard", "ammo-clan-mech-mortar-standard"]],
    ["ammo-sniper-copperhead", ["ammo-is-sniper-copperhead", "ammo-clan-sniper-copperhead"]],
    ["ammo-sniper-thunder", ["ammo-is-sniper-thunder", "ammo-clan-sniper-fascam"]],
    ["ammo-thumper-copperhead", ["ammo-is-thumper-copperhead", "ammo-clan-thumper-copperhead"]],
    ["ammo-thumper-thunder", ["ammo-is-thumper-thunder", "ammo-clan-thumper-fascam"]],
    ["ammo-arrow-iv-fae", ["ammo-is-arrow-iv-fae", "ammo-clan-arrow-iv-fae"]],
    ["ammo-lrt-standard", ["ammo-is-lrt-standard", "ammo-clan-lrt-standard"]],
    ["ammo-srt-standard", ["ammo-is-srt-standard", "ammo-clan-srt-standard"]],
    ["ammo-ac-2-standard", ["ammo-is-ac-2-standard", "ammo-clan-ac-2-standard"]],
    ["ammo-ac-2-flak", ["ammo-is-ac-2-flak", "ammo-clan-ac-2-flak"]],
    ["ammo-ac-2-tracer", ["ammo-is-ac-2-tracer", "ammo-clan-ac-2-tracer"]],
    ["ammo-ac-5-standard", ["ammo-is-ac-5-standard", "ammo-clan-ac-5-standard"]],
    ["ammo-ac-5-flak", ["ammo-is-ac-5-flak", "ammo-clan-ac-5-flak"]],
    ["ammo-ac-5-tracer", ["ammo-is-ac-5-tracer", "ammo-clan-ac-5-tracer"]],
    ["ammo-ac-10-standard", ["ammo-is-ac-10-standard", "ammo-clan-ac-10-standard"]],
    ["ammo-ac-10-flak", ["ammo-is-ac-10-flak", "ammo-clan-ac-10-flak"]],
    ["ammo-ac-10-tracer", ["ammo-is-ac-10-tracer", "ammo-clan-ac-10-tracer"]],
    ["ammo-ac-20-standard", ["ammo-is-ac-20-standard", "ammo-clan-ac-20-standard"]],
    ["ammo-ac-20-flak", ["ammo-is-ac-20-flak", "ammo-clan-ac-20-flak"]],
    ["ammo-ac-20-tracer", ["ammo-is-ac-20-tracer", "ammo-clan-ac-20-tracer"]],
    // Batch 2: the Clan ProtoMech column and the Clan minimum ammunition carry over.
    ["er-flamer", ["clan-er-flamer"]],
    ["heavy-flamer", ["clan-heavy-flamer"]],
    ["angel-ecm", ["clan-angel-ecm"]],
    ["long-tom-cannon", ["clan-long-tom-cannon"]],
    ["sniper-cannon", ["clan-sniper-cannon"]],
    ["thumper-cannon", ["clan-thumper-cannon"]],
    ["ammo-lrm-narc", ["ammo-is-lrm-narc", "ammo-clan-lrm-narc"]],
    ["ammo-lrm-arad", ["ammo-is-lrm-arad", "ammo-clan-lrm-arad"]],
    ["ammo-heavy-flamer-standard", ["ammo-is-heavy-flamer-standard", "ammo-clan-heavy-flamer-standard"]],
    ["ammo-heavy-flamer-coolant", ["ammo-is-heavy-flamer-coolant", "ammo-clan-heavy-flamer-coolant"]],
];

// Pairs that differ in more than dates stay apart: weight (the machine guns), editions (the A-Pod, the Arrow IV
// FASCAM, Clan-only in the 1990 Compendium, and the machine gun and Ultra AC/10 rounds), the tech rating (TAG), and
// figures an older edition prints apart for each side (Arrow IV, Gauss and Streak SRM rounds).
const KEPT_APART: [string, string][] = [
    ["machine-gun", "clan-machine-gun"], ["a-pod", "clan-a-pod"], ["ammo-is-arrow-iv-fascam", "ammo-clan-arrow-iv-fascam"],
    ["is-tag", "clan-tag"], ["ammo-is-arrow-iv-standard", "ammo-clan-arrow-iv-standard"],
    ["ammo-is-gauss-rifle-standard", "ammo-clan-gauss-rifle-standard"], ["ammo-is-streak-srm-standard", "ammo-clan-streak-srm-standard"],
    ["ammo-is-heavy-machine-gun-standard", "ammo-clan-heavy-machine-gun-standard"],
    ["ammo-is-light-machine-gun-standard", "ammo-clan-light-machine-gun-standard"],
    ["ammo-is-ultra-ac-10-standard", "ammo-clan-ultra-ac-10-standard"],
];

describe("merged IS/Clan twins", () => {
    const all = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment);

    it.each(MERGED)("%s is one universal record that both tech lists load by every old tag", (tag, retired) => {
        const record = all.find((item) => item.tag === tag)!;
        expect(record.techBase).toBe("universal");
        for (const tech of ["is", "clan"]) {
            const list = getEquipmentListByTech(tech);
            for (const old of retired) expect(list.find((item) => equipmentMatchesIdentifier(item, old))?.tag, `${tech} ${old}`).toBe(tag);
        }
        for (const old of retired) expect(all.some((item) => item.tag === old), old).toBe(false);
    });

    it.each(KEPT_APART)("keeps %s and %s apart", (is, clan) => {
        expect(all.find((item) => item.tag === is)?.techBase).toBe("is");
        expect(all.find((item) => item.tag === clan)?.techBase).toBe("clan");
    });
});
