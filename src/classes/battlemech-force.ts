import { formatBattleValue, getBattleValueRules } from "../data/battle-value";
import { DEFAULT_RULES_EDITION, getEWarPlayRules, getRulesEdition } from "../data/rules-editions";
import { generateUUID } from "../utils/generateUUID";
import { addC3SensorPod as addEWarSensorPod, applyEWarBoard, C3Role, clearEWarOverridesFor, EWAR_BOARD_FIELDS, getC3GearType, getC3Status, IC3Status, tickC3Emergency, getC3NetworkMap, IC3Network, IEWarBoard, IEWarCarrier, IEWarPod, inferC3Role, validateC3Network } from "../utils/ewar-play";
import { getCarrierInstalledUuids, getQuirkInitiative, IQuirkCarrier, IQuirkInitiative, normalizeGameYear } from "../utils/quirk-effects";
import { BattleMech } from "./battlemech";
import Vehicle from "./vehicle";
import { BattleMechGroup, ICBTGroupExport } from "./battlemech-group";

/** Most groups read from one saved force. */
export const MAX_FORCE_GROUPS = 200;

export interface ICBTForceExport {
    groups: ICBTGroupExport[];
	uuid: string;
	lastUpdated: Date;

    heatApplied: boolean;
    turn: number;
    phase: number;
    hideHelp: boolean;

    /** Saved whenever it tracks anything, so turning the option off and on again keeps the shots in flight. */
    /** "Use design quirks": quirk effects apply in Play Mode. Missing in older saves. */
    quirksInPlay?: boolean;
    /** "Game year": the year play checks quirks' years against. Missing in older saves. */
    gameYear?: number | null;
    /** The rules edition being played, whose Battle Value the roster shows (plan ruling 3). Missing in older saves. */
    rulesEdition?: string;
    /** Each networked unit's C3 network name, by unit UUID (BV v4.1 p.23). Missing in older saves and with no networks. */
    c3Networks?: Record<string, string>;
    /** The C3 network records (type and each member role); `c3Networks` stays beside them for older readers. Missing in older saves. */
    c3NetworkRecords?: IC3Network[];
    /** The E-War board: declared ECM coverage, Narc and iNarc pods and TAG, by unit UUID or enemy target letter. Missing in older saves and when empty. */
    ewarBoard?: IEWarBoard;
    /** Each trailer's tractor by UUID: the tractor-trailer rigs that take Battle Value 1 on their combined MP (Maximum Tech p.92). Missing when there are none. */
    rigs?: Record<string, string>;
}

/** An enemy target on the board is named by one lower-case letter. */
function isEWarTargetLetter(id: string): boolean {
    return /^[a-z]$/.test(id);
}

/** Reads a saved board: only arrays of strings and pod objects of the right shape. */
function readEWarBoard(saved: unknown): IEWarBoard {
    const board: IEWarBoard = {};
    if( !saved || typeof saved !== "object" ) return board;
    const source = saved as Record<string, unknown>;
    for( const field of ["hostileEcm", "friendlyEcm", "tagged"] as const ) {
        const list = source[field];
        if( !Array.isArray(list) ) continue;
        const ids = list.filter((id): id is string => typeof id === "string" && id !== "");
        if( ids.length > 0 ) board[field] = ids;
    }
    if( source.narcPods && typeof source.narcPods === "object" && !Array.isArray(source.narcPods) ) {
        const pods: Record<string, IEWarPod[]> = {};
        for( const [id, list] of Object.entries(source.narcPods) ) {
            if( !Array.isArray(list) ) continue;
            const valid = list.filter((pod): pod is IEWarPod => !!pod && typeof pod === "object" && (pod.kind === "narc" || pod.kind === "inarc")
                && typeof pod.pod === "string" && typeof pod.turn === "number" && Number.isFinite(pod.turn))
                .map((pod) => ({ kind: pod.kind, pod: pod.pod, turn: pod.turn }));
            if( valid.length > 0 ) pods[id] = valid;
        }
        if( Object.keys(pods).length > 0 ) board.narcPods = pods;
    }
    if( source.personalEcm && typeof source.personalEcm === "object" && !Array.isArray(source.personalEcm) ) {
        const personal: Record<string, string[]> = {};
        for( const [id, list] of Object.entries(source.personalEcm) ) {
            if( !Array.isArray(list) ) continue;
            const mates = [...new Set(list.filter((mate): mate is string => typeof mate === "string" && mate !== "" && mate !== id))];
            if( mates.length > 0 ) personal[id] = mates;
        }
        if( Object.keys(personal).length > 0 ) board.personalEcm = personal;
    }
    if( Array.isArray(source.sensorPods) ) {
        const sensorPods = source.sensorPods.filter((pod): pod is { network: string; hex: string; turn: number } => !!pod && typeof pod === "object"
            && typeof pod.network === "string" && typeof pod.hex === "string" && typeof pod.turn === "number" && Number.isFinite(pod.turn))
            .map((pod) => ({ network: pod.network, hex: pod.hex, turn: pod.turn }));
        if( sensorPods.length > 0 ) board.sensorPods = sensorPods;
    }
    return board;
}

