import React, { type JSX } from "react";
import { Modal } from 'react-bootstrap';
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router";
import { RouteErrorBoundary } from "./components/error-boundary";
import type AlphaStrikeForce from "../classes/alpha-strike-force";
import type { IASForceExport } from "../classes/alpha-strike-force";
import type AlphaStrikeGroup from "../classes/alpha-strike-group";
import type { IASGroupExport } from "../classes/alpha-strike-group";
import type { BattleMech, IBattleMechExport } from "../classes/battlemech";
import type { BattleMechForce, ICBTForceExport } from "../classes/battlemech-force";
import type { BattleMechGroup, ICBTGroupExport } from "../classes/battlemech-group";
import type Vehicle from "../classes/vehicle";
import type { IVehicleExport } from "../classes/vehicle";
import type AerospaceFighter from "../classes/aerospace-fighter";
import type { IAerospaceFighterExport } from "../classes/aerospace-fighter";
import type InfantryPlatoon from "../classes/infantry-platoon";
import type { IInfantryPlatoonExport } from "../classes/infantry-platoon";
import type BattleArmor from "../classes/battle-armor";
import type { IBattleArmorExport } from "../classes/battle-armor";
import type ProtoMech from "../classes/protomech";
import type { IProtoMechExport } from "../classes/protomech";
import type MicroMech from "../classes/micro-mech";
import type { IMicroMechExport } from "../classes/micro-mech";
import type Walker from "../classes/walker";
import type { IWalkerExport } from "../classes/walker";
import type SmallCraft from "../classes/small-craft";
import type { ISmallCraftExport } from "../classes/small-craft";
import type CapitalShip from "../classes/capital-ship";
import type { ICapitalShipExport } from "../classes/capital-ship";
import type Building from "../classes/building";
import type { IBuildingExport } from "../classes/building";
import { CONST_SITE_TITLE } from '../configVars';
import { getAppSettings, onStorageSaveError, saveAppSettings } from "../dataSavesStorage";
import { loadUnitClasses, type UnitClasses } from "./app-unit-classes";
import { callAnalytics } from "../jdgAnalytics";
import { generateUUID } from "../utils/generateUUID";
import Alerts from './classes/alerts';
import { AppSettings } from "./classes/app_settings";
import Error404 from "./pages/error404";
import { IAlphaStrikeMPDeployment } from "../data/alpha-strike-mp-deployments";
import { IAlphaStrikeMPScenario } from "../data/alpha-strike-mp-scenarios";
import { IAlphaStrikeMPTerrain } from "../data/alpha-strike-mp-terrain";
// import init, { AlphaStrikeUnit, add_testing, MULUnit } from "btlibs";
const About = React.lazy(() => import("./pages/about"));
const AlphaStrikeRouter = React.lazy(() => import("./pages/alpha-strike/_router"));
const ClassicBattleTechRouter = React.lazy(() => import("./pages/classic-battletech/_router"));
const GameManagementRouter = React.lazy(() => import("./pages/game-management/_router"));
const Home = React.lazy(() => import("./pages/home"));
const OtherTools = React.lazy(() => import("./pages/other-tools"));
const SettingsRouter = React.lazy(() => import("./pages/settings/_router"));
// sanitize-html (with its HTML and CSS parsers) is only needed once a confirm dialog opens.
const SanitizedHTML = React.lazy(() => import("./components/sanitized-html"));

// The unit classes and equipment catalogs load after the shell (#589): the home page shows at once,
// every other page waits for the saved units to be built.
let saves: typeof import("../dataSaves");

export default class AppRouter extends React.Component<IAppRouterProps, IAppRouterState> {

