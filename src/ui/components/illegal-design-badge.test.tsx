// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import IllegalDesignBadge from "./illegal-design-badge";

describe("IllegalDesignBadge", () => {
    afterEach(cleanup);
    it("says the design is illegal and names what it breaks", () => {
        render(<IllegalDesignBadge issues={["34 item slots used of 20 (TM p.120)"]} />);
        const badge = screen.getByText("Illegal");
        expect(badge.closest("[title]")?.getAttribute("title")).toBe("Illegal as printed: 34 item slots used of 20 (TM p.120)");
    });

    it("shows nothing for a legal design", () => {
        const { container } = render(<IllegalDesignBadge issues={undefined} />);
        expect(container.textContent).toBe("");
    });
});
