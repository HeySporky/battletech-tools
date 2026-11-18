import { IDamagePerRange, IEquipmentItem } from "./data-interfaces";

/*
 * Lore (in-character Technical Readout text) and rules (how the item plays) for the Custom Homebrew, Apocryphal and Munchkin equipment
 * that had only notes. Nothing here adds a fact the item's notes and stats do not give: the rules restate what the notes say in play
 * terms, the lore is NGCFells's own flavour built on the same facts and says nothing the source contradicts. Only a missing field is filled; an
 * item that already has lore, rules or notes keeps them.
 */

interface ILoreRules { lore: string; rules: string }

const hex = (item: IEquipmentItem): string => `${item.range.min ? `minimum ${item.range.min}, ` : "no minimum, "}${item.range.short} / ${item.range.medium} / ${item.range.long}`;
const damageText = (damage: number | IDamagePerRange | undefined): string => typeof damage === "number" ? `${damage}` : damage ? `${damage.short} / ${damage.medium} / ${damage.long}` : "0";
const tons = (item: IEquipmentItem): string => `${item.weight} ton${item.weight === 1 ? "" : "s"}`;
const slots = (item: IEquipmentItem): string => `${item.space.battlemech} slot${item.space.battlemech === 1 ? "" : "s"}`;
/** The stat line every weapon rule opens with, from the record itself. */
const statLine = (item: IEquipmentItem): string => `${tons(item)}, ${slots(item)}, ${damageText(item.damage)} damage, ${item.heat} heat, range ${hex(item)}`;

type Builder = (item: IEquipmentItem) => ILoreRules;