    constructor(props: IAppRouterProps) {
        super(props);

        const settingsData = getAppSettings();

        const appSettings = new AppSettings( settingsData );

        // let uiTheme: string = "";
        // let lsTheme = getData("uiTheme");

        // Don't worry about tracking individual users here, this UUID resets on every page load or refresh and is NOT tied to a machine or browser...
        // this just helps me see the flow of traffic to help folks find what they need :)
        const sessionUUID = generateUUID();

        // console.log("settingsData", settingsData);
        if( settingsData && settingsData.uiTheme ) {
            document.body.className = settingsData.uiTheme;
        } else {
            document.body.className = '';
        }

        const appGlobals: IAppGlobals = {
            sessionUUID: sessionUUID,
            appSettings: appSettings,
            currentPageTitle: "",
            siteAlerts: new Alerts( this ),
            showMobile: false,
            confirmDialogMessage: "",
            confirmDialogTitle: "",
            confirmDialogYesLabel: "",
            confirmDialogNoLabel: "",
            showConfirmDialog: false,
            confirmDialogConfirm: null,
            confirmDialogAltLabel: "",
            confirmDialogAlt: null,
            makeDocumentTitle: this.makeDocumentTitle,
            openConfirmDialog: this.openConfirmDialog,
            refreshGlobalState: this.refreshGlobalState,
            toggleMobile: this.toggleMobile,
            closeMobile: this.closeMobile,

            saveAppSettings: this.saveAppSettings,

            favoriteASGroups: [],
            currentASForce: null,
            currentBattleMech: null,
            battleMechSaves: [],
            favoriteCBTGroups: [],
            currentCBTForce: null,
            currentVehicle: null,
            saveCurrentVehicle: this.saveCurrentVehicle,

            vehicleSaves: [],
            saveVehicleSaves: this.saveVehicleSaves,

            currentFighter: null,
            saveCurrentFighter: this.saveCurrentFighter,
            fighterSaves: [],
            saveFighterSaves: this.saveFighterSaves,

            currentInfantry: null,
            saveCurrentInfantry: this.saveCurrentInfantry,
            infantrySaves: [],
            saveInfantrySaves: this.saveInfantrySaves,

            currentBattleArmor: null,
            saveCurrentBattleArmor: this.saveCurrentBattleArmor,
            battleArmorSaves: [],
            saveBattleArmorSaves: this.saveBattleArmorSaves,

            currentProtoMech: null,
            saveCurrentProtoMech: this.saveCurrentProtoMech,
            protoMechSaves: [],
            saveProtoMechSaves: this.saveProtoMechSaves,

            currentMicroMech: null,
            saveCurrentMicroMech: this.saveCurrentMicroMech,
            microMechSaves: [],
            saveMicroMechSaves: this.saveMicroMechSaves,

            currentWalker: null,
            saveCurrentWalker: this.saveCurrentWalker,
            walkerSaves: [],
            saveWalkerSaves: this.saveWalkerSaves,

            currentSmallCraft: null,
            saveCurrentSmallCraft: this.saveCurrentSmallCraft,
            smallCraftSaves: [],
            saveSmallCraftSaves: this.saveSmallCraftSaves,

            currentCapitalShip: null,
            saveCurrentCapitalShip: this.saveCurrentCapitalShip,
            capitalShipSaves: [],
            saveCapitalShipSaves: this.saveCapitalShipSaves,

            currentBuilding: null,
            saveCurrentBuilding: this.saveCurrentBuilding,
            buildingSaves: [],
            saveBuildingSaves: this.saveBuildingSaves,

            saveCurrentASForce: this.saveCurrentASForce,
            saveFavoriteASGroups: this.saveFavoriteASGroups,
            saveASGroupFavorite: this.saveASGroupFavorite,
            removeASGroupFavorite: this.removeASGroupFavorite,

            saveCurrentCBTForce: this.saveCurrentCBTForce,
            saveFavoriteCBTGroups: this.saveFavoriteCBTGroups,
            saveCBTGroupFavorite: this.saveCBTGroupFavorite,
            removeCBTGroupFavorite: this.removeCBTGroupFavorite,

            saveCurrentBattleMech: this.saveCurrentBattleMech,

            saveBattleMechSaves: this.saveBattleMechSaves,

            currentDeployments: null,
            currentScenarios: null,
            currentTerrains: null
        }
        this.state = {
            updated: false,
            appGlobals: appGlobals,
            unitsLoaded: false,
        }

        // A save that cannot be written (browser storage full or disabled) is reported once, until dismissed.
        onStorageSaveError( () => {
            appGlobals.siteAlerts.addAlert(
                "danger",
                "Unable to Save",
                "Your browser's storage is full or unavailable, so the latest changes were not saved. Download a backup from Settings, then delete saved units or forces you no longer need.",
                "",
                true,
                null,
                0,
                "",
                "",
                "",
                "storage-save-failed",
            );
        });

/*
        init().then(
            async () => {
                let asImport: IASForceExport | null = await saves.getCurrentASForce(appSettings);
                if( asImport && asImport.groups ) {
                    for( let group of asImport.groups ) {
                        for( let unit of group.units ) {
                            let asObj = new AlphaStrikeUnit();
                            console.log("Y", JSON.stringify(unit) );
                            asObj.import_json( JSON.stringify(unit) );

                            console.log("X", asObj );
                            console.log("X2", asObj.name );
                            console.log("X2 ar", asObj.armor );
                            console.log("X2 st", asObj.structure );
                            console.log("X3", asObj.custom_name );
                        }
                    }

                }
                // console.log("X wasm add", add_testing( 3, 4));
                // let asObj = new AlphaStrikeUnit();
                // asObj.name = "Testing";
                // asObj.armor = 5;
                // asObj.structure = 3;
                // console.log("X", asObj );
                // console.log("X2", asObj.name );
                // console.log("X2 ar", asObj.armor );
                // console.log("X2 st", asObj.structure );
                // console.log("X3", asObj.custom_name );
            }
        );
*/
    }

    private _unmounted = false;

    private _unitClasses: UnitClasses | null = null;

    private _onConnectionChange = (): void => {
        this.setState({
            updated: true,
        })
    }

    componentDidMount(): void {
        this._unmounted = false;
        this.setData( this.state.appGlobals.appSettings, this.state.appGlobals );
        window.addEventListener('offline', this._onConnectionChange);
        window.addEventListener('online', this._onConnectionChange);
    }

