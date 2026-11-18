import React, { type JSX } from 'react';
import { Link } from 'react-router';
import ammunitionText from '../../../../docs/lore/ammunition-tro.md?raw';
import falconetArt from '../../../../docs/lore/artvee-falconet.svg';
import artveeText from '../../../../docs/lore/artvee-tro.md?raw';
import introductionText from '../../../../docs/lore/tro-jbt.md?raw';
import microMechsText from '../../../../docs/lore/micro-mechs-tro.md?raw';
import walkersText from '../../../../docs/lore/walkers-tro.md?raw';
import bestOfFutureWarsText from '../../../../docs/lore/best-of-future-wars-tro.md?raw';
import homebrewEquipmentText from '../../../../docs/lore/homebrew-equipment-tro.md?raw';
import powerArmorText from '../../../../docs/lore/power-armor-tro.md?raw';
import Walker from '../../../classes/walker';
import { getWalkerReadout } from '../../../classes/walker-readout';
import { getWalkerSamples } from '../../../data/walker-samples';
import { getPowerArmorSamplesReadout } from '../../../data/power-armor-samples';
import { MICRO_MECH_SAMPLES } from '../../../data/micro-mech-samples';
import { IAppGlobals } from '../../app-router';
import TextSection from '../../components/text-section';
import UIPage from '../../components/ui-page';

const unixLines = (text: string): string => text.replace(/\r\n/g, "\n");

// The custom lore, read straight from docs/lore: the one copy of each text.
export const TRO_INTRODUCTION = unixLines(introductionText);
export const ARTVEE_READOUT = unixLines(artveeText);
export const AMMUNITION_READOUT = unixLines(ammunitionText);
export const MICRO_MECHS_READOUT = unixLines(microMechsText);
export const BEST_OF_FUTURE_WARS_READOUT = unixLines(bestOfFutureWarsText);
export const HOMEBREW_EQUIPMENT_READOUT = unixLines(homebrewEquipmentText);
// The Power Armor text, then the sample suits, their figures read from the designs.
export const POWER_ARMOR_READOUT = `${unixLines(powerArmorText).trim()}\n\n${getPowerArmorSamplesReadout()}\n`;
// The walker text, then an entry for each sample walker made from the design itself, so the figures match the creator.
export const WALKERS_READOUT = [
    unixLines(walkersText).trim(),
    ...getWalkerSamples().map((sample) => getWalkerReadout(new Walker(JSON.stringify(sample.save)))),
].join("\n\n") + "\n";

export type TroCategory = "unit-types" | "equipment" | "ammunition" | "other";

/** The landing page's sections, in order, as a canon TRO sorts its contents. */
export const TRO_CATEGORIES: { id: TroCategory; title: string; blurb: string }[] = [
    { id: "unit-types", title: "Unit Types", blurb: "New kinds of unit, each with its history, rules and example designs, as a canon Technical Readout gives them." },
    { id: "equipment", title: "Equipment", blurb: "Weapons, engines and other gear, each with the people whose idea it is." },
    { id: "ammunition", title: "Ammunition", blurb: "Rounds and munitions for weapons that already exist." },
    { id: "other", title: "Other", blurb: "How the figures are worked out, and what fits nowhere else." },
];

export interface ITroDocument {
    slug: string;
    title: string;
    summary: string;
    fileName: string;
    text: string;
    /** A line that opens a new page of the reader. */
    pageStart: RegExp;
    /** Where the document sits on the landing page. A unit type gets one card; any other document lists each page. */
    category: TroCategory;
    /** Pages filed under another category than the document's, by page title. */
    pageCategories?: Record<string, TroCategory>;
    /** A unit type's example designs, each linked to the page that has it. */
    examples?: string[];
}

