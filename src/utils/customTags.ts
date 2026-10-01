import type { CustomFaction } from "../data/custom-content-types";

// Custom record tags carry the submitter: [ammo-]<submitter>-[is-|clan-]<slug>. A draft starts with the
// provisional submitter "local" until a GitHub login is known.
export const PROVISIONAL_SUBMITTER = "local";

const ROUND_TYPE_SUFFIX = /(-standard|-swarm|-thunder|-inferno|-precision|-armor-piercing|-flechette|-tracer|-er|-he|-fragmentation|-incendiary)(-|$)/;

export function sanitizeSubmitter(login: string): string {
    const cleaned = login.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    return cleaned || "anonymous";
}

export function slugifyName(name: string): string {
    return name.toLowerCase()
        .replace(/([a-z])\.?(\d)/g, "$1 $2")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/** "Ammo (AC/25)" -> "ac-25-standard"; a name that already carries a round type keeps it. */
export function ammoSlug(name: string): string {
    const inner = name.replace(/^ammo\s*\((.*)\)$/i, "$1").replace(/\bammo\b/gi, "");
    const slug = slugifyName(inner);
    return ROUND_TYPE_SUFFIX.test(slug) ? slug : `${slug}-standard`;
}

export function buildCustomTag(args: { submitter: string; faction: CustomFaction; slug: string; isAmmo: boolean }): string {
    const parts = [args.submitter, args.faction === "universal" ? "" : args.faction, args.slug].filter((part) => part !== "");
    return (args.isAmmo ? "ammo-" : "") + parts.join("-");
}

export function finalizeTag(provisionalTag: string, submitter: string): string {
    return provisionalTag.replace(/^(ammo-)?local-/, `$1${submitter}-`);
}
