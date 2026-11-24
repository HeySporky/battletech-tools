import React, { type JSX } from 'react';
import { FaArrowCircleDown, FaArrowCircleLeft, FaArrowCircleRight, FaCheckSquare, FaDice, FaGift, FaQuestionCircle, FaShoePrints, FaSquare, FaTable } from "react-icons/fa";
import { FiRefreshCcw } from 'react-icons/fi';
import { GiBattleAxe, GiCrosshairArrow, GiHotSurface, GiMagnifyingGlass, GiMissileSwarm } from 'react-icons/gi';
import { Link } from 'react-router';
import { BattleMech, IGATOR, ITargetToHit } from "../../../../classes/battlemech";
import { BattleMechGroup } from '../../../../classes/battlemech-group';
import { CONST_BATTLETECH_URL, CONST_HIGHLIGHT_COLOR } from '../../../../configVars';
import { IEquipmentItem } from '../../../../data/data-interfaces';
import { getClusterHitsPerRoll, getLocationName, getTargetToHitFromWeapon } from '../../../../utils';
import { chunkRange } from '../../../../utils/chunkRange';
import { makeRange } from '../../../../utils/makeRange';
import { weaponNeedsAmmo } from '../../../../utils/weaponNeedsAmmo';
import { getCompatibleAmmo } from '../../../../data/equipment-registry';
import { IAppGlobals } from '../../../app-router';
import BattleTechLogo from '../../../components/battletech-logo';
import InputCheckbox from '../../../components/form_elements/input_checkbox';
import InputField from '../../../components/form_elements/input_field';
import InputNumeric from '../../../components/form_elements/input_numeric';
import StandardModal from '../../../components/standard-modal';
import StatBar from "../../../components/stat-bar";
import BattleMechSVG from "../../../components/svg/battlemech-svg";
import DieSVG from "../../../components/svg/die-svg";
import TextSection from "../../../components/text-section";
import ToHitTable from '../../../components/to-hit-table';
import './play.scss';
import InPlayCriticalHitTable, { getPlayCritSlotCount } from './_criticalHitTable';
import InPlayIndustrialDamageCheck from './_industrialDamageCheck';
import Vehicle from '../../../../classes/vehicle';
import { vehicleName } from './_vehicleGroupTable';
import VehiclePlayPanel from './_vehiclePlay';
import AerospaceFighter from '../../../../classes/aerospace-fighter';
import { fighterName } from './_fighterGroupTable';
import FighterPlayPanel from './_fighterPlay';
import SmallCraft from '../../../../classes/small-craft';
import { smallCraftName } from './_smallCraftGroupTable';
import SmallCraftPlayPanel from './_smallCraftPlay';
import CapitalShip from '../../../../classes/capital-ship';
import { capitalShipName } from './_capitalShipGroupTable';
import CapitalShipPlayPanel from './_capitalShipPlay';
import InfantryPlatoon from '../../../../classes/infantry-platoon';
import InfantryPlayPanel from './_infantryPlay';
import BattleArmor from '../../../../classes/battle-armor';
import BattleArmorPlayPanel from './_battleArmorPlay';
import ProtoMech from '../../../../classes/protomech';
import ProtoMechPlayPanel from './_protoMechPlay';
import MicroMech from '../../../../classes/micro-mech';
import MicroMechPlayPanel from './_microMechPlay';
import Walker from '../../../../classes/walker';
import WalkerPlayPanel from './_walkerPlay';
import { WALKER_LOCATIONS } from '../../../../data/walker-construction';
import { IBattleArmorCarrierLoad, getBattleArmorCarrierLoad, isCarrierWeaponBlocked } from '../../../../classes/battle-armor-transport';
import BattledroidsUnit from '../../../../classes/battledroids-unit';
import BattledroidsPlayPanel from './_battledroidsPlay';
import BattledroidsRulesReference from '../../../components/battledroids-rules-reference';
import BattledroidsDroidHelper from '../../../components/battledroids-droid-helper';
import Building from '../../../../classes/building';
import BuildingPlayPanel from './_buildingPlay';
import QuirksInPlay from '../../../components/quirks-in-play';
import FutureWarsPlayPanel, { AutocannonPlayPanel, getBoostedMoveNote, showFutureWarsPlay } from './_futureWarsPlay';
import { getBlueSaviourDamageText, isEnergyWeapon } from '../../../../utils/future-wars-play';
import FutureWarsRulesetTools, { showFutureWarsRulesetTools, showPowerArmorTargetFlag } from './_futureWarsRulesetTools';
import { getCarrierQuirkEffects, IQuirkCarrier } from '../../../../utils/quirk-effects';
import EWarNotes from '../../../components/ewar-notes';
import { classicForceUsesSonic } from '../../../../utils/dial-weapons';
import { EWarKind, IEWarCarrier, IEWarModifier, getForceEccmTick, getEWarEcmEffective, applyEWarClusterShift, getEWarDefense, getEWarMissileHits, getEWarWeaponClusterShifts, getMissileDamageGroups } from '../../../../utils/ewar-play';
import { getEWarPlayRules } from '../../../../data/rules-editions';
const ArrowCircleDown = FaArrowCircleDown as any;
const ArrowCircleLeft = FaArrowCircleLeft as any;
const ArrowCircleRight = FaArrowCircleRight as any;
const CheckSquare = FaCheckSquare as any;
const Dice = FaDice as any;
const Gift = FaGift as any;
const QuestionCircle = FaQuestionCircle as any;
const ShoePrints = FaShoePrints as any;
const Square = FaSquare as any;
const Table = FaTable as any;
const BattleAxeIcon = GiBattleAxe as any;
const MissileSwarmIcon = GiMissileSwarm as any;
const RefreshCcw = FiRefreshCcw as any;

export default class ClassicBattleTechRosterPlay extends React.Component<IPlayProps, IPlayState> {
    constructor(props: IPlayProps) {
        super(props);

        this.state = {
            updated: false,
            mechSelectorExpanded: false,

            setMovementDialog: null,
            setMovementMode: "",
            setMovementNumber: 0,
            setMovementCanJump: false,
            setMovementJumpingMP: 0,
            setMovementElevation: 0,
            bombMessage: "",

            resolveFireDialog: false,


            criticalHitDialog: null,

            damageClusters: -1,
            damagePerCluster: -1,
            damagePerClusterGATOR: null,
            damageRolledClusters: -1,
            damagePerClusterUnit: null,
            damagePerClusterEQIndex: -1,
            targetWeaponSelection: [],

            hitLocationChartDialog: false,

            setTargetDialog: null,
            targetData: null,
            targetingRangeSetting: "normal",
            enhancedImagingOff: false,
            satelliteUplinkOff: false,
            combatDropLog: [],
            viewGATOR: null,

            takeDamageDialog: null,
            takeDamageMissileSize: 0,
            takeDamageMissilePer: 1,
            takeDamageMissileRoll: 7,
            takeDamageMissileDestroyed: 0,
            takeDamageMissileShift: 0,
            takeDamageMissileStreak: false,
            takeDamageMissileAmmoRoll: 0,
            takeDamageMissileMunition: "",
            takeDamageMissileGroup: 5,
            takeDamageMissileQueue: [],
            takeDamageAmount: -1,
            takeDamageLocationRoll: -1,
            takeDamageLocationSide: "",
            takeDamageLocationRear: false,
            takeDamageLocation: "",
            takeDamageCritical: false,
            takeDamageEnergy: false,
            takeDamageHandheldRoll: 0,

            zoomSheet: false,
            selectedVehicleUUID: "",
        };

        this.props.appGlobals.makeDocumentTitle("Playing CBT Force");
    }

    takeDamageAmount =(
      e: React.FormEvent<HTMLButtonElement>,
      amount: number,
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      this._takeDamageIfBothFieldsAre(
        amount,
        null,
        null,
        null,
        null,
        null,
      );
    }

    takeDamageLocationClick = (
      location: string,
      critical: boolean,
      rear: boolean,
      currentSide: string,
      currentRoll: number,
    ): void => {

      this._takeDamageIfBothFieldsAre(
        null,
        location,
        critical,
        rear,
        currentSide,
        currentRoll,
      )

    }

    selectAmmoBin = (
      e: React.FormEvent<HTMLSelectElement>,
      unit: BattleMech,
      attackUUID: string,
    ) => {

      if( e && e.preventDefault ) e.preventDefault();

      if(this.props.appGlobals.currentCBTForce) {
        const currentCBTForce = this.props.appGlobals.currentCBTForce;

        unit.selectAmmoBin( attackUUID, e.currentTarget.value  );
        this.props.appGlobals.saveCurrentCBTForce( currentCBTForce );

      }

      this.setState({
        updated: true,
      })
    }

    _takeDamageIfBothFieldsAre = (
      damage: number | null = null,
      location: string | null = null,
      critical: boolean | null = null,
      rear: boolean | null = null,
      currentSide: string | null = null,
      currentRoll: number | null = null,
    ) => {

      if( damage === null )
        damage = this.state.takeDamageAmount;

      if( location === null )
      location = this.state.takeDamageLocation;

      if( critical === null )
        critical = this.state.takeDamageCritical;

      if( rear === null )
        rear = this.state.takeDamageLocationRear;

      if( currentSide === null )
        currentSide = this.state.takeDamageLocationSide;

      if( currentRoll === null )
        currentRoll = this.state.takeDamageLocationRoll;

      this.setState({
        takeDamageAmount: damage,
        takeDamageLocation: location,
        takeDamageCritical: critical,
        takeDamageLocationRoll: currentRoll,
        takeDamageLocationSide: currentSide,
        takeDamageLocationRear: rear,
      })
    }

    addDamageCluster = (
      loc: string,
      critical: boolean,
      unit: BattleMech | null,
      eq_index: number,

    ) => {
      if( unit ) {
        let damageClusterHits = unit.equipmentList[eq_index].damageClusterHits;

        if(!damageClusterHits) {
          damageClusterHits = [];
        }
        damageClusterHits.push( {
          location: loc,
          damage: this.state.damagePerCluster,
          critical: critical,
        })

        if(this.props.appGlobals.currentCBTForce) {
          const currentCBTForce = this.props.appGlobals.currentCBTForce;

          unit.setDamageClusterHits( eq_index, damageClusterHits );
          this.props.appGlobals.saveCurrentCBTForce( currentCBTForce );
        }

        this.setState({
          updated: true,
        })
      }
    }

    /** The E-War Cluster Hits shifts for the weapon whose cluster chart is open (#642). */
    getClusterEWarShifts = (): IEWarModifier[] => {
      const unit = this.state.damagePerClusterUnit;
      const target = this.state.damagePerClusterGATOR?.targetObj;
      if( !unit || !target ) {
        return [];
      }
      return getEWarWeaponClusterShifts( unit, this.state.damagePerClusterEQIndex, target );
    }

    /** Missiles or hits for a 2D6 roll, with the E-War shifts added to the roll first. */
    clusterHits = ( roll: number ): number => {
      return getClusterHitsPerRoll( applyEWarClusterShift( roll, this.getClusterEWarShifts() ), this.state.damageClusters );
    }

    setNumberRolledClusters = (
      e: React.FormEvent<HTMLTableCellElement | HTMLButtonElement>,
      nv: number,
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      this.setState({
        damageRolledClusters: nv
      })
    }

    /** The ammunition bins of one anti-missile item: an Inner Sphere or Clan AMS its own tech base AMS ammunition, an APDS its own. */
    getAntiMissileBins = ( unit: BattleMech, gear: { kind: string; tag: string } ) => {
      const pattern = gear.kind === "apds" ? /^ammo-is-risc-apds/ : gear.kind === "ams" ? (gear.tag.startsWith("clan-") ? /^ammo-clan-ams/ : /^ammo-is-ams/) : null;
      return pattern ? unit.equipmentList.filter(item => pattern.test(item.tag)) : [];
    }

    getMissileDefense = ( unit: BattleMech ) => {
      const ammoShots: Record<string, number> = {};
      for( const gear of unit.getEWarGear() ) {
        if( gear.uuid ) {
          ammoShots[gear.uuid] = this.getAntiMissileBins( unit, gear ).reduce((sum, bin) => sum + unit.getAmmoBinRemaining( bin ), 0);
        }
      }
      return getEWarDefense( unit, { missileAttack: true, launcherSize: Math.max(1, this.state.takeDamageMissileSize), streak: this.state.takeDamageMissileStreak, munition: this.state.takeDamageMissileMunition || undefined, ammoShots } );
    }

    /** Spend the defense: heat, ammunition and the engagement for this turn, and put the resulting damage in the dialog. */
    applyMissileDefense = ( unit: BattleMech ) => {
      const defense = this.getMissileDefense( unit );
      const size = this.state.takeDamageMissileSize;
      const hits = getEWarMissileHits( defense, size, this.state.takeDamageMissileRoll, this.state.takeDamageMissileDestroyed, getClusterHitsPerRoll, this.state.takeDamageMissileShift );
      const groups = getMissileDamageGroups( Math.max( 0, hits ), this.state.takeDamageMissilePer, this.state.takeDamageMissileGroup );
      const spentGear = unit.getEWarGear().find(gear => gear.uuid === defense.spentGearUuid);
      if( defense.applies && defense.spentGearUuid && (spentGear || defense.fromField) ) {
        const heat = defense.heatFromRoll ? this.state.takeDamageMissileDestroyed : defense.heat;
        // The heat joins the turn's heat (the Heat Phase applies it), not the heat scale straight away.
        unit.ewarPlay = { ...unit.ewarPlay, heat: (unit.ewarPlay.heat ?? 0) + heat };
        let ammoToSpend = defense.ammoRoll
          ? this.state.takeDamageMissileAmmoRoll * defense.ammoRoll.multiplier
          : defense.ammoShots + (defense.ammoPerMissile ?? 0) * this.state.takeDamageMissileDestroyed;
        for( const bin of spentGear ? this.getAntiMissileBins( unit, spentGear ) : [] ) {
          const spend = Math.min( ammoToSpend, unit.getAmmoBinRemaining( bin ) );
          if( spend > 0 && bin.uuid ) {
            unit.setAmmoBinShots( bin.uuid, unit.getAmmoBinRemaining( bin ) - spend );
            ammoToSpend -= spend;
          }
        }
        const uses = { ...(unit.ewarPlay.amsUses ?? {}) };
        uses[defense.spentGearUuid] = (uses[defense.spentGearUuid] ?? 0) + 1;
        unit.ewarPlay = { ...unit.ewarPlay, amsUses: uses };
      }
      if( this.props.appGlobals.currentCBTForce ) {
        this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
      }
      this.setState({
        takeDamageAmount: groups[0] ?? 0,
        takeDamageMissileQueue: groups.slice(1),
        takeDamageMissileSize: 0,
        takeDamageMissileDestroyed: 0,
        takeDamageMissileShift: 0,
        takeDamageMissileStreak: false,
        takeDamageMissileAmmoRoll: 0,
        takeDamageMissileMunition: "",
      });
    }

    renderMissileDefense = () => {
      const unit = this.state.takeDamageDialog;
      if( !unit || !getEWarPlayRules( unit.getRulesEdition() ) || (!unit.isBlueSaviourOn() && !unit.getEWarGear().some(gear => gear.kind === "ams" || gear.kind === "laser-ams" || gear.kind === "apds")) ) {
        return null;
      }
      const size = this.state.takeDamageMissileSize;
      const defense = this.getMissileDefense( unit );
      return (
        <div className="alert alert-sm alert-info" data-testid="missile-defense">
          <label>
            <input
              type="checkbox"
              checked={size > 0}
              onChange={(e) => this.setState({ takeDamageMissileSize: e.currentTarget.checked ? 10 : 0 })}
            />{" "}
            Missile attack (anti-missile defense)
          </label>
          {this.state.takeDamageMissileQueue.length > 0 ? (
            <div data-testid="missile-queue">
              {this.state.takeDamageMissileQueue.length} more damage grouping{this.state.takeDamageMissileQueue.length === 1 ? "" : "s"} of this missile hit follow
              ({this.state.takeDamageMissileQueue.join(", ")}): each loads after you apply the one above, with its own hit location roll.
            </div>
          ) : null}
          {size > 0 ? (
            <>
              <div>
                Launcher size{" "}
                <input type="number" min={1} max={40} value={size} onChange={(e) => this.setState({ takeDamageMissileSize: Math.max(1, Number(e.currentTarget.value)) })} />
                {" "}damage per group (5 LRM, 2 SRM){" "}
                <input type="number" min={1} max={20} data-testid="missile-group" value={this.state.takeDamageMissileGroup} onChange={(e) => this.setState({ takeDamageMissileGroup: Math.max(1, Number(e.currentTarget.value)) })} />
                {" "}damage per missile{" "}
                <input type="number" min={1} max={5} value={this.state.takeDamageMissilePer} onChange={(e) => this.setState({ takeDamageMissilePer: Math.max(1, Number(e.currentTarget.value)) })} />
                {" "}2D6 roll{" "}
                <input type="number" min={2} max={12} value={this.state.takeDamageMissileRoll} onChange={(e) => this.setState({ takeDamageMissileRoll: Math.min(12, Math.max(2, Number(e.currentTarget.value))) })} />
              </div>
              <div>
                Munition{" "}
                <select data-testid="missile-munition" value={this.state.takeDamageMissileMunition} onChange={(e) => this.setState({ takeDamageMissileMunition: e.currentTarget.value })}>
                  <option value="">Standard missiles</option>
                  <option value="thunder">Thunder</option>
                  <option value="swarm">Swarm</option>
                  <option value="flare">Flare</option>
                  <option value="arrow-iv">Arrow IV</option>
                </select>
              </div>
              <div>
                Attacker Cluster Hits shift (Artemis, Narc){" "}
                <input type="number" min={-4} max={4} value={this.state.takeDamageMissileShift} onChange={(e) => this.setState({ takeDamageMissileShift: Number(e.currentTarget.value) })} />
                {" "}
                <label>
                  <input type="checkbox" checked={this.state.takeDamageMissileStreak} onChange={(e) => this.setState({ takeDamageMissileStreak: e.currentTarget.checked })} />{" "}
                  Streak launcher (the roll counts as an 11 before the shift)
                </label>
                {size === 1 ? <div>A single missile: roll 1D6, a 1-3 destroys it, a 4-6 hits (enter 1 destroyed for a 1-3).</div> : null}
              </div>
              {defense.applies ? (
                <div>
                  {defense.labels.join(", ")}.
                  {defense.mode === "missiles-destroyed" || defense.singleMissile ? (
                    <>
                      {" "}{defense.singleMissile ? "Destroyed on the 1D6 (1 for yes)" : "Missiles destroyed"}{" "}
                      <input type="number" min={0} max={40} value={this.state.takeDamageMissileDestroyed} onChange={(e) => this.setState({ takeDamageMissileDestroyed: Math.max(0, Number(e.currentTarget.value)) })} />
                    </>
                  ) : null}
                  {defense.ammoRoll ? (
                    <>
                      {" "}Ammunition roll ({defense.ammoRoll.dice}D6, x{defense.ammoRoll.multiplier}){" "}
                      <input type="number" min={0} max={12} value={this.state.takeDamageMissileAmmoRoll} onChange={(e) => this.setState({ takeDamageMissileAmmoRoll: Math.max(0, Number(e.currentTarget.value)) })} />
                    </>
                  ) : null}
                  {" "}Costs {defense.heatFromRoll ? "heat equal to the missiles destroyed" : `${defense.heat} heat`}
                  {defense.ammoShots > 0 || defense.ammoPerMissile ? ", ammunition" : ""}.
                </div>
              ) : (
                <div data-testid="missile-no-defense">{defense.labels[0] ?? "No anti-missile item can engage this attack (none working, none left to engage this turn, or no ammunition)."}</div>
              )}
              <div>
                Hits: {Math.max(0, getEWarMissileHits( defense, size, this.state.takeDamageMissileRoll, this.state.takeDamageMissileDestroyed, getClusterHitsPerRoll, this.state.takeDamageMissileShift ))}
                {" "}= {Math.max(0, getEWarMissileHits( defense, size, this.state.takeDamageMissileRoll, this.state.takeDamageMissileDestroyed, getClusterHitsPerRoll, this.state.takeDamageMissileShift )) * this.state.takeDamageMissilePer} damage
                {" "}in {getMissileDamageGroups( Math.max(0, getEWarMissileHits( defense, size, this.state.takeDamageMissileRoll, this.state.takeDamageMissileDestroyed, getClusterHitsPerRoll, this.state.takeDamageMissileShift )), this.state.takeDamageMissilePer, this.state.takeDamageMissileGroup ).join(", ") || "0"} groupings, each with its own hit location roll
              </div>
              <button className="btn btn-sm btn-warning" onClick={() => this.applyMissileDefense( unit )}>Apply and use this damage</button>
            </>
          ) : null}
        </div>
      );
    }

