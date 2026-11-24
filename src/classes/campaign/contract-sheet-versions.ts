/**
 * The contract forms the books print (#639), each read on its page image (ResourceLibrary text/_corrected_pages.md,
 * 2026-11-20). Record sheets share one layout and differ in their Common Costs/Pay panel; contracts and the
 * negotiation worksheet are text with blanks. Printed misprints are kept, except Hinterlands' "Contact Terms".
 */

export type TContractFormKind = "record" | "document";

export interface IContractFormSource {
    title: string;
    pages: string;
    note?: string;
}

/** A line of the Common Costs/Pay panel. */
export interface ICommonCostLine { label: string; value: string }
export interface ICommonCostGroup { heading: string; lines: ICommonCostLine[] }

/** A blank in a document's text: a one-line field (width in characters), a check box, or a box for several lines. */
export type TFormPart =
    | string
    | { f: string; w?: number; label?: string }
    | { c: string; label?: string }
    | { area: string; rows: number; label?: string };

export type TFormBlock =
    | { type: "title"; text: string }
    | { type: "heading"; text: string }
    | { type: "para"; parts: TFormPart[]; indent?: boolean; lead?: string }
    /** A negotiation row: the item, then Starting Position, Mercenary Negotiation, Employer Counter, Final Position, BP Cost/Value. */
    | { type: "negotiation"; label: string; id: string; fixed?: boolean; note?: string }
    | { type: "negotiation-head" }
    | { type: "table"; head: string[]; rows: string[][] }
    | { type: "page-break" };

export interface IContractFormBase {
    id: string;
    /** The version's name in the picker. */
    name: string;
    source: IContractFormSource;
    kind: TContractFormKind;
}

export interface IRecordForm extends IContractFormBase {
    kind: "record";
    /** The title box, one entry a line. */
    title: string[];
    commonCosts: ICommonCostGroup[];
    /** The Mallory's World extras: the Loneliness Island panel and the option boxes under the ledger. */
    mallorysWorld?: boolean;
}

export interface IDocumentForm extends IContractFormBase {
    kind: "document";
    blocks: TFormBlock[];
    /** Fields that name a sheet in the list, first filled one wins. */
    labelFields: string[];
}

export type TContractForm = IRecordForm | IDocumentForm;

const TRAVEL_AND_MAINTENANCE: ICommonCostLine[] = [
    { label: "Travel:", value: "300 SP × Scale" },
    { label: "Mon. Maintenance:", value: "500 SP × Scale" },
];

const BV_SUPPORT: ICommonCostGroup[] = [
    { heading: "Support:", lines: [
        { label: "Repair (Armor only):", value: "Ton/2" },
        { label: "Repair (Structure/Critical):", value: "Ton × 2" },
        { label: "Repair (Crippled):", value: "Ton × 3" },
        { label: "Repair (Destroyed):", value: "Ton × 5" },
        { label: "Rearm:", value: "10 SP/Ton" },
        { label: "Purchase ’Mech:", value: "BV or PV × 40" },
        { label: "Sell (Repaired) ’Mech:", value: "BV/2 or PV × 20" },
    ] },
    { heading: "Salvage:", lines: [
        { label: "Salvage Value:", value: "BV/2 or PV × 20" },
    ] },
];

const DRACONIS_REACH_COSTS: ICommonCostGroup[] = [
    { heading: "Contract Terms:", lines: TRAVEL_AND_MAINTENANCE },
    { heading: "Combat Bonus:", lines: [
        { label: "Broke Contract:", value: "0" },
        { label: "Unsuccessful:", value: "250 SP × Scale" },
        { label: "Success:", value: "500 SP × Scale" },
        { label: "All Obj:", value: "750 SP × Scale" },
    ] },
    ...BV_SUPPORT,
];

const BASE_PAY_BONUS_FIRST: ICommonCostLine[] = [
    { label: "No Obj/Lost Units:", value: "0" },
    { label: "1+Obj:", value: "50% Base Pay" },
    { label: "Success:", value: "100% Base Pay" },
    { label: "All Obj:", value: "150% Base Pay" },
];

const RECORD_SHEET_TITLE = ["MERCENARY CONTRACT", "RECORD SHEET"];

const signatures = ( commanderLabel: string ): TFormBlock[] => [
    { type: "para", parts: [ "Signed at ", { f: "signedAt1", w: 26 }, " on this ", { f: "signedDay1", w: 5 }, " day of ", { f: "signedMonth1", w: 8 }, ", in the year ", { f: "signedYear1", w: 8 } ] },
    { type: "para", parts: [ `${commanderLabel} `, { f: "commanderSignature", w: 60 } ] },
    { type: "para", parts: [ "Signed at ", { f: "signedAt2", w: 26 }, " on this ", { f: "signedDay2", w: 5 }, " day of ", { f: "signedMonth2", w: 8 }, ", in the year ", { f: "signedYear2", w: 8 } ] },
    { type: "para", parts: [ "Employer ", { f: "employerSignature", w: 60 } ] },
    { type: "para", parts: [ "Witnessed by: ", { f: "witness", w: 60 } ] },
];

