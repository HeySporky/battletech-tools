import { getPrintedDroid, IPrintedDroid, PrintedDroidLocation } from "../data/battledroids-mechs";
import { BattleMech, ICriticalSlot } from "./battlemech";

const criticalKeys: Record<PrintedDroidLocation, string> = {
    hd: "head", ct: "centerTorso", lt: "leftTorso", rt: "rightTorso", la: "leftArm", ra: "rightArm", ll: "leftLeg", rl: "rightLeg",
};

/** The first slot in a location where `size` critical slots in a row are free, or -1. */
const freeRun = (slots: unknown[], size: number): number =>
    slots.findIndex((_, start) => start + size <= slots.length && slots.slice(start, start + size).every(slot => !slot));

/**
 * The printed droid as a design under the Battledroids edition: chassis, movement, heat sinks, armor as printed, and
 * each item placed in the location its listing gives.
 */
export function buildPrintedDroid(droid: IPrintedDroid): BattleMech {
    const mech = new BattleMech();
    mech.setTech("is");
    mech.setRulesEdition("battledroids");
    mech.setModel(droid.model);
    mech.setName(droid.name);
    mech.setTonnage(droid.tonnage);
    mech.setType(droid.mechType);
    mech.setWalkSpeed(droid.walk);
    mech.setJumpSpeed(droid.jump);
    mech.setAdditionalHeatSinks(droid.heatSinks - 10);
    mech.setArmorWeight(Math.ceil(droid.printedArmorFactor / 8) / 2);
    const { armor } = droid;
    mech.setHeadArmor(armor.head);
    mech.setCenterTorsoArmor(armor.centerTorso);
    mech.setCenterTorsoRearArmor(armor.centerTorsoRear);
    mech.setLeftTorsoArmor(armor.sideTorso);
    mech.setRightTorsoArmor(armor.sideTorso);
    mech.setLeftTorsoRearArmor(armor.sideTorsoRear);
    mech.setRightTorsoRearArmor(armor.sideTorsoRear);
    mech.setLeftArmArmor(armor.arm);
    mech.setRightArmArmor(armor.arm);
    mech.setLeftLegArmor(armor.leg);
    mech.setRightLegArmor(armor.leg);
    for (const entry of droid.equipment) {
        const item = mech.addEquipmentFromTag(entry.tag, mech.getTech().tag, entry.location, !!entry.rear, undefined, "", false, [], undefined, undefined);
        if (!item) {
            continue;
        }
        const from = mech.unallocatedCriticals.findIndex(critical => critical?.uuid === item.uuid);
        const slots = (mech.getCriticals() as unknown as Record<string, unknown[]>)[criticalKeys[entry.location]] ?? [];
        const to = from < 0 ? -1 : freeRun(slots, mech.unallocatedCriticals[from].crits);
        if (to >= 0) {
            mech.moveCritical("un", from, entry.location, to);
        }
    }
    mech.setPrintedDroid(droid.id);
    return mech;
}

/** The left-over criticals a printed droid mounts in its turret (the GOL-1H's center torso), as the sheet prints them. */
export function getPrintedTurretCriticals(mech: BattleMech): ICriticalSlot[] {
    const turret = getPrintedDroid(mech.getPrintedDroid())?.turret;
    if (!turret) {
        return [];
    }
    const inTurret = new Set(mech.getInstalledEquipment().filter(item => item.location === turret).map(item => item.uuid));
    return mech.unallocatedCriticals.filter(critical => critical && inTurret.has(critical.uuid));
}

/** The criticals still waiting for a slot: the unallocated ones, less any a printed droid mounts in its turret. */
export function getUnallocatedCriticals(mech: BattleMech): ICriticalSlot[] {
    const turret = new Set(getPrintedTurretCriticals(mech));
    return mech.unallocatedCriticals.filter(critical => !turret.has(critical));
}

/** What makes a design that design: chassis, movement, heat sinks, armor and each item where it is mounted. */
const fingerprint = (mech: BattleMech): string => {
    const saved = mech.export();
    return JSON.stringify([
        mech.getTonnage(), mech.getType().tag, mech.getTech().tag, mech.getWalkSpeed(), mech.getJumpSpeed(), mech.getHeatSinks(),
        saved.engineType, saved.gyro, saved.heat_sink_type, saved.armor_type, saved.armor_weight, saved.armor_allocation,
        mech.getInstalledEquipment().map(item => `${item.tag} ${item.location ?? ""}${item.rear ? " rear" : ""}`).sort(),
    ]);
};
const printedFingerprints = new Map<string, string>();

/** Is the design still the printed droid it was loaded from, with nothing changed? */
export function isUnmodifiedPrintedDroid(mech: BattleMech): boolean {
    const droid = getPrintedDroid(mech.getPrintedDroid());
    if (!droid) {
        return false;
    }
    if (!printedFingerprints.has(droid.id)) {
        printedFingerprints.set(droid.id, fingerprint(buildPrintedDroid(droid)));
    }
    return fingerprint(mech) === printedFingerprints.get(droid.id);
}
