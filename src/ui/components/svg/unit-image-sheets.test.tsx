// @vitest-environment happy-dom
import type React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AerospaceFighter from "../../../classes/aerospace-fighter";
import BattleArmor from "../../../classes/battle-armor";
import Building from "../../../classes/building";
import CapitalShip from "../../../classes/capital-ship";
import InfantryPlatoon from "../../../classes/infantry-platoon";
import MicroMech from "../../../classes/micro-mech";
import ProtoMech from "../../../classes/protomech";
import SmallCraft from "../../../classes/small-craft";
import Vehicle from "../../../classes/vehicle";
import Walker from "../../../classes/walker";
import { WALKER_LOCATIONS } from "../../../data/walker-construction";
import BattleArmorRecordSheetSVG from "./battle-armor-record-sheet-svg";
import BuildingRecordSheetSVG from "./building-record-sheet-svg";
import CapitalShipRecordSheetSVG from "./capital-ship-record-sheet-svg";
import DropShipRecordSheetSVG from "./dropship-record-sheet-svg";
import FighterRecordSheetSVG from "./fighter-record-sheet-svg";
import InfantryRecordSheetSVG, { infantrySheetLines } from "./infantry-record-sheet-svg";
import MicroMechRecordSheetSVG from "./micro-mech-record-sheet-svg";
import ProtoMechRecordSheetSVG, { protoMechSheetUnits } from "./protomech-record-sheet-svg";
import SmallCraftRecordSheetSVG from "./small-craft-record-sheet-svg";
import SupportAircraftRecordSheetSVG from "./support-aircraft-record-sheet-svg";
import WalkerRecordSheetSVG from "./walker-record-sheet-svg";
import { assertImageClear } from "./image-clear-test-utils";
import VehicleRecordSheetSVG from "./vehicle-record-sheet-svg";

// #95: the unit picture on every record sheet layout other than the 'Mech sheets (battlemech-unit-image.test.tsx).
// Each layout draws it once, inside the sheet and clear of the printed text, and draws nothing without a picture.
const PICTURE = "data:image/webp;base64,AAAA";
const clear = (sheet: React.ReactElement, label: string) => assertImageClear(sheet, label);
const none = (markup: string) => expect(markup).not.toContain("unit-image");

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

describe("unit picture on the other record sheets (#95)", () => {
    it("vehicle", () => {
        const v = tank();
        none(renderToStaticMarkup(<VehicleRecordSheetSVG vehicle={v} />));
        v.tro.setImage(PICTURE);
        clear(<VehicleRecordSheetSVG vehicle={v} />, "vehicle");
        clear(<VehicleRecordSheetSVG vehicle={v} showCrew showDamage />, "vehicle-play");
    });
});

