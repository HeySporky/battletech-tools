import { battlemechLocations } from "../data/battlemech-locations";
import { IEquipmentItem } from "../data/data-interfaces";
import { getEngineTableMaker } from "../data/engine-makers";
import { ITroComponentRow, ITroConstructionRow, ITroEquipmentCopy, ITroSpecValues, ITroUnitAdapter } from "../data/technical-readout-interfaces";
import { generateUUID } from "../utils/generateUUID";
import type { BattleMech } from "./battlemech";

/** Modern TROs print speeds in kph: 10.8 kph per movement point, to the whole kph. */
const kph = (movementPoints: number): string => `${Math.round(movementPoints * 10.8)} kph`;

const locationOrder = (location: string | undefined): number => {
    const index = battlemechLocations.findIndex((entry) => entry.tag === location);
    return index < 0 ? battlemechLocations.length : index;
};

const locationLabel = (item: IEquipmentItem): string => {
    const abbr = battlemechLocations.find((entry) => entry.tag === item.location)?.abbr ?? "n/a";
    return abbr.toUpperCase() + (item.rear ? " (R)" : "");
};

const isTroEquipment = (item: IEquipmentItem | undefined): item is IEquipmentItem => !!item && !item.isAmmo;

/** What the shared Technical Readout section and sheet need to know about a 'Mech. */
export function getBattleMechTroAdapter(mech: BattleMech): ITroUnitAdapter {
    const installed = (): IEquipmentItem[] => mech.getInstalledEquipment().filter(isTroEquipment);
    // The early Engine Tables name a maker per rating, for the standard fusion engine they list ("Pitban 240").
    const engineTableMake = (): string | undefined => {
        if (mech.getEngineType().tag !== "standard") {
            return undefined;
        }
        const maker = getEngineTableMaker(mech.getRulesEdition(), mech.getEngineRating());
        return maker ? `${maker} ${mech.getEngineRating()}` : undefined;
    };

    return {
        getComponentRows(): ITroComponentRow[] {
            const rows: ITroComponentRow[] = [
                { key: "chassis", label: `Chassis (${mech.getInternalStructureLabel()})` },
                { key: "engine", label: `Engine (${mech.getEngineName()} ${mech.getEngineRating()})`, suggested: engineTableMake() },
                { key: "armor", label: `Armor (${mech.getArmorObj().name})` },
                { key: "heatSinks", label: `Heat Sinks (${mech.getHeatSinks()} ${mech.getHeatSinksObj().name})` },
            ];
            if (mech.getJumpSpeed() > 0) {
                rows.push({ key: "jumpJets", label: "Jump Jets" });
            }
            rows.push(
                { key: "gyro", label: `Gyro (${mech.getGyroName()})` },
                { key: "cockpit", label: `Cockpit (${mech.getCockpitType().name})` },
                { key: "myomer", label: `Myomer (${mech.getMyomerType().name})` },
            );
            return rows;
        },

        getEquipmentCopies(): ITroEquipmentCopy[] {
            return installed().map((item) => ({
                uuid: item.uuid ?? "",
                tag: item.tag,
                name: item.name,
                locationLabel: locationLabel(item),
                armament: item.category !== "Miscellaneous Equipment",
            }));
        },

        getKnownEquipmentUuids(): string[] {
            return [
                ...mech.getInstalledEquipment().map((item) => item?.uuid).filter((uuid): uuid is string => !!uuid),
                ...mech.getOmniConfigurationEquipmentUuids(),
            ];
        },

        getKnownEquipmentTags(): string[] {
            return [...mech.getInstalledEquipment().map((item) => item?.tag), ...mech.getOmniConfigurationEquipmentTags()].filter((tag): tag is string => !!tag);
        },

        ensureEquipmentUuid(copy: ITroEquipmentCopy): string {
            if (copy.uuid) {
                return copy.uuid;
            }
            const item = installed().find((candidate) => !candidate.uuid && candidate.tag === copy.tag && locationLabel(candidate) === copy.locationLabel);
            if (!item) {
                return copy.uuid;
            }
            item.uuid = generateUUID();
            return item.uuid;
        },

        getSpecValues(): ITroSpecValues {
            const tons = mech.getTonnage();
            const jump = mech.getJumpSpeed();
            return {
                title: mech.getChassisName(),
                subtitle: [mech.getModelName(), mech.getTech().name, `${tons} tons`].filter(Boolean).join(" · "),
                mass: `${tons} tons`,
                cruisingSpeed: kph(mech.getWalkSpeed()),
                maximumSpeed: kph(mech.getRunSpeed()),
                jumpCapacity: jump > 0 ? `${jump * 30} meters` : undefined,
                armorType: mech.getArmorObj().name,
            };
        },

        getConstructionRows(): ITroConstructionRow[] {
            const typeTag = mech.getMechType().tag.toLowerCase();
            const structure = mech.getInternalStructure() as unknown as Record<string, number | undefined>;
            const armor = mech.getArmorAllocation() as unknown as Record<string, number | undefined>;
            const rows: ITroConstructionRow[] = [
                { label: `Internal Structure (${mech.getInternalStructureLabel()})`, mass: `${mech.getInternalStructureWeight()}` },
                ...mech._getFrankenMechReadoutLines().map((line) => ({ label: line, indent: true })),
                { label: mech.getEngineName(), value: `${mech.getEngineRating()}`, mass: `${mech.getEngineWeight()}` },
                { label: "Walking", value: `${mech.getWalkSpeed()}`, indent: true },
                { label: "Running", value: `${mech.getRunSpeed()}`, indent: true },
                { label: "Jumping", value: `${mech.getJumpSpeed()}`, indent: true },
            ];
            if (mech.getMechanicalJumpBoosterSpeed() > 0) {
                rows.push({ label: "Jump Boosters", value: `${mech.getMechanicalJumpBoosterSpeed()}`, indent: true });
            }
            if (mech.getUMUSpeed() > 0) {
                rows.push({ label: "UMU", value: `${mech.getUMUSpeed()}`, indent: true });
            }
            rows.push(
                { label: mech.getHeatSyncName(), value: `${mech.getHeatSinks()}`, mass: `${mech.getHeatSinksWeight()}` },
                { label: mech.getGyroName(), mass: `${mech.getGyroWeight()}` },
                { label: mech.getCockpitType().tag === "standard" ? "Cockpit" : mech.getCockpitType().name, mass: `${mech.getCockpitWeight()}` },
                { label: `Armor Value (${mech.getArmorObj().name})`, value: `${mech.getTotalArmor()}`, mass: `${mech.getArmorWeight()}` },
                ...mech._getPatchworkReadoutLines().map((line) => ({ label: line, indent: true })),
            );

            rows.push({ label: "Internal Structure / Armor by location", heading: true });
            const pair = (label: string, isKey: string, armorKey: string, rearKey?: string): void => {
                rows.push({ label, value: `${structure[isKey] ?? 0} / ${armor[armorKey] ?? 0}`, indent: true });
                if (rearKey) {
                    rows.push({ label: `${label} (Rear)`, value: `- / ${armor[rearKey] ?? 0}`, indent: true });
                }
            };
            const merged = (label: string, mergedLabel: string, right: string, left: string, rightRear?: string, leftRear?: string): void => {
                const same = armor[right] === armor[left] && structure[right] === structure[left]
                    && (!rightRear || armor[rightRear] === armor[leftRear!]);
                if (same) {
                    pair(mergedLabel, right, right, rightRear);
                } else {
                    pair(`Right ${label}`, right, right, rightRear);
                    pair(`Left ${label}`, left, left, leftRear);
                }
            };
            pair("Head", "head", "head");
            pair("Center Torso", "centerTorso", "centerTorso", "centerTorsoRear");
            merged("Torso", "R/L Torso", "rightTorso", "leftTorso", "rightTorsoRear", "leftTorsoRear");
            if (typeTag === "biped" || typeTag === "lam" || typeTag === "tripod") {
                merged("Arm", "R/L Arm", "rightArm", "leftArm");
                merged("Leg", "R/L Leg", "rightLeg", "leftLeg");
                if (typeTag === "tripod") {
                    pair("Center Leg", "centerLeg", "centerLeg");
                }
            } else if (typeTag === "quad" || typeTag === "quadvee") {
                merged("Front Leg", "R/L Front Leg", "frontRightLeg", "frontLeftLeg");
                merged("Rear Leg", "R/L Rear Leg", "rightLeg", "leftLeg");
            }

            rows.push({ label: "Weapons and Equipment", value: "Location", mass: "Mass", heading: true });
            const equipment = mech.getInstalledEquipment().filter((item): item is IEquipmentItem => !!item);
            const sorted = [...equipment].sort((a, b) => locationOrder(a.location) - locationOrder(b.location) || a.name.localeCompare(b.name));
            for (const item of sorted) {
                rows.push({ label: item.name, value: locationLabel(item), mass: `${item.weight}` });
            }
            if (mech.getJumpSpeed() > 0) {
                rows.push({ label: "Jump Jets", value: `${mech.getJumpSpeed()}`, mass: `${mech.getJumpJetWeight()}` });
            }
            return rows;
        },
    };
}