/** Items with their own text, by tag. */
const BESPOKE: Record<string, Builder> = {
    "light-blazer": (item) => ({
        lore: "The light blazer is a Gothic-era laser, small enough to mount in pairs. The FS9-B Firestarter gives up its two medium lasers, two machine guns and their ammunition for a pair of them, "
            + "trading a spread of cheap weapons for two heavier beams that carry farther.",
        rules: `A laser (${statLine(item)}). BattleTech Gothic prints damage 7 and heat 6 with ranges 3 / 6 / 9; the weight and slots are our inference from the FS9-B Firestarter and the Binary Laser Cannon.`,
    }),
    "hailstorm-artillery": (item) => ({
        lore: "The Hailstorm is the heavy towed gun of the MechWarrior 5 campaigns, a short-ranged tube that lobs shells heavier than a Long Tom's. Its recoil is too great for a 'Mech or a vehicle chassis, so crews tow it to the line on a trailer and set it down where the shells are needed.",
        rules: `Fires as the Long Tom does, for ${item.damage} points to the target hex, 25, 15 and 5 to the rings around it, out to 12 mapsheets. Mounts only on a Support Vehicle trailer. Fires the munitions the Long Tom, Sniper and Thumper share, in its own caliber.`,
    }),
    "custom-improved-mech-taser": () => ({
        lore: "VoiceOfAN's Improved 'Mech Taser answers the BattleMech Taser's stun with a harder jolt. Its gauss launcher throws explosive harpoons that carry a high-voltage line into the target and "
            + "overload its systems, and a 'Mech that takes the full charge can be dropped into shutdown. The Federated Suns prototyped it in 3090 and fielded it from 3101.",
        rules: "A hit adds 5 heat to the target; roll 2D6, and the target shuts down on 8+. A unit that stays active takes +2 to any roll it makes the following turn. It kills one member of an infantry unit, battle armor included. "
            + "No effect on buildings, aerospace fighters in flight or capital-scale units. Its explosive harpoons do 6 damage to the carrier if the weapon or its ammunition is hit. Otherwise as the canon BattleMech Taser.",
    }),
    "custom-ac-15": (item) => ({
        lore: "A 'Class 15' autocannon from the Kronos Battle Systems homebrew line, a gun sized to fill the gap between the AC/10 and the AC/20, built for designers who wanted a heavy hitter without the AC/20's short reach.",
        rules: `Fires as an autocannon (${statLine(item)}, ${item.shotsPerTon} shots a ton). A placeholder from the Solaris7 forum's archived Kronos thread.`,
    }),
    "custom-lb-15x-ac": (item) => ({
        lore: "The Class 15 line's LB-X: one barrel that fires either a solid slug or a shell that bursts into pellets in front of the target, so one gun serves against armor and against a target that is hard to hit.",
        rules: `Fires as an LB-X autocannon (${statLine(item)}, ${item.shotsPerTon} shots a ton): a solid slug, or cluster rounds on the Cluster Hits Table, switching ammunition bin by bin.`,
    }),
    "custom-ultra-ac-15": (item) => ({
        lore: "The Class 15 line's Ultra autocannon cycles its breech twice for double the rate of fire, and takes the Ultra's price: a gun that, pushed hard, can jam itself with a round half-chambered.",
        rules: `Fires as an Ultra autocannon (${statLine(item)}, ${item.shotsPerTon} shots a ton): one shot a turn, or two at the Ultra's penalty, with the risk of jamming on an unmodified 2.`,
    }),
    "heavy-rotary-rifle-cannon": (item) => ({
        lore: "A stop-gap weapon of the Age of War, a rotary rifle cannon that spins its barrels for a sustained burst. The heavy model throws the biggest rounds, and every pattern is prone to jamming when the spin runs ahead of the feed.",
        rules: `Fires as a rotary autocannon: up to 6 shots a turn (${statLine(item)}), with the risk of jamming. Inflicts 6 damage against BAR 8 and higher armor types.`,
    }),
    "medium-rotary-rifle-cannon": (item) => ({
        lore: "The middle rotary rifle cannon of the Age of War stop-gap line: a spinning barrel cluster whose burst gives a modest but sustained volume of fire, and jams when the feed falls behind the spin.",
        rules: `Fires as a rotary autocannon: up to 6 shots a turn (${statLine(item)}), with the risk of jamming. Inflicts 3 damage against BAR 8 and higher armor types.`,
    }),
    "light-rotary-rifle-cannon": (item) => ({
        lore: "The lightest rotary rifle cannon of the Age of War stop-gap line: small rounds in a fast spinning burst, good against infantry and soft targets and no more than a nuisance to real armor.",
        rules: `Fires as a rotary autocannon: up to 6 shots a turn (${statLine(item)}), with the risk of jamming. Inflicts 0 damage against BAR 8 and higher armor types.`,
    }),
    "custom-railgun-nightstalker666": (item) => ({
        lore: "A one-of-a-kind prototype, a railgun that throws a caseless, pulse-ignited slug at speeds no powder gun reaches. Its makers doubled its bulk to make it work, and it took the Heavy Gauss Rifle's place in the designs built around it.",
        rules: `A railgun (${statLine(item)}, ${item.shotsPerTon} rounds a ton). The 25 points are armor-piercing and do not transfer to another location, except from a destroyed front torso to its rear. Cannot fire indirectly. `
            + "An ammunition hit does only 2 damage a round unless a laser or PPC caused it; heat, flamers and infernos do not set it off.",
    }),
    "custom-railgun-captain": (item) => ({
        lore: "A railgun after the MekTek railgun of MechWarrior 4: Mercenaries, so heavy that it takes a whole side of the 'Mech to carry it and so violent that only a Super-Heavy chassis can fire it without risking a fall.",
        rules: `A railgun (${statLine(item)}, ${item.shotsPerTon} rounds a ton). A critical hit on it explodes like a 60-point ammunition explosion. Firing it from a 'Mech below the Super-Heavy class forces an immediate Piloting Skill Roll: +1 for an Assault 'Mech, `
            + "+2 for a Heavy, doubled if the 'Mech moved this turn; a Medium fails automatically. A Super-Heavy that moves and fires it rolls with no modifier. It takes one whole side: 12 slots of a side torso and 10 of the arm.",
    }),
    "custom-light-ac-10": (item) => ({
        lore: "Prince's Light Autocannon/10 trades the AC/10's reach for weight: a lighter gun with medium laser range, meant for fast machines that cannot spare the tonnage.",
        rules: `Fires as a light autocannon (${statLine(item)}, ${item.shotsPerTon} shots a ton), standard rounds only.`,
    }),
    "custom-light-ac-20": (item) => ({
        lore: "Prince's Light Autocannon/20 puts an AC/20's punch on a medium chassis, at the cost of reach, for fast Mediums such as the Legionnaire and Blitzkrieg that want to close to knife range.",
        rules: `Fires as a light autocannon (${statLine(item)}, ${item.shotsPerTon} shots a ton), standard rounds only.`,
    }),
    "custom-disruptor": (item) => ({
        lore: "The Disruptor is a MekTek weapon known only from a placeholder entry, a heavy energy projector that stands in the catalog until its maker's figures are found.",
        rules: `A direct-fire energy weapon (${statLine(item)}) at the figures of the Standard Large Laser, whose heat and ranges it shares. A placeholder: nothing else is known of it.`,
    }),
    "enhanced_er_large_laser": (item) => ({
        lore: "An enhanced extended-range large laser of unknown origin, kept in the catalog with its old figures until a source for it is found.",
        rules: `A Clan laser (${statLine(item)}) with no source: kept at Custom Homebrew with its old tag and statistics.`,
    }),
    "custom-is-heavy-laser-solaris7": (item) => ({
        lore: "The Word of Blake reverse-engineered the Clan Heavy Large Laser and wrapped it in radiation-absorbing layers and cooling jackets, which lets the Inner Sphere version fire without the Clan weapon's penalty. "
            + "The price is a weapon that fails badly: a hit on its housing can melt it down in place.",
        rules: `A heavy laser (${statLine(item)}) with no to-hit penalty. A critical hit on it causes a catastrophic meltdown: 25 damage to the location it is mounted in and another critical hit roll on that location.`,
    }),
    "custom-is-light-chemical-laser": (item) => ({
        lore: "A Succession Wars chemical laser built to fight orbital bombardment, first made about 2850 in the Free Worlds League and in general use by 2880. It needs no fusion engine and no heat sinks, only a magazine of "
            + "chemical charges, and its ammunition is a hazard in itself. Its makers were lost after the Holy Shroud about 2950 and it was rediscovered about 3085.",
        rules: `A chemical laser (${statLine(item)}, about ${item.shotsPerTon} charges a ton): direct fire only, needing no fusion engine and no heat sinks. Every hit also rolls for a critical hit on the location struck, as the beam goes through. `
            + "Its ammunition is catastrophic: a hit explodes as usual and sets the unit's hex on fire.",
    }),
    "custom-rotary-small-chemical-laser": (item) => ({
        lore: "Lonely Coyote's rotary chemical laser spins several small chemical barrels so that each cools while the others fire: a hybrid of an energy weapon and an ammunition weapon that trades weight for rate of fire.",
        rules: `Fires as a Rotary AC (${statLine(item)}, ${item.shotsPerTon} shots a ton): one, two, four or six shots, heat and ammunition multiplied by the shots, the Missile Hits Table column saying how many hit, jamming on 2 (two shots), 2-3 (four) or 2-4 (six).`,
    }),
    "custom-small-laser-array": (item) => ({
        lore: "A mounting that gangs small lasers into one battery under a single fire-control link, so the weapons fire together on one aim instead of each hunting its own target.",
        rules: `Links two to four Small Lasers in its location (${tons(item)}, ${slots(item)}) and fires them as one cluster weapon, as a Machine Gun Array does: one to-hit roll, the Missile Hits Table for how many hit. The Battle Value is the linked lasers', so the array carries none of its own.`,
    }),
    "custom-medium-laser-array": (item) => ({
        lore: "Thunder's Megaton Cannon: a mounting that gangs medium lasers into one battery under a single fire-control link, so the weapons fire together on one aim instead of each hunting its own target.",
        rules: `Links two to four Medium Lasers in its location (${tons(item)}, ${slots(item)}) and fires them as one cluster weapon, as a Machine Gun Array does: one to-hit roll, the Missile Hits Table for how many hit. The Battle Value is the linked lasers', so the array carries none of its own.`,
    }),
    "enhanced_clan_lrm_10": (item) => ({
        lore: "An enhanced Clan long-range missile launcher of unknown origin, kept in the catalog with its old figures until a source for it is found.",
        rules: `A Clan LRM launcher (${statLine(item)}, ${item.shotsPerTon} shots a ton) with no source: kept at Custom Homebrew with its old tag and statistics.`,
    }),
    "custom-er-inarc": (item) => ({
        lore: "The ER Improved Narc launcher stretches the iNarc's reach the way the Extended LRM stretched the LRM's, throwing the same pods farther at the price of a heavier launcher.",
        rules: `Fires every Improved Narc pod (homing, ECM, explosive, haywire, Nemesis) and follows the iNarc's rules (${tons(item)}, ${slots(item)}, range ${hex(item)}, ${item.shotsPerTon} pods a ton).`,
    }),
    "custom-smoker": (item) => ({
        lore: "The Smoker is some of the oldest and simplest equipment on a 'Mech: a tank of oil burned in a nozzle behind the legs, leaving a screen along the path the machine has walked. "
            + "It has never gone out of style. Every age of the game has used it, from the Age of War to the Clans, because nothing replaces a cheap wall of smoke for a machine that wants to be hard to see.",
        rules: `A smoke generator (${tons(item)}, ${slots(item)}, ${item.heat} heat a turn while it runs). While it runs, the 'Mech leaves a trail of smoke behind and around its movement path, reducing visibility; each ton of fuel provides 50 hexes of level 2 smoke. A hit to the fuel results in a small fire, doing 5 points of damage and generating 10 points of heat.`,
    }),
    "custom-buckler-smoke-dispenser": (item) => ({
        lore: "The Buckler Smoke Dispenser is an SLDF design of the Star League's middle years, a shield-mounted canister bank that throws a wall of smoke around its carrier in a moment, a last resort for a machine that cannot outrun what is shooting at it. "
            + "It suits the units that want to hide: second-line and garrison forces, and the ArtVees (artillery vehicles) that the SLDF fielded and the Clans kept. It left with the Exodus, and the Clans still carry it in their second-line Solahma units, though seldom in a front-line Clan. "
            + "In the Inner Sphere it was never lost, only overlooked, until Gargoyle Industries began selling it again in the early Clan war.",
        rules: `Blocks line of sight to all attacks (${tons(item)}, ${slots(item)}, ${item.shotsPerTon} shots, integral; no range). Generates smoke as per the Compendium, in the unit's own hex. The unit must remain stationary in the turn it activates, and the smoke takes effect immediately after the Movement Phase in which it is declared. It cannot be mounted on VTOLs.`,
    }),
    "custom-null-signature-system": () => ({
        lore: "A fan-designed stealth and sensor-disruption suite: the heat and electronic signature of the machine are damped so that sensors lose it at range, a ghost in the clutter.",
        rules: "A stealth and sensor-disruption system that follows the canon Null Signature System's rules. A placeholder for a fan design: its figures are the canon system's.",
    }),
    "custom-mech-improved-magnetic-grapples": () => ({
        lore: "Every 'Mech's feet already carry magnetic plates for walking on a hull. The improved grapples add a clamp in each foot that bites the hull, so a machine on a drifting station or a ship's skin stays where it is.",
        rules: "One in each foot (each leg location), 1 slot each; works only with a working grapple in every foot. Each roll to stay attached to a hull, station or other metal surface in zero or low gravity is made at -1. Jumping still leaves the hull. No effect anywhere else.",
    }),
    "custom-mech-periscope": (item) => ({
        lore: "The 'Mech periscope is a Succession Wars invention, born in the Houses' campaigns on water worlds, where a machine wading or half-submerged needs its sensors above the surface. "
            + "A mast raises a camera and sensor head above the 'Mech's shoulders so it can look over the waves, or over cover on dry land, and spot for its own indirect fire without a drone. "
            + "It is an Inner Sphere device: the Clans took no part in those wars and do not field it.",
        rules: `Works as the VTOL Mast Mount does (${tons(item)}, ${slots(item)}): the 'Mech spots and traces line of sight for spotting as if 1 level higher than it stands; it cannot make direct-fire attacks from the mast. One a unit.`,
    }),
    "custom-chaff-pod-2": (item) => ({
        lore: "Prince's Chaff Pod 2.0 crosses the Chaff Pod with the Vehicular Grenade Launcher: one SRM-style tube that fires pods of chaff into the air ahead of the 'Mech, so a single launcher can lay a series of screens.",
        rules: `Holds 4 pods (${tons(item)}, ${slots(item)}); each does what a Chaff Pod does (light smoke, an ECM bubble and anti-missile cover for one turn) in the unit's hex or one adjacent hex, so it can block line of sight. An unfired pod explodes for 3 points a pod if the launcher takes a critical hit.`,
    }),
    "custom-modular-c3": () => ({
        lore: "An outgrowth of the Improved C3 Computer, like an Inner Sphere Nova CEWS without its ECM: one standard unit that can be sized up or down to the number of machines it must connect, so a lance and a company can share one design.",
        rules: "The 1-ton base shares targeting with 1 other unit; each half ton more adds another, up to 11 (6 tons, a 12-unit network). Every unit in the network mounts one. Links need line of sight and are named at the start of each Initiative Phase, so the network can change who it connects to; otherwise as the Improved C3 Computer. Network Battle Value applies to the whole force.",
    }),
    "custom-nuclear-pulse-cannon": (item) => ({
        lore: "A Rim Worlds Republic wonder weapon: a mirrored, breech-loaded chamber that detonates a small nuclear charge and directs the blast out of the barrel. It is terrible to fire and worse to stand near, and what it leaves behind stays hot.",
        rules: `A direct-fire artillery weapon (${tons(item)}, ${slots(item)}; it cannot fire indirectly) that AMS cannot stop. 35 damage to the target hex and 18 to each adjacent hex; a target that tracks heat also takes 2D6 heat, any other takes 2D6 more damage. `
            + "Each shot generates 20 heat plus 1D6 more from the charge. After 20 shots the barrel and firing assembly must be replaced, and firing makes the unit radioactive. 3 charges a ton.",
    }),
    "custom-superheavy-ppc": (item) => ({
        lore: "The Superheavy PPC pushes the Heavy PPC's idea further: more capacitors, more windings, a heavier barrel, and a bolt that hits as hard as anything a 'Mech can carry. It is heavy enough, and hot enough, that few designs make room for it.",
        rules: `A PPC (${statLine(item)}). The Battle Value and cost are the author's.`,
    }),
    "custom-fusion-lance": (item) => ({
        lore: "The Tikograd Lances were built in a hurry on Tikonov III in the autumn of 3028. When the Federated Suns' Crucis Lancers came down on the Capellan world, the Night Riders had cleared the sky and the walls of Tikograd were already breaking under artillery. "
            + "In the heavy-engine shops of the industrial sector, a chief technician named Natalya Orlova argued that a 'Mech's best weapon was its own reactor: bleed the plasma through a magnetic nozzle on the chest and throw the engine's heart at the enemy, harder the bigger the engine. "
            + "Pavel Ridzik, who had nothing else, let her build them. A lance could kill a heavy 'Mech in two shots at a range of three hexes, and the same surge that fired it could crack the carrier's own engine and cook its pilot. "
            + "The few that were built slowed the Seventh Crucis Lancers in the industrial sector, but Tikograd surrendered on 18 October. The Davion technicians who found the shops judged the design too dangerous to build, and the idea outlived the city: a 'Mech can be made to fire its own engine, for those with nothing left to lose.",
        rules: `${item.rules ?? ""}`,
    }),
    "custom-omni-laser": (item) => ({
        lore: "The Omni-Laser is a single laser with three faces. Its crystals can be tuned between pulses, so one weapon can burn a single location, scatter a barrage of pulses or fill the air with light: a different weapon for each turn, chosen at the start of the Weapons Phase.",
        rules: `A laser (${tons(item)}, ${slots(item)}, range ${hex(item)}). The player picks a mode at the start of the Weapons Phase, kept until the next one. A critical hit disables the weapon. Focus: 20 heat, 16 damage to one location; if armor still covers the location, a through-armor critical roll at -2. `
            + "Pulse: 18 heat, four 5-damage shots on the 4 column of the cluster table, -1 to hit and +1 on the cluster roll. Dazzler: 12 heat, fifteen 1-damage shots on the 15 column; against infantry, battle armor or ProtoMechs a hit does 4d6 in 5-damage clusters. "
            + "A targeting computer and laser insulation apply; a power amplifier is needed on ICE and fuel cell units.",
    }),
    "custom-pile-bunker": (item) => ({
        lore: "The Pile Bunker is a close-quarters weapon in the pile driver's line: an explosive charge drives a heavy spike out of a bunker-like housing with enough force to stagger a 'Mech and punch through its armor at point-blank range.",
        rules: `A melee weapon (${tons(item)}, ${slots(item)}): 15 damage on a hit, and the target makes a Piloting roll with a +1 modifier. It is +1 to hit, builds 2 heat from the charge, and fires three times to the ton of ammunition; a hit on that ammunition does 5 damage a shot.`,
    }),
};