export class BattleMechForce {

	// public members: BattleMechGroup[] = [];

	public groupLabel: string = "Lance";

	private _uuid: string = generateUUID();
	private _lastUpdated: Date = new Date();

	public customName : string= "";

    public groups: BattleMechGroup[] = [];

    public turn: number = 1;
    public phase: number = 0;

    public hideHelp: boolean = false;

    public heatApplied: boolean = false;


    public quirksInPlay: boolean = false;
    /** "Game year": play checks quirks' years against it; null for the start of each unit's era. */
    public gameYear: number | null = null;
    /** The rules edition being played: the roster's Battle Values and totals follow it (plan ruling 3). */
    public rulesEdition: string = DEFAULT_RULES_EDITION;
    /** Each networked unit's C3 network name, by unit UUID: the units sharing a name form one network. */
    public c3Records: IC3Network[] = [];
    /** Each networked unit's network name by UUID: what Battle Value reads, derived from the records. */
    public get c3Networks(): Record<string, string> {
        return getC3NetworkMap(this.c3Records);
    }
    /** The E-War board; applyEWarBoard writes it onto the units. Ids are unit UUIDs or one lower-case enemy target letter. */
    public ewarBoard: IEWarBoard = {};
    /** Each trailer's tractor, by UUID: a tractor and its trailers are one unit for Battle Value 1, each rated on the rig's MP (Maximum Tech p.92). */
    public rigs: Record<string, string> = {};

    constructor(importObj: ICBTForceExport | null = null ) {
        if( importObj ) {
            this.import(importObj);
        }

        if( this.groups.length === 0 ) {
            this.groups.push( new BattleMechGroup() )
        }
    }

    setSelectedMech(
        uuid: string
    ) {
        for( const group of this.groups ) {
            for( const unit of group.members ) {
                if( unit.uuid === uuid ) {
                    unit.selectedMech = true;
                } else {
                    unit.selectedMech = false;
                }
            }
        }
    }

    getSelectedMech(): BattleMech | null {
        for( const group of this.groups ) {
            for( const unit of group.members ) {
                if( unit.selectedMech ) {
                    return unit;
                }
            }
        }
        return null;
    }

    public removeGroup(asGroupIndex: number) {
        if( this.groups.length > asGroupIndex && this.groups[asGroupIndex]) {
            this.groups.splice( asGroupIndex, 1);
        }
    }

    public renameGroup( newName: string, groupIndex: number ) {
        if( this.groups.length > groupIndex && this.groups[groupIndex]) {
            this.groups[groupIndex].customName = newName;
        }
    }

    public selectGroupLabel( newName: string, groupIndex: number ) {
        if( this.groups.length > groupIndex && this.groups[groupIndex]) {
            this.groups[groupIndex].groupLabel = newName;
        }
    }

    public export(
        noInPlayVariabless: boolean = false,
    ): ICBTForceExport {
        const returnValue: ICBTForceExport = {
            groups: [],
            uuid: this._uuid,
            lastUpdated: new Date(),
            turn: this.turn,
            phase: this.phase,
            hideHelp: this.hideHelp,
            heatApplied: this.heatApplied,
            quirksInPlay: this.quirksInPlay,
            gameYear: this.gameYear,
            rulesEdition: this.rulesEdition === DEFAULT_RULES_EDITION ? undefined : this.rulesEdition,
        }
        // Only units still in the force keep their network.
        const uuids = new Set(this.getEWarUnits().map((unit) => unit.getUUID()));
        const records = this.c3Records
            .map((record) => ({ ...record, members: record.members.filter((member) => uuids.has(member.uuid)).map((member) => ({ ...member })) }))
            .filter((record) => record.members.length > 0);
        if( records.length > 0 ) {
            returnValue.c3Networks = getC3NetworkMap(records);
            returnValue.c3NetworkRecords = records;
        }
        // The board keeps enemy target letters and the units still in the force.
        const unitIds = new Set(this.getEWarUnits().map((unit) => unit.getUUID()));
        const keep = (id: string) => isEWarTargetLetter(id) || unitIds.has(id);
        const board: IEWarBoard = {};
        for( const field of ["hostileEcm", "friendlyEcm", "tagged"] as const ) {
            const ids = (this.ewarBoard[field] ?? []).filter(keep);
            if( ids.length > 0 ) board[field] = ids;
        }
        const pods = Object.entries(this.ewarBoard.narcPods ?? {}).filter(([id, list]) => list.length > 0 && keep(id));
        if( pods.length > 0 ) board.narcPods = Object.fromEntries(pods);
        const personal = Object.entries(this.ewarBoard.personalEcm ?? {}).filter(([id]) => unitIds.has(id))
            .map(([id, mates]) => [id, mates.filter((mate) => unitIds.has(mate))] as const).filter(([, mates]) => mates.length > 0);
        if( personal.length > 0 ) board.personalEcm = Object.fromEntries(personal);
        const sensorPods = (this.ewarBoard.sensorPods ?? []).filter((pod) => this.c3Records.some((record) => record.name === pod.network));
        if( sensorPods.length > 0 ) board.sensorPods = sensorPods.map((pod) => ({ ...pod }));
        // Only rigs whose units are still in the force are kept.
        this.applyRigs();
        if( Object.keys(this.rigs).length > 0 ) returnValue.rigs = { ...this.rigs };
        // A stripped export drops unit E-War state, so it drops the board too.
        if( !noInPlayVariabless && Object.keys(board).length > 0 ) {
            returnValue.ewarBoard = board;
        }

        for( const group of this.groups) {
            returnValue.groups.push( group.export(noInPlayVariabless) );
        }

        return returnValue;
    }

