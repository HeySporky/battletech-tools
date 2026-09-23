import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import timers from 'node:timers';
import timersPromises from 'node:timers/promises';
import util from 'node:util';
import { K as KNOWN_ASSET_TYPES } from '../chunks/pathe.M-eThtNZ.DwEga6ro.js';
import { s as setupChaiConfig, r as resolveTestRunner, a as resolveSnapshotEnvironment, d as detectAsyncLeaks } from '../chunks/index.DNv8WNGe.js';
import { s as startCoverageInsideWorker, a as stopCoverageInsideWorker } from '../chunks/coverage.AipniaqB.js';
import { i as index, g as globalExpect } from '../chunks/index.m3L2HgmY.js';
import { c as closeInspector } from '../chunks/inspector.CvyFGlXm.js';
import { s as startTests, p as publicCollect } from '../chunks/run.C5UmxDPh.js';
import { s as setupCommonEnv } from '../chunks/setup-common.BkQOiNcI.js';
import { g as getWorkerState } from '../chunks/utils.DYj33du9.js';
import 'chai';
import 'node:async_hooks';
import '../chunks/rpc.Bvs-iVxs.js';
import 'vite/module-runner';
import '../chunks/source-map.BH0bbrs9.js';
import '../chunks/index.DmDMHCg8.js';
import '../chunks/coverage.CX7NN5s7.js';
import '../chunks/spy.DQ0ZsPbi.js';
import '../chunks/display.pkpxlVcY.js';
import '../chunks/index.M2dsQ_UQ.js';
import '../chunks/tinyrainbow.Ht9iggcq.js';
import '../task-utils.js';
import '../chunks/plugins.Cigb0uSy.js';
import '../chunks/offset.Dy-5Fdfn.js';
import 'tinybench';
import 'expect-type';
import 'node:url';

async function run(method, files, config, moduleRunner, traces) {
	const workerState = getWorkerState();
	await traces.$("vitest.runtime.global_env", () => setupCommonEnv(config));
	Object.defineProperty(globalThis, "__vitest_index__", {
		value: index,
		enumerable: false,
		configurable: true,
		writable: true
	});
	const viteEnvironment = workerState.environment.viteEnvironment || workerState.environment.name;
	globalExpect.setState({ environment: workerState.environment.name });
	if (viteEnvironment === "client") {
		const _require = createRequire(import.meta.url);
		// always mock "required" `css` files, because we cannot process them
		_require.extensions[".css"] = resolveCss;
		_require.extensions[".scss"] = resolveCss;
		_require.extensions[".sass"] = resolveCss;
		_require.extensions[".less"] = resolveCss;
		// since we are using Vite, we can assume how these will be resolved
		KNOWN_ASSET_TYPES.forEach((type) => {
			_require.extensions[`.${type}`] = resolveAsset;
		});
		process.env.SSR = "";
	} else process.env.SSR = "1";
	// @ts-expect-error not typed global for patched timers
	globalThis.__vitest_required__ = {
		util,
		timers,
		timersPromises
	};
	await traces.$("vitest.runtime.coverage.start", () => startCoverageInsideWorker(config.coverage, moduleRunner, { isolate: false }));
	if (config.chaiConfig) setupChaiConfig(config.chaiConfig);
	const [testRunner, snapshotEnvironment] = await Promise.all([traces.$("vitest.runtime.runner", () => resolveTestRunner(config, moduleRunner, traces)), traces.$("vitest.runtime.snapshot.environment", () => resolveSnapshotEnvironment(config, moduleRunner))]);
	config.snapshotOptions.snapshotEnvironment = snapshotEnvironment;
	// the callback captures this file's runner: unsubscribe once the run is
	// over, or every finished file's world stays reachable from the worker's
	// cancel listeners for the lifetime of the worker
	const offCancel = workerState.onCancel((reason) => {
		closeInspector(config);
		testRunner.cancel?.(reason);
	});
	// unlike other pools, the vm pool creates the environment inside the
	// prepare window; subtract it so `prepare` excludes the environment
	// load time in every pool
	workerState.durations.prepare = performance.now() - workerState.durations.prepare - workerState.durations.environment;
	const { vi } = index;
	try {
		await traces.$(`vitest.test.runner.${method}`, async () => {
			for (const file of files) {
				workerState.filepath = file.filepath;
				if (method === "run") {
					const collectAsyncLeaks = config.detectAsyncLeaks ? detectAsyncLeaks(file.filepath, workerState.ctx.projectName) : void 0;
					await traces.$(`vitest.test.runner.${method}.module`, { attributes: { "code.file.path": file.filepath } }, () => startTests([file], testRunner));
					const leaks = await collectAsyncLeaks?.();
					if (leaks?.length) workerState.rpc.onAsyncLeaks(leaks);
				} else await traces.$(`vitest.test.runner.${method}.module`, { attributes: { "code.file.path": file.filepath } }, () => publicCollect([file], testRunner));
				// reset after tests, because user might call `vi.setConfig` in setupFile
				vi.resetConfig();
				// mocks should not affect different files
				vi.restoreAllMocks();
			}
		});
	} finally {
		offCancel();
	}
	await traces.$("vitest.runtime.coverage.stop", () => stopCoverageInsideWorker(config.coverage, moduleRunner, { isolate: false }));
}
function resolveCss(mod) {
	mod.exports = "";
}
function resolveAsset(mod, url) {
	mod.exports = url;
}

export { run };
