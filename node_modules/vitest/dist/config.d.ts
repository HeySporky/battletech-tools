import { HookHandler, UserConfig, ConfigEnv } from 'vite';
export { ConfigEnv, Plugin, UserConfig as ViteUserConfig, mergeConfig } from 'vite';
import { F as FieldsWithDefaultValues, U as UserWorkspaceConfig, a as UserProjectConfigFn, b as UserProjectConfigExport } from './chunks/plugin.d.CN87HSxv.js';
import { InlineConfig, ResolvedConfig, VitestPluginContext, CoverageOptions } from './node.js';
export { T as TestProjectConfiguration, c as TestProjectInlineConfiguration, d as TestUserConfig, W as WatcherTriggerPattern } from './chunks/plugin.d.CN87HSxv.js';
import { C as Config } from './chunks/config.d.CU_b-wJj.js';
export { e as TestTagDefinition } from './chunks/config.d.CU_b-wJj.js';
import 'node:stream';
import './chunks/browser.d.g5Thl309.js';
import './chunks/rpc.d.DA9Utv4e.js';
import 'vite/module-runner';
import './chunks/worker.d.MLmnzOJE.js';
import './chunks/environment.d.C6xYahWA.js';
import 'chai';
import 'vitest/optional-types.js';
import '@vitest/mocker';
import './chunks/source-map.d.YqWNcp4e.js';
import 'vitest/browser';
import 'node:path';
import 'node:console';
import 'node:fs/promises';
import 'node:fs';
import 'vitest/optional-runtime-types.js';
import 'tinybench';

type VitestInlineConfig = InlineConfig;
type VitestResolvedConfig = ResolvedConfig;
declare module "vite" {
	interface UserConfig {
		/**
		* Options for Vitest
		*/
		test?: VitestInlineConfig;
	}
	interface ResolvedConfig {
		/**
		* Options for Vitest
		*/
		test: VitestResolvedConfig;
	}
	interface Plugin<A = any> {
		configureVitest?: HookHandler<(context: VitestPluginContext) => void>;
	}
}

declare const defaultBrowserPort = 63315;

declare const defaultInclude: string[];
declare const defaultExclude: string[];
declare const coverageConfigDefaults: Required<Pick<CoverageOptions, FieldsWithDefaultValues>>;
declare const configDefaults: Readonly<{
	allowOnly: boolean;
	isolate: boolean;
	watch: boolean;
	globals: boolean;
	injectCjsGlobals: boolean;
	environment: "node";
	clearMocks: boolean;
	restoreMocks: boolean;
	mockReset: boolean;
	unstubGlobals: boolean;
	unstubEnvs: boolean;
	include: string[];
	exclude: string[];
	teardownTimeout: number;
	forceRerunTriggers: string[];
	update: boolean;
	reporters: string[];
	silent: boolean;
	hideSkippedTests: boolean;
	api: boolean;
	ui: boolean;
	uiBase: string;
	open: boolean;
	css: {
		include: never[];
	};
	coverage: CoverageOptions;
	fakeTimers: Config;
	maxConcurrency: number;
	dangerouslyIgnoreUnhandledErrors: boolean;
	typecheck: {
		checker: "tsc";
		include: string[];
		exclude: string[];
	};
	slowTestThreshold: number;
	taskTitleValueFormatTruncate: number;
	disableConsoleIntercept: boolean;
	detectAsyncLeaks: boolean;
}>;

type ViteUserConfigFnObject = (env: ConfigEnv) => UserConfig;
type ViteUserConfigFnPromise = (env: ConfigEnv) => Promise<UserConfig>;
type ViteUserConfigFn = (env: ConfigEnv) => UserConfig | Promise<UserConfig>;
type ViteUserConfigExport = UserConfig | Promise<UserConfig> | ViteUserConfigFnObject | ViteUserConfigFnPromise | ViteUserConfigFn;
declare function defineConfig(config: UserConfig): UserConfig;
declare function defineConfig(config: Promise<UserConfig>): Promise<UserConfig>;
declare function defineConfig(config: ViteUserConfigFnObject): ViteUserConfigFnObject;
declare function defineConfig(config: ViteUserConfigFnPromise): ViteUserConfigFnPromise;
declare function defineConfig(config: ViteUserConfigExport): ViteUserConfigExport;
declare function defineProject(config: UserWorkspaceConfig): UserWorkspaceConfig;
declare function defineProject(config: Promise<UserWorkspaceConfig>): Promise<UserWorkspaceConfig>;
declare function defineProject(config: UserProjectConfigFn): UserProjectConfigFn;
declare function defineProject(config: UserProjectConfigExport): UserProjectConfigExport;

export { UserProjectConfigExport, UserProjectConfigFn, UserWorkspaceConfig, configDefaults, coverageConfigDefaults, defaultBrowserPort, defaultExclude, defaultInclude, defineConfig, defineProject };
export type { ViteUserConfigExport, ViteUserConfigFn, ViteUserConfigFnObject, ViteUserConfigFnPromise };
