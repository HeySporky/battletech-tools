import * as React from 'react';
import { FaBook, FaEye, FaPlusCircle } from 'react-icons/fa';
import { Link } from "react-router";
import { getMULDisplayName, IASMULUnit } from '../../../../classes/alpha-strike-unit';
import { BattleMech } from '../../../../classes/battlemech';
import { BattleMechGroup } from '../../../../classes/battlemech-group';
import { filterMULRecords, searchBundledMUL } from '../../../../utils';
import AerospaceFighter from '../../../../classes/aerospace-fighter';
import BattleArmor from '../../../../classes/battle-armor';
import InfantryPlatoon from '../../../../classes/infantry-platoon';
import ProtoMech from '../../../../classes/protomech';
import SmallCraft from '../../../../classes/small-craft';
import CapitalShip from '../../../../classes/capital-ship';
import Vehicle from '../../../../classes/vehicle';
import { ARTVEE_SAMPLES } from '../../../../data/artvee-samples';
import { VTOLAM_SAMPLES } from '../../../../data/vtolam-samples';
import { getBundledMechEntries, IBundledMechRef, loadBundledMechDesign, loadBundledMechIndex } from '../../../../data/bundled-mechs';
import { BundledUnitType, IBundledUnitRef, loadBundledIndex, loadBundledUnitDesign } from '../../../../data/bundled-units';
import type { IBundledDesignHeader } from '../../../../utils/bundled-designs';
import BattleArmorRecordSheet from '../../../components/battle-armor-record-sheet';
import FighterRecordSheet from '../../../components/fighter-record-sheet';
import InfantryRecordSheet from '../../../components/infantry-record-sheet';
import ProtoMechRecordSheet from '../../../components/protomech-record-sheet';
import SmallCraftRecordSheet from '../../../components/small-craft-record-sheet';
import CapitalShipRecordSheet from '../../../components/capital-ship-record-sheet';
import VehicleRecordSheet from '../../../components/vehicle-record-sheet';
import TechnicalReadoutSheet from '../../../components/technical-readout-sheet';
import { getUnitRulesets } from '../../../../classes/unit-game-settings';
import { getBattleMechTroAdapter } from '../../../../classes/battlemech-tro';
import { getUnitTroAdapter } from '../../../../classes/unit-tro';
import type { TechnicalReadout } from '../../../../classes/technical-readout';
import type { ITroUnitAdapter } from '../../../../data/technical-readout-interfaces';
import { getMULAerospaceClass, MULAerospaceClass, buildClassicDesignIndex, ClassicDesignIndex, findClassicDesigns, getClassicMechEntries, getClassicUnitEntries, getDesignMULRecord, getDesignsOffMUL, getMULIdKey, getMULMatchKeys, getSSWRulesLevel, IClassicDesignEntry, IDesignSummary, isMULCapitalShip, isMULLargeAerospaceCraft } from '../../../../utils/classicMULMatch';
import { IMULSearchFilters } from '../../../../utils/mulSearchFilters';
import { getMULEraLabel, getMULTypeLabel } from '../../../../utils/mulUtilities';
import { paginate } from '../../../../utils/paginate';
import { getMULRecordStanding, getRulesLevelStanding, UnitStanding, worseStanding } from '../../../../utils/unit-standing';
import { loadMULListItems, MUL_SOURCE_OPTIONS } from '../../../../data/mul-list-items';
import type { BundledDesignSource } from '../../../../utils/bundled-designs';
import { IAppGlobals } from '../../../app-router';
import MULSearchFilters from '../../../components/mul-search-filters';
import UnitStandingBadge, { UnitStandingLegend } from '../../../components/unit-standing-badge';
import SearchResultsPager from '../../../components/search-results-pager';
import MechViewPanel from '../../../components/mech-view-panel';
import StandardModal from '../../../components/standard-modal';
import BattleMechTableGroup from './_tableGroup';
import type { JSX } from "react";
const Eye = FaEye as any;
const Book = FaBook as any;
const PlusCircle = FaPlusCircle as any;

// A saved 'Mech, already imported, or a bundled one imported when the user opens it.
type MechDesign = BattleMech | IBundledMechRef;

type ClassicMULUnit = Vehicle | AerospaceFighter | InfantryPlatoon | BattleArmor | ProtoMech | SmallCraft | CapitalShip;
// Likewise for the other types: a saved or sample unit, or a bundled MegaMek one.
type UnitDesign = ClassicMULUnit | IBundledUnitRef;
const isBundledRef = ( design: UnitDesign ): design is IBundledUnitRef => "header" in design;

