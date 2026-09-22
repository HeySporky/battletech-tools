import { mkdirSync, writeFileSync } from 'node:fs';
import { C as CoverageProviderMap } from './coverage.CX7NN5s7.js';
import { L as Logger, k as VitestPackageInstaller, P as PluginHarness, w as resolveConfig, V as Vitest, A as stdout, y as prompt, g as FilesNotFoundError, G as GitNotFoundError, I as IncludeTaskLocationDisabledError, C as RangeLocationFilterProvidedError, E as LocationFilterFileNotFoundError } from './index.DzobfTyw.js';
import readline from 'node:readline';
import { y } from './tinyrainbow.Ht9iggcq.js';
import { i as isWindows } from './env.DzFJjrmK.js';
import { stripVTControlCharacters } from 'node:util';
import { e as createDefer, a as relative, r as resolve, d as dirname, i as isAbsolute } from './pathe.M-eThtNZ.DwEga6ro.js';

async function createVitest(modeOrOptions, optionsOrViteOverrides = {}, viteOverridesOrVitestOptions = {}, maybeVitestOptions = {}) {
	let options;
	let viteOverrides;
	let vitestOptions;
	if (typeof modeOrOptions === "string") {
		options = optionsOrViteOverrides;
		viteOverrides = viteOverridesOrVitestOptions;
		vitestOptions = maybeVitestOptions;
	} else {
		options = modeOrOptions;
		viteOverrides = optionsOrViteOverrides;
		vitestOptions = viteOverridesOrVitestOptions;
	}
	const logger = new Logger(vitestOptions.stdout, vitestOptions.stderr);
	const packageInstaller = vitestOptions.packageInstaller ?? new VitestPackageInstaller();
	const pluginHarness = new PluginHarness(logger, packageInstaller);
	const config = await resolveConfig(options, viteOverrides, pluginHarness);
	const vitest = new Vitest(pluginHarness, config);
	try {
		await vitest._start(config);
		if (vitest.config.api.port && vitest.config.ui && vitest.config.open) vitest.vite.openBrowser();
		return vitest;
	} 
	// Vitest can fail at any point during setup or inside a custom plugin.
	// Make sure everything is properly closed (like the logger).
catch (error) {
		await vitest.close();
		throw error;
	}
}

