import { g as globalApis } from './constants.-juJ8b_4.js';
import { i as index } from './index.m3L2HgmY.js';
import './run.C5UmxDPh.js';
import './index.M2dsQ_UQ.js';
import './tinyrainbow.Ht9iggcq.js';
import './display.pkpxlVcY.js';
import './pathe.M-eThtNZ.DwEga6ro.js';
import './source-map.BH0bbrs9.js';
import '../task-utils.js';
import './utils.DYj33du9.js';
import './spy.DQ0ZsPbi.js';
import 'chai';
import './plugins.Cigb0uSy.js';
import './offset.Dy-5Fdfn.js';
import './rpc.Bvs-iVxs.js';
import 'vite/module-runner';
import './index.DmDMHCg8.js';
import 'tinybench';
import 'expect-type';

function registerApiGlobally() {
	globalApis.forEach((api) => {
		// @ts-expect-error I know what I am doing :P
		globalThis[api] = index[api];
	});
}

export { registerApiGlobally };
