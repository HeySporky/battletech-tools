import { readFileSync } from "fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Vehicle from "../../../classes/vehicle";
import { ammoCustom } from "../../../data/ammo-custom";
import { energyCustom } from "../../../data/energy-custom";
import { equipmentEnergy } from "../../../data/equipment-energy";
import { equipmentMisc } from "../../../data/equipment-misc";
import { miscCustom } from "../../../data/misc-custom";
import { mechCustomEngineTypes } from "../../../data/mech-custom-engine-types";
import { ballisticCustom } from "../../../data/ballistic-custom";
import { equipmentArtillery } from "../../../data/equipment-artillery";
import { missileCustom } from "../../../data/missile-custom";
import { canonRecord, COST_PER_BV, directFireBattleValue, extrapolate, interpolate } from "../../../data/derived-values";
import { sizeVariableEquipment } from "../../../data/variable-equipment";
import { getEquipmentCatalogDefinitions } from "../../../data/equipment-registry";
import { ARTVEE_SAMPLES } from "../../../data/artvee-samples";
import { CONST_AS_SPECIAL_ABILITIES, MICRO_MECH_AS_ABILITY_TEXT, POWER_ARMOR_AS_ABILITY_TEXT, WALKER_AS_ABILITY_TEXT } from "../../../data/alpha-strike-special-abilities";
import Walker from "../../../classes/walker";
import { getWalkerStatBlock } from "../../../classes/walker-readout";
import { getWalkerSamples } from "../../../data/walker-samples";
import { BattleMech } from "../../../classes/battlemech";
import { getAllPowerArmorSamples } from "../../../data/power-armor-samples";
import { AMMUNITION_READOUT, ARTVEE_READOUT, BEST_OF_FUTURE_WARS_READOUT, HOMEBREW_EQUIPMENT_READOUT, MICRO_MECHS_READOUT, POWER_ARMOR_READOUT, WALKERS_READOUT, ReadoutText, TRO_DOCUMENTS, TRO_INTRODUCTION, readoutPageTitle, readoutPages, readoutSectionId } from "./tro-jbt";

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
        expect(TRO_DOCUMENTS.map((document) => document.slug)).toEqual(["artvee", "micro-mechs", "walkers", "power-armor", "vtolam", "permanent-air-mech", "best-of-future-wars", "homebrew-equipment", "ammunition"]);
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

    it("credits Clell Flint and both printings, and says what is NGCFells's and not official", () => {
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

describe("TRO - JBT routes", () => {
    it("gives every card a page to open (a card without one led to the 404)", () => {
        const router = readFileSync(new URL("./_router.tsx", import.meta.url), "utf8");
        const listed = /\{\[([^\]]*)\]\.map\(\(slug\) =>/.exec(router)![1];
        for (const document of TRO_DOCUMENTS) expect(listed, document.slug).toContain(`"${document.slug}"`);
    });
});

describe("Power Armor readout (Custom Homebrew, #172)", () => {
    const flat = POWER_ARMOR_READOUT.replace(/\*\*/g, "").replace(/\*/g, "").replace(/\s+/g, " ").replace(/’/g, "'");
    const document = TRO_DOCUMENTS.find((each) => each.slug === "power-armor")!;
    const pages = readoutPages(document.text, document.pageStart);

    it("credits Bill Swisher and both printings, and says what is NGCFells's and not official", () => {
        for (const text of ["Bill Swisher", "Future Wars #14 (1989, p. 39)", "The Best of Future Wars, Volume One (1991, pp. 14-16)", "lacks printed pages 39-42",
            "Inspired by", "not canon", "NOT OFFICIAL", "the fault lies with NGCFells"]) {
            expect(flat, text).toContain(text);
        }
    });

    it("ends with the sample suits on a page of their own, each row read from its design", () => {
        const page = pages.find((each) => readoutPageTitle(each, "") === "The Sample Suits");
        expect(page).toBeDefined();
        for (const sample of getAllPowerArmorSamples()) {
            const mech = new BattleMech(JSON.stringify(sample.save));
            const row = page!.split("\n").find((line) => line.startsWith(`| ${mech.getModelName()} |`));
            expect(row, sample.id).toBeDefined();
            expect(row).toContain(`| ${mech.getBattleValue()} | ${mech.getCostBreakdown().result?.toLocaleString("en-US")} | ${mech.calcAlphaStrike()?.basePoints} |`);
        }
        expect(page).toContain("| IPA-4 | NGCFells | 5 | 6 / 9 / 0 | 2 Small Laser | 24 | 147 | 184,065 | 9 |");
        expect(flat).toContain("both names are NGCFells's");
    });

    it("dates the suit from the article's history", () => {
        expect(flat).toContain("prototype 2963 (the Tharkan project), introduced 3027 (Defiance Industries, Hesperus II), never extinct");
    });

    it("explains each rule of the PWA ability the card popup shows, on the page its source cites", () => {
        for (const line of POWER_ARMOR_AS_ABILITY_TEXT.slice(1)) {
            const name = line.slice(0, line.indexOf(":") + 1).replace(/’/g, "'");
            expect(flat, line).toContain(`- ${name}`);
            expect(flat, line).toContain(line.replace(/’/g, "'"));
        }
        const page = pages.findIndex((each) => readoutPageTitle(each, "") === "Alpha Strike Rules") + 1;
        expect(page).toBeGreaterThan(0);
        expect(CONST_AS_SPECIAL_ABILITIES.find((each) => each.tag === "PWA")!.source).toEqual({ book: "TRO - JBT: Power Armor (Custom Homebrew, NOT OFFICIAL)", page });
        expect(pages[page - 1]).toContain("The PWA Special Ability");
    });
});

describe("Best of Future Wars readout", () => {
    // The readout carries each record's Lore word for word, so the equipment editor and the readout never drift apart.
    it("holds every sentence of every fanzine record's Lore", () => {
        const fanzine = getEquipmentCatalogDefinitions().flatMap((definition) => definition.equipment)
            .filter((item) => item.book === "The Best of Future Wars, Volume One");
        expect(fanzine.length).toBeGreaterThan(80);
        for (const item of fanzine) {
            expect(item.lore, item.tag).toBeTruthy();
            for (const sentence of item.lore!.split(/(?<=\.)\s+/)) expect(BEST_OF_FUTURE_WARS_READOUT, item.tag).toContain(sentence);
        }
    });
});

describe("Homebrew and Apocryphal equipment readout", () => {
    const text = HOMEBREW_EQUIPMENT_READOUT;
    const find = (list: { tag: string }[], tag: string) => {
        const found = list.find((item) => item.tag === tag);
        if (!found) throw new Error(`no record ${tag}`);
        return found as (typeof equipmentEnergy)[number];
    };
    const money = (value: number) => value.toLocaleString("en-US");

    it("states each derived figure as the catalog holds it", () => {
        for (const [list, tag] of [[equipmentEnergy, "ppc-x"], [energyCustom, "custom-omni-laser"], [miscCustom, "custom-pile-bunker"]] as const) {
            const item = find(list, tag);
            expect(text, tag).toContain(`| **Battle Value** | ${item.battleValue} (derived) |`);
            expect(text, tag).toContain(`| **Cost** | ${money(item.cbills ?? 0)} C-Bills (derived) |`);
        }
        const ammo = find(ammoCustom, "ammo-custom-pile-bunker-standard");
        expect(text).toContain(`BV ${ammo.battleValue} and ${money(ammo.cbills ?? 0)} C-Bills a ton (derived)`);
        const superheavy = find(energyCustom, "custom-superheavy-ppc");
        expect(text).toContain(`| **Battle Value** | ${superheavy.battleValue} (the author's) |`);
        expect(text).toContain(`| **Cost** | ${money(superheavy.cbills ?? 0)} C-Bills (the author's) |`);
        // The table of other items.
        const table: [string, string, string][] = [
            ["custom-srm-8", "custom-srm-10", "79 and 99"], ["custom-srm-8-os", "custom-srm-10-os", "16 and 20"],
            ["custom-streak-srm-8", "custom-streak-srm-10", "119 and 149"], ["custom-streak-srm-8-os", "custom-streak-srm-10-os", "24 and 30"],
        ];
        for (const [a, b, shown] of table) expect(`${find(missileCustom, a).battleValue} and ${find(missileCustom, b).battleValue}`, a).toBe(shown);
        expect(find(ballisticCustom, "custom-ac-15").battleValue).toBe(151);
        expect(text).toContain("| AC/15 (Solaris7) | 151 | 250,000 C-Bills |");
        expect(find(ballisticCustom, "custom-lb-15x-ac").battleValue).toBe(193);
        expect(find(ballisticCustom, "custom-ultra-ac-15").battleValue).toBe(246);
        expect(find(energyCustom, "custom-disruptor")).toMatchObject({ battleValue: 150, cbills: 197000 });
        expect(find(energyCustom, "custom-gatling-laser").battleValue).toBe(72);
        expect(find(energyCustom, "custom-lr-flamer").battleValue).toBe(60);
        expect(find(equipmentEnergy, "light-blazer")).toMatchObject({ battleValue: 63, cbills: 83000 });
        expect(find(missileCustom, "custom-penitrator")).toMatchObject({ battleValue: 103, cbills: 135000 });
        expect(find(ballisticCustom, "custom-eii-pds")).toMatchObject({ battleValue: 32, cbills: 100000 });
        expect(find(miscCustom, "custom-null-signature-system").cbills).toBe(1400000);
        expect(text).toContain("| Disruptor (MekTek) | 150 | 197,000 C-Bills |");
        expect(text).toContain("| The Penitrator | 103 | 135,000 C-Bills |");
        expect(text).toContain("| Light Blazer (Gothic, Apocryphal) | 63 | 83,000 C-Bills |");
    });

    it("prints the Fusion Lance's figures as the formula gives them", () => {
        const sized = (rating: number) => sizeVariableEquipment("fusion-lance", { tonnage: 50, engineRating: rating, engineWeight: 10, directFireWeaponWeight: 0 })!;
        expect([sized(100).battleValue, sized(250).battleValue, sized(400).battleValue]).toEqual([30, 60, 75]);
        expect([sized(100).cbills, sized(250).cbills, sized(400).cbills]).toEqual([39000, 79000, 98000]);
        expect(text).toContain("30 for a rating of 100 or less, 60 for 250, 75 for 400");
        expect(text).toContain("39,000, 79,000 and 98,000 C-Bills");
    });

    it("quotes the canon check table as the catalog and the method give it", () => {
        const bv = (tag: string) => canonRecord(tag).battleValue!;
        const rows: [string, number, number][] = [
            ["PPC", directFireBattleValue(10, { short: 6, medium: 12, long: 18 }), bv("standard-ppc")],
            ["ER PPC", directFireBattleValue(10, { short: 7, medium: 14, long: 23 }), bv("er-ppc")],
            ["Large laser", directFireBattleValue(8, { short: 5, medium: 10, long: 15 }), bv("large-laser")],
            ["Medium laser", directFireBattleValue(5, { short: 3, medium: 6, long: 9 }), bv("medium-laser")],
            ["Heavy PPC", directFireBattleValue(15, { short: 6, medium: 12, long: 18 }), bv("heavy-ppc")],
            ["Snub-Nose PPC", directFireBattleValue(canonRecord("snub-nose-ppc").damage!, canonRecord("snub-nose-ppc").range!), bv("snub-nose-ppc")],
            ["SRM 6", Math.round(extrapolate([2, bv("srm-2")], [4, bv("srm-4")], 6)), bv("srm-6")],
            ["Streak SRM 6", Math.round(extrapolate([2, bv("streak-srm-2")], [4, bv("streak-srm-4")], 6)), bv("streak-srm-6")],
            ["LRM 20", Math.round(extrapolate([5, bv("lrm-5")], [10, bv("lrm-10")], 20)), bv("lrm-20")],
            ["AC/5", Math.round(interpolate([2, bv("autocannon-standard-a")], [10, bv("autocannon-standard-c")], 5)), bv("autocannon-standard-b")],
            ["LB 5-X", Math.round(interpolate([2, bv("autocannon-lbx-2")], [10, bv("autocannon-lbx-10")], 5)), bv("autocannon-lbx-5")],
            ["Ultra AC/5", Math.round(interpolate([2, bv("autocannon-ultra-a")], [10, bv("autocannon-ultra-c")], 5)), bv("autocannon-ultra-b")],
        ];
        for (const [label, derived, printed] of rows) {
            const row = text.split("\n").find((line) => line.startsWith(`| ${label}`));
            expect(row, label).toBeDefined();
            expect(row, label).toContain(`| ${derived} | ${printed} |`);
            const percent = Math.round(100 * Math.abs(derived - printed) / printed);
            expect(row, label).toMatch(percent === 0 ? /0%/ : new RegExp(`${percent}% (high|low)`));
        }
    });

    it("quotes the canon neighbours, the MML and ATM and the cost median as the catalog has them", () => {
        expect(text).toContain(`The canon MML-5 is ${canonRecord("mml-5").battleValue}, the same as the LRM-5`);
        expect(canonRecord("lrm-5").battleValue).toBe(canonRecord("mml-5").battleValue);
        expect(text).toContain(`The canon ATM-3 carries one figure, ${canonRecord("atm-3").battleValue}`);
        expect(text).toContain(`The canon SRM is ${canonRecord("srm-4").battleValue} at 4 tubes and ${canonRecord("srm-6").battleValue} at 6`);
        expect(text).toContain(`The canon AC/10 is ${canonRecord("autocannon-standard-c").battleValue} and the AC/20 ${canonRecord("autocannon-standard-d").battleValue}`);
        expect(text).toContain(`BV x ${money(COST_PER_BV)} C-Bills`);
        expect(text).toContain("the Long Tom is 171 in BV1 and 368 in BV2");
        const longTom = equipmentArtillery.find((item) => item.tag === "long-tom-artillery")!;
        expect(longTom.battleValue).toBe(368);
        expect((longTom.editionStats as Record<string, { battleValue?: number }>)["master-rules"].battleValue).toBe(171);
        expect(Math.round(100 * (1 - 360 / find(energyCustom, "custom-superheavy-ppc").battleValue!))).toBe(15);
    });

    it("prints the COIL and Reloading Rocket Launcher tables as the catalog has them", () => {
        const coil = (tag: string) => find(equipmentEnergy, tag);
        const coilText = text.slice(text.indexOf("## COIL-S"), text.indexOf("## Reloading Rocket"));
        const row = (label: string) => coilText.split("\n").find((line) => line.startsWith(`| **${label}**`))!;
        expect(row("Weight")).toContain(`| ${coil("coil_s").weight} tons | ${coil("coil_m").weight} tons | ${coil("coil_l").weight} tons |`);
        expect(row("Slots")).toContain(`| ${coil("coil_s").space.battlemech} | ${coil("coil_m").space.battlemech} | ${coil("coil_l").space.battlemech} |`);
        expect(row("Damage")).toContain(`| ${coil("coil_s").damage} | ${coil("coil_m").damage} | ${coil("coil_l").damage} |`);
        expect(row("Heat")).toContain(`| ${coil("coil_s").heat} | ${coil("coil_m").heat} | ${coil("coil_l").heat} |`);
        for (const [tag, text1] of [["coil_s", "1 / 2 / 3"], ["coil_m", "3 / 6 / 9"], ["coil_l", "5 / 10 / 15"]] as const) {
            expect(`${coil(tag).range.short} / ${coil(tag).range.medium} / ${coil(tag).range.long}`).toBe(text1);
            expect(text).toContain(text1);
        }
        expect(row("Cost")).toContain(`| ${money(coil("coil_s").cbills!)} C-Bills | ${money(coil("coil_m").cbills!)} C-Bills | ${money(coil("coil_l").cbills!)} C-Bills |`);
        const rrl = (size: number) => find(missileCustom, `custom-rrl-${size}`);
        expect(text).toContain(`| **Battle Value** | ${rrl(10).battleValue} | ${rrl(15).battleValue} | ${rrl(20).battleValue} |`);
        expect(text).toContain(`| **Cost** | ${money(rrl(10).cbills!)} C-Bills | ${money(rrl(15).cbills!)} C-Bills | ${money(rrl(20).cbills!)} C-Bills |`);
        expect(text).toContain(`| **Salvos a ton** | ${rrl(10).shotsPerTon} | ${rrl(15).shotsPerTon} | ${rrl(20).shotsPerTon} |`);
        expect(text).toContain(`(18, 23 and 24) and twice its cost (15,000, 30,000 and 45,000)`);
        expect([10, 15, 20].map((size) => `${canonRecord(`rocket-launcher-${size}`).battleValue}`)).toEqual(["18", "23", "24"]);
        expect([10, 15, 20].map((size) => money(canonRecord(`rocket-launcher-${size}`).cbills!))).toEqual(["15,000", "30,000", "45,000"]);
        expect(text).toContain("The test file checks 23 canon weapons");
    });

    it("credits every author and prints the engine's figures", () => {
        for (const handle of ["u/FedditSuns", "u/Magical_Savior", "u/sokttocs", "u/heavyarmormecha", "u/FweeCom", "u/Severe_Ad_5022", "u/Omega_Chris_8352", "u/Distinct-Duck-7120", "u/Bookwyrm517", "u/MasonStonewall"]) {
            expect(text, handle).toContain(handle);
        }
        const engine = mechCustomEngineTypes.find((record) => record.tag === "re-engineered-fusion")!;
        expect(engine.criticals.is).toEqual({ ct: 3, lt: 3, rt: 3 });
        expect(text).toContain("3 in the center torso and 3 in each side torso");
        expect(text).toContain("0.67 of the standard weight");
    });
});