const MAX_RESULT_COUNT = 10;
const SELECTION_MAX_INDEX = 7;
const ESC = "\x1B[";
class WatchFilter {
	filterRL;
	currentKeyword = void 0;
	message;
	results = [];
	selectionIndex = -1;
	onKeyPress;
	stdin;
	stdout;
	constructor(message, stdin = process.stdin, stdout$1 = stdout()) {
		this.message = message;
		this.stdin = stdin;
		this.stdout = stdout$1;
		this.filterRL = readline.createInterface({
			input: this.stdin,
			escapeCodeTimeout: 50
		});
		readline.emitKeypressEvents(this.stdin, this.filterRL);
		if (this.stdin.isTTY) this.stdin.setRawMode(true);
	}
	async filter(filterFunc) {
		this.write(this.promptLine());
		const resultPromise = createDefer();
		this.onKeyPress = this.filterHandler(filterFunc, (result) => {
			resultPromise.resolve(result);
		});
		this.stdin.on("keypress", this.onKeyPress);
		try {
			return await resultPromise;
		} finally {
			this.close();
		}
	}
	filterHandler(filterFunc, onSubmit) {
		return async (str, key) => {
			switch (true) {
				case key.sequence === "":
					if (this.currentKeyword && this.currentKeyword?.length > 1) this.currentKeyword = this.currentKeyword?.slice(0, -1);
					else this.currentKeyword = void 0;
					break;
				case key?.ctrl && key?.name === "c":
				case key?.name === "escape":
					this.write(`${ESC}1G${ESC}0J`);
					onSubmit(void 0);
					return;
				case key?.name === "enter":
				case key?.name === "return": {
					const selection = this.results[this.selectionIndex];
					onSubmit((typeof selection === "string" ? selection : selection?.key) || this.currentKeyword || "");
					this.currentKeyword = void 0;
					break;
				}
				case key?.name === "up":
					if (this.selectionIndex && this.selectionIndex > 0) this.selectionIndex--;
					else this.selectionIndex = -1;
					break;
				case key?.name === "down":
					if (this.selectionIndex < this.results.length - 1) this.selectionIndex++;
					else if (this.selectionIndex >= this.results.length - 1) this.selectionIndex = this.results.length - 1;
					break;
				case !key?.ctrl && !key?.meta: if (this.currentKeyword === void 0) this.currentKeyword = str;
				else this.currentKeyword += str || "";
			}
			if (this.currentKeyword) this.results = await filterFunc(this.currentKeyword);
			this.render();
		};
	}
	render() {
		let printStr = this.promptLine();
		if (!this.currentKeyword) printStr += "\nPlease input filter pattern";
		else if (this.currentKeyword && this.results.length === 0) printStr += "\nPattern matches no results";
		else {
			const resultCountLine = this.results.length === 1 ? `Pattern matches ${this.results.length} result` : `Pattern matches ${this.results.length} results`;
			let resultBody = "";
			if (this.results.length > MAX_RESULT_COUNT) {
				const offset = this.selectionIndex > SELECTION_MAX_INDEX ? this.selectionIndex - SELECTION_MAX_INDEX : 0;
				const displayResults = this.results.slice(offset, MAX_RESULT_COUNT + offset);
				const remainingResultCount = this.results.length - offset - displayResults.length;
				resultBody = `${displayResults.map((result, index) => index + offset === this.selectionIndex ? y.green(` › ${result}`) : y.dim(` › ${result}`)).join("\n")}`;
				if (remainingResultCount > 0) resultBody += `
${y.dim(`   ...and ${remainingResultCount} more ${remainingResultCount === 1 ? "result" : "results"}`)}`;
			} else resultBody = this.results.map((result, index) => index === this.selectionIndex ? y.green(` › ${result}`) : y.dim(` › ${result}`)).join("\n");
			printStr += `\n${resultCountLine}\n${resultBody}`;
		}
		this.eraseAndPrint(printStr);
		this.restoreCursor();
	}
	keywordOffset() {
		return `? ${this.message} › `.length + 1;
	}
	promptLine() {
		return `${y.cyan("?")} ${y.bold(this.message)} › ${this.currentKeyword || ""}`;
	}
	eraseAndPrint(str) {
		let rows = 0;
		const lines = str.split(/\r?\n/);
		for (const line of lines) {
			const columns = "columns" in this.stdout ? this.stdout.columns : 80;
			// We have to take care of screen width in case of long lines
			rows += 1 + Math.floor(Math.max(stripVTControlCharacters(line).length - 1, 0) / columns);
		}
		this.write(`${ESC}1G`);
		this.write(`${ESC}J`);
		this.write(str);
		this.write(`${ESC}${rows - 1}A`);
	}
	close() {
		this.filterRL.close();
		if (this.onKeyPress) this.stdin.removeListener("keypress", this.onKeyPress);
		if (this.stdin.isTTY) this.stdin.setRawMode(false);
	}
	restoreCursor() {
		const cursorPos = this.keywordOffset() + (this.currentKeyword?.length || 0);
		this.write(`${ESC}${cursorPos}G`);
	}
	write(data) {
		this.stdout.write(data);
	}
	getLastResults() {
		return this.results.map((r) => typeof r === "string" ? r : r.toString());
	}
}