/** The speed-tiered tubes of Kronos Battle Systems' size 8 and 10 launchers. */
const LAUNCHER_FAMILY: Record<string, { name: string; lore: string; rule: string }> = {
    srm: { name: "short-range missile", lore: "a short-range missile launcher of the Kronos Battle Systems line, sized above the SRM 6", rule: "as an SRM launcher" },
    srt: { name: "short-range torpedo", lore: "a short-range torpedo launcher of the Kronos Battle Systems line, sized above the SRT 6, for the water", rule: "as an SRT launcher: a torpedo that fights in the water" },
    "streak-srm": { name: "Streak short-range missile", lore: "a Streak short-range missile launcher of the Kronos Battle Systems line, whose guidance circuits fire only when the lock holds", rule: "as a Streak SRM launcher: it fires only on a lock, and no missiles are wasted on a miss" },
    "streak-srt": { name: "Streak short-range torpedo", lore: "a Streak short-range torpedo launcher of the Kronos Battle Systems line, whose sonar confirms the lock before launch", rule: "as a Streak SRT launcher: it fires only on a lock, and no torpedoes are wasted on a miss" },
};

const launcherBuilder: Builder = (item) => {
    const match = /^custom-(streak-srm|streak-srt|srm|srt)-(8|10)(-os)?$/.exec(item.tag);
    if (!match) return { lore: "", rules: "" };
    const family = LAUNCHER_FAMILY[match[1]];
    const tubes = match[2], oneShot = !!match[3];
    return {
        lore: `The ${family.name.charAt(0).toUpperCase() + family.name.slice(1)} ${tubes}${oneShot ? " (one-shot)" : ""} is ${family.lore}. ${oneShot ? "It is a disposable single-volley pack, thrown away once it is spent." : "Its tubes are reloaded from ammunition between volleys."}`,
        rules: `Fires ${tubes} missiles, ${family.rule}: the Missile Hits Table for how many strike, ${(item.damagePerCluster ?? 2)} damage each (${tons(item)}, ${slots(item)}, ${item.heat} heat, range ${hex(item)}).${oneShot ? " One-shot: it cannot be reloaded." : ` ${item.shotsPerTon} volleys a ton.`}`,
    };
};