// A type's designs, saved, sample and bundled, and their index by MUL match key.
interface IDesignPool<T> {
    index: ClassicDesignIndex<T>;
    entries: IClassicDesignEntry<T>[];
}

interface IPickerRow {
    unit: IASMULUnit;
    // The type when it is not a 'Mech.
    kind: IClassicMULKind | null;
    design: MechDesign | UnitDesign | null;
    standing: UnitStanding;
}

const BUNDLED_SOURCE_LABELS: Record<BundledDesignSource, string> = { ssw: "Skunk Werks", megamek: "MegaMek", mordel: "mordel.net", verified: "TRO" };

interface IClassicMULKind {
    typeIDs: number[];
    // Narrows a shared MUL type: fighters and the larger aerospace craft are both type 17.
    matches?: (unit: IASMULUnit) => boolean;
    creator: string;
    saves: (appGlobals: IAppGlobals) => { uuid?: string; lastUpdated?: unknown }[];
    load: (json: string) => ClassicMULUnit;
    // Designs that ship with the app, matched after the user's saves (like the Skunk Werks 'Mechs).
    bundled?: () => object[];
    // The bundled MegaMek designs of the kind (#241), matched last and imported only when one is opened.
    bundledTypes?: BundledUnitType[];
    // The blank record sheet the View button shows, drawn by the same components as Print Force.
    sheet: (unit: ClassicMULUnit) => JSX.Element;
    table: "vehicles" | "fighters" | "infantry" | "battleArmor" | "protoMechs" | "smallCraft" | "capitalShips";
}

// The Classic MUL search (Ideas #84): 'Mechs (BattleMechs and IndustrialMechs) match saved and bundled designs; the
// other types match saved designs and go into their own table in the group.
const CBT_MUL_MECH_TYPE_IDS = [18, 20];
const CBT_MUL_KINDS: IClassicMULKind[] = [
    { typeIDs: [19, 24], creator: "vehicle-creator", saves: (g) => g.vehicleSaves, load: (json) => new Vehicle( json ), table: "vehicles", sheet: (unit) => <VehicleRecordSheet vehicle={unit as Vehicle} />, bundled: () => ARTVEE_SAMPLES.map( (sample) => sample.save ), bundledTypes: ["vehicles", "support-vehicles"] },
    { typeIDs: [17], matches: (unit) => !isMULLargeAerospaceCraft( unit ), creator: "fighter-creator", saves: (g) => g.fighterSaves, load: (json) => new AerospaceFighter( json ), table: "fighters", sheet: (unit) => <FighterRecordSheet fighter={unit as AerospaceFighter} /> },
    { typeIDs: [21], creator: "infantry-creator", saves: (g) => g.infantrySaves, load: (json) => new InfantryPlatoon( json ), table: "infantry", sheet: (unit) => <InfantryRecordSheet platoons={[unit as InfantryPlatoon]} /> },
    { typeIDs: [22], creator: "battle-armor-creator", saves: (g) => g.battleArmorSaves, load: (json) => new BattleArmor( json ), bundledTypes: ["battle-armor"], table: "battleArmor", sheet: (unit) => <BattleArmorRecordSheet squads={[unit as BattleArmor]} /> },
    { typeIDs: [23], creator: "protomech-creator", saves: (g) => g.protoMechSaves, load: (json) => new ProtoMech( json ), bundledTypes: ["protomechs"], table: "protoMechs", sheet: (unit) => <ProtoMechRecordSheet proto={unit as ProtoMech} /> },
    { typeIDs: [17], matches: (unit) => isMULLargeAerospaceCraft( unit ) && !isMULCapitalShip( unit ), creator: "small-craft-creator", saves: (g) => g.smallCraftSaves, load: (json) => new SmallCraft( json ), bundledTypes: ["small-craft"], table: "smallCraft", sheet: (unit) => <SmallCraftRecordSheet craft={unit as SmallCraft} /> },
    { typeIDs: [17], matches: isMULCapitalShip, creator: "capital-ship-creator", saves: (g) => g.capitalShipSaves, load: (json) => new CapitalShip( json ), table: "capitalShips", sheet: (unit) => <CapitalShipRecordSheet ship={unit as CapitalShip} /> },
];
const CBT_MUL_TYPE_IDS = Array.from( new Set( CBT_MUL_MECH_TYPE_IDS.concat( ...CBT_MUL_KINDS.map( (kind) => kind.typeIDs ) ) ) );
// The MUL files fighters, Small Craft, DropShips and capital ships all under type 17, so the Type list gives each kind
// its own option (issue 322), on ids of their own that the search maps back to type 17 and the kind's Alpha Strike type.
const CBT_MUL_AEROSPACE_TYPES: { id: number; label: string; aeroClass: MULAerospaceClass }[] = [
    { id: 1701, label: "Aerospace Fighter", aeroClass: "AF" },
    { id: 1702, label: "Conventional Fighter", aeroClass: "CF" },
    { id: 1703, label: "Small Craft", aeroClass: "SC" },
    { id: 1704, label: "DropShip", aeroClass: "DS" },
    { id: 1705, label: "JumpShip", aeroClass: "JS" },
    { id: 1706, label: "WarShip", aeroClass: "WS" },
    { id: 1707, label: "Space Station", aeroClass: "SS" },
];
const CBT_MUL_TYPE_OPTIONS = CBT_MUL_TYPE_IDS
    .flatMap( (id) => id === 17 ? CBT_MUL_AEROSPACE_TYPES : [{ id, label: getMULTypeLabel( id ) }] )
    .map( ({ id, label }) => ({ id, label }) );
