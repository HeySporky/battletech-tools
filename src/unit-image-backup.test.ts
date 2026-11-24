// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleMech } from "./classes/battlemech";
import Vehicle from "./classes/vehicle";
import { type IFullBackup, restoreFullBackup } from "./dataSaves";

// #95: the unit picture lives in the design, so backup and restore and design export and import keep it byte for byte.
const PICTURE = "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA";

describe("unit picture in backups and design files (#95)", () => {
    beforeEach(() => localStorage.clear());

    // Every save* function the restore may call is a no-op; the saved lists are plain arrays.
    const globals = () => new Proxy({ favoriteASGroups: [], favoriteCBTGroups: [], battleMechSaves: [], vehicleSaves: [], fighterSaves: [] } as Record<string, unknown>, {
        get: (target, key: string) => (key in target ? target[key] : key.startsWith("save") ? vi.fn() : undefined),
    }) as never;

    it("a 'Mech save keeps its picture through a backup and restore", () => {
        const mech = new BattleMech();
        mech.setName("Pictured");
        mech.tro.setImage(PICTURE);
        const save = JSON.parse(JSON.stringify(mech.export(true)));
        expect(save.tro.image).toBe(PICTURE);
        const target = globals() as unknown as { battleMechSaves: { tro?: { image?: string } }[] };
        restoreFullBackup({ battleMechSaves: [save], favoriteASGroups: [] } as unknown as IFullBackup, target as never, false, false, false, true);
        const restored = target.battleMechSaves.find((entry) => entry.tro?.image);
        expect(restored?.tro?.image).toBe(PICTURE);
    });

    it("design export and import keep the picture, and a design saved without one loads as before", () => {
        const mech = new BattleMech();
        mech.tro.setImage(PICTURE);
        const back = new BattleMech();
        back.import(JSON.parse(JSON.stringify(mech.export(true))));
        expect(back.tro.getImage()).toBe(PICTURE);

        const plain = new BattleMech();
        const again = new BattleMech();
        again.import(JSON.parse(JSON.stringify(plain.export(true))));
        expect(again.tro.getImage()).toBe("");
        expect(JSON.stringify(again.export(true))).not.toContain("\"image\"");

        const vehicle = new Vehicle();
        vehicle.tro.setImage(PICTURE);
        const vehicleBack = new Vehicle();
        vehicleBack.importJSON(vehicle.exportJSON());
        expect(vehicleBack.tro.getImage()).toBe(PICTURE);
    });

    it("a hand-edited design with an svg picture drops it on import", () => {
        const mech = new BattleMech();
        const save = JSON.parse(JSON.stringify(mech.export(true)));
        save.tro = { image: "data:image/svg+xml;base64,PHN2Zy8+" };
        const back = new BattleMech();
        back.import(save);
        expect(back.tro.getImage()).toBe("");
    });
});
