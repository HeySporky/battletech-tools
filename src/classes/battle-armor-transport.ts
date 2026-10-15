import BattleArmor, { BattleArmorCarrierKind } from "./battle-armor";

// The carrier's side of mechanized battle armor (Total Warfare pp.226-227): what a 'Mech or vehicle may not do
// while a squad rides it. The squad's side (where each trooper rides, hits on the carrier) is in battle-armor.ts.

export interface IBattleArmorCarrier {
    uuid: string;
    name: string;
    kind: BattleArmorCarrierKind;
    /** Is the unit an Omni? null where the unit does not record it. */
    omni: boolean | null;
}

export interface IBattleArmorCarrierLoad {
    /** The squads riding the unit that still have a trooper on it. */
    riders: BattleArmor[];
    /** Location tags whose weapons may not fire: "rt", "lt", "ct" on a 'Mech; side and rear tags on a vehicle. */
    blockedLocations: string[];
    /** Walking or Cruising MP lost: 1 for a unit that is not an Omni. */
    walkingPenalty: number;
    /** No VTOL, WiGE or Jumping MP (vehicles). */
    noJump: boolean;
    /** No dumping ammunition, with a trooper on the rear. */
    noAmmoDump: boolean;
    /** What breaks the rules. */
    issues: string[];
    /** What the carrier's player needs to know. */
    notes: string[];
}

const MECH_LOCATIONS: Record<string, string> = {
    "Right Torso": "rt", "Right Torso (rear)": "rt", "Left Torso": "lt", "Left Torso (rear)": "lt", "Center Torso": "ct", "Center Torso (rear)": "ct",
};
// A Super-Heavy vehicle's sides are its front and rear side locations.
const VEHICLE_LOCATIONS: Record<string, string[]> = {
    "Right Side": ["right", "frontRight", "rearRight"], "Left Side": ["left", "frontLeft", "rearLeft"], Rear: ["rear"],
};

/** What riding squads do to one of the force's 'Mechs or vehicles. */
export const getBattleArmorCarrierLoad = (squads: BattleArmor[], carrier: IBattleArmorCarrier): IBattleArmorCarrierLoad => {
    const riders = squads.filter((squad) => squad.getRiding()?.uuid === carrier.uuid && !squad.isDestroyed());
    const load: IBattleArmorCarrierLoad = { riders, blockedLocations: [], walkingPenalty: 0, noJump: false, noAmmoDump: false, issues: [], notes: [] };
    if (riders.length === 0) return load;

    const positions: string[] = [];
    for (const squad of riders) {
        for (const position of squad.getOccupiedPositions(carrier.kind)) if (!positions.includes(position)) positions.push(position);
    }
    for (const position of positions) {
        const tags = carrier.kind === "mech" ? [MECH_LOCATIONS[position]] : VEHICLE_LOCATIONS[position] ?? [];
        for (const tag of tags) if (tag && !load.blockedLocations.includes(tag)) load.blockedLocations.push(tag);
    }
    load.noAmmoDump = positions.some((position) => position === "Rear" || position.endsWith("(rear)"));
    load.noJump = carrier.kind === "vehicle";
    load.walkingPenalty = carrier.omni === false ? 1 : 0;

    const names = riders.map((squad) => squad.getDisplayName()).join(", ");
    load.notes.push(`Carrying ${names} (${positions.join(", ")}).`);
    load.notes.push(carrier.kind === "mech"
        ? "A torso-mounted weapon may not fire from a location a trooper occupies, nor a weapon any part of which is there (TW p. 226)."
        : "A weapon in a side or rear location a trooper occupies may not fire; turret weapons may (TW p. 226).");
    if (load.noJump) load.notes.push("The vehicle may spend no VTOL, WiGE or Jumping MP while it carries battle armor (TW p. 227).");
    if (load.walkingPenalty > 0) load.notes.push(`Not an Omni: -1 ${carrier.kind === "mech" ? "Walking" : "Cruising"} MP while it carries the squad (TW p. 227).`);
    else if (carrier.omni === null) load.notes.push("If the unit is not an Omni it loses 1 Cruising MP while it carries the squad (TW p. 227).");
    if (load.noAmmoDump) load.notes.push("With a trooper on the rear, it may not dump ammunition (TW p. 227).");

    if (riders.length > 1) load.issues.push(`${carrier.name} carries ${riders.length} battle armor units; a carrier may transport one at a time (TW p. 226).`);
    for (const squad of riders) {
        if (carrier.omni === false && !squad.hasMagneticClamps()) load.issues.push(`${squad.getDisplayName()} has no magnetic clamps and may only ride an Omni (TW p. 227).`);
    }
    return load;
};

/** May this weapon of the carrier not fire? A weapon spread over locations is blocked if any of them is occupied. */
export const isCarrierWeaponBlocked = (load: IBattleArmorCarrierLoad, weapon: { location?: string; split_location?: { loc: string }[] }): boolean => {
    if (load.blockedLocations.length === 0) return false;
    const locations = [weapon.location ?? "", ...(weapon.split_location ?? []).map((split) => split.loc)].map((tag) => tag.toLowerCase());
    return locations.some((tag) => load.blockedLocations.some((blocked) => blocked.toLowerCase() === tag));
};
