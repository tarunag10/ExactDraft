import { defineChain, type Chain } from "viem";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
  blockExplorers: { default: { name: "MonadVision", url: "https://testnet.monadvision.com" } },
  testnet: true,
});

export const botTestnet = defineChain({
  id: 968,
  name: "BOT Chain Testnet",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.bohr.life"] } },
  blockExplorers: { default: { name: "BOTScan", url: "https://scan.bohr.life" } },
  testnet: true,
});

export const supportedTestnets = [monadTestnet, botTestnet] as const;
export type SupportedChainId = (typeof supportedTestnets)[number]["id"];

export type NetworkConfig = {
  chain: Chain;
  explorerUrl: string;
  slug: "monad" | "bot";
  label: string;
  contractAddress: `0x${string}` | undefined;
  contractEnvName: string;
};

export const networkConfigs: Record<SupportedChainId, NetworkConfig> = {
  [monadTestnet.id]: {
    chain: monadTestnet,
    explorerUrl: monadTestnet.blockExplorers.default.url,
    slug: "monad",
    label: "Monad testnet",
    contractAddress: process.env.NEXT_PUBLIC_EXACTDRAFT_CONTRACT_ADDRESS as `0x${string}` | undefined,
    contractEnvName: "NEXT_PUBLIC_EXACTDRAFT_CONTRACT_ADDRESS",
  },
  [botTestnet.id]: {
    chain: botTestnet,
    explorerUrl: botTestnet.blockExplorers.default.url,
    slug: "bot",
    label: "BOT Chain testnet",
    contractAddress: process.env.NEXT_PUBLIC_BOT_EXACTDRAFT_CONTRACT_ADDRESS as `0x${string}` | undefined,
    contractEnvName: "NEXT_PUBLIC_BOT_EXACTDRAFT_CONTRACT_ADDRESS",
  },
};

export function getNetworkConfig(chainId: number): NetworkConfig | undefined {
  return networkConfigs[chainId as SupportedChainId];
}

export function getNetworkBySlug(slug: string): NetworkConfig | undefined {
  return Object.values(networkConfigs).find((network) => network.slug === slug);
}

export function explorerTxUrl(hash: string, chainId: number = monadTestnet.id): string | undefined {
  const network = getNetworkConfig(chainId);
  return network ? `${network.explorerUrl}/tx/${hash}` : undefined;
}

export function explorerAddressUrl(address: string, chainId: number = monadTestnet.id): string | undefined {
  const network = getNetworkConfig(chainId);
  return network ? `${network.explorerUrl}/address/${address}` : undefined;
}
