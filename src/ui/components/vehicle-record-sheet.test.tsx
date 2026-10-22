import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Vehicle from "../../classes/vehicle";
import VehicleRecordSheet from "./vehicle-record-sheet";

describe("vehicle record sheet", () => {
    it("marks a weapon in a sponson turret", () => {
        const tank = new Vehicle();
        tank.setMotiveType("tracked");
        tank.setTonnage(60);
        tank.setSponsonTurrets(true);
        tank.addEquipmentFromTag("large-laser");
        const laser = tank.getEquipmentList()[tank.getEquipmentList().length - 1];
        tank.setEquipmentLocation(laser.uuid!, "left");
        tank.setEquipmentSponson(laser.uuid!, true);
        expect(renderToStaticMarkup(<VehicleRecordSheet vehicle={tank} />)).toContain("Large Laser (sponson)");
    });

    it("prints ammunition on the sheet's Ammo line, with a box to track its shots (TM p. 107)", () => {
        const tank = new Vehicle();
        tank.setMotiveType("tracked");
        tank.setTonnage(60);
        tank.addEquipmentFromTag("autocannon-standard-b");
        tank.setEquipmentLocation(tank.getEquipmentList()[tank.getEquipmentList().length - 1].uuid!, "front");
        tank.addEquipmentFromTag("ammo-is-ac-5-standard");
        const markup = renderToStaticMarkup(<VehicleRecordSheet vehicle={tank} />);
        expect(markup).toContain("Ammo: (AC/5) 20");
        expect(markup).toContain(">AC/5 - Standard Ammo (IS):<");
    });
});
