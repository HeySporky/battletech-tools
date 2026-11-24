import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Vehicle from "../../../classes/vehicle";
import VehicleRecordSheetSVG from "./vehicle-record-sheet-svg";


// Rendered markup escapes apostrophes and ampersands.
const render = (vehicle: Vehicle, props: { showCrew?: boolean } = {}) =>
    renderToStaticMarkup(<VehicleRecordSheetSVG vehicle={vehicle} {...props} />).replace(/&#x27;/g, "'").replace(/&amp;/g, "&");

const tank = (turret = true): Vehicle => {
    const v = new Vehicle();
    v.setMotiveType("tracked");
    v.setTonnage(50);
    v.setHasTurret(turret);
    v.setName("Test Tank");
    v.addEquipmentFromTag("autocannon-standard-b");
    v.setEquipmentLocation(v.getEquipmentList().at(-1)!.uuid!, turret ? "turret" : "front");
    v.addEquipmentFromTag("machine-gun");
    v.setEquipmentLocation(v.getEquipmentList().at(-1)!.uuid!, "front");
    v.addEquipmentFromTag("ammo-ac-5-standard");
    v.setArmorAllocation("front", 20);
    return v;
};

// The parity checklist: everything the Total Warfare Ground Vehicle record sheet prints.
describe("vehicle record sheet (full page)", () => {
    it("prints every block of the official ground vehicle sheet", () => {
        const markup = render(tank());
        for (const text of [
            "TRACKED VEHICLE RECORD SHEET", "VEHICLE DATA", "WEAPONS & EQUIPMENT INVENTORY", "CREW DATA", "CRITICAL DAMAGE",
            "NOTES", "ARMOR DIAGRAM", "GROUND COMBAT VEHICLE HIT LOCATION TABLE", "MOTIVE SYSTEM DAMAGE TABLE",
            "GROUND COMBAT VEHICLE CRITICAL HITS TABLE",
        ]) expect(markup).toContain(text);
    });

    it("prints the vehicle data, crew hit boxes and critical damage boxes", () => {
        const markup = render(tank());
        for (const text of [
            "Test Tank", "Cruising:", "Flanking:", "Tonnage:", "50", "Tech Base:", "Movement Type:", "Engine Type:", "Rules Level:",
            "Gunnery Skill:", "Driving Skill:", "Commander Hit", "Driver Hit", "Turret Locked", "Engine Hit", "Sensor Hits",
            "Motive System Hits", "Stabilizers", "Cost:", "BV:",
        ]) expect(markup).toContain(text);
    });

    it("prints weapons with location codes and ammunition in the Body (TM p. 107)", () => {
        const markup = render(tank());
        expect(markup).toContain(">TU<");
        expect(markup).toContain(">FR<");
        expect(markup).toContain("Ammo: (AC/5) 20");
        expect(markup).toContain("Front Armor (20)");
    });

    it("prints the hit location and critical hit rows", () => {
        const markup = render(tank());
        expect(markup).toContain("Side (critical)*");
        expect(markup).toContain("Turret Blown Off");
        expect(markup).toContain("Hovercraft, Hydrofoil");
    });

    it("leaves out turret boxes on a vehicle with no turret", () => {
        const markup = render(tank(false));
        expect(markup).not.toContain("Turret Locked");
    });

    it("prints the VTOL sheet: elevation track, physical attacks, flight stabilizer and pilot hits", () => {
        const v = new Vehicle();
        v.setMotiveType("vtol");
        v.setTonnage(20);
        const markup = render(v);
        for (const text of [
            "VTOL RECORD SHEET", "VTOL ELEVATION TRACK", "PHYSICAL ATTACKS AGAINST VTOL VEHICLES", "Flight Stabilizer", "Co-Pilot Hit",
            "Pilot Hit", "VTOL COMBAT VEHICLE HIT LOCATION TABLE", "VTOL COMBAT VEHICLE CRITICAL HITS TABLE", "Rotor Armor (",
            "Move at Cruising speed only",
        ]) expect(markup).toContain(text);
        expect(markup).not.toContain("Motive System Hits");
        expect(markup).not.toContain("MOTIVE SYSTEM DAMAGE TABLE");
    });

    it("prints a Super-Heavy VTOL on the VTOL hit table with four facings and a rotor (TO:AUE p.190)", () => {
        const v = new Vehicle();
        v.setMotiveType("vtol");
        v.setTonnage(55);
        const markup = render(v);
        expect(markup).toContain("SUPER-HEAVY VTOL RECORD SHEET");
        expect(markup).toContain("VTOL COMBAT VEHICLE HIT LOCATION TABLE");
        expect(markup).toContain("Rotor Armor (");
        for (const text of ["Front Left", "Rear Right", "FRONT SIDE", "REAR SIDE"]) expect(markup).not.toContain(text);
    });

    it("prints an unpowered Trailer's engine as None and the vehicle as a Trailer (TM p.99)", () => {
        const v = new Vehicle();
        v.setMotiveType("tracked");
        v.setTonnage(10);
        v.setUnpoweredTrailer(true);
        const markup = render(v);
        expect(markup).toContain("None (Trailer)");
        expect(markup).not.toContain("Fusion");
    });

    it("prints a submarine's depth track on the naval sheet", () => {
        const v = new Vehicle();
        v.setMotiveType("naval-sub");
        v.setTonnage(100);
        const markup = render(v);
        expect(markup).toContain("SUBMARINE RECORD SHEET");
        expect(markup).toContain("NAVAL COMBAT VEHICLE HIT LOCATION TABLE");
        expect(markup).toContain("DEPTH TRACK");
        expect(markup).toContain("Hydrofoil");
    });

    it("prints the Large Ground Support Vehicle sheet with its own tables and a labelled fire control note", () => {
        const v = new Vehicle();
        v.setSupportVehicle(true);
        v.setMotiveType("wheeled");
        v.setTonnage(200);
        v.setHasTurret(true);
        const markup = render(v);
        expect(markup).toContain("LARGE GROUND SUPPORT VEHICLE RECORD SHEET");
        expect(markup).toContain("LARGE GROUND SUPPORT VEHICLE HIT LOCATION TABLE");
        expect(markup).toContain("LARGE GROUND SUPPORT VEHICLE CRITICAL HITS TABLE");
        expect(markup).toContain("FRONT SIDE");
        expect(markup).toContain("Fire Control: None (+2 to-hit)");
        expect(markup).toMatch(/>ICE \d+</);
    });

    it("prints what CASE does to an Ammunition critical, only on a vehicle that has it (#135)", () => {
        const without = render(tank());
        expect(without).not.toContain("With CASE");
        const cased = tank();
        cased.addEquipmentFromTag("case");
        // TW p.194: the damage goes to the rear armor instead, excess ignored, and the crew is stunned.
        expect(render(cased)).toContain("With CASE, the ammunition's damage goes to the rear armor instead (excess ignored) and the crew is stunned (TW p. 194).");
        // A Clan chassis has CASE built in (TM p.210).
        const clan = tank();
        clan.setTech("clan");
        expect(render(clan)).toContain("With CASE");
    });

    it("fills in crew skills only when asked", () => {
        expect(render(tank())).not.toContain("data-testid=\"crew-gunnery\"");
        expect(render(tank(), { showCrew: true })).toContain("data-testid=\"crew-gunnery\"");
    });

    it("carries our own footer and title block, not the official one", () => {
        const markup = render(tank());
        expect(markup).toContain("Created with Jeff's BattleTech Tools IIC");
        expect(markup).not.toContain("CLASSIC BATTLETECH");
    });
});

// A note wrapped over several lines keeps the space at each break, so it copies and reads back whole.
describe("vehicle record sheet notes", () => {
    it("keeps the spaces where a long note wraps", () => {
        const vehicle = new Vehicle();
        vehicle.setTech("is");
        vehicle.setEra("jihad");
        vehicle.setMotiveType("tracked");
        vehicle.setTonnage(60);
        vehicle.setEngineType("xl");
        vehicle.setCruiseMP(4);
        vehicle.setHasTurret(true);
        vehicle.setFrankenVehicle(true);
        const notes = [...render(vehicle).matchAll(/<text[^>]*>(.*?)<\/text>/g)]
            .map((match) => match[1].replace(/<[^>]+>/g, ""));
        expect(notes).toContain(vehicle.getFrankenVehicleNotes()[0]);
    });
});
