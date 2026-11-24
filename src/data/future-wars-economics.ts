import { ICampaignArea, ICampaignLedgerEntry, ICampaignSide, ICustomDotType } from "../classes/campaign/campaign-types";

/*
 * Economics, Herb Barents: Future Wars #5 (1987) pp.5-6 and The Best of Future Wars, Volume One (1991) pp.33-34.
 * Both printings merged into one ruleset by NGCFells's decision (2026-11-19):
 *  - each live dot pays 1,000,000 C a quarter to the area's controller;
 *  - a combination counts only when its dots are in the same area (Best of);
 *  - FW #5's three combinations pay their printed totals; any other the GM defines pays double or triple its dots;
 *  - a dot sits in one combination at most ("you cannot use ALL of the dots in conjunction with other dots", FW #5);
 *    the grouping that pays most is picked unless the GM sets one.
 */

export type FwDotType = "light-manufacturing" | "heavy-manufacturing" | "mining" | "radioactive-materials" | "oil" | "food" | "refining" | "processing";

export const FW_DOT_TYPES: { id: FwDotType; name: string }[] = [
    { id: "light-manufacturing", name: "Light manufacturing" },
    { id: "heavy-manufacturing", name: "Heavy manufacturing" },
    { id: "mining", name: "Mining" },
    { id: "radioactive-materials", name: "Radioactive materials" },
    { id: "oil", name: "Oil" },
    { id: "food", name: "Food" },
    { id: "refining", name: "Refining" },
    { id: "processing", name: "Processing" },
];

/** A dot's quarterly income, both printings. */
export const FW_DOT_VALUE = 1000000;
/** "Payday" comes every three months, both printings. */
export const FW_PAYDAY_MONTHS = 3;

export interface IFwCombination {
    id: string;
    name: string;
    /** Dot type id -> how many of it. */
    needs: Record<string, number>;
    /** A printed total, or double / triple the sum of its dots' values. */
    pays: { total: number } | { multiplier: 2 | 3 };
    source: string;
}

export const FW_PRINTED_COMBINATIONS: IFwCombination[] = [
    { id: "mining-refining-heavy", name: "Mining, refining and heavy manufacturing", needs: { "mining": 1, "refining": 1, "heavy-manufacturing": 1 }, pays: { total: 7000000 }, source: "Future Wars #5 p.5" },
    { id: "food-processing", name: "Two food and processing", needs: { "food": 2, "processing": 1 }, pays: { total: 6000000 }, source: "Future Wars #5 p.5" },
    { id: "oil-refining-processing", name: "Oil, refining and processing", needs: { "oil": 1, "refining": 1, "processing": 1 }, pays: { total: 12000000 }, source: "Future Wars #5 p.5" },
];

export interface IFwAreaIncome {
    total: number;
    used: { comboId: string; dotIds: string[]; pays: number }[];
    /** Live dots in no combination (each pays its own value). */
    loose: string[];
}

const dotValue = ( type: string, custom: ICustomDotType[] ): number =>
    custom.find( ( t ) => t.id === type )?.value ?? FW_DOT_VALUE;

const comboPays = ( combo: IFwCombination, custom: ICustomDotType[] ): number => {
    if( "total" in combo.pays ) return combo.pays.total;
    let sum = 0;
    for( const [type, count] of Object.entries( combo.needs ) ) sum += dotValue( type, custom ) * count;
    return sum * combo.pays.multiplier;
}

const fits = ( combo: IFwCombination, counts: Map<string, number> ): boolean =>
    Object.entries( combo.needs ).every( ( [type, count] ) => count > 0 && ( counts.get( type ) ?? 0 ) >= count ) &&
    Object.keys( combo.needs ).length > 0;

const takeFrom = ( counts: Map<string, number>, combo: IFwCombination ): Map<string, number> => {
    const next = new Map( counts );
    for( const [type, count] of Object.entries( combo.needs ) ) next.set( type, ( next.get( type ) ?? 0 ) - count );
    return next;
}

const looseValue = ( counts: Map<string, number>, custom: ICustomDotType[] ): number => {
    let sum = 0;
    counts.forEach( ( count, type ) => { sum += count * dotValue( type, custom ); } );
    return sum;
}