    openClusterDamageChart = (
      e: React.FormEvent<HTMLButtonElement>,
      damagePerClusterGATOR: IGATOR,
      damageClusters: number | undefined,
      damagePerCluster: number | undefined,
      damagePerClusterUnit: BattleMech,
      damagePerClusterEQIndex: number,
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      this.setState({
        damagePerClusterGATOR: damagePerClusterGATOR,
        damagePerCluster: damagePerCluster ? damagePerCluster : 0,
        damageClusters: damageClusters ? damageClusters : 0,
        damagePerClusterUnit: damagePerClusterUnit,
        damagePerClusterEQIndex: damagePerClusterEQIndex,
      })
    }

    closeHitLocationChartDialog = (
      e: React.FormEvent<HTMLButtonElement>,
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      this.setState({
        hitLocationChartDialog: false,

      })
    }

    openHitLocationChartDialog = (
      e: React.FormEvent<HTMLButtonElement>,
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      this.setState({
        hitLocationChartDialog: true
      })
    }

    closeClusterDamageChart = (
      e: React.FormEvent<HTMLButtonElement>,
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      this.setState({
        damagePerClusterGATOR: null,
        damagePerCluster: -1,
        damageRolledClusters: -1,
        damageClusters: -1,
        damagePerClusterUnit: null,
        damagePerClusterEQIndex: -1,
      })
    }

    toggleResolved = (
      e: React.FormEvent<HTMLButtonElement>,
      bm: BattleMech,
      eq_index: number
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      if(this.props.appGlobals.currentCBTForce) {
        const currentCBTForce = this.props.appGlobals.currentCBTForce;

        bm.toggleResolved( eq_index );
        this.props.appGlobals.saveCurrentCBTForce( currentCBTForce );
      }
    }

    setTurn = (
      e: React.FormEvent<HTMLInputElement>,
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      if(this.props.appGlobals.currentCBTForce) {
        const currentCBTForce = this.props.appGlobals.currentCBTForce;
        currentCBTForce.turn = +e.currentTarget.value;

        this.props.appGlobals.saveCurrentCBTForce( currentCBTForce );
      }
      this.setState({
        updated: true,
      })
    }

    setPhase = (
      e: React.FormEvent<HTMLButtonElement>,
      nv: number
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      if(this.props.appGlobals.currentCBTForce) {
        const currentCBTForce = this.props.appGlobals.currentCBTForce;
        currentCBTForce.phase = nv;

        this.props.appGlobals.saveCurrentCBTForce( currentCBTForce );
      }

      this.setState({
        updated: true,
      })

    }

    toggleHelp = (
      e: React.FormEvent<HTMLButtonElement>,
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      if(this.props.appGlobals.currentCBTForce) {
        const currentCBTForce = this.props.appGlobals.currentCBTForce;
        currentCBTForce.hideHelp = !currentCBTForce.hideHelp;

        this.props.appGlobals.saveCurrentCBTForce( currentCBTForce );
      }

    }

    openResolveFireDialog = (
      e: React.FormEvent<HTMLButtonElement>,
      ) => {
        if( e && e.preventDefault ) {
          e.preventDefault();
        }

      this.setState({
        resolveFireDialog: true,
      })
    }

    closeResolveFireDialog = (
      e: React.FormEvent<HTMLButtonElement>,
      ) => {
        if( e && e.preventDefault ) {
          e.preventDefault();
        }

      this.setState({
        resolveFireDialog: false,
      })
    }

    applyHeat = (
      e: React.FormEvent<HTMLButtonElement>,
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      if(this.props.appGlobals.currentCBTForce) {
        const currentCBTForce = this.props.appGlobals.currentCBTForce;
        currentCBTForce.applyHeat();

        this.props.appGlobals.saveCurrentCBTForce( currentCBTForce );
      }

      this.setState({
        updated: true,
      })
    }

    nextTurn = (
      e: React.FormEvent<HTMLButtonElement>,
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      if(this.props.appGlobals.currentCBTForce) {
        const currentCBTForce = this.props.appGlobals.currentCBTForce;
        currentCBTForce.phase = 0;
        currentCBTForce.turn++;
        currentCBTForce.heatApplied = false;

        for( const group of currentCBTForce.groups ) {
          for( const unit of group.members ) {
            unit.turnReset();
          }
          for( const vehicle of group.vehicles ) {
            vehicle.turnReset();
          }
          for( const fighter of group.fighters ) {
            fighter.turnReset();
          }
          for( const craft of group.smallCraft ) {
            craft.turnReset();
          }
          for( const ship of group.capitalShips ) {
            ship.turnReset();
          }
          for( const building of group.buildings ) {
            building.startTurn();
          }
        }

        currentCBTForce.endEWarTurn();
        const turnTargets = this.state.targetData;
        if( turnTargets ) {
          for( const letter of ["a", "b", "c"] as const ) {
            if( turnTargets[letter] ) {
              turnTargets[letter].tagged = false;
            }
          }
        }
        this.props.appGlobals.saveCurrentCBTForce( currentCBTForce );

        this.setState({
          updated: true,
        })
      }

    }

    updateSetEquipmentTarget = (
      e: React.FormEvent<HTMLSelectElement>,
      eq_index: number,
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }
      const targetWeaponSelection = this.state.targetWeaponSelection;

      if( targetWeaponSelection.length > eq_index && targetWeaponSelection[eq_index]) {
        targetWeaponSelection[eq_index].target = e.currentTarget.value;
      }