// ---- the rest of the layouts ----
const fighter = (type: "aerospace" | "conventional" = "aerospace"): AerospaceFighter => {
    const f = new AerospaceFighter();
    f.setFighterType(type);
    f.setTonnage(50);
    f.setSafeThrust(5);
    f.setName("Test Hawk");
    f.setArmorAllocation("nose", 20);
    f.setArmorAllocation("leftWing", 15);
    f.setArmorAllocation("rightWing", 15);
    f.setArmorAllocation("aft", 10);
    f.addEquipmentFromTag("medium-laser", "nose");
    f.addEquipmentFromTag("medium-laser", "nose");
    return f;
};
const supportCraft = (motive: "airship" | "satellite" | "fixed-wing"): AerospaceFighter => {
    const craft = new AerospaceFighter();
    craft.setFighterType("support");
    craft.setSupportMotive(motive);
    craft.setTonnage(motive === "satellite" ? 20 : 100);
    if (motive !== "satellite") craft.setSafeThrust(1);
    craft.setName("Test Gasbag");
    craft.setArmorAllocation("nose", 10);
    craft.setArmorAllocation("leftWing", 8);
    craft.setArmorAllocation("rightWing", 8);
    craft.setArmorAllocation("aft", 6);
    return craft;
};
const lander = (shape: "aerodyne" | "spheroid"): SmallCraft => {
    const craft = new SmallCraft();
    craft.setShape(shape);
    craft.setName("Test Lander");
    craft.setArmorAllocation("nose", 40);
    craft.setArmorAllocation("left", 30);
    craft.setArmorAllocation("right", 30);
    craft.setArmorAllocation("aft", 20);
    craft.addEquipmentFromTag("large-laser", "nose");
    craft.addEquipmentFromTag("medium-laser", "left");
    craft.addEquipmentFromTag("medium-laser", "leftAft");
    craft.setPassengers(4);
    craft.setQuarters("firstClass", 4);
    craft.addBay("cargo", 9);
    return craft;
};
const dropship = (shape: "aerodyne" | "spheroid"): SmallCraft => {
    const ship = new SmallCraft();
    ship.setCraftType("dropShip");
    ship.setShape(shape);
    ship.setTonnage(3000);
    ship.setName("Test Carrier");
    for (const tag of ["large-laser", "large-laser", "medium-laser", "medium-laser", "medium-laser"]) ship.addEquipmentFromTag(tag, "nose");
    ship.addBay("fighter", 6);
    ship.setBay(0, 6, 2);
    return ship;
};
const capital = (type = "warShip"): CapitalShip => {
    const ship = new CapitalShip();
    ship.setShipType(type);
    ship.setTonnage(type === "spaceStation" ? 100000 : 420000);
    ship.setName("Test Hull");
    ship.setStructuralIntegrity(type === "warShip" ? 40 : 1);
    ship.addEquipmentFromTag("large-laser", "nose");
    ship.addEquipmentFromTag("large-laser", "nose");
    ship.addCapitalWeapon("nac-10", "nose");
    ship.addBay("fighter", 6);
    ship.setBay(0, 6, 2);
    return ship;
};
const platoon = (name = "Test Platoon"): InfantryPlatoon => {
    const p = new InfantryPlatoon();
    p.setName(name);
    return p;
};
const suit = (name = "Test Suit"): BattleArmor => {
    const s = new BattleArmor();
    s.setName(name);
    s.setWeightClass("medium");
    s.setMotive("jump", 3);
    s.setArmorPoints(6);
    s.addItem("is-er-small-laser", "ra");
    s.setSquadSize(4);
    return s;
};
const proto = (name = "Delphyne-2"): ProtoMech => {
    const p = new ProtoMech();
    p.setName(name);
    p.setTons(9);
    p.setWalkMP(5);
    p.setJump("standard", 5);
    p.setArmor("torso", 16);
    p.setArmor("head", 6);
    p.setArmor("la", 4);
    p.setArmor("ra", 4);
    p.setArmor("legs", 10);
    p.addMount("er-micro-laser", "la");
    p.addMount("er-micro-laser", "ra");
    p.addMount("pm-srm", "torso", 3);
    p.addMount("pm-srm", "torso", 3);
    return p;
};
const kenyon = (): Building => {
    const b = new Building();
    b.setName("Kenyon Emplacement");
    b.setTech("clan");
    b.setClassification("gun-emplacement");
    b.setType("heavy");
    b.setCF(80);
    b.setArmorTons(4);
    b.addEquipmentFromTag("clan-er-large-laser", 1, true);
    b.addEquipmentFromTag("clan-er-large-laser", 1, true);
    return b;
};
const storm = (): MicroMech => {
    const m = new MicroMech();
    m.setTons(11);
    m.setWalkMP(6);
    m.setJumpJets(6);
    m.setName("Storm STM-3X");
    m.setArmor("head", 4);
    m.setArmor("torso", 16);
    m.setArmor("torsoRear", 6);
    m.setArmor("la", 4);
    m.setArmor("ra", 4);
    m.setArmor("ll", 6);
    m.setArmor("rl", 6);
    m.addMount("micro-er-laser-small", "ra");
    m.addMount("micro-machine-gun", "la");
    m.setAmmo(1, 500, "torso");
    return m;
};
const walker = (): Walker => {
    const w = new Walker();
    w.setEdition("best-of-1991");
    w.setTons(40);
    w.setWalkMP(4);
    w.setName("Test 40");
    for (const location of WALKER_LOCATIONS) w.setArmor(location, Math.min(w.getMaxArmor(location), 12));
    return w;
};