/** Contract of Mercenary Employment. `who` is the printed name for the mercenary side: Command (Hot Spots) or Unit (Mercenaries). */
function employmentContract( who: "Command" | "Unit" ): TFormBlock[] {
    const hs = who === "Command";
    return [
        { type: "title", text: "CONTRACT OF MERCENARY EMPLOYMENT" },
        { type: "para", parts: [
            "This agreement executed between ", { f: "employer", w: 34, label: "Employer" }, ` (hereafter designated “Employer”) and `,
            { f: "mercenary", w: 34, label: who }, ` (hereafter designated “${who}”)${hs ? "" : ","} provides employment for the ${who} military forces in the service of the Employer. This employment is subject to the terms and conditions outlined below.`,
        ] },
        { type: "para", lead: "I. ASSIGNMENT:", parts: [
            ` The ${who} is hired for the performance of a mission planned and assigned by the Employer, defined as a(n) `, { f: "contractType", w: 20, label: "Contract type" },
            ` contract type under the conventions and usages of contemporary military terminology. Said ${who} will perform all operations that fall within the framework of this mission, as well as serving the general interests and needs of the Employer.`,
        ] },
        { type: "para", lead: "II. FORCES:", parts: [
            ` The ${who} agrees to provide combat and support forces, estimated at `, { f: "forces", w: 10, label: "Forces" },
            ` ${hs ? "units" : "squads"} of combat and/or combat support troops, as of the date this contract goes into effect. The Employer reserves the right to terminate the agreement if actual forces mustered at the time this contract goes into effect are less than two-thirds of the originally estimated forces or if they exceed the agreed-upon strength by more than 10 percent, unless excess troops serve for no more money than originally designated in this agreement.`,
        ] },
        { type: "para", lead: "III. LENGTH OF SERVICE:", parts: [
            " This contract will remain in effect for ", { f: "length", w: 14, label: "Length" }, ", commencing on ", { f: "commencing", w: 12, label: "Commencing" },
            " and concluding on ", { f: "concluding", w: 12, label: "Concluding" }, ".",
        ] },
        { type: "para", indent: true, parts: [
            `On the commencement date, the ${who} agrees to be located on `, { f: "location", w: 16, label: "Location" }, ". The Employer agrees to pay ",
            { f: "transportCostPercent", w: 6, label: "Transportation cost percent" },
            ` percent of the transportation costs incurred by the ${who} to reach the location. Upon termination of the agreement, the ${who} will be discharged from all duties and responsibilities to the Employer, unless discharge is superseded by a new agreement.`,
        ] },
        { type: "para", lead: "IV. REMUNERATION:", parts: [
            " The Employer agrees to pay ", { f: "monthlyPay", w: 20, label: "Monthly pay" },
            ` per month to the ${who}. This money is to be held in escrow agreed upon by both parties. Combat bonuses based on this amount will be paid for engaging in combat (one-half), successfully completing the defined objectives of the combat (one-half), and for exemplary service (another one-half) for a maximum combat bonus of one and a half times the monthly remuneration.`,
        ] },
        { type: "para", lead: "V. SUPPORT:", parts: [
            " The Employer agrees to provide ", { f: "supportPercent", w: 8, label: "Support percent" },
            ` percent of the logistical support of the ${who}. The Employer will reimburse the ${who} for the ${hs ? "value" : "amount of C-bills"} if the ${who} provides its own supplies. Resupply of munitions and other specific battlefield matériel after each major battle or campaign shall consist of `,
            { f: "resupplyPercent", w: 8, label: "Resupply percent" }, " percent over and above said supply requirements.",
        ] },
        { type: "para", lead: "VI. TRANSPORTATION:", parts: [
            " The Employer agrees to provide for ", { f: "transportPercent", w: 8, label: "Transport percent" },
            ` percent of the interstellar and/or interplanetary transport of the ${who}. The Employer shall pay the ${who} any standard and customary costs to reimburse the ${who} for providing transport for the Unit or any part thereof.`,
        ] },
        { type: "para", lead: "VII. SALVAGE RIGHTS:", parts: [
            ` All enemy combat equipment recovered during the operation of this contract shall be divided between the Employer and the ${who}, with the unit receiving `,
            { f: "salvagePercent", w: 8, label: "Salvage percent" }, " percent of the estimated market value of the equipment.",
        ] },
        hs
            ? { type: "para", lead: "VIII. RIGHTS:", parts: [ " The Unit hereby agrees to structures of the following nature:" ] }
            : { type: "para", lead: "VIII. COMMAND RIGHTS:", parts: [ " The Unit hereby agrees to command structures of the following nature:" ] },
        { type: "para", parts: [ { f: "commandRights", w: 90, label: "Command rights" } ] },
        { type: "para", indent: true, parts: [ hs
            ? "The Command is guaranteed to retain internal coherence and consistency of its structure within the usual limits of this assigned status."
            : "The Unit is guaranteed to retain internal coherence and consistency of its command structure within the usual limits of this assigned command status." ] },
        { type: "para", lead: "IX. BATTLEFIELD CONDUCT:", parts: [
            ` The ${who} agrees to battlefield conduct as set forth by the Ares Conventions. Any violations of said conventions are solely the responsibility of the ${who} and render this contract and further payments null and void.`,
        ] },
        { type: "para", lead: "X. OTHER TERMS:", parts: [
            " Other terms of this contract, agreed to by both parties, shall be negotiated on a case-by-case basis, individual signed and witnessed, as riders to this document.",
        ] },
        ...signatures( "Unit Commander" ),
    ];
}