      this.setState({
        targetWeaponSelection: targetWeaponSelection,
        updated: true,
      })
    }

    updatePrimary = (
      e: React.FormEvent<HTMLInputElement>,
      target: string
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }
      const targetData = this.state.targetData;
      const targetWeaponSelection = this.state.targetWeaponSelection;
      if( targetData ) {
        if( target === "a" ) {
          targetData.a.primary = true;
          targetData.b.primary = false;
          targetData.c.primary = false;
        } else if( target === "b" ) {
          targetData.a.primary = false;
          targetData.b.primary = true;
          targetData.c.primary = false;
        } else if( target === "c" ) {
          targetData.a.primary = false;
          targetData.b.primary = false;
          targetData.c.primary = true;
        }
      }


      this.setState({
        targetData: targetData,
        targetWeaponSelection: targetWeaponSelection,
      })
    }

    updateTargetActive = (
      e: React.FormEvent<HTMLInputElement>,
      target: string
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }
      const targetData = this.state.targetData;
      const targetWeaponSelection = this.state.targetWeaponSelection;
      let removeTarget = "";
      if( targetData ) {
        if( target === "a" ) {
          targetData.a.active = e.currentTarget.checked;
          if( e.currentTarget.checked === false ) {
            removeTarget = "a";
          }
        } else if( target === "b" ) {
          targetData.b.active = e.currentTarget.checked;
          if( e.currentTarget.checked === false ) {
            removeTarget = "b";
          }
        } else if( target === "c" ) {
          targetData.c.active = e.currentTarget.checked;
          if( e.currentTarget.checked === false ) {
            removeTarget = "c";
          }
        }
      }

      if( removeTarget !== "") {
        for( const item of targetWeaponSelection ) {
          if( item.target === removeTarget ) {
            item.target = "";
          }
        }
      }

      this.setState({
        targetData: targetData,
        targetWeaponSelection: targetWeaponSelection,
      })
    }

    updateRearArc = (
      e: React.FormEvent<HTMLInputElement>,
      target: string
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }
      const targetData = this.state.targetData;
      const targetWeaponSelection = this.state.targetWeaponSelection;
      if( targetData ) {
        if( target === "a" ) {
          targetData.a.inRearArc = e.currentTarget.checked;

        } else if( target === "b" ) {
          targetData.b.inRearArc = e.currentTarget.checked;

        } else if( target === "c" ) {
          targetData.c.inRearArc = e.currentTarget.checked;

        }
      }


      this.setState({
        targetData: targetData,
        targetWeaponSelection: targetWeaponSelection,
      })
    }

    updateTargetName = (
      e: React.FormEvent<HTMLInputElement>,
      target: string
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }
      const targetData = this.state.targetData;
      if( targetData ) {
        if( target === "a" ) {
          targetData.a.name = e.currentTarget.value;
        } else if( target === "b" ) {
          targetData.b.name = e.currentTarget.value;
        } else if( target === "c" ) {
          targetData.c.name = e.currentTarget.value;
        }
      }

      this.setState({
        targetData: targetData,
      })
    }

    viewGATOR = (
      gator: IGATOR,
    ) => {
      this.setState({
        viewGATOR: gator,
      })
    }

    closeGATOR = (
      e: React.FormEvent<HTMLButtonElement>
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }
      this.setState({
        viewGATOR: null,
      })
    }

    updateTargetFlag = (
      e: React.FormEvent<HTMLInputElement>,
      target: "a" | "b" | "c",
      field: "airborne" | "immobile" | "powerArmor" | "hostileEcm" | "friendlyEccm" | "tagged" | "indirectFire" | "targetHostileEcm" | "hostileAngelEcm" | "friendlyAngelEccm" | "c3NearestInEcm",
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }
      const targetData = this.state.targetData;
      if( targetData ) {
        targetData[target][field] = e.currentTarget.checked;
      }
      this.setState({
        targetData: targetData,
      })
    }

    updateTargetStealth = (
      e: React.FormEvent<HTMLInputElement>,
      target: "a" | "b" | "c",
      kind: EWarKind,
    ) => {
      const targetData = this.state.targetData;
      if( targetData ) {
        const systems = (targetData[target].stealthSystems ?? []).filter(item => item !== kind);
        if( e.currentTarget.checked ) {
          systems.push( kind );
        }
        targetData[target].stealthSystems = systems.length > 0 ? systems : undefined;
      }
      this.setState({ targetData: targetData });
    }

    updateTargetEwarNumber = (
      e: React.FormEvent<HTMLInputElement>,
      target: "a" | "b" | "c",
      field: "hostileEcmCount" | "friendlyEccmCount" | "targetMoved",
    ) => {
      const targetData = this.state.targetData;
      if( targetData ) {
        const value = Math.max( 0, Math.floor( +e.currentTarget.value || 0 ) );
        targetData[target][field] = value > 0 ? value : undefined;
      }
      this.setState({ targetData: targetData });
    }

    /** Fills the friendly ECCM ticks from the units of the force that are set to ECCM mode (communications equipment counts as halves). */
    useForceEccm = ( target: "a" | "b" | "c" ) => {
      const force = this.props.appGlobals.currentCBTForce;
      const targetData = this.state.targetData;
      if( force && targetData ) {
        const tick = getForceEccmTick( force.getEWarUnits() );
        targetData[target].friendlyEccmCount = tick.friendlyEccmCount > 0 ? tick.friendlyEccmCount : undefined;
        targetData[target].friendlyAngelEccm = tick.friendlyAngelEccm || undefined;
      }
      this.setState({ targetData: targetData });
    }

    updateTargetC3Range = (
      e: React.ChangeEvent<HTMLInputElement>,
      target: "a" | "b" | "c",
    ) => {
      const targetData = this.state.targetData;
      if( targetData ) {
        const raw = e.currentTarget.value;
        targetData[target].c3NearestHexes = raw === "" ? undefined : Math.max( 0, Math.floor( +raw || 0 ) );
      }
      this.setState({ targetData: targetData });
    }

    updateTargetNarcPod = (
      e: React.FormEvent<HTMLInputElement>,
      target: "a" | "b" | "c",
      pod: string,
    ) => {
      const targetData = this.state.targetData;
      if( targetData ) {
        const pods = (targetData[target].narcPods ?? []).filter(item => item !== pod);
        if( e.currentTarget.checked ) {
          pods.push( pod );
        }
        targetData[target].narcPods = pods.length > 0 ? pods : undefined;
      }
      this.setState({ targetData: targetData });
    }

    updateTargetJumped = (
      e: React.FormEvent<HTMLInputElement>,
      target: string
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }
      const targetData = this.state.targetData;
      if( targetData ) {
        if( target === "a" ) {
          targetData.a.jumped = e.currentTarget.checked;
        } else if( target === "b" ) {
          targetData.b.jumped = e.currentTarget.checked;
        } else if( target === "c" ) {
          targetData.c.jumped = e.currentTarget.checked;
        }
      }

      this.setState({
        targetData: targetData,
      })
    }

    updateTargetRange = (
      e: React.FormEvent<HTMLInputElement>,
      target: string
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }
      const targetData = this.state.targetData;
      if( targetData ) {
        if( target === "a" ) {
          targetData.a.range = +e.currentTarget.value;
        } else if( target === "b" ) {
          targetData.b.range = +e.currentTarget.value;
        } else if( target === "c" ) {
          targetData.c.range = +e.currentTarget.value;
        }
      }

      this.setState({
        targetData: targetData,
      })
    }

    updateTargetNumber = (
      e: React.FormEvent<HTMLInputElement>,
      target: "a" | "b" | "c",
      field: "otherMods" | "lightWoodsHexes" | "heavyWoodsHexes" | "darkness",
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }
      const targetData = this.state.targetData;
      if( targetData ) {
        targetData[target][field] = +e.currentTarget.value;
      }

      this.setState({
        targetData: targetData,
      })
    }

    // The Target dialog's Power Armor flag (#172): see showPowerArmorTargetFlag.
    _showPowerArmorTargetFlag = ( ticked: boolean ): boolean => {
      return showPowerArmorTargetFlag( this.props.appGlobals.currentCBTForce?.groups.flatMap( (group) => group.members ) ?? [], ticked );
    }

    // Woods, jungle or smoke hexes and darkness, which Enhanced Imaging reduces, and aimed shots, which it allows (IO:AE
    // p.69; Maximum Tech p.61).
    renderTargetConditions = ( mech: BattleMech, target: "a" | "b" | "c" ) => {
      if( !this.state.targetData ) return null;
      const data = this.state.targetData[target];
      return (
        <>
          <InputNumeric
            label="Light Woods / Smoke Hexes"
            description="Light woods, jungle or smoke hexes between you and the target, its own hex included: +1 each"
            value={data.lightWoodsHexes ?? 0}
            onChange={(e) => this.updateTargetNumber(e, target, "lightWoodsHexes")}
            step={1}
            inline={true}
            min={0}
            max={50}
          />
          <InputNumeric
            label="Heavy Woods / Smoke Hexes"
            description="Heavy woods, jungle or smoke hexes between you and the target, its own hex included: +2 each"
            value={data.heavyWoodsHexes ?? 0}
            onChange={(e) => this.updateTargetNumber(e, target, "heavyWoodsHexes")}
            step={1}
            inline={true}
            min={0}
            max={50}
          />
          <InputNumeric
            label="Darkness Mod"
            description="The scenario's darkness or night modifier"
            value={data.darkness ?? 0}
            onChange={(e) => this.updateTargetNumber(e, target, "darkness")}
            step={1}
            inline={true}
            min={0}
            max={10}
          />
          {this._showPowerArmorTargetFlag( !!data.powerArmor ) ? (
            <InputCheckbox
              label="Power Armor"
              checked={!!data.powerArmor}
              description="The target is a Power Armor suit: +1 to hit (Custom Homebrew, The Best of Future Wars p.14)"
              onChange={(e) => this.updateTargetFlag(e, target, "powerArmor")}
            />
          ) : null}
          {mech.getEditionPlayRules()?.immobileTargetModifier !== 0 ? (
            <>
              <InputCheckbox
                label="Immobile"
                checked={!!data.immobile}
                description="Shut down, or its warrior unconscious: -4 to hit, and any weapon but a missile launcher, LB-X cluster or Hyper-Assault Gauss may aim (TW p.110)"
                onChange={(e) => this.updateTargetFlag(e, target, "immobile")}
              />
              <label>
                Aimed Shot:{" "}
                <select
                  value={data.aimedLocation ?? ""}
                  title={"A 'Mech target's location. An active target takes aims only with a targeting computer or Enhanced Imaging, never at the head. On a hit roll 2D6: 6-8 hits the location, else "
                    + (mech.usesEarlierRulesEdition() ? "a computer-aimed shot misses (BMR(R) p.148) and others roll for location (BMR(R) p.26)" : "roll for location (TW p.110)")}
                  onChange={(e) => {
                    this.state.targetData![target].aimedLocation = e.currentTarget.value || undefined;
                    this.setState({ targetData: this.state.targetData });
                  }}
                >
                  <option value="">-none-</option>
                  {["hd", "ct", "lt", "rt", "la", "ra", "ll", "rl"].map(location => (
                    <option key={location} value={location}>{getLocationName(location, false)}</option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
          {getEWarPlayRules( mech.getRulesEdition() ) ? (
            <fieldset className="fieldset">
              <legend>E-War</legend>
              <InputCheckbox
                label="Hostile ECM"
                checked={!!data.hostileEcm}
                description="Hostile ECM covers the attacker or this target: it cancels Artemis, Narc pods and Artemis V on this attack where the edition says so"
                onChange={(e) => this.updateTargetFlag(e, target, "hostileEcm")}
              />
              <InputCheckbox
                label="Target inside hostile ECM"
                checked={!!data.targetHostileEcm}
                description="The target (a Narc pod on it) sits inside a hostile ECM bubble: the pod loses its bonus (Total Warfare, Core Rulebook)"
                onChange={(e) => this.updateTargetFlag(e, target, "targetHostileEcm")}
              />
              <InputCheckbox
                label="Friendly ECCM"
                checked={!!data.friendlyEccm}
                description="Friendly ECCM covers the line and counters the hostile ECM"
                onChange={(e) => this.updateTargetFlag(e, target, "friendlyEccm")}
              />
              <label className="d-block">
                Hostile ECM suites on the line{" "}
                <input type="number" min={0} className="form-control form-control-sm d-inline-block w-auto" data-testid={"ewar-hostile-count-" + target}
                  value={data.hostileEcmCount ?? 0} onChange={(e) => this.updateTargetEwarNumber(e, target, "hostileEcmCount")} />
              </label>
              <label className="d-block">
                Friendly ECCM suites on the line{" "}
                <input type="number" min={0} className="form-control form-control-sm d-inline-block w-auto" data-testid={"ewar-friendly-count-" + target}
                  value={data.friendlyEccmCount ?? 0} onChange={(e) => this.updateTargetEwarNumber(e, target, "friendlyEccmCount")} />
              </label>
              <button type="button" className="btn btn-sm btn-secondary mb-2" data-testid={"ewar-force-eccm-" + target} onClick={() => this.useForceEccm(target)}>Use the force ECCM modes</button>
              <InputCheckbox
                label="Hostile Angel ECM"
                checked={!!data.hostileAngelEcm}
                description="An Angel ECM suite on the line counts as two, is countered only by Angel ECCM and spoils Streak locks"
                onChange={(e) => this.updateTargetFlag(e, target, "hostileAngelEcm")}
              />
              <InputCheckbox
                label="Friendly Angel ECCM"
                checked={!!data.friendlyAngelEccm}
                description="One Angel ECCM suite counters any amount of ordinary ECM and Angel ECM"
                onChange={(e) => this.updateTargetFlag(e, target, "friendlyAngelEccm")}
              />
              {data.hostileEcmCount || data.hostileAngelEcm || data.hostileEcm ? (
                <p className="small-text" data-testid={"ewar-ecm-result-" + target}>{getEWarEcmEffective( data, mech.getRulesEdition() ).label}</p>
              ) : null}
              {([ ["stealth-armor", "Stealth armor"], ["null-sig", "Null-Signature"], ["void-sig", "Void-Signature"], ["chameleon", "Chameleon LPS"], ["mimetic", "Mimetic armor"], ["stealth-ba", "BA stealth (basic or prototype)"], ["stealth-ba-standard", "BA stealth (standard)"], ["stealth-ba-improved", "BA stealth (improved)"], ["stealth-ba-achileus", "Achileus"], ["stealth-ba-infiltrator", "Infiltrator"], ["stealth-ba-infiltrator-mk2", "Infiltrator Mk. II"], ["sneak-camo", "Sneak suit (camo)"], ["sneak-ir", "Sneak suit (IR)"], ["dest-suit", "DEST infiltration suit"] ] as [EWarKind, string][]).map(([kind, name]) => (
                <InputCheckbox
                  key={kind}
                  label={"Target stealth: " + name}
                  checked={!!data.stealthSystems?.includes(kind)}
                  description="The target has this stealth system on: its to-hit modifier for the range, as the edition prints it"
                  onChange={(e) => this.updateTargetStealth(e, target, kind)}
                />
              ))}
              <label className="d-block">
                Target moved (hexes){" "}
                <input type="number" min={0} className="form-control form-control-sm d-inline-block w-auto" data-testid={"ewar-moved-" + target}
                  value={data.targetMoved ?? 0} onChange={(e) => this.updateTargetEwarNumber(e, target, "targetMoved")} />
              </label>
              <label className="d-block">
                Nearest networked unit is this many hexes from the target (blank: C3 not used){" "}
                <input type="number" min={0} className="form-control form-control-sm d-inline-block w-auto" data-testid={"ewar-c3-hexes-" + target}
                  value={data.c3NearestHexes ?? ""} onChange={(e) => this.updateTargetC3Range(e, target)} />
              </label>
              <InputCheckbox
                label="Nearest networked unit inside hostile ECM"
                checked={!!data.c3NearestInEcm}
                description="Core Rulebook p.199: ECM on the nearest networked unit adds a TN penalty for the range bracket C3 gained"
                onChange={(e) => this.updateTargetFlag(e, target, "c3NearestInEcm")}
              />
              <InputCheckbox
                label="TAG designated"
                checked={!!data.tagged}
                description="A friendly TAG designated the target this turn: semi-guided LRMs gain their bonus"
                onChange={(e) => this.updateTargetFlag(e, target, "tagged")}
              />
              <InputCheckbox
                label="Indirect fire"
                checked={!!data.indirectFire}
                description="The missile attack is indirect: no Artemis bonus"
                onChange={(e) => this.updateTargetFlag(e, target, "indirectFire")}
              />
              <InputCheckbox
                label="Narc pod"
                checked={!!data.narcPods?.includes("narc")}
                description="A Narc pod is attached to the target: +2 on the Cluster Hits roll of missiles homing on it"
                onChange={(e) => this.updateTargetNarcPod(e, target, "narc")}
              />
              <InputCheckbox
                label="iNarc homing pod"
                checked={!!data.narcPods?.includes("homing")}
                description="An iNarc homing pod is attached to the target: -1 to hit and +2 on the Cluster Hits roll"
                onChange={(e) => this.updateTargetNarcPod(e, target, "homing")}
              />
            </fieldset>
          ) : null}
        </>
      );
    }

    updateTargetMovement = (
      e: React.FormEvent<HTMLInputElement>,
      target: string
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }
      const targetData = this.state.targetData;
      if( targetData ) {
        if( target === "a" ) {
          targetData.a.movement = +e.currentTarget.value;
        } else if( target === "b" ) {
          targetData.b.movement = +e.currentTarget.value;
        } else if( target === "c" ) {
          targetData.c.movement = +e.currentTarget.value;
        }
      }

      this.setState({
        targetData: targetData,
      })
    }

    selectMech = (
      e: React.FormEvent<HTMLButtonElement>,
      uuid: string
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }
      if(this.props.appGlobals.currentCBTForce) {
        this.props.appGlobals.currentCBTForce.setSelectedMech( uuid );

        this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
      }
      this.setState({
        selectedVehicleUUID: "",
      });
    }

    // Selecting a vehicle clears the selected 'mech (no 'mech has the vehicle's UUID).
    selectVehicle = (
      e: React.FormEvent<HTMLButtonElement>,
      uuid: string
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }
      if(this.props.appGlobals.currentCBTForce) {
        this.props.appGlobals.currentCBTForce.setSelectedMech( uuid );
        this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
      }
      this.setState({
        selectedVehicleUUID: uuid,
      });
    }

    /** A Best of Future Wars counter or roll changed the selected 'Mech (#172): save the force. */
    onFutureWarsChange = (): void => {
      if(this.props.appGlobals.currentCBTForce) {
        this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
      }
      this.setState({
        updated: true,
      });
    }

    onEwarChange = (): void => {
      if(this.props.appGlobals.currentCBTForce) {
        this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
      }
      this.setState({ updated: true });
    }

    onVehicleChange = ( _vehicle: Vehicle | AerospaceFighter | SmallCraft | CapitalShip | InfantryPlatoon | BattleArmor | ProtoMech | MicroMech | Walker | Building | BattledroidsUnit ): void => {
      if(this.props.appGlobals.currentCBTForce) {
        this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
      }
      this.setState({
        updated: true,
      });
    }


    resetGroup = (
      e: React.FormEvent<HTMLButtonElement>,
      group: BattleMechGroup,
    ): void => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }


      this.props.appGlobals.openConfirmDialog(
        "Confirmation",
        "Are you sure you want to reset all the units to full status?",
        "Yes",
        "No, Thank you",
        () => {
          for( const unit of group.members ) {
            if( unit && unit.resetDamage ) {
              unit.resetDamage();
            }

          }
          for( const vehicle of group.vehicles ) {
            vehicle.resetInPlay();
          }
          for( const fighter of group.fighters ) {
            fighter.resetInPlay();
          }
          for( const craft of group.smallCraft ) {
            craft.resetInPlay();
          }
          for( const ship of group.capitalShips ) {
            ship.resetInPlay();
          }
          for( const platoon of group.infantry ) {
            platoon.resetInPlay();
          }
          for( const squad of group.battleArmor ) {
            squad.resetInPlay();
          }
          for( const point of group.protoMechs ) {
            point.resetInPlay();
          }
          for( const micro of group.microMechs ) {
            micro.resetInPlay();
          }
          for( const walker of group.walkers ) {
            walker.resetInPlay();
          }
          for( const building of group.buildings ) {
            building.resetInPlay();
          }
          for( const unit of group.battledroidsUnits ) {
            unit.resetInPlay();
          }
          if( this.props.appGlobals.currentCBTForce )
            this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
        }
      )

    }



    openSetCriticalDialog = (
      currentBM: BattleMech,
    ) => {

      if( this.props.appGlobals.currentCBTForce && currentBM ) {

        this.setState({
          criticalHitDialog: new BattleMech( currentBM.exportJSON() ),
        })
      }

    }


    closeSetCriticalDialog = (
      e: React.FormEvent<HTMLButtonElement>
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      if( this.props.appGlobals.currentCBTForce && this.state.criticalHitDialog ) {

        this.setState({
          criticalHitDialog: null,
        })
      }

    }

    saveSetCriticalDialog = (
      e: React.FormEvent<HTMLButtonElement>
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      if( this.props.appGlobals.currentCBTForce && this.state.criticalHitDialog ) {


        this.props.appGlobals.currentCBTForce.updateUnitViaUUID( this.state.criticalHitDialog )

        this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );

        this.setState({
          criticalHitDialog: null,
        })
      }

    }

    updateCriticalHitDialog = (
      nv: BattleMech
    ) => {
      if( this.props.appGlobals.currentCBTForce && this.state.criticalHitDialog ) {

        this.setState({
          criticalHitDialog: nv,
        })
      }
    }

    // What battle armor riding one of the force's units stops that unit doing (Total Warfare pp. 226-227).
    private _carrierLoad = (
      uuid: string,
      name: string,
      kind: "mech" | "vehicle",
      omni: boolean | null,
      frankenMech: boolean = false,
    ): IBattleArmorCarrierLoad => {
      const squads = this.props.appGlobals.currentCBTForce ? this.props.appGlobals.currentCBTForce.groups.flatMap( (group) => group.battleArmor ) : [];
      return getBattleArmorCarrierLoad( squads, { uuid: uuid, name: name, kind: kind, omni: omni, frankenMech: frankenMech } );
    }

    openSetTargetDialog = (
      currentBM: BattleMech,
    ) => {

      if( this.props.appGlobals.currentCBTForce && currentBM ) {
        const targetData = {
          a: JSON.parse(JSON.stringify(currentBM.getTarget("a"))),
          b: JSON.parse(JSON.stringify(currentBM.getTarget("b"))),
          c: JSON.parse(JSON.stringify(currentBM.getTarget("c"))),
        }

        // A weapon in a torso location a mechanized trooper occupies may not fire.
        const carrierLoad = this._carrierLoad( currentBM.uuid, currentBM.getName(), "mech", currentBM.isOmnimech, currentBM.isFrankenMech() );
        const targetWeaponSelection: IEquipmentItem[] = JSON.parse(JSON.stringify(currentBM.equipmentList));
        for( const item of targetWeaponSelection ) {
          if( isCarrierWeaponBlocked( carrierLoad, item ) ) {
            item.target = "";
          }
        }

        this.setState({
          setTargetDialog: currentBM,
          targetWeaponSelection: targetWeaponSelection,
          setMovementDialog: null,
          takeDamageDialog: null,
          targetData: targetData,
          targetingRangeSetting: currentBM.targetingRangeSetting,
          enhancedImagingOff: currentBM.enhancedImagingOff,
          satelliteUplinkOff: currentBM.satelliteUplinkOff,
        })
      }

    }

    closeSetTarget  = (
      e: React.FormEvent<HTMLButtonElement>
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      // Cancel puts back the End Phase settings the dialog opened with.
      if( this.state.setTargetDialog ) {
        this.state.setTargetDialog.targetingRangeSetting = this.state.targetingRangeSetting;
        this.state.setTargetDialog.enhancedImagingOff = this.state.enhancedImagingOff;
        this.state.setTargetDialog.satelliteUplinkOff = this.state.satelliteUplinkOff;
      }
      this.setState({
        setTargetDialog: null,
        targetData: null,
        targetWeaponSelection: [],
      })
    }

    setTarget = (
      e: React.FormEvent<HTMLButtonElement>
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      const currentBM: BattleMech | null = this.state.setTargetDialog;
      if( this.props.appGlobals.currentCBTForce && currentBM && this.state.targetData ) {
        currentBM.setTargets(
          this.state.targetData.a,
          this.state.targetData.b,
          this.state.targetData.c,
        );
        currentBM.equipmentList = this.state.targetWeaponSelection;

        this.props.appGlobals.currentCBTForce.updateUnitViaUUID( currentBM )

        this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
      }

      this.setState({
        setTargetDialog: null,
        targetData: null,
      })
    }

    openTakeDamageDialog = (
      currentBM: BattleMech | null
    ) => {

      if( currentBM ) {

        this.setState({
          takeDamageDialog: currentBM,
          setMovementDialog: null,
          setTargetDialog: null,
        })
      }
    }
    closeTakeDamage  = (
      e: React.FormEvent<HTMLButtonElement>
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      this.setState({
        takeDamageDialog: null,
        takeDamageAmount: 0,
        takeDamageLocation: "",
        takeDamageLocationRear: false,
        takeDamageCritical: false,
        takeDamageEnergy: false,
        takeDamageHandheldRoll: 0,
        takeDamageLocationRoll: 0,
        takeDamageLocationSide: "",
      })
    }

    saveDamage= (
      e: React.FormEvent<HTMLButtonElement>
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      if(  this.props.appGlobals.currentCBTForce && this.state.takeDamageDialog ) {

        this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );

        this.setState({
          takeDamageDialog: null,
          takeDamageAmount: 0,
          takeDamageLocation: "",
          takeDamageLocationRear: false,
          takeDamageCritical: false,
          takeDamageEnergy: false,
          takeDamageHandheldRoll: 0,
          takeDamageLocationRoll: 0,
          takeDamageLocationSide: "",
        })

      }
    }

    takeDamage = (
      e: React.FormEvent<HTMLButtonElement>
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      if(  this.state.takeDamageDialog && this.props.appGlobals.currentCBTForce  ) {
        const currentBM = this.state.takeDamageDialog;
        if( currentBM ) {
          const damageLog = currentBM.damageLog;

          // An energy hit is halved by an active Blue Saviour and by Laser Reflective armor (#641); the log keeps both amounts.
          const applied = currentBM.getIncomingDamageApplied(this.state.takeDamageAmount, this.state.takeDamageEnergy, this.state.takeDamageLocation);
          const takeDamageResult = currentBM.takeDamage(
            applied,
            this.state.takeDamageLocation,
            this.state.takeDamageLocationRear,
            // The 1D6 for a hit that may strike the handheld weapon (Maximum Tech p.79; TO:AUE p.128).
            this.state.takeDamageHandheldRoll > 0 ? { handheldRoll: this.state.takeDamageHandheldRoll } : undefined,
          );

          damageLog.push( {
            turn: this.props.appGlobals.currentCBTForce.turn,
            amount: applied,
            ...(applied !== this.state.takeDamageAmount ? { entered: this.state.takeDamageAmount } : {}),
            rear: this.state.takeDamageLocationRear,
            location: this.state.takeDamageLocation,
            damageResults: takeDamageResult,
          })

          // A missile hit applies in damage groupings, each with its own location roll: the next one loads here.
          const queue = this.state.takeDamageMissileQueue;
          this.setState({
            takeDamageEnergy: false,
            takeDamageHandheldRoll: 0,
            takeDamageAmount: queue.length > 0 ? queue[0] : this.state.takeDamageAmount,
            takeDamageMissileQueue: queue.slice(1),
            takeDamageLocation: "",
            takeDamageLocationRoll: 0,
            takeDamageLocationSide: "",
            takeDamageLocationRear: false,
            takeDamageDialog: currentBM,
          });

        }

      }
    }

    _getCurrentBM = (): BattleMech | null => {
      if( this.props.appGlobals && this.props.appGlobals.currentCBTForce ) {
          return this.props.appGlobals.currentCBTForce.getSelectedMech();
      }
      return null;
    }

    onChange = (nv: BattleMech ): void => {

      if( this.props.appGlobals.currentCBTForce ) {
        let currentBM: BattleMech | null = this.props.appGlobals.currentCBTForce.getSelectedMech();
        if( currentBM ) {
          currentBM = nv;
          this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
        }
      }
    }

    openSetMovementDialog = (
      currentBM: BattleMech
    ) => {

      this.setState({
        setMovementDialog: currentBM,
        setMovementMode: currentBM ? currentBM.currentMovementMode : "",
        setMovementNumber: currentBM ? currentBM.currentToHitMovementModifier : 0,
        setMovementCanJump: currentBM && Math.max(currentBM.getJumpSpeed(), currentBM.getJumpPackSpeed()) > 0 && currentBM.canUseJumpJetsInCurrentMode() ? true : false,
        setMovementJumpingMP: currentBM ? currentBM.currentTargetJumpingMP : 0,
        setMovementElevation: currentBM ? currentBM.airMechElevation : 0,
        bombMessage: "",
        setTargetDialog: null,
        takeDamageDialog: null,
      })
    }
    /** The combat drop step (TO:AUE p.105; BMR(R) p.78): burns and jettisons a pack under Total Warfare. */
    combatDrop = (
      e: React.FormEvent<HTMLButtonElement>
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }
      const currentBM = this.state.setMovementDialog;
      if( currentBM && this.props.appGlobals.currentCBTForce ) {
        const log = currentBM.combatDrop();
        this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
        this.setState({
          combatDropLog: log,
          setMovementCanJump: currentBM.getJumpSpeed() > 0 && currentBM.canUseJumpJetsInCurrentMode(),
          setMovementMode: currentBM.getJumpSpeed() > 0 || this.state.setMovementMode !== "j" ? this.state.setMovementMode : "n",
        });
      }
    }
    dropJumpPack = (
      e: React.FormEvent<HTMLButtonElement>
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }
      const currentBM = this.state.setMovementDialog;
      if( currentBM && this.props.appGlobals.currentCBTForce ) {
        currentBM.dropJumpPack();
        this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
        this.setState({
          setMovementCanJump: currentBM.getJumpSpeed() > 0 && currentBM.canUseJumpJetsInCurrentMode(),
          setMovementMode: currentBM.getJumpSpeed() > 0 || this.state.setMovementMode !== "j" ? this.state.setMovementMode : "n",
        });
      }
    }
    /** Drops or fires one loaded LAM bomb from the movement dialog (IO:AE p.105); the Alamo resolves by its blast rings as text. */
    useLoadedBomb = (
      tag: string,
      burst: "ground" | "air"
    ) => {
      const currentBM = this.state.setMovementDialog;
      if( !currentBM ) return;
      const result = currentBM.useBomb(tag, burst);
      if( result.ok && this.props.appGlobals.currentCBTForce ) {
        this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
      }
      this.setState({ bombMessage: result.message });
    }
    /** Changes a LAM's or QuadVee's mode in the movement dialog; a movement the new mode lacks is cleared. */
    setDialogTransformationMode = (
      mode: string
    ) => {
      const currentBM = this.state.setMovementDialog;
      if( !currentBM ) return;
      currentBM.setTransformationMode(mode);
      const airMech = currentBM.getTransformationMode() === "airmech";
      const canJump = Math.max(currentBM.getJumpSpeed(), currentBM.getJumpPackSpeed()) > 0 && currentBM.canUseJumpJetsInCurrentMode();
      const movementMode = this.state.setMovementMode;
      const keep = ( movementMode !== "j" || canJump ) && ( airMech || ( movementMode !== "c" && movementMode !== "f" ) );
      this.setState({
        setMovementCanJump: canJump,
        setMovementMode: keep ? movementMode : "",
      });
    }

    closeSetMovement  = (
      e: React.FormEvent<HTMLButtonElement>
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      this.setState({
        setMovementDialog: null,
      })
    }
    setMovement = (
      e: React.FormEvent<HTMLButtonElement>
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      if( this.props.appGlobals.currentCBTForce ) {

        if( this.state.setMovementDialog ) {
          const currentBM = this.state.setMovementDialog;
          currentBM.currentMovementMode = this.state.setMovementMode;
          currentBM.currentToHitMovementModifier = this.state.setMovementNumber;
          if( currentBM.currentMovementMode === "j")
            currentBM.currentTargetJumpingMP = currentBM.getJumpPackSpeed() > 0 ? Math.min(this.state.setMovementJumpingMP, currentBM.getJumpPackSpeed()) : this.state.setMovementJumpingMP;
          else if( currentBM.currentMovementMode === "c" || currentBM.currentMovementMode === "f" )
            // AirMech MP expended, for the heat (IO:AE p.102).
            currentBM.currentTargetJumpingMP = Math.min(this.state.setMovementJumpingMP, currentBM.currentMovementMode === "c" ? currentBM.getAirMechCruiseMP() : currentBM.getAirMechFlankMP());
          else
            currentBM.currentTargetJumpingMP = 0
          // An AirMech spending AirMech MP is airborne at 1 elevation or more; any other movement ends on the ground.
          currentBM.airMechElevation = currentBM.isAirMechAirborne() ? Math.max(1, this.state.setMovementElevation) : 0;
          this.props.appGlobals.saveCurrentCBTForce( this.props.appGlobals.currentCBTForce );
        } else {
          console.error("setMovement Can't find UUID ", this.state.setMovementDialog)
        }
      }

      this.setState({
        setMovementDialog: null,
      })
    }

    setMovementMode = (
      e: React.FormEvent<HTMLButtonElement>,
      nv: string
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }
      if( nv === "" ) {

        this.setState({
          setMovementMode: nv,
          setMovementNumber: 0,
          setMovementJumpingMP: 0,
        })
      } else {
        this.setState({
          setMovementMode: nv,

        })
      }

    }

    setMovementNumber = (
      e: React.FormEvent<any>,
      nv: number
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      let setMovementJumpingMP = 0;
      if( nv > 5 ) {
        setMovementJumpingMP = 25
      } else if( nv > 4 ) {
        setMovementJumpingMP = 18
      } else if( nv > 3 ) {
        setMovementJumpingMP = 10
      } else if( nv > 2 ) {
        setMovementJumpingMP = 7
      } else if( nv > 1 ) {
        setMovementJumpingMP = 5
      } else if( nv > 0 ) {
        setMovementJumpingMP = 3
      }
      this.setState({
        setMovementNumber: nv,
        setMovementJumpingMP: setMovementJumpingMP,
      })
    }

    updateMovementJumpingMP = (
      e: React.FormEvent<HTMLInputElement>,
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }

      let setMovementNumber = 0;
      // The Movement Modifiers Table of an earlier edition may stop sooner (Battledroids: +3 for 7-9 hexes, BD p.5).
      const maxMovementNumber = this.state.setMovementDialog?.getEditionPlayRules()?.maxTargetMovementModifier ?? 6;
      if( +e.currentTarget.value >= 25 ) {
        setMovementNumber = 6
      } else if( +e.currentTarget.value >= 18 ) {
        setMovementNumber = 5
      } else if( +e.currentTarget.value >= 10 ) {
        setMovementNumber = 4
      } else if( +e.currentTarget.value >= 7 ) {
        setMovementNumber = 3
      } else if( +e.currentTarget.value >= 5 ) {
        setMovementNumber = 2
      } else if( +e.currentTarget.value >= 3 ) {
        setMovementNumber = 1
      }

      this.setState({
        setMovementJumpingMP: +e.currentTarget.value,
        setMovementNumber: Math.min(setMovementNumber, maxMovementNumber),
      })
    }

    closeTargetDialog = (
      e: React.FormEvent<HTMLButtonElement>,
    ) => {
      if( e && e.preventDefault ) {
        e.preventDefault();
      }
    }

    closeZoomSheet = (
      e: React.FormEvent<HTMLButtonElement>,
    ) => {
      if( e && e.preventDefault ) e.preventDefault();

      this.setState({
        zoomSheet: false,
      })
    }

    openZoomSheet = (
      e: React.FormEvent<HTMLButtonElement>,
    ) => {
      if( e && e.preventDefault ) e.preventDefault();

      this.setState({
        zoomSheet: true,
      })
    }

    render = (): JSX.Element => {
      if(!this.props.appGlobals.currentCBTForce) {
        return <></>;
      }
      const selectedMech: BattleMech | null = this.props.appGlobals.currentCBTForce.getSelectedMech();
      // E-War Phase 3: each 'Mech reads its C3 link status from the force network when the to-hit uses the nearest networked unit range.
      const c3Force = this.props.appGlobals.currentCBTForce;
      for( const group of c3Force.groups ) {
        for( const member of group.members ) {
          member.c3StatusProvider = () => c3Force.getC3StatusFor( member.getUUID() );
        }
      }
      // The game's "Use design quirks" switch (quirks design, plan 3).
      const quirksInPlay = this.props.appGlobals.currentCBTForce.quirksInPlay;
      // Units added on the roster since the force loaded have not had the game year yet.
      if( quirksInPlay ) this.props.appGlobals.currentCBTForce.syncQuirkPlayYear();
      const sideInitiative = quirksInPlay ? this.props.appGlobals.currentCBTForce.getInitiativeModifier() : null;
      // The uplink, HQ and command console bonus for the side, with its source unit (Maximum Tech pp.59, 70).
      const sideBonuses = this.props.appGlobals.currentCBTForce.getSideBonuses();
      const targetCarrierLoad = this.state.setTargetDialog
        ? this._carrierLoad( this.state.setTargetDialog.uuid, this.state.setTargetDialog.getName(), "mech", this.state.setTargetDialog.isOmnimech, this.state.setTargetDialog.isFrankenMech() )
        : null;
      const movementCarrierLoad = this.state.setMovementDialog
        ? this._carrierLoad( this.state.setMovementDialog.uuid, this.state.setMovementDialog.getName(), "mech", this.state.setMovementDialog.isOmnimech, this.state.setMovementDialog.isFrankenMech() )
        : null;

      let selectedVehicle: Vehicle | null = null;
      for( const group of this.props.appGlobals.currentCBTForce.groups ) {
        for( const vehicle of group.vehicles ) {
          if( vehicle.getUUID() === this.state.selectedVehicleUUID ) {
            selectedVehicle = vehicle;
          }
        }
      }
      // A fighter is selected the same way as a vehicle, by its UUID.
      let selectedFighter: AerospaceFighter | null = null;
      for( const group of this.props.appGlobals.currentCBTForce.groups ) {
        for( const fighter of group.fighters ) {
          if( fighter.getUUID() === this.state.selectedVehicleUUID ) {
            selectedFighter = fighter;
          }
        }
      }
      // A Small Craft is selected the same way as a vehicle, by its UUID.
      let selectedSmallCraft: SmallCraft | null = null;
      for( const group of this.props.appGlobals.currentCBTForce.groups ) {
        for( const craft of group.smallCraft ) {
          if( craft.getUUID() === this.state.selectedVehicleUUID ) {
            selectedSmallCraft = craft;
          }
        }
      }
      // So is a JumpShip, WarShip or space station.
      let selectedCapitalShip: CapitalShip | null = null;
      for( const group of this.props.appGlobals.currentCBTForce.groups ) {
        for( const ship of group.capitalShips ) {
          if( ship.getUUID() === this.state.selectedVehicleUUID ) {
            selectedCapitalShip = ship;
          }
        }
      }
      // So is an infantry platoon.
      let selectedInfantry: InfantryPlatoon | null = null;
      for( const group of this.props.appGlobals.currentCBTForce.groups ) {
        for( const platoon of group.infantry ) {
          if( platoon.getUUID() === this.state.selectedVehicleUUID ) {
            selectedInfantry = platoon;
          }
        }
      }
      // And a battle armor squad.
      let selectedBattleArmor: BattleArmor | null = null;
      for( const group of this.props.appGlobals.currentCBTForce.groups ) {
        for( const squad of group.battleArmor ) {
          if( squad.getUUID() === this.state.selectedVehicleUUID ) {
            selectedBattleArmor = squad;
          }
        }
      }
      // And a ProtoMech Point.
      let selectedProtoMech: ProtoMech | null = null;
      for( const group of this.props.appGlobals.currentCBTForce.groups ) {
        for( const point of group.protoMechs ) {
          if( point.getUUID() === this.state.selectedVehicleUUID ) {
            selectedProtoMech = point;
          }
        }
      }
      // And a Micro-Mech (fan-made, #173).
      let selectedMicroMech: MicroMech | null = null;
      for( const group of this.props.appGlobals.currentCBTForce.groups ) {
        for( const micro of group.microMechs ) {
          if( micro.getUUID() === this.state.selectedVehicleUUID ) {
            selectedMicroMech = micro;
          }
        }
      }
      // And a walker (Custom Homebrew, #172).
      let selectedWalker: Walker | null = null;
      for( const group of this.props.appGlobals.currentCBTForce.groups ) {
        for( const walker of group.walkers ) {
          if( walker.getUUID() === this.state.selectedVehicleUUID ) {
            selectedWalker = walker;
          }
        }
      }
      // And a Battledroids tank, jeep or infantry squad.
      let selectedBattledroidsUnit: BattledroidsUnit | null = null;
      for( const group of this.props.appGlobals.currentCBTForce.groups ) {
        for( const unit of group.battledroidsUnits ) {
          if( unit.getUUID() === this.state.selectedVehicleUUID ) {
            selectedBattledroidsUnit = unit;
          }
        }
      }
      // And a building.
      let selectedBuilding: Building | null = null;
      for( const group of this.props.appGlobals.currentCBTForce.groups ) {
        for( const building of group.buildings ) {
          if( building.getUUID() === this.state.selectedVehicleUUID ) {
            selectedBuilding = building;
          }
        }
      }
      // The selected unit's quirks, in the same order the panels below are chosen; units without quirks show none.
      const quirkCarrier: IQuirkCarrier | null = selectedBattledroidsUnit || selectedBuilding || selectedInfantry || selectedProtoMech || selectedMicroMech || selectedWalker ? null
        : selectedBattleArmor ?? selectedFighter ?? selectedSmallCraft ?? selectedCapitalShip ?? selectedVehicle ?? selectedMech;
      const ewarCarrier: IEWarCarrier | null = selectedBattledroidsUnit || selectedProtoMech || selectedMicroMech || selectedWalker ? null
        : selectedBuilding ?? selectedInfantry ?? selectedBattleArmor ?? selectedFighter ?? selectedSmallCraft ?? selectedCapitalShip ?? selectedVehicle ?? selectedMech;
      return (
        <>
{this.state.zoomSheet && selectedMech ? (
  <StandardModal
  show={true}
  className="modal modal-xxl no-content-padding"
  onClose={this.closeZoomSheet}
  title={"Viewing Record Sheet for " + selectedMech.getName()}
  >
    <div className="svg-height-100perc">
    <BattleMechSVG
      mechData={selectedMech}
      inPlay={true}
      quirksInPlay={quirksInPlay}
      bgColor={selectedMech.isWrecked() ? "#666" : ""}
      openSetCriticalDialog={() => this.openSetCriticalDialog(selectedMech)}
      openSetTargetDialog={() => this.openSetTargetDialog(selectedMech)}
      openTakeDamageDialog={() => this.openTakeDamageDialog(selectedMech)}
      openSetMovementDialog={() => this.openSetMovementDialog(selectedMech)}
      onChange={this.onChange}
      viewGATOR={this.viewGATOR}
      currentPhase={this.props.appGlobals.currentCBTForce.phase}
    />
    </div>
  </StandardModal>
) : null}
  <StandardModal
  show={this.state.hitLocationChartDialog}
  className="modal even-modaler"
  onClose={this.closeHitLocationChartDialog}
  title={"Hit Location Chart"}
>
    <ToHitTable />
</StandardModal>
{this.state.damagePerClusterGATOR && this.state.damageClusters > -1 && this.state.damagePerCluster > -1 ? (
  <StandardModal
  show={true}
  className="modal modal-xl even-modaler"
  onClose={this.closeClusterDamageChart}
  title={"Damage Cluster for " + this.state.damagePerClusterGATOR.weaponName}
>
    {this.getClusterEWarShifts().length > 0 ? (
      <div className="alert alert-sm alert-info">
        E-War: {this.getClusterEWarShifts().map(shift => shift.label).join(", ")}. Each roll below already includes the shift.
      </div>
    ) : null}
    <h4>Step 1: Click on the Roll or # of hits:</h4>
    <table className="table text-center">
      <thead>
        <tr>
          <th>
            <div className="small-text">
              Roll <ArrowCircleRight />
            </div>
            <div className="small-text">
              <ArrowCircleDown /> # Shots
            </div>
          </th>
          <th><button title="This is the die roll for the cluster hits" className="btn btn-sm btn-secondary" onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(2))}>2</button></th>
          <th><button title="This is the die roll for the cluster hits" className="btn btn-sm btn-secondary" onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(3))}>3</button></th>
          <th><button title="This is the die roll for the cluster hits" className="btn btn-sm btn-secondary" onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(4))}>4</button></th>
          <th><button title="This is the die roll for the cluster hits" className="btn btn-sm btn-secondary" onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(5))}>5</button></th>
          <th><button title="This is the die roll for the cluster hits" className="btn btn-sm btn-secondary" onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(6))}>6</button></th>
          <th><button title="This is the die roll for the cluster hits" className="btn btn-sm btn-secondary" onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(7))}>7</button></th>
          <th><button title="This is the die roll for the cluster hits" className="btn btn-sm btn-secondary" onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(8))}>8</button></th>
          <th><button title="This is the die roll for the cluster hits" className="btn btn-sm btn-secondary" onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(9))}>9</button></th>
          <th><button title="This is the die roll for the cluster hits" className="btn btn-sm btn-secondary"  onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(10))}>10</button></th>
          <th><button title="This is the die roll for the cluster hits" className="btn btn-sm btn-secondary"  onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(11))}>11</button></th>
          <th><button title="This is the die roll for the cluster hits" className="btn btn-sm btn-secondary"  onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(12))}>12</button></th>
        </tr>
      </thead>
        <tbody>
          <tr>
            <td>#{this.state.damageClusters}</td>
            <td><button title="This is the rolled number of cluster hits" className="btn btn-sm btn-primary" onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(2))}>{this.clusterHits(2)}</button></td> {/* 2 */}
            <td><button title="This is the rolled number of cluster hits" className="btn btn-sm btn-primary" onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(3))}>{this.clusterHits(3)}</button></td> {/* 3 */}
            <td><button title="This is the rolled number of cluster hits" className="btn btn-sm btn-primary" onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(4))}>{this.clusterHits(4)}</button></td> {/* 4 */}
            <td><button title="This is the rolled number of cluster hits" className="btn btn-sm btn-primary" onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(5))}>{this.clusterHits(5)}</button></td> {/* 5 */}
            <td><button title="This is the rolled number of cluster hits" className="btn btn-sm btn-primary" onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(6))}>{this.clusterHits(6)}</button></td> {/* 6 */}
            <td><button title="This is the rolled number of cluster hits" className="btn btn-sm btn-primary" onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(7))}>{this.clusterHits(7)}</button></td> {/* 7 */}
            <td><button title="This is the rolled number of cluster hits" className="btn btn-sm btn-primary" onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(8))}>{this.clusterHits(8)}</button></td> {/* 8 */}
            <td><button title="This is the rolled number of cluster hits" className="btn btn-sm btn-primary" onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(9))}>{this.clusterHits(9)}</button></td> {/* 9 */}
            <td><button title="This is the rolled number of cluster hits" className="btn btn-sm btn-primary"  onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(10))}>{this.clusterHits(10)}</button></td> {/* 10 */}
            <td><button title="This is the rolled number of cluster hits" className="btn btn-sm btn-primary"  onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(11))}>{this.clusterHits(11)}</button></td> {/* 11 */}
            <td><button title="This is the rolled number of cluster hits" className="btn btn-sm btn-primary"  onClick={(e) => this.setNumberRolledClusters(e, this.clusterHits(12))}>{this.clusterHits(12)}</button></td> {/* 12 */}
          </tr>
        </tbody>

    </table>

    {this.state.damagePerClusterUnit && this.state.damageRolledClusters > 0 ? (
      <>
        <h4>Step 2: Walk through each cluster hit and assign damage.</h4>
        <p>Click on a location to assign damage</p>
        <div className="row">
          <div className="col-md-6">
            <table className="table text-center">
              <thead>
                <tr>
                  <th colSpan={3}>Cluster Log ({this.state.damageRolledClusters} Hits)</th>
                </tr>
                <tr>
                  <th>Hit #</th>
                  <th>Location</th>
                  <th>Damage</th>
                </tr>
              </thead>
              {this.state.damagePerClusterUnit.equipmentList[this.state.damagePerClusterEQIndex].damageClusterHits ? (
                <>
                 {// @ts-expect-error Legacy compatibility type mismatch
                 this.state.damagePerClusterUnit.equipmentList[this.state.damagePerClusterEQIndex].damageClusterHits.map( (hit, hitIndex) => {
                  return (
                  <tbody key={hitIndex}>
                    <tr>
                      <td>{hitIndex +1}</td>
                      <td>{getLocationName(hit.location, false)}</td>
                      <td>{hit.damage}</td>
                    </tr>
                  </tbody>
                  )
                })}
                {// @ts-expect-error Legacy compatibility type mismatch
                 this.state.damagePerClusterUnit.equipmentList[this.state.damagePerClusterEQIndex].damageClusterHits.length === 0 ? (
                  <tbody>
                    <tr>
                      <td colSpan={3}>
                        Click on a location on the table to the right to assign a cluster hit
                      </td>
                    </tr>
                  </tbody>
                ): null}
                {// @ts-expect-error Legacy compatibility type mismatch
                 this.state.damagePerClusterUnit.equipmentList[this.state.damagePerClusterEQIndex].damageClusterHits.length >= this.state.damageRolledClusters ? (
                  <tfoot>
                    <tr>
                      <th colSpan={3} className="color-green">
                        You're Done! :)
                      </th>
                    </tr>
                  </tfoot>
                ) : null}
                </>
              ) : null}

            </table>
          </div>
          <div className="col-md-6">
                {// @ts-expect-error Legacy compatibility type mismatch
                 this.state.damagePerClusterUnit.equipmentList[this.state.damagePerClusterEQIndex].damageClusterHits.length < this.state.damageRolledClusters ? (
                  <div>
            <ToHitTable
              onClick={(loc, crit) => this.addDamageCluster( loc, crit, this.state.damagePerClusterUnit, this.state.damagePerClusterEQIndex)}
            />
          </div>
                 ): (
                   <div className="text-center">
                      No more cluster hits need to be assigned
                     </div>
                 )}
            </div>
        </div>
      </>
    ) : null}

    {/* <h4>Step 3: ???</h4> */}
  </StandardModal>
) : null}
{this.state.resolveFireDialog && this.props.appGlobals.currentCBTForce ? (
  <StandardModal
    show={true}
    className="modal-xl"
    onClose={this.closeResolveFireDialog}
    title={"Resolving Attacks for Turn #" + this.props.appGlobals.currentCBTForce.turn}
  >
    {this.props.appGlobals.currentCBTForce.groups.map( (group, groupIndex) => {
      return (
        <div key={groupIndex}>
          <h2>{group.getName(groupIndex)}</h2>
          {group.members.map( (unit, unitIndex) => {
            let numberOfAttacks = 0;
            for( const attack of unit.equipmentList ) {
              if( attack.target ) {
                numberOfAttacks++;
              }
            }
            return <fieldset className="fieldset" key={unitIndex}>
              <legend>{unit.getName()}</legend>
              <table className="table text-center">
                <thead>
                  <tr>
                    <th>Weapon</th>
                    <th>Target</th>
                    <th className="min-width">G</th>
                    <th className="min-width">A</th>
                    <th className="min-width">T</th>
                    <th className="min-width">O</th>
                    <th className="min-width">R</th>
                    <th className="min-width no-wrap">To-Hit</th>
                    <th className="min-width no-wrap">Damage</th>
                    <th className="min-width no-wrap"><span className="visually-hidden">Actions</span></th>
                  </tr>

                </thead>
                {numberOfAttacks === 0 ? (
                  <tbody>
                    <tr>
                      <td colSpan={9}>
                        This unit has no attacks declared
                      </td>
                    </tr>

                  </tbody>
                ) : (
                  <>
                    {unit.equipmentList.map( (attack, attackIndex) => {
                      const attackGATOR = getTargetToHitFromWeapon(
                          unit,
                          attackIndex,
                          null,
                          null,
                          quirksInPlay,

                      )
                      if( !attack.isAmmo && !attack.isEquipment && attackGATOR.target ) {
                        const selectedAmmo = attack.selectedAmmoBinUUID
                          ? unit.equipmentList.find(item => item.uuid === attack.selectedAmmoBinUUID)
                          : undefined;
                        const damagePerCluster = selectedAmmo?.ammoProfile?.damagePerMissile ?? attack.damagePerCluster;

                        let attackDamage = attack.damage ? attack.damage.toString() : "";
                        // An energy weapon's hit is halved while this unit's Blue Saviour is on (#641): one number or short / medium / long.
                        const blueSaviourHalves = unit.isBlueSaviourOn() && isEnergyWeapon(attack);
                        const halve = (damage: number) => unit.getBlueSaviourOutgoingDamage(attack, damage);
                        const halvedBands = blueSaviourHalves && attack.damage && typeof attack.damage === "object" ? attack.damage : undefined;
                        let attackDamageSecondLine = "";
                        if( blueSaviourHalves && typeof attack.damage === "number" && attack.damage > 0 ) {
                          attackDamage = getBlueSaviourDamageText( attack.damage, !!attack.damagePerShot, halve );
                        } else if( halvedBands ) {
                          attackDamage = getBlueSaviourDamageText( halvedBands, !!attack.damagePerShot, halve );
                        } else if( attack.damagePerShot ) {
                          attackDamage += "/shot";
                        }

                        let clusterChartButton = false;
                        if( attack.damageClusters ) {
                          clusterChartButton = true;
                          attackDamage += attack.damageClusters.toString() + " clusters";
                          if( damagePerCluster )
                            attackDamageSecondLine = blueSaviourHalves
                              ? `${halve( damagePerCluster )} damage/hit (half of ${damagePerCluster}, Blue Saviour)`
                              : damagePerCluster.toString() + " damage/hit";
                        }

                        let attackUUID = "";
                        if( attack.uuid )
                          attackUUID = attack.uuid;
                        let attackLocation = "";
                        if( attack.location )
                          attackLocation = attack.location;
                        const attackDamaged = unit.isEquipmentDamaged( attackUUID, attackLocation );
                        return (
                          <tbody key={attackIndex}>
                            <tr>
                              <td className={attackDamaged ? "bright-red-strike-through" : ""}>
                                {attackGATOR.weaponName}
                                {weaponNeedsAmmo( attack )? (
                                  <label>
                                    <select
                                      onChange={(e) => this.selectAmmoBin( e, unit, attack.uuid ? attack.uuid : "" )}
                                      value={attack.selectedAmmoBinUUID}
                                    >
                                      <option value="">-Select Ammo Bin-</option>
                                      {unit.equipmentList.map( (eq, eqIndex) => {
                                        if( getCompatibleAmmo(attack, eq) ) {
                                          return <option key={eqIndex} value={eq.uuid}>{eq.name} {eq.location} {unit.getAmmoBinRemaining(eq)}/{unit.getAmmoBinCapacity(eq)}</option>
                                        } else {
                                          return <React.Fragment key={eqIndex} />
                                        }
                                      })}
                                    </select>
                                  </label>
                                ) : null}
                              </td>
                              <td className={attackDamaged ? "bright-red-strike-through" : ""}>{attackGATOR.targetName ? (
                                <>{attackGATOR.targetName}<div className="small-text">{attackGATOR.target}</div></>
                              ) : (
                                <>{attackGATOR.target}</>
                              )}
                              {attackGATOR.targetObj && attackGATOR.targetObj.primary ? (
                                <div className='small-text'>(primary)</div>
                              ) : (
                                <>
                                {attackGATOR.targetObj && attackGATOR.targetObj.inRearArc ?
                                <div className='small-text'>(secondary rear target)</div>
                                :
                                <div className='small-text'>(secondary)</div>}
                                </>
                              )}


                              </td>

                              <td className={attackDamaged ? "bright-red-strike-through" : ""}>{attackGATOR.gunnerySkill}</td>
                              <td className={attackDamaged ? "bright-red-strike-through" : ""}>{attackGATOR.attackerMovementModifier}</td>
                              <td className={attackDamaged ? "bright-red-strike-through" : ""}>{attackGATOR.targetMovementModifier}</td>
                              <td className={attackDamaged ? "bright-red-strike-through" : ""}>{attackGATOR.otherModifiers}</td>
                              <td className={attackDamaged ? "bright-red-strike-through" : ""}>{attackGATOR.rangeModifier}</td>
                              {attackGATOR.finalToHit >= 2 && attackGATOR.finalToHit <= 12 ? (
                                <td title={attackGATOR.explanation} className={attackDamaged ? "bright-red-strike-through" : ""}><strong>{attackGATOR.finalToHit}+</strong></td>
                              ) : (
                                <td title={attackGATOR.explanation} className={attackDamaged ? "bright-red-strike-through" : ""}>N/S</td>
                              )}


                              <td className={attackDamaged ? "bright-red-strike-through min-width no-wrap" : "min-width no-wrap"}>
                              {attackGATOR.finalToHit >= 2 && attackGATOR.finalToHit <= 12 ? (
                                <div className="flex">
                                  {clusterChartButton ? (

                                    <div className="text-center">
                                    <button
                                      className="btn btn-primary btn-sm"
                                      title="Click here to open the Cluster Damage Chart"
                                      onClick={(e) => this.openClusterDamageChart(e, attackGATOR, attack.damageClusters, blueSaviourHalves && damagePerCluster ? halve( damagePerCluster ) : damagePerCluster, unit, attackIndex)}
                                    >
                                      <MissileSwarmIcon />
                                    </button>
                                    </div>
                                  ) : null}
                                  <div className={clusterChartButton ? "grow text-left" : "grow text-center"}>
                                    {attackDamage}<br />
                                    {attackDamageSecondLine}
                                  </div>
                                </div>
                              ) : "N/S"}
                              </td>

                              <td className="min-width no-wrap">
                              {attackGATOR.finalToHit >= 2 && attackGATOR.finalToHit <= 12 ? ( <>
                                {attackDamaged ? (
                                  <div className="color-bright-red">Damaged</div>
                                ) : (
                                  <>
                                   <button
                                    className={"btn btn-primary btn-sm"}
                                    onClick={this.openHitLocationChartDialog}
                                    title="Click to open the Hit Location Table"
                                  >

                                    <Table />
                                  </button>
                                  <button
                                    className={attack.resolved ? "btn btn-phase-active btn-sm" : "btn btn-warning btn-sm"}
                                    onClick={(e) => this.toggleResolved(e, unit, attackIndex)}
                                    title="Click here to make this attack as resolved"
                                  >
                                    {attack.resolved ?
                                    <CheckSquare />
                                    :
                                    <Square /> }
                                  </button>
                                  </>
                                )}
                                </>
) : "N/S"}
                              </td>

                            </tr>
                          </tbody>
                        )
                      } else {
                        return <React.Fragment key={attackIndex} />
                      }
                    })}
                  </>
                )}
              </table>
            </fieldset>
          })}
        </div>
      )
    })}
  </StandardModal>
) : null}
<StandardModal
  show={this.state.viewGATOR ? true : false}
  onClose={this.closeGATOR}
  title={(this.state.viewGATOR &&
    this.state.viewGATOR.weaponName) ? (
      "" + this.state.viewGATOR.weaponName + ( this.state.viewGATOR?.target ? " vs " + this.state.viewGATOR.target : "")
    ) : (
      "GATOR Calculations"
    )}
