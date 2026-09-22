//#region src/task.d.ts
/**
 * A class that represents each benchmark task in Tinybench. It keeps track of the
 * results, name, the task function, the number times the task function has been executed, ...
 */
declare class Task extends EventTarget {
  #private;
  addEventListener: (<K extends TaskEvents>(type: K, listener: EventListener<K, 'task'> | EventListenerObject<K, 'task'> | null, options?: AddEventListenerOptionsArgument) => void) & EventTarget['addEventListener'];
  removeEventListener: (<K extends TaskEvents>(type: K, listener: EventListener<K, 'task'> | EventListenerObject<K, 'task'> | null, options?: RemoveEventListenerOptionsArgument) => void) & EventTarget['removeEventListener'];
  /**
   * The estimated effective timer resolution observed during the last run,
   * computed as the smallest strictly positive latency sample that repeats
   * among the timer-measured samples, or the smallest strictly positive
   * sample when none repeats (samples supplied via `overriddenDuration` are
   * excluded). When `subtractTimerOverhead` is enabled the value is derived
   * from the overhead-corrected samples rather than the raw timer grain.
   * @returns The resolution in milliseconds, or `undefined` when no
   *   timer-measured strictly positive sample was observed (e.g. every
   *   sample was supplied via `overriddenDuration`)
   */
  get detectedResolution(): number | undefined;
  /**
   * The name of the task.
   * @returns The task name as a string
   */
  get name(): string;
  /**
   * The result of the task.
   * @returns The task result including state, statistics, and runtime information
   */
  get result(): TaskResult & TaskResultRuntimeInfo & TaskResultTimestampProviderInfo;
  /**
   * The number of times the task function has been executed.
   * @returns The total number of executions performed
   */
  get runs(): number;
  constructor(bench: BenchLike, name: string, fn: Fn, fnOpts?: FnOptions);
  /**
   * Resets the task to make the `Task.runs` a zero-value and remove the `Task.result` object property.
   * @param emit - whether to emit the `reset` event or not
   */
  reset(emit?: boolean): void;
  /**
   * Runs the current task and writes the results in `Task.result` object property.
   * @returns the current task
   */
  run(): Promise<Task>;
  /**
   * Runs the current task synchronously and writes the results in `Task.result` object property.
   * @returns the current task
   */
  runSync(): this;
  /**
   * Warms up the current task.
   */
  warmup(): Promise<void>;
  /**
   * Warms up the current task synchronously.
   */
  warmupSync(): void;
}
//#endregion
//#region src/event.d.ts
/**
 * The BenchEvent class represents events that occur during the benchmarking
 * process.
 */
declare class BenchEvent<K extends BenchEvents = BenchEvents, M extends 'bench' | 'task' = 'bench'> extends globalThis.Event {
  #private;
  type: K;
  /**
   * The error associated with the event.
   * @returns The error if the event type is one that includes an error; otherwise, undefined
   */
  get error(): K extends BenchEventsWithError ? Error : undefined;
  /**
   * The reason a `'warning'` event was dispatched.
   * @returns The {@link TimerSaturationReason} for `'warning'` events;
   *   `undefined` for every other event type and for `'warning'` events
   *   dispatched without a reason
   */
  get reason(): K extends 'warning' ? TimerSaturationReason | undefined : undefined;
  /**
   * The task associated with the event.
   * @returns The task if the event type is one that includes a task; otherwise, undefined
   */
  get task(): M extends 'task' ? Task : K extends BenchEventsWithTask ? Task : undefined;
  constructor(type: 'warning', task: Task, reason?: TimerSaturationReason);
  constructor(type: BenchEventsWithError, task: Task, error: Error);
  constructor(type: BenchEventsWithTask, task: Task);
  constructor(type: BenchEventsOptionalTask, task?: Task);
}
//#endregion
//#region src/types.d.ts
/**
 * Options for adding an event listener
 */
type AddEventListenerOptionsArgument = Parameters<EventTarget['addEventListener']>[2];
/**
 * Bench events
 */
type BenchEvents = 'abort' | 'add' | 'complete' | 'cycle' | 'error' | 'remove' | 'reset' | 'start' | 'warmup' | 'warning';
/**
 * Bench events that may have an associated Task
 */
type BenchEventsOptionalTask = Exclude<BenchEvents, 'add' | 'cycle' | 'error' | 'remove'>;
/**
 * Bench events that have an associated error
 */
type BenchEventsWithError = Extract<BenchEvents, 'error'>;
/**
 * Bench events that have an associated Task
 */
