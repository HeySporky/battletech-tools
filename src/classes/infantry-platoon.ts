import { generateUUID } from "../utils/generateUUID";
import { IInfantryWeapon, INFANTRY_MAX_PRIMARY_DAMAGE, INFANTRY_SUPPORT_PPC_TAG, findInfantryWeapon, infantryWeapons } from "../data/infantry-weapons";
import { getTechManualSkillMultiplier } from "../data/skill-multipliers";

// Conventional infantry platoon construction (TechManual pp.144-155), Battle Value (TM p.309) and cost (TM pp.276, 282).

export type InfantryMotive = "foot" | "motorized" | "jump" | "mech-hover" | "mech-tracked" | "mech-wheeled";
export type InfantryTechBase = "is" | "clan";

export interface IInfantryMotiveType {
    tag: InfantryMotive;
    name: string;
    maxSquadSize: number;
    maxPlatoonSize: number;
    mp: number;
    moveType: string;
    prohibitedTerrain: string;
    /** Tons per trooper, without Anti-'Mech kits (TM p.155). */
    weightPerTrooper: number;
    /** Fewest troopers the platoon may be broken into for transport. */
    minimumBreakdown: number;
    costMultiplier: number;
    mechanized: boolean;
    /** MP lost for carrying 2 support weapons per squad; foot platoons move or fire instead (TM p.151). */
    supportMPLoss: number;
}

// Conventional Infantry Motive Types Table (TM p.145), Weight Table (p.155) and cost multipliers (p.282).
export const INFANTRY_MOTIVE_TYPES: IInfantryMotiveType[] = [
    { tag: "foot", name: "Foot", maxSquadSize: 10, maxPlatoonSize: 30, mp: 1, moveType: "Ground", prohibitedTerrain: "Water (Any)", weightPerTrooper: 0.085, minimumBreakdown: 1, costMultiplier: 1.0, mechanized: false, supportMPLoss: 0 },
    { tag: "motorized", name: "Motorized", maxSquadSize: 10, maxPlatoonSize: 30, mp: 3, moveType: "Ground", prohibitedTerrain: "Water (Any)", weightPerTrooper: 0.195, minimumBreakdown: 1, costMultiplier: 1.6, mechanized: false, supportMPLoss: 1 },
    { tag: "jump", name: "Jump", maxSquadSize: 10, maxPlatoonSize: 30, mp: 3, moveType: "Jump", prohibitedTerrain: "Water (Any)", weightPerTrooper: 0.165, minimumBreakdown: 1, costMultiplier: 2.6, mechanized: false, supportMPLoss: 1 },
    { tag: "mech-hover", name: "Mechanized (Hover)", maxSquadSize: 5, maxPlatoonSize: 20, mp: 5, moveType: "Hover", prohibitedTerrain: "Woods (Any)", weightPerTrooper: 1, minimumBreakdown: 5, costMultiplier: 3.2, mechanized: true, supportMPLoss: 1 },
    { tag: "mech-tracked", name: "Mechanized (Tracked)", maxSquadSize: 7, maxPlatoonSize: 28, mp: 3, moveType: "Tracked", prohibitedTerrain: "Woods (Heavy), Water (Depth 1+)", weightPerTrooper: 1, minimumBreakdown: 5, costMultiplier: 3.2, mechanized: true, supportMPLoss: 0 },
    { tag: "mech-wheeled", name: "Mechanized (Wheeled)", maxSquadSize: 6, maxPlatoonSize: 24, mp: 4, moveType: "Wheeled", prohibitedTerrain: "Rough, Rubble, Woods (Any), Water (Depth 1+)", weightPerTrooper: 1, minimumBreakdown: 5, costMultiplier: 3.2, mechanized: true, supportMPLoss: 1 },
];

/** Tons an Anti-'Mech Infantry kit adds to each trooper (TM p.155). */
export const INFANTRY_ANTI_MECH_KIT_TONS = 0.015;
/** Cost multiplier for Anti-'Mech Training and Equipment (TM p.282). */
export const INFANTRY_ANTI_MECH_COST_MULTIPLIER = 5;
/** Anti-'Mech Skill of a platoon without kits, or of any mechanized platoon; it cannot be improved (TM pp.155, 309). */
export const INFANTRY_FIXED_ANTI_MECH_SKILL = 8;
export const INFANTRY_MAX_SQUADS_PER_PLATOON = 5;
export const INFANTRY_MAX_SECONDARY_PER_SQUAD = 2;
/** Most squads a formation may be given here: the Marian Hegemony's ten (TM p.147). */
export const INFANTRY_MAX_SQUADS = 10;
/** MP a platoon carrying the Support Particle Cannon is held to (TM p.352). */
export const INFANTRY_SUPPORT_PPC_MP = 2;
/** Conventional infantry follow Total Warfare's standard rules. */
export const INFANTRY_RULES_LEVEL = 2;

export interface IInfantryFormation {
    tag: string;
    name: string;
    techBase: InfantryTechBase;
    /** Troopers per squad and squads per platoon, by motive type. */
    sizes: Record<InfantryMotive, [number, number]>;
    notes?: string;
}

