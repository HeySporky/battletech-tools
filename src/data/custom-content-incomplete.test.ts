import { describe, expect, it } from "vitest";
import { findEstimatedCustomFields, setIncompleteCustomContent } from "./custom-content-incomplete";

describe("estimated custom fields (#76)", () => {
    it("names each estimated field after the item with (estimated), for items the text uses", () => {
        setIncompleteCustomContent([
            { tag: "a-widget", name: "Widget Cannon", estimated: ["weight", "space.battlemech"] },
            { tag: "b-gadget", name: "Gadget Beam" },
        ]);
        const text = JSON.stringify(["a-widget", "b-gadget"]);
        expect(findEstimatedCustomFields(text)).toEqual(["Widget Cannon: tons (estimated), slots (estimated)"]);
        expect(findEstimatedCustomFields(JSON.stringify(["other"]))).toEqual([]);
    });
});