/** The TRO - JBT documents, unit types first. A new document also needs its route in _router.tsx. */
export const TRO_DOCUMENTS: ITroDocument[] = [
    {
        slug: "artvee",
        title: "ArtVee Technical Readout",
        summary: "The Artillery Vehicle and Mobile Artillery Platform, from the Star League to 3085: all nine patterns, their makers and their crews.",
        fileName: "artvee-tro.md",
        text: ARTVEE_READOUT,
        pageStart: /^(#{2,3} |#### .*ArtVee )/,
        category: "unit-types",
        examples: [...ARTVEE_READOUT.matchAll(/^#### (.*ArtVee .*)$/gm)].map((heading) => heading[1]),
    },
    {
        slug: "micro-mechs",
        title: "Micro-Mechs",
        summary: "Solarmech's 10 to 19 ton walkers: what they are, who made them, NGCFells's Alpha Strike rules for them and the four sample designs.",
        fileName: "micro-mechs-tro.md",
        text: MICRO_MECHS_READOUT,
        pageStart: /^## /,
        category: "unit-types",
        // The picker's names carry their weight, "Storm STM-3X (11 tons)"; the readout names the design alone.
        examples: MICRO_MECH_SAMPLES.map((sample) => sample.name.replace(/ \(.*\)$/, "")),
    },
    {
        slug: "walkers",
        title: "Walkers",
        summary: "Clell Flint's four-legged 'Mechs from Future Wars: what they are, NGCFells's Alpha Strike rules for them and three sample designs by NGCFells.",
        fileName: "walkers-tro.md",
        text: WALKERS_READOUT,
        // Each sample walker's entry is a page of its own, as in a printed TRO.
        pageStart: /^(## |### .* [A-Z]{2,4}-\d)/,
        category: "unit-types",
        examples: getWalkerSamples().map((sample) => sample.name),
    },
    {
        slug: "power-armor",
        title: "Power Armor",
        summary: "Bill Swisher's 5 to 15 ton suits from Future Wars: their history, what sets them apart, how NGCFells prices them, NGCFells's Alpha Strike rules and four sample suits.",
        fileName: "power-armor-tro.md",
        text: POWER_ARMOR_READOUT,
        pageStart: /^## /,
        category: "unit-types",
        examples: ["IPA-1", "IPA-2", "IPA-3", "IPA-4"],
    },
    {
        slug: "best-of-future-wars",
        title: "The Best of Future Wars Equipment",
        summary: "Fan-made equipment from The Best of Future Wars, Volume One: the EII Point Defense System, Gatling Laser, Long Range Flamer, Penitrator, Gauss shells, SABOT rounds, Pom-Pom autocannon, Swing Fire racks and Power Boosters.",
        fileName: "best-of-future-wars-tro.md",
        text: BEST_OF_FUTURE_WARS_READOUT,
        pageStart: /^## /,
        category: "equipment",
        pageCategories: { "Gauss Rifle Shells: VHE and Inferno": "ammunition", "Autocannon SABOT Rounds": "ammunition" },
    },
    {
        slug: "homebrew-equipment",
        title: "Community Homebrew and Apocryphal Equipment",
        summary: "Weapons and engines from r/battletech and MechWarrior 5, with the method and the canon check behind every Battle Value and cost NGCFells derived, so you can price your own.",
        fileName: "homebrew-equipment-tro.md",
        text: HOMEBREW_EQUIPMENT_READOUT,
        pageStart: /^## /,
        category: "equipment",
        pageCategories: {
            "How NGCFells derives Battle Value and cost": "other",
            "Other Items Priced the Same Way": "other",
            "Tandem Charge SRM House Rule": "ammunition",
        },
    },
    {
        slug: "ammunition",
        title: "Custom Ammunition",
        summary: "Custom rounds, starting with the anti-orbital Long Tom shell.",
        fileName: "ammunition-tro.md",
        text: AMMUNITION_READOUT,
        pageStart: /^## /,
        category: "ammunition",
    },
];

export interface ITroIndexEntry {
    title: string;
    slug: string;
    /** The page to open, as the reader's address hash. */
    hash: string;
    /** The document it is read in. */
    source: string;
    /** Who the idea is by, from the page's opening credit line; empty when the page has none. */
    credit: string;
    summary?: string;
    examples?: { name: string; hash: string }[];
}

/** The credit line that opens a page under its heading, "*Author, title, page.*", without its marks. */
const pageCredit = (page: string, title: string): string => {
    const lines = page.split("\n");
    const heading = lines.findIndex((line) => /^#{2,4} /.test(line) && line.replace(/^#+ /, "") === title);
    const first = lines.slice(heading + 1).find((line) => line.trim()) ?? "";
    return /^\*([^*]+)\*/.exec(first)?.[1].trim() ?? "";
};

/** The landing page's index: each category with the readouts or pages filed under it. */
export function troIndex(): Record<TroCategory, ITroIndexEntry[]> {
    const index: Record<TroCategory, ITroIndexEntry[]> = { "unit-types": [], equipment: [], ammunition: [], other: [] };
    for (const document of TRO_DOCUMENTS) {
        const pages = readoutPages(document.text, document.pageStart);
        const contents = readoutContents(pages, document.title);
        if (document.category === "unit-types") {
            const examples = (document.examples ?? []).map((name) => {
                // The design's own page, else the last page that names it: the samples come at a readout's end.
                const own = contents.findIndex((entry) => entry.title === name);
                const at = own >= 0 ? own : pages.map((page) => page.includes(name)).lastIndexOf(true);
                return { name, hash: at < 0 ? "" : contents[at].id };
            });
            index["unit-types"].push({ title: document.title, slug: document.slug, hash: "", source: document.title, credit: "", summary: document.summary, examples });
            continue;
        }
        contents.forEach((entry, at) => {
            // Opening text with no heading of its own is the document's introduction, read on its first page.
            if (entry.title === document.title) return;
            const category = document.pageCategories?.[entry.title] ?? document.category;
            index[category].push({ title: entry.title, slug: document.slug, hash: entry.id, source: document.title, credit: pageCredit(pages[at], entry.title) });
        });
    }
    return index;
}

export const readoutSectionId = (title: string): string => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Splits a text at its page starts. Opening text, and headings with nothing under them yet, stay with the section that follows. */
export function readoutPages(text: string, pageStart: RegExp): string[] {
    const pages: string[][] = [[]];
    for (const line of text.split("\n")) {
        const current = pages[pages.length - 1];
        const section = current.slice(current.findIndex((row) => /^#{2,} /.test(row)));
        const sectionStarted = current.some((row) => /^#{2,} /.test(row)) && section.some((row) => row.trim() && !row.startsWith("#"));
        if (pageStart.test(line) && sectionStarted) pages.push([line]);
        else current.push(line);
    }
    return pages.map((page) => page.join("\n").replace(/\n---\s*$/, "").trim());
}

/** A page's name: its first heading below the title. */
export const readoutPageTitle = (page: string, fallback: string): string => /^#{2,4} (.*)$/m.exec(page)?.[1] ?? fallback;

export interface IReadoutContentsEntry {
    page: number;
    title: string;
    id: string;
    /** The headings one level below the page's own, each a place to jump to on that page. */
    sections: { title: string; id: string }[];
}

/** The table of contents: every page by its name, with the sections under it. */
export function readoutContents(pages: string[], fallback: string): IReadoutContentsEntry[] {
    return pages.map((page, index) => {
        const title = readoutPageTitle(page, fallback);
        const level = /^(#{2,4}) /m.exec(page)?.[1].length ?? 1;
        const sections = [...page.matchAll(/^(#{2,5}) (.*)$/gm)]
            .filter((heading) => heading[1].length === level + 1 && heading[1].length < 5)
            .map((heading) => ({ title: heading[2], id: readoutSectionId(heading[2]) }));
        return { page: index, title, id: readoutSectionId(title), sections };
    });
}

/** Bold, italics and links to a web address; the readout has no other inline marks. */
function inline(text: string): React.ReactNode[] {
    return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https:\/\/[^)\s]+\))/).map((part, index) => {
        const link = /^\[([^\]]+)\]\((https:\/\/[^)\s]+)\)$/.exec(part);
        if (link) return <a key={index} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a>;
        if (part.startsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("*") && part.length > 1) return <em key={index}>{part.slice(1, -1)}</em>;
        return part;
    });
}

const cells = (row: string): string[] => row.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());

const images: Record<string, string> = { "artvee-falconet.svg": falconetArt };

/** The block forms the readout uses: headings, paragraphs, quotes, lists, tables, stat blocks, images and rules. */
export function ReadoutText({ text }: { text: string }): JSX.Element {
    const blocks: JSX.Element[] = [];
    const lines = text.split("\n");
    let at = 0;
    // Takes lines while they match, for the blocks that run on.
    const take = (matches: (line: string) => boolean): string[] => {
        const taken: string[] = [];
        while (at < lines.length && matches(lines[at])) taken.push(lines[at++]);
        return taken;
    };
    // List items, each with its indented continuation lines.
    const items = (marker: RegExp): string[] => take((line) => marker.test(line) || line.startsWith("  "))
        .reduce<string[]>((list, line) => marker.test(line) ? [...list, line.replace(marker, "")] : [...list.slice(0, -1), `${list[list.length - 1]} ${line.trim()}`], []);
    const bullet = /^- /;
    const numbered = /^\d+\. /;
    while (at < lines.length) {
        const line = lines[at];
        const key = blocks.length;
        const heading = /^(#{1,6}) (.*)/.exec(line);
        const image = /^!\[(.*)\]\((.*)\)$/.exec(line);
        if (!line.trim()) {
            at++;
        } else if (image) {
            at++;
            blocks.push(<img key={key} alt={image[1]} src={images[image[2]]} />);
        } else if (heading) {
            at++;
            const Tag = `h${heading[1].length}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
            blocks.push(<Tag key={key} id={heading[1].length > 1 && heading[1].length < 5 ? readoutSectionId(heading[2]) : undefined}>{heading[2]}</Tag>);
        } else if (line.startsWith("```")) {
            at++;
            const block = take((row) => !row.startsWith("```"));
            at++;
            blocks.push(<pre key={key}>{block.join("\n")}</pre>);
        } else if (line === "---") {
            at++;
            blocks.push(<hr key={key} />);
        } else if (line.startsWith("|")) {
            const [head, , ...rows] = take((row) => row.startsWith("|")).map(cells);
            blocks.push(<table key={key}><thead><tr>{head.map((cell, index) => <th key={index}>{inline(cell)}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, column) => <td key={column}>{inline(cell)}</td>)}</tr>)}</tbody></table>);
        } else if (line.startsWith("> ")) {
            blocks.push(<blockquote key={key}>{inline(take((row) => row.startsWith("> ")).map((row) => row.slice(2)).join(" "))}</blockquote>);
        } else if (bullet.test(line)) {
            blocks.push(<ul key={key}>{items(bullet).map((item, index) => <li key={index}>{inline(item)}</li>)}</ul>);
        } else if (numbered.test(line)) {
            blocks.push(<ol key={key}>{items(numbered).map((item, index) => <li key={index}>{inline(item)}</li>)}</ol>);
        } else {
            const paragraph = take((row) => !!row.trim() && !/^(#{1,6} |```|> |\||- |\d+\. )/.test(row));
            // A line no block claims still moves the reader on, so odd text can never stall the page.
            if (!paragraph.length) paragraph.push(lines[at++]);
            blocks.push(<p key={key}>{inline(paragraph.join(" "))}</p>);
        }
    }
    return <>{blocks}</>;
}

const readerPath = (slug: string, hash = ""): string => `${process.env.PUBLIC_URL}/classic-battletech/tro-jbt/${slug}${hash ? `#${hash}` : ""}`;

/** The TRO - JBT landing page: the introduction, then the readouts by category, each entry a link straight to its page. */
export default class TroJbt extends React.Component<{ appGlobals: IAppGlobals }> {
    private index = troIndex();

    constructor(props: { appGlobals: IAppGlobals }) {
        super(props);
        this.props.appGlobals.makeDocumentTitle("TRO - JBT");
    }

    private renderEntry = (entry: ITroIndexEntry): JSX.Element => entry.examples ? (
        <div key={entry.slug} className="tro-card" data-testid={`tro-card-${entry.slug}`}>
            <Link to={readerPath(entry.slug)}><strong>{entry.title}</strong></Link>
            <span>{entry.summary}</span>
            {entry.examples.length ? (
                <span className="tro-examples">
                    Examples:{" "}
                    {entry.examples.map((example, at) => (
                        <React.Fragment key={example.name}>
                            {at ? ", " : null}
                            <Link to={readerPath(entry.slug, example.hash)}>{example.name}</Link>
                        </React.Fragment>
                    ))}
                </span>
            ) : null}
        </div>
    ) : (
        <li key={`${entry.slug}-${entry.hash}`}>
            <Link to={readerPath(entry.slug, entry.hash)}>{entry.title}</Link>
            <span className="tro-entry-source">
                {entry.credit ? `${entry.credit} ` : ""}In <Link to={readerPath(entry.slug)}>{entry.source}</Link>.
            </span>
        </li>
    );

    render = (): JSX.Element => (
        <UIPage current="tro-jbt" appGlobals={this.props.appGlobals}>
            <TextSection label="TRO - JBT">
                <div className="tro-readout" data-testid="tro-introduction">
                    <ReadoutText text={TRO_INTRODUCTION} />
                </div>
                <nav className="tro-category-links" aria-label="TRO - JBT categories">
                    {TRO_CATEGORIES.map((category) => <a key={category.id} href={`#${category.id}`}>{category.title}</a>)}
                </nav>
                {TRO_CATEGORIES.map((category) => (
                    <section key={category.id} id={category.id} className="tro-category" data-testid={`tro-category-${category.id}`}>
                        <h3>{category.title}</h3>
                        <p className="small-text">{category.blurb}</p>
                        {category.id === "unit-types"
                            ? <div className="tro-cards">{this.index[category.id].map(this.renderEntry)}</div>
                            : <ul className="tro-entries">{this.index[category.id].map(this.renderEntry)}</ul>}
                    </section>
                ))}
            </TextSection>
        </UIPage>
    );
}

interface ITroReaderProps {
    appGlobals: IAppGlobals;
    slug: string;
}

/** One document, a page at a time, with its Markdown to download. */
export class TroReader extends React.Component<ITroReaderProps, { page: number }> {
    private document = TRO_DOCUMENTS.find((item) => item.slug === this.props.slug) ?? TRO_DOCUMENTS[0];
    private pages = readoutPages(this.document.text, this.document.pageStart);

    constructor(props: ITroReaderProps) {
        super(props);
        this.props.appGlobals.makeDocumentTitle(this.document.title);
        // A link straight to a section opens the page that starts with it.
        const hash = window.location.hash.slice(1);
        this.state = { page: Math.max(0, this.pages.findIndex((page) => this.pageId(page) === hash)) };
    }

    private pageTitle = (page: string): string => readoutPageTitle(page, this.document.title);

    private pageId = (page: string): string => readoutSectionId(this.pageTitle(page));

    private contents = readoutContents(this.pages, this.document.title);

    private goTo = (page: number): void => {
        this.setState({ page });
        window.history.replaceState(null, "", `#${this.pageId(this.pages[page])}`);
        window.scrollTo(0, 0);
    }

    /** Opens a page from the contents, then brings the chosen section into view. */
    private openSection = (event: React.MouseEvent, page: number, sectionId?: string): void => {
        event.preventDefault();
        this.setState({ page }, () => {
            window.history.replaceState(null, "", `#${sectionId ?? this.pageId(this.pages[page])}`);
            const target = sectionId ? document.getElementById(sectionId) : null;
            if (target?.scrollIntoView) target.scrollIntoView();
            else window.scrollTo(0, 0);
        });
    }

    private renderContents = (): JSX.Element => (
        <details className="tro-contents" open data-testid="tro-contents">
            <summary>Contents</summary>
            <ol>
                {this.contents.map((entry) => (
                    <li key={entry.page}>
                        <a href={`#${entry.id}`} aria-current={entry.page === this.state.page ? "page" : undefined} onClick={(event) => this.openSection(event, entry.page)}>{entry.title}</a>
                        {entry.sections.length ? (
                            <ul>
                                {entry.sections.map((section) => (
                                    <li key={section.id}><a href={`#${section.id}`} onClick={(event) => this.openSection(event, entry.page, section.id)}>{section.title}</a></li>
                                ))}
                            </ul>
                        ) : null}
                    </li>
                ))}
            </ol>
        </details>
    );

    private renderButtons = (): JSX.Element => (
        <>
            <button type="button" className="btn btn-sm btn-secondary" disabled={this.state.page === 0} onClick={() => this.goTo(this.state.page - 1)}>Previous</button>
            <button type="button" className="btn btn-sm btn-secondary" disabled={this.state.page === this.pages.length - 1} onClick={() => this.goTo(this.state.page + 1)}>Next</button>
        </>
    );

    render = (): JSX.Element => (
        <UIPage current="tro-jbt" appGlobals={this.props.appGlobals}>
            <TextSection label={this.document.title}>
                <p>
                    <Link to={`${process.env.PUBLIC_URL}/classic-battletech/tro-jbt`}>Back to TRO - JBT</Link>
                    {" | "}
                    <a download={this.document.fileName} href={`data:text/markdown;charset=utf-8,${encodeURIComponent(this.document.text)}`}>Download the Markdown</a>
                </p>
                {this.pages.length > 1 ? this.renderContents() : null}
                {this.pages.length > 1 ? (
                    <nav className="tro-pager" aria-label="Readout pages">
                        {this.renderButtons()}
                        <label>
                            Page {this.state.page + 1} of {this.pages.length}:{" "}
                            <select value={this.state.page} onChange={(event) => this.goTo(Number(event.currentTarget.value))}>
                                {this.pages.map((page, index) => <option key={index} value={index}>{this.pageTitle(page)}</option>)}
                            </select>
                        </label>
                    </nav>
                ) : null}
                <div className="tro-readout" data-testid="tro-readout">
                    <ReadoutText text={this.pages[this.state.page]} />
                </div>
                {this.pages.length > 1 ? <nav className="tro-pager" aria-label="Next and previous page">{this.renderButtons()}</nav> : null}
            </TextSection>
        </UIPage>
    );
}
