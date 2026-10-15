import { FaArrowCircleLeft, FaArrowCircleRight } from "react-icons/fa";
import React, { type JSX } from 'react';
import { Link } from 'react-router';
import { BattleMech, IFrankenMechDonor } from '../../../../classes/battlemech';
import { getAvailableTonnagesForMechType, getTonnageBoundsForMechType } from '../../../../data/mech-tonnages';
import { mechTypeOptions } from '../../../../data/mech-type-options';
import { btTechOptions } from '../../../../data/tech-options';
import { getRulesLevelOptions } from '../../../../data/rules-level-options';
import { editionHasBattleValue, editionHasPrices, getRulesEdition, getSelectableRulesEditions } from '../../../../data/rules-editions';
import { IAppGlobals } from '../../../app-router';
import MechCreatorSideMenu from '../../../components/mech-creator-side-menu';
import MechCreatorStatusbar from '../../../components/mech-creator-status-bar';
import SanitizedHTML from '../../../components/sanitized-html';
import TextSection from '../../../components/text-section';
import UIPage from '../../../components/ui-page';
import './home.scss';
import InputCheckbox from "../../../components/form_elements/input_checkbox";
import InputField from "../../../components/form_elements/input_field";
import { availabilityOptionLabel, isOptionShown } from '../../../components/availability-options';
const ArrowCircleLeft = FaArrowCircleLeft as any;
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
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setModel( e.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    updateName = ( e: React.FormEvent<HTMLInputElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setName( e.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    toggleOmni = ( e: React.FormEvent<HTMLInputElement>): void => {
      if( e && e.preventDefault ) e.preventDefault();

      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.toggleOmni(this.props.appGlobals.appSettings.mechRulesFilter);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    togglePrimitive = ( e: React.FormEvent<HTMLInputElement>): void => {
      if( e && e.preventDefault ) e.preventDefault();

      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setPrimitive( !currentMech.isPrimitive() );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    toggleFrankenMech = ( e: React.FormEvent<HTMLInputElement>): void => {
      if( e && e.preventDefault ) e.preventDefault();

      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setFrankenMech( !currentMech.isFrankenMech(), this.props.appGlobals.appSettings.mechRulesFilter );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    updateFrankenMechDonor = ( locationKey: string, donor: Partial<IFrankenMechDonor> ): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setFrankenMechDonor( locationKey, donor );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    toggleFractionalAccounting = (): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setWeightAccounting(
          currentMech.usesFractionalAccounting() ? "standard" : "fractional",
          this.props.appGlobals.appSettings.mechRulesFilter,
        );
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
        this.setState({ updated: !this.state.updated });
      }
    }

    updateTech = ( e: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setTech( e.currentTarget.value);
        // A Clan tech base has no superheavy tonnages (IO:AE p.154).
        this.clampTonnageToChassisRules(currentMech, this.props.appGlobals.appSettings.mechRulesFilter);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
        this.setState({ updated: !this.state.updated });
      }
    }

    updateRulesLevel = ( e: React.FormEvent<HTMLSelectElement>): void => {
      const appSettings = this.props.appGlobals.appSettings;
      appSettings.mechRulesFilter = +e.currentTarget.value;
      this.props.appGlobals.saveAppSettings(appSettings);

      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        this.clampTonnageToChassisRules(currentMech, appSettings.mechRulesFilter);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    // Builds the design under another rules edition; its tonnage moves into that edition's range.
    updateRulesEdition = ( e: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setRulesEdition( e.currentTarget.value );
        this.clampTonnageToChassisRules(currentMech, this.props.appGlobals.appSettings.mechRulesFilter);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
        this.setState({ updated: !this.state.updated });
      }
    }

    updateType = ( e: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setType( e.currentTarget.value);
        this.clampTonnageToChassisRules(currentMech, this.props.appGlobals.appSettings.mechRulesFilter);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    // Keeps the mech's tonnage (and Omni status) within the legal range for its chassis type and rules level.
    clampTonnageToChassisRules = ( currentMech: NonNullable<IAppGlobals["currentBattleMech"]>, rulesLevel: number): void => {
      if( currentMech.isOmnimech && !currentMech.canBeOmniMech( rulesLevel ) ) {
        currentMech.toggleOmni( rulesLevel );
      }
      const { min, max } = getTonnageBoundsForMechType( currentMech.getType().tag, rulesLevel, currentMech.getTech().tag, currentMech.getRulesEdition() );
      const tonnage = currentMech.getTonnage();
      if( tonnage < min ) {
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
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setTonnage( +e.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    updateStructureType = ( e: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setInternalStructureType( e.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    updateEra = ( e: React.FormEvent<HTMLSelectElement>): void => {
      if( this.props.appGlobals.currentBattleMech ) {
        let currentMech = this.props.appGlobals.currentBattleMech;
        currentMech.setEra( e.currentTarget.value);
        this.props.appGlobals.saveCurrentBattleMech( currentMech );
      }
    }

    render = (): JSX.Element => {
      if(!this.props.appGlobals.currentBattleMech)
        return <></>
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

                          <label>
                            Technology Base:
                            <select
                              value={this.props.appGlobals.currentBattleMech.getTech().tag}
                              onChange={this.updateTech}
                            >
                            {btTechOptions.map( (option) => {
                              return (
                                <option key={option.tag} value={option.tag}>{option.name}</option>
                              )
                            })}
                            </select>
                          </label>

                          <label>
                            Rules Level:
                            <select
                              value={this.props.appGlobals.appSettings.mechRulesFilter}
                              onChange={this.updateRulesLevel}
                            >
                            {getRulesLevelOptions().map((option) => (
                              <option key={option.id} value={option.id}>{option.name}</option>
                            ))}
                            </select>
                          </label>

                          <label>
                            Rules Edition:
                            <select
                              value={this.props.appGlobals.currentBattleMech.getRulesEdition()}
                              onChange={this.updateRulesEdition}
                            >
                            {getSelectableRulesEditions().map((edition) => (
                              <option key={edition.tag} value={edition.tag}>{edition.name} ({edition.year})</option>
                            ))}
                            </select>
                          </label>
                          {this.props.appGlobals.currentBattleMech.usesEarlierRulesEdition() ? (
                            <p className="smaller-text">
                              Built from the {getRulesEdition(this.props.appGlobals.currentBattleMech.getRulesEdition()).name} rulebook: only what it includes is offered,
                              with the weights, heat, ranges, damage{editionHasPrices(this.props.appGlobals.currentBattleMech.getRulesEdition()) ? ", critical slots and prices" : " and critical slots"} it prints.
                              {editionHasBattleValue(this.props.appGlobals.currentBattleMech.getRulesEdition()) ? " Battle Value" : " This rulebook has no Battle Value: the one shown is the current rules' (BV2), for comparison. It"}
                              {editionHasPrices(this.props.appGlobals.currentBattleMech.getRulesEdition()) ? (editionHasBattleValue(this.props.appGlobals.currentBattleMech.getRulesEdition()) ? " and total cost still follow the current rules." : " prints prices, but the total cost still follows the current rules.") : " prints no prices either, so the design has no cost."}
                            </p>
                          ) : null}
                          {this.props.appGlobals.currentBattleMech.getRulesEditionIssues().length > 0 ? (
                            <div className="color-red smaller-text">
                              Not in this rules edition:
                              <ul>
                                {this.props.appGlobals.currentBattleMech.getRulesEditionIssues().map((issue) => (
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

                          <label>
                            Mech Type:
                            <select
                              value={this.props.appGlobals.currentBattleMech.getType().tag}
                              onChange={this.updateType}
                            >
                            {mechTypeOptions
                              .filter( (option) => (this.props.appGlobals.currentBattleMech?.usesEarlierRulesEdition()
                                  ? this.props.appGlobals.currentBattleMech.isInRulesEdition(option)
                                  : option.rulesLevel <= this.props.appGlobals.appSettings.mechRulesFilter)
                                || option.tag === this.props.appGlobals.currentBattleMech?.getType().tag )
                              .map( (option) => {
                              return (
                                <option key={option.tag} value={option.tag}>{option.name}{option.notes ? ` (${option.notes})` : ""}</option>
                              )
                            })}
                            </select>
                          </label>
                          {!this.props.appGlobals.currentBattleMech.usesEarlierRulesEdition() && this.props.appGlobals.currentBattleMech.getRequiredRulesLevel() > this.props.appGlobals.appSettings.mechRulesFilter ? (
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

                          <InputCheckbox
                            label="Is an Omnimech"
                            checked={this.props.appGlobals.currentBattleMech.isOmnimech}
                            onChange={this.toggleOmni}
                          />
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

                          <label>
                            Mech Era:
                            <select
                              value={this.props.appGlobals.currentBattleMech.getEra().tag}
                              onChange={this.updateEra}
                            >
                            {this.props.appGlobals.currentBattleMech.getAvailableEras().map( (option) => {
                              return (
                                <option key={option.tag} value={option.tag}>{option.name}</option>
                              )
                            })}
                            </select>
                          </label>
                          {this.props.appGlobals.currentBattleMech.getEra().description ? (
                            <p className="smaller-text">{this.props.appGlobals.currentBattleMech.getEra().description}</p>
                          ) : null}

                          {this.props.appGlobals.currentBattleMech.canUseFractionalAccounting( this.props.appGlobals.appSettings.mechRulesFilter )
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
                            {getAvailableTonnagesForMechType(
                              this.props.appGlobals.currentBattleMech.getType().tag,
                              this.props.appGlobals.appSettings.mechRulesFilter,
                              this.props.appGlobals.currentBattleMech.getTech().tag,
                              this.props.appGlobals.currentBattleMech.getRulesEdition()
                            ).map( (option) => {
                              return (
                                <option key={option.tons} value={option.tons}>{option.tons} ({option.type})</option>
                              )
                            })}
                            </select>
                          </label>

                          <label>
                            Internal Structure Type:
                            <select
                              value={this.props.appGlobals.currentBattleMech.getInternalStructureType()}
                              onChange={this.updateStructureType}
                            >
                            {this.props.appGlobals.currentBattleMech.getAvailableInternalStructures(this.props.appGlobals.appSettings.mechRulesFilter).map( (option) => {
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

                          {this.props.appGlobals.currentBattleMech.isFrankenMech() || this.props.appGlobals.currentBattleMech.canBeFrankenMech(this.props.appGlobals.appSettings.mechRulesFilter) ? (
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
                                    const offered = currentMech.getFrankenMechDonorStructures(this.props.appGlobals.appSettings.mechRulesFilter)
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