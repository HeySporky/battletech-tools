// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getMULEraAliases } from "../../utils/mulUtilities";
import { IMULSearchFilters, newMULSearchFilters } from "../../utils/mulSearchFilters";
import MULSearchFilters from "./mul-search-filters";

afterEach(cleanup);

const SAMPLE = /Sample: The Clans never existed/;

// The roster keeps the filters, as both rosters do in app settings.
function Harness(props: { start: IMULSearchFilters; onChange?: (filters: IMULSearchFilters) => void }) {
    const [filters, setFilters] = useState(props.start);
    return <MULSearchFilters idPrefix="test" filters={filters} onChange={(next) => { props.onChange?.(next); setFilters(next); }} />;
}

const optionValues = (label: RegExp) => Array.from((screen.getByLabelText(label) as HTMLSelectElement).options).map((option) => option.value);

describe("MULSearchFilters Special Rulesets (#324 round 4)", () => {
    it("shows the Special Rulesets step first", () => {
        const { container } = render(<Harness start={newMULSearchFilters()} />);
        const text = container.textContent ?? "";
        expect(text.indexOf("Special Rulesets:")).toBeGreaterThanOrEqual(0);
        expect(text.indexOf("Special Rulesets:")).toBeLessThan(text.indexOf("Search Terms"));
    });

    it("ticking no-Clans calls onChange with Tech and Type moved, and says so", () => {
        const onChange = vi.fn();
        render(<Harness start={newMULSearchFilters({ tech: "clan", type: 23 })} onChange={onChange} />);
        fireEvent.change(screen.getByLabelText(/Special Rulesets/), { target: { value: "yes" } });
        fireEvent.click(screen.getByRole("checkbox", { name: SAMPLE }));
        expect(onChange.mock.lastCall?.[0]).toMatchObject({ rulesets: ["sample-no-clans"], tech: "", type: 0 });
        expect(screen.getByRole("status").textContent).toMatch(/Tech moved to All/);
    });

    it("under no-Clans the lists offer no Clan tech, ProtoMech type or Clan eras", () => {
        render(<Harness start={newMULSearchFilters({ rulesets: ["sample-no-clans"] })} />);
        expect(optionValues(/Search Tech/)).not.toContain("clan");
        expect(optionValues(/Type/)).not.toContain("23");
        const aliases = getMULEraAliases().map((alias) => String(alias.id));
        expect(optionValues(/Era/).some((value) => aliases.includes(value))).toBe(false);
    });

    it("a stored value the lists do not offer stays selected and flagged", () => {
        render(<Harness start={newMULSearchFilters({ tech: "clan", era: 10 })} />);
        const era = screen.getByLabelText(/Era/) as HTMLSelectElement;
        expect(era.value).toBe("10");
        expect(era.selectedOptions[0].textContent).toMatch(/not offered under the ticked rulesets/);
        cleanup();
        render(<Harness start={newMULSearchFilters({ type: 23, rulesets: ["sample-no-clans"] })} />);
        const type = screen.getByLabelText(/Type/) as HTMLSelectElement;
        expect(type.value).toBe("23");
        expect(type.selectedOptions[0].textContent).toMatch(/ProtoMech \(not offered under the ticked rulesets\)/);
        cleanup();
        render(<Harness start={newMULSearchFilters({ tech: "clan", rulesets: ["sample-no-clans"] })} />);
        const tech = screen.getByLabelText(/Search Tech/) as HTMLSelectElement;
        expect(tech.value).toBe("clan");
        expect(tech.selectedOptions[0].textContent).toBe("Clan (not offered under the ticked rulesets)");
    });
});

describe("MULSearchFilters Search Rules (#614)", () => {
    it("offers every graded rules level, Experimental included", () => {
        render(<Harness start={newMULSearchFilters()} />);
        expect(optionValues(/Search Rules/)).toEqual(["", "introductory", "standard", "advanced", "experimental"]);
    });
});