type BenchEventsWithTask = Extract<BenchEvents, 'add' | 'cycle' | 'error' | 'remove' | 'warning'>;
/**
 * Used to decouple Bench and Task
 */
interface BenchLike extends EventTarget {
  /**
   * Adds a listener for the specified event type.
   */
  addEventListener: (<K extends BenchEvents>(type: K, listener: EventListener<K> | EventListenerObject<K> | null, options?: AddEventListenerOptionsArgument) => void) & EventTarget['addEventListener'];
  /**
   * Executes tasks concurrently based on the specified concurrency mode, if set.
   *
   * - When `mode` is set to `null` (default), concurrency is disabled.
   * - When `mode` is set to 'task', each task's iterations (calls of a task function) run concurrently.
   * - When `mode` is set to 'bench', different tasks within the bench run concurrently.
   */
  concurrency: Concurrency;
  /**
   * The amount of executions per task.
   */
  iterations: number;
  /**
   * A function to get a timestamp.
   */
  now: NowFn;
  /**
   * Removes a previously registered event listener.
   */
  removeEventListener: (<K extends BenchEvents>(type: K, listener: EventListener<K> | EventListenerObject<K> | null, options?: RemoveEventListenerOptionsArgument) => void) & EventTarget['removeEventListener'];
  /**
   * Should samples be retained for further custom processing
   */
  retainSamples: boolean;
  /**
   * The JavaScript runtime environment.
   */
  runtime: JSRuntime;
  /**
   * The JavaScript runtime version.
   */
  runtimeVersion: string;
  /**
   * A setup function that runs before each task execution.
   */
  setup: (task: Task, mode: HookMode) => Promise<void> | void;
  /**
   * An AbortSignal to cancel the benchmark
   */
  signal?: AbortSignal;
  /**
   * A teardown function that runs after each task execution.
   */
  teardown: (task: Task, mode: HookMode) => Promise<void> | void;
  /**
   * The maximum number of concurrent tasks to run
   */
  threshold: number;
  /**
   * Whether to throw an error if a task function throws
   */
  throws: boolean;
  /**
   * The amount of time to run each task.
   */
  time: number;
  /**
   * The estimated cost of one timestamp provider call in milliseconds.
   *
   * Calibrated once at construction; `undefined` (or omitted) when timer
   * overhead subtraction is disabled or unsupported by the implementation.
   */
  readonly timerOverhead?: number;
  /**
   * The timestamp provider used by the benchmark.
   */
  timestampProvider: TimestampProvider;
  /**
   * Whether to warmup the tasks before running them
   */
  warmup: boolean;
  /**
   * The amount of warmup iterations per task.
   */
  warmupIterations: number;
  /**
   * The amount of time to warmup each task.
   */
  warmupTime: number;
}
/**
 * Bench options
 */
