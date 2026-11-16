import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Vehicle from "../../../classes/vehicle";
import { ammoCustom } from "../../../data/ammo-custom";
import { ARTVEE_SAMPLES } from "../../../data/artvee-samples";
import { CONST_AS_SPECIAL_ABILITIES, MICRO_MECH_AS_ABILITY_TEXT, WALKER_AS_ABILITY_TEXT } from "../../../data/alpha-strike-special-abilities";
import Walker from "../../../classes/walker";
import { getWalkerStatBlock } from "../../../classes/walker-readout";
import { getWalkerSamples } from "../../../data/walker-samples";
import { AMMUNITION_READOUT, ARTVEE_READOUT, MICRO_MECHS_READOUT, WALKERS_READOUT, ReadoutText, TRO_DOCUMENTS, TRO_INTRODUCTION, readoutPageTitle, readoutPages, readoutSectionId } from "./tro-jbt";

/** The text of one `#### name` section of the readout. */
function section(name: string): string {
    return ARTVEE_READOUT.split(/^#### /m).find((part) => part.startsWith(name + "\n")) ?? "";
}

describe("ArtVee readout", () => {
    it.each(ARTVEE_SAMPLES.map((sample) => [sample.name, sample] as const))("prints %s as the app builds it", (name, sample) => {
        const vehicle = new Vehicle(JSON.stringify(sample.save));
        const text = section(name);
        expect(text).toContain(`Mass: ${sample.save.tonnage} tons`);
        expect(text).toContain(`Battle Value: ${vehicle.getBattleValue().toLocaleString("en-US")}`);
    });

    it("credits the idea and says it is not canon", () => {
        expect(ARTVEE_READOUT).toContain("not canon");
        expect(ARTVEE_READOUT).toContain("kris (helvedes heste)");
    });

    it("renders headings, emphasis, quotes, lists, tables and stat blocks", () => {
        const html = renderToStaticMarkup(<ReadoutText text={[
            "# Title", "", "## A Section", "", "#### A Unit", "", "##### Overview", "", "Two **bold**", "lines *here*.", "", "> *Note:* a quote", "> goes on.", "",
            "- one", "  more", "- two", "", "1. first", "1. second", "", "| A | B |", "| --- | --- |", "| 1 | 2 |", "",
            "```text", "Mass: 55 tons", "```", "", "---",
        ].join("\n")} />);
        expect(html).toContain("<h1>Title</h1>");
        expect(html).toContain(`<h2 id="${readoutSectionId("A Section")}">A Section</h2>`);
        expect(html).toContain(`<h4 id="${readoutSectionId("A Unit")}">A Unit</h4>`);
        expect(html).toContain("<h5>Overview</h5>");
        expect(html).toContain("<p>Two <strong>bold</strong> lines <em>here</em>.</p>");
        expect(html).toContain("<blockquote><em>Note:</em> a quote goes on.</blockquote>");
        expect(html).toContain("<ul><li>one more</li><li>two</li></ul>");
        expect(html).toContain("<ol><li>first</li><li>second</li></ol>");
        expect(html).toContain("<th>A</th>");
        expect(html).toContain("<td>2</td>");
        expect(html).toContain("<pre>Mass: 55 tons</pre>");
        expect(html).toContain("<hr/>");
    });

    it("moves past a line no block claims", () => {
        expect(renderToStaticMarkup(<ReadoutText text={"####### Too deep\n#tag"} />)).toBe("<p>####### Too deep #tag</p>");
    });

    it("draws an image block from the lore folder, with its description", () => {
        const html = renderToStaticMarkup(<ReadoutText text={"![Three stages](artvee-falconet.svg)"} />);
        expect(html).toMatch(/<img alt="Three stages" src="[^"]*artvee-falconet[^"]*\.svg/);
    });

    it("shows the Falconet in both modes and converting", () => {
        expect(ARTVEE_READOUT).toMatch(/^!\[.*Vehicle Mode.*Blind Infinity.*Siege Mode.*\]\(artvee-falconet\.svg\)$/m);
    });
});

describe("TRO - JBT", () => {
    it("opens with the introduction and a card for the ArtVees, then the ammunition", () => {
        expect(TRO_INTRODUCTION).toContain("## Explanation");
        expect(TRO_DOCUMENTS.map((document) => document.slug)).toEqual(["artvee", "ammunition", "micro-mechs", "walkers", "best-of-future-wars"]);
    });

    it.each(TRO_DOCUMENTS.map((document) => [document.slug, document] as const))("renders every page of %s and loses no text", (_slug, document) => {
        const pages = readoutPages(document.text, document.pageStart);
        for (const page of pages) expect(renderToStaticMarkup(<ReadoutText text={page} />)).not.toBe("");
        const words = (text: string): string => text.replace(/^---$/gm, "").replace(/\s+/g, " ").trim();
        expect(words(pages.join("\n"))).toBe(words(document.text));
    });

    it("gives each ArtVee pattern its own page", () => {
        const artvee = TRO_DOCUMENTS[0];
        const titles = readoutPages(artvee.text, artvee.pageStart).map((page) => readoutPageTitle(page, artvee.title));
        for (const sample of ARTVEE_SAMPLES) expect(titles).toContain(sample.name);
        expect(new Set(titles).size).toBe(titles.length);
    });

    it("keeps a heading with nothing under it on the page of the heading after it", () => {
        expect(readoutPages("# T\n\n## A\n\n### B\n\nText\n\n## C\n\nMore", /^#{2,3} /)).toEqual(["# T\n\n## A\n\n### B\n\nText", "## C\n\nMore"]);
    });

    it("keeps opening text on the page of the first section", () => {
        expect(readoutPages("# T\n\nOpening\n\n## A\n\nText\n\n## B\n\nMore", /^## /)).toEqual(["# T\n\nOpening\n\n## A\n\nText", "## B\n\nMore"]);
    });

    it("prints the anti-orbital round as the catalog has it, with its credit", () => {
        const round = ammoCustom.find((item) => item.tag === "ammo-is-long-tom-anti-orbital");
        expect(AMMUNITION_READOUT).toContain(`| **Weight** | 1 ton (${round?.roundsPerTon} shots) |`);
        expect(AMMUNITION_READOUT).toContain(`| **Damage** | ${round?.damage} standard |`);
        expect(AMMUNITION_READOUT).toContain(`| **Battle Value** | ${round?.battleValue} a ton |`);
        expect(AMMUNITION_READOUT).toContain("SmilingNid");
        expect(AMMUNITION_READOUT).not.toContain("user ruling");
    });
});

describe("Micro-Mechs readout", () => {
    const flat = MICRO_MECHS_READOUT.replace(/\*\*/g, "").replace(/\s+/g, " ");

    it("credits the authors and says it is not official", () => {
        for (const text of ["Solarmech", "Discord", "6.1.0.2", "not canon", "NOT OFFICIAL"]) expect(MICRO_MECHS_READOUT).toContain(text);
    });

    it("explains each rule of the MCR ability the card popup shows", () => {
        // The readout has a bullet for every rule of the ability text (after its opening line), under the same name.
        for (const line of MICRO_MECH_AS_ABILITY_TEXT.slice(1)) expect(flat, line).toContain(`- ${line.slice(0, line.indexOf(":") + 1)}`);
    });

    it("links to the author's own text, and renders the link", () => {
        const url = "https://www.deviantart.com/solarmech/art/Micro-Mechs-for-BattleTech-Part-1-795743489";
        expect(MICRO_MECHS_READOUT).toContain(`(${url})`);
        const html = renderToStaticMarkup(<ReadoutText text={`See [the post](${url}), **here**.`} />);
        expect(html).toContain(`<a href="${url}" target="_blank" rel="noopener noreferrer">the post</a>`);
        expect(html).toContain("<strong>here</strong>");
    });

    it("explains every code a Micro-Mech card can print", () => {
        for (const code of ["MM", "MCR", "ENE", "CASE", "SEAL", "IF#", "LRM", "HT", "ECM", "PRB", "RCN", "TAG", "C3S", "SNARC", "JMPW#"]) expect(flat, code).toContain(code);
    });
});

describe("Walkers readout (Custom Homebrew, #172)", () => {
    const flat = WALKERS_READOUT.replace(/\*\*/g, "").replace(/\*/g, "").replace(/\s+/g, " ").replace(/’/g, "'");
    const document = TRO_DOCUMENTS.find((each) => each.slug === "walkers")!;
    const pages = readoutPages(document.text, document.pageStart);

    it("credits Clell Flint and both printings, and says what is ours and not official", () => {
        for (const text of ["Clell Flint", "Future Wars #11", "The Best of Future Wars, Volume One (1991", "Inspired by", "not canon", "NOT OFFICIAL", "the fault lies with NGCFells"]) {
            expect(flat, text).toContain(text);
        }
    });

    it("explains each rule of the WLK ability the card popup shows, and the AIF# to-hit of both printings", () => {
        for (const line of WALKER_AS_ABILITY_TEXT.slice(1)) {
            const name = line.slice(0, line.indexOf(":") + 1).replace(/’/g, "'");
            expect(flat, line).toContain(`- ${name}`);
        }
        expect(flat).toContain("The target number is 6 under The Best of Future Wars (8 - 2) or -2 under Future Wars #11");
        for (const code of ["WK, IWK", "WLK", "AIF#", "REAR#/#/#", "TUR(#/#/#)", "OVL", "BFC"]) expect(flat, code).toContain(code);
    });

    it("cites the page the WLK and AIF# abilities are on", () => {
        const page = pages.findIndex((each) => readoutPageTitle(each, "") === "Alpha Strike Rules") + 1;
        for (const tag of ["WLK", "AIF#"]) {
            const ability = CONST_AS_SPECIAL_ABILITIES.find((each) => each.tag === tag)!;
            expect(ability.source).toEqual({ book: "TRO - JBT: Walkers (Custom Homebrew, NOT OFFICIAL)", page });
            expect(pages[page - 1]).toContain(`The ${tag} Special Ability`);
        }
    });

    it("prints each sample walker on a page of its own, as a TRO entry: header, history, stat block, then the card", () => {
        for (const sample of getWalkerSamples()) {
            const page = pages.find((each) => readoutPageTitle(each, "") === sample.name);
            expect(page, sample.name).toBeDefined();
            const order = ["**Mass:**", "#### Overview", "#### Capabilities", "#### Deployment", "Type: " + sample.name, "Internal", "Weapons and Ammo", "#### Alpha Strike (NOT OFFICIAL)", "NOT OFFICIAL. A design of ours"]
                .map((text) => page!.indexOf(text));
            expect(order.every((at) => at >= 0), sample.name).toBe(true);
            expect([...order].sort((a, b) => a - b)).toEqual(order);
            // All ten locations in the structure / armor table.
            for (const location of ["Control Section", "Front Torso", "Left Torso", "Center Torso", "Right Torso", "Rear Torso", "Left Front Leg", "Right Front Leg", "Left Rear Leg", "Right Rear Leg"]) {
                expect(page, location).toContain(location);
            }
        }
    });

    it("draws the stat block from the design, so it matches the creator", () => {
        const sample = getWalkerSamples().find((each) => each.id === "ironback-ibk-2t")!;
        const walker = new Walker(JSON.stringify(sample.save));
        const block = getWalkerStatBlock(walker);
        expect(block).toContain(`Battle Value: ${walker.getBattleValue().toLocaleString("en-US")} (provisional)`);
        expect(block).toMatch(/Walking MP: 5 \(4 rated, on two legs\)/);
        expect(block).toMatch(/PPC\s+CS \(T\)\s+3\s+7/);
        expect(block).toMatch(/Turret:\s+3/);
        expect(block).toMatch(/Armor Factor:\s+176\s+11/);
        const card = walker.getAlphaStrikeStats();
        expect(WALKERS_READOUT).toContain(`| ${card.type} | ${card.size} | ${card.move} | ${card.tmm} | ${card.armor} / ${card.structure} |`);
    });
});