    componentWillUnmount(): void {
        this._unmounted = true;
        window.removeEventListener('offline', this._onConnectionChange);
        window.removeEventListener('online', this._onConnectionChange);
    }

    setData = async (
        appSettings: AppSettings,
        appGlobals: IAppGlobals,
    ) => {

        const [units, loadedSaves] = await Promise.all([ loadUnitClasses(), import("../dataSaves") ]);
        saves = loadedSaves;
        this._unitClasses = units;
        const { AlphaStrikeForce, AlphaStrikeGroup, BattleMech, BattleMechForce, BattleMechGroup, Vehicle,
            AerospaceFighter, InfantryPlatoon, BattleArmor, ProtoMech, MicroMech, Walker, SmallCraft, CapitalShip, Building } = units;

        // This browser's custom content drafts must be registered before saved designs that use them load.
        units.registerLocalCustomContent();

        const asImport: IASForceExport | null = await saves.getCurrentASForce(appSettings);

        const alphaStrikeForce = new AlphaStrikeForce( asImport );

        const lsBMImport = await saves.getCurrentBattleMech(appSettings);
        const currentBattleMech = new BattleMech();
        if( lsBMImport ) {
            currentBattleMech.importJSON( lsBMImport);
        }

        const lsVehicleImport = await saves.getCurrentVehicle(appSettings);
        const currentVehicle = new Vehicle( lsVehicleImport || "" );

        const vehicleSaves: IVehicleExport[] = await saves.getVehicleSaves(appSettings);

        const currentFighter = new AerospaceFighter( (await saves.getCurrentFighter(appSettings)) || "" );
        const fighterSaves: IAerospaceFighterExport[] = await saves.getFighterSaves(appSettings);

        const currentInfantry = new InfantryPlatoon( (await saves.getCurrentInfantry(appSettings)) || "" );
        const infantrySaves: IInfantryPlatoonExport[] = await saves.getInfantrySaves(appSettings);

        const currentBattleArmor = new BattleArmor( (await saves.getCurrentBattleArmor(appSettings)) || "" );
        const battleArmorSaves: IBattleArmorExport[] = await saves.getBattleArmorSaves(appSettings);

        const currentProtoMech = new ProtoMech( (await saves.getCurrentProtoMech(appSettings)) || "" );
        const protoMechSaves: IProtoMechExport[] = await saves.getProtoMechSaves(appSettings);

        const currentMicroMech = new MicroMech( (await saves.getCurrentMicroMech(appSettings)) || "" );
        const microMechSaves: IMicroMechExport[] = await saves.getMicroMechSaves(appSettings);

        const currentWalker = new Walker( (await saves.getCurrentWalker(appSettings)) || "" );
        const walkerSaves: IWalkerExport[] = await saves.getWalkerSaves(appSettings);

        const currentSmallCraft = new SmallCraft( (await saves.getCurrentSmallCraft(appSettings)) || "" );
        const smallCraftSaves: ISmallCraftExport[] = await saves.getSmallCraftSaves(appSettings);

        const currentCapitalShip = new CapitalShip( (await saves.getCurrentCapitalShip(appSettings)) || "" );
        const capitalShipSaves: ICapitalShipExport[] = await saves.getCapitalShipSaves(appSettings);

        const currentBuilding = new Building( (await saves.getCurrentBuilding(appSettings)) || "" );
        const buildingSaves: IBuildingExport[] = await saves.getBuildingSaves(appSettings);

        const battleMechSaves: IBattleMechExport[] = await saves.getBattleMechSaves(appSettings);
        const asImportFavorites: IASGroupExport[] = await saves.getFavoriteASGroups(appSettings);

        // Basic Data Integrity Checks
        let needsBMReSave = false;
        for( const item of battleMechSaves ) {
            if( !item.uuid ) {
                item.uuid = generateUUID();
                needsBMReSave = true;
            }
        }

        if( needsBMReSave ) {
            console.info("Some UUIDs not found in BattleMech saves, generating UUIDS and re-saving...")
            await saves.saveBattleMechSaves( appSettings, battleMechSaves )
        }
        let needsASReSave = false;
        for( const item of asImportFavorites ) {
            if( !item.uuid ) {
                item.uuid = generateUUID();
                needsASReSave = true;
            }
        }
        if( needsASReSave ) {
            console.info("Some UUIDs not found in AlphaStrike Favorites saves, generating UUIDS and re-saving...")
            await saves.saveFavoriteASGroups(appSettings,  asImportFavorites )
        }

        // End of Basic Data Integrity Checks

        const asImportedFavorites: AlphaStrikeGroup[] = [];

        if( asImportFavorites.length > 0 ) {
            if( asImportFavorites && asImportFavorites.length > 0 )  {
                for( const importItem of asImportFavorites ) {
                    asImportedFavorites.push( new AlphaStrikeGroup(importItem) );
                }
            }
        }

        const bmImportFavorites: ICBTGroupExport[] = await saves.getFavoriteCBTGroups(appSettings);

        const bmImportedFavorites: BattleMechGroup[] = [];

        if( bmImportFavorites.length > 0 ) {
            if( bmImportFavorites && bmImportFavorites.length > 0 )  {
                for( const importItem of bmImportFavorites ) {
                    bmImportedFavorites.push( new BattleMechGroup(importItem) );
                }
            }
        }

        const bmfImport: ICBTForceExport | null = await saves.getCurrentCBTForce(appSettings);

        const currentCBTForce = new BattleMechForce( bmfImport );

        appGlobals.favoriteASGroups = asImportedFavorites;
        appGlobals.currentASForce = alphaStrikeForce;
        appGlobals.currentBattleMech = currentBattleMech;
        appGlobals.battleMechSaves = battleMechSaves;

        appGlobals.favoriteCBTGroups = bmImportedFavorites;
        appGlobals.currentCBTForce = currentCBTForce;
        appGlobals.currentVehicle = currentVehicle;
        appGlobals.vehicleSaves = vehicleSaves;
        appGlobals.currentFighter = currentFighter;
        appGlobals.fighterSaves = fighterSaves;
        appGlobals.currentInfantry = currentInfantry;
        appGlobals.infantrySaves = infantrySaves;
        appGlobals.currentBattleArmor = currentBattleArmor;
        appGlobals.battleArmorSaves = battleArmorSaves;
        appGlobals.currentProtoMech = currentProtoMech;
        appGlobals.protoMechSaves = protoMechSaves;
        appGlobals.currentMicroMech = currentMicroMech;
        appGlobals.microMechSaves = microMechSaves;
        appGlobals.currentWalker = currentWalker;
        appGlobals.walkerSaves = walkerSaves;
        appGlobals.currentSmallCraft = currentSmallCraft;
        appGlobals.smallCraftSaves = smallCraftSaves;
        appGlobals.currentCapitalShip = currentCapitalShip;
        appGlobals.capitalShipSaves = capitalShipSaves;
        appGlobals.currentBuilding = currentBuilding;
        appGlobals.buildingSaves = buildingSaves;


        // console.log("initial appGlobals loaded")

        if( this._unmounted )
            return;

        this.setState({
            appGlobals: appGlobals,
            unitsLoaded: true,
        })


    }

