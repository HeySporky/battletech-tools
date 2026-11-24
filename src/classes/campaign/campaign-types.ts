import type { Campaign } from "./campaign";
import type { IContractSheet } from "./contract-sheet";

/*
 * The shared campaign record (campaign play design, 2026-11-19). Editions are data that plug into the hooks below;
 * the hook list and the time steps were approved by NGCFells at the survey check-in (2026-11-19).
 */

export const CAMPAIGN_EXPORT_VERSION = 1;

/** Travel is a duration in days logged against the step, never a step of its own. */
export type CampaignTimeStep = "month" | "turn" | "track" | "sortie";

export type CampaignSideRole = "attacker" | "defender" | "other";

export type FightSize = "lance" | "company" | "battalion" | "regiment";

export interface ICampaignSide {
    id: string;
    name: string;
    role: CampaignSideRole;
}

export interface ICampaignLedgerEntry {
    id: string;
    sideId: string;
    step: number;
    amount: number;
    currency: string;
    reason: string;
    rule: string;
}

export interface ICampaignLogEntry {
    id: string;
    step: number;
    text: string;
}

export interface ICampaignDot {
    id: string;
    type: string;
    destroyed: boolean;
}

export interface ICampaignArea {
    id: string;
    name: string;
    terrain: string;
    controllerSideId: string | null;
    dots: ICampaignDot[];
    /** The GM's chosen combination ids, in order; null = the best grouping is picked. */
    comboOverride: string[] | null;
    /** BattleForce 2: control seized in battle rather than held by default. */
    seized?: boolean;
    /** The Objectives site this area was seeded from. */
    siteId?: string;
}

/** A GM-added dot type. Value defaults to 1,000,000; destruction target to 8 (the middle of the table). */
export interface ICustomDotType {
    id: string;
    name: string;
    value: number;
    target: number;
}

/** A combination the GM sets (Best of Future Wars p.33: "double or even triple"). */
export interface ICampaignCombination {
    id: string;
    name: string;
    /** Dot type id -> how many. */
    needs: Record<string, number>;
    multiplier: 2 | 3;
}

export interface ICampaignPlanet {
    /** The star catalog's system id, or null for a free-text planet. */
    systemId: string | null;
    name: string;
    areas: ICampaignArea[];
    customDotTypes: ICustomDotType[];
    customCombinations: ICampaignCombination[];
}

export interface ICampaignTarget {
    id: string;
    sideId: string;
    systemId: string;
    intent: "travel" | "assault" | "defend";
}

/** A unit in the campaign's force: a reference to the saved unit plus a snapshot to play from (campaign-force.ts). */
export interface ICampaignForceUnit {
    id: string;
    sideId: string;
    kind: "battlemech" | "alpha-strike";
    savedId: string | null;
    name: string;
    cost: number | null;
    bv: number | null;
    pv: number | null;
    snapshot: unknown;
    status: string;
}

export interface ICampaignCost {
    amount: number;
    currency: string;
}

export interface ICampaignBattleResult {
    areaId?: string;
    sides: { sideId: string; size: FightSize; losses: string[] }[];
    heldBySideId: string | null;
}

/** Filled out by the unit editions plan. */
export interface ICampaignContract {
    id: string;
    name: string;
    terms: Record<string, unknown>;
}

/** An edition implements only the hooks its book prints; the screens show only the steps it has. */
export interface ICampaignEdition {
    id: string;
    name: string;
    source: { title: string; publication: string; pages: string };
    kind: "unit" | "planet" | "both";
    currency: string;
    timeStep: CampaignTimeStep;
    onStep?( c: Campaign ): void;
    afterBattle?( c: Campaign, result: ICampaignBattleResult ): void;
    repairCost?( c: Campaign, unit: ICampaignForceUnit, damage: unknown ): ICampaignCost & { days?: number };
    purchaseCost?( c: Campaign, unit: ICampaignForceUnit ): ICampaignCost;
    contractOffer?( c: Campaign, terms: Record<string, unknown> ): ICampaignContract;
    contractPay?( c: Campaign, contract: ICampaignContract ): Omit<ICampaignLedgerEntry, "id">[];
    rating?( c: Campaign ): { value: number | string; label: string };
    supply?( c: Campaign ): void;
    control?( c: Campaign, area: ICampaignArea, result: ICampaignBattleResult ): void;
    travelTime?( c: Campaign, fromSystemId: string, toSystemId: string ): { days: number; jumps: number };
}

export interface ICampaignExport {
    version: 1;
    id: string;
    name: string;
    editionId: string | null;
    rulesetIds: string[];
    startDate: string;
    step: number;
    sides: ICampaignSide[];
    targets: ICampaignTarget[];
    force: ICampaignForceUnit[];
    ledger: ICampaignLedgerEntry[];
    log: ICampaignLogEntry[];
    planet: ICampaignPlanet | null;
    editionState: unknown;
    /** Mercenary Contract Record Sheets (#639); absent in saves made before them. */
    contractSheets?: IContractSheet[];
}
