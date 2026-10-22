import { ammoCustom } from "../data/ammo-custom";
import { getComboArtillery } from "../data/artillery-custom";
import { IEquipmentItem } from "../data/data-interfaces";
import { equipmentMatchesIdentifier, getCompatibleAmmo } from "../data/equipment-registry";
import { generateUUID } from "../utils/generateUUID";
import { EarlyFireResult, getCooldownGroundTurns, getEarlyFireResult, getSpaceTurn, isSpaceTurnStart, MISFIRE_REMINDER } from "../utils/space-turn";
import type { BattleMech } from "./battlemech";
import type { BattleMechForce } from "./battlemech-force";
import type Building from "./building";
import type Vehicle from "./vehicle";

/*
 * Space turn tracker (design 2026-10-22): the anti-orbital shots in flight, each gun's last space turn fired, and the
 * guns destroyed by firing early. Saved with the force while "Space forces in this game" is on.
 */

/** Far above any real battery: bounds what a saved force can hold. */
export const MAX_TRACKED_GUNS = 200;
export const MAX_SHOTS_IN_FLIGHT = 200;
const MAX_TURN = 10000;

export interface IAntiOrbitalShot {
    id: string;
    /** `${unitUuid}:${weaponUuid}` */
    gunKey: string;
    unitName: string;
    weaponName: string;
    aimedHex: string;
    targetName: string;
    firedGroundTurn: number;
    firedSpaceTurn: number;
}

export const ANTI_ORBITAL_AMMO_TAG = "ammo-is-long-tom-anti-orbital";

/** A weapon that can fire the anti-orbital round, on a unit carrying it. */
export interface IAntiOrbitalGun {
    key: string;
    unitUuid: string;
    unitName: string;
    weapon: IEquipmentItem;
    /** The artillery piece the weapon fires as: the weapon itself, or an ArtVee combo gun's piece. */
    piece: IEquipmentItem;
    /** The unit's anti-orbital bins. */
    bins: IEquipmentItem[];
    shotsLeft: number;
    /** The unit, whose own play state counts its shots and its destroyed weapons. */
    unit: IGunUnit;
}

/** The unit a gun is on: each kind counts its shots and destroyed weapons its own way. */
export type IGunUnit = { kind: "mech"; mech: BattleMech } | { kind: "vehicle"; vehicle: Vehicle } | { kind: "building"; building: Building };

export type FireResult =
    | { result: "fired"; shot: IAntiOrbitalShot }
    | { result: "needs-roll"; cooldown: number }
    | { result: "misfire"; reminder: string }
    | { result: "destroyed"; reminder: string }
    | { result: "refused"; reason: string };

const antiOrbitalRound = (): IEquipmentItem | undefined => ammoCustom.find((item) => item.tag === ANTI_ORBITAL_AMMO_TAG);

// Shots left in a bin, read the way the unit's own play panel reads them.
const binShotsLeft = (unit: IGunUnit, bin: IEquipmentItem): number => {
    if (unit.kind === "building") return unit.building.getAmmoShots(bin.uuid ?? "");
    if (unit.kind === "mech") return unit.mech.getAmmoBinRemaining(bin);
    const capacity = unit.vehicle.getAmmoBinShots(bin);
    return typeof bin.currentAmmo === "number" && bin.currentAmmo >= 0 ? Math.min(bin.currentAmmo, capacity) : capacity;
};

const setBinShotsLeft = (unit: IGunUnit, bin: IEquipmentItem, shots: number): void => {
    if (unit.kind === "building") unit.building.setAmmoShots(bin.uuid ?? "", shots);
    else bin.currentAmmo = shots;
};

const gunsOn = (unitUuid: string, unitName: string, equipment: IEquipmentItem[], unit: IGunUnit): IAntiOrbitalGun[] => {
    const vehicle = unit.kind === "vehicle" ? unit.vehicle : undefined;
    const round = antiOrbitalRound();
    if (!round) return [];
    const bins = equipment.filter((item) => item.isAmmo && equipmentMatchesIdentifier(item, ANTI_ORBITAL_AMMO_TAG));
    if (bins.length === 0) return [];
    const guns: IAntiOrbitalGun[] = [];
    for (const weapon of equipment) {
        if (weapon.isAmmo) continue;
        const combo = getComboArtillery(weapon);
        if (combo && vehicle?.getArtVeeMode() !== "siege") continue;
        const piece = combo ?? weapon;
        if (!getCompatibleAmmo(piece, round)) continue;
        guns.push({
            key: `${unitUuid}:${weapon.uuid ?? weapon.tag}`, unitUuid, unitName, weapon, piece, bins, unit,
            shotsLeft: bins.reduce((total, bin) => total + binShotsLeft(unit, bin), 0),
        });
    }
    return guns;
};