const standardIS: Record<InfantryMotive, [number, number]> = {
    "foot": [7, 4], "motorized": [7, 4], "jump": [7, 3], "mech-hover": [5, 4], "mech-wheeled": [6, 4], "mech-tracked": [7, 4],
};
const taurian: Record<InfantryMotive, [number, number]> = {
    "foot": [10, 3], "motorized": [10, 3], "jump": [10, 3], "mech-hover": [5, 4], "mech-wheeled": [5, 4], "mech-tracked": [5, 4],
};

// Conventional Infantry Formations (by Tech Base) Table (TM p.147).
export const INFANTRY_FORMATIONS: IInfantryFormation[] = [
    { tag: "is-generic", name: "Generic / Mercenary", techBase: "is", sizes: standardIS },
    { tag: "capellan-confederation", name: "Capellan Confederation", techBase: "is", sizes: standardIS },
    { tag: "draconis-combine", name: "Draconis Combine", techBase: "is", sizes: standardIS },
    { tag: "federated-suns", name: "Federated Suns", techBase: "is", sizes: standardIS },
    { tag: "free-rasalhague-republic", name: "Free Rasalhague Republic", techBase: "is", sizes: standardIS },
    { tag: "free-worlds-league", name: "Free Worlds League", techBase: "is", sizes: standardIS },
    { tag: "lyran-alliance", name: "Lyran Alliance", techBase: "is", sizes: standardIS },
    { tag: "comstar-word-of-blake", name: "ComStar / Word of Blake", techBase: "is", sizes: { "foot": [6, 6], "motorized": [6, 6], "jump": [6, 5], "mech-hover": [5, 4], "mech-wheeled": [6, 4], "mech-tracked": [6, 4] } },
    { tag: "periphery-major", name: "Periphery (Major)", techBase: "is", sizes: standardIS, notes: "Includes the Circinus Federation, Magistracy of Canopus, Niops Association, Outworlds Alliance, Nueva Castile, Hanseatic League and pirates." },
    { tag: "marian-hegemony", name: "Marian Hegemony", techBase: "is", sizes: { "foot": [10, 10], "motorized": [10, 10], "jump": [10, 5], "mech-hover": [5, 4], "mech-wheeled": [5, 4], "mech-tracked": [5, 4] } },
    { tag: "taurian-concordat", name: "Taurian Concordat", techBase: "is", sizes: taurian },
    { tag: "calderon-protectorate", name: "Calderon Protectorate", techBase: "is", sizes: taurian },
    { tag: "clan", name: "Clan (All)", techBase: "clan", sizes: { "foot": [5, 5], "motorized": [5, 5], "jump": [5, 4], "mech-hover": [5, 4], "mech-wheeled": [5, 4], "mech-tracked": [5, 4] } },
];

// Conventional Infantry Range Modifiers Table (TM p.149): to-hit modifiers by Base Range, from the platoon's own
// hex (index 0) out to three times the Base Range. A range past the end of a row cannot be attacked.
export const INFANTRY_RANGE_MODIFIERS: number[][] = [
    [0],
    [-2, 0, 2, 4],
    [-2, 0, 0, 2, 2, 4, 4],
    [-2, 0, 0, 0, 2, 2, 2, 4, 4, 4],
    [-2, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4],
    [-1, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4],
    [-1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 4, 4, 4, 5, 5, 5],
    [-1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 6, 6, 6, 6],
];

export const INFANTRY_SPECIAL_FEATURES: Record<string, string> = {
    A: "Anti-aircraft: may attack airborne aerospace units",
    B: "Heavy burst: -1 to-hit in its own hex, +1D6 damage against conventional infantry",
    F: "Flame-based: may apply its damage as heat instead",
    N: "Non-penetrating: affects other conventional infantry only",
};

export interface IInfantryPlatoonExport {
    uuid: string;
    lastUpdated: string;
    name: string;
    techBase: InfantryTechBase;
    formation: string;
    motive: InfantryMotive;
    squadSize: number;
    squads: number;
    primaryWeapon: string;
    secondaryWeapon: string;
    secondaryPerSquad: number;
    antiMechKit: boolean;
    gunnery: number;
    antiMech: number;
}

const savedString = (value: unknown, fallback: string = ""): string => typeof value === "string" ? value : fallback;
const savedNumber = (value: unknown, fallback: number, min: number, max: number): number =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);
/** Rounds normally, .5 up; the small allowance keeps 0.285 x 2 style products from falling short in binary. */
const roundNormally = (value: number): number => Math.floor(value + 0.5 + 1e-9);
const roundUpHalf = (tons: number): number => Math.ceil(tons * 2 - 1e-9) / 2;
const format = (value: number, digits: number = 2): string => value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

const DEFAULT_PRIMARY = "inf-auto-rifle";
export const MAX_INFANTRY_NAME_LENGTH = 120;