interface BenchOptions {
  /**
   * Executes tasks concurrently based on the specified concurrency mode.
   *
   * - When `mode` is set to `null` (default), concurrency is disabled.
   * - When `mode` is set to 'task', each task's iterations (calls of a task function) run concurrently.
   * - When `mode` is set to 'bench', different tasks within the bench run concurrently.
   */
  concurrency?: Concurrency;
  /**
   * The number of times that a task should run if even the time option is finished.
   * @default 64
   */
  iterations?: number;
  /**
   * Benchmark name.
   */
  name?: string;
  /**
   * Function to get the current timestamp in milliseconds.
   */
  now?: NowFn;
  /**
   * Keep samples for statistics calculation
   * @default false
   */
  retainSamples?: boolean;
  /**
   * Setup function to run before each benchmark task (cycle)
   */
  setup?: Hook;
  /**
   * An AbortSignal for aborting the benchmark.
   */
  signal?: AbortSignal;
  /**
   * Whether to subtract an estimated timestamp provider call overhead from
   * each raw latency sample.
   *
   * Each sample is measured as `t1 - t0` around a single call to the task
   * function, so every raw sample is inflated by approximately one
   * timestamp provider call cost `C`. When this option is `true`, an
   * estimate `Ĉ` is computed once at construction time via
   * {@link calibrateTimerOverhead}, and `max(0, raw_sample - Ĉ)` is used
   * in place of each non-overridden sample before statistics are computed.
   *
   * **Statistics after correction.** All fields of {@link Statistics} are
   * derived from the clamped corrected samples, not from the raw
   * distribution. With `M` denoting the raw-sample mean:
   *
   * - **Clean-shift regime (`X >> Ĉ`).** The clamp `max(0, …)` rarely
   *   triggers, so the correction acts as a translation by `Ĉ`. Location
   *   statistics (`mean`, `min`, `max`, all percentiles) decrease by `Ĉ`;
   *   absolute-unit dispersion (`vr`, `sd`, `sem`, `moe`, `mad`, `aad`)
   *   is essentially unchanged. Because `rme = moe / mean`, it inflates
   *   by the deterministic factor `M / (M − Ĉ)` whenever `Ĉ > 0`.
   * - **Sub-overhead regime (`X ≈ Ĉ`).** A non-trivial fraction of
   *   samples clamp to `0`, biasing the corrected mean upward,
   *   contracting `vr`/`sd`/`sem`/`moe`/`aad`, and compounding the
   *   `M / (M − Ĉ)` factor in `rme`. Once the cumulative mass of raw
   *   samples at or below `Ĉ` reaches a given quantile, that percentile
   *   collapses to `0`; in particular `p50` collapses once at least half
   *   of the raw samples satisfy `raw_sample ≤ Ĉ`, which then forces
   *   `mad` and `aad` toward `0`. Prefer `overriddenDuration` for
   *   sub-overhead measurements.
   *
   * **Three observable consequences of the clamp.**
   *
   * 1. `latency.min` may be exactly `0` even when no zero-duration sample
   *    was actually observed.
   * 2. The throughput estimator substitutes `1000 / latency.mean` (or `0`
   *    when `mean === 0`) for every clamped sample.
   * 3. {@link detectTimerSaturation} criterion `'zero-dominated'` cannot
   *    distinguish clamped samples from genuine zero-duration timer
   *    reads, so a `'warning'` event may be dispatched in the
   *    sub-overhead regime even when the timer itself is not saturated.
   *
   * **Caveat — `concurrency: "task"`.** The overhead is calibrated once
   * at construction time with sequential timer calls. Setting both
   * options causes the constructor (and `run()`) to throw, since the
   * sequentially-calibrated estimate would not reflect the per-iteration
   * timer call cost under concurrent execution.
   *
   * **Caveat — `overriddenDuration`.** Samples returned by the task
   * function via `overriddenDuration` are intentional user values and
   * are never modified by the correction. They are also excluded from
   * {@link Task.detectedResolution} and from timer-saturation detection.
   *
   * On runtimes with a coarse timer (resolution >= 1 ms), the
   * calibration returns `0` and this option becomes a no-op.
   * @default false
   */
  subtractTimerOverhead?: boolean;
  /**
   * Teardown function to run after each benchmark task (cycle).
   */
  teardown?: Hook;
  /**
   * The maximum number of concurrent tasks to run
   * @default Number.POSITIVE_INFINITY
   */
  threshold?: number;
  /**
   * Throws if a task fails.
   * @default false
   */
  throws?: boolean;
  /**
   * Time needed for running a benchmark task in milliseconds.
   * @default 1000
   */
  time?: number;
  /**
   * The timestamp provider used by the benchmark. By default 'performance.now'
   * will be used.
   */
  timestampProvider?: TimestampFns | TimestampProvider;
  /**
   * Warmup benchmark.
   * @default true
   */
  warmup?: boolean;
  /**
   * Warmup iterations.
   * @default 16
   */
  warmupIterations?: number;
  /**
   * Warmup time in milliseconds.
   * @default 250
   */
  warmupTime?: number;
}
/**
 * - When `mode` is set to `null` (default), concurrency is disabled.
 * - When `mode` is set to 'task', each task's iterations (calls of a task function) run concurrently.
 * - When `mode` is set to 'bench', different tasks within the bench run concurrently.
 */
type Concurrency = 'bench' | 'task' | null;
/**
 * Converts a Task to a console.table friendly object
 */
type ConsoleTableConverter = (task: Task) => Record<string, number | string>;
/**
 * Event listener
 */
type EventListener<E extends BenchEvents, M extends 'bench' | 'task' = 'bench'> = (evt: BenchEvent<E, M>) => void;
/**
 * Both the `Task` and `Bench` objects extend the `EventTarget` object.
 * So you can attach a listeners to different types of events to each class instance
 * using the universal `addEventListener` and `removeEventListener` methods.
 */
interface EventListenerObject<E extends BenchEvents, M extends 'bench' | 'task' = 'bench'> {
  /**
   * A method called when the event is dispatched.
   */
  handleEvent(evt: BenchEvent<E, M>): void;
}
/**
 * The task function.
 *
 * If you need to provide a custom duration for the task (e.g.: because
 * you want to measure a specific part of its execution), you can return an
 * object with a `overriddenDuration` field. You should still use
 * `bench.opts.now()` to measure that duration.
 */
