// Build runner, not app code: rebuilds the bundled designs (#241) on every core. scripts/bundled-build.mjs bundles this
// file with Vite into one Node script and runs it:
//   npm run build:bundled              every type
//   npm run build:bundled -- mechs     the 'Mechs (or units: the BLK types)
// Each file's import, checks and compact round trip runs on a worker thread and is cached by the file, its name, the
// MUL data and the bundled script itself, so a rebuild after a code change redoes every file in parallel and one after
// a data change redoes only the files that changed. The order-dependent part (duplicates, renamed submodels, MUL ids)
// runs on the main thread from the prepared results. BUNDLED_SSW_DIR, BUNDLED_MEGAMEK_DIR, BUNDLED_MORDEL_DIR and
// BUNDLED_WORKERS override the defaults.
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isMainThread, parentPort, Worker, workerData } from "node:worker_threads";
import {
    buildBundledMechs, DEFAULT_MEGAMEK_DIR, DEFAULT_MORDEL_DIR, DEFAULT_SSW_DIR, IBundledBuild, isMULMech, listMechJobs, loadCanonMechs,
    loadMechMUL, MEGAMEK_NOTICE, prepareMechFile, writeBundledDesigns, writeBundledMechs, writeMegaMekCustomRecords,
} from "./bundled-mechs-build";
import { BLK_KINDS, buildBundledUnits, IPreparedUnit, listUnitJobs, prepareUnitFile, writeMegaMekCustomRecords as writeUnitCustomRecords } from "./bundled-units-build";
import type { BundledUnitType } from "./bundled-units";
import { CUSTOM_MUL_FILE_PATH } from "./custom-mul";

const ROOT = process.cwd();
const MUL_DIR = path.join(ROOT, "src/data/mul");
const DATA_DIR = path.join(ROOT, "src/data/bundled");
const SSW_DIR = process.env.BUNDLED_SSW_DIR ?? DEFAULT_SSW_DIR;
const MEGAMEK_DIR = process.env.BUNDLED_MEGAMEK_DIR ?? DEFAULT_MEGAMEK_DIR;
const MORDEL_DIR = process.env.BUNDLED_MORDEL_DIR ?? DEFAULT_MORDEL_DIR;

interface IJob { file: string; name: string }

/** A build: its files, how a worker prepares one, and how the prepared files are built and written. */
interface ITarget {
    jobs: () => IJob[];
    /** Loads what preparing needs, once a worker, and gives the preparer. */
    preparer: () => (job: IJob) => unknown;
    build: (prepared: (job: IJob) => unknown) => string;
}

const describeBuild = (title: string, build: IBundledBuild) =>
    `${title}: ${build.headers.length} designs kept${build.renamed?.length ? ` (${build.renamed.length} renamed)` : ""}, ${build.leftOut.length} files left out`;

const TARGETS: Record<string, ITarget> = {
    mechs: {
        jobs: () => listMechJobs(SSW_DIR, path.join(MEGAMEK_DIR, "meks"), MORDEL_DIR),
        preparer: () => {
            const indexes = loadMechMUL(MUL_DIR);
            return (job) => prepareMechFile(job as ReturnType<typeof listMechJobs>[number], indexes);
        },
        build: (prepared) => {
            const build = buildBundledMechs(SSW_DIR, MUL_DIR, path.join(MEGAMEK_DIR, "meks"), loadCanonMechs(path.join(ROOT, "src/data/mordel/canon-mechs.csv")),
                MORDEL_DIR, prepared as Parameters<typeof buildBundledMechs>[5]);
            writeBundledMechs(build, DATA_DIR);
            // The MegaMek 'Mechs the MUL lacks, filed in the custom unit list under MegaMek's name (#595).
            const customFile = path.join(ROOT, CUSTOM_MUL_FILE_PATH);
            fs.writeFileSync(customFile, writeMegaMekCustomRecords(fs.readFileSync(customFile, "utf8"), build.customRecords, isMULMech));
            return describeBuild("'Mechs", build) + `\n${build.customRecords.length} MegaMek 'Mech entries in the custom unit list`;
        },
    },
    units: {
        jobs: () => listUnitJobs(MEGAMEK_DIR),
        preparer: () => prepareUnitFile,
        build: (prepared) => {
            const { builds, customRecords } = buildBundledUnits(MEGAMEK_DIR, MUL_DIR, prepared as (job: IJob) => IPreparedUnit);
            // The files the MUL lacks, filed in the custom unit list under MegaMek's name.
            const customFile = path.join(ROOT, CUSTOM_MUL_FILE_PATH);
            fs.writeFileSync(customFile, writeUnitCustomRecords(fs.readFileSync(customFile, "utf8"), customRecords));
            return Object.entries(builds).map(([type, build]) => {
                const { title } = BLK_KINDS[type as BundledUnitType];
                writeBundledDesigns(type, title, MEGAMEK_NOTICE, build, DATA_DIR);
                return describeBuild(title, build);
            }).join("\n") + `\n${customRecords.length} MegaMek entries in the custom unit list`;
        },
    },
};

