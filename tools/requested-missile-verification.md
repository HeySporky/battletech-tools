# Requested Missile Verification

Sources checked: `_KNOWLEDGE_DEV/weapons/missile_weapons.md`, MegaMek weapon
identity paths, and approved Sarna weapon pages. MegaMek was used for identity
cross-checking only; Java class bodies were not used for numeric values.

## Confirmed Families

| Family | Confirmed sizes | Tech base |
| --- | --- | --- |
| Extended LRM | 5, 10, 15, 20 | Inner Sphere |
| MML | 3, 5, 7, 9 | Inner Sphere |
| MRM | 10, 20, 30, 40 | Inner Sphere |
| Rocket Launcher | 10, 15, 20 | Inner Sphere |
| Streak LRM | 5, 10, 15, 20 | Clan experimental |

Rocket Launcher 5 has no profile in the scraped source and no matching
MegaMek identity was found. It is not being invented.

PPC is already present as `name: "PPC"`, tag `standard-ppc` in the Inner
Sphere energy catalog. Clan PPC is present separately as `PPC (Clan)`.

## Source Fields

The local source confirms the following canonical fields for all 19 entries:

- Extended LRM 5/10/15/20: heat `3/6/8/12`, weights `6/8/12/18`, ranges
  `1-12 / 13-22 / 23-38`.
- MML 3/5/7/9: heat `2/3/4/5`, weights `1.5/3/4.5/6`, mixed SRM/LRM ranges
  as printed in the source.
- MRM 10/20/30/40: heat `4/6/10/12`, weights `3/7/10/12`, ranges
  `1-3 / 4-8 / 9-15`.
- Rocket Launcher 10/15/20: heat `3/4/5`, weights `.5/1/1.5`, one-shot
  launchers with source ranges `1-5 / 6-11 / 12-18`, `1-4 / 5-9 / 10-15`,
  and `1-3 / 4-7 / 8-12` respectively.
- Streak LRM 5/10/15/20: heat `2/4/5/6`, weights `2/5/7/10`, ranges
  `1-7 / 8-14 / 15-21`.

## Required Before Catalog Promotion

Every entry still needs a complete `IEquipmentItem` mapping, including exact
critical slots, ammunition behavior, introduction/extinction data, source
book/page, weapon flags, and project-compatible Alpha Strike fields.

The supplied Extended LRM 5 template conflicts with the source:

- Source heat is `3`, not `2`.
- Source damage is `1/Missile`, not `5`.
- Source weight is `6`, not `4`.
- Source BV is `67 launcher/8 ammunition`, not `70`.
- Source minimum range is `10`; the `range` bands are `1-12`, `13-22`, and
  `23-38`.
- Source does not establish the proposed Alpha Strike values.

No Alpha Strike values will be promoted from Classic BattleTech ranges or
unverified model output. The entries remain knowledge-stage candidates until
those fields are supplied from an authoritative Alpha Strike source or a
separately approved conversion rule.