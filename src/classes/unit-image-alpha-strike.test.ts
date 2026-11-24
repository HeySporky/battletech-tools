import { describe, expect, it } from "vitest";
import AerospaceFighter from "./aerospace-fighter";
import { AlphaStrikeUnit } from "./alpha-strike-unit";
import BattleArmor from "./battle-armor";
import { BattleMech } from "./battlemech";
import InfantryPlatoon from "./infantry-platoon";
import MicroMech from "./micro-mech";
import ProtoMech from "./protomech";
import Vehicle from "./vehicle";
import Walker from "./walker";
import type { TechnicalReadout } from "./technical-readout";

// #95: the unit picture shrunk into the design is copied onto the Alpha Strike card by every conversion.
const PICTURE = "data:image/webp;base64,AAAA";

interface IConvertible { tro: TechnicalReadout }
const converters: [string, () => IConvertible, (unit: never) => AlphaStrikeUnit][] = [
    ["BattleMech", () => new BattleMech(), (u: BattleMech) => u.calcAlphaStrike()],
    ["Vehicle", () => new Vehicle(), (u: Vehicle) => u.getAlphaStrikeUnit()],
    ["fighter", () => new AerospaceFighter(), (u: AerospaceFighter) => u.getAlphaStrikeUnit()],
    ["battle armor", () => new BattleArmor(), (u: BattleArmor) => u.getAlphaStrikeUnit()],
    ["infantry", () => new InfantryPlatoon(), (u: InfantryPlatoon) => u.getAlphaStrikeUnit()],
    ["ProtoMech", () => new ProtoMech(), (u: ProtoMech) => u.getAlphaStrikeUnit()],
    ["Micro-Mech", () => new MicroMech(), (u: MicroMech) => u.getAlphaStrikeUnit()],
    ["Walker", () => new Walker(), (u: Walker) => u.getAlphaStrikeUnit()],
];

describe("unit picture on the Alpha Strike card (#95)", () => {
    it.each(converters)("%s: the converted card carries the picture, and none without one", (_name, make, convert) => {
        const unit = make();
        expect(convert(unit as never).imageURL ?? "").toBe("");
        unit.tro.setImage(PICTURE);
        expect(convert(unit as never).imageURL).toBe(PICTURE);
    });

    it("an Alpha Strike unit export and import keeps the data URL", () => {
        const mech = new BattleMech();
        mech.tro.setImage(PICTURE);
        const card = mech.calcAlphaStrike();
        const back = new AlphaStrikeUnit();
        back.importUnit(JSON.parse(JSON.stringify(card.export())));
        expect(back.imageURL).toBe(PICTURE);
    });
});
