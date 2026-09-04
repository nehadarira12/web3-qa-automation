import type { BrowserContext, Page } from '@playwright/test';
import { MetaMask } from '@synthetixio/synpress/playwright';
import { TARGET_NETWORK, TRANSACTION_TIMEOUT_MS, type NetworkConfig } from '../constants/networks';
import { logStep } from '../helpers/wallet.helper';

/**
 * Wraps Synpress's `MetaMask` extension driver with this suite's logging
 * and network-awareness conventions. Every MetaMask interaction a test
 * performs — approving, rejecting, switching networks — should go through
 * this class rather than reaching into the Synpress API directly, so
 * behavior (logging, timeouts) stays consistent across all step
 * definitions.
 */
export class MetaMaskPage {
  private readonly metamask: MetaMask;

  constructor(context: BrowserContext, extensionPage: Page, password: string, extensionId: string) {
    this.metamask = new MetaMask(context, extensionPage, password, extensionId);
  }

  /** Underlying Synpress driver, for step definitions that need lower-level access. */
  get driver(): MetaMask {
    return this.metamask;
  }

  /**
   * Approves the dApp connection request currently open in the MetaMask
   * popup. `accountNames` selects specific accounts (matched by prefix
   * against MetaMask's account list, e.g. `"Account 2"`); omitted, it
   * confirms with whichever account(s) are selected by default.
   */
  async connectToDapp(accountNames: string[] = []): Promise<void> {
    logStep(
      accountNames.length > 0
        ? `Approving dApp connection for account(s): ${accountNames.join(', ')}`
        : 'Approving dApp connection with the default selected account',
    );
    await this.metamask.connectToDapp(accountNames);
  }

  /** Approves whatever transaction confirmation is currently open. */
  async confirmTransaction(): Promise<void> {
    logStep('Confirming pending transaction in MetaMask');
    await this.metamask.confirmTransaction();
  }

  /** Rejects whatever transaction confirmation is currently open. */
  async rejectTransaction(): Promise<void> {
    logStep('Rejecting pending transaction in MetaMask');
    await this.metamask.rejectTransaction();
  }

  /** Switches the active MetaMask network. The network must already be known to the wallet — see `addNetwork`. */
  async switchNetwork(network: NetworkConfig = TARGET_NETWORK): Promise<void> {
    logStep(`Switching MetaMask network to ${network.name} (chainId ${network.chainId})`);
    await this.metamask.switchNetwork(network.name, network.isTestnet);
  }

  /** Adds a custom network to MetaMask if it is not already configured. */
  async addNetwork(network: NetworkConfig): Promise<void> {
    logStep(`Adding network ${network.name} to MetaMask`);
    await this.metamask.addNetwork({
      name: network.name,
      rpcUrl: network.rpcUrl,
      chainId: network.chainId,
      symbol: network.currencySymbol,
      blockExplorerUrl: network.blockExplorerUrl,
    });
  }

  /** Creates a new named account in the wallet. */
  async addNewAccount(accountName: string): Promise<void> {
    logStep(`Adding new MetaMask account "${accountName}"`);
    await this.metamask.addNewAccount(accountName);
  }

  /** Switches the active account MetaMask exposes to the connected dApp. */
  async switchAccount(accountName: string): Promise<void> {
    logStep(`Switching active MetaMask account to "${accountName}"`);
    await this.metamask.switchAccount(accountName);
  }

  /**
   * Locks the wallet. A locked MetaMask can no longer serve
   * `eth_accounts`/signing requests to any connected dApp until unlocked
   * again — the closest thing to a wallet-initiated "disconnect" the
   * installed Synpress version exposes (it does not wrap a
   * connected-sites/permissions-revocation action), and a realistic stand-in
   * for an expired session.
   */
  async lockWallet(): Promise<void> {
    logStep('Locking MetaMask wallet');
    await this.metamask.lock();
  }

  /** Unlocks the wallet with the password it was constructed with. */
  async unlockWallet(): Promise<void> {
    logStep('Unlocking MetaMask wallet');
    await this.metamask.unlock();
  }

  /**
   * Polls until the pending transaction confirmation popup either appears
   * or the timeout elapses. Blockchain popups can be a beat slower than
   * the dApp's own UI update, so callers should await this before acting
   * on the confirmation.
   */
  async waitForTransactionConfirmationPopup(timeoutMs = TRANSACTION_TIMEOUT_MS): Promise<void> {
    logStep('Waiting for MetaMask transaction confirmation popup');
    await this.metamask.page.waitForSelector('text=Confirm', { timeout: timeoutMs });
  }
}
