import { IEquipmentItem } from "./data-interfaces";
import { applyDerivedValues } from "./derived-custom-values";

export const artilleryCustom: IEquipmentItem[] = applyDerivedValues([
    {
        // Solaris7 forum idea (#301, 'Custom Senario weapon', July-August 2018): Prince's roguelike-campaign superweapon, built
        // as he set it out on an Arrow IV baseline. Munchkin by design ("a superweapon for the PCs to find").
        name: "Nuclear Pulse Cannon", tag: "custom-nuclear-pulse-cannon", techBase: "is", catalog: "custom", sort: "artillery, nuclear pulse cannon", category: "Artillery Weapons",
        notes: "Munchkin by Prince, Solaris7 forum ('Custom Senario weapon - comments and criticisms needed!', 2018): a Rim Worlds Republic wonder weapon, a "
            + "mirrored breech-loading chamber that detonates a small nuclear charge and directs the blast out of the barrel. A direct-fire artillery weapon "
            + "(it cannot fire indirectly) that AMS cannot stop. 35 damage to the target hex and 18 to each adjacent hex; a target that tracks heat also takes "
            + "2D6 heat, any other takes 2D6 more damage (Thunder's pointer to the plasma rifle rule, TW p.139). Each shot generates 20 heat plus 1D6 more from "
            + "the charge. After 20 shots the barrel and firing assembly must be replaced, and firing makes the unit radioactive. 3 charges a ton. "
            + "Prince settled on 35 damage; heat is the top of his 15-20. Not printed in the thread: weight, slots and range are the Arrow IV's (TO:AUE p.96), "
            + "the adjacent damage half the target's as the Arrow IV's 20/10, dates and tech rating the Davy Crockett-M round's; BV 420 is the Arrow IV's "
            + "12 a point of damage (240 for 20) and cost is its 450,000 C-bills.",
        damage: 35, damageAero: 35, accuracyModifier: 0, cbills: 450000, prototype: 2593, introduced: 2600, extinct: 2830, reintroduced: 3044, battleValue: 420, heat: 20, heatAero: 20, weight: 15,
        range: { min: 0, maxMapSheets: 8, short: 0, medium: 0, long: 0 },
        space: { battlemech: 15, protomech: -1, combatVehicle: 1, supportVehicle: 7, aerospaceFighter: 1, smallCraft: 1, dropShip: 1 },
        shotsPerTon: 3, ammoTypes: ["ammo-custom-nuclear-pulse-cannon-standard"], ammoBattleValue: 53, minAmmoTons: 1, explosive: false, weaponType: ["ART"], techRating: "f",
        book: "http://solaris7.com/thread/custom-senario-weapon-comments-and-criticisms-needed/", page: 0, rulesLevel: 7,
        alphaStrike: { specialAbility: ["NPC"], heat: 2, rangeShort: 0, rangeMedium: 0, rangeLong: 0, rangeExtreme: 0, tc: false, notes: ["Ours (NGCFells, 2026-11-22, #647): NPC, a direct-fire artillery cannon scaled up from the Long Tom Cannon (ART-LTC 2), the nearest canon special (Nuclear Pulse Cannon: Prince, Munchkin)"] },
    },
]);