>
  {this.state.viewGATOR ? (
    <table className="table text-center">
      <thead>
        <tr>
          <th style={{width: "14%"}}>G</th>
          <th style={{width: "14%"}}>A</th>
          <th style={{width: "14%"}}>T</th>
          <th style={{width: "14%"}}>O</th>
          <th style={{width: "14%"}}>R</th>
          <th style={{width: "14%"}}>&nbsp;</th>
          <th style={{width: "14%"}}>To-Hit</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{this.state.viewGATOR.gunnerySkill}</td>
          <td>{this.state.viewGATOR.attackerMovementModifier}</td>
          <td>{this.state.viewGATOR.targetMovementModifier}</td>
          <td>
            {this.state.viewGATOR.otherModifiers}

            {this.state.viewGATOR.otherModifiersExplanation ? (
              <>
              <div className="small-text">
                {this.state.viewGATOR.otherModifiersExplanation}
              </div>
              </>
            ) : null}
          </td>
          <td>
            {this.state.viewGATOR.rangeModifier}
            {this.state.viewGATOR.rangeExplanation ? (
              <>
              <div className="small-text">
                {this.state.viewGATOR.rangeExplanation}
              </div>
              </>
            ) : null}
          </td>
          <td>&nbsp;</td>
          <td>
            {this.state.viewGATOR.finalToHit > -1 ? (
              <>
                {this.state.viewGATOR.finalToHit}+
              </>
            ) : (
              <>
                No Shot!
              </>
            )}

          </td>
        </tr>
      </tbody>

            {this.state.viewGATOR.explanation ? (
              <>
                <tfoot>
                  <tr>
                    <th colSpan={7}>
                  {this.state.viewGATOR.explanation}
                  </th>
                  </tr>
                </tfoot>
              </>
            ) : null
            }

    </table>
  ) : null}
