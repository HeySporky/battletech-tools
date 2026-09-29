# BattleTech Tools

## Purpose

This is a development fork of Jeff's Battletech Tools. This will be used to explore keeping the project going as a community maintained codebase.

Be sure to join our [Discord](https://discord.gg/U539K45v8U) and talk to other developers.

## Development

Want to contribute? The app is a Vite + React + TypeScript PWA. You need **Node.js 26** (22.22+ and 24 also work) and
Git. Everything else is installed by npm into the project folder. The same steps work on Windows, macOS, Linux and
Android.

### 1. Install Node and Git

The repository has `.nvmrc` and `.node-version` files (both `26`), so a Node version manager picks the right version
automatically. [fnm](https://github.com/Schniz/fnm) works on every desktop OS; nvm is fine too.

| Platform | Commands |
| --- | --- |
| Windows (PowerShell) | `winget install Git.Git Schniz.fnm`, add `fnm env --use-on-cd \| Out-String \| Invoke-Expression` to your PowerShell profile, then in the repo: `fnm install` |
| macOS | `brew install git fnm`, add `eval "$(fnm env --use-on-cd)"` to `~/.zshrc`, then in the repo: `fnm install` |
| Linux | `curl -fsSL https://fnm.vercel.app/install \| bash` (or nvm: `nvm install`), then in the repo: `fnm install` |
| Android | Install [Termux](https://f-droid.org/packages/com.termux/) from F-Droid (the Play Store build is outdated), then `pkg upgrade && pkg install nodejs git` |

Without a version manager: install Node 26 from [nodejs.org](https://nodejs.org/) (`winget install OpenJS.NodeJS` /
`brew install node`). Check with `node -v`.

Python is optional; it's only used by the scripts in `command-line-scripts/`.

### 2. Get the code and run it

```sh
git clone https://github.com/HeySporky/battletech-tools.git
cd battletech-tools
npm ci          # exact dependency versions from package-lock.json
npm run dev     # then browse to http://localhost:3000/
```

Use `npm ci`, not `npm install`, unless you are deliberately changing dependencies; it installs exactly what the
lockfile says, so everyone (and CI) runs the same versions. Commit `package-lock.json` whenever you do change them.

To try the app on a phone or tablet, run `npm run dev:host` and open the "Network" URL it prints from a device on the
same Wi-Fi. On Android, `npm run dev` inside Termux serves the app to the phone's own browser.

### 3. Before you open a pull request

```sh
npm run check   # typecheck + unit tests + production build (the same steps CI runs)
npm run lint    # see "Lint" below
```

### npm scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server on <http://localhost:3000/> with hot reload. `npm start` is an alias. |
| `npm run dev:host` | Same, but reachable from other devices on your network (phones, tablets). |
| `npm run build` | Production build into `build/`, with the `/battletech-tools/` base path used on GitHub Pages. |
| `npm run preview` | Serve the finished `build/` locally at <http://localhost:4173/battletech-tools/> to check it before deploying. Run `npm run build` first. |
| `npm run deploy-dev` | Publish `build/` to the `gh-pages` branch of your `origin` remote (your fork's GitHub Pages site). |
| `npm run deploy-prod` | Publish `build/` to the `gh-pages` branch of the production repository. Needs write access to it. |
| `npm run typecheck` | Type check with TypeScript 7 (fast, native compiler). Falls back to TypeScript 6 automatically where TypeScript 7 has no native build (Termux). `TYPECHECK_TS=6` forces TypeScript 6. |
| `npm run typecheck:ts6` | Type check with TypeScript 6 directly (the version ESLint uses). |
| `npm test` | Unit tests (Vitest) in Node. Runs everywhere, including Termux. |
| `npm run test:watch` | Unit tests in watch mode; re-runs as you save. |
| `npm run test:coverage` | Unit tests with a coverage report in `coverage/`. |
| `npm run test:browser` | Component tests (`*.browser.test.tsx`) in real Chromium, Firefox and WebKit. Desktop only. |
| `npm run test:e2e` | Playwright end-to-end tests against a production build, on desktop browsers plus phone and tablet emulation. Desktop only. |
| `npm run check` | `typecheck`, `test` and `build` in one go. |
| `npm run lint` | ESLint over the whole project. |

Pass extra options after `--`, for example `npm test -- --reporter=verbose` or `npm run test:e2e -- --project=webkit`.

### Deploying to GitHub Pages

The deploy scripts publish whatever is already in `build/`; they don't build. Always build first:

```sh
npm run build && npm run deploy-dev
```

`deploy-dev` pushes to the `gh-pages` branch of `origin`. On a fork, turn on Pages once under
**Settings → Pages → Build and deployment → Deploy from a branch → `gh-pages` / root**, and the site appears at
`https://<your-user>.github.io/battletech-tools/`. The production build assumes that `/battletech-tools/` path. A
deployment URL with a different repository name needs `PRODUCTION_BASE` in `vite.config.mts` changed to match.

`deploy-prod` is the same, but targets the production repository, so only maintainers with write access there can run it.

### Tests

- **Unit tests** live next to the code as `*.test.ts` / `*.test.tsx` and run in Node. A component test that needs a
  DOM adds `// @vitest-environment happy-dom` at the top of the file.
- **Browser tests** are `*.browser.test.tsx` and run in real browser engines.
- **End-to-end tests** are in `e2e/`. They build the app, serve it the way GitHub Pages does, and fail if any page
  throws or logs a console error.

The browser and end-to-end tests need Playwright's browsers once per machine (a few hundred MB):

```sh
npx playwright install                  # Chromium, Firefox and WebKit
npx playwright install firefox webkit   # or just some of them
```

If the download is blocked or slow:

- Use an installed Edge or Chrome for the Chromium tests: `PLAYWRIGHT_CHANNEL=msedge npm run test:e2e`
  (PowerShell: `$env:PLAYWRIGHT_CHANNEL="msedge"; npm run test:e2e`).
- Limit browser tests to the engines you have: `VITEST_BROWSERS=chromium npm run test:browser`.
- On a slow connection, raise the download timeout: `PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT=300000 npx playwright install`.

Playwright has no Android browsers, so on Termux use `npm test` and `npm run check`. CI runs the rest.

### Lint

`npm run lint` still reports problems in the existing code. In CI the lint job shows them but doesn't fail the build.
Please don't add new ones; fixing old ones in the files you touch is welcome.

### GitHub Actions workflows

`.github/workflows/ci.yml` (**CI**) runs automatically on every pull request and on every push to `master`. It has
these jobs:

| Job | What it checks | Run it locally with |
| --- | --- | --- |
| `check` | `npm ci`, typecheck, unit tests and build on Ubuntu, Windows and macOS × Node 22, 24 and 26 (9 runs). | `npm run check` |
| `lint` | ESLint. Doesn't block. | `npm run lint` |
| `browser tests` | Component tests in Chromium, Firefox and WebKit. | `npm run test:browser` |
| `e2e` | End-to-end tests on desktop Chromium, Firefox and WebKit plus Android phone, iPhone and iPad emulation. Uploads an HTML report. | `npm run test:e2e` |

- **See results:** open the pull request's **Checks** tab, or the repository's **Actions** tab → **CI**.
- **Failed E2E run:** download the `playwright-report` artifact from the run's summary page, unzip it and open
  `index.html`. It shows each failing step, and a trace when the test was retried.
- **Run it by hand:** **Actions → CI → Run workflow**, pick a branch. Or with the GitHub CLI:
  `gh workflow run ci.yml --ref <branch>` and `gh run watch`.
- **Pull requests from forks:** GitHub holds the workflow until a maintainer clicks **Approve and run** (first-time
  contributors, depending on the repository setting). On your own fork, enable Actions once under the **Actions** tab
  and CI also runs on pushes to your fork's `master`.
- A newer push to the same branch cancels the run still in progress.

### Technology

PWA application using TypeScript and React, built with Vite and tested with Vitest and Playwright.

### Current Contributors

[Spork](https://github.com/HeySporky)

### Previous Contributors

[Jeffrey D. Gordon](https://github.com/jdgwf)

[MoonSword22](https://github.com/MoonSword22), Data Entry and consulting

[cam-smith](https://github.com/cam-smith), fixes for formation bonuses and aero damages