/** A saved platoon cleaned by a full import, with what the import changed; null when it is not an object. */
export const normalizeInfantryPlatoonExport = (raw: unknown): { platoon: IInfantryPlatoonExport | null; issues: string[] } => {
    if (!isPlainObject(raw)) return { platoon: null, issues: ["Skipped a saved platoon that could not be read"] };
    let json: string;
    try {
        json = JSON.stringify(raw);
    } catch {
        return { platoon: null, issues: ["Skipped a saved platoon that could not be read"] };
    }
    const loaded = new InfantryPlatoon(json);
    return { platoon: loaded.export(), issues: [...loaded.getImportIssues()] };
};

export default class InfantryPlatoon {
    private _uuid: string = generateUUID();
    public lastUpdated: Date = new Date();

    private _name: string = "";
    private _techBase: InfantryTechBase = "is";
    private _formation: IInfantryFormation = INFANTRY_FORMATIONS[0];
    private _motive: IInfantryMotiveType = INFANTRY_MOTIVE_TYPES[0];
    private _squadSize: number = 7;
    private _squads: number = 4;
    private _primary: IInfantryWeapon = findInfantryWeapon(DEFAULT_PRIMARY) ?? infantryWeapons[0];
    private _secondary: IInfantryWeapon | null = null;
    private _secondaryPerSquad: number = 0;
    private _antiMechKit: boolean = false;
    private _gunnery: number = 4;
    private _antiMech: number = 5;
    private _importIssues: string[] = [];

    constructor(importJSON: string = "") {
        if (importJSON) this.importJSON(importJSON);
    }

    // Identity

    public getUUID(): string { return this._uuid; }
    public newUUID(): void { this._uuid = generateUUID(); }
    public getName(): string { return this._name; }
    public setName(name: string): void { this._name = String(name ?? "").slice(0, MAX_INFANTRY_NAME_LENGTH); }
    /** The saved name, or the book's style of name: motive and weapon (TM p.154). */
    public getDisplayName(): string { return this._name.trim() || this.getNomenclature(); }
    public getNomenclature(): string {
        const weapon = this.getSecondaryCount() > 0 && this._secondary ? this._secondary.name : this._primary.name;
        return `${this._motive.name} ${weapon} Infantry`;
    }
    public getImportIssues(): readonly string[] { return this._importIssues; }
    public getRequiredRulesLevel(): number { return INFANTRY_RULES_LEVEL; }

    // Step 1: platoon type (TM p.145)

    public getTechBase(): InfantryTechBase { return this._techBase; }
    public isClan(): boolean { return this._techBase === "clan"; }
    public getMotive(): IInfantryMotiveType { return this._motive; }
    public isMechanized(): boolean { return this._motive.mechanized; }
    public getFormation(): IInfantryFormation { return this._formation; }
    public getAvailableFormations(): IInfantryFormation[] { return INFANTRY_FORMATIONS.filter((formation) => formation.techBase === this._techBase); }

    /** Changes the technology base, moving to that base's first formation and dropping weapons it cannot use. */
    public setTechBase(techBase: InfantryTechBase): void {
        if (techBase !== "is" && techBase !== "clan") return;
        this._techBase = techBase;
        if (this._formation.techBase !== techBase) this._formation = this.getAvailableFormations()[0];
        this.applyFormation();
        this._clampWeapons();
    }

    public setFormation(tag: string): boolean {
        const formation = this.getAvailableFormations().find((item) => item.tag === tag);
        if (!formation) return false;
        this._formation = formation;
        this.applyFormation();
        return true;
    }

    public setMotive(tag: string): boolean {
        const motive = INFANTRY_MOTIVE_TYPES.find((item) => item.tag === tag);
        if (!motive) return false;
        this._motive = motive;
        this.applyFormation();
        this._clampWeapons();
        return true;
    }

    /** Sets the squad size and count the Formations Table gives this affiliation and motive type (TM p.147). */
    public applyFormation(): void {
        const [squadSize, squads] = this._formation.sizes[this._motive.tag];
        this._squadSize = squadSize;
        this._squads = squads;
        this._clampSecondaryCount();
    }

    /** True while the platoon keeps the Formations Table's arrangement; a designer may choose another (TM p.146). */
    public usesFormationSizes(): boolean {
        const [squadSize, squads] = this._formation.sizes[this._motive.tag];
        return this._squadSize === squadSize && this._squads === squads;
    }

    public getSquadSize(): number { return this._squadSize; }
    public getSquads(): number { return this._squads; }
    public setSquadSize(size: number): void {
        this._squadSize = savedNumber(size, this._squadSize, 1, this._motive.maxSquadSize);
        this._clampSecondaryCount();
    }
    public setSquads(count: number): void { this._squads = savedNumber(count, this._squads, 1, INFANTRY_MAX_SQUADS); }
    public getTroopers(): number { return this._squadSize * this._squads; }

