export interface IPage<T> {
    items: T[];
    // Zero-based, clamped to the pages that exist.
    page: number;
    totalPages: number;
    // Positions of the first and last item on this page within the full list.
    firstIndex: number;
    lastIndex: number;
}

// Slices one page out of a list. An out-of-range page is clamped, so callers can hold a stale
// page number across a new search without landing on an empty page.
export function paginate<T>(items: T[], page: number, pageSize: number): IPage<T> {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const clampedPage = Math.min(Math.max(0, Math.floor(page)), totalPages - 1);
    const firstIndex = clampedPage * pageSize;
    const pageItems = items.slice(firstIndex, firstIndex + pageSize);

    return {
        items: pageItems,
        page: clampedPage,
        totalPages,
        firstIndex,
        lastIndex: firstIndex + pageItems.length - 1,
    };
}