    saveBattleMechSaves = ( newValue: IBattleMechExport[] ): void => {

        const appGlobals = this.state.appGlobals;
        appGlobals.battleMechSaves = newValue;

        saves.saveBattleMechSaves( appGlobals.appSettings, appGlobals.battleMechSaves )

        this.setState({
            appGlobals: appGlobals,
        });
    }

    saveVehicleSaves = ( newValue: IVehicleExport[] ): void => {

        const appGlobals = this.state.appGlobals;
        appGlobals.vehicleSaves = newValue;

        saves.saveVehicleSaves( appGlobals.appSettings, appGlobals.vehicleSaves )

        this.setState({
            appGlobals: appGlobals,
        });
    }

    saveAppSettings = ( appSettings: AppSettings ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.appSettings = appSettings;

        if( appSettings.uiTheme.trim() ) {
            document.body.className = appSettings.uiTheme;
        } else {
            document.body.className = '';
        }

        saveAppSettings( appGlobals.appSettings.export() )

        this.setState({
            appGlobals: appGlobals,
            updated: true,
        });
    }

    saveCurrentBattleMech = ( mech: BattleMech ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.currentBattleMech = mech;
        this.setState({
            appGlobals: appGlobals,
        });

        mech.lastUpdated = new Date();

        saves.saveCurrentBattleMech( appGlobals.appSettings, mech.exportJSON() );
    }

    saveFighterSaves = ( newValue: IAerospaceFighterExport[] ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.fighterSaves = newValue;

        saves.saveFighterSaves( appGlobals.appSettings, appGlobals.fighterSaves )

        this.setState({
            appGlobals: appGlobals,
        });
    }

    saveBuildingSaves = ( newValue: IBuildingExport[] ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.buildingSaves = newValue;

        saves.saveBuildingSaves( appGlobals.appSettings, appGlobals.buildingSaves )

        this.setState({
            appGlobals: appGlobals,
        });
    }

    saveCurrentBuilding = ( building: Building ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.currentBuilding = building;
        this.setState({
            appGlobals: appGlobals,
        });

        building.lastUpdated = new Date();

        saves.saveCurrentBuilding( appGlobals.appSettings, building.exportJSON() );
    }

    saveInfantrySaves = ( newValue: IInfantryPlatoonExport[] ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.infantrySaves = newValue;

        saves.saveInfantrySaves( appGlobals.appSettings, appGlobals.infantrySaves )

        this.setState({
            appGlobals: appGlobals,
        });
    }

    saveCurrentInfantry = ( platoon: InfantryPlatoon ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.currentInfantry = platoon;
        this.setState({
            appGlobals: appGlobals,
        });

        platoon.lastUpdated = new Date();

        saves.saveCurrentInfantry( appGlobals.appSettings, platoon.exportJSON() );
    }

