import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AerospaceFighter from "../../classes/aerospace-fighter";
import BattleArmor from "../../classes/battle-armor";
import { BattleMech } from "../../classes/battlemech";
import CapitalShip from "../../classes/capital-ship";
import Vehicle from "../../classes/vehicle";
import BattleArmorRecordSheet from "./battle-armor-record-sheet";
import CapitalShipRecordSheet from "./capital-ship-record-sheet";
import FighterRecordSheet from "./fighter-record-sheet";
import BattleMechSVG from "./svg/battlemech-svg";
import VehicleRecordSheet from "./vehicle-record-sheet";

// Rendered markup puts an apostrophe in as &#x27;.
const text = (markup: string) => markup.replace(/&#x27;/g, "'");

describe("quirks on record sheets", () => {
    it("prints a 'Mech's quirk line and a weapon's quirk under it, and nothing for a removed weapon", () => {
        const mech = new BattleMech();
        const laser = mech.addEquipmentFromTag("medium-laser", "is", "rt", false, undefined, "", false, [], undefined, undefined)!;
        mech.quirks.add({ tag: "quirk-command-mech" });
        mech.quirks.add({ tag: "quirk-accurate-weapon", equipmentUuid: laser.uuid });
        mech.quirks.add({ tag: "quirk-stabilized-weapon", equipmentUuid: "removed" });
        const markup = text(renderToStaticMarkup(<BattleMechSVG mechData={mech} />));
        expect(markup).toContain("Quirks: Command 'Mech");
        expect(markup).toContain("Accurate Weapon");
        expect(markup).not.toContain("Stabilized Weapon");
    });

    it("prints nothing on a 'Mech without quirks", () => {
        expect(renderToStaticMarkup(<BattleMechSVG mechData={new BattleMech()} />)).not.toContain("Quirks:");
    });

    it("prints a vehicle's Quirks block and the weapon quirk beside the weapon", () => {
        const vehicle = new Vehicle();
        vehicle.addEquipmentFromTag("medium-laser");
        const laser = vehicle.getEquipmentList()[vehicle.getEquipmentList().length - 1];
        vehicle.quirks.add({ tag: "quirk-rugged", parameter: 1 });
        vehicle.quirks.add({ tag: "quirk-fast-reload", location: "front" });
        vehicle.quirks.add({ tag: "quirk-accurate-weapon", equipmentUuid: laser.uuid });
        const markup = renderToStaticMarkup(<VehicleRecordSheet vehicle={vehicle} />);
        expect(markup).toContain("Quirks: Rugged (1), Fast Reload (Front)");
        expect(markup).toContain("Medium Laser [Accurate Weapon]");
    });

    it("prints no Quirks block for a vehicle without quirks", () => {
        expect(renderToStaticMarkup(<VehicleRecordSheet vehicle={new Vehicle()} />)).not.toContain("quirk-sheet-block");
    });

    it("prints a fighter's weapon quirk beside the weapon", () => {
        const fighter = new AerospaceFighter();
        const laser = fighter.addEquipmentFromTag("medium-laser", "nose")!;
        fighter.quirks.add({ tag: "quirk-accurate-weapon", equipmentUuid: laser.uuid });
        expect(renderToStaticMarkup(<FighterRecordSheet fighter={fighter} />)).toContain("[Accurate Weapon]");
    });

    it("names a large craft's quirked weapon and its arc in the notes", () => {
        const ship = new CapitalShip();
        const laser = ship.addEquipmentFromTag("large-laser", "nose")!;
        ship.quirks.add({ tag: "quirk-accurate-weapon", equipmentUuid: laser.uuid });
        const markup = renderToStaticMarkup(<CapitalShipRecordSheet ship={ship} />);
        expect(markup).toContain("Weapon quirks: Large Laser (Nose): Accurate Weapon");
    });

    it("prints battle armor's weapon quirk beside the weapon", () => {
        const suit = new BattleArmor();
        suit.addItem("is-er-small-laser", "la");
        suit.quirks.add({ tag: "quirk-accurate-weapon", equipmentUuid: suit.getItems()[0].uuid });
        expect(renderToStaticMarkup(<BattleArmorRecordSheet suit={suit} />)).toContain("[Accurate Weapon]");
    });
});
