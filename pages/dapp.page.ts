import type { Locator, Page } from '@playwright/test';
import { logStep } from '../helpers/wallet.helper';

/**
 * Page object for MetaMask's own test dApp (https://metamask.github.io/test-dapp/,
 * source at github.com/MetaMask/test-dapp). It predates the `data-testid`
 * convention, so element IDs are the strictest selectors this page offers —
 * these are taken from the shipped markup, but the dApp is community
 * maintained, so reconcile against the live DOM if a selector starts
 * failing before assuming the test itself is wrong.
 *
 * The dApp's "Send Transaction" actions do not accept an arbitrary amount
 * or recipient through the UI — they send a small, fixed-value transaction
 * to an address the dApp's own script defines. Scenarios in this suite that
 * describe "transferring 0.001 ETH to a test address" exercise that same
 * fixed-value flow rather than a free-form transfer form, which the real
 * dApp does not expose.
 */
export class DappPage {
  private readonly connectButton: Locator;
  private readonly accountsField: Locator;
  private readonly chainIdField: Locator;
  private readonly networkField: Locator;
  private readonly sendLegacyTransactionButton: Locator;
  private readonly sendEip1559TransactionButton: Locator;
  private readonly switchChainButton: Locator;
  private readonly addChainButton: Locator;

  constructor(private readonly page: Page) {
    this.connectButton = page.locator('#connectButton');
    this.accountsField = page.locator('#accounts');
    this.chainIdField = page.locator('#chainId');
    this.networkField = page.locator('#network');
    this.sendLegacyTransactionButton = page.locator('#sendButton');
    this.sendEip1559TransactionButton = page.locator('#sendEIP1559Button');
    this.switchChainButton = page.locator('#switchEthereumChain');
    this.addChainButton = page.locator('#addEthereumChain');
  }

  /** Navigates to the dApp under test, per `TEST_DAPP_URL`. */
  async goto(dappUrl: string): Promise<void> {
    logStep(`Navigating to dApp: ${dappUrl}`);
    await this.page.goto(dappUrl, { waitUntil: 'domcontentloaded' });
  }

  /** Clicks "Connect" to open MetaMask's connection request popup. */
  async clickConnect(): Promise<void> {
    logStep('Clicking Connect Wallet button on dApp');
    await this.connectButton.click();
  }

  /** True once the dApp shows a connected account instead of the Connect prompt. */
  async isWalletConnected(): Promise<boolean> {
    const accountsText = await this.accountsField.textContent();
    return Boolean(accountsText && accountsText.trim().length > 0);
  }

  /** Reads the account address the dApp currently sees as connected. */
  async getConnectedAddress(): Promise<string> {
    return (await this.accountsField.textContent())?.trim() ?? '';
  }

  /** Reads the chain ID (hex) the dApp currently observes from the wallet. */
  async getChainId(): Promise<string> {
    return (await this.chainIdField.textContent())?.trim() ?? '';
  }

  /** Reads the human-readable network name badge, when the dApp renders one. */
  async getNetworkName(): Promise<string> {
    return (await this.networkField.textContent())?.trim() ?? '';
  }

  /** Reloads the current page, used to assert connection persistence across navigation. */
  async reload(): Promise<void> {
    logStep('Reloading dApp page');
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }

  /** Triggers the dApp's fixed-value legacy transaction flow, opening the MetaMask confirmation popup. */
  async sendLegacyTransaction(): Promise<void> {
    logStep('Triggering legacy transaction from dApp');
    await this.sendLegacyTransactionButton.click();
  }

  /** Triggers the dApp's fixed-value EIP-1559 transaction flow, opening the MetaMask confirmation popup. */
  async sendEip1559Transaction(): Promise<void> {
    logStep('Triggering EIP-1559 transaction from dApp');
    await this.sendEip1559TransactionButton.click();
  }

  /** Requests MetaMask switch to the given chain via `wallet_switchEthereumChain`. */
  async requestSwitchChain(): Promise<void> {
    logStep('Requesting wallet_switchEthereumChain from dApp');
    await this.switchChainButton.click();
  }

  /** Requests MetaMask add a new chain via `wallet_addEthereumChain`. */
  async requestAddChain(): Promise<void> {
    logStep('Requesting wallet_addEthereumChain from dApp');
    await this.addChainButton.click();
  }

  /**
   * Waits for and reads the transaction hash the dApp prints after a send
   * flow is confirmed on-chain. The dApp appends results to a status log
   * region rather than a single fixed element, so this matches the most
   * recent line resembling a tx hash.
   */
  async getLatestTransactionHash(timeoutMs = 60_000): Promise<string> {
    const txHashLocator = this.page.locator('text=/0x[a-fA-F0-9]{64}/').last();
    await txHashLocator.waitFor({ state: 'visible', timeout: timeoutMs });
    const text = await txHashLocator.textContent();
    const match = text?.match(/0x[a-fA-F0-9]{64}/);
    if (!match) {
      throw new Error('Expected a transaction hash to be visible on the dApp, but none was found');
    }
    return match[0];
  }

  /** Surfaces any dApp-rendered error/warning banner text (e.g. wrong network, rejected tx). */
  async getVisibleErrorMessage(): Promise<string | null> {
    const errorBanner = this.page.locator('[role="alert"], .error, .alert-danger').first();
    if (await errorBanner.isVisible().catch(() => false)) {
      return (await errorBanner.textContent())?.trim() ?? null;
    }
    return null;
  }
}
