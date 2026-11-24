// Only allow http(s) and same-origin relative image URLs, and base64 png/jpeg/webp data URLs (a unit picture, #95),
// into <image href=...>. Blocks javascript:, other data: types such as svg, blob:, and other schemes that could
// execute script or bypass CSP when they land in an SVG image element.
// A picture stored in a design (#95): a base64 png, jpeg or webp, never svg or anything that can carry script.
const SAFE_DATA_IMAGE = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

/** Longest picture a design keeps (the 80 KB upload cap as base64 text, with room): a bigger one would fill browser storage. */
export const MAX_UNIT_IMAGE_LENGTH = 120_000;

export function isSafeImageDataURL(url: unknown): boolean {
    return typeof url === "string" && SAFE_DATA_IMAGE.test(url);
}

export function safeImageURL(url: unknown): string {
    if (typeof url !== "string") return "";
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (isSafeImageDataURL(trimmed)) return trimmed;
    // Relative paths (start with "/" or "./" or bare filename) are same-origin, allow.
    if (trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("../")) {
        return trimmed;
    }
    // Reject anything that looks like a scheme unless it is http(s):
    const schemeMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):/i);
    if (schemeMatch) {
        const scheme = schemeMatch[1].toLowerCase();
        if (scheme === "http" || scheme === "https") {
            return trimmed;
        }
        return "";
    }
    // No scheme, not clearly relative: treat as relative filename.
    return trimmed;
}

// Only allow http(s) URLs in externally-navigable <a href=...> buttons like Alerts.externalURL.
// Rejects javascript:/data:/vbscript:/etc so a poisoned URL can never fire script on click.
export function safeExternalURL(url: unknown): string {
    if (typeof url !== "string") return "";
    const trimmed = url.trim();
    if (!trimmed) return "";
    const schemeMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):/i);
    if (!schemeMatch) return "";
    const scheme = schemeMatch[1].toLowerCase();
    return (scheme === "http" || scheme === "https") ? trimmed : "";
}