    // Tractor-trailer rigs (Maximum Tech p.92) ---------------------------------------------------------------------

    private _rigVehicles(): Vehicle[] {
        return this.groups.flatMap((group) => group.vehicles);
    }

    /** The UUID of the tractor a trailer is linked to in this roster, empty for none. */
    public getRigTractor(trailerUuid: string): string {
        return this.rigs[trailerUuid] ?? "";
    }

    /** The trailers linked to a tractor. */
    public getRigTrailers(tractorUuid: string): Vehicle[] {
        const vehicles = this._rigVehicles();
        return Object.entries(this.rigs).filter(([, tractor]) => tractor === tractorUuid)
            .map(([trailer]) => vehicles.find((vehicle) => vehicle.getUUID() === trailer)).filter((vehicle): vehicle is Vehicle => !!vehicle);
    }

    /** The Flank MP of the rig a tractor pulls: its Cruising MP after the trailers' weight, times 1.5 rounded up; undefined with no trailers. */
    public getRigFlankMP(tractorUuid: string): number | undefined {
        const tractor = this._rigVehicles().find((vehicle) => vehicle.getUUID() === tractorUuid);
        const trailers = this.getRigTrailers(tractorUuid);
        if( !tractor || trailers.length === 0 ) return undefined;
        return Math.ceil(tractor.getCruiseMPPulling(trailers.reduce((sum, trailer) => sum + trailer.getTonnage(), 0)) * 1.5);
    }

    /**
     * Links a trailer to the tractor that pulls it, or with an empty tractor UUID unlinks it. Returns what is wrong (empty when it
     * took): both must be vehicles of this force, a tractor is not itself a trailer, and the trailers together weigh no more than the tractor.
     */
    public setRig(trailerUuid: string, tractorUuid: string): string[] {
        const vehicles = this._rigVehicles();
        if( !tractorUuid ) {
            delete this.rigs[trailerUuid];
            this.applyRigs();
            return [];
        }
        const trailer = vehicles.find((vehicle) => vehicle.getUUID() === trailerUuid);
        const tractor = vehicles.find((vehicle) => vehicle.getUUID() === tractorUuid);
        if( !trailer || !tractor ) return ["A rig links two vehicles of this force."];
        if( trailer === tractor ) return ["A vehicle cannot pull itself."];
        if( this.rigs[tractorUuid] ) return ["That vehicle is itself a trailer in another rig: a trailer does not pull a trailer here."];
        if( Object.values(this.rigs).includes(trailerUuid) ) return ["That trailer pulls others: unlink them first."];
        const others = this.getRigTrailers(tractorUuid).filter((entry) => entry !== trailer);
        const weight = others.reduce((sum, entry) => sum + entry.getTonnage(), 0) + trailer.getTonnage();
        if( weight > tractor.getTowCapacityTons() ) {
            return [`The trailers weigh ${weight} t together, more than the ${tractor.getTowCapacityTons()} t the tractor may pull (Maximum Tech p.79: no more than its own weight).`];
        }
        this.rigs[trailerUuid] = tractorUuid;
        this.applyRigs();
        return [];
    }

