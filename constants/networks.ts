/**
 * Central registry of network metadata. All chain IDs, RPC URLs, and
 * well-known addresses live here — never hardcode them inline in a test,
 * page object, or step definition.
 */

export interface NetworkConfig {
  /** Human-readable name as MetaMask displays it. */
  name: string;
  /** EIP-155 chain ID. */
  chainId: number;
  /** Chain ID as MetaMask encodes it in RPC payloads (0x-prefixed hex). */
  chainIdHex: string;
  /** Public RPC endpoint used when adding the network to MetaMask. */
  rpcUrl: string;
  /** Block explorer base URL, used to build transaction-hash deep links. */
  blockExplorerUrl: string;
  /** Native currency symbol. */
  currencySymbol: string;
  /** Passed to MetaMask's `switchNetwork(name, isTestnet)` — required to disambiguate its network list. */
  isTestnet: boolean;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  mainnet: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    chainIdHex: '0x1',
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
    blockExplorerUrl: 'https://etherscan.io',
    currencySymbol: 'ETH',
    isTestnet: false,
  },
  sepolia: {
    name: 'Sepolia',
    chainId: 11155111,
    chainIdHex: '0xaa36a7',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    currencySymbol: 'SepoliaETH',
    isTestnet: true,
  },
};

/**
 * The only network this suite is allowed to transact on. Every test and
 * helper must resolve the active network through this constant rather than
 * assuming MetaMask's default — it is what keeps the suite off mainnet.
 */
export const TARGET_NETWORK: NetworkConfig = NETWORKS.sepolia;

/** A network the "wrong network" negative tests deliberately switch to. */
export const UNSUPPORTED_NETWORK: NetworkConfig = NETWORKS.mainnet;

/**
 * A well-known, funded-by-nobody Sepolia address used as a transfer
 * recipient in tests. It is a burn-style address, not a wallet under this
 * project's control — safe to publish, nothing to protect.
 */
export const TEST_RECIPIENT_ADDRESS = '0x000000000000000000000000000000000000dEaD';

export const TRANSACTION_TIMEOUT_MS = 120_000;
export const CONFIRMATION_POLL_INTERVAL_MS = 3_000;
