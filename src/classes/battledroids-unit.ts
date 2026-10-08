import { generateUUID } from "../utils/generateUUID";
import { BattledroidsArmorLocation, IBattledroidsUnitDesign, IBattledroidsUnitKind, battledroidsUnitDesigns, battledroidsUnitKinds, getBattledroidsTankHitLocation } from "../data/battledroids-units";
import { IEquipmentItem } from "../data/data-interfaces";
import { getEquipmentListByTech } from "../data/equipment-registry";
import { getEditionStats, getEquipmentForEdition } from "../data/rules-editions";

// The tanks, jeeps and infantry squads of Expert Battledroids in play (BD pp.22-23): fixed designs, their damage and their shots.

const ARMOR_LOCATIONS: BattledroidsArmorLocation[] = ["front", "left", "right", "back", "turret"];
const MAX_NAME_LENGTH = 100;
/** Expert Battledroids gives every warrior a Gunnery Skill of 4 unless skills are rolled (BD p.14). */
export const BATTLEDROIDS_DEFAULT_GUNNERY = 4;

export type BattledroidsAttackSide = "front" | "back" | "left" | "right";

export interface IBattledroidsUnitWeaponLine {
    /** Index into the unit's weapon lines: one line for each launcher or gun. */
    line: number;
    name: string;
    arc: string;
    shots: number;
    shotsLeft: number;
    damage: string;
    range: { min: number; short: number; medium: number; long: number };
}

export interface IBattledroidsUnitExport {
    uuid: string;
    design: string;
    name: string;
    gunnery: number;
    inPlay?: {
        armorDamage?: Partial<Record<BattledroidsArmorLocation, number>>;
        damage?: number;
        immobilized?: boolean;
        destroyed?: boolean;
        exploded?: boolean;
        firing?: boolean;
        shotsFired?: number[];
    };
}

interface IInPlay {
    armorDamage: Record<BattledroidsArmorLocation, number>;
    damage: number;
    immobilized: boolean;
    destroyed: boolean;
    exploded: boolean;
    firing: boolean;
    shotsFired: number[];
}

const newInPlay = (): IInPlay => ({
    armorDamage: { front: 0, left: 0, right: 0, back: 0, turret: 0 },
    damage: 0,
    immobilized: false,
    destroyed: false,
    exploded: false,
    firing: false,
    shotsFired: [],
});

const wholeNumber = (value: unknown, min: number, max: number, fallback: number): number =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.floor(value))) : fallback;
const rollTwoDice = (): number => 2 + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6);

export function findBattledroidsUnitDesign(tag: unknown): IBattledroidsUnitDesign | undefined {
    return battledroidsUnitDesigns.find((design) => design.tag === tag);
}

export default class BattledroidsUnit {
    private _uuid: string = generateUUID();
    private _design: IBattledroidsUnitDesign = battledroidsUnitDesigns[0];
    private _name: string = "";
    private _gunnery: number = BATTLEDROIDS_DEFAULT_GUNNERY;
    private _inPlay: IInPlay = newInPlay();

    constructor(designOrJSON: string = "") {
        if (findBattledroidsUnitDesign(designOrJSON)) {
            this._design = findBattledroidsUnitDesign(designOrJSON)!;
        } else if (designOrJSON) {
            this.importJSON(designOrJSON);
        }
    }

    // Identity

    public getUUID(): string { return this._uuid; }
    public newUUID(): void { this._uuid = generateUUID(); }
    public getDesign(): IBattledroidsUnitDesign { return this._design; }
    public getKind(): IBattledroidsUnitKind { return battledroidsUnitKinds.find((kind) => kind.kind === this._design.kind)!; }
    public getName(): string { return this._name; }
    public setName(name: string): void { this._name = String(name ?? "").slice(0, MAX_NAME_LENGTH); }
    public getDisplayName(): string { return this._name.trim() || this._design.name; }
    public getGunnery(): number { return this._gunnery; }
    public setGunnery(gunnery: number): void { this._gunnery = wholeNumber(gunnery, 0, 8, BATTLEDROIDS_DEFAULT_GUNNERY); }
    /** Fixed designs from a rulebook without rules levels. */
    public getRequiredRulesLevel(): number { return 0; }

    // Movement

    public isFiring(): boolean { return this._inPlay.firing; }
    public setFiring(firing: boolean): void { this._inPlay.firing = !!firing; }
    /** Movement points this turn: fewer when the unit means to fire; none once the tracks are hit (BD p.22). */
    public getMovementPoints(): number {
        if (this._inPlay.destroyed || this._inPlay.immobilized) return 0;
        const kind = this.getKind();
        return this._inPlay.firing ? kind.movementPointsFiring : kind.movementPoints;
    }
    public isImmobilized(): boolean { return this._inPlay.immobilized; }
    public setImmobilized(immobilized: boolean): void { this._inPlay.immobilized = !!immobilized; }

    // Weapons

