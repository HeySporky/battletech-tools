/*
 * The wording Aces behavior cards print, as templates. The cards repeat a small set of phrases and change only a
 * number or a colour, so a card photo's OCR is matched to the nearest phrase and only the changing parts are taken
 * from the photo (an idea from Rekikire). From our card data (aces-cards.ts, aces-card-samples.ts), the Missile
 * Boat and Scout (Hover) cards photographed for #591, and Rekikire's typed library of 66 behavior cards (Nov 2026).
 * Phrases that differ only in case or commas are kept once: two phrases that read the same tie, and a tie keeps
 * the line as read.
 *
 * Slots: {n} an inch distance or count, {c} a Command card colour (blue, red or yellow).
 */

export const acesConditionPhrases: string[] = [
    "If there are any [moved] enemies in {n}\"",
    "If there are any [moved] enemies in {n}\" and no [notmoved] enemies in {n}\"",
    "If there are any [moved] enemies in {n}\", and no [notmoved] enemies in {n}\", and this unit has [nolos] any enemy",
    "If there are any enemies in {n}\"",
    "If there are any enemies in this unit's [range]",
    "If there are at least {n} enemies in [los] and {n}\"",
    "If there are more allies than enemies in {n}\"",
    "If there are no [moved] enemies in {n}\"",
    "If there are no [notmoved] enemies in {n}\"",
    "If the ideal [{c}] is [moved]",
    "If the ideal [{c}] is [moved] and in {n}\"",
    "If the ideal [{c}] enemy is [moved] and in {n}\"",
    "If the ideal [{c}] is [moved] and unit can move behind it",
    "If the ideal [{c}] is [moved] and unit can move in {n}\" of it",
    "If the ideal [{c}] is [moved] and unit can move to attack it without being in any [moved] enemies [range]",
    "If the ideal [{c}] is [moved] and unit can move to attack it without being in any [moved] enemy's [range]",
    "If both bullets are true: There is an [moved] enemy within {n}\", and in your current [range]. This unit occupies woods or occupies depth 1 water.",
    "If this unit deals more damage than the armor of any enemy in {n}\"",
    "If this unit has more armor than the damage rating of any enemy",
    "If this unit has more armor than the damage rating of any enemy in {n}\"",
    "If this unit is crippled",
    "If unit can move behind nearest [moved] enemy",
    "If unit has any armor and there are any [range] [moved] enemies in {n}\"",
];

export const acesMovementFilterPhrases: string[] = [
    "[closer] ally",
    "[closer] target",
    "[closer] target (behind if able)",
    "[los] target",
    "[los] only to target",
    "[los] [lowest] other enemies",
    "[los] to [lowest] other enemies",
    "[nolos] all enemies",
    "If sprinting, [nolos] all enemies",
    "if not sprinting, [range] target",
    "[range] target",
    "[range] [highest] enemies",
    "[range] most allies",
    "[range] to at least {n} [moved] enemy",
    "{n}\" [spacing] target",
    "{n}\" [spacing] [notmoved] enemies",
    "ally in {n}\"",
    "behind target",
    "cover from target",
    "cover vs target",
    "cover vs [highest] enemies",
    "cover vs [highest] enemies (avoid water)",
    "cover vs [highest] [moved] enemies",
    "cover vs [moved] nearest",
    "cover vs [notmoved] enemies",
    "cover vs all [moved] enemies",
    "woods cover vs [highest] enemies",
    "in [lowest] enemy [range]",
    "in [lowest] [moved] enemy [range]",
    "in no [moved] enemy [range]",
    "intervening woods vs [highest] other enemies",
    "no [notmoved] enemies in {n}\"",
    "no [notmoved] enemies in [los]",
    "no enemies in {n}\"",
    "no enemies in [S]",
    "no other enemy in [S]",
    "occupy woods",
    "occupy woods or depth 1 water",
    "onto highest elevation (use [jump] if needed)",
    "onto lowest elevation (use [jump] if needed)",
    "target at [M]",
    "target has no cover",
    "target in base contact",
];

/** The combat side's TARGET list. */
export const acesCombatFilterPhrases: string[] = [
    "[{c}] command list",
    "[highest] [M] damage",
    "[highest] Armor lost",
    "[highest] PV",
    "[highest] Structure lost",
    "[lowest] Armor",
    "[lowest] Structure",
    "[lowest] TMM",
    "Anti-'Mech attack vs. target in base contact",
    "Attacked by ally this turn",
    "Hit target's Rear",
    "no Armor",
    "no Cover",
];
