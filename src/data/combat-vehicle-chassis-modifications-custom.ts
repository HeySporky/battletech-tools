import { ITechDates } from "./data-interfaces";

/*
 * ArtVee design 2026-10-20 (Custom Homebrew): the equipment that lets a tracked Combat Vehicle transform between
 * Vehicle Mode and Siege Mode. It is kept apart from the canon chassis modifications because it is a homebrew rule,
 * not a TO:AUE chassis modification, and it is not picked from the chassis modification list: the ArtVee option
 * on the vehicle turns it on.
 *
 * Precedents: LAM conversion equipment at 10% of the weight (IO:AE p.108), QuadVee conversion equipment at 10%
 * (IO:AE p.128), and the QuadVee cost rule (IO:AE p.181). The slot split and the tech rating are the design's own.
 */

export interface IArtVeeConversionEquipment {
    tag: "artvee-conversion";
    name: string;
    techBase: "universal";
    /** Weight as the vehicle's tonnage times this fraction, rounded up to the half ton. */
    weightFraction: number;
    /** Item slots taken in the vehicle body. */
    bodySlots: number;
    /** Item slots taken in the turret (the breech and collapsible barrel). */
    turretSlots: number;
    /** Added to the cost before the final multiplier: this fraction of the weapons, equipment and structure cost. */
    costFraction: number;
    /** Same dates as the combo guns. */
    dates: { is: ITechDates; clan: ITechDates };
    techRating: string;
    rulesLevel: number;
    book: string;
    page: number;
    description: string;
}

export const ARTVEE_CONVERSION_EQUIPMENT: IArtVeeConversionEquipment = {
    tag: "artvee-conversion",
    name: "ArtVee Conversion Equipment",
    techBase: "universal",
    weightFraction: 0.1,
    bodySlots: 2,
    turretSlots: 1,
    costFraction: 0.5,
    dates: {
        is: { prototype: 2690, introduced: 2700, extinct: 2865, reintroduced: 3071 },
        clan: { prototype: 2690, introduced: 2700, extinct: null, reintroduced: null },
    },
    techRating: "e",
    rulesLevel: 6,
    book: "Custom",
    page: 0,
    description: "Lets a tracked Combat Vehicle transform between Vehicle Mode and Siege Mode, where its combo gun fires as artillery. Weighs 10% of the vehicle's tonnage, rounded up to the half ton; takes 2 body and 1 turret item slots.",
};