    private _findWeapon(tag: string): IEquipmentItem | undefined {
        const record = getEquipmentListByTech("is", false).find((item) => item.tag === tag);
        if (!record) return undefined;
        // The stats and the name the Battledroids Weapons Table prints (BD p.20).
        return { ...getEquipmentForEdition(record, "battledroids"), name: getEditionStats(record, "battledroids")?.name ?? record.name };
    }

    /** The weapons as the design carries them, one entry for each kind. */
    public getWeaponSummary(): string[] {
        return this._design.weapons.map((weapon) =>
            `${weapon.count > 1 ? `${weapon.count} x ` : ""}${this._findWeapon(weapon.tag)?.name ?? weapon.tag} (${weapon.shots} shots${weapon.count > 1 ? " each" : ""})`);
    }

    /** One line for each launcher or gun, with the ranges and damage of the Weapons Table (BD p.20). */
    public getWeaponLines(): IBattledroidsUnitWeaponLine[] {
        const lines: IBattledroidsUnitWeaponLine[] = [];
        for (const weapon of this._design.weapons) {
            const item = this._findWeapon(weapon.tag);
            for (let number = 0; number < weapon.count; number++) {
                const line = lines.length;
                const fired = Math.min(weapon.shots, Math.max(0, this._inPlay.shotsFired[line] ?? 0));
                lines.push({
                    line,
                    name: (item?.name ?? weapon.tag) + (weapon.count > 1 ? ` #${number + 1}` : ""),
                    arc: weapon.arc,
                    shots: weapon.shots,
                    shotsLeft: weapon.shots - fired,
                    damage: item ? String(item.damage) : "",
                    range: {
                        min: item?.range?.min ?? 0,
                        short: item?.range?.short ?? 0,
                        medium: item?.range?.medium ?? 0,
                        long: item?.range?.long ?? 0,
                    },
                });
            }
        }
        return lines;
    }

    /** Fire a shot from one weapon line (or take one back with -1). Returns the shots left. */
    public changeShotsFired(line: number, change: number): number {
        const lines = this.getWeaponLines();
        const weapon = lines[line];
        if (!weapon) return 0;
        const fired = Math.min(weapon.shots, Math.max(0, (weapon.shots - weapon.shotsLeft) + Math.trunc(change)));
        while (this._inPlay.shotsFired.length < lines.length) this._inPlay.shotsFired.push(0);
        this._inPlay.shotsFired[line] = fired;
        return weapon.shots - fired;
    }

    // Damage

    public isDestroyed(): boolean { return this._inPlay.destroyed; }
    public hasExploded(): boolean { return this._inPlay.exploded; }
    public isDamaged(): boolean {
        return this._inPlay.destroyed || this._inPlay.immobilized || this._inPlay.damage > 0
            || ARMOR_LOCATIONS.some((location) => this._inPlay.armorDamage[location] > 0);
    }
    public getArmor(location: BattledroidsArmorLocation): number { return this.getKind().armor?.[location] ?? 0; }
    public getArmorLeft(location: BattledroidsArmorLocation): number {
        return Math.max(0, this.getArmor(location) - this._inPlay.armorDamage[location]);
    }
    /** Mark armor by hand; the tank is destroyed when any part has none left (BD p.22). */
    public setArmorLeft(location: BattledroidsArmorLocation, points: number): void {
        const armor = this.getArmor(location);
        if (armor <= 0) return;
        this._inPlay.armorDamage[location] = armor - wholeNumber(points, 0, armor, armor);
        this._inPlay.destroyed = ARMOR_LOCATIONS.some((part) => this.getArmorLeft(part) <= 0);
        if (!this._inPlay.destroyed) this._inPlay.exploded = false;
    }
    public getArmorLocations(): BattledroidsArmorLocation[] { return this.getKind().armor ? ARMOR_LOCATIONS : []; }
    /** Jeeps and infantry: damage taken, and the damage that destroys the unit. */
    public getDamage(): number { return this._inPlay.damage; }
    public getDamageToDestroy(): number { return this.getKind().damageToDestroy ?? 0; }
    /** Share of the unit left, for the roster's bars: the weakest armor location, or the damage it can still take. */
    public getStrengthPercentage(): number {
        if (this._inPlay.destroyed) return 0;
        const kind = this.getKind();
        if (kind.armor) {
            return Math.round(100 * Math.min(...ARMOR_LOCATIONS.map((location) => this.getArmorLeft(location) / this.getArmor(location))));
        }
        const total = kind.damageToDestroy ?? 1;
        return Math.round(100 * Math.max(0, total - this._inPlay.damage) / total);
    }