/** Every weapon in the force that can fire the anti-orbital round, on a unit that carries a bin of it. */
export function findAntiOrbitalGuns(force: BattleMechForce): IAntiOrbitalGun[] {
    const guns: IAntiOrbitalGun[] = [];
    for (const group of force.groups) {
        for (const mech of group.members) guns.push(...gunsOn(mech.uuid, mech.getName(), mech.equipmentList, { kind: "mech", mech }));
        for (const vehicle of group.vehicles) guns.push(...gunsOn(vehicle.getUUID(), vehicle.getName(), vehicle.getEquipmentList(), { kind: "vehicle", vehicle }));
        for (const building of group.buildings) {
            guns.push(...gunsOn(building.getUUID(), building.getName(), building.getEquipment().map((mount) => mount.item), { kind: "building", building }));
        }
    }
    return guns;
}

export interface ISpaceTrackerExport {
    shotsInFlight: IAntiOrbitalShot[];
    /** gunKey to the space turn it last fired in */
    lastFired: Record<string, number>;
    destroyedGuns: string[];
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const savedTurn = (value: unknown): number | null =>
    typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= MAX_TURN ? value : null;

const savedText = (value: unknown, max: number): string => typeof value === "string" ? value.slice(0, max) : "";

const savedShot = (value: unknown): IAntiOrbitalShot | null => {
    if (!isPlainObject(value) || typeof value.id !== "string" || typeof value.gunKey !== "string") return null;
    const firedGroundTurn = savedTurn(value.firedGroundTurn);
    const firedSpaceTurn = savedTurn(value.firedSpaceTurn);
    if (firedGroundTurn === null || firedSpaceTurn === null) return null;
    return {
        id: value.id.slice(0, 64),
        gunKey: value.gunKey.slice(0, 200),
        unitName: savedText(value.unitName, 200),
        weaponName: savedText(value.weaponName, 200),
        aimedHex: savedText(value.aimedHex, 16),
        targetName: savedText(value.targetName, 60),
        firedGroundTurn,
        firedSpaceTurn,
    };
};

export class SpaceTracker {
    public shotsInFlight: IAntiOrbitalShot[] = [];
    public lastFired: Record<string, number> = {};
    public destroyedGuns: string[] = [];

    constructor(saved?: unknown) {
        if (!isPlainObject(saved)) return;
        if (Array.isArray(saved.shotsInFlight)) {
            this.shotsInFlight = saved.shotsInFlight.slice(0, MAX_SHOTS_IN_FLIGHT)
                .map(savedShot).filter((shot): shot is IAntiOrbitalShot => shot !== null);
        }
        if (isPlainObject(saved.lastFired)) {
            for (const key of Object.keys(saved.lastFired).slice(0, MAX_TRACKED_GUNS)) {
                const turn = savedTurn(saved.lastFired[key]);
                if (turn !== null) this.lastFired[key] = turn;
            }
        }
        if (Array.isArray(saved.destroyedGuns)) {
            this.destroyedGuns = Array.from(new Set(saved.destroyedGuns.filter((key): key is string => typeof key === "string")))
                .slice(0, MAX_TRACKED_GUNS);
        }
    }

    public export(): ISpaceTrackerExport {
        return {
            shotsInFlight: this.shotsInFlight.map((shot) => ({ ...shot })),
            lastFired: { ...this.lastFired },
            destroyedGuns: [...this.destroyedGuns],
        };
    }

    public isGunDestroyed(gun: IAntiOrbitalGun): boolean {
        if (this.destroyedGuns.includes(gun.key)) return true;
        if (gun.unit.kind === "vehicle") return gun.unit.vehicle.getWeaponStatus(gun.weapon.uuid) === "destroyed";
        if (gun.unit.kind === "building") return gun.unit.building.isMountDestroyed(gun.weapon.uuid ?? "");
        return false;
    }

    /** Ground turns before the gun may safely fire any round again; 0 when it may now. */
    public getGunCooldown(gun: IAntiOrbitalGun, groundTurn: number): number {
        return getCooldownGroundTurns(groundTurn, this.lastFired[gun.key] ?? null);
    }