const MH1987_CONTRACT: TFormBlock[] = [
    { type: "title", text: "MERCENARY CONTRACT" },
    { type: "para", indent: true, parts: [
        "This agreement, executed between ", { f: "employer", w: 18, label: "Employer" }, ` (hereafter designated "Employer") and `, { f: "mercenary", w: 22, label: "Unit" },
        ` (hereafter designated "Unit"), provides employment for the Unit and military and support forces in the service of the Employer. This employment is subject to the terms and conditions outlined below.`,
    ] },
    { type: "para", lead: "I. Mission:", parts: [
        " The Unit is hired for the performance of a mission planned and assigned by the Employer, defined as a ", { f: "mission", w: 12, label: "Mission" },
        " mission under the conventions and usages of contemporary military terminology. Said Unit will perform all operations that fall within the framework of this mission, as well as serving the general interests and needs of the Employer. If the Unit has been hired on retainer, the following types of missions are specifically excluded during the length of service: ",
        { f: "excludedMissions", w: 40, label: "Excluded missions" },
    ] },
    { type: "para", lead: "II. Forces:", parts: [
        " The Unit agrees to provide combat and support forces, estimated at ", { f: "forces", w: 6, label: "Forces" },
        " squads of combat and/or combat support troops, as of the date this contract goes into effect. The Employer reserves the right to terminate the agreement if actual forces mustered at the time this contract goes into effect are 75 percent or less of the originally estimated forces, or if they exceed the agreed-upon strength by more than 10 percent, unless excess troops serve for no more money than originally designated in this agreement.",
    ] },
    { type: "para", lead: "III. Length of Service:", parts: [
        " This contract will remain in effect for ", { f: "months", w: 10, label: "Months" }, " months, commenceing on ", { f: "commencing", w: 14, label: "Commencing" },
        " and concluding on ", { f: "concluding", w: 14, label: "Concluding" }, ". On the commencement date, the Unit agrees to be located on ", { f: "location", w: 20, label: "Location" },
        "; if the Unit fails to appear by said date, Unit shall reliquish 5 percent of its fee. Upon termination of the agreement, the Unit will be discharged from all duties and responsibilities to the employer, unless discharge is superceded by a fresh agreement.",
    ] },
    { type: "para", lead: "IV. Remuneration:", parts: [
        " The Employer agrees to pay ", { f: "payPerSquad", w: 10, label: "Pay per squad" }, " C-Bill-equivalents per squad per month to the Unit, amounting to an estimated total of ",
        { f: "payTotal", w: 8, label: "Estimated total" }, " C-Bill-equivalents. This money is to be paid out in the following manner:",
    ] },
    { type: "para", parts: [ { area: "payManner", rows: 3, label: "Manner of payment" } ] },
    { type: "para", lead: "V. Command Rights:", parts: [
        " The Unit hereby agrees to place itself under the overall military direction of the Employer. The Employer will implement this direction through the assignment of ",
        { f: "commandAssignment", w: 28, label: "Command assignment" },
        " to the unit for the period of the contract. The Unit is guaranteed to retain internal coherence and consistency of its command structure within the usual limits of this assigned command status.",
    ] },
    { type: "para", lead: "VI. Transport:", parts: [
        " The Employer agrees to provide for the interstellar and/or interplanetary transport of the Unit. ", { f: "interstellarPercent", w: 8, label: "Interstellar percent" },
        " percent of the Unit accepts Employer interstellar transport, and ", { f: "interplanetaryPercent", w: 8, label: "Interplanetary percent" },
        " percent of the Unit accepts Employer interplanetary transport. The Employer shall pay the Unit ", { f: "transportPay", w: 12, label: "Transport reimbursement" },
        " to reimburse Unit for providing transport for the Unit or any part thereof.",
    ] },
    { type: "para", lead: "VII. Supply:", parts: [
        " The Employer agrees to provide the amount of ", { f: "supplyAmount", w: 12, label: "Supply amount" }, " for the logistical support of the Unit. The Employer will reimburse the Unit for the amount of ",
        { f: "supplyReimbursement", w: 14, label: "Supply reimbursement" },
        " if Unit provides its own supplies. Resupply of munitions and other specific battlefield materiel after each major battle or campaign shall consist of ",
        { f: "resupply", w: 26, label: "Resupply" }, " over and above said supply requirements.",
    ] },
    { type: "para", lead: "VIII. Salvage Rights:", parts: [
        " All equipment, vehicles, and other war materiel recovered by the Unit from enemy forces, depots, garrisons, industrial or civil centers, prisoners, and other sources shall be subject to the following claims and terms of division:",
    ] },
    { type: "para", parts: [ { area: "salvageTerms", rows: 3, label: "Salvage terms" } ] },
    { type: "para", lead: "IX. Other Terms:", parts: [
        " Other terms of this contract, agreed to by both parties, shall be negotiated on a case by case basis and attached, individually signed and witnessed, as riders to this document.",
    ] },
    { type: "para", parts: [ "Signed at ", { f: "signedAt1", w: 22 }, " on this ", { f: "signedDay1", w: 6 }, " day of ", { f: "signedMonth1", w: 14 }, ", in the year ", { f: "signedYear1", w: 8 } ] },
    { type: "para", indent: true, parts: [ { f: "commanderSignature", w: 30, label: "Unit signature" } ] },
    { type: "para", indent: true, parts: [ "Commanding ", { f: "commanding", w: 22, label: "Commanding" } ] },
    { type: "para", parts: [ "Signed at ", { f: "signedAt2", w: 22 }, " on this ", { f: "signedDay2", w: 6 }, " day of ", { f: "signedMonth2", w: 14 }, ", in the year ", { f: "signedYear2", w: 8 } ] },
    { type: "para", indent: true, parts: [ { f: "employerSignature", w: 30, label: "Employer signature" } ] },
    { type: "para", indent: true, parts: [ "For ", { f: "for", w: 26, label: "For" } ] },
    { type: "para", indent: true, parts: [ "Witnessed by: ", { f: "witness", w: 20 } ] },
    { type: "para", indent: true, parts: [ { f: "witness2", w: 30, label: "Witness 2" } ] },
    { type: "para", indent: true, parts: [ { f: "witness3", w: 30, label: "Witness 3" } ] },
    { type: "para", indent: true, parts: [ { f: "witness4", w: 30, label: "Witness 4" } ] },
];