/** Special ammunition for machine guns: the catalog's older entries, by kind. */
const MG_KINDS: Record<string, { lore: string; rule: string }> = {
    ap: { lore: "Hardened-core rounds for punching through armor that ordinary bullets glance off.", rule: "armor-piercing rounds" },
    incendiary: { lore: "Rounds that burn as they fly, to set fires and to cook soft targets.", rule: "incendiary rounds" },
    tracer: { lore: "Rounds that glow along their path, so the gunner can walk a stream of fire onto a target.", rule: "tracer rounds" },
};

const machineGunAmmo: Builder = (item) => {
    const match = /^ammo-(heavy-|light-)?machine-gun-(ap|incendiary|tracer)$/.exec(item.tag);
    if (!match) return { lore: "", rules: "" };
    const kind = MG_KINDS[match[2]];
    const size = match[1] ? match[1].replace("-", " ") : "";
    return {
        lore: `${kind.lore} Loaded into the ${size}machine gun's bins in place of standard rounds.`,
        rules: `Special ${size}machine gun ${kind.rule}, ${item.roundsPerTon} rounds a ton, resolved as the canon ${size}machine gun's ${kind.rule}; it carries its standard round's Battle Value.`,
    };
};

/** EMP rounds, by launcher. */
const empAmmo: Builder = (item) => {
    const match = /^ammo-is-(.+)-emp$/.exec(item.tag);
    if (!match) return { lore: "", rules: "" };
    const launcher = item.name.replace(/ - EMP Ammo.*$/, "");
    return {
        lore: `An electromagnetic-pulse warhead for the ${launcher}, from VoiceOfAN's police equipment submission: the missile gives up its blast for a burst of electromagnetic energy that scorches little armor but can drop a machine's systems into shutdown.`,
        rules: `A special munition for the ${launcher}, a non-Streak launcher's round. On a hit, roll 2D6 for each hit location: on 11+ the target shuts down. Otherwise as the standard round; twice its cost and 2.5 times its Battle Value.`,
    };
};

