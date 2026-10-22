# LRM Alternate Munitions Review

This is a tabletop-rules review block sourced from the supplied Catalyst and
alternate-munitions references. These records are not promoted into the
equipment catalogs until exact ammunition cost, ammo-per-ton, availability,
tech-base, and project-compatible behavior are verified.

## Standard LRM-Compatible Candidates

- Semi-Guided LRM
- Heat-Seeking LRM
- Listen-Kill Missile
- Follow-the-Leader Warhead
- Thunder LRM
- Thunder-Augmented (Vibro)
- Thunder-Inferno
- Fragmentation (Frag) LRM
- Incendiary LRM
- Narc Guide Missile
- Swarm LRM
- Swarm-I LRM
- Magnetic-Pulse Warhead
- Mine-Clearance Missile
- Smoke LRM
- Dead-Fire LRM

Artemis IV ammunition is already represented for the supported IS LRM,
Enhanced LRM, and MML launchers, with explicit Clan records where applicable.
Artemis V remains a separate review candidate until its launcher and ammo
compatibility are verified for this project.

## Separate Torpedo Family

Long-Range Torpedo equipment mirrors the corresponding LRM equipment profile,
but is used underwater and fires LRM-T ammunition. It requires a dedicated LRT
launcher and cannot be cross-loaded into a standard LRM. A standard LRM
likewise cannot fire LRT ammunition.

Short-Range Torpedo equipment mirrors the corresponding SRM equipment profile,
but is used underwater and fires SRM-T ammunition. Medium-Range Torpedo
equipment mirrors the corresponding MRM equipment profile, but is used
underwater and fires MRM-T ammunition. SRT and MRT launchers are likewise
dedicated torpedo launchers and do not cross-load standard SRM or MRM rounds.

The LRT 5/10/15/20, SRT 2/4/6, and MRT 10/20/30/40 launchers and their
matching `-T` ammunition should therefore be modeled as separate torpedo
families that inherit the corresponding LRM, SRM, or MRM metrics. They should
not be added as alternate ammo tags on standard launcher records. The Streak
and Artemis compatibility clarification applies to these torpedo variants as
well: applicable LRT, SRT, and MRT Streak/Artemis variants remain valid and
must not be blanket-excluded.

## Multi-Purpose Launcher Exception

The Multi-Purpose Missile Launcher (MPLM) is a launcher modification, not an
ammunition type. It may be applied to eligible LRM, SRM, or MML launchers and
permits the relevant standard and torpedo loading modes under the MPLM rules,
with the stated 50 percent launcher cost increase.

## Alpha Strike Handling

Alternate ammunition is a declared tactical option, not a separate shot-count
pool. Before play, players agree to use alternate ammunition and note at most
one alternate type per applicable weapon tag on the unit card. Declaring that
munition replaces the weapon's normal damage for that attack. Ammunition is
effectively unlimited unless the weapon is marked One-Shot.

For the LRM candidates, the initial Alpha Strike mappings are:

- Semi-Guided: ignore TMM and indirect-fire penalties when friendly TAG has
	successfully painted the target.
- Thunder: target a map point, deal no direct damage, and create Minefield
	(Density 2).
- Swarm: replace normal LRM damage; on a failed attack, resolve the adjacent
	target behavior defined by the Alpha Strike rules.

These effects should be stored as alternate-ammunition metadata or rule
references rather than invented numeric weapon records.

## Alpha Strike Torpedoes

LRT and SRT launchers use the separate `TOR (#/#/#)` ability. TOR may only be
used by a unit occupying a water hex and only against a unit in or directly
over that water feature. TOR ignores underwater range and environmental
penalties. It does not replace the unit's normal damage line; a unit may stack
its normal underwater-capable attack with TOR when both are applicable.

This TOR behavior is distinct from standard LRM ammunition and must remain
separate from the LRT/SRT launcher and ammunition family.

## Current Inventory Result

No LRT, SRT, Long-Range Torpedo, Short-Range Torpedo, or TOR records were
found in the current TypeScript catalogs, local knowledge corpus, scraped
equipment inventory, or MegaMek identity inventory. Launcher construction
metrics and Alpha Strike `TOR` values remain an evidence gap for a future
promotion block.

## Promotion Blockers

The current `IEquipmentItem` schema can represent these as ammunition, but the
catalog still needs verified tabletop fields and a deliberate Alpha Strike
policy for each effect. Minefields, smoke, fire, electronic disruption, swarm
retargeting, dead-fire guidance penalties, LRT compatibility, and MPLM
modification rules should not be encoded as invented numeric Alpha Strike
stats.

Apollo remains a fire-control variant and reuses standard MRM ammunition; it
does not receive a separate ammunition record.