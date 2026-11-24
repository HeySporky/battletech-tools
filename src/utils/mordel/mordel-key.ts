// The user's mordel.net API key. It is kept on this device only, under its own storage key so that backups and
// settings exports (which list their fields one by one) never carry it, and it is only ever sent to mordel.net.
import { readLocalStorage, writeLocalStorage } from "../../dataSavesStorage";

export const MORDEL_KEY_STORAGE = "mordelApiKey";
const SERVER_STORAGE = "mordelServer";
const REJECTED_STORAGE = "mordelKeyRejected";
/** Unit details pulled with the key (mordel-api.ts): private designs among them, so they go when the key does. */
export const MORDEL_DETAIL_CACHE_STORAGE = "mordelDetailCache";

export type MordelServer = "production" | "sandbox";

// The production API answers at mordel.net/api/v1 (checked live on 2026-11-22: key test, id list, list sweep and unit
// detail for all four types). The sandbox's address is from Scott's docs. The API allows any origin (CORS *).
export const MORDEL_BASES: Record<MordelServer, string> = {
    production: "https://mordel.net/api/v1",
    sandbox: "https://sandbox.mordel.net/api/v1",
};

const removeLocalStorage = (keyName: string): void => {
    try {
        localStorage.removeItem(keyName);
    } catch {
        // Storage may be disabled; there is then nothing to remove.
    }
};

export function getMordelKey(): string | null {
    const key = readLocalStorage(MORDEL_KEY_STORAGE)?.trim();
    return key ? key : null;
}

export function saveMordelKey(key: string): void {
    if (getMordelKey() !== key.trim()) removeLocalStorage(MORDEL_DETAIL_CACHE_STORAGE);
    writeLocalStorage(MORDEL_KEY_STORAGE, key.trim());
    removeLocalStorage(REJECTED_STORAGE);
}

export function removeMordelKey(): void {
    removeLocalStorage(MORDEL_KEY_STORAGE);
    removeLocalStorage(REJECTED_STORAGE);
    removeLocalStorage(MORDEL_DETAIL_CACHE_STORAGE);
}

/** mordel.net answered 401 for the saved key: it was revoked or mistyped. Cleared when a key is saved. */
export function isMordelKeyRejected(): boolean {
    return readLocalStorage(REJECTED_STORAGE) === "1";
}

export function markMordelKeyRejected(): void {
    writeLocalStorage(REJECTED_STORAGE, "1");
}

/** The saved key shown safely: dots and its last four characters. */
export function maskMordelKey(key: string): string {
    return key.length <= 4 ? "••••" : "••••" + key.slice(-4);
}

export function getMordelServer(): MordelServer {
    return readLocalStorage(SERVER_STORAGE) === "sandbox" ? "sandbox" : "production";
}

export function setMordelServer(server: MordelServer): void {
    writeLocalStorage(SERVER_STORAGE, server);
}

/** The API base for the chosen server. */
export function mordelBaseUrl(server: MordelServer = getMordelServer()): string {
    return MORDEL_BASES[server];
}