    saveBattleArmorSaves = ( newValue: IBattleArmorExport[] ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.battleArmorSaves = newValue;

        saves.saveBattleArmorSaves( appGlobals.appSettings, appGlobals.battleArmorSaves )

        this.setState({
            appGlobals: appGlobals,
        });
    }

    saveCurrentBattleArmor = ( suit: BattleArmor ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.currentBattleArmor = suit;
        this.setState({
            appGlobals: appGlobals,
        });

        suit.lastUpdated = new Date();

        saves.saveCurrentBattleArmor( appGlobals.appSettings, suit.exportJSON() );
    }

    saveProtoMechSaves = ( newValue: IProtoMechExport[] ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.protoMechSaves = newValue;

        saves.saveProtoMechSaves( appGlobals.appSettings, appGlobals.protoMechSaves )

        this.setState({
            appGlobals: appGlobals,
        });
    }

    saveCurrentProtoMech = ( proto: ProtoMech ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.currentProtoMech = proto;
        this.setState({
            appGlobals: appGlobals,
        });

        proto.lastUpdated = new Date();

        saves.saveCurrentProtoMech( appGlobals.appSettings, proto.exportJSON() );
    }

    saveMicroMechSaves = ( newValue: IMicroMechExport[] ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.microMechSaves = newValue;

        saves.saveMicroMechSaves( appGlobals.appSettings, appGlobals.microMechSaves )

        this.setState({
            appGlobals: appGlobals,
        });
    }

    saveWalkerSaves = ( newValue: IWalkerExport[] ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.walkerSaves = newValue;

        saves.saveWalkerSaves( appGlobals.appSettings, appGlobals.walkerSaves )

        this.setState({
            appGlobals: appGlobals,
        });
    }

    saveCurrentWalker = ( walker: Walker ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.currentWalker = walker;
        this.setState({
            appGlobals: appGlobals,
        });

        walker.lastUpdated = new Date();

        saves.saveCurrentWalker( appGlobals.appSettings, walker.exportJSON() );
    }

    saveCurrentMicroMech = ( micro: MicroMech ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.currentMicroMech = micro;
        this.setState({
            appGlobals: appGlobals,
        });

        micro.lastUpdated = new Date();

        saves.saveCurrentMicroMech( appGlobals.appSettings, micro.exportJSON() );
    }

    saveSmallCraftSaves = ( newValue: ISmallCraftExport[] ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.smallCraftSaves = newValue;

        saves.saveSmallCraftSaves( appGlobals.appSettings, appGlobals.smallCraftSaves )

        this.setState({
            appGlobals: appGlobals,
        });
    }

    saveCurrentSmallCraft = ( craft: SmallCraft ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.currentSmallCraft = craft;
        this.setState({
            appGlobals: appGlobals,
        });

        craft.lastUpdated = new Date();

        saves.saveCurrentSmallCraft( appGlobals.appSettings, craft.exportJSON() );
    }

    saveCapitalShipSaves = ( newValue: ICapitalShipExport[] ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.capitalShipSaves = newValue;

        saves.saveCapitalShipSaves( appGlobals.appSettings, appGlobals.capitalShipSaves )

        this.setState({
            appGlobals: appGlobals,
        });
    }

    saveCurrentCapitalShip = ( craft: CapitalShip ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.currentCapitalShip = craft;
        this.setState({
            appGlobals: appGlobals,
        });

        craft.lastUpdated = new Date();

        saves.saveCurrentCapitalShip( appGlobals.appSettings, craft.exportJSON() );
    }

    saveCurrentFighter = ( fighter: AerospaceFighter ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.currentFighter = fighter;
        this.setState({
            appGlobals: appGlobals,
        });

        fighter.lastUpdated = new Date();

        saves.saveCurrentFighter( appGlobals.appSettings, fighter.exportJSON() );
    }

    saveCurrentVehicle = ( vehicle: Vehicle ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.currentVehicle = vehicle;
        this.setState({
            appGlobals: appGlobals,
        });

        vehicle.lastUpdated = new Date();

        saves.saveCurrentVehicle( appGlobals.appSettings, vehicle.exportJSON() );
    }

    saveCurrentASForce = ( asForce: AlphaStrikeForce ): void => {

        const appGlobals = this.state.appGlobals;

        appGlobals.currentASForce = asForce;

        this.setState({
            appGlobals: appGlobals,
        });

        saves.saveCurrentASForce( appGlobals.appSettings, asForce.export() );
    }

    saveASGroupFavorite = ( asGroup: AlphaStrikeGroup ): void => {
        const appGlobals = this.state.appGlobals;
        const asGroupThinned = new this._unitClasses!.AlphaStrikeGroup( asGroup.export(true) ); // Don't Save in-play variables for Favorite Groups, this will save localStorage space
        appGlobals.favoriteASGroups.push( asGroupThinned );
        this.saveFavoriteASGroups( appGlobals.favoriteASGroups );

        saves.saveFavoriteASGroupsObjects( appGlobals.appSettings, appGlobals.favoriteASGroups )
    }