    /**
     * Troopers on each record sheet line. A formation over the motive type's platoon maximum is split as evenly as
     * possible into sub-platoons, odd troopers going to the first (TM p.146).
     */
    public getSubPlatoons(): number[] {
        const troopers = this.getTroopers();
        const count = Math.max(1, Math.ceil(troopers / this._motive.maxPlatoonSize));
        const base = Math.floor(troopers / count);
        const extra = troopers - base * count;
        return Array.from({ length: count }, (_unused, index) => base + (index < extra ? 1 : 0));
    }
    public isOversized(): boolean { return this.getSubPlatoons().length > 1; }

    // Step 2: weapons (TM pp.148-152)

    public getPrimaryWeapon(): IInfantryWeapon { return this._primary; }
    public getSecondaryWeapon(): IInfantryWeapon | null { return this._secondary; }
    public getSecondaryPerSquad(): number { return this._secondary ? this._secondaryPerSquad : 0; }
    /** Troopers firing the secondary weapon: one per weapon, whatever its crew (TM p.151). */
    public getSecondaryCount(): number { return this.getSecondaryPerSquad() * this._squads; }
    public getPrimaryCount(): number { return this.getTroopers() - this.getSecondaryCount(); }

    public isWeaponForTechBase(weapon: IInfantryWeapon): boolean { return weapon.techBase === "both" || weapon.techBase === this._techBase; }

    /** Why the platoon may not carry the weapon at all, or null when it may. */
    private _weaponBar(weapon: IInfantryWeapon): string | null {
        if (!this.isWeaponForTechBase(weapon)) return `${weapon.name} is not available to ${this.isClan() ? "Clan" : "Inner Sphere"} infantry`;
        if (this.isMechanized() && weapon.type === "melee") return "Mechanized infantry may not use melee weapons (TM p.148)";
        if (this.isMechanized() && weapon.damageType === "P") return "Mechanized infantry may not use point-blank weapons (TM p.148)";
        if (weapon.tag === INFANTRY_SUPPORT_PPC_TAG && this._motive.tag !== "motorized" && this._motive.tag !== "mech-tracked") {
            return "The Support Particle Cannon may only be carried by motorized and mechanized (tracked) platoons (TM p.352)";
        }
        return null;
    }

    /** Primary weapons must be Melee or Standard (TM p.150). */
    public canBePrimary(weapon: IInfantryWeapon): boolean {
        return weapon.type !== "support" && this._weaponBar(weapon) === null;
    }

    /** A platoon with a Melee primary weapon may only add a Melee or Standard secondary (TM p.151). */
    public canBeSecondary(weapon: IInfantryWeapon): boolean {
        if (this._weaponBar(weapon) !== null) return false;
        if (this._primary.type === "melee" && weapon.type === "support") return false;
        return this.getMaxSecondaryPerSquad(weapon) > 0;
    }

    public getAvailablePrimaryWeapons(): IInfantryWeapon[] { return infantryWeapons.filter((weapon) => this.canBePrimary(weapon)); }
    public getAvailableSecondaryWeapons(): IInfantryWeapon[] { return infantryWeapons.filter((weapon) => this.canBeSecondary(weapon)); }

    /** 2 per squad, or the squad's troopers divided by the weapon's crew, whichever is lower (TM p.151). */
    public getMaxSecondaryPerSquad(weapon: IInfantryWeapon | null = this._secondary): number {
        if (!weapon) return 0;
        return Math.min(INFANTRY_MAX_SECONDARY_PER_SQUAD, Math.floor(this._squadSize / Math.max(1, weapon.crew)));
    }

    public setPrimaryWeapon(tag: string): boolean {
        const weapon = findInfantryWeapon(tag);
        if (!weapon || !this.canBePrimary(weapon)) return false;
        this._primary = weapon;
        if (this._secondary && !this.canBeSecondary(this._secondary)) this.setSecondaryWeapon("");
        return true;
    }

    /** An empty tag removes the secondary weapon. A newly chosen weapon starts at one per squad. */
    public setSecondaryWeapon(tag: string): boolean {
        if (!tag) {
            this._secondary = null;
            this._secondaryPerSquad = 0;
            return true;
        }
        const weapon = findInfantryWeapon(tag);
        if (!weapon || !this.canBeSecondary(weapon)) return false;
        this._secondary = weapon;
        if (this._secondaryPerSquad < 1) this._secondaryPerSquad = 1;
        this._clampSecondaryCount();
        return true;
    }

    public setSecondaryPerSquad(count: number): void {
        this._secondaryPerSquad = savedNumber(count, this._secondaryPerSquad, 0, INFANTRY_MAX_SECONDARY_PER_SQUAD);
        this._clampSecondaryCount();
    }

    private _clampSecondaryCount(): void {
        if (!this._secondary) {
            this._secondaryPerSquad = 0;
            return;
        }
        this._secondaryPerSquad = Math.min(this._secondaryPerSquad, this.getMaxSecondaryPerSquad());
    }

    private _clampWeapons(): void {
        if (!this.canBePrimary(this._primary)) {
            const fallback = findInfantryWeapon(DEFAULT_PRIMARY);
            this._primary = fallback && this.canBePrimary(fallback) ? fallback : this.getAvailablePrimaryWeapons()[0] ?? this._primary;
        }
        if (this._secondary && !this.canBeSecondary(this._secondary)) this.setSecondaryWeapon("");
        this._clampSecondaryCount();
    }