const rounds = (item: IEquipmentItem): string => `${item.roundsPerTon} round${item.roundsPerTon === 1 ? "" : "s"} a ton`;
const titleCase = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** Thunderbolt missiles of the catalog's older custom list, by kind. */
const thunderboltAmmo: Builder = (item) => {
    const match = /^ammo-is-thunderbolt-(5|10|15|20)-(semi-guided|narc-capable|thunder)$/.exec(item.tag);
    if (!match) return { lore: "", rules: "" };
    const [, size, kind] = match;
    const kinds: Record<string, { lore: string; rule: string }> = {
        "semi-guided": { lore: "Semi-guided missiles for the Thunderbolt, fitted with a seeker that follows a laser designator, so a spotter's TAG can put them on a target the launcher cannot see.", rule: "semi-guided missiles: they home on a unit designated by TAG, as semi-guided LRMs do" },
        "narc-capable": { lore: "Missiles for the Thunderbolt with a homing head tuned to a Narc beacon, so a pod on the target draws the whole salvo in.", rule: "Narc-capable missiles: they home on a unit carrying a Narc beacon, as the canon Narc-capable missiles do" },
        thunder: { lore: "Thunder munitions for the Thunderbolt: instead of a warhead, a salvo of mines that scatter over the target's hex, a barrier thrown in front of an advance.", rule: "Thunder munitions: they scatter a minefield on the target hex, as the canon Thunder munition does" },
    };
    return {
        lore: kinds[kind].lore,
        rules: `Ammunition for the Thunderbolt ${size} launcher, ${rounds(item)}: ${kinds[kind].rule}. Otherwise as the Thunderbolt ${size}'s standard missile.`,
    };
};

