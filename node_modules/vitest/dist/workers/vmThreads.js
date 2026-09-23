import { w as workerInit } from '../chunks/init-threads.B-t1iYCi.js';
import { s as setupVmWorker, r as runVmTests } from '../chunks/vm.W4G5WMTl.js';
import 'node:worker_threads';
import '../chunks/init.3UJvPvQg.js';
import 'node:fs';
import 'node:module';
import 'node:url';
import 'vite/module-runner';
import '../chunks/index.D4dXTzh9.js';
import '../chunks/pathe.M-eThtNZ.DwEga6ro.js';
import '../chunks/modules.BJuCwlRJ.js';
import '../chunks/utils.DYj33du9.js';
import '../path.js';
import 'node:path';
import '../module-evaluator.js';
import 'node:vm';
import '../traces.js';
import '@vitest/mocker';
import '@vitest/mocker/redirect';
import 'node:console';
import '../chunks/source-map.BH0bbrs9.js';
import '../chunks/index.M2dsQ_UQ.js';
import '../chunks/tinyrainbow.Ht9iggcq.js';
import '../chunks/rpc.Bvs-iVxs.js';
import '../chunks/index.DmDMHCg8.js';
import '../chunks/inspector.CvyFGlXm.js';
import 'node:v8';
import '../chunks/console.B09ye7y0.js';
import 'node:stream';
import '../chunks/resolver.NpfwMKt9.js';
import 'es-module-lexer';
import '../chunks/setup-common.BkQOiNcI.js';
import '../chunks/plugins.Cigb0uSy.js';

workerInit({
	runTests: runVmTests,
	setup: setupVmWorker
});
