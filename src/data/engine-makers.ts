// The makers the Engine Table names for each fusion engine rating, by rules edition. A Technical Readout uses
// them as the power plant's make when the player has entered none.
//
// Kept apart from the edition stats in mech-engine-types.ts on purpose: those inherit from the edition before
// (a null entry), but later tables rename makers (from the BattleTech Manual on, 125 is a Vlar, not a Nissan), so
// an edition gets makers only once its own table is entered here.

// Ratings 10, 15, ... 400 in order (79 entries).
const ratings = (makers: string[]): Record<number, string> =>
    Object.fromEntries(makers.map((maker, index) => [10 + index * 5, maker]));

// Engine Table, BD p.23 ("Name"). BT2 p.37 ("Manufacturer") prints the same makers.
// Errata (user ruling, 2026-10-07, obvious misprints corrected): BD prints "Nisson" at 195, BT2 at 195 and 200;
// every other entry, and both books' worked example and listings, spell it Nissan.
const firstEngineTable = ratings([
    "Omni", "GM", "Pitban", "Omni", "Nissan", "VOX", "GM", "GM", "DAV", "VOX", // 10-55
    "Leenex", "Nissan", "Omni", "GM", "VOX", "DAV", "DAV", "Nissan", "Hermes", "DAV", // 60-105
    "GM", "GM", "GM", "Nissan", "Vlar", "Magna", "Hermes", "Leenex", "Omni", "Nissan", // 110-155
    "LTV", "VOX", "DAV", "Omni", "GM", "GM", "DAV", "Nissan", "Nissan", "Vlar", // 160-205
    "GM", "CoreTek", "DAV", "VOX", "Leenex", "GM", "Pitban", "Magna", "Magna", "Strand", // 210-255
    "Magna", "Vlar", "GM", "CoreTek", "VOX", "Pitban", "Omni", "GM", "Vlar", "GM", // 260-305
    "Magna", "GM", "Pitban", "VOX", "VOX", "Leenex", "VOX", "Vlar", "Magna", "LTV", // 310-355
    "Hermes", "Hermes", "Magna", "GM", "GM", "LTV", "Magna", "Hermes", "LTV", // 360-400
]);

// Engine Table, BTM p.88; BTC p.114, BT3 p.44, CRoW p.103 and BT4 p.41 print the same makers. It differs from the
// first table at 125-155 (the makers move up a row and 150-155 are GM) and spells "Core Tek". BTM, BTC, CRoW and BT4
// print 280 as "Vox", BT3 as "VOX": one maker, kept as VOX like the rest of the table.
const laterEngineTable: Record<number, string> = {
    ...firstEngineTable,
    125: "Vlar", 130: "Magna", 135: "Hermes", 140: "Leenex", 145: "Omni", 150: "GM", 155: "GM",
    215: "Core Tek", 275: "Core Tek",
};

// The Master Rules tables (MR p.111, MRR p.117) give tonnages only, so those editions name no maker.
const engineMakersByEdition: Record<string, Record<number, string>> = {
    "battledroids": firstEngineTable,
    "battletech-2nd-edition": firstEngineTable,
    "battletech-manual": laterEngineTable,
    "battletech-compendium": laterEngineTable,
    "battletech-3rd-edition": laterEngineTable,
    "compendium-rules-of-warfare": laterEngineTable,
    "battletech-4th-edition": laterEngineTable,
};

/** The maker the edition's Engine Table names for a fusion engine rating, if the table is entered. */
export function getEngineTableMaker(editionTag: string | undefined, rating: number): string | undefined {
    return editionTag ? engineMakersByEdition[editionTag]?.[rating] : undefined;
}