/** Caseless rotary autocannon rounds. */
const caselessAmmo: Builder = (item) => {
    const match = /^ammo-(is|clan)-rotary-ac-(2|5)-caseless$/.exec(item.tag);
    if (!match) return { lore: "", rules: "" };
    return {
        lore: "Rounds with no brass case: the propellant is the round, so more of them fit in a ton, and the rotary mechanism has no spent cases to clear.",
        rules: `Caseless rounds for the ${match[1] === "is" ? "Inner Sphere" : "Clan"} Rotary AC/${match[2]}, ${rounds(item)}, twice the standard round's count, as the canon caseless ammunition.`,
    };
};

/** The ammunition of the Kronos 15-class autocannons and the rotary rifle cannons. */
const classAmmo: Builder = (item) => {
    const table: Record<string, string> = {
        "ammo-ac-15-standard": "the Class 15 autocannon", "ammo-ultra-ac-15-standard": "the Class 15 Ultra autocannon",
        "ammo-lb-15x-standard": "the Class 15 LB-X autocannon, as a solid slug", "ammo-lb-15x-cluster": "the Class 15 LB-X autocannon, as cluster rounds",
        "ammo-is-heavy-rotary-rifle-standard": "the Heavy Rotary Rifle Cannon", "ammo-medium-rotary-rifle-standard": "the Medium Rotary Rifle Cannon", "ammo-light-rotary-rifle-standard": "the Light Rotary Rifle Cannon",
    };
    const gun = table[item.tag];
    if (!gun) return { lore: "", rules: "" };
    return {
        lore: `Ammunition for ${gun}, packed in the same crates the other rounds of its line use.`,
        rules: `Rounds for ${gun}, ${rounds(item)}, standard rounds. The ammunition explodes if the bin is hit.`,
    };
};