type Fn = () => FnReturnedObject | Promise<FnReturnedObject | unknown> | unknown;
/**
 * The task hook function signature.
 * If warmup is enabled, the hook will be called twice, once for the warmup and once for the run.
 * @param mode the mode where the hook is being called
 */
type FnHook = (this: Task, mode?: HookMode) => Promise<void> | void;
/**
 * The task function options
 */
interface FnOptions {
  /**
   * An optional function that is run after all iterations of this task end
   */
  afterAll?: FnHook;
  /**
   * An optional function that is run after each iteration of this task
   */
  afterEach?: FnHook;
  /**
   * Whether the provided task function is asynchronous, otherwise it is
   * determined automatically.
   *
   * Measuring an async task awaits it inside the timed window, so each sample
   * includes one microtask-turn overhead that `subtractTimerOverhead` does not
   * remove. For sub-resolution timings, prefer `overriddenDuration`.
   */
  async?: boolean;
  /**
   * An optional function that is run before iterations of this task begin
   */
  beforeAll?: FnHook;
  /**
   * An optional function that is run before each iteration of this task
   */
  beforeEach?: FnHook;
  /**
   * Retain samples for this task, overriding the bench-level retainSamples option
   */
  retainSamples?: boolean;
  /**
   * An AbortSignal for aborting this specific task
   *
   * If not provided, falls back to {@link BenchOptions.signal}
   */
  signal?: AbortSignal;
}
/**
 * A possible object returned by task functions to override default behaviors,
 * like the duration of the function itself.
 */
interface FnReturnedObject {
  /**
   * An overridden duration for the task function, to be used instead of the
   * duration measured by tinybench when running the benchmark.
   *
   * This can be useful to measure parts of the execution of a function that are
   * hard to execute independently.
   */
  overriddenDuration?: number;
}
/**
 * The hook function signature.
 * If warmup is enabled, the hook will be called twice, once for the warmup and once for the run.
 * @param task the task instance
 * @param mode the mode where the hook is being called
 */
type Hook = (task?: Task, mode?: HookMode) => Promise<void> | void;
/**
 * The mode in which a task hook is invoked ('warmup' or 'run').
 */
type HookMode = 'run' | 'warmup';
/**
 * The JavaScript runtime environment.
 * @see https://runtime-keys.proposal.wintercg.org/
 */
type JSRuntime = 'browser' | 'bun' | 'deno' | 'edge-light' | 'fastly' | 'hermes' | 'jsc' | 'lagon' | 'moddable' | 'netlify' | 'node' | 'quickjs-ng' | 'spidermonkey' | 'unknown' | 'v8' | 'workerd';
/**
 * A function that returns the current timestamp.
 */
type NowFn = () => number;
type RemoveEventListenerOptionsArgument = Parameters<EventTarget['removeEventListener']>[2];
/**
 * The resolved benchmark options
 */
interface ResolvedBenchOptions extends BenchOptions {
  iterations: NonNullable<BenchOptions['iterations']>;
  now: NonNullable<BenchOptions['now']>;
  setup: NonNullable<BenchOptions['setup']>;
  subtractTimerOverhead: NonNullable<BenchOptions['subtractTimerOverhead']>;
  teardown: NonNullable<BenchOptions['teardown']>;
  throws: NonNullable<BenchOptions['throws']>;
  time: NonNullable<BenchOptions['time']>;
  warmup: NonNullable<BenchOptions['warmup']>;
  warmupIterations: NonNullable<BenchOptions['warmupIterations']>;
  warmupTime: NonNullable<BenchOptions['warmupTime']>;
}
/**
 * A type representing a samples-array with at least one number.
 */
type Samples = [number, ...number[]];
/**
 * A type representing a sorted samples-array with at least one number.
 */
type SortedSamples = Samples & {
  /**
   * A unique symbol to identify sorted samples
   */
  readonly __sorted__: unique symbol;
};
/**
 * The statistics object
 */
