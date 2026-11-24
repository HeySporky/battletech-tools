// Shared unit builders for the tests. Each one replaces a `build()` that many test files copied. Options are applied
// in one fixed order, the order those copies used; a test that needs another order keeps its own builder.
import { expect } from "vitest";
import { BattleMech } from "../classes/battlemech";
import MicroMech from "../classes/micro-mech";
import Pilot from "../classes/pilot";
import Vehicle from "../classes/vehicle";
import Walker from "../classes/walker";
import { MicroMechLayout } from "../data/micro-mech-construction";
import { CUSTOM_HOMEBREW_RULES_LEVEL } from "../data/rules-level-options";

export interface IMechOptions {
    tech?: string;
    era?: string;
    /** Applied with setMechType() before the tonnage, as the chassis decides the legal tonnages. */
    type?: string;
    tonnage?: number;
    walk?: number;
    jump?: number;
    /** Switches on Custom Homebrew rules; `true` keeps the default rulesets, a list replaces them. */
    homebrew?: true | string[];
}

/** An Inner Sphere Dark Age 'Mech: tech, era, type, tonnage, walk, jump, then Custom Homebrew rules. */
export const buildMech = (options: IMechOptions = {}): BattleMech => {
    const mech = new BattleMech();
    mech.setTech(options.tech ?? "is");
    mech.setEra(options.era ?? "dark-ages");
    if (options.type) mech.setMechType(options.type);
    mech.setTonnage(options.tonnage ?? 50);
    mech.setWalkSpeed(options.walk ?? 4);
    if (options.jump !== undefined) mech.setJumpSpeed(options.jump);
    if (options.homebrew) {
        mech.applyGameSettings({
            ...mech.getGameSettings(CUSTOM_HOMEBREW_RULES_LEVEL),
            rulesLevel: CUSTOM_HOMEBREW_RULES_LEVEL,
            ...(options.homebrew === true ? {} : { rulesets: options.homebrew }),
        });
    }
    return mech;
};

/** A MicroMech by layout, tons, walk and jump jets (micro-mech and micro-mech-play tests). */
export const buildMicroMech = (tons: number, layout: MicroMechLayout, walk: number, jets: number): MicroMech => {
    const micro = new MicroMech();
    micro.setLayout(layout);
    micro.setTons(tons);
    micro.setWalkMP(walk);
    micro.setJumpJets(jets);
    return micro;
};

/** A walker; `variant` switches on the Best of Future Wars construction ruleset. Asserts each setter took. */
export const buildWalker = (tons: number, walk: number, variant = false): Walker => {
    const walker = new Walker();
    expect(walker.setTons(tons)).toBe(true);
    expect(walker.setWalkMP(walk)).toBe(true);
    if (variant) walker.gameSettings.set(CUSTOM_HOMEBREW_RULES_LEVEL, ["best-of-future-wars-construction"]);
    return walker;
};

/** An ICE vehicle (turreted unless a VTOL) with 10 points per location, 2 on a rotor, and a 4/5 crew. */
export const buildVehicle = (motive: string, tonnage: number = 50): Vehicle => {
    const vehicle = new Vehicle();
    vehicle.setMotiveType(motive);
    vehicle.setTonnage(tonnage);
    vehicle.setEngineType("ice");
    vehicle.setCruiseMP(motive === "vtol" ? 8 : 5);
    if (motive !== "vtol") vehicle.setHasTurret(true);
    for (const loc of vehicle.getLocations()) vehicle.setArmorAllocation(loc.tag, loc.tag === "rotor" ? 2 : 10);
    const pilot = new Pilot();
    pilot.gunnery = 4;
    pilot.piloting = 5;
    vehicle.setPilot(pilot);
    return vehicle;
};