const FAMILIES: Builder[] = [launcherBuilder, machineGunAmmo, empAmmo, thunderboltAmmo, caselessAmmo, classAmmo];

/** More ammunition and combination guns that need a line each. */
const MORE: Record<string, (item: IEquipmentItem) => ILoreRules> = {
    "ammo-is-vehicle-flamer-acid": () => ({ lore: "A corrosive fuel for the vehicle flamer: instead of fire it throws a spray that eats at armor and at what lies under it.", rules: "Acid fuel for the vehicle flamer: the flamer's attack with acid in place of fire. The catalog's older entry; the flamer's own rules apply." }),
    "ammo-is-long-tom-anti-orbital": () => ({
        lore: "After the Smoke Jaguar WarShip Sabre Cat razed the city of Edo on Turtle Bay from orbit in 3050, the Federated Suns resolved that it would not happen to one of their worlds again. Their answer was a Long Tom shell that could reach orbit, "
            + "fired in prototype in 3055 and in production by 3062, and used against the Word of Blake's fleets in the Jihad.",
        rules: "A Long Tom round that makes a surface-to-orbit attack under the Strategic Operations rules for capital and sub-capital weapons, as a ballistic attack: 5 points of standard-scale damage a hit, 3 rounds a ton. It fires once a space turn (6 ground turns). The Ammunition readout gives the house rules for early firing, misfires and moving targets.",
    }),
    "ammo-custom-clan-artvee-ac-5": () => clanArtVee(5), "ammo-custom-clan-artvee-ac-10": () => clanArtVee(10), "ammo-custom-clan-artvee-ac-20": () => clanArtVee(20),
    "ammo-custom-railgun-nightstalker666-standard": (item) => ({
        lore: "Caseless, pulse-ignited slugs for the Nightstalker666 railgun, loaded sixteen to the ton.",
        rules: `Rounds for the Nightstalker666 railgun, ${rounds(item)}. A hit on the bin does 2 damage a round unless a laser or PPC caused it; heat, flamers and infernos do not set it off.`,
    }),
    "ammo-custom-railgun-captain-standard": (item) => ({
        lore: "Two slugs a ton for the Captain railgun, each as big as a man.",
        rules: `Rounds for the Captain railgun, ${rounds(item)}. The ammunition explodes if the bin is hit.`,
    }),
    "ammo-custom-light-ac-10-standard": (item) => ({ lore: "Ordinary AC/10 rounds, packed for the Light Autocannon/10.", rules: `Rounds for the Light Autocannon/10, ${rounds(item)}, standard rounds.` }),
    "ammo-custom-light-ac-20-standard": (item) => ({ lore: "Ordinary AC/20 rounds, packed for the Light Autocannon/20.", rules: `Rounds for the Light Autocannon/20, ${rounds(item)}, standard rounds.` }),
    "ammo-custom-is-light-chemical-laser-standard": (item) => ({
        lore: "Canisters of chemical charge for the Light Chemical Laser, the reagents the beam burns in place of reactor power. They are made to burn, and they burn well.",
        rules: `About ${item.roundsPerTon} chemical charges a ton. A hit on the bin explodes as usual (50 points a full ton), sets the unit's hex on fire, and each adjacent hex takes a chemical attack.`,
    }),
    "ammo-custom-nuclear-pulse-cannon-standard": (item) => ({
        lore: "A small nuclear charge, sealed in a canister that fits the Nuclear Pulse Cannon's mirrored chamber.",
        rules: `${rounds(item)} for the Nuclear Pulse Cannon. The charge explodes if the bin is hit.`,
    }),
    "ammo-custom-pile-bunker-standard": (item) => ({
        lore: "The charges that drive the Pile Bunker's spike, a cartridge to a shot, packed in a magazine that burns hard if it is hit.",
        rules: `Charges for the Pile Bunker, ${rounds(item)}. A hit on the bin does 5 damage a shot; the ammunition explodes.`,
    }),
    "custom-artvee-thumper-combo": () => combo("Autocannon/5", "Thumper", false), "custom-artvee-sniper-combo": () => combo("Autocannon/10", "Sniper", false), "custom-artvee-long-tom-combo": () => combo("Autocannon/20", "Long Tom", false),
    "custom-clan-artvee-thumper-combo": () => combo("Autocannon/5", "Thumper", true), "custom-clan-artvee-sniper-combo": () => combo("Autocannon/10", "Sniper", true), "custom-clan-artvee-long-tom-combo": () => combo("Autocannon/20", "Long Tom", true),
};

