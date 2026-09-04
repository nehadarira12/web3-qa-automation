import { defineWalletSetup } from '@synthetixio/synpress';
import { MetaMask } from '@synthetixio/synpress/playwright';

const SEED_PHRASE = process.env.METAMASK_SEED_PHRASE;
const PASSWORD = process.env.METAMASK_PASSWORD;

if (!SEED_PHRASE || !PASSWORD) {
  throw new Error(
    'METAMASK_SEED_PHRASE and METAMASK_PASSWORD must be set (see .env.example) before wallet setup can run.',
  );
}

/**
 * Canonical Synpress wallet-setup definition: import the test wallet once
 * and cache the onboarded browser state, keyed by a hash of this file.
 * `npm run wallet:cache` (`synpress wallet-setup`) drives this directly,
 * compiling it with Synpress's own esbuild-based CLI rather than this
 * project's own tsx/ESM pipeline.
 *
 * This suite's Cucumber bridge (`helpers/wallet.helper.ts` +
 * `support/hooks.ts`) does not consume this cache — Cucumber.js has no
 * equivalent to Playwright Test's fixture injection, which is what
 * `metaMaskFixtures(basicSetup)` relies on to load cached wallet state
 * automatically. This file is kept as the standard, documented Synpress
 * artifact: a team migrating this suite onto the native Playwright Test
 * runner can drop it straight into `testWithSynpress(metaMaskFixtures(basicSetup))`
 * and delete the manual per-scenario bootstrap in `support/hooks.ts`.
 */
export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
  const metamask = new MetaMask(context, walletPage, PASSWORD);
  await metamask.importWallet(SEED_PHRASE);
});