interface Statistics {
  /**
   * mean/average absolute deviation
   */
  aad: number;
  /**
   * critical value
   */
  critical: number;
  /**
   * degrees of freedom
   */
  df: number;
  /**
   * median absolute deviation, not scaled by the 1.4826 normal-consistency factor
   */
  mad: number;
  /**
   * the maximum value
   */
  max: number;
  /**
   * mean/average
   */
  mean: number;
  /**
   * the minimum value
   */
  min: number;
  /**
   * margin of error
   */
  moe: number;
  /**
   * p50/median percentile
   */
  p50: number;
  /**
   * p75 percentile
   */
  p75: number;
  /**
   * p99 percentile
   */
  p99: number;
  /**
   * p995 percentile
   */
  p995: number;
  /**
   * p999 percentile
   */
  p999: number;
  /**
   * relative margin of error
   */
  rme: number;
  /**
   * samples used to calculate the statistics
   */
  samples: SortedSamples | undefined;
  /**
   * samples count
   */
  samplesCount: number;
  /**
   * standard deviation
   */
  sd: number;
  /**
   * standard error of the mean/average (a.k.a. the standard deviation of the distribution of the sample mean/average)
   */
  sem: number;
  /**
   * variance
   */
  variance: number;
}
/**
 * Task events
 */
type TaskEvents = Extract<BenchEvents, 'abort' | 'complete' | 'cycle' | 'error' | 'reset' | 'start' | 'warmup' | 'warning'>;
/**
 * The task result
 */
type TaskResult = TaskResultAborted | TaskResultAbortedWithStatistics | TaskResultCompleted | TaskResultErrored | TaskResultNotStarted | TaskResultStarted;
/**
 * The task result for aborted tasks.
 */
interface TaskResultAborted {
  /**
   * the task state
   */
  state: 'aborted';
}
/**
 * The task result for aborted tasks, having also statistical data.
 */
interface TaskResultAbortedWithStatistics extends TaskResultWithStatistics {
  /**
   * the task state
   */
  state: 'aborted-with-statistics';
}
/**
 * The task result for completed tasks with statistical data.
 */
interface TaskResultCompleted extends TaskResultWithStatistics {
  /**
   * the task state
   */
  state: 'completed';
}
/**
 * The task result for errored tasks
 */
interface TaskResultErrored {
  /**
   * the error that caused the task to fail
   */
  error: Error;
  /**
   * the task state
   */
  state: 'errored';
}
/**
 * The task result for not started tasks
 */
interface TaskResultNotStarted {
  /**
   * the task state
   */
  state: 'not-started';
}
/**
 * The additional runtime information for task results
 */
interface TaskResultRuntimeInfo {
  /**
   * the JavaScript runtime environment
   */
  runtime: JSRuntime;
  /**
   * the JavaScript runtime version
   */
  runtimeVersion: string;
}
/**
 * The task result for started tasks
 */
interface TaskResultStarted {
  /**
   * the task state
   */
  state: 'started';
}
/**
 * The timestamp provider information for task results
 */
interface TaskResultTimestampProviderInfo {
  /**
   * the name of the timestamp provider used during the benchmark
   */
  timestampProviderName: TimestampProviderName;
}
/**
 * The statistical data for task results
 */
interface TaskResultWithStatistics {
  /**
   * the task latency statistics
   */
  latency: Statistics;
  /**
   * how long each operation takes (ms)
   */
  period: number;
  /**
   * the task throughput statistics
   */
  throughput: Statistics;
  /**
   * the time to run the task benchmark cycle (ms)
   */
  totalTime: number;
}
/**
 * Reason a sample set is classified as timer-saturated.
 *
 * - `'zero-dominated'` — more than half of the samples are exactly zero.
 * - `'low-distinct'` — distinct sample count is below
 *   `max(3, min(10, ⌊n / 1000⌋))`.
 * - `'zero-mad'` — median absolute deviation is zero with more than 100
 *   samples.
 */
type TimerSaturationReason = 'low-distinct' | 'zero-dominated' | 'zero-mad';
/**
 * A timestamp function that returns either a number or bigint.
 */
type TimestampFn = () => TimestampValue;
/**
 * Possible timestamp provider names.
 * 'custom' is used when a custom timestamp function is provided.
 */
type TimestampFns = 'auto' | 'bunNanoseconds' | 'custom' | 'hrtimeNow' | 'performanceNow';
/**
 * A timestamp provider and its related functions.
 */
interface TimestampProvider {
  /**
   * The actual function of the timestamp provider.
   * @returns the timestamp value
   */
  fn: TimestampFn;
  /**
   * Converts milliseconds to the timestamp value.
   * @param value - the milliseconds value
   * @returns the timestamp value
   */
  fromMs: (value: number) => TimestampValue;
  /**
   * The name of the timestamp provider.
   */
  name: TimestampProviderName;
  /**
   * Converts the timestamp value to milliseconds.
   * @param value - the timestamp value
   * @returns the milliseconds
   */
  toMs: (value: TimestampValue) => number;
}
/**
 * The name of a timestamp provider: a known provider name or any custom string.
 */
