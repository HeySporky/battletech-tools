import React, { useEffect, useState, type JSX } from 'react';
import { IStarSystemIndexEntry } from '../../../../data/star-systems/star-system-types';
import { loadStarSystemIndex, searchStarSystems } from '../../../../data/star-systems/star-systems';

/** A search box over the star catalog: type two letters or more, then pick a system from the buttons. */
export default function SystemSearch(props: { label: string; onPick: (system: IStarSystemIndexEntry) => void }): JSX.Element {
    const [query, setQuery] = useState("");
    const [ready, setReady] = useState(false);
    useEffect(() => {
        let live = true;
        loadStarSystemIndex().then(() => { if (live) setReady(true); });
        return () => { live = false; };
    }, []);
    const results = ready && query.trim().length >= 2 ? searchStarSystems(query, 12) : [];
    return (
        <div className="campaign-system-search">
            <label>
                {props.label}{" "}
                <input type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} />
            </label>
            {!ready ? <span className="smaller-text"> Loading star systems...</span> : null}
            {results.length > 0 ? (
                <div className="campaign-search-results">
                    {results.map((system) => (
                        <button type="button" key={system.id} className="btn btn-secondary btn-sm"
                            onClick={() => { props.onPick(system); setQuery(""); }}>
                            {system.name}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
