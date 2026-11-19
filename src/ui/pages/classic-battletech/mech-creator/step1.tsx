import { FaArrowCircleLeft, FaArrowCircleRight } from "react-icons/fa";
import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { BattleMech, IFrankenMechDonor } from '../../../../classes/battlemech';
import { btMechTonnages, getAvailableTonnagesForMechType, getTonnageBoundsForMechType } from '../../../../data/mech-tonnages';
import { mechTypeOptions } from '../../../../data/mech-type-options';
import { getRulesLevelOptions } from '../../../../data/rules-level-options';
import { editionEditsPrintedUnitsAfterWarning, editionHasPrices, getRulesEdition, getShownRulesLevel } from '../../../../data/rules-editions';
import { editionHasBattleValue } from '../../../../data/battle-value';
import { editionHasPrintedDroids, getPrintedDroid, getPrintedDroids } from '../../../../data/battledroids-mechs';
import { buildPrintedDroid, isUnmodifiedPrintedDroid } from '../../../../classes/printed-droid';
import { confirmEditPrintedDroid, getDesignLockNote, keepDesignSettings, mechRulesLevel } from '../../../components/design-lock';
import GameSettingsBlock, { rememberRulesLevel } from '../../../components/game-settings-block';
import { IGameSettings } from '../../../../data/game-settings';
import { GameSettingStep } from '../../../../data/special-rulesets';
import { IAppGlobals } from '../../../app-router';
import { MechCreatorSideMenu } from '../../../components/creator-side-menus';
import MechCreatorStatusbar from '../../../components/mech-creator-status-bar';
import SanitizedHTML from '../../../components/sanitized-html';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import './home.scss';
import InputCheckbox from "../../../components/form_elements/input_checkbox";
import InputField from "../../../components/form_elements/input_field";
import { availabilityOptionLabel, isOptionShown } from '../../../components/availability-options';
import { replaceCurrentBattleMech } from '../../../components/confirm-replace-design';
import EditionChoice from '../../../components/edition-choice';
import ComponentTechBaseChoice from '../../../components/component-tech-base-choice';
import { getVTOLAMSamples } from '../../../../data/vtolam-samples';
import { getPAMSamples } from '../../../../data/pam-samples';
import { getPowerArmorSamples } from '../../../../data/power-armor-samples';
import { FW_POWER_ARMOR_RULESET } from '../../../../data/future-wars-power-armor';
import { getRulesetBlock } from '../../../../data/special-rulesets';
import { CUSTOM_HOMEBREW_RULES_LEVEL } from '../../../../data/rules-level-options';
import { generateUUID } from '../../../../utils/generateUUID';
const ArrowCircleLeft = FaArrowCircleLeft as any;
// A Permanent Air 'Mech goes past the LAM's 55 tons (to its own 75, getLAMMaxTonnage), so it takes a biped's tonnage list.
const tonnageChassisTag = ( mech: BattleMech ): string => mech.isPermanentAirMech() ? "biped" : mech.getType().tag;
const ArrowCircleRight = FaArrowCircleRight as any;

export default class MechCreatorStep1 extends React.Component<IHomeProps, IHomeState> {
    constructor(props: IHomeProps) {
        super(props);
        this.state = {
            updated: false,
        }

        this.props.appGlobals.makeDocumentTitle("Step 1 | 'Mech Creator");
    }