</StandardModal>
{this.state.setMovementDialog ? (
<StandardModal
  show={true}
  onClose={this.closeSetMovement}
  onSave={this.setMovement}
  saveDisabled={this.state.setMovementMode === "n" || this.state.setMovementNumber < 0}
  title={this.state.setMovementDialog.getName() + " Movement Info"}
>
    {movementCarrierLoad && movementCarrierLoad.riders.length > 0 ? (
      <div className="small-text" data-testid="mech-carrier-movement-notes">
        <p>Carrying {movementCarrierLoad.riders.map( (squad) => squad.getDisplayName() ).join(", ")}.</p>
        {movementCarrierLoad.walkingPenalty > 0 ? (
          <p className="color-red">Not an OmniMech: it has {movementCarrierLoad.walkingPenalty} less Walking MP while it carries the squad, which is not taken off below (TW p. 227).</p>
        ) : <p>An OmniMech loses no MP for carrying battle armor (TW p. 227).</p>}
      </div>
    ) : null}

    <div className="flex">
      <div className="text-center">
      {this.state.setMovementDialog.isLAM() || this.state.setMovementDialog.isQuadVee() ? (
        <>
          <div className="small-text">Transformation Mode</div>
          {this.state.setMovementDialog.isLAM() ? (
            <>
              <button className={this.state.setMovementDialog.getTransformationMode() === "mech" ? "btn btn-primary" : "btn"} onClick={() => this.setDialogTransformationMode("mech")}>Mech</button>
              {this.state.setMovementDialog.hasAirMechMode() ? (
                <button className={this.state.setMovementDialog.getTransformationMode() === "airmech" ? "btn btn-primary" : "btn"} onClick={() => this.setDialogTransformationMode("airmech")}>AirMech</button>
              ) : null}
              {this.state.setMovementDialog.isVTOLAM() ? (
                <button className={this.state.setMovementDialog.getTransformationMode() === "vehicle" ? "btn btn-primary" : "btn"} onClick={() => this.setDialogTransformationMode("vehicle")}>VTOL</button>
              ) : (
                <button className={this.state.setMovementDialog.getTransformationMode() === "aerospace" ? "btn btn-primary" : "btn"} onClick={() => this.setDialogTransformationMode("aerospace")}>Aerospace</button>
              )}
            </>
          ) : (
            <>
              <button className={this.state.setMovementDialog.getTransformationMode() === "mech" ? "btn btn-primary" : "btn"} onClick={() => this.setDialogTransformationMode("mech")}>Mech</button>
              <button className={this.state.setMovementDialog.getTransformationMode() === "vehicle" ? "btn btn-primary" : "btn"} onClick={() => this.setDialogTransformationMode("vehicle")}>Vehicle</button>
            </>
          )}
          {this.state.setMovementDialog.isVTOLAM() ? <div className="small-text">VTOL Cruise / Flank MP: {this.state.setMovementDialog.getVTOLAMCruiseMP()} / {this.state.setMovementDialog.getVTOLAMFlankMP()}. {this.state.setMovementDialog.getLAMTypeNotes()}</div> : null}
          {this.state.setMovementDialog.isLAM() && Object.keys(this.state.setMovementDialog.getBombLoadout()).length > 0 ? (
            <div className="small-text">
              Bomb bays (IO:AE p.105): {Object.keys(this.state.setMovementDialog.getBombLoadout()).map((tag) => (
                <span key={tag}>
                  {this.state.setMovementDialog!.getBombName(tag)} x{this.state.setMovementDialog!.getBombsRemaining(tag)}{" "}
                  <button className="btn" disabled={this.state.setMovementDialog!.getBombsRemaining(tag) <= 0} onClick={() => this.useLoadedBomb(tag, "ground")}>Drop / fire</button>
                  {tag.includes("alamo") ? <button className="btn" disabled={this.state.setMovementDialog!.getBombsRemaining(tag) <= 0} onClick={() => this.useLoadedBomb(tag, "air")}>Air-burst</button> : null}{" "}
                </span>
              ))}
              {this.state.bombMessage ? <div>{this.state.bombMessage}</div> : null}
            </div>
          ) : null}
          {this.state.setMovementDialog.isQuadVee() ? <div className="small-text">Motive: {this.state.setMovementDialog.getQuadVeeMotive()} Vehicle Cruise MP: {this.state.setMovementDialog.getQuadVeeVehicleCruiseMP()}</div> : null}
        </>
      ) : null}
      <button
        className={this.state.setMovementMode === "" ? "btn btn-primary" : "btn"}
        onClick={(e) => this.setMovementMode(e, "")}
      >
    <svg
      width={40}
      height={40}
      >
      <DieSVG
        posX={0}
        posY={0}
        width={40}
        bgColor="#009"
        pipColor="white"
        numberPips={0}
      />
      </svg><br />
      Stationary
      </button>
      <br />
      <button
        className={this.state.setMovementMode === "w" ? "btn btn-primary" : "btn"}
        onClick={(e) => this.setMovementMode(e, "w")}
      >
    <svg
      width={40}
      height={40}
      >
      <DieSVG
        posX={0}
        posY={0}
        width={40}
        bgColor="white"
        pipColor="black"
        numberPips={1}
      />
      </svg><br />
      Walk: {this.state.setMovementDialog.getTransformationMode() === "airmech" ? this.state.setMovementDialog.getAirMechWalkMP() : this.state.setMovementDialog.getWalkSpeed()}
      </button>
      <br />
    <button
        className={this.state.setMovementMode === "r" ? "btn btn-primary" : "btn"}
        onClick={(e) => this.setMovementMode(e, "r")}
        disabled={!this.state.setMovementDialog.canUseFutureWarsMovementMode("r")}
        title={this.state.setMovementDialog.canUseFutureWarsMovementMode("r") ? undefined : "The leg Power Booster burned out the legs: walking only until a major overhaul"}
      >
    <svg
      width={40}
      height={40}
      >
    <DieSVG
        posX={0}
        posY={0}
        width={40}
        bgColor="black"
        pipColor="white"
        numberPips={2}
      />
      </svg><br />
      Run:  {this.state.setMovementDialog.getTransformationMode() === "airmech" ? this.state.setMovementDialog.getAirMechRunMP() : this.state.setMovementDialog.getRunSpeed()}{getBoostedMoveNote(this.state.setMovementDialog, "r")}
      </button>
      <br />
    {this.state.setMovementCanJump ? (
      <>
    <button
        className={this.state.setMovementMode === "j" ? "btn btn-primary" : "btn"}
        onClick={(e) => this.setMovementMode(e, "j")}
        disabled={!this.state.setMovementDialog.canUseFutureWarsMovementMode("j")}
        title={this.state.setMovementDialog.canUseFutureWarsMovementMode("j") ? undefined : "The jump-jet Power Booster burned out the jets: they must be replaced"}
      >
      <svg
      width={40}
      height={40}
      >
    <DieSVG
        posX={0}
        posY={0}
        width={40}
        bgColor="red"
        pipColor="white"
        numberPips={3}
      />
      </svg><br />
      Jump:  {this.state.setMovementDialog.getJumpingText()}{getBoostedMoveNote(this.state.setMovementDialog, "j")}
      </button>
      </>
    ) : null}
    {this.state.setMovementDialog.hasAirMechMode() && this.state.setMovementDialog.getTransformationMode() === "airmech" ? (
      <>
      <button
        className={this.state.setMovementMode === "c" ? "btn btn-primary" : "btn"}
        onClick={(e) => this.setMovementMode(e, "c")}
        data-testid="airmech-cruise"
      >
        AirMech Cruise: {this.state.setMovementDialog.getAirMechCruiseMP()}
      </button>
      <br />
      <button
        className={this.state.setMovementMode === "f" ? "btn btn-primary" : "btn"}
        onClick={(e) => this.setMovementMode(e, "f")}
        data-testid="airmech-flank"
      >
        AirMech Flank: {this.state.setMovementDialog.getAirMechFlankMP()}
      </button>
      </>
    ) : null}

      </div>
      <div className="grow">
        <table className="table text-center">
          <thead>
            <tr>
              <th colSpan={2}>
                Movement Modifier Table
                <div className="small-text">Click a line below to select</div>
              </th>
            </tr>

            <tr>
              <th>Move (hexes)</th>
              <th>Mod</th>
            </tr>
          </thead>
          <tbody className={this.state.setMovementNumber === 0 ? "highlighted" : ""}>
            <tr className="cursor-pointer" onClick={(e) => this.setMovementNumber(e, 0)}>
              <td>0-2</td>
              <td>0</td>
            </tr>
          </tbody>
          <tbody className={this.state.setMovementNumber === 1 ? "highlighted" : ""}>
            <tr className="cursor-pointer" onClick={(e) => this.setMovementNumber(e, 1)}>
              <td>3-4</td>
              <td>+1</td>
            </tr>
            </tbody>
            <tbody className={this.state.setMovementNumber === 2 ? "highlighted" : ""}>
            <tr className="cursor-pointer" onClick={(e) => this.setMovementNumber(e, 2)}>
              <td>5-6</td>
              <td>+2</td>
            </tr>
            </tbody>
            <tbody className={this.state.setMovementNumber === 3 ? "highlighted" : ""}>
            <tr className="cursor-pointer" onClick={(e) => this.setMovementNumber(e, 3)}>
              <td>7-9</td>
              <td>+3</td>
            </tr>
            </tbody>
            {(this.state.setMovementDialog.getEditionPlayRules()?.maxTargetMovementModifier ?? 6) >= 4 ? (<>
            <tbody className={this.state.setMovementNumber === 4 ? "highlighted" : ""}>
            <tr className="cursor-pointer" onClick={(e) => this.setMovementNumber(e, 4)}>
              <td>10-17</td>
              <td>+4</td>
            </tr>
            </tbody>
          <tbody className={this.state.setMovementNumber === 5 ? "highlighted" : ""}>
            <tr className="cursor-pointer" onClick={(e) => this.setMovementNumber(e, 5)}>
              <td>18-24</td>
              <td>+5</td>
            </tr>
            </tbody>
          <tbody className={this.state.setMovementNumber === 6 ? "highlighted" : ""}>
            <tr className="cursor-pointer" onClick={(e) => this.setMovementNumber(e, 6)}>
              <td>25+</td>
              <td>+6</td>
            </tr>
          </tbody>
            </>) : null}
          {this.state.setMovementMode === "j" || this.state.setMovementMode === "c" || this.state.setMovementMode === "f" ? (
            <tfoot>
              <tr>
                <th colSpan={2} className="small-text">
                  The +1 to be hit for a jump or an airborne AirMech is on the in-play sheet
                </th>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

  </div>
  {this.state.setMovementDialog.getJumpPackSpeed() > 0 ? (
    <div className="text-center" data-testid="jump-pack-play">
      <span>
        Jump pack ({this.state.setMovementDialog.getJumpPackSpeed()} MP, {this.state.setMovementDialog.getJumpPackFuelText(this.state.setMovementDialog.getJumpPackFuelLeft())} left, no heat)
      </span>{" "}
      <button className="btn btn-sm" data-testid="jump-pack-drop" onClick={this.dropJumpPack}>Drop the pack (1 MP)</button>
    </div>
  ) : null}
  {this.state.setMovementDialog.canCombatDrop().allowed ? (
    <div className="text-center" data-testid="combat-drop-play">
      <button className="btn btn-sm" data-testid="combat-drop" onClick={this.combatDrop}>Combat drop</button>
      {this.state.combatDropLog.map((line, index) => <div key={index} className="smaller-text">{line}</div>)}
    </div>
  ) : null}
  {this.state.setMovementMode === "j" ? (
        <div className="text-center">
        <InputNumeric
          label={(this.state.setMovementDialog?.getJumpPackSpeed() ?? 0) > 0 ? "Jumping MP Used (for fuel)" : "Jumping MP Used (for heat calculation)"}
          value={this.state.setMovementJumpingMP}
          onChange={this.updateMovementJumpingMP}
          description="Changing this will also set the movement modifer above, so you don't have to perform two clicks."
          inline={true}
          min={0}
          max={30}
          step={1}
        />
        </div>
  ) : null}
  {this.state.setMovementMode === "c" || this.state.setMovementMode === "f" ? (
        <div className="text-center" data-testid="airmech-movement">
        <InputNumeric
          label="AirMech MP Used (for heat: MP / 3)"
          value={this.state.setMovementJumpingMP}
          onChange={(e: React.FormEvent<HTMLInputElement>) => this.setState({ setMovementJumpingMP: Math.max(0, Math.floor(+e.currentTarget.value || 0)) })}
          inline={true}
          min={0}
          max={this.state.setMovementMode === "c" ? this.state.setMovementDialog.getAirMechCruiseMP() : this.state.setMovementDialog.getAirMechFlankMP()}
          step={1}
        />
        <InputNumeric
          label="Elevation at the end of movement"
          value={this.state.setMovementElevation}
          onChange={(e: React.FormEvent<HTMLInputElement>) => this.setState({ setMovementElevation: Math.max(1, Math.min(25, Math.floor(+e.currentTarget.value || 1))) })}
          inline={true}
          min={1}
          max={25}
          step={1}
        />
        <div className="small-text">
          AirMech Cruise / Flank (IO:AE pp.102-103): moves as a WiGE at 1 elevation or more. 5 MP to take off; at least
          5 hexes a turn to stay up, or 5 MP to hover (0-4 hexes moved first). 1 MP an elevation to climb, up to 25; 2 MP
          a hex while more than 1 elevation up; descending is free. A landing needs a Control Roll only if the gyro or hip
          actuator is hit (2021 printing). Turn mode rules apply; no evasive action or overdrive. Airborne: +1 to be hit; heat MP / 3.
        </div>
        </div>
  ) : null}
</StandardModal>
      ) : null}
{this.state.setTargetDialog ? (
<StandardModal
  show={true}
  onClose={this.closeSetTarget}
  onSave={this.setTarget}
  className="modal-xl"
  title={this.state.setTargetDialog.getName() + " Target Selection"}
>
  {this.state.setTargetDialog.equipmentList.some(item => item.targetingSystem?.variableRange) ? (
    <label className="text-center full-width">
      Variable-Range Targeting (set in the End Phase; Maximum Tech p.59):{" "}
      <select
        value={this.state.setTargetDialog.targetingRangeSetting}
        onChange={(e) => {
          this.state.setTargetDialog!.targetingRangeSetting = e.currentTarget.value as BattleMech["targetingRangeSetting"];
          this.forceUpdate();
        }}
      >
        <option value="normal">Normal</option>
        <option value="long">Long-Range</option>
        <option value="short">Short-Range</option>
      </select>
    </label>
  ) : null}
  {this.state.setTargetDialog.hasEnhancedImaging() ? (
    <label className="text-center full-width">
      <input
        type="checkbox"
        checked={!this.state.setTargetDialog.enhancedImagingOff}
        onChange={(e) => {
          this.state.setTargetDialog!.enhancedImagingOff = !e.currentTarget.checked;
          this.forceUpdate();
        }}
      />{" "}
      Enhanced Imaging on (set in the End Phase): Piloting -1, feedback roll on structure damage; a sensors hit shuts it down
      {this.state.setTargetDialog.usesEarlierRulesEdition() ? " (Maximum Tech p.61)" : "; works only for a pilot with EI implants, and gives a 1-hex active probe while the sensors are unhit, on or off (IO:AE p.69)"}.
      {this.state.setTargetDialog.isEnhancedImagingActive() ? null : <strong> Not active.</strong>}
    </label>
  ) : null}
  {this.state.setTargetDialog.hasSatelliteUplink() ? (
    <label className="text-center full-width">
      <input
        type="checkbox"
        data-testid="uplink-on"
        checked={!this.state.setTargetDialog.satelliteUplinkOff}
        onChange={(e) => {
          this.state.setTargetDialog!.satelliteUplinkOff = !e.currentTarget.checked;
          this.forceUpdate();
        }}
      />{" "}
      Satellite uplink on (set in the End Phase): +2 Initiative for the side; this unit takes +1 on attacks and Piloting Skill Rolls and cannot spot, use a spotter or join a C3 network (Maximum Tech p.59)
      {this.state.setTargetDialog.isSatelliteUplinkActive() ? null : <strong> Off.</strong>}
    </label>
  ) : null}
  {this.state.setTargetDialog.getHandheldWeapon() ? (
    <div className="text-center full-width" data-testid="handheld-play">
      <div className="smaller-text">{this.state.setTargetDialog.getHandheldNote()}</div>
      <div>
        Handheld weapon: <strong>{this.state.setTargetDialog.getHandheldPlay().state}</strong>
        {this.state.setTargetDialog.getHandheldPlay().state === "carried" ? ` (${this.state.setTargetDialog.getHandheldPlay().armorLeft} armor left${this.state.setTargetDialog.isHandheldUsable() ? "" : ", not ready to fire"})` : ""}
        {this.state.setTargetDialog.handheldMustDrop() ? <strong> {this.state.setTargetDialog.handheldTsmForcesDrop() ? "Triple-Strength Myomer is below its activation heat (9) with the weapon over 10 percent of the tonnage: drop it (TO:AUE p.128)." : "A hand actuator is gone: drop it in the End Phase."}</strong> : null}
        {this.state.setTargetDialog.getHandheldPlay().droppedTargetModifier !== undefined ? ` Shooting at it: ${this.state.setTargetDialog.getHandheldPlay().droppedTargetModifier} to hit.` : ""}
      </div>
      <button className="btn btn-sm" data-testid="handheld-drop" disabled={this.state.setTargetDialog.getHandheldPlay().state !== "carried"} onClick={() => {
        this.state.setTargetDialog!.dropHandheld();
        this.forceUpdate();
      }}>Drop it</button>{" "}
      <button className="btn btn-sm" data-testid="handheld-pick-up" disabled={!this.state.setTargetDialog.canPickUpHandheld()} onClick={() => {
        this.state.setTargetDialog!.pickUpHandheld();
        this.forceUpdate();
      }}>Pick it up</button>
    </div>
  ) : null}
  {this.state.targetData ? (
    <div className="row">
      <div className="col-md">
      <fieldset className="fieldset">
        <legend>Target A</legend>
        <div className="row">
          <div className="col">
            <InputCheckbox
              label="Active"
              checked={this.state.targetData.a.active}
              description='Whether this target slot is active. Unchecking will keep it from being cycled in the Equipment button'
              onChange={(e) => this.updateTargetActive(e, "a")}
            />
            <InputField
              label="Label"
              description='Just a casual name for the target, or the make, something to help remind you which is A, B, or C'
              value={this.state.targetData.a.name}
              onChange={(e) => this.updateTargetName(e, "a")}
            />
            <InputCheckbox
              label="Primary"
              checked={this.state.targetData.a.primary}
              description="Secondary targets are +1 to hit, or +2 in rear arc"
              onChange={(e) => this.updatePrimary(e, "a")}
            />
            <InputCheckbox
              label="Rear Arc"
              checked={this.state.targetData.a.inRearArc}
              description="Secondary targets are +1 to hit, or +2 in rear arc"
              onChange={(e) => this.updateRearArc(e, "a")}
            />
            {quirksInPlay || this.state.setTargetDialog.getTargetingSystem()?.targetingSystem?.airborne ? (
              <InputCheckbox
                label="Airborne"
                checked={!!this.state.targetData.a.airborne}
                description="Airborne, not grounded: an aerospace unit, a VTOL or a 'Mech on a combat drop, but not a jumping 'Mech. For Anti-Aircraft Targeting (CO p.225; Maximum Tech p.59)."
                onChange={(e) => this.updateTargetFlag(e, "a", "airborne")}
              />
            ) : null}

          </div>
          <div className="col">

          <InputNumeric
          label="Movement Mod"
          description='Your opponent will tell you this'
          value={this.state.targetData.a.movement}
          onChange={(e) => this.updateTargetMovement(e, "a")}
          step={1}
          min={0}
          max={50}
          inline={true}
        />

        <InputNumeric
          label="Other Mods"
          description='Water, partial cover, etc. (enter woods and smoke below)'
          value={this.state.targetData.a.otherMods}
          onChange={(e) => this.updateTargetNumber(e, "a", "otherMods")}
          step={1}
          inline={true}
          min={-10}
          max={50}
        />
        {this.renderTargetConditions(this.state.setTargetDialog, "a")}
        <InputNumeric
          label="Range"
          description='The number of hexes between your target'
          value={this.state.targetData.a.range}
          onChange={(e) => this.updateTargetRange(e, "a")}
          step={1}
          inline={true}
          min={0}
          max={50}
        />
          </div>
        </div>

      </fieldset>
      <fieldset className="fieldset">
        <legend>Target B</legend>
        <div className="row">
          <div className="col">
            <InputCheckbox
              label="Active"
              description='Whether this target slot is active. Unchecking will keep it from being cycled in the Equipment button'
              checked={this.state.targetData.b.active}
              onChange={(e) => this.updateTargetActive(e, "b")}
            />
                        <InputField
              label="Label"
              description='Just a casual name for the target, or the make, something to help remind you which is A, B, or C'
              value={this.state.targetData.b.name}
              onChange={(e) => this.updateTargetName(e, "b")}
            />
            <InputCheckbox
              label="Primary"
              checked={this.state.targetData.b.primary}
              description="Secondary targets are +1 to hit, or +2 in rear arc"
              onChange={(e) => this.updatePrimary(e, "b")}
            />
            <InputCheckbox
              label="Rear Arc"
              checked={this.state.targetData.b.inRearArc}
              description="Secondary targets are +1 to hit, or +2 in rear arc"
              onChange={(e) => this.updateRearArc(e, "b")}
            />
            {quirksInPlay || this.state.setTargetDialog.getTargetingSystem()?.targetingSystem?.airborne ? (
              <InputCheckbox
                label="Airborne"
                checked={!!this.state.targetData.b.airborne}
                description="Airborne, not grounded: an aerospace unit, a VTOL or a 'Mech on a combat drop, but not a jumping 'Mech. For Anti-Aircraft Targeting (CO p.225; Maximum Tech p.59)."
                onChange={(e) => this.updateTargetFlag(e, "b", "airborne")}
              />
            ) : null}

          </div>
          <div className="col">

          <InputNumeric
          label="Movement Mod"
          description='Your opponent will tell you this'
          value={this.state.targetData.b.movement}
          onChange={(e) => this.updateTargetMovement(e, "b")}
          step={1}
          min={0}
          max={50}
          inline={true}
        />

        <InputNumeric
          label="Other Mods"
          description='Water, partial cover, etc. (enter woods and smoke below)'

          value={this.state.targetData.b.otherMods}
          onChange={(e) => this.updateTargetNumber(e, "b", "otherMods")}
          step={1}
          inline={true}
          min={-10}
          max={50}
        />
        {this.renderTargetConditions(this.state.setTargetDialog, "b")}
        <InputNumeric
          label="Range"
          description='The number of hexes between your target'
          value={this.state.targetData.b.range}
          onChange={(e) => this.updateTargetRange(e, "b")}
          step={1}
          inline={true}
          min={0}
          max={50}
        />
          </div>
        </div>

      </fieldset>
      <fieldset className="fieldset">
        <legend>Target C</legend>
        <div className="row">
          <div className="col">
            <InputCheckbox
              label="Active"
              description='Whether this target slot is active. Unchecking will keep it from being cycled in the Equipment button'
              checked={this.state.targetData.c.active}
              onChange={(e) => this.updateTargetActive(e, "c")}
            />

            <InputField
              label="Label"
              description='Just a casual name for the target, or the make, something to help remind you which is A, B, or C'
              value={this.state.targetData.c.name}
              onChange={(e) => this.updateTargetName(e, "c")}
            />
            <InputCheckbox
              label="Primary"
              checked={this.state.targetData.c.primary}
              description="Secondary targets are +1 to hit, or +2 in rear arc"
              onChange={(e) => this.updatePrimary(e, "c")}
            />
            <InputCheckbox
              label="Rear Arc"
              checked={this.state.targetData.c.inRearArc}
              description="Secondary targets are +1 to hit, or +2 in rear arc"
              onChange={(e) => this.updateRearArc(e, "c")}
            />
            {quirksInPlay || this.state.setTargetDialog.getTargetingSystem()?.targetingSystem?.airborne ? (
              <InputCheckbox
                label="Airborne"
                checked={!!this.state.targetData.c.airborne}
                description="Airborne, not grounded: an aerospace unit, a VTOL or a 'Mech on a combat drop, but not a jumping 'Mech. For Anti-Aircraft Targeting (CO p.225; Maximum Tech p.59)."
                onChange={(e) => this.updateTargetFlag(e, "c", "airborne")}
              />
            ) : null}
          </div>
          <div className="col">

          <InputNumeric
          label="Movement Mod"
          description='Your opponent will tell you this'
          value={this.state.targetData.c.movement}
          onChange={(e) => this.updateTargetMovement(e, "c")}
          step={1}
          min={0}
          max={50}
          inline={true}
        />

        <InputNumeric
          label="Other Mods"
          description='Water, partial cover, etc. (enter woods and smoke below)'

          value={this.state.targetData.c.otherMods}
          onChange={(e) => this.updateTargetNumber(e, "c", "otherMods")}
          step={1}
          inline={true}
          min={-10}
          max={50}
        />
        {this.renderTargetConditions(this.state.setTargetDialog, "c")}
        <InputNumeric
          label="Range"
          description='The number of hexes between your target'
          value={this.state.targetData.c.range}
          onChange={(e) => this.updateTargetRange(e, "c")}
          step={1}
          inline={true}
          min={0}
          max={50}
        />
          </div>
        </div>

      </fieldset>
      </div>
      <div className="col-md">
        <fieldset className="fieldset">
          <legend>Weapon Selection</legend>
          {targetCarrierLoad && targetCarrierLoad.riders.length > 0 ? (
            <div className="small-text" data-testid="mech-carrier-notes">
              {targetCarrierLoad.issues.map( (issue, issueIndex) => <p key={"issue" + issueIndex} className="color-red">{issue}</p> )}
              {targetCarrierLoad.notes.map( (note, noteIndex) => <p key={noteIndex}>{note}</p> )}
            </div>
          ) : null}
          <table className="table">
            <thead>
              <tr>
                  <th className="text-center" rowSpan={2}>Target</th>
                  <th className="text-center" rowSpan={2}>Weapon</th>
                  <th className="text-center" rowSpan={2}>Heat</th>
                  <th className="text-center" rowSpan={2}>Dmg</th>
                  <th className="text-center" colSpan={3}>Range</th>

                </tr>
              <tr>

                <th className="text-center">S</th>
                <th className="text-center">M</th>
                <th className="text-center">L</th>
              </tr>
            </thead>
            {this.state.targetWeaponSelection.map( (item, itemIndex) => {
                if( item.isEquipment || item.isAmmo ) {
                  return <React.Fragment key={itemIndex}></React.Fragment>
                } else {

                let itemDamage = "";
                if( typeof(item.damage) != "undefined")
                  itemDamage = item.damage.toString();
                if(item.damagePerCluster)
                  itemDamage = item.damagePerCluster.toString() + "/hit" ;
                if(item.damagePerShot)
                  itemDamage = item.damagePerShot.toString() + "/shot";

                const carrierBlocked = !!targetCarrierLoad && isCarrierWeaponBlocked( targetCarrierLoad, item );

                let targetGATOR: IGATOR | null = null;
                let targetData: ITargetToHit | null = null;
                if( item.target && this.state.targetData  ) {
                  if( item.target === "a" ) {
                    targetData = this.state.targetData.a;
                  } else if( item.target === "b" ) {
                    targetData = this.state.targetData.b;
                  } else if( item.target === "c" ) {
                    targetData = this.state.targetData.c;
                  }
                }

                if( this.state.setTargetDialog ) {
                  targetGATOR = getTargetToHitFromWeapon(
                    this.state.setTargetDialog,
                    itemIndex,
                    targetData,
                    this.state.targetWeaponSelection,
                    quirksInPlay,
                );
                }

                return (
                  <tbody key={itemIndex}>
                    <tr>
                      <td>
                        <select
                          value={carrierBlocked ? "" : item.target}
                          disabled={carrierBlocked}
                          onChange={(e) => this.updateSetEquipmentTarget( e, itemIndex)}
                        >
                          <option value="">-none-</option>
                          {this.state.targetData && this.state.targetData.a && this.state.targetData.a.active ? (
                            <option value="a">{this.state.targetData.a.name? this.state.targetData.a.name  + " (A)": "Target A"}</option>
                          ) : null}
                          {this.state.targetData && this.state.targetData.b && this.state.targetData.b.active ? (
                            <option value="b">{this.state.targetData.b.name ? this.state.targetData.b.name  + " (B)" : "Target B"}</option>
                          ) : null}
                          {this.state.targetData && this.state.targetData.c && this.state.targetData.c.active ? (
                            <option value="c">{this.state.targetData.c.name ? this.state.targetData.c.name + " (C)" : "Target C"}</option>
                          ) : null}
                        </select>
                        {carrierBlocked ? (
                          <span className="color-red" data-testid="mech-weapon-blocked">
                          Battle armor rides this location
                          </span>
                        ) : targetGATOR && targetGATOR.finalToHit > 0 ? (
                          <span>
                          To Hit: {targetGATOR.finalToHit}+
                          </span>
                        ) : <span>
                        To Hit: N/S
                        </span>}

                      </td>
                      <td>
                        {item.name}
                        {this.state.setTargetDialog && item.uuid && this.state.setTargetDialog.isFutureWarsSystemBurnedOut(item.uuid) ? (
                          <span className="color-red" data-testid="mech-weapon-burned-out"> (burned out: cannot fire)</span>
                        ) : this.state.setTargetDialog && item.uuid && this.state.setTargetDialog.isPowerBoosterOn(item.uuid) ? (
                          <span data-testid="mech-weapon-boosted"> (boosted: +{item.conversion?.booster?.extraHeat ?? 0} heat, {item.conversion?.booster?.extraDamagePerHit !== undefined ? `+${item.conversion.booster.extraDamagePerHit} damage a hit` : `+${item.conversion?.booster?.extraDamage ?? 0} damage`}, +{item.conversion?.booster?.addedRange ?? 0} range in each band, in the to-hit)</span>
                        ) : null}
                      </td>
                      <td className=" min-width no-wrap text-center">{item.heat}</td>
                      <td className=" min-width no-wrap text-center">{itemDamage}</td>
                      <td className=" min-width no-wrap text-center">{item.range.short}</td>
                      <td className=" min-width no-wrap text-center">{item.range.medium}</td>
                      <td className=" min-width no-wrap text-center">{item.range.long}</td>
                    </tr>
                    {targetGATOR && targetGATOR.explanation ? <tr>
                      <td colSpan={7} className="text-center small-text">
                        {targetGATOR.explanation}
                      </td>
                    </tr> : null}
                  </tbody>
                )
              }

            })}
          </table>
        </fieldset>
        <fieldset
          className="fieldset"
        >
          <legend>Heat Summary</legend>
          <table className="table text-center">
            <thead>
              <tr>
                <th>
                  Movement
                </th>
                <th>
                  Weapons
                </th>
                <th>
                  Heat Sinks
                </th>
                <th>
                  Difference
                </th>
              </tr>
            </thead>
            {this.state.setTargetDialog ? (
              <tbody>
                <tr>
                  <td>
                    {this.state.setTargetDialog.getActiveMoveHeat()}
                  </td>
                  <td>
                    {this.state.setTargetDialog.getActiveWeaponHeat(this.state.targetWeaponSelection, quirksInPlay)}
                  </td>
                  <td>
                    {this.state.setTargetDialog.getActiveHeatDissipation()}
                  </td>
                  <td>
                    {this.state.setTargetDialog.getTurnHeatDifference(this.state.targetWeaponSelection, quirksInPlay)} heat
                  </td>
                </tr>
              </tbody>
            ) : null}

          </table>
        </fieldset>
      </div>
    </div>
  ) : null}

</StandardModal>
) : null}

{this.state.criticalHitDialog ? (
  <StandardModal
  show={true}
  onClose={this.closeSetCriticalDialog}
  onSave={this.saveSetCriticalDialog}
  // onSave={this.saveDamage}
  title={"Critical Hits on " + this.state.criticalHitDialog.getName()}
  className="modal-xl"
>
    <div className="row">
      <div className="col">

        {this.state.criticalHitDialog.isArmless() ? null : <InPlayCriticalHitTable
          appGlobals={this.props.appGlobals}
          location={this.state.criticalHitDialog.isQuad() || this.state.criticalHitDialog.isQuadVee() ? "fll" : "la"}
          mechData={this.state.criticalHitDialog}
          critData={this.state.criticalHitDialog.isQuad() || this.state.criticalHitDialog.isQuadVee() ? this.state.criticalHitDialog.getCriticals().frontLeftLeg : this.state.criticalHitDialog.getCriticals().leftArm}
          numberCritSlots={getPlayCritSlotCount(this.state.criticalHitDialog, this.state.criticalHitDialog.isQuad() || this.state.criticalHitDialog.isQuadVee() ? "fll" : "la")}
          onChange={this.updateCriticalHitDialog}
        />}

        <InPlayCriticalHitTable
          appGlobals={this.props.appGlobals}
          location="lt"
          mechData={this.state.criticalHitDialog}
          critData={this.state.criticalHitDialog.getCriticals().leftTorso}
          numberCritSlots={getPlayCritSlotCount(this.state.criticalHitDialog, "lt")}
          onChange={this.updateCriticalHitDialog}
        />
        <InPlayCriticalHitTable
          appGlobals={this.props.appGlobals}
          location="ll"
          mechData={this.state.criticalHitDialog}
          critData={this.state.criticalHitDialog.getCriticals().leftLeg}
          numberCritSlots={getPlayCritSlotCount(this.state.criticalHitDialog, "ll")}
          onChange={this.updateCriticalHitDialog}
        />

      </div>
      <div className="col">

        <InPlayCriticalHitTable
          appGlobals={this.props.appGlobals}
          location="hd"
          mechData={this.state.criticalHitDialog}
          critData={this.state.criticalHitDialog.getCriticals().head}
          numberCritSlots={getPlayCritSlotCount(this.state.criticalHitDialog, "hd")}
          onChange={this.updateCriticalHitDialog}
        />
        <InPlayCriticalHitTable
          appGlobals={this.props.appGlobals}
          location="ct"
          mechData={this.state.criticalHitDialog}
          critData={this.state.criticalHitDialog.getCriticals().centerTorso}
          numberCritSlots={getPlayCritSlotCount(this.state.criticalHitDialog, "ct")}
          onChange={this.updateCriticalHitDialog}
        />
        {this.state.criticalHitDialog.isTripod() ? (
          <InPlayCriticalHitTable
            appGlobals={this.props.appGlobals}
            location="cl"
            mechData={this.state.criticalHitDialog}
            critData={this.state.criticalHitDialog.getCriticals().centerLeg}
            numberCritSlots={getPlayCritSlotCount(this.state.criticalHitDialog, "cl")}
            onChange={this.updateCriticalHitDialog}
          />
        ) : null}

        <fieldset className="fieldset">
          <div className="row">
            <div className="col text-right">
              Engine Hits
            </div>
            <div className="col text-left">

            </div>
          </div>
          <div className="row">
            <div className="col text-right">
              Gyro Hits
            </div>
            <div className="col text-left">

            </div>
          </div>
          <div className="row">
            <div className="col text-right">
              Sensor Hits
            </div>
            <div className="col text-left">

            </div>
          </div>
          <div className="row">
            <div className="col text-right">
              Life Support
            </div>
            <div className="col text-left">

            </div>
          </div>
        </fieldset>
        {this.state.criticalHitDialog.isIndustrialMech() ? (
          <InPlayIndustrialDamageCheck
            mechData={this.state.criticalHitDialog}
            onChange={this.updateCriticalHitDialog}
          />
        ) : null}
      </div>
      <div className="col">

      {this.state.criticalHitDialog.isArmless() ? null : <InPlayCriticalHitTable
          appGlobals={this.props.appGlobals}
          location={this.state.criticalHitDialog.isQuad() || this.state.criticalHitDialog.isQuadVee() ? "frl" : "ra"}
          mechData={this.state.criticalHitDialog}
          critData={this.state.criticalHitDialog.isQuad() || this.state.criticalHitDialog.isQuadVee() ? this.state.criticalHitDialog.getCriticals().frontRightLeg : this.state.criticalHitDialog.getCriticals().rightArm}
          numberCritSlots={getPlayCritSlotCount(this.state.criticalHitDialog, this.state.criticalHitDialog.isQuad() || this.state.criticalHitDialog.isQuadVee() ? "frl" : "ra")}
          onChange={this.updateCriticalHitDialog}
        />}

        <InPlayCriticalHitTable
          appGlobals={this.props.appGlobals}
          location="rt"
          mechData={this.state.criticalHitDialog}
          critData={this.state.criticalHitDialog.getCriticals().rightTorso}
          numberCritSlots={getPlayCritSlotCount(this.state.criticalHitDialog, "rt")}
          onChange={this.updateCriticalHitDialog}
        />
        <InPlayCriticalHitTable
          appGlobals={this.props.appGlobals}
          location="rl"
          mechData={this.state.criticalHitDialog}
          critData={this.state.criticalHitDialog.getCriticals().rightLeg}
          numberCritSlots={getPlayCritSlotCount(this.state.criticalHitDialog, "rl")}
          onChange={this.updateCriticalHitDialog}
        />
      </div>
    </div>
  </StandardModal>
) : null}


{this.state.takeDamageDialog ? (
<StandardModal
  show={true}
  onClose={this.closeTakeDamage}
  onSave={this.saveDamage}
  title={"Taking Damage on " + this.state.takeDamageDialog.getName()}
  className="modal-xl"
>
  <div className="alert alert-sm alert-warning text-center">
    This <strong>almost</strong> works as intended. I still need to add the Critical notifications to the Damage Log (and opening up the critical modal for applying damage)
  </div>

    <div className="row">
      <div className="col-md-3 smaller-padding">
    <fieldset className="fieldset ">
        <legend>How Much Damage?</legend>
        {this.state.takeDamageDialog.getEnergyDamageHalvings(this.state.takeDamageLocation || undefined) > 0 ? (
          <label className="small-text" data-testid="take-damage-energy">
            <input
              type="checkbox"
              checked={this.state.takeDamageEnergy}
              onChange={(e) => this.setState({ takeDamageEnergy: e.currentTarget.checked })}
            />{" "}
            Energy weapon (halved{this.state.takeDamageDialog.getEnergyDamageHalvings(this.state.takeDamageLocation || undefined) > 1 ? " twice" : ""}, rounded down
            {this.state.takeDamageEnergy && this.state.takeDamageAmount > 0
              ? `: ${this.state.takeDamageDialog.getIncomingDamageApplied(this.state.takeDamageAmount, true, this.state.takeDamageLocation)} applied` : ""})
          </label>
        ) : null}
        {this.state.takeDamageLocation && this.state.takeDamageDialog.handheldRollApplies(this.state.takeDamageLocation, this.state.takeDamageLocationRear) ? (
          <div className="small-text" data-testid="take-damage-handheld">
            Handheld weapon: roll 1D6 for this hit (strikes the weapon on {this.state.takeDamageDialog.getHandheldHitNumbers(this.state.takeDamageLocation)}):{" "}
            {[1, 2, 3, 4, 5, 6].map((face) => (
              <button
                key={face}
                className={this.state.takeDamageHandheldRoll === face ? "btn btn-xs btn-primary" : "btn btn-xs btn-secondary"}
                onClick={(e) => { e.preventDefault(); this.setState({ takeDamageHandheldRoll: this.state.takeDamageHandheldRoll === face ? 0 : face }); }}
              >{face}</button>
            ))}
          </div>
        ) : null}
        <br />
        {chunkRange( makeRange(1, 50) , 5).map( (section, sectionIndex) => {

          return (
            <React.Fragment key={sectionIndex}>
              {section.map( (number, numberIndex) => {

                let numberText = <>{number.toString()}</>;
                if( number < 10 ) {
                  numberText = <>&nbsp;{number.toString()}</>;
                }
                return (
                  <React.Fragment key={numberIndex}>
                    <button
                      className={this.state.takeDamageAmount === number ? "btn btn-xs btn-primary" : "btn btn-xs btn-secondary"}
                      onClick={(e) => this.takeDamageAmount(e, number)}
                    >
                      {numberText}
                    </button>

                  </React.Fragment>
                )
              })}
              <br />
              {(sectionIndex + 1) % 2 === 0 ? (
                <br />
              ) : null}
            </React.Fragment>
          )

        })}

    </fieldset>
    </div>
    <div className="col-md-6 smaller-padding">
    <fieldset className="fieldset ">
      <legend>Where did it hurt?</legend>
      {this.renderMissileDefense()}
      <ToHitTable
        forQuad={this.state.takeDamageDialog.isQuad()}
        showRear={true}
        onClick={this.takeDamageLocationClick}
        currentSide={this.state.takeDamageLocationSide}
        currentRoll={this.state.takeDamageLocationRoll}
        currentRear={this.state.takeDamageLocationRear}
      />
    </fieldset>
    </div>
    <div className="col-md-3 smaller-padding">
    <fieldset className="fieldset grow ">
      <legend>Damage Log</legend>
      <br />
      <button
        className={this.state.takeDamageAmount > 0 && this.state.takeDamageLocation !== ""? "btn btn-danger full-width" : "btn btn-warning full-width" }
        disabled={this.state.takeDamageAmount < 1 || this.state.takeDamageLocation === ""}
        onClick={this.takeDamage}
      >
        {this.state.takeDamageAmount < 0 && this.state.takeDamageLocation === "" ? (
          <>
            Select How Much/Where
              <div className=" text-center  small-text">
                Select a damage amount and location
            </div>
          </>
        ) : (
          <>
            {this.state.takeDamageAmount < 0 ? (
              <>
                Select How Much
                <div className=" text-center  small-text">
                  Select a the damage amount
                </div>
              </>
            ) : (
              <>
              {this.state.takeDamageLocation === "" ? (
                <>
                  Select Where
                  <div className=" text-center  small-text">
                    Select the damage location
                  </div>
                </>
              ) : (
                <>
                  Take Damage
                  <div className=" text-center small-text">
                    Click to assign the damage to this mech.
                  </div>
                </>
              )}
            </>
            )}
          </>
        )}

      </button>

      <br />

      This is your damage log for this phase
      <ul>

        {this.state.takeDamageDialog.damageLog.map( (line, lineIndex) => {
          return (
            <li key={lineIndex}>
              {line.amount}{line.entered !== undefined ? ` (${line.entered} entered, energy halved)` : ""} on {getLocationName( line.location, this.state.takeDamageDialog ? this.state.takeDamageDialog.isQuad() : false) }
              {line.damageResults?.flatMap( result => result.criticalEffects ).map( (effect, effectIndex) => <div key={effectIndex} className="small-text">{effect}</div> )}
            </li>
          )
        })}
      </ul>

    </fieldset>
    </div>
    </div>

</StandardModal>
  ) : null}
          <header className="topmenu">
            <ul className="main-menu">
                <li><Link title="Click here to leave Play Mode (don't worry, you won't lose your current mech statuses)" className="current" to={`${process.env.PUBLIC_URL}/classic-battletech/roster`}><ArrowCircleLeft /></Link></li>

                <li className="logo">
                    <a
                        href={CONST_BATTLETECH_URL}
                        rel="noopener noreferrer"
                        target="_blank"
                        title="Click here to go to the official BattleTech website!"
                    >
                        <BattleTechLogo />
                    </a>
                </li>
            </ul>

          </header>
<div className="page-container">
<div className="record-sheet-column">
<div
  className="alert alert-danger"
>
 Although improving, this area <strong>DOES NOT WORK!</strong> However, much progress has been made on Target, per weapon GATOR, and movement.
  <br />Next up: Taking Damage, After that, turn progress (or vice/versa)
</div>
<div>
<TextSection

>
  <div className="turn-counter">
      <div>
        <button
          className={this.props.appGlobals.currentCBTForce.hideHelp ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm"}
          onClick={this.toggleHelp}
          title="Click here to toggle the help text below"
        >
          {this.props.appGlobals.currentCBTForce.hideHelp ?
          <QuestionCircle /> : <QuestionCircle /> }
        </button>
      </div>
      <div>
        <InputNumeric
          step={1}
          min={1}
          max={100}
          value={this.props.appGlobals.currentCBTForce.turn}
          inline={true}
          title="Turn #"
          label="Turn #"
          onChange={this.setTurn}
        />
      </div>
      {quirksInPlay && sideInitiative ? (
        <div data-testid="quirk-initiative">
          Initiative: {sideInitiative.modifier > 0 ? "+" : ""}{sideInitiative.modifier} ({sideInitiative.title})
        </div>
      ) : null}
      {sideBonuses.initiative > 0 ? (
        <div data-testid="side-initiative" title={sideBonuses.initiativeLog.join("; ")}>
          Side Initiative: +{sideBonuses.initiative} ({sideBonuses.initiativeLog.join("; ")})
        </div>
      ) : null}
      <div>
        <button
          className={this.props.appGlobals.currentCBTForce.phase === 0 ? "btn btn-phase-active btn-sm" : "btn btn-secondary btn-sm"}
          onClick={(e) => this.setPhase(e, 0)}
          title={this.props.appGlobals.currentCBTForce.getPhaseName(0)}
        >
          <Dice />
        </button>
      </div>
      <div>
        <button
          className={this.props.appGlobals.currentCBTForce.phase === 1 ? "btn btn-phase-active btn-sm" : "btn btn-secondary btn-sm"}
          onClick={(e) => this.setPhase(e, 1)}
          title={this.props.appGlobals.currentCBTForce.getPhaseName(1)}
        >
          <ShoePrints />
        </button>
      </div>
      <div>
        <button
          className={this.props.appGlobals.currentCBTForce.phase === 2 ? "btn btn-phase-active btn-sm" : "btn btn-secondary btn-sm"}
          onClick={(e) => this.setPhase(e, 2)}
          title={this.props.appGlobals.currentCBTForce.getPhaseName(2)}

        >
          <GiMissileSwarm />
        </button>
      </div>
      <div>
        <button
          className={this.props.appGlobals.currentCBTForce.phase === 3 ? "btn btn-phase-active btn-sm" : "btn btn-secondary btn-sm"}
          onClick={(e) => this.setPhase(e, 3)}
          title={this.props.appGlobals.currentCBTForce.getPhaseName(3)}
        >
          <BattleAxeIcon />
        </button>
      </div>
      <div>
        <button
          className={this.props.appGlobals.currentCBTForce.phase === 4 ? "btn btn-phase-active btn-sm" : "btn btn-secondary btn-sm"}
          onClick={(e) => this.setPhase(e, 4)}
          title={this.props.appGlobals.currentCBTForce.getPhaseName(4)}
        >
          <GiHotSurface />
        </button>
      </div>
      <div>
        <button
          className={this.props.appGlobals.currentCBTForce.phase === 5 ? "btn btn-phase-active btn-sm" : "btn btn-secondary btn-sm"}
          onClick={(e) => this.setPhase(e, 5)}
          title={this.props.appGlobals.currentCBTForce.getPhaseName(5)}
        >
          <Gift />
        </button>
      </div>
      <div className="grow-2">
        <h5>{this.props.appGlobals.currentCBTForce.getPhaseName(this.props.appGlobals.currentCBTForce.phase)}</h5>
      </div>

      {this.props.appGlobals.currentCBTForce.phase === 4 ? (
        <div className="grow-1">
          <button
            className="btn btn-sm btn-primary"
            onClick={this.applyHeat}
            disabled={this.props.appGlobals.currentCBTForce.heatApplied}
          >
            {this.props.appGlobals.currentCBTForce.heatApplied ?  "Heat Applied" : "Apply Heat"}
          </button>
        </div>
      ) : null}
      {this.props.appGlobals.currentCBTForce.phase === 5 ? (
        <div className="grow-1">
          <button
            className="btn btn-sm btn-primary"
            onClick={this.nextTurn}
          >
            Next Turn
          </button>
        </div>
      ) : null}
      {this.props.appGlobals.currentCBTForce.phase === 2 ? (
        <div className="grow-1">
          <button
            className="btn btn-sm btn-primary"
            onClick={this.openResolveFireDialog}
          >
            Resolve Fire
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => this.openTakeDamageDialog( this._getCurrentBM() )}
            disabled={this._getCurrentBM() === null}
          >
            Take Damage
          </button>
        </div>
      ) : null}
</div>
{!this.props.appGlobals.currentCBTForce.hideHelp ? (
  <div className="text-center">
    <hr />
  {this.props.appGlobals.currentCBTForce.phase === 0 ? (
        <div>
            One player from each side rolls 2D6 and adds the results
  together to determine their side’s Initiative. The side with the higher
  result wins Initiative for that turn. Re-roll all ties.
        </div>
      ) : null}
      {this.props.appGlobals.currentCBTForce.phase === 1 ? (
        <div>
          Move your mechs as per standard rules. Click on the Blue Movement section below Weapons and Equipent for each moving 'mech. Set the Movement mode, and the to-hit modifier for each unit.
        </div>
      ) : null}
      {this.props.appGlobals.currentCBTForce.phase === 2 ? (
        <div>
          Declare all of your Weapon Attacks by setting a Target and then cycling through each weapon to be an "A", "B", or "C" a blank circle means the weapon will not be fired. Once all declarations are done, click on the "Resolve Fire" button above. A list of 'mech weapons, attacks, targets, damage, and to-hit roll needed will pop up.
        </div>
      ) : null}
      {this.props.appGlobals.currentCBTForce.phase === 3 ? (
        <div>
          Make physical attacks as per the rule book.
          {selectedMech && selectedMech.getPhysicalAttackNote() ? (
            <div className="small-text" data-testid="airmech-physical-note">{selectedMech.getPhysicalAttackNote()}</div>
          ) : null}
        </div>
      ) : null}
      {this.props.appGlobals.currentCBTForce.phase === 4 ? (
        <div>
          Click on the "Apply Heat" button above to add heat from movement, damage, etc and then subtract heat via heat sinks.
        </div>
      ) : null}
      {this.props.appGlobals.currentCBTForce.phase === 5 ? (
        <div>
          This turn's a wrap! Click on "Next Turn" above and we'll clear out the Movement for all 'mechs, increment the turn counter, and start a new turn.
        </div>
      ) : null}
  </div>
) : null}

</TextSection>

<div className="selected-mech">
          {quirkCarrier ? (
            <QuirksInPlay effects={getCarrierQuirkEffects(quirkCarrier)} quirksInPlay={quirksInPlay} />
          ) : null}
          {(selectedMech || selectedVehicle || selectedFighter) && (selectedMech ?? selectedVehicle ?? selectedFighter)!.getRateOfFireWeapons().length > 0 ? (
            <AutocannonPlayPanel key={"ac" + (selectedMech ?? selectedVehicle ?? selectedFighter)!.getUUID()} unit={(selectedMech ?? selectedVehicle ?? selectedFighter)!} onChange={this.onEwarChange} />
          ) : null}
          {ewarCarrier ? <EWarNotes key={ewarCarrier.getUUID()} unit={ewarCarrier} onChange={this.onEwarChange} targetCalculator={ewarCarrier !== selectedMech} attackerInfantry={ewarCarrier === selectedInfantry} force={this.props.appGlobals.currentCBTForce} aero={ewarCarrier && ewarCarrier === selectedFighter ? "fighter" : ewarCarrier && ewarCarrier === selectedSmallCraft ? "small-craft" : ewarCarrier && ewarCarrier === selectedCapitalShip ? "large-craft" : undefined} /> : null}
          {selectedBattledroidsUnit ? (
            <BattledroidsPlayPanel
              key={selectedBattledroidsUnit.getUUID()}
              unit={selectedBattledroidsUnit}
              onChange={this.onVehicleChange}
            />
          ) : selectedBuilding ? (
            <BuildingPlayPanel
              key={selectedBuilding.getUUID()}
              building={selectedBuilding}
              onChange={this.onVehicleChange}
            />
          ) : selectedInfantry ? (
            <InfantryPlayPanel
              key={selectedInfantry.getUUID()}
              platoon={selectedInfantry}
              turn={this.props.appGlobals.currentCBTForce.turn}
              showStun={classicForceUsesSonic(this.props.appGlobals.currentCBTForce.groups)}
              onChange={this.onVehicleChange}
            />
          ) : selectedBattleArmor ? (
            <BattleArmorPlayPanel
              key={selectedBattleArmor.getUUID()}
              squad={selectedBattleArmor}
              carriers={[
                // A FrankenMech cannot carry mechanized battle armor (CO p. 213).
                ...this.props.appGlobals.currentCBTForce.groups.flatMap( (group) => group.members ).filter( (unit) => !unit.isFrankenMech() ).map( (unit) => ({ uuid: unit.uuid, name: unit.getName(), kind: "mech" as const, omni: unit.isOmnimech }) ),
                ...this.props.appGlobals.currentCBTForce.groups.flatMap( (group) => group.vehicles ).map( (vehicle) => ({ uuid: vehicle.getUUID(), name: vehicleName(vehicle), kind: "vehicle" as const, omni: vehicle.isOmni() as boolean | null }) ),
              ].map( (carrier) => ({
                ...carrier,
                // A carrier takes one battle armor unit at a time (TW p. 226).
                carrying: this._carrierLoad( carrier.uuid, carrier.name, carrier.kind, carrier.omni ).riders.filter( (squad) => squad.getUUID() !== selectedBattleArmor.getUUID() ).map( (squad) => squad.getDisplayName() ).join(", "),
              }) )}
              onChange={this.onVehicleChange}
            />
          ) : selectedProtoMech ? (
            <ProtoMechPlayPanel
              key={selectedProtoMech.getUUID()}
              point={selectedProtoMech}
              onChange={this.onVehicleChange}
            />
          ) : selectedMicroMech ? (
            <MicroMechPlayPanel
              key={selectedMicroMech.getUUID()}
              micro={selectedMicroMech}
              onChange={this.onVehicleChange}
            />
          ) : selectedWalker ? (
            <WalkerPlayPanel
              key={selectedWalker.getUUID()}
              walker={selectedWalker}
              onChange={this.onVehicleChange}
            />
          ) : selectedFighter ? (
            <FighterPlayPanel
              key={selectedFighter.getUUID()}
              fighter={selectedFighter}
              onChange={this.onVehicleChange}
            />
          ) : selectedSmallCraft ? (
            <SmallCraftPlayPanel
              key={selectedSmallCraft.getUUID()}
              craft={selectedSmallCraft}
              onChange={this.onVehicleChange}
            />
          ) : selectedCapitalShip ? (
            <CapitalShipPlayPanel
              key={selectedCapitalShip.getUUID()}
              ship={selectedCapitalShip}
              onChange={this.onVehicleChange}
            />
          ) : selectedVehicle ? (
            <VehiclePlayPanel
              vehicle={selectedVehicle}
              carrierLoad={this._carrierLoad( selectedVehicle.getUUID(), vehicleName(selectedVehicle), "vehicle", selectedVehicle.isOmni() )}
              onChange={this.onVehicleChange}
              quirksInPlay={quirksInPlay}
            />
          ) : selectedMech ? (
            <>
              {selectedMech.getRulesEdition() === "battledroids" ? (
                <>
                  <BattledroidsDroidHelper key={selectedMech.uuid} mechData={selectedMech} />
                  <BattledroidsRulesReference />
                </>
              ) : null}
              <button
                className="btn btn-primary btn-sm full-width"
                onClick={this.openZoomSheet}
              >
                <GiMagnifyingGlass /> Zoom
              </button>
              <BattleMechSVG
                mechData={selectedMech}
                inPlay={true}
                quirksInPlay={quirksInPlay}
                bgColor={selectedMech.isWrecked() ? "#666" : ""}
                openSetCriticalDialog={() => this.openSetCriticalDialog(selectedMech)}
                openSetTargetDialog={() => this.openSetTargetDialog(selectedMech)}
                openTakeDamageDialog={() => this.openTakeDamageDialog(selectedMech)}
                openSetMovementDialog={() => this.openSetMovementDialog(selectedMech)}
                onChange={this.onChange}
                viewGATOR={this.viewGATOR}
                currentPhase={this.props.appGlobals.currentCBTForce.phase}
              />
              {showFutureWarsPlay(selectedMech) ? (
                <FutureWarsPlayPanel
                  key={"fw" + selectedMech.uuid}
                  mech={selectedMech}
                  onChange={() => this.onFutureWarsChange()}
                />
              ) : null}
              {showFutureWarsRulesetTools(selectedMech) ? (
                <FutureWarsRulesetTools
                  key={"fwr" + selectedMech.uuid}
                  mech={selectedMech}
                  onChange={() => this.onFutureWarsChange()}
                />
              ) : null}
            </>
          ) : (
            <div className="text-center">
              <TextSection>
                (No Selected 'Mech)
              </TextSection>
            </div>
          )}
            </div>
</div>

</div>
<div className="sidebar">

  <div className={this.state.mechSelectorExpanded ? "mech-selector" : "mech-selector expanded"}>
          {this.props.appGlobals.currentCBTForce.groups.map( (group, groupIndex) => {
            if( group.getTotalUnits() === 0) {
              return (<React.Fragment key={groupIndex}></React.Fragment>);
            }
            return (
              <React.Fragment key={groupIndex}>
              <div>
                  <div className="lance-name overflow-hidden">
                    {group.getName(groupIndex)}
                    {group.isUnderStrength() ? (
                      <button
                        className="pull-right btn-primary btn-xs"
                        title={"Click here to reset the damage for this " + group.groupLabel + ". You'll be prompted for confirmation."}
                        onClick={(e) => this.resetGroup( e, group )}
                      >
                        <RefreshCcw />
                      </button>
                    ) : null}
                  </div>
                  <ul className="mech-list">
                  {group.members.map( (unit, unitIndex) => {
                    let dieBG = "#009";
                    let dieFG = "white";
                    const diePips = unit.currentToHitMovementModifier;

                    if( unit.currentMovementMode === "n" ) {
                      dieBG = CONST_HIGHLIGHT_COLOR;
                      dieFG = "white";
                    }

                    if( unit.currentMovementMode === "w" ) {
                      dieBG = "white";
                      dieFG = "black";
                    }
                    if( unit.currentMovementMode === "r" ) {
                      dieBG = "black";
                      dieFG = "white";
                    }
                    if( unit.currentMovementMode === "j" ) {
                      dieBG = "red";
                      dieFG = "white";
                    }
                    if( unit.currentMovementMode === "c" || unit.currentMovementMode === "f" ) {
                      dieBG = unit.currentMovementMode === "c" ? "#38c" : "#036";
                      dieFG = "white";
                    }

                    return (
                        <li key={unitIndex}>
                          <button
                            onClick={(e) => this.selectMech(e, unit.uuid)}
                            className={selectedMech && selectedMech.uuid === unit.uuid ? "btn btn-sm btn-primary full-width" : "btn btn-sm btn-secondary full-width"}
                            title={"Select " + unit.getName()}
                          >
                            {unit.getName()}

                            <div className="stats">
                              <div
                                className="move"
                                title="This is the mech's movement status, the color indicates the last movement method, the number is the to-hit movement modifiers as a target NOT including the +1 jump modifier if the 'mech jumped. This parallels the die indicator one would place next to the 'mech during the game as per Total Warfare p51 and/or the BattleTech Manual page 13"
                              >
{unit.isWrecked() ? (
<>
</>
) : (
  <svg
  height={20}
  width={20}

>

  <DieSVG
    posX={0}
    posY={0}
    width={20}
    bgColor={dieBG}
    pipColor={dieFG}
    numberPips={diePips}
    // numericPips={true}
  />
</svg>
)}

                              </div>
{unit.isWrecked() ? (
<h3 className="color-red text-center">
    WRECKED
</h3>
) : (
                              <div className="bars">
                                <StatBar
                                  color="blue"
                                  background="#aaa"
                                  currentPercentage={unit.getArmorPercentage()}
                                  currentNumber={unit.getCurrentArmor()}
                                  height={8}
                                  title="Current Armor Status"
                                />
                                <StatBar
                                  color="white"
                                  background="#aaa"
                                  currentPercentage={unit.getStructurePercentage()}
                                  currentNumber={unit.getCurrentStructure()}
                                  height={8}
                                  title="Current Internal Structure Status"
                                />
                                <StatBar
                                  color="red"
                                  background="#aaa"
                                  currentPercentage={unit.getHeatPercentage()}
                                  currentNumber={unit.currentHeat}
                                  height={8}
                                  title={"Current Heat Status: " + unit.currentHeat}
                                />
                              </div>
)}
                            </div>

                          </button>
                          {unit.isWrecked() === false ? (
                          <div className="flex">
                            <div className="grow">
                            <button
                              className={this.props.appGlobals.currentCBTForce?.phase === 1 ? unit.currentMovementMode === "n" ? "btn btn-sm btn-phase-active full-width no-bottom-margin" : "btn btn-sm btn-primary full-width" : "btn btn-sm btn-secondary full-width no-bottom-margin"}
                              onClick={() => this.openSetMovementDialog(unit)}
                              title={"Open the Movement Dialog for " + unit.getName()}
                            >
                              <ShoePrints />
                            </button>
                            </div>
                            <div className="grow">
                              <button
                                className={this.props.appGlobals.currentCBTForce?.phase === 2 ? "btn btn-sm btn-phase-active full-width no-bottom-margin" : "btn btn-sm btn-secondary full-width no-bottom-margin"}
                                onClick={() => this.openSetTargetDialog(unit)}
                                title={"Open the Target Dialog for " + unit.getName()}
                              >
                                <GiCrosshairArrow />
                              </button>
                            </div>
                          </div>
                          ) : null}
                          <hr />
                        </li>
                    )
                  })}
                  {group.infantry.map( (platoon) => (
                    <li key={platoon.getUUID()}>
                      <button
                        onClick={(e) => this.selectVehicle(e, platoon.getUUID())}
                        className={selectedInfantry && selectedInfantry.getUUID() === platoon.getUUID() ? "btn btn-sm btn-primary full-width" : "btn btn-sm btn-secondary full-width"}
                        title={"Select " + platoon.getDisplayName()}
                      >
                        {platoon.getDisplayName()}
                        <div className="stats">
{platoon.isDestroyed() ? (
<h3 className="color-red text-center">
    DESTROYED
</h3>
) : (
                          <div className="bars">
                            <StatBar
                              color="white"
                              background="#aaa"
                              currentPercentage={platoon.getStrengthPercentage()}
                              currentNumber={platoon.getCurrentTroopers()}
                              height={8}
                              title="Troopers Remaining"
                            />
                          </div>
)}
                        </div>
                      </button>
                      <hr />
                    </li>
                  ))}
                  {group.battleArmor.map( (squad) => (
                    <li key={squad.getUUID()}>
                      <button
                        onClick={(e) => this.selectVehicle(e, squad.getUUID())}
                        className={selectedBattleArmor && selectedBattleArmor.getUUID() === squad.getUUID() ? "btn btn-sm btn-primary full-width" : "btn btn-sm btn-secondary full-width"}
                        title={"Select " + squad.getDisplayName()}
                      >
                        {squad.getDisplayName()}
                        <div className="stats">
                          {squad.isDestroyed() ? (
                            <h3 className="color-red text-center">
                              DESTROYED
                            </h3>
                          ) : (
                            <div className="bars">
                              <StatBar
                                color="white"
                                background="#aaa"
                                currentPercentage={squad.getStrengthPercentage()}
                                currentNumber={squad.getActiveTroopers()}
                                height={8}
                                title="Troopers Active"
                              />
                            </div>
                          )}
                        </div>
                      </button>
                      <hr />
                    </li>
                  ))}
                  {group.protoMechs.map( (point) => (
                    <li key={point.getUUID()}>
                      <button
                        onClick={(e) => this.selectVehicle(e, point.getUUID())}
                        className={selectedProtoMech && selectedProtoMech.getUUID() === point.getUUID() ? "btn btn-sm btn-primary full-width" : "btn btn-sm btn-secondary full-width"}
                        title={"Select " + point.getDisplayName()}
                      >
                        {point.getDisplayName()}
                        <div className="stats">
                          {point.isDestroyed() ? (
                            <h3 className="color-red text-center">
                              DESTROYED
                            </h3>
                          ) : (
                            <div className="bars">
                              <StatBar
                                color="white"
                                background="#aaa"
                                currentPercentage={Math.round(point.getActiveUnits() / point.getPointSize() * 100)}
                                currentNumber={point.getActiveUnits()}
                                height={8}
                                title="ProtoMechs Active"
                              />
                            </div>
                          )}
                        </div>
                      </button>
                      <hr />
                    </li>
                  ))}
                  {group.microMechs.map( (micro) => (
                    <li key={micro.getUUID()}>
                      <button
                        onClick={(e) => this.selectVehicle(e, micro.getUUID())}
                        className={selectedMicroMech && selectedMicroMech.getUUID() === micro.getUUID() ? "btn btn-sm btn-primary full-width" : "btn btn-sm btn-secondary full-width"}
                        title={"Select " + micro.getDisplayName()}
                      >
                        {micro.getDisplayName()}
                        <div className="stats">
                          {micro.isDestroyed() ? (
                            <h3 className="color-red text-center">
                              DESTROYED
                            </h3>
                          ) : (
                            <div className="bars">
                              <StatBar
                                color="white"
                                background="#aaa"
                                currentPercentage={Math.round(micro.getLocations().reduce((sum, location) => sum + micro.getArmorLeft(location), 0) / Math.max(1, micro.getArmorPoints()) * 100)}
                                currentNumber={micro.getLocations().reduce((sum, location) => sum + micro.getArmorLeft(location), 0)}
                                height={8}
                                title="Armor Left"
                              />
                            </div>
                          )}
                        </div>
                      </button>
                      <hr />
                    </li>
                  ))}
                  {group.walkers.map( (walker) => {
                    const armorLeft = WALKER_LOCATIONS.reduce((sum, location) => sum + walker.getArmorLeft(location), 0);
                    return (
                      <li key={walker.getUUID()}>
                        <button
                          onClick={(e) => this.selectVehicle(e, walker.getUUID())}
                          className={selectedWalker && selectedWalker.getUUID() === walker.getUUID() ? "btn btn-sm btn-primary full-width" : "btn btn-sm btn-secondary full-width"}
                          title={"Select " + walker.getDisplayName()}
                        >
                          {walker.getDisplayName()}
                          <div className="stats">
                            {walker.isDestroyed() ? (
                              <h3 className="color-red text-center">
                                DESTROYED
                              </h3>
                            ) : (
                              <div className="bars">
                                <StatBar
                                  color="white"
                                  background="#aaa"
                                  currentPercentage={Math.round(armorLeft / Math.max(1, walker.getArmorPoints()) * 100)}
                                  currentNumber={armorLeft}
                                  height={8}
                                  title="Armor Left"
                                />
                              </div>
                            )}
                          </div>
                        </button>
                        <hr />
                      </li>
                    );
                  })}
                  {group.battledroidsUnits.map( (unit) => (
                    <li key={unit.getUUID()}>
                      <button
                        onClick={(e) => this.selectVehicle(e, unit.getUUID())}
                        className={selectedBattledroidsUnit && selectedBattledroidsUnit.getUUID() === unit.getUUID() ? "btn btn-sm btn-primary full-width" : "btn btn-sm btn-secondary full-width"}
                        title={"Select " + unit.getDisplayName()}
                      >
                        {unit.getDisplayName()}
                        <div className="stats">
{unit.isDestroyed() ? (
<h3 className="color-red text-center">
    DESTROYED
</h3>
) : (
                          <div className="bars">
                            <StatBar
                              color="white"
                              background="#aaa"
                              currentPercentage={unit.getStrengthPercentage()}
                              currentNumber={unit.getStrengthPercentage()}
                              height={8}
                              title="Strength Remaining"
                            />
                          </div>
)}
                        </div>
                      </button>
                      <hr />
                    </li>
                  ))}
                  {group.buildings.map( (building) => (
                    <li key={building.getUUID()}>
                      <button
                        onClick={(e) => this.selectVehicle(e, building.getUUID())}
                        className={selectedBuilding && selectedBuilding.getUUID() === building.getUUID() ? "btn btn-sm btn-primary full-width" : "btn btn-sm btn-secondary full-width"}
                        title={"Select " + building.getDisplayName()}
                      >
                        {building.getDisplayName()}
                        <div className="stats">
{building.isDestroyed() ? (
<h3 className="color-red text-center">
    DESTROYED
</h3>
) : (
                          <div className="bars">
                            <StatBar
                              color="white"
                              background="#aaa"
                              currentPercentage={building.getStrengthPercentage()}
                              currentNumber={building.getCurrentPoints()}
                              height={8}
                              title="Armor and Construction Factor Remaining"
                            />
                          </div>
)}
                        </div>
                      </button>
                      <hr />
                    </li>
                  ))}
                  {group.fighters.map( (fighter) => (
                    <li key={fighter.getUUID()}>
                      <button
                        onClick={(e) => this.selectVehicle(e, fighter.getUUID())}
                        className={selectedFighter && selectedFighter.getUUID() === fighter.getUUID() ? "btn btn-sm btn-primary full-width" : "btn btn-sm btn-secondary full-width"}
                        title={"Select " + fighterName(fighter)}
                      >
                        {fighterName(fighter)}
                        <div className="stats">
{fighter.isDestroyed() ? (
<h3 className="color-red text-center">
    DESTROYED
</h3>
) : (
                          <div className="bars">
                            <StatBar
                              color="blue"
                              background="#aaa"
                              currentPercentage={fighter.getArmorPercentage()}
                              currentNumber={fighter.getCurrentArmor()}
                              height={8}
                              title="Current Armor Status"
                            />
                            <StatBar
                              color="white"
                              background="#aaa"
                              currentPercentage={fighter.getStructurePercentage()}
                              currentNumber={fighter.getCurrentStructure()}
                              height={8}
                              title="Current Structural Integrity"
                            />
                          </div>
)}
                        </div>
                      </button>
                      <hr />
                    </li>
                  ))}
                  {group.smallCraft.map( (craft) => (
                    <li key={craft.getUUID()}>
                      <button
                        onClick={(e) => this.selectVehicle(e, craft.getUUID())}
                        className={selectedSmallCraft && selectedSmallCraft.getUUID() === craft.getUUID() ? "btn btn-sm btn-primary full-width" : "btn btn-sm btn-secondary full-width"}
                        title={"Select " + smallCraftName(craft)}
                      >
                        {smallCraftName(craft)}
                        <div className="stats">
{craft.isDestroyed() ? (
<h3 className="color-red text-center">
    DESTROYED
</h3>
) : (
                          <div className="bars">
                            <StatBar
                              color="blue"
                              background="#aaa"
                              currentPercentage={craft.getArmorPercentage()}
                              currentNumber={craft.getCurrentArmor()}
                              height={8}
                              title="Current Armor Status"
                            />
                            <StatBar
                              color="white"
                              background="#aaa"
                              currentPercentage={craft.getStructurePercentage()}
                              currentNumber={craft.getCurrentStructure()}
                              height={8}
                              title="Current Structural Integrity"
                            />
                          </div>
)}
                        </div>
                      </button>
                      <hr />
                    </li>
                  ))}
                  {group.capitalShips.map( (ship) => (
                    <li key={ship.getUUID()}>
                      <button
                        onClick={(e) => this.selectVehicle(e, ship.getUUID())}
                        className={selectedCapitalShip && selectedCapitalShip.getUUID() === ship.getUUID() ? "btn btn-sm btn-primary full-width" : "btn btn-sm btn-secondary full-width"}
                        title={"Select " + capitalShipName(ship)}
                      >
                        {capitalShipName(ship)}
                        <div className="stats">
{ship.isDestroyed() ? (
<h3 className="color-red text-center">
    DESTROYED
</h3>
) : (
                          <div className="bars">
                            <StatBar
                              color="blue"
                              background="#aaa"
                              currentPercentage={ship.getArmorPercentage()}
                              currentNumber={ship.getCurrentArmor()}
                              height={8}
                              title="Current Armor Status"
                            />
                            <StatBar
                              color="white"
                              background="#aaa"
                              currentPercentage={ship.getStructurePercentage()}
                              currentNumber={ship.getCurrentStructure()}
                              height={8}
                              title="Current Structural Integrity"
                            />
                          </div>
)}
                        </div>
                      </button>
                      <hr />
                    </li>
                  ))}
                  {group.vehicles.map( (vehicle) => (
                    <li key={vehicle.getUUID()}>
                      <button
                        onClick={(e) => this.selectVehicle(e, vehicle.getUUID())}
                        className={selectedVehicle && selectedVehicle.getUUID() === vehicle.getUUID() ? "btn btn-sm btn-primary full-width" : "btn btn-sm btn-secondary full-width"}
                        title={"Select " + vehicleName(vehicle)}
                      >
                        {vehicleName(vehicle)}
                        <div className="stats">
{vehicle.isDestroyed() ? (
<h3 className="color-red text-center">
    DESTROYED
</h3>
) : (
                          <div className="bars">
                            <StatBar
                              color="blue"
                              background="#aaa"
                              currentPercentage={vehicle.getArmorPercentage()}
                              currentNumber={vehicle.getCurrentArmor()}
                              height={8}
                              title="Current Armor Status"
                            />
                            <StatBar
                              color="white"
                              background="#aaa"
                              currentPercentage={vehicle.getStructurePercentage()}
                              currentNumber={vehicle.getCurrentStructure()}
                              height={8}
                              title="Current Internal Structure Status"
                            />
                          </div>
)}
                        </div>
                      </button>
                      <hr />
                    </li>
                  ))}
                  </ul>

              </div>

            </React.Fragment>
            )
          })}
    </div>
    </div>
            </div>
        </>
      );
    }
}