describe("unit picture on the remaining layouts (#95)", () => {
    it("fighter, aerospace and conventional", () => {
        for (const type of ["aerospace", "conventional"] as const) {
            const f = fighter(type);
            none(renderToStaticMarkup(<FighterRecordSheetSVG fighter={f} />));
            f.tro.setImage(PICTURE);
            clear(<FighterRecordSheetSVG fighter={f} />, `fighter-${type}`);
        }
    });

    it("support aircraft: airship, satellite and fixed-wing", () => {
        for (const motive of ["airship", "satellite", "fixed-wing"] as const) {
            const craft = supportCraft(motive);
            none(renderToStaticMarkup(<SupportAircraftRecordSheetSVG fighter={craft} />));
            craft.tro.setImage(PICTURE);
            clear(<SupportAircraftRecordSheetSVG fighter={craft} />, `support-${motive}`);
        }
    });

    it("small craft, aerodyne and spheroid", () => {
        for (const shape of ["aerodyne", "spheroid"] as const) {
            const craft = lander(shape);
            none(renderToStaticMarkup(<SmallCraftRecordSheetSVG craft={craft} />));
            craft.tro.setImage(PICTURE);
            clear(<SmallCraftRecordSheetSVG craft={craft} />, `smallcraft-${shape}`);
        }
    });

    it("DropShip, aerodyne and spheroid", () => {
        for (const shape of ["aerodyne", "spheroid"] as const) {
            const ship = dropship(shape);
            none(renderToStaticMarkup(<DropShipRecordSheetSVG craft={ship} />));
            ship.tro.setImage(PICTURE);
            clear(<DropShipRecordSheetSVG craft={ship} />, `dropship-${shape}`);
        }
    });

    it("capital ship: WarShip, JumpShip and space station", () => {
        for (const type of ["warShip", "jumpShip", "spaceStation"]) {
            const ship = capital(type);
            none(renderToStaticMarkup(<CapitalShipRecordSheetSVG ship={ship} />));
            ship.tro.setImage(PICTURE);
            clear(<CapitalShipRecordSheetSVG ship={ship} />, `capital-${type}`);
        }
    });

    it("infantry: one picture for each platoon on the page", () => {
        const first = platoon("First");
        const second = platoon("Second");
        first.tro.setImage(PICTURE);
        none(renderToStaticMarkup(<InfantryRecordSheetSVG lines={infantrySheetLines([second])} />));
        clear(<InfantryRecordSheetSVG lines={infantrySheetLines([first])} />, "infantry");
        second.tro.setImage(PICTURE);
        expect(renderToStaticMarkup(<InfantryRecordSheetSVG lines={infantrySheetLines([first, second])} />).match(/data-testid="unit-image"/g)).toHaveLength(2);
    });

    it("battle armor: one picture for each squad on the page", () => {
        const first = suit("First");
        const second = suit("Second");
        first.tro.setImage(PICTURE);
        none(renderToStaticMarkup(<BattleArmorRecordSheetSVG squads={[second]} />));
        clear(<BattleArmorRecordSheetSVG squads={[first]} />, "battle-armor");
        second.tro.setImage(PICTURE);
        expect(renderToStaticMarkup(<BattleArmorRecordSheetSVG squads={[first, second]} />).match(/data-testid="unit-image"/g)).toHaveLength(2);
    });

    it("ProtoMech: a picture in the block of each ProtoMech of the Point", () => {
        const p = proto();
        none(renderToStaticMarkup(<ProtoMechRecordSheetSVG units={protoMechSheetUnits([p])} />));
        p.tro.setImage(PICTURE);
        const blocks = protoMechSheetUnits([p]);
        clear(<ProtoMechRecordSheetSVG units={blocks.slice(0, 1)} />, "protomech");
        expect(renderToStaticMarkup(<ProtoMechRecordSheetSVG units={blocks} />).match(/data-testid="unit-image"/g)).toHaveLength(blocks.length);
    });

    it("building", () => {
        const b = kenyon();
        none(renderToStaticMarkup(<BuildingRecordSheetSVG building={b} page={0} />));
        b.tro.setImage(PICTURE);
        clear(<BuildingRecordSheetSVG building={b} page={0} />, "building");
    });

    it("micro-mech", () => {
        const m = storm();
        none(renderToStaticMarkup(<MicroMechRecordSheetSVG micro={m} />));
        m.tro.setImage(PICTURE);
        clear(<MicroMechRecordSheetSVG micro={m} />, "micro");
    });

    it("walker", () => {
        const w = walker();
        none(renderToStaticMarkup(<WalkerRecordSheetSVG walker={w} />));
        w.tro.setImage(PICTURE);
        clear(<WalkerRecordSheetSVG walker={w} />, "walker");
    });
});