    removeASGroupFavorite = ( asGroupIndex: number ): void => {
        const appGlobals = this.state.appGlobals;

        if( appGlobals.favoriteASGroups.length > asGroupIndex ) {
            appGlobals.favoriteASGroups.splice( asGroupIndex, 1 );
            this.saveFavoriteASGroups( appGlobals.favoriteASGroups );

            saves.saveFavoriteASGroupsObjects( appGlobals.appSettings, appGlobals.favoriteASGroups )
        }

    }

    saveFavoriteASGroups = ( asGroups: AlphaStrikeGroup[] ): void => {
        const exportASGroups: IASGroupExport[] = [];
        for( const group of asGroups) {
            exportASGroups.push( group.export() );
        }
        // console.log("exportASGroups", exportASGroups)
        const appGlobals = this.state.appGlobals;
        appGlobals.favoriteASGroups = asGroups;
        this.setState({
            appGlobals: appGlobals,
        });
        saves.saveFavoriteASGroupsObjects( appGlobals.appSettings, appGlobals.favoriteASGroups )
    }

    saveCurrentCBTForce = ( bmForce: BattleMechForce ): void => {

        const appGlobals = this.state.appGlobals;
        appGlobals.currentCBTForce = bmForce;

        this.setState({
            appGlobals: appGlobals,
        });

        saves.saveCurrentCBTForce( appGlobals.appSettings, bmForce.export() );
        // saves.saveFavoriteCBTGroupsObjects( appGlobals.appSettings, appGlobals.favoriteCBTGroups )
    }

    saveCBTGroupFavorite = ( bmGroup: BattleMechGroup ): void => {
        const appGlobals = this.state.appGlobals;
        const bmGroupThinned = new this._unitClasses!.BattleMechGroup( bmGroup.export(true)); // Don't Save in-play variables for Favorite Groups, this will save localStorage space
        appGlobals.favoriteCBTGroups.push( bmGroupThinned );
        this.saveFavoriteCBTGroups( appGlobals.favoriteCBTGroups );
        saves.saveFavoriteCBTGroupsObjects( appGlobals.appSettings, appGlobals.favoriteCBTGroups )
    }

    removeCBTGroupFavorite = ( asGroupIndex: number ): void => {
        const appGlobals = this.state.appGlobals;

        if( appGlobals.favoriteCBTGroups.length > asGroupIndex ) {
            appGlobals.favoriteCBTGroups.splice( asGroupIndex, 1 );
            this.saveFavoriteCBTGroups( appGlobals.favoriteCBTGroups );

            saves.saveFavoriteCBTGroupsObjects( appGlobals.appSettings, appGlobals.favoriteCBTGroups )
        }

    }

    saveFavoriteCBTGroups = ( asGroups: BattleMechGroup[] ): void => {
        const exportCBTGroups: ICBTGroupExport[] = [];
        for( const group of asGroups) {
            exportCBTGroups.push( group.export() );
        }
        const appGlobals = this.state.appGlobals;
        appGlobals.favoriteCBTGroups = asGroups;
        this.setState({
            appGlobals: appGlobals,
        });
        saves.saveFavoriteCBTGroupsObjects( appGlobals.appSettings, appGlobals.favoriteCBTGroups )
    }