    /** Writes each rig's MP onto its tractor and trailers, and clears the rest; drops links to units no longer in the force. */
    public applyRigs(): void {
        const vehicles = this._rigVehicles();
        const present = new Set(vehicles.map((vehicle) => vehicle.getUUID()));
        for( const [trailer, tractor] of Object.entries(this.rigs) ) {
            if( !present.has(trailer) || !present.has(tractor) ) delete this.rigs[trailer];
        }
        for( const vehicle of vehicles ) vehicle.setRigFlankMP(null);
        for( const tractorUuid of new Set(Object.values(this.rigs)) ) {
            const flank = this.getRigFlankMP(tractorUuid);
            if( flank === undefined ) continue;
            vehicles.find((vehicle) => vehicle.getUUID() === tractorUuid)?.setRigFlankMP(flank);
            for( const trailer of this.getRigTrailers(tractorUuid) ) trailer.setRigFlankMP(flank);
        }
    }

    getUnitViaUUID(
        uuid: string
    ): BattleMech | null {
        for( const group of this.groups ) {
            for( const unit of group.members ) {
                if( unit.uuid === uuid )
                    return unit;
            }
        }
        return null;
    }

    updateUnitViaUUID(
        nv: BattleMech
    ): boolean {
        for( const groupIndex in this.groups ) {
            for( const unitIndex in this.groups[groupIndex].members ) {
                if( this.groups[groupIndex].members[unitIndex].uuid === nv.uuid ) {
                    this.groups[groupIndex].members[unitIndex] = nv;
                    return true;
                }
            }
        }
        return false;
    }

    public getPhaseName(
        num: number
    ): string {
        if( num === 0 ) {
            return "Initiative Phase"
        } else if( num === 1 ) {
            return "Movement Phase"
        } else if( num === 2 ) {
            return "Weapon Attack Phase"
        } else if( num === 3 ) {
            return "Physical Attack Phase"
        } else if( num === 4 ) {
            return "Heat Phase"
        } else if( num === 5 ) {
            return "End Phase"
        }

        return "???"
    }

    public import(importObj: ICBTForceExport) {
        // Forces come back from saves and other people's backups: read a bounded list of groups.
        const groups = Array.isArray(importObj.groups) ? importObj.groups.slice(0, MAX_FORCE_GROUPS) : [];
        for( const group of groups ) {
            this.groups.push( new BattleMechGroup( group) );
        }
        if( importObj.uuid ) {
            this._uuid = importObj.uuid;
        }

        if( typeof(importObj.turn) !== "undefined" ) {
            this.turn = importObj.turn;
        }
        if( typeof(importObj.phase) !== "undefined" ) {
            this.phase = importObj.phase;
        }

        if( typeof(importObj.hideHelp) !== "undefined" ) {
            this.hideHelp = importObj.hideHelp;
        }

        if( typeof(importObj.heatApplied) !== "undefined" ) {
            this.heatApplied = importObj.heatApplied;
        }

        this.quirksInPlay = !!importObj.quirksInPlay;
        this.gameYear = normalizeGameYear(importObj.gameYear);
        // An unknown or missing edition reads the default one.
        this.rulesEdition = getRulesEdition(importObj.rulesEdition).tag;
        this.c3Records = this.readC3Records(importObj);
        this.ewarBoard = readEWarBoard(importObj.ewarBoard);
        this.rigs = {};
        if( importObj.rigs && typeof importObj.rigs === "object" ) {
            for( const [trailer, tractor] of Object.entries(importObj.rigs) ) {
                if( typeof tractor === "string" && tractor ) this.rigs[trailer] = tractor;
            }
        }
        this.applyRigs();
        this.syncQuirkPlayYear();

        if( importObj.lastUpdated ) {
            this._lastUpdated = new Date(importObj.lastUpdated);
        }

    }

    public setGameYear(year: number): void {
        this.gameYear = normalizeGameYear(year);
        this.syncQuirkPlayYear();
    }

    /** Hands the game year to every unit, which checks its quirks' years against it in play. */
    public syncQuirkPlayYear(): void {
        for( const group of this.groups ) {
            const units: IQuirkCarrier[] = [...group.members, ...group.vehicles, ...group.fighters, ...group.smallCraft, ...group.capitalShips, ...group.battleArmor];
            for( const unit of units ) {
                unit.quirkPlayYear = this.gameYear;
            }
        }
    }

    /**
     * The side's Initiative quirk: the largest of its units still in the game, never the sum (CO p.225). Null when
     * none has one. Read only with the game's "Use design quirks" switch on.
     */
    public getInitiativeModifier(): IQuirkInitiative | null {
        let best: IQuirkInitiative | null = null;
        for( const group of this.groups ) {
            const units: IQuirkCarrier[] = [...group.members, ...group.vehicles, ...group.fighters, ...group.smallCraft, ...group.capitalShips, ...group.battleArmor];
            for( const unit of units ) {
                if( unit.isDestroyed() ) continue;
                const initiative = getQuirkInitiative(unit.quirks, getCarrierInstalledUuids(unit), this.gameYear ?? unit.getEra().yearStart);
                if( initiative && (!best || initiative.modifier > best.modifier) ) best = initiative;
            }
        }
        return best;
    }

