/**
 * Power-dial weapons (#645): the canon Bombast Laser (TO:AUE p.132).
 * The firer sets the dial before declaring the attack; the setting gives the heat, to-hit, damage and effect.
 */

export type DialKind = "bombast";

export interface IDialBand {
    band: "strike";
    heat: number;
    /** To-hit modifier the setting adds. */
    toHit: number;
    /** Damage the setting does. */
    damage: number;
}

/** The band a setting falls in, with its heat, to-hit and damage. A setting outside 7-12 is held to it. */
export function getDialBand(kind: DialKind, setting: number): IDialBand {
    const s = Math.max(7, Math.min(12, Math.round(setting)));
    void kind;
    return { band: "strike", heat: s, toHit: Math.ceil((s - 7) / 2), damage: s };
}

/** The setting held to the record's dial; none chosen is the top (an old save, or a weapon never touched). */
export function clampDial(dial: { min: number; max: number }, setting: number | undefined): number {
    if (setting === undefined || !Number.isFinite(setting)) return dial.max;
    return Math.max(dial.min, Math.min(dial.max, Math.round(setting)));
}

/** A one-line label for the attack line and the picker, e.g. "Dial 9 (Bombast): 9 heat, +1 to hit, 9 damage". */
export function describeDial(kind: DialKind, setting: number): string {
    const band = getDialBand(kind, setting);
    return `Dial ${band.heat} (Bombast): ${band.heat} heat, ${band.toHit >= 0 ? "+" : ""}${band.toHit} to hit, ${band.damage} damage`;
}

/** A unit that keeps its dial settings in its E-War play state (the 'Mech, vehicle, fighter and Small Craft classes all do). */
interface IDialCarrier {
    ewarPlay: { dialSettings?: Record<string, number> };
    equipmentList?: { uuid?: string; target?: string; dial?: { min: number; max: number; kind: DialKind } }[];
}

/** The dial setting of a weapon on `unit` (no setting kept: the top, so an old save fires as it always did). */
export function getUnitDialSetting(unit: IDialCarrier, item: { uuid?: string; dial?: { min: number; max: number } }): number {
    if (!item.dial) return 0;
    return clampDial(item.dial, item.uuid ? unit.ewarPlay.dialSettings?.[item.uuid] : undefined);
}

/** Set the dial of the weapon `uuid`; ignored once the weapon is marked fired this turn (the heat already counted follows the setting fired). */
export function setUnitDialSetting(unit: IDialCarrier, uuid: string, setting: number, list: IDialCarrier["equipmentList"] = unit.equipmentList): boolean {
    const item = (list ?? []).find((candidate) => candidate.uuid === uuid);
    if (!item?.dial || item.target) return false;
    unit.ewarPlay = { ...unit.ewarPlay, dialSettings: { ...unit.ewarPlay.dialSettings, [uuid]: clampDial(item.dial, setting) } };
    return true;
}

/** The band of a dial weapon at its unit's current setting. */
export function getUnitDialBand(unit: IDialCarrier, item: { uuid?: string; dial?: { min: number; max: number; kind: DialKind } }): IDialBand | undefined {
    return item.dial ? getDialBand(item.dial.kind, getUnitDialSetting(unit, item)) : undefined;
}

/** The name of a band as the attack line shows it. */
export function dialBandName(kind: DialKind, band: IDialBand["band"]): string {
    void kind; void band;
    return "Bombast";
}

type StunItem = { sonic?: boolean };

/** Whether any of the items is a sonic projector. */
export function carriesSonicGear(items: readonly StunItem[] | undefined): boolean {
    return (items ?? []).some((item) => item.sonic);
}

/**
 * Whether a Classic force plays sonic projectors (#645, ours, Custom Homebrew): some unit carries one, or some 'Mech is
 * at the Custom Homebrew level or higher (an opposing force may fire them). Below that the hit controls stay out of the way.
 */
export function classicForceUsesSonic(groups: readonly {
    members: readonly { getRulesLevel(fallback: number): number; equipmentList: readonly StunItem[] }[];
    vehicles: readonly { getEquipmentList(): readonly StunItem[] }[];
    fighters: readonly { getEquipmentList(): readonly StunItem[] }[];
    smallCraft: readonly { getEquipmentList(): readonly StunItem[] }[];
}[]): boolean {
    return groups.some((group) => group.members.some((mech) => mech.getRulesLevel(0) >= 6 || carriesSonicGear(mech.equipmentList))
        || [...group.vehicles, ...group.fighters, ...group.smallCraft].some((unit) => carriesSonicGear(unit.getEquipmentList())));
}
