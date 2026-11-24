import { IEras } from "./data-interfaces";
import { findEraByTag, fitTechToEra } from "./era-options";

/** A design whose era and tech base the builder sets. */
interface IEraTechUnit {
    getTech(): { tag: string };
    setTech(tag: string): unknown;
    setEra(tag: string): unknown;
}

/**
 * Picks the design's era first; the era decides the tech base (user ruling 2026-10-21). A tech base the era
 * closes switches to the nearest one it allows, before the era is set, so the era is never moved to fit the base.
 */
export function chooseEra(unit: IEraTechUnit, eraTag: string): void {
    const era = findEraByTag(eraTag);
    if (!era) return;
    const tech = fitTechToEra(unit.getTech().tag, era);
    if (tech !== unit.getTech().tag) unit.setTech(tech);
    unit.setEra(era.tag);
}

/** The tech bases a builder offers in `era`: those the era allows, of the ones it builds with, in `techTags` order. */
export function getTechChoices(era: IEras, techTags: string[]): string[] {
    return techTags.filter((tag) => era.techBases.includes(tag));
}

/** A design with an Inner Sphere / Clan tech base and, for some, a Mixed Tech switch (battle armor, infantry). */
interface ITechBaseUnit {
    getTechBase(): "is" | "clan";
    setTechBase(techBase: "is" | "clan"): unknown;
    setEra(tag: string): unknown;
    isMixedTech?(): boolean;
    setMixedTech?(value: boolean): unknown;
}

/** `chooseEra` for designs that keep the tech base and Mixed Tech apart: Mixed Tech goes off in an era without it. */
export function chooseEraByTechBase(unit: ITechBaseUnit, eraTag: string): void {
    chooseEra({
        getTech: () => ({ tag: unit.isMixedTech?.() ? (unit.getTechBase() === "clan" ? "mclan" : "mis") : unit.getTechBase() }),
        setTech: (tag: string) => {
            const mixed = tag === "mis" || tag === "mclan";
            if (!mixed && unit.isMixedTech?.()) unit.setMixedTech?.(false);
            unit.setTechBase(tag === "clan" || tag === "mclan" ? "clan" : "is");
        },
        setEra: (tag: string) => unit.setEra(tag),
    }, eraTag);
}
