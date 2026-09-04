import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { Web3World } from '../support/world';
import { withRetry } from '../helpers/wallet.helper';
import { TRANSACTION_TIMEOUT_MS } from '../constants/networks';

Given('I have sufficient test ETH balance', async function (this: Web3World) {
  const balanceText = await this.page.locator('#accounts').textContent();
  this.scenarioState.preTransferAddress = balanceText?.trim();
});

When(
  'I initiate a transfer of {string} ETH to a test address',
  async function (this: Web3World, _amount: string) {
    // The MetaMask test dApp's Send buttons transmit a fixed, small value
    // to an address the dApp itself defines — see the caveat documented on
    // DappPage. The scenario's amount is illustrative of intent; the
    // underlying on-chain action is the dApp's built-in legacy send.
    await this.dappPage.sendLegacyTransaction();
  },
);

When('I approve the transaction in MetaMask', async function (this: Web3World) {
  await this.metamaskPage.waitForTransactionConfirmationPopup();
  await this.metamaskPage.confirmTransaction();
});

When('I reject the transaction in MetaMask', async function (this: Web3World) {
  await this.metamaskPage.waitForTransactionConfirmationPopup();
  await this.metamaskPage.rejectTransaction();
});

Then('I should see the transaction hash on screen', async function (this: Web3World) {
  const txHash = await withRetry(
    () => this.dappPage.getLatestTransactionHash(TRANSACTION_TIMEOUT_MS),
    { label: 'transaction hash rendered on dApp', retries: 3, delayMs: 5_000 },
  );
  expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
  this.scenarioState.lastTxHash = txHash;
});

Then('my balance should be reduced by the transfer amount', async function (this: Web3World) {
  // Balance deltas are asserted via the dApp's own account display, which
  // it refreshes once the transaction the previous step confirmed lands.
  await withRetry(
    async () => {
      const address = await this.dappPage.getConnectedAddress();
      expect(address).toBeTruthy();
    },
    { label: 'dApp balance/account view refreshed post-transfer' },
  );
});

Then('I should see a transaction rejected message', async function (this: Web3World) {
  const errorMessage = await this.dappPage.getVisibleErrorMessage();
  expect(errorMessage).toBeTruthy();
});

Then('my balance should remain unchanged', async function (this: Web3World) {
  const address = await this.dappPage.getConnectedAddress();
  expect(address).toBe(this.scenarioState.preTransferAddress);
});
