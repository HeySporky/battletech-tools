/*
 * DISCLAIMER: This file processes gameplay data derived from the BattleTech universe.
 * All official lore, trademarks, and intellectual property belong strictly to
 * Catalyst Game Labs, Topps, and/or their respective corporate rights holders.
 */

// Vehicle rules the books print differently by printing (NGCFells 2026-11-23, #600, #599). The first printing of each
// rule is the default; a later or earlier printing is chosen per design and saved with it. A printing a newer book
// replaced stays available, marked apocryphal, and is never removed.

export interface IVehiclePrinting {
    tag: string;
    name: string;
    /** Where the rule is printed this way. */
    cites: string;
    /** Replaced by a later printing but kept: the design may still choose it. */
    apocryphal: boolean;
}

export interface IVehiclePrintedRule {
    id: string;
    name: string;
    /** The default printing first. */
    printings: IVehiclePrinting[];
}

export const SUPER_HEAVY_VTOL_FACINGS = "super-heavy-vtol-facings";
export const TURRET_WEAPON_ARC = "turret-weapon-arc";

export const VEHICLE_PRINTED_RULES: IVehiclePrintedRule[] = [
    {
        id: SUPER_HEAVY_VTOL_FACINGS,
        name: "Super-Heavy VTOL facings",
        printings: [
            { tag: "to-aue", name: "Tactical Operations: Advanced Units & Equipment (four facings and a rotor)", cites: "TO:AUE p.190", apocryphal: false },
            { tag: "to-2008", name: "Tactical Operations, 2008 and 2012 printings (six facings and a rotor)", cites: "TO p.378 (2008, 2012)", apocryphal: true },
        ],
    },
    {
        id: TURRET_WEAPON_ARC,
        name: "Turret weapons in Battle Value",
        printings: [
            { tag: "tm-6th", name: "TechManual 2007 and 6th printing, BV v4.1 (turret weapons are in no arc and count in full)", cites: "TM p.307 (2007, 6th printing), BV v4.1", apocryphal: false },
            { tag: "tm-3rd-4th", name: "TechManual 3rd and 4th printings, BV v4.0 and 2.1 (turret weapons always face forward)", cites: "TM p.307 (3rd, 4th printings), BV v4.0, BV 2.1", apocryphal: true },
        ],
    },
];

export const getVehiclePrintedRule = (id: string): IVehiclePrintedRule | undefined => VEHICLE_PRINTED_RULES.find((rule) => rule.id === id);

/** The printing of a rule a design chose, or the default; an unknown tag falls back to the default. */
export const getVehiclePrinting = (ruleId: string, tag: string | undefined): IVehiclePrinting | undefined => {
    const rule = getVehiclePrintedRule(ruleId);
    return rule?.printings.find((printing) => printing.tag === tag) ?? rule?.printings[0];
};
