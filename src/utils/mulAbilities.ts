// Alpha Strike special abilities as the MUL lists them in BFAbilities: a comma-separated string such as
// "ENE, IF 2, TUR (2/2/2, IF1)". The same code appears with and without a space before its value
// ("IF 1" / "IF1"), turret contents are split across commas, and a few role names ("Brawler") and
// placeholders ("None") are mixed in.

export interface IAbilityCodeCount {
    code: string;
    count: number;
}

function splitAbilities(abilities: string | null | undefined): string[] {
    return (abilities ?? "").split(",").map((ability) => ability.trim()).filter((ability) => ability.length > 0);
}

// "IF 2" and "IF2)" both become "IF2", so a query compares against the ability however it was typed.
function compactAbility(ability: string): string {
    return ability.toUpperCase().replace(/[\s()]/g, "");
}

// The code without its value: "IF 1" -> "IF", "LRM 1/2/2" -> "LRM", "ARTAIS-1" -> "ARTAIS", "C3M" -> "C3M".
// Returns null for anything that is not an upper-case ability code (role names, "None", stray values).
export function getAbilityBaseCode(ability: string): string | null {
    const head = ability.trim().split(/[\s(]/)[0].replace(/\)+$/, "");
    if (!/^[A-Z][A-Z0-9-]*[A-Z0-9*/.]*$/.test(head)) {
        return null;
    }

    const withoutValue = head.replace(/-?[\d.*][\d.*/-]*$/, "");
    // A one-letter remainder means the digits were part of the code ("C3"), not a value.
    return withoutValue.length >= 2 ? withoutValue : head;
}

// True when the unit has the ability. "IF" matches any IF value; "IF2" matches only IF 2; "ECM" does not match LECM.
export function unitHasAbility(unitAbilities: string | null | undefined, query: string): boolean {
    const normalizedQuery = query.trim().toUpperCase();
    const queryCode = getAbilityBaseCode(normalizedQuery);
    if (!queryCode) {
        return false;
    }
    const compactQuery = compactAbility(normalizedQuery);

    return splitAbilities(unitAbilities).some((ability) =>
        getAbilityBaseCode(ability) === queryCode && compactAbility(ability).startsWith(compactQuery)
    );
}

// Every ability code in the list with the number of units that have it, most common first.
export function countAbilityCodes(units: { BFAbilities?: string | null }[]): IAbilityCodeCount[] {
    const counts = new Map<string, number>();
    for (const unit of units) {
        const codes = new Set(
            splitAbilities(unit.BFAbilities)
                .map(getAbilityBaseCode)
                .filter((code): code is string => code !== null)
        );
        for (const code of codes) {
            counts.set(code, (counts.get(code) ?? 0) + 1);
        }
    }

    return [...counts.entries()]
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
}