type TimestampProviderName = (string & {}) | TimestampFns;
/**
 * A timestamp value, either number or bigint. Internally timestamps can use
 * either representation depending on the environment and the chosen timestamp
 * function.
 */
type TimestampValue = bigint | number;
//#endregion
//#region src/bench.d.ts
/**
 * The Bench class keeps track of the benchmark tasks and controls them.
 */
declare class Bench extends EventTarget implements BenchLike {
  #private;
  addEventListener: (<K extends BenchEvents>(type: K, listener: EventListener<K> | EventListenerObject<K> | null, options?: AddEventListenerOptionsArgument) => void) & EventTarget['addEventListener'];
  /**
   * Executes tasks concurrently based on the specified concurrency mode.
   *
   * - When `mode` is set to `null` (default), concurrency is disabled.
   * - When `mode` is set to 'task', each task's iterations (calls of a task function) run concurrently.
   * - When `mode` is set to 'bench', different tasks within the bench run concurrently.
   */
  readonly concurrency: Concurrency;
  /**
   * The amount of executions per task.
   */
  readonly iterations: number;
  /**
   * The benchmark name.
   */
  readonly name: string | undefined;
  /**
   * A function to get a timestamp.
   */
  readonly now: NowFn;
  /**
   * Removes a previously registered event listener.
   */
  removeEventListener: (<K extends BenchEvents>(type: K, listener: EventListener<K> | EventListenerObject<K> | null, options?: RemoveEventListenerOptionsArgument) => void) & EventTarget['removeEventListener'];
  readonly retainSamples: boolean;
  /**
   * The JavaScript runtime environment.
   */
  readonly runtime: JSRuntime;
  /**
   * The JavaScript runtime version.
   */
  readonly runtimeVersion: string;
  /**
   * A setup function that runs before each task execution.
   */
  readonly setup: (task: Task, mode: HookMode) => Promise<void> | void;
  /**
   * An AbortSignal to cancel the benchmark.
   */
  readonly signal?: AbortSignal;
  /**
   * Whether to subtract an estimated timestamp provider call overhead from
   * each raw latency sample.
   *
   * Incompatible with `concurrency: 'task'`. Enforced at construction and
   * re-checked at the start of {@link Bench.run} to guard against untyped
   * (JS-side) mutation of the `readonly` `concurrency` field after
   * construction.
   * @default false
   */
  readonly subtractTimerOverhead: boolean;
  /**
   * A teardown function that runs after each task execution.
   */
  readonly teardown: (task: Task, mode: HookMode) => Promise<void> | void;
  /**
   * The maximum number of concurrent tasks to run
   * @default Number.POSITIVE_INFINITY
   */
  readonly threshold: number;
  /**
   * Whether to throw an error if a task function throws
   * @default false
   */
  readonly throws: boolean;
  /**
   * The amount of time to run each task.
   */
  readonly time: number;
  /**
   * The estimated cost of one timestamp provider call in milliseconds.
   *
   * `undefined` when {@link subtractTimerOverhead} is `false`.
   * Otherwise calibrated once at construction time via
   * {@link calibrateTimerOverhead}.
   */
  readonly timerOverhead?: number;
  /**
   * A timestamp provider and its related functions.
   */
  readonly timestampProvider: TimestampProvider;
  /**
   * Whether to warmup the tasks before running them
   */
  readonly warmup: boolean;
  /**
   * The amount of warmup iterations per task.
   */
  readonly warmupIterations: number;
  /**
   * The amount of time to warmup each task.
   */
  readonly warmupTime: number;
  /**
   * The tasks results as an array.
   * @returns the tasks results
   */
  get results(): Readonly<TaskResult>[];
  /**
   * The tasks as an array.
   * @returns An array containing all benchmark tasks
   */
  get tasks(): Task[];
  constructor(options?: BenchOptions);
  /**
   * Adds a benchmark task to the task map.
   * @param name - the task name
   * @param fn - the task function
   * @param fnOpts - the task function options
   * @returns the Bench instance
   * @throws {Error} when a task with the same name already exists
   */
  add(name: string, fn: Fn, fnOpts?: FnOptions): this;
  /**
   * Gets a task based on the task name.
   * @param name - the task name
   * @returns the Task instance or undefined if not found
   */
  getTask(name: string): Task | undefined;
  /**
   * Removes a benchmark task from the task map.
   * @param name - the task name
   * @returns the Bench instance
   */
  remove(name: string): this;
  /**
   * Resets all tasks and removes their results.
   */
  reset(): void;
  /**
   * Runs the added benchmark tasks.
   * @returns the tasks array
   */
  run(): Promise<Task[]>;
  /**
   * Runs the added benchmark tasks synchronously.
   * @returns the tasks array
   */
  runSync(): Task[];
  /**
   * Returns the tasks results as a table.
   * @param convert - an optional callback to convert the task result to a table record
   * @returns the tasks results as an array of table records
   */
  table(convert?: ConsoleTableConverter): (null | Record<string, number | string | undefined>)[];
}
//#endregion
//#region src/utils.d.ts
/**
 * Converts nanoseconds to milliseconds.
 * @param ns - the nanoseconds to convert
 * @returns the milliseconds
 */