/** A hash of every file under dir: the bundled script's own code, or the MUL data. */
function hashTree(dir: string): string {
    const hash = crypto.createHash("sha1");
    const walk = (at: string) => {
        for (const entry of fs.readdirSync(at, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
            const full = path.join(at, entry.name);
            if (entry.isDirectory()) walk(full);
            else hash.update(entry.name).update(fs.readFileSync(full));
        }
    };
    walk(dir);
    return hash.digest("hex");
}

interface IWorkerJob { index: number; job: IJob }
interface IWorkerResult { index: number; prepared: unknown }

/** Prepares the jobs it is sent, one at a time, so a fast worker takes more of them. */
function runWorker(): void {
    const prepare = TARGETS[workerData.target as string].preparer();
    parentPort!.on("message", ({ index, job }: IWorkerJob) => {
        parentPort!.postMessage({ index, prepared: prepare(job) } satisfies IWorkerResult);
    });
    parentPort!.postMessage(null);
}

async function prepareAll(target: string, jobs: IJob[], workers: number): Promise<unknown[]> {
    const results: unknown[] = [];
    let next = 0, done = 0;
    const started = Date.now();
    await Promise.all(Array.from({ length: Math.min(workers, jobs.length) }, () => new Promise<void>((resolve, reject) => {
        const worker = new Worker(fileURLToPath(import.meta.url), { workerData: { target } });
        const send = () => {
            if (next >= jobs.length) { void worker.terminate().then(() => resolve()); return; }
            const index = next++;
            worker.postMessage({ index, job: jobs[index] } satisfies IWorkerJob);
        };
        worker.on("message", (message: IWorkerResult | null) => {
            if (message) {
                results[message.index] = message.prepared;
                if (++done % 500 === 0) console.log(`  ${done}/${jobs.length} prepared, ${Math.round((Date.now() - started) / 1000)} s`);
            }
            send();
        });
        worker.on("error", reject);
    })));
    return results;
}

/** Prepares each job from the cache or on the workers, keeping the cache to the jobs of this run. */
async function prepareCached(target: string, jobs: IJob[], version: string): Promise<Map<string, unknown>> {
    const cacheDir = path.join(ROOT, "node_modules/.cache/bundled-" + target);
    const keys = jobs.map((job) => crypto.createHash("sha1").update(version).update(job.name).update(fs.readFileSync(job.file)).digest("hex"));
    fs.mkdirSync(cacheDir, { recursive: true });
    const prepared = new Map<string, unknown>();
    const missing: number[] = [];
    keys.forEach((key, index) => {
        const file = path.join(cacheDir, key + ".json");
        if (fs.existsSync(file)) prepared.set(jobs[index].name, JSON.parse(fs.readFileSync(file, "utf8")));
        else missing.push(index);
    });
    const workers = Number(process.env.BUNDLED_WORKERS) || Math.max(1, os.availableParallelism() - 2);
    console.log(`${target}: ${jobs.length} files, ${jobs.length - missing.length} cached, ${missing.length} to prepare on ${Math.min(workers, missing.length)} workers`);
    const fresh = await prepareAll(target, missing.map((index) => jobs[index]), workers);
    missing.forEach((index, at) => {
        prepared.set(jobs[index].name, fresh[at]);
        fs.writeFileSync(path.join(cacheDir, keys[index] + ".json"), JSON.stringify(fresh[at]));
    });
    const used = new Set(keys.map((key) => key + ".json"));
    for (const file of fs.readdirSync(cacheDir)) if (!used.has(file)) fs.rmSync(path.join(cacheDir, file));
    return prepared;
}

async function main(): Promise<void> {
    const asked = process.argv.slice(2);
    const unknown = asked.filter((target) => !TARGETS[target]);
    if (unknown.length > 0) throw new Error(`Unknown build ${unknown.join(", ")}: use ${Object.keys(TARGETS).join(" or ")}`);
    const version = hashTree(path.dirname(fileURLToPath(import.meta.url))) + hashTree(MUL_DIR);
    for (const target of asked.length > 0 ? asked : Object.keys(TARGETS)) {
        const started = Date.now();
        const prepared = await prepareCached(target, TARGETS[target].jobs(), version);
        console.log(TARGETS[target].build((job) => prepared.get(job.name)) + `, ${Math.round((Date.now() - started) / 1000)} s`);
    }
}

if (isMainThread) {
    main().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
    runWorker();
}