    public applyHeat() {
        this.heatApplied = true;
        for( const group of this.groups ) {
            for( const unit of group.members ) {
                unit.applyHeat(this.quirksInPlay);
            }
        }
    }

    public getTotalUnits(): number {
        let returnValue: number = 0;

        for( const group of this.groups ) {
            returnValue += group.getTotalUnits();
        }

        return returnValue;
    }

    /**
     * Network records from a save: the records when present, else one record per name of an older uuid-to-name map (type from
     * the members gear, role Slave unless the unit carries only Master gear). A save is read as it is, never refused.
     */
    private readC3Records(importObj: ICBTForceExport): IC3Network[] {
        const types = ["master-slave", "c3i", "boosted", "naval", "nova", "modular"];
        const roles = ["master", "slave", "emergency", "member"];
        const records: IC3Network[] = [];
        if( Array.isArray(importObj.c3NetworkRecords) ) {
            for( const raw of importObj.c3NetworkRecords ) {
                if( !raw || typeof raw.name !== "string" || !raw.name || !types.includes(raw.type) || !Array.isArray(raw.members) ) continue;
                const members = raw.members
                    .filter((member) => member && typeof member.uuid === "string" && roles.includes(member.role))
                    .map((member) => ({ uuid: member.uuid, role: member.role,
                        ...(typeof member.since === "number" && Number.isFinite(member.since) ? { since: member.since } : {}),
                        ...(typeof member.master === "string" && member.master ? { master: member.master } : {}) }));
                if( members.length > 0 ) records.push({ name: raw.name.slice(0, 20), type: raw.type, members });
            }
            if( records.length > 0 ) return records;
        }
        if( importObj.c3Networks && typeof importObj.c3Networks === "object" ) {
            const units = this.getEWarUnits();
            for( const [uuid, name] of Object.entries(importObj.c3Networks) ) {
                if( typeof name !== "string" || !name ) continue;
                let record = records.find((entry) => entry.name === name.slice(0, 20));
                if( !record ) {
                    record = { name: name.slice(0, 20), type: "master-slave", members: [] };
                    records.push(record);
                }
                record.members.push({ uuid, role: "slave" });
            }
            for( const record of records ) {
                const gear = record.members.map((member) => units.find((unit) => unit.getUUID() === member.uuid)).map((unit) => unit && getC3GearType(unit));
                record.type = gear.includes("boosted") ? "boosted" : gear.includes("c3i") && !gear.includes("master-slave") ? "c3i"
                    : gear.includes("modular") && !gear.includes("master-slave") ? "modular" : gear.includes("nova") && !gear.includes("master-slave") ? "nova" : gear.includes("naval") && !gear.includes("master-slave") ? "naval" : "master-slave";
                for( const member of record.members ) {
                    const unit = units.find((entry) => entry.getUUID() === member.uuid);
                    if( unit ) member.role = inferC3Role(unit, record.type);
                }
            }
        }
        return records;
    }

    /** The network labels under the rules edition of each member unit (each unit plays under its own, Call 2); the force edition when no member is found. */
    private validateByUnitEditions(record: IC3Network, units: IEWarCarrier[], others: IC3Network[]): string[] {
        const editions = new Set(record.members.map((member) => units.find((unit) => unit.getUUID() === member.uuid)?.getRulesEdition()).filter((edition): edition is string => !!edition));
        if( editions.size === 0 ) editions.add(this.rulesEdition);
        return [...new Set([...editions].flatMap((edition) => validateC3Network(record, units, edition, { others })))];
    }

    /**
     * Puts the unit with `uuid` in the C3 network `name` (an empty name takes it out of any network), as `role` when given. A
     * network that would break the edition's limits is refused: the labels come back and nothing changes.
     */
    public setC3Network(uuid: string, name: string, role?: C3Role): string[] {
        const units = this.getEWarUnits();
        const unit = units.find((entry) => entry.getUUID() === uuid);
        const kept = this.c3Records
            .map((record) => ({ ...record, members: record.members.filter((member) => member.uuid !== uuid).map((member) => ({ ...member })) }))
            .filter((record) => record.members.length > 0);
        const target = name.slice(0, 20);
        let labels: string[] = [];
        if( target ) {
            let record = kept.find((entry) => entry.name === target);
            if( !record ) {
                // A network emptied by this move keeps the type it had.
                const type = this.c3Records.find((entry) => entry.name === target)?.type ?? (unit && getC3GearType(unit)) ?? "master-slave";
                record = { name: target, type, members: [] };
                kept.push(record);
            }
            const joined: IC3Network["members"][number] = { uuid, role: role ?? (unit ? inferC3Role(unit, record.type) : "slave") };
            // A Nova link is declared in the End Phase and works from the next turn (IO:AE p.60).
            if( record.type === "nova" ) joined.since = this.turn;
            record.members.push(joined);
            labels = this.validateByUnitEditions(record, units, kept);
        }
        if( labels.length === 0 ) {
            this.c3Records = kept;
        }
        return labels;
    }

