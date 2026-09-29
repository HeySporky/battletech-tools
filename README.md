# BattleTech Tools

## Licensing & Intellectual Property

### Software License and Purpose
This project is a community-maintained fork of **Jeff's BattleTech Tools**. The original repository contained an unconfigured MIT License template (`[year] [fullname]`) alongside codebase references to copyleft governance. 

To honor Jeff's intent, resolve this ambiguity, and ensure these tools remain permanently free and open-source for the tabletop community, this project is formally distributed under the **GNU General Public License v3** (see `LICENSE`). Historical files are preserved in `LICENSE-MIT`.

### BattleTech Data Disclaimer
This software functions strictly as a data-transformation utility to assist players during gameplay. 

**Important:** Any BattleTech unit names, statistics, lore, or imagery processed or displayed by these tools are the exclusive intellectual property of **Catalyst Game Labs, Topps**, and their respective rights holders. This proprietary game data is completely non-commercial, is included without any intent to challenge official copyrights or trademarks, and is **explicitly excluded** from any open-source software licensing (GPLv3) granted herein.

## Development

Want to contribute? The toolchain is Node + npm only (Vite, TypeScript, Sass are all npm packages), so the
same steps work on Windows, macOS, Linux and Android.

**Node:** 26 is the baseline (`.nvmrc` / `.node-version`); 22.22+ and 24 also work. Use a version manager so the
repo's pin is picked up automatically.

### 1. Install Node and Git

| Platform | Commands |
|---|---|
| Windows | `winget install Git.Git Schniz.fnm` then `fnm install` and `fnm use` in the repo (nvm-windows or Volta also work) |
| macOS | `brew install git fnm` then `fnm install` and `fnm use` (or `nvm install`) |
| Linux | `curl -fsSL https://fnm.vercel.app/install \| bash` then `fnm install` and `fnm use` (or `nvm install`) |
| Android | Install [Termux from F-Droid](https://f-droid.org/packages/com.termux/) (not the Play Store build), then `pkg install nodejs git` |

### 2. Get the code and run it

```sh
git clone https://github.com/HeySporky/battletech-tools.git
cd battletech-tools
npm ci            # exact versions from package-lock.json
npm run dev       # http://localhost:3000/
```

`npm run start` is an alias for `npm run dev`. To try it on a phone or tablet on the same network, run
`npm run dev:host` and open the "Network" URL it prints (on Termux this is also how you view it in the
phone's browser).

### 3. Before you open a pull request

```sh
npm run check     # typecheck + unit tests + production build (what CI requires)
npm run lint      # informational until the backlog in TODO.md is cleared
```

| Script | What it does |
|---|---|
| `npm run build` / `npm run preview` | Production build into `build/`, and serve it locally |
| `npm run typecheck` | TypeScript 7 (native) where available, TypeScript 6 on Android; `npm run typecheck:ts6` forces 6 |
| `npm test` | Vitest unit tests in Node (works everywhere, including Termux) |
| `npm run test:watch` / `npm run test:coverage` | Watch mode / coverage report in `coverage/` |
| `npm run test:browser` | Vitest browser mode in real Chromium, Firefox and WebKit |
| `npm run test:e2e` | Playwright smoke tests against the production build (desktop, phone and tablet emulation) |

### Testing

- Unit tests live next to the code as `*.test.ts(x)`. Component tests add `// @vitest-environment happy-dom`
  as their first line.
- Browser-mode tests are `*.browser.test.ts(x)`; end-to-end tests are in `e2e/`.
- Browser and E2E tests need Playwright's browsers once: `npx playwright install`
  (Linux: `npx playwright install --with-deps`). They cannot run on Android, where Playwright has no browsers;
  `npm test` covers the unit suite there.
- If the browser download is blocked, use an installed Edge or Chrome for the Chromium-based projects:
  `PLAYWRIGHT_CHANNEL=msedge npm run test:e2e -- --project=chromium`, or
  `VITEST_BROWSERS=chromium PLAYWRIGHT_CHANNEL=chrome npm run test:browser`.
  (PowerShell: `$env:PLAYWRIGHT_CHANNEL="msedge"; npm run test:e2e -- --project=chromium`.)

CI (`.github/workflows/ci.yml`) runs `check` on Windows, macOS and Linux with Node 22, 24 and 26, plus the
browser and E2E suites, on every pull request.

Python is used by a few optional command-line data tools, not by the app.

Be sure to join our [Discord](https://discord.gg/U539K45v8U) and talk to other developers:


### Technology

PWA built with TypeScript, React 19 and Vite; tested with Vitest and Playwright.


### Current Contributors

[Spork](https://github.com/HeySporky)

[NGCFells](https://github.com/NGCFells)


### Previous Contributors

[Jeffrey D. Gordon](https://github.com/jdgwf)

[MoonSword22](https://github.com/MoonSword22), Data Entry and consulting

[cam-smith](https://github.com/cam-smith), fixes for formation bonuses and aero damages
