import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BattleMech } from "../../../classes/battlemech";
import BattleMechSVG from "./battlemech-svg";

const mechWith = (shields: [string, string][]) => {
    const mech = new BattleMech();
    mech.setEra("jihad");
    mech.setTonnage(60);
    mech.setWalkSpeed(5);
    for (const [tag, location] of shields) {
        mech.addEquipmentFromTag(tag, "is", location, false, undefined, "", false, [], undefined, undefined);
    }
    return mech;
};
const count = (markup: string, className: string) => (markup.match(new RegExp(`class="${className}`, "g")) ?? []).length;

// The Gundam RX-78-2 sheet's way: the shield beside its arm, a circle per point of Damage Capacity and a diamond per
// point of Damage Absorption (TO:AUE p.103's Shield Table).
describe("Record sheet shields", () => {
    it("draws each arm's shield beside the arm: DC circles, DA diamonds and its size", () => {
        const markup = renderToStaticMarkup(<BattleMechSVG mechData={mechWith([["shield-medium", "la"], ["shield-small", "ra"]])} />);
        expect(count(markup, "shield-la-dc")).toBe(18);
        expect(count(markup, "shield-la-da")).toBe(5);
        expect(count(markup, "shield-ra-dc")).toBe(11);
        expect(count(markup, "shield-ra-da")).toBe(3);
        expect(markup).toContain("MEDIUM");
        expect(markup).toContain("SMALL");
    });

    it("draws no shield block on a 'Mech without one", () => {
        expect(renderToStaticMarkup(<BattleMechSVG mechData={mechWith([])} />)).not.toContain("shield-la");
    });

    it("fills the Damage Capacity already taken", () => {
        const mech = mechWith([["shield-large", "la"]]);
        mech.toggleShieldBubble(mech.getShields()[0].item.uuid!, 6);
        const markup = renderToStaticMarkup(<BattleMechSVG mechData={mech} />);
        expect(count(markup, "shield-la-dc")).toBe(25);
        expect(count(markup, "shield-la-dc taken")).toBe(7);
    });
});
