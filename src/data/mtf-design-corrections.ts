export interface IDesignCorrection {
    /** MegaMek file: replaces the file's "key:value" lines (keys in lower case, as parseMtfFile reads them). */
    values?: Record<string, string>;
    /** MegaMek file: replaces slots, by the file's location name and the slot's number from 1 ("Medium Laser (R)"). */
    slots?: Record<string, Record<number, string>>;
    /**
     * Skunk Werks file: each location's patchwork armor as "type:techbase" (SSW's names; 0 Inner Sphere, 1 Clan), and
     * equipment renamed in the design or, keyed with its name, one OmniMech configuration.
     */
    ssw?: { patchwork?: Record<string, string>; equipment?: Record<string, string> };
    source: string;
}

// RS Dark Age p.224 prints patchwork: reactive limbs, Clan standard torsos and head. The SSW files put reactive everywhere.
const ZEUS_X: IDesignCorrection = {
    ssw: {
        patchwork: {
            hd: "Standard Armor:1", ct: "Standard Armor:1", lt: "Standard Armor:1", rt: "Standard Armor:1",
            la: "Reactive Armor:0", ra: "Reactive Armor:0", ll: "Reactive Armor:0", rl: "Reactive Armor:0",
        },
    },
    source: "Record Sheets: Dark Age (RS Dark Age) p.224",
};
// RG24 p.5 prints Improved Heavy Medium Lasers; the SSW files list plain ones (their D configuration has Improved).
const SKINWALKER_B: IDesignCorrection = {
    ssw: { equipment: { "(CL) Heavy Medium Laser": "(CL) Improved Heavy Medium Laser" } },
    source: "Recognition Guide: ilClan Vol. 24 p.5, BV 2,851",
};

/**
 * Bundled designs whose file differs from the newest printed sheet, by "chassis model" (an SSW OmniMech
 * configuration adds its name), with the sheet for each. Applied on import, so the bundle and a player's own import
 * of the file both get the printed design.
 */
export const DESIGN_CORRECTIONS: Record<string, IDesignCorrection> = {
    "Zeus X ZEU-X": ZEUS_X, "Zeus X ZEU-X2": ZEUS_X, "Zeus ZEU-X": ZEUS_X, "Zeus ZEU-X2": ZEUS_X,
    "Skinwalker (Ryoken III) B": SKINWALKER_B, "Ryoken III (Skinwalker) B": SKINWALKER_B,
    // The MegaMek files follow the CO pp.213-214 example; the newer sheets print other armor on plain 60-ton structure.
    "Hybrid Rifleman RFL-3N (Sneede)": {
        values: {
            "hd armor": "9", "lt armor": "22", "rt armor": "15", "la armor": "20", "ra armor": "20", "ct armor": "22",
            "ll armor": "16", "rl armor": "16", "rtc armor": "4", "rtl armor": "6", "rtr armor": "2",
            "la structure": "60", "lt structure": "60",
        },
        source: "ForcePack Record Sheets: Snord's Irregulars (2023), BV 1,269",
    },
    "Hybrid Rifleman RFL-3N (Sneede II)": {
        values: {
            "hd armor": "9", "lt armor": "20", "rt armor": "21", "la armor": "15", "ra armor": "19", "ct armor": "28",
            "ll armor": "24", "rl armor": "24", "rtc armor": "9", "rtl armor": "6", "rtr armor": "7",
            "la structure": "60", "lt structure": "60",
        },
        source: "ForcePack Record Sheets: Snord's Irregulars (2023), BV 2,198",
    },
    // The right leg is a TMP-3M Tempest's (65 tons; MegaMek has 90). The printed 1,475 takes -1 per HVAC/10 slot;
    // TO:AUE p.195 (errata v7.0) counts one slot, so ours is 1,481.
    "Temax Cat Ninjabolt TMC-NB": {
        values: { "rtr armor": "6", "rl structure": "IS Endo Steel:65" },
        source: "XTRO: Boondocks (2010) p.6",
    },
    // The sheet's second medium laser in each side torso fires to the rear (marked (R)); the MegaMek file mounts both
    // facing forward.
    "BattleMaster BLR-3M (Rogers)": {
        slots: { "Left Torso": { 7: "Medium Laser (R)" }, "Right Torso": { 4: "Medium Laser (R)" } },
        source: "Operational Turning Points: Falcon Incursion (2011), record sheet (PDF p.32), BV 1,818",
    },
    // The readout armors the cockpit and both sensors as well as the engine; the MegaMek file armors only the engine.
    // It is a FrankenMech: a Marauder MAD-5R's arms (75 tons; 12 structure points each, as the readout prints) on the
    // Warhammer, all IS endo steel. The MegaMek file builds it as a plain 70-ton Warhammer (11 a side).
    "Warhammer WHM-X7 'The Lich'": {
        values: {
            "config": "Biped FrankenMek", "structure": "Hybrid",
            "hd structure": "IS Endo Steel:70", "ct structure": "IS Endo Steel:70", "lt structure": "IS Endo Steel:70",
            "rt structure": "IS Endo Steel:70", "la structure": "IS Endo Steel:75", "ra structure": "IS Endo Steel:75",
            "ll structure": "IS Endo Steel:70", "rl structure": "IS Endo Steel:70",
        },
        slots: { "Head": { 2: "Sensors (ARMORED)", 3: "Cockpit (ARMORED)", 5: "Sensors (ARMORED)" } },
        source: "XTRO: Gladiators (2010) p.7, BV 1,807",
    },
    // The readout mounts a third set of Spikes in the head; the MegaMek file has only the side torsos'.
    "Celerity CLR-03OMM 'Rajah'": {
        slots: { "Head": { 5: "Spikes" } },
        source: "XTRO: Royal Fantasy (2014) p.6, BV 278",
    },
};

/** A design's key: its non-empty parts, one space apart (an SSW file's model can be empty). */
const designKey = (...parts: unknown[]): string => parts.map((part) => String(part ?? "").trim()).filter(Boolean).join(" ");

/** Corrects a parsed Skunk Werks file (parseSSWXML) to its design's printed sheet, when the table has the design. */
export const correctSSWDesign = (jObj: any, corrections = DESIGN_CORRECTIONS): void => {
    const mech = jObj?.mech;
    if (!mech) return;
    const chassis = designKey(mech["@_name"], mech["@_model"]);
    const patchwork = corrections[chassis]?.ssw?.patchwork;
    if (patchwork && mech.armor) {
        // The file's slots belong to its old armor: the import places the patchwork armor's slots itself.
        mech.armor.type = "Patchwork Armor";
        delete mech.armor.location;
        for (const [location, armor] of Object.entries(patchwork)) {
            const [type, techbase] = armor.split(":");
            mech.armor[location] = { "#text": mech.armor[location]?.["#text"] ?? mech.armor[location], "@_type": type, "@_techbase": techbase };
        }
    }
    const rename = (loadout: any, key: string) => {
        const names = corrections[key]?.ssw?.equipment ?? {};
        for (const item of [].concat(loadout?.equipment ?? []) as any[]) {
            const name = names[item.name?.["#text"] ?? item.name];
            if (name) item.name = typeof item.name === "object" ? { ...item.name, "#text": name } : name;
        }
    };
    rename(mech.baseloadout, chassis);
    for (const loadout of [].concat(mech.loadout ?? []) as any[]) rename(loadout, designKey(chassis, loadout["@_name"]));
};