    toggleMobile = (): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.showMobile = !appGlobals.showMobile;
        this.setState({
            appGlobals: appGlobals,
            updated: true,
        })
    }

    closeMobile = (): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.showMobile = false;
        this.setState({
            appGlobals: appGlobals,
            updated: true,
        })
    }

    makeDocumentTitle = ( subTitle: string = "" ): void => {
        const appGlobals = this.state.appGlobals;

        callAnalytics(
            window,
            appGlobals.sessionUUID,
            __APP_VERSION__,
        );

        if( subTitle ) {
            document.title = subTitle + " | " + CONST_SITE_TITLE;
            appGlobals.currentPageTitle = subTitle;
            this.setState({
                appGlobals: appGlobals,
            })
        } else {
            document.title = CONST_SITE_TITLE;
            appGlobals.currentPageTitle = subTitle;
            this.setState({
                appGlobals: appGlobals,
            })
        }
    }

    refreshGlobalState = (appGlobals: IAppGlobals | null = null): void => {
        if( !appGlobals ) {
            this.setState({
                updated: true,
            });
        } else {
            this.setState({
                updated: true,
                appGlobals: appGlobals,
            });
        }
    }

    closeConfirmDialog = (): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.showConfirmDialog = false;
        this.setState({
            appGlobals: appGlobals,
        })
    }

    // The dialog's optional middle choice, such as "Discard it" beside "Save it first" and "Cancel".
    altConfirmDialog = (): void => {
        const alt = this.state.appGlobals.confirmDialogAlt;
        const appGlobals = this.state.appGlobals;
        appGlobals.showConfirmDialog = false;
        this.setState({ appGlobals: appGlobals });
        if( alt ) alt();
    }

    confirmConfirmDialog = (): void => {
        if( this.state.appGlobals ) {
            if( this.state.appGlobals.confirmDialogConfirm ) {
                this.state.appGlobals.confirmDialogConfirm();
            }
            const appGlobals = this.state.appGlobals;
            appGlobals.showConfirmDialog = false;
            this.setState({
                appGlobals: appGlobals,
            })
        }
    }

    openConfirmDialog = (
        confirmTitle: string,
        confirmMessage: string,
        confirmYesLabel: string,
        confirmNoLabel: string,
        confirmCallback: Function,
        altLabel?: string,
        altCallback?: Function,
    ): void => {
        const appGlobals = this.state.appGlobals;
        appGlobals.confirmDialogMessage = confirmMessage;
        appGlobals.confirmDialogTitle = confirmTitle;
        appGlobals.confirmDialogYesLabel = confirmYesLabel;
        appGlobals.confirmDialogNoLabel = confirmNoLabel;
        appGlobals.showConfirmDialog = true;
        appGlobals.confirmDialogConfirm = confirmCallback;
        appGlobals.confirmDialogAltLabel = altLabel ?? "";
        appGlobals.confirmDialogAlt = altCallback ?? null;
        this.setState({
            appGlobals: appGlobals,
        })
    }


    render = (): JSX.Element => {
        return (
            <>

                <Modal show={this.state.appGlobals.showConfirmDialog} onHide={this.closeConfirmDialog}>
                <Modal.Header closeButton>
                    <Modal.Title>
                            {this.state.appGlobals.confirmDialogTitle}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="form">
                        <div>
                            <React.Suspense fallback={null}>
                                <SanitizedHTML html={this.state.appGlobals.confirmDialogMessage} />
                            </React.Suspense>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>

                    <button className="btn btn-secondary" onClick={this.closeConfirmDialog}>
                        {this.state.appGlobals.confirmDialogNoLabel}
                    </button>
                    {this.state.appGlobals.confirmDialogAlt ? (
                        <button className="btn btn-danger" onClick={this.altConfirmDialog}>
                            {this.state.appGlobals.confirmDialogAltLabel}
                        </button>
                    ) : null}
                    <button className="btn btn-primary" onClick={this.confirmConfirmDialog}>
                        {this.state.appGlobals.confirmDialogYesLabel}
                    </button>

                </Modal.Footer>
            </Modal>
            <Router>

            <React.Suspense fallback={<div className="p-3">Loading...</div>}>
            <RouteErrorBoundary>
            <Routes>
                <Route path={`${process.env.PUBLIC_URL}/`} element={
                    <Home
                        appGlobals={this.state.appGlobals}
                    />
                }/>
                {!this.state.unitsLoaded ? (
                    <Route path="*" element={<div className="p-3">Loading...</div>}/>
                ) : (<>
                {/* <Route path={`${process.env.PUBLIC_URL}/page1`} >
                    <Page1
                        appGlobals={this.state.appGlobals}
                    />
                </Route> */}
                {/* The back-end editors moved under Settings (#97); old links still work. */}
                <Route path={`${process.env.PUBLIC_URL}/equipment-editor`}   element={
                    <Navigate replace to={`${process.env.PUBLIC_URL}/settings/equipment-editor`} />
                }/>

                <Route path={`${process.env.PUBLIC_URL}/custom-mul-editor`}   element={
                    <Navigate replace to={`${process.env.PUBLIC_URL}/settings/custom-mul-editor`} />
                }/>

                <Route path={`${process.env.PUBLIC_URL}/dev-status`}    element={
                    <Navigate replace to={`${process.env.PUBLIC_URL}/`} />
                }/>
                <Route path={`${process.env.PUBLIC_URL}/other-tools`}  element={
                    <OtherTools
                        appGlobals={this.state.appGlobals}
                    />
                }/>
                <Route path={`${process.env.PUBLIC_URL}/about`}  element={
                    <About
                        appGlobals={this.state.appGlobals}
                    />
                }/>
                <Route path={`${process.env.PUBLIC_URL}/settings/*`}  element={
                    <SettingsRouter
                        appGlobals={this.state.appGlobals}
                    />
                }/>
                <Route path={`${process.env.PUBLIC_URL}/alpha-strike-roster/*`}  element={
                    <Navigate to={`${process.env.PUBLIC_URL}/alpha-strike/roster/`} />
                } />

                <Route path={`${process.env.PUBLIC_URL}/mech-creator/*`}  element={
                    <Navigate to={`${process.env.PUBLIC_URL}/classic-battletech/mech-creator/`} />
                } />

                <Route path={`${process.env.PUBLIC_URL}/alpha-strike/*`}  element={
                    <AlphaStrikeRouter
                        appGlobals={this.state.appGlobals}
                    />
                }/>
                <Route path={`${process.env.PUBLIC_URL}/classic-battletech/*`}  element={
                    <ClassicBattleTechRouter
                        appGlobals={this.state.appGlobals}
                    />
                }/>
                <Route path={`${process.env.PUBLIC_URL}/game-management/*`}  element={
                    <GameManagementRouter
                        appGlobals={this.state.appGlobals}
                    />
                }/>

                <Route path="*" element={
                    <Error404
                        appGlobals={this.state.appGlobals}
                    />
                }/>
                </>)}

            </Routes>
            </RouteErrorBoundary>
            </React.Suspense>
            </Router>
            </>
        );
    }
}

