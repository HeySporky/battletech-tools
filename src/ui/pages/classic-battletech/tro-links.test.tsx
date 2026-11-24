import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReadoutText } from "./tro-jbt";

describe("TRO - JBT source links", () => {
    it("makes a bare web address a link, leaving the sentence's full stop as text", () => {
        const html = renderToStaticMarkup(<ReadoutText text="Design by LAMFAN: https://battletech.com/forums/index.php?topic=83239.0. Built here." />);
        expect(html).toContain('<a href="https://battletech.com/forums/index.php?topic=83239.0" target="_blank" rel="noopener noreferrer">https://battletech.com/forums/index.php?topic=83239.0</a>. Built here.');
    });

    it("still reads a Markdown link as one link", () => {
        const html = renderToStaticMarkup(<ReadoutText text="See [topic 44833](https://battletech.com/forums/index.php?topic=44833.0)." />);
        expect(html.match(/<a /g)).toHaveLength(1);
        expect(html).toContain(">topic 44833</a>.");
    });
});