declare const nToMs: (ns: TimestampValue) => number;
/**
 * Converts milliseconds to nanoseconds.
 * @param ms - the milliseconds to convert
 * @returns the nanoseconds
 */
declare const mToNs: (ms: TimestampValue) => number;
/**
 * Formats a number with the specified significant digits and maximum fraction digits.
 * @param value - the number to format
 * @param significantDigits - the number of significant digits in the output to aim for
 * @param maxFractionDigits - hard limit for the number of digits after the decimal dot
 * @returns the formatted number
 */
declare const formatNumber: (value: number, significantDigits?: number, maxFractionDigits?: number) => string;
/**
 * Classifies timer saturation in a latency sample set.
 *
 * Criteria are evaluated in the fixed order `'zero-dominated'` →
 * `'low-distinct'` → `'zero-mad'`; the first match wins. Fewer than 10
 * samples are never classified — with so few measurements the criteria
 * cannot reliably distinguish a deterministic fast function from one truly
 * limited by the timer grain.
 *
 * The distinct-value count is computed in O(n) by exploiting the
 * sorted-ascending invariant of `samples` and short-circuits as soon as
 * the threshold is reached.
 * @param samples - the latency samples, sorted ascending
 * @param mad - the median absolute deviation (e.g. from
 *   {@link medianAbsoluteDeviation} or `computeStatistics`)
 * @returns the saturation reason, or `undefined` when no criterion fires
 */
declare const classifyTimerSaturation: (samples: SortedSamples, mad: number) => TimerSaturationReason | undefined;
/**
 * Detects timer saturation in a latency sample set.
 *
 * Boolean wrapper around {@link classifyTimerSaturation}; prefer the
 * classifier when the specific reason is needed (e.g. to surface it on a
 * `'warning'` event).
 * @param samples - the latency samples, sorted ascending
 * @param mad - the median absolute deviation
 * @returns `true` when a saturation criterion fires, `false` otherwise
 */
declare const detectTimerSaturation: (samples: SortedSamples, mad: number) => boolean;
/**
 * Estimates the effective timer resolution from a latency sample set.
 *
 * The estimator returns the smallest strictly positive sample value that
 * appears at least twice (the smallest reproducibly observed increment).
 * Requiring two occurrences gives a 2/n breakdown point and avoids being
 * pulled to an artificially low value by a single anomalous sample (cold
 * cache, GC pause, hardware quirk).
 *
 * When no positive value appears more than once (e.g. a continuous
 * sub-microsecond timer with all unique samples), falls back to the strict
 * minimum of the positive values, which is the best available lower bound
 * in that case.
 *
 * Exploits the sorted-ascending invariant: equal values are contiguous, so
 * the first strictly-positive value with an equal successor is the smallest
 * reproduced value, and the first strictly-positive value is the fallback
 * minimum. Runs in O(1) extra space with an early exit.
 * @param samples - the latency samples, sorted ascending
 * @returns the estimated resolution in milliseconds, or `undefined` when no
 *   strictly positive sample is observed
 */
declare const estimateResolution: (samples: SortedSamples) => number | undefined;
/**
 * Options for {@link calibrateTimerOverhead}.
 */
interface CalibrateTimerOverheadOptions {
  /**
   * Estimator used to reduce the distribution of strictly-positive
   * back-to-back call deltas to a single overhead value.
   * @default 'median'
   */
  estimator?: TimerOverheadEstimatorKind;
  /**
   * Number of back-to-back call pairs to measure during the collection phase.
   * @default 1024
   */
  pairs?: number;
  /**
   * Number of discarded warm-up pairs executed before the collection phase,
   * allowing the JIT to reach a steady compilation tier for both
   * `provider.fn` and `provider.toMs`.
   * @default 64
   */
  warmupPairs?: number;
}
/**
 * Estimator strategy for {@link calibrateTimerOverhead}.
 *
 * - `'median'` — median of strictly-positive deltas (default). Robust to
 *   occasional OS-scheduling jitter and GC spikes at the cost of a slight
 *   upward bias on noisy hosts.
 * - `'min'` — minimum of strictly-positive deltas. Captures the lowest
 *   observed call cost.
 * - `'p05'` — 5th percentile of strictly-positive deltas. A compromise
 *   between robustness and tightness.
 */