const MUL_RESULTS_PAGE_SIZE = 25;

export default class BattleMechAddMechDialog extends React.Component<IBattleMechAddMechDialogProps, IBattleMechAddMechDialogState> {

    private searchTimeout: ReturnType<typeof setTimeout> | null = null;
    private latestSearch = 0;
    private designIndex: { key: string; pool: IDesignPool<MechDesign> } | null = null;
    private unitIndexes = new Map<IClassicMULKind, { key: string; pool: IDesignPool<UnitDesign> }>();
    private rows: { key: string; rows: IPickerRow[] } | null = null;
    // The sample designs that ship with the app (VTOLAMs, ArtVees), told apart from the user's saves.
    private samples = new WeakSet<object>();

    constructor(props: IBattleMechAddMechDialogProps) {
        super(props);
        this.state = {
            viewingUnit: null,
            viewingOther: null,
            viewingTRO: null,
            updated: false,
            mulResults: [],
            mulPage: 0,
            mulSearching: false,
            bundledMechs: [],
            bundledUnits: {},
            mulKeys: null,
        }

    }

    componentDidMount() {
        // A search saved before the Type list split type 17 (issue 322) has no option left, so it starts from All.
        if( this.props.appGlobals.appSettings.cbtMULSearch.type === 17 ) {
            this.props.appGlobals.appSettings.cbtMULSearch.type = 0;
        }
        void this.updateMULResults();
        // Every match key on any of the lists, ticked or not: a design one names is not "off the MUL".
        loadMULListItems( MUL_SOURCE_OPTIONS.map( (option) => option.value ) )
            .then( (units) => this.setState({ mulKeys: new Set( units.filter( (unit) => CBT_MUL_TYPE_IDS.includes( unit.Type?.Id ) ).flatMap( (unit) => [ ...getMULMatchKeys( unit.Name ?? "", unit.Variant ?? "" ), getMULIdKey( unit.Id ) ] ) ) }) )
            .catch( (error) => console.error("Unable to load the Master Unit List", error) );
        loadBundledMechIndex().then( (bundledMechs) => this.setState({ bundledMechs }) )
            .catch( (error) => console.error("Unable to load the bundled 'Mechs", error) );
        for( const type of CBT_MUL_KINDS.flatMap( (kind) => kind.bundledTypes ?? [] ) ) {
            loadBundledIndex( type ).then( (headers) => this.setState( (state) => ({ bundledUnits: { ...state.bundledUnits, [type]: headers } }) ) )
                .catch( (error) => console.error("Unable to load the bundled " + type, error) );
        }
    }

    componentWillUnmount() {
        if( this.searchTimeout ) {
            clearTimeout( this.searchTimeout );
        }
    }

    updateMULFilters = ( filters: IMULSearchFilters, search: boolean ): void => {
        const appSettings = this.props.appGlobals.appSettings;
        const termChanged = filters.term !== appSettings.cbtMULSearch.term;
        appSettings.cbtMULSearch = filters;
        this.props.appGlobals.saveAppSettings( appSettings );
        this.setState({ updated: true });
        if( !search ) {
            return;
        }
        if( this.searchTimeout ) {
            clearTimeout( this.searchTimeout );
        }
        // Wait for the user to stop typing before searching on the name.
        this.searchTimeout = setTimeout( () => void this.updateMULResults(), termChanged ? 500 : 0 );
    }

