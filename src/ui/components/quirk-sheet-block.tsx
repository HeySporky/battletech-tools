import type { JSX } from "react";
import { QuirkList } from "../../classes/quirk-list";
import { getQuirkSheetLines } from "../../utils/quirk-sheet-lines";

export type QuirkSheetLines = ReturnType<typeof getQuirkSheetLines>;

/**
 * A unit's quirk lines for its record sheet: only quirks on weapons it still carries print. `bayUuids` are the ids
 * of weapons in its bays not among `items` (capital mounts), so their bays' quirks print too.
 */
export function getUnitQuirkSheetLines(
    quirks: QuirkList,
    items: { uuid?: string; label: string }[],
    locations: { tag: string; label: string }[] = [],
    bayUuids: string[] = [],
): QuirkSheetLines {
    const installed = items.filter((item) => item.uuid);
    return getQuirkSheetLines(
        quirks.getActive([...installed.map((item) => item.uuid as string), ...bayUuids], undefined),
        (uuid) => installed.find((item) => item.uuid === uuid)?.label,
        (tag) => locations.find((location) => location.tag === tag)?.label,
    );
}

/**
 * The quirk names printed beside a weapon bay, matched by any of its weapons' ids, or "" when it has none. With the
 * sheet's bays in `allBays`, a quirk whose bay has since split prints once, on the bay holding most of its weapons
 * (the first of equals), as it is costed once (CO p.225).
 */
export function bayQuirkSuffix(lines: QuirkSheetLines, uuids: string[], allBays: string[][] = [uuids]): string {
    const shared = (quirkUuids: string[], bay: string[]): number => bay.filter((uuid) => quirkUuids.includes(uuid)).length;
    const sameBay = (bay: string[]): boolean => bay.length === uuids.length && bay.every((uuid) => uuids.includes(uuid));
    const printsHere = (quirkUuids: string[]): boolean => {
        let best: string[] | undefined;
        for (const bay of allBays) {
            if (shared(quirkUuids, bay) > (best ? shared(quirkUuids, best) : 0)) best = bay;
        }
        return !!best && sameBay(best);
    };
    const texts = lines.bays.filter((bay) => printsHere(bay.uuids)).map((bay) => bay.text);
    return texts.length ? ` [${texts.join(", ")}]` : "";
}

/** The quirk names printed beside a weapon, or "" when it has none. */
export function weaponQuirkSuffix(lines: QuirkSheetLines, uuid: string | undefined): string {
    const entry = uuid ? lines.weapons.find((weapon) => weapon.uuid === uuid) : undefined;
    return entry ? ` [${entry.text}]` : "";
}

/**
 * The sheet's "Quirks" block; nothing when the unit has none. `weaponLabels` lists weapon quirks here too, for a
 * sheet that prints weapons only in bays.
 */
export function QuirkSheetBlock(props: { lines: QuirkSheetLines; weaponLabels?: (uuid: string) => string }): JSX.Element | null {
    const weapons = props.weaponLabels ? props.lines.weapons.map((weapon) => `${props.weaponLabels!(weapon.uuid)}: ${weapon.text}`) : [];
    if (props.lines.unit.length + weapons.length === 0) {
        return null;
    }
    return (
        <div data-testid="quirk-sheet-block">
            <h3>Quirks</h3>
            {props.lines.unit.length ? <p>{props.lines.unit.join(", ")}</p> : null}
            {weapons.map((line) => <p key={line} className="smaller-text">{line}</p>)}
        </div>
    );
}
