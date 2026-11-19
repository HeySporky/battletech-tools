import {
    ITechnicalReadoutExport, ITroEquipmentCopy, ITroEquipmentMake, ITroMake, TroProductionKey, TroTextKey, TRO_TEXT_SECTIONS,
} from "../data/technical-readout-interfaces";

const PRODUCTION_KEYS: TroProductionKey[] = ["manufacturer", "primaryFactory", "communications", "targeting"];
const TEXT_KEYS: TroTextKey[] = TRO_TEXT_SECTIONS.map((section) => section.key);

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

const cleanMake = (make: ITroMake | undefined): ITroMake => {
    const result: ITroMake = {};
    // Kept as typed (a space typed between two words must survive); blank means none. Export trims.
    if (make?.manufacturer?.trim()) {
        result.manufacturer = make.manufacturer;
    }
    if (make?.model?.trim()) {
        result.model = make.model;
    }
    return result;
};

const trimMake = (make: ITroMake): ITroMake => cleanMake({ manufacturer: make.manufacturer?.trim(), model: make.model?.trim() });

const makeIsEmpty = (make: ITroMake): boolean => !make.manufacturer && !make.model;

const importMake = (data: unknown): ITroMake => (isObject(data)
    ? cleanMake({
        manufacturer: typeof data.manufacturer === "string" ? data.manufacturer : undefined,
        model: typeof data.model === "string" ? data.model : undefined,
    })
    : {});

const normalize = (text: string): string => text.toLowerCase().replace(/[\s-]/g, "");

/** The Technical Readout fields of one unit: production, component and equipment makes, and the text sections. */
export class TechnicalReadout {
    private _production: Partial<Record<TroProductionKey, string>> = {};
    private _components: Record<string, string> = {};
    private _equipment: Record<string, ITroEquipmentMake> = {};
    private _text: Partial<Record<TroTextKey, string>> = {};

    public getProduction(key: TroProductionKey): string {
        return this._production[key] ?? "";
    }

    public setProduction(key: TroProductionKey, value: string): void {
        if (value.trim()) {
            this._production[key] = value;
        } else {
            delete this._production[key];
        }
    }

    public getComponent(key: string): string {
        return this._components[key] ?? "";
    }

    public setComponent(key: string, value: string): void {
        if (value.trim()) {
            this._components[key] = value;
        } else {
            delete this._components[key];
        }
    }

    /** Every component key holding a make, for makes the unit type has no row for. */
    public getComponentKeys(): string[] {
        return Object.keys(this._components);
    }

    public getText(key: TroTextKey): string {
        return this._text[key] ?? "";
    }

    public setText(key: TroTextKey, value: string): void {
        if (value.trim()) {
            this._text[key] = value;
        } else {
            delete this._text[key];
        }
    }

    public getTypeMake(tag: string): ITroMake {
        const entry = this._equipment[tag];
        return entry ? cleanMake(entry) : {};
    }

    public setTypeMake(tag: string, make: ITroMake): void {
        const entry = this._equipment[tag] ?? {};
        delete entry.manufacturer;
        delete entry.model;
        Object.assign(entry, cleanMake(make));
        this._equipment[tag] = entry;
        this._tidy(tag);
    }

    public isMixed(tag: string): boolean {
        return this._equipment[tag]?.mixed === true;
    }

    /** On: every copy of the type starts with the type's make. Off: the per-copy makes go, the type's make stays. */
    public setMixed(tag: string, mixed: boolean, copies: ITroEquipmentCopy[]): void {
        const entry = this._equipment[tag] ?? {};
        this._equipment[tag] = entry;
        if (mixed) {
            entry.mixed = true;
            const typeMake = this.getTypeMake(tag);
            entry.copies = {};
            if (!makeIsEmpty(typeMake)) {
                for (const copy of copies.filter((candidate) => candidate.tag === tag)) {
                    entry.copies[copy.uuid] = { ...typeMake };
                }
            }
        } else {
            delete entry.mixed;
            delete entry.copies;
        }
        this._tidy(tag);
    }

    /** The copy's own make while the type is mixed (the type's make for a copy added since); otherwise the type's make. */
    public getCopyMake(tag: string, uuid: string): ITroMake {
        const entry = this._equipment[tag];
        if (entry?.mixed && entry.copies?.[uuid]) {
            return cleanMake(entry.copies[uuid]);
        }
        return this.getTypeMake(tag);
    }

    public setCopyMake(tag: string, uuid: string, make: ITroMake): void {
        const entry = this._equipment[tag] ?? {};
        this._equipment[tag] = entry;
        entry.mixed = true;
        entry.copies = entry.copies ?? {};
        entry.copies[uuid] = cleanMake(make);
    }

    /**
     * Drops makes for equipment that is gone: type entries no copy has (and no other configuration holds, per knownTags) and whose per-copy makes are all unknown, and per-copy
     * makes for uuids no configuration holds. A mixed type with a single copy left goes back to unmixed.
     */
    public prune(copies: ITroEquipmentCopy[], knownUuids: string[], knownTags: string[] = []): void {
        for (const tag of Object.keys(this._equipment)) {
            const entry = this._equipment[tag];
            const current = copies.filter((copy) => copy.tag === tag);
            if (entry.copies) {
                for (const uuid of Object.keys(entry.copies)) {
                    if (!knownUuids.includes(uuid)) {
                        delete entry.copies[uuid];
                    }
                }
            }
            const remaining = Object.keys(entry.copies ?? {});
            if (current.length === 0 && remaining.length === 0 && !knownTags.includes(tag)) {
                delete this._equipment[tag];
                continue;
            }
            if (entry.mixed && current.length === 1 && remaining.every((uuid) => uuid === current[0].uuid)) {
                const make = this.getCopyMake(tag, current[0].uuid);
                delete entry.mixed;
                delete entry.copies;
                delete entry.manufacturer;
                delete entry.model;
                Object.assign(entry, make);
            }
            this._tidy(tag);
        }
    }