    updateMULResults = async (): Promise<void> => {
        const searchId = ++this.latestSearch;
        this.setState({ mulSearching: true });
        const filters = this.props.appGlobals.appSettings.cbtMULSearch;
        const aerospace = CBT_MUL_AEROSPACE_TYPES.find( (type) => type.id === filters.type );
        const results = ( await searchBundledMUL( { ...filters, type: aerospace ? 17 : filters.type } ) )
            .filter( (unit) => CBT_MUL_TYPE_IDS.includes( unit.Type?.Id ) )
            .filter( (unit) => !aerospace || getMULAerospaceClass( unit ) === aerospace.aeroClass )
            .sort( (a, b) => getMULDisplayName(a).localeCompare( getMULDisplayName(b) ) );
        if( searchId !== this.latestSearch ) {
            return;
        }
        this.setState({ mulResults: results, mulPage: 0, mulSearching: false });
    }

    // Saved designs come first, so a design the user built wins over a bundled copy of the same name, model and layout;
    // one with another layout is listed beside it.
    getDesignIndex = (): IDesignPool<MechDesign> => {
        const saves = this.props.appGlobals.battleMechSaves;
        const bundled = this.state.bundledMechs;
        const key = JSON.stringify( saves.map( (save) => save.uuid + save.lastUpdated ) ) + bundled.length;
        if( !this.designIndex || this.designIndex.key !== key ) {
            // The sample VTOLAMs ship with the app like the ArtVees, after the user's own saves (#376).
            const samples = getClassicMechEntries( VTOLAM_SAMPLES.map( (sample) => new BattleMech( JSON.stringify( sample.save ) ) ) );
            samples.forEach( (entry) => this.samples.add( entry.design ) );
            const saved = getClassicMechEntries( ( saves as object[] ).map( (save) => new BattleMech( JSON.stringify( save ) ) ) );
            const entries: IClassicDesignEntry<MechDesign>[] = [ ...saved, ...samples, ...getBundledMechEntries( bundled ) ];
            this.designIndex = { key, pool: { index: buildClassicDesignIndex<MechDesign>( entries ), entries } };
        }
        return this.designIndex.pool;
    }

    // Runs a button's action on the design, importing a bundled one first.
    withMech = ( design: MechDesign, action: ( e: React.FormEvent<HTMLButtonElement>, mech: BattleMech ) => void ) => ( e: React.FormEvent<HTMLButtonElement> ): void => {
        e.preventDefault();
        if( design instanceof BattleMech ) {
            action( e, design );
            return;
        }
        loadBundledMechDesign( design.header, design.configuration ).then( (mech) => action( e, mech ) )
            .catch( (error) => console.error("Unable to load " + design.header.name, error) );
    }

    // Other types have no crit table to compare: a saved and a bundled design of one name and model are the same
    // design when their Battle Values agree.
    getUnitIndex = ( kind: IClassicMULKind ): IDesignPool<UnitDesign> => {
        const saves = kind.saves( this.props.appGlobals );
        const headers = ( kind.bundledTypes ?? [] ).flatMap( (type) => ( this.state.bundledUnits[type] ?? [] ).map( (header) => ({ type, header }) ) );
        const key = JSON.stringify( saves.map( (save) => String( save.uuid ) + String( save.lastUpdated ) ) ) + headers.length;
        let cached = this.unitIndexes.get( kind );
        if( !cached || cached.key !== key ) {
            const load = ( save: object ) => kind.load( JSON.stringify( save ) );
            const samples = getClassicUnitEntries( ( kind.bundled ? kind.bundled() : [] ).map( load ) );
            samples.forEach( (entry) => this.samples.add( entry.design ) );
            const bundled = headers.map( ({ type, header }) => ({ chassis: header.name, model: header.model, design: { type, header } as UnitDesign, fingerprint: String( header.bv ), mulId: header.mulId }) );
            const entries: IClassicDesignEntry<UnitDesign>[] = [ ...getClassicUnitEntries( saves.map( load ) ), ...samples ]
                .map( (entry) => ({ ...entry, fingerprint: String( entry.design.getBattleValue() ) }) );
            entries.push( ...bundled );
            cached = { key, pool: { index: buildClassicDesignIndex<UnitDesign>( entries ), entries } };
            this.unitIndexes.set( kind, cached );
        }
        return cached.pool;
    }