const seize = ( prefix: string, who: "Mercenary" | "Employer", sign: "–" | "+" ): TFormPart[] =>
    [ { c: `${prefix}${who === "Mercenary" ? "MercSeizes" : "EmpSeizes"}` }, ` ${who} seizes agenda (${sign}`, { f: `${prefix}${who === "Mercenary" ? "MercSeizesBp" : "EmpSeizesBp"}`, w: 4 }, " BP) " ];

const FMM_WORKSHEET: TFormBlock[] = [
    { type: "title", text: "MERCENARY CONTRACT WORKSHEET" },
    { type: "heading", text: "GENERAL INFORMATION" },
    { type: "para", parts: [ "Contract Date: ", { f: "contractDate", w: 18 }, "  Hiring Hall, World: ", { f: "hiringHall", w: 22 } ] },
    { type: "para", parts: [ "Mercenary Command Name: ", { f: "mercenary", w: 20 }, "  Employer: ", { f: "employer", w: 24 } ] },
    { type: "para", parts: [ "Mercenary Negotiator (TN): ", { f: "mercNegotiator", w: 14 }, " (+", { f: "mercNegotiatorTn", w: 3 }, ")  Employer Negotiator (TN): ", { f: "empNegotiator", w: 14 }, " (+", { f: "empNegotiatorTn", w: 3 }, ")" ] },
    { type: "para", indent: true, parts: [ "Freelance Negotiator Fee: ", { f: "freelanceFee", w: 10 }, " C-bills" ] },
    { type: "para", parts: [ "Mercenary Rating (Value): ", { f: "rating", w: 8 }, " (", { f: "ratingValue", w: 6 }, ")  Base BP: ", { f: "baseBp", w: 8 } ] },
    { type: "para", parts: [ "Negotiator Skill TN Modifier: [(Mercenary) ", { f: "skillMerc", w: 4 }, " – (Employer) ", { f: "skillEmp", w: 4 }, " ] (x 10% BP)  BP Modifier: ", { f: "bpModSkill", w: 8 } ] },
    { type: "para", parts: [ { c: "hallMrbc" }, " Galatea or Outreach (MRBC) Hiring Hall  ", { c: "hallOther" }, " Other Hiring Hall (–5% BP)  BP Modifier: ", { f: "bpModHall", w: 8 } ] },
    { type: "para", parts: [ { c: "notInDebt" }, " Mercenary Command not in debt (War Chest > 0 C-bills)  ", { c: "inDebt" }, " Command in debt (–10% BP)  BP Modifier: ", { f: "bpModDebt", w: 8 } ] },
    { type: "para", parts: [ { c: "twoPlayer" }, " Two-player negotiation (gamemastered)  ", { c: "onePlayer" }, " One-player negotiation (–10% BP)  BP Modifier: ", { f: "bpModPlayers", w: 8 } ] },
    { type: "para", parts: [ "Final BP Pool: ", { f: "finalBpPool", w: 10 } ] },
    { type: "heading", text: "CONTRACT NEGOTIATION" },
    { type: "negotiation-head" },
    { type: "negotiation", label: "Contract Type:", id: "type", fixed: true, note: "(non-negotiable)" },
    { type: "negotiation", label: "Base Contract Length:", id: "length" },
    { type: "para", parts: [ ...seize( "length", "Mercenary", "–" ), "Mercenary: –5 BP per month increased/decreased, max +/– 3 months" ] },
    { type: "para", indent: true, parts: [ { c: "lengthDeleteEscape" }, " +10 BP to delete emergency escape clause." ] },
    { type: "para", parts: [ ...seize( "length", "Employer", "+" ), "Employer: +10 BP per month increased/decreased, max +/– 3 months" ] },
    { type: "para", parts: [ { f: "lengthExtensions", w: 6, label: "Contract extensions" }, " Contract extensions (3 standard)  –10 BP per extension clause deleted (if mercenary seeks shorter term), max -3. –10 BP per extension clause added (if mercenary seeks longer term), max +3." ] },
    { type: "negotiation", label: "Base Pay Multiplier:", id: "pay" },
    { type: "para", parts: [ { c: "payAdmin" }, " Veteran (or better) Mercenary Human Resources Administrator (+5 BP, this item only)" ] },
    { type: "para", parts: [ ...seize( "pay", "Mercenary", "–" ), "Mercenary: –5 BP per +0.1 multiplier, +2 BP per –0.1 multiplier (max +/– 1.0)" ] },
    { type: "para", parts: [ ...seize( "pay", "Employer", "+" ), "Employer: –5 BP per +0.2 multiplier, +4 BP per –0.1 multiplier (max +/– 1.0)" ] },
    { type: "negotiation", label: "Command Rights:", id: "command" },
    { type: "para", parts: [ { c: "commandAdmin" }, " Veteran (or better) Mercenary Command Administrator (+5 BP, this item only)" ] },
    { type: "para", parts: seize( "command", "Mercenary", "–" ) },
    { type: "table", head: [ "Employer Offers", "Mercenary Counter (BP)" ], rows: [
        [ "Independent", "Liaison (+5)" ],
        [ "Liaison", "Independent (–20)" ],
        [ "House", "Independent (–30), Liaison (–10), Integrated (+5)" ],
        [ "Integrated", "Independent (–40), Liaison (–20), House (–10)" ],
    ] },
    { type: "para", parts: [ ...seize( "command", "Employer", "+" ), "Employer: -10 BP to decrease level (one-level drop, House/Liaison Command only); +8 BP to increase level (one-level increase, Independent/House Command only)" ] },
    { type: "negotiation", label: "Overhead Compensation:", id: "overhead" },
    { type: "para", parts: [ ...seize( "overhead", "Mercenary", "–" ), "Mercenary: –5 BP per level from none, to half, to full; +2 BP per level from full, to half, to none" ] },
    { type: "para", parts: [ ...seize( "overhead", "Employer", "+" ), "Employer: –2 BP per level from none, to half, to full" ] },
    { type: "negotiation", label: "Salvage Rights:", id: "salvage" },
    { type: "para", parts: [ { c: "salvageAdmin" }, " Veteran (or better) Mercenary Logistical Administrator (+5 BP, this item only)" ] },
    { type: "para", parts: [ ...seize( "salvage", "Mercenary", "–" ), "Mercenary: Add/subtract BP as indicated below for changing salvage rights type. –5 BP to increase Exchange/Shared by 5%, +3 to decrease by 5%" ] },
    { type: "table", head: [ "Employer Offers", "Mercenary Counter (BP)", "Employer Take-Back (BP)" ], rows: [
        [ "Full", "Exchange (+30), Shared (+34), None (+53)", "Exchange (+23), Shared (+26), None (+40)" ],
        [ "Shared", "Exchange (–5), Full (–45), None (+19)", "None (+14)" ],
        [ "Exchange", "Shared (+4), Full (–40), None (+23)", "Shared (+3), None (+17)" ],
        [ "None", "Exchange (–30), Shared (–25), Full (–70)", "—" ],
    ] },
    { type: "para", parts: [ ...seize( "salvage", "Employer", "+" ), "Employer: Add/subtract half Mercenary Counter BPs for changing salvage type. –3 BP to increase Exchange/Shared by 5%, +2 BP to decrease by 5%" ] },
    { type: "page-break" },
    { type: "title", text: "MERCENARY CONTRACT WORKSHEET CONTINUED" },
    { type: "negotiation-head" },
    { type: "negotiation", label: "Support Rights:", id: "support" },
    { type: "para", parts: [ { c: "supportAdmin" }, " Veteran (or better) Mercenary Administrator (any type not employed elsewhere, +5 BP for this item only)" ] },
    { type: "para", parts: [ ...seize( "support", "Mercenary", "–" ), "Mercenary: Add/subtract BP as indicated below for changing support rights type. –5 BP to increase Straight/Battle Loss by 5%, –3 BP to increase Both by 5% (per type); +3 BP to decrease Straight/Battle Loss by 5%, +3 BP to decrease Both by 5% (per type)" ] },
    { type: "table", head: [ "Employer Offers", "Mercenary Counter (BP)", "Employer Take-Back (BP)" ], rows: [
        [ "Both", "Battle Loss (+19), Straight (+26), None (+34)", "Battle Loss (+14), Straight (+20), None (+26)" ],
        [ "Battle Loss", "Both (–25), Straight (+8), None (+15)", "Straight (+6), None (+11)" ],
        [ "Straight", "Both (–35), Battle Loss (–10), None (+8)", "None (+6)" ],
        [ "None", "Both (–45), Battle Loss (–20), Straight (–10)", "—" ],
    ] },
    { type: "para", parts: [ ...seize( "support", "Employer", "+" ), "Employer: Add/subtract half Mercenary Counter BPs for changing support type. –3 BP to increase Straight/Battle Loss by 5%, –2 BP to increase Both by 5% (per type); +2 BP to decrease Straight/Battle Loss by 5%, +1 BP to decrease Both by 5% (per type)" ] },
    { type: "negotiation", label: "Transport Rights:", id: "transport" },
    { type: "para", parts: [ { c: "transportAdmin" }, " Veteran (or better) Mercenary Transport Administrator (+5 BP, this item only)" ] },
    { type: "para", parts: [ ...seize( "transport", "Mercenary", "–" ), "Mercenary: Add/subtract BP as indicated below for changing transport type. –3 BP to increase Partial by 5%, +2 BP to decrease by 5%" ] },
    { type: "table", head: [ "Employer Offers", "Mercenary Counter (BP)", "Employer Take-Back (BP)" ], rows: [
        [ "Full", "Partial (+23), None (+38)", "Partial (+17), None (+29)" ],
        [ "Partial", "Full (–30), None (+15)", "None (+11)" ],
        [ "None", "Full (–50), Partial (–20)", "—" ],
    ] },
    { type: "para", parts: [ ...seize( "transport", "Employer", "+" ), "Employer: Add/subtract half Mercenary Counter BPs for changing transport type. –2 BP to increase Partial by 5%, +1 BP to decrease by 5%" ] },
    { type: "para", parts: [ "Renegotiations: ", { f: "renegotiationsBp", w: 10, label: "Renegotiations BP" } ] },
    { type: "para", parts: [ { c: "renegotiate" }, " Renegotiations. (Note that renegotiating any point doubles the BP costs, but not the value of any concessions.)" ] },
    { type: "para", parts: [ { c: "noRenegotiate" }, " No renegotiations. Contract terms accepted as currently negotiated." ] },
    { type: "heading", text: "FINAL CONTRACT TERMS:" },
    { type: "para", parts: [ "Contract Payment (Base Monthly Salary x Base Pay Multiplier x Contract Length) = ", { f: "contractPayment", w: 14 }, " C-bills" ] },
    { type: "para", parts: [ "Contract Support Payment (Monthly Support Cost x Straight Support % x Contract Length) = ", { f: "supportPayment", w: 14 }, " C-bills" ] },
    { type: "para", parts: [ "Contract Transport Payment ([Owned Vessel Costs, FM: M(R) p. 170] x Transport %) = ", { f: "transportPayment", w: 14 }, " C-bills" ] },
    { type: "para", parts: [ "Total payment due from employer: ", { f: "totalDue", w: 14 }, " C-bills" ] },
    { type: "para", parts: [ "MRBC Handling Fee (Contracts negotiated through Outreach or Galatea only) = ", { f: "mrbcFee", w: 14 }, " C-bills" ] },
    { type: "para", parts: [ "Contract Overhead (Contract Monthly Payment x 0.05, x 0.025 if half-paid, or x 0 if fully paid) = ", { f: "overheadCost", w: 14 }, " C-bills" ] },
    { type: "para", parts: [ "Total Pre-Mission Costs: ", { f: "preMission", w: 14 }, " C-bills" ] },
    { type: "para", parts: [ "Sign-on Bonus (Total Payment Due x [BP/2]%) = ", { f: "signOn", w: 14 }, " C-bills" ] },
    { type: "para", parts: [ "Final Total Contract Payment Due (Total Payment Due – Total Pre-Mission Costs + Sign-on Bonus) = ", { f: "finalTotal", w: 14 }, " C-bills" ] },
    { type: "para", parts: [ "Advance: Up to 25% of Final Total Contract Payment (MRBC-handled contracts only) = ", { f: "advance", w: 14 }, " C-bills" ] },
    { type: "para", parts: [ "Estimated Transport Fees (Sum of owned and chartered transports, plus jumps and “hazard pay”) = ", { f: "transportFees", w: 14 }, " C-bills" ] },
];

