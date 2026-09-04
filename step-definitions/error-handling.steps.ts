import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { Web3World } from '../support/world';
import { logStep } from '../helpers/wallet.helper';

Given('I have insufficient ETH balance', async function (this: Web3World) {
  // The suite's funded test account intentionally never holds more than
  // dust on Sepolia beyond what wallet-connection/transfer scenarios need,
  // so its balance alone is enough to trigger MetaMask's own
  // insufficient-funds guard when a transfer is attempted — no separate
  // zero-balance account is provisioned.
  logStep('Proceeding with the suite test account, which holds only dust balance');
});

When('I try to transfer more ETH than my balance', async function (this: Web3World) {
  await this.dappPage.sendLegacyTransaction();
});

Then('I should see an insufficient funds error message', async function (this: Web3World) {
  await this.metamaskPage.waitForTransactionConfirmationPopup().catch(() => {
    // MetaMask may reject the request before the confirmation popup even
    // renders when funds clearly can't cover gas — that is also a valid
    // "insufficient funds" signal for this assertion.
  });
  const walletError = await this.metamaskPage.driver.page
    .locator('text=/insufficient funds/i')
    .isVisible()
    .catch(() => false);
  const dappError = await this.dappPage.getVisibleErrorMessage();

  expect(walletError || Boolean(dappError?.toLowerCase().includes('insufficient'))).toBe(true);
});

Then('the transfer should not be initiated', async function (this: Web3World) {
  const txHashVisible = await this.page
    .locator('text=/0x[a-fA-F0-9]{64}/')
    .isVisible()
    .catch(() => false);
  expect(txHashVisible).toBe(false);
});

When('the network connection drops mid-transaction', async function (this: Web3World) {
  logStep('Simulating network disconnection via offline mode');
  await this.context.setOffline(true);
});

Then('I should see a network error message', async function (this: Web3World) {
  const errorMessage = await this.dappPage.getVisibleErrorMessage();
  expect(errorMessage).toBeTruthy();
  await this.context.setOffline(false);
});

Given('my MetaMask session has expired', async function (this: Web3World) {
  // Simulated via locking the wallet — see MetaMaskPage#lockWallet. Reload
  // so the dApp re-evaluates `eth_accounts` on a locked wallet (returns
  // empty) rather than depending on it reacting live to a lock event.
  await this.metamaskPage.lockWallet();
  await this.dappPage.reload();
});

When('I attempt a wallet action requiring authorization', async function (this: Web3World) {
  await this.dappPage.sendLegacyTransaction().catch(() => {
    // Expected: with no active session, the dApp cannot even open a
    // MetaMask confirmation popup — the guard below asserts that state.
  });
});

Then('I should be prompted to reconnect my wallet', async function (this: Web3World) {
  expect(await this.dappPage.isWalletConnected()).toBe(false);
});
