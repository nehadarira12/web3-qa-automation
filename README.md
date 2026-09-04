# Web3 QA Automation Suite

[![Web3 QA Tests](https://github.com/YOUR_GITHUB_USERNAME/web3-qa-automation/actions/workflows/web3-tests.yml/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/web3-qa-automation/actions/workflows/web3-tests.yml)

A BDD-driven QA automation framework for testing dApp ↔ MetaMask interactions: wallet connection, network switching, token transfers, and error handling. Built with **Playwright**, **Synpress**, **Cucumber.js**, and **TypeScript**, targeting MetaMask's own [test dApp](https://metamask.github.io/test-dapp/) on the **Sepolia testnet**.

> Replace `YOUR_GITHUB_USERNAME` above with this repo's actual owner/name once pushed, so the badge resolves.

> **Status:** the framework, its 19 scenarios, config, and wallet onboarding are all verified working against the real MetaMask extension. End-to-end runs are currently blocked past the "approve dApp connection" step by an **open, unresolved bug in Synpress 4.1.2 itself** (reproduces through Synpress's own CLI, not just this project's code) — see [Known limitations](#known-limitations--before-you-run-this-for-real) for the full root-cause writeup and the upstream issue link.

## What this suite tests

| Area                           | Feature files                                         | Coverage                                                                                                                |
| ------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Wallet connection              | `features/wallet/wallet-connection.feature`           | Connect flow, address display, persistence across navigation, multi-account switching, wrong-network warning on connect |
| Wallet disconnection           | `features/wallet/wallet-disconnection.feature`        | Disconnect flow, reconnect after disconnect                                                                             |
| Network switching              | `features/wallet/network-switching.feature`           | Mainnet ↔ Sepolia switching, network badge updates, wrong-network detection                                             |
| Token transfer                 | `features/transactions/token-transfer.feature`        | Fixed-value transaction send, on-screen tx hash, balance refresh                                                        |
| Transaction rejection          | `features/transactions/transaction-rejection.feature` | Graceful handling of a rejected transaction, retry after rejection                                                      |
| Insufficient funds             | `features/error-handling/insufficient-funds.feature`  | Insufficient-funds error surfacing, session usability afterwards                                                        |
| Wrong network / session errors | `features/error-handling/wrong-network.feature`       | Wrong-network warning, mid-transaction disconnect, expired-session reconnect prompt                                     |

Every scenario is tagged by severity (`@critical`, `@high`, `@medium`) so CI or a local run can target a subset — see [Running tests locally](#running-tests-locally).

## Architecture

```
                     ┌─────────────────────────┐
                     │      .feature files      │  Gherkin scenarios (BDD spec)
                     └────────────┬─────────────┘
                                  │ parsed by
                     ┌────────────▼─────────────┐
                     │   step-definitions/*.ts   │  Given/When/Then glue
                     └────────────┬─────────────┘
                                  │ drives
             ┌────────────────────┼────────────────────┐
             ▼                                          ▼
   ┌──────────────────┐                       ┌──────────────────┐
   │ pages/dapp.page   │                       │ pages/metamask.   │
   │ .ts               │                       │ page.ts            │
   │ (test-dapp UI)    │                       │ (Synpress wrapper) │
   └────────┬──────────┘                       └─────────┬──────────┘
            │                                             │
            └───────────────────┬─────────────────────────┘
                                 ▼
                    ┌────────────────────────┐
                    │  support/world.ts +      │  Cucumber World: carries
                    │  support/hooks.ts         │  the live browser context,
                    └────────────┬─────────────┘  page objects, scenario state
                                 │ built on
                    ┌────────────▼─────────────┐
                    │  helpers/wallet.helper.ts │  MetaMask context bootstrap,
                    │  helpers/network.helper.ts│  retry/logging, network utils
                    └────────────┬─────────────┘
                                 ▼
                    ┌────────────────────────┐
                    │ constants/networks.ts    │  Chain IDs, RPC URLs — the
                    └────────────────────────┘  only place network data lives
```

`fixtures/web3.fixture.ts` is a parallel, Playwright-Test-native entry point (see the file's own doc comment) for ad hoc specs run outside Cucumber — it is not part of the BDD suite's execution path.

## Prerequisites

- **Node.js** 18.19+ (20.x recommended — matches CI; the project runs as native ESM and needs Node's `module.register()` support for the TypeScript loader)
- **MetaMask** familiarity (this suite drives the actual extension, headlessly in CI)
- A **fresh, disposable test wallet** — never a real one (see [Setup](#setup))
- **Sepolia testnet ETH** in that test wallet (see [below](#getting-free-sepolia-testnet-eth))

## Setup

1. **Install dependencies**

   ```bash
   npm install
   npx playwright install --with-deps chromium
   ```

2. **Create a fresh test wallet.** Open MetaMask, create a brand-new wallet dedicated to this suite (never reuse a wallet holding real funds), and note its seed phrase and unlock password.

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Fill in `.env`:

   | Variable               | Description                                            |
   | ---------------------- | ------------------------------------------------------ |
   | `METAMASK_SEED_PHRASE` | Seed phrase for the disposable test wallet from step 2 |
   | `METAMASK_PASSWORD`    | Password used to unlock that wallet                    |
   | `TEST_DAPP_URL`        | Defaults to `https://metamask.github.io/test-dapp/`    |
   | `NETWORK`              | `sepolia` — the only network this suite runs against   |

   `.env` is git-ignored — it is never committed.

4. **Fund the test wallet** with Sepolia ETH — see next section.

### Getting free Sepolia testnet ETH

Any of these public faucets will fund a Sepolia address for free:

- [Google Cloud Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
- [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

Paste your test wallet's address, wait a few minutes for the transaction to land, and confirm the balance in MetaMask (network switched to Sepolia).

## Running tests locally

```bash
# Full suite
npm test

# Only @critical-tagged scenarios
npm run test:critical

# Only @critical or @high
npx cross-env NODE_OPTIONS=--import=tsx/esm cucumber-js --tags "@critical or @high"

# A single feature area
npm run test:wallet
npm run test:transactions
npm run test:error-handling
```

Each scenario onboards its own fresh MetaMask profile in `support/hooks.ts`'s `Before` hook — no separate caching step is required before running tests. `npm run wallet:cache` (`synpress wallet-setup`) is a standalone, opt-in script that pre-caches an onboarded profile via the standard Synpress artifact (`wallet-setup/metamask.setup.ts`); it's for a future migration onto native Playwright Test fixtures (see [Known limitations](#known-limitations--before-you-run-this-for-real)), not part of this suite's own run path.

### Viewing the Allure report locally

```bash
npm run report:generate
npm run report:open
```

## Running tests in CI

[`​.github/workflows/web3-tests.yml`](.github/workflows/web3-tests.yml) runs the suite on every push and pull request to `main` (plus manual `workflow_dispatch`):

1. Installs dependencies and Chromium via Playwright.
2. Runs the full Cucumber/Synpress suite headlessly, against **Sepolia only**.
3. Generates an Allure report and uploads it — along with raw Allure results and (on failure) Playwright traces — as workflow artifacts.

**Required GitHub Secrets** (Settings → Secrets and variables → Actions):

| Secret                 | Purpose                                      |
| ---------------------- | -------------------------------------------- |
| `METAMASK_SEED_PHRASE` | Seed phrase for the CI-dedicated test wallet |
| `METAMASK_PASSWORD`    | Password for that wallet                     |

Optionally set the repository variable `TEST_DAPP_URL` to override the default test dApp URL. Never store a real, mainnet-funded seed phrase in these secrets — provision a wallet used exclusively by CI.

### Allure report (example)

After a CI run, download the `allure-report` artifact from the workflow summary and open `index.html` locally, or serve it with `npx allure open ./allure-report`.

> TODO: add a screenshot of the generated Allure report here (`docs/allure-report-example.png`) once a full CI run has produced one — omitted for now rather than shipping a broken image link.

## Senior QA engineering practices applied

- **Independent tests** — every scenario gets its own freshly onboarded MetaMask browser profile in `support/hooks.ts`'s `Before` hook (not a context shared across the run), so no scenario can leak connection state into the next; none depend on execution order.
- **Strict, resilient selectors** — `pages/dapp.page.ts` uses the test dApp's real element IDs rather than fragile XPath; `constants/networks.ts` centralizes every chain ID and address so nothing is hardcoded inline.
- **Retry logic for flaky blockchain ops** — `helpers/wallet.helper.ts#withRetry` wraps balance/network/tx-hash assertions that depend on RPC propagation timing.
- **Explicit confirmation waits** — `MetaMaskPage#waitForTransactionConfirmationPopup` and `network.helper.ts#waitForDappToReflectNetwork` poll rather than assert immediately after an action.
- **Structured wallet-activity logging** — every MetaMask interaction logs through `helpers/wallet.helper.ts#logStep`, visible in CI output and attached to failed-scenario Allure results as a screenshot.
- **Severity tagging** — `@critical` / `@high` / `@medium` on every scenario, filterable via `cucumber-js --tags`.
- **Negative coverage alongside every positive flow** — e.g. `transaction-rejection.feature` next to `token-transfer.feature`, `wrong-network.feature` next to the happy-path connection scenario.
- **Lint/format/pre-commit gates** — ESLint (flat config) + Prettier, enforced on staged files via Husky + lint-staged.

## Known limitations / before you run this for real

- `pages/dapp.page.ts`'s selectors are taken from the test dApp's public markup; reconcile against the live DOM if MetaMask ships a structural change before your first run.
- The test dApp's own "Send Transaction" buttons transmit a small, fixed value to an address the dApp defines — they don't expose a free-form amount/recipient form. Scenarios describing a specific transfer amount exercise that same fixed-value flow; see the doc comment on `DappPage` for the full rationale.
- The installed Synpress version's Playwright driver has no public "disconnect dApp"/permissions-revocation call, so `MetaMaskPage#lockWallet` (locking the wallet) stands in for "disconnect" wherever a scenario needs it — see that method's doc comment. It's a realistic, externally-observable stand-in (a locked wallet can't serve a connected dApp's requests either), not the literal MetaMask "Connected sites → Disconnect" click.
- Cucumber.js has no equivalent to Playwright Test's fixture-injection system, so this suite's MetaMask bootstrap (`helpers/wallet.helper.ts#launchMetaMaskContext` + `support/hooks.ts`) manually reproduces what Synpress's `testWithSynpress`/`metaMaskFixtures` do automatically for pure-Playwright-Test suites. `wallet-setup/metamask.setup.ts` still exists as the standard Synpress artifact, documented for a team that later migrates onto the native Playwright Test runner via `fixtures/web3.fixture.ts`.
- `@playwright/test` is pinned to the exact version (`1.48.2`) that this Synpress release's toolchain expects — bumping it introduces a second, incompatible copy of `playwright-core` in `node_modules` (confirmed while building this suite: it breaks TypeScript's view of `BrowserContext`/`Page` across the two copies). Move it only in lockstep with a Synpress upgrade.
- **Open upstream issue — MetaMask connection-approval popup:** in a real headed run, wallet import and onboarding complete successfully (fixed during development: `helpers/wallet.helper.ts#getMetaMaskExtensionPage` and `#completeOnboarding` work around two real gaps in the installed Synpress version — see their doc comments), the dApp's Connect button is clicked, and MetaMask's real `notification.html` connection-approval popup does open — but the wallet's unlocked session doesn't appear to carry over into that new popup, which then bounces to an unlock screen before Synpress's own `getNotificationPageAndWaitForLoad()` can attach to it. This was root-caused, not just observed: it reproduces identically through Synpress's own official `synpress wallet-setup` CLI (not this project's code), and matches an **open, unresolved bug on Synpress's own repository — [synpress-io/synpress#1307](https://github.com/synpress-io/synpress/issues/1307)** — filed against the same version (4.1.2) with the same error message and the same "state doesn't get remembered across tabs" symptom, with no fix or workaround posted upstream as of this writing. A "does it resolve itself on retry" hypothesis was tested and ruled out (multiple back-to-back connect attempts hit the identical wall). The rest of the suite — feature parsing, step wiring, config, wallet onboarding itself, lint/typecheck — is verified working against the real extension.

## Project structure

```
web3-qa-automation/
├── features/                   # Gherkin scenarios
│   ├── wallet/
│   ├── transactions/
│   └── error-handling/
├── step-definitions/            # Given/When/Then glue
├── pages/                       # Page Object Model
├── fixtures/                    # Playwright-Test-native fixture (non-BDD entry point)
├── helpers/                     # Retry/logging/network utilities
├── constants/                   # Network IDs, addresses, timeouts
├── support/                     # Cucumber World + hooks
├── wallet-setup/                # Synpress defineWalletSetup artifact
├── .github/workflows/           # CI
├── .env.example
├── playwright.config.ts
├── cucumber.js                  # Run configuration (plain ESM JS — see its own comment for why)
└── package.json
```
