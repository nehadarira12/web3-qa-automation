import { test as base } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import * as dotenv from 'dotenv';
import { DappPage } from '../pages/dapp.page';
import { MetaMaskPage } from '../pages/metamask.page';
import {
  completeOnboarding,
  getMetaMaskExtensionPage,
  launchMetaMaskContext,
  logStep,
} from '../helpers/wallet.helper';

dotenv.config();

/**
 * Playwright Test fixture that mirrors the MetaMask bootstrap
 * `support/hooks.ts` performs for the Cucumber suite, built on the same
 * `launchMetaMaskContext` helper so the two entry points never drift.
 *
 * The BDD suite (`features/**`, driven by cucumber-js) is this project's
 * primary surface and does not use this fixture — Cucumber has no
 * fixture-injection mechanism to plug it into. It exists for ad hoc or
 * exploratory specs run directly through the Playwright Test runner
 * (`npx playwright test`), e.g. while triaging a MetaMask popup change
 * without spinning up the full BDD harness:
 *
 *   import { test, expect } from '../fixtures/web3.fixture';
 *
 *   test('wallet connects to the dApp', async ({ dappPage, metamaskPage }) => {
 *     await dappPage.goto(process.env.TEST_DAPP_URL!);
 *     await dappPage.clickConnect();
 *     await metamaskPage.connectToDapp();
 *     expect(await dappPage.isWalletConnected()).toBe(true);
 *   });
 */
interface Web3Fixtures {
  metamaskContext: { context: BrowserContext; extensionId: string };
  context: BrowserContext;
  extensionId: string;
  metamaskPage: MetaMaskPage;
  dappPage: DappPage;
  dappTab: Page;
}

export const test = base.extend<Web3Fixtures>({
  metamaskContext: async ({}, use) => {
    const headless = process.env.CI === 'true';
    const handle = await launchMetaMaskContext(headless);
    await use(handle);
    await handle.context.close();
  },

  // Split into two fixtures so consumers can depend on just the piece they
  // need, but both are derived from the single `metamaskContext` launch
  // above — never launched independently, which would open two unrelated
  // browser contexts.
  context: async ({ metamaskContext }, use) => {
    await use(metamaskContext.context);
  },

  extensionId: async ({ metamaskContext }, use) => {
    await use(metamaskContext.extensionId);
  },

  metamaskPage: async ({ context, extensionId }, use) => {
    const extensionPage = await getMetaMaskExtensionPage(context);
    const password = process.env.METAMASK_PASSWORD as string;
    const seedPhrase = process.env.METAMASK_SEED_PHRASE as string;

    const metamaskPage = new MetaMaskPage(context, extensionPage, password, extensionId);
    logStep('Onboarding MetaMask wallet for Playwright-native fixture consumer');
    await metamaskPage.driver.importWallet(seedPhrase);
    await completeOnboarding(extensionPage);

    await use(metamaskPage);
  },

  dappTab: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  },

  dappPage: async ({ dappTab }, use) => {
    await use(new DappPage(dappTab));
  },
});

export { expect } from '@playwright/test';