    /**
     * Fire the anti-orbital round. During the cooldown it needs the 2D6 early-fire roll (TRO.md): 2-4 destroys the gun,
     * 5-8 misfires, 9-12 fires normally. Each of those spends the round.
     */
    public fire(gun: IAntiOrbitalGun, aimedHex: string, targetName: string, groundTurn: number, earlyRoll?: number): FireResult {
        const hex = aimedHex.trim().slice(0, 16);
        if (this.isGunDestroyed(gun)) return { result: "refused", reason: "The gun is destroyed" };
        if (!hex) return { result: "refused", reason: "Enter the aimed hex" };
        if (gun.shotsLeft <= 0) return { result: "refused", reason: "No anti-orbital rounds left" };
        const cooldown = this.getGunCooldown(gun, groundTurn);
        let early: EarlyFireResult = "normal";
        if (cooldown > 0) {
            if (earlyRoll === undefined) return { result: "needs-roll", cooldown };
            const rolled = getEarlyFireResult(earlyRoll);
            if (!rolled) return { result: "refused", reason: "A 2D6 roll is 2 to 12" };
            early = rolled;
        }
        this._spendShot(gun);
        if (early === "destroyed") {
            return { result: "destroyed", reminder: this._destroy(gun) };
        }
        const spaceTurn = getSpaceTurn(groundTurn);
        this.lastFired[gun.key] = spaceTurn;
        if (early === "misfire") return { result: "misfire", reminder: MISFIRE_REMINDER };
        const shot: IAntiOrbitalShot = {
            id: generateUUID(), gunKey: gun.key, unitName: gun.unitName, weaponName: gun.weapon.name, aimedHex: hex,
            targetName: targetName.trim().slice(0, 60), firedGroundTurn: Math.max(1, Math.floor(groundTurn) || 1), firedSpaceTurn: spaceTurn,
        };
        if (this.shotsInFlight.length < MAX_SHOTS_IN_FLIGHT) this.shotsInFlight.push(shot);
        return { result: "fired", shot };
    }

    /** The early-fire roll for a ground round fired during the cooldown; that round's ammunition is play mode's as usual. */
    public rollEarlyFireForOtherRound(gun: IAntiOrbitalGun, roll: number): EarlyFireResult | null {
        const result = getEarlyFireResult(roll);
        if (result === "destroyed") this._destroy(gun);
        return result;
    }

    /** Remove a resolved shot; false when there is no such shot. */
    public resolve(shotId: string): boolean {
        const before = this.shotsInFlight.length;
        this.shotsInFlight = this.shotsInFlight.filter((shot) => shot.id !== shotId);
        return this.shotsInFlight.length < before;
    }

    private _spendShot(gun: IAntiOrbitalGun): void {
        const bin = gun.bins.find((item) => binShotsLeft(gun.unit, item) > 0);
        if (!bin) return;
        setBinShotsLeft(gun.unit, bin, binShotsLeft(gun.unit, bin) - 1);
        gun.shotsLeft = Math.max(0, gun.shotsLeft - 1);
    }

    // Marks the gun destroyed on the unit's own sheet where play mode tracks it; returns what to tell the player.
    private _destroy(gun: IAntiOrbitalGun): string {
        if (!this.destroyedGuns.includes(gun.key) && this.destroyedGuns.length < MAX_TRACKED_GUNS) this.destroyedGuns.push(gun.key);
        const failure = "Catastrophic failure: the gun is destroyed, inoperable for the rest of the game, and the round is lost.";
        if (gun.unit.kind === "vehicle" && gun.weapon.uuid) gun.unit.vehicle.setWeaponStatus(gun.weapon.uuid, "destroyed");
        else if (gun.unit.kind === "building" && gun.weapon.uuid) gun.unit.building.setMountDestroyed(gun.weapon.uuid, true);
        else return `${failure} Mark the weapon destroyed on the 'Mech's record sheet.`;
        return failure;
    }

    /** Shots fired in an earlier space turn than this ground turn's: resolved at the start of this space turn. */
    public getDueShots(groundTurn: number): IAntiOrbitalShot[] {
        const spaceTurn = getSpaceTurn(groundTurn);
        return this.shotsInFlight.filter((shot) => shot.firedSpaceTurn < spaceTurn);
    }

    /** True when this ground turn opens a space turn with shots to resolve: the one time the space phase asks. */
    public opensSpacePhase(groundTurn: number): boolean {
        return isSpaceTurnStart(groundTurn) && this.getDueShots(groundTurn).length > 0;
    }

    /** True while anything is tracked: shots in flight, a gun's last space turn fired, or a destroyed gun. */
    public hasState(): boolean {
        return this.shotsInFlight.length > 0 || Object.keys(this.lastFired).length > 0 || this.destroyedGuns.length > 0;
    }
}