    /** The link status of the unit with `uuid` in its network, or "not in a C3 network" (see getC3Status). */
    public getC3StatusFor(uuid: string, opts: { hostileAngelEcm?: boolean; hostileNovaEcm?: boolean } = {}): IC3Status {
        const units = this.getEWarUnits();
        const unit = units.find((entry) => entry.getUUID() === uuid);
        const record = this.c3Records.find((entry) => entry.members.some((member) => member.uuid === uuid));
        if( !unit || !record ) {
            return { linked: false, degrade: 0, labels: ["C3: the unit is not in a C3 network."] };
        }
        return getC3Status(unit, record, units, { board: this.ewarBoard, turn: this.turn, ...opts });
    }

    /** Names the Master (by UUID) a Slave hangs from, so losing that Master takes down its portion; an empty UUID clears it. */
    public setC3MasterOf(uuid: string, masterUuid: string): void {
        for( const record of this.c3Records ) {
            const member = record.members.find((entry) => entry.uuid === uuid);
            if( !member ) continue;
            if( masterUuid && record.members.some((entry) => entry.uuid === masterUuid && entry.role === "master") ) {
                member.master = masterUuid;
            } else {
                delete member.master;
            }
        }
    }

    /** Fires a C3 Remote Sensor pod into the network `name` at `hex` on the current turn; labels come back when refused. */
    public addC3SensorPod(name: string, hex: string): string[] {
        const record = this.c3Records.find((entry) => entry.name === name);
        if( !record ) return [`There is no network named ${name || "(blank)"} to fire a pod into.`];
        return addEWarSensorPod(this.ewarBoard, record, this.getEWarUnits(), this.rulesEdition, { hex, turn: this.turn });
    }

    /** Sets the type of the network `name` (C3 Master/Slave, C3i, Boosted, Naval, Nova); refused with labels when its members break that type limits. */
    public setC3NetworkType(name: string, type: IC3Network["type"]): string[] {
        const record = this.c3Records.find((entry) => entry.name === name);
        if( !record ) return [];
        const units = this.getEWarUnits();
        const linked = type === "master-slave" || type === "boosted";
        const changed: IC3Network = { ...record, type, members: record.members.map((member) => {
            // A role the player chose stays while it still fits the new type; the Master a Slave hangs from and a Nova turn stay too.
            const unit = units.find((entry) => entry.getUUID() === member.uuid);
            const role: C3Role = !linked ? "member" : member.role !== "member" ? member.role : unit ? inferC3Role(unit, type) : "slave";
            return { ...member, role };
        }) };
        const labels = this.validateByUnitEditions(changed, units, this.c3Records);
        if( labels.length === 0 ) {
            this.c3Records = this.c3Records.map((entry) => entry === record ? changed : entry);
        }
        return labels;
    }

    /** Every unit of every group, from all twelve lists. */
    public getEWarUnits(): IEWarCarrier[] {
        return this.groups.flatMap((group) => [
            ...group.members, ...group.vehicles, ...group.fighters, ...group.smallCraft, ...group.capitalShips, ...group.infantry,
            ...group.battleArmor, ...group.protoMechs, ...group.microMechs, ...group.walkers, ...group.buildings, ...group.battledroidsUnits,
        ]);
    }

    /**
     * Declares which units stand in hostile ECM, in friendly ECM or are tagged. Units named in the old or new entry lose a
     * hand override of that field, then the board is written onto the units.
     */
    public setEWarBoardEntry(field: "hostileEcm" | "friendlyEcm" | "tagged", ids: string[]): void {
        const old = this.ewarBoard[field] ?? [];
        const units = this.getEWarUnits();
        clearEWarOverridesFor(units.filter((unit) => old.includes(unit.getUUID()) || ids.includes(unit.getUUID())), EWAR_BOARD_FIELDS[field]);
        if( ids.length > 0 ) {
            this.ewarBoard[field] = [...new Set(ids)];
        } else {
            delete this.ewarBoard[field];
        }
        applyEWarBoard(this.ewarBoard, units);
    }

    /** Names the other units that share a Personal ECM carrier hex: they count as inside friendly ECM while its suite works. */
    public setPersonalEcmMates(carrierUuid: string, mateUuids: string[]): void {
        const mates = [...new Set(mateUuids)].filter((id) => id !== carrierUuid);
        if( mates.length > 0 ) {
            this.ewarBoard.personalEcm = { ...this.ewarBoard.personalEcm, [carrierUuid]: mates };
        } else if( this.ewarBoard.personalEcm ) {
            const rest = { ...this.ewarBoard.personalEcm };
            delete rest[carrierUuid];
            if( Object.keys(rest).length > 0 ) this.ewarBoard.personalEcm = rest; else delete this.ewarBoard.personalEcm;
        }
        this.refreshEWarBoard();
    }

