import corrections from "./star-system-corrections.json";
import { IStarSystemCorrection } from "./star-system-types";

/** Corrections read from our books (Task 6 of the campaign plan); the import script applies them. */
export const STAR_SYSTEM_CORRECTIONS: IStarSystemCorrection[] = corrections as IStarSystemCorrection[];
