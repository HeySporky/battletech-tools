import React, { useState, type JSX } from "react";
import { testMordelKey, UNREACHABLE_MESSAGE } from "../../../utils/mordel/mordel-api";
import { getMordelKey, getMordelServer, isMordelKeyRejected, maskMordelKey, MordelServer, removeMordelKey, saveMordelKey, setMordelServer } from "../../../utils/mordel/mordel-key";

const RESULT_TEXT = {
    ok: "mordel.net accepted the key.",
    rejected: "mordel.net refused this key. Check it on your mordel.net account page.",
    unavailable: UNREACHABLE_MESSAGE,
};

/** Settings: the user's own mordel.net API key, kept on this device only. */
export default function MordelKeySettings(props: { developerMenu: boolean }): JSX.Element {
    const [saved, setSaved] = useState<string | null>(() => getMordelKey());
    const [rejected, setRejected] = useState(() => isMordelKeyRejected());
    const [draft, setDraft] = useState("");
    const [server, setServer] = useState<MordelServer>(() => getMordelServer());
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);

    const test = async (key: string) => {
        setBusy(true);
        setMessage("Testing…");
        const result = await testMordelKey(key);
        setBusy(false);
        // A refused saved key stays marked until a new one is saved.
        setRejected(isMordelKeyRejected());
        setMessage(RESULT_TEXT[result]);
        return result;
    };

    const save = async (event: React.FormEvent) => {
        event.preventDefault();
        const key = draft.trim();
        if (!key) return;
        saveMordelKey(key);
        setSaved(key);
        setRejected(false);
        setDraft("");
        await test(key);
    };

    const remove = () => {
        removeMordelKey();
        setSaved(null);
        setRejected(false);
        setMessage("The key was removed from this device.");
    };

    const changeServer = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const next = event.currentTarget.value === "sandbox" ? "sandbox" : "production";
        setMordelServer(next);
        setServer(next);
    };

    return (
        <fieldset className="fieldset">
            <legend>Mordel.net</legend>
            <p>
                With your own <a href="https://mordel.net" target="_blank" rel="noreferrer">mordel.net</a> API key,
                you can add mordel.net units to your rosters and open them in the designer. Request a key on your
                mordel.net account page. The key is kept on this device only, is sent only to mordel.net, and is not
                included in backups.
            </p>
            {saved ? (
                <p>
                    Saved key: <code>{maskMordelKey(saved)}</code>
                    {rejected ? <strong className="text-danger"> — mordel.net refused it. Add a new key.</strong> : null}
                </p>
            ) : <p>No key saved.</p>}
            <form onSubmit={save}>
                <label>
                    {saved ? "Replace the key:" : "API key:"}
                    <input
                        type="password"
                        autoComplete="off"
                        spellCheck={false}
                        value={draft}
                        onChange={(event) => setDraft(event.currentTarget.value)}
                    />
                </label>
                <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !draft.trim()}>Save key</button>{" "}
                {saved ? <>
                    <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => void test(saved)}>Test key</button>{" "}
                    <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={remove}>Remove key</button>
                </> : null}
            </form>
            <p role="status">{message}</p>
            {props.developerMenu ? (
                <label>
                    Server (developers):
                    <select value={server} onChange={changeServer}>
                        <option value="production">mordel.net</option>
                        <option value="sandbox">sandbox.mordel.net</option>
                    </select>
                </label>
            ) : null}
        </fieldset>
    );
}