    /** Writes the board onto the units again (after a suite changes mode, so a switched-off Personal ECM stops covering its hex). */
    public refreshEWarBoard(): void {
        applyEWarBoard(this.ewarBoard, this.getEWarUnits());
    }

    /** The end of a turn: TAG, and the turn engagements of each anti-missile item, clear on the units and the board; Narc and iNarc pods stay. */
    public endEWarTurn(): void {
        const units = this.getEWarUnits();
        // An Emergency Master that has taken over counts the turn (not one spent in hostile ECM), before the per-turn state clears.
        for( const record of this.c3Records ) {
            for( const member of record.members ) {
                const unit = units.find((entry) => entry.getUUID() === member.uuid);
                if( unit && member.role === "emergency" ) tickC3Emergency(unit, units, record);
            }
        }
        // A Remote Sensor pod works the 3 full turns after its launch turn, then it is gone.
        const podTurns = getEWarPlayRules(this.rulesEdition)?.items["c3-remote-sensor"]?.c3Turns ?? 3;
        const pods = (this.ewarBoard.sensorPods ?? []).filter((pod) => this.turn <= pod.turn + podTurns);
        if( pods.length > 0 ) {
            this.ewarBoard.sensorPods = pods;
        } else {
            delete this.ewarBoard.sensorPods;
        }
        this.setEWarBoardEntry("tagged", []);
        // A stunned infantry platoon returns, and a fall-back ends, in the End Phase of the turn (#645).
        // Next Turn has already advanced the turn, so the turn that ended is the one before.
        for( const platoon of this.groups.flatMap((group) => group.infantry) ) platoon.endTurnStun( this.turn - 1 );
        // Autocannons that spent the turn clearing a jam are free again (#643). A 'Mech clears its own flag in its Next Turn.
        for( const unit of this.groups.flatMap((group) => [...group.vehicles, ...group.fighters]) ) unit.advanceAutocannonTurn();
        for( const unit of units ) {
            delete unit.ewarPlay.tagged;
            delete unit.ewarPlay.amsUses;
            delete unit.ewarPlay.heat;
            if( unit.ewarPlay.overrides ) {
                unit.ewarPlay.overrides = unit.ewarPlay.overrides.filter((field) => field !== "tagged");
                if( unit.ewarPlay.overrides.length === 0 ) {
                    delete unit.ewarPlay.overrides;
                }
            }
        }
    }

    /** Sets the Narc and iNarc pods stuck to `id` (a unit UUID or an enemy target letter); an empty list removes them. */
    public setEWarNarcPods(id: string, pods: IEWarPod[]): void {
        const units = this.getEWarUnits();
        clearEWarOverridesFor(units.filter((unit) => unit.getUUID() === id), EWAR_BOARD_FIELDS.narcPods);
        const board = { ...(this.ewarBoard.narcPods ?? {}) };
        if( pods.length > 0 ) {
            board[id] = pods.map((pod) => ({ ...pod }));
        } else {
            delete board[id];
        }
        if( Object.keys(board).length > 0 ) {
            this.ewarBoard.narcPods = board;
        } else {
            delete this.ewarBoard.narcPods;
        }
        applyEWarBoard(this.ewarBoard, units);
    }

