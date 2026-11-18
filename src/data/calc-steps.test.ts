import { describe, expect, it } from "vitest";
import { CALC_SOURCES } from "./calc-sources";
import { CalcStepDefs, CalcTrace, findCalcDefProblems, formatCitation, formatCitations, renderCalcStepsHtml } from "./calc-steps";

const defs: CalcStepDefs = {
    "armor": { section: "Defensive Battle Rating", cites: [{ source: "tm", page: "302" }], status: "cited" },
    "guess": { section: "Final", cites: [], status: "provisional", note: "The rule is silent; NGCFells rounds normally." },
    "lost": { section: "Final", cites: [], status: "source-missing", note: "Needs Record Sheets: 3055." },
};

describe("CalcTrace", () => {
    it("adds a step with its definition's section, cites and status", () => {
        const trace = new CalcTrace(defs);
        trace.add("armor", { label: "Armor", detail: "152 x 2.5", value: 380 });
        expect(trace.steps).toHaveLength(1);
        expect(trace.steps[0]).toMatchObject({
            id: "armor", section: "Defensive Battle Rating", status: "cited", label: "Armor", detail: "152 x 2.5", value: 380,
            cites: [{ source: "tm", page: "302" }],
        });
    });

    it("appends a step's own cites to the definition's, leaving the definition alone", () => {
        const trace = new CalcTrace(defs);
        trace.add("armor", { label: "Rocket launcher", cites: [{ source: "ioae", page: "189" }] });
        expect(trace.steps[0].cites).toEqual([{ source: "tm", page: "302" }, { source: "ioae", page: "189" }]);
        expect(defs.armor.cites).toEqual([{ source: "tm", page: "302" }]);
    });

    it("keeps steps in the order they were added, and lets an id repeat", () => {
        const trace = new CalcTrace(defs);
        trace.add("armor", { label: "Head" });
        trace.add("guess", { label: "Round" });
        trace.add("armor", { label: "Legs" });
        expect(trace.steps.map((step) => step.label)).toEqual(["Head", "Round", "Legs"]);
    });

    it("throws on an unknown step id", () => {
        expect(() => new CalcTrace(defs).add("nope", { label: "x" })).toThrow("No step definition: nope");
    });
});

describe("citations", () => {
    it("formats a page, a page range and an errata source", () => {
        expect(formatCitation({ source: "tm", page: "302" })).toBe("TM p.302");
        expect(formatCitation({ source: "tm", page: "302-304" })).toBe("TM pp.302-304");
        expect(formatCitation({ source: "tm", page: "302, 315" })).toBe("TM pp.302, 315");
        expect(formatCitation({ source: "tm-errata-8.0", page: "14" })).toBe("TM errata v8.0 p.14");
    });

    it("joins several with a semicolon", () => {
        expect(formatCitations([{ source: "tm", page: "302" }, { source: "tm-errata-8.0", page: "14" }])).toBe("TM p.302; TM errata v8.0 p.14");
        expect(formatCitations([])).toBe("");
    });

    it("prints an unknown source's id rather than throwing", () => {
        expect(formatCitation({ source: "nope", page: "1" })).toBe("nope p.1");
    });

    it("every source has a short name, a title and a printing, and errata name a known source", () => {
        expect(Object.keys(CALC_SOURCES).length).toBeGreaterThan(5);
        for (const [id, source] of Object.entries(CALC_SOURCES)) {
            expect(source.short, id).toBeTruthy();
            expect(source.title, id).toBeTruthy();
            expect(source.printing, id).toBeTruthy();
            if (source.errataOf) expect(Object.keys(CALC_SOURCES), id).toContain(source.errataOf);
        }
    });
});

describe("renderCalcStepsHtml", () => {
    it("writes a heading when the section changes, and each step's label, arithmetic, result and citation", () => {
        const trace = new CalcTrace(defs);
        trace.add("armor", { label: "Armor", detail: "152 x 2.5", value: 380 });
        trace.add("armor", { label: "Structure", detail: "83 x 1.5", value: 124.5, total: 504.5 });
        trace.add("guess", { label: "Round", value: 505, emphasis: true });
        const html = renderCalcStepsHtml(trace.steps);
        expect(html.match(/<strong>Defensive Battle Rating<\/strong>/g)).toHaveLength(1);
        expect(html).toContain("<strong>Final</strong>");
        expect(html).toContain("Armor: 152 x 2.5 = 380 (TM p.302)<br />");
        expect(html).toContain("Structure: 83 x 1.5 = 124.5 (TM p.302) -&gt; 504.5<br />");
        expect(html).toContain("<strong>Round: 505 (provisional: The rule is silent; NGCFells rounds normally.)</strong><br />");
    });

    it("escapes labels and details", () => {
        const trace = new CalcTrace(defs);
        trace.add("armor", { label: "<b>&\"'", detail: "<i>" });
        const html = renderCalcStepsHtml(trace.steps);
        expect(html).toContain("&lt;b&gt;&amp;&quot;&#39;");
        expect(html).toContain("&lt;i&gt;");
        expect(html).not.toContain("<b>");
        expect(html).not.toContain("<i>");
    });

    it("marks provisional and source-missing steps with their notes", () => {
        const trace = new CalcTrace(defs);
        trace.add("guess", { label: "Round", value: 1 });
        trace.add("lost", { label: "Sheet value" });
        const html = renderCalcStepsHtml(trace.steps);
        expect(html).toContain("(provisional: The rule is silent; NGCFells rounds normally.)");
        expect(html).toContain("(source not yet in NGCFells&#39;s library: Needs Record Sheets: 3055.)");
    });

    it("renders no steps as an empty string", () => {
        expect(renderCalcStepsHtml([])).toBe("");
    });
});

describe("findCalcDefProblems", () => {
    it("is empty for clean definitions", () => {
        expect(findCalcDefProblems(defs)).toEqual([]);
    });

    it("reports an unknown source, a cited step with no cites, an empty page and a missing note", () => {
        const problems = findCalcDefProblems({
            a: { section: "S", cites: [{ source: "nope", page: "1" }], status: "cited" },
            b: { section: "S", cites: [], status: "cited" },
            c: { section: "S", cites: [], status: "provisional" },
            d: { section: "S", cites: [{ source: "tm", page: " " }], status: "cited" },
            e: { section: "S", cites: [], status: "source-missing" },
        });
        expect(problems).toHaveLength(5);
        expect(problems.join("\n")).toMatch(/a: .*nope/);
    });
});