interface IPlayProps {
  appGlobals: IAppGlobals;

}

interface IPlayState {
  updated: boolean;
  mechSelectorExpanded: boolean;

  setMovementDialog: BattleMech | null;
  setMovementMode: string;
  setMovementNumber: number;
  setMovementCanJump: boolean;
  setMovementJumpingMP: number;
  /** An AirMech's elevation after its AirMech Cruise or Flank movement (IO:AE p.102). */
  setMovementElevation: number;
  /** The last LAM bomb dropped or fired from the movement dialog, as text. */
  bombMessage: string;

  resolveFireDialog: boolean;

  takeDamageDialog: BattleMech | null;
  takeDamageAmount: number;
  takeDamageLocationRoll: number;
  takeDamageLocationSide: string;
  takeDamageLocationRear: boolean;
  takeDamageLocation: string;
  takeDamageCritical: boolean;
  /** The hit was from an energy weapon: halved by an active Blue Saviour and by Laser Reflective armor (#641). */
  takeDamageEnergy: boolean;
  /** The 1D6 roll for a hit to an arm while a handheld weapon is carried; 0 = not rolled (Maximum Tech p.79; TO:AUE p.128). */
  takeDamageHandheldRoll: number;

  criticalHitDialog: BattleMech | null;

  setTargetDialog: BattleMech | null;

