import { NETWORKS, TARGET_NETWORK, type NetworkConfig } from '../constants/networks';
import { logStep, withRetry } from './wallet.helper';
import type { DappPage } from '../pages/dapp.page';

/** Resolves a network by its config key or display name, throwing on an unknown network. */
export function resolveNetwork(nameOrKey: string): NetworkConfig {
  const key = nameOrKey.trim().toLowerCase();
  const byKey = NETWORKS[key];
  if (byKey) return byKey;

  const byName = Object.values(NETWORKS).find((network) => network.name.toLowerCase() === key);
  if (byName) return byName;

  throw new Error(
    `Unknown network "${nameOrKey}". Known networks: ${Object.keys(NETWORKS).join(', ')}`,
  );
}

/** True when the given hex chain ID matches this suite's target network (Sepolia). */
export function isTargetNetwork(chainIdHex: string): boolean {
  return chainIdHex.toLowerCase() === TARGET_NETWORK.chainIdHex.toLowerCase();
}

/**
 * Polls the dApp's own chain-ID display until it reflects the expected
 * network. MetaMask propagates a network switch to the page asynchronously
 * via an `eip1193` event, so the dApp's badge can lag the wallet UI by a
 * beat — asserting immediately after switching is a common source of flake.
 */
export async function waitForDappToReflectNetwork(
  dappPage: DappPage,
  expected: NetworkConfig,
  timeoutMs = 30_000,
): Promise<void> {
  logStep(`Waiting for dApp to reflect network switch to ${expected.name}`);
  await withRetry(
    async () => {
      const chainId = await dappPage.getChainId();
      if (chainId.toLowerCase() !== expected.chainIdHex.toLowerCase()) {
        throw new Error(`dApp still reports chainId ${chainId}, expected ${expected.chainIdHex}`);
      }
    },
    {
      retries: Math.ceil(timeoutMs / 3_000),
      delayMs: 3_000,
      label: `dApp reflects ${expected.name}`,
    },
  );
}