function clanArtVee(size: number): ILoreRules {
    return {
        lore: "The Clans kept the ArtVee and never lost it, so its breech rounds stayed in production after the Clan standard autocannon ammunition went extinct in 2850.",
        rules: `Breech rounds for the Clan ArtVee's AC/${size} mode. The figures are the canon standard AC/${size} ammunition's.`,
    };
}

function combo(autocannon: string, artillery: string, clan: boolean): ILoreRules {
    return {
        lore: `The ${clan ? "Clan " : ""}ArtVee ComboGun is a convertible gun: one breech that fires as an autocannon while the vehicle drives and as artillery when it plants itself in siege mode, so the same crew can cover the advance and then shell the far ridge.`,
        rules: `Fires as the ${autocannon} in Vehicle Mode and as the ${artillery} artillery piece in Siege Mode. Feeds from artillery and autocannon ammunition bins.`,
    };
}

const HAILSTORM_ROUNDS: Record<string, string> = {
    copperhead: "Copperhead", thunder: "Thunder", standard: "Standard", cluster: "Cluster", flechette: "Flechette", illumination: "Illumination", smoke: "Smoke", fae: "Fuel-Air",
};

const hailstormAmmo: Builder = (item) => {
    const match = /^ammo-hailstorm-(.+)$/.exec(item.tag);
    if (!match || !HAILSTORM_ROUNDS[match[1]]) return { lore: "", rules: "" };
    const kind = HAILSTORM_ROUNDS[match[1]];
    return {
        lore: `A ${kind.toLowerCase()} shell for the towed Hailstorm gun of the MechWarrior 5 campaigns, a heavier round than the Long Tom's.`,
        rules: `Rules as the Long Tom's ${kind} ammunition; where that round's damage follows the Long Tom's 25, use the Hailstorm's 35. ${rounds(item)}.`,
    };
};

FAMILIES.push(hailstormAmmo);

const SPECIFIC_AMMO: Record<string, ILoreRules> = {
    "ammo-custom-smoker-fuel": { lore: "Slow-burning oil for the Smoker's nozzle, carried in drums that burn well if they are hit.", rules: "Each ton of fuel provides 50 hexes of level 2 smoke for the Smoker. A hit to the fuel results in a small fire, doing 5 points of damage and generating 10 points of heat." },
};

/** Whether the tag has a builder that produces text. */
const tryBuild = (item: IEquipmentItem): ILoreRules | undefined => {
    const bespoke = BESPOKE[item.tag];
    if (bespoke) {
        const built = bespoke(item);
        if (built.lore && built.rules) return built;
    }
    if (SPECIFIC_AMMO[item.tag]) return SPECIFIC_AMMO[item.tag];
    if (MORE[item.tag]) return MORE[item.tag](item);
    for (const family of FAMILIES) {
        const built = family(item);
        if (built.lore && built.rules) return built;
    }
    return undefined;
};

/** The notes of an entry that came with the original tool's custom list and records no source. */
const NO_SOURCE_NOTE = "No source recorded: this entry came with the original tool's custom list, and its rules are those of the canon item it is built on. Kept at Custom Homebrew until a source is found.";

/**
 * Fills the missing lore and rules of the listed items, a note for an entry that records no source, and (for a custom catalog) a rules level of
 * Custom Homebrew where the record says less than Apocryphal; returns the same list.
 */
export function applyLoreAndRules(items: IEquipmentItem[], customCatalog: boolean = false): IEquipmentItem[] {
    for (const item of items) {
        if (customCatalog && (item.rulesLevel === undefined || item.rulesLevel < 5)) item.rulesLevel = 6;
        if (!item.lore || !item.rules) {
            const built = tryBuild(item);
            if (built) {
                if (!item.lore) item.lore = built.lore;
                if (!item.rules) item.rules = built.rules;
            }
        }
        if (customCatalog && !item.notes && item.lore) item.notes = NO_SOURCE_NOTE;
    }
    return items;
}