/** The combinations (by index into combos) that pay most for these counts; fewer combinations win a tie. */
const bestGrouping = ( counts: Map<string, number>, combos: IFwCombination[], custom: ICustomDotType[] ): number[] => {
    const types = Array.from( counts.keys() ).sort();
    const memo = new Map<string, { pay: number; picks: number[] }>();
    const solve = ( current: Map<string, number>, from: number ): { pay: number; picks: number[] } => {
        const key = from + "|" + types.map( ( t ) => current.get( t ) ?? 0 ).join( "," );
        const known = memo.get( key );
        if( known ) return known;
        let best = { pay: looseValue( current, custom ), picks: [] as number[] };
        // Combinations are tried in order from `from`, so each grouping is counted once, not once per ordering.
        for( let i = from; i < combos.length; i++ ) {
            if( !fits( combos[i], current ) ) continue;
            const rest = solve( takeFrom( current, combos[i] ), i );
            const pay = comboPays( combos[i], custom ) + rest.pay;
            if( pay > best.pay || ( pay === best.pay && rest.picks.length + 1 < best.picks.length ) ) {
                best = { pay, picks: [i, ...rest.picks] };
            }
        }
        memo.set( key, best );
        return best;
    };
    return solve( counts, 0 ).picks;
}

/** An area's quarterly income: the GM's grouping when set (combinations that no longer fit are skipped), else the
 * grouping that pays most. Destroyed dots pay nothing and join no combination. */
export const getBestAreaIncome = ( area: ICampaignArea, combos: IFwCombination[], custom: ICustomDotType[] ): IFwAreaIncome => {
    const live = area.dots.filter( ( dot ) => !dot.destroyed );
    let counts = new Map<string, number>();
    for( const dot of live ) counts.set( dot.type, ( counts.get( dot.type ) ?? 0 ) + 1 );

    let picks: IFwCombination[];
    if( area.comboOverride ) {
        picks = [];
        for( const id of area.comboOverride ) {
            const combo = combos.find( ( c ) => c.id === id );
            if( combo && fits( combo, counts ) ) {
                picks.push( combo );
                counts = takeFrom( counts, combo );
            }
        }
    } else {
        picks = bestGrouping( counts, combos, custom ).map( ( i ) => combos[i] );
    }

    const unused = [...live];
    const used = picks.map( ( combo ) => {
        const dotIds: string[] = [];
        for( const [type, count] of Object.entries( combo.needs ) ) {
            for( let n = 0; n < count; n++ ) {
                const at = unused.findIndex( ( dot ) => dot.type === type );
                dotIds.push( unused[at].id );
                unused.splice( at, 1 );
            }
        }
        return { comboId: combo.id, dotIds, pays: comboPays( combo, custom ) };
    } );
    const total = used.reduce( ( sum, u ) => sum + u.pays, 0 ) +
        unused.reduce( ( sum, dot ) => sum + dotValue( dot.type, custom ), 0 );
    return { total, used, loose: unused.map( ( dot ) => dot.id ) };
}

/** One ledger entry per side that controls at least one paying area; an area with no controller pays no one. */
export const getPayday = (
    areas: ICampaignArea[],
    sides: ICampaignSide[],
    combos: IFwCombination[],
    custom: ICustomDotType[],
    step: number,
): Omit<ICampaignLedgerEntry, "id">[] => {
    const entries: Omit<ICampaignLedgerEntry, "id">[] = [];
    for( const side of sides ) {
        const paying = areas
            .filter( ( area ) => area.controllerSideId === side.id )
            .map( ( area ) => ( { area, total: getBestAreaIncome( area, combos, custom ).total } ) )
            .filter( ( a ) => a.total > 0 );
        if( paying.length === 0 ) continue;
        entries.push( {
            sideId: side.id,
            step,
            amount: paying.reduce( ( sum, a ) => sum + a.total, 0 ),
            currency: "C-bills",
            reason: "Payday: " + paying.map( ( a ) => `${a.area.name} ${a.total.toLocaleString( "en-US" )}` ).join( "; " ),
            rule: "fw-economics",
        } );
    }
    return entries;
}
