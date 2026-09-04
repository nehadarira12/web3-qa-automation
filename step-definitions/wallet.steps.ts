import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { Web3World } from '../support/world';
import { UNSUPPORTED_NETWORK, TARGET_NETWORK } from '../constants/networks';
import { resolveNetwork, waitForDappToReflectNetwork } from '../helpers/network.helper';
import { withRetry } from '../helpers/wallet.helper';

Given('I am on the DeFi application', async function (this: Web3World) {
  await this.dappPage.goto(process.env.TEST_DAPP_URL as string);
});

Given('my MetaMask is on Ethereum mainnet', async function (this: Web3World) {
  await this.metamaskPage.switchNetwork(UNSUPPORTED_NETWORK);
});

Given('I have connected my MetaMask wallet', async function (this: Web3World) {
  await this.metamaskPage.switchNetwork(TARGET_NETWORK);
  await this.dappPage.goto(process.env.TEST_DAPP_URL as string);
  await this.dappPage.clickConnect();
  await this.metamaskPage.connectToDapp();
  await withRetry(async () => expect(await this.dappPage.isWalletConnected()).toBe(true), {
    label: 'dApp reflects wallet connection',
  });
});

When('I click the Connect Wallet button', async function (this: Web3World) {
  await this.dappPage.clickConnect();
});

When('I approve the connection in MetaMask', async function (this: Web3World) {
  await this.metamaskPage.connectToDapp();
});

When('I click the Disconnect button', async function (this: Web3World) {
  // The installed Synpress version does not wrap a connected-sites /
  // permissions-revocation action, so "disconnect" is exercised via
  // locking the wallet — see the doc comment on MetaMaskPage#lockWallet.
  await this.metamaskPage.lockWallet();
  await this.dappPage.reload();
});

When('I navigate away and back to the application', async function (this: Web3World) {
  await this.dappPage.reload();
});

When('I unlock my MetaMask wallet', async function (this: Web3World) {
  await this.metamaskPage.unlockWallet();
});

When(
  'I switch MetaMask to the {string} network',
  async function (this: Web3World, networkName: string) {
    const network = resolveNetwork(networkName);
    await this.metamaskPage.switchNetwork(network);
  },
);

When('I add and switch to a new MetaMask account', async function (this: Web3World) {
  this.scenarioState.previousAddress = await this.dappPage.getConnectedAddress();
  const newAccountName = 'Account 2';
  await this.metamaskPage.addNewAccount(newAccountName);
  await this.metamaskPage.switchAccount(newAccountName);
});

Then('I should see my wallet address displayed', async function (this: Web3World) {
  await withRetry(
    async () => {
      const address = await this.dappPage.getConnectedAddress();
      expect(address).toMatch(/^0x[a-fA-F0-9]{4,}/);
    },
    { label: 'wallet address rendered on dApp' },
  );
});

Then('the Connect button should change to Connected', async function (this: Web3World) {
  expect(await this.dappPage.isWalletConnected()).toBe(true);
});

Then('my connection should persist', async function (this: Web3World) {
  expect(await this.dappPage.isWalletConnected()).toBe(true);
});

Then('I should see the Connect Wallet button again', async function (this: Web3World) {
  expect(await this.dappPage.isWalletConnected()).toBe(false);
});

Then('my wallet address should not be visible', async function (this: Web3World) {
  const address = await this.dappPage.getConnectedAddress();
  expect(address).toBe('');
});

Then('I should see a wrong network error message', async function (this: Web3World) {
  const errorMessage = await this.dappPage.getVisibleErrorMessage();
  expect(errorMessage).toBeTruthy();
});

Then('I should be prompted to switch to Sepolia testnet', async function (this: Web3World) {
  const errorMessage = await this.dappPage.getVisibleErrorMessage();
  expect(errorMessage?.toLowerCase()).toContain('sepolia');
});

Then(
  'the network badge should show {string}',
  async function (this: Web3World, networkName: string) {
    const network = resolveNetwork(networkName);
    await waitForDappToReflectNetwork(this.dappPage, network);
  },
);

Then('the displayed wallet address should update', async function (this: Web3World) {
  await withRetry(
    async () => {
      const currentAddress = await this.dappPage.getConnectedAddress();
      expect(currentAddress).not.toBe(this.scenarioState.previousAddress);
      expect(currentAddress).toMatch(/^0x[a-fA-F0-9]{4,}/);
    },
    { label: 'dApp reflects switched account' },
  );
});