    /** SSW holds make and model in one string, so an imported make lands whole in the manufacturer field. */
    public applyImportedCopyMakes(makes: { uuid: string; make: string }[], copies: ITroEquipmentCopy[], ensureUuid: (copy: ITroEquipmentCopy) => string): void {
        const tags = [...new Set(copies.map((copy) => copy.tag))];
        for (const tag of tags) {
            const ofTag = copies.filter((copy) => copy.tag === tag);
            const makeOf = (copy: ITroEquipmentCopy): string => makes.find((entry) => entry.uuid === copy.uuid)?.make.trim() ?? "";
            const distinct = new Set(ofTag.map(makeOf));
            if (distinct.size === 1) {
                const [only] = [...distinct];
                if (only) {
                    this.setTypeMake(tag, { manufacturer: only });
                }
                continue;
            }
            const copyMakes: Record<string, ITroMake> = {};
            for (const copy of ofTag) {
                const make = makeOf(copy);
                copyMakes[ensureUuid(copy)] = make ? { manufacturer: make } : {};
            }
            this._equipment[tag] = { mixed: true, copies: copyMakes };
        }
    }

    /** Copies grouped by identical make and name, in order of first appearance; the text has no count. */
    public getArmamentGroups(copies: ITroEquipmentCopy[]): { count: number; text: string }[] {
        const groups: { count: number; text: string }[] = [];
        for (const copy of copies.filter((candidate) => candidate.armament !== false)) {
            const make = this.getCopyMake(copy.tag, copy.uuid);
            const makeText = [make.manufacturer?.trim(), make.model?.trim()].filter(Boolean).join(" ");
            const name = normalize(makeText).includes(normalize(copy.name)) ? "" : copy.name;
            const text = [makeText, name].filter(Boolean).join(" ");
            const group = groups.find((candidate) => candidate.text === text);
            if (group) {
                group.count++;
            } else {
                groups.push({ count: 1, text });
            }
        }
        return groups;
    }

    public getArmamentLine(copies: ITroEquipmentCopy[]): string {
        return this.getArmamentGroups(copies).map((group) => `${group.count} ${group.text}`).join(", ");
    }

    public isEmpty(): boolean {
        return this.export() === undefined;
    }

    /** The saved form; undefined when there is nothing, so a design without TRO data saves as before. */
    public export(): ITechnicalReadoutExport | undefined {
        const result: ITechnicalReadoutExport = {};
        if (Object.keys(this._production).length) {
            result.production = { ...this._production };
        }
        if (Object.keys(this._components).length) {
            result.components = { ...this._components };
        }
        const equipment: Record<string, ITroEquipmentMake> = {};
        for (const [tag, entry] of Object.entries(this._equipment)) {
            const out: ITroEquipmentMake = trimMake(entry);
            if (entry.mixed) {
                out.mixed = true;
                // An empty copy entry is kept: it says that copy has no make, not that it shares the type's.
                const copyEntries = Object.entries(entry.copies ?? {});
                if (copyEntries.length) {
                    out.copies = Object.fromEntries(copyEntries.map(([uuid, make]) => [uuid, trimMake(make)]));
                }
            }
            if (Object.keys(out).length) {
                equipment[tag] = out;
            }
        }
        if (Object.keys(equipment).length) {
            result.equipment = equipment;
        }
        if (Object.keys(this._text).length) {
            result.text = { ...this._text };
        }
        return Object.keys(result).length ? result : undefined;
    }

    /** Loads a save's TRO fields; anything that is not the expected shape is ignored. */
    public import(data: unknown): void {
        this._production = {};
        this._components = {};
        this._equipment = {};
        this._text = {};
        if (!isObject(data)) {
            return;
        }
        if (isObject(data.production)) {
            for (const key of PRODUCTION_KEYS) {
                const value = data.production[key];
                if (typeof value === "string") {
                    this.setProduction(key, value);
                }
            }
        }
        if (isObject(data.components)) {
            for (const [key, value] of Object.entries(data.components)) {
                if (typeof value === "string") {
                    this.setComponent(key, value);
                }
            }
        }
        if (isObject(data.equipment)) {
            for (const [tag, raw] of Object.entries(data.equipment)) {
                if (!isObject(raw)) {
                    continue;
                }
                const entry: ITroEquipmentMake = importMake(raw);
                if (raw.mixed === true) {
                    entry.mixed = true;
                    const copies: Record<string, ITroMake> = {};
                    if (isObject(raw.copies)) {
                        for (const [uuid, copyRaw] of Object.entries(raw.copies)) {
                            if (isObject(copyRaw)) {
                                copies[uuid] = importMake(copyRaw);
                            }
                        }
                    }
                    entry.copies = copies;
                }
                this._equipment[tag] = entry;
            }
        }
        if (isObject(data.text)) {
            for (const key of TEXT_KEYS) {
                const value = data.text[key];
                if (typeof value === "string") {
                    this.setText(key, value);
                }
            }
        }
    }

    /** Removes an entry that holds nothing. */
    private _tidy(tag: string): void {
        const entry = this._equipment[tag];
        if (entry && !entry.manufacturer && !entry.model && !entry.mixed && !Object.keys(entry.copies ?? {}).length) {
            delete this._equipment[tag];
        }
    }
}