    // Runs a button's action on the unit, importing a bundled one first.
    withUnit = ( design: UnitDesign, action: ( e: React.FormEvent<HTMLButtonElement>, unit: ClassicMULUnit ) => void ) => ( e: React.FormEvent<HTMLButtonElement> ): void => {
        e.preventDefault();
        if( !isBundledRef( design ) ) {
            action( e, design );
            return;
        }
        loadBundledUnitDesign( design.type, design.header ).then( (unit) => action( e, unit ) )
            .catch( (error) => console.error("Unable to load " + design.header.name, error) );
    }

    importOtherUnit = ( e: React.FormEvent<HTMLButtonElement> | null, kind: IClassicMULKind, design: ClassicMULUnit ): void => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        if( this.props.currentForce ) {
            const unit = kind.load( design.exportJSON() );
            unit.newUUID();
            unit.resetInPlay();
            ( this.props.currentForce[kind.table] as ClassicMULUnit[] ).push( unit );
            this.props.onChange( this.props.currentForce );
            this.setState({ viewingOther: null });
        }
    }

    viewTRO = ( e: React.FormEvent<HTMLButtonElement>, design: BattleMech | ClassicMULUnit ): void => {
        e.preventDefault();
        this.showTRO( design );
    }

    showTRO = ( design: BattleMech | ClassicMULUnit ): void => {
        const adapter = design instanceof BattleMech ? getBattleMechTroAdapter( design ) : getUnitTroAdapter( design );
        this.setState({ viewingTRO: { title: design.getName(), tro: design.tro, adapter, rulesets: getUnitRulesets( design ) } });
    }

    viewOtherUnit = ( e: React.FormEvent<HTMLButtonElement>, kind: IClassicMULKind, design: ClassicMULUnit ): void => {
        e.preventDefault();
        this.setState({ viewingOther: { kind, design } });
    }


    viewUnit = (
        e: React.FormEvent<HTMLButtonElement>,
        bm: BattleMech,
        mulBattleValue?: number,
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.setState({
            viewingUnit: bm,
            viewingMulBattleValue: mulBattleValue,
        })
    }

    closeViewUnit = (
        e: React.FormEvent<HTMLButtonElement> | null,
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        this.setState({
            viewingUnit: null,
        })
    }

    addViewedUnit = (
        e: React.FormEvent<HTMLButtonElement> | null,
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        if( this.props.currentForce && this.state.viewingUnit ) {
            const currentForce = this.props.currentForce;
            const newBM = new BattleMech( this.state.viewingUnit.exportJSON()  );
            newBM.newUUID();
            currentForce.members.push (
                newBM
            )
            this.props.onChange( currentForce );
            this.setState({
                viewingUnit: null,
            })
        }

    }

    importUnit = (
        e: React.FormEvent<HTMLButtonElement> | null,
        bm: BattleMech,
    ) => {
        if( e && e.preventDefault ) {
            e.preventDefault();
        }
        if( this.props.currentForce && bm ) {
            const currentForce = this.props.currentForce;
            const newBM = new BattleMech( bm.exportJSON()  );
            newBM.newUUID();
            currentForce.members.push (
                newBM
            )
            this.props.onChange( currentForce );
            this.setState({
                viewingUnit: null,
            })
        }

    }

    // A row of the one list: a Master Unit List entry with one of its designs (a row each when they differ in layout)
    // or none yet, or a design no MUL entry names, shown through a stand-in record the same filters test.
    getRows = (): IPickerRow[] => {
        const filters = this.props.appGlobals.appSettings.cbtMULSearch;
        const mechs = this.getDesignIndex();
        const pools = CBT_MUL_KINDS.map( (kind) => this.getUnitIndex( kind ) );
        const key = [ this.latestSearch, this.state.mulSearching, this.state.mulKeys?.size, JSON.stringify( filters ), mechs.entries.length, ...pools.map( (pool) => pool.entries.length ) ].join( "|" );
        if( this.rows && this.rows.key === key ) {
            return this.rows.rows;
        }
        const rows: IPickerRow[] = [];
        for( const unit of this.state.mulResults ) {
            const kindIndex = CBT_MUL_KINDS.findIndex( (item) => item.typeIDs.includes( unit.Type?.Id ) && ( !item.matches || item.matches( unit ) ) );
            const kind = kindIndex < 0 ? null : CBT_MUL_KINDS[kindIndex];
            const designs: ( MechDesign | UnitDesign )[] = kind ? findClassicDesigns( unit, pools[kindIndex].index ) : findClassicDesigns( unit, mechs.index );
            const recordStanding = getMULRecordStanding( unit );
            if( designs.length === 0 ) {
                rows.push( { unit, kind, design: null, standing: recordStanding } );
            }
            for( const design of designs ) {
                // A saved design beside a bundled one of another layout is the user's own variant.
                const own = this.getDesignStanding( design, designs.length === 1 && recordStanding === "canon" ? "canon" : "custom" );
                rows.push( { unit, kind, design, standing: worseStanding( recordStanding, own ) } );
            }
        }
        const mulKeys = this.state.mulKeys;
        if( mulKeys && !this.state.mulSearching ) {
            const aerospace = CBT_MUL_AEROSPACE_TYPES.find( (type) => type.id === filters.type );
            const offMUL = [
                ...getDesignsOffMUL( mechs.entries, mechs.index, (key) => mulKeys.has( key ) ).map( (entry) => ({ entry, kind: null as IClassicMULKind | null }) ),
                ...CBT_MUL_KINDS.flatMap( (kind, index) => getDesignsOffMUL( pools[index].entries, pools[index].index, (key) => mulKeys.has( key ) ).map( (entry) => ({ entry, kind }) ) ),
            ].map( ({ entry, kind }, index) => ({ entry, kind, record: getDesignMULRecord( this.summarize( entry, kind ), "design-" + index ) }) );
            const passing = new Set( filterMULRecords( offMUL.map( (item) => item.record ), { ...filters, type: aerospace ? 17 : filters.type } )
                .filter( (record) => !aerospace || getMULAerospaceClass( record ) === aerospace.aeroClass ) );
            for( const item of offMUL.filter( (item) => passing.has( item.record ) ) ) {
                rows.push( { unit: item.record, kind: item.kind, design: item.entry.design, standing: this.getDesignStanding( item.entry.design, "custom" ) } );
            }
        }
        rows.sort( (a, b) => getMULDisplayName( a.unit ).localeCompare( getMULDisplayName( b.unit ) ) );
        // The Standing filter goes by the row's own standing: a fan-made design of a canon MUL entry is fan-made.
        const shown = rows.filter( (row) => filters.standings.includes( row.standing ) );
        this.rows = { key, rows: shown };
        return shown;
    }

    /** A bundled design's standing is in its header; a saved one's comes from its rules level, else `otherwise`. */
    getDesignStanding = ( design: MechDesign | UnitDesign, otherwise: UnitStanding ): UnitStanding => {
        if( "header" in design ) {
            return design.header.standing ?? "canon";
        }
        const standing = getRulesLevelStanding( design.getRequiredRulesLevel() );
        return standing !== "canon" ? standing : this.samples.has( design ) ? "custom" : otherwise;
    }

    // What the results show of a design off the MUL, and its search filters test.
    summarize = ( entry: IClassicDesignEntry<MechDesign | UnitDesign>, kind: IClassicMULKind | null ): IDesignSummary => {
        const design = entry.design;
        const base = { name: entry.chassis, model: entry.model };
        const typeId = kind ? kind.typeIDs[0] : 18;
        const bfType = ( tons: number ) => kind?.table === "fighters" ? "AF" : kind?.table === "smallCraft" ? ( tons <= 200 ? "SC" : "DS" ) : kind?.table === "capitalShips" ? "WS" : undefined;
        if( "header" in design ) {
            const header = design.header;
            const bv = "bv" in design ? design.bv : header.bv;
            return { ...base, tons: header.tons, bv, tech: header.tech, typeId, year: header.year, rulesLevel: header.rulesLevel, bfType: bfType( header.tons ) };
        }
        const unit = design as ClassicMULUnit | BattleMech & { getTonnage?(): number; getTech?(): { name: string }; getTechName?(): string; isClan?(): boolean };
        const tons = "getTonnage" in unit && unit.getTonnage ? +unit.getTonnage() : 0;
        const tech = "getTech" in unit && unit.getTech ? unit.getTech().name : "getTechName" in unit && unit.getTechName ? unit.getTechName() : "isClan" in unit && unit.isClan?.() ? "Clan" : "Inner Sphere";
        const year = ( unit.getEra() as { yearStart?: number } | null )?.yearStart;
        return { ...base, tons, bv: unit.getBattleValue(), tech, typeId: design instanceof BattleMech && design.isIndustrialMech() ? 20 : typeId, year, rulesLevel: getSSWRulesLevel( unit.getRequiredRulesLevel() ), bfType: bfType( tons ) };
    }

    renderMULSearch = (): JSX.Element => {
        const rows = this.state.mulSearching ? [] : this.getRows();
        const resultsPage = paginate( rows, this.state.mulPage, MUL_RESULTS_PAGE_SIZE );
        return (
<fieldset className="fieldset">
    <legend>Find Units</legend>
    <p className="small-text">
        One list of every unit the app has: the Master Unit List copy kept in the app, your saved designs, the sample VTOLAMs and ArtVees, and the designs converted from Solaris Skunk Werks and MegaMek's unit files (MegaMek Data by The MegaMek Team, CC BY-NC-SA 4.0), each checked against the Battle Value on the Master Unit List. A design with the same name, model and layout is listed once, whatever its source; one with another layout gets a row of its own. Designs no MUL entry names are listed too, and the filters on factions, roles and Alpha Strike values leave them out. Idea from Camille, Centrella-Sworn on the Star League Discord.
    </p>
    <MULSearchFilters
        filters={this.props.appGlobals.appSettings.cbtMULSearch}
        onChange={this.updateMULFilters}
        idPrefix="cbt"
        typeOptions={CBT_MUL_TYPE_OPTIONS}
    />
    <h4 className="text-center">
        Results ({this.state.mulSearching ? "..." : rows.length})
    </h4>
    <UnitStandingLegend />
    {!this.state.mulSearching ? <SearchResultsPager page={resultsPage} onGo={(page) => this.setState({ mulPage: page })} /> : null}
    <table className="table">
        <thead>
            <tr>
                <th>Name</th>
                <th className="min-width no-wrap text-left">Source</th>
                <th className="min-width no-wrap text-left">Tech</th>
                <th className="min-width no-wrap text-left">Era</th>
                <th className="min-width no-wrap text-center">Tonnage</th>
                <th className="min-width no-wrap text-center">BV2</th>
                <th className="min-width no-wrap text-center"><span className="visually-hidden">Actions</span></th>
            </tr>
        </thead>
        <tbody>
            {!this.state.mulSearching && rows.length === 0 ? (
                <tr><td className="text-center" colSpan={7}>No units match your filters.</td></tr>
            ) : null}
            {resultsPage.items.map( (row, index) => this.renderRow( row, index ) )}
        </tbody>
    </table>
    {!this.state.mulSearching ? <SearchResultsPager page={resultsPage} onGo={(page) => this.setState({ mulPage: page })} below /> : null}
</fieldset>
        );
    }

    getSourceLabel = ( design: MechDesign | UnitDesign | null ): string => {
        if( !design ) {
            return "MUL only";
        }
        if( "header" in design ) {
            return BUNDLED_SOURCE_LABELS[design.header.source];
        }
        return this.samples.has( design ) ? "Sample" : "Saved";
    }

    // A design from mordel.net links to its unit page there.
    renderSource = ( design: MechDesign | UnitDesign | null ): JSX.Element | string => {
        const url = design && "header" in design ? design.header.sourceUrl : undefined;
        return url ? <a href={url} target="_blank" rel="noopener noreferrer">{this.getSourceLabel( design )}</a> : this.getSourceLabel( design );
    }

    renderRow = ( row: IPickerRow, index: number ): JSX.Element => {
        const { unit, kind, design } = row;
        // A design saved before it was named still needs a name for its row and buttons.
        const name = getMULDisplayName( unit ) || "Unnamed design";
        let bv: number = unit.BattleValue;
        let buttons: JSX.Element | null = null;
        if( design && !kind ) {
            const mech = design as MechDesign;
            bv = mech instanceof BattleMech ? mech.getBattleValue() : mech.bv;
            // A bundled design that matched this Master Unit List entry: the breakdown shows the list's BV beside ours (#599).
            const mulBattleValue = !( mech instanceof BattleMech ) && unit.BattleValue > 0 ? unit.BattleValue : undefined;
            buttons = (
                <>
                    <button className='btn btn-sm btn-primary' onClick={this.withMech( mech, (e, bm) => this.viewUnit( e, bm, mulBattleValue ) )} title={"View " + name}><Eye /></button>
                    <button className='btn btn-sm btn-primary' onClick={this.withMech( mech, this.viewTRO )} title={"Technical Readout of " + name} aria-label={"TRO " + name}><Book /></button>
                    <button className='btn btn-sm btn-primary' onClick={this.withMech( mech, this.importUnit )} title={"Add " + name + " to this group"} aria-label={"Add " + name}><PlusCircle /></button>
                </>
            );
        } else if( design && kind ) {
            const other = design as UnitDesign;
            bv = isBundledRef( other ) ? other.header.bv : other.getBattleValue();
            buttons = (
                <>
                    <button className='btn btn-sm btn-primary' onClick={this.withUnit( other, (e, loaded) => this.viewOtherUnit(e, kind, loaded) )} title={"View " + name} aria-label={"View " + name}><Eye /></button>
                    <button className='btn btn-sm btn-primary' onClick={this.withUnit( other, this.viewTRO )} title={"Technical Readout of " + name} aria-label={"TRO " + name}><Book /></button>
                    <button className='btn btn-sm btn-primary' onClick={this.withUnit( other, (e, loaded) => this.importOtherUnit(e, kind, loaded) )} title={"Add " + name + " to this group"} aria-label={"Add " + name}><PlusCircle /></button>
                </>
            );
        }
        return (
            <tr key={( unit.MulUnitKey ?? unit.Id ) + ":" + index}>
                <td><UnitStandingBadge standing={row.standing} />{name}</td>
                <td className="min-width no-wrap text-left">{this.renderSource( design )}</td>
                <td className="min-width no-wrap text-left">{unit.Technology?.Name}</td>
                <td className="min-width no-wrap text-left">{unit.EraId ? getMULEraLabel( unit.EraId ) : ""}</td>
                <td className="min-width no-wrap text-center">{unit.Tonnage}</td>
                <td className="min-width no-wrap text-center">{bv}</td>
                <td className="min-width no-wrap text-center">
                    {buttons ?? (
                        <span className="small-text">
                            No Classic design yet: <Link to={`${process.env.PUBLIC_URL}/classic-battletech/${kind ? kind.creator : "mech-creator"}`}>build it</Link>
                        </span>
                    )}
                </td>
            </tr>
        );
    }

    render = (): JSX.Element => {
        const viewingOther = this.state.viewingOther;
        const viewingTRO = this.state.viewingTRO;
        return(
<>
{viewingTRO ? (
    <StandardModal
        show={true}
        onClose={() => this.setState({ viewingTRO: null })}
        className="modal modal-xl"
        printable={true}
    >
        <h3 className="text-center">Technical Readout: {viewingTRO.title}</h3>
        <TechnicalReadoutSheet tro={viewingTRO.tro} adapter={viewingTRO.adapter} rulesets={viewingTRO.rulesets} />
    </StandardModal>
) : null}
{viewingOther ? (
    <StandardModal
        show={true}
        onClose={() => this.setState({ viewingOther: null })}
        onAdd={() => this.importOtherUnit( null, viewingOther.kind, viewingOther.design )}
        className="modal modal-xl"
        printable={true}
    >
        <h3 className="text-center">Viewing {( viewingOther.design.getName() + " " + ( "getModel" in viewingOther.design ? viewingOther.design.getModel() : "" ) ).trim()}</h3>
        {viewingOther.kind.sheet( viewingOther.design )}
    </StandardModal>
) : null}
{this.state.viewingUnit ? (
    <StandardModal
        show={true}
        onClose={this.closeViewUnit}
        onAdd={this.addViewedUnit}
        className="modal modal-xl"
        printable={true}
    >

        <h3 className="text-center">Viewing {this.state.viewingUnit.getName()}</h3>
        <MechViewPanel mech={this.state.viewingUnit} mulBattleValue={this.state.viewingMulBattleValue} />
    </StandardModal>
) : null}

    <div className="row">
      <div className="col">
          {this.renderMULSearch()}
      </div>
      <div className="col">
          <fieldset className="fieldset">
              <legend>Current Force</legend>

              <BattleMechTableGroup
                appGlobals={this.props.appGlobals}
                bmGroupIndex={this.props.currentForceIndex}
                showAdd={false}
                showEdit={true}
                // onChange={this.onForceChange}
            />
          </fieldset>
      </div>
    </div>

</>
        )
    }
}

interface IBattleMechAddMechDialogProps {
    appGlobals: IAppGlobals;
    currentForce: BattleMechGroup;
    currentForceIndex: number;
    onChange( nv: BattleMechGroup ): void;
}

interface IBattleMechAddMechDialogState {
    viewingUnit: BattleMech | null;
    viewingMulBattleValue?: number;
    updated: boolean;
    mulResults: IASMULUnit[];
    viewingOther: { kind: IClassicMULKind; design: ClassicMULUnit } | null;
    viewingTRO: { title: string; tro: TechnicalReadout; adapter: ITroUnitAdapter; rulesets: string[] } | null;
    mulPage: number;
    mulSearching: boolean;
    bundledMechs: IBundledDesignHeader[];
    bundledUnits: Partial<Record<BundledUnitType, IBundledDesignHeader[]>>;
    mulKeys: Set<string> | null;
}