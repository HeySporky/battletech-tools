import { IPage } from '../../utils/paginate';
import type { JSX } from "react";

/**
 * First/Prev/Next/Last buttons for a paged list of search results; nothing when it fits on one page. The copy `below`
 * the results gets its own name, since two navigation landmarks on a page must differ.
 */
export default function SearchResultsPager<T>( props: { page: IPage<T>; onGo( page: number ): void; below?: boolean } ): JSX.Element | null {
    const resultsPage = props.page;
    if( resultsPage.totalPages < 2 ) {
        return null;
    }
    const isFirst = resultsPage.page === 0;
    const isLast = resultsPage.page === resultsPage.totalPages - 1;

    return (
        <nav className="text-center" aria-label={props.below ? "Search results pages (below the results)" : "Search results pages"}>
            <button className="btn btn-sm btn-secondary" disabled={isFirst} onClick={() => props.onGo(0)} title="First page">&laquo;</button>
            <button className="btn btn-sm btn-secondary" disabled={isFirst} onClick={() => props.onGo(resultsPage.page - 1)} title="Previous page">&lsaquo; Prev</button>
            &nbsp;Page {resultsPage.page + 1} of {resultsPage.totalPages}&nbsp;
            <button className="btn btn-sm btn-secondary" disabled={isLast} onClick={() => props.onGo(resultsPage.page + 1)} title="Next page">Next &rsaquo;</button>
            <button className="btn btn-sm btn-secondary" disabled={isLast} onClick={() => props.onGo(resultsPage.totalPages - 1)} title="Last page">&raquo;</button>
        </nav>
    );
}
