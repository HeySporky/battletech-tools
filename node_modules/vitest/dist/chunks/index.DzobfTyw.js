import * as os from 'node:os';
import os__default, { homedir, tmpdir, availableParallelism, hostname } from 'node:os';
import { j as join, b as basename, d as dirname, i as isAbsolute, r as resolve, c as cleanUrl, D as noop$1, f as extname, h as KNOWN_ASSET_RE, F as withTrailingSlash, G as wrapId, H as isExternalUrl, I as unwrapId, a as relative, z as unique, e as createDefer, s as slash, t as toArray, m as isPrimitive, n as normalize, J as deepMerge, p as deepClone, L as sanitizeFilePath } from './pathe.M-eThtNZ.DwEga6ro.js';
import { e as getDefaultExportFromCjs, T as TraceMap, o as originalPositionFor, k as generatedPositionFor, l as eachMapping, m as stackIgnorePatterns, f as parseErrorStacktrace, p as parseStacktrace, b as serializeValue } from './source-map.BH0bbrs9.js';
import { v as version$1 } from './cac.fSuRXrAx.js';
import * as fs from 'node:fs';
import fs__default, { promises, existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync, statfsSync, realpathSync, statSync, readdirSync } from 'node:fs';
import { performance as performance$1 } from 'node:perf_hooks';
import { c as createBirpc } from './index.DmDMHCg8.js';
import require$$0$3 from 'events';
import require$$1$1 from 'https';
import require$$2$1 from 'http';
import require$$3 from 'net';
import require$$4 from 'tls';
import require$$1 from 'crypto';
import require$$0$2 from 'stream';
import require$$7 from 'url';
import require$$0 from 'zlib';
import require$$0$1 from 'buffer';
import require$$2 from 'util';
import { A as API_PATH, a as defaultPort, c as configFiles, d as defaultBrowserPort, b as defaultInspectPort } from './constants.-juJ8b_4.js';
import * as vite from 'vite';
import { createServer, isFileLoadingAllowed, normalizePath, fetchModule, parseAst, searchForWorkspaceRoot, version, isRunnableDevEnvironment, mergeConfig, resolveConfig as resolveConfig$2 } from 'vite';
import crypto, { createHash } from 'node:crypto';
import { rootDir, distDir } from '../path.js';
import { z as validateTags, A as limitConcurrency, B as shuffle, C as createTagsFilter } from './run.C5UmxDPh.js';
import { N as NativeModuleRunner, i as isPackageExists, r as resolveModule } from './nativeModuleRunner.J0QLzNtK.js';
import { createFileTask as createFileTask$1, createTaskName, calculateSuiteHash, convertTasksToEvents, hasFailed, generateFileHash, getTestName, hasFailedSnapshot, getTests, getSuites, getTasks, getFullName, interpretTaskModes } from '../task-utils.js';
import { Traces } from '../traces.js';
import { createDebug } from 'obug';
import { readFile, rm, writeFile, rename, stat, unlink, mkdir, readdir, copyFile } from 'node:fs/promises';
import module$1, { isBuiltin, builtinModules, createRequire } from 'node:module';
import url, { pathToFileURL, fileURLToPath } from 'node:url';
import { l as lookupPackageScopeType } from './resolver.NpfwMKt9.js';
import * as esModuleLexer from 'es-module-lexer';
import { ssrImportKey, ssrModuleExportsKey, ssrExportAllKey, ssrImportMetaKey, ModuleRunner } from 'vite/module-runner';
import { i as isWindows, a as isForceColor, b as isTTY } from './env.DzFJjrmK.js';
import path, { resolve as resolve$1 } from 'node:path';
import { y } from './tinyrainbow.Ht9iggcq.js';
import { glob, isDynamicPattern } from 'tinyglobby';
import { c as configDefaults, e as benchmarkConfigDefaults, a as coverageConfigDefaults } from './defaults.D2ip7f-X.js';
import MagicString from 'magic-string';
import { hoistMocksPlugin, automockPlugin } from '@vitest/mocker/node';
import { Console } from 'node:console';
import { Writable } from 'node:stream';
import { stripVTControlCharacters } from 'node:util';
import { i as inspect } from './display.pkpxlVcY.js';
import { x } from 'tinyexec';
import { p as positionToOffset, l as lineSplitRE } from './offset.Dy-5Fdfn.js';
import { e as errorBanner, F as F_POINTER, d as divider, t as truncateString, w as withLabel, f as formatProjectName, a as formatTimeString, b as taskFail, s as separator, c as F_CHECK, g as F_DOWN_RIGHT, h as getStateSymbol, r as renderSnapshotSummary, p as padSummaryTitle, i as getStateString$1, j as formatTime, k as countTestErrors, l as F_TREE_NODE_END, m as F_TREE_NODE_MIDDLE, n as noun, o as F_RIGHT } from './utils.CJ0JImL8.js';
import { VitestModuleEvaluator } from '#module-evaluator';
import pm from 'picomatch';
import { g as getCoverageFilesDirectory, r as resolveCoverageProviderModule } from './coverage.CX7NN5s7.js';
import { isAgent, isCI, provider } from 'std-env';
import process$1 from 'node:process';
import { isatty } from 'node:tty';
import EventEmitter$1, { EventEmitter } from 'node:events';
import { i as isBuiltin$1, t as toBuiltin } from './modules.BJuCwlRJ.js';
import { fork } from 'node:child_process';
import { Worker } from 'node:worker_threads';
import assert from 'node:assert';
import require$$0$4 from 'readline';

function _mergeNamespaces(n, m) {
  m.forEach(function (e) {
    e && typeof e !== 'string' && !Array.isArray(e) && Object.keys(e).forEach(function (k) {
      if (k !== 'default' && !(k in n)) {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  });
  return Object.freeze(n);
}

// port from nanoid
// https://github.com/ai/nanoid
const urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
function nanoid(size = 21) {
	let id = "";
	let i = size;
	while (i--) id += urlAlphabet[Math.random() * 64 | 0];
	return id;
}

class SnapshotManager {
	options;
	summary;
	extension = ".snap";
	constructor(options) {
		this.options = options;
		this.clear();
	}
	clear() {
		this.summary = emptySummary(this.options);
	}
	add(result) {
		addSnapshotResult(this.summary, result);
	}
	resolvePath(testPath, context) {
		return (this.options.resolveSnapshotPath || (() => {
			return join(join(dirname(testPath), "__snapshots__"), `${basename(testPath)}${this.extension}`);
		}))(testPath, this.extension, context);
	}
	resolveRawPath(testPath, rawPath) {
		return isAbsolute(rawPath) ? rawPath : resolve(dirname(testPath), rawPath);
	}
}
function emptySummary(options) {
	return {
		added: 0,
		failure: false,
		filesAdded: 0,
		filesRemoved: 0,
		filesRemovedList: [],
		filesUnmatched: 0,
		filesUpdated: 0,
		matched: 0,
		total: 0,
		unchecked: 0,
		uncheckedKeysByFile: [],
		unmatched: 0,
		updated: 0,
		didUpdate: options.updateSnapshot === "all"
	};
}
function addSnapshotResult(summary, result) {
	if (result.added) summary.filesAdded++;
	if (result.fileDeleted) summary.filesRemoved++;
	if (result.unmatched) summary.filesUnmatched++;
	if (result.updated) summary.filesUpdated++;
	summary.added += result.added;
	summary.matched += result.matched;
	summary.unchecked += result.unchecked;
	if (result.uncheckedKeys && result.uncheckedKeys.length > 0) summary.uncheckedKeysByFile.push({
		filePath: result.filepath,
		keys: result.uncheckedKeys
	});
	summary.unmatched += result.unmatched;
	summary.updated += result.updated;
	summary.total += result.added + result.matched + result.unmatched + result.updated;
}

/// <reference types="../types/index.d.ts" />

// (c) 2020-present Andrea Giammarchi

const {parse: $parse, stringify: $stringify} = JSON;
const {keys} = Object;

const Primitive = String;   // it could be Number
const primitive = 'string'; // it could be 'number'

const ignore$1 = {};
const object = 'object';

const noop = (_, value) => value;

const primitives = value => (
  value instanceof Primitive ? Primitive(value) : value
);

const Primitives = (_, value) => (
  typeof value === primitive ? new Primitive(value) : value
);

const resolver = (input, lazy, parsed, $) => output => {
  for (let ke = keys(output), {length} = ke, y = 0; y < length; y++) {
    const k = ke[y];
    const value = output[k];
    if (value instanceof Primitive) {
      const tmp = input[+value];
      if (typeof tmp === object && !parsed.has(tmp)) {
        parsed.add(tmp);
        output[k] = ignore$1;
        lazy.push({ o: output, k, r: tmp });
      }
      else
        output[k] = $.call(output, k, tmp);
    }
    else if (output[k] !== ignore$1)
      output[k] = $.call(output, k, value);
  }
  return output;
};

const set = (known, input, value) => {
  const index = Primitive(input.push(value) - 1);
  known.set(value, index);
  return index;
};

/**
 * Converts a specialized flatted string into a JS value.
 * @param {string} text
 * @param {(this: any, key: string, value: any) => any} [reviver]
 * @returns {any}
 */
const parse = (text, reviver) => {
  const input = $parse(text, Primitives).map(primitives);
  const $ = reviver || noop;

  let value = input[0];

  if (typeof value === object && value) {
    const lazy = [];
    const revive = resolver(input, lazy, new Set, $);
    value = revive(value);

    let i = 0;
    while (i < lazy.length) {
      // it could be a lazy.shift() but that's costly
      const {o, k, r} = lazy[i++];
      o[k] = $.call(o, k, revive(r));
    }
  }

  return $.call({'': value}, '', value);
};

/**
 * Converts a JS value into a specialized flatted string.
 * @param {any} value
 * @param {((this: any, key: string, value: any) => any) | (string | number)[] | null | undefined} [replacer]
 * @param {string | number | undefined} [space]
 * @returns {string}
 */
const stringify = (value, replacer, space) => {
  const $ = replacer && typeof replacer === object ?
            (k, v) => (k === '' || -1 < replacer.indexOf(k) ? v : void 0) :
            (replacer || noop);
  const known = new Map;
  const input = [];
  const output = [];
  let i = +set(known, input, $.call({'': value}, '', value));
  let firstRun = !i;
  while (i < input.length) {
    firstRun = true;
    output[i] = $stringify(input[i++], replace, space);
  }
  return '[' + output.join(',') + ']';
  function replace(key, value) {
    if (firstRun) {
      firstRun = !firstRun;
      return value;
    }
    const after = $.call(this, key, value);
    switch (typeof after) {
      case object:
        if (after === null) return after;
      case primitive:
        return known.get(after) || set(known, input, after);
    }
    return after;
  }
};

var bufferUtil = {exports: {}};

var constants;
var hasRequiredConstants;

function requireConstants () {
	if (hasRequiredConstants) return constants;
	hasRequiredConstants = 1;

	const BINARY_TYPES = ['nodebuffer', 'arraybuffer', 'fragments'];
	const hasBlob = typeof Blob !== 'undefined';

	if (hasBlob) BINARY_TYPES.push('blob');

	constants = {
	  BINARY_TYPES,
	  CLOSE_TIMEOUT: 30000,
	  EMPTY_BUFFER: Buffer.alloc(0),
	  GUID: '258EAFA5-E914-47DA-95CA-C5AB0DC85B11',
	  hasBlob,
	  kForOnEventAttribute: Symbol('kIsForOnEventAttribute'),
	  kListener: Symbol('kListener'),
	  kStatusCode: Symbol('status-code'),
	  kWebSocket: Symbol('websocket'),
	  NOOP: () => {}
	};
	return constants;
}

var hasRequiredBufferUtil;

function requireBufferUtil () {
	if (hasRequiredBufferUtil) return bufferUtil.exports;
	hasRequiredBufferUtil = 1;

	const { EMPTY_BUFFER } = requireConstants();

	const FastBuffer = Buffer[Symbol.species];

	/**
	 * Merges an array of buffers into a new buffer.
	 *
	 * @param {Buffer[]} list The array of buffers to concat
	 * @param {Number} totalLength The total length of buffers in the list
	 * @return {Buffer} The resulting buffer
	 * @public
	 */
	function concat(list, totalLength) {
	  if (list.length === 0) return EMPTY_BUFFER;
	  if (list.length === 1) return list[0];

	  const target = Buffer.allocUnsafe(totalLength);
	  let offset = 0;

	  for (let i = 0; i < list.length; i++) {
	    const buf = list[i];
	    target.set(buf, offset);
	    offset += buf.length;
	  }

	  if (offset < totalLength) {
	    return new FastBuffer(target.buffer, target.byteOffset, offset);
	  }

	  return target;
	}

	/**
	 * Masks a buffer using the given mask.
	 *
	 * @param {Buffer} source The buffer to mask
	 * @param {Buffer} mask The mask to use
	 * @param {Buffer} output The buffer where to store the result
	 * @param {Number} offset The offset at which to start writing
	 * @param {Number} length The number of bytes to mask.
	 * @public
	 */
	function _mask(source, mask, output, offset, length) {
	  for (let i = 0; i < length; i++) {
	    output[offset + i] = source[i] ^ mask[i & 3];
	  }
	}

	/**
	 * Unmasks a buffer using the given mask.
	 *
	 * @param {Buffer} buffer The buffer to unmask
	 * @param {Buffer} mask The mask to use
	 * @public
	 */
	function _unmask(buffer, mask) {
	  for (let i = 0; i < buffer.length; i++) {
	    buffer[i] ^= mask[i & 3];
	  }
	}

	/**
	 * Converts a buffer to an `ArrayBuffer`.
	 *
	 * @param {Buffer} buf The buffer to convert
	 * @return {ArrayBuffer} Converted buffer
	 * @public
	 */
	function toArrayBuffer(buf) {
	  if (buf.length === buf.buffer.byteLength) {
	    return buf.buffer;
	  }

	  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
	}

	/**
	 * Converts `data` to a `Buffer`.
	 *
	 * @param {*} data The data to convert
	 * @return {Buffer} The buffer
	 * @throws {TypeError}
	 * @public
	 */
	function toBuffer(data) {
	  toBuffer.readOnly = true;

	  if (Buffer.isBuffer(data)) return data;

	  let buf;

	  if (data instanceof ArrayBuffer) {
	    buf = new FastBuffer(data);
	  } else if (ArrayBuffer.isView(data)) {
	    buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
	  } else {
	    buf = Buffer.from(data);
	    toBuffer.readOnly = false;
	  }

	  return buf;
	}

	bufferUtil.exports = {
	  concat,
	  mask: _mask,
	  toArrayBuffer,
	  toBuffer,
	  unmask: _unmask
	};

	/* istanbul ignore else  */
	if (!process.env.WS_NO_BUFFER_UTIL) {
	  try {
	    const bufferUtil$1 = require('bufferutil');

	    bufferUtil.exports.mask = function (source, mask, output, offset, length) {
	      if (length < 48) _mask(source, mask, output, offset, length);
	      else bufferUtil$1.mask(source, mask, output, offset, length);
	    };

	    bufferUtil.exports.unmask = function (buffer, mask) {
	      if (buffer.length < 32) _unmask(buffer, mask);
	      else bufferUtil$1.unmask(buffer, mask);
	    };
	  } catch (e) {
	    // Continue regardless of the error.
	  }
	}
	return bufferUtil.exports;
}

var limiter;
var hasRequiredLimiter;

function requireLimiter () {
	if (hasRequiredLimiter) return limiter;
	hasRequiredLimiter = 1;

	const kDone = Symbol('kDone');
	const kRun = Symbol('kRun');

	/**
	 * A very simple job queue with adjustable concurrency. Adapted from
	 * https://github.com/STRML/async-limiter
	 */
	class Limiter {
	  /**
	   * Creates a new `Limiter`.
	   *
	   * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
	   *     to run concurrently
	   */
	  constructor(concurrency) {
	    this[kDone] = () => {
	      this.pending--;
	      this[kRun]();
	    };
	    this.concurrency = concurrency || Infinity;
	    this.jobs = [];
	    this.pending = 0;
	  }

	  /**
	   * Adds a job to the queue.
	   *
	   * @param {Function} job The job to run
	   * @public
	   */
	  add(job) {
	    this.jobs.push(job);
	    this[kRun]();
	  }

	  /**
	   * Removes a job from the queue and runs it if possible.
	   *
	   * @private
	   */
	  [kRun]() {
	    if (this.pending === this.concurrency) return;

	    if (this.jobs.length) {
	      const job = this.jobs.shift();

	      this.pending++;
	      job(this[kDone]);
	    }
	  }
	}

	limiter = Limiter;
	return limiter;
}

var permessageDeflate;
var hasRequiredPermessageDeflate;

function requirePermessageDeflate () {
	if (hasRequiredPermessageDeflate) return permessageDeflate;
	hasRequiredPermessageDeflate = 1;

	const zlib = require$$0;

	const bufferUtil = requireBufferUtil();
	const Limiter = requireLimiter();
	const { kStatusCode } = requireConstants();

	const FastBuffer = Buffer[Symbol.species];
	const TRAILER = Buffer.from([0x00, 0x00, 0xff, 0xff]);
	const kPerMessageDeflate = Symbol('permessage-deflate');
	const kTotalLength = Symbol('total-length');
	const kCallback = Symbol('callback');
	const kBuffers = Symbol('buffers');
	const kError = Symbol('error');

	//
	// We limit zlib concurrency, which prevents severe memory fragmentation
	// as documented in https://github.com/nodejs/node/issues/8871#issuecomment-250915913
	// and https://github.com/websockets/ws/issues/1202
	//
	// Intentionally global; it's the global thread pool that's an issue.
	//
	let zlibLimiter;

	/**
	 * permessage-deflate implementation.
	 */
	class PerMessageDeflate {
	  /**
	   * Creates a PerMessageDeflate instance.
	   *
	   * @param {Object} [options] Configuration options
	   * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
	   *     for, or request, a custom client window size
	   * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
	   *     acknowledge disabling of client context takeover
	   * @param {Number} [options.concurrencyLimit=10] The number of concurrent
	   *     calls to zlib
	   * @param {Boolean} [options.isServer=false] Create the instance in either
	   *     server or client mode
	   * @param {Number} [options.maxPayload=0] The maximum allowed message length
	   * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
	   *     use of a custom server window size
	   * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
	   *     disabling of server context takeover
	   * @param {Number} [options.threshold=1024] Size (in bytes) below which
	   *     messages should not be compressed if context takeover is disabled
	   * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
	   *     deflate
	   * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
	   *     inflate
	   */
	  constructor(options) {
	    this._options = options || {};
	    this._threshold =
	      this._options.threshold !== undefined ? this._options.threshold : 1024;
	    this._maxPayload = this._options.maxPayload | 0;
	    this._isServer = !!this._options.isServer;
	    this._deflate = null;
	    this._inflate = null;

	    this.params = null;

	    if (!zlibLimiter) {
	      const concurrency =
	        this._options.concurrencyLimit !== undefined
	          ? this._options.concurrencyLimit
	          : 10;
	      zlibLimiter = new Limiter(concurrency);
	    }
	  }

	  /**
	   * @type {String}
	   */
	  static get extensionName() {
	    return 'permessage-deflate';
	  }

	  /**
	   * Create an extension negotiation offer.
	   *
	   * @return {Object} Extension parameters
	   * @public
	   */
	  offer() {
	    const params = {};

	    if (this._options.serverNoContextTakeover) {
	      params.server_no_context_takeover = true;
	    }
	    if (this._options.clientNoContextTakeover) {
	      params.client_no_context_takeover = true;
	    }
	    if (this._options.serverMaxWindowBits) {
	      params.server_max_window_bits = this._options.serverMaxWindowBits;
	    }
	    if (this._options.clientMaxWindowBits) {
	      params.client_max_window_bits = this._options.clientMaxWindowBits;
	    } else if (this._options.clientMaxWindowBits == null) {
	      params.client_max_window_bits = true;
	    }

	    return params;
	  }

	  /**
	   * Accept an extension negotiation offer/response.
	   *
	   * @param {Array} configurations The extension negotiation offers/reponse
	   * @return {Object} Accepted configuration
	   * @public
	   */
	  accept(configurations) {
	    configurations = this.normalizeParams(configurations);

	    this.params = this._isServer
	      ? this.acceptAsServer(configurations)
	      : this.acceptAsClient(configurations);

	    return this.params;
	  }

	  /**
	   * Releases all resources used by the extension.
	   *
	   * @public
	   */
	  cleanup() {
	    if (this._inflate) {
	      this._inflate.close();
	      this._inflate = null;
	    }

	    if (this._deflate) {
	      const callback = this._deflate[kCallback];

	      this._deflate.close();
	      this._deflate = null;

	      if (callback) {
	        callback(
	          new Error(
	            'The deflate stream was closed while data was being processed'
	          )
	        );
	      }
	    }
	  }

	  /**
	   *  Accept an extension negotiation offer.
	   *
	   * @param {Array} offers The extension negotiation offers
	   * @return {Object} Accepted configuration
	   * @private
	   */
	  acceptAsServer(offers) {
	    const opts = this._options;
	    const accepted = offers.find((params) => {
	      if (
	        (opts.serverNoContextTakeover === false &&
	          params.server_no_context_takeover) ||
	        (params.server_max_window_bits &&
	          (opts.serverMaxWindowBits === false ||
	            (typeof opts.serverMaxWindowBits === 'number' &&
	              opts.serverMaxWindowBits > params.server_max_window_bits))) ||
	        (typeof opts.clientMaxWindowBits === 'number' &&
	          (typeof params.client_max_window_bits === 'number'
	            ? opts.clientMaxWindowBits > params.client_max_window_bits
	            : !params.client_max_window_bits))
	      ) {
	        return false;
	      }

	      return true;
	    });

	    if (!accepted) {
	      throw new Error('None of the extension offers can be accepted');
	    }

	    if (opts.serverNoContextTakeover) {
	      accepted.server_no_context_takeover = true;
	    }
	    if (opts.clientNoContextTakeover) {
	      accepted.client_no_context_takeover = true;
	    }
	    if (typeof opts.serverMaxWindowBits === 'number') {
	      accepted.server_max_window_bits = opts.serverMaxWindowBits;
	    }
	    if (typeof opts.clientMaxWindowBits === 'number') {
	      accepted.client_max_window_bits = opts.clientMaxWindowBits;
	    } else if (
	      accepted.client_max_window_bits === true ||
	      opts.clientMaxWindowBits === false
	    ) {
	      delete accepted.client_max_window_bits;
	    }

	    return accepted;
	  }

	  /**
	   * Accept the extension negotiation response.
	   *
	   * @param {Array} response The extension negotiation response
	   * @return {Object} Accepted configuration
	   * @private
	   */
	  acceptAsClient(response) {
	    const params = response[0];

	    if (
	      this._options.clientNoContextTakeover === false &&
	      params.client_no_context_takeover
	    ) {
	      throw new Error('Unexpected parameter "client_no_context_takeover"');
	    }

	    if (!params.client_max_window_bits) {
	      if (typeof this._options.clientMaxWindowBits === 'number') {
	        params.client_max_window_bits = this._options.clientMaxWindowBits;
	      }
	    } else if (
	      this._options.clientMaxWindowBits === false ||
	      (typeof this._options.clientMaxWindowBits === 'number' &&
	        params.client_max_window_bits > this._options.clientMaxWindowBits)
	    ) {
	      throw new Error(
	        'Unexpected or invalid parameter "client_max_window_bits"'
	      );
	    }

	    return params;
	  }

	  /**
	   * Normalize parameters.
	   *
	   * @param {Array} configurations The extension negotiation offers/reponse
	   * @return {Array} The offers/response with normalized parameters
	   * @private
	   */
	  normalizeParams(configurations) {
	    configurations.forEach((params) => {
	      Object.keys(params).forEach((key) => {
	        let value = params[key];

	        if (value.length > 1) {
	          throw new Error(`Parameter "${key}" must have only a single value`);
	        }

	        value = value[0];

	        if (key === 'client_max_window_bits') {
	          if (value !== true) {
	            const num = +value;
	            if (!Number.isInteger(num) || num < 8 || num > 15) {
	              throw new TypeError(
	                `Invalid value for parameter "${key}": ${value}`
	              );
	            }
	            value = num;
	          } else if (!this._isServer) {
	            throw new TypeError(
	              `Invalid value for parameter "${key}": ${value}`
	            );
	          }
	        } else if (key === 'server_max_window_bits') {
	          const num = +value;
	          if (!Number.isInteger(num) || num < 8 || num > 15) {
	            throw new TypeError(
	              `Invalid value for parameter "${key}": ${value}`
	            );
	          }
	          value = num;
	        } else if (
	          key === 'client_no_context_takeover' ||
	          key === 'server_no_context_takeover'
	        ) {
	          if (value !== true) {
	            throw new TypeError(
	              `Invalid value for parameter "${key}": ${value}`
	            );
	          }
	        } else {
	          throw new Error(`Unknown parameter "${key}"`);
	        }

	        params[key] = value;
	      });
	    });

	    return configurations;
	  }

	  /**
	   * Decompress data. Concurrency limited.
	   *
	   * @param {Buffer} data Compressed data
	   * @param {Boolean} fin Specifies whether or not this is the last fragment
	   * @param {Function} callback Callback
	   * @public
	   */
	  decompress(data, fin, callback) {
	    zlibLimiter.add((done) => {
	      this._decompress(data, fin, (err, result) => {
	        done();
	        callback(err, result);
	      });
	    });
	  }

	  /**
	   * Compress data. Concurrency limited.
	   *
	   * @param {(Buffer|String)} data Data to compress
	   * @param {Boolean} fin Specifies whether or not this is the last fragment
	   * @param {Function} callback Callback
	   * @public
	   */
	  compress(data, fin, callback) {
	    zlibLimiter.add((done) => {
	      this._compress(data, fin, (err, result) => {
	        done();
	        callback(err, result);
	      });
	    });
	  }

	  /**
	   * Decompress data.
	   *
	   * @param {Buffer} data Compressed data
	   * @param {Boolean} fin Specifies whether or not this is the last fragment
	   * @param {Function} callback Callback
	   * @private
	   */
	  _decompress(data, fin, callback) {
	    const endpoint = this._isServer ? 'client' : 'server';

	    if (!this._inflate) {
	      const key = `${endpoint}_max_window_bits`;
	      const windowBits =
	        typeof this.params[key] !== 'number'
	          ? zlib.Z_DEFAULT_WINDOWBITS
	          : this.params[key];

	      this._inflate = zlib.createInflateRaw({
	        ...this._options.zlibInflateOptions,
	        windowBits
	      });
	      this._inflate[kPerMessageDeflate] = this;
	      this._inflate[kTotalLength] = 0;
	      this._inflate[kBuffers] = [];
	      this._inflate.on('error', inflateOnError);
	      this._inflate.on('data', inflateOnData);
	    }

	    this._inflate[kCallback] = callback;

	    this._inflate.write(data);
	    if (fin) this._inflate.write(TRAILER);

	    this._inflate.flush(() => {
	      const err = this._inflate[kError];

	      if (err) {
	        this._inflate.close();
	        this._inflate = null;
	        callback(err);
	        return;
	      }

	      const data = bufferUtil.concat(
	        this._inflate[kBuffers],
	        this._inflate[kTotalLength]
	      );

	      if (this._inflate._readableState.endEmitted) {
	        this._inflate.close();
	        this._inflate = null;
	      } else {
	        this._inflate[kTotalLength] = 0;
	        this._inflate[kBuffers] = [];

	        if (fin && this.params[`${endpoint}_no_context_takeover`]) {
	          this._inflate.reset();
	        }
	      }

	      callback(null, data);
	    });
	  }

	  /**
	   * Compress data.
	   *
	   * @param {(Buffer|String)} data Data to compress
	   * @param {Boolean} fin Specifies whether or not this is the last fragment
	   * @param {Function} callback Callback
	   * @private
	   */
	  _compress(data, fin, callback) {
	    const endpoint = this._isServer ? 'server' : 'client';

	    if (!this._deflate) {
	      const key = `${endpoint}_max_window_bits`;
	      const windowBits =
	        typeof this.params[key] !== 'number'
	          ? zlib.Z_DEFAULT_WINDOWBITS
	          : this.params[key];

	      this._deflate = zlib.createDeflateRaw({
	        ...this._options.zlibDeflateOptions,
	        windowBits
	      });

	      this._deflate[kTotalLength] = 0;
	      this._deflate[kBuffers] = [];

	      this._deflate.on('data', deflateOnData);
	    }

	    this._deflate[kCallback] = callback;

	    this._deflate.write(data);
	    this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
	      if (!this._deflate) {
	        //
	        // The deflate stream was closed while data was being processed.
	        //
	        return;
	      }

	      let data = bufferUtil.concat(
	        this._deflate[kBuffers],
	        this._deflate[kTotalLength]
	      );

	      if (fin) {
	        data = new FastBuffer(data.buffer, data.byteOffset, data.length - 4);
	      }

	      //
	      // Ensure that the callback will not be called again in
	      // `PerMessageDeflate#cleanup()`.
	      //
	      this._deflate[kCallback] = null;

	      this._deflate[kTotalLength] = 0;
	      this._deflate[kBuffers] = [];

	      if (fin && this.params[`${endpoint}_no_context_takeover`]) {
	        this._deflate.reset();
	      }

	      callback(null, data);
	    });
	  }
	}

	permessageDeflate = PerMessageDeflate;

	/**
	 * The listener of the `zlib.DeflateRaw` stream `'data'` event.
	 *
	 * @param {Buffer} chunk A chunk of data
	 * @private
	 */
	function deflateOnData(chunk) {
	  this[kBuffers].push(chunk);
	  this[kTotalLength] += chunk.length;
	}

	/**
	 * The listener of the `zlib.InflateRaw` stream `'data'` event.
	 *
	 * @param {Buffer} chunk A chunk of data
	 * @private
	 */
	function inflateOnData(chunk) {
	  this[kTotalLength] += chunk.length;

	  if (
	    this[kPerMessageDeflate]._maxPayload < 1 ||
	    this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload
	  ) {
	    this[kBuffers].push(chunk);
	    return;
	  }

	  this[kError] = new RangeError('Max payload size exceeded');
	  this[kError].code = 'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH';
	  this[kError][kStatusCode] = 1009;
	  this.removeListener('data', inflateOnData);

	  //
	  // The choice to employ `zlib.reset()` over `zlib.close()` is dictated by the
	  // fact that in Node.js versions prior to 13.10.0, the callback for
	  // `zlib.flush()` is not called if `zlib.close()` is used. Utilizing
	  // `zlib.reset()` ensures that either the callback is invoked or an error is
	  // emitted.
	  //
	  this.reset();
	}

	/**
	 * The listener of the `zlib.InflateRaw` stream `'error'` event.
	 *
	 * @param {Error} err The emitted error
	 * @private
	 */
	function inflateOnError(err) {
	  //
	  // There is no need to call `Zlib#close()` as the handle is automatically
	  // closed when an error is emitted.
	  //
	  this[kPerMessageDeflate]._inflate = null;

	  if (this[kError]) {
	    this[kCallback](this[kError]);
	    return;
	  }

	  err[kStatusCode] = 1007;
	  this[kCallback](err);
	}
	return permessageDeflate;
}

var validation = {exports: {}};

var hasRequiredValidation;

function requireValidation () {
	if (hasRequiredValidation) return validation.exports;
	hasRequiredValidation = 1;

	const { isUtf8 } = require$$0$1;

	const { hasBlob } = requireConstants();

	//
	// Allowed token characters:
	//
	// '!', '#', '$', '%', '&', ''', '*', '+', '-',
	// '.', 0-9, A-Z, '^', '_', '`', a-z, '|', '~'
	//
	// tokenChars[32] === 0 // ' '
	// tokenChars[33] === 1 // '!'
	// tokenChars[34] === 0 // '"'
	// ...
	//
	// prettier-ignore
	const tokenChars = [
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0 - 15
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 16 - 31
	  0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, // 32 - 47
	  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, // 48 - 63
	  0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 64 - 79
	  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, // 80 - 95
	  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 96 - 111
	  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0 // 112 - 127
	];

	/**
	 * Checks if a status code is allowed in a close frame.
	 *
	 * @param {Number} code The status code
	 * @return {Boolean} `true` if the status code is valid, else `false`
	 * @public
	 */
	function isValidStatusCode(code) {
	  return (
	    (code >= 1000 &&
	      code <= 1014 &&
	      code !== 1004 &&
	      code !== 1005 &&
	      code !== 1006) ||
	    (code >= 3000 && code <= 4999)
	  );
	}

	/**
	 * Checks if a given buffer contains only correct UTF-8.
	 * Ported from https://www.cl.cam.ac.uk/%7Emgk25/ucs/utf8_check.c by
	 * Markus Kuhn.
	 *
	 * @param {Buffer} buf The buffer to check
	 * @return {Boolean} `true` if `buf` contains only correct UTF-8, else `false`
	 * @public
	 */
	function _isValidUTF8(buf) {
	  const len = buf.length;
	  let i = 0;

	  while (i < len) {
	    if ((buf[i] & 0x80) === 0) {
	      // 0xxxxxxx
	      i++;
	    } else if ((buf[i] & 0xe0) === 0xc0) {
	      // 110xxxxx 10xxxxxx
	      if (
	        i + 1 === len ||
	        (buf[i + 1] & 0xc0) !== 0x80 ||
	        (buf[i] & 0xfe) === 0xc0 // Overlong
	      ) {
	        return false;
	      }

	      i += 2;
	    } else if ((buf[i] & 0xf0) === 0xe0) {
	      // 1110xxxx 10xxxxxx 10xxxxxx
	      if (
	        i + 2 >= len ||
	        (buf[i + 1] & 0xc0) !== 0x80 ||
	        (buf[i + 2] & 0xc0) !== 0x80 ||
	        (buf[i] === 0xe0 && (buf[i + 1] & 0xe0) === 0x80) || // Overlong
	        (buf[i] === 0xed && (buf[i + 1] & 0xe0) === 0xa0) // Surrogate (U+D800 - U+DFFF)
	      ) {
	        return false;
	      }

	      i += 3;
	    } else if ((buf[i] & 0xf8) === 0xf0) {
	      // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
	      if (
	        i + 3 >= len ||
	        (buf[i + 1] & 0xc0) !== 0x80 ||
	        (buf[i + 2] & 0xc0) !== 0x80 ||
	        (buf[i + 3] & 0xc0) !== 0x80 ||
	        (buf[i] === 0xf0 && (buf[i + 1] & 0xf0) === 0x80) || // Overlong
	        (buf[i] === 0xf4 && buf[i + 1] > 0x8f) ||
	        buf[i] > 0xf4 // > U+10FFFF
	      ) {
	        return false;
	      }

	      i += 4;
	    } else {
	      return false;
	    }
	  }

	  return true;
	}

	/**
	 * Determines whether a value is a `Blob`.
	 *
	 * @param {*} value The value to be tested
	 * @return {Boolean} `true` if `value` is a `Blob`, else `false`
	 * @private
	 */
	function isBlob(value) {
	  return (
	    hasBlob &&
	    typeof value === 'object' &&
	    typeof value.arrayBuffer === 'function' &&
	    typeof value.type === 'string' &&
	    typeof value.stream === 'function' &&
	    (value[Symbol.toStringTag] === 'Blob' ||
	      value[Symbol.toStringTag] === 'File')
	  );
	}

	validation.exports = {
	  isBlob,
	  isValidStatusCode,
	  isValidUTF8: _isValidUTF8,
	  tokenChars
	};

	if (isUtf8) {
	  validation.exports.isValidUTF8 = function (buf) {
	    return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
	  };
	} /* istanbul ignore else  */ else if (!process.env.WS_NO_UTF_8_VALIDATE) {
	  try {
	    const isValidUTF8 = require('utf-8-validate');

	    validation.exports.isValidUTF8 = function (buf) {
	      return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
	    };
	  } catch (e) {
	    // Continue regardless of the error.
	  }
	}
	return validation.exports;
}

var receiver;
var hasRequiredReceiver;

function requireReceiver () {
	if (hasRequiredReceiver) return receiver;
	hasRequiredReceiver = 1;

	const { Writable } = require$$0$2;

	const PerMessageDeflate = requirePermessageDeflate();
	const {
	  BINARY_TYPES,
	  EMPTY_BUFFER,
	  kStatusCode,
	  kWebSocket
	} = requireConstants();
	const { concat, toArrayBuffer, unmask } = requireBufferUtil();
	const { isValidStatusCode, isValidUTF8 } = requireValidation();

	const FastBuffer = Buffer[Symbol.species];

	const GET_INFO = 0;
	const GET_PAYLOAD_LENGTH_16 = 1;
	const GET_PAYLOAD_LENGTH_64 = 2;
	const GET_MASK = 3;
	const GET_DATA = 4;
	const INFLATING = 5;
	const DEFER_EVENT = 6;

	/**
	 * HyBi Receiver implementation.
	 *
	 * @extends Writable
	 */
	class Receiver extends Writable {
	  /**
	   * Creates a Receiver instance.
	   *
	   * @param {Object} [options] Options object
	   * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
	   *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
	   *     multiple times in the same tick
	   * @param {String} [options.binaryType=nodebuffer] The type for binary data
	   * @param {Object} [options.extensions] An object containing the negotiated
	   *     extensions
	   * @param {Boolean} [options.isServer=false] Specifies whether to operate in
	   *     client or server mode
	   * @param {Number} [options.maxBufferedChunks=0] The maximum number of
	   *     buffered data chunks
	   * @param {Number} [options.maxFragments=0] The maximum number of message
	   *     fragments
	   * @param {Number} [options.maxPayload=0] The maximum allowed message length
	   * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
	   *     not to skip UTF-8 validation for text and close messages
	   */
	  constructor(options = {}) {
	    super();

	    this._allowSynchronousEvents =
	      options.allowSynchronousEvents !== undefined
	        ? options.allowSynchronousEvents
	        : true;
	    this._binaryType = options.binaryType || BINARY_TYPES[0];
	    this._extensions = options.extensions || {};
	    this._isServer = !!options.isServer;
	    this._maxBufferedChunks = options.maxBufferedChunks | 0;
	    this._maxFragments = options.maxFragments | 0;
	    this._maxPayload = options.maxPayload | 0;
	    this._skipUTF8Validation = !!options.skipUTF8Validation;
	    this[kWebSocket] = undefined;

	    this._bufferedBytes = 0;
	    this._buffers = [];

	    this._compressed = false;
	    this._payloadLength = 0;
	    this._mask = undefined;
	    this._fragmented = 0;
	    this._masked = false;
	    this._fin = false;
	    this._opcode = 0;

	    this._totalPayloadLength = 0;
	    this._messageLength = 0;
	    this._numFragments = 0;
	    this._fragments = [];

	    this._errored = false;
	    this._loop = false;
	    this._state = GET_INFO;
	  }

	  /**
	   * Implements `Writable.prototype._write()`.
	   *
	   * @param {Buffer} chunk The chunk of data to write
	   * @param {String} encoding The character encoding of `chunk`
	   * @param {Function} cb Callback
	   * @private
	   */
	  _write(chunk, encoding, cb) {
	    if (this._opcode === 0x08 && this._state == GET_INFO) return cb();

	    if (
	      this._maxBufferedChunks > 0 &&
	      this._buffers.length >= this._maxBufferedChunks
	    ) {
	      cb(
	        this.createError(
	          RangeError,
	          'Too many buffered chunks',
	          false,
	          1008,
	          'WS_ERR_TOO_MANY_BUFFERED_PARTS'
	        )
	      );
	      return;
	    }

	    this._bufferedBytes += chunk.length;
	    this._buffers.push(chunk);
	    this.startLoop(cb);
	  }

	  /**
	   * Consumes `n` bytes from the buffered data.
	   *
	   * @param {Number} n The number of bytes to consume
	   * @return {Buffer} The consumed bytes
	   * @private
	   */
	  consume(n) {
	    this._bufferedBytes -= n;

	    if (n === this._buffers[0].length) return this._buffers.shift();

	    if (n < this._buffers[0].length) {
	      const buf = this._buffers[0];
	      this._buffers[0] = new FastBuffer(
	        buf.buffer,
	        buf.byteOffset + n,
	        buf.length - n
	      );

	      return new FastBuffer(buf.buffer, buf.byteOffset, n);
	    }

	    const dst = Buffer.allocUnsafe(n);

	    do {
	      const buf = this._buffers[0];
	      const offset = dst.length - n;

	      if (n >= buf.length) {
	        dst.set(this._buffers.shift(), offset);
	      } else {
	        dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
	        this._buffers[0] = new FastBuffer(
	          buf.buffer,
	          buf.byteOffset + n,
	          buf.length - n
	        );
	      }

	      n -= buf.length;
	    } while (n > 0);

	    return dst;
	  }

	  /**
	   * Starts the parsing loop.
	   *
	   * @param {Function} cb Callback
	   * @private
	   */
	  startLoop(cb) {
	    this._loop = true;

	    do {
	      switch (this._state) {
	        case GET_INFO:
	          this.getInfo(cb);
	          break;
	        case GET_PAYLOAD_LENGTH_16:
	          this.getPayloadLength16(cb);
	          break;
	        case GET_PAYLOAD_LENGTH_64:
	          this.getPayloadLength64(cb);
	          break;
	        case GET_MASK:
	          this.getMask();
	          break;
	        case GET_DATA:
	          this.getData(cb);
	          break;
	        case INFLATING:
	        case DEFER_EVENT:
	          this._loop = false;
	          return;
	      }
	    } while (this._loop);

	    if (!this._errored) cb();
	  }

	  /**
	   * Reads the first two bytes of a frame.
	   *
	   * @param {Function} cb Callback
	   * @private
	   */
	  getInfo(cb) {
	    if (this._bufferedBytes < 2) {
	      this._loop = false;
	      return;
	    }

	    const buf = this.consume(2);

	    if ((buf[0] & 0x30) !== 0x00) {
	      const error = this.createError(
	        RangeError,
	        'RSV2 and RSV3 must be clear',
	        true,
	        1002,
	        'WS_ERR_UNEXPECTED_RSV_2_3'
	      );

	      cb(error);
	      return;
	    }

	    const compressed = (buf[0] & 0x40) === 0x40;

	    if (compressed && !this._extensions[PerMessageDeflate.extensionName]) {
	      const error = this.createError(
	        RangeError,
	        'RSV1 must be clear',
	        true,
	        1002,
	        'WS_ERR_UNEXPECTED_RSV_1'
	      );

	      cb(error);
	      return;
	    }

	    this._fin = (buf[0] & 0x80) === 0x80;
	    this._opcode = buf[0] & 0x0f;
	    this._payloadLength = buf[1] & 0x7f;

	    if (this._opcode === 0x00) {
	      if (compressed) {
	        const error = this.createError(
	          RangeError,
	          'RSV1 must be clear',
	          true,
	          1002,
	          'WS_ERR_UNEXPECTED_RSV_1'
	        );

	        cb(error);
	        return;
	      }

	      if (!this._fragmented) {
	        const error = this.createError(
	          RangeError,
	          'invalid opcode 0',
	          true,
	          1002,
	          'WS_ERR_INVALID_OPCODE'
	        );

	        cb(error);
	        return;
	      }

	      this._opcode = this._fragmented;
	    } else if (this._opcode === 0x01 || this._opcode === 0x02) {
	      if (this._fragmented) {
	        const error = this.createError(
	          RangeError,
	          `invalid opcode ${this._opcode}`,
	          true,
	          1002,
	          'WS_ERR_INVALID_OPCODE'
	        );

	        cb(error);
	        return;
	      }

	      this._compressed = compressed;
	    } else if (this._opcode > 0x07 && this._opcode < 0x0b) {
	      if (!this._fin) {
	        const error = this.createError(
	          RangeError,
	          'FIN must be set',
	          true,
	          1002,
	          'WS_ERR_EXPECTED_FIN'
	        );

	        cb(error);
	        return;
	      }

	      if (compressed) {
	        const error = this.createError(
	          RangeError,
	          'RSV1 must be clear',
	          true,
	          1002,
	          'WS_ERR_UNEXPECTED_RSV_1'
	        );

	        cb(error);
	        return;
	      }

	      if (
	        this._payloadLength > 0x7d ||
	        (this._opcode === 0x08 && this._payloadLength === 1)
	      ) {
	        const error = this.createError(
	          RangeError,
	          `invalid payload length ${this._payloadLength}`,
	          true,
	          1002,
	          'WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH'
	        );

	        cb(error);
	        return;
	      }
	    } else {
	      const error = this.createError(
	        RangeError,
	        `invalid opcode ${this._opcode}`,
	        true,
	        1002,
	        'WS_ERR_INVALID_OPCODE'
	      );

	      cb(error);
	      return;
	    }

	    if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
	    this._masked = (buf[1] & 0x80) === 0x80;

	    if (this._isServer) {
	      if (!this._masked) {
	        const error = this.createError(
	          RangeError,
	          'MASK must be set',
	          true,
	          1002,
	          'WS_ERR_EXPECTED_MASK'
	        );

	        cb(error);
	        return;
	      }
	    } else if (this._masked) {
	      const error = this.createError(
	        RangeError,
	        'MASK must be clear',
	        true,
	        1002,
	        'WS_ERR_UNEXPECTED_MASK'
	      );

	      cb(error);
	      return;
	    }

	    if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
	    else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
	    else this.haveLength(cb);
	  }

	  /**
	   * Gets extended payload length (7+16).
	   *
	   * @param {Function} cb Callback
	   * @private
	   */
	  getPayloadLength16(cb) {
	    if (this._bufferedBytes < 2) {
	      this._loop = false;
	      return;
	    }

	    this._payloadLength = this.consume(2).readUInt16BE(0);
	    this.haveLength(cb);
	  }

	  /**
	   * Gets extended payload length (7+64).
	   *
	   * @param {Function} cb Callback
	   * @private
	   */
	  getPayloadLength64(cb) {
	    if (this._bufferedBytes < 8) {
	      this._loop = false;
	      return;
	    }

	    const buf = this.consume(8);
	    const num = buf.readUInt32BE(0);

	    //
	    // The maximum safe integer in JavaScript is 2^53 - 1. An error is returned
	    // if payload length is greater than this number.
	    //
	    if (num > Math.pow(2, 53 - 32) - 1) {
	      const error = this.createError(
	        RangeError,
	        'Unsupported WebSocket frame: payload length > 2^53 - 1',
	        false,
	        1009,
	        'WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH'
	      );

	      cb(error);
	      return;
	    }

	    this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
	    this.haveLength(cb);
	  }

	  /**
	   * Payload length has been read.
	   *
	   * @param {Function} cb Callback
	   * @private
	   */
	  haveLength(cb) {
	    if (this._payloadLength && this._opcode < 0x08) {
	      this._totalPayloadLength += this._payloadLength;
	      if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
	        const error = this.createError(
	          RangeError,
	          'Max payload size exceeded',
	          false,
	          1009,
	          'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH'
	        );

	        cb(error);
	        return;
	      }
	    }

	    if (this._masked) this._state = GET_MASK;
	    else this._state = GET_DATA;
	  }

	  /**
	   * Reads mask bytes.
	   *
	   * @private
	   */
	  getMask() {
	    if (this._bufferedBytes < 4) {
	      this._loop = false;
	      return;
	    }

	    this._mask = this.consume(4);
	    this._state = GET_DATA;
	  }

	  /**
	   * Reads data bytes.
	   *
	   * @param {Function} cb Callback
	   * @private
	   */
	  getData(cb) {
	    let data = EMPTY_BUFFER;

	    if (this._payloadLength) {
	      if (this._bufferedBytes < this._payloadLength) {
	        this._loop = false;
	        return;
	      }

	      data = this.consume(this._payloadLength);

	      if (
	        this._masked &&
	        (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0
	      ) {
	        unmask(data, this._mask);
	      }
	    }

	    if (this._opcode > 0x07) {
	      this.controlMessage(data, cb);
	      return;
	    }

	    if (this._maxFragments > 0 && ++this._numFragments > this._maxFragments) {
	      const error = this.createError(
	        RangeError,
	        'Too many message fragments',
	        false,
	        1008,
	        'WS_ERR_TOO_MANY_BUFFERED_PARTS'
	      );

	      cb(error);
	      return;
	    }

	    if (this._compressed) {
	      this._state = INFLATING;
	      this.decompress(data, cb);
	      return;
	    }

	    if (data.length) {
	      //
	      // This message is not compressed so its length is the sum of the payload
	      // length of all fragments.
	      //
	      this._messageLength = this._totalPayloadLength;
	      this._fragments.push(data);
	    }

	    this.dataMessage(cb);
	  }

	  /**
	   * Decompresses data.
	   *
	   * @param {Buffer} data Compressed data
	   * @param {Function} cb Callback
	   * @private
	   */
	  decompress(data, cb) {
	    const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];

	    perMessageDeflate.decompress(data, this._fin, (err, buf) => {
	      if (err) return cb(err);

	      if (buf.length) {
	        this._messageLength += buf.length;
	        if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
	          const error = this.createError(
	            RangeError,
	            'Max payload size exceeded',
	            false,
	            1009,
	            'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH'
	          );

	          cb(error);
	          return;
	        }

	        this._fragments.push(buf);
	      }

	      this.dataMessage(cb);
	      if (this._state === GET_INFO) this.startLoop(cb);
	    });
	  }

	  /**
	   * Handles a data message.
	   *
	   * @param {Function} cb Callback
	   * @private
	   */
	  dataMessage(cb) {
	    if (!this._fin) {
	      this._state = GET_INFO;
	      return;
	    }

	    const messageLength = this._messageLength;
	    const fragments = this._fragments;

	    this._totalPayloadLength = 0;
	    this._messageLength = 0;
	    this._fragmented = 0;
	    this._numFragments = 0;
	    this._fragments = [];

	    if (this._opcode === 2) {
	      let data;

	      if (this._binaryType === 'nodebuffer') {
	        data = concat(fragments, messageLength);
	      } else if (this._binaryType === 'arraybuffer') {
	        data = toArrayBuffer(concat(fragments, messageLength));
	      } else if (this._binaryType === 'blob') {
	        data = new Blob(fragments);
	      } else {
	        data = fragments;
	      }

	      if (this._allowSynchronousEvents) {
	        this.emit('message', data, true);
	        this._state = GET_INFO;
	      } else {
	        this._state = DEFER_EVENT;
	        setImmediate(() => {
	          this.emit('message', data, true);
	          this._state = GET_INFO;
	          this.startLoop(cb);
	        });
	      }
	    } else {
	      const buf = concat(fragments, messageLength);

	      if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
	        const error = this.createError(
	          Error,
	          'invalid UTF-8 sequence',
	          true,
	          1007,
	          'WS_ERR_INVALID_UTF8'
	        );

	        cb(error);
	        return;
	      }

	      if (this._state === INFLATING || this._allowSynchronousEvents) {
	        this.emit('message', buf, false);
	        this._state = GET_INFO;
	      } else {
	        this._state = DEFER_EVENT;
	        setImmediate(() => {
	          this.emit('message', buf, false);
	          this._state = GET_INFO;
	          this.startLoop(cb);
	        });
	      }
	    }
	  }

	  /**
	   * Handles a control message.
	   *
	   * @param {Buffer} data Data to handle
	   * @return {(Error|RangeError|undefined)} A possible error
	   * @private
	   */
	  controlMessage(data, cb) {
	    if (this._opcode === 0x08) {
	      if (data.length === 0) {
	        this._loop = false;
	        this.emit('conclude', 1005, EMPTY_BUFFER);
	        this.end();
	      } else {
	        const code = data.readUInt16BE(0);

	        if (!isValidStatusCode(code)) {
	          const error = this.createError(
	            RangeError,
	            `invalid status code ${code}`,
	            true,
	            1002,
	            'WS_ERR_INVALID_CLOSE_CODE'
	          );

	          cb(error);
	          return;
	        }

	        const buf = new FastBuffer(
	          data.buffer,
	          data.byteOffset + 2,
	          data.length - 2
	        );

	        if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
	          const error = this.createError(
	            Error,
	            'invalid UTF-8 sequence',
	            true,
	            1007,
	            'WS_ERR_INVALID_UTF8'
	          );

	          cb(error);
	          return;
	        }

	        this._loop = false;
	        this.emit('conclude', code, buf);
	        this.end();
	      }

	      this._state = GET_INFO;
	      return;
	    }

	    if (this._allowSynchronousEvents) {
	      this.emit(this._opcode === 0x09 ? 'ping' : 'pong', data);
	      this._state = GET_INFO;
	    } else {
	      this._state = DEFER_EVENT;
	      setImmediate(() => {
	        this.emit(this._opcode === 0x09 ? 'ping' : 'pong', data);
	        this._state = GET_INFO;
	        this.startLoop(cb);
	      });
	    }
	  }

	  /**
	   * Builds an error object.
	   *
	   * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
	   * @param {String} message The error message
	   * @param {Boolean} prefix Specifies whether or not to add a default prefix to
	   *     `message`
	   * @param {Number} statusCode The status code
	   * @param {String} errorCode The exposed error code
	   * @return {(Error|RangeError)} The error
	   * @private
	   */
	  createError(ErrorCtor, message, prefix, statusCode, errorCode) {
	    this._loop = false;
	    this._errored = true;

	    const err = new ErrorCtor(
	      prefix ? `Invalid WebSocket frame: ${message}` : message
	    );

	    Error.captureStackTrace(err, this.createError);
	    err.code = errorCode;
	    err[kStatusCode] = statusCode;
	    return err;
	  }
	}

	receiver = Receiver;
	return receiver;
}

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^Duplex" }] */

var sender;
var hasRequiredSender;

function requireSender () {
	if (hasRequiredSender) return sender;
	hasRequiredSender = 1;

	const { Duplex } = require$$0$2;
	const { randomFillSync } = require$$1;
	const {
	  types: { isUint8Array }
	} = require$$2;

	const PerMessageDeflate = requirePermessageDeflate();
	const { EMPTY_BUFFER, kWebSocket, NOOP } = requireConstants();
	const { isBlob, isValidStatusCode } = requireValidation();
	const { mask: applyMask, toBuffer } = requireBufferUtil();

	const kByteLength = Symbol('kByteLength');
	const maskBuffer = Buffer.alloc(4);
	const RANDOM_POOL_SIZE = 8 * 1024;
	let randomPool;
	let randomPoolPointer = RANDOM_POOL_SIZE;

	const DEFAULT = 0;
	const DEFLATING = 1;
	const GET_BLOB_DATA = 2;

	/**
	 * HyBi Sender implementation.
	 */
	class Sender {
	  /**
	   * Creates a Sender instance.
	   *
	   * @param {Duplex} socket The connection socket
	   * @param {Object} [extensions] An object containing the negotiated extensions
	   * @param {Function} [generateMask] The function used to generate the masking
	   *     key
	   */
	  constructor(socket, extensions, generateMask) {
	    this._extensions = extensions || {};

	    if (generateMask) {
	      this._generateMask = generateMask;
	      this._maskBuffer = Buffer.alloc(4);
	    }

	    this._socket = socket;

	    this._firstFragment = true;
	    this._compress = false;

	    this._bufferedBytes = 0;
	    this._queue = [];
	    this._state = DEFAULT;
	    this.onerror = NOOP;
	    this[kWebSocket] = undefined;
	  }

	  /**
	   * Frames a piece of data according to the HyBi WebSocket protocol.
	   *
	   * @param {(Buffer|String)} data The data to frame
	   * @param {Object} options Options object
	   * @param {Boolean} [options.fin=false] Specifies whether or not to set the
	   *     FIN bit
	   * @param {Function} [options.generateMask] The function used to generate the
	   *     masking key
	   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
	   *     `data`
	   * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
	   *     key
	   * @param {Number} options.opcode The opcode
	   * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
	   *     modified
	   * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
	   *     RSV1 bit
	   * @return {(Buffer|String)[]} The framed data
	   * @public
	   */
	  static frame(data, options) {
	    let mask;
	    let merge = false;
	    let offset = 2;
	    let skipMasking = false;

	    if (options.mask) {
	      mask = options.maskBuffer || maskBuffer;

	      if (options.generateMask) {
	        options.generateMask(mask);
	      } else {
	        if (randomPoolPointer === RANDOM_POOL_SIZE) {
	          /* istanbul ignore else  */
	          if (randomPool === undefined) {
	            //
	            // This is lazily initialized because server-sent frames must not
	            // be masked so it may never be used.
	            //
	            randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
	          }

	          randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
	          randomPoolPointer = 0;
	        }

	        mask[0] = randomPool[randomPoolPointer++];
	        mask[1] = randomPool[randomPoolPointer++];
	        mask[2] = randomPool[randomPoolPointer++];
	        mask[3] = randomPool[randomPoolPointer++];
	      }

	      skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
	      offset = 6;
	    }

	    let dataLength;

	    if (typeof data === 'string') {
	      if (
	        (!options.mask || skipMasking) &&
	        options[kByteLength] !== undefined
	      ) {
	        dataLength = options[kByteLength];
	      } else {
	        data = Buffer.from(data);
	        dataLength = data.length;
	      }
	    } else {
	      dataLength = data.length;
	      merge = options.mask && options.readOnly && !skipMasking;
	    }

	    let payloadLength = dataLength;

	    if (dataLength >= 65536) {
	      offset += 8;
	      payloadLength = 127;
	    } else if (dataLength > 125) {
	      offset += 2;
	      payloadLength = 126;
	    }

	    const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);

	    target[0] = options.fin ? options.opcode | 0x80 : options.opcode;
	    if (options.rsv1) target[0] |= 0x40;

	    target[1] = payloadLength;

	    if (payloadLength === 126) {
	      target.writeUInt16BE(dataLength, 2);
	    } else if (payloadLength === 127) {
	      target[2] = target[3] = 0;
	      target.writeUIntBE(dataLength, 4, 6);
	    }

	    if (!options.mask) return [target, data];

	    target[1] |= 0x80;
	    target[offset - 4] = mask[0];
	    target[offset - 3] = mask[1];
	    target[offset - 2] = mask[2];
	    target[offset - 1] = mask[3];

	    if (skipMasking) return [target, data];

	    if (merge) {
	      applyMask(data, mask, target, offset, dataLength);
	      return [target];
	    }

	    applyMask(data, mask, data, 0, dataLength);
	    return [target, data];
	  }

	  /**
	   * Sends a close message to the other peer.
	   *
	   * @param {Number} [code] The status code component of the body
	   * @param {(String|Buffer)} [data] The message component of the body
	   * @param {Boolean} [mask=false] Specifies whether or not to mask the message
	   * @param {Function} [cb] Callback
	   * @public
	   */
	  close(code, data, mask, cb) {
	    let buf;

	    if (code === undefined) {
	      buf = EMPTY_BUFFER;
	    } else if (typeof code !== 'number' || !isValidStatusCode(code)) {
	      throw new TypeError('First argument must be a valid error code number');
	    } else if (data === undefined || !data.length) {
	      buf = Buffer.allocUnsafe(2);
	      buf.writeUInt16BE(code, 0);
	    } else {
	      const length = Buffer.byteLength(data);

	      if (length > 123) {
	        throw new RangeError('The message must not be greater than 123 bytes');
	      }

	      buf = Buffer.allocUnsafe(2 + length);
	      buf.writeUInt16BE(code, 0);

	      if (typeof data === 'string') {
	        buf.write(data, 2);
	      } else if (isUint8Array(data)) {
	        buf.set(data, 2);
	      } else {
	        throw new TypeError('Second argument must be a string or a Uint8Array');
	      }
	    }

	    const options = {
	      [kByteLength]: buf.length,
	      fin: true,
	      generateMask: this._generateMask,
	      mask,
	      maskBuffer: this._maskBuffer,
	      opcode: 0x08,
	      readOnly: false,
	      rsv1: false
	    };

	    if (this._state !== DEFAULT) {
	      this.enqueue([this.dispatch, buf, false, options, cb]);
	    } else {
	      this.sendFrame(Sender.frame(buf, options), cb);
	    }
	  }

	  /**
	   * Sends a ping message to the other peer.
	   *
	   * @param {*} data The message to send
	   * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
	   * @param {Function} [cb] Callback
	   * @public
	   */
	  ping(data, mask, cb) {
	    let byteLength;
	    let readOnly;

	    if (typeof data === 'string') {
	      byteLength = Buffer.byteLength(data);
	      readOnly = false;
	    } else if (isBlob(data)) {
	      byteLength = data.size;
	      readOnly = false;
	    } else {
	      data = toBuffer(data);
	      byteLength = data.length;
	      readOnly = toBuffer.readOnly;
	    }

	    if (byteLength > 125) {
	      throw new RangeError('The data size must not be greater than 125 bytes');
	    }

	    const options = {
	      [kByteLength]: byteLength,
	      fin: true,
	      generateMask: this._generateMask,
	      mask,
	      maskBuffer: this._maskBuffer,
	      opcode: 0x09,
	      readOnly,
	      rsv1: false
	    };

	    if (isBlob(data)) {
	      if (this._state !== DEFAULT) {
	        this.enqueue([this.getBlobData, data, false, options, cb]);
	      } else {
	        this.getBlobData(data, false, options, cb);
	      }
	    } else if (this._state !== DEFAULT) {
	      this.enqueue([this.dispatch, data, false, options, cb]);
	    } else {
	      this.sendFrame(Sender.frame(data, options), cb);
	    }
	  }

	  /**
	   * Sends a pong message to the other peer.
	   *
	   * @param {*} data The message to send
	   * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
	   * @param {Function} [cb] Callback
	   * @public
	   */
	  pong(data, mask, cb) {
	    let byteLength;
	    let readOnly;

	    if (typeof data === 'string') {
	      byteLength = Buffer.byteLength(data);
	      readOnly = false;
	    } else if (isBlob(data)) {
	      byteLength = data.size;
	      readOnly = false;
	    } else {
	      data = toBuffer(data);
	      byteLength = data.length;
	      readOnly = toBuffer.readOnly;
	    }

	    if (byteLength > 125) {
	      throw new RangeError('The data size must not be greater than 125 bytes');
	    }

	    const options = {
	      [kByteLength]: byteLength,
	      fin: true,
	      generateMask: this._generateMask,
	      mask,
	      maskBuffer: this._maskBuffer,
	      opcode: 0x0a,
	      readOnly,
	      rsv1: false
	    };

	    if (isBlob(data)) {
	      if (this._state !== DEFAULT) {
	        this.enqueue([this.getBlobData, data, false, options, cb]);
	      } else {
	        this.getBlobData(data, false, options, cb);
	      }
	    } else if (this._state !== DEFAULT) {
	      this.enqueue([this.dispatch, data, false, options, cb]);
	    } else {
	      this.sendFrame(Sender.frame(data, options), cb);
	    }
	  }

	  /**
	   * Sends a data message to the other peer.
	   *
	   * @param {*} data The message to send
	   * @param {Object} options Options object
	   * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
	   *     or text
	   * @param {Boolean} [options.compress=false] Specifies whether or not to
	   *     compress `data`
	   * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
	   *     last one
	   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
	   *     `data`
	   * @param {Function} [cb] Callback
	   * @public
	   */
	  send(data, options, cb) {
	    const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
	    let opcode = options.binary ? 2 : 1;
	    let rsv1 = options.compress;

	    let byteLength;
	    let readOnly;

	    if (typeof data === 'string') {
	      byteLength = Buffer.byteLength(data);
	      readOnly = false;
	    } else if (isBlob(data)) {
	      byteLength = data.size;
	      readOnly = false;
	    } else {
	      data = toBuffer(data);
	      byteLength = data.length;
	      readOnly = toBuffer.readOnly;
	    }

	    if (this._firstFragment) {
	      this._firstFragment = false;
	      if (
	        rsv1 &&
	        perMessageDeflate &&
	        perMessageDeflate.params[
	          perMessageDeflate._isServer
	            ? 'server_no_context_takeover'
	            : 'client_no_context_takeover'
	        ]
	      ) {
	        rsv1 = byteLength >= perMessageDeflate._threshold;
	      }
	      this._compress = rsv1;
	    } else {
	      rsv1 = false;
	      opcode = 0;
	    }

	    if (options.fin) this._firstFragment = true;

	    const opts = {
	      [kByteLength]: byteLength,
	      fin: options.fin,
	      generateMask: this._generateMask,
	      mask: options.mask,
	      maskBuffer: this._maskBuffer,
	      opcode,
	      readOnly,
	      rsv1
	    };

	    if (isBlob(data)) {
	      if (this._state !== DEFAULT) {
	        this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
	      } else {
	        this.getBlobData(data, this._compress, opts, cb);
	      }
	    } else if (this._state !== DEFAULT) {
	      this.enqueue([this.dispatch, data, this._compress, opts, cb]);
	    } else {
	      this.dispatch(data, this._compress, opts, cb);
	    }
	  }

	  /**
	   * Gets the contents of a blob as binary data.
	   *
	   * @param {Blob} blob The blob
	   * @param {Boolean} [compress=false] Specifies whether or not to compress
	   *     the data
	   * @param {Object} options Options object
	   * @param {Boolean} [options.fin=false] Specifies whether or not to set the
	   *     FIN bit
	   * @param {Function} [options.generateMask] The function used to generate the
	   *     masking key
	   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
	   *     `data`
	   * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
	   *     key
	   * @param {Number} options.opcode The opcode
	   * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
	   *     modified
	   * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
	   *     RSV1 bit
	   * @param {Function} [cb] Callback
	   * @private
	   */
	  getBlobData(blob, compress, options, cb) {
	    this._bufferedBytes += options[kByteLength];
	    this._state = GET_BLOB_DATA;

	    blob
	      .arrayBuffer()
	      .then((arrayBuffer) => {
	        if (this._socket.destroyed) {
	          const err = new Error(
	            'The socket was closed while the blob was being read'
	          );

	          //
	          // `callCallbacks` is called in the next tick to ensure that errors
	          // that might be thrown in the callbacks behave like errors thrown
	          // outside the promise chain.
	          //
	          process.nextTick(callCallbacks, this, err, cb);
	          return;
	        }

	        this._bufferedBytes -= options[kByteLength];
	        const data = toBuffer(arrayBuffer);

	        if (!compress) {
	          this._state = DEFAULT;
	          this.sendFrame(Sender.frame(data, options), cb);
	          this.dequeue();
	        } else {
	          this.dispatch(data, compress, options, cb);
	        }
	      })
	      .catch((err) => {
	        //
	        // `onError` is called in the next tick for the same reason that
	        // `callCallbacks` above is.
	        //
	        process.nextTick(onError, this, err, cb);
	      });
	  }

	  /**
	   * Dispatches a message.
	   *
	   * @param {(Buffer|String)} data The message to send
	   * @param {Boolean} [compress=false] Specifies whether or not to compress
	   *     `data`
	   * @param {Object} options Options object
	   * @param {Boolean} [options.fin=false] Specifies whether or not to set the
	   *     FIN bit
	   * @param {Function} [options.generateMask] The function used to generate the
	   *     masking key
	   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
	   *     `data`
	   * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
	   *     key
	   * @param {Number} options.opcode The opcode
	   * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
	   *     modified
	   * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
	   *     RSV1 bit
	   * @param {Function} [cb] Callback
	   * @private
	   */
	  dispatch(data, compress, options, cb) {
	    if (!compress) {
	      this.sendFrame(Sender.frame(data, options), cb);
	      return;
	    }

	    const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];

	    this._bufferedBytes += options[kByteLength];
	    this._state = DEFLATING;
	    perMessageDeflate.compress(data, options.fin, (_, buf) => {
	      if (this._socket.destroyed) {
	        const err = new Error(
	          'The socket was closed while data was being compressed'
	        );

	        callCallbacks(this, err, cb);
	        return;
	      }

	      this._bufferedBytes -= options[kByteLength];
	      this._state = DEFAULT;
	      options.readOnly = false;
	      this.sendFrame(Sender.frame(buf, options), cb);
	      this.dequeue();
	    });
	  }

	  /**
	   * Executes queued send operations.
	   *
	   * @private
	   */
	  dequeue() {
	    while (this._state === DEFAULT && this._queue.length) {
	      const params = this._queue.shift();

	      this._bufferedBytes -= params[3][kByteLength];
	      Reflect.apply(params[0], this, params.slice(1));
	    }
	  }

	  /**
	   * Enqueues a send operation.
	   *
	   * @param {Array} params Send operation parameters.
	   * @private
	   */
	  enqueue(params) {
	    this._bufferedBytes += params[3][kByteLength];
	    this._queue.push(params);
	  }

	  /**
	   * Sends a frame.
	   *
	   * @param {(Buffer | String)[]} list The frame to send
	   * @param {Function} [cb] Callback
	   * @private
	   */
	  sendFrame(list, cb) {
	    if (list.length === 2) {
	      this._socket.cork();
	      this._socket.write(list[0]);
	      this._socket.write(list[1], cb);
	      this._socket.uncork();
	    } else {
	      this._socket.write(list[0], cb);
	    }
	  }
	}

	sender = Sender;

	/**
	 * Calls queued callbacks with an error.
	 *
	 * @param {Sender} sender The `Sender` instance
	 * @param {Error} err The error to call the callbacks with
	 * @param {Function} [cb] The first callback
	 * @private
	 */
	function callCallbacks(sender, err, cb) {
	  if (typeof cb === 'function') cb(err);

	  for (let i = 0; i < sender._queue.length; i++) {
	    const params = sender._queue[i];
	    const callback = params[params.length - 1];

	    if (typeof callback === 'function') callback(err);
	  }
	}

	/**
	 * Handles a `Sender` error.
	 *
	 * @param {Sender} sender The `Sender` instance
	 * @param {Error} err The error
	 * @param {Function} [cb] The first pending callback
	 * @private
	 */
	function onError(sender, err, cb) {
	  callCallbacks(sender, err, cb);
	  sender.onerror(err);
	}
	return sender;
}

var eventTarget;
var hasRequiredEventTarget;

function requireEventTarget () {
	if (hasRequiredEventTarget) return eventTarget;
	hasRequiredEventTarget = 1;

	const { kForOnEventAttribute, kListener } = requireConstants();

	const kCode = Symbol('kCode');
	const kData = Symbol('kData');
	const kError = Symbol('kError');
	const kMessage = Symbol('kMessage');
	const kReason = Symbol('kReason');
	const kTarget = Symbol('kTarget');
	const kType = Symbol('kType');
	const kWasClean = Symbol('kWasClean');

	/**
	 * Class representing an event.
	 */
	class Event {
	  /**
	   * Create a new `Event`.
	   *
	   * @param {String} type The name of the event
	   * @throws {TypeError} If the `type` argument is not specified
	   */
	  constructor(type) {
	    this[kTarget] = null;
	    this[kType] = type;
	  }

	  /**
	   * @type {*}
	   */
	  get target() {
	    return this[kTarget];
	  }

	  /**
	   * @type {String}
	   */
	  get type() {
	    return this[kType];
	  }
	}

	Object.defineProperty(Event.prototype, 'target', { enumerable: true });
	Object.defineProperty(Event.prototype, 'type', { enumerable: true });

	/**
	 * Class representing a close event.
	 *
	 * @extends Event
	 */
	class CloseEvent extends Event {
	  /**
	   * Create a new `CloseEvent`.
	   *
	   * @param {String} type The name of the event
	   * @param {Object} [options] A dictionary object that allows for setting
	   *     attributes via object members of the same name
	   * @param {Number} [options.code=0] The status code explaining why the
	   *     connection was closed
	   * @param {String} [options.reason=''] A human-readable string explaining why
	   *     the connection was closed
	   * @param {Boolean} [options.wasClean=false] Indicates whether or not the
	   *     connection was cleanly closed
	   */
	  constructor(type, options = {}) {
	    super(type);

	    this[kCode] = options.code === undefined ? 0 : options.code;
	    this[kReason] = options.reason === undefined ? '' : options.reason;
	    this[kWasClean] = options.wasClean === undefined ? false : options.wasClean;
	  }

	  /**
	   * @type {Number}
	   */
	  get code() {
	    return this[kCode];
	  }

	  /**
	   * @type {String}
	   */
	  get reason() {
	    return this[kReason];
	  }

	  /**
	   * @type {Boolean}
	   */
	  get wasClean() {
	    return this[kWasClean];
	  }
	}

	Object.defineProperty(CloseEvent.prototype, 'code', { enumerable: true });
	Object.defineProperty(CloseEvent.prototype, 'reason', { enumerable: true });
	Object.defineProperty(CloseEvent.prototype, 'wasClean', { enumerable: true });

	/**
	 * Class representing an error event.
	 *
	 * @extends Event
	 */
	class ErrorEvent extends Event {
	  /**
	   * Create a new `ErrorEvent`.
	   *
	   * @param {String} type The name of the event
	   * @param {Object} [options] A dictionary object that allows for setting
	   *     attributes via object members of the same name
	   * @param {*} [options.error=null] The error that generated this event
	   * @param {String} [options.message=''] The error message
	   */
	  constructor(type, options = {}) {
	    super(type);

	    this[kError] = options.error === undefined ? null : options.error;
	    this[kMessage] = options.message === undefined ? '' : options.message;
	  }

	  /**
	   * @type {*}
	   */
	  get error() {
	    return this[kError];
	  }

	  /**
	   * @type {String}
	   */
	  get message() {
	    return this[kMessage];
	  }
	}

	Object.defineProperty(ErrorEvent.prototype, 'error', { enumerable: true });
	Object.defineProperty(ErrorEvent.prototype, 'message', { enumerable: true });

	/**
	 * Class representing a message event.
	 *
	 * @extends Event
	 */
	class MessageEvent extends Event {
	  /**
	   * Create a new `MessageEvent`.
	   *
	   * @param {String} type The name of the event
	   * @param {Object} [options] A dictionary object that allows for setting
	   *     attributes via object members of the same name
	   * @param {*} [options.data=null] The message content
	   */
	  constructor(type, options = {}) {
	    super(type);

	    this[kData] = options.data === undefined ? null : options.data;
	  }

	  /**
	   * @type {*}
	   */
	  get data() {
	    return this[kData];
	  }
	}

	Object.defineProperty(MessageEvent.prototype, 'data', { enumerable: true });

	/**
	 * This provides methods for emulating the `EventTarget` interface. It's not
	 * meant to be used directly.
	 *
	 * @mixin
	 */
	const EventTarget = {
	  /**
	   * Register an event listener.
	   *
	   * @param {String} type A string representing the event type to listen for
	   * @param {(Function|Object)} handler The listener to add
	   * @param {Object} [options] An options object specifies characteristics about
	   *     the event listener
	   * @param {Boolean} [options.once=false] A `Boolean` indicating that the
	   *     listener should be invoked at most once after being added. If `true`,
	   *     the listener would be automatically removed when invoked.
	   * @public
	   */
	  addEventListener(type, handler, options = {}) {
	    for (const listener of this.listeners(type)) {
	      if (
	        !options[kForOnEventAttribute] &&
	        listener[kListener] === handler &&
	        !listener[kForOnEventAttribute]
	      ) {
	        return;
	      }
	    }

	    let wrapper;

	    if (type === 'message') {
	      wrapper = function onMessage(data, isBinary) {
	        const event = new MessageEvent('message', {
	          data: isBinary ? data : data.toString()
	        });

	        event[kTarget] = this;
	        callListener(handler, this, event);
	      };
	    } else if (type === 'close') {
	      wrapper = function onClose(code, message) {
	        const event = new CloseEvent('close', {
	          code,
	          reason: message.toString(),
	          wasClean: this._closeFrameReceived && this._closeFrameSent
	        });

	        event[kTarget] = this;
	        callListener(handler, this, event);
	      };
	    } else if (type === 'error') {
	      wrapper = function onError(error) {
	        const event = new ErrorEvent('error', {
	          error,
	          message: error.message
	        });

	        event[kTarget] = this;
	        callListener(handler, this, event);
	      };
	    } else if (type === 'open') {
	      wrapper = function onOpen() {
	        const event = new Event('open');

	        event[kTarget] = this;
	        callListener(handler, this, event);
	      };
	    } else {
	      return;
	    }

	    wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
	    wrapper[kListener] = handler;

	    if (options.once) {
	      this.once(type, wrapper);
	    } else {
	      this.on(type, wrapper);
	    }
	  },

	  /**
	   * Remove an event listener.
	   *
	   * @param {String} type A string representing the event type to remove
	   * @param {(Function|Object)} handler The listener to remove
	   * @public
	   */
	  removeEventListener(type, handler) {
	    for (const listener of this.listeners(type)) {
	      if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
	        this.removeListener(type, listener);
	        break;
	      }
	    }
	  }
	};

	eventTarget = {
	  CloseEvent,
	  ErrorEvent,
	  Event,
	  EventTarget,
	  MessageEvent
	};

	/**
	 * Call an event listener
	 *
	 * @param {(Function|Object)} listener The listener to call
	 * @param {*} thisArg The value to use as `this`` when calling the listener
	 * @param {Event} event The event to pass to the listener
	 * @private
	 */
	function callListener(listener, thisArg, event) {
	  if (typeof listener === 'object' && listener.handleEvent) {
	    listener.handleEvent.call(listener, event);
	  } else {
	    listener.call(thisArg, event);
	  }
	}
	return eventTarget;
}

var extension;
var hasRequiredExtension;

function requireExtension () {
	if (hasRequiredExtension) return extension;
	hasRequiredExtension = 1;

	const { tokenChars } = requireValidation();

	/**
	 * Adds an offer to the map of extension offers or a parameter to the map of
	 * parameters.
	 *
	 * @param {Object} dest The map of extension offers or parameters
	 * @param {String} name The extension or parameter name
	 * @param {(Object|Boolean|String)} elem The extension parameters or the
	 *     parameter value
	 * @private
	 */
	function push(dest, name, elem) {
	  if (dest[name] === undefined) dest[name] = [elem];
	  else dest[name].push(elem);
	}

	/**
	 * Parses the `Sec-WebSocket-Extensions` header into an object.
	 *
	 * @param {String} header The field value of the header
	 * @return {Object} The parsed object
	 * @public
	 */
	function parse(header) {
	  const offers = Object.create(null);
	  let params = Object.create(null);
	  let mustUnescape = false;
	  let isEscaping = false;
	  let inQuotes = false;
	  let extensionName;
	  let paramName;
	  let start = -1;
	  let code = -1;
	  let end = -1;
	  let i = 0;

	  for (; i < header.length; i++) {
	    code = header.charCodeAt(i);

	    if (extensionName === undefined) {
	      if (end === -1 && tokenChars[code] === 1) {
	        if (start === -1) start = i;
	      } else if (
	        i !== 0 &&
	        (code === 0x20 /* ' ' */ || code === 0x09) /* '\t' */
	      ) {
	        if (end === -1 && start !== -1) end = i;
	      } else if (code === 0x3b /* ';' */ || code === 0x2c /* ',' */) {
	        if (start === -1) {
	          throw new SyntaxError(`Unexpected character at index ${i}`);
	        }

	        if (end === -1) end = i;
	        const name = header.slice(start, end);
	        if (code === 0x2c) {
	          push(offers, name, params);
	          params = Object.create(null);
	        } else {
	          extensionName = name;
	        }

	        start = end = -1;
	      } else {
	        throw new SyntaxError(`Unexpected character at index ${i}`);
	      }
	    } else if (paramName === undefined) {
	      if (end === -1 && tokenChars[code] === 1) {
	        if (start === -1) start = i;
	      } else if (code === 0x20 || code === 0x09) {
	        if (end === -1 && start !== -1) end = i;
	      } else if (code === 0x3b || code === 0x2c) {
	        if (start === -1) {
	          throw new SyntaxError(`Unexpected character at index ${i}`);
	        }

	        if (end === -1) end = i;
	        push(params, header.slice(start, end), true);
	        if (code === 0x2c) {
	          push(offers, extensionName, params);
	          params = Object.create(null);
	          extensionName = undefined;
	        }

	        start = end = -1;
	      } else if (code === 0x3d /* '=' */ && start !== -1 && end === -1) {
	        paramName = header.slice(start, i);
	        start = end = -1;
	      } else {
	        throw new SyntaxError(`Unexpected character at index ${i}`);
	      }
	    } else {
	      //
	      // The value of a quoted-string after unescaping must conform to the
	      // token ABNF, so only token characters are valid.
	      // Ref: https://tools.ietf.org/html/rfc6455#section-9.1
	      //
	      if (isEscaping) {
	        if (tokenChars[code] !== 1) {
	          throw new SyntaxError(`Unexpected character at index ${i}`);
	        }
	        if (start === -1) start = i;
	        else if (!mustUnescape) mustUnescape = true;
	        isEscaping = false;
	      } else if (inQuotes) {
	        if (tokenChars[code] === 1) {
	          if (start === -1) start = i;
	        } else if (code === 0x22 /* '"' */ && start !== -1) {
	          inQuotes = false;
	          end = i;
	        } else if (code === 0x5c /* '\' */) {
	          isEscaping = true;
	        } else {
	          throw new SyntaxError(`Unexpected character at index ${i}`);
	        }
	      } else if (code === 0x22 && header.charCodeAt(i - 1) === 0x3d) {
	        inQuotes = true;
	      } else if (end === -1 && tokenChars[code] === 1) {
	        if (start === -1) start = i;
	      } else if (start !== -1 && (code === 0x20 || code === 0x09)) {
	        if (end === -1) end = i;
	      } else if (code === 0x3b || code === 0x2c) {
	        if (start === -1) {
	          throw new SyntaxError(`Unexpected character at index ${i}`);
	        }

	        if (end === -1) end = i;
	        let value = header.slice(start, end);
	        if (mustUnescape) {
	          value = value.replace(/\\/g, '');
	          mustUnescape = false;
	        }
	        push(params, paramName, value);
	        if (code === 0x2c) {
	          push(offers, extensionName, params);
	          params = Object.create(null);
	          extensionName = undefined;
	        }

	        paramName = undefined;
	        start = end = -1;
	      } else {
	        throw new SyntaxError(`Unexpected character at index ${i}`);
	      }
	    }
	  }

	  if (start === -1 || inQuotes || code === 0x20 || code === 0x09) {
	    throw new SyntaxError('Unexpected end of input');
	  }

	  if (end === -1) end = i;
	  const token = header.slice(start, end);
	  if (extensionName === undefined) {
	    push(offers, token, params);
	  } else {
	    if (paramName === undefined) {
	      push(params, token, true);
	    } else if (mustUnescape) {
	      push(params, paramName, token.replace(/\\/g, ''));
	    } else {
	      push(params, paramName, token);
	    }
	    push(offers, extensionName, params);
	  }

	  return offers;
	}

	/**
	 * Builds the `Sec-WebSocket-Extensions` header field value.
	 *
	 * @param {Object} extensions The map of extensions and parameters to format
	 * @return {String} A string representing the given object
	 * @public
	 */
	function format(extensions) {
	  return Object.keys(extensions)
	    .map((extension) => {
	      let configurations = extensions[extension];
	      if (!Array.isArray(configurations)) configurations = [configurations];
	      return configurations
	        .map((params) => {
	          return [extension]
	            .concat(
	              Object.keys(params).map((k) => {
	                let values = params[k];
	                if (!Array.isArray(values)) values = [values];
	                return values
	                  .map((v) => (v === true ? k : `${k}=${v}`))
	                  .join('; ');
	              })
	            )
	            .join('; ');
	        })
	        .join(', ');
	    })
	    .join(', ');
	}

	extension = { format, parse };
	return extension;
}

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^Duplex|Readable$", "caughtErrors": "none" }] */

var websocket;
var hasRequiredWebsocket;

function requireWebsocket () {
	if (hasRequiredWebsocket) return websocket;
	hasRequiredWebsocket = 1;

	const EventEmitter = require$$0$3;
	const https = require$$1$1;
	const http = require$$2$1;
	const net = require$$3;
	const tls = require$$4;
	const { randomBytes, createHash } = require$$1;
	const { Duplex, Readable } = require$$0$2;
	const { URL } = require$$7;

	const PerMessageDeflate = requirePermessageDeflate();
	const Receiver = requireReceiver();
	const Sender = requireSender();
	const { isBlob } = requireValidation();

	const {
	  BINARY_TYPES,
	  CLOSE_TIMEOUT,
	  EMPTY_BUFFER,
	  GUID,
	  kForOnEventAttribute,
	  kListener,
	  kStatusCode,
	  kWebSocket,
	  NOOP
	} = requireConstants();
	const {
	  EventTarget: { addEventListener, removeEventListener }
	} = requireEventTarget();
	const { format, parse } = requireExtension();
	const { toBuffer } = requireBufferUtil();

	const kAborted = Symbol('kAborted');
	const protocolVersions = [8, 13];
	const readyStates = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
	const subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;

	/**
	 * Class representing a WebSocket.
	 *
	 * @extends EventEmitter
	 */
	class WebSocket extends EventEmitter {
	  /**
	   * Create a new `WebSocket`.
	   *
	   * @param {(String|URL)} address The URL to which to connect
	   * @param {(String|String[])} [protocols] The subprotocols
	   * @param {Object} [options] Connection options
	   */
	  constructor(address, protocols, options) {
	    super();

	    this._binaryType = BINARY_TYPES[0];
	    this._closeCode = 1006;
	    this._closeFrameReceived = false;
	    this._closeFrameSent = false;
	    this._closeMessage = EMPTY_BUFFER;
	    this._closeTimer = null;
	    this._errorEmitted = false;
	    this._extensions = {};
	    this._paused = false;
	    this._protocol = '';
	    this._readyState = WebSocket.CONNECTING;
	    this._receiver = null;
	    this._sender = null;
	    this._socket = null;

	    if (address !== null) {
	      this._bufferedAmount = 0;
	      this._isServer = false;
	      this._redirects = 0;

	      if (protocols === undefined) {
	        protocols = [];
	      } else if (!Array.isArray(protocols)) {
	        if (typeof protocols === 'object' && protocols !== null) {
	          options = protocols;
	          protocols = [];
	        } else {
	          protocols = [protocols];
	        }
	      }

	      initAsClient(this, address, protocols, options);
	    } else {
	      this._autoPong = options.autoPong;
	      this._closeTimeout = options.closeTimeout;
	      this._isServer = true;
	    }
	  }

	  /**
	   * For historical reasons, the custom "nodebuffer" type is used by the default
	   * instead of "blob".
	   *
	   * @type {String}
	   */
	  get binaryType() {
	    return this._binaryType;
	  }

	  set binaryType(type) {
	    if (!BINARY_TYPES.includes(type)) return;

	    this._binaryType = type;

	    //
	    // Allow to change `binaryType` on the fly.
	    //
	    if (this._receiver) this._receiver._binaryType = type;
	  }

	  /**
	   * @type {Number}
	   */
	  get bufferedAmount() {
	    if (!this._socket) return this._bufferedAmount;

	    return this._socket._writableState.length + this._sender._bufferedBytes;
	  }

	  /**
	   * @type {String}
	   */
	  get extensions() {
	    return Object.keys(this._extensions).join();
	  }

	  /**
	   * @type {Boolean}
	   */
	  get isPaused() {
	    return this._paused;
	  }

	  /**
	   * @type {Function}
	   */
	  /* istanbul ignore next */
	  get onclose() {
	    return null;
	  }

	  /**
	   * @type {Function}
	   */
	  /* istanbul ignore next */
	  get onerror() {
	    return null;
	  }

	  /**
	   * @type {Function}
	   */
	  /* istanbul ignore next */
	  get onopen() {
	    return null;
	  }

	  /**
	   * @type {Function}
	   */
	  /* istanbul ignore next */
	  get onmessage() {
	    return null;
	  }

	  /**
	   * @type {String}
	   */
	  get protocol() {
	    return this._protocol;
	  }

	  /**
	   * @type {Number}
	   */
	  get readyState() {
	    return this._readyState;
	  }

	  /**
	   * @type {String}
	   */
	  get url() {
	    return this._url;
	  }

	  /**
	   * Set up the socket and the internal resources.
	   *
	   * @param {Duplex} socket The network socket between the server and client
	   * @param {Buffer} head The first packet of the upgraded stream
	   * @param {Object} options Options object
	   * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
	   *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
	   *     multiple times in the same tick
	   * @param {Function} [options.generateMask] The function used to generate the
	   *     masking key
	   * @param {Number} [options.maxBufferedChunks=0] The maximum number of
	   *     buffered data chunks
	   * @param {Number} [options.maxFragments=0] The maximum number of message
	   *     fragments
	   * @param {Number} [options.maxPayload=0] The maximum allowed message size
	   * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
	   *     not to skip UTF-8 validation for text and close messages
	   * @private
	   */
	  setSocket(socket, head, options) {
	    const receiver = new Receiver({
	      allowSynchronousEvents: options.allowSynchronousEvents,
	      binaryType: this.binaryType,
	      extensions: this._extensions,
	      isServer: this._isServer,
	      maxBufferedChunks: options.maxBufferedChunks,
	      maxFragments: options.maxFragments,
	      maxPayload: options.maxPayload,
	      skipUTF8Validation: options.skipUTF8Validation
	    });

	    const sender = new Sender(socket, this._extensions, options.generateMask);

	    this._receiver = receiver;
	    this._sender = sender;
	    this._socket = socket;

	    receiver[kWebSocket] = this;
	    sender[kWebSocket] = this;
	    socket[kWebSocket] = this;

	    receiver.on('conclude', receiverOnConclude);
	    receiver.on('drain', receiverOnDrain);
	    receiver.on('error', receiverOnError);
	    receiver.on('message', receiverOnMessage);
	    receiver.on('ping', receiverOnPing);
	    receiver.on('pong', receiverOnPong);

	    sender.onerror = senderOnError;

	    //
	    // These methods may not be available if `socket` is just a `Duplex`.
	    //
	    if (socket.setTimeout) socket.setTimeout(0);
	    if (socket.setNoDelay) socket.setNoDelay();

	    if (head.length > 0) socket.unshift(head);

	    socket.on('close', socketOnClose);
	    socket.on('data', socketOnData);
	    socket.on('end', socketOnEnd);
	    socket.on('error', socketOnError);

	    this._readyState = WebSocket.OPEN;
	    this.emit('open');
	  }

	  /**
	   * Emit the `'close'` event.
	   *
	   * @private
	   */
	  emitClose() {
	    if (!this._socket) {
	      this._readyState = WebSocket.CLOSED;
	      this.emit('close', this._closeCode, this._closeMessage);
	      return;
	    }

	    if (this._extensions[PerMessageDeflate.extensionName]) {
	      this._extensions[PerMessageDeflate.extensionName].cleanup();
	    }

	    this._receiver.removeAllListeners();
	    this._readyState = WebSocket.CLOSED;
	    this.emit('close', this._closeCode, this._closeMessage);
	  }

	  /**
	   * Start a closing handshake.
	   *
	   *          +----------+   +-----------+   +----------+
	   *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
	   *    |     +----------+   +-----------+   +----------+     |
	   *          +----------+   +-----------+         |
	   * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
	   *          +----------+   +-----------+   |
	   *    |           |                        |   +---+        |
	   *                +------------------------+-->|fin| - - - -
	   *    |         +---+                      |   +---+
	   *     - - - - -|fin|<---------------------+
	   *              +---+
	   *
	   * @param {Number} [code] Status code explaining why the connection is closing
	   * @param {(String|Buffer)} [data] The reason why the connection is
	   *     closing
	   * @public
	   */
	  close(code, data) {
	    if (this.readyState === WebSocket.CLOSED) return;
	    if (this.readyState === WebSocket.CONNECTING) {
	      const msg = 'WebSocket was closed before the connection was established';
	      abortHandshake(this, this._req, msg);
	      return;
	    }

	    if (this.readyState === WebSocket.CLOSING) {
	      if (
	        this._closeFrameSent &&
	        (this._closeFrameReceived || this._receiver._writableState.errorEmitted)
	      ) {
	        this._socket.end();
	      }

	      return;
	    }

	    this._readyState = WebSocket.CLOSING;
	    this._sender.close(code, data, !this._isServer, (err) => {
	      //
	      // This error is handled by the `'error'` listener on the socket. We only
	      // want to know if the close frame has been sent here.
	      //
	      if (err) return;

	      this._closeFrameSent = true;

	      if (
	        this._closeFrameReceived ||
	        this._receiver._writableState.errorEmitted
	      ) {
	        this._socket.end();
	      }
	    });

	    setCloseTimer(this);
	  }

	  /**
	   * Pause the socket.
	   *
	   * @public
	   */
	  pause() {
	    if (
	      this.readyState === WebSocket.CONNECTING ||
	      this.readyState === WebSocket.CLOSED
	    ) {
	      return;
	    }

	    this._paused = true;
	    this._socket.pause();
	  }

	  /**
	   * Send a ping.
	   *
	   * @param {*} [data] The data to send
	   * @param {Boolean} [mask] Indicates whether or not to mask `data`
	   * @param {Function} [cb] Callback which is executed when the ping is sent
	   * @public
	   */
	  ping(data, mask, cb) {
	    if (this.readyState === WebSocket.CONNECTING) {
	      throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
	    }

	    if (typeof data === 'function') {
	      cb = data;
	      data = mask = undefined;
	    } else if (typeof mask === 'function') {
	      cb = mask;
	      mask = undefined;
	    }

	    if (typeof data === 'number') data = data.toString();

	    if (this.readyState !== WebSocket.OPEN) {
	      sendAfterClose(this, data, cb);
	      return;
	    }

	    if (mask === undefined) mask = !this._isServer;
	    this._sender.ping(data || EMPTY_BUFFER, mask, cb);
	  }

	  /**
	   * Send a pong.
	   *
	   * @param {*} [data] The data to send
	   * @param {Boolean} [mask] Indicates whether or not to mask `data`
	   * @param {Function} [cb] Callback which is executed when the pong is sent
	   * @public
	   */
	  pong(data, mask, cb) {
	    if (this.readyState === WebSocket.CONNECTING) {
	      throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
	    }

	    if (typeof data === 'function') {
	      cb = data;
	      data = mask = undefined;
	    } else if (typeof mask === 'function') {
	      cb = mask;
	      mask = undefined;
	    }

	    if (typeof data === 'number') data = data.toString();

	    if (this.readyState !== WebSocket.OPEN) {
	      sendAfterClose(this, data, cb);
	      return;
	    }

	    if (mask === undefined) mask = !this._isServer;
	    this._sender.pong(data || EMPTY_BUFFER, mask, cb);
	  }

	  /**
	   * Resume the socket.
	   *
	   * @public
	   */
	  resume() {
	    if (
	      this.readyState === WebSocket.CONNECTING ||
	      this.readyState === WebSocket.CLOSED
	    ) {
	      return;
	    }

	    this._paused = false;
	    if (!this._receiver._writableState.needDrain) this._socket.resume();
	  }

	  /**
	   * Send a data message.
	   *
	   * @param {*} data The message to send
	   * @param {Object} [options] Options object
	   * @param {Boolean} [options.binary] Specifies whether `data` is binary or
	   *     text
	   * @param {Boolean} [options.compress] Specifies whether or not to compress
	   *     `data`
	   * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
	   *     last one
	   * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
	   * @param {Function} [cb] Callback which is executed when data is written out
	   * @public
	   */
	  send(data, options, cb) {
	    if (this.readyState === WebSocket.CONNECTING) {
	      throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
	    }

	    if (typeof options === 'function') {
	      cb = options;
	      options = {};
	    }

	    if (typeof data === 'number') data = data.toString();

	    if (this.readyState !== WebSocket.OPEN) {
	      sendAfterClose(this, data, cb);
	      return;
	    }

	    const opts = {
	      binary: typeof data !== 'string',
	      mask: !this._isServer,
	      compress: true,
	      fin: true,
	      ...options
	    };

	    if (!this._extensions[PerMessageDeflate.extensionName]) {
	      opts.compress = false;
	    }

	    this._sender.send(data || EMPTY_BUFFER, opts, cb);
	  }

	  /**
	   * Forcibly close the connection.
	   *
	   * @public
	   */
	  terminate() {
	    if (this.readyState === WebSocket.CLOSED) return;
	    if (this.readyState === WebSocket.CONNECTING) {
	      const msg = 'WebSocket was closed before the connection was established';
	      abortHandshake(this, this._req, msg);
	      return;
	    }

	    if (this._socket) {
	      this._readyState = WebSocket.CLOSING;
	      this._socket.destroy();
	    }
	  }
	}

	/**
	 * @constant {Number} CONNECTING
	 * @memberof WebSocket
	 */
	Object.defineProperty(WebSocket, 'CONNECTING', {
	  enumerable: true,
	  value: readyStates.indexOf('CONNECTING')
	});

	/**
	 * @constant {Number} CONNECTING
	 * @memberof WebSocket.prototype
	 */
	Object.defineProperty(WebSocket.prototype, 'CONNECTING', {
	  enumerable: true,
	  value: readyStates.indexOf('CONNECTING')
	});

	/**
	 * @constant {Number} OPEN
	 * @memberof WebSocket
	 */
	Object.defineProperty(WebSocket, 'OPEN', {
	  enumerable: true,
	  value: readyStates.indexOf('OPEN')
	});

	/**
	 * @constant {Number} OPEN
	 * @memberof WebSocket.prototype
	 */
	Object.defineProperty(WebSocket.prototype, 'OPEN', {
	  enumerable: true,
	  value: readyStates.indexOf('OPEN')
	});

	/**
	 * @constant {Number} CLOSING
	 * @memberof WebSocket
	 */
	Object.defineProperty(WebSocket, 'CLOSING', {
	  enumerable: true,
	  value: readyStates.indexOf('CLOSING')
	});

	/**
	 * @constant {Number} CLOSING
	 * @memberof WebSocket.prototype
	 */
	Object.defineProperty(WebSocket.prototype, 'CLOSING', {
	  enumerable: true,
	  value: readyStates.indexOf('CLOSING')
	});

	/**
	 * @constant {Number} CLOSED
	 * @memberof WebSocket
	 */
	Object.defineProperty(WebSocket, 'CLOSED', {
	  enumerable: true,
	  value: readyStates.indexOf('CLOSED')
	});

	/**
	 * @constant {Number} CLOSED
	 * @memberof WebSocket.prototype
	 */
	Object.defineProperty(WebSocket.prototype, 'CLOSED', {
	  enumerable: true,
	  value: readyStates.indexOf('CLOSED')
	});

	[
	  'binaryType',
	  'bufferedAmount',
	  'extensions',
	  'isPaused',
	  'protocol',
	  'readyState',
	  'url'
	].forEach((property) => {
	  Object.defineProperty(WebSocket.prototype, property, { enumerable: true });
	});

	//
	// Add the `onopen`, `onerror`, `onclose`, and `onmessage` attributes.
	// See https://html.spec.whatwg.org/multipage/comms.html#the-websocket-interface
	//
	['open', 'error', 'close', 'message'].forEach((method) => {
	  Object.defineProperty(WebSocket.prototype, `on${method}`, {
	    enumerable: true,
	    get() {
	      for (const listener of this.listeners(method)) {
	        if (listener[kForOnEventAttribute]) return listener[kListener];
	      }

	      return null;
	    },
	    set(handler) {
	      for (const listener of this.listeners(method)) {
	        if (listener[kForOnEventAttribute]) {
	          this.removeListener(method, listener);
	          break;
	        }
	      }

	      if (typeof handler !== 'function') return;

	      this.addEventListener(method, handler, {
	        [kForOnEventAttribute]: true
	      });
	    }
	  });
	});

	WebSocket.prototype.addEventListener = addEventListener;
	WebSocket.prototype.removeEventListener = removeEventListener;

	websocket = WebSocket;

	/**
	 * Initialize a WebSocket client.
	 *
	 * @param {WebSocket} websocket The client to initialize
	 * @param {(String|URL)} address The URL to which to connect
	 * @param {Array} protocols The subprotocols
	 * @param {Object} [options] Connection options
	 * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether any
	 *     of the `'message'`, `'ping'`, and `'pong'` events can be emitted multiple
	 *     times in the same tick
	 * @param {Boolean} [options.autoPong=true] Specifies whether or not to
	 *     automatically send a pong in response to a ping
	 * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to wait
	 *     for the closing handshake to finish after `websocket.close()` is called
	 * @param {Function} [options.finishRequest] A function which can be used to
	 *     customize the headers of each http request before it is sent
	 * @param {Boolean} [options.followRedirects=false] Whether or not to follow
	 *     redirects
	 * @param {Function} [options.generateMask] The function used to generate the
	 *     masking key
	 * @param {Number} [options.handshakeTimeout] Timeout in milliseconds for the
	 *     handshake request
	 * @param {Number} [options.maxBufferedChunks=262144] The maximum number of
	 *     buffered data chunks
	 * @param {Number} [options.maxFragments=16384] The maximum number of message
	 *     fragments
	 * @param {Number} [options.maxPayload=104857600] The maximum allowed message
	 *     size
	 * @param {Number} [options.maxRedirects=10] The maximum number of redirects
	 *     allowed
	 * @param {String} [options.origin] Value of the `Origin` or
	 *     `Sec-WebSocket-Origin` header
	 * @param {(Boolean|Object)} [options.perMessageDeflate=true] Enable/disable
	 *     permessage-deflate
	 * @param {Number} [options.protocolVersion=13] Value of the
	 *     `Sec-WebSocket-Version` header
	 * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
	 *     not to skip UTF-8 validation for text and close messages
	 * @private
	 */
	function initAsClient(websocket, address, protocols, options) {
	  const opts = {
	    allowSynchronousEvents: true,
	    autoPong: true,
	    closeTimeout: CLOSE_TIMEOUT,
	    protocolVersion: protocolVersions[1],
	    maxBufferedChunks: 256 * 1024,
	    maxFragments: 16 * 1024,
	    maxPayload: 100 * 1024 * 1024,
	    skipUTF8Validation: false,
	    perMessageDeflate: true,
	    followRedirects: false,
	    maxRedirects: 10,
	    ...options,
	    socketPath: undefined,
	    hostname: undefined,
	    protocol: undefined,
	    timeout: undefined,
	    method: 'GET',
	    host: undefined,
	    path: undefined,
	    port: undefined
	  };

	  websocket._autoPong = opts.autoPong;
	  websocket._closeTimeout = opts.closeTimeout;

	  if (!protocolVersions.includes(opts.protocolVersion)) {
	    throw new RangeError(
	      `Unsupported protocol version: ${opts.protocolVersion} ` +
	        `(supported versions: ${protocolVersions.join(', ')})`
	    );
	  }

	  let parsedUrl;

	  if (address instanceof URL) {
	    parsedUrl = address;
	  } else {
	    try {
	      parsedUrl = new URL(address);
	    } catch {
	      throw new SyntaxError(`Invalid URL: ${address}`);
	    }
	  }

	  if (parsedUrl.protocol === 'http:') {
	    parsedUrl.protocol = 'ws:';
	  } else if (parsedUrl.protocol === 'https:') {
	    parsedUrl.protocol = 'wss:';
	  }

	  websocket._url = parsedUrl.href;

	  const isSecure = parsedUrl.protocol === 'wss:';
	  const isIpcUrl = parsedUrl.protocol === 'ws+unix:';
	  let invalidUrlMessage;

	  if (parsedUrl.protocol !== 'ws:' && !isSecure && !isIpcUrl) {
	    invalidUrlMessage =
	      'The URL\'s protocol must be one of "ws:", "wss:", ' +
	      '"http:", "https:", or "ws+unix:"';
	  } else if (isIpcUrl && !parsedUrl.pathname) {
	    invalidUrlMessage = "The URL's pathname is empty";
	  } else if (parsedUrl.hash) {
	    invalidUrlMessage = 'The URL contains a fragment identifier';
	  }

	  if (invalidUrlMessage) {
	    const err = new SyntaxError(invalidUrlMessage);

	    if (websocket._redirects === 0) {
	      throw err;
	    } else {
	      emitErrorAndClose(websocket, err);
	      return;
	    }
	  }

	  const defaultPort = isSecure ? 443 : 80;
	  const key = randomBytes(16).toString('base64');
	  const request = isSecure ? https.request : http.request;
	  const protocolSet = new Set();
	  let perMessageDeflate;

	  opts.createConnection =
	    opts.createConnection || (isSecure ? tlsConnect : netConnect);
	  opts.defaultPort = opts.defaultPort || defaultPort;
	  opts.port = parsedUrl.port || defaultPort;
	  opts.host = parsedUrl.hostname.startsWith('[')
	    ? parsedUrl.hostname.slice(1, -1)
	    : parsedUrl.hostname;
	  opts.headers = {
	    ...opts.headers,
	    'Sec-WebSocket-Version': opts.protocolVersion,
	    'Sec-WebSocket-Key': key,
	    Connection: 'Upgrade',
	    Upgrade: 'websocket'
	  };
	  opts.path = parsedUrl.pathname + parsedUrl.search;
	  opts.timeout = opts.handshakeTimeout;

	  if (opts.perMessageDeflate) {
	    perMessageDeflate = new PerMessageDeflate({
	      ...opts.perMessageDeflate,
	      isServer: false,
	      maxPayload: opts.maxPayload
	    });
	    opts.headers['Sec-WebSocket-Extensions'] = format({
	      [PerMessageDeflate.extensionName]: perMessageDeflate.offer()
	    });
	  }
	  if (protocols.length) {
	    for (const protocol of protocols) {
	      if (
	        typeof protocol !== 'string' ||
	        !subprotocolRegex.test(protocol) ||
	        protocolSet.has(protocol)
	      ) {
	        throw new SyntaxError(
	          'An invalid or duplicated subprotocol was specified'
	        );
	      }

	      protocolSet.add(protocol);
	    }

	    opts.headers['Sec-WebSocket-Protocol'] = protocols.join(',');
	  }
	  if (opts.origin) {
	    if (opts.protocolVersion < 13) {
	      opts.headers['Sec-WebSocket-Origin'] = opts.origin;
	    } else {
	      opts.headers.Origin = opts.origin;
	    }
	  }
	  if (parsedUrl.username || parsedUrl.password) {
	    opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
	  }

	  if (isIpcUrl) {
	    const parts = opts.path.split(':');

	    opts.socketPath = parts[0];
	    opts.path = parts[1];
	  }

	  let req;

	  if (opts.followRedirects) {
	    if (websocket._redirects === 0) {
	      websocket._originalIpc = isIpcUrl;
	      websocket._originalSecure = isSecure;
	      websocket._originalHostOrSocketPath = isIpcUrl
	        ? opts.socketPath
	        : parsedUrl.host;

	      const headers = options && options.headers;

	      //
	      // Shallow copy the user provided options so that headers can be changed
	      // without mutating the original object.
	      //
	      options = { ...options, headers: {} };

	      if (headers) {
	        for (const [key, value] of Object.entries(headers)) {
	          options.headers[key.toLowerCase()] = value;
	        }
	      }
	    } else if (websocket.listenerCount('redirect') === 0) {
	      const isSameHost = isIpcUrl
	        ? websocket._originalIpc
	          ? opts.socketPath === websocket._originalHostOrSocketPath
	          : false
	        : websocket._originalIpc
	          ? false
	          : parsedUrl.host === websocket._originalHostOrSocketPath;

	      if (!isSameHost || (websocket._originalSecure && !isSecure)) {
	        //
	        // Match curl 7.77.0 behavior and drop the following headers. These
	        // headers are also dropped when following a redirect to a subdomain.
	        //
	        delete opts.headers.authorization;
	        delete opts.headers.cookie;

	        if (!isSameHost) delete opts.headers.host;

	        opts.auth = undefined;
	      }
	    }

	    //
	    // Match curl 7.77.0 behavior and make the first `Authorization` header win.
	    // If the `Authorization` header is set, then there is nothing to do as it
	    // will take precedence.
	    //
	    if (opts.auth && !options.headers.authorization) {
	      options.headers.authorization =
	        'Basic ' + Buffer.from(opts.auth).toString('base64');
	    }

	    req = websocket._req = request(opts);

	    if (websocket._redirects) {
	      //
	      // Unlike what is done for the `'upgrade'` event, no early exit is
	      // triggered here if the user calls `websocket.close()` or
	      // `websocket.terminate()` from a listener of the `'redirect'` event. This
	      // is because the user can also call `request.destroy()` with an error
	      // before calling `websocket.close()` or `websocket.terminate()` and this
	      // would result in an error being emitted on the `request` object with no
	      // `'error'` event listeners attached.
	      //
	      websocket.emit('redirect', websocket.url, req);
	    }
	  } else {
	    req = websocket._req = request(opts);
	  }

	  if (opts.timeout) {
	    req.on('timeout', () => {
	      abortHandshake(websocket, req, 'Opening handshake has timed out');
	    });
	  }

	  req.on('error', (err) => {
	    if (req === null || req[kAborted]) return;

	    req = websocket._req = null;
	    emitErrorAndClose(websocket, err);
	  });

	  req.on('response', (res) => {
	    const location = res.headers.location;
	    const statusCode = res.statusCode;

	    if (
	      location &&
	      opts.followRedirects &&
	      statusCode >= 300 &&
	      statusCode < 400
	    ) {
	      if (++websocket._redirects > opts.maxRedirects) {
	        abortHandshake(websocket, req, 'Maximum redirects exceeded');
	        return;
	      }

	      req.abort();

	      let addr;

	      try {
	        addr = new URL(location, address);
	      } catch (e) {
	        const err = new SyntaxError(`Invalid URL: ${location}`);
	        emitErrorAndClose(websocket, err);
	        return;
	      }

	      initAsClient(websocket, addr, protocols, options);
	    } else if (!websocket.emit('unexpected-response', req, res)) {
	      abortHandshake(
	        websocket,
	        req,
	        `Unexpected server response: ${res.statusCode}`
	      );
	    }
	  });

	  req.on('upgrade', (res, socket, head) => {
	    websocket.emit('upgrade', res);

	    //
	    // The user may have closed the connection from a listener of the
	    // `'upgrade'` event.
	    //
	    if (websocket.readyState !== WebSocket.CONNECTING) return;

	    req = websocket._req = null;

	    const upgrade = res.headers.upgrade;

	    if (upgrade === undefined || upgrade.toLowerCase() !== 'websocket') {
	      abortHandshake(websocket, socket, 'Invalid Upgrade header');
	      return;
	    }

	    const digest = createHash('sha1')
	      .update(key + GUID)
	      .digest('base64');

	    if (res.headers['sec-websocket-accept'] !== digest) {
	      abortHandshake(websocket, socket, 'Invalid Sec-WebSocket-Accept header');
	      return;
	    }

	    const serverProt = res.headers['sec-websocket-protocol'];
	    let protError;

	    if (serverProt !== undefined) {
	      if (!protocolSet.size) {
	        protError = 'Server sent a subprotocol but none was requested';
	      } else if (!protocolSet.has(serverProt)) {
	        protError = 'Server sent an invalid subprotocol';
	      }
	    } else if (protocolSet.size) {
	      protError = 'Server sent no subprotocol';
	    }

	    if (protError) {
	      abortHandshake(websocket, socket, protError);
	      return;
	    }

	    if (serverProt) websocket._protocol = serverProt;

	    const secWebSocketExtensions = res.headers['sec-websocket-extensions'];

	    if (secWebSocketExtensions !== undefined) {
	      if (!perMessageDeflate) {
	        const message =
	          'Server sent a Sec-WebSocket-Extensions header but no extension ' +
	          'was requested';
	        abortHandshake(websocket, socket, message);
	        return;
	      }

	      let extensions;

	      try {
	        extensions = parse(secWebSocketExtensions);
	      } catch (err) {
	        const message = 'Invalid Sec-WebSocket-Extensions header';
	        abortHandshake(websocket, socket, message);
	        return;
	      }

	      const extensionNames = Object.keys(extensions);

	      if (
	        extensionNames.length !== 1 ||
	        extensionNames[0] !== PerMessageDeflate.extensionName
	      ) {
	        const message = 'Server indicated an extension that was not requested';
	        abortHandshake(websocket, socket, message);
	        return;
	      }

	      try {
	        perMessageDeflate.accept(extensions[PerMessageDeflate.extensionName]);
	      } catch (err) {
	        const message = 'Invalid Sec-WebSocket-Extensions header';
	        abortHandshake(websocket, socket, message);
	        return;
	      }

	      websocket._extensions[PerMessageDeflate.extensionName] =
	        perMessageDeflate;
	    }

	    websocket.setSocket(socket, head, {
	      allowSynchronousEvents: opts.allowSynchronousEvents,
	      generateMask: opts.generateMask,
	      maxBufferedChunks: opts.maxBufferedChunks,
	      maxFragments: opts.maxFragments,
	      maxPayload: opts.maxPayload,
	      skipUTF8Validation: opts.skipUTF8Validation
	    });
	  });

	  if (opts.finishRequest) {
	    opts.finishRequest(req, websocket);
	  } else {
	    req.end();
	  }
	}

	/**
	 * Emit the `'error'` and `'close'` events.
	 *
	 * @param {WebSocket} websocket The WebSocket instance
	 * @param {Error} The error to emit
	 * @private
	 */
	function emitErrorAndClose(websocket, err) {
	  websocket._readyState = WebSocket.CLOSING;
	  //
	  // The following assignment is practically useless and is done only for
	  // consistency.
	  //
	  websocket._errorEmitted = true;
	  websocket.emit('error', err);
	  websocket.emitClose();
	}

	/**
	 * Create a `net.Socket` and initiate a connection.
	 *
	 * @param {Object} options Connection options
	 * @return {net.Socket} The newly created socket used to start the connection
	 * @private
	 */
	function netConnect(options) {
	  options.path = options.socketPath;
	  return net.connect(options);
	}

	/**
	 * Create a `tls.TLSSocket` and initiate a connection.
	 *
	 * @param {Object} options Connection options
	 * @return {tls.TLSSocket} The newly created socket used to start the connection
	 * @private
	 */
	function tlsConnect(options) {
	  options.path = undefined;

	  if (!options.servername && options.servername !== '') {
	    options.servername = net.isIP(options.host) ? '' : options.host;
	  }

	  return tls.connect(options);
	}

	/**
	 * Abort the handshake and emit an error.
	 *
	 * @param {WebSocket} websocket The WebSocket instance
	 * @param {(http.ClientRequest|net.Socket|tls.Socket)} stream The request to
	 *     abort or the socket to destroy
	 * @param {String} message The error message
	 * @private
	 */
	function abortHandshake(websocket, stream, message) {
	  websocket._readyState = WebSocket.CLOSING;

	  const err = new Error(message);
	  Error.captureStackTrace(err, abortHandshake);

	  if (stream.setHeader) {
	    stream[kAborted] = true;
	    stream.abort();

	    if (stream.socket && !stream.socket.destroyed) {
	      //
	      // On Node.js >= 14.3.0 `request.abort()` does not destroy the socket if
	      // called after the request completed. See
	      // https://github.com/websockets/ws/issues/1869.
	      //
	      stream.socket.destroy();
	    }

	    process.nextTick(emitErrorAndClose, websocket, err);
	  } else {
	    stream.destroy(err);
	    stream.once('error', websocket.emit.bind(websocket, 'error'));
	    stream.once('close', websocket.emitClose.bind(websocket));
	  }
	}

	/**
	 * Handle cases where the `ping()`, `pong()`, or `send()` methods are called
	 * when the `readyState` attribute is `CLOSING` or `CLOSED`.
	 *
	 * @param {WebSocket} websocket The WebSocket instance
	 * @param {*} [data] The data to send
	 * @param {Function} [cb] Callback
	 * @private
	 */
	function sendAfterClose(websocket, data, cb) {
	  if (data) {
	    const length = isBlob(data) ? data.size : toBuffer(data).length;

	    //
	    // The `_bufferedAmount` property is used only when the peer is a client and
	    // the opening handshake fails. Under these circumstances, in fact, the
	    // `setSocket()` method is not called, so the `_socket` and `_sender`
	    // properties are set to `null`.
	    //
	    if (websocket._socket) websocket._sender._bufferedBytes += length;
	    else websocket._bufferedAmount += length;
	  }

	  if (cb) {
	    const err = new Error(
	      `WebSocket is not open: readyState ${websocket.readyState} ` +
	        `(${readyStates[websocket.readyState]})`
	    );
	    process.nextTick(cb, err);
	  }
	}

	/**
	 * The listener of the `Receiver` `'conclude'` event.
	 *
	 * @param {Number} code The status code
	 * @param {Buffer} reason The reason for closing
	 * @private
	 */
	function receiverOnConclude(code, reason) {
	  const websocket = this[kWebSocket];

	  websocket._closeFrameReceived = true;
	  websocket._closeMessage = reason;
	  websocket._closeCode = code;

	  if (websocket._socket[kWebSocket] === undefined) return;

	  websocket._socket.removeListener('data', socketOnData);
	  process.nextTick(resume, websocket._socket);

	  if (code === 1005) websocket.close();
	  else websocket.close(code, reason);
	}

	/**
	 * The listener of the `Receiver` `'drain'` event.
	 *
	 * @private
	 */
	function receiverOnDrain() {
	  const websocket = this[kWebSocket];

	  if (!websocket.isPaused) websocket._socket.resume();
	}

	/**
	 * The listener of the `Receiver` `'error'` event.
	 *
	 * @param {(RangeError|Error)} err The emitted error
	 * @private
	 */
	function receiverOnError(err) {
	  const websocket = this[kWebSocket];

	  if (websocket._socket[kWebSocket] !== undefined) {
	    websocket._socket.removeListener('data', socketOnData);

	    //
	    // On Node.js < 14.0.0 the `'error'` event is emitted synchronously. See
	    // https://github.com/websockets/ws/issues/1940.
	    //
	    process.nextTick(resume, websocket._socket);

	    websocket.close(err[kStatusCode]);
	  }

	  if (!websocket._errorEmitted) {
	    websocket._errorEmitted = true;
	    websocket.emit('error', err);
	  }
	}

	/**
	 * The listener of the `Receiver` `'finish'` event.
	 *
	 * @private
	 */
	function receiverOnFinish() {
	  this[kWebSocket].emitClose();
	}

	/**
	 * The listener of the `Receiver` `'message'` event.
	 *
	 * @param {Buffer|ArrayBuffer|Buffer[])} data The message
	 * @param {Boolean} isBinary Specifies whether the message is binary or not
	 * @private
	 */
	function receiverOnMessage(data, isBinary) {
	  this[kWebSocket].emit('message', data, isBinary);
	}

	/**
	 * The listener of the `Receiver` `'ping'` event.
	 *
	 * @param {Buffer} data The data included in the ping frame
	 * @private
	 */
	function receiverOnPing(data) {
	  const websocket = this[kWebSocket];

	  if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
	  websocket.emit('ping', data);
	}

	/**
	 * The listener of the `Receiver` `'pong'` event.
	 *
	 * @param {Buffer} data The data included in the pong frame
	 * @private
	 */
	function receiverOnPong(data) {
	  this[kWebSocket].emit('pong', data);
	}

	/**
	 * Resume a readable stream
	 *
	 * @param {Readable} stream The readable stream
	 * @private
	 */
	function resume(stream) {
	  stream.resume();
	}

	/**
	 * The `Sender` error event handler.
	 *
	 * @param {Error} The error
	 * @private
	 */
	function senderOnError(err) {
	  const websocket = this[kWebSocket];

	  if (websocket.readyState === WebSocket.CLOSED) return;
	  if (websocket.readyState === WebSocket.OPEN) {
	    websocket._readyState = WebSocket.CLOSING;
	    setCloseTimer(websocket);
	  }

	  //
	  // `socket.end()` is used instead of `socket.destroy()` to allow the other
	  // peer to finish sending queued data. There is no need to set a timer here
	  // because `CLOSING` means that it is already set or not needed.
	  //
	  this._socket.end();

	  if (!websocket._errorEmitted) {
	    websocket._errorEmitted = true;
	    websocket.emit('error', err);
	  }
	}

	/**
	 * Set a timer to destroy the underlying raw socket of a WebSocket.
	 *
	 * @param {WebSocket} websocket The WebSocket instance
	 * @private
	 */
	function setCloseTimer(websocket) {
	  websocket._closeTimer = setTimeout(
	    websocket._socket.destroy.bind(websocket._socket),
	    websocket._closeTimeout
	  );
	}

	/**
	 * The listener of the socket `'close'` event.
	 *
	 * @private
	 */
	function socketOnClose() {
	  const websocket = this[kWebSocket];

	  this.removeListener('close', socketOnClose);
	  this.removeListener('data', socketOnData);
	  this.removeListener('end', socketOnEnd);

	  websocket._readyState = WebSocket.CLOSING;

	  //
	  // The close frame might not have been received or the `'end'` event emitted,
	  // for example, if the socket was destroyed due to an error. Ensure that the
	  // `receiver` stream is closed after writing any remaining buffered data to
	  // it. If the readable side of the socket is in flowing mode then there is no
	  // buffered data as everything has been already written. If instead, the
	  // socket is paused, any possible buffered data will be read as a single
	  // chunk.
	  //
	  if (
	    !this._readableState.endEmitted &&
	    !websocket._closeFrameReceived &&
	    !websocket._receiver._writableState.errorEmitted &&
	    this._readableState.length !== 0
	  ) {
	    const chunk = this.read(this._readableState.length);

	    websocket._receiver.write(chunk);
	  }

	  websocket._receiver.end();

	  this[kWebSocket] = undefined;

	  clearTimeout(websocket._closeTimer);

	  if (
	    websocket._receiver._writableState.finished ||
	    websocket._receiver._writableState.errorEmitted
	  ) {
	    websocket.emitClose();
	  } else {
	    websocket._receiver.on('error', receiverOnFinish);
	    websocket._receiver.on('finish', receiverOnFinish);
	  }
	}

	/**
	 * The listener of the socket `'data'` event.
	 *
	 * @param {Buffer} chunk A chunk of data
	 * @private
	 */
	function socketOnData(chunk) {
	  if (!this[kWebSocket]._receiver.write(chunk)) {
	    this.pause();
	  }
	}

	/**
	 * The listener of the socket `'end'` event.
	 *
	 * @private
	 */
	function socketOnEnd() {
	  const websocket = this[kWebSocket];

	  websocket._readyState = WebSocket.CLOSING;
	  websocket._receiver.end();
	  this.end();
	}

	/**
	 * The listener of the socket `'error'` event.
	 *
	 * @private
	 */
	function socketOnError() {
	  const websocket = this[kWebSocket];

	  this.removeListener('error', socketOnError);
	  this.on('error', NOOP);

	  if (websocket) {
	    websocket._readyState = WebSocket.CLOSING;
	    this.destroy();
	  }
	}
	return websocket;
}

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^WebSocket$" }] */

var stream;
var hasRequiredStream;

function requireStream () {
	if (hasRequiredStream) return stream;
	hasRequiredStream = 1;

	requireWebsocket();
	const { Duplex } = require$$0$2;

	/**
	 * Emits the `'close'` event on a stream.
	 *
	 * @param {Duplex} stream The stream.
	 * @private
	 */
	function emitClose(stream) {
	  stream.emit('close');
	}

	/**
	 * The listener of the `'end'` event.
	 *
	 * @private
	 */
	function duplexOnEnd() {
	  if (!this.destroyed && this._writableState.finished) {
	    this.destroy();
	  }
	}

	/**
	 * The listener of the `'error'` event.
	 *
	 * @param {Error} err The error
	 * @private
	 */
	function duplexOnError(err) {
	  this.removeListener('error', duplexOnError);
	  this.destroy();
	  if (this.listenerCount('error') === 0) {
	    // Do not suppress the throwing behavior.
	    this.emit('error', err);
	  }
	}

	/**
	 * Wraps a `WebSocket` in a duplex stream.
	 *
	 * @param {WebSocket} ws The `WebSocket` to wrap
	 * @param {Object} [options] The options for the `Duplex` constructor
	 * @return {Duplex} The duplex stream
	 * @public
	 */
	function createWebSocketStream(ws, options) {
	  let terminateOnDestroy = true;

	  const duplex = new Duplex({
	    ...options,
	    autoDestroy: false,
	    emitClose: false,
	    objectMode: false,
	    writableObjectMode: false
	  });

	  ws.on('message', function message(msg, isBinary) {
	    const data =
	      !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;

	    if (!duplex.push(data)) ws.pause();
	  });

	  ws.once('error', function error(err) {
	    if (duplex.destroyed) return;

	    // Prevent `ws.terminate()` from being called by `duplex._destroy()`.
	    //
	    // - If the `'error'` event is emitted before the `'open'` event, then
	    //   `ws.terminate()` is a noop as no socket is assigned.
	    // - Otherwise, the error is re-emitted by the listener of the `'error'`
	    //   event of the `Receiver` object. The listener already closes the
	    //   connection by calling `ws.close()`. This allows a close frame to be
	    //   sent to the other peer. If `ws.terminate()` is called right after this,
	    //   then the close frame might not be sent.
	    terminateOnDestroy = false;
	    duplex.destroy(err);
	  });

	  ws.once('close', function close() {
	    if (duplex.destroyed) return;

	    duplex.push(null);
	  });

	  duplex._destroy = function (err, callback) {
	    if (ws.readyState === ws.CLOSED) {
	      callback(err);
	      process.nextTick(emitClose, duplex);
	      return;
	    }

	    let called = false;

	    ws.once('error', function error(err) {
	      called = true;
	      callback(err);
	    });

	    ws.once('close', function close() {
	      if (!called) callback(err);
	      process.nextTick(emitClose, duplex);
	    });

	    if (terminateOnDestroy) ws.terminate();
	  };

	  duplex._final = function (callback) {
	    if (ws.readyState === ws.CONNECTING) {
	      ws.once('open', function open() {
	        duplex._final(callback);
	      });
	      return;
	    }

	    // If the value of the `_socket` property is `null` it means that `ws` is a
	    // client websocket and the handshake failed. In fact, when this happens, a
	    // socket is never assigned to the websocket. Wait for the `'error'` event
	    // that will be emitted by the websocket.
	    if (ws._socket === null) return;

	    if (ws._socket._writableState.finished) {
	      callback();
	      if (duplex._readableState.endEmitted) duplex.destroy();
	    } else {
	      ws._socket.once('finish', function finish() {
	        // `duplex` is not destroyed here because the `'end'` event will be
	        // emitted on `duplex` after this `'finish'` event. The EOF signaling
	        // `null` chunk is, in fact, pushed when the websocket emits `'close'`.
	        callback();
	      });
	      ws.close();
	    }
	  };

	  duplex._read = function () {
	    if (ws.isPaused) ws.resume();
	  };

	  duplex._write = function (chunk, encoding, callback) {
	    if (ws.readyState === ws.CONNECTING) {
	      ws.once('open', function open() {
	        duplex._write(chunk, encoding, callback);
	      });
	      return;
	    }

	    ws.send(chunk, callback);
	  };

	  duplex.on('end', duplexOnEnd);
	  duplex.on('error', duplexOnError);
	  return duplex;
	}

	stream = createWebSocketStream;
	return stream;
}

requireStream();

requireExtension();

requirePermessageDeflate();

requireReceiver();

requireSender();

var subprotocol;
var hasRequiredSubprotocol;

function requireSubprotocol () {
	if (hasRequiredSubprotocol) return subprotocol;
	hasRequiredSubprotocol = 1;

	const { tokenChars } = requireValidation();

	/**
	 * Parses the `Sec-WebSocket-Protocol` header into a set of subprotocol names.
	 *
	 * @param {String} header The field value of the header
	 * @return {Set} The subprotocol names
	 * @public
	 */
	function parse(header) {
	  const protocols = new Set();
	  let start = -1;
	  let end = -1;
	  let i = 0;

	  for (i; i < header.length; i++) {
	    const code = header.charCodeAt(i);

	    if (end === -1 && tokenChars[code] === 1) {
	      if (start === -1) start = i;
	    } else if (
	      i !== 0 &&
	      (code === 0x20 /* ' ' */ || code === 0x09) /* '\t' */
	    ) {
	      if (end === -1 && start !== -1) end = i;
	    } else if (code === 0x2c /* ',' */) {
	      if (start === -1) {
	        throw new SyntaxError(`Unexpected character at index ${i}`);
	      }

	      if (end === -1) end = i;

	      const protocol = header.slice(start, end);

	      if (protocols.has(protocol)) {
	        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
	      }

	      protocols.add(protocol);
	      start = end = -1;
	    } else {
	      throw new SyntaxError(`Unexpected character at index ${i}`);
	    }
	  }

	  if (start === -1 || end !== -1) {
	    throw new SyntaxError('Unexpected end of input');
	  }

	  const protocol = header.slice(start, i);

	  if (protocols.has(protocol)) {
	    throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
	  }

	  protocols.add(protocol);
	  return protocols;
	}

	subprotocol = { parse };
	return subprotocol;
}

requireSubprotocol();

requireWebsocket();

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^Duplex$", "caughtErrors": "none" }] */

var websocketServer;
var hasRequiredWebsocketServer;

function requireWebsocketServer () {
	if (hasRequiredWebsocketServer) return websocketServer;
	hasRequiredWebsocketServer = 1;

	const EventEmitter = require$$0$3;
	const http = require$$2$1;
	const { Duplex } = require$$0$2;
	const { createHash } = require$$1;

	const extension = requireExtension();
	const PerMessageDeflate = requirePermessageDeflate();
	const subprotocol = requireSubprotocol();
	const WebSocket = requireWebsocket();
	const { CLOSE_TIMEOUT, GUID, kWebSocket } = requireConstants();

	const keyRegex = /^[+/0-9A-Za-z]{22}==$/;

	const RUNNING = 0;
	const CLOSING = 1;
	const CLOSED = 2;

	/**
	 * Class representing a WebSocket server.
	 *
	 * @extends EventEmitter
	 */
	class WebSocketServer extends EventEmitter {
	  /**
	   * Create a `WebSocketServer` instance.
	   *
	   * @param {Object} options Configuration options
	   * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
	   *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
	   *     multiple times in the same tick
	   * @param {Boolean} [options.autoPong=true] Specifies whether or not to
	   *     automatically send a pong in response to a ping
	   * @param {Number} [options.backlog=511] The maximum length of the queue of
	   *     pending connections
	   * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
	   *     track clients
	   * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
	   *     wait for the closing handshake to finish after `websocket.close()` is
	   *     called
	   * @param {Function} [options.handleProtocols] A hook to handle protocols
	   * @param {String} [options.host] The hostname where to bind the server
	   * @param {Number} [options.maxBufferedChunks=262144] The maximum number of
	   *     buffered data chunks
	   * @param {Number} [options.maxFragments=16384] The maximum number of message
	   *     fragments
	   * @param {Number} [options.maxPayload=104857600] The maximum allowed message
	   *     size
	   * @param {Boolean} [options.noServer=false] Enable no server mode
	   * @param {String} [options.path] Accept only connections matching this path
	   * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
	   *     permessage-deflate
	   * @param {Number} [options.port] The port where to bind the server
	   * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
	   *     server to use
	   * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
	   *     not to skip UTF-8 validation for text and close messages
	   * @param {Function} [options.verifyClient] A hook to reject connections
	   * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
	   *     class to use. It must be the `WebSocket` class or class that extends it
	   * @param {Function} [callback] A listener for the `listening` event
	   */
	  constructor(options, callback) {
	    super();

	    options = {
	      allowSynchronousEvents: true,
	      autoPong: true,
	      maxBufferedChunks: 256 * 1024,
	      maxFragments: 16 * 1024,
	      maxPayload: 100 * 1024 * 1024,
	      skipUTF8Validation: false,
	      perMessageDeflate: false,
	      handleProtocols: null,
	      clientTracking: true,
	      closeTimeout: CLOSE_TIMEOUT,
	      verifyClient: null,
	      noServer: false,
	      backlog: null, // use default (511 as implemented in net.js)
	      server: null,
	      host: null,
	      path: null,
	      port: null,
	      WebSocket,
	      ...options
	    };

	    if (
	      (options.port == null && !options.server && !options.noServer) ||
	      (options.port != null && (options.server || options.noServer)) ||
	      (options.server && options.noServer)
	    ) {
	      throw new TypeError(
	        'One and only one of the "port", "server", or "noServer" options ' +
	          'must be specified'
	      );
	    }

	    if (options.port != null) {
	      this._server = http.createServer((req, res) => {
	        const body = http.STATUS_CODES[426];

	        res.writeHead(426, {
	          'Content-Length': body.length,
	          'Content-Type': 'text/plain'
	        });
	        res.end(body);
	      });
	      this._server.listen(
	        options.port,
	        options.host,
	        options.backlog,
	        callback
	      );
	    } else if (options.server) {
	      this._server = options.server;
	    }

	    if (this._server) {
	      const emitConnection = this.emit.bind(this, 'connection');

	      this._removeListeners = addListeners(this._server, {
	        listening: this.emit.bind(this, 'listening'),
	        error: this.emit.bind(this, 'error'),
	        upgrade: (req, socket, head) => {
	          this.handleUpgrade(req, socket, head, emitConnection);
	        }
	      });
	    }

	    if (options.perMessageDeflate === true) options.perMessageDeflate = {};
	    if (options.clientTracking) {
	      this.clients = new Set();
	      this._shouldEmitClose = false;
	    }

	    this.options = options;
	    this._state = RUNNING;
	  }

	  /**
	   * Returns the bound address, the address family name, and port of the server
	   * as reported by the operating system if listening on an IP socket.
	   * If the server is listening on a pipe or UNIX domain socket, the name is
	   * returned as a string.
	   *
	   * @return {(Object|String|null)} The address of the server
	   * @public
	   */
	  address() {
	    if (this.options.noServer) {
	      throw new Error('The server is operating in "noServer" mode');
	    }

	    if (!this._server) return null;
	    return this._server.address();
	  }

	  /**
	   * Stop the server from accepting new connections and emit the `'close'` event
	   * when all existing connections are closed.
	   *
	   * @param {Function} [cb] A one-time listener for the `'close'` event
	   * @public
	   */
	  close(cb) {
	    if (this._state === CLOSED) {
	      if (cb) {
	        this.once('close', () => {
	          cb(new Error('The server is not running'));
	        });
	      }

	      process.nextTick(emitClose, this);
	      return;
	    }

	    if (cb) this.once('close', cb);

	    if (this._state === CLOSING) return;
	    this._state = CLOSING;

	    if (this.options.noServer || this.options.server) {
	      if (this._server) {
	        this._removeListeners();
	        this._removeListeners = this._server = null;
	      }

	      if (this.clients) {
	        if (!this.clients.size) {
	          process.nextTick(emitClose, this);
	        } else {
	          this._shouldEmitClose = true;
	        }
	      } else {
	        process.nextTick(emitClose, this);
	      }
	    } else {
	      const server = this._server;

	      this._removeListeners();
	      this._removeListeners = this._server = null;

	      //
	      // The HTTP/S server was created internally. Close it, and rely on its
	      // `'close'` event.
	      //
	      server.close(() => {
	        emitClose(this);
	      });
	    }
	  }

	  /**
	   * See if a given request should be handled by this server instance.
	   *
	   * @param {http.IncomingMessage} req Request object to inspect
	   * @return {Boolean} `true` if the request is valid, else `false`
	   * @public
	   */
	  shouldHandle(req) {
	    if (this.options.path) {
	      const index = req.url.indexOf('?');
	      const pathname = index !== -1 ? req.url.slice(0, index) : req.url;

	      if (pathname !== this.options.path) return false;
	    }

	    return true;
	  }

	  /**
	   * Handle a HTTP Upgrade request.
	   *
	   * @param {http.IncomingMessage} req The request object
	   * @param {Duplex} socket The network socket between the server and client
	   * @param {Buffer} head The first packet of the upgraded stream
	   * @param {Function} cb Callback
	   * @public
	   */
	  handleUpgrade(req, socket, head, cb) {
	    socket.on('error', socketOnError);

	    const key = req.headers['sec-websocket-key'];
	    const upgrade = req.headers.upgrade;
	    const version = +req.headers['sec-websocket-version'];

	    if (req.method !== 'GET') {
	      const message = 'Invalid HTTP method';
	      abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
	      return;
	    }

	    if (upgrade === undefined || upgrade.toLowerCase() !== 'websocket') {
	      const message = 'Invalid Upgrade header';
	      abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
	      return;
	    }

	    if (key === undefined || !keyRegex.test(key)) {
	      const message = 'Missing or invalid Sec-WebSocket-Key header';
	      abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
	      return;
	    }

	    if (version !== 13 && version !== 8) {
	      const message = 'Missing or invalid Sec-WebSocket-Version header';
	      abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
	        'Sec-WebSocket-Version': '13, 8'
	      });
	      return;
	    }

	    if (!this.shouldHandle(req)) {
	      abortHandshake(socket, 400);
	      return;
	    }

	    const secWebSocketProtocol = req.headers['sec-websocket-protocol'];
	    let protocols = new Set();

	    if (secWebSocketProtocol !== undefined) {
	      try {
	        protocols = subprotocol.parse(secWebSocketProtocol);
	      } catch (err) {
	        const message = 'Invalid Sec-WebSocket-Protocol header';
	        abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
	        return;
	      }
	    }

	    const secWebSocketExtensions = req.headers['sec-websocket-extensions'];
	    const extensions = {};

	    if (
	      this.options.perMessageDeflate &&
	      secWebSocketExtensions !== undefined
	    ) {
	      const perMessageDeflate = new PerMessageDeflate({
	        ...this.options.perMessageDeflate,
	        isServer: true,
	        maxPayload: this.options.maxPayload
	      });

	      try {
	        const offers = extension.parse(secWebSocketExtensions);

	        if (offers[PerMessageDeflate.extensionName]) {
	          perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
	          extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
	        }
	      } catch (err) {
	        const message =
	          'Invalid or unacceptable Sec-WebSocket-Extensions header';
	        abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
	        return;
	      }
	    }

	    //
	    // Optionally call external client verification handler.
	    //
	    if (this.options.verifyClient) {
	      const info = {
	        origin:
	          req.headers[`${version === 8 ? 'sec-websocket-origin' : 'origin'}`],
	        secure: !!(req.socket.authorized || req.socket.encrypted),
	        req
	      };

	      if (this.options.verifyClient.length === 2) {
	        this.options.verifyClient(info, (verified, code, message, headers) => {
	          if (!verified) {
	            return abortHandshake(socket, code || 401, message, headers);
	          }

	          this.completeUpgrade(
	            extensions,
	            key,
	            protocols,
	            req,
	            socket,
	            head,
	            cb
	          );
	        });
	        return;
	      }

	      if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
	    }

	    this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
	  }

	  /**
	   * Upgrade the connection to WebSocket.
	   *
	   * @param {Object} extensions The accepted extensions
	   * @param {String} key The value of the `Sec-WebSocket-Key` header
	   * @param {Set} protocols The subprotocols
	   * @param {http.IncomingMessage} req The request object
	   * @param {Duplex} socket The network socket between the server and client
	   * @param {Buffer} head The first packet of the upgraded stream
	   * @param {Function} cb Callback
	   * @throws {Error} If called more than once with the same socket
	   * @private
	   */
	  completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
	    //
	    // Destroy the socket if the client has already sent a FIN packet.
	    //
	    if (!socket.readable || !socket.writable) return socket.destroy();

	    if (socket[kWebSocket]) {
	      throw new Error(
	        'server.handleUpgrade() was called more than once with the same ' +
	          'socket, possibly due to a misconfiguration'
	      );
	    }

	    if (this._state > RUNNING) return abortHandshake(socket, 503);

	    const digest = createHash('sha1')
	      .update(key + GUID)
	      .digest('base64');

	    const headers = [
	      'HTTP/1.1 101 Switching Protocols',
	      'Upgrade: websocket',
	      'Connection: Upgrade',
	      `Sec-WebSocket-Accept: ${digest}`
	    ];

	    const ws = new this.options.WebSocket(null, undefined, this.options);

	    if (protocols.size) {
	      //
	      // Optionally call external protocol selection handler.
	      //
	      const protocol = this.options.handleProtocols
	        ? this.options.handleProtocols(protocols, req)
	        : protocols.values().next().value;

	      if (protocol) {
	        headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
	        ws._protocol = protocol;
	      }
	    }

	    if (extensions[PerMessageDeflate.extensionName]) {
	      const params = extensions[PerMessageDeflate.extensionName].params;
	      const value = extension.format({
	        [PerMessageDeflate.extensionName]: [params]
	      });
	      headers.push(`Sec-WebSocket-Extensions: ${value}`);
	      ws._extensions = extensions;
	    }

	    //
	    // Allow external modification/inspection of handshake headers.
	    //
	    this.emit('headers', headers, req);

	    socket.write(headers.concat('\r\n').join('\r\n'));
	    socket.removeListener('error', socketOnError);

	    ws.setSocket(socket, head, {
	      allowSynchronousEvents: this.options.allowSynchronousEvents,
	      maxBufferedChunks: this.options.maxBufferedChunks,
	      maxFragments: this.options.maxFragments,
	      maxPayload: this.options.maxPayload,
	      skipUTF8Validation: this.options.skipUTF8Validation
	    });

	    if (this.clients) {
	      this.clients.add(ws);
	      ws.on('close', () => {
	        this.clients.delete(ws);

	        if (this._shouldEmitClose && !this.clients.size) {
	          process.nextTick(emitClose, this);
	        }
	      });
	    }

	    cb(ws, req);
	  }
	}

	websocketServer = WebSocketServer;

	/**
	 * Add event listeners on an `EventEmitter` using a map of <event, listener>
	 * pairs.
	 *
	 * @param {EventEmitter} server The event emitter
	 * @param {Object.<String, Function>} map The listeners to add
	 * @return {Function} A function that will remove the added listeners when
	 *     called
	 * @private
	 */
	function addListeners(server, map) {
	  for (const event of Object.keys(map)) server.on(event, map[event]);

	  return function removeListeners() {
	    for (const event of Object.keys(map)) {
	      server.removeListener(event, map[event]);
	    }
	  };
	}

	/**
	 * Emit a `'close'` event on an `EventEmitter`.
	 *
	 * @param {EventEmitter} server The event emitter
	 * @private
	 */
	function emitClose(server) {
	  server._state = CLOSED;
	  server.emit('close');
	}

	/**
	 * Handle socket errors.
	 *
	 * @private
	 */
	function socketOnError() {
	  this.destroy();
	}

	/**
	 * Close the connection when preconditions are not fulfilled.
	 *
	 * @param {Duplex} socket The socket of the upgrade request
	 * @param {Number} code The HTTP response status code
	 * @param {String} [message] The HTTP response body
	 * @param {Object} [headers] Additional HTTP response headers
	 * @private
	 */
	function abortHandshake(socket, code, message, headers) {
	  //
	  // The socket is writable unless the user destroyed or ended it before calling
	  // `server.handleUpgrade()` or in the `verifyClient` function, which is a user
	  // error. Handling this does not make much sense as the worst that can happen
	  // is that some of the data written by the user might be discarded due to the
	  // call to `socket.end()` below, which triggers an `'error'` event that in
	  // turn causes the socket to be destroyed.
	  //
	  message = message || http.STATUS_CODES[code];
	  headers = {
	    Connection: 'close',
	    'Content-Type': 'text/html',
	    'Content-Length': Buffer.byteLength(message),
	    ...headers
	  };

	  socket.once('finish', socket.destroy);

	  socket.end(
	    `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r\n` +
	      Object.keys(headers)
	        .map((h) => `${h}: ${headers[h]}`)
	        .join('\r\n') +
	      '\r\n\r\n' +
	      message
	  );
	}

	/**
	 * Emit a `'wsClientError'` event on a `WebSocketServer` if there is at least
	 * one listener for it, otherwise call `abortHandshake()`.
	 *
	 * @param {WebSocketServer} server The WebSocket server
	 * @param {http.IncomingMessage} req The request object
	 * @param {Duplex} socket The socket of the upgrade request
	 * @param {Number} code The HTTP response status code
	 * @param {String} message The HTTP response body
	 * @param {Object} [headers] The HTTP response headers
	 * @private
	 */
	function abortHandshakeOrEmitwsClientError(
	  server,
	  req,
	  socket,
	  code,
	  message,
	  headers
	) {
	  if (server.listenerCount('wsClientError')) {
	    const err = new Error(message);
	    Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);

	    server.emit('wsClientError', err, socket, req);
	  } else {
	    abortHandshake(socket, code, message, headers);
	  }
	}
	return websocketServer;
}

var websocketServerExports = requireWebsocketServer();
var WebSocketServer = /*@__PURE__*/getDefaultExportFromCjs(websocketServerExports);

async function createViteServer(inlineConfig) {
	// Vite prints an error (https://github.com/vitejs/vite/issues/14328)
	// But Vitest works correctly either way
	const error = console.error;
	console.error = (...args) => {
		if (typeof args[0] === "string" && args[0].includes("WebSocket server error:")) return;
		error(...args);
	};
	const server = await createServer(inlineConfig);
	console.error = error;
	return server;
}
function isFileServingAllowed(configOrUrl, urlOrServer) {
	const config = typeof urlOrServer === "string" ? configOrUrl : urlOrServer.config;
	const url = typeof urlOrServer === "string" ? urlOrServer : configOrUrl;
	if (!config.server.fs.strict) return true;
	const filePath = fsPathFromUrl(url);
	return isFileLoadingAllowed(config, filePath);
}
const FS_PREFIX = "/@fs/";
const VOLUME_RE = /^[A-Z]:/i;
function fsPathFromId(id) {
	const fsPath = normalizePath(id.startsWith(FS_PREFIX) ? id.slice(5) : id);
	return fsPath[0] === "/" || VOLUME_RE.test(fsPath) ? fsPath : `/${fsPath}`;
}
function fsPathFromUrl(url) {
	return fsPathFromId(cleanUrl(url));
}

function getTestFileEnvironment(project, testFile, browser = false) {
	if (browser) return project.vite.environments.client;
	else for (const name in project.vite.environments) {
		const env = project.vite.environments[name];
		if (env.moduleGraph.getModuleById(testFile)) return env;
	}
}

async function getModuleGraph(ctx, projectName, testFilePath, viteEnvironment) {
	const graph = {};
	const externalized = /* @__PURE__ */ new Set();
	const inlined = /* @__PURE__ */ new Set();
	const project = ctx.getProjectByName(projectName);
	const browser = project.config.browser.enabled;
	let environment;
	if (viteEnvironment) environment = project.vite.environments[viteEnvironment];
	else environment = project.config.experimental.viteModuleRunner === false ? project.vite.environments.__vitest__ : getTestFileEnvironment(project, testFilePath, browser);
	if (!environment) throw new Error(`Cannot find environment for ${testFilePath}`);
	const seen = /* @__PURE__ */ new Map();
	function get(mod) {
		if (!mod || !mod.id) return;
		if (mod.id === "\0vitest/browser" || mod.id.includes("plugin-vue:export-helper")) return;
		if (seen.has(mod)) return seen.get(mod);
		const id = clearId(mod.id);
		seen.set(mod, id);
		if (id.startsWith("__vite-browser-external:")) {
			const external = id.slice(24);
			externalized.add(external);
			return external;
		}
		const external = project._resolver.wasExternalized(id);
		if (typeof external === "string") {
			externalized.add(external);
			return external;
		}
		if (browser && mod.file?.includes(project.browser.vite.config.cacheDir)) {
			externalized.add(mod.id);
			return id;
		}
		inlined.add(id);
		const mods = Array.from(mod.importedModules).filter((i) => i.id && !i.id.includes("/vitest/dist/"));
		graph[id] = mods.map((m) => get(m)).filter(Boolean);
		return id;
	}
	get(environment.moduleGraph.getModuleById(testFilePath));
	project.config.setupFiles.forEach((setupFile) => {
		get(environment.moduleGraph.getModuleById(setupFile));
	});
	return {
		graph,
		externalized: Array.from(externalized),
		inlined: Array.from(inlined)
	};
}
function clearId(id) {
	return id?.replace(/\?v=\w+$/, "") || "";
}

// Serialization support utils.
function cloneByOwnProperties(value) {
	// Clones the value's properties into a new Object. The simpler approach of
	// Object.assign() won't work in the case that properties are not enumerable.
	return Object.getOwnPropertyNames(value).reduce((clone, prop) => {
		clone[prop] = value[prop];
		return clone;
	}, {});
}
/**
* Replacer function for serialization methods such as JS.stringify() or
* flatted.stringify().
*/
function stringifyReplace(key, value) {
	if (value instanceof Error) {
		const cloned = cloneByOwnProperties(value);
		return {
			name: value.name,
			message: value.message,
			stack: value.stack,
			...cloned
		};
	} else return value;
}

function isValidApiRequest(config, req) {
	const url = new URL(req.url ?? "", "http://localhost");
	// validate token. token is injected in ui/tester/orchestrator html, which is cross origin protected.
	try {
		const token = url.searchParams.get("token");
		if (token && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(config.api.token))) return true;
	} 
	// an error is thrown when the length is incorrect
catch {}
	return false;
}

function setup(ctx, _server) {
	const wss = new WebSocketServer({ noServer: true });
	const clients = /* @__PURE__ */ new Map();
	(_server || ctx.vite).httpServer?.on("upgrade", (request, socket, head) => {
		if (!request.url) return;
		const { pathname } = new URL(request.url, "http://localhost");
		if (pathname !== API_PATH) return;
		if (!isValidApiRequest(ctx.config, request)) {
			socket.destroy();
			return;
		}
		wss.handleUpgrade(request, socket, head, (ws) => {
			wss.emit("connection", ws, request);
			setupClient(ws);
		});
	});
	function setupClient(ws) {
		const rpc = createBirpc({
			getFiles() {
				return ctx.state.getFiles();
			},
			getPaths() {
				return ctx.state.getPaths();
			},
			async readTestFile(id) {
				if (!ctx.state.filesMap.has(id) || !existsSync(id)) return null;
				return promises.readFile(id, "utf-8");
			},
			async saveTestFile(id, content) {
				if (!ctx.state.filesMap.has(id) || !existsSync(id)) throw new Error(`Test file "${id}" was not registered, so it cannot be updated using the API.`);
				// silently ignore write attempts if not allowed
				if (!ctx.config.api.allowWrite) return;
				return promises.writeFile(id, content, "utf-8");
			},
			async rerun(files, resetTestNamePattern) {
				// silently ignore exec attempts if not allowed
				if (!ctx.config.api.allowExec) return;
				await ctx.rerunFiles(files, void 0, true, resetTestNamePattern);
			},
			async rerunTask(id) {
				// silently ignore exec attempts if not allowed
				if (!ctx.config.api.allowExec) return;
				await ctx.rerunTask(id);
			},
			getConfig() {
				return ctx.serializedRootConfig;
			},
			getResolvedProjectLabels() {
				return ctx.projects.map((p) => ({
					name: p.name,
					color: p.color
				}));
			},
			async getExternalResult(moduleId, testFileTaskId) {
				const testModule = ctx.state.getReportedEntityById(testFileTaskId);
				if (!testModule) return;
				if (!isFileServingAllowed(testModule.project.vite.config, moduleId)) return;
				const result = {};
				try {
					result.source = await promises.readFile(moduleId, "utf-8");
				} catch {}
				return result;
			},
			async getTransformResult(projectName, moduleId, testFileTaskId) {
				const project = ctx.getProjectByName(projectName);
				const testModule = ctx.state.getReportedEntityById(testFileTaskId);
				if (!testModule || !isFileServingAllowed(project.vite.config, moduleId)) return;
				const browser = !!project.config.browser.enabled;
				const environment = getTestFileEnvironment(project, testModule.moduleId, browser);
				const moduleNode = environment?.moduleGraph.getModuleById(moduleId);
				if (!environment || !moduleNode?.transformResult) return;
				const result = moduleNode.transformResult;
				try {
					result.source = result.source || (moduleNode.file ? await promises.readFile(moduleNode.file, "utf-8") : void 0);
				} catch {}
				// TODO: store this in HTML reporter separately
				const transformDuration = ctx.state.metadata[projectName]?.duration[moduleNode.url]?.[0];
				if (transformDuration != null) result.transformTime = transformDuration;
				try {
					const diagnostic = await ctx.experimental_getSourceModuleDiagnostic(moduleId, testModule);
					result.modules = diagnostic.modules;
					result.untrackedModules = diagnostic.untrackedModules;
				} catch {}
				return result;
			},
			async getModuleGraph(project, id, viteEnvironment) {
				return getModuleGraph(ctx, project, id, viteEnvironment);
			},
			async updateSnapshot(file) {
				// silently ignore exec/write attempts if not allowed
				// this function both executes the code and write snapshots
				if (!ctx.config.api.allowExec || !ctx.config.api.allowWrite) return;
				if (!file) await ctx.updateSnapshot();
				else await ctx.updateSnapshot([file.filepath]);
			},
			getUnhandledErrors() {
				return ctx.state.getUnhandledErrors();
			},
			async getTestFiles() {
				return (await ctx.globTestSpecifications()).map((spec) => [
					{
						name: spec.project.config.name,
						root: spec.project.config.root
					},
					spec.moduleId,
					{ pool: spec.pool }
				]);
			}
		}, {
			post: (msg) => ws.send(msg),
			on: (fn) => ws.on("message", fn),
			eventNames: [
				"onUserConsoleLog",
				"onFinished",
				"onFinishedReportCoverage",
				"onCollected",
				"onTaskUpdate",
				"onTestRemoved"
			],
			serialize: (data) => stringify(data, stringifyReplace),
			deserialize: parse,
			timeout: -1
		});
		clients.set(ws, rpc);
		ws.on("close", () => {
			clients.delete(ws);
			rpc.$close(/* @__PURE__ */ new Error("[vitest-api]: Pending methods while closing rpc"));
		});
	}
	ctx.reporters.push(new WebSocketReporter(ctx, wss, clients));
}
class WebSocketReporter {
	ctx;
	wss;
	clients;
	start = 0;
	end = 0;
	constructor(ctx, wss, clients) {
		this.ctx = ctx;
		this.wss = wss;
		this.clients = clients;
	}
	onTestModuleCollected(testModule) {
		if (this.clients.size === 0) return;
		this.clients.forEach((client) => {
			client.onCollected?.([testModule.task])?.catch?.(noop$1);
		});
	}
	onTestRunStart(specifications) {
		if (this.clients.size === 0) return;
		this.start = performance$1.now();
		const serializedSpecs = specifications.map((spec) => spec.toJSON());
		this.clients.forEach((client) => {
			client.onSpecsCollected?.(serializedSpecs)?.catch?.(noop$1);
		});
	}
	async onTestCaseAnnotate(testCase, annotation) {
		if (this.clients.size === 0) return;
		this.clients.forEach((client) => {
			client.onTestAnnotate?.(testCase.id, annotation)?.catch?.(noop$1);
		});
	}
	async onTestCaseArtifactRecord(testCase, artifact) {
		if (this.clients.size === 0) return;
		this.clients.forEach((client) => {
			client.onTestArtifactRecord?.(testCase.id, artifact)?.catch?.(noop$1);
		});
	}
	async onTaskUpdate(packs, events) {
		if (this.clients.size === 0) return;
		this.clients.forEach((client) => {
			client.onTaskUpdate?.(packs, events)?.catch?.(noop$1);
		});
	}
	onTestRemoved(trigger) {
		if (this.clients.size === 0) return;
		this.clients.forEach((client) => {
			client.onTestRemoved?.(trigger)?.catch?.(noop$1);
		});
	}
	sum(items, cb) {
		return items.reduce((total, next) => {
			return total + Math.max(cb(next) || 0, 0);
		}, 0);
	}
	onTestRunEnd(testModules, unhandledErrors) {
		if (!this.clients.size) return;
		const files = testModules.map((testModule) => testModule.task);
		const errors = [...unhandledErrors];
		this.end = performance$1.now();
		const blobs = this.ctx.state.blobs;
		// Execution time is either sum of all runs of `--merge-reports` or the current run's time
		const executionTime = blobs?.executionTimes ? this.sum(blobs.executionTimes, (time) => time) : this.end - this.start;
		this.clients.forEach((client) => {
			client.onFinished?.(files, errors, void 0, executionTime)?.catch?.(noop$1);
		});
	}
	onFinishedReportCoverage() {
		this.clients.forEach((client) => {
			client.onFinishedReportCoverage?.()?.catch?.(noop$1);
		});
	}
	onUserConsoleLog(log) {
		this.clients.forEach((client) => {
			client.onUserConsoleLog?.(log)?.catch?.(noop$1);
		});
	}
}

// AST walker module for ESTree compatible trees


// An ancestor walk keeps an array of ancestor nodes (including the
// current node) and passes them to the callback as third parameter
// (and also as state parameter when no other state is present).
function ancestor(node, visitors, baseVisitor, state, override) {
  var ancestors = [];
  if (!baseVisitor) { baseVisitor = base
  ; }(function c(node, st, override) {
    var type = override || node.type;
    var isNew = node !== ancestors[ancestors.length - 1];
    if (isNew) { ancestors.push(node); }
    visitNode(baseVisitor, type, node, st, c);
    if (visitors[type]) { visitors[type](node, st || ancestors, ancestors); }
    if (isNew) { ancestors.pop(); }
  })(node, state, override);
}

function skipThrough(node, st, c) { c(node, st); }
function ignore(_node, _st, _c) {}

function visitNode(baseVisitor, type, node, st, c) {
  if (baseVisitor[type] == null) { throw new Error(("No walker function defined for node type " + type)) }
  baseVisitor[type](node, st, c);
}

// Node walkers.

var base = {};

base.Program = base.BlockStatement = base.StaticBlock = function (node, st, c) {
  for (var i = 0, list = node.body; i < list.length; i += 1)
    {
    var stmt = list[i];

    c(stmt, st, "Statement");
  }
};
base.Statement = skipThrough;
base.EmptyStatement = ignore;
base.ExpressionStatement = base.ParenthesizedExpression = base.ChainExpression =
  function (node, st, c) { return c(node.expression, st, "Expression"); };
base.IfStatement = function (node, st, c) {
  c(node.test, st, "Expression");
  c(node.consequent, st, "Statement");
  if (node.alternate) { c(node.alternate, st, "Statement"); }
};
base.LabeledStatement = function (node, st, c) { return c(node.body, st, "Statement"); };
base.BreakStatement = base.ContinueStatement = ignore;
base.WithStatement = function (node, st, c) {
  c(node.object, st, "Expression");
  c(node.body, st, "Statement");
};
base.SwitchStatement = function (node, st, c) {
  c(node.discriminant, st, "Expression");
  for (var i = 0, list = node.cases; i < list.length; i += 1) {
    var cs = list[i];

    c(cs, st);
  }
};
base.SwitchCase = function (node, st, c) {
  if (node.test) { c(node.test, st, "Expression"); }
  for (var i = 0, list = node.consequent; i < list.length; i += 1)
    {
    var cons = list[i];

    c(cons, st, "Statement");
  }
};
base.ReturnStatement = base.YieldExpression = base.AwaitExpression = function (node, st, c) {
  if (node.argument) { c(node.argument, st, "Expression"); }
};
base.ThrowStatement = base.SpreadElement =
  function (node, st, c) { return c(node.argument, st, "Expression"); };
base.TryStatement = function (node, st, c) {
  c(node.block, st, "Statement");
  if (node.handler) { c(node.handler, st); }
  if (node.finalizer) { c(node.finalizer, st, "Statement"); }
};
base.CatchClause = function (node, st, c) {
  if (node.param) { c(node.param, st, "Pattern"); }
  c(node.body, st, "Statement");
};
base.WhileStatement = base.DoWhileStatement = function (node, st, c) {
  c(node.test, st, "Expression");
  c(node.body, st, "Statement");
};
base.ForStatement = function (node, st, c) {
  if (node.init) { c(node.init, st, "ForInit"); }
  if (node.test) { c(node.test, st, "Expression"); }
  if (node.update) { c(node.update, st, "Expression"); }
  c(node.body, st, "Statement");
};
base.ForInStatement = base.ForOfStatement = function (node, st, c) {
  c(node.left, st, "ForInit");
  c(node.right, st, "Expression");
  c(node.body, st, "Statement");
};
base.ForInit = function (node, st, c) {
  if (node.type === "VariableDeclaration") { c(node, st); }
  else { c(node, st, "Expression"); }
};
base.DebuggerStatement = ignore;

base.FunctionDeclaration = function (node, st, c) { return c(node, st, "Function"); };
base.VariableDeclaration = function (node, st, c) {
  for (var i = 0, list = node.declarations; i < list.length; i += 1)
    {
    var decl = list[i];

    c(decl, st);
  }
};
base.VariableDeclarator = function (node, st, c) {
  c(node.id, st, "Pattern");
  if (node.init) { c(node.init, st, "Expression"); }
};

base.Function = function (node, st, c) {
  if (node.id) { c(node.id, st, "Pattern"); }
  for (var i = 0, list = node.params; i < list.length; i += 1)
    {
    var param = list[i];

    c(param, st, "Pattern");
  }
  c(node.body, st, node.expression ? "Expression" : "Statement");
};

base.Pattern = function (node, st, c) {
  if (node.type === "Identifier")
    { c(node, st, "VariablePattern"); }
  else if (node.type === "MemberExpression")
    { c(node, st, "MemberPattern"); }
  else
    { c(node, st); }
};
base.VariablePattern = ignore;
base.MemberPattern = skipThrough;
base.RestElement = function (node, st, c) { return c(node.argument, st, "Pattern"); };
base.ArrayPattern = function (node, st, c) {
  for (var i = 0, list = node.elements; i < list.length; i += 1) {
    var elt = list[i];

    if (elt) { c(elt, st, "Pattern"); }
  }
};
base.ObjectPattern = function (node, st, c) {
  for (var i = 0, list = node.properties; i < list.length; i += 1) {
    var prop = list[i];

    if (prop.type === "Property") {
      if (prop.computed) { c(prop.key, st, "Expression"); }
      c(prop.value, st, "Pattern");
    } else if (prop.type === "RestElement") {
      c(prop.argument, st, "Pattern");
    }
  }
};

base.Expression = skipThrough;
base.ThisExpression = base.Super = base.MetaProperty = ignore;
base.ArrayExpression = function (node, st, c) {
  for (var i = 0, list = node.elements; i < list.length; i += 1) {
    var elt = list[i];

    if (elt) { c(elt, st, "Expression"); }
  }
};
base.ObjectExpression = function (node, st, c) {
  for (var i = 0, list = node.properties; i < list.length; i += 1)
    {
    var prop = list[i];

    c(prop, st);
  }
};
base.FunctionExpression = base.ArrowFunctionExpression = base.FunctionDeclaration;
base.SequenceExpression = function (node, st, c) {
  for (var i = 0, list = node.expressions; i < list.length; i += 1)
    {
    var expr = list[i];

    c(expr, st, "Expression");
  }
};
base.TemplateLiteral = function (node, st, c) {
  for (var i = 0, list = node.quasis; i < list.length; i += 1)
    {
    var quasi = list[i];

    c(quasi, st);
  }

  for (var i$1 = 0, list$1 = node.expressions; i$1 < list$1.length; i$1 += 1)
    {
    var expr = list$1[i$1];

    c(expr, st, "Expression");
  }
};
base.TemplateElement = ignore;
base.UnaryExpression = base.UpdateExpression = function (node, st, c) {
  c(node.argument, st, "Expression");
};
base.BinaryExpression = base.LogicalExpression = function (node, st, c) {
  c(node.left, st, "Expression");
  c(node.right, st, "Expression");
};
base.AssignmentExpression = base.AssignmentPattern = function (node, st, c) {
  c(node.left, st, "Pattern");
  c(node.right, st, "Expression");
};
base.ConditionalExpression = function (node, st, c) {
  c(node.test, st, "Expression");
  c(node.consequent, st, "Expression");
  c(node.alternate, st, "Expression");
};
base.NewExpression = base.CallExpression = function (node, st, c) {
  c(node.callee, st, "Expression");
  if (node.arguments)
    { for (var i = 0, list = node.arguments; i < list.length; i += 1)
      {
        var arg = list[i];

        c(arg, st, "Expression");
      } }
};
base.MemberExpression = function (node, st, c) {
  c(node.object, st, "Expression");
  if (node.computed) { c(node.property, st, "Expression"); }
};
base.ExportNamedDeclaration = base.ExportDefaultDeclaration = function (node, st, c) {
  if (node.declaration)
    { c(node.declaration, st, node.type === "ExportNamedDeclaration" || node.declaration.id ? "Statement" : "Expression"); }
  if (node.source) { c(node.source, st, "Expression"); }
  if (node.attributes)
    { for (var i = 0, list = node.attributes; i < list.length; i += 1)
      {
        var attr = list[i];

        c(attr, st);
      } }
};
base.ExportAllDeclaration = function (node, st, c) {
  if (node.exported)
    { c(node.exported, st); }
  c(node.source, st, "Expression");
  if (node.attributes)
    { for (var i = 0, list = node.attributes; i < list.length; i += 1)
      {
        var attr = list[i];

        c(attr, st);
      } }
};
base.ImportAttribute = function (node, st, c) {
  c(node.value, st, "Expression");
};
base.ImportDeclaration = function (node, st, c) {
  for (var i = 0, list = node.specifiers; i < list.length; i += 1)
    {
    var spec = list[i];

    c(spec, st);
  }
  c(node.source, st, "Expression");
  if (node.attributes)
    { for (var i$1 = 0, list$1 = node.attributes; i$1 < list$1.length; i$1 += 1)
      {
        var attr = list$1[i$1];

        c(attr, st);
      } }
};
base.ImportExpression = function (node, st, c) {
  c(node.source, st, "Expression");
  if (node.options) { c(node.options, st, "Expression"); }
};
base.ImportSpecifier = base.ImportDefaultSpecifier = base.ImportNamespaceSpecifier = base.Identifier = base.PrivateIdentifier = base.Literal = ignore;

base.TaggedTemplateExpression = function (node, st, c) {
  c(node.tag, st, "Expression");
  c(node.quasi, st, "Expression");
};
base.ClassDeclaration = base.ClassExpression = function (node, st, c) { return c(node, st, "Class"); };
base.Class = function (node, st, c) {
  if (node.id) { c(node.id, st, "Pattern"); }
  if (node.superClass) { c(node.superClass, st, "Expression"); }
  c(node.body, st);
};
base.ClassBody = function (node, st, c) {
  for (var i = 0, list = node.body; i < list.length; i += 1)
    {
    var elt = list[i];

    c(elt, st);
  }
};
base.MethodDefinition = base.PropertyDefinition = base.Property = function (node, st, c) {
  if (node.computed) { c(node.key, st, "Expression"); }
  if (node.value) { c(node.value, st, "Expression"); }
};

function groupBy(collection, iteratee) {
	return collection.reduce((acc, item) => {
		const key = iteratee(item);
		acc[key] ||= [];
		acc[key].push(item);
		return acc;
	}, {});
}
function stdout() {
	// @ts-expect-error Node.js maps process.stdout to console._stdout
	// eslint-disable-next-line no-console
	return console._stdout || process.stdout;
}
function escapeRegExp(s) {
	// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function wildcardPatternToRegExp(pattern) {
	return new RegExp(`^${pattern.split("*").map(escapeRegExp).join(".*")}$`, "i");
}
function createIndexLocationsMap(source) {
	const map = /* @__PURE__ */ new Map();
	let index = 0;
	let line = 1;
	let column = 1;
	for (const char of source) {
		map.set(index++, {
			line,
			column
		});
		if (char === "\n" || char === "\r\n") {
			line++;
			column = 0;
		} else column++;
	}
	return map;
}
function createLocationsIndexMap(source) {
	const map = /* @__PURE__ */ new Map();
	let index = 0;
	let line = 1;
	let column = 1;
	for (const char of source) {
		map.set(`${line}:${column}`, index++);
		if (char === "\n" || char === "\r\n") {
			line++;
			column = 0;
		} else column++;
	}
	return map;
}

function createDebugger(namespace) {
	const debug = createDebug(namespace);
	if (debug.enabled) return debug;
}

async function getSpecificationsOptions(specifications) {
	const environments = /* @__PURE__ */ new WeakMap();
	const cache = /* @__PURE__ */ new Map();
	const tags = /* @__PURE__ */ new WeakMap();
	await Promise.all(specifications.map(async (spec) => {
		const { moduleId: filepath, project, pool } = spec;
		// browser pool handles its own environment
		if (pool === "browser") return;
		// reuse if projects have the same test files
		let code = cache.get(filepath);
		if (!code) {
			code = await promises.readFile(filepath, "utf-8").catch(() => "");
			cache.set(filepath, code);
		}
		const { env = project.config.environment || "node", envOptions, tags: specTags = [] } = detectCodeBlock(code);
		tags.set(spec, specTags);
		const environment = {
			name: env,
			options: envOptions ? { [env === "happy-dom" ? "happyDOM" : env]: envOptions } : null
		};
		environments.set(spec, environment);
	}));
	return {
		environments,
		tags
	};
}
function detectCodeBlock(content) {
	const env = content.match(/@(?:vitest|jest)-environment\s+([\w-]+)\b/)?.[1];
	let envOptionsJson = content.match(/@(?:vitest|jest)-environment-options\s+(.+)/)?.[1];
	if (envOptionsJson?.endsWith("*/"))
 // Trim closing Docblock characters the above regex might have captured
	envOptionsJson = envOptionsJson.slice(0, -2);
	const envOptions = JSON.parse(envOptionsJson || "null");
	const tags = [];
	let tagMatch;
	// eslint-disable-next-line no-cond-assign
	while (tagMatch = content.match(/(\/\/|\*)\s*@module-tag\s+([\w\-/]+)\b/)) {
		tags.push(tagMatch[2]);
		content = content.slice(tagMatch.index + tagMatch[0].length);
	}
	return {
		env,
		envOptions,
		tags
	};
}

const hash = crypto.hash ?? ((algorithm, data, outputEncoding) => crypto.createHash(algorithm).update(data).digest(outputEncoding));

class VitestResolver {
	options;
	externalizeConcurrentCache = /* @__PURE__ */ new Map();
	externalizeCache = /* @__PURE__ */ new Map();
	constructor(cacheDir, config) {
		// sorting to make cache consistent
		const inline = config.server.deps?.inline;
		if (Array.isArray(inline)) inline.sort();
		const external = config.server.deps?.external;
		if (Array.isArray(external)) external.sort();
		this.options = {
			moduleDirectories: config.deps.moduleDirectories?.sort(),
			inlineFiles: config.setupFiles.flatMap((file) => {
				if (file.startsWith("file://")) return file;
				const resolvedId = resolve(file);
				return [resolvedId, pathToFileURL(resolvedId).href];
			}),
			cacheDir,
			inline,
			external
		};
	}
	wasExternalized(file) {
		const normalizedFile = normalizeId(file);
		if (!this.externalizeCache.has(normalizedFile)) return false;
		return this.externalizeCache.get(normalizedFile) ?? false;
	}
	async shouldExternalize(file) {
		const normalizedFile = normalizeId(file);
		if (this.externalizeCache.has(normalizedFile)) return this.externalizeCache.get(normalizedFile);
		return shouldExternalize(normalizeId(file), this.options, this.externalizeConcurrentCache).then((result) => {
			this.externalizeCache.set(normalizedFile, result);
			return result;
		}).finally(() => {
			this.externalizeConcurrentCache.delete(normalizedFile);
		});
	}
}
function normalizeId(id) {
	if (id.startsWith("/@fs/")) id = id.slice(isWindows ? 5 : 4);
	return id;
}
const BUILTIN_EXTENSIONS = /* @__PURE__ */ new Set([
	".mjs",
	".cjs",
	".node",
	".wasm"
]);
const ESM_EXT_RE = /\.(es|esm|esm-browser|esm-bundler|es6|module)\.js$/;
const ESM_FOLDER_RE = /\/(es|esm)\/(.*\.js)$/;
const defaultInline = [
	/virtual:/,
	/\.[mc]?ts$/,
	/[?&](init|raw|url|inline)\b/,
	KNOWN_ASSET_RE,
	/^(?!.*node_modules).*\.mjs$/,
	/^(?!.*node_modules).*\.cjs\.js$/,
	/vite\w*\/dist\/client\/env.mjs/
];
const depsExternal = [/\/node_modules\/.*\.cjs\.js$/, /\/node_modules\/.*\.mjs$/];
function guessCJSversion(id) {
	if (ESM_EXT_RE.test(id)) {
		for (const i of [
			id.replace(ESM_EXT_RE, ".mjs"),
			id.replace(ESM_EXT_RE, ".umd.js"),
			id.replace(ESM_EXT_RE, ".cjs.js"),
			id.replace(ESM_EXT_RE, ".js")
		]) if (existsSync(i)) return i;
	}
	if (ESM_FOLDER_RE.test(id)) {
		for (const i of [
			id.replace(ESM_FOLDER_RE, "/umd/$1"),
			id.replace(ESM_FOLDER_RE, "/cjs/$1"),
			id.replace(ESM_FOLDER_RE, "/lib/$1"),
			id.replace(ESM_FOLDER_RE, "/$1")
		]) if (existsSync(i)) return i;
	}
}
// The code from https://github.com/unjs/mlly/blob/c5bcca0cda175921344fd6de1bc0c499e73e5dac/src/syntax.ts#L51-L98
async function isValidNodeImport(id) {
	// clean url to strip off `?v=...` query etc.
	// node can natively import files with query params, so externalizing them is safe.
	id = cleanUrl(id);
	const extension = extname(id);
	if (BUILTIN_EXTENSIONS.has(extension)) return true;
	if (extension !== ".js") return false;
	id = id.replace("file:///", "");
	if (lookupPackageScopeType(dirname(id)) === "esm") return true;
	if (/\.(?:\w+-)?esm?(?:-\w+)?\.js$|\/esm?\//.test(id)) return false;
	try {
		await esModuleLexer.init;
		const code = await promises.readFile(id, "utf8");
		const [, , , hasModuleSyntax] = esModuleLexer.parse(code);
		return !hasModuleSyntax;
	} catch {
		return false;
	}
}
const ESM_SYNTAX_MARKERS = [
	ssrImportKey,
	ssrModuleExportsKey,
	ssrExportAllKey,
	ssrImportMetaKey,
	"__vite_ssr_exportName__"
];
const CJS_GLOBALS_REFERENCE_RE = /\b(?:module|exports|require|__filename|__dirname)\b/;
// mirrors the Node.js module detection algorithm: the file extension wins,
// then the `type` field in the package scope, then the presence of
// ESM syntax. the ssr transform always rewrites static imports/exports and
// `import.meta` into `__vite_ssr_` helpers, so the transformed code is
// checked first: it reflects the compiled output (type-only imports are
// already erased), and a module without the markers cannot be an ES module.
// a marker hit is then confirmed against the lexed source because the
// transform preserves comments and strings that can mention the markers.
// dynamic imports never count because they are allowed in CommonJS modules
async function detectModuleType(file, code, loadSource) {
	if (file) {
		const filepath = cleanUrl(file);
		const extension = extname(filepath);
		if (extension === ".cjs" || extension === ".cts") return "cjs";
		if (extension === ".mjs" || extension === ".mts") return "esm";
		const scopeType = lookupPackageScopeType(dirname(filepath));
		if (scopeType !== "none") return scopeType;
	}
	if (!ESM_SYNTAX_MARKERS.some((marker) => code.includes(marker))) return "cjs";
	// a false "esm" verdict can only break modules that reference the CommonJS
	// variables, so the source is read and lexed only when both signals appear
	if (!CJS_GLOBALS_REFERENCE_RE.test(code)) return "esm";
	const source = loadSource ? await loadSource() : null;
	if (source != null) try {
		await esModuleLexer.init;
		const [, , , hasModuleSyntax] = esModuleLexer.parse(source);
		if (!hasModuleSyntax) return "cjs";
	} catch {}
	return "esm";
}
async function shouldExternalize(id, options, cache) {
	if (!cache.has(id)) cache.set(id, _shouldExternalize(id, options));
	return cache.get(id);
}
async function _shouldExternalize(id, options) {
	if (isBuiltin(id)) return id;
	// data: should be processed by native import,
	// since it is a feature of ESM.
	// also externalize network imports since nodejs allows it when --experimental-network-imports
	if (id.startsWith("data:") || /^(?:https?:)?\/\//.test(id)) return id;
	const moduleDirectories = options?.moduleDirectories || ["/node_modules/"];
	if (matchPattern(id, moduleDirectories, options?.inline)) return false;
	if (options?.inlineFiles && options?.inlineFiles.includes(id)) return false;
	if (matchPattern(id, moduleDirectories, options?.external)) return id;
	// Unless the user explicitly opted to inline them, externalize Vite deps.
	// They are too big to inline by default.
	if (options?.cacheDir && id.includes(options.cacheDir)) return id;
	const isLibraryModule = moduleDirectories.some((dir) => id.includes(dir));
	id = isLibraryModule && options?.fallbackCJS ? guessCJSversion(id) || id : id;
	if (matchPattern(id, moduleDirectories, defaultInline)) return false;
	if (matchPattern(id, moduleDirectories, depsExternal)) return id;
	if (isLibraryModule && await isValidNodeImport(id)) return id;
}
function matchPattern(id, moduleDirectories, patterns) {
	if (patterns == null) return false;
	if (patterns === true) return true;
	for (const ex of patterns) if (typeof ex === "string") {
		if (moduleDirectories.some((dir) => id.includes(join(dir, ex)))) return true;
	} else if (ex.test(id)) return true;
	return false;
}

// this is copy pasted from vite
function normalizeResolvedIdToUrl(environment, resolvedId) {
	const root = environment.config.root;
	const depsOptimizer = environment.depsOptimizer;
	let url;
	// normalize all imports into resolved URLs
	// e.g. `import 'foo'` -> `import '/@fs/.../node_modules/foo/index.js'`
	if (resolvedId.startsWith(withTrailingSlash(root)))
 // in root: infer short absolute path from root
	url = resolvedId.slice(root.length);
	else if (depsOptimizer?.isOptimizedDepFile(resolvedId) || resolvedId !== "/@react-refresh" && path.isAbsolute(resolvedId) && existsSync(cleanUrl(resolvedId)))
 // an optimized deps may not yet exists in the filesystem, or
	// a regular file exists but is out of root: rewrite to absolute /@fs/ paths
	url = path.posix.join("/@fs/", resolvedId);
	else url = resolvedId;
	// if the resolved id is not a valid browser import specifier,
	// prefix it to make it valid. We will strip this before feeding it
	// back into the transform pipeline
	if (url[0] !== "." && url[0] !== "/") url = wrapId(resolvedId);
	return url;
}

const debugFs$1 = createDebugger("vitest:cache:fs");
const saveCachePromises = /* @__PURE__ */ new Map();
const readFilePromises = /* @__PURE__ */ new Map();
class ModuleFetcher {
	resolver;
	config;
	fsCache;
	tmpProjectDir;
	tmpDirectories = /* @__PURE__ */ new Set();
	fsCacheEnabled;
	// the module type is only needed by the evaluator to decide if CJS
	// variables should be provided to the module, so don't waste time
	// on the detection when every module receives them
	detectModuleType;
	constructor(resolver, config, fsCache, tmpProjectDir) {
		this.resolver = resolver;
		this.config = config;
		this.fsCache = fsCache;
		this.tmpProjectDir = tmpProjectDir;
		this.fsCacheEnabled = config.fsModuleCache === true;
		this.detectModuleType = config.injectCjsGlobals === false;
	}
	async fetch(trace, url, importer, environment, makeTmpCopies, options) {
		if (url.startsWith("data:")) {
			trace.setAttribute("vitest.module.external", url);
			return {
				externalize: url,
				type: "builtin"
			};
		}
		if (url === "/@vite/client" || url === "@vite/client") {
			trace.setAttribute("vitest.module.external", url);
			return {
				externalize: "/@vite/client",
				type: "module"
			};
		}
		const isFileUrl = url.startsWith("file://");
		if (isExternalUrl(url) && !isFileUrl) {
			trace.setAttribute("vitest.module.external", url);
			return {
				externalize: url,
				type: "network"
			};
		}
		// handle unresolved id of dynamic import skipped by Vite import analysis
		if (url[0] !== "/") {
			const resolved = await environment.pluginContainer.resolveId(url, importer);
			if (resolved) url = normalizeResolvedIdToUrl(environment, resolved.id);
		}
		const moduleGraphModule = await environment.moduleGraph.ensureEntryFromUrl(unwrapId(url));
		const cached = !!moduleGraphModule.transformResult;
		if (moduleGraphModule.file) trace.setAttribute("code.file.path", moduleGraphModule.file);
		if (options?.cached && cached) return { cache: true };
		const externalize = await this.resolver.shouldExternalize(moduleGraphModule.id);
		if (externalize) return {
			externalize,
			type: "module"
		};
		const cachePath = await this.getCachePath(environment, moduleGraphModule);
		// full fs caching is disabled, but we still want to keep tmp files if makeTmpCopies is enabled
		// this is primarily used by the forks pool to avoid using process.send(bigBuffer)
		if (cachePath == null) {
			const result = await this.fetchAndProcess(environment, url, importer, moduleGraphModule, options);
			this.recordResult(trace, result);
			if (!makeTmpCopies || !("code" in result)) return result;
			const transformResult = moduleGraphModule.transformResult;
			const tmpPath = transformResult?.__vitestTmp;
			if (typeof tmpPath === "string") return getCachedResult(result, tmpPath);
			const tmpDir = join(this.tmpProjectDir, environment.name);
			if (!this.tmpDirectories.has(tmpDir)) {
				if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
				this.tmpDirectories.add(tmpDir);
			}
			const tmpFile = join(tmpDir, hash("sha1", result.id, "hex"));
			return this.cacheResult(result, tmpFile, transformResult).then((result) => {
				if (transformResult) transformResult.__vitestTmp = tmpFile;
				return result;
			});
		}
		if (saveCachePromises.has(cachePath)) return saveCachePromises.get(cachePath).then((result) => {
			this.recordResult(trace, result);
			return result;
		});
		const cachedModule = await this.getCachedModule(cachePath, environment, moduleGraphModule, importer);
		if (cachedModule) {
			this.recordResult(trace, cachedModule);
			return cachedModule;
		}
		const result = await this.fetchAndProcess(environment, url, importer, moduleGraphModule, options);
		const importedUrls = this.getSerializedImports(moduleGraphModule);
		const map = moduleGraphModule.transformResult?.map;
		const mappings = map && !("version" in map) && map.mappings === "";
		const cachedResult = await this.cacheResult(result, cachePath, moduleGraphModule.transformResult, importedUrls, !!mappings);
		// remember where the code is stored on disk so that repeat fetches and the
		// `fetchWarmModules` snapshot can point at it in this session already, not
		// only after the cache is read back in the next one
		if ("code" in result && moduleGraphModule.transformResult) moduleGraphModule.transformResult.__vitestTmp = cachePath;
		return cachedResult;
	}
	// we need this for UI to be able to show a module graph
	getSerializedImports(node) {
		const imports = [];
		node.importedModules.forEach((importer) => {
			imports.push(importer.url);
		});
		return imports;
	}
	recordResult(trace, result) {
		if ("externalize" in result) trace.setAttributes({
			"vitest.fetched_module.external": result.externalize,
			"vitest.fetched_module.type": result.type
		});
		if ("id" in result) {
			trace.setAttributes({
				"vitest.fetched_module.invalidate": result.invalidate,
				"vitest.fetched_module.id": result.id,
				"vitest.fetched_module.url": result.url,
				"vitest.fetched_module.cache": false
			});
			if (result.file) trace.setAttribute("code.file.path", result.file);
		}
		if ("code" in result) trace.setAttribute("vitest.fetched_module.code_length", result.code.length);
	}
	async getCachePath(environment, moduleGraphModule) {
		if (!this.fsCacheEnabled) return null;
		const moduleId = moduleGraphModule.id;
		const memoryCacheKey = this.fsCache.getMemoryCachePath(environment, moduleId);
		// undefined means there is no key in memory
		// null means the file should not be cached
		if (memoryCacheKey !== void 0) return memoryCacheKey;
		const fileContent = await this.readFileContentToCache(environment, moduleGraphModule);
		return this.fsCache.generateCachePath(this.config, environment, moduleGraphModule.id, fileContent);
	}
	async readFileContentToCache(environment, moduleGraphModule) {
		if (moduleGraphModule.file && !moduleGraphModule.file.startsWith("\0") && !moduleGraphModule.file.startsWith("virtual:")) {
			const result = await this.readFileConcurrently(moduleGraphModule.file);
			if (result != null) return result;
		}
		const loadResult = await environment.pluginContainer.load(moduleGraphModule.id);
		if (typeof loadResult === "string") return loadResult;
		if (loadResult != null) return loadResult.code;
		return "";
	}
	async getCachedModule(cachePath, environment, moduleGraphModule, importer) {
		if (moduleGraphModule.transformResult?.__vitestTmp) {
			if (!existsSync(moduleGraphModule.transformResult.__vitestTmp)) {
				debugFs$1?.(`cached file ${moduleGraphModule.transformResult.__vitestTmp} disappeared, re-transforming`);
				moduleGraphModule.transformResult.__vitestTmp = void 0;
				return;
			}
			return {
				cached: true,
				file: moduleGraphModule.file,
				id: moduleGraphModule.id,
				tmp: moduleGraphModule.transformResult.__vitestTmp,
				url: moduleGraphModule.url,
				invalidate: false,
				moduleType: await this.cachedModuleType(moduleGraphModule.file, moduleGraphModule.transformResult.code, moduleGraphModule.transformResult)
			};
		}
		const cachedModule = await this.fsCache.getCachedModule(cachePath);
		if (!cachedModule) return;
		// keep the module graph in sync
		let map = extractSourceMap(cachedModule.code);
		if (map && cachedModule.file) map.file = cachedModule.file;
		// mappings is a special source map identifier in rollup
		if (!map && cachedModule.mappings) map = { mappings: "" };
		const moduleType = cachedModule.moduleType;
		moduleGraphModule.transformResult = {
			code: cachedModule.code,
			map,
			ssr: true,
			deps: cachedModule.deps,
			dynamicDeps: cachedModule.dynamicDeps,
			__vitestTmp: cachePath,
			__vitestModuleType: moduleType,
			__vitestStaticMocks: cachedModule.staticMocks
		};
		// we populate the module graph to make the watch mode work because it relies on importers
		if (importer) {
			const environmentNode = environment.moduleGraph.getModuleById(importer);
			if (environmentNode) moduleGraphModule.importers.add(environmentNode);
		}
		await Promise.all(cachedModule.importedUrls.map(async (url) => {
			const moduleNode = await environment.moduleGraph.ensureEntryFromUrl(url).catch(() => null);
			if (moduleNode) {
				moduleNode.importers.add(moduleGraphModule);
				moduleGraphModule.importedModules.add(moduleNode);
			}
		}));
		return {
			cached: true,
			file: cachedModule.file,
			id: cachedModule.id,
			tmp: cachePath,
			url: cachedModule.url,
			invalidate: false,
			moduleType
		};
	}
	async fetchAndProcess(environment, url, importer, moduleGraphModule, options) {
		const result = processResultSource(environment, await fetchModule(environment, url, importer, {
			...options,
			inlineSourceMap: false
		}).catch(handleRollupError));
		if ("code" in result) result.moduleType = await this.cachedModuleType(result.file, result.code, moduleGraphModule.transformResult);
		const transformResult = moduleGraphModule.transformResult;
		if (transformResult && moduleGraphModule.id) transformResult.__vitestStaticMocks ??= environment.pluginContainer.getModuleInfo(moduleGraphModule.id)?.meta?.vitestStaticMocks ?? null;
		return result;
	}
	sourceLoader(file) {
		if (!file || file.startsWith("\0") || file.startsWith("virtual:")) return;
		return () => this.readFileConcurrently(file);
	}
	// the module type is a pure function of the module, so detect it at most once
	// and memoize the verdict on the transform result. repeat fetches, the on-disk
	// cache (`cached`), and the `fetchWarmModules` snapshot all reuse it instead of
	// re-detecting. a no-op unless `injectCjsGlobals` is disabled — otherwise every
	// module receives the CJS globals and the type is irrelevant.
	async cachedModuleType(file, code, transformResult) {
		if (!this.detectModuleType) return;
		const moduleType = transformResult?.__vitestModuleType ?? await detectModuleType(file, code, this.sourceLoader(file));
		if (transformResult) transformResult.__vitestModuleType = moduleType;
		return moduleType;
	}
	async cacheResult(result, cachePath, transformResult, importedUrls = [], mappings = false) {
		const returnResult = "code" in result ? getCachedResult(result, cachePath) : result;
		if (saveCachePromises.has(cachePath)) return saveCachePromises.get(cachePath);
		const savePromise = this.fsCache.saveCachedModule(cachePath, result, transformResult, importedUrls, mappings).then(() => returnResult).catch((error) => {
			debugFs$1?.(`failed to cache ${cachePath}, serving it inline: ${error}`);
			return result;
		}).finally(() => {
			saveCachePromises.delete(cachePath);
		});
		saveCachePromises.set(cachePath, savePromise);
		return savePromise;
	}
	readFileConcurrently(file) {
		if (!readFilePromises.has(file)) readFilePromises.set(
			file,
			// virtual file can have a "file" property
			readFile(file, "utf-8").catch(() => null).finally(() => {
				readFilePromises.delete(file);
			})
		);
		return readFilePromises.get(file);
	}
}
function createFetchModuleFunction(resolver, config, fsCache, traces, tmpProjectDir) {
	const fetcher = new ModuleFetcher(resolver, config, fsCache, tmpProjectDir);
	return async (url, importer, environment, cacheFs, options, otelCarrier) => {
		await traces.waitInit();
		const context = otelCarrier ? traces.getContextFromCarrier(otelCarrier) : void 0;
		return traces.$("vitest.module.transform", context ? { context } : {}, (span) => fetcher.fetch(span, url, importer, environment, cacheFs, options));
	};
}
let SOURCEMAPPING_URL = "sourceMa";
SOURCEMAPPING_URL += "ppingURL";
const MODULE_RUNNER_SOURCEMAPPING_SOURCE = "//# sourceMappingSource=vite-generated";
function processResultSource(environment, result) {
	if (!("code" in result)) return result;
	const node = environment.moduleGraph.getModuleById(result.id);
	if (node?.transformResult)
 // this also overrides node.transformResult.code which is also what the module
	// runner does under the hood by default (we disable source maps inlining)
	inlineSourceMap(node.transformResult);
	return {
		...result,
		code: node?.transformResult?.code || result.code
	};
}
const OTHER_SOURCE_MAP_REGEXP = new RegExp(`//# ${SOURCEMAPPING_URL}=data:application/json[^,]+base64,([A-Za-z0-9+/=]+)$`, "gm");
// we have to inline the source map ourselves, because
// - we don't need //# sourceURL since we are running code in VM
//   - important in stack traces and the V8 coverage
// - we need to inject an empty line for --inspect-brk
function inlineSourceMap(result) {
	const map = result.map;
	let code = result.code;
	if (!map || !("version" in map) || code.includes(MODULE_RUNNER_SOURCEMAPPING_SOURCE)) return result;
	// to reduce the payload size, we only inline vite node source map, because it's also the only one we use
	OTHER_SOURCE_MAP_REGEXP.lastIndex = 0;
	if (OTHER_SOURCE_MAP_REGEXP.test(code)) code = code.replace(OTHER_SOURCE_MAP_REGEXP, "");
	const sourceMap = { ...map };
	// If the first line is not present on source maps, add simple 1:1 mapping ([0,0,0,0], [1,0,0,0])
	// so that debuggers can be set to break on first line
	if (sourceMap.mappings[0] === ";") sourceMap.mappings = `AAAA,CAAA${sourceMap.mappings}`;
	result.code = `${code.trimEnd()}\n${MODULE_RUNNER_SOURCEMAPPING_SOURCE}\n//# ${SOURCEMAPPING_URL}=${genSourceMapUrl(sourceMap)}\n`;
	return result;
}
function genSourceMapUrl(map) {
	if (typeof map !== "string") map = JSON.stringify(map);
	return `data:application/json;base64,${Buffer.from(map).toString("base64")}`;
}
function getCachedResult(result, tmp) {
	return {
		cached: true,
		file: result.file,
		id: result.id,
		tmp,
		url: result.url,
		invalidate: result.invalidate,
		moduleType: result.moduleType
	};
}
const MODULE_RUNNER_SOURCEMAPPING_REGEXP = new RegExp(`//# ${SOURCEMAPPING_URL}=data:application/json;base64,(.+)`);
function extractSourceMap(code) {
	const pattern = `//# ${SOURCEMAPPING_URL}=data:application/json;base64,`;
	const lastIndex = code.lastIndexOf(pattern);
	if (lastIndex === -1) return null;
	const mapString = MODULE_RUNNER_SOURCEMAPPING_REGEXP.exec(code.slice(lastIndex))?.[1];
	if (!mapString) return null;
	const sourceMap = JSON.parse(Buffer.from(mapString, "base64").toString("utf-8"));
	// remove source map mapping added by "inlineSourceMap" to keep the original behaviour of transformRequest
	if (sourceMap.mappings.startsWith("AAAA,CAAA;"))
 // 9 because we want to only remove "AAAA,CAAA", but keep ; at the start
	sourceMap.mappings = sourceMap.mappings.slice(9);
	return sourceMap;
}
// serialize rollup error on server to preserve details as a test error
function toRollupError(e) {
	if (e instanceof Error && ("plugin" in e || "frame" in e || "id" in e)) return {
		name: e.name,
		message: e.message,
		stack: e.stack,
		cause: e.cause,
		__vitest_rollup_error__: {
			plugin: e.plugin,
			id: e.id,
			loc: e.loc,
			frame: e.frame
		}
	};
}
function handleRollupError(e) {
	throw toRollupError(e) ?? e;
}

const debug$2 = createDebugger("vitest:ast-collect-info");
const verbose = createDebugger("vitest:ast-collect-verbose");
const INTERMEDIATE_CALL_PROPERTIES = /* @__PURE__ */ new Set([
	"each",
	"for",
	"skipIf",
	"runIf",
	"extend",
	"scoped",
	"override"
]);
function isTestFunctionName(name) {
	return name === "it" || name === "test" || name.startsWith("test") || name.endsWith("Test");
}
function isVitestFunctionName(name) {
	return name === "describe" || name === "suite" || isTestFunctionName(name);
}
function astParseFile(filepath, code) {
	const ast = parseAst(code);
	if (verbose) verbose("Collecting", filepath, code);
	else debug$2?.("Collecting", filepath);
	const definitions = [];
	const getName = (callee) => {
		if (!callee) return null;
		if (callee.type === "Identifier") return callee.name;
		if (callee.type === "CallExpression") return getName(callee.callee);
		if (callee.type === "TaggedTemplateExpression") return getName(callee.tag);
		if (callee.type === "MemberExpression") {
			// A computed access like `it[1].call(it[2])` is not a Vitest call.
			if (callee.computed) return null;
			if (callee.object?.type === "Identifier" && isVitestFunctionName(callee.object.name)) return callee.object?.name;
			if (callee.object?.name?.startsWith("__vite_ssr_") || callee.object?.name?.startsWith("__vi_import_") || callee.object?.object?.name?.startsWith("__vite_ssr_") && callee.object?.property?.name === "Vitest") return getName(callee.property);
			// call as `__vite_ssr__.test.skip()` or `describe.concurrent.each()`
			return getName(callee.object);
		}
		// unwrap (0, ...)
		if (callee.type === "SequenceExpression" && callee.expressions.length === 2) {
			const [e0, e1] = callee.expressions;
			if (e0.type === "Literal" && e0.value === 0) return getName(e1);
		}
		return null;
	};
	const getProperties = (callee) => {
		if (!callee) return [];
		if (callee.type === "Identifier") return [];
		if (callee.type === "CallExpression") return getProperties(callee.callee);
		if (callee.type === "TaggedTemplateExpression") return getProperties(callee.tag);
		if (callee.type === "MemberExpression") {
			const props = getProperties(callee.object);
			if (callee.property?.name) props.push(callee.property.name);
			return props;
		}
		return [];
	};
	ancestor(ast, { CallExpression(node) {
		const { callee } = node;
		const name = getName(callee);
		if (!name) return;
		if (!isVitestFunctionName(name)) {
			verbose?.(`Skipping ${name} (unknown call)`);
			return;
		}
		const properties = getProperties(callee);
		const property = callee?.property?.name;
		// intermediate calls like .each(), .for() will be picked up in the next iteration
		if (property && INTERMEDIATE_CALL_PROPERTIES.has(property)) return;
		// skip properties on return values of calls - e.g., test('name', fn).skip()
		if (callee.type === "MemberExpression" && callee.object?.type === "CallExpression") return;
		// derive mode from the full chain (handles any order like .skip.concurrent or .concurrent.skip)
		let mode = "run";
		for (const prop of properties) if (prop === "skip" || prop === "only" || prop === "todo") mode = prop;
		else if (prop === "skipIf" || prop === "runIf") mode = "skip";
		let concurrent = properties.includes("concurrent") || void 0;
		let start;
		const end = node.end;
		// .each or (0, __vite_ssr_exports_0__.test)()
		if (callee.type === "CallExpression" || callee.type === "SequenceExpression" || callee.type === "TaggedTemplateExpression") start = callee.end;
		else start = node.start;
		const messageNode = node.arguments?.[0];
		if (messageNode == null) {
			verbose?.(`Skipping node at ${node.start} because it doesn't have a name`);
			return;
		}
		let message;
		if (messageNode?.type === "Literal" || messageNode?.type === "TemplateLiteral") message = code.slice(messageNode.start + 1, messageNode.end - 1);
		else {
			message = code.slice(messageNode.start, messageNode.end);
			if (message.endsWith(".name")) message = message.slice(0, -5);
		}
		if (message.startsWith("0,")) message = message.slice(2);
		message = message.replace(/\(0\s?,\s?__vite_ssr_import_\d+__.(\w+)\)/g, "$1").replace(/__(vite_ssr_import|vi_import)_\d+__\./g, "").replace(/__vi_import_\d+__\./g, "");
		const parentCalleeName = typeof callee?.callee === "object" && callee?.callee.type === "MemberExpression" && callee?.callee.property?.name;
		let isDynamicEach = parentCalleeName === "each" || parentCalleeName === "for";
		if (!isDynamicEach && callee.type === "TaggedTemplateExpression") {
			const property = callee.tag?.property?.name;
			isDynamicEach = property === "each" || property === "for";
		}
		// Extract options from the second argument if it's an options object
		const tags = [];
		const secondArg = node.arguments?.[1];
		if (secondArg?.type === "ObjectExpression") for (const prop of secondArg.properties || []) {
			if (prop.type !== "Property" || prop.key?.type !== "Identifier") continue;
			const keyName = prop.key.name;
			if (keyName === "tags") {
				const tagsValue = prop.value;
				if (tagsValue?.type === "Literal" && typeof tagsValue.value === "string") tags.push(tagsValue.value);
				else if (tagsValue?.type === "ArrayExpression") {
					for (const element of tagsValue.elements || []) if (element?.type === "Literal" && typeof element.value === "string") tags.push(element.value);
				}
			} else if (prop.value?.type === "Literal") {
				if ((keyName === "skip" || keyName === "only" || keyName === "todo") && prop.value.value === true) mode = keyName;
				else if (keyName === "concurrent" && typeof prop.value.value === "boolean") concurrent = prop.value.value;
			}
		}
		debug$2?.("Found", name, message, `(${mode})`, tags.length ? `[${tags.join(", ")}]` : "");
		definitions.push({
			start,
			end,
			name: message,
			type: properties.includes("describe") || properties.includes("suite") || !isTestFunctionName(name) ? "suite" : "test",
			mode,
			task: null,
			dynamic: isDynamicEach,
			concurrent,
			tags
		});
	} });
	return {
		ast,
		definitions
	};
}
function createFailedFileTask(project, filepath, error, options) {
	const config = project.serializedConfig;
	const pool = options?.pool ?? config.pool;
	const file = {
		...createFileTask$1(filepath, config.root, config.name, pool, void 0, {
			typecheck: pool === "typescript",
			__vitest_label__: config.mergeReportsLabel
		}),
		mode: "run",
		start: 0,
		end: 0,
		result: {
			state: "fail",
			errors: serializeError(error)
		}
	};
	file.file = file;
	return file;
}
function serializeError(error) {
	return [toRollupError(error) ?? {
		name: error.name,
		stack: error.stack,
		message: error.message
	}];
}
function createFileTask(project, testFilepath, code, requestMap, filepath, fileTags, options) {
	const { definitions, ast } = astParseFile(testFilepath, code);
	const config = project.serializedConfig;
	const pool = options?.pool ?? config.pool;
	const file = {
		...createFileTask$1(filepath, config.root, config.name, pool, void 0, {
			typecheck: pool === "typescript",
			__vitest_label__: config.mergeReportsLabel
		}),
		mode: "run",
		start: ast.start,
		end: ast.end,
		tags: fileTags || []
	};
	file.file = file;
	const indexMap = createIndexLocationsMap(code);
	const map = requestMap && new TraceMap(requestMap);
	let lastSuite = file;
	const updateLatestSuite = (index) => {
		while (lastSuite.suite && lastSuite.end < index) lastSuite = lastSuite.suite;
		return lastSuite;
	};
	definitions.sort((a, b) => a.start - b.start).forEach((definition) => {
		const latestSuite = updateLatestSuite(definition.start);
		let mode = definition.mode;
		if (latestSuite.mode !== "run")
 // inherit suite mode, if it's set
		mode = latestSuite.mode;
		const processedLocation = indexMap.get(definition.start);
		let location;
		if (map && processedLocation) {
			const originalLocation = originalPositionFor(map, {
				line: processedLocation.line,
				column: processedLocation.column
			});
			if (originalLocation.column != null) {
				verbose?.(`Found location for`, definition.type, definition.name, `${processedLocation.line}:${processedLocation.column + 1}`, "->", `${originalLocation.line}:${originalLocation.column + 1}`);
				location = {
					line: originalLocation.line,
					column: originalLocation.column + 1
				};
			} else debug$2?.("Cannot find original location for", definition.type, definition.name, `${processedLocation.column}:${processedLocation.line}`);
		} else debug$2?.("Cannot find original location for", definition.type, definition.name, `${definition.start}`);
		// Inherit tags from parent suite and merge with own tags
		const parentTags = latestSuite.tags || [];
		const taskTags = unique([...parentTags, ...definition.tags]);
		const concurrent = definition.concurrent ?? latestSuite.concurrent;
		if (definition.type === "suite") {
			const task = {
				type: definition.type,
				id: "",
				suite: latestSuite,
				file,
				tasks: [],
				mode,
				each: definition.dynamic,
				concurrent,
				name: definition.name,
				fullName: createTaskName([latestSuite.fullName, definition.name]),
				fullTestName: createTaskName([latestSuite.fullTestName, definition.name]),
				end: definition.end,
				start: definition.start,
				location,
				dynamic: definition.dynamic,
				meta: {},
				tags: taskTags
			};
			definition.task = task;
			latestSuite.tasks.push(task);
			if (mode === "only") markAncestorsContainOnly(latestSuite);
			lastSuite = task;
			return;
		}
		validateTags(config, taskTags);
		const task = {
			type: definition.type,
			id: "",
			suite: latestSuite,
			file,
			each: definition.dynamic,
			concurrent,
			mode,
			context: {},
			name: definition.name,
			fullName: createTaskName([latestSuite.fullName, definition.name]),
			fullTestName: createTaskName([latestSuite.fullTestName, definition.name]),
			end: definition.end,
			start: definition.start,
			location,
			dynamic: definition.dynamic,
			meta: {},
			timeout: 0,
			annotations: [],
			artifacts: [],
			benchmarks: [],
			tags: taskTags
		};
		definition.task = task;
		latestSuite.tasks.push(task);
		if (mode === "only") markAncestorsContainOnly(latestSuite);
	});
	calculateSuiteHash(file);
	markDynamicTests(file.tasks);
	if (!file.tasks.length) file.result = {
		state: "fail",
		errors: [{
			name: "Error",
			message: `No test suite found in file ${filepath}`
		}]
	};
	return {
		file,
		definitions
	};
}
async function astCollectTests(project, filepath) {
	return (await astCollectFileInformation(project, filepath)).file;
}
async function astCollectFileInformation(project, filepath, options) {
	const request = await transformSSR(project, filepath);
	const testFilepath = relative(project.config.root, filepath);
	if (!request) {
		debug$2?.("Cannot parse", testFilepath, "(vite didn't return anything)");
		return {
			file: createFailedFileTask(project, filepath, /* @__PURE__ */ new Error(`Failed to parse ${testFilepath}. Vite didn't return anything.`), options),
			filepath,
			parsed: "",
			map: null,
			definitions: []
		};
	}
	const { file, definitions } = createFileTask(project, testFilepath, request.code, request.map, filepath, request.fileTags, options);
	return {
		file,
		filepath,
		parsed: request.code,
		map: request.map,
		definitions
	};
}
async function transformSSR(project, filepath) {
	// Read original file content to extract pragmas (environment, tags)
	const originalCode = await promises.readFile(filepath, "utf-8").catch(() => "");
	const { env: pragmaEnv, tags: fileTags } = detectCodeBlock(originalCode);
	// Use environment from pragma if defined, otherwise fall back to config
	const environment = pragmaEnv || project.config.environment;
	const transformResult = await (environment === "jsdom" || environment === "happy-dom" ? project.vite.environments.client : project.vite.environments.ssr).transformRequest(filepath);
	return transformResult ? {
		...transformResult,
		fileTags
	} : null;
}
// Walk up from the suite a task was added to, marking each ancestor as
// containing an `only` task. Stops at the first already-marked ancestor (its
// own ancestors are already marked), keeping the total work linear.
function markAncestorsContainOnly(suite) {
	let current = suite;
	while (current && !current.containsOnly) {
		current.containsOnly = true;
		current = current.suite;
	}
}
function markDynamicTests(tasks) {
	for (const task of tasks) {
		if (task.dynamic) task.id += "-dynamic";
		if ("tasks" in task) markDynamicTests(task.tasks);
	}
}
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const kReplacers = /* @__PURE__ */ new Map([
	["%i", "\\d+?"],
	["%#", "\\d+?"],
	["%d", "[\\d.eE+-]+?"],
	["%f", "[\\d.eE+-]+?"],
	["%s", ".+?"],
	["%j", ".+?"],
	["%o", ".+?"],
	["%%", "%"]
]);
function escapeTestName(label, dynamic) {
	if (!dynamic) return escapeRegex(label);
	// Replace object access patterns ($value, $obj.a) with %s first
	let pattern = label.replace(/\$[a-z_.]+/gi, "%s");
	pattern = escapeRegex(pattern);
	// Replace percent placeholders with their respective regex
	pattern = pattern.replace(/%[i#dfsjo%]/g, (m) => kReplacers.get(m) || m);
	return pattern;
}

class BrowserSessions {
	sessions = /* @__PURE__ */ new Map();
	sessionIds = /* @__PURE__ */ new Set();
	getSession(sessionId) {
		return this.sessions.get(sessionId);
	}
	destroySession(sessionId) {
		this.sessions.delete(sessionId);
	}
	createSession(sessionId, project, pool, options) {
		// this promise waits until the orchestrator is ready to accept RPC calls
		const defer = createDefer();
		let isConnected = false;
		let isReady = false;
		const timeout = setTimeout(() => {
			defer.reject(/* @__PURE__ */ new Error(`Failed to connect to the browser session "${sessionId}" [${project.name}] within the timeout.`));
		}, project.config.browser.connectTimeout ?? 6e4).unref();
		const resolveIfReady = () => {
			if (!isConnected || !isReady) return;
			defer.resolve();
			clearTimeout(timeout);
		};
		this.sessions.set(sessionId, {
			project,
			otelCarrier: options?.otelCarrier,
			// assigned by the pool on the session's first run, freed when it disconnects
			concurrencyId: 0,
			connected: () => {
				isConnected = true;
				resolveIfReady();
			},
			ready: () => {
				isReady = true;
				resolveIfReady();
			},
			// this fails the whole test run and cancels the pool
			fail: (error) => {
				defer.resolve();
				clearTimeout(timeout);
				pool.reject(error);
			}
		});
		return defer;
	}
}

class FilesStatsCache {
	cache = /* @__PURE__ */ new Map();
	getStats(key) {
		return this.cache.get(key);
	}
	async populateStats(root, specs) {
		const promises = specs.map((spec) => {
			const key = `${spec.project.name}:${relative(root, spec.moduleId)}`;
			return this.updateStats(spec.moduleId, key);
		});
		await Promise.all(promises);
	}
	async updateStats(fsPath, key) {
		try {
			const stats = await fs__default.promises.stat(fsPath);
			this.cache.set(key, { size: stats.size });
		} catch {}
	}
	removeStats(fsPath) {
		this.cache.forEach((_, key) => {
			if (key.endsWith(fsPath)) this.cache.delete(key);
		});
	}
}

class ResultsCache {
	logger;
	cache = /* @__PURE__ */ new Map();
	workspacesKeyMap = /* @__PURE__ */ new Map();
	cachePath = null;
	version;
	root = "/";
	constructor(logger) {
		this.logger = logger;
		this.version = Vitest.version;
	}
	getCachePath() {
		return this.cachePath;
	}
	setConfig(root, config) {
		this.root = root;
		if (config) this.cachePath = resolve(config.dir, "results.json");
	}
	getResults(key) {
		return this.cache.get(key);
	}
	async clearCache() {
		if (this.cachePath && existsSync(this.cachePath)) {
			await rm(this.cachePath, {
				force: true,
				recursive: true
			});
			this.logger.log("[cache] cleared results cache at", this.cachePath);
		}
	}
	async readFromCache() {
		if (!this.cachePath) return;
		if (!fs__default.existsSync(this.cachePath)) return;
		const resultsCache = await fs__default.promises.readFile(this.cachePath, "utf8");
		const { results, version } = JSON.parse(resultsCache || "[]");
		const [major, minor] = version.split(".");
		// handling changed in 0.30.0
		if (major > 0 || Number(minor) >= 30) {
			this.cache = new Map(results);
			this.version = version;
			results.forEach(([spec]) => {
				const [projectName, relativePath] = spec.split(":");
				const keyMap = this.workspacesKeyMap.get(relativePath) || [];
				keyMap.push(projectName);
				this.workspacesKeyMap.set(relativePath, keyMap);
			});
		}
	}
	updateResults(files) {
		files.forEach((file) => {
			const result = file.result;
			if (!result) return;
			const duration = result.duration || 0;
			// store as relative, so cache would be the same in CI and locally
			const relativePath = relative(this.root, file.filepath);
			this.cache.set(`${file.projectName || ""}:${relativePath}`, {
				duration: duration >= 0 ? duration : 0,
				failed: result.state === "fail"
			});
		});
	}
	removeFromCache(filepath) {
		this.cache.forEach((_, key) => {
			if (key.endsWith(filepath)) this.cache.delete(key);
		});
	}
	async writeToCache() {
		if (!this.cachePath) return;
		const results = Array.from(this.cache.entries());
		const cacheDirname = dirname(this.cachePath);
		if (!fs__default.existsSync(cacheDirname)) await fs__default.promises.mkdir(cacheDirname, { recursive: true });
		const cache = JSON.stringify({
			version: this.version,
			results
		});
		await fs__default.promises.writeFile(this.cachePath, cache);
	}
}

class VitestCache {
	results;
	stats = new FilesStatsCache();
	constructor(logger) {
		this.results = new ResultsCache(logger);
	}
	getFileTestResults(key) {
		return this.results.getResults(key);
	}
	getFileStats(key) {
		return this.stats.getStats(key);
	}
	static resolveCacheDir(root, dir, projectName) {
		const baseDir = slash(dir || "node_modules/.vite");
		return resolve(root, baseDir, "vitest", hash("sha1", projectName || "", "hex"));
	}
}

const debugFs = createDebugger("vitest:cache:fs");
const debugMemory = createDebugger("vitest:cache:memory");
const cacheComment = "\n//# vitestCache=";
const cacheCommentLength = 17;
const METADATA_FILE = "_metadata.json";
// Default location of the module cache. It lives inside `node_modules` at the
// workspace root so it's shared by every project and is naturally invalidated
// whenever dependencies are reinstalled.
const DEFAULT_CACHE_DIRNAME = ".vitest-cache";
const parallelFsCacheRead = /* @__PURE__ */ new Map();
class FileSystemModuleCache {
	vitest;
	/**
	* Each project can point its module cache at a different directory with
	* `fsModuleCachePath`; projects that don't override it fall back to the root
	* cache. We still keep a single metadata file (in the root cache) for the whole
	* workspace because
	* - projects can reference files between each other
	* - lockfile changes are reflected for the whole workspace, not just for a single project
	*/
	rootCache;
	metadataFilePath;
	version = "1.0.0-beta.7";
	fsCacheRoots = /* @__PURE__ */ new WeakMap();
	fsEnvironmentHashMap = /* @__PURE__ */ new WeakMap();
	fsCacheKeyGenerators = /* @__PURE__ */ new Set();
	warnedDeprecatedIgnore = /* @__PURE__ */ new Set();
	// this exists only to avoid the perf. cost of reading a file and generating a hash again
	// surprisingly, on some machines this has negligible effect
	fsCacheKeys = /* @__PURE__ */ new WeakMap();
	constructor(vitest) {
		this.vitest = vitest;
		this.rootCache = vitest.config.fsModuleCachePath || join(searchForWorkspaceRoot(vitest.viteConfig.root), "node_modules", DEFAULT_CACHE_DIRNAME);
		this.metadataFilePath = join(this.rootCache, METADATA_FILE);
	}
	defineCacheKeyGenerator(callback) {
		this.fsCacheKeyGenerators.add(callback);
	}
	// A plugin can exclude itself from the cache key via `api.vitest.ignoreFsModuleCache`.
	ignoresFsModuleCache(plugin) {
		const api = plugin.api?.vitest;
		if (api?.ignoreFsModuleCache === true) return true;
		if (api?.experimental?.ignoreFsModuleCache === true) {
			if (!this.warnedDeprecatedIgnore.has(plugin.name)) {
				this.warnedDeprecatedIgnore.add(plugin.name);
				this.vitest.logger.deprecate(`The plugin "${plugin.name}" sets \`api.vitest.experimental.ignoreFsModuleCache\`, which is deprecated. Use \`api.vitest.ignoreFsModuleCache\` instead.`);
			}
			return true;
		}
		return false;
	}
	async clearCache(log = true) {
		const fsCachePaths = [this.rootCache, ...this.vitest.projects.map((r) => r.config.fsModuleCachePath || this.rootCache)];
		const uniquePaths = Array.from(new Set(fsCachePaths));
		await Promise.all(uniquePaths.map((directory) => rm(directory, {
			force: true,
			recursive: true
		})));
		if (log) this.vitest.logger.log(`[cache] cleared fs module cache at ${uniquePaths.join(", ")}`);
	}
	readCachedFileConcurrently(cachedFilePath) {
		if (!parallelFsCacheRead.has(cachedFilePath)) parallelFsCacheRead.set(cachedFilePath, readFile(cachedFilePath, "utf-8").then((code) => {
			const matchIndex = code.lastIndexOf(cacheComment);
			if (matchIndex === -1) {
				debugFs?.(`${y.red("[empty]")} ${cachedFilePath} exists, but doesn't have a ${cacheComment} comment, transforming by vite instead`);
				return;
			}
			return {
				code,
				meta: this.fromBase64(code.slice(matchIndex + cacheCommentLength))
			};
		}).finally(() => {
			parallelFsCacheRead.delete(cachedFilePath);
		}));
		return parallelFsCacheRead.get(cachedFilePath);
	}
	async getCachedModule(cachedFilePath) {
		if (!existsSync(cachedFilePath)) {
			debugFs?.(`${y.red("[empty]")} ${cachedFilePath} doesn't exist, transforming by vite first`);
			return;
		}
		const fileResult = await this.readCachedFileConcurrently(cachedFilePath);
		if (!fileResult) return;
		const { code, meta } = fileResult;
		debugFs?.(`${y.green("[read]")} ${meta.id} is cached in ${cachedFilePath}`);
		return {
			id: meta.id,
			url: meta.url,
			file: meta.file,
			code,
			importedUrls: meta.importedUrls,
			mappings: meta.mappings,
			moduleType: meta.moduleType,
			deps: meta.deps,
			dynamicDeps: meta.dynamicDeps,
			staticMocks: meta.staticMocks
		};
	}
	async saveCachedModule(cachedFilePath, fetchResult, transformResult, importedUrls = [], mappings = false) {
		if ("code" in fetchResult) {
			const result = {
				file: fetchResult.file,
				id: fetchResult.id,
				url: fetchResult.url,
				importedUrls,
				mappings,
				moduleType: fetchResult.moduleType,
				deps: transformResult?.deps,
				dynamicDeps: transformResult?.dynamicDeps,
				staticMocks: transformResult?.__vitestStaticMocks
			};
			debugFs?.(`${y.yellow("[write]")} ${fetchResult.id} is cached in ${cachedFilePath}`);
			await atomicWriteFile(cachedFilePath, `${fetchResult.code}${cacheComment}${this.toBase64(result)}`);
		}
	}
	toBase64(obj) {
		const json = stringify(obj);
		return Buffer.from(json).toString("base64");
	}
	fromBase64(obj) {
		const json = Buffer.from(obj, "base64").toString("utf-8");
		return parse(json);
	}
	invalidateCachePath(environment, id) {
		debugFs?.(`cache for ${id} in ${environment.name} environment is invalidated`);
		this.fsCacheKeys.get(environment)?.delete(id);
	}
	invalidateAllCachePaths(environment) {
		debugFs?.(`the ${environment.name} environment cache is invalidated`);
		this.fsCacheKeys.get(environment)?.clear();
	}
	getMemoryCachePath(environment, id) {
		const result = this.fsCacheKeys.get(environment)?.get(id);
		if (result != null) debugMemory?.(`${y.green("[read]")} ${id} was cached in ${result}`);
		else if (result === null) debugMemory?.(`${y.green("[read]")} ${id} was bailed out`);
		return result;
	}
	generateCachePath(vitestConfig, environment, id, fileContent) {
		// bail out if file has import.meta.glob because it depends on other files
		// TODO: figure out a way to still support it
		if (fileContent.includes("import.meta.glob(")) {
			this.saveMemoryCache(environment, id, null);
			debugMemory?.(`${y.yellow("[write]")} ${id} was bailed out because it has "import.meta.glob"`);
			return null;
		}
		let hashString = "";
		for (const generator of this.fsCacheKeyGenerators) {
			const result = generator({
				environment,
				id,
				sourceCode: fileContent
			});
			if (typeof result === "string") hashString += result;
			if (result === false) {
				this.saveMemoryCache(environment, id, null);
				debugMemory?.(`${y.yellow("[write]")} ${id} was bailed out by a custom generator`);
				return null;
			}
		}
		const config = environment.config;
		// coverage provider is dynamic, so we also clear the whole cache if
		// vitest.enableCoverage/vitest.disableCoverage is called
		const coverageAffectsCache = String(this.vitest.config.coverage.enabled && this.vitest.coverageProvider?.requiresTransform?.(id));
		let environmentHash = this.fsEnvironmentHashMap.get(environment);
		if (!environmentHash) {
			const cacheConfig = JSON.stringify({
				root: config.root,
				// at the moment, Vitest always forces base to be /
				base: config.base,
				mode: config.mode,
				consumer: config.consumer,
				resolve: config.resolve,
				injectCjsGlobal: vitestConfig.injectCjsGlobals,
				// plugins can have different options, so this is not the best key,
				// but we cannot access the options because there is no standard API for it
				plugins: config.plugins.filter((p) => !this.ignoresFsModuleCache(p)).map((p) => p.name),
				// in case local plugins change
				// configFileDependencies also includes configFile
				configFileDependencies: config.configFileDependencies.map((file) => tryReadFileSync(file)),
				environment: environment.name,
				// this affects Vitest CSS plugin
				css: vitestConfig.css
			}, (_, value) => {
				if (typeof value === "function" || value instanceof RegExp) return value.toString();
				return value;
			});
			// everything in the key that does not depend on the module, as one digest
			environmentHash = hash("sha1", (process.env.NODE_ENV ?? "") + this.version + cacheConfig, "hex");
			this.fsEnvironmentHashMap.set(environment, environmentHash);
		}
		hashString += id + fileContent + environmentHash + coverageAffectsCache;
		const cacheKey = hash("sha1", hashString, "hex");
		let cacheRoot = this.fsCacheRoots.get(vitestConfig);
		if (cacheRoot == null) {
			cacheRoot = vitestConfig.fsModuleCachePath || this.rootCache;
			this.fsCacheRoots.set(vitestConfig, cacheRoot);
			if (!existsSync(cacheRoot)) mkdirSync(cacheRoot, { recursive: true });
		}
		const fsResultPath = join(cacheRoot, cacheKey);
		debugMemory?.(`${y.yellow("[write]")} ${id} generated a cache in ${fsResultPath}`);
		this.saveMemoryCache(environment, id, fsResultPath);
		return fsResultPath;
	}
	saveMemoryCache(environment, id, cache) {
		let environmentKeys = this.fsCacheKeys.get(environment);
		if (!environmentKeys) {
			environmentKeys = /* @__PURE__ */ new Map();
			this.fsCacheKeys.set(environment, environmentKeys);
		}
		environmentKeys.set(id, cache);
	}
	async readMetadata() {
		// metadata is shared between every project in the workspace, so we always read it from the root cache
		if (!existsSync(this.metadataFilePath)) return;
		try {
			const content = await readFile(this.metadataFilePath, "utf-8");
			return JSON.parse(content);
		} catch {}
	}
	async writeMetadata(lockfileHash) {
		try {
			if (!existsSync(this.rootCache)) mkdirSync(this.rootCache, { recursive: true });
			await writeFile(this.metadataFilePath, JSON.stringify({ lockfileHash }, null, 2), "utf-8");
		} catch (error) {
			// Recording the metadata is best-effort and losing the file shouldn't
			// abort the entire execution
			debugFs?.(`failed to write fs cache metadata: ${error}`);
		}
	}
	// before vitest starts running tests, we check that the lockfile wasn't updated
	// if it was, we nuke the previous cache in case a custom plugin was updated
	// or a new version of vite/vitest is installed
	// for the same reason we also cache config file content, but that won't catch changes made in external plugins
	async ensureCacheIntegrity() {
		if (![this.vitest.getRootProject(), ...this.vitest.projects].some((p) => p.config.fsModuleCache)) return;
		const metadata = await this.readMetadata();
		const currentLockfileHash = getLockfileHash(this.vitest.vite.config.root);
		// no metadata found, just store a new one, don't reset the cache
		if (!metadata) {
			debugFs?.(`fs metadata file was created with hash ${currentLockfileHash}`);
			await this.writeMetadata(currentLockfileHash);
			return;
		}
		// if lockfile didn't change, don't do anything
		if (metadata.lockfileHash === currentLockfileHash) return;
		// lockfile changed, let's clear all caches
		await this.clearCache(false);
		await this.writeMetadata(currentLockfileHash);
		this.vitest.vite.config.logger.info(`fs cache was cleared because lockfile has changed`, {
			timestamp: true,
			environment: y.yellow("[vitest]")
		});
		debugFs?.(`fs cache was cleared because lockfile has changed`);
	}
}
/**
* Performs an atomic write operation using the write-then-rename pattern.
*
* Why we need this:
* - Ensures file integrity by never leaving partially written files on disk
* - Prevents other processes from reading incomplete data during writes
* - Particularly important for test files where incomplete writes could cause test failures
*
* The implementation writes to a temporary file first, then renames it to the target path.
* This rename operation is atomic on most filesystems (including POSIX-compliant ones),
* guaranteeing that other processes will only ever see the complete file.
*
* Added in https://github.com/vitest-dev/vitest/pull/7531
*/
async function atomicWriteFile(realFilePath, data) {
	const dir = dirname(realFilePath);
	const tmpFilePath = join(dir, `.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	try {
		await writeFile(tmpFilePath, data, "utf-8");
		await rename(tmpFilePath, realFilePath);
	} finally {
		try {
			if (await stat(tmpFilePath)) await unlink(tmpFilePath);
		} catch {}
	}
}
// lockfile hash resolution taken from vite
// since this is experimental, we don't ask to expose it
const lockfileFormats = [
	{
		path: "node_modules/.package-lock.json",
		checkPatchesDir: "patches",
		manager: "npm"
	},
	{
		// Yarn non-PnP
		path: "node_modules/.yarn-state.yml",
		checkPatchesDir: false,
		manager: "yarn"
	},
	{
		// Yarn v3+ PnP
		path: ".pnp.cjs",
		checkPatchesDir: ".yarn/patches",
		manager: "yarn"
	},
	{
		// Yarn v2 PnP
		path: ".pnp.js",
		checkPatchesDir: ".yarn/patches",
		manager: "yarn"
	},
	{
		// yarn 1
		path: "node_modules/.yarn-integrity",
		checkPatchesDir: "patches",
		manager: "yarn"
	},
	{
		path: "node_modules/.pnpm/lock.yaml",
		// Included in lockfile
		checkPatchesDir: false,
		manager: "pnpm"
	},
	{
		path: ".rush/temp/shrinkwrap-deps.json",
		// Included in lockfile
		checkPatchesDir: false,
		manager: "pnpm"
	},
	{
		path: "bun.lock",
		checkPatchesDir: "patches",
		manager: "bun"
	},
	{
		path: "bun.lockb",
		checkPatchesDir: "patches",
		manager: "bun"
	}
].sort((_, { manager }) => {
	return process.env.npm_config_user_agent?.startsWith(manager) ? 1 : -1;
});
const lockfilePaths = lockfileFormats.map((l) => l.path);
function getLockfileHash(root) {
	const lockfilePath = lookupFile(root, lockfilePaths);
	let content = lockfilePath ? fs__default.readFileSync(lockfilePath, "utf-8") : "";
	if (lockfilePath) {
		const normalizedLockfilePath = lockfilePath.replaceAll("\\", "/");
		const lockfileFormat = lockfileFormats.find((f) => normalizedLockfilePath.endsWith(f.path));
		if (lockfileFormat.checkPatchesDir) {
			// Default of https://github.com/ds300/patch-package
			const baseDir = lockfilePath.slice(0, -lockfileFormat.path.length);
			const stat = tryStatSync(join(baseDir, lockfileFormat.checkPatchesDir));
			if (stat?.isDirectory()) content += stat.mtimeMs.toString();
		}
	}
	return hash("sha256", content, "hex").substring(0, 8).padEnd(8, "_");
}
function lookupFile(dir, fileNames) {
	while (dir) {
		for (const fileName of fileNames) {
			const fullPath = join(dir, fileName);
			if (tryStatSync(fullPath)?.isFile()) return fullPath;
		}
		const parentDir = dirname(dir);
		if (parentDir === dir) return;
		dir = parentDir;
	}
}
function tryReadFileSync(file) {
	try {
		return readFileSync(file, "utf-8");
	} catch {
		return "";
	}
}
function tryStatSync(file) {
	try {
		// The "throwIfNoEntry" is a performance optimization for cases where the file does not exist
		return fs__default.statSync(file, { throwIfNoEntry: false });
	} catch {}
}

function getWorkersCountByPercentage(percent) {
	const maxWorkersCount = os__default.availableParallelism?.() ?? os__default.cpus().length;
	const workersCountByPercentage = Math.round(Number.parseInt(percent) / 100 * maxWorkersCount);
	return Math.max(1, Math.min(maxWorkersCount, workersCountByPercentage));
}

const LogLevels = {
	silent: 0,
	error: 1,
	warn: 2,
	info: 3
};
function clearScreen(logger) {
	const repeatCount = process.stdout.rows - 2;
	const blank = repeatCount > 0 ? "\n".repeat(repeatCount) : "";
	logger.clearScreen(blank);
}
let lastType;
let lastMsg;
let sameCount = 0;
// Only initialize the timeFormatter when the timestamp option is used, and
// reuse it across all loggers
let timeFormatter;
function getTimeFormatter() {
	timeFormatter ??= new Intl.DateTimeFormat(void 0, {
		hour: "numeric",
		minute: "numeric",
		second: "numeric"
	});
	return timeFormatter;
}
// This is copy-pasted and needs to be synced from time to time. Ideally, Vite's `createLogger` should accept a custom `console`
// https://github.com/vitejs/vite/blob/main/packages/vite/src/node/logger.ts?rgh-link-date=2024-10-16T23%3A29%3A19Z
// When Vitest supports only Vite 6 and above, we can use Vite's `createLogger({ console })`
// https://github.com/vitejs/vite/pull/18379
function createViteLogger(console, level = "info", options = {}) {
	const loggedErrors = /* @__PURE__ */ new WeakSet();
	const { prefix = "[vite]", allowClearScreen = true } = options;
	const thresh = LogLevels[level];
	const canClearScreen = allowClearScreen && process.stdout.isTTY && !process.env.CI;
	const clear = canClearScreen ? clearScreen : () => {};
	function format(type, msg, options = {}) {
		if (options.timestamp) {
			let tag = "";
			if (type === "info") tag = y.cyan(y.bold(prefix));
			else if (type === "warn") tag = y.yellow(y.bold(prefix));
			else tag = y.red(y.bold(prefix));
			const environment = options.environment ? `${options.environment} ` : "";
			return `${y.dim(getTimeFormatter().format(/* @__PURE__ */ new Date()))} ${tag} ${environment}${msg}`;
		} else return msg;
	}
	function output(type, msg, options = {}) {
		if (thresh >= LogLevels[type]) {
			const method = type === "info" ? "log" : type;
			if (options.error) loggedErrors.add(options.error);
			if (canClearScreen) if (type === lastType && msg === lastMsg) {
				sameCount++;
				clear(console);
				console[method](format(type, msg, options), y.yellow(`(x${sameCount + 1})`));
			} else {
				sameCount = 0;
				lastMsg = msg;
				lastType = type;
				if (options.clear) clear(console);
				console[method](format(type, msg, options));
			}
			else console[method](format(type, msg, options));
		}
	}
	const warnedMessages = /* @__PURE__ */ new Set();
	const logger = {
		hasWarned: false,
		info(msg, opts) {
			output("info", msg, opts);
		},
		warn(msg, opts) {
			logger.hasWarned = true;
			output("warn", msg, opts);
		},
		warnOnce(msg, opts) {
			if (warnedMessages.has(msg)) return;
			logger.hasWarned = true;
			output("warn", msg, opts);
			warnedMessages.add(msg);
		},
		error(msg, opts) {
			logger.hasWarned = true;
			output("error", msg, opts);
		},
		clearScreen(type) {
			if (thresh >= LogLevels[type]) clear(console);
		},
		hasErrorLogged(error) {
			return loggedErrors.has(error);
		}
	};
	return logger;
}
// silence warning by Vite for statically not analyzable dynamic import
function silenceImportViteIgnoreWarning(logger) {
	return {
		...logger,
		warn(msg, options) {
			if (msg.includes("The above dynamic import cannot be analyzed by Vite")) return;
			logger.warn(msg, options);
		}
	};
}

function sortPluginsByEnforce(plugins) {
	const pre = [];
	const normal = [];
	const post = [];
	for (const plugin of plugins) if (plugin.enforce === "pre") pre.push(plugin);
	else if (plugin.enforce === "post") post.push(plugin);
	else normal.push(plugin);
	return [
		...pre,
		...normal,
		...post
	];
}
function BrowserLoaderPlugin(captures, harness) {
	return [{
		name: "vitest:browser:loader",
		// `pre` so the browser plugins injected via `applyToEnvironment` land before
		// Vite's internal resolver in the `client` environment (so e.g. the
		// `vitest/browser` virtual module wins over the node stub resolution).
		enforce: "pre",
		async config(viteConfig) {
			const browser = viteConfig.test?.browser;
			if (!browser?.enabled) return;
			// The provider can be configured at the project level or per instance
			// (e.g. connect mode). All instances in a project share one provider
			// (validated in `resolveTestConfig`), so any instance's server factory
			// builds the shared server.
			const provider = browser.provider ?? browser.instances?.find((instance) => instance.provider)?.provider;
			if (!provider || typeof provider.serverFactory !== "function") throw new Error(`Browser Mode was enabled, but provider was not specified anywhere. See https://vitest.dev/guide/browser/#configuration`);
			const contribution = await provider.serverFactory();
			captures.browserContribution = contribution;
			const browserConfig = await contribution.config(viteConfig, harness);
			const logLevel = viteConfig.logLevel ?? "warn";
			const logger = createViteLogger(harness.logger, logLevel, { allowClearScreen: false });
			return {
				...browserConfig,
				customLogger: {
					...logger,
					info(message, options) {
						if (message.includes("dependency optimized: ") || message.includes("dependencies optimized: ") || message.includes("optimized dependencies changed. reloading"))
 // escalate from `info` to `warn` so it shows up on Vitest's default logLevel `warn`
						logger.warn(message, options);
						else logger.info(message, options);
						if (message.includes("optimized dependencies changed. reloading")) logger.warn([y.yellow(`\n${y.bold("[vitest]")} Vite unexpectedly reloaded a test. This may cause tests to fail, lead to flaky behaviour or duplicated test runs.\n`), y.yellow(`For a stable experience, add the newly optimized dependencies to your config's ${y.bold("`optimizeDeps.include`")} field manually.\n`)].join(""));
					}
				}
			};
		},
		applyToEnvironment(environment) {
			const contribution = captures.browserContribution;
			if (contribution && environment.name === "client")
 // `post` browser plugins are injected by `vitest:browser:loader:post`
			// instead, so they run after the `post` plugins of the main pipeline
			// rather than at this `pre` position. For example, the mocker's
			// `vitest:browser:esm-injector` must run after `vitest:mocks`, which is
			// added by the main pipeline and is not part of `contribution.plugins`.
			return sortPluginsByEnforce(contribution.plugins.filter((plugin) => plugin.enforce !== "post"));
			return false;
		},
		configureServer: {
			order: "pre",
			async handler(server) {
				await captures.browserContribution?.configureServer(server);
			}
		},
		transformIndexHtml: {
			order: "pre",
			async handler(html, ctx) {
				return captures.browserContribution?.transformIndexHtml(ctx);
			}
		}
	}, {
		name: "vitest:browser:loader:post",
		enforce: "post",
		applyToEnvironment(environment) {
			const contribution = captures.browserContribution;
			if (contribution && environment.name === "client") return sortPluginsByEnforce(contribution.plugins.filter((plugin) => plugin.enforce === "post"));
			return false;
		}
	}];
}
async function createClusterServer(vitest, viteConfig, config, children) {
	const contribution = config._browserContribution;
	if (!contribution) {
		const server = await createViteServer(viteConfig);
		if (config.api.port) await server.listen(config.api.port);
		return { server };
	}
	const parent = contribution.createParent({
		config,
		vitest
	});
	contribution.parent = parent;
	// Start browser launches now so their latency overlaps Vite server creation.
	// Entries that cannot run browser tests are skipped because they will never
	// initialize a provider that could adopt and close the prepared browser.
	for (const child of children) {
		if (child.hidden || child.hasTestFiles === false || child.projectConfig.typecheck.enabled && child.projectConfig.typecheck.only) continue;
		// The Vite server is shared, but each child carries its own resolved
		// provider and browser options, so it must be prewarmed independently.
		const projectConfig = child.projectConfig;
		projectConfig.browser.provider?.prewarm?.({
			config: projectConfig,
			vitest
		});
	}
	const server = await createViteServer(viteConfig);
	await server.listen(config.api.port);
	contribution.setupRpc(parent);
	return {
		server,
		parent
	};
}

function generateCssFilenameHash(filepath) {
	return hash("sha1", filepath, "hex").slice(0, 6);
}
function generateScopedClassName(strategy, name, filename) {
	// should be configured by Vite defaults
	if (strategy === "scoped") return null;
	if (strategy === "non-scoped") return name;
	return `_${name}_${generateCssFilenameHash(filename)}`;
}

function resolveTestCacheDir(root, testConfig, viteCacheDir) {
	const name = testConfig.name;
	const label = typeof name === "string" ? name : name?.label || "";
	return VitestCache.resolveCacheDir(root, testConfig.cache != null && testConfig.cache !== false ? testConfig.cache.dir : viteCacheDir, label);
}
function resolveOptimizerConfig(testOptions_, viteOptions) {
	const testOptions = testOptions_ || {};
	let optimizeDeps;
	if (testOptions.enabled !== true) {
		testOptions.enabled ??= false;
		optimizeDeps = {
			// experimental in Vite >2.9.2, entries remains to help with older versions
			disabled: true,
			entries: []
		};
	} else {
		const currentInclude = testOptions.include || viteOptions?.include || [];
		const exclude = [
			"vitest",
			"react",
			"vue",
			...testOptions.exclude || viteOptions?.exclude || []
		];
		const runtime = currentInclude.filter((n) => n.endsWith("jsx-dev-runtime") || n.endsWith("jsx-runtime"));
		exclude.push(...runtime);
		const include = (testOptions.include || viteOptions?.include || []).filter((n) => !exclude.includes(n));
		optimizeDeps = {
			...viteOptions,
			...testOptions,
			noDiscovery: true,
			disabled: false,
			entries: [],
			exclude,
			include
		};
	}
	// `optimizeDeps.disabled` is deprecated since v5.1.0-beta.1
	// https://github.com/vitejs/vite/pull/15184
	if (optimizeDeps.disabled) {
		optimizeDeps.noDiscovery = true;
		optimizeDeps.include = [];
	}
	delete optimizeDeps.disabled;
	return optimizeDeps;
}
function deleteDefineConfig(viteConfig) {
	const defines = {};
	const scriptDefines = {};
	if (viteConfig.define) {
		delete viteConfig.define["process.env"];
		delete viteConfig.define.process;
		delete viteConfig.define.global;
	}
	for (const key in viteConfig.define) {
		const val = viteConfig.define[key];
		// vitest sets this identity replacement to defeat vite:client-inject,
		// it has to stay in the config
		if (key === "process.env.NODE_ENV" && val === "process.env.NODE_ENV") continue;
		let replacement;
		try {
			replacement = typeof val === "string" ? JSON.parse(val) : val;
		} catch {
			// a reference to code, like "__VAR__": "process.env.VAR";
			// the defines script evaluates the raw value at runtime
			scriptDefines[key] = val;
			delete viteConfig.define[key];
			continue;
		}
		if (key.startsWith("import.meta.env.")) {
			const envKey = key.slice(16);
			process.env[envKey] = replacement;
			delete viteConfig.define[key];
		} else if (key.startsWith("process.env.")) {
			const envKey = key.slice(12);
			process.env[envKey] = replacement;
			delete viteConfig.define[key];
		} else if (!key.includes(".")) {
			defines[key] = replacement;
			delete viteConfig.define[key];
		} else {
			scriptDefines[key] = val;
			delete viteConfig.define[key];
		}
	}
	return {
		defines,
		scriptDefines
	};
}
function resolveFsAllow(projectRoot, rootConfigFile) {
	if (!rootConfigFile) return [searchForWorkspaceRoot(projectRoot), rootDir];
	return [
		dirname(rootConfigFile),
		searchForWorkspaceRoot(projectRoot),
		rootDir
	];
}
function getDefaultResolveOptions() {
	return {
		// by default Vite resolves `module` field, which is not always a native ESM module
		// setting this option can bypass that and fallback to cjs version
		mainFields: [],
		// same for `module` condition and Vite 5 doesn't even allow excluding it,
		// but now it's possible since Vite 6.
		conditions: getDefaultServerConditions()
	};
}
function getDefaultServerConditions() {
	if (Number(version.split(".")[0]) >= 6) return vite.defaultServerConditions.filter((c) => c !== "module");
	return ["node"];
}

function ModuleRunnerTransform() {
	let testConfig;
	// make sure Vite always applies the module runner transform
	return {
		name: "vitest:environments-module-runner",
		config: {
			order: "post",
			handler(config) {
				testConfig = config.test || {};
				// In browser mode the `client` environment serves test code to a real
				// browser via native ESM, so it must NOT be module-runner-transformed.
				// `ssr`/`__vitest__` keep the transform (node-side global setup + watch
				// run there). Note: jsdom/happy-dom (node mode) also uses `client` and
				// DOES need the transform, hence the `browser.enabled` gate.
				const browserEnabled = !!config.test?.browser?.enabled;
				config.environments ??= {};
				const names = new Set(Object.keys(config.environments));
				names.add("client");
				names.add("ssr");
				const pool = config.test?.pool;
				if (pool === "vmForks" || pool === "vmThreads") names.add("__vitest_vm__");
				for (const name of names) {
					config.environments[name] ??= {};
					const environment = config.environments[name];
					environment.dev ??= {};
					// vm tests run using the native import mechanism
					if (name === "__vitest_vm__") {
						environment.dev.moduleRunnerTransform = false;
						environment.consumer = "client";
					} else if (name === "client" && browserEnabled) environment.dev.moduleRunnerTransform = false;
					else environment.dev.moduleRunnerTransform = true;
					if (name !== "client" || !browserEnabled) environment.dev.preTransformRequests = false;
					environment.keepProcessEnv = true;
				}
			}
		},
		configEnvironment: {
			order: "post",
			handler(name, config) {
				if (name === "__vitest_vm__" || name === "__vitest__") return;
				// In browser mode the `client` environment is browser-managed: don't
				// apply node-runner externalization / `optimizeDeps` to it (that would
				// discard the browser `optimizeDeps.include`, e.g. `vitest > expect-type`).
				if (name === "client" && testConfig.browser?.enabled) return;
				config.resolve ??= {};
				// remove Vite's externalization logic because we have our own (unfortunately)
				config.resolve.external = [...builtinModules, ...builtinModules.filter((m) => !m.startsWith("node:")).map((m) => `node:${m}`)];
				// by setting `noExternal` to `true`, we make sure that
				// Vite will never use its own externalization mechanism
				// to externalize modules and always resolve static imports
				// in both SSR and Client environments
				config.resolve.noExternal = true;
				config.optimizeDeps = resolveOptimizerConfig(testConfig?.deps?.optimizer?.[name], config.optimizeDeps);
			}
		}
	};
}

function ViteConfigPlugin(harness) {
	let root;
	return [
		{
			name: "vitest:config:server-defaults",
			config: {
				// These static server toggles must be visible to other plugins that
				// read `server.hmr` in their own `config` hook: `@vitejs/plugin-react`
				// turns React Fast Refresh off only when it sees HMR disabled.
				// A `post` hook (in `vitest:config:server`) runs after such plugins,
				// so set them here in a `pre` hook instead.
				order: "pre",
				handler() {
					return { server: {
						hmr: false,
						open: false
					} };
				}
			}
		},
		{
			name: "vitest:config",
			enforce: "pre",
			configResolved(config) {
				root = config.root;
			},
			config(viteConfig) {
				const testConfig = viteConfig.test || {};
				const resolveOptions = getDefaultResolveOptions();
				const browserEnabled = !!testConfig.browser?.enabled;
				// move `test.alias` to Vite's `resolve.alias`
				const alias = testConfig.alias;
				delete testConfig.alias;
				const config = browserEnabled ? { resolve: { alias } } : {
					define: { 
					// disable replacing `process.env.NODE_ENV` with static string by vite:client-inject
"process.env.NODE_ENV": "process.env.NODE_ENV" },
					resolve: {
						...resolveOptions,
						alias
					}
				};
				config.environments = {
					ssr: { resolve: resolveOptions },
					__vitest__: {
						dev: {},
						resolve: resolveOptions
					}
				};
				if (viteConfig.oxc !== false) {
					viteConfig.oxc ??= {};
					// Lowest target Vitest supports is Node22
					viteConfig.oxc.target ??= "node22";
				}
				if (!("rolldownVersion" in vite) && viteConfig.esbuild !== false) {
					viteConfig.esbuild ??= {};
					// Lowest target Vitest supports is Node22
					viteConfig.esbuild.target ??= "node22";
					viteConfig.esbuild.sourcemap = "external";
					// Enables using ignore hint for coverage providers with @preserve keyword
					viteConfig.esbuild.legalComments = "inline";
				}
				const classNameStrategy = typeof testConfig.css !== "boolean" && testConfig.css?.modules?.classNameStrategy || "stable";
				if (!browserEnabled && classNameStrategy !== "scoped") {
					config.css ??= {};
					config.css.modules ??= {};
					if (config.css.modules) config.css.modules.generateScopedName = (name, filename) => {
						return generateScopedClassName(classNameStrategy, name, relative(root, filename));
					};
				}
				config.customLogger = createViteLogger(harness.logger, viteConfig.logLevel || "warn", { allowClearScreen: false });
				config.customLogger = silenceImportViteIgnoreWarning(config.customLogger);
				return config;
			}
		},
		{
			name: "vitest:config:server",
			enforce: "post",
			config: {
				order: "post",
				handler(viteConfig) {
					// `vitest:test-config` has resolved `test.api` by now: both hooks
					// have the same order and `TestConfigPlugin` always comes earlier
					const testConfig = viteConfig.test ?? {};
					const isBrowserEnabled = !!testConfig.browser?.enabled;
					const api = testConfig.api;
					const server = { ...api };
					if (!isBrowserEnabled) server.preTransformRequests = false;
					// Always disable the websocket server in middlewareMode
					if (!isBrowserEnabled && api.middlewareMode) server.ws = false;
					else if (viteConfig.server && "ws" in viteConfig.server) viteConfig.server.ws = void 0;
					return { server };
				}
			}
		},
		ModuleRunnerTransform()
	];
}

function CoverageTransform(harness) {
	return {
		name: "vitest:coverage-transform",
		enforce: "post",
		transform(srcCode, id) {
			return harness.getVitest().coverageProvider?.onFileTransform?.(srcCode, id, this);
		}
	};
}

const cssLangs = "\\.(?:css|less|sass|scss|styl|stylus|pcss|postcss)(?:$|\\?)";
const cssLangRE = new RegExp(cssLangs);
const cssModuleRE = new RegExp(`\\.module${cssLangs}`);
const cssInlineRE = /[?&]inline(?:&|$)/;
function isCSS(id) {
	return cssLangRE.test(id);
}
function isCSSModule(id) {
	return cssModuleRE.test(id);
}
// inline css requests are expected to just return the
// string content directly and not the proxy module
function isInline(id) {
	return cssInlineRE.test(id);
}
function getCSSModuleProxyReturn(strategy, filename) {
	if (strategy === "non-scoped") return "style";
	return `\`_\${style}_${generateCssFilenameHash(filename)}\``;
}
function CSSEnablerPlugin() {
	let viteConfig;
	const shouldProcessCSS = (id) => {
		const { css } = viteConfig.test;
		if (typeof css === "boolean") return css;
		if (toArray(css.exclude).some((re) => re.test(id))) return false;
		if (toArray(css.include).some((re) => re.test(id))) return true;
		return false;
	};
	return [{
		name: "vitest:css-disable",
		enforce: "pre",
		transform(_code, id) {
			if (!isCSS(id)) return;
			// css plugin inside Vite won't do anything if the code is empty
			// but it will put __vite__updateStyle anyway
			if (!shouldProcessCSS(id)) return { code: "" };
		}
	}, {
		name: "vitest:css-empty-post",
		enforce: "post",
		configResolved(config) {
			viteConfig = config;
		},
		transform(_, id) {
			if (!isCSS(id) || shouldProcessCSS(id)) return;
			if (isCSSModule(id) && !isInline(id)) return { code: `export default new Proxy(Object.create(null), {
            get(_, style) {
              return ${getCSSModuleProxyReturn(typeof viteConfig.test.css !== "boolean" && viteConfig.test.css.modules?.classNameStrategy || "stable", relative(viteConfig.test.root, id))};
            },
          })` };
			return { code: "export default \"\"" };
		}
	}];
}

var jsTokens_1$1;
var hasRequiredJsTokens$1;

function requireJsTokens$1 () {
	if (hasRequiredJsTokens$1) return jsTokens_1$1;
	hasRequiredJsTokens$1 = 1;
	// Copyright 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023 Simon Lydell
	// License: MIT.
	var HashbangComment, Identifier, JSXIdentifier, JSXPunctuator, JSXString, JSXText, KeywordsWithExpressionAfter, KeywordsWithNoLineTerminatorAfter, LineTerminatorSequence, MultiLineComment, Newline, NumericLiteral, Punctuator, RegularExpressionLiteral, SingleLineComment, StringLiteral, Template, TokensNotPrecedingObjectLiteral, TokensPrecedingExpression, WhiteSpace;
	RegularExpressionLiteral = /\/(?![*\/])(?:\[(?:[^\]\\\n\r\u2028\u2029]+|\\.)*\]?|[^\/[\\\n\r\u2028\u2029]+|\\.)*(\/[$_\u200C\u200D\p{ID_Continue}]*|\\)?/yu;
	Punctuator = /--|\+\+|=>|\.{3}|\??\.(?!\d)|(?:&&|\|\||\?\?|[+\-%&|^]|\*{1,2}|<{1,2}|>{1,3}|!=?|={1,2}|\/(?![\/*]))=?|[?~,:;[\](){}]/y;
	Identifier = /(\x23?)(?=[$_\p{ID_Start}\\])(?:[$_\u200C\u200D\p{ID_Continue}]+|\\u[\da-fA-F]{4}|\\u\{[\da-fA-F]+\})+/yu;
	StringLiteral = /(['"])(?:[^'"\\\n\r]+|(?!\1)['"]|\\(?:\r\n|[^]))*(\1)?/y;
	NumericLiteral = /(?:0[xX][\da-fA-F](?:_?[\da-fA-F])*|0[oO][0-7](?:_?[0-7])*|0[bB][01](?:_?[01])*)n?|0n|[1-9](?:_?\d)*n|(?:(?:0(?!\d)|0\d*[89]\d*|[1-9](?:_?\d)*)(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d(?:_?\d)*)?|0[0-7]+/y;
	Template = /[`}](?:[^`\\$]+|\\[^]|\$(?!\{))*(`|\$\{)?/y;
	WhiteSpace = /[\t\v\f\ufeff\p{Zs}]+/yu;
	LineTerminatorSequence = /\r?\n|[\r\u2028\u2029]/y;
	MultiLineComment = /\/\*(?:[^*]+|\*(?!\/))*(\*\/)?/y;
	SingleLineComment = /\/\/.*/y;
	HashbangComment = /^#!.*/;
	JSXPunctuator = /[<>.:={}]|\/(?![\/*])/y;
	JSXIdentifier = /[$_\p{ID_Start}][$_\u200C\u200D\p{ID_Continue}-]*/yu;
	JSXString = /(['"])(?:[^'"]+|(?!\1)['"])*(\1)?/y;
	JSXText = /[^<>{}]+/y;
	TokensPrecedingExpression = /^(?:[\/+-]|\.{3}|\?(?:InterpolationIn(?:JSX|Template)|NoLineTerminatorHere|NonExpressionParenEnd|UnaryIncDec))?$|[{}([,;<>=*%&|^!~?:]$/;
	TokensNotPrecedingObjectLiteral = /^(?:=>|[;\]){}]|else|\?(?:NoLineTerminatorHere|NonExpressionParenEnd))?$/;
	KeywordsWithExpressionAfter = /^(?:await|case|default|delete|do|else|instanceof|new|return|throw|typeof|void|yield)$/;
	KeywordsWithNoLineTerminatorAfter = /^(?:return|throw|yield)$/;
	Newline = RegExp(LineTerminatorSequence.source);
	jsTokens_1$1 = function*(input, {jsx = false} = {}) {
		var braces, firstCodePoint, isExpression, lastIndex, lastSignificantToken, length, match, mode, nextLastIndex, nextLastSignificantToken, parenNesting, postfixIncDec, punctuator, stack;
		({length} = input);
		lastIndex = 0;
		lastSignificantToken = "";
		stack = [
			{tag: "JS"}
		];
		braces = [];
		parenNesting = 0;
		postfixIncDec = false;
		if (match = HashbangComment.exec(input)) {
			yield ({
				type: "HashbangComment",
				value: match[0]
			});
			lastIndex = match[0].length;
		}
		while (lastIndex < length) {
			mode = stack[stack.length - 1];
			switch (mode.tag) {
				case "JS":
				case "JSNonExpressionParen":
				case "InterpolationInTemplate":
				case "InterpolationInJSX":
					if (input[lastIndex] === "/" && (TokensPrecedingExpression.test(lastSignificantToken) || KeywordsWithExpressionAfter.test(lastSignificantToken))) {
						RegularExpressionLiteral.lastIndex = lastIndex;
						if (match = RegularExpressionLiteral.exec(input)) {
							lastIndex = RegularExpressionLiteral.lastIndex;
							lastSignificantToken = match[0];
							postfixIncDec = true;
							yield ({
								type: "RegularExpressionLiteral",
								value: match[0],
								closed: match[1] !== void 0 && match[1] !== "\\"
							});
							continue;
						}
					}
					Punctuator.lastIndex = lastIndex;
					if (match = Punctuator.exec(input)) {
						punctuator = match[0];
						nextLastIndex = Punctuator.lastIndex;
						nextLastSignificantToken = punctuator;
						switch (punctuator) {
							case "(":
								if (lastSignificantToken === "?NonExpressionParenKeyword") {
									stack.push({
										tag: "JSNonExpressionParen",
										nesting: parenNesting
									});
								}
								parenNesting++;
								postfixIncDec = false;
								break;
							case ")":
								parenNesting--;
								postfixIncDec = true;
								if (mode.tag === "JSNonExpressionParen" && parenNesting === mode.nesting) {
									stack.pop();
									nextLastSignificantToken = "?NonExpressionParenEnd";
									postfixIncDec = false;
								}
								break;
							case "{":
								Punctuator.lastIndex = 0;
								isExpression = !TokensNotPrecedingObjectLiteral.test(lastSignificantToken) && (TokensPrecedingExpression.test(lastSignificantToken) || KeywordsWithExpressionAfter.test(lastSignificantToken));
								braces.push(isExpression);
								postfixIncDec = false;
								break;
							case "}":
								switch (mode.tag) {
									case "InterpolationInTemplate":
										if (braces.length === mode.nesting) {
											Template.lastIndex = lastIndex;
											match = Template.exec(input);
											lastIndex = Template.lastIndex;
											lastSignificantToken = match[0];
											if (match[1] === "${") {
												lastSignificantToken = "?InterpolationInTemplate";
												postfixIncDec = false;
												yield ({
													type: "TemplateMiddle",
													value: match[0]
												});
											} else {
												stack.pop();
												postfixIncDec = true;
												yield ({
													type: "TemplateTail",
													value: match[0],
													closed: match[1] === "`"
												});
											}
											continue;
										}
										break;
									case "InterpolationInJSX":
										if (braces.length === mode.nesting) {
											stack.pop();
											lastIndex += 1;
											lastSignificantToken = "}";
											yield ({
												type: "JSXPunctuator",
												value: "}"
											});
											continue;
										}
								}
								postfixIncDec = braces.pop();
								nextLastSignificantToken = postfixIncDec ? "?ExpressionBraceEnd" : "}";
								break;
							case "]":
								postfixIncDec = true;
								break;
							case "++":
							case "--":
								nextLastSignificantToken = postfixIncDec ? "?PostfixIncDec" : "?UnaryIncDec";
								break;
							case "<":
								if (jsx && (TokensPrecedingExpression.test(lastSignificantToken) || KeywordsWithExpressionAfter.test(lastSignificantToken))) {
									stack.push({tag: "JSXTag"});
									lastIndex += 1;
									lastSignificantToken = "<";
									yield ({
										type: "JSXPunctuator",
										value: punctuator
									});
									continue;
								}
								postfixIncDec = false;
								break;
							default:
								postfixIncDec = false;
						}
						lastIndex = nextLastIndex;
						lastSignificantToken = nextLastSignificantToken;
						yield ({
							type: "Punctuator",
							value: punctuator
						});
						continue;
					}
					Identifier.lastIndex = lastIndex;
					if (match = Identifier.exec(input)) {
						lastIndex = Identifier.lastIndex;
						nextLastSignificantToken = match[0];
						switch (match[0]) {
							case "for":
							case "if":
							case "while":
							case "with":
								if (lastSignificantToken !== "." && lastSignificantToken !== "?.") {
									nextLastSignificantToken = "?NonExpressionParenKeyword";
								}
						}
						lastSignificantToken = nextLastSignificantToken;
						postfixIncDec = !KeywordsWithExpressionAfter.test(match[0]);
						yield ({
							type: match[1] === "#" ? "PrivateIdentifier" : "IdentifierName",
							value: match[0]
						});
						continue;
					}
					StringLiteral.lastIndex = lastIndex;
					if (match = StringLiteral.exec(input)) {
						lastIndex = StringLiteral.lastIndex;
						lastSignificantToken = match[0];
						postfixIncDec = true;
						yield ({
							type: "StringLiteral",
							value: match[0],
							closed: match[2] !== void 0
						});
						continue;
					}
					NumericLiteral.lastIndex = lastIndex;
					if (match = NumericLiteral.exec(input)) {
						lastIndex = NumericLiteral.lastIndex;
						lastSignificantToken = match[0];
						postfixIncDec = true;
						yield ({
							type: "NumericLiteral",
							value: match[0]
						});
						continue;
					}
					Template.lastIndex = lastIndex;
					if (match = Template.exec(input)) {
						lastIndex = Template.lastIndex;
						lastSignificantToken = match[0];
						if (match[1] === "${") {
							lastSignificantToken = "?InterpolationInTemplate";
							stack.push({
								tag: "InterpolationInTemplate",
								nesting: braces.length
							});
							postfixIncDec = false;
							yield ({
								type: "TemplateHead",
								value: match[0]
							});
						} else {
							postfixIncDec = true;
							yield ({
								type: "NoSubstitutionTemplate",
								value: match[0],
								closed: match[1] === "`"
							});
						}
						continue;
					}
					break;
				case "JSXTag":
				case "JSXTagEnd":
					JSXPunctuator.lastIndex = lastIndex;
					if (match = JSXPunctuator.exec(input)) {
						lastIndex = JSXPunctuator.lastIndex;
						nextLastSignificantToken = match[0];
						switch (match[0]) {
							case "<":
								stack.push({tag: "JSXTag"});
								break;
							case ">":
								stack.pop();
								if (lastSignificantToken === "/" || mode.tag === "JSXTagEnd") {
									nextLastSignificantToken = "?JSX";
									postfixIncDec = true;
								} else {
									stack.push({tag: "JSXChildren"});
								}
								break;
							case "{":
								stack.push({
									tag: "InterpolationInJSX",
									nesting: braces.length
								});
								nextLastSignificantToken = "?InterpolationInJSX";
								postfixIncDec = false;
								break;
							case "/":
								if (lastSignificantToken === "<") {
									stack.pop();
									if (stack[stack.length - 1].tag === "JSXChildren") {
										stack.pop();
									}
									stack.push({tag: "JSXTagEnd"});
								}
						}
						lastSignificantToken = nextLastSignificantToken;
						yield ({
							type: "JSXPunctuator",
							value: match[0]
						});
						continue;
					}
					JSXIdentifier.lastIndex = lastIndex;
					if (match = JSXIdentifier.exec(input)) {
						lastIndex = JSXIdentifier.lastIndex;
						lastSignificantToken = match[0];
						yield ({
							type: "JSXIdentifier",
							value: match[0]
						});
						continue;
					}
					JSXString.lastIndex = lastIndex;
					if (match = JSXString.exec(input)) {
						lastIndex = JSXString.lastIndex;
						lastSignificantToken = match[0];
						yield ({
							type: "JSXString",
							value: match[0],
							closed: match[2] !== void 0
						});
						continue;
					}
					break;
				case "JSXChildren":
					JSXText.lastIndex = lastIndex;
					if (match = JSXText.exec(input)) {
						lastIndex = JSXText.lastIndex;
						lastSignificantToken = match[0];
						yield ({
							type: "JSXText",
							value: match[0]
						});
						continue;
					}
					switch (input[lastIndex]) {
						case "<":
							stack.push({tag: "JSXTag"});
							lastIndex++;
							lastSignificantToken = "<";
							yield ({
								type: "JSXPunctuator",
								value: "<"
							});
							continue;
						case "{":
							stack.push({
								tag: "InterpolationInJSX",
								nesting: braces.length
							});
							lastIndex++;
							lastSignificantToken = "?InterpolationInJSX";
							postfixIncDec = false;
							yield ({
								type: "JSXPunctuator",
								value: "{"
							});
							continue;
					}
			}
			WhiteSpace.lastIndex = lastIndex;
			if (match = WhiteSpace.exec(input)) {
				lastIndex = WhiteSpace.lastIndex;
				yield ({
					type: "WhiteSpace",
					value: match[0]
				});
				continue;
			}
			LineTerminatorSequence.lastIndex = lastIndex;
			if (match = LineTerminatorSequence.exec(input)) {
				lastIndex = LineTerminatorSequence.lastIndex;
				postfixIncDec = false;
				if (KeywordsWithNoLineTerminatorAfter.test(lastSignificantToken)) {
					lastSignificantToken = "?NoLineTerminatorHere";
				}
				yield ({
					type: "LineTerminatorSequence",
					value: match[0]
				});
				continue;
			}
			MultiLineComment.lastIndex = lastIndex;
			if (match = MultiLineComment.exec(input)) {
				lastIndex = MultiLineComment.lastIndex;
				if (Newline.test(match[0])) {
					postfixIncDec = false;
					if (KeywordsWithNoLineTerminatorAfter.test(lastSignificantToken)) {
						lastSignificantToken = "?NoLineTerminatorHere";
					}
				}
				yield ({
					type: "MultiLineComment",
					value: match[0],
					closed: match[1] !== void 0
				});
				continue;
			}
			SingleLineComment.lastIndex = lastIndex;
			if (match = SingleLineComment.exec(input)) {
				lastIndex = SingleLineComment.lastIndex;
				postfixIncDec = false;
				yield ({
					type: "SingleLineComment",
					value: match[0]
				});
				continue;
			}
			firstCodePoint = String.fromCodePoint(input.codePointAt(lastIndex));
			lastIndex += firstCodePoint.length;
			lastSignificantToken = firstCodePoint;
			postfixIncDec = false;
			yield ({
				type: mode.tag.startsWith("JSX") ? "JSXInvalid" : "Invalid",
				value: firstCodePoint
			});
		}
		return void 0;
	};
	return jsTokens_1$1;
}

var jsTokensExports$1 = requireJsTokens$1();
var jsTokens$1 = /*@__PURE__*/getDefaultExportFromCjs(jsTokensExports$1);

const FILL_COMMENT = " ";
function stripLiteralFromToken(token, fillChar, filter) {
  if (token.type === "SingleLineComment") {
    return FILL_COMMENT.repeat(token.value.length);
  }
  if (token.type === "MultiLineComment") {
    return token.value.replace(/[^\n]/g, FILL_COMMENT);
  }
  if (token.type === "StringLiteral") {
    if (!token.closed) {
      return token.value;
    }
    const body = token.value.slice(1, -1);
    if (filter(body)) {
      return token.value[0] + fillChar.repeat(body.length) + token.value[token.value.length - 1];
    }
  }
  if (token.type === "NoSubstitutionTemplate") {
    const body = token.value.slice(1, -1);
    if (filter(body)) {
      return `\`${body.replace(/[^\n]/g, fillChar)}\``;
    }
  }
  if (token.type === "RegularExpressionLiteral") {
    const body = token.value;
    if (filter(body)) {
      return body.replace(/\/(.*)\/(\w?)$/g, (_, $1, $2) => `/${fillChar.repeat($1.length)}/${$2}`);
    }
  }
  if (token.type === "TemplateHead") {
    const body = token.value.slice(1, -2);
    if (filter(body)) {
      return `\`${body.replace(/[^\n]/g, fillChar)}\${`;
    }
  }
  if (token.type === "TemplateTail") {
    const body = token.value.slice(0, -2);
    if (filter(body)) {
      return `}${body.replace(/[^\n]/g, fillChar)}\``;
    }
  }
  if (token.type === "TemplateMiddle") {
    const body = token.value.slice(1, -2);
    if (filter(body)) {
      return `}${body.replace(/[^\n]/g, fillChar)}\${`;
    }
  }
  return token.value;
}
function optionsWithDefaults(options) {
  return {
    fillChar: " ",
    filter: (() => true)
  };
}
function stripLiteral(code, options) {
  let result = "";
  const _options = optionsWithDefaults();
  for (const token of jsTokens$1(code, { jsx: false })) {
    result += stripLiteralFromToken(token, _options.fillChar, _options.filter);
  }
  return result;
}

// so people can reassign envs at runtime
// import.meta.env.VITE_NAME = 'app' -> process.env.VITE_NAME = 'app'
function MetaEnvReplacerPlugin() {
	return {
		name: "vitest:meta-env-replacer",
		enforce: "pre",
		transform(code, id) {
			if (!/\bimport\.meta\.env\b/.test(code)) return null;
			let s = null;
			const envs = stripLiteral(code).matchAll(/\bimport\.meta\.env\b/g);
			for (const env of envs) {
				s ||= new MagicString(code);
				const startIndex = env.index;
				const endIndex = startIndex + env[0].length;
				s.overwrite(startIndex, endIndex, `Object.assign(/* istanbul ignore next */ globalThis.__vitest_worker__?.metaEnv ?? import.meta.env)`);
			}
			if (s) return {
				code: s.toString(),
				map: s.generateMap({
					hires: "boundary",
					// Remove possible query parameters, e.g. vue's "?vue&type=script&src=true&lang.ts"
					source: cleanUrl(id)
				})
			};
		}
	};
}

const newLineRegExp = /\r?\n/;
const errCodeRegExp = /error TS(?<errCode>\d+)/;
async function makeTscErrorInfo(errInfo) {
	const [errFilePathPos = "", ...errMsgRawArr] = errInfo.split(":");
	if (!errFilePathPos || errMsgRawArr.length === 0 || errMsgRawArr.join("").length === 0) return ["unknown filepath", null];
	const errMsgRaw = errMsgRawArr.join("").trim();
	// get filePath, line, col
	const [errFilePath, errPos] = errFilePathPos.slice(0, -1).split("(");
	if (!errFilePath || !errPos) return ["unknown filepath", null];
	const [errLine, errCol] = errPos.split(",");
	if (!errLine || !errCol) return [errFilePath, null];
	// get errCode, errMsg
	const execArr = errCodeRegExp.exec(errMsgRaw);
	if (!execArr) return [errFilePath, null];
	const errCodeStr = execArr.groups?.errCode ?? "";
	if (!errCodeStr) return [errFilePath, null];
	const line = Number(errLine);
	const col = Number(errCol);
	const errCode = Number(errCodeStr);
	return [errFilePath, {
		filePath: errFilePath,
		errCode,
		line,
		column: col,
		errMsg: errMsgRaw.slice(`error TS${errCode} `.length)
	}];
}
async function getRawErrsMapFromTsCompile(tscErrorStdout) {
	const rawErrsMap = /* @__PURE__ */ new Map();
	(await Promise.all(tscErrorStdout.split(newLineRegExp).reduce((prev, next) => {
		if (!next) return prev;
		else if (next[0] !== " ") prev.push(next);
		else prev[prev.length - 1] += `\n${next}`;
		return prev;
	}, []).map((errInfoLine) => makeTscErrorInfo(errInfoLine)))).forEach(([errFilePath, errInfo]) => {
		if (!errInfo) return;
		if (!rawErrsMap.has(errFilePath)) rawErrsMap.set(errFilePath, [errInfo]);
		else rawErrsMap.get(errFilePath)?.push(errInfo);
	});
	return rawErrsMap;
}

// the V8 fatal output of a checker that ran out of memory
const OOM_OUTPUT_PATTERN = /JavaScript heap out of memory|Reached heap limit|Allocation failed/i;
class TypeCheckError extends Error {
	message;
	stacks;
	name = "TypeCheckError";
	constructor(message, stacks) {
		super(message);
		this.message = message;
		this.stacks = stacks;
	}
}
class Typechecker {
	project;
	_onParseStart;
	_onParseEnd;
	_onWatcherRerun;
	_result = {
		files: [],
		sourceErrors: [],
		time: 0
	};
	_startTime = 0;
	_output = "";
	_tests = {};
	process;
	files = [];
	constructor(project) {
		this.project = project;
	}
	setFiles(files) {
		this.files = files;
	}
	onParseStart(fn) {
		this._onParseStart = fn;
	}
	onParseEnd(fn) {
		this._onParseEnd = fn;
	}
	onWatcherRerun(fn) {
		this._onWatcherRerun = fn;
	}
	async collectFileTests(filepath) {
		return astCollectFileInformation(this.project, filepath, { pool: "typescript" });
	}
	getFiles() {
		return this.files;
	}
	async collectTests() {
		const tests = (await Promise.all(this.getFiles().map((filepath) => this.collectFileTests(filepath)))).reduce((acc, data) => {
			if (!data) return acc;
			acc[data.filepath] = data;
			return acc;
		}, {});
		this._tests = tests;
		return tests;
	}
	markPassed(file) {
		if (!file.result?.state) file.result = { state: "pass" };
		const markTasks = (tasks) => {
			for (const task of tasks) {
				if ("tasks" in task) markTasks(task.tasks);
				if (!task.result?.state && (task.mode === "run" || task.mode === "queued")) task.result = { state: "pass" };
			}
		};
		markTasks(file.tasks);
	}
	async prepareResults(output) {
		// Detect if tsc output is help text instead of error output
		// This happens when tsconfig.json is missing and tsc can't find any config
		if (output.includes("The TypeScript Compiler - Version") || output.includes("COMMON COMMANDS")) {
			const { typecheck } = this.project.config;
			const msg = `TypeScript compiler returned help text instead of type checking results.
This usually means the tsconfig file was not found.

Possible solutions:
  1. Ensure '${typecheck.tsconfig || "tsconfig.json"}' exists in your project root\n  2. If using a custom tsconfig, verify the path in your Vitest config:\n     test: { typecheck: { tsconfig: 'path/to/tsconfig.json' } }\n  3. Check that the tsconfig file is valid JSON`;
			throw new Error(msg);
		}
		const typeErrors = await this.parseTscLikeOutput(output);
		const testFiles = new Set(this.getFiles());
		if (!this._tests) this._tests = await this.collectTests();
		const sourceErrors = [];
		const files = [];
		testFiles.forEach((path) => {
			const { file, definitions, map, parsed } = this._tests[path];
			const errors = typeErrors.get(path);
			files.push(file);
			if (!errors) {
				this.markPassed(file);
				return;
			}
			const sortedDefinitions = [...definitions.sort((a, b) => b.start - a.start)];
			// has no map for ".js" files that use // @ts-check
			const traceMap = map && new TraceMap(map);
			const indexMap = createLocationsIndexMap(parsed);
			const markState = (task, state) => {
				task.result = { state: task.mode === "run" || task.mode === "only" ? state : task.mode };
				if (task.suite) markState(task.suite, state);
				else if (task.file && task !== task.file) markState(task.file, state);
			};
			errors.forEach(({ error, originalError }) => {
				const processedPos = traceMap ? findGeneratedPosition(traceMap, {
					line: originalError.line,
					column: originalError.column,
					source: basename(path)
				}) : originalError;
				const line = processedPos.line ?? originalError.line;
				const column = processedPos.column ?? originalError.column;
				const index = indexMap.get(`${line}:${column}`);
				const definition = index != null && sortedDefinitions.find((def) => def.start <= index && def.end >= index);
				const suite = definition ? definition.task : file;
				const state = suite.mode === "run" || suite.mode === "only" ? "fail" : suite.mode;
				const errors = suite.result?.errors || [];
				suite.result = {
					state,
					errors
				};
				errors.push(error);
				if (state === "fail") {
					if (suite.suite) markState(suite.suite, "fail");
					else if (suite.file && suite !== suite.file) markState(suite.file, "fail");
				}
			});
			this.markPassed(file);
		});
		typeErrors.forEach((errors, path) => {
			if (!testFiles.has(path)) sourceErrors.push(...errors.map(({ error }) => error));
		});
		return {
			files,
			sourceErrors,
			time: performance$1.now() - this._startTime
		};
	}
	async parseTscLikeOutput(output) {
		const errorsMap = await getRawErrsMapFromTsCompile(output);
		const typesErrors = /* @__PURE__ */ new Map();
		errorsMap.forEach((errors, path) => {
			const filepath = resolve(this.project.config.root, path);
			const suiteErrors = errors.map((info) => {
				const limit = Error.stackTraceLimit;
				Error.stackTraceLimit = 0;
				// Some expect-type errors have the most useful information on the second line e.g. `This expression is not callable.\n  Type 'ExpectString<number>' has no call signatures.`
				const errMsg = info.errMsg.replace(/\r?\n\s*(Type .* has no call signatures)/g, " $1");
				const error = new TypeCheckError(errMsg, [{
					file: filepath,
					line: info.line,
					column: info.column,
					method: ""
				}]);
				Error.stackTraceLimit = limit;
				return {
					originalError: info,
					error: {
						name: error.name,
						message: errMsg,
						stacks: error.stacks,
						stack: ""
					}
				};
			});
			typesErrors.set(filepath, suiteErrors);
		});
		return typesErrors;
	}
	async stop() {
		this.process?.kill();
		this.process = void 0;
	}
	async ensurePackageInstalled(ctx, checker) {
		if (checker !== "tsc" && checker !== "vue-tsc") return;
		const packageName = checker === "tsc" ? "typescript" : "vue-tsc";
		await ctx.packageInstaller.ensureInstalled(packageName, ctx.config.root);
	}
	getExitCode() {
		return this.process?.exitCode != null && this.process.exitCode;
	}
	getSignal() {
		return this.process?.signalCode ?? null;
	}
	getChecker() {
		return this.project.config.typecheck.checker;
	}
	getOutput() {
		return this._output;
	}
	async spawn() {
		const { root, watch, typecheck } = this.project.config;
		const args = ["--pretty", "false"];
		if (typecheck.build) args.unshift("--build");
		else args.push("--noEmit", "--incremental", "--tsBuildInfoFile", join(process.versions.pnp ? join(os__default.tmpdir(), this.project.hash) : distDir, "tsconfig.tmp.tsbuildinfo"));
		// use builtin watcher because it's faster
		if (watch) args.push("--watch");
		if (typecheck.allowJs) args.push("--allowJs", "--checkJs");
		if (typecheck.tsconfig) {
			if (!typecheck.build) args.push("-p");
			args.push(resolve(root, typecheck.tsconfig));
		}
		this._output = "";
		this._startTime = performance$1.now();
		const child = x(typecheck.checker, args, {
			nodeOptions: {
				cwd: root,
				stdio: "pipe"
			},
			throwOnError: false
		});
		this.process = child.process;
		let rerunTriggered = false;
		let dataReceived = false;
		return new Promise((resolve, reject) => {
			if (!child.process || !child.process.stdout) {
				reject(/* @__PURE__ */ new Error(`Failed to initialize ${typecheck.checker}. This is a bug in Vitest - please, open an issue with reproduction.`));
				return;
			}
			let resolved = false;
			child.process.stdout.on("data", (chunk) => {
				dataReceived = true;
				this._output += chunk;
				if (!watch) return;
				if (this._output.includes("File change detected") && !rerunTriggered) {
					this._onWatcherRerun?.();
					this._startTime = performance$1.now();
					this._result.sourceErrors = [];
					this._result.files = [];
					this._tests = null;
					rerunTriggered = true;
				}
				if (/Found \w+ errors*. Watching for/.test(this._output)) {
					rerunTriggered = false;
					this.prepareResults(this._output).then((result) => {
						this._result = result;
						this._onParseEnd?.(result);
					});
					this._output = "";
				}
			});
			// Also capture stderr for configuration errors like missing tsconfig
			child.process.stderr?.on("data", (chunk) => {
				this._output += chunk;
			});
			const timeout = setTimeout(() => reject(/* @__PURE__ */ new Error(`${typecheck.checker} spawn timed out`)), this.project.config.typecheck.spawnTimeout);
			let winTimeout;
			function onError(cause) {
				if (resolved) return;
				clearTimeout(timeout);
				clearTimeout(winTimeout);
				resolved = true;
				reject(new Error("Spawning typechecker failed - is typescript installed?", { cause }));
			}
			child.process.once("spawn", () => {
				this._onParseStart?.();
				child.process?.off("error", onError);
				clearTimeout(timeout);
				if (process.platform === "win32") {
					// on Windows, the process might be spawned but fail to start,
					// so we wait for the "close" event instead of resolving right away.
					// `start` awaits the process anyway; the watch process never exits,
					// so resolve it after a grace period
					if (watch) winTimeout = setTimeout(() => {
						resolved = true;
						resolve({ result: child });
					}, 200);
				} else {
					resolved = true;
					resolve({ result: child });
				}
			});
			if (process.platform === "win32") child.process.once("close", (code) => {
				// an OOM abort writes only to stderr, but the checker did start;
				// `start` awaits the process and reports the crash from its output
				if (code != null && code !== 0 && !dataReceived && !OOM_OUTPUT_PATTERN.test(this._output)) onError(/* @__PURE__ */ new Error(`The ${typecheck.checker} command exited with code ${code}.`));
				else if (!resolved) {
					clearTimeout(winTimeout);
					resolved = true;
					resolve({ result: child });
				}
			});
			child.process.once("error", onError);
		});
	}
	async start() {
		if (this.process) return;
		const { watch } = this.project.config;
		const { result: child } = await this.spawn();
		if (!watch) {
			await child;
			this._result = await this.prepareResults(this._output);
			await this._onParseEnd?.(this._result);
		}
	}
	getResult() {
		return this._result;
	}
	getTestFiles() {
		return Object.values(this._tests || {}).map((i) => i.file);
	}
	getTestPacksAndEvents() {
		const packs = [];
		const events = [];
		for (const { file } of Object.values(this._tests || {})) {
			const result = convertTasksToEvents(file);
			packs.push(...result.packs);
			events.push(...result.events);
		}
		return {
			packs,
			events
		};
	}
}
function findGeneratedPosition(traceMap, { line, column, source }) {
	const found = generatedPositionFor(traceMap, {
		line,
		column,
		source
	});
	if (found.line !== null) return found;
	// find the next source token position when the exact error position doesn't exist in source map.
	// this can happen, for example, when the type error is in the comment "// @ts-expect-error"
	// and comments are stripped away in the generated code.
	const mappings = [];
	eachMapping(traceMap, (m) => {
		if (m.source === source && m.originalLine !== null && m.originalColumn !== null && (line === m.originalLine ? column < m.originalColumn : line < m.originalLine)) mappings.push(m);
	});
	const next = mappings.sort((a, b) => a.originalLine === b.originalLine ? a.originalColumn - b.originalColumn : a.originalLine - b.originalLine).at(0);
	if (next) return {
		line: next.generatedLine,
		column: next.generatedColumn
	};
	return {
		line: null,
		column: null
	};
}

// use Logger with custom Console to capture entire error printing
function capturePrintError(error, ctx, options) {
	let output = "";
	const writable = new Writable({ write(chunk, _encoding, callback) {
		output += String(chunk);
		callback();
	} });
	const console = new Console(writable);
	return {
		nearest: printError(error, ctx, {
			error: console.error.bind(console),
			highlight: ctx.logger.highlight.bind(ctx.logger)
		}, {
			showCodeFrame: false,
			...options
		})?.nearest,
		output
	};
}
function printError(error, ctx, logger, options) {
	const project = options.project ?? ctx.coreWorkspaceProject ?? ctx.projects[0];
	return printErrorInner(error, project, {
		logger,
		type: options.type,
		showCodeFrame: options.showCodeFrame,
		screenshotPaths: options.screenshotPaths,
		printProperties: options.verbose,
		parseErrorStacktrace(error) {
			if (error.stacks) if (options.fullStack) return error.stacks;
			else return error.stacks.filter((stack) => {
				return !stackIgnorePatterns.some((p) => stack.file.match(p));
			});
			// browser stack trace needs to be processed differently,
			// so there is a separate method for that
			if (project.browser) return project.browser.parseErrorStacktrace(error, {
				frameFilter: project.config.onStackTrace,
				ignoreStackEntries: options.fullStack ? [] : void 0
			});
			// node.js stack trace already has correct source map locations
			return parseErrorStacktrace(error, {
				frameFilter: project.config.onStackTrace,
				ignoreStackEntries: options.fullStack ? [] : void 0
			});
		}
	});
}
function printErrorInner(error, project, options) {
	const { showCodeFrame = true, type, printProperties = true } = options;
	const logger = options.logger;
	let e = error;
	if (isPrimitive(e)) e = {
		message: String(error).split(/\n/g)[0],
		stack: String(error)
	};
	if (!e) {
		const error = /* @__PURE__ */ new Error("unknown error");
		e = {
			message: e ?? error.message,
			stack: error.stack
		};
	}
	// Error may have occurred even before the configuration was resolved
	if (!project) {
		printErrorMessage(e, logger);
		return;
	}
	const stacks = options.parseErrorStacktrace(e);
	const nearest = error instanceof TypeCheckError ? error.stacks[0] : stacks.find((stack) => {
		// we are checking that this module was processed by us at one point
		try {
			return Object.values(project.vite.environments || {}).some((environment) => {
				return [...environment.moduleGraph.getModulesByFile(stack.file)?.values() || []].some((module) => !!module.transformResult);
			}) && existsSync(stack.file);
		} catch {
			return false;
		}
	});
	if (type) printErrorType(type, project.vitest);
	printErrorMessage(e, logger);
	if (options.screenshotPaths?.length) {
		const uniqueScreenshots = Array.from(new Set(options.screenshotPaths));
		const length = uniqueScreenshots.length;
		logger.error(`\nFailure screenshot${length > 1 ? "s" : ""}:`);
		logger.error(uniqueScreenshots.map((p) => `  - ${y.dim(relative(process.cwd(), p))}`).join("\n"));
		if (!e.diff) logger.error();
	}
	if (e.codeFrame) logger.error(`${e.codeFrame}\n`);
	if ("__vitest_rollup_error__" in e) {
		// https://github.com/vitejs/vite/blob/95020ab49e12d143262859e095025cf02423c1d9/packages/vite/src/node/server/middlewares/error.ts#L25-L36
		const err = e.__vitest_rollup_error__;
		logger.error([
			err.plugin && `  Plugin: ${y.magenta(err.plugin)}`,
			err.id && `  File: ${y.cyan(err.id)}${err.loc ? `:${err.loc.line}:${err.loc.column}` : ""}`,
			err.frame && y.yellow(err.frame.split(/\r?\n/g).map((l) => ` `.repeat(2) + l).join(`\n`))
		].filter(Boolean).join("\n"));
	}
	// E.g. AssertionError from assert does not set showDiff but has both actual and expected properties
	if (e.diff) logger.error(`\n${e.diff}\n`);
	// if the error provide the frame
	if (e.frame) logger.error(y.yellow(e.frame));
	else printStack(logger, project, stacks, nearest, printProperties ? getErrorProperties(e) : {}, (s) => {
		if (showCodeFrame && s === nearest && nearest) {
			const sourceCode = readFileSync(nearest.file, "utf-8");
			logger.error(generateCodeFrame(sourceCode.length > 1e5 ? sourceCode : logger.highlight(nearest.file, sourceCode), 4, s));
		}
	});
	const testPath = e.VITEST_TEST_PATH;
	const testName = e.VITEST_TEST_NAME;
	// testName has testPath inside
	if (testPath) logger.error(y.red(`This error originated in "${y.bold(relative(project.config.root, testPath))}" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.`));
	if (testName) logger.error(y.red(`The last test to run before this error was "${y.bold(testName)}". This means either:
- the error was thrown while Vitest was running this test, or
- the error was thrown after the test completed, and this was the most recent test at that point.`));
	if (e.cause != null) {
		let cause = e.cause;
		if (typeof cause !== "object" || cause === null) {
			const causeStr = String(cause);
			cause = {
				name: "Caused by",
				message: causeStr,
				stack: causeStr
			};
		} else if (!("name" in cause)) cause = {
			...cause,
			name: "Caused by"
		};
		else cause.name = `Caused by: ${cause.name}`;
		printErrorInner(cause, project, {
			showCodeFrame: false,
			logger: options.logger,
			parseErrorStacktrace: options.parseErrorStacktrace
		});
	}
	handleImportOutsideModuleError(e.stack || "", logger);
	return { nearest };
}
function printErrorType(type, ctx) {
	ctx.logger.error(`\n${errorBanner(type)}`);
}
const skipErrorProperties = /* @__PURE__ */ new Set([
	"cause",
	"stacks",
	"type",
	"showDiff",
	"ok",
	"operator",
	"diff",
	"codeFrame",
	"actual",
	"expected",
	"diffOptions",
	"runnerError",
	"sourceURL",
	"column",
	"line",
	"fileName",
	"lineNumber",
	"columnNumber",
	"VITEST_TEST_NAME",
	"VITEST_TEST_PATH",
	"__vitest_rollup_error__",
	"__vitest_error_context__",
	"__vitest_test_syntax_error__",
	...Object.getOwnPropertyNames(Error.prototype),
	...Object.getOwnPropertyNames(Object.prototype)
]);
function getErrorProperties(e) {
	const errorObject = Object.create(null);
	if (e.name === "AssertionError") return errorObject;
	for (const key of Object.getOwnPropertyNames(e))
 // print the original stack if it was ever changed manually by the user
	if (key === "stack" && e[key] != null && typeof e[key] !== "string") errorObject[key] = e[key];
	else if (key !== "stack" && !skipErrorProperties.has(key)) errorObject[key] = e[key];
	return errorObject;
}
const esmErrors = ["Cannot use import statement outside a module", "Unexpected token 'export'"];
function handleImportOutsideModuleError(stack, logger) {
	if (!esmErrors.some((e) => stack.includes(e))) return;
	const path = normalize(stack.split("\n")[0].trim());
	let name = path.split("/node_modules/").pop() || "";
	if (name[0] === "@") name = name.split("/").slice(0, 2).join("/");
	else name = name.split("/")[0];
	if (name) printModuleWarningForPackage(logger, path, name);
	else printModuleWarningForSourceCode(logger, path);
}
function printModuleWarningForPackage(logger, path, name) {
	logger.error(y.yellow(`Module ${path} seems to be an ES Module but shipped in a CommonJS package. You might want to create an issue to the package ${y.bold(`"${name}"`)} asking them to ship the file in .mjs extension or add "type": "module" in their package.json.

As a temporary workaround you can try to inline the package by updating your config:

` + y.gray(y.dim("// vitest.config.js")) + "\n" + y.green(`export default {
  test: {
    server: {
      deps: {
        inline: [
          ${y.yellow(y.bold(`"${name}"`))}
        ]
      }
    }
  }
}\n`)));
}
function printModuleWarningForSourceCode(logger, path) {
	logger.error(y.yellow(`Module ${path} seems to be an ES Module but shipped in a CommonJS package. To fix this issue, change the file extension to .mjs or add "type": "module" in your package.json.`));
}
function printErrorMessage(error, logger) {
	const errorName = error.name || "Unknown Error";
	if (!error.message) {
		logger.error(error);
		return;
	}
	if (error.message.length > 5e3)
 // Protect against infinite stack trace in tinyrainbow
	logger.error(`${y.red(y.bold(errorName))}: ${error.message}`);
	else logger.error(y.red(`${y.bold(errorName)}: ${error.message}`));
}
function printStack(logger, project, stack, highlight, errorProperties, onStack) {
	for (const frame of stack) {
		const color = frame === highlight ? y.cyan : y.gray;
		const path = relative(project.config.root, frame.file);
		logger.error(color(` ${y.dim(F_POINTER)} ${[frame.method, `${path}:${y.dim(`${frame.line}:${frame.column}`)}`].filter(Boolean).join(" ")}`));
		onStack?.(frame);
	}
	if (stack.length) logger.error();
	if (hasProperties(errorProperties)) {
		logger.error(y.red(y.dim(divider())));
		const propertiesString = inspect(errorProperties);
		logger.error(y.red(y.bold("Serialized Error:")), y.gray(propertiesString));
	}
}
function hasProperties(obj) {
	// eslint-disable-next-line no-unreachable-loop
	for (const _key in obj) return true;
	return false;
}
function generateCodeFrame(source, indent = 0, loc, range = 2) {
	const start = typeof loc === "object" ? positionToOffset(source, loc.line, loc.column) : loc;
	const end = start;
	const lines = source.split(lineSplitRE);
	const nl = /\r\n/.test(source) ? 2 : 1;
	let count = 0;
	let res = [];
	const columns = process.stdout?.columns || 80;
	for (let i = 0; i < lines.length; i++) {
		count += lines[i].length + nl;
		if (count >= start) {
			for (let j = i - range; j <= i + range || end > count; j++) {
				if (j < 0 || j >= lines.length) continue;
				const lineLength = lines[j].length;
				const strippedContent = stripVTControlCharacters(lines[j]);
				if (strippedContent.startsWith("//# sourceMappingURL")) continue;
				// too long, maybe it's a minified file, skip for codeframe
				if (strippedContent.length > 200) return "";
				const truncatedLine = truncateString(lines[j].replace(/\t/g, " "), columns - 5 - indent).trimEnd();
				res.push(lineNo(j + 1) + (truncatedLine ? " " + truncatedLine : truncatedLine));
				if (j === i) {
					// push underline
					const pad = start - (count - lineLength) + (nl - 1);
					const length = Math.max(1, end > count ? lineLength - pad : end - start);
					res.push(lineNo() + " ".repeat(pad + 1) + y.red("^".repeat(length)));
				} else if (j > i) {
					if (end > count) {
						const length = Math.max(1, Math.min(end - count, lineLength));
						res.push(lineNo() + " " + y.red("^".repeat(length)));
					}
					count += lineLength + 1;
				}
			}
			break;
		}
	}
	if (indent) res = res.map((line) => " ".repeat(indent) + line);
	return res.join("\n");
}
function lineNo(no = "") {
	return y.gray(`${String(no).padStart(3, " ")}|`);
}

function MocksPlugins(options = {}) {
	const normalizedDistDir = normalize(distDir);
	return [hoistMocksPlugin({
		filter(id) {
			if (id.includes(normalizedDistDir)) return false;
			if (options.filter) return options.filter(id);
			return true;
		},
		codeFrameGenerator(node, id, code) {
			return generateCodeFrame(code, 4, node.start + 1);
		}
	}), automockPlugin()];
}

const metaUrlLength = 15;
const locationString = "self.location".padEnd(metaUrlLength, " ");
// Vite transforms new URL('./path', import.meta.url) to new URL('/path.js', import.meta.url)
// This makes "href" equal to "http://localhost:3000/path.js" in the browser, but if we keep it like this,
// then in tests the URL will become "file:///path.js".
// To battle this, we replace "import.meta.url" with "self.location" in the code to keep the browser behavior.
function NormalizeURLPlugin() {
	return {
		name: "vitest:normalize-url",
		enforce: "post",
		transform(code) {
			if (this.environment.name !== "client" || !code.includes("new URL") || !code.includes("import.meta.url")) return;
			const cleanString = stripLiteral(code);
			const assetImportMetaUrlRE = /\bnew\s+URL\s*\(\s*(?:'[^']+'|"[^"]+"|`[^`]+`)\s*,\s*(?:'' \+ )?import\.meta\.url\s*(?:,\s*)?\)/g;
			let updatedCode = code;
			let match;
			// eslint-disable-next-line no-cond-assign
			while (match = assetImportMetaUrlRE.exec(cleanString)) {
				const { 0: exp, index } = match;
				const metaUrlIndex = index + exp.indexOf("import.meta.url");
				updatedCode = updatedCode.slice(0, metaUrlIndex) + locationString + updatedCode.slice(metaUrlIndex + metaUrlLength);
			}
			return {
				code: updatedCode,
				map: null
			};
		}
	};
}

class ServerModuleRunner extends ModuleRunner {
	environment;
	config;
	constructor(environment, fetcher, config) {
		super({
			hmr: false,
			transport: { async invoke(event) {
				if (event.type !== "custom") throw new Error(`Vitest Module Runner doesn't support Vite HMR events.`);
				const { name, data } = event.data;
				if (name === "getBuiltins") return await environment.hot.handleInvoke(event);
				if (name !== "fetchModule") return { error: /* @__PURE__ */ new Error(`Unknown method: ${name}. Expected "fetchModule".`) };
				try {
					const result = await fetcher(data[0], data[1], environment, false, data[2]);
					if ("tmp" in result) {
						const code = await readFile(result.tmp);
						return { result: {
							...result,
							code
						} };
					}
					return { result };
				} catch (error) {
					return { error };
				}
			} }
		}, new VitestModuleEvaluator());
		this.environment = environment;
		this.config = config;
	}
	async import(rawId) {
		const resolved = await this.environment.pluginContainer.resolveId(rawId, this.config.root);
		if (!resolved) return super.import(rawId);
		// Vite will make "@vitest/coverage-v8" into "@vitest/coverage-v8.js" url
		// instead of using an actual file path-like URL, so we resolve it here first
		const url = normalizeResolvedIdToUrl(this.environment, resolved.id);
		return super.import(url);
	}
}
// Override the SSR environment's runner so user `configureServer` hooks that
// call `server.environments.ssr.runner.import(...)` get Vitest's module runner.
function installSsrModuleRunner(server, fetcher, config) {
	const ssrEnvironment = server.environments.ssr;
	if (!isRunnableDevEnvironment(ssrEnvironment)) return;
	const ssrRunner = new ServerModuleRunner(ssrEnvironment, fetcher, config);
	Object.defineProperty(ssrEnvironment, "runner", {
		value: ssrRunner,
		writable: true,
		configurable: true
	});
}

// Runs `pre` so it sits before user plugins, whose `configureServer` hooks may
// rely on `server.environments.ssr.runner` being Vitest's module runner.
function SsrRunnerFixerPlugin(harness) {
	return {
		name: "vitest:ssr-module-runner-fixer",
		enforce: "pre",
		configureServer: {
			order: "pre",
			handler(server) {
				const vitest = harness.getVitest();
				installSsrModuleRunner(server, vitest._fetcher, vitest.config);
			}
		}
	};
}

function VitestProjectResolver(harness) {
	let browserEnabled = false;
	const plugin = {
		name: "vitest:resolve-root",
		enforce: "pre",
		config: {
			order: "post",
			handler(config) {
				browserEnabled = !!config.test?.browser?.enabled;
				return { base: "/" };
			}
		},
		async resolveId(id, _, { ssr }) {
			if (id === "vitest" || id.startsWith("@vitest/") || id.startsWith("vitest/")) {
				// the browser pre-bundles vitest, and the optimizer's copy must win
				// so the tester and the test files share one module instance
				if (browserEnabled && this.environment?.name === "client") return;
				return await harness.getVitest().vite.pluginContainer.resolveId(id, void 0, {
					skip: /* @__PURE__ */ new Set([plugin]),
					ssr
				});
			}
		}
	};
	return plugin;
}
function VitestCoreResolver() {
	let root;
	let browserEnabled = false;
	return {
		name: "vitest:resolve-core",
		enforce: "pre",
		config: {
			order: "post",
			handler(config) {
				browserEnabled = !!config.test?.browser?.enabled;
				return { base: "/" };
			}
		},
		configResolved(config) {
			root = config.root;
		},
		async resolveId(id) {
			// the browser pre-bundles vitest, and the optimizer's copy must win
			// so the tester and the test files share one module instance
			if (browserEnabled && this.environment?.name === "client") return;
			if (id === "vitest") return resolve(distDir, "index.js");
			if (id.startsWith("@vitest/") || id.startsWith("vitest/"))
 // ignore actual importer, we want it to be resolved relative to the root
			return this.resolve(id, join(root, "index.html"), { skipSelf: true });
		}
	};
}

function VitestCorePlugin(harness) {
	return [
		{
			name: "vitest:config:append",
			enforce: "post",
			options() {
				this.meta.watchMode = false;
			},
			config: {
				order: "post",
				handler(viteConfig) {
					const root = resolve(viteConfig.test?.root || viteConfig.root || process.cwd());
					return {
						base: "/",
						root,
						cacheDir: resolveTestCacheDir(root, viteConfig.test || {}, viteConfig.cacheDir),
						build: { 
						// Vitest doesn't use outputDir, but this value affects what folders are watched
						// https://github.com/vitejs/vite/pull/16453
emptyOutDir: false }
					};
				}
			},
			configResolved: {
				order: "post",
				handler(viteConfig) {
					// During resolution so Vite uses the real fs when watch is off (a cached
					// snapshot misses runtime-generated files); the default is applied later
					// by `resolveTestConfig`, hence the `??`.
					const server = viteConfig.server;
					if (!(viteConfig.test?.watch ?? configDefaults.watch)) server.watch = null;
					else {
						server.watch ??= {};
						// chokidar fsevents is unstable on macos when emitting the "ready" event
						if (process.platform === "darwin" && false);
					}
				}
			}
		},
		...CSSEnablerPlugin(),
		...MocksPlugins(),
		CoverageTransform(harness),
		VitestCoreResolver(),
		NormalizeURLPlugin(),
		MetaEnvReplacerPlugin(),
		SsrRunnerFixerPlugin(harness),
		{
			name: "vitest:ui-injector",
			enforce: "post",
			async configResolved(config) {
				if (config.test.ui) {
					await harness.packageInstaller.ensureInstalled("@vitest/ui", resolve(config.root), harness.version);
					const uiPlugin = (await import('@vitest/ui')).default(harness);
					// @ts-expect-error mutate readonly
					config.plugins.push(uiPlugin);
				}
			}
		}
	];
}

// `name` must stay unique per project, `projects` would redefine the whole
// workspace, and `root` would re-root the project onto the declaring config
const NON_INHERITED_OPTIONS = [
	"name",
	"projects",
	"root"
];
// the root `globalSetup` already runs once per test run; a non-root
// config (a shared config or a container) keeps it because nothing else runs it
const NON_INHERITED_ROOT_OPTIONS = [...NON_INHERITED_OPTIONS, "globalSetup"];
/**
* Every plugin that modifies the `test` config during Vite config resolution.
* Projects that share the declaring config's Vite server run the same hooks
* through `resolveTestOptions` instead of resolving through Vite.
*
* `project` is only set for inline projects that extend another config.
* `sharedServer` is only set by `resolveTestOptions`: it carries the values
* that are normally derived from the resolving config's Vite options, which
* a shared server resolved once for its whole cluster.
*/
function TestConfigPlugin(harness, captures, cliOptions, globalConfig, project, sharedServer) {
	let testConfig;
	const noExternal = [];
	const external = [];
	let noExternalAll = false;
	return [{
		// The CLI plugin overwrites config values with CLI options, making them
		// available in the next plugin. We have to do this via plugins because of watch mode.
		name: "vitest:config:cli",
		enforce: "pre",
		config: {
			order: "pre",
			handler(config) {
				const { browser, ...options } = cliOptions;
				// We don't want to use Vite's merge because we want to OVERRIDE options
				// By default, Vite extends arrays, for example, but CLI options should have the priority
				config.test = deepMerge({}, config.test ?? {}, options);
				// apply browser CLI options only if the config already has the browser config and not disabled manually
				if (config.test.browser && browser && (config.test.browser.enabled !== false || browser.enabled)) config.test.browser = mergeConfig(config.test.browser, browser);
				// an extending project removes the non-inherited values it doesn't
				// define itself before any other `config` hook can set them
				if (!project) return;
				// the project's own `tags` replace the inherited array so tags can be overridden
				if (project.options.test?.tags) config.test.tags = project.options.test.tags;
				const nonInheritedOptions = project.extendsTrueRootConfig ? NON_INHERITED_ROOT_OPTIONS : NON_INHERITED_OPTIONS;
				for (const key of nonInheritedOptions) if (project.options.test?.[key] !== void 0) config.test[key] = project.options.test[key];
				else delete config.test[key];
			}
		}
	}, {
		name: "vitest:test-config",
		config: {
			order: "post",
			handler(config) {
				config.test ??= {};
				testConfig = config.test;
				const moduleDirectories = testConfig.deps?.moduleDirectories || [];
				const envModuleDirectories = process.env.VITEST_MODULE_DIRECTORIES || process.env.npm_config_VITEST_MODULE_DIRECTORIES;
				if (envModuleDirectories) moduleDirectories.push(...envModuleDirectories.split(","));
				const normalized = moduleDirectories.map((dir) => {
					if (dir[0] !== "/") dir = `/${dir}`;
					if (!dir.endsWith("/")) dir += "/";
					return normalize(dir);
				});
				if (!normalized.includes("/node_modules/")) normalized.push("/node_modules/");
				testConfig.deps ??= {};
				testConfig.deps.moduleDirectories = normalized;
				const isBrowserEnabled = !!testConfig.browser?.enabled;
				if (config.define) delete config.define["import.meta.vitest"];
				// We inject the defines at runtime in non-browser tests,
				// but keep the original behaviour in the browser mode
				const resolvedTestConfig = testConfig;
				if (isBrowserEnabled) resolvedTestConfig.defines = {};
				else if (sharedServer) {
					resolvedTestConfig.defines = sharedServer.defines;
					resolvedTestConfig._scriptDefines = sharedServer.scriptDefines;
				} else {
					const { defines, scriptDefines } = deleteDefineConfig(config);
					resolvedTestConfig.defines = defines;
					resolvedTestConfig._scriptDefines = scriptDefines;
				}
				const api = resolveApiServerConfig(testConfig, isBrowserEnabled ? harness._browserLastPort++ : defaultPort, harness.logger);
				testConfig.api = api;
				if (globalConfig) {
					api.token = globalConfig.api.token;
					api.tokenCreated = globalConfig.api.tokenCreated;
				}
			}
		},
		configEnvironment: {
			order: "post",
			handler(name, config) {
				if (name === "__vitest_vm__" || name === "__vitest__") return;
				// In browser mode the `client` environment is browser-managed
				if (name === "client" && testConfig.browser?.enabled) return;
				config.resolve ??= {};
				const envNoExternal = resolveViteResolveOptions("noExternal", config.resolve, testConfig.deps?.moduleDirectories);
				if (envNoExternal === true) noExternalAll = true;
				else if (envNoExternal.length) noExternal.push(...envNoExternal);
				const envExternal = resolveViteResolveOptions("external", config.resolve, testConfig.deps?.moduleDirectories);
				if (envExternal !== true && envExternal.length) external.push(...envExternal);
			}
		},
		configResolved: {
			order: "pre",
			handler(config) {
				const options = sharedServer?.moduleRunnerOptions ?? {
					inlineAll: noExternalAll,
					inline: noExternal,
					external
				};
				captures.moduleRunnerOptions = options;
				const testConfig = config.test;
				testConfig.server ??= {};
				testConfig.server.deps ??= {};
				if (testConfig.server.deps.inline !== true) {
					if (options.inlineAll) testConfig.server.deps.inline = true;
					else if (options.inline.length) {
						testConfig.server.deps.inline ??= [];
						testConfig.server.deps.inline.push(...options.inline);
					}
				}
				if (options.external.length) {
					testConfig.server.deps.external ??= [];
					testConfig.server.deps.external.push(...options.external);
				}
			}
		}
	}];
}
/**
* Applies the `test` mutations of `TestConfigPlugin` to a project that shares
* the declaring config's Vite server: the same hooks run on a bare config
* object instead of going through Vite's resolution.
*/
function resolveTestOptions(test, context) {
	const viteConfig = { test };
	const plugins = TestConfigPlugin(context.harness, {}, context.cliOptions, context.globalConfig, context.project, context.sharedServer);
	const env = {
		command: "serve",
		mode: test.mode || "test"
	};
	for (const plugin of plugins) {
		plugin.config?.handler(viteConfig, env);
		plugin.configResolved?.handler(viteConfig);
	}
	return viteConfig.test;
}
function resolveViteResolveOptions(key, options, moduleDirectories) {
	if (Array.isArray(options[key])) {
		// mergeConfig will merge a custom `true` into an array
		if (options[key].some((p) => p === true)) return true;
		return options[key].map((dep) => processWildcard(dep, moduleDirectories));
	} else if (typeof options[key] === "string" || options[key] instanceof RegExp) return [options[key]].map((dep) => processWildcard(dep, moduleDirectories));
	else if (typeof options[key] === "boolean") return true;
	return [];
}
function processWildcard(dep, moduleDirectories) {
	if (typeof dep !== "string") return dep;
	if (typeof dep === "string" && dep.includes("*")) {
		const directories = (moduleDirectories || ["/node_modules/"]).map((r) => escapeRegExp(r));
		return new RegExp(`(${directories.join("|")})${dep.replace(/\*/g, "[\\w/]+")}`);
	}
	return dep;
}

const API_TOKEN_FILE = ".vitest-secret-token";
// Follows env-paths' user data directory conventions:
// https://github.com/sindresorhus/env-paths/blob/v4.0.0/index.js
function getUserDataDir() {
	if (process.platform === "win32") return process.env.LOCALAPPDATA || join(homedir(), "AppData/Local");
	if (process.platform === "darwin") return join(homedir(), "Library/Application Support");
	return process.env.XDG_DATA_HOME || join(homedir(), ".local/share");
}
function resolveTokenFromPath(tokenPath) {
	if (existsSync(tokenPath)) return {
		token: readFileSync(tokenPath, "utf-8").trim(),
		tokenCreated: false
	};
	const token = crypto.randomUUID();
	mkdirSync(dirname(tokenPath), {
		recursive: true,
		mode: 448
	});
	writeFileSync(tokenPath, `${token}\n`, { mode: 384 });
	try {
		chmodSync(dirname(tokenPath), 448);
		chmodSync(tokenPath, 384);
	} catch {}
	return {
		token,
		tokenCreated: true
	};
}
function resolveApiToken(root) {
	const tokenPaths = [join(getUserDataDir(), "vitest", API_TOKEN_FILE), join(searchForWorkspaceRoot(root), "node_modules/.vitest", API_TOKEN_FILE)];
	for (const tokenPath of tokenPaths) try {
		return {
			...resolveTokenFromPath(tokenPath),
			tokenPath
		};
	} catch {}
	throw new Error(`Failed to create Vitest API token at ${tokenPaths.join(" or ")}`);
}

function WorkspaceVitestPlugin(harness, globalViteConfig) {
	return [
		{
			name: "vitest:project",
			enforce: "post",
			options() {
				this.meta.watchMode = false;
			},
			config(viteConfig) {
				const testConfig = viteConfig.test || {};
				const root = testConfig.root || viteConfig.root;
				return {
					base: "/",
					root,
					cacheDir: resolveTestCacheDir(resolve(root || process.cwd()), testConfig, viteConfig.cacheDir),
					server: {
						open: false,
						fs: {
							allow: globalViteConfig.server.fs.allow,
							deny: [API_TOKEN_FILE]
						}
					}
				};
			},
			configResolved(config) {
				// project servers never watch; the top-level server owns the watcher
				config.server.watch = null;
			}
		},
		SsrRunnerFixerPlugin(harness),
		MetaEnvReplacerPlugin(),
		...CSSEnablerPlugin(),
		CoverageTransform(harness),
		...ViteConfigPlugin(harness),
		...MocksPlugins(),
		VitestProjectResolver(harness),
		NormalizeURLPlugin()
	];
}

function getOutputFile(config, reporter) {
	if (!config?.outputFile) return;
	if (typeof config.outputFile === "string") return config.outputFile;
	return config.outputFile[reporter];
}
function createDefinesScript(define) {
	if (!define) return "";
	const serializedDefine = serializeDefine(define);
	if (serializedDefine === "{}") return "";
	return `
const defines = ${serializedDefine}
const metaDefines = {}
Object.keys(defines).forEach((key) => {
  if (key.startsWith('import.meta.env.')) {
    process.env[key.slice('import.meta.env.'.length)] = defines[key]
    return
  }
  if (key.startsWith('import.meta.')) {
    metaDefines[key.slice('import.meta.'.length)] = defines[key]
    return
  }
  const segments = key.split('.')
  let target = globalThis
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    if (i === segments.length - 1) {
      target[segment] = defines[key]
    } else {
      target = target[segment] || (target[segment] = {})
    }
  }
})
globalThis.__vitest_worker__.metaDefines = metaDefines
  `;
}
/**
* Like `JSON.stringify` but keeps raw string values as a literal
* in the generated code. For example: `"window"` would refer to
* the global `window` object directly.
*/
function serializeDefine(define) {
	const userDefine = {};
	for (const key in define) {
		// vitest sets this to avoid vite:client-inject plugin
		if (key === "process.env.NODE_ENV" && define[key] === "process.env.NODE_ENV") continue;
		userDefine[key] = define[key];
	}
	let res = `{`;
	const keys = Object.keys(userDefine).sort();
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const val = userDefine[key];
		res += `${JSON.stringify(key)}: ${handleDefineValue(val)}`;
		if (i !== keys.length - 1) res += `, `;
	}
	return `${res}}`;
}
function handleDefineValue(value) {
	if (typeof value === "undefined") return "undefined";
	if (typeof value === "string") return value;
	return JSON.stringify(value);
}

class BenchmarkManager {
	project;
	constructor(project) {
		this.project = project;
	}
	// Resolve a user-supplied path against the project root. Reject paths that
	// escape the project root: `bench.from()` accepts arbitrary input, and we
	// never want a benchmark file to be able to read or clobber files outside
	// the workspace.
	resolve(relativePath) {
		const root = this.project.config.root;
		const absolute = isAbsolute(relativePath) ? resolve(relativePath) : resolve(root, relativePath);
		const rootWithSep = root.endsWith("/") ? root : `${root}/`;
		if (absolute !== root && !absolute.startsWith(rootWithSep)) throw new Error(`Benchmark artifact path "${relativePath}" resolves outside the project root (${root}). Paths passed to \`writeResult\` and \`bench.from()\` must point inside the project.`);
		return absolute;
	}
	async readResult(relativePath) {
		const path = this.resolve(relativePath);
		if (!existsSync(path)) return null;
		return JSON.parse(await readFile(path, "utf-8"));
	}
	async writeResult(relativePath, data) {
		const absolute = this.resolve(relativePath);
		await mkdir(dirname(absolute), { recursive: true });
		await writeFile(absolute, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
	}
}

function serializeConfig(project) {
	const { config, globalConfig, viteConfig } = project;
	const optimizer = config.deps?.optimizer || {};
	return {
		// TODO: remove functions from environmentOptions
		environmentOptions: config.environmentOptions,
		isolate: config.isolate,
		maxWorkers: config.maxWorkers,
		base: config.base,
		logHeapUsage: config.logHeapUsage,
		runner: config.runner,
		bail: config.bail,
		defines: config.defines,
		chaiConfig: config.chaiConfig,
		taskTitleValueFormatTruncate: config.taskTitleValueFormatTruncate,
		setupFiles: config.setupFiles,
		allowOnly: config.allowOnly,
		testTimeout: config.testTimeout,
		testNamePattern: config.testNamePattern,
		hookTimeout: config.hookTimeout,
		clearMocks: config.clearMocks,
		mockReset: config.mockReset,
		restoreMocks: config.restoreMocks,
		unstubEnvs: config.unstubEnvs,
		unstubGlobals: config.unstubGlobals,
		maxConcurrency: config.maxConcurrency,
		pool: config.pool,
		expect: config.expect,
		snapshotSerializers: config.snapshotSerializers,
		api: {
			allowExec: config.api.allowExec,
			allowWrite: config.api.allowWrite
		},
		diff: serializeDiffOptions(config.diff),
		retry: config.retry,
		repeats: config.repeats,
		disableConsoleIntercept: config.disableConsoleIntercept,
		root: config.root,
		name: config.name,
		color: config.color,
		globals: config.globals,
		injectCjsGlobals: config.injectCjsGlobals,
		snapshotEnvironment: config.snapshotEnvironment,
		passWithNoTests: config.passWithNoTests,
		coverage: ((coverage) => {
			const reportsDirectory = resolve$1(globalConfig.root, coverage.reportsDirectory);
			return {
				reportsDirectory,
				coverageFilesDirectory: getCoverageFilesDirectory(reportsDirectory, globalConfig.shard),
				provider: coverage.provider,
				enabled: coverage.enabled,
				customProviderModule: "customProviderModule" in coverage ? coverage.customProviderModule : void 0,
				htmlDir: coverage.htmlDir,
				autoAttachSubprocess: coverage.autoAttachSubprocess ?? false
			};
		})(config.coverage),
		fakeTimers: config.fakeTimers,
		deps: {
			web: config.deps.web || {},
			optimizer: Object.entries(optimizer).reduce((acc, [name, option]) => {
				acc[name] = { enabled: option?.enabled ?? false };
				return acc;
			}, {}),
			interopDefault: config.deps.interopDefault,
			moduleDirectories: config.deps.moduleDirectories
		},
		snapshotOptions: {
			// TODO: store it differently, not on the config
			snapshotEnvironment: void 0,
			updateSnapshot: globalConfig.snapshotOptions.updateSnapshot,
			snapshotFormat: { ...globalConfig.snapshotOptions.snapshotFormat },
			expand: config.snapshotOptions.expand ?? globalConfig.snapshotOptions.expand
		},
		sequence: {
			shuffle: config.sequence.shuffle,
			concurrent: config.sequence.concurrent,
			// `seed` and `sequencer` drive cross-project file ordering, so they are
			// resolved from the root config and shared across all projects.
			seed: globalConfig.sequence.seed,
			hooks: config.sequence.hooks,
			setupFiles: config.sequence.setupFiles
		},
		inspect: globalConfig.inspect,
		inspectBrk: globalConfig.inspectBrk,
		inspector: globalConfig.inspector,
		detectAsyncLeaks: globalConfig.detectAsyncLeaks,
		watch: config.watch,
		includeTaskLocation: config.includeTaskLocation ?? globalConfig.includeTaskLocation,
		env: {
			...viteConfig?.env,
			...config.env
		},
		browser: ((browser) => {
			const provider = project.browser?.provider;
			return {
				name: browser.name,
				headless: browser.headless,
				ui: browser.ui,
				detailsPanelPosition: browser.detailsPanelPosition ?? "right",
				viewport: browser.viewport,
				screenshotFailures: browser.screenshotFailures,
				locators: {
					testIdAttribute: browser.locators.testIdAttribute,
					exact: browser.locators.exact,
					errorFormat: browser.locators.errorFormat
				},
				providerOptions: provider?.name === "playwright" ? { actionTimeout: provider?.options?.actionTimeout } : {},
				trackUnhandledErrors: browser.trackUnhandledErrors ?? true,
				trace: browser.trace.mode,
				traceView: browser.traceView
			};
		})(config.browser),
		standalone: config.standalone,
		printConsoleTrace: config.printConsoleTrace ?? globalConfig.printConsoleTrace,
		benchmark: {
			enabled: config.benchmark.enabled,
			retainSamples: config.benchmark.retainSamples,
			provider: config.benchmark.provider,
			suppressExportGetterWarnings: config.benchmark.suppressExportGetterWarnings,
			projectName: config.benchmark.projectName
		},
		// the browser initialized them via `@vite/env` import
		serializedDefines: config.browser.enabled ? "" : project._serializedDefines || "",
		fsModuleCache: config.fsModuleCache ?? false,
		experimental: {
			importDurations: config.experimental.importDurations,
			viteModuleRunner: config.experimental.viteModuleRunner ?? true,
			nodeLoader: config.experimental.nodeLoader ?? true,
			openTelemetry: config.experimental.openTelemetry
		},
		tags: config.tags || [],
		tagsFilter: config.tagsFilter,
		strictTags: config.strictTags ?? true,
		mergeReportsLabel: config.mergeReportsLabel,
		slowTestThreshold: config.slowTestThreshold ?? globalConfig.slowTestThreshold ?? configDefaults.slowTestThreshold,
		disableColors: isAgent && !isForceColor(),
		attachmentsDir: config.attachmentsDir
	};
}
const serializableDiffKeys = [
	"aAnnotation",
	"aIndicator",
	"bAnnotation",
	"bIndicator",
	"commonIndicator",
	"contextLines",
	"emptyFirstOrLastLinePlaceholder",
	"expand",
	"includeChangeCounts",
	"omitAnnotationLines",
	"printBasicPrototype",
	"maxDepth",
	"truncateThreshold",
	"truncateAnnotation"
];
// `diff` can be an inline object containing color/compareKeys functions
// (`DiffOptions`). Those functions are not structured-cloneable (threads pool)
// and are silently dropped over `child_process` IPC (forks pool), so passing
// the raw object to workers throws `DataCloneError`. Forward only the
// serializable fields declared by `SerializedDiffOptions`, and only the ones
// actually set — explicit `undefined` values would override the diff defaults
// when the worker merges the options. The function-based options still
// require the file-path form, which workers import locally.
function serializeDiffOptions(diff) {
	if (diff == null || typeof diff === "string") return diff;
	const result = {};
	for (const key of serializableDiffKeys) if (diff[key] !== void 0) result[key] = diff[key];
	return result;
}

async function loadGlobalSetupFiles(runner, globalSetup) {
	const globalSetupFiles = toArray(globalSetup);
	return Promise.all(globalSetupFiles.map((file) => loadGlobalSetupFile(file, runner)));
}
async function loadGlobalSetupFile(file, runner) {
	const m = await runner.import(file);
	for (const exp of [
		"default",
		"setup",
		"teardown"
	]) if (m[exp] != null && typeof m[exp] !== "function") throw new Error(`invalid export in globalSetup file ${file}: ${exp} must be a function`);
	if (m.default) return {
		file,
		setup: m.default
	};
	else if (m.setup || m.teardown) return {
		file,
		setup: m.setup,
		teardown: m.teardown
	};
	else throw new Error(`invalid globalSetup file ${file}. Must export setup, teardown or have a default export`);
}

function getDefaultThreadsCount(config) {
	const numCpus = typeof os.availableParallelism === "function" ? os.availableParallelism() : os.cpus().length;
	return config.watch ? Math.max(Math.floor(numCpus / 2), 1) : Math.max(numCpus - 1, 1);
}
function getWorkerMemoryLimit(config) {
	if (config.vmMemoryLimit) return config.vmMemoryLimit;
	return 1 / (config.maxWorkers ?? getDefaultThreadsCount(config));
}
/**
* Converts a string representing an amount of memory to bytes.
*
* @param input The value to convert to bytes.
* @param percentageReference The reference value to use when a '%' value is supplied.
*/
function stringToBytes(input, percentageReference) {
	if (input === null || input === void 0) return input;
	if (typeof input === "string") if (Number.isNaN(Number.parseFloat(input.slice(-1)))) {
		let [, numericString, trailingChars] = input.match(/(.*?)([^0-9.-]+)$/) || [];
		if (trailingChars && numericString) {
			const numericValue = Number.parseFloat(numericString);
			trailingChars = trailingChars.toLowerCase();
			switch (trailingChars) {
				case "%":
					input = numericValue / 100;
					break;
				case "kb":
				case "k": return numericValue * 1e3;
				case "kib": return numericValue * 1024;
				case "mb":
				case "m": return numericValue * 1e3 * 1e3;
				case "mib": return numericValue * 1024 * 1024;
				case "gb":
				case "g": return numericValue * 1e3 * 1e3 * 1e3;
				case "gib": return numericValue * 1024 * 1024 * 1024;
			}
		}
	} else input = Number.parseFloat(input);
	if (typeof input === "number") if (input <= 1 && input > 0) if (percentageReference) return Math.floor(input * percentageReference);
	else throw new Error("For a percentage based memory limit a percentageReference must be supplied");
	else if (input > 1) return Math.floor(input);
	else throw new Error("Unexpected numerical input for \"memoryLimit\"");
	return null;
}

class FilesNotFoundError extends Error {
	code = "VITEST_FILES_NOT_FOUND";
	constructor() {
		super(`No test files found`);
	}
}
class GitNotFoundError extends Error {
	code = "VITEST_GIT_NOT_FOUND";
	constructor() {
		super("Could not find Git root. Have you initialized git with `git init`?");
	}
}
class BrowserConnectionError extends Error {
	code = "VITEST_BROWSER_CONNECTION_CLOSED";
}
class LocationFilterFileNotFoundError extends Error {
	code = "VITEST_LOCATION_FILTER_FILE_NOT_FOUND";
	constructor(filename) {
		super(`Couldn\'t find file ${filename}. Note when specifying the test location you have to specify the full test filename.`);
	}
}
class IncludeTaskLocationDisabledError extends Error {
	code = "VITEST_INCLUDE_TASK_LOCATION_DISABLED";
	constructor() {
		super("Received line number filters while `includeTaskLocation` option is disabled");
	}
}
class RangeLocationFilterProvidedError extends Error {
	code = "VITEST_RANGE_LOCATION_FILTER_PROVIDED";
	constructor(filter) {
		super(`Found "-" in location filter ${filter}.  Note that range location filters are not supported.  Consider specifying the exact line numbers of your tests.`);
	}
}

const debug$1 = createDebugger("vitest:browser:pool");
const PROVIDER_CLOSE_TIMEOUT = 1e4;
function createBrowserPool(vitest) {
	const providers = /* @__PURE__ */ new Set();
	const numCpus = typeof os.availableParallelism === "function" ? os.availableParallelism() : os.cpus().length;
	// if there are more than ~12 threads (optimistically), the main thread chokes
	// https://github.com/vitest-dev/vitest/issues/7871
	const maxThreadsCount = Math.min(12, numCpus - 1);
	const threadsCount = vitest.config.watch ? Math.max(Math.floor(maxThreadsCount / 2), 1) : Math.max(maxThreadsCount, 1);
	const projectPools = /* @__PURE__ */ new WeakMap();
	const ensurePool = (project) => {
		if (projectPools.has(project)) return projectPools.get(project);
		debug$1?.("creating pool for project %s", project.name);
		const pool = new BrowserPool(project, { maxWorkers: getThreadsCount(project) });
		projectPools.set(project, pool);
		vitest.onCancel(() => {
			pool.cancel();
		});
		return pool;
	};
	const runWorkspaceTests = async (method, specs) => {
		const groupedFiles = /* @__PURE__ */ new Map();
		const testFilesCode = /* @__PURE__ */ new Map();
		const testFileTags = /* @__PURE__ */ new WeakMap();
		await Promise.all(specs.map(async (spec) => {
			let code = testFilesCode.get(spec.moduleId);
			// TODO: this really should be done only once when collecting specifications
			if (code == null) {
				code = await readFile(spec.moduleId, "utf-8").catch(() => "");
				testFilesCode.set(spec.moduleId, code);
			}
			const { tags } = detectCodeBlock(code);
			testFileTags.set(spec, tags);
		}));
		// to keep the sorting, we need to iterate over specs separately
		for (const spec of specs) {
			const { project, moduleId, testLines, testIds, testNamePattern, testTagsFilter } = spec;
			const files = groupedFiles.get(project) || [];
			files.push({
				filepath: moduleId,
				testLocations: testLines,
				testIds,
				testNamePattern,
				testTagsFilter,
				fileTags: testFileTags.get(spec)
			});
			groupedFiles.set(project, files);
		}
		let isCancelled = false;
		vitest.onCancel(() => {
			isCancelled = true;
		});
		const initialisedPools = await Promise.all(Array.from(groupedFiles.entries(), async ([project, files]) => {
			await project._initBrowserProvider();
			if (!project.browser) throw new TypeError(`The browser server was not initialized${project.name ? ` for the "${project.name}" project` : ""}. This is a bug in Vitest. Please, open a new issue with reproduction.`);
			if (isCancelled) return;
			debug$1?.("provider is ready for %s project", project.name);
			const pool = ensurePool(project);
			vitest.state.clearFiles(project, files.map((f) => f.filepath));
			providers.add(project.browser.provider);
			return {
				pool,
				provider: project.browser.provider,
				runTests: () => pool.runTests(method, files)
			};
		}));
		if (isCancelled) return;
		const parallelPools = [];
		const nonParallelPools = [];
		for (const pool of initialisedPools) {
			if (!pool)
 // this means it was cancelled
			return;
			if (pool.provider.mocker && pool.provider.supportsParallelism) parallelPools.push(pool.runTests);
			else nonParallelPools.push(pool.runTests);
		}
		await Promise.all(parallelPools.map((runTests) => runTests()));
		for (const runTests of nonParallelPools) {
			if (isCancelled) return;
			await runTests();
		}
	};
	function getThreadsCount(project) {
		if (!project.config.browser.headless || !project.browser.provider.supportsParallelism) return 1;
		if (project.config.maxWorkers) return project.config.maxWorkers;
		return threadsCount;
	}
	return {
		name: "browser",
		async close() {
			// a frozen or crashed browser never answers the close message;
			// don't wait for it forever, the browser process is killed
			// when this process exits anyway
			await Promise.all(Array.from(providers, (provider) => {
				let timer;
				return Promise.race([Promise.resolve(provider.close()).finally(() => clearTimeout(timer)), new Promise((resolve) => {
					timer = setTimeout(() => {
						vitest.logger.warn(`The browser did not close within ${PROVIDER_CLOSE_TIMEOUT}ms. The browser process will be killed when the process exits.`);
						resolve();
					}, PROVIDER_CLOSE_TIMEOUT);
					timer.unref();
				})]);
			}));
			vitest._browserSessions.sessionIds.clear();
			providers.clear();
			vitest.projects.forEach((project) => {
				project.browser?.state.orchestrators.forEach((orchestrator) => {
					orchestrator.$close();
				});
			});
			debug$1?.("browser pool closed all providers");
		},
		runTests: (files) => runWorkspaceTests("run", files),
		collectTests: (files) => runWorkspaceTests("collect", files)
	};
}
function escapePathToRegexp(path) {
	return path.replace(/[/\\.?*()^${}|[\]+]/g, "\\$&");
}
class BrowserPool {
	project;
	options;
	_queue = [];
	_promise;
	_providedContext;
	readySessions;
	_traces;
	_otel;
	constructor(project, options) {
		this.project = project;
		this.options = options;
		this._traces = project.vitest._traces;
		this._otel = this._traces.startContextSpan("vitest.browser");
		this._otel.span.setAttributes({
			"vitest.project": project.name,
			"vitest.browser.provider": this.project.browser.provider.name
		});
		this.readySessions = project._browserReadySessions;
	}
	cancel() {
		this._queue = [];
		this._otel.span.end();
	}
	reject(error) {
		this._promise?.reject(error);
		this._promise = void 0;
		this.cancel();
	}
	get orchestrators() {
		return this.project.browser.state.orchestrators;
	}
	async runTests(method, files) {
		this._promise ??= createDefer();
		if (!files.length) {
			debug$1?.("no tests found, finishing test run immediately");
			this._promise.resolve();
			return this._promise;
		}
		this._providedContext = stringify(this.project.getProvidedContext());
		this._queue.push(...files);
		this.readySessions.forEach((sessionId) => {
			if (this._queue.length) {
				this.readySessions.delete(sessionId);
				this.runNextTest(method, sessionId);
			}
		});
		if (this.orchestrators.size >= this.options.maxWorkers) {
			debug$1?.("all orchestrators are ready, not creating more");
			return this._promise;
		}
		// open the minimum amount of tabs
		// if there is only 1 file running, we don't need 8 tabs running
		const workerCount = Math.min(this.options.maxWorkers - this.orchestrators.size, files.length);
		const promises = [];
		for (let i = 0; i < workerCount; i++) {
			const sessionId = crypto.randomUUID();
			this.project.vitest._browserSessions.sessionIds.add(sessionId);
			const project = this.project.name;
			debug$1?.("[%s] creating session for %s", sessionId, project);
			const page = this._traces.$(`vitest.browser.open`, {
				context: this._otel.context,
				attributes: { "vitest.browser.session_id": sessionId }
			}, () => this.openPage(sessionId, { parallel: workerCount > 1 })).then(() => {
				// start running tests on the page when it's ready
				this.runNextTest(method, sessionId);
			});
			promises.push(page);
		}
		await Promise.all(promises);
		debug$1?.("all sessions are created");
		return this._promise;
	}
	async openPage(sessionId, options) {
		await this.project._openBrowserPage(sessionId, {
			reject: (error) => this.reject(error),
			parallel: options.parallel
		});
	}
	// stable slot id (1..maxWorkers) assigned to each session/orchestrator on its
	// first run, exposed to the test runner as both `concurrencyId` and `workerId`.
	// the id lives on the session, so it is freed when the session disconnects, and
	// the used set is derived from the live orchestrators, so it stays within maxWorkers
	getConcurrencyId(sessionId) {
		const sessions = this.project.vitest._browserSessions;
		const session = sessions.getSession(sessionId);
		if (session?.concurrencyId) return session.concurrencyId;
		const used = /* @__PURE__ */ new Set();
		for (const id of this.orchestrators.keys()) {
			const concurrencyId = sessions.getSession(id)?.concurrencyId;
			if (concurrencyId) used.add(concurrencyId);
		}
		let concurrencyId = 1;
		while (used.has(concurrencyId)) concurrencyId++;
		if (session) session.concurrencyId = concurrencyId;
		return concurrencyId;
	}
	getOrchestrator(sessionId) {
		const orchestrator = this.orchestrators.get(sessionId);
		if (!orchestrator) throw new Error(`Orchestrator not found for session ${sessionId}. This is a bug in Vitest. Please, open a new issue with reproduction.`);
		return orchestrator;
	}
	finishSession(sessionId) {
		this.readySessions.add(sessionId);
		// the last worker finished running tests
		if (this.readySessions.size === this.orchestrators.size) {
			this._otel.span.end();
			this._promise?.resolve();
			this._promise = void 0;
			debug$1?.("[%s] all tests finished running", sessionId);
		} else debug$1?.(`did not finish sessions for ${sessionId}: |ready - %s| |overall - %s|`, [...this.readySessions].join(", "), [...this.orchestrators.keys()].join(", "));
	}
	runNextTest(method, sessionId) {
		const file = this._queue.shift();
		if (!file) {
			debug$1?.("[%s] no more tests to run", sessionId);
			// we don't need to cleanup testers if isolation is enabled,
			// because cleanup is done at the end of every test
			if (this.project.config.isolate) {
				this.finishSession(sessionId);
				return;
			}
			this.getOrchestrator(sessionId).cleanupTesters().catch((error) => this.reject(error)).finally(() => this.finishSession(sessionId));
			return;
		}
		if (!this._promise) throw new Error(`Unexpected empty queue`);
		const orchestrator = this.getOrchestrator(sessionId);
		debug$1?.("[%s] run test %s", sessionId, file);
		// warm the transform cache while the iframe is booting so the test
		// file import doesn't wait for the transform; mirrors the URL the
		// tester will request (see `importFile` in the browser runner)
		const fileUrl = `/${/^\w:/.test(file.filepath) ? "@fs/" : ""}${file.filepath}`.replace(/\/+/g, "/");
		this.project.vite.transformRequest(fileUrl).catch(() => {});
		this.setBreakpoint(sessionId, file.filepath).then(() => {
			this._traces.$(`vitest.browser.run`, {
				context: this._otel.context,
				attributes: { "code.file.path": file.filepath }
			}, async () => {
				const concurrencyId = this.getConcurrencyId(sessionId);
				return orchestrator.createTesters({
					method,
					files: [file],
					// this will be parsed by the test iframe, not the orchestrator
					// so we need to stringify it first to avoid double serialization
					providedContext: this._providedContext || "[{}]",
					otelCarrier: this._traces.getContextCarrier(),
					concurrencyId,
					// in the browser there is a single tab per orchestrator,
					// so the worker id matches the concurrency slot
					workerId: concurrencyId
				});
			}).then(async () => {
				debug$1?.("[%s] test %s finished running", sessionId, file);
				await maybeCollectChromiumGarbage(this.project, sessionId);
				this.runNextTest(method, sessionId);
			}).catch((error) => {
				// if user cancels the test run manually, ignore the error and exit gracefully
				if (this.project.vitest.isCancelling && error instanceof BrowserConnectionError) {
					this.cancel();
					this._promise?.resolve();
					this._promise = void 0;
					debug$1?.("[%s] browser connection was closed", sessionId);
					return;
				}
				debug$1?.("[%s] error during %s test run: %s", sessionId, file, error);
				this.reject(new Error(`Failed to run the test ${file.filepath}.`, { cause: error }));
			});
		}).catch((err) => this.reject(err));
	}
	async setBreakpoint(sessionId, file) {
		if (!this.project.config.inspector.waitForDebugger) return;
		const provider = this.project.browser.provider;
		const browser = this.project.config.browser.name;
		if (shouldIgnoreDebugger(provider.name, browser)) {
			debug$1?.("[$s] ignoring debugger in %s browser because it is not supported", sessionId, browser);
			return;
		}
		if (!provider.getCDPSession) throw new Error("Unable to set breakpoint, CDP not supported");
		debug$1?.("[%s] set breakpoint for %s", sessionId, file);
		const session = await provider.getCDPSession(sessionId);
		await session.send("Debugger.enable", {});
		await session.send("Debugger.setBreakpointByUrl", {
			lineNumber: 0,
			urlRegex: escapePathToRegexp(file)
		});
	}
}
function shouldIgnoreDebugger(provider, browser) {
	if (provider === "webdriverio") return browser !== "chrome" && browser !== "edge";
	return browser !== "chromium";
}
// Best-effort workaround for chromium/playwright bug
// https://issues.chromium.org/issues/530892387
// Trigger gc on lower disk (default to 4GB)
const chromiumGCDiskThreshold = process.env.VITEST_CHROMIUM_GC_DISK_THRESHOLD_GB ? Number(process.env.VITEST_CHROMIUM_GC_DISK_THRESHOLD_GB) * 1024 ** 3 : 4 * 1024 ** 3;
const forceChromiumGC = !!process.env.VITEST_CHROMIUM_GC_FORCE;
const debugGC = createDebugger("vitest:browser:gc");
async function maybeCollectChromiumGarbage(project, sessionId) {
	// trigger only on linux/chromium/playwright
	const provider = project.browser.provider;
	if (!forceChromiumGC && process.platform !== "linux" || provider.name !== "playwright" || project.config.browser.name !== "chromium" || !project.config.isolate || !provider.getCDPSession) return;
	const start = performance.now();
	const diagnostics = {
		statfsBeforeMs: void 0,
		statfsAfterMs: void 0,
		cdpSessionMs: void 0,
		cdpSendMs: void 0,
		cdpDetachMs: void 0,
		forced: forceChromiumGC
	};
	try {
		// Playwright enables --disable-dev-shm-usage by default, which makes
		// Chromium use TMPDIR or /tmp for shared memory files.
		// https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/chromium/chromiumSwitches.ts
		// https://source.chromium.org/chromium/chromium/src/+/main:base/files/file_util_posix.cc
		const tempDirectory = process.env.TMPDIR || "/tmp";
		let operationStart = performance.now();
		const fsStats = statfsSync(tempDirectory);
		diagnostics.statfsBeforeMs = performance.now() - operationStart;
		const available = fsStats.bavail * fsStats.bsize;
		diagnostics.availableBytesBefore = available.toString();
		diagnostics.thresholdBytes = chromiumGCDiskThreshold.toString();
		diagnostics.tempDirectory = tempDirectory;
		diagnostics.triggered = available < chromiumGCDiskThreshold;
		if (available >= chromiumGCDiskThreshold) return;
		operationStart = performance.now();
		// `detach` is available only internally and not on CDPSession type
		const cdp = await provider.getCDPSession(sessionId);
		diagnostics.cdpSessionMs = performance.now() - operationStart;
		try {
			operationStart = performance.now();
			await cdp.send("HeapProfiler.collectGarbage");
			diagnostics.cdpSendMs = performance.now() - operationStart;
		} finally {
			operationStart = performance.now();
			await cdp.detach().catch((error) => {
				debugGC?.("[%s] failed to detach Chromium CDP session: %s", sessionId, error);
			});
			diagnostics.cdpDetachMs = performance.now() - operationStart;
		}
		if (debugGC?.enabled) {
			operationStart = performance.now();
			const fsStatsAfter = statfsSync(tempDirectory);
			diagnostics.statfsAfterMs = performance.now() - operationStart;
			diagnostics.availableBytesAfter = (fsStatsAfter.bavail * fsStatsAfter.bsize).toString();
		}
		const availableGiB = available / 1024 ** 3;
		const thresholdGiB = chromiumGCDiskThreshold / 1024 ** 3;
		debugGC?.("[%s] Low disk space detected in %s (%s GiB available, %s GiB threshold). Vitest triggered Chromium garbage collection to prevent browser crashes.", sessionId, tempDirectory, availableGiB.toFixed(1), thresholdGiB.toFixed(1));
	} catch (error) {
		// don't surface if fs or cdp fails
		debugGC?.("[%s] failed to collect Chromium garbage: %s", sessionId, error);
	} finally {
		diagnostics.totalMs = performance.now() - start;
		debugGC?.("[%s] Chromium garbage collection check: %O", sessionId, diagnostics);
	}
}

// externalize verdicts served during this session, shared with fresh workers
// via `fetchWarmModules`. Only verdicts for already-resolved urls are stored:
// an unresolved specifier (a runtime-variable dynamic import of a bare name)
// resolves through the requesting environment's plugin container, so its
// verdict is importer-specific and cannot be shared.
// Keyed by the DevEnvironment, not the server: a leading-slash url still
// resolves to its id through that environment's plugin container, so a plugin
// that resolves conditionally (e.g. on `this.environment`) can externalize the
// same url in one environment and inline it in another — sharing the verdict
// across environments would serve the wrong one. Per-environment keying also
// drops the verdicts on a server restart, since environments are recreated.
const warmExternals = /* @__PURE__ */ new WeakMap();
function createMethodsRPC(project, methodsOptions = {}) {
	const vitest = project.vitest;
	const cacheFs = methodsOptions.cacheFs ?? false;
	project.vitest.state.metadata[project.name] ??= {
		externalized: {},
		duration: {},
		tmps: {}
	};
	if (project.config.dumpDir && !existsSync(project.config.dumpDir)) mkdirSync(project.config.dumpDir, { recursive: true });
	project.vitest.state.metadata[project.name].dumpDir = project.config.dumpDir;
	function getEnvironment(environmentName) {
		const environment = project.vite.environments[environmentName];
		if (!environment) throw new Error(`The environment ${environmentName} was not defined in the Vite config.`);
		return environment;
	}
	async function fetchModule(url, importer, environment, options, otelCarrier, accountModuleDuration = true) {
		const state = project.vitest.state;
		const start = performance.now();
		return await project._fetcher(url, importer, environment, cacheFs, options, otelCarrier).then((result) => {
			const metadata = state.metadata[project.name];
			if ("externalize" in result) {
				metadata.externalized[url] = result.externalize;
				// builtins and network urls are already resolved inside the worker
				// without a round-trip, only module externalizations are worth sharing
				if (result.type === "module" && url[0] === "/") {
					let externals = warmExternals.get(environment);
					if (!externals) {
						externals = Object.create(null);
						warmExternals.set(environment, externals);
					}
					externals[url] = result;
				}
			}
			if ("tmp" in result) metadata.tmps[url] = result.tmp;
			if (accountModuleDuration) {
				const duration = performance.now() - start;
				metadata.duration[url] ??= [];
				metadata.duration[url].push(duration);
			}
			return result;
		});
	}
	return {
		async fetch(url, importer, environmentName, options, otelCarrier) {
			return fetchModule(url, importer, getEnvironment(environmentName), options, otelCarrier);
		},
		async fetchWarmModules(environmentName, files) {
			const environment = project.vite.environments[environmentName];
			if (!environment) throw new Error(`The environment ${environmentName} was not defined in the Vite config.`);
			const warm = Object.create(null);
			// walk the import graphs of the requested files instead of dumping the
			// whole module graph — in large (watch) sessions the graph accumulates
			// modules this worker will never load
			const moduleGraph = environment.moduleGraph;
			const queue = [];
			for (const file of [...files, ...project.config.setupFiles]) {
				const nodes = moduleGraph.getModulesByFile(file);
				if (nodes) queue.push(...nodes);
			}
			const seen = /* @__PURE__ */ new Set();
			while (queue.length) {
				const node = queue.pop();
				if (seen.has(node)) continue;
				seen.add(node);
				queue.push(...node.importedModules);
				const transformResult = node.transformResult;
				if (!transformResult || node.id == null) continue;
				// the transformed code is already stored on disk either by the forks
				// pool (`cacheFs`) or by `fsModuleCache` — the worker can
				// read the file itself instead of fetching each module separately.
				// invalidated modules lose `transformResult` and drop out automatically
				const tmp = transformResult.__vitestTmp;
				if (typeof tmp !== "string") continue;
				const entry = {
					cached: true,
					file: node.file,
					id: node.id,
					tmp,
					url: node.url,
					invalidate: false,
					moduleType: transformResult.__vitestModuleType
				};
				warm[node.url] = entry;
				if (node.id !== node.url) warm[node.id] = entry;
			}
			const externals = warmExternals.get(environment);
			if (externals) for (const url in externals) warm[url] ??= externals[url];
			return warm;
		},
		async prewarmModuleGraph(environmentName, files) {
			const environment = getEnvironment(environmentName);
			const moduleGraph = environment.moduleGraph;
			function getStaticMocks(node) {
				return node.transformResult?.__vitestStaticMocks ?? environment.pluginContainer.getModuleInfo(node.id)?.meta?.vitestStaticMocks;
			}
			// modules the root replaces with an inline factory are never requested
			async function resolveMockedIds(root) {
				const ids = /* @__PURE__ */ new Set();
				const mocks = getStaticMocks(root)?.filter((mock) => mock.method === "mock" && mock.hasFactory && !mock.factoryLoadsOriginal);
				if (mocks?.length) await Promise.all(mocks.map(async (mock) => {
					const resolved = await environment.pluginContainer.resolveId(mock.specifier, root.id ?? void 0).catch(() => null);
					if (resolved) ids.add(resolved.id);
				}));
				return ids;
			}
			// `import()` targets load on demand; a hoisted file's imports are all
			// rewritten to `import()`, so none of them count
			function getDynamicOnlyIds(node) {
				const result = node.transformResult;
				if (!result?.dynamicDeps?.length || getStaticMocks(node)) return;
				const staticDeps = new Set(result.deps);
				const dynamicOnly = new Set(result.dynamicDeps.filter((dep) => !staticDeps.has(dep)));
				if (!dynamicOnly.size) return;
				const ids = /* @__PURE__ */ new Set();
				for (const child of node.importedModules) if (child.id != null && dynamicOnly.has(child.url)) ids.add(child.id);
				return ids;
			}
			async function load(url, importer) {
				try {
					const fetchResult = await fetchModule(url, importer, environment, void 0, void 0, false);
					if ("id" in fetchResult) return moduleGraph.getModuleById(fetchResult.id);
				} catch {}
			}
			async function walkNode(node, skip) {
				const dynamicOnly = getDynamicOnlyIds(node);
				const children = [];
				for (const child of node.importedModules) {
					if (child.id == null || skip.has(child.id) || dynamicOnly?.has(child.id)) continue;
					skip.add(child.id);
					if (child.transformResult) children.push(walkNode(child, skip));
					else children.push(load(child.url, node.id ?? void 0).then((loaded) => loaded && walkNode(loaded, skip)));
				}
				if (children.length) await Promise.all(children);
			}
			async function walkRoot(root) {
				const skip = await resolveMockedIds(root);
				skip.add(root.id);
				await walkNode(root, skip);
			}
			async function loadRoot(url) {
				const root = await load(url, void 0);
				if (root) await walkRoot(root);
			}
			await Promise.all([...files, ...project.config.setupFiles].map(async (file) => {
				const nodes = moduleGraph.getModulesByFile(file);
				if (nodes?.size) await Promise.all(Array.from(nodes, (node) => node.transformResult ? walkRoot(node) : loadRoot(node.url)));
				else await loadRoot(file);
			}));
		},
		async resolve(id, importer, environmentName) {
			const environment = project.vite.environments[environmentName];
			if (!environment) throw new Error(`The environment ${environmentName} was not defined in the Vite config.`);
			const resolved = await environment.pluginContainer.resolveId(id, importer);
			if (!resolved) return null;
			const file = cleanUrl(resolved.id);
			if (resolved.external) return {
				file,
				// this is only used by the module mocker and it always
				// standardizes the id to mock "node:url" and "url" at the same time
				url: isBuiltin$1(resolved.id) ? toBuiltin(resolved.id) : resolved.id,
				id: resolved.id
			};
			return {
				file: cleanUrl(resolved.id),
				url: normalizeResolvedIdToUrl(environment, resolved.id),
				id: resolved.id
			};
		},
		snapshotSaved(snapshot) {
			vitest.snapshot.add(snapshot);
		},
		resolveSnapshotPath(testPath) {
			return vitest.snapshot.resolvePath(testPath, { config: project.serializedConfig });
		},
		async transform(id) {
			const environment = project.vite.environments.__vitest_vm__;
			if (!environment) throw new Error(`The VM environment was not defined in the Vite config. This is a bug in Vitest. Please, open a new issue with reproduction.`);
			const url = normalizeResolvedIdToUrl(environment, fileURLToPath(id));
			return { code: (await environment.transformRequest(url).catch(handleRollupError))?.code };
		},
		async onQueued(file) {
			if (methodsOptions.collect) vitest.state.collectFiles(project, [file]);
			else await vitest._testRun.enqueued(project, file);
		},
		async onCollected(files) {
			if (methodsOptions.collect) vitest.state.collectFiles(project, files);
			else await vitest._testRun.collected(project, files);
		},
		onAfterSuiteRun(meta) {
			vitest.coverageProvider?.onAfterSuiteRun(meta);
		},
		async onTestBenchmark(testId, benchmark) {
			return vitest._testRun.recordBenchmark(testId, benchmark);
		},
		async readBenchmarkResult(relativePath) {
			return project.benchmark.readResult(relativePath);
		},
		async writeBenchmarkResult(relativePath, data) {
			return project.benchmark.writeResult(relativePath, data);
		},
		async onTaskArtifactRecord(testId, artifact) {
			return vitest._testRun.recordArtifact(testId, artifact);
		},
		async onTaskUpdate(packs, events) {
			if (methodsOptions.collect) vitest.state.updateTasks(packs);
			else await vitest._testRun.updated(packs, events);
		},
		async onUserConsoleLog(log) {
			if (methodsOptions.collect) vitest.state.updateUserLog(log);
			else await vitest._testRun.log(log);
		},
		onUnhandledError(err, type) {
			vitest.state.catchError(err, type);
		},
		onAsyncLeaks(leaks) {
			vitest.state.catchLeaks(leaks);
		},
		onCancel(reason) {
			vitest.cancelCurrentRun(reason);
		},
		getCountOfFailedTests() {
			return vitest.state.getCountOfFailedTests();
		},
		ensureModuleGraphEntry(id, importer) {
			const filepath = id.startsWith("file:") ? fileURLToPath(id) : id;
			const importerPath = importer.startsWith("file:") ? fileURLToPath(importer) : importer;
			// environment itself doesn't matter
			const moduleGraph = project.vite.environments.__vitest__?.moduleGraph;
			if (!moduleGraph) {
				// TODO: is it possible?
				console.error("no module graph for", id);
				return;
			}
			const importerNode = moduleGraph.getModuleById(importerPath) || moduleGraph.createFileOnlyEntry(importerPath);
			const moduleNode = moduleGraph.getModuleById(filepath) || moduleGraph.createFileOnlyEntry(filepath);
			if (!moduleGraph.idToModuleMap.has(importerPath)) {
				importerNode.id = importerPath;
				moduleGraph.idToModuleMap.set(importerPath, importerNode);
			}
			if (!moduleGraph.idToModuleMap.has(filepath)) {
				moduleNode.id = filepath;
				moduleGraph.idToModuleMap.set(filepath, moduleNode);
			}
			// this is checked by the "printError" function - TODO: is there a better way?
			moduleNode.transformResult = {
				code: " ",
				map: null
			};
			importerNode.importedModules.add(moduleNode);
			moduleNode.importers.add(importerNode);
		}
	};
}

var RunnerState = /* @__PURE__ */ function(RunnerState) {
	RunnerState["IDLE"] = "idle";
	RunnerState["STARTING"] = "starting";
	RunnerState["STARTED"] = "started";
	RunnerState["START_FAILURE"] = "start_failure";
	RunnerState["STOPPING"] = "stopping";
	RunnerState["STOPPED"] = "stopped";
	return RunnerState;
}(RunnerState || {});
const START_TIMEOUT = 6e4;
const STOP_TIMEOUT = 6e4;
/** @experimental */
class PoolRunner {
	worker;
	/** Exposed to test runner as `VITEST_POOL_ID`. Value is between 1-`maxWorkers`. */
	poolId = void 0;
	project;
	environment;
	_lastTestFiles;
	_state = RunnerState.IDLE;
	_operationLock = null;
	_terminatePromise = createDefer();
	_eventEmitter = new EventEmitter();
	_offCancel;
	_rpc;
	_otel = null;
	_traces;
	get isTerminated() {
		return this._state === RunnerState.STOPPED;
	}
	waitForTerminated() {
		return this._terminatePromise;
	}
	get isStarted() {
		return this._state === RunnerState.STARTED;
	}
	constructor(options, worker) {
		this.worker = worker;
		this.project = options.project;
		this.environment = options.environment;
		const vitest = this.project.vitest;
		this._lastTestFiles = [];
		this._traces = vitest._traces;
		if (this._traces.isEnabled()) {
			const { span: workerSpan, context } = this._traces.startContextSpan("vitest.worker");
			this._otel = {
				span: workerSpan,
				workerContext: context,
				files: []
			};
			this._otel.span.setAttributes({
				"vitest.worker.name": this.worker.name,
				"vitest.project": this.project.name,
				"vitest.environment": this.environment.name
			});
		}
		this._rpc = createBirpc(createMethodsRPC(this.project, {
			collect: options.method === "collect",
			cacheFs: worker.cacheFs
		}), {
			eventNames: ["onCancel"],
			post: (request) => {
				if (this._state !== RunnerState.STOPPING && this._state !== RunnerState.STOPPED) this.postMessage(request);
			},
			on: (callback) => this._eventEmitter.on("rpc", callback),
			timeout: -1
		});
		this._offCancel = vitest.onCancel((reason) => this._rpc.onCancel(reason));
	}
	/**
	* "reconfigure" can only be called if `environment` is different, since different project always
	* requires a new PoolRunner instance.
	*/
	reconfigure(task) {
		this.environment = task.context.environment;
		this._otel?.span.setAttribute("vitest.environment", this.environment.name);
	}
	postMessage(message) {
		// Only send messages when runner is active (not fully stopped)
		// Allow sending during STOPPING state for the 'stop' message itself
		if (this._state !== RunnerState.STOPPED) return this.worker.send(message);
	}
	startTracesSpan(name) {
		const traces = this._traces;
		if (!this._otel) return traces.startSpan(name);
		const { span, context } = traces.startContextSpan(name, this._otel.workerContext);
		this._otel.currentContext = context;
		const end = span.end.bind(span);
		span.end = (endTime) => {
			this._otel.currentContext = void 0;
			return end(endTime);
		};
		return span;
	}
	request(method, context) {
		this._lastTestFiles = context.files.map((f) => f.filepath);
		this._otel?.files.push(...this._lastTestFiles);
		return this.postMessage({
			__vitest_worker_request__: true,
			type: method,
			context,
			otelCarrier: this.getOTELCarrier()
		});
	}
	getOTELCarrier() {
		const activeContext = this._otel?.currentContext || this._otel?.workerContext;
		return activeContext ? this._traces.getContextCarrier(activeContext) : void 0;
	}
	async start(options) {
		// Wait for any ongoing operation to complete
		if (this._operationLock) await this._operationLock;
		if (this._state === RunnerState.STARTED || this._state === RunnerState.STARTING) return;
		if (this._state === RunnerState.STOPPED) throw new Error("[vitest-pool-runner]: Cannot start a stopped runner");
		// Create operation lock to prevent concurrent start/stop
		this._operationLock = createDefer();
		let startSpan;
		const startedAt = performance.now();
		try {
			this._state = RunnerState.STARTING;
			await this._traces.$(`vitest.${this.worker.name}.start`, { context: this._otel?.workerContext }, () => this.worker.start());
			// Attach event listeners AFTER starting worker to avoid issues
			// if worker.start() fails
			this.worker.on("error", this.emitWorkerError);
			this.worker.on("exit", this.emitUnexpectedExit);
			this.worker.on("message", this.emitWorkerMessage);
			startSpan = this.startTracesSpan("vitest.worker.start");
			const startPromise = this.withTimeout(this.waitForStart(), START_TIMEOUT);
			const globalConfig = this.project.vitest.config.experimental.openTelemetry;
			const projectConfig = this.project.config.experimental.openTelemetry;
			const tracesEnabled = projectConfig?.enabled ?? globalConfig?.enabled === true;
			const tracesSdk = projectConfig?.sdkPath ?? globalConfig?.sdkPath;
			this.postMessage({
				type: "start",
				poolId: this.poolId,
				workerId: options.workerId,
				__vitest_worker_request__: true,
				options: { reportMemory: this.worker.reportMemory ?? false },
				context: {
					environment: {
						name: this.environment.name,
						options: this.environment.options
					},
					config: this.project.serializedConfig,
					pool: this.worker.name
				},
				traces: {
					enabled: tracesEnabled,
					sdkPath: tracesSdk,
					otelCarrier: this.getOTELCarrier()
				}
			});
			await startPromise;
			this._state = RunnerState.STARTED;
			// record how long it took to spawn this worker, load its bundle and set up the
			// environment, so the reporter can surface the cost of `isolate: true`
			const { state } = this.project.vitest;
			state.startupTime += performance.now() - startedAt;
			state.workersSpawned += 1;
		} catch (error) {
			this._state = RunnerState.START_FAILURE;
			startSpan?.recordException(error);
			throw error;
		} finally {
			startSpan?.end();
			this._operationLock.resolve();
			this._operationLock = null;
		}
	}
	async stop(options) {
		// Wait for any ongoing operation to complete
		if (this._operationLock) await this._operationLock;
		if (this._state === RunnerState.STOPPED || this._state === RunnerState.STOPPING) return;
		this._otel?.span.setAttribute("vitest.worker.files", this._otel.files);
		if (this._state === RunnerState.IDLE) {
			this._otel?.span.end();
			this._state = RunnerState.STOPPED;
			return;
		}
		// Create operation lock to prevent concurrent start/stop
		this._operationLock = createDefer();
		try {
			this._state = RunnerState.STOPPING;
			// Remove exit and error listeners early to avoid "unexpected exit" and
			// channel teardown errors during shutdown
			this.worker.off("exit", this.emitUnexpectedExit);
			this.worker.off("error", this.emitWorkerError);
			const stopSpan = this.startTracesSpan("vitest.worker.stop");
			await this.withTimeout(new Promise((resolve) => {
				const onStop = (response) => {
					if (response.type === "stopped") {
						if (response.error) {
							stopSpan.recordException(response.error);
							this.project.vitest.state.catchError(response.error, "Teardown Error");
						}
						resolve();
						this.off("message", onStop);
					}
				};
				// Don't wait for graceful exit's response when force exiting
				if (options?.force) return onStop({
					type: "stopped",
					__vitest_worker_response__: true
				});
				this.on("message", onStop);
				this.postMessage({
					type: "stop",
					__vitest_worker_request__: true,
					otelCarrier: this.getOTELCarrier()
				});
			}), STOP_TIMEOUT).finally(() => {
				stopSpan.end();
			});
			this._eventEmitter.removeAllListeners();
			this._offCancel();
			this._rpc.$close(/* @__PURE__ */ new Error("[vitest-pool-runner]: Pending methods while closing rpc"));
			// Stop the worker process (this sets _fork/_thread to undefined)
			// Worker's event listeners (error, message) are implicitly removed when worker terminates
			await this._traces.$(`vitest.${this.worker.name}.stop`, { context: this._otel?.workerContext }, () => this.worker.stop());
			this._state = RunnerState.STOPPED;
		} catch (error) {
			// Ensure we transition to stopped state even on error
			this._state = RunnerState.STOPPED;
			throw error;
		} finally {
			this._lastTestFiles = [];
			this._operationLock.resolve();
			this._operationLock = null;
			this._otel?.span.end();
			this._terminatePromise.resolve();
		}
	}
	on(event, callback) {
		this._eventEmitter.on(event, callback);
	}
	off(event, callback) {
		this._eventEmitter.off(event, callback);
	}
	emitWorkerError = (maybeError) => {
		const error = maybeError instanceof Error ? maybeError : new Error(String(maybeError));
		this._eventEmitter.emit("error", error);
	};
	emitWorkerMessage = (response) => {
		try {
			const message = this.worker.deserialize(response);
			if (typeof message === "object" && message != null && message.__vitest_worker_response__) this._eventEmitter.emit("message", message);
			else this._eventEmitter.emit("rpc", message);
		} catch (error) {
			this._eventEmitter.emit("error", error);
		}
	};
	emitUnexpectedExit = (code, signal) => {
		const hasCode = typeof code === "number";
		const errorDetails = hasCode || signal ? `with ${hasCode ? `exit code ${code} ` : ""}${signal ? `signal ${signal} ` : ""}` : "";
		const testFileDetails = this._lastTestFiles.length ? ` while running test file${this._lastTestFiles.length === 1 ? "" : "s"} ${this._lastTestFiles.join(", ")}` : "";
		const error = /* @__PURE__ */ new Error(`Worker exited unexpectedly ${errorDetails}during ${this._state} state${testFileDetails}`);
		this._state = RunnerState.STOPPED;
		this._eventEmitter.emit("error", error);
	};
	waitForStart() {
		return new Promise((resolve, reject) => {
			const cleanup = () => {
				this.off("message", onStart);
				this.off("error", onError);
			};
			function onStart(message) {
				if (message.type === "started") {
					cleanup();
					if (message.error) reject(message.error);
					else resolve();
				}
			}
			// The worker can die before it ever reports back (e.g. an invalid
			// `execArgv` makes Node exit immediately). Reject as soon as that
			// happens instead of waiting for the start timeout to elapse.
			function onError(error) {
				cleanup();
				reject(error);
			}
			this.on("message", onStart);
			this.on("error", onError);
		});
	}
	withTimeout(promise, timeout) {
		return new Promise((resolve_, reject_) => {
			const timer = setTimeout(() => reject(/* @__PURE__ */ new Error("[vitest-pool-runner]: Timeout waiting for worker to respond")), timeout);
			function resolve(value) {
				clearTimeout(timer);
				resolve_(value);
			}
			function reject(error) {
				clearTimeout(timer);
				reject_(error);
			}
			promise.then(resolve, reject);
		});
	}
}

// After a worker dies, its remaining stdio is drained into the parent-side
// readables asynchronously. Waiting for `end`/`close` before unpiping ensures
// the tail of the output still reaches the shared logger streams.
function streamFlushed(stream) {
	if (stream.readableEnded || stream.destroyed) return Promise.resolve();
	return new Promise((resolve) => {
		stream.once("end", resolve);
		stream.once("close", resolve);
	});
}

const SIGKILL_TIMEOUT = 500;
// how long a failed pipe write may wait for the process's 'exit' event
// before it is reported as the worker error itself
const PIPE_ERROR_EXIT_GRACE = 1e3;
/** @experimental */
class ForksPoolWorker {
	name = "forks";
	cacheFs = true;
	entrypoint;
	execArgv;
	env;
	_fork;
	stdout;
	stderr;
	_errorEmitter = new EventEmitter();
	_pipeErrorTimer;
	constructor(options) {
		this.execArgv = options.execArgv;
		this.env = options.env;
		this.stdout = options.project.vitest.logger.outputStream;
		this.stderr = options.project.vitest.logger.errorStream;
		/** Loads {@link file://./../../../runtime/workers/forks.ts} */
		this.entrypoint = resolve$1(options.distPath, "workers/forks.js");
	}
	on(event, callback) {
		if (event === "error") this._errorEmitter.on("error", callback);
		else this.fork.on(event, callback);
	}
	off(event, callback) {
		if (event === "error") this._errorEmitter.off("error", callback);
		else this.fork.off(event, callback);
	}
	send(message) {
		this.fork.send(message);
	}
	async start() {
		this._fork ||= fork(this.entrypoint, [], {
			env: this.env,
			execArgv: this.execArgv,
			stdio: "pipe",
			serialization: "advanced"
		});
		this._fork.on("error", this.emitError);
		// `end: false`: the logger streams are shared by every worker, so one
		// ending worker stream must not end them for everyone else
		if (this._fork.stdout) {
			this.stdout.setMaxListeners(1 + this.stdout.getMaxListeners());
			this._fork.stdout.pipe(this.stdout, { end: false });
		}
		if (this._fork.stderr) {
			this.stderr.setMaxListeners(1 + this.stderr.getMaxListeners());
			this._fork.stderr.pipe(this.stderr, { end: false });
		}
	}
	async stop() {
		const fork = this.fork;
		const waitForExit = new Promise((resolve) => {
			if (fork.exitCode != null) resolve();
			else fork.once("exit", resolve);
		});
		/*
		* If process running user's code does not stop on SIGTERM, send SIGKILL.
		* This is similar to
		* - https://github.com/jestjs/jest/blob/25a8785584c9d54a05887001ee7f498d489a5441/packages/jest-worker/src/workers/ChildProcessWorker.ts#L463-L477
		* - https://github.com/tinylibs/tinypool/blob/40b4b3eb926dabfbfd3d0a7e3d1222d4dd1c0d2d/src/runtime/process-worker.ts#L56
		*/
		const sigkillTimeout = setTimeout(() => fork.kill("SIGKILL"), SIGKILL_TIMEOUT);
		fork.kill();
		await waitForExit;
		clearTimeout(sigkillTimeout);
		if (fork.stdout) {
			await streamFlushed(fork.stdout);
			fork.stdout.unpipe(this.stdout);
			this.stdout.setMaxListeners(this.stdout.getMaxListeners() - 1);
		}
		if (fork.stderr) {
			await streamFlushed(fork.stderr);
			fork.stderr.unpipe(this.stderr);
			this.stderr.setMaxListeners(this.stderr.getMaxListeners() - 1);
		}
		this._fork = void 0;
	}
	deserialize(data) {
		return data;
	}
	emitError = (error) => {
		// A write into a dying child process fails with EPIPE (or a closed IPC
		// channel) and can be observed before the process's 'exit' event,
		// especially on macOS. The exit event knows the exit code, the signal and
		// the affected test files, so hold the write error and let the 'exit'
		// listeners report instead. The timer covers a broken channel whose
		// process never exits; a process that exited while the error was held was
		// already reported through the exit event, and a process whose listeners
		// were detached is being shut down deliberately — drop the error in both
		// cases.
		const code = error.code;
		if (code === "EPIPE" || code === "ERR_IPC_CHANNEL_CLOSED") {
			if (this._pipeErrorTimer) return;
			this._pipeErrorTimer = setTimeout(() => {
				this._pipeErrorTimer = void 0;
				const fork = this._fork;
				if (fork && fork.exitCode == null && fork.signalCode == null && this._errorEmitter.listenerCount("error")) this._errorEmitter.emit("error", error);
			}, PIPE_ERROR_EXIT_GRACE);
			this._pipeErrorTimer.unref();
			return;
		}
		this._errorEmitter.emit("error", error);
	};
	get fork() {
		if (!this._fork) throw new Error(`The child process was torn down or never initialized. This is a bug in Vitest.`);
		return this._fork;
	}
}

/** @experimental */
class ThreadsPoolWorker {
	name = "threads";
	entrypoint;
	execArgv;
	env;
	_thread;
	stdout;
	stderr;
	constructor(options) {
		this.execArgv = options.execArgv;
		this.env = options.env;
		this.stdout = options.project.vitest.logger.outputStream;
		this.stderr = options.project.vitest.logger.errorStream;
		/** Loads {@link file://./../../../runtime/workers/threads.ts} */
		this.entrypoint = resolve$1(options.distPath, "workers/threads.js");
	}
	on(event, callback) {
		this.thread.on(event, callback);
	}
	off(event, callback) {
		this.thread.off(event, callback);
	}
	send(message) {
		this.thread.postMessage(message);
	}
	async start() {
		// This can be called multiple times if the runtime is shared.
		this._thread ||= new Worker(this.entrypoint, {
			env: this.env,
			execArgv: this.execArgv,
			stdout: true,
			stderr: true
		});
		// `end: false`: the logger streams are shared by every worker, so one
		// ending worker stream must not end them for everyone else
		this.stdout.setMaxListeners(1 + this.stdout.getMaxListeners());
		this._thread.stdout.pipe(this.stdout, { end: false });
		this.stderr.setMaxListeners(1 + this.stderr.getMaxListeners());
		this._thread.stderr.pipe(this.stderr, { end: false });
	}
	async stop() {
		const thread = this.thread;
		// `terminate()` makes node drain the stdio still queued on the worker's
		// message port into these readables; keep the pipes attached until the
		// streams end so late output still reaches the logger streams
		const flushed = Promise.all([streamFlushed(thread.stdout), streamFlushed(thread.stderr)]);
		await thread.terminate();
		await flushed;
		thread.stdout.unpipe(this.stdout);
		this.stdout.setMaxListeners(this.stdout.getMaxListeners() - 1);
		thread.stderr.unpipe(this.stderr);
		this.stderr.setMaxListeners(this.stderr.getMaxListeners() - 1);
		this._thread = void 0;
	}
	deserialize(data) {
		return data;
	}
	get thread() {
		if (!this._thread) throw new Error(`The worker thread was torn down or never initialized. This is a bug in Vitest.`);
		return this._thread;
	}
}

/** @experimental */
class TypecheckPoolWorker {
	name = "typecheck";
	project;
	_eventEmitter = new EventEmitter$1();
	constructor(options) {
		this.project = options.project;
	}
	async start() {
		// noop, onMessage handles it
	}
	async stop() {
		// noop, onMessage handles it
	}
	canReuse() {
		return true;
	}
	send(message) {
		onMessage(message, this.project).then((response) => {
			if (response) this._eventEmitter.emit("message", response);
		});
	}
	on(event, callback) {
		this._eventEmitter.on(event, callback);
	}
	off(event, callback) {
		this._eventEmitter.off(event, callback);
	}
	deserialize(data) {
		return data;
	}
}
const __vitest_worker_response__ = true;
const runners = /* @__PURE__ */ new WeakMap();
async function onMessage(message, project) {
	if (message?.__vitest_worker_request__ !== true) return;
	let runner = runners.get(project.vitest);
	if (!runner) {
		runner = createRunner(project.vitest);
		runners.set(project.vitest, runner);
	}
	let runPromise;
	switch (message.type) {
		case "start": return {
			type: "started",
			__vitest_worker_response__
		};
		case "run":
			runPromise = runner.runTests(message.context.files, project).catch((error) => error);
			return {
				type: "testfileFinished",
				error: await runPromise,
				__vitest_worker_response__
			};
		case "collect":
			runPromise = runner.collectTests(message.context.files, project).catch((error) => error);
			return {
				type: "testfileFinished",
				error: await runPromise,
				__vitest_worker_response__
			};
		case "stop":
			await runPromise;
			return {
				type: "stopped",
				__vitest_worker_response__
			};
	}
	throw new Error(`Unexpected message ${JSON.stringify(message, null, 2)}`);
}
function createRunner(vitest) {
	const promisesMap = /* @__PURE__ */ new WeakMap();
	const rerunTriggered = /* @__PURE__ */ new WeakSet();
	async function onParseEnd(project, { files, sourceErrors }) {
		const checker = project.typechecker;
		const { packs, events } = checker.getTestPacksAndEvents();
		await vitest._testRun.updated(packs, events);
		if (!project.config.typecheck.ignoreSourceErrors) sourceErrors.forEach((error) => vitest.state.catchError(error, "Unhandled Source Error"));
		// The typechecker child process (tsc/vue-tsc) can terminate without producing
		// a complete set of diagnostics: a non-zero exit code, or being killed by a
		// signal (e.g. SIGABRT from an out-of-memory abort, which surfaces as exit
		// 134). We must not report the run as passing in that case, otherwise real
		// type errors slip through as a false green.
		if (!hasFailed(files) && !sourceErrors.length) {
			const exitCode = checker.getExitCode();
			const signal = checker.getSignal();
			if (exitCode || signal) {
				const output = checker.getOutput();
				const looksLikeOom = signal === "SIGABRT" || OOM_OUTPUT_PATTERN.test(output);
				let message;
				if (signal || looksLikeOom) {
					const reason = signal ? `was terminated by signal ${signal}` : `exited with code ${exitCode}`;
					message = `The ${checker.getChecker()} process ${reason} before type checking finished.`;
					if (looksLikeOom) message += " This usually means it ran out of memory — try increasing the limit with NODE_OPTIONS=--max-old-space-size.";
					if (output) message += `\n\n${output}`;
				} else
 // a plain non-zero exit with diagnostics we couldn't attribute to a
				// file (e.g. a tsconfig error) — surface the checker output as-is
				message = output;
				const error = new Error(message);
				error.stack = "";
				vitest.state.catchError(error, "Typecheck Error");
			}
		}
		promisesMap.get(project)?.resolve();
		rerunTriggered.delete(project);
		// triggered by TSC watcher, not Vitest watcher, so we need to emulate what Vitest does in this case
		if (vitest.config.watch && !vitest.runningPromise) {
			const modules = files.map((file) => vitest.state.getReportedEntity(file)).filter((e) => e?.type === "module");
			const state = vitest.isCancelling ? "interrupted" : modules.some((m) => !m.ok()) ? "failed" : "passed";
			await vitest.report("onTestRunEnd", modules, [], state);
			await vitest.report("onWatcherStart", files, [...project.config.typecheck.ignoreSourceErrors ? [] : sourceErrors, ...vitest.state.getUnhandledErrors()]);
		}
	}
	async function createWorkspaceTypechecker(project, files) {
		const checker = project.typechecker ?? new Typechecker(project);
		if (project.typechecker) return checker;
		project.typechecker = checker;
		checker.setFiles(files);
		checker.onParseStart(async () => {
			const files = checker.getTestFiles();
			for (const file of files) await vitest._testRun.enqueued(project, file);
			await vitest._testRun.collected(project, files);
		});
		checker.onParseEnd((result) => onParseEnd(project, result));
		checker.onWatcherRerun(async () => {
			rerunTriggered.add(project);
			if (!vitest.runningPromise) {
				vitest.state.clearErrors();
				await vitest.report("onWatcherRerun", files, "File change detected. Triggering rerun.");
			}
			await checker.collectTests();
			const testFiles = checker.getTestFiles();
			for (const file of testFiles) await vitest._testRun.enqueued(project, file);
			await vitest._testRun.collected(project, testFiles);
			const { packs, events } = checker.getTestPacksAndEvents();
			await vitest._testRun.updated(packs, events);
		});
		return checker;
	}
	async function startTypechecker(project, files) {
		if (project.typechecker) return;
		const checker = await createWorkspaceTypechecker(project, files);
		await checker.collectTests();
		await checker.start();
	}
	async function collectTests(specs, project) {
		const files = specs.map((spec) => spec.filepath);
		const checker = await createWorkspaceTypechecker(project, files);
		checker.setFiles(files);
		await checker.collectTests();
		const testFiles = checker.getTestFiles();
		vitest.state.collectFiles(project, testFiles);
	}
	async function runTests(specs, project) {
		const promises = [];
		const files = specs.map((spec) => spec.filepath);
		const promise = createDefer();
		// check that watcher actually triggered rerun
		const triggered = await new Promise((resolve) => {
			const _i = setInterval(() => {
				if (!project.typechecker || rerunTriggered.has(project)) {
					resolve(true);
					clearInterval(_i);
				}
			});
			setTimeout(() => {
				resolve(false);
				clearInterval(_i);
			}, 500).unref();
		});
		// Re-run but wasn't triggered by tsc
		if (promisesMap.has(project) && !triggered) return promisesMap.get(project);
		if (project.typechecker && !triggered) {
			const testFiles = project.typechecker.getTestFiles();
			for (const file of testFiles) await vitest._testRun.enqueued(project, file);
			await vitest._testRun.collected(project, testFiles);
			await onParseEnd(project, project.typechecker.getResult());
		}
		promises.push(promise);
		promisesMap.set(project, promise);
		promises.push(startTypechecker(project, files));
		await Promise.all(promises);
	}
	return {
		runTests,
		collectTests
	};
}

/** @experimental */
class VmForksPoolWorker extends ForksPoolWorker {
	name = "vmForks";
	reportMemory = true;
	entrypoint;
	constructor(options) {
		super({
			...options,
			execArgv: [...options.execArgv, "--experimental-vm-modules"]
		});
		/** Loads {@link file://./../../../runtime/workers/vmForks.ts} */
		this.entrypoint = resolve$1(options.distPath, "workers/vmForks.js");
	}
	canReuse() {
		return true;
	}
}

/** @experimental */
class VmThreadsPoolWorker extends ThreadsPoolWorker {
	name = "vmThreads";
	reportMemory = true;
	entrypoint;
	constructor(options) {
		super({
			...options,
			execArgv: [...options.execArgv, "--experimental-vm-modules"]
		});
		/** Loads {@link file://./../../../runtime/workers/vmThreads.ts} */
		this.entrypoint = resolve$1(options.distPath, "workers/vmThreads.js");
	}
	canReuse() {
		return true;
	}
}

const WORKER_START_TIMEOUT = 9e4;
class Pool {
	options;
	logger;
	maxWorkers = 0;
	workerIds = /* @__PURE__ */ new Map();
	queue = [];
	activeTasks = [];
	sharedRunners = [];
	exitPromises = [];
	_isCancelling = false;
	constructor(options, logger) {
		this.options = options;
		this.logger = logger;
	}
	setMaxWorkers(maxWorkers) {
		this.maxWorkers = maxWorkers;
		this.workerIds = new Map(Array.from({ length: maxWorkers }).fill(0).map((_, i) => [i + 1, true]));
	}
	async run(task, method) {
		// Prevent new tasks from being queued during cancellation
		if (this._isCancelling) throw new Error("[vitest-pool]: Cannot run tasks while pool is cancelling");
		// Every runner related failure should make this promise reject so that it's picked by pool.
		// This resolver is used to make the error handling in recursive queue easier.
		const testFinish = withResolvers();
		this.queue.push({
			task,
			resolver: testFinish,
			method
		});
		this.schedule();
		await testFinish.promise;
	}
	async schedule() {
		if (this.queue.length === 0 || this.activeTasks.length >= this.maxWorkers) return;
		const { task, resolver, method } = this.queue.shift();
		try {
			let isMemoryLimitReached = false;
			const runner = this.getPoolRunner(task, method);
			const poolId = runner.poolId ?? this.getConcurrencyId();
			runner.poolId = poolId;
			const activeTask = {
				task,
				resolver,
				method,
				cancelTask
			};
			this.activeTasks.push(activeTask);
			// active tasks receive cancel signal and shut down gracefully
			async function cancelTask(options) {
				if (options?.force) await runner.stop({ force: true });
				await runner.waitForTerminated();
				resolver.reject(/* @__PURE__ */ new Error("Cancelled"));
			}
			const onFinished = (message) => {
				if (message?.__vitest_worker_response__ && message.type === "testfileFinished") {
					if (task.memoryLimit && message.usedMemory) isMemoryLimitReached = message.usedMemory >= task.memoryLimit;
					if (message.error) this.options.state.catchError(message.error, "Test Run Error");
					runner.off("message", onFinished);
					runner.off("error", onTaskError);
					resolver.resolve();
				}
			};
			function onTaskError(error) {
				runner.off("message", onFinished);
				runner.off("error", onTaskError);
				resolver.reject(new Error(`[vitest-pool]: Worker ${task.worker} emitted error.`, { cause: error }));
			}
			runner.on("message", onFinished);
			runner.on("error", onTaskError);
			if (!runner.isStarted) {
				const id = setTimeout(() => resolver.reject(/* @__PURE__ */ new Error(`[vitest-pool]: Timeout starting ${task.worker} runner.`)), WORKER_START_TIMEOUT);
				await runner.start({ workerId: task.context.workerId }).catch((error) => resolver.reject(new Error(`[vitest-pool]: Failed to start ${task.worker} worker for test files ${formatFiles(task)}.`, { cause: error }))).finally(() => clearTimeout(id));
			}
			let span;
			if (!resolver.isRejected) {
				span = runner.startTracesSpan(`vitest.worker.${method}`);
				// Start running the test in the worker
				runner.request(method, task.context);
			}
			await resolver.promise.catch((error) => span?.recordException(error)).finally(() => span?.end());
			const index = this.activeTasks.indexOf(activeTask);
			if (index !== -1) this.activeTasks.splice(index, 1);
			if (!task.isolate && !runner.isTerminated && !isMemoryLimitReached && this.queue[0]?.task.isolate === false && isEqualRunner(runner, this.queue[0].task)) {
				this.sharedRunners.push(runner);
				return this.schedule();
			}
			// Runner terminations are started but not awaited until the end of full run.
			// Runner termination can also already start from task cancellation.
			if (!runner.isTerminated) {
				const id = setTimeout(() => this.logger.error(`[vitest-pool]: Timeout terminating ${task.worker} worker for test files ${formatFiles(task)}.`), this.options.teardownTimeout);
				this.exitPromises.push(runner.stop({ force: resolver.isRejected }).then(() => clearTimeout(id)).catch((error) => this.logger.error(`[vitest-pool]: Failed to terminate ${task.worker} worker for test files ${formatFiles(task)}.`, error)));
			}
			this.freeWorkerId(poolId);
		} 
		// This is mostly to avoid zombie workers when/if Vitest internals run into errors
catch (error) {
			return resolver.reject(error);
		}
		return this.schedule();
	}
	async cancel() {
		// Force exit if previous cancel is still on-going
		// for example when user does 'CTRL+c' twice in row
		const force = this._isCancelling;
		// Set flag to prevent new tasks from being queued
		this._isCancelling = true;
		const pendingTasks = this.queue.splice(0);
		if (pendingTasks.length) {
			const error = /* @__PURE__ */ new Error("Cancelled");
			pendingTasks.forEach((task) => task.resolver.reject(error));
		}
		await Promise.all(this.activeTasks.map((task) => task.cancelTask({ force })));
		this.activeTasks = [];
		await Promise.all(this.sharedRunners.map((runner) => runner.stop()));
		this.sharedRunners = [];
		await Promise.all(this.exitPromises);
		this.exitPromises = [];
		this.workerIds.forEach((_, id) => this.freeWorkerId(id));
		// Reset flag after cancellation completes
		this._isCancelling = false;
	}
	async close() {
		await this.cancel();
	}
	getPoolRunner(task, method) {
		if (task.isolate === false) {
			const index = this.sharedRunners.findIndex((runner) => isEqualRunner(runner, task));
			if (index !== -1) {
				const runner = this.sharedRunners.splice(index, 1)[0];
				runner.reconfigure(task);
				return runner;
			}
		}
		const options = {
			distPath: this.options.distPath,
			project: task.project,
			method,
			environment: task.context.environment,
			env: task.env,
			execArgv: task.execArgv
		};
		switch (task.worker) {
			case "forks": return new PoolRunner(options, new ForksPoolWorker(options));
			case "vmForks": return new PoolRunner(options, new VmForksPoolWorker(options));
			case "threads": return new PoolRunner(options, new ThreadsPoolWorker(options));
			case "vmThreads": return new PoolRunner(options, new VmThreadsPoolWorker(options));
			case "typescript": return new PoolRunner(options, new TypecheckPoolWorker(options));
		}
		const customPool = task.project.config.poolRunner;
		if (customPool != null && customPool.name === task.worker) return new PoolRunner(options, customPool.createPoolWorker(options));
		throw new Error(`Runner ${task.worker} is not supported. Test files: ${formatFiles(task)}.`);
	}
	getConcurrencyId() {
		let concurrencyId;
		this.workerIds.forEach((state, id) => {
			if (state && concurrencyId == null) {
				concurrencyId = id;
				this.workerIds.set(id, false);
			}
		});
		if (concurrencyId == null) throw new Error("Cannot set concurrency id because there are no valid free ids.");
		return concurrencyId;
	}
	freeWorkerId(id) {
		this.workerIds.set(id, true);
	}
}
function withResolvers() {
	let resolve = () => {};
	let reject = (_error) => {};
	const resolver = {
		promise: new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		}),
		resolve,
		reject: (reason) => {
			resolver.isRejected = true;
			reject(reason);
		},
		isRejected: false
	};
	return resolver;
}
function formatFiles(task) {
	return task.context.files.map((file) => file.filepath).join(", ");
}
function isEqualRunner(runner, task) {
	if (task.isolate) throw new Error("Isolated tasks should not share runners");
	if (runner.worker.name !== task.worker || runner.project !== task.project) return false;
	// by default, check that the environments are the same
	// some workers (like vmThreads/vmForks) do not need this check
	if (!runner.worker.canReuse) return isEnvironmentEqual(task.context.environment, runner.environment);
	return runner.worker.canReuse(task);
}
function isEnvironmentEqual(env1, env2) {
	if (env1.name !== env2.name) return false;
	return deepEqual$1(env1.options, env2.options);
}
function deepEqual$1(obj1, obj2) {
	if (obj1 === obj2) return true;
	if (obj1 == null || obj2 == null) return obj1 === obj2;
	if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;
	const keys1 = Object.keys(obj1);
	const keys2 = Object.keys(obj2);
	if (keys1.length !== keys2.length) return false;
	for (const key of keys1) if (!Object.hasOwn(obj2, key) || !deepEqual$1(obj1[key], obj2[key])) return false;
	return true;
}

const suppressWarningsPath = resolve(rootDir, "./suppress-warnings.cjs");
function getFilePoolName(project) {
	if (project.config.browser.enabled) return "browser";
	return project.config.pool;
}
function createPool(ctx) {
	const pool = new Pool({
		distPath: ctx.distPath,
		teardownTimeout: ctx.config.teardownTimeout,
		state: ctx.state
	}, ctx.logger);
	const options = resolveOptions(ctx);
	const Sequencer = ctx.config.sequence.sequencer;
	const sequencer = new Sequencer(ctx);
	let browserPool;
	async function executeTests(method, specs, invalidates) {
		ctx.onCancel(() => pool.cancel());
		if (ctx.config.shard) {
			if (!ctx.config.passWithNoTests && ctx.config.shard.count > specs.length) throw new Error(`--shard <count> must be a smaller than count of test files. Resolved ${specs.length} test files for --shard=${ctx.config.shard.index}/${ctx.config.shard.count}.`);
			specs = await sequencer.shard(Array.from(specs));
		}
		const taskGroups = [];
		let workerId = 1;
		const sorted = await sequencer.sort(specs);
		const { environments, tags } = await getSpecificationsOptions(specs);
		const groups = groupSpecs(sorted, environments);
		const projectEnvs = /* @__PURE__ */ new WeakMap();
		const projectExecArgvs = /* @__PURE__ */ new WeakMap();
		for (const group of groups) {
			if (!group) continue;
			const taskGroup = [];
			const browserSpecs = [];
			taskGroups.push({
				tasks: taskGroup,
				maxWorkers: group.maxWorkers,
				browserSpecs
			});
			for (const specs of group.specs) {
				const { project, pool } = specs[0];
				if (pool === "browser") {
					browserSpecs.push(...specs);
					continue;
				}
				const environment = environments.get(specs[0]);
				if (!environment) throw new Error(`Cannot find the environment. This is a bug in Vitest.`);
				let env = projectEnvs.get(project);
				if (!env) {
					env = {
						...process$1.env,
						...options.env,
						...ctx.config.env,
						...project.config.env
					};
					// V8 serializes compile-cached scripts without the source positions
					// that precise coverage relies on, so the compile cache must stay off
					// for the v8 provider (and custom providers, whose mechanism we can't
					// assume) in workers and any process they spawn. istanbul instruments
					// the source at transform time, so the cache is harmless there and the
					// boot speedup is kept.
					if (ctx.config.coverage.enabled && ctx.config.coverage.provider !== "istanbul") {
						delete env.NODE_COMPILE_CACHE;
						env.NODE_DISABLE_COMPILE_CACHE = "1";
					}
					// env are case-insensitive on Windows, but spawned processes don't support it
					if (isWindows) for (const name in env) env[name.toUpperCase()] = env[name];
					projectEnvs.set(project, env);
				}
				let execArgv = projectExecArgvs.get(project);
				if (!execArgv) {
					const conditions = resolveConditions(project);
					execArgv = [
						...options.execArgv,
						...conditions,
						...project.config.execArgv
					];
					projectExecArgvs.set(project, execArgv);
				}
				taskGroup.push({
					context: {
						files: specs.map((spec) => ({
							filepath: spec.moduleId,
							fileTags: tags.get(spec),
							testLocations: spec.testLines,
							testNamePattern: spec.testNamePattern,
							testIds: spec.testIds,
							testTagsFilter: spec.testTagsFilter
						})),
						invalidates,
						providedContext: project.getProvidedContext(),
						workerId: workerId++,
						environment
					},
					project,
					env,
					execArgv,
					worker: pool,
					isolate: project.config.isolate,
					memoryLimit: getMemoryLimit(ctx.config, pool) ?? null
				});
			}
		}
		const results = [];
		for (const { tasks, browserSpecs, maxWorkers } of taskGroups) {
			pool.setMaxWorkers(maxWorkers);
			const promises = tasks.map(async (task) => {
				if (ctx.isCancelling) return ctx.state.cancelFiles(task.context.files, task.project);
				try {
					await pool.run(task, method);
				} catch (error) {
					// Intentionally cancelled
					if (ctx.isCancelling && error instanceof Error && error.message === "Cancelled") ctx.state.cancelFiles(task.context.files, task.project);
					else throw error;
				}
			});
			if (browserSpecs.length) {
				browserPool ??= createBrowserPool(ctx);
				if (method === "collect") promises.push(browserPool.collectTests(browserSpecs));
				else promises.push(browserPool.runTests(browserSpecs));
			}
			const groupResults = await Promise.allSettled(promises);
			results.push(...groupResults);
		}
		const errors = results.filter((result) => result.status === "rejected").map((result) => result.reason);
		if (errors.length > 0) throw new AggregateError(errors, "Errors occurred while running tests. For more information, see serialized error.");
	}
	return {
		name: "default",
		runTests: (files, invalidates) => executeTests("run", files, invalidates),
		collectTests: (files, invalidates) => executeTests("collect", files, invalidates),
		async close() {
			await Promise.all([
				pool.close(),
				browserPool?.close?.(),
				...ctx.projects.map((project) => project.typechecker?.stop())
			]);
		}
	};
}
function resolveOptions(ctx) {
	return {
		execArgv: [
			...process$1.execArgv.filter((execArg) => execArg.startsWith("--cpu-prof") || execArg.startsWith("--heap-prof") || execArg.startsWith("--diagnostic-dir")),
			"--experimental-import-meta-resolve",
			...globalThis.Deno || process$1.versions.pnp ? [] : ["--require", suppressWarningsPath]
		],
		env: {
			TEST: "true",
			VITEST: "true",
			NODE_ENV: process$1.env.NODE_ENV || "test",
			VITEST_MODE: ctx.config.watch ? "WATCH" : "RUN",
			FORCE_TTY: isatty(1) ? "true" : ""
		}
	};
}
function resolveConditions(project) {
	// in addition to resolve.conditions Vite also adds production/development,
	// see: https://github.com/vitejs/vite/blob/af2aa09575229462635b7cbb6d248ca853057ba2/packages/vite/src/node/plugins/resolve.ts#L1056-L1080
	const viteMajor = Number(version.split(".")[0]);
	const viteConfig = project.vite.config;
	return [...new Set(viteMajor >= 6 ? viteConfig.ssr.resolve?.conditions ?? [] : [
		"production",
		"development",
		...viteConfig.resolve.conditions ?? []
	])].filter((condition) => {
		if (condition === "production") return viteConfig.isProduction;
		if (condition === "development") return !viteConfig.isProduction;
		return true;
	}).map((condition) => {
		if (viteMajor >= 6 && condition === "development|production") return viteConfig.isProduction ? "production" : "development";
		return condition;
	}).flatMap((c) => ["--conditions", c]);
}
function resolveMaxWorkers(project) {
	if (project.config.maxWorkers) return project.config.maxWorkers;
	if (project.vitest.config.maxWorkers) return project.vitest.config.maxWorkers;
	const numCpus = typeof os.availableParallelism === "function" ? os.availableParallelism() : os.cpus().length;
	if (project.vitest.config.watch) return Math.max(Math.floor(numCpus / 2), 1);
	return Math.max(numCpus - 1, 1);
}
function getMemoryLimit(config, pool) {
	if (pool !== "vmForks" && pool !== "vmThreads") return null;
	const memory = process$1.constrainedMemory?.() || os.totalmem();
	const limit = getWorkerMemoryLimit(config);
	if (typeof memory === "number") return stringToBytes(limit, config.watch ? memory / 2 : memory);
	// If totalmem is not supported we cannot resolve percentage based values like 0.5, "50%"
	if (typeof limit === "number" && limit > 1 || typeof limit === "string" && limit.at(-1) !== "%") return stringToBytes(limit);
	// just ignore "memoryLimit" value because we cannot detect memory limit
	return null;
}
function groupSpecs(specs, environments) {
	const groups = [];
	// Files without file parallelism but without explicit sequence.groupOrder
	const sequential = {
		specs: [],
		maxWorkers: 1
	};
	// Type tests are run in a single group, per project
	const typechecks = {};
	const serializedEnvironmentOptions = /* @__PURE__ */ new Map();
	function getSerializedOptions(env) {
		const options = serializedEnvironmentOptions.get(env);
		if (options) return options;
		const serialized = JSON.stringify(env.options);
		serializedEnvironmentOptions.set(env, serialized);
		return serialized;
	}
	function isEqualEnvironments(a, b) {
		const aEnv = environments.get(a);
		const bEnv = environments.get(b);
		if (!aEnv && !bEnv) return true;
		if (!aEnv || !bEnv || aEnv.name !== bEnv.name) return false;
		if (!aEnv.options && !bEnv.options) return true;
		if (!aEnv.options || !bEnv.options) return false;
		return getSerializedOptions(aEnv) === getSerializedOptions(bEnv);
	}
	specs.forEach((spec) => {
		if (spec.pool === "typescript") {
			typechecks[spec.project.name] ||= [];
			typechecks[spec.project.name].push(spec);
			return;
		}
		const order = spec.project.config.sequence.groupOrder;
		const isolate = spec.project.config.isolate;
		// Files that have disabled parallelism and default groupOrder are set into their own group
		if (isolate === true && order === 0 && spec.project.config.maxWorkers === 1) return sequential.specs.push([spec]);
		const maxWorkers = resolveMaxWorkers(spec.project);
		groups[order] ||= {
			specs: [],
			maxWorkers
		};
		// Multiple projects with different maxWorkers but same groupOrder
		if (groups[order].maxWorkers !== maxWorkers) {
			const last = groups[order].specs.at(-1)?.at(-1)?.project.name;
			throw new Error(`Projects "${last}" and "${spec.project.name}" have different 'maxWorkers' but same 'sequence.groupOrder'.\nProvide unique 'sequence.groupOrder' for them.`);
		}
		// Non-isolated single worker can receive all files at once.
		// vm pools are excluded: their `isolate: false` comes from config
		// resolution rather than the user, because their isolation is a fresh VM
		// context per run request — batching files into a single run request
		// would share one context across all of them.
		if (isolate === false && maxWorkers === 1 && spec.pool !== "vmThreads" && spec.pool !== "vmForks") {
			const previous = groups[order].specs[0]?.[0];
			if (previous && previous.project.name === spec.project.name && isEqualEnvironments(spec, previous)) return groups[order].specs[0].push(spec);
		}
		groups[order].specs.push([spec]);
	});
	let order = Math.max(0, ...groups.keys()) + 1;
	for (const projectName in typechecks) {
		const maxWorkers = resolveMaxWorkers(typechecks[projectName][0].project);
		const previous = groups[order - 1];
		if (previous && previous.typecheck && maxWorkers !== previous.maxWorkers) order += 1;
		groups[order] ||= {
			specs: [],
			maxWorkers,
			typecheck: true
		};
		groups[order].specs.push(typechecks[projectName]);
	}
	if (sequential.specs.length) groups.push(sequential);
	return groups;
}

/**
* Glob files inside a project's working directory.
*
* Resolves with `node:path` (not `pathe`) so the Windows drive-letter casing
* stays consistent with Vite's, and keeps slashes normalized.
*/
async function globProjectFiles(include, exclude, cwd) {
	return (await glob(include, {
		dot: true,
		cwd,
		ignore: exclude,
		expandDirectories: false
	})).map((file) => slash(path.resolve(cwd, file)));
}
function isInSourceTestCode(code) {
	return code.includes("import.meta.vitest");
}
/**
* Glob a project's test files, including in-source test files from
* `includeSource` that actually contain `import.meta.vitest`. Typecheck test
* files are not included.
*/
async function globProjectTestFiles(include, exclude, includeSource, cwd) {
	const testFiles = await globProjectFiles(include, exclude, cwd);
	if (includeSource?.length) {
		const files = await globProjectFiles(includeSource, exclude, cwd);
		await Promise.all(files.map(async (file) => {
			try {
				if (isInSourceTestCode(await readFile(file, "utf-8"))) testFiles.push(file);
			} catch {
				return null;
			}
		}));
	}
	return testFiles;
}

class TestSpecification {
	/**
	* The task id associated with the test module.
	*/
	taskId;
	/**
	* The test project that the module belongs to.
	*/
	project;
	/**
	* The id of the module in the Vite module graph. It is usually an absolute file path.
	*/
	moduleId;
	/**
	* The current test pool. It's possible to have multiple pools in a single test project with `typecheck.enabled`.
	*/
	pool;
	/**
	* Line numbers of the test locations to run.
	*/
	testLines;
	/**
	* Regular expression pattern to filter test names.
	*/
	testNamePattern;
	/**
	* The ids of tasks inside of this specification to run.
	*/
	testIds;
	/**
	* The tags of tests to run.
	*/
	testTagsFilter;
	/**
	* This class represents a test suite for a test module within a single project.
	* @internal
	*/
	constructor(project, moduleId, pool, testLinesOrOptions, taskIdOverride) {
		const projectName = project.config.name;
		this.taskId = taskIdOverride ?? generateFileHash(relative(project.config.root, moduleId), projectName, {
			typecheck: pool === "typescript",
			__vitest_label__: project.config.mergeReportsLabel
		});
		this.project = project;
		this.moduleId = moduleId;
		this.pool = pool;
		if (Array.isArray(testLinesOrOptions)) this.testLines = testLinesOrOptions;
		else if (testLinesOrOptions && typeof testLinesOrOptions === "object") {
			this.testLines = testLinesOrOptions.testLines;
			this.testNamePattern = testLinesOrOptions.testNamePattern;
			this.testIds = testLinesOrOptions.testIds;
			this.testTagsFilter = testLinesOrOptions.testTagsFilter;
		}
	}
	/**
	* Test module associated with the specification. This will be `undefined` if tests have not been run yet.
	*/
	get testModule() {
		const task = this.project.vitest.state.idMap.get(this.taskId);
		if (!task) return;
		return this.project.vitest.state.getReportedEntity(task);
	}
	toJSON() {
		return [
			{
				name: this.project.config.name,
				root: this.project.config.root
			},
			this.moduleId,
			{
				pool: this.pool,
				testLines: this.testLines,
				testIds: this.testIds,
				testNamePattern: this.testNamePattern,
				testTagsFilter: this.testTagsFilter
			}
		];
	}
}

class TestProject {
	/**
	* The global Vitest instance.
	*/
	vitest;
	/**
	* Resolved global configuration. If there are no workspace projects, this will be the same as `config`.
	*/
	globalConfig;
	/**
	* Browser instance if the browser is enabled. This is initialized when the tests run for the first time.
	*/
	browser;
	/**
	* Temporary directory for the project. This is unique for each project. Vitest stores transformed content here.
	*/
	tmpDir;
	benchmark = new BenchmarkManager(this);
	config;
	viteConfig;
	vite;
	hash;
	/** @internal */ typechecker;
	/** @internal */ _resolver;
	/** @internal */ _fetcher;
	/** @internal */ _serializedDefines;
	/** @internal */ _sharedViteServer = false;
	/** @internal */ testFilesList = null;
	/** @internal */ _browserReadySessions = /* @__PURE__ */ new Set();
	runner;
	closingPromise;
	typecheckFilesList = null;
	_globalSetups;
	_provided = {};
	constructor(vitest, server, viteConfig, projectConfig) {
		this.vitest = vitest;
		this.globalConfig = vitest.config;
		this.tmpDir = join(tmpdir(), nanoid());
		this.vite = server;
		this.viteConfig = viteConfig;
		this.config = projectConfig;
		this.hash = generateHash(this.config.root + this.config.name);
		this._provideObject(projectConfig.provide);
	}
	/** @internal */
	_initializeRunners(server) {
		this._serializedDefines = createDefinesScript(this.config._scriptDefines);
		this._resolver = new VitestResolver(server.config.cacheDir, this.config);
		this._fetcher = createFetchModuleFunction(this._resolver, this.config, this.vitest._fsCache, this.vitest._traces, this.tmpDir);
		const environment = server.environments.__vitest__;
		this.runner = this.config.experimental.viteModuleRunner === false ? new NativeModuleRunner(this.config.root) : new ServerModuleRunner(environment, this._fetcher, this.config);
	}
	// "provide" is a property, not a method to keep the context when destructed in the global setup,
	// making it a method would be a breaking change, and can be done in Vitest 3 at minimum
	/**
	* Provide a value to the test context. This value will be available to all tests with `inject`.
	*/
	provide = (key, value) => {
		try {
			structuredClone(value);
		} catch (err) {
			throw new Error(`Cannot provide "${key}" because it's not serializable.`, { cause: err });
		}
		// casting `any` because the default type is `never` since `ProvidedContext` is empty
		this._provided[key] = value;
	};
	/**
	* Get the provided context. The project context is merged with the global context.
	*/
	getProvidedContext() {
		if (this.isRootProject()) return this._provided;
		// globalSetup can run even if core workspace is not part of the test run
		// so we need to inherit its provided context
		return {
			...this.vitest.getRootProject().getProvidedContext(),
			...this._provided
		};
	}
	/**
	* Creates a new test specification. Specifications describe how to run tests.
	* @param moduleId The file path
	*/
	createSpecification(moduleId, locationsOrOptions, pool, taskIdOverride) {
		return new TestSpecification(this, moduleId, pool || getFilePoolName(this), locationsOrOptions, taskIdOverride);
	}
	toJSON() {
		return {
			name: this.name,
			serializedConfig: this.serializedConfig,
			context: this.getProvidedContext()
		};
	}
	/**
	* The name of the project or an empty string if not set.
	*/
	get name() {
		return this.config.name || "";
	}
	/**
	* The color used when reporting tasks of this project.
	*/
	get color() {
		return this.config.color;
	}
	/**
	* Serialized project configuration. This is the config that tests receive.
	*/
	get serializedConfig() {
		return this._serializeOverriddenConfig();
	}
	/**
	* Check if this is the root project. The root project is the one that has the root config.
	*/
	isRootProject() {
		return this.vitest.getRootProject() === this;
	}
	/**
	* Whether the project reuses the Vite server of the config that declared it
	* (see the `sharedViteServer` option). The project that owns the server
	* reports `false` even when other projects reuse it.
	*/
	get sharedViteServer() {
		return this._sharedViteServer;
	}
	/** @internal */
	async _initializeGlobalSetup() {
		if (this._globalSetups) return;
		this._globalSetups = await loadGlobalSetupFiles(this.runner, this.config.globalSetup);
		for (const globalSetupFile of this._globalSetups) {
			const teardown = await globalSetupFile.setup?.(this);
			if (teardown == null || !!globalSetupFile.teardown) continue;
			if (typeof teardown !== "function") throw new TypeError(`invalid return value in globalSetup file ${globalSetupFile.file}. Must return a function`);
			globalSetupFile.teardown = teardown;
		}
	}
	onTestsRerun(cb) {
		this.vitest.onTestsRerun(cb);
	}
	/** @internal */
	async _teardownGlobalSetup() {
		if (!this._globalSetups) return;
		for (const globalSetupFile of [...this._globalSetups].reverse()) await globalSetupFile.teardown?.();
	}
	/**
	* Get all files in the project that match the globs in the config and the filters.
	* @param filters String filters to match the test files.
	*/
	async globTestFiles(filters = []) {
		return this.vitest._traces.$("vitest.config.resolve_include_project", async (span) => {
			const dir = this.config.dir || this.config.root;
			const { include, exclude, includeSource } = this.config;
			const typecheck = this.config.typecheck;
			span.setAttributes({
				cwd: dir,
				include,
				exclude,
				includeSource,
				typecheck: typecheck.enabled ? typecheck.include : []
			});
			const [testFiles, typecheckTestFiles] = await Promise.all([typecheck.enabled && typecheck.only ? [] : this.globAllTestFiles(include, exclude, includeSource, dir), typecheck.enabled ? this.typecheckFilesList || this.globFiles(typecheck.include, typecheck.exclude, dir) : []]);
			this.typecheckFilesList = typecheckTestFiles;
			return {
				testFiles: this.filterFiles(testFiles, filters, dir),
				typecheckTestFiles: this.filterFiles(typecheckTestFiles, filters, dir)
			};
		});
	}
	async globAllTestFiles(include, exclude, includeSource, cwd) {
		if (this.testFilesList) return this.testFilesList;
		const testFiles = await globProjectTestFiles(include, exclude, includeSource, cwd);
		this.testFilesList = testFiles;
		return testFiles;
	}
	isBrowserEnabled() {
		return !!this.config.browser?.enabled;
	}
	markTestFile(testPath) {
		this.testFilesList?.push(testPath);
	}
	/** @internal */
	_removeCachedTestFile(testPath) {
		if (this.testFilesList) this.testFilesList = this.testFilesList.filter((file) => file !== testPath);
	}
	/**
	* Returns if the file is a test file. Requires `.globTestFiles()` to be called first.
	* @internal
	*/
	_isCachedTestFile(testPath) {
		return !!this.testFilesList && this.testFilesList.includes(testPath);
	}
	/**
	* Returns if the file is a typecheck test file. Requires `.globTestFiles()` to be called first.
	* @internal
	*/
	_isCachedTypecheckFile(testPath) {
		return !!this.typecheckFilesList && this.typecheckFilesList.includes(testPath);
	}
	/** @internal */
	globFiles(include, exclude, cwd) {
		return globProjectFiles(include, exclude, cwd);
	}
	/**
	* Test if a file matches the test globs. This does the actual glob matching if the test is not cached, unlike `isCachedTestFile`.
	*/
	matchesTestGlob(moduleId, source) {
		if (this._isCachedTestFile(moduleId)) return true;
		const relativeId = relative(this.config.dir || this.config.root, moduleId);
		if (pm.isMatch(relativeId, this.config.exclude)) return false;
		if (pm.isMatch(relativeId, this.config.include)) {
			this.markTestFile(moduleId);
			return true;
		}
		if (this.config.includeSource?.length && pm.isMatch(relativeId, this.config.includeSource)) {
			const code = source?.() || readFileSync(moduleId, "utf-8");
			if (isInSourceTestCode(code)) {
				this.markTestFile(moduleId);
				return true;
			}
		}
		return false;
	}
	filterFiles(testFiles, filters, dir) {
		if (filters.length && process.platform === "win32") filters = filters.map((f) => slash(f));
		if (filters.length) return testFiles.filter((t) => {
			const testFile = relative(dir, t).toLocaleLowerCase();
			return filters.some((f) => {
				// if filter is a full file path, we should include it if it's in the same folder
				if (isAbsolute(f) && t.startsWith(f)) return true;
				const relativePath = f.endsWith("/") ? join(relative(dir, f), "/") : relative(dir, f);
				return testFile.includes(f.toLocaleLowerCase()) || testFile.includes(relativePath.toLocaleLowerCase());
			});
		});
		return testFiles;
	}
	/**
	* The parent browser project that owns this cluster's single Vite server.
	* Set on the primary (the hidden parent of a browser cluster) at server
	* creation; instance siblings get their own `ProjectBrowser` view via
	* `_parentBrowser.spawn`.
	* @internal
	*/
	_parentBrowser;
	/** @internal */
	_parent;
	/**
	* Closes the project and all associated resources. This can only be called once; the closing promise is cached until the server restarts.
	* If the resources are needed again, create a new project.
	*/
	close() {
		if (!this.closingPromise) this.closingPromise = Promise.all([
			this.vite.close(),
			this.typechecker?.stop(),
			this.clearTmpDir()
		].filter(Boolean)).then(() => {
			if (!this.runner.isClosed()) return this.runner.close();
		}).then(() => {
			this._provided = {};
		});
		return this.closingPromise;
	}
	/**
	* Import a file using Vite module runner.
	* @param moduleId The ID of the module in Vite module graph
	*/
	import(moduleId) {
		return this.runner.import(moduleId);
	}
	/** @internal */
	_getViteEnvironments() {
		return Object.values(this.vite.environments || {});
	}
	/** @internal */
	async _openBrowserPage(sessionId, pool) {
		if (!this.browser) throw new Error(`browser is not initialized`);
		const resolvedUrls = this.browser.vite.resolvedUrls;
		const origin = resolvedUrls?.local[0] ?? resolvedUrls?.network[0];
		if (!origin) throw new Error(`Can't find browser origin URL for project "${this.name}"`);
		const url = new URL("/__vitest_test__/", origin);
		url.searchParams.set("sessionId", sessionId);
		const otelCarrier = this.vitest._traces.getContextCarrier();
		this.vitest._browserSessions.sessionIds.add(sessionId);
		const sessionPromise = this.vitest._browserSessions.createSession(sessionId, this, pool, { otelCarrier });
		const pagePromise = this.browser.provider.openPage(sessionId, url.toString(), { parallel: pool.parallel ?? false });
		await Promise.all([sessionPromise, pagePromise]);
	}
	/** @internal */
	async _standalone() {
		if (!this.isBrowserEnabled()) return;
		await this._initBrowserProvider();
		if (!this.browser) return;
		const sessionId = crypto.randomUUID();
		await this._openBrowserPage(sessionId, { reject: (error) => {
			this.vitest.state.catchError(error, "Browser Error");
		} });
		this._browserReadySessions.add(sessionId);
	}
	_serializeOverriddenConfig() {
		// TODO: serialize the config _once_ or when needed
		const config = serializeConfig(this);
		if (!this.vitest.configOverride) return config;
		return deepMerge(config, this.vitest.configOverride);
	}
	async clearTmpDir() {
		try {
			await rm(this.tmpDir, { recursive: true });
		} catch {}
	}
	/** @internal */
	_initBrowserProvider = deduped(async () => {
		if (!this.isBrowserEnabled() || this.browser?.provider) return;
		// The browser server is created eagerly with the project, so `this.browser`
		// is already set here; we only need to initialize the provider.
		if (this.browser) await this.vitest.report("onBrowserInit", this);
		await this.browser?.initBrowserProvider(this);
	});
	_provideObject(context) {
		for (const _providedKey in context) {
			const providedKey = _providedKey;
			// type is very strict here, so we cast it to any
			this.provide(providedKey, context[providedKey]);
		}
	}
	/** @internal */
	static _createBasicProject(vitest) {
		const project = new TestProject(vitest, vitest.vite, vitest.viteConfig, vitest.config);
		project.runner = vitest.runner;
		project._resolver = vitest._resolver;
		project._fetcher = vitest._fetcher;
		project._serializedDefines = createDefinesScript(vitest.config._scriptDefines);
		return project;
	}
	/**
	* Create a sibling project that shares server-derived resources (Vite server,
	* runner, resolver, fetcher) with a primary project. The sibling has its own
	* distinct `projectConfig`, but the same `viteConfig` reference as the primary.
	*
	* Used for browser-instance and benchmark variants whose entries share a
	* `viteConfig` reference with a primary project entry.
	*
	* @internal
	*/
	static _spawnSibling(parent, config) {
		const sibling = new TestProject(parent.vitest, parent.vite, parent.viteConfig, config);
		sibling.runner = parent.runner;
		sibling._resolver = parent._resolver;
		sibling._fetcher = parent._fetcher;
		sibling._parent = parent;
		sibling._serializedDefines = parent._serializedDefines;
		return sibling;
	}
}
function deduped(cb) {
	let _promise;
	return ((...args) => {
		if (!_promise) _promise = cb(...args).finally(() => {
			_promise = void 0;
		});
		return _promise;
	});
}
function generateHash(str) {
	let hash = 0;
	if (str.length === 0) return `${hash}`;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return `${hash}`;
}

const debug = createDebugger("vitest:projects");
// vitest.config.*
// vite.config.*
// vitest.unit.config.*
// vite.unit.config.*
// vitest.unit-test.config.*
const CONFIG_REGEXP = /^vite(?:st)?(?:\.[\w-]+)?\.config\./;
// CLI options that can override per-project test config.
// Not all options are allowed to be overridden.
const PROJECT_CLI_OVERRIDES = [
	"logHeapUsage",
	"detectAsyncLeaks",
	"allowOnly",
	"sequence",
	"testTimeout",
	"pool",
	"update",
	"globals",
	"expandSnapshotDiff",
	"disableConsoleIntercept",
	"retry",
	"repeats",
	"testNamePattern",
	"passWithNoTests",
	"bail",
	"isolate",
	"printConsoleTrace",
	"inspect",
	"inspectBrk",
	"fileParallelism",
	"maxWorkers",
	"tagsFilter",
	"browser",
	"experimental",
	"fsModuleCache",
	"fsModuleCachePath"
];
/**
* Resolve the full list of project entries for the current Vitest run.
*
* - If the user declared `test.projects`, each declared project gets its own
*   resolved Vite config plus per-project Vitest test config.
* - Otherwise the root config is used as the single base entry.
* - A file-based project whose config declares `projects` itself is a
*   container: like the root, it doesn't run tests and is replaced by the
*   projects it declares (recursively).
* - Browser instances expand each entry with `browser.enabled` into one entry
*   per instance (sharing `viteConfig` with the parent).
* - Benchmarks add a benchmark variant for each entry whose
*   `benchmark.enabled` is true (sharing `viteConfig` with its non-benchmark
*   counterpart).
* - The `--project` filter is applied at the end so error messages can list
*   every name that was considered (including instance- and benchmark-derived).
*/
async function resolveProjectEntries(harness, globalViteConfig, globalConfig, definitions, options = {}) {
	const throwIfEmpty = options.throwIfEmpty ?? true;
	const existingNames = options.existingNames;
	// `definitions: []` is treated as "user declared workspace but it's empty"
	// `definitions === undefined` means "no workspace declared" and
	// falls through to the default root-project entry.
	let baseEntries;
	if (definitions !== void 0) {
		debug?.(`resolving ${definitions.length} project definitions declared by ${globalViteConfig.configFile ?? globalConfig.root}`);
		const cliOverrides = PROJECT_CLI_OVERRIDES.reduce((acc, name) => {
			if (name in globalConfig.cliOptions) acc[name] = globalConfig.cliOptions[name];
			return acc;
		}, {});
		const containerConfigFiles = [];
		baseEntries = await resolveDeclaredProjectEntries({
			harness,
			rootViteConfig: globalViteConfig,
			rootConfig: globalConfig,
			parentViteConfig: globalViteConfig,
			parentConfig: globalConfig,
			cliOverrides,
			ancestors: [],
			chain: globalViteConfig.configFile ? [safeRealpath(globalViteConfig.configFile)] : [],
			containerConfigFiles
		}, definitions);
		if (containerConfigFiles.length)
 // appended rather than assigned so `injectTestProjects` containers
		// are also watched
		globalConfig._containerConfigFiles = [...globalConfig._containerConfigFiles || [], ...containerConfigFiles];
	} else {
		debug?.(`no projects declared, the root config is the only project`);
		baseEntries = [{
			viteConfig: globalViteConfig,
			projectConfig: globalConfig
		}];
	}
	// Ensure project names are unique across declared projects (and any
	// already-existing projects passed via `existingNames`, which the inject
	// path uses to forbid clashes with the active workspace). Include config
	// file paths in the error when available (matches the old workspace-mode
	// duplicate-name diagnostic).
	const seenNames = /* @__PURE__ */ new Map();
	for (const entry of baseEntries) {
		const name = entry.projectConfig.name;
		if (existingNames?.has(name)) throw new Error(`Project name "${name}" is not unique. All projects should have unique names. Make sure your configuration is correct.`);
		const existing = seenNames.get(name);
		if (existing) {
			// inline entries carry the configFile they extend, which doesn't say
			// where the project is declared, so they are reported without a file
			const entryFile = !entry.inline && entry.viteConfig.configFile ? relative(globalConfig.root, entry.viteConfig.configFile) : "";
			const existingFile = !existing.inline && existing.viteConfig.configFile ? relative(globalConfig.root, existing.viteConfig.configFile) : "";
			const filesError = baseEntries.length > 1 && (entryFile || existingFile) ? [
				"\n\nYour config matched these files:\n",
				baseEntries.filter((e) => !e.inline && e.viteConfig.configFile).map((e) => ` - ${relative(globalConfig.root, e.viteConfig.configFile)}`).join("\n"),
				"\n\n"
			].join("") : " ";
			throw new Error([
				`Project name "${name}"`,
				entryFile ? ` from "${entryFile}"` : "",
				" is not unique.",
				existingFile ? ` The project is already defined by "${existingFile}".` : "",
				filesError,
				"All projects should have unique names. Make sure your configuration is correct."
			].join(""));
		}
		seenNames.set(name, entry);
	}
	const seenNamesSet = new Set(seenNames.keys());
	// --project filter applied after expansion so all candidate names are known.
	const filtered = applyProjectFilter(globalConfig, expandBenchmarksInEntries(expandBrowserInstancesInEntries(globalConfig, baseEntries, seenNamesSet), seenNamesSet, !!globalConfig.cliOptions.benchmarkOnly));
	// If the user declared `projects` (or workspace files) but the filter
	// excluded every candidate, throw with the projects definition included so
	// callers see what was tried. Skipped for the runtime `injectTestProjects`
	// path where filtering injected projects out is expected.
	const filterMatched = filtered.some((entry) => !entry.hidden);
	if (throwIfEmpty && definitions && !filterMatched) throw new Error([
		"No projects were found. Make sure your configuration is correct. ",
		globalConfig.project.length ? `The filter matched no projects: ${globalConfig.project.join(", ")}. ` : "",
		`The projects definition: ${JSON.stringify(definitions.map((p, index) => typeof p === "string" ? p : p instanceof Promise ? "Promise" : typeof p === "function" ? p.name : { name: p.test?.name ?? index }), null, 4)}.`
	].join(""));
	debug?.(`resolved projects: ${filtered.filter((e) => !e.hidden).map((e) => projectLabel(e.projectConfig.name)).join(", ")}`);
	await applyBrowserOptimizeDeps(harness, filtered);
	return filtered;
}
async function applyBrowserOptimizeDeps(harness, entries) {
	const groups = /* @__PURE__ */ new Map();
	for (const entry of entries) {
		const { viteConfig } = entry;
		let group = groups.get(viteConfig);
		if (!group) {
			group = [];
			groups.set(viteConfig, group);
		}
		group.push(entry);
	}
	// Most projects in a group share identical glob inputs (the `dir`/`root` is
	// always the same and cannot be overridden by an instance option), so cache
	// the result per unique input set to avoid re-globbing the same files.
	const fileListCache = /* @__PURE__ */ new Map();
	const globTestFiles = (config) => {
		const cwd = config.dir || config.root;
		const key = JSON.stringify([
			config.include,
			config.exclude,
			config.includeSource,
			cwd
		]);
		let fileList = fileListCache.get(key);
		if (!fileList) {
			fileList = globProjectTestFiles(config.include, config.exclude, config.includeSource, cwd);
			fileListCache.set(key, fileList);
		}
		return fileList;
	};
	await Promise.all(Array.from(groups, async ([viteConfig, projectEntries]) => {
		const projectConfigs = projectEntries.map((entry) => entry.projectConfig);
		const contribution = projectConfigs.find((config) => config._browserContribution)?._browserContribution;
		if (!contribution) return;
		const fileLists = await Promise.all(projectConfigs.map(globTestFiles));
		projectEntries.forEach((entry, index) => {
			entry.hasTestFiles = fileLists[index].length > 0;
		});
		const testFiles = [...new Set(fileLists.flat())];
		debug?.(`aggregating browser optimizeDeps from ${testFiles.length} test files of ${projectEntries.map((e) => projectLabel(e.projectConfig.name)).join(", ")}`);
		const optimizeDeps = await contribution.resolveOptimizeDeps(projectConfigs, testFiles, harness);
		viteConfig.optimizeDeps = { ...mergeConfig({ optimizeDeps: viteConfig.optimizeDeps }, { optimizeDeps }).optimizeDeps };
		viteConfig.environments.client.optimizeDeps = { ...viteConfig.optimizeDeps };
	}));
}
async function resolveDeclaredProjectEntries(context, definitions) {
	const { parentViteConfig, parentConfig } = context;
	const { configFiles, projectConfigs, nonConfigDirectories } = await resolveTestProjectConfigs(parentViteConfig, parentConfig, definitions);
	const concurrent = limitConcurrency(os__default.availableParallelism?.() || os__default.cpus().length || 5);
	const fileProjects = [...configFiles, ...nonConfigDirectories];
	const promises = [];
	projectConfigs.forEach((options, index) => {
		const ownServerReason = getOwnServerReason(context, options);
		if (ownServerReason === void 0) {
			debug?.(`inline project ${inlineProjectLabel(options, index)} shares the Vite server of ${parentViteConfig.configFile ?? parentConfig.root}`);
			promises.push(Promise.resolve().then(() => resolveSharedServerEntry(context, options, index)));
			return;
		}
		debug?.(`inline project ${inlineProjectLabel(options, index)} resolves its own Vite config: ${ownServerReason}`);
		const configRoot = parentConfig.root;
		// if extends a config file, resolve the file path
		const configFile = typeof options.extends === "string" ? resolve(configRoot, options.extends) : options.extends !== false ? parentViteConfig.configFile || false : false;
		// `test.root` overrides the top level `root`, so the entry carries a
		// single resolved root; both are resolved relative to the declaring
		// config's root (like other options), and inline configs without a
		// root use the same root as the declaring config
		const { root: testRoot, ...test } = options.test ?? {};
		const customRoot = testRoot ?? options.root;
		const root = customRoot ? resolve(configRoot, customRoot) : configRoot;
		promises.push(concurrent(() => resolveSingleProjectEntry(context, {
			...options,
			test,
			root,
			configFile
		}, index)));
	});
	for (const path of fileProjects) {
		// if the file leads to the declaring config itself, reuse the already
		// resolved pair: the root (or the container) also runs as a regular project
		if (parentViteConfig.configFile === path) {
			debug?.(`project at ${path} is the declaring config itself, reusing its resolved config`);
			promises.push(Promise.resolve({
				viteConfig: parentViteConfig,
				projectConfig: parentConfig,
				ancestors: context.ancestors.length > 1 ? context.ancestors.slice(0, -1) : void 0
			}));
			continue;
		}
		const configFile = path.endsWith("/") ? false : path;
		const projectRoot = path.endsWith("/") ? path : dirname(path);
		debug?.(`project at ${path} resolves its own Vite config: file and directory projects never share the server`);
		promises.push(concurrent(() => resolveSingleProjectEntry(context, {
			root: projectRoot,
			configFile
		}, path)));
	}
	const settled = await Promise.allSettled(promises);
	const errors = [];
	const entries = [];
	for (const result of settled) if (result.status === "rejected") errors.push(result.reason);
	else entries.push(result.value);
	if (errors.length) throw new AggregateError(errors, "Failed to initialize projects. There were errors during projects setup. See below for more details.");
	return flattenContainerEntries(context, entries);
}
/**
* Replace container entries (file-based configs that declare `projects`) with
* the projects they declare, recursively. A container behaves like the root
* config: it doesn't run tests and never gets a Vite server; its projects
* extend it by default and their names are prefixed with the container's name.
*/
async function flattenContainerEntries(context, entries) {
	const result = [];
	for (const entry of entries) {
		const definitions = entry.projectConfig.projects;
		// inline projects cannot declare `projects`; the declaring config's own
		// entry (emitted when it references its own config file) is kept as-is —
		// its `projects` are the definitions currently being resolved
		if (entry.inline || definitions === void 0 || entry.projectConfig === context.parentConfig) {
			result.push(entry);
			continue;
		}
		const configFile = entry.viteConfig.configFile;
		const relativeFile = configFile ? relative(context.rootConfig.root, configFile) : entry.projectConfig.name;
		debug?.(`config "${relativeFile}" is a container declaring ${definitions.length} project definitions, it doesn't run tests itself`);
		let chain = context.chain;
		if (configFile) {
			const realConfigFile = safeRealpath(configFile);
			if (chain.includes(realConfigFile)) throw new Error([
				`Found a circular "projects" definition: `,
				[...chain, realConfigFile].map((file) => `"${relative(context.rootConfig.root, file)}"`).join(" -> "),
				". Make sure your configuration is correct."
			].join(""));
			chain = [...chain, realConfigFile];
			context.containerConfigFiles.push(configFile);
		}
		const children = await resolveDeclaredProjectEntries({
			...context,
			parentViteConfig: entry.viteConfig,
			parentConfig: entry.projectConfig,
			ancestors: [...context.ancestors, entry.projectConfig.name],
			chain
		}, definitions);
		// the raw config was only needed to resolve this container's projects,
		// which are all known by now; the resolved container config outlives this
		// resolution (children keep its server alive), so don't let it retain the
		// raw copy for the whole session
		entry.projectConfig._rawTestConfig = void 0;
		if (!children.length) throw new Error(`No projects were found in "${relativeFile}". Make sure your configuration is correct.`);
		result.push(...children);
	}
	return result;
}
function safeRealpath(path) {
	try {
		return realpathSync(path);
	} catch {
		return path;
	}
}
function inheritRootViteOverrides(rootConfig, options) {
	// `plugins` are already initialised, keeping them would break isolation
	const { plugins: _plugins, ...rootViteOverrides } = rootConfig.viteOverrides;
	// cloned so plugins that mutate inherited arrays in place don't share
	// them between the root and every project
	const inherited = deepClone(rootViteOverrides);
	// `tagsFilter` is CLI-only; `PROJECT_CLI_OVERRIDES` applies it per project
	delete inherited.test?.tagsFilter;
	// `browser` describes the instances of a single project; inheriting it
	// would create duplicate instance names (the `--browser` flags have the
	// same guard in `vitest:config:cli`)
	delete inherited.test?.browser;
	return mergeConfig(inherited, options);
}
// test options that reach the Vite config during a project's resolution:
// `alias` is hoisted into `resolve.alias`, `css` configures CSS processing
// and scoped class names, `mode` selects env files and plugin behavior,
// `root` anchors the server, and `browser` selects a browser server
const VITE_AFFECTING_TEST_OPTIONS = [
	"alias",
	"browser",
	"css",
	"mode",
	"root"
];
function projectLabel(name) {
	return name ? `"${name}"` : "(root)";
}
function inlineProjectLabel(options, index) {
	const name = options.test?.name;
	const label = typeof name === "string" ? name : name?.label;
	return label ? `"${label}"` : `at index ${index}`;
}
function getOwnServerReason(context, options) {
	if (!context.rootConfig.sharedViteServer) return "`sharedViteServer` is disabled";
	const rawParentTest = context.parentConfig._rawTestConfig;
	if (rawParentTest === void 0) return "the raw `test` options of the declaring config are not available";
	if (options.extends !== void 0 && options.extends !== true) {
		if (!(typeof options.extends === "string" && context.parentViteConfig.configFile !== void 0 && resolve(context.parentConfig.root, options.extends) === context.parentViteConfig.configFile)) return "`extends` doesn't point to the declaring config";
	}
	for (const key in options) {
		if (key === "test" || key === "extends") continue;
		const value = options[key];
		if (value === void 0) continue;
		if (key === "plugins" && hasNoPlugins(value)) continue;
		// `define` is applied at runtime and doesn't affect the server
		if (key === "define") continue;
		return `\`${key}\` changes the Vite config`;
	}
	// an inherited `browser` config makes the project a browser project, which
	// needs its own browser server; other inherited values are safe
	if (rawParentTest.browser) return "the inherited `browser` config needs a browser server";
	const test = options.test;
	if (!test) return;
	const affecting = VITE_AFFECTING_TEST_OPTIONS.find((option) => test[option] !== void 0);
	if (affecting) return `\`test.${affecting}\` affects the Vite config`;
	// the dependency optimizer state (scanned deps, rewritten import URLs)
	// belongs to the server, and `deps.moduleDirectories` configures the
	// server's `resolve` options
	const deps = test.deps;
	if (deps?.optimizer !== void 0) return "`test.deps.optimizer` affects the Vite config";
	if (deps?.moduleDirectories !== void 0) return "`test.deps.moduleDirectories` affects the Vite config";
}
// covers `plugins: condition ? [plugin()] : []`
function hasNoPlugins(plugins) {
	return Array.isArray(plugins) && plugins.every((plugin) => !plugin || Array.isArray(plugin) && hasNoPlugins(plugin));
}
function countPluginNames(plugins) {
	const counts = /* @__PURE__ */ new Map();
	for (const plugin of plugins) if (plugin.name) counts.set(plugin.name, (counts.get(plugin.name) || 0) + 1);
	return counts;
}
function warnDuplicateInheritedPlugins(logger, projectConfig, projectViteConfig, parentViteConfig, configFile, root) {
	const parentCounts = countPluginNames(parentViteConfig.plugins);
	const duplicates = [];
	for (const [name, count] of countPluginNames(projectViteConfig.plugins)) {
		// a duplicate already present in the declaring config is not caused by `extends`
		const parentCount = parentCounts.get(name) || 0;
		if (count > 1 && parentCount > 0 && count > parentCount) duplicates.push(name);
	}
	if (!duplicates.length) return;
	logger.warn(withLabel("yellow", "Vitest", [
		`The "${projectConfig.name}" project applies the same plugin multiple times: ${duplicates.map((name) => `"${name}"`).join(", ")}. `,
		`Since Vitest 5, an inline project extends the config file that declares it by default, so the plugins from "${relative(root, configFile)}" already apply to this project and don't need to be listed again.\n`,
		`Remove the duplicated plugins from the project, or set \`extends: false\` to not inherit the declaring config. `,
		`Setting the \`extends\` option explicitly hides this warning.`
	].join("")));
}
// `deleteDefineConfig` always drops these
const DROPPED_DEFINE_KEYS = [
	"process.env",
	"process",
	"global"
];
// mirrors `deleteDefineConfig`: a string is a code replacement unless it parses as JSON
function parseDefineValue(value) {
	if (typeof value !== "string") return {
		parsed: true,
		value
	};
	try {
		return {
			parsed: true,
			value: JSON.parse(value)
		};
	} catch {
		return { parsed: false };
	}
}
// the runtime part of `deleteDefineConfig` for a project that shares the parent server
function resolveSharedProjectDefines(define, parentConfig) {
	if (!define) return {
		defines: parentConfig.defines,
		scriptDefines: parentConfig._scriptDefines
	};
	let defines = parentConfig.defines;
	let scriptDefines = parentConfig._scriptDefines;
	const copyDefines = () => {
		if (defines === parentConfig.defines) defines = { ...parentConfig.defines };
		return defines;
	};
	for (const key in define) {
		// `import.meta.vitest` is injected per test file for in-source testing
		if (DROPPED_DEFINE_KEYS.includes(key) || key === "import.meta.vitest") continue;
		const result = parseDefineValue(define[key]);
		if (result.parsed && key.startsWith("import.meta.env.")) process.env[key.slice(16)] = result.value;
		else if (result.parsed && key.startsWith("process.env.")) process.env[key.slice(12)] = result.value;
		else if (result.parsed && !key.includes(".")) copyDefines()[key] = result.value;
		else {
			if (scriptDefines === void 0 || scriptDefines === parentConfig._scriptDefines) scriptDefines = { ...parentConfig._scriptDefines };
			scriptDefines[key] = define[key];
			if (key in defines)
 // the script runs before the runtime defines are assigned,
			// an inherited value would override the entry
			delete copyDefines()[key];
		}
	}
	return {
		defines,
		scriptDefines
	};
}
/**
* Resolve an inline project that shares the declaring config's Vite server.
* Instead of re-executing the config file through Vite, the project's options
* are merged onto the declaring config's raw `test` options and run through
* the same `TestConfigPlugin` hooks a full resolution applies.
*/
function resolveSharedServerEntry(context, options, index) {
	const { harness, rootConfig, parentViteConfig, parentConfig, cliOverrides } = context;
	// the base is cloned so children never share mutable values with each other
	// or with the captured config; `mergeConfig` applies the same rules Vite
	// uses when the extending project is resolved with `configFile` (inline
	// values win, arrays are concatenated)
	const merged = mergeConfig({ test: deepClone(parentConfig._rawTestConfig) }, { test: options.test ?? {} }).test;
	const { defines, scriptDefines } = resolveSharedProjectDefines(options.define, parentConfig);
	const mergedOptions = resolveTestOptions(merged, {
		harness,
		cliOptions: cliOverrides,
		globalConfig: rootConfig,
		project: {
			options,
			extendsTrueRootConfig: parentConfig === rootConfig
		},
		sharedServer: {
			defines,
			scriptDefines,
			moduleRunnerOptions: parentConfig._moduleRunnerOptions
		}
	});
	mergedOptions.name = resolveProjectName(mergedOptions.name, index, context.ancestors.at(-1));
	return {
		viteConfig: parentViteConfig,
		projectConfig: resolveTestConfig(harness.logger, mergedOptions, parentViteConfig, parentConfig),
		inline: true,
		sharedServer: true,
		ancestors: context.ancestors.length ? [...context.ancestors] : void 0
	};
}
async function resolveSingleProjectEntry(context, options, workspacePath) {
	const { harness, rootViteConfig, rootConfig, parentViteConfig, parentConfig, cliOverrides } = context;
	const { configFile, ...restOptions } = options;
	const captures = {};
	// only inline entries (keyed by their index) extend another config;
	// file-based projects own all of their values
	const isInlineEntry = typeof workspacePath === "number";
	const inheritsParentConfig = isInlineEntry && options.extends !== false && typeof options.extends !== "string";
	// the root `globalSetup` runs once per test run, so it is stripped from
	// projects extending the root config file (directly or via `extends: true`
	// at the top level); a container's `globalSetup` stays inherited because
	// nothing else runs it, like any other non-root extended config
	const extendsTrueRootConfig = inheritsParentConfig && parentConfig === rootConfig || !!configFile && configFile === rootViteConfig.configFile;
	const projectInline = {
		...inheritsParentConfig && parentConfig === rootConfig ? inheritRootViteOverrides(rootConfig, restOptions) : restOptions,
		configFile,
		configLoader: parentViteConfig.inlineConfig.configLoader,
		// this will make "mode": "test" inside defineConfig
		mode: options.test?.mode || options.mode || parentConfig.mode,
		plugins: [
			CaptureRawTestConfig(captures, rootConfig.sharedViteServer),
			...TestConfigPlugin(harness, captures, cliOverrides, rootConfig, isInlineEntry ? {
				options,
				extendsTrueRootConfig
			} : void 0),
			...options.plugins || [],
			...WorkspaceVitestPlugin(harness, parentViteConfig),
			...BrowserLoaderPlugin(captures, harness)
		]
	};
	const projectViteConfig = await resolveConfig$2(projectInline, "serve");
	// inherit the declaring config's resolved env as defaults; a project's own
	// env wins, like every other option a project can override
	for (const key in parentViteConfig.env) projectViteConfig.env[key] ??= parentViteConfig.env[key];
	const mergedOptions = projectViteConfig.test ?? {};
	// resolved after `viteResolveConfig` so a plugin can still set `test.name`
	mergedOptions.name = resolveProjectName(mergedOptions.name, workspacePath, context.ancestors.at(-1));
	const projectConfig = resolveTestConfig(harness.logger, mergedOptions, projectViteConfig, parentConfig);
	projectViteConfig.test = projectConfig;
	if (inheritsParentConfig && options.extends === void 0 && configFile) warnDuplicateInheritedPlugins(harness.logger, projectConfig, projectViteConfig, parentViteConfig, configFile, rootConfig.root);
	// The browser provider's contribution (captured during this resolution by the
	// `vitest:browser:loader` plugin) is carried on the resolved config + entry so
	// server creation can build the single shared Vite server.
	projectConfig._browserContribution = captures.browserContribution;
	projectConfig._rawTestConfig = captures.rawTestConfig;
	projectConfig._moduleRunnerOptions = captures.moduleRunnerOptions;
	// `captures` lives as long as the server that keeps its plugins,
	// so it should not hold onto the config
	captures.rawTestConfig = void 0;
	debug?.(`resolved the Vite config of project "${projectConfig.name}" (${configFile || options.root})`);
	return {
		viteConfig: projectViteConfig,
		projectConfig,
		inline: isInlineEntry,
		ancestors: context.ancestors.length ? [...context.ancestors] : void 0
	};
}
function expandBrowserInstancesInEntries(globalConfig, entries, names) {
	// non-browser entries first, then each browser parent followed by its instances
	const result = [];
	const browserEntries = [];
	for (const entry of entries) if (entry.projectConfig.browser.enabled) browserEntries.push(entry);
	else result.push(entry);
	for (const entry of browserEntries) {
		const { projectConfig, viteConfig } = entry;
		const parentName = projectConfig.name;
		const instances = projectConfig.browser.instances ?? [];
		if (instances.length === 0 || isEntryExcludedByFilter(globalConfig.project, parentName, entry.ancestors)) {
			debug?.(`browser project ${projectLabel(parentName)} is dropped: ${instances.length === 0 ? "it has no instances" : "it is excluded by the --project filter"}`);
			continue;
		}
		const parentMatches = matchesEntryFilter(globalConfig.project, parentName, entry.ancestors);
		const filteredInstances = instances.filter((instance) => parentMatches ? !isExcludedByProjectFilter(globalConfig.project, instance.name) : matchesProjectFilter(globalConfig.project, instance.name));
		if (!filteredInstances.length) {
			debug?.(`browser project ${projectLabel(parentName)} is dropped: no instances match the --project filter`);
			continue;
		}
		// Keep the parent in the entry list as `hidden` so a `TestProject` is
		// created (instances link to it via `_parent` for the browser provider).
		// The parent's name is removed from `names` because the instance names
		// take its place in the user-facing project list.
		names.delete(parentName);
		result.push({
			...entry,
			hidden: true
		});
		debug?.(`browser project ${projectLabel(parentName)} expands into instances: ${filteredInstances.map((i) => `"${i.name}"`).join(", ")}`);
		filteredInstances.forEach((instance, index) => {
			const browser = instance.browser;
			if (!browser) {
				const nth = index + 1;
				throw new Error(`The browser configuration must have a "browser" property. The ${nth}${nth === 2 ? "nd" : nth === 3 ? "rd" : "th"} item in "browser.instances" doesn't have it. Make sure your${projectConfig.name ? ` "${projectConfig.name}"` : ""} configuration is correct.`);
			}
			const name = instance.name;
			if (name == null) throw new Error(`The browser configuration must have a "name" property. This is a bug in Vitest. Please, open a new issue with reproduction`);
			if (instance.provider?.name != null && projectConfig.browser.provider?.name != null && instance.provider?.name !== projectConfig.browser.provider?.name) throw new Error(`The instance cannot have a different provider from its parent. The "${name}" instance specifies "${instance.provider?.name}" provider, but its parent has a "${projectConfig.browser.provider?.name}" provider.`);
			const provider = instance.provider?.name ?? projectConfig.browser.provider?.name ?? "preview";
			// Browser-mode CDP only features:
			if (provider === "preview" || !isChromiumName(provider, browser)) {
				const browserConfig = `
{
  browser: {
    provider: ${provider}(),
    instances: [
      ${(filteredInstances || []).map((i) => `{ browser: '${i.browser}' }`).join(",\n      ")}
    ],
  },
}
          `.trim();
				const preferredProvider = provider === "preview" ? "playwright" : provider;
				const correctExample = `
{
  browser: {
    provider: ${preferredProvider}(),
    instances: [
      { browser: '${preferredProvider === "playwright" ? "chromium" : "chrome"}' }
    ],
  },
}
          `.trim();
				if (projectConfig.coverage.enabled && projectConfig.coverage.provider === "v8") {
					const coverageExample = `
{
  coverage: {
    provider: 'istanbul',
  },
}
            `.trim();
					throw new Error(`@vitest/coverage-v8 does not work with\n${browserConfig}\n\nUse either:\n${correctExample}\n\n...or change your coverage provider to:\n${coverageExample}\n`);
				}
				if (globalConfig.inspect || globalConfig.inspectBrk) {
					const inspectOption = `--inspect${globalConfig.inspectBrk ? "-brk" : ""}`;
					throw new Error(`${inspectOption} does not work with\n${browserConfig}\n\nUse either:\n${correctExample}\n\n...or disable ${inspectOption}\n`);
				}
			}
			if (names.has(name)) throw new Error([
				`Cannot define a nested project for a ${browser} browser. The project name "${name}" was already defined. `,
				"If you have multiple instances for the same browser, make sure to define a custom \"name\". ",
				"All projects should have unique names. Make sure your configuration is correct."
			].join(""));
			names.add(name);
			const clonedConfig = cloneProjectConfigForBrowserInstance(projectConfig, instance);
			clonedConfig.name = name;
			result.push({
				viteConfig,
				projectConfig: clonedConfig,
				ancestors: entry.ancestors
			});
		});
	}
	return result;
}
/**
* For each benchmark-enabled entry (or every entry when `benchmarkOnly`), inject
* an additional benchmark variant entry. The new entry shares `viteConfig` with
* its non-benchmark counterpart and carries its own benchmark-shaped
* `projectConfig`.
*/
function expandBenchmarksInEntries(entries, names, benchmarkOnly) {
	let lastGroupOrder = Math.max(0, ...entries.map((e) => e.projectConfig.sequence.groupOrder));
	const result = [...entries];
	for (const entry of entries) {
		const benchmark = entry.projectConfig.benchmark;
		if (!benchmark.enabled && !benchmarkOnly || entry.hidden) continue;
		const name = entry.projectConfig.name ? `${entry.projectConfig.name} (bench)` : "bench";
		if (names.has(name)) throw new Error(`Cannot create a benchmark project because the name "${name}" is already in use.`);
		names.add(name);
		debug?.(`benchmark project "${name}" is added for ${projectLabel(entry.projectConfig.name)}`);
		const benchmarkConfig = {
			...entry.projectConfig,
			name,
			include: benchmark.include,
			exclude: benchmark.exclude,
			includeSource: benchmark.includeSource,
			coverage: {
				...entry.projectConfig.coverage,
				enabled: false
			},
			maxWorkers: 1,
			maxConcurrency: 1,
			testTimeout: entry.projectConfig.testTimeout < 6e4 ? 6e4 : entry.projectConfig.testTimeout,
			hookTimeout: entry.projectConfig.hookTimeout < 12e4 ? 12e4 : entry.projectConfig.hookTimeout,
			// `enabled` because the original entry might not be benchmark-enabled (when
			// forced by `--benchmark`); `projectName` carries the parent's name so the
			// runtime can substitute it into `${projectName}` placeholders inside
			// `writeResult` / `bench.from()` paths.
			benchmark: {
				...benchmark,
				enabled: true,
				projectName: entry.projectConfig.name ?? ""
			},
			sequence: {
				...entry.projectConfig.sequence,
				concurrent: false,
				// benchmarks should always run in a separate isolated group
				groupOrder: ++lastGroupOrder
			},
			typecheck: {
				...entry.projectConfig.typecheck,
				enabled: false
			}
		};
		// disable benchmark in the original entry
		benchmark.enabled = false;
		result.push({
			viteConfig: entry.viteConfig,
			projectConfig: benchmarkConfig,
			ancestors: entry.ancestors,
			sharedServer: entry.sharedServer
		});
	}
	return result;
}
function applyProjectFilter(globalConfig, entries) {
	const filter = globalConfig.project;
	if (!filter.length) return entries;
	const browserClusterViteConfigs = new Set(entries.filter((e) => e.hidden).map((e) => e.viteConfig));
	return entries.filter((entry) => {
		if (entry.hidden) return true;
		if (browserClusterViteConfigs.has(entry.viteConfig))
 // Browser instance: already filtered during expansion.
		return true;
		const matches = matchesEntryFilter(filter, entry.projectConfig.name, entry.ancestors);
		if (!matches) debug?.(`project ${projectLabel(entry.projectConfig.name)} is dropped by the --project filter: ${filter.join(", ")}`);
		return matches;
	});
}
function cloneProjectConfigForBrowserInstance(parentConfig, { browser, ...config }) {
	const { locators, viewport, testerHtmlPath, headless, screenshotDirectory, screenshotFailures, fileParallelism, browser: _browser, name, provider, ...overrideConfig } = config;
	const currentBrowser = parentConfig.browser;
	const clonedConfig = deepClone(parentConfig);
	return mergeConfig({
		...clonedConfig,
		maxWorkers: config.fileParallelism === false ? 1 : clonedConfig.maxWorkers,
		browser: {
			...parentConfig.browser,
			locators: locators ? {
				testIdAttribute: locators.testIdAttribute ?? currentBrowser.locators.testIdAttribute,
				exact: locators.exact ?? currentBrowser.locators.exact,
				errorFormat: locators.errorFormat ?? currentBrowser.locators.errorFormat
			} : parentConfig.browser.locators,
			viewport: viewport ?? currentBrowser.viewport,
			testerHtmlPath: testerHtmlPath ?? currentBrowser.testerHtmlPath,
			screenshotDirectory: screenshotDirectory ?? currentBrowser.screenshotDirectory,
			screenshotFailures: screenshotFailures ?? currentBrowser.screenshotFailures,
			headless: headless ?? currentBrowser.headless,
			provider: provider ?? currentBrowser.provider,
			name: browser,
			instances: []
		},
		// If there is no include or exclude or includeSource pattern in browser.instances[], we should use the that's pattern from the parent project
		include: overrideConfig.include && overrideConfig.include.length > 0 ? [] : clonedConfig.include,
		exclude: overrideConfig.exclude && overrideConfig.exclude.length > 0 ? [] : clonedConfig.exclude,
		includeSource: overrideConfig.includeSource && overrideConfig.includeSource.length > 0 ? [] : clonedConfig.includeSource
	}, overrideConfig);
}
function matchesEntryFilter(filter, name, ancestors) {
	if (!filter.length) return true;
	if (isEntryExcludedByFilter(filter, name, ancestors)) return false;
	const positives = filter.filter((project) => !project.startsWith("!"));
	if (!positives.length) return true;
	const names = [name, ...ancestors || []];
	return positives.some((project) => {
		const regexp = wildcardPatternToRegExp(project);
		return names.some((candidate) => regexp.test(candidate));
	});
}
function isEntryExcludedByFilter(filter, name, ancestors) {
	return isExcludedByProjectFilter(filter, name) || !!ancestors?.some((ancestor) => isExcludedByProjectFilter(filter, ancestor));
}
async function resolveTestProjectConfigs(parentViteConfig, parentConfig, projectsDefinition) {
	// project configurations that were specified directly
	const projectsOptions = [];
	// custom config files that were specified directly or resolved from a directory
	const projectsConfigFiles = [];
	// custom glob matches that should be resolved as directories or config files
	const projectsGlobMatches = [];
	// directories that don't have a config file inside, but should be treated as projects
	const nonConfigProjectDirectories = [];
	for (const definition of projectsDefinition) if (typeof definition === "string") {
		const stringOption = definition.replace("<rootDir>", parentConfig.root);
		// if the string doesn't contain a glob, we can resolve it directly
		// ['./vitest.config.js']
		if (!isDynamicPattern(stringOption)) {
			const file = resolve(parentConfig.root, stringOption);
			if (!existsSync(file)) throw new Error(`Projects definition references a non-existing file or a directory: ${file}`);
			const stats = statSync(file);
			// user can specify a config file directly
			if (stats.isFile()) {
				const name = basename(file);
				if (!CONFIG_REGEXP.test(name)) throw new Error(`The file "${relative(parentConfig.root, file)}" must start with "vitest.config"/"vite.config" or match the pattern "(vitest|vite).*.config.*" to be a valid project config.`);
				projectsConfigFiles.push(file);
			} else if (stats.isDirectory()) {
				const configFile = resolveDirectoryConfig(file);
				if (configFile) projectsConfigFiles.push(configFile);
				else {
					const directory = file.at(-1) === "/" ? file : `${file}/`;
					nonConfigProjectDirectories.push(directory);
				}
			} else
 // should never happen
			throw new TypeError(`Unexpected file type: ${file}`);
		} else projectsGlobMatches.push(stringOption);
	} else if (typeof definition === "function") projectsOptions.push(await definition({
		command: "serve",
		mode: parentViteConfig.mode,
		isPreview: false,
		isSsrBuild: false
	}));
	else projectsOptions.push(await definition);
	if (projectsGlobMatches.length) {
		const globOptions = {
			absolute: true,
			dot: true,
			onlyFiles: false,
			cwd: parentConfig.root,
			expandDirectories: false,
			ignore: [
				"**/node_modules/**",
				"**/*.timestamp-*",
				"**/.DS_Store"
			]
		};
		const projectsFs = await glob(projectsGlobMatches, globOptions);
		debug?.(`projects glob ${projectsGlobMatches.map((p) => `"${p}"`).join(", ")} matched ${projectsFs.length} paths`);
		projectsFs.forEach((path) => {
			// directories are allowed with a glob like `packages/*`
			// in this case every directory is treated as a project
			if (path.endsWith("/")) {
				const configFile = resolveDirectoryConfig(path);
				if (configFile) projectsConfigFiles.push(configFile);
				else nonConfigProjectDirectories.push(path);
			} else {
				const name = basename(path);
				if (!CONFIG_REGEXP.test(name)) throw new Error(`The projects glob matched a file "${relative(parentConfig.root, path)}", but it should also either start with "vitest.config"/"vite.config" or match the pattern "(vitest|vite).*.config.*".`);
				projectsConfigFiles.push(path);
			}
		});
	}
	return {
		projectConfigs: projectsOptions,
		nonConfigDirectories: nonConfigProjectDirectories,
		configFiles: Array.from(new Set(projectsConfigFiles))
	};
}
function resolveDirectoryConfig(directory) {
	const files = new Set(readdirSync(directory));
	// default resolution looks for vitest.config.* or vite.config.* files
	// this simulates how `findUp` works in packages/vitest/src/node/create.ts:29
	const configFile = configFiles.find((file) => files.has(file));
	if (configFile) return resolve(directory, configFile);
	return null;
}
function resolveProjectName(name, workspacePath, containerLabel) {
	let { label, color } = typeof name === "string" ? { label: name } : {
		label: "",
		...name
	};
	if (!label) if (typeof workspacePath === "number") label = workspacePath.toString();
	else {
		const dir = workspacePath.endsWith("/") ? workspacePath.slice(0, -1) : dirname(workspacePath);
		const pkgJsonPath = resolve(dir, "package.json");
		if (existsSync(pkgJsonPath)) label = JSON.parse(readFileSync(pkgJsonPath, "utf-8")).name;
		if (typeof label !== "string" || !label) label = basename(dir);
	}
	// Projects declared by a container config are namespaced by the container's
	// name: the "unit" project of an "app" container is named "app (unit)".
	if (containerLabel) label = `${containerLabel} (${label})`;
	return {
		label,
		color
	};
}
async function attachProjectsFromEntries(vitest, entries) {
	// For each unique `viteConfig`, the "primary" project owns the server.
	// Siblings (browser instance variants, benchmark variants) share it via `_parent`.
	const primaryByViteConfig = /* @__PURE__ */ new Map();
	const childrenByViteConfig = /* @__PURE__ */ new Map();
	for (const entry of entries) {
		const children = childrenByViteConfig.get(entry.viteConfig) ?? [];
		children.push(entry);
		childrenByViteConfig.set(entry.viteConfig, children);
	}
	// every entry with the root `viteConfig` (the default project, its
	// browser/benchmark variants, shared-server projects) attaches to
	// `coreWorkspaceProject`
	if (vitest.vite) {
		if (!vitest.coreWorkspaceProject) {
			vitest.coreWorkspaceProject = TestProject._createBasicProject(vitest);
			// a browser-enabled root owns the parent browser project
			// so instance siblings can attach to it
			if (vitest._rootBrowserParent) vitest.coreWorkspaceProject._parentBrowser = vitest._rootBrowserParent;
		}
		primaryByViteConfig.set(vitest.vite.config, vitest.coreWorkspaceProject);
	}
	const projects = [];
	for (const entry of entries) {
		const { viteConfig, projectConfig, hidden } = entry;
		const primary = primaryByViteConfig.get(viteConfig);
		if (primary) {
			if (hidden) continue;
			// Default-project no-browser case: the entry's `projectConfig` IS the
			// root's resolved config.
			if (primary === vitest.coreWorkspaceProject && projectConfig === vitest.config) {
				projects.push(vitest.coreWorkspaceProject);
				continue;
			}
			// a shared-server project reuses only the Vite server
			if (entry.sharedServer) {
				debug?.(`project ${projectLabel(projectConfig.name)} reuses the Vite server of ${projectLabel(primary.name)} with its own module runner`);
				const project = new TestProject(vitest, primary.vite, viteConfig, projectConfig);
				project._sharedViteServer = true;
				project._initializeRunners(primary.vite);
				projects.push(project);
				continue;
			}
			debug?.(`project ${projectLabel(projectConfig.name)} shares the Vite server and module runner of ${projectLabel(primary.name)}`);
			const sibling = TestProject._spawnSibling(primary, projectConfig);
			// Browser-instance siblings share the primary's single (browser) Vite
			// server; each gets its own `ProjectBrowser` view onto it.
			if (primary._parentBrowser) sibling.browser = primary._parentBrowser.spawn(sibling);
			projects.push(sibling);
			continue;
		}
		// Workspace project with its own `viteConfig`: own a fresh Vite server. For
		// a browser cluster this is the single server shared by `project.vite` and
		// `project.browser.vite`.
		debug?.(`creating a Vite server for project ${projectLabel(projectConfig.name)}`);
		const children = childrenByViteConfig.get(viteConfig) ?? [];
		const { server, parent } = await createClusterServer(vitest, viteConfig, projectConfig, children);
		const project = new TestProject(vitest, server, viteConfig, projectConfig);
		// a shared entry can create the container's server on first use,
		// but the server still belongs to the declaring config
		project._sharedViteServer = !!entry.sharedServer;
		project._initializeRunners(server);
		if (parent) project._parentBrowser = parent;
		primaryByViteConfig.set(viteConfig, project);
		if (!hidden) projects.push(project);
	}
	return projects;
}
/**
* Public entry point used by `injectTestProject` to add projects at runtime.
* Resolves entries from the given definitions and attaches `TestProject`s with
* their Vite servers.
*/
async function resolveAndAttachProjects(harness, definitions) {
	debug?.(`injecting ${definitions.length} project definitions at runtime`);
	const vitest = harness.getVitest();
	return attachProjectsFromEntries(vitest, await resolveProjectEntries(harness, vitest.viteConfig, vitest.config, definitions, {
		// filtering an injected project out is expected at runtime (the user can
		// call `injectTestProjects` with a name that doesn't match the active filter;
		// we just return an empty list).
		throwIfEmpty: false,
		existingNames: new Set(vitest.projects.map((p) => p.name))
	}));
}
function isChromiumName(provider, name) {
	if (provider === "playwright") return name === "chromium";
	return name === "chrome" || name === "edge";
}

class BaseSequencer {
	ctx;
	constructor(ctx) {
		this.ctx = ctx;
	}
	// async so it can be extended by other sequencers
	async shard(files) {
		const { config } = this.ctx;
		const { index, count } = config.shard;
		const [shardStart, shardEnd] = this.calculateShardRange(files.length, index, count);
		return Array.from(files, (spec) => {
			const specPath = resolve(slash(config.root), slash(spec.moduleId))?.slice(config.root.length);
			return {
				spec,
				hash: hash("sha1", specPath, "hex")
			};
		}).sort((a, b) => a.hash < b.hash ? -1 : a.hash > b.hash ? 1 : 0).slice(shardStart, shardEnd).map(({ spec }) => spec);
	}
	// async so it can be extended by other sequencers
	async sort(files) {
		const cache = this.ctx.cache;
		return [...files].sort((a, b) => {
			// "sequence.groupOrder" is higher priority
			const groupOrderDiff = a.project.config.sequence.groupOrder - b.project.config.sequence.groupOrder;
			if (groupOrderDiff !== 0) return groupOrderDiff;
			// Projects run sequential
			if (a.project.name !== b.project.name) return a.project.name < b.project.name ? -1 : 1;
			// Isolated run first
			if (a.project.config.isolate && !b.project.config.isolate) return -1;
			if (!a.project.config.isolate && b.project.config.isolate) return 1;
			const keyA = `${a.project.name}:${relative(this.ctx.config.root, a.moduleId)}`;
			const keyB = `${b.project.name}:${relative(this.ctx.config.root, b.moduleId)}`;
			const aState = cache.getFileTestResults(keyA);
			const bState = cache.getFileTestResults(keyB);
			if (!aState || !bState) {
				const statsA = cache.getFileStats(keyA);
				const statsB = cache.getFileStats(keyB);
				// run unknown first
				if (!statsA || !statsB) return !statsA && statsB ? -1 : !statsB && statsA ? 1 : 0;
				// run larger files first
				return statsB.size - statsA.size;
			}
			// run failed first
			if (aState.failed && !bState.failed) return -1;
			if (!aState.failed && bState.failed) return 1;
			// run longer first
			return bState.duration - aState.duration;
		});
	}
	// Calculate distributed shard range [start, end] distributed equally
	calculateShardRange(filesCount, index, count) {
		const baseShardSize = Math.floor(filesCount / count);
		const remainderTestFilesCount = filesCount % count;
		if (remainderTestFilesCount >= index) {
			const shardSize = baseShardSize + 1;
			return [shardSize * (index - 1), shardSize * index];
		}
		const shardStart = remainderTestFilesCount * (baseShardSize + 1) + (index - remainderTestFilesCount - 1) * baseShardSize;
		return [shardStart, shardStart + baseShardSize];
	}
}

class RandomSequencer extends BaseSequencer {
	async sort(files) {
		const { sequence } = this.ctx.config;
		return shuffle(files, sequence.seed);
	}
}

var jsTokens_1;
var hasRequiredJsTokens;

function requireJsTokens () {
	if (hasRequiredJsTokens) return jsTokens_1;
	hasRequiredJsTokens = 1;
	// Copyright 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023 Simon Lydell
	// License: MIT.
	var Identifier, JSXIdentifier, JSXPunctuator, JSXString, JSXText, KeywordsWithExpressionAfter, KeywordsWithNoLineTerminatorAfter, LineTerminatorSequence, MultiLineComment, Newline, NumericLiteral, Punctuator, RegularExpressionLiteral, SingleLineComment, StringLiteral, Template, TokensNotPrecedingObjectLiteral, TokensPrecedingExpression, WhiteSpace;
	RegularExpressionLiteral = /\/(?![*\/])(?:\[(?:(?![\]\\]).|\\.)*\]|(?![\/\\]).|\\.)*(\/[$_\u200C\u200D\p{ID_Continue}]*|\\)?/yu;
	Punctuator = /--|\+\+|=>|\.{3}|\??\.(?!\d)|(?:&&|\|\||\?\?|[+\-%&|^]|\*{1,2}|<{1,2}|>{1,3}|!=?|={1,2}|\/(?![\/*]))=?|[?~,:;[\](){}]/y;
	Identifier = /(\x23?)(?=[$_\p{ID_Start}\\])(?:[$_\u200C\u200D\p{ID_Continue}]|\\u[\da-fA-F]{4}|\\u\{[\da-fA-F]+\})+/yu;
	StringLiteral = /(['"])(?:(?!\1)[^\\\n\r]|\\(?:\r\n|[^]))*(\1)?/y;
	NumericLiteral = /(?:0[xX][\da-fA-F](?:_?[\da-fA-F])*|0[oO][0-7](?:_?[0-7])*|0[bB][01](?:_?[01])*)n?|0n|[1-9](?:_?\d)*n|(?:(?:0(?!\d)|0\d*[89]\d*|[1-9](?:_?\d)*)(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d(?:_?\d)*)?|0[0-7]+/y;
	Template = /[`}](?:[^`\\$]|\\[^]|\$(?!\{))*(`|\$\{)?/y;
	WhiteSpace = /[\t\v\f\ufeff\p{Zs}]+/yu;
	LineTerminatorSequence = /\r?\n|[\r\u2028\u2029]/y;
	MultiLineComment = /\/\*(?:[^*]|\*(?!\/))*(\*\/)?/y;
	SingleLineComment = /\/\/.*/y;
	JSXPunctuator = /[<>.:={}]|\/(?![\/*])/y;
	JSXIdentifier = /[$_\p{ID_Start}][$_\u200C\u200D\p{ID_Continue}-]*/yu;
	JSXString = /(['"])(?:(?!\1)[^])*(\1)?/y;
	JSXText = /[^<>{}]+/y;
	TokensPrecedingExpression = /^(?:[\/+-]|\.{3}|\?(?:InterpolationIn(?:JSX|Template)|NoLineTerminatorHere|NonExpressionParenEnd|UnaryIncDec))?$|[{}([,;<>=*%&|^!~?:]$/;
	TokensNotPrecedingObjectLiteral = /^(?:=>|[;\]){}]|else|\?(?:NoLineTerminatorHere|NonExpressionParenEnd))?$/;
	KeywordsWithExpressionAfter = /^(?:await|case|default|delete|do|else|instanceof|new|return|throw|typeof|void|yield)$/;
	KeywordsWithNoLineTerminatorAfter = /^(?:return|throw|yield)$/;
	Newline = RegExp(LineTerminatorSequence.source);
	jsTokens_1 = function*(input, {jsx = false} = {}) {
		var braces, firstCodePoint, isExpression, lastIndex, lastSignificantToken, length, match, mode, nextLastIndex, nextLastSignificantToken, parenNesting, postfixIncDec, punctuator, stack;
		({length} = input);
		lastIndex = 0;
		lastSignificantToken = "";
		stack = [
			{tag: "JS"}
		];
		braces = [];
		parenNesting = 0;
		postfixIncDec = false;
		while (lastIndex < length) {
			mode = stack[stack.length - 1];
			switch (mode.tag) {
				case "JS":
				case "JSNonExpressionParen":
				case "InterpolationInTemplate":
				case "InterpolationInJSX":
					if (input[lastIndex] === "/" && (TokensPrecedingExpression.test(lastSignificantToken) || KeywordsWithExpressionAfter.test(lastSignificantToken))) {
						RegularExpressionLiteral.lastIndex = lastIndex;
						if (match = RegularExpressionLiteral.exec(input)) {
							lastIndex = RegularExpressionLiteral.lastIndex;
							lastSignificantToken = match[0];
							postfixIncDec = true;
							yield ({
								type: "RegularExpressionLiteral",
								value: match[0],
								closed: match[1] !== void 0 && match[1] !== "\\"
							});
							continue;
						}
					}
					Punctuator.lastIndex = lastIndex;
					if (match = Punctuator.exec(input)) {
						punctuator = match[0];
						nextLastIndex = Punctuator.lastIndex;
						nextLastSignificantToken = punctuator;
						switch (punctuator) {
							case "(":
								if (lastSignificantToken === "?NonExpressionParenKeyword") {
									stack.push({
										tag: "JSNonExpressionParen",
										nesting: parenNesting
									});
								}
								parenNesting++;
								postfixIncDec = false;
								break;
							case ")":
								parenNesting--;
								postfixIncDec = true;
								if (mode.tag === "JSNonExpressionParen" && parenNesting === mode.nesting) {
									stack.pop();
									nextLastSignificantToken = "?NonExpressionParenEnd";
									postfixIncDec = false;
								}
								break;
							case "{":
								Punctuator.lastIndex = 0;
								isExpression = !TokensNotPrecedingObjectLiteral.test(lastSignificantToken) && (TokensPrecedingExpression.test(lastSignificantToken) || KeywordsWithExpressionAfter.test(lastSignificantToken));
								braces.push(isExpression);
								postfixIncDec = false;
								break;
							case "}":
								switch (mode.tag) {
									case "InterpolationInTemplate":
										if (braces.length === mode.nesting) {
											Template.lastIndex = lastIndex;
											match = Template.exec(input);
											lastIndex = Template.lastIndex;
											lastSignificantToken = match[0];
											if (match[1] === "${") {
												lastSignificantToken = "?InterpolationInTemplate";
												postfixIncDec = false;
												yield ({
													type: "TemplateMiddle",
													value: match[0]
												});
											} else {
												stack.pop();
												postfixIncDec = true;
												yield ({
													type: "TemplateTail",
													value: match[0],
													closed: match[1] === "`"
												});
											}
											continue;
										}
										break;
									case "InterpolationInJSX":
										if (braces.length === mode.nesting) {
											stack.pop();
											lastIndex += 1;
											lastSignificantToken = "}";
											yield ({
												type: "JSXPunctuator",
												value: "}"
											});
											continue;
										}
								}
								postfixIncDec = braces.pop();
								nextLastSignificantToken = postfixIncDec ? "?ExpressionBraceEnd" : "}";
								break;
							case "]":
								postfixIncDec = true;
								break;
							case "++":
							case "--":
								nextLastSignificantToken = postfixIncDec ? "?PostfixIncDec" : "?UnaryIncDec";
								break;
							case "<":
								if (jsx && (TokensPrecedingExpression.test(lastSignificantToken) || KeywordsWithExpressionAfter.test(lastSignificantToken))) {
									stack.push({tag: "JSXTag"});
									lastIndex += 1;
									lastSignificantToken = "<";
									yield ({
										type: "JSXPunctuator",
										value: punctuator
									});
									continue;
								}
								postfixIncDec = false;
								break;
							default:
								postfixIncDec = false;
						}
						lastIndex = nextLastIndex;
						lastSignificantToken = nextLastSignificantToken;
						yield ({
							type: "Punctuator",
							value: punctuator
						});
						continue;
					}
					Identifier.lastIndex = lastIndex;
					if (match = Identifier.exec(input)) {
						lastIndex = Identifier.lastIndex;
						nextLastSignificantToken = match[0];
						switch (match[0]) {
							case "for":
							case "if":
							case "while":
							case "with":
								if (lastSignificantToken !== "." && lastSignificantToken !== "?.") {
									nextLastSignificantToken = "?NonExpressionParenKeyword";
								}
						}
						lastSignificantToken = nextLastSignificantToken;
						postfixIncDec = !KeywordsWithExpressionAfter.test(match[0]);
						yield ({
							type: match[1] === "#" ? "PrivateIdentifier" : "IdentifierName",
							value: match[0]
						});
						continue;
					}
					StringLiteral.lastIndex = lastIndex;
					if (match = StringLiteral.exec(input)) {
						lastIndex = StringLiteral.lastIndex;
						lastSignificantToken = match[0];
						postfixIncDec = true;
						yield ({
							type: "StringLiteral",
							value: match[0],
							closed: match[2] !== void 0
						});
						continue;
					}
					NumericLiteral.lastIndex = lastIndex;
					if (match = NumericLiteral.exec(input)) {
						lastIndex = NumericLiteral.lastIndex;
						lastSignificantToken = match[0];
						postfixIncDec = true;
						yield ({
							type: "NumericLiteral",
							value: match[0]
						});
						continue;
					}
					Template.lastIndex = lastIndex;
					if (match = Template.exec(input)) {
						lastIndex = Template.lastIndex;
						lastSignificantToken = match[0];
						if (match[1] === "${") {
							lastSignificantToken = "?InterpolationInTemplate";
							stack.push({
								tag: "InterpolationInTemplate",
								nesting: braces.length
							});
							postfixIncDec = false;
							yield ({
								type: "TemplateHead",
								value: match[0]
							});
						} else {
							postfixIncDec = true;
							yield ({
								type: "NoSubstitutionTemplate",
								value: match[0],
								closed: match[1] === "`"
							});
						}
						continue;
					}
					break;
				case "JSXTag":
				case "JSXTagEnd":
					JSXPunctuator.lastIndex = lastIndex;
					if (match = JSXPunctuator.exec(input)) {
						lastIndex = JSXPunctuator.lastIndex;
						nextLastSignificantToken = match[0];
						switch (match[0]) {
							case "<":
								stack.push({tag: "JSXTag"});
								break;
							case ">":
								stack.pop();
								if (lastSignificantToken === "/" || mode.tag === "JSXTagEnd") {
									nextLastSignificantToken = "?JSX";
									postfixIncDec = true;
								} else {
									stack.push({tag: "JSXChildren"});
								}
								break;
							case "{":
								stack.push({
									tag: "InterpolationInJSX",
									nesting: braces.length
								});
								nextLastSignificantToken = "?InterpolationInJSX";
								postfixIncDec = false;
								break;
							case "/":
								if (lastSignificantToken === "<") {
									stack.pop();
									if (stack[stack.length - 1].tag === "JSXChildren") {
										stack.pop();
									}
									stack.push({tag: "JSXTagEnd"});
								}
						}
						lastSignificantToken = nextLastSignificantToken;
						yield ({
							type: "JSXPunctuator",
							value: match[0]
						});
						continue;
					}
					JSXIdentifier.lastIndex = lastIndex;
					if (match = JSXIdentifier.exec(input)) {
						lastIndex = JSXIdentifier.lastIndex;
						lastSignificantToken = match[0];
						yield ({
							type: "JSXIdentifier",
							value: match[0]
						});
						continue;
					}
					JSXString.lastIndex = lastIndex;
					if (match = JSXString.exec(input)) {
						lastIndex = JSXString.lastIndex;
						lastSignificantToken = match[0];
						yield ({
							type: "JSXString",
							value: match[0],
							closed: match[2] !== void 0
						});
						continue;
					}
					break;
				case "JSXChildren":
					JSXText.lastIndex = lastIndex;
					if (match = JSXText.exec(input)) {
						lastIndex = JSXText.lastIndex;
						lastSignificantToken = match[0];
						yield ({
							type: "JSXText",
							value: match[0]
						});
						continue;
					}
					switch (input[lastIndex]) {
						case "<":
							stack.push({tag: "JSXTag"});
							lastIndex++;
							lastSignificantToken = "<";
							yield ({
								type: "JSXPunctuator",
								value: "<"
							});
							continue;
						case "{":
							stack.push({
								tag: "InterpolationInJSX",
								nesting: braces.length
							});
							lastIndex++;
							lastSignificantToken = "?InterpolationInJSX";
							postfixIncDec = false;
							yield ({
								type: "JSXPunctuator",
								value: "{"
							});
							continue;
					}
			}
			WhiteSpace.lastIndex = lastIndex;
			if (match = WhiteSpace.exec(input)) {
				lastIndex = WhiteSpace.lastIndex;
				yield ({
					type: "WhiteSpace",
					value: match[0]
				});
				continue;
			}
			LineTerminatorSequence.lastIndex = lastIndex;
			if (match = LineTerminatorSequence.exec(input)) {
				lastIndex = LineTerminatorSequence.lastIndex;
				postfixIncDec = false;
				if (KeywordsWithNoLineTerminatorAfter.test(lastSignificantToken)) {
					lastSignificantToken = "?NoLineTerminatorHere";
				}
				yield ({
					type: "LineTerminatorSequence",
					value: match[0]
				});
				continue;
			}
			MultiLineComment.lastIndex = lastIndex;
			if (match = MultiLineComment.exec(input)) {
				lastIndex = MultiLineComment.lastIndex;
				if (Newline.test(match[0])) {
					postfixIncDec = false;
					if (KeywordsWithNoLineTerminatorAfter.test(lastSignificantToken)) {
						lastSignificantToken = "?NoLineTerminatorHere";
					}
				}
				yield ({
					type: "MultiLineComment",
					value: match[0],
					closed: match[1] !== void 0
				});
				continue;
			}
			SingleLineComment.lastIndex = lastIndex;
			if (match = SingleLineComment.exec(input)) {
				lastIndex = SingleLineComment.lastIndex;
				postfixIncDec = false;
				yield ({
					type: "SingleLineComment",
					value: match[0]
				});
				continue;
			}
			firstCodePoint = String.fromCodePoint(input.codePointAt(lastIndex));
			lastIndex += firstCodePoint.length;
			lastSignificantToken = firstCodePoint;
			postfixIncDec = false;
			yield ({
				type: mode.tag.startsWith("JSX") ? "JSXInvalid" : "Invalid",
				value: firstCodePoint
			});
		}
		return void 0;
	};
	return jsTokens_1;
}

var jsTokensExports = requireJsTokens();
var jsTokens = /*@__PURE__*/getDefaultExportFromCjs(jsTokensExports);

// src/index.ts
var reservedWords = {
  keyword: [
    "break",
    "case",
    "catch",
    "continue",
    "debugger",
    "default",
    "do",
    "else",
    "finally",
    "for",
    "function",
    "if",
    "return",
    "switch",
    "throw",
    "try",
    "var",
    "const",
    "while",
    "with",
    "new",
    "this",
    "super",
    "class",
    "extends",
    "export",
    "import",
    "null",
    "true",
    "false",
    "in",
    "instanceof",
    "typeof",
    "void",
    "delete"
  ],
  strict: [
    "implements",
    "interface",
    "let",
    "package",
    "private",
    "protected",
    "public",
    "static",
    "yield"
  ]
}, keywords = new Set(reservedWords.keyword), reservedWordsStrictSet = new Set(reservedWords.strict), sometimesKeywords = /* @__PURE__ */ new Set(["as", "async", "from", "get", "of", "set"]);
function isReservedWord(word) {
  return word === "await" || word === "enum";
}
function isStrictReservedWord(word) {
  return isReservedWord(word) || reservedWordsStrictSet.has(word);
}
function isKeyword(word) {
  return keywords.has(word);
}
var BRACKET = /^[()[\]{}]$/, getTokenType = function(token) {
  if (token.type === "IdentifierName") {
    if (isKeyword(token.value) || isStrictReservedWord(token.value) || sometimesKeywords.has(token.value))
      return "Keyword";
    if (token.value[0] && token.value[0] !== token.value[0].toLowerCase())
      return "IdentifierCapitalized";
  }
  return token.type === "Punctuator" && BRACKET.test(token.value) ? "Bracket" : token.type === "Invalid" && (token.value === "@" || token.value === "#") ? "Punctuator" : token.type;
};
function getCallableType(token) {
  if (token.type === "IdentifierName")
    return "IdentifierCallable";
  if (token.type === "PrivateIdentifier")
    return "PrivateIdentifierCallable";
  throw new Error("Not a callable token");
}
var colorize = (defs, type, value) => {
  let colorize2 = defs[type];
  return colorize2 ? colorize2(value) : value;
}, highlightTokens = (defs, text, jsx) => {
  let highlighted = "", lastPotentialCallable = null, stackedHighlight = "";
  for (let token of jsTokens(text, { jsx })) {
    let type = getTokenType(token);
    if (type === "IdentifierName" || type === "PrivateIdentifier") {
      lastPotentialCallable && (highlighted += colorize(defs, getTokenType(lastPotentialCallable), lastPotentialCallable.value) + stackedHighlight, stackedHighlight = ""), lastPotentialCallable = token;
      continue;
    }
    if (lastPotentialCallable && (token.type === "WhiteSpace" || token.type === "LineTerminatorSequence" || token.type === "Punctuator" && (token.value === "?." || token.value === "!"))) {
      stackedHighlight += colorize(defs, type, token.value);
      continue;
    }
    if (stackedHighlight && !lastPotentialCallable && (highlighted += stackedHighlight, stackedHighlight = ""), lastPotentialCallable) {
      let type2 = token.type === "Punctuator" && token.value === "(" ? getCallableType(lastPotentialCallable) : getTokenType(lastPotentialCallable);
      highlighted += colorize(defs, type2, lastPotentialCallable.value) + stackedHighlight, stackedHighlight = "", lastPotentialCallable = null;
    }
    highlighted += colorize(defs, type, token.value);
  }
  return highlighted;
};
function highlight(code, options = { jsx: false, colors: {} }) {
  return code && highlightTokens(options.colors || {}, code, options.jsx);
}

const HIGHLIGHT_SUPPORTED_EXTS = new Set(["js", "ts"].flatMap((lang) => [
	`.${lang}`,
	`.m${lang}`,
	`.c${lang}`,
	`.${lang}x`,
	`.m${lang}x`,
	`.c${lang}x`
]));
function highlightCode(id, source) {
	const ext = extname(id);
	if (!HIGHLIGHT_SUPPORTED_EXTS.has(ext)) return source;
	const isJsx = ext.endsWith("x");
	return highlight(source, {
		jsx: isJsx,
		colors: getDefs(y)
	});
}
function getDefs(c) {
	const Invalid = (text) => c.white(c.bgRed(c.bold(text)));
	return {
		Keyword: c.magenta,
		IdentifierCapitalized: c.yellow,
		Punctuator: c.yellow,
		StringLiteral: c.green,
		NoSubstitutionTemplate: c.green,
		MultiLineComment: c.gray,
		SingleLineComment: c.gray,
		RegularExpressionLiteral: c.cyan,
		NumericLiteral: c.blue,
		TemplateHead: (text) => c.green(text.slice(0, text.length - 2)) + c.cyan(text.slice(-2)),
		TemplateTail: (text) => c.cyan(text.slice(0, 1)) + c.green(text.slice(1)),
		TemplateMiddle: (text) => c.cyan(text.slice(0, 1)) + c.green(text.slice(1, text.length - 2)) + c.cyan(text.slice(-2)),
		IdentifierCallable: c.blue,
		PrivateIdentifierCallable: (text) => `#${c.blue(text.slice(1))}`,
		Invalid,
		JSXString: c.green,
		JSXIdentifier: c.yellow,
		JSXInvalid: Invalid,
		JSXPunctuator: c.yellow
	};
}

const PAD = "      ";
const ESC$1 = "\x1B[";
const ERASE_DOWN = `${ESC$1}J`;
const ERASE_SCROLLBACK = `${ESC$1}3J`;
const CURSOR_TO_START = `${ESC$1}1;1H`;
const HIDE_CURSOR = `${ESC$1}?25l`;
const SHOW_CURSOR = `${ESC$1}?25h`;
const CLEAR_SCREEN = "\x1Bc";
class Logger {
	outputStream;
	errorStream;
	_clearScreenPending;
	_highlights = /* @__PURE__ */ new Map();
	cleanupListeners = [];
	console;
	ctx;
	constructor(outputStream = process.stdout, errorStream = process.stderr) {
		this.outputStream = outputStream;
		this.errorStream = errorStream;
		this.console = new Console({
			stdout: outputStream,
			stderr: errorStream
		});
		this._highlights.clear();
		if (this.outputStream.isTTY) this.outputStream.write(HIDE_CURSOR);
	}
	setVitest(vitest) {
		this.ctx = vitest;
		this.addCleanupListeners();
		this.registerUnhandledRejection();
		return this;
	}
	log(...args) {
		this._clearScreen();
		this.console.log(...args);
	}
	error(...args) {
		this._clearScreen();
		this.console.error(...args);
	}
	warn(...args) {
		this._clearScreen();
		this.console.warn(...args);
	}
	clearFullScreen(message = "") {
		if (!this.ctx.config.clearScreen) {
			this.console.log(message);
			return;
		}
		if (message) this.console.log(`${CLEAR_SCREEN}${ERASE_SCROLLBACK}${message}`);
		else this.outputStream.write(`${CLEAR_SCREEN}${ERASE_SCROLLBACK}`);
	}
	clearScreen(message, force = false) {
		if (!this.ctx.config.clearScreen) {
			this.console.log(message);
			return;
		}
		this._clearScreenPending = message;
		if (force) this._clearScreen();
	}
	_clearScreen() {
		if (this._clearScreenPending == null) return;
		const log = this._clearScreenPending;
		this._clearScreenPending = void 0;
		this.console.log(`${CURSOR_TO_START}${ERASE_DOWN}${log}`);
	}
	printError(err, options = {}) {
		printError(err, this.ctx, this, options);
	}
	formatError(err, options = {}) {
		return capturePrintError(err, this.ctx, options);
	}
	deprecate(message) {
		this.error(y.bold(y.bgYellow(" DEPRECATED ")), y.yellow(message));
	}
	clearHighlightCache(filename) {
		if (filename) this._highlights.delete(filename);
		else this._highlights.clear();
	}
	highlight(filename, source) {
		if (this._highlights.has(filename)) return this._highlights.get(filename);
		const code = highlightCode(filename, source);
		this._highlights.set(filename, code);
		return code;
	}
	printNoTestTagsFound() {
		this.error(y.bgRed(" ERROR "), y.red("No test tags found in any project. Exiting with code 1."));
	}
	printTags() {
		const vitest = this.ctx;
		const rootProject = vitest.getRootProject();
		const projects = [rootProject, ...vitest.projects.filter((p) => p !== rootProject)];
		if (!projects.some((p) => p.config.tags && p.config.tags.length > 0)) {
			process.exitCode = 1;
			return this.printNoTestTagsFound();
		}
		for (const project of projects) {
			if (project.name) this.log(formatProjectName(project, ""));
			project.config.tags.forEach((tag) => {
				const tagLog = `${tag.name}${tag.description ? `: ${tag.description}` : ""}`;
				this.log(`  ${tagLog}`);
			});
		}
	}
	printNoTestFound(filters) {
		const config = this.ctx.config;
		if (config.watch && (config.changed || config.related?.length)) this.log(`No affected test files found\n`);
		else if (config.watch) this.log(y.red(`No test files found. You can change the file name pattern by pressing "p"\n`));
		else if (config.passWithNoTests) this.log(`No test files found, exiting with code 0\n`);
		else this.error(y.red(`No test files found, exiting with code 1\n`));
		const comma = y.dim(", ");
		if (filters?.length) this.console.error(y.dim("filter: ") + y.yellow(filters.join(comma)));
		const projectsFilter = toArray(config.project);
		if (projectsFilter.length) this.console.error(y.dim("projects: ") + y.yellow(projectsFilter.join(comma)));
		this.ctx.projects.forEach((project) => {
			const config = project.config;
			if (!project.isRootProject() && project.name) this.console.error(`\n${formatProjectName(project)}\n`);
			if (config.include) this.console.error(y.dim("include: ") + y.yellow(config.include.join(comma)));
			if (config.exclude) this.console.error(y.dim("exclude:  ") + y.yellow(config.exclude.join(comma)));
			if (config.typecheck.enabled) {
				this.console.error(y.dim("typecheck include: ") + y.yellow(config.typecheck.include.join(comma)));
				this.console.error(y.dim("typecheck exclude: ") + y.yellow(config.typecheck.exclude.join(comma)));
			}
		});
		this.console.error();
	}
	printBanner() {
		this.log();
		const color = this.ctx.config.watch ? "blue" : "cyan";
		const mode = this.ctx.config.watch ? "DEV" : "RUN";
		this.log(withLabel(color, mode, `v${this.ctx.version} `) + y.gray(this.ctx.config.root));
		const seed = this.ctx.getSeed();
		if (seed != null) this.log(PAD + y.gray(`Running tests with seed "${seed}"`));
		if (this.ctx.config.ui) {
			const host = this.ctx.config.api?.host || "localhost";
			const port = this.ctx.vite.config.server.port;
			const url = new URL(this.ctx.config.uiBase, `http://${host}:${port}`);
			url.searchParams.set("token", this.ctx.config.api.token);
			this.log(PAD + y.dim(y.green(`UI started at ${url}`)));
		} else if (this.ctx.config.api?.port) {
			const resolvedUrls = this.ctx.vite.resolvedUrls;
			// workaround for https://github.com/vitejs/vite/issues/15438, it was fixed in vite 5.1
			const fallbackUrl = `http://${this.ctx.config.api.host || "localhost"}:${this.ctx.config.api.port}`;
			const origin = resolvedUrls?.local[0] ?? resolvedUrls?.network[0] ?? fallbackUrl;
			this.log(PAD + y.dim(y.green(`API started at ${new URL("/", origin)}`)));
		}
		if (this.ctx.coverageProvider) this.log(PAD + y.dim("Coverage enabled with ") + y.yellow(this.ctx.coverageProvider.name));
		if (this.ctx.config.standalone) this.log(y.yellow(`\nVitest is running in standalone mode. Edit a test file to rerun tests.\n`));
		else this.log();
	}
	printUnhandledErrors(errors) {
		const errorMessage = y.red(y.bold(`\nVitest caught ${errors.length} unhandled error${errors.length > 1 ? "s" : ""} during the test run.
This might cause false positive tests. Resolve unhandled errors to make sure your tests are not affected.`));
		this.error(errorBanner("Unhandled Errors"));
		this.error(errorMessage);
		errors.forEach((err) => {
			this.printError(err, {
				fullStack: err.name !== "EnvironmentTeardownError",
				type: err.type || "Unhandled Error"
			});
		});
		this.error(y.red(divider()));
	}
	printSourceTypeErrors(errors) {
		const errorMessage = y.red(y.bold(`\nVitest found ${errors.length} error${errors.length > 1 ? "s" : ""} not related to your test files.`));
		this.log(errorBanner("Source Errors"));
		this.log(errorMessage);
		errors.forEach((err) => {
			this.printError(err, { fullStack: true });
		});
		this.log(y.red(divider()));
	}
	getColumns() {
		return "columns" in this.outputStream ? this.outputStream.columns : 80;
	}
	onTerminalCleanup(listener) {
		this.cleanupListeners.push(listener);
	}
	addCleanupListeners() {
		const cleanup = () => {
			this.cleanupListeners.forEach((fn) => fn());
			if (this.outputStream.isTTY) this.outputStream.write(SHOW_CURSOR);
		};
		const onExit = (signal, exitCode) => {
			cleanup();
			// Interrupted signals don't set exit code automatically.
			// Use same exit code as node: https://nodejs.org/api/process.html#signal-events
			if (process.exitCode === void 0) process.exitCode = exitCode !== void 0 ? 128 + exitCode : Number(signal);
			// Timeout to flush stderr
			setTimeout(() => process.exit(), 1);
		};
		process.once("SIGINT", onExit);
		process.once("SIGTERM", onExit);
		process.once("exit", onExit);
		this.ctx.onClose(() => {
			process.off("SIGINT", onExit);
			process.off("SIGTERM", onExit);
			process.off("exit", onExit);
			cleanup();
		});
	}
	registerUnhandledRejection() {
		const onUnhandledRejection = (err) => {
			process.exitCode = 1;
			this.printError(err, {
				fullStack: true,
				type: "Unhandled Rejection"
			});
			this.error("\n\n");
			process.exit();
		};
		process.on("unhandledRejection", onUnhandledRejection);
		this.ctx.onClose(() => {
			process.off("unhandledRejection", onUnhandledRejection);
		});
	}
}

const __dirname$1 = url.fileURLToPath(new URL(".", import.meta.url));
class VitestPackageInstaller {
	isPackageExists(name, options) {
		return isPackageExists(name, options);
	}
	async ensureInstalled(dependency, root, version) {
		if (process.env.VITEST_SKIP_INSTALL_CHECKS) return true;
		if (process.versions.pnp) {
			const targetRequire = createRequire(__dirname$1);
			try {
				targetRequire.resolve(dependency, { paths: [root, __dirname$1] });
				return true;
			} catch {}
		}
		if (/* @__PURE__ */ isPackageExists(dependency, { paths: [root, __dirname$1] })) return true;
		process.stderr.write(withLabel("red", "MISSING DEPENDENCY", `Cannot find dependency '${dependency}'\n\n`));
		if (!isTTY) return false;
		const { install } = await (await Promise.resolve().then(function () { return index; })).default({
			type: "confirm",
			name: "install",
			message: y.reset(`Do you want to install ${y.green(dependency)}?`)
		});
		if (install) {
			const packageName = version ? `${dependency}@${version}` : dependency;
			await (await import('./index.DXQx-kDM.js')).installPackage(packageName, { dev: true });
			// TODO: somehow it fails to load the package after installation, remove this when it's fixed
			process.stderr.write(y.yellow(`\nPackage ${packageName} installed, re-run the command to start.\n`));
			process.exit();
			return true;
		}
		return false;
	}
}

class PluginHarness {
	logger;
	packageInstaller;
	vitest;
	version = version$1;
	/**
	* @internal
	*/
	_browserLastPort = defaultBrowserPort;
	constructor(logger = new Logger(), packageInstaller = new VitestPackageInstaller()) {
		this.logger = logger;
		this.packageInstaller = packageInstaller;
	}
	setVitest(vitest) {
		this.vitest = vitest;
		return this;
	}
	getVitest() {
		if (!this.vitest) throw new Error(`Don't have access to the "vitest" instance yet. This is a bug in Vitest.`);
		return this.vitest;
	}
}

function resolvePath(path, root) {
	// local-pkg (mlly)'s resolveModule("./file", { paths: ["/some/root"] }) tries
	// /some/file
	// /some/file.js
	// /some/root/file
	// /some/root/file.js
	// etc.
	// but we don't want to resolve files from parent directories,
	// so we ensure passing "/" suffix such as "/some/root/"
	// https://github.com/unjs/mlly/blob/401d42983f6f3a9112658d67b0a92ba4fb1d7efa/src/resolve.ts#L104-L110
	return normalize(/* @__PURE__ */ resolveModule(path, { paths: [join(root, "/")] }) ?? resolve(root, path));
}
function findConfigFile(root) {
	for (const configFile of configFiles) {
		const configPath = resolve(root, configFile);
		if (existsSync(configPath)) return configPath;
	}
	// if not found, then there is no config to find.
	// `false` will stop vite from trying to find it again
	return false;
}
function parseInspector(inspect) {
	if (typeof inspect === "boolean" || inspect === void 0) return {};
	if (typeof inspect === "number") return { port: inspect };
	if (/https?:\//.test(inspect)) throw new Error(`Inspector host cannot be a URL. Use "host:port" instead of "${inspect}"`);
	const [host, port] = inspect.split(":");
	if (!port) return { host };
	return {
		host,
		port: Number(port) || defaultInspectPort
	};
}
function resolveApiServerConfig(config, defaultPort, logger) {
	const isBrowserEnabled = !!config.browser?.enabled;
	let api;
	if (config.ui && !config.api) api = { port: defaultPort };
	else if (config.api === true) api = { port: defaultPort };
	else if (typeof config.api === "number") api = { port: config.api };
	if (typeof config.api === "object") if (api) {
		if (config.api.port) api.port = config.api.port;
		if (config.api.strictPort) api.strictPort = config.api.strictPort;
		if (config.api.host) api.host = config.api.host;
	} else api = { ...config.api };
	if (api) {
		if (!api.port && !api.middlewareMode) api.port = defaultPort;
	} else api = { middlewareMode: true };
	if (api && isBrowserEnabled) {
		// Always force middlewareMode to false in browser mode
		api.middlewareMode = false;
		// The browser server is standalone, so it always needs a port even when the
		// user didn't configure `api`/`ui` (in which case `api` defaulted above)
		if (!api.port) api.port = defaultPort;
	}
	// if the API server is exposed to network, disable write operations by default
	if (!api.middlewareMode && api.host && api.host !== "localhost" && api.host !== "127.0.0.1") {
		if (api.allowWrite == null && api.allowExec == null) logger.error(y.yellow(`${y.bgYellow(" WARNING ")} API server is exposed to network, disabling write and exec operations by default for security reasons. This can cause some APIs to not work as expected. Set \`browser.api.allowExec\` manually to hide this warning. See https://vitest.dev/config/api for more details.`));
		api.allowWrite ??= false;
		api.allowExec ??= false;
	} else {
		api.allowWrite ??= true;
		api.allowExec ??= true;
	}
	return api;
}
function resolveInlineWorkerOption(value) {
	if (typeof value === "string" && value.trim().endsWith("%")) return getWorkersCountByPercentage(value);
	else return Number(value);
}
/**
* Records which options the user provided explicitly. Must be computed from
* the raw user config sources BEFORE `configDefaults` is merged in - the
* merged object cannot distinguish a default from a user-provided value.
*/
function captureProvidedOptions(...sources) {
	return {
		pool: sources.some((source) => source?.pool != null),
		isolate: sources.some((source) => source?.isolate != null),
		environment: sources.some((source) => source?.environment != null || source?.dom),
		fsModuleCache: sources.some((source) => source?.fsModuleCache != null || (source?.experimental)?.fsModuleCache != null)
	};
}
// warn only once, check one PER PROCESS, not per instance,
// that's why it's on a module-level
let warnedTypeCheck = false;
/**
* Resolve Vitest's test config for a single Vite resolved config (root or a single project).
*
* This is the internal single-config resolver. The top-level `resolveConfig`
* orchestrates the full pipeline (root + projects + browser/benchmark expansion).
*
* `globalConfig` is the resolved root config, passed when resolving a project.
*/
function resolveTestConfig(logger, options, viteConfig, globalConfig) {
	if (options.dom) {
		if (viteConfig.test?.environment != null && viteConfig.test.environment !== "happy-dom") logger.warn(withLabel("yellow", "Vitest", `Your config.test.environment ("${viteConfig.test.environment}") conflicts with --dom flag ("happy-dom"), ignoring "${viteConfig.test.environment}"`));
		options.environment = "happy-dom";
	}
	// provenance must be captured from the raw options BEFORE `configDefaults`
	// is merged in - the merged object cannot distinguish a default from a
	// user-provided value; `viteConfig.test` is not resolved yet at this point,
	// the call sites assign the resolved config to it after this function returns
	const providedOptions = captureProvidedOptions(options, viteConfig.test);
	const resolved = deepMerge({}, configDefaults, options);
	resolved.root = viteConfig.root;
	resolved.providedOptions = providedOptions;
	// These options are resolved once for the whole run using the root config.
	// Coverage is shared by reference: each project's setup/test/config files are
	// appended to the same exclude list below, keeping them out of the report.
	if (globalConfig) {
		resolved.coverage = globalConfig.coverage;
		resolved.attachmentsDir = globalConfig.attachmentsDir;
		resolved.mergeReportsLabel = globalConfig.mergeReportsLabel;
	}
	if (!statSync(resolved.root, { throwIfNoEntry: false })?.isDirectory()) throw new Error(`Root path does not exist or is not a directory: ${resolved.root}`);
	resolved.mode ??= viteConfig.mode ?? "test";
	if (resolved.retry && typeof resolved.retry === "object" && typeof resolved.retry.condition === "function") {
		logger.warn(y.yellow("Warning: retry.condition function cannot be used inside a config file. Use a RegExp pattern instead, or define the function in your test file."));
		resolved.retry = {
			...resolved.retry,
			condition: void 0
		};
	}
	if (options.pool && typeof options.pool !== "string") {
		resolved.pool = options.pool.name;
		resolved.poolRunner = options.pool;
	}
	if ("poolOptions" in resolved) logger.deprecate("`test.poolOptions` was removed in Vitest 4. All previous `poolOptions` are now top-level options. Please, refer to the migration guide: https://v4.vitest.dev/guide/migration#pool-rework");
	if ("workspace" in resolved) throw new Error("The `test.workspace` option was removed in Vitest 4. Please, migrate to `test.projects` instead. See https://vitest.dev/guide/projects for examples.");
	resolved.pool ??= "forks";
	resolved.project = toArray(resolved.project);
	resolved.provide ??= {};
	// shallow copy tags array to avoid mutating user config
	resolved.tags = [...resolved.tags || []];
	const definedTags = /* @__PURE__ */ new Set();
	resolved.tags.forEach((tag) => {
		if (!tag.name || typeof tag.name !== "string") throw new Error(`Each tag defined in "test.tags" must have a "name" property, received: ${JSON.stringify(tag)}`);
		if (definedTags.has(tag.name)) throw new Error(`Tag name "${tag.name}" is already defined in "test.tags". Tag names must be unique.`);
		if (/\s/.test(tag.name)) throw new Error(`Tag name "${tag.name}" is invalid. Tag names cannot contain spaces.`);
		if (/[!()*|&]/.test(tag.name)) throw new Error(`Tag name "${tag.name}" is invalid. Tag names cannot contain "!", "*", "&", "|", "(", or ")".`);
		if (/^\s*(?:and|or|not)\s*$/i.test(tag.name)) throw new Error(`Tag name "${tag.name}" is invalid. Tag names cannot be a logical operator like "and", "or", "not".`);
		if (typeof tag.retry === "object" && typeof tag.retry.condition === "function") throw new TypeError(`Tag "${tag.name}": retry.condition function cannot be used inside a config file. Use a RegExp pattern instead, or define the function in your test file.`);
		if (tag.priority != null && (typeof tag.priority !== "number" || tag.priority < 0)) throw new TypeError(`Tag "${tag.name}": priority must be a non-negative number.`);
		definedTags.add(tag.name);
	});
	resolved.name = typeof options.name === "string" ? options.name : options.name?.label || "";
	resolved.color = typeof options.name !== "string" ? options.name?.color : void 0;
	if (resolved.environment === "browser") throw new Error(`Looks like you set "test.environment" to "browser". To enable Browser Mode, use "test.browser.enabled" instead.`);
	resolved.benchmark = {
		...benchmarkConfigDefaults,
		...resolved.benchmark
	};
	if (resolved.benchmark.provider) resolved.benchmark.provider = resolvePath(resolved.benchmark.provider, resolved.root);
	const inspector = resolved.inspect || resolved.inspectBrk;
	resolved.inspector = {
		...resolved.inspector,
		...parseInspector(inspector),
		enabled: !!inspector,
		waitForDebugger: options.inspector?.waitForDebugger ?? !!resolved.inspectBrk
	};
	if (viteConfig.base !== "/") resolved.base = viteConfig.base;
	resolved.clearScreen = resolved.clearScreen ?? viteConfig.clearScreen ?? true;
	if (options.shard) {
		if (resolved.watch) throw new Error("You cannot use --shard option with enabled watch");
		const [indexString, countString] = options.shard.split("/");
		const index = Math.abs(Number.parseInt(indexString, 10));
		const count = Math.abs(Number.parseInt(countString, 10));
		if (Number.isNaN(count) || count <= 0) throw new Error("--shard <count> must be a positive number");
		if (Number.isNaN(index) || index <= 0 || index > count) throw new Error("--shard <index> must be a positive number less then <count>");
		resolved.shard = {
			index,
			count
		};
	}
	if (resolved.standalone && !resolved.watch) throw new Error(`Vitest standalone mode requires --watch`);
	if (resolved.mergeReports && resolved.watch) throw new Error(`Cannot merge reports with --watch enabled`);
	if (resolved.maxWorkers) resolved.maxWorkers = resolveInlineWorkerOption(resolved.maxWorkers);
	// `browser.fileParallelism` was replaced by the top-level `fileParallelism`. Map
	// it (only when browser is enabled, since it was a browser-only option) so
	// existing configs keep working instead of being silently ignored.
	const browserOptions = options.browser;
	const browserFileParallelism = browserOptions?.enabled ? browserOptions.fileParallelism : void 0;
	if (browserFileParallelism !== void 0) logger.deprecate("`browser.fileParallelism` is deprecated. Use the top-level `fileParallelism` option instead.");
	if (!(options.fileParallelism ?? browserFileParallelism ?? true))
 // ignore user config, parallelism cannot be implemented without limiting workers
	resolved.maxWorkers = 1;
	if (resolved.maxConcurrency === 0) {
		logger.console.warn(y.yellow(`The option "maxConcurrency" cannot be set to 0. Using default value ${configDefaults.maxConcurrency} instead.`));
		resolved.maxConcurrency = configDefaults.maxConcurrency;
	}
	if (resolved.inspect || resolved.inspectBrk) {
		if (resolved.maxWorkers !== 1) {
			const inspectOption = `--inspect${resolved.inspectBrk ? "-brk" : ""}`;
			throw new Error(`You cannot use ${inspectOption} without "--no-file-parallelism"`);
		}
	}
	resolved.browser ??= {};
	const browser = resolved.browser;
	if (browser.enabled) {
		const instances = browser.instances;
		if (!browser.instances) browser.instances = [];
		// The whole project shares a single browser Vite server, so every instance
		// must use the same provider. Validate that here and hoist the provider to
		// the project level so the cluster resolves one even when it is only set per
		// instance (e.g. connect mode). Because the provider is uniform, any
		// instance's server factory represents the whole project.
		const providerNames = /* @__PURE__ */ new Set();
		// It's possible to provide the same name and sneak in a different factory
		const providerFactories = /* @__PURE__ */ new Set();
		if (browser.provider?.name) {
			providerNames.add(browser.provider.name);
			providerFactories.add(browser.provider.serverFactory);
		}
		for (const instance of browser.instances) if (instance.provider?.name) {
			providerNames.add(instance.provider.name);
			providerFactories.add(instance.provider.serverFactory);
		}
		if (providerNames.size > 1 || providerFactories.size > 1) throw new Error(`All browser instances within a project must use the same provider, but found: ${[...providerNames].join(", ")}. Use a single provider for the project, or move the instances into separate projects.`);
		browser.provider ??= browser.instances.find((instance) => instance.provider)?.provider;
		// use `chromium` by default when the preview provider is specified
		// for a smoother experience. if chromium is not available, it will
		// open the default browser anyway
		if (!browser.instances.length && browser.provider?.name === "preview") browser.instances = [{ browser: "chromium" }];
		if (browser.name && instances?.length) {
			// --browser=chromium filters configs to a single one
			browser.instances = browser.instances.filter((instance) => instance.browser === browser.name);
			// if `instances` were defined, but now they are empty,
			// let's throw an error because the filter is invalid
			if (!browser.instances.length) throw new Error([`"browser.instances" was set in the config, but the array is empty. Define at least one browser config.`, ` The "browser.name" was set to "${browser.name}" which filtered all configs (${instances.map((c) => c.browser).join(", ")}). Did you mean to use another name?`].join(""));
		}
		browser.instances.forEach((instance) => {
			instance.name ??= resolved.name ? `${resolved.name} (${instance.browser})` : instance.browser;
		});
	}
	if (resolved.coverage.enabled && resolved.coverage.provider === "istanbul" && resolved.experimental?.viteModuleRunner === false) throw new Error(`"Istanbul" coverage provider is not compatible with "experimental.viteModuleRunner: false". Please, enable "viteModuleRunner" or switch to "v8" coverage provider.`);
	if (browser.enabled && resolved.detectAsyncLeaks) logger.console.warn(y.yellow("The option \"detectAsyncLeaks\" is not supported in browser mode and will be ignored."));
	resolved.coverage.reporter = resolveCoverageReporters(resolved.coverage.reporter);
	if (isAgent) {
		// default to `skipFull` and add `text-summary` reporter when `text` reporter is used on agents
		const text = resolved.coverage.reporter.find(([name]) => name === "text");
		const textSummary = resolved.coverage.reporter.find(([name]) => name === "text-summary");
		if (text) {
			text[1] = {
				skipFull: true,
				...text[1]
			};
			if (!textSummary) resolved.coverage.reporter.push(["text-summary", {}]);
		}
	}
	if (resolved.coverage.changed === void 0 && resolved.changed !== void 0) resolved.coverage.changed = resolved.changed;
	if (resolved.coverage.enabled && resolved.coverage.reportsDirectory) {
		const reportsDirectory = resolve(resolved.root, resolved.coverage.reportsDirectory);
		if (reportsDirectory === resolved.root || reportsDirectory === process.cwd()) throw new Error(`You cannot set "coverage.reportsDirectory" as ${reportsDirectory}. Vitest needs to be able to remove this directory before test run`);
		if (resolved.coverage.htmlDir) resolved.coverage.htmlDir = resolve(resolved.root, resolved.coverage.htmlDir);
		// infer default htmlDir based on builtin reporter's html output location
		if (!resolved.coverage.htmlDir) {
			const htmlReporter = resolved.coverage.reporter.find(([name]) => name === "html" || name === "html-spa");
			if (htmlReporter) {
				const [, options] = htmlReporter;
				const subdir = options && typeof options === "object" && "subdir" in options && typeof options.subdir === "string" ? options.subdir : void 0;
				resolved.coverage.htmlDir = resolve(reportsDirectory, subdir || ".");
			} else if (resolved.coverage.reporter.find(([name]) => name === "lcov")) resolved.coverage.htmlDir = resolve(reportsDirectory, "lcov-report");
		}
	}
	if (resolved.coverage.enabled && resolved.coverage.provider === "custom" && resolved.coverage.customProviderModule) resolved.coverage.customProviderModule = resolvePath(resolved.coverage.customProviderModule, resolved.root);
	resolved.expect ??= {};
	resolved.deps ??= {};
	resolved.deps.moduleDirectories ??= [];
	resolved.deps.optimizer ??= {};
	// `deps.optimizer` is keyed by Vite environment name, so `web` is a valid
	// key when the user declares that environment themselves
	// (`vite.environments.web`) - only the Vitest 3 alias for `client` is
	// silently ignored
	if (resolved.deps.optimizer.web && !viteConfig.environments.web) logger.deprecate("`deps.optimizer.web` is deprecated. Use `deps.optimizer.client` instead (or `deps.optimizer.ssr` for `node` and `edge` environments).");
	resolved.deps.optimizer.ssr ??= {};
	resolved.deps.optimizer.ssr.enabled ??= false;
	resolved.deps.optimizer.client ??= {};
	resolved.deps.optimizer.client.enabled ??= false;
	resolved.deps.web ??= {};
	resolved.deps.web.transformAssets ??= true;
	resolved.deps.web.transformCss ??= true;
	resolved.deps.web.transformGlobPattern ??= [];
	resolved.setupFiles = toArray(resolved.setupFiles || []).map((file) => resolvePath(file, resolved.root));
	resolved.globalSetup = toArray(resolved.globalSetup || []).map((file) => resolvePath(file, resolved.root));
	if (resolved.coverage.include) resolved.coverage.include = resolved.coverage.include.map((pattern) => {
		if (isDynamicPattern(pattern)) return pattern;
		// Convert patterns like ["src", "packages/server"] to ["src/**", "packages/server/**"]
		return pattern.endsWith("/") ? `${pattern}**` : `${pattern}/**`;
	});
	// Add hard-coded default coverage exclusions. These cannot be overridden by user config.
	// Override original exclude array for cases where user re-uses same object in test.exclude.
	resolved.coverage.exclude = [
		...resolved.coverage.exclude,
		...resolved.setupFiles.map((file) => `${resolved.coverage.allowExternal ? "**/" : ""}${relative(resolved.root, file)}`),
		...resolved.include.filter((pattern) => !pattern.startsWith("!")),
		resolved.config && slash(resolved.config),
		...configFiles,
		"**/virtual:*",
		"**/__x00__*",
		"**/node_modules/**"
	].filter((pattern) => typeof pattern === "string");
	resolved.forceRerunTriggers = [...resolved.forceRerunTriggers, ...resolved.setupFiles];
	if (resolved.cliExclude) resolved.exclude.push(...resolved.cliExclude);
	if (resolved.runner) resolved.runner = resolvePath(resolved.runner, resolved.root);
	resolved.attachmentsDir = resolve(resolved.root, resolved.attachmentsDir ?? ".vitest/attachments");
	if (resolved.snapshotEnvironment) resolved.snapshotEnvironment = resolvePath(resolved.snapshotEnvironment, resolved.root);
	resolved.testNamePattern = resolved.testNamePattern ? resolved.testNamePattern instanceof RegExp ? resolved.testNamePattern : new RegExp(resolved.testNamePattern) : void 0;
	if (resolved.snapshotFormat && "plugins" in resolved.snapshotFormat) {
		resolved.snapshotFormat.plugins = [];
		// TODO: support it via separate config (like DiffOptions) or via `Function.toString()`
		if (typeof resolved.snapshotFormat.compareKeys === "function") throw new TypeError(`"snapshotFormat.compareKeys" function is not supported.`);
	}
	const UPDATE_SNAPSHOT = resolved.update || process.env.UPDATE_SNAPSHOT;
	resolved.snapshotOptions = {
		expand: resolved.expandSnapshotDiff ?? false,
		snapshotFormat: resolved.snapshotFormat || {},
		updateSnapshot: UPDATE_SNAPSHOT === "all" || UPDATE_SNAPSHOT === "new" || UPDATE_SNAPSHOT === "none" ? UPDATE_SNAPSHOT : isCI && !UPDATE_SNAPSHOT ? "none" : UPDATE_SNAPSHOT ? "all" : "new",
		resolveSnapshotPath: options.resolveSnapshotPath,
		// resolved inside the worker
		snapshotEnvironment: null
	};
	resolved.snapshotSerializers ??= [];
	resolved.snapshotSerializers = resolved.snapshotSerializers.map((file) => resolvePath(file, resolved.root));
	resolved.forceRerunTriggers.push(...resolved.snapshotSerializers);
	if (options.resolveSnapshotPath) delete resolved.resolveSnapshotPath;
	resolved.execArgv ??= [];
	resolved.pool ??= "threads";
	if (resolved.pool === "vmForks" || resolved.pool === "vmThreads" || resolved.pool === "typescript") resolved.isolate = false;
	// `browser.isolate` was replaced by the top-level `isolate` option. Map it
	// (only when browser is enabled, since it was a browser-only option) so
	// existing configs keep working instead of silently falling back to the
	// isolated default (which is much slower).
	const browserIsolate = browser.enabled ? browser.isolate : void 0;
	if (browserIsolate !== void 0) {
		logger.deprecate("`browser.isolate` is deprecated. Use the top-level `isolate` option instead.");
		if (options.isolate === void 0) resolved.isolate = browserIsolate;
	}
	if (process.env.VITEST_MAX_WORKERS) resolved.maxWorkers = Number.parseInt(process.env.VITEST_MAX_WORKERS);
	if (typeof resolved.diff === "string") {
		resolved.diff = resolvePath(resolved.diff, resolved.root);
		resolved.forceRerunTriggers.push(resolved.diff);
	}
	if (options.related) resolved.related = toArray(options.related).map((file) => resolve(resolved.root, file));
	/*
	* Reporters can be defined in many different ways:
	* { reporter: 'json' }
	* { reporter: { onFinish() { method() } } }
	* { reporter: ['json', { onFinish() { method() } }] }
	* { reporter: [[ 'json' ]] }
	* { reporter: [[ 'json' ], 'html'] }
	* { reporter: [[ 'json', { outputFile: 'test.json' } ], 'html'] }
	*/
	if (resolved.reporters) if (!Array.isArray(resolved.reporters))
 // Reporter name, e.g. { reporters: 'json' }
	if (typeof resolved.reporters === "string") resolved.reporters = [[resolved.reporters, {}]];
	else resolved.reporters = [resolved.reporters];
	else {
		const reporters = resolved.reporters;
		resolved.reporters = [];
		for (const reporter of reporters) if (Array.isArray(reporter))
 // Reporter with options, e.g. { reporters: [ [ 'json', { outputFile: 'test.json' } ] ] }
		resolved.reporters.push([reporter[0], reporter[1] || {}]);
		else if (typeof reporter === "string")
 // Reporter name in array, e.g. { reporters: ["html", "json"]}
		resolved.reporters.push([reporter, {}]);
		else
 // Inline reporter, e.g. { reporter: [{ onFinish() { method() } }] }
		resolved.reporters.push(reporter);
	}
	else resolved.reporters = [];
	// it is passed down as "vitest --reporter ../reporter.js"
	const reportersFromCLI = options.reporter;
	const cliReporters = toArray(reportersFromCLI || []).map((reporter) => {
		// ./reporter.js || ../reporter.js, but not .reporters/reporter.js
		if (/^\.\.?\//.test(reporter)) return resolve(process.cwd(), reporter);
		return reporter;
	});
	if (cliReporters.length) {
		// When CLI reporters are specified, preserve options from config file
		const configReportersMap = /* @__PURE__ */ new Map();
		// Build a map of reporter names to their options from the config
		for (const reporter of resolved.reporters) if (Array.isArray(reporter)) {
			const [reporterName, reporterOptions] = reporter;
			if (typeof reporterName === "string") configReportersMap.set(reporterName, reporterOptions);
		}
		resolved.reporters = Array.from(new Set(toArray(cliReporters))).filter(Boolean).map((reporter) => [reporter, configReportersMap.get(reporter) || {}]);
	}
	// only the root resolves the label; projects receive the root's value above
	if (!globalConfig) {
		resolved.mergeReportsLabel = process.env.VITEST_BLOB_LABEL;
		for (const reporter of resolved.reporters) if (Array.isArray(reporter) && reporter[0] === "blob") {
			const options = reporter[1];
			if (options && typeof options.label === "string") resolved.mergeReportsLabel = options.label;
		}
	}
	if (resolved.changed) resolved.passWithNoTests ??= true;
	if (resolved.browser.enabled)
 // browser mode renders real CSS in the page
	resolved.css = true;
	resolved.css ??= {};
	if (typeof resolved.css === "object") {
		resolved.css.modules ??= {};
		resolved.css.modules.classNameStrategy ??= "stable";
	}
	if (resolved.cache !== false) {
		if (resolved.cache && typeof resolved.cache.dir === "string") logger.deprecate(`"cache.dir" is deprecated, use Vite's "cacheDir" instead if you want to change the cache director. Note caches will be written to "cacheDir\/vitest"`);
		resolved.cache = { dir: viteConfig.cacheDir };
	}
	resolved.sequence ??= {};
	if (resolved.sequence.shuffle && typeof resolved.sequence.shuffle === "object") {
		const { files, tests } = resolved.sequence.shuffle;
		resolved.sequence.sequencer ??= files ? RandomSequencer : BaseSequencer;
		resolved.sequence.shuffle = tests;
	}
	if (!resolved.sequence?.sequencer)
 // CLI flag has higher priority
	resolved.sequence.sequencer = resolved.sequence.shuffle ? RandomSequencer : BaseSequencer;
	resolved.sequence.groupOrder ??= 0;
	resolved.sequence.hooks ??= "stack";
	resolved.sequence.seed ??= Date.now();
	resolved.typecheck = {
		...configDefaults.typecheck,
		...resolved.typecheck
	};
	resolved.typecheck ??= {};
	resolved.typecheck.enabled ??= false;
	if (resolved.typecheck.enabled && !warnedTypeCheck) {
		warnedTypeCheck = true;
		logger.console.warn(y.yellow("Testing types with tsc and vue-tsc is an experimental feature.\nBreaking changes might not follow SemVer, please pin Vitest's version when using it."));
	}
	resolved.browser.enabled ??= false;
	resolved.browser.headless ??= isCI;
	// disable in headless mode by default, and if CI is detected
	resolved.browser.ui ??= resolved.browser.headless === true ? false : !isCI;
	resolved.browser.commands ??= {};
	resolved.browser.detailsPanelPosition ??= "right";
	if (resolved.browser.screenshotDirectory) resolved.browser.screenshotDirectory = resolve(resolved.root, resolved.browser.screenshotDirectory);
	if (resolved.inspector.enabled) resolved.browser.trackUnhandledErrors ??= false;
	resolved.browser.viewport ??= {};
	resolved.browser.viewport.width ??= 414;
	resolved.browser.viewport.height ??= 896;
	resolved.browser.locators ??= {};
	resolved.browser.locators.testIdAttribute ??= "data-testid";
	resolved.browser.locators.exact ??= true;
	resolved.browser.locators.errorFormat ??= "all";
	if (typeof resolved.browser.provider === "string") {
		const source = `@vitest/browser-${resolved.browser.provider}`;
		throw new TypeError(`The \`browser.provider\` configuration was changed to accept a factory instead of a string. Add an import of "${resolved.browser.provider}" from "${source}" instead. See: https://vitest.dev/config/browser/provider`);
	}
	const isPreview = resolved.browser.provider?.name === "preview";
	if (!isPreview && resolved.browser.enabled && provider === "stackblitz") throw new Error(`stackblitz environment does not support the ${resolved.browser.provider?.name} provider. Please, use "@vitest/browser-preview" instead.`);
	if (isPreview && resolved.browser.screenshotFailures === true) {
		console.warn(y.yellow([
			`Browser provider "preview" doesn't support screenshots, `,
			`so "browser.screenshotFailures" option is forcefully disabled. `,
			`Set "browser.screenshotFailures" to false or remove it from the config to suppress this warning.`
		].join("")));
		resolved.browser.screenshotFailures = false;
	} else resolved.browser.screenshotFailures ??= !isPreview && !resolved.browser.ui;
	if (resolved.browser.provider && resolved.browser.provider.options == null) resolved.browser.provider.options = {};
	if ("api" in resolved.browser) logger.deprecate("`test.browser.api` was deprecated in Vitest 5. Use `test.api` instead.");
	// enable includeTaskLocation by default in UI mode
	if (resolved.browser.enabled) {
		if (resolved.browser.ui) resolved.includeTaskLocation ??= true;
	} else if (resolved.ui) resolved.includeTaskLocation ??= true;
	if (typeof resolved.browser.trace === "string" || !resolved.browser.trace) resolved.browser.trace = { mode: resolved.browser.trace || "off" };
	const traceView = resolved.browser.traceView;
	resolved.browser.traceView = typeof traceView === "object" ? {
		enabled: traceView.enabled ?? false,
		recordCanvas: traceView.recordCanvas ?? false,
		inlineImages: traceView.inlineImages ?? false
	} : {
		enabled: traceView ?? false,
		recordCanvas: false,
		inlineImages: false
	};
	if (resolved.browser.enabled && resolved.browser.traceView.enabled) resolved.browser.detailsPanelPosition = "bottom";
	if (resolved.browser.trace.tracesDir != null) resolved.browser.trace.tracesDir = resolvePath(resolved.browser.trace.tracesDir, resolved.root);
	if (toArray(resolved.reporters).some((reporter) => {
		if (Array.isArray(reporter)) return reporter[0] === "html";
		return false;
	})) resolved.includeTaskLocation ??= true;
	else if (resolved.browser.enabled && resolved.browser.traceView.enabled && !resolved.watch) logger.console.warn(y.yellow(withLabel("yellow", "Vitest", "--browser.traceView is enabled without the HTML reporter.")));
	resolved.server ??= {};
	resolved.server.deps ??= {};
	if (resolved.server.debug?.dump || process.env.VITEST_DEBUG_DUMP) {
		const userFolder = resolved.server.debug?.dump || process.env.VITEST_DEBUG_DUMP;
		resolved.dumpDir = resolve(resolved.root, typeof userFolder === "string" && userFolder !== "true" ? userFolder : ".vitest-dump", resolved.name || "root");
	}
	resolved.testTimeout ??= resolved.browser.enabled ? 15e3 : 5e3;
	resolved.hookTimeout ??= resolved.browser.enabled ? 3e4 : 1e4;
	resolved.experimental ??= {};
	resolved.sharedViteServer ??= true;
	if (resolved.experimental.openTelemetry?.sdkPath) {
		const sdkPath = resolve(resolved.root, resolved.experimental.openTelemetry.sdkPath);
		resolved.experimental.openTelemetry.sdkPath = pathToFileURL(sdkPath).toString();
	}
	if (resolved.experimental.openTelemetry?.browserSdkPath) {
		const browserSdkPath = resolve(resolved.root, resolved.experimental.openTelemetry.browserSdkPath);
		resolved.experimental.openTelemetry.browserSdkPath = browserSdkPath;
	}
	resolved.experimental.importDurations ??= {};
	resolved.experimental.importDurations.print ??= false;
	resolved.experimental.importDurations.failOnDanger ??= false;
	if (resolved.experimental.importDurations.limit == null) {
		const shouldCollect = resolved.experimental.importDurations.print || resolved.experimental.importDurations.failOnDanger || resolved.ui;
		resolved.experimental.importDurations.limit = shouldCollect ? 10 : 0;
	}
	resolved.experimental.importDurations.thresholds ??= {};
	resolved.experimental.importDurations.thresholds.warn ??= 100;
	resolved.experimental.importDurations.thresholds.danger ??= 500;
	const diagnostics = resolved.experimental.diagnostics ?? true;
	resolved.experimental.diagnostics = typeof diagnostics === "boolean" ? {
		isolate: diagnostics,
		environment: diagnostics,
		import: diagnostics,
		transform: diagnostics
	} : {
		isolate: diagnostics.isolate ?? true,
		environment: diagnostics.environment ?? true,
		import: diagnostics.import ?? true,
		transform: diagnostics.transform ?? true
	};
	if (typeof resolved.experimental.vcsProvider === "string" && resolved.experimental.vcsProvider !== "git") resolved.experimental.vcsProvider = resolvePath(resolved.experimental.vcsProvider, resolved.root);
	// `experimental.fsModuleCache` / `experimental.fsModuleCachePath` were promoted to
	// the top-level `fsModuleCache` / `fsModuleCachePath` options.
	const legacyExperimental = options.experimental;
	if (legacyExperimental?.fsModuleCache != null) {
		logger.deprecate("`experimental.fsModuleCache` is deprecated. Use the top-level `fsModuleCache` option instead.");
		if (options.fsModuleCache === void 0) resolved.fsModuleCache = legacyExperimental.fsModuleCache;
	}
	if (legacyExperimental?.fsModuleCachePath != null) {
		logger.deprecate("`experimental.fsModuleCachePath` is deprecated. Use the top-level `fsModuleCachePath` option instead.");
		if (options.fsModuleCachePath === void 0) resolved.fsModuleCachePath = legacyExperimental.fsModuleCachePath;
	}
	resolved.fsModuleCache ??= false;
	if (resolved.fsModuleCachePath) resolved.fsModuleCachePath = resolve(resolved.root, resolved.fsModuleCachePath);
	return resolved;
}
/**
* Captures `config.test` before any Vitest plugin modifies it. Inline projects
* that share this config's Vite server resolve against the captured value
* instead of re-executing the config file (`sharedViteServer`).
*
* Must be the first inline plugin. The consumer must clear
* `captures.rawTestConfig` after storing it because the server retains the plugin.
*/
function CaptureRawTestConfig(captures, capture) {
	return {
		name: "vitest:capture-raw-test-config",
		enforce: "pre",
		config: {
			order: "pre",
			handler(config) {
				if (!(capture ?? config.test?.sharedViteServer ?? true)) return;
				const { projects, ...test } = config.test ?? {};
				// the captured config is only read when this config's inline
				// projects are resolved; without `projects` there is nothing to
				// read it (`injectTestProjects` then resolves through Vite instead)
				if (projects === void 0) return;
				// cloned so mutations from later hooks and from the test-config
				// resolution never reach the captured value; `projects` is left out
				// because it is never inherited and can be the largest part of the config
				captures.rawTestConfig = deepClone(test);
			}
		}
	};
}
function resolveConfigPath(root, options) {
	if (options.config === false) return false;
	if (options.config) return resolveModule(options.config, { paths: [root] }) ?? resolve(root, options.config);
	return findConfigFile(root);
}
async function resolveConfig$1(options = {}, viteOverrides = {}, pluginsHarness = new PluginHarness()) {
	// We clone CLI Options and Vite overrides to reuse when a watch mode is triggered.
	const cliOptionsCopy = deepMerge({}, options);
	const viteOverridesCopy = deepMerge({}, viteOverrides);
	const configPath = resolveConfigPath(
		// try to find the config relative to `--root` or process.cwd()
		resolve(options.root || process.cwd()),
		options
	);
	options.config = configPath;
	const captures = {};
	const inlineConfig = mergeConfig({
		configFile: configPath,
		configLoader: options.configLoader,
		mode: options.mode || "test",
		plugins: [
			CaptureRawTestConfig(captures, cliOptionsCopy.sharedViteServer),
			...TestConfigPlugin(pluginsHarness, captures, cliOptionsCopy),
			...ViteConfigPlugin(pluginsHarness),
			...VitestCorePlugin(pluginsHarness),
			...BrowserLoaderPlugin(captures, pluginsHarness)
		]
	}, viteOverrides);
	const rootViteConfig = await resolveConfig$2(inlineConfig, "serve");
	const rootConfig = resolveTestConfig(pluginsHarness.logger, rootViteConfig.test || {}, rootViteConfig);
	rootViteConfig.test = rootConfig;
	rootViteConfig.server.fs.allow.push(...resolveFsAllow(rootViteConfig.root, rootViteConfig.configFile));
	rootViteConfig.server.fs.deny.push(API_TOKEN_FILE);
	// the server has been created, we don't need to override vite.server options
	const { token, tokenCreated } = resolveApiToken(rootViteConfig.root);
	rootConfig.api.token = token;
	rootConfig.api.tokenCreated = tokenCreated;
	if (rootConfig.ui && rootConfig.open)
 // Note: `tokenCreated` is only an approximation of "the browser is not
	// authenticated yet". If the user clears cookies while the token file
	// persists, the clean URL will block until they re-open the `?token=`
	// URL printed in the terminal.
	if (rootConfig.api.tokenCreated) {
		// First run that generated the token: no browser holds the auth
		// cookie yet, so open the authenticated URL to set it. A new tab
		// here is fine since no clean-URL tab exists to reuse.
		const url = new URL(rootConfig.uiBase, "http://localhost");
		url.searchParams.set("token", rootConfig.api.token);
		rootViteConfig.server.open = `${url.pathname}${url.search}`;
	} else
 // Subsequent runs: open the clean UI base URL (without `?token=`)
	// rather than the authenticated URL printed by the logger. On macOS,
	// `openBrowser` reuses an existing tab whose URL matches via substring
	// and reloads it (Vite's `bin/openChrome.js`). Since the 302 redirect
	// strips the token, an already-authenticated tab lives at the clean
	// URL, so opening the clean URL matches and reloads it; opening the
	// token URL would never match and would spawn a new tab on every
	// restart.
	rootViteConfig.server.open = rootConfig.uiBase;
	rootConfig.cliOptions = cliOptionsCopy;
	rootConfig.viteOverrides = viteOverridesCopy;
	rootConfig._browserContribution = captures.browserContribution;
	// projects never inherit `tagsFilter` and `browser` from the programmatic
	// config (see `inheritRootViteOverrides`), so remove them from the base too
	if (captures.rawTestConfig) {
		const overridesTest = viteOverridesCopy.test;
		if (overridesTest?.tagsFilter !== void 0) delete captures.rawTestConfig.tagsFilter;
		if (overridesTest?.browser !== void 0) delete captures.rawTestConfig.browser;
	}
	// the root keeps the config for the whole session so `injectTestProjects`
	// can resolve shared-server projects at any point
	rootConfig._rawTestConfig = captures.rawTestConfig;
	rootConfig._moduleRunnerOptions = captures.moduleRunnerOptions;
	// `captures` lives as long as the server that keeps its plugins,
	// so it should not hold onto the config
	captures.rawTestConfig = void 0;
	rootConfig.resolvedProjects = await resolveProjectEntries(pluginsHarness, rootViteConfig, rootConfig, rootConfig.projects);
	return rootViteConfig;
}
function resolveCoverageReporters(configReporters) {
	// E.g. { reporter: "html" }
	if (!Array.isArray(configReporters)) return [[configReporters, {}]];
	const resolvedReporters = [];
	for (const reporter of configReporters) if (Array.isArray(reporter))
 // E.g. { reporter: [ ["html", { skipEmpty: true }], ["lcov"], ["json", { file: "map.json" }] ]}
	resolvedReporters.push([reporter[0], reporter[1] || {}]);
	else
 // E.g. { reporter: ["html", "json"]}
	resolvedReporters.push([reporter, {}]);
	return resolvedReporters;
}
function matchesProjectFilter(projects, name) {
	// no filters applied, any project can be included
	if (!projects.length) return true;
	if (isExcludedByProjectFilter(projects, name)) return false;
	const positives = projects.filter((project) => !project.startsWith("!"));
	return !positives.length || positives.some((project) => {
		return wildcardPatternToRegExp(project).test(name);
	});
}
function isExcludedByProjectFilter(projects, name) {
	if (!projects.length) return false;
	return projects.some((project) => {
		if (!project.startsWith("!")) return false;
		const positivePattern = project.slice(1);
		return wildcardPatternToRegExp(positivePattern).test(name);
	});
}

const THRESHOLD_KEYS = [
	"lines",
	"functions",
	"statements",
	"branches"
];
const GLOBAL_THRESHOLDS_KEY = "global";
const DEFAULT_PROJECT = Symbol.for("default-project");
async function getCoverageProvider(options, loader) {
	const coverageModule = await resolveCoverageProviderModule(options, loader);
	if (coverageModule) return coverageModule.getProvider();
	return null;
}
class BaseCoverageProvider {
	ctx;
	name;
	version;
	options;
	globCache = /* @__PURE__ */ new Map();
	autoUpdateMarker = "\n// __VITEST_COVERAGE_MARKER__";
	globMatchers;
	coverageFiles = /* @__PURE__ */ new Map();
	coverageFilesDirectory;
	reportsDirectoryLock;
	roots = [];
	changedFiles;
	_initialize(ctx) {
		this.ctx = ctx;
		if (ctx.version !== this.version) ctx.logger.warn(y.yellow(`Loaded ${y.inverse(y.yellow(` vitest@${ctx.version} `))} and ${y.inverse(y.yellow(` @vitest/coverage-${this.name}@${this.version} `))}.
Running mixed versions is not supported and may lead into bugs
Update your dependencies and make sure the versions match.`));
		const config = ctx._coverageOptions;
		this.globMatchers = void 0;
		this.options = {
			...coverageConfigDefaults,
			// User's options
			...config,
			// Resolved fields
			provider: this.name,
			reportsDirectory: resolve(ctx.config.root, config.reportsDirectory || coverageConfigDefaults.reportsDirectory),
			reporter: resolveCoverageReporters(config.reporter || coverageConfigDefaults.reporter),
			thresholds: config.thresholds && {
				...config.thresholds,
				lines: config.thresholds["100"] ? 100 : config.thresholds.lines,
				branches: config.thresholds["100"] ? 100 : config.thresholds.branches,
				functions: config.thresholds["100"] ? 100 : config.thresholds.functions,
				statements: config.thresholds["100"] ? 100 : config.thresholds.statements
			}
		};
		this.coverageFilesDirectory = getCoverageFilesDirectory(this.options.reportsDirectory, this.ctx.config.shard);
		this.reportsDirectoryLock = new ReportsDirectoryLock(resolve(this.options.reportsDirectory));
		// If --project filter is set pick only roots of resolved projects
		this.roots = ctx.config.project?.length ? [...new Set(ctx.projects.map((project) => project.config.root))] : [ctx.config.root];
	}
	/**
	* Check if file matches `coverage.include` but not `coverage.exclude`
	*/
	isIncluded(_filename, root) {
		const roots = root ? [root] : this.roots;
		const filename = slash(cleanUrl(_filename));
		const cacheHit = this.globCache.get(filename);
		if (cacheHit !== void 0) return cacheHit;
		const matchingRoot = roots.find((root) => filename.startsWith(`${slash(root)}/`) || filename === slash(root));
		// File outside project root with default allowExternal
		if (this.options.allowExternal === false && !matchingRoot) {
			this.globCache.set(filename, false);
			return false;
		}
		const relativeFilename = matchingRoot ? relative(matchingRoot, filename) : filename;
		const { matchExclude, matchInclude } = this.getGlobMatchers();
		if (matchExclude(relativeFilename)) {
			this.globCache.set(filename, false);
			return false;
		}
		// By default `coverage.include` matches all files, except "coverage.exclude"
		let included = matchInclude(relativeFilename);
		if (included && this.changedFiles) included = this.changedFiles.includes(filename);
		this.globCache.set(filename, included);
		return included;
	}
	/**
	* Compile `coverage.include`/`coverage.exclude` into reusable matchers once.
	* `picomatch.isMatch(file, patterns, options)` recompiles the patterns on
	* every call, which dominates the filtering step on large test suites.
	*/
	getGlobMatchers() {
		if (!this.globMatchers) {
			const exclude = this.options.exclude;
			const include = this.options.include;
			this.globMatchers = {
				matchExclude: exclude.length ? pm(exclude, { dot: true }) : () => false,
				matchInclude: include ? pm(include, {
					dot: true,
					ignore: exclude
				}) : () => true
			};
		}
		return this.globMatchers;
	}
	async getUntestedFilesByRoot(testedFiles, include, root) {
		let includedFiles = await glob(include, {
			cwd: root,
			ignore: [...this.options.exclude, ...testedFiles.map((file) => slash(file))],
			absolute: true,
			dot: true,
			onlyFiles: true
		});
		// Run again through picomatch as tinyglobby's exclude pattern is different ({ "exclude": ["math"] } should ignore "src/math.ts")
		includedFiles = includedFiles.filter((file) => this.isIncluded(file, root));
		if (this.changedFiles) includedFiles = this.changedFiles.filter((file) => includedFiles.includes(file));
		return includedFiles.map((file) => slash(path.resolve(root, file)));
	}
	async getUntestedFiles(testedFiles) {
		if (this.options.include == null) return [];
		const rootMapper = this.getUntestedFilesByRoot.bind(this, testedFiles, this.options.include);
		return (await Promise.all(this.roots.map(rootMapper))).flatMap((files) => files);
	}
	createCoverageMap() {
		throw new Error("BaseReporter's createCoverageMap was not overwritten");
	}
	async generateReports(_, __) {
		throw new Error("BaseReporter's generateReports was not overwritten");
	}
	async parseConfigModule(_) {
		throw new Error("BaseReporter's parseConfigModule was not overwritten");
	}
	resolveOptions() {
		return this.options;
	}
	async clean(clean = true) {
		await this.reportsDirectoryLock.acquire();
		if (clean && existsSync(this.options.reportsDirectory)) await promises.rm(this.options.reportsDirectory, {
			recursive: true,
			force: true,
			maxRetries: 10
		});
		if (existsSync(this.coverageFilesDirectory)) await promises.rm(this.coverageFilesDirectory, {
			recursive: true,
			force: true,
			maxRetries: 10
		});
		await promises.mkdir(this.coverageFilesDirectory, { recursive: true });
		this.coverageFiles = /* @__PURE__ */ new Map();
	}
	onAfterSuiteRun({ coverage, environment, projectName, testFiles }) {
		if (!coverage) return;
		if (typeof coverage !== "string") throw new TypeError(`Expected string coverage payload, received ${typeof coverage}, ${JSON.stringify(coverage)}`);
		const filename = coverage;
		let entry = this.coverageFiles.get(projectName || DEFAULT_PROJECT);
		if (!entry) {
			entry = {};
			this.coverageFiles.set(projectName || DEFAULT_PROJECT, entry);
		}
		const testFilenames = testFiles.join();
		entry[environment] ??= {};
		// If there's a result from previous run, overwrite it
		entry[environment][testFilenames] = filename;
	}
	async readCoverageFiles({ onFileRead, onFinished, onDebug }) {
		let index = 0;
		const total = this.coverageFiles.size;
		for (const [projectName, coveragePerProject] of this.coverageFiles.entries()) for (const [environment, coverageByTestfiles] of Object.entries(coveragePerProject)) {
			const filenames = Object.values(coverageByTestfiles);
			const project = this.ctx.getProjectByName(projectName);
			for (const chunk of this.toSlices(filenames, this.options.processingConcurrency)) {
				if (onDebug.enabled) {
					index += chunk.length;
					onDebug(`Reading coverage results ${index}/${total}`);
				}
				await Promise.all(chunk.map(async (filename) => {
					const contents = await promises.readFile(filename, "utf-8");
					onFileRead(JSON.parse(contents));
				}));
			}
			await onFinished(project, environment);
		}
	}
	async cleanAfterRun() {
		try {
			this.coverageFiles = /* @__PURE__ */ new Map();
			await promises.rm(this.coverageFilesDirectory, { recursive: true });
			// Remove empty reports directory, e.g. when only text-reporter is used
			if (readdirSync(this.options.reportsDirectory).length === 0) await promises.rm(this.options.reportsDirectory, { recursive: true });
		} finally {
			await this.reportsDirectoryLock.release();
		}
	}
	async onTestRunStart() {
		if (this.options.changed) try {
			const changedFiles = await this.ctx.vcs.findChangedFiles({
				root: this.ctx.config.root,
				changedSince: this.options.changed
			});
			this.changedFiles = changedFiles;
		} catch {
			this.changedFiles = void 0;
		}
		else if (this.ctx.config.changed) this.changedFiles = this.ctx.config.related;
		if (this.changedFiles) this.globCache.clear();
	}
	async onTestFailure() {
		if (!this.options.reportOnFailure) await this.cleanAfterRun();
	}
	async reportCoverage(coverageMap, { allTestsRun }) {
		await this.generateReports(coverageMap || this.createCoverageMap(), allTestsRun);
		if (!(!this.options.cleanOnRerun && this.ctx.config.watch)) await this.cleanAfterRun();
	}
	async reportThresholds(coverageMap, allTestsRun) {
		const resolvedThresholds = this.resolveThresholds(coverageMap);
		this.checkThresholds(resolvedThresholds);
		if (this.options.thresholds?.autoUpdate && allTestsRun) {
			if (!this.ctx.vite.config.configFile) throw new Error("Missing configurationFile. The \"coverage.thresholds.autoUpdate\" can only be enabled when configuration file is used.");
			const configFilePath = this.ctx.vite.config.configFile;
			const configModule = await this.parseConfigModule(configFilePath);
			await this.updateThresholds({
				thresholds: resolvedThresholds,
				configurationFile: configModule,
				onUpdate: () => writeFileSync(configFilePath, configModule.generate().code.replace(this.autoUpdateMarker, ""), "utf-8")
			});
		}
	}
	/**
	* Constructs collected coverage and users' threshold options into separate sets
	* where each threshold set holds their own coverage maps. Threshold set is either
	* for specific files defined by glob pattern or global for all other files.
	*/
	resolveThresholds(coverageMap) {
		const resolvedThresholds = [];
		const files = coverageMap.files();
		const globalCoverageMap = this.createCoverageMap();
		for (const key of Object.keys(this.options.thresholds)) {
			if (key === "perFile" || key === "autoUpdate" || key === "100" || THRESHOLD_KEYS.includes(key)) continue;
			const glob = key;
			const globEntry = this.options.thresholds[glob];
			const globThresholds = resolveGlobThresholds(globEntry);
			const globCoverageMap = this.createCoverageMap();
			const matcher = pm(glob);
			const matchingFiles = files.filter((file) => matcher(relative(this.ctx.config.root, file)));
			for (const file of matchingFiles) {
				const fileCoverage = coverageMap.fileCoverageFor(file);
				globCoverageMap.addFileCoverage(fileCoverage);
			}
			resolvedThresholds.push({
				name: glob,
				coverageMap: globCoverageMap,
				thresholds: globThresholds,
				...resolvePerFile(globEntry)
			});
		}
		// Global threshold is for all files, even if they are included by glob patterns
		for (const file of files) {
			const fileCoverage = coverageMap.fileCoverageFor(file);
			globalCoverageMap.addFileCoverage(fileCoverage);
		}
		resolvedThresholds.unshift({
			name: GLOBAL_THRESHOLDS_KEY,
			coverageMap: globalCoverageMap,
			thresholds: {
				branches: this.options.thresholds?.branches,
				functions: this.options.thresholds?.functions,
				lines: this.options.thresholds?.lines,
				statements: this.options.thresholds?.statements
			},
			...resolvePerFile(this.options.thresholds)
		});
		return resolvedThresholds;
	}
	/**
	* Check collected coverage against configured thresholds. Sets exit code to 1 when thresholds not reached.
	*/
	checkThresholds(allThresholds) {
		for (const { coverageMap, thresholds, perFile, perFileThresholds, name } of allThresholds) {
			const groups = [];
			if (!perFile) groups.push({
				file: null,
				thresholds,
				summary: coverageMap.getCoverageSummary(),
				name: name === GLOBAL_THRESHOLDS_KEY ? name : `"${name}"`
			});
			if (perFile) for (const file of coverageMap.files().sort()) groups.push({
				file,
				thresholds,
				summary: coverageMap.fileCoverageFor(file).toSummary(),
				name: name === GLOBAL_THRESHOLDS_KEY ? name : `"${name}"`
			});
			if (perFileThresholds) for (const file of coverageMap.files().sort()) groups.push({
				file,
				thresholds: perFileThresholds,
				summary: coverageMap.fileCoverageFor(file).toSummary(),
				name: "per-file"
			});
			for (const group of groups) {
				if (group.thresholds.branches === void 0 && group.thresholds.functions === void 0 && group.thresholds.lines === void 0 && group.thresholds.statements === void 0) continue;
				this.reportThresholdViolations(group.thresholds, group.summary, group.file, group.name);
			}
		}
	}
	reportThresholdViolations(thresholds, summary, file, label) {
		for (const thresholdKey of THRESHOLD_KEYS) {
			const threshold = thresholds[thresholdKey];
			if (threshold === void 0) continue;
			/**
			* Positive thresholds are treated as minimum coverage percentages (X means: X% of lines must be covered),
			* while negative thresholds are treated as maximum uncovered counts (-X means: X lines may be uncovered).
			*/
			if (threshold >= 0) {
				const coverage = summary.data[thresholdKey].pct;
				if (coverage < threshold) {
					process.exitCode = 1;
					let errorMessage = `ERROR: Coverage for ${thresholdKey} (${coverage}%) does not meet ${label} threshold (${threshold}%)`;
					if (file) errorMessage += ` for ${relative("./", file).replace(/\\/g, "/")}`;
					this.ctx.logger.error(errorMessage);
				}
			} else {
				const uncovered = summary.data[thresholdKey].total - summary.data[thresholdKey].covered;
				const absoluteThreshold = threshold * -1;
				if (uncovered > absoluteThreshold) {
					process.exitCode = 1;
					let errorMessage = `ERROR: Uncovered ${thresholdKey} (${uncovered}) exceed ${label} threshold (${absoluteThreshold})`;
					if (file) errorMessage += ` for ${relative("./", file).replace(/\\/g, "/")}`;
					this.ctx.logger.error(errorMessage);
				}
			}
		}
	}
	/**
	* Check if current coverage is above configured thresholds and bump the thresholds if needed
	*/
	async updateThresholds({ thresholds: allThresholds, onUpdate, configurationFile }) {
		let updatedThresholds = false;
		const config = resolveConfig(configurationFile);
		assertConfigurationModule(config);
		for (const { coverageMap, thresholds, name, perFile } of allThresholds) {
			const summaries = perFile ? coverageMap.files().map((file) => coverageMap.fileCoverageFor(file).toSummary()) : [coverageMap.getCoverageSummary()];
			// A `perFile` glob may match no files; skip it instead of writing
			// Infinity thresholds from `Math.min(...[])`.
			if (summaries.length === 0) continue;
			const thresholdsToUpdate = [];
			for (const key of THRESHOLD_KEYS) {
				const threshold = thresholds[key] ?? 100;
				/**
				* Positive thresholds are treated as minimum coverage percentages (X means: X% of lines must be covered),
				* while negative thresholds are treated as maximum uncovered counts (-X means: X lines may be uncovered).
				*/
				if (threshold >= 0) {
					const actual = Math.min(...summaries.map((summary) => summary[key].pct));
					if (actual > threshold) thresholdsToUpdate.push([
						key,
						actual,
						threshold
					]);
				} else {
					const absoluteThreshold = threshold * -1;
					const actual = Math.max(...summaries.map((summary) => summary[key].total - summary[key].covered));
					if (actual < absoluteThreshold) {
						// If everything was covered, set new threshold to 100% (since a threshold of 0 would be considered as 0%)
						const updatedThreshold = actual === 0 ? 100 : actual * -1;
						thresholdsToUpdate.push([
							key,
							updatedThreshold,
							threshold
						]);
					}
				}
			}
			if (thresholdsToUpdate.length === 0) continue;
			updatedThresholds = true;
			const thresholdFormatter = typeof this.options.thresholds?.autoUpdate === "function" ? this.options.thresholds?.autoUpdate : (value) => value;
			for (const [threshold, newValue, previousValue] of thresholdsToUpdate) {
				const formattedValue = thresholdFormatter(newValue, previousValue);
				if (name === GLOBAL_THRESHOLDS_KEY) config.test.coverage.thresholds[threshold] = formattedValue;
				else {
					const glob = config.test.coverage.thresholds[name];
					glob[threshold] = formattedValue;
				}
			}
		}
		if (updatedThresholds) {
			this.ctx.logger.log("Updating thresholds to configuration file. You may want to push with updated coverage thresholds.");
			onUpdate();
		}
	}
	async mergeReports(coverageMaps) {
		const coverageMap = this.createCoverageMap();
		for (const coverage of coverageMaps) coverageMap.merge(coverage);
		await this.generateReports(coverageMap, true);
	}
	hasTerminalReporter(reporters) {
		return reporters.some(([reporter]) => reporter === "text" || reporter === "text-summary" || reporter === "text-lcov" || reporter === "teamcity");
	}
	toSlices(array, size) {
		return array.reduce((chunks, item) => {
			const index = Math.max(0, chunks.length - 1);
			const lastChunk = chunks[index] || [];
			chunks[index] = lastChunk;
			if (lastChunk.length >= size) chunks.push([item]);
			else lastChunk.push(item);
			return chunks;
		}, []);
	}
	// TODO: should this be abstracted in `project`/`vitest` instead?
	// if we decide to keep `viteModuleRunner: false`, we will need to abstract transformation in both main thread and tests
	// custom --import=module.registerHooks need to be transformed as well somehow
	async transformFile(url, project, viteEnvironment, isTransformedByVite = true) {
		const config = project.config;
		// vite is disabled, should transform manually if possible
		if (config.experimental.viteModuleRunner === false || !isTransformedByVite) {
			const pathname = url.split("?")[0];
			const filename = pathname.startsWith("file://") ? fileURLToPath(pathname) : pathname;
			const extension = path.extname(filename);
			if (!(extension === ".ts" || extension === ".mts" || extension === ".cts")) return {
				code: await promises.readFile(filename, "utf-8"),
				map: null
			};
			if (!module$1.stripTypeScriptTypes) throw new Error(`Cannot parse '${url}' because "module.stripTypeScriptTypes" is not supported. TypeScript coverage requires Node.js 22.15 or higher. This is NOT a bug of Vitest.`);
			const isTransform = process.execArgv.includes("--experimental-transform-types") || config.execArgv.includes("--experimental-transform-types") || process.env.NODE_OPTIONS?.includes("--experimental-transform-types") || config.env?.NODE_OPTIONS?.includes("--experimental-transform-types");
			const code = await promises.readFile(filename, "utf-8");
			return {
				// `transform` mode will inject source maps comment at the end
				code: module$1.stripTypeScriptTypes(code, { mode: isTransform ? "transform" : "strip" }),
				map: null
			};
		}
		return project.vite.environments[viteEnvironment].transformRequest(url);
	}
	createUncoveredFileTransformer(ctx) {
		const projects = /* @__PURE__ */ new Set([...ctx.projects, ctx.getRootProject()]);
		return async (filename) => {
			let lastError;
			for (const project of projects) {
				const root = project.config.root;
				// On Windows root doesn't start with "/" while filenames do
				if (!filename.startsWith(root) && !filename.startsWith(`/${root}`)) continue;
				try {
					const environment = project.config.environment;
					const viteEnvironment = environment === "jsdom" || environment === "happy-dom" || project.isBrowserEnabled() ? "client" : "ssr";
					return await this.transformFile(filename, project, viteEnvironment);
				} catch (err) {
					lastError = err;
				}
			}
			// All vite servers failed to transform the file
			throw lastError;
		};
	}
}
function resolvePerFile(thresholds) {
	if (!thresholds || typeof thresholds !== "object" || !("perFile" in thresholds)) return {
		perFile: false,
		perFileThresholds: null
	};
	const { perFile } = thresholds;
	if (perFile === true) return {
		perFile: true,
		perFileThresholds: null
	};
	if (perFile && typeof perFile === "object") return {
		perFile: false,
		perFileThresholds: resolveGlobThresholds(perFile)
	};
	return {
		perFile: false,
		perFileThresholds: null
	};
}
/**
* Narrow down `unknown` glob thresholds to resolved ones
*/
function resolveGlobThresholds(thresholds) {
	if (!thresholds || typeof thresholds !== "object") return {};
	if (100 in thresholds && thresholds[100] === true) return {
		lines: 100,
		branches: 100,
		functions: 100,
		statements: 100
	};
	return {
		lines: "lines" in thresholds && typeof thresholds.lines === "number" ? thresholds.lines : void 0,
		branches: "branches" in thresholds && typeof thresholds.branches === "number" ? thresholds.branches : void 0,
		functions: "functions" in thresholds && typeof thresholds.functions === "number" ? thresholds.functions : void 0,
		statements: "statements" in thresholds && typeof thresholds.statements === "number" ? thresholds.statements : void 0
	};
}
function assertConfigurationModule(config) {
	try {
		// @ts-expect-error -- Intentional unsafe null pointer check as wrapped in try-catch
		if (typeof config.test.coverage.thresholds !== "object") throw new TypeError("Expected config.test.coverage.thresholds to be an object");
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Unable to parse thresholds from configuration file: ${message}`);
	}
}
function resolveConfig(configModule) {
	const mod = configModule.exports.default;
	try {
		// Check for "export default { test: {...} }"
		if (mod.$type === "object") return mod;
		// "export default defineConfig(...)"
		let config = resolveDefineConfig(mod);
		if (config) return config;
		// "export default mergeConfig(..., defineConfig(...))"
		if (mod.$type === "function-call" && mod.$callee === "mergeConfig") {
			config = resolveMergeConfig(mod);
			if (config) return config;
		}
	} catch (error) {
		// Reduce magicast's verbose errors to readable ones
		throw new Error(error instanceof Error ? error.message : String(error));
	}
	throw new Error("Failed to update coverage thresholds. Configuration file is too complex.");
}
function resolveDefineConfig(mod) {
	if (mod.$type === "function-call" && mod.$callee === "defineConfig") {
		// "export default defineConfig({ test: {...} })"
		if (mod.$args[0].$type === "object") return mod.$args[0];
		if (mod.$args[0].$type === "arrow-function-expression") {
			if (mod.$args[0].$body.$type === "object")
 // "export default defineConfig(() => ({ test: {...} }))"
			return mod.$args[0].$body;
			// "export default defineConfig(() => mergeConfig({...}, ...))"
			const config = resolveMergeConfig(mod.$args[0].$body);
			if (config) return config;
		}
	}
}
function resolveMergeConfig(mod) {
	if (mod.$type === "function-call" && mod.$callee === "mergeConfig") for (const arg of mod.$args) {
		const config = resolveDefineConfig(arg);
		if (config) return config;
	}
}
class ReportsDirectoryLock {
	reportsDirectory;
	lockFile;
	constructor(reportsDirectory) {
		this.reportsDirectory = reportsDirectory;
		const hash = createHash("sha256").update(reportsDirectory).digest("hex").slice(0, 16);
		this.lockFile = resolve(tmpdir(), `vitest-coverage-${hash}.lock`);
	}
	async acquire() {
		if (await this.tryWrite()) return;
		const owner = await this.readOwner();
		// We already hold the lock for this directory (e.g. watch-mode reruns).
		if (owner?.pid === process.pid) return;
		// Another running Vitest owns this directory.
		if (owner && isProcessAlive(owner.pid)) throw this.inUseError(owner);
		// The lock was left behind by a process that no longer exists. Reclaim it.
		await promises.rm(this.lockFile, { force: true });
		if (!await this.tryWrite()) throw this.inUseError(await this.readOwner());
	}
	async release() {
		if ((await this.readOwner())?.pid === process.pid) await promises.rm(this.lockFile, { force: true });
	}
	async tryWrite() {
		const payload = JSON.stringify({
			pid: process.pid,
			reportsDirectory: this.reportsDirectory
		});
		try {
			// `wx` fails with EEXIST if the file already exists, so only one process wins.
			await promises.writeFile(this.lockFile, payload, { flag: "wx" });
			return true;
		} catch (error) {
			if (error.code === "EEXIST") return false;
			throw error;
		}
	}
	async readOwner() {
		try {
			const owner = JSON.parse(await promises.readFile(this.lockFile, "utf-8"));
			return typeof owner?.pid === "number" ? owner : null;
		} catch {
			return null;
		}
	}
	inUseError(owner) {
		return /* @__PURE__ */ new Error(`The coverage report directory "${this.reportsDirectory}" is already in use by another Vitest process${owner ? ` (pid ${owner.pid})` : ""}. Running coverage for multiple Vitest processes in the same directory at the same time is not supported, because they would delete each other's reports.\nGive each run its own "coverage.reportsDirectory" (e.g. --coverage.reportsDirectory=coverage-${process.pid}) or run them sequentially.`);
	}
}
function isProcessAlive(pid) {
	try {
		// Sending signal 0 checks if the process exists without actually killing it:
		// https://nodejs.org/api/process.html#processkillpid-signal
		process.kill(pid, 0);
		return true;
	} catch (error) {
		// ESRCH means the process is gone. Treat anything else (e.g. EPERM) as alive
		// so we never reclaim a lock from a process that is still running.
		return error.code !== "ESRCH";
	}
}

// this function receives the module diagnostic with the location of imports
// and populates it with collected import durations; the duration is injected
// only if the current module is the one that imported the module
// if testModule is not defined, then Vitest aggregates durations of ALL collected test modules
function collectModuleDurationsDiagnostic(moduleId, state, moduleDiagnostic, testModule) {
	if (!moduleDiagnostic) return {
		modules: [],
		untrackedModules: []
	};
	const modules = [];
	const modulesById = {};
	const allModules = [...moduleDiagnostic.modules, ...moduleDiagnostic.untracked];
	const visitedByFiles = {};
	// this aggregates the times for _ALL_ tests if testModule is not passed
	// so if the module was imported in separate tests, the time will be accumulated
	for (const files of testModule ? [[testModule.task]] : state.filesMap.values()) for (const file of files) {
		const importDurations = file.importDurations;
		if (!importDurations) continue;
		const currentModule = state.getReportedEntity(file);
		if (!currentModule) continue;
		const visitedKey = currentModule.project.config.isolate === false ? "non-isolate" : file.id;
		if (!visitedByFiles[visitedKey]) visitedByFiles[visitedKey] = /* @__PURE__ */ new Set();
		const visited = visitedByFiles[visitedKey];
		allModules.forEach(({ resolvedId, resolvedUrl }) => {
			const durations = importDurations[resolvedId];
			// do not accumulate if module was already visited by suite (or suites in non-isolate mode)
			if (!durations || visited.has(resolvedId)) return;
			const importer = getModuleImporter(moduleId, durations, currentModule);
			modulesById[resolvedId] ??= {
				selfTime: 0,
				totalTime: 0,
				transformTime: 0,
				external: durations.external,
				importer
			};
			// only track if the current module imported this module,
			// otherwise it was imported instantly because it's cached
			if (importer === moduleId) {
				visited.add(resolvedId);
				modulesById[resolvedId].selfTime += durations.selfTime;
				modulesById[resolvedId].totalTime += durations.totalTime;
				// don't aggregate
				modulesById[resolvedId].transformTime = state.metadata[currentModule.project.name]?.duration[resolvedUrl]?.[0];
			}
		});
	}
	// if module was imported twice in the same file,
	// show only one time - the second should be shown as 0
	const visitedInFile = /* @__PURE__ */ new Set();
	moduleDiagnostic.modules.forEach((diagnostic) => {
		const durations = modulesById[diagnostic.resolvedId];
		if (!durations) return;
		if (visitedInFile.has(diagnostic.resolvedId)) modules.push({
			...diagnostic,
			selfTime: 0,
			totalTime: 0,
			transformTime: 0,
			external: durations.external,
			importer: durations.importer
		});
		else {
			visitedInFile.add(diagnostic.resolvedId);
			modules.push({
				...diagnostic,
				...durations
			});
		}
	});
	const untracked = [];
	moduleDiagnostic.untracked.forEach((diagnostic) => {
		const durations = modulesById[diagnostic.resolvedId];
		if (!durations) return;
		if (visitedInFile.has(diagnostic.resolvedId)) untracked.push({
			selfTime: 0,
			totalTime: 0,
			transformTime: 0,
			external: durations.external,
			importer: durations.importer,
			resolvedId: diagnostic.resolvedId,
			resolvedUrl: diagnostic.resolvedUrl,
			url: diagnostic.rawUrl
		});
		else {
			visitedInFile.add(diagnostic.resolvedId);
			untracked.push({
				...durations,
				resolvedId: diagnostic.resolvedId,
				resolvedUrl: diagnostic.resolvedUrl,
				url: diagnostic.rawUrl
			});
		}
	});
	return {
		modules,
		untrackedModules: untracked
	};
}
function getModuleImporter(moduleId, durations, testModule) {
	if (durations.importer === moduleId) return moduleId;
	if (!durations.importer) {
		if (moduleId === testModule.moduleId) return testModule.moduleId;
		return testModule.project.config.setupFiles.includes(moduleId) ? moduleId : durations.importer;
	}
	return durations.importer;
}
// the idea of this is very simple
// it parses the source code to extract import/export statements
// it parses SSR transformed file to extract __vite_ssr_import__ and __vite_ssr_dynamic_import__
// it combines the two by looking at the original positions of SSR primitives
// in the end, we are able to return a list of modules that were imported by this module
// mapped to their IDs in Vite's module graph
async function collectSourceModulesLocations(moduleId, moduleGraph) {
	const transformResult = moduleGraph.getModuleById(moduleId)?.transformResult;
	if (!transformResult || !transformResult.ssr) return;
	const map = transformResult.map;
	if (!map || !("version" in map) || !map.sources.length) return;
	const sourceImports = map.sources.reduce((acc, sourceId, index) => {
		const source = map.sourcesContent?.[index];
		if (source != null) acc[sourceId] = parseSourceImportsAndExports(source);
		return acc;
	}, {});
	const transformImports = await parseTransformResult(moduleGraph, transformResult);
	const traceMap = map && "version" in map && new TraceMap(map);
	const modules = {};
	const untracked = [];
	transformImports.forEach((row) => {
		const original = traceMap && originalPositionFor(traceMap, row.start);
		if (original && original.source != null) {
			// if there are several at the same position, this is a bug
			// probably caused by import.meta.glob imports returning incorrect positions
			// all the new import.meta.glob imports come first, so only the last module on this line is correct
			const sourceImport = sourceImports[original.source].get(`${original.line}:${original.column}`);
			if (sourceImport) {
				if (modules[sourceImport.rawUrl]) {
					// remove imports with a different resolvedId
					const differentImports = modules[sourceImport.rawUrl].filter((d) => d.resolvedId !== row.resolvedId);
					untracked.push(...differentImports);
					modules[sourceImport.rawUrl] = modules[sourceImport.rawUrl].filter((d) => d.resolvedId === row.resolvedId);
				}
				modules[sourceImport.rawUrl] ??= [];
				modules[sourceImport.rawUrl].push({
					start: sourceImport.start,
					end: sourceImport.end,
					startIndex: sourceImport.startIndex,
					endIndex: sourceImport.endIndex,
					rawUrl: sourceImport.rawUrl,
					resolvedId: row.resolvedId,
					resolvedUrl: row.resolvedUrl
				});
			}
		}
	});
	return {
		modules: Object.values(modules).flat(),
		untracked
	};
}
function fillSourcesMap(syntax, sourcesMap, source, indexMap) {
	const splitSeparator = `${syntax} `;
	const splitSources = source.split(splitSeparator);
	const chunks = [];
	let index = 0;
	for (const chunk of splitSources) {
		chunks.push({
			chunk,
			startIndex: index
		});
		index += chunk.length + splitSeparator.length;
	}
	chunks.forEach(({ chunk, startIndex }) => {
		const normalized = chunk.replace(/'/g, "\"");
		const startQuoteIdx = normalized.indexOf("\"");
		if (startQuoteIdx === -1) return;
		const endQuoteIdx = normalized.indexOf("\"", startQuoteIdx + 1);
		if (endQuoteIdx === -1) return;
		const staticSyntax = {
			startIndex: startIndex + startQuoteIdx,
			endIndex: startIndex + endQuoteIdx + 1,
			start: indexMap.get(startIndex + startQuoteIdx),
			end: indexMap.get(startIndex + endQuoteIdx + 1),
			rawUrl: normalized.slice(startQuoteIdx + 1, endQuoteIdx)
		};
		// -7 to include "import "
		for (let i = startIndex - 7; i < staticSyntax.endIndex; i++) {
			const location = indexMap.get(i);
			if (location) sourcesMap.set(`${location.line}:${location.column}`, staticSyntax);
		}
	});
}
// this function tries to parse ESM static import and export statements from
// the source. if the source is not JS/TS, but supports static ESM syntax,
// then this will also find them because it' only checks the strings, it doesn't parse the AST
function parseSourceImportsAndExports(source) {
	if (!source.includes("import ") && !source.includes("export ")) return /* @__PURE__ */ new Map();
	const sourcesMap = /* @__PURE__ */ new Map();
	const indexMap = createIndexLocationsMap(source);
	fillSourcesMap("import", sourcesMap, source, indexMap);
	fillSourcesMap("export", sourcesMap, source, indexMap);
	return sourcesMap;
}
async function parseTransformResult(moduleGraph, transformResult) {
	const code = transformResult.code;
	const regexp = /(?:__vite_ssr_import__|__vite_ssr_dynamic_import__)\("([^"]+)"/g;
	const lineColumnMap = createIndexLocationsMap(code);
	const importPositions = [];
	let match;
	// eslint-disable-next-line no-cond-assign
	while (match = regexp.exec(code)) {
		const startIndex = match.index;
		const endIndex = match.index + match[0].length - 1;
		importPositions.push({
			raw: match[1],
			startIndex,
			endIndex
		});
	}
	return (await Promise.all(importPositions.map(async ({ startIndex, endIndex, raw }) => {
		const position = lineColumnMap.get(startIndex);
		const endPosition = lineColumnMap.get(endIndex);
		const moduleNode = await moduleGraph.getModuleByUrl(raw);
		if (!position || !endPosition || !moduleNode || !moduleNode.id) return;
		return {
			resolvedId: moduleNode.id,
			resolvedUrl: moduleNode.url,
			start: position,
			end: endPosition,
			startIndex,
			endIndex
		};
	}))).filter((n) => n != null);
}

class BlobReporter {
	start = 0;
	ctx;
	options;
	coverage;
	constructor(options) {
		this.options = options;
	}
	onInit(ctx) {
		if (ctx.config.watch) throw new Error("Blob reporter is not supported in watch mode");
		this.ctx = ctx;
		this.start = performance.now();
		this.coverage = void 0;
	}
	onCoverage(coverage) {
		this.coverage = coverage;
	}
	async onTestRunEnd(testModules, unhandledErrors) {
		const executionTime = performance.now() - this.start;
		const files = testModules.map((testModule) => testModule.task);
		const errors = [...unhandledErrors];
		const coverage = this.coverage;
		const environmentModules = {};
		this.ctx.projects.forEach((project) => {
			const serializedProject = {
				environments: {},
				external: []
			};
			Object.entries(project.vite.environments).forEach(([environmentName, environment]) => {
				serializedProject.environments[environmentName] = serializeEnvironmentModuleGraph(environment);
			});
			for (const [id, value] of project._resolver.externalizeCache.entries()) if (typeof value === "string") serializedProject.external.push([id, value]);
			environmentModules[project.name] = serializedProject;
		});
		const content = stringify([
			this.ctx.version,
			files,
			errors,
			coverage,
			executionTime,
			environmentModules
		]);
		let outputFile = this.options.outputFile ?? getOutputFile(this.ctx.config, "blob");
		if (outputFile) {
			outputFile = resolve(this.ctx.config.root, outputFile);
			const dir = dirname(outputFile);
			if (!existsSync(dir)) await mkdir(dir, { recursive: true });
			await writeFile(outputFile, content, "utf-8");
		} else {
			const report = this.ctx.createReport("blob");
			const shard = this.ctx.config.shard;
			outputFile = [
				"blob",
				this.ctx.config.mergeReportsLabel,
				shard ? `${shard.index}-${shard.count}` : ""
			].filter(Boolean).join("-");
			outputFile = `${sanitizeFilePath(outputFile)}.json`;
			await report.writeFile(outputFile, content, "utf-8");
			outputFile = resolve(report.root, outputFile);
		}
		this.ctx.logger.log("blob report written to", outputFile);
	}
}
async function readBlobs(currentVersion, blobsDirectory, projectsArray) {
	// using process.cwd() because --merge-reports can only be used in CLI
	const resolvedDir = resolve(process.cwd(), blobsDirectory);
	const promises = (await readdir(resolvedDir)).map(async (filename) => {
		const fullPath = resolve(resolvedDir, filename);
		if (!(await stat(fullPath)).isFile()) throw new TypeError(`vitest.mergeReports() expects all paths in "${blobsDirectory}" to be files generated by the blob reporter, but "${filename}" is not a file`);
		const content = await readFile(fullPath, "utf-8");
		const [version, files, errors, coverage, executionTime, environmentModules] = parse(content);
		if (!version) throw new TypeError(`vitest.mergeReports() expects all paths in "${blobsDirectory}" to be files generated by the blob reporter, but "${filename}" is not a valid blob file`);
		return {
			version,
			files,
			errors,
			coverage,
			file: filename,
			executionTime,
			environmentModules
		};
	});
	const blobs = await Promise.all(promises);
	if (!blobs.length) throw new Error(`vitest.mergeReports() requires at least one blob file in "${blobsDirectory}" directory, but none were found`);
	const versions = new Set(blobs.map((blob) => blob.version));
	if (versions.size > 1) throw new Error(`vitest.mergeReports() requires all blob files to be generated by the same Vitest version, received\n\n${blobs.map((b) => `- "${b.file}" uses v${b.version}`).join("\n")}`);
	if (!versions.has(currentVersion)) throw new Error(`the blobs in "${blobsDirectory}" were generated by a different version of Vitest. Expected v${currentVersion}, but received v${blobs[0].version}`);
	// Restore module graph
	const projects = Object.fromEntries(projectsArray.map((p) => [p.name, p]));
	blobs.forEach((blob) => {
		Object.entries(blob.environmentModules).forEach(([projectName, modulesByProject]) => {
			const project = projects[projectName];
			if (!project) return;
			modulesByProject.external.forEach(([id, externalized]) => {
				project._resolver.externalizeCache.set(id, externalized);
			});
			Object.entries(modulesByProject.environments).forEach(([environmentName, moduleGraph]) => {
				const environment = project.vite.environments[environmentName];
				deserializeEnvironmentModuleGraph(environment, moduleGraph);
			});
		});
	});
	return {
		files: blobs.flatMap((blob) => blob.files).sort((f1, f2) => {
			return (f1.result?.startTime || 0) - (f2.result?.startTime || 0);
		}),
		errors: blobs.flatMap((blob) => blob.errors),
		coverages: blobs.map((blob) => blob.coverage),
		executionTimes: blobs.map((blob) => blob.executionTime)
	};
}
function serializeEnvironmentModuleGraph(environment) {
	const idTable = [];
	const idMap = /* @__PURE__ */ new Map();
	const getIdIndex = (id) => {
		const existing = idMap.get(id);
		if (existing != null) return existing;
		const next = idTable.length;
		idMap.set(id, next);
		idTable.push(id);
		return next;
	};
	const modules = [];
	for (const [id, mod] of environment.moduleGraph.idToModuleMap.entries()) {
		// Vite can generate module with `file = ""` for module id "#..."
		// when the actual module doesn't exist (e.g. resolve failure or mocked module)
		if (mod.file == null) continue;
		const importedIds = [];
		for (const importedNode of mod.importedModules) if (importedNode.id !== null) importedIds.push(getIdIndex(importedNode.id));
		modules.push([
			getIdIndex(id),
			getIdIndex(mod.file),
			getIdIndex(mod.url),
			importedIds
		]);
	}
	return {
		idTable,
		modules
	};
}
function deserializeEnvironmentModuleGraph(environment, serialized) {
	const nodesById = /* @__PURE__ */ new Map();
	serialized.modules.forEach(([id, file, url]) => {
		const moduleId = serialized.idTable[id];
		const filePath = serialized.idTable[file];
		const urlPath = serialized.idTable[url];
		// `createFileOnlyEntry('')` normalizes the file to ".". This keeps
		// the graph usable, but doesn't perfectly round-trip Vite's `file = ""`
		// nodes for ids like "#...".
		// We may just do moduleNode.file = filePath in the future.
		const moduleNode = environment.moduleGraph.createFileOnlyEntry(filePath);
		moduleNode.url = urlPath;
		moduleNode.id = moduleId;
		moduleNode.transformResult = {
			// print error checks that transformResult is set
			code: " ",
			map: null
		};
		environment.moduleGraph.idToModuleMap.set(moduleId, moduleNode);
		nodesById.set(moduleId, moduleNode);
	});
	serialized.modules.forEach(([id, _file, _url, importedIds]) => {
		const moduleId = serialized.idTable[id];
		const moduleNode = nodesById.get(moduleId);
		importedIds.forEach((importedIdIndex) => {
			const importedId = serialized.idTable[importedIdIndex];
			const importedNode = nodesById.get(importedId);
			moduleNode.importedModules.add(importedNode);
			importedNode.importers.add(moduleNode);
		});
	});
}

class HangingProcessReporter {
	whyRunning;
	onInit() {
		const _require = createRequire(import.meta.url);
		this.whyRunning = _require("why-is-node-running");
	}
	onProcessTimeout() {
		this.whyRunning?.();
	}
}

function createReport(ctx, scope) {
	const root = ctx.config.root;
	const vitestDir = resolve$1(root, ".vitest");
	const reportDir = resolve$1(vitestDir, scope);
	if (!fs.existsSync(vitestDir)) fs.mkdirSync(vitestDir);
	if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);
	return {
		root: reportDir,
		async clean(force = false) {
			if (fs.existsSync(reportDir)) {
				// Do not delete results when run with --merge-reports, unless forced to.
				// In test runs with --shard, it's possible that users do some other handling for
				// the reports after 'vitest --merge-reports' run. For example upload all the '.vitest/attachments'.
				if (ctx.config.mergeReports && !force) return;
				await rm(reportDir, {
					recursive: true,
					force: true
				});
			}
			await mkdir(reportDir);
		},
		async readFile(filename, encoding = "utf8") {
			return await readFile(resolve$1(vitestDir, scope, filename), encoding);
		},
		async readdir() {
			return await readdir(resolve$1(vitestDir, scope));
		},
		async writeFile(filename, content, encoding = "utf8") {
			await writeFile(resolve$1(vitestDir, scope, filename), content, encoding);
		},
		async delete(filename) {
			await rm(resolve$1(vitestDir, scope, filename), {
				recursive: true,
				force: true
			});
		}
	};
}

const DOM_ENVIRONMENTS = /* @__PURE__ */ new Set(["jsdom", "happy-dom"]);
/** Minimum summed environment setup time before the hint is worth printing. */
const MIN_ENVIRONMENT_TIME = 2e3;
/** Minimum share of the project's tracked time spent setting up environments. */
const MIN_ENVIRONMENT_SHARE = .25;
/**
* A hint has to be worth acting on: the estimated saving must be noticeable.
* Run-to-run noise of real suites is commonly a few percent, so anything below
* ~5% of the wall time cannot even be confirmed by trying the change - except
* on long runs, where 10 seconds is worth attention regardless of percentage.
*/
function isSavingWorthHinting(saving, executionTime) {
	if (saving < 250) return false;
	return saving >= executionTime * .05 || saving >= 1e4;
}
/** Minimum summed import time before the hint is worth printing. */
const MIN_IMPORT_TIME = 2e3;
/** Minimum share of the project's tracked time spent importing modules. */
const MIN_IMPORT_SHARE = .25;
/**
* Minimum fraction of module fetches that re-evaluate an already evaluated
* module. Below this the test files import mostly disjoint graphs and
* reusing workers would not meaningfully reduce the import work.
*/
const MIN_IMPORT_DUPLICATION = .2;
/**
* Detects projects where test files repeatedly evaluate the same module
* graph. Typical for barrel-file imports: every test file pulls hundreds of
* shared modules to use a few of them, and `isolate: true` re-evaluates that
* graph for every file. The duplication is measured from the server-side
* fetch counts, so suites with disjoint per-file graphs - where reusing
* workers would not help - stay quiet.
*/
function getImportDiagnostics(projects) {
	const diagnostics = [];
	for (const project of projects) {
		if (project.pool !== "forks" && project.pool !== "threads" || !project.isolate || project.isolateProvided || project.browser || project.fileCount <= project.parallelism || project.importTime < MIN_IMPORT_TIME || project.trackedTime <= 0 || project.importTime / project.trackedTime < MIN_IMPORT_SHARE) continue;
		const parallelism = Math.max(1, project.parallelism);
		let totalFetches = 0;
		let avoidableFetches = 0;
		for (const count of project.fetchCounts) {
			totalFetches += count;
			// reused workers still fetch a module once per lane that needs it
			avoidableFetches += Math.max(0, count - parallelism);
		}
		if (totalFetches === 0) continue;
		const duplication = avoidableFetches / totalFetches;
		if (duplication < MIN_IMPORT_DUPLICATION) continue;
		// imports are spread across the worker lanes, so the reducible wall time
		// is the duplicated share of the summed import time divided by lanes
		const estimatedSaving = project.importTime * duplication / parallelism;
		if (!isSavingWorthHinting(estimatedSaving, project.executionTime)) continue;
		diagnostics.push({
			name: project.name,
			importTime: project.importTime,
			share: project.importTime / project.trackedTime,
			totalFetches,
			uniqueModules: project.fetchCounts.length,
			duplication,
			estimatedSaving
		});
	}
	return diagnostics;
}
/**
* Estimates the wall-clock time saved by evaluating shared modules once per
* worker instead of once per test file. `moduleSelfTimes` holds, per module,
* the module's own evaluation time in every test file that evaluated it.
* Reused workers keep ~`parallelism` evaluations of each module (one per
* lane); the rest of the summed time is avoidable and spread across the
* lanes.
*/
function estimateModuleEvaluationSaving(moduleSelfTimes, parallelism) {
	const lanes = Math.max(1, parallelism);
	let avoidable = 0;
	for (const times of moduleSelfTimes) {
		if (times.length <= lanes) continue;
		let sum = 0;
		for (const time of times) sum += time;
		avoidable += sum * (times.length - lanes) / times.length;
	}
	return avoidable / lanes;
}
/** Minimum summed transform time before the hint is worth printing. */
const MIN_TRANSFORM_TIME = 2e3;
/** Minimum share of the project's tracked time spent transforming modules. */
const MIN_TRANSFORM_SHARE = .25;
/**
* Detects projects that spend the run transforming modules. Without the fs
* module cache every `vitest run` starts from scratch and transforms the
* whole module graph again; `fsModuleCache` persists the results on disk so
* repeated runs skip them.
*/
function getTransformDiagnostics(projects) {
	return projects.filter((project) => {
		if (project.fsModuleCache || project.fsModuleCacheProvided || project.transformTime < MIN_TRANSFORM_TIME || project.trackedTime <= 0 || project.transformTime / project.trackedTime < MIN_TRANSFORM_SHARE) return false;
		// the next run skips the persisted transforms, so the (mostly serial,
		// main-thread) transform time itself bounds the saving
		return isSavingWorthHinting(project.transformTime, project.executionTime);
	}).map((project) => ({
		name: project.name,
		transformTime: project.transformTime,
		share: project.transformTime / project.trackedTime
	}));
}
/**
* Detects projects where re-creating a DOM environment for every test file
* dominates the run. With an isolating pool the environment is set up once
* per file; `vmThreads`/`vmForks` set it up once per worker while still
* giving every file a fresh VM context.
*/
function getEnvironmentDiagnostics(projects) {
	return projects.filter((project) => {
		if (!DOM_ENVIRONMENTS.has(project.environment) || project.pool !== "forks" && project.pool !== "threads" || !project.isolate || project.browser || project.poolProvided || project.environmentCount <= 1 || project.environmentTime < MIN_ENVIRONMENT_TIME || project.trackedTime <= 0 || project.environmentTime / project.trackedTime < MIN_ENVIRONMENT_SHARE) return false;
		// setups are spread across the worker lanes; a vm pool would still pay
		// one setup per lane, so the reducible wall time is the rest
		const parallelism = Math.max(1, project.parallelism);
		return isSavingWorthHinting(project.environmentTime / parallelism - project.environmentTime / project.environmentCount, project.executionTime);
	}).map((project) => ({
		name: project.name,
		environment: project.environment,
		environmentTime: project.environmentTime,
		environmentCount: project.environmentCount,
		share: project.environmentTime / project.trackedTime,
		suggestIsolate: !project.isolateProvided
	}));
}

function computeDurationBreakdown(input) {
	const sums = {
		transform: 0,
		setup: 0,
		import: 0,
		tests: 0,
		environment: 0,
		worker: 0,
		typecheck: input.typecheckTime
	};
	for (const file of input.files) {
		// setup and collect wall times include the time the worker spent waiting
		// for module transforms; report that wait as its own "transform" phase so
		// every phase is a disjoint sum of per-worker time
		const setupFetch = file.setupFetchDuration || 0;
		const collectFetch = file.collectFetchDuration || 0;
		sums.transform += setupFetch + collectFetch;
		sums.setup += Math.max((file.setupDuration || 0) - setupFetch, 0);
		sums.import += Math.max((file.collectDuration || 0) - collectFetch, 0);
		sums.tests += file.result?.duration || 0;
		sums.environment += file.environmentLoad || 0;
		sums.worker += file.prepareDuration || 0;
	}
	const entries = Object.entries(sums);
	const total = entries.reduce((acc, [, time]) => acc + time, 0);
	return {
		total,
		phases: entries.map(([name, time]) => ({
			name,
			time,
			percent: total > 0 ? time / total * 100 : 0
		})).filter((phase) => phase.percent >= .5).sort((a, b) => b.time - a.time)
	};
}
function formatDurationBreakdown(breakdown) {
	return breakdown.phases.map((phase) => `${phase.name} ${formatPercent(phase.percent)}`).join(", ");
}
function formatPercent(percent) {
	// sub-1% shares round to "1%" instead of a misleading "0%"
	return `${Math.max(1, Math.round(percent))}%`;
}

const BENCH_TABLE_HEAD = [
	"hz",
	"min",
	"max",
	"mean",
	"p75",
	"p99",
	"p995",
	"p999",
	"rme",
	"samples"
];
function formatBenchNumber(number) {
	const res = String(number.toFixed(number < 100 ? 4 : 2)).split(".");
	return res[0].replace(/(?=(?:\d{3})+$)\B/g, ",") + (res[1] ? `.${res[1]}` : "");
}
// Plain-text rendering of the benchmark table (no ANSI colors, no indent).
// Used by the junit reporter to embed benchmark data in <system-out>.
function renderBenchmarkTableText(benchmarks, columnName = "name") {
	const lines = [];
	for (const benchmark of benchmarks) {
		const { tasks } = benchmark;
		if (tasks.length === 0) continue;
		if (lines.length > 0) lines.push("");
		const rows = tasks.map(renderBenchmarkRow);
		const head = [columnName, ...BENCH_TABLE_HEAD];
		const widths = computeBenchColumnWidths(head, rows);
		lines.push(padBenchRow(head, widths).join("  "));
		for (const task of tasks) {
			let row = padBenchRow(renderBenchmarkRow(task), widths).join("  ");
			if (task.rank === 1 && tasks.length > 1) row += "   fastest";
			if (task.rank === tasks.length && tasks.length > 2) row += "   slowest";
			lines.push(row);
		}
	}
	return lines.join("\n");
}
function renderBenchmarkRow(task) {
	return [
		task.name,
		formatBenchNumber(task.throughput.mean || 0),
		formatBenchNumber(task.latency.min || 0),
		formatBenchNumber(task.latency.max || 0),
		formatBenchNumber(task.latency.mean || 0),
		formatBenchNumber(task.latency.p75 || 0),
		formatBenchNumber(task.latency.p99 || 0),
		formatBenchNumber(task.latency.p995 || 0),
		formatBenchNumber(task.latency.p999 || 0),
		`\u00B1${(task.latency.rme || 0).toFixed(2)}%`,
		String(task.latency.samplesCount || 0)
	];
}
function computeBenchColumnWidths(header, rows) {
	const allRows = [header, ...rows];
	return Array.from(header, (_, i) => Math.max(...allRows.map((row) => stripVTControlCharacters(row[i]).length)));
}
function padBenchRow(row, widths) {
	return row.map((v, i) => i === 0 ? v.padEnd(widths[i]) : v.padStart(widths[i]));
}

const BADGE_PADDING = "       ";
class BaseReporter {
	start = 0;
	end = 0;
	watchFilters;
	failedUnwatchedFiles = [];
	isTTY;
	ctx = void 0;
	renderSucceed = false;
	verbose = false;
	silent;
	_filesInWatchMode = /* @__PURE__ */ new Map();
	_timeStart = formatTimeString(/* @__PURE__ */ new Date());
	_perProjectBenchmarks = /* @__PURE__ */ new Map();
	_printedSuites = /* @__PURE__ */ new Set();
	constructor(options = {}) {
		this.isTTY = options.isTTY ?? isTTY;
		this.silent = options.silent;
	}
	onInit(ctx) {
		this.ctx = ctx;
		this.silent ??= this.ctx.config.silent;
		this.ctx.logger.printBanner();
	}
	log(...messages) {
		this.ctx.logger.log(...messages);
	}
	error(...messages) {
		this.ctx.logger.error(...messages);
	}
	relative(path) {
		return relative(this.ctx.config.root, path);
	}
	onTestRunStart(_specifications) {
		this.start = performance$1.now();
		this._timeStart = formatTimeString(/* @__PURE__ */ new Date());
		this._perProjectBenchmarks.clear();
	}
	onTestRunEnd(testModules, unhandledErrors, _reason) {
		const files = testModules.map((testModule) => testModule.task);
		const errors = [...unhandledErrors];
		this.end = performance$1.now();
		if (!files.length && !errors.length) this.ctx.logger.printNoTestFound(this.ctx.filenamePattern);
		else {
			this.printPerProjectBenchmarks();
			this.reportSummary(files, errors);
		}
	}
	onTestCaseResult(testCase) {
		if (testCase.result().state === "failed") this.logFailedTask(testCase.task);
	}
	onTestCaseBenchmark(testCase, benchmark) {
		const projectName = testCase.project.name || "";
		for (const task of benchmark.tasks) {
			if (!task.perProject) continue;
			const benchKey = `${testCase.module.relativeModuleId} > ${testCase.fullName} > ${task.name}`;
			let projectMap = this._perProjectBenchmarks.get(benchKey);
			if (!projectMap) {
				projectMap = /* @__PURE__ */ new Map();
				this._perProjectBenchmarks.set(benchKey, projectMap);
			}
			projectMap.set(projectName, task);
		}
	}
	onTestSuiteResult(testSuite) {
		if (testSuite.state() === "failed") this.logFailedTask(testSuite.task);
	}
	onTestModuleEnd(testModule) {
		if (testModule.state() === "failed") this.logFailedTask(testModule.task);
		this.printTestModule(testModule);
	}
	logFailedTask(task) {
		if (this.silent === "passed-only") for (const log of task.logs || []) this.onUserConsoleLog(log, "failed");
	}
	printTestModule(testModule) {
		const moduleState = testModule.state();
		if (moduleState === "queued" || moduleState === "pending") return;
		this._printedSuites.clear();
		let testsCount = 0;
		let failedCount = 0;
		let skippedCount = 0;
		let todoCount = 0;
		// delaying logs to calculate the test stats first
		// which minimizes the amount of for loops
		const logs = [];
		const originalLog = this.log.bind(this);
		this.log = (msg) => logs.push(msg);
		const visit = (suiteState, children) => {
			for (const child of children) if (child.type === "suite") {
				const suiteState = child.state();
				// Skipped suites are hidden when --hideSkippedTests, print otherwise
				if (!this.ctx.config.hideSkippedTests || suiteState !== "skipped" || child.task.mode === "todo") this.printTestSuite(child);
				visit(suiteState, child.children);
			} else {
				const testResult = child.result();
				testsCount++;
				if (testResult.state === "failed") failedCount++;
				else if (testResult.state === "skipped") if (child.options.mode === "todo") todoCount++;
				else skippedCount++;
				if (this.ctx.config.hideSkippedTests && suiteState === "skipped" && child.options.mode !== "todo")
 // Skipped suites are hidden when --hideSkippedTests
				continue;
				this.printTestCase(moduleState, child);
			}
		};
		try {
			visit(moduleState, testModule.children);
		} finally {
			this.log = originalLog;
		}
		this.log(this.getModuleLog(testModule, {
			tests: testsCount,
			failed: failedCount,
			skipped: skippedCount,
			todo: todoCount
		}));
		logs.forEach((log) => this.log(log));
	}
	printTestCase(moduleState, test) {
		const testResult = test.result();
		const { duration = 0 } = test.diagnostic() || {};
		const padding = this.getTestIndentation(test.task);
		const suffix = this.getTestCaseSuffix(test);
		// perProject tasks still appear in the inline table — they're additionally
		// aggregated in the cross-project section at the end of the run
		const inlineBenchmarks = test.benchmarks().filter((b) => b.tasks.length > 0);
		if (testResult.state === "failed") {
			this.printAncestorSuites(test);
			this.log(y.red(` ${padding}${taskFail} ${this.getTestName(test.task, separator)}`) + suffix);
		} else if (duration > this.ctx.config.slowTestThreshold) {
			this.printAncestorSuites(test);
			this.log(` ${padding}${y.yellow(y.dim(F_CHECK))} ${this.getTestName(test.task, separator)}${suffix}`);
		} else if (this.ctx.config.hideSkippedTests && testResult.state === "skipped" && test.options.mode !== "todo") ; else if (this.renderSucceed || moduleState === "failed" || inlineBenchmarks.length) {
			this.printAncestorSuites(test);
			this.log(` ${padding}${this.getStateSymbol(test)} ${this.getTestName(test.task, separator)}${suffix}`);
		}
		if (inlineBenchmarks.length > 0) this.printBenchmarkTable(inlineBenchmarks, padding);
	}
	getModuleLog(testModule, counts) {
		let state = y.dim(`${counts.tests} test${counts.tests > 1 ? "s" : ""}`);
		if (counts.failed) state += y.dim(" | ") + y.red(`${counts.failed} failed`);
		if (counts.skipped) state += y.dim(" | ") + y.yellow(`${counts.skipped} skipped`);
		if (counts.todo) state += y.dim(" | ") + y.gray(`${counts.todo} todo`);
		let suffix = y.dim("(") + state + y.dim(")") + this.getDurationPrefix(testModule.task);
		const diagnostic = testModule.diagnostic();
		if (diagnostic.heap != null) suffix += y.magenta(` ${Math.floor(diagnostic.heap / 1024 / 1024)} MB heap used`);
		return ` ${this.getEntityPrefix(testModule)} ${testModule.task.name} ${suffix}`;
	}
	printTestSuite(testSuite) {
		if (!this.renderSucceed) return;
		this.printSuiteEntry(testSuite);
	}
	printSuiteEntry(testSuite) {
		if (this._printedSuites.has(testSuite.id)) return;
		this._printedSuites.add(testSuite.id);
		const indentation = "  ".repeat(getIndentation(testSuite.task));
		const tests = Array.from(testSuite.children.allTests());
		const state = this.getStateSymbol(testSuite);
		this.log(` ${indentation}${state} ${testSuite.name} ${y.dim(`(${tests.length})`)}`);
	}
	// When a test line is emitted while renderSucceed is off (e.g. slow tests
	// or inline benchmarks in CI), its parent describe suites were never printed
	// by the outer visitor. Walk up and print any that are still missing so the
	// nesting matches what the TTY output would show.
	printAncestorSuites(test) {
		if (this.renderSucceed) return;
		const suites = [];
		let parent = test.parent;
		while (parent.type === "suite" && !this._printedSuites.has(parent.id)) {
			suites.push(parent);
			parent = parent.parent;
		}
		for (let i = suites.length - 1; i >= 0; i--) this.printSuiteEntry(suites[i]);
	}
	getTestName(test, _separator) {
		return test.name;
	}
	getFullName(test, separator) {
		if (test === test.file) return test.name;
		let name = test.file.name;
		if (test.location) name += y.dim(`:${test.location.line}`);
		name += separator;
		name += getTestName(test, separator);
		return name;
	}
	getTestIndentation(test) {
		return "  ".repeat(getIndentation(test));
	}
	printAnnotations(test, console, padding = 0) {
		const annotations = test.annotations();
		if (!annotations.length) return;
		const PADDING = " ".repeat(padding);
		const groupedAnnotations = {};
		annotations.forEach((annotation) => {
			const { location, type } = annotation;
			let group;
			if (location) {
				const file = relative(test.project.config.root, location.file);
				group = `${y.gray(`${file}:${location.line}:${location.column}`)} ${y.bold(type)}`;
			} else group = y.bold(type);
			groupedAnnotations[group] ??= [];
			groupedAnnotations[group].push(annotation);
		});
		for (const group in groupedAnnotations) {
			this[console](`${PADDING}${y.blue(F_POINTER)} ${group}`);
			groupedAnnotations[group].forEach(({ message }) => {
				this[console](`${PADDING}  ${y.blue(F_DOWN_RIGHT)} ${message}`);
			});
		}
	}
	getEntityPrefix(entity) {
		let title = this.getStateSymbol(entity);
		if (entity.project.name) title += ` ${formatProjectName(entity.project, "")}`;
		if (entity.meta().typecheck) title += ` ${y.bgBlue(y.bold(" TS "))}`;
		const label = this.ctx.state.blobs && entity.task.file.meta.__vitest_label__;
		if (label) title += ` ${y.bgCyan(y.bold(` ${label} `))}`;
		return title;
	}
	getTestCaseSuffix(testCase) {
		const { heap, retryCount, repeatCount } = testCase.diagnostic() || {};
		const testResult = testCase.result();
		let suffix = this.getDurationPrefix(testCase.task);
		if (retryCount != null && retryCount > 0) suffix += y.yellow(` (retry x${retryCount})`);
		if (repeatCount != null && repeatCount > 0) suffix += y.yellow(` (repeat x${repeatCount})`);
		if (heap != null) suffix += y.magenta(` ${Math.floor(heap / 1024 / 1024)} MB heap used`);
		if (testResult.state === "skipped" && testResult.note) suffix += y.dim(y.gray(` [${testResult.note}]`));
		return suffix;
	}
	getStateSymbol(test) {
		return getStateSymbol(test.task);
	}
	getDurationPrefix(task) {
		const duration = task.result?.duration && Math.round(task.result?.duration);
		if (duration == null) return "";
		return (duration > this.ctx.config.slowTestThreshold ? y.yellow : y.green)(` ${duration}${y.dim("ms")}`);
	}
	onWatcherStart(files = this.ctx.state.getFiles(), errors = this.ctx.state.getUnhandledErrors()) {
		if (errors.length > 0 || hasFailed(files)) this.log(withLabel("red", "FAIL", "Tests failed. Watching for file changes..."));
		else if (this.ctx.isCancelling) this.log(withLabel("red", "CANCELLED", "Test run cancelled. Watching for file changes..."));
		else this.log(withLabel("green", "PASS", "Waiting for file changes..."));
		const hints = [y.dim("press ") + y.bold("h") + y.dim(" to show help")];
		if (hasFailedSnapshot(files)) hints.unshift(y.dim("press ") + y.bold(y.yellow("u")) + y.dim(" to update snapshot"));
		else hints.push(y.dim("press ") + y.bold("q") + y.dim(" to quit"));
		this.log(BADGE_PADDING + hints.join(y.dim(", ")));
	}
	onWatcherRerun(files, trigger) {
		this.watchFilters = files;
		this.failedUnwatchedFiles = this.ctx.state.getTestModules().filter((testModule) => !files.includes(testModule.task.filepath) && testModule.state() === "failed");
		// Update re-run count for each file
		files.forEach((filepath) => {
			let reruns = this._filesInWatchMode.get(filepath) ?? 0;
			this._filesInWatchMode.set(filepath, ++reruns);
		});
		let banner = trigger ? y.dim(`${this.relative(trigger)} `) : "";
		if (files.length === 1) {
			const rerun = this._filesInWatchMode.get(files[0]) ?? 1;
			banner += y.blue(`x${rerun} `);
		}
		this.ctx.logger.clearFullScreen();
		this.log(withLabel("blue", "RERUN", banner));
		if (this.ctx.configOverride.project) this.log(BADGE_PADDING + y.dim(" Project name: ") + y.blue(toArray(this.ctx.configOverride.project).join(", ")));
		if (this.ctx.filenamePattern) this.log(BADGE_PADDING + y.dim(" Filename pattern: ") + y.blue(this.ctx.filenamePattern.join(", ")));
		if (this.ctx.configOverride.testNamePattern) this.log(BADGE_PADDING + y.dim(" Test name pattern: ") + y.blue(String(this.ctx.configOverride.testNamePattern)));
		this.log("");
		for (const testModule of this.failedUnwatchedFiles) this.printTestModule(testModule);
	}
	onUserConsoleLog(log, taskState) {
		if (!this.shouldLog(log, taskState)) return;
		const output = log.type === "stdout" ? this.ctx.logger.outputStream : this.ctx.logger.errorStream;
		const write = (msg) => output.write(msg);
		let headerText = "unknown test";
		const task = log.taskId ? this.ctx.state.idMap.get(log.taskId) : void 0;
		if (task) headerText = this.getFullName(task, separator);
		else if (log.taskId && log.taskId !== "__vitest__unknown_test__") headerText = log.taskId;
		write(y.gray(log.type + y.dim(` | ${headerText}\n`)) + log.content);
		if (log.origin) {
			// browser logs don't have an extra end of line at the end like Node.js does
			if (log.browser) write("\n");
			const project = task ? this.ctx.getProjectByName(task.file.projectName || "") : this.ctx.getRootProject();
			const stack = log.browser ? project.browser?.parseStacktrace(log.origin) || [] : parseStacktrace(log.origin);
			const highlight = task && stack.find((i) => i.file === task.file.filepath);
			for (const frame of stack) {
				const color = frame === highlight ? y.cyan : y.gray;
				const path = relative(project.config.root, frame.file);
				const positions = [frame.method, `${path}:${y.dim(`${frame.line}:${frame.column}`)}`].filter(Boolean).join(" ");
				write(color(` ${y.dim(F_POINTER)} ${positions}\n`));
			}
		}
		write("\n");
	}
	onTestRemoved(trigger) {
		this.log(y.yellow("Test removed...") + (trigger ? y.dim(` [ ${this.relative(trigger)} ]\n`) : ""));
	}
	shouldLog(log, taskState) {
		if (this.silent === true) return false;
		if (this.silent === "passed-only" && taskState !== "failed") return false;
		if (this.ctx.config.onConsoleLog) {
			const task = log.taskId ? this.ctx.state.idMap.get(log.taskId) : void 0;
			const entity = task && this.ctx.state.getReportedEntity(task);
			if (this.ctx.config.onConsoleLog(log.content, log.type, entity) === false) return false;
		}
		return true;
	}
	onServerRestart(reason) {
		this.log(y.bold(y.magenta(reason === "config" ? "\nRestarting due to config changes..." : "\nRestarting Vitest...")));
	}
	reportSummary(files, errors) {
		this.printErrorsSummary(files, errors);
		const leakCount = this.printLeaksSummary();
		this.reportTestSummary(files, errors, leakCount);
	}
	reportTestSummary(files, errors, leakCount) {
		this.log();
		const affectedFiles = [...this.failedUnwatchedFiles.map((m) => m.task), ...files];
		const tests = getTests(affectedFiles);
		const snapshotOutput = renderSnapshotSummary(this.ctx.config.root, this.ctx.snapshot.summary);
		for (const [index, snapshot] of snapshotOutput.entries()) {
			const title = index === 0 ? "Snapshots" : "";
			this.log(`${padSummaryTitle(title)} ${snapshot}`);
		}
		if (snapshotOutput.length > 1) this.log();
		this.log(padSummaryTitle("Test Files"), getStateString$1(affectedFiles));
		this.log(padSummaryTitle("Tests"), getStateString$1(tests));
		if (this.ctx.projects.some((c) => c.config.typecheck.enabled)) {
			const failed = tests.filter((t) => t.meta?.typecheck && t.result?.errors?.length);
			this.log(padSummaryTitle("Type Errors"), failed.length ? y.bold(y.red(`${failed.length} failed`)) : y.dim("no errors"));
		}
		if (errors.length) this.log(padSummaryTitle("Errors"), y.bold(y.red(`${errors.length} error${errors.length > 1 ? "s" : ""}`)));
		if (leakCount) this.log(padSummaryTitle("Leaks"), y.bold(y.red(`${leakCount} leak${leakCount > 1 ? "s" : ""}`)));
		this.log(padSummaryTitle("Start at"), this._timeStart);
		const collectTime = sum(files, (file) => file.collectDuration);
		const testsTime = sum(files, (file) => file.result?.duration);
		const setupTime = sum(files, (file) => file.setupDuration);
		if (this.watchFilters) this.log(padSummaryTitle("Duration"), formatTime(collectTime + testsTime + setupTime));
		else {
			const blobs = this.ctx.state.blobs;
			// Execution time is either sum of all runs of `--merge-reports` or the current run's time
			const executionTime = blobs?.executionTimes ? sum(blobs.executionTimes, (time) => time) : this.end - this.start;
			const breakdown = computeDurationBreakdown({
				files,
				typecheckTime: sum(this.ctx.projects, (project) => project.typechecker?.getResult().time)
			});
			// percentages are relative to the sum of all tracked phases: phases run
			// in parallel workers, so their sum is not comparable to the wall time
			const timers = breakdown.total > 0 ? formatDurationBreakdown(breakdown) : "";
			this.log(padSummaryTitle("Duration"), formatTime(executionTime) + (timers ? y.dim(` (${timers})`) : ""));
			if (blobs?.executionTimes) this.log(padSummaryTitle("Per blob") + blobs.executionTimes.map((time) => ` ${formatTime(time)}`).join(""));
		}
		this.reportImportDurations();
		if (!(this.reportEnvironmentDiagnostic(files) || this.reportImportDiagnostic(files) || this.reportTransformDiagnostic(files))) this.reportIsolateDiagnostic(files);
		this.log();
	}
	getEffectiveMaxWorkers() {
		const configured = this.ctx.config.maxWorkers;
		return typeof configured === "number" && configured > 0 ? configured : Math.max(1, availableParallelism() - 1);
	}
	/**
	* Surfaces the cost of re-creating a DOM environment for every test file:
	* with an isolating pool, `jsdom`/`happy-dom` are imported and set up once
	* per file. When that repeated setup dominates the run, hint that a `vm`
	* pool sets the environment up once per worker while keeping per-file
	* isolation, and that `isolate: false` shares it across files.
	*/
	reportEnvironmentDiagnostic(files) {
		// merged blob reports replay durations of past runs: no environments were
		// created by this process
		if (this.ctx.config.watch || this.ctx.state.blobs || !this.ctx.config.experimental.diagnostics.environment) return false;
		const executionTime = this.end - this.start;
		const maxWorkers = this.getEffectiveMaxWorkers();
		const inputs = this.ctx.projects.map((project) => {
			const projectFiles = files.filter((file) => (file.projectName || "") === project.name);
			let environmentTime = 0;
			let environmentCount = 0;
			let trackedTime = 0;
			for (const file of projectFiles) {
				if (file.environmentLoad) {
					environmentTime += file.environmentLoad;
					environmentCount++;
				}
				trackedTime += trackedFileTime(file);
			}
			return {
				name: project.name,
				environment: project.config.environment,
				pool: project.config.pool,
				isolate: project.config.isolate,
				browser: project.config.browser.enabled,
				poolProvided: project.config.providedOptions.pool,
				isolateProvided: project.config.providedOptions.isolate,
				environmentTime,
				environmentCount,
				trackedTime,
				parallelism: Math.max(1, Math.min(environmentCount, maxWorkers)),
				executionTime
			};
		});
		const diagnostics = getEnvironmentDiagnostics(inputs);
		if (!diagnostics.length) return false;
		for (const diagnostic of diagnostics) {
			const project = this.ctx.projects.find((p) => p.name === diagnostic.name);
			this.log();
			this.log(padSummaryTitle("Environment"), formatProjectName(project) + y.yellow(`${diagnostic.environment} was created ${diagnostic.environmentCount} times`) + y.dim(` · ${formatTime(diagnostic.environmentTime)} total, ${Math.round(diagnostic.share * 100)}% of tracked time`));
			const alternative = diagnostic.suggestIsolate ? y.dim(" (keeps per-file isolation) or ") + y.yellow("isolate: false") + y.dim(" (shares it across files)") : y.dim(" (keeps per-file isolation)");
			this.log(padSummaryTitle(""), y.dim("create it once per worker with ") + y.yellow(`pool: 'vmThreads'`) + alternative);
			this.log(padSummaryTitle(""), y.dim("learn more: https://vitest.dev/guide/improving-performance#test-environments"));
		}
		return true;
	}
	/**
	* Surfaces repeated evaluation of the same module graph: with `isolate: true`
	* every test file re-imports its whole graph, so suites where files share
	* most of their modules (typically through barrel files) pay the graph cost
	* once per file. The duplication is measured from server-side fetch counts,
	* so suites with disjoint per-file graphs stay quiet.
	*/
	reportImportDiagnostic(files) {
		if (this.ctx.config.watch || this.ctx.state.blobs || !this.ctx.config.experimental.diagnostics.import) return false;
		const executionTime = this.end - this.start;
		const maxWorkers = this.getEffectiveMaxWorkers();
		const inputs = this.ctx.projects.map((project) => {
			const projectFiles = files.filter((file) => (file.projectName || "") === project.name);
			let importTime = 0;
			let trackedTime = 0;
			for (const file of projectFiles) {
				// the transform wait is subtracted because `isolate: false` only avoids
				// re-evaluating modules, the server transforms each of them once either way
				importTime += Math.max((file.collectDuration || 0) - (file.collectFetchDuration || 0), 0);
				trackedTime += trackedFileTime(file);
			}
			const durations = this.ctx.state.metadata[project.name]?.duration;
			return {
				name: project.name,
				pool: project.config.pool,
				isolate: project.config.isolate,
				browser: project.config.browser.enabled,
				isolateProvided: project.config.providedOptions.isolate,
				importTime,
				trackedTime,
				fetchCounts: durations ? Object.values(durations).map((times) => times.length) : [],
				fileCount: projectFiles.length,
				parallelism: Math.max(1, Math.min(projectFiles.length, maxWorkers)),
				executionTime
			};
		});
		const diagnostics = getImportDiagnostics(inputs);
		if (!diagnostics.length) return false;
		for (const diagnostic of diagnostics) {
			const project = this.ctx.projects.find((p) => p.name === diagnostic.name);
			this.log();
			this.log(padSummaryTitle("Import"), formatProjectName(project) + y.yellow(`${diagnostic.uniqueModules} modules were evaluated ${diagnostic.totalFetches} times`) + y.dim(` · ${formatTime(diagnostic.importTime)} total, ${Math.round(diagnostic.share * 100)}% of tracked time`));
			this.log(padSummaryTitle(""), y.dim(`~${formatTime(diagnostic.estimatedSaving)} faster with `) + y.yellow("isolate: false") + y.dim(" — shared modules are evaluated once per worker instead of once per file"));
			this.log(padSummaryTitle(""), y.dim("learn more: https://vitest.dev/guide/improving-performance#test-isolation"));
		}
		return true;
	}
	/**
	* Surfaces transform-dominated runs: without the fs module cache every
	* `vitest run` transforms the whole module graph from scratch. Enabling
	* `fsModuleCache` persists the results so the next run skips them.
	*/
	reportTransformDiagnostic(files) {
		if (this.ctx.config.watch || this.ctx.state.blobs || !this.ctx.config.experimental.diagnostics.transform) return false;
		const executionTime = this.end - this.start;
		const inputs = this.ctx.projects.map((project) => {
			const projectFiles = files.filter((file) => (file.projectName || "") === project.name);
			let transformTime = 0;
			let trackedTime = 0;
			for (const file of projectFiles) {
				transformTime += (file.setupFetchDuration || 0) + (file.collectFetchDuration || 0);
				trackedTime += trackedFileTime(file);
			}
			return {
				name: project.name,
				transformTime,
				trackedTime,
				fsModuleCache: project.config.fsModuleCache === true,
				fsModuleCacheProvided: project.config.providedOptions.fsModuleCache,
				executionTime
			};
		});
		const diagnostics = getTransformDiagnostics(inputs);
		if (!diagnostics.length) return false;
		for (const diagnostic of diagnostics) {
			const project = this.ctx.projects.find((p) => p.name === diagnostic.name);
			this.log();
			this.log(padSummaryTitle("Transform"), formatProjectName(project) + y.yellow(`transforming modules took ${formatTime(diagnostic.transformTime)}`) + y.dim(` · ${Math.round(diagnostic.share * 100)}% of tracked time, re-done on every run`));
			this.log(padSummaryTitle(""), y.dim("persist transforms across runs with ") + y.yellow("fsModuleCache: true"));
			if (isCI) this.log(padSummaryTitle(""), y.dim("on CI this only helps when the cache directory is persisted between runs"));
			this.log(padSummaryTitle(""), y.dim("learn more: https://vitest.dev/guide/improving-performance#caching-between-reruns"));
		}
		return true;
	}
	/**
	* Surfaces the cost of `isolate: true`: with isolation enabled Vitest spawns a
	* fresh worker (and re-creates the test environment) for every test file. When
	* that repeated startup cost is significant, hint that `isolate: false` would
	* reuse workers across files.
	*/
	reportIsolateDiagnostic(files) {
		// opt-out via `experimental.diagnostics.isolate`; the timers it relies on
		// are only shown for a full (non-watch) run
		if (this.ctx.config.watch || !this.ctx.config.experimental.diagnostics.isolate) return;
		const state = this.ctx.state;
		const numWorkers = state.workersSpawned;
		// only meaningful when at least one non-browser project isolates workers
		// without the user having explicitly chosen isolation
		const isolates = this.ctx.projects.some((project) => project.config.isolate && !project.config.browser.enabled && !project.config.providedOptions.isolate);
		if (!numWorkers || !isolates) return;
		const numFiles = files.length;
		// `startupTime` is the summed (across workers) time spent spawning the worker,
		// loading its bundle and setting up the environment. The environment setup is
		// already part of this window, so it is not added separately.
		const startupTime = state.startupTime;
		const avgStartup = startupTime / numWorkers;
		// with `isolate: false` the same files would run in ~`parallelism` reused
		// workers instead of spawning a fresh worker for every file
		const parallelism = Math.max(1, Math.min(numFiles, this.getEffectiveMaxWorkers()));
		// nothing was actually spawned per-file (e.g. a single worker handled everything)
		if (numWorkers <= parallelism) return;
		// Spawns are spread across ~`parallelism` lanes, so the wall-clock cost is the
		// summed startup divided by parallelism. Reusing workers leaves ~1 spawn per
		// lane, so the reducible wall-clock time is the rest.
		const wallStartup = startupTime / parallelism;
		// Reused workers also keep evaluated modules alive, so every module a later
		// file would re-evaluate is saved as well. Per-module evaluation times are
		// only collected when `experimental.importDurations` is enabled — without
		// them the spawn saving is reported as a lower bound ("at least").
		const measuresModules = this.ctx.config.experimental.importDurations.limit > 0;
		let moduleSavings = 0;
		if (measuresModules) {
			// vm pools re-create the module graph per VM context regardless of
			// `isolate`, so only files of `forks`/`threads` projects count
			const eligibleProjects = new Set(this.ctx.projects.filter((project) => (project.config.pool === "forks" || project.config.pool === "threads") && project.config.isolate && !project.config.browser.enabled && !project.config.providedOptions.isolate).map((project) => project.name));
			const moduleSelfTimes = /* @__PURE__ */ new Map();
			for (const file of files) {
				if (!eligibleProjects.has(file.projectName || "") || !file.importDurations) continue;
				for (const moduleId in file.importDurations) {
					let times = moduleSelfTimes.get(moduleId);
					if (!times) {
						times = [];
						moduleSelfTimes.set(moduleId, times);
					}
					times.push(file.importDurations[moduleId].selfTime);
				}
			}
			moduleSavings = estimateModuleEvaluationSaving(moduleSelfTimes.values(), parallelism);
		}
		const estimatedSavings = wallStartup - avgStartup + moduleSavings;
		if (!isSavingWorthHinting(estimatedSavings, this.end - this.start)) return;
		this.log();
		this.log(padSummaryTitle("Isolate"), y.yellow(`${numWorkers} workers spawned`) + y.dim(` · ~${formatTime(avgStartup)} startup each (spawn + environment, per file)`));
		this.log(padSummaryTitle(""), y.dim(`${measuresModules ? "" : "at least "}~${formatTime(estimatedSavings)} faster with `) + y.yellow("isolate: false") + y.dim(measuresModules ? " — reuses workers across files and evaluates shared modules once per worker" : " — reuses workers across files instead of one per file"));
	}
	reportImportDurations() {
		const { print, failOnDanger, thresholds } = this.ctx.config.experimental.importDurations;
		if (!print && !failOnDanger) return;
		const testModules = this.ctx.state.getTestModules();
		const allImports = [];
		for (const testModule of testModules) {
			const importDurations = testModule.diagnostic().importDurations;
			for (const filePath in importDurations) {
				const duration = importDurations[filePath];
				allImports.push({
					importedModuleId: filePath,
					testModule,
					selfTime: duration.selfTime,
					totalTime: duration.totalTime,
					external: duration.external
				});
			}
		}
		if (allImports.length === 0) return;
		let dangerImportsCount = 0;
		let hasWarnImports = false;
		let totalSelfTime = 0;
		let totalTotalTime = 0;
		for (const imp of allImports) {
			if (imp.totalTime >= thresholds.danger) dangerImportsCount++;
			if (imp.totalTime >= thresholds.warn) hasWarnImports = true;
			totalSelfTime += imp.selfTime;
			totalTotalTime += imp.totalTime;
		}
		// Determine if we should print
		const shouldFail = failOnDanger && dangerImportsCount > 0;
		if (!(print === true || print === "on-warn" && hasWarnImports || shouldFail)) return;
		const sortedImports = allImports.sort((a, b) => b.totalTime - a.totalTime);
		const maxTotalTime = sortedImports[0].totalTime;
		const limit = this.ctx.config.experimental.importDurations.limit;
		const topImports = sortedImports.slice(0, limit);
		const slowestImport = sortedImports[0];
		this.log();
		this.log(y.bold("Import Duration Breakdown") + y.dim(` (Top ${limit})`));
		this.log();
		this.log(y.dim(`${"Module".padEnd(50)} ${"Self".padStart(6)} ${"Total".padStart(6)}`));
		// if there are multiple files, it's highly possible that some of them will import the same large file
		// we group them to show the distinction between those files more easily
		//     Import Duration Breakdown (Top 10)
		//
		//     Module                                              Self     Total
		//     .../fields/FieldFile/__tests__/FieldFile.spec.ts     7ms    1.01s  ████████████████████
		//      ↳ tests/support/components/index.ts                 0ms     861ms █████████████████░░░
		//      ↳ tests/support/components/renderComponent.ts      59ms     861ms █████████████████░░░
		//     ...s__/apps/desktop/form-updater.desktop.spec.ts     8ms     991ms ████████████████████
		//     ...sts__/apps/mobile/form-updater.mobile.spec.ts    11ms     990ms ████████████████████
		//     shared/components/Form/__tests__/Form.spec.ts        5ms     988ms ████████████████████
		//      ↳ tests/support/components/index.ts                 0ms     935ms ███████████████████░
		//      ↳ tests/support/components/renderComponent.ts      61ms     935ms ███████████████████░
		//     ...ditor/features/link/__test__/LinkForm.spec.ts     7ms     972ms ███████████████████░
		//      ↳ tests/support/components/renderComponent.ts      56ms     936ms ███████████████████░
		const groupedImports = Object.entries(
			groupBy(topImports, (i) => i.testModule.id)
			// the first one is always the highest because the modules are already sorted
		).sort(([, imps1], [, imps2]) => imps2[0].totalTime - imps1[0].totalTime);
		for (const [_, group] of groupedImports) group.forEach((imp, index) => {
			const barWidth = 20;
			const filledWidth = Math.round(imp.totalTime / maxTotalTime * barWidth);
			const bar = y.cyan("█".repeat(filledWidth)) + y.dim("░".repeat(barWidth - filledWidth));
			// only show the arrow if there is more than 1 group
			const pathDisplay = this.ellipsisPath(imp.importedModuleId, imp.external, groupedImports.length > 1 && index > 0);
			this.log(`${pathDisplay} ${this.importDurationTime(imp.selfTime)} ${this.importDurationTime(imp.totalTime)}  ${bar}`);
		});
		this.log();
		this.log(y.dim("Total imports: ") + allImports.length);
		this.log(y.dim("Slowest import (total-time): ") + formatTime(slowestImport.totalTime));
		this.log(y.dim("Total import time (self/total): ") + formatTime(totalSelfTime) + y.dim(" / ") + formatTime(totalTotalTime));
		// Fail if danger threshold exceeded
		if (shouldFail) {
			this.log();
			this.ctx.logger.error(`ERROR: ${dangerImportsCount} import(s) exceeded the danger threshold of ${thresholds.danger}ms`);
			process.exitCode = 1;
		}
	}
	importDurationTime(duration) {
		const { thresholds } = this.ctx.config.experimental.importDurations;
		return (duration >= thresholds.danger ? y.red : duration >= thresholds.warn ? y.yellow : (c) => c)(formatTime(duration).padStart(6));
	}
	ellipsisPath(path, external, nested) {
		const pathDisplay = this.relative(path);
		const color = external ? y.magenta : (c) => c;
		const slicedPath = pathDisplay.slice(-44);
		let title = "";
		if (pathDisplay.length > slicedPath.length) title += "...";
		if (nested) title = ` ${F_DOWN_RIGHT} ${title}`;
		title += slicedPath;
		return color(title.padEnd(50));
	}
	printErrorsSummary(files, errors) {
		const suites = getSuites(files);
		const tests = getTests(files);
		const failedSuites = suites.filter((i) => i.result?.errors);
		const failedTests = tests.filter((i) => i.result?.state === "fail");
		const failedTotal = countTestErrors(failedSuites) + countTestErrors(failedTests);
		// TODO: error divider should take into account merged errors for counting
		let current = 1;
		const errorDivider = () => this.error(`${y.red(y.dim(divider(`[${current++}/${failedTotal}]`, void 0, 1)))}\n`);
		if (failedSuites.length) {
			this.error(`\n${errorBanner(`Failed Suites ${failedSuites.length}`)}\n`);
			this.printTaskErrors(failedSuites, errorDivider);
		}
		if (failedTests.length) {
			this.error(`\n${errorBanner(`Failed Tests ${failedTests.length}`)}\n`);
			this.printTaskErrors(failedTests, errorDivider);
		}
		if (errors.length) {
			this.ctx.logger.printUnhandledErrors(errors);
			this.error();
		}
	}
	printLeaksSummary() {
		const leaks = this.ctx.state.leakSet;
		if (leaks.size === 0) return 0;
		const leakWithStacks = /* @__PURE__ */ new Map();
		// Leaks can be duplicate, where type and position are identical
		for (const leak of leaks) {
			const stacks = parseStacktrace(leak.stack);
			if (stacks.length === 0) continue;
			const key = `${this.relative(leak.filename)}:${stacks[0].line}:${stacks[0].column}:${leak.type}`;
			if (leakWithStacks.has(key)) continue;
			leakWithStacks.set(key, {
				leak,
				stacks
			});
		}
		this.error(`\n${errorBanner(`Async Leaks ${leakWithStacks.size}`)}\n`);
		for (const { leak, stacks } of leakWithStacks.values()) {
			const filename = this.relative(leak.filename);
			this.ctx.logger.error(y.red(`${leak.type} leaking in ${filename}`));
			try {
				const sourceCode = readFileSync(stacks[0].file, "utf-8");
				this.ctx.logger.error(generateCodeFrame(sourceCode.length > 1e5 ? sourceCode : this.ctx.logger.highlight(stacks[0].file, sourceCode), void 0, stacks[0]));
			} catch {}
			printStack(this.ctx.logger, this.ctx.getProjectByName(leak.projectName), stacks, stacks[0], {});
		}
		return leakWithStacks.size;
	}
	printPerProjectBenchmarks() {
		if (this._perProjectBenchmarks.size === 0) return;
		let hasComparable = false;
		for (const projectMap of this._perProjectBenchmarks.values()) if (projectMap.size > 1) {
			hasComparable = true;
			break;
		}
		if (!hasComparable) return;
		this.log("");
		this.log(divider(y.bold(y.bgBlue(` Cross-Project Benchmark Comparison `)), null, null, y.blue));
		for (const [benchName, projectMap] of this._perProjectBenchmarks) {
			const tasks = [...projectMap.entries()].sort((a, b) => a[1].latency.mean - b[1].latency.mean).map(([projectName, task], index) => ({
				...task,
				name: projectName,
				rank: index + 1
			}));
			if (tasks.length <= 1) continue;
			this.log("");
			this.log(`  ${y.dim(benchName)}`);
			this.printBenchmarkTable([{
				name: benchName,
				tasks
			}], "", "project");
		}
		this.log("");
	}
	printBenchmarkTable(benchmarks, basePadding, columnName = "name") {
		let printedCount = 0;
		for (const benchmark of benchmarks) {
			const { tasks } = benchmark;
			if (tasks.length === 0) continue;
			if (printedCount > 0) this.log("");
			const rows = tasks.map((t) => renderBenchmarkRow(t));
			const tableHead = [columnName, ...BENCH_TABLE_HEAD];
			const widths = computeBenchColumnWidths(tableHead, rows);
			const indent = ` ${basePadding}  `;
			this.log(`${indent}${padBenchRow(tableHead, widths).map(y.bold).join("  ")}`);
			printedCount++;
			for (const task of tasks) {
				const padded = padBenchRow(renderBenchmarkRow(task), widths);
				let row = [
					padded[0],
					y.blue(padded[1]),
					y.cyan(padded[2]),
					y.cyan(padded[3]),
					y.cyan(padded[4]),
					y.cyan(padded[5]),
					y.cyan(padded[6]),
					y.cyan(padded[7]),
					y.cyan(padded[8]),
					y.dim(padded[9]),
					y.dim(padded[10])
				].join("  ");
				if (task.rank === 1 && tasks.length > 1) row += y.bold(y.green("   fastest"));
				if (task.rank === tasks.length && tasks.length > 2) row += y.bold(y.gray("   slowest"));
				this.log(`${indent}${row}`);
			}
		}
	}
	printTaskErrors(tasks, errorDivider) {
		const errorsQueue = [];
		for (const task of tasks)
 // Merge identical errors
		task.result?.errors?.forEach((error) => {
			let previous;
			if (error?.stack) previous = errorsQueue.find((i) => {
				if (i[0]?.stack !== error.stack || i[0]?.diff !== error.diff) return false;
				const currentProjectName = task?.projectName || task.file?.projectName || "";
				const projectName = i[1][0]?.projectName || i[1][0].file?.projectName || "";
				const currentAnnotations = task.type === "test" && task.annotations;
				const itemAnnotations = i[1][0].type === "test" && i[1][0].annotations;
				return projectName === currentProjectName && deepEqual(currentAnnotations, itemAnnotations);
			});
			if (previous) previous[1].push(task);
			else errorsQueue.push([error, [task]]);
		});
		for (const [error, tasks] of errorsQueue) {
			for (const task of tasks) {
				const filepath = task?.filepath || "";
				const projectName = task?.projectName || task.file?.projectName || "";
				const project = this.ctx.projects.find((p) => p.name === projectName);
				let name = this.getFullName(task, separator);
				if (filepath) name += y.dim(` [ ${this.relative(filepath)} ]`);
				const label = this.ctx.state.blobs && task.file?.meta?.__vitest_label__;
				this.ctx.logger.error(`${y.bgRed(y.bold(" FAIL "))} ${formatProjectName(project)}${label ? `${y.bgCyan(y.bold(` ${label} `))} ` : ""}${name}`);
			}
			const screenshotPaths = tasks.reduce((paths, t) => {
				if (t.type === "test") {
					for (const artifact of t.artifacts) if (artifact.type === "internal:failureScreenshot") {
						if (artifact.attachments.length) paths.push(artifact.attachments[0].originalPath);
					}
				}
				return paths;
			}, []);
			this.ctx.logger.printError(error, {
				project: this.ctx.getProjectByName(tasks[0].file.projectName || ""),
				verbose: this.verbose,
				screenshotPaths
			});
			if (tasks[0].type === "test" && tasks[0].annotations.length) {
				const test = this.ctx.state.getReportedEntity(tasks[0]);
				this.printAnnotations(test, "error", 1);
				this.error();
			}
			errorDivider();
		}
	}
}
function deepEqual(a, b) {
	if (a === b) return true;
	if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
	const keysA = Object.keys(a);
	const keysB = Object.keys(b);
	if (keysA.length !== keysB.length) return false;
	for (const key of keysA) if (!Object.hasOwn(b, key) || !deepEqual(a[key], b[key])) return false;
	return true;
}
function sum(items, cb) {
	return items.reduce((total, next) => {
		return total + Math.max(cb(next) || 0, 0);
	}, 0);
}
/**
* Summed time of all tracked phases of a file. The transform wait is part of
* `setupDuration`/`collectDuration`, so it is not added separately.
*/
function trackedFileTime(file) {
	return (file.environmentLoad || 0) + (file.setupDuration || 0) + (file.collectDuration || 0) + (file.prepareDuration || 0) + (file.result?.duration || 0);
}
function getIndentation(suite, level = 1) {
	if (suite.suite && !("filepath" in suite.suite)) return getIndentation(suite.suite, level + 1);
	return level;
}

/** Minimum time between two renders, no matter how many scheduled renders were called */
const DEFAULT_RENDER_THRESHOLD_MS = 100;
/** Interval between automatic renders. If no test state changes happened, this will increase just duration field */
const DEFAULT_RENDER_INTERVAL_MS = 1e3;
const ESC = "\x1B[";
const CLEAR_LINE = `${ESC}K`;
const MOVE_CURSOR_ONE_ROW_UP = `${ESC}1A`;
const SYNC_START = `${ESC}?2026h`;
const SYNC_END = `${ESC}?2026l`;
/**
* Renders content of `getWindow` at the bottom of the terminal and
* forwards all other intercepted `stdout` and `stderr` logs above it.
*/
class WindowRenderer {
	options;
	streams;
	buffer = [];
	renderInterval = void 0;
	renderScheduled = false;
	windowHeight = 0;
	started = false;
	finished = false;
	cleanups = [];
	constructor(options) {
		this.options = {
			...options,
			threshold: options.threshold ?? DEFAULT_RENDER_THRESHOLD_MS,
			interval: options.interval ?? DEFAULT_RENDER_INTERVAL_MS
		};
		// Capture the original write methods early, before intercepting these
		this.streams = {
			output: options.logger.outputStream.write.bind(options.logger.outputStream),
			error: options.logger.errorStream.write.bind(options.logger.errorStream)
		};
		this.cleanups.push(this.interceptStream(process.stdout, "output"), this.interceptStream(process.stderr, "error"));
		// Intercept calls to custom VitestOptions.stdout and stderr streams
		if (options.logger.outputStream !== process.stdout) this.cleanups.push(this.interceptStream(options.logger.outputStream, "output"));
		if (options.logger.errorStream !== process.stderr) this.cleanups.push(this.interceptStream(options.logger.errorStream, "error"));
		// Write buffered content on unexpected exits, e.g. direct `process.exit()` calls
		this.options.logger.onTerminalCleanup(() => {
			this.flushBuffer();
			this.stop();
		});
	}
	start() {
		this.started = true;
		this.finished = false;
		this.renderInterval = setInterval(() => this.schedule(), this.options.interval).unref();
	}
	stop() {
		this.cleanups.splice(0).map((fn) => fn());
		clearInterval(this.renderInterval);
	}
	/**
	* Write all buffered output and stop buffering.
	* All intercepted writes are forwarded to actual write after this.
	*/
	finish() {
		this.finished = true;
		this.flushBuffer();
		clearInterval(this.renderInterval);
	}
	/**
	* Queue new render update
	*/
	schedule() {
		if (!this.renderScheduled) {
			this.renderScheduled = true;
			this.flushBuffer();
			if (this.options.threshold) setTimeout(() => {
				this.renderScheduled = false;
			}, this.options.threshold).unref();
			else this.renderScheduled = false;
		}
	}
	flushBuffer() {
		if (this.buffer.length === 0) return this.render();
		let current;
		// Concatenate same types into a single render
		for (const next of this.buffer.splice(0)) {
			if (!current) {
				current = next;
				continue;
			}
			if (current.type !== next.type) {
				this.render(current.message, current.type);
				current = next;
				continue;
			}
			current.message += next.message;
		}
		if (current) this.render(current?.message, current?.type);
	}
	render(message, type = "output") {
		this.write(SYNC_START);
		if (this.finished) {
			this.clearWindow();
			this.write(message || "", type);
			return this.write(SYNC_END);
		}
		const windowContent = this.options.getWindow();
		const rowCount = getRenderedRowCount(windowContent, this.options.logger.getColumns());
		let padding = this.windowHeight - rowCount;
		if (padding > 0 && message) padding -= getRenderedRowCount([message], this.options.logger.getColumns());
		this.clearWindow();
		if (message) this.write(message, type);
		if (padding > 0) this.write("\n".repeat(padding));
		this.write(windowContent.join("\n"));
		this.write(SYNC_END);
		this.windowHeight = rowCount + Math.max(0, padding);
	}
	clearWindow() {
		if (this.windowHeight === 0) return;
		this.write(CLEAR_LINE);
		for (let i = 1; i < this.windowHeight; i++) this.write(`${MOVE_CURSOR_ONE_ROW_UP}${CLEAR_LINE}`);
		this.windowHeight = 0;
	}
	interceptStream(stream, type) {
		const original = stream.write;
		// @ts-expect-error -- not sure how 2 overloads should be typed
		stream.write = (chunk, _, callback) => {
			if (chunk) if (this.finished || !this.started) this.write(chunk.toString(), type);
			else this.buffer.push({
				type,
				message: chunk.toString()
			});
			callback?.();
		};
		return function restore() {
			stream.write = original;
		};
	}
	write(message, type = "output") {
		this.streams[type](message);
	}
}
/** Calculate the actual row count needed to render `rows` into `stream` */
function getRenderedRowCount(rows, columns) {
	let count = 0;
	for (const row of rows) {
		const text = stripVTControlCharacters(row);
		count += Math.max(1, Math.ceil(text.length / columns));
	}
	return count;
}

const DURATION_UPDATE_INTERVAL_MS = 100;
const FINISHED_TEST_CLEANUP_TIME_MS = 1e3;
/**
* Reporter extension that renders summary and forwards all other logs above itself.
* Intended to be used by other reporters, not as a standalone reporter.
*/
class SummaryReporter {
	ctx;
	options;
	renderer;
	modules = emptyCounters();
	tests = emptyCounters();
	maxParallelTests = 0;
	/** Currently running test modules, may include finished test modules too */
	runningModules = /* @__PURE__ */ new Map();
	/** ID of finished `this.runningModules` that are currently being shown */
	finishedModules = /* @__PURE__ */ new Map();
	startTime = "";
	currentTime = 0;
	duration = 0;
	durationInterval = void 0;
	onInit(ctx, options = {}) {
		this.ctx = ctx;
		this.options = {
			verbose: false,
			...options
		};
		this.renderer = new WindowRenderer({
			logger: ctx.logger,
			getWindow: () => this.createSummary(),
			interval: this.options.interval,
			threshold: this.options.threshold
		});
		this.ctx.onClose(() => {
			clearInterval(this.durationInterval);
			this.renderer.stop();
		});
	}
	onTestRunStart(specifications) {
		this.runningModules.clear();
		this.finishedModules.clear();
		this.modules = emptyCounters();
		this.tests = emptyCounters();
		this.startTimers();
		this.renderer.start();
		this.modules.total = specifications.length;
	}
	onTestRunEnd() {
		this.runningModules.clear();
		this.finishedModules.clear();
		this.renderer.finish();
		clearInterval(this.durationInterval);
	}
	onTestModuleQueued(module) {
		// When new test module starts, take the place of previously finished test module, if any
		if (this.finishedModules.size) {
			const finished = this.finishedModules.keys().next().value;
			this.removeTestModule(finished);
		}
		this.runningModules.set(module.id, initializeStats(module));
		this.renderer.schedule();
	}
	onTestModuleCollected(module) {
		let stats = this.runningModules.get(module.id);
		if (!stats) {
			stats = initializeStats(module);
			this.runningModules.set(module.id, stats);
		}
		const total = Array.from(module.children.allTests()).length;
		this.tests.total += total;
		stats.total = total;
		this.maxParallelTests = Math.max(this.maxParallelTests, this.runningModules.size);
		this.renderer.schedule();
	}
	startStep(stats, name) {
		const step = {
			name,
			visible: false,
			startTime: performance.now(),
			onFinish: () => {}
		};
		stats.step?.onFinish?.();
		stats.step = step;
		if (!Number.isFinite(this.ctx.config.slowTestThreshold)) return;
		const timeout = setTimeout(() => {
			step.visible = true;
		}, this.ctx.config.slowTestThreshold).unref();
		step.onFinish = () => clearTimeout(timeout);
	}
	onHookStart(options) {
		const stats = this.getStepStats(options.entity);
		if (stats) this.startStep(stats, options.name);
	}
	onHookEnd(options) {
		const stats = this.getStepStats(options.entity);
		if (stats?.step?.name !== options.name) return;
		stats.step.onFinish();
		stats.step.visible = false;
	}
	onTestCaseReady(test) {
		// Track slow running tests only on verbose mode
		if (!this.options.verbose) return;
		const stats = this.runningModules.get(test.module.id);
		if (!stats || stats.tests.has(test.id)) return;
		const slowTest = {
			name: test.name,
			visible: false,
			startTime: performance.now(),
			onFinish: () => {}
		};
		const timeout = Number.isFinite(this.ctx.config.slowTestThreshold) ? setTimeout(() => {
			slowTest.visible = true;
		}, this.ctx.config.slowTestThreshold).unref() : void 0;
		slowTest.onFinish = () => {
			slowTest.step?.onFinish();
			clearTimeout(timeout);
		};
		stats.tests.set(test.id, slowTest);
	}
	onTestCaseResult(test) {
		const stats = this.runningModules.get(test.module.id);
		if (!stats) return;
		stats.tests.get(test.id)?.onFinish();
		stats.tests.delete(test.id);
		stats.completed++;
		const result = test.result();
		if (result?.state === "passed")
 // Check if this is an expected failure (test.fails && passed)
		if (test.options.fails) this.tests.expectedFail++;
		else this.tests.passed++;
		else if (result?.state === "failed") this.tests.failed++;
		else if (!result?.state || result?.state === "skipped") if (test.options.mode === "todo") this.tests.todo++;
		else this.tests.skipped++;
		this.renderer.schedule();
	}
	onTestModuleEnd(module) {
		const state = module.state();
		this.modules.completed++;
		if (state === "passed") this.modules.passed++;
		else if (state === "failed") this.modules.failed++;
		else if (module.task.mode === "todo" && state === "skipped") this.modules.todo++;
		else if (state === "skipped") this.modules.skipped++;
		// Keep finished tests visible in summary for a while if there are more tests left.
		// When a new test starts in onTestModuleQueued it will take this ones place.
		// This reduces flickering by making summary more stable.
		if (this.modules.total - this.modules.completed > this.maxParallelTests) this.finishedModules.set(module.id, setTimeout(() => {
			this.removeTestModule(module.id);
		}, FINISHED_TEST_CLEANUP_TIME_MS).unref());
		else
 // Run is about to end as there are less tests left than whole run had parallel at max.
		// Remove finished test immediately.
		this.removeTestModule(module.id);
		this.renderer.schedule();
	}
	getStepStats(entity) {
		// Track slow running hooks only on verbose mode
		if (!this.options.verbose) return;
		const module = entity.type === "module" ? entity : entity.module;
		const stats = this.runningModules.get(module.id);
		if (!stats) return;
		return entity.type === "test" ? stats.tests.get(entity.id) : stats;
	}
	createSummary() {
		const summary = [""];
		for (const testFile of Array.from(this.runningModules.values()).sort(sortRunningModules)) {
			const typecheck = testFile.meta.typecheck ? `${y.bgBlue(y.bold(" TS "))} ` : "";
			const label = this.ctx.state.blobs && testFile.meta.__vitest_label__ ? `${y.bgCyan(y.bold(` ${testFile.meta.__vitest_label__} `))} ` : "";
			summary.push(y.bold(y.yellow(` ${F_POINTER} `)) + formatProjectName({
				name: testFile.projectName,
				color: testFile.projectColor
			}) + typecheck + label + testFile.filename + y.dim(!testFile.completed && !testFile.total ? " [queued]" : ` ${testFile.completed}/${testFile.total}`));
			const slowTasks = [testFile.step, ...testFile.tests.values()].filter((t) => t != null && t.visible);
			for (const [index, task] of slowTasks.entries()) {
				const elapsed = this.currentTime - task.startTime;
				const icon = index === slowTasks.length - 1 ? F_TREE_NODE_END : F_TREE_NODE_MIDDLE;
				summary.push(y.bold(y.yellow(`   ${icon} `)) + task.name + y.bold(y.yellow(` ${formatTime(Math.max(0, elapsed))}`)));
				if (task.step?.visible) summary.push(y.bold(y.yellow(`      ${F_TREE_NODE_END} `)) + task.step.name);
			}
		}
		if (this.runningModules.size > 0) summary.push("");
		summary.push(padSummaryTitle("Test Files") + getStateString(this.modules));
		summary.push(padSummaryTitle("Tests") + getStateString(this.tests));
		summary.push(padSummaryTitle("Start at") + this.startTime);
		summary.push(padSummaryTitle("Duration") + formatTime(this.duration));
		summary.push("");
		return summary;
	}
	startTimers() {
		const start = performance.now();
		this.startTime = formatTimeString(/* @__PURE__ */ new Date());
		this.durationInterval = setInterval(() => {
			this.currentTime = performance.now();
			this.duration = this.currentTime - start;
		}, DURATION_UPDATE_INTERVAL_MS).unref();
	}
	removeTestModule(id) {
		if (!id) return;
		const testFile = this.runningModules.get(id);
		testFile?.step?.onFinish();
		testFile?.tests?.forEach((test) => test.onFinish());
		this.runningModules.delete(id);
		clearTimeout(this.finishedModules.get(id));
		this.finishedModules.delete(id);
	}
}
function emptyCounters() {
	return {
		completed: 0,
		passed: 0,
		failed: 0,
		skipped: 0,
		todo: 0,
		expectedFail: 0,
		total: 0
	};
}
function getStateString(entry) {
	return [
		entry.failed ? y.bold(y.red(`${entry.failed} failed`)) : null,
		y.bold(y.green(`${entry.passed} passed`)),
		entry.expectedFail ? y.cyan(`${entry.expectedFail} expected fail`) : null,
		entry.skipped ? y.yellow(`${entry.skipped} skipped`) : null,
		entry.todo ? y.gray(`${entry.todo} todo`) : null
	].filter(Boolean).join(y.dim(" | ")) + y.gray(` (${entry.total})`);
}
function sortRunningModules(a, b) {
	if ((a.projectName || "") > (b.projectName || "")) return 1;
	if ((a.projectName || "") < (b.projectName || "")) return -1;
	return a.filename.localeCompare(b.filename);
}
function initializeStats(module) {
	return {
		total: 0,
		completed: 0,
		filename: module.task.name,
		projectName: module.project.name,
		projectColor: module.project.color,
		tests: /* @__PURE__ */ new Map(),
		meta: module.task.meta
	};
}

class DefaultReporter extends BaseReporter {
	options;
	summary;
	constructor(options = {}) {
		super(options);
		this.options = {
			summary: true,
			...options
		};
		if (!this.isTTY) this.options.summary = false;
		if (this.options.summary) this.summary = new SummaryReporter();
	}
	onTestRunStart(specifications) {
		if (this.isTTY) {
			if (this.renderSucceed === void 0) this.renderSucceed = !!this.renderSucceed;
			if (this.renderSucceed !== true) this.renderSucceed = specifications.length <= 1;
		}
		super.onTestRunStart(specifications);
		this.summary?.onTestRunStart(specifications);
	}
	onTestRunEnd(testModules, unhandledErrors, reason) {
		super.onTestRunEnd(testModules, unhandledErrors, reason);
		this.summary?.onTestRunEnd();
	}
	onTestModuleQueued(file) {
		this.summary?.onTestModuleQueued(file);
	}
	onTestModuleCollected(module) {
		this.summary?.onTestModuleCollected(module);
	}
	onTestModuleEnd(module) {
		super.onTestModuleEnd(module);
		this.summary?.onTestModuleEnd(module);
	}
	onTestCaseReady(test) {
		this.summary?.onTestCaseReady(test);
	}
	onTestCaseResult(test) {
		super.onTestCaseResult(test);
		this.summary?.onTestCaseResult(test);
	}
	onHookStart(hook) {
		this.summary?.onHookStart(hook);
	}
	onHookEnd(hook) {
		this.summary?.onHookEnd(hook);
	}
	onInit(ctx) {
		super.onInit(ctx);
		this.summary?.onInit(ctx, {
			verbose: this.verbose,
			...this.options.summaryOptions
		});
	}
}

class DotReporter extends BaseReporter {
	renderer;
	tests = /* @__PURE__ */ new Map();
	finishedTests = /* @__PURE__ */ new Set();
	onInit(ctx) {
		super.onInit(ctx);
		if (this.isTTY) {
			this.renderer = new WindowRenderer({
				logger: ctx.logger,
				getWindow: () => this.createSummary()
			});
			this.ctx.onClose(() => this.renderer?.stop());
		}
	}
	// Ignore default logging of base reporter
	printTestModule() {}
	onTestRunStart(_specifications) {
		super.onTestRunStart(_specifications);
		this.renderer?.start();
	}
	onWatcherRerun(files, trigger) {
		this.tests.clear();
		this.renderer?.start();
		super.onWatcherRerun(files, trigger);
	}
	onTestRunEnd(testModules, unhandledErrors, reason) {
		if (this.isTTY) {
			const finalLog = formatTests(Array.from(this.tests.values()));
			this.ctx.logger.log(finalLog);
		} else this.ctx.logger.log();
		this.tests.clear();
		this.renderer?.finish();
		super.onTestRunEnd(testModules, unhandledErrors, reason);
	}
	onTestModuleCollected(module) {
		for (const test of module.children.allTests())
 // Dot reporter marks pending tests as running
		this.onTestCaseReady(test);
	}
	onTestCaseReady(test) {
		if (this.finishedTests.has(test.id)) return;
		this.tests.set(test.id, test.result().state || "run");
		this.renderer?.schedule();
	}
	onTestCaseResult(test) {
		const result = test.result().state;
		// On non-TTY the finished tests are printed immediately
		if (!this.isTTY && result !== "pending") this.ctx.logger.outputStream.write(formatTests([result]));
		super.onTestCaseResult(test);
		this.finishedTests.add(test.id);
		this.tests.set(test.id, result || "skipped");
		this.renderer?.schedule();
	}
	onTestModuleEnd(testModule) {
		super.onTestModuleEnd(testModule);
		if (!this.isTTY) return;
		const columns = this.ctx.logger.getColumns();
		if (this.tests.size < columns) return;
		const finishedTests = Array.from(this.tests).filter((entry) => entry[1] !== "pending");
		if (finishedTests.length < columns) return;
		// Remove finished tests from state and render them in static output
		const states = [];
		let count = 0;
		for (const [id, state] of finishedTests) {
			if (count++ >= columns) break;
			this.tests.delete(id);
			states.push(state);
		}
		this.ctx.logger.log(formatTests(states));
		this.renderer?.schedule();
	}
	createSummary() {
		return [formatTests(Array.from(this.tests.values())), ""];
	}
}
// These are compared with reference equality in formatTests
const pass = {
	char: "·",
	color: y.green
};
const fail = {
	char: "x",
	color: y.red
};
const pending = {
	char: "*",
	color: y.yellow
};
const skip = {
	char: "-",
	color: (char) => y.dim(y.gray(char))
};
function getIcon(state) {
	switch (state) {
		case "passed": return pass;
		case "failed": return fail;
		case "skipped": return skip;
		default: return pending;
	}
}
/**
* Format test states into string while keeping ANSI escapes at minimal.
* Sibling icons with same color are merged into a single c.color() call.
*/
function formatTests(states) {
	let currentIcon = pending;
	let count = 0;
	let output = "";
	for (const state of states) {
		const icon = getIcon(state);
		if (currentIcon === icon) {
			count++;
			continue;
		}
		output += currentIcon.color(currentIcon.char.repeat(count));
		// Start tracking new group
		count = 1;
		currentIcon = icon;
	}
	output += currentIcon.color(currentIcon.char.repeat(count));
	return output;
}

// we prepend `test.name` to the default title when set, custom titles don't follow this logic
// we need to know when the user provides a custom one, so this is handled outside `defaultOptions`
const DEFAULT_TITLE = "Vitest Test Report";
const defaultOptions = {
	onWritePath: defaultOnWritePath,
	displayAnnotations: true,
	jobSummary: {
		enabled: true,
		outputPath: process.env.GITHUB_STEP_SUMMARY,
		fileLinks: {
			repository: process.env.GITHUB_REPOSITORY,
			commitHash: process.env.GITHUB_SHA,
			workspacePath: process.env.GITHUB_WORKSPACE
		}
	}
};
class GithubActionsReporter {
	ctx = void 0;
	options;
	constructor(options = {}) {
		this.options = deepMerge(Object.create(null), defaultOptions, options);
	}
	onInit(ctx) {
		this.ctx = ctx;
	}
	onTestCaseAnnotate(testCase, annotation) {
		if (!annotation.location || this.options.displayAnnotations === false) return;
		const type = getTitle(annotation.type);
		const formatted = formatMessage({
			command: getType(annotation.type),
			properties: {
				file: annotation.location.file,
				line: String(annotation.location.line),
				column: String(annotation.location.column),
				...type && { title: type }
			},
			message: stripVTControlCharacters(annotation.message)
		});
		this.ctx.logger.log(`\n${formatted}`);
	}
	onTestRunEnd(testModules, unhandledErrors) {
		const files = testModules.map((testModule) => testModule.task);
		const errors = [...unhandledErrors];
		// collect all errors and associate them with projects
		const projectErrors = new Array();
		for (const error of errors) projectErrors.push({
			project: this.ctx.getRootProject(),
			title: "Unhandled error",
			error
		});
		for (const file of files) {
			const tasks = getTasks(file);
			const project = this.ctx.getProjectByName(file.projectName || "");
			for (const task of tasks) {
				if (task.result?.state !== "fail") continue;
				const title = getFullName(task, " > ");
				for (const error of task.result?.errors ?? []) projectErrors.push({
					project,
					title: project.name ? `[${project.name}] ${title}` : title,
					error
				});
			}
		}
		// format errors via `printError`
		for (const { project, title, error } of projectErrors) {
			const result = this.ctx.logger.formatError(error, { project });
			const stack = result?.nearest;
			if (!stack) continue;
			const formatted = formatMessage({
				command: "error",
				properties: {
					file: this.options.onWritePath(stack.file),
					title,
					line: String(stack.line),
					column: String(stack.column)
				},
				message: stripVTControlCharacters(result.output)
			});
			this.ctx.logger.log(`\n${formatted}`);
		}
		if (this.options.jobSummary.enabled === true && this.options.jobSummary.outputPath) {
			const summary = renderSummary(collectSummaryData(testModules, this.ctx.config), this.options.jobSummary.title, this.options.jobSummary.fileLinks);
			try {
				writeFileSync(this.options.jobSummary.outputPath, summary, { flag: "a" });
			} catch (error) {
				this.ctx.logger.warn("Could not write summary to `options.summary.outputPath`", error);
			}
		}
	}
}
const BUILT_IN_TYPES = [
	"notice",
	"error",
	"warning"
];
function getTitle(type) {
	if (BUILT_IN_TYPES.includes(type)) return;
	return type;
}
function getType(type) {
	if (BUILT_IN_TYPES.includes(type)) return type;
	return "notice";
}
function defaultOnWritePath(path) {
	return path;
}
// workflow command formatting based on
// https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-error-message
// https://github.com/actions/toolkit/blob/f1d9b4b985e6f0f728b4b766db73498403fd5ca3/packages/core/src/command.ts#L80-L85
function formatMessage({ command, properties, message }) {
	let result = `::${command}`;
	Object.entries(properties).forEach(([k, v], i) => {
		result += i === 0 ? " " : ",";
		result += `${k}=${escapeProperty(v)}`;
	});
	result += `::${escapeData(message)}`;
	return result;
}
function escapeData(s) {
	return s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}
function escapeProperty(s) {
	return s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/:/g, "%3A").replace(/,/g, "%2C");
}
function collectSummaryData(testModules, config) {
	const summaryData = {
		name: config.name || null,
		fileStats: {
			failed: 0,
			passed: 0
		},
		testsStats: {
			failed: 0,
			passed: 0,
			expectedFail: 0,
			skipped: 0,
			todo: 0
		},
		flakyTests: []
	};
	for (const module of testModules) {
		const flakyTests = {
			path: {
				relative: module.relativeModuleId,
				absolute: module.moduleId
			},
			tests: []
		};
		switch (module.task.result?.state) {
			case "fail":
				summaryData.fileStats.failed += 1;
				break;
			case "pass": summaryData.fileStats.passed += 1;
		}
		for (const test of module.children.allTests()) {
			switch (test.task.mode) {
				case "skip":
					summaryData.testsStats.skipped += 1;
					break;
				case "todo":
					summaryData.testsStats.todo += 1;
					break;
				default: switch (test.task.result?.state) {
					case "fail":
						summaryData.testsStats.failed += 1;
						break;
					case "pass": if (test.task.fails) summaryData.testsStats.expectedFail += 1;
					else summaryData.testsStats.passed += 1;
				}
			}
			const diagnostic = test.diagnostic();
			if (diagnostic?.flaky) {
				const retriesAllowed = typeof test.options.retry === "number" ? test.options.retry : test.options.retry?.count ?? diagnostic.retryCount;
				const retriesRatio = diagnostic.retryCount / retriesAllowed;
				flakyTests.tests.push({
					retries: {
						allowed: retriesAllowed,
						count: diagnostic.retryCount,
						ratio: retriesRatio
					},
					line: test.task.location?.line,
					testName: test.task.fullTestName
				});
			}
		}
		if (flakyTests.tests.length > 0) {
			flakyTests.tests.sort((a, b) => b.retries.ratio - a.retries.ratio);
			summaryData.flakyTests.push(flakyTests);
		}
	}
	return summaryData;
}
function createGitHubFileLinkCreator(fileLinks) {
	const repository = fileLinks?.repository;
	const commitHash = fileLinks?.commitHash;
	const workspacePath = fileLinks?.workspacePath;
	if (repository !== void 0 && commitHash !== void 0 && workspacePath !== void 0) return (path, line) => {
		const lineFragment = line !== void 0 ? `#L${line}` : "";
		return `https://github.com/${repository}/blob/${commitHash}/${relative(workspacePath, path)}${lineFragment}`;
	};
	return () => null;
}
function mdLink(text, url) {
	return url === null ? text : `[${text}](${url})`;
}
function renderStats({ fileStats, testsStats }) {
	const SEPARATOR_SYMBOL = " · ";
	const fileInfoTotal = fileStats.failed + fileStats.passed;
	const primaryInfoTotal = testsStats.failed + testsStats.passed + testsStats.expectedFail;
	const secondaryInfoTotal = testsStats.skipped + testsStats.todo;
	const fileInfo = [];
	const primaryInfo = [];
	const secondaryInfo = [];
	if (fileStats.failed > 0) fileInfo.push(`❌ **${fileStats.failed} ${noun(fileStats.failed, "failure", "failures")}**`);
	if (fileStats.passed > 0) fileInfo.push(`✅ **${fileStats.passed} ${noun(fileStats.passed, "pass", "passes")}**`);
	fileInfo.push(`${fileInfoTotal} total`);
	if (testsStats.failed > 0) primaryInfo.push(`❌ **${testsStats.failed} ${noun(testsStats.failed, "failure", "failures")}**`);
	if (testsStats.passed > 0) primaryInfo.push(`✅ **${testsStats.passed} ${noun(testsStats.passed, "pass", "passes")}**`);
	if (testsStats.expectedFail > 0) primaryInfo.push(`🔵 **${testsStats.expectedFail} expected ${noun(testsStats.expectedFail, "failure", "failures")}**`);
	primaryInfo.push(`${primaryInfoTotal} total`);
	if (testsStats.skipped > 0) secondaryInfo.push(`${testsStats.skipped} ${noun(testsStats.skipped, "skip", "skips")}`);
	if (testsStats.todo > 0) secondaryInfo.push(`${testsStats.todo} ${noun(testsStats.todo, "todo", "todos")}`);
	let output = `\n### Summary\n\n- **Test Files**: ${fileInfo.join(SEPARATOR_SYMBOL)}\n- **Test Results**: ${primaryInfo.join(SEPARATOR_SYMBOL)}\n`;
	if (secondaryInfo.length > 0) {
		secondaryInfo.push(`${secondaryInfoTotal} total`);
		output += `- **Other**: ${secondaryInfo.join(SEPARATOR_SYMBOL)}\n`;
	}
	return output;
}
function renderSummary(summaryData, title, fileLinks) {
	const fileLinkCreator = createGitHubFileLinkCreator(fileLinks);
	let summary = `## ${title ?? (summaryData.name ? `(${summaryData.name}) ${DEFAULT_TITLE}` : DEFAULT_TITLE)}\n${renderStats(summaryData)}`;
	if (summaryData.flakyTests.length > 0) {
		summary += "\n### Flaky Tests\n\nThese tests passed only after one or more retries, indicating potential instability.\n";
		for (const flakyTests of summaryData.flakyTests) {
			summary += `\n##### \`${flakyTests.path.relative}\` (${flakyTests.tests.length} flaky tests)\n`;
			for (const flakyTest of flakyTests.tests) {
				const retriesText = `passed on retry ${flakyTest.retries.count} out of ${flakyTest.retries.allowed}`;
				summary += `\n- ${mdLink(`\`${flakyTest.testName}\``, fileLinkCreator(flakyTests.path.absolute, flakyTest.line))} (${flakyTest.retries.ratio >= .8 ? `**${retriesText}**` : retriesText})`;
			}
			summary += "\n";
		}
	}
	if (!summary.endsWith("\n")) summary += "\n";
	return summary;
}

const StatusMap = {
	fail: "failed",
	only: "pending",
	pass: "passed",
	run: "pending",
	skip: "skipped",
	todo: "todo",
	queued: "pending"
};
class JsonReporter {
	start = 0;
	ctx;
	options;
	coverageMap;
	constructor(options) {
		this.options = options;
	}
	onInit(ctx) {
		this.ctx = ctx;
		this.start = Date.now();
		this.coverageMap = void 0;
	}
	onCoverage(coverageMap) {
		this.coverageMap = coverageMap;
	}
	async onTestRunEnd(testModules) {
		const files = testModules.map((testModule) => testModule.task);
		const suites = getSuites(files);
		const numTotalTestSuites = suites.length;
		const tests = getTests(files);
		const numTotalTests = tests.length;
		const numFailedTestSuites = suites.filter((s) => s.result?.state === "fail").length;
		const numPendingTestSuites = suites.filter((s) => s.result?.state === "run" || s.result?.state === "queued" || s.mode === "todo").length;
		const numPassedTestSuites = numTotalTestSuites - numFailedTestSuites - numPendingTestSuites;
		const numFailedTests = tests.filter((t) => t.result?.state === "fail").length;
		const numPassedTests = tests.filter((t) => t.result?.state === "pass").length;
		const numPendingTests = tests.filter((t) => t.result?.state === "run" || t.result?.state === "queued" || t.mode === "skip" || t.result?.state === "skip").length;
		const numTodoTests = tests.filter((t) => t.mode === "todo").length;
		const testResults = [];
		const success = !!(files.length > 0 || this.ctx.config.passWithNoTests) && numFailedTestSuites === 0 && numFailedTests === 0;
		const { filterMeta } = this.options;
		for (const file of files) {
			const tests = getTests([file]);
			let startTime = tests.reduce((prev, next) => Math.min(prev, next.result?.startTime ?? Number.POSITIVE_INFINITY), Number.POSITIVE_INFINITY);
			if (startTime === Number.POSITIVE_INFINITY) startTime = this.start;
			const endTime = tests.reduce((prev, next) => Math.max(prev, (next.result?.startTime ?? 0) + (next.result?.duration ?? 0)), startTime);
			const assertionResults = tests.map((t) => {
				const ancestorTitles = [];
				let iter = t.suite;
				while (iter) {
					ancestorTitles.push(iter.name);
					iter = iter.suite;
				}
				ancestorTitles.reverse();
				return {
					ancestorTitles,
					fullName: t.name ? [...ancestorTitles, t.name].join(" ") : ancestorTitles.join(" "),
					status: StatusMap[t.result?.state || t.mode] || "skipped",
					title: t.name,
					duration: t.result?.duration,
					failureMessages: t.result?.errors?.map((e) => e.stack || e.message) || [],
					location: t.location,
					meta: filterMeta ? (() => {
						const filtered = {};
						for (const key in t.meta) {
							const value = t.meta[key];
							if (filterMeta(key, value)) filtered[key] = value;
						}
						return filtered;
					})() : t.meta,
					tags: t.tags || [],
					benchmarks: t.benchmarks
				};
			});
			if (tests.some((t) => t.result?.state === "run" || t.result?.state === "queued")) this.ctx.logger.warn("WARNING: Some tests are still running when generating the JSON report.This is likely an internal bug in Vitest.Please report it to https://github.com/vitest-dev/vitest/issues");
			const hasFailedTests = tests.some((t) => t.result?.state === "fail");
			testResults.push({
				assertionResults,
				startTime,
				endTime,
				status: file.result?.state === "fail" || hasFailedTests ? "failed" : "passed",
				message: file.result?.errors?.[0]?.message ?? "",
				name: file.filepath
			});
		}
		const result = {
			numTotalTestSuites,
			numPassedTestSuites,
			numFailedTestSuites,
			numPendingTestSuites,
			numTotalTests,
			numPassedTests,
			numFailedTests,
			numPendingTests,
			numTodoTests,
			snapshot: this.ctx.snapshot.summary,
			startTime: this.start,
			success,
			testResults,
			coverageMap: this.coverageMap
		};
		const resultString = JSON.stringify(result);
		const outputFile = this.options.outputFile ?? getOutputFile(this.ctx.config, "json");
		if (outputFile) {
			const reportFile = resolve(this.ctx.config.root, outputFile);
			const outputDirectory = dirname(reportFile);
			if (!existsSync(outputDirectory)) await promises.mkdir(outputDirectory, { recursive: true });
			await promises.writeFile(reportFile, resultString, "utf-8");
			this.ctx.logger.log(`JSON report written to ${reportFile}`);
		} else if (this.options.stdout) this.ctx.logger.log(resultString);
		else {
			const report = this.ctx.createReport("json");
			await report.writeFile("output.json", resultString);
			this.ctx.logger.log(`JSON report written to ${resolve(report.root, "output.json")}`);
		}
	}
}

class IndentedLogger {
	baseLog;
	currentIndent = "";
	constructor(baseLog) {
		this.baseLog = baseLog;
	}
	indent() {
		this.currentIndent += "    ";
	}
	unindent() {
		this.currentIndent = this.currentIndent.substring(0, this.currentIndent.length - 4);
	}
	log(text) {
		return this.baseLog(this.currentIndent + text);
	}
}

function flattenTasks$1(task, baseName = "", suiteName = "", ancestorSeparator = " > ") {
	if (task.type === "suite") {
		const newBase = baseName ? `${baseName}${ancestorSeparator}${task.name}` : task.name;
		const newSuiteName = suiteName || task.name;
		return task.tasks.flatMap((child) => flattenTasks$1(child, newBase, newSuiteName, ancestorSeparator));
	} else {
		const fullName = baseName ? `${baseName}${ancestorSeparator}${task.name}` : task.name;
		return [{
			...task,
			name: fullName,
			_leafName: task.name,
			_classname: baseName,
			_suitename: suiteName
		}];
	}
}
// https://gist.github.com/john-doherty/b9195065884cdbfd2017a4756e6409cc
function removeInvalidXMLCharacters(value, removeDiscouragedChars) {
	let regex = /([\0-\x08\v\f\x0E-\x1F\uFFFD\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g;
	value = String(value || "").replace(regex, "");
	{
		// remove everything discouraged by XML 1.0 specifications
		regex = /* @__PURE__ */ new RegExp(
			/* eslint-disable regexp/prefer-character-class, regexp/no-obscure-range, regexp/no-useless-non-capturing-group */
			"([\\x7F-\\x84]|[\\x86-\\x9F]|[\\uFDD0-\\uFDEF]|\\uD83F[\\uDFFE\\uDFFF]|(?:\\uD87F[\\uDFFE\\uDFFF])|\\uD8BF[\\uDFFE\\uDFFF]|\\uD8FF[\\uDFFE\\uDFFF]|(?:\\uD93F[\\uDFFE\\uDFFF])|\\uD97F[\\uDFFE\\uDFFF]|\\uD9BF[\\uDFFE\\uDFFF]|\\uD9FF[\\uDFFE\\uDFFF]|\\uDA3F[\\uDFFE\\uDFFF]|\\uDA7F[\\uDFFE\\uDFFF]|\\uDABF[\\uDFFE\\uDFFF]|(?:\\uDAFF[\\uDFFE\\uDFFF])|\\uDB3F[\\uDFFE\\uDFFF]|\\uDB7F[\\uDFFE\\uDFFF]|(?:\\uDBBF[\\uDFFE\\uDFFF])|\\uDBFF[\\uDFFE\\uDFFF](?:[\\0-\\t\\v\\f\\x0E-\\u2027\\u202A-\\uD7FF\\uE000-\\uFFFF]|[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|(?:[^\\uD800-\\uDBFF]|^)[\\uDC00-\\uDFFF]))",
			"g"
			/* eslint-enable */
		);
		value = value.replace(regex, "");
	}
	return value;
}
function escapeXML(value) {
	return removeInvalidXMLCharacters(String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
}
function executionTime(durationMS) {
	return (durationMS / 1e3).toLocaleString("en-US", {
		useGrouping: false,
		maximumFractionDigits: 10
	});
}
function getDuration(task) {
	return executionTime(task.result?.duration ?? 0);
}
class JUnitReporter {
	ctx;
	reportFile;
	baseLog;
	logger;
	_timeStart = /* @__PURE__ */ new Date();
	fileFd;
	options;
	constructor(options) {
		this.options = { ...options };
		this.options.includeConsoleOutput ??= true;
		this.options.stackTrace ??= true;
	}
	async onInit(ctx) {
		this.ctx = ctx;
		const outputFile = this.options.outputFile ?? getOutputFile(this.ctx.config, "junit");
		if (outputFile) {
			this.reportFile = resolve(this.ctx.config.root, outputFile);
			const outputDirectory = dirname(this.reportFile);
			if (!existsSync(outputDirectory)) await promises.mkdir(outputDirectory, { recursive: true });
		} else if (!this.options.stdout) {
			const report = this.ctx.createReport("junit");
			this.reportFile = resolve(report.root, "output.xml");
		}
		if (this.reportFile) {
			const fileFd = await promises.open(this.reportFile, "w+");
			this.fileFd = fileFd;
			this.baseLog = async (text) => {
				if (!this.fileFd) this.fileFd = await promises.open(this.reportFile, "w+");
				await promises.writeFile(this.fileFd, `${text}\n`);
			};
		} else this.baseLog = async (text) => this.ctx.logger.log(text);
		this._timeStart = /* @__PURE__ */ new Date();
		this.logger = new IndentedLogger(this.baseLog);
	}
	async writeElement(name, attrs, children) {
		const pairs = [];
		for (const key in attrs) {
			const attr = attrs[key];
			if (attr === void 0) continue;
			pairs.push(`${key}="${escapeXML(attr)}"`);
		}
		await this.logger.log(`<${name}${pairs.length ? ` ${pairs.join(" ")}` : ""}>`);
		this.logger.indent();
		await children.call(this);
		this.logger.unindent();
		await this.logger.log(`</${name}>`);
	}
	async writeLogs(task, type) {
		if (task.logs == null || task.logs.length === 0) return;
		const logType = type === "err" ? "stderr" : "stdout";
		const logs = task.logs.filter((log) => log.type === logType);
		if (logs.length === 0) return;
		await this.writeElement(`system-${type}`, {}, async () => {
			for (const log of logs) await this.baseLog(escapeXML(log.content));
		});
	}
	async writeSystemOut(task) {
		const logs = this.options.includeConsoleOutput && task.logs ? task.logs.filter((log) => log.type === "stdout") : [];
		const benchmarks = task.type === "test" ? task.benchmarks : [];
		if (logs.length === 0 && benchmarks.length === 0) return;
		await this.writeElement("system-out", {}, async () => {
			for (const log of logs) await this.baseLog(escapeXML(log.content));
			if (benchmarks.length > 0) {
				if (logs.length > 0) await this.baseLog("");
				await this.baseLog(escapeXML(renderBenchmarkTableText(benchmarks)));
			}
		});
	}
	applyTemplate(template, vars) {
		if (typeof template === "function") return template(vars);
		return template.replace(/\{filename\}/g, () => vars.filename).replace(/\{filepath\}/g, () => vars.filepath).replace(/\{basename\}/g, () => vars.basename).replace(/\{classname\}/g, () => vars.classname).replace(/\{title\}/g, () => vars.title).replace(/\{suitename\}/g, () => vars.suitename).replace(/\{displayName\}/g, () => vars.displayName);
	}
	async writeTasks(tasks, filename, fileAbsPath) {
		for (const task of tasks) {
			const fileBasename = task.file ? basename(task.file.filepath) : basename(fileAbsPath);
			const templateVars = {
				filename: task.file?.name ?? filename,
				filepath: task.file?.filepath ?? fileAbsPath,
				basename: fileBasename,
				classname: task._classname ?? "",
				title: task._leafName ?? task.name,
				suitename: task._suitename ?? "",
				displayName: task.file?.projectName ?? ""
			};
			let classname = filename;
			if (this.options.classnameTemplate) classname = this.applyTemplate(this.options.classnameTemplate, templateVars);
			const testcaseName = this.options.titleTemplate ? this.applyTemplate(this.options.titleTemplate, templateVars) : task.name;
			await this.writeElement("testcase", {
				classname,
				file: this.options.addFileAttribute ? filename : void 0,
				name: testcaseName,
				time: getDuration(task)
			}, async () => {
				await this.writeSystemOut(task);
				if (this.options.includeConsoleOutput) await this.writeLogs(task, "err");
				if (task.mode === "skip" || task.mode === "todo") await this.logger.log("<skipped/>");
				if (task.type === "test" && task.annotations.length) {
					await this.logger.log("<properties>");
					this.logger.indent();
					for (const annotation of task.annotations) {
						await this.logger.log(`<property name="${escapeXML(annotation.type)}" value="${escapeXML(annotation.message)}">`);
						await this.logger.log("</property>");
					}
					this.logger.unindent();
					await this.logger.log("</properties>");
				}
				if (task.result?.state === "fail") {
					const errors = task.result.errors || [];
					for (const error of errors) await this.writeErrorElement("failure", error, { project: this.ctx.getProjectByName(task.file?.projectName ?? "") });
				}
			});
		}
	}
	resolveSuiteNameTemplate(file, filename) {
		if (!this.options.suiteNameTemplate) return filename;
		const fileBasename = basename(file.filepath);
		const firstSuiteName = file.tasks.find((t) => t.type === "suite")?.name ?? fileBasename;
		const vars = {
			filepath: file.filepath,
			filename,
			basename: fileBasename,
			displayName: file.projectName ?? "",
			title: firstSuiteName
		};
		if (typeof this.options.suiteNameTemplate === "function") return this.options.suiteNameTemplate(vars);
		return this.options.suiteNameTemplate.replace(/\{filepath\}/g, () => vars.filepath).replace(/\{filename\}/g, () => vars.filename).replace(/\{basename\}/g, () => vars.basename).replace(/\{displayName\}/g, () => vars.displayName).replace(/\{title\}/g, () => vars.title);
	}
	async writeErrorElement(elementName, error, errorOptions) {
		await this.writeElement(elementName, {
			message: error?.message,
			type: error?.name
		}, async () => {
			if (!error || !this.options.stackTrace) return;
			const result = this.ctx.logger.formatError(error, errorOptions);
			await this.baseLog(escapeXML(stripVTControlCharacters(result.output.trim())));
		});
	}
	async writeUnhandledErrorsTestsuite(unhandledErrors, testModules) {
		await this.writeElement("testsuite", {
			name: "vitest unhandled errors",
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			hostname: this.options.hostname || hostname(),
			tests: unhandledErrors.length,
			failures: 0,
			errors: unhandledErrors.length,
			skipped: 0,
			time: "0"
		}, async () => {
			// Stable order across runs — workers/projects report errors concurrently.
			const sortedErrors = [...unhandledErrors].sort((a, b) => {
				const ka = `${a.VITEST_TEST_PATH ?? ""}\0${a.type ?? ""}\0${a.name ?? ""}\0${a.message ?? ""}`;
				const kb = `${b.VITEST_TEST_PATH ?? ""}\0${b.type ?? ""}\0${b.name ?? ""}\0${b.message ?? ""}`;
				return ka < kb ? -1 : ka > kb ? 1 : 0;
			});
			for (const error of sortedErrors) {
				const errorTitle = error.type || error.name || "Unhandled Error";
				// Only attribute when the path resolves to exactly one module — when
				// multiple projects share a file, errors lack a project identifier and
				// we can't disambiguate without one (tracked for follow-up).
				const matches = error.VITEST_TEST_PATH ? testModules.filter((m) => m.task.filepath === error.VITEST_TEST_PATH) : [];
				const owningModule = matches.length === 1 ? matches[0] : void 0;
				await this.writeElement("testcase", {
					classname: "vitest unhandled errors",
					file: this.options.addFileAttribute && error.VITEST_TEST_PATH ? relative(this.ctx.config.root, error.VITEST_TEST_PATH) : void 0,
					name: error.message ? `${errorTitle}: ${error.message}` : errorTitle,
					time: "0"
				}, async () => {
					await this.writeErrorElement("error", error, { project: owningModule?.project });
				});
			}
		});
	}
	async onTestRunEnd(testModules, unhandledErrors = []) {
		const files = testModules.map((testModule) => testModule.task);
		const separator = this.options.ancestorSeparator ?? " > ";
		await this.logger.log("<?xml version=\"1.0\" encoding=\"UTF-8\" ?>");
		const transformed = files.map((file) => {
			const tasks = file.tasks.flatMap((task) => flattenTasks$1(task, "", "", separator));
			const stats = tasks.reduce((stats, task) => {
				return {
					passed: stats.passed + Number(task.result?.state === "pass"),
					failures: stats.failures + Number(task.result?.state === "fail"),
					skipped: stats.skipped + Number(task.mode === "skip" || task.mode === "todo")
				};
			}, {
				passed: 0,
				failures: 0,
				skipped: 0
			});
			// inject failed suites to surface errors during beforeAll/afterAll
			const suites = getSuites(file);
			for (const suite of suites) if (suite.result?.errors) {
				tasks.push(suite);
				stats.failures += 1;
			}
			// If there are no tests, but the file failed to load, we still want to report it as a failure
			if (tasks.length === 0 && file.result?.state === "fail") {
				stats.failures = 1;
				tasks.push({
					id: file.id,
					type: "test",
					name: file.name,
					fullName: file.name,
					fullTestName: file.name,
					mode: "run",
					result: file.result,
					meta: {},
					timeout: 0,
					// NOTE: not used in JUnitReporter
					context: null,
					suite: null,
					file: null,
					annotations: [],
					artifacts: [],
					benchmarks: []
				});
			}
			return {
				...file,
				tasks,
				stats
			};
		});
		const stats = transformed.reduce((stats, file) => {
			stats.tests += file.tasks.length;
			stats.failures += file.stats.failures;
			stats.time += file.result?.duration || 0;
			return stats;
		}, {
			name: this.options.suiteName || "vitest tests",
			tests: 0,
			failures: 0,
			errors: unhandledErrors.length,
			time: 0
		});
		stats.tests += unhandledErrors.length;
		// Plain byte compare (not localeCompare) so output is identical across machines and ICU versions.
		const orderedSuites = transformed.map((file, i) => {
			const filename = relative(this.ctx.config.root, file.filepath);
			return {
				file,
				filename,
				suiteName: this.resolveSuiteNameTemplate(files[i], filename)
			};
		}).sort((a, b) => a.suiteName < b.suiteName ? -1 : a.suiteName > b.suiteName ? 1 : 0);
		await this.writeElement("testsuites", {
			...stats,
			time: executionTime(stats.time)
		}, async () => {
			for (const { file, filename, suiteName } of orderedSuites) await this.writeElement("testsuite", {
				name: suiteName,
				timestamp: (/* @__PURE__ */ new Date()).toISOString(),
				hostname: this.options.hostname || hostname(),
				tests: file.tasks.length,
				failures: file.stats.failures,
				errors: 0,
				skipped: file.stats.skipped,
				time: getDuration(file)
			}, async () => {
				await this.writeTasks(file.tasks, filename, file.filepath);
			});
			if (unhandledErrors.length) await this.writeUnhandledErrorsTestsuite(unhandledErrors, testModules);
		});
		if (this.reportFile) this.ctx.logger.log(`JUNIT report written to ${this.reportFile}`);
		await this.fileFd?.close();
		this.fileFd = void 0;
	}
}

class MinimalReporter extends DefaultReporter {
	renderSucceed = false;
	constructor(options = {}) {
		super({
			silent: "passed-only",
			...options,
			summary: false
		});
	}
	onTestRunStart(specifications) {
		super.onTestRunStart(specifications);
		this.renderSucceed = false;
	}
	printTestModule(testModule) {
		if (testModule.state() !== "failed") return;
		super.printTestModule(testModule);
	}
	printTestCase(moduleState, test) {
		if (test.result().state === "failed") super.printTestCase(moduleState, test);
	}
}

function yamlString(str) {
	if (!str) return "";
	return `"${str.replace(/"/g, "\\\"")}"`;
}
function tapString(str) {
	return str.replace(/\\/g, "\\\\").replace(/#/g, "\\#").replace(/\n/g, " ");
}
class TapReporter {
	ctx;
	logger;
	onInit(ctx) {
		this.ctx = ctx;
		this.logger = new IndentedLogger(ctx.logger.log.bind(ctx.logger));
	}
	static getComment(task) {
		if (task.mode === "skip") return " # SKIP";
		else if (task.mode === "todo") return " # TODO";
		else if (task.result?.duration != null) return ` # time=${task.result.duration.toFixed(2)}ms`;
		else return "";
	}
	logErrorDetails(error, stack) {
		const errorName = error.name || "Unknown Error";
		this.logger.log(`name: ${yamlString(String(errorName))}`);
		this.logger.log(`message: ${yamlString(String(error.message))}`);
		if (stack)
 // For compatibility with tap-mocha-reporter
		this.logger.log(`stack: ${yamlString(`${stack.file}:${stack.line}:${stack.column}`)}`);
	}
	logTasks(tasks) {
		this.logger.log(`1..${tasks.length}`);
		for (const [i, task] of tasks.entries()) {
			const id = i + 1;
			const ok = task.result?.state === "pass" || task.mode === "skip" || task.mode === "todo" ? "ok" : "not ok";
			const comment = TapReporter.getComment(task);
			if (task.type === "suite" && task.tasks.length > 0) {
				this.logger.log(`${ok} ${id} - ${tapString(task.name)}${comment} {`);
				this.logger.indent();
				this.logTasks(task.tasks);
				this.logger.unindent();
				this.logger.log("}");
			} else {
				this.logger.log(`${ok} ${id} - ${tapString(task.name)}${comment}`);
				const project = this.ctx.getProjectByName(task.file.projectName || "");
				if (task.type === "test" && task.annotations) {
					this.logger.indent();
					task.annotations.forEach(({ type, message }) => {
						this.logger.log(`# ${type}: ${message}`);
					});
					this.logger.unindent();
				}
				if (task.result?.state === "fail" && task.result.errors) {
					this.logger.indent();
					task.result.errors.forEach((error) => {
						const stack = (task.file.pool === "browser" ? project.browser?.parseErrorStacktrace(error) || [] : parseErrorStacktrace(error, { frameFilter: this.ctx.config.onStackTrace }))[0];
						this.logger.log("---");
						this.logger.log("error:");
						this.logger.indent();
						this.logErrorDetails(error);
						this.logger.unindent();
						if (stack) this.logger.log(`at: ${yamlString(`${stack.file}:${stack.line}:${stack.column}`)}`);
						if (error.showDiff) {
							this.logger.log(`actual: ${yamlString(error.actual)}`);
							this.logger.log(`expected: ${yamlString(error.expected)}`);
						}
					});
					this.logger.log("...");
					this.logger.unindent();
				}
			}
		}
	}
	onTestRunEnd(testModules) {
		const files = testModules.map((testModule) => testModule.task);
		this.logger.log("TAP version 13");
		this.logTasks(files);
	}
}

function flattenTasks(task, baseName = "") {
	const base = baseName ? `${baseName} > ` : "";
	if (task.type === "suite" && task.tasks.length > 0) return task.tasks.flatMap((child) => flattenTasks(child, `${base}${task.name}`));
	else return [{
		...task,
		name: `${base}${task.name}`
	}];
}
class TapFlatReporter extends TapReporter {
	onInit(ctx) {
		super.onInit(ctx);
	}
	onTestRunEnd(testModules) {
		this.ctx.logger.log("TAP version 13");
		const flatTasks = testModules.flatMap((testModule) => flattenTasks(testModule.task));
		this.logTasks(flatTasks);
	}
}

class TreeReporter extends DefaultReporter {
	verbose = true;
	renderSucceed = true;
}

class VerboseReporter extends DefaultReporter {
	verbose = true;
	renderSucceed = true;
	printTestModule(_module) {
		// don't print test module, only print tests
	}
	onTestCaseResult(test) {
		super.onTestCaseResult(test);
		const testResult = test.result();
		if (this.ctx.config.hideSkippedTests && testResult.state === "skipped" && test.options.mode !== "todo") return;
		let title = ` ${this.getEntityPrefix(test)} `;
		title += test.module.task.name;
		if (test.location) title += y.dim(`:${test.location.line}`);
		title += separator;
		title += getTestName(test.task, separator);
		title += this.getTestCaseSuffix(test);
		this.log(title);
		if (testResult.state === "failed") testResult.errors.forEach((error) => this.log(y.red(`   ${F_RIGHT} ${error.message}`)));
		if (test.annotations().length) {
			this.log();
			this.printAnnotations(test, "log", 3);
			this.log();
		}
		const inlineBenchmarks = test.benchmarks().filter((b) => b.tasks.length > 0);
		if (inlineBenchmarks.length > 0) this.printBenchmarkTable(inlineBenchmarks, "");
	}
}

const ReportersMap = {
	"default": DefaultReporter,
	"agent": MinimalReporter,
	"minimal": MinimalReporter,
	"blob": BlobReporter,
	"verbose": VerboseReporter,
	"dot": DotReporter,
	"json": JsonReporter,
	"tap": TapReporter,
	"tap-flat": TapFlatReporter,
	"junit": JUnitReporter,
	"tree": TreeReporter,
	"hanging-process": HangingProcessReporter,
	"github-actions": GithubActionsReporter
};

async function loadCustomReporterModule(path, runner) {
	let customReporterModule;
	try {
		customReporterModule = await runner.import(path);
	} catch (customReporterModuleError) {
		throw new Error(`Failed to load custom Reporter from ${path}`, { cause: customReporterModuleError });
	}
	if (customReporterModule.default === null || customReporterModule.default === void 0) throw new Error(`Custom reporter loaded from ${path} was not the default export`);
	return customReporterModule.default;
}
function createReporters(reporterReferences, ctx) {
	const runner = ctx.runner;
	const promisedReporters = reporterReferences.map(async (referenceOrInstance) => {
		if (Array.isArray(referenceOrInstance)) {
			const [reporterName, reporterOptions] = referenceOrInstance;
			if (reporterName === "html") {
				await ctx.packageInstaller.ensureInstalled("@vitest/ui", ctx.config.root, ctx.version);
				return new (await (loadCustomReporterModule("@vitest/ui/reporter", runner)))(reporterOptions);
			} else if (reporterName in ReportersMap) {
				const BuiltinReporter = ReportersMap[reporterName];
				return new BuiltinReporter(reporterOptions);
			} else return new (await (loadCustomReporterModule(reporterName, runner)))(reporterOptions);
		}
		return referenceOrInstance;
	});
	return Promise.all(promisedReporters);
}

function parseFilter(filter) {
	const colonIndex = filter.lastIndexOf(":");
	if (colonIndex === -1) return { filename: filter };
	const [parsedFilename, lineNumber] = [filter.substring(0, colonIndex), filter.substring(colonIndex + 1)];
	if (/^\d+$/.test(lineNumber)) return {
		filename: parsedFilename,
		lineNumber: Number.parseInt(lineNumber)
	};
	else if (/^\d+-\d+$/.test(lineNumber)) throw new RangeLocationFilterProvidedError(filter);
	else return { filename: filter };
}
function groupFilters(filters) {
	const groupedFilters_ = groupBy(filters, (f) => f.filename);
	return Object.fromEntries(Object.entries(groupedFilters_).map((entry) => {
		const [filename, filters] = entry;
		return [filename, filters.map((f) => f.lineNumber).filter((l) => l !== void 0)];
	}));
}

class VitestSpecifications {
	vitest;
	_cachedSpecs = /* @__PURE__ */ new Map();
	constructor(vitest) {
		this.vitest = vitest;
	}
	getModuleSpecifications(moduleId) {
		const _cached = this.getCachedSpecifications(moduleId);
		if (_cached) return _cached;
		const specs = [];
		for (const project of this.vitest.projects) {
			if (project._isCachedTestFile(moduleId)) specs.push(project.createSpecification(moduleId));
			if (project._isCachedTypecheckFile(moduleId)) specs.push(project.createSpecification(moduleId, [], "typescript"));
		}
		specs.forEach((spec) => this.ensureSpecificationCached(spec));
		return specs;
	}
	async getRelevantTestSpecifications(filters = []) {
		return this.filterTestsBySource(await this.globTestSpecifications(filters));
	}
	async globTestSpecifications(filters = []) {
		const files = [];
		const dir = process.cwd();
		const parsedFilters = filters.map((f) => parseFilter(f));
		// Require includeTaskLocation when a location filter is passed
		if (!this.vitest.config.includeTaskLocation && parsedFilters.some((f) => f.lineNumber !== void 0)) throw new IncludeTaskLocationDisabledError();
		const testLines = groupFilters(parsedFilters.map((f) => ({
			...f,
			filename: resolve(dir, f.filename)
		})));
		// Key is file and val specifies whether we have matched this file with testLocation
		const testLocHasMatch = {};
		await Promise.all(this.vitest.projects.map(async (project) => {
			const { testFiles, typecheckTestFiles } = await project.globTestFiles(parsedFilters.map((f) => f.filename));
			testFiles.forEach((file) => {
				const lines = testLines[file];
				testLocHasMatch[file] = true;
				const spec = project.createSpecification(file, lines);
				this.ensureSpecificationCached(spec);
				files.push(spec);
			});
			typecheckTestFiles.forEach((file) => {
				const lines = testLines[file];
				testLocHasMatch[file] = true;
				const spec = project.createSpecification(file, lines, "typescript");
				this.ensureSpecificationCached(spec);
				files.push(spec);
			});
		}));
		Object.entries(testLines).forEach(([filepath, loc]) => {
			if (loc.length !== 0 && !testLocHasMatch[filepath]) throw new LocationFilterFileNotFoundError(relative(dir, filepath));
		});
		return files;
	}
	clearCache(moduleId) {
		if (moduleId) this._cachedSpecs.delete(moduleId);
		else this._cachedSpecs.clear();
	}
	getCachedSpecifications(moduleId) {
		return this._cachedSpecs.get(moduleId);
	}
	ensureSpecificationCached(spec) {
		const file = spec.moduleId;
		const specs = this._cachedSpecs.get(file) || [];
		const index = specs.findIndex((_s) => _s.project === spec.project && _s.pool === spec.pool);
		if (index === -1) {
			specs.push(spec);
			this._cachedSpecs.set(file, specs);
		} else specs.splice(index, 1, spec);
		return specs;
	}
	async filterTestsBySource(specs) {
		if (this.vitest.config.changed && !this.vitest.config.related) {
			const related = await this.vitest.vcs.findChangedFiles({
				root: this.vitest.config.root,
				changedSince: this.vitest.config.changed
			});
			this.vitest.config.related = Array.from(new Set(related));
		}
		const related = this.vitest.config.related;
		if (!related) return specs;
		const forceRerunTriggers = this.vitest.config.forceRerunTriggers;
		const matcher = forceRerunTriggers.length ? pm(forceRerunTriggers) : void 0;
		if (matcher && related.some((file) => matcher(file))) return specs;
		// don't run anything if no related sources are found
		// if we are in watch mode, we want to process all tests
		if (!this.vitest.config.watch && !related.length) return [];
		// The module graph, and so the dependency edges, are per project.
		const specsByProject = /* @__PURE__ */ new Map();
		for (const spec of specs) {
			let projectSpecs = specsByProject.get(spec.project);
			if (!projectSpecs) specsByProject.set(spec.project, projectSpecs = []);
			projectSpecs.push(spec);
		}
		const affectedByProject = /* @__PURE__ */ new Map();
		for (const [project, projectSpecs] of specsByProject) affectedByProject.set(project, await this.getAffectedModules(project, projectSpecs, related));
		return specs.filter((spec) => affectedByProject.get(spec.project).has(spec.moduleId));
	}
	/**
	* Returns every module in `project` that transitively imports one of `related`.
	*
	* Expands each module's imports at most once into a shared reverse-edge map,
	* then walks that map backwards from the changed files.
	*/
	async getAffectedModules(project, specs, related) {
		const importers = /* @__PURE__ */ new Map();
		const visited = /* @__PURE__ */ new Set();
		const existsCache = /* @__PURE__ */ new Map();
		// limit concurrency to lower peak memory usage on large graphs
		const TRANSFORM_CONCURRENCY = os__default.availableParallelism?.() ?? os__default.cpus().length;
		let active = 0;
		const waiters = [];
		const withLimit = async (fn) => {
			if (active >= TRANSFORM_CONCURRENCY) await new Promise((resolve) => waiters.push(resolve));
			active++;
			try {
				return await fn();
			} finally {
				active--;
				waiters.shift()?.();
			}
		};
		const cachedExists = (filepath) => {
			const cached = existsCache.get(filepath);
			if (cached !== void 0) return cached;
			const result = existsSync(filepath);
			existsCache.set(filepath, result);
			return result;
		};
		const addImports = async (filepath) => {
			// `visited` is shared by every spec in the project, so a module is
			// expanded once per run instead of once per test file that reaches it.
			if (visited.has(filepath)) return;
			visited.add(filepath);
			const environment = project.vite.environments.ssr;
			const transformed = environment.moduleGraph.getModuleById(filepath)?.transformResult || await withLimit(() => environment.transformRequest(filepath));
			if (!transformed) return;
			const dependencies = [...transformed.deps || [], ...transformed.dynamicDeps || []];
			await Promise.all(dependencies.map(async (dep) => {
				const fsPath = dep.startsWith("/@fs/") ? dep.slice(isWindows ? 5 : 4) : join(project.config.root, dep);
				if (fsPath.includes("node_modules") || !cachedExists(fsPath)) return;
				let importedBy = importers.get(fsPath);
				if (!importedBy) importers.set(fsPath, importedBy = /* @__PURE__ */ new Set());
				importedBy.add(filepath);
				await addImports(fsPath);
			}));
		};
		await Promise.all(specs.map((spec) => addImports(spec.moduleId)));
		const affected = new Set(related);
		const queue = [...related];
		while (queue.length) {
			const importedBy = importers.get(queue.pop());
			if (!importedBy) continue;
			for (const importer of importedBy) if (!affected.has(importer)) {
				affected.add(importer);
				queue.push(importer);
			}
		}
		return affected;
	}
}

class ReportedTaskImplementation {
	/**
	* Task instance.
	* @internal
	*/
	task;
	/**
	* The project associated with the test or suite.
	*/
	project;
	/**
	* Unique identifier.
	* This ID is deterministic and will be the same for the same test across multiple runs.
	* The ID is based on the project name, module url and test order.
	*/
	id;
	/**
	* Location in the module where the test or suite is defined.
	*/
	location;
	/** @internal */
	constructor(task, project) {
		this.task = task;
		this.project = project;
		this.id = task.id;
		this.location = task.location;
	}
	/**
	* Checks if the test did not fail the suite.
	* If the test is not finished yet or was skipped, it will return `true`.
	*/
	ok() {
		const result = this.task.result;
		return !result || result.state !== "fail";
	}
	/**
	* Custom metadata that was attached to the test during its execution.
	*/
	meta() {
		return this.task.meta;
	}
	/**
	* Console logs recorded during the test execution.
	*/
	logs() {
		return [...this.task.logs || []];
	}
	/**
	* Creates a new reported task instance and stores it in the project's state for future use.
	* @internal
	*/
	static register(task, project) {
		const state = new this(task, project);
		storeTask(project, task, state);
		return state;
	}
}
class TestCase extends ReportedTaskImplementation {
	#fullName;
	type = "test";
	/**
	* Direct reference to the test module where the test or suite is defined.
	*/
	module;
	/**
	* Name of the test.
	*/
	name;
	/**
	* Options that the test was initiated with.
	*/
	options;
	/**
	* Parent suite. If the test was called directly inside the module, the parent will be the module itself.
	*/
	parent;
	/**
	* Tags associated with the test.
	*/
	tags;
	/** @internal */
	constructor(task, project) {
		super(task, project);
		this.name = task.name;
		this.module = getReportedTask(project, task.file);
		const suite = this.task.suite;
		if (suite) this.parent = getReportedTask(project, suite);
		else this.parent = this.module;
		this.options = buildOptions(task);
		this.tags = this.options.tags || [];
	}
	/**
	* Full name of the test including all parent suites separated with `>`.
	*/
	get fullName() {
		if (this.#fullName === void 0) if (this.parent.type !== "module") this.#fullName = `${this.parent.fullName} > ${this.name}`;
		else this.#fullName = this.name;
		return this.#fullName;
	}
	/**
	* Test results.
	* - **pending**: Test was collected, but didn't finish running yet.
	* - **passed**: Test passed successfully
	* - **failed**: Test failed to execute
	* - **skipped**: Test was skipped during collection or dynamically with `ctx.skip()`.
	*/
	result() {
		const result = this.task.result;
		const mode = result?.state || this.task.mode;
		if (!result && (mode === "skip" || mode === "todo")) return {
			state: "skipped",
			note: void 0,
			errors: void 0
		};
		if (!result || result.state === "run" || result.state === "queued") return {
			state: "pending",
			errors: void 0
		};
		const state = result.state === "fail" ? "failed" : result.state === "pass" ? "passed" : "skipped";
		if (state === "skipped") return {
			state,
			note: result.note,
			errors: void 0
		};
		if (state === "passed") return {
			state,
			errors: result.errors
		};
		return {
			state,
			errors: result.errors || []
		};
	}
	/**
	* Test annotations added via the `task.annotate` API during the test execution.
	*/
	annotations() {
		return [...this.task.annotations];
	}
	/**
	* @experimental
	*
	* Test artifacts recorded via the `recordArtifact` API during the test execution.
	*/
	artifacts() {
		return [...this.task.artifacts];
	}
	/**
	* @experimental
	*
	* A list of benchmarks performed during the test.
	*/
	benchmarks() {
		return [...this.task.benchmarks];
	}
	/**
	* Useful information about the test like duration, memory usage, etc.
	* Diagnostic is only available after the test has finished.
	*/
	diagnostic() {
		const result = this.task.result;
		// startTime should always be available if the test has properly finished
		if (!result || !result.startTime) return;
		const duration = result.duration || 0;
		return {
			slow: duration > this.project.globalConfig.slowTestThreshold,
			heap: result.heap,
			duration,
			startTime: result.startTime,
			retryCount: result.retryCount ?? 0,
			repeatCount: result.repeatCount ?? 0,
			flaky: !!result.retryCount && result.state === "pass" && result.retryCount > 0
		};
	}
	/**
	* Returns a new test specification that can be used to filter or run this specific test case.
	*/
	toTestSpecification() {
		const isTypecheck = this.task.meta.typecheck === true;
		return this.project.createSpecification(this.module.moduleId, { testIds: [this.id] }, isTypecheck ? "typecheck" : void 0);
	}
}
class TestCollection {
	#task;
	#project;
	constructor(task, project) {
		this.#task = task;
		this.#project = project;
	}
	/**
	* Returns the test or suite at a specific index.
	*/
	at(index) {
		if (index < 0) index = this.size + index;
		return getReportedTask(this.#project, this.#task.tasks[index]);
	}
	/**
	* The number of tests and suites in the collection.
	*/
	get size() {
		return this.#task.tasks.length;
	}
	/**
	* Returns the collection in array form for easier manipulation.
	*/
	array() {
		return Array.from(this);
	}
	/**
	* Filters all tests that are part of this collection and its children.
	*/
	*allTests(state) {
		for (const child of this) if (child.type === "suite") yield* child.children.allTests(state);
		else if (state) {
			if (state === child.result().state) yield child;
		} else yield child;
	}
	/**
	* Filters only the tests that are part of this collection.
	*/
	*tests(state) {
		for (const child of this) {
			if (child.type !== "test") continue;
			if (state) {
				if (state === child.result().state) yield child;
			} else yield child;
		}
	}
	/**
	* Filters only the suites that are part of this collection.
	*/
	*suites() {
		for (const child of this) if (child.type === "suite") yield child;
	}
	/**
	* Filters all suites that are part of this collection and its children.
	*/
	*allSuites() {
		for (const child of this) if (child.type === "suite") {
			yield child;
			yield* child.children.allSuites();
		}
	}
	*[Symbol.iterator]() {
		for (const task of this.#task.tasks) yield getReportedTask(this.#project, task);
	}
}
class SuiteImplementation extends ReportedTaskImplementation {
	/**
	* Collection of suites and tests that are part of this suite.
	*/
	children;
	/** @internal */
	constructor(task, project) {
		super(task, project);
		this.children = new TestCollection(task, project);
	}
	/**
	* Errors that happened outside of the test run during collection, like syntax errors.
	*/
	errors() {
		return this.task.result?.errors || [];
	}
}
class TestSuite extends SuiteImplementation {
	#fullName;
	type = "suite";
	/**
	* Name of the test or the suite.
	*/
	name;
	/**
	* Direct reference to the test module where the test or suite is defined.
	*/
	module;
	/**
	* Parent suite. If suite was called directly inside the module, the parent will be the module itself.
	*/
	parent;
	/**
	* Options that suite was initiated with.
	*/
	options;
	/** @internal */
	constructor(task, project) {
		super(task, project);
		this.name = task.name;
		this.module = getReportedTask(project, task.file);
		const suite = this.task.suite;
		if (suite) this.parent = getReportedTask(project, suite);
		else this.parent = this.module;
		this.options = buildOptions(task);
	}
	/**
	* Checks the running state of the suite.
	*/
	state() {
		return getSuiteState(this.task);
	}
	/**
	* Returns a new test specification that can be used to filter or run this specific test suite.
	*/
	toTestSpecification() {
		const isTypecheck = this.task.meta.typecheck === true;
		const testIds = Array.from(this.children.allTests(), (test) => test.id);
		return this.project.createSpecification(this.module.moduleId, { testIds }, isTypecheck ? "typecheck" : void 0);
	}
	/**
	* Full name of the suite including all parent suites separated with `>`.
	*/
	get fullName() {
		if (this.#fullName === void 0) if (this.parent.type !== "module") this.#fullName = `${this.parent.fullName} > ${this.name}`;
		else this.#fullName = this.name;
		return this.#fullName;
	}
}
class TestModule extends SuiteImplementation {
	type = "module";
	/**
	* The Vite environment that processes files on the server.
	*
	* Can be empty if test module did not run yet.
	*/
	viteEnvironment;
	/**
	* This is usually an absolute UNIX file path.
	* It can be a virtual ID if the file is not on the disk.
	* This value corresponds to the ID in the Vite's module graph.
	*/
	moduleId;
	/**
	* Module id relative to the project. This is the same as `task.name`.
	*/
	relativeModuleId;
	/** @internal */
	constructor(task, project) {
		super(task, project);
		this.moduleId = task.filepath;
		this.relativeModuleId = task.name;
		if (typeof task.viteEnvironment === "string") this.viteEnvironment = project.vite.environments[task.viteEnvironment];
	}
	/**
	* Returns a new test specification that can be used to filter or run this specific test module.
	*/
	toTestSpecification(testCases) {
		const isTypecheck = this.task.meta.typecheck === true;
		return this.project.createSpecification(this.moduleId, testCases?.length ? { testIds: testCases.map((t) => t.id) } : void 0, isTypecheck ? "typecheck" : void 0);
	}
	/**
	* Checks the running state of the test file.
	*/
	state() {
		if (this.task.result?.state === "queued") return "queued";
		return getSuiteState(this.task);
	}
	/**
	* Useful information about the module like duration, memory usage, etc.
	* If the module was not executed yet, all diagnostic values will return `0`.
	*/
	diagnostic() {
		const setupDuration = this.task.setupDuration || 0;
		const collectDuration = this.task.collectDuration || 0;
		const prepareDuration = this.task.prepareDuration || 0;
		return {
			environmentSetupDuration: this.task.environmentLoad || 0,
			prepareDuration,
			collectDuration,
			setupDuration,
			duration: this.task.result?.duration || 0,
			heap: this.task.result?.heap,
			importDurations: this.task.importDurations ?? {},
			concurrencyId: this.task.concurrencyId,
			workerId: this.task.workerId
		};
	}
}
function buildOptions(task) {
	return {
		each: task.each,
		fails: task.type === "test" && task.fails,
		concurrent: task.concurrent,
		shuffle: task.shuffle,
		retry: task.retry,
		repeats: task.repeats,
		tags: task.tags,
		timeout: task.type === "test" ? task.timeout : void 0,
		// runner types are too broad, but the public API should be more strict
		// the queued state exists only on Files and this method is called
		// only for tests and suites
		mode: task.mode
	};
}
function storeTask(project, runnerTask, reportedTask) {
	project.vitest.state.reportedTasksMap.set(runnerTask, reportedTask);
}
function getReportedTask(project, runnerTask) {
	const reportedTask = project.vitest.state.getReportedEntity(runnerTask);
	if (!reportedTask) throw new Error(`Task instance was not found for ${runnerTask.type} "${runnerTask.name}"`);
	return reportedTask;
}
function getSuiteState(task) {
	const mode = task.mode;
	const state = task.result?.state;
	if (mode === "skip" || mode === "todo" || state === "skip" || state === "todo") return "skipped";
	if (state == null || state === "run" || state === "only") return "pending";
	if (state === "fail") return "failed";
	if (state === "pass") return "passed";
	throw new Error(`Unknown suite state: ${state}`);
}
function experimental_getRunnerTask(entity) {
	return entity.task;
}

function isAggregateError(err) {
	if (typeof AggregateError !== "undefined" && err instanceof AggregateError) return true;
	return err instanceof Error && "errors" in err;
}
class StateManager {
	filesMap = /* @__PURE__ */ new Map();
	pathsSet = /* @__PURE__ */ new Set();
	idMap = /* @__PURE__ */ new Map();
	taskFileMap = /* @__PURE__ */ new WeakMap();
	errorsSet = /* @__PURE__ */ new Set();
	leakSet = /* @__PURE__ */ new Set();
	reportedTasksMap = /* @__PURE__ */ new WeakMap();
	blobs;
	/**
	* Total time spent starting test workers (spawning the process/thread, loading
	* the worker bundle and setting up the test environment). Used to surface the
	* cost of `isolate: true`, which spawns a fresh worker per test file.
	*/
	startupTime = 0;
	/** Number of test workers that were started during the run. */
	workersSpawned = 0;
	metadata = {};
	onUnhandledError;
	/** @internal */
	_data = { timeoutIncreased: false };
	constructor(options) {
		this.onUnhandledError = options.onUnhandledError;
	}
	catchError(error, type) {
		if (isAggregateError(error)) return error.errors.forEach((error) => this.catchError(error, type));
		if (typeof error === "object" && error !== null) error.type = type;
		else error = {
			type,
			message: error
		};
		const _error = error;
		if (_error && typeof _error === "object" && _error.code === "VITEST_PENDING") {
			const task = this.idMap.get(_error.taskId);
			if (task) {
				task.mode = "skip";
				task.result ??= { state: "skip" };
				task.result.state = "skip";
				task.result.note = _error.note;
			}
			return;
		}
		if (!this.onUnhandledError || this.onUnhandledError(error) !== false) this.errorsSet.add(error);
	}
	catchLeaks(leaks) {
		leaks.forEach((leak) => this.leakSet.add(leak));
	}
	clearErrors() {
		this.errorsSet.clear();
		this.leakSet.clear();
	}
	getUnhandledErrors() {
		return Array.from(this.errorsSet);
	}
	getPaths() {
		return Array.from(this.pathsSet);
	}
	/**
	* Return files that were running or collected.
	*/
	getFiles(keys) {
		if (keys) return keys.map((key) => this.filesMap.get(key)).flat().filter((file) => file && !file.local);
		return Array.from(this.filesMap.values()).flat().filter((file) => !file.local).sort((f1, f2) => {
			// print typecheck files first
			if (f1.meta?.typecheck && f2.meta?.typecheck) return 0;
			if (f1.meta?.typecheck) return -1;
			return 1;
		});
	}
	getTestModules(keys) {
		return this.getFiles(keys).map((file) => this.getReportedEntity(file));
	}
	getFilepaths() {
		return Array.from(this.filesMap.keys());
	}
	getFailedFilepaths() {
		return this.getFiles().filter((i) => i.result?.state === "fail").map((i) => i.filepath);
	}
	collectPaths(paths = []) {
		paths.forEach((path) => {
			this.pathsSet.add(path);
		});
	}
	collectFiles(project, files = []) {
		files.forEach((file) => {
			const existing = this.filesMap.get(file.filepath) || [];
			const currentFile = existing.find((i) => i.projectName === file.projectName && i.meta.typecheck === file.meta.typecheck && i.meta.__vitest_label__ === file.meta.__vitest_label__);
			// keep logs for the previous file because it should always be initiated before the collections phase
			// which means that all logs are collected during the collection and not inside tests
			if (currentFile) file.logs = currentFile.logs;
			const otherFiles = existing.filter((i) => i !== currentFile);
			otherFiles.push(file);
			this.filesMap.set(file.filepath, otherFiles);
			this.updateId(file, project);
		});
	}
	clearFiles(project, paths = []) {
		paths.forEach((path) => {
			const files = this.filesMap.get(path);
			const fileTask = createFileTask$1(path, project.config.root, project.config.name);
			fileTask.local = true;
			TestModule.register(fileTask, project);
			this.idMap.set(fileTask.id, fileTask);
			if (!files) {
				this.filesMap.set(path, [fileTask]);
				return;
			}
			const filtered = files.filter((file) => file.projectName !== project.config.name);
			// always keep a File task, so we can associate logs with it
			if (!filtered.length) this.filesMap.set(path, [fileTask]);
			else this.filesMap.set(path, [...filtered, fileTask]);
		});
	}
	updateId(task, project) {
		if (this.idMap.get(task.id) === task) return;
		if (task.type === "suite" && "filepath" in task) TestModule.register(task, project);
		else if (task.type === "suite") TestSuite.register(task, project);
		else TestCase.register(task, project);
		this.idMap.set(task.id, task);
		if (task.type === "suite") task.tasks.forEach((task) => {
			this.updateId(task, project);
		});
	}
	getReportedEntity(task) {
		return this.reportedTasksMap.get(task);
	}
	getReportedEntityById(taskId) {
		const task = this.idMap.get(taskId);
		return task ? this.reportedTasksMap.get(task) : void 0;
	}
	updateTasks(packs) {
		for (const [id, result, meta] of packs) {
			const task = this.idMap.get(id);
			if (task) {
				task.result = result;
				task.meta = meta;
				// skipped with new PendingError
				if (result?.state === "skip") task.mode = "skip";
			}
		}
	}
	updateUserLog(log) {
		const task = log.taskId && this.idMap.get(log.taskId);
		if (task) {
			if (!task.logs) task.logs = [];
			task.logs.push(log);
		}
	}
	getCountOfFailedTests() {
		return Array.from(this.idMap.values()).filter((t) => t.result?.state === "fail").length;
	}
	cancelFiles(files, project) {
		// if we don't filter existing modules, they will be overridden by `collectFiles`
		const nonRegisteredFiles = files.filter(({ filepath }) => {
			const relativePath = relative(project.config.root, filepath);
			const id = generateFileHash(relativePath, project.name);
			return !this.idMap.has(id);
		});
		this.collectFiles(project, nonRegisteredFiles.map((file) => createFileTask$1(file.filepath, project.config.root, project.config.name)));
	}
}

function populateProjectsTags(rootProject, projects) {
	// Include root project if not already in the list
	const allProjects = projects.includes(rootProject) ? projects : [rootProject, ...projects];
	// Collect all tags from all projects (first definition wins)
	const globalTags = /* @__PURE__ */ new Map();
	for (const project of allProjects) for (const tag of project.config.tags || []) if (!globalTags.has(tag.name)) globalTags.set(tag.name, tag);
	// Add missing tags to each project (without overriding local definitions)
	for (const project of allProjects) {
		const projectTagNames = new Set(project.config.tags.map((t) => t.name));
		for (const [tagName, tagDef] of globalTags) if (!projectTagNames.has(tagName)) project.config.tags.push(tagDef);
	}
}

var convertSourceMap$1 = {};

var hasRequiredConvertSourceMap;

function requireConvertSourceMap () {
	if (hasRequiredConvertSourceMap) return convertSourceMap$1;
	hasRequiredConvertSourceMap = 1;
	(function (exports) {

		Object.defineProperty(exports, 'commentRegex', {
		  get: function getCommentRegex () {
		    // Groups: 1: media type, 2: MIME type, 3: charset, 4: encoding, 5: data.
		    return /^\s*?\/[\/\*][@#]\s+?sourceMappingURL=data:(((?:application|text)\/json)(?:;charset=([^;,]+?)?)?)?(?:;(base64))?,(.*?)$/mg;
		  }
		});


		Object.defineProperty(exports, 'mapFileCommentRegex', {
		  get: function getMapFileCommentRegex () {
		    // Matches sourceMappingURL in either // or /* comment styles.
		    return /(?:\/\/[@#][ \t]+?sourceMappingURL=([^\s'"`]+?)[ \t]*?$)|(?:\/\*[@#][ \t]+sourceMappingURL=([^*]+?)[ \t]*?(?:\*\/){1}[ \t]*?$)/mg;
		  }
		});

		var decodeBase64;
		if (typeof Buffer !== 'undefined') {
		  if (typeof Buffer.from === 'function') {
		    decodeBase64 = decodeBase64WithBufferFrom;
		  } else {
		    decodeBase64 = decodeBase64WithNewBuffer;
		  }
		} else {
		  decodeBase64 = decodeBase64WithAtob;
		}

		function decodeBase64WithBufferFrom(base64) {
		  return Buffer.from(base64, 'base64').toString();
		}

		function decodeBase64WithNewBuffer(base64) {
		  if (typeof value === 'number') {
		    throw new TypeError('The value to decode must not be of type number.');
		  }
		  return new Buffer(base64, 'base64').toString();
		}

		function decodeBase64WithAtob(base64) {
		  return decodeURIComponent(escape(atob(base64)));
		}

		function stripComment(sm) {
		  return sm.split(',').pop();
		}

		function readFromFileMap(sm, read) {
		  var r = exports.mapFileCommentRegex.exec(sm);
		  // for some odd reason //# .. captures in 1 and /* .. */ in 2
		  var filename = r[1] || r[2];

		  try {
		    var sm = read(filename);
		    if (sm != null && typeof sm.catch === 'function') {
		      return sm.catch(throwError);
		    } else {
		      return sm;
		    }
		  } catch (e) {
		    throwError(e);
		  }

		  function throwError(e) {
		    throw new Error('An error occurred while trying to read the map file at ' + filename + '\n' + e.stack);
		  }
		}

		function Converter (sm, opts) {
		  opts = opts || {};

		  if (opts.hasComment) {
		    sm = stripComment(sm);
		  }

		  if (opts.encoding === 'base64') {
		    sm = decodeBase64(sm);
		  } else if (opts.encoding === 'uri') {
		    sm = decodeURIComponent(sm);
		  }

		  if (opts.isJSON || opts.encoding) {
		    sm = JSON.parse(sm);
		  }

		  this.sourcemap = sm;
		}

		Converter.prototype.toJSON = function (space) {
		  return JSON.stringify(this.sourcemap, null, space);
		};

		if (typeof Buffer !== 'undefined') {
		  if (typeof Buffer.from === 'function') {
		    Converter.prototype.toBase64 = encodeBase64WithBufferFrom;
		  } else {
		    Converter.prototype.toBase64 = encodeBase64WithNewBuffer;
		  }
		} else {
		  Converter.prototype.toBase64 = encodeBase64WithBtoa;
		}

		function encodeBase64WithBufferFrom() {
		  var json = this.toJSON();
		  return Buffer.from(json, 'utf8').toString('base64');
		}

		function encodeBase64WithNewBuffer() {
		  var json = this.toJSON();
		  if (typeof json === 'number') {
		    throw new TypeError('The json to encode must not be of type number.');
		  }
		  return new Buffer(json, 'utf8').toString('base64');
		}

		function encodeBase64WithBtoa() {
		  var json = this.toJSON();
		  return btoa(unescape(encodeURIComponent(json)));
		}

		Converter.prototype.toURI = function () {
		  var json = this.toJSON();
		  return encodeURIComponent(json);
		};

		Converter.prototype.toComment = function (options) {
		  var encoding, content, data;
		  if (options != null && options.encoding === 'uri') {
		    encoding = '';
		    content = this.toURI();
		  } else {
		    encoding = ';base64';
		    content = this.toBase64();
		  }
		  data = 'sourceMappingURL=data:application/json;charset=utf-8' + encoding + ',' + content;
		  return options != null && options.multiline ? '/*# ' + data + ' */' : '//# ' + data;
		};

		// returns copy instead of original
		Converter.prototype.toObject = function () {
		  return JSON.parse(this.toJSON());
		};

		Converter.prototype.addProperty = function (key, value) {
		  if (this.sourcemap.hasOwnProperty(key)) throw new Error('property "' + key + '" already exists on the sourcemap, use set property instead');
		  return this.setProperty(key, value);
		};

		Converter.prototype.setProperty = function (key, value) {
		  this.sourcemap[key] = value;
		  return this;
		};

		Converter.prototype.getProperty = function (key) {
		  return this.sourcemap[key];
		};

		exports.fromObject = function (obj) {
		  return new Converter(obj);
		};

		exports.fromJSON = function (json) {
		  return new Converter(json, { isJSON: true });
		};

		exports.fromURI = function (uri) {
		  return new Converter(uri, { encoding: 'uri' });
		};

		exports.fromBase64 = function (base64) {
		  return new Converter(base64, { encoding: 'base64' });
		};

		exports.fromComment = function (comment) {
		  var m, encoding;
		  comment = comment
		    .replace(/^\/\*/g, '//')
		    .replace(/\*\/$/g, '');
		  m = exports.commentRegex.exec(comment);
		  encoding = m && m[4] || 'uri';
		  return new Converter(comment, { encoding: encoding, hasComment: true });
		};

		function makeConverter(sm) {
		  return new Converter(sm, { isJSON: true });
		}

		exports.fromMapFileComment = function (comment, read) {
		  if (typeof read === 'string') {
		    throw new Error(
		      'String directory paths are no longer supported with `fromMapFileComment`\n' +
		      'Please review the Upgrading documentation at https://github.com/thlorenz/convert-source-map#upgrading'
		    )
		  }

		  var sm = readFromFileMap(comment, read);
		  if (sm != null && typeof sm.then === 'function') {
		    return sm.then(makeConverter);
		  } else {
		    return makeConverter(sm);
		  }
		};

		// Finds last sourcemap comment in file or returns null if none was found
		exports.fromSource = function (content) {
		  var m = content.match(exports.commentRegex);
		  return m ? exports.fromComment(m.pop()) : null;
		};

		// Finds last sourcemap comment in file or returns null if none was found
		exports.fromMapFileSource = function (content, read) {
		  if (typeof read === 'string') {
		    throw new Error(
		      'String directory paths are no longer supported with `fromMapFileSource`\n' +
		      'Please review the Upgrading documentation at https://github.com/thlorenz/convert-source-map#upgrading'
		    )
		  }
		  var m = content.match(exports.mapFileCommentRegex);
		  return m ? exports.fromMapFileComment(m.pop(), read) : null;
		};

		exports.removeComments = function (src) {
		  return src.replace(exports.commentRegex, '');
		};

		exports.removeMapFileComments = function (src) {
		  return src.replace(exports.mapFileCommentRegex, '');
		};

		exports.generateMapFileComment = function (file, options) {
		  var data = 'sourceMappingURL=' + file;
		  return options && options.multiline ? '/*# ' + data + ' */' : '//# ' + data;
		}; 
	} (convertSourceMap$1));
	return convertSourceMap$1;
}

var convertSourceMapExports = requireConvertSourceMap();
var convertSourceMap = /*@__PURE__*/getDefaultExportFromCjs(convertSourceMapExports);

// based on vite
// https://github.com/vitejs/vite/blob/84079a84ad94de4c1ef4f1bdb2ab448ff2c01196/packages/vite/src/node/server/sourcemap.ts#L149
function extractSourcemapFromFile(code, filePath) {
	try {
		const map = (convertSourceMap.fromSource(code) || convertSourceMap.fromMapFileSource(code, createConvertSourceMapReadMap(filePath)))?.toObject();
		return map ? { map } : void 0;
	} catch {
		return;
	}
}
function createConvertSourceMapReadMap(originalFileName) {
	return (filename) => {
		// convertSourceMap can detect invalid filename from comments.
		// fallback to empty source map to avoid errors.
		const targetPath = path.resolve(path.dirname(originalFileName), filename);
		if (existsSync(targetPath)) return readFileSync(targetPath, "utf-8");
		return "{}";
	};
}

const types = {
    'application/andrew-inset': ['ez'],
    'application/appinstaller': ['appinstaller'],
    'application/applixware': ['aw'],
    'application/appx': ['appx'],
    'application/appxbundle': ['appxbundle'],
    'application/atom+xml': ['atom'],
    'application/atomcat+xml': ['atomcat'],
    'application/atomdeleted+xml': ['atomdeleted'],
    'application/atomsvc+xml': ['atomsvc'],
    'application/atsc-dwd+xml': ['dwd'],
    'application/atsc-held+xml': ['held'],
    'application/atsc-rsat+xml': ['rsat'],
    'application/automationml-aml+xml': ['aml'],
    'application/automationml-amlx+zip': ['amlx'],
    'application/bdoc': ['bdoc'],
    'application/calendar+xml': ['xcs'],
    'application/ccxml+xml': ['ccxml'],
    'application/cdfx+xml': ['cdfx'],
    'application/cdmi-capability': ['cdmia'],
    'application/cdmi-container': ['cdmic'],
    'application/cdmi-domain': ['cdmid'],
    'application/cdmi-object': ['cdmio'],
    'application/cdmi-queue': ['cdmiq'],
    'application/cpl+xml': ['cpl'],
    'application/cu-seeme': ['cu'],
    'application/cwl': ['cwl'],
    'application/dash+xml': ['mpd'],
    'application/dash-patch+xml': ['mpp'],
    'application/davmount+xml': ['davmount'],
    'application/dicom': ['dcm'],
    'application/docbook+xml': ['dbk'],
    'application/dssc+der': ['dssc'],
    'application/dssc+xml': ['xdssc'],
    'application/ecmascript': ['ecma'],
    'application/emma+xml': ['emma'],
    'application/emotionml+xml': ['emotionml'],
    'application/epub+zip': ['epub'],
    'application/exi': ['exi'],
    'application/express': ['exp'],
    'application/fdf': ['fdf'],
    'application/fdt+xml': ['fdt'],
    'application/font-tdpfr': ['pfr'],
    'application/geo+json': ['geojson'],
    'application/gml+xml': ['gml'],
    'application/gpx+xml': ['gpx'],
    'application/gxf': ['gxf'],
    'application/gzip': ['gz'],
    'application/hjson': ['hjson'],
    'application/hyperstudio': ['stk'],
    'application/inkml+xml': ['ink', 'inkml'],
    'application/ipfix': ['ipfix'],
    'application/its+xml': ['its'],
    'application/java-archive': ['jar', 'war', 'ear'],
    'application/java-serialized-object': ['ser'],
    'application/java-vm': ['class'],
    'application/javascript': ['*js'],
    'application/json': ['json', 'map'],
    'application/json5': ['json5'],
    'application/jsonml+json': ['jsonml'],
    'application/ld+json': ['jsonld'],
    'application/lgr+xml': ['lgr'],
    'application/lost+xml': ['lostxml'],
    'application/mac-binhex40': ['hqx'],
    'application/mac-compactpro': ['cpt'],
    'application/mads+xml': ['mads'],
    'application/manifest+json': ['webmanifest'],
    'application/marc': ['mrc'],
    'application/marcxml+xml': ['mrcx'],
    'application/mathematica': ['ma', 'nb', 'mb'],
    'application/mathml+xml': ['mathml'],
    'application/mbox': ['mbox'],
    'application/media-policy-dataset+xml': ['mpf'],
    'application/mediaservercontrol+xml': ['mscml'],
    'application/metalink+xml': ['metalink'],
    'application/metalink4+xml': ['meta4'],
    'application/mets+xml': ['mets'],
    'application/mmt-aei+xml': ['maei'],
    'application/mmt-usd+xml': ['musd'],
    'application/mods+xml': ['mods'],
    'application/mp21': ['m21', 'mp21'],
    'application/mp4': ['*mp4', '*mpg4', 'mp4s', 'm4p'],
    'application/msix': ['msix'],
    'application/msixbundle': ['msixbundle'],
    'application/msword': ['doc', 'dot'],
    'application/mxf': ['mxf'],
    'application/n-quads': ['nq'],
    'application/n-triples': ['nt'],
    'application/node': ['cjs'],
    'application/octet-stream': [
        'bin',
        'dms',
        'lrf',
        'mar',
        'so',
        'dist',
        'distz',
        'pkg',
        'bpk',
        'dump',
        'elc',
        'deploy',
        'exe',
        'dll',
        'deb',
        'dmg',
        'iso',
        'img',
        'msi',
        'msp',
        'msm',
        'buffer',
    ],
    'application/oda': ['oda'],
    'application/oebps-package+xml': ['opf'],
    'application/ogg': ['ogx'],
    'application/omdoc+xml': ['omdoc'],
    'application/onenote': [
        'onetoc',
        'onetoc2',
        'onetmp',
        'onepkg',
        'one',
        'onea',
    ],
    'application/oxps': ['oxps'],
    'application/p2p-overlay+xml': ['relo'],
    'application/patch-ops-error+xml': ['xer'],
    'application/pdf': ['pdf'],
    'application/pgp-encrypted': ['pgp'],
    'application/pgp-keys': ['asc'],
    'application/pgp-signature': ['sig', '*asc'],
    'application/pics-rules': ['prf'],
    'application/pkcs10': ['p10'],
    'application/pkcs7-mime': ['p7m', 'p7c'],
    'application/pkcs7-signature': ['p7s'],
    'application/pkcs8': ['p8'],
    'application/pkix-attr-cert': ['ac'],
    'application/pkix-cert': ['cer'],
    'application/pkix-crl': ['crl'],
    'application/pkix-pkipath': ['pkipath'],
    'application/pkixcmp': ['pki'],
    'application/pls+xml': ['pls'],
    'application/postscript': ['ai', 'eps', 'ps'],
    'application/provenance+xml': ['provx'],
    'application/pskc+xml': ['pskcxml'],
    'application/raml+yaml': ['raml'],
    'application/rdf+xml': ['rdf', 'owl'],
    'application/reginfo+xml': ['rif'],
    'application/relax-ng-compact-syntax': ['rnc'],
    'application/resource-lists+xml': ['rl'],
    'application/resource-lists-diff+xml': ['rld'],
    'application/rls-services+xml': ['rs'],
    'application/route-apd+xml': ['rapd'],
    'application/route-s-tsid+xml': ['sls'],
    'application/route-usd+xml': ['rusd'],
    'application/rpki-ghostbusters': ['gbr'],
    'application/rpki-manifest': ['mft'],
    'application/rpki-roa': ['roa'],
    'application/rsd+xml': ['rsd'],
    'application/rss+xml': ['rss'],
    'application/rtf': ['rtf'],
    'application/sbml+xml': ['sbml'],
    'application/scvp-cv-request': ['scq'],
    'application/scvp-cv-response': ['scs'],
    'application/scvp-vp-request': ['spq'],
    'application/scvp-vp-response': ['spp'],
    'application/sdp': ['sdp'],
    'application/senml+xml': ['senmlx'],
    'application/sensml+xml': ['sensmlx'],
    'application/set-payment-initiation': ['setpay'],
    'application/set-registration-initiation': ['setreg'],
    'application/shf+xml': ['shf'],
    'application/sieve': ['siv', 'sieve'],
    'application/smil+xml': ['smi', 'smil'],
    'application/sparql-query': ['rq'],
    'application/sparql-results+xml': ['srx'],
    'application/sql': ['sql'],
    'application/srgs': ['gram'],
    'application/srgs+xml': ['grxml'],
    'application/sru+xml': ['sru'],
    'application/ssdl+xml': ['ssdl'],
    'application/ssml+xml': ['ssml'],
    'application/swid+xml': ['swidtag'],
    'application/tei+xml': ['tei', 'teicorpus'],
    'application/thraud+xml': ['tfi'],
    'application/timestamped-data': ['tsd'],
    'application/toml': ['toml'],
    'application/trig': ['trig'],
    'application/ttml+xml': ['ttml'],
    'application/ubjson': ['ubj'],
    'application/urc-ressheet+xml': ['rsheet'],
    'application/urc-targetdesc+xml': ['td'],
    'application/voicexml+xml': ['vxml'],
    'application/wasm': ['wasm'],
    'application/watcherinfo+xml': ['wif'],
    'application/widget': ['wgt'],
    'application/winhlp': ['hlp'],
    'application/wsdl+xml': ['wsdl'],
    'application/wspolicy+xml': ['wspolicy'],
    'application/xaml+xml': ['xaml'],
    'application/xcap-att+xml': ['xav'],
    'application/xcap-caps+xml': ['xca'],
    'application/xcap-diff+xml': ['xdf'],
    'application/xcap-el+xml': ['xel'],
    'application/xcap-ns+xml': ['xns'],
    'application/xenc+xml': ['xenc'],
    'application/xfdf': ['xfdf'],
    'application/xhtml+xml': ['xhtml', 'xht'],
    'application/xliff+xml': ['xlf'],
    'application/xml': ['xml', 'xsl', 'xsd', 'rng'],
    'application/xml-dtd': ['dtd'],
    'application/xop+xml': ['xop'],
    'application/xproc+xml': ['xpl'],
    'application/xslt+xml': ['*xsl', 'xslt'],
    'application/xspf+xml': ['xspf'],
    'application/xv+xml': ['mxml', 'xhvml', 'xvml', 'xvm'],
    'application/yang': ['yang'],
    'application/yin+xml': ['yin'],
    'application/zip': ['zip'],
    'application/zip+dotlottie': ['lottie'],
    'audio/3gpp': ['*3gpp'],
    'audio/aac': ['adts', 'aac'],
    'audio/adpcm': ['adp'],
    'audio/amr': ['amr'],
    'audio/basic': ['au', 'snd'],
    'audio/midi': ['mid', 'midi', 'kar', 'rmi'],
    'audio/mobile-xmf': ['mxmf'],
    'audio/mp3': ['*mp3'],
    'audio/mp4': ['m4a', 'mp4a', 'm4b'],
    'audio/mpeg': ['mpga', 'mp2', 'mp2a', 'mp3', 'm2a', 'm3a'],
    'audio/ogg': ['oga', 'ogg', 'spx', 'opus'],
    'audio/s3m': ['s3m'],
    'audio/silk': ['sil'],
    'audio/wav': ['wav'],
    'audio/wave': ['*wav'],
    'audio/webm': ['weba'],
    'audio/xm': ['xm'],
    'font/collection': ['ttc'],
    'font/otf': ['otf'],
    'font/ttf': ['ttf'],
    'font/woff': ['woff'],
    'font/woff2': ['woff2'],
    'image/aces': ['exr'],
    'image/apng': ['apng'],
    'image/avci': ['avci'],
    'image/avcs': ['avcs'],
    'image/avif': ['avif'],
    'image/bmp': ['bmp', 'dib'],
    'image/cgm': ['cgm'],
    'image/dicom-rle': ['drle'],
    'image/dpx': ['dpx'],
    'image/emf': ['emf'],
    'image/fits': ['fits'],
    'image/g3fax': ['g3'],
    'image/gif': ['gif'],
    'image/heic': ['heic'],
    'image/heic-sequence': ['heics'],
    'image/heif': ['heif'],
    'image/heif-sequence': ['heifs'],
    'image/hej2k': ['hej2'],
    'image/ief': ['ief'],
    'image/jaii': ['jaii'],
    'image/jais': ['jais'],
    'image/jls': ['jls'],
    'image/jp2': ['jp2', 'jpg2'],
    'image/jpeg': ['jpg', 'jpeg', 'jpe'],
    'image/jph': ['jph'],
    'image/jphc': ['jhc'],
    'image/jpm': ['jpm', 'jpgm'],
    'image/jpx': ['jpx', 'jpf'],
    'image/jxl': ['jxl'],
    'image/jxr': ['jxr'],
    'image/jxra': ['jxra'],
    'image/jxrs': ['jxrs'],
    'image/jxs': ['jxs'],
    'image/jxsc': ['jxsc'],
    'image/jxsi': ['jxsi'],
    'image/jxss': ['jxss'],
    'image/ktx': ['ktx'],
    'image/ktx2': ['ktx2'],
    'image/pjpeg': ['jfif'],
    'image/png': ['png'],
    'image/sgi': ['sgi'],
    'image/svg+xml': ['svg', 'svgz'],
    'image/t38': ['t38'],
    'image/tiff': ['tif', 'tiff'],
    'image/tiff-fx': ['tfx'],
    'image/webp': ['webp'],
    'image/wmf': ['wmf'],
    'message/disposition-notification': ['disposition-notification'],
    'message/global': ['u8msg'],
    'message/global-delivery-status': ['u8dsn'],
    'message/global-disposition-notification': ['u8mdn'],
    'message/global-headers': ['u8hdr'],
    'message/rfc822': ['eml', 'mime', 'mht', 'mhtml'],
    'model/3mf': ['3mf'],
    'model/gltf+json': ['gltf'],
    'model/gltf-binary': ['glb'],
    'model/iges': ['igs', 'iges'],
    'model/jt': ['jt'],
    'model/mesh': ['msh', 'mesh', 'silo'],
    'model/mtl': ['mtl'],
    'model/obj': ['obj'],
    'model/prc': ['prc'],
    'model/step': ['step', 'stp', 'stpnc', 'p21', '210'],
    'model/step+xml': ['stpx'],
    'model/step+zip': ['stpz'],
    'model/step-xml+zip': ['stpxz'],
    'model/stl': ['stl'],
    'model/u3d': ['u3d'],
    'model/vrml': ['wrl', 'vrml'],
    'model/x3d+binary': ['*x3db', 'x3dbz'],
    'model/x3d+fastinfoset': ['x3db'],
    'model/x3d+vrml': ['*x3dv', 'x3dvz'],
    'model/x3d+xml': ['x3d', 'x3dz'],
    'model/x3d-vrml': ['x3dv'],
    'text/cache-manifest': ['appcache', 'manifest'],
    'text/calendar': ['ics', 'ifb'],
    'text/coffeescript': ['coffee', 'litcoffee'],
    'text/css': ['css'],
    'text/csv': ['csv'],
    'text/html': ['html', 'htm', 'shtml'],
    'text/jade': ['jade'],
    'text/javascript': ['js', 'mjs'],
    'text/jsx': ['jsx'],
    'text/less': ['less'],
    'text/markdown': ['md', 'markdown'],
    'text/mathml': ['mml'],
    'text/mdx': ['mdx'],
    'text/n3': ['n3'],
    'text/plain': ['txt', 'text', 'conf', 'def', 'list', 'log', 'in', 'ini'],
    'text/richtext': ['rtx'],
    'text/rtf': ['*rtf'],
    'text/sgml': ['sgml', 'sgm'],
    'text/shex': ['shex'],
    'text/slim': ['slim', 'slm'],
    'text/spdx': ['spdx'],
    'text/stylus': ['stylus', 'styl'],
    'text/tab-separated-values': ['tsv'],
    'text/troff': ['t', 'tr', 'roff', 'man', 'me', 'ms'],
    'text/turtle': ['ttl'],
    'text/uri-list': ['uri', 'uris', 'urls'],
    'text/vcard': ['vcard'],
    'text/vtt': ['vtt'],
    'text/wgsl': ['wgsl'],
    'text/xml': ['*xml'],
    'text/yaml': ['yaml', 'yml'],
    'video/3gpp': ['3gp', '3gpp'],
    'video/3gpp2': ['3g2'],
    'video/h261': ['h261'],
    'video/h263': ['h263'],
    'video/h264': ['h264'],
    'video/iso.segment': ['m4s'],
    'video/jpeg': ['jpgv'],
    'video/jpm': ['*jpm', '*jpgm'],
    'video/mj2': ['mj2', 'mjp2'],
    'video/mp2t': ['ts', 'm2t', 'm2ts', 'mts'],
    'video/mp4': ['mp4', 'mp4v', 'mpg4'],
    'video/mpeg': ['mpeg', 'mpg', 'mpe', 'm1v', 'm2v'],
    'video/ogg': ['ogv'],
    'video/quicktime': ['qt', 'mov'],
    'video/webm': ['webm'],
};
Object.freeze(types);

var __classPrivateFieldGet = ({} && {}.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Mime_extensionToType, _Mime_typeToExtension, _Mime_typeToExtensions;
class Mime {
    constructor(...args) {
        _Mime_extensionToType.set(this, new Map());
        _Mime_typeToExtension.set(this, new Map());
        _Mime_typeToExtensions.set(this, new Map());
        for (const arg of args) {
            this.define(arg);
        }
    }
    define(typeMap, force = false) {
        for (let [type, extensions] of Object.entries(typeMap)) {
            type = type.toLowerCase();
            extensions = extensions.map((ext) => ext.toLowerCase());
            if (!__classPrivateFieldGet(this, _Mime_typeToExtensions, "f").has(type)) {
                __classPrivateFieldGet(this, _Mime_typeToExtensions, "f").set(type, new Set());
            }
            const allExtensions = __classPrivateFieldGet(this, _Mime_typeToExtensions, "f").get(type);
            let first = true;
            for (let extension of extensions) {
                const starred = extension.startsWith('*');
                extension = starred ? extension.slice(1) : extension;
                allExtensions?.add(extension);
                if (first) {
                    __classPrivateFieldGet(this, _Mime_typeToExtension, "f").set(type, extension);
                }
                first = false;
                if (starred)
                    continue;
                const currentType = __classPrivateFieldGet(this, _Mime_extensionToType, "f").get(extension);
                if (currentType && currentType != type && !force) {
                    throw new Error(`"${type} -> ${extension}" conflicts with "${currentType} -> ${extension}". Pass \`force=true\` to override this definition.`);
                }
                __classPrivateFieldGet(this, _Mime_extensionToType, "f").set(extension, type);
            }
        }
        return this;
    }
    getType(path) {
        if (typeof path !== 'string')
            return null;
        const last = path.replace(/^.*[/\\]/s, '').toLowerCase();
        const ext = last.replace(/^.*\./s, '').toLowerCase();
        const hasPath = last.length < path.length;
        const hasDot = ext.length < last.length - 1;
        if (!hasDot && hasPath)
            return null;
        return __classPrivateFieldGet(this, _Mime_extensionToType, "f").get(ext) ?? null;
    }
    getExtension(type) {
        if (typeof type !== 'string')
            return null;
        type = type?.split?.(';')[0];
        return ((type && __classPrivateFieldGet(this, _Mime_typeToExtension, "f").get(type.trim().toLowerCase())) ?? null);
    }
    getAllExtensions(type) {
        if (typeof type !== 'string')
            return null;
        return __classPrivateFieldGet(this, _Mime_typeToExtensions, "f").get(type.toLowerCase()) ?? null;
    }
    _freeze() {
        this.define = () => {
            throw new Error('define() not allowed for built-in Mime objects. See https://github.com/broofa/mime/blob/main/README.md#custom-mime-instances');
        };
        Object.freeze(this);
        for (const extensions of __classPrivateFieldGet(this, _Mime_typeToExtensions, "f").values()) {
            Object.freeze(extensions);
        }
        return this;
    }
    _getTestState() {
        return {
            types: __classPrivateFieldGet(this, _Mime_extensionToType, "f"),
            extensions: __classPrivateFieldGet(this, _Mime_typeToExtension, "f"),
        };
    }
}
_Mime_extensionToType = new WeakMap(), _Mime_typeToExtension = new WeakMap(), _Mime_typeToExtensions = new WeakMap();

var mime = new Mime(types)._freeze();

class TestRun {
	vitest;
	constructor(vitest) {
		this.vitest = vitest;
	}
	async start(specifications) {
		const filepaths = specifications.map((spec) => spec.moduleId);
		this.vitest.state.collectPaths(filepaths);
		await this.vitest.report("onTestRunStart", [...specifications]);
	}
	async enqueued(project, file) {
		this.vitest.state.collectFiles(project, [file]);
		const testModule = this.vitest.state.getReportedEntity(file);
		await this.vitest.report("onTestModuleQueued", testModule);
	}
	async collected(project, files) {
		this.vitest.state.collectFiles(project, files);
		await Promise.all(files.map((file) => {
			const testModule = this.vitest.state.getReportedEntity(file);
			return this.vitest.report("onTestModuleCollected", testModule);
		}));
	}
	async log(log) {
		this.vitest.state.updateUserLog(log);
		await this.vitest.report("onUserConsoleLog", log);
	}
	async recordBenchmark(testId, benchmark) {
		const testCase = this.getTestCaseById(testId, "Benchmark");
		testCase.task.benchmarks.push(benchmark);
		await this.vitest.report("onTestCaseBenchmark", testCase, benchmark);
	}
	async recordArtifact(testId, artifact) {
		const testCase = this.getTestCaseById(testId, "Artifact");
		// annotations won't resolve as artifacts for backwards compatibility until next major
		if (artifact.type === "internal:annotation") {
			await this.resolveTestAttachment(testCase, artifact.annotation.attachment, artifact.annotation.message);
			testCase.task.annotations.push(artifact.annotation);
			await this.vitest.report("onTestCaseAnnotate", testCase, artifact.annotation);
			return artifact;
		}
		if (Array.isArray(artifact.attachments)) await Promise.all(artifact.attachments.map((attachment) => this.resolveTestAttachment(testCase, attachment)));
		testCase.task.artifacts.push(artifact);
		await this.vitest.report("onTestCaseArtifactRecord", testCase, artifact);
		return artifact;
	}
	async updated(update, events) {
		this.syncUpdateStacks(update);
		this.vitest.state.updateTasks(update);
		for (const [id, event, data] of events) await this.reportEvent(id, event, data).catch((error) => {
			this.vitest.state.catchError(serializeValue(error), "Unhandled Reporter Error");
		});
		// TODO: what is the order or reports here?
		// "onTaskUpdate" in parallel with others or before all or after all?
		// TODO: error handling - what happens if custom reporter throws an error?
		await this.vitest.report("onTaskUpdate", update, events);
	}
	getTestCaseById(testId, recordType) {
		const task = this.vitest.state.idMap.get(testId);
		const entity = task && this.vitest.state.getReportedEntity(task);
		assert(task && entity, `Entity must be found for task ${task?.name || testId}`);
		assert(entity.type === "test", `${recordType} can only be recorded on a test, instead got ${entity.type}`);
		return entity;
	}
	async end(specifications, errors, coverage) {
		if (coverage) await this.vitest.report("onCoverage", coverage);
		// specification won't have the File task if they were filtered by the --shard command
		const modules = specifications.map((spec) => spec.testModule).filter((s) => s != null);
		const state = this.vitest.isCancelling ? "interrupted" : this.hasFailed(modules) ? "failed" : "passed";
		if (state !== "passed") process.exitCode = 1;
		await this.vitest.report("onTestRunEnd", modules, [...errors], state);
		for (const project in this.vitest.state.metadata) {
			const meta = this.vitest.state.metadata[project];
			if (!meta?.dumpDir) continue;
			const path = resolve(meta.dumpDir, "vitest-metadata.json");
			meta.outline = {
				externalized: Object.keys(meta.externalized).length,
				inlined: Object.keys(meta.tmps).length
			};
			await writeFile(path, JSON.stringify(meta, null, 2), "utf-8");
			this.vitest.logger.log(`Metadata written to ${path}`);
		}
	}
	hasFailed(modules) {
		if (!modules.length) return !this.vitest.config.passWithNoTests;
		return modules.some((m) => !m.ok());
	}
	// make sure the error always has a "stacks" property
	syncUpdateStacks(update) {
		update.forEach(([taskId, result]) => {
			const task = this.vitest.state.idMap.get(taskId);
			const isBrowser = task && task.file.pool === "browser";
			result?.errors?.forEach((error) => {
				if (isPrimitive(error)) return;
				const project = this.vitest.getProjectByName(task.file.projectName || "");
				if (isBrowser) error.stacks = project.browser?.parseErrorStacktrace(error, { frameFilter: project.config.onStackTrace }) || [];
				else error.stacks = parseErrorStacktrace(error, {
					frameFilter: project.config.onStackTrace,
					getSourceMap(file) {
						if (!project.vite.moduleGraph.getModuleById(file)?.transformResult && existsSync(file)) {
							const code = readFileSync(file, "utf-8");
							return extractSourcemapFromFile(code, file)?.map;
						}
					}
				});
			});
		});
	}
	async reportEvent(id, event, data) {
		const task = this.vitest.state.idMap.get(id);
		const entity = task && this.vitest.state.getReportedEntity(task);
		assert(task && entity, `Entity must be found for task ${task?.name || id}`);
		if (event === "suite-failed-early" && entity.type === "module") {
			// the file failed during import
			await this.vitest.report("onTestModuleStart", entity);
			await this.vitest.report("onTestModuleEnd", entity);
			return;
		}
		if (event === "suite-prepare" && entity.type === "suite") return await this.vitest.report("onTestSuiteReady", entity);
		if (event === "suite-prepare" && entity.type === "module") return await this.vitest.report("onTestModuleStart", entity);
		if (event === "suite-finished") {
			assert(entity.type === "suite" || entity.type === "module", "Entity type must be suite or module");
			if (entity.state() === "skipped")
 // everything inside suite or a module is skipped,
			// so we won't get any children events
			// we need to report everything manually
			await this.reportChildren(entity.children);
			if (entity.type === "module") await this.vitest.report("onTestModuleEnd", entity);
			else await this.vitest.report("onTestSuiteResult", entity);
			return;
		}
		if (event === "test-cancel" && entity.type === "test")
 // This is used to just update state of the task
		return;
		if (event === "test-prepare" && entity.type === "test") return await this.vitest.report("onTestCaseReady", entity);
		if (event === "test-finished" && entity.type === "test") return await this.vitest.report("onTestCaseResult", entity);
		if (event.startsWith("before-hook") || event.startsWith("after-hook")) {
			const isBefore = event.startsWith("before-hook");
			const hook = entity.type === "test" ? {
				name: isBefore ? "beforeEach" : "afterEach",
				entity
			} : {
				name: isBefore ? "beforeAll" : "afterAll",
				entity
			};
			if (event.endsWith("-start")) await this.vitest.report("onHookStart", hook);
			else await this.vitest.report("onHookEnd", hook);
			// this can only happen in --merge-reports, and annotation is already resolved
			if (event === "test-annotation") {
				const annotation = data?.annotation;
				assert(annotation && entity.type === "test");
				await this.vitest.report("onTestCaseAnnotate", entity, annotation);
			}
		}
	}
	async resolveTestAttachment(test, attachment, filename) {
		const project = test.project;
		if (!attachment) return attachment;
		const path = attachment.path;
		if (path && !path.startsWith("http://") && !path.startsWith("https://")) {
			const currentPath = resolve(project.config.root, path);
			const hash = createHash("sha1").update(currentPath).digest("hex");
			const newPath = resolve(project.config.attachmentsDir, `${filename ? `${sanitizeFilePath(filename)}-` : ""}${hash}${extname(currentPath)}`);
			if (!existsSync(project.config.attachmentsDir)) await mkdir(project.config.attachmentsDir, { recursive: true });
			await copyFile(currentPath, newPath);
			attachment.path = newPath;
			attachment.contentType = (attachment.contentType ?? mime.getType(basename(currentPath))) || void 0;
		}
		return attachment;
	}
	async reportChildren(children) {
		for (const child of children) if (child.type === "test") {
			await this.vitest.report("onTestCaseReady", child);
			await this.vitest.report("onTestCaseResult", child);
		} else {
			await this.vitest.report("onTestSuiteReady", child);
			await this.reportChildren(child.children);
			await this.vitest.report("onTestSuiteResult", child);
		}
	}
}

class GitVCSProvider {
	root;
	async resolveFilesWithGitCommand(args) {
		let result;
		try {
			result = await x("git", args, { nodeOptions: { cwd: this.root } });
		} catch (e) {
			e.message = e.stderr;
			throw e;
		}
		return result.stdout.split("\n").filter((s) => s !== "").map((changedPath) => resolve(this.root, changedPath));
	}
	async findChangedFiles(options) {
		const root = this.root || await this.getRoot(options.root);
		if (!root) throw new GitNotFoundError();
		this.root = root;
		const changedSince = options.changedSince;
		if (typeof changedSince === "string") {
			const [committed, staged, unstaged] = await Promise.all([
				this.getFilesSince(changedSince),
				this.getStagedFiles(),
				this.getUnstagedFiles()
			]);
			return [
				...committed,
				...staged,
				...unstaged
			];
		}
		const [staged, unstaged] = await Promise.all([this.getStagedFiles(), this.getUnstagedFiles()]);
		return [...staged, ...unstaged];
	}
	getFilesSince(hash) {
		return this.resolveFilesWithGitCommand([
			"diff",
			"--name-only",
			`${hash}...HEAD`
		]);
	}
	getStagedFiles() {
		return this.resolveFilesWithGitCommand([
			"diff",
			"--cached",
			"--name-only"
		]);
	}
	getUnstagedFiles() {
		return this.resolveFilesWithGitCommand([
			"ls-files",
			"--other",
			"--modified",
			"--exclude-standard"
		]);
	}
	async getRoot(cwd) {
		const args = ["rev-parse", "--show-cdup"];
		try {
			const result = await x("git", args, { nodeOptions: { cwd } });
			return resolve(cwd, result.stdout.trim());
		} catch {
			return null;
		}
	}
}

async function loadVCSProvider(runner, vcsProvider) {
	if (typeof vcsProvider === "object" && vcsProvider != null) return wrapVCSProvider(vcsProvider);
	if (!vcsProvider || vcsProvider === "git") return new GitVCSProvider();
	const module = await runner.import(vcsProvider);
	if (!module.default || typeof module.default !== "object" || typeof module.default.findChangedFiles !== "function") throw new Error(`The vcsProvider module '${vcsProvider}' doesn't have a default export with \`findChangedFiles\` method.`);
	return wrapVCSProvider(module.default);
}
function wrapVCSProvider(provider) {
	return { async findChangedFiles(options) {
		return (await provider.findChangedFiles(options)).map((file) => resolve(options.root, file));
	} };
}

class VitestWatcher {
	vitest;
	/**
	* Modules that will be invalidated on the next run.
	*/
	invalidates = /* @__PURE__ */ new Set();
	/**
	* Test files that have changed and need to be rerun.
	*/
	changedTests = /* @__PURE__ */ new Set();
	_onRerun = [];
	constructor(vitest) {
		this.vitest = vitest;
	}
	/**
	* Register a handler that will be called when test files need to be rerun.
	* The callback can receive several files in case the changed file is imported by several test files.
	* Several invocations of this method will add multiple handlers.
	* @internal
	*/
	onWatcherRerun(cb) {
		this._onRerun.push(cb);
		return this;
	}
	close() {
		this.vitest.vite.watcher.close();
	}
	unregisterWatcher = noop$1;
	registerWatcher() {
		const watcher = this.vitest.vite.watcher;
		if (this.vitest.config.forceRerunTriggers.length) watcher.add(this.vitest.config.forceRerunTriggers);
		watcher.on("change", this.onFileChange);
		watcher.on("unlink", this.onFileDelete);
		watcher.on("add", this.onFileCreate);
		this.unregisterWatcher = () => {
			watcher.off("change", this.onFileChange);
			watcher.off("unlink", this.onFileDelete);
			watcher.off("add", this.onFileCreate);
			this.unregisterWatcher = noop$1;
		};
		return this;
	}
	scheduleRerun(file) {
		this._onRerun.forEach((cb) => cb(file));
	}
	getTestFilesFromWatcherTrigger(id) {
		if (!this.vitest.config.watchTriggerPatterns) return false;
		let triggered = false;
		this.vitest.config.watchTriggerPatterns.forEach((definition) => {
			const exec = definition.pattern.exec(id);
			if (exec) {
				const files = definition.testsToRun(id, exec);
				if (Array.isArray(files)) {
					triggered = true;
					files.forEach((file) => this.changedTests.add(resolve(this.vitest.config.root, file)));
				} else if (typeof files === "string") {
					triggered = true;
					this.changedTests.add(resolve(this.vitest.config.root, files));
				}
			}
		});
		return triggered;
	}
	onFileChange = (id) => {
		id = slash(id);
		this.vitest.logger.clearHighlightCache(id);
		this.vitest.invalidateFile(id);
		if (this.getTestFilesFromWatcherTrigger(id)) this.scheduleRerun(id);
		else if (this.handleFileChanged(id)) this.scheduleRerun(id);
	};
	onFileDelete = (id) => {
		id = slash(id);
		this.vitest.logger.clearHighlightCache(id);
		this.invalidates.add(id);
		if (this.vitest.state.filesMap.has(id)) {
			this.vitest.projects.forEach((project) => project._removeCachedTestFile(id));
			this.vitest.state.filesMap.delete(id);
			this.vitest.cache.results.removeFromCache(id);
			this.vitest.cache.stats.removeStats(id);
			this.changedTests.delete(id);
			this.vitest.report("onTestRemoved", id);
		}
	};
	onFileCreate = (id) => {
		id = slash(id);
		this.vitest.invalidateFile(id);
		if (this.getTestFilesFromWatcherTrigger(id)) {
			this.scheduleRerun(id);
			return;
		}
		let fileContent;
		const matchingProjects = [];
		this.vitest.projects.forEach((project) => {
			if (project.matchesTestGlob(id, () => fileContent ??= readFileSync(id, "utf-8"))) matchingProjects.push(project);
		});
		if (matchingProjects.length > 0) {
			this.changedTests.add(id);
			this.scheduleRerun(id);
		} else if (this.handleFileChanged(id)) this.scheduleRerun(id);
	};
	handleSetupFile(filepath) {
		let isSetupFile = false;
		this.vitest.projects.forEach((project) => {
			if (!project.config.setupFiles.includes(filepath)) return;
			this.vitest.state.filesMap.forEach((files) => {
				files.forEach((file) => {
					if (file.projectName === project.name) {
						isSetupFile = true;
						this.changedTests.add(file.filepath);
					}
				});
			});
		});
		return isSetupFile;
	}
	/**
	* @returns A value indicating whether rerun is needed (changedTests was mutated)
	*/
	handleFileChanged(filepath) {
		if (this.changedTests.has(filepath) || this.invalidates.has(filepath)) return false;
		if (pm.isMatch(filepath, this.vitest.config.forceRerunTriggers)) {
			this.vitest.state.getFilepaths().forEach((file) => this.changedTests.add(file));
			return true;
		}
		if (this.handleSetupFile(filepath)) return true;
		const projects = this.vitest.projects.filter((project) => {
			return project._getViteEnvironments().some(({ moduleGraph }) => {
				return moduleGraph.getModulesByFile(filepath)?.size;
			});
		});
		if (!projects.length) {
			// if there are no modules it's possible that server was restarted
			// we don't have information about importers anymore, so let's check if the file is a test file at least
			if (this.vitest.state.filesMap.has(filepath) || this.vitest.projects.some((project) => project._isCachedTestFile(filepath))) {
				this.changedTests.add(filepath);
				return true;
			}
			return false;
		}
		const files = [];
		for (const project of projects) {
			const environmentMods = project._getViteEnvironments().map(({ moduleGraph }) => moduleGraph.getModulesByFile(filepath));
			if (!environmentMods.length) continue;
			this.invalidates.add(filepath);
			// one of test files that we already run, or one of test files that we can run
			if (this.vitest.state.filesMap.has(filepath) || project._isCachedTestFile(filepath)) {
				this.changedTests.add(filepath);
				files.push(filepath);
				continue;
			}
			let rerun = false;
			for (const mods of environmentMods) for (const mod of mods || []) mod.importers.forEach((i) => {
				if (!i.file) return;
				if (this.handleFileChanged(i.file)) rerun = true;
			});
			if (rerun) files.push(filepath);
		}
		return !!files.length;
	}
}

const WATCHER_DEBOUNCE = 100;
class Vitest {
	/**
	* Current Vitest version.
	* @example '2.0.0'
	*/
	version = version$1;
	static version = version$1;
	/**
	* The logger instance used to log messages. It's recommended to use this logger instead of `console`.
	* It's possible to override stdout and stderr streams when initiating Vitest.
	* @example
	* new Vitest({
	*   stdout: new Writable(),
	* })
	*/
	logger;
	/**
	* The package installer instance used to install Vitest packages.
	* @example
	* await vitest.packageInstaller.ensureInstalled('@vitest/browser', process.cwd())
	*/
	packageInstaller;
	/**
	* A path to the built Vitest directory. This is usually a folder in `node_modules`.
	*/
	distPath = distDir;
	/**
	* A list of projects that are currently running.
	* If projects were filtered with `--project` flag, they won't appear here.
	*/
	projects = [];
	/**
	* A watcher handler. This is not the file system watcher. The handler only
	* exposes methods to handle changed files.
	*
	* If you have your own watcher, you can use these methods to replicate
	* Vitest behaviour.
	*/
	watcher;
	/**
	* The version control system provider used to detect changed files.
	* This is used with the `--changed` flag to determine which test files to run.
	* By default, Vitest uses Git. You can provide a custom implementation via
	* `experimental.vcsProvider` in your config.
	*/
	vcs;
	// these values are set after the config is resolved,
	// but Vitest instance is not accessible anywhere before that
	/**
	* The global config.
	*/
	config;
	/**
	* Resolved global vite config.
	*/
	viteConfig;
	/**
	* Global Vite's dev server instance.
	*/
	vite;
	/**
	* The global test state manager.
	* @experimental The State API is experimental and not subject to semver.
	*/
	state;
	/**
	* The global snapshot manager. You can access the current state on `snapshot.summary`.
	*/
	snapshot;
	/**
	* Test results and test file stats cache. Primarily used by the sequencer to sort tests.
	*/
	cache;
	/** @internal */ configOverride = {};
	/** @internal */ filenamePattern;
	/** @internal */ runningPromise;
	/** @internal */ closingPromise;
	/** @internal */ cancelPromise;
	/** @internal */ isCancelling = false;
	/** @internal */ coreWorkspaceProject;
	/**
	* When the root config is itself browser-enabled (no `projects`), the root
	* Vite server is the single browser server and this is its parent browser
	* project (assigned to `coreWorkspaceProject._parentBrowser`).
	* @internal
	*/
	_rootBrowserParent;
	/** @internal */ _browserSessions = new BrowserSessions();
	/** @internal */ reporters = [];
	/** @internal */ runner;
	/** @internal */ _testRun;
	/** @internal */ _resolver;
	/** @internal */ _fetcher;
	/** @internal */ _fsCache;
	/** @internal */ _tmpDir = join(tmpdir(), nanoid());
	/** @internal */ _traces;
	/** @internal */ _harness;
	/** @internal */ _exitTimeout;
	_warnedExperimentalCacheKeyGenerator = false;
	isFirstRun = true;
	restartsCount = 0;
	specifications;
	pool;
	_coverageProvider;
	/**
	* @deprecated Do not rely on this property, it's always `test`. Scheduled to be removed in the next major.
	*/
	mode = "test";
	constructor(harness, viteConfig) {
		this._harness = harness;
		this.viteConfig = viteConfig;
		this.config = viteConfig.test;
		this.logger = harness.logger.setVitest(this);
		this.packageInstaller = harness.packageInstaller;
		this.specifications = new VitestSpecifications(this);
		this.watcher = new VitestWatcher(this).onWatcherRerun((file) => this.scheduleRerun(file));
		harness.setVitest(this);
		this._testRun = new TestRun(this);
	}
	_onRestartListeners = [];
	_onClose = [];
	_onSetServer = [];
	_onCancelListeners = /* @__PURE__ */ new Set();
	_onUserTestsRerun = [];
	_onFilterWatchedSpecification = [];
	/**
	* @internal
	*/
	async _start(config) {
		this._setRootConfig(config);
		await this._attachRootServer();
		await this._attachProjectServers();
	}
	/**
	* @internal
	*/
	_setRootConfig(config) {
		this.watcher.unregisterWatcher();
		clearTimeout(this._rerunTimer);
		this.restartsCount += 1;
		this.pool?.close?.();
		this.pool = void 0;
		this.closingPromise = void 0;
		this.projects = [];
		this.runningPromise = void 0;
		this.coreWorkspaceProject = void 0;
		this._rootBrowserParent = void 0;
		this.specifications.clearCache();
		this._coverageProvider = void 0;
		this._onUserTestsRerun = [];
		this.viteConfig = config;
		this.config = config.test;
		const resolved = config.test;
		this.state = new StateManager({ onUnhandledError: resolved.onUnhandledError });
		this.cache = new VitestCache(this.logger);
		const otelSdkPath = this.config.experimental.openTelemetry?.sdkPath;
		this._traces = new Traces({
			enabled: !!this.config.experimental.openTelemetry?.enabled,
			sdkPath: otelSdkPath,
			watchMode: this.config.watch
		});
		this._fsCache = new FileSystemModuleCache(this);
		this.snapshot = new SnapshotManager({ ...resolved.snapshotOptions });
		this._resolver = new VitestResolver(this.viteConfig.cacheDir, resolved);
		this._fetcher = createFetchModuleFunction(this._resolver, resolved, this._fsCache, this._traces, this._tmpDir);
	}
	_restartPromise;
	_restartQueued = false;
	// Restarts must not overlap: chokidar regularly delivers several change
	// events for one edit, and a restart that starts while another is still
	// re-creating the servers reports `onServerRestart` to reporters that were
	// re-instantiated but not yet initialized.
	_restart(reason) {
		if (this._restartPromise) {
			this._restartQueued = true;
			return this._restartPromise;
		}
		this._restartPromise = (async () => {
			do {
				this._restartQueued = false;
				await this._restartNow(reason);
			} while (this._restartQueued);
		})().finally(() => {
			this._restartPromise = void 0;
		});
		return this._restartPromise;
	}
	async _restartNow(reason) {
		await Promise.all(this._onRestartListeners.map((fn) => fn(reason)));
		this.report("onServerRestart", reason);
		await this.close();
		// reuse the same browser ports as the previous run instead of letting the
		// reused harness keep incrementing them
		this._harness._browserLastPort = defaultBrowserPort;
		// harness mimics `vitest` access like in `node/create.ts`
		this._harness.setVitest(void 0);
		const config = await resolveConfig$1(this.config.cliOptions, this.config.viteOverrides, this._harness);
		this._harness.setVitest(this);
		await this._start(config);
	}
	/**
	* @internal
	*/
	async _attachRootServer() {
		const resolved = this.config;
		const children = resolved.resolvedProjects.filter((entry) => entry.viteConfig === this.viteConfig);
		// For a root-level browser config (no `projects`) this builds the single
		// browser server; otherwise it just creates the Vite server.
		const { server, parent } = await createClusterServer(this, this.viteConfig, resolved, children);
		this.vite = server;
		this._rootBrowserParent = parent;
		const environment = server.environments.__vitest__;
		this.runner = resolved.experimental.viteModuleRunner === false ? new NativeModuleRunner(resolved.root) : new ServerModuleRunner(environment, this._fetcher, resolved);
		this.vcs = await loadVCSProvider(this.runner, resolved.experimental.vcsProvider);
		if (resolved.watch) {
			this.watcher.registerWatcher();
			// hijack server restart — re-run the full pipeline rather than letting
			// Vite recreate the server in isolation, so Vitest's own resolution
			// re-runs too.
			server.restart = async () => {
				await this._restart();
			};
			// container configs have no Vite server (and might be outside the root),
			// so their files are watched explicitly
			if (resolved._containerConfigFiles?.length) server.watcher.add(resolved._containerConfigFiles);
			// since we set `server.hmr: false`, Vite does not auto restart itself
			server.watcher.on("change", async (file) => {
				file = normalize(file);
				if (file === server.config.configFile || this.projects.some((p) => p.vite.config.configFile === file) || this.config._containerConfigFiles?.includes(file))
 // a floating rejection in an event handler would crash the process
				await this._restart("config").catch((error) => {
					this.logger.printError(error, {
						fullStack: true,
						type: "Restart Error"
					});
				});
			});
		}
		// In run mode we don't need the watcher; closing it improves performance (#415).
		if (!resolved.watch) await server.watcher.close();
		this.cache.results.setConfig(resolved.root, resolved.cache);
		try {
			await this.cache.results.readFromCache();
		} catch {}
	}
	/** @internal */
	async _attachProjectServers() {
		const resolved = this.config;
		const entries = resolved.resolvedProjects || [];
		this.projects = await attachProjectsFromEntries(this, entries);
		// `--benchmark` (CLI `benchmarkOnly`) narrows `vitest.projects` to only
		// the benchmark variants produced by the benchmark expansion step.
		if (resolved.cliOptions.benchmarkOnly) this.projects = this.projects.filter((p) => p.config.benchmark.enabled);
		await Promise.all(this.projects.flatMap((project) => {
			return project.vite.config.getSortedPluginHooks("configureVitest").map((hook) => hook({
				project,
				vitest: this,
				injectTestProjects: this.injectTestProject,
				defineCacheKeyGenerator: (callback) => this._fsCache.defineCacheKeyGenerator(callback),
				/**
				* @deprecated Use `defineCacheKeyGenerator` instead.
				*/
				experimental_defineCacheKeyGenerator: (callback) => {
					if (!this._warnedExperimentalCacheKeyGenerator) {
						this._warnedExperimentalCacheKeyGenerator = true;
						this.logger.deprecate("`experimental_defineCacheKeyGenerator` is deprecated. Use `defineCacheKeyGenerator` instead.");
					}
					this._fsCache.defineCacheKeyGenerator(callback);
				}
			}));
		}));
		if (resolved.cliOptions.browser?.enabled) {
			if (!this.projects.filter((p) => p.config.browser.enabled).length) throw new Error(`Vitest received --browser flag, but no project had a browser configuration.`);
		}
		if (!this.projects.length) {
			const filter = toArray(resolved.project).join("\", \"");
			if (filter) throw new Error(`No projects matched the filter "${filter}".`);
			else {
				let error = `Vitest wasn't able to resolve any project.`;
				if (resolved.browser.enabled && !resolved.browser.instances?.length) error += ` Please, check that you specified the "browser.instances" option.`;
				throw new Error(error);
			}
		}
		if (!this.coreWorkspaceProject) this.coreWorkspaceProject = TestProject._createBasicProject(this);
		if (resolved.testNamePattern) this.configOverride.testNamePattern = resolved.testNamePattern;
		// populate will merge all configs into every project,
		// we don't want that when just listing tags
		if (!resolved.listTags) populateProjectsTags(this.coreWorkspaceProject, this.projects);
		this.reporters = await createReporters(resolved.reporters, this);
		// API setup (watch mode only). Must run after the reporters array is built
		// above, since `setup()` appends the UI/API WebSocket reporter to it. For a
		// root-level browser server the API lives on the same shared httpServer and
		// is only needed when a UI (Vitest dashboard or browser orchestrator) is served.
		const apiNeeded = !this._rootBrowserParent || resolved.ui || resolved.browser.ui;
		const rootApi = resolved.api && resolved.watch && apiNeeded;
		if (rootApi) setup(this);
		const attachedApiServers = /* @__PURE__ */ new Set([rootApi ? this.vite.httpServer : null]);
		for (const project of this.projects) {
			const browserServer = project.vite;
			if (project.config.browser.ui && browserServer?.httpServer && !attachedApiServers.has(browserServer.httpServer)) {
				attachedApiServers.add(browserServer.httpServer);
				setup(this, browserServer);
			}
		}
		await this._fsCache.ensureCacheIntegrity();
		await Promise.all([...this._onSetServer.map((fn) => fn()), this._traces.waitInit()]);
	}
	/** @internal */
	get coverageProvider() {
		if (this.configOverride.coverage?.enabled === false) return null;
		return this._coverageProvider;
	}
	async listTags() {
		const listTags = this.config.listTags;
		if (typeof listTags === "boolean") this.logger.printTags();
		else if (listTags === "json") if (![this.getRootProject(), ...this.projects].some((p) => p.config.tags && p.config.tags.length > 0)) {
			process.exitCode = 1;
			this.logger.printNoTestTagsFound();
		} else {
			const manifest = {
				tags: this.config.tags,
				projects: this.projects.filter((p) => p !== this.coreWorkspaceProject).map((p) => ({
					name: p.name,
					tags: p.config.tags
				}))
			};
			this.logger.log(JSON.stringify(manifest, null, 2));
		}
		else throw new Error(`Unknown value for "test.listTags": ${listTags}`);
	}
	async enableCoverage() {
		this.configOverride.coverage = {};
		this.configOverride.coverage.enabled = true;
		await this.createCoverageProvider();
		await this.coverageProvider?.onEnabled?.();
		// onFileTransform is the only thing that affects hash
		if (this.coverageProvider?.onFileTransform) this.clearAllCachePaths();
	}
	disableCoverage() {
		this.configOverride.coverage ??= {};
		this.configOverride.coverage.enabled = false;
		// onFileTransform is the only thing that affects hash
		if (this.coverageProvider?.onFileTransform) this.clearAllCachePaths();
	}
	clearAllCachePaths() {
		this.projects.forEach(({ vite }) => {
			Object.values(vite.environments).forEach((environment) => this._fsCache.invalidateAllCachePaths(environment));
		});
	}
	_coverageOverrideCache = /* @__PURE__ */ new WeakMap();
	/** @internal */
	get _coverageOptions() {
		if (!this.configOverride.coverage) return this.config.coverage;
		if (!this._coverageOverrideCache.has(this.configOverride.coverage)) {
			const coverage = deepClone(this.config.coverage);
			const options = deepMerge(coverage, this.configOverride.coverage);
			this._coverageOverrideCache.set(this.configOverride.coverage, options);
		}
		return this._coverageOverrideCache.get(this.configOverride.coverage);
	}
	/**
	* Inject new test projects into the workspace.
	* @param config Glob, config path or a custom config options.
	* @returns An array of new test projects. Can be empty if the name was filtered out.
	*/
	injectTestProject = async (config) => {
		const projects = await resolveAndAttachProjects(this._harness, Array.isArray(config) ? config : [config]);
		this.projects.push(...projects);
		return projects;
	};
	/**
	* Provide a value to the test context. This value will be available to all tests with `inject`.
	*/
	provide = (key, value) => {
		this.getRootProject().provide(key, value);
	};
	/**
	* Get global provided context.
	*/
	getProvidedContext() {
		return this.getRootProject().getProvidedContext();
	}
	/** @internal */
	_ensureRootProject() {
		if (this.coreWorkspaceProject) return this.coreWorkspaceProject;
		this.coreWorkspaceProject = TestProject._createBasicProject(this);
		return this.coreWorkspaceProject;
	}
	/**
	* Return project that has the root (or "global") config.
	*/
	getRootProject() {
		if (!this.coreWorkspaceProject) throw new Error(`Root project is not initialized. This means that the Vite server was not established yet and the the workspace config is not resolved.`);
		return this.coreWorkspaceProject;
	}
	get serializedRootConfig() {
		return {
			...this.getRootProject().serializedConfig,
			projects: this.projects.map((project) => project.serializedConfig)
		};
	}
	getProjectByName(name) {
		const project = this.projects.find((p) => p.name === name) || this.coreWorkspaceProject || this.projects[0];
		if (!project) throw new Error(`Project "${name}" was not found.`);
		return project;
	}
	/**
	* Import a file using Vite module runner. The file will be transformed by Vite and executed in a separate context.
	* @param moduleId The ID of the module in Vite module graph
	*/
	import(moduleId) {
		return this.runner.import(moduleId);
	}
	/**
	* Creates a coverage provider if `coverage` is enabled in the config.
	*/
	async createCoverageProvider() {
		if (this._coverageProvider) return this._coverageProvider;
		const coverageProvider = await this.initCoverageProvider();
		if (coverageProvider) await coverageProvider.clean(this._coverageOptions.clean);
		return coverageProvider || null;
	}
	/**
	* Glob test files in every project and create a TestSpecification for each file and pool.
	* @param filters String filters to match the test files.
	*/
	async globTestSpecifications(filters = []) {
		return this.specifications.globTestSpecifications(filters);
	}
	async initCoverageProvider() {
		if (this._coverageProvider != null) return;
		const coverageConfig = this.configOverride.coverage ? this.getRootProject().serializedConfig.coverage : this.config.coverage;
		this._coverageProvider = await getCoverageProvider(coverageConfig, this.runner);
		if (this._coverageProvider) {
			await this._coverageProvider.initialize(this);
			this.config.coverage = this._coverageProvider.resolveOptions();
		}
		return this._coverageProvider;
	}
	/**
	* @deprecated Use `clearCache` instead.
	*/
	experimental_clearCache() {
		this.logger.deprecate(`The "experimental_clearCache" method is deprecated. Use "clearCache" instead.`);
		return this.clearCache();
	}
	/**
	* Deletes all Vitest caches, including the `fsModuleCache`.
	*/
	async clearCache() {
		await this.cache.results.clearCache();
		await this._fsCache.clearCache();
	}
	/**
	* Merge reports from multiple runs located in the specified directory (value from `--merge-reports` if not specified).
	*/
	async mergeReports(directory) {
		return this._traces.$("vitest.merge_reports", async () => {
			if (this.reporters.some((r) => r instanceof BlobReporter)) throw new Error("Cannot merge reports when `--reporter=blob` is used. Remove blob reporter from the config first.");
			const { files, errors, coverages, executionTimes } = await readBlobs(this.version, directory || this.config.mergeReports, this.projects);
			this.state.blobs = {
				files,
				errors,
				coverages,
				executionTimes
			};
			await this.report("onInit", this);
			const specifications = [];
			for (const file of files) {
				const specification = this.getProjectByName(file.projectName || "").createSpecification(file.filepath, void 0, file.pool, file.id);
				specifications.push(specification);
			}
			await this._testRun.start(specifications);
			await this.coverageProvider?.onTestRunStart?.();
			for (const file of files) await this._reportFileTask(file);
			// append errors thrown during reporter event replay during merge reports
			const unhandledErrors = [...errors, ...this.state.getUnhandledErrors()];
			this._checkUnhandledErrors(unhandledErrors);
			await this._testRun.end(specifications, unhandledErrors);
			await this.initCoverageProvider();
			await this.coverageProvider?.mergeReports?.(coverages);
			return {
				testModules: this.state.getTestModules(),
				unhandledErrors: this.state.getUnhandledErrors()
			};
		});
	}
	/**
	* Returns the seed, if tests are running in a random order.
	*/
	getSeed() {
		return this.config.sequence.sequencer === RandomSequencer || !!this.config.sequence.shuffle || this.projects.some((p) => !!p.config.sequence.shuffle) ? this.config.sequence.seed : null;
	}
	/** @internal */
	async _reportFileTask(file) {
		const project = this.getProjectByName(file.projectName || "");
		await this._testRun.enqueued(project, file).catch((error) => {
			this.state.catchError(serializeValue(error), "Unhandled Reporter Error");
		});
		await this._testRun.collected(project, [file]).catch((error) => {
			this.state.catchError(serializeValue(error), "Unhandled Reporter Error");
		});
		const logs = [];
		const { packs, events } = convertTasksToEvents(file, (task) => {
			if (task.logs) logs.push(...task.logs);
		});
		logs.sort((log1, log2) => log1.time - log2.time);
		for (const log of logs) await this._testRun.log(log).catch((error) => {
			this.state.catchError(serializeValue(error), "Unhandled Reporter Error");
		});
		await this._testRun.updated(packs, events).catch((error) => {
			this.state.catchError(serializeValue(error), "Unhandled Reporter Error");
		});
	}
	async collect(filters, options = {}) {
		return this._traces.$("vitest.collect", async (collectSpan) => {
			const filenamePattern = filters && filters?.length > 0 ? filters : [];
			collectSpan.setAttribute("vitest.collect.filters", filenamePattern);
			const files = await this._traces.$("vitest.config.resolve_include_glob", async () => {
				const specifications = await this.specifications.getRelevantTestSpecifications(filters);
				collectSpan.setAttribute("vitest.collect.specifications", specifications.map((s) => {
					const relativeModuleId = relative(s.project.config.root, s.moduleId);
					if (s.project.name) return `|${s.project.name}| ${relativeModuleId}`;
					return relativeModuleId;
				}));
				return specifications;
			});
			// if run with --changed, don't exit if no tests are found
			if (!files.length) return {
				testModules: [],
				unhandledErrors: []
			};
			if (options.staticParse !== false) {
				const testModules = await this.parseSpecifications(files, { concurrency: options.staticParseConcurrency });
				if (hasFailed(testModules.map((testModule) => testModule.task))) process.exitCode = 1;
				return {
					testModules,
					unhandledErrors: []
				};
			}
			return this.collectTests(files);
		});
	}
	/**
	* Returns the list of test files that match the config and filters.
	* @param filters String filters to match the test files
	*/
	getRelevantTestSpecifications(filters) {
		return this.specifications.getRelevantTestSpecifications(filters);
	}
	/**
	* Initialize reporters, the coverage provider, and run tests.
	* This method can throw an error:
	*   - `FilesNotFoundError` if no tests are found
	*   - `GitNotFoundError` if `--related` flag is used, but git repository is not initialized
	*   - `Error` from the user reporters
	* @param filters String filters to match the test files
	*/
	async start(filters) {
		return this._traces.$("vitest.start", { context: this._traces.getContextFromEnv(process.env) }, async (startSpan) => {
			startSpan.setAttributes({ config: this.vite.config.configFile });
			try {
				await this._traces.$("vitest.coverage.init", async () => {
					await this.initCoverageProvider();
					await this.coverageProvider?.clean(this._coverageOptions.clean);
				});
			} finally {
				await this.report("onInit", this);
			}
			this.filenamePattern = filters && filters?.length > 0 ? filters : void 0;
			startSpan.setAttribute("vitest.start.filters", this.filenamePattern || []);
			let specifications = await this._traces.$("vitest.config.resolve_include_glob", async () => {
				const specifications = await this.specifications.getRelevantTestSpecifications(filters);
				startSpan.setAttribute("vitest.start.specifications", specifications.map((s) => {
					const relativeModuleId = relative(s.project.config.root, s.moduleId);
					if (s.project.name) return `|${s.project.name}| ${relativeModuleId}`;
					return relativeModuleId;
				}));
				return specifications;
			});
			if (this.config.experimental.preParse) {
				// This populates specification.testModule with parsed information
				await this.parseSpecifications(specifications);
				specifications = specifications.filter(({ testModule }) => {
					return !testModule || testModule.task.mode !== "skip";
				});
			}
			// if run with --changed, don't exit if no tests are found
			if (!specifications.length) {
				await this._traces.$("vitest.test_run", async () => {
					await this._testRun.start([]);
					await this.coverageProvider?.onTestRunStart?.();
					const coverage = await this.coverageProvider?.generateCoverage?.({ allTestsRun: true });
					await this._testRun.end([], [], coverage);
					// Report coverage for uncovered files
					await this.reportCoverage(coverage, true);
				});
				if (!this.config.watch || !(this.config.changed || this.config.related?.length)) throw new FilesNotFoundError();
			}
			let testModules = {
				testModules: [],
				unhandledErrors: []
			};
			if (specifications.length) {
				// populate once, update cache on watch
				await this.cache.stats.populateStats(this.config.root, specifications);
				testModules = await this.runFiles(specifications, true);
			}
			if (this.config.watch) await this.report("onWatcherStart");
			return testModules;
		});
	}
	/**
	* @deprecated use `standalone()` instead
	*/
	init() {
		this.logger.deprecate("`vitest.init()` is deprecated. Use `vitest.standalone()` instead.");
		return this.standalone();
	}
	/**
	* Initialize reporters and the coverage provider. This method doesn't run any tests.
	* If the `--watch` flag is provided, Vitest will still run changed tests even if this method was not called.
	*/
	async standalone() {
		await this._traces.$("vitest.init", async () => {
			try {
				await this.initCoverageProvider();
				await this.coverageProvider?.clean(this._coverageOptions.clean);
			} finally {
				await this.report("onInit", this);
			}
			// populate test files cache so watch mode can trigger a file rerun
			await this.globTestSpecifications();
			await Promise.all(this.projects.map((project) => project._standalone()));
			if (this.config.watch) await this.report("onWatcherStart");
		});
	}
	/**
	* If there is a test run happening, returns a promise that will
	* resolve when the test run is finished.
	*/
	async waitForTestRunEnd() {
		if (!this.runningPromise) return;
		await this.runningPromise;
	}
	/**
	* Get test specifications associated with the given module. If module is not a test file, an empty array is returned.
	*
	* **Note:** this method relies on a cache generated by `globTestSpecifications`. If the file was not processed yet, use `project.matchesGlobPattern` instead.
	* @param moduleId The module ID to get test specifications for.
	*/
	getModuleSpecifications(moduleId) {
		return this.specifications.getModuleSpecifications(moduleId);
	}
	/**
	* Vitest automatically caches test specifications for each file. This method clears the cache for the given file or the whole cache altogether.
	*/
	clearSpecificationsCache(moduleId) {
		this.specifications.clearCache(moduleId);
		if (!moduleId) this.projects.forEach((project) => {
			project.testFilesList = null;
		});
	}
	/**
	* Run tests for the given test specifications. This does not trigger `onWatcher*` events.
	* @param specifications A list of specifications to run.
	* @param allTestsRun Indicates whether all tests were run. This only matters for coverage.
	*/
	runTestSpecifications(specifications, allTestsRun = false) {
		specifications.forEach((spec) => this.specifications.ensureSpecificationCached(spec));
		return this.runFiles(specifications, allTestsRun);
	}
	/**
	* Runs tests for the given file paths. This does not trigger `onWatcher*` events.
	* @param filepaths A list of file paths to run tests for.
	* @param allTestsRun Indicates whether all tests were run. This only matters for coverage.
	*/
	async runTestFiles(filepaths, allTestsRun = false) {
		const specifications = await this.specifications.getRelevantTestSpecifications(filepaths);
		if (!specifications.length) return {
			testModules: [],
			unhandledErrors: []
		};
		return this.runFiles(specifications, allTestsRun);
	}
	/**
	* Rerun files and trigger `onWatcherRerun`, `onWatcherStart` and `onTestsRerun` events.
	* @param specifications A list of specifications to run.
	* @param allTestsRun Indicates whether all tests were run. This only matters for coverage.
	*/
	async rerunTestSpecifications(specifications, allTestsRun = false) {
		const files = specifications.map((spec) => spec.moduleId);
		await Promise.all([this.report("onWatcherRerun", files, "rerun test"), ...this._onUserTestsRerun.map((fn) => fn(specifications))]);
		const result = await this.runTestSpecifications(specifications, allTestsRun);
		await this.report("onWatcherStart", this.state.getFiles(files));
		return result;
	}
	async runFiles(specs, allTestsRun) {
		return this._traces.$("vitest.test_run", async () => {
			await this._testRun.start(specs);
			await this.coverageProvider?.onTestRunStart?.();
			// previous run
			await this.cancelPromise;
			await this.runningPromise;
			this._onCancelListeners.clear();
			this.isCancelling = false;
			// schedule the new run
			this.runningPromise = (async () => {
				try {
					if (!this.pool) this.pool = createPool(this);
					const invalidates = Array.from(this.watcher.invalidates);
					this.watcher.invalidates.clear();
					this.snapshot.clear();
					this.state.clearErrors();
					if (!this.isFirstRun && this._coverageOptions.cleanOnRerun) await this.coverageProvider?.clean();
					await this.initializeGlobalSetup(specs);
					try {
						await this.pool.runTests(specs, invalidates);
					} catch (err) {
						this.state.catchError(err, "Unhandled Error");
					}
					const files = this.state.getFiles();
					this.cache.results.updateResults(files);
					try {
						await this.cache.results.writeToCache();
					} catch {}
					return {
						testModules: this.state.getTestModules(),
						unhandledErrors: this.state.getUnhandledErrors()
					};
				} finally {
					const coverage = await this.coverageProvider?.generateCoverage({ allTestsRun });
					const errors = this.state.getUnhandledErrors();
					this._checkUnhandledErrors(errors);
					await this._testRun.end(specs, errors, coverage);
					await this.reportCoverage(coverage, allTestsRun);
				}
			})().finally(() => {
				this.runningPromise = void 0;
				this.isFirstRun = false;
				// all subsequent runs will treat this as a fresh run
				this.config.changed = false;
				this.config.related = void 0;
			});
			return await this.runningPromise;
		});
	}
	/**
	* Returns module's diagnostic. If `testModule` is not provided, `selfTime` and `totalTime` will be aggregated across all tests.
	*
	* If the module was not transformed or executed, the diagnostic will be empty.
	* @experimental
	* @see {@link https://vitest.dev/api/advanced/vitest#getsourcemodulediagnostic}
	*/
	async experimental_getSourceModuleDiagnostic(moduleId, testModule) {
		if (testModule) {
			const viteEnvironment = testModule.viteEnvironment;
			// if there is no viteEnvironment, it means the file did not run yet
			if (!viteEnvironment) return {
				modules: [],
				untrackedModules: []
			};
			const moduleLocations = await collectSourceModulesLocations(moduleId, viteEnvironment.moduleGraph);
			return collectModuleDurationsDiagnostic(moduleId, this.state, moduleLocations, testModule);
		}
		const environments = this.projects.flatMap((p) => {
			return Object.values(p.vite.environments);
		});
		const aggregatedLocationsResult = await Promise.all(environments.map((environment) => collectSourceModulesLocations(moduleId, environment.moduleGraph)));
		return collectModuleDurationsDiagnostic(moduleId, this.state, aggregatedLocationsResult.reduce((acc, locations) => {
			if (locations) {
				acc.modules.push(...locations.modules);
				acc.untracked.push(...locations.untracked);
			}
			return acc;
		}, {
			modules: [],
			untracked: []
		}));
	}
	/**
	* @deprecated Use `parseSpecifications` instead
	*/
	experimental_parseSpecifications(specifications, options) {
		this.logger.deprecate(`The "experimental_parseSpecifications" method is deprecated. Use "parseSpecifications" instead.`);
		return this.parseSpecifications(specifications, options);
	}
	async parseSpecifications(specifications, options) {
		const concurrency = options?.concurrency ?? (typeof os__default.availableParallelism === "function" ? os__default.availableParallelism() : os__default.cpus().length);
		const limit = limitConcurrency(concurrency);
		// Phase 1: parse all files in parallel (without mode interpretation)
		const results = await Promise.all(specifications.map((specification) => limit(async () => {
			return {
				file: await astCollectTests(specification.project, specification.moduleId).catch((error) => {
					return createFailedFileTask(specification.project, specification.moduleId, error);
				}),
				specification
			};
		})));
		const tagsFilter = this.config.tagsFilter ? createTagsFilter(this.config.tagsFilter, this.config.tags) : void 0;
		// Phase 2: cross-file .only resolution
		const globalHasOnly = results.some(({ file }) => !!file.containsOnly);
		for (const { file, specification } of results) {
			const config = specification.project.config;
			interpretTaskModes(file, config.testNamePattern, specification.testLines, specification.testIds, tagsFilter, globalHasOnly, false, config.allowOnly);
			this.state.collectFiles(specification.project, [file]);
		}
		return results.map(({ file }) => this.state.getReportedEntity(file));
	}
	async experimental_parseSpecification(specification) {
		const file = await astCollectTests(specification.project, specification.moduleId).catch((error) => {
			return createFailedFileTask(specification.project, specification.moduleId, error);
		});
		const config = specification.project.config;
		const hasOnly = !!file.containsOnly;
		const tagsFilter = this.config.tagsFilter ? createTagsFilter(this.config.tagsFilter, this.config.tags) : void 0;
		interpretTaskModes(file, config.testNamePattern, specification.testLines, specification.testIds, tagsFilter, hasOnly, false, config.allowOnly);
		// register in state, so it can be retrieved by "getReportedEntity"
		this.state.collectFiles(specification.project, [file]);
		return this.state.getReportedEntity(file);
	}
	/**
	* Collect tests in specified modules. Vitest will run the files to collect tests.
	* @param specifications A list of specifications to run.
	*/
	async collectTests(specifications) {
		const filepaths = specifications.map((spec) => spec.moduleId);
		this.state.collectPaths(filepaths);
		// previous run
		await this.cancelPromise;
		await this.runningPromise;
		this._onCancelListeners.clear();
		this.isCancelling = false;
		// schedule the new run
		this.runningPromise = (async () => {
			if (!this.pool) this.pool = createPool(this);
			const invalidates = Array.from(this.watcher.invalidates);
			this.watcher.invalidates.clear();
			this.snapshot.clear();
			this.state.clearErrors();
			await this.initializeGlobalSetup(specifications);
			try {
				await this.pool.collectTests(specifications, invalidates);
			} catch (err) {
				this.state.catchError(err, "Unhandled Error");
			}
			const files = this.state.getFiles();
			// can only happen if there was a syntax error in describe block
			// or there was an error importing a file
			if (hasFailed(files)) process.exitCode = 1;
			return {
				testModules: this.state.getTestModules(),
				unhandledErrors: this.state.getUnhandledErrors()
			};
		})().finally(() => {
			this.runningPromise = void 0;
			// all subsequent runs will treat this as a fresh run
			this.config.changed = false;
			this.config.related = void 0;
		});
		return await this.runningPromise;
	}
	/**
	* Gracefully cancel the current test run. Vitest will wait until all running tests are finished before cancelling.
	*/
	async cancelCurrentRun(reason) {
		this.isCancelling = true;
		this.cancelPromise = Promise.all(Array.from(this._onCancelListeners, (listener) => listener(reason)));
		await this.cancelPromise.finally(() => this.cancelPromise = void 0);
		await this.runningPromise;
	}
	async initializeGlobalSetup(paths) {
		const projects = new Set(paths.map((spec) => spec.project));
		const coreProject = this.getRootProject();
		if (!projects.has(coreProject)) projects.add(coreProject);
		for (const project of projects) await project._initializeGlobalSetup();
	}
	/** @internal */
	async rerunFiles(files = this.state.getFilepaths(), trigger, allTestsRun = true, resetTestNamePattern = false) {
		if (resetTestNamePattern) this.configOverride.testNamePattern = void 0;
		if (this.filenamePattern) {
			const filteredFiles = await this.globTestSpecifications(this.filenamePattern);
			files = files.filter((file) => filteredFiles.some((f) => f.moduleId === file));
		}
		const specifications = files.flatMap((file) => this.getModuleSpecifications(file));
		await Promise.all([this.report("onWatcherRerun", files, trigger), ...this._onUserTestsRerun.map((fn) => fn(specifications))]);
		const testResult = await this.runFiles(specifications, allTestsRun);
		await this.report("onWatcherStart", this.state.getFiles(files));
		return testResult;
	}
	/** @internal */
	async rerunTask(id) {
		const task = this.state.idMap.get(id);
		if (!task) throw new Error(`Task ${id} was not found`);
		const reportedTask = this.state.getReportedEntityById(id);
		if (!reportedTask) throw new Error(`Test specification for task ${id} was not found`);
		const specifications = [reportedTask.toTestSpecification()];
		await Promise.all([this.report("onWatcherRerun", [task.file.filepath], "tasks" in task ? "rerun suite" : "rerun test"), ...this._onUserTestsRerun.map((fn) => fn(specifications))]);
		await this.runFiles(specifications, false);
		await this.report("onWatcherStart", ["module" in reportedTask ? reportedTask.module.task : reportedTask.task]);
	}
	/** @internal */
	async changeProjectName(pattern) {
		if (pattern === "") this.config.cliOptions.project = void 0;
		else this.config.cliOptions.project = [pattern];
		await this.vite.restart();
	}
	/** @internal */
	async changeNamePattern(pattern, files = this.state.getFilepaths(), trigger) {
		// Empty test name pattern should reset filename pattern as well
		if (pattern === "") this.filenamePattern = void 0;
		const testNamePattern = pattern ? new RegExp(pattern) : void 0;
		this.configOverride.testNamePattern = testNamePattern;
		// filter only test files that have tests matching the pattern
		if (testNamePattern) files = files.filter((filepath) => {
			const files = this.state.getFiles([filepath]);
			return !files.length || files.some((file) => {
				const tasks = getTasks(file);
				return !tasks.length || tasks.some((task) => testNamePattern.test(task.name));
			});
		});
		await this.rerunFiles(files, trigger, pattern === "");
	}
	/** @internal */
	async changeFilenamePattern(pattern, files = this.state.getFilepaths()) {
		this.filenamePattern = pattern ? [pattern] : [];
		const trigger = this.filenamePattern.length ? "change filename pattern" : "reset filename pattern";
		await this.rerunFiles(files, trigger, pattern === "");
	}
	/** @internal */
	async rerunFailed() {
		await this.rerunFiles(this.state.getFailedFilepaths(), "rerun failed", false);
	}
	/**
	* Update snapshots in specified files. If no files are provided, it will update files with failed tests and obsolete snapshots.
	* @param files The list of files on the file system
	*/
	async updateSnapshot(files) {
		// default to failed files
		files = files || [...this.state.getFailedFilepaths(), ...this.snapshot.summary.uncheckedKeysByFile.map((s) => s.filePath)];
		this.enableSnapshotUpdate();
		try {
			return await this.rerunFiles(files, "update snapshot", false);
		} finally {
			this.resetSnapshotUpdate();
		}
	}
	/**
	* Enable the mode that allows updating snapshots when running tests.
	* This method doesn't run any tests.
	*
	* Every test that runs after this method is called will update snapshots.
	* To disable the mode, call `resetSnapshotUpdate`.
	*/
	enableSnapshotUpdate() {
		this.configOverride.snapshotOptions = {
			updateSnapshot: "all",
			// environment is resolved inside a worker thread
			snapshotEnvironment: null
		};
		this.snapshot.options.updateSnapshot = "all";
	}
	/**
	* Disable the mode that allows updating snapshots when running tests.
	*/
	resetSnapshotUpdate() {
		delete this.configOverride.snapshotOptions;
		this.snapshot.options.updateSnapshot = this.config.snapshotOptions.updateSnapshot;
	}
	/**
	* Set the global test name pattern to a regexp.
	* This method doesn't run any tests.
	*/
	setGlobalTestNamePattern(pattern) {
		if (pattern instanceof RegExp) this.configOverride.testNamePattern = pattern;
		else this.configOverride.testNamePattern = pattern ? new RegExp(pattern) : void 0;
	}
	/**
	* Returns the regexp used for the global test name pattern.
	*/
	getGlobalTestNamePattern() {
		if (this.configOverride.testNamePattern != null) return this.configOverride.testNamePattern;
		return this.config.testNamePattern;
	}
	/**
	* Resets the global test name pattern. This method doesn't run any tests.
	*/
	resetGlobalTestNamePattern() {
		this.configOverride.testNamePattern = void 0;
	}
	_rerunTimer;
	async scheduleRerun(triggerId) {
		const currentCount = this.restartsCount;
		clearTimeout(this._rerunTimer);
		await this.cancelPromise;
		await this.runningPromise;
		clearTimeout(this._rerunTimer);
		// server restarted
		if (this.restartsCount !== currentCount) return;
		this._rerunTimer = setTimeout(async () => {
			if (this.closingPromise) return;
			if (this.watcher.changedTests.size === 0) {
				this.watcher.invalidates.clear();
				return;
			}
			// server restarted
			if (this.restartsCount !== currentCount) return;
			this.isFirstRun = false;
			this.snapshot.clear();
			let files = Array.from(this.watcher.changedTests);
			if (this.filenamePattern) {
				const filteredFiles = await this.globTestSpecifications(this.filenamePattern);
				files = files.filter((file) => filteredFiles.some((f) => f.moduleId === file));
				// A file that does not match the current filename pattern was changed
				if (files.length === 0) return;
			}
			this.watcher.changedTests.clear();
			const triggerLabel = relative(this.config.root, triggerId);
			// get file specifications and filter them if needed
			const specifications = files.flatMap((file) => this.getModuleSpecifications(file)).filter((specification) => {
				if (this._onFilterWatchedSpecification.length === 0) return true;
				return this._onFilterWatchedSpecification.every((fn) => fn(specification));
			});
			await Promise.all([this.report("onWatcherRerun", files, triggerLabel), ...this._onUserTestsRerun.map((fn) => fn(specifications))]);
			await this.runFiles(specifications, false);
			await this.report("onWatcherStart", this.state.getFiles(files));
		}, WATCHER_DEBOUNCE);
	}
	/**
	* Invalidate a file in all projects.
	*/
	invalidateFile(filepath) {
		this.projects.forEach(({ vite }) => {
			Object.values(vite.environments).forEach((environment) => {
				const { moduleGraph } = environment;
				const modules = moduleGraph.getModulesByFile(filepath);
				if (!modules) return;
				modules.forEach((module) => {
					moduleGraph.invalidateModule(module);
					this._fsCache.invalidateCachePath(environment, module.id);
				});
			});
		});
	}
	/** @internal */
	_checkUnhandledErrors(errors) {
		if (errors.length && !this.config.dangerouslyIgnoreUnhandledErrors) process.exitCode = 1;
	}
	async reportCoverage(coverage, allTestsRun) {
		if (this.state.getCountOfFailedTests() > 0) {
			await this.coverageProvider?.onTestFailure?.();
			if (!this._coverageOptions.reportOnFailure) return;
		}
		if (this.coverageProvider) {
			await this.coverageProvider.reportCoverage(coverage, { allTestsRun });
			// notify builtin ui and html reporter after coverage html is generated
			for (const reporter of this.reporters) if ("onFinishedReportCoverage" in reporter && typeof reporter.onFinishedReportCoverage === "function") await reporter.onFinishedReportCoverage();
		}
	}
	/**
	* Closes all projects and their associated resources.
	* This can only be called once; the closing promise is cached until the server restarts.
	*/
	async close() {
		if (!this.closingPromise) this.closingPromise = (async () => {
			// let an in-flight (re)run settle instead of tearing down under it:
			// its file stats and transforms would race the teardown and reject
			// after the caller already cleaned up the test files
			clearTimeout(this._rerunTimer);
			await this.runningPromise?.catch(noop$1);
			const teardownProjects = [...this.projects];
			if (this.coreWorkspaceProject && !teardownProjects.includes(this.coreWorkspaceProject)) teardownProjects.push(this.coreWorkspaceProject);
			const teardownErrors = [];
			// do teardown before closing the server
			for (const project of teardownProjects.reverse()) await project._teardownGlobalSetup().catch((error) => {
				teardownErrors.push(error);
			});
			// close the pool (and the browser pages with it) BEFORE the Vite
			// servers: closing a server releases its port while automated pages may
			// still be alive — a page's websocket client would auto-reconnect onto
			// the next server that binds the same port and fail with "Unknown session id"
			if (this.pool) {
				try {
					await this.pool.close?.();
				} catch (error) {
					teardownErrors.push(error);
				}
				this.pool = void 0;
			}
			const closePromises = this.projects.map((w) => w.close());
			// close the core workspace server only once
			// it's possible that it's not initialized at all because it's not running any tests
			if (this.coreWorkspaceProject && !this.projects.includes(this.coreWorkspaceProject)) closePromises.push(this.coreWorkspaceProject.close().then(() => this.vite = void 0));
			closePromises.push(...this._onClose.map((fn) => fn()));
			await Promise.allSettled(closePromises).then((results) => {
				const errors = [...results.filter((r) => r.status === "rejected").map((r) => r.reason), ...teardownErrors];
				for (const error of errors) this.logger.error("error during close", error);
				this._checkUnhandledErrors(errors);
			});
			await this._traces?.finish();
		})();
		return this.closingPromise;
	}
	/**
	* Closes all projects and exit the process
	* @param force If true, the process will exit immediately after closing the projects.
	*/
	async exit(force = false) {
		clearTimeout(this._exitTimeout);
		this._exitTimeout = setTimeout(() => {
			this.report("onProcessTimeout").then(() => {
				console.warn(`close timed out after ${this.config.teardownTimeout}ms`);
				if (!this.pool) {
					const runningServers = [this.vite, ...this.projects.map((p) => p.vite)].filter(Boolean).length;
					if (runningServers === 1) console.warn("Tests closed successfully but something prevents Vite server from exiting");
					else if (runningServers > 1) console.warn(`Tests closed successfully but something prevents ${runningServers} Vite servers from exiting`);
					else console.warn("Tests closed successfully but something prevents the main process from exiting");
					if (!this.reporters.some((r) => r instanceof HangingProcessReporter)) console.warn("You can try to identify the cause by enabling \"hanging-process\" reporter. See https://vitest.dev/guide/reporters.html#hanging-process-reporter");
				}
				process.exit();
			});
		}, this.config.teardownTimeout);
		this._exitTimeout.unref();
		await this.close();
		if (force) process.exit();
	}
	/** @internal */
	async report(name, ...args) {
		await Promise.all(this.reporters.map((r) => r[name]?.(
			// @ts-expect-error let me go
			...args
		)));
	}
	/** @internal */
	async _globTestFilepaths() {
		const specifications = await this.globTestSpecifications();
		return Array.from(new Set(specifications.map((spec) => spec.moduleId)));
	}
	/**
	* Should the server be kept running after the tests are done.
	*/
	shouldKeepServer() {
		return !!this.config?.watch;
	}
	/**
	* Register a handler that will be called when the server is restarted due to a config change.
	*/
	onServerRestart(fn) {
		this._onRestartListeners.push(fn);
	}
	/**
	* Register a handler that will be called when the test run is cancelled with `vitest.cancelCurrentRun`.
	*/
	onCancel(fn) {
		this._onCancelListeners.add(fn);
		return () => {
			this._onCancelListeners.delete(fn);
		};
	}
	/**
	* Register a handler that will be called when the server is closed.
	*/
	onClose(fn) {
		this._onClose.push(fn);
	}
	/**
	* Register a handler that will be called when the tests are rerunning.
	*/
	onTestsRerun(fn) {
		this._onUserTestsRerun.push(fn);
	}
	/**
	* Register a handler that will be called when a file is changed.
	* This callback should return `true` of `false` indicating whether the test file needs to be rerun.
	* @example
	* const testsToRun = [resolve('./test.spec.ts')]
	* vitest.onFilterWatchedSpecification(specification => testsToRun.includes(specification.moduleId))
	*/
	onFilterWatchedSpecification(fn) {
		this._onFilterWatchedSpecification.push(fn);
	}
	/** @internal */
	onAfterSetServer(fn) {
		this._onSetServer.push(fn);
	}
	/**
	* Check if the project with a given name should be included.
	*/
	matchesProjectFilter(name) {
		const projects = this.config?.project || this.config.cliOptions?.project;
		return matchesProjectFilter(toArray(projects), name);
	}
	/**
	* Create a report that's scoped to a specific reporter directory.
	*/
	createReport(scope) {
		return createReport(this, scope);
	}
}

var prompts$2 = {};

var kleur;
var hasRequiredKleur;

function requireKleur () {
	if (hasRequiredKleur) return kleur;
	hasRequiredKleur = 1;

	const { FORCE_COLOR, NODE_DISABLE_COLORS, TERM } = process.env;

	const $ = {
		enabled: !NODE_DISABLE_COLORS && TERM !== 'dumb' && FORCE_COLOR !== '0',

		// modifiers
		reset: init(0, 0),
		bold: init(1, 22),
		dim: init(2, 22),
		italic: init(3, 23),
		underline: init(4, 24),
		inverse: init(7, 27),
		hidden: init(8, 28),
		strikethrough: init(9, 29),

		// colors
		black: init(30, 39),
		red: init(31, 39),
		green: init(32, 39),
		yellow: init(33, 39),
		blue: init(34, 39),
		magenta: init(35, 39),
		cyan: init(36, 39),
		white: init(37, 39),
		gray: init(90, 39),
		grey: init(90, 39),

		// background colors
		bgBlack: init(40, 49),
		bgRed: init(41, 49),
		bgGreen: init(42, 49),
		bgYellow: init(43, 49),
		bgBlue: init(44, 49),
		bgMagenta: init(45, 49),
		bgCyan: init(46, 49),
		bgWhite: init(47, 49)
	};

	function run(arr, str) {
		let i=0, tmp, beg='', end='';
		for (; i < arr.length; i++) {
			tmp = arr[i];
			beg += tmp.open;
			end += tmp.close;
			if (str.includes(tmp.close)) {
				str = str.replace(tmp.rgx, tmp.close + tmp.open);
			}
		}
		return beg + str + end;
	}

	function chain(has, keys) {
		let ctx = { has, keys };

		ctx.reset = $.reset.bind(ctx);
		ctx.bold = $.bold.bind(ctx);
		ctx.dim = $.dim.bind(ctx);
		ctx.italic = $.italic.bind(ctx);
		ctx.underline = $.underline.bind(ctx);
		ctx.inverse = $.inverse.bind(ctx);
		ctx.hidden = $.hidden.bind(ctx);
		ctx.strikethrough = $.strikethrough.bind(ctx);

		ctx.black = $.black.bind(ctx);
		ctx.red = $.red.bind(ctx);
		ctx.green = $.green.bind(ctx);
		ctx.yellow = $.yellow.bind(ctx);
		ctx.blue = $.blue.bind(ctx);
		ctx.magenta = $.magenta.bind(ctx);
		ctx.cyan = $.cyan.bind(ctx);
		ctx.white = $.white.bind(ctx);
		ctx.gray = $.gray.bind(ctx);
		ctx.grey = $.grey.bind(ctx);

		ctx.bgBlack = $.bgBlack.bind(ctx);
		ctx.bgRed = $.bgRed.bind(ctx);
		ctx.bgGreen = $.bgGreen.bind(ctx);
		ctx.bgYellow = $.bgYellow.bind(ctx);
		ctx.bgBlue = $.bgBlue.bind(ctx);
		ctx.bgMagenta = $.bgMagenta.bind(ctx);
		ctx.bgCyan = $.bgCyan.bind(ctx);
		ctx.bgWhite = $.bgWhite.bind(ctx);

		return ctx;
	}

	function init(open, close) {
		let blk = {
			open: `\x1b[${open}m`,
			close: `\x1b[${close}m`,
			rgx: new RegExp(`\\x1b\\[${close}m`, 'g')
		};
		return function (txt) {
			if (this !== void 0 && this.has !== void 0) {
				this.has.includes(open) || (this.has.push(open),this.keys.push(blk));
				return txt === void 0 ? this : $.enabled ? run(this.keys, txt+'') : txt+'';
			}
			return txt === void 0 ? chain([open], [blk]) : $.enabled ? run([blk], txt+'') : txt+'';
		};
	}

	kleur = $;
	return kleur;
}

var action$1;
var hasRequiredAction$1;

function requireAction$1 () {
	if (hasRequiredAction$1) return action$1;
	hasRequiredAction$1 = 1;

	action$1 = (key, isSelect) => {
	  if (key.meta && key.name !== 'escape') return;

	  if (key.ctrl) {
	    if (key.name === 'a') return 'first';
	    if (key.name === 'c') return 'abort';
	    if (key.name === 'd') return 'abort';
	    if (key.name === 'e') return 'last';
	    if (key.name === 'g') return 'reset';
	  }

	  if (isSelect) {
	    if (key.name === 'j') return 'down';
	    if (key.name === 'k') return 'up';
	  }

	  if (key.name === 'return') return 'submit';
	  if (key.name === 'enter') return 'submit'; // ctrl + J

	  if (key.name === 'backspace') return 'delete';
	  if (key.name === 'delete') return 'deleteForward';
	  if (key.name === 'abort') return 'abort';
	  if (key.name === 'escape') return 'exit';
	  if (key.name === 'tab') return 'next';
	  if (key.name === 'pagedown') return 'nextPage';
	  if (key.name === 'pageup') return 'prevPage'; // TODO create home() in prompt types (e.g. TextPrompt)

	  if (key.name === 'home') return 'home'; // TODO create end() in prompt types (e.g. TextPrompt)

	  if (key.name === 'end') return 'end';
	  if (key.name === 'up') return 'up';
	  if (key.name === 'down') return 'down';
	  if (key.name === 'right') return 'right';
	  if (key.name === 'left') return 'left';
	  return false;
	};
	return action$1;
}

var strip$1;
var hasRequiredStrip$1;

function requireStrip$1 () {
	if (hasRequiredStrip$1) return strip$1;
	hasRequiredStrip$1 = 1;

	strip$1 = str => {
	  const pattern = ['[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)', '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))'].join('|');
	  const RGX = new RegExp(pattern, 'g');
	  return typeof str === 'string' ? str.replace(RGX, '') : str;
	};
	return strip$1;
}

var src;
var hasRequiredSrc;

function requireSrc () {
	if (hasRequiredSrc) return src;
	hasRequiredSrc = 1;

	const ESC = '\x1B';
	const CSI = `${ESC}[`;
	const beep = '\u0007';

	const cursor = {
	  to(x, y) {
	    if (!y) return `${CSI}${x + 1}G`;
	    return `${CSI}${y + 1};${x + 1}H`;
	  },
	  move(x, y) {
	    let ret = '';

	    if (x < 0) ret += `${CSI}${-x}D`;
	    else if (x > 0) ret += `${CSI}${x}C`;

	    if (y < 0) ret += `${CSI}${-y}A`;
	    else if (y > 0) ret += `${CSI}${y}B`;

	    return ret;
	  },
	  up: (count = 1) => `${CSI}${count}A`,
	  down: (count = 1) => `${CSI}${count}B`,
	  forward: (count = 1) => `${CSI}${count}C`,
	  backward: (count = 1) => `${CSI}${count}D`,
	  nextLine: (count = 1) => `${CSI}E`.repeat(count),
	  prevLine: (count = 1) => `${CSI}F`.repeat(count),
	  left: `${CSI}G`,
	  hide: `${CSI}?25l`,
	  show: `${CSI}?25h`,
	  save: `${ESC}7`,
	  restore: `${ESC}8`
	};

	const scroll = {
	  up: (count = 1) => `${CSI}S`.repeat(count),
	  down: (count = 1) => `${CSI}T`.repeat(count)
	};

	const erase = {
	  screen: `${CSI}2J`,
	  up: (count = 1) => `${CSI}1J`.repeat(count),
	  down: (count = 1) => `${CSI}J`.repeat(count),
	  line: `${CSI}2K`,
	  lineEnd: `${CSI}K`,
	  lineStart: `${CSI}1K`,
	  lines(count) {
	    let clear = '';
	    for (let i = 0; i < count; i++)
	      clear += this.line + (i < count - 1 ? cursor.up() : '');
	    if (count)
	      clear += cursor.left;
	    return clear;
	  }
	};

	src = { cursor, scroll, erase, beep };
	return src;
}

var clear$1;
var hasRequiredClear$1;

function requireClear$1 () {
	if (hasRequiredClear$1) return clear$1;
	hasRequiredClear$1 = 1;

	function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike) { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

	function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

	function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }

	const strip = requireStrip$1();

	const _require = requireSrc(),
	      erase = _require.erase,
	      cursor = _require.cursor;

	const width = str => [...strip(str)].length;
	/**
	 * @param {string} prompt
	 * @param {number} perLine
	 */


	clear$1 = function (prompt, perLine) {
	  if (!perLine) return erase.line + cursor.to(0);
	  let rows = 0;
	  const lines = prompt.split(/\r?\n/);

	  var _iterator = _createForOfIteratorHelper(lines),
	      _step;

	  try {
	    for (_iterator.s(); !(_step = _iterator.n()).done;) {
	      let line = _step.value;
	      rows += 1 + Math.floor(Math.max(width(line) - 1, 0) / perLine);
	    }
	  } catch (err) {
	    _iterator.e(err);
	  } finally {
	    _iterator.f();
	  }

	  return erase.lines(rows);
	};
	return clear$1;
}

var figures_1$1;
var hasRequiredFigures$1;

function requireFigures$1 () {
	if (hasRequiredFigures$1) return figures_1$1;
	hasRequiredFigures$1 = 1;

	const main = {
	  arrowUp: '↑',
	  arrowDown: '↓',
	  arrowLeft: '←',
	  arrowRight: '→',
	  radioOn: '◉',
	  radioOff: '◯',
	  tick: '✔',
	  cross: '✖',
	  ellipsis: '…',
	  pointerSmall: '›',
	  line: '─',
	  pointer: '❯'
	};
	const win = {
	  arrowUp: main.arrowUp,
	  arrowDown: main.arrowDown,
	  arrowLeft: main.arrowLeft,
	  arrowRight: main.arrowRight,
	  radioOn: '(*)',
	  radioOff: '( )',
	  tick: '√',
	  cross: '×',
	  ellipsis: '...',
	  pointerSmall: '»',
	  line: '─',
	  pointer: '>'
	};
	const figures = process.platform === 'win32' ? win : main;
	figures_1$1 = figures;
	return figures_1$1;
}

var style$1;
var hasRequiredStyle$1;

function requireStyle$1 () {
	if (hasRequiredStyle$1) return style$1;
	hasRequiredStyle$1 = 1;

	const c = requireKleur();

	const figures = requireFigures$1(); // rendering user input.


	const styles = Object.freeze({
	  password: {
	    scale: 1,
	    render: input => '*'.repeat(input.length)
	  },
	  emoji: {
	    scale: 2,
	    render: input => '😃'.repeat(input.length)
	  },
	  invisible: {
	    scale: 0,
	    render: input => ''
	  },
	  default: {
	    scale: 1,
	    render: input => `${input}`
	  }
	});

	const render = type => styles[type] || styles.default; // icon to signalize a prompt.


	const symbols = Object.freeze({
	  aborted: c.red(figures.cross),
	  done: c.green(figures.tick),
	  exited: c.yellow(figures.cross),
	  default: c.cyan('?')
	});

	const symbol = (done, aborted, exited) => aborted ? symbols.aborted : exited ? symbols.exited : done ? symbols.done : symbols.default; // between the question and the user's input.


	const delimiter = completing => c.gray(completing ? figures.ellipsis : figures.pointerSmall);

	const item = (expandable, expanded) => c.gray(expandable ? expanded ? figures.pointerSmall : '+' : figures.line);

	style$1 = {
	  styles,
	  render,
	  symbols,
	  symbol,
	  delimiter,
	  item
	};
	return style$1;
}

var lines$1;
var hasRequiredLines$1;

function requireLines$1 () {
	if (hasRequiredLines$1) return lines$1;
	hasRequiredLines$1 = 1;

	const strip = requireStrip$1();
	/**
	 * @param {string} msg
	 * @param {number} perLine
	 */


	lines$1 = function (msg, perLine) {
	  let lines = String(strip(msg) || '').split(/\r?\n/);
	  if (!perLine) return lines.length;
	  return lines.map(l => Math.ceil(l.length / perLine)).reduce((a, b) => a + b);
	};
	return lines$1;
}

var wrap$1;
var hasRequiredWrap$1;

function requireWrap$1 () {
	if (hasRequiredWrap$1) return wrap$1;
	hasRequiredWrap$1 = 1;
	/**
	 * @param {string} msg The message to wrap
	 * @param {object} opts
	 * @param {number|string} [opts.margin] Left margin
	 * @param {number} opts.width Maximum characters per line including the margin
	 */

	wrap$1 = (msg, opts = {}) => {
	  const tab = Number.isSafeInteger(parseInt(opts.margin)) ? new Array(parseInt(opts.margin)).fill(' ').join('') : opts.margin || '';
	  const width = opts.width;
	  return (msg || '').split(/\r?\n/g).map(line => line.split(/\s+/g).reduce((arr, w) => {
	    if (w.length + tab.length >= width || arr[arr.length - 1].length + w.length + 1 < width) arr[arr.length - 1] += ` ${w}`;else arr.push(`${tab}${w}`);
	    return arr;
	  }, [tab]).join('\n')).join('\n');
	};
	return wrap$1;
}

var entriesToDisplay$1;
var hasRequiredEntriesToDisplay$1;

function requireEntriesToDisplay$1 () {
	if (hasRequiredEntriesToDisplay$1) return entriesToDisplay$1;
	hasRequiredEntriesToDisplay$1 = 1;
	/**
	 * Determine what entries should be displayed on the screen, based on the
	 * currently selected index and the maximum visible. Used in list-based
	 * prompts like `select` and `multiselect`.
	 *
	 * @param {number} cursor the currently selected entry
	 * @param {number} total the total entries available to display
	 * @param {number} [maxVisible] the number of entries that can be displayed
	 */

	entriesToDisplay$1 = (cursor, total, maxVisible) => {
	  maxVisible = maxVisible || total;
	  let startIndex = Math.min(total - maxVisible, cursor - Math.floor(maxVisible / 2));
	  if (startIndex < 0) startIndex = 0;
	  let endIndex = Math.min(startIndex + maxVisible, total);
	  return {
	    startIndex,
	    endIndex
	  };
	};
	return entriesToDisplay$1;
}

var util$1;
var hasRequiredUtil$1;

function requireUtil$1 () {
	if (hasRequiredUtil$1) return util$1;
	hasRequiredUtil$1 = 1;

	util$1 = {
	  action: requireAction$1(),
	  clear: requireClear$1(),
	  style: requireStyle$1(),
	  strip: requireStrip$1(),
	  figures: requireFigures$1(),
	  lines: requireLines$1(),
	  wrap: requireWrap$1(),
	  entriesToDisplay: requireEntriesToDisplay$1()
	};
	return util$1;
}

var prompt$2;
var hasRequiredPrompt$1;

function requirePrompt$1 () {
	if (hasRequiredPrompt$1) return prompt$2;
	hasRequiredPrompt$1 = 1;

	const readline = require$$0$4;

	const _require = requireUtil$1(),
	      action = _require.action;

	const EventEmitter = require$$0$3;

	const _require2 = requireSrc(),
	      beep = _require2.beep,
	      cursor = _require2.cursor;

	const color = requireKleur();
	/**
	 * Base prompt skeleton
	 * @param {Stream} [opts.stdin] The Readable stream to listen to
	 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
	 */


	class Prompt extends EventEmitter {
	  constructor(opts = {}) {
	    super();
	    this.firstRender = true;
	    this.in = opts.stdin || process.stdin;
	    this.out = opts.stdout || process.stdout;

	    this.onRender = (opts.onRender || (() => void 0)).bind(this);

	    const rl = readline.createInterface({
	      input: this.in,
	      escapeCodeTimeout: 50
	    });
	    readline.emitKeypressEvents(this.in, rl);
	    if (this.in.isTTY) this.in.setRawMode(true);
	    const isSelect = ['SelectPrompt', 'MultiselectPrompt'].indexOf(this.constructor.name) > -1;

	    const keypress = (str, key) => {
	      let a = action(key, isSelect);

	      if (a === false) {
	        this._ && this._(str, key);
	      } else if (typeof this[a] === 'function') {
	        this[a](key);
	      } else {
	        this.bell();
	      }
	    };

	    this.close = () => {
	      this.out.write(cursor.show);
	      this.in.removeListener('keypress', keypress);
	      if (this.in.isTTY) this.in.setRawMode(false);
	      rl.close();
	      this.emit(this.aborted ? 'abort' : this.exited ? 'exit' : 'submit', this.value);
	      this.closed = true;
	    };

	    this.in.on('keypress', keypress);
	  }

	  fire() {
	    this.emit('state', {
	      value: this.value,
	      aborted: !!this.aborted,
	      exited: !!this.exited
	    });
	  }

	  bell() {
	    this.out.write(beep);
	  }

	  render() {
	    this.onRender(color);
	    if (this.firstRender) this.firstRender = false;
	  }

	}

	prompt$2 = Prompt;
	return prompt$2;
}

var text$1;
var hasRequiredText$1;

function requireText$1 () {
	if (hasRequiredText$1) return text$1;
	hasRequiredText$1 = 1;

	function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

	function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

	const color = requireKleur();

	const Prompt = requirePrompt$1();

	const _require = requireSrc(),
	      erase = _require.erase,
	      cursor = _require.cursor;

	const _require2 = requireUtil$1(),
	      style = _require2.style,
	      clear = _require2.clear,
	      lines = _require2.lines,
	      figures = _require2.figures;
	/**
	 * TextPrompt Base Element
	 * @param {Object} opts Options
	 * @param {String} opts.message Message
	 * @param {String} [opts.style='default'] Render style
	 * @param {String} [opts.initial] Default value
	 * @param {Function} [opts.validate] Validate function
	 * @param {Stream} [opts.stdin] The Readable stream to listen to
	 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
	 * @param {String} [opts.error] The invalid error label
	 */


	class TextPrompt extends Prompt {
	  constructor(opts = {}) {
	    super(opts);
	    this.transform = style.render(opts.style);
	    this.scale = this.transform.scale;
	    this.msg = opts.message;
	    this.initial = opts.initial || ``;

	    this.validator = opts.validate || (() => true);

	    this.value = ``;
	    this.errorMsg = opts.error || `Please Enter A Valid Value`;
	    this.cursor = Number(!!this.initial);
	    this.cursorOffset = 0;
	    this.clear = clear(``, this.out.columns);
	    this.render();
	  }

	  set value(v) {
	    if (!v && this.initial) {
	      this.placeholder = true;
	      this.rendered = color.gray(this.transform.render(this.initial));
	    } else {
	      this.placeholder = false;
	      this.rendered = this.transform.render(v);
	    }

	    this._value = v;
	    this.fire();
	  }

	  get value() {
	    return this._value;
	  }

	  reset() {
	    this.value = ``;
	    this.cursor = Number(!!this.initial);
	    this.cursorOffset = 0;
	    this.fire();
	    this.render();
	  }

	  exit() {
	    this.abort();
	  }

	  abort() {
	    this.value = this.value || this.initial;
	    this.done = this.aborted = true;
	    this.error = false;
	    this.red = false;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  validate() {
	    var _this = this;

	    return _asyncToGenerator(function* () {
	      let valid = yield _this.validator(_this.value);

	      if (typeof valid === `string`) {
	        _this.errorMsg = valid;
	        valid = false;
	      }

	      _this.error = !valid;
	    })();
	  }

	  submit() {
	    var _this2 = this;

	    return _asyncToGenerator(function* () {
	      _this2.value = _this2.value || _this2.initial;
	      _this2.cursorOffset = 0;
	      _this2.cursor = _this2.rendered.length;
	      yield _this2.validate();

	      if (_this2.error) {
	        _this2.red = true;

	        _this2.fire();

	        _this2.render();

	        return;
	      }

	      _this2.done = true;
	      _this2.aborted = false;

	      _this2.fire();

	      _this2.render();

	      _this2.out.write('\n');

	      _this2.close();
	    })();
	  }

	  next() {
	    if (!this.placeholder) return this.bell();
	    this.value = this.initial;
	    this.cursor = this.rendered.length;
	    this.fire();
	    this.render();
	  }

	  moveCursor(n) {
	    if (this.placeholder) return;
	    this.cursor = this.cursor + n;
	    this.cursorOffset += n;
	  }

	  _(c, key) {
	    let s1 = this.value.slice(0, this.cursor);
	    let s2 = this.value.slice(this.cursor);
	    this.value = `${s1}${c}${s2}`;
	    this.red = false;
	    this.cursor = this.placeholder ? 0 : s1.length + 1;
	    this.render();
	  }

	  delete() {
	    if (this.isCursorAtStart()) return this.bell();
	    let s1 = this.value.slice(0, this.cursor - 1);
	    let s2 = this.value.slice(this.cursor);
	    this.value = `${s1}${s2}`;
	    this.red = false;

	    if (this.isCursorAtStart()) {
	      this.cursorOffset = 0;
	    } else {
	      this.cursorOffset++;
	      this.moveCursor(-1);
	    }

	    this.render();
	  }

	  deleteForward() {
	    if (this.cursor * this.scale >= this.rendered.length || this.placeholder) return this.bell();
	    let s1 = this.value.slice(0, this.cursor);
	    let s2 = this.value.slice(this.cursor + 1);
	    this.value = `${s1}${s2}`;
	    this.red = false;

	    if (this.isCursorAtEnd()) {
	      this.cursorOffset = 0;
	    } else {
	      this.cursorOffset++;
	    }

	    this.render();
	  }

	  first() {
	    this.cursor = 0;
	    this.render();
	  }

	  last() {
	    this.cursor = this.value.length;
	    this.render();
	  }

	  left() {
	    if (this.cursor <= 0 || this.placeholder) return this.bell();
	    this.moveCursor(-1);
	    this.render();
	  }

	  right() {
	    if (this.cursor * this.scale >= this.rendered.length || this.placeholder) return this.bell();
	    this.moveCursor(1);
	    this.render();
	  }

	  isCursorAtStart() {
	    return this.cursor === 0 || this.placeholder && this.cursor === 1;
	  }

	  isCursorAtEnd() {
	    return this.cursor === this.rendered.length || this.placeholder && this.cursor === this.rendered.length + 1;
	  }

	  render() {
	    if (this.closed) return;

	    if (!this.firstRender) {
	      if (this.outputError) this.out.write(cursor.down(lines(this.outputError, this.out.columns) - 1) + clear(this.outputError, this.out.columns));
	      this.out.write(clear(this.outputText, this.out.columns));
	    }

	    super.render();
	    this.outputError = '';
	    this.outputText = [style.symbol(this.done, this.aborted), color.bold(this.msg), style.delimiter(this.done), this.red ? color.red(this.rendered) : this.rendered].join(` `);

	    if (this.error) {
	      this.outputError += this.errorMsg.split(`\n`).reduce((a, l, i) => a + `\n${i ? ' ' : figures.pointerSmall} ${color.red().italic(l)}`, ``);
	    }

	    this.out.write(erase.line + cursor.to(0) + this.outputText + cursor.save + this.outputError + cursor.restore + cursor.move(this.cursorOffset, 0));
	  }

	}

	text$1 = TextPrompt;
	return text$1;
}

var select$1;
var hasRequiredSelect$1;

function requireSelect$1 () {
	if (hasRequiredSelect$1) return select$1;
	hasRequiredSelect$1 = 1;

	const color = requireKleur();

	const Prompt = requirePrompt$1();

	const _require = requireUtil$1(),
	      style = _require.style,
	      clear = _require.clear,
	      figures = _require.figures,
	      wrap = _require.wrap,
	      entriesToDisplay = _require.entriesToDisplay;

	const _require2 = requireSrc(),
	      cursor = _require2.cursor;
	/**
	 * SelectPrompt Base Element
	 * @param {Object} opts Options
	 * @param {String} opts.message Message
	 * @param {Array} opts.choices Array of choice objects
	 * @param {String} [opts.hint] Hint to display
	 * @param {Number} [opts.initial] Index of default value
	 * @param {Stream} [opts.stdin] The Readable stream to listen to
	 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
	 * @param {Number} [opts.optionsPerPage=10] Max options to display at once
	 */


	class SelectPrompt extends Prompt {
	  constructor(opts = {}) {
	    super(opts);
	    this.msg = opts.message;
	    this.hint = opts.hint || '- Use arrow-keys. Return to submit.';
	    this.warn = opts.warn || '- This option is disabled';
	    this.cursor = opts.initial || 0;
	    this.choices = opts.choices.map((ch, idx) => {
	      if (typeof ch === 'string') ch = {
	        title: ch,
	        value: idx
	      };
	      return {
	        title: ch && (ch.title || ch.value || ch),
	        value: ch && (ch.value === undefined ? idx : ch.value),
	        description: ch && ch.description,
	        selected: ch && ch.selected,
	        disabled: ch && ch.disabled
	      };
	    });
	    this.optionsPerPage = opts.optionsPerPage || 10;
	    this.value = (this.choices[this.cursor] || {}).value;
	    this.clear = clear('', this.out.columns);
	    this.render();
	  }

	  moveCursor(n) {
	    this.cursor = n;
	    this.value = this.choices[n].value;
	    this.fire();
	  }

	  reset() {
	    this.moveCursor(0);
	    this.fire();
	    this.render();
	  }

	  exit() {
	    this.abort();
	  }

	  abort() {
	    this.done = this.aborted = true;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  submit() {
	    if (!this.selection.disabled) {
	      this.done = true;
	      this.aborted = false;
	      this.fire();
	      this.render();
	      this.out.write('\n');
	      this.close();
	    } else this.bell();
	  }

	  first() {
	    this.moveCursor(0);
	    this.render();
	  }

	  last() {
	    this.moveCursor(this.choices.length - 1);
	    this.render();
	  }

	  up() {
	    if (this.cursor === 0) {
	      this.moveCursor(this.choices.length - 1);
	    } else {
	      this.moveCursor(this.cursor - 1);
	    }

	    this.render();
	  }

	  down() {
	    if (this.cursor === this.choices.length - 1) {
	      this.moveCursor(0);
	    } else {
	      this.moveCursor(this.cursor + 1);
	    }

	    this.render();
	  }

	  next() {
	    this.moveCursor((this.cursor + 1) % this.choices.length);
	    this.render();
	  }

	  _(c, key) {
	    if (c === ' ') return this.submit();
	  }

	  get selection() {
	    return this.choices[this.cursor];
	  }

	  render() {
	    if (this.closed) return;
	    if (this.firstRender) this.out.write(cursor.hide);else this.out.write(clear(this.outputText, this.out.columns));
	    super.render();

	    let _entriesToDisplay = entriesToDisplay(this.cursor, this.choices.length, this.optionsPerPage),
	        startIndex = _entriesToDisplay.startIndex,
	        endIndex = _entriesToDisplay.endIndex; // Print prompt


	    this.outputText = [style.symbol(this.done, this.aborted), color.bold(this.msg), style.delimiter(false), this.done ? this.selection.title : this.selection.disabled ? color.yellow(this.warn) : color.gray(this.hint)].join(' '); // Print choices

	    if (!this.done) {
	      this.outputText += '\n';

	      for (let i = startIndex; i < endIndex; i++) {
	        let title,
	            prefix,
	            desc = '',
	            v = this.choices[i]; // Determine whether to display "more choices" indicators

	        if (i === startIndex && startIndex > 0) {
	          prefix = figures.arrowUp;
	        } else if (i === endIndex - 1 && endIndex < this.choices.length) {
	          prefix = figures.arrowDown;
	        } else {
	          prefix = ' ';
	        }

	        if (v.disabled) {
	          title = this.cursor === i ? color.gray().underline(v.title) : color.strikethrough().gray(v.title);
	          prefix = (this.cursor === i ? color.bold().gray(figures.pointer) + ' ' : '  ') + prefix;
	        } else {
	          title = this.cursor === i ? color.cyan().underline(v.title) : v.title;
	          prefix = (this.cursor === i ? color.cyan(figures.pointer) + ' ' : '  ') + prefix;

	          if (v.description && this.cursor === i) {
	            desc = ` - ${v.description}`;

	            if (prefix.length + title.length + desc.length >= this.out.columns || v.description.split(/\r?\n/).length > 1) {
	              desc = '\n' + wrap(v.description, {
	                margin: 3,
	                width: this.out.columns
	              });
	            }
	          }
	        }

	        this.outputText += `${prefix} ${title}${color.gray(desc)}\n`;
	      }
	    }

	    this.out.write(this.outputText);
	  }

	}

	select$1 = SelectPrompt;
	return select$1;
}

var toggle$1;
var hasRequiredToggle$1;

function requireToggle$1 () {
	if (hasRequiredToggle$1) return toggle$1;
	hasRequiredToggle$1 = 1;

	const color = requireKleur();

	const Prompt = requirePrompt$1();

	const _require = requireUtil$1(),
	      style = _require.style,
	      clear = _require.clear;

	const _require2 = requireSrc(),
	      cursor = _require2.cursor,
	      erase = _require2.erase;
	/**
	 * TogglePrompt Base Element
	 * @param {Object} opts Options
	 * @param {String} opts.message Message
	 * @param {Boolean} [opts.initial=false] Default value
	 * @param {String} [opts.active='no'] Active label
	 * @param {String} [opts.inactive='off'] Inactive label
	 * @param {Stream} [opts.stdin] The Readable stream to listen to
	 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
	 */


	class TogglePrompt extends Prompt {
	  constructor(opts = {}) {
	    super(opts);
	    this.msg = opts.message;
	    this.value = !!opts.initial;
	    this.active = opts.active || 'on';
	    this.inactive = opts.inactive || 'off';
	    this.initialValue = this.value;
	    this.render();
	  }

	  reset() {
	    this.value = this.initialValue;
	    this.fire();
	    this.render();
	  }

	  exit() {
	    this.abort();
	  }

	  abort() {
	    this.done = this.aborted = true;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  submit() {
	    this.done = true;
	    this.aborted = false;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  deactivate() {
	    if (this.value === false) return this.bell();
	    this.value = false;
	    this.render();
	  }

	  activate() {
	    if (this.value === true) return this.bell();
	    this.value = true;
	    this.render();
	  }

	  delete() {
	    this.deactivate();
	  }

	  left() {
	    this.deactivate();
	  }

	  right() {
	    this.activate();
	  }

	  down() {
	    this.deactivate();
	  }

	  up() {
	    this.activate();
	  }

	  next() {
	    this.value = !this.value;
	    this.fire();
	    this.render();
	  }

	  _(c, key) {
	    if (c === ' ') {
	      this.value = !this.value;
	    } else if (c === '1') {
	      this.value = true;
	    } else if (c === '0') {
	      this.value = false;
	    } else return this.bell();

	    this.render();
	  }

	  render() {
	    if (this.closed) return;
	    if (this.firstRender) this.out.write(cursor.hide);else this.out.write(clear(this.outputText, this.out.columns));
	    super.render();
	    this.outputText = [style.symbol(this.done, this.aborted), color.bold(this.msg), style.delimiter(this.done), this.value ? this.inactive : color.cyan().underline(this.inactive), color.gray('/'), this.value ? color.cyan().underline(this.active) : this.active].join(' ');
	    this.out.write(erase.line + cursor.to(0) + this.outputText);
	  }

	}

	toggle$1 = TogglePrompt;
	return toggle$1;
}

var datepart$1;
var hasRequiredDatepart$1;

function requireDatepart$1 () {
	if (hasRequiredDatepart$1) return datepart$1;
	hasRequiredDatepart$1 = 1;

	class DatePart {
	  constructor({
	    token,
	    date,
	    parts,
	    locales
	  }) {
	    this.token = token;
	    this.date = date || new Date();
	    this.parts = parts || [this];
	    this.locales = locales || {};
	  }

	  up() {}

	  down() {}

	  next() {
	    const currentIdx = this.parts.indexOf(this);
	    return this.parts.find((part, idx) => idx > currentIdx && part instanceof DatePart);
	  }

	  setTo(val) {}

	  prev() {
	    let parts = [].concat(this.parts).reverse();
	    const currentIdx = parts.indexOf(this);
	    return parts.find((part, idx) => idx > currentIdx && part instanceof DatePart);
	  }

	  toString() {
	    return String(this.date);
	  }

	}

	datepart$1 = DatePart;
	return datepart$1;
}

var meridiem$1;
var hasRequiredMeridiem$1;

function requireMeridiem$1 () {
	if (hasRequiredMeridiem$1) return meridiem$1;
	hasRequiredMeridiem$1 = 1;

	const DatePart = requireDatepart$1();

	class Meridiem extends DatePart {
	  constructor(opts = {}) {
	    super(opts);
	  }

	  up() {
	    this.date.setHours((this.date.getHours() + 12) % 24);
	  }

	  down() {
	    this.up();
	  }

	  toString() {
	    let meridiem = this.date.getHours() > 12 ? 'pm' : 'am';
	    return /\A/.test(this.token) ? meridiem.toUpperCase() : meridiem;
	  }

	}

	meridiem$1 = Meridiem;
	return meridiem$1;
}

var day$1;
var hasRequiredDay$1;

function requireDay$1 () {
	if (hasRequiredDay$1) return day$1;
	hasRequiredDay$1 = 1;

	const DatePart = requireDatepart$1();

	const pos = n => {
	  n = n % 10;
	  return n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
	};

	class Day extends DatePart {
	  constructor(opts = {}) {
	    super(opts);
	  }

	  up() {
	    this.date.setDate(this.date.getDate() + 1);
	  }

	  down() {
	    this.date.setDate(this.date.getDate() - 1);
	  }

	  setTo(val) {
	    this.date.setDate(parseInt(val.substr(-2)));
	  }

	  toString() {
	    let date = this.date.getDate();
	    let day = this.date.getDay();
	    return this.token === 'DD' ? String(date).padStart(2, '0') : this.token === 'Do' ? date + pos(date) : this.token === 'd' ? day + 1 : this.token === 'ddd' ? this.locales.weekdaysShort[day] : this.token === 'dddd' ? this.locales.weekdays[day] : date;
	  }

	}

	day$1 = Day;
	return day$1;
}

var hours$1;
var hasRequiredHours$1;

function requireHours$1 () {
	if (hasRequiredHours$1) return hours$1;
	hasRequiredHours$1 = 1;

	const DatePart = requireDatepart$1();

	class Hours extends DatePart {
	  constructor(opts = {}) {
	    super(opts);
	  }

	  up() {
	    this.date.setHours(this.date.getHours() + 1);
	  }

	  down() {
	    this.date.setHours(this.date.getHours() - 1);
	  }

	  setTo(val) {
	    this.date.setHours(parseInt(val.substr(-2)));
	  }

	  toString() {
	    let hours = this.date.getHours();
	    if (/h/.test(this.token)) hours = hours % 12 || 12;
	    return this.token.length > 1 ? String(hours).padStart(2, '0') : hours;
	  }

	}

	hours$1 = Hours;
	return hours$1;
}

var milliseconds$1;
var hasRequiredMilliseconds$1;

function requireMilliseconds$1 () {
	if (hasRequiredMilliseconds$1) return milliseconds$1;
	hasRequiredMilliseconds$1 = 1;

	const DatePart = requireDatepart$1();

	class Milliseconds extends DatePart {
	  constructor(opts = {}) {
	    super(opts);
	  }

	  up() {
	    this.date.setMilliseconds(this.date.getMilliseconds() + 1);
	  }

	  down() {
	    this.date.setMilliseconds(this.date.getMilliseconds() - 1);
	  }

	  setTo(val) {
	    this.date.setMilliseconds(parseInt(val.substr(-this.token.length)));
	  }

	  toString() {
	    return String(this.date.getMilliseconds()).padStart(4, '0').substr(0, this.token.length);
	  }

	}

	milliseconds$1 = Milliseconds;
	return milliseconds$1;
}

var minutes$1;
var hasRequiredMinutes$1;

function requireMinutes$1 () {
	if (hasRequiredMinutes$1) return minutes$1;
	hasRequiredMinutes$1 = 1;

	const DatePart = requireDatepart$1();

	class Minutes extends DatePart {
	  constructor(opts = {}) {
	    super(opts);
	  }

	  up() {
	    this.date.setMinutes(this.date.getMinutes() + 1);
	  }

	  down() {
	    this.date.setMinutes(this.date.getMinutes() - 1);
	  }

	  setTo(val) {
	    this.date.setMinutes(parseInt(val.substr(-2)));
	  }

	  toString() {
	    let m = this.date.getMinutes();
	    return this.token.length > 1 ? String(m).padStart(2, '0') : m;
	  }

	}

	minutes$1 = Minutes;
	return minutes$1;
}

var month$1;
var hasRequiredMonth$1;

function requireMonth$1 () {
	if (hasRequiredMonth$1) return month$1;
	hasRequiredMonth$1 = 1;

	const DatePart = requireDatepart$1();

	class Month extends DatePart {
	  constructor(opts = {}) {
	    super(opts);
	  }

	  up() {
	    this.date.setMonth(this.date.getMonth() + 1);
	  }

	  down() {
	    this.date.setMonth(this.date.getMonth() - 1);
	  }

	  setTo(val) {
	    val = parseInt(val.substr(-2)) - 1;
	    this.date.setMonth(val < 0 ? 0 : val);
	  }

	  toString() {
	    let month = this.date.getMonth();
	    let tl = this.token.length;
	    return tl === 2 ? String(month + 1).padStart(2, '0') : tl === 3 ? this.locales.monthsShort[month] : tl === 4 ? this.locales.months[month] : String(month + 1);
	  }

	}

	month$1 = Month;
	return month$1;
}

var seconds$1;
var hasRequiredSeconds$1;

function requireSeconds$1 () {
	if (hasRequiredSeconds$1) return seconds$1;
	hasRequiredSeconds$1 = 1;

	const DatePart = requireDatepart$1();

	class Seconds extends DatePart {
	  constructor(opts = {}) {
	    super(opts);
	  }

	  up() {
	    this.date.setSeconds(this.date.getSeconds() + 1);
	  }

	  down() {
	    this.date.setSeconds(this.date.getSeconds() - 1);
	  }

	  setTo(val) {
	    this.date.setSeconds(parseInt(val.substr(-2)));
	  }

	  toString() {
	    let s = this.date.getSeconds();
	    return this.token.length > 1 ? String(s).padStart(2, '0') : s;
	  }

	}

	seconds$1 = Seconds;
	return seconds$1;
}

var year$1;
var hasRequiredYear$1;

function requireYear$1 () {
	if (hasRequiredYear$1) return year$1;
	hasRequiredYear$1 = 1;

	const DatePart = requireDatepart$1();

	class Year extends DatePart {
	  constructor(opts = {}) {
	    super(opts);
	  }

	  up() {
	    this.date.setFullYear(this.date.getFullYear() + 1);
	  }

	  down() {
	    this.date.setFullYear(this.date.getFullYear() - 1);
	  }

	  setTo(val) {
	    this.date.setFullYear(val.substr(-4));
	  }

	  toString() {
	    let year = String(this.date.getFullYear()).padStart(4, '0');
	    return this.token.length === 2 ? year.substr(-2) : year;
	  }

	}

	year$1 = Year;
	return year$1;
}

var dateparts$1;
var hasRequiredDateparts$1;

function requireDateparts$1 () {
	if (hasRequiredDateparts$1) return dateparts$1;
	hasRequiredDateparts$1 = 1;

	dateparts$1 = {
	  DatePart: requireDatepart$1(),
	  Meridiem: requireMeridiem$1(),
	  Day: requireDay$1(),
	  Hours: requireHours$1(),
	  Milliseconds: requireMilliseconds$1(),
	  Minutes: requireMinutes$1(),
	  Month: requireMonth$1(),
	  Seconds: requireSeconds$1(),
	  Year: requireYear$1()
	};
	return dateparts$1;
}

var date$1;
var hasRequiredDate$1;

function requireDate$1 () {
	if (hasRequiredDate$1) return date$1;
	hasRequiredDate$1 = 1;

	function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

	function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

	const color = requireKleur();

	const Prompt = requirePrompt$1();

	const _require = requireUtil$1(),
	      style = _require.style,
	      clear = _require.clear,
	      figures = _require.figures;

	const _require2 = requireSrc(),
	      erase = _require2.erase,
	      cursor = _require2.cursor;

	const _require3 = requireDateparts$1(),
	      DatePart = _require3.DatePart,
	      Meridiem = _require3.Meridiem,
	      Day = _require3.Day,
	      Hours = _require3.Hours,
	      Milliseconds = _require3.Milliseconds,
	      Minutes = _require3.Minutes,
	      Month = _require3.Month,
	      Seconds = _require3.Seconds,
	      Year = _require3.Year;

	const regex = /\\(.)|"((?:\\["\\]|[^"])+)"|(D[Do]?|d{3,4}|d)|(M{1,4})|(YY(?:YY)?)|([aA])|([Hh]{1,2})|(m{1,2})|(s{1,2})|(S{1,4})|./g;
	const regexGroups = {
	  1: ({
	    token
	  }) => token.replace(/\\(.)/g, '$1'),
	  2: opts => new Day(opts),
	  // Day // TODO
	  3: opts => new Month(opts),
	  // Month
	  4: opts => new Year(opts),
	  // Year
	  5: opts => new Meridiem(opts),
	  // AM/PM // TODO (special)
	  6: opts => new Hours(opts),
	  // Hours
	  7: opts => new Minutes(opts),
	  // Minutes
	  8: opts => new Seconds(opts),
	  // Seconds
	  9: opts => new Milliseconds(opts) // Fractional seconds

	};
	const dfltLocales = {
	  months: 'January,February,March,April,May,June,July,August,September,October,November,December'.split(','),
	  monthsShort: 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(','),
	  weekdays: 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'.split(','),
	  weekdaysShort: 'Sun,Mon,Tue,Wed,Thu,Fri,Sat'.split(',')
	};
	/**
	 * DatePrompt Base Element
	 * @param {Object} opts Options
	 * @param {String} opts.message Message
	 * @param {Number} [opts.initial] Index of default value
	 * @param {String} [opts.mask] The format mask
	 * @param {object} [opts.locales] The date locales
	 * @param {String} [opts.error] The error message shown on invalid value
	 * @param {Function} [opts.validate] Function to validate the submitted value
	 * @param {Stream} [opts.stdin] The Readable stream to listen to
	 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
	 */

	class DatePrompt extends Prompt {
	  constructor(opts = {}) {
	    super(opts);
	    this.msg = opts.message;
	    this.cursor = 0;
	    this.typed = '';
	    this.locales = Object.assign(dfltLocales, opts.locales);
	    this._date = opts.initial || new Date();
	    this.errorMsg = opts.error || 'Please Enter A Valid Value';

	    this.validator = opts.validate || (() => true);

	    this.mask = opts.mask || 'YYYY-MM-DD HH:mm:ss';
	    this.clear = clear('', this.out.columns);
	    this.render();
	  }

	  get value() {
	    return this.date;
	  }

	  get date() {
	    return this._date;
	  }

	  set date(date) {
	    if (date) this._date.setTime(date.getTime());
	  }

	  set mask(mask) {
	    let result;
	    this.parts = [];

	    while (result = regex.exec(mask)) {
	      let match = result.shift();
	      let idx = result.findIndex(gr => gr != null);
	      this.parts.push(idx in regexGroups ? regexGroups[idx]({
	        token: result[idx] || match,
	        date: this.date,
	        parts: this.parts,
	        locales: this.locales
	      }) : result[idx] || match);
	    }

	    let parts = this.parts.reduce((arr, i) => {
	      if (typeof i === 'string' && typeof arr[arr.length - 1] === 'string') arr[arr.length - 1] += i;else arr.push(i);
	      return arr;
	    }, []);
	    this.parts.splice(0);
	    this.parts.push(...parts);
	    this.reset();
	  }

	  moveCursor(n) {
	    this.typed = '';
	    this.cursor = n;
	    this.fire();
	  }

	  reset() {
	    this.moveCursor(this.parts.findIndex(p => p instanceof DatePart));
	    this.fire();
	    this.render();
	  }

	  exit() {
	    this.abort();
	  }

	  abort() {
	    this.done = this.aborted = true;
	    this.error = false;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  validate() {
	    var _this = this;

	    return _asyncToGenerator(function* () {
	      let valid = yield _this.validator(_this.value);

	      if (typeof valid === 'string') {
	        _this.errorMsg = valid;
	        valid = false;
	      }

	      _this.error = !valid;
	    })();
	  }

	  submit() {
	    var _this2 = this;

	    return _asyncToGenerator(function* () {
	      yield _this2.validate();

	      if (_this2.error) {
	        _this2.color = 'red';

	        _this2.fire();

	        _this2.render();

	        return;
	      }

	      _this2.done = true;
	      _this2.aborted = false;

	      _this2.fire();

	      _this2.render();

	      _this2.out.write('\n');

	      _this2.close();
	    })();
	  }

	  up() {
	    this.typed = '';
	    this.parts[this.cursor].up();
	    this.render();
	  }

	  down() {
	    this.typed = '';
	    this.parts[this.cursor].down();
	    this.render();
	  }

	  left() {
	    let prev = this.parts[this.cursor].prev();
	    if (prev == null) return this.bell();
	    this.moveCursor(this.parts.indexOf(prev));
	    this.render();
	  }

	  right() {
	    let next = this.parts[this.cursor].next();
	    if (next == null) return this.bell();
	    this.moveCursor(this.parts.indexOf(next));
	    this.render();
	  }

	  next() {
	    let next = this.parts[this.cursor].next();
	    this.moveCursor(next ? this.parts.indexOf(next) : this.parts.findIndex(part => part instanceof DatePart));
	    this.render();
	  }

	  _(c) {
	    if (/\d/.test(c)) {
	      this.typed += c;
	      this.parts[this.cursor].setTo(this.typed);
	      this.render();
	    }
	  }

	  render() {
	    if (this.closed) return;
	    if (this.firstRender) this.out.write(cursor.hide);else this.out.write(clear(this.outputText, this.out.columns));
	    super.render(); // Print prompt

	    this.outputText = [style.symbol(this.done, this.aborted), color.bold(this.msg), style.delimiter(false), this.parts.reduce((arr, p, idx) => arr.concat(idx === this.cursor && !this.done ? color.cyan().underline(p.toString()) : p), []).join('')].join(' '); // Print error

	    if (this.error) {
	      this.outputText += this.errorMsg.split('\n').reduce((a, l, i) => a + `\n${i ? ` ` : figures.pointerSmall} ${color.red().italic(l)}`, ``);
	    }

	    this.out.write(erase.line + cursor.to(0) + this.outputText);
	  }

	}

	date$1 = DatePrompt;
	return date$1;
}

var number$1;
var hasRequiredNumber$1;

function requireNumber$1 () {
	if (hasRequiredNumber$1) return number$1;
	hasRequiredNumber$1 = 1;

	function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

	function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

	const color = requireKleur();

	const Prompt = requirePrompt$1();

	const _require = requireSrc(),
	      cursor = _require.cursor,
	      erase = _require.erase;

	const _require2 = requireUtil$1(),
	      style = _require2.style,
	      figures = _require2.figures,
	      clear = _require2.clear,
	      lines = _require2.lines;

	const isNumber = /[0-9]/;

	const isDef = any => any !== undefined;

	const round = (number, precision) => {
	  let factor = Math.pow(10, precision);
	  return Math.round(number * factor) / factor;
	};
	/**
	 * NumberPrompt Base Element
	 * @param {Object} opts Options
	 * @param {String} opts.message Message
	 * @param {String} [opts.style='default'] Render style
	 * @param {Number} [opts.initial] Default value
	 * @param {Number} [opts.max=+Infinity] Max value
	 * @param {Number} [opts.min=-Infinity] Min value
	 * @param {Boolean} [opts.float=false] Parse input as floats
	 * @param {Number} [opts.round=2] Round floats to x decimals
	 * @param {Number} [opts.increment=1] Number to increment by when using arrow-keys
	 * @param {Function} [opts.validate] Validate function
	 * @param {Stream} [opts.stdin] The Readable stream to listen to
	 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
	 * @param {String} [opts.error] The invalid error label
	 */


	class NumberPrompt extends Prompt {
	  constructor(opts = {}) {
	    super(opts);
	    this.transform = style.render(opts.style);
	    this.msg = opts.message;
	    this.initial = isDef(opts.initial) ? opts.initial : '';
	    this.float = !!opts.float;
	    this.round = opts.round || 2;
	    this.inc = opts.increment || 1;
	    this.min = isDef(opts.min) ? opts.min : -Infinity;
	    this.max = isDef(opts.max) ? opts.max : Infinity;
	    this.errorMsg = opts.error || `Please Enter A Valid Value`;

	    this.validator = opts.validate || (() => true);

	    this.color = `cyan`;
	    this.value = ``;
	    this.typed = ``;
	    this.lastHit = 0;
	    this.render();
	  }

	  set value(v) {
	    if (!v && v !== 0) {
	      this.placeholder = true;
	      this.rendered = color.gray(this.transform.render(`${this.initial}`));
	      this._value = ``;
	    } else {
	      this.placeholder = false;
	      this.rendered = this.transform.render(`${round(v, this.round)}`);
	      this._value = round(v, this.round);
	    }

	    this.fire();
	  }

	  get value() {
	    return this._value;
	  }

	  parse(x) {
	    return this.float ? parseFloat(x) : parseInt(x);
	  }

	  valid(c) {
	    return c === `-` || c === `.` && this.float || isNumber.test(c);
	  }

	  reset() {
	    this.typed = ``;
	    this.value = ``;
	    this.fire();
	    this.render();
	  }

	  exit() {
	    this.abort();
	  }

	  abort() {
	    let x = this.value;
	    this.value = x !== `` ? x : this.initial;
	    this.done = this.aborted = true;
	    this.error = false;
	    this.fire();
	    this.render();
	    this.out.write(`\n`);
	    this.close();
	  }

	  validate() {
	    var _this = this;

	    return _asyncToGenerator(function* () {
	      let valid = yield _this.validator(_this.value);

	      if (typeof valid === `string`) {
	        _this.errorMsg = valid;
	        valid = false;
	      }

	      _this.error = !valid;
	    })();
	  }

	  submit() {
	    var _this2 = this;

	    return _asyncToGenerator(function* () {
	      yield _this2.validate();

	      if (_this2.error) {
	        _this2.color = `red`;

	        _this2.fire();

	        _this2.render();

	        return;
	      }

	      let x = _this2.value;
	      _this2.value = x !== `` ? x : _this2.initial;
	      _this2.done = true;
	      _this2.aborted = false;
	      _this2.error = false;

	      _this2.fire();

	      _this2.render();

	      _this2.out.write(`\n`);

	      _this2.close();
	    })();
	  }

	  up() {
	    this.typed = ``;

	    if (this.value === '') {
	      this.value = this.min - this.inc;
	    }

	    if (this.value >= this.max) return this.bell();
	    this.value += this.inc;
	    this.color = `cyan`;
	    this.fire();
	    this.render();
	  }

	  down() {
	    this.typed = ``;

	    if (this.value === '') {
	      this.value = this.min + this.inc;
	    }

	    if (this.value <= this.min) return this.bell();
	    this.value -= this.inc;
	    this.color = `cyan`;
	    this.fire();
	    this.render();
	  }

	  delete() {
	    let val = this.value.toString();
	    if (val.length === 0) return this.bell();
	    this.value = this.parse(val = val.slice(0, -1)) || ``;

	    if (this.value !== '' && this.value < this.min) {
	      this.value = this.min;
	    }

	    this.color = `cyan`;
	    this.fire();
	    this.render();
	  }

	  next() {
	    this.value = this.initial;
	    this.fire();
	    this.render();
	  }

	  _(c, key) {
	    if (!this.valid(c)) return this.bell();
	    const now = Date.now();
	    if (now - this.lastHit > 1000) this.typed = ``; // 1s elapsed

	    this.typed += c;
	    this.lastHit = now;
	    this.color = `cyan`;
	    if (c === `.`) return this.fire();
	    this.value = Math.min(this.parse(this.typed), this.max);
	    if (this.value > this.max) this.value = this.max;
	    if (this.value < this.min) this.value = this.min;
	    this.fire();
	    this.render();
	  }

	  render() {
	    if (this.closed) return;

	    if (!this.firstRender) {
	      if (this.outputError) this.out.write(cursor.down(lines(this.outputError, this.out.columns) - 1) + clear(this.outputError, this.out.columns));
	      this.out.write(clear(this.outputText, this.out.columns));
	    }

	    super.render();
	    this.outputError = ''; // Print prompt

	    this.outputText = [style.symbol(this.done, this.aborted), color.bold(this.msg), style.delimiter(this.done), !this.done || !this.done && !this.placeholder ? color[this.color]().underline(this.rendered) : this.rendered].join(` `); // Print error

	    if (this.error) {
	      this.outputError += this.errorMsg.split(`\n`).reduce((a, l, i) => a + `\n${i ? ` ` : figures.pointerSmall} ${color.red().italic(l)}`, ``);
	    }

	    this.out.write(erase.line + cursor.to(0) + this.outputText + cursor.save + this.outputError + cursor.restore);
	  }

	}

	number$1 = NumberPrompt;
	return number$1;
}

var multiselect$1;
var hasRequiredMultiselect$1;

function requireMultiselect$1 () {
	if (hasRequiredMultiselect$1) return multiselect$1;
	hasRequiredMultiselect$1 = 1;

	const color = requireKleur();

	const _require = requireSrc(),
	      cursor = _require.cursor;

	const Prompt = requirePrompt$1();

	const _require2 = requireUtil$1(),
	      clear = _require2.clear,
	      figures = _require2.figures,
	      style = _require2.style,
	      wrap = _require2.wrap,
	      entriesToDisplay = _require2.entriesToDisplay;
	/**
	 * MultiselectPrompt Base Element
	 * @param {Object} opts Options
	 * @param {String} opts.message Message
	 * @param {Array} opts.choices Array of choice objects
	 * @param {String} [opts.hint] Hint to display
	 * @param {String} [opts.warn] Hint shown for disabled choices
	 * @param {Number} [opts.max] Max choices
	 * @param {Number} [opts.cursor=0] Cursor start position
	 * @param {Number} [opts.optionsPerPage=10] Max options to display at once
	 * @param {Stream} [opts.stdin] The Readable stream to listen to
	 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
	 */


	class MultiselectPrompt extends Prompt {
	  constructor(opts = {}) {
	    super(opts);
	    this.msg = opts.message;
	    this.cursor = opts.cursor || 0;
	    this.scrollIndex = opts.cursor || 0;
	    this.hint = opts.hint || '';
	    this.warn = opts.warn || '- This option is disabled -';
	    this.minSelected = opts.min;
	    this.showMinError = false;
	    this.maxChoices = opts.max;
	    this.instructions = opts.instructions;
	    this.optionsPerPage = opts.optionsPerPage || 10;
	    this.value = opts.choices.map((ch, idx) => {
	      if (typeof ch === 'string') ch = {
	        title: ch,
	        value: idx
	      };
	      return {
	        title: ch && (ch.title || ch.value || ch),
	        description: ch && ch.description,
	        value: ch && (ch.value === undefined ? idx : ch.value),
	        selected: ch && ch.selected,
	        disabled: ch && ch.disabled
	      };
	    });
	    this.clear = clear('', this.out.columns);

	    if (!opts.overrideRender) {
	      this.render();
	    }
	  }

	  reset() {
	    this.value.map(v => !v.selected);
	    this.cursor = 0;
	    this.fire();
	    this.render();
	  }

	  selected() {
	    return this.value.filter(v => v.selected);
	  }

	  exit() {
	    this.abort();
	  }

	  abort() {
	    this.done = this.aborted = true;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  submit() {
	    const selected = this.value.filter(e => e.selected);

	    if (this.minSelected && selected.length < this.minSelected) {
	      this.showMinError = true;
	      this.render();
	    } else {
	      this.done = true;
	      this.aborted = false;
	      this.fire();
	      this.render();
	      this.out.write('\n');
	      this.close();
	    }
	  }

	  first() {
	    this.cursor = 0;
	    this.render();
	  }

	  last() {
	    this.cursor = this.value.length - 1;
	    this.render();
	  }

	  next() {
	    this.cursor = (this.cursor + 1) % this.value.length;
	    this.render();
	  }

	  up() {
	    if (this.cursor === 0) {
	      this.cursor = this.value.length - 1;
	    } else {
	      this.cursor--;
	    }

	    this.render();
	  }

	  down() {
	    if (this.cursor === this.value.length - 1) {
	      this.cursor = 0;
	    } else {
	      this.cursor++;
	    }

	    this.render();
	  }

	  left() {
	    this.value[this.cursor].selected = false;
	    this.render();
	  }

	  right() {
	    if (this.value.filter(e => e.selected).length >= this.maxChoices) return this.bell();
	    this.value[this.cursor].selected = true;
	    this.render();
	  }

	  handleSpaceToggle() {
	    const v = this.value[this.cursor];

	    if (v.selected) {
	      v.selected = false;
	      this.render();
	    } else if (v.disabled || this.value.filter(e => e.selected).length >= this.maxChoices) {
	      return this.bell();
	    } else {
	      v.selected = true;
	      this.render();
	    }
	  }

	  toggleAll() {
	    if (this.maxChoices !== undefined || this.value[this.cursor].disabled) {
	      return this.bell();
	    }

	    const newSelected = !this.value[this.cursor].selected;
	    this.value.filter(v => !v.disabled).forEach(v => v.selected = newSelected);
	    this.render();
	  }

	  _(c, key) {
	    if (c === ' ') {
	      this.handleSpaceToggle();
	    } else if (c === 'a') {
	      this.toggleAll();
	    } else {
	      return this.bell();
	    }
	  }

	  renderInstructions() {
	    if (this.instructions === undefined || this.instructions) {
	      if (typeof this.instructions === 'string') {
	        return this.instructions;
	      }

	      return '\nInstructions:\n' + `    ${figures.arrowUp}/${figures.arrowDown}: Highlight option\n` + `    ${figures.arrowLeft}/${figures.arrowRight}/[space]: Toggle selection\n` + (this.maxChoices === undefined ? `    a: Toggle all\n` : '') + `    enter/return: Complete answer`;
	    }

	    return '';
	  }

	  renderOption(cursor, v, i, arrowIndicator) {
	    const prefix = (v.selected ? color.green(figures.radioOn) : figures.radioOff) + ' ' + arrowIndicator + ' ';
	    let title, desc;

	    if (v.disabled) {
	      title = cursor === i ? color.gray().underline(v.title) : color.strikethrough().gray(v.title);
	    } else {
	      title = cursor === i ? color.cyan().underline(v.title) : v.title;

	      if (cursor === i && v.description) {
	        desc = ` - ${v.description}`;

	        if (prefix.length + title.length + desc.length >= this.out.columns || v.description.split(/\r?\n/).length > 1) {
	          desc = '\n' + wrap(v.description, {
	            margin: prefix.length,
	            width: this.out.columns
	          });
	        }
	      }
	    }

	    return prefix + title + color.gray(desc || '');
	  } // shared with autocompleteMultiselect


	  paginateOptions(options) {
	    if (options.length === 0) {
	      return color.red('No matches for this query.');
	    }

	    let _entriesToDisplay = entriesToDisplay(this.cursor, options.length, this.optionsPerPage),
	        startIndex = _entriesToDisplay.startIndex,
	        endIndex = _entriesToDisplay.endIndex;

	    let prefix,
	        styledOptions = [];

	    for (let i = startIndex; i < endIndex; i++) {
	      if (i === startIndex && startIndex > 0) {
	        prefix = figures.arrowUp;
	      } else if (i === endIndex - 1 && endIndex < options.length) {
	        prefix = figures.arrowDown;
	      } else {
	        prefix = ' ';
	      }

	      styledOptions.push(this.renderOption(this.cursor, options[i], i, prefix));
	    }

	    return '\n' + styledOptions.join('\n');
	  } // shared with autocomleteMultiselect


	  renderOptions(options) {
	    if (!this.done) {
	      return this.paginateOptions(options);
	    }

	    return '';
	  }

	  renderDoneOrInstructions() {
	    if (this.done) {
	      return this.value.filter(e => e.selected).map(v => v.title).join(', ');
	    }

	    const output = [color.gray(this.hint), this.renderInstructions()];

	    if (this.value[this.cursor].disabled) {
	      output.push(color.yellow(this.warn));
	    }

	    return output.join(' ');
	  }

	  render() {
	    if (this.closed) return;
	    if (this.firstRender) this.out.write(cursor.hide);
	    super.render(); // print prompt

	    let prompt = [style.symbol(this.done, this.aborted), color.bold(this.msg), style.delimiter(false), this.renderDoneOrInstructions()].join(' ');

	    if (this.showMinError) {
	      prompt += color.red(`You must select a minimum of ${this.minSelected} choices.`);
	      this.showMinError = false;
	    }

	    prompt += this.renderOptions(this.value);
	    this.out.write(this.clear + prompt);
	    this.clear = clear(prompt, this.out.columns);
	  }

	}

	multiselect$1 = MultiselectPrompt;
	return multiselect$1;
}

var autocomplete$1;
var hasRequiredAutocomplete$1;

function requireAutocomplete$1 () {
	if (hasRequiredAutocomplete$1) return autocomplete$1;
	hasRequiredAutocomplete$1 = 1;

	function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

	function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

	const color = requireKleur();

	const Prompt = requirePrompt$1();

	const _require = requireSrc(),
	      erase = _require.erase,
	      cursor = _require.cursor;

	const _require2 = requireUtil$1(),
	      style = _require2.style,
	      clear = _require2.clear,
	      figures = _require2.figures,
	      wrap = _require2.wrap,
	      entriesToDisplay = _require2.entriesToDisplay;

	const getVal = (arr, i) => arr[i] && (arr[i].value || arr[i].title || arr[i]);

	const getTitle = (arr, i) => arr[i] && (arr[i].title || arr[i].value || arr[i]);

	const getIndex = (arr, valOrTitle) => {
	  const index = arr.findIndex(el => el.value === valOrTitle || el.title === valOrTitle);
	  return index > -1 ? index : undefined;
	};
	/**
	 * TextPrompt Base Element
	 * @param {Object} opts Options
	 * @param {String} opts.message Message
	 * @param {Array} opts.choices Array of auto-complete choices objects
	 * @param {Function} [opts.suggest] Filter function. Defaults to sort by title
	 * @param {Number} [opts.limit=10] Max number of results to show
	 * @param {Number} [opts.cursor=0] Cursor start position
	 * @param {String} [opts.style='default'] Render style
	 * @param {String} [opts.fallback] Fallback message - initial to default value
	 * @param {String} [opts.initial] Index of the default value
	 * @param {Boolean} [opts.clearFirst] The first ESCAPE keypress will clear the input
	 * @param {Stream} [opts.stdin] The Readable stream to listen to
	 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
	 * @param {String} [opts.noMatches] The no matches found label
	 */


	class AutocompletePrompt extends Prompt {
	  constructor(opts = {}) {
	    super(opts);
	    this.msg = opts.message;
	    this.suggest = opts.suggest;
	    this.choices = opts.choices;
	    this.initial = typeof opts.initial === 'number' ? opts.initial : getIndex(opts.choices, opts.initial);
	    this.select = this.initial || opts.cursor || 0;
	    this.i18n = {
	      noMatches: opts.noMatches || 'no matches found'
	    };
	    this.fallback = opts.fallback || this.initial;
	    this.clearFirst = opts.clearFirst || false;
	    this.suggestions = [];
	    this.input = '';
	    this.limit = opts.limit || 10;
	    this.cursor = 0;
	    this.transform = style.render(opts.style);
	    this.scale = this.transform.scale;
	    this.render = this.render.bind(this);
	    this.complete = this.complete.bind(this);
	    this.clear = clear('', this.out.columns);
	    this.complete(this.render);
	    this.render();
	  }

	  set fallback(fb) {
	    this._fb = Number.isSafeInteger(parseInt(fb)) ? parseInt(fb) : fb;
	  }

	  get fallback() {
	    let choice;
	    if (typeof this._fb === 'number') choice = this.choices[this._fb];else if (typeof this._fb === 'string') choice = {
	      title: this._fb
	    };
	    return choice || this._fb || {
	      title: this.i18n.noMatches
	    };
	  }

	  moveSelect(i) {
	    this.select = i;
	    if (this.suggestions.length > 0) this.value = getVal(this.suggestions, i);else this.value = this.fallback.value;
	    this.fire();
	  }

	  complete(cb) {
	    var _this = this;

	    return _asyncToGenerator(function* () {
	      const p = _this.completing = _this.suggest(_this.input, _this.choices);

	      const suggestions = yield p;
	      if (_this.completing !== p) return;
	      _this.suggestions = suggestions.map((s, i, arr) => ({
	        title: getTitle(arr, i),
	        value: getVal(arr, i),
	        description: s.description
	      }));
	      _this.completing = false;
	      const l = Math.max(suggestions.length - 1, 0);

	      _this.moveSelect(Math.min(l, _this.select));

	      cb && cb();
	    })();
	  }

	  reset() {
	    this.input = '';
	    this.complete(() => {
	      this.moveSelect(this.initial !== void 0 ? this.initial : 0);
	      this.render();
	    });
	    this.render();
	  }

	  exit() {
	    if (this.clearFirst && this.input.length > 0) {
	      this.reset();
	    } else {
	      this.done = this.exited = true;
	      this.aborted = false;
	      this.fire();
	      this.render();
	      this.out.write('\n');
	      this.close();
	    }
	  }

	  abort() {
	    this.done = this.aborted = true;
	    this.exited = false;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  submit() {
	    this.done = true;
	    this.aborted = this.exited = false;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  _(c, key) {
	    let s1 = this.input.slice(0, this.cursor);
	    let s2 = this.input.slice(this.cursor);
	    this.input = `${s1}${c}${s2}`;
	    this.cursor = s1.length + 1;
	    this.complete(this.render);
	    this.render();
	  }

	  delete() {
	    if (this.cursor === 0) return this.bell();
	    let s1 = this.input.slice(0, this.cursor - 1);
	    let s2 = this.input.slice(this.cursor);
	    this.input = `${s1}${s2}`;
	    this.complete(this.render);
	    this.cursor = this.cursor - 1;
	    this.render();
	  }

	  deleteForward() {
	    if (this.cursor * this.scale >= this.rendered.length) return this.bell();
	    let s1 = this.input.slice(0, this.cursor);
	    let s2 = this.input.slice(this.cursor + 1);
	    this.input = `${s1}${s2}`;
	    this.complete(this.render);
	    this.render();
	  }

	  first() {
	    this.moveSelect(0);
	    this.render();
	  }

	  last() {
	    this.moveSelect(this.suggestions.length - 1);
	    this.render();
	  }

	  up() {
	    if (this.select === 0) {
	      this.moveSelect(this.suggestions.length - 1);
	    } else {
	      this.moveSelect(this.select - 1);
	    }

	    this.render();
	  }

	  down() {
	    if (this.select === this.suggestions.length - 1) {
	      this.moveSelect(0);
	    } else {
	      this.moveSelect(this.select + 1);
	    }

	    this.render();
	  }

	  next() {
	    if (this.select === this.suggestions.length - 1) {
	      this.moveSelect(0);
	    } else this.moveSelect(this.select + 1);

	    this.render();
	  }

	  nextPage() {
	    this.moveSelect(Math.min(this.select + this.limit, this.suggestions.length - 1));
	    this.render();
	  }

	  prevPage() {
	    this.moveSelect(Math.max(this.select - this.limit, 0));
	    this.render();
	  }

	  left() {
	    if (this.cursor <= 0) return this.bell();
	    this.cursor = this.cursor - 1;
	    this.render();
	  }

	  right() {
	    if (this.cursor * this.scale >= this.rendered.length) return this.bell();
	    this.cursor = this.cursor + 1;
	    this.render();
	  }

	  renderOption(v, hovered, isStart, isEnd) {
	    let desc;
	    let prefix = isStart ? figures.arrowUp : isEnd ? figures.arrowDown : ' ';
	    let title = hovered ? color.cyan().underline(v.title) : v.title;
	    prefix = (hovered ? color.cyan(figures.pointer) + ' ' : '  ') + prefix;

	    if (v.description) {
	      desc = ` - ${v.description}`;

	      if (prefix.length + title.length + desc.length >= this.out.columns || v.description.split(/\r?\n/).length > 1) {
	        desc = '\n' + wrap(v.description, {
	          margin: 3,
	          width: this.out.columns
	        });
	      }
	    }

	    return prefix + ' ' + title + color.gray(desc || '');
	  }

	  render() {
	    if (this.closed) return;
	    if (this.firstRender) this.out.write(cursor.hide);else this.out.write(clear(this.outputText, this.out.columns));
	    super.render();

	    let _entriesToDisplay = entriesToDisplay(this.select, this.choices.length, this.limit),
	        startIndex = _entriesToDisplay.startIndex,
	        endIndex = _entriesToDisplay.endIndex;

	    this.outputText = [style.symbol(this.done, this.aborted, this.exited), color.bold(this.msg), style.delimiter(this.completing), this.done && this.suggestions[this.select] ? this.suggestions[this.select].title : this.rendered = this.transform.render(this.input)].join(' ');

	    if (!this.done) {
	      const suggestions = this.suggestions.slice(startIndex, endIndex).map((item, i) => this.renderOption(item, this.select === i + startIndex, i === 0 && startIndex > 0, i + startIndex === endIndex - 1 && endIndex < this.choices.length)).join('\n');
	      this.outputText += `\n` + (suggestions || color.gray(this.fallback.title));
	    }

	    this.out.write(erase.line + cursor.to(0) + this.outputText);
	  }

	}

	autocomplete$1 = AutocompletePrompt;
	return autocomplete$1;
}

var autocompleteMultiselect$1;
var hasRequiredAutocompleteMultiselect$1;

function requireAutocompleteMultiselect$1 () {
	if (hasRequiredAutocompleteMultiselect$1) return autocompleteMultiselect$1;
	hasRequiredAutocompleteMultiselect$1 = 1;

	const color = requireKleur();

	const _require = requireSrc(),
	      cursor = _require.cursor;

	const MultiselectPrompt = requireMultiselect$1();

	const _require2 = requireUtil$1(),
	      clear = _require2.clear,
	      style = _require2.style,
	      figures = _require2.figures;
	/**
	 * MultiselectPrompt Base Element
	 * @param {Object} opts Options
	 * @param {String} opts.message Message
	 * @param {Array} opts.choices Array of choice objects
	 * @param {String} [opts.hint] Hint to display
	 * @param {String} [opts.warn] Hint shown for disabled choices
	 * @param {Number} [opts.max] Max choices
	 * @param {Number} [opts.cursor=0] Cursor start position
	 * @param {Stream} [opts.stdin] The Readable stream to listen to
	 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
	 */


	class AutocompleteMultiselectPrompt extends MultiselectPrompt {
	  constructor(opts = {}) {
	    opts.overrideRender = true;
	    super(opts);
	    this.inputValue = '';
	    this.clear = clear('', this.out.columns);
	    this.filteredOptions = this.value;
	    this.render();
	  }

	  last() {
	    this.cursor = this.filteredOptions.length - 1;
	    this.render();
	  }

	  next() {
	    this.cursor = (this.cursor + 1) % this.filteredOptions.length;
	    this.render();
	  }

	  up() {
	    if (this.cursor === 0) {
	      this.cursor = this.filteredOptions.length - 1;
	    } else {
	      this.cursor--;
	    }

	    this.render();
	  }

	  down() {
	    if (this.cursor === this.filteredOptions.length - 1) {
	      this.cursor = 0;
	    } else {
	      this.cursor++;
	    }

	    this.render();
	  }

	  left() {
	    this.filteredOptions[this.cursor].selected = false;
	    this.render();
	  }

	  right() {
	    if (this.value.filter(e => e.selected).length >= this.maxChoices) return this.bell();
	    this.filteredOptions[this.cursor].selected = true;
	    this.render();
	  }

	  delete() {
	    if (this.inputValue.length) {
	      this.inputValue = this.inputValue.substr(0, this.inputValue.length - 1);
	      this.updateFilteredOptions();
	    }
	  }

	  updateFilteredOptions() {
	    const currentHighlight = this.filteredOptions[this.cursor];
	    this.filteredOptions = this.value.filter(v => {
	      if (this.inputValue) {
	        if (typeof v.title === 'string') {
	          if (v.title.toLowerCase().includes(this.inputValue.toLowerCase())) {
	            return true;
	          }
	        }

	        if (typeof v.value === 'string') {
	          if (v.value.toLowerCase().includes(this.inputValue.toLowerCase())) {
	            return true;
	          }
	        }

	        return false;
	      }

	      return true;
	    });
	    const newHighlightIndex = this.filteredOptions.findIndex(v => v === currentHighlight);
	    this.cursor = newHighlightIndex < 0 ? 0 : newHighlightIndex;
	    this.render();
	  }

	  handleSpaceToggle() {
	    const v = this.filteredOptions[this.cursor];

	    if (v.selected) {
	      v.selected = false;
	      this.render();
	    } else if (v.disabled || this.value.filter(e => e.selected).length >= this.maxChoices) {
	      return this.bell();
	    } else {
	      v.selected = true;
	      this.render();
	    }
	  }

	  handleInputChange(c) {
	    this.inputValue = this.inputValue + c;
	    this.updateFilteredOptions();
	  }

	  _(c, key) {
	    if (c === ' ') {
	      this.handleSpaceToggle();
	    } else {
	      this.handleInputChange(c);
	    }
	  }

	  renderInstructions() {
	    if (this.instructions === undefined || this.instructions) {
	      if (typeof this.instructions === 'string') {
	        return this.instructions;
	      }

	      return `
Instructions:
    ${figures.arrowUp}/${figures.arrowDown}: Highlight option
    ${figures.arrowLeft}/${figures.arrowRight}/[space]: Toggle selection
    [a,b,c]/delete: Filter choices
    enter/return: Complete answer
`;
	    }

	    return '';
	  }

	  renderCurrentInput() {
	    return `
Filtered results for: ${this.inputValue ? this.inputValue : color.gray('Enter something to filter')}\n`;
	  }

	  renderOption(cursor, v, i) {
	    let title;
	    if (v.disabled) title = cursor === i ? color.gray().underline(v.title) : color.strikethrough().gray(v.title);else title = cursor === i ? color.cyan().underline(v.title) : v.title;
	    return (v.selected ? color.green(figures.radioOn) : figures.radioOff) + '  ' + title;
	  }

	  renderDoneOrInstructions() {
	    if (this.done) {
	      return this.value.filter(e => e.selected).map(v => v.title).join(', ');
	    }

	    const output = [color.gray(this.hint), this.renderInstructions(), this.renderCurrentInput()];

	    if (this.filteredOptions.length && this.filteredOptions[this.cursor].disabled) {
	      output.push(color.yellow(this.warn));
	    }

	    return output.join(' ');
	  }

	  render() {
	    if (this.closed) return;
	    if (this.firstRender) this.out.write(cursor.hide);
	    super.render(); // print prompt

	    let prompt = [style.symbol(this.done, this.aborted), color.bold(this.msg), style.delimiter(false), this.renderDoneOrInstructions()].join(' ');

	    if (this.showMinError) {
	      prompt += color.red(`You must select a minimum of ${this.minSelected} choices.`);
	      this.showMinError = false;
	    }

	    prompt += this.renderOptions(this.filteredOptions);
	    this.out.write(this.clear + prompt);
	    this.clear = clear(prompt, this.out.columns);
	  }

	}

	autocompleteMultiselect$1 = AutocompleteMultiselectPrompt;
	return autocompleteMultiselect$1;
}

var confirm$1;
var hasRequiredConfirm$1;

function requireConfirm$1 () {
	if (hasRequiredConfirm$1) return confirm$1;
	hasRequiredConfirm$1 = 1;

	const color = requireKleur();

	const Prompt = requirePrompt$1();

	const _require = requireUtil$1(),
	      style = _require.style,
	      clear = _require.clear;

	const _require2 = requireSrc(),
	      erase = _require2.erase,
	      cursor = _require2.cursor;
	/**
	 * ConfirmPrompt Base Element
	 * @param {Object} opts Options
	 * @param {String} opts.message Message
	 * @param {Boolean} [opts.initial] Default value (true/false)
	 * @param {Stream} [opts.stdin] The Readable stream to listen to
	 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
	 * @param {String} [opts.yes] The "Yes" label
	 * @param {String} [opts.yesOption] The "Yes" option when choosing between yes/no
	 * @param {String} [opts.no] The "No" label
	 * @param {String} [opts.noOption] The "No" option when choosing between yes/no
	 */


	class ConfirmPrompt extends Prompt {
	  constructor(opts = {}) {
	    super(opts);
	    this.msg = opts.message;
	    this.value = opts.initial;
	    this.initialValue = !!opts.initial;
	    this.yesMsg = opts.yes || 'yes';
	    this.yesOption = opts.yesOption || '(Y/n)';
	    this.noMsg = opts.no || 'no';
	    this.noOption = opts.noOption || '(y/N)';
	    this.render();
	  }

	  reset() {
	    this.value = this.initialValue;
	    this.fire();
	    this.render();
	  }

	  exit() {
	    this.abort();
	  }

	  abort() {
	    this.done = this.aborted = true;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  submit() {
	    this.value = this.value || false;
	    this.done = true;
	    this.aborted = false;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  _(c, key) {
	    if (c.toLowerCase() === 'y') {
	      this.value = true;
	      return this.submit();
	    }

	    if (c.toLowerCase() === 'n') {
	      this.value = false;
	      return this.submit();
	    }

	    return this.bell();
	  }

	  render() {
	    if (this.closed) return;
	    if (this.firstRender) this.out.write(cursor.hide);else this.out.write(clear(this.outputText, this.out.columns));
	    super.render();
	    this.outputText = [style.symbol(this.done, this.aborted), color.bold(this.msg), style.delimiter(this.done), this.done ? this.value ? this.yesMsg : this.noMsg : color.gray(this.initialValue ? this.yesOption : this.noOption)].join(' ');
	    this.out.write(erase.line + cursor.to(0) + this.outputText);
	  }

	}

	confirm$1 = ConfirmPrompt;
	return confirm$1;
}

var elements$1;
var hasRequiredElements$1;

function requireElements$1 () {
	if (hasRequiredElements$1) return elements$1;
	hasRequiredElements$1 = 1;

	elements$1 = {
	  TextPrompt: requireText$1(),
	  SelectPrompt: requireSelect$1(),
	  TogglePrompt: requireToggle$1(),
	  DatePrompt: requireDate$1(),
	  NumberPrompt: requireNumber$1(),
	  MultiselectPrompt: requireMultiselect$1(),
	  AutocompletePrompt: requireAutocomplete$1(),
	  AutocompleteMultiselectPrompt: requireAutocompleteMultiselect$1(),
	  ConfirmPrompt: requireConfirm$1()
	};
	return elements$1;
}

var hasRequiredPrompts$2;

function requirePrompts$2 () {
	if (hasRequiredPrompts$2) return prompts$2;
	hasRequiredPrompts$2 = 1;
	(function (exports) {

		const $ = exports;

		const el = requireElements$1();

		const noop = v => v;

		function toPrompt(type, args, opts = {}) {
		  return new Promise((res, rej) => {
		    const p = new el[type](args);
		    const onAbort = opts.onAbort || noop;
		    const onSubmit = opts.onSubmit || noop;
		    const onExit = opts.onExit || noop;
		    p.on('state', args.onState || noop);
		    p.on('submit', x => res(onSubmit(x)));
		    p.on('exit', x => res(onExit(x)));
		    p.on('abort', x => rej(onAbort(x)));
		  });
		}
		/**
		 * Text prompt
		 * @param {string} args.message Prompt message to display
		 * @param {string} [args.initial] Default string value
		 * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
		 * @param {function} [args.onState] On state change callback
		 * @param {function} [args.validate] Function to validate user input
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input
		 */


		$.text = args => toPrompt('TextPrompt', args);
		/**
		 * Password prompt with masked input
		 * @param {string} args.message Prompt message to display
		 * @param {string} [args.initial] Default string value
		 * @param {function} [args.onState] On state change callback
		 * @param {function} [args.validate] Function to validate user input
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input
		 */


		$.password = args => {
		  args.style = 'password';
		  return $.text(args);
		};
		/**
		 * Prompt where input is invisible, like sudo
		 * @param {string} args.message Prompt message to display
		 * @param {string} [args.initial] Default string value
		 * @param {function} [args.onState] On state change callback
		 * @param {function} [args.validate] Function to validate user input
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input
		 */


		$.invisible = args => {
		  args.style = 'invisible';
		  return $.text(args);
		};
		/**
		 * Number prompt
		 * @param {string} args.message Prompt message to display
		 * @param {number} args.initial Default number value
		 * @param {function} [args.onState] On state change callback
		 * @param {number} [args.max] Max value
		 * @param {number} [args.min] Min value
		 * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
		 * @param {Boolean} [opts.float=false] Parse input as floats
		 * @param {Number} [opts.round=2] Round floats to x decimals
		 * @param {Number} [opts.increment=1] Number to increment by when using arrow-keys
		 * @param {function} [args.validate] Function to validate user input
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input
		 */


		$.number = args => toPrompt('NumberPrompt', args);
		/**
		 * Date prompt
		 * @param {string} args.message Prompt message to display
		 * @param {number} args.initial Default number value
		 * @param {function} [args.onState] On state change callback
		 * @param {number} [args.max] Max value
		 * @param {number} [args.min] Min value
		 * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
		 * @param {Boolean} [opts.float=false] Parse input as floats
		 * @param {Number} [opts.round=2] Round floats to x decimals
		 * @param {Number} [opts.increment=1] Number to increment by when using arrow-keys
		 * @param {function} [args.validate] Function to validate user input
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input
		 */


		$.date = args => toPrompt('DatePrompt', args);
		/**
		 * Classic yes/no prompt
		 * @param {string} args.message Prompt message to display
		 * @param {boolean} [args.initial=false] Default value
		 * @param {function} [args.onState] On state change callback
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input
		 */


		$.confirm = args => toPrompt('ConfirmPrompt', args);
		/**
		 * List prompt, split intput string by `seperator`
		 * @param {string} args.message Prompt message to display
		 * @param {string} [args.initial] Default string value
		 * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
		 * @param {string} [args.separator] String separator
		 * @param {function} [args.onState] On state change callback
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input, in form of an `Array`
		 */


		$.list = args => {
		  const sep = args.separator || ',';
		  return toPrompt('TextPrompt', args, {
		    onSubmit: str => str.split(sep).map(s => s.trim())
		  });
		};
		/**
		 * Toggle/switch prompt
		 * @param {string} args.message Prompt message to display
		 * @param {boolean} [args.initial=false] Default value
		 * @param {string} [args.active="on"] Text for `active` state
		 * @param {string} [args.inactive="off"] Text for `inactive` state
		 * @param {function} [args.onState] On state change callback
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input
		 */


		$.toggle = args => toPrompt('TogglePrompt', args);
		/**
		 * Interactive select prompt
		 * @param {string} args.message Prompt message to display
		 * @param {Array} args.choices Array of choices objects `[{ title, value }, ...]`
		 * @param {number} [args.initial] Index of default value
		 * @param {String} [args.hint] Hint to display
		 * @param {function} [args.onState] On state change callback
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input
		 */


		$.select = args => toPrompt('SelectPrompt', args);
		/**
		 * Interactive multi-select / autocompleteMultiselect prompt
		 * @param {string} args.message Prompt message to display
		 * @param {Array} args.choices Array of choices objects `[{ title, value, [selected] }, ...]`
		 * @param {number} [args.max] Max select
		 * @param {string} [args.hint] Hint to display user
		 * @param {Number} [args.cursor=0] Cursor start position
		 * @param {function} [args.onState] On state change callback
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input
		 */


		$.multiselect = args => {
		  args.choices = [].concat(args.choices || []);

		  const toSelected = items => items.filter(item => item.selected).map(item => item.value);

		  return toPrompt('MultiselectPrompt', args, {
		    onAbort: toSelected,
		    onSubmit: toSelected
		  });
		};

		$.autocompleteMultiselect = args => {
		  args.choices = [].concat(args.choices || []);

		  const toSelected = items => items.filter(item => item.selected).map(item => item.value);

		  return toPrompt('AutocompleteMultiselectPrompt', args, {
		    onAbort: toSelected,
		    onSubmit: toSelected
		  });
		};

		const byTitle = (input, choices) => Promise.resolve(choices.filter(item => item.title.slice(0, input.length).toLowerCase() === input.toLowerCase()));
		/**
		 * Interactive auto-complete prompt
		 * @param {string} args.message Prompt message to display
		 * @param {Array} args.choices Array of auto-complete choices objects `[{ title, value }, ...]`
		 * @param {Function} [args.suggest] Function to filter results based on user input. Defaults to sort by `title`
		 * @param {number} [args.limit=10] Max number of results to show
		 * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
		 * @param {String} [args.initial] Index of the default value
		 * @param {boolean} [opts.clearFirst] The first ESCAPE keypress will clear the input
		 * @param {String} [args.fallback] Fallback message - defaults to initial value
		 * @param {function} [args.onState] On state change callback
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input
		 */


		$.autocomplete = args => {
		  args.suggest = args.suggest || byTitle;
		  args.choices = [].concat(args.choices || []);
		  return toPrompt('AutocompletePrompt', args);
		}; 
	} (prompts$2));
	return prompts$2;
}

var dist;
var hasRequiredDist;

function requireDist () {
	if (hasRequiredDist) return dist;
	hasRequiredDist = 1;

	function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

	function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike) { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

	function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

	function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }

	function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

	function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

	const prompts = requirePrompts$2();

	const passOn = ['suggest', 'format', 'onState', 'validate', 'onRender', 'type'];

	const noop = () => {};
	/**
	 * Prompt for a series of questions
	 * @param {Array|Object} questions Single question object or Array of question objects
	 * @param {Function} [onSubmit] Callback function called on prompt submit
	 * @param {Function} [onCancel] Callback function called on cancel/abort
	 * @returns {Object} Object with values from user input
	 */


	function prompt() {
	  return _prompt.apply(this, arguments);
	}

	function _prompt() {
	  _prompt = _asyncToGenerator(function* (questions = [], {
	    onSubmit = noop,
	    onCancel = noop
	  } = {}) {
	    const answers = {};
	    const override = prompt._override || {};
	    questions = [].concat(questions);
	    let answer, question, quit, name, type, lastPrompt;

	    const getFormattedAnswer = /*#__PURE__*/function () {
	      var _ref = _asyncToGenerator(function* (question, answer, skipValidation = false) {
	        if (!skipValidation && question.validate && question.validate(answer) !== true) {
	          return;
	        }

	        return question.format ? yield question.format(answer, answers) : answer;
	      });

	      return function getFormattedAnswer(_x, _x2) {
	        return _ref.apply(this, arguments);
	      };
	    }();

	    var _iterator = _createForOfIteratorHelper(questions),
	        _step;

	    try {
	      for (_iterator.s(); !(_step = _iterator.n()).done;) {
	        question = _step.value;
	        var _question = question;
	        name = _question.name;
	        type = _question.type;

	        // evaluate type first and skip if type is a falsy value
	        if (typeof type === 'function') {
	          type = yield type(answer, _objectSpread({}, answers), question);
	          question['type'] = type;
	        }

	        if (!type) continue; // if property is a function, invoke it unless it's a special function

	        for (let key in question) {
	          if (passOn.includes(key)) continue;
	          let value = question[key];
	          question[key] = typeof value === 'function' ? yield value(answer, _objectSpread({}, answers), lastPrompt) : value;
	        }

	        lastPrompt = question;

	        if (typeof question.message !== 'string') {
	          throw new Error('prompt message is required');
	        } // update vars in case they changed


	        var _question2 = question;
	        name = _question2.name;
	        type = _question2.type;

	        if (prompts[type] === void 0) {
	          throw new Error(`prompt type (${type}) is not defined`);
	        }

	        if (override[question.name] !== undefined) {
	          answer = yield getFormattedAnswer(question, override[question.name]);

	          if (answer !== undefined) {
	            answers[name] = answer;
	            continue;
	          }
	        }

	        try {
	          // Get the injected answer if there is one or prompt the user
	          answer = prompt._injected ? getInjectedAnswer(prompt._injected, question.initial) : yield prompts[type](question);
	          answers[name] = answer = yield getFormattedAnswer(question, answer, true);
	          quit = yield onSubmit(question, answer, answers);
	        } catch (err) {
	          quit = !(yield onCancel(question, answers));
	        }

	        if (quit) return answers;
	      }
	    } catch (err) {
	      _iterator.e(err);
	    } finally {
	      _iterator.f();
	    }

	    return answers;
	  });
	  return _prompt.apply(this, arguments);
	}

	function getInjectedAnswer(injected, deafultValue) {
	  const answer = injected.shift();

	  if (answer instanceof Error) {
	    throw answer;
	  }

	  return answer === undefined ? deafultValue : answer;
	}

	function inject(answers) {
	  prompt._injected = (prompt._injected || []).concat(answers);
	}

	function override(answers) {
	  prompt._override = Object.assign({}, answers);
	}

	dist = Object.assign(prompt, {
	  prompt,
	  prompts,
	  inject,
	  override
	});
	return dist;
}

var prompts$1 = {};

var action;
var hasRequiredAction;

function requireAction () {
	if (hasRequiredAction) return action;
	hasRequiredAction = 1;

	action = (key, isSelect) => {
	  if (key.meta && key.name !== 'escape') return;
	  
	  if (key.ctrl) {
	    if (key.name === 'a') return 'first';
	    if (key.name === 'c') return 'abort';
	    if (key.name === 'd') return 'abort';
	    if (key.name === 'e') return 'last';
	    if (key.name === 'g') return 'reset';
	  }
	  
	  if (isSelect) {
	    if (key.name === 'j') return 'down';
	    if (key.name === 'k') return 'up';
	  }

	  if (key.name === 'return') return 'submit';
	  if (key.name === 'enter') return 'submit'; // ctrl + J
	  if (key.name === 'backspace') return 'delete';
	  if (key.name === 'delete') return 'deleteForward';
	  if (key.name === 'abort') return 'abort';
	  if (key.name === 'escape') return 'exit';
	  if (key.name === 'tab') return 'next';
	  if (key.name === 'pagedown') return 'nextPage';
	  if (key.name === 'pageup') return 'prevPage';
	  // TODO create home() in prompt types (e.g. TextPrompt)
	  if (key.name === 'home') return 'home';
	  // TODO create end() in prompt types (e.g. TextPrompt)
	  if (key.name === 'end') return 'end';

	  if (key.name === 'up') return 'up';
	  if (key.name === 'down') return 'down';
	  if (key.name === 'right') return 'right';
	  if (key.name === 'left') return 'left';

	  return false;
	};
	return action;
}

var strip;
var hasRequiredStrip;

function requireStrip () {
	if (hasRequiredStrip) return strip;
	hasRequiredStrip = 1;

	strip = str => {
	  const pattern = [
	    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
	    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))'
	  ].join('|');

	  const RGX = new RegExp(pattern, 'g');
	  return typeof str === 'string' ? str.replace(RGX, '') : str;
	};
	return strip;
}

var clear;
var hasRequiredClear;

function requireClear () {
	if (hasRequiredClear) return clear;
	hasRequiredClear = 1;

	const strip = requireStrip();
	const { erase, cursor } = requireSrc();

	const width = str => [...strip(str)].length;

	/**
	 * @param {string} prompt
	 * @param {number} perLine
	 */
	clear = function(prompt, perLine) {
	  if (!perLine) return erase.line + cursor.to(0);

	  let rows = 0;
	  const lines = prompt.split(/\r?\n/);
	  for (let line of lines) {
	    rows += 1 + Math.floor(Math.max(width(line) - 1, 0) / perLine);
	  }

	  return erase.lines(rows);
	};
	return clear;
}

var figures_1;
var hasRequiredFigures;

function requireFigures () {
	if (hasRequiredFigures) return figures_1;
	hasRequiredFigures = 1;

	 const main = {
	  arrowUp: '↑',
	  arrowDown: '↓',
	  arrowLeft: '←',
	  arrowRight: '→',
	  radioOn: '◉',
	  radioOff: '◯',
	  tick: '✔',	
	  cross: '✖',	
	  ellipsis: '…',	
	  pointerSmall: '›',	
	  line: '─',	
	  pointer: '❯'	
	};	
	const win = {
	  arrowUp: main.arrowUp,
	  arrowDown: main.arrowDown,
	  arrowLeft: main.arrowLeft,
	  arrowRight: main.arrowRight,
	  radioOn: '(*)',
	  radioOff: '( )',	
	  tick: '√',	
	  cross: '×',	
	  ellipsis: '...',	
	  pointerSmall: '»',	
	  line: '─',	
	  pointer: '>'	
	};	
	const figures = process.platform === 'win32' ? win : main;	

	 figures_1 = figures;
	return figures_1;
}

var style;
var hasRequiredStyle;

function requireStyle () {
	if (hasRequiredStyle) return style;
	hasRequiredStyle = 1;

	const c = requireKleur();
	const figures = requireFigures();

	// rendering user input.
	const styles = Object.freeze({
	  password: { scale: 1, render: input => '*'.repeat(input.length) },
	  emoji: { scale: 2, render: input => '😃'.repeat(input.length) },
	  invisible: { scale: 0, render: input => '' },
	  default: { scale: 1, render: input => `${input}` }
	});
	const render = type => styles[type] || styles.default;

	// icon to signalize a prompt.
	const symbols = Object.freeze({
	  aborted: c.red(figures.cross),
	  done: c.green(figures.tick),
	  exited: c.yellow(figures.cross),
	  default: c.cyan('?')
	});

	const symbol = (done, aborted, exited) =>
	  aborted ? symbols.aborted : exited ? symbols.exited : done ? symbols.done : symbols.default;

	// between the question and the user's input.
	const delimiter = completing =>
	  c.gray(completing ? figures.ellipsis : figures.pointerSmall);

	const item = (expandable, expanded) =>
	  c.gray(expandable ? (expanded ? figures.pointerSmall : '+') : figures.line);

	style = {
	  styles,
	  render,
	  symbols,
	  symbol,
	  delimiter,
	  item
	};
	return style;
}

var lines;
var hasRequiredLines;

function requireLines () {
	if (hasRequiredLines) return lines;
	hasRequiredLines = 1;

	const strip = requireStrip();

	/**
	 * @param {string} msg
	 * @param {number} perLine
	 */
	lines = function (msg, perLine) {
	  let lines = String(strip(msg) || '').split(/\r?\n/);

	  if (!perLine) return lines.length;
	  return lines.map(l => Math.ceil(l.length / perLine))
	      .reduce((a, b) => a + b);
	};
	return lines;
}

var wrap;
var hasRequiredWrap;

function requireWrap () {
	if (hasRequiredWrap) return wrap;
	hasRequiredWrap = 1;

	/**
	 * @param {string} msg The message to wrap
	 * @param {object} opts
	 * @param {number|string} [opts.margin] Left margin
	 * @param {number} opts.width Maximum characters per line including the margin
	 */
	wrap = (msg, opts = {}) => {
	  const tab = Number.isSafeInteger(parseInt(opts.margin))
	    ? new Array(parseInt(opts.margin)).fill(' ').join('')
	    : (opts.margin || '');

	  const width = opts.width;

	  return (msg || '').split(/\r?\n/g)
	    .map(line => line
	      .split(/\s+/g)
	      .reduce((arr, w) => {
	        if (w.length + tab.length >= width || arr[arr.length - 1].length + w.length + 1 < width)
	          arr[arr.length - 1] += ` ${w}`;
	        else arr.push(`${tab}${w}`);
	        return arr;
	      }, [ tab ])
	      .join('\n'))
	    .join('\n');
	};
	return wrap;
}

var entriesToDisplay;
var hasRequiredEntriesToDisplay;

function requireEntriesToDisplay () {
	if (hasRequiredEntriesToDisplay) return entriesToDisplay;
	hasRequiredEntriesToDisplay = 1;

	/**
	 * Determine what entries should be displayed on the screen, based on the
	 * currently selected index and the maximum visible. Used in list-based
	 * prompts like `select` and `multiselect`.
	 *
	 * @param {number} cursor the currently selected entry
	 * @param {number} total the total entries available to display
	 * @param {number} [maxVisible] the number of entries that can be displayed
	 */
	entriesToDisplay = (cursor, total, maxVisible)  => {
	  maxVisible = maxVisible || total;

	  let startIndex = Math.min(total- maxVisible, cursor - Math.floor(maxVisible / 2));
	  if (startIndex < 0) startIndex = 0;

	  let endIndex = Math.min(startIndex + maxVisible, total);

	  return { startIndex, endIndex };
	};
	return entriesToDisplay;
}

var util;
var hasRequiredUtil;

function requireUtil () {
	if (hasRequiredUtil) return util;
	hasRequiredUtil = 1;

	util = {
	  action: requireAction(),
	  clear: requireClear(),
	  style: requireStyle(),
	  strip: requireStrip(),
	  figures: requireFigures(),
	  lines: requireLines(),
	  wrap: requireWrap(),
	  entriesToDisplay: requireEntriesToDisplay()
	};
	return util;
}

var prompt$1;
var hasRequiredPrompt;

function requirePrompt () {
	if (hasRequiredPrompt) return prompt$1;
	hasRequiredPrompt = 1;

	const readline = require$$0$4;
	const { action } = requireUtil();
	const EventEmitter = require$$0$3;
	const { beep, cursor } = requireSrc();
	const color = requireKleur();

	/**
	 * Base prompt skeleton
	 * @param {Stream} [opts.stdin] The Readable stream to listen to
	 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
	 */
	class Prompt extends EventEmitter {
	  constructor(opts={}) {
	    super();

	    this.firstRender = true;
	    this.in = opts.stdin || process.stdin;
	    this.out = opts.stdout || process.stdout;
	    this.onRender = (opts.onRender || (() => void 0)).bind(this);
	    const rl = readline.createInterface({ input:this.in, escapeCodeTimeout:50 });
	    readline.emitKeypressEvents(this.in, rl);

	    if (this.in.isTTY) this.in.setRawMode(true);
	    const isSelect = [ 'SelectPrompt', 'MultiselectPrompt' ].indexOf(this.constructor.name) > -1;
	    const keypress = (str, key) => {
	      let a = action(key, isSelect);
	      if (a === false) {
	        this._ && this._(str, key);
	      } else if (typeof this[a] === 'function') {
	        this[a](key);
	      } else {
	        this.bell();
	      }
	    };

	    this.close = () => {
	      this.out.write(cursor.show);
	      this.in.removeListener('keypress', keypress);
	      if (this.in.isTTY) this.in.setRawMode(false);
	      rl.close();
	      this.emit(this.aborted ? 'abort' : this.exited ? 'exit' : 'submit', this.value);
	      this.closed = true;
	    };

	    this.in.on('keypress', keypress);
	  }

	  fire() {
	    this.emit('state', {
	      value: this.value,
	      aborted: !!this.aborted,
	      exited: !!this.exited
	    });
	  }

	  bell() {
	    this.out.write(beep);
	  }

	  render() {
	    this.onRender(color);
	    if (this.firstRender) this.firstRender = false;
	  }
	}

	prompt$1 = Prompt;
	return prompt$1;
}

var text;
var hasRequiredText;

function requireText () {
	if (hasRequiredText) return text;
	hasRequiredText = 1;
	const color = requireKleur();
	const Prompt = requirePrompt();
	const { erase, cursor } = requireSrc();
	const { style, clear, lines, figures } = requireUtil();

	/**
	 * TextPrompt Base Element
	 * @param {Object} opts Options
	 * @param {String} opts.message Message
	 * @param {String} [opts.style='default'] Render style
	 * @param {String} [opts.initial] Default value
	 * @param {Function} [opts.validate] Validate function
	 * @param {Stream} [opts.stdin] The Readable stream to listen to
	 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
	 * @param {String} [opts.error] The invalid error label
	 */
	class TextPrompt extends Prompt {
	  constructor(opts={}) {
	    super(opts);
	    this.transform = style.render(opts.style);
	    this.scale = this.transform.scale;
	    this.msg = opts.message;
	    this.initial = opts.initial || ``;
	    this.validator = opts.validate || (() => true);
	    this.value = ``;
	    this.errorMsg = opts.error || `Please Enter A Valid Value`;
	    this.cursor = Number(!!this.initial);
	    this.cursorOffset = 0;
	    this.clear = clear(``, this.out.columns);
	    this.render();
	  }

	  set value(v) {
	    if (!v && this.initial) {
	      this.placeholder = true;
	      this.rendered = color.gray(this.transform.render(this.initial));
	    } else {
	      this.placeholder = false;
	      this.rendered = this.transform.render(v);
	    }
	    this._value = v;
	    this.fire();
	  }

	  get value() {
	    return this._value;
	  }

	  reset() {
	    this.value = ``;
	    this.cursor = Number(!!this.initial);
	    this.cursorOffset = 0;
	    this.fire();
	    this.render();
	  }

	  exit() {
	    this.abort();
	  }

	  abort() {
	    this.value = this.value || this.initial;
	    this.done = this.aborted = true;
	    this.error = false;
	    this.red = false;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  async validate() {
	    let valid = await this.validator(this.value);
	    if (typeof valid === `string`) {
	      this.errorMsg = valid;
	      valid = false;
	    }
	    this.error = !valid;
	  }

	  async submit() {
	    this.value = this.value || this.initial;
	    this.cursorOffset = 0;
	    this.cursor = this.rendered.length;
	    await this.validate();
	    if (this.error) {
	      this.red = true;
	      this.fire();
	      this.render();
	      return;
	    }
	    this.done = true;
	    this.aborted = false;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  next() {
	    if (!this.placeholder) return this.bell();
	    this.value = this.initial;
	    this.cursor = this.rendered.length;
	    this.fire();
	    this.render();
	  }

	  moveCursor(n) {
	    if (this.placeholder) return;
	    this.cursor = this.cursor+n;
	    this.cursorOffset += n;
	  }

	  _(c, key) {
	    let s1 = this.value.slice(0, this.cursor);
	    let s2 = this.value.slice(this.cursor);
	    this.value = `${s1}${c}${s2}`;
	    this.red = false;
	    this.cursor = this.placeholder ? 0 : s1.length+1;
	    this.render();
	  }

	  delete() {
	    if (this.isCursorAtStart()) return this.bell();
	    let s1 = this.value.slice(0, this.cursor-1);
	    let s2 = this.value.slice(this.cursor);
	    this.value = `${s1}${s2}`;
	    this.red = false;
	    if (this.isCursorAtStart()) {
	      this.cursorOffset = 0;
	    } else {
	      this.cursorOffset++;
	      this.moveCursor(-1);
	    }
	    this.render();
	  }

	  deleteForward() {
	    if(this.cursor*this.scale >= this.rendered.length || this.placeholder) return this.bell();
	    let s1 = this.value.slice(0, this.cursor);
	    let s2 = this.value.slice(this.cursor+1);
	    this.value = `${s1}${s2}`;
	    this.red = false;
	    if (this.isCursorAtEnd()) {
	      this.cursorOffset = 0;
	    } else {
	      this.cursorOffset++;
	    }
	    this.render();
	  }

	  first() {
	    this.cursor = 0;
	    this.render();
	  }

	  last() {
	    this.cursor = this.value.length;
	    this.render();
	  }

	  left() {
	    if (this.cursor <= 0 || this.placeholder) return this.bell();
	    this.moveCursor(-1);
	    this.render();
	  }

	  right() {
	    if (this.cursor*this.scale >= this.rendered.length || this.placeholder) return this.bell();
	    this.moveCursor(1);
	    this.render();
	  }

	  isCursorAtStart() {
	    return this.cursor === 0 || (this.placeholder && this.cursor === 1);
	  }

	  isCursorAtEnd() {
	    return this.cursor === this.rendered.length || (this.placeholder && this.cursor === this.rendered.length + 1)
	  }

	  render() {
	    if (this.closed) return;
	    if (!this.firstRender) {
	      if (this.outputError)
	        this.out.write(cursor.down(lines(this.outputError, this.out.columns) - 1) + clear(this.outputError, this.out.columns));
	      this.out.write(clear(this.outputText, this.out.columns));
	    }
	    super.render();
	    this.outputError = '';

	    this.outputText = [
	      style.symbol(this.done, this.aborted),
	      color.bold(this.msg),
	      style.delimiter(this.done),
	      this.red ? color.red(this.rendered) : this.rendered
	    ].join(` `);

	    if (this.error) {
	      this.outputError += this.errorMsg.split(`\n`)
	          .reduce((a, l, i) => a + `\n${i ? ' ' : figures.pointerSmall} ${color.red().italic(l)}`, ``);
	    }

	    this.out.write(erase.line + cursor.to(0) + this.outputText + cursor.save + this.outputError + cursor.restore + cursor.move(this.cursorOffset, 0));
	  }
	}

	text = TextPrompt;
	return text;
}

var select;
var hasRequiredSelect;

function requireSelect () {
	if (hasRequiredSelect) return select;
	hasRequiredSelect = 1;

	const color = requireKleur();
	const Prompt = requirePrompt();
	const { style, clear, figures, wrap, entriesToDisplay } = requireUtil();
	const { cursor } = requireSrc();

	/**
	 * SelectPrompt Base Element
	 * @param {Object} opts Options
	 * @param {String} opts.message Message
	 * @param {Array} opts.choices Array of choice objects
	 * @param {String} [opts.hint] Hint to display
	 * @param {Number} [opts.initial] Index of default value
	 * @param {Stream} [opts.stdin] The Readable stream to listen to
	 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
	 * @param {Number} [opts.optionsPerPage=10] Max options to display at once
	 */
	class SelectPrompt extends Prompt {
	  constructor(opts={}) {
	    super(opts);
	    this.msg = opts.message;
	    this.hint = opts.hint || '- Use arrow-keys. Return to submit.';
	    this.warn = opts.warn || '- This option is disabled';
	    this.cursor = opts.initial || 0;
	    this.choices = opts.choices.map((ch, idx) => {
	      if (typeof ch === 'string')
	        ch = {title: ch, value: idx};
	      return {
	        title: ch && (ch.title || ch.value || ch),
	        value: ch && (ch.value === undefined ? idx : ch.value),
	        description: ch && ch.description,
	        selected: ch && ch.selected,
	        disabled: ch && ch.disabled
	      };
	    });
	    this.optionsPerPage = opts.optionsPerPage || 10;
	    this.value = (this.choices[this.cursor] || {}).value;
	    this.clear = clear('', this.out.columns);
	    this.render();
	  }

	  moveCursor(n) {
	    this.cursor = n;
	    this.value = this.choices[n].value;
	    this.fire();
	  }

	  reset() {
	    this.moveCursor(0);
	    this.fire();
	    this.render();
	  }

	  exit() {
	    this.abort();
	  }

	  abort() {
	    this.done = this.aborted = true;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  submit() {
	    if (!this.selection.disabled) {
	      this.done = true;
	      this.aborted = false;
	      this.fire();
	      this.render();
	      this.out.write('\n');
	      this.close();
	    } else
	      this.bell();
	  }

	  first() {
	    this.moveCursor(0);
	    this.render();
	  }

	  last() {
	    this.moveCursor(this.choices.length - 1);
	    this.render();
	  }

	  up() {
	    if (this.cursor === 0) {
	      this.moveCursor(this.choices.length - 1);
	    } else {
	      this.moveCursor(this.cursor - 1);
	    }
	    this.render();
	  }

	  down() {
	    if (this.cursor === this.choices.length - 1) {
	      this.moveCursor(0);
	    } else {
	      this.moveCursor(this.cursor + 1);
	    }
	    this.render();
	  }

	  next() {
	    this.moveCursor((this.cursor + 1) % this.choices.length);
	    this.render();
	  }

	  _(c, key) {
	    if (c === ' ') return this.submit();
	  }

	  get selection() {
	    return this.choices[this.cursor];
	  }

	  render() {
	    if (this.closed) return;
	    if (this.firstRender) this.out.write(cursor.hide);
	    else this.out.write(clear(this.outputText, this.out.columns));
	    super.render();

	    let { startIndex, endIndex } = entriesToDisplay(this.cursor, this.choices.length, this.optionsPerPage);

	    // Print prompt
	    this.outputText = [
	      style.symbol(this.done, this.aborted),
	      color.bold(this.msg),
	      style.delimiter(false),
	      this.done ? this.selection.title : this.selection.disabled
	          ? color.yellow(this.warn) : color.gray(this.hint)
	    ].join(' ');

	    // Print choices
	    if (!this.done) {
	      this.outputText += '\n';
	      for (let i = startIndex; i < endIndex; i++) {
	        let title, prefix, desc = '', v = this.choices[i];

	        // Determine whether to display "more choices" indicators
	        if (i === startIndex && startIndex > 0) {
	          prefix = figures.arrowUp;
	        } else if (i === endIndex - 1 && endIndex < this.choices.length) {
	          prefix = figures.arrowDown;
	        } else {
	          prefix = ' ';
	        }

	        if (v.disabled) {
	          title = this.cursor === i ? color.gray().underline(v.title) : color.strikethrough().gray(v.title);
	          prefix = (this.cursor === i ? color.bold().gray(figures.pointer) + ' ' : '  ') + prefix;
	        } else {
	          title = this.cursor === i ? color.cyan().underline(v.title) : v.title;
	          prefix = (this.cursor === i ? color.cyan(figures.pointer) + ' ' : '  ') + prefix;
	          if (v.description && this.cursor === i) {
	            desc = ` - ${v.description}`;
	            if (prefix.length + title.length + desc.length >= this.out.columns
	                || v.description.split(/\r?\n/).length > 1) {
	              desc = '\n' + wrap(v.description, { margin: 3, width: this.out.columns });
	            }
	          }
	        }

	        this.outputText += `${prefix} ${title}${color.gray(desc)}\n`;
	      }
	    }

	    this.out.write(this.outputText);
	  }
	}

	select = SelectPrompt;
	return select;
}

var toggle;
var hasRequiredToggle;

function requireToggle () {
	if (hasRequiredToggle) return toggle;
	hasRequiredToggle = 1;
	const color = requireKleur();
	const Prompt = requirePrompt();
	const { style, clear } = requireUtil();
	const { cursor, erase } = requireSrc();

	/**
	 * TogglePrompt Base Element
	 * @param {Object} opts Options
	 * @param {String} opts.message Message
	 * @param {Boolean} [opts.initial=false] Default value
	 * @param {String} [opts.active='no'] Active label
	 * @param {String} [opts.inactive='off'] Inactive label
	 * @param {Stream} [opts.stdin] The Readable stream to listen to
	 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
	 */
	class TogglePrompt extends Prompt {
	  constructor(opts={}) {
	    super(opts);
	    this.msg = opts.message;
	    this.value = !!opts.initial;
	    this.active = opts.active || 'on';
	    this.inactive = opts.inactive || 'off';
	    this.initialValue = this.value;
	    this.render();
	  }

	  reset() {
	    this.value = this.initialValue;
	    this.fire();
	    this.render();
	  }

	  exit() {
	    this.abort();
	  }

	  abort() {
	    this.done = this.aborted = true;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  submit() {
	    this.done = true;
	    this.aborted = false;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  deactivate() {
	    if (this.value === false) return this.bell();
	    this.value = false;
	    this.render();
	  }

	  activate() {
	    if (this.value === true) return this.bell();
	    this.value = true;
	    this.render();
	  }

	  delete() {
	    this.deactivate();
	  }
	  left() {
	    this.deactivate();
	  }
	  right() {
	    this.activate();
	  }
	  down() {
	    this.deactivate();
	  }
	  up() {
	    this.activate();
	  }

	  next() {
	    this.value = !this.value;
	    this.fire();
	    this.render();
	  }

	  _(c, key) {
	    if (c === ' ') {
	      this.value = !this.value;
	    } else if (c === '1') {
	      this.value = true;
	    } else if (c === '0') {
	      this.value = false;
	    } else return this.bell();
	    this.render();
	  }

	  render() {
	    if (this.closed) return;
	    if (this.firstRender) this.out.write(cursor.hide);
	    else this.out.write(clear(this.outputText, this.out.columns));
	    super.render();

	    this.outputText = [
	      style.symbol(this.done, this.aborted),
	      color.bold(this.msg),
	      style.delimiter(this.done),
	      this.value ? this.inactive : color.cyan().underline(this.inactive),
	      color.gray('/'),
	      this.value ? color.cyan().underline(this.active) : this.active
	    ].join(' ');

	    this.out.write(erase.line + cursor.to(0) + this.outputText);
	  }
	}

	toggle = TogglePrompt;
	return toggle;
}

var datepart;
var hasRequiredDatepart;

function requireDatepart () {
	if (hasRequiredDatepart) return datepart;
	hasRequiredDatepart = 1;

	class DatePart {
	  constructor({token, date, parts, locales}) {
	    this.token = token;
	    this.date = date || new Date();
	    this.parts = parts || [this];
	    this.locales = locales || {};
	  }

	  up() {}

	  down() {}

	  next() {
	    const currentIdx = this.parts.indexOf(this);
	    return this.parts.find((part, idx) => idx > currentIdx && part instanceof DatePart);
	  }

	  setTo(val) {}

	  prev() {
	    let parts = [].concat(this.parts).reverse();
	    const currentIdx = parts.indexOf(this);
	    return parts.find((part, idx) => idx > currentIdx && part instanceof DatePart);
	  }

	  toString() {
	    return String(this.date);
	  }
	}

	datepart = DatePart;
	return datepart;
}

var meridiem;
var hasRequiredMeridiem;

function requireMeridiem () {
	if (hasRequiredMeridiem) return meridiem;
	hasRequiredMeridiem = 1;

	const DatePart = requireDatepart();

	class Meridiem extends DatePart {
	  constructor(opts={}) {
	    super(opts);
	  }

	  up() {
	    this.date.setHours((this.date.getHours() + 12) % 24);
	  }

	  down() {
	    this.up();
	  }

	  toString() {
	    let meridiem = this.date.getHours() > 12 ? 'pm' : 'am';
	    return /\A/.test(this.token) ? meridiem.toUpperCase() : meridiem;
	  }
	}

	meridiem = Meridiem;
	return meridiem;
}

var day;
var hasRequiredDay;

function requireDay () {
	if (hasRequiredDay) return day;
	hasRequiredDay = 1;

	const DatePart = requireDatepart();

	const pos = n => {
	  n = n % 10;
	  return n === 1 ? 'st'
	       : n === 2 ? 'nd'
	       : n === 3 ? 'rd'
	       : 'th';
	};

	class Day extends DatePart {
	  constructor(opts={}) {
	    super(opts);
	  }

	  up() {
	    this.date.setDate(this.date.getDate() + 1);
	  }

	  down() {
	    this.date.setDate(this.date.getDate() - 1);
	  }

	  setTo(val) {
	    this.date.setDate(parseInt(val.substr(-2)));
	  }

	  toString() {
	    let date = this.date.getDate();
	    let day = this.date.getDay();
	    return this.token === 'DD' ? String(date).padStart(2, '0')
	         : this.token === 'Do' ? date + pos(date)
	         : this.token === 'd' ? day + 1
	         : this.token === 'ddd' ? this.locales.weekdaysShort[day]
	         : this.token === 'dddd' ? this.locales.weekdays[day]
	         : date;
	  }
	}

	day = Day;
	return day;
}

var hours;
var hasRequiredHours;

function requireHours () {
	if (hasRequiredHours) return hours;
	hasRequiredHours = 1;

	const DatePart = requireDatepart();

	class Hours extends DatePart {
	  constructor(opts={}) {
	    super(opts);
	  }

	  up() {
	    this.date.setHours(this.date.getHours() + 1);
	  }

	  down() {
	    this.date.setHours(this.date.getHours() - 1);
	  }

	  setTo(val) {
	    this.date.setHours(parseInt(val.substr(-2)));
	  }

	  toString() {
	    let hours = this.date.getHours();
	    if (/h/.test(this.token))
	      hours = (hours % 12) || 12;
	    return this.token.length > 1 ? String(hours).padStart(2, '0') : hours;
	  }
	}

	hours = Hours;
	return hours;
}

var milliseconds;
var hasRequiredMilliseconds;

function requireMilliseconds () {
	if (hasRequiredMilliseconds) return milliseconds;
	hasRequiredMilliseconds = 1;

	const DatePart = requireDatepart();

	class Milliseconds extends DatePart {
	  constructor(opts={}) {
	    super(opts);
	  }

	  up() {
	    this.date.setMilliseconds(this.date.getMilliseconds() + 1);
	  }

	  down() {
	    this.date.setMilliseconds(this.date.getMilliseconds() - 1);
	  }

	  setTo(val) {
	    this.date.setMilliseconds(parseInt(val.substr(-(this.token.length))));
	  }

	  toString() {
	    return String(this.date.getMilliseconds()).padStart(4, '0')
	                                              .substr(0, this.token.length);
	  }
	}

	milliseconds = Milliseconds;
	return milliseconds;
}

var minutes;
var hasRequiredMinutes;

function requireMinutes () {
	if (hasRequiredMinutes) return minutes;
	hasRequiredMinutes = 1;

	const DatePart = requireDatepart();

	class Minutes extends DatePart {
	  constructor(opts={}) {
	    super(opts);
	  }

	  up() {
	    this.date.setMinutes(this.date.getMinutes() + 1);
	  }

	  down() {
	    this.date.setMinutes(this.date.getMinutes() - 1);
	  }

	  setTo(val) {
	    this.date.setMinutes(parseInt(val.substr(-2)));
	  }

	  toString() {
	    let m = this.date.getMinutes();
	    return this.token.length > 1 ? String(m).padStart(2, '0') : m;
	  }
	}

	minutes = Minutes;
	return minutes;
}

var month;
var hasRequiredMonth;

function requireMonth () {
	if (hasRequiredMonth) return month;
	hasRequiredMonth = 1;

	const DatePart = requireDatepart();

	class Month extends DatePart {
	  constructor(opts={}) {
	    super(opts);
	  }

	  up() {
	    this.date.setMonth(this.date.getMonth() + 1);
	  }

	  down() {
	    this.date.setMonth(this.date.getMonth() - 1);
	  }

	  setTo(val) {
	    val = parseInt(val.substr(-2)) - 1;
	    this.date.setMonth(val < 0 ? 0 : val);
	  }

	  toString() {
	    let month = this.date.getMonth();
	    let tl = this.token.length;
	    return tl === 2 ? String(month + 1).padStart(2, '0')
	           : tl === 3 ? this.locales.monthsShort[month]
	             : tl === 4 ? this.locales.months[month]
	               : String(month + 1);
	  }
	}

	month = Month;
	return month;
}

var seconds;
var hasRequiredSeconds;

function requireSeconds () {
	if (hasRequiredSeconds) return seconds;
	hasRequiredSeconds = 1;

	const DatePart = requireDatepart();

	class Seconds extends DatePart {
	  constructor(opts={}) {
	    super(opts);
	  }

	  up() {
	    this.date.setSeconds(this.date.getSeconds() + 1);
	  }

	  down() {
	    this.date.setSeconds(this.date.getSeconds() - 1);
	  }

	  setTo(val) {
	    this.date.setSeconds(parseInt(val.substr(-2)));
	  }

	  toString() {
	    let s = this.date.getSeconds();
	    return this.token.length > 1 ? String(s).padStart(2, '0') : s;
	  }
	}

	seconds = Seconds;
	return seconds;
}

var year;
var hasRequiredYear;

function requireYear () {
	if (hasRequiredYear) return year;
	hasRequiredYear = 1;

	const DatePart = requireDatepart();

	class Year extends DatePart {
	  constructor(opts={}) {
	    super(opts);
	  }

	  up() {
	    this.date.setFullYear(this.date.getFullYear() + 1);
	  }

	  down() {
	    this.date.setFullYear(this.date.getFullYear() - 1);
	  }

	  setTo(val) {
	    this.date.setFullYear(val.substr(-4));
	  }

	  toString() {
	    let year = String(this.date.getFullYear()).padStart(4, '0');
	    return this.token.length === 2 ? year.substr(-2) : year;
	  }
	}

	year = Year;
	return year;
}

var dateparts;
var hasRequiredDateparts;

function requireDateparts () {
	if (hasRequiredDateparts) return dateparts;
	hasRequiredDateparts = 1;

	dateparts = {
	  DatePart: requireDatepart(),
	  Meridiem: requireMeridiem(),
	  Day: requireDay(),
	  Hours: requireHours(),
	  Milliseconds: requireMilliseconds(),
	  Minutes: requireMinutes(),
	  Month: requireMonth(),
	  Seconds: requireSeconds(),
	  Year: requireYear(),
	};
	return dateparts;
}

var date;
var hasRequiredDate;

function requireDate () {
	if (hasRequiredDate) return date;
	hasRequiredDate = 1;

	const color = requireKleur();
	const Prompt = requirePrompt();
	const { style, clear, figures } = requireUtil();
	const { erase, cursor } = requireSrc();
	const { DatePart, Meridiem, Day, Hours, Milliseconds, Minutes, Month, Seconds, Year } = requireDateparts();

	const regex = /\\(.)|"((?:\\["\\]|[^"])+)"|(D[Do]?|d{3,4}|d)|(M{1,4})|(YY(?:YY)?)|([aA])|([Hh]{1,2})|(m{1,2})|(s{1,2})|(S{1,4})|./g;
	const regexGroups = {
	  1: ({token}) => token.replace(/\\(.)/g, '$1'),
	  2: (opts) => new Day(opts), // Day // TODO
	  3: (opts) => new Month(opts), // Month
	  4: (opts) => new Year(opts), // Year
	  5: (opts) => new Meridiem(opts), // AM/PM // TODO (special)
	  6: (opts) => new Hours(opts), // Hours
	  7: (opts) => new Minutes(opts), // Minutes
	  8: (opts) => new Seconds(opts), // Seconds
	  9: (opts) => new Milliseconds(opts), // Fractional seconds
	};

	const dfltLocales = {
	  months: 'January,February,March,April,May,June,July,August,September,October,November,December'.split(','),
	  monthsShort: 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(','),
	  weekdays: 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'.split(','),
	  weekdaysShort: 'Sun,Mon,Tue,Wed,Thu,Fri,Sat'.split(',')
	};


	/**
	 * DatePrompt Base Element
	 * @param {Object} opts Options
	 * @param {String} opts.message Message
	 * @param {Number} [opts.initial] Index of default value
	 * @param {String} [opts.mask] The format mask
	 * @param {object} [opts.locales] The date locales
	 * @param {String} [opts.error] The error message shown on invalid value
	 * @param {Function} [opts.validate] Function to validate the submitted value
	 * @param {Stream} [opts.stdin] The Readable stream to listen to
	 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
	 */
	class DatePrompt extends Prompt {
	  constructor(opts={}) {
	    super(opts);
	    this.msg = opts.message;
	    this.cursor = 0;
	    this.typed = '';
	    this.locales = Object.assign(dfltLocales, opts.locales);
	    this._date = opts.initial || new Date();
	    this.errorMsg = opts.error || 'Please Enter A Valid Value';
	    this.validator = opts.validate || (() => true);
	    this.mask = opts.mask || 'YYYY-MM-DD HH:mm:ss';
	    this.clear = clear('', this.out.columns);
	    this.render();
	  }

	  get value() {
	    return this.date
	  }

	  get date() {
	    return this._date;
	  }

	  set date(date) {
	    if (date) this._date.setTime(date.getTime());
	  }

	  set mask(mask) {
	    let result;
	    this.parts = [];
	    while(result = regex.exec(mask)) {
	      let match = result.shift();
	      let idx = result.findIndex(gr => gr != null);
	      this.parts.push(idx in regexGroups
	        ? regexGroups[idx]({ token: result[idx] || match, date: this.date, parts: this.parts, locales: this.locales })
	        : result[idx] || match);
	    }

	    let parts = this.parts.reduce((arr, i) => {
	      if (typeof i === 'string' && typeof arr[arr.length - 1] === 'string')
	        arr[arr.length - 1] += i;
	      else arr.push(i);
	      return arr;
	    }, []);

	    this.parts.splice(0);
	    this.parts.push(...parts);
	    this.reset();
	  }

	  moveCursor(n) {
	    this.typed = '';
	    this.cursor = n;
	    this.fire();
	  }

	  reset() {
	    this.moveCursor(this.parts.findIndex(p => p instanceof DatePart));
	    this.fire();
	    this.render();
	  }

	  exit() {
	    this.abort();
	  }

	  abort() {
	    this.done = this.aborted = true;
	    this.error = false;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  async validate() {
	    let valid = await this.validator(this.value);
	    if (typeof valid === 'string') {
	      this.errorMsg = valid;
	      valid = false;
	    }
	    this.error = !valid;
	  }

	  async submit() {
	    await this.validate();
	    if (this.error) {
	      this.color = 'red';
	      this.fire();
	      this.render();
	      return;
	    }
	    this.done = true;
	    this.aborted = false;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  up() {
	    this.typed = '';
	    this.parts[this.cursor].up();
	    this.render();
	  }

	  down() {
	    this.typed = '';
	    this.parts[this.cursor].down();
	    this.render();
	  }

	  left() {
	    let prev = this.parts[this.cursor].prev();
	    if (prev == null) return this.bell();
	    this.moveCursor(this.parts.indexOf(prev));
	    this.render();
	  }

	  right() {
	    let next = this.parts[this.cursor].next();
	    if (next == null) return this.bell();
	    this.moveCursor(this.parts.indexOf(next));
	    this.render();
	  }

	  next() {
	    let next = this.parts[this.cursor].next();
	    this.moveCursor(next
	      ? this.parts.indexOf(next)
	      : this.parts.findIndex((part) => part instanceof DatePart));
	    this.render();
	  }

	  _(c) {
	    if (/\d/.test(c)) {
	      this.typed += c;
	      this.parts[this.cursor].setTo(this.typed);
	      this.render();
	    }
	  }

	  render() {
	    if (this.closed) return;
	    if (this.firstRender) this.out.write(cursor.hide);
	    else this.out.write(clear(this.outputText, this.out.columns));
	    super.render();

	    // Print prompt
	    this.outputText = [
	      style.symbol(this.done, this.aborted),
	      color.bold(this.msg),
	      style.delimiter(false),
	      this.parts.reduce((arr, p, idx) => arr.concat(idx === this.cursor && !this.done ? color.cyan().underline(p.toString()) : p), [])
	          .join('')
	    ].join(' ');

	    // Print error
	    if (this.error) {
	      this.outputText += this.errorMsg.split('\n').reduce(
	          (a, l, i) => a + `\n${i ? ` ` : figures.pointerSmall} ${color.red().italic(l)}`, ``);
	    }

	    this.out.write(erase.line + cursor.to(0) + this.outputText);
	  }
	}

	date = DatePrompt;
	return date;
}

var number;
var hasRequiredNumber;

function requireNumber () {
	if (hasRequiredNumber) return number;
	hasRequiredNumber = 1;
	const color = requireKleur();
	const Prompt = requirePrompt();
	const { cursor, erase } = requireSrc();
	const { style, figures, clear, lines } = requireUtil();

	const isNumber = /[0-9]/;
	const isDef = any => any !== undefined;
	const round = (number, precision) => {
	  let factor = Math.pow(10, precision);
	  return Math.round(number * factor) / factor;
	};

	/**
	 * NumberPrompt Base Element
	 * @param {Object} opts Options
	 * @param {String} opts.message Message
	 * @param {String} [opts.style='default'] Render style
	 * @param {Number} [opts.initial] Default value
	 * @param {Number} [opts.max=+Infinity] Max value
	 * @param {Number} [opts.min=-Infinity] Min value
	 * @param {Boolean} [opts.float=false] Parse input as floats
	 * @param {Number} [opts.round=2] Round floats to x decimals
	 * @param {Number} [opts.increment=1] Number to increment by when using arrow-keys
	 * @param {Function} [opts.validate] Validate function
	 * @param {Stream} [opts.stdin] The Readable stream to listen to
	 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
	 * @param {String} [opts.error] The invalid error label
	 */
	class NumberPrompt extends Prompt {
	  constructor(opts={}) {
	    super(opts);
	    this.transform = style.render(opts.style);
	    this.msg = opts.message;
	    this.initial = isDef(opts.initial) ? opts.initial : '';
	    this.float = !!opts.float;
	    this.round = opts.round || 2;
	    this.inc = opts.increment || 1;
	    this.min = isDef(opts.min) ? opts.min : -Infinity;
	    this.max = isDef(opts.max) ? opts.max : Infinity;
	    this.errorMsg = opts.error || `Please Enter A Valid Value`;
	    this.validator = opts.validate || (() => true);
	    this.color = `cyan`;
	    this.value = ``;
	    this.typed = ``;
	    this.lastHit = 0;
	    this.render();
	  }

	  set value(v) {
	    if (!v && v !== 0) {
	      this.placeholder = true;
	      this.rendered = color.gray(this.transform.render(`${this.initial}`));
	      this._value = ``;
	    } else {
	      this.placeholder = false;
	      this.rendered = this.transform.render(`${round(v, this.round)}`);
	      this._value = round(v, this.round);
	    }
	    this.fire();
	  }

	  get value() {
	    return this._value;
	  }

	  parse(x) {
	    return this.float ? parseFloat(x) : parseInt(x);
	  }

	  valid(c) {
	    return c === `-` || c === `.` && this.float || isNumber.test(c)
	  }

	  reset() {
	    this.typed = ``;
	    this.value = ``;
	    this.fire();
	    this.render();
	  }

	  exit() {
	    this.abort();
	  }

	  abort() {
	    let x = this.value;
	    this.value = x !== `` ? x : this.initial;
	    this.done = this.aborted = true;
	    this.error = false;
	    this.fire();
	    this.render();
	    this.out.write(`\n`);
	    this.close();
	  }

	  async validate() {
	    let valid = await this.validator(this.value);
	    if (typeof valid === `string`) {
	      this.errorMsg = valid;
	      valid = false;
	    }
	    this.error = !valid;
	  }

	  async submit() {
	    await this.validate();
	    if (this.error) {
	      this.color = `red`;
	      this.fire();
	      this.render();
	      return;
	    }
	    let x = this.value;
	    this.value = x !== `` ? x : this.initial;
	    this.done = true;
	    this.aborted = false;
	    this.error = false;
	    this.fire();
	    this.render();
	    this.out.write(`\n`);
	    this.close();
	  }

	  up() {
	    this.typed = ``;
	    if(this.value === '') {
	      this.value = this.min - this.inc;
	    }
	    if (this.value >= this.max) return this.bell();
	    this.value += this.inc;
	    this.color = `cyan`;
	    this.fire();
	    this.render();
	  }

	  down() {
	    this.typed = ``;
	    if(this.value === '') {
	      this.value = this.min + this.inc;
	    }
	    if (this.value <= this.min) return this.bell();
	    this.value -= this.inc;
	    this.color = `cyan`;
	    this.fire();
	    this.render();
	  }

	  delete() {
	    let val = this.value.toString();
	    if (val.length === 0) return this.bell();
	    this.value = this.parse((val = val.slice(0, -1))) || ``;
	    if (this.value !== '' && this.value < this.min) {
	      this.value = this.min;
	    }
	    this.color = `cyan`;
	    this.fire();
	    this.render();
	  }

	  next() {
	    this.value = this.initial;
	    this.fire();
	    this.render();
	  }

	  _(c, key) {
	    if (!this.valid(c)) return this.bell();

	    const now = Date.now();
	    if (now - this.lastHit > 1000) this.typed = ``; // 1s elapsed
	    this.typed += c;
	    this.lastHit = now;
	    this.color = `cyan`;

	    if (c === `.`) return this.fire();

	    this.value = Math.min(this.parse(this.typed), this.max);
	    if (this.value > this.max) this.value = this.max;
	    if (this.value < this.min) this.value = this.min;
	    this.fire();
	    this.render();
	  }

	  render() {
	    if (this.closed) return;
	    if (!this.firstRender) {
	      if (this.outputError)
	        this.out.write(cursor.down(lines(this.outputError, this.out.columns) - 1) + clear(this.outputError, this.out.columns));
	      this.out.write(clear(this.outputText, this.out.columns));
	    }
	    super.render();
	    this.outputError = '';

	    // Print prompt
	    this.outputText = [
	      style.symbol(this.done, this.aborted),
	      color.bold(this.msg),
	      style.delimiter(this.done),
	      !this.done || (!this.done && !this.placeholder)
	          ? color[this.color]().underline(this.rendered) : this.rendered
	    ].join(` `);

	    // Print error
	    if (this.error) {
	      this.outputError += this.errorMsg.split(`\n`)
	          .reduce((a, l, i) => a + `\n${i ? ` ` : figures.pointerSmall} ${color.red().italic(l)}`, ``);
	    }

	    this.out.write(erase.line + cursor.to(0) + this.outputText + cursor.save + this.outputError + cursor.restore);
	  }
	}

	number = NumberPrompt;
	return number;
}

var multiselect;
var hasRequiredMultiselect;

function requireMultiselect () {
	if (hasRequiredMultiselect) return multiselect;
	hasRequiredMultiselect = 1;

	const color = requireKleur();
	const { cursor } = requireSrc();
	const Prompt = requirePrompt();
	const { clear, figures, style, wrap, entriesToDisplay } = requireUtil();

	/**
	 * MultiselectPrompt Base Element
	 * @param {Object} opts Options
	 * @param {String} opts.message Message
	 * @param {Array} opts.choices Array of choice objects
	 * @param {String} [opts.hint] Hint to display
	 * @param {String} [opts.warn] Hint shown for disabled choices
	 * @param {Number} [opts.max] Max choices
	 * @param {Number} [opts.cursor=0] Cursor start position
	 * @param {Number} [opts.optionsPerPage=10] Max options to display at once
	 * @param {Stream} [opts.stdin] The Readable stream to listen to
	 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
	 */
	class MultiselectPrompt extends Prompt {
	  constructor(opts={}) {
	    super(opts);
	    this.msg = opts.message;
	    this.cursor = opts.cursor || 0;
	    this.scrollIndex = opts.cursor || 0;
	    this.hint = opts.hint || '';
	    this.warn = opts.warn || '- This option is disabled -';
	    this.minSelected = opts.min;
	    this.showMinError = false;
	    this.maxChoices = opts.max;
	    this.instructions = opts.instructions;
	    this.optionsPerPage = opts.optionsPerPage || 10;
	    this.value = opts.choices.map((ch, idx) => {
	      if (typeof ch === 'string')
	        ch = {title: ch, value: idx};
	      return {
	        title: ch && (ch.title || ch.value || ch),
	        description: ch && ch.description,
	        value: ch && (ch.value === undefined ? idx : ch.value),
	        selected: ch && ch.selected,
	        disabled: ch && ch.disabled
	      };
	    });
	    this.clear = clear('', this.out.columns);
	    if (!opts.overrideRender) {
	      this.render();
	    }
	  }

	  reset() {
	    this.value.map(v => !v.selected);
	    this.cursor = 0;
	    this.fire();
	    this.render();
	  }

	  selected() {
	    return this.value.filter(v => v.selected);
	  }

	  exit() {
	    this.abort();
	  }

	  abort() {
	    this.done = this.aborted = true;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  submit() {
	    const selected = this.value
	      .filter(e => e.selected);
	    if (this.minSelected && selected.length < this.minSelected) {
	      this.showMinError = true;
	      this.render();
	    } else {
	      this.done = true;
	      this.aborted = false;
	      this.fire();
	      this.render();
	      this.out.write('\n');
	      this.close();
	    }
	  }

	  first() {
	    this.cursor = 0;
	    this.render();
	  }

	  last() {
	    this.cursor = this.value.length - 1;
	    this.render();
	  }
	  next() {
	    this.cursor = (this.cursor + 1) % this.value.length;
	    this.render();
	  }

	  up() {
	    if (this.cursor === 0) {
	      this.cursor = this.value.length - 1;
	    } else {
	      this.cursor--;
	    }
	    this.render();
	  }

	  down() {
	    if (this.cursor === this.value.length - 1) {
	      this.cursor = 0;
	    } else {
	      this.cursor++;
	    }
	    this.render();
	  }

	  left() {
	    this.value[this.cursor].selected = false;
	    this.render();
	  }

	  right() {
	    if (this.value.filter(e => e.selected).length >= this.maxChoices) return this.bell();
	    this.value[this.cursor].selected = true;
	    this.render();
	  }

	  handleSpaceToggle() {
	    const v = this.value[this.cursor];

	    if (v.selected) {
	      v.selected = false;
	      this.render();
	    } else if (v.disabled || this.value.filter(e => e.selected).length >= this.maxChoices) {
	      return this.bell();
	    } else {
	      v.selected = true;
	      this.render();
	    }
	  }

	  toggleAll() {
	    if (this.maxChoices !== undefined || this.value[this.cursor].disabled) {
	      return this.bell();
	    }

	    const newSelected = !this.value[this.cursor].selected;
	    this.value.filter(v => !v.disabled).forEach(v => v.selected = newSelected);
	    this.render();
	  }

	  _(c, key) {
	    if (c === ' ') {
	      this.handleSpaceToggle();
	    } else if (c === 'a') {
	      this.toggleAll();
	    } else {
	      return this.bell();
	    }
	  }

	  renderInstructions() {
	    if (this.instructions === undefined || this.instructions) {
	      if (typeof this.instructions === 'string') {
	        return this.instructions;
	      }
	      return '\nInstructions:\n'
	        + `    ${figures.arrowUp}/${figures.arrowDown}: Highlight option\n`
	        + `    ${figures.arrowLeft}/${figures.arrowRight}/[space]: Toggle selection\n`
	        + (this.maxChoices === undefined ? `    a: Toggle all\n` : '')
	        + `    enter/return: Complete answer`;
	    }
	    return '';
	  }

	  renderOption(cursor, v, i, arrowIndicator) {
	    const prefix = (v.selected ? color.green(figures.radioOn) : figures.radioOff) + ' ' + arrowIndicator + ' ';
	    let title, desc;

	    if (v.disabled) {
	      title = cursor === i ? color.gray().underline(v.title) : color.strikethrough().gray(v.title);
	    } else {
	      title = cursor === i ? color.cyan().underline(v.title) : v.title;
	      if (cursor === i && v.description) {
	        desc = ` - ${v.description}`;
	        if (prefix.length + title.length + desc.length >= this.out.columns
	          || v.description.split(/\r?\n/).length > 1) {
	          desc = '\n' + wrap(v.description, { margin: prefix.length, width: this.out.columns });
	        }
	      }
	    }

	    return prefix + title + color.gray(desc || '');
	  }

	  // shared with autocompleteMultiselect
	  paginateOptions(options) {
	    if (options.length === 0) {
	      return color.red('No matches for this query.');
	    }

	    let { startIndex, endIndex } = entriesToDisplay(this.cursor, options.length, this.optionsPerPage);
	    let prefix, styledOptions = [];

	    for (let i = startIndex; i < endIndex; i++) {
	      if (i === startIndex && startIndex > 0) {
	        prefix = figures.arrowUp;
	      } else if (i === endIndex - 1 && endIndex < options.length) {
	        prefix = figures.arrowDown;
	      } else {
	        prefix = ' ';
	      }
	      styledOptions.push(this.renderOption(this.cursor, options[i], i, prefix));
	    }

	    return '\n' + styledOptions.join('\n');
	  }

	  // shared with autocomleteMultiselect
	  renderOptions(options) {
	    if (!this.done) {
	      return this.paginateOptions(options);
	    }
	    return '';
	  }

	  renderDoneOrInstructions() {
	    if (this.done) {
	      return this.value
	        .filter(e => e.selected)
	        .map(v => v.title)
	        .join(', ');
	    }

	    const output = [color.gray(this.hint), this.renderInstructions()];

	    if (this.value[this.cursor].disabled) {
	      output.push(color.yellow(this.warn));
	    }
	    return output.join(' ');
	  }

	  render() {
	    if (this.closed) return;
	    if (this.firstRender) this.out.write(cursor.hide);
	    super.render();

	    // print prompt
	    let prompt = [
	      style.symbol(this.done, this.aborted),
	      color.bold(this.msg),
	      style.delimiter(false),
	      this.renderDoneOrInstructions()
	    ].join(' ');
	    if (this.showMinError) {
	      prompt += color.red(`You must select a minimum of ${this.minSelected} choices.`);
	      this.showMinError = false;
	    }
	    prompt += this.renderOptions(this.value);

	    this.out.write(this.clear + prompt);
	    this.clear = clear(prompt, this.out.columns);
	  }
	}

	multiselect = MultiselectPrompt;
	return multiselect;
}

var autocomplete;
var hasRequiredAutocomplete;

function requireAutocomplete () {
	if (hasRequiredAutocomplete) return autocomplete;
	hasRequiredAutocomplete = 1;

	const color = requireKleur();
	const Prompt = requirePrompt();
	const { erase, cursor } = requireSrc();
	const { style, clear, figures, wrap, entriesToDisplay } = requireUtil();

	const getVal = (arr, i) => arr[i] && (arr[i].value || arr[i].title || arr[i]);
	const getTitle = (arr, i) => arr[i] && (arr[i].title || arr[i].value || arr[i]);
	const getIndex = (arr, valOrTitle) => {
	  const index = arr.findIndex(el => el.value === valOrTitle || el.title === valOrTitle);
	  return index > -1 ? index : undefined;
	};

	/**
	 * TextPrompt Base Element
	 * @param {Object} opts Options
	 * @param {String} opts.message Message
	 * @param {Array} opts.choices Array of auto-complete choices objects
	 * @param {Function} [opts.suggest] Filter function. Defaults to sort by title
	 * @param {Number} [opts.limit=10] Max number of results to show
	 * @param {Number} [opts.cursor=0] Cursor start position
	 * @param {String} [opts.style='default'] Render style
	 * @param {String} [opts.fallback] Fallback message - initial to default value
	 * @param {String} [opts.initial] Index of the default value
	 * @param {Boolean} [opts.clearFirst] The first ESCAPE keypress will clear the input
	 * @param {Stream} [opts.stdin] The Readable stream to listen to
	 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
	 * @param {String} [opts.noMatches] The no matches found label
	 */
	class AutocompletePrompt extends Prompt {
	  constructor(opts={}) {
	    super(opts);
	    this.msg = opts.message;
	    this.suggest = opts.suggest;
	    this.choices = opts.choices;
	    this.initial = typeof opts.initial === 'number'
	      ? opts.initial
	      : getIndex(opts.choices, opts.initial);
	    this.select = this.initial || opts.cursor || 0;
	    this.i18n = { noMatches: opts.noMatches || 'no matches found' };
	    this.fallback = opts.fallback || this.initial;
	    this.clearFirst = opts.clearFirst || false;
	    this.suggestions = [];
	    this.input = '';
	    this.limit = opts.limit || 10;
	    this.cursor = 0;
	    this.transform = style.render(opts.style);
	    this.scale = this.transform.scale;
	    this.render = this.render.bind(this);
	    this.complete = this.complete.bind(this);
	    this.clear = clear('', this.out.columns);
	    this.complete(this.render);
	    this.render();
	  }

	  set fallback(fb) {
	    this._fb = Number.isSafeInteger(parseInt(fb)) ? parseInt(fb) : fb;
	  }

	  get fallback() {
	    let choice;
	    if (typeof this._fb === 'number')
	      choice = this.choices[this._fb];
	    else if (typeof this._fb === 'string')
	      choice = { title: this._fb };
	    return choice || this._fb || { title: this.i18n.noMatches };
	  }

	  moveSelect(i) {
	    this.select = i;
	    if (this.suggestions.length > 0)
	      this.value = getVal(this.suggestions, i);
	    else this.value = this.fallback.value;
	    this.fire();
	  }

	  async complete(cb) {
	    const p = (this.completing = this.suggest(this.input, this.choices));
	    const suggestions = await p;

	    if (this.completing !== p) return;
	    this.suggestions = suggestions
	      .map((s, i, arr) => ({ title: getTitle(arr, i), value: getVal(arr, i), description: s.description }));
	    this.completing = false;
	    const l = Math.max(suggestions.length - 1, 0);
	    this.moveSelect(Math.min(l, this.select));

	    cb && cb();
	  }

	  reset() {
	    this.input = '';
	    this.complete(() => {
	      this.moveSelect(this.initial !== void 0 ? this.initial : 0);
	      this.render();
	    });
	    this.render();
	  }

	  exit() {
	    if (this.clearFirst && this.input.length > 0) {
	      this.reset();
	    } else {
	      this.done = this.exited = true; 
	      this.aborted = false;
	      this.fire();
	      this.render();
	      this.out.write('\n');
	      this.close();
	    }
	  }

	  abort() {
	    this.done = this.aborted = true;
	    this.exited = false;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  submit() {
	    this.done = true;
	    this.aborted = this.exited = false;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  _(c, key) {
	    let s1 = this.input.slice(0, this.cursor);
	    let s2 = this.input.slice(this.cursor);
	    this.input = `${s1}${c}${s2}`;
	    this.cursor = s1.length+1;
	    this.complete(this.render);
	    this.render();
	  }

	  delete() {
	    if (this.cursor === 0) return this.bell();
	    let s1 = this.input.slice(0, this.cursor-1);
	    let s2 = this.input.slice(this.cursor);
	    this.input = `${s1}${s2}`;
	    this.complete(this.render);
	    this.cursor = this.cursor-1;
	    this.render();
	  }

	  deleteForward() {
	    if(this.cursor*this.scale >= this.rendered.length) return this.bell();
	    let s1 = this.input.slice(0, this.cursor);
	    let s2 = this.input.slice(this.cursor+1);
	    this.input = `${s1}${s2}`;
	    this.complete(this.render);
	    this.render();
	  }

	  first() {
	    this.moveSelect(0);
	    this.render();
	  }

	  last() {
	    this.moveSelect(this.suggestions.length - 1);
	    this.render();
	  }

	  up() {
	    if (this.select === 0) {
	      this.moveSelect(this.suggestions.length - 1);
	    } else {
	      this.moveSelect(this.select - 1);
	    }
	    this.render();
	  }

	  down() {
	    if (this.select === this.suggestions.length - 1) {
	      this.moveSelect(0);
	    } else {
	      this.moveSelect(this.select + 1);
	    }
	    this.render();
	  }

	  next() {
	    if (this.select === this.suggestions.length - 1) {
	      this.moveSelect(0);
	    } else this.moveSelect(this.select + 1);
	    this.render();
	  }

	  nextPage() {
	    this.moveSelect(Math.min(this.select + this.limit, this.suggestions.length - 1));
	    this.render();
	  }

	  prevPage() {
	    this.moveSelect(Math.max(this.select - this.limit, 0));
	    this.render();
	  }

	  left() {
	    if (this.cursor <= 0) return this.bell();
	    this.cursor = this.cursor-1;
	    this.render();
	  }

	  right() {
	    if (this.cursor*this.scale >= this.rendered.length) return this.bell();
	    this.cursor = this.cursor+1;
	    this.render();
	  }

	  renderOption(v, hovered, isStart, isEnd) {
	    let desc;
	    let prefix = isStart ? figures.arrowUp : isEnd ? figures.arrowDown : ' ';
	    let title = hovered ? color.cyan().underline(v.title) : v.title;
	    prefix = (hovered ? color.cyan(figures.pointer) + ' ' : '  ') + prefix;
	    if (v.description) {
	      desc = ` - ${v.description}`;
	      if (prefix.length + title.length + desc.length >= this.out.columns
	        || v.description.split(/\r?\n/).length > 1) {
	        desc = '\n' + wrap(v.description, { margin: 3, width: this.out.columns });
	      }
	    }
	    return prefix + ' ' + title + color.gray(desc || '');
	  }

	  render() {
	    if (this.closed) return;
	    if (this.firstRender) this.out.write(cursor.hide);
	    else this.out.write(clear(this.outputText, this.out.columns));
	    super.render();

	    let { startIndex, endIndex } = entriesToDisplay(this.select, this.choices.length, this.limit);

	    this.outputText = [
	      style.symbol(this.done, this.aborted, this.exited),
	      color.bold(this.msg),
	      style.delimiter(this.completing),
	      this.done && this.suggestions[this.select]
	        ? this.suggestions[this.select].title
	        : this.rendered = this.transform.render(this.input)
	    ].join(' ');

	    if (!this.done) {
	      const suggestions = this.suggestions
	        .slice(startIndex, endIndex)
	        .map((item, i) =>  this.renderOption(item,
	          this.select === i + startIndex,
	          i === 0 && startIndex > 0,
	          i + startIndex === endIndex - 1 && endIndex < this.choices.length))
	        .join('\n');
	      this.outputText += `\n` + (suggestions || color.gray(this.fallback.title));
	    }

	    this.out.write(erase.line + cursor.to(0) + this.outputText);
	  }
	}

	autocomplete = AutocompletePrompt;
	return autocomplete;
}

var autocompleteMultiselect;
var hasRequiredAutocompleteMultiselect;

function requireAutocompleteMultiselect () {
	if (hasRequiredAutocompleteMultiselect) return autocompleteMultiselect;
	hasRequiredAutocompleteMultiselect = 1;

	const color = requireKleur();
	const { cursor } = requireSrc();
	const MultiselectPrompt = requireMultiselect();
	const { clear, style, figures } = requireUtil();
	/**
	 * MultiselectPrompt Base Element
	 * @param {Object} opts Options
	 * @param {String} opts.message Message
	 * @param {Array} opts.choices Array of choice objects
	 * @param {String} [opts.hint] Hint to display
	 * @param {String} [opts.warn] Hint shown for disabled choices
	 * @param {Number} [opts.max] Max choices
	 * @param {Number} [opts.cursor=0] Cursor start position
	 * @param {Stream} [opts.stdin] The Readable stream to listen to
	 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
	 */
	class AutocompleteMultiselectPrompt extends MultiselectPrompt {
	  constructor(opts={}) {
	    opts.overrideRender = true;
	    super(opts);
	    this.inputValue = '';
	    this.clear = clear('', this.out.columns);
	    this.filteredOptions = this.value;
	    this.render();
	  }

	  last() {
	    this.cursor = this.filteredOptions.length - 1;
	    this.render();
	  }
	  next() {
	    this.cursor = (this.cursor + 1) % this.filteredOptions.length;
	    this.render();
	  }

	  up() {
	    if (this.cursor === 0) {
	      this.cursor = this.filteredOptions.length - 1;
	    } else {
	      this.cursor--;
	    }
	    this.render();
	  }

	  down() {
	    if (this.cursor === this.filteredOptions.length - 1) {
	      this.cursor = 0;
	    } else {
	      this.cursor++;
	    }
	    this.render();
	  }

	  left() {
	    this.filteredOptions[this.cursor].selected = false;
	    this.render();
	  }

	  right() {
	    if (this.value.filter(e => e.selected).length >= this.maxChoices) return this.bell();
	    this.filteredOptions[this.cursor].selected = true;
	    this.render();
	  }

	  delete() {
	    if (this.inputValue.length) {
	      this.inputValue = this.inputValue.substr(0, this.inputValue.length - 1);
	      this.updateFilteredOptions();
	    }
	  }

	  updateFilteredOptions() {
	    const currentHighlight = this.filteredOptions[this.cursor];
	    this.filteredOptions = this.value
	      .filter(v => {
	        if (this.inputValue) {
	          if (typeof v.title === 'string') {
	            if (v.title.toLowerCase().includes(this.inputValue.toLowerCase())) {
	              return true;
	            }
	          }
	          if (typeof v.value === 'string') {
	            if (v.value.toLowerCase().includes(this.inputValue.toLowerCase())) {
	              return true;
	            }
	          }
	          return false;
	        }
	        return true;
	      });
	    const newHighlightIndex = this.filteredOptions.findIndex(v => v === currentHighlight);
	    this.cursor = newHighlightIndex < 0 ? 0 : newHighlightIndex;
	    this.render();
	  }

	  handleSpaceToggle() {
	    const v = this.filteredOptions[this.cursor];

	    if (v.selected) {
	      v.selected = false;
	      this.render();
	    } else if (v.disabled || this.value.filter(e => e.selected).length >= this.maxChoices) {
	      return this.bell();
	    } else {
	      v.selected = true;
	      this.render();
	    }
	  }

	  handleInputChange(c) {
	    this.inputValue = this.inputValue + c;
	    this.updateFilteredOptions();
	  }

	  _(c, key) {
	    if (c === ' ') {
	      this.handleSpaceToggle();
	    } else {
	      this.handleInputChange(c);
	    }
	  }

	  renderInstructions() {
	    if (this.instructions === undefined || this.instructions) {
	      if (typeof this.instructions === 'string') {
	        return this.instructions;
	      }
	      return `
Instructions:
    ${figures.arrowUp}/${figures.arrowDown}: Highlight option
    ${figures.arrowLeft}/${figures.arrowRight}/[space]: Toggle selection
    [a,b,c]/delete: Filter choices
    enter/return: Complete answer
`;
	    }
	    return '';
	  }

	  renderCurrentInput() {
	    return `
Filtered results for: ${this.inputValue ? this.inputValue : color.gray('Enter something to filter')}\n`;
	  }

	  renderOption(cursor, v, i) {
	    let title;
	    if (v.disabled) title = cursor === i ? color.gray().underline(v.title) : color.strikethrough().gray(v.title);
	    else title = cursor === i ? color.cyan().underline(v.title) : v.title;
	    return (v.selected ? color.green(figures.radioOn) : figures.radioOff) + '  ' + title
	  }

	  renderDoneOrInstructions() {
	    if (this.done) {
	      return this.value
	        .filter(e => e.selected)
	        .map(v => v.title)
	        .join(', ');
	    }

	    const output = [color.gray(this.hint), this.renderInstructions(), this.renderCurrentInput()];

	    if (this.filteredOptions.length && this.filteredOptions[this.cursor].disabled) {
	      output.push(color.yellow(this.warn));
	    }
	    return output.join(' ');
	  }

	  render() {
	    if (this.closed) return;
	    if (this.firstRender) this.out.write(cursor.hide);
	    super.render();

	    // print prompt

	    let prompt = [
	      style.symbol(this.done, this.aborted),
	      color.bold(this.msg),
	      style.delimiter(false),
	      this.renderDoneOrInstructions()
	    ].join(' ');

	    if (this.showMinError) {
	      prompt += color.red(`You must select a minimum of ${this.minSelected} choices.`);
	      this.showMinError = false;
	    }
	    prompt += this.renderOptions(this.filteredOptions);

	    this.out.write(this.clear + prompt);
	    this.clear = clear(prompt, this.out.columns);
	  }
	}

	autocompleteMultiselect = AutocompleteMultiselectPrompt;
	return autocompleteMultiselect;
}

var confirm;
var hasRequiredConfirm;

function requireConfirm () {
	if (hasRequiredConfirm) return confirm;
	hasRequiredConfirm = 1;
	const color = requireKleur();
	const Prompt = requirePrompt();
	const { style, clear } = requireUtil();
	const { erase, cursor } = requireSrc();

	/**
	 * ConfirmPrompt Base Element
	 * @param {Object} opts Options
	 * @param {String} opts.message Message
	 * @param {Boolean} [opts.initial] Default value (true/false)
	 * @param {Stream} [opts.stdin] The Readable stream to listen to
	 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
	 * @param {String} [opts.yes] The "Yes" label
	 * @param {String} [opts.yesOption] The "Yes" option when choosing between yes/no
	 * @param {String} [opts.no] The "No" label
	 * @param {String} [opts.noOption] The "No" option when choosing between yes/no
	 */
	class ConfirmPrompt extends Prompt {
	  constructor(opts={}) {
	    super(opts);
	    this.msg = opts.message;
	    this.value = opts.initial;
	    this.initialValue = !!opts.initial;
	    this.yesMsg = opts.yes || 'yes';
	    this.yesOption = opts.yesOption || '(Y/n)';
	    this.noMsg = opts.no || 'no';
	    this.noOption = opts.noOption || '(y/N)';
	    this.render();
	  }

	  reset() {
	    this.value = this.initialValue;
	    this.fire();
	    this.render();
	  }

	  exit() {
	    this.abort();
	  }

	  abort() {
	    this.done = this.aborted = true;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  submit() {
	    this.value = this.value || false;
	    this.done = true;
	    this.aborted = false;
	    this.fire();
	    this.render();
	    this.out.write('\n');
	    this.close();
	  }

	  _(c, key) {
	    if (c.toLowerCase() === 'y') {
	      this.value = true;
	      return this.submit();
	    }
	    if (c.toLowerCase() === 'n') {
	      this.value = false;
	      return this.submit();
	    }
	    return this.bell();
	  }

	  render() {
	    if (this.closed) return;
	    if (this.firstRender) this.out.write(cursor.hide);
	    else this.out.write(clear(this.outputText, this.out.columns));
	    super.render();

	    this.outputText = [
	      style.symbol(this.done, this.aborted),
	      color.bold(this.msg),
	      style.delimiter(this.done),
	      this.done ? (this.value ? this.yesMsg : this.noMsg)
	          : color.gray(this.initialValue ? this.yesOption : this.noOption)
	    ].join(' ');

	    this.out.write(erase.line + cursor.to(0) + this.outputText);
	  }
	}

	confirm = ConfirmPrompt;
	return confirm;
}

var elements;
var hasRequiredElements;

function requireElements () {
	if (hasRequiredElements) return elements;
	hasRequiredElements = 1;

	elements = {
	  TextPrompt: requireText(),
	  SelectPrompt: requireSelect(),
	  TogglePrompt: requireToggle(),
	  DatePrompt: requireDate(),
	  NumberPrompt: requireNumber(),
	  MultiselectPrompt: requireMultiselect(),
	  AutocompletePrompt: requireAutocomplete(),
	  AutocompleteMultiselectPrompt: requireAutocompleteMultiselect(),
	  ConfirmPrompt: requireConfirm()
	};
	return elements;
}

var hasRequiredPrompts$1;

function requirePrompts$1 () {
	if (hasRequiredPrompts$1) return prompts$1;
	hasRequiredPrompts$1 = 1;
	(function (exports) {
		const $ = exports;
		const el = requireElements();
		const noop = v => v;

		function toPrompt(type, args, opts={}) {
		  return new Promise((res, rej) => {
		    const p = new el[type](args);
		    const onAbort = opts.onAbort || noop;
		    const onSubmit = opts.onSubmit || noop;
		    const onExit = opts.onExit || noop;
		    p.on('state', args.onState || noop);
		    p.on('submit', x => res(onSubmit(x)));
		    p.on('exit', x => res(onExit(x)));
		    p.on('abort', x => rej(onAbort(x)));
		  });
		}

		/**
		 * Text prompt
		 * @param {string} args.message Prompt message to display
		 * @param {string} [args.initial] Default string value
		 * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
		 * @param {function} [args.onState] On state change callback
		 * @param {function} [args.validate] Function to validate user input
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input
		 */
		$.text = args => toPrompt('TextPrompt', args);

		/**
		 * Password prompt with masked input
		 * @param {string} args.message Prompt message to display
		 * @param {string} [args.initial] Default string value
		 * @param {function} [args.onState] On state change callback
		 * @param {function} [args.validate] Function to validate user input
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input
		 */
		$.password = args => {
		  args.style = 'password';
		  return $.text(args);
		};

		/**
		 * Prompt where input is invisible, like sudo
		 * @param {string} args.message Prompt message to display
		 * @param {string} [args.initial] Default string value
		 * @param {function} [args.onState] On state change callback
		 * @param {function} [args.validate] Function to validate user input
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input
		 */
		$.invisible = args => {
		  args.style = 'invisible';
		  return $.text(args);
		};

		/**
		 * Number prompt
		 * @param {string} args.message Prompt message to display
		 * @param {number} args.initial Default number value
		 * @param {function} [args.onState] On state change callback
		 * @param {number} [args.max] Max value
		 * @param {number} [args.min] Min value
		 * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
		 * @param {Boolean} [opts.float=false] Parse input as floats
		 * @param {Number} [opts.round=2] Round floats to x decimals
		 * @param {Number} [opts.increment=1] Number to increment by when using arrow-keys
		 * @param {function} [args.validate] Function to validate user input
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input
		 */
		$.number = args => toPrompt('NumberPrompt', args);

		/**
		 * Date prompt
		 * @param {string} args.message Prompt message to display
		 * @param {number} args.initial Default number value
		 * @param {function} [args.onState] On state change callback
		 * @param {number} [args.max] Max value
		 * @param {number} [args.min] Min value
		 * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
		 * @param {Boolean} [opts.float=false] Parse input as floats
		 * @param {Number} [opts.round=2] Round floats to x decimals
		 * @param {Number} [opts.increment=1] Number to increment by when using arrow-keys
		 * @param {function} [args.validate] Function to validate user input
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input
		 */
		$.date = args => toPrompt('DatePrompt', args);

		/**
		 * Classic yes/no prompt
		 * @param {string} args.message Prompt message to display
		 * @param {boolean} [args.initial=false] Default value
		 * @param {function} [args.onState] On state change callback
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input
		 */
		$.confirm = args => toPrompt('ConfirmPrompt', args);

		/**
		 * List prompt, split intput string by `seperator`
		 * @param {string} args.message Prompt message to display
		 * @param {string} [args.initial] Default string value
		 * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
		 * @param {string} [args.separator] String separator
		 * @param {function} [args.onState] On state change callback
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input, in form of an `Array`
		 */
		$.list = args => {
		  const sep = args.separator || ',';
		  return toPrompt('TextPrompt', args, {
		    onSubmit: str => str.split(sep).map(s => s.trim())
		  });
		};

		/**
		 * Toggle/switch prompt
		 * @param {string} args.message Prompt message to display
		 * @param {boolean} [args.initial=false] Default value
		 * @param {string} [args.active="on"] Text for `active` state
		 * @param {string} [args.inactive="off"] Text for `inactive` state
		 * @param {function} [args.onState] On state change callback
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input
		 */
		$.toggle = args => toPrompt('TogglePrompt', args);

		/**
		 * Interactive select prompt
		 * @param {string} args.message Prompt message to display
		 * @param {Array} args.choices Array of choices objects `[{ title, value }, ...]`
		 * @param {number} [args.initial] Index of default value
		 * @param {String} [args.hint] Hint to display
		 * @param {function} [args.onState] On state change callback
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input
		 */
		$.select = args => toPrompt('SelectPrompt', args);

		/**
		 * Interactive multi-select / autocompleteMultiselect prompt
		 * @param {string} args.message Prompt message to display
		 * @param {Array} args.choices Array of choices objects `[{ title, value, [selected] }, ...]`
		 * @param {number} [args.max] Max select
		 * @param {string} [args.hint] Hint to display user
		 * @param {Number} [args.cursor=0] Cursor start position
		 * @param {function} [args.onState] On state change callback
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input
		 */
		$.multiselect = args => {
		  args.choices = [].concat(args.choices || []);
		  const toSelected = items => items.filter(item => item.selected).map(item => item.value);
		  return toPrompt('MultiselectPrompt', args, {
		    onAbort: toSelected,
		    onSubmit: toSelected
		  });
		};

		$.autocompleteMultiselect = args => {
		  args.choices = [].concat(args.choices || []);
		  const toSelected = items => items.filter(item => item.selected).map(item => item.value);
		  return toPrompt('AutocompleteMultiselectPrompt', args, {
		    onAbort: toSelected,
		    onSubmit: toSelected
		  });
		};

		const byTitle = (input, choices) => Promise.resolve(
		  choices.filter(item => item.title.slice(0, input.length).toLowerCase() === input.toLowerCase())
		);

		/**
		 * Interactive auto-complete prompt
		 * @param {string} args.message Prompt message to display
		 * @param {Array} args.choices Array of auto-complete choices objects `[{ title, value }, ...]`
		 * @param {Function} [args.suggest] Function to filter results based on user input. Defaults to sort by `title`
		 * @param {number} [args.limit=10] Max number of results to show
		 * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
		 * @param {String} [args.initial] Index of the default value
		 * @param {boolean} [opts.clearFirst] The first ESCAPE keypress will clear the input
		 * @param {String} [args.fallback] Fallback message - defaults to initial value
		 * @param {function} [args.onState] On state change callback
		 * @param {Stream} [args.stdin] The Readable stream to listen to
		 * @param {Stream} [args.stdout] The Writable stream to write readline data to
		 * @returns {Promise} Promise with user input
		 */
		$.autocomplete = args => {
		  args.suggest = args.suggest || byTitle;
		  args.choices = [].concat(args.choices || []);
		  return toPrompt('AutocompletePrompt', args);
		}; 
	} (prompts$1));
	return prompts$1;
}

var lib;
var hasRequiredLib;

function requireLib () {
	if (hasRequiredLib) return lib;
	hasRequiredLib = 1;

	const prompts = requirePrompts$1();

	const passOn = ['suggest', 'format', 'onState', 'validate', 'onRender', 'type'];
	const noop = () => {};

	/**
	 * Prompt for a series of questions
	 * @param {Array|Object} questions Single question object or Array of question objects
	 * @param {Function} [onSubmit] Callback function called on prompt submit
	 * @param {Function} [onCancel] Callback function called on cancel/abort
	 * @returns {Object} Object with values from user input
	 */
	async function prompt(questions=[], { onSubmit=noop, onCancel=noop }={}) {
	  const answers = {};
	  const override = prompt._override || {};
	  questions = [].concat(questions);
	  let answer, question, quit, name, type, lastPrompt;

	  const getFormattedAnswer = async (question, answer, skipValidation = false) => {
	    if (!skipValidation && question.validate && question.validate(answer) !== true) {
	      return;
	    }
	    return question.format ? await question.format(answer, answers) : answer
	  };

	  for (question of questions) {
	    ({ name, type } = question);

	    // evaluate type first and skip if type is a falsy value
	    if (typeof type === 'function') {
	      type = await type(answer, { ...answers }, question);
	      question['type'] = type;
	    }
	    if (!type) continue;

	    // if property is a function, invoke it unless it's a special function
	    for (let key in question) {
	      if (passOn.includes(key)) continue;
	      let value = question[key];
	      question[key] = typeof value === 'function' ? await value(answer, { ...answers }, lastPrompt) : value;
	    }

	    lastPrompt = question;

	    if (typeof question.message !== 'string') {
	      throw new Error('prompt message is required');
	    }

	    // update vars in case they changed
	    ({ name, type } = question);

	    if (prompts[type] === void 0) {
	      throw new Error(`prompt type (${type}) is not defined`);
	    }

	    if (override[question.name] !== undefined) {
	      answer = await getFormattedAnswer(question, override[question.name]);
	      if (answer !== undefined) {
	        answers[name] = answer;
	        continue;
	      }
	    }

	    try {
	      // Get the injected answer if there is one or prompt the user
	      answer = prompt._injected ? getInjectedAnswer(prompt._injected, question.initial) : await prompts[type](question);
	      answers[name] = answer = await getFormattedAnswer(question, answer, true);
	      quit = await onSubmit(question, answer, answers);
	    } catch (err) {
	      quit = !(await onCancel(question, answers));
	    }

	    if (quit) return answers;
	  }

	  return answers;
	}

	function getInjectedAnswer(injected, deafultValue) {
	  const answer = injected.shift();
	    if (answer instanceof Error) {
	      throw answer;
	    }

	    return (answer === undefined) ? deafultValue : answer;
	}

	function inject(answers) {
	  prompt._injected = (prompt._injected || []).concat(answers);
	}

	function override(answers) {
	  prompt._override = Object.assign({}, answers);
	}

	lib = Object.assign(prompt, { prompt, prompts, inject, override });
	return lib;
}

var prompts;
var hasRequiredPrompts;

function requirePrompts () {
	if (hasRequiredPrompts) return prompts;
	hasRequiredPrompts = 1;
	function isNodeLT(tar) {
	  tar = (Array.isArray(tar) ? tar : tar.split('.')).map(Number);
	  let i=0, src=process.versions.node.split('.').map(Number);
	  for (; i < tar.length; i++) {
	    if (src[i] > tar[i]) return false;
	    if (tar[i] > src[i]) return true;
	  }
	  return false;
	}

	prompts =
	  isNodeLT('8.6.0')
	    ? requireDist()
	    : requireLib();
	return prompts;
}

var promptsExports = requirePrompts();
var prompt = /*@__PURE__*/getDefaultExportFromCjs(promptsExports);

var index = /*#__PURE__*/_mergeNamespaces({
  __proto__: null,
  default: prompt
}, [promptsExports]);

export { stdout as A, BaseCoverageProvider as B, RangeLocationFilterProvidedError as C, DefaultReporter as D, LocationFilterFileNotFoundError as E, ForksPoolWorker as F, GitNotFoundError as G, HangingProcessReporter as H, IncludeTaskLocationDisabledError as I, JUnitReporter as J, Logger as L, MinimalReporter as M, PluginHarness as P, ReportersMap as R, TapFlatReporter as T, Vitest as V, BaseSequencer as a, BrowserConnectionError as b, DotReporter as c, GithubActionsReporter as d, JsonReporter as e, TapReporter as f, FilesNotFoundError as g, ThreadsPoolWorker as h, TypecheckPoolWorker as i, VerboseReporter as j, VitestPackageInstaller as k, VmForksPoolWorker as l, VmThreadsPoolWorker as m, createDebugger as n, createMethodsRPC as o, createViteLogger as p, escapeTestName as q, experimental_getRunnerTask as r, getFilePoolName as s, isFileServingAllowed as t, isValidApiRequest as u, resolveApiServerConfig as v, resolveConfig$1 as w, resolveFsAllow as x, prompt as y, findConfigFile as z };
