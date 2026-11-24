import { describe, expect, it } from "vitest";
import { isSafeImageDataURL, safeImageURL } from "./safeImageURL";

describe("safeImageURL data URLs (#95)", () => {
    it("lets a base64 png, jpeg or webp data URL through", () => {
        for (const type of ["png", "jpeg", "webp"]) {
            const url = `data:image/${type};base64,AAAA`;
            expect(safeImageURL(url)).toBe(url);
            expect(isSafeImageDataURL(url)).toBe(true);
        }
    });

    it("still refuses svg, html, javascript and malformed data URLs", () => {
        for (const url of [
            "data:image/svg+xml;base64,AAAA", "data:image/svg+xml,%3Csvg%3E", "data:text/html,x", ["javascript", "alert(1)"].join(":"),
            "data:image/png,notbase64", "data:image/png;base64,AA AA", "data:image/gif;base64,AAAA", "data:image/webp;base64,",
        ]) {
            expect(safeImageURL(url), url).toBe("");
            expect(isSafeImageDataURL(url), url).toBe(false);
        }
    });

    it("keeps accepting http(s) and relative addresses", () => {
        expect(safeImageURL("https://example.com/a.png")).toBe("https://example.com/a.png");
        expect(safeImageURL("/img/a.png")).toBe("/img/a.png");
    });
});
