import { setWorldConstructor, World, type IWorldOptions } from '@cucumber/cucumber';
import type { BrowserContext, Page } from '@playwright/test';
import { DappPage } from '../pages/dapp.page';
import { MetaMaskPage } from '../pages/metamask.page';

export interface Web3WorldParameters {
  network: string;
}

/**
 * Custom Cucumber World shared by every step definition in a scenario. It
 * carries the live Playwright/MetaMask handles that `support/hooks.ts`
 * wires up in the `Before` hook, plus small pieces of scenario-local state
 * (e.g. a pre-transfer balance) that steps need to pass to later steps.
 */
export class Web3World extends World<Web3WorldParameters> {
  /** Persistent browser context shared with the loaded MetaMask extension. */
  context!: BrowserContext;
  /** The dApp's own tab. */
  page!: Page;
  /** MetaMask's extension ID for the current context, e.g. for opening its popup directly. */
  extensionId!: string;

  dappPage!: DappPage;
  metamaskPage!: MetaMaskPage;

  /** Scratch space for cross-step state within a single scenario (e.g. balances captured before a transfer). */
  scenarioState: Record<string, unknown> = {};

  constructor(options: IWorldOptions<Web3WorldParameters>) {
    super(options);
  }
}

setWorldConstructor(Web3World);
