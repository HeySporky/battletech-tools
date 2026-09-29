// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import SanitizedHTML from "./sanitized-html";

afterEach(cleanup);

describe("SanitizedHTML", () => {
    it("keeps allowed markup and strips scripts and event handlers", () => {
        const { container } = render(
            <SanitizedHTML html={"<p class=\"note\">Heat <strong>30</strong></p><script>alert(1)</script><img src=\"x.png\" onerror=\"alert(2)\">"} />,
        );

        expect(container.querySelector("p.note strong")?.textContent).toBe("30");
        expect(container.querySelector("script")).toBeNull();
        expect(container.querySelector("img")?.getAttribute("src")).toBe("x.png");
        expect(container.querySelector("img")?.hasAttribute("onerror")).toBe(false);
    });

    it("passes markup through untouched in raw mode", () => {
        const { container } = render(<SanitizedHTML raw html={"<em data-x=\"1\">raw</em>"} />);

        expect(container.querySelector("em")?.getAttribute("data-x")).toBe("1");
    });
});