    /** True when the platoon carries 2 Support secondary weapons per squad, which costs it mobility (TM p.151). */
    public carriesHeavySupportLoad(): boolean {
        return !!this._secondary && this._secondary.type === "support" && this.getSecondaryPerSquad() >= 2;
    }

    /** Foot platoons with 2 support weapons per squad may move or fire in a turn, not both (TM p.151). */
    public isMoveOrFire(): boolean { return this._motive.tag === "foot" && this.carriesHeavySupportLoad(); }

    public getMP(): number {
        let mp = this._motive.mp;
        if (this.carriesHeavySupportLoad()) mp -= this._motive.supportMPLoss;
        if (this.getSecondaryCount() > 0 && this._secondary?.tag === INFANTRY_SUPPORT_PPC_TAG) mp = Math.min(mp, INFANTRY_SUPPORT_PPC_MP);
        return Math.max(0, mp);
    }

    public getMovementText(): string {
        return `${this.getMP()} (${this._motive.moveType})${this.isMoveOrFire() ? ", Move or Shoot" : ""}`;
    }

    /** The weapon whose range, modifiers and damage type the platoon attacks with (TM p.152). */
    public getRangeWeapon(): IInfantryWeapon {
        return this._secondary && this.getSecondaryPerSquad() >= 2 ? this._secondary : this._primary;
    }

    /** Weapons the platoon actually fields. */
    private _fieldedWeapons(): IInfantryWeapon[] {
        return this._secondary && this.getSecondaryCount() > 0 ? [this._primary, this._secondary] : [this._primary];
    }

    /** A primary weapon over the 0.60 limit counts as 0.60 and gives the platoon heavy burst (TM p.150). */
    public isPrimaryDamageCapped(): boolean { return this._primary.damage > INFANTRY_MAX_PRIMARY_DAMAGE; }
    public getPrimaryDamage(): number { return Math.min(this._primary.damage, INFANTRY_MAX_PRIMARY_DAMAGE); }

    /** Special feature codes that apply to the platoon's attack (Infantry Weapon Classifications Table, TM p.148). */
    public getSpecialFeatures(): string[] {
        const features = new Set<string>();
        for (const weapon of this._fieldedWeapons()) {
            // Anti-aircraft and flame-based: one weapon is enough.
            if (weapon.special.includes("A")) features.add("A");
            if (weapon.special.includes("F")) features.add("F");
        }
        if (this.hasHeavyBurst()) features.add("B");
        // Non-penetrating applies only when that weapon sets the Base Range.
        if (this.getRangeWeapon().special.includes("N")) features.add("N");
        return [...features].sort();
    }

    /** Heavy burst needs at least 2 such weapons per squad; a primary weapon is carried by far more than that. */
    public hasHeavyBurst(): boolean {
        if (this._primary.special.includes("B") || this.isPrimaryDamageCapped()) return true;
        return !!this._secondary && this._secondary.special.includes("B") && this.getSecondaryPerSquad() >= 2;
    }

    /**
     * Modifier added in the platoon's own hex on top of the range table: +1 for a point-blank weapon, -1 for heavy
     * burst and +1 for a weapon with a crew of 2 or more, or of 1E (TM pp.148-149, 152).
     */
    public getSameHexModifier(): number {
        let modifier = 0;
        if (this.getRangeWeapon().damageType === "P") modifier += 1;
        if (this.hasHeavyBurst()) modifier -= 1;
        if (this._fieldedWeapons().some((weapon) => weapon.crew >= 2 || weapon.encumbering)) modifier += 1;
        return modifier;
    }

    /** To-hit modifiers from the platoon's own hex outwards; the list ends at its maximum range. */
    public getRangeModifiers(): number[] {
        const row = INFANTRY_RANGE_MODIFIERS[this.getRangeWeapon().baseRange] ?? INFANTRY_RANGE_MODIFIERS[0];
        return row.map((modifier, range) => range === 0 ? modifier + this.getSameHexModifier() : modifier);
    }
    public getMaxRange(): number { return this.getRangeModifiers().length - 1; }

    /** Damage of the full formation, rounded normally (TM p.152). */
    public getTotalDamage(): number {
        const secondary = this._secondary ? this.getSecondaryCount() * this._secondary.damage : 0;
        return roundNormally(secondary + this.getPrimaryCount() * this.getPrimaryDamage());
    }
    public getDamagePerTrooper(): number {
        const troopers = this.getTroopers();
        return troopers > 0 ? this.getTotalDamage() / troopers : 0;
    }
    /** Damage with that many troopers left on a record sheet line (TM p.152). */
    public getDamageForTroopers(troopers: number): number { return roundNormally(this.getDamagePerTrooper() * Math.max(0, troopers)); }
    /** Max Weapon Damage boxes for one record sheet line: index 0 is one surviving trooper. */
    public getDamageTable(lineTroopers: number = this.getSubPlatoons()[0]): number[] {
        return Array.from({ length: lineTroopers }, (_unused, index) => this.getDamageForTroopers(index + 1));
    }

