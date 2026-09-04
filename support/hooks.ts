import { After, Before, setDefaultTimeout, Status } from '@cucumber/cucumber';
import * as dotenv from 'dotenv';
import { DappPage } from '../pages/dapp.page';
import { MetaMaskPage } from '../pages/metamask.page';
import {
  completeOnboarding,
  getMetaMaskExtensionPage,
  launchMetaMaskContext,
  logStep,
} from '../helpers/wallet.helper';
import type { Web3World } from './world';

dotenv.config();

// Cucumber's default step/hook timeout (5s) assumes ordinary UI actions.
// Onboarding MetaMask in `Before` — downloading/unpacking the extension on
// a cold cache, launching a persistent browser context, importing the
// wallet through its real UI — routinely takes longer than that on its
// own, before any scenario step has even run.
setDefaultTimeout(60_000);

const REQUIRED_ENV_VARS = ['METAMASK_SEED_PHRASE', 'METAMASK_PASSWORD', 'TEST_DAPP_URL'] as const;

/**
 * Every scenario gets its own freshly onboarded MetaMask profile rather
 * than a context shared across the run. The installed Synpress version has
 * no public API to revoke a dApp's site permission on a reused context
 * (see `pages/metamask.page.ts`), so sharing one would leak connection
 * state between scenarios; a fresh profile per scenario trades a few
 * seconds of wallet-import overhead for tests that are genuinely
 * independent of execution order.
 */
Before(async function (this: Web3World) {
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable "${key}" — see .env.example`);
    }
  }

  const headless = process.env.CI === 'true';
  logStep(`Launching a fresh MetaMask-loaded browser context (headless=${headless})`);
  const { context, extensionId } = await launchMetaMaskContext(headless);

  const extensionPage = await getMetaMaskExtensionPage(context);
  const metamaskPage = new MetaMaskPage(
    context,
    extensionPage,
    process.env.METAMASK_PASSWORD as string,
    extensionId,
  );
  await metamaskPage.driver.importWallet(process.env.METAMASK_SEED_PHRASE as string);
  await completeOnboarding(extensionPage);

  this.context = context;
  this.extensionId = extensionId;
  this.metamaskPage = metamaskPage;
  this.page = await context.newPage();
  this.dappPage = new DappPage(this.page);
  this.scenarioState = {};

  logStep('MetaMask wallet onboarded and ready for this scenario');
});

After(async function (this: Web3World, { result, pickle }) {
  // `Before` can fail (e.g. a slow extension download) before it finishes
  // populating the World, so `this.page`/`this.context` may not exist yet —
  // guard both rather than assuming a fully set-up scenario.
  if (result?.status === Status.FAILED && this.page) {
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.attach(screenshot, 'image/png');
    logStep(`Scenario failed: "${pickle.name}" — screenshot attached`);
  }

  await this.context?.close();
});