const keys = [
	[["a", "return"], "rerun all tests"],
	["r", "rerun current pattern tests"],
	["f", "rerun only failed tests"],
	["u", "update snapshot"],
	["p", "filter by a filename"],
	["t", "filter by a test name regex pattern"],
	["w", "filter by a project name"],
	["q", "quit"]
];
const cancelKeys = [
	"space",
	"c",
	"h",
	...keys.map((key) => key[0]).flat()
];
function printShortcutsHelp() {
	stdout().write(`
${y.bold("  Watch Usage")}
${keys.map((i) => y.dim("  press ") + y.reset([i[0]].flat().map(y.bold).join(", ")) + y.dim(` to ${i[1]}`)).join("\n")}
`);
}
function* traverseFilteredTestNames(parentName, filter, t) {
	if (t.type === "test") {
		if (t.name.match(filter)) {
			const displayName = `${parentName} > ${t.name}`;
			yield {
				key: t.name,
				toString: () => displayName
			};
		}
	} else {
		parentName = parentName.length ? `${parentName} > ${t.name}` : t.name;
		for (const task of t.tasks) yield* traverseFilteredTestNames(parentName, filter, task);
	}
}
function* getFilteredTestNames(pattern, suite) {
	try {
		const reg = new RegExp(pattern);
		// TODO: we cannot run tests per workspace yet: filtering files
		const files = /* @__PURE__ */ new Set();
		for (const file of suite) if (!files.has(file.name)) {
			files.add(file.name);
			yield* traverseFilteredTestNames("", reg, file);
		}
	} catch {}
}
function registerConsoleShortcuts(ctx, stdin = process.stdin, stdout) {
	let latestFilename = "";
	async function _keypressHandler(str, key) {
		// Cancel run and exit when ctrl-c or esc is pressed.
		// If cancelling takes long and key is pressed multiple times, exit forcefully.
		if (str === "" || str === "\x1B" || key && key.ctrl && key.name === "c") {
			if (!ctx.isCancelling) {
				ctx.logger.log(y.red("Cancelling test run. Press CTRL+c again to exit forcefully.\n"));
				process.exitCode = 130;
				// Unregister raw mode so that second CTRL+c is handled by Node.js as SIGINT
				off();
				await ctx.cancelCurrentRun("keyboard-input");
			}
			return ctx.exit(true);
		}
		// window not support suspend
		if (!isWindows && key && key.ctrl && key.name === "z") {
			process.kill(process.ppid, "SIGTSTP");
			process.kill(process.pid, "SIGTSTP");
			return;
		}
		const name = key?.name;
		if (ctx.runningPromise) {
			if (cancelKeys.includes(name)) await ctx.cancelCurrentRun("keyboard-input");
			return;
		}
		// quit
		if (name === "q") return ctx.exit(true);
		// help
		if (name === "h") return printShortcutsHelp();
		// update snapshot
		if (name === "u") return ctx.updateSnapshot();
		// rerun all tests
		if (name === "a" || name === "return") {
			const files = await ctx._globTestFilepaths();
			return ctx.changeNamePattern("", files, "rerun all tests");
		}
		// rerun current pattern tests
		if (name === "r") return ctx.rerunFiles();
		// rerun only failed tests
		if (name === "f") return ctx.rerunFailed();
		// change project filter
		if (name === "w") return inputProjectName();
		// change testNamePattern
		if (name === "t") return inputNamePattern();
		// change fileNamePattern
		if (name === "p") return inputFilePattern();
	}
	async function keypressHandler(str, key) {
		await _keypressHandler(str, key);
	}
	async function inputNamePattern() {
		off();
		const filter = await new WatchFilter("Input test name pattern (RegExp)", stdin, stdout).filter((str) => {
			return [...getFilteredTestNames(str, ctx.state.getFiles())];
		});
		on();
		if (typeof filter === "undefined") return;
		const files = ctx.state.getFilepaths();
		// if running in standalone mode, Vitest instance doesn't know about any test file
		const cliFiles = ctx.config.standalone && !files.length ? await ctx._globTestFilepaths() : void 0;
		await ctx.changeNamePattern(filter?.trim() || "", cliFiles, "change pattern");
	}
	async function inputProjectName() {
		off();
		const { filter = "" } = await prompt([{
			name: "filter",
			type: "text",
			message: "Input a single project name",
			initial: ctx.config.project[0] || ""
		}]);
		on();
		await ctx.changeProjectName(filter.trim());
	}
	async function inputFilePattern() {
		off();
		const watchFilter = new WatchFilter("Input filename pattern", stdin, stdout);
		const filter = await watchFilter.filter(async (str) => {
			return (await ctx.globTestSpecifications([str])).map((specification) => relative(ctx.config.root, specification.moduleId)).filter((file, index, all) => all.indexOf(file) === index);
		});
		on();
		if (typeof filter === "undefined") return;
		latestFilename = filter?.trim() || "";
		const lastResults = watchFilter.getLastResults();
		await ctx.changeFilenamePattern(latestFilename, filter && lastResults.length ? lastResults.map((i) => resolve(ctx.config.root, i)) : void 0);
	}
	let rl;
	function on() {
		off();
		rl = readline.createInterface({
			input: stdin,
			escapeCodeTimeout: 50
		});
		readline.emitKeypressEvents(stdin, rl);
		if (stdin.isTTY) stdin.setRawMode(true);
		stdin.on("keypress", keypressHandler);
	}
	function off() {
		rl?.close();
		rl = void 0;
		stdin.removeListener("keypress", keypressHandler);
		if (stdin.isTTY) stdin.setRawMode(false);
	}
	on();
	return function cleanup() {
		off();
	};
}