interface IAppRouterProps {

}

interface IAppRouterState {
    appGlobals: IAppGlobals;
    updated: boolean;
    unitsLoaded: boolean;
}

export interface IAppGlobals {
    sessionUUID: string;
    currentPageTitle: string;
    siteAlerts: Alerts;
    appSettings: AppSettings;
    showMobile: boolean;
    confirmDialogMessage: string;
    confirmDialogTitle: string;
    confirmDialogYesLabel: string;
    confirmDialogNoLabel: string;
    showConfirmDialog: boolean;
    confirmDialogConfirm: Function | null;
    confirmDialogAltLabel: string;
    confirmDialogAlt: Function | null;
    refreshGlobalState(appGlobals: IAppGlobals | null): void;

    makeDocumentTitle( subTitle: string ): void;

    toggleMobile(): void;
    closeMobile(): void;

    openConfirmDialog(
        confirmTitle: string,
        confirmMessage: string,
        confirmYesLabel: string,
        confirmNoLabel: string,
        confirmCallback: Function,
        altLabel?: string,
        altCallback?: Function,
    ): void;

    currentASForce: AlphaStrikeForce | null;
    currentCBTForce: BattleMechForce | null;
    saveCurrentASForce( asForce: AlphaStrikeForce | null ): void;

    favoriteASGroups: AlphaStrikeGroup[];
    favoriteCBTGroups: BattleMechGroup[];
    saveFavoriteASGroups( asGroups: AlphaStrikeGroup[] ): void
    saveASGroupFavorite( asGroup: AlphaStrikeGroup ): void;
    removeASGroupFavorite( asGroupIndex: number ): void;

    currentBattleMech: BattleMech | null;
    saveCurrentBattleMech( mech: BattleMech | null ): void;
    currentVehicle: Vehicle | null;
    saveCurrentVehicle( vehicle: Vehicle | null ): void;
    vehicleSaves: IVehicleExport[];
    saveVehicleSaves( newValue: IVehicleExport[] ): void;
    currentFighter: AerospaceFighter | null;
    saveCurrentFighter( fighter: AerospaceFighter ): void;
    fighterSaves: IAerospaceFighterExport[];
    saveFighterSaves( newValue: IAerospaceFighterExport[] ): void;
    currentInfantry: InfantryPlatoon | null;
    saveCurrentInfantry( platoon: InfantryPlatoon ): void;
    infantrySaves: IInfantryPlatoonExport[];
    saveInfantrySaves( newValue: IInfantryPlatoonExport[] ): void;
    currentBattleArmor: BattleArmor | null;
    saveCurrentBattleArmor( suit: BattleArmor ): void;
    battleArmorSaves: IBattleArmorExport[];
    saveBattleArmorSaves( newValue: IBattleArmorExport[] ): void;
    currentProtoMech: ProtoMech | null;
    saveCurrentProtoMech( proto: ProtoMech ): void;
    protoMechSaves: IProtoMechExport[];
    saveProtoMechSaves( newValue: IProtoMechExport[] ): void;
    currentMicroMech: MicroMech | null;
    saveCurrentMicroMech( micro: MicroMech ): void;
    microMechSaves: IMicroMechExport[];
    saveMicroMechSaves( newValue: IMicroMechExport[] ): void;
    currentWalker: Walker | null;
    saveCurrentWalker( walker: Walker ): void;
    walkerSaves: IWalkerExport[];
    saveWalkerSaves( newValue: IWalkerExport[] ): void;
    currentSmallCraft: SmallCraft | null;
    saveCurrentSmallCraft( craft: SmallCraft ): void;
    smallCraftSaves: ISmallCraftExport[];
    saveSmallCraftSaves( newValue: ISmallCraftExport[] ): void;
    currentCapitalShip: CapitalShip | null;
    saveCurrentCapitalShip( ship: CapitalShip ): void;
    capitalShipSaves: ICapitalShipExport[];
    saveCapitalShipSaves( newValue: ICapitalShipExport[] ): void;
    currentBuilding: Building | null;
    saveCurrentBuilding( building: Building ): void;
    buildingSaves: IBuildingExport[];
    saveBuildingSaves( newValue: IBuildingExport[] ): void;
    saveAppSettings( appSettings: AppSettings ): void;

    battleMechSaves: IBattleMechExport[];
    saveBattleMechSaves( newValue: IBattleMechExport[]): void;

    saveCurrentCBTForce( bmForce: BattleMechForce ): void;

    saveCBTGroupFavorite( bmGroup: BattleMechGroup ): void;

    removeCBTGroupFavorite( asGroupIndex: number ): void;

    saveFavoriteCBTGroups( asGroups: BattleMechGroup[] ): void;

    //Game Management
    currentDeployments: IAlphaStrikeMPDeployment[] | null;
    currentScenarios: IAlphaStrikeMPScenario[] | null;
    currentTerrains: IAlphaStrikeMPTerrain[] | null;


}