  targetData: ICombinedTargetData | null;
  /** The unit's variable-range targeting setting when the target dialog opened. */
  targetingRangeSetting: BattleMech["targetingRangeSetting"];
  /** The unit's Enhanced Imaging switch when the target dialog opened. */
  enhancedImagingOff: boolean;
  /** The unit's satellite uplink switch when the target dialog opened. */
  satelliteUplinkOff: boolean;
  /** What the combat drop just did, shown in the movement dialog (#628). */
  combatDropLog: string[];
  targetWeaponSelection: IEquipmentItem[];
  viewGATOR: IGATOR | null;

  hitLocationChartDialog: boolean;

  /** E-War (#642): an incoming missile attack in the take-damage dialog; size 0 is off. */
  takeDamageMissileSize: number;
  takeDamageMissilePer: number;
  takeDamageMissileRoll: number;
  takeDamageMissileDestroyed: number;
  /** The attacker Artemis or Narc Cluster Hits shift, a Streak launcher, and the rolled ammunition dice. */
  takeDamageMissileShift: number;
  takeDamageMissileStreak: boolean;
  takeDamageMissileAmmoRoll: number;
  takeDamageMissileMunition: string;
  /** Most damage in one grouping of the missile hit (5 for an LRM, 2 for an SRM). */
  takeDamageMissileGroup: number;
  /** The damage groupings still to apply after the one in the dialog, each with its own hit location. */
  takeDamageMissileQueue: number[];

  damageClusters: number;
  damagePerCluster: number;
  damageRolledClusters: number;
  damagePerClusterGATOR: IGATOR | null;
  damagePerClusterEQIndex: number;
  damagePerClusterUnit: BattleMech | null;

  zoomSheet: boolean;
  selectedVehicleUUID: string;
}

interface ICombinedTargetData {
  a: ITargetToHit;
  b: ITargetToHit;
  c: ITargetToHit;
}
