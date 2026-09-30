// Only allow http(s) and same-origin relative image URLs into <image href=...>.
// Blocks javascript:, data:, blob:, and other schemes that could execute script
// or bypass CSP when they land in an SVG image element.
export function safeImageURL(url: unknown): string {
    if (typeof url !== "string") return "";
    const trimmed = url.trim();
    if (!trimmed) return "";
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