    // Anti-'Mech capability, weight (TM p.155)

    /** Mechanized platoons are barred from Anti-'Mech attacks and take no kits. */
    public hasAntiMechKit(): boolean { return this._antiMechKit && !this.isMechanized(); }
    public setAntiMechKit(equipped: boolean): boolean {
        if (equipped && this.isMechanized()) return false;
        this._antiMechKit = !!equipped;
        return true;
    }
    public canMakeAntiMechAttacks(): boolean { return !this.isMechanized(); }

    public getGunnery(): number { return this._gunnery; }
    public setGunnery(skill: number): void { this._gunnery = savedNumber(skill, this._gunnery, 0, 8); }
    /** 8, fixed, without Anti-'Mech kits or on a mechanized platoon. */
    public getAntiMechSkill(): number { return this.hasAntiMechKit() ? this._antiMech : INFANTRY_FIXED_ANTI_MECH_SKILL; }
    public setAntiMechSkill(skill: number): void { this._antiMech = savedNumber(skill, this._antiMech, 0, 8); }

    public getWeightPerTrooper(): number {
        return this._motive.weightPerTrooper + (this.hasAntiMechKit() ? INFANTRY_ANTI_MECH_KIT_TONS : 0);
    }
    /** Transport weight, rounded up to the half ton. */
    public getWeight(troopers: number = this.getTroopers()): number { return roundUpHalf(troopers * this.getWeightPerTrooper()); }

    // Battle Value (TM p.309)

    /** Target movement modifier at the platoon's MP, with +1 for jumping (Total Warfare's movement modifiers). */
    public getTargetMovementModifier(): number {
        const mp = this.getMP();
        let modifier = 0;
        if (mp >= 25) modifier = 6;
        else if (mp >= 18) modifier = 5;
        else if (mp >= 10) modifier = 4;
        else if (mp >= 7) modifier = 3;
        else if (mp >= 5) modifier = 2;
        else if (mp >= 3) modifier = 1;
        return modifier + (this._motive.tag === "jump" && mp > 0 ? 1 : 0);
    }

    /** Speed Factor for the platoon's fastest movement mode, to two decimal places (TM p.316). */
    public static speedFactor(mp: number): number {
        return Math.round(Math.pow(1 + (mp - 5) / 10, 1.2) * 100) / 100;
    }

    private _calcBattleValue(): { value: number; log: string[] } {
        const troopers = this.getTroopers();
        const defensiveFactor = 1 + this.getTargetMovementModifier() / 10;
        const defensive = troopers * 1.5 * defensiveFactor;
        const log: string[] = [];
        log.push(`${troopers} troopers x 1.5 = ${format(troopers * 1.5)}`);
        log.push(`Target Movement Modifier +${this.getTargetMovementModifier()}: Defensive Factor ${format(defensiveFactor, 1)}`);
        log.push(`Defensive Battle Rating = ${format(defensive)}`);

        const primary = this.getPrimaryCount() * this._primary.battleValue;
        const secondary = this._secondary ? this.getSecondaryCount() * this._secondary.battleValue : 0;
        log.push(`${this.getPrimaryCount()} x ${this._primary.name} (${format(this._primary.battleValue)}) = ${format(primary)}`);
        if (this._secondary && this.getSecondaryCount() > 0) {
            log.push(`${this.getSecondaryCount()} x ${this._secondary.name} (${format(this._secondary.battleValue)}) = ${format(secondary)}`);
        }
        let weapons = primary + secondary;
        if (this.canMakeAntiMechAttacks()) {
            log.push(`Anti-'Mech attack capability: weapons added again, ${format(weapons)} + ${format(weapons)}`);
            weapons *= 2;
        }
        const speedFactor = InfantryPlatoon.speedFactor(this.getMP());
        const offensive = weapons * speedFactor;
        log.push(`Offensive Battle Rating = ${format(weapons)} x Speed Factor ${format(speedFactor)} (${this.getMP()} MP) = ${format(offensive)}`);
        const value = roundNormally(defensive + offensive);
        log.push(`Battle Value: ${format(defensive)} + ${format(offensive)} = ${format(defensive + offensive)}, rounded to ${value}`);
        return { value, log };
    }

    public getBattleValue(): number { return this._calcBattleValue().value; }
    /** The calculation, one plain-text line per step. */
    public getBattleValueLog(): string[] { return this._calcBattleValue().log; }

    /** Mechanized platoons adjust Gunnery only and use the table's 5 column (TM p.314). */
    public getSkillMultiplier(): number {
        const column = this.isMechanized() ? 5 : this.getAntiMechSkill();
        return getTechManualSkillMultiplier(this._gunnery, column) ?? 1;
    }
    public getSkillAdjustedBattleValue(): number { return roundNormally(this.getBattleValue() * this.getSkillMultiplier()); }

    // Cost (TM pp.276, 282)

