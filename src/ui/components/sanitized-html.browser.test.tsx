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
});
