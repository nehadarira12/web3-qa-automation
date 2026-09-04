import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Playwright Test config for the `fixtures/web3.fixture.ts` entry point —
 * ad hoc/exploratory specs run via `npx playwright test`, not this
 * project's BDD suite. The BDD suite (features/**) is driven entirely by
 * cucumber-js (see cucumber.js) and does not read this file;
 * MetaMask automation is inherently single-session (one extension, one
 * onboarded wallet), so this config disables parallelism and retries the
 * way the Cucumber profile does, for the same reason.
 */
export default defineConfig({
  testDir: './fixtures',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  timeout: 120_000,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: process.env.TEST_DAPP_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
