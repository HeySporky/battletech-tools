/**
 * The books, printings and errata documents a calculation step may cite (#599).
 *
 * A citation in the app is a claim that the page was read in this printing. Add a source here only for a document
 * our reference library holds, with the printing as the library's index gives it.
 */
export interface ICalcSource {
    /** The abbreviation printed in a citation: "TM", "TM errata v8.0". */
    short: string;
    title: string;
    /** The printing or version that was read. */
    printing: string;
    /** For an errata or revision document: the id of the book it corrects. */
    errataOf?: string;
}

export const CALC_SOURCES: Record<string, ICalcSource> = {
    "tm": { short: "TM", title: "TechManual", printing: "Corrected Sixth Printing (2021)" },
    "tm-errata-8.0": { short: "TM errata v8.0", title: "TechManual errata", printing: "v8.0 (22 August 2024)", errataOf: "tm" },
    "tm-bv-tables-4.1": { short: "TM Battle Value tables v4.1", title: "TechManual Battle Value tables", printing: "v4.1", errataOf: "tm" },
    "tm-errata-6.0": { short: "TM errata v6.0", title: "TechManual errata", printing: "v6.0 (12 February 2022)", errataOf: "tm" },
    "cbt-companion": { short: "CBT Companion", title: "Classic BattleTech RPG Companion (MechWarrior, 3rd Edition)", printing: "FanPro 10975, Battle Armor Construction pp.187-191" },
    "tm-bv-2.1": { short: "TM BV 2.1", title: "TechManual: Revised Battle Value rules (BV 2.1)", printing: "Revision of 2017", errataOf: "tm" },
    "tw": { short: "TW", title: "Total Warfare", printing: "Corrected Eleventh Printing (2024)" },
    "tw-errata-11.01": { short: "TW errata v11.01", title: "Total Warfare errata", printing: "v11.01 (17 September 2023)", errataOf: "tw" },
    "toaue": { short: "TO:AUE", title: "Tactical Operations: Advanced Units & Equipment", printing: "2022 printing" },
    "toaue-errata-7.0": { short: "TO:AUE errata v7.0", title: "Tactical Operations: Advanced Units & Equipment errata", printing: "v7.0 (23 September 2023)", errataOf: "toaue" },
    "ioae": { short: "IO:AE", title: "Interstellar Operations: Alternate Eras", printing: "2022 printing" },
    "bmr": { short: "BMR", title: "BattleTech Master Rules", printing: "FASA 1707 (1998)" },
    "bmr-errata": { short: "BMR errata", title: "Classic BattleTech Master Rules errata (FanPro printings)", printing: "As of 1 October 2004", errataOf: "bmr" },
    "bmrr": { short: "BMR(R)", title: "BattleTech Master Rules, Revised Edition", printing: "FanPro 35000 (2005 printing)" },
    "gothic": { short: "Gothic", title: "BattleTech Gothic", printing: "CGL 2025 PDF, by printed page" },
    "tro-3060": { short: "TRO 3060", title: "Technical Readout: 3060", printing: "FanPro 10987, Corrected Fifth Printing (2003), scan, by printed page" },
    "tro-3060-cgl": { short: "TRO 3060 (CGL)", title: "Technical Readout: 3060", printing: "CGL 2010 PDF, by printed page" },
    "tro-3075": { short: "TRO 3075", title: "Technical Readout: 3075", printing: "CGL 2008 PDF, by printed page" },
    "tro-prototypes": { short: "TRO: Prototypes", title: "Technical Readout: Prototypes", printing: "CGL 2011 PDF, by printed page" },
    "wor": { short: "WoR", title: "The Wars of Reaving", printing: "CGL 2011 PDF, by printed page" },
    "at2": { short: "AT2", title: "AeroTech 2", printing: "FASA 1718 (2000), scan" },
    "at2r": { short: "AT2R", title: "AeroTech 2, Revised Edition", printing: "FanPro 35011 (2004), scan" },
    "mt": { short: "Max Tech", title: "Maximum Tech", printing: "FASA 1700, Corrected Second Printing (1999)" },
    "mt-revised": { short: "Max Tech (Revised)", title: "Maximum Tech, Revised Edition", printing: "FanPro 35013, PDF version 1.0 (2005)" },
    // Published record sheets, cited where a sheet prints a Battle Value (#599). A record sheet page carries no page
    // number of its own: the page given is the page of the PDF, except where the printing says otherwise.
    "rs-dark-age": { short: "RS: Dark Age", title: "Record Sheets: Dark Age", printing: "2022 PDF, by PDF page" },
    "rs-jihad": { short: "RS: Jihad", title: "Record Sheets: Jihad", printing: "2022 PDF, by PDF page" },
    "rs-tro3150": { short: "RS: TRO 3150", title: "Record Sheets: Technical Readout 3150", printing: "2022 PDF, by PDF page" },
    "rs-3145-ntnu": { short: "RS: 3145 NTNU", title: "Record Sheets: 3145 New Tech, New Upgrades", printing: "2013 PDF, by PDF page" },
    "rs-prototypes": { short: "RS: Prototypes", title: "Record Sheets: Prototypes", printing: "2012 PDF, by PDF page" },
    "rs-shrapnel-2": { short: "RS: Shrapnel Year 2", title: "Record Sheets: Shrapnel Magazine, Year 2", printing: "2026 PDF, by PDF page" },
    "rg-ilclan-3": { short: "RG: ilClan 3", title: "Recognition Guide: ilClan, vol. 3", printing: "2022 PDF, by PDF page" },
    "rg-ilclan-4": { short: "RG: ilClan 4", title: "Recognition Guide: ilClan, vol. 4", printing: "2022 PDF, by PDF page" },
    "rg-ilclan-10": { short: "RG: ilClan 10", title: "Recognition Guide: ilClan, vol. 10", printing: "2022 PDF, by PDF page" },
    "rg-ilclan-11": { short: "RG: ilClan 11", title: "Recognition Guide: ilClan, vol. 11", printing: "2022 PDF, by PDF page" },
    "rg-ilclan-21": { short: "RG: ilClan 21", title: "Recognition Guide: ilClan, vol. 21", printing: "2022 PDF, by PDF page" },
    "rg-ilclan-23": { short: "RG: ilClan 23", title: "Recognition Guide: ilClan, vol. 23", printing: "2022 PDF, by PDF page" },
    "rg-ilclan-26": { short: "RG: ilClan 26", title: "Recognition Guide: ilClan, vol. 26", printing: "2022 PDF, by PDF page" },
    "tro-golden-century": { short: "TRO: Golden Century", title: "Technical Readout: Golden Century", printing: "2020 PDF" },
    "tro-3085": { short: "TRO 3085", title: "Technical Readout: 3085", printing: "2010 PDF, by printed page" },
    "tro-3039": { short: "TRO 3039", title: "Technical Readout: 3039", printing: "2008 PDF, by printed page" },
    "tts-tortuga-prime": { short: "TtS: Tortuga Prime", title: "Touring the Stars: Tortuga Prime", printing: "2018 PDF, by printed page" },
    "tro-irregulars": { short: "TRO: Irregulars", title: "Technical Readout: Irregulars", printing: "2021 PDF, by PDF page" },
    "xtro-clans": { short: "XTRO: Clans", title: "Experimental Technical Readout: Clans", printing: "2011 PDF, by PDF page" },
    "xtro-royal-fantasy": { short: "XTRO: Royal Fantasy", title: "Experimental Technical Readout: Royal Fantasy", printing: "2014 PDF, by PDF page" },
    // Fan-made, Custom Homebrew (#173). The document carries no page numbers: the page given is the page of the PDF.
    "best-of-future-wars": { short: "Best of FW", title: "The Best of Future Wars, Volume One (fanzine reprint)", printing: "1991, by printed page" },
    "micro-mechs-6.1.0.2": { short: "Micro-Mechs 6.1.0.2", title: "Micro-Mechs (by Solarmech; revised, with appendices by Discord)", printing: "Version 6.1.0.2, by PDF page" },
    "ioae-errata-3.01": { short: "IO:AE errata v3.01", title: "Interstellar Operations: Alternate Eras errata", printing: "v3.01 (17 January 2023)", errataOf: "ioae" },
};