export const DEFAULT_CONTRACT_FORM_ID = "hs-draconis-reach";

export const CONTRACT_FORMS: TContractForm[] = [
    {
        id: DEFAULT_CONTRACT_FORM_ID, kind: "record", name: "Mercenary Contract Record Sheet (Hot Spots: Draconis Reach)",
        source: { title: "Hot Spots: Draconis Reach", pages: "p.203" },
        title: RECORD_SHEET_TITLE, commonCosts: DRACONIS_REACH_COSTS,
    },
    {
        id: "hs-draconis-reach-mallorys-world", kind: "record", name: "Mallory’s World Mercenary Contract Record Sheet (Hot Spots: Draconis Reach)",
        source: { title: "Hot Spots: Draconis Reach", pages: "p.204" },
        title: ["MALLORY’S WORLD MERCENARY", "CONTRACT RECORD SHEET"], commonCosts: DRACONIS_REACH_COSTS, mallorysWorld: true,
    },
    {
        id: "hs-hinterlands", kind: "record", name: "Mercenary Contract Record Sheet (Hot Spots: Hinterlands, corrected)",
        source: { title: "Hot Spots: Hinterlands", pages: "p.151", note: "Combat Bonus as corrected by the errata (v2.41)" },
        title: RECORD_SHEET_TITLE,
        commonCosts: [
            { heading: "Contract Terms:", lines: TRAVEL_AND_MAINTENANCE },
            { heading: "Combat Bonus:", lines: [
                { label: "Broke Contract:", value: "0" },
                { label: "Unsuccessful:", value: "50% Base Pay" },
                { label: "Success:", value: "100% Base Pay" },
                { label: "All Obj:", value: "150% Base Pay" },
            ] },
            ...BV_SUPPORT,
        ],
    },
    {
        id: "hs-hinterlands-first", kind: "record", name: "Mercenary Contract Record Sheet (Hot Spots: Hinterlands, first printing)",
        source: { title: "Hot Spots: Hinterlands (first printing)", pages: "p.151", note: "its Combat Bonus lines are replaced by the errata (v2.41)" },
        title: RECORD_SHEET_TITLE,
        commonCosts: [ { heading: "Contract Terms:", lines: TRAVEL_AND_MAINTENANCE }, { heading: "Combat Bonus:", lines: BASE_PAY_BONUS_FIRST }, ...BV_SUPPORT ],
    },
    {
        id: "mercenaries", kind: "record", name: "Mercenary Contract Record Sheet (BattleTech: Mercenaries)",
        source: { title: "BattleTech: Mercenaries rulebook", pages: "p.33" },
        title: RECORD_SHEET_TITLE,
        commonCosts: [
            { heading: "Contract Terms:", lines: TRAVEL_AND_MAINTENANCE },
            { heading: "Combat Bonus:", lines: BASE_PAY_BONUS_FIRST },
            { heading: "Support:", lines: [
                { label: "Repair All Armor:", value: "Ton" },
                { label: "Repair All Internal:", value: "Ton × 2" },
                { label: "Rearm:", value: "10 SP/Ton" },
                { label: "Purchase ’Mech:", value: "Ton × 20" },
                { label: "Sell (Repaired) ’Mech:", value: "Ton × 10" },
            ] },
            { heading: "Salvage:", lines: [ { label: "Salvage Value:", value: "Ton × 10" } ] },
        ],
    },
    {
        id: "hs-employment", kind: "document", name: "Contract of Mercenary Employment (Hot Spots)",
        source: { title: "Hot Spots: Hinterlands p.152; Hot Spots: Draconis Reach", pages: "p.205" },
        blocks: employmentContract( "Command" ), labelFields: [ "mercenary", "employer" ],
    },
    {
        id: "mercenaries-employment", kind: "document", name: "Contract of Mercenary Employment (BattleTech: Mercenaries)",
        source: { title: "BattleTech: Mercenaries rulebook", pages: "p.35" },
        blocks: employmentContract( "Unit" ), labelFields: [ "mercenary", "employer" ],
    },
    {
        id: "mh1987-contract", kind: "document", name: "Mercenary Contract (Mercenary’s Handbook)",
        source: { title: "Mercenary’s Handbook (FASA 1987; FanPro 2005)", pages: "the form at the back of the book" },
        blocks: MH1987_CONTRACT, labelFields: [ "mercenary", "employer" ],
    },
    {
        id: "fmm-worksheet", kind: "document", name: "Mercenary Contract Worksheet (Field Manual: Mercenaries)",
        source: { title: "Field Manual: Mercenaries (Revised)", pages: "pp.187-188", note: "also in Mercenaries Supplemental" },
        blocks: FMM_WORKSHEET, labelFields: [ "mercenary", "employer" ],
    },
];