    /**
     * Base Trooper Cost = 2,000 x the square root of the weapon's cost, times the motive type's multiplier and 5 for
     * Anti-'Mech training and equipment. The book prices a platoon with one weapon type; where a secondary weapon
     * is carried, each trooper is priced by the weapon they fire, as MegaMek does. Null when a fielded weapon has
     * no price in the cost table.
     */
    private _calcCost(): { value: number | null; log: string[] } {
        const unpriced = this._fieldedWeapons().filter((weapon) => weapon.cost === null);
        if (unpriced.length > 0) {
            return { value: null, log: [`The cost table (TM pp.298-301) gives no price for ${unpriced.map((weapon) => weapon.name).join(" or ")}.`] };
        }
        const trooperCost = (weapon: IInfantryWeapon): number => 2000 * Math.sqrt(weapon.cost ?? 0);
        const log: string[] = [];
        let total = this.getPrimaryCount() * trooperCost(this._primary);
        log.push(`${this.getPrimaryCount()} troopers x 2,000 x square root of ${format(this._primary.cost ?? 0, 0)} (${this._primary.name}) = ${format(total)}`);
        if (this._secondary && this.getSecondaryCount() > 0) {
            const secondary = this.getSecondaryCount() * trooperCost(this._secondary);
            log.push(`${this.getSecondaryCount()} troopers x 2,000 x square root of ${format(this._secondary.cost ?? 0, 0)} (${this._secondary.name}) = ${format(secondary)}`);
            total += secondary;
        }
        log.push(`${this._motive.name}: x ${format(this._motive.costMultiplier, 1)}`);
        total *= this._motive.costMultiplier;
        if (this.hasAntiMechKit()) {
            log.push(`Anti-'Mech training and equipment: x ${INFANTRY_ANTI_MECH_COST_MULTIPLIER}`);
            total *= INFANTRY_ANTI_MECH_COST_MULTIPLIER;
        }
        const value = Math.floor(total + 1e-6);
        log.push(`Cost: ${format(value, 0)} C-bills`);
        return { value, log };
    }

    public getCBillCost(): number | null { return this._calcCost().value; }
    public getCBillCostLog(): string[] { return this._calcCost().log; }

    // Legality

    public getIssues(): string[] {
        const issues: string[] = [];
        const troopers = this.getTroopers();
        const subPlatoons = this.getSubPlatoons();
        if (this._squadSize > this._motive.maxSquadSize) {
            issues.push(`${this._motive.name} squads hold at most ${this._motive.maxSquadSize} troopers (TM p.145)`);
        }
        if (this._squads > INFANTRY_MAX_SQUADS_PER_PLATOON * subPlatoons.length) {
            issues.push(`At most ${INFANTRY_MAX_SQUADS_PER_PLATOON} squads are allowed per platoon or sub-platoon (TM p.146)`);
        }
        if (this.isMechanized() && troopers > this._motive.maxPlatoonSize) {
            issues.push(`${this._motive.name} platoons hold at most ${this._motive.maxPlatoonSize} troopers (TM p.145)`);
        }
        for (const weapon of this._fieldedWeapons()) {
            const bar = this._weaponBar(weapon);
            if (bar) issues.push(bar);
        }
        if (this._primary.type === "support") issues.push("The primary weapon must be a Melee or Standard weapon (TM p.150)");
        if (this._secondary && this._primary.type === "melee" && this._secondary.type === "support") {
            issues.push("A platoon with a Melee primary weapon may only carry a Melee or Standard secondary weapon (TM p.151)");
        }
        if (this._secondary && this.getSecondaryPerSquad() > this.getMaxSecondaryPerSquad()) {
            issues.push(`A squad of ${this._squadSize} can crew ${this.getMaxSecondaryPerSquad()} ${this._secondary.name} at most (TM p.151)`);
        }
        return issues;
    }

    /** Things worth knowing that do not make the platoon illegal. */
    public getNotes(): string[] {
        const notes: string[] = [];
        const subPlatoons = this.getSubPlatoons();
        if (subPlatoons.length > 1) {
            notes.push(`Oversized: ${this.getTroopers()} troopers are fielded as ${subPlatoons.length} sub-platoons of ${subPlatoons.join(", ")} (TM p.146).`);
        }
        if (this.isPrimaryDamageCapped()) {
            notes.push(`${this._primary.name} counts as ${INFANTRY_MAX_PRIMARY_DAMAGE.toFixed(2)} damage per trooper and gives the platoon heavy burst (TM p.150).`);
        }
        if (this.isMoveOrFire()) notes.push("With 2 support weapons per squad, a foot platoon may move or fire in a turn, not both (TM p.151).");
        else if (this.carriesHeavySupportLoad() && this._motive.supportMPLoss > 0) notes.push("Carrying 2 support weapons per squad costs 1 MP (TM p.151).");
        if (this._secondary?.tag === INFANTRY_SUPPORT_PPC_TAG && this.getSecondaryCount() > 0) notes.push("The Support Particle Cannon holds the platoon to 2 MP (TM p.352).");
        if (!this.isMechanized() && !this.hasAntiMechKit()) notes.push("Without Anti-'Mech kits the platoon's Anti-'Mech Skill is fixed at 8 (TM p.155).");
        if (this.isMechanized()) notes.push("Mechanized infantry cannot make Anti-'Mech Leg or Swarm attacks (TM p.144).");
        if (!this.usesFormationSizes()) notes.push(`Custom arrangement: ${this._formation.name} ${this._motive.name.toLowerCase()} platoons are ${this._formation.sizes[this._motive.tag].join(" troopers in each of ")} squads (TM p.147).`);
        return notes;
    }

