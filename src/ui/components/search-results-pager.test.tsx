// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { paginate } from "../../utils/paginate";
import SearchResultsPager from "./search-results-pager";

afterEach(cleanup);

describe("SearchResultsPager", () => {
    // Two navigation landmarks on one page need different names (axe landmark-unique, #325's pager above and below).
    it("names the pager below the results apart from the one above", () => {
        const page = paginate(Array.from({ length: 60 }, (_, index) => index), 0, 25);
        render(<><SearchResultsPager page={page} onGo={() => undefined} /><SearchResultsPager page={page} onGo={() => undefined} below /></>);
        expect(screen.getAllByRole("navigation").map((nav) => nav.getAttribute("aria-label")))
            .toEqual(["Search results pages", "Search results pages (below the results)"]);
    });
});
