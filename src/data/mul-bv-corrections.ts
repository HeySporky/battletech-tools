import type { IASMULUnit } from "../classes/alpha-strike-unit";

/**
 * Battle Values the live MUL has wrong, by live MUL id, with the source for each (#354). The live MUL keeps
 * RS:3075's IndustrialMech figures, which took the x0.9 for no Advanced Fire Control off the whole BV instead of the
 * Offensive Battle Rating alone (TM p.304, BV errata v4.1); MUL: Battle Values v1.0 printed the corrected ones.
 */
export const MUL_BV_CORRECTIONS: Record<number, { bv: number; source: string }> = {
    // MUL: Battle Values prints 353, counting Nail/Rivet Gun ammo at 1 BV a ton; TM p.317 gives it 0.
    103087: { bv: 352, source: "Jabberwocky JAW-66D: TM p.304, p.317 (live MUL 326)" },
    107159: { bv: 250, source: "Jabberwocky JAW-65A: TM p.304, not in MUL: Battle Values v1.0 (live MUL 230)" },
    108513: { bv: 350, source: "Jabberwocky JAW-66B: MUL: Battle Values v1.0 p.174 (live MUL 322)" },
    100674: { bv: 680, source: "Quasit QUA-51M: MUL: Battle Values v1.0 p.174 (live MUL 636)" },
    106363: { bv: 826, source: "Quasit QUA-51P: MUL: Battle Values v1.0 p.174 (live MUL 779)" },
    // #371. The MUL and MUL: Battle Values p.173 count each ton of Nail/Rivet Gun ammo at 1 BV; TM p.317 gives it 0.
    102180: { bv: 1227, source: "Diomede D-M3D-3: TM p.317 (live MUL 1228)" },
    101073: { bv: 1234, source: "Diomede D-M3D-4: TM p.317 (live MUL 1235)" },
    // Commercial armor counts half (TM p.315), as the MUL's own PTN-2 (143) has it; MegaMek also gets 73.
    100319: { bv: 73, source: "Patron PTN-1: TM p.315 (live MUL 107, as MUL: Battle Values v1.0 p.174)" },
    // #171, Command Console designs. The live MUL takes the Kisos' x0.9 for no Advanced Fire Control; their RS:3075
    // sheets print the BV with it. MUL: Battle Values v1.0 p.174 agrees for the KR4 but prints 959 for the KR5.
    100143: { bv: 954, source: "Kiso K-3N-KR4: RS:3075 record sheet, MUL: Battle Values v1.0 p.174 (live MUL 946)" },
    104760: { bv: 1091, source: "Kiso K-3N-KR5: RS:3075 record sheet (live MUL 1082; MUL: Battle Values v1.0 p.174 prints 959)" },
    // #241. TO:AUE (4th printing) prices 'Mech Mortar ammo at 1/2/3/6 BV a ton (p.194 IS, p.197 Clan, page images
    // checked); the MUL counts 1.2/2.4/3.6/7.2, as MegaMek does, with no printed source.
    103887: { bv: 64, source: "Flatbed Truck (Mortar): TO:AUE p.194 (live MUL 65)" },
    108544: { bv: 1759, source: "Gurzil Support Tank: TO:AUE p.197 (live MUL 1765)" },
    103072: { bv: 507, source: "Mortar Carrier: TO:AUE p.194 (live MUL 517)" },
    108066: { bv: 2278, source: "Atlas AS7-S3-DC: Recognition Guide: ilClan Vol. 24 record sheet (live MUL 2276)" },
    // #109. The printed sheet's 3,107 is TM + IO:AE (Clan ER PPC w/ Capacitor 548, IO:AE p.190) to the point.
    105956: { bv: 3107, source: "Ryoken III (Skinwalker) E: Recognition Guide: ilClan Vol. 24 p.5 (live MUL 3102)" },
};

/** A live MUL entry with its Battle Value corrected, when the table has one. */
export function correctMULBattleValue<T extends Pick<IASMULUnit, "Id" | "BattleValue">>(unit: T): T {
    const correction = MUL_BV_CORRECTIONS[unit.Id];
    return correction ? { ...unit, BattleValue: correction.bv } : unit;
}