export const findContractForm = ( id: string | undefined ): TContractForm =>
    CONTRACT_FORMS.find( ( f ) => f.id === id ) ?? CONTRACT_FORMS[0];

export const contractFormSourceText = ( form: TContractForm ): string =>
    `${form.source.title}, ${form.source.pages}${form.source.note ? ` (${form.source.note})` : ""}`;

/** The Mallory's World extras: Loneliness Island's capturable hexes with their box counts, replacement 'Mechs, and the option boxes. */
export const MALLORYS_WORLD_HEXES: { id: string; label: string; value: string; boxes: number }[] = [
    { id: "defensive", label: "Defensive:", value: "100", boxes: 4 },
    { id: "cities", label: "Cities:", value: "500", boxes: 2 },
    { id: "irrigation", label: "", value: "(Irrig. +250)", boxes: 1 },
    { id: "yakuza", label: "Yakuza:", value: "200", boxes: 2 },
    { id: "trainingSims", label: "Training Sims:", value: "200", boxes: 1 },
    { id: "biotech", label: "Biotech:", value: "200", boxes: 1 },
    { id: "commsArray", label: "Comms. Array:", value: "400", boxes: 1 },
];
/** Five boxes, the fifth printed dashed (the BPWW option's +1 Replacement). */
export const MALLORYS_WORLD_REPLACEMENTS = 5;
export const MALLORYS_WORLD_OPTIONS: { id: string; label: string; text: string }[] = [
    { id: "lingo", label: "LINGO:", text: "−1D6 × 10% City SPs" },
    { id: "yakuzaOption", label: "Yakuza:", text: "+1D6 × 5% Maint., Recruit 4/5" },
    { id: "bpww", label: "BPWW:", text: "Purchase at +1D6 × 10%, +1 Replacement" },
];

/** Every field id a document form uses (tests check they are unique, and storage keeps only these). */
export function documentFieldIds( form: IDocumentForm ): { fields: string[]; checks: string[] } {
    const fields: string[] = [];
    const checks: string[] = [];
    for( const block of form.blocks ) {
        if( block.type === "negotiation" ) {
            if( !block.fixed ) for( const col of NEGOTIATION_COLUMNS ) fields.push( `${block.id}${col.key}` );
            else fields.push( `${block.id}Start` );
        }
        if( block.type !== "para" ) continue;
        for( const part of block.parts ) {
            if( typeof part === "string" ) continue;
            if( "c" in part ) checks.push( part.c );
            else fields.push( "f" in part ? part.f : part.area );
        }
    }
    return { fields, checks };
}

export const NEGOTIATION_COLUMNS: { key: string; label: string }[] = [
    { key: "Start", label: "Starting Position" },
    { key: "Merc", label: "Mercenary Negotiation" },
    { key: "Emp", label: "Employer Counter" },
    { key: "Final", label: "Final Position" },
    { key: "Bp", label: "BP Cost/ Value" },
];