    /**
     * The side's bonuses from its uplinks, HQs and command consoles (Maximum Tech pp.59, 70, 91-92): Initiative, and Battle Value
     * added once per side after the total. A side takes one uplink or HQ, the best (an uplink wins a tie, as the console stacks
     * with it); the console's figure is cumulative with an uplink but not with an HQ, where the larger stands. Initiative counts
     * only an uplink that is switched on and a unit still in the game; the BV does not.
     */
    public getSideBonuses(edition: string = this.rulesEdition): { initiative: number; battleValue: number; log: string[]; initiativeLog: string[] } {
        const units = this.groups.flatMap((group) => [...group.members, ...group.vehicles]);
        const live = units.filter((unit) => !unit.isDestroyed());
        const rules = getBattleValueRules(edition, "mech").levelThree;
        const log: string[] = [];
        // 'Mechs and vehicles both carry uplinks (p.59); a vehicle's has no off switch in play, so it is on while the vehicle fights.
        const uplinks = units.filter((unit) => unit.hasSatelliteUplink());
        const uplinkUnits = live.filter((unit) => unit.isSatelliteUplinkActive());
        const uplinkOn = uplinkUnits.length > 0;
        const hqs = units.filter((unit): unit is Vehicle => unit instanceof Vehicle && unit.getHeadquartersKind() !== null);
        const mobile = hqs.some((unit) => unit.getHeadquartersKind() === "mobile");
        const consoles = units.some((unit) => unit instanceof BattleMech && unit.hasCommandConsole());
        const liveConsoles = live.some((unit) => unit instanceof BattleMech && unit.hasCommandConsole());
        const liveHqs = live.filter((unit): unit is Vehicle => unit instanceof Vehicle && unit.isHeadquartersActive());
        const liveMobile = liveHqs.some((unit) => unit.getHeadquartersKind() === "mobile");

        // Battle Value, per side.
        let battleValue = 0;
        const uplinkBV = uplinks.length > 0 ? rules?.satelliteUplink ?? 0 : 0;
        const hqBV = hqs.length > 0 ? (mobile ? rules?.mobileHq ?? 0 : rules?.fieldHq ?? 0) : 0;
        const consoleBV = consoles ? rules?.commandConsole ?? 0 : 0;
        if (rules) {
            if (uplinkBV > 0 && uplinkBV >= hqBV) {
                battleValue = uplinkBV + consoleBV;
                log.push(`Satellite uplink ${uplinkBV}${hqBV > 0 ? " (one uplink or HQ a side: the uplink stands, the HQ does not)" : ""}${consoleBV > 0 ? `, plus the command console ${consoleBV} (cumulative with an uplink)` : ""} (Maximum Tech pp.91-92)`);
            } else if (hqBV > 0) {
                battleValue = Math.max(hqBV, consoleBV);
                log.push(`${mobile ? "Mobile" : "Field"} HQ ${hqBV}${uplinkBV > 0 ? " (one uplink or HQ a side: the HQ stands)" : ""}${consoleBV > 0 ? `; the command console's ${consoleBV} is not cumulative with an HQ, so the larger counts` : ""} (Maximum Tech pp.91-92)`);
            } else if (consoleBV > 0) {
                battleValue = consoleBV;
                log.push(`Command console ${consoleBV} (Maximum Tech p.91)`);
            }
        }

        // Initiative.
        const uplinkInit = uplinkOn ? 2 : 0;
        const hqInit = liveHqs.length > 0 ? (liveMobile ? 2 : 1) : 0;
        const consoleInit = liveConsoles ? 2 : 0;
        const consoleUnit = live.find((unit) => unit instanceof BattleMech && unit.hasCommandConsole());
        const initiativeLog: string[] = [];
        let initiative = consoleInit;
        if (uplinkInit > 0 && uplinkInit >= hqInit) {
            initiative = uplinkInit + consoleInit;
            initiativeLog.push(`+2 satellite uplink on ${uplinkUnits[0].getName()} (Maximum Tech p.59, not cumulative with other uplinks)`);
            if (consoleInit > 0) initiativeLog.push(`+2 command console on ${consoleUnit?.getName()} (p.59, cumulative with the uplink)`);
        } else if (hqInit > 0) {
            initiative = Math.max(hqInit, consoleInit);
            initiativeLog.push(hqInit >= consoleInit
                ? `+${hqInit} ${liveMobile ? "mobile" : "field"} HQ on ${liveHqs.find((unit) => unit.getHeadquartersKind() === (liveMobile ? "mobile" : "field"))?.getName()} (Maximum Tech p.70, one HQ a side)`
                : `+2 command console on ${consoleUnit?.getName()} (pp.59, 70: not cumulative with an HQ, the larger stands)`);
        } else if (consoleInit > 0) {
            initiativeLog.push(`+2 command console on ${consoleUnit?.getName()} (Maximum Tech p.59)`);
        }
        return { initiative, battleValue, log, initiativeLog };
    }

    /** The force's skill-adjusted Battle Value under its edition, as the roster shows it (plan ruling 1); uplinks, HQs and command consoles count once for the side. */
    public getBattleValueText(): string {
        const types = [...new Set(this.groups.flatMap((group) => group.getBattleValueUnitTypes()))];
        return formatBattleValue((edition) => this.groups.reduce((total, group) => total + group.getTotalBattleValue(edition, this.groups, this.c3Networks), 0)
            + this.getSideBonuses(edition).battleValue, types, this.rulesEdition);
    }

    getTech(): string {
        let rv = "";

        for( const group of this.groups ) {
            const tech = group.getTech();
            // An empty group has no tech of its own.
            if( tech === "" ) {
                continue;
            }
            if( rv !== tech && rv !== "" ) {
                rv = "Mixed";
            }  else {
                if( rv !== "Mixed")
                    rv = tech;
            }
        }

        return rv;
    }

    getTotalTons(): number {
        let returnValue: number = 0;

        for( const group of this.groups ) {
            returnValue += group.getTotalTons();
        }

        return returnValue;
    }

    public newGroup() {
        this.groups.push( new BattleMechGroup() );
    }

    public getTotalGroups(): number {
        return this.groups.length;
    }
}