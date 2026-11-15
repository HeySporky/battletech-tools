// The unit classes and the equipment catalogs they pull in, loaded by the app router after the shell has rendered,
// so they stay out of the entry chunk (#589). Each class is its own import, so each can land in its own chunk.
export const loadUnitClasses = async () => {
    const [asForce, asGroup, battleMech, cbtForce, cbtGroup, vehicle, fighter, infantry, battleArmor, protoMech, microMech, walker,
        smallCraft, capitalShip, building, customContent] = await Promise.all([
        import("../classes/alpha-strike-force"),
        import("../classes/alpha-strike-group"),
        import("../classes/battlemech"),
        import("../classes/battlemech-force"),
        import("../classes/battlemech-group"),
        import("../classes/vehicle"),
        import("../classes/aerospace-fighter"),
        import("../classes/infantry-platoon"),
        import("../classes/battle-armor"),
        import("../classes/protomech"),
        import("../classes/micro-mech"),
        import("../classes/walker"),
        import("../classes/small-craft"),
        import("../classes/capital-ship"),
        import("../classes/building"),
        import("../data/custom-content-local"),
    ]);
    return {
        AlphaStrikeForce: asForce.default,
        AlphaStrikeGroup: asGroup.default,
        BattleMech: battleMech.BattleMech,
        BattleMechForce: cbtForce.BattleMechForce,
        BattleMechGroup: cbtGroup.BattleMechGroup,
        Vehicle: vehicle.default,
        AerospaceFighter: fighter.default,
        InfantryPlatoon: infantry.default,
        BattleArmor: battleArmor.default,
        ProtoMech: protoMech.default,
        MicroMech: microMech.default,
        Walker: walker.default,
        SmallCraft: smallCraft.default,
        CapitalShip: capitalShip.default,
        Building: building.default,
        registerLocalCustomContent: customContent.registerLocalCustomContent,
    };
};

export type UnitClasses = Awaited<ReturnType<typeof loadUnitClasses>>;