    /**
     * Apply one hit to the unit and say what happened. A tank locates the hit on the Tank Hit Locations table
     * with two dice (BD p.22); pass `roll` to use the players' dice. `fireRoll` is the two-dice roll for a fire
     * after a tank explodes.
     */
    public resolveHit(side: BattledroidsAttackSide, damage: number, roll?: number, fireRoll?: number): string[] {
        const points = wholeNumber(damage, 0, 1000, 0);
        const name = this.getDisplayName();
        if (this._inPlay.destroyed) return [`${name} is already destroyed.`];
        if (points <= 0) return [`${name}: no damage.`];
        const kind = this.getKind();
        const log: string[] = [];

        if (!kind.armor) {
            const toDestroy = kind.damageToDestroy ?? 1;
            this._inPlay.damage += points;
            if (this._inPlay.damage >= toDestroy) {
                const extra = this._inPlay.damage - toDestroy;
                this._inPlay.damage = toDestroy;
                this._inPlay.destroyed = true;
                log.push(`${name} takes ${points} ${points === 1 ? "point" : "points"} and is destroyed.`);
                if (extra > 0) {
                    log.push(`${extra} ${extra === 1 ? "point is" : "points are"} left over for another ${kind.kind === "jeep" ? "jeep" : "infantry unit"} in the hex (BD p.${kind.page}).`);
                }
            } else {
                log.push(`${name} takes ${points} ${points === 1 ? "point" : "points"}: ${this._inPlay.damage} of the ${toDestroy - 1} it can withstand.`);
            }
            return log;
        }

        const dice = wholeNumber(roll, 2, 12, rollTwoDice());
        const location = getBattledroidsTankHitLocation(dice, side === "left" || side === "right");
        if (location === "tracks") {
            this._inPlay.immobilized = true;
            log.push(`${name}: hit location roll ${dice}, tracks. The tank cannot move (BD p.22).`);
            return log;
        }
        const part: BattledroidsArmorLocation = location === "turret" ? "turret" : side;
        const before = this.getArmorLeft(part);
        this._inPlay.armorDamage[part] = Math.min(this.getArmor(part), this._inPlay.armorDamage[part] + points);
        const after = this.getArmorLeft(part);
        log.push(`${name}: hit location roll ${dice}, ${part} armor. ${points} ${points === 1 ? "point" : "points"}: ${before} to ${after} of ${this.getArmor(part)}.`);
        if (after <= 0) {
            this._inPlay.destroyed = true;
            if (part === "back") {
                const fire = wholeNumber(fireRoll, 2, 12, rollTwoDice());
                this._inPlay.exploded = true;
                log.push(`The ${part} armor is gone: the tank explodes. Fire roll ${fire}: ${fire >= 9 ? "a fire starts in the hex" : "no fire"} (BD p.22).`);
            } else {
                log.push(`The ${part} armor is gone: the tank is destroyed (BD p.22).`);
            }
        }
        return log;
    }

    public resetInPlay(): void { this._inPlay = newInPlay(); }

    // Saving

    public export(noInPlayVariables: boolean = false): IBattledroidsUnitExport {
        const inPlay = this._inPlay;
        const used = this.isDamaged() || inPlay.firing || inPlay.shotsFired.some((shots) => shots > 0);
        return {
            uuid: this._uuid,
            design: this._design.tag,
            name: this._name,
            gunnery: this._gunnery,
            ...(noInPlayVariables || !used ? {} : {
                inPlay: {
                    armorDamage: { ...inPlay.armorDamage },
                    damage: inPlay.damage,
                    immobilized: inPlay.immobilized,
                    destroyed: inPlay.destroyed,
                    exploded: inPlay.exploded,
                    firing: inPlay.firing,
                    shotsFired: [...inPlay.shotsFired],
                },
            }),
        };
    }

    public exportJSON(): string { return JSON.stringify(this.export()); }

    /** Reads a saved unit one field at a time; a save that names no known design is refused. */
    public importJSON(json: string): boolean {
        let raw: unknown;
        try {
            raw = JSON.parse(json);
        } catch {
            return false;
        }
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
        const data = raw as Record<string, unknown>;
        const design = findBattledroidsUnitDesign(data.design);
        if (!design) return false;
        this._design = design;
        this._uuid = typeof data.uuid === "string" && data.uuid.length <= 64 ? data.uuid : generateUUID();
        this.setName(typeof data.name === "string" ? data.name : "");
        this.setGunnery(typeof data.gunnery === "number" ? data.gunnery : BATTLEDROIDS_DEFAULT_GUNNERY);
        this._inPlay = newInPlay();
        const saved = data.inPlay && typeof data.inPlay === "object" && !Array.isArray(data.inPlay) ? data.inPlay as Record<string, unknown> : null;
        if (saved) {
            const armorDamage = saved.armorDamage && typeof saved.armorDamage === "object" ? saved.armorDamage as Record<string, unknown> : {};
            for (const location of ARMOR_LOCATIONS) {
                this._inPlay.armorDamage[location] = wholeNumber(armorDamage[location], 0, this.getArmor(location), 0);
            }
            this._inPlay.damage = wholeNumber(saved.damage, 0, this.getDamageToDestroy(), 0);
            this._inPlay.immobilized = saved.immobilized === true;
            this._inPlay.destroyed = saved.destroyed === true;
            this._inPlay.exploded = saved.exploded === true;
            this._inPlay.firing = saved.firing === true;
            const lines = this.getWeaponLines();
            const shotsFired = Array.isArray(saved.shotsFired) ? saved.shotsFired : [];
            this._inPlay.shotsFired = lines.map((line, index) => wholeNumber(shotsFired[index], 0, line.shots, 0));
        }
        return true;
    }
}