async function startVitest(modeOrCliFilters, cliFiltersOrOptions, optionsOrViteOverrides, viteOverridesOrVitestOptions, maybeVitestOptions) {
	let cliFilters;
	let options;
	let viteOverrides;
	let vitestOptions;
	if (typeof modeOrCliFilters === "string") {
		cliFilters = cliFiltersOrOptions ?? [];
		options = optionsOrViteOverrides ?? {};
		viteOverrides = viteOverridesOrVitestOptions;
		vitestOptions = maybeVitestOptions;
	} else {
		cliFilters = modeOrCliFilters ?? [];
		options = cliFiltersOrOptions ?? {};
		viteOverrides = optionsOrViteOverrides;
		vitestOptions = viteOverridesOrVitestOptions;
	}
	const root = resolve(options.root || process.cwd());
	const ctx = await prepareVitest(options, viteOverrides, vitestOptions, cliFilters);
	if (ctx._coverageOptions.enabled) {
		const provider = ctx._coverageOptions.provider || "v8";
		const requiredPackages = CoverageProviderMap[provider];
		if (requiredPackages) {
			if (!await ctx.packageInstaller.ensureInstalled(requiredPackages, root, ctx.version)) {
				process.exitCode = 1;
				return ctx;
			}
		}
	}
	const stdin = vitestOptions?.stdin || process.stdin;
	const stdout = vitestOptions?.stdout || process.stdout;
	let stdinCleanup;
	if (stdin.isTTY && ctx.config.watch) stdinCleanup = registerConsoleShortcuts(ctx, stdin, stdout);
	ctx.onAfterSetServer(async () => {
		if (ctx.closingPromise) return;
		try {
			if (ctx.config.standalone) await ctx.standalone();
			else await ctx.start(cliFilters);
		} catch (error) {
			reportStartError(ctx, error);
		}
	});
	try {
		if (ctx.config.listTags) await ctx.listTags();
		else if (ctx.config.clearCache) await ctx.clearCache();
		else if (ctx.config.mergeReports) await ctx.mergeReports();
		else if (ctx.config.standalone) await ctx.standalone();
		else await ctx.start(cliFilters);
		return ctx;
	} catch (e) {
		reportStartError(ctx, e);
		return ctx;
	} finally {
		if (!ctx?.shouldKeepServer()) {
			stdinCleanup?.();
			await ctx.close();
		}
	}
}
function reportStartError(ctx, error) {
	if (error instanceof FilesNotFoundError) return;
	if (error instanceof GitNotFoundError) {
		ctx.logger.error(error.message);
		return;
	}
	if (error instanceof IncludeTaskLocationDisabledError || error instanceof RangeLocationFilterProvidedError || error instanceof LocationFilterFileNotFoundError) {
		ctx.logger.printError(error, { verbose: false });
		return;
	}
	process.exitCode = 1;
	ctx.logger.printError(error, {
		fullStack: true,
		type: "Unhandled Error"
	});
	ctx.logger.error("\n\n");
}
async function prepareVitest(modeOrOptions, optionsOrViteOverrides, viteOverridesOrVitestOptions, vitestOptionsOrCliFilters, maybeCliFilters) {
	let options;
	let viteOverrides;
	let vitestOptions;
	let cliFilters;
	if (typeof modeOrOptions === "string") {
		options = optionsOrViteOverrides ?? {};
		viteOverrides = viteOverridesOrVitestOptions;
		vitestOptions = vitestOptionsOrCliFilters;
		cliFilters = maybeCliFilters;
	} else {
		options = modeOrOptions ?? {};
		viteOverrides = optionsOrViteOverrides;
		vitestOptions = viteOverridesOrVitestOptions;
		cliFilters = vitestOptionsOrCliFilters;
	}
	process.env.TEST = "true";
	process.env.VITEST = "true";
	process.env.NODE_ENV ??= "test";
	if (options.run) options.watch = false;
	if (options.standalone && (cliFilters?.length || 0) > 0) options.standalone = false;
	// this shouldn't affect _application root_ that can be changed inside config
	const root = resolve(options.root || process.cwd());
	const ctx = await createVitest(options, viteOverrides, vitestOptions);
	const environmentPackage = getEnvPackageName(ctx.config.environment);
	if (environmentPackage && !await ctx.packageInstaller.ensureInstalled(environmentPackage, root)) {
		process.exitCode = 1;
		return ctx;
	}
	return ctx;
}
function processCollected(ctx, files, options) {
	let errorsPrinted = false;
	forEachSuite(files, (suite) => {
		suite.errors().forEach((error) => {
			errorsPrinted = true;
			ctx.logger.printError(error, { project: suite.project });
		});
	});
	if (errorsPrinted) return;
	if (typeof options.json !== "undefined") return processJsonOutput(files, options);
	return formatCollectedAsString(files).forEach((test) => console.log(test));
}
function outputFileList(files, options) {
	if (typeof options.json !== "undefined") return outputJsonFileList(files, options);
	formatFilesAsString(files, options).map((file) => console.log(file));
}
function outputJsonFileList(files, options) {
	if (typeof options.json === "boolean") return console.log(JSON.stringify(formatFilesAsJSON(files), null, 2));
	if (typeof options.json === "string") {
		const jsonPath = resolve(options.root || process.cwd(), options.json);
		mkdirSync(dirname(jsonPath), { recursive: true });
		writeFileSync(jsonPath, JSON.stringify(formatFilesAsJSON(files), null, 2));
	}
}
function formatFilesAsJSON(files) {
	return files.map((file) => {
		const result = { file: file.moduleId };
		if (file.project.name) result.projectName = file.project.name;
		return result;
	});
}
function formatFilesAsString(files, options) {
	return files.map((file) => {
		let name = relative(options.root || process.cwd(), file.moduleId);
		if (file.project.name) name = `[${file.project.name}] ${name}`;
		return name;
	});
}
function processJsonOutput(files, options) {
	if (typeof options.json === "boolean") return console.log(JSON.stringify(formatCollectedAsJSON(files), null, 2));
	if (typeof options.json === "string") {
		const jsonPath = resolve(options.root || process.cwd(), options.json);
		mkdirSync(dirname(jsonPath), { recursive: true });
		writeFileSync(jsonPath, JSON.stringify(formatCollectedAsJSON(files), null, 2));
	}
}
function forEachSuite(modules, callback) {
	modules.forEach((testModule) => {
		callback(testModule);
		for (const suite of testModule.children.allSuites()) callback(suite);
	});
}
function formatCollectedAsJSON(files) {
	const results = [];
	files.forEach((file) => {
		for (const test of file.children.allTests()) {
			if (test.result().state === "skipped") continue;
			const result = {
				name: test.fullName,
				file: test.module.moduleId
			};
			if (test.project.name) result.projectName = test.project.name;
			if (test.location) result.location = test.location;
			results.push(result);
		}
	});
	return results;
}
function formatCollectedAsString(testModules) {
	const results = [];
	testModules.forEach((testModule) => {
		for (const test of testModule.children.allTests()) {
			if (test.result().state === "skipped") continue;
			const fullName = `${test.module.task.name} > ${test.fullName}`;
			results.push((test.project.name ? `[${test.project.name}] ` : "") + fullName);
		}
	});
	return results;
}
const envPackageNames = {
	"jsdom": "jsdom",
	"happy-dom": "happy-dom",
	"edge-runtime": "@edge-runtime/vm"
};
function getEnvPackageName(env) {
	if (env === "node") return null;
	if (env in envPackageNames) return envPackageNames[env];
	if (env[0] === "." || isAbsolute(env)) return null;
	return `vitest-environment-${env}`;
}

var cliApi = /*#__PURE__*/Object.freeze({
  __proto__: null,
  outputFileList: outputFileList,
  prepareVitest: prepareVitest,
  processCollected: processCollected,
  startVitest: startVitest
});

export { cliApi as a, createVitest as c, registerConsoleShortcuts as r, startVitest as s };