type TimerOverheadEstimatorKind = 'median' | 'min' | 'p05';
/**
 * Estimates the cost of a single `provider.fn()` call by repeatedly measuring
 * back-to-back pairs and reducing the strictly-positive deltas to a single
 * value via the chosen estimator.
 *
 * **Coarse-timer detection.** When the timer resolution `R` exceeds the call
 * cost `C` (`C < R / 2`), the probability that any pair crosses a tick
 * boundary is `C / R < 1 / 2`, so most pairs return a delta of zero. The
 * positive deltas that do occur each equal exactly one tick `R`, not the
 * call cost. To prevent catastrophic over-correction, the function returns
 * `0` whenever fewer than half of the pairs produce a positive delta.
 *
 * **Bigint precision.** The subtraction is performed in the provider's
 * native type before conversion to milliseconds (`toMs(b - a)`). For
 * `hrtimeNow`, this preserves precision when absolute timestamps exceed
 * `Number.MAX_SAFE_INTEGER` ns (≈ 104 days uptime).
 *
 * **JIT warmup.** A discarded warmup phase ensures `fn` and `toMs` are
 * JIT-compiled to their steady-state tier before measurements begin.
 * @param provider - the timestamp provider to calibrate
 * @param options - calibration options
 * @returns the estimated overhead in milliseconds, never negative; `0` when
 *   the timer resolution dominates or no positive delta is observed
 */
declare const calibrateTimerOverhead: (provider: TimestampProvider, options?: CalibrateTimerOverheadOptions) => number;
/**
 * Computes the median absolute deviation (MAD) of a sorted sample set.
 *
 * Convenience wrapper that derives the median from the sorted input and
 * forwards to `absoluteDeviationMedian`. Use when only `mad` is
 * required and the cost of a full `computeStatistics` pass is
 * unjustified (e.g. inside {@link classifyTimerSaturation}).
 * @param samples - the sorted sample, length ≥ 1
 * @returns the median absolute deviation
 */
declare const medianAbsoluteDeviation: (samples: SortedSamples) => number;
/**
 * Returns the current timestamp in milliseconds using `performance.now()`.
 * @returns the current timestamp in milliseconds
 */
declare const performanceNow: () => DOMHighResTimeStamp;
/**
 * The performance.now() based TimestampProvider.
 */
declare const performanceNowTimestampProvider: TimestampProvider;
/**
 * Returns the current timestamp in milliseconds using `process.hrtime.bigint()`.
 *
 * Narrows the absolute nanosecond value to a `number`, which loses precision
 * once it exceeds `Number.MAX_SAFE_INTEGER` (~104 days of uptime). For
 * benchmarking prefer `hrtimeNowTimestampProvider`, which keeps the bigint
 * until after the delta is taken.
 * @returns the current timestamp in milliseconds
 */
declare const hrtimeNow: () => number;
/**
 * The hrtime.bigint() based TimestampProvider.
 */
declare const hrtimeNowTimestampProvider: TimestampProvider;
//#endregion
export { Bench, type BenchEvent, type BenchEvents, type BenchEventsWithTask, type BenchLike, type BenchOptions, type CalibrateTimerOverheadOptions, type Concurrency, type ConsoleTableConverter, type EventListener, type EventListenerObject, type Fn, type FnHook, type FnOptions, type FnReturnedObject, type Hook, type HookMode, type JSRuntime, type NowFn, type ResolvedBenchOptions, type Samples, type SortedSamples, type Statistics, Task, type TaskEvents, type TaskResult, type TaskResultAborted, type TaskResultAbortedWithStatistics, type TaskResultCompleted, type TaskResultErrored, type TaskResultNotStarted, type TaskResultRuntimeInfo, type TaskResultStarted, type TaskResultTimestampProviderInfo, type TaskResultWithStatistics, type TimerOverheadEstimatorKind, type TimerSaturationReason, type TimestampFn, type TimestampFns, type TimestampProvider, type TimestampProviderName, type TimestampValue, calibrateTimerOverhead, classifyTimerSaturation, detectTimerSaturation, estimateResolution, formatNumber, hrtimeNow, hrtimeNowTimestampProvider, mToNs, medianAbsoluteDeviation, nToMs, performanceNow as now, performanceNowTimestampProvider };