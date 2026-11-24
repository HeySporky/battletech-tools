import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import SanitizedHTML from "./sanitized-html";

// Runs in real Chromium, Firefox and WebKit (`npm run test:browser`), where the browser's own HTML parser handles
// the sanitized output - catching differences happy-dom would not.
afterEach(cleanup);

describe("SanitizedHTML in a real browser", () => {
    it("never executes injected script or event handlers", async () => {
        const hits: string[] = [];
        (window as unknown as { __hit: (s: string) => void }).__hit = (s) => hits.push(s);

        const { container } = render(
            <SanitizedHTML html={"<p>ok</p><script>window.__hit('script')</script><img src=\"data:,\" onerror=\"window.__hit('onerror')\">"} />,
        );
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(container.querySelector("p")?.textContent).toBe("ok");
        expect(container.querySelector("script")).toBeNull();
        expect(hits).toEqual([]);
    });

    // #215: raw mode keeps the app's own markup (tables, styles, data attributes) but runs DOMPurify.
    it("raw mode keeps the app's markup", () => {
        const { container } = render(
            <SanitizedHTML raw html={"<b>Atlas</b><table class=\"bv\"><tr><td style=\"color: red;\"><em data-x=\"1\">raw</em></td></tr></table>"} />,
        );

        expect(container.querySelector("b")?.textContent).toBe("Atlas");
        expect(container.querySelector("table.bv td")?.getAttribute("style")).toBe("color: red;");
        expect(container.querySelector("em")?.getAttribute("data-x")).toBe("1");
    });

    it("raw mode never executes injected script or event handlers", async () => {
        const hits: string[] = [];
        (window as unknown as { __hit: (s: string) => void }).__hit = (s) => hits.push(s);

        const { container } = render(
            <SanitizedHTML raw html={"<b>Atlas</b><script>window.__hit('script')</script><img src=\"data:,\" onerror=\"window.__hit('onerror')\"><a href=\"javascript:window.__hit('href')\">x</a>"} />,
        );
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(container.querySelector("b")?.textContent).toBe("Atlas");
        expect(container.querySelector("script")).toBeNull();
        expect(container.querySelector("img")?.hasAttribute("onerror")).toBe(false);
        expect(container.querySelector("a")?.getAttribute("href") ?? "").not.toMatch(/javascript:/);
        expect(hits).toEqual([]);
    });

    it("raw SVG text keeps its tspans and loses script", () => {
        const { container } = render(
            <svg><SanitizedHTML raw svg html={"<tspan font-weight=\"bold\">AC/20</tspan><script>window.__hit('svg')</script>"} /></svg>,
        );

        expect(container.querySelector("tspan")?.getAttribute("font-weight")).toBe("bold");
        expect(container.querySelector("script")).toBeNull();
    });
});