    // Saving

    public export(): IInfantryPlatoonExport {
        return {
            uuid: this._uuid,
            lastUpdated: this.lastUpdated.toISOString(),
            name: this._name,
            techBase: this._techBase,
            formation: this._formation.tag,
            motive: this._motive.tag,
            squadSize: this._squadSize,
            squads: this._squads,
            primaryWeapon: this._primary.tag,
            secondaryWeapon: this._secondary ? this._secondary.tag : "",
            secondaryPerSquad: this.getSecondaryPerSquad(),
            antiMechKit: this._antiMechKit,
            gunnery: this._gunnery,
            antiMech: this._antiMech,
        };
    }

    public exportJSON(): string { return JSON.stringify(this.export()); }

    /** Reads a saved platoon one field at a time; anything unusable falls back to a default and is reported. */
    public importJSON(json: string): boolean {
        this._importIssues = [];
        let raw: unknown;
        try {
            raw = JSON.parse(json);
        } catch {
            this._importIssues.push("The saved platoon could not be read");
            return false;
        }
        if (!isPlainObject(raw)) {
            this._importIssues.push("The saved platoon could not be read");
            return false;
        }

        const uuid = savedString(raw.uuid);
        if (/^[0-9a-zA-Z-]{8,64}$/.test(uuid)) this._uuid = uuid;
        const updated = new Date(savedString(raw.lastUpdated));
        if (!Number.isNaN(updated.getTime())) this.lastUpdated = updated;
        this.setName(savedString(raw.name));

        this._techBase = raw.techBase === "clan" ? "clan" : "is";
        const formation = INFANTRY_FORMATIONS.find((item) => item.tag === raw.formation && item.techBase === this._techBase);
        if (!formation && raw.formation !== undefined) this._importIssues.push(`Unknown formation '${savedString(raw.formation).slice(0, 60)}': using ${this.getAvailableFormations()[0].name}`);
        this._formation = formation ?? this.getAvailableFormations()[0];
        const motive = INFANTRY_MOTIVE_TYPES.find((item) => item.tag === raw.motive);
        if (!motive && raw.motive !== undefined) this._importIssues.push(`Unknown motive type '${savedString(raw.motive).slice(0, 60)}': using Foot`);
        this._motive = motive ?? INFANTRY_MOTIVE_TYPES[0];

        const [formationSquadSize, formationSquads] = this._formation.sizes[this._motive.tag];
        this._squadSize = savedNumber(raw.squadSize, formationSquadSize, 1, this._motive.maxSquadSize);
        this._squads = savedNumber(raw.squads, formationSquads, 1, INFANTRY_MAX_SQUADS);
        if (typeof raw.squadSize === "number" && raw.squadSize !== this._squadSize) this._importIssues.push(`Squad size set to ${this._squadSize}`);
        if (typeof raw.squads === "number" && raw.squads !== this._squads) this._importIssues.push(`Squads set to ${this._squads}`);

        this._primary = findInfantryWeapon(DEFAULT_PRIMARY) ?? infantryWeapons[0];
        this._secondary = null;
        this._secondaryPerSquad = 0;
        const primaryTag = savedString(raw.primaryWeapon);
        if (primaryTag && !this.setPrimaryWeapon(primaryTag)) {
            this._clampWeapons();
            this._importIssues.push(`Primary weapon '${primaryTag.slice(0, 60)}' cannot be carried: using ${this._primary.name}`);
        } else {
            this._clampWeapons();
        }
        const secondaryTag = savedString(raw.secondaryWeapon);
        const perSquad = savedNumber(raw.secondaryPerSquad, 0, 0, INFANTRY_MAX_SECONDARY_PER_SQUAD);
        if (secondaryTag && perSquad > 0) {
            if (this.setSecondaryWeapon(secondaryTag)) {
                this.setSecondaryPerSquad(perSquad);
                if (this._secondaryPerSquad !== perSquad) this._importIssues.push(`Secondary weapons per squad set to ${this._secondaryPerSquad}`);
            } else {
                this._importIssues.push(`Secondary weapon '${secondaryTag.slice(0, 60)}' cannot be carried: removed`);
            }
        }

        this._antiMechKit = raw.antiMechKit === true && !this.isMechanized();
        this._gunnery = savedNumber(raw.gunnery, 4, 0, 8);
        this._antiMech = savedNumber(raw.antiMech, 5, 0, 8);
        return true;
    }
}
