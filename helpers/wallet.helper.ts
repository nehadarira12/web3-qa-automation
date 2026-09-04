import { chromium, type BrowserContext, type Page } from '@playwright/test';
import { prepareExtension } from '@synthetixio/synpress-cache';
import { getExtensionId } from '@synthetixio/synpress/playwright';
import path from 'node:path';

/**
 * Structured logger for every MetaMask/wallet interaction a test performs.
 * Cucumber's own report only shows step text, not what happened inside a
 * step, so this is what makes wallet activity visible in CI logs and in
 * the Allure attachment stream — invaluable when a blockchain confirmation
 * silently times out.
 */
export function logStep(message: string): void {
  const timestamp = new Date().toISOString();
  // eslint-disable-next-line no-console -- intentional: this is the suite's wallet-activity log
  console.log(`[wallet] ${timestamp} — ${message}`);
}

export interface RetryOptions {
  retries?: number;
  delayMs?: number;
  label?: string;
}

/**
 * Retries a flaky, network-bound operation with linear backoff. Blockchain
 * confirmations and MetaMask popup timing are inherently non-deterministic
 * (RPC latency, block time variance), so anything that reads on-chain state
 * or waits on a wallet popup should be wrapped here rather than trusted to
 * succeed on the first attempt.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  { retries = 3, delayMs = 2_000, label = 'operation' }: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logStep(`Attempt ${attempt}/${retries} for "${label}" failed: ${(error as Error).message}`);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  throw new Error(`"${label}" failed after ${retries} attempts: ${(lastError as Error)?.message}`);
}

export interface MetaMaskContextHandle {
  context: BrowserContext;
  extensionId: string;
}

/**
 * Launches a fresh persistent Chromium context with the MetaMask extension
 * loaded, using Synpress's extension-download cache under the hood.
 *
 * Synpress ships its MetaMask driver as Playwright Test *fixtures*
 * (`testWithSynpress`/`metaMaskFixtures`), which assume the Playwright Test
 * runner's dependency-injection model — and internally reuse a cached,
 * pre-onboarded browser profile per test via APIs that are implementation
 * details of that fixture, not part of Synpress's stable public surface.
 * Cucumber.js has no equivalent fixture system, so this helper instead
 * composes only the two documented, public building blocks — `@synthetixio
 * /synpress-cache`'s `prepareExtension()` (downloads/caches the MetaMask
 * .zip, returns its unpacked path) and `@synthetixio/synpress/playwright`'s
 * `getExtensionId()` — to launch a real MetaMask-loaded context by hand.
 * `support/hooks.ts` calls this once per scenario and imports the wallet
 * fresh each time (see that file's comment for why: it trades a few
 * seconds of onboarding for guaranteed test isolation, since the installed
 * Synpress version has no public "disconnect dApp" call to reset
 * permissions on a reused context).
 */
export async function launchMetaMaskContext(headless: boolean): Promise<MetaMaskContextHandle> {
  const extensionPath = await prepareExtension();
  const userDataDir = path.join(process.cwd(), '.synpress-user-data', `profile-${Date.now()}`);

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      ...(headless ? ['--headless=new'] : []),
    ],
  });

  const extensionId = await getExtensionId(context, 'MetaMask');

  return { context, extensionId };
}

/**
 * Finds MetaMask's own tab (its onboarding page, freshly after launch) in a
 * context that also has Chromium's default blank tab open.
 *
 * `context.pages()[0]` is NOT reliably the extension's page — Chromium
 * opens its own blank `about:blank` tab alongside the extension's tab, and
 * which one lands at index 0 isn't guaranteed. Grabbing index 0 blindly
 * hands MetaMask's driver a blank page with no wallet UI on it at all, so
 * every subsequent action on it just times out waiting for elements that
 * can never appear — confirmed by inspecting `context.pages()` directly
 * while debugging a stuck onboarding run.
 */
export async function getMetaMaskExtensionPage(
  context: BrowserContext,
  timeoutMs = 15_000,
): Promise<Page> {
  const isExtensionPage = (page: Page) => page.url().startsWith('chrome-extension://');

  const existing = context.pages().find(isExtensionPage);
  if (existing) return existing;

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const newPage = await context
      .waitForEvent('page', { timeout: Math.max(deadline - Date.now(), 0) })
      .catch(() => null);
    if (newPage && isExtensionPage(newPage)) return newPage;
    const found = context.pages().find(isExtensionPage);
    if (found) return found;
  }

  throw new Error(
    `Timed out after ${timeoutMs}ms waiting for MetaMask's extension page to open. ` +
      `Open pages: ${context
        .pages()
        .map((p) => p.url())
        .join(', ')}`,
  );
}

/**
 * Clicks through MetaMask's final "Wallet ready → Open wallet" screen,
 * which the installed Synpress version's own `importWallet()` action stops
 * one step short of (confirmed by reading its source: it ends at the
 * MetaMetrics opt-out click and never reaches this button). Skipping it
 * leaves the extension in a transitional onboarding state rather than its
 * normal ready-for-use state — confirmed by driving the flow directly and
 * inspecting the resulting page: a subsequent dApp connection request
 * doesn't open the expected approval popup at all, it re-surfaces
 * onboarding screens (an unlock prompt that leads right back to this same
 * "Open wallet" screen) instead. Call this immediately after
 * `metamask.importWallet(...)`, before any dApp interaction.
 */
export async function completeOnboarding(extensionPage: Page, timeoutMs = 10_000): Promise<void> {
  const openWalletButton = extensionPage.getByTestId('onboarding-complete-done');
  await openWalletButton.waitFor({ state: 'visible', timeout: timeoutMs });
  await openWalletButton.click();
}