    updateMake = ( e: React.FormEvent<HTMLInputElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setModel( e.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    updateName = ( e: React.FormEvent<HTMLInputElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setName( e.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    toggleOmni = ( e: React.FormEvent<HTMLInputElement>): void => {
      if( e && e.preventDefault ) e.preventDefault();

      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.toggleOmni(mechRulesLevel(this.props.appGlobals));
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    togglePrimitive = ( e: React.FormEvent<HTMLInputElement>): void => {
      if( e && e.preventDefault ) e.preventDefault();

      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setPrimitive( !currentMech.isPrimitive() );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    toggleClanCASE = ( e: React.FormEvent<HTMLInputElement>): void => {
      if( e && e.preventDefault ) e.preventDefault();

      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setClanCASE( !currentMech.hasClanCASE() );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    toggleFrankenMech = ( e: React.FormEvent<HTMLInputElement>): void => {
      if( e && e.preventDefault ) e.preventDefault();

      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setFrankenMech( !currentMech.isFrankenMech(), mechRulesLevel(this.props.appGlobals) );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    updateFrankenMechDonor = ( locationKey: string, donor: Partial<IFrankenMechDonor> ): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setFrankenMechDonor( locationKey, donor );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    toggleFractionalAccounting = (): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setWeightAccounting(
          currentMech.usesFractionalAccounting() ? "standard" : "fractional",
          mechRulesLevel(this.props.appGlobals),
        );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
        this.setState({ updated: !this.state.updated });
      }
    }

    // The shared settings block (#324): the design takes its edition, tech base, era, level and rulesets; its tonnage
    // moves into the range they allow. A rules level the player picks is also the default for the next new design
    // (call 12); one an edition change fitted is not.
    updateGameSettings = ( settings: IGameSettings, step: GameSettingStep | "rulesets" ): void => {
      const currentMech = this.props.appGlobals.currentBattleMech;
      if( !currentMech ) return;
      const switched = settings.edition !== currentMech.getGameSettings( settings.rulesLevel ).edition;
      currentMech.applyGameSettings( settings );
      // A Clan tech base has no superheavy tonnages (IO:AE p.154).
      // A way back to an edition may restore another level: clamp at the design's own.
      this.clampTonnageToChassisRules(currentMech, mechRulesLevel(this.props.appGlobals));
      // The clamp finishes an edition switch; an undo of the switch still brings back the design as it was. Only a
      // switch settles: settling after any other change would take edits made since the switch for none, and going
      // back would drop them.
      if( switched ) currentMech.settleRulesEditionSwitch();
      rememberRulesLevel( this.props.appGlobals, settings, step );
      this.props.appGlobals.saveCurrentBattleMech( currentMech );
      this.setState({ updated: !this.state.updated });
    }

    // Loads a droid as its record listing prints it, in place of the current design.
    loadPrintedDroid = ( e: React.FormEvent<HTMLSelectElement>): void => {
      const droid = getPrintedDroid( e.currentTarget.value );
      if( droid ) {
        replaceCurrentBattleMech( this.props.appGlobals, () => {
          this.props.appGlobals.saveCurrentBattleMech( keepDesignSettings( this.props.appGlobals, buildPrintedDroid( droid ) ) );
          this.setState({ updated: !this.state.updated });
        });
      }
    }

    loadVTOLAMSample = ( e: React.FormEvent<HTMLSelectElement>): void => {
      this.loadSample( getVTOLAMSamples( mechRulesLevel(this.props.appGlobals) ), e.currentTarget.value );
    }

    loadPAMSample = ( e: React.FormEvent<HTMLSelectElement>): void => {
      this.loadSample( getPAMSamples( mechRulesLevel(this.props.appGlobals) ), e.currentTarget.value );
    }

    // A suit needs its ruleset: keep the design's other rulesets, less any that cannot sit with Power Armor.
    loadPowerArmorSample = ( e: React.FormEvent<HTMLSelectElement>): void => {
      this.loadSample( getPowerArmorSamples( mechRulesLevel(this.props.appGlobals) ), e.currentTarget.value, (suit) => {
        const level = mechRulesLevel( this.props.appGlobals );
        const kept = suit.getRulesets().filter( (id) => id !== FW_POWER_ARMOR_RULESET && !getRulesetBlock( [FW_POWER_ARMOR_RULESET], id ) );
        suit.applyGameSettings({ ...suit.getGameSettings( level ), rulesLevel: level, rulesets: [...kept, FW_POWER_ARMOR_RULESET] });
      });
    }

    loadSample = ( samples: { id: string; save: object }[], id: string, adjust?: ( mech: BattleMech ) => void ): void => {
      const sample = samples.find( (entry) => entry.id === id );
      if( sample ) {
        replaceCurrentBattleMech( this.props.appGlobals, () => {
          const mech = keepDesignSettings( this.props.appGlobals, new BattleMech( JSON.stringify( { ...sample.save, uuid: generateUUID() } ) ) ) as BattleMech;
          adjust?.( mech );
          this.props.appGlobals.saveCurrentBattleMech( mech );
          this.setState({ updated: !this.state.updated });
        });
      }
    }

    setArmless = ( e: React.FormEvent<HTMLInputElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setArmless( e.currentTarget.checked );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    updateType = ( e: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setType( e.currentTarget.value);
        this.clampTonnageToChassisRules(currentMech, mechRulesLevel(this.props.appGlobals));
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    // Keeps the mech's tonnage (and Omni status) within the legal range for its chassis type and rules level.
    clampTonnageToChassisRules = ( currentMech: NonNullable<IAppGlobals["currentBattleMech"]>, rulesLevel: number): void => {
      if( currentMech.isOmnimech && !currentMech.canBeOmniMech( rulesLevel ) ) {
        currentMech.toggleOmni( rulesLevel );
      }
      const tonnage = currentMech.getTonnage();
      // A construction ruleset's own tonnages (Power Armor: 5, 10, 15): the nearest one, the heavier on a tie.
      const rulesetTonnages = currentMech.getConstructionTonnages();
      if( rulesetTonnages ) {
        if( !rulesetTonnages.includes( tonnage ) ) {
          currentMech.setTonnage( rulesetTonnages.reduce( (best, tons) => Math.abs( tons - tonnage ) <= Math.abs( best - tonnage ) ? tons : best ) );
        }
        return;
      }
      const { min, max } = getTonnageBoundsForMechType( tonnageChassisTag( currentMech ), rulesLevel, currentMech.getTech().tag, currentMech.getRulesEdition() );
      const lamMax = currentMech.getLAMMaxTonnage();
      if( lamMax !== null && tonnage > lamMax ) {
        currentMech.setTonnage( lamMax );
      } else if( tonnage < min ) {
        currentMech.setTonnage( min );
      } else if( tonnage > max ) {
        currentMech.setTonnage( max );
      }
    }

    updateLAMType = ( e: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setLAMType(e.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech(currentMech);
      }
    }

    updateQuadVeeMotive = ( e: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setQuadVeeMotive(e.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech(currentMech);
      }
    }

    updateTonnage = ( e: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setTonnage( +e.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    updateStructureType = ( e: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        const currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setInternalStructureType( e.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    render = (): JSX.Element => {
      if(!this.props.appGlobals.currentBattleMech)
        return <></>
      // At a rules level with no construction rules, only a printed droid can be chosen.
      const locked = getDesignLockNote(this.props.appGlobals);
      const shownLevel = getShownRulesLevel(this.props.appGlobals.currentBattleMech.getRulesEdition(), mechRulesLevel(this.props.appGlobals));
      return (
        <>
          <MechCreatorStatusbar  appGlobals={this.props.appGlobals}  />
          <UIPage current="classic-battletech-mech-creator" appGlobals={this.props.appGlobals}>

            <div className="row">
              <div className="d-none d-md-block col-md-3 col-lg-2">
                <MechCreatorSideMenu
                  appGlobals={this.props.appGlobals}
                  current="step1"
                />
              </div>
              <div className="col-md-9 col-lg-10">
                  <div className="row">
                    <div className="col-md-12 col-lg-8">
                      <TextSection
                        label="Step 1: Design the Chassis"
                      >
                          {/* The shared settings block comes first: it decides what every field below offers (#324). */}
                          <GameSettingsBlock
                            unitType="mech"
                            settings={this.props.appGlobals.currentBattleMech.getGameSettings(this.props.appGlobals.appSettings.mechRulesFilter)}
                            onChange={this.updateGameSettings}
                          />
                          {this.props.appGlobals.currentBattleMech.usesEarlierRulesEdition() ? (
                            <p className="smaller-text">
                              Built from the {getRulesEdition(this.props.appGlobals.currentBattleMech.getRulesEdition()).name} rulebook: only what it includes is offered,
                              with the weights, heat, ranges, damage{editionHasPrices(this.props.appGlobals.currentBattleMech.getRulesEdition()) ? ", critical slots and prices" : " and critical slots"} it prints.
                              {editionHasBattleValue(this.props.appGlobals.currentBattleMech.getRulesEdition()) ? " Battle Value is its BV1, with the current rules' (BV2) beside it." : " This rulebook has no Battle Value: the one shown is the current rules' (BV2), for comparison."}
                              {editionHasPrices(this.props.appGlobals.currentBattleMech.getRulesEdition()) ? " It prints prices, but the total cost still follows the current rules." : " It prints no prices, so the design has no cost."}
                            </p>
                          ) : null}
                          {this.props.appGlobals.currentBattleMech.getRulesEditionIssues(shownLevel).length > 0 ? (
                            <div className="color-red smaller-text">
                              Not in this rules edition:
                              <ul>
                                {this.props.appGlobals.currentBattleMech.getRulesEditionIssues(shownLevel).map((issue) => (
                                  <li key={issue}>{issue}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {this.props.appGlobals.currentBattleMech.getRulesEditionRuleIssues().length > 0 ? (
                            <div className="color-red smaller-text">
                              Against this rules edition:
                              <ul>
                                {this.props.appGlobals.currentBattleMech.getRulesEditionRuleIssues().map((issue) => (
                                  <li key={issue}>{issue}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          {editionHasPrintedDroids(this.props.appGlobals.currentBattleMech.getRulesEdition()) ? (
                            <label>
                              Droid:
                              <select value={isUnmodifiedPrintedDroid(this.props.appGlobals.currentBattleMech) ? this.props.appGlobals.currentBattleMech.getPrintedDroid() : ""} onChange={this.loadPrintedDroid}>
                                <option value="">{locked ? "Choose a printed droid" : "Start from a printed droid (optional)"}</option>
                                {getPrintedDroids(shownLevel).map((droid) => (
                                  <option key={droid.id} value={droid.id}>{droid.model !== droid.name.toUpperCase() && `${droid.model} `}{droid.name}{droid.inferred ? " (inferred)" : ""}</option>
                                ))}
                              </select>
                            </label>
                          ) : null}
                          {locked ? (
                            <p className="color-red smaller-text">
                              {locked}{" "}
                              {editionEditsPrintedUnitsAfterWarning(this.props.appGlobals.currentBattleMech.getRulesEdition(), shownLevel) ? (
                                <button type="button" className="btn btn-primary btn-sm" onClick={() => confirmEditPrintedDroid(this.props.appGlobals)}>Edit this droid</button>
                              ) : null}
                            </p>
                          ) : null}
                          {locked ? null : (<>
                          <InputField
                            label="Mech Model # (e.g. WSP-1A, Timber Wolf)"
                            value={this.props.appGlobals.currentBattleMech.model}
                            onChange={this.updateMake}
                          />

                           <InputField
                            label="Mech Model Name, or Omni Variant (e.g. Wasp, Prime, C )"
                            value={this.props.appGlobals.currentBattleMech.name}
                            onChange={this.updateName}
                          />

                          <EditionChoice earlierEdition={this.props.appGlobals.currentBattleMech.usesEarlierRulesEdition()}>
                            <label>
                              Mech Type:
                              <select
                                value={this.props.appGlobals.currentBattleMech.getType().tag}
                                onChange={this.updateType}
                              >
                              {mechTypeOptions
                                .filter( (option) => !!this.props.appGlobals.currentBattleMech?.isOfferedInEdition(option, shownLevel)
                                  || option.tag === this.props.appGlobals.currentBattleMech?.getType().tag )
                                .map( (option) => {
                                return (
                                  <option key={option.tag} value={option.tag}>{option.name}{option.notes ? ` (${option.notes})` : ""}</option>
                                )
                              })}
                              </select>
                            </label>
                          </EditionChoice>
                          {(() => {
                            const mech = this.props.appGlobals.currentBattleMech;
                            const armless = mech.getArmlessOption(mechRulesLevel(this.props.appGlobals));
                            if( !isOptionShown(armless, mech.isArmless()) ) return null;
                            return (
                              <label className="d-block">
                                <input type="checkbox" checked={mech.isArmless()} onChange={this.setArmless} data-testid="armless" />{" "}
                                {availabilityOptionLabel(armless)}: no arm armor, structure or slots
                              </label>
                            );
                          })()}
                          {!this.props.appGlobals.currentBattleMech.usesEarlierRulesEdition() && this.props.appGlobals.currentBattleMech.getRequiredRulesLevel() > mechRulesLevel(this.props.appGlobals) ? (
                            <p className="color-red smaller-text">
                              This design requires the {getRulesLevelOptions().find( (option) => option.id === this.props.appGlobals.currentBattleMech?.getRequiredRulesLevel() )?.name} rules
                              level and is not legal at the selected level. Printing will ask for confirmation.
                            </p>
                          ) : null}

                          {this.props.appGlobals.currentBattleMech.isLAM() ? (
                            <label>
                              LAM Type:
                              <select
                                value={this.props.appGlobals.currentBattleMech.getLAMType()}
                                onChange={this.updateLAMType}
                              >
                                <option value="standard">Standard (Mech / AirMech / Fighter)</option>
                                <option value="bimodal">Bimodal (Mech / Fighter)</option>
                                {mechRulesLevel(this.props.appGlobals) >= CUSTOM_HOMEBREW_RULES_LEVEL || this.props.appGlobals.currentBattleMech.isVTOLAM() ? (
                                  <>
                                    <option value="vtolam">VTOLAM, BishopSteiner rules (Mech / VTOL; Custom Homebrew)</option>
                                    <option value="vtolam-btitf">VTOLAM, Battletech Into The Future rules (Mech / VTOL; Custom Homebrew)</option>
                                  </>
                                ) : null}
                                {mechRulesLevel(this.props.appGlobals) >= CUSTOM_HOMEBREW_RULES_LEVEL || this.props.appGlobals.currentBattleMech.isPermanentAirMech() ? (
                                  <option value="pam">Permanent Air 'Mech (AirMech only; Custom Homebrew)</option>
                                ) : null}
                              </select>
                            </label>
                          ) : null}
                          {this.props.appGlobals.currentBattleMech.isPermanentAirMech() ? (
                            <p className="smaller-text" data-testid="pam-notes">
                              {this.props.appGlobals.currentBattleMech.getLAMTypeNotes()} AirMech Cruise / Flank MP: {this.props.appGlobals.currentBattleMech.getAirMechCruiseMP()} / {this.props.appGlobals.currentBattleMech.getAirMechFlankMP()}.
                            </p>
                          ) : null}
                          {this.props.appGlobals.currentBattleMech.isVTOLAM() ? (
                            <p className="smaller-text" data-testid="vtolam-notes">
                              {this.props.appGlobals.currentBattleMech.getLAMTypeNotes()} VTOL mode Cruise / Flank MP: {this.props.appGlobals.currentBattleMech.getVTOLAMCruiseMP()} / {this.props.appGlobals.currentBattleMech.getVTOLAMFlankMP()}.
                            </p>
                          ) : null}
                          {getVTOLAMSamples( mechRulesLevel(this.props.appGlobals) ).length > 0 ? (
                            <label>
                              Sample VTOLAMs (Custom Homebrew):
                              <select value="" onChange={this.loadVTOLAMSample} data-testid="vtolam-samples">
                                <option value="">Start from a sample VTOLAM (optional)</option>
                                {getVTOLAMSamples( mechRulesLevel(this.props.appGlobals) ).map( (sample) => (
                                  <option key={sample.id} value={sample.id}>{sample.name}</option>
                                ))}
                              </select>
                            </label>
                          ) : null}
                          {getPAMSamples( mechRulesLevel(this.props.appGlobals) ).length > 0 ? (
                            <label>
                              Sample Permanent Air 'Mechs (Custom Homebrew):
                              <select value="" onChange={this.loadPAMSample} data-testid="pam-samples">
                                <option value="">Start from a sample Permanent Air 'Mech (optional)</option>
                                {getPAMSamples( mechRulesLevel(this.props.appGlobals) ).map( (sample) => (
                                  <option key={sample.id} value={sample.id}>{sample.name}</option>
                                ))}
                              </select>
                            </label>
                          ) : null}
                          {getPowerArmorSamples( mechRulesLevel(this.props.appGlobals) ).length > 0 ? (
                            <label>
                              Sample Power Armor (Custom Homebrew):
                              <select value="" onChange={this.loadPowerArmorSample} data-testid="power-armor-samples">
                                <option value="">Start from a sample suit (optional)</option>
                                {getPowerArmorSamples( mechRulesLevel(this.props.appGlobals) ).map( (sample) => (
                                  <option key={sample.id} value={sample.id}>{sample.name}</option>
                                ))}
                              </select>
                            </label>
                          ) : null}

                          {this.props.appGlobals.currentBattleMech.isQuadVee() ? (
                            <label>
                              QuadVee Motive:
                              <select
                                value={this.props.appGlobals.currentBattleMech.getQuadVeeMotive()}
                                onChange={this.updateQuadVeeMotive}
                              >
                                <option value="tracked">Tracked</option>
                                <option value="wheeled">Wheeled</option>
                              </select>
                            </label>
                          ) : null}

                          {/* No OmniMechs in a rulebook from before them. */}
                          {this.props.appGlobals.currentBattleMech.isOmnimech || !getRulesEdition(this.props.appGlobals.currentBattleMech.getRulesEdition()).noOmniMechs ? (
                            <InputCheckbox
                              label="Is an Omnimech"
                              checked={this.props.appGlobals.currentBattleMech.isOmnimech}
                              onChange={this.toggleOmni}
                            />
                          ) : null}
                          {this.props.appGlobals.currentBattleMech.isLAM() ? (
                            <p className="smaller-text">
                              {this.props.appGlobals.currentBattleMech.isOmniLAM()
                                ? "Omni-LAM (Custom Homebrew, Kronos Battle Systems fan rule): Inner Sphere only, arm actuators are fixed, cost x1.75."
                                : "Canon LAMs cannot be OmniMechs. The fan-made Omni-LAM is available to Inner Sphere LAMs at the Custom Homebrew rules level."}
                            </p>
                          ) : null}
                          {this.props.appGlobals.currentBattleMech.getOmniLAMViolations().map( (violation) => (
                            <p key={violation} className="color-red smaller-text">{violation}</p>
                          ))}

                          {this.props.appGlobals.currentBattleMech.isPrimitive() || this.props.appGlobals.currentBattleMech.canBePrimitive() ? (
                            <>
                              <InputCheckbox
                                label="Is a Primitive 'Mech"
                                checked={this.props.appGlobals.currentBattleMech.isPrimitive()}
                                onChange={this.togglePrimitive}
                              />
                              {this.props.appGlobals.currentBattleMech.isPrimitive() ? (
                                <p className="smaller-text">
                                  Primitive {this.props.appGlobals.currentBattleMech.isIndustrialMech() ? "IndustrialMech" : "BattleMech"} (IO:AE pp.116-118):
                                  the engine rating is Walking MP x tonnage x 1.2, with a 5-ton Primitive cockpit,
                                  {this.props.appGlobals.currentBattleMech.isIndustrialMech() ? " Commercial" : " Primitive"} armor, a standard gyro and single heat sinks.
                                  Choose Industrial structure below for a Primitive IndustrialMech.
                                  {this.props.appGlobals.currentBattleMech.isRetroTech()
                                    ? " It carries equipment introduced after 2500 or modern jump jets, so it is a RetroTech unit (IO:AE p.116)."
                                    : " With equipment introduced after 2500 or modern jump jets it becomes a RetroTech unit (IO:AE p.116)."}
                                </p>
                              ) : null}
                            </>
                          ) : null}


                          {this.props.appGlobals.currentBattleMech.canChooseClanCASE() ? (
                            <div data-testid="clan-case-option">
                              <InputCheckbox
                                label="Clan CASE"
                                checked={this.props.appGlobals.currentBattleMech.hasClanCASE()}
                                onChange={this.toggleClanCASE}
                              />
                              <p className="smaller-text">
                                Clan CASE is weightless and takes no critical slots, and protects every location (TM p.210).
                                Battle Value counts it as CASE in each side torso and arm; with an Inner Sphere XL engine it saves nothing (TM pp.302-303).
                              </p>
                            </div>
                          ) : null}

                          {this.props.appGlobals.currentBattleMech.canUseFractionalAccounting( mechRulesLevel(this.props.appGlobals) )
                            || this.props.appGlobals.currentBattleMech.usesFractionalAccounting() ? (
                            <div data-testid="fractional-accounting-option">
                              <InputCheckbox
                                label="Fractional Accounting"
                                checked={this.props.appGlobals.currentBattleMech.usesFractionalAccounting()}
                                onChange={this.toggleFractionalAccounting}
                              />
                              <p className="smaller-text">
                                Experimental construction option (TO:AUE p.188): engine, structure, armor and ammunition
                                weights are not rounded to the half ton, only up to the kilogram. Armor is bought by the
                                point and ammunition by the shot.
                              </p>
                              {this.props.appGlobals.currentBattleMech.defaultsToFractionalAccounting() ? (
                                <p className="smaller-text" data-testid="fractional-accounting-default">
                                  On by default with battle armor equipment mounted (Ghosts of Obeedah p.54); it may be turned off.
                                </p>
                              ) : null}
                            </div>
                          ) : null}

                          <label>
                            Mech Tonnage:
                            <select
                              value={this.props.appGlobals.currentBattleMech.getTonnage()}
                              onChange={this.updateTonnage}
                            >
                            {(() => {
                              const rulesetTonnages = this.props.appGlobals.currentBattleMech.getConstructionTonnages();
                              return rulesetTonnages
                                ? btMechTonnages.filter( (option) => rulesetTonnages.includes( option.tons ) )
                                : getAvailableTonnagesForMechType(
                                  tonnageChassisTag( this.props.appGlobals.currentBattleMech ),
                                  mechRulesLevel(this.props.appGlobals),
                                  this.props.appGlobals.currentBattleMech.getTech().tag,
                                  this.props.appGlobals.currentBattleMech.getRulesEdition()
                                );
                            })().filter( (option) => option.tons <= ( this.props.appGlobals.currentBattleMech?.getLAMMaxTonnage() ?? Infinity )
                              && ( !this.props.appGlobals.currentBattleMech?.isPermanentAirMech() || option.tons >= 20 ) ).map( (option) => {
                              return (
                                <option key={option.tons} value={option.tons}>{option.tons} ({option.type})</option>
                              )
                            })}
                            </select>
                          </label>

                          <EditionChoice earlierEdition={this.props.appGlobals.currentBattleMech.usesEarlierRulesEdition()}>
                            <label>
                              Internal Structure Type:
                              <select
                                value={this.props.appGlobals.currentBattleMech.getInternalStructureType()}
                                onChange={this.updateStructureType}
                              >
                              {this.props.appGlobals.currentBattleMech.getAvailableInternalStructures(mechRulesLevel(this.props.appGlobals)).map( (option) => {
                                const selected = option.tag === this.props.appGlobals.currentBattleMech?.getInternalStructureType();
                                if( !isOptionShown(option, selected) ) {
                                  return <React.Fragment key={option.tag}></React.Fragment>;
                                }
                                return (
                                  <option key={option.tag} value={option.tag}>{availabilityOptionLabel(option)}</option>
                                )
                              })}
                              </select>
                            </label>
                          </EditionChoice>
                          <ComponentTechBaseChoice
                            label="Structure Version"
                            choices={this.props.appGlobals.currentBattleMech.getComponentTechBases("structure")}
                            value={this.props.appGlobals.currentBattleMech.getStructureTechBase()}
                            clanDesign={this.props.appGlobals.currentBattleMech.getTech().tag === "clan"}
                            onChange={(techBase) => { const mech = this.props.appGlobals.currentBattleMech; if (mech) { mech.setStructureTechBase(techBase); this.props.appGlobals.saveCurrentBattleMech(mech); } }}
                          />

                          {this.props.appGlobals.currentBattleMech.isFrankenMech() || this.props.appGlobals.currentBattleMech.canBeFrankenMech(mechRulesLevel(this.props.appGlobals)) ? (
                            <InputCheckbox
                              label="Is a FrankenMech"
                              checked={this.props.appGlobals.currentBattleMech.isFrankenMech()}
                              onChange={this.toggleFrankenMech}
                            />
                          ) : null}
                          {this.props.appGlobals.currentBattleMech.isFrankenMech() ? (
                            <fieldset className="fieldset frankenmech" data-testid="frankenmech-donors">
                              <legend>FrankenMech (CO pp.213-214)</legend>
                              <p className="smaller-text">
                                Built from the parts of other 'Mechs. The center torso sets the tonnage and the structure type chosen above;
                                each other location keeps the structure points of the 'Mech it came from and weighs its share of that
                                'Mech's structure (head 5%, side torsos 15%, center torso 25%, limbs 10%). Endo steel and endo-composite
                                keep the slots they had on the donor's design, or the Internal Structure Distribution Table's when
                                that is not known. Legs must come from a 'Mech at least as heavy. A FrankenMech cannot be an OmniMech or carry mechanized battle armor.
                              </p>
                              <table className="table table-sm">
                                <thead>
                                  <tr>
                                    <th>Location</th><th>Donor 'Mech</th><th>Tons</th><th>Structure</th>
                                    {this.props.appGlobals.currentBattleMech.getFrankenMechStructureTechBases().length > 1 ? <th>Tech</th> : null}
                                    <th title="Critical slots the structure kept from the donor's design">Slots</th>
                                    <th className="text-center" title="Structure points">Pts</th><th className="text-center" title="Share of structure weight">Weight</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {this.props.appGlobals.currentBattleMech.getFrankenMechLocations().map( (location) => {
                                    const currentMech = this.props.appGlobals.currentBattleMech!;
                                    const donor = currentMech.getFrankenMechDonor(location.key);
                                    const centerTorso = location.key === "centerTorso";
                                    const offered = currentMech.getFrankenMechDonorStructures(mechRulesLevel(this.props.appGlobals))
                                      .filter( (structure) => isOptionShown(structure, structure.tag === donor.structure) );
                                    const structures = offered.some( (structure) => structure.tag === donor.structure )
                                      ? offered : [currentMech.getFrankenMechLocationStructure(location.key), ...offered];
                                    const points = currentMech.getInternalStructure() as unknown as Record<string, number | undefined>;
                                    return (
                                      <tr key={location.key} data-testid={`frankenmech-${location.key}`}>
                                        <td>{location.label}</td>
                                        <td>
                                          <input
                                            type="text"
                                            value={donor.name ?? ""}
                                            maxLength={BattleMech.FRANKENMECH_DONOR_NAME_LENGTH}
                                            aria-label={`${location.label} donor 'Mech`}
                                            onChange={(event: React.FormEvent<HTMLInputElement>) => this.updateFrankenMechDonor( location.key, { name: event.currentTarget.value })}
                                          />
                                        </td>
                                        <td>
                                          {centerTorso ? donor.tonnage : (
                                            <select
                                              value={donor.tonnage}
                                              aria-label={`${location.label} donor tonnage`}
                                              onChange={(event: React.FormEvent<HTMLSelectElement>) => this.updateFrankenMechDonor( location.key, { tonnage: +event.currentTarget.value })}
                                            >
                                              {currentMech.getFrankenMechDonorTonnages(location.key).map( (tons) => (
                                                <option key={tons} value={tons}>{tons}</option>
                                              ))}
                                            </select>
                                          )}
                                        </td>
                                        <td>
                                          {centerTorso ? currentMech.getFrankenMechLocationStructure(location.key).name : (
                                            <select
                                              value={donor.structure}
                                              aria-label={`${location.label} structure`}
                                              onChange={(event: React.FormEvent<HTMLSelectElement>) => this.updateFrankenMechDonor( location.key, { structure: event.currentTarget.value })}
                                            >
                                              {structures.map( (structure) => (
                                                <option key={structure.tag} value={structure.tag}>{availabilityOptionLabel(structure)}</option>
                                              ))}
                                            </select>
                                          )}
                                        </td>
                                        {currentMech.getFrankenMechStructureTechBases().length > 1 ? (
                                          <td>
                                            <select
                                              value={donor.structureTechBase}
                                              aria-label={`${location.label} structure tech base`}
                                              onChange={(event: React.FormEvent<HTMLSelectElement>) => this.updateFrankenMechDonor( location.key, { structureTechBase: event.currentTarget.value === "clan" ? "clan" : "is" })}
                                            >
                                              <option value="is">IS</option>
                                              <option value="clan">Clan</option>
                                            </select>
                                          </td>
                                        ) : null}
                                        <td>
                                          {currentMech.getFrankenMechDonorSlotCounts(location.key).length > 0 ? (
                                            <select
                                              value={donor.structureSlots ?? 0}
                                              aria-label={`${location.label} structure slots`}
                                              onChange={(event: React.FormEvent<HTMLSelectElement>) => this.updateFrankenMechDonor( location.key, { structureSlots: +event.currentTarget.value })}
                                            >
                                              <option value={0}>Table ({currentMech.getFrankenMechTableStructureSlots(location.key)})</option>
                                              {currentMech.getFrankenMechDonorSlotCounts(location.key).map( (slots) => (
                                                <option key={slots} value={slots}>{slots}</option>
                                              ))}
                                            </select>
                                          ) : "-"}
                                        </td>
                                        <td className="text-center">{points[location.key] ?? 0}</td>
                                        <td className="text-center">{Math.round(currentMech.getFrankenMechLocationStructureWeight(location.key) * 1000) / 1000}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                              <p className="smaller-text" data-testid="frankenmech-summary">
                                Internal structure: {this.props.appGlobals.currentBattleMech.getInternalStructureWeight()} tons
                                ({this.props.appGlobals.currentBattleMech.getInternalStructureLabel()}).
                                {this.props.appGlobals.currentBattleMech.getFrankenMechLegPilotingModifier() > 0
                                  ? ` Legs from ${this.props.appGlobals.currentBattleMech.getFrankenMechLegPilotingModifier() === 2 ? "'Mechs of different tonnages" : "different 'Mechs"}: +${this.props.appGlobals.currentBattleMech.getFrankenMechLegPilotingModifier()} to Piloting Skill Rolls.`
                                  : ""}
                              </p>
                            </fieldset>
                          ) : null}

                          </>)}

                          <div className="clear-both overflow-hidden">
                          <hr />
                            <Link to={`${process.env.PUBLIC_URL}/classic-battletech/mech-creator/step2`} className="btn btn-primary pull-right btn-sm">Next Step <ArrowCircleRight /></Link>
                            <div className="inline-block text-left">
                              <Link to={`${process.env.PUBLIC_URL}/classic-battletech/mech-creator/`} className="btn btn-primary btn-sm"><ArrowCircleLeft /> Previous Step</Link>
                            </div>
                          </div>
                        </TextSection>

                    </div>
                    <div className="d-none d-lg-block col-lg-4">
                    <TextSection

                    >
                      <div className="mech-tro">
                        <SanitizedHTML raw={true} html={this.props.appGlobals.currentBattleMech.makeTROHTML()} />
                      </div>
                    </TextSection>
                    </div>
                  </div>
              </div>

            </div>

          </UIPage>
        </>
      );
    }
}

interface IHomeProps {
  appGlobals: IAppGlobals;
}

interface IHomeState {
    updated: boolean;

